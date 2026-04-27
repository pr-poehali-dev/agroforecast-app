export interface RegionYield {
  region: string;
  crop: string;
  year: number;
  yield: number | null;
  harvest: number | null;
  area: number | null;
}

export interface HistoryPoint {
  year: number;
  yield: number | null;
  harvest: number | null;
}

export interface ForecastItem {
  year: number;
  predicted_yield: number;
  confidence: number;
}

export interface ForecastResp {
  region: string;
  crop: string;
  forecast_years: number[];
  forecasts: ForecastItem[];
  reasoning: string;
  history: HistoryPoint[];
  cached?: boolean;
}

export interface Meta {
  crops: string[];
  years: number[];
  regions: string[];
}

export interface AllRegionRow {
  region: string;
  history: HistoryPoint[];
  avg: number;
  last: number;
  min: number;
  max: number;
  trend_pct: number;
  forecasts: ForecastItem[];
  reasoning: string;
}

export const REGION_ID_TO_DB: Record<string, string> = {
  samara: "Самарская область",
  saratov: "Саратовская область",
  volgograd: "Волгоградская область",
  ulyanovsk: "Ульяновская область",
  penza: "Пензенская область",
  orenburg: "Оренбургская область",
  tatarstan: "Татарстан",
  bashkortostan: "Башкортостан",
  krasnodar: "Краснодарский край",
  rostov: "Ростовская область",
  stavropol: "Ставропольский край",
  voronezh: "Воронежская область",
  belgorod: "Белгородская область",
  kursk: "Курская область",
  tambov: "Тамбовская область",
  chelyabinsk: "Челябинская область",
  kurgan: "Курганская область",
  novosibirsk: "Новосибирская область",
  omsk: "Омская область",
  altai: "Алтайский край",
};

export const REGION_ID_BY_NAME: Record<string, string> = Object.entries(REGION_ID_TO_DB).reduce(
  (acc, [id, name]) => ({ ...acc, [name]: id }),
  {} as Record<string, string>,
);

export const CROP_ICONS: Record<string, string> = {
  "Пшеница озимая": "Wheat",
  "Подсолнечник": "Flower",
  "Кукуруза": "Sprout",
  "Ячмень яровой": "Wheat",
  "Рожь": "Wheat",
};
