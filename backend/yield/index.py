"""
Бизнес: Урожайность по регионам России с историей и ИИ-прогнозом на следующий год.
Args: event с httpMethod, queryStringParameters (action, crop, year, region) или body
Returns: HTTP-ответ JSON со списком регионов/историей/прогнозом
"""
import json
import os
import urllib.request
import urllib.error
import psycopg2

CORS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, X-User-Id",
    "Content-Type": "application/json; charset=utf-8",
}


def _conn():
    return psycopg2.connect(os.environ["DATABASE_URL"])


def _ok(body):
    return {"statusCode": 200, "headers": CORS, "body": json.dumps(body, ensure_ascii=False, default=str)}


def _err(code, msg):
    return {"statusCode": code, "headers": CORS, "body": json.dumps({"error": msg}, ensure_ascii=False)}


def list_map(crop: str, year: int):
    sql = (
        "SELECT region, crop, year, yield_centner_per_ha, gross_harvest_tons, sown_area_ha "
        "FROM crop_yields WHERE crop = %s AND year = %s ORDER BY yield_centner_per_ha DESC"
    )
    with _conn() as c, c.cursor() as cur:
        cur.execute(sql, (crop, year))
        rows = cur.fetchall()
    return [
        {
            "region": r[0],
            "crop": r[1],
            "year": r[2],
            "yield": float(r[3]) if r[3] is not None else None,
            "harvest": float(r[4]) if r[4] is not None else None,
            "area": float(r[5]) if r[5] is not None else None,
        }
        for r in rows
    ]


def list_meta():
    with _conn() as c, c.cursor() as cur:
        cur.execute("SELECT DISTINCT crop FROM crop_yields ORDER BY crop")
        crops = [r[0] for r in cur.fetchall()]
        cur.execute("SELECT DISTINCT year FROM crop_yields ORDER BY year DESC")
        years = [r[0] for r in cur.fetchall()]
        cur.execute("SELECT DISTINCT region FROM crop_yields ORDER BY region")
        regions = [r[0] for r in cur.fetchall()]
    return {"crops": crops, "years": years, "regions": regions}


def history(region: str, crop: str):
    sql = (
        "SELECT year, yield_centner_per_ha, gross_harvest_tons FROM crop_yields "
        "WHERE region = %s AND crop = %s ORDER BY year"
    )
    with _conn() as c, c.cursor() as cur:
        cur.execute(sql, (region, crop))
        rows = cur.fetchall()
    return [
        {
            "year": r[0],
            "yield": float(r[1]) if r[1] is not None else None,
            "harvest": float(r[2]) if r[2] is not None else None,
        }
        for r in rows
    ]


def _cached_forecast(region, crop, fyear):
    with _conn() as c, c.cursor() as cur:
        cur.execute(
            "SELECT predicted_yield, confidence, reasoning FROM yield_forecasts "
            "WHERE region=%s AND crop=%s AND forecast_year=%s",
            (region, crop, fyear),
        )
        row = cur.fetchone()
    if not row:
        return None
    return {
        "predicted_yield": float(row[0]),
        "confidence": float(row[1]),
        "reasoning": row[2],
        "cached": True,
    }


def _save_forecast(region, crop, fyear, pred, conf, reason):
    with _conn() as c, c.cursor() as cur:
        cur.execute(
            "INSERT INTO yield_forecasts (region, crop, forecast_year, predicted_yield, confidence, reasoning) "
            "VALUES (%s,%s,%s,%s,%s,%s) ON CONFLICT (region, crop, forecast_year) DO UPDATE SET "
            "predicted_yield=EXCLUDED.predicted_yield, confidence=EXCLUDED.confidence, "
            "reasoning=EXCLUDED.reasoning, created_at=CURRENT_TIMESTAMP",
            (region, crop, fyear, pred, conf, reason),
        )
        c.commit()


def _ask_deepseek_multi(region, crop, hist, target_years):
    api_key = os.environ.get("DEEPSEEK_API_KEY")
    if not api_key:
        return None
    series = ", ".join([f"{h['year']}: {h['yield']} ц/га" for h in hist])
    years_str = ", ".join(str(y) for y in target_years)
    prompt = (
        f"Ты опытный агроном-аналитик и климатолог. Регион РФ: {region}. Культура: {crop}. "
        f"Исторические данные урожайности: {series}. "
        f"Сейчас апрель 2026 года. Спрогнозируй урожайность по каждому году: {years_str} (в ц/га). "
        "Учитывай: долгосрочный тренд, климатические изменения (потепление, засушливость юга РФ), "
        "цикличность урожайных и неурожайных лет, развитие агротехнологий и селекции, "
        "риски засух, заморозков, вредителей. Уверенность падает с дальностью прогноза. "
        "Верни СТРОГО JSON: "
        "{\"forecasts\":[{\"year\":2026,\"yield\":число,\"confidence\":0-100},...],"
        "\"reasoning\":\"3-5 предложений на русском: тренд, риски, динамика по годам\"}. "
        "Без markdown, без ```, только JSON."
    )
    body = json.dumps(
        {
            "model": "deepseek-chat",
            "messages": [{"role": "user", "content": prompt}],
            "temperature": 0.4,
            "response_format": {"type": "json_object"},
        }
    ).encode("utf-8")
    req = urllib.request.Request(
        "https://api.deepseek.com/chat/completions",
        data=body,
        headers={"Authorization": f"Bearer {api_key}", "Content-Type": "application/json"},
    )
    try:
        with urllib.request.urlopen(req, timeout=28) as resp:
            data = json.loads(resp.read().decode("utf-8"))
        text = data["choices"][0]["message"]["content"].strip()
        if text.startswith("```"):
            text = text.strip("`").split("\n", 1)[1] if "\n" in text else text.strip("`")
        parsed = json.loads(text)
        items = parsed.get("forecasts", [])
        out = []
        for it in items:
            out.append({
                "year": int(it.get("year")),
                "predicted_yield": float(it.get("yield", 0)),
                "confidence": float(it.get("confidence", 70)),
            })
        return {"forecasts": out, "reasoning": str(parsed.get("reasoning", ""))}
    except (urllib.error.URLError, KeyError, ValueError, json.JSONDecodeError, TypeError):
        return None


def _trend_forecast_multi(hist, target_years):
    if len(hist) < 2:
        last = hist[-1]["yield"] if hist else 25.0
        return {
            "forecasts": [{"year": y, "predicted_yield": round(last, 1), "confidence": 50.0} for y in target_years],
            "reasoning": "Мало данных, использовано последнее значение.",
        }
    n = len(hist)
    xs = list(range(n))
    ys = [h["yield"] for h in hist]
    mx = sum(xs) / n
    my = sum(ys) / n
    num = sum((xs[i] - mx) * (ys[i] - my) for i in range(n))
    den = sum((xs[i] - mx) ** 2 for i in range(n)) or 1
    slope = num / den
    intercept = my - slope * mx
    var = sum((ys[i] - (intercept + slope * xs[i])) ** 2 for i in range(n)) / n
    last_hist_year = hist[-1]["year"]
    forecasts = []
    for y in target_years:
        offset = n + (y - last_hist_year - 1)
        pred = intercept + slope * offset
        pred = max(5.0, min(120.0, pred))
        horizon = y - last_hist_year
        conf = max(40.0, 88.0 - var * 1.5 - horizon * 4.0)
        forecasts.append({"year": y, "predicted_yield": round(pred, 1), "confidence": round(conf, 1)})
    direction = "роста" if slope > 0 else "снижения"
    return {
        "forecasts": forecasts,
        "reasoning": f"Линейный тренд {direction} ({slope:+.2f} ц/га в год) по {n} годам наблюдений. Уверенность снижается с горизонтом прогноза.",
    }


def forecast(region: str, crop: str, refresh: bool = False, years_ahead: int = 5):
    hist = history(region, crop)
    if not hist:
        return {"error": "Нет исторических данных для прогноза"}
    last_hist_year = hist[-1]["year"]
    target_years = list(range(last_hist_year + 1, last_hist_year + 1 + max(1, years_ahead)))

    if not refresh:
        cached_items = []
        all_cached = True
        with _conn() as c, c.cursor() as cur:
            for y in target_years:
                cur.execute(
                    "SELECT predicted_yield, confidence, reasoning FROM yield_forecasts WHERE region=%s AND crop=%s AND forecast_year=%s",
                    (region, crop, y),
                )
                row = cur.fetchone()
                if row:
                    cached_items.append({"year": y, "predicted_yield": float(row[0]), "confidence": float(row[1]), "reasoning": row[2]})
                else:
                    all_cached = False
                    break
        if all_cached and cached_items:
            return {
                "region": region, "crop": crop,
                "forecast_years": target_years,
                "forecasts": cached_items,
                "reasoning": cached_items[0].get("reasoning", ""),
                "history": hist, "cached": True,
            }

    ai = _ask_deepseek_multi(region, crop, hist, target_years)
    if ai is None or not ai.get("forecasts"):
        ai = _trend_forecast_multi(hist, target_years)

    reasoning = ai.get("reasoning", "")
    for f in ai["forecasts"]:
        _save_forecast(region, crop, f["year"], f["predicted_yield"], f["confidence"], reasoning)

    return {
        "region": region, "crop": crop,
        "forecast_years": target_years,
        "forecasts": ai["forecasts"],
        "reasoning": reasoning,
        "history": hist,
        "cached": False,
    }


def handler(event, context):
    method = event.get("httpMethod", "GET")
    if method == "OPTIONS":
        return {"statusCode": 200, "headers": CORS, "body": ""}
    qs = event.get("queryStringParameters") or {}
    action = qs.get("action", "meta")
    if action == "meta":
        return _ok(list_meta())
    if action == "map":
        crop = qs.get("crop") or "Пшеница озимая"
        try:
            year = int(qs.get("year") or 2024)
        except ValueError:
            return _err(400, "year must be int")
        return _ok({"crop": crop, "year": year, "regions": list_map(crop, year)})
    if action == "history":
        region = qs.get("region")
        crop = qs.get("crop")
        if not region or not crop:
            return _err(400, "region and crop required")
        return _ok({"region": region, "crop": crop, "history": history(region, crop)})
    if action == "forecast":
        region = qs.get("region")
        crop = qs.get("crop")
        refresh = qs.get("refresh") == "1"
        try:
            years_ahead = int(qs.get("years") or 5)
        except ValueError:
            years_ahead = 5
        years_ahead = max(1, min(10, years_ahead))
        if not region or not crop:
            return _err(400, "region and crop required")
        return _ok(forecast(region, crop, refresh, years_ahead))
    if action == "forecast_all":
        crop = qs.get("crop") or "Пшеница озимая"
        try:
            years_ahead = int(qs.get("years") or 5)
        except ValueError:
            years_ahead = 5
        years_ahead = max(1, min(10, years_ahead))
        with _conn() as c, c.cursor() as cur:
            cur.execute("SELECT DISTINCT region FROM crop_yields WHERE crop=%s ORDER BY region", (crop,))
            regions = [r[0] for r in cur.fetchall()]
        result = []
        for reg in regions:
            hist = history(reg, crop)
            if not hist:
                continue
            target_years = list(range(hist[-1]["year"] + 1, hist[-1]["year"] + 1 + years_ahead))
            tf = _trend_forecast_multi(hist, target_years)
            ys = [h["yield"] for h in hist]
            avg = sum(ys) / len(ys)
            slope_pct = ((hist[-1]["yield"] - hist[0]["yield"]) / hist[0]["yield"] * 100) if hist[0]["yield"] else 0
            result.append({
                "region": reg,
                "history": hist,
                "avg": round(avg, 1),
                "last": hist[-1]["yield"],
                "min": round(min(ys), 1),
                "max": round(max(ys), 1),
                "trend_pct": round(slope_pct, 1),
                "forecasts": tf["forecasts"],
                "reasoning": tf["reasoning"],
            })
        return _ok({"crop": crop, "years_ahead": years_ahead, "regions": result})
    return _err(400, f"unknown action: {action}")