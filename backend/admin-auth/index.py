"""
Администраторская авторизация: login, logout, verify.
Логин/пароль хранятся в секретах ADMIN_LOGIN и ADMIN_PASSWORD.
"""
import json, os, secrets, hashlib, hmac
from datetime import datetime, timedelta, timezone
import psycopg2

SCHEMA = os.environ.get("MAIN_DB_SCHEMA", "t_p36960093_agroforecast_app")
CORS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, X-Admin-Token",
    "Content-Type": "application/json",
}

def get_db():
    conn = psycopg2.connect(os.environ["DATABASE_URL"])
    conn.autocommit = True
    return conn

def ok(data): return {"statusCode": 200, "headers": CORS, "body": json.dumps(data, ensure_ascii=False, default=str)}
def err(msg, code=400): return {"statusCode": code, "headers": CORS, "body": json.dumps({"error": msg}, ensure_ascii=False)}

def verify_token(cur, token):
    if not token:
        return False
    cur.execute(
        f"SELECT id FROM {SCHEMA}.admin_sessions WHERE token=%s AND expires_at > now()",
        (token,)
    )
    return cur.fetchone() is not None

def handler(event: dict, context) -> dict:
    """Админ-авторизация: login, logout, verify"""
    if event.get("httpMethod") == "OPTIONS":
        return {"statusCode": 200, "headers": CORS, "body": ""}

    method = event.get("httpMethod", "GET")
    params = event.get("queryStringParameters") or {}
    action = params.get("action", "")
    headers = event.get("headers", {})
    admin_token = headers.get("x-admin-token", "")

    body = {}
    if event.get("body"):
        try:
            body = json.loads(event["body"])
        except Exception:
            pass

    db = get_db()
    cur = db.cursor()

    # ── Проверка токена ──
    if method == "GET" and action == "verify":
        if verify_token(cur, admin_token):
            return ok({"ok": True})
        return err("Не авторизован", 401)

    # ── Логин ──
    if method == "POST" and action == "login":
        login = body.get("login", "").strip()
        password = body.get("password", "")
        admin_login = os.environ.get("ADMIN_LOGIN", "")
        admin_password = os.environ.get("ADMIN_PASSWORD", "")
        if not admin_login or not admin_password:
            return err("Администратор не настроен", 500)
        if not hmac.compare_digest(login, admin_login) or not hmac.compare_digest(password, admin_password):
            return err("Неверный логин или пароль", 401)
        token = secrets.token_hex(48)
        expires = datetime.now(timezone.utc) + timedelta(hours=24)
        cur.execute(
            f"INSERT INTO {SCHEMA}.admin_sessions (token, expires_at) VALUES (%s, %s)",
            (token, expires)
        )
        return ok({"ok": True, "token": token})

    # ── Выход ──
    if method == "DELETE" and action == "logout":
        if admin_token:
            cur.execute(f"UPDATE {SCHEMA}.admin_sessions SET expires_at=now() WHERE token=%s", (admin_token,))
        return ok({"ok": True})

    return err("Неизвестный запрос", 404)
