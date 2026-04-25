import React, { useEffect } from "react";
import Icon from "@/components/ui/icon";
import { MapContainer, TileLayer, Marker, Polyline, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { City, CalcResult, fmt, fromIcon, toIcon } from "./LogisticsTypes";

// ─── MapFitter: подгоняет вид под маркеры ─────────────────────────────────────

export const MapFitter: React.FC<{ positions: [number, number][] }> = ({ positions }) => {
  const map = useMap();
  useEffect(() => {
    if (positions.length === 2) {
      const bounds = L.latLngBounds(positions);
      map.fitBounds(bounds, { padding: [60, 60], animate: true });
    }
  }, [map, positions]);
  return null;
};

// ─── RouteMap ─────────────────────────────────────────────────────────────────

export interface RouteMapProps {
  fromCity: string;
  toCity: string;
  result: CalcResult;
  cityMap: Record<string, City>;
}

export const RouteMap: React.FC<RouteMapProps> = ({ fromCity, toCity, result, cityMap }) => {
  const from = cityMap[fromCity];
  const to   = cityMap[toCity];
  if (!from || !to) return null;

  const fromPos: [number, number] = [from.lat, from.lon];
  const toPos:   [number, number] = [to.lat,   to.lon];

  // Строим «дугу» через промежуточные точки для красивой кривой
  const midLat = (from.lat + to.lat) / 2 + (Math.abs(to.lon - from.lon) * 0.08);
  const midLon = (from.lon + to.lon) / 2;
  const arcPoints: [number, number][] = [];
  const steps = 32;
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    // квадратичная кривая Безье
    const lat = (1 - t) ** 2 * from.lat + 2 * (1 - t) * t * midLat + t ** 2 * to.lat;
    const lon = (1 - t) ** 2 * from.lon + 2 * (1 - t) * t * midLon + t ** 2 * to.lon;
    arcPoints.push([lat, lon]);
  }

  return (
    <div className="glass-card rounded-2xl overflow-hidden">
      <div className="px-5 pt-4 pb-3 flex items-center justify-between border-b border-gray-100">
        <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
          <Icon name="Map" size={16} className="text-primary" />
          Карта маршрута
        </h3>
        <span className="text-xs text-gray-500 flex items-center gap-1">
          <Icon name="Milestone" size={12} />
          {result.distance_km} км по дорогам
        </span>
      </div>

      <div style={{ height: 420 }}>
        <MapContainer
          center={[55.0, 50.0]}
          zoom={4}
          style={{ height: "100%", width: "100%" }}
          zoomControl={true}
          scrollWheelZoom={true}
        >
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://openstreetmap.org">OpenStreetMap</a>'
          />
          <MapFitter positions={[fromPos, toPos]} />

          {/* Дуга маршрута — тень */}
          <Polyline
            positions={arcPoints}
            pathOptions={{ color: "#000", opacity: 0.08, weight: 8, dashArray: undefined }}
          />
          {/* Дуга маршрута — основная */}
          <Polyline
            positions={arcPoints}
            pathOptions={{ color: "#2E7D32", opacity: 0.85, weight: 4, dashArray: "10 6" }}
          />

          {/* Маркер ОТКУДА */}
          <Marker position={fromPos} icon={fromIcon}>
            <Popup>
              <div className="text-sm font-semibold text-gray-800">{fromCity}</div>
              <div className="text-xs text-gray-500">{from.region} · Отправление</div>
            </Popup>
          </Marker>

          {/* Маркер КУДА */}
          <Marker position={toPos} icon={toIcon}>
            <Popup>
              <div className="text-sm font-semibold text-gray-800">{toCity}</div>
              <div className="text-xs text-gray-500">{to.region} · Назначение</div>
              <div className="text-xs text-primary font-medium mt-1">{fmt(result.total_cost)} ₽</div>
            </Popup>
          </Marker>
        </MapContainer>
      </div>

      {/* Легенда под картой */}
      <div className="px-5 py-3 bg-gray-50 border-t border-gray-100 flex flex-wrap gap-4 text-xs text-gray-600">
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full bg-green-700 flex-shrink-0" />
          {fromCity} (отправление)
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full bg-blue-800 flex-shrink-0" />
          {toCity} (назначение)
        </span>
        <span className="flex items-center gap-1.5 ml-auto text-gray-400">
          <Icon name="Info" size={11} />
          Маршрут приблизительный
        </span>
      </div>
    </div>
  );
};
