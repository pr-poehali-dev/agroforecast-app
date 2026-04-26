"""
Портфель культур АгроПорт — CRUD + расчёт прибыли по агроэкономике.
Действия (POST JSON с полем "action"):
  list    — список позиций + итоги
  add     — добавить позицию
  delete  — удалить позицию по id
  summary — агрегированная сводка
"""
import json
import os

import psycopg2

CORS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Content-Type": "application/json",
}

# Агроэкономика культур (цены НТБ / Поволжье, апрель 2026)
CROP_DATA = {
    "Пшеница озимая": {"price_per_t": 13650, "yield_cha": 29.4, "cost_per_ha": 31600},
    "Подсолнечник":   {"price_per_t": 46500, "yield_cha": 23.1, "cost_per_ha": 45200},
    "Кукуруза":       {"price_per_t": 13800, "yield_cha": 56.8, "cost_per_ha": 28900},
    "Ячмень яровой":  {"price_per_t": 12200, "yield_cha": 28.1, "cost_per_ha": 23400},
    "Рожь":           {"price_per_t": 10100, "yield_cha": 18.2, "cost_per_ha": 20600},
}


def get_db():
    return psycopg2.connect(os.environ["DATABASE_URL"])


def resp(status: int, body: dict) -> dict:
    return {
        "statusCode": status,
        "headers": CORS,
        "body": json.dumps(body, ensure_ascii=False, default=str),
    }


def migrate(cur):
    cur.execute("""
        CREATE TABLE IF NOT EXISTS portfolio_items (
          id SERIAL PRIMARY KEY,
          user_id TEXT NOT NULL DEFAULT 'guest',
          crop TEXT NOT NULL,
          area_ha FLOAT NOT NULL,
          region TEXT NOT NULL DEFAULT 'Самарская',
          custom_yield FLOAT,
          notes TEXT,
          created_at TIMESTAMP DEFAULT NOW()
        )
    """)


def calc_item(item: dict) -> dict:
    """Добавляет расчётные поля к позиции портфеля."""
    crop = item.get("crop", "")
    eco = CROP_DATA.get(crop, {"price_per_t": 0, "yield_cha": 0, "cost_per_ha": 0})
    area = float(item.get("area_ha", 0))
    yield_cha = float(item.get("custom_yield") or eco["yield_cha"])
    price_per_t = eco["price_per_t"]
    cost_per_ha = eco["cost_per_ha"]

    # Перевод ц/га → т/га: делим на 10
    revenue = area * (yield_cha / 10.0) * price_per_t
    costs = area * cost_per_ha
    profit = revenue - costs
    roi = (profit / costs * 100) if costs > 0 else 0.0

    return {
        **item,
        "yield_cha": yield_cha,
        "price_per_t": price_per_t,
        "cost_per_ha": cost_per_ha,
        "revenue": round(revenue),
        "costs": round(costs),
        "profit": round(profit),
        "roi_pct": round(roi, 1),
    }


def rows_to_dicts(cur, rows: list) -> list:
    cols = [d[0] for d in cur.description]
    return [dict(zip(cols, row)) for row in rows]


def handler(event: dict, context) -> dict:
    """Портфель культур — CRUD и расчёт экономики."""

    if event.get("httpMethod") == "OPTIONS":
        return {"statusCode": 200, "headers": CORS, "body": ""}

    # GET / — healthcheck
    method = event.get("httpMethod", "GET")
    if method == "GET":
        path = event.get("path", "/")
        if path == "/" or path == "":
            return resp(200, {"status": "ok", "service": "portfolio", "crops": list(CROP_DATA.keys())})

    body = {}
    if event.get("body"):
        try:
            body = json.loads(event["body"])
        except Exception:
            pass

    action = body.get("action", "list")

    db = get_db()
    cur = db.cursor()

    try:
        migrate(cur)
        db.commit()

        # ── LIST ─────────────────────────────────────────────────────
        if action == "list":
            user_id = str(body.get("user_id", "guest")).replace("'", "''")
            cur.execute(
                "SELECT * FROM portfolio_items WHERE user_id = '" + user_id + "' ORDER BY created_at DESC"
            )
            rows = rows_to_dicts(cur, cur.fetchall())
            items = [calc_item(r) for r in rows]

            total_area = sum(i["area_ha"] for i in items)
            total_revenue = sum(i["revenue"] for i in items)
            total_costs = sum(i["costs"] for i in items)
            total_profit = sum(i["profit"] for i in items)

            cur.close()
            db.close()
            return resp(200, {
                "items": items,
                "summary": {
                    "total_area": round(total_area, 2),
                    "total_revenue": round(total_revenue),
                    "total_costs": round(total_costs),
                    "total_profit": round(total_profit),
                    "count": len(items),
                },
            })

        # ── ADD ──────────────────────────────────────────────────────
        if action == "add":
            user_id = str(body.get("user_id", "guest")).replace("'", "''")
            crop = str(body.get("crop", "")).replace("'", "''")
            if crop not in CROP_DATA:
                cur.close(); db.close()
                return resp(400, {"error": "Неизвестная культура: " + crop})

            area_ha = float(body.get("area_ha", 0))
            if area_ha <= 0:
                cur.close(); db.close()
                return resp(400, {"error": "Площадь должна быть больше 0"})

            region = str(body.get("region", "Самарская")).replace("'", "''")
            notes_raw = body.get("notes")
            notes = ("'" + str(notes_raw).replace("'", "''") + "'") if notes_raw else "NULL"
            custom_yield_raw = body.get("custom_yield")
            custom_yield = str(float(custom_yield_raw)) if custom_yield_raw is not None else "NULL"

            sql = (
                "INSERT INTO portfolio_items (user_id, crop, area_ha, region, custom_yield, notes) "
                "VALUES ("
                "'" + user_id + "', "
                "'" + crop + "', "
                + str(area_ha) + ", "
                "'" + region + "', "
                + custom_yield + ", "
                + notes +
                ") RETURNING id"
            )
            cur.execute(sql)
            new_id = cur.fetchone()[0]
            db.commit()

            # Return the new item with calculated fields
            cur.execute("SELECT * FROM portfolio_items WHERE id = " + str(new_id))
            row = rows_to_dicts(cur, cur.fetchall())[0]
            item = calc_item(row)

            cur.close(); db.close()
            return resp(201, {"success": True, "item": item})

        # ── DELETE ───────────────────────────────────────────────────
        if action == "delete":
            user_id = str(body.get("user_id", "guest")).replace("'", "''")
            item_id = int(body.get("id", 0))
            if item_id <= 0:
                cur.close(); db.close()
                return resp(400, {"error": "Не указан id"})

            cur.execute(
                "DELETE FROM portfolio_items WHERE id = " + str(item_id) +
                " AND user_id = '" + user_id + "'"
            )
            deleted = cur.rowcount
            db.commit()
            cur.close(); db.close()

            if deleted == 0:
                return resp(404, {"error": "Позиция не найдена"})
            return resp(200, {"success": True, "deleted_id": item_id})

        # ── SUMMARY ──────────────────────────────────────────────────
        if action == "summary":
            user_id = str(body.get("user_id", "guest")).replace("'", "''")
            cur.execute(
                "SELECT * FROM portfolio_items WHERE user_id = '" + user_id + "'"
            )
            rows = rows_to_dicts(cur, cur.fetchall())
            items = [calc_item(r) for r in rows]

            if not items:
                cur.close(); db.close()
                return resp(200, {
                    "total_area": 0, "total_revenue": 0, "total_costs": 0,
                    "total_profit": 0, "count": 0, "best_crop": None,
                    "crop_breakdown": [],
                })

            total_area = sum(i["area_ha"] for i in items)
            total_revenue = sum(i["revenue"] for i in items)
            total_costs = sum(i["costs"] for i in items)
            total_profit = sum(i["profit"] for i in items)
            avg_roi = (total_profit / total_costs * 100) if total_costs > 0 else 0

            # Лучшая культура по ROI
            by_crop: dict = {}
            for i in items:
                c = i["crop"]
                if c not in by_crop:
                    by_crop[c] = {"crop": c, "area": 0, "revenue": 0, "costs": 0, "profit": 0}
                by_crop[c]["area"] += i["area_ha"]
                by_crop[c]["revenue"] += i["revenue"]
                by_crop[c]["costs"] += i["costs"]
                by_crop[c]["profit"] += i["profit"]

            breakdown = []
            best_crop = None
            best_roi = -999.0
            for c, v in by_crop.items():
                roi = (v["profit"] / v["costs"] * 100) if v["costs"] > 0 else 0
                v["roi_pct"] = round(roi, 1)
                breakdown.append(v)
                if roi > best_roi:
                    best_roi = roi
                    best_crop = c

            cur.close(); db.close()
            return resp(200, {
                "total_area": round(total_area, 2),
                "total_revenue": round(total_revenue),
                "total_costs": round(total_costs),
                "total_profit": round(total_profit),
                "avg_roi_pct": round(avg_roi, 1),
                "count": len(items),
                "best_crop": best_crop,
                "best_crop_roi": round(best_roi, 1),
                "crop_breakdown": breakdown,
            })

        cur.close(); db.close()
        return resp(400, {"error": "Неизвестное действие: " + str(action)})

    except Exception as e:
        try:
            db.rollback()
            cur.close()
            db.close()
        except Exception:
            pass
        return resp(500, {"error": str(e)})
