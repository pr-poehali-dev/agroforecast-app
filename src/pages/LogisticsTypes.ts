// ─── Types ───────────────────────────────────────────────────────────────────

export interface GeoPoint {
  name: string;
  display: string;
  lat: number;
  lon: number;
  region?: string;
}

export interface VehicleType {
  label: string;
  capacity: number;
  rate_per_km: number;
  base: number;
}

export interface CargoType {
  label: string;
  surcharge: number;
}

export interface CalcResult {
  from_city: string;
  to_city: string;
  from_lat: number;
  from_lon: number;
  to_lat: number;
  to_lon: number;
  from_region: string;
  to_region: string;
  distance_km: number;
  weight_tons: number;
  vehicle_type: string;
  vehicle_label: string;
  cargo_type: string;
  cargo_label: string;
  trips_needed: number;
  cost_per_trip: number;
  total_cost: number;
  cost_per_ton: number;
  cost_per_tkm: number;
  transit_days?: number;
  recommendation?: string;
  alternatives: {
    vehicle_type: string;
    label: string;
    total_cost: number;
    cost_per_ton: number;
    trips_needed: number;
  }[];
}

export interface TransportOption {
  mode: string;
  vehicle_key: string;
  icon: string;
  cost: number;
  cost_per_ton: number;
  days: number;
  trips: number;
  pros: string;
  cons: string;
  savings_badge: string | null;
}

export interface SavedRoute {
  id: number;
  from_city: string;
  to_city: string;
  distance_km: number;
  cargo_type: string;
  weight_tons: number;
  vehicle_type: string;
  cost_estimate: number;
  cost_per_ton: number;
  status: string;
  notes: string;
  created_at: string;
}

// ─── Утилиты ──────────────────────────────────────────────────────────────────

export const fmt = (n: number) => Math.round(n).toLocaleString("ru-RU");

// ─── Nominatim геокодер ───────────────────────────────────────────────────────

export async function geocode(query: string): Promise<GeoPoint[]> {
  if (!query || query.length < 2) return [];
  const url =
    `https://nominatim.openstreetmap.org/search` +
    `?format=json&addressdetails=1&limit=7&countrycodes=ru` +
    `&q=${encodeURIComponent(query)}`;
  try {
    const res = await fetch(url, {
      headers: { "Accept-Language": "ru", "User-Agent": "AgroPort/1.0" },
    });
    const data = await res.json();
    return data.map((item: Record<string, unknown>) => {
      const addr = (item.address || {}) as Record<string, string>;
      const region = addr.state || addr.county || addr.region || "";
      const short =
        addr.village ||
        addr.town ||
        addr.city ||
        addr.hamlet ||
        addr.municipality ||
        (item.name as string) ||
        (item.display_name as string).split(",")[0];
      return {
        name: short,
        display: (item.display_name as string).split(",").slice(0, 4).join(", "),
        lat: parseFloat(item.lat as string),
        lon: parseFloat(item.lon as string),
        region,
      };
    });
  } catch {
    return [];
  }
}