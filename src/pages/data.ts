export const NAV_ITEMS = [
  { id: "home", label: "Главная", icon: "LayoutDashboard" },
  { id: "forecasts", label: "Прогнозы цен", icon: "TrendingUp" },
  { id: "map", label: "Карта урожайности", icon: "Map" },
  { id: "supply", label: "Спрос и предложение", icon: "ArrowLeftRight" },
  { id: "risks", label: "Риски", icon: "ShieldAlert" },
  { id: "ndvi", label: "NDVI-мониторинг", icon: "Satellite" },
  { id: "ai-model", label: "AI‑модель", icon: "Brain" },
  { id: "analytics", label: "Аналитика", icon: "BarChart3" },
  { id: "business", label: "Бизнес-инструменты", icon: "Calculator" },
  { id: "alerts", label: "Уведомления", icon: "Bell" },
  { id: "integrations", label: "Интеграции", icon: "Plug" },
  { id: "pricing", label: "Тарифы", icon: "CreditCard" },
];

export const CROPS = ["Пшеница", "Подсолнечник", "Кукуруза", "Ячмень", "Рожь"];

// Цены НТБ/закупочные, Поволжье, апрель 2026 (без НДС ₽/т)
// Источник: НТБ, zerno.ru, agroinvestor.ru, НГС.ру 21.04.2026
// Пшеница 3кл CPT: 13 200–14 100 ₽/т (с учётом мартовского мини-всплеска и отката)
// Подсолнечник: ~44 000–50 000 ₽/т у.МЭЗ (ПроЗерно, апр 2026), Поволжье чуть ниже
// Кукуруза: ~13 800 ₽/т (внутренний рынок, Поволжье)
// Ячмень: ~12 200 ₽/т фуражный (тендер Турция-ТМО, апр 2026)
// Рожь: ~10 100 ₽/т (стабильный сегмент)
export const FORECAST_DATA = [
  { crop: "Пшеница озимая",  currentPrice: 13_650, forecastPrice: 14_800, change: +8.4,  confidence: 79, trend: "up",   yield: 29.4, yieldForecast: 31.2 },
  { crop: "Подсолнечник",    currentPrice: 46_500, forecastPrice: 43_200, change: -7.1,  confidence: 71, trend: "down", yield: 23.1, yieldForecast: 21.8 },
  { crop: "Кукуруза",        currentPrice: 13_800, forecastPrice: 14_600, change: +5.8,  confidence: 76, trend: "up",   yield: 56.8, yieldForecast: 59.4 },
  { crop: "Ячмень яровой",   currentPrice: 12_200, forecastPrice: 12_700, change: +4.1,  confidence: 84, trend: "up",   yield: 28.1, yieldForecast: 29.3 },
  { crop: "Рожь",            currentPrice: 10_100, forecastPrice:  9_750, change: -3.5,  confidence: 67, trend: "down", yield: 18.2, yieldForecast: 17.4 },
];

// Риски Поволжья весна 2026: ранняя засуха на юге, заморозки апреля в Оренбурге/Башкортостане
export const RISK_DATA = [
  { region: "Волгоградская обл.", risk: 81, type: "Засуха",          level: "critical", crop: "Кукуруза",     color: "#ef4444" },
  { region: "Самарская обл.",     risk: 63, type: "Засуха",          level: "high",     crop: "Пшеница",      color: "#f97316" },
  { region: "Саратовская обл.",   risk: 54, type: "Суховей",         level: "medium",   crop: "Подсолнечник", color: "#f59e0b" },
  { region: "Оренбургская обл.",  risk: 52, type: "Заморозки",       level: "medium",   crop: "Пшеница",      color: "#f59e0b" },
  { region: "Башкортостан",       risk: 39, type: "Заморозки",       level: "low",      crop: "Ячмень",       color: "#10b981" },
  { region: "Пензенская обл.",    risk: 22, type: "Переувлажнение",  level: "low",      crop: "Рожь",         color: "#10b981" },
];

// Актуальные события апрель 2026
// Источники: НГС.ру 21.04.2026, oilworld.ru, zerno.ru, Минсельхоз РФ
export const ALERTS = [
  { id: 1, type: "critical", title: "Ранняя засуха: ГТК < 0.3", desc: "Волгоградская обл. — гидротерм. коэффициент 0.28, критический минимум за 7 лет. Угроза посевам кукурузы", time: "6 мин назад", icon: "Flame" },
  { id: 2, type: "warning",  title: "Пшеница дешевеет после марта", desc: "НГС.ру 21.04.2026: цены откатились с мартового всплеска до 13–14 тыс. ₽/т. Фермеры фиксируют минимальную прибыль", time: "41 мин назад", icon: "TrendingDown" },
  { id: 3, type: "warning",  title: "Заморозки −4°C: 25–27 апреля", desc: "Оренбургская обл., Башкортостан — ночные заморозки угрожают озимым в фазе трубкования", time: "1 ч назад", icon: "Snowflake" },
  { id: 4, type: "warning",  title: "Подсолнечник: экспортная пошлина растёт", desc: "МасложировойСоюз: пошлина на масло в мае ~23 тыс. ₽/т. Закупочные цены на семечку под давлением", time: "2 ч назад", icon: "AlertTriangle" },
  { id: 5, type: "info",     title: "Урожай 2026: прогноз 85.9 млн т пшеницы", desc: "СовЭкон повысил прогноз урожая пшеницы в России до 85.9 млн т — максимум за 3 года", time: "4 ч назад", icon: "Wheat" },
  { id: 6, type: "info",     title: "Кукуруза в Китай: новый контракт", desc: "Китайская Shengtai Biotech заключает контракты на покупку кукурузы в Саратовской обл. для завода в Казахстане", time: "6 ч назад", icon: "Globe" },
  { id: 7, type: "info",     title: "Субсидии АПК 2026", desc: "Минсельхоз: льготный кредит для сезонных работ под 4.5% — заявки принимаются до 30 апреля 2026", time: "11 ч назад", icon: "CreditCard" },
];

// Данные регионов Поволжья апрель 2026
// NDVI по Sentinel-2 (весна 2026 — ранний старт вегетации на севере, стресс на юге)
// rain — осадки мм/месяц Росгидромет, temp — среднесуточная °C апрель 2026
export const MAP_REGIONS = [
  { id: "samara",        name: "Самарская",     x: 68, y: 35, risk: 63, area: 21, ndvi: 0.56, rain: 12, temp: 15, posevnaya: 1842, wheat_pct: 48, sun_pct: 22, corn_pct: 14 },
  { id: "saratov",       name: "Саратовская",   x: 52, y: 52, risk: 54, area: 34, ndvi: 0.49, rain:  7, temp: 18, posevnaya: 2310, wheat_pct: 52, sun_pct: 18, corn_pct: 11 },
  { id: "volgograd",     name: "Волгоградская", x: 50, y: 72, risk: 81, area: 28, ndvi: 0.33, rain:  3, temp: 23, posevnaya: 2640, wheat_pct: 44, sun_pct: 24, corn_pct: 17 },
  { id: "ulyanovsk",     name: "Ульяновская",   x: 62, y: 22, risk: 29, area: 12, ndvi: 0.68, rain: 17, temp: 13, posevnaya: 1120, wheat_pct: 38, sun_pct: 12, corn_pct: 10 },
  { id: "penza",         name: "Пензенская",    x: 38, y: 28, risk: 22, area: 11, ndvi: 0.71, rain: 21, temp: 12, posevnaya: 1380, wheat_pct: 41, sun_pct: 16, corn_pct:  8 },
  { id: "orenburg",      name: "Оренбургская",  x: 82, y: 45, risk: 52, area: 47, ndvi: 0.61, rain: 10, temp: 16, posevnaya: 3200, wheat_pct: 61, sun_pct:  9, corn_pct:  5 },
  { id: "tatarstan",     name: "Татарстан",     x: 60, y: 12, risk: 21, area: 18, ndvi: 0.74, rain: 20, temp: 11, posevnaya: 1560, wheat_pct: 35, sun_pct:  8, corn_pct: 12 },
  { id: "bashkortostan", name: "Башкортостан",  x: 80, y: 18, risk: 39, area: 32, ndvi: 0.65, rain: 15, temp: 12, posevnaya: 1890, wheat_pct: 42, sun_pct: 10, corn_pct:  9 },
];

export const STATS = [
  { label: "Регионов под мониторингом", value: "8",   suffix: "",  icon: "MapPin",       color: "emerald" },
  { label: "Культур анализируется",     value: "12",  suffix: "",  icon: "Wheat",        color: "amber" },
  { label: "Точность прогнозов AI",     value: "87",  suffix: "%", icon: "Target",       color: "cyan" },
  { label: "Активных предупреждений",   value: "4",   suffix: "",  icon: "AlertTriangle", color: "red" },
];

// Цены НТБ пшеница 3кл (₽/т), Поволжье, октябрь 2025 — прогноз июль 2026
// Источник: НТБ, НГС.ру 21.04.2026, СовЭкон
export const PRICE_CHART = [
  { month: "Окт", price: 11_800 },
  { month: "Ноя", price: 12_300 },
  { month: "Дек", price: 12_900 },
  { month: "Янв", price: 13_100 },
  { month: "Фев", price: 13_400 },
  { month: "Мар", price: 14_200 },  // мартовский всплеск (Ормузский кризис)
  { month: "Апр", price: 13_650 },  // откат после перемирия США–Иран–Израиль
  { month: "Май", price: 14_100, forecast: true },
  { month: "Июн", price: 14_500, forecast: true },
  { month: "Июл", price: 14_800, forecast: true },
];

// Объёмы торгов зерном НТБ 2026 (тыс. т) — сезон 2025/26
export const SUPPLY_DATA = [
  { month: "Янв", supply: 4_100, demand: 3_820 },
  { month: "Фев", supply: 3_650, demand: 4_020 },
  { month: "Мар", supply: 4_380, demand: 3_910 },
  { month: "Апр", supply: 5_600, demand: 4_250 },
  { month: "Май", supply: 6_800, demand: 4_600 },
  { month: "Июн", supply: 8_500, demand: 4_900 },
  { month: "Июл", supply: 10_200, demand: 5_200 },
  { month: "Авг", supply: 9_400, demand: 5_500 },
];

// Источник: НТБ, АгроСервер, CBOT, апрель 2026
export const MARKET_SOURCES = [
  { name: "АгроСервер",       volume: 164_000, change: +7.2,  trend: "up",   icon: "Store" },
  { name: "НТБ (биржа)",      volume:  98_500, change: -4.1,  trend: "down", icon: "BarChart2" },
  { name: "CBOT (мировой)",   volume: 558_000, change: +3.8,  trend: "up",   icon: "Globe" },
  { name: "Своё Фермерство",  volume:  41_200, change: +11.6, trend: "up",   icon: "Leaf" },
];

// Экспорт пшеницы РФ, сезон 2025/26 (тыс. т, Русагротранс июль–декабрь 2025: 26.7 млн т)
// Источник: oilworld.ru, 15.01.2026
export const EXPORT_DATA = [
  { direction: "Экспорт в Турцию",      volume: 3_420, share: 33, trend: "up" },
  { direction: "Экспорт в Египет",      volume: 2_190, share: 21, trend: "stable" },
  { direction: "Экспорт в Иран",        volume:   840, share:  8, trend: "down" },
  { direction: "Экспорт в Алжир",       volume:   960, share:  9, trend: "up" },
  { direction: "Внутренний рынок",      volume: 3_010, share: 29, trend: "up" },
];

// Экономика производства (₽/га), апрель 2026
// revenue = урожайность × цена ÷ 10, cost = прямые + накладные (рост себест. ~6% к 2025)
export const PROFITABILITY_DATA = [
  { crop: "Пшеница озимая", revenue: 44_100, cost: 31_600, margin: 28.3, roi: 39.6 },
  { crop: "Подсолнечник",   revenue: 96_600, cost: 45_200, margin: 53.2, roi: 113.7 },
  { crop: "Кукуруза",       revenue: 40_800, cost: 28_900, margin: 29.2, roi: 41.2 },
  { crop: "Ячмень яровой",  revenue: 34_200, cost: 23_400, margin: 31.6, roi: 46.2 },
  { crop: "Рожь",           revenue: 26_300, cost: 20_600, margin: 21.7, roi: 27.7 },
];

export const PRICING_PLANS = [
  {
    name: "Базовый",
    price: 0,
    period: "бесплатно",
    color: "secondary",
    features: [
      "Общие тренды цен (3 культуры)",
      "Погода по регионам",
      "Новости АПК",
      "Базовая карта Поволжья",
      "Email-уведомления",
    ],
    disabled: ["Детализированные прогнозы", "Персональные рекомендации", "API-доступ", "Экспорт отчётов"],
  },
  {
    name: "Профессионал",
    price: 1_490,
    period: "в месяц",
    color: "primary",
    popular: true,
    features: [
      "Все 12 культур Поволжья",
      "Прогнозы на 3-6-12 месяцев",
      "Интерактивная карта с NDVI",
      "Модуль рисков и оповещений",
      "AI-рекомендации (ARIMA+LSTM)",
      "Калькулятор маржинальности",
      "Экспорт в PDF/Excel",
      "Данные бирж CBOT/НТБ",
    ],
    disabled: [],
  },
  {
    name: "Корпоративный",
    price: 8_900,
    period: "в месяц",
    color: "accent",
    features: [
      "Всё из Профессионала",
      "Выделенный API-доступ",
      "Интеграция с 1С / SAP",
      "Расширенная аналитика",
      "Кастомные дашборды",
      "B2G отчёты для Минсельхоза",
      "SLA и выделенная поддержка",
      "Обучение персонала",
    ],
    disabled: [],
  },
];

export function getRiskColor(risk: number) {
  if (risk >= 75) return "#ef4444";
  if (risk >= 50) return "#f59e0b";
  return "#10b981";
}

export function getRiskLabel(risk: number) {
  if (risk >= 75) return "Критический";
  if (risk >= 50) return "Средний";
  return "Низкий";
}
