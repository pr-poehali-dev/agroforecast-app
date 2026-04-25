import { useState, useEffect } from "react";
import Icon from "@/components/ui/icon";
import { MAP_REGIONS, PRICE_CHART, SUPPLY_DATA, PROFITABILITY_DATA, getRiskColor } from "./data";

const AI_URL = "https://functions.poehali.dev/3f769f53-b21b-473e-91b9-b7a755123928";

const CROP_REGION: Record<string, string> = {
  "Пшеница озимая": "samara",
  "Подсолнечник": "samara",
  "Кукуруза": "volgograd",
  "Ячмень яровой": "tatarstan",
  "Рожь": "penza",
};

const MONTHS_RU: Record<string, string> = {
  Jan: "Янв", Feb: "Фев", Mar: "Мар", Apr: "Апр",
  May: "Май", Jun: "Июн", Jul: "Июл", Aug: "Авг",
  Sep: "Сен", Oct: "Окт", Nov: "Ноя", Dec: "Дек",
  "01": "Янв", "02": "Фев", "03": "Мар", "04": "Апр",
  "05": "Май", "06": "Июн", "07": "Июл", "08": "Авг",
  "09": "Сен", "10": "Окт", "11": "Ноя", "12": "Дек",
};

function formatMonth(month: string, date?: string): string {
  if (!month) return "";
  if (/[а-яА-Я]/.test(month)) return month.slice(0, 3);
  if (date) {
    const m = date.match(/^\d{4}-(\d{2})/);
    if (m && MONTHS_RU[m[1]]) return MONTHS_RU[m[1]];
  }
  for (const [en, ru] of Object.entries(MONTHS_RU)) {
    if (month.startsWith(en)) return ru;
  }
  const isoM = month.match(/\d{4}-(\d{2})/);
  if (isoM && MONTHS_RU[isoM[1]]) return MONTHS_RU[isoM[1]];
  return month.slice(0, 4);
}

interface ChartPt {
  month: string; date: string; price: number;
  price_low: number; price_high: number; forecast: boolean;
  open?: number; close?: number;
}

function buildCandle(d: ChartPt) {
  const close = d.close ?? d.price;
  const open  = d.open  ?? (d.price_low != null && d.price_high != null
    ? d.price_low + (d.price_high - d.price_low) * 0.35
    : d.price * 0.995);
  const high = d.price_high ?? Math.max(open, close) * 1.005;
  const low  = d.price_low  ?? Math.min(open, close) * 0.995;
  const bull = close >= open;
  return { open, close, high, low, bull };
}

const CALC_URL = "https://functions.poehali.dev/b54f9de1-da43-4c7f-b32f-63fbdcdbc6fd";

// ─── SVG Chart: Price — японские свечи, данные с API ────────────────────────

export function PriceChart({ crop }: { crop?: string }) {
  const [chartData, setChartData] = useState<ChartPt[]>([]);
  const [loading, setLoading] = useState(false);
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  useEffect(() => {
    if (!crop) return;
    const abort = new AbortController();
    setLoading(true);
    setChartData([]);
    const region = CROP_REGION[crop] || "samara";
    fetch(`${AI_URL}?crop=${encodeURIComponent(crop)}&region=${region}&chart=1&horizon=12`, { signal: abort.signal })
      .then(r => r.json())
      .then(d => { setChartData(d.series || []); setLoading(false); })
      .catch(() => setLoading(false));
    return () => abort.abort();
  }, [crop]);

  // Fallback на статичные данные если API не вернул ничего
  const data: ChartPt[] = chartData.length > 0 ? chartData : PRICE_CHART.map(d => ({
    month: d.month, date: d.month, price: d.price,
    price_low: d.price * 0.975, price_high: d.price * 1.025,
    forecast: d.forecast ?? false,
  }));

  if (loading) {
    return (
      <div className="w-full h-48 bg-secondary/30 rounded-xl animate-pulse flex items-center justify-center text-xs text-muted-foreground">
        <Icon name="Loader" size={14} className="text-primary animate-spin mr-2" />Загрузка данных...
      </div>
    );
  }

  const n = data.length;
  const w = 680; const h = 200; const padL = 60; const padR = 12;
  const chartW = w - padL - padR;

  const allHighs = data.map(d => d.price_high ?? d.price);
  const allLows  = data.map(d => d.price_low  ?? d.price);
  const maxP = Math.max(...allHighs) * 1.02;
  const minP = Math.min(...allLows)  * 0.98;
  const rangeP = maxP - minP || 1;

  const px = (i: number) => padL + (n > 1 ? (i / (n - 1)) * chartW : chartW / 2);
  const py = (v: number) => h - ((v - minP) / rangeP) * h;

  const forecastI = data.findIndex(d => d.forecast);
  const yTicks = Array.from({ length: 5 }, (_, i) => minP + (rangeP * i) / 4);
  const candleW = Math.max(4, Math.min(16, chartW / n - 2));

  const hd = hoveredIdx !== null ? data[hoveredIdx] : null;
  const hdCandle = hd ? buildCandle(hd) : null;

  return (
    <div className="relative w-full select-none" onMouseLeave={() => setHoveredIdx(null)}>
      {/* Переключатель режима и метки */}
      <div className="flex items-center gap-4 mb-2 text-[11px] text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-sm bg-primary inline-block" />Факт (рост)
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-sm bg-destructive inline-block" />Факт (снижение)
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-sm bg-accent/60 inline-block" />Прогноз AI
        </span>
        <span className="ml-auto font-mono text-[10px]">{crop}</span>
      </div>

      <svg viewBox={`0 0 ${w} ${h + 30}`} className="w-full min-w-[320px]"
        onMouseLeave={() => setHoveredIdx(null)}>
        <defs>
          <filter id="pcGlow">
            <feGaussianBlur stdDeviation="2" result="coloredBlur" />
            <feMerge><feMergeNode in="coloredBlur" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
        </defs>

        {/* Фон зоны прогноза */}
        {forecastI >= 0 && (
          <>
            <rect x={px(forecastI - 1)} y={0} width={w - px(forecastI - 1)} height={h} fill="#FFC107" fillOpacity="0.05" />
            <line x1={px(forecastI - 1)} y1={0} x2={px(forecastI - 1)} y2={h}
              stroke="#FFC107" strokeOpacity="0.4" strokeWidth="1" strokeDasharray="4,3" />
          </>
        )}

        {/* Горизонтальная сетка + ось Y */}
        {yTicks.map((v, i) => (
          <g key={i}>
            <line x1={padL} y1={py(v)} x2={w - padR} y2={py(v)} stroke="rgba(0,0,0,0.06)" strokeWidth="1" />
            <text x={padL - 5} y={py(v) + 4} textAnchor="end" fill="rgba(0,0,0,0.38)" fontSize="9" fontFamily="IBM Plex Mono">
              {Math.round(v / 1000)}к
            </text>
          </g>
        ))}

        {/* Японские свечи */}
        {data.map((d, i) => {
          const { open, close, high, low, bull } = buildCandle(d);
          const cx = px(i);
          const isHov = hoveredIdx === i;
          const color = d.forecast
            ? (bull ? "#FFC107" : "#fb923c")
            : (bull ? "#2E7D32" : "#ef4444");
          const halfW = (candleW / 2) * (isHov ? 1.15 : 1);

          return (
            <g key={i} onMouseEnter={() => setHoveredIdx(i)} style={{ cursor: "crosshair" }}>
              {/* Фитиль */}
              <line x1={cx} y1={py(high)} x2={cx} y2={py(low)}
                stroke={color} strokeWidth={isHov ? 1.5 : 1} strokeOpacity={d.forecast ? 0.7 : 1} />
              {/* Тело свечи */}
              <rect
                x={cx - halfW}
                y={py(Math.max(open, close))}
                width={halfW * 2}
                height={Math.max(1.5, Math.abs(py(open) - py(close)))}
                fill={bull ? color : "white"}
                stroke={color}
                strokeWidth={bull ? 0 : 1.5}
                fillOpacity={d.forecast ? 0.65 : 1}
                rx={1.5}
                filter={isHov ? "url(#pcGlow)" : undefined}
              />
              {/* Прозрачная hover-зона */}
              <rect x={cx - candleW} y={0} width={candleW * 2} height={h} fill="transparent" />
            </g>
          );
        })}

        {/* Вертикальная линия hover */}
        {hoveredIdx !== null && (
          <line x1={px(hoveredIdx)} y1={0} x2={px(hoveredIdx)} y2={h}
            stroke={hd?.forecast ? "#FFC107" : "#2E7D32"}
            strokeOpacity="0.25" strokeWidth="1.5" strokeDasharray="3,2" />
        )}

        {/* Подписи месяцев (прореживаем) */}
        {data.map((d, i) => {
          const show = n <= 14 || i % Math.ceil(n / 14) === 0 || i === n - 1;
          if (!show) return null;
          return (
            <text key={i} x={px(i)} y={h + 16} textAnchor="middle"
              fill={hoveredIdx === i ? "#2E7D32" : "rgba(0,0,0,0.35)"}
              fontSize="9" fontFamily="IBM Plex Mono" fontWeight={hoveredIdx === i ? "700" : "400"}>
              {formatMonth(d.month, d.date)}
            </text>
          );
        })}

        {/* Метки зон */}
        {forecastI > 0 && (
          <>
            <text x={padL + 4} y={13} fill="#2E7D32" fontSize="8.5" fontFamily="Golos Text" fillOpacity="0.65">▶ Факт</text>
            <text x={px(forecastI) + 4} y={13} fill="#b45309" fontSize="8.5" fontFamily="Golos Text" fillOpacity="0.75">▷ Прогноз AI</text>
          </>
        )}
      </svg>

      {/* Tooltip-панель под графиком */}
      {hd && hdCandle && (
        <div className="mt-2 px-1 py-2 bg-secondary/50 rounded-xl border border-border text-[11px] font-mono flex flex-wrap gap-4">
          <span className="text-muted-foreground">{formatMonth(hd.month, hd.date)}</span>
          <span>Откр: <strong className="text-foreground">{Math.round(hdCandle.open).toLocaleString("ru")} ₽</strong></span>
          <span>Закр: <strong className={hdCandle.bull ? "text-primary" : "text-destructive"}>{Math.round(hdCandle.close).toLocaleString("ru")} ₽</strong></span>
          <span>Макс: <strong className="text-foreground">{Math.round(hdCandle.high).toLocaleString("ru")} ₽</strong></span>
          <span>Мин: <strong className="text-foreground">{Math.round(hdCandle.low).toLocaleString("ru")} ₽</strong></span>
          <span className={`font-bold ${hdCandle.bull ? "text-primary" : "text-destructive"}`}>
            {hdCandle.bull ? "▲" : "▼"} {Math.abs(Math.round(hdCandle.close - hdCandle.open)).toLocaleString("ru")} ₽
          </span>
          {hd.forecast && <span className="px-1.5 py-0.5 bg-accent/20 text-accent rounded font-sans text-[10px]">Прогноз AI</span>}
        </div>
      )}

      {/* Нижняя легенда */}
      <div className="flex items-center gap-5 mt-2 px-1">
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