import { useState, useEffect, lazy, Suspense } from "react";
import Icon from "@/components/ui/icon";
import {
  CROPS, FORECAST_DATA, RISK_DATA, ALERTS, MAP_REGIONS,
  STATS, PRICE_CHART, SUPPLY_DATA, MARKET_SOURCES, EXPORT_DATA,
  PROFITABILITY_DATA, PRICING_PLANS,
  getRiskColor, getRiskLabel,
} from "./data";

const VolgaMap = lazy(() => import("@/components/VolgaMap"));

const CALC_URL = "https://functions.poehali.dev/b54f9de1-da43-4c7f-b32f-63fbdcdbc6fd";
const SETTINGS_URL = "https://functions.poehali.dev/6e542f17-7128-4815-848b-0f1d83bb3a4f";

// ─── SVG Chart: Price ───────────────────────────────────────────────────────

function PriceChart() {
  const max = Math.max(...PRICE_CHART.map(d => d.price));
  const min = Math.min(...PRICE_CHART.map(d => d.price)) - 500;
  const range = max - min;
  const w = 600; const h = 180;
  const realItems = PRICE_CHART.filter(d => !d.forecast);
  const forecastStartIdx = PRICE_CHART.findIndex(d => d.forecast);
  const allPts = PRICE_CHART.map((d, i) => `${(i / (PRICE_CHART.length - 1)) * w},${h - ((d.price - min) / range) * h}`);
  const realPts = realItems.map((d, i) => `${(i / (PRICE_CHART.length - 1)) * w},${h - ((d.price - min) / range) * h}`).join(" ");
  const forecastPts = PRICE_CHART.slice(forecastStartIdx - 1).map((d, i) => `${((forecastStartIdx - 1 + i) / (PRICE_CHART.length - 1)) * w},${h - ((d.price - min) / range) * h}`).join(" ");
  const areaPath = `M ${allPts[0]} ${realPts} L ${(realItems.length - 1) / (PRICE_CHART.length - 1) * w},${h} L 0,${h} Z`;
  return (
    <div className="relative w-full overflow-x-auto">
      <svg viewBox={`0 0 ${w} ${h + 30}`} className="w-full">
        <defs>
          <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#10b981" stopOpacity="0.25" />
            <stop offset="100%" stopColor="#10b981" stopOpacity="0" />
          </linearGradient>
        </defs>
        {[0, 0.25, 0.5, 0.75, 1].map((t, i) => (
          <line key={i} x1="0" y1={h * t} x2={w} y2={h * t} stroke="rgba(0,0,0,0.06)" strokeWidth="1" />
        ))}
        {PRICE_CHART.map((d, i) => (
          <text key={i} x={(i / (PRICE_CHART.length - 1)) * w} y={h + 20} textAnchor="middle" fill="rgba(0,0,0,0.35)" fontSize="11" fontFamily="IBM Plex Mono">{d.month}</text>
        ))}
        <path d={areaPath} fill="url(#chartGrad)" />
        <polyline points={realPts} fill="none" stroke="#10b981" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        <polyline points={forecastPts} fill="none" stroke="#f59e0b" strokeWidth="2" strokeDasharray="6,4" strokeLinecap="round" strokeLinejoin="round" />
        {PRICE_CHART.map((d, i) => (
          <circle key={i} cx={(i / (PRICE_CHART.length - 1)) * w} cy={h - ((d.price - min) / range) * h} r={d.forecast ? 3 : 4} fill={d.forecast ? "#f59e0b" : "#10b981"} stroke="white" strokeWidth="2" />
        ))}
      </svg>
    </div>
  );
}

// ─── SVG Chart: Supply/Demand ────────────────────────────────────────────────

function SupplyChart() {
  const max = Math.max(...SUPPLY_DATA.flatMap(d => [d.supply, d.demand]));
  const w = 600; const h = 160;
  const barW = w / SUPPLY_DATA.length;
  return (
    <div className="relative w-full overflow-x-auto">
      <svg viewBox={`0 0 ${w} ${h + 30}`} className="w-full">
        {[0, 0.5, 1].map((t, i) => (
          <line key={i} x1="0" y1={h * t} x2={w} y2={h * t} stroke="rgba(0,0,0,0.06)" strokeWidth="1" />
        ))}
        {SUPPLY_DATA.map((d, i) => {
          const x = i * barW + barW * 0.1;
          const w2 = barW * 0.35;
          const sh = (d.supply / max) * h;
          const dh = (d.demand / max) * h;
          return (
            <g key={i}>
              <rect x={x} y={h - sh} width={w2} height={sh} fill="#10b981" opacity="0.7" rx="2" />
              <rect x={x + w2 + 2} y={h - dh} width={w2} height={dh} fill="#f59e0b" opacity="0.7" rx="2" />
              <text x={x + w2} y={h + 18} textAnchor="middle" fill="rgba(0,0,0,0.4)" fontSize="10" fontFamily="IBM Plex Mono">{d.month}</text>
            </g>
          );
        })}
      </svg>
      <div className="flex gap-4 mt-1">
        <span className="flex items-center gap-1.5 text-xs text-muted-foreground"><span className="w-3 h-3 rounded-sm bg-primary/70 inline-block" />Предложение (тыс. т)</span>
        <span className="flex items-center gap-1.5 text-xs text-muted-foreground"><span className="w-3 h-3 rounded-sm bg-accent/70 inline-block" />Спрос (тыс. т)</span>
      </div>
    </div>
  );
}

// ─── Map placeholder (for home page preview, small) ──────────────────────────

function MapSVGSmall({ selectedRegion, onSelect }: { selectedRegion: string | null; onSelect: (id: string) => void }) {
  return (
    <div className="relative w-full h-full min-h-[280px]">
      <svg viewBox="0 0 100 100" className="w-full h-full">
        <defs>
          <radialGradient id="bgGrad2" cx="50%" cy="50%" r="70%">
            <stop offset="0%" stopColor="rgba(16,185,129,0.04)" />
            <stop offset="100%" stopColor="rgba(0,0,0,0)" />
          </radialGradient>
        </defs>
        <rect width="100" height="100" fill="url(#bgGrad2)" />
        {[...Array(10)].map((_, i) => <line key={`h${i}`} x1="0" y1={i * 10} x2="100" y2={i * 10} stroke="rgba(16,185,129,0.06)" strokeWidth="0.3" />)}
        {[...Array(10)].map((_, i) => <line key={`v${i}`} x1={i * 10} y1="0" x2={i * 10} y2="100" stroke="rgba(16,185,129,0.06)" strokeWidth="0.3" />)}
        {MAP_REGIONS.map(r => {
          const color = getRiskColor(r.risk);
          const isSelected = selectedRegion === r.id;
          const size = 3 + (r.area / 50) * 4;
          return (
            <g key={r.id} onClick={() => onSelect(r.id)} style={{ cursor: "pointer" }}>
              <circle cx={r.x} cy={r.y} r={size + 4} fill={`${color}12`} stroke={`${color}25`} strokeWidth="0.5" />
              <circle cx={r.x} cy={r.y} r={size} fill={isSelected ? color : `${color}80`} stroke={color} strokeWidth={isSelected ? 0.8 : 0.4}
                style={{ filter: isSelected ? `drop-shadow(0 0 3px ${color})` : undefined }} />
              <circle cx={r.x} cy={r.y} r={1} fill="white" opacity="0.9" />
              <text x={r.x} y={r.y + size + 5} textAnchor="middle" fill="rgba(0,0,0,0.45)" fontSize="3" fontFamily="Golos Text">{r.name}</text>
            </g>
          );
        })}
        <text x="50" y="97" textAnchor="middle" fill="rgba(16,185,129,0.3)" fontSize="3" fontFamily="IBM Plex Mono" letterSpacing="2">ПОВОЛЖЬЕ</text>
      </svg>
    </div>
  );
}

// ─── Business Calculator (API-backed) ────────────────────────────────────────

interface CalcResult {
  crop: string;
  area_ha: number;
  revenue_rub: number;
  cost_rub: number;
  profit_rub: number;
  margin_pct: number;
  roi_pct: number;
  best_sell_month: string;
  risk_level: string;
  recommendation: string;
}

function Calculator() {
  const [area, setArea] = useState(500);
  const [cropIdx, setCropIdx] = useState(0);
  const [result, setResult] = useState<CalcResult | null>(null);
  const [loading, setLoading] = useState(false);

  const cropName = PROFITABILITY_DATA[cropIdx].crop;

  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(true);
      fetch(CALC_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ crop: cropName, area }),
      })
        .then(r => r.json())
        .then((data: CalcResult) => { setResult(data); setLoading(false); })
        .catch(() => {
          // fallback to local calc
          const c = PROFITABILITY_DATA[cropIdx];
          setResult({
            crop: c.crop, area_ha: area,
            revenue_rub: c.revenue * area,
            cost_rub: c.cost * area,
            profit_rub: (c.revenue - c.cost) * area,
            margin_pct: c.margin, roi_pct: c.roi,
            best_sell_month: "Август–Сентябрь", risk_level: "средний",
            recommendation: c.margin > 35 ? "Оптимальная культура для вашей площади." : "Рассмотрите переход на подсолнечник (ROI 70.5%).",
          });
          setLoading(false);
        });
    }, 400);
    return () => clearTimeout(timer);
  }, [cropIdx, area, cropName]);

  const revenue = result ? result.revenue_rub / 1_000_000 : 0;
  const cost = result ? result.cost_rub / 1_000_000 : 0;
  const profit = result ? result.profit_rub / 1_000_000 : 0;

  return (
    <div className="space-y-5">
      <div>
        <label className="text-xs text-muted-foreground mb-1 block">Культура</label>
        <div className="flex gap-2 flex-wrap">
          {PROFITABILITY_DATA.map((c, i) => (
            <button key={i} onClick={() => setCropIdx(i)}
              className={`px-3 py-1.5 text-xs rounded-lg border transition-all font-medium
                ${cropIdx === i ? "bg-primary/15 text-primary border-primary/30" : "bg-secondary text-muted-foreground border-border hover:border-primary/30"}`}>
              {c.crop.split(" ")[0]}
            </button>
          ))}
        </div>
      </div>
      <div>
        <label className="text-xs text-muted-foreground mb-2 block">
          Площадь посева: <span className="font-mono font-bold text-foreground">{area} га</span>
          {loading && <span className="ml-2 text-muted-foreground">считаю...</span>}
        </label>
        <input type="range" min={50} max={5000} step={50} value={area} onChange={e => setArea(+e.target.value)}
          className="w-full h-2 bg-border rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-primary" />
        <div className="flex justify-between text-[10px] text-muted-foreground mt-1"><span>50 га</span><span>5 000 га</span></div>
      </div>
      <div className={`grid grid-cols-3 gap-3 transition-opacity ${loading ? "opacity-50" : ""}`}>
        <div className="bg-secondary/40 rounded-xl p-4 text-center">
          <div className="text-xs text-muted-foreground mb-1">Выручка</div>
          <div className="text-lg font-bold font-mono text-foreground">{revenue.toFixed(1)} млн ₽</div>
        </div>
        <div className="bg-secondary/40 rounded-xl p-4 text-center">
          <div className="text-xs text-muted-foreground mb-1">Затраты</div>
          <div className="text-lg font-bold font-mono text-destructive">{cost.toFixed(1)} млн ₽</div>
        </div>
        <div className="bg-primary/10 border border-primary/25 rounded-xl p-4 text-center">
          <div className="text-xs text-muted-foreground mb-1">Прибыль</div>
          <div className="text-lg font-bold font-mono text-primary">{profit.toFixed(1)} млн ₽</div>
        </div>
      </div>
      {result && (
        <>
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: "Маржинальность", value: `${result.margin_pct}%`, good: result.margin_pct > 35 },
              { label: "ROI", value: `${result.roi_pct}%`, good: result.roi_pct > 50 },
            ].map((m, i) => (
              <div key={i} className={`p-3 rounded-lg border ${m.good ? "border-primary/25 bg-primary/5" : "border-border bg-secondary/30"}`}>
                <div className="text-xs text-muted-foreground">{m.label}</div>
                <div className={`text-xl font-bold font-mono mt-0.5 ${m.good ? "text-primary" : "text-foreground"}`}>{m.value}</div>
              </div>
            ))}
          </div>
          <div className="flex gap-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-1"><Icon name="Calendar" size={11} />Лучший срок продаж: <span className="font-medium text-foreground">{result.best_sell_month}</span></span>
            <span className="flex items-center gap-1"><Icon name="Shield" size={11} />Риск: <span className="font-medium text-foreground">{result.risk_level}</span></span>
          </div>
          <div className="p-3 bg-accent/8 border border-accent/20 rounded-lg">
            <div className="flex items-start gap-2">
              <Icon name="Lightbulb" size={14} className="text-accent mt-0.5 shrink-0" />
              <div className="text-xs text-foreground">
                <span className="font-medium">Рекомендация (API):</span>{" "}{result.recommendation}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

// ─── Main PageContent ─────────────────────────────────────────────────────────

interface PageContentProps {
  activeSection: string;
  animKey: number;
  selectedRegion: string | null;
  setSelectedRegion: (id: string) => void;
  selectedCrop: string;
  setSelectedCrop: (crop: string) => void;
  setActiveSection: (section: string) => void;
}

export default function PageContent({
  activeSection, animKey, selectedRegion, setSelectedRegion,
  selectedCrop, setSelectedCrop, setActiveSection,
}: PageContentProps) {
  const selectedRegionData = MAP_REGIONS.find(r => r.id === selectedRegion);
  const selectedForecast = FORECAST_DATA.find(f => f.crop === selectedCrop) || FORECAST_DATA[0];

  return (
    <main className="flex-1 overflow-y-auto p-4 lg:p-6 bg-grid" key={animKey}>

      {/* ── HOME ── */}
      {activeSection === "home" && (
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
              <MapSVG selectedRegion={selectedRegion} onSelect={setSelectedRegion} />
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

          {/* Quick price forecasts */}
          <div className="glass-card rounded-xl p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Icon name="TrendingUp" size={16} className="text-primary" />
                <span className="font-semibold text-sm">Прогнозы цен на 3 месяца</span>
              </div>
              <button onClick={() => setActiveSection("forecasts")} className="text-xs text-primary hover:text-primary/80 transition-colors">Подробнее →</button>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3">
              {FORECAST_DATA.map((f, i) => (
                <div key={i} className="bg-secondary/40 rounded-lg p-3 hover:bg-secondary/70 transition-colors cursor-pointer" onClick={() => { setSelectedCrop(f.crop); setActiveSection("forecasts"); }}>
                  <div className="text-xs text-muted-foreground mb-1 truncate">{f.crop}</div>
                  <div className="font-bold font-mono text-sm text-foreground">{f.forecastPrice.toLocaleString()} ₽</div>
                  <div className={`flex items-center gap-1 text-xs font-medium mt-1 ${f.trend === "up" ? "text-primary" : "text-destructive"}`}>
                    <Icon name={f.trend === "up" ? "TrendingUp" : "TrendingDown"} size={11} />
                    {f.change > 0 ? "+" : ""}{f.change}%
                  </div>
                  <div className="mt-2">
                    <div className="flex justify-between text-[10px] text-muted-foreground mb-1"><span>Уверенность</span><span className="font-mono">{f.confidence}%</span></div>
                    <div className="h-1 bg-border rounded-full">
                      <div className="h-full rounded-full bg-primary" style={{ width: `${f.confidence}%`, opacity: f.confidence / 100 * 0.7 + 0.3 }} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── FORECASTS ── */}
      {activeSection === "forecasts" && (
        <div className="space-y-6 animate-fade-in">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Прогнозы цен и урожайности</h1>
            <p className="text-muted-foreground mt-1 text-sm">ARIMA + LSTM · сезонность · горизонт 3–12 месяцев · уровень уверенности</p>
          </div>
          <div className="flex gap-2 flex-wrap">
            {CROPS.map(c => (
              <button key={c} onClick={() => setSelectedCrop(FORECAST_DATA.find(f => f.crop.includes(c))?.crop || c)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-all
                  ${selectedForecast.crop.includes(c) ? "bg-primary/15 text-primary border-primary/30" : "bg-secondary text-muted-foreground border-border hover:border-primary/30"}`}>
                {c}
              </button>
            ))}
          </div>
          <div className="glass-card rounded-xl p-6">
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-6">
              <div>
                <h2 className="text-lg font-bold text-foreground">{selectedForecast.crop}</h2>
                <div className="flex items-center gap-3 mt-2 flex-wrap">
                  <div><div className="text-xs text-muted-foreground">Текущая цена</div><div className="text-xl font-bold font-mono text-foreground">{selectedForecast.currentPrice.toLocaleString()} ₽/т</div></div>
                  <Icon name="ArrowRight" size={16} className="text-muted-foreground mt-3" />
                  <div><div className="text-xs text-muted-foreground">Прогноз (июль)</div>
                    <div className={`text-xl font-bold font-mono ${selectedForecast.trend === "up" ? "text-primary" : "text-destructive"}`}>{selectedForecast.forecastPrice.toLocaleString()} ₽/т</div>
                  </div>
                </div>
              </div>
              <div className="flex gap-3">
                <div className={`px-4 py-3 rounded-xl border text-center ${selectedForecast.trend === "up" ? "bg-primary/10 border-primary/25 text-primary" : "bg-destructive/10 border-destructive/25 text-destructive"}`}>
                  <div className="text-2xl font-bold font-mono">{selectedForecast.change > 0 ? "+" : ""}{selectedForecast.change}%</div>
                  <div className="text-xs opacity-70">изменение</div>
                </div>
                <div className="px-4 py-3 rounded-xl border border-accent/25 bg-accent/10 text-center">
                  <div className="text-2xl font-bold font-mono text-accent">{selectedForecast.confidence}%</div>
                  <div className="text-xs text-muted-foreground">уверенность</div>
                </div>
              </div>
            </div>
            <div className="mb-6">
              <div className="flex justify-between text-xs text-muted-foreground mb-2"><span>Уровень уверенности модели (LSTM)</span><span className="font-mono font-medium text-accent">{selectedForecast.confidence}%</span></div>
              <div className="h-2 bg-border rounded-full"><div className="h-full rounded-full bg-gradient-to-r from-accent/70 to-accent transition-all duration-700" style={{ width: `${selectedForecast.confidence}%` }} /></div>
              <div className="flex justify-between text-[10px] text-muted-foreground mt-1"><span>Низкая</span><span>Средняя</span><span>Высокая</span></div>
            </div>
            <div>
              <div className="flex items-center gap-4 mb-3">
                <span className="flex items-center gap-1.5 text-xs text-muted-foreground"><span className="w-6 h-0.5 bg-primary inline-block" />Факт</span>
                <span className="flex items-center gap-1.5 text-xs text-muted-foreground"><span className="w-6 border-t-2 border-dashed border-accent inline-block" />Прогноз</span>
              </div>
              <PriceChart />
            </div>
          </div>
          <div className="glass-card rounded-xl p-6">
            <div className="flex items-center gap-2 mb-4">
              <Icon name="Table" size={16} className="text-primary" />
              <h2 className="font-semibold">Сводная таблица прогнозов</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead><tr className="border-b border-border">
                  {["Культура", "Цена сейчас", "Прогноз", "Изменение", "Уверенность", "Урожайность"].map(h => (
                    <th key={h} className="text-left text-xs text-muted-foreground font-medium py-2 pr-4 last:pr-0">{h}</th>
                  ))}
                </tr></thead>
                <tbody>
                  {FORECAST_DATA.map((f, i) => (
                    <tr key={i} className="border-b border-border/40 hover:bg-secondary/30 transition-colors cursor-pointer" onClick={() => setSelectedCrop(f.crop)}>
                      <td className="py-3 pr-4 font-medium text-foreground">{f.crop}</td>
                      <td className="py-3 pr-4 font-mono text-muted-foreground">{f.currentPrice.toLocaleString()}</td>
                      <td className="py-3 pr-4 font-mono font-bold">{f.forecastPrice.toLocaleString()} ₽</td>
                      <td className={`py-3 pr-4 font-mono font-bold ${f.trend === "up" ? "text-primary" : "text-destructive"}`}>{f.change > 0 ? "+" : ""}{f.change}%</td>
                      <td className="py-3 pr-4"><div className="flex items-center gap-2"><div className="w-16 h-1.5 bg-border rounded-full"><div className="h-full rounded-full bg-accent" style={{ width: `${f.confidence}%` }} /></div><span className="font-mono text-xs">{f.confidence}%</span></div></td>
                      <td className="py-3 font-mono text-xs"><span className={f.yieldForecast > f.yield ? "text-primary" : "text-destructive"}>{f.yieldForecast} ц/га</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ── MAP ── */}
      {activeSection === "map" && (
        <div className="space-y-6 animate-fade-in">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Карта урожайности Поволжья</h1>
            <p className="text-muted-foreground mt-1 text-sm">Спутниковые данные Sentinel-2 · NDVI · метеоусловия · нажмите регион для деталей</p>
          </div>
          <div className="grid lg:grid-cols-3 gap-4">
            <div className="lg:col-span-2 glass-card rounded-xl p-5">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Icon name="Satellite" size={14} className="text-primary" />
                  <span className="text-xs font-mono text-muted-foreground">ESRI WORLD IMAGERY · ПОВОЛЖЬЕ</span>
                </div>
                <div className="flex items-center gap-1.5 text-xs text-primary"><span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse-glow" />Live</div>
              </div>
              <Suspense fallback={<div className="h-[420px] rounded-xl bg-secondary/40 animate-pulse flex items-center justify-center text-muted-foreground text-sm">Загрузка карты...</div>}>
                <VolgaMap selectedRegion={selectedRegion} onSelect={setSelectedRegion} />
              </Suspense>
              <div className="flex gap-4 mt-4 flex-wrap">
                {[{ label: "Критический риск", color: "bg-destructive" }, { label: "Средний риск", color: "bg-accent" }, { label: "Низкий риск", color: "bg-primary" }].map(l => (
                  <span key={l.label} className="flex items-center gap-1.5 text-xs text-muted-foreground"><span className={`w-2.5 h-2.5 rounded-full ${l.color}`} />{l.label}</span>
                ))}
              </div>
            </div>
            <div className="space-y-3">
              {selectedRegionData && (
                <div className="glass-card rounded-xl p-4 border" style={{ borderColor: `${getRiskColor(selectedRegionData.risk)}40` }}>
                  <div className="flex items-center gap-2 mb-3">
                    <Icon name="MapPin" size={14} style={{ color: getRiskColor(selectedRegionData.risk) }} />
                    <span className="font-semibold text-sm">{selectedRegionData.name} обл.</span>
                  </div>
                  <div className="space-y-2.5">
                    {[
                      { label: "Индекс риска", value: `${selectedRegionData.risk}%`, colored: true },
                      { label: "NDVI (вегетация)", value: selectedRegionData.ndvi.toFixed(2), colored: false },
                      { label: "Осадки, мм/мес", value: `${selectedRegionData.rain} мм`, colored: false },
                      { label: "Температура", value: `+${selectedRegionData.temp}°C`, colored: false },
                      { label: "Площадь угодий", value: `${selectedRegionData.area} тыс. га`, colored: false },
                    ].map((row, i) => (
                      <div key={i} className="flex justify-between text-xs border-b border-border/40 pb-1.5">
                        <span className="text-muted-foreground">{row.label}</span>
                        <span className="font-mono font-bold" style={row.colored ? { color: getRiskColor(selectedRegionData.risk) } : undefined}>{row.value}</span>
                      </div>
                    ))}
                    <div>
                      <div className="flex justify-between text-xs mb-1"><span className="text-muted-foreground">Уровень</span><span className="font-medium" style={{ color: getRiskColor(selectedRegionData.risk) }}>{getRiskLabel(selectedRegionData.risk)}</span></div>
                      <div className="h-2 bg-border rounded-full"><div className="h-full rounded-full transition-all duration-500" style={{ width: `${selectedRegionData.risk}%`, backgroundColor: getRiskColor(selectedRegionData.risk) }} /></div>
                    </div>
                  </div>
                </div>
              )}
              <div className="glass-card rounded-xl p-4">
                <div className="text-xs font-medium text-muted-foreground mb-3">ВСЕ РЕГИОНЫ</div>
                <div className="space-y-1.5">
                  {MAP_REGIONS.map(r => (
                    <button key={r.id} onClick={() => setSelectedRegion(r.id)}
                      className={`w-full flex items-center gap-2 p-2 rounded-lg text-xs transition-all ${selectedRegion === r.id ? "bg-secondary" : "hover:bg-secondary/50"}`}>
                      <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: getRiskColor(r.risk) }} />
                      <span className="text-foreground flex-1 text-left">{r.name}</span>
                      <span className="font-mono text-muted-foreground text-[10px]">NDVI {r.ndvi.toFixed(2)}</span>
                      <span className="font-mono font-bold" style={{ color: getRiskColor(r.risk) }}>{r.risk}%</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── SUPPLY/DEMAND ── */}
      {activeSection === "supply" && (
        <div className="space-y-6 animate-fade-in">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Мониторинг спроса и предложения</h1>
            <p className="text-muted-foreground mt-1 text-sm">Оптовые рынки · биржи · экспорт/импорт · прогноз баланса</p>
          </div>

          {/* Market sources */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {MARKET_SOURCES.map((s, i) => (
              <div key={i} className="glass-card rounded-xl p-4">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center"><Icon name={s.icon as string} size={15} className="text-foreground" /></div>
                  <span className="text-sm font-medium">{s.name}</span>
                </div>
                <div className="text-xl font-bold font-mono">{(s.volume / 1000).toFixed(0)} тыс. т</div>
                <div className={`flex items-center gap-1 text-xs font-medium mt-1 ${s.trend === "up" ? "text-primary" : "text-destructive"}`}>
                  <Icon name={s.trend === "up" ? "TrendingUp" : "TrendingDown"} size={11} />
                  {s.change > 0 ? "+" : ""}{s.change}% к прошлому периоду
                </div>
              </div>
            ))}
          </div>

          {/* Chart */}
          <div className="glass-card rounded-xl p-6">
            <div className="flex items-center gap-2 mb-4">
              <Icon name="ArrowLeftRight" size={16} className="text-primary" />
              <h2 className="font-semibold">Баланс спроса и предложения (тыс. т)</h2>
            </div>
            <SupplyChart />
            <div className="mt-4 p-3 bg-primary/8 border border-primary/20 rounded-lg">
              <div className="flex items-start gap-2">
                <Icon name="Info" size={13} className="text-primary mt-0.5 shrink-0" />
                <p className="text-xs text-foreground">Прогноз: в июне-июле ожидается профицит предложения (+38%). Рекомендуется рассмотреть форвардные контракты или складское хранение до сентября.</p>
              </div>
            </div>
          </div>

          {/* Export/import */}
          <div className="glass-card rounded-xl p-6">
            <div className="flex items-center gap-2 mb-4">
              <Icon name="Globe" size={16} className="text-primary" />
              <h2 className="font-semibold">Экспортно-импортные потоки (тыс. т/мес)</h2>
            </div>
            <div className="space-y-3">
              {EXPORT_DATA.map((e, i) => (
                <div key={i} className="flex items-center gap-4">
                  <div className="w-40 text-xs text-muted-foreground">{e.direction}</div>
                  <div className="flex-1 h-7 bg-border rounded-lg relative overflow-hidden">
                    <div className="h-full rounded-lg transition-all duration-700 bg-primary/50" style={{ width: `${e.share * 2.8}%` }} />
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-mono font-bold">{e.volume} тыс. т</span>
                  </div>
                  <div className={`text-xs font-medium w-12 text-right ${e.trend === "up" ? "text-primary" : e.trend === "down" ? "text-destructive" : "text-muted-foreground"}`}>{e.share}%</div>
                </div>
              ))}
            </div>
          </div>

          {/* Gov contracts */}
          <div className="glass-card rounded-xl p-6">
            <div className="flex items-center gap-2 mb-4">
              <Icon name="FileText" size={16} className="text-primary" />
              <h2 className="font-semibold">Крупные контракты и госзакупки</h2>
            </div>
            <div className="space-y-2">
              {[
                { buyer: "Минобороны РФ", product: "Пшеница", volume: "120 тыс. т", price: "14 100 ₽/т", status: "Исполняется", color: "primary" },
                { buyer: "Минсельхоз (ФИ)", product: "Рожь", volume: "45 тыс. т", price: "9 200 ₽/т", status: "Тендер", color: "amber" },
                { buyer: "Группа ЭФКО", product: "Подсолнечник", volume: "200 тыс. т", price: "27 800 ₽/т", status: "Подписан", color: "primary" },
                { buyer: "Экспорт (Египет)", product: "Пшеница", volume: "80 тыс. т", price: "Контракт CBOT", status: "Переговоры", color: "muted" },
              ].map((c, i) => (
                <div key={i} className="flex items-center gap-3 p-3 rounded-lg bg-secondary/30 hover:bg-secondary/50 transition-colors text-sm">
                  <div className="flex-1 min-w-0">
                    <span className="font-medium">{c.buyer}</span>
                    <span className="text-muted-foreground mx-2">·</span>
                    <span className="text-muted-foreground">{c.product}</span>
                  </div>
                  <span className="font-mono text-xs hidden sm:block">{c.volume}</span>
                  <span className="font-mono text-xs text-muted-foreground hidden lg:block">{c.price}</span>
                  <span className={`px-2 py-0.5 text-[10px] font-mono rounded uppercase shrink-0 ${c.color === "primary" ? "bg-primary/15 text-primary" : c.color === "amber" ? "bg-accent/15 text-accent" : "bg-secondary text-muted-foreground"}`}>{c.status}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── RISKS ── */}
      {activeSection === "risks" && (
        <div className="space-y-6 animate-fade-in">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Оценка и мониторинг рисков</h1>
            <p className="text-muted-foreground mt-1 text-sm">Засуха · заморозки · вредители · переувлажнение · рекомендации по минимизации</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {[
              { label: "Критических угроз", value: "2", color: "destructive", icon: "AlertOctagon" },
              { label: "Средних рисков", value: "2", color: "amber", icon: "AlertTriangle" },
              { label: "Под контролем", value: "4", color: "primary", icon: "CheckCircle2" },
            ].map((s, i) => (
              <div key={i} className={`glass-card rounded-xl p-4 border ${s.color === "destructive" ? "border-destructive/25" : s.color === "amber" ? "border-accent/25" : "border-primary/25"}`}>
                <div className={`w-8 h-8 rounded-lg mb-3 flex items-center justify-center ${s.color === "destructive" ? "bg-destructive/15 text-destructive" : s.color === "amber" ? "bg-accent/15 text-accent" : "bg-primary/15 text-primary"}`}><Icon name={s.icon as string} size={16} /></div>
                <div className="text-2xl font-bold font-mono">{s.value}</div>
                <div className="text-xs text-muted-foreground">{s.label}</div>
              </div>
            ))}
          </div>
          <div className="glass-card rounded-xl p-6">
            <div className="flex items-center gap-2 mb-5">
              <Icon name="ShieldAlert" size={16} className="text-primary" />
              <h2 className="font-semibold">Детальная оценка рисков</h2>
            </div>
            <div className="space-y-3">
              {RISK_DATA.map((r, i) => (
                <div key={i} className="flex flex-col sm:flex-row sm:items-center gap-3 p-3 rounded-lg bg-secondary/30 hover:bg-secondary/50 transition-colors">
                  <div className="flex items-center gap-3 flex-1">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: `${r.color}20` }}>
                      <span className="text-sm">{r.type === "Засуха" || r.type === "Суховей" ? "🌵" : r.type === "Заморозки" ? "❄️" : r.type === "Вредители" ? "🐛" : r.type === "Переувлажнение" ? "💧" : "💨"}</span>
                    </div>
                    <div><div className="font-medium text-sm">{r.region}</div><div className="text-xs text-muted-foreground">{r.type} · {r.crop}</div></div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="w-32">
                      <div className="flex justify-between text-xs mb-1"><span className="text-muted-foreground">Риск</span><span className="font-mono font-bold" style={{ color: r.color }}>{r.risk}%</span></div>
                      <div className="h-2 bg-border rounded-full"><div className="h-full rounded-full" style={{ width: `${r.risk}%`, backgroundColor: r.color }} /></div>
                    </div>
                    <span className={`px-2 py-0.5 rounded-md text-xs font-medium ${r.level === "critical" ? "bg-destructive/20 text-destructive" : r.level === "high" ? "bg-destructive/15 text-destructive" : r.level === "medium" ? "bg-accent/20 text-accent" : "bg-primary/15 text-primary"}`}>
                      {r.level === "critical" ? "Крит." : r.level === "high" ? "Высокий" : r.level === "medium" ? "Средний" : "Низкий"}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
          {/* Recommendations */}
          <div className="glass-card rounded-xl p-6">
            <div className="flex items-center gap-2 mb-4">
              <Icon name="Lightbulb" size={16} className="text-accent" />
              <h2 className="font-semibold">Рекомендации по минимизации рисков</h2>
            </div>
            <div className="grid sm:grid-cols-2 gap-3">
              {[
                { icon: "Shield", title: "Страхование урожая", desc: "Волгоград, Самара: оформить полис агрострахования до 15 мая. Субсидия 50% от Минсельхоза.", tag: "Срочно" },
                { icon: "Shuffle", title: "Диверсификация посевов", desc: "Снизить долю кукурузы в Волгоградской обл. с 40% до 25%, увеличить долю засухоустойчивых сортов.", tag: "Рекомендовано" },
                { icon: "Droplets", title: "Организация полива", desc: "Капельное орошение для Самарской и Волгоградской обл. ROI при текущих ценах — 2.4 года.", tag: "Долгосрочно" },
                { icon: "Bug", title: "Обработка от вредителей", desc: "Ульяновская обл.: профилактическая обработка посевов ячменя от злаковых мух в 1-й декаде мая.", tag: "Планово" },
              ].map((r, i) => (
                <div key={i} className="flex gap-3 p-4 rounded-xl bg-secondary/30 border border-border">
                  <div className="w-9 h-9 rounded-lg bg-primary/15 text-primary flex items-center justify-center shrink-0 mt-0.5"><Icon name={r.icon as string} size={16} /></div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className="text-sm font-semibold">{r.title}</span>
                      <span className="px-1.5 py-0.5 text-[10px] bg-primary/10 text-primary rounded font-mono">{r.tag}</span>
                    </div>
                    <p className="text-xs text-muted-foreground">{r.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── ANALYTICS ── */}
      {activeSection === "analytics" && (
        <div className="space-y-6 animate-fade-in">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Аналитика и рекомендации</h1>
            <p className="text-muted-foreground mt-1 text-sm">Рентабельность культур · севооборот · оптимальные сроки продаж</p>
          </div>
          <div className="grid lg:grid-cols-2 gap-4">
            {/* Profitability chart */}
            <div className="glass-card rounded-xl p-5">
              <div className="flex items-center gap-2 mb-4">
                <Icon name="BarChart3" size={16} className="text-primary" />
                <span className="font-semibold text-sm">Рентабельность по культурам</span>
              </div>
              <div className="space-y-3">
                {PROFITABILITY_DATA.map((f, i) => (
                  <div key={i} className="space-y-1">
                    <div className="flex justify-between text-xs"><span className="font-medium">{f.crop.split(" ")[0]}</span><span className="font-mono text-muted-foreground">маржа <span className={f.margin > 35 ? "text-primary font-bold" : ""}>{f.margin}%</span> · ROI {f.roi}%</span></div>
                    <div className="h-2.5 bg-border rounded-full overflow-hidden">
                      <div className="h-full rounded-full transition-all duration-700" style={{ width: `${f.margin * 2}%`, background: f.margin > 35 ? "linear-gradient(90deg, hsl(152,55%,36%), hsl(152,55%,50%))" : "linear-gradient(90deg, hsl(38,88%,46%), hsl(38,88%,60%))" }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
            {/* AI recommendations */}
            <div className="glass-card rounded-xl p-5">
              <div className="flex items-center gap-2 mb-4">
                <Icon name="Lightbulb" size={16} className="text-accent" />
                <span className="font-semibold text-sm">AI-рекомендации</span>
                <span className="ml-auto px-2 py-0.5 text-[10px] font-mono bg-accent/15 text-accent rounded">NLP + LSTM</span>
              </div>
              <div className="space-y-3">
                {[
                  { icon: "TrendingUp", color: "primary", title: "Увеличить долю пшеницы", desc: "Прогноз +11.3% к июлю. Оптимальное окно для наращивания позиций." },
                  { icon: "AlertTriangle", color: "amber", title: "Хеджировать риски подсолнечника", desc: "Цена снизится на 8.4%. Рекомендуется форвардный контракт." },
                  { icon: "Droplets", color: "cyan", title: "Дополнительный полив — Волгоград", desc: "ИЗМ влажности критический. Риск снижения урожайности 25%." },
                  { icon: "Calendar", color: "primary", title: "Оптимальные сроки продаж", desc: "Реализовывать пшеницу в августе-сентябре: прогноз +8% к летнему минимуму." },
                ].map((r, i) => (
                  <div key={i} className="flex gap-3 p-3 rounded-lg bg-secondary/30">
                    <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${r.color === "primary" ? "bg-primary/20 text-primary" : r.color === "amber" ? "bg-accent/20 text-accent" : "bg-cyan-500/20 text-cyan-400"}`}><Icon name={r.icon as string} size={13} /></div>
                    <div><div className="text-sm font-medium text-foreground">{r.title}</div><div className="text-xs text-muted-foreground mt-0.5">{r.desc}</div></div>
                  </div>
                ))}
              </div>
            </div>
          </div>
          {/* Metrics */}
          <div className="glass-card rounded-xl p-5">
            <div className="flex items-center gap-2 mb-4">
              <Icon name="Activity" size={16} className="text-primary" />
              <span className="font-semibold text-sm">Метрики платформы</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {[
                { label: "Точность прогнозов цен", value: "87.4%", sub: "+2.1%", up: true },
                { label: "Точность прогн. урожая", value: "82.1%", sub: "+0.8%", up: true },
                { label: "Данных обработано", value: "1.2M", sub: "записей/сут", up: true },
                { label: "Время обновления", value: "15 мин", sub: "задержка", up: false },
              ].map((m, i) => (
                <div key={i} className="text-center p-3 rounded-lg bg-secondary/40">
                  <div className="text-xl font-bold font-mono text-foreground">{m.value}</div>
                  <div className="text-xs text-muted-foreground mt-1">{m.label}</div>
                  <div className={`text-xs font-mono mt-1 ${m.up ? "text-primary" : "text-muted-foreground"}`}>{m.sub}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── BUSINESS ── */}
      {activeSection === "business" && (
        <div className="space-y-6 animate-fade-in">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Бизнес-инструменты</h1>
            <p className="text-muted-foreground mt-1 text-sm">Калькулятор себестоимости · маржинальность · коммерческие предложения · экспорт</p>
          </div>
          <div className="grid lg:grid-cols-2 gap-4">
            <div className="glass-card rounded-xl p-6">
              <div className="flex items-center gap-2 mb-5">
                <Icon name="Calculator" size={16} className="text-primary" />
                <h2 className="font-semibold">Калькулятор маржинальности</h2>
              </div>
              <Calculator />
            </div>
            <div className="space-y-4">
              {/* Crop comparison */}
              <div className="glass-card rounded-xl p-5">
                <div className="flex items-center gap-2 mb-4">
                  <Icon name="GitCompare" size={16} className="text-primary" />
                  <h2 className="font-semibold text-sm">Сравнение культур по ROI</h2>
                </div>
                <div className="space-y-2.5">
                  {[...PROFITABILITY_DATA].sort((a, b) => b.roi - a.roi).map((c, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${i === 0 ? "bg-accent text-accent-foreground" : "bg-secondary text-muted-foreground"}`}>{i + 1}</span>
                      <span className="text-sm flex-1">{c.crop.split(" ")[0]}</span>
                      <div className="w-20 h-2 bg-border rounded-full overflow-hidden">
                        <div className="h-full rounded-full bg-primary/70" style={{ width: `${c.roi}%` }} />
                      </div>
                      <span className="font-mono text-xs font-bold w-12 text-right">{c.roi}%</span>
                    </div>
                  ))}
                </div>
              </div>
              {/* Export actions */}
              <div className="glass-card rounded-xl p-5">
                <div className="flex items-center gap-2 mb-4">
                  <Icon name="Download" size={16} className="text-primary" />
                  <h2 className="font-semibold text-sm">Экспорт и отчёты</h2>
                </div>
                <div className="space-y-2">
                  {[
                    { label: "Аналитический отчёт (PDF)", icon: "FileText", tag: "PDF" },
                    { label: "Данные прогнозов (Excel)", icon: "Table", tag: "XLSX" },
                    { label: "Коммерческое предложение", icon: "FilePlus", tag: "DOCX" },
                    { label: "Выгрузка для 1С", icon: "Database", tag: "XML" },
                  ].map((r, i) => (
                    <button key={i} className="w-full flex items-center gap-3 p-3 rounded-lg bg-secondary/40 hover:bg-secondary/70 transition-colors text-sm text-left">
                      <Icon name={r.icon as string} size={15} className="text-muted-foreground" />
                      <span className="flex-1">{r.label}</span>
                      <span className="px-1.5 py-0.5 text-[10px] font-mono bg-border rounded text-muted-foreground">{r.tag}</span>
                      <Icon name="ChevronRight" size={14} className="text-muted-foreground" />
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
          {/* Integration cards */}
          <div className="glass-card rounded-xl p-5">
            <div className="flex items-center gap-2 mb-4">
              <Icon name="Link" size={16} className="text-primary" />
              <h2 className="font-semibold text-sm">Интеграция с учётными системами</h2>
            </div>
            <div className="grid sm:grid-cols-3 gap-3">
              {[
                { name: "1С:Агропредприятие", desc: "Двусторонняя синхронизация данных о производстве", status: "pending" },
                { name: "SAP Agro", desc: "Импорт позиций и экспорт аналитики в ERP", status: "disconnected" },
                { name: "CRM (amoCRM)", desc: "Автоматическое создание сделок по сигналам рынка", status: "disconnected" },
              ].map((s, i) => (
                <div key={i} className="p-4 rounded-xl bg-secondary/40 border border-border">
                  <div className="font-semibold text-sm mb-1">{s.name}</div>
                  <div className="text-xs text-muted-foreground mb-3">{s.desc}</div>
                  <button className={`w-full py-1.5 text-xs rounded-lg font-medium border transition-all ${s.status === "pending" ? "border-accent/30 text-accent bg-accent/10 hover:bg-accent/20" : "border-primary/30 text-primary bg-primary/10 hover:bg-primary/20"}`}>
                    {s.status === "pending" ? "Завершить настройку" : "Подключить"}
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── ALERTS ── */}
      {activeSection === "alerts" && (
        <div className="space-y-6 animate-fade-in">
          <div className="flex items-start justify-between flex-wrap gap-3">
            <div>
              <h1 className="text-2xl font-bold text-foreground">Центр уведомлений</h1>
              <p className="text-muted-foreground mt-1 text-sm">Критические события · погодные аномалии · изменения цен · госрегулирование</p>
            </div>
            <button className="text-xs px-3 py-1.5 bg-secondary text-muted-foreground rounded-lg border border-border hover:border-primary/30 transition-colors">Настроить уведомления</button>
          </div>
          <div className="flex gap-2 flex-wrap">
            {["Все", "Критические", "Предупреждения", "Инфо"].map(f => (
              <button key={f} className={`px-3 py-1.5 text-xs rounded-lg border transition-all ${f === "Все" ? "bg-primary/15 text-primary border-primary/30" : "bg-secondary text-muted-foreground border-border hover:border-primary/30"}`}>{f}</button>
            ))}
          </div>
          <div className="space-y-3">
            {ALERTS.map(a => (
              <div key={a.id} className={`glass-card rounded-xl p-4 border flex items-start gap-4 hover:scale-[1.005] transition-all
                ${a.type === "critical" ? "border-destructive/30" : a.type === "warning" ? "border-accent/25" : "border-border"}`}>
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${a.type === "critical" ? "bg-destructive/20 text-destructive" : a.type === "warning" ? "bg-accent/20 text-accent" : "bg-primary/20 text-primary"}`}>
                  <Icon name={a.icon as string} size={18} />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-sm">{a.title}</span>
                    <span className={`px-2 py-0.5 text-[10px] font-mono rounded uppercase ${a.type === "critical" ? "bg-destructive/20 text-destructive" : a.type === "warning" ? "bg-accent/20 text-accent" : "bg-primary/15 text-primary"}`}>
                      {a.type === "critical" ? "критично" : a.type === "warning" ? "внимание" : "инфо"}
                    </span>
                  </div>
                  <div className="text-sm text-muted-foreground mt-1">{a.desc}</div>
                </div>
                <span className="text-xs text-muted-foreground shrink-0 font-mono">{a.time}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── INTEGRATIONS ── */}
      {activeSection === "integrations" && (
        <div className="space-y-6 animate-fade-in">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Внешние интеграции и источники данных</h1>
            <p className="text-muted-foreground mt-1 text-sm">Биржи · спутники · метео · статистика · маркетплейсы</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              { name: "Росгидромет API", desc: "Метеоданные в реальном времени по всем районам Поволжья", status: "connected", icon: "Cloud", tag: "Погода" },
              { name: "CBOT / Euronext", desc: "Мировые цены на пшеницу, кукурузу, соевые бобы", status: "connected", icon: "TrendingUp", tag: "Биржа" },
              { name: "НТБ (Нац. товарная биржа)", desc: "Котировки зерновых на внутреннем рынке РФ", status: "connected", icon: "BarChart2", tag: "Биржа" },
              { name: "Sentinel-2 / Landsat", desc: "Спутниковые снимки NDVI для мониторинга посевов", status: "connected", icon: "Satellite", tag: "Спутник" },
              { name: "Минсельхоз РФ", desc: "Открытые данные, статистика урожайности, субсидии", status: "connected", icon: "Building2", tag: "Статистика" },
              { name: "АгроСервер", desc: "Оптовые цены с маркетплейса сельхозпродукции", status: "connected", icon: "Store", tag: "Рынок" },
              { name: "OpenWeatherMap", desc: "Прогноз погоды на 16 дней с обновлением каждый час", status: "connected", icon: "CloudRain", tag: "Погода" },
              { name: "Своё Фермерство", desc: "Цены и объёмы с фермерского маркетплейса", status: "pending", icon: "Leaf", tag: "Рынок" },
              { name: "Telegram Bot", desc: "Push-уведомления о ценах, рисках, новостях", status: "disconnected", icon: "MessageCircle", tag: "Уведомления" },
            ].map((s, i) => (
              <div key={i} className="glass-card rounded-xl p-5">
                <div className="flex items-start justify-between mb-3">
                  <div className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center"><Icon name={s.icon as string} size={18} className="text-foreground" /></div>
                  <div className="flex flex-col items-end gap-1">
                    <span className={`px-2 py-0.5 text-[10px] font-mono rounded uppercase ${s.status === "connected" ? "bg-primary/15 text-primary" : s.status === "pending" ? "bg-accent/15 text-accent" : "bg-secondary text-muted-foreground"}`}>
                      {s.status === "connected" ? "✓ активно" : s.status === "pending" ? "⋯ настройка" : "отключено"}
                    </span>
                    <span className="text-[9px] text-muted-foreground uppercase font-mono">{s.tag}</span>
                  </div>
                </div>
                <div className="font-semibold text-sm">{s.name}</div>
                <div className="text-xs text-muted-foreground mt-1 mb-4">{s.desc}</div>
                <button className={`w-full py-1.5 text-xs rounded-lg font-medium border transition-all
                  ${s.status === "connected" ? "border-border text-muted-foreground hover:border-destructive/50 hover:text-destructive" : "border-primary/30 text-primary bg-primary/10 hover:bg-primary/20"}`}>
                  {s.status === "connected" ? "Настроить" : "Подключить"}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── PRICING ── */}
      {activeSection === "pricing" && (
        <div className="space-y-6 animate-fade-in">
          <div className="text-center max-w-xl mx-auto">
            <h1 className="text-2xl font-bold text-foreground">Тарифы AgroForecast Pro</h1>
            <p className="text-muted-foreground mt-2 text-sm">Выберите план в зависимости от ваших задач. Все тарифы включают 14-дневный бесплатный период.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-4 max-w-4xl mx-auto">
            {PRICING_PLANS.map((plan, i) => (
              <div key={i} className={`glass-card rounded-2xl p-6 flex flex-col relative
                ${plan.popular ? "border-2 border-primary shadow-lg" : "border border-border"}`}>
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 bg-primary text-primary-foreground text-xs font-bold rounded-full">Популярный</div>
                )}
                <div className="mb-4">
                  <div className="text-sm font-semibold text-muted-foreground mb-1">{plan.name}</div>
                  <div className="flex items-baseline gap-1">
                    <span className="text-3xl font-bold font-mono text-foreground">{plan.price === 0 ? "0" : plan.price.toLocaleString()} ₽</span>
                    <span className="text-xs text-muted-foreground">/{plan.period}</span>
                  </div>
                </div>
                <div className="flex-1 space-y-2 mb-6">
                  {plan.features.map((f, j) => (
                    <div key={j} className="flex items-start gap-2 text-sm">
                      <Icon name="Check" size={14} className="text-primary mt-0.5 shrink-0" />
                      <span className="text-foreground">{f}</span>
                    </div>
                  ))}
                  {plan.disabled?.map((f, j) => (
                    <div key={j} className="flex items-start gap-2 text-sm opacity-40">
                      <Icon name="X" size={14} className="text-muted-foreground mt-0.5 shrink-0" />
                      <span className="text-muted-foreground">{f}</span>
                    </div>
                  ))}
                </div>
                <button className={`w-full py-2.5 rounded-xl text-sm font-semibold transition-all
                  ${plan.popular
                    ? "bg-primary text-primary-foreground hover:bg-primary/90"
                    : plan.price === 0
                    ? "bg-secondary text-foreground hover:bg-secondary/80 border border-border"
                    : "bg-accent text-accent-foreground hover:bg-accent/90"
                  }`}>
                  {plan.price === 0 ? "Начать бесплатно" : "Выбрать план"}
                </button>
              </div>
            ))}
          </div>
          {/* B2G */}
          <div className="glass-card rounded-xl p-6 max-w-4xl mx-auto">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-primary/15 text-primary flex items-center justify-center shrink-0"><Icon name="Building2" size={22} /></div>
              <div className="flex-1">
                <div className="font-bold text-base">B2G: для региональных минсельхозов</div>
                <div className="text-sm text-muted-foreground mt-0.5">Агрегированные данные и отчёты для мониторинга продовольственной безопасности. Кастомные дашборды под требования ведомства.</div>
              </div>
              <button className="px-4 py-2 bg-primary text-primary-foreground rounded-xl text-sm font-medium hover:bg-primary/90 transition-colors shrink-0">Запросить КП</button>
            </div>
          </div>
        </div>
      )}

    </main>
  );
}