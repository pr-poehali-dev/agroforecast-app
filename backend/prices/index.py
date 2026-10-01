"""
Актуальные котировки зерновых — АгроПорт.
Получает цены с открытых российских источников, возвращает структурированные данные.
Кэширование: 6 часов. Fallback: жёстко заданные цены НТБ апрель 2026.
"""
import json
import os
import re
import time
import urllib.request
import urllib.error
from datetime import datetime, timezone

CORS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Content-Type": "application/json",
}

# ─── Ориентировочные цены (показываются ТОЛЬКО когда нет связи с источником) ──
# Помечаются is_fallback=true и source="ориентир", чтобы не выдавать за биржевые данные.
FALLBACK_PRICES = {
    "Пшеница озимая": {"price": 13650, "trend": 2.1,  "week_change": 290,  "source": "ориентир"},
    "Подсолнечник":   {"price": 46500, "trend": -1.8, "week_change": -840, "source": "ориентир"},
    "Кукуруза":       {"price": 13800, "trend": 1.2,  "week_change": 165,  "source": "ориентир"},
    "Ячмень яровой":  {"price": 12200, "trend": 0.9,  "week_change": 110,  "source": "ориентир"},
    "Рожь":           {"price": 10100, "trend": -0.5, "week_change": -51,  "source": "ориентир"},
}

CROP_META = {
    "Пшеница озимая": {"region": "Поволжье / ЕФО",   "quality": "3 класс"},
    "Подсолнечник":   {"region": "Поволжье / ЮФО",   "quality": "МЭЗ закупка"},
    "Кукуруза":       {"region": "Поволжье",          "quality": "внутренний рынок"},
    "Ячмень яровой":  {"region": "Поволжье / ЦФО",   "quality": "фуражный"},
    "Рожь":           {"region": "ПФО / ЦФО",        "quality": "3 класс"},
}

# ─── Модульный кэш (живёт в памяти worker-процесса) ──────────────────────────
_cache: dict = {"data": None, "ts": 0.0}
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
    with ThreadPoolExecutor(max_workers=4) as ex:
        futs = {k: ex.submit(_fetch, u, 6) for k, u in urls.items()}
        raw = {}
        for k, f in futs.items():
            try:
                raw[k] = f.result(timeout=8)
            except Exception:
                raw[k] = None

    merged: dict[str, dict] = {}
    status: dict[str, str] = {}
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


# ─── Сборка финального ответа ─────────────────────────────────────────────────

def _build_response(live: dict[str, dict], status: dict[str, str]) -> dict:
    now_iso = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%S")
    prices_out = []

    any_live = bool(live)

    for crop, fb in FALLBACK_PRICES.items():
        live_entry = live.get(crop)
        is_fallback = live_entry is None

        price     = live_entry["price"] if live_entry else fb["price"]
        source    = live_entry["source"] if live_entry else fb["source"]
        wc        = fb["week_change"]
        trend_pct = fb["trend"]

        price_prev = max(1, round(price - wc))
        trend_str  = "up" if trend_pct >= 0 else "down"

        meta = CROP_META.get(crop, {"region": "Россия", "quality": ""})

        prices_out.append({
            "crop":            crop,
            "price":           price,
            "price_prev":      price_prev,
            "week_change":     wc,
            "week_change_pct": round(trend_pct, 2),
            "trend":           trend_str,
            "region":          meta["region"],
            "quality":         meta["quality"],
            "source":          source,
            "fetched_at":      now_iso,
            "is_fallback":     is_fallback,
        })

    return {
        "prices":        prices_out,
        "updated_at":    now_iso,
        "any_live":      any_live,
        "source_status": status,
    }

# ─── Handler ──────────────────────────────────────────────────────────────────

def handler(event: dict, context) -> dict:
    """Котировки зерновых: live-парсинг + fallback + кэш 6 ч."""
    if event.get("httpMethod") == "OPTIONS":
        return {"statusCode": 200, "headers": CORS, "body": ""}

    now_ts = time.time()
    force  = (event.get("queryStringParameters") or {}).get("force") == "1"

    # Возвращаем кэш если свежий и нет принудительного обновления
    if not force and _cache["data"] is not None and (now_ts - _cache["ts"]) < CACHE_TTL:
        cached = dict(_cache["data"])
        cached["from_cache"] = True
        cached["cache_age_min"] = round((now_ts - _cache["ts"]) / 60)
        return {
            "statusCode": 200,
            "headers": CORS,
            "body": json.dumps(cached, ensure_ascii=False),
        }

    # Получаем живые данные
    try:
        live, status = _fetch_live_prices()
    except Exception:
        live, status = {}, {"error": "fetch_exception"}

    data = _build_response(live, status)
    data["saved_quotes"] = _save_quotes(live)

    # Сохраняем в кэш
    _cache["data"] = data
    _cache["ts"]   = now_ts

    return {
        "statusCode": 200,
        "headers": CORS,
        "body": json.dumps(data, ensure_ascii=False),
    }