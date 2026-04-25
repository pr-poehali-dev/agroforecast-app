export const NAV_ITEMS = [
  { id: "home", label: "Главная", icon: "LayoutDashboard" },
  { id: "forecasts", label: "Прогнозы", icon: "TrendingUp" },
  { id: "map", label: "Карта", icon: "Map" },
  { id: "risks", label: "Риски", icon: "ShieldAlert" },
  { id: "analytics", label: "Аналитика", icon: "BarChart3" },
  { id: "alerts", label: "Уведомления", icon: "Bell" },
  { id: "profile", label: "Кабинет", icon: "User" },
  { id: "integrations", label: "API", icon: "Plug" },
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
];

export const MAP_REGIONS = [
  { id: "samara", name: "Самарская", x: 68, y: 35, risk: 72, area: 21 },
  { id: "saratov", name: "Саратовская", x: 52, y: 52, risk: 45, area: 34 },
  { id: "volgograd", name: "Волгоградская", x: 50, y: 72, risk: 88, area: 28 },
  { id: "ulyanovsk", name: "Ульяновская", x: 62, y: 22, risk: 28, area: 12 },
  { id: "penza", name: "Пензенская", x: 38, y: 28, risk: 61, area: 11 },
  { id: "orenburg", name: "Оренбургская", x: 82, y: 45, risk: 34, area: 47 },
  { id: "tatarstan", name: "Татарстан", x: 60, y: 12, risk: 19, area: 18 },
  { id: "bashkortostan", name: "Башкортостан", x: 80, y: 18, risk: 41, area: 32 },
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
