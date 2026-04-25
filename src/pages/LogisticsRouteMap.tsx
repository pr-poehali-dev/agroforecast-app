import React, { useEffect, useRef } from "react";
import Icon from "@/components/ui/icon";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { CalcResult, fmt } from "./LogisticsTypes";

// ─── RouteMap (pure Leaflet) ──────────────────────────────────────────────────

interface RouteMapProps {
  result: CalcResult;
}

export const RouteMap: React.FC<RouteMapProps> = ({ result }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    // Уничтожаем старую карту если была
    if (mapRef.current) {
      mapRef.current.remove();
      mapRef.current = null;
    }

    const map = L.map(containerRef.current, {
      center: [55.0, 50.0],
      zoom: 4,
      zoomControl: true,
      scrollWheelZoom: true,
    });
    mapRef.current = map;

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '&copy; <a href="https://openstreetmap.org">OpenStreetMap</a>',
      maxZoom: 18,
    }).addTo(map);

    const fromPos: L.LatLngExpression = [result.from_lat, result.from_lon];
    const toPos: L.LatLngExpression   = [result.to_lat,   result.to_lon];

    // Маркер ОТКУДА (зелёный)
    const fromIcon = L.divIcon({
      className: "",
      html: `<div style="width:30px;height:30px;border-radius:50% 50% 50% 0;background:#2E7D32;border:3px solid #fff;box-shadow:0 2px 10px rgba(0,0,0,.4);transform:rotate(-45deg)"></div>`,
      iconSize: [30, 30],
      iconAnchor: [15, 30],
    });
    const toIcon = L.divIcon({
      className: "",
      html: `<div style="width:30px;height:30px;border-radius:50% 50% 50% 0;background:#1565C0;border:3px solid #fff;box-shadow:0 2px 10px rgba(0,0,0,.4);transform:rotate(-45deg)"></div>`,
      iconSize: [30, 30],
      iconAnchor: [15, 30],
    });

    L.marker(fromPos, { icon: fromIcon })
      .addTo(map)
      .bindPopup(
        `<div style="font-size:13px;font-weight:600">${result.from_city}</div>` +
        `<div style="font-size:11px;color:#666">${result.from_region || "Отправление"}</div>`
      );

    L.marker(toPos, { icon: toIcon })
      .addTo(map)
      .bindPopup(
        `<div style="font-size:13px;font-weight:600">${result.to_city}</div>` +
        `<div style="font-size:11px;color:#666">${result.to_region || "Назначение"}</div>` +
        `<div style="font-size:12px;color:#2E7D32;font-weight:600;margin-top:4px">${fmt(result.total_cost)} ₽</div>`
      );

    // Безье-дуга маршрута
    const steps = 48;
    const midLat = (result.from_lat + result.to_lat) / 2 +
      Math.abs(result.to_lon - result.from_lon) * 0.07;
    const midLon = (result.from_lon + result.to_lon) / 2;
    const arc: L.LatLngExpression[] = [];
    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      const lat =
        (1 - t) ** 2 * result.from_lat +
        2 * (1 - t) * t * midLat +
        t ** 2 * result.to_lat;
      const lon =
        (1 - t) ** 2 * result.from_lon +
        2 * (1 - t) * t * midLon +
        t ** 2 * result.to_lon;
      arc.push([lat, lon]);
    }

    // Тень
    L.polyline(arc, { color: "#000", opacity: 0.07, weight: 9 }).addTo(map);
    // Основная линия
    L.polyline(arc, {
      color: "#2E7D32",
      opacity: 0.9,
      weight: 4,
      dashArray: "12 7",
    }).addTo(map);

    // Подогнать карту под маркеры
    map.fitBounds(L.latLngBounds([fromPos, toPos]), {
      padding: [70, 70],
      animate: false,
    });

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, [result]);

  return (
    <div className="glass-card rounded-2xl overflow-hidden">
      <div className="px-5 pt-4 pb-3 flex items-center justify-between border-b border-gray-100">
        <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
          <Icon name="Map" size={16} className="text-primary" />
          Карта маршрута
        </h3>
        <span className="text-xs text-gray-500 flex items-center gap-1.5">
          <Icon name="Milestone" size={12} />
          {result.distance_km} км по дорогам
        </span>
      </div>
      <div ref={containerRef} style={{ height: 420, width: "100%" }} />
      <div className="px-5 py-3 bg-gray-50 border-t border-gray-100 flex flex-wrap gap-4 text-xs text-gray-600">
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full bg-green-700 flex-shrink-0" />
          {result.from_city} — отправление
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full bg-blue-800 flex-shrink-0" />
          {result.to_city} — назначение
        </span>
        <span className="flex items-center gap-1.5 ml-auto text-gray-400">
          <Icon name="Info" size={11} />
          Маршрут приблизительный · OpenStreetMap
        </span>
      </div>
    </div>
  );
};
