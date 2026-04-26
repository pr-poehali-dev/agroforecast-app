"""
ИИ-агент менеджер проекта АгроПорт.
Принимает сообщения от администратора, отвечает как менеджер проекта.
История хранится в БД (agent_messages).
"""
import json, os
import psycopg2
import urllib.request
import urllib.error

SCHEMA = os.environ.get("MAIN_DB_SCHEMA", "t_p36960093_agroforecast_app")
CORS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, X-Admin-Token",
    "Content-Type": "application/json",
}

SYSTEM_PROMPT = """Ты — Алексей Громов, опытный менеджер проекта «АгроПорт». 
Ты отвечаешь только перед Администратором сайта и действуешь строго в рамках утверждённой Стратегии развития экосистемы «АгроПорт».

СТРАТЕГИЯ:
Этап 1 (0–6 мес) — Запуск ядра: веб-интерфейс, мобильное приложение, прогноз урожайности по NDVI, карта, уведомления, калькулятор рентабельности. Цель: 1000+ пользователей, активность 30%.
Этап 2 (6–12 мес) — Расширение: маркетплейс, логистика, ERP-интеграция, аналитика, библиотека знаний. Цель: 5000+ пользователей, 100+ сделок/мес, тариф PRO за 4990 руб/мес.
Этап 3 (12–24 мес) — ИИ и Big Data: улучшенные модели прогнозирования, предиктивная диагностика, цифровые двойники полей, API для разработчиков. Цель: MAPE < 10%, 20+ приложений через API.
Этап 4 (24+ мес) — Масштабирование: вся РФ, СНГ, точное земледелие, блокчейн, программа лояльности. Цель: 50 000+ пользователей, выход на 2+ зарубежных рынка.

Монетизация: freemium → PRO (4990 руб/мес) → корпоративный → API.

ТВОИ ОБЯЗАННОСТИ:
- Составлять детальные планы действий по каждому этапу
- Расставлять приоритеты задач
- Отслеживать прогресс и предлагать корректирующие меры
- Давать конкретные рекомендации с цифрами и сроками
- Выявлять риски и предлагать способы их снижения
- Готовить отчёты о статусе проекта

СТИЛЬ ОБЩЕНИЯ:
- Деловой, конкретный, с цифрами
- Используй маркированные списки и структуру
- Всегда предлагай следующие шаги
- Отвечай на русском языке"""

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

def call_ai(messages):
    api_key = os.environ.get("DEEPSEEK_API_KEY", "")
    if not api_key:
        return "ИИ-агент временно недоступен: не настроен API-ключ DeepSeek."

    payload = json.dumps({
        "model": "deepseek-chat",
        "messages": messages,
        "max_tokens": 1500,
        "temperature": 0.7
    }).encode("utf-8")

    req = urllib.request.Request(
        "https://api.deepseek.com/chat/completions",
        data=payload,
        headers={"Content-Type": "application/json", "Authorization": f"Bearer {api_key}"},
        method="POST"
    )
    try:
        with urllib.request.urlopen(req, timeout=25) as resp:
            data = json.loads(resp.read())
            return data["choices"][0]["message"]["content"]
    except urllib.error.HTTPError as e:
        body = e.read().decode()
        return f"Ошибка DeepSeek: {e.code}. {body[:200]}"
    except Exception as ex:
        return f"Ошибка соединения: {str(ex)}"

def handler(event: dict, context) -> dict:
    """ИИ-агент менеджер проекта: чат, история сообщений"""
    if event.get("httpMethod") == "OPTIONS":
        return {"statusCode": 200, "headers": CORS, "body": ""}

    method = event.get("httpMethod", "GET")
    headers = event.get("headers", {})
    params = event.get("queryStringParameters") or {}
    token = headers.get("x-admin-token", "") or params.get("token", "")

    db = get_db()
    cur = db.cursor()

    if not verify_token(cur, token):
        return err("Не авторизован", 401)

    # GET — история сообщений
    if method == "GET":
        limit = int(params.get("limit", 50))
        cur.execute(f"SELECT id, role, content, created_at FROM {SCHEMA}.agent_messages ORDER BY created_at DESC LIMIT %s", (limit,))
        cols = ["id","role","content","created_at"]
        items = [dict(zip(cols, r)) for r in cur.fetchall()]
        items.reverse()
        return ok({"messages": items})

    # DELETE — очистить историю
    if method == "DELETE":
        cur.execute(f"DELETE FROM {SCHEMA}.agent_messages")
        return ok({"ok": True})

    # POST — отправить сообщение агенту
    if method == "POST":
        body = {}
        if event.get("body"):
            try: body = json.loads(event["body"])
            except: pass
        
        user_message = body.get("message", "").strip()
        if not user_message:
            return err("Сообщение не может быть пустым")

        # Сохраняем сообщение пользователя
        cur.execute(f"INSERT INTO {SCHEMA}.agent_messages (role, content) VALUES (%s, %s)", ("user", user_message))

        # Получаем последние 20 сообщений для контекста
        cur.execute(f"SELECT role, content FROM {SCHEMA}.agent_messages ORDER BY created_at DESC LIMIT 20")
        history = [{"role": r[0], "content": r[1]} for r in cur.fetchall()]
        history.reverse()

        # Формируем запрос к OpenAI
        messages = [{"role": "system", "content": SYSTEM_PROMPT}] + history

        reply = call_ai(messages)

        # Сохраняем ответ агента
        cur.execute(f"INSERT INTO {SCHEMA}.agent_messages (role, content) VALUES (%s, %s)", ("assistant", reply))
        cur.execute(f"SELECT id, created_at FROM {SCHEMA}.agent_messages ORDER BY created_at DESC LIMIT 1")
        row = cur.fetchone()

        return ok({"reply": reply, "id": row[0] if row else None})

    return err("Неизвестный запрос", 404)