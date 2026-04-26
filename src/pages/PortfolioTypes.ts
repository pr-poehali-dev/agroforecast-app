export const PORTFOLIO_URL = "https://functions.poehali.dev/c0f0c7ac-c29c-495f-954c-79fcc97efce7";

export const CROP_DATA: Record<string, { price_per_t: number; yield_cha: number; cost_per_ha: number }> = {
  "Пшеница озимая": { price_per_t: 13650, yield_cha: 29.4, cost_per_ha: 31600 },
  "Подсолнечник":   { price_per_t: 46500, yield_cha: 23.1, cost_per_ha: 45200 },
  "Кукуруза":       { price_per_t: 13800, yield_cha: 56.8, cost_per_ha: 28900 },
  "Ячмень яровой":  { price_per_t: 12200, yield_cha: 28.1, cost_per_ha: 23400 },
  "Рожь":           { price_per_t: 10100, yield_cha: 18.2, cost_per_ha: 20600 },
};

export const CROPS = Object.keys(CROP_DATA);

export const REGIONS = [
  "Самарская", "Саратовская", "Волгоградская", "Краснодарский",
  "Ростовская", "Ставропольский", "Воронежская", "Белгородская",
  "Оренбургская", "Татарстан",
];

export const CROP_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  "Пшеница озимая": { bg: "bg-emerald-50",  text: "text-emerald-700", border: "border-emerald-200" },
  "Подсолнечник":   { bg: "bg-amber-50",    text: "text-amber-700",   border: "border-amber-200"   },
  "Кукуруза":       { bg: "bg-orange-50",   text: "text-orange-700",  border: "border-orange-200"  },
  "Ячмень яровой":  { bg: "bg-lime-50",     text: "text-lime-700",    border: "border-lime-200"    },
  "Рожь":           { bg: "bg-slate-50",    text: "text-slate-600",   border: "border-slate-200"   },
};

export const CROP_ICONS: Record<string, string> = {
  "Пшеница озимая": "Wheat",
  "Подсолнечник":   "Sun",
  "Кукуруза":       "Sprout",
  "Ячмень яровой":  "Leaf",
  "Рожь":           "Grass",
};

export interface PortfolioItem {
  id: number;
  crop: string;
  area_ha: number;
  region: string;
  custom_yield: number | null;
  notes: string | null;
  created_at: string;
  yield_cha: number;
  price_per_t: number;
  cost_per_ha: number;
  revenue: number;
  costs: number;
  profit: number;
  roi_pct: number;
}

export interface Summary {
  total_area: number;
  total_revenue: number;
  total_costs: number;
  total_profit: number;
  count: number;
}

export function fmt(n: number): string {
  return n.toLocaleString("ru-RU");
}

export function fmtM(n: number): string {
  if (Math.abs(n) >= 1_000_000) return (n / 1_000_000).toFixed(1).replace(".", ",") + " млн ₽";
  return fmt(n) + " ₽";
}

export function calcLocal(crop: string, area_ha: number, custom_yield?: number) {
  const eco = CROP_DATA[crop];
  if (!eco) return { revenue: 0, costs: 0, profit: 0, roi_pct: 0, yield_cha: 0 };
  const yc = custom_yield ?? eco.yield_cha;
  const revenue = area_ha * (yc / 10) * eco.price_per_t;
  const costs = area_ha * eco.cost_per_ha;
  const profit = revenue - costs;
  const roi_pct = costs > 0 ? (profit / costs) * 100 : 0;
  return {
    revenue: Math.round(revenue),
    costs: Math.round(costs),
    profit: Math.round(profit),
    roi_pct: Math.round(roi_pct * 10) / 10,
    yield_cha: yc,
  };
}
