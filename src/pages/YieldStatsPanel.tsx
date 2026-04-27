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

export default function YieldStatsPanel({ selectedRegionId }: Props) {
  const [meta, setMeta] = useState<Meta | null>(null);
  const [crop, setCrop] = useState("Пшеница озимая");
  const [year, setYear] = useState(2024);
  const [mapRows, setMapRows] = useState<RegionYield[]>([]);
  const [history, setHistory] = useState<HistoryPoint[]>([]);
  const [forecast, setForecast] = useState<ForecastResp | null>(null);
  const [loadingForecast, setLoadingForecast] = useState(false);

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
    </div>
  );
}