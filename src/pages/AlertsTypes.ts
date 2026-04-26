export const SETTINGS_URL = "https://functions.poehali.dev/settings";

export const PRICE_CROPS = [
  "Пшеница озимая", "Подсолнечник", "Кукуруза", "Ячмень яровой", "Рожь",
];

export const WEATHER_REGIONS = [
  "Самарская", "Саратовская", "Волгоградская", "Краснодарский",
  "Ростовская", "Ставропольский", "Воронежская", "Белгородская",
  "Оренбургская", "Татарстан",
];

export const LS_KEY = "agroport_triggers";
export const LS_EMAIL_KEY = "agroport_alert_email";

export type AlertFilter = "all" | "critical" | "warning" | "info";
export type TriggerType = "price" | "weather";

export interface PriceTrigger {
  id: string;
  type: "price";
  crop: string;
  condition: "above" | "below";
  threshold: number;
  active: boolean;
  created_at: string;
}

export interface WeatherTrigger {
  id: string;
  type: "weather";
  region: string;
  risk_level: "critical" | "high";
  active: boolean;
  created_at: string;
}

export type Trigger = PriceTrigger | WeatherTrigger;

export function genId(): string {
  return Math.random().toString(36).slice(2, 10);
}

export function todayStr(): string {
  return new Date().toISOString().split("T")[0];
}

export function loadTriggers(): Trigger[] {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as Trigger[];
  } catch {
    return [];
  }
}

export function saveTriggers(triggers: Trigger[]): void {
  localStorage.setItem(LS_KEY, JSON.stringify(triggers));
}

export function loadEmail(): string {
  return localStorage.getItem(LS_EMAIL_KEY) ?? "";
}

export function saveEmail(email: string): void {
  localStorage.setItem(LS_EMAIL_KEY, email);
}
