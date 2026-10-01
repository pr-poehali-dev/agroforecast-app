export const PRICE_MODEL_URL = "https://functions.poehali.dev/31de8175-9e0b-404e-aece-5f3d880a7a77";

export interface ModelForecast {
  base_period: string;
  target_period: string;
  base_price: number;
  forecast: number;
  change_pct: number;
  low80: number;
  high80: number;
}

export interface ModelHorizon {
  h: number;
  status: "ok" | "not_validated";
  beats_naive?: boolean;
  mape?: number;
  mape_naive?: number;
  skill_pct?: number | null;
  dir_accuracy_pct?: number | null;
  n?: number;
  test_from?: string;
  test_to?: string;
  weight?: number;
  validated_at?: string;
  forecast?: ModelForecast | null;
}

export interface ModelCrop {
  crop: "wheat" | "corn" | "sunflower";
  name: string;
  unit: string;
  last_period: string;
  last_price: number;
  history: { t: string; price: number }[];
  horizons: ModelHorizon[];
}

export interface ModelSummary {
  model: string;
  validation: string;
  sources: string[];
  crops: ModelCrop[];
}

export interface BacktestPoint {
  t: string;
  base: number;
  actual: number;
  pred: number;
}

const MONTHS = ["янв", "фев", "мар", "апр", "май", "июн", "июл", "авг", "сен", "окт", "ноя", "дек"];
export const fmtPeriod = (p?: string) => {
  if (!p) return "—";
  const [y, m] = p.split("-");
  return `${MONTHS[Number(m) - 1]} ${y}`;
};

export const fmtRub = (v?: number) => (v === undefined || v === null ? "—" : `${Math.round(v).toLocaleString("ru")} ₽/т`);

export async function fetchModelSummary(): Promise<ModelSummary> {
  const r = await fetch(`${PRICE_MODEL_URL}?action=summary`);
  if (!r.ok) throw new Error("Не удалось загрузить прогноз");
  return r.json();
}

export async function fetchBacktest(crop: string, h: number): Promise<BacktestPoint[]> {
  const r = await fetch(`${PRICE_MODEL_URL}?action=backtest&crop=${crop}&h=${h}`);
  if (!r.ok) throw new Error("Нет данных проверки");
  const d = await r.json();
  return d?.metrics?.points ?? [];
}
