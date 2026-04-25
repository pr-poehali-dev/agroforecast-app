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
      {/* ── Hero-блок ── */}
      <div className="hero-gradient rounded-2xl overflow-hidden relative shadow-lg">
        <div className="hero-gradient-overlay absolute inset-0" />
        <div className="bg-dots absolute inset-0 opacity-20" />
        <div className="relative p-6 sm:p-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-3">
                <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/20 border border-white/30 text-white text-[11px] font-medium">
                  <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse-glow" />
                  Данные обновлены · апрель 2026
                </span>
                <span className="hidden sm:flex items-center gap-1 px-2 py-1 rounded-full bg-accent/25 border border-accent/40 text-accent text-[11px] font-bold">
                  <Icon name="Brain" size={10} />ARIMA+LSTM
                </span>
              </div>
              <h1 className="font-heading text-2xl sm:text-3xl font-black text-white leading-tight">
                АгроПорт:<br className="sm:hidden" /> аналитика и торговля<br />
                <span className="gold-text">для агробизнеса</span>
              </h1>
              <p className="text-white/75 mt-2 text-sm font-body max-w-md">
                Прогнозирование цен и урожайности · 23 региона России · 12 культур · спутниковый мониторинг NDVI
              </p>
              <div className="flex gap-3 mt-5 flex-wrap">
                <button onClick={() => setActiveSection("forecasts")}
                  className="flex items-center gap-2 px-5 py-2.5 bg-white text-primary rounded-xl text-sm font-bold hover:bg-white/90 transition-all shadow-lg active:scale-[0.98]">
                  <Icon name="TrendingUp" size={15} />Начать работу
                </button>
                <button onClick={() => setActiveSection("ai-model")}
                  className="flex items-center gap-2 px-5 py-2.5 bg-white/15 border border-white/30 text-white rounded-xl text-sm font-semibold hover:bg-white/25 transition-all active:scale-[0.98]">
                  <Icon name="Brain" size={15} />AI-модель
                </button>
              </div>
            </div>
            {/* Декоративные stats */}
            <div className="hidden lg:grid grid-cols-2 gap-3 shrink-0">
              {[
                { v: "94.7%", l: "Точность AI" },
                { v: "23 рег.", l: "Россия" },
                { v: "12", l: "культур" },
                { v: "LIVE", l: "данные" },
              ].map((s, i) => (
                <div key={i} className="bg-white/15 border border-white/25 rounded-xl p-3 text-center backdrop-blur-sm">
                  <div className="text-white font-mono font-black text-lg leading-none">{s.v}</div>
                  <div className="text-white/65 text-[10px] mt-1">{s.l}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── Feature-карточки ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { icon: "BarChart3", title: "Прогноз урожайности", desc: "По регионам и культурам", section: "forecasts", color: "primary" },
          { icon: "TrendingUp", title: "Анализ цен и спроса", desc: "Биржа и экспортные котировки", section: "supply", color: "accent" },
          { icon: "ShoppingCart", title: "Маркетплейс", desc: "Сельхозпродукция Поволжья", section: "business", color: "primary" },
          { icon: "Plug", title: "Интеграция 1С / ERP", desc: "API и готовые коннекторы", section: "integrations", color: "accent" },
        ].map((f, i) => (
          <button key={i} onClick={() => setActiveSection(f.section)}
            className="feature-card rounded-xl p-4 text-left group">
            <div className={`w-10 h-10 rounded-xl mb-3 flex items-center justify-center transition-colors
              ${f.color === "primary" ? "bg-primary/15 text-primary group-hover:bg-primary group-hover:text-white" : "bg-accent/15 text-accent group-hover:bg-accent group-hover:text-white"}`}>
              <Icon name={f.icon as string} size={18} />
            </div>
            <div className="font-heading font-bold text-sm text-foreground">{f.title}</div>
            <div className="text-xs text-muted-foreground mt-1 font-body">{f.desc}</div>
          </button>
        ))}
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

      {/* ── KPI stats ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {STATS.map((s, i) => (
          <div key={i} className="kpi-card rounded-xl p-4">
            <div className="flex items-start justify-between mb-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center shadow-sm
                ${s.color === "emerald" ? "bg-primary/15 text-primary" :
                  s.color === "amber" ? "bg-accent/15 text-accent" :
                  s.color === "cyan" ? "bg-cyan-500/15 text-cyan-500" :
                  "bg-destructive/15 text-destructive"}`}>
                <Icon name={s.icon as string} size={18} />
              </div>
              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full
                ${s.color === "emerald" ? "text-primary bg-primary/10" :
                  s.color === "amber" ? "text-amber-600 bg-amber-50" :
                  s.color === "cyan" ? "text-cyan-600 bg-cyan-50" :
                  "text-destructive bg-destructive/10"}`}>
                LIVE
              </span>
            </div>
            <div className="font-mono font-black text-2xl text-foreground leading-none">
              {s.value}<span className="text-sm font-normal text-muted-foreground">{s.suffix}</span>
            </div>
            <div className="text-xs text-muted-foreground mt-1.5 font-body">{s.label}</div>
          </div>
        ))}
      </div>

      {/* ── Interactive Map + Alerts ── */}
      <div className="grid lg:grid-cols-2 gap-4">
        <div className="glass-card rounded-xl p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-primary/15 flex items-center justify-center">
                <Icon name="Satellite" size={13} className="text-primary" />
              </div>
              <span className="font-heading font-bold text-sm">Карта Поволжья</span>
              {Object.keys(aiRisks).length > 0 ? (
                <span className="flex items-center gap-1 text-[10px] text-primary bg-primary/10 border border-primary/20 px-1.5 py-0.5 rounded-full font-mono">
                  <Icon name="Brain" size={9} />AI
                </span>
              ) : (
                <span className="text-[10px] text-muted-foreground animate-pulse">загрузка...</span>
              )}
            </div>
            <button onClick={() => setActiveSection("map")} className="text-xs text-primary hover:text-primary/80 transition-colors flex items-center gap-1">
              Полная карта <Icon name="ArrowRight" size={11} />
            </button>
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
              <div className="w-7 h-7 rounded-lg bg-accent/15 flex items-center justify-center">
                <Icon name="Bell" size={13} className="text-accent" />
              </div>
              <span className="font-heading font-bold text-sm">Последние события</span>
              <span className="px-1.5 py-0.5 rounded-full bg-destructive/15 text-destructive text-[10px] font-bold badge-pulse">7</span>
            </div>
            <button onClick={() => setActiveSection("alerts")} className="text-xs text-primary hover:text-primary/80 transition-colors flex items-center gap-1">
              Все <Icon name="ArrowRight" size={11} />
            </button>
          </div>
          <div className="space-y-2">
            {ALERTS.slice(0, 5).map(a => (
              <div key={a.id} className={`flex items-start gap-3 p-3 rounded-xl cursor-pointer transition-all hover:scale-[1.01]
                ${a.type === "critical" ? "bg-destructive/8 border border-destructive/20" :
                  a.type === "warning" ? "bg-amber-50 border border-amber-200" :
                  "bg-secondary/60 border border-border"}`}>
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 shadow-sm
                  ${a.type === "critical" ? "bg-destructive text-white" :
                    a.type === "warning" ? "bg-accent text-accent-foreground" : "bg-primary text-white"}`}>
                  <Icon name={a.icon as string} size={13} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-semibold text-foreground truncate font-heading">{a.title}</div>
                  <div className="text-xs text-muted-foreground truncate mt-0.5">{a.desc}</div>
                </div>
                <span className="text-[10px] text-muted-foreground shrink-0 mt-0.5">{a.time}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Live AI price forecasts ── */}
      <div className="glass-card rounded-xl p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2.5 flex-wrap">
            <div className="w-8 h-8 rounded-lg bg-primary/15 flex items-center justify-center">
              <Icon name="TrendingUp" size={16} className="text-primary" />
            </div>
            <div>
              <div className="font-heading font-bold text-sm text-foreground">Прогнозы цен · +3 месяца</div>
              <div className="text-[11px] text-muted-foreground font-body">апрель 2026 · AI-модель ARIMA+LSTM</div>
            </div>
            {aiLoading ? (
              <span className="flex items-center gap-1 text-[10px] text-muted-foreground animate-pulse px-2 py-1 bg-secondary rounded-full">
                <Icon name="Loader" size={9} />расчёт...
              </span>
            ) : (
              <span className="flex items-center gap-1 text-[10px] text-primary bg-primary/10 border border-primary/20 px-2 py-1 rounded-full font-mono">
                <Icon name="Brain" size={9} />LIVE
              </span>
            )}
          </div>
          <button onClick={() => setActiveSection("forecasts")}
            className="text-xs text-primary hover:text-primary/80 transition-colors flex items-center gap-1 shrink-0">
            Все прогнозы <Icon name="ArrowRight" size={12} />
          </button>
        </div>
        <div className={`grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3 transition-opacity ${aiLoading ? "opacity-60" : ""}`}>
          {displayForecasts.map((f, i) => (
            <button key={i}
              className="bg-background rounded-xl p-3.5 text-left hover:bg-secondary transition-colors cursor-pointer border border-border hover:border-primary/30 hover:shadow-sm group"
              onClick={() => { setSelectedCrop(f.crop); setActiveSection("forecasts"); }}>
              <div className="flex items-center justify-between mb-2">
                <div className="text-[11px] text-muted-foreground font-medium truncate flex-1">{f.crop.split(" ")[0]}</div>
                <div className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 ml-1
                  ${f.trend === "up" ? "bg-primary/15 text-primary" : "bg-destructive/15 text-destructive"}`}>
                  <Icon name={f.trend === "up" ? "TrendingUp" : "TrendingDown"} size={11} />
                </div>
              </div>
              <div className="font-mono font-black text-[17px] text-foreground leading-tight">
                {typeof f.forecastPrice === "number" ? f.forecastPrice.toLocaleString("ru") : f.forecastPrice}
                <span className="text-xs font-normal text-muted-foreground"> ₽/т</span>
              </div>
              <div className={`text-xs font-bold mt-1 ${f.trend === "up" ? "text-primary" : "text-destructive"}`}>
                {f.change > 0 ? "+" : ""}{typeof f.change === "number" ? f.change.toFixed(1) : f.change}%
                <span className="text-[10px] font-normal text-muted-foreground ml-1">прогноз</span>
              </div>
              <div className="mt-2.5">
                <div className="h-1 bg-border rounded-full overflow-hidden">
                  <div className="progress-bar h-full transition-all duration-700"
                    style={{ width: `${f.confidence}%` }} />
                </div>
                <div className="text-[10px] text-muted-foreground mt-1 font-mono">AI: {typeof f.confidence === "number" ? f.confidence.toFixed(0) : f.confidence}%</div>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}