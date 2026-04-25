import { useState, useEffect } from "react";
import Icon from "@/components/ui/icon";
import { NDVI_URL, REGION_NAMES, ndviColor, RegionSummary, RegionDetail, SeriesPoint } from "./NdviTypes";
import NdviHeatMap from "./NdviHeatMap";
import NdviChart from "./NdviChart";
import NdviDetail from "./NdviDetail";

export default function SectionNdvi() {
  const [summary, setSummary] = useState<RegionSummary[]>([]);
  const [detail, setDetail] = useState<RegionDetail | null>(null);
  const [series, setSeries] = useState<SeriesPoint[]>([]);
  const [selectedRegion, setSelectedRegion] = useState("samara");
  const [loading, setLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);
  const [tab, setTab] = useState<"map" | "chart" | "detail">("map");

  // Load summary
  useEffect(() => {
    fetch(NDVI_URL).then(r => r.json())
      .then(d => { setSummary(d.regions || []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  // Load detail + series when region changes
  useEffect(() => {
    setDetailLoading(true);
    Promise.all([
      fetch(`${NDVI_URL}?region=${selectedRegion}`).then(r => r.json()),
      fetch(`${NDVI_URL}?region=${selectedRegion}&series=1`).then(r => r.json()),
    ]).then(([d, s]) => {
      setDetail(d);
      setSeries(s.series || []);
      setDetailLoading(false);
    }).catch(() => setDetailLoading(false));
  }, [selectedRegion]);

  const sel = summary.find(r => r.region_id === selectedRegion);

  return (
    <div className="space-y-6 animate-fade-in">

      {/* ── Hero-шапка ── */}
      <div className="hero-gradient rounded-2xl p-5 sm:p-6 relative overflow-hidden shadow-md">
        <div className="hero-gradient-overlay absolute inset-0" />
        <div className="bg-dots absolute inset-0 opacity-15" />
        <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <Icon name="Satellite" size={13} className="text-white/75" />
              <span className="text-white/60 text-xs font-mono uppercase tracking-widest">Спутниковый мониторинг</span>
            </div>
            <h1 className="font-heading font-black text-2xl sm:text-3xl text-white">
              NDVI-<span className="gold-text">мониторинг</span>
            </h1>
            <p className="text-white/60 text-sm mt-1 font-body">Sentinel-2 (ESA) · 10 м/пиксель · обновление каждые 5 дней</p>
          </div>
          <div className="flex gap-2 flex-wrap shrink-0">
            <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/15 border border-white/25 text-white text-xs font-mono">
              <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse-glow" />LIVE
            </span>
            <span className="px-3 py-1.5 rounded-full bg-white/15 border border-white/25 text-white/80 text-xs font-mono">
              NDVI = (NIR − Red) / (NIR + Red)
            </span>
            {!loading && summary.filter(r => r.anomaly_pct < -10).length > 0 && (
              <span className="px-3 py-1.5 rounded-full bg-destructive/30 border border-white/20 text-white text-xs font-bold">
                ⚠ {summary.filter(r => r.anomaly_pct < -10).length} аномалий
              </span>
            )}
          </div>
        </div>
      </div>

      {/* ── NDVI шкала ── */}
      <div className="glass-card rounded-xl p-4">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-7 h-7 rounded-lg bg-primary/15 flex items-center justify-center">
            <Icon name="Sliders" size={13} className="text-primary" />
          </div>
          <span className="text-xs font-semibold font-heading text-foreground">Шкала значений NDVI · апрель 2026</span>
        </div>
        <div className="flex gap-3 flex-wrap">
          {[
            { range: "< 0.10", label: "Вода / почва", color: "#64748b" },
            { range: "0.10–0.20", label: "Открытая почва", color: "#ef4444" },
            { range: "0.20–0.40", label: "Слабая расти.", color: "#f97316" },
            { range: "0.40–0.55", label: "Умеренная", color: "#f59e0b" },
            { range: "0.55–0.70", label: "Хорошая", color: "#84cc16" },
            { range: "> 0.70", label: "Оптимальная", color: "#2E7D32" },
          ].map((s, i) => (
            <div key={i} className="flex items-center gap-1.5 px-2.5 py-1.5 bg-background rounded-lg border border-border text-xs">
              <span className="w-3 h-3 rounded-full shrink-0" style={{ background: s.color }} />
              <span className="font-mono text-muted-foreground">{s.range}</span>
              <span className="text-foreground font-medium">{s.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Region selector */}
      <div className="flex gap-2 flex-wrap">
        {Object.entries(REGION_NAMES).map(([id, name]) => {
          const r = summary.find(s => s.region_id === id);
          return (
            <button key={id} onClick={() => setSelectedRegion(id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg border transition-all font-medium
                ${selectedRegion === id ? "bg-primary/15 text-primary border-primary/30" : "bg-secondary text-muted-foreground border-border hover:border-primary/30"}`}>
              {r && <span className="w-2 h-2 rounded-full shrink-0" style={{ background: ndviColor(r.ndvi) }} />}
              {name}
              {r && <span className="font-mono">{r.ndvi.toFixed(2)}</span>}
            </button>
          );
        })}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-secondary/50 p-1 rounded-xl w-fit">
        {(["map", "chart", "detail"] as const).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-1.5 text-xs rounded-lg font-medium transition-all
              ${tab === t ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}>
            {t === "map" ? "Тепловая карта" : t === "chart" ? "Динамика NDVI" : "Детали региона"}
          </button>
        ))}
      </div>

      {loading && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground animate-pulse">
          <Icon name="Satellite" size={14} className="text-primary" />Загрузка данных Sentinel-2...
        </div>
      )}

      {tab === "map" && !loading && (
        <NdviHeatMap
          summary={summary}
          selectedRegion={selectedRegion}
          onSelectRegion={(id) => { setSelectedRegion(id); setTab("detail"); }}
        />
      )}

      {tab === "chart" && (
        <NdviChart
          series={series}
          selectedRegion={selectedRegion}
          sel={sel}
          detailLoading={detailLoading}
        />
      )}

      {tab === "detail" && (
        <NdviDetail
          detail={detail}
          detailLoading={detailLoading}
        />
      )}
    </div>
  );
}
