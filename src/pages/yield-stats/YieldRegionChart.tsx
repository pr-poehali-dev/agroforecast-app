import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar, CartesianGrid, Legend, ReferenceLine } from "recharts";
import Icon from "@/components/ui/icon";
import { ForecastResp, HistoryPoint, REGION_ID_BY_NAME, RegionYield } from "./types";

interface Props {
  year: number;
  top10: RegionYield[];
  mapRows: RegionYield[];
  selectedRegionLabel: string | null;
  dbRegionName: string | null;
  history: HistoryPoint[];
  forecast: ForecastResp | null;
  loadingForecast: boolean;
  handleForecast: (refresh?: boolean) => void;
  chartData: Array<{ year: number; yield: number | null; forecast?: number | null }>;
  firstForecastYear: number | undefined;
}

export default function YieldRegionChart({
  year,
  top10,
  mapRows,
  selectedRegionLabel,
  dbRegionName,
  history,
  forecast,
  loadingForecast,
  handleForecast,
  chartData,
  firstForecastYear,
}: Props) {
  return (
    <>
      {top10.length > 0 && (
        <div>
          <div className="text-xs font-medium text-muted-foreground mb-2">ТОП-10 РЕГИОНОВ ПО УРОЖАЙНОСТИ ({year})</div>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={top10} layout="vertical" margin={{ left: 0, right: 16 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
              <XAxis type="number" stroke="hsl(var(--muted-foreground))" fontSize={10} />
              <YAxis dataKey="region" type="category" stroke="hsl(var(--muted-foreground))" fontSize={10} width={140} />
              <Tooltip
                contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }}
                formatter={(v: number) => [`${v} ц/га`, "Урожайность"]}
              />
              <Bar dataKey="yield" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      <div className="border-t border-border pt-4">
        <div className="flex items-center justify-between mb-2 flex-wrap gap-2">
          <div className="text-xs font-medium text-muted-foreground">
            ИСТОРИЯ УРОЖАЙНОСТИ {selectedRegionLabel ? `· ${selectedRegionLabel.toUpperCase()}` : "· ВЫБЕРИТЕ РЕГИОН НА КАРТЕ"}
          </div>
          {dbRegionName && (
            <button
              onClick={() => handleForecast(!!forecast)}
              disabled={loadingForecast}
              className="flex items-center gap-2 px-4 py-2 rounded-md bg-gradient-to-r from-primary to-accent text-primary-foreground text-xs font-semibold hover:opacity-90 transition disabled:opacity-50 shadow"
            >
              <Icon name={loadingForecast ? "Loader2" : "Sparkles"} size={14} className={loadingForecast ? "animate-spin" : ""} />
              {loadingForecast ? "ИИ анализирует..." : forecast ? "Обновить прогноз ИИ" : "ИИ-прогноз до 2030 года"}
            </button>
          )}
        </div>

        {dbRegionName && history.length > 0 ? (
          <>
            <ResponsiveContainer width="100%" height={240}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
                <XAxis dataKey="year" stroke="hsl(var(--muted-foreground))" fontSize={11} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} label={{ value: "ц/га", angle: -90, position: "insideLeft", fill: "hsl(var(--muted-foreground))", fontSize: 10 }} />
                <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                {firstForecastYear && <ReferenceLine x={firstForecastYear} stroke="hsl(var(--accent))" strokeDasharray="4 4" label={{ value: "Прогноз →", fontSize: 10, fill: "hsl(var(--accent))" }} />}
                <Line type="monotone" dataKey="yield" stroke="hsl(var(--primary))" strokeWidth={2.5} dot={{ r: 4 }} name="Факт (ц/га)" connectNulls={false} />
                {forecast && <Line type="monotone" dataKey="forecast" stroke="hsl(var(--accent))" strokeWidth={2.5} strokeDasharray="6 4" dot={{ r: 4 }} name="ИИ-прогноз (ц/га)" connectNulls />}
              </LineChart>
            </ResponsiveContainer>

            {forecast && forecast.forecasts?.length > 0 && (
              <div className="mt-3 space-y-3">
                <div className="p-3 rounded-lg bg-gradient-to-r from-accent/15 to-primary/10 border border-accent/40">
                  <div className="flex items-center gap-2 mb-2">
                    <Icon name="Sparkles" size={14} className="text-accent" />
                    <span className="text-xs font-bold uppercase tracking-wider">ИИ-прогноз урожайности · {forecast.forecasts[0].year}–{forecast.forecasts[forecast.forecasts.length - 1].year}</span>
                    {forecast.cached && <span className="text-[9px] text-muted-foreground font-mono">(кэш)</span>}
                  </div>
                  <p className="text-xs text-foreground/80 leading-relaxed">{forecast.reasoning}</p>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
                  {forecast.forecasts.map((f) => {
                    const lastFact = history[history.length - 1]?.yield || 0;
                    const delta = lastFact ? ((f.predicted_yield - lastFact) / lastFact) * 100 : 0;
                    const positive = delta >= 0;
                    return (
                      <div key={f.year} className="rounded-lg border border-accent/30 bg-card/60 p-2.5">
                        <div className="text-[10px] text-muted-foreground font-mono mb-1">{f.year} год</div>
                        <div className="flex items-baseline gap-1">
                          <span className="font-mono font-black text-lg text-accent">{f.predicted_yield}</span>
                          <span className="text-[10px] text-muted-foreground">ц/га</span>
                        </div>
                        <div className="flex items-center justify-between mt-1.5">
                          <span className={`text-[10px] font-mono font-semibold ${positive ? "text-primary" : "text-destructive"}`}>
                            {positive ? "+" : ""}{delta.toFixed(1)}%
                          </span>
                          <span className="text-[9px] text-muted-foreground font-mono">±{(100 - f.confidence).toFixed(0)}%</span>
                        </div>
                        <div className="h-1 bg-border rounded-full mt-1.5 overflow-hidden">
                          <div className="h-full bg-accent rounded-full" style={{ width: `${f.confidence}%` }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </>
        ) : dbRegionName ? (
          <div className="text-xs text-muted-foreground py-6 text-center">Нет данных по выбранной культуре для этого региона</div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {mapRows.slice(0, 9).map((r) => {
              const id = REGION_ID_BY_NAME[r.region];
              return (
                <div key={r.region} className="bg-secondary/40 rounded-lg p-2.5">
                  <div className="text-[10px] text-muted-foreground truncate">{r.region}</div>
                  <div className="font-mono font-bold text-sm text-primary">{r.yield} ц/га</div>
                  {r.harvest && <div className="text-[10px] text-muted-foreground">{(r.harvest / 1_000_000).toFixed(2)} млн т</div>}
                  {!id && <div className="text-[9px] text-muted-foreground/50">нет на карте</div>}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
}
