import React from "react";
import L from "leaflet";

// ─── Leaflet default icon fix ─────────────────────────────────────────────────
delete (L.Icon.Default.prototype as unknown as Record<string, unknown>)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl:       "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl:     "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

export const fromIcon = L.divIcon({
  className: "",
  html: `<div style="width:28px;height:28px;border-radius:50% 50% 50% 0;background:#2E7D32;border:3px solid white;box-shadow:0 2px 8px rgba(0,0,0,.35);transform:rotate(-45deg)"></div>`,
  iconSize: [28, 28],
  iconAnchor: [14, 28],
});

export const toIcon = L.divIcon({
  className: "",
  html: `<div style="width:28px;height:28px;border-radius:50% 50% 50% 0;background:#1565C0;border:3px solid white;box-shadow:0 2px 8px rgba(0,0,0,.35);transform:rotate(-45deg)"></div>`,
  iconSize: [28, 28],
  iconAnchor: [14, 28],
});

// ─── Types ───────────────────────────────────────────────────────────────────

export interface City {
  name: string;
  lat: number;
  lon: number;
  region: string;
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
  alternatives: {
    vehicle_type: string;
    label: string;
    total_cost: number;
    cost_per_ton: number;
    trips_needed: number;
  }[];
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

export const fmt = (n: number) => n.toLocaleString("ru-RU");

// ─── Skeleton ─────────────────────────────────────────────────────────────────

export const Sk: React.FC<{ className?: string }> = ({ className = "" }) =>
  React.createElement("div", { className: `animate-pulse bg-gray-200 rounded ${className}` });
