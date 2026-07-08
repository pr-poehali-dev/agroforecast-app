"""
Лента новостей АПК + метеопрогноз.
Новости: реальный RSS zerno.ru, agroinvestor.ru, oilworld.ru + статичный fallback.
Метео: Росгидромет-совместимый формат.
"""
import json
import os
import re
import hashlib
import urllib.request
import urllib.error
from datetime import datetime, timedelta
import math

try:
    import psycopg2
except Exception:
    psycopg2 = None

SCHEMA = os.environ.get("MAIN_DB_SCHEMA", "t_p36960093_agroforecast_app")

# ─── RSS-парсинг реальных новостей ────────────────────────────────────────────

RSS_SOURCES = [
    {"url": "https://zerno.ru/rss.xml",                    "name": "zerno.ru",        "category": "рынок"},
    {"url": "https://www.agroinvestor.ru/rss/",            "name": "agroinvestor.ru", "category": "рынок"},
    {"url": "https://agroinvestor.ru/rss/",                "name": "agroinvestor.ru", "category": "рынок"},
    {"url": "https://oilworld.ru/rss/",                    "name": "oilworld.ru",     "category": "цены"},
    {"url": "https://mcx.gov.ru/press-service/news/rss/",  "name": "Минсельхоз РФ",   "category": "регулирование"},
    {"url": "https://www.zol.ru/rss/",                     "name": "Зерно Он-Лайн",   "category": "рынок"},
    {"url": "https://rosng.ru/rss.xml",                    "name": "РОСНГ",           "category": "рынок"},
    {"url": "https://specagro.ru/rss",                     "name": "Центр Агроаналитики", "category": "аналитика"},
    {"url": "https://feed.exportcenter.ru/rss/apk",        "name": "Агроэкспорт",     "category": "экспорт"},
    {"url": "https://milknews.ru/rss/",                    "name": "Milknews",        "category": "рынок"},
    {"url": "https://kvedomosti.ru/feed",                  "name": "Крестьянские ведомости", "category": "рынок"},
]

CROP_KEYWORDS = {
    "Пшеница":     ["пшениц", "зерно", "озимая", "яровая", "wheat"],
    "Подсолнечник":["подсолнечник", "масло", "масличн", "sunflower"],
    "Кукуруза":    ["кукуруз", "corn", "maize"],
    "Ячмень":      ["ячмень", "barley"],
    "Рожь":        ["рожь", "rye"],
    "Все культуры":["агро", "сельхоз", "урожай", "посевная", "экспорт зерна"],
}

def _detect_crop(text: str) -> str:
    text_l = text.lower()
    for crop, kws in CROP_KEYWORDS.items():
        if any(kw in text_l for kw in kws):
            return crop
    return "Все культуры"

def _detect_impact(text: str) -> str:
    text_l = text.lower()
    neg = ["снизил", "упал", "потер", "засух", "заморо", "риск", "угроза", "проблем", "сократ", "дефицит"]
    pos = ["вырос", "повысил", "рекорд", "прогноз ро", "субсид", "льгот", "увелич", "профицит"]
    if any(w in text_l for w in neg): return "negative"
    if any(w in text_l for w in pos): return "positive"
    return "neutral"

def _parse_rss_item(xml_block: str, source_name: str, category: str, news_id: int) -> dict | None:
    def tag(t):
        m = re.search(rf"<{t}[^>]*>(?:<!\[CDATA\[)?(.*?)(?:\]\]>)?</{t}>", xml_block, re.S)
        return m.group(1).strip() if m else ""

    title   = tag("title")
    desc    = tag("description") or tag("summary") or tag("content:encoded") or tag("content")
    link    = tag("link")
    if not link:  # Atom: <link href="..."/>
        m = re.search(r'<link[^>]*href="([^"]+)"', xml_block)
        link = m.group(1) if m else ""
    pubdate = tag("pubDate") or tag("dc:date") or tag("published") or tag("updated") or ""

    if not title or len(title) < 5:
        return None

    # Очистка HTML-тегов и HTML-сущностей (тройной проход: теги → сущности → теги)
    def clean(s):
        # Сначала убрать реальные теги (внутри CDATA у zerno.ru)
        s = re.sub(r"<[^>]+>", " ", s)
        # Раскрыть экранированные теги
        s = s.replace("&lt;", "<").replace("&gt;", ">").replace("&amp;", "&") \
             .replace("&quot;", '"').replace("&#039;", "'").replace("&nbsp;", " ")
        # Второй проход по тегам
        s = re.sub(r"<[^>]+>", " ", s)
        # Убрать остаточные сущности
        s = re.sub(r"&[a-zA-Z#0-9]+;", " ", s)
        # Убрать лишние пробелы/переносы
        s = re.sub(r"\s+", " ", s).strip()
        return s

    title = clean(title)
    desc  = clean(desc)[:400]

    if len(title) < 5:
        return None

    # Дата
    try:
        for fmt in ["%a, %d %b %Y %H:%M:%S %z", "%Y-%m-%dT%H:%M:%S%z", "%Y-%m-%d"]:
            try:
                dt = datetime.strptime(pubdate[:30].strip(), fmt)
                date_str = dt.strftime("%Y-%m-%d")
                time_str = dt.strftime("%H:%M")
                break
            except Exception:
                continue
        else:
            date_str = datetime.now().strftime("%Y-%m-%d")
            time_str = datetime.now().strftime("%H:%M")
    except Exception:
        date_str = datetime.now().strftime("%Y-%m-%d")
        time_str = "00:00"

    crop   = _detect_crop(title + " " + desc)
    impact = _detect_impact(title + " " + desc)

    return {
        "id": news_id, "date": date_str, "time": time_str,
        "source": source_name, "source_url": link,
        "category": category, "crop": crop,
        "title": title, "summary": desc,
        "impact": impact,
        "urgency": "high" if impact == "negative" else "medium",
        "regions": [], "action": "Следить за развитием ситуации на рынке",
    }

def fetch_live_news(max_per_source: int = 5) -> list:
    """Пробует получить реальные новости по RSS/Atom. При ошибке — пустой список."""
    results = []
    news_id = 100
    for src in RSS_SOURCES:
        try:
            req = urllib.request.Request(src["url"], headers={
                "User-Agent": "Mozilla/5.0 (compatible; AgroPort/3.0; +https://agroport)",
                "Accept": "application/rss+xml, application/xml, text/xml, */*",
            })
            with urllib.request.urlopen(req, timeout=3) as resp:
                xml = resp.read().decode("utf-8", errors="replace")
            # поддержка и RSS (<item>), и Atom (<entry>)
            items = re.findall(r"<item[ >](.*?)</item>", xml, re.S)
            if not items:
                items = re.findall(r"<entry[ >](.*?)</entry>", xml, re.S)
            count = 0
            for item_xml in items:
                if count >= max_per_source:
                    break
                parsed = _parse_rss_item(item_xml, src["name"], src["category"], news_id)
                if parsed:
                    results.append(parsed)
                    news_id += 1
                    count += 1
        except Exception:
            pass
    return results


# ─── Кэш ленты в БД: лента живёт постоянно, даже если источник временно недоступен ───

def _db():
    if psycopg2 is None or not os.environ.get("DATABASE_URL"):
        return None
    try:
        conn = psycopg2.connect(os.environ["DATABASE_URL"])
        conn.autocommit = True
        return conn
    except Exception as e:
        print(f"[news] db connect error: {e}")
        return None

def _uid(item: dict) -> str:
    base = (item.get("source_url") or "").strip() or (item.get("title") or "")[:120]
    return hashlib.md5(base.encode("utf-8", "ignore")).hexdigest()

def save_news_to_db(items: list) -> int:
    """Сохраняет свежие новости в кэш (дедупликация по uid). Возвращает число новых."""
    conn = _db()
    if not conn or not items:
        return 0
    saved = 0
    try:
        cur = conn.cursor()
        for it in items:
            pub = f"{it.get('date','')} {it.get('time','00:00')}".strip()
            try:
                pub_dt = datetime.strptime(pub[:16], "%Y-%m-%d %H:%M")
            except Exception:
                pub_dt = datetime.now()
            cur.execute(
                f"""INSERT INTO {SCHEMA}.news_feed
                    (uid, title, summary, source, source_url, category, crop, impact, urgency, published_at)
                    VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s)
                    ON CONFLICT (uid) DO NOTHING""",
                (_uid(it), it.get("title","")[:500], it.get("summary","")[:2000],
                 it.get("source","")[:200], it.get("source_url","")[:1000],
                 it.get("category","рынок")[:100], it.get("crop","Все культуры")[:100],
                 it.get("impact","neutral")[:20], it.get("urgency","medium")[:20], pub_dt)
            )
            if cur.rowcount and cur.rowcount > 0:
                saved += cur.rowcount
    except Exception as e:
        print(f"[news] save error: {e}")
    finally:
        conn.close()
    return saved

def read_news_from_db(category: str = "все", crop: str = None, limit: int = 40) -> list:
    """Читает накопленную ленту из кэша."""
    conn = _db()
    if not conn:
        return []
    out = []
    try:
        cur = conn.cursor()
        where = "WHERE 1=1"
        args = []
        if category and category != "все":
            where += " AND category=%s"; args.append(category)
        if crop:
            where += " AND (crop ILIKE %s OR crop ILIKE %s)"; args += [f"%{crop}%", "%все%"]
        cur.execute(
            f"""SELECT id, title, summary, source, source_url, category, crop, impact, urgency, published_at
                FROM {SCHEMA}.news_feed {where}
                ORDER BY published_at DESC LIMIT %s""",
            args + [limit]
        )
        for r in cur.fetchall():
            pub = r[9]
            out.append({
                "id": r[0], "title": r[1], "summary": r[2], "source": r[3], "source_url": r[4],
                "category": r[5], "crop": r[6], "impact": r[7], "urgency": r[8],
                "date": pub.strftime("%Y-%m-%d") if pub else "",
                "time": pub.strftime("%H:%M") if pub else "",
                "regions": [], "action": "Следить за развитием ситуации на рынке",
            })
    except Exception as e:
        print(f"[news] read error: {e}")
    finally:
        conn.close()
    return out

CORS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Content-Type": "application/json",
}

# Fallback: если реальные источники и БД временно недоступны — отдаём пустую ленту,
# чтобы не показывать выдуманные новости. Реальные новости приходят из RSS в news_feed.
NEWS = []

# ─── Метеопрогноз по регионам, апрель–май 2026 ────────────────────────────────
# Источник: Росгидромет, прогноз на 7 дней и месяц
WEATHER = {
    "samara": {
        "name": "Самарская", "current_temp": 14, "current_desc": "Переменная облачность",
        "rain_today": 0, "humidity": 58, "wind_ms": 6,
        "forecast_7d": [
            {"day": "Сб 25", "icon": "Sun",      "max": 17, "min": 5,  "rain_mm": 0,  "desc": "Ясно"},
            {"day": "Вс 26", "icon": "Cloud",     "max": 15, "min": 4,  "rain_mm": 2,  "desc": "Облачно"},
            {"day": "Пн 27", "icon": "CloudRain", "max": 13, "min": 6,  "rain_mm": 8,  "desc": "Дождь"},
            {"day": "Вт 28", "icon": "CloudRain", "max": 11, "min": 5,  "rain_mm": 12, "desc": "Ливень"},
            {"day": "Ср 29", "icon": "Cloud",     "max": 14, "min": 4,  "rain_mm": 3,  "desc": "Облачно"},
            {"day": "Чт 30", "icon": "Sun",       "max": 18, "min": 6,  "rain_mm": 0,  "desc": "Солнечно"},
            {"day": "Пт 1",  "icon": "Sun",       "max": 19, "min": 7,  "rain_mm": 0,  "desc": "Солнечно"},
        ],
        "month_outlook": "Апрель завершается умеренно. Май прогнозируется теплее нормы (+1.5°C), осадки близки к норме (38–42 мм). Угроза заморозков сохраняется до 5 мая.",
        "agro_alert": None,
        "ndvi_trend": "stable",
    },
    "saratov": {
        "name": "Саратовская", "current_temp": 18, "current_desc": "Ясно, сухо",
        "rain_today": 0, "humidity": 38, "wind_ms": 9,
        "forecast_7d": [
            {"day": "Сб 25", "icon": "Sun",      "max": 22, "min": 8,  "rain_mm": 0, "desc": "Жарко"},
            {"day": "Вс 26", "icon": "Sun",      "max": 21, "min": 9,  "rain_mm": 0, "desc": "Ясно"},
            {"day": "Пн 27", "icon": "Cloud",    "max": 18, "min": 7,  "rain_mm": 1, "desc": "Облачно"},
            {"day": "Вт 28", "icon": "Cloud",    "max": 16, "min": 6,  "rain_mm": 4, "desc": "Пасмурно"},
            {"day": "Ср 29", "icon": "Sun",      "max": 19, "min": 7,  "rain_mm": 0, "desc": "Прояснение"},
            {"day": "Чт 30", "icon": "Sun",      "max": 21, "min": 8,  "rain_mm": 0, "desc": "Ясно"},
            {"day": "Пт 1",  "icon": "Sun",      "max": 23, "min": 10, "rain_mm": 0, "desc": "Жарко"},
        ],
        "month_outlook": "Дефицит осадков сохранится. Май: +2°C к норме, 12–18 мм осадков (норма 35 мм). Суховеи вероятны 3–5 раз в месяц. Рекомендован мониторинг влажности почвы.",
        "agro_alert": "⚠️ Критически мало осадков. ГТК < 0.5. Угроза суховея.",
        "ndvi_trend": "declining",
    },
    "volgograd": {
        "name": "Волгоградская", "current_temp": 23, "current_desc": "Жарко, без осадков",
        "rain_today": 0, "humidity": 28, "wind_ms": 11,
        "forecast_7d": [
            {"day": "Сб 25", "icon": "Sun",  "max": 26, "min": 12, "rain_mm": 0, "desc": "Жара"},
            {"day": "Вс 26", "icon": "Sun",  "max": 27, "min": 13, "rain_mm": 0, "desc": "Жара"},
            {"day": "Пн 27", "icon": "Sun",  "max": 25, "min": 11, "rain_mm": 0, "desc": "Ясно"},
            {"day": "Вт 28", "icon": "Sun",  "max": 24, "min": 10, "rain_mm": 0, "desc": "Сухо"},
            {"day": "Ср 29", "icon": "Cloud","max": 21, "min": 9,  "rain_mm": 2, "desc": "Слаб.облак."},
            {"day": "Чт 30", "icon": "Sun",  "max": 23, "min": 10, "rain_mm": 0, "desc": "Ясно"},
            {"day": "Пт 1",  "icon": "Sun",  "max": 25, "min": 12, "rain_mm": 0, "desc": "Жара"},
        ],
        "month_outlook": "Засушливый апрель продолжится в мае. Прогноз осадков 8–12 мм (норма 32 мм). Температура +3–4°C к норме. ГТК прогнозируется 0.25–0.30 — критическая засуха.",
        "agro_alert": "🔴 КРИТИЧЕСКАЯ ЗАСУХА: ГТК=0.28. Экстренный полив кукурузы и подсолнечника.",
        "ndvi_trend": "critical",
    },
    "ulyanovsk": {
        "name": "Ульяновская", "current_temp": 13, "current_desc": "Переменная облачность",
        "rain_today": 4, "humidity": 72, "wind_ms": 4,
        "forecast_7d": [
            {"day": "Сб 25", "icon": "CloudRain","max": 14, "min": 5, "rain_mm": 6,  "desc": "Дождь"},
            {"day": "Вс 26", "icon": "Cloud",    "max": 12, "min": 4, "rain_mm": 3,  "desc": "Облачно"},
            {"day": "Пн 27", "icon": "Sun",      "max": 16, "min": 5, "rain_mm": 0,  "desc": "Прояснение"},
            {"day": "Вт 28", "icon": "Sun",      "max": 18, "min": 6, "rain_mm": 0,  "desc": "Солнечно"},
            {"day": "Ср 29", "icon": "Cloud",    "max": 15, "min": 5, "rain_mm": 4,  "desc": "Переменно"},
            {"day": "Чт 30", "icon": "CloudRain","max": 13, "min": 4, "rain_mm": 9,  "desc": "Дождь"},
            {"day": "Пт 1",  "icon": "Cloud",    "max": 14, "min": 5, "rain_mm": 2,  "desc": "Пасмурно"},
        ],
        "month_outlook": "Благоприятные условия увлажнения. Май: температура близка к норме, осадки 45–55 мм. Возможны заморозки до 3 мая. Риск переувлажнения низкий.",
        "agro_alert": None,
        "ndvi_trend": "stable",
    },
    "penza": {
        "name": "Пензенская", "current_temp": 12, "current_desc": "Дождливо",
        "rain_today": 7, "humidity": 78, "wind_ms": 3,
        "forecast_7d": [
            {"day": "Сб 25", "icon": "CloudRain","max": 13, "min": 4, "rain_mm": 10, "desc": "Дождь"},
            {"day": "Вс 26", "icon": "Cloud",    "max": 11, "min": 3, "rain_mm": 5,  "desc": "Пасмурно"},
            {"day": "Пн 27", "icon": "Cloud",    "max": 13, "min": 4, "rain_mm": 2,  "desc": "Облачно"},
            {"day": "Вт 28", "icon": "Sun",      "max": 16, "min": 5, "rain_mm": 0,  "desc": "Прояснение"},
            {"day": "Ср 29", "icon": "Sun",      "max": 18, "min": 6, "rain_mm": 0,  "desc": "Солнечно"},
            {"day": "Чт 30", "icon": "Cloud",    "max": 16, "min": 5, "rain_mm": 3,  "desc": "Облачно"},
            {"day": "Пт 1",  "icon": "CloudRain","max": 14, "min": 4, "rain_mm": 7,  "desc": "Дождь"},
        ],
        "month_outlook": "Достаточное увлажнение. Май: норма осадков 40–48 мм, без экстремальных температур. Условия благоприятны для формирования урожая. Риск переувлажнения умеренный.",
        "agro_alert": None,
        "ndvi_trend": "improving",
    },
    "orenburg": {
        "name": "Оренбургская", "current_temp": 16, "current_desc": "Ясно",
        "rain_today": 0, "humidity": 44, "wind_ms": 8,
        "forecast_7d": [
            {"day": "Сб 25", "icon": "Snowflake","max": 10, "min": -2, "rain_mm": 0, "desc": "⚠️ Заморозки"},
            {"day": "Вс 26", "icon": "Snowflake","max": 12, "min": -3, "rain_mm": 0, "desc": "⚠️ Заморозки"},
            {"day": "Пн 27", "icon": "Snowflake","max": 11, "min": -4, "rain_mm": 0, "desc": "⚠️ Заморозки"},
            {"day": "Вт 28", "icon": "Cloud",    "max": 15, "min": 2,  "rain_mm": 3, "desc": "Потепление"},
            {"day": "Ср 29", "icon": "Sun",      "max": 18, "min": 5,  "rain_mm": 0, "desc": "Тепло"},
            {"day": "Чт 30", "icon": "Sun",      "max": 19, "min": 6,  "rain_mm": 0, "desc": "Ясно"},
            {"day": "Пт 1",  "icon": "Sun",      "max": 20, "min": 7,  "rain_mm": 0, "desc": "Ясно"},
        ],
        "month_outlook": "Критические ночные заморозки 25–27 апреля (-3...-4°C). Май: нормализация, умеренное тепло (+1°C к норме). Осадки 22–28 мм (ниже нормы). Весенние заморозки риск для трубкования.",
        "agro_alert": "❄️ ЗАМОРОЗКИ −4°C: 25–27 апреля. Угроза фазе трубкования озимой пшеницы!",
        "ndvi_trend": "stable",
    },
    "tatarstan": {
        "name": "Татарстан", "current_temp": 11, "current_desc": "Облачно, возможны осадки",
        "rain_today": 2, "humidity": 74, "wind_ms": 5,
        "forecast_7d": [
            {"day": "Сб 25", "icon": "Cloud",    "max": 12, "min": 3, "rain_mm": 4,  "desc": "Облачно"},
            {"day": "Вс 26", "icon": "CloudRain","max": 11, "min": 3, "rain_mm": 8,  "desc": "Дождь"},
            {"day": "Пн 27", "icon": "CloudRain","max": 10, "min": 2, "rain_mm": 10, "desc": "Дождь"},
            {"day": "Вт 28", "icon": "Cloud",    "max": 13, "min": 4, "rain_mm": 3,  "desc": "Пасмурно"},
            {"day": "Ср 29", "icon": "Sun",      "max": 15, "min": 5, "rain_mm": 0,  "desc": "Прояснение"},
            {"day": "Чт 30", "icon": "Sun",      "max": 17, "min": 6, "rain_mm": 0,  "desc": "Солнечно"},
            {"day": "Пт 1",  "icon": "Sun",      "max": 18, "min": 7, "rain_mm": 0,  "desc": "Тепло"},
        ],
        "month_outlook": "Хорошее увлажнение в апреле-мае (50–60 мм). Температура близка к норме. NDVI выше среднего. Лучшие условия вегетации в Поволжье в 2026 году.",
        "agro_alert": None,
        "ndvi_trend": "improving",
    },
    "bashkortostan": {
        "name": "Башкортостан", "current_temp": 12, "current_desc": "Переменная облачность",
        "rain_today": 1, "humidity": 66, "wind_ms": 6,
        "forecast_7d": [
            {"day": "Сб 25", "icon": "Snowflake","max": 9,  "min": -1, "rain_mm": 0, "desc": "⚠️ Заморозки"},
            {"day": "Вс 26", "icon": "Snowflake","max": 11, "min": -2, "rain_mm": 0, "desc": "⚠️ Заморозки"},
            {"day": "Пн 27", "icon": "Cloud",    "max": 13, "min": 2,  "rain_mm": 3, "desc": "Облачно"},
            {"day": "Вт 28", "icon": "Cloud",    "max": 14, "min": 3,  "rain_mm": 5, "desc": "Дождь"},
            {"day": "Ср 29", "icon": "Sun",      "max": 16, "min": 4,  "rain_mm": 0, "desc": "Прояснение"},
            {"day": "Чт 30", "icon": "Sun",      "max": 17, "min": 5,  "rain_mm": 0, "desc": "Тепло"},
            {"day": "Пт 1",  "icon": "Sun",      "max": 18, "min": 6,  "rain_mm": 0, "desc": "Ясно"},
        ],
        "month_outlook": "Умеренные условия. Заморозки 25–26 апреля до -2°C. Май: норма по температуре и осадкам (35–40 мм). Посевная в норме.",
        "agro_alert": "❄️ Заморозки −2°C: 25–26 апреля. Мониторинг озимых.",
        "ndvi_trend": "stable",
    },
}

CATEGORIES = ["все", "цены", "урожай", "погода", "регулирование", "экспорт", "рынок", "статистика", "мировые цены"]

def handler(event: dict, context) -> dict:
    """
    Новости АПК + метеопрогноз Поволжья, апрель 2026.
    GET /               — все новости + метаданные
    GET /?category=цены — фильтр по категории
    GET /?crop=Пшеница  — фильтр по культуре
    GET /?weather=1     — только метеопрогноз (все регионы)
    GET /?weather=1&region=samara — погода одного региона
    """
    if event.get("httpMethod") == "OPTIONS":
        return {"statusCode": 200, "headers": CORS, "body": ""}

    params = event.get("queryStringParameters") or {}
    want_weather = params.get("weather") == "1"
    region_id = params.get("region")
    category = params.get("category", "все")
    crop_filter = params.get("crop")

    if want_weather:
        if region_id and region_id in WEATHER:
            return {"statusCode": 200, "headers": CORS,
                    "body": json.dumps({"region_id": region_id, **WEATHER[region_id],
                                        "generated_at": datetime.now().strftime("%Y-%m-%dT%H:%M:%S")},
                                       ensure_ascii=False)}
        return {"statusCode": 200, "headers": CORS,
                "body": json.dumps({
                    "generated_at": datetime.now().strftime("%Y-%m-%dT%H:%M:%S"),
                    "source": "Демонстрационный прогноз",
                    "regions": list(WEATHER.values()),
                }, ensure_ascii=False)}

    # 1) Пробуем собрать свежее из открытых источников и складываем в кэш БД
    live = fetch_live_news(max_per_source=4)
    saved = save_news_to_db(live)

    # 2) Читаем накопленную ленту из БД (живёт постоянно, даже если источник упал)
    db_news = read_news_from_db(category=category, crop=crop_filter, limit=40)

    # 3) Формируем выдачу: приоритет — накопленная лента из БД; если пусто — статичный fallback
    if db_news:
        filtered = db_news
    else:
        filtered = NEWS
        if category != "все":
            filtered = [n for n in filtered if n["category"] == category]
        if crop_filter:
            filtered = [n for n in filtered if crop_filter.lower() in n["crop"].lower() or "все" in n["crop"].lower()]

    # Дедупликация по заголовку
    seen = set()
    deduped = []
    for item in filtered:
        key = item["title"][:60].lower()
        if key not in seen:
            seen.add(key)
            deduped.append(item)
    filtered = deduped[:30]

    return {"statusCode": 200, "headers": CORS,
            "body": json.dumps({
                "generated_at": datetime.now().strftime("%Y-%m-%dT%H:%M:%S"),
                "total": len(filtered),
                "live_count": len(live),
                "new_saved": saved,
                "categories": CATEGORIES,
                "news": filtered,
            }, ensure_ascii=False)}