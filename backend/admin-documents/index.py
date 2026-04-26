"""
Управление документами и задачами проекта АгроПорт.
CRUD для admin_documents и project_tasks.
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

def verify_token(cur, token):
    if not token: return False
    cur.execute(f"SELECT id FROM {SCHEMA}.admin_sessions WHERE token=%s AND expires_at > now()", (token,))
    return cur.fetchone() is not None

def handler(event: dict, context) -> dict:
    """Документы и задачи: CRUD для admin_documents и project_tasks"""
    if event.get("httpMethod") == "OPTIONS":
        return {"statusCode": 200, "headers": CORS, "body": ""}

    method = event.get("httpMethod", "GET")
    params = event.get("queryStringParameters") or {}
    resource = params.get("resource", "documents")
    headers = event.get("headers", {})
    token = headers.get("x-admin-token", "") or params.get("token", "")

    body = {}
    if event.get("body"):
        try: body = json.loads(event["body"])
        except: pass

    db = get_db()
    cur = db.cursor()

    # Публичный GET для документов (без токена)
    if method == "GET" and resource == "documents":
        doc_id = params.get("id")
        if doc_id:
            cur.execute(f"SELECT id, title, category, content, is_published, sort_order, created_at, updated_at FROM {SCHEMA}.admin_documents WHERE id=%s", (int(doc_id),))
            row = cur.fetchone()
            if not row: return err("Не найдено", 404)
            cols = ["id","title","category","content","is_published","sort_order","created_at","updated_at"]
            return ok(dict(zip(cols, row)))
        cur.execute(f"SELECT id, title, category, content, is_published, sort_order, created_at, updated_at FROM {SCHEMA}.admin_documents ORDER BY sort_order, id")
        cols = ["id","title","category","content","is_published","sort_order","created_at","updated_at"]
        return ok({"items": [dict(zip(cols, r)) for r in cur.fetchall()]})

    # Все остальные — только для авторизованных
    if not verify_token(cur, token):
        return err("Не авторизован", 401)

    # ── Документы ──
    if resource == "documents":
        if method == "POST":
            cur.execute(
                f"INSERT INTO {SCHEMA}.admin_documents (title, category, content, is_published, sort_order) VALUES (%s,%s,%s,%s,%s) RETURNING id",
                (body.get("title",""), body.get("category","general"), body.get("content",""), body.get("is_published", True), body.get("sort_order", 0))
            )
            return ok({"id": cur.fetchone()[0]})

        doc_id = params.get("id")
        if not doc_id: return err("Укажите id")

        if method == "PUT":
            fields = []
            vals = []
            for f in ["title","category","content","is_published","sort_order"]:
                if f in body:
                    fields.append(f"{f}=%s")
                    vals.append(body[f])
            if not fields: return err("Нет полей для обновления")
            fields.append("updated_at=now()")
            vals.append(int(doc_id))
            cur.execute(f"UPDATE {SCHEMA}.admin_documents SET {', '.join(fields)} WHERE id=%s", vals)
            return ok({"ok": True})

        if method == "DELETE":
            cur.execute(f"DELETE FROM {SCHEMA}.admin_documents WHERE id=%s", (int(doc_id),))
            return ok({"ok": True})

    # ── Задачи ──
    if resource == "tasks":
        if method == "GET":
            stage = params.get("stage")
            if stage:
                cur.execute(f"SELECT id,stage,title,description,status,priority,due_date,completed_at,created_at,updated_at FROM {SCHEMA}.project_tasks WHERE stage=%s ORDER BY priority DESC, id", (int(stage),))
            else:
                cur.execute(f"SELECT id,stage,title,description,status,priority,due_date,completed_at,created_at,updated_at FROM {SCHEMA}.project_tasks ORDER BY stage, priority DESC, id")
            cols = ["id","stage","title","description","status","priority","due_date","completed_at","created_at","updated_at"]
            return ok({"items": [dict(zip(cols, r)) for r in cur.fetchall()]})

        if method == "POST":
            cur.execute(
                f"INSERT INTO {SCHEMA}.project_tasks (stage,title,description,status,priority,due_date) VALUES (%s,%s,%s,%s,%s,%s) RETURNING id",
                (body.get("stage",1), body.get("title",""), body.get("description",""), body.get("status","pending"), body.get("priority","medium"), body.get("due_date"))
            )
            return ok({"id": cur.fetchone()[0]})

        task_id = params.get("id")
        if not task_id: return err("Укажите id")

        if method == "PUT":
            fields, vals = [], []
            for f in ["title","description","status","priority","due_date","stage"]:
                if f in body:
                    fields.append(f"{f}=%s")
                    vals.append(body[f])
            if body.get("status") == "done":
                fields.append("completed_at=now()")
            fields.append("updated_at=now()")
            vals.append(int(task_id))
            cur.execute(f"UPDATE {SCHEMA}.project_tasks SET {', '.join(fields)} WHERE id=%s", vals)
            return ok({"ok": True})

        if method == "DELETE":
            cur.execute(f"DELETE FROM {SCHEMA}.project_tasks WHERE id=%s", (int(task_id),))
            return ok({"ok": True})

    return err("Неизвестный запрос", 404)