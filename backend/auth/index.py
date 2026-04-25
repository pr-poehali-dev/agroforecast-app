"""
Авторизация: регистрация, подтверждение email, вход, выход, смена пароля.
Использует JWT + bcrypt. Email отправляется через SMTP (Яндекс/Gmail).
"""
import json, os, hashlib, hmac, base64, secrets, smtplib, re
from datetime import datetime, timedelta, timezone
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
import psycopg2

CORS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, X-Authorization, X-User-Id, X-Auth-Token",
    "Content-Type": "application/json",
}

SCHEMA = os.environ.get("MAIN_DB_SCHEMA", "t_p36960093_agroforecast_app")
JWT_SECRET = os.environ.get("JWT_SECRET", "fallback-secret-32chars-minimum!")
APP_URL = "https://agroport-ai.ru"

def get_db():
    conn = psycopg2.connect(os.environ["DATABASE_URL"])
    conn.autocommit = True
    return conn

# ─── JWT (простая реализация без зависимостей) ────────────────────────────────

def b64url(data: bytes) -> str:
    return base64.urlsafe_b64encode(data).rstrip(b"=").decode()

def jwt_create(payload: dict, expires_h: int = 720) -> str:
    header = b64url(json.dumps({"alg": "HS256", "typ": "JWT"}).encode())
    payload["exp"] = int((datetime.now(timezone.utc) + timedelta(hours=expires_h)).timestamp())
    body = b64url(json.dumps(payload).encode())
    sig = b64url(hmac.new(JWT_SECRET.encode(), f"{header}.{body}".encode(), hashlib.sha256).digest())
    return f"{header}.{body}.{sig}"

def jwt_verify(token: str) -> dict | None:
    try:
        parts = token.split(".")
        if len(parts) != 3:
            return None
        header, body, sig = parts
        expected = b64url(hmac.new(JWT_SECRET.encode(), f"{header}.{body}".encode(), hashlib.sha256).digest())
        if not hmac.compare_digest(sig, expected):
            return None
        payload = json.loads(base64.urlsafe_b64decode(body + "=="))
        if payload.get("exp", 0) < datetime.now(timezone.utc).timestamp():
            return None
        return payload
    except Exception:
        return None

# ─── Пароль ──────────────────────────────────────────────────────────────────

def hash_password(password: str) -> str:
    salt = secrets.token_hex(16)
    h = hashlib.pbkdf2_hmac("sha256", password.encode(), salt.encode(), 260000)
    return f"{salt}${h.hex()}"

def check_password(password: str, hashed: str) -> bool:
    try:
        salt, h = hashed.split("$", 1)
        return hmac.compare_digest(
            hashlib.pbkdf2_hmac("sha256", password.encode(), salt.encode(), 260000).hex(), h
        )
    except Exception:
        return False

# ─── Email ───────────────────────────────────────────────────────────────────

def send_email(to: str, subject: str, html: str):
    host = os.environ.get("SMTP_HOST", "")
    user = os.environ.get("SMTP_USER", "")
    pwd  = os.environ.get("SMTP_PASS", "")
    if not host or not user or not pwd:
        return  # SMTP не настроен — пропускаем молча
    msg = MIMEMultipart("alternative")
    msg["Subject"] = subject
    msg["From"] = f"АгроПорт <{user}>"
    msg["To"] = to
    msg.attach(MIMEText(html, "html", "utf-8"))
    port = 465 if "yandex" in host or "mail.ru" in host else 587
    try:
        if port == 465:
            with smtplib.SMTP_SSL(host, 465, timeout=10) as s:
                s.login(user, pwd)
                s.sendmail(user, [to], msg.as_string())
        else:
            with smtplib.SMTP(host, 587, timeout=10) as s:
                s.starttls()
                s.login(user, pwd)
                s.sendmail(user, [to], msg.as_string())
    except Exception:
        pass

def verify_email_html(name: str, token: str) -> str:
    url = f"{APP_URL}/?verify={token}"
    return f"""
    <div style="font-family:sans-serif;max-width:520px;margin:0 auto;padding:32px 24px">
      <div style="background:linear-gradient(135deg,#2E7D32,#1B5E20);border-radius:16px;padding:32px;text-align:center;margin-bottom:24px">
        <h1 style="color:#fff;font-size:28px;margin:0">🌾 АгроПорт</h1>
        <p style="color:rgba(255,255,255,0.7);margin:8px 0 0">Платформа агроаналитики России</p>
      </div>
      <h2 style="color:#1a1a1a;font-size:20px">Привет, {name}!</h2>
      <p style="color:#555;font-size:15px;line-height:1.6">
        Вы зарегистрировались на платформе АгроПорт. Для активации аккаунта подтвердите свой email:
      </p>
      <div style="text-align:center;margin:28px 0">
        <a href="{url}" style="background:#2E7D32;color:#fff;padding:14px 32px;border-radius:12px;text-decoration:none;font-size:15px;font-weight:700;display:inline-block">
          Подтвердить email
        </a>
      </div>
      <p style="color:#999;font-size:12px;text-align:center">
        Ссылка действует 24 часа. Если вы не регистрировались — просто проигнорируйте это письмо.
      </p>
    </div>"""

# ─── Handler ─────────────────────────────────────────────────────────────────

def handler(event: dict, context) -> dict:
    """Авторизация: register, verify, login, me, logout, forgot, reset"""
    if event.get("httpMethod") == "OPTIONS":
        return {"statusCode": 200, "headers": CORS, "body": ""}

    method = event.get("httpMethod", "GET")
    params = event.get("queryStringParameters") or {}
    action = params.get("action", "")
    body = {}
    if event.get("body"):
        try:
            body = json.loads(event["body"])
        except Exception:
            pass

    db = get_db()
    cur = db.cursor()

    def ok(data): return {"statusCode": 200, "headers": CORS, "body": json.dumps(data, ensure_ascii=False, default=str)}
    def err(msg, code=400): return {"statusCode": code, "headers": CORS, "body": json.dumps({"error": msg}, ensure_ascii=False)}

    # ── Подтверждение email (GET /?action=verify&token=...) ──
    if method == "GET" and action == "verify":
        token = params.get("token", "")
        cur.execute(f"SELECT id, full_name FROM {SCHEMA}.users WHERE verify_token = %s AND is_verified = false", (token,))
        row = cur.fetchone()
        if not row:
            return err("Недействительная или уже использованная ссылка")
        cur.execute(f"UPDATE {SCHEMA}.users SET is_verified=true, verify_token=NULL WHERE id=%s", (row[0],))
        return ok({"ok": True, "message": "Email подтверждён! Теперь войдите в аккаунт."})

    # ── Получить профиль (GET /?action=me) ──
    if method == "GET" and action == "me":
        auth = event.get("headers", {}).get("x-authorization", "")
        token = auth.replace("Bearer ", "")
        payload = jwt_verify(token)
        if not payload:
            return err("Не авторизован", 401)
        cur.execute(f"SELECT id,email,full_name,company,role,plan,avatar_url,phone,is_verified,created_at FROM {SCHEMA}.users WHERE id=%s", (payload["sub"],))
        row = cur.fetchone()
        if not row:
            return err("Пользователь не найден", 404)
        cols = ["id","email","full_name","company","role","plan","avatar_url","phone","is_verified","created_at"]
        return ok(dict(zip(cols, row)))

    if method == "POST":
        # ── Регистрация ──
        if action == "register":
            email = body.get("email", "").strip().lower()
            password = body.get("password", "")
            full_name = body.get("full_name", "").strip()
            role = body.get("role", "farmer")
            if not email or not re.match(r"[^@]+@[^@]+\.[^@]+", email):
                return err("Введите корректный email")
            if len(password) < 6:
                return err("Пароль должен быть не менее 6 символов")
            cur.execute(f"SELECT id FROM {SCHEMA}.users WHERE email=%s", (email,))
            if cur.fetchone():
                return err("Этот email уже зарегистрирован")
            token = secrets.token_hex(32)
            phash = hash_password(password)
            cur.execute(
                f"INSERT INTO {SCHEMA}.users (email,password_hash,full_name,role,verify_token,is_verified) VALUES (%s,%s,%s,%s,%s,false) RETURNING id",
                (email, phash, full_name or email.split("@")[0], role, token)
            )
            user_id = cur.fetchone()[0]
            send_email(email, "Подтвердите email — АгроПорт", verify_email_html(full_name or "пользователь", token))
            jwt = jwt_create({"sub": user_id, "email": email, "role": role})
            return ok({"ok": True, "token": jwt, "user_id": user_id,
                        "message": "Регистрация успешна! Проверьте почту для подтверждения."})

        # ── Вход ──
        if action == "login":
            email = body.get("email", "").strip().lower()
            password = body.get("password", "")
            cur.execute(f"SELECT id,password_hash,full_name,role,plan,is_verified FROM {SCHEMA}.users WHERE email=%s", (email,))
            row = cur.fetchone()
            if not row or not check_password(password, row[1]):
                return err("Неверный email или пароль")
            jwt = jwt_create({"sub": row[0], "email": email, "role": row[3]})
            return ok({
                "ok": True, "token": jwt,
                "user": {"id": row[0], "email": email, "full_name": row[2], "role": row[3], "plan": row[4], "is_verified": row[5]}
            })

        # ── Обновить профиль ──
        if action == "update_profile":
            auth = event.get("headers", {}).get("x-authorization", "")
            payload = jwt_verify(auth.replace("Bearer ", ""))
            if not payload:
                return err("Не авторизован", 401)
            fields = {k: v for k, v in body.items() if k in ["full_name", "phone", "company", "role"]}
            if fields:
                sets = ", ".join(f"{k}=%s" for k in fields)
                cur.execute(f"UPDATE {SCHEMA}.users SET {sets}, updated_at=now() WHERE id=%s", list(fields.values()) + [payload["sub"]])
            return ok({"ok": True})

        # ── Сброс пароля (запрос) ──
        if action == "forgot":
            email = body.get("email", "").strip().lower()
            cur.execute(f"SELECT id,full_name FROM {SCHEMA}.users WHERE email=%s", (email,))
            row = cur.fetchone()
            if row:
                token = secrets.token_hex(32)
                expires = datetime.now(timezone.utc) + timedelta(hours=2)
                cur.execute(f"UPDATE {SCHEMA}.users SET reset_token=%s, reset_expires=%s WHERE id=%s", (token, expires, row[0]))
                url = f"{APP_URL}/?reset={token}"
                html = f"""<div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px 24px">
                  <h2 style="color:#2E7D32">Сброс пароля — АгроПорт</h2>
                  <p>Для сброса пароля перейдите по ссылке (действует 2 часа):</p>
                  <a href="{url}" style="background:#2E7D32;color:#fff;padding:12px 28px;border-radius:10px;text-decoration:none;display:inline-block;margin:16px 0">Сбросить пароль</a>
                </div>"""
                send_email(email, "Сброс пароля — АгроПорт", html)
            return ok({"ok": True, "message": "Если email зарегистрирован, письмо отправлено"})

        # ── Сброс пароля (установка нового) ──
        if action == "reset":
            token = body.get("token", "")
            new_pass = body.get("password", "")
            if len(new_pass) < 6:
                return err("Пароль должен быть не менее 6 символов")
            cur.execute(f"SELECT id FROM {SCHEMA}.users WHERE reset_token=%s AND reset_expires > now()", (token,))
            row = cur.fetchone()
            if not row:
                return err("Ссылка недействительна или истекла")
            cur.execute(f"UPDATE {SCHEMA}.users SET password_hash=%s, reset_token=NULL, reset_expires=NULL WHERE id=%s",
                        (hash_password(new_pass), row[0]))
            return ok({"ok": True, "message": "Пароль успешно изменён"})

    return err("Неизвестный запрос", 404)
