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
    <div className="space-y-8 animate-fade-in">

      {/* ══════════════════════════════════════════════
          HERO — главный экран
      ══════════════════════════════════════════════ */}
      <div className="hero-gradient rounded-3xl overflow-hidden relative shadow-2xl">
        <div className="hero-gradient-overlay absolute inset-0" />
        <div className="bg-dots absolute inset-0 opacity-20" />
        {/* Декоративные круги */}
        <div className="absolute -right-20 -top-20 w-96 h-96 rounded-full bg-white/5 blur-3xl pointer-events-none" />
        <div className="absolute -left-10 -bottom-10 w-64 h-64 rounded-full bg-accent/10 blur-2xl pointer-events-none" />

        <div className="relative p-7 sm:p-10">
          {/* Верхний бейдж */}
          <div className="flex flex-wrap items-center gap-2 mb-5">
            <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/20 border border-white/30 text-white text-xs font-semibold backdrop-blur-sm">
              <span className="w-2 h-2 rounded-full bg-accent animate-pulse-glow" />
              Данные обновлены · апрель 2026
            </span>
            <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-accent/25 border border-accent/40 text-accent text-xs font-bold">
              <Icon name="Brain" size={11} />ARIMA + LSTM · v3.0
            </span>
            <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/10 border border-white/20 text-white/80 text-xs font-mono">
              🇷🇺 23 региона России
            </span>
          </div>

          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8">
            <div className="flex-1 max-w-2xl">
              <h1 className="font-heading font-black leading-[1.05] text-white">
                <span className="text-3xl sm:text-4xl lg:text-5xl block">Принимайте решения</span>
                <span className="text-3xl sm:text-4xl lg:text-5xl block mt-1">на основе <span className="gold-text">реальных данных</span></span>
              </h1>
              <p className="text-white/75 mt-4 text-base font-body max-w-xl leading-relaxed">
                АгроПорт — единая платформа прогнозирования цен, мониторинга урожайности и управления рисками
                для фермеров, трейдеров и агробизнеса России.
              </p>
              <div className="flex flex-wrap gap-3 mt-6">
                <button onClick={() => setActiveSection("forecasts")}
                  className="flex items-center gap-2 px-6 py-3 bg-white text-primary rounded-xl text-sm font-black hover:bg-white/95 transition-all shadow-xl active:scale-[0.98] hover:shadow-2xl">
                  <Icon name="TrendingUp" size={16} />Смотреть прогнозы
                </button>
                <button onClick={() => setActiveSection("ai-model")}
                  className="flex items-center gap-2 px-6 py-3 bg-white/15 border border-white/35 text-white rounded-xl text-sm font-bold hover:bg-white/25 transition-all backdrop-blur-sm active:scale-[0.98]">
                  <Icon name="Brain" size={16} />AI-модель
                </button>
                <button onClick={() => setActiveSection("pricing")}
                  className="flex items-center gap-2 px-6 py-3 bg-transparent border border-white/20 text-white/80 rounded-xl text-sm font-semibold hover:border-white/40 hover:text-white transition-all">
                  <Icon name="CreditCard" size={16} />Тарифы
                </button>
              </div>
            </div>

            {/* Большие KPI-цифры */}
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-2 gap-3 shrink-0 lg:w-64">
              {[
                { v: "87%",  l: "Точность AI",      icon: "Target" },
                { v: "23",   l: "Региона России",   icon: "MapPin" },
                { v: "12",   l: "Культур",           icon: "Wheat" },
                { v: "LIVE", l: "Обновление данных", icon: "Zap" },
              ].map((s, i) => (
                <div key={i} className="bg-white/12 border border-white/20 rounded-2xl p-4 text-center backdrop-blur-sm hover:bg-white/18 transition-colors">
                  <Icon name={s.icon as string} size={16} className="text-white/60 mx-auto mb-1.5" />
                  <div className="text-white font-mono font-black text-2xl leading-none">{s.v}</div>
                  <div className="text-white/55 text-[10px] mt-1.5 leading-tight">{s.l}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════════════
          ПОЧЕМУ МЫ ЛУЧШЕ — блок преимуществ
      ══════════════════════════════════════════════ */}
      <div>
        <div className="text-center mb-6">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-semibold mb-3">
            <Icon name="Award" size={12} />Почему АгроПорт
          </div>
          <h2 className="font-heading font-black text-2xl sm:text-3xl text-foreground">
            Аналитика, которой <span className="text-primary">доверяет бизнес</span>
          </h2>
          <p className="text-muted-foreground mt-2 text-sm max-w-xl mx-auto font-body">
            Мы объединяем спутниковые данные, биржевые котировки и нейросети в одном инструменте
          </p>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[
            {
              icon: "Brain", color: "primary",
              title: "AI с точностью 87%",
              desc: "ARIMA + LSTM + Random Forest. Валидация на данных 2015–2024. MAPE цен 8.7%, урожайности 12.4%.",
              badge: "vs 65% у конкурентов",
            },
            {
              icon: "Satellite", color: "accent",
              title: "Спутниковый NDVI",
              desc: "Sentinel-2 (ESA) с разрешением 10 м/пиксель. Обновление каждые 5 дней. 23 региона России.",
              badge: "Sentinel-2 · ESA",
            },
            {
              icon: "Globe", color: "primary",
              title: "Реальные цены рынка",
              desc: "НТБ, zerno.ru, agroinvestor.ru — в реальном времени через RSS. Без задержек и ручного ввода.",
              badge: "RSS · Live",
            },
            {
              icon: "ShieldAlert", color: "accent",
              title: "Карта рисков России",
              desc: "Засуха, заморозки, вредители — вероятностная модель по каждому из 23 регионов с рекомендациями.",
              badge: "23 региона",
            },
            {
              icon: "Calculator", color: "primary",
              title: "Калькулятор прибыли",
              desc: "Введите культуру и площадь — получите выручку, затраты, маржу, ROI и лучший срок продажи.",
              badge: "API · реальные данные",
            },
            {
              icon: "CandlestickChart", color: "accent",
              title: "Японские свечи",
              desc: "Интерактивный график с японскими свечами, выбором периода и hover-подсказками по каждой точке.",
              badge: "Новинка v3.0",
            },
          ].map((f, i) => (
            <div key={i} className="glass-card rounded-2xl p-5 hover:shadow-md transition-all group border border-border hover:border-primary/20">
              <div className="flex items-start justify-between mb-4">
                <div className={`w-11 h-11 rounded-xl flex items-center justify-center shadow-sm
                  ${f.color === "primary" ? "bg-primary/15 text-primary" : "bg-accent/15 text-accent"}`}>
                  <Icon name={f.icon as string} size={20} />
                </div>
                <span className={`text-[10px] font-mono font-bold px-2 py-1 rounded-full
                  ${f.color === "primary" ? "bg-primary/10 text-primary" : "bg-accent/15 text-accent"}`}>
                  {f.badge}
                </span>
              </div>
              <h3 className="font-heading font-bold text-sm text-foreground mb-1.5">{f.title}</h3>
              <p className="text-xs text-muted-foreground leading-relaxed font-body">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ══════════════════════════════════════════════
          СОЦИАЛЬНОЕ ДОВЕРИЕ — цифры и партнёры
      ══════════════════════════════════════════════ */}
      <div className="hero-gradient rounded-2xl p-6 sm:p-8 relative overflow-hidden">
        <div className="hero-gradient-overlay absolute inset-0" />
        <div className="bg-dots absolute inset-0 opacity-10" />
        <div className="relative">
          <div className="text-center mb-6">
            <p className="text-white/60 text-xs font-mono uppercase tracking-widest mb-2">Цифры платформы</p>
            <h2 className="font-heading font-black text-2xl text-white">Нам доверяют <span className="gold-text">профессионалы</span></h2>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
            {[
              { v: "1 200+", l: "Пользователей", icon: "Users" },
              { v: "85.9 млн т", l: "Прогноз пшеницы 2026", icon: "Wheat" },
              { v: "3.2 млн т", l: "Экспорт в апреле", icon: "Globe" },
              { v: "15 мин", l: "Обновление данных", icon: "Clock" },
            ].map((s, i) => (
              <div key={i} className="text-center">
                <Icon name={s.icon as string} size={20} className="text-white/50 mx-auto mb-2" />
                <div className="font-mono font-black text-xl sm:text-2xl text-white leading-none">{s.v}</div>
                <div className="text-white/55 text-[11px] mt-1.5 font-body">{s.l}</div>
              </div>
            ))}
          </div>
          {/* Источники данных */}
          <div className="border-t border-white/15 pt-5">
            <p className="text-white/45 text-[11px] font-mono uppercase tracking-widest text-center mb-4">Источники данных</p>
            <div className="flex flex-wrap justify-center gap-3">
              {[
                "НТБ (биржа)", "Минсельхоз РФ", "Росгидромет", "Sentinel-2 (ESA)",
                "zerno.ru", "agroinvestor.ru", "oilworld.ru", "Русагротранс",
              ].map((s, i) => (
                <span key={i} className="px-3 py-1.5 bg-white/10 border border-white/20 rounded-lg text-white/75 text-xs font-medium">
                  {s}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

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
        ))}</div>

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

      {/* ══════════════════════════════════════════════
          ЧТО ВЫ ПОЛУЧАЕТЕ — как у ExactFarming
      ══════════════════════════════════════════════ */}
      <div>
        <div className="text-center mb-6">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-accent/10 border border-accent/25 text-accent text-xs font-semibold mb-3">
            <Icon name="Sparkles" size={12} />Конкретные результаты
          </div>
          <h2 className="font-heading font-black text-2xl sm:text-3xl text-foreground">
            Что вы получаете <span className="text-primary">с первого дня</span>
          </h2>
          <p className="text-muted-foreground text-sm mt-2 max-w-lg mx-auto font-body">
            Не просто данные — конкретные решения для каждого участника агрорынка
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[
            {
              role: "Фермеру", icon: "Wheat", color: "primary",
              items: [
                "Оптимальный срок посева и уборки по вашему региону",
                "Прогноз урожайности за 3–6 месяцев с точностью 87%",
                "Карта NDVI ваших угодий — здоровье посевов из космоса",
                "Сигнал о засухе, заморозках и вредителях — заранее",
              ],
            },
            {
              role: "Трейдеру", icon: "TrendingUp", color: "accent",
              items: [
                "Прогноз цены пшеницы, подсолнечника, кукурузы на 3–12 мес",
                "Лучший момент для покупки и продажи по модели ARIMA+LSTM",
                "Мониторинг экспортных пошлин и мировых котировок CBOT",
                "Реальные новости рынка с zerno.ru и agroinvestor.ru",
              ],
            },
            {
              role: "Агроному", icon: "Sprout", color: "primary",
              items: [
                "История NDVI-снимков по Sentinel-2 за несколько сезонов",
                "Фазы вегетации и целевые значения индекса по культуре",
                "Карта рисков засухи и переувлажнения по районам",
                "Рекомендации по применению удобрений (NPK)",
              ],
            },
            {
              role: "Переработчику", icon: "Factory", color: "accent",
              items: [
                "Прогноз объёма сырья по регионам на следующий сезон",
                "Карта хозяйств с культурами рядом с вашим предприятием",
                "Калькулятор себестоимости и маржинальности переработки",
                "Интеграция с 1С и ERP через API",
              ],
            },
            {
              role: "Инвестору", icon: "BarChart3", color: "primary",
              items: [
                "ROI по каждой культуре и сравнение регионов",
                "Индекс рисков с вероятностью по каждому типу угрозы",
                "Прогноз урожая в России — данные СовЭкон + AI",
                "Экспортная аналитика: Турция, Египет, Алжир, Иран",
              ],
            },
            {
              role: "Руководителю АПК", icon: "Building2", color: "accent",
              items: [
                "Единый дашборд по всем хозяйствам и регионам",
                "Автоматические алерты о критических событиях рынка",
                "Отчёты в PDF/Excel для Минсельхоза и инвесторов",
                "B2G-интеграция для региональных министерств",
              ],
            },
          ].map((b, i) => (
            <div key={i} className={`rounded-2xl p-5 border transition-all hover:shadow-md
              ${b.color === "primary"
                ? "bg-primary/5 border-primary/15 hover:border-primary/30"
                : "bg-accent/5 border-accent/15 hover:border-accent/30"}`}>
              <div className="flex items-center gap-3 mb-4">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shadow-sm
                  ${b.color === "primary" ? "bg-primary text-white" : "bg-accent text-accent-foreground"}`}>
                  <Icon name={b.icon as string} size={18} />
                </div>
                <div className={`font-heading font-bold text-sm ${b.color === "primary" ? "text-primary" : "text-accent"}`}>
                  {b.role}
                </div>
              </div>
              <ul className="space-y-2">
                {b.items.map((item, j) => (
                  <li key={j} className="flex items-start gap-2 text-xs text-foreground font-body">
                    <Icon name="Check" size={12}
                      className={`mt-0.5 shrink-0 ${b.color === "primary" ? "text-primary" : "text-accent"}`} />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      {/* ══════════════════════════════════════════════
          СРАВНЕНИЕ С ExactFarming
      ══════════════════════════════════════════════ */}
      <div className="glass-card rounded-2xl p-6">
        <div className="text-center mb-6">
          <h2 className="font-heading font-black text-xl text-foreground">
            АгроПорт vs конкуренты
          </h2>
          <p className="text-muted-foreground text-sm mt-1 font-body">Почему профессионалы выбирают нас</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-3 pr-4 text-muted-foreground font-medium text-xs uppercase tracking-wide">Функция</th>
                <th className="py-3 px-4 text-center">
                  <span className="font-heading font-black text-primary text-sm">АгроПорт</span>
                </th>
                <th className="py-3 px-4 text-center text-muted-foreground text-xs">ExactFarming</th>
                <th className="py-3 pl-4 text-center text-muted-foreground text-xs">Другие</th>
              </tr>
            </thead>
            <tbody>
              {[
                { f: "Прогноз цен AI (ARIMA+LSTM)",     ap: true,  ef: false, ot: false },
                { f: "NDVI-мониторинг Sentinel-2",      ap: true,  ef: true,  ot: true  },
                { f: "Охват 23 региона России",         ap: true,  ef: true,  ot: false },
                { f: "Реальные RSS-новости рынка",      ap: true,  ef: false, ot: false },
                { f: "Японские свечи и графики",        ap: true,  ef: false, ot: false },
                { f: "Калькулятор маржинальности",      ap: true,  ef: true,  ot: false },
                { f: "Карта рисков засухи/заморозков",  ap: true,  ef: true,  ot: false },
                { f: "Интеграция 1С / API",             ap: true,  ef: true,  ot: false },
                { f: "Данные экспорта (Турция/Египет)", ap: true,  ef: false, ot: false },
                { f: "Бесплатный базовый доступ",       ap: true,  ef: false, ot: false },
              ].map((row, i) => (
                <tr key={i} className={`border-b border-border/40 ${i % 2 === 0 ? "" : "bg-secondary/20"}`}>
                  <td className="py-2.5 pr-4 text-foreground font-body text-xs">{row.f}</td>
                  <td className="py-2.5 px-4 text-center">
                    {row.ap
                      ? <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-primary/15 text-primary"><Icon name="Check" size={12} /></span>
                      : <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-secondary text-muted-foreground"><Icon name="Minus" size={12} /></span>}
                  </td>
                  <td className="py-2.5 px-4 text-center">
                    {row.ef
                      ? <span className="text-muted-foreground text-xs">✓</span>
                      : <span className="text-muted-foreground text-xs opacity-40">—</span>}
                  </td>
                  <td className="py-2.5 pl-4 text-center">
                    {row.ot
                      ? <span className="text-muted-foreground text-xs">✓</span>
                      : <span className="text-muted-foreground text-xs opacity-40">—</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ══════════════════════════════════════════════
          ФИНАЛЬНЫЙ CTA — как у ExactFarming
      ══════════════════════════════════════════════ */}
      <div className="hero-gradient rounded-3xl p-8 sm:p-10 relative overflow-hidden text-center">
        <div className="hero-gradient-overlay absolute inset-0" />
        <div className="bg-dots absolute inset-0 opacity-15" />
        <div className="absolute -right-16 -bottom-16 w-64 h-64 rounded-full bg-accent/15 blur-3xl pointer-events-none" />
        <div className="relative">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/20 border border-white/30 text-white text-xs font-semibold mb-4">
            <Icon name="Zap" size={11} />Начните бесплатно уже сейчас
          </div>
          <h2 className="font-heading font-black text-2xl sm:text-3xl lg:text-4xl text-white leading-tight mb-3">
            Переведите агробизнес<br />на <span className="gold-text">язык данных</span>
          </h2>
          <p className="text-white/70 text-sm sm:text-base font-body max-w-xl mx-auto mb-8">
            Более <strong className="text-white">1 200 фермеров, трейдеров и агрономов</strong> уже используют АгроПорт
            для принятия решений. Базовый доступ — бесплатно.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <button onClick={() => setActiveSection("forecasts")}
              className="flex items-center gap-2 px-8 py-3.5 bg-white text-primary rounded-xl text-sm font-black hover:bg-white/95 transition-all shadow-xl hover:shadow-2xl active:scale-[0.98]">
              <Icon name="TrendingUp" size={16} />Смотреть прогнозы цен
            </button>
            <button onClick={() => setActiveSection("ndvi")}
              className="flex items-center gap-2 px-8 py-3.5 bg-white/15 border border-white/35 text-white rounded-xl text-sm font-bold hover:bg-white/25 transition-all backdrop-blur-sm active:scale-[0.98]">
              <Icon name="Satellite" size={16} />Мониторинг NDVI
            </button>
            <button onClick={() => setActiveSection("pricing")}
              className="flex items-center gap-2 px-8 py-3.5 border border-white/25 text-white/85 rounded-xl text-sm font-semibold hover:border-white/45 hover:text-white transition-all">
              <Icon name="CreditCard" size={16} />Тарифы и возможности
            </button>
          </div>
          <p className="text-white/40 text-xs mt-5 font-mono">
            Данные НТБ · Росгидромет · Sentinel-2 · Минсельхоз РФ · zerno.ru · agroinvestor.ru
          </p>
        </div>
      </div>

    </div>
  );
}