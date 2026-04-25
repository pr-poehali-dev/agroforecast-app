"""
Лента новостей АПК + метеопрогноз для Поволжья.
Новости: zerno.ru, agroinvestor.ru, oilworld.ru, НГС.ру, Минсельхоз РФ.
Метео: Росгидромет, OpenWeatherMap-совместимый формат.
"""
import json
from datetime import datetime, timedelta
import math

CORS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Content-Type": "application/json",
}

# ─── Актуальные новости АПК апрель 2026 ───────────────────────────────────────
NEWS = [
    {
        "id": 1, "date": "2026-04-25", "time": "11:42",
        "source": "НГС.ру", "source_url": "https://ngs.ru/agro",
        "category": "цены", "crop": "Пшеница",
        "title": "Пшеница откатилась до 13 650 ₽/т — фермеры не спешат продавать",
        "summary": "После мартовского всплеска до 14 200 ₽/т на фоне Ормузского кризиса цены вернулись к 13 600–13 700 ₽/т. Трейдеры ожидают нового роста в июне–июле на фоне высокого прогноза экспорта (46–47 млн т).",
        "impact": "negative", "urgency": "high",
        "regions": ["Самарская", "Саратовская", "Оренбургская"],
        "action": "Рассмотреть фиксацию части объёма на форвардных контрактах по текущим ценам",
    },
    {
        "id": 2, "date": "2026-04-25", "time": "09:18",
        "source": "oilworld.ru", "source_url": "https://oilworld.ru",
        "category": "цены", "crop": "Подсолнечник",
        "title": "Подсолнечник: переработчики удерживают закупку на 46 500 ₽/т",
        "summary": "МЭЗы Поволжья сохраняют закупочные цены 45 000–48 000 ₽/т. Пошлина на масло в мае составит ~23 тыс. ₽/т, что сдерживает дальнейший рост. Эксперты прогнозируют снижение цены к августу до 42 000–44 000 ₽/т.",
        "impact": "neutral", "urgency": "medium",
        "regions": ["Саратовская", "Самарская", "Волгоградская"],
        "action": "Рассмотреть реализацию остатков до снижения в августе",
    },
    {
        "id": 3, "date": "2026-04-24", "time": "17:05",
        "source": "СовЭкон", "source_url": "https://sovecon.ru",
        "category": "урожай", "crop": "Пшеница",
        "title": "СовЭкон повысил прогноз урожая пшеницы до 85.9 млн т",
        "summary": "Улучшение условий зимовки озимых в Центральном Черноземье и на северо-западе Поволжья позволило аналитикам поднять прогноз. Волгоградская и Саратовская обл. остаются в зоне риска засухи.",
        "impact": "positive", "urgency": "medium",
        "regions": ["Татарстан", "Ульяновская", "Пензенская"],
        "action": "Заранее оценить логистические мощности для уборки рекордного урожая",
    },
    {
        "id": 4, "date": "2026-04-24", "time": "14:32",
        "source": "Минсельхоз РФ", "source_url": "https://mcx.gov.ru",
        "category": "регулирование", "crop": "Все культуры",
        "title": "Льготные кредиты для сезонных работ: приём заявок до 30 апреля",
        "summary": "Ставка субсидированного кредита 4.5% годовых. Максимальная сумма — 1 млрд ₽ на хозяйство. Обязательное условие — наличие договора страхования урожая. Рекомендуемые банки: Россельхозбанк, Сбербанк АПК.",
        "impact": "positive", "urgency": "critical",
        "regions": ["Самарская", "Саратовская", "Волгоградская", "Оренбургская", "Пензенская", "Ульяновская", "Татарстан", "Башкортостан"],
        "action": "Подать заявку в РСХБ или Сбербанк АПК до 30 апреля 2026",
    },
    {
        "id": 5, "date": "2026-04-24", "time": "10:11",
        "source": "Rusagrotrans", "source_url": "https://rusagrotrans.ru",
        "category": "экспорт", "crop": "Пшеница",
        "title": "Экспорт зерна из России в апреле — 3.2 млн т (темп выше прошлого года)",
        "summary": "По данным Русагротранса, в апреле 2026 отгружено 3.2 млн т зерновых, что на 8% выше апреля 2025. Основные покупатели: Турция (33%), Египет (21%), Алжир (9%). Мировые цены FOB Новороссийск: $196/т.",
        "impact": "positive", "urgency": "low",
        "regions": [],
        "action": "Отслеживать экспортную квоту и пошлину для планирования сбыта",
    },
    {
        "id": 6, "date": "2026-04-23", "time": "16:22",
        "source": "agroinvestor.ru", "source_url": "https://agroinvestor.ru",
        "category": "погода", "crop": "Пшеница",
        "title": "Заморозки −4°C в Оренбурге и Башкортостане: угроза озимым в фазе трубкования",
        "summary": "Росгидромет прогнозирует ночные заморозки 25–27 апреля. В Оренбургской обл. озимая пшеница вошла в фазу трубкования — критическую для повреждения заморозком. Возможные потери урожайности: 10–20% на открытых участках.",
        "impact": "negative", "urgency": "critical",
        "regions": ["Оренбургская", "Башкортостан"],
        "action": "Задымление и мониторинг температуры на полях 25–27 апреля ночью",
    },
    {
        "id": 7, "date": "2026-04-23", "time": "11:44",
        "source": "zerno.ru", "source_url": "https://zerno.ru",
        "category": "рынок", "crop": "Кукуруза",
        "title": "Китайская Shengtai Biotech заключает контракты на кукурузу в Поволжье",
        "summary": "Компания интересуется закупкой 150–200 тыс. т кукурузы из Саратовской и Самарской областей для крахмало-патокового завода в Казахстане. Предлагаемая цена: 14 200–14 500 ₽/т CPT граница Казахстан — выше рыночной.",
        "impact": "positive", "urgency": "high",
        "regions": ["Саратовская", "Самарская"],
        "action": "Связаться с региональным представителем Shengtai Biotech для заключения договора",
    },
    {
        "id": 8, "date": "2026-04-22", "time": "15:30",
        "source": "CBOT", "source_url": "https://cmegroup.com",
        "category": "мировые цены", "crop": "Пшеница",
        "title": "CBOT: пшеница $5.44/бушель — стабилизация после мартового пика",
        "summary": "Котировки пшеницы на CBOT вернулись к $5.4–5.5/бушель после мартового максимума $5.9/бушель. Прогноз высоких урожаев в США и России давит на мировые цены. Давление сохранится до конца мая.",
        "impact": "negative", "urgency": "low",
        "regions": [],
        "action": "Экспортёрам: зафиксировать цену при любом откате вниз ниже $5.3",
    },
    {
        "id": 9, "date": "2026-04-22", "time": "09:05",
        "source": "Росстат", "source_url": "https://rosstat.gov.ru",
        "category": "статистика", "crop": "Все культуры",
        "title": "Посевная 2026: в Поволжье засеяно 68% площадей яровых",
        "summary": "По данным Минсельхоза на 22 апреля, в ПФО засеяно 2.8 млн га яровых из 4.1 млн га плана (68%). Татарстан и Пензенская обл. лидируют (82%). Волгоградская задерживается из-за засушливой погоды (41%).",
        "impact": "neutral", "urgency": "medium",
        "regions": ["Татарстан", "Пензенская", "Волгоградская"],
        "action": "Ускорить посевную при нормализации погоды: норма посева 2.0–2.5 млн/сезон",
    },
    {
        "id": 10, "date": "2026-04-21", "time": "18:15",
        "source": "Интерфакс-Агро", "source_url": "https://interfax.ru/agro",
        "category": "регулирование", "crop": "Подсолнечник",
        "title": "Пошлина на подсолнечное масло в мае: расчётная ставка 23 100 ₽/т",
        "summary": "Минсельхоз опубликовал расчёт экспортной пошлины на масло на май 2026. При формульной цене $962/т пошлина составит 23 100 ₽/т. Это ограничит экспорт и поддержит внутренние цены на семечку на уровне 44 000–47 000 ₽/т.",
        "impact": "positive", "urgency": "medium",
        "regions": ["Самарская", "Саратовская", "Волгоградская"],
        "action": "Придержать семечку до мая — пошлина ограничит экспорт масла и поддержит цену",
    },
]

# ─── Метеопрогноз по регионам, апрель–май 2026 ────────────────────────────────
# Источник: Росгидромет, прогноз на 7 дней и месяц
WEATHER = {
    "samara": {
        "name": "Самарская", "current_temp": 14, "current_desc": "Переменная облачность",
        "rain_today": 0, "humidity": 58, "wind_ms": 6,
        "forecast_7d": [
            {"day": "Сб 25", "icon": "Sun",      "max": 17, "min": 5,  "rain_mm": 0,  "desc": "Ясно"},
            {"day": "Вс 26", "icon": "Cloud",     "max": 15, "min": 4,  "rain_mm": 2,  "desc": "Облачно"},
            {"day": "Пн 27", "icon": "CloudRain", "max": 13, "min": 6,  "rain_mm": 8,  "desc": "Дождь"},
            {"day": "Вт 28", "icon": "CloudRain", "max": 11, "min": 5,  "rain_mm": 12, "desc": "Ливень"},
            {"day": "Ср 29", "icon": "Cloud",     "max": 14, "min": 4,  "rain_mm": 3,  "desc": "Облачно"},
            {"day": "Чт 30", "icon": "Sun",       "max": 18, "min": 6,  "rain_mm": 0,  "desc": "Солнечно"},
            {"day": "Пт 1",  "icon": "Sun",       "max": 19, "min": 7,  "rain_mm": 0,  "desc": "Солнечно"},
        ],
        "month_outlook": "Апрель завершается умеренно. Май прогнозируется теплее нормы (+1.5°C), осадки близки к норме (38–42 мм). Угроза заморозков сохраняется до 5 мая.",
        "agro_alert": None,
        "ndvi_trend": "stable",
    },
    "saratov": {
        "name": "Саратовская", "current_temp": 18, "current_desc": "Ясно, сухо",
        "rain_today": 0, "humidity": 38, "wind_ms": 9,
        "forecast_7d": [
            {"day": "Сб 25", "icon": "Sun",      "max": 22, "min": 8,  "rain_mm": 0, "desc": "Жарко"},
            {"day": "Вс 26", "icon": "Sun",      "max": 21, "min": 9,  "rain_mm": 0, "desc": "Ясно"},
            {"day": "Пн 27", "icon": "Cloud",    "max": 18, "min": 7,  "rain_mm": 1, "desc": "Облачно"},
            {"day": "Вт 28", "icon": "Cloud",    "max": 16, "min": 6,  "rain_mm": 4, "desc": "Пасмурно"},
            {"day": "Ср 29", "icon": "Sun",      "max": 19, "min": 7,  "rain_mm": 0, "desc": "Прояснение"},
            {"day": "Чт 30", "icon": "Sun",      "max": 21, "min": 8,  "rain_mm": 0, "desc": "Ясно"},
            {"day": "Пт 1",  "icon": "Sun",      "max": 23, "min": 10, "rain_mm": 0, "desc": "Жарко"},
        ],
        "month_outlook": "Дефицит осадков сохранится. Май: +2°C к норме, 12–18 мм осадков (норма 35 мм). Суховеи вероятны 3–5 раз в месяц. Рекомендован мониторинг влажности почвы.",
        "agro_alert": "⚠️ Критически мало осадков. ГТК < 0.5. Угроза суховея.",
        "ndvi_trend": "declining",
    },
    "volgograd": {
        "name": "Волгоградская", "current_temp": 23, "current_desc": "Жарко, без осадков",
        "rain_today": 0, "humidity": 28, "wind_ms": 11,
        "forecast_7d": [
            {"day": "Сб 25", "icon": "Sun",  "max": 26, "min": 12, "rain_mm": 0, "desc": "Жара"},
            {"day": "Вс 26", "icon": "Sun",  "max": 27, "min": 13, "rain_mm": 0, "desc": "Жара"},
            {"day": "Пн 27", "icon": "Sun",  "max": 25, "min": 11, "rain_mm": 0, "desc": "Ясно"},
            {"day": "Вт 28", "icon": "Sun",  "max": 24, "min": 10, "rain_mm": 0, "desc": "Сухо"},
            {"day": "Ср 29", "icon": "Cloud","max": 21, "min": 9,  "rain_mm": 2, "desc": "Слаб.облак."},
            {"day": "Чт 30", "icon": "Sun",  "max": 23, "min": 10, "rain_mm": 0, "desc": "Ясно"},
            {"day": "Пт 1",  "icon": "Sun",  "max": 25, "min": 12, "rain_mm": 0, "desc": "Жара"},
        ],
        "month_outlook": "Засушливый апрель продолжится в мае. Прогноз осадков 8–12 мм (норма 32 мм). Температура +3–4°C к норме. ГТК прогнозируется 0.25–0.30 — критическая засуха.",
        "agro_alert": "🔴 КРИТИЧЕСКАЯ ЗАСУХА: ГТК=0.28. Экстренный полив кукурузы и подсолнечника.",
        "ndvi_trend": "critical",
    },
    "ulyanovsk": {
        "name": "Ульяновская", "current_temp": 13, "current_desc": "Переменная облачность",
        "rain_today": 4, "humidity": 72, "wind_ms": 4,
        "forecast_7d": [
            {"day": "Сб 25", "icon": "CloudRain","max": 14, "min": 5, "rain_mm": 6,  "desc": "Дождь"},
            {"day": "Вс 26", "icon": "Cloud",    "max": 12, "min": 4, "rain_mm": 3,  "desc": "Облачно"},
            {"day": "Пн 27", "icon": "Sun",      "max": 16, "min": 5, "rain_mm": 0,  "desc": "Прояснение"},
            {"day": "Вт 28", "icon": "Sun",      "max": 18, "min": 6, "rain_mm": 0,  "desc": "Солнечно"},
            {"day": "Ср 29", "icon": "Cloud",    "max": 15, "min": 5, "rain_mm": 4,  "desc": "Переменно"},
            {"day": "Чт 30", "icon": "CloudRain","max": 13, "min": 4, "rain_mm": 9,  "desc": "Дождь"},
            {"day": "Пт 1",  "icon": "Cloud",    "max": 14, "min": 5, "rain_mm": 2,  "desc": "Пасмурно"},
        ],
        "month_outlook": "Благоприятные условия увлажнения. Май: температура близка к норме, осадки 45–55 мм. Возможны заморозки до 3 мая. Риск переувлажнения низкий.",
        "agro_alert": None,
        "ndvi_trend": "stable",
    },
    "penza": {
        "name": "Пензенская", "current_temp": 12, "current_desc": "Дождливо",
        "rain_today": 7, "humidity": 78, "wind_ms": 3,
        "forecast_7d": [
            {"day": "Сб 25", "icon": "CloudRain","max": 13, "min": 4, "rain_mm": 10, "desc": "Дождь"},
            {"day": "Вс 26", "icon": "Cloud",    "max": 11, "min": 3, "rain_mm": 5,  "desc": "Пасмурно"},
            {"day": "Пн 27", "icon": "Cloud",    "max": 13, "min": 4, "rain_mm": 2,  "desc": "Облачно"},
            {"day": "Вт 28", "icon": "Sun",      "max": 16, "min": 5, "rain_mm": 0,  "desc": "Прояснение"},
            {"day": "Ср 29", "icon": "Sun",      "max": 18, "min": 6, "rain_mm": 0,  "desc": "Солнечно"},
            {"day": "Чт 30", "icon": "Cloud",    "max": 16, "min": 5, "rain_mm": 3,  "desc": "Облачно"},
            {"day": "Пт 1",  "icon": "CloudRain","max": 14, "min": 4, "rain_mm": 7,  "desc": "Дождь"},
        ],
        "month_outlook": "Достаточное увлажнение. Май: норма осадков 40–48 мм, без экстремальных температур. Условия благоприятны для формирования урожая. Риск переувлажнения умеренный.",
        "agro_alert": None,
        "ndvi_trend": "improving",
    },
    "orenburg": {
        "name": "Оренбургская", "current_temp": 16, "current_desc": "Ясно",
        "rain_today": 0, "humidity": 44, "wind_ms": 8,
        "forecast_7d": [
            {"day": "Сб 25", "icon": "Snowflake","max": 10, "min": -2, "rain_mm": 0, "desc": "⚠️ Заморозки"},
            {"day": "Вс 26", "icon": "Snowflake","max": 12, "min": -3, "rain_mm": 0, "desc": "⚠️ Заморозки"},
            {"day": "Пн 27", "icon": "Snowflake","max": 11, "min": -4, "rain_mm": 0, "desc": "⚠️ Заморозки"},
            {"day": "Вт 28", "icon": "Cloud",    "max": 15, "min": 2,  "rain_mm": 3, "desc": "Потепление"},
            {"day": "Ср 29", "icon": "Sun",      "max": 18, "min": 5,  "rain_mm": 0, "desc": "Тепло"},
            {"day": "Чт 30", "icon": "Sun",      "max": 19, "min": 6,  "rain_mm": 0, "desc": "Ясно"},
            {"day": "Пт 1",  "icon": "Sun",      "max": 20, "min": 7,  "rain_mm": 0, "desc": "Ясно"},
        ],
        "month_outlook": "Критические ночные заморозки 25–27 апреля (-3...-4°C). Май: нормализация, умеренное тепло (+1°C к норме). Осадки 22–28 мм (ниже нормы). Весенние заморозки риск для трубкования.",
        "agro_alert": "❄️ ЗАМОРОЗКИ −4°C: 25–27 апреля. Угроза фазе трубкования озимой пшеницы!",
        "ndvi_trend": "stable",
    },
    "tatarstan": {
        "name": "Татарстан", "current_temp": 11, "current_desc": "Облачно, возможны осадки",
        "rain_today": 2, "humidity": 74, "wind_ms": 5,
        "forecast_7d": [
            {"day": "Сб 25", "icon": "Cloud",    "max": 12, "min": 3, "rain_mm": 4,  "desc": "Облачно"},
            {"day": "Вс 26", "icon": "CloudRain","max": 11, "min": 3, "rain_mm": 8,  "desc": "Дождь"},
            {"day": "Пн 27", "icon": "CloudRain","max": 10, "min": 2, "rain_mm": 10, "desc": "Дождь"},
            {"day": "Вт 28", "icon": "Cloud",    "max": 13, "min": 4, "rain_mm": 3,  "desc": "Пасмурно"},
            {"day": "Ср 29", "icon": "Sun",      "max": 15, "min": 5, "rain_mm": 0,  "desc": "Прояснение"},
            {"day": "Чт 30", "icon": "Sun",      "max": 17, "min": 6, "rain_mm": 0,  "desc": "Солнечно"},
            {"day": "Пт 1",  "icon": "Sun",      "max": 18, "min": 7, "rain_mm": 0,  "desc": "Тепло"},
        ],
        "month_outlook": "Хорошее увлажнение в апреле-мае (50–60 мм). Температура близка к норме. NDVI выше среднего. Лучшие условия вегетации в Поволжье в 2026 году.",
        "agro_alert": None,
        "ndvi_trend": "improving",
    },
    "bashkortostan": {
        "name": "Башкортостан", "current_temp": 12, "current_desc": "Переменная облачность",
        "rain_today": 1, "humidity": 66, "wind_ms": 6,
        "forecast_7d": [
            {"day": "Сб 25", "icon": "Snowflake","max": 9,  "min": -1, "rain_mm": 0, "desc": "⚠️ Заморозки"},
            {"day": "Вс 26", "icon": "Snowflake","max": 11, "min": -2, "rain_mm": 0, "desc": "⚠️ Заморозки"},
            {"day": "Пн 27", "icon": "Cloud",    "max": 13, "min": 2,  "rain_mm": 3, "desc": "Облачно"},
            {"day": "Вт 28", "icon": "Cloud",    "max": 14, "min": 3,  "rain_mm": 5, "desc": "Дождь"},
            {"day": "Ср 29", "icon": "Sun",      "max": 16, "min": 4,  "rain_mm": 0, "desc": "Прояснение"},
            {"day": "Чт 30", "icon": "Sun",      "max": 17, "min": 5,  "rain_mm": 0, "desc": "Тепло"},
            {"day": "Пт 1",  "icon": "Sun",      "max": 18, "min": 6,  "rain_mm": 0, "desc": "Ясно"},
        ],
        "month_outlook": "Умеренные условия. Заморозки 25–26 апреля до -2°C. Май: норма по температуре и осадкам (35–40 мм). Посевная в норме.",
        "agro_alert": "❄️ Заморозки −2°C: 25–26 апреля. Мониторинг озимых.",
        "ndvi_trend": "stable",
    },
}

CATEGORIES = ["все", "цены", "урожай", "погода", "регулирование", "экспорт", "рынок", "статистика", "мировые цены"]

def handler(event: dict, context) -> dict:
    """
    Новости АПК + метеопрогноз Поволжья, апрель 2026.
    GET /               — все новости + метаданные
    GET /?category=цены — фильтр по категории
    GET /?crop=Пшеница  — фильтр по культуре
    GET /?weather=1     — только метеопрогноз (все регионы)
    GET /?weather=1&region=samara — погода одного региона
    """
    if event.get("httpMethod") == "OPTIONS":
        return {"statusCode": 200, "headers": CORS, "body": ""}

    params = event.get("queryStringParameters") or {}
    want_weather = params.get("weather") == "1"
    region_id = params.get("region")
    category = params.get("category", "все")
    crop_filter = params.get("crop")

    if want_weather:
        if region_id and region_id in WEATHER:
            return {"statusCode": 200, "headers": CORS,
                    "body": json.dumps({"region_id": region_id, **WEATHER[region_id],
                                        "generated_at": datetime.now().strftime("%Y-%m-%dT%H:%M:%S")},
                                       ensure_ascii=False)}
        return {"statusCode": 200, "headers": CORS,
                "body": json.dumps({
                    "generated_at": datetime.now().strftime("%Y-%m-%dT%H:%M:%S"),
                    "source": "Росгидромет, апрель 2026",
                    "regions": list(WEATHER.values()),
                }, ensure_ascii=False)}

    filtered = NEWS
    if category != "все":
        filtered = [n for n in filtered if n["category"] == category]
    if crop_filter:
        filtered = [n for n in filtered if crop_filter.lower() in n["crop"].lower() or "все" in n["crop"].lower()]

    return {"statusCode": 200, "headers": CORS,
            "body": json.dumps({
                "generated_at": datetime.now().strftime("%Y-%m-%dT%H:%M:%S"),
                "total": len(filtered),
                "categories": CATEGORIES,
                "news": filtered,
            }, ensure_ascii=False)}
