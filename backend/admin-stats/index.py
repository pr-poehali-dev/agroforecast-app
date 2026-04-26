"""
Статистика и аналитика: регистрации, пользователи, баллы, заявки, активность.
"""
import json, os
import psycopg2

SCHEMA = os.environ.get("MAIN_DB_SCHEMA", "t_p36960093_agroforecast_app")
CORS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, OPTIONS",
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
    """Статистика платформы для кабинета администратора"""
    if event.get("httpMethod") == "OPTIONS":
        return {"statusCode": 200, "headers": CORS, "body": ""}

    headers = event.get("headers", {})
    db = get_db()
    cur = db.cursor()

    if not verify_admin(cur, headers):
        return err("Не авторизован", 401)

    params = event.get("queryStringParameters") or {}
    period = params.get("period", "30")  # дней

    # ── Общие счётчики ──
    cur.execute(f"SELECT COUNT(*) FROM {SCHEMA}.users")
    total_users = cur.fetchone()[0]

    cur.execute(f"SELECT COUNT(*) FROM {SCHEMA}.users WHERE is_verified=true")
    verified_users = cur.fetchone()[0]

    cur.execute(f"SELECT COUNT(*) FROM {SCHEMA}.users WHERE is_blocked=true")
    blocked_users = cur.fetchone()[0]

    cur.execute(f"SELECT COALESCE(SUM(loyalty_points),0) FROM {SCHEMA}.users")
    total_points = cur.fetchone()[0]

    cur.execute(f"SELECT COUNT(*) FROM {SCHEMA}.users WHERE created_at >= now() - interval '{period} days'")
    new_users = cur.fetchone()[0]

    cur.execute(f"SELECT COUNT(*) FROM {SCHEMA}.appeals")
    total_appeals = cur.fetchone()[0]

    cur.execute(f"SELECT COUNT(*) FROM {SCHEMA}.appeals WHERE status='new'")
    new_appeals = cur.fetchone()[0]

    cur.execute(f"SELECT COUNT(*) FROM {SCHEMA}.news WHERE is_published=true")
    total_news = cur.fetchone()[0]

    # ── Регистрации по дням (последние N дней) ──
    cur.execute(
        f"""SELECT DATE(created_at) as day, COUNT(*) as cnt
            FROM {SCHEMA}.users
            WHERE created_at >= now() - interval '{period} days'
            GROUP BY day ORDER BY day""",
    )
    reg_by_day = [{"date": str(row[0]), "count": row[1]} for row in cur.fetchall()]

    # ── Пользователи по роли ──
    cur.execute(f"SELECT role, COUNT(*) FROM {SCHEMA}.users GROUP BY role ORDER BY COUNT(*) DESC")
    by_role = [{"role": row[0], "count": row[1]} for row in cur.fetchall()]

    # ── Пользователи по плану ──
    cur.execute(f"SELECT plan, COUNT(*) FROM {SCHEMA}.users GROUP BY plan ORDER BY COUNT(*) DESC")
    by_plan = [{"plan": row[0], "count": row[1]} for row in cur.fetchall()]

    # ── Заявки по статусу ──
    cur.execute(f"SELECT status, COUNT(*) FROM {SCHEMA}.appeals GROUP BY status")
    appeals_by_status = {row[0]: row[1] for row in cur.fetchall()}

    # ── Последние регистрации ──
    cur.execute(
        f"""SELECT id, email, full_name, role, plan, created_at
            FROM {SCHEMA}.users ORDER BY created_at DESC LIMIT 5"""
    )
    cols = ["id","email","full_name","role","plan","created_at"]
    recent_users = [dict(zip(cols, row)) for row in cur.fetchall()]

    return ok({
        "summary": {
            "total_users": total_users,
            "verified_users": verified_users,
            "blocked_users": blocked_users,
            "new_users": new_users,
            "total_points": total_points,
            "total_appeals": total_appeals,
            "new_appeals": new_appeals,
            "total_news": total_news,
        },
        "reg_by_day": reg_by_day,
        "by_role": by_role,
        "by_plan": by_plan,
        "appeals_by_status": appeals_by_status,
        "recent_users": recent_users,
        "period": int(period),
    })
