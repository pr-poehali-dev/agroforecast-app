import Icon from "@/components/ui/icon";
import { AiTableRow } from "../ForecastsTypes";
import { LivePrice } from "./LiveQuotesPanel";

// ── Сводная таблица (демо-модель) ──────────────────────────────────────────
export default function ForecastsSummaryTable({
  tableData, livePriceMap, setSelectedCrop, aiTable, aiTableLoading,
}: {
  tableData: AiTableRow[];
  livePriceMap: Record<string, LivePrice>;
  setSelectedCrop: (crop: string) => void;
  aiTable: AiTableRow[];
  aiTableLoading: boolean;
}) {
  // ── Сводная таблица ──
  return (
    <div className="glass-card rounded-2xl overflow-hidden">
      <div className="px-6 pt-5 pb-4 border-b border-border flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-primary/15 flex items-center justify-center">
            <Icon name="Table" size={15} className="text-primary" />
          </div>
          <div>
            <div className="font-heading font-bold text-sm text-foreground">Сводная таблица (демо-модель)</div>
            <div className="text-[11px] text-muted-foreground">иллюстрация · проверенный прогноз — в блоке выше</div>
          </div>
          {aiTableLoading ? (
            <span className="text-[10px] text-muted-foreground animate-pulse flex items-center gap-1 bg-secondary px-2 py-0.5 rounded-full ml-1">
              <Icon name="Loader" size={9} />обновляю...
            </span>
          ) : aiTable.length > 0 ? (
            <span className="text-[10px] text-primary bg-primary/10 border border-primary/20 px-2 py-0.5 rounded-full font-mono flex items-center gap-1 ml-1">
              <Icon name="Info" size={9} />демо
            </span>
          ) : null}
        </div>
      </div>
      <div className={`overflow-x-auto transition-opacity ${aiTableLoading ? "opacity-60" : ""}`}>
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-secondary/40">
              {["Культура", "Цена сейчас", "Демо-оценка", "Изменение", "Уверенность (демо)", "Урожайность"].map(h => (
                <th key={h} className="text-left text-[11px] text-muted-foreground font-semibold py-3 px-4 first:pl-6 last:pr-6 uppercase tracking-wide">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {tableData.map((f, i) => {
              const lp = livePriceMap[f.crop];
              return (
                <tr key={i}
                  className={`border-b border-border/50 hover:bg-primary/4 transition-colors cursor-pointer group ${i % 2 === 0 ? "" : "bg-secondary/20"}`}
                  onClick={() => setSelectedCrop(f.crop)}>
                  <td className="py-3.5 px-4 pl-6">
                    <div className="flex items-center gap-2">
                      <span className={`w-1 h-8 rounded-full ${f.trend === "up" ? "bg-primary" : "bg-destructive"} opacity-0 group-hover:opacity-100 transition-opacity`} />
                      <div>
                        <span className="font-semibold text-foreground font-body">{f.crop}</span>
                        {lp && !lp.is_fallback && (
                          <span className="ml-1.5 text-[9px] text-emerald-600 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded-full font-mono">live</span>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="py-3.5 px-4">
                    <div className="font-mono text-muted-foreground text-xs">
                      {f.currentPrice.toLocaleString()} ₽
                    </div>
                    {lp && lp.change ? (
                      <div className={`text-[10px] font-mono flex items-center gap-0.5 mt-0.5
                        ${lp.trend === "up" ? "text-emerald-600" : "text-red-500"}`}>
                        <Icon name={lp.trend === "up" ? "TrendingUp" : "TrendingDown"} size={8} />
                        {lp.trend === "up" ? "+" : "−"}{Math.abs(lp.change).toLocaleString("ru")} ₽/{lp.change_period}
                      </div>
                    ) : null}
                  </td>
                  <td className="py-3.5 px-4 font-mono font-bold text-foreground">{f.forecastPrice.toLocaleString()} ₽</td>
                  <td className="py-3.5 px-4">
                    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-bold
                      ${f.trend === "up" ? "bg-primary/12 text-primary" : "bg-destructive/12 text-destructive"}`}>
                      <Icon name={f.trend === "up" ? "TrendingUp" : "TrendingDown"} size={10} />
                      {f.change > 0 ? "+" : ""}{typeof f.change === "number" ? f.change.toFixed(1) : f.change}%
                    </span>
                  </td>
                  <td className="py-3.5 px-4">
                    <div className="flex items-center gap-2">
                      <div className="w-16 h-1.5 bg-border rounded-full overflow-hidden">
                        <div className="h-full progress-bar-gold rounded-full" style={{ width: `${f.confidence}%` }} />
                      </div>
                      <span className="font-mono text-xs text-muted-foreground">
                        {typeof f.confidence === "number" ? f.confidence.toFixed(0) : f.confidence}%
                      </span>
                    </div>
                  </td>
                  <td className="py-3.5 px-4 pr-6">
                    <span className={`font-mono text-xs font-bold ${f.yieldForecast > f.yield ? "text-primary" : "text-destructive"}`}>
                      {typeof f.yieldForecast === "number" ? f.yieldForecast.toFixed(1) : f.yieldForecast} ц/га
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
