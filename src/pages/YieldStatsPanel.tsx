import { useEffect, useMemo, useState } from "react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar, CartesianGrid, Legend, ReferenceLine } from "recharts";
import Icon from "@/components/ui/icon";
import { MAP_REGIONS } from "./data";
import func2url from "../../backend/func2url.json";

const YIELD_URL = (func2url as Record<string, string>).yield;

interface RegionYield {
  region: string;
  crop: string;
  year: number;
  yield: number | null;
  harvest: number | null;
  area: number | null;
}

interface HistoryPoint {
  year: number;
  yield: number | null;
  harvest: number | null;
}

interface ForecastItem {
  year: number;
  predicted_yield: number;
  confidence: number;
}

interface ForecastResp {
  region: string;
  crop: string;
  forecast_years: number[];
  forecasts: ForecastItem[];
  reasoning: string;
  history: HistoryPoint[];
  cached?: boolean;
}

interface Meta {
  crops: string[];
  years: number[];
  regions: string[];
}

interface Props {
  selectedRegionId: string | null;
}

const REGION_ID_TO_DB: Record<string, string> = {
  samara: "Самарская область",
  saratov: "Саратовская область",
  volgograd: "Волгоградская область",
  ulyanovsk: "Ульяновская область",
  penza: "Пензенская область",
  orenburg: "Оренбургская область",
  tatarstan: "Татарстан",
  bashkortostan: "Башкортостан",
  krasnodar: "Краснодарский край",
  rostov: "Ростовская область",
  stavropol: "Ставропольский край",
  voronezh: "Воронежская область",
  belgorod: "Белгородская область",
  kursk: "Курская область",
  tambov: "Тамбовская область",
  chelyabinsk: "Челябинская область",
  kurgan: "Курганская область",
  novosibirsk: "Новосибирская область",
  omsk: "Омская область",
  altai: "Алтайский край",
};

const REGION_ID_BY_NAME: Record<string, string> = Object.entries(REGION_ID_TO_DB).reduce(
  (acc, [id, name]) => ({ ...acc, [name]: id }),
  {} as Record<string, string>,
);

interface AllRegionRow {
  region: string;
  history: HistoryPoint[];
  avg: number;
  last: number;
  min: number;
  max: number;
  trend_pct: number;
  forecasts: ForecastItem[];
  reasoning: string;
}

export default function YieldStatsPanel({ selectedRegionId }: Props) {
  const [meta, setMeta] = useState<Meta | null>(null);
  const [crop, setCrop] = useState("Пшеница озимая");
  const [year, setYear] = useState(2024);
  const [mapRows, setMapRows] = useState<RegionYield[]>([]);
  const [history, setHistory] = useState<HistoryPoint[]>([]);
  const [forecast, setForecast] = useState<ForecastResp | null>(null);
  const [loadingForecast, setLoadingForecast] = useState(false);
  const [allRegions, setAllRegions] = useState<AllRegionRow[]>([]);
  const [allYears, setAllYears] = useState<number[]>([]);
  const [loadingAll, setLoadingAll] = useState(false);
  const [sortBy, setSortBy] = useState<"region" | "avg" | "last" | "trend" | "forecast">("forecast");
  const [sortDesc, setSortDesc] = useState(true);
  const [expandedRegions, setExpandedRegions] = useState<Set<string>>(new Set());
  const [districtsCache, setDistrictsCache] = useState<Record<string, AllRegionRow[]>>({});
  const [loadingDistricts, setLoadingDistricts] = useState<Set<string>>(new Set());

  const toggleRegion = async (region: string) => {
    const next = new Set(expandedRegions);
    if (next.has(region)) {
      next.delete(region);
      setExpandedRegions(next);
      return;
    }
    next.add(region);
    setExpandedRegions(next);
    const cacheKey = `${region}|${crop}`;
    if (districtsCache[cacheKey]) return;
    setLoadingDistricts((s) => new Set(s).add(region));
    try {
      const r = await fetch(`${YIELD_URL}?action=districts&region=${encodeURIComponent(region)}&crop=${encodeURIComponent(crop)}`);
      const d = await r.json();
      const rows: AllRegionRow[] = (d.districts || []).map((x: { district: string; history: HistoryPoint[]; avg: number; last: number; min: number; max: number; trend_pct: number; forecasts: ForecastItem[] }) => ({
        region: x.district,
        history: x.history,
        avg: x.avg,
        last: x.last,
        min: x.min,
        max: x.max,
        trend_pct: x.trend_pct,
        forecasts: x.forecasts,
        reasoning: "",
      }));
      setDistrictsCache((c) => ({ ...c, [cacheKey]: rows }));
    } finally {
      setLoadingDistricts((s) => {
        const ns = new Set(s);
        ns.delete(region);
        return ns;
      });
    }
  };

  // Сбрасываем кэш районов при смене культуры
  useEffect(() => {
    setExpandedRegions(new Set());
  }, [crop]);

  useEffect(() => {
    fetch(`${YIELD_URL}?action=meta`)
      .then((r) => r.json())
      .then(setMeta)
      .catch(() => setMeta({ crops: ["Пшеница озимая"], years: [2024], regions: [] }));
  }, []);

  useEffect(() => {
    const url = `${YIELD_URL}?action=map&crop=${encodeURIComponent(crop)}&year=${year}`;
    fetch(url)
      .then((r) => r.json())
      .then((d) => setMapRows(d.regions || []))
      .catch(() => setMapRows([]));
  }, [crop, year]);

  useEffect(() => {
    setLoadingAll(true);
    fetch(`${YIELD_URL}?action=forecast_all&crop=${encodeURIComponent(crop)}&years=5`)
      .then((r) => r.json())
      .then((d) => {
        const rows: AllRegionRow[] = d.regions || [];
        setAllRegions(rows);
        const ys = new Set<number>();
        rows.forEach((r) => {
          r.history.forEach((h) => ys.add(h.year));
          r.forecasts.forEach((f) => ys.add(f.year));
        });
        setAllYears(Array.from(ys).sort((a, b) => a - b));
      })
      .catch(() => setAllRegions([]))
      .finally(() => setLoadingAll(false));
  }, [crop]);

  const dbRegionName = selectedRegionId ? REGION_ID_TO_DB[selectedRegionId] : null;

  useEffect(() => {
    if (!dbRegionName) {
      setHistory([]);
      setForecast(null);
      return;
    }
    fetch(`${YIELD_URL}?action=history&region=${encodeURIComponent(dbRegionName)}&crop=${encodeURIComponent(crop)}`)
      .then((r) => r.json())
      .then((d) => setHistory(d.history || []))
      .catch(() => setHistory([]));
    setForecast(null);
  }, [dbRegionName, crop]);

  const handleForecast = async (refresh = false) => {
    if (!dbRegionName) return;
    setLoadingForecast(true);
    try {
      const url = `${YIELD_URL}?action=forecast&region=${encodeURIComponent(dbRegionName)}&crop=${encodeURIComponent(crop)}&years=5${refresh ? "&refresh=1" : ""}`;
      const r = await fetch(url);
      const d = await r.json();
      if (!d.error) setForecast(d);
    } finally {
      setLoadingForecast(false);
    }
  };

  const top10 = useMemo(() => mapRows.slice(0, 10), [mapRows]);
  const stats = useMemo(() => {
    if (!mapRows.length) return null;
    const yields = mapRows.map((r) => r.yield || 0).filter(Boolean);
    const totalHarvest = mapRows.reduce((s, r) => s + (r.harvest || 0), 0);
    const totalArea = mapRows.reduce((s, r) => s + (r.area || 0), 0);
    const avg = yields.reduce((s, v) => s + v, 0) / yields.length;
    return {
      avg: avg.toFixed(1),
      max: Math.max(...yields).toFixed(1),
      min: Math.min(...yields).toFixed(1),
      totalHarvest: (totalHarvest / 1_000_000).toFixed(2),
      totalArea: (totalArea / 1_000_000).toFixed(2),
    };
  }, [mapRows]);

  const chartData: Array<{ year: number; yield: number | null; forecast?: number | null }> = history.map((h) => ({
    year: h.year,
    yield: h.yield,
  }));
  if (forecast?.forecasts?.length) {
    const lastHist = history[history.length - 1];
    if (lastHist) {
      const idx = chartData.findIndex((d) => d.year === lastHist.year);
      if (idx >= 0) chartData[idx] = { ...chartData[idx], forecast: lastHist.yield };
    }
    forecast.forecasts.forEach((f) => {
      chartData.push({ year: f.year, yield: null, forecast: f.predicted_yield });
    });
  }
  const firstForecastYear = forecast?.forecasts?.[0]?.year;

  const selectedRegionLabel = selectedRegionId
    ? MAP_REGIONS.find((r) => r.id === selectedRegionId)?.name
    : null;

  const CROP_ICONS: Record<string, string> = {
    "Пшеница озимая": "Wheat",
    "Подсолнечник": "Flower",
    "Кукуруза": "Sprout",
    "Ячмень яровой": "Wheat",
    "Рожь": "Wheat",
  };

  return (
    <div className="glass-card rounded-xl p-5 space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <Icon name="BarChart3" size={16} className="text-primary" />
          <span className="font-semibold text-sm">Статистика урожайности по годам</span>
        </div>
        <select
          value={year}
          onChange={(e) => setYear(Number(e.target.value))}
          className="bg-secondary border border-border rounded-md px-3 py-1.5 text-xs font-mono"
        >
          {(meta?.years || [2024]).map((y) => (
            <option key={y} value={y}>{y} год</option>
          ))}
        </select>
      </div>

      <div>
        <div className="text-[10px] font-medium text-muted-foreground mb-2 uppercase tracking-wider">Выберите культуру</div>
        <div className="flex gap-2 flex-wrap">
          {(meta?.crops || ["Пшеница озимая"]).map((c) => {
            const active = c === crop;
            return (
              <button
                key={c}
                onClick={() => setCrop(c)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg border-2 text-xs font-semibold transition-all ${
                  active
                    ? "bg-primary text-primary-foreground border-primary shadow-md"
                    : "bg-secondary/50 border-border text-foreground hover:border-primary/50 hover:bg-secondary"
                }`}
              >
                <Icon name={CROP_ICONS[c] || "Wheat"} size={14} />
                {c}
              </button>
            );
          })}
        </div>
      </div>

      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
          {[
            { label: "Средняя", value: `${stats.avg} ц/га`, icon: "Activity" },
            { label: "Максимум", value: `${stats.max} ц/га`, icon: "TrendingUp" },
            { label: "Минимум", value: `${stats.min} ц/га`, icon: "TrendingDown" },
            { label: "Валовой сбор", value: `${stats.totalHarvest} млн т`, icon: "Wheat" },
            { label: "Площадь", value: `${stats.totalArea} млн га`, icon: "Map" },
          ].map((s) => (
            <div key={s.label} className="bg-secondary/40 rounded-lg p-2.5">
              <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground mb-1">
                <Icon name={s.icon} size={11} />
                {s.label}
              </div>
              <div className="font-mono font-bold text-sm">{s.value}</div>
            </div>
          ))}
        </div>
      )}

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
    </div>
  );
}