import { useState, useEffect } from "react";
import { FORECAST_DATA } from "./data";
import { AI_URL, CROP_REGION_MAP, AiTableRow, AiSingle } from "./ForecastsTypes";
import ForecastsSection from "./ForecastsSection";
import MapSection from "./MapSection";
import SupplyRisksSection from "./SupplyRisksSection";

interface SectionForecastsProps {
  activeSection: string;
  selectedRegion: string | null;
  setSelectedRegion: (id: string) => void;
  selectedCrop: string;
  setSelectedCrop: (crop: string) => void;
}

export default function SectionForecasts({
  activeSection, selectedRegion, setSelectedRegion, selectedCrop, setSelectedCrop,
}: SectionForecastsProps) {
  const [aiSingle, setAiSingle] = useState<AiSingle | null>(null);
  const [aiSingleLoading, setAiSingleLoading] = useState(false);
  const [aiTable, setAiTable] = useState<AiTableRow[]>([]);
  const [aiTableLoading, setAiTableLoading] = useState(false);

  const cropFull = FORECAST_DATA.find(f => f.crop.includes(selectedCrop) || selectedCrop.includes(f.crop.split(" ")[0]))?.crop
    || selectedCrop;
  const region = CROP_REGION_MAP[cropFull] || "samara";

  // Load single crop AI forecast when section or crop changes
  useEffect(() => {
    if (activeSection !== "forecasts") return;
    const abort = new AbortController();
    setAiSingleLoading(true);
    fetch(`${AI_URL}?crop=${encodeURIComponent(cropFull)}&region=${region}&horizon=3`, { signal: abort.signal })
      .then(r => r.json())
      .then(d => {
        const pf = d.price_forecast;
        const yf = d.yield_forecast;
        if (!pf) return;
        setAiSingle({
          currentPrice: Math.round(pf.price_rub_t / (1 + pf.change_pct / 100)),
          forecastPrice: pf.price_rub_t,
          change: pf.change_pct,
          confidence: pf.confidence_pct,
          trend: pf.trend,
          yieldForecast: yf?.yield_cha ?? 0,
        });
        setAiSingleLoading(false);
      })
      .catch(() => setAiSingleLoading(false));
    return () => abort.abort();
  }, [activeSection, cropFull, region]);

  // Load all crops for summary table
  useEffect(() => {
    if (activeSection !== "forecasts") return;
    const abort = new AbortController();
    setAiTableLoading(true);
    Promise.all(
      FORECAST_DATA.map(f =>
        fetch(`${AI_URL}?crop=${encodeURIComponent(f.crop)}&region=${CROP_REGION_MAP[f.crop] || "samara"}&horizon=3`, { signal: abort.signal })
          .then(r => r.json())
          .then(d => ({
            crop: f.crop,
            currentPrice: d.price_forecast ? Math.round(d.price_forecast.price_rub_t / (1 + d.price_forecast.change_pct / 100)) : f.currentPrice,
            forecastPrice: d.price_forecast?.price_rub_t ?? f.forecastPrice,
            change: d.price_forecast?.change_pct ?? f.change,
            confidence: d.price_forecast?.confidence_pct ?? f.confidence,
            trend: (d.price_forecast?.trend ?? f.trend) as "up" | "down",
            yieldForecast: d.yield_forecast?.yield_cha ?? f.yieldForecast,
            yield: d.yield_forecast?.yield_low ?? f.yield,
          }))
          .catch(() => ({ ...f, trend: f.trend as "up" | "down" }))
      )
    )
      .then(rows => { setAiTable(rows); setAiTableLoading(false); })
      .catch(() => setAiTableLoading(false));
    return () => abort.abort();
  }, [activeSection]);

  return (
    <>
      {activeSection === "forecasts" && (
        <ForecastsSection
          selectedCrop={selectedCrop}
          setSelectedCrop={setSelectedCrop}
          aiSingle={aiSingle}
          aiSingleLoading={aiSingleLoading}
          aiTable={aiTable}
          aiTableLoading={aiTableLoading}
        />
      )}

      {activeSection === "map" && (
        <MapSection
          selectedRegion={selectedRegion}
          setSelectedRegion={setSelectedRegion}
        />
      )}

      {(activeSection === "supply" || activeSection === "risks") && (
        <SupplyRisksSection activeSection={activeSection} />
      )}
    </>
  );
}
