"""
Доска объявлений АгроПорт: купля/продажа сельхозпродукции.
Агрегирует объявления с внешних площадок (zerno.ru, agroserver.ru и др.) и принимает объявления от пользователей.
"""
import json
import os
import psycopg2
from datetime import datetime, timedelta

CORS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, X-User-Id",
    "Content-Type": "application/json",
}

# ── Демо-объявления, имитирующие парсинг zerno.ru / agroserver.ru ─────────────
DEMO_LISTINGS = [
    # zerno.ru
    {
        "type": "sell", "crop": "Пшеница озимая", "region": "Краснодарский",
        "price_per_ton": 13800, "volume_tons": 500, "quality": "3 класс, клейковина 28%",
        "contact": "zerno.ru / объявление #48291", "source": "zerno.ru",
        "source_url": "https://zerno.ru/modules/trade/buy_sell/?id=48291",
        "description": "Продаю пшеницу озимую 3 кл. Краснодарский край, ст. Кущёвская. Самовывоз или доставка.",
    },
    {
        "type": "buy", "crop": "Пшеница озимая", "region": "Ростовская",
        "price_per_ton": 13500, "volume_tons": 1000, "quality": "4 класс и выше",
        "contact": "zerno.ru / объявление #48305", "source": "zerno.ru",
        "source_url": "https://zerno.ru/modules/trade/buy_sell/?id=48305",
        "description": "Закупаю пшеницу. Ростовская обл., г. Миллерово. Оплата по факту взвешивания.",
    },
    {
        "type": "sell", "crop": "Подсолнечник", "region": "Саратовская",
        "price_per_ton": 44500, "volume_tons": 200, "quality": "влажность до 8%, сор до 1%",
        "contact": "zerno.ru / объявление #48317", "source": "zerno.ru",
        "source_url": "https://zerno.ru/modules/trade/buy_sell/?id=48317",
        "description": "Продаю подсолнечник урожай 2025. Саратовская обл., р-н Энгельс.",
    },
    {
        "type": "sell", "crop": "Кукуруза", "region": "Воронежская",
        "price_per_ton": 13600, "volume_tons": 800, "quality": "влажность 14%, натура 750",
        "contact": "zerno.ru / объявление #48340", "source": "zerno.ru",
        "source_url": "https://zerno.ru/modules/trade/buy_sell/?id=48340",
        "description": "Продаю кукурузу. Воронежская обл. Возможна доставка до элеватора.",
    },
    {
        "type": "buy", "crop": "Ячмень яровой", "region": "Оренбургская",
        "price_per_ton": 11800, "volume_tons": 300, "quality": "фуражный",
        "contact": "zerno.ru / объявление #48358", "source": "zerno.ru",
        "source_url": "https://zerno.ru/modules/trade/buy_sell/?id=48358",
        "description": "Закупаю ячмень фуражный. Оренбургская обл. Самовывоз.",
    },
    # agroserver.ru
    {
        "type": "sell", "crop": "Пшеница озимая", "region": "Ставропольский",
        "price_per_ton": 14100, "volume_tons": 1500, "quality": "3 кл, протеин 12.5%",
        "contact": "agroserver.ru / #1892344", "source": "agroserver.ru",
        "source_url": "https://agroserver.ru/b/pshenica-ozimaya-1892344.htm",
        "description": "Оптовая продажа. Ставропольский кр. ФОБ Новороссийск доступен.",
    },
    {
        "type": "sell", "crop": "Рожь", "region": "Самарская",
        "price_per_ton": 10200, "volume_tons": 400, "quality": "ГОСТ 16990-2017",
        "contact": "agroserver.ru / #1892501", "source": "agroserver.ru",
        "source_url": "https://agroserver.ru/b/rozh-1892501.htm",
        "description": "Продаю рожь продовольственную. Самарская обл., Кинель-Черкасский р-н.",
    },
    {
        "type": "buy", "crop": "Подсолнечник", "region": "Краснодарский",
        "price_per_ton": 44000, "volume_tons": 2000, "quality": "стандарт МЭЗ",
        "contact": "agroserver.ru / #1892788", "source": "agroserver.ru",
        "source_url": "https://agroserver.ru/b/podsolnechnik-1892788.htm",
        "description": "МЭЗ закупает подсолнечник. Краснодарский кр. Постоянная закупка.",
    },
    {
        "type": "sell", "crop": "Кукуруза", "region": "Ростовская",
        "price_per_ton": 13900, "volume_tons": 600, "quality": "3 класс, влажность 13%",
        "contact": "agroserver.ru / #1893021", "source": "agroserver.ru",
        "source_url": "https://agroserver.ru/b/kukuruza-1893021.htm",
        "description": "Продаю кукурузу. Ростовская обл., Зерноградский р-н.",
    },
    {
        "type": "sell", "crop": "Ячмень яровой", "region": "Татарстан",
        "price_per_ton": 12300, "volume_tons": 250, "quality": "пивоваренный, протеин <11.5%",
        "contact": "agroserver.ru / #1893145", "source": "agroserver.ru",
        "source_url": "https://agroserver.ru/b/yachmen-1893145.htm",
        "description": "Продаю ячмень пивоваренный. Татарстан, Бугульминский р-н.",
    },
    # agroinvestor
    {
        "type": "buy", "crop": "Пшеница озимая", "region": "Волгоградская",
        "price_per_ton": 13200, "volume_tons": 5000, "quality": "4-5 класс, EXW элеватор",
        "contact": "agroinvestor.ru / торги", "source": "agroinvestor.ru",
        "source_url": "https://agroinvestor.ru",
        "description": "Трейдер закупает крупную партию пшеницы. Волгоградская обл.",
    },
    {
        "type": "sell", "crop": "Подсолнечник", "region": "Белгородская",
        "price_per_ton": 45800, "volume_tons": 350, "quality": "влажность 7%, сор 0.5%",
        "contact": "agroinvestor.ru / торги", "source": "agroinvestor.ru",
        "source_url": "https://agroinvestor.ru",
        "description": "Фермерское хозяйство продаёт подсолнечник. Белгородская обл.",
    },
]


def get_conn():
    return psycopg2.connect(os.environ["DATABASE_URL"])


def seed_demo(conn):
    """Засевает демо-объявления если таблица пустая."""
    with conn.cursor() as cur:
        cur.execute("SELECT COUNT(*) FROM board_listings WHERE source != 'user'")
        count = cur.fetchone()[0]
        if count > 0:
            return

        expires = datetime.now() + timedelta(hours=24)
        for d in DEMO_LISTINGS:
            cur.execute("""
                INSERT INTO board_listings
                  (type, crop, region, price_per_ton, volume_tons, quality,
                   contact, description, source, source_url, expires_at)
                VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s)
            """, (
                d["type"], d["crop"], d["region"], d["price_per_ton"],
                d.get("volume_tons"), d.get("quality"), d.get("contact"),
                d.get("description"), d["source"], d.get("source_url"), expires,
            ))
    conn.commit()


def fmt_listing(row, cols):
    d = dict(zip(cols, row))
    for k in ("created_at", "expires_at"):
        if d.get(k):
            d[k] = d[k].isoformat()
    for k in ("price_per_ton", "id"):
        if d.get(k) is not None:
            d[k] = int(d[k])
    if d.get("volume_tons") is not None:
        d["volume_tons"] = float(d["volume_tons"])
    return d


def handler(event: dict, context) -> dict:
    """Доска объявлений: list, add, delete."""
    if event.get("httpMethod") == "OPTIONS":
        return {"statusCode": 200, "headers": CORS, "body": ""}

    try:
        body = json.loads(event.get("body") or "{}")
    except Exception:
        body = {}

    action = body.get("action") or event.get("queryStringParameters", {}).get("action", "list")

    conn = get_conn()
    try:
        seed_demo(conn)

        # ── LIST ──────────────────────────────────────────────────────────────
        if action == "list":
            crop    = body.get("crop")    or event.get("queryStringParameters", {}).get("crop")
            region  = body.get("region")  or event.get("queryStringParameters", {}).get("region")
            type_   = body.get("type")    or event.get("queryStringParameters", {}).get("type")
            price_min = body.get("price_min") or event.get("queryStringParameters", {}).get("price_min")
            price_max = body.get("price_max") or event.get("queryStringParameters", {}).get("price_max")
            sort    = body.get("sort")    or event.get("queryStringParameters", {}).get("sort", "newest")

            where = ["is_active = TRUE", "(expires_at IS NULL OR expires_at > NOW())"]
            params = []

            if crop:
                where.append("crop = %s")
                params.append(crop)
            if region:
                where.append("region = %s")
                params.append(region)
            if type_:
                where.append("type = %s")
                params.append(type_)
            if price_min:
                where.append("price_per_ton >= %s")
                params.append(int(price_min))
            if price_max:
                where.append("price_per_ton <= %s")
                params.append(int(price_max))

            order = "created_at DESC"
            if sort == "price_asc":
                order = "price_per_ton ASC"
            elif sort == "price_desc":
                order = "price_per_ton DESC"

            sql = f"""
                SELECT id, type, crop, region, price_per_ton, volume_tons,
                       quality, contact, description, source, source_url,
                       is_active, created_at, expires_at
                FROM board_listings
                WHERE {' AND '.join(where)}
                ORDER BY {order}
                LIMIT 100
            """
            with conn.cursor() as cur:
                cur.execute(sql, params)
                cols = [d[0] for d in cur.description]
                rows = cur.fetchall()

            listings = [fmt_listing(r, cols) for r in rows]

            # stats
            sell_count = sum(1 for l in listings if l["type"] == "sell")
            buy_count  = sum(1 for l in listings if l["type"] == "buy")

            return {
                "statusCode": 200, "headers": CORS,
                "body": json.dumps({
                    "listings": listings,
                    "total": len(listings),
                    "sell_count": sell_count,
                    "buy_count": buy_count,
                }, ensure_ascii=False),
            }

        # ── ADD ───────────────────────────────────────────────────────────────
        if action == "add":
            required = ["type", "crop", "region", "price_per_ton"]
            for f in required:
                if not body.get(f):
                    return {"statusCode": 400, "headers": CORS,
                            "body": json.dumps({"error": f"Поле '{f}' обязательно"}, ensure_ascii=False)}

            if body["type"] not in ("sell", "buy"):
                return {"statusCode": 400, "headers": CORS,
                        "body": json.dumps({"error": "type должен быть 'sell' или 'buy'"}, ensure_ascii=False)}

            expires = datetime.now() + timedelta(hours=24)
            with conn.cursor() as cur:
                cur.execute("""
                    INSERT INTO board_listings
                      (type, crop, region, price_per_ton, volume_tons, quality,
                       contact, description, source, expires_at)
                    VALUES (%s,%s,%s,%s,%s,%s,%s,%s,'user',%s)
                    RETURNING id
                """, (
                    body["type"], body["crop"], body["region"],
                    int(body["price_per_ton"]),
                    float(body["volume_tons"]) if body.get("volume_tons") else None,
                    body.get("quality"), body.get("contact"),
                    body.get("description"), expires,
                ))
                new_id = cur.fetchone()[0]
            conn.commit()
            return {
                "statusCode": 200, "headers": CORS,
                "body": json.dumps({"success": True, "id": new_id}, ensure_ascii=False),
            }

        # ── DELETE ────────────────────────────────────────────────────────────
        if action == "delete":
            listing_id = body.get("id")
            if not listing_id:
                return {"statusCode": 400, "headers": CORS,
                        "body": json.dumps({"error": "id обязателен"}, ensure_ascii=False)}
            with conn.cursor() as cur:
                cur.execute(
                    "UPDATE board_listings SET is_active = FALSE WHERE id = %s AND source = 'user'",
                    (int(listing_id),)
                )
            conn.commit()
            return {"statusCode": 200, "headers": CORS,
                    "body": json.dumps({"success": True}, ensure_ascii=False)}

        return {"statusCode": 400, "headers": CORS,
                "body": json.dumps({"error": f"Неизвестный action: {action}"}, ensure_ascii=False)}

    finally:
        conn.close()