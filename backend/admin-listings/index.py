"""
Управление объявлениями маркетплейса для администратора.
GET    ?page=1&limit=20&status=pending&search=...  — список
GET    ?id=123                                       — одно объявление
PUT    ?id=123   body: {field: value, ...}           — редактировать поля
PUT    ?id=123&action=approve                        — одобрить
PUT    ?id=123&action=reject  body: {comment}        — отклонить
PUT    ?id=123&action=hide                           — скрыть
PUT    ?id=123&action=restore                        — восстановить
DELETE ?id=123                                       — удалить
"""

import json, os
import psycopg2
from psycopg2.extras import RealDictCursor
from datetime import datetime, timezone

CORS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, X-Admin-Token",
}

SCHEMA = "t_p36960093_agroforecast_app"


def get_conn():
    return psycopg2.connect(os.environ["DATABASE_URL"])


def check_admin(event: dict) -> bool:
    token = event.get("headers", {}).get("x-admin-token", "")
    if not token:
        return False
    conn = get_conn()
    cur = conn.cursor()
    cur.execute(
        f"SELECT id FROM {SCHEMA}.admin_sessions WHERE token = %s AND expires_at > NOW()",
        (token,),
    )
    ok = cur.fetchone() is not None
    conn.close()
    return ok


def ok(data: dict | list, status=200):
    return {"statusCode": status, "headers": CORS, "body": json.dumps(data, default=str)}


def err(msg: str, status=400):
    return {"statusCode": status, "headers": CORS, "body": json.dumps({"error": msg})}


def handler(event: dict, context) -> dict:
    if event.get("httpMethod") == "OPTIONS":
        return {"statusCode": 200, "headers": CORS, "body": ""}

    if not check_admin(event):
        return err("Unauthorized", 401)

    method = event.get("httpMethod", "GET")
    params = event.get("queryStringParameters") or {}
    listing_id = params.get("id")
    action = params.get("action")
    body = {}
    if event.get("body"):
        try:
            body = json.loads(event["body"])
        except Exception:
            pass

    conn = get_conn()
    cur = conn.cursor(cursor_factory=RealDictCursor)

    try:
        # GET список
        if method == "GET" and not listing_id:
            page = int(params.get("page", 1))
            limit = min(int(params.get("limit", 20)), 100)
            offset = (page - 1) * limit
            status_filter = params.get("status", "")
            search = params.get("search", "").strip()

            where = ["1=1"]
            args = []

            if status_filter:
                where.append("moderation_status = %s")
                args.append(status_filter)
            if search:
                where.append("(crop ILIKE %s OR region ILIKE %s OR contact ILIKE %s)")
                like = f"%{search}%"
                args.extend([like, like, like])

            where_sql = " AND ".join(where)

            cur.execute(
                f"SELECT COUNT(*) as cnt FROM {SCHEMA}.board_listings WHERE {where_sql}",
                args,
            )
            total = cur.fetchone()["cnt"]

            cur.execute(
                f"""SELECT id, type, crop, region, price_per_ton, volume_tons, quality,
                           contact, description, source, is_active, is_hidden,
                           moderation_status, moderation_comment, moderated_at, created_at, expires_at
                    FROM {SCHEMA}.board_listings
                    WHERE {where_sql}
                    ORDER BY created_at DESC
                    LIMIT %s OFFSET %s""",
                args + [limit, offset],
            )
            rows = cur.fetchall()
            return ok({"items": rows, "total": total, "page": page, "limit": limit})

        # GET одно
        if method == "GET" and listing_id:
            cur.execute(
                f"SELECT * FROM {SCHEMA}.board_listings WHERE id = %s",
                (int(listing_id),),
            )
            row = cur.fetchone()
            if not row:
                return err("Не найдено", 404)
            return ok(dict(row))

        # PUT — действия модерации или редактирование
        if method == "PUT" and listing_id:
            lid = int(listing_id)
            now = datetime.now(timezone.utc).isoformat()

            if action == "approve":
                cur.execute(
                    f"UPDATE {SCHEMA}.board_listings SET moderation_status='approved', is_hidden=false, moderated_at=%s WHERE id=%s",
                    (now, lid),
                )
                conn.commit()
                return ok({"success": True, "moderation_status": "approved"})

            if action == "reject":
                comment = body.get("comment", "")
                cur.execute(
                    f"UPDATE {SCHEMA}.board_listings SET moderation_status='rejected', is_hidden=true, moderation_comment=%s, moderated_at=%s WHERE id=%s",
                    (comment, now, lid),
                )
                conn.commit()
                return ok({"success": True, "moderation_status": "rejected"})

            if action == "hide":
                cur.execute(
                    f"UPDATE {SCHEMA}.board_listings SET is_hidden=true WHERE id=%s",
                    (lid,),
                )
                conn.commit()
                return ok({"success": True})

            if action == "restore":
                cur.execute(
                    f"UPDATE {SCHEMA}.board_listings SET is_hidden=false, moderation_status='approved', moderated_at=%s WHERE id=%s",
                    (now, lid),
                )
                conn.commit()
                return ok({"success": True})

            # Редактирование полей
            allowed = {"crop", "region", "price_per_ton", "volume_tons", "quality", "contact", "description", "type", "expires_at"}
            fields = {k: v for k, v in body.items() if k in allowed}
            if not fields:
                return err("Нет допустимых полей для обновления")
            set_sql = ", ".join(f"{k} = %s" for k in fields)
            cur.execute(
                f"UPDATE {SCHEMA}.board_listings SET {set_sql} WHERE id = %s",
                list(fields.values()) + [lid],
            )
            conn.commit()
            return ok({"success": True, "updated": list(fields.keys())})

        # DELETE
        if method == "DELETE" and listing_id:
            cur.execute(
                f"DELETE FROM {SCHEMA}.board_listings WHERE id = %s",
                (int(listing_id),),
            )
            conn.commit()
            return ok({"success": True})

        return err("Неизвестный запрос", 400)

    finally:
        conn.close()
