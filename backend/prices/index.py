"""
Актуальные котировки зерновых — АгроПорт.
Получает цены с открытых российских источников, возвращает структурированные данные.
Кэширование: 6 часов. Fallback: жёстко заданные цены НТБ апрель 2026.
"""
import json
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

# ─── Fallback цены НТБ / Поволжье, апрель 2026 ───────────────────────────────
FALLBACK_PRICES = {
    "Пшеница озимая": {"price": 13650, "trend": 2.1,  "week_change": 290,  "source": "НТБ (кэш)"},
    "Подсолнечник":   {"price": 46500, "trend": -1.8, "week_change": -840, "source": "oilworld (кэш)"},
    "Кукуруза":       {"price": 13800, "trend": 1.2,  "week_change": 165,  "source": "НТБ (кэш)"},
    "Ячмень яровой":  {"price": 12200, "trend": 0.9,  "week_change": 110,  "source": "НТБ (кэш)"},
    "Рожь":           {"price": 10100, "trend": -0.5, "week_change": -51,  "source": "НТБ (кэш)"},
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
    Ищем числа рядом с названиями культур в таблицах и тексте."""
    found: dict[str, int] = {}
    patterns = {
        "Пшеница озимая": [
            r"пшениц[а-я]*\s*3[- ]?кл[а-я]*.*?(\d[\d\s]{3,5})",
            r"пшениц[а-я]*.*?(\d[\d\s]{3,5})\s*(?:руб|₽|тыс)",
            r"(\d[\d\s]{3,5})\s*(?:руб|₽).*?пшениц[а-я]*",
        ],
        "Подсолнечник": [
            r"подсолнечник.*?(\d[\d\s]{4,6})",
            r"(\d[\d\s]{4,6}).*?подсолнечник",
        ],
        "Кукуруза": [
            r"кукуруз[а-я]*.*?(\d[\d\s]{3,5})",
            r"(\d[\d\s]{3,5}).*?кукуруз[а-я]*",
        ],
        "Ячмень яровой": [
            r"ячмен[а-я]*.*?(\d[\d\s]{3,5})",
            r"(\d[\d\s]{3,5}).*?ячмен[а-я]*",
        ],
        "Рожь": [
            r"рож[а-я]*.*?(\d[\d\s]{3,5})",
            r"(\d[\d\s]{3,5}).*?рож[а-я]*",
        ],
    }
    for crop, pats in patterns.items():
        lo = 30000 if crop == "Подсолнечник" else 5000
        hi = 90000 if crop == "Подсолнечник" else 25000
        val = _extract_first_int(pats, html, lo=lo, hi=hi)
        if val:
            found[crop] = val
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
    Пытается получить цены из нескольких источников.
    Возвращает (merged_prices, source_status).
    merged_prices: {crop: {"price": int, "source": str}}
    """
    merged: dict[str, dict] = {}
    status: dict[str, str] = {}

    # ── Источник 1: Минсельхоз ───────────────────────────────────────────────
    mcx_url = (
        "https://mcx.gov.ru/ministry/departments/"
        "departament-ekonomiki-i-gosudarstvennoy-podderzhki-apk/"
        "industry-information/info-agrarnye-rynki/"
    )
    html = _fetch(mcx_url, timeout=10)
    if html:
        prices = _parse_mcx(html)
        if prices:
            status["mcx"] = "ok"
            for crop, price in prices.items():
                if crop not in merged:
                    merged[crop] = {"price": price, "source": "Минсельхоз РФ"}
        else:
            status["mcx"] = "no_data"
    else:
        status["mcx"] = "failed"

    # ── Источник 2: zerno.ru RSS ─────────────────────────────────────────────
    zerno_xml = _fetch("https://zerno.ru/rss.xml", timeout=10)
    if zerno_xml:
        prices = _parse_zerno_rss(zerno_xml)
        if prices:
            status["zerno"] = "ok"
            for crop, price in prices.items():
                if crop not in merged:
                    merged[crop] = {"price": price, "source": "zerno.ru"}
        else:
            status["zerno"] = "no_data"
    else:
        status["zerno"] = "failed"

    # ── Источник 3: ikar.ru пшеница ──────────────────────────────────────────
    ikar_html = _fetch("https://www.ikar.ru/wheat.html", timeout=10)
    if ikar_html:
        wheat_price = _parse_ikar(ikar_html)
        if wheat_price and "Пшеница озимая" not in merged:
            merged["Пшеница озимая"] = {"price": wheat_price, "source": "ИКАР"}
        status["ikar"] = "ok" if wheat_price else "no_data"
    else:
        status["ikar"] = "failed"

    # ── Источник 4: agroinvestor.ru RSS ──────────────────────────────────────
    ai_xml = _fetch("https://agroinvestor.ru/rss/", timeout=10)
    if ai_xml:
        prices = _parse_agroinvestor_rss(ai_xml)
        if prices:
            status["agroinvestor"] = "ok"
            for crop, price in prices.items():
                if crop not in merged:
                    merged[crop] = {"price": price, "source": "agroinvestor.ru"}
        else:
            status["agroinvestor"] = "no_data"
    else:
        status["agroinvestor"] = "failed"

    return merged, status

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

    # Сохраняем в кэш
    _cache["data"] = data
    _cache["ts"]   = now_ts

    return {
        "statusCode": 200,
        "headers": CORS,
        "body": json.dumps(data, ensure_ascii=False),
    }
