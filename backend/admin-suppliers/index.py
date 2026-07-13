"""
База сельхозпроизводителей (поставщиков) по регионам.
CRUD + пакетный импорт из Excel/CSV (фронт присылает готовый массив строк).
"""
import json, os, re
import psycopg2
import urllib.request
import urllib.error

SCHEMA = os.environ.get("MAIN_DB_SCHEMA", "t_p36960093_agroforecast_app")
CORS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, X-Admin-Token",
    "Content-Type": "application/json",
}

FIELDS = ["name", "inn", "region", "district", "locality", "crops", "volume_tons",
          "contact_person", "phone", "email", "address", "status", "source", "notes",
          "ownership", "website", "fax", "revenue", "staff_count", "founded_year",
          "activity", "postal_code"]

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

# Единственное числовое (numeric) поле таблицы — volume_tons.
# revenue/staff_count/founded_year хранятся как text, поэтому их не трогаем.
_NUM_FIELDS = {"volume_tons"}

def _to_number(val):
    """Достаём число из значения. Возвращает число или None, если не распарсить."""
    if val is None or val == "":
        return None
    if isinstance(val, (int, float)):
        return None if isinstance(val, float) and val != val else val  # отсекаем NaN
    s = str(val).replace("\u00a0", " ").replace(" ", "").replace(",", ".")
    cleaned = "".join(c for c in s if c.isdigit() or c in ".-")
    if not cleaned or cleaned in ("-", ".", "-."):
        return None
    try:
        num = float(cleaned)
        return None if num != num else num
    except (ValueError, TypeError):
        return None

def _clean(row):
    out = {}
    for k in FIELDS:
        if k not in row:
            continue
        val = row[k]
        if val in (None, ""):
            continue
        if k in _NUM_FIELDS:
            num = _to_number(val)
            if num is not None:
                out[k] = num
        else:
            out[k] = val
    return out


# Раскладка клавиатуры: латиница <-> кириллица (частая ошибка при вводе)
_LAT = "qwertyuiop[]asdfghjkl;'zxcvbnm,.`"
_RUS = "йцукенгшщзхъфывапролджэячсмитьбюё"
_LAT2RUS = {l: r for l, r in zip(_LAT, _RUS)}
_RUS2LAT = {r: l for l, r in zip(_LAT, _RUS)}

def _switch_layout(s: str):
    """Возвращает вариант строки в другой раскладке, если это осмысленно."""
    low = s.lower()
    lat = sum(1 for c in low if c in _LAT2RUS)
    rus = sum(1 for c in low if c in _RUS2LAT)
    if lat and lat >= rus:
        return "".join(_LAT2RUS.get(c, c) for c in low)
    if rus:
        return "".join(_RUS2LAT.get(c, c) for c in low)
    return None

# Поля, по которым идёт умный поиск «с полуслова»
_SEARCH_FIELDS = ["name", "inn", "contact_person", "phone", "email",
                  "district", "locality", "crops", "activity", "address"]

def _search_clause(search: str):
    """Умный поиск: каждое слово ищется по всем полям (AND между словами, OR между полями).
    Плюс автоисправление раскладки. Возвращает (sql, args) или (None, [])."""
    words = [w for w in re.split(r"[\s,;]+", search.strip()) if w]
    if not words:
        return None, []
    and_parts = []
    args = []
    for w in words:
        variants = {w}
        alt = _switch_layout(w)
        if alt and alt != w.lower():
            variants.add(alt)
        or_parts = []
        for v in variants:
            like = f"%{v}%"
            field_ors = " OR ".join(f"{f} ILIKE %s" for f in _SEARCH_FIELDS)
            or_parts.append(f"({field_ors})")
            args += [like] * len(_SEARCH_FIELDS)
        and_parts.append("(" + " OR ".join(or_parts) + ")")
    return " AND ".join(and_parts), args


def _build_where(params):
    """Строит WHERE и args по фильтрам списка. Используется списком и анализом качества."""
    where = "WHERE name NOT LIKE '[служебная строка]%%'"
    args = []
    search = params.get("search", "")
    if search:
        clause, sargs = _search_clause(search)
        if clause:
            where += f" AND ({clause})"
            args += sargs
    if params.get("region"):
        where += " AND region=%s"; args.append(params["region"])
    if params.get("district"):
        where += " AND district=%s"; args.append(params["district"])
    if params.get("status"):
        where += " AND status=%s"; args.append(params["status"])
    if params.get("activity"):
        where += " AND activity ILIKE %s"; args.append(f"%{params['activity']}%")
    if params.get("crop"):
        where += " AND crops ILIKE %s"; args.append(f"%{params['crop']}%")
    if params.get("ownership"):
        where += " AND ownership=%s"; args.append(params["ownership"])
    if params.get("farmer") == "1":
        where += " AND is_farmer = true"
    if params.get("priority"):
        where += " AND priority = %s"; args.append(int(params["priority"]))
    if params.get("inn_prefix"):
        where += " AND inn LIKE %s"; args.append(f"{params['inn_prefix']}%")
    if params.get("has_email") == "1":
        where += " AND email IS NOT NULL AND email <> ''"
    if params.get("has_phone") == "1":
        where += " AND phone IS NOT NULL AND phone <> ''"
    return where, args


def _ai_column_map(columns, sample_rows):
    """ИИ определяет, какая колонка таблицы какому полю базы соответствует."""
    api_key = os.environ.get("POLZA_API_KEY", "")
    if not api_key:
        return None
    prompt = (
        "Ты разбираешь Excel-таблицу с сельхозпроизводителями (поставщиками зерна и подсолнечника). "
        "Нужно сопоставить колонки таблицы с полями базы данных.\n\n"
        f"Колонки таблицы: {json.dumps(columns, ensure_ascii=False)}\n"
        f"Примеры строк (первые несколько): {json.dumps(sample_rows, ensure_ascii=False)}\n\n"
        "Поля базы данных:\n"
        "- name: наименование предприятия / юрлица / организации / хозяйства / КФХ / ИП (ОБЯЗАТЕЛЬНО)\n"
        "- inn: ИНН (в т.ч. 'ИНН клиента')\n"
        "- district: район\n"
        "- locality: населённый пункт, село, город\n"
        "- crops: основная продукция и услуги, что производит/поставляет\n"
        "- activity: направление деятельности, дополнительные услуги и продукция\n"
        "- volume_tons: объём в тоннах (число)\n"
        "- revenue: объём выручки\n"
        "- staff_count: численность сотрудников\n"
        "- founded_year: год основания\n"
        "- ownership: форма собственности, подчинённость вышестоящей организации\n"
        "- contact_person: руководитель, контактное лицо, ФИО\n"
        "- phone: телефон\n"
        "- fax: факс\n"
        "- email: электронная почта (E_Mail)\n"
        "- website: сайт, веб-адрес\n"
        "- address: почтовый адрес\n"
        "- postal_code: почтовый индекс\n"
        "- notes: прочее, что не подошло к полям выше\n\n"
        "Правила: наименование юрлица (ООО, АО, КФХ, ИП, СПК, любое название организации/предприятия) — это name. "
        "'Название предприятия' → name. 'Руководитель' → contact_person. 'ИНН клиента' → inn. "
        "'Основная продукция и услуги' → crops. 'Направление деятельности' и 'Дополнительные услуги и продукция' → activity. "
        "Если явного 'хозяйства' нет, name — это столбец с названием компании/предприятия/юрлица. "
        "Сопоставь КАЖДУЮ значимую колонку. Верни СТРОГО JSON вида {\"map\": {\"Название колонки из таблицы\": \"поле_базы\"}}. "
        "Без markdown, только JSON."
    )
    payload = json.dumps({
        "model": "openai/gpt-4o-mini",
        "messages": [{"role": "user", "content": prompt}],
        "temperature": 0.1,
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
        text = data["choices"][0]["message"]["content"].strip()
        # вырезаем markdown-обёртку ```json ... ```
        if text.startswith("```"):
            text = text.split("```", 2)[1] if text.count("```") >= 2 else text.strip("`")
            if text.lstrip().lower().startswith("json"):
                text = text.lstrip()[4:]
        # берём от первой { до последней }
        start, end = text.find("{"), text.rfind("}")
        if start != -1 and end != -1:
            text = text[start:end + 1]
        parsed = json.loads(text)
        cmap = parsed.get("map", parsed)
        result = {str(k): str(v) for k, v in cmap.items() if v in FIELDS}
        return result or None
    except urllib.error.HTTPError as e:
        print(f"[ai_column_map] HTTPError {e.code}: {e.read().decode()[:300]}")
        return None
    except Exception as ex:
        print(f"[ai_column_map] error: {ex}")
        return None


def _ai_text(prompt, system="", temperature=0.5, max_tokens=900):
    """Универсальный вызов ИИ Polza.ai — возвращает текст ответа или None."""
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
        with urllib.request.urlopen(req, timeout=28) as resp:
            data = json.loads(resp.read())
        return data["choices"][0]["message"]["content"].strip()
    except urllib.error.HTTPError as e:
        print(f"[ai_text] HTTPError {e.code}: {e.read().decode()[:300]}")
        return None
    except Exception as ex:
        print(f"[ai_text] error: {ex}")
        return None


def _ai_json(prompt, system="", temperature=0.2, max_tokens=1200):
    """Вызов ИИ с ожиданием JSON-ответа. Возвращает dict или None."""
    text = _ai_text(prompt, system=system, temperature=temperature, max_tokens=max_tokens)
    if not text:
        return None
    # вырезаем markdown-обёртку ```json ... ```
    if text.startswith("```"):
        text = text.split("```", 2)[1] if text.count("```") >= 2 else text.strip("`")
        if text.lstrip().lower().startswith("json"):
            text = text.lstrip()[4:]
    start, end = text.find("{"), text.rfind("}")
    if start != -1 and end != -1:
        text = text[start:end + 1]
    try:
        return json.loads(text)
    except Exception as ex:
        print(f"[ai_json] parse error: {ex}; text={text[:200]}")
        return None


def _checko_lookup(inn):
    """Запрашивает реальные данные компании/ИП из ЕГРЮЛ через Checko API по ИНН.
    Возвращает dict с нормализованными полями или None."""
    api_key = os.environ.get("CHECKO_API_KEY", "")
    inn = (str(inn or "").strip())
    if not api_key or not inn.isdigit() or len(inn) not in (10, 12):
        return None
    url = f"https://api.checko.ru/v2/company?key={api_key}&inn={inn}"
    try:
        req = urllib.request.Request(url, headers={"Accept": "application/json"})
        with urllib.request.urlopen(req, timeout=20) as resp:
            raw = json.loads(resp.read())
    except urllib.error.HTTPError as e:
        print(f"[checko] HTTPError {e.code}: {e.read().decode()[:200]}")
        return None
    except Exception as ex:
        print(f"[checko] error: {ex}")
        return None
    d = raw.get("data") or {}
    if not d:
        return None
    # руководитель
    ruk = d.get("Руковод") or {}
    if isinstance(ruk, list):
        ruk = ruk[0] if ruk else {}
    director = ruk.get("ФИО") or ""
    # выручка (последний доступный год из финансов)
    revenue = ""
    fin = d.get("Финансы") or {}
    if isinstance(fin, dict) and fin:
        years = [y for y in fin.keys() if str(y).isdigit()]
        if years:
            last = max(years)
            rev = (fin.get(last) or {}).get("2110")  # 2110 — выручка
            if rev:
                revenue = f"{rev} ₽ ({last})"
    okved = (d.get("ОКВЭД") or {}).get("Наим") or ""
    contacts = d.get("Контакты") or {}
    phones = contacts.get("Тел") or []
    emails = contacts.get("Емэйл") or []
    if isinstance(phones, str): phones = [phones]
    if isinstance(emails, str): emails = [emails]
    return {
        "full_name": d.get("НаимПолн") or d.get("НаимСокр") or "",
        "status": d.get("Статус", {}).get("Наим") if isinstance(d.get("Статус"), dict) else (d.get("Статус") or ""),
        "reg_date": d.get("ДатаРег") or "",
        "address": d.get("ЮрАдрес", {}).get("Адрес") if isinstance(d.get("ЮрАдрес"), dict) else (d.get("ЮрАдрес") or ""),
        "director": director,
        "okved": okved,
        "revenue": revenue,
        "phones": [p for p in phones if p][:3],
        "emails": [e for e in emails if e][:3],
        "okved_list": [str(a.get("Наим", a)) for a in (d.get("ОКВЭДДоп") or [])][:5] if isinstance(d.get("ОКВЭДДоп"), list) else [],
    }


def _checko_text(c):
    """Текстовое описание данных из Checko для промпта ИИ."""
    if not c:
        return ""
    lines = ["\nДанные из ЕГРЮЛ (Checko, официальный источник):"]
    if c.get("full_name"): lines.append(f"Полное наименование: {c['full_name']}")
    if c.get("status"): lines.append(f"Статус: {c['status']}")
    if c.get("reg_date"): lines.append(f"Дата регистрации: {c['reg_date']}")
    if c.get("address"): lines.append(f"Юр. адрес: {c['address']}")
    if c.get("director"): lines.append(f"Руководитель: {c['director']}")
    if c.get("okved"): lines.append(f"Основной ОКВЭД: {c['okved']}")
    if c.get("okved_list"): lines.append(f"Доп. ОКВЭД: {', '.join(c['okved_list'])}")
    if c.get("revenue"): lines.append(f"Выручка: {c['revenue']}")
    if c.get("phones"): lines.append(f"Телефоны: {', '.join(c['phones'])}")
    if c.get("emails"): lines.append(f"Email: {', '.join(c['emails'])}")
    return "\n".join(lines) if len(lines) > 1 else ""


def _supplier_profile(cur, sid):
    """Читает поставщика для CRM и возвращает dict полей."""
    cur.execute(f"""SELECT id, name, inn, region, district, locality, crops, activity,
                           volume_tons, contact_person, phone, email, address, ownership,
                           revenue, staff_count, founded_year, status, notes, ai_analysis, ai_letter
                    FROM {SCHEMA}.suppliers WHERE id=%s""", (sid,))
    row = cur.fetchone()
    if not row:
        return None
    keys = ["id", "name", "inn", "region", "district", "locality", "crops", "activity",
            "volume_tons", "contact_person", "phone", "email", "address", "ownership",
            "revenue", "staff_count", "founded_year", "status", "notes", "ai_analysis", "ai_letter"]
    return dict(zip(keys, row))


def _profile_text(p):
    """Текстовое описание поставщика для промпта ИИ."""
    parts = [
        f"Название: {p.get('name') or '—'}",
        f"ИНН: {p.get('inn') or '—'}",
        f"Регион/район: {p.get('region') or '—'}, {p.get('district') or '—'} район, {p.get('locality') or ''}",
        f"Культуры/продукция: {p.get('crops') or '—'}",
        f"Направление деятельности: {p.get('activity') or '—'}",
        f"Форма собственности: {p.get('ownership') or '—'}",
        f"Объём (тонн): {p.get('volume_tons') if p.get('volume_tons') is not None else '—'}",
        f"Выручка: {p.get('revenue') or '—'}",
        f"Численность: {p.get('staff_count') or '—'}",
        f"Год основания: {p.get('founded_year') or '—'}",
        f"Руководитель/контакт: {p.get('contact_person') or '—'}",
        f"Телефон: {p.get('phone') or '—'}",
        f"Email: {p.get('email') or '—'}",
    ]
    return "\n".join(parts)


def _heuristic_map(columns):
    """Запасное сопоставление колонок по ключевым словам (если ИИ недоступен)."""
    rules = [
        ("inn", ["инн"]),
        ("name", ["названиепредприятия", "наименование", "названиеорганизации", "предприятие", "организация", "хозяйство", "название", "юрлицо", "компания"]),
        ("ownership", ["формасобственности", "подчиненность", "подчинённость", "вышестоящ"]),
        ("postal_code", ["почтовыйиндекс", "индекс"]),
        ("address", ["почтовыйадрес", "адрес"]),
        ("contact_person", ["руководитель", "контактноелицо", "контакт", "фио", "директор"]),
        ("phone", ["телефон", "тел"]),
        ("fax", ["факс"]),
        ("email", ["email", "e_mail", "e-mail", "почта", "мейл"]),
        ("website", ["сайт", "website", "web", "url"]),
        ("staff_count", ["численность", "штат", "сотрудник"]),
        ("founded_year", ["годоснования", "основан", "годсоздания"]),
        ("revenue", ["выручка", "оборот", "доход"]),
        ("crops", ["основнаяпродукция", "продукция", "культур"]),
        ("activity", ["направлениедеятельности", "деятельность", "дополнительныеуслуги", "услуги"]),
        ("district", ["район"]),
        ("locality", ["населенныйпункт", "населённыйпункт", "село", "город", "поселок"]),
        ("volume_tons", ["объемтонн", "объемвыручки", "тонн"]),
    ]
    cmap = {}
    used = set()
    for col in columns:
        norm = str(col).lower().replace(" ", "").replace(".", "").replace("_", "").replace("-", "")
        for field, keys in rules:
            if field in used:
                continue
            if any(k in norm for k in keys):
                cmap[col] = field
                used.add(field)
                break
    return cmap


# Ограничения длины для столбцов с типом varchar (остальные — text, без лимита)
MAXLEN = {"inn": 100, "status": 20, "source": 50}


def _apply_map(raw_rows, cmap):
    out = []
    for r in raw_rows:
        obj = {}
        for col, val in r.items():
            field = cmap.get(col)
            if not field or val in (None, ""):
                continue
            if field == "volume_tons":
                try:
                    obj[field] = float(str(val).replace(",", ".").replace(" ", ""))
                except ValueError:
                    continue
            else:
                s = str(val).strip()
                limit = MAXLEN.get(field)
                if limit and len(s) > limit:
                    s = s[:limit]
                obj[field] = s
        if obj.get("name"):
            out.append(obj)
    return out

def handler(event: dict, context) -> dict:
    """CRUD и импорт базы поставщиков сельхозпродукции"""
    if event.get("httpMethod") == "OPTIONS":
        return {"statusCode": 200, "headers": CORS, "body": ""}
    try:
        return _handle(event, context)
    except Exception as e:
        print(f"[admin-suppliers ERROR] {type(e).__name__}: {e}")
        return err(f"Ошибка обработки: {str(e)[:150]}", 500)


def _handle(event: dict, context) -> dict:
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

    # ── Удаление дублей ──
    # Группируем по ИНН (если заполнен), иначе по названию+районе.
    # В группе оставляем «лучшую» запись: с историей взаимодействий/сообщений,
    # затем с более полными контактами, затем с меньшим id.
    if method == "POST" and action == "dedup":
        preview = bool(body.get("preview"))
        rank_sql = f"""
            WITH ranked AS (
                SELECT s.id,
                    COALESCE(NULLIF(lower(s.inn),''), 'name:'||lower(s.name)||'|'||COALESCE(lower(s.district),'')) AS grp,
                    ROW_NUMBER() OVER (
                        PARTITION BY COALESCE(NULLIF(lower(s.inn),''), 'name:'||lower(s.name)||'|'||COALESCE(lower(s.district),''))
                        ORDER BY
                            (SELECT COUNT(*) FROM {SCHEMA}.supplier_interactions i WHERE i.supplier_id=s.id) DESC,
                            (SELECT COUNT(*) FROM {SCHEMA}.supplier_messages m WHERE m.supplier_id=s.id) DESC,
                            (CASE WHEN s.max_chat_id IS NOT NULL THEN 1 ELSE 0 END) DESC,
                            ((s.phone IS NOT NULL AND s.phone<>'')::int
                             + (s.email IS NOT NULL AND s.email<>'')::int
                             + (s.contact_person IS NOT NULL AND s.contact_person<>'')::int
                             + (s.inn IS NOT NULL AND s.inn<>'')::int
                             + (s.address IS NOT NULL AND s.address<>'')::int
                             + (s.ai_analysis IS NOT NULL AND s.ai_analysis<>'')::int) DESC,
                            s.id ASC
                    ) AS rn
                FROM {SCHEMA}.suppliers s
            )
            SELECT id FROM ranked WHERE rn > 1
        """
        cur.execute(f"SELECT COUNT(*) FROM ({rank_sql}) q")
        dup_count = cur.fetchone()[0]
        if preview:
            return ok({"duplicates": dup_count, "preview": True})
        # переносим историю с дублей на keeper не нужно — дубли и так пустые по истории (keeper выбран с историей).
        # но на всякий случай отвязываем возможные ссылки перед удалением.
        cur.execute(f"""
            DELETE FROM {SCHEMA}.supplier_interactions
            WHERE supplier_id IN ({rank_sql})
        """)
        cur.execute(f"""
            DELETE FROM {SCHEMA}.supplier_messages
            WHERE supplier_id IN ({rank_sql})
        """)
        cur.execute(f"DELETE FROM {SCHEMA}.suppliers WHERE id IN ({rank_sql})")
        removed = cur.rowcount
        # подчищаем возможные осиротевшие записи истории
        cur.execute(f"""DELETE FROM {SCHEMA}.supplier_interactions i
                        WHERE NOT EXISTS (SELECT 1 FROM {SCHEMA}.suppliers s WHERE s.id=i.supplier_id)""")
        cur.execute(f"""DELETE FROM {SCHEMA}.supplier_messages m
                        WHERE NOT EXISTS (SELECT 1 FROM {SCHEMA}.suppliers s WHERE s.id=m.supplier_id)""")
        cur.execute(f"SELECT COUNT(*) FROM {SCHEMA}.suppliers")
        remaining = cur.fetchone()[0]
        return ok({"removed": removed, "remaining": remaining})

    # ── ИИ-импорт: сырые строки таблицы, ИИ сам определяет колонки ──
    if method == "POST" and action == "ai_import":
        raw_rows = body.get("rows") or []
        region = body.get("region") or "Саратовская область"
        if not raw_rows:
            return err("Файл пустой")
        columns = list(raw_rows[0].keys())
        sample = raw_rows[:5]
        print(f"[ai_import] columns={columns}")
        print(f"[ai_import] sample_row={raw_rows[0]}")
        cmap = _ai_column_map(columns, sample) or {}
        used_ai = bool(cmap)
        print(f"[ai_import] ai_map={cmap}")
        # если ИИ не нашёл название — дополняем/заменяем эвристикой по заголовкам
        if "name" not in cmap.values():
            heur = _heuristic_map(columns)
            for col, field in heur.items():
                if col not in cmap and field not in cmap.values():
                    cmap[col] = field
        # крайняя мера: если название так и не найдено — берём первый непустой текстовый столбец
        if "name" not in cmap.values():
            for col in columns:
                if col in cmap:
                    continue
                val = str(raw_rows[0].get(col, "")).strip()
                if val and not val.replace(".", "").replace(",", "").replace(" ", "").isdigit():
                    cmap[col] = "name"
                    break
        print(f"[ai_import] final_map={cmap}")
        rows = _apply_map(raw_rows, cmap)
        if not rows:
            return err(
                "Не удалось распознать столбец с названием предприятия. "
                f"Столбцы в файле: {', '.join(str(c) for c in columns) or '—'}. "
                "Убедитесь, что в таблице есть колонка с наименованием организации."
            )
        inserted = 0
        for data in rows:
            data.setdefault("region", region)
            data.setdefault("source", "ai_import")
            data.setdefault("status", "new")
            cols = list(data.keys())
            ph = ", ".join(["%s"] * len(cols))
            cur.execute(
                f"INSERT INTO {SCHEMA}.suppliers ({', '.join(cols)}) VALUES ({ph})",
                [data[c] for c in cols]
            )
            inserted += 1
        return ok({"imported": inserted, "mapping": cmap, "used_ai": used_ai})

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

    # ── CRM: ИИ-анализ поставщика ──
    if method == "POST" and action == "ai_analyze":
        p = _supplier_profile(cur, sid or body.get("id"))
        if not p:
            return err("Поставщик не найден", 404)
        system = (
            "Ты — опытный менеджер по закупкам сельхозпродукции агротрейдера в Саратовской области. "
            "Компания закупает у сельхозпроизводителей зерно, подсолнечник и другую растениеводческую продукцию. "
            "Твоя задача — кратко и по делу проанализировать потенциального поставщика."
        )
        checko = _checko_lookup(p.get("inn"))
        prompt = (
            "Проанализируй сельхозпроизводителя как потенциального поставщика.\n\n"
            f"{_profile_text(p)}\n{_checko_text(checko)}\n\n"
            "Дай структурированный анализ на русском (маркдаун, кратко):\n"
            "1. **Профиль** — тип хозяйства (КФХ/СХО/агрохолдинг), масштаб, что производит.\n"
            "2. **Что можем закупать** — конкретные культуры/продукция для сотрудничества.\n"
            "3. **Потенциал** — оценка перспективности (высокий/средний/низкий) с обоснованием.\n"
            "4. **Риски и на что обратить внимание** при переговорах.\n"
            "5. **Рекомендация** — первый шаг для контакта.\n"
            "Без воды, по 1-2 предложения на пункт."
        )
        text = _ai_text(prompt, system=system, temperature=0.4, max_tokens=900)
        if not text:
            return err("ИИ-анализ временно недоступен. Попробуйте позже.", 502)
        cur.execute(f"UPDATE {SCHEMA}.suppliers SET ai_analysis=%s, updated_at=now() WHERE id=%s", (text, p["id"]))
        return ok({"analysis": text})

    # ── CRM: ИИ-генерация письма о сотрудничестве ──
    if method == "POST" and action == "ai_letter":
        p = _supplier_profile(cur, sid or body.get("id"))
        if not p:
            return err("Поставщик не найден", 404)
        tone = body.get("tone", "деловой")
        our_company = body.get("company", "агротрейдер «АгроПорт»")
        system = (
            "Ты — менеджер по развитию агротрейдера. Пишешь деловые письма сельхозпроизводителям "
            "с предложением о сотрудничестве (закупка зерна, подсолнечника, растениеводческой продукции). "
            "Пиши грамотно, вежливо, конкретно, на русском языке."
        )
        contact = p.get("contact_person") or "уважаемый руководитель"
        prompt = (
            f"Составь письмо о сотрудничестве от компании {our_company} для сельхозпроизводителя.\n\n"
            f"Данные адресата:\n{_profile_text(p)}\n\n"
            f"Тон письма: {tone}.\n"
            f"Обращение — к контактному лицу ({contact}), если оно указано.\n"
            "Структура: приветствие → кто мы и почему обращаемся именно к ним (учитывай их культуры/район) "
            "→ что предлагаем (закупка их продукции на выгодных условиях, логистика, оплата) "
            "→ призыв к действию (созвон/встреча) → подпись.\n"
            "Объём — 150-220 слов. Верни только текст письма, без пояснений."
        )
        text = _ai_text(prompt, system=system, temperature=0.6, max_tokens=800)
        if not text:
            return err("Генерация письма временно недоступна. Попробуйте позже.", 502)
        cur.execute(f"UPDATE {SCHEMA}.suppliers SET ai_letter=%s, updated_at=now() WHERE id=%s", (text, p["id"]))
        # фиксируем в истории
        cur.execute(
            f"INSERT INTO {SCHEMA}.supplier_interactions (supplier_id, type, content) VALUES (%s, 'letter', %s)",
            (p["id"], "Сгенерировано письмо о сотрудничестве (ИИ)")
        )
        return ok({"letter": text})

    # ── CRM: ИИ-обогащение карточки (структурирование данных) ──
    if method == "POST" and action == "ai_enrich":
        p = _supplier_profile(cur, sid or body.get("id"))
        if not p:
            return err("Поставщик не найден", 404)
        # Подтягиваем реальные данные из ЕГРЮЛ (Checko) по ИНН
        checko = _checko_lookup(p.get("inn"))
        checko_block = _checko_text(checko)
        system = (
            "Ты — аналитик CRM агротрейдера. Тебе дают сырые данные о сельхозпроизводителе "
            "и официальные данные из ЕГРЮЛ (если есть). "
            "Твоя задача — аккуратно СТРУКТУРИРОВАТЬ и НОРМАЛИЗОВАТЬ информацию, опираясь на факты, "
            "не выдумывая. Если данных нет — оставляй пустую строку. "
            "Отвечай строго валидным JSON без пояснений."
        )
        prompt = (
            "Разбери данные сельхозпроизводителя и верни JSON с нормализованными полями.\n\n"
            f"Исходные данные:\n{_profile_text(p)}\n{checko_block}\n\n"
            "Верни JSON строго такой структуры:\n"
            "{\n"
            '  "crops_clean": "культуры через запятую, аккуратно (из имеющихся данных)",\n'
            '  "activity_clean": "направления деятельности через запятую",\n'
            '  "farm_type": "тип: КФХ / СХО / агрохолдинг / ИП / кооператив (по названию и данным)",\n'
            '  "scale": "масштаб: малое / среднее / крупное (по выручке/численности, иначе пусто)",\n'
            '  "buy_products": "что мы можем у них закупать (зерно, подсолнечник и т.п.)",\n'
            '  "phones_clean": "телефоны в нормальном формате через запятую",\n'
            '  "emails_clean": "email через запятую",\n'
            '  "dossier": "краткое досье 3-4 предложения: кто это, чем интересен как поставщик",\n'
            '  "recommendation": "рекомендованный первый шаг для контакта, 1-2 предложения"\n'
            "}\n"
            "Только реальные факты из исходных данных. Не придумывай ИНН, объёмы, контакты."
        )
        result = _ai_json(prompt, system=system)
        if not result:
            return err("ИИ-обогащение временно недоступно. Попробуйте позже.", 502)

        # Обновляем только ПУСТЫЕ поля карточки, реальные данные не затираем
        updates = {}
        if not (p.get("crops") or "").strip() and result.get("crops_clean"):
            updates["crops"] = result["crops_clean"][:2000]
        if not (p.get("activity") or "").strip() and result.get("activity_clean"):
            updates["activity"] = result["activity_clean"][:2000]
        if not (p.get("phone") or "").strip() and result.get("phones_clean"):
            updates["phone"] = result["phones_clean"][:200]
        if not (p.get("email") or "").strip() and result.get("emails_clean"):
            updates["email"] = result["emails_clean"][:200]

        # Приоритетно заполняем пустые поля надёжными данными из ЕГРЮЛ (Checko)
        if checko:
            checko_phones = ", ".join(checko.get("phones") or [])
            checko_emails = ", ".join(checko.get("emails") or [])
            if not (p.get("address") or "").strip() and checko.get("address"):
                updates["address"] = checko["address"][:500]
            if not (p.get("contact_person") or "").strip() and checko.get("director"):
                updates["contact_person"] = checko["director"][:200]
            if not (p.get("revenue") or "").strip() and checko.get("revenue"):
                updates["revenue"] = checko["revenue"][:100]
            if not (p.get("phone") or "").strip() and checko_phones and "phone" not in updates:
                updates["phone"] = checko_phones[:200]
            if not (p.get("email") or "").strip() and checko_emails and "email" not in updates:
                updates["email"] = checko_emails[:200]

        # Собираем досье в ai_analysis (обзорная карточка)
        dossier_parts = []
        if result.get("farm_type"):
            dossier_parts.append(f"**Тип хозяйства:** {result['farm_type']}")
        if result.get("scale"):
            dossier_parts.append(f"**Масштаб:** {result['scale']}")
        if result.get("buy_products"):
            dossier_parts.append(f"**Что можем закупать:** {result['buy_products']}")
        if result.get("dossier"):
            dossier_parts.append(f"**Досье:** {result['dossier']}")
        if result.get("recommendation"):
            dossier_parts.append(f"**Рекомендация:** {result['recommendation']}")
        dossier = "\n\n".join(dossier_parts)

        set_parts = []
        set_args = []
        for k, v in updates.items():
            set_parts.append(f"{k}=%s"); set_args.append(v)
        if dossier:
            set_parts.append("ai_analysis=%s"); set_args.append(dossier)
        if set_parts:
            set_args.append(p["id"])
            cur.execute(
                f"UPDATE {SCHEMA}.suppliers SET {', '.join(set_parts)}, updated_at=now() WHERE id=%s",
                set_args
            )
        # фиксируем в истории
        filled = ", ".join(updates.keys()) if updates else "досье"
        cur.execute(
            f"INSERT INTO {SCHEMA}.supplier_interactions (supplier_id, type, content) VALUES (%s, 'note', %s)",
            (p["id"], f"ИИ обогатил карточку (обновлено: {filled})")
        )
        return ok({"enriched": result, "updated_fields": list(updates.keys()), "dossier": dossier})

    # ── CRM: массовое ИИ-обогащение (партиями) ──
    if method == "POST" and action == "ai_enrich_batch":
        inn_prefix = body.get("inn_prefix", "64")
        batch = min(int(body.get("batch", 4)), 6)
        cur.execute(
            f"""SELECT id FROM {SCHEMA}.suppliers
                WHERE inn LIKE %s AND is_farmer = true
                  AND status <> 'rejected' AND name NOT LIKE '[служебная строка]%%'
                  AND (ai_analysis IS NULL OR ai_analysis = '')
                ORDER BY priority DESC, id
                LIMIT %s""",
            (f"{inn_prefix}%", batch)
        )
        ids = [r[0] for r in cur.fetchall()]
        # сколько ещё осталось необработанных
        cur.execute(
            f"""SELECT COUNT(*) FROM {SCHEMA}.suppliers
                WHERE inn LIKE %s AND is_farmer = true
                  AND status <> 'rejected' AND name NOT LIKE '[служебная строка]%%'
                  AND (ai_analysis IS NULL OR ai_analysis = '')""",
            (f"{inn_prefix}%",)
        )
        remaining_before = cur.fetchone()[0]

        system = (
            "Ты — аналитик CRM агротрейдера. Структурируй имеющиеся данные о хозяйстве, "
            "не выдумывая факты. Отвечай строго валидным JSON."
        )
        processed = 0
        for supplier_id in ids:
            p = _supplier_profile(cur, supplier_id)
            if not p:
                continue
            prompt = (
                "Разбери данные сельхозпроизводителя и верни JSON.\n\n"
                f"{_profile_text(p)}\n\n"
                'Формат: {"farm_type":"", "scale":"", "buy_products":"", '
                '"dossier":"3-4 предложения", "recommendation":"1-2 предложения"}\n'
                "Только реальные факты из данных."
            )
            result = _ai_json(prompt, system=system, max_tokens=700)
            if not result:
                continue
            parts = []
            if result.get("farm_type"): parts.append(f"**Тип хозяйства:** {result['farm_type']}")
            if result.get("scale"): parts.append(f"**Масштаб:** {result['scale']}")
            if result.get("buy_products"): parts.append(f"**Что можем закупать:** {result['buy_products']}")
            if result.get("dossier"): parts.append(f"**Досье:** {result['dossier']}")
            if result.get("recommendation"): parts.append(f"**Рекомендация:** {result['recommendation']}")
            dossier = "\n\n".join(parts)
            if dossier:
                cur.execute(f"UPDATE {SCHEMA}.suppliers SET ai_analysis=%s, updated_at=now() WHERE id=%s", (dossier, supplier_id))
                cur.execute(
                    f"INSERT INTO {SCHEMA}.supplier_interactions (supplier_id, type, content) VALUES (%s, 'note', %s)",
                    (supplier_id, "ИИ сформировал досье (массовое обогащение)")
                )
                processed += 1
        return ok({"processed": processed, "remaining": max(0, remaining_before - processed)})

    # ── История взаимодействий: список ──
    if method == "GET" and action == "history" and sid:
        cur.execute(
            f"""SELECT id, type, content, author, created_at
                FROM {SCHEMA}.supplier_interactions
                WHERE supplier_id=%s ORDER BY created_at DESC""",
            (sid,)
        )
        keys = ["id", "type", "content", "author", "created_at"]
        items = [dict(zip(keys, r)) for r in cur.fetchall()]
        return ok({"interactions": items})

    # ── История взаимодействий: добавить запись ──
    if method == "POST" and action == "history" and sid:
        itype = (body.get("type") or "note").strip()
        content = (body.get("content") or "").strip()
        author = (body.get("author") or "").strip() or None
        allowed = {"note", "call", "email", "meeting", "status", "letter"}
        if itype not in allowed:
            itype = "note"
        if not content:
            return err("Текст записи обязателен")
        cur.execute(
            f"""INSERT INTO {SCHEMA}.supplier_interactions (supplier_id, type, content, author)
                VALUES (%s, %s, %s, %s) RETURNING id, created_at""",
            (sid, itype, content, author)
        )
        row = cur.fetchone()
        # обновляем дату последнего контакта у поставщика
        if itype in ("call", "email", "meeting", "letter"):
            cur.execute(f"UPDATE {SCHEMA}.suppliers SET last_contact_at=now() WHERE id=%s", (sid,))
        return ok({"id": row[0], "created_at": row[1]})

    # ── История взаимодействий: удалить запись ──
    if method == "DELETE" and action == "history":
        hid = params.get("hid")
        if not hid:
            return err("Не указан id записи")
        cur.execute(f"DELETE FROM {SCHEMA}.supplier_interactions WHERE id=%s RETURNING id", (hid,))
        if not cur.fetchone():
            return err("Запись не найдена", 404)
        return ok({"ok": True})

    # Исключение служебных/мусорных строк из аналитики и справочников
    NOT_JUNK = "status <> 'rejected' AND name NOT LIKE '[служебная строка]%%' AND "
    JUNK_ACT = "btrim(a.act) NOT IN ('Направление деятельности','Дополнительные услуги и продукция') AND "
    JUNK_OWN = "ownership NOT IN ('Подчиненность вышестоящей организации','Форма собственности') AND "

    # ── Справочники для фильтров (facets) ──
    if method == "GET" and action == "facets":
        region = params.get("region", "")
        inn_prefix = params.get("inn_prefix", "")
        # Условие по региону и/или ИНН-префиксу (для районов/направлений/собственности)
        rcond = ""
        rargs = []
        if region:
            rcond += "region=%s AND "; rargs.append(region)
        if inn_prefix:
            rcond += "inn LIKE %s AND "; rargs.append(f"{inn_prefix}%%")
        # Регионы (всегда полный список)
        cur.execute(f"SELECT region, COUNT(*) FROM {SCHEMA}.suppliers WHERE {NOT_JUNK}region IS NOT NULL AND region<>'' GROUP BY region ORDER BY 2 DESC", [])
        regions = [{"value": r[0], "count": r[1]} for r in cur.fetchall()]
        # Районы (по выбранному региону, если задан)
        cur.execute(f"SELECT district, COUNT(*) FROM {SCHEMA}.suppliers WHERE {NOT_JUNK}{rcond}district IS NOT NULL AND district<>'' GROUP BY district ORDER BY 1", rargs)
        districts = [{"value": r[0], "count": r[1]} for r in cur.fetchall()]
        # Направления деятельности — разбиваем строки по ';'
        cur.execute(f"""
            SELECT btrim(a.act) AS act, COUNT(*) AS cnt
            FROM {SCHEMA}.suppliers s,
                 LATERAL unnest(string_to_array(s.activity, ';')) AS a(act)
            WHERE {NOT_JUNK}{rcond}{JUNK_ACT}btrim(a.act) <> ''
            GROUP BY btrim(a.act) ORDER BY cnt DESC LIMIT 60
        """, rargs)
        activities = [{"value": r[0], "count": r[1]} for r in cur.fetchall()]
        # Формы собственности
        cur.execute(f"SELECT ownership, COUNT(*) FROM {SCHEMA}.suppliers WHERE {NOT_JUNK}{rcond}{JUNK_OWN}ownership IS NOT NULL AND ownership<>'' GROUP BY ownership ORDER BY 2 DESC", rargs)
        ownerships = [{"value": r[0], "count": r[1]} for r in cur.fetchall()]
        return ok({"regions": regions, "districts": districts, "activities": activities, "ownerships": ownerships})

    # ── Аналитика: сводка по районам и направлениям ──
    if method == "GET" and action == "analytics":
        region = params.get("region", "") or "Саратовская область"
        cur.execute(f"SELECT COUNT(*) FROM {SCHEMA}.suppliers WHERE {NOT_JUNK}region=%s", [region])
        total = cur.fetchone()[0]
        cur.execute(f"""SELECT COALESCE(NULLIF(district,''),'— не указан') AS d, COUNT(*)
                        FROM {SCHEMA}.suppliers WHERE {NOT_JUNK}region=%s GROUP BY d ORDER BY 2 DESC""", [region])
        by_district = [{"district": r[0], "count": r[1]} for r in cur.fetchall()]
        cur.execute(f"""
            SELECT btrim(a.act) AS act, COUNT(*) AS cnt
            FROM {SCHEMA}.suppliers s,
                 LATERAL unnest(string_to_array(s.activity, ';')) AS a(act)
            WHERE {NOT_JUNK}s.region=%s AND {JUNK_ACT}btrim(a.act) <> ''
            GROUP BY btrim(a.act) ORDER BY cnt DESC LIMIT 25
        """, [region])
        by_activity = [{"activity": r[0], "count": r[1]} for r in cur.fetchall()]
        cur.execute(f"""SELECT COALESCE(NULLIF(ownership,''),'— не указана') AS o, COUNT(*)
                        FROM {SCHEMA}.suppliers
                        WHERE {NOT_JUNK}region=%s
                          AND COALESCE(ownership,'') NOT IN ('Подчиненность вышестоящей организации','Форма собственности')
                        GROUP BY o ORDER BY 2 DESC""", [region])
        by_ownership = [{"ownership": r[0], "count": r[1]} for r in cur.fetchall()]
        return ok({"region": region, "total": total,
                   "by_district": by_district, "by_activity": by_activity, "by_ownership": by_ownership})

    # ── Радар: рейтинг «горячих» потенциальных клиентов по текущей выборке ──
    if method == "GET" and action == "radar":
        where, args = _build_where(params)
        try:
            limit = min(int(params.get("limit", 50)), 200)
        except (ValueError, TypeError):
            limit = 50
        # Балл вероятности сделки 0..100 считается прямо в SQL по данным карточки.
        score_sql = """
            (
              LEAST(40, COALESCE(volume_tons,0) / 100.0)                                   -- объём (до 40)
              + CASE WHEN phone IS NOT NULL AND phone<>'' THEN 12 ELSE 0 END               -- есть телефон
              + CASE WHEN email IS NOT NULL AND email<>'' THEN 8 ELSE 0 END                -- есть почта
              + CASE WHEN contact_person IS NOT NULL AND contact_person<>'' THEN 6 ELSE 0 END
              + CASE WHEN inn IS NOT NULL AND inn<>'' THEN 4 ELSE 0 END
              + CASE WHEN is_farmer THEN 6 ELSE 0 END
              + LEAST(10, priority * 5)                                                     -- приоритетный район
              + CASE status
                    WHEN 'negotiation' THEN 12 WHEN 'in_progress' THEN 8
                    WHEN 'new' THEN 5 WHEN 'partner' THEN 3 ELSE 0 END
              + CASE
                    WHEN last_contact_at IS NULL THEN 6                                      -- ещё не касались — свежий лид
                    WHEN last_contact_at < now() - interval '60 days' THEN 4                 -- пора вернуться
                    ELSE 0 END
            )
        """
        cur.execute(
            f"""SELECT id, name, inn, district, locality, crops, volume_tons,
                       contact_person, phone, email, status, is_farmer, priority,
                       ai_analysis, last_contact_at,
                       ROUND(LEAST(100, {score_sql}))::int AS score
                FROM {SCHEMA}.suppliers {where}
                ORDER BY score DESC, COALESCE(volume_tons,0) DESC
                LIMIT %s""",
            args + [limit]
        )
        rcols = ["id","name","inn","district","locality","crops","volume_tons",
                 "contact_person","phone","email","status","is_farmer","priority",
                 "ai_analysis","last_contact_at","score"]
        items = []
        for r in cur.fetchall():
            d = dict(zip(rcols, r))
            vol = float(d["volume_tons"] or 0)
            reasons = []
            if vol >= 1000: reasons.append(f"Крупный объём: {int(vol)} т")
            elif vol > 0:   reasons.append(f"Объём: {int(vol)} т")
            if d["phone"] or d["email"]: reasons.append("Есть контакты")
            else: reasons.append("Нет прямых контактов")
            if d["priority"]: reasons.append("Приоритетный район")
            if d["status"] == "negotiation": reasons.append("В переговорах")
            elif d["status"] == "in_progress": reasons.append("В работе")
            if not d["last_contact_at"]: reasons.append("Ещё не связывались")
            if not d["ai_analysis"]: reasons.append("Нет ИИ-досье")
            if d["volume_tons"] is not None:
                d["volume_tons"] = float(d["volume_tons"])
            d["last_contact_at"] = d["last_contact_at"].isoformat() if d["last_contact_at"] else None
            d["reasons"] = reasons
            d["temp"] = "hot" if d["score"] >= 60 else ("warm" if d["score"] >= 35 else "cold")
            items.append(d)
        # Сводка по «температуре» всей выборки
        cur.execute(
            f"""SELECT
                    COUNT(*) AS total,
                    COUNT(*) FILTER (WHERE ROUND(LEAST(100,{score_sql})) >= 60) AS hot,
                    COUNT(*) FILTER (WHERE ROUND(LEAST(100,{score_sql})) BETWEEN 35 AND 59) AS warm,
                    COUNT(*) FILTER (WHERE ai_analysis IS NULL OR ai_analysis='') AS no_analysis
                FROM {SCHEMA}.suppliers {where}""",
            args
        )
        s = cur.fetchone()
        summary = {"total": int(s[0]), "hot": int(s[1]), "warm": int(s[2]), "no_analysis": int(s[3])}
        return ok({"radar": items, "summary": summary})

    # ── Анализ качества данных по текущей выборке фильтров ──
    if method == "GET" and action == "quality":
        where, args = _build_where(params)
        base = f"FROM {SCHEMA}.suppliers {where}"
        cur.execute(f"""SELECT
                COUNT(*) AS total,
                COUNT(*) FILTER (WHERE inn IS NULL OR inn='') AS no_inn,
                COUNT(*) FILTER (WHERE phone IS NULL OR phone='') AS no_phone,
                COUNT(*) FILTER (WHERE email IS NULL OR email='') AS no_email,
                COUNT(*) FILTER (WHERE (phone IS NULL OR phone='') AND (email IS NULL OR email='')) AS no_contacts,
                COUNT(*) FILTER (WHERE contact_person IS NULL OR contact_person='') AS no_person,
                COUNT(*) FILTER (WHERE crops IS NULL OR crops='') AS no_crops,
                COUNT(*) FILTER (WHERE address IS NULL OR address='') AS no_address,
                COUNT(*) FILTER (WHERE ai_analysis IS NULL OR ai_analysis='') AS no_analysis,
                COUNT(*) FILTER (WHERE district IS NULL OR district='') AS no_district
            {base}""", args)
        row = cur.fetchone()
        cols = ["total", "no_inn", "no_phone", "no_email", "no_contacts",
                "no_person", "no_crops", "no_address", "no_analysis", "no_district"]
        stats = dict(zip(cols, [int(x) for x in row]))
        # Дубли внутри выборки: по ИНН (если есть), иначе по названию+районе
        cur.execute(f"""SELECT COALESCE(SUM(cnt-1),0) FROM (
                SELECT COUNT(*) cnt
                {base} AND inn IS NOT NULL AND inn<>''
                GROUP BY lower(inn) HAVING COUNT(*)>1
            ) q""", args)
        dup_inn = int(cur.fetchone()[0])
        cur.execute(f"""SELECT COALESCE(SUM(cnt-1),0) FROM (
                SELECT COUNT(*) cnt
                {base} AND (inn IS NULL OR inn='')
                GROUP BY lower(name), COALESCE(lower(district),'') HAVING COUNT(*)>1
            ) q""", args)
        dup_name = int(cur.fetchone()[0])
        stats["duplicates"] = dup_inn + dup_name
        return ok(stats)

    # ── Список ──
    if method == "GET" and not sid:
        page = int(params.get("page", 1))
        limit = 50
        offset = (page - 1) * limit
        where, args = _build_where(params)

        cur.execute(f"SELECT COUNT(*) FROM {SCHEMA}.suppliers {where}", args)
        total = cur.fetchone()[0]

        cur.execute(
            f"""SELECT id, name, inn, region, district, locality, crops, volume_tons,
                       contact_person, phone, email, address, status, source, notes,
                       ownership, website, fax, revenue, staff_count, founded_year, activity, postal_code,
                       is_farmer, priority, ai_analysis, ai_letter,
                       created_at, updated_at
                FROM {SCHEMA}.suppliers {where}
                ORDER BY priority DESC, created_at DESC LIMIT %s OFFSET %s""",
            args + [limit, offset]
        )
        cols = ["id","name","inn","region","district","locality","crops","volume_tons",
                "contact_person","phone","email","address","status","source","notes",
                "ownership","website","fax","revenue","staff_count","founded_year","activity","postal_code",
                "is_farmer","priority","ai_analysis","ai_letter",
                "created_at","updated_at"]
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
            return err("Название предприятия обязательно")
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
        # если меняется статус — зафиксируем это в истории
        old_status = None
        if "status" in updates:
            cur.execute(f"SELECT status FROM {SCHEMA}.suppliers WHERE id=%s", (sid,))
            r = cur.fetchone()
            old_status = r[0] if r else None
        set_clause = ", ".join(f"{k}=%s" for k in updates) + ", updated_at=now()"
        cur.execute(
            f"UPDATE {SCHEMA}.suppliers SET {set_clause} WHERE id=%s RETURNING id",
            list(updates.values()) + [sid]
        )
        if not cur.fetchone():
            return err("Поставщик не найден", 404)
        if "status" in updates and updates["status"] != old_status:
            labels = {"new": "Новый", "in_progress": "В работе", "negotiation": "Переговоры",
                      "partner": "Партнёр", "rejected": "Отказ"}
            new_lbl = labels.get(updates["status"], updates["status"])
            cur.execute(
                f"INSERT INTO {SCHEMA}.supplier_interactions (supplier_id, type, content) VALUES (%s, 'status', %s)",
                (sid, f"Статус изменён на «{new_lbl}»")
            )
        return ok({"ok": True})

    # ── Удаление ──
    if method == "DELETE" and sid:
        cur.execute(f"DELETE FROM {SCHEMA}.suppliers WHERE id=%s RETURNING id", (sid,))
        if not cur.fetchone():
            return err("Поставщик не найден", 404)
        return ok({"ok": True})

    return err("Неизвестный запрос", 404)