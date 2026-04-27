import Icon from "@/components/ui/icon";
import { AllRegionRow } from "./types";

type SortBy = "region" | "avg" | "last" | "trend" | "forecast";

interface Props {
  crop: string;
  allRegions: AllRegionRow[];
  allYears: number[];
  loadingAll: boolean;
  sortBy: SortBy;
  setSortBy: (s: SortBy) => void;
  sortDesc: boolean;
  setSortDesc: (b: boolean) => void;
  expandedRegions: Set<string>;
  districtsCache: Record<string, AllRegionRow[]>;
  loadingDistricts: Set<string>;
  toggleRegion: (region: string) => void;
}

export default function YieldAllRegionsTable({
  crop,
  allRegions,
  allYears,
  loadingAll,
  sortBy,
  setSortBy,
  sortDesc,
  setSortDesc,
  expandedRegions,
  districtsCache,
  loadingDistricts,
  toggleRegion,
}: Props) {
  return (
    <div className="border-t-2 border-primary/20 pt-5">
      <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <Icon name="Table" size={16} className="text-primary" />
          <span className="font-semibold text-sm">Сводная таблица по всем регионам · {crop}</span>
        </div>
        <div className="text-[10px] text-muted-foreground font-mono">
          {allRegions.length} регионов · история 2019–2024 · прогноз 2025–2029
        </div>
      </div>

      {loadingAll ? (
        <div className="text-xs text-muted-foreground py-8 text-center flex items-center justify-center gap-2">
          <Icon name="Loader2" size={14} className="animate-spin" />
          Расчёт прогнозов по всем регионам...
        </div>
      ) : allRegions.length === 0 ? (
        <div className="text-xs text-muted-foreground py-6 text-center">Нет данных по выбранной культуре</div>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-border">
          <table className="w-full text-xs">
            <thead className="bg-secondary/60 sticky top-0">
              <tr className="text-left">
                <th
                  onClick={() => { setSortBy("region"); setSortDesc(sortBy === "region" ? !sortDesc : false); }}
                  className="px-3 py-2 font-semibold cursor-pointer hover:bg-secondary"
                >
                  Регион {sortBy === "region" && <Icon name={sortDesc ? "ChevronDown" : "ChevronUp"} size={10} className="inline" />}
                </th>
                {allYears.map((y) => {
                  const isForecast = y > 2024;
                  return (
                    <th key={y} className={`px-2 py-2 font-mono text-center font-semibold ${isForecast ? "text-accent bg-accent/5" : ""}`}>
                      {y}
                      {isForecast && <div className="text-[8px] font-normal opacity-70">ИИ</div>}
                    </th>
                  );
                })}
                <th
                  onClick={() => { setSortBy("avg"); setSortDesc(sortBy === "avg" ? !sortDesc : true); }}
                  className="px-2 py-2 font-mono text-center font-semibold cursor-pointer hover:bg-secondary border-l border-border"
                >
                  Средн. {sortBy === "avg" && <Icon name={sortDesc ? "ChevronDown" : "ChevronUp"} size={10} className="inline" />}
                </th>
                <th
                  onClick={() => { setSortBy("trend"); setSortDesc(sortBy === "trend" ? !sortDesc : true); }}
                  className="px-2 py-2 font-mono text-center font-semibold cursor-pointer hover:bg-secondary"
                >
                  Тренд {sortBy === "trend" && <Icon name={sortDesc ? "ChevronDown" : "ChevronUp"} size={10} className="inline" />}
                </th>
              </tr>
            </thead>
            <tbody>
              {[...allRegions]
                .sort((a, b) => {
                  let cmp = 0;
                  if (sortBy === "region") cmp = a.region.localeCompare(b.region);
                  else if (sortBy === "avg") cmp = a.avg - b.avg;
                  else if (sortBy === "last") cmp = a.last - b.last;
                  else if (sortBy === "trend") cmp = a.trend_pct - b.trend_pct;
                  else if (sortBy === "forecast") {
                    cmp = (a.forecasts[a.forecasts.length - 1]?.predicted_yield || 0) - (b.forecasts[b.forecasts.length - 1]?.predicted_yield || 0);
                  }
                  return sortDesc ? -cmp : cmp;
                })
                .flatMap((row) => {
                  const histMap = new Map(row.history.map((h) => [h.year, h.yield]));
                  const fcstMap = new Map(row.forecasts.map((f) => [f.year, f.predicted_yield]));
                  const trendUp = row.trend_pct >= 0;
                  const isExpanded = expandedRegions.has(row.region);
                  const cacheKey = `${row.region}|${crop}`;
                  const districts = districtsCache[cacheKey] || [];
                  const isLoadingD = loadingDistricts.has(row.region);
                  const rows = [
                    <tr key={row.region} onClick={() => toggleRegion(row.region)} className="border-t border-border hover:bg-secondary/60 transition cursor-pointer bg-secondary/20">
                      <td className="px-3 py-2 font-semibold flex items-center gap-1.5">
                        <Icon name={isExpanded ? "ChevronDown" : "ChevronRight"} size={12} className="text-primary" />
                        {row.region}
                      </td>
                      {allYears.map((y) => {
                        const isForecast = y > 2024;
                        const v = isForecast ? fcstMap.get(y) : histMap.get(y);
                        return (
                          <td key={y} className={`px-2 py-2 font-mono text-center ${isForecast ? "text-accent bg-accent/5 font-semibold" : ""}`}>
                            {v != null ? v : "—"}
                          </td>
                        );
                      })}
                      <td className="px-2 py-2 font-mono text-center font-bold border-l border-border">{row.avg}</td>
                      <td className={`px-2 py-2 font-mono text-center font-bold ${trendUp ? "text-primary" : "text-destructive"}`}>
                        {trendUp ? "+" : ""}{row.trend_pct}%
                      </td>
                    </tr>,
                  ];
                  if (isExpanded) {
                    if (isLoadingD) {
                      rows.push(
                        <tr key={`${row.region}-loading`} className="border-t border-border bg-card">
                          <td colSpan={allYears.length + 3} className="px-3 py-3 text-center text-xs text-muted-foreground">
                            <Icon name="Loader2" size={12} className="animate-spin inline mr-2" />
                            Загрузка районов...
                          </td>
                        </tr>,
                      );
                    } else if (districts.length === 0) {
                      rows.push(
                        <tr key={`${row.region}-empty`} className="border-t border-border bg-card">
                          <td colSpan={allYears.length + 3} className="px-3 py-3 text-center text-xs text-muted-foreground">
                            Нет детализации по районам для этой культуры
                          </td>
                        </tr>,
                      );
                    } else {
                      districts.forEach((d) => {
                        const dHist = new Map(d.history.map((h) => [h.year, h.yield]));
                        const dFcst = new Map(d.forecasts.map((f) => [f.year, f.predicted_yield]));
                        const dTrendUp = d.trend_pct >= 0;
                        rows.push(
                          <tr key={`${row.region}-${d.region}`} className="border-t border-border/50 hover:bg-secondary/30 transition bg-card/40">
                            <td className="px-3 py-1.5 pl-8 text-[11px] text-muted-foreground">└ {d.region}</td>
                            {allYears.map((y) => {
                              const isForecast = y > 2024;
                              const v = isForecast ? dFcst.get(y) : dHist.get(y);
                              return (
                                <td key={y} className={`px-2 py-1.5 font-mono text-center text-[11px] ${isForecast ? "text-accent/80 bg-accent/5" : "text-muted-foreground"}`}>
                                  {v != null ? v : "—"}
                                </td>
                              );
                            })}
                            <td className="px-2 py-1.5 font-mono text-center text-[11px] font-semibold border-l border-border">{d.avg}</td>
                            <td className={`px-2 py-1.5 font-mono text-center text-[11px] font-semibold ${dTrendUp ? "text-primary/80" : "text-destructive/80"}`}>
                              {dTrendUp ? "+" : ""}{d.trend_pct}%
                            </td>
                          </tr>,
                        );
                      });
                    }
                  }
                  return rows;
                })}
            </tbody>
          </table>
        </div>
      )}

      <div className="mt-3 flex items-center gap-3 flex-wrap text-[10px] text-muted-foreground">
        <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded bg-secondary border border-border" />Факт (Росстат)</span>
        <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded bg-accent/30 border border-accent" />ИИ-прогноз</span>
        <span>· все значения в ц/га · клик по заголовку — сортировка · <strong className="text-foreground">клик по региону — раскрыть районы</strong></span>
      </div>
    </div>
  );
}
