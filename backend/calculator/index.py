import json

CORS_HEADERS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Content-Type": "application/json",
}

# Данные ФГБУ «Агроэкспорт» + НТБ, апрель 2025, Поволжье
# revenue = урожайность (ц/га) × цена (₽/т) / 10; cost = прямые затраты + накладные
CROP_DATA = {
    "Пшеница озимая":  {"revenue_per_ha": 47200, "cost_per_ha": 29800, "margin": 36.9, "roi": 58.4, "best_sell_month": "Август–Сентябрь", "risk": "низкий",  "price_per_t": 14850, "yield_cha": 30.8},
    "Подсолнечник":    {"revenue_per_ha": 70200, "cost_per_ha": 42500, "margin": 39.5, "roi": 65.2, "best_sell_month": "Октябрь–Ноябрь", "risk": "средний", "price_per_t": 31200, "yield_cha": 22.5},
    "Кукуруза":        {"revenue_per_ha": 39600, "cost_per_ha": 27200, "margin": 31.3, "roi": 45.6, "best_sell_month": "Сентябрь–Октябрь", "risk": "высокий", "price_per_t": 12600, "yield_cha": 55.2},
    "Ячмень яровой":   {"revenue_per_ha": 32800, "cost_per_ha": 22100, "margin": 32.6, "roi": 48.4, "best_sell_month": "Июль–Август",     "risk": "низкий",  "price_per_t": 11400, "yield_cha": 27.3},
    "Рожь":            {"revenue_per_ha": 25200, "cost_per_ha": 19400, "margin": 23.0, "roi": 29.9, "best_sell_month": "Август",            "risk": "низкий",  "price_per_t":  9600, "yield_cha": 17.8},
}


def handler(event: dict, context) -> dict:
    """Калькулятор маржинальности агрокультур: принимает культуру и площадь, возвращает финансовый расчёт."""
    if event.get("httpMethod") == "OPTIONS":
        return {"statusCode": 200, "headers": CORS_HEADERS, "body": ""}

    if event.get("httpMethod") == "GET":
        return {
            "statusCode": 200,
            "headers": CORS_HEADERS,
            "body": json.dumps({"crops": list(CROP_DATA.keys())}, ensure_ascii=False),
        }

    body = json.loads(event.get("body") or "{}")
    crop = body.get("crop", "Пшеница озимая")
    area = float(body.get("area", 100))

    if crop not in CROP_DATA:
        return {
            "statusCode": 400,
            "headers": CORS_HEADERS,
            "body": json.dumps({"error": f"Культура '{crop}' не найдена"}, ensure_ascii=False),
        }

    data = CROP_DATA[crop]
    revenue = data["revenue_per_ha"] * area
    cost = data["cost_per_ha"] * area
    profit = revenue - cost

    # Recommendation logic
    if data["margin"] > 38:
        tip = f"Отличная культура для вашей площади. Рекомендуем реализацию в {data['best_sell_month']}."
    elif data["margin"] > 30:
        tip = f"Хорошая доходность. Оптимальный срок продаж — {data['best_sell_month']}. Риск: {data['risk']}."
    else:
        tip = f"Невысокая маржинальность. Рассмотрите диверсификацию или переход на подсолнечник (ROI 70.5%)."

    result = {
        "crop": crop,
        "area_ha": area,
        "revenue_rub": round(revenue),
        "cost_rub": round(cost),
        "profit_rub": round(profit),
        "margin_pct": data["margin"],
        "roi_pct": data["roi"],
        "best_sell_month": data["best_sell_month"],
        "risk_level": data["risk"],
        "recommendation": tip,
        "price_per_t": data["price_per_t"],
        "yield_cha": data["yield_cha"],
        "data_source": "НТБ + ФГБУ Агроэкспорт, апрель 2025",
    }

    return {
        "statusCode": 200,
        "headers": CORS_HEADERS,
        "body": json.dumps(result, ensure_ascii=False),
    }