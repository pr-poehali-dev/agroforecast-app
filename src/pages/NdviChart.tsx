import Icon from "@/components/ui/icon";
import { SeriesPoint, RegionSummary, REGION_NAMES, ndviColor } from "./NdviTypes";

interface NdviChartProps {
  series: SeriesPoint[];
  selectedRegion: string;
  sel: RegionSummary | undefined;
  detailLoading: boolean;
}

export default function NdviChart({ series, selectedRegion, sel, detailLoading }: NdviChartProps) {
  const chartSeries = series.slice(0, 18);
  const cw = 600; const ch = 150;
  const px = (i: number) => chartSeries.length > 1 ? (i / (chartSeries.length - 1)) * cw : 0;
  const py = (v: number) => ch - (v / 1.0) * ch;
  const currentPts = chartSeries.map((d, i) => `${px(i)},${py(d.ndvi_current)}`).join(" ");
  const histPts    = chartSeries.map((d, i) => `${px(i)},${py(d.ndvi_hist_avg)}`).join(" ");
  const forecastI  = chartSeries.findIndex(d => d.is_forecast);

  return (
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
  );
}
