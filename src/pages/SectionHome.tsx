import { useState, useEffect, lazy, Suspense } from "react";
import Icon from "@/components/ui/icon";
import { ALERTS, FORECAST_DATA, STATS } from "./data";

const HomeMap = lazy(() => import("@/components/HomeMap"));

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

const USER_PROFILES = [
  {
    id: "farmer", label: "Фермер", icon: "Wheat",
    desc: "Урожайность, NDVI, агрономия",
    shortcuts: [
      { label: "NDVI полей", section: "ndvi", icon: "Satellite" },
      { label: "Риски", section: "risks", icon: "ShieldAlert" },
      { label: "Планирование", section: "planner", icon: "ClipboardList" },
      { label: "Новости/погода", section: "news", icon: "Newspaper" },
    ],
  },
  {
    id: "trader", label: "Трейдер", icon: "TrendingUp",
    desc: "Цены, экспорт, биржа",
    shortcuts: [
      { label: "Прогнозы цен", section: "forecasts", icon: "TrendingUp" },
      { label: "Спрос/предложение", section: "supply", icon: "ArrowLeftRight" },
      { label: "AI-модель", section: "ai-model", icon: "Brain" },
      { label: "Новости", section: "news", icon: "Newspaper" },
    ],
  },
  {
    id: "processor", label: "Переработчик", icon: "Factory",
    desc: "Сырьё, логистика, себестоимость",
    shortcuts: [
      { label: "Карта сырья", section: "map", icon: "Map" },
      { label: "Аналитика", section: "analytics", icon: "BarChart3" },
      { label: "Бизнес-инстр.", section: "business", icon: "Calculator" },
      { label: "Интеграции", section: "integrations", icon: "Plug" },
    ],
  },
  {
    id: "investor", label: "Инвестор", icon: "DollarSign",
    desc: "Рентабельность, риски, макро",
    shortcuts: [
      { label: "Рентабельность", section: "analytics", icon: "BarChart3" },
      { label: "Риски", section: "risks", icon: "ShieldAlert" },
      { label: "AI-прогноз", section: "ai-model", icon: "Brain" },
      { label: "Тарифы", section: "pricing", icon: "CreditCard" },
    ],
  },
];

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
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground">AgroForecast Pro: Поволжье</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Прогнозирование рынка сельскохозяйственной продукции · 8 регионов · 12 культур · данные апрель 2026
          </p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setActiveSection("ai-model")} className="px-3 py-1.5 text-xs bg-primary/10 text-primary border border-primary/25 rounded-lg font-medium hover:bg-primary/20 transition-colors flex items-center gap-1.5">
            <Icon name="Brain" size={12} />AI-модель
          </button>
          <button onClick={() => setActiveSection("pricing")} className="px-3 py-1.5 text-xs bg-accent text-accent-foreground rounded-lg font-medium hover:bg-accent/90 transition-colors">Тарифы</button>
        </div>
      </div>

      {/* User profile selector */}
      <div className="glass-card rounded-xl p-4">
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-xs text-muted-foreground font-medium shrink-0">Профиль:</span>
          <div className="flex gap-2 flex-wrap flex-1">
            {USER_PROFILES.map(p => (
              <button key={p.id} onClick={() => setProfile(p.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg border transition-all font-medium
                  ${profile === p.id ? "bg-primary/15 text-primary border-primary/30" : "bg-secondary text-muted-foreground border-border hover:border-primary/30"}`}>
                <Icon name={p.icon as string} size={11} />{p.label}
              </button>
            ))}
          </div>
          {(() => {
            const cur = USER_PROFILES.find(p => p.id === profile)!;
            return (
              <div className="flex gap-1.5 flex-wrap">
                {cur.shortcuts.map(s => (
                  <button key={s.section} onClick={() => setActiveSection(s.section)}
                    className="flex items-center gap-1 px-2.5 py-1 text-[11px] rounded-lg bg-primary/8 text-primary border border-primary/20 hover:bg-primary/15 transition-colors font-medium">
                    <Icon name={s.icon as string} size={10} />{s.label}
                  </button>
                ))}
              </div>
            );
          })()}
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

      {/* Interactive Map + Alerts */}
      <div className="grid lg:grid-cols-2 gap-4">
        <div className="glass-card rounded-xl p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Icon name="Satellite" size={15} className="text-primary" />
              <span className="font-semibold text-sm">Интерактивная карта</span>
              {Object.keys(aiRisks).length > 0 ? (
                <span className="flex items-center gap-1 text-[10px] text-primary bg-primary/10 px-1.5 py-0.5 rounded font-mono">
                  <Icon name="Brain" size={9} />AI · live
                </span>
              ) : (
                <span className="text-[10px] text-muted-foreground animate-pulse">загрузка AI...</span>
              )}
            </div>
            <button onClick={() => setActiveSection("map")} className="text-xs text-primary hover:text-primary/80 transition-colors">Полная карта →</button>
          </div>
          <Suspense fallback={
            <div className="h-[340px] rounded-xl bg-secondary/40 animate-pulse flex items-center justify-center text-muted-foreground text-sm">
              Загрузка спутниковой карты...
            </div>
          }>
            <HomeMap
              selectedRegion={selectedRegion}
              onSelect={setSelectedRegion}
              aiRisks={aiRisks}
            />
          </Suspense>
          <div className="flex gap-4 mt-3 flex-wrap">
            {[
              { label: "Критический риск", color: "bg-destructive" },
              { label: "Средний риск",     color: "bg-accent" },
              { label: "Низкий риск",      color: "bg-primary" },
            ].map(l => (
              <span key={l.label} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <span className={`w-2.5 h-2.5 rounded-full ${l.color}`} />{l.label}
              </span>
            ))}
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
            {ALERTS.slice(0, 5).map(a => (
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
            <span className="font-semibold text-sm">Прогнозы цен AI · +3 месяца · апрель 2026</span>
            {aiLoading ? (
              <span className="flex items-center gap-1 text-[10px] text-muted-foreground animate-pulse">
                <Icon name="Brain" size={10} className="text-primary" />расчёт...
              </span>
            ) : (
              <span className="flex items-center gap-1 text-[10px] text-primary bg-primary/10 px-1.5 py-0.5 rounded font-mono">
                <Icon name="Brain" size={10} />ARIMA+LSTM
              </span>
            )}
          </div>
          <button onClick={() => setActiveSection("forecasts")} className="text-xs text-primary hover:text-primary/80 transition-colors">Подробнее →</button>
        </div>
        <div className={`grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3 transition-opacity ${aiLoading ? "opacity-60" : ""}`}>
          {displayForecasts.map((f, i) => (
            <div key={i}
              className="bg-secondary/40 rounded-lg p-3 hover:bg-secondary/70 transition-colors cursor-pointer border border-transparent hover:border-primary/20"
              onClick={() => { setSelectedCrop(f.crop); setActiveSection("forecasts"); }}>
              <div className="text-xs text-muted-foreground mb-1 truncate font-medium">{f.crop}</div>
              <div className="font-bold font-mono text-base text-foreground">
                {typeof f.forecastPrice === "number" ? f.forecastPrice.toLocaleString("ru") : f.forecastPrice} ₽
              </div>
              <div className="text-[10px] text-muted-foreground font-mono">
                тек. {typeof f.currentPrice === "number" ? f.currentPrice.toLocaleString("ru") : f.currentPrice} ₽/т
              </div>
              <div className={`flex items-center gap-1 text-xs font-bold mt-1.5 ${f.trend === "up" ? "text-primary" : "text-destructive"}`}>
                <Icon name={f.trend === "up" ? "TrendingUp" : "TrendingDown"} size={11} />
                {f.change > 0 ? "+" : ""}{typeof f.change === "number" ? f.change.toFixed(1) : f.change}%
              </div>
              <div className="mt-2">
                <div className="flex justify-between text-[10px] text-muted-foreground mb-1">
                  <span>Уверенность AI</span>
                  <span className="font-mono font-bold">{typeof f.confidence === "number" ? f.confidence.toFixed(0) : f.confidence}%</span>
                </div>
                <div className="h-1.5 bg-border rounded-full">
                  <div className="h-full rounded-full bg-primary transition-all duration-700"
                    style={{ width: `${f.confidence}%`, opacity: (Number(f.confidence) / 100) * 0.7 + 0.3 }} />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}