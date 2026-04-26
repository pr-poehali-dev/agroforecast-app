"""
Управление заявками/обращениями: список, просмотр, смена статуса, ответ, создание.
"""
import json, os
import psycopg2

SCHEMA = os.environ.get("MAIN_DB_SCHEMA", "t_p36960093_agroforecast_app")
CORS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, PUT, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, X-Admin-Token, X-Authorization",
    "Content-Type": "application/json",
}

def get_db():
    conn = psycopg2.connect(os.environ["DATABASE_URL"])
    conn.autocommit = True
    return conn

def ok(data): return {"statusCode": 200, "headers": CORS, "body": json.dumps(data, ensure_ascii=False, default=str)}
def err(msg, code=400): return {"statusCode": code, "headers": CORS, "body": json.dumps({"error": msg}, ensure_ascii=False)}

def verify_admin(cur, headers):
    token = headers.get("x-admin-token", "")
    if not token:
        return False
    cur.execute(f"SELECT id FROM {SCHEMA}.admin_sessions WHERE token=%s AND expires_at > now()", (token,))
    return cur.fetchone() is not None

COLS = ["id","user_id","name","email","subject","message","status","admin_reply","replied_at","created_at","updated_at"]

def handler(event: dict, context) -> dict:
    """Управление заявками и обращениями пользователей"""
    if event.get("httpMethod") == "OPTIONS":
        return {"statusCode": 200, "headers": CORS, "body": ""}

    method = event.get("httpMethod", "GET")
    params = event.get("queryStringParameters") or {}
    headers = event.get("headers", {})

    db = get_db()
    cur = db.cursor()

    body = {}
    if event.get("body"):
        try:
            body = json.loads(event["body"])
        except Exception:
            pass

    action = params.get("action", "")

    # ── Публичное создание заявки (без токена) ──
    if method == "POST" and action == "submit":
        name = body.get("name", "").strip()
        email = body.get("email", "").strip()
        message = body.get("message", "").strip()
        if not name or not email or not message:
            return err("Заполните все обязательные поля")
        cur.execute(
            f"""INSERT INTO {SCHEMA}.appeals (name, email, subject, message, user_id)
                VALUES (%s, %s, %s, %s, %s) RETURNING id""",
            (name, email, body.get("subject","Обращение"), message, body.get("user_id"))
        )
        return ok({"ok": True, "id": cur.fetchone()[0]})

    # Остальные методы — только для админа
    if not verify_admin(cur, headers):
        return err("Не авторизован", 401)

    appeal_id = params.get("id")

    # ── Список ──
    if method == "GET" and not appeal_id:
        page = int(params.get("page", 1))
        limit = 20
        offset = (page - 1) * limit
        status = params.get("status", "")
        where = "WHERE 1=1"
        args = []
        if status:
            where += " AND status=%s"
            args.append(status)
        cur.execute(f"SELECT COUNT(*) FROM {SCHEMA}.appeals {where}", args)
        total = cur.fetchone()[0]
        cur.execute(
            f"SELECT {','.join(COLS)} FROM {SCHEMA}.appeals {where} ORDER BY created_at DESC LIMIT %s OFFSET %s",
            args + [limit, offset]
        )
        items = [dict(zip(COLS, row)) for row in cur.fetchall()]
        # Кол-во по статусам
        cur.execute(f"SELECT status, COUNT(*) FROM {SCHEMA}.appeals GROUP BY status")
        counts = {row[0]: row[1] for row in cur.fetchall()}
        return ok({"appeals": items, "total": total, "page": page,
                   "pages": (total + limit - 1) // limit, "counts": counts})

    # ── Одна заявка ──
    if method == "GET" and appeal_id:
        cur.execute(f"SELECT {','.join(COLS)} FROM {SCHEMA}.appeals WHERE id=%s", (appeal_id,))
        row = cur.fetchone()
        if not row:
            return err("Заявка не найдена", 404)
        return ok(dict(zip(COLS, row)))

    # ── Обновить (статус + ответ) ──
    if method == "PUT" and appeal_id:
        allowed = ["status", "admin_reply"]
        updates = {k: v for k, v in body.items() if k in allowed}
        if not updates:
            return err("Нечего обновлять")
        set_parts = [f"{k}=%s" for k in updates]
        set_parts.append("updated_at=now()")
        if "admin_reply" in updates:
            set_parts.append("replied_at=now()")
        set_clause = ", ".join(set_parts)
        cur.execute(
            f"UPDATE {SCHEMA}.appeals SET {set_clause} WHERE id=%s RETURNING id",
            list(updates.values()) + [appeal_id]
        )
        if not cur.fetchone():
            return err("Заявка не найдена", 404)
        return ok({"ok": True})

    return err("Неизвестный запрос", 404)
