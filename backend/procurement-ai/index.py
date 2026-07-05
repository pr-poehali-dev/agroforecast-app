"""
ИИ-менеджер по закупкам агропродукции.
Генерирует письма/сообщения уровня профессионала с 20-летним стажем
(знание агрорынка, техник продаж, переговоров и ГОСТов) и отправляет их
через SMTP (email) с подтверждением менеджера. MAX-канал — задел на будущее.
"""
import json, os, smtplib, ssl
import psycopg2
import urllib.request
import urllib.error
from datetime import datetime, timezone, timedelta
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from email.header import Header
from email.utils import formataddr

SCHEMA = os.environ.get("MAIN_DB_SCHEMA", "t_p36960093_agroforecast_app")
CORS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, X-Admin-Token",
    "Content-Type": "application/json",
}

# ── Экспертный профиль ИИ-закупщика (система) ────────────────────────────────
PROCUREMENT_SYSTEM = (
    "Ты — Юрий, ведущий менеджер по закупкам сельхозпродукции агротрейдера «АгроПорт» "
    "(Саратовская область, база в г. Аткарск) с 20-летним опытом. "
    "Ты закупаешь у сельхозпроизводителей пшеницу, рожь и подсолнечник напрямую с полей и элеваторов.\n\n"
    "ТВОЯ ЭКСПЕРТИЗА:\n"
    "• Техники продаж и переговоров: установление контакта, выявление потребности (SPIN), "
    "работа с возражениями, торг по цене без демпинга, закрытие сделки, апселл на постоянное сотрудничество.\n"
    "• Специфика агрорынка: сезонность, логистика (авто/ж-д, элеваторы), базис поставки (франко-склад, "
    "СРТ, самовывоз), НДС и работа с ЕСХН/ОСНО, форвардные контракты, авансирование, качество и приёмка.\n"
    "• ГОСТы по качеству:\n"
    "  – Пшеница: ГОСТ 9353-2016. Классы 1-5, показатели: клейковина (%), ИДК, натура (г/л), "
    "число падения, влажность (≤14%), сорная/зерновая примесь, стекловидность, протеин.\n"
    "  – Рожь: ГОСТ 16990-2017. Классы, число падения, натура, влажность, примеси.\n"
    "  – Подсолнечник: ГОСТ 22391-2015. Масличность, влажность (≤7% для хранения), "
    "сорная/масличная примесь, кислотное число масла.\n\n"
    "СТИЛЬ: деловой, уверенный, уважительный, конкретный. Оперируешь фактами и показателями качества, "
    "говоришь на языке аграриев. Всегда предлагаешь понятный следующий шаг. "
    "Не выдумывай цены и объёмы, если их нет — предлагай обсудить. Пиши на русском.\n\n"
    "ПРАВИЛА ВЕЖЛИВОСТИ (строго соблюдай):\n"
    "• Всегда здоровайся и обращайся уважительно, по имени-отчеству, если оно известно.\n"
    "• Никакого давления, спама и навязчивости. Уважай занятость аграрника (посевная, уборка).\n"
    "• Пиши кратко и по делу — цени время собеседника. Никакого агрессивного дожима.\n"
    "• Если поставщик отказался или просит не беспокоить — вежливо поблагодари и не настаивай.\n"
    "• Тон всегда доброжелательный и партнёрский, а не 'продающий любой ценой'.\n"
    "• Благодари за ответ и всегда оставляй хорошее впечатление о компании."
)


# Ссылка на MAX-бота для приглашения поставщиков в быстрый чат
MAX_BOT_URL = os.environ.get("MAX_BOT_URL", "https://max.ru/id631205241205_1_bot")

# Реквизиты менеджера/компании для подписи писем
MANAGER_NAME = os.environ.get("MANAGER_NAME", "Александр")
MANAGER_PHONE = os.environ.get("MANAGER_PHONE", "+7 927 748-68-68")
MANAGER_EMAIL = os.environ.get("SMTP_USER", "")
COMPANY_NAME = os.environ.get("COMPANY_NAME", "АгроПорт")


# Рабочее время ИИ-закупщика: 9:00–17:00 по будням, часовой пояс Саратова (UTC+4)
WORK_TZ = timezone(timedelta(hours=int(os.environ.get("WORK_TZ_OFFSET", "4"))))
WORK_START = int(os.environ.get("WORK_HOUR_START", "9"))
WORK_END = int(os.environ.get("WORK_HOUR_END", "17"))


def within_working_hours():
    """True, если сейчас рабочее время (пн-пт, 9:00–17:00). Возвращает (ok, now_local)."""
    now = datetime.now(WORK_TZ)
    is_weekday = now.weekday() < 5           # 0=пн ... 4=пт
    is_hours = WORK_START <= now.hour < WORK_END
    return (is_weekday and is_hours), now


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


def ai_text(prompt, system="", temperature=0.5, max_tokens=1100):
    """Вызов ИИ Polza.ai — возвращает текст или None."""
    api_key = os.environ.get("POLZA_API_KEY", "")
    if not api_key:
        return None
    messages = []
    if system:
        messages.append({"role": "system", "content": system})
    messages.append({"role": "user", "content": prompt})
    payload = json.dumps({
        "model": "openai/gpt-4o-mini",
        "messages": messages,
        "temperature": temperature,
        "max_tokens": max_tokens,
    }).encode("utf-8")
    r = urllib.request.Request(
        "https://api.polza.ai/api/v1/chat/completions",
        data=payload,
        headers={"Content-Type": "application/json", "Authorization": f"Bearer {api_key}"},
        method="POST",
    )
    try:
        with urllib.request.urlopen(r, timeout=40) as resp:
            data = json.loads(resp.read())
        return data["choices"][0]["message"]["content"].strip()
    except urllib.error.HTTPError as e:
        print(f"[ai_text] HTTPError {e.code}: {e.read().decode()[:300]}")
        return None
    except Exception as ex:
        print(f"[ai_text] error: {ex}")
        return None


def load_supplier(cur, sid):
    cur.execute(f"""SELECT id, name, inn, region, district, locality, crops, activity,
                           volume_tons, contact_person, phone, email, address, ownership,
                           revenue, staff_count, founded_year, status, notes, ai_analysis
                    FROM {SCHEMA}.suppliers WHERE id=%s""", (sid,))
    row = cur.fetchone()
    if not row:
        return None
    keys = ["id", "name", "inn", "region", "district", "locality", "crops", "activity",
            "volume_tons", "contact_person", "phone", "email", "address", "ownership",
            "revenue", "staff_count", "founded_year", "status", "notes", "ai_analysis"]
    return dict(zip(keys, row))


def supplier_text(p):
    return "\n".join([
        f"Название: {p.get('name') or '—'}",
        f"ИНН: {p.get('inn') or '—'}",
        f"Район: {p.get('district') or '—'}, {p.get('locality') or ''}",
        f"Культуры/продукция: {p.get('crops') or '—'}",
        f"Направление: {p.get('activity') or '—'}",
        f"Руководитель/контакт: {p.get('contact_person') or '—'}",
        f"Объём (тонн): {p.get('volume_tons') if p.get('volume_tons') is not None else '—'}",
        f"Досье: {p.get('ai_analysis') or '—'}",
    ])


def send_email(to_addr, subject, body):
    """Отправка письма через SMTP. Возвращает (ok: bool, error: str)."""
    host = os.environ.get("SMTP_HOST", "")
    user = os.environ.get("SMTP_USER", "")
    password = os.environ.get("SMTP_PASS", "")
    port = int(os.environ.get("SMTP_PORT", "465") or "465")
    if not (host and user and password):
        return False, "Не настроены SMTP-данные (SMTP_HOST / SMTP_USER / SMTP_PASS)."
    msg = MIMEMultipart()
    msg["From"] = formataddr((str(Header("АгроПорт · Закупки", "utf-8")), user))
    msg["To"] = to_addr
    msg["Subject"] = str(Header(subject, "utf-8"))
    msg.attach(MIMEText(body, "plain", "utf-8"))
    try:
        if port == 465:
            ctx = ssl.create_default_context()
            with smtplib.SMTP_SSL(host, port, context=ctx, timeout=25) as s:
                s.login(user, password)
                s.sendmail(user, [to_addr], msg.as_string())
        else:
            with smtplib.SMTP(host, port, timeout=25) as s:
                s.ehlo()
                s.starttls(context=ssl.create_default_context())
                s.login(user, password)
                s.sendmail(user, [to_addr], msg.as_string())
        return True, ""
    except Exception as ex:
        print(f"[send_email] error: {ex}")
        return False, str(ex)


def send_max(chat_id, text):
    """Отправка сообщения через MAX Bot API. Возвращает (ok: bool, error: str).
    chat_id — числовой идентификатор чата/пользователя (получаем, когда клиент сам напишет боту)."""
    token = os.environ.get("MAX_BOT_TOKEN", "")
    if not token:
        return False, "Не задан токен MAX-бота (MAX_BOT_TOKEN)."
    if not chat_id or not str(chat_id).strip().lstrip("-").isdigit():
        return False, "Для MAX нужен числовой chat_id получателя (клиент должен сначала написать боту)."
    url = f"https://botapi.max.ru/messages?access_token={token}&chat_id={int(chat_id)}"
    payload = json.dumps({"text": text}).encode("utf-8")
    r = urllib.request.Request(url, data=payload, headers={"Content-Type": "application/json"}, method="POST")
    try:
        with urllib.request.urlopen(r, timeout=20) as resp:
            resp.read()
        return True, ""
    except urllib.error.HTTPError as e:
        detail = e.read().decode()[:300]
        print(f"[send_max] HTTPError {e.code}: {detail}")
        return False, f"MAX API {e.code}: {detail}"
    except Exception as ex:
        print(f"[send_max] error: {ex}")
        return False, str(ex)


def handler(event: dict, context) -> dict:
    """ИИ-менеджер по закупкам: генерация писем/сообщений и отправка через SMTP/MAX с подтверждением."""
    method = event.get("httpMethod", "GET")
    if method == "OPTIONS":
        return {"statusCode": 200, "headers": CORS, "body": ""}

    params = event.get("queryStringParameters") or {}
    action = params.get("action", "")
    try:
        body = json.loads(event.get("body") or "{}")
    except Exception:
        body = {}

    conn = get_db()
    cur = conn.cursor()

    # ── Webhook MAX: приём входящих сообщений (публичный, без admin-токена) ──
    if action == "max_webhook":
        upd = body or {}
        msg = upd.get("message") or {}
        # Структура MAX: message.recipient.chat_id, message.sender, message.body.text
        chat_id = (msg.get("recipient") or {}).get("chat_id") or (msg.get("sender") or {}).get("user_id")
        sender = msg.get("sender") or {}
        sender_name = sender.get("name") or sender.get("username") or ""
        text_in = (msg.get("body") or {}).get("text") or upd.get("text") or ""
        if chat_id:
            # пытаемся привязать к поставщику по имени контакта
            cur.execute(
                f"""SELECT id FROM {SCHEMA}.suppliers
                    WHERE max_chat_id = %s
                       OR (contact_person IS NOT NULL AND contact_person <> '' AND %s ILIKE '%%' || contact_person || '%%')
                    ORDER BY (max_chat_id = %s) DESC LIMIT 1""",
                (chat_id, sender_name, chat_id)
            )
            row = cur.fetchone()
            matched = row[0] if row else None
            if matched:
                cur.execute(f"UPDATE {SCHEMA}.suppliers SET max_chat_id=%s WHERE id=%s", (chat_id, matched))
            cur.execute(
                f"INSERT INTO {SCHEMA}.max_inbox (chat_id, sender_name, text, supplier_id) VALUES (%s, %s, %s, %s)",
                (chat_id, sender_name, text_in, matched)
            )
        return ok({"ok": True})

    if not verify_admin(cur, event.get("headers")):
        return err("Требуется авторизация администратора", 401)

    sid = params.get("id") or body.get("id")

    # ── Разовая регистрация webhook MAX-бота ──
    if method == "POST" and action == "max_setup":
        token = os.environ.get("MAX_BOT_TOKEN", "")
        if not token:
            return err("Не задан токен MAX-бота (MAX_BOT_TOKEN).", 400)
        webhook_url = body.get("webhook_url", "")
        if not webhook_url:
            return err("Не указан webhook_url")
        api = f"https://botapi.max.ru/subscriptions?access_token={token}"
        payload = json.dumps({"url": webhook_url, "update_types": ["message_created"]}).encode("utf-8")
        r = urllib.request.Request(api, data=payload, headers={"Content-Type": "application/json"}, method="POST")
        try:
            with urllib.request.urlopen(r, timeout=20) as resp:
                res = resp.read().decode()
            return ok({"ok": True, "response": res[:300]})
        except urllib.error.HTTPError as e:
            return err(f"MAX API {e.code}: {e.read().decode()[:300]}", 502)
        except Exception as ex:
            return err(str(ex), 502)

    # ── Отдать сохранённый MAX chat_id и последние входящие по поставщику ──
    if method == "GET" and action == "max_status" and sid:
        cur.execute(f"SELECT max_chat_id FROM {SCHEMA}.suppliers WHERE id=%s", (sid,))
        r = cur.fetchone()
        chat_id = r[0] if r else None
        cur.execute(
            f"""SELECT sender_name, text, created_at FROM {SCHEMA}.max_inbox
                WHERE supplier_id=%s OR chat_id=%s ORDER BY created_at DESC LIMIT 10""",
            (sid, chat_id)
        )
        inbox = [{"sender": s, "text": t, "created_at": c} for s, t, c in cur.fetchall()]
        return ok({"max_chat_id": chat_id, "inbox": inbox})

    # ── Сгенерировать письмо/сообщение ИИ-закупщиком (черновик) ──
    if method == "POST" and action == "compose":
        p = load_supplier(cur, sid)
        if not p:
            return err("Поставщик не найден", 404)
        channel = body.get("channel", "email")
        goal = body.get("goal", "first_contact")
        extra = (body.get("instructions") or "").strip()

        goal_map = {
            "first_contact": "Первичное касание: представиться, обозначить интерес к закупке их культур, предложить обсудить условия.",
            "price_request": "Запросить актуальные цены, объёмы и качество (с показателями по ГОСТ), сроки и базис поставки.",
            "negotiation": "Переговоры по цене и условиям: обосновать нашу цену, отработать возможные возражения, двигаться к сделке.",
            "follow_up": "Напоминание/дожим после предыдущего контакта, мягко подтолкнуть к следующему шагу.",
            "contract": "Предложить перейти к заключению договора поставки, обозначить ключевые условия.",
        }
        goal_text = goal_map.get(goal, goal_map["first_contact"])
        length = "короткое сообщение (3-5 предложений, без темы письма)" if channel == "max" else "письмо"

        signature = (
            f"МОИ РЕКВИЗИТЫ ДЛЯ ПОДПИСИ (используй именно их, без заглушек-плейсхолдеров):\n"
            f"Имя: {MANAGER_NAME}\n"
            f"Компания: {COMPANY_NAME}, менеджер по закупкам\n"
            f"Телефон: {MANAGER_PHONE}\n"
            + (f"Email: {MANAGER_EMAIL}\n" if MANAGER_EMAIL else "")
        )
        prompt = (
            f"Составь {length} поставщику от лица менеджера по закупкам.\n\n"
            f"ДАННЫЕ ПОСТАВЩИКА:\n{supplier_text(p)}\n\n"
            f"ЦЕЛЬ ОБРАЩЕНИЯ: {goal_text}\n"
            + (f"ДОП. УКАЗАНИЯ МЕНЕДЖЕРА: {extra}\n" if extra else "")
            + f"\n{signature}\n"
            + "\nТребования:\n"
            "• Обращайся по имени, если известно контактное лицо.\n"
            "• Упомяни конкретные культуры этого хозяйства и релевантные показатели качества по ГОСТ.\n"
            "• Профессионально, по делу, с чётким следующим шагом.\n"
            "• В подписи используй ТОЛЬКО мои реквизиты выше. НЕ пиши «[ваш номер]», «[ваш email]» и подобные заглушки.\n"
            + ("• Верни ТОЛЬКО текст письма. В ПЕРВОЙ строке укажи «Тема: ...», далее пустая строка и тело письма."
               if channel == "email" else "• Верни только текст сообщения, без темы.")
        )
        text = ai_text(prompt, system=PROCUREMENT_SYSTEM, temperature=0.6, max_tokens=1100)
        if not text:
            return err("ИИ-генерация временно недоступна. Попробуйте позже.", 502)

        subject = ""
        b = text
        if channel == "email" and text.lower().startswith("тема:"):
            first_nl = text.find("\n")
            subject = text[len("тема:"):first_nl].strip() if first_nl != -1 else text[len("тема:"):].strip()
            b = text[first_nl:].strip() if first_nl != -1 else ""
        if channel == "email" and not subject:
            subject = f"Закупка сельхозпродукции — {p.get('name') or 'сотрудничество'}"

        # В email добавляем приглашение в MAX-бот для быстрой связи
        if channel == "email" and MAX_BOT_URL and MAX_BOT_URL not in b:
            b = (b.rstrip()
                 + "\n\nP.S. Для быстрой связи вы можете написать нам в мессенджере MAX — "
                 + f"наш чат закупок: {MAX_BOT_URL}\n"
                 + "Ответим оперативно, обсудим цену и условия поставки.")

        recipient = p.get("email") if channel == "email" else (p.get("phone") or "")
        cur.execute(
            f"""INSERT INTO {SCHEMA}.supplier_messages (supplier_id, channel, recipient, subject, body, status)
                VALUES (%s, %s, %s, %s, %s, 'draft') RETURNING id""",
            (p["id"], channel, recipient, subject, b)
        )
        msg_id = cur.fetchone()[0]
        return ok({"id": msg_id, "channel": channel, "recipient": recipient, "subject": subject, "body": b})

    # ── Проверить, рабочее ли сейчас время (для фронта) ──
    if method == "GET" and action == "work_hours":
        allowed, now = within_working_hours()
        return ok({
            "allowed": allowed,
            "now": now.strftime("%H:%M"),
            "weekday": now.weekday(),
            "window": f"{WORK_START:02d}:00–{WORK_END:02d}:00, пн–пт",
        })

    # ── Отправить черновик (после подтверждения менеджера) ──
    if method == "POST" and action == "send":
        msg_id = body.get("message_id")
        if not msg_id:
            return err("Не указан message_id")
        # Ограничение по рабочему времени 9:00–17:00 (пн-пт), чтобы не беспокоить поставщиков
        allowed, now = within_working_hours()
        if not allowed and not body.get("force"):
            return err(
                f"Сейчас {now.strftime('%H:%M')} — вне рабочего времени закупщика "
                f"({WORK_START:02d}:00–{WORK_END:02d}:00, пн–пт). "
                "Чтобы не беспокоить поставщика, отправка отложена. "
                "Можно отправить принудительно, подтвердив это.",
                423,
            )
        cur.execute(
            f"""SELECT id, supplier_id, channel, recipient, subject, body, status
                FROM {SCHEMA}.supplier_messages WHERE id=%s""", (msg_id,)
        )
        row = cur.fetchone()
        if not row:
            return err("Сообщение не найдено", 404)
        _, s_id, channel, recipient, subject, mbody, status = row
        # Защита от навязчивости: не чаще одного касания в 3 дня (если не force)
        min_gap = int(os.environ.get("MIN_CONTACT_GAP_DAYS", "3"))
        cur.execute(
            f"""SELECT sent_at FROM {SCHEMA}.supplier_messages
                WHERE supplier_id=%s AND status='sent' AND sent_at IS NOT NULL
                ORDER BY sent_at DESC LIMIT 1""", (s_id,)
        )
        last = cur.fetchone()
        if last and last[0] and not body.get("force"):
            days_passed = (datetime.now() - last[0]).days
            if days_passed < min_gap:
                return err(
                    f"Поставщику уже писали {days_passed} дн. назад. Чтобы не быть навязчивыми, "
                    f"следующее касание рекомендуем не раньше чем через {min_gap} дн. "
                    "Можно отправить принудительно.",
                    429,
                )
        # можно переопределить получателя/текст с фронта (после ручной правки)
        recipient = (body.get("recipient") or recipient or "").strip()
        subject = body.get("subject", subject)
        mbody = body.get("body", mbody)
        # для MAX без явного chat_id пробуем сохранённый у поставщика
        if channel == "max" and (not recipient or not recipient.lstrip("-").isdigit()):
            cur.execute(f"SELECT max_chat_id FROM {SCHEMA}.suppliers WHERE id=%s", (s_id,))
            r = cur.fetchone()
            if r and r[0]:
                recipient = str(r[0])
        if not recipient:
            return err("Не указан получатель (email/адрес).")

        if channel == "email":
            success, error_text = send_email(recipient, subject or "Сообщение от АгроПорт", mbody)
        else:
            success, error_text = send_max(recipient, mbody)

        if success:
            cur.execute(
                f"UPDATE {SCHEMA}.supplier_messages SET status='sent', sent_at=now(), recipient=%s, subject=%s, body=%s, error=NULL WHERE id=%s",
                (recipient, subject, mbody, msg_id)
            )
            cur.execute(
                f"INSERT INTO {SCHEMA}.supplier_interactions (supplier_id, type, content) VALUES (%s, %s, %s)",
                (s_id, "email" if channel == "email" else "note", f"Отправлено сообщение: {subject or mbody[:60]}")
            )
            cur.execute(f"UPDATE {SCHEMA}.suppliers SET last_contact_at=now() WHERE id=%s", (s_id,))
            return ok({"sent": True})
        else:
            cur.execute(
                f"UPDATE {SCHEMA}.supplier_messages SET status='failed', error=%s WHERE id=%s",
                (error_text, msg_id)
            )
            return err(f"Не удалось отправить: {error_text}", 502)

    # ── История сообщений по поставщику ──
    if method == "GET" and action == "messages" and sid:
        cur.execute(
            f"""SELECT id, channel, recipient, subject, body, status, error, created_at, sent_at
                FROM {SCHEMA}.supplier_messages WHERE supplier_id=%s ORDER BY created_at DESC""",
            (sid,)
        )
        keys = ["id", "channel", "recipient", "subject", "body", "status", "error", "created_at", "sent_at"]
        items = [dict(zip(keys, r)) for r in cur.fetchall()]
        return ok({"messages": items})

    return err("Неизвестный запрос", 404)