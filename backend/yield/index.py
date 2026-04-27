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


def _ask_deepseek(region, crop, hist):
    api_key = os.environ.get("DEEPSEEK_API_KEY")
    if not api_key:
        return None
    series = ", ".join([f"{h['year']}: {h['yield']} ц/га" for h in hist])
    prompt = (
        f"Ты агроном-аналитик. Регион: {region}. Культура: {crop}. "
        f"История урожайности: {series}. "
        f"Спрогнозируй урожайность на {hist[-1]['year']+1} год в ц/га. "
        "Учитывай тренд, климатические риски, цикличность. "
        "Верни СТРОГО JSON: {\"yield\": число, \"confidence\": число 0-100, \"reasoning\": \"короткое объяснение на русском, 2-3 предложения\"}. "
        "Без markdown, без обёрток, только JSON."
    )
    body = json.dumps(
        {
            "model": "deepseek-chat",
            "messages": [{"role": "user", "content": prompt}],
            "temperature": 0.3,
            "response_format": {"type": "json_object"},
        }
    ).encode("utf-8")
    req = urllib.request.Request(
        "https://api.deepseek.com/chat/completions",
        data=body,
        headers={"Authorization": f"Bearer {api_key}", "Content-Type": "application/json"},
    )
    try:
        with urllib.request.urlopen(req, timeout=25) as resp:
            data = json.loads(resp.read().decode("utf-8"))
        text = data["choices"][0]["message"]["content"].strip()
        if text.startswith("```"):
            text = text.strip("`").split("\n", 1)[1] if "\n" in text else text.strip("`")
        parsed = json.loads(text)
        return {
            "predicted_yield": float(parsed.get("yield", 0)),
            "confidence": float(parsed.get("confidence", 70)),
            "reasoning": str(parsed.get("reasoning", "")),
        }
    except (urllib.error.URLError, KeyError, ValueError, json.JSONDecodeError):
        return None


def _trend_forecast(hist):
    if len(hist) < 2:
        last = hist[-1]["yield"] if hist else 25.0
        return {"predicted_yield": round(last, 1), "confidence": 50.0, "reasoning": "Мало данных, использовано последнее значение."}
    n = len(hist)
    xs = list(range(n))
    ys = [h["yield"] for h in hist]
    mx = sum(xs) / n
    my = sum(ys) / n
    num = sum((xs[i] - mx) * (ys[i] - my) for i in range(n))
    den = sum((xs[i] - mx) ** 2 for i in range(n)) or 1
    slope = num / den
    intercept = my - slope * mx
    pred = intercept + slope * n
    pred = max(5.0, min(120.0, pred))
    var = sum((ys[i] - (intercept + slope * xs[i])) ** 2 for i in range(n)) / n
    conf = max(45.0, 90.0 - var * 1.5)
    direction = "роста" if slope > 0 else "снижения"
    return {
        "predicted_yield": round(pred, 1),
        "confidence": round(conf, 1),
        "reasoning": f"Линейный тренд {direction} ({slope:+.2f} ц/га в год). Прогноз построен по {n} годам наблюдений.",
    }


def forecast(region: str, crop: str, refresh: bool = False):
    hist = history(region, crop)
    if not hist:
        return {"error": "Нет исторических данных для прогноза"}
    fyear = hist[-1]["year"] + 1
    if not refresh:
        cached = _cached_forecast(region, crop, fyear)
        if cached:
            return {"region": region, "crop": crop, "forecast_year": fyear, "history": hist, **cached}
    ai = _ask_deepseek(region, crop, hist)
    if ai is None:
        ai = _trend_forecast(hist)
    _save_forecast(region, crop, fyear, ai["predicted_yield"], ai["confidence"], ai["reasoning"])
    return {"region": region, "crop": crop, "forecast_year": fyear, "history": hist, **ai, "cached": False}


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
        if not region or not crop:
            return _err(400, "region and crop required")
        return _ok(forecast(region, crop, refresh))
    return _err(400, f"unknown action: {action}")
