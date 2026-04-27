import { useEffect, useMemo, useState } from "react";
import { MAP_REGIONS } from "./data";
import func2url from "../../backend/func2url.json";
import {
  AllRegionRow,
  ForecastResp,
  HistoryPoint,
  Meta,
  REGION_ID_TO_DB,
  RegionYield,
} from "./yield-stats/types";
import YieldHeader from "./yield-stats/YieldHeader";
import YieldRegionChart from "./yield-stats/YieldRegionChart";
import YieldAllRegionsTable from "./yield-stats/YieldAllRegionsTable";

const YIELD_URL = (func2url as Record<string, string>).yield;

interface Props {
  selectedRegionId: string | null;
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
      const rows: AllRegionRow[] = (d.districts || []).map((x: { district: string; history: HistoryPoint[]; avg: number; last: number; min: number; max: number; trend_pct: number; forecasts: { year: number; predicted_yield: number; confidence: number }[] }) => ({
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
    ? MAP_REGIONS.find((r) => r.id === selectedRegionId)?.name || null
    : null;

  return (
    <div className="glass-card rounded-xl p-5 space-y-5">
      <YieldHeader
        meta={meta}
        crop={crop}
        setCrop={setCrop}
        year={year}
        setYear={setYear}
        stats={stats}
      />

      <YieldRegionChart
        year={year}
        top10={top10}
        mapRows={mapRows}
        selectedRegionLabel={selectedRegionLabel}
        dbRegionName={dbRegionName}
        history={history}
        forecast={forecast}
        loadingForecast={loadingForecast}
        handleForecast={handleForecast}
        chartData={chartData}
        firstForecastYear={firstForecastYear}
      />

      <YieldAllRegionsTable
        crop={crop}
        allRegions={allRegions}
        allYears={allYears}
        loadingAll={loadingAll}
        sortBy={sortBy}
        setSortBy={setSortBy}
        sortDesc={sortDesc}
        setSortDesc={setSortDesc}
        expandedRegions={expandedRegions}
        districtsCache={districtsCache}
        loadingDistricts={loadingDistricts}
        toggleRegion={toggleRegion}
      />
    </div>
  );
}
