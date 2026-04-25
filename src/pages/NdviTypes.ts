export const NDVI_URL = "https://functions.poehali.dev/8612f76e-67f1-4185-856e-5fd372e40e23";

export const REGION_NAMES: Record<string, string> = {
  samara: "Самарская", saratov: "Саратовская", volgograd: "Волгоградская",
  ulyanovsk: "Ульяновская", penza: "Пензенская", orenburg: "Оренбургская",
  tatarstan: "Татарстан", bashkortostan: "Башкортостан",
};

export function ndviColor(v: number) {
  if (v < 0.20) return "#ef4444";
  if (v < 0.40) return "#f97316";
  if (v < 0.55) return "#f59e0b";
  if (v < 0.70) return "#84cc16";
  return "#10b981";
}

export function ndviLabel(v: number) {
  if (v < 0.20) return "Критически низкий";
  if (v < 0.40) return "Низкий";
  if (v < 0.55) return "Умеренный";
  if (v < 0.70) return "Хороший";
  return "Отличный";
}

export interface RegionSummary {
  region_id: string; name: string;
  ndvi: number; ndvi_hist: number; ndvi_peak: number;
  anomaly_pct: number; label: string; color: string;
  phase: string; rain_mm: number; temp_c: number; cloud_pct: number;
  area_kha: number; yield_forecast: number; yield_low: number; yield_high: number;
  anomaly_alerts: number;
}

export interface RegionDetail {
  region_id: string; name: string; generated_at: string;
  source: string; ndvi: number; ndvi_calc: number; ndvi_formula: string;
  ndvi_hist_avg: number; ndvi_peak_last_season: number;
  anomaly_pct: number; label: string; color: string;
  phase: string; phase_day: number;
  rain_mm: number; temp_c: number; cloud_pct: number; area_kha: number;
  crop_structure: { wheat_pct: number; sunflower_pct: number; corn_pct: number; barley_pct: number };
  yield_forecast: { yield_cha: number; yield_low: number; yield_high: number; ndvi_peak_forecast: number; mape_pct: number };
  alerts: { type: string; icon: string; title: string; desc: string; action: string }[];
}

export interface SeriesPoint {
  week: number; date: string; label: string;
  ndvi_current: number; ndvi_hist_avg: number; is_forecast: boolean;
}
