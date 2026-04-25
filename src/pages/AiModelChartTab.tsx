import { useState } from "react";
import Icon from "@/components/ui/icon";
import { ChartPoint, ModelMeta, REGION_NAMES } from "./AiModelTypes";

// ─── Утилиты ────────────────────────────────────────────────────────────────

function ruText(s: string): string {
  if (!s) return s;
  return s
    .replace(/United States/gi, "США")
    .replace(/United Kingdom/gi, "Великобритания")
    .replace(/European Union/gi, "ЕС")
    .replace(/China/gi, "Китай")
    .replace(/Russia/gi, "Россия")
    .replace(/Germany/gi, "Германия")
    .replace(/France/gi, "Франция")
    .replace(/\bUS\b/g, "США")
    .replace(/\bEU\b/g, "ЕС");
}

const MONTHS_RU: Record<string, string> = {
  Jan: "Янв", Feb: "Фев", Mar: "Мар", Apr: "Апр",
  May: "Май", Jun: "Июн", Jul: "Июл", Aug: "Авг",
  Sep: "Сен", Oct: "Окт", Nov: "Ноя", Dec: "Дек",
  January: "Янв", February: "Фев", March: "Мар", April: "Апр",
  June: "Июн", July: "Июл", August: "Авг",
  September: "Сен", October: "Окт", November: "Ноя", December: "Дек",
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

// Строим псевдо-свечи из price/price_low/price_high/open/close
function buildCandle(d: ChartPoint) {
  const close = d.close ?? d.price;
  const open  = d.open  ?? (d.price_low  != null && d.price_high != null
    ? d.price_low + (d.price_high - d.price_low) * 0.35
    : d.price * 0.995);
  const high  = d.price_high ?? Math.max(open, close) * 1.005;
  const low   = d.price_low  ?? Math.min(open, close) * 0.995;
  const bull  = close >= open;
  return { open, close, high, low, bull };
}

// ─── Типы ─────────────────────────────────────────────────────────────────

interface AiModelChartTabProps {
  chart: ChartPoint[];
  crop: string;
  region: string;
  horizon: number;
  meta: ModelMeta | null;
}

type ChartMode = "candle" | "line";
type PeriodKey = "all" | "24" | "12" | "6";

const PERIODS: { key: PeriodKey; label: string }[] = [
  { key: "all", label: "Весь период" },
  { key: "24",  label: "24 мес" },
  { key: "12",  label: "12 мес" },
  { key: "6",   label: "6 мес"  },
];

// ─── Компонент ────────────────────────────────────────────────────────────

export default function AiModelChartTab({ chart, crop, region, horizon, meta }: AiModelChartTabProps) {
  const [mode, setMode]     = useState<ChartMode>("candle");
  const [period, setPeriod] = useState<PeriodKey>("all");
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  // Фильтрация по периоду — всегда берём максимум данных от API
  const periodN = period === "all" ? chart.length : Number(period);
  const chartData = chart.slice(-Math.min(periodN, chart.length));

  const cw = 680; const ch = 200; const padL = 62; const padR = 12;
  const chartW = cw - padL - padR;
  const n = chartData.length;

  const allHighs  = chartData.map(d => d.price_high ?? d.price);
  const allLows   = chartData.map(d => d.price_low  ?? d.price);
  const maxP = Math.max(...allHighs) * 1.02;
  const minP = Math.min(...allLows)  * 0.98;
  const rangeP = maxP - minP || 1;

  const px = (i: number) => padL + (n > 1 ? (i / (n - 1)) * chartW : chartW / 2);
  const py = (v: number) => ch - ((v - minP) / rangeP) * ch;

  const forecastI = chartData.findIndex(d => d.forecast);
  const realData  = chartData.filter(d => !d.forecast);

  // Линейный прогноз
  const linePts = realData.map((d, i) => `${px(i)},${py(d.price)}`).join(" ");
  const forecastPts = forecastI >= 0
    ? chartData.slice(forecastI - 1).map((d, i) => `${px(forecastI - 1 + i)},${py(d.price)}`).join(" ")
    : "";

  // Y-тики
  const yTicks = Array.from({ length: 5 }, (_, i) => minP + (rangeP * i) / 4);

  // Ширина свечи
  const candleW = Math.max(4, Math.min(18, chartW / n - 2));

  // Tooltip данные
  const hd = hoveredIdx !== null ? chartData[hoveredIdx] : null;
  const hdCandle = hd ? buildCandle(hd) : null;

  return (
    <>
      <div className="glass-card rounded-xl p-5">

        {/* Заголовок + переключатели */}
        <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
          <div>
            <div className="flex items-center gap-2">
              <Icon name="CandlestickChart" size={16} className="text-primary" />
              <h2 className="font-semibold">{crop} — прогноз цен на {horizon} мес.</h2>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {REGION_NAMES[region] ?? region} · ARIMA + Prophet + Transformer · {chartData.length} точек данных
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Переключатель режима */}
            <div className="flex gap-0.5 bg-secondary p-1 rounded-lg">
              <button
                onClick={() => setMode("candle")}
                title="Японские свечи"
                className={`flex items-center gap-1 px-2.5 py-1.5 rounded-md text-xs font-medium transition-all
                  ${mode === "candle" ? "bg-white text-primary shadow-sm border border-border" : "text-muted-foreground hover:text-foreground"}`}>
                <Icon name="CandlestickChart" size={12} />Свечи
              </button>
              <button
                onClick={() => setMode("line")}
                title="Линейный график"
                className={`flex items-center gap-1 px-2.5 py-1.5 rounded-md text-xs font-medium transition-all
                  ${mode === "line" ? "bg-white text-primary shadow-sm border border-border" : "text-muted-foreground hover:text-foreground"}`}>
                <Icon name="TrendingUp" size={12} />Линия
              </button>
            </div>

            {/* Переключатель периода */}
            <div className="flex gap-0.5 bg-secondary p-1 rounded-lg">
              {PERIODS.map(p => (
                <button key={p.key}
                  onClick={() => setPeriod(p.key)}
                  className={`px-2.5 py-1.5 rounded-md text-xs font-mono font-medium transition-all
                    ${period === p.key ? "bg-white text-primary shadow-sm border border-border" : "text-muted-foreground hover:text-foreground"}`}>
                  {p.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Легенда */}
        <div className="flex items-center gap-4 mb-3 text-xs text-muted-foreground">
          {mode === "candle" ? (
            <>
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-sm bg-primary inline-block" />Рост (закрытие выше открытия)
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-sm bg-destructive inline-block" />Снижение
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-sm bg-accent/40 inline-block" />Прогноз
              </span>
            </>
          ) : (
            <>
              <span className="flex items-center gap-1.5">
                <span className="w-6 h-0.5 bg-primary inline-block rounded" />Факт
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-6 border-t-2 border-dashed border-accent inline-block" />Прогноз AI
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-6 h-2 bg-accent/20 rounded inline-block" />Диапазон
              </span>
            </>
          )}
          <span className="ml-auto text-[10px] font-mono">Наведите на точку</span>
        </div>

        {/* SVG-график */}
        <div className="w-full overflow-x-auto" onMouseLeave={() => setHoveredIdx(null)}>
          <svg viewBox={`0 0 ${cw} ${ch + 36}`} className="w-full min-w-[400px]">
            <defs>
              <linearGradient id="actGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#2E7D32" stopOpacity="0.18" />
                <stop offset="100%" stopColor="#2E7D32" stopOpacity="0" />
              </linearGradient>
              <filter id="glow2">
                <feGaussianBlur stdDeviation="2" result="coloredBlur" />
                <feMerge><feMergeNode in="coloredBlur" /><feMergeNode in="SourceGraphic" /></feMerge>
              </filter>
            </defs>

            {/* Фон прогноза */}
            {forecastI >= 0 && (
              <rect x={px(forecastI - 1)} y={0}
                width={cw - px(forecastI - 1)} height={ch}
                fill="#FFC107" fillOpacity="0.05" />
            )}
            {forecastI >= 0 && (
              <line x1={px(forecastI - 1)} y1={0} x2={px(forecastI - 1)} y2={ch}
                stroke="#FFC107" strokeOpacity="0.4" strokeWidth="1" strokeDasharray="4,3" />
            )}

            {/* Горизонтальные сетки + ось Y */}
            {yTicks.map((v, i) => (
              <g key={i}>
                <line x1={padL} y1={py(v)} x2={cw - padR} y2={py(v)}
                  stroke="rgba(0,0,0,0.06)" strokeWidth="1" />
                <text x={padL - 5} y={py(v) + 4} textAnchor="end"
                  fill="rgba(0,0,0,0.38)" fontSize="9" fontFamily="IBM Plex Mono">
                  {Math.round(v / 1000)}к
                </text>
              </g>
            ))}

            {/* ── РЕЖИМ: СВЕЧИ ── */}
            {mode === "candle" && chartData.map((d, i) => {
              const { open, close, high, low, bull } = buildCandle(d);
              const cx = px(i);
              const isHov = hoveredIdx === i;
              const color = d.forecast
                ? (bull ? "#FFC107" : "#fb923c")
                : (bull ? "#2E7D32" : "#ef4444");
              const halfW = (candleW / 2) * (isHov ? 1.2 : 1);

              return (
                <g key={i}
                  onMouseEnter={() => setHoveredIdx(i)}
                  style={{ cursor: "crosshair" }}>
                  {/* Тень (фитиль) */}
                  <line x1={cx} y1={py(high)} x2={cx} y2={py(low)}
                    stroke={color} strokeWidth={isHov ? 1.5 : 1} strokeOpacity={d.forecast ? 0.7 : 0.9} />
                  {/* Тело свечи */}
                  <rect
                    x={cx - halfW}
                    y={py(Math.max(open, close))}
                    width={halfW * 2}
                    height={Math.max(1.5, Math.abs(py(open) - py(close)))}
                    fill={bull ? color : "white"}
                    stroke={color}
                    strokeWidth={bull ? 0 : 1.5}
                    fillOpacity={d.forecast ? 0.6 : 1}
                    rx={1.5}
                    filter={isHov ? "url(#glow2)" : undefined}
                  />
                  {/* Прозрачная зона hover */}
                  <rect x={cx - candleW} y={0} width={candleW * 2} height={ch}
                    fill="transparent" />
                </g>
              );
            })}

            {/* ── РЕЖИМ: ЛИНИЯ ── */}
            {mode === "line" && (
              <>
                {/* Зона диапазона прогноза */}
                {forecastI >= 0 && chartData.slice(forecastI).length > 1 && (() => {
                  const hiPts = chartData.slice(forecastI - 1).map((d, i) => `${px(forecastI - 1 + i)},${py(d.price_high ?? d.price)}`).join(" ");
                  const loPts = [...chartData.slice(forecastI - 1)].reverse().map((d, i, arr) => `${px(forecastI - 1 + arr.length - 1 - i)},${py(d.price_low ?? d.price)}`).join(" ");
                  return <polygon points={`${hiPts} ${loPts}`} fill="#FFC107" fillOpacity="0.1" />;
                })()}
                {/* Заливка под факт-линией */}
                {linePts && (
                  <path d={`M ${padL},${ch} L ${linePts} L ${px(realData.length - 1)},${ch} Z`}
                    fill="url(#actGrad)" />
                )}
                {/* Линия факта */}
                {linePts && (
                  <polyline points={linePts} fill="none" stroke="#2E7D32" strokeWidth="2.5"
                    strokeLinecap="round" strokeLinejoin="round" />
                )}
                {/* Линия прогноза */}
                {forecastPts && (
                  <polyline points={forecastPts} fill="none" stroke="#FFC107" strokeWidth="2.2"
                    strokeDasharray="7,4" strokeLinecap="round" strokeLinejoin="round" />
                )}
                {/* Точки + hover */}
                {chartData.map((d, i) => {
                  const isHov = hoveredIdx === i;
                  return (
                    <g key={i} onMouseEnter={() => setHoveredIdx(i)} style={{ cursor: "crosshair" }}>
                      <circle cx={px(i)} cy={py(d.price)} r={14} fill="transparent" />
                      {isHov && <circle cx={px(i)} cy={py(d.price)} r={10}
                        fill={d.forecast ? "#FFC107" : "#2E7D32"} fillOpacity="0.15" />}
                      <circle cx={px(i)} cy={py(d.price)}
                        r={isHov ? 6 : (d.forecast ? 3.5 : 4.5)}
                        fill={d.forecast ? "#FFC107" : "#2E7D32"}
                        stroke="white" strokeWidth="2"
                        filter={isHov ? "url(#glow2)" : undefined} />
                    </g>
                  );
                })}
              </>
            )}

            {/* Вертикальная линия hover */}
            {hoveredIdx !== null && (
              <line x1={px(hoveredIdx)} y1={0} x2={px(hoveredIdx)} y2={ch}
                stroke={hd?.forecast ? "#FFC107" : "#2E7D32"}
                strokeOpacity="0.25" strokeWidth="1.5" strokeDasharray="3,2" />
            )}

            {/* Подписи месяцев */}
            {chartData.map((d, i) => {
              const show = n <= 18 || i % Math.ceil(n / 18) === 0 || i === n - 1;
              if (!show) return null;
              return (
                <text key={i} x={px(i)} y={ch + 16} textAnchor="middle"
                  fill={hoveredIdx === i ? "#2E7D32" : "rgba(0,0,0,0.35)"}
                  fontSize="9" fontFamily="IBM Plex Mono"
                  fontWeight={hoveredIdx === i ? "700" : "400"}>
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
        </div>

        {/* Tooltip */}
        {hd && (
          <div className="mt-3 p-3 bg-secondary/50 rounded-xl border border-border text-xs font-mono flex flex-wrap gap-4">
            <span className="text-muted-foreground">{formatMonth(hd.month, hd.date)} {hd.date?.slice(0, 7)}</span>
            {mode === "candle" && hdCandle ? (
              <>
                <span>Откр: <strong className="text-foreground">{Math.round(hdCandle.open).toLocaleString("ru")} ₽</strong></span>
                <span>Закр: <strong className={hdCandle.bull ? "text-primary" : "text-destructive"}>{Math.round(hdCandle.close).toLocaleString("ru")} ₽</strong></span>
                <span>Макс: <strong className="text-foreground">{Math.round(hdCandle.high).toLocaleString("ru")} ₽</strong></span>
                <span>Мин: <strong className="text-foreground">{Math.round(hdCandle.low).toLocaleString("ru")} ₽</strong></span>
                <span className={`font-bold ${hdCandle.bull ? "text-primary" : "text-destructive"}`}>
                  {hdCandle.bull ? "▲" : "▼"} {Math.abs(Math.round(hdCandle.close - hdCandle.open)).toLocaleString("ru")} ₽
                </span>
              </>
            ) : (
              <>
                <span>Цена: <strong className="text-foreground">{Math.round(hd.price).toLocaleString("ru")} ₽/т</strong></span>
                {hd.price_high && <span>Макс: <strong className="text-foreground">{Math.round(hd.price_high).toLocaleString("ru")} ₽</strong></span>}
                {hd.price_low  && <span>Мин: <strong className="text-foreground">{Math.round(hd.price_low).toLocaleString("ru")} ₽</strong></span>}
              </>
            )}
            {hd.forecast && <span className="px-1.5 py-0.5 bg-accent/20 text-accent rounded font-sans">Прогноз AI</span>}
          </div>
        )}

        {/* Итоговые карточки */}
        {chartData.filter(d => d.forecast).length > 0 && (() => {
          const forecasts = chartData.filter(d => d.forecast);
          const last      = chartData.filter(d => !d.forecast).at(-1);
          const lastForecast = forecasts[forecasts.length - 1];
          const change = last ? ((lastForecast.price - last.price) / last.price * 100).toFixed(1) : "—";
          return (
            <div className="grid grid-cols-3 gap-3 mt-4">
              {[
                { label: "Текущая цена", value: (last?.price || 0).toLocaleString("ru") + " ₽/т" },
                { label: `Прогноз +${horizon} мес`, value: lastForecast.price.toLocaleString("ru") + " ₽/т" },
                { label: "Изменение", value: `${Number(change) > 0 ? "+" : ""}${change}%`, change: Number(change) },
              ].map((s, i) => (
                <div key={i} className="bg-secondary/40 rounded-xl p-3 text-center">
                  <div className="text-xs text-muted-foreground mb-1">{s.label}</div>
                  <div className={`font-bold font-mono text-sm ${"change" in s ? (s.change > 0 ? "text-primary" : "text-destructive") : "text-foreground"}`}>
                    {s.value}
                  </div>
                </div>
              ))}
            </div>
          );
        })()}
      </div>

      {/* Техническая информация */}
      {meta && (
        <div className="glass-card rounded-xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <Icon name="Database" size={14} className="text-primary" />
            <span className="text-sm font-semibold">Техническая информация о модели</span>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
            {[
              { label: "Период обучения", value: ruText(meta.training_period) },
              { label: "Обновление данных", value: ruText(meta.update_frequency) },
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
              { label: "Модуль цен",         stack: ["ARIMA (p=2,d=1,q=2)", "Prophet (сезонность)", "Transformer NLP", "Данные НТБ + CBOT", "Курс ЦБ РФ"] },
              { label: "Модуль рисков",      stack: ["Вероятностная модель", "Данные Росгидромет", "NDVI Sentinel-2", "Классификатор угроз", "Автоматические алерты"] },
            ].map((s, i) => (
              <div key={i} className="bg-secondary/30 rounded-lg p-3">
                <div className="font-medium text-foreground mb-2">{s.label}</div>
                <ul className="space-y-1">
                  {s.stack.map((item, j) => (
                    <li key={j} className="flex items-center gap-1.5 text-muted-foreground">
                      <span className="w-1 h-1 rounded-full bg-primary/60 shrink-0" />{item}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  );
}
