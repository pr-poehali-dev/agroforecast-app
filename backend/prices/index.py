"""
Актуальные котировки зерновых — АгроПорт.
Получает цены с открытых российских источников, возвращает структурированные данные.
Основной источник — цены закупщиков «Цена Зерна» (медиана по закупщикам, базис CPT).
Кэширование: 6 часов. Если источники недоступны — ориентировочные цены с пометкой is_fallback.
"""
import json
import os
import re
import time
import urllib.request
import urllib.error
from datetime import datetime, timezone

import cenazerna

CORS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Content-Type": "application/json",
}

# Культуры, по которым собираются котировки (порядок вывода).
CROPS_ORDER = ["Пшеница озимая", "Подсолнечник", "Кукуруза", "Ячмень яровой", "Рожь"]

CROP_META = {
    "Пшеница озимая": {"region": "Поволжье / ЕФО",   "quality": "3 класс"},
    "Подсолнечник":   {"region": "Поволжье / ЮФО",   "quality": "МЭЗ закупка"},
    "Кукуруза":       {"region": "Поволжье",          "quality": "внутренний рынок"},
    "Ячмень яровой":  {"region": "Поволжье / ЦФО",   "quality": "фуражный"},
    "Рожь":           {"region": "ПФО / ЦФО",        "quality": "3 класс"},
}

# ─── Модульный кэш (живёт в памяти worker-процесса) ──────────────────────────
_cache: dict = {"data": None, "ts": 0.0}
_LAST_BUYER_ROWS: dict[str, list] = {}
CACHE_TTL = 6 * 3600  # 6 часов

# ─── HTTP helper ──────────────────────────────────────────────────────────────

def _fetch(url: str, timeout: int = 10) -> str | None:
    """GET-запрос, возвращает текст или None при любой ошибке."""
    try:
        req = urllib.request.Request(
            url,
            headers={
                "User-Agent": "AgroPort/2.0 (grain-prices-bot; +https://agroport-ai.ru)",
                "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
                "Accept-Language": "ru,en;q=0.5",
            },
        )
        with urllib.request.urlopen(req, timeout=timeout) as resp:
            raw = resp.read()
            # Пробуем UTF-8, затем CP1251
            for enc in ("utf-8", "cp1251", "latin-1"):
                try:
                    return raw.decode(enc)
                except Exception:
                    pass
    except Exception:
        pass
    return None

# ─── Парсеры ──────────────────────────────────────────────────────────────────

def _extract_first_int(patterns: list[str], text: str, lo: int = 5000, hi: int = 100000) -> int | None:
    """Ищет первое целое число в указанных диапазонах по списку регулярок."""
    for pat in patterns:
        for m in re.finditer(pat, text, re.IGNORECASE | re.DOTALL):
            # Находим все числа в найденном совпадении
            nums = re.findall(r"\d[\d\s]{2,6}\d", m.group(0))
            for n in nums:
                val = int(re.sub(r"\s", "", n))
                if lo <= val <= hi:
                    return val
    return None

def _parse_mcx(html: str) -> dict[str, int]:
    """Минсельхоз — страница мониторинга цен.
    Ищем цену только в коротком окне после названия культуры и только с единицей «руб/т»,
    чтобы не цеплять годы, номера и прочие числа. Работает по очищенному тексту за линейное время."""
    text = re.sub(r"<script.*?</script>|<style.*?</style>", " ", html[:600_000], flags=re.S | re.I)
    text = re.sub(r"<[^>]+>", " ", text)
    text = re.sub(r"&nbsp;|\s+", " ", text)
    names = {
        "Пшеница озимая": r"пшениц[а-я]{0,4}", "Подсолнечник": r"подсолнечник[а-я]{0,3}",
        "Кукуруза": r"кукуруз[а-я]{0,3}", "Ячмень яровой": r"ячмен[а-я]{0,3}", "Рожь": r"рож[ьи]",
    }
    price_re = re.compile(r"(\d{1,2}[\s\u00a0]?\d{3})(?:[.,]\d+)?\s?(?:руб|₽)[^\s]{0,3}\s?/?\s?т", re.I)
    found: dict[str, int] = {}
    for crop, name in names.items():
        lo, hi = (30000, 90000) if crop == "Подсолнечник" else (5000, 30000)
        for m in re.finditer(name, text, re.I):
            win = text[m.end(): m.end() + 80]
            p = price_re.search(win)
            if p:
                val = int(re.sub(r"\D", "", p.group(1)))
                if lo <= val <= hi:
                    found[crop] = val
                    break
    return found

def _parse_zerno_rss(xml: str) -> dict[str, int]:
    """zerno.ru RSS — заголовки и описания содержат ценовые данные."""
    found: dict[str, int] = {}
    # Извлекаем все блоки <item>
    items = re.findall(r"<item>(.*?)</item>", xml, re.S)
    text_blob = " ".join(items)

    searches = [
        ("Пшеница озимая", [r"пшениц[а-я]*\s*3[- ]?\w*\s*[—\-:]\s*(\d[\d\s]{3,4})",
                             r"пшениц[а-я]*.*?(\d{4,5})\s*(?:руб|₽|тыс\.?\s*руб)"],
         5000, 22000),
        ("Подсолнечник",   [r"подсолнечник.*?(\d{4,6})\s*(?:руб|₽)",
                             r"семечк[а-я]*.*?(\d{4,6})\s*(?:руб|₽)"],
         25000, 85000),
        ("Кукуруза",       [r"кукуруз[а-я]*.*?(\d{4,5})\s*(?:руб|₽)"],
         7000, 22000),
        ("Ячмень яровой",  [r"ячмен[а-я]*.*?(\d{4,5})\s*(?:руб|₽)"],
         5000, 20000),
        ("Рожь",           [r"рож[а-я]*.*?(\d{4,5})\s*(?:руб|₽)"],
         5000, 18000),
    ]
    for crop, pats, lo, hi in searches:
        val = _extract_first_int(pats, text_blob, lo=lo, hi=hi)
        if val:
            found[crop] = val
    return found

def _parse_ikar(html: str) -> int | None:
    """ikar.ru/wheat — страница котировок пшеницы."""
    patterns = [
        r"EXW.*?Поволж.*?(\d[\d\s]{3,4})",
        r"пшениц[а-я]*.*?(\d[\d\s]{3,4})\s*(?:руб|₽)",
        r"(\d[\d\s]{3,4})\s*(?:руб|₽/т|тыс)",
    ]
    return _extract_first_int(patterns, html, lo=8000, hi=20000)

def _parse_agroinvestor_rss(xml: str) -> dict[str, int]:
    """agroinvestor.ru RSS — новости с ценами."""
    found: dict[str, int] = {}
    items = re.findall(r"<item>(.*?)</item>", xml, re.S)
    text_blob = " ".join(items)

    searches = [
        ("Пшеница озимая", [r"пшениц[а-я]*.*?(\d{4,5})\s*(?:руб|₽)/т",
                             r"(\d{4,5})\s*(?:руб|₽)/т.*?пшениц"],
         8000, 20000),
        ("Подсолнечник",   [r"подсолнечник.*?(\d{4,6})\s*(?:руб|₽)/т"],
         28000, 80000),
        ("Кукуруза",       [r"кукуруз[а-я]*.*?(\d{4,5})\s*(?:руб|₽)/т"],
         8000, 22000),
    ]
    for crop, pats, lo, hi in searches:
        val = _extract_first_int(pats, text_blob, lo=lo, hi=hi)
        if val:
            found[crop] = val
    return found

# ─── Основная функция получения цен ───────────────────────────────────────────

def _fetch_live_prices() -> tuple[dict[str, dict], dict[str, str]]:
    """
    Опрашивает источники параллельно (общий бюджет ~8 с), затем сливает
    цены в порядке приоритета источников. Возвращает (merged_prices, source_status).
    """
    from concurrent.futures import ThreadPoolExecutor
    urls = {
        "mcx": ("https://mcx.gov.ru/ministry/departments/"
                "departament-ekonomiki-i-gosudarstvennoy-podderzhki-apk/"
                "industry-information/info-agrarnye-rynki/"),
        "zerno": "https://zerno.ru/rss.xml",
        "ikar": "https://www.ikar.ru/wheat.html",
        "agroinvestor": "https://agroinvestor.ru/rss/",
    }
    with ThreadPoolExecutor(max_workers=5) as ex:
        cz_fut = ex.submit(cenazerna.fetch_all)
        futs = {k: ex.submit(_fetch, u, 6) for k, u in urls.items()}
        raw = {}
        for k, f in futs.items():
            try:
                raw[k] = f.result(timeout=8)
            except Exception:
                raw[k] = None
        try:
            cz_rows, cz_status = cz_fut.result(timeout=22)
        except Exception:
            cz_rows, cz_status = {}, "failed"

    merged: dict[str, dict] = {}
    status: dict[str, str] = {"cenazerna": cz_status}
    for crop, rows in cz_rows.items():
        sm = cenazerna.summarize(rows)
        if sm:
            merged[crop] = {"price": sm["price"], "source": cenazerna.SOURCE, "summary": sm}
    _LAST_BUYER_ROWS.clear(); _LAST_BUYER_ROWS.update(cz_rows)
    parsers = [
        ("mcx", _parse_mcx, "Минсельхоз РФ"),
        ("zerno", _parse_zerno_rss, "zerno.ru"),
        ("agroinvestor", _parse_agroinvestor_rss, "agroinvestor.ru"),
    ]
    for key, parse, label in parsers[:2]:
        body = raw.get(key)
        if not body:
            status[key] = "failed"; continue
        prices = parse(body)
        status[key] = "ok" if prices else "no_data"
        for crop, price in (prices or {}).items():
            merged.setdefault(crop, {"price": price, "source": label})

    body = raw.get("ikar")
    if body:
        wheat_price = _parse_ikar(body)
        if wheat_price and "Пшеница озимая" not in merged:
            merged["Пшеница озимая"] = {"price": wheat_price, "source": "ИКАР"}
        status["ikar"] = "ok" if wheat_price else "no_data"
    else:
        status["ikar"] = "failed"

    key, parse, label = parsers[2]
    body = raw.get(key)
    if body:
        prices = parse(body)
        status[key] = "ok" if prices else "no_data"
        for crop, price in (prices or {}).items():
            merged.setdefault(crop, {"price": price, "source": label})
    else:
        status[key] = "failed"
    return merged, status


# ─── Накопление собранных котировок (история для будущего обучения модели) ────
def _save_quotes(live: dict[str, dict]) -> int:
    """Пишет в price_quotes только реально собранные цены, не чаще раза в 6 ч на культуру+источник."""
    dsn = os.environ.get("DATABASE_URL")
    if not dsn or not live:
        return 0
    schema = os.environ.get("MAIN_DB_SCHEMA", "t_p36960093_agroforecast_app")
    try:
        import psycopg2
        conn = psycopg2.connect(dsn); conn.autocommit = True
        cur = conn.cursor(); n = 0
        for crop, d in live.items():
            cur.execute(
                f"""INSERT INTO {schema}.price_quotes (crop, price_rub_t, source)
                    SELECT %s, %s, %s WHERE NOT EXISTS (
                      SELECT 1 FROM {schema}.price_quotes
                      WHERE crop=%s AND source=%s AND fetched_at > now() - interval '6 hours')""",
                (crop, d["price"], d["source"], crop, d["source"]))
            n += max(cur.rowcount, 0)
        cur.close(); conn.close()
        return n
    except Exception as e:
        print(f"[prices] save quotes error: {e}")
        return 0


def _save_buyer_prices() -> int:
    dsn = os.environ.get("DATABASE_URL")
    if not dsn or not _LAST_BUYER_ROWS:
        return 0
    schema = os.environ.get("MAIN_DB_SCHEMA", "t_p36960093_agroforecast_app")
    try:
        import psycopg2
        conn = psycopg2.connect(dsn); conn.autocommit = True
        cur = conn.cursor()
        n = cenazerna.save(cur, schema, _LAST_BUYER_ROWS)
        cur.close(); conn.close()
        return n
    except Exception as e:
        print(f"[prices] save buyer prices error: {e}")
        return 0


def _db_latest() -> dict[str, dict]:
    """Последняя сохранённая сводка по каждой культуре (если источник временно недоступен)."""
    dsn = os.environ.get("DATABASE_URL")
    if not dsn:
        return {}
    schema = os.environ.get("MAIN_DB_SCHEMA", "t_p36960093_agroforecast_app")
    try:
        import psycopg2
        conn = psycopg2.connect(dsn); cur = conn.cursor()
        cur.execute(f"""
            WITH last AS (SELECT crop, max(price_date) d FROM {schema}.buyer_prices GROUP BY crop)
            SELECT b.crop, l.d,
                   percentile_cont(0.5) WITHIN GROUP (ORDER BY b.price_rub_t),
                   min(b.price_rub_t), max(b.price_rub_t), count(*),
                   count(DISTINCT b.company), count(DISTINCT b.region)
            FROM {schema}.buyer_prices b JOIN last l ON l.crop=b.crop AND l.d=b.price_date
            GROUP BY b.crop, l.d""")
        out = {c: {"price": round(float(m)), "min": round(float(lo)), "max": round(float(hi)), "n": n,
                   "companies": co, "regions": rg, "day_change": None, "date": str(d)}
               for c, d, m, lo, hi, n, co, rg in cur.fetchall()}
        cur.close(); conn.close()
        return out
    except Exception as e:
        print(f"[prices] db fallback error: {e}")
        return {}


# ─── Сборка финального ответа ─────────────────────────────────────────────────

def _build_response(live: dict[str, dict], status: dict[str, str]) -> dict:
    now_iso = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%S")
    prices_out = []

    any_live = bool(live)

    stored = {} if all(c in live for c in CROPS_ORDER) else _db_latest()
    for crop in CROPS_ORDER:
        live_entry = live.get(crop)
        sm = (live_entry or {}).get("summary") or stored.get(crop)
        if not sm and not live_entry:
            continue
        is_fallback = live_entry is None
        price = live_entry["price"] if live_entry else sm["price"]
        change = sm.get("day_change") if sm else None
        meta = CROP_META.get(crop, {"region": "Россия", "quality": ""})
        prices_out.append({
            "crop":          crop,
            "price":         price,
            "change":        change,
            "change_pct":    (round(100 * change / (price - change), 2) if change and price != change else (0.0 if change == 0 else None)),
            "change_period": "день" if change is not None else None,
            "trend":         ("up" if change > 0 else "down" if change < 0 else "flat") if change is not None else None,
            "region":        f"{sm['regions']} регионов РФ" if sm else meta["region"],
            "quality":       "медиана цен закупщиков, CPT" if sm else meta["quality"],
            "range_min":     sm["min"] if sm else None,
            "range_max":     sm["max"] if sm else None,
            "buyers":        sm["companies"] if sm else None,
            "offers":        sm["n"] if sm else None,
            "small_sample":  bool(sm and sm["companies"] < 5),
            "price_date":    sm["date"] if sm else None,
            "source":        (live_entry["source"] if live_entry else f"{cenazerna.SOURCE} (сохранено)"),
            "fetched_at":    now_iso,
            "is_fallback":   is_fallback,
        })

    return {
        "prices":        prices_out,
        "updated_at":    now_iso,
        "any_live":      any_live,
        "source_status": status,
    }

# ─── Handler ──────────────────────────────────────────────────────────────────

def _db_last_fetch_age_h() -> float | None:
    dsn = os.environ.get("DATABASE_URL")
    if not dsn:
        return None
    schema = os.environ.get("MAIN_DB_SCHEMA", "t_p36960093_agroforecast_app")
    try:
        import psycopg2
        conn = psycopg2.connect(dsn); cur = conn.cursor()
        cur.execute(f"SELECT EXTRACT(EPOCH FROM now() - max(fetched_at))/3600 FROM {schema}.buyer_prices")
        v = cur.fetchone()[0]; cur.close(); conn.close()
        return float(v) if v is not None else None
    except Exception as e:
        print(f"[prices] age check error: {e}")
        return None


def handler(event: dict, context) -> dict:
    """Котировки зерновых: цены закупщиков «Цена Зерна» + прочие источники.
    Обычный запрос отдаёт последние сохранённые данные; сбор заново — если им больше 6 ч или ?force=1."""
    if event.get("httpMethod") == "OPTIONS":
        return {"statusCode": 200, "headers": CORS, "body": ""}

    now_ts = time.time()
    force  = (event.get("queryStringParameters") or {}).get("force") == "1"

    if not force and _cache["data"] is not None and (now_ts - _cache["ts"]) < CACHE_TTL:
        cached = dict(_cache["data"])
        cached["from_cache"] = True
        cached["cache_age_min"] = round((now_ts - _cache["ts"]) / 60)
        return {"statusCode": 200, "headers": CORS, "body": json.dumps(cached, ensure_ascii=False)}

    age = None if force else _db_last_fetch_age_h()
    if not force and age is not None and age < CACHE_TTL / 3600:
        data = _build_response({}, {"cenazerna": "stored"})
        data["any_live"] = True
        data["stored_age_min"] = round(age * 60)
        for p in data["prices"]:
            p["source"] = cenazerna.SOURCE
            p["is_fallback"] = False
    else:
        try:
            live, status = _fetch_live_prices()
        except Exception:
            live, status = {}, {"error": "fetch_exception"}
        data = _build_response(live, status)
        data["saved_quotes"] = _save_quotes(live)
        data["saved_buyer_prices"] = _save_buyer_prices()

    _cache["data"] = data
    _cache["ts"]   = now_ts
    return {"statusCode": 200, "headers": CORS, "body": json.dumps(data, ensure_ascii=False)}
