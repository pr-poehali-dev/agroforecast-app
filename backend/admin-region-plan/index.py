"""
Планы работы по регионам: чтение, сохранение и ИИ-генерация плана-стратегии.
ИИ через Polza.ai (OpenAI-совместимый API).
"""
import json, os
import psycopg2
import urllib.request
import urllib.error

SCHEMA = os.environ.get("MAIN_DB_SCHEMA", "t_p36960093_agroforecast_app")
CORS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, PUT, OPTIONS",
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
    h = {str(k).lower(): v for k, v in (headers or {}).items()}
    token = h.get("x-admin-token", "")
    if not token:
        return False
    cur.execute(f"SELECT id FROM {SCHEMA}.admin_sessions WHERE token=%s AND expires_at > now()", (token,))
    return cur.fetchone() is not None

def ai_plan(region, partner, extra):
    api_key = os.environ.get("POLZA_API_KEY", "")
    if not api_key:
        return None
    prompt = (
        f"Ты — руководитель проекта агротрейдинговой платформы «АгроПорт». "
        f"Составь детальный план работы по региону: {region}. "
        f"Партнёр / точка приёмки: {partner or 'не указан'}. "
        f"Дополнительный контекст: {extra or 'нет'}. "
        "Задача: выявить всех потенциальных поставщиков сельхозпродукции (КФХ, СХО, агрохолдинги), "
        "сформировать базу реальных сельхозпроизводителей и наладить поставки. "
        "План должен включать: цель, этапы с конкретными сроками (в неделях), "
        "приоритетные районы вокруг точки приёмки, действия по сбору базы и квалификации поставщиков, "
        "логистику и приёмку с учётом сезонности культур, критерии успеха с цифрами. "
        "Пиши на русском, структурированно, по этапам, деловым языком. Без markdown-заголовков вида #, "
        "используй обычный текст с нумерацией этапов."
    )
    payload = json.dumps({
        "model": "openai/gpt-4o-mini",
        "messages": [{"role": "user", "content": prompt}],
        "max_tokens": 1800,
        "temperature": 0.6,
    }).encode("utf-8")
    req = urllib.request.Request(
        "https://api.polza.ai/api/v1/chat/completions",
        data=payload,
        headers={"Content-Type": "application/json", "Authorization": f"Bearer {api_key}"},
        method="POST",
    )
    try:
        with urllib.request.urlopen(req, timeout=28) as resp:
            data = json.loads(resp.read())
            return data["choices"][0]["message"]["content"]
    except (urllib.error.URLError, urllib.error.HTTPError, KeyError, ValueError):
        return None

def handler(event: dict, context) -> dict:
    """Планы работы по регионам с ИИ-генерацией стратегии"""
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

    region = params.get("region") or body.get("region") or "Саратовская область"
    action = params.get("action", "")

    # ── Получить план по региону ──
    if method == "GET":
        cur.execute(
            f"SELECT id, region, title, partner, content, updated_at FROM {SCHEMA}.region_plans WHERE region=%s",
            (region,)
        )
        row = cur.fetchone()
        if not row:
            return ok({"plan": None, "region": region})
        cols = ["id", "region", "title", "partner", "content", "updated_at"]
        return ok({"plan": dict(zip(cols, row))})

    # ── ИИ-генерация плана ──
    if method == "POST" and action == "generate":
        partner = body.get("partner", "")
        extra = body.get("extra", "")
        content = ai_plan(region, partner, extra)
        if not content:
            return err("ИИ-сервис недоступен. Проверьте ключ Polza.ai или заполните план вручную.", 502)
        return ok({"content": content})

    # ── Сохранить / обновить план ──
    if method in ("POST", "PUT"):
        title = body.get("title") or f"План работы: {region}"
        partner = body.get("partner", "")
        content = body.get("content", "")
        cur.execute(
            f"""INSERT INTO {SCHEMA}.region_plans (region, title, partner, content)
                VALUES (%s, %s, %s, %s)
                ON CONFLICT (region) DO UPDATE SET
                  title=EXCLUDED.title, partner=EXCLUDED.partner,
                  content=EXCLUDED.content, updated_at=now()
                RETURNING id""",
            (region, title, partner, content)
        )
        return ok({"id": cur.fetchone()[0], "ok": True})

    return err("Неизвестный запрос", 404)