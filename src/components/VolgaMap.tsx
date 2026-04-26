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

// Реальные координаты регионов [lat, lon]
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
  const size = isSelected ? 30 : 22;
  return L.divIcon({
    html: `
      <div style="width:52px;height:52px;display:flex;align-items:center;justify-content:center;position:relative;">
        <div style="position:absolute;width:${isSelected ? 52 : 38}px;height:${isSelected ? 52 : 38}px;border-radius:50%;background:${color}22;border:1.5px solid ${color}55;"></div>
        <div style="
          width:${size}px;height:${size}px;border-radius:50%;
          background:${color};
          border:${isSelected ? 3 : 2}px solid white;
          box-shadow:0 2px ${isSelected ? 14 : 7}px rgba(0,0,0,${isSelected ? 0.45 : 0.25});
          position:relative;z-index:1;cursor:pointer;
          ${isSelected ? `filter:drop-shadow(0 0 6px ${color});` : ""}
          display:flex;align-items:center;justify-content:center;
        ">
          <span style="color:white;font-size:${isSelected ? 9 : 7}px;font-weight:800;font-family:'IBM Plex Mono',monospace;">${Math.round(riskPct)}%</span>
        </div>
      </div>`,
    className: "",
    iconSize: [52, 52],
    iconAnchor: [26, 26],
    popupAnchor: [0, -28],
  });
}

function makePopup(
  region: typeof MAP_REGIONS[0],
  color: string,
  riskPct: number,
  ai?: RegionRisk,
) {
  const riskLabelText = riskPct >= 65 ? "Высокий" : riskPct >= 40 ? "Средний" : "Низкий";
  const aiBlock = ai ? `
    <div style="margin-top:8px;padding-top:8px;border-top:1px solid #e5e7eb;">
      <div style="font-size:10px;color:#9ca3af;font-family:'IBM Plex Mono',monospace;letter-spacing:.5px;margin-bottom:5px;">ИИ-прогноз · ARIMA+LSTM</div>
      <div style="display:flex;justify-content:space-between;font-size:11px;margin-bottom:3px;">
        <span style="color:#6b7280;">Урожай (пшеница)</span>
        <span style="font-weight:700;color:#2E7D32;">${ai.yield_cha ?? "—"} ц/га</span>
      </div>
      <div style="display:flex;justify-content:space-between;font-size:11px;margin-bottom:3px;">
        <span style="color:#6b7280;">Цена прогноз</span>
        <span style="font-weight:700;color:#111827;">${ai.price_rub_t != null ? Math.round(ai.price_rub_t).toLocaleString("ru") : "—"} ₽/т</span>
      </div>
      <div style="display:flex;justify-content:space-between;font-size:11px;margin-bottom:5px;">
        <span style="color:#6b7280;">Изм. цены</span>
        <span style="font-weight:700;color:${(ai.price_change_pct ?? 0) > 0 ? "#2E7D32" : "#ef4444"};">${(ai.price_change_pct ?? 0) > 0 ? "+" : ""}${ai.price_change_pct != null ? ai.price_change_pct.toFixed(1) : "0"}%</span>
      </div>
      <div style="display:flex;gap:5px;flex-wrap:wrap;font-size:10px;color:#6b7280;">
        <span>☀️ засуха ${ai.drought_risk_pct != null ? ai.drought_risk_pct.toFixed(0) : "—"}%</span>
        <span>❄️ мороз ${ai.frost_risk_pct != null ? ai.frost_risk_pct.toFixed(0) : "—"}%</span>
        <span>🐛 вред. ${ai.pest_risk_pct != null ? ai.pest_risk_pct.toFixed(0) : "—"}%</span>
      </div>
    </div>
  ` : "";

  return `
    <div style="font-family:'Golos Text',sans-serif;min-width:210px;padding:4px 0;font-size:12px;">
      <div style="font-weight:800;font-size:14px;margin-bottom:10px;color:#111827;display:flex;align-items:center;gap:6px;">
        <span style="width:10px;height:10px;border-radius:50%;background:${color};display:inline-block;flex-shrink:0;"></span>
        ${region.name} ${region.id === "tatarstan" || region.id === "bashkortostan" || region.id.endsWith("krai") || region.id === "krasnodar" || region.id === "stavropol" || region.id === "altai" ? "" : "обл."}
      </div>
      <div style="display:flex;justify-content:space-between;margin-bottom:4px;">
        <span style="color:#6b7280;">Индекс риска${ai ? " (ИИ)" : ""}</span>
        <span style="font-weight:700;color:${color};">${Math.round(riskPct)}% · ${riskLabelText}</span>
      </div>
      <div style="height:5px;background:#e5e7eb;border-radius:3px;margin-bottom:8px;overflow:hidden;">
        <div style="height:100%;width:${riskPct}%;background:${color};border-radius:3px;"></div>
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:4px;margin-bottom:6px;">
        <div style="background:#f9fafb;border-radius:6px;padding:5px 4px;text-align:center;">
          <div style="font-size:9px;color:#9ca3af;">NDVI</div>
          <div style="font-weight:700;color:#111827;font-size:12px;">${region.ndvi.toFixed(2)}</div>
        </div>
        <div style="background:#f9fafb;border-radius:6px;padding:5px 4px;text-align:center;">
          <div style="font-size:9px;color:#9ca3af;">Осадки</div>
          <div style="font-weight:700;color:#111827;font-size:12px;">${region.rain} мм</div>
        </div>
        <div style="background:#f9fafb;border-radius:6px;padding:5px 4px;text-align:center;">
          <div style="font-size:9px;color:#9ca3af;">Темп.</div>
          <div style="font-weight:700;color:#111827;font-size:12px;">+${region.temp}°C</div>
        </div>
      </div>
      <div style="font-size:10px;color:#6b7280;">Пашня: ${region.area} тыс. га · Пшеница: ${region.wheat_pct}%</div>
      ${aiBlock}
    </div>`;
}

export default function VolgaMap({ selectedRegion, onSelect }: VolgaMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const leafletMapRef = useRef<L.Map | null>(null);
  const markersRef = useRef<Record<string, L.Marker>>({});
  const [aiRisks, setAiRisks] = useState<Record<string, RegionRisk>>({});
  const [aiLoaded, setAiLoaded] = useState(false);

  // Загрузка ИИ-рисков
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

  // Инициализация карты
  useEffect(() => {
    if (!mapRef.current || leafletMapRef.current) return;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    delete (L.Icon.Default.prototype as any)._getIconUrl;

    const map = L.map(mapRef.current, {
      center: [55.0, 55.0],
      zoom: 4,
      zoomControl: false,
      attributionControl: false,
      scrollWheelZoom: true,
    });

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19,
      attribution: "© OpenStreetMap",
    }).addTo(map);

    // Кнопки зума с русскими подписями
    L.control.zoom({ zoomInTitle: "Увеличить", zoomOutTitle: "Уменьшить" }).addTo(map);

    // Маркеры регионов
    MAP_REGIONS.forEach(region => {
      const coords = REGION_COORDS[region.id];
      if (!coords) return;
      const color = getRiskColor(region.risk);
      const marker = L.marker(coords, { icon: makeIcon(color, false, region.risk) })
        .addTo(map)
        .bindPopup(makePopup(region, color, region.risk), { maxWidth: 260 })
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
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Обновление маркеров и попапов при изменении aiRisks или selectedRegion
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
      m.setPopupContent(makePopup(region, color, riskPct, ai));
    });
  }, [aiRisks, aiLoaded, selectedRegion]);

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
      style={{ height: "100%", width: "100%", minHeight: 400, borderRadius: 12, overflow: "hidden" }}
    />
  );
}