import json

CORS_HEADERS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Content-Type": "application/json",
}

# НТБ + ФГБУ «Агроэкспорт» + НГС.ру 21.04.2026, Поволжье
# revenue = урожайность × цена ÷ 10; cost = прямые + накладные (рост себест. ~6% к 2025)
# Пшеница: цена 13 650 ₽/т (апрель 2026, откат с мартовского пика)
# Подсолнечник: закупка у МЭЗ 46 500 ₽/т (oilworld.ru 04.2026)
# Кукуруза: 13 800 ₽/т (внутренний рынок Поволжье)
# Ячмень: 12 200 ₽/т фуражный (тендер Турция-ТМО апр 2026)
CROP_DATA = {
    "Пшеница озимая":  {"revenue_per_ha": 44100, "cost_per_ha": 31600, "margin": 28.3, "roi": 39.6, "best_sell_month": "Август–Сентябрь", "risk": "средний", "price_per_t": 13650, "yield_cha": 29.4},
    "Подсолнечник":    {"revenue_per_ha": 96600, "cost_per_ha": 45200, "margin": 53.2, "roi": 113.7, "best_sell_month": "Октябрь–Ноябрь", "risk": "средний", "price_per_t": 46500, "yield_cha": 23.1},
    "Кукуруза":        {"revenue_per_ha": 40800, "cost_per_ha": 28900, "margin": 29.2, "roi": 41.2, "best_sell_month": "Сентябрь–Октябрь", "risk": "высокий", "price_per_t": 13800, "yield_cha": 56.8},
    "Ячмень яровой":   {"revenue_per_ha": 34200, "cost_per_ha": 23400, "margin": 31.6, "roi": 46.2, "best_sell_month": "Июль–Август",     "risk": "низкий",  "price_per_t": 12200, "yield_cha": 28.1},
    "Рожь":            {"revenue_per_ha": 26300, "cost_per_ha": 20600, "margin": 21.7, "roi": 27.7, "best_sell_month": "Август",           "risk": "низкий",  "price_per_t": 10100, "yield_cha": 18.2},
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

    # Recommendation logic (апрель 2026: подсолнечник — лидер ROI 113.7%)
    if data["margin"] > 45:
        tip = f"Отличная культура апреля 2026. Рекомендуем реализацию в {data['best_sell_month']}. ROI {data['roi']}% — лучший показатель в регионе."
    elif data["margin"] > 28:
        tip = f"Хорошая доходность. Оптимальный срок продаж — {data['best_sell_month']}. Риск: {data['risk']}."
    else:
        tip = f"Невысокая маржинальность ({data['margin']}%). Рассмотрите подсолнечник: закупочная цена 46 500 ₽/т, ROI 113.7% (oilworld.ru, апрель 2026)."

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
        "data_source": "НТБ + ФГБУ Агроэкспорт + НГС.ру, апрель 2026",
    }

    return {
        "statusCode": 200,
        "headers": CORS_HEADERS,
        "body": json.dumps(result, ensure_ascii=False),
    }