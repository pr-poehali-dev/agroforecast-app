import { useEffect, useRef, useState } from "react";
import * as L from "leaflet";
import { MAP_REGIONS, getRiskColor } from "@/pages/data";

const AI_URL = "https://functions.poehali.dev/3f769f53-b21b-473e-91b9-b7a755123928";
const WHEAT = "Пшеница озимая";

interface RegionRisk {
  total_risk_pct: number;
  total_risk_level: string;
  drought_risk_pct: number;
  frost_risk_pct: number;
  pest_risk_pct: number;
  yield_cha: number;
  price_rub_t: number;
  price_change_pct: number;
}

interface VolgaMapProps {
  selectedRegion: string | null;
  onSelect: (id: string) => void;
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
};

function aiRiskColor(riskPct: number): string {
  if (riskPct >= 65) return "#ef4444";
  if (riskPct >= 40) return "#f59e0b";
  return "#10b981";
}

function makeIcon(color: string, isSelected: boolean) {
  return L.divIcon({
    html: `
      <div style="width:44px;height:44px;display:flex;align-items:center;justify-content:center;position:relative;">
        <div style="width:44px;height:44px;border-radius:50%;background:${color}${isSelected ? "35" : "18"};border:2px solid ${color}${isSelected ? "80" : "45"};position:absolute;${isSelected ? "" : "animation:pulse-ring 2.5s ease-out infinite;"}"></div>
        <div style="width:${isSelected ? 26 : 20}px;height:${isSelected ? 26 : 20}px;border-radius:50%;background:${color};border:${isSelected ? 3 : 2}px solid white;box-shadow:0 2px ${isSelected ? 12 : 6}px rgba(0,0,0,${isSelected ? 0.5 : 0.3});position:relative;z-index:1;cursor:pointer;${isSelected ? `filter:drop-shadow(0 0 6px ${color});` : ""}"></div>
      </div>
    `,
    className: "",
    iconSize: [44, 44],
    iconAnchor: [22, 22],
    popupAnchor: [0, -22],
  });
}

function makePopup(
  name: string,
  riskPct: number,
  color: string,
  ndvi: number,
  rain: number,
  temp: number,
  ai?: RegionRisk,
) {
  const aiBlock = ai ? `
    <div style="margin-top:8px;padding-top:8px;border-top:1px solid #eee;">
      <div style="font-size:10px;color:#aaa;font-family:'IBM Plex Mono',monospace;letter-spacing:.5px;margin-bottom:5px;">AI · ARIMA+LSTM</div>
      <div style="display:flex;justify-content:space-between;font-size:11px;margin-bottom:3px;">
        <span style="color:#666;">Урожай (пшеница)</span>
        <span style="font-weight:700;color:#10b981;">${ai.yield_cha} ц/га</span>
      </div>
      <div style="display:flex;justify-content:space-between;font-size:11px;margin-bottom:3px;">
        <span style="color:#666;">Цена прогноз</span>
        <span style="font-weight:700;color:#1a1a1a;">${ai.price_rub_t.toLocaleString()} ₽/т</span>
      </div>
      <div style="display:flex;justify-content:space-between;font-size:11px;margin-bottom:5px;">
        <span style="color:#666;">Изм. цены</span>
        <span style="font-weight:700;color:${ai.price_change_pct > 0 ? "#10b981" : "#ef4444"};">${ai.price_change_pct > 0 ? "+" : ""}${ai.price_change_pct.toFixed(1)}%</span>
      </div>
      <div style="display:flex;gap:4px;flex-wrap:wrap;font-size:10px;color:#888;">
        <span>☀️ засуха ${ai.drought_risk_pct.toFixed(0)}%</span>
        <span>❄️ мороз ${ai.frost_risk_pct.toFixed(0)}%</span>
        <span>🐛 вред. ${ai.pest_risk_pct.toFixed(0)}%</span>
      </div>
    </div>
  ` : "";

  return `
    <div style="font-family:'Golos Text',sans-serif;min-width:200px;padding:4px 0;">
      <div style="font-weight:700;font-size:13px;margin-bottom:8px;color:#1a1a1a;">${name} обл.</div>
      <div style="display:flex;justify-content:space-between;margin-bottom:4px;font-size:12px;">
        <span style="color:#666;">Индекс риска${ai ? " (AI)" : ""}</span>
        <span style="font-weight:700;color:${color};">${riskPct.toFixed(0)}%</span>
      </div>
      <div style="height:4px;background:#eee;border-radius:2px;margin-bottom:8px;">
        <div style="height:100%;width:${riskPct}%;background:${color};border-radius:2px;"></div>
      </div>
      <div style="display:flex;justify-content:space-between;font-size:11px;color:#888;">
        <span>NDVI: ${ndvi.toFixed(2)}</span>
        <span>Осадки: ${rain} мм</span>
        <span>${temp}°C</span>
      </div>
      ${aiBlock}
    </div>
  `;
}

export default function VolgaMap({ selectedRegion, onSelect }: VolgaMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const leafletMapRef = useRef<L.Map | null>(null);
  const markersRef = useRef<Record<string, L.Marker>>({});
  const [aiRisks, setAiRisks] = useState<Record<string, RegionRisk>>({});
  const [aiLoaded, setAiLoaded] = useState(false);

  // Fetch AI risks for all regions (wheat, 3 months)
  useEffect(() => {
    fetch(`${AI_URL}?crop=${encodeURIComponent(WHEAT)}&horizon=3&all=1`)
      .then(r => r.json())
      .then(d => {
        const map: Record<string, RegionRisk> = {};
        (d.regions || []).forEach((r: RegionRisk & { region_id: string }) => {
          map[r.region_id] = r;
        });
        setAiRisks(map);
        setAiLoaded(true);
      })
      .catch(() => {});
  }, []);

  // Init map once
  useEffect(() => {
    if (!mapRef.current || leafletMapRef.current) return;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    delete (L.Icon.Default.prototype as any)._getIconUrl;
    L.Icon.Default.mergeOptions({
      iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
      iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
      shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
    });

    const map = L.map(mapRef.current, {
      center: [52.5, 50.0],
      zoom: 5,
      zoomControl: true,
      attributionControl: true,
      scrollWheelZoom: true,
    });

    L.tileLayer(
      "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
      { attribution: "Esri, Maxar, Earthstar Geographics", maxZoom: 19 }
    ).addTo(map);

    L.tileLayer(
      "https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}",
      { attribution: "", maxZoom: 19, opacity: 0.8 }
    ).addTo(map);

    MAP_REGIONS.forEach(region => {
      const coords = REGION_COORDS[region.id];
      if (!coords) return;
      const color = getRiskColor(region.risk);
      const marker = L.marker(coords, { icon: makeIcon(color, false) })
        .addTo(map)
        .bindPopup(makePopup(region.name, region.risk, color, region.ndvi, region.rain, region.temp), {
          maxWidth: 240, className: "leaflet-popup-custom",
        })
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
  }, [onSelect]);

  // Update markers when AI data arrives
  useEffect(() => {
    if (!aiLoaded || !leafletMapRef.current) return;
    MAP_REGIONS.forEach(region => {
      const m = markersRef.current[region.id];
      if (!m) return;
      const ai = aiRisks[region.id];
      const riskPct = ai ? ai.total_risk_pct : region.risk;
      const color = ai ? aiRiskColor(riskPct) : getRiskColor(region.risk);
      const isSelected = region.id === selectedRegion;
      m.setIcon(makeIcon(color, isSelected));
      m.setPopupContent(makePopup(region.name, riskPct, color, region.ndvi, region.rain, region.temp, ai));
    });
  }, [aiLoaded, aiRisks, selectedRegion]);

  // Fly to selected region + highlight
  useEffect(() => {
    if (!leafletMapRef.current || !selectedRegion) return;
    const coords = REGION_COORDS[selectedRegion];
    if (!coords) return;

    leafletMapRef.current.flyTo(coords, 7, { duration: 1.2 });

    const marker = markersRef.current[selectedRegion];
    if (marker) {
      setTimeout(() => { if (leafletMapRef.current) marker.openPopup(); }, 1300);
    }

    MAP_REGIONS.forEach(region => {
      const m = markersRef.current[region.id];
      if (!m) return;
      const ai = aiRisks[region.id];
      const riskPct = ai ? ai.total_risk_pct : region.risk;
      const color = ai ? aiRiskColor(riskPct) : getRiskColor(region.risk);
      const isSelected = region.id === selectedRegion;
      m.setIcon(makeIcon(color, isSelected));
    });
  }, [selectedRegion, aiRisks]);

  return (
    <div className="relative w-full rounded-xl overflow-hidden" style={{ height: "420px" }}>
      <div ref={mapRef} style={{ width: "100%", height: "100%" }} />
      {!aiLoaded && (
        <div className="absolute top-3 right-3 z-[1000] flex items-center gap-1.5 px-2.5 py-1.5 bg-black/60 backdrop-blur-sm rounded-lg text-white text-[11px] font-mono">
          <span className="w-1.5 h-1.5 rounded-full bg-yellow-400 animate-pulse" />
          AI загружает риски...
        </div>
      )}
      {aiLoaded && (
        <div className="absolute top-3 right-3 z-[1000] flex items-center gap-1.5 px-2.5 py-1.5 bg-black/60 backdrop-blur-sm rounded-lg text-white text-[11px] font-mono">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
          AI · live
        </div>
      )}
      <style>{`
        .leaflet-popup-content-wrapper {
          border-radius: 12px !important;
          box-shadow: 0 4px 24px rgba(0,0,0,0.18) !important;
          border: 1px solid rgba(0,0,0,0.08) !important;
          padding: 0 !important;
        }
        .leaflet-popup-content { margin: 12px 16px !important; }
        .leaflet-popup-tip-container { display: none; }
        @keyframes pulse-ring {
          0% { transform: scale(0.8); opacity: 0.8; }
          100% { transform: scale(1.8); opacity: 0; }
        }
      `}</style>
    </div>
  );
}