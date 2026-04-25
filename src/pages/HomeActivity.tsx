import { lazy, Suspense } from "react";
import Icon from "@/components/ui/icon";
import { ALERTS } from "./data";

const HomeMap = lazy(() => import("@/components/HomeMap"));

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

const USER_PROFILES = [
  {
    id: "farmer", label: "Фермер", icon: "Wheat",
    shortcuts: [
      { label: "NDVI полей", section: "ndvi", icon: "Satellite" },
      { label: "Риски", section: "risks", icon: "ShieldAlert" },
      { label: "Планирование", section: "planner", icon: "ClipboardList" },
      { label: "Новости/погода", section: "news", icon: "Newspaper" },
    ],
  },
  {
    id: "trader", label: "Трейдер", icon: "TrendingUp",
    shortcuts: [
      { label: "Прогнозы цен", section: "forecasts", icon: "TrendingUp" },
      { label: "Спрос/предложение", section: "supply", icon: "ArrowLeftRight" },
      { label: "AI-модель", section: "ai-model", icon: "Brain" },
      { label: "Новости", section: "news", icon: "Newspaper" },
    ],
  },
  {
    id: "processor", label: "Переработчик", icon: "Factory",
    shortcuts: [
      { label: "Карта сырья", section: "map", icon: "Map" },
      { label: "Аналитика", section: "analytics", icon: "BarChart3" },
      { label: "Бизнес-инстр.", section: "business", icon: "Calculator" },
      { label: "Интеграции", section: "integrations", icon: "Plug" },
    ],
  },
  {
    id: "investor", label: "Инвестор", icon: "DollarSign",
    shortcuts: [
      { label: "Рентабельность", section: "analytics", icon: "BarChart3" },
      { label: "Риски", section: "risks", icon: "ShieldAlert" },
      { label: "AI-прогноз", section: "ai-model", icon: "Brain" },
      { label: "Тарифы", section: "pricing", icon: "CreditCard" },
    ],
  },
];

interface HomeActivityProps {
  selectedRegion: string | null;
  setSelectedRegion: (id: string) => void;
  setSelectedCrop: (crop: string) => void;
  setActiveSection: (section: string) => void;
  profile: string;
  setProfile: (id: string) => void;
  aiRisks: Record<string, AiRegionRisk>;
  displayForecasts: AiForecastItem[];
  aiLoading: boolean;
}

export default function HomeActivity({
  selectedRegion, setSelectedRegion, setSelectedCrop, setActiveSection,
  profile, setProfile, aiRisks, displayForecasts, aiLoading,
}: HomeActivityProps) {
  return (
    <>
      {/* ══════════════════════════════════════════════
          ПРОФИЛИ ПОЛЬЗОВАТЕЛЕЙ
      ══════════════════════════════════════════════ */}
      <div className="glass-card rounded-2xl p-5">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-8 h-8 rounded-lg bg-primary/15 flex items-center justify-center">
            <Icon name="Users" size={15} className="text-primary" />
          </div>
          <div>
            <div className="font-heading font-bold text-sm text-foreground">Быстрый доступ</div>
            <div className="text-[11px] text-muted-foreground">выберите ваш профиль</div>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {USER_PROFILES.map(p => (
            <button key={p.id} onClick={() => setProfile(p.id)}
              className={`flex items-center gap-1.5 px-3 py-2 text-xs rounded-xl border transition-all font-semibold
                ${profile === p.id ? "bg-primary text-white border-primary shadow-md" : "bg-secondary text-muted-foreground border-border hover:border-primary/40 hover:text-primary"}`}>
              <Icon name={p.icon as string} size={12} />{p.label}
            </button>
          ))}
          <span className="text-muted-foreground text-[10px] mx-2">→</span>
          {(() => {
            const cur = USER_PROFILES.find(p => p.id === profile)!;
            return cur.shortcuts.map(s => (
              <button key={s.section} onClick={() => setActiveSection(s.section)}
                className="flex items-center gap-1 px-2.5 py-2 text-[11px] rounded-xl bg-primary/8 text-primary border border-primary/20 hover:bg-primary/15 transition-colors font-medium">
                <Icon name={s.icon as string} size={10} />{s.label}
              </button>
            ));
          })()}
        </div>
      </div>

      {/* ── Feature-карточки (быстрый переход) ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { icon: "BarChart3", title: "Прогноз урожайности", desc: "По регионам и культурам", section: "forecasts", color: "primary" },
          { icon: "TrendingUp", title: "Анализ цен и спроса", desc: "Биржа и экспортные котировки", section: "supply", color: "accent" },
          { icon: "ShoppingCart", title: "Бизнес-инструменты", desc: "Калькулятор маржинальности", section: "business", color: "primary" },
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

      {/* ── Interactive Map + Alerts ── */}
      <div className="grid lg:grid-cols-2 gap-4">
        <div className="glass-card rounded-xl p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-primary/15 flex items-center justify-center">
                <Icon name="Satellite" size={13} className="text-primary" />
              </div>
              <span className="font-heading font-bold text-sm">Карта России</span>
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
    </>
  );
}
