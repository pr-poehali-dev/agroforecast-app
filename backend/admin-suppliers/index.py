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
                obj[field] = str(val).strip()
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
        cmap = _ai_column_map(columns, sample) or {}
        # если ИИ не нашёл название — дополняем/заменяем эвристикой по заголовкам
        if "name" not in cmap.values():
            heur = _heuristic_map(columns)
            for col, field in heur.items():
                if col not in cmap and field not in cmap.values():
                    cmap[col] = field
        rows = _apply_map(raw_rows, cmap)
        if not rows:
            return err("Не удалось распознать ни одного производителя. Проверьте, что в таблице есть столбец с названием предприятия.")
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
        return ok({"imported": inserted, "mapping": cmap})

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
                       contact_person, phone, email, address, status, source, notes,
                       ownership, website, fax, revenue, staff_count, founded_year, activity, postal_code,
                       created_at, updated_at
                FROM {SCHEMA}.suppliers {where}
                ORDER BY created_at DESC LIMIT %s OFFSET %s""",
            args + [limit, offset]
        )
        cols = ["id","name","inn","region","district","locality","crops","volume_tons",
                "contact_person","phone","email","address","status","source","notes",
                "ownership","website","fax","revenue","staff_count","founded_year","activity","postal_code",
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