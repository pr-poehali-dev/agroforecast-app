"""
Прогноз цен производителей на пшеницу, кукурузу и подсолнечник по открытым данным
(Росстат, Всемирный банк, Банк России) с проверкой на истории.

GET  /?action=summary            — метрики проверки, прогнозы на 1/3/6 мес., история за 36 мес.
GET  /?action=backtest&crop=..&h=..  — точки проверки на истории для графика
POST /?action=retrain&crop=..    — пересчёт проверки на истории для культуры
"""
import json
import math
import os
from datetime import datetime, timedelta

import psycopg2

import model

SCHEMA = os.environ.get("MAIN_DB_SCHEMA", "t_p36960093_agroforecast_app")
CROPS = {"wheat": "Пшеница", "corn": "Кукуруза", "sunflower": "Подсолнечник (семена)"}
HORIZONS = (1, 3, 6)
CORS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, X-Admin-Token",
    "Content-Type": "application/json",
}


def ok(data):
    return {"statusCode": 200, "headers": CORS, "body": json.dumps(data, ensure_ascii=False, default=str)}


def err(msg, code=400):
    return {"statusCode": code, "headers": CORS, "body": json.dumps({"error": msg}, ensure_ascii=False)}


def load(cur, crop):
    cur.execute(f"SELECT to_char(period,'YYYY-MM'), price_rub_t FROM {SCHEMA}.price_history WHERE crop=%s ORDER BY period", (crop,))
    P = {k: float(v) for k, v in cur.fetchall()}
    cur.execute(
        f"""SELECT to_char(w.period,'YYYY-MM'), w.price_usd_t, f.usd_rub
            FROM {SCHEMA}.world_prices w JOIN {SCHEMA}.fx_rates f ON f.period = w.period
            WHERE w.crop=%s ORDER BY w.period""", (crop,))
    Wr = {k: math.log(float(p) * float(fx)) for k, p, fx in cur.fetchall()}
    return P, Wr


def latest_backtests(cur, crop):
    cur.execute(
        f"""SELECT DISTINCT ON (horizon) horizon, params, metrics, created_at
            FROM {SCHEMA}.model_backtests WHERE crop=%s ORDER BY horizon, created_at DESC""", (crop,))
    return {h: {"params": p, "metrics": m, "created_at": c} for h, p, m, c in cur.fetchall()}


def handler(event: dict, context) -> dict:
    if event.get("httpMethod") == "OPTIONS":
        return {"statusCode": 200, "headers": CORS, "body": ""}
    params = event.get("queryStringParameters") or {}
    action = params.get("action", "summary")
    conn = psycopg2.connect(os.environ["DATABASE_URL"])
    conn.autocommit = True
    cur = conn.cursor()
    try:
        if event.get("httpMethod") == "POST" and action == "retrain":
            crop = params.get("crop")
            if crop not in CROPS:
                return err("Укажите культуру: wheat, corn или sunflower")
            cur.execute(f"SELECT max(created_at) FROM {SCHEMA}.model_backtests WHERE crop=%s", (crop,))
            last = cur.fetchone()[0]
            if last and datetime.now() - last < timedelta(hours=6) and params.get("force") != "1":
                return ok({"skipped": True, "reason": "Пересчёт выполнялся менее 6 часов назад", "last": last})
            P, Wr = load(cur, crop)
            out = {}
            for h in HORIZONS:
                r = model.backtest(P, Wr, h)
                cur.execute(
                    f"INSERT INTO {SCHEMA}.model_backtests (crop, horizon, params, metrics) VALUES (%s,%s,%s,%s)",
                    (crop, h, json.dumps(r["params"]), json.dumps(r["metrics"])))
                out[h] = {k: v for k, v in r["metrics"].items() if k != "points"}
            return ok({"crop": crop, "results": out})

        if action == "backtest":
            crop, h = params.get("crop"), int(params.get("h", 1))
            bt = latest_backtests(cur, crop).get(h)
            if not bt:
                return err("Проверка на истории ещё не выполнялась", 404)
            return ok({"crop": crop, "horizon": h, **bt})

        result = []
        for crop, name in CROPS.items():
            P, Wr = load(cur, crop)
            bts = latest_backtests(cur, crop)
            keys = sorted(P)
            item = {"crop": crop, "name": name, "unit": "руб/т",
                    "last_period": keys[-1] if keys else None,
                    "last_price": round(P[keys[-1]]) if keys else None,
                    "history": [{"t": k, "price": round(P[k])} for k in keys[-36:]],
                    "horizons": []}
            for h in HORIZONS:
                bt = bts.get(h)
                if not bt:
                    item["horizons"].append({"h": h, "status": "not_validated"})
                    continue
                m, p = bt["metrics"], bt["params"]
                fc = model.forecast(P, Wr, h, p["lambda"], p["weight"], m["pi80"])
                item["horizons"].append({
                    "h": h, "status": "ok",
                    "beats_naive": (m["skill_pct"] or 0) > 0,
                    "mape": m["mape"], "mape_naive": m["mape_naive"], "skill_pct": m["skill_pct"],
                    "dir_accuracy_pct": m.get("dir_accuracy_pct"), "n": m["n"],
                    "test_from": m["test_from"], "test_to": m["test_to"],
                    "weight": p["weight"], "validated_at": bt["created_at"],
                    "forecast": fc,
                })
            result.append(item)
        return ok({
            "model": "Гребневая регрессия: импульс цены, мировая цена в рублях, спред к паритету, сезонность",
            "validation": "Подбор параметров на 2012–2019, оценка на 2020 – н.в. скользящим окном (модель видит только прошлое)",
            "sources": ["Росстат: средние цены производителей (ЕМИСС 31454, 57693; cena_sx)",
                        "Всемирный банк: Pink Sheet (Wheat US HRW, Maize, Sunflower oil)",
                        "Банк России: курс USD/RUB"],
            "crops": result,
        })
    finally:
        cur.close(); conn.close()
