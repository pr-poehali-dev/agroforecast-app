import { useState, useEffect } from "react";
import Icon from "@/components/ui/icon";
import { ALERTS, FORECAST_DATA, STATS } from "./data";
import { MapSVGSmall } from "./PageWidgets";

const AI_URL = "https://functions.poehali.dev/3f769f53-b21b-473e-91b9-b7a755123928";

interface AiForecastItem {
  crop: string;
  forecastPrice: number;
  currentPrice: number;
  change: number;
  confidence: number;
  trend: "up" | "down";
  yieldForecast: number;
}

interface SectionHomeProps {
  selectedRegion: string | null;
  setSelectedRegion: (id: string) => void;
  setSelectedCrop: (crop: string) => void;
  setActiveSection: (section: string) => void;
}

const CROPS_API = [
  { name: "Пшеница озимая", region: "samara" },
  { name: "Подсолнечник",   region: "samara" },
  { name: "Кукуруза",       region: "volgograd" },
  { name: "Ячмень яровой",  region: "tatarstan" },
  { name: "Рожь",           region: "penza" },
];

export default function SectionHome({
  selectedRegion, setSelectedRegion, setSelectedCrop, setActiveSection,
}: SectionHomeProps) {
  const [forecasts, setForecasts] = useState<AiForecastItem[]>([]);
  const [aiLoading, setAiLoading] = useState(true);

  useEffect(() => {
    const abort = new AbortController();
    Promise.all(
      CROPS_API.map(c =>
        fetch(`${AI_URL}?crop=${encodeURIComponent(c.name)}&region=${c.region}&horizon=3`, { signal: abort.signal })
          .then(r => r.json())
          .then(d => ({
            crop: c.name,
            currentPrice: d.price_forecast?.price_rub_t
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
      .catch(() => { setAiLoading(false); });

    return () => abort.abort();
  }, []);

  const displayForecasts = forecasts.length > 0 ? forecasts : FORECAST_DATA as AiForecastItem[];

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground">AgroForecast Pro: Поволжье</h1>
          <p className="text-muted-foreground mt-1 text-sm">Прогнозирование рынка сельскохозяйственной продукции · 8 регионов · 12 культур</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setActiveSection("pricing")} className="px-3 py-1.5 text-xs bg-accent text-accent-foreground rounded-lg font-medium hover:bg-accent/90 transition-colors">Обновить тариф</button>
        </div>
      </div>

      {/* KPI stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {STATS.map((s, i) => (
          <div key={i} className="glass-card rounded-xl p-4 hover:scale-[1.02] transition-all duration-200">
            <div className={`w-9 h-9 rounded-lg mb-3 flex items-center justify-center
              ${s.color === "emerald" ? "bg-primary/15 text-primary" :
                s.color === "amber" ? "bg-accent/15 text-accent" :
                s.color === "cyan" ? "bg-cyan-500/15 text-cyan-400" :
                "bg-destructive/15 text-destructive"}`}>
              <Icon name={s.icon as string} size={17} />
            </div>
            <div className="text-2xl font-bold font-mono text-foreground">{s.value}<span className="text-base text-muted-foreground">{s.suffix}</span></div>
            <div className="text-xs text-muted-foreground mt-0.5">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Map + Alerts */}
      <div className="grid lg:grid-cols-2 gap-4">
        <div className="glass-card rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Icon name="Map" size={16} className="text-primary" />
              <span className="font-semibold text-sm">Карта Поволжья</span>
            </div>
            <button onClick={() => setActiveSection("map")} className="text-xs text-primary hover:text-primary/80 transition-colors">Открыть →</button>
          </div>
          <MapSVGSmall selectedRegion={selectedRegion} onSelect={setSelectedRegion} />
          <div className="flex gap-3 mt-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-primary" />Низкий</span>
            <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-accent" />Средний</span>
            <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-destructive" />Высокий</span>
          </div>
        </div>
        <div className="glass-card rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Icon name="Bell" size={16} className="text-accent" />
              <span className="font-semibold text-sm">Последние события</span>
            </div>
            <button onClick={() => setActiveSection("alerts")} className="text-xs text-primary hover:text-primary/80 transition-colors">Все →</button>
          </div>
          <div className="space-y-2">
            {ALERTS.slice(0, 4).map(a => (
              <div key={a.id} className={`flex items-start gap-3 p-2.5 rounded-lg
                ${a.type === "critical" ? "bg-destructive/10 border border-destructive/20" :
                  a.type === "warning" ? "bg-accent/8 border border-accent/15" :
                  "bg-secondary/50 border border-border"}`}>
                <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0
                  ${a.type === "critical" ? "bg-destructive/20 text-destructive" :
                    a.type === "warning" ? "bg-accent/20 text-accent" : "bg-primary/20 text-primary"}`}>
                  <Icon name={a.icon as string} size={13} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-semibold text-foreground truncate">{a.title}</div>
                  <div className="text-xs text-muted-foreground truncate">{a.desc}</div>
                </div>
                <span className="text-[10px] text-muted-foreground shrink-0">{a.time}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Live AI price forecasts */}
      <div className="glass-card rounded-xl p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Icon name="TrendingUp" size={16} className="text-primary" />
            <span className="font-semibold text-sm">Прогнозы цен на 3 месяца</span>
            {aiLoading ? (
              <span className="flex items-center gap-1 text-[10px] text-muted-foreground animate-pulse">
                <Icon name="Brain" size={10} className="text-primary" />живой расчёт...
              </span>
            ) : (
              <span className="flex items-center gap-1 text-[10px] text-primary bg-primary/10 px-1.5 py-0.5 rounded font-mono">
                <Icon name="Brain" size={10} />AI
              </span>
            )}
          </div>
          <button onClick={() => setActiveSection("forecasts")} className="text-xs text-primary hover:text-primary/80 transition-colors">Подробнее →</button>
        </div>
        <div className={`grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3 transition-opacity ${aiLoading ? "opacity-60" : ""}`}>
          {displayForecasts.map((f, i) => (
            <div key={i} className="bg-secondary/40 rounded-lg p-3 hover:bg-secondary/70 transition-colors cursor-pointer"
              onClick={() => { setSelectedCrop(f.crop); setActiveSection("forecasts"); }}>
              <div className="text-xs text-muted-foreground mb-1 truncate">{f.crop}</div>
              <div className="font-bold font-mono text-sm text-foreground">{f.forecastPrice.toLocaleString()} ₽</div>
              <div className={`flex items-center gap-1 text-xs font-medium mt-1 ${f.trend === "up" ? "text-primary" : "text-destructive"}`}>
                <Icon name={f.trend === "up" ? "TrendingUp" : "TrendingDown"} size={11} />
                {f.change > 0 ? "+" : ""}{typeof f.change === "number" ? f.change.toFixed(1) : f.change}%
              </div>
              <div className="mt-2">
                <div className="flex justify-between text-[10px] text-muted-foreground mb-1">
                  <span>Уверенность</span>
                  <span className="font-mono">{typeof f.confidence === "number" ? f.confidence.toFixed(0) : f.confidence}%</span>
                </div>
                <div className="h-1 bg-border rounded-full">
                  <div className="h-full rounded-full bg-primary"
                    style={{ width: `${f.confidence}%`, opacity: f.confidence / 100 * 0.7 + 0.3 }} />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
