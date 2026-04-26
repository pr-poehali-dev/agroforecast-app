import { useEffect, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import Icon from "@/components/ui/icon";
import { RegionSummary, ndviColor, ndviLabel } from "./NdviTypes";

// ── Region lat/lon for Leaflet ─────────────────────────────────────────────
const REGION_COORDS: Record<string, [number, number]> = {
  // Поволжье
  samara:        [53.2,  50.2],
  saratov:       [51.5,  46.0],
  volgograd:     [48.7,  44.5],
  ulyanovsk:     [54.3,  48.4],
  penza:         [53.2,  45.0],
  orenburg:      [51.8,  55.1],
  tatarstan:     [55.8,  49.1],
  bashkortostan: [54.7,  55.9],
  // Юг
  krasnodar:     [45.0,  38.9],
  rostov:        [47.2,  39.7],
  stavropol:     [45.0,  41.9],
  astrakhan:     [46.3,  48.0],
  // Черноземье
  voronezh:      [51.7,  39.2],
  belgorod:      [50.6,  36.6],
  kursk:         [51.7,  36.2],
  tambov:        [52.7,  41.4],
  lipetsk:       [52.6,  39.6],
  oryol:         [52.9,  36.1],
  // Центр
  moscow_obl:    [55.7,  37.6],
  tver:          [56.9,  35.9],
  ryazan:        [54.6,  39.7],
  // Урал
  chelyabinsk:   [55.1,  61.4],
  kurgan:        [55.4,  65.3],
  sverdlovsk:    [56.8,  60.6],
  // Сибирь
  novosibirsk:   [54.9,  82.9],
  omsk:          [54.9,  73.4],
  altai:         [52.5,  82.2],
  krasnoyarsk:   [56.0,  92.8],
  // Северо-Запад
  leningrad:     [59.9,  30.3],
};

// Month labels for the decorative date slider
const MONTHS = [
  "январь 2026", "февраль 2026", "март 2026", "апрель 2026",
  "май 2026",    "июнь 2026",   "июль 2026", "август 2026",
];

// ── Props ──────────────────────────────────────────────────────────────────
interface NdviHeatMapProps {
  summary: RegionSummary[];
  selectedRegion: string;
  onSelectRegion: (id: string) => void;
}

// ── Component ──────────────────────────────────────────────────────────────
export default function NdviHeatMap({ summary, selectedRegion, onSelectRegion }: NdviHeatMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef       = useRef<L.Map | null>(null);
  const circlesRef   = useRef<Record<string, L.CircleMarker>>({});

  const [mapReady,  setMapReady]  = useState(false);
  const [monthIdx,  setMonthIdx]  = useState(3); // апрель 2026

  // ── Build / rebuild map when summary data arrives ─────────────────────
  useEffect(() => {
    if (!containerRef.current || summary.length === 0) return;

    // Destroy previous instance
    if (mapRef.current) {
      mapRef.current.remove();
      mapRef.current = null;
      circlesRef.current = {};
    }

    setMapReady(false);

    const map = L.map(containerRef.current, {
      center:          [57.0, 65.0],
      zoom:            3,
      zoomControl:     true,
      scrollWheelZoom: true,
      attributionControl: true,
    });
    mapRef.current = map;

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "&copy; OpenStreetMap",
      maxZoom: 19,
    }).addTo(map);

    // Circle markers per region
    summary.forEach(r => {
      const coords = REGION_COORDS[r.region_id];
      if (!coords) return;

      const color  = ndviColor(r.ndvi);
      const isSelected = r.region_id === selectedRegion;

      const circle = L.circleMarker(coords, {
        radius:      isSelected ? 18 : 13,
        color:       isSelected ? "#ffffff" : color,
        weight:      isSelected ? 3 : 1.5,
        opacity:     1,
        fillColor:   color,
        fillOpacity: isSelected ? 0.95 : 0.78,
      });

      // Popup content
      const anomalySign  = r.anomaly_pct > 0 ? "+" : "";
      const anomalyColor = r.anomaly_pct < -10 ? "#ef4444" : r.anomaly_pct < 0 ? "#f97316" : "#2E7D32";
      const popup = L.popup({ offset: [0, -6], closeButton: false, className: "ndvi-popup" }).setContent(`
        <div style="font-family:sans-serif;min-width:160px">
          <div style="font-weight:700;font-size:13px;margin-bottom:4px;color:#1a1a1a">${r.name}</div>
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:3px">
            <span style="font-size:11px;color:#666">NDVI</span>
            <span style="font-size:15px;font-weight:800;font-family:monospace;color:${color}">${r.ndvi.toFixed(2)}</span>
          </div>
          <div style="font-size:10px;font-weight:600;color:${color};margin-bottom:5px">${ndviLabel(r.ndvi)}</div>
          <div style="height:4px;background:#e5e7eb;border-radius:9px;margin-bottom:5px;overflow:hidden">
            <div style="height:100%;width:${Math.round(r.ndvi * 100)}%;background:${color};border-radius:9px"></div>
          </div>
          <div style="display:flex;justify-content:space-between;font-size:10px;color:#888">
            <span>Аномалия: <b style="color:${anomalyColor}">${anomalySign}${r.anomaly_pct.toFixed(1)}%</b></span>
            <span>~${r.yield_forecast} ц/га</span>
          </div>
          ${r.anomaly_alerts > 0
            ? `<div style="margin-top:5px;font-size:10px;color:#ef4444;font-weight:600">⚠ ${r.anomaly_alerts} предупреждений</div>`
            : ""}
          <div style="margin-top:6px;font-size:10px;color:#2E7D32;cursor:pointer;text-align:center;
               padding:3px 6px;background:#f0fdf4;border-radius:5px;border:1px solid #bbf7d0">
            Нажмите для деталей →
          </div>
        </div>
      `);

      circle.bindPopup(popup);
      circle.on("mouseover", () => circle.openPopup());
      circle.on("mouseout",  () => circle.closePopup());
      circle.on("click",     () => {
        onSelectRegion(r.region_id);
        circle.openPopup();
      });

      circle.addTo(map);
      circlesRef.current[r.region_id] = circle;
    });

    setMapReady(true);

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
        circlesRef.current = {};
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [summary]);

  // ── Update selected circle styling without full rebuild ────────────────
  useEffect(() => {
    if (!mapReady) return;
    Object.entries(circlesRef.current).forEach(([id, circle]) => {
      const r = summary.find(s => s.region_id === id);
      if (!r) return;
      const color     = ndviColor(r.ndvi);
      const isSelected = id === selectedRegion;
      circle.setStyle({
        radius:      isSelected ? 18 : 13,
        color:       isSelected ? "#ffffff" : color,
        weight:      isSelected ? 3 : 1.5,
        fillOpacity: isSelected ? 0.95 : 0.78,
      });
      // Bring selected to front
      if (isSelected) circle.bringToFront();
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedRegion, mapReady]);

  // ── Date slider helpers ────────────────────────────────────────────────
  const prevMonth = () => setMonthIdx(i => Math.max(0, i - 1));
  const nextMonth = () => setMonthIdx(i => Math.min(MONTHS.length - 1, i + 1));

  // ── NDVI legend items (for map overlay legend) ─────────────────────────
  const LEGEND = [
    { color: "#ef4444", label: "< 0.20 — критич." },
    { color: "#f97316", label: "0.20–0.40 — низкий" },
    { color: "#f59e0b", label: "0.40–0.55 — умер." },
    { color: "#84cc16", label: "0.55–0.70 — хор." },
    { color: "#10b981", label: "> 0.70 — отлично" },
  ];

  return (
    <div className="space-y-4">

      {/* ── Leaflet map card ─────────────────────────────────────────────── */}
      <div className="glass-card rounded-xl overflow-hidden">

        {/* Map header with date slider */}
        <div className="px-5 py-3 border-b border-border flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center">
              <Icon name="Map" size={14} className="text-primary" />
            </div>
            <h2 className="font-heading font-semibold text-sm text-foreground">
              Интерактивная карта NDVI · Россия
            </h2>
            {!mapReady && summary.length > 0 && (
              <span className="flex items-center gap-1 text-xs text-muted-foreground animate-pulse">
                <Icon name="Loader2" size={12} className="animate-spin" />
                Загрузка карты…
              </span>
            )}
          </div>

          {/* Date slider */}
          <div className="flex items-center gap-1 bg-secondary rounded-xl p-1">
            <button
              onClick={prevMonth}
              disabled={monthIdx === 0}
              className="w-7 h-7 rounded-lg flex items-center justify-center text-muted-foreground
                hover:text-foreground hover:bg-background disabled:opacity-30 transition-all"
            >
              <Icon name="ChevronLeft" size={14} />
            </button>
            <div className="flex items-center gap-1.5 px-3">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-xs font-mono font-semibold text-foreground min-w-[96px] text-center">
                {MONTHS[monthIdx]}
              </span>
            </div>
            <button
              onClick={nextMonth}
              disabled={monthIdx === MONTHS.length - 1}
              className="w-7 h-7 rounded-lg flex items-center justify-center text-muted-foreground
                hover:text-foreground hover:bg-background disabled:opacity-30 transition-all"
            >
              <Icon name="ChevronRight" size={14} />
            </button>
          </div>
        </div>

        {/* Map container */}
        <div className="relative">
          <div
            ref={containerRef}
            style={{ height: 440, width: "100%" }}
            className="z-0"
          />

          {/* NDVI legend overlay */}
          {mapReady && (
            <div className="absolute bottom-3 left-3 z-[1000] bg-white/90 backdrop-blur-sm
              border border-border rounded-xl px-3 py-2.5 shadow-sm space-y-1.5">
              <p className="text-[9px] font-mono uppercase tracking-widest text-muted-foreground font-semibold mb-1">
                NDVI
              </p>
              {LEGEND.map(l => (
                <div key={l.color} className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: l.color }} />
                  <span className="text-[10px] text-foreground/80 font-mono">{l.label}</span>
                </div>
              ))}
            </div>
          )}

          {/* Selected region badge overlay */}
          {mapReady && (() => {
            const sel = summary.find(r => r.region_id === selectedRegion);
            if (!sel) return null;
            const color = ndviColor(sel.ndvi);
            return (
              <div className="absolute top-3 right-3 z-[1000] bg-white/90 backdrop-blur-sm
                border border-border rounded-xl px-3 py-2 shadow-sm min-w-[140px]">
                <p className="text-[9px] font-mono uppercase tracking-wider text-muted-foreground mb-1">
                  Выбран регион
                </p>
                <p className="font-heading font-bold text-xs text-foreground">{sel.name}</p>
                <div className="flex items-center gap-1.5 mt-1">
                  <span className="w-2 h-2 rounded-full shrink-0" style={{ background: color }} />
                  <span className="text-sm font-black font-mono" style={{ color }}>{sel.ndvi.toFixed(2)}</span>
                  <span className="text-[10px] text-muted-foreground">{ndviLabel(sel.ndvi)}</span>
                </div>
                <p className={`text-[10px] font-mono font-semibold mt-0.5
                  ${sel.anomaly_pct < 0 ? "text-red-500" : "text-emerald-600"}`}>
                  {sel.anomaly_pct > 0 ? "+" : ""}{sel.anomaly_pct.toFixed(1)}% к норме
                </p>
              </div>
            );
          })()}

          {/* Empty / loading overlay when no data yet */}
          {summary.length === 0 && (
            <div className="absolute inset-0 z-[1000] flex items-center justify-center
              bg-background/70 backdrop-blur-sm">
              <div className="flex flex-col items-center gap-3 text-muted-foreground">
                <Icon name="Satellite" size={28} className="text-primary animate-pulse" />
                <p className="text-sm font-medium">Загрузка данных Sentinel-2…</p>
              </div>
            </div>
          )}
        </div>

        {/* Map footer */}
        <div className="px-5 py-2.5 bg-secondary/40 border-t border-border
          flex flex-wrap items-center gap-4 text-[10px] text-muted-foreground">
          <span className="flex items-center gap-1">
            <Icon name="Satellite" size={10} className="text-primary/60" />
            Sentinel-2 (ESA) · 10 м/пиксель
          </span>
          <span className="flex items-center gap-1">
            <Icon name="RefreshCw" size={10} />
            Обновление каждые 5 дней
          </span>
          <span className="flex items-center gap-1">
            <Icon name="MapPin" size={10} />
            {summary.length} регионов
          </span>
          <span className="ml-auto flex items-center gap-1">
            <Icon name="Info" size={10} />
            Нажмите маркер для деталей региона
          </span>
        </div>
      </div>

      {/* ── Cards grid (keep existing) ───────────────────────────────────── */}
      <div className="glass-card rounded-xl p-5">
        <div className="flex items-center gap-2 mb-5">
          <Icon name="LayoutGrid" size={15} className="text-primary" />
          <h2 className="font-semibold text-sm">
            Рейтинг регионов · NDVI апрель 2026
          </h2>
          <span className="ml-auto text-[10px] text-muted-foreground font-mono">
            сортировка: NDVI ↓
          </span>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {[...summary].sort((a, b) => b.ndvi - a.ndvi).map(r => (
            <button
              key={r.region_id}
              onClick={() => onSelectRegion(r.region_id)}
              className={`p-4 rounded-xl border text-left transition-all hover:scale-[1.02] hover:shadow-sm
                ${selectedRegion === r.region_id
                  ? "border-primary/40 shadow-md ring-1 ring-primary/20"
                  : "border-border hover:border-primary/25"}`}
              style={{ background: ndviColor(r.ndvi) + "12" }}
            >
              <div className="flex items-start justify-between mb-2">
                <div>
                  <div className="text-xs font-semibold text-foreground leading-tight">{r.name}</div>
                  <div className="text-[10px] text-muted-foreground mt-0.5">{r.phase}</div>
                </div>
                <div className="text-right shrink-0 ml-1">
                  <div className="text-xl font-bold font-mono leading-tight" style={{ color: ndviColor(r.ndvi) }}>
                    {r.ndvi.toFixed(2)}
                  </div>
                  <div className="text-[10px] font-mono" style={{ color: ndviColor(r.ndvi) }}>
                    {ndviLabel(r.ndvi)}
                  </div>
                </div>
              </div>
              <div className="h-1.5 bg-border rounded-full mb-2">
                <div
                  className="h-full rounded-full transition-all"
                  style={{ width: `${r.ndvi * 100}%`, background: ndviColor(r.ndvi) }}
                />
              </div>
              <div className="flex justify-between text-[10px] text-muted-foreground">
                <span>Ист. {r.ndvi_hist.toFixed(2)}</span>
                <span className={r.anomaly_pct < 0 ? "text-destructive font-bold" : "text-primary font-bold"}>
                  {r.anomaly_pct > 0 ? "+" : ""}{r.anomaly_pct.toFixed(1)}%
                </span>
                <span>~{r.yield_forecast} ц/га</span>
              </div>
              {r.anomaly_alerts > 0 && (
                <div className="mt-2 flex items-center gap-1 text-[10px] text-destructive">
                  <Icon name="AlertTriangle" size={9} />
                  {r.anomaly_alerts} предупр.
                </div>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* ── Comparison bars (keep existing) ─────────────────────────────── */}
      <div className="glass-card rounded-xl p-5">
        <div className="flex items-center gap-2 mb-4">
          <Icon name="BarChart3" size={15} className="text-primary" />
          <h2 className="font-semibold text-sm">
            Сравнение с историческим средним (2020–2024)
          </h2>
        </div>
        <div className="space-y-3">
          {[...summary].sort((a, b) => a.anomaly_pct - b.anomaly_pct).map(r => (
            <div
              key={r.region_id}
              className="flex items-center gap-3 cursor-pointer hover:bg-secondary/30
                rounded-lg p-1.5 transition-colors"
              onClick={() => onSelectRegion(r.region_id)}
            >
              <div className="w-28 text-xs text-muted-foreground shrink-0 leading-tight">
                {r.name}
              </div>
              <div className="flex-1 relative h-6 bg-border rounded-md overflow-hidden">
                <div
                  className="h-full rounded-md transition-all duration-700"
                  style={{ width: `${r.ndvi * 100}%`, background: ndviColor(r.ndvi) + "80" }}
                />
                <div
                  className="absolute inset-y-0 flex items-center px-2 text-[10px] font-mono font-bold"
                  style={{ color: ndviColor(r.ndvi) }}
                >
                  {r.ndvi.toFixed(2)} / норма {r.ndvi_hist.toFixed(2)}
                </div>
              </div>
              <div
                className={`w-14 text-xs font-mono font-bold text-right
                  ${r.anomaly_pct < -10 ? "text-destructive" : r.anomaly_pct < 0 ? "text-accent" : "text-primary"}`}
              >
                {r.anomaly_pct > 0 ? "+" : ""}{r.anomaly_pct.toFixed(1)}%
              </div>
              <div className="w-20 text-[10px] text-muted-foreground text-right">
                {r.yield_forecast} ц/га
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}