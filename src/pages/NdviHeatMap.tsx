import Icon from "@/components/ui/icon";
import { RegionSummary, ndviColor, ndviLabel } from "./NdviTypes";

interface NdviHeatMapProps {
  summary: RegionSummary[];
  selectedRegion: string;
  onSelectRegion: (id: string) => void;
}

export default function NdviHeatMap({ summary, selectedRegion, onSelectRegion }: NdviHeatMapProps) {
  return (
    <div className="space-y-4">
      <div className="glass-card rounded-xl p-5">
        <div className="flex items-center gap-2 mb-5">
          <Icon name="Map" size={15} className="text-primary" />
          <h2 className="font-semibold text-sm">Тепловая карта NDVI · Поволжье · апрель 2025</h2>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {[...summary].sort((a, b) => b.ndvi - a.ndvi).map((r) => (
            <button key={r.region_id} onClick={() => onSelectRegion(r.region_id)}
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
          {[...summary].sort((a, b) => a.anomaly_pct - b.anomaly_pct).map((r) => (
            <div key={r.region_id} className="flex items-center gap-3 cursor-pointer hover:bg-secondary/30 rounded-lg p-1.5 transition-colors"
              onClick={() => onSelectRegion(r.region_id)}>
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
  );
}
