import { useState, useEffect } from "react";
import Icon from "@/components/ui/icon";

const NDVI_URL = "https://functions.poehali.dev/8612f76e-67f1-4185-856e-5fd372e40e23";

function ndviColor(v: number) {
  if (v < 0.20) return "#ef4444";
  if (v < 0.40) return "#f97316";
  if (v < 0.55) return "#f59e0b";
  if (v < 0.70) return "#84cc16";
  return "#10b981";
}
function ndviLabel(v: number) {
  if (v < 0.20) return "Критически низкий";
  if (v < 0.40) return "Низкий";
  if (v < 0.55) return "Умеренный";
  if (v < 0.70) return "Хороший";
  return "Отличный";
}

interface RegionSummary {
  region_id: string; name: string;
  ndvi: number; ndvi_hist: number; ndvi_peak: number;
  anomaly_pct: number; label: string; color: string;
  phase: string; rain_mm: number; temp_c: number; cloud_pct: number;
  area_kha: number; yield_forecast: number; yield_low: number; yield_high: number;
  anomaly_alerts: number;
}

interface RegionDetail {
  region_id: string; name: string; generated_at: string;
  source: string; ndvi: number; ndvi_calc: number; ndvi_formula: string;
  ndvi_hist_avg: number; ndvi_peak_last_season: number;
  anomaly_pct: number; label: string; color: string;
  phase: string; phase_day: number;
  rain_mm: number; temp_c: number; cloud_pct: number; area_kha: number;
  crop_structure: { wheat_pct: number; sunflower_pct: number; corn_pct: number; barley_pct: number };
  yield_forecast: { yield_cha: number; yield_low: number; yield_high: number; ndvi_peak_forecast: number; mape_pct: number };
  alerts: { type: string; icon: string; title: string; desc: string; action: string }[];
}

interface SeriesPoint {
  week: number; date: string; label: string;
  ndvi_current: number; ndvi_hist_avg: number; is_forecast: boolean;
}

const REGION_NAMES: Record<string, string> = {
  samara: "Самарская", saratov: "Саратовская", volgograd: "Волгоградская",
  ulyanovsk: "Ульяновская", penza: "Пензенская", orenburg: "Оренбургская",
  tatarstan: "Татарстан", bashkortostan: "Башкортостан",
};

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

  // Chart dimensions
  const chartSeries = series.slice(0, 18);
  const cw = 600; const ch = 150;
  const px = (i: number) => chartSeries.length > 1 ? (i / (chartSeries.length - 1)) * cw : 0;
  const py = (v: number) => ch - (v / 1.0) * ch;
  const currentPts = chartSeries.map((d, i) => `${px(i)},${py(d.ndvi_current)}`).join(" ");
  const histPts    = chartSeries.map((d, i) => `${px(i)},${py(d.ndvi_hist_avg)}`).join(" ");
  const forecastI  = chartSeries.findIndex(d => d.is_forecast);

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

      {/* ── Тепловая карта ── */}
      {tab === "map" && !loading && (
        <div className="space-y-4">
          <div className="glass-card rounded-xl p-5">
            <div className="flex items-center gap-2 mb-5">
              <Icon name="Map" size={15} className="text-primary" />
              <h2 className="font-semibold text-sm">Тепловая карта NDVI · Поволжье · апрель 2025</h2>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {[...summary].sort((a, b) => b.ndvi - a.ndvi).map((r, i) => (
                <button key={r.region_id} onClick={() => { setSelectedRegion(r.region_id); setTab("detail"); }}
                  className={`p-4 rounded-xl border text-left transition-all hover:scale-[1.02]
                    ${selectedRegion === r.region_id ? "border-primary/40 shadow-md" : "border-border hover:border-primary/25"}`}
                  style={{ background: ndviColor(r.ndvi) + "12" }}>
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <div className="text-xs font-semibold text-foreground">{r.name}</div>
                      <div className="text-[10px] text-muted-foreground">{r.phase}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-xl font-bold font-mono" style={{ color: ndviColor(r.ndvi) }}>{r.ndvi.toFixed(2)}</div>
                      <div className="text-[10px] font-mono" style={{ color: ndviColor(r.ndvi) }}>{ndviLabel(r.ndvi)}</div>
                    </div>
                  </div>
                  <div className="h-1.5 bg-border rounded-full mb-2">
                    <div className="h-full rounded-full transition-all" style={{ width: `${r.ndvi * 100}%`, background: ndviColor(r.ndvi) }} />
                  </div>
                  <div className="flex justify-between text-[10px] text-muted-foreground">
                    <span>Ист. {r.ndvi_hist.toFixed(2)}</span>
                    <span className={r.anomaly_pct < 0 ? "text-destructive font-bold" : "text-primary font-bold"}>
                      {r.anomaly_pct > 0 ? "+" : ""}{r.anomaly_pct.toFixed(1)}%
                    </span>
                    <span>Урожай ~{r.yield_forecast} ц/га</span>
                  </div>
                  {r.anomaly_alerts > 0 && (
                    <div className="mt-2 flex items-center gap-1 text-[10px] text-destructive">
                      <Icon name="AlertTriangle" size={9} />{r.anomaly_alerts} предупр.
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Рейтинг + сравнение с нормой */}
          <div className="glass-card rounded-xl p-5">
            <div className="flex items-center gap-2 mb-4">
              <Icon name="BarChart3" size={15} className="text-primary" />
              <h2 className="font-semibold text-sm">Сравнение с историческим средним (2020–2024)</h2>
            </div>
            <div className="space-y-3">
              {[...summary].sort((a, b) => a.anomaly_pct - b.anomaly_pct).map((r, i) => (
                <div key={r.region_id} className="flex items-center gap-3 cursor-pointer hover:bg-secondary/30 rounded-lg p-1.5 transition-colors"
                  onClick={() => { setSelectedRegion(r.region_id); setTab("detail"); }}>
                  <div className="w-28 text-xs text-muted-foreground shrink-0">{r.name}</div>
                  <div className="flex-1 relative h-6 bg-border rounded-md overflow-hidden">
                    <div className="h-full rounded-md transition-all duration-700"
                      style={{ width: `${r.ndvi * 100}%`, background: ndviColor(r.ndvi) + "80" }} />
                    <div className="absolute inset-y-0 flex items-center px-2 text-[10px] font-mono font-bold" style={{ color: ndviColor(r.ndvi) }}>
                      {r.ndvi.toFixed(2)} / норма {r.ndvi_hist.toFixed(2)}
                    </div>
                  </div>
                  <div className={`w-14 text-xs font-mono font-bold text-right ${r.anomaly_pct < -10 ? "text-destructive" : r.anomaly_pct < 0 ? "text-accent" : "text-primary"}`}>
                    {r.anomaly_pct > 0 ? "+" : ""}{r.anomaly_pct.toFixed(1)}%
                  </div>
                  <div className="w-20 text-[10px] text-muted-foreground text-right">{r.yield_forecast} ц/га</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── Динамика NDVI (график) ── */}
      {tab === "chart" && (
        <div className="glass-card rounded-xl p-6">
          <div className="flex items-start justify-between mb-5 flex-wrap gap-3">
            <div>
              <div className="flex items-center gap-2">
                <Icon name="TrendingUp" size={15} className="text-primary" />
                <h2 className="font-semibold">{REGION_NAMES[selectedRegion]} — динамика NDVI 2025</h2>
              </div>
              <p className="text-xs text-muted-foreground mt-1">Sentinel-2 · обновление каждые 5 дней · сравнение со средним 2020–2024</p>
            </div>
            <div className="flex gap-4 text-xs text-muted-foreground">
              <span className="flex items-center gap-1.5"><span className="w-6 h-0.5 bg-primary inline-block" />2025 (текущий)</span>
              <span className="flex items-center gap-1.5"><span className="w-6 border-t-2 border-dashed border-muted-foreground inline-block" />2020–2024 среднее</span>
              <span className="flex items-center gap-1.5"><span className="w-6 h-0.5 border-t-2 border-dashed border-accent inline-block" />Прогноз</span>
            </div>
          </div>

          {detailLoading ? (
            <div className="h-48 bg-secondary/30 rounded-xl animate-pulse flex items-center justify-center text-xs text-muted-foreground">Загрузка данных...</div>
          ) : (
            <div className="w-full overflow-x-auto">
              <svg viewBox={`0 0 ${cw} ${ch + 40}`} className="w-full">
                <defs>
                  <linearGradient id="ndviGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#10b981" stopOpacity="0.25" />
                    <stop offset="100%" stopColor="#10b981" stopOpacity="0" />
                  </linearGradient>
                </defs>
                {/* Grid */}
                {[0, 0.2, 0.4, 0.6, 0.8, 1.0].map((v, i) => (
                  <g key={i}>
                    <line x1="0" y1={py(v)} x2={cw} y2={py(v)} stroke="rgba(0,0,0,0.05)" strokeWidth="1" />
                    <text x={cw + 4} y={py(v) + 4} fontSize="9" fill="rgba(0,0,0,0.3)" fontFamily="IBM Plex Mono">{v.toFixed(1)}</text>
                  </g>
                ))}
                {/* Forecast zone */}
                {forecastI >= 0 && (
                  <rect x={px(forecastI)} y="0" width={cw - px(forecastI)} height={ch} fill="rgba(245,158,11,0.05)" />
                )}
                {/* Area */}
                {currentPts && (
                  <path d={`M 0,${ch} L ${currentPts} L ${px(chartSeries.length - 1)},${ch} Z`} fill="url(#ndviGrad)" />
                )}
                {/* Current */}
                {currentPts && (
                  <polyline points={currentPts} fill="none" stroke="#10b981" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                )}
                {/* Historical */}
                {histPts && (
                  <polyline points={histPts} fill="none" stroke="rgba(0,0,0,0.25)" strokeWidth="1.5" strokeDasharray="4,3" strokeLinecap="round" />
                )}
                {/* Dots */}
                {chartSeries.map((d, i) => (
                  <circle key={i} cx={px(i)} cy={py(d.ndvi_current)} r={d.is_forecast ? 3 : 4}
                    fill={d.is_forecast ? "#f59e0b" : ndviColor(d.ndvi_current)} stroke="white" strokeWidth="1.5" />
                ))}
                {/* Labels */}
                {chartSeries.filter((_, i) => i % 2 === 0).map((d, i) => (
                  <text key={i} x={px(i * 2)} y={ch + 20} textAnchor="middle" fill="rgba(0,0,0,0.35)" fontSize="9" fontFamily="IBM Plex Mono">{d.label}</text>
                ))}
                {/* Phase labels */}
                {sel && (
                  <text x={cw / 2} y={ch + 35} textAnchor="middle" fill="rgba(0,0,0,0.4)" fontSize="10" fontFamily="Golos Text">
                    Текущая фаза: {sel.phase} · NDVI {sel.ndvi.toFixed(2)}
                  </text>
                )}
              </svg>
            </div>
          )}

          {/* Фазы развития */}
          <div className="mt-5 border-t border-border pt-4">
            <div className="text-xs font-medium text-muted-foreground mb-3 uppercase tracking-wide">Фазы развития озимой пшеницы и целевые значения NDVI</div>
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
              {[
                { phase: "Всходы",      target: "0.15–0.30", color: "#94a3b8" },
                { phase: "Кущение",     target: "0.45–0.65", color: "#f59e0b" },
                { phase: "В трубку",    target: "0.60–0.75", color: "#84cc16" },
                { phase: "Колошение",   target: "0.75–0.90", color: "#10b981" },
                { phase: "Налив зерна", target: "0.65–0.82", color: "#22c55e" },
                { phase: "Созревание",  target: "0.25–0.55", color: "#f97316" },
              ].map((p, i) => (
                <div key={i} className="bg-secondary/40 rounded-lg p-2 text-center">
                  <div className="text-[10px] font-medium text-foreground mb-1">{p.phase}</div>
                  <div className="text-[10px] font-mono font-bold" style={{ color: p.color }}>{p.target}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── Детали региона ── */}
      {tab === "detail" && (
        <div className="space-y-4">
          {detailLoading ? (
            <div className="h-48 glass-card rounded-xl animate-pulse" />
          ) : detail ? (
            <>
              {/* Header card */}
              <div className="glass-card rounded-xl p-6">
                <div className="flex flex-wrap items-start justify-between gap-4 mb-5">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <Icon name="MapPin" size={16} style={{ color: detail.color }} />
                      <h2 className="text-lg font-bold text-foreground">{detail.name} обл.</h2>
                      <span className="px-2 py-0.5 text-[10px] font-mono rounded border" style={{ background: detail.color + "20", color: detail.color, borderColor: detail.color + "40" }}>{detail.label}</span>
                    </div>
                    <div className="text-xs text-muted-foreground font-mono">{detail.source} · {detail.generated_at?.slice(0, 16).replace("T", " ")}</div>
                  </div>
                  <div className="flex gap-3">
                    <div className="text-center p-3 rounded-xl border" style={{ background: detail.color + "12", borderColor: detail.color + "40" }}>
                      <div className="text-3xl font-bold font-mono" style={{ color: detail.color }}>{detail.ndvi.toFixed(2)}</div>
                      <div className="text-[10px] text-muted-foreground">NDVI текущий</div>
                    </div>
                    <div className="text-center p-3 rounded-xl border border-border bg-secondary/40">
                      <div className="text-3xl font-bold font-mono text-muted-foreground">{detail.ndvi_hist_avg.toFixed(2)}</div>
                      <div className="text-[10px] text-muted-foreground">Норма 5 лет</div>
                    </div>
                    <div className="text-center p-3 rounded-xl border border-primary/25 bg-primary/10">
                      <div className={`text-3xl font-bold font-mono ${detail.anomaly_pct < 0 ? "text-destructive" : "text-primary"}`}>
                        {detail.anomaly_pct > 0 ? "+" : ""}{detail.anomaly_pct.toFixed(1)}%
                      </div>
                      <div className="text-[10px] text-muted-foreground">Откл. от нормы</div>
                    </div>
                  </div>
                </div>

                {/* Формула NDVI */}
                <div className="bg-secondary/50 rounded-xl p-4 border border-border mb-5">
                  <div className="text-[10px] text-muted-foreground font-mono uppercase tracking-wide mb-2">Расчёт NDVI (Sentinel-2, Band 4 Red + Band 8 NIR)</div>
                  <div className="font-mono text-sm text-foreground font-bold">{detail.ndvi_formula}</div>
                  <div className="text-xs text-muted-foreground mt-1.5">NIR = отражение в ближнем ИК диапазоне · Red = отражение в красном диапазоне</div>
                </div>

                <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {[
                    { label: "Фаза развития", value: detail.phase, icon: "Sprout" },
                    { label: "День сезона", value: `${detail.phase_day} день`, icon: "Calendar" },
                    { label: "Осадки/мес", value: `${detail.rain_mm} мм`, icon: "Droplets" },
                    { label: "Температура", value: `+${detail.temp_c}°C`, icon: "Thermometer" },
                  ].map((s, i) => (
                    <div key={i} className="bg-secondary/30 rounded-xl p-3 flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-primary/15 text-primary flex items-center justify-center shrink-0">
                        <Icon name={s.icon as string} size={14} />
                      </div>
                      <div>
                        <div className="text-[10px] text-muted-foreground">{s.label}</div>
                        <div className="text-sm font-semibold text-foreground">{s.value}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Прогноз урожайности */}
              <div className="grid lg:grid-cols-2 gap-4">
                <div className="glass-card rounded-xl p-5">
                  <div className="flex items-center gap-2 mb-4">
                    <Icon name="Wheat" size={15} className="text-primary" />
                    <h3 className="font-semibold text-sm">Прогноз урожайности по NDVI</h3>
                    <span className="ml-auto text-[10px] font-mono text-muted-foreground">MAPE ±{detail.yield_forecast.mape_pct}%</span>
                  </div>
                  <div className="text-4xl font-bold font-mono text-primary mb-1">
                    {detail.yield_forecast.yield_cha} <span className="text-lg font-normal text-muted-foreground">ц/га</span>
                  </div>
                  <div className="text-xs text-muted-foreground mb-4">
                    Диапазон: {detail.yield_forecast.yield_low} – {detail.yield_forecast.yield_high} ц/га
                  </div>
                  <div className="space-y-2 text-xs">
                    {[
                      { label: "Ожидаемый пиковый NDVI", value: detail.yield_forecast.ndvi_peak_forecast.toFixed(3) },
                      { label: "Пик прошлого сезона", value: detail.ndvi_peak_last_season.toFixed(2) },
                      { label: "Площадь пашни", value: `${detail.area_kha} тыс. га` },
                      { label: "Облачность (помехи)", value: `${detail.cloud_pct}%` },
                    ].map((r, i) => (
                      <div key={i} className="flex justify-between border-b border-border/40 pb-1.5">
                        <span className="text-muted-foreground">{r.label}</span>
                        <span className="font-mono font-semibold text-foreground">{r.value}</span>
                      </div>
                    ))}
                  </div>
                  <div className="mt-4 p-3 bg-primary/8 border border-primary/20 rounded-lg text-xs text-foreground">
                    <span className="font-semibold">Методология:</span> квадратичная регрессия NDVI→урожай, данные Минсельхоз РФ 2015–2024, корреляция r²=0.83
                  </div>
                </div>

                {/* Структура посевов */}
                <div className="glass-card rounded-xl p-5">
                  <div className="flex items-center gap-2 mb-4">
                    <Icon name="PieChart" size={15} className="text-primary" />
                    <h3 className="font-semibold text-sm">Структура посевных площадей</h3>
                  </div>
                  <div className="space-y-3">
                    {[
                      { label: "Пшеница озимая", pct: detail.crop_structure.wheat_pct, color: "#10b981" },
                      { label: "Подсолнечник",   pct: detail.crop_structure.sunflower_pct, color: "#f59e0b" },
                      { label: "Кукуруза",       pct: detail.crop_structure.corn_pct, color: "#f97316" },
                      { label: "Ячмень яровой",  pct: detail.crop_structure.barley_pct, color: "#84cc16" },
                      { label: "Прочие культуры", pct: 100 - detail.crop_structure.wheat_pct - detail.crop_structure.sunflower_pct - detail.crop_structure.corn_pct - detail.crop_structure.barley_pct, color: "#94a3b8" },
                    ].map((c, i) => (
                      <div key={i}>
                        <div className="flex justify-between text-xs mb-1">
                          <span className="text-foreground font-medium">{c.label}</span>
                          <span className="font-mono font-bold" style={{ color: c.color }}>{c.pct}%</span>
                        </div>
                        <div className="h-2 bg-border rounded-full">
                          <div className="h-full rounded-full transition-all duration-700" style={{ width: `${c.pct}%`, background: c.color }} />
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="mt-4 text-xs text-muted-foreground border-t border-border pt-3">
                    Общая площадь пашни: <span className="font-mono font-semibold text-foreground">{detail.area_kha} тыс. га</span>
                  </div>
                </div>
              </div>

              {/* Alerts / рекомендации */}
              {detail.alerts.length > 0 && (
                <div className="glass-card rounded-xl p-5">
                  <div className="flex items-center gap-2 mb-4">
                    <Icon name="Bell" size={15} className="text-accent" />
                    <h3 className="font-semibold text-sm">Аномалии и рекомендации</h3>
                  </div>
                  <div className="space-y-3">
                    {detail.alerts.map((a, i) => (
                      <div key={i} className={`flex gap-3 p-4 rounded-xl border
                        ${a.type === "critical" ? "bg-destructive/10 border-destructive/25" :
                          a.type === "warning" ? "bg-accent/8 border-accent/20" : "bg-secondary/40 border-border"}`}>
                        <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0
                          ${a.type === "critical" ? "bg-destructive/20 text-destructive" :
                            a.type === "warning" ? "bg-accent/20 text-accent" : "bg-primary/20 text-primary"}`}>
                          <Icon name={a.icon as string} size={15} />
                        </div>
                        <div className="flex-1">
                          <div className="text-sm font-semibold text-foreground mb-1">{a.title}</div>
                          <div className="text-xs text-muted-foreground mb-2">{a.desc}</div>
                          <div className="flex items-center gap-1.5 text-xs">
                            <Icon name="Zap" size={11} className="text-primary" />
                            <span className="font-medium text-primary">{a.action}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          ) : null}
        </div>
      )}
    </div>
  );
}