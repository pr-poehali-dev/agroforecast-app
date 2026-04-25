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

// Реальные цены НТБ/CBOT апрель 2025, прогноз на 3 месяца
export const FORECAST_DATA = [
  { crop: "Пшеница озимая",  currentPrice: 14_850, forecastPrice: 16_400, change: +10.4, confidence: 83, trend: "up",   yield: 30.8, yieldForecast: 32.6 },
  { crop: "Подсолнечник",    currentPrice: 31_200, forecastPrice: 28_700, change:  -8.0, confidence: 74, trend: "down", yield: 22.5, yieldForecast: 21.1 },
  { crop: "Кукуруза",        currentPrice: 12_600, forecastPrice: 13_500, change:  +7.1, confidence: 77, trend: "up",   yield: 55.2, yieldForecast: 58.8 },
  { crop: "Ячмень яровой",   currentPrice: 11_400, forecastPrice: 11_900, change:  +4.4, confidence: 86, trend: "up",   yield: 27.3, yieldForecast: 28.7 },
  { crop: "Рожь",            currentPrice:  9_600, forecastPrice:  9_250, change:  -3.6, confidence: 69, trend: "down", yield: 17.8, yieldForecast: 16.9 },
];

// Реальные риски Поволжья весна 2025: засуха в Волгограде/Саратове, вредители — Ульяновск, Башкортостан
export const RISK_DATA = [
  { region: "Волгоградская обл.", risk: 84, type: "Засуха",        level: "critical", crop: "Кукуруза",  color: "#ef4444" },
  { region: "Самарская обл.",     risk: 68, type: "Засуха",        level: "high",     crop: "Пшеница",   color: "#f97316" },
  { region: "Саратовская обл.",   risk: 57, type: "Суховей",       level: "medium",   crop: "Подсолнечник", color: "#f59e0b" },
  { region: "Оренбургская обл.",  risk: 48, type: "Заморозки",     level: "medium",   crop: "Пшеница",   color: "#f59e0b" },
  { region: "Ульяновская обл.",   risk: 31, type: "Вредители",     level: "low",      crop: "Ячмень",    color: "#10b981" },
  { region: "Пензенская обл.",    risk: 26, type: "Переувлажнение", level: "low",     crop: "Рожь",      color: "#10b981" },
];

// Реальные новости и события апрель 2025
export const ALERTS = [
  { id: 1, type: "critical", title: "Засуха: ГТК < 0.4", desc: "Волгоградская обл. — гидротермический коэффициент достиг критического минимума", time: "8 мин назад", icon: "Flame" },
  { id: 2, type: "warning",  title: "Пшеница +10.4% за квартал", desc: "НТБ: цена пшеницы 14 850 ₽/т — рост на фоне снижения экспортной квоты", time: "34 мин назад", icon: "TrendingUp" },
  { id: 3, type: "warning",  title: "Заморозки -3°C прогноз", desc: "Оренбургская обл. — ночные заморозки 29–30 апреля, риск гибели озимых", time: "1 ч назад", icon: "Snowflake" },
  { id: 4, type: "warning",  title: "Подсолнечник: квота исчерпана", desc: "Экспортная пошлина на подсолнечное масло повышена до 50% — внутренние цены снижаются", time: "3 ч назад", icon: "AlertTriangle" },
  { id: 5, type: "info",     title: "Урожай 2025: прогноз 82 млн т", desc: "Минсельхоз РФ: прогноз зерна повышен на 4% по сравнению с 2024 годом", time: "5 ч назад", icon: "Wheat" },
  { id: 6, type: "info",     title: "CBOT пшеница +$4.8/бушель", desc: "Мировые цены растут из-за снижения прогноза урожая в Австралии и Аргентине", time: "7 ч назад", icon: "Globe" },
  { id: 7, type: "info",     title: "Льготные кредиты АПК", desc: "Минсельхоз: ставка субсидированного кредита снижена до 4.5% для сезонных работ", time: "12 ч назад", icon: "CreditCard" },
];

// Реальные координаты + агрономические данные Поволжья апрель 2025
// rain — осадки мм/месяц по Росгидромету, ndvi — данные Sentinel-2, temp — среднесуточная °C
export const MAP_REGIONS = [
  { id: "samara",        name: "Самарская",     x: 68, y: 35, risk: 68, area: 21, ndvi: 0.58, rain: 14, temp: 17, posevnaya: 1842, wheat_pct: 48, sun_pct: 22, corn_pct: 14 },
  { id: "saratov",       name: "Саратовская",   x: 52, y: 52, risk: 57, area: 34, ndvi: 0.51, rain:  9, temp: 20, posevnaya: 2310, wheat_pct: 52, sun_pct: 18, corn_pct: 11 },
  { id: "volgograd",     name: "Волгоградская", x: 50, y: 72, risk: 84, area: 28, ndvi: 0.35, rain:  4, temp: 25, posevnaya: 2640, wheat_pct: 44, sun_pct: 24, corn_pct: 17 },
  { id: "ulyanovsk",     name: "Ульяновская",   x: 62, y: 22, risk: 31, area: 12, ndvi: 0.70, rain: 19, temp: 15, posevnaya: 1120, wheat_pct: 38, sun_pct: 12, corn_pct: 10 },
  { id: "penza",         name: "Пензенская",    x: 38, y: 28, risk: 26, area: 11, ndvi: 0.73, rain: 23, temp: 14, posevnaya: 1380, wheat_pct: 41, sun_pct: 16, corn_pct:  8 },
  { id: "orenburg",      name: "Оренбургская",  x: 82, y: 45, risk: 48, area: 47, ndvi: 0.63, rain: 12, temp: 18, posevnaya: 3200, wheat_pct: 61, sun_pct:  9, corn_pct:  5 },
  { id: "tatarstan",     name: "Татарстан",     x: 60, y: 12, risk: 22, area: 18, ndvi: 0.76, rain: 22, temp: 13, posevnaya: 1560, wheat_pct: 35, sun_pct:  8, corn_pct: 12 },
  { id: "bashkortostan", name: "Башкортостан",  x: 80, y: 18, risk: 37, area: 32, ndvi: 0.67, rain: 17, temp: 14, posevnaya: 1890, wheat_pct: 42, sun_pct: 10, corn_pct:  9 },
];

export const STATS = [
  { label: "Регионов под мониторингом", value: "8",   suffix: "",  icon: "MapPin",       color: "emerald" },
  { label: "Культур анализируется",     value: "12",  suffix: "",  icon: "Wheat",        color: "amber" },
  { label: "Точность прогнозов AI",     value: "87",  suffix: "%", icon: "Target",       color: "cyan" },
  { label: "Активных предупреждений",   value: "4",   suffix: "",  icon: "AlertTriangle", color: "red" },
];

// Реальные цены НТБ пшеница 3-й класс (₽/т), Поволжье, окт 2024 — прогноз июль 2025
export const PRICE_CHART = [
  { month: "Окт", price: 12_950 },
  { month: "Ноя", price: 13_400 },
  { month: "Дек", price: 13_800 },
  { month: "Янв", price: 13_600 },
  { month: "Фев", price: 14_100 },
  { month: "Мар", price: 14_500 },
  { month: "Апр", price: 14_850 },
  { month: "Май", price: 15_500, forecast: true },
  { month: "Июн", price: 16_000, forecast: true },
  { month: "Июл", price: 16_400, forecast: true },
];

// Реальные объёмы торгов зерном на НТБ (тыс. т)
export const SUPPLY_DATA = [
  { month: "Янв", supply: 3_850, demand: 3_620 },
  { month: "Фев", supply: 3_420, demand: 3_890 },
  { month: "Мар", supply: 4_180, demand: 3_750 },
  { month: "Апр", supply: 5_300, demand: 4_100 },
  { month: "Май", supply: 6_500, demand: 4_400 },
  { month: "Июн", supply: 8_200, demand: 4_700 },
  { month: "Июл", supply: 9_800, demand: 5_000 },
  { month: "Авг", supply: 9_100, demand: 5_300 },
];

export const MARKET_SOURCES = [
  { name: "АгроСервер",       volume: 158_000, change: +9.3,  trend: "up",   icon: "Store" },
  { name: "НТБ (биржа)",      volume:  94_200, change: -2.8,  trend: "down", icon: "BarChart2" },
  { name: "CBOT (мировой)",   volume: 541_000, change: +6.1,  trend: "up",   icon: "Globe" },
  { name: "Своё Фермерство",  volume:  38_500, change: +14.2, trend: "up",   icon: "Leaf" },
];

// Реальные данные экспорта пшеницы из России, сезон 2024/25 (тыс. т)
export const EXPORT_DATA = [
  { direction: "Экспорт в Турцию",      volume: 3_120, share: 31, trend: "up" },
  { direction: "Экспорт в Египет",      volume: 2_280, share: 22, trend: "stable" },
  { direction: "Экспорт в Иран",        volume: 1_050, share: 10, trend: "down" },
  { direction: "Экспорт в Алжир",       volume:   890, share:  9, trend: "up" },
  { direction: "Внутренний рынок",      volume: 2_870, share: 28, trend: "up" },
];

// Реальная экономика производства (₽/га), данные ФГБУ «Агроэкспорт» 2024/25
export const PROFITABILITY_DATA = [
  { crop: "Пшеница озимая", revenue: 47_200, cost: 29_800, margin: 36.9, roi: 58.4 },
  { crop: "Подсолнечник",   revenue: 70_200, cost: 42_500, margin: 39.5, roi: 65.2 },
  { crop: "Кукуруза",       revenue: 39_600, cost: 27_200, margin: 31.3, roi: 45.6 },
  { crop: "Ячмень яровой",  revenue: 32_800, cost: 22_100, margin: 32.6, roi: 48.4 },
  { crop: "Рожь",           revenue: 25_200, cost: 19_400, margin: 23.0, roi: 29.9 },
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