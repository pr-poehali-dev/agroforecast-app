import Icon from "@/components/ui/icon";
import { RegionForecast, riskColor, riskLabel, REGION_NAMES } from "./AiModelTypes";

interface AiModelAllTabProps {
  allRegions: RegionForecast[];
  crop: string;
  horizon: number;
  onSelectRegion: (id: string) => void;
}

export default function AiModelAllTab({ allRegions, crop, horizon, onSelectRegion }: AiModelAllTabProps) {
  return (
    <div className="space-y-4">
      <div className="glass-card rounded-xl overflow-hidden">
        <div className="p-4 border-b border-border flex items-center gap-2">
          <Icon name="Globe" size={14} className="text-primary" />
          <span className="text-sm font-semibold">{crop} · горизонт {horizon} мес · все регионы</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-secondary/30">
                {["Регион", "Урожай ц/га", "Цена ₽/т", "Изм. %", "Риск", "Реком."].map(h => (
                  <th key={h} className="text-left text-xs text-muted-foreground font-medium py-2.5 px-4">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {allRegions.map((r, i) => (
                <tr key={i} onClick={() => onSelectRegion(r.region_id)}
                  className="border-b border-border/40 hover:bg-secondary/30 transition-colors cursor-pointer">
                  <td className="py-3 px-4 font-medium">{REGION_NAMES[r.region_id]}</td>
                  <td className="py-3 px-4">
                    <div className="font-mono font-bold text-primary">{r.yield_cha}</div>
                    <div className="text-[10px] text-muted-foreground">{r.yield_low}–{r.yield_high}</div>
                  </td>
                  <td className="py-3 px-4 font-mono">{r.price_rub_t.toLocaleString()}</td>
                  <td className={`py-3 px-4 font-mono font-bold ${r.price_change_pct > 0 ? "text-primary" : "text-destructive"}`}>
                    {r.price_change_pct > 0 ? "+" : ""}{r.price_change_pct}%
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      <div className="w-16 h-2 bg-border rounded-full">
                        <div className="h-full rounded-full transition-all" style={{ width: `${r.total_risk_pct}%`, backgroundColor: riskColor(r.total_risk_level) }} />
                      </div>
                      <span className="text-xs font-mono font-bold" style={{ color: riskColor(r.total_risk_level) }}>{r.total_risk_pct}%</span>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <span className="text-[10px] text-muted-foreground">{r.recommendations.length > 0 ? r.recommendations[0].text.slice(0, 42) + "…" : "—"}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Risk heatmap bars */}
      <div className="glass-card rounded-xl p-5">
        <div className="flex items-center gap-2 mb-4">
          <Icon name="Thermometer" size={14} className="text-primary" />
          <span className="text-sm font-semibold">Тепловая карта рисков по регионам</span>
        </div>
        <div className="space-y-2.5">
          {allRegions.map((r, i) => (
            <div key={i} className="flex items-center gap-3">
              <div className="w-28 text-xs text-muted-foreground shrink-0">{REGION_NAMES[r.region_id]}</div>
              <div className="flex-1 h-5 bg-border rounded-md relative overflow-hidden">
                <div className="h-full rounded-md transition-all duration-700"
                  style={{ width: `${r.total_risk_pct}%`, backgroundColor: riskColor(r.total_risk_level) + "90" }} />
                <div className="absolute inset-y-0 flex items-center px-2 text-[10px] font-mono font-bold"
                  style={{ color: riskColor(r.total_risk_level) }}>
                  {r.total_risk_pct}% {riskLabel(r.total_risk_level)}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
