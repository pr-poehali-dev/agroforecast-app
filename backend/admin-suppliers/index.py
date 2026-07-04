"""
База сельхозпроизводителей (поставщиков) по регионам.
CRUD + пакетный импорт из Excel/CSV (фронт присылает готовый массив строк).
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

FIELDS = ["name", "inn", "region", "district", "locality", "crops", "volume_tons",
          "contact_person", "phone", "email", "address", "status", "source", "notes"]

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

def _clean(row):
    out = {}
    for k in FIELDS:
        if k in row and row[k] not in (None, ""):
            out[k] = row[k]
    return out

def handler(event: dict, context) -> dict:
    """CRUD и импорт базы поставщиков сельхозпродукции"""
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

    sid = params.get("id")
    action = params.get("action", "")

    # ── Пакетный импорт из Excel/CSV ──
    if method == "POST" and action == "import":
        rows = body.get("rows") or []
        region = body.get("region") or "Саратовская область"
        inserted = 0
        for raw in rows:
            data = _clean(raw)
            if not data.get("name"):
                continue
            data.setdefault("region", region)
            data.setdefault("source", "import")
            data.setdefault("status", "new")
            cols = list(data.keys())
            ph = ", ".join(["%s"] * len(cols))
            cur.execute(
                f"INSERT INTO {SCHEMA}.suppliers ({', '.join(cols)}) VALUES ({ph})",
                [data[c] for c in cols]
            )
            inserted += 1
        return ok({"imported": inserted})

    # ── Список ──
    if method == "GET" and not sid:
        search = params.get("search", "")
        region = params.get("region", "")
        district = params.get("district", "")
        status = params.get("status", "")
        page = int(params.get("page", 1))
        limit = 50
        offset = (page - 1) * limit

        where = "WHERE 1=1"
        args = []
        if search:
            where += " AND (name ILIKE %s OR inn ILIKE %s OR contact_person ILIKE %s OR locality ILIKE %s)"
            args += [f"%{search}%"] * 4
        if region:
            where += " AND region=%s"; args.append(region)
        if district:
            where += " AND district=%s"; args.append(district)
        if status:
            where += " AND status=%s"; args.append(status)

        cur.execute(f"SELECT COUNT(*) FROM {SCHEMA}.suppliers {where}", args)
        total = cur.fetchone()[0]

        cur.execute(
            f"""SELECT id, name, inn, region, district, locality, crops, volume_tons,
                       contact_person, phone, email, address, status, source, notes, created_at, updated_at
                FROM {SCHEMA}.suppliers {where}
                ORDER BY created_at DESC LIMIT %s OFFSET %s""",
            args + [limit, offset]
        )
        cols = ["id","name","inn","region","district","locality","crops","volume_tons",
                "contact_person","phone","email","address","status","source","notes","created_at","updated_at"]
        items = [dict(zip(cols, row)) for row in cur.fetchall()]

        # сводка по статусам
        cur.execute(f"SELECT status, COUNT(*) FROM {SCHEMA}.suppliers {where} GROUP BY status", args)
        stats = {r[0]: r[1] for r in cur.fetchall()}

        return ok({"suppliers": items, "total": total, "page": page,
                   "pages": (total + limit - 1) // limit, "stats": stats})

    # ── Создание ──
    if method == "POST":
        data = _clean(body)
        if not data.get("name"):
            return err("Название хозяйства обязательно")
        data.setdefault("region", "Саратовская область")
        data.setdefault("source", "manual")
        data.setdefault("status", "new")
        cols = list(data.keys())
        ph = ", ".join(["%s"] * len(cols))
        cur.execute(
            f"INSERT INTO {SCHEMA}.suppliers ({', '.join(cols)}) VALUES ({ph}) RETURNING id",
            [data[c] for c in cols]
        )
        return ok({"id": cur.fetchone()[0]})

    # ── Редактирование ──
    if method == "PUT" and sid:
        updates = _clean(body)
        if not updates:
            return err("Нечего обновлять")
        set_clause = ", ".join(f"{k}=%s" for k in updates) + ", updated_at=now()"
        cur.execute(
            f"UPDATE {SCHEMA}.suppliers SET {set_clause} WHERE id=%s RETURNING id",
            list(updates.values()) + [sid]
        )
        if not cur.fetchone():
            return err("Поставщик не найден", 404)
        return ok({"ok": True})

    # ── Удаление ──
    if method == "DELETE" and sid:
        cur.execute(f"DELETE FROM {SCHEMA}.suppliers WHERE id=%s RETURNING id", (sid,))
        if not cur.fetchone():
            return err("Поставщик не найден", 404)
        return ok({"ok": True})

    return err("Неизвестный запрос", 404)
