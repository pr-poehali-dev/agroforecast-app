import { useState, useEffect } from "react";
import Icon from "@/components/ui/icon";
import { exportPlanCsv, exportPlanPdf } from "@/lib/useExport";

const PLANNER_URL = "https://functions.poehali.dev/62858383-50f0-4d73-879f-111b5f96cf2b";

const REGION_NAMES: Record<string, string> = {
  samara: "Самарская", saratov: "Саратовская", volgograd: "Волгоградская",
  ulyanovsk: "Ульяновская", penza: "Пензенская", orenburg: "Оренбургская",
  tatarstan: "Татарстан", bashkortostan: "Башкортостан",
};

interface CropNorm {
  crop: string; price_now: number; price_forecast_jul: number;
  yield_base: number; cost_per_ha: number; revenue_per_ha: number;
  margin: number; roi: number; water_need: string; drought_resist: number;
  sow_season: string; harvest_month: string; best_prev: string[];
}

interface PlanCrop {
  crop: string; area_ha: number; share_pct: number;
  revenue_rub: number; cost_rub: number; profit_rub: number;
  margin_pct: number; roi_pct: number; yield_cha: number;
  harvest_month: string; water_need: string; drought_resist: number; sow_season: string;
}

interface Plan {
  recommended: PlanCrop[];
  total_area_ha: number;
  total_revenue_rub: number;
  total_cost_rub: number;
  total_profit_rub: number;
  avg_margin_pct: number;
  region_climate: { drought_risk: number; frost_risk: number; rain_apr_may: number; temp_may: number };
}

const CROP_COLORS: Record<string, string> = {
  "Пшеница озимая": "#10b981",
  "Подсолнечник":   "#f59e0b",
  "Кукуруза":       "#f97316",
  "Ячмень яровой":  "#84cc16",
  "Рожь":           "#94a3b8",
  "Соя":            "#06b6d4",
};

const GOALS = [
  { id: "max_profit", label: "Максимальная прибыль", icon: "TrendingUp", desc: "Приоритет — ROI и маржинальность" },
  { id: "min_risk",   label: "Минимальный риск",     icon: "Shield",     desc: "Засухо- и морозостойкие культуры" },
  { id: "price_growth", label: "Рост цен",           icon: "BarChart3",  desc: "Ставка на культуры с растущими ценами" },
];

export default function SectionPlanner() {
  const [crops, setCrops] = useState<CropNorm[]>([]);
  const [plan, setPlan] = useState<Plan | null>(null);
  const [loading, setLoading] = useState(false);
  const [tab, setTab] = useState<"plan" | "crops">("plan");
  const [exporting, setExporting] = useState<"csv" | "pdf" | null>(null);

  const doExport = async (type: "csv" | "pdf") => {
    if (!plan) return;
    setExporting(type);
    await new Promise(r => setTimeout(r, 200));
    if (type === "csv") exportPlanCsv(plan, region, goals);
    else exportPlanPdf(plan, region, goals);
    setTimeout(() => setExporting(null), 700);
  };

  // Inputs
  const [area, setArea] = useState(1000);
  const [region, setRegion] = useState("samara");
  const [goals, setGoals] = useState<string[]>(["max_profit"]);

  // Load crop norms once
  useEffect(() => {
    fetch(PLANNER_URL).then(r => r.json()).then(d => setCrops(d.crops || [])).catch(() => {});
  }, []);

  const runPlan = () => {
    setLoading(true);
    fetch(PLANNER_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ total_ha: area, region, goals }),
    }).then(r => r.json()).then(d => { setPlan(d); setLoading(false); })
      .catch(() => setLoading(false));
  };

  // Auto-run on mount
  useEffect(() => { runPlan(); }, []);

  const toggleGoal = (id: string) => {
    setGoals(prev => prev.includes(id) ? (prev.length > 1 ? prev.filter(g => g !== id) : prev) : [...prev, id]);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Планирование посевных площадей</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Оптимизация структуры посевов под ваши цели · AI-алгоритм · цены НТБ апрель 2026
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-secondary/50 p-1 rounded-xl w-fit">
        {(["plan", "crops"] as const).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-1.5 text-xs rounded-lg font-medium transition-all
              ${tab === t ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}>
            {t === "plan" ? "Оптимальный план" : "Справочник культур"}
          </button>
        ))}
      </div>

      {/* ── ПЛАН ── */}
      {tab === "plan" && (
        <div className="space-y-4">
          {/* Controls */}
          <div className="glass-card rounded-xl p-5">
            <div className="grid sm:grid-cols-3 gap-5">
              {/* Area */}
              <div>
                <label className="text-xs text-muted-foreground mb-2 block">
                  Общая площадь: <span className="font-mono font-bold text-foreground">{area.toLocaleString("ru")} га</span>
                </label>
                <input type="range" min={50} max={50000} step={50} value={area}
                  onChange={e => setArea(+e.target.value)}
                  className="w-full h-2 bg-border rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-primary" />
                <div className="flex justify-between text-[10px] text-muted-foreground mt-1"><span>50 га</span><span>50 000 га</span></div>
              </div>

              {/* Region */}
              <div>
                <label className="text-xs text-muted-foreground mb-2 block">Регион</label>
                <select value={region} onChange={e => setRegion(e.target.value)}
                  className="w-full text-xs bg-secondary border border-border rounded-lg px-3 py-2 text-foreground focus:outline-none focus:border-primary/40">
                  {Object.entries(REGION_NAMES).map(([id, name]) => (
                    <option key={id} value={id}>{name}</option>
                  ))}
                </select>
              </div>

              {/* Goals */}
              <div>
                <label className="text-xs text-muted-foreground mb-2 block">Цели хозяйства</label>
                <div className="space-y-1.5">
                  {GOALS.map(g => (
                    <button key={g.id} onClick={() => toggleGoal(g.id)}
                      className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs border transition-all text-left
                        ${goals.includes(g.id) ? "bg-primary/15 text-primary border-primary/30" : "bg-secondary text-muted-foreground border-border hover:border-primary/30"}`}>
                      <Icon name={g.icon as string} size={11} />
                      {g.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <button onClick={runPlan} disabled={loading}
              className="mt-4 w-full sm:w-auto px-6 py-2.5 bg-primary text-primary-foreground rounded-xl text-sm font-semibold hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center gap-2">
              <Icon name="Calculator" size={14} />
              {loading ? "Рассчитываю..." : "Рассчитать оптимальный план"}
            </button>
          </div>

          {plan && !loading && (
            <>
              {/* Climate warning */}
              {plan.region_climate.drought_risk > 0.5 && (
                <div className="p-3 bg-destructive/10 border border-destructive/25 rounded-xl text-xs text-destructive flex items-center gap-2">
                  <Icon name="AlertTriangle" size={13} />
                  Высокий риск засухи в регионе ({Math.round(plan.region_climate.drought_risk * 100)}%). Алгоритм скорректировал структуру посевов.
                </div>
              )}

              {/* Summary KPIs */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { label: "Прогноз выручки", value: (plan.total_revenue_rub / 1_000_000).toFixed(1) + " млн ₽", icon: "TrendingUp", color: "primary" },
                  { label: "Затраты", value: (plan.total_cost_rub / 1_000_000).toFixed(1) + " млн ₽", icon: "Minus", color: "muted" },
                  { label: "Прибыль", value: (plan.total_profit_rub / 1_000_000).toFixed(1) + " млн ₽", icon: "DollarSign", color: "primary" },
                  { label: "Средняя маржа", value: plan.avg_margin_pct + "%", icon: "BarChart3", color: plan.avg_margin_pct > 30 ? "primary" : "accent" },
                ].map((s, i) => (
                  <div key={i} className="glass-card rounded-xl p-4">
                    <div className={`w-8 h-8 rounded-lg mb-2 flex items-center justify-center ${s.color === "primary" ? "bg-primary/15 text-primary" : s.color === "accent" ? "bg-accent/15 text-accent" : "bg-secondary text-muted-foreground"}`}>
                      <Icon name={s.icon as string} size={14} />
                    </div>
                    <div className="text-xl font-bold font-mono text-foreground">{s.value}</div>
                    <div className="text-xs text-muted-foreground mt-0.5">{s.label}</div>
                  </div>
                ))}
              </div>

              {/* Export buttons */}
              <div className="flex gap-2 flex-wrap">
                <button onClick={() => doExport("pdf")} disabled={exporting !== null}
                  className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-xl text-sm font-semibold hover:bg-primary/90 transition-all disabled:opacity-60 active:scale-[0.98]">
                  {exporting === "pdf"
                    ? <Icon name="Loader" size={14} className="animate-spin" />
                    : <Icon name="FileText" size={14} />}
                  {exporting === "pdf" ? "Генерирую PDF..." : "Скачать план PDF"}
                </button>
                <button onClick={() => doExport("csv")} disabled={exporting !== null}
                  className="flex items-center gap-2 px-4 py-2 bg-secondary border border-border text-foreground rounded-xl text-sm font-semibold hover:bg-secondary/80 transition-all disabled:opacity-60 active:scale-[0.98]">
                  {exporting === "csv"
                    ? <Icon name="Loader" size={14} className="animate-spin" />
                    : <Icon name="Table" size={14} />}
                  {exporting === "csv" ? "Создаю CSV..." : "Экспорт в Excel (CSV)"}
                </button>
              </div>

              {/* Pie chart (SVG bars) */}
              <div className="glass-card rounded-xl p-5">
                <div className="flex items-center gap-2 mb-4">
                  <Icon name="PieChart" size={15} className="text-primary" />
                  <h2 className="font-semibold text-sm">Оптимальная структура посевов</h2>
                </div>

                {/* Visual bars */}
                <div className="flex h-8 rounded-xl overflow-hidden mb-4">
                  {plan.recommended.map((c, i) => (
                    <div key={i} className="transition-all relative group"
                      style={{ width: `${c.share_pct}%`, background: CROP_COLORS[c.crop] || "#94a3b8" }}>
                      <div className="absolute inset-0 hidden group-hover:flex items-center justify-center text-[10px] text-white font-bold z-10">
                        {c.share_pct}%
                      </div>
                    </div>
                  ))}
                </div>

                {/* Detail cards */}
                <div className="grid sm:grid-cols-3 gap-3">
                  {plan.recommended.map((c, i) => (
                    <div key={i} className="rounded-xl p-4 border"
                      style={{ background: (CROP_COLORS[c.crop] || "#94a3b8") + "10", borderColor: (CROP_COLORS[c.crop] || "#94a3b8") + "35" }}>
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <div className="font-semibold text-sm text-foreground">{c.crop}</div>
                          <div className="text-[10px] text-muted-foreground">{c.sow_season === "осень" ? "Озимая" : "Яровая"} · {c.harvest_month}</div>
                        </div>
                        <div className="text-right">
                          <div className="text-lg font-bold font-mono" style={{ color: CROP_COLORS[c.crop] || "#94a3b8" }}>
                            {c.share_pct}%
                          </div>
                          <div className="text-[10px] text-muted-foreground">{c.area_ha.toLocaleString("ru")} га</div>
                        </div>
                      </div>

                      <div className="space-y-1.5 text-xs">
                        {[
                          { label: "Выручка", value: (c.revenue_rub / 1_000_000).toFixed(1) + " млн ₽" },
                          { label: "Прибыль", value: (c.profit_rub / 1_000_000).toFixed(1) + " млн ₽" },
                          { label: "Маржа / ROI", value: `${c.margin_pct}% / ${c.roi_pct}%` },
                          { label: "Урожайность", value: `${c.yield_cha} ц/га` },
                        ].map((r, j) => (
                          <div key={j} className="flex justify-between">
                            <span className="text-muted-foreground">{r.label}</span>
                            <span className="font-mono font-semibold text-foreground">{r.value}</span>
                          </div>
                        ))}
                      </div>

                      <div className="mt-3 flex items-center gap-1.5">
                        <div className="flex-1 h-1.5 bg-border rounded-full">
                          <div className="h-full rounded-full" style={{ width: `${c.drought_resist * 100}%`, background: CROP_COLORS[c.crop] || "#94a3b8" }} />
                        </div>
                        <span className="text-[10px] text-muted-foreground">{c.water_need}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Climate context */}
              <div className="glass-card rounded-xl p-5">
                <div className="flex items-center gap-2 mb-4">
                  <Icon name="Cloud" size={15} className="text-primary" />
                  <h3 className="font-semibold text-sm">Климатические условия региона</h3>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  {[
                    { label: "Риск засухи", value: Math.round(plan.region_climate.drought_risk * 100) + "%", warn: plan.region_climate.drought_risk > 0.5 },
                    { label: "Риск заморозков", value: Math.round(plan.region_climate.frost_risk * 100) + "%", warn: plan.region_climate.frost_risk > 0.15 },
                    { label: "Осадки апр–май", value: plan.region_climate.rain_apr_may + " мм", warn: plan.region_climate.rain_apr_may < 25 },
                    { label: "Темп. май", value: "+" + plan.region_climate.temp_may + "°C", warn: false },
                  ].map((s, i) => (
                    <div key={i} className={`p-3 rounded-lg ${s.warn ? "bg-accent/10 border border-accent/25" : "bg-secondary/40"}`}>
                      <div className="text-muted-foreground mb-1">{s.label}</div>
                      <div className={`font-mono font-bold text-base ${s.warn ? "text-accent" : "text-foreground"}`}>{s.value}</div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* ── СПРАВОЧНИК КУЛЬТУР ── */}
      {tab === "crops" && (
        <div className="space-y-3">
          <div className="glass-card rounded-xl overflow-hidden">
            <div className="p-4 border-b border-border">
              <div className="flex items-center gap-2">
                <Icon name="BookOpen" size={14} className="text-primary" />
                <span className="text-sm font-semibold">Нормативы по культурам · апрель 2026</span>
                <span className="ml-auto text-[10px] text-muted-foreground font-mono">НТБ + ФГБУ Агроэкспорт</span>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-border bg-secondary/30">
                    {["Культура", "Цена сейч.", "Прогноз", "Урожай", "Выручка/га", "Затр./га", "Маржа", "ROI", "Уборка", "Влага"].map(h => (
                      <th key={h} className="text-left text-muted-foreground font-medium py-2.5 px-3 whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {crops.map((c, i) => {
                    const priceDelta = c.price_forecast_jul - c.price_now;
                    return (
                      <tr key={i} className="border-b border-border/40 hover:bg-secondary/30 transition-colors">
                        <td className="py-3 px-3 font-semibold text-foreground">
                          <div className="flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full shrink-0" style={{ background: CROP_COLORS[c.crop] || "#94a3b8" }} />
                            {c.crop}
                          </div>
                        </td>
                        <td className="py-3 px-3 font-mono">{c.price_now.toLocaleString("ru")} ₽</td>
                        <td className="py-3 px-3">
                          <div className={`font-mono font-bold ${priceDelta > 0 ? "text-primary" : "text-destructive"}`}>
                            {priceDelta > 0 ? "▲" : "▼"} {c.price_forecast_jul.toLocaleString("ru")} ₽
                          </div>
                        </td>
                        <td className="py-3 px-3 font-mono">{c.yield_base} ц/га</td>
                        <td className="py-3 px-3 font-mono">{c.revenue_per_ha.toLocaleString("ru")} ₽</td>
                        <td className="py-3 px-3 font-mono text-muted-foreground">{c.cost_per_ha.toLocaleString("ru")} ₽</td>
                        <td className="py-3 px-3">
                          <span className={`font-mono font-bold ${c.margin > 40 ? "text-primary" : c.margin > 25 ? "text-accent" : "text-destructive"}`}>
                            {c.margin}%
                          </span>
                        </td>
                        <td className="py-3 px-3 font-mono font-bold text-primary">{c.roi}%</td>
                        <td className="py-3 px-3 text-muted-foreground">{c.harvest_month}</td>
                        <td className="py-3 px-3">
                          <span className={`px-1.5 py-0.5 rounded text-[10px] ${c.water_need === "высокая" ? "bg-blue-500/15 text-blue-600" : c.water_need === "низкая" ? "bg-primary/15 text-primary" : "bg-secondary text-muted-foreground"}`}>
                            {c.water_need}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* ROI ranking */}
          <div className="glass-card rounded-xl p-5">
            <div className="flex items-center gap-2 mb-4">
              <Icon name="Trophy" size={15} className="text-accent" />
              <h3 className="font-semibold text-sm">Рейтинг по ROI · апрель 2026</h3>
            </div>
            <div className="space-y-2.5">
              {[...crops].sort((a, b) => b.roi - a.roi).map((c, i) => (
                <div key={i} className="flex items-center gap-3">
                  <span className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0
                    ${i === 0 ? "bg-accent text-accent-foreground" : i === 1 ? "bg-secondary text-foreground" : "bg-secondary/50 text-muted-foreground"}`}>
                    {i + 1}
                  </span>
                  <span className="text-sm flex-1 text-foreground">{c.crop}</span>
                  <div className="w-32 h-2 bg-border rounded-full overflow-hidden">
                    <div className="h-full rounded-full" style={{ width: `${Math.min(c.roi, 120) / 120 * 100}%`, background: CROP_COLORS[c.crop] || "#94a3b8" }} />
                  </div>
                  <span className="font-mono text-xs font-bold w-14 text-right" style={{ color: CROP_COLORS[c.crop] || "#94a3b8" }}>{c.roi}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}