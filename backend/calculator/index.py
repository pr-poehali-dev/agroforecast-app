import json

CORS_HEADERS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Content-Type": "application/json",
}

CROP_DATA = {
    "Пшеница озимая":  {"revenue_per_ha": 45600, "cost_per_ha": 28400, "margin": 37.7, "roi": 60.6, "best_sell_month": "Август–Сентябрь", "risk": "низкий"},
    "Подсолнечник":    {"revenue_per_ha": 71250, "cost_per_ha": 41800, "margin": 41.3, "roi": 70.5, "best_sell_month": "Октябрь–Ноябрь", "risk": "средний"},
    "Кукуруза":        {"revenue_per_ha": 38400, "cost_per_ha": 26100, "margin": 32.0, "roi": 47.1, "best_sell_month": "Сентябрь–Октябрь", "risk": "высокий"},
    "Ячмень яровой":   {"revenue_per_ha": 31500, "cost_per_ha": 21200, "margin": 32.7, "roi": 48.6, "best_sell_month": "Июль–Август",     "risk": "низкий"},
    "Рожь":            {"revenue_per_ha": 24800, "cost_per_ha": 18900, "margin": 23.8, "roi": 31.2, "best_sell_month": "Август",            "risk": "низкий"},
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
    }

    return {
        "statusCode": 200,
        "headers": CORS_HEADERS,
        "body": json.dumps(result, ensure_ascii=False),
    }
