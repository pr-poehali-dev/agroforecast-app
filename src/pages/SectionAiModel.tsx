import { useState, useEffect } from "react";
import Icon from "@/components/ui/icon";

const AI_URL = "https://functions.poehali.dev/3f769f53-b21b-473e-91b9-b7a755123928";

const CROPS = ["Пшеница озимая", "Подсолнечник", "Кукуруза", "Ячмень яровой", "Рожь"];
const HORIZONS = [3, 6, 9, 12];
const REGION_NAMES: Record<string, string> = {
  samara: "Самарская", saratov: "Саратовская", volgograd: "Волгоградская",
  ulyanovsk: "Ульяновская", penza: "Пензенская", orenburg: "Оренбургская",
  tatarstan: "Татарстан", bashkortostan: "Башкортостан",
};

function riskColor(level: string) {
  if (level === "critical") return "#ef4444";
  if (level === "high")     return "#f97316";
  if (level === "medium")   return "#f59e0b";
  return "#10b981";
}
function riskLabel(level: string) {
  if (level === "critical") return "Критический";
  if (level === "high")     return "Высокий";
  if (level === "medium")   return "Средний";
  return "Низкий";
}
function confBadge(conf: number) {
  if (conf >= 80) return "text-primary bg-primary/10 border-primary/25";
  if (conf >= 65) return "text-accent bg-accent/10 border-accent/25";
  return "text-destructive bg-destructive/10 border-destructive/25";
}

interface ModelMeta {
  yield_model: string;
  price_model: string;
  risk_model: string;
  training_period: string;
  validation_mape_yield: number;
  validation_mape_price: number;
  risk_accuracy_pct: number;
  update_frequency: string;
  last_updated: string;
}

interface RegionForecast {
  region_id: string;
  ndvi: number;
  rain_mm: number;
  temp_c: number;
  area_ha: number;
  yield_cha: number;
  yield_low: number;
  yield_high: number;
  confidence_pct: number;
  risk_discount_pct: number;
  lstm_signal: number;
  price_rub_t: number;
  price_low: number;
  price_high: number;
  price_change_pct: number;
  price_trend: string;
  price_confidence_pct: number;
  total_risk_pct: number;
  total_risk_level: string;
  drought_risk_pct: number;
  frost_risk_pct: number;
  pest_risk_pct: number;
  recommendations: { type: string; priority: string; text: string }[];
}

interface SingleForecast {
  crop: string;
  region_id: string;
  horizon_months: number;
  generated_at: string;
  model_confidence_overall: number;
  yield_forecast: {
    yield_cha: number; yield_low: number; yield_high: number;
    confidence_pct: number; lstm_signal: number; risk_discount_pct: number;
  };
  price_forecast: {
    price_rub_t: number; price_low: number; price_high: number;
    change_pct: number; confidence_pct: number; trend: string;
    components: { arima_rub: number; seasonal_rub: number; news_signal_pct: number; yield_effect_rub: number };
  };
  risk_assessment: {
    total_risk_pct: number; total_risk_level: string;
    drought_risk_pct: number; frost_risk_pct: number; pest_risk_pct: number;
    recommendations: { type: string; priority: string; text: string }[];
  };
}

interface ChartPoint {
  month: string; date: string; price: number;
  price_low: number; price_high: number; forecast: boolean;
}

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

  // Load model metadata once
  useEffect(() => {
    fetch(AI_URL).then(r => r.json()).then(d => setMeta(d.model_info)).catch(() => {});
  }, []);

  // Load data when params change
  useEffect(() => {
    setLoading(true);
    const baseUrl = `${AI_URL}?crop=${encodeURIComponent(crop)}&horizon=${horizon}`;
    const urls = [
      fetch(`${baseUrl}&region=${region}`).then(r => r.json()),
      fetch(`${baseUrl}&all=1`).then(r => r.json()),
      fetch(`${baseUrl}&region=${region}&chart=1`).then(r => r.json()),
    ];
    Promise.all(urls)
      .then(([s, a, c]) => {
        setSingle(s);
        setAllRegions(a.regions || []);
        setChart(c.series || []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [crop, region, horizon]);

  // Chart dimensions
  const chartData = chart.slice(-12);
  const maxP = Math.max(...chartData.map(d => d.price_high || d.price), 1);
  const minP = Math.min(...chartData.map(d => d.price_low || d.price)) - 500;
  const rangeP = maxP - minP || 1;
  const cw = 600; const ch = 160;
  const px = (i: number) => (i / (chartData.length - 1)) * cw;
  const py = (v: number) => ch - ((v - minP) / rangeP) * ch;
  const realPts = chartData.filter(d => !d.forecast).map((d, i) => `${px(i)},${py(d.price)}`).join(" ");
  const forecastStartI = chartData.findIndex(d => d.forecast);
  const forecastPts = forecastStartI >= 0
    ? chartData.slice(forecastStartI - 1).map((d, i) => `${px(forecastStartI - 1 + i)},${py(d.price)}`).join(" ")
    : "";

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground">AI‑модель прогнозирования</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            LSTM + Random Forest · ARIMA + Prophet + Transformer · горизонт 3–12 месяцев
          </p>
        </div>
        {meta && (
          <div className="flex gap-2 flex-wrap">
            <div className="px-3 py-1.5 rounded-lg bg-primary/10 border border-primary/20 text-xs font-mono text-primary">
              MAPE цен: {meta.validation_mape_price}%
            </div>
            <div className="px-3 py-1.5 rounded-lg bg-primary/10 border border-primary/20 text-xs font-mono text-primary">
              MAPE урожай: {meta.validation_mape_yield}%
            </div>
            <div className="px-3 py-1.5 rounded-lg bg-accent/10 border border-accent/20 text-xs font-mono text-accent">
              Точность рисков: {meta.risk_accuracy_pct}%
            </div>
          </div>
        )}
      </div>

      {/* Model architecture cards */}
      {meta && (
        <div className="grid sm:grid-cols-3 gap-3">
          {[
            { icon: "Brain", label: "Модуль урожайности", value: meta.yield_model, badge: `MAPE ${meta.validation_mape_yield}%`, color: "primary" },
            { icon: "TrendingUp", label: "Модуль цен", value: meta.price_model, badge: `MAPE ${meta.validation_mape_price}%`, color: "accent" },
            { icon: "ShieldAlert", label: "Модуль рисков", value: meta.risk_model, badge: `Точность ${meta.risk_accuracy_pct}%`, color: "primary" },
          ].map((m, i) => (
            <div key={i} className="glass-card rounded-xl p-4">
              <div className="flex items-center gap-2 mb-3">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${m.color === "primary" ? "bg-primary/15 text-primary" : "bg-accent/15 text-accent"}`}>
                  <Icon name={m.icon as string} size={15} />
                </div>
                <span className="text-xs font-medium text-muted-foreground">{m.label}</span>
              </div>
              <div className="text-xs font-semibold text-foreground leading-snug mb-2">{m.value}</div>
              <span className={`px-2 py-0.5 text-[10px] font-mono rounded border ${m.color === "primary" ? "bg-primary/10 border-primary/25 text-primary" : "bg-accent/10 border-accent/25 text-accent"}`}>{m.badge}</span>
            </div>
          ))}
        </div>
      )}

      {/* Controls */}
      <div className="glass-card rounded-xl p-5">
        <div className="grid sm:grid-cols-3 gap-4">
          <div>
            <label className="text-xs text-muted-foreground mb-1.5 block">Культура</label>
            <div className="flex flex-wrap gap-1.5">
              {CROPS.map(c => (
                <button key={c} onClick={() => setCrop(c)}
                  className={`px-2.5 py-1 text-xs rounded-lg border transition-all font-medium
                    ${crop === c ? "bg-primary/15 text-primary border-primary/30" : "bg-secondary text-muted-foreground border-border hover:border-primary/30"}`}>
                  {c.split(" ")[0]}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1.5 block">Регион</label>
            <select value={region} onChange={e => setRegion(e.target.value)}
              className="w-full text-xs bg-secondary border border-border rounded-lg px-3 py-2 text-foreground focus:outline-none focus:border-primary/40">
              {Object.entries(REGION_NAMES).map(([id, name]) => (
                <option key={id} value={id}>{name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1.5 block">Горизонт прогноза</label>
            <div className="flex gap-1.5">
              {HORIZONS.map(h => (
                <button key={h} onClick={() => setHorizon(h)}
                  className={`flex-1 py-1.5 text-xs rounded-lg border transition-all font-mono
                    ${horizon === h ? "bg-primary/15 text-primary border-primary/30" : "bg-secondary text-muted-foreground border-border hover:border-primary/30"}`}>
                  {h} мес
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-secondary/50 p-1 rounded-xl w-fit">
        {(["single", "all", "chart"] as const).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-1.5 text-xs rounded-lg font-medium transition-all
              ${tab === t ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}>
            {t === "single" ? "Детальный прогноз" : t === "all" ? "Все регионы" : "График цен"}
          </button>
        ))}
      </div>

      {loading && (
        <div className="flex items-center gap-3 text-sm text-muted-foreground animate-pulse">
          <Icon name="Brain" size={14} className="text-primary" />
          Модель считает прогноз...
        </div>
      )}

      {/* ── Tab: Single forecast ── */}
      {tab === "single" && single && !loading && (
        <div className="grid lg:grid-cols-3 gap-4">
          {/* Yield */}
          <div className="glass-card rounded-xl p-5">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-lg bg-primary/15 text-primary flex items-center justify-center">
                <Icon name="Wheat" size={15} />
              </div>
              <div>
                <div className="text-xs font-semibold text-foreground">Урожайность</div>
                <div className="text-[10px] text-muted-foreground">LSTM + ансамбль</div>
              </div>
            </div>
            <div className="text-3xl font-bold font-mono text-primary mb-1">
              {single.yield_forecast.yield_cha} <span className="text-base font-normal text-muted-foreground">ц/га</span>
            </div>
            <div className="text-xs text-muted-foreground mb-4">
              Диапазон: {single.yield_forecast.yield_low} – {single.yield_forecast.yield_high} ц/га
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">Уверенность</span>
                <span className={`font-mono font-bold px-1.5 rounded border ${confBadge(single.yield_forecast.confidence_pct)}`}>
                  {single.yield_forecast.confidence_pct}%
                </span>
              </div>
              <div className="h-2 bg-border rounded-full">
                <div className="h-full rounded-full bg-primary transition-all duration-700"
                  style={{ width: `${single.yield_forecast.confidence_pct}%` }} />
              </div>
              <div className="flex justify-between text-xs text-muted-foreground mt-2">
                <span>LSTM сигнал</span>
                <span className="font-mono">{single.yield_forecast.lstm_signal}</span>
              </div>
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Дисконт рисков</span>
                <span className="font-mono text-destructive">−{single.yield_forecast.risk_discount_pct}%</span>
              </div>
            </div>
          </div>

          {/* Price */}
          <div className="glass-card rounded-xl p-5">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-lg bg-accent/15 text-accent flex items-center justify-center">
                <Icon name="DollarSign" size={15} />
              </div>
              <div>
                <div className="text-xs font-semibold text-foreground">Цена</div>
                <div className="text-[10px] text-muted-foreground">ARIMA + Prophet + NLP</div>
              </div>
            </div>
            <div className={`text-3xl font-bold font-mono mb-1 ${single.price_forecast.trend === "up" ? "text-primary" : "text-destructive"}`}>
              {single.price_forecast.price_rub_t.toLocaleString()} <span className="text-base font-normal text-muted-foreground">₽/т</span>
            </div>
            <div className="text-xs text-muted-foreground mb-4">
              {single.price_forecast.price_low.toLocaleString()} – {single.price_forecast.price_high.toLocaleString()} ₽/т
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">Изменение</span>
                <span className={`font-mono font-bold ${single.price_forecast.change_pct > 0 ? "text-primary" : "text-destructive"}`}>
                  {single.price_forecast.change_pct > 0 ? "+" : ""}{single.price_forecast.change_pct}%
                </span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">Уверенность</span>
                <span className={`font-mono font-bold px-1.5 rounded border ${confBadge(single.price_forecast.confidence_pct)}`}>
                  {single.price_forecast.confidence_pct}%
                </span>
              </div>
              <div className="mt-3 pt-3 border-t border-border/50 space-y-1.5">
                <div className="text-[10px] text-muted-foreground font-medium uppercase tracking-wide">Декомпозиция</div>
                {[
                  { label: "ARIMA тренд", value: single.price_forecast.components.arima_rub.toLocaleString() + " ₽" },
                  { label: "Сезонность", value: (single.price_forecast.components.seasonal_rub > 0 ? "+" : "") + single.price_forecast.components.seasonal_rub.toLocaleString() + " ₽" },
                  { label: "NLP сигнал", value: (single.price_forecast.components.news_signal_pct > 0 ? "+" : "") + single.price_forecast.components.news_signal_pct + "%" },
                  { label: "Урожай-эффект", value: single.price_forecast.components.yield_effect_rub.toLocaleString() + " ₽" },
                ].map((r, i) => (
                  <div key={i} className="flex justify-between text-xs">
                    <span className="text-muted-foreground">{r.label}</span>
                    <span className="font-mono text-foreground">{r.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Risk */}
          <div className="glass-card rounded-xl p-5">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center"
                style={{ backgroundColor: `${riskColor(single.risk_assessment.total_risk_level)}20`, color: riskColor(single.risk_assessment.total_risk_level) }}>
                <Icon name="ShieldAlert" size={15} />
              </div>
              <div>
                <div className="text-xs font-semibold text-foreground">Риски</div>
                <div className="text-[10px] text-muted-foreground">Вероятностная модель</div>
              </div>
            </div>
            <div className="text-3xl font-bold font-mono mb-1"
              style={{ color: riskColor(single.risk_assessment.total_risk_level) }}>
              {single.risk_assessment.total_risk_pct}% <span className="text-sm font-normal text-muted-foreground">{riskLabel(single.risk_assessment.total_risk_level)}</span>
            </div>
            <div className="h-2 bg-border rounded-full mb-4">
              <div className="h-full rounded-full transition-all duration-700"
                style={{ width: `${single.risk_assessment.total_risk_pct}%`, backgroundColor: riskColor(single.risk_assessment.total_risk_level) }} />
            </div>
            <div className="space-y-2">
              {[
                { label: "Засуха", value: single.risk_assessment.drought_risk_pct, icon: "Sun" },
                { label: "Заморозки", value: single.risk_assessment.frost_risk_pct, icon: "Snowflake" },
                { label: "Вредители", value: single.risk_assessment.pest_risk_pct, icon: "Bug" },
              ].map((r, i) => (
                <div key={i}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-muted-foreground flex items-center gap-1"><Icon name={r.icon as string} size={10} />{r.label}</span>
                    <span className="font-mono font-bold" style={{ color: riskColor(r.value > 65 ? "high" : r.value > 35 ? "medium" : "low") }}>{r.value}%</span>
                  </div>
                  <div className="h-1.5 bg-border rounded-full">
                    <div className="h-full rounded-full transition-all" style={{ width: `${r.value}%`, backgroundColor: riskColor(r.value > 65 ? "high" : r.value > 35 ? "medium" : "low") }} />
                  </div>
                </div>
              ))}
            </div>
            {single.risk_assessment.recommendations.length > 0 && (
              <div className="mt-4 space-y-2">
                {single.risk_assessment.recommendations.map((rec, i) => (
                  <div key={i} className="p-2.5 rounded-lg bg-secondary/50 border border-border text-xs text-foreground">
                    <span className={`inline-block px-1.5 py-0.5 rounded text-[9px] font-mono uppercase mr-1.5 ${rec.priority === "high" ? "bg-destructive/20 text-destructive" : "bg-accent/20 text-accent"}`}>{rec.priority === "high" ? "срочно" : "рекомендовано"}</span>
                    {rec.text}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Overall confidence */}
          <div className="lg:col-span-3 glass-card rounded-xl p-4">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div className="flex items-center gap-3">
                <Icon name="Cpu" size={16} className="text-primary" />
                <span className="text-sm font-semibold">Общая уверенность модели</span>
                <span className={`px-3 py-1 text-sm font-bold font-mono rounded-lg border ${confBadge(single.model_confidence_overall)}`}>
                  {single.model_confidence_overall}%
                </span>
              </div>
              <div className="text-xs text-muted-foreground font-mono">
                Сгенерировано: {single.generated_at} · горизонт {single.horizon_months} мес
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Tab: All regions ── */}
      {tab === "all" && allRegions.length > 0 && !loading && (
        <div className="space-y-4">
          <div className="glass-card rounded-xl overflow-hidden">
            <div className="p-4 border-b border-border flex items-center gap-2">
              <Icon name="Globe" size={14} className="text-primary" />
              <span className="text-sm font-semibold">{crop} · горизонт {horizon} мес · все регионы</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-secondary/30">
                    {["Регион", "Урожай ц/га", "Цена ₽/т", "Изм. %", "Риск", "Реком."].map(h => (
                      <th key={h} className="text-left text-xs text-muted-foreground font-medium py-2.5 px-4">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {allRegions.map((r, i) => (
                    <tr key={i} onClick={() => { setRegion(r.region_id); setTab("single"); }}
                      className="border-b border-border/40 hover:bg-secondary/30 transition-colors cursor-pointer">
                      <td className="py-3 px-4 font-medium">{REGION_NAMES[r.region_id]}</td>
                      <td className="py-3 px-4">
                        <div className="font-mono font-bold text-primary">{r.yield_cha}</div>
                        <div className="text-[10px] text-muted-foreground">{r.yield_low}–{r.yield_high}</div>
                      </td>
                      <td className="py-3 px-4 font-mono">{r.price_rub_t.toLocaleString()}</td>
                      <td className={`py-3 px-4 font-mono font-bold ${r.price_change_pct > 0 ? "text-primary" : "text-destructive"}`}>
                        {r.price_change_pct > 0 ? "+" : ""}{r.price_change_pct}%
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <div className="w-16 h-2 bg-border rounded-full">
                            <div className="h-full rounded-full transition-all" style={{ width: `${r.total_risk_pct}%`, backgroundColor: riskColor(r.total_risk_level) }} />
                          </div>
                          <span className="text-xs font-mono font-bold" style={{ color: riskColor(r.total_risk_level) }}>{r.total_risk_pct}%</span>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span className="text-[10px] text-muted-foreground">{r.recommendations.length > 0 ? r.recommendations[0].text.slice(0, 42) + "…" : "—"}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Risk heatmap bars */}
          <div className="glass-card rounded-xl p-5">
            <div className="flex items-center gap-2 mb-4">
              <Icon name="Thermometer" size={14} className="text-primary" />
              <span className="text-sm font-semibold">Тепловая карта рисков по регионам</span>
            </div>
            <div className="space-y-2.5">
              {allRegions.map((r, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="w-28 text-xs text-muted-foreground shrink-0">{REGION_NAMES[r.region_id]}</div>
                  <div className="flex-1 h-5 bg-border rounded-md relative overflow-hidden">
                    <div className="h-full rounded-md transition-all duration-700"
                      style={{ width: `${r.total_risk_pct}%`, backgroundColor: riskColor(r.total_risk_level) + "90" }} />
                    <div className="absolute inset-y-0 flex items-center px-2 text-[10px] font-mono font-bold"
                      style={{ color: riskColor(r.total_risk_level) }}>
                      {r.total_risk_pct}% {riskLabel(r.total_risk_level)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── Tab: Chart ── */}
      {tab === "chart" && chart.length > 0 && !loading && (
        <div className="glass-card rounded-xl p-6">
          <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
            <div>
              <div className="flex items-center gap-2">
                <Icon name="TrendingUp" size={16} className="text-primary" />
                <h2 className="font-semibold">{crop} — прогноз цен на {horizon} месяцев</h2>
              </div>
              <p className="text-xs text-muted-foreground mt-1">Регион: {REGION_NAMES[region]} · модель: ARIMA + Prophet + Transformer</p>
            </div>
            <div className="flex gap-4 text-xs text-muted-foreground">
              <span className="flex items-center gap-1.5"><span className="w-6 h-0.5 bg-primary inline-block" />Факт</span>
              <span className="flex items-center gap-1.5"><span className="w-6 border-t-2 border-dashed border-accent inline-block" />Прогноз</span>
              <span className="flex items-center gap-1.5"><span className="w-6 h-2 bg-accent/20 rounded inline-block" />Диапазон</span>
            </div>
          </div>
          <div className="w-full overflow-x-auto">
            <svg viewBox={`0 0 ${cw} ${ch + 30}`} className="w-full">
              <defs>
                <linearGradient id="aiChartGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#10b981" stopOpacity="0.2" />
                  <stop offset="100%" stopColor="#10b981" stopOpacity="0" />
                </linearGradient>
              </defs>
              {[0, 0.25, 0.5, 0.75, 1].map((t, i) => (
                <line key={i} x1="0" y1={ch * t} x2={cw} y2={ch * t} stroke="rgba(0,0,0,0.05)" strokeWidth="1" />
              ))}
              {/* Forecast confidence band */}
              {forecastStartI >= 0 && chartData.slice(forecastStartI).map((d, i) => {
                const xi = forecastStartI + i;
                const barW = cw / (chartData.length - 1);
                return (
                  <rect key={i} x={px(xi) - barW / 2} y={py(d.price_high)} width={barW}
                    height={Math.max(0, py(d.price_low) - py(d.price_high))}
                    fill="#f59e0b" opacity="0.12" />
                );
              })}
              {/* Area under real line */}
              {realPts && (
                <path d={`M 0,${ch} L ${realPts} L ${px(chartData.filter(d => !d.forecast).length - 1)},${ch} Z`}
                  fill="url(#aiChartGrad)" />
              )}
              {realPts && <polyline points={realPts} fill="none" stroke="#10b981" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />}
              {forecastPts && <polyline points={forecastPts} fill="none" stroke="#f59e0b" strokeWidth="2" strokeDasharray="6,4" strokeLinecap="round" strokeLinejoin="round" />}
              {chartData.map((d, i) => (
                <circle key={i} cx={px(i)} cy={py(d.price)} r={d.forecast ? 3 : 4}
                  fill={d.forecast ? "#f59e0b" : "#10b981"} stroke="white" strokeWidth="1.5" />
              ))}
              {chartData.map((d, i) => (
                <text key={i} x={px(i)} y={ch + 20} textAnchor="middle" fill="rgba(0,0,0,0.35)" fontSize="10" fontFamily="IBM Plex Mono">{d.month}</text>
              ))}
            </svg>
          </div>
          {/* Price stats */}
          {chartData.filter(d => d.forecast).length > 0 && (
            <div className="grid grid-cols-3 gap-3 mt-4">
              {(() => {
                const forecasts = chartData.filter(d => d.forecast);
                const lastForecast = forecasts[forecasts.length - 1];
                const firstForecast = forecasts[0];
                const last = chartData.filter(d => !d.forecast).at(-1);
                const change = last ? ((lastForecast.price - last.price) / last.price * 100).toFixed(1) : "—";
                return [
                  { label: "Текущая", value: (last?.price || 0).toLocaleString() + " ₽" },
                  { label: `Через ${horizon} мес`, value: lastForecast.price.toLocaleString() + " ₽" },
                  { label: "Изменение", value: `${Number(change) > 0 ? "+" : ""}${change}%`, colored: true, change: Number(change) },
                ].map((s, i) => (
                  <div key={i} className="bg-secondary/40 rounded-xl p-3 text-center">
                    <div className="text-xs text-muted-foreground mb-1">{s.label}</div>
                    <div className={`font-bold font-mono text-sm ${"change" in s ? (s.change > 0 ? "text-primary" : "text-destructive") : "text-foreground"}`}>{s.value}</div>
                  </div>
                ));
              })()}
            </div>
          )}
        </div>
      )}

      {/* Training info */}
      {meta && (
        <div className="glass-card rounded-xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <Icon name="Database" size={14} className="text-primary" />
            <span className="text-sm font-semibold">Техническая информация о модели</span>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
            {[
              { label: "Период обучения", value: meta.training_period },
              { label: "Обновление данных", value: meta.update_frequency },
              { label: "Горизонты прогноза", value: "3 / 6 / 9 / 12 мес" },
              { label: "Последнее обновление", value: meta.last_updated.slice(0, 16).replace("T", " ") },
            ].map((s, i) => (
              <div key={i} className="bg-secondary/40 rounded-lg p-3">
                <div className="text-muted-foreground mb-1">{s.label}</div>
                <div className="font-mono font-semibold text-foreground">{s.value}</div>
              </div>
            ))}
          </div>
          <div className="mt-4 grid sm:grid-cols-3 gap-3 text-xs">
            {[
              { label: "Модуль урожайности", stack: ["Python 3.11", "NumPy + Pandas", "LSTM нейросеть", "Random Forest (100 деревьев)", "XGBoost ансамбль"] },
              { label: "Модуль цен", stack: ["ARIMA (p=2,d=1,q=2)", "Prophet (сезонность)", "Transformer NLP", "Данные НТБ + CBOT", "Курс ЦБ РФ"] },
              { label: "Модуль рисков", stack: ["Вероятностная модель", "Данные Росгидромет", "NDVI Sentinel-2", "Классификатор угроз", "Автоматические алерты"] },
            ].map((s, i) => (
              <div key={i} className="bg-secondary/30 rounded-lg p-3">
                <div className="font-medium text-foreground mb-2">{s.label}</div>
                <ul className="space-y-1">
                  {s.stack.map((item, j) => (
                    <li key={j} className="flex items-center gap-1.5 text-muted-foreground">
                      <span className="w-1 h-1 rounded-full bg-primary/60 shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
