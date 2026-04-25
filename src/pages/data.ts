export const NAV_ITEMS = [
  { id: "home", label: "Главная", icon: "LayoutDashboard" },
  { id: "forecasts", label: "Прогнозы цен", icon: "TrendingUp" },
  { id: "map", label: "Карта урожайности", icon: "Map" },
  { id: "supply", label: "Спрос и предложение", icon: "ArrowLeftRight" },
  { id: "risks", label: "Риски", icon: "ShieldAlert" },
  { id: "ai-model", label: "AI‑модель", icon: "Brain" },
  { id: "analytics", label: "Аналитика", icon: "BarChart3" },
  { id: "business", label: "Бизнес-инструменты", icon: "Calculator" },
  { id: "alerts", label: "Уведомления", icon: "Bell" },
  { id: "integrations", label: "Интеграции", icon: "Plug" },
  { id: "pricing", label: "Тарифы", icon: "CreditCard" },
];

export const CROPS = ["Пшеница", "Подсолнечник", "Кукуруза", "Ячмень", "Рожь"];

export const FORECAST_DATA = [
  { crop: "Пшеница озимая", currentPrice: 14200, forecastPrice: 15800, change: +11.3, confidence: 84, trend: "up", yield: 31.2, yieldForecast: 33.5 },
  { crop: "Подсолнечник", currentPrice: 28500, forecastPrice: 26100, change: -8.4, confidence: 71, trend: "down", yield: 24.1, yieldForecast: 22.8 },
  { crop: "Кукуруза", currentPrice: 11300, forecastPrice: 12400, change: +9.7, confidence: 79, trend: "up", yield: 58.4, yieldForecast: 62.1 },
  { crop: "Ячмень яровой", currentPrice: 10800, forecastPrice: 11200, change: +3.7, confidence: 88, trend: "up", yield: 28.7, yieldForecast: 29.9 },
  { crop: "Рожь", currentPrice: 9400, forecastPrice: 9100, change: -3.2, confidence: 66, trend: "down", yield: 18.3, yieldForecast: 17.6 },
];

export const RISK_DATA = [
  { region: "Самарская обл.", risk: 72, type: "Засуха", level: "high", crop: "Пшеница", color: "#ef4444" },
  { region: "Саратовская обл.", risk: 45, type: "Заморозки", level: "medium", crop: "Подсолнечник", color: "#f59e0b" },
  { region: "Волгоградская обл.", risk: 88, type: "Суховей", level: "critical", crop: "Кукуруза", color: "#ef4444" },
  { region: "Ульяновская обл.", risk: 28, type: "Вредители", level: "low", crop: "Ячмень", color: "#10b981" },
  { region: "Пензенская обл.", risk: 61, type: "Переувлажнение", level: "medium", crop: "Рожь", color: "#f59e0b" },
  { region: "Оренбургская обл.", risk: 34, type: "Ветер", level: "low", crop: "Пшеница", color: "#10b981" },
];

export const ALERTS = [
  { id: 1, type: "critical", title: "Критическая засуха", desc: "Волгоградская обл. — индекс влажности ниже критического", time: "5 мин назад", icon: "Flame" },
  { id: 2, type: "warning", title: "Прогноз цен обновлён", desc: "Пшеница +11.3% — новые данные из биржи", time: "23 мин назад", icon: "TrendingUp" },
  { id: 3, type: "warning", title: "Заморозки: риск 65%", desc: "Саратовская обл. — возможны заморозки 27-28 апреля", time: "1 ч назад", icon: "Snowflake" },
  { id: 4, type: "info", title: "Новая интеграция", desc: "Росгидромет API подключён успешно", time: "3 ч назад", icon: "CheckCircle" },
  { id: 5, type: "info", title: "Отчёт готов", desc: "Еженедельный аналитический отчёт доступен", time: "5 ч назад", icon: "FileText" },
  { id: 6, type: "warning", title: "Изменение квот на экспорт", desc: "Минсельхоз: квота на экспорт пшеницы снижена на 15%", time: "8 ч назад", icon: "Globe" },
  { id: 7, type: "info", title: "Данные CBOT обновлены", desc: "Мировые цены на пшеницу выросли на $4.2/бушель", time: "12 ч назад", icon: "BarChart2" },
];

export const MAP_REGIONS = [
  { id: "samara", name: "Самарская", x: 68, y: 35, risk: 72, area: 21, ndvi: 0.61, rain: 12, temp: 18 },
  { id: "saratov", name: "Саратовская", x: 52, y: 52, risk: 45, area: 34, ndvi: 0.54, rain: 8, temp: 21 },
  { id: "volgograd", name: "Волгоградская", x: 50, y: 72, risk: 88, area: 28, ndvi: 0.38, rain: 3, temp: 26 },
  { id: "ulyanovsk", name: "Ульяновская", x: 62, y: 22, risk: 28, area: 12, ndvi: 0.72, rain: 18, temp: 16 },
  { id: "penza", name: "Пензенская", x: 38, y: 28, risk: 61, area: 11, ndvi: 0.49, rain: 22, temp: 15 },
  { id: "orenburg", name: "Оренбургская", x: 82, y: 45, risk: 34, area: 47, ndvi: 0.67, rain: 14, temp: 19 },
  { id: "tatarstan", name: "Татарстан", x: 60, y: 12, risk: 19, area: 18, ndvi: 0.78, rain: 20, temp: 14 },
  { id: "bashkortostan", name: "Башкортостан", x: 80, y: 18, risk: 41, area: 32, ndvi: 0.65, rain: 16, temp: 15 },
];

export const STATS = [
  { label: "Регионов под мониторингом", value: "8", suffix: "", icon: "MapPin", color: "emerald" },
  { label: "Культур анализируется", value: "12", suffix: "", icon: "Wheat", color: "amber" },
  { label: "Точность прогнозов", value: "87", suffix: "%", icon: "Target", color: "cyan" },
  { label: "Активных предупреждений", value: "3", suffix: "", icon: "AlertTriangle", color: "red" },
];

export const PRICE_CHART = [
  { month: "Окт", price: 12800 },
  { month: "Ноя", price: 13200 },
  { month: "Дек", price: 13900 },
  { month: "Янв", price: 13500 },
  { month: "Фев", price: 14100 },
  { month: "Мар", price: 14200 },
  { month: "Апр", price: 14200 },
  { month: "Май", price: 15000, forecast: true },
  { month: "Июн", price: 15400, forecast: true },
  { month: "Июл", price: 15800, forecast: true },
];

export const SUPPLY_DATA = [
  { month: "Янв", supply: 4200, demand: 3900 },
  { month: "Фев", supply: 3800, demand: 4100 },
  { month: "Мар", supply: 4500, demand: 4000 },
  { month: "Апр", supply: 5200, demand: 4300 },
  { month: "Май", supply: 6100, demand: 4500 },
  { month: "Июн", supply: 7800, demand: 4800 },
  { month: "Июл", supply: 9200, demand: 5100 },
  { month: "Авг", supply: 8500, demand: 5400 },
];

export const MARKET_SOURCES = [
  { name: "АгроСервер", volume: 142000, change: +8.2, trend: "up", icon: "Store" },
  { name: "НТБ (биржа)", volume: 89400, change: -3.1, trend: "down", icon: "BarChart2" },
  { name: "CBOT (мировой)", volume: 524000, change: +5.7, trend: "up", icon: "Globe" },
  { name: "Своё Фермерство", volume: 31200, change: +12.4, trend: "up", icon: "Leaf" },
];

export const EXPORT_DATA = [
  { direction: "Экспорт в Турцию", volume: 2840, share: 34, trend: "up" },
  { direction: "Экспорт в Египет", volume: 1920, share: 23, trend: "stable" },
  { direction: "Экспорт в Иран", volume: 1100, share: 13, trend: "down" },
  { direction: "Внутренний рынок", volume: 2500, share: 30, trend: "up" },
];

export const PROFITABILITY_DATA = [
  { crop: "Пшеница озимая", revenue: 45600, cost: 28400, margin: 37.7, roi: 60.6 },
  { crop: "Подсолнечник", revenue: 71250, cost: 41800, margin: 41.3, roi: 70.5 },
  { crop: "Кукуруза", revenue: 38400, cost: 26100, margin: 32.0, roi: 47.1 },
  { crop: "Ячмень яровой", revenue: 31500, cost: 21200, margin: 32.7, roi: 48.6 },
  { crop: "Рожь", revenue: 24800, cost: 18900, margin: 23.8, roi: 31.2 },
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
    price: 1490,
    period: "в месяц",
    color: "primary",
    popular: true,
    features: [
      "Все 12 культур Поволжья",
      "Прогнозы на 3-6-12 месяцев",
      "Интерактивная карта с NDVI",
      "Модуль рисков и оповещений",
      "AI-рекомендации",
      "Калькулятор маржинальности",
      "Экспорт в PDF/Excel",
      "Данные бирж CBOT/НТБ",
    ],
    disabled: [],
  },
  {
    name: "Корпоративный",
    price: 8900,
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