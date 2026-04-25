import { useEffect, useRef } from "react";
import * as L from "leaflet";
import { MAP_REGIONS, getRiskColor, getRiskLabel } from "@/pages/data";

interface HomeMapProps {
  selectedRegion: string | null;
  onSelect: (id: string) => void;
  aiRisks?: Record<string, { total_risk_pct: number; total_risk_level: string; yield_cha: number; price_rub_t: number; price_change_pct: number; drought_risk_pct: number; frost_risk_pct: number; pest_risk_pct: number }>;
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

function makeColor(risk: number) {
  if (risk >= 75) return "#ef4444";
  if (risk >= 50) return "#f59e0b";
  return "#10b981";
}

function makeIcon(color: string, isSelected: boolean, riskPct: number) {
  const size = isSelected ? 28 : 22;
  return L.divIcon({
    html: `
      <div style="width:48px;height:48px;display:flex;align-items:center;justify-content:center;position:relative;">
        <div style="position:absolute;width:48px;height:48px;border-radius:50%;background:${color}18;border:1.5px solid ${color}40;animation:pulse-ring 2.5s ease-out infinite;"></div>
        <div style="
          width:${size}px;height:${size}px;border-radius:50%;
          background:${color};
          border:${isSelected ? 3 : 2}px solid white;
          box-shadow:0 2px ${isSelected ? 14 : 7}px rgba(0,0,0,${isSelected ? 0.5 : 0.28});
          position:relative;z-index:1;cursor:pointer;
          ${isSelected ? `filter:drop-shadow(0 0 7px ${color});` : ""}
          display:flex;align-items:center;justify-content:center;
        ">
          <span style="color:white;font-size:${isSelected ? 9 : 7}px;font-weight:800;font-family:'IBM Plex Mono',monospace;">${riskPct}%</span>
        </div>
      </div>`,
    className: "",
    iconSize: [48, 48],
    iconAnchor: [24, 24],
    popupAnchor: [0, -26],
  });
}

function makePopupHtml(
  region: typeof MAP_REGIONS[0],
  color: string,
  riskPct: number,
  riskLevel: string,
  ai?: { yield_cha: number; price_rub_t: number; price_change_pct: number; drought_risk_pct: number; frost_risk_pct: number; pest_risk_pct: number },
) {
  const yieldForecast = ai?.yield_cha ?? (region.ndvi * 50).toFixed(1);
  const priceForecast = ai?.price_rub_t != null ? Math.round(ai.price_rub_t).toLocaleString("ru") : "—";
  const priceChange = ai?.price_change_pct ?? 0;
  const droughtRisk = ai?.drought_risk_pct != null ? ai.drought_risk_pct.toFixed(0) : "—";
  const frostRisk = ai?.frost_risk_pct != null ? ai.frost_risk_pct.toFixed(0) : "—";
  const pestRisk = ai?.pest_risk_pct != null ? ai.pest_risk_pct.toFixed(0) : "—";

  const riskLabelRu = riskLevel === "critical" ? "Критический" : riskLevel === "high" ? "Высокий" : riskLevel === "medium" ? "Средний" : getRiskLabel(riskPct);

  return `
    <div style="font-family:'Golos Text',sans-serif;min-width:220px;padding:2px 0;font-size:12px;">
      <div style="font-weight:800;font-size:14px;margin-bottom:10px;color:#0f172a;display:flex;align-items:center;gap:6px;">
        <span style="width:10px;height:10px;border-radius:50%;background:${color};display:inline-block;flex-shrink:0;"></span>
        ${region.name} обл.
      </div>

      <div style="display:grid;grid-template-columns:1fr 1fr;gap:6px;margin-bottom:10px;">
        <div style="background:#f8fafc;border-radius:8px;padding:8px;">
          <div style="font-size:10px;color:#94a3b8;margin-bottom:2px;">Индекс риска</div>
          <div style="font-weight:800;font-size:18px;color:${color};font-family:'IBM Plex Mono',monospace;">${riskPct}%</div>
          <div style="font-size:10px;color:${color};font-weight:600;">${riskLabelRu}</div>
        </div>
        <div style="background:#f8fafc;border-radius:8px;padding:8px;">
          <div style="font-size:10px;color:#94a3b8;margin-bottom:2px;">Урожай (AI)</div>
          <div style="font-weight:800;font-size:18px;color:#10b981;font-family:'IBM Plex Mono',monospace;">${yieldForecast}</div>
          <div style="font-size:10px;color:#94a3b8;">ц/га пшеница</div>
        </div>
      </div>

      <div style="height:4px;background:#e2e8f0;border-radius:2px;margin-bottom:10px;">
        <div style="height:100%;width:${riskPct}%;background:${color};border-radius:2px;transition:width .5s;"></div>
      </div>

      <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:4px;margin-bottom:10px;">
        <div style="text-align:center;background:#fafafa;border-radius:6px;padding:5px 2px;">
          <div style="font-size:9px;color:#94a3b8;">NDVI</div>
          <div style="font-weight:700;color:#0f172a;font-size:12px;">${region.ndvi.toFixed(2)}</div>
        </div>
        <div style="text-align:center;background:#fafafa;border-radius:6px;padding:5px 2px;">
          <div style="font-size:9px;color:#94a3b8;">Осадки</div>
          <div style="font-weight:700;color:#0f172a;font-size:12px;">${region.rain} мм</div>
        </div>
        <div style="text-align:center;background:#fafafa;border-radius:6px;padding:5px 2px;">
          <div style="font-size:9px;color:#94a3b8;">Темп.</div>
          <div style="font-weight:700;color:#0f172a;font-size:12px;">+${region.temp}°C</div>
        </div>
      </div>

      <div style="border-top:1px solid #e2e8f0;padding-top:8px;">
        <div style="font-size:9px;color:#94a3b8;font-family:'IBM Plex Mono',monospace;letter-spacing:.5px;margin-bottom:5px;text-transform:uppercase;">Прогноз AI · пшеница 3 мес</div>
        <div style="display:flex;justify-content:space-between;margin-bottom:4px;">
          <span style="color:#64748b;">Цена</span>
          <span style="font-weight:700;color:#0f172a;">${priceForecast} ₽/т</span>
        </div>
        <div style="display:flex;justify-content:space-between;margin-bottom:6px;">
          <span style="color:#64748b;">Изм. цены</span>
          <span style="font-weight:700;color:${priceChange >= 0 ? "#10b981" : "#ef4444"};">${priceChange >= 0 ? "+" : ""}${typeof priceChange === "number" ? priceChange.toFixed(1) : priceChange}%</span>
        </div>
        <div style="display:flex;gap:6px;font-size:10px;flex-wrap:wrap;">
          <span style="background:#fef9c3;color:#a16207;border-radius:4px;padding:2px 5px;">☀️ засуха ${droughtRisk}%</span>
          <span style="background:#dbeafe;color:#1d4ed8;border-radius:4px;padding:2px 5px;">❄️ мороз ${frostRisk}%</span>
          <span style="background:#d1fae5;color:#047857;border-radius:4px;padding:2px 5px;">🐛 вред. ${pestRisk}%</span>
        </div>
      </div>

      <div style="margin-top:8px;display:flex;justify-content:space-between;font-size:10px;color:#94a3b8;border-top:1px solid #f1f5f9;padding-top:6px;">
        <span>Пашня: ${region.posevnaya} тыс. га</span>
        <span>Пшеница: ${region.wheat_pct}%</span>
        <span>Подс.: ${region.sun_pct}%</span>
      </div>
    </div>`;
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
      center: [52.5, 50.0],
      zoom: 5,
      zoomControl: false,
      attributionControl: false,
      scrollWheelZoom: true,
    });

    L.control.zoom({ zoomInTitle: "Увеличить", zoomOutTitle: "Уменьшить" }).addTo(map);

    L.tileLayer(
      "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
      { attribution: "© Esri, Maxar, Earthstar Geographics", maxZoom: 19 }
    ).addTo(map);

    L.tileLayer(
      "https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}",
      { attribution: "", maxZoom: 19, opacity: 0.75 }
    ).addTo(map);

    MAP_REGIONS.forEach(region => {
      const coords = REGION_COORDS[region.id];
      if (!coords) return;
      const ai = aiRisks[region.id];
      const riskPct = ai ? Math.round(ai.total_risk_pct) : region.risk;
      const riskLevel = ai ? ai.total_risk_level : (riskPct >= 75 ? "critical" : riskPct >= 50 ? "medium" : "low");
      const color = makeColor(riskPct);

      const marker = L.marker(coords, { icon: makeIcon(color, false, riskPct) })
        .addTo(map)
        .bindPopup(makePopupHtml(region, color, riskPct, riskLevel, ai), {
          maxWidth: 260, className: "leaflet-popup-custom",
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
  }, [onSelect, aiRisks]);

  // Highlight selected region + fly
  useEffect(() => {
    if (!leafletMapRef.current || !selectedRegion) return;
    const coords = REGION_COORDS[selectedRegion];
    if (!coords) return;

    leafletMapRef.current.flyTo(coords, 7, { duration: 1.0 });

    MAP_REGIONS.forEach(region => {
      const m = markersRef.current[region.id];
      if (!m) return;
      const ai = aiRisks[region.id];
      const riskPct = ai ? Math.round(ai.total_risk_pct) : region.risk;
      const color = makeColor(riskPct);
      const isSelected = region.id === selectedRegion;
      m.setIcon(makeIcon(color, isSelected, riskPct));
    });

    const marker = markersRef.current[selectedRegion];
    if (marker) setTimeout(() => { if (leafletMapRef.current) marker.openPopup(); }, 1100);
  }, [selectedRegion, aiRisks]);

  // Update markers when AI risks arrive
  useEffect(() => {
    if (!leafletMapRef.current || Object.keys(aiRisks).length === 0) return;
    MAP_REGIONS.forEach(region => {
      const m = markersRef.current[region.id];
      if (!m) return;
      const ai = aiRisks[region.id];
      const riskPct = ai ? Math.round(ai.total_risk_pct) : region.risk;
      const riskLevel = ai ? ai.total_risk_level : (riskPct >= 75 ? "critical" : riskPct >= 50 ? "medium" : "low");
      const color = makeColor(riskPct);
      const isSelected = region.id === selectedRegion;
      m.setIcon(makeIcon(color, isSelected, riskPct));
      m.setPopupContent(makePopupHtml(region, color, riskPct, riskLevel, ai));
    });
  }, [aiRisks, selectedRegion]);

  return (
    <div className="relative w-full rounded-xl overflow-hidden" style={{ height: "340px" }}>
      <div ref={mapRef} style={{ width: "100%", height: "100%" }} />
      <style>{`
        .leaflet-popup-content-wrapper {
          border-radius: 14px !important;
          box-shadow: 0 8px 32px rgba(0,0,0,0.22) !important;
          border: 1px solid rgba(0,0,0,0.07) !important;
          padding: 0 !important;
        }
        .leaflet-popup-content { margin: 14px 16px !important; }
        .leaflet-popup-tip-container { display: none; }
        @keyframes pulse-ring {
          0%   { transform: scale(0.75); opacity: 0.9; }
          100% { transform: scale(1.9);  opacity: 0; }
        }
      `}</style>
    </div>
  );
}