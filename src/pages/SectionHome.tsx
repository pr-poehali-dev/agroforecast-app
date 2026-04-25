import { useState, useEffect } from "react";
import { FORECAST_DATA } from "./data";
import HomeHero from "./HomeHero";
import HomeActivity from "./HomeActivity";
import HomeWhyUs from "./HomeWhyUs";

const AI_URL = "https://functions.poehali.dev/3f769f53-b21b-473e-91b9-b7a755123928";

const CROPS_API = [
  { name: "Пшеница озимая", region: "samara" },
  { name: "Подсолнечник",   region: "samara" },
  { name: "Кукуруза",       region: "volgograd" },
  { name: "Ячмень яровой",  region: "tatarstan" },
  { name: "Рожь",           region: "penza" },
];

interface AiForecastItem {
  crop: string;
  forecastPrice: number;
  currentPrice: number;
  change: number;
  confidence: number;
  trend: "up" | "down";
  yieldForecast: number;
}

interface AiRegionRisk {
  total_risk_pct: number;
  total_risk_level: string;
  yield_cha: number;
  price_rub_t: number;
  price_change_pct: number;
  drought_risk_pct: number;
  frost_risk_pct: number;
  pest_risk_pct: number;
}

interface SectionHomeProps {
  selectedRegion: string | null;
  setSelectedRegion: (id: string) => void;
  setSelectedCrop: (crop: string) => void;
  setActiveSection: (section: string) => void;
}

export default function SectionHome({
  selectedRegion, setSelectedRegion, setSelectedCrop, setActiveSection,
}: SectionHomeProps) {
  const [forecasts, setForecasts] = useState<AiForecastItem[]>([]);
  const [aiLoading, setAiLoading] = useState(true);
  const [aiRisks, setAiRisks] = useState<Record<string, AiRegionRisk>>({});
  const [profile, setProfile] = useState("farmer");

  // Load all-regions AI data for map markers
  useEffect(() => {
    fetch(`${AI_URL}?crop=${encodeURIComponent("Пшеница озимая")}&horizon=3&all=1`)
      .then(r => r.json())
      .then(d => {
        const map: Record<string, AiRegionRisk> = {};
        (d.regions || []).forEach((r: AiRegionRisk & { region_id: string }) => {
          map[r.region_id] = r;
        });
        setAiRisks(map);
      })
      .catch(() => {});
  }, []);

  // Load forecast cards
  useEffect(() => {
    const abort = new AbortController();
    Promise.all(
      CROPS_API.map(c =>
        fetch(`${AI_URL}?crop=${encodeURIComponent(c.name)}&region=${c.region}&horizon=3`, { signal: abort.signal })
          .then(r => r.json())
          .then(d => ({
            crop: c.name,
            currentPrice: d.price_forecast
              ? Math.round(d.price_forecast.price_rub_t / (1 + d.price_forecast.change_pct / 100))
              : (FORECAST_DATA.find(f => f.crop === c.name)?.currentPrice ?? 0),
            forecastPrice: d.price_forecast?.price_rub_t ?? (FORECAST_DATA.find(f => f.crop === c.name)?.forecastPrice ?? 0),
            change: d.price_forecast?.change_pct ?? 0,
            confidence: d.price_forecast?.confidence_pct ?? 0,
            trend: (d.price_forecast?.trend ?? "up") as "up" | "down",
            yieldForecast: d.yield_forecast?.yield_cha ?? 0,
          }))
          .catch(() => FORECAST_DATA.find(f => f.crop === c.name) as AiForecastItem)
      )
    )
      .then(results => { setForecasts(results.filter(Boolean) as AiForecastItem[]); setAiLoading(false); })
      .catch(() => setAiLoading(false));
    return () => abort.abort();
  }, []);

  const displayForecasts = forecasts.length > 0 ? forecasts : FORECAST_DATA as AiForecastItem[];

  return (
    <div className="space-y-8 animate-fade-in">
      <HomeHero setActiveSection={setActiveSection} />

      <HomeActivity
        selectedRegion={selectedRegion}
        setSelectedRegion={setSelectedRegion}
        setSelectedCrop={setSelectedCrop}
        setActiveSection={setActiveSection}
        profile={profile}
        setProfile={setProfile}
        aiRisks={aiRisks}
        displayForecasts={displayForecasts}
        aiLoading={aiLoading}
      />

      <HomeWhyUs setActiveSection={setActiveSection} />
    </div>
  );
}
