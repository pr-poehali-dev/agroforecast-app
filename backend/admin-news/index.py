"""
Управление новостями: список, создание, редактирование, удаление (мягкое — is_published=false).
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

COLS = ["id","title","summary","content","category","crop","impact","urgency",
        "source","source_url","image_url","is_published","published_at","created_at","updated_at"]

def handler(event: dict, context) -> dict:
    """CRUD новостей для кабинета администратора"""
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

    news_id = params.get("id")

    # ── Список ──
    if method == "GET" and not news_id:
        page = int(params.get("page", 1))
        limit = 20
        offset = (page - 1) * limit
        search = params.get("search", "")
        where = "WHERE 1=1"
        args = []
        if search:
            where += " AND (title ILIKE %s OR summary ILIKE %s)"
            args += [f"%{search}%", f"%{search}%"]
        cur.execute(f"SELECT COUNT(*) FROM {SCHEMA}.news {where}", args)
        total = cur.fetchone()[0]
        cur.execute(
            f"SELECT {','.join(COLS)} FROM {SCHEMA}.news {where} ORDER BY created_at DESC LIMIT %s OFFSET %s",
            args + [limit, offset]
        )
        items = [dict(zip(COLS, row)) for row in cur.fetchall()]
        return ok({"news": items, "total": total, "page": page, "pages": (total + limit - 1) // limit})

    # ── Одна новость ──
    if method == "GET" and news_id:
        cur.execute(f"SELECT {','.join(COLS)} FROM {SCHEMA}.news WHERE id=%s", (news_id,))
        row = cur.fetchone()
        if not row:
            return err("Новость не найдена", 404)
        return ok(dict(zip(COLS, row)))

    # ── Создать ──
    if method == "POST":
        title = body.get("title", "").strip()
        if not title:
            return err("Заголовок обязателен")
        cur.execute(
            f"""INSERT INTO {SCHEMA}.news
                (title, summary, content, category, crop, impact, urgency, source, source_url, image_url, is_published, published_at)
                VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,now()) RETURNING id""",
            (title, body.get("summary",""), body.get("content",""),
             body.get("category","рынок"), body.get("crop","Все культуры"),
             body.get("impact","neutral"), body.get("urgency","medium"),
             body.get("source","АгроПорт"), body.get("source_url",""),
             body.get("image_url",""), body.get("is_published", True))
        )
        new_id = cur.fetchone()[0]
        return ok({"ok": True, "id": new_id})

    # ── Редактировать ──
    if method == "PUT" and news_id:
        allowed = ["title","summary","content","category","crop","impact","urgency",
                   "source","source_url","image_url","is_published"]
        updates = {k: v for k, v in body.items() if k in allowed}
        if not updates:
            return err("Нечего обновлять")
        set_clause = ", ".join(f"{k}=%s" for k in updates) + ", updated_at=now()"
        cur.execute(
            f"UPDATE {SCHEMA}.news SET {set_clause} WHERE id=%s RETURNING id",
            list(updates.values()) + [news_id]
        )
        if not cur.fetchone():
            return err("Новость не найдена", 404)
        return ok({"ok": True})

    # ── Удалить (скрыть) ──
    if method == "DELETE" and news_id:
        cur.execute(f"UPDATE {SCHEMA}.news SET is_published=false, updated_at=now() WHERE id=%s RETURNING id", (news_id,))
        if not cur.fetchone():
            return err("Новость не найдена", 404)
        return ok({"ok": True})

    return err("Неизвестный запрос", 404)
