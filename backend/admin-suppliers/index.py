"""
База сельхозпроизводителей (поставщиков) по регионам.
CRUD + пакетный импорт из Excel/CSV (фронт присылает готовый массив строк).
"""
import json, os
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

def _clean(row):
    out = {}
    for k in FIELDS:
        if k in row and row[k] not in (None, ""):
            out[k] = row[k]
    return out


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
        prompt = (
            "Проанализируй сельхозпроизводителя как потенциального поставщика.\n\n"
            f"{_profile_text(p)}\n\n"
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
        return ok({"letter": text})

    # Исключение служебных/мусорных строк из аналитики и справочников
    NOT_JUNK = "status <> 'rejected' AND name NOT LIKE '[служебная строка]%' AND "
    JUNK_ACT = "btrim(a.act) NOT IN ('Направление деятельности','Дополнительные услуги и продукция') AND "
    JUNK_OWN = "ownership NOT IN ('Подчиненность вышестоящей организации','Форма собственности') AND "

    # ── Справочники для фильтров (facets) ──
    if method == "GET" and action == "facets":
        region = params.get("region", "")
        # Условие по региону (для районов/направлений/собственности)
        rcond = "region=%s AND " if region else ""
        rargs = [region] if region else []
        # Регионы (всегда полный список)
        cur.execute(f"SELECT region, COUNT(*) FROM {SCHEMA}.suppliers WHERE {NOT_JUNK}region IS NOT NULL AND region<>'' GROUP BY region ORDER BY 2 DESC")
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

    # ── Список ──
    if method == "GET" and not sid:
        search = params.get("search", "")
        region = params.get("region", "")
        district = params.get("district", "")
        status = params.get("status", "")
        activity = params.get("activity", "")
        crop = params.get("crop", "")
        ownership = params.get("ownership", "")
        farmer = params.get("farmer", "")        # "1" — только сельхозпроизводители
        priority = params.get("priority", "")     # "2" — районы вокруг Аткарска
        inn_prefix = params.get("inn_prefix", "") # напр. "64" — саратовские
        page = int(params.get("page", 1))
        limit = 50
        offset = (page - 1) * limit

        where = "WHERE name NOT LIKE '[служебная строка]%%'"
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
        if activity:
            where += " AND activity ILIKE %s"; args.append(f"%{activity}%")
        if crop:
            where += " AND crops ILIKE %s"; args.append(f"%{crop}%")
        if ownership:
            where += " AND ownership=%s"; args.append(ownership)
        if farmer == "1":
            where += " AND is_farmer = true"
        if priority:
            where += " AND priority = %s"; args.append(int(priority))
        if inn_prefix:
            where += " AND inn LIKE %s"; args.append(f"{inn_prefix}%")

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