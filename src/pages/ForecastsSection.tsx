import { useState, useEffect } from "react";
import { FORECAST_DATA } from "./data";
import ValidatedForecast from "@/components/ValidatedForecast";
import { AiSingle, AiTableRow } from "./ForecastsTypes";
import ForecastsHero from "./forecasts/ForecastsHero";
import LiveQuotesPanel, { LivePrice, PricesResponse } from "./forecasts/LiveQuotesPanel";
import ForecastCard from "./forecasts/ForecastCard";
import ForecastsSummaryTable from "./forecasts/ForecastsSummaryTable";

// ── Live-prices backend ────────────────────────────────────────────────────
const PRICES_URL = "https://functions.poehali.dev/52189484-0746-4acc-8694-949dc8ee7f62";

// ── Props ──────────────────────────────────────────────────────────────────
interface ForecastsSectionProps {
  selectedCrop: string;
  setSelectedCrop: (crop: string) => void;
  aiSingle: AiSingle | null;
  aiSingleLoading: boolean;
  aiTable: AiTableRow[];
  aiTableLoading: boolean;
}

// ── Component ──────────────────────────────────────────────────────────────
export default function ForecastsSection({
  selectedCrop, setSelectedCrop,
  aiSingle, aiSingleLoading,
  aiTable, aiTableLoading,
}: ForecastsSectionProps) {

  // Live prices state
  const [pricesData,    setPricesData]    = useState<PricesResponse | null>(null);
  const [pricesLoading, setPricesLoading] = useState(true);
  const [pricesError,   setPricesError]   = useState(false);

  useEffect(() => {
    let cancelled = false;
    setPricesLoading(true);
    setPricesError(false);
    fetch(PRICES_URL)
      .then(r => r.json())
      .then((d: PricesResponse) => {
        if (!cancelled) { setPricesData(d); setPricesLoading(false); }
      })
      .catch(() => {
        if (!cancelled) { setPricesError(true); setPricesLoading(false); }
      });
    return () => { cancelled = true; };
  }, []);

  // Build a map crop → live price for quick lookup
  const livePriceMap: Record<string, LivePrice> = {};
  if (pricesData?.prices) {
    pricesData.prices.forEach(p => { livePriceMap[p.crop] = p; });
  }

  // Merge live prices into FORECAST_DATA for the forecast card + table
  const mergedForecast = FORECAST_DATA.map(f => {
    const lp = livePriceMap[f.crop];
    return lp ? { ...f, currentPrice: lp.price } : f;
  });

  const cropFull = mergedForecast.find(f => f.crop.includes(selectedCrop) || selectedCrop.includes(f.crop.split(" ")[0]))?.crop || selectedCrop;
  const baseForecast = mergedForecast.find(f => f.crop === cropFull) || mergedForecast[0];
  const selectedForecast = aiSingle ? { ...baseForecast, ...aiSingle } : baseForecast;
  const tableData: AiTableRow[] = aiTable.length > 0
    ? aiTable.map(row => {
        const lp = livePriceMap[row.crop];
        return lp ? { ...row, currentPrice: lp.price } : row;
      })
    : mergedForecast.map(f => ({ ...f, trend: f.trend as "up" | "down" }));

  // Determine how many live (non-fallback) sources succeeded
  const liveCount = pricesData?.prices.filter(p => !p.is_fallback).length ?? 0;

  return (
    <div className="space-y-6 animate-fade-in">

      <ForecastsHero />

      <ValidatedForecast />

      <LiveQuotesPanel
        pricesData={pricesData} pricesLoading={pricesLoading} pricesError={pricesError}
        liveCount={liveCount} cropFull={cropFull} setSelectedCrop={setSelectedCrop}
      />

      <ForecastCard
        selectedForecast={selectedForecast} mergedForecast={mergedForecast} cropFull={cropFull}
        setSelectedCrop={setSelectedCrop} aiSingle={aiSingle} aiSingleLoading={aiSingleLoading}
        livePriceMap={livePriceMap}
      />

      <ForecastsSummaryTable
        tableData={tableData} livePriceMap={livePriceMap} setSelectedCrop={setSelectedCrop}
        aiTable={aiTable} aiTableLoading={aiTableLoading}
      />
    </div>
  );
}