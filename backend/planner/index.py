"""
Планировщик посевных площадей: оптимизация структуры посевов под прогнозные цены
и агроклиматические условия региона. Апрель 2026.
"""
import json
import math

CORS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Content-Type": "application/json",
}

# Нормативные данные (апрель 2026, Поволжье)
CROP_NORMS = {
    "Пшеница озимая": {
        "price_now": 13650, "price_forecast_jul": 14800,
        "yield_base": 29.4, "cost_per_ha": 31600, "revenue_per_ha": 44100,
        "margin": 28.3, "roi": 39.6,
        "water_need": "средняя", "drought_resist": 0.72,
        "frost_resist": 0.85, "sow_season": "осень",
        "harvest_month": "Июль–Август",
        "min_temp_sow": 8, "soil_types": ["чернозём", "каштановые"],
        "rotation_years": 4, "best_prev": ["бобовые", "пар", "кукуруза"],
    },
    "Подсолнечник": {
        "price_now": 46500, "price_forecast_jul": 43200,
        "yield_base": 23.1, "cost_per_ha": 45200, "revenue_per_ha": 96600,
        "margin": 53.2, "roi": 113.7,
        "water_need": "умеренная", "drought_resist": 0.80,
        "frost_resist": 0.20, "sow_season": "весна",
        "harvest_month": "Сентябрь–Октябрь",
        "min_temp_sow": 12, "soil_types": ["чернозём", "каштановые", "суглинок"],
        "rotation_years": 7, "best_prev": ["зерновые", "кукуруза"],
    },
    "Кукуруза": {
        "price_now": 13800, "price_forecast_jul": 14600,
        "yield_base": 56.8, "cost_per_ha": 28900, "revenue_per_ha": 40800,
        "margin": 29.2, "roi": 41.2,
        "water_need": "высокая", "drought_resist": 0.40,
        "frost_resist": 0.10, "sow_season": "весна",
        "harvest_month": "Сентябрь–Октябрь",
        "min_temp_sow": 14, "soil_types": ["чернозём", "суглинок"],
        "rotation_years": 2, "best_prev": ["зерновые", "бобовые"],
    },
    "Ячмень яровой": {
        "price_now": 12200, "price_forecast_jul": 12700,
        "yield_base": 28.1, "cost_per_ha": 23400, "revenue_per_ha": 34200,
        "margin": 31.6, "roi": 46.2,
        "water_need": "низкая", "drought_resist": 0.65,
        "frost_resist": 0.60, "sow_season": "весна",
        "harvest_month": "Июль–Август",
        "min_temp_sow": 5, "soil_types": ["все типы"],
        "rotation_years": 2, "best_prev": ["пар", "бобовые", "кукуруза"],
    },
    "Рожь": {
        "price_now": 10100, "price_forecast_jul": 9750,
        "yield_base": 18.2, "cost_per_ha": 20600, "revenue_per_ha": 26300,
        "margin": 21.7, "roi": 27.7,
        "water_need": "низкая", "drought_resist": 0.78,
        "frost_resist": 0.95, "sow_season": "осень",
        "harvest_month": "Июль–Август",
        "min_temp_sow": 6, "soil_types": ["все типы", "бедные почвы"],
        "rotation_years": 3, "best_prev": ["пар", "бобовые"],
    },
    "Соя": {
        "price_now": 31500, "price_forecast_jul": 33800,
        "yield_base": 18.6, "cost_per_ha": 38200, "revenue_per_ha": 52200,
        "margin": 26.8, "roi": 36.6,
        "water_need": "высокая", "drought_resist": 0.45,
        "frost_resist": 0.15, "sow_season": "весна",
        "harvest_month": "Сентябрь–Октябрь",
        "min_temp_sow": 14, "soil_types": ["чернозём", "серые лесные"],
        "rotation_years": 3, "best_prev": ["зерновые"],
    },
}

REGION_CLIMATE = {
    "samara":        {"drought_risk": 0.38, "frost_risk": 0.09, "rain_apr_may": 38, "temp_may": 16},
    "saratov":       {"drought_risk": 0.51, "frost_risk": 0.07, "rain_apr_may": 28, "temp_may": 19},
    "volgograd":     {"drought_risk": 0.74, "frost_risk": 0.03, "rain_apr_may": 15, "temp_may": 23},
    "ulyanovsk":     {"drought_risk": 0.18, "frost_risk": 0.15, "rain_apr_may": 55, "temp_may": 14},
    "penza":         {"drought_risk": 0.15, "frost_risk": 0.13, "rain_apr_may": 60, "temp_may": 13},
    "orenburg":      {"drought_risk": 0.52, "frost_risk": 0.12, "rain_apr_may": 32, "temp_may": 17},
    "tatarstan":     {"drought_risk": 0.19, "frost_risk": 0.17, "rain_apr_may": 58, "temp_may": 13},
    "bashkortostan": {"drought_risk": 0.27, "frost_risk": 0.20, "rain_apr_may": 48, "temp_may": 13},
}


def optimize_structure(total_ha: float, region_id: str, goals: list, existing: dict) -> dict:
    """Оптимизирует структуру посевов под цели пользователя."""
    rc = REGION_CLIMATE.get(region_id, REGION_CLIMATE["samara"])
    crops_scored = []

    for crop, cn in CROP_NORMS.items():
        # Базовый скор — ROI
        score = cn["roi"] / 100

        # Штраф за засуху
        drought_penalty = rc["drought_risk"] * (1 - cn["drought_resist"]) * 0.5
        score -= drought_penalty

        # Штраф за заморозки (для весенних культур)
        if cn["sow_season"] == "весна":
            frost_penalty = rc["frost_risk"] * (1 - cn["frost_resist"]) * 0.3
            score -= frost_penalty

        # Бонус за влагу (высокое потребление воды при хорошем увлажнении)
        if cn["water_need"] == "высокая" and rc["rain_apr_may"] > 50:
            score += 0.15
        elif cn["water_need"] == "высокая" and rc["rain_apr_may"] < 25:
            score -= 0.25

        # Бонус за цели пользователя
        if "max_profit" in goals:
            score += cn["margin"] / 200
        if "min_risk" in goals:
            score += cn["drought_resist"] * 0.1 - (1 - cn["drought_resist"]) * 0.2
        if "price_growth" in goals and cn["price_forecast_jul"] > cn["price_now"]:
            growth = (cn["price_forecast_jul"] - cn["price_now"]) / cn["price_now"]
            score += growth * 0.5

        crops_scored.append({"crop": crop, "score": max(0, score), "cn": cn})

    crops_scored.sort(key=lambda x: x["score"], reverse=True)

    # Распределяем площадь: топ-3 культуры
    result = []
    remaining = total_ha
    shares = [0.45, 0.30, 0.25]

    for i, item in enumerate(crops_scored[:3]):
        cn = item["cn"]
        area = round(total_ha * shares[i])
        if i == 2:
            area = remaining - sum(r["area_ha"] for r in result)

        revenue = cn["revenue_per_ha"] * area
        cost = cn["cost_per_ha"] * area
        profit = revenue - cost

        result.append({
            "crop": item["crop"],
            "area_ha": area,
            "share_pct": round(area / total_ha * 100, 1),
            "score": round(item["score"], 3),
            "revenue_rub": round(revenue),
            "cost_rub": round(cost),
            "profit_rub": round(profit),
            "margin_pct": cn["margin"],
            "roi_pct": cn["roi"],
            "yield_cha": cn["yield_base"],
            "harvest_month": cn["harvest_month"],
            "water_need": cn["water_need"],
            "drought_resist": cn["drought_resist"],
            "sow_season": cn["sow_season"],
        })
        remaining -= area

    total_revenue = sum(r["revenue_rub"] for r in result)
    total_cost = sum(r["cost_rub"] for r in result)
    total_profit = total_revenue - total_cost
    avg_margin = round(total_profit / total_revenue * 100, 1) if total_revenue else 0

    return {
        "recommended": result,
        "total_area_ha": total_ha,
        "total_revenue_rub": total_revenue,
        "total_cost_rub": total_cost,
        "total_profit_rub": total_profit,
        "avg_margin_pct": avg_margin,
        "region_climate": rc,
    }


def handler(event: dict, context) -> dict:
    """
    Планировщик посевных площадей: оптимизация структуры под цели хозяйства.
    GET /                        — список культур с нормативами
    POST / {total_ha, region, goals, existing_crops} — оптимальная структура посевов
    """
    if event.get("httpMethod") == "OPTIONS":
        return {"statusCode": 200, "headers": CORS, "body": ""}

    if event.get("httpMethod") == "GET":
        crops_list = []
        for name, cn in CROP_NORMS.items():
            crops_list.append({
                "crop": name,
                "price_now": cn["price_now"],
                "price_forecast_jul": cn["price_forecast_jul"],
                "yield_base": cn["yield_base"],
                "cost_per_ha": cn["cost_per_ha"],
                "revenue_per_ha": cn["revenue_per_ha"],
                "margin": cn["margin"],
                "roi": cn["roi"],
                "water_need": cn["water_need"],
                "drought_resist": cn["drought_resist"],
                "sow_season": cn["sow_season"],
                "harvest_month": cn["harvest_month"],
                "best_prev": cn["best_prev"],
            })
        return {"statusCode": 200, "headers": CORS,
                "body": json.dumps({
                    "crops": crops_list,
                    "goals": [
                        {"id": "max_profit", "label": "Максимальная прибыль"},
                        {"id": "min_risk", "label": "Минимальный риск"},
                        {"id": "price_growth", "label": "Ставка на рост цен"},
                    ],
                    "data_source": "НТБ + ФГБУ Агроэкспорт, апрель 2026",
                }, ensure_ascii=False)}

    body = json.loads(event.get("body") or "{}")
    total_ha = float(body.get("total_ha", 1000))
    region = body.get("region", "samara")
    goals = body.get("goals", ["max_profit"])
    existing = body.get("existing_crops", {})

    if total_ha < 1 or total_ha > 500000:
        return {"statusCode": 400, "headers": CORS,
                "body": json.dumps({"error": "Площадь должна быть от 1 до 500 000 га"}, ensure_ascii=False)}

    plan = optimize_structure(total_ha, region, goals, existing)

    return {"statusCode": 200, "headers": CORS,
            "body": json.dumps({
                "region": region,
                "goals": goals,
                "data_source": "НТБ + ФГБУ Агроэкспорт, апрель 2026",
                **plan,
            }, ensure_ascii=False)}
