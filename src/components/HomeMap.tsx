import { useEffect, useRef } from "react";
import * as L from "leaflet";
import { MAP_REGIONS, getRiskColor } from "@/pages/data";

interface AiRisk {
  total_risk_pct: number;
  total_risk_level: string;
  yield_cha: number;
  price_rub_t: number;
  price_change_pct: number;
  drought_risk_pct: number;
  frost_risk_pct: number;
  pest_risk_pct: number;
}

interface HomeMapProps {
  selectedRegion: string | null;
  onSelect: (id: string) => void;
  aiRisks?: Record<string, AiRisk>;
}

const REGION_COORDS: Record<string, [number, number]> = {
  samara:        [53.19, 50.15],
  saratov:       [51.53, 46.03],
  volgograd:     [48.52, 44.52],
  ulyanovsk:     [54.32, 48.40],
  penza:         [53.20, 45.00],
  orenburg:      [51.77, 55.10],
  tatarstan:     [55.79, 49.12],
  bashkortostan: [54.73, 55.94],
  krasnodar:     [45.04, 38.98],
  rostov:        [47.23, 39.72],
  stavropol:     [45.05, 41.98],
  astrakhan:     [46.35, 48.03],
  voronezh:      [51.67, 39.18],
  belgorod:      [50.60, 36.59],
  kursk:         [51.73, 36.19],
  tambov:        [52.72, 41.44],
  moscow_obl:    [55.74, 37.62],
  leningrad:     [59.89, 30.32],
  chelyabinsk:   [55.15, 61.43],
  kurgan:        [55.45, 65.33],
  novosibirsk:   [54.99, 82.90],
  omsk:          [54.99, 73.37],
  altai:         [52.73, 82.95],
};

function riskColor(riskPct: number): string {
  if (riskPct >= 65) return "#ef4444";
  if (riskPct >= 40) return "#f59e0b";
  return "#2E7D32";
}

function makeIcon(color: string, isSelected: boolean, riskPct: number) {
  const size = isSelected ? 26 : 20;
  return L.divIcon({
    html: `<div style="width:44px;height:44px;display:flex;align-items:center;justify-content:center;">
      <div style="width:${size}px;height:${size}px;border-radius:50%;background:${color};border:${isSelected ? 3 : 2}px solid white;box-shadow:0 2px ${isSelected ? 10 : 5}px rgba(0,0,0,0.3);display:flex;align-items:center;justify-content:center;${isSelected ? `filter:drop-shadow(0 0 5px ${color});` : ""}">
        <span style="color:white;font-size:${isSelected ? 8 : 6}px;font-weight:800;font-family:'IBM Plex Mono',monospace;">${Math.round(riskPct)}%</span>
      </div>
    </div>`,
    className: "",
    iconSize: [44, 44],
    iconAnchor: [22, 22],
    popupAnchor: [0, -24],
  });
}

export default function HomeMap({ selectedRegion, onSelect, aiRisks = {} }: HomeMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const leafletMapRef = useRef<L.Map | null>(null);
  const markersRef = useRef<Record<string, L.Marker>>({});

  useEffect(() => {
    if (!mapRef.current || leafletMapRef.current) return;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    delete (L.Icon.Default.prototype as any)._getIconUrl;

    const map = L.map(mapRef.current, {
      center: [55.0, 55.0],
      zoom: 3,
      zoomControl: false,
      attributionControl: false,
      scrollWheelZoom: false,
      dragging: true,
    });

    L.tileLayer("https://{s}.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}{r}.png", {
      maxZoom: 19,
      subdomains: "abcd",
      attribution: "© CARTO",
    }).addTo(map);

    MAP_REGIONS.forEach(region => {
      const coords = REGION_COORDS[region.id];
      if (!coords) return;
      const ai = aiRisks[region.id];
      const riskPct = ai ? ai.total_risk_pct : region.risk;
      const color = riskColor(riskPct);
      const isSelected = region.id === selectedRegion;

      const marker = L.marker(coords, { icon: makeIcon(color, isSelected, riskPct) })
        .addTo(map)
        .on("click", () => onSelect(region.id));

      markersRef.current[region.id] = marker;
    });

    leafletMapRef.current = map;

    return () => {
      if (leafletMapRef.current) {
        leafletMapRef.current.remove();
        leafletMapRef.current = null;
        markersRef.current = {};
      }
    };
  }, []);

  // Обновление маркеров при изменении aiRisks или selectedRegion
  useEffect(() => {
    if (!leafletMapRef.current) return;
    MAP_REGIONS.forEach(region => {
      const m = markersRef.current[region.id];
      if (!m) return;
      const ai = aiRisks[region.id];
      const riskPct = ai ? ai.total_risk_pct : region.risk;
      const color = riskColor(riskPct);
      const isSelected = region.id === selectedRegion;
      m.setIcon(makeIcon(color, isSelected, riskPct));
    });
  }, [aiRisks, selectedRegion]);

  // Перелёт к выбранному региону
  useEffect(() => {
    if (!leafletMapRef.current || !selectedRegion) return;
    const coords = REGION_COORDS[selectedRegion];
    if (coords) {
      leafletMapRef.current.flyTo(coords, 5, { duration: 0.8 });
    }
  }, [selectedRegion]);

  return (
    <div
      ref={mapRef}
      style={{ height: 320, width: "100%", borderRadius: 12, overflow: "hidden" }}
    />
  );
}