import json
import os
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


def handler(event: dict, context) -> dict:
    """Сохранение и получение пользовательских настроек (регионы, культуры, уведомления, профиль)."""
    if event.get("httpMethod") == "OPTIONS":
        return {"statusCode": 200, "headers": CORS_HEADERS, "body": ""}

    method = event.get("httpMethod", "GET")
    user_id = (event.get("queryStringParameters") or {}).get("user_id", "default")

    conn = get_conn()
    cur = conn.cursor()

    if method == "GET":
        cur.execute(
            f"SELECT regions, crops, notifications, profile, updated_at FROM {SCHEMA}.user_settings WHERE user_id = %s",
            (user_id,)
        )
        row = cur.fetchone()
        cur.close()
        conn.close()

        if not row:
            return {
                "statusCode": 404,
                "headers": CORS_HEADERS,
                "body": json.dumps({"error": "Пользователь не найден"}, ensure_ascii=False),
            }

        result = {
            "user_id": user_id,
            "regions": row[0] or [],
            "crops": row[1] or [],
            "notifications": row[2] or {},
            "profile": row[3] or {},
            "updated_at": row[4].isoformat() if row[4] else None,
        }
        return {"statusCode": 200, "headers": CORS_HEADERS, "body": json.dumps(result, ensure_ascii=False)}

    if method in ("POST", "PUT"):
        body = json.loads(event.get("body") or "{}")
        regions = body.get("regions")
        crops = body.get("crops")
        notifications = body.get("notifications")
        profile = body.get("profile")

        # Build dynamic SET clause
        updates = []
        params = []
        if regions is not None:
            updates.append("regions = %s")
            params.append(regions)
        if crops is not None:
            updates.append("crops = %s")
            params.append(crops)
        if notifications is not None:
            updates.append("notifications = %s")
            params.append(json.dumps(notifications))
        if profile is not None:
            updates.append("profile = %s")
            params.append(json.dumps(profile))

        if not updates:
            cur.close()
            conn.close()
            return {
                "statusCode": 400,
                "headers": CORS_HEADERS,
                "body": json.dumps({"error": "Нет данных для обновления"}, ensure_ascii=False),
            }

        updates.append("updated_at = NOW()")
        params.append(user_id)

        cur.execute(
            f"""
            INSERT INTO {SCHEMA}.user_settings (user_id)
            VALUES (%s)
            ON CONFLICT (user_id) DO NOTHING
            """,
            (user_id,)
        )
        cur.execute(
            f"UPDATE {SCHEMA}.user_settings SET {', '.join(updates)} WHERE user_id = %s",
            params
        )
        conn.commit()
        cur.close()
        conn.close()

        return {
            "statusCode": 200,
            "headers": CORS_HEADERS,
            "body": json.dumps({"ok": True, "updated": len(updates) - 1}, ensure_ascii=False),
        }

    cur.close()
    conn.close()
    return {"statusCode": 405, "headers": CORS_HEADERS, "body": json.dumps({"error": "Method not allowed"})}
