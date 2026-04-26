"""
Настройки пользователя АгроПорт + управление триггерами алертов.

Actions (POST JSON body):
  GET /?user_id=...          — загрузить настройки
  POST/PUT /?user_id=...     — сохранить настройки (regions, crops, notifications, profile)
  POST body.action = triggers_list   — список триггеров пользователя
  POST body.action = triggers_save   — сохранить новый триггер
  POST body.action = triggers_delete — удалить триггер по индексу
  POST body.action = send_test_email — отправить тестовое письмо
"""
import json
import os
import smtplib
import uuid
from datetime import date
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText

import psycopg2

CORS_HEADERS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, PUT, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Content-Type": "application/json",
}

SCHEMA = os.environ.get("MAIN_DB_SCHEMA", "public")


def get_conn():
    return psycopg2.connect(os.environ["DATABASE_URL"])


def resp(status: int, body: dict) -> dict:
    return {
        "statusCode": status,
        "headers": CORS_HEADERS,
        "body": json.dumps(body, ensure_ascii=False, default=str),
    }


def ensure_user(cur, user_id: str):
    """Upsert row so user always exists in user_settings."""
    safe_uid = user_id.replace("'", "''")
    cur.execute(
        "INSERT INTO " + SCHEMA + ".user_settings (user_id) "
        "VALUES ('" + safe_uid + "') "
        "ON CONFLICT (user_id) DO NOTHING"
    )


def load_notifications(cur, user_id: str) -> dict:
    safe_uid = user_id.replace("'", "''")
    cur.execute(
        "SELECT notifications FROM " + SCHEMA + ".user_settings "
        "WHERE user_id = '" + safe_uid + "'"
    )
    row = cur.fetchone()
    if not row or row[0] is None:
        return {}
    val = row[0]
    if isinstance(val, str):
        try:
            return json.loads(val)
        except Exception:
            return {}
    return val


def save_notifications(cur, user_id: str, notif: dict):
    safe_uid = user_id.replace("'", "''")
    safe_json = json.dumps(notif, ensure_ascii=False).replace("'", "''")
    cur.execute(
        "UPDATE " + SCHEMA + ".user_settings "
        "SET notifications = '" + safe_json + "'::jsonb, updated_at = NOW() "
        "WHERE user_id = '" + safe_uid + "'"
    )


def send_email(to_addr: str, subject: str, body_html: str) -> bool:
    """Send email via SMTP. Returns True on success, False on any error."""
    host = os.environ.get("SMTP_HOST", "")
    port = int(os.environ.get("SMTP_PORT", "587"))
    user = os.environ.get("SMTP_USER", "")
    password = os.environ.get("SMTP_PASS", "")

    if not host or not user or not password:
        return False

    try:
        msg = MIMEMultipart("alternative")
        msg["Subject"] = subject
        msg["From"] = user
        msg["To"] = to_addr
        msg.attach(MIMEText(body_html, "html", "utf-8"))

        with smtplib.SMTP(host, port, timeout=10) as server:
            server.ehlo()
            server.starttls()
            server.login(user, password)
            server.sendmail(user, [to_addr], msg.as_string())
        return True
    except Exception:
        return False


def handler(event: dict, context) -> dict:
    """Настройки пользователя и управление триггерами алертов."""

    if event.get("httpMethod") == "OPTIONS":
        return {"statusCode": 200, "headers": CORS_HEADERS, "body": ""}

    method = event.get("httpMethod", "GET")
    params = event.get("queryStringParameters") or {}
    user_id = params.get("user_id", "default")

    # Parse body for POST/PUT
    body = {}
    if event.get("body"):
        try:
            body = json.loads(event["body"])
        except Exception:
            pass

    # Determine action for trigger-specific POST requests
    action = body.get("action", "")

    # ── TRIGGER ACTIONS (POST only) ────────────────────────────────────────
    if method in ("POST", "PUT") and action in (
        "triggers_list", "triggers_save", "triggers_delete", "send_test_email"
    ):
        # user_id may come from body or query param
        user_id = str(body.get("user_id", user_id)).replace("'", "''")

        conn = get_conn()
        cur = conn.cursor()

        try:
            ensure_user(cur, user_id)
            conn.commit()

            # ── triggers_list ────────────────────────────────────────────
            if action == "triggers_list":
                notif = load_notifications(cur, user_id)
                triggers = notif.get("triggers", [])
                email = notif.get("alert_email", "")
                cur.close()
                conn.close()
                return resp(200, {"triggers": triggers, "alert_email": email, "count": len(triggers)})

            # ── triggers_save ─────────────────────────────────────────────
            if action == "triggers_save":
                trigger_type = str(body.get("type", "price"))
                new_trigger = {
                    "id": str(uuid.uuid4())[:8],
                    "type": trigger_type,
                    "active": True,
                    "created_at": str(date.today()),
                }
                if trigger_type == "price":
                    crop = str(body.get("crop", "Пшеница озимая"))
                    condition = str(body.get("condition", "above"))
                    threshold = float(body.get("threshold", 0))
                    if threshold <= 0:
                        cur.close(); conn.close()
                        return resp(400, {"error": "Укажите порог цены > 0"})
                    new_trigger["crop"] = crop
                    new_trigger["condition"] = condition
                    new_trigger["threshold"] = threshold
                elif trigger_type == "weather":
                    region = str(body.get("region", "Самарская"))
                    risk_level = str(body.get("risk_level", "high"))
                    new_trigger["region"] = region
                    new_trigger["risk_level"] = risk_level
                else:
                    cur.close(); conn.close()
                    return resp(400, {"error": "Неизвестный тип триггера: " + trigger_type})

                notif = load_notifications(cur, user_id)
                triggers = notif.get("triggers", [])
                triggers.append(new_trigger)
                notif["triggers"] = triggers
                save_notifications(cur, user_id, notif)
                conn.commit()
                cur.close(); conn.close()
                return resp(201, {"success": True, "trigger": new_trigger, "total": len(triggers)})

            # ── triggers_delete ───────────────────────────────────────────
            if action == "triggers_delete":
                trigger_id = str(body.get("id", ""))
                if not trigger_id:
                    cur.close(); conn.close()
                    return resp(400, {"error": "Не указан id триггера"})

                notif = load_notifications(cur, user_id)
                triggers = notif.get("triggers", [])
                before = len(triggers)
                triggers = [t for t in triggers if str(t.get("id", "")) != trigger_id]

                if len(triggers) == before:
                    cur.close(); conn.close()
                    return resp(404, {"error": "Триггер не найден"})

                notif["triggers"] = triggers
                save_notifications(cur, user_id, notif)
                conn.commit()
                cur.close(); conn.close()
                return resp(200, {"success": True, "deleted_id": trigger_id, "remaining": len(triggers)})

            # ── send_test_email ───────────────────────────────────────────
            if action == "send_test_email":
                to_addr = str(body.get("email", ""))
                if not to_addr or "@" not in to_addr:
                    cur.close(); conn.close()
                    return resp(400, {"error": "Укажите корректный email"})

                # Save email to notifications if not already there
                notif = load_notifications(cur, user_id)
                notif["alert_email"] = to_addr
                save_notifications(cur, user_id, notif)
                conn.commit()

                subject = "АгроПорт — тестовое уведомление"
                body_html = """
                <html><body style="font-family:sans-serif;max-width:520px;margin:auto">
                  <div style="background:linear-gradient(135deg,#2E7D32,#388E3C);padding:24px;border-radius:12px 12px 0 0">
                    <h2 style="color:#fff;margin:0;font-size:20px">АгроПорт · Тестовое письмо</h2>
                    <p style="color:rgba(255,255,255,0.7);margin:6px 0 0;font-size:13px">Система уведомлений работает</p>
                  </div>
                  <div style="background:#fff;border:1px solid #e0e0e0;border-top:none;padding:24px;border-radius:0 0 12px 12px">
                    <p style="color:#333;font-size:14px">Вы успешно подключили уведомления на платформе <strong>АгроПорт</strong>.</p>
                    <p style="color:#555;font-size:13px">Вы будете получать оповещения о:</p>
                    <ul style="color:#555;font-size:13px;line-height:1.8">
                      <li>Критических изменениях цен на зерновые культуры</li>
                      <li>Погодных рисках в ваших регионах</li>
                      <li>Важных событиях агрорынка</li>
                    </ul>
                    <div style="margin-top:20px;padding:12px 16px;background:#f0fdf4;border-radius:8px;border-left:3px solid #2E7D32">
                      <p style="margin:0;font-size:12px;color:#2E7D32">
                        Для настройки триггеров перейдите в раздел <strong>Уведомления → Настройка триггеров</strong>
                      </p>
                    </div>
                  </div>
                </body></html>
                """

                sent = send_email(to_addr, subject, body_html)
                cur.close(); conn.close()

                if sent:
                    return resp(200, {"success": True, "sent": True, "to": to_addr, "message": "Письмо отправлено"})
                else:
                    # Graceful fallback — SMTP not configured, but we still acknowledge
                    return resp(200, {
                        "success": True,
                        "sent": False,
                        "to": to_addr,
                        "message": "Email сохранён. SMTP не настроен — письмо не отправлено.",
                    })

        except Exception as e:
            try:
                conn.rollback()
                cur.close()
                conn.close()
            except Exception:
                pass
            return resp(500, {"error": str(e)})

    # ── STANDARD SETTINGS GET / POST ──────────────────────────────────────
    conn = get_conn()
    cur = conn.cursor()

    if method == "GET":
        safe_uid = user_id.replace("'", "''")
        cur.execute(
            "SELECT regions, crops, notifications, profile, updated_at "
            "FROM " + SCHEMA + ".user_settings "
            "WHERE user_id = '" + safe_uid + "'"
        )
        row = cur.fetchone()
        cur.close()
        conn.close()

        if not row:
            return resp(404, {"error": "Пользователь не найден"})

        notif_val = row[2]
        if isinstance(notif_val, str):
            try:
                notif_val = json.loads(notif_val)
            except Exception:
                notif_val = {}

        result = {
            "user_id": user_id,
            "regions": row[0] or [],
            "crops": row[1] or [],
            "notifications": notif_val or {},
            "profile": row[3] or {},
            "updated_at": row[4].isoformat() if row[4] else None,
        }
        return resp(200, result)

    if method in ("POST", "PUT") and not action:
        regions = body.get("regions")
        crops = body.get("crops")
        notifications = body.get("notifications")
        profile = body.get("profile")

        safe_uid = user_id.replace("'", "''")

        # Ensure user row exists
        cur.execute(
            "INSERT INTO " + SCHEMA + ".user_settings (user_id) "
            "VALUES ('" + safe_uid + "') "
            "ON CONFLICT (user_id) DO NOTHING"
        )

        sets = []
        if regions is not None:
            # regions is text[] — build ARRAY['val1','val2',...] literal
            escaped = [str(v).replace("'", "''") for v in (regions or [])]
            if escaped:
                arr_literal = "ARRAY[" + ", ".join("'" + v + "'" for v in escaped) + "]"
            else:
                arr_literal = "ARRAY[]::text[]"
            sets.append("regions = " + arr_literal)
        if crops is not None:
            # crops is text[] — same pattern
            escaped = [str(v).replace("'", "''") for v in (crops or [])]
            if escaped:
                arr_literal = "ARRAY[" + ", ".join("'" + v + "'" for v in escaped) + "]"
            else:
                arr_literal = "ARRAY[]::text[]"
            sets.append("crops = " + arr_literal)
        if notifications is not None:
            safe_n = json.dumps(notifications, ensure_ascii=False).replace("'", "''")
            sets.append("notifications = '" + safe_n + "'::jsonb")
        if profile is not None:
            safe_p = json.dumps(profile, ensure_ascii=False).replace("'", "''")
            sets.append("profile = '" + safe_p + "'::jsonb")

        if not sets:
            cur.close(); conn.close()
            return resp(400, {"error": "Нет данных для обновления"})

        sets.append("updated_at = NOW()")
        sql = "UPDATE " + SCHEMA + ".user_settings SET " + ", ".join(sets) + " WHERE user_id = '" + safe_uid + "'"
        cur.execute(sql)
        conn.commit()
        cur.close(); conn.close()
        return resp(200, {"ok": True, "updated": len(sets) - 1})

    cur.close()
    conn.close()
    return resp(405, {"error": "Method not allowed"})