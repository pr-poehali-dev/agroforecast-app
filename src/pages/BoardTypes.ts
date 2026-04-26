export const BOARD_URL = "https://functions.poehali.dev/6571fced-d479-410d-9c80-3af212a355f3";

export const CROPS_LIST = [
  "Пшеница озимая", "Подсолнечник", "Кукуруза", "Ячмень яровой", "Рожь",
];

export const REGIONS_LIST = [
  "Самарская", "Саратовская", "Волгоградская", "Краснодарский",
  "Ростовская", "Ставропольский", "Воронежская", "Белгородская",
  "Оренбургская", "Татарстан", "Башкортостан", "Ульяновская",
  "Пензенская", "Астраханская", "Курская", "Тамбовская",
];

export const SOURCE_LABELS: Record<string, { label: string; color: string }> = {
  "zerno.ru":        { label: "zerno.ru",        color: "bg-emerald-100 text-emerald-700" },
  "agroserver.ru":   { label: "agroserver.ru",   color: "bg-blue-100 text-blue-700" },
  "agroinvestor.ru": { label: "agroinvestor.ru", color: "bg-purple-100 text-purple-700" },
  "user":            { label: "Пользователь",    color: "bg-amber-100 text-amber-700" },
};

export interface Listing {
  id: number;
  type: "sell" | "buy";
  crop: string;
  region: string;
  price_per_ton: number;
  volume_tons: number | null;
  quality: string | null;
  contact: string | null;
  description: string | null;
  source: string;
  source_url: string | null;
  created_at: string;
}

export function fmt(n: number) {
  return n.toLocaleString("ru-RU");
}

export function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const h = Math.floor(diff / 3_600_000);
  if (h < 1) return "только что";
  if (h < 24) return `${h} ч назад`;
  const d = Math.floor(h / 24);
  return `${d} д назад`;
}
