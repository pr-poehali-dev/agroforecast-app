import { useState, useEffect } from "react";
import Icon from "@/components/ui/icon";
import { MAP_REGIONS, PRICE_CHART, SUPPLY_DATA, PROFITABILITY_DATA, getRiskColor } from "./data";

const CALC_URL = "https://functions.poehali.dev/b54f9de1-da43-4c7f-b32f-63fbdcdbc6fd";

// ─── SVG Chart: Price (интерактивный) ─────────────────────────────────────────

export function PriceChart() {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  const max = Math.max(...PRICE_CHART.map(d => d.price));
  const min = Math.min(...PRICE_CHART.map(d => d.price)) - 800;
  const range = max - min;
  const w = 620; const h = 200; const padL = 65; const padR = 10;
  const chartW = w - padL - padR;
  const forecastStartIdx = PRICE_CHART.findIndex(d => d.forecast);
  const realItems = PRICE_CHART.filter(d => !d.forecast);

  const px = (i: number) => padL + (i / (PRICE_CHART.length - 1)) * chartW;
  const py = (v: number) => h - ((v - min) / range) * h;

  const realPts = realItems.map((_, i) => `${px(i)},${py(PRICE_CHART[i].price)}`).join(" ");
  const forecastPts = PRICE_CHART.slice(forecastStartIdx - 1)
    .map((d, i) => `${px(forecastStartIdx - 1 + i)},${py(d.price)}`).join(" ");

  const areaPathReal = realItems.length > 0
    ? `M ${padL},${h} L ${realPts} L ${px(realItems.length - 1)},${h} Z`
    : "";

  const yTicks = [11500, 12500, 13500, 14500];
  const hovered = hoveredIdx !== null ? PRICE_CHART[hoveredIdx] : null;
  const hx = hoveredIdx !== null ? px(hoveredIdx) : 0;
  const hy = hoveredIdx !== null ? py(PRICE_CHART[hoveredIdx].price) : 0;

  return (
    <div className="relative w-full select-none">
      <svg
        viewBox={`0 0 ${w} ${h + 50}`}
        className="w-full"
        onMouseLeave={() => setHoveredIdx(null)}
      >
        <defs>
          <linearGradient id="chartGrad2" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#2E7D32" stopOpacity="0.22" />
            <stop offset="100%" stopColor="#2E7D32" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="lineGrad" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#2E7D32" />
            <stop offset="100%" stopColor="#43A047" />
          </linearGradient>
          <filter id="glow">
            <feGaussianBlur stdDeviation="2.5" result="coloredBlur" />
            <feMerge><feMergeNode in="coloredBlur" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
        </defs>

        {/* Фон прогноза */}
        {forecastStartIdx >= 0 && (
          <rect
            x={px(forecastStartIdx - 1)} y={0}
            width={chartW - (px(forecastStartIdx - 1) - padL)} height={h}
            fill="#FFC107" fillOpacity="0.05"
          />
        )}
        {forecastStartIdx >= 0 && (
          <line
            x1={px(forecastStartIdx - 1)} y1={0}
            x2={px(forecastStartIdx - 1)} y2={h}
            stroke="#FFC107" strokeOpacity="0.35" strokeWidth="1" strokeDasharray="4,3"
          />
        )}

        {/* Горизонтальные сетки + оси Y */}
        {yTicks.map(v => (
          <g key={v}>
            <line x1={padL} y1={py(v)} x2={w - padR} y2={py(v)} stroke="rgba(0,0,0,0.06)" strokeWidth="1" />
            <text x={padL - 6} y={py(v) + 4} textAnchor="end" fill="rgba(0,0,0,0.38)" fontSize="9" fontFamily="IBM Plex Mono">
              {(v / 1000).toFixed(1)}к
            </text>
          </g>
        ))}

        {/* Заливка под линией (факт) */}
        {areaPathReal && <path d={areaPathReal} fill="url(#chartGrad2)" />}

        {/* Линия факта */}
        {realPts && (
          <polyline points={realPts} fill="none" stroke="url(#lineGrad)" strokeWidth="2.5"
            strokeLinecap="round" strokeLinejoin="round" />
        )}

        {/* Линия прогноза */}
        {forecastPts && (
          <polyline points={forecastPts} fill="none" stroke="#FFC107" strokeWidth="2.2"
            strokeDasharray="7,4" strokeLinecap="round" strokeLinejoin="round" />
        )}

        {/* Точки + hover-зоны */}
        {PRICE_CHART.map((d, i) => {
          const cx = px(i); const cy = py(d.price);
          const isHov = hoveredIdx === i;
          return (
            <g key={i}>
              <circle cx={cx} cy={cy} r={14} fill="transparent"
                onMouseEnter={() => setHoveredIdx(i)} style={{ cursor: "crosshair" }} />
              {isHov && <circle cx={cx} cy={cy} r={10} fill={d.forecast ? "#FFC107" : "#2E7D32"} fillOpacity="0.15" />}
              <circle cx={cx} cy={cy}
                r={isHov ? 6 : (d.forecast ? 3.5 : 4.5)}
                fill={d.forecast ? "#FFC107" : "#2E7D32"}
                stroke="white" strokeWidth="2"
                filter={isHov ? "url(#glow)" : undefined}
                style={{ transition: "r 0.15s" }}
              />
            </g>
          );
        })}

        {/* Вертикальная линия hover */}
        {hoveredIdx !== null && (
          <line x1={hx} y1={0} x2={hx} y2={h}
            stroke={hovered?.forecast ? "#FFC107" : "#2E7D32"}
            strokeOpacity="0.3" strokeWidth="1.5" strokeDasharray="3,2" />
        )}

        {/* Tooltip */}
        {hoveredIdx !== null && hovered && (() => {
          const tipW = 120; const tipH = 48;
          const tipX = Math.min(Math.max(hx - tipW / 2, padL), w - padR - tipW);
          const tipY = hy > h / 2 ? hy - tipH - 12 : hy + 14;
          return (
            <g>
              <rect x={tipX} y={tipY} width={tipW} height={tipH} rx="7"
                fill="white" stroke={hovered.forecast ? "#FFC107" : "#2E7D32"}
                strokeWidth="1.5" strokeOpacity="0.6"
                style={{ filter: "drop-shadow(0 2px 8px rgba(0,0,0,0.12))" }} />
              <text x={tipX + tipW / 2} y={tipY + 16} textAnchor="middle"
                fill="rgba(0,0,0,0.5)" fontSize="10" fontFamily="Golos Text, sans-serif">
                {hovered.month} {hovered.forecast ? "· прогноз" : "· факт"}
              </text>
              <text x={tipX + tipW / 2} y={tipY + 35} textAnchor="middle"
                fill={hovered.forecast ? "#b45309" : "#1B5E20"} fontSize="13"
                fontFamily="IBM Plex Mono, monospace" fontWeight="700">
                {hovered.price.toLocaleString("ru")} ₽/т
              </text>
            </g>
          );
        })()}

        {/* Подписи месяцев */}
        {PRICE_CHART.map((d, i) => (
          <text key={i} x={px(i)} y={h + 18} textAnchor="middle"
            fill={hoveredIdx === i ? "#2E7D32" : "rgba(0,0,0,0.35)"}
            fontSize="10" fontFamily="IBM Plex Mono" fontWeight={hoveredIdx === i ? "700" : "400"}>
            {d.month}
          </text>
        ))}

        {/* Метки факт/прогноз */}
        {forecastStartIdx >= 0 && (
          <>
            <text x={padL + 6} y={14} fill="#2E7D32" fontSize="9" fontFamily="Golos Text" fillOpacity="0.7">▶ Факт 2025</text>
            <text x={px(forecastStartIdx) + 4} y={14} fill="#b45309" fontSize="9" fontFamily="Golos Text" fillOpacity="0.75">▷ Прогноз AI</text>
          </>
        )}
      </svg>

      {/* Нижняя легенда */}
      <div className="flex items-center gap-5 mt-1 px-1">
        <span className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
          <svg width="24" height="4"><line x1="0" y1="2" x2="24" y2="2" stroke="#2E7D32" strokeWidth="2.5" strokeLinecap="round" /></svg>
          Факт (НТБ, ₽/т)
        </span>
        <span className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
          <svg width="24" height="4"><line x1="0" y1="2" x2="24" y2="2" stroke="#FFC107" strokeWidth="2" strokeDasharray="5,3" strokeLinecap="round" /></svg>
          Прогноз AI
        </span>
        <span className="ml-auto text-[10px] text-muted-foreground font-mono">Наведите на точку</span>
      </div>
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
        <text x="50" y="97" textAnchor="middle" fill="rgba(46,125,50,0.3)" fontSize="3" fontFamily="IBM Plex Mono" letterSpacing="2">РОССИЯ</text>
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