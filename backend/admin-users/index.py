"""
Управление пользователями: список, просмотр, блокировка, редактирование, назначение роли.
"""
import json, os
import psycopg2

SCHEMA = os.environ.get("MAIN_DB_SCHEMA", "t_p36960093_agroforecast_app")
CORS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, X-Admin-Token",
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

def handler(event: dict, context) -> dict:
    """Управление пользователями кабинета администратора"""
    if event.get("httpMethod") == "OPTIONS":
        return {"statusCode": 200, "headers": CORS, "body": ""}

    method = event.get("httpMethod", "GET")
    params = event.get("queryStringParameters") or {}
    headers = event.get("headers", {})

    db = get_db()
    cur = db.cursor()

    if not verify_admin(cur, headers):
        return err("Не авторизован", 401)

    body = {}
    if event.get("body"):
        try:
            body = json.loads(event["body"])
        except Exception:
            pass

    user_id = params.get("id")

    # ── Список пользователей ──
    if method == "GET" and not user_id:
        search = params.get("search", "")
        role = params.get("role", "")
        page = int(params.get("page", 1))
        limit = 20
        offset = (page - 1) * limit

        where = "WHERE 1=1"
        args = []
        if search:
            where += " AND (email ILIKE %s OR full_name ILIKE %s OR company ILIKE %s)"
            args += [f"%{search}%", f"%{search}%", f"%{search}%"]
        if role:
            where += " AND role=%s"
            args.append(role)

        cur.execute(f"SELECT COUNT(*) FROM {SCHEMA}.users {where}", args)
        total = cur.fetchone()[0]

        cur.execute(
            f"""SELECT id, email, full_name, company, role, plan, is_verified, is_blocked,
                       loyalty_points, phone, created_at, updated_at
                FROM {SCHEMA}.users {where}
                ORDER BY created_at DESC LIMIT %s OFFSET %s""",
            args + [limit, offset]
        )
        cols = ["id","email","full_name","company","role","plan","is_verified","is_blocked",
                "loyalty_points","phone","created_at","updated_at"]
        users = [dict(zip(cols, row)) for row in cur.fetchall()]
        return ok({"users": users, "total": total, "page": page, "pages": (total + limit - 1) // limit})

    # ── Один пользователь ──
    if method == "GET" and user_id:
        cur.execute(
            f"""SELECT id, email, full_name, company, role, plan, is_verified, is_blocked,
                       loyalty_points, phone, admin_notes, created_at, updated_at
                FROM {SCHEMA}.users WHERE id=%s""",
            (user_id,)
        )
        row = cur.fetchone()
        if not row:
            return err("Пользователь не найден", 404)
        cols = ["id","email","full_name","company","role","plan","is_verified","is_blocked",
                "loyalty_points","phone","admin_notes","created_at","updated_at"]
        return ok(dict(zip(cols, row)))

    # ── Редактирование пользователя ──
    if method == "PUT" and user_id:
        allowed = ["full_name", "company", "role", "plan", "is_blocked", "loyalty_points", "admin_notes", "phone"]
        updates = {k: v for k, v in body.items() if k in allowed}
        if not updates:
            return err("Нечего обновлять")
        set_clause = ", ".join(f"{k}=%s" for k in updates)
        set_clause += ", updated_at=now()"
        cur.execute(
            f"UPDATE {SCHEMA}.users SET {set_clause} WHERE id=%s RETURNING id",
            list(updates.values()) + [user_id]
        )
        if not cur.fetchone():
            return err("Пользователь не найден", 404)
        return ok({"ok": True})

    return err("Неизвестный запрос", 404)
