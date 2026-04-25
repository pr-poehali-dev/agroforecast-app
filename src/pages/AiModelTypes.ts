export const AI_URL = "https://functions.poehali.dev/3f769f53-b21b-473e-91b9-b7a755123928";

export const CROPS = ["Пшеница озимая", "Подсолнечник", "Кукуруза", "Ячмень яровой", "Рожь"];
export const HORIZONS = [3, 6, 9, 12];
export const REGION_NAMES: Record<string, string> = {
  samara: "Самарская", saratov: "Саратовская", volgograd: "Волгоградская",
  ulyanovsk: "Ульяновская", penza: "Пензенская", orenburg: "Оренбургская",
  tatarstan: "Татарстан", bashkortostan: "Башкортостан",
};

export function riskColor(level: string) {
  if (level === "critical") return "#ef4444";
  if (level === "high")     return "#f97316";
  if (level === "medium")   return "#f59e0b";
  return "#10b981";
}
export function riskLabel(level: string) {
  if (level === "critical") return "Критический";
  if (level === "high")     return "Высокий";
  if (level === "medium")   return "Средний";
  return "Низкий";
}
export function confBadge(conf: number) {
  if (conf >= 80) return "text-primary bg-primary/10 border-primary/25";
  if (conf >= 65) return "text-accent bg-accent/10 border-accent/25";
  return "text-destructive bg-destructive/10 border-destructive/25";
}

export interface ModelMeta {
  yield_model: string;
  price_model: string;
  risk_model: string;
  training_period: string;
  validation_mape_yield: number;
  validation_mape_price: number;
  risk_accuracy_pct: number;
  update_frequency: string;
  last_updated: string;
}

export interface RegionForecast {
  region_id: string;
  ndvi: number;
  rain_mm: number;
  temp_c: number;
  area_ha: number;
  yield_cha: number;
  yield_low: number;
  yield_high: number;
  confidence_pct: number;
  risk_discount_pct: number;
  lstm_signal: number;
  price_rub_t: number;
  price_low: number;
  price_high: number;
  price_change_pct: number;
  price_trend: string;
  price_confidence_pct: number;
  total_risk_pct: number;
  total_risk_level: string;
  drought_risk_pct: number;
  frost_risk_pct: number;
  pest_risk_pct: number;
  recommendations: { type: string; priority: string; text: string }[];
}

export interface SingleForecast {
  crop: string;
  region_id: string;
  horizon_months: number;
  generated_at: string;
  model_confidence_overall: number;
  yield_forecast: {
    yield_cha: number; yield_low: number; yield_high: number;
    confidence_pct: number; lstm_signal: number; risk_discount_pct: number;
  };
  price_forecast: {
    price_rub_t: number; price_low: number; price_high: number;
    change_pct: number; confidence_pct: number; trend: string;
    components: { arima_rub: number; seasonal_rub: number; news_signal_pct: number; yield_effect_rub: number };
  };
  risk_assessment: {
    total_risk_pct: number; total_risk_level: string;
    drought_risk_pct: number; frost_risk_pct: number; pest_risk_pct: number;
    recommendations: { type: string; priority: string; text: string }[];
  };
}

export interface ChartPoint {
  month: string; date: string; price: number;
  price_low: number; price_high: number; forecast: boolean;
  open?: number; close?: number;
}