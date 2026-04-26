"""
Логистика АгроПорт — расчёт расстояния и стоимости доставки сельхозпродукции.
action: calculate, compare_transport, routes_list, routes_save, route_delete, cities_list
"""
import json, os, math
import psycopg2

CORS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Authorization",
    "Content-Type": "application/json",
}

SCHEMA = os.environ.get("MAIN_DB_SCHEMA", "t_p36960093_agroforecast_app")

def get_db():
    conn = psycopg2.connect(os.environ["DATABASE_URL"])
    conn.autocommit = True
    return conn

def ok(data):
    return {"statusCode": 200, "headers": CORS, "body": json.dumps(data, ensure_ascii=False, default=str)}

def err(msg, code=400):
    return {"statusCode": code, "headers": CORS, "body": json.dumps({"error": msg}, ensure_ascii=False)}

# ─── Города России с координатами ────────────────────────────────────────────

CITIES = [
    {"name": "Москва",            "lat": 55.7558, "lon": 37.6173, "region": "ЦФО"},
    {"name": "Санкт-Петербург",   "lat": 59.9343, "lon": 30.3351, "region": "СЗФО"},
    {"name": "Ростов-на-Дону",    "lat": 47.2357, "lon": 39.7015, "region": "ЮФО"},
    {"name": "Краснодар",         "lat": 45.0448, "lon": 38.9760, "region": "ЮФО"},
    {"name": "Ставрополь",        "lat": 45.0428, "lon": 41.9734, "region": "СКФО"},
    {"name": "Волгоград",         "lat": 48.7080, "lon": 44.5133, "region": "ЮФО"},
    {"name": "Самара",            "lat": 53.1959, "lon": 50.1500, "region": "ПФО"},
    {"name": "Саратов",           "lat": 51.5922, "lon": 45.9608, "region": "ПФО"},
    {"name": "Казань",            "lat": 55.7887, "lon": 49.1221, "region": "ПФО"},
    {"name": "Уфа",               "lat": 54.7388, "lon": 55.9721, "region": "ПФО"},
    {"name": "Оренбург",          "lat": 51.7727, "lon": 55.0988, "region": "ПФО"},
    {"name": "Пенза",             "lat": 53.1959, "lon": 45.0183, "region": "ПФО"},
    {"name": "Екатеринбург",      "lat": 56.8389, "lon": 60.6057, "region": "УрФО"},
    {"name": "Челябинск",         "lat": 55.1644, "lon": 61.4368, "region": "УрФО"},
    {"name": "Тюмень",            "lat": 57.1522, "lon": 65.5272, "region": "УрФО"},
    {"name": "Новосибирск",       "lat": 54.9884, "lon": 82.9357, "region": "СФО"},
    {"name": "Омск",              "lat": 54.9885, "lon": 73.3242, "region": "СФО"},
    {"name": "Барнаул",           "lat": 53.3606, "lon": 83.7636, "region": "СФО"},
    {"name": "Красноярск",        "lat": 56.0153, "lon": 92.8932, "region": "СФО"},
    {"name": "Воронеж",           "lat": 51.6755, "lon": 39.2088, "region": "ЦФО"},
    {"name": "Белгород",          "lat": 50.5958, "lon": 36.5873, "region": "ЦФО"},
    {"name": "Курск",             "lat": 51.7304, "lon": 36.1938, "region": "ЦФО"},
    {"name": "Тамбов",            "lat": 52.7212, "lon": 41.4525, "region": "ЦФО"},
    {"name": "Липецк",            "lat": 52.6088, "lon": 39.5988, "region": "ЦФО"},
    {"name": "Орёл",              "lat": 52.9677, "lon": 36.0694, "region": "ЦФО"},
    {"name": "Тула",              "lat": 54.1961, "lon": 37.6182, "region": "ЦФО"},
    {"name": "Рязань",            "lat": 54.6296, "lon": 39.7415, "region": "ЦФО"},
    {"name": "Астрахань",         "lat": 46.3497, "lon": 48.0408, "region": "ЮФО"},
    {"name": "Элиста",            "lat": 46.3078, "lon": 44.2682, "region": "ЮФО"},
    {"name": "Симферополь",       "lat": 44.9521, "lon": 34.1024, "region": "ЮФО"},
    {"name": "Нижний Новгород",   "lat": 56.2965, "lon": 43.9361, "region": "ПФО"},
    {"name": "Пермь",             "lat": 58.0105, "lon": 56.2502, "region": "ПФО"},
    {"name": "Ижевск",            "lat": 56.8527, "lon": 53.2114, "region": "ПФО"},
    {"name": "Ульяновск",         "lat": 54.3282, "lon": 48.3866, "region": "ПФО"},
    {"name": "Тольятти",          "lat": 53.5303, "lon": 49.3461, "region": "ПФО"},
    {"name": "Балаково",          "lat": 52.0314, "lon": 47.8029, "region": "ПФО"},
    {"name": "Новороссийск",      "lat": 44.7239, "lon": 37.7687, "region": "ЮФО"},
    {"name": "Тихорецк",          "lat": 45.8521, "lon": 40.1270, "region": "ЮФО"},
    {"name": "Армавир",           "lat": 44.9948, "lon": 41.1218, "region": "ЮФО"},
    {"name": "Камышин",           "lat": 50.0833, "lon": 45.3833, "region": "ЮФО"},
]

CITY_MAP = {c["name"]: c for c in CITIES}

VEHICLE_TYPES = {
    "truck_5t":   {"label": "Малотоннажный (до 5 т)",  "capacity": 5,  "rate_per_km": 45,  "base": 2000},
    "truck_10t":  {"label": "Среднетоннажный (до 10 т)","capacity": 10, "rate_per_km": 60,  "base": 3000},
    "truck_20t":  {"label": "Фура (до 20 т)",           "capacity": 20, "rate_per_km": 80,  "base": 4000},
    "truck_40t":  {"label": "Зерновоз (до 40 т)",       "capacity": 40, "rate_per_km": 110, "base": 6000},
    "rail":       {"label": "Железнодорожный (вагон)",  "capacity": 60, "rate_per_km": 55,  "base": 20000},
    "bulk_ship":  {"label": "Речной баржа (зерно)",     "capacity": 300,"rate_per_km": 12,  "base": 50000},
}

CARGO_TYPES = {
    "grain":       {"label": "Зерновые (пшеница, ячмень)", "surcharge": 1.0},
    "sunflower":   {"label": "Подсолнечник",               "surcharge": 1.05},
    "corn":        {"label": "Кукуруза",                   "surcharge": 1.0},
    "oilseed":     {"label": "Масличные",                  "surcharge": 1.08},
    "sugar_beet":  {"label": "Сахарная свёкла",            "surcharge": 1.12},
    "vegetables":  {"label": "Овощи/картофель",            "surcharge": 1.20},
    "fertilizer":  {"label": "Удобрения",                  "surcharge": 1.15},
    "equipment":   {"label": "Сельхозтехника",             "surcharge": 1.30},
}

# ─── РЖД тарифные зоны (расстояние км → ₽/т·100км) ──────────────────────────
# Источник: РЖД Прейскурант 10-01, тарифная составляющая на зерновые грузы
RZD_TARIFF_ZONES = [
    (500,  320),   # до 500 км
    (1000, 280),   # 501–1000 км
    (2000, 240),   # 1001–2000 км
    (5000, 200),   # 2001–5000 км
]
RZD_BASE_FEE = 8500       # вагонная составляющая (₽/вагон)
RZD_WAGON_CAPACITY = 60   # тонн в вагоне

# Коэффициенты груза для РЖД (Приложение 5, кл. груза)
RZD_CARGO_COEFF = {
    "grain":      1.00,
    "sunflower":  1.05,
    "corn":       1.02,
    "oilseed":    1.05,
    "sugar_beet": 1.08,
    "vegetables": 1.15,
    "fertilizer": 1.10,
    "equipment":  1.25,
}

# ─── Транзитные дни ───────────────────────────────────────────────────────────
def transit_days_truck(km: float) -> int:
    return max(1, int(km // 600))

def transit_days_rail(km: float) -> int:
    return max(3, int(km // 350) + 2)

def transit_days_ship(km: float) -> int:
    return max(5, int(km // 200) + 3)

# ─── Вспомогательные функции ──────────────────────────────────────────────────

def haversine(lat1, lon1, lat2, lon2) -> float:
    """Расстояние по формуле Haversine (км), умноженное на 1.3 для учёта дорог."""
    R = 6371.0
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    a = math.sin(dlat/2)**2 + math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(dlon/2)**2
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1-a))
    road_factor = 1.30
    return round(R * c * road_factor, 1)

def calculate_cost(distance_km: float, weight_tons: float, vehicle_type: str, cargo_type: str) -> dict:
    veh = VEHICLE_TYPES.get(vehicle_type, VEHICLE_TYPES["truck_20t"])
    crg = CARGO_TYPES.get(cargo_type, CARGO_TYPES["grain"])

    trips_needed = math.ceil(weight_tons / veh["capacity"])
    cost_per_trip = veh["base"] + distance_km * veh["rate_per_km"]
    total_cost = cost_per_trip * trips_needed * crg["surcharge"]
    cost_per_ton = total_cost / weight_tons if weight_tons > 0 else 0

    return {
        "distance_km": distance_km,
        "weight_tons": weight_tons,
        "vehicle_type": vehicle_type,
        "vehicle_label": veh["label"],
        "cargo_type": cargo_type,
        "cargo_label": crg["label"],
        "trips_needed": trips_needed,
        "cost_per_trip": round(cost_per_trip * crg["surcharge"], 2),
        "total_cost": round(total_cost, 2),
        "cost_per_ton": round(cost_per_ton, 2),
        "cost_per_tkm": round(cost_per_ton / distance_km * 1000, 4) if distance_km > 0 else 0,
    }

def rzd_cost(distance_km: float, weight_tons: float, cargo_type: str) -> float:
    """РЖД тариф по дистанционным зонам (Прейскурант 10-01)."""
    zone_rate = RZD_TARIFF_ZONES[-1][1]
    for max_km, rate in RZD_TARIFF_ZONES:
        if distance_km <= max_km:
            zone_rate = rate
            break
    cargo_coeff = RZD_CARGO_COEFF.get(cargo_type, 1.0)
    wagons = math.ceil(weight_tons / RZD_WAGON_CAPACITY)
    # Стоимость = зонный тариф × расстояние / 1000 × вес × коэфф. груза + вагонная составляющая
    freight = zone_rate * distance_km / 1000.0 * weight_tons * cargo_coeff
    total = freight + RZD_BASE_FEE * wagons
    return round(total, 2)

def compare_transport(distance_km: float, weight_tons: float, cargo_type: str) -> list:
    """Возвращает список вариантов транспорта отсортированный по стоимости."""
    crg = CARGO_TYPES.get(cargo_type, CARGO_TYPES["grain"])
    cargo_label = crg["label"]
    options = []

    # ── Автомобиль 20т (фура) ─────────────────────────────────────────────
    truck20 = calculate_cost(distance_km, weight_tons, "truck_20t", cargo_type)
    options.append({
        "mode":         "Автомобиль · Фура 20 т",
        "vehicle_key":  "truck_20t",
        "icon":         "Truck",
        "cost":         truck20["total_cost"],
        "cost_per_ton": round(truck20["cost_per_ton"], 0),
        "days":         transit_days_truck(distance_km),
        "trips":        truck20["trips_needed"],
        "pros":         "Дверь в дверь, гибкий маршрут",
        "cons":         "Дороже ж/д на длинных плечах",
    })

    # ── Зерновоз 40т ─────────────────────────────────────────────────────
    truck40 = calculate_cost(distance_km, weight_tons, "truck_40t", cargo_type)
    options.append({
        "mode":         "Автомобиль · Зерновоз 40 т",
        "vehicle_key":  "truck_40t",
        "icon":         "Truck",
        "cost":         truck40["total_cost"],
        "cost_per_ton": round(truck40["cost_per_ton"], 0),
        "days":         transit_days_truck(distance_km),
        "trips":        truck40["trips_needed"],
        "pros":         "Меньше рейсов, высокая вместимость",
        "cons":         "Нужны весовые коридоры",
    })

    # ── РЖД (вагон, тариф 10-01) ─────────────────────────────────────────
    rail_total = rzd_cost(distance_km, weight_tons, cargo_type)
    rail_cpu   = round(rail_total / weight_tons, 0) if weight_tons > 0 else 0
    wagons     = math.ceil(weight_tons / RZD_WAGON_CAPACITY)
    options.append({
        "mode":         "Железная дорога · РЖД",
        "vehicle_key":  "rail",
        "icon":         "Train",
        "cost":         rail_total,
        "cost_per_ton": rail_cpu,
        "days":         transit_days_rail(distance_km),
        "trips":        wagons,
        "pros":         "Выгодно от 500 км, высокая надёжность",
        "cons":         "Нужен элеватор / ж/д ветка",
    })

    # ── Речная баржа ─────────────────────────────────────────────────────
    ship = calculate_cost(distance_km, weight_tons, "bulk_ship", cargo_type)
    options.append({
        "mode":         "Речной транспорт · Баржа",
        "vehicle_key":  "bulk_ship",
        "icon":         "Ship",
        "cost":         ship["total_cost"],
        "cost_per_ton": round(ship["cost_per_ton"], 0),
        "days":         transit_days_ship(distance_km),
        "trips":        ship["trips_needed"],
        "pros":         "Самый низкий тариф ₽/т",
        "cons":         "Сезонно (апр–окт), не везде",
    })

    # Сортируем по стоимости
    options.sort(key=lambda x: x["cost"])

    # Добавляем экономию относительно самого дорогого
    max_cost = max(o["cost"] for o in options)
    cheapest_cost = options[0]["cost"]
    for o in options:
        if o["cost"] == cheapest_cost and max_cost > cheapest_cost:
            saving_pct = round((max_cost - cheapest_cost) / max_cost * 100)
            o["savings_badge"] = f"Экономия {saving_pct}% vs авто"
        else:
            o["savings_badge"] = None

    return options

def get_recommendation(distance_km: float, vehicle_type: str) -> str:
    """Краткая рекомендация по выбору транспорта."""
    if distance_km > 1500:
        return "Рекомендуется ЖД (РЖД): плечо > 1 500 км — тариф на 40–60% ниже автомобиля"
    if distance_km > 800:
        return "Рассмотрите ЖД: расстояние > 800 км делает железную дорогу экономически выгоднее"
    if distance_km > 400 and vehicle_type in ("truck_5t", "truck_10t"):
        return "При объёме > 20 т на плечо > 400 км выгоднее перейти на зерновоз 40 т или ЖД"
    return "Автомобиль оптимален: короткое плечо и гибкость доставки важнее тарифа"

def get_user_from_token(token: str) -> dict | None:
    import hashlib, hmac, base64
    JWT_SECRET = os.environ.get("JWT_SECRET", "fallback-secret-32chars-minimum!")
    try:
        parts = token.split(".")
        if len(parts) != 3:
            return None
        header, body, sig = parts
        expected = base64.urlsafe_b64encode(
            hmac.new(JWT_SECRET.encode(), f"{header}.{body}".encode(), hashlib.sha256).digest()
        ).rstrip(b"=").decode()
        if not hmac.compare_digest(sig, expected):
            return None
        from datetime import datetime, timezone
        payload = json.loads(base64.urlsafe_b64decode(body + "=="))
        if payload.get("exp", 0) < datetime.now(timezone.utc).timestamp():
            return None
        return payload
    except Exception:
        return None

def get_user_id(event: dict) -> int | None:
    auth = event.get("headers", {}).get("X-Authorization", "") or event.get("headers", {}).get("Authorization", "")
    if auth.startswith("Bearer "):
        payload = get_user_from_token(auth[7:])
        if payload:
            return payload.get("user_id")
    return None

# ─── Handler ──────────────────────────────────────────────────────────────────

def handler(event: dict, context) -> dict:
    """Логистика: расчёт расстояния и стоимости доставки сельхозпродукции."""
    if event.get("httpMethod") == "OPTIONS":
        return {"statusCode": 200, "headers": CORS, "body": ""}

    action = event.get("queryStringParameters", {}).get("action", "")
    body = {}
    if event.get("body"):
        try:
            body = json.loads(event["body"])
        except Exception:
            pass

    # action may also come from POST body
    if not action:
        action = body.get("action", "")

    # ── Список городов ────────────────────────────────────────────────────────
    if action == "cities_list":
        return ok({"cities": CITIES, "vehicle_types": VEHICLE_TYPES, "cargo_types": CARGO_TYPES})

    # ── Расчёт маршрута ───────────────────────────────────────────────────────
    if action == "calculate":
        from_city    = body.get("from_city", "")
        to_city      = body.get("to_city", "")
        weight_tons  = float(body.get("weight_tons", 20))
        vehicle_type = body.get("vehicle_type", "truck_20t")
        cargo_type   = body.get("cargo_type", "grain")

        from_lat = body.get("from_lat")
        from_lon = body.get("from_lon")
        to_lat   = body.get("to_lat")
        to_lon   = body.get("to_lon")

        if from_lat is not None and from_lon is not None and to_lat is not None and to_lon is not None:
            lat1, lon1 = float(from_lat), float(from_lon)
            lat2, lon2 = float(to_lat),   float(to_lon)
            from_region = body.get("from_region", "")
            to_region   = body.get("to_region", "")
        else:
            c1 = CITY_MAP.get(from_city)
            c2 = CITY_MAP.get(to_city)
            if not c1:
                return err(f"Город отправления не найден: {from_city}")
            if not c2:
                return err(f"Город назначения не найден: {to_city}")
            lat1, lon1 = c1["lat"], c1["lon"]
            lat2, lon2 = c2["lat"], c2["lon"]
            from_region = c1["region"]
            to_region   = c2["region"]

        if from_city == to_city and from_city:
            return err("Пункты отправления и назначения совпадают")

        distance = haversine(lat1, lon1, lat2, lon2)
        result   = calculate_cost(distance, weight_tons, vehicle_type, cargo_type)
        result["from_city"]   = from_city
        result["to_city"]     = to_city
        result["from_lat"]    = lat1
        result["from_lon"]    = lon1
        result["to_lat"]      = lat2
        result["to_lon"]      = lon2
        result["from_region"] = from_region
        result["to_region"]   = to_region
        result["transit_days"] = (
            transit_days_truck(distance) if vehicle_type.startswith("truck") else
            transit_days_rail(distance)  if vehicle_type == "rail" else
            transit_days_ship(distance)
        )
        result["recommendation"] = get_recommendation(distance, vehicle_type)

        # Старые альтернативы (совместимость)
        alternatives = []
        for vtype in VEHICLE_TYPES:
            if vtype != vehicle_type:
                alt = calculate_cost(distance, weight_tons, vtype, cargo_type)
                alternatives.append({
                    "vehicle_type": vtype,
                    "label":        VEHICLE_TYPES[vtype]["label"],
                    "total_cost":   alt["total_cost"],
                    "cost_per_ton": alt["cost_per_ton"],
                    "trips_needed": alt["trips_needed"],
                })
        alternatives.sort(key=lambda x: x["total_cost"])
        result["alternatives"] = alternatives

        return ok(result)

    # ── Сравнение видов транспорта ────────────────────────────────────────────
    if action == "compare_transport":
        from_city    = body.get("from_city", "")
        to_city      = body.get("to_city", "")
        weight_tons  = float(body.get("weight_tons", 20))
        cargo_type   = body.get("cargo_type", "grain")

        from_lat = body.get("from_lat")
        from_lon = body.get("from_lon")
        to_lat   = body.get("to_lat")
        to_lon   = body.get("to_lon")

        if from_lat is not None and from_lon is not None and to_lat is not None and to_lon is not None:
            lat1, lon1 = float(from_lat), float(from_lon)
            lat2, lon2 = float(to_lat),   float(to_lon)
        else:
            c1 = CITY_MAP.get(from_city)
            c2 = CITY_MAP.get(to_city)
            if not c1 or not c2:
                return err("Не удалось определить координаты городов")
            lat1, lon1 = c1["lat"], c1["lon"]
            lat2, lon2 = c2["lat"], c2["lon"]

        distance = haversine(lat1, lon1, lat2, lon2)
        options  = compare_transport(distance, weight_tons, cargo_type)
        rec      = get_recommendation(distance, "truck_20t")

        return ok({
            "distance_km":    distance,
            "weight_tons":    weight_tons,
            "cargo_type":     cargo_type,
            "options":        options,
            "recommendation": rec,
        })

    # ── Сохранить маршрут ─────────────────────────────────────────────────────
    if action == "routes_save":
        user_id      = get_user_id(event)
        from_city    = body.get("from_city", "")
        to_city      = body.get("to_city", "")
        distance_km  = float(body.get("distance_km", 0))
        cargo_type   = body.get("cargo_type", "grain")
        weight_tons  = float(body.get("weight_tons", 0))
        vehicle_type = body.get("vehicle_type", "truck_20t")
        cost_estimate = float(body.get("cost_estimate", 0))
        cost_per_ton  = float(body.get("cost_per_ton", 0))
        notes         = body.get("notes", "")

        if not from_city or not to_city:
            return err("Укажите города отправления и назначения")

        conn = get_db()
        cur  = conn.cursor()
        cur.execute(
            f"""INSERT INTO {SCHEMA}.logistics_routes
                (user_id, from_city, to_city, distance_km, cargo_type, weight_tons,
                 vehicle_type, cost_estimate, cost_per_ton, notes)
                VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s) RETURNING id""",
            (user_id, from_city, to_city, distance_km, cargo_type, weight_tons,
             vehicle_type, cost_estimate, cost_per_ton, notes)
        )
        route_id = cur.fetchone()[0]
        conn.close()
        return ok({"id": route_id, "message": "Маршрут сохранён"})

    # ── Список маршрутов ──────────────────────────────────────────────────────
    if action == "routes_list":
        user_id = get_user_id(event)
        conn    = get_db()
        cur     = conn.cursor()
        if user_id:
            cur.execute(
                f"""SELECT id, from_city, to_city, distance_km, cargo_type,
                           weight_tons, vehicle_type, cost_estimate, cost_per_ton, status, notes, created_at
                    FROM {SCHEMA}.logistics_routes WHERE user_id=%s ORDER BY created_at DESC LIMIT 50""",
                (user_id,)
            )
        else:
            cur.execute(
                f"""SELECT id, from_city, to_city, distance_km, cargo_type,
                           weight_tons, vehicle_type, cost_estimate, cost_per_ton, status, notes, created_at
                    FROM {SCHEMA}.logistics_routes ORDER BY created_at DESC LIMIT 20"""
            )
        cols = ["id","from_city","to_city","distance_km","cargo_type","weight_tons",
                "vehicle_type","cost_estimate","cost_per_ton","status","notes","created_at"]
        rows = [dict(zip(cols, r)) for r in cur.fetchall()]
        conn.close()
        return ok({"routes": rows})

    return err("Неизвестный action", 404)
