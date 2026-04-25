import { useState, useEffect } from "react";
import Icon from "@/components/ui/icon";
import { MAP_REGIONS, PRICE_CHART, SUPPLY_DATA, PROFITABILITY_DATA, getRiskColor } from "./data";

const CALC_URL = "https://functions.poehali.dev/b54f9de1-da43-4c7f-b32f-63fbdcdbc6fd";

// ─── SVG Chart: Price ────────────────────────────────────────────────────────

export function PriceChart() {
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
            <stop offset="0%" stopColor="#2E7D32" stopOpacity="0.28" />
            <stop offset="100%" stopColor="#2E7D32" stopOpacity="0" />
          </linearGradient>
        </defs>
        {[0, 0.25, 0.5, 0.75, 1].map((t, i) => (
          <line key={i} x1="0" y1={h * t} x2={w} y2={h * t} stroke="rgba(0,0,0,0.06)" strokeWidth="1" />
        ))}
        {PRICE_CHART.map((d, i) => (
          <text key={i} x={(i / (PRICE_CHART.length - 1)) * w} y={h + 20} textAnchor="middle" fill="rgba(0,0,0,0.35)" fontSize="11" fontFamily="IBM Plex Mono">{d.month}</text>
        ))}
        <path d={areaPath} fill="url(#chartGrad)" />
        <polyline points={realPts} fill="none" stroke="#2E7D32" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        <polyline points={forecastPts} fill="none" stroke="#FFC107" strokeWidth="2" strokeDasharray="6,4" strokeLinecap="round" strokeLinejoin="round" />
        {PRICE_CHART.map((d, i) => (
          <circle key={i} cx={(i / (PRICE_CHART.length - 1)) * w} cy={h - ((d.price - min) / range) * h} r={d.forecast ? 3 : 4} fill={d.forecast ? "#FFC107" : "#2E7D32"} stroke="white" strokeWidth="2" />
        ))}
      </svg>
    </div>
  );
}

// ─── SVG Chart: Supply/Demand ─────────────────────────────────────────────────

export function SupplyChart() {
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
              <rect x={x} y={h - sh} width={w2} height={sh} fill="#2E7D32" opacity="0.75" rx="2" />
              <rect x={x + w2 + 2} y={h - dh} width={w2} height={dh} fill="#FFC107" opacity="0.8" rx="2" />
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

// ─── Map placeholder (for home page preview, small) ───────────────────────────

export function MapSVGSmall({ selectedRegion, onSelect }: { selectedRegion: string | null; onSelect: (id: string) => void }) {
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

// ─── Business Calculator (API-backed) ─────────────────────────────────────────

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

export function Calculator() {
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
          <button
            className="w-full hero-gradient text-white font-heading font-bold py-3 px-6 rounded-xl shadow-lg hover:opacity-90 transition-opacity text-sm tracking-wide"
            onClick={() => {}}
          >
            Скачать расчёт PDF
          </button>
        </>
      )}
    </div>
  );
}
