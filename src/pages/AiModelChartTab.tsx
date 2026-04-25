import Icon from "@/components/ui/icon";
import { ChartPoint, ModelMeta, REGION_NAMES } from "./AiModelTypes";

interface AiModelChartTabProps {
  chart: ChartPoint[];
  crop: string;
  region: string;
  horizon: number;
  meta: ModelMeta | null;
}

export default function AiModelChartTab({ chart, crop, region, horizon, meta }: AiModelChartTabProps) {
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
    <>
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
            {forecastStartI >= 0 && chartData.slice(forecastStartI).map((d, i) => {
              const xi = forecastStartI + i;
              const barW = cw / (chartData.length - 1);
              return (
                <rect key={i} x={px(xi) - barW / 2} y={py(d.price_high)} width={barW}
                  height={Math.max(0, py(d.price_low) - py(d.price_high))}
                  fill="#f59e0b" opacity="0.12" />
              );
            })}
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
        {chartData.filter(d => d.forecast).length > 0 && (
          <div className="grid grid-cols-3 gap-3 mt-4">
            {(() => {
              const forecasts = chartData.filter(d => d.forecast);
              const lastForecast = forecasts[forecasts.length - 1];
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
    </>
  );
}
