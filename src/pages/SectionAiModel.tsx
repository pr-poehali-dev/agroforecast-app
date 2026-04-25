import { useState, useEffect } from "react";
import Icon from "@/components/ui/icon";
import {
  AI_URL, CROPS, HORIZONS, REGION_NAMES,
  ModelMeta, RegionForecast, SingleForecast, ChartPoint,
} from "./AiModelTypes";
import AiModelSingleTab from "./AiModelSingleTab";
import AiModelAllTab from "./AiModelAllTab";
import AiModelChartTab from "./AiModelChartTab";

const TAB_CONFIG = [
  { id: "single", label: "Детальный прогноз", icon: "BarChart2" },
  { id: "all",    label: "Все регионы",       icon: "Map" },
  { id: "chart",  label: "График цен",        icon: "TrendingUp" },
] as const;

export default function SectionAiModel() {
  const [crop, setCrop] = useState("Пшеница озимая");
  const [region, setRegion] = useState("samara");
  const [horizon, setHorizon] = useState(3);
  const [tab, setTab] = useState<"single" | "all" | "chart">("single");

  const [meta, setMeta] = useState<ModelMeta | null>(null);
  const [single, setSingle] = useState<SingleForecast | null>(null);
  const [allRegions, setAllRegions] = useState<RegionForecast[]>([]);
  const [chart, setChart] = useState<ChartPoint[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch(AI_URL).then(r => r.json()).then(d => setMeta(d.model_info)).catch(() => {});
  }, []);

  useEffect(() => {
    setLoading(true);
    const baseUrl = `${AI_URL}?crop=${encodeURIComponent(crop)}&horizon=${horizon}`;
    Promise.all([
      fetch(`${baseUrl}&region=${region}`).then(r => r.json()),
      fetch(`${baseUrl}&all=1`).then(r => r.json()),
      fetch(`${baseUrl}&region=${region}&chart=1`).then(r => r.json()),
    ])
      .then(([s, a, c]) => {
        setSingle(s);
        setAllRegions(a.regions || []);
        setChart(c.series || []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [crop, region, horizon]);

  return (
    <div className="space-y-6 animate-fade-in">

      {/* ── Hero-шапка ── */}
      <div className="hero-gradient rounded-2xl p-5 sm:p-7 relative overflow-hidden shadow-lg">
        <div className="hero-gradient-overlay absolute inset-0" />
        <div className="bg-dots absolute inset-0 opacity-15" />
        <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-5">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Icon name="Brain" size={14} className="text-white/80" />
              <span className="text-white/65 text-xs font-mono uppercase tracking-widest">Нейросетевая модель</span>
            </div>
            <h1 className="font-heading font-black text-2xl sm:text-3xl text-white leading-tight">
              AI‑модель<br /><span className="gold-text">прогнозирования</span>
            </h1>
            <p className="text-white/65 text-sm mt-1.5 font-body max-w-sm">
              LSTM + Random Forest · ARIMA + Prophet · горизонт 3–12 месяцев
            </p>
          </div>
          {meta && (
            <div className="grid grid-cols-3 gap-2 shrink-0">
              {[
                { v: `${meta.validation_mape_price}%`, l: "MAPE цен" },
                { v: `${meta.validation_mape_yield}%`, l: "MAPE урожай" },
                { v: `${meta.risk_accuracy_pct}%`,     l: "Точность рисков" },
              ].map((s, i) => (
                <div key={i} className="bg-white/15 border border-white/25 rounded-xl px-3 py-3 text-center backdrop-blur-sm">
                  <div className="font-mono font-black text-lg text-white leading-none">{s.v}</div>
                  <div className="text-white/55 text-[10px] mt-1 leading-tight">{s.l}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Архитектурные карточки ── */}
      {meta && (
        <div className="grid sm:grid-cols-3 gap-4">
          {[
            { icon: "Sprout",     label: "Модуль урожайности", value: meta.yield_model, badge: `MAPE ${meta.validation_mape_yield}%`, color: "primary", desc: "Предсказывает урожайность по NDVI, метео, истории" },
            { icon: "TrendingUp", label: "Модуль цен",         value: meta.price_model, badge: `MAPE ${meta.validation_mape_price}%`, color: "accent",  desc: "Цены на основе биржи, экспорта, спроса" },
            { icon: "ShieldAlert",label: "Модуль рисков",      value: meta.risk_model,  badge: `Точность ${meta.risk_accuracy_pct}%`, color: "primary", desc: "Засуха, заморозки, вредители — вероятность и уровень" },
          ].map((m, i) => (
            <div key={i} className={`glass-card rounded-2xl p-5 border-t-4 ${m.color === "primary" ? "border-t-primary" : "border-t-accent"}`}>
              <div className="flex items-center gap-3 mb-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shadow-sm ${m.color === "primary" ? "bg-primary/15 text-primary" : "bg-accent/15 text-accent"}`}>
                  <Icon name={m.icon as string} size={18} />
                </div>
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">{m.label}</span>
              </div>
              <div className="font-heading font-bold text-sm text-foreground leading-snug mb-2">{m.value}</div>
              <p className="text-[11px] text-muted-foreground mb-3 font-body">{m.desc}</p>
              <span className={`inline-flex px-2.5 py-1 text-[10px] font-mono rounded-full border font-bold
                ${m.color === "primary" ? "bg-primary/10 border-primary/25 text-primary" : "bg-accent/10 border-accent/25 text-accent"}`}>
                {m.badge}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* ── Панель управления ── */}
      <div className="glass-card rounded-2xl p-5">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-7 h-7 rounded-lg bg-primary/15 flex items-center justify-center">
            <Icon name="SlidersHorizontal" size={13} className="text-primary" />
          </div>
          <span className="font-heading font-bold text-sm text-foreground">Параметры модели</span>
        </div>
        <div className="grid sm:grid-cols-3 gap-5">
          <div>
            <label className="text-[11px] font-semibold text-muted-foreground mb-2 block uppercase tracking-wide">Культура</label>
            <div className="flex flex-wrap gap-1.5">
              {CROPS.map(c => (
                <button key={c} onClick={() => setCrop(c)}
                  className={`px-3 py-1.5 text-xs rounded-lg border transition-all font-medium
                    ${crop === c
                      ? "bg-primary text-white border-primary shadow-sm"
                      : "bg-background text-muted-foreground border-border hover:border-primary/40 hover:text-primary"}`}>
                  {c.split(" ")[0]}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="text-[11px] font-semibold text-muted-foreground mb-2 block uppercase tracking-wide">Регион</label>
            <select value={region} onChange={e => setRegion(e.target.value)}
              className="w-full text-sm bg-background border border-border rounded-xl px-3 py-2.5 text-foreground focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20 font-body">
              {Object.entries(REGION_NAMES).map(([id, name]) => (
                <option key={id} value={id}>{name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-[11px] font-semibold text-muted-foreground mb-2 block uppercase tracking-wide">Горизонт прогноза</label>
            <div className="flex gap-2">
              {HORIZONS.map(h => (
                <button key={h} onClick={() => setHorizon(h)}
                  className={`flex-1 py-2.5 text-sm rounded-xl border transition-all font-mono font-bold
                    ${horizon === h
                      ? "bg-primary text-white border-primary shadow-sm"
                      : "bg-background text-muted-foreground border-border hover:border-primary/40"}`}>
                  {h} мес
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── Вкладки ── */}
      <div className="flex gap-1 bg-secondary p-1.5 rounded-2xl w-fit shadow-inner">
        {TAB_CONFIG.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`flex items-center gap-1.5 px-4 py-2 text-xs rounded-xl font-semibold transition-all
              ${tab === t.id
                ? "bg-white text-primary shadow-md shadow-black/8 border border-border"
                : "text-muted-foreground hover:text-foreground"}`}>
            <Icon name={t.icon as string} size={12} />
            {t.label}
          </button>
        ))}
      </div>

      {/* ── Индикатор загрузки ── */}
      {loading && (
        <div className="glass-card rounded-xl p-4 flex items-center gap-3">
          <div className="w-8 h-8 rounded-full hero-gradient flex items-center justify-center animate-pulse">
            <Icon name="Brain" size={14} className="text-white" />
          </div>
          <div>
            <div className="text-sm font-semibold text-foreground">Нейросеть считает прогноз...</div>
            <div className="text-xs text-muted-foreground">ARIMA + LSTM · {crop} · {REGION_NAMES[region as keyof typeof REGION_NAMES]} · {horizon} мес</div>
          </div>
        </div>
      )}

      {tab === "single" && single && !loading && <AiModelSingleTab single={single} />}
      {tab === "all" && allRegions.length > 0 && !loading && (
        <AiModelAllTab allRegions={allRegions} crop={crop} horizon={horizon} onSelectRegion={(id) => { setRegion(id); setTab("single"); }} />
      )}
      {tab === "chart" && chart.length > 0 && !loading && (
        <AiModelChartTab chart={chart} crop={crop} region={region} horizon={horizon} meta={meta} />
      )}
    </div>
  );
}
