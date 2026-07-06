"""
CRM АгроПорт — полный CRUD через ?action=...&id=...
action: dashboard, kanban,
        contacts_list, contacts_get, contacts_create, contacts_update,
        leads_list, leads_create, leads_update,
        deals_list, deals_create, deals_update,
        tasks_list, tasks_create, tasks_update,
        activities_list, activities_create,
        comments_list, comments_create
"""
import json, os, hashlib, hmac, time, base64
import urllib.request, urllib.error
from datetime import datetime, timezone
import psycopg2

CORS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, PUT, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Authorization, X-Admin-Token",
    "Content-Type": "application/json",
}

SCHEMA = os.environ.get("MAIN_DB_SCHEMA", "t_p36960093_agroforecast_app")
# Общий владелец CRM-данных для команды (при входе через админку)
CRM_ADMIN_UID = int(os.environ.get("CRM_ADMIN_UID", "1"))

DEAL_STAGES = [
    {"id": "new",         "label": "Новая",           "color": "#6b7280"},
    {"id": "contact",     "label": "Контакт",          "color": "#3b82f6"},
    {"id": "qualify",     "label": "Квалификация",     "color": "#8b5cf6"},
    {"id": "proposal",    "label": "КП отправлено",    "color": "#f59e0b"},
    {"id": "negotiation", "label": "Переговоры",       "color": "#f97316"},
    {"id": "won",         "label": "Сделка закрыта",   "color": "#2E7D32"},
    {"id": "lost",        "label": "Потеряна",         "color": "#ef4444"},
]

TASK_STATUSES = [
    {"id": "todo",        "label": "К выполнению"},
    {"id": "in_progress", "label": "В работе"},
    {"id": "review",      "label": "На проверке"},
    {"id": "done",        "label": "Завершена"},
]

# Рекомендуемое следующее действие по стадии сделки (fallback без ИИ)
STAGE_NEXT_STEP = {
    "new":         "Связаться с хозяйством, представиться и уточнить готовность продавать урожай.",
    "contact":     "Выявить культуру, объём, качество и ориентир по цене. Квалифицировать сделку.",
    "qualify":     "Подготовить и отправить коммерческое предложение с ценой и условиями поставки.",
    "proposal":    "Дожать до переговоров: уточнить, устроила ли цена, снять возражения.",
    "negotiation": "Согласовать финальную цену, объём и базис поставки. Готовить договор.",
    "won":         "Оформить договор, организовать отгрузку и логистику.",
    "lost":        "Зафиксировать причину отказа и запланировать повторный контакт через сезон.",
}
STAGE_PROBABILITY = {"new": 10, "contact": 25, "qualify": 40, "proposal": 60,
                     "negotiation": 80, "won": 100, "lost": 0}

CRM_AI_SYSTEM = (
    "Ты — Юрий, ведущий менеджер по закупкам сельхозпродукции агротрейдера «АгроПорт» "
    "(Саратовская область) с 20-летним опытом. Помогаешь вести сделки в CRM: "
    "коротко и по делу подсказываешь следующий шаг, оцениваешь риски и пишешь деловые письма аграриям. "
    "Знаешь ГОСТы (пшеница 9353-2016, рожь 16990-2017, подсолнечник 22391-2015), базисы поставки, сезонность. "
    "Пиши на русском, конкретно, уважительно, без воды и давления."
)


def ai_text(prompt, system="", temperature=0.5, max_tokens=900):
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
    req = urllib.request.Request(
        "https://api.polza.ai/api/v1/chat/completions",
        data=payload,
        headers={"Content-Type": "application/json", "Authorization": f"Bearer {api_key}"},
        method="POST",
    )
    try:
        with urllib.request.urlopen(req, timeout=40) as r:
            data = json.loads(r.read())
        return data["choices"][0]["message"]["content"].strip()
    except Exception as ex:
        print(f"[ai_text] error: {ex}")
        return None


def get_db():
    return psycopg2.connect(os.environ["DATABASE_URL"])

def resp(status, body):
    return {"statusCode": status, "headers": CORS, "body": json.dumps(body, ensure_ascii=False, default=str)}

def verify_jwt(token: str):
    try:
        encoded, sig = token.rsplit(".", 1)
        secret = os.environ.get("JWT_SECRET", "agroport-secret")
        expected = hmac.new(secret.encode(), encoded.encode(), hashlib.sha256).hexdigest()
        if not hmac.compare_digest(sig, expected):
            return None
        payload = json.loads(base64.b64decode(encoded).decode())
        if payload.get("exp", 0) < time.time():
            return None
        return payload
    except Exception:
        return None

def verify_admin_token(token: str):
    """Проверка админ-токена по таблице admin_sessions. Возвращает payload с общим uid команды."""
    if not token:
        return None
    conn = None
    try:
        conn = get_db()
        cur = conn.cursor()
        cur.execute(
            f"SELECT id FROM {SCHEMA}.admin_sessions WHERE token=%s AND expires_at > now()",
            (token,),
        )
        row = cur.fetchone()
        cur.close()
        if row:
            return {"uid": CRM_ADMIN_UID, "is_admin": True}
        return None
    except Exception:
        return None
    finally:
        if conn:
            conn.close()


def get_auth(event):
    headers = event.get("headers", {}) or {}
    hl = {str(k).lower(): v for k, v in headers.items()}
    # 1) Админ-токен (вход через админку) — общий доступ ко всей CRM
    admin_token = hl.get("x-admin-token", "")
    if admin_token:
        p = verify_admin_token(admin_token)
        if p:
            return p
    # 2) JWT пользователя (личный кабинет)
    auth = hl.get("x-authorization") or hl.get("authorization", "")
    token = auth.replace("Bearer ", "").strip()
    return verify_jwt(token)

def rows_to_dicts(cur, rows):
    cols = [d[0] for d in cur.description]
    return [dict(zip(cols, row)) for row in rows]

def handler(event: dict, context) -> dict:
    """CRM АгроПорт — контакты, лиды, сделки, задачи, активности, Kanban."""
    if event.get("httpMethod") == "OPTIONS":
        return {"statusCode": 200, "headers": CORS, "body": ""}

    payload = get_auth(event)
    if not payload:
        return resp(401, {"error": "Не авторизован"})

    uid = payload["uid"]
    method = event.get("httpMethod", "GET")
    params = event.get("queryStringParameters") or {}
    action = params.get("action", "")
    eid = params.get("id")
    if eid and str(eid).isdigit():
        eid = int(eid)

    body = {}
    if event.get("body"):
        try:
            body = json.loads(event["body"])
        except Exception:
            pass
    if not action:
        action = body.get("action", "")

    db = get_db()
    cur = db.cursor()

    try:
        # ══ DASHBOARD ════════════════════════════════════════════
        if action == "dashboard":
            cur.execute("SELECT COUNT(*) FROM crm_contacts WHERE user_id=%s", (uid,))
            contacts_total = cur.fetchone()[0]
            cur.execute("SELECT COUNT(*) FROM crm_leads WHERE user_id=%s", (uid,))
            leads_total = cur.fetchone()[0]
            cur.execute("SELECT COUNT(*) FROM crm_deals WHERE user_id=%s", (uid,))
            deals_total = cur.fetchone()[0]
            cur.execute("SELECT COALESCE(SUM(amount),0) FROM crm_deals WHERE user_id=%s AND stage='won'", (uid,))
            revenue = float(cur.fetchone()[0])
            cur.execute("SELECT COUNT(*) FROM crm_tasks WHERE user_id=%s AND status != 'done'", (uid,))
            tasks_open = cur.fetchone()[0]
            cur.execute("SELECT COUNT(*) FROM crm_deals WHERE user_id=%s AND stage NOT IN ('won','lost')", (uid,))
            pipeline_count = cur.fetchone()[0]
            cur.execute("SELECT COALESCE(SUM(amount),0) FROM crm_deals WHERE user_id=%s AND stage NOT IN ('won','lost')", (uid,))
            pipeline_amount = float(cur.fetchone()[0])
            cur.execute("SELECT id,type,title,created_at FROM crm_activities WHERE user_id=%s ORDER BY created_at DESC LIMIT 5", (uid,))
            recent = rows_to_dicts(cur, cur.fetchall())
            cur.close(); db.close()
            return resp(200, {
                "contacts_total": contacts_total, "leads_total": leads_total,
                "deals_total": deals_total, "revenue": revenue,
                "tasks_open": tasks_open, "pipeline_count": pipeline_count,
                "pipeline_amount": pipeline_amount,
                "recent_activities": recent, "deal_stages": DEAL_STAGES,
            })

        # ══ KANBAN ═══════════════════════════════════════════════
        if action == "kanban":
            cur.execute("""
                SELECT d.*, c.name as contact_name FROM crm_deals d
                LEFT JOIN crm_contacts c ON c.id=d.contact_id
                WHERE d.user_id=%s ORDER BY d.created_at DESC
            """, (uid,))
            all_deals = rows_to_dicts(cur, cur.fetchall())
            kanban = {}
            for s in DEAL_STAGES:
                stage_deals = [d for d in all_deals if d["stage"] == s["id"]]
                kanban[s["id"]] = {
                    "stage": s,
                    "deals": stage_deals,
                    "total": sum(float(d["amount"] or 0) for d in stage_deals),
                }
            cur.close(); db.close()
            return resp(200, {"kanban": kanban, "stages": DEAL_STAGES})

        # ══ CONTACTS ═════════════════════════════════════════════
        if action == "contacts_list":
            search = params.get("search", "")
            q = f"%{search}%"
            cur.execute("""
                SELECT * FROM crm_contacts WHERE user_id=%s
                AND (name ILIKE %s OR email ILIKE %s OR company ILIKE %s OR phone ILIKE %s)
                ORDER BY created_at DESC LIMIT 100
            """, (uid, q, q, q, q))
            items = rows_to_dicts(cur, cur.fetchall())
            cur.close(); db.close()
            return resp(200, {"contacts": items, "total": len(items)})

        if action == "contacts_get" and eid:
            cur.execute("SELECT * FROM crm_contacts WHERE id=%s AND user_id=%s", (eid, uid))
            row = cur.fetchone()
            if not row:
                cur.close(); db.close()
                return resp(404, {"error": "Контакт не найден"})
            contact = rows_to_dicts(cur, [row])[0]
            cur.execute("SELECT * FROM crm_activities WHERE contact_id=%s AND user_id=%s ORDER BY created_at DESC LIMIT 20", (eid, uid))
            contact["activities"] = rows_to_dicts(cur, cur.fetchall())
            cur.execute("SELECT * FROM crm_deals WHERE contact_id=%s AND user_id=%s ORDER BY created_at DESC", (eid, uid))
            contact["deals"] = rows_to_dicts(cur, cur.fetchall())
            cur.close(); db.close()
            return resp(200, {"contact": contact})

        if action == "contacts_create":
            cur.execute("""
                INSERT INTO crm_contacts (user_id,name,phone,email,company,position,type,status,source,region,notes,tags)
                VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s) RETURNING id
            """, (uid, body.get("name",""), body.get("phone"), body.get("email"),
                  body.get("company"), body.get("position"), body.get("type","client"),
                  body.get("status","active"), body.get("source"), body.get("region"),
                  body.get("notes"), body.get("tags")))
            new_id = cur.fetchone()[0]
            db.commit()
            cur.close(); db.close()
            return resp(201, {"success": True, "id": new_id})

        if action == "contacts_update" and eid:
            cur.execute("""
                UPDATE crm_contacts SET
                  name=COALESCE(%s,name), phone=COALESCE(%s,phone), email=COALESCE(%s,email),
                  company=COALESCE(%s,company), position=COALESCE(%s,position),
                  type=COALESCE(%s,type), status=COALESCE(%s,status),
                  source=COALESCE(%s,source), region=COALESCE(%s,region),
                  notes=COALESCE(%s,notes), updated_at=NOW()
                WHERE id=%s AND user_id=%s
            """, (body.get("name"), body.get("phone"), body.get("email"),
                  body.get("company"), body.get("position"), body.get("type"),
                  body.get("status"), body.get("source"), body.get("region"),
                  body.get("notes"), eid, uid))
            db.commit()
            cur.close(); db.close()
            return resp(200, {"success": True})

        # ══ LEADS ════════════════════════════════════════════════
        if action == "leads_list":
            cur.execute("""
                SELECT l.*, c.name as contact_name FROM crm_leads l
                LEFT JOIN crm_contacts c ON c.id=l.contact_id
                WHERE l.user_id=%s ORDER BY l.created_at DESC
            """, (uid,))
            items = rows_to_dicts(cur, cur.fetchall())
            cur.close(); db.close()
            return resp(200, {"leads": items})

        if action == "leads_create":
            cur.execute("""
                INSERT INTO crm_leads (user_id,name,contact_id,source,status,budget,crop,area_ha,region,notes,assigned_to)
                VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s) RETURNING id
            """, (uid, body.get("name",""), body.get("contact_id"), body.get("source"),
                  body.get("status","new"), body.get("budget"), body.get("crop"),
                  body.get("area_ha"), body.get("region"), body.get("notes"), body.get("assigned_to")))
            new_id = cur.fetchone()[0]
            db.commit()
            cur.close(); db.close()
            return resp(201, {"success": True, "id": new_id})

        if action == "leads_update" and eid:
            cur.execute("""
                UPDATE crm_leads SET status=COALESCE(%s,status), notes=COALESCE(%s,notes),
                  budget=COALESCE(%s,budget), assigned_to=COALESCE(%s,assigned_to), updated_at=NOW()
                WHERE id=%s AND user_id=%s
            """, (body.get("status"), body.get("notes"), body.get("budget"),
                  body.get("assigned_to"), eid, uid))
            db.commit()
            cur.close(); db.close()
            return resp(200, {"success": True})

        # ══ DEALS ════════════════════════════════════════════════
        if action == "deals_list":
            stage_filter = params.get("stage", "")
            if stage_filter:
                cur.execute("""
                    SELECT d.*, c.name as contact_name FROM crm_deals d
                    LEFT JOIN crm_contacts c ON c.id=d.contact_id
                    WHERE d.user_id=%s AND d.stage=%s ORDER BY d.created_at DESC
                """, (uid, stage_filter))
            else:
                cur.execute("""
                    SELECT d.*, c.name as contact_name FROM crm_deals d
                    LEFT JOIN crm_contacts c ON c.id=d.contact_id
                    WHERE d.user_id=%s ORDER BY d.created_at DESC
                """, (uid,))
            items = rows_to_dicts(cur, cur.fetchall())
            cur.close(); db.close()
            return resp(200, {"deals": items, "stages": DEAL_STAGES})

        if action == "deals_create":
            cur.execute("""
                INSERT INTO crm_deals
                  (user_id,title,contact_id,stage,amount,probability,crop,volume_t,price_per_t,region,close_date,assigned_to,notes)
                VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s) RETURNING id
            """, (uid, body.get("title","Новая сделка"), body.get("contact_id"),
                  body.get("stage","new"), body.get("amount",0), body.get("probability",0),
                  body.get("crop"), body.get("volume_t"), body.get("price_per_t"),
                  body.get("region"), body.get("close_date"), body.get("assigned_to"), body.get("notes")))
            new_id = cur.fetchone()[0]
            db.commit()
            cur.close(); db.close()
            return resp(201, {"success": True, "id": new_id})

        if action == "deals_update" and eid:
            new_stage = body.get("stage")
            # авто-вероятность по стадии, если явно не задана
            prob = body.get("probability")
            if prob is None and new_stage in STAGE_PROBABILITY:
                prob = STAGE_PROBABILITY[new_stage]
            cur.execute("""
                UPDATE crm_deals SET
                  title=COALESCE(%s,title), stage=COALESCE(%s,stage),
                  amount=COALESCE(%s,amount), probability=COALESCE(%s,probability),
                  crop=COALESCE(%s,crop), notes=COALESCE(%s,notes),
                  close_date=COALESCE(%s,close_date), lost_reason=COALESCE(%s,lost_reason),
                  assigned_to=COALESCE(%s,assigned_to),
                  next_step = CASE WHEN %s IS NOT NULL THEN %s ELSE next_step END,
                  stage_changed_at = CASE WHEN %s IS NOT NULL THEN NOW() ELSE stage_changed_at END,
                  last_activity_at = NOW(), health = 100, updated_at=NOW()
                WHERE id=%s AND user_id=%s
            """, (body.get("title"), new_stage, body.get("amount"),
                  prob, body.get("crop"), body.get("notes"),
                  body.get("close_date"), body.get("lost_reason"), body.get("assigned_to"),
                  new_stage, STAGE_NEXT_STEP.get(new_stage or "", None),
                  new_stage, eid, uid))
            if new_stage:
                stage_label = next((s["label"] for s in DEAL_STAGES if s["id"] == new_stage), new_stage)
                cur.execute("""
                    INSERT INTO crm_activities (user_id,type,title,deal_id,completed_at)
                    VALUES (%s,'stage',%s,%s,NOW())
                """, (uid, f"Сделка перешла на этап «{stage_label}»", eid))
            db.commit()
            cur.close(); db.close()
            return resp(200, {"success": True})

        # ══ АВТО-ВОРОНКА + ИИ ════════════════════════════════════
        if action == "deal_ai_next" and eid:
            cur.execute("""
                SELECT d.id,d.title,d.stage,d.amount,d.crop,d.volume_t,d.price_per_t,
                       d.region,d.notes,d.created_at,d.stage_changed_at,d.last_activity_at,
                       c.name,c.phone,c.email
                FROM crm_deals d LEFT JOIN crm_contacts c ON c.id=d.contact_id
                WHERE d.id=%s AND d.user_id=%s
            """, (eid, uid))
            row = cur.fetchone()
            if not row:
                cur.close(); db.close()
                return resp(404, {"error": "Сделка не найдена"})
            (d_id,d_title,d_stage,d_amount,d_crop,d_vol,d_price,d_region,d_notes,
             d_created,d_stagech,d_lastact,c_name,c_phone,c_email) = row
            # последние активности для контекста
            cur.execute("SELECT type,title,created_at FROM crm_activities WHERE deal_id=%s ORDER BY created_at DESC LIMIT 8", (eid,))
            acts = cur.fetchall()
            acts_txt = "\n".join(f"- {a[2]}: [{a[0]}] {a[1]}" for a in acts) or "нет событий"
            stage_label = next((s["label"] for s in DEAL_STAGES if s["id"] == d_stage), d_stage)
            prompt = (
                f"Сделка в CRM агротрейдера. Дай рекомендацию менеджеру.\n\n"
                f"Название: {d_title}\nЭтап: {stage_label}\nКонтакт: {c_name or '—'}, тел. {c_phone or '—'}, {c_email or '—'}\n"
                f"Культура: {d_crop or '—'}, объём: {d_vol or '—'} т, цена: {d_price or '—'} ₽/т, регион: {d_region or '—'}\n"
                f"Сумма: {d_amount or 0} ₽\nЗаметки: {d_notes or '—'}\n"
                f"Создана: {d_created}, этап изменён: {d_stagech}, последняя активность: {d_lastact}\n"
                f"Последние события:\n{acts_txt}\n\n"
                "Верни СТРОГО JSON без пояснений: "
                '{"next_step":"одно конкретное следующее действие (1-2 предложения)",'
                '"health":число 0-100 (насколько сделка здорова и близка к успеху),'
                '"risk":"главный риск одним предложением",'
                '"summary":"краткое резюме статуса сделки в 1 предложение"}'
            )
            ai = ai_text(prompt, CRM_AI_SYSTEM, temperature=0.4, max_tokens=500)
            result = None
            if ai:
                try:
                    txt = ai[ai.find("{"): ai.rfind("}") + 1]
                    result = json.loads(txt)
                except Exception:
                    result = None
            if not result:
                result = {
                    "next_step": STAGE_NEXT_STEP.get(d_stage, "Связаться с контактом."),
                    "health": 70, "risk": "Нет свежих контактов — сделка может остыть.",
                    "summary": f"Сделка на этапе «{stage_label}».",
                }
            cur.execute("""
                UPDATE crm_deals SET next_step=%s, health=%s, ai_summary=%s, updated_at=NOW()
                WHERE id=%s AND user_id=%s
            """, (result.get("next_step"), int(result.get("health", 70)),
                  result.get("summary"), eid, uid))
            db.commit()
            cur.close(); db.close()
            return resp(200, {"success": True, **result})

        if action == "deal_ai_email" and eid:
            cur.execute("""
                SELECT d.title,d.stage,d.crop,d.volume_t,d.price_per_t,d.region,d.notes,
                       c.name,c.email
                FROM crm_deals d LEFT JOIN crm_contacts c ON c.id=d.contact_id
                WHERE d.id=%s AND d.user_id=%s
            """, (eid, uid))
            row = cur.fetchone()
            if not row:
                cur.close(); db.close()
                return resp(404, {"error": "Сделка не найдена"})
            d_title,d_stage,d_crop,d_vol,d_price,d_region,d_notes,c_name,c_email = row
            stage_label = next((s["label"] for s in DEAL_STAGES if s["id"] == d_stage), d_stage)
            purpose = body.get("purpose", "")
            prompt = (
                f"Напиши деловое письмо аграрию по сделке.\n"
                f"Получатель: {c_name or 'уважаемый партнёр'}\nЭтап сделки: {stage_label}\n"
                f"Культура: {d_crop or '—'}, объём: {d_vol or '—'} т, цена: {d_price or '—'} ₽/т, регион: {d_region or '—'}\n"
                f"Заметки: {d_notes or '—'}\n"
                f"Цель письма: {purpose or 'продвинуть сделку на следующий этап'}\n"
                f"Подпись: {os.environ.get('MANAGER_NAME','Александр')}, {os.environ.get('MANAGER_PHONE','')}, АгроПорт.\n"
                "Верни СТРОГО JSON: {\"subject\":\"тема письма\",\"body\":\"текст письма с приветствием и подписью\"}"
            )
            ai = ai_text(prompt, CRM_AI_SYSTEM, temperature=0.6, max_tokens=800)
            out = {"subject": f"АгроПорт — по сделке «{d_title}»", "body": ""}
            if ai:
                try:
                    txt = ai[ai.find("{"): ai.rfind("}") + 1]
                    out = json.loads(txt)
                except Exception:
                    out["body"] = ai
            cur.close(); db.close()
            return resp(200, {"success": True, "recipient": c_email, **out})

        # ══ СКВОЗНАЯ АНАЛИТИКА ═══════════════════════════════════
        if action == "analytics":
            # воронка по стадиям
            cur.execute("""
                SELECT stage, COUNT(*), COALESCE(SUM(amount),0)
                FROM crm_deals WHERE user_id=%s GROUP BY stage
            """, (uid,))
            by_stage = {r[0]: {"count": int(r[1]), "amount": float(r[2])} for r in cur.fetchall()}
            funnel = [{"id": s["id"], "label": s["label"], "color": s["color"],
                       "count": by_stage.get(s["id"], {}).get("count", 0),
                       "amount": by_stage.get(s["id"], {}).get("amount", 0.0)} for s in DEAL_STAGES]
            total_deals = sum(v["count"] for v in by_stage.values())
            won = by_stage.get("won", {}).get("count", 0)
            lost = by_stage.get("lost", {}).get("count", 0)
            closed = won + lost
            conversion = round(won / closed * 100, 1) if closed else 0.0
            # выручка выигранных + прогноз (взвешенный pipeline)
            cur.execute("SELECT COALESCE(SUM(amount),0) FROM crm_deals WHERE user_id=%s AND stage='won'", (uid,))
            revenue = float(cur.fetchone()[0])
            cur.execute("""
                SELECT COALESCE(SUM(amount * COALESCE(probability,0) / 100.0),0)
                FROM crm_deals WHERE user_id=%s AND stage NOT IN ('won','lost')
            """, (uid,))
            forecast = float(cur.fetchone()[0])
            cur.execute("SELECT COALESCE(SUM(volume_t),0) FROM crm_deals WHERE user_id=%s AND stage='won'", (uid,))
            volume_won = float(cur.fetchone()[0])
            # средний чек
            avg_deal = round(revenue / won, 2) if won else 0.0
            # KPI по менеджерам
            cur.execute("""
                SELECT COALESCE(assigned_to,'Не назначен') AS mgr,
                       COUNT(*) AS deals,
                       COUNT(*) FILTER (WHERE stage='won') AS won,
                       COALESCE(SUM(amount) FILTER (WHERE stage='won'),0) AS revenue
                FROM crm_deals WHERE user_id=%s GROUP BY mgr ORDER BY revenue DESC
            """, (uid,))
            managers = [{"name": r[0], "deals": int(r[1]), "won": int(r[2]), "revenue": float(r[3])}
                        for r in cur.fetchall()]
            # застрявшие сделки (нет активности > 5 дней, не закрыты)
            cur.execute("""
                SELECT COUNT(*) FROM crm_deals
                WHERE user_id=%s AND stage NOT IN ('won','lost')
                  AND last_activity_at < NOW() - INTERVAL '5 days'
            """, (uid,))
            stalled = int(cur.fetchone()[0])
            # прогноз закупок по культурам (pipeline)
            cur.execute("""
                SELECT COALESCE(crop,'Не указана') AS crop,
                       COALESCE(SUM(volume_t),0) AS vol,
                       COALESCE(SUM(amount),0) AS amt
                FROM crm_deals WHERE user_id=%s AND stage NOT IN ('lost')
                GROUP BY crop ORDER BY amt DESC LIMIT 8
            """, (uid,))
            by_crop = [{"crop": r[0], "volume_t": float(r[1]), "amount": float(r[2])} for r in cur.fetchall()]
            cur.close(); db.close()
            return resp(200, {
                "funnel": funnel, "total_deals": total_deals, "conversion": conversion,
                "won": won, "lost": lost, "revenue": revenue, "forecast": round(forecast, 2),
                "avg_deal": avg_deal, "volume_won": volume_won, "stalled": stalled,
                "managers": managers, "by_crop": by_crop,
            })

        # ══ ОМНИКАНАЛ: ЕДИНАЯ ЛЕНТА ПО КОНТАКТУ ══════════════════
        if action == "deal_timeline" and eid:
            cur.execute("SELECT contact_id, supplier_id FROM crm_deals WHERE id=%s AND user_id=%s", (eid, uid))
            r = cur.fetchone()
            if not r:
                cur.close(); db.close()
                return resp(404, {"error": "Сделка не найдена"})
            contact_id, sup_id = r
            timeline = []
            cur.execute("""
                SELECT type, title, description, created_at FROM crm_activities
                WHERE deal_id=%s OR (contact_id=%s AND contact_id IS NOT NULL)
                ORDER BY created_at DESC LIMIT 50
            """, (eid, contact_id))
            for a in cur.fetchall():
                timeline.append({"channel": a[0], "title": a[1], "text": a[2], "at": str(a[3]), "dir": "internal"})
            # письма/сообщения поставщику (омниканал), если сделка связана с supplier_id
            if sup_id:
                cur.execute(f"""
                    SELECT channel, subject, body, status, created_at FROM {SCHEMA}.supplier_messages
                    WHERE supplier_id=%s ORDER BY created_at DESC LIMIT 30
                """, (sup_id,))
                for m in cur.fetchall():
                    timeline.append({"channel": m[0], "title": m[1] or f"Сообщение ({m[0]})",
                                     "text": m[2], "status": m[3], "at": str(m[4]), "dir": "out"})
            timeline.sort(key=lambda x: x["at"], reverse=True)
            cur.close(); db.close()
            return resp(200, {"timeline": timeline})

        # ══ TASKS ════════════════════════════════════════════════
        if action == "tasks_list":
            status_filter = params.get("status", "")
            if status_filter:
                cur.execute("""
                    SELECT t.*, c.name as contact_name, d.title as deal_title FROM crm_tasks t
                    LEFT JOIN crm_contacts c ON c.id=t.contact_id
                    LEFT JOIN crm_deals d ON d.id=t.deal_id
                    WHERE t.user_id=%s AND t.status=%s ORDER BY t.due_date ASC NULLS LAST, t.created_at DESC
                """, (uid, status_filter))
            else:
                cur.execute("""
                    SELECT t.*, c.name as contact_name, d.title as deal_title FROM crm_tasks t
                    LEFT JOIN crm_contacts c ON c.id=t.contact_id
                    LEFT JOIN crm_deals d ON d.id=t.deal_id
                    WHERE t.user_id=%s ORDER BY t.due_date ASC NULLS LAST, t.created_at DESC
                """, (uid,))
            items = rows_to_dicts(cur, cur.fetchall())
            cur.close(); db.close()
            return resp(200, {"tasks": items, "statuses": TASK_STATUSES})

        if action == "tasks_create":
            cur.execute("""
                INSERT INTO crm_tasks (user_id,title,description,status,priority,due_date,contact_id,deal_id,assigned_to,tags)
                VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s) RETURNING id
            """, (uid, body.get("title",""), body.get("description"),
                  body.get("status","todo"), body.get("priority","medium"),
                  body.get("due_date"), body.get("contact_id"), body.get("deal_id"),
                  body.get("assigned_to"), body.get("tags")))
            new_id = cur.fetchone()[0]
            db.commit()
            cur.close(); db.close()
            return resp(201, {"success": True, "id": new_id})

        if action == "tasks_update" and eid:
            new_status = body.get("status")
            cur.execute("""
                UPDATE crm_tasks SET
                  title=COALESCE(%s,title), status=COALESCE(%s,status),
                  priority=COALESCE(%s,priority), due_date=COALESCE(%s,due_date),
                  description=COALESCE(%s,description),
                  completed_at = CASE WHEN %s='done' THEN NOW() ELSE completed_at END,
                  updated_at=NOW()
                WHERE id=%s AND user_id=%s
            """, (body.get("title"), new_status, body.get("priority"),
                  body.get("due_date"), body.get("description"),
                  new_status or "", eid, uid))
            db.commit()
            cur.close(); db.close()
            return resp(200, {"success": True})

        # ══ ACTIVITIES ═══════════════════════════════════════════
        if action == "activities_list":
            cur.execute("""
                SELECT a.*, c.name as contact_name, d.title as deal_title FROM crm_activities a
                LEFT JOIN crm_contacts c ON c.id=a.contact_id
                LEFT JOIN crm_deals d ON d.id=a.deal_id
                WHERE a.user_id=%s ORDER BY a.created_at DESC LIMIT 50
            """, (uid,))
            items = rows_to_dicts(cur, cur.fetchall())
            cur.close(); db.close()
            return resp(200, {"activities": items})

        if action == "activities_create":
            cur.execute("""
                INSERT INTO crm_activities (user_id,type,title,description,contact_id,deal_id,task_id,duration_min,result,scheduled_at,completed_at)
                VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s) RETURNING id
            """, (uid, body.get("type","call"), body.get("title",""),
                  body.get("description"), body.get("contact_id"), body.get("deal_id"),
                  body.get("task_id"), body.get("duration_min"), body.get("result"),
                  body.get("scheduled_at"), body.get("completed_at")))
            new_id = cur.fetchone()[0]
            db.commit()
            cur.close(); db.close()
            return resp(201, {"success": True, "id": new_id})

        # ══ ИМПОРТ ПОСТАВЩИКА В CRM ══════════════════════════════
        if action == "import_supplier":
            supplier_id = body.get("supplier_id")
            if not supplier_id:
                cur.close(); db.close()
                return resp(400, {"error": "Не указан supplier_id"})
            cur.execute(f"""
                SELECT id, name, inn, region, district, crops, contact_person,
                       phone, email, address, volume_tons
                FROM {SCHEMA}.suppliers WHERE id=%s
            """, (supplier_id,))
            sup = cur.fetchone()
            if not sup:
                cur.close(); db.close()
                return resp(404, {"error": "Поставщик не найден"})
            s_id, s_name, s_inn, s_region, s_district, s_crops, s_contact, s_phone, s_email, s_addr, s_vol = sup
            # Не дублируем: ищем контакт по ИНН/названию среди контактов команды
            cur.execute("""
                SELECT id FROM crm_contacts
                WHERE user_id=%s AND (
                    (notes ILIKE %s AND %s <> '') OR name=%s
                ) LIMIT 1
            """, (uid, f"%ИНН {s_inn}%", s_inn or "", s_name))
            existing = cur.fetchone()
            if existing:
                contact_id = existing[0]
            else:
                note = f"Импортирован из базы поставщиков. ИНН {s_inn or '—'}. Регион: {s_region or ''} {s_district or ''}".strip()
                cur.execute("""
                    INSERT INTO crm_contacts
                      (user_id,name,phone,email,company,position,type,status,source,region,notes,tags)
                    VALUES (%s,%s,%s,%s,%s,%s,'supplier','active','Импорт поставщиков',%s,%s,%s)
                    RETURNING id
                """, (uid, s_contact or s_name, s_phone, s_email, s_name, "Руководитель",
                      s_region, note, [c.strip() for c in (s_crops or "").split(",") if c.strip()] or None))
                contact_id = cur.fetchone()[0]
            deal_id = None
            if body.get("create_deal"):
                title = body.get("deal_title") or f"Закупка — {s_name}"
                cur.execute("""
                    INSERT INTO crm_deals
                      (user_id,title,contact_id,stage,amount,probability,crop,volume_t,region,notes,supplier_id,next_step)
                    VALUES (%s,%s,%s,'new',%s,10,%s,%s,%s,%s,%s,%s) RETURNING id
                """, (uid, title, contact_id, body.get("amount", 0),
                      s_crops, s_vol, s_region,
                      f"Хозяйство: {s_name}. Контакт: {s_contact or '—'}, тел. {s_phone or '—'}",
                      supplier_id, STAGE_NEXT_STEP["new"]))
                deal_id = cur.fetchone()[0]
                cur.execute("""
                    INSERT INTO crm_activities (user_id,type,title,description,contact_id,deal_id)
                    VALUES (%s,'note',%s,%s,%s,%s)
                """, (uid, "Сделка заведена из базы поставщиков",
                      f"Поставщик {s_name} добавлен в воронку.", contact_id, deal_id))
            db.commit()
            cur.close(); db.close()
            return resp(200, {"success": True, "contact_id": contact_id, "deal_id": deal_id, "existed": bool(existing)})

        # ══ МАССОВЫЙ ПЕРЕНОС ПОСТАВЩИКОВ В КОНТАКТЫ ══════════════
        if action == "import_suppliers_bulk":
            where = ["1=1"]
            args = []
            if body.get("district"):
                where.append("district = %s"); args.append(body["district"])
            if body.get("region"):
                where.append("region = %s"); args.append(body["region"])
            if body.get("priority_only"):
                where.append("priority >= 2")
            if body.get("farmer_only"):
                where.append("is_farmer = true")
            if body.get("with_email"):
                where.append("email IS NOT NULL AND email <> ''")
            if body.get("with_phone"):
                where.append("phone IS NOT NULL AND phone <> ''")
            limit = int(body.get("limit") or 500)
            limit = max(1, min(limit, 6000))
            where_sql = " AND ".join(where)

            # Опционально: очистить прошлый импорт (кроме контактов, связанных со сделками)
            reset_removed = 0
            if body.get("reset"):
                cur.execute("""
                    DELETE FROM crm_activities WHERE contact_id IN (
                        SELECT id FROM crm_contacts
                        WHERE user_id=%s AND source='Импорт поставщиков'
                          AND id NOT IN (SELECT contact_id FROM crm_deals WHERE contact_id IS NOT NULL)
                    )
                """, (uid,))
                cur.execute("""
                    DELETE FROM crm_contacts
                    WHERE user_id=%s AND source='Импорт поставщиков'
                      AND id NOT IN (SELECT contact_id FROM crm_deals WHERE contact_id IS NOT NULL)
                """, (uid,))
                reset_removed = cur.rowcount

            # Уникальные хозяйства под фильтром: 1 запись на ИНН (а без ИНН — на название)
            cur.execute(f"""
                SELECT COUNT(*) FROM (
                    SELECT DISTINCT ON (COALESCE(NULLIF(inn,''), 'NAME:' || name)) id
                    FROM {SCHEMA}.suppliers WHERE {where_sql}
                    ORDER BY COALESCE(NULLIF(inn,''), 'NAME:' || name), priority DESC, id
                ) q
            """, tuple(args))
            total_match = cur.fetchone()[0]

            # Переносим по одному контакту на уникальное хозяйство, пропуская уже существующие
            cur.execute(f"""
                INSERT INTO crm_contacts
                    (user_id, name, phone, email, company, position, type, status, source, region, notes)
                SELECT %s,
                       COALESCE(NULLIF(s.contact_person,''), s.name),
                       s.phone, s.email, s.name, 'Руководитель',
                       'supplier', 'active', 'Импорт поставщиков', s.region,
                       'Импортирован из базы поставщиков. ИНН ' || COALESCE(s.inn,'—') ||
                       '. Регион: ' || COALESCE(s.region,'') || ' ' || COALESCE(s.district,'')
                FROM (
                    SELECT DISTINCT ON (COALESCE(NULLIF(inn,''), 'NAME:' || name))
                           id, name, inn, region, district, contact_person, phone, email, priority
                    FROM {SCHEMA}.suppliers WHERE {where_sql}
                    ORDER BY COALESCE(NULLIF(inn,''), 'NAME:' || name), priority DESC, id
                ) s
                WHERE NOT EXISTS (
                    SELECT 1 FROM crm_contacts c
                    WHERE c.user_id = %s AND (
                        (s.inn IS NOT NULL AND s.inn <> '' AND c.notes ILIKE '%%ИНН ' || s.inn || '%%')
                        OR ((s.inn IS NULL OR s.inn = '') AND c.company = s.name)
                    )
                )
                ORDER BY s.priority DESC, s.id
                LIMIT %s
            """, (uid, *args, uid, limit))
            imported = cur.rowcount
            db.commit()
            cur.close(); db.close()
            return resp(200, {
                "success": True,
                "imported": imported,
                "total_match": total_match,
                "reset_removed": reset_removed,
                "skipped": total_match - imported if total_match >= imported else 0,
            })

        # ══ COMMENTS ═════════════════════════════════════════════
        if action == "comments_list":
            entity_type = params.get("entity_type")
            entity_id_p = params.get("entity_id")
            cur.execute("""
                SELECT cm.*, u.full_name as author_name FROM crm_comments cm
                LEFT JOIN users u ON u.id=cm.user_id
                WHERE cm.user_id=%s AND cm.entity_type=%s AND cm.entity_id=%s
                ORDER BY cm.created_at ASC
            """, (uid, entity_type, entity_id_p))
            items = rows_to_dicts(cur, cur.fetchall())
            cur.close(); db.close()
            return resp(200, {"comments": items})

        if action == "comments_create":
            cur.execute("""
                INSERT INTO crm_comments (user_id, entity_type, entity_id, text)
                VALUES (%s,%s,%s,%s) RETURNING id
            """, (uid, body.get("entity_type"), body.get("entity_id"), body.get("text","")))
            new_id = cur.fetchone()[0]
            db.commit()
            cur.close(); db.close()
            return resp(201, {"success": True, "id": new_id})

    except Exception as e:
        db.rollback()
        cur.close(); db.close()
        return resp(500, {"error": str(e)})

    cur.close(); db.close()
    return resp(200, {"actions": ["dashboard","kanban","contacts_list","contacts_get","contacts_create","contacts_update","leads_list","leads_create","leads_update","deals_list","deals_create","deals_update","tasks_list","tasks_create","tasks_update","activities_list","activities_create","comments_list","comments_create"]})