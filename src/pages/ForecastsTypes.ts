export const AI_URL = "https://functions.poehali.dev/3f769f53-b21b-473e-91b9-b7a755123928";

export const CROP_REGION_MAP: Record<string, string> = {
  "Пшеница озимая": "samara",
  "Подсолнечник": "samara",
  "Кукуруза": "volgograd",
  "Ячмень яровой": "tatarstan",
  "Рожь": "penza",
};

export interface AiTableRow {
  crop: string;
  currentPrice: number;
  forecastPrice: number;
  change: number;
  confidence: number;
  trend: "up" | "down";
  yieldForecast: number;
  yield: number;
}

export interface AiSingle {
  currentPrice: number;
  forecastPrice: number;
  change: number;
  confidence: number;
  trend: "up" | "down";
  yieldForecast: number;
}
