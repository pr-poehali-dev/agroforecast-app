import Icon from "@/components/ui/icon";
import {
  CROPS, FORECAST_DATA, RISK_DATA, ALERTS, MAP_REGIONS,
  STATS, PRICE_CHART, getRiskColor, getRiskLabel,
} from "./data";

function PriceChart() {
  const max = Math.max(...PRICE_CHART.map(d => d.price));
  const min = Math.min(...PRICE_CHART.map(d => d.price)) - 500;
  const range = max - min;
  const w = 600;
  const h = 180;

  const realItems = PRICE_CHART.filter(d => !d.forecast);
  const forecastStartIdx = PRICE_CHART.findIndex(d => d.forecast);

  const allPts = PRICE_CHART.map((d, i) =>
    `${(i / (PRICE_CHART.length - 1)) * w},${h - ((d.price - min) / range) * h}`
  );

  const realPts = realItems.map((d, i) =>
    `${(i / (PRICE_CHART.length - 1)) * w},${h - ((d.price - min) / range) * h}`
  ).join(" ");

  const forecastPts = PRICE_CHART.slice(forecastStartIdx - 1).map((d, i) =>
    `${((forecastStartIdx - 1 + i) / (PRICE_CHART.length - 1)) * w},${h - ((d.price - min) / range) * h}`
  ).join(" ");

  const areaPath = `M ${allPts[0]} ${realPts} L ${(realItems.length - 1) / (PRICE_CHART.length - 1) * w},${h} L 0,${h} Z`;

  return (
    <div className="relative w-full overflow-x-auto">
      <svg viewBox={`0 0 ${w} ${h + 30}`} className="w-full">
        <defs>
          <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#10b981" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#10b981" stopOpacity="0" />
          </linearGradient>
        </defs>
        {[0, 0.25, 0.5, 0.75, 1].map((t, i) => (
          <line key={i} x1="0" y1={h * t} x2={w} y2={h * t}
            stroke="rgba(255,255,255,0.05)" strokeWidth="1" />
        ))}
        {PRICE_CHART.map((d, i) => (
          <text key={i} x={(i / (PRICE_CHART.length - 1)) * w} y={h + 20}
            textAnchor="middle" fill="rgba(255,255,255,0.35)" fontSize="11"
            fontFamily="IBM Plex Mono">
            {d.month}
          </text>
        ))}
        <path d={areaPath} fill="url(#chartGrad)" />
        <polyline points={realPts} fill="none" stroke="#10b981" strokeWidth="2.5"
          strokeLinecap="round" strokeLinejoin="round" />
        <polyline points={forecastPts} fill="none" stroke="#f59e0b" strokeWidth="2"
          strokeDasharray="6,4" strokeLinecap="round" strokeLinejoin="round" />
        {PRICE_CHART.map((d, i) => (
          <circle key={i}
            cx={(i / (PRICE_CHART.length - 1)) * w}
            cy={h - ((d.price - min) / range) * h}
            r={d.forecast ? 3 : 4}
            fill={d.forecast ? "#f59e0b" : "#10b981"}
            stroke="hsl(220 18% 9%)"
            strokeWidth="2"
          />
        ))}
      </svg>
    </div>
  );
}

function MapSVG({ selectedRegion, onSelect }: { selectedRegion: string | null; onSelect: (id: string) => void }) {
  return (
    <div className="relative w-full h-full min-h-[280px]">
      <svg viewBox="0 0 100 100" className="w-full h-full">
        <defs>
          <radialGradient id="bgGrad" cx="50%" cy="50%" r="70%">
            <stop offset="0%" stopColor="rgba(16,185,129,0.05)" />
            <stop offset="100%" stopColor="rgba(0,0,0,0)" />
          </radialGradient>
        </defs>
        <rect width="100" height="100" fill="url(#bgGrad)" />
        {[...Array(10)].map((_, i) => (
          <line key={`h${i}`} x1="0" y1={i * 10} x2="100" y2={i * 10}
            stroke="rgba(16,185,129,0.06)" strokeWidth="0.3" />
        ))}
        {[...Array(10)].map((_, i) => (
          <line key={`v${i}`} x1={i * 10} y1="0" x2={i * 10} y2="100"
            stroke="rgba(16,185,129,0.06)" strokeWidth="0.3" />
        ))}
        {MAP_REGIONS.map(r => {
          const color = getRiskColor(r.risk);
          const isSelected = selectedRegion === r.id;
          const size = 3 + (r.area / 50) * 4;
          return (
            <g key={r.id} onClick={() => onSelect(r.id)} style={{ cursor: "pointer" }}>
              <circle cx={r.x} cy={r.y} r={size + 4} fill={`${color}12`} stroke={`${color}25`} strokeWidth="0.5" />
              <circle cx={r.x} cy={r.y} r={size}
                fill={isSelected ? color : `${color}80`}
                stroke={color}
                strokeWidth={isSelected ? 0.8 : 0.4}
                style={{ filter: isSelected ? `drop-shadow(0 0 3px ${color})` : undefined }}
              />
              <circle cx={r.x} cy={r.y} r={1} fill="white" opacity="0.9" />
              <text x={r.x} y={r.y + size + 5} textAnchor="middle"
                fill="rgba(255,255,255,0.55)" fontSize="3" fontFamily="Golos Text">
                {r.name}
              </text>
            </g>
          );
        })}
        <text x="50" y="97" textAnchor="middle" fill="rgba(16,185,129,0.25)"
          fontSize="3" fontFamily="IBM Plex Mono" letterSpacing="2">
          ПОВОЛЖЬЕ · МОНИТОРИНГ
        </text>
      </svg>
    </div>
  );
}

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
  activeSection,
  animKey,
  selectedRegion,
  setSelectedRegion,
  selectedCrop,
  setSelectedCrop,
  setActiveSection,
}: PageContentProps) {
  const selectedRegionData = MAP_REGIONS.find(r => r.id === selectedRegion);
  const selectedForecast = FORECAST_DATA.find(f => f.crop === selectedCrop) || FORECAST_DATA[0];

  return (
    <main className="flex-1 overflow-y-auto p-4 lg:p-6 bg-grid" key={animKey}>

      {/* HOME */}
      {activeSection === "home" && (
        <div className="space-y-6 animate-fade-in">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Добро пожаловать</h1>
            <p className="text-muted-foreground mt-1">Мониторинг агропромышленного комплекса Поволжья</p>
          </div>
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
                <div className="text-2xl font-bold font-mono text-foreground">
                  {s.value}<span className="text-base text-muted-foreground">{s.suffix}</span>
                </div>
                <div className="text-xs text-muted-foreground mt-0.5">{s.label}</div>
              </div>
            ))}
          </div>
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
                <div key={i} className="bg-secondary/40 rounded-lg p-3 hover:bg-secondary/70 transition-colors">
                  <div className="text-xs text-muted-foreground mb-1 truncate">{f.crop}</div>
                  <div className="font-bold font-mono text-sm text-foreground">{f.forecastPrice.toLocaleString()} ₽</div>
                  <div className={`flex items-center gap-1 text-xs font-medium mt-1 ${f.trend === "up" ? "text-primary" : "text-destructive"}`}>
                    <Icon name={f.trend === "up" ? "TrendingUp" : "TrendingDown"} size={11} />
                    {f.change > 0 ? "+" : ""}{f.change}%
                  </div>
                  <div className="mt-2">
                    <div className="flex justify-between text-[10px] text-muted-foreground mb-1">
                      <span>Уверенность</span>
                      <span className="font-mono">{f.confidence}%</span>
                    </div>
                    <div className="h-1 bg-border rounded-full">
                      <div className="h-full rounded-full bg-primary transition-all"
                        style={{ width: `${f.confidence}%`, opacity: f.confidence / 100 * 0.7 + 0.3 }} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* FORECASTS */}
      {activeSection === "forecasts" && (
        <div className="space-y-6 animate-fade-in">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Прогнозы цен и урожайности</h1>
            <p className="text-muted-foreground mt-1">Долгосрочные модели с машинным обучением · горизонт 6 месяцев</p>
          </div>
          <div className="flex gap-2 flex-wrap">
            {CROPS.map(c => (
              <button key={c}
                onClick={() => setSelectedCrop(FORECAST_DATA.find(f => f.crop.includes(c))?.crop || c)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-all
                  ${selectedForecast.crop.includes(c)
                    ? "bg-primary/15 text-primary border-primary/30"
                    : "bg-secondary text-muted-foreground border-border hover:border-primary/30"
                  }`}>
                {c}
              </button>
            ))}
          </div>
          <div className="glass-card rounded-xl p-6">
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-6">
              <div>
                <h2 className="text-lg font-bold text-foreground">{selectedForecast.crop}</h2>
                <div className="flex items-center gap-3 mt-2 flex-wrap">
                  <div>
                    <div className="text-xs text-muted-foreground">Текущая цена</div>
                    <div className="text-xl font-bold font-mono text-foreground">{selectedForecast.currentPrice.toLocaleString()} ₽/т</div>
                  </div>
                  <Icon name="ArrowRight" size={16} className="text-muted-foreground mt-3" />
                  <div>
                    <div className="text-xs text-muted-foreground">Прогноз (июль)</div>
                    <div className={`text-xl font-bold font-mono ${selectedForecast.trend === "up" ? "text-primary" : "text-destructive"}`}>
                      {selectedForecast.forecastPrice.toLocaleString()} ₽/т
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex gap-3">
                <div className={`px-4 py-3 rounded-xl border text-center
                  ${selectedForecast.trend === "up" ? "bg-primary/10 border-primary/25 text-primary" : "bg-destructive/10 border-destructive/25 text-destructive"}`}>
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
              <div className="flex justify-between text-xs text-muted-foreground mb-2">
                <span>Уровень уверенности модели</span>
                <span className="font-mono font-medium text-accent">{selectedForecast.confidence}%</span>
              </div>
              <div className="h-2 bg-border rounded-full">
                <div className="h-full rounded-full bg-gradient-to-r from-accent/70 to-accent transition-all duration-700"
                  style={{ width: `${selectedForecast.confidence}%` }} />
              </div>
              <div className="flex justify-between text-[10px] text-muted-foreground mt-1">
                <span>Низкая</span><span>Средняя</span><span>Высокая</span>
              </div>
            </div>
            <div>
              <div className="flex items-center gap-4 mb-3">
                <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <span className="w-6 h-0.5 bg-primary inline-block" />Факт
                </span>
                <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <span className="w-6 border-t-2 border-dashed border-accent inline-block" />Прогноз
                </span>
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
                <thead>
                  <tr className="border-b border-border">
                    {["Культура", "Цена сейчас", "Прогноз", "Изменение", "Уверенность", "Урожайность"].map(h => (
                      <th key={h} className="text-left text-xs text-muted-foreground font-medium py-2 pr-4 last:pr-0">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {FORECAST_DATA.map((f, i) => (
                    <tr key={i} className="border-b border-border/40 hover:bg-secondary/30 transition-colors">
                      <td className="py-3 pr-4 font-medium text-foreground">{f.crop}</td>
                      <td className="py-3 pr-4 font-mono text-muted-foreground">{f.currentPrice.toLocaleString()}</td>
                      <td className="py-3 pr-4 font-mono font-bold">{f.forecastPrice.toLocaleString()} ₽</td>
                      <td className={`py-3 pr-4 font-mono font-bold ${f.trend === "up" ? "text-primary" : "text-destructive"}`}>
                        {f.change > 0 ? "+" : ""}{f.change}%
                      </td>
                      <td className="py-3 pr-4">
                        <div className="flex items-center gap-2">
                          <div className="w-16 h-1.5 bg-border rounded-full">
                            <div className="h-full rounded-full bg-accent" style={{ width: `${f.confidence}%` }} />
                          </div>
                          <span className="font-mono text-xs">{f.confidence}%</span>
                        </div>
                      </td>
                      <td className="py-3 font-mono text-xs">
                        <span className={f.yieldForecast > f.yield ? "text-primary" : "text-destructive"}>{f.yieldForecast} ц/га</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* MAP */}
      {activeSection === "map" && (
        <div className="space-y-6 animate-fade-in">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Интерактивная карта Поволжья</h1>
            <p className="text-muted-foreground mt-1">Мониторинг регионов · нажмите на точку для детальной информации</p>
          </div>
          <div className="grid lg:grid-cols-3 gap-4">
            <div className="lg:col-span-2 glass-card rounded-xl p-5 scan-animation">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Icon name="Satellite" size={14} className="text-primary" />
                  <span className="text-xs font-mono text-muted-foreground">СПУТНИКОВЫЙ МОНИТОРИНГ · 25.04.2026</span>
                </div>
                <div className="flex items-center gap-1.5 text-xs text-primary">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse-glow" />Online
                </div>
              </div>
              <MapSVG selectedRegion={selectedRegion} onSelect={setSelectedRegion} />
              <div className="flex gap-4 mt-4 flex-wrap">
                {[{ label: "Критический", color: "bg-destructive" }, { label: "Средний", color: "bg-accent" }, { label: "Низкий", color: "bg-primary" }].map(l => (
                  <span key={l.label} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <span className={`w-2.5 h-2.5 rounded-full ${l.color}`} />{l.label}
                  </span>
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
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">Индекс риска</span>
                      <span className="font-mono font-bold" style={{ color: getRiskColor(selectedRegionData.risk) }}>{selectedRegionData.risk}%</span>
                    </div>
                    <div className="h-2 bg-border rounded-full">
                      <div className="h-full rounded-full transition-all duration-500"
                        style={{ width: `${selectedRegionData.risk}%`, backgroundColor: getRiskColor(selectedRegionData.risk) }} />
                    </div>
                    <div className="flex justify-between text-xs mt-2">
                      <span className="text-muted-foreground">Уровень</span>
                      <span className="font-medium" style={{ color: getRiskColor(selectedRegionData.risk) }}>{getRiskLabel(selectedRegionData.risk)}</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">Площадь угодий</span>
                      <span className="font-mono">{selectedRegionData.area} тыс. га</span>
                    </div>
                  </div>
                </div>
              )}
              <div className="glass-card rounded-xl p-4">
                <div className="text-xs font-medium text-muted-foreground mb-3">ВСЕ РЕГИОНЫ</div>
                <div className="space-y-2">
                  {MAP_REGIONS.map(r => (
                    <button key={r.id} onClick={() => setSelectedRegion(r.id)}
                      className={`w-full flex items-center gap-2 p-2 rounded-lg text-xs transition-all ${selectedRegion === r.id ? "bg-secondary" : "hover:bg-secondary/50"}`}>
                      <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: getRiskColor(r.risk) }} />
                      <span className="text-foreground flex-1 text-left">{r.name}</span>
                      <span className="font-mono text-muted-foreground">{r.risk}%</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* RISKS */}
      {activeSection === "risks" && (
        <div className="space-y-6 animate-fade-in">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Оценка и мониторинг рисков</h1>
            <p className="text-muted-foreground mt-1">Риски по культурам и регионам · обновление раз в 6 часов</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {[
              { label: "Критических угроз", value: "2", color: "destructive", icon: "AlertOctagon" },
              { label: "Средних рисков", value: "2", color: "amber", icon: "AlertTriangle" },
              { label: "Под контролем", value: "4", color: "primary", icon: "CheckCircle2" },
            ].map((s, i) => (
              <div key={i} className={`glass-card rounded-xl p-4 border ${s.color === "destructive" ? "border-destructive/25" : s.color === "amber" ? "border-accent/25" : "border-primary/25"}`}>
                <div className={`w-8 h-8 rounded-lg mb-3 flex items-center justify-center ${s.color === "destructive" ? "bg-destructive/15 text-destructive" : s.color === "amber" ? "bg-accent/15 text-accent" : "bg-primary/15 text-primary"}`}>
                  <Icon name={s.icon as string} size={16} />
                </div>
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
                    <div>
                      <div className="font-medium text-sm">{r.region}</div>
                      <div className="text-xs text-muted-foreground">{r.type} · {r.crop}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="w-32">
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-muted-foreground">Риск</span>
                        <span className="font-mono font-bold" style={{ color: r.color }}>{r.risk}%</span>
                      </div>
                      <div className="h-2 bg-border rounded-full">
                        <div className="h-full rounded-full" style={{ width: `${r.risk}%`, backgroundColor: r.color }} />
                      </div>
                    </div>
                    <span className={`px-2 py-0.5 rounded-md text-xs font-medium ${r.level === "critical" ? "bg-destructive/20 text-destructive" : r.level === "high" ? "bg-destructive/15 text-destructive" : r.level === "medium" ? "bg-accent/20 text-accent" : "bg-primary/15 text-primary"}`}>
                      {r.level === "critical" ? "Крит." : r.level === "high" ? "Высокий" : r.level === "medium" ? "Средний" : "Низкий"}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ANALYTICS */}
      {activeSection === "analytics" && (
        <div className="space-y-6 animate-fade-in">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Дашборд аналитики и рекомендаций</h1>
            <p className="text-muted-foreground mt-1">Сводная аналитика и AI-рекомендации для принятия решений</p>
          </div>
          <div className="grid lg:grid-cols-2 gap-4">
            <div className="glass-card rounded-xl p-5">
              <div className="flex items-center gap-2 mb-4">
                <Icon name="BarChart3" size={16} className="text-primary" />
                <span className="font-semibold text-sm">Цены по культурам</span>
              </div>
              <div className="space-y-3">
                {FORECAST_DATA.map((f, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className="w-24 text-xs text-muted-foreground truncate">{f.crop.split(" ")[0]}</div>
                    <div className="flex-1 h-6 bg-border rounded relative overflow-hidden">
                      <div className="h-full rounded transition-all duration-700"
                        style={{ width: `${(f.forecastPrice / 32000) * 100}%`, background: f.trend === "up" ? "linear-gradient(90deg, hsla(152,60%,45%,0.6), hsla(152,60%,45%,0.3))" : "linear-gradient(90deg, hsla(0,72%,55%,0.6), hsla(0,72%,55%,0.3))" }} />
                      <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs font-mono font-bold">{f.forecastPrice.toLocaleString()} ₽</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="glass-card rounded-xl p-5">
              <div className="flex items-center gap-2 mb-4">
                <Icon name="Lightbulb" size={16} className="text-accent" />
                <span className="font-semibold text-sm">AI-рекомендации</span>
                <span className="ml-auto px-2 py-0.5 text-[10px] font-mono bg-accent/15 text-accent rounded">GPT-4o</span>
              </div>
              <div className="space-y-3">
                {[
                  { icon: "TrendingUp", color: "primary", title: "Увеличить долю пшеницы", desc: "Прогноз +11.3% к июлю. Оптимальное окно для наращивания позиций." },
                  { icon: "AlertTriangle", color: "amber", title: "Хеджировать риски подсолнечника", desc: "Цена снизится на 8.4%. Рекомендуется форвардный контракт." },
                  { icon: "Droplets", color: "cyan", title: "Дополнительный полив — Волгоград", desc: "ИЗМ влажности критический. Риск снижения урожайности 25%." },
                  { icon: "Calendar", color: "primary", title: "Оптимальные сроки сева", desc: "Кукуруза: сев рекомендован 1–10 мая с учётом прогноза осадков." },
                ].map((r, i) => (
                  <div key={i} className="flex gap-3 p-3 rounded-lg bg-secondary/30">
                    <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${r.color === "primary" ? "bg-primary/20 text-primary" : r.color === "amber" ? "bg-accent/20 text-accent" : "bg-cyan-500/20 text-cyan-400"}`}>
                      <Icon name={r.icon as string} size={13} />
                    </div>
                    <div>
                      <div className="text-sm font-medium text-foreground">{r.title}</div>
                      <div className="text-xs text-muted-foreground mt-0.5">{r.desc}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div className="glass-card rounded-xl p-5">
            <div className="flex items-center gap-2 mb-4">
              <Icon name="Activity" size={16} className="text-primary" />
              <span className="font-semibold text-sm">Метрики эффективности</span>
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

      {/* ALERTS */}
      {activeSection === "alerts" && (
        <div className="space-y-6 animate-fade-in">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Центр уведомлений</h1>
            <p className="text-muted-foreground mt-1">Критические события и системные оповещения</p>
          </div>
          <div className="flex gap-2">
            {["Все", "Критические", "Предупреждения", "Инфо"].map(f => (
              <button key={f} className={`px-3 py-1.5 text-xs rounded-lg border transition-all ${f === "Все" ? "bg-primary/15 text-primary border-primary/30" : "bg-secondary text-muted-foreground border-border hover:border-primary/30"}`}>{f}</button>
            ))}
          </div>
          <div className="space-y-3">
            {ALERTS.map(a => (
              <div key={a.id} className={`glass-card rounded-xl p-4 border flex items-start gap-4 hover:scale-[1.005] transition-all
                ${a.type === "critical" ? "border-destructive/30" : a.type === "warning" ? "border-accent/25" : "border-border"}`}>
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0
                  ${a.type === "critical" ? "bg-destructive/20 text-destructive" : a.type === "warning" ? "bg-accent/20 text-accent" : "bg-primary/20 text-primary"}`}>
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

      {/* PROFILE */}
      {activeSection === "profile" && (
        <div className="space-y-6 animate-fade-in">
          <h1 className="text-2xl font-bold text-foreground">Личный кабинет</h1>
          <div className="grid lg:grid-cols-3 gap-4">
            <div className="glass-card rounded-xl p-6 text-center">
              <div className="w-20 h-20 mx-auto rounded-full bg-gradient-to-br from-primary/60 to-accent/60 flex items-center justify-center text-2xl font-bold text-white mb-4">АВ</div>
              <div className="font-bold text-lg">Алексей Воронов</div>
              <div className="text-sm text-muted-foreground">Агроном-аналитик</div>
              <div className="text-xs text-muted-foreground font-mono mt-1">a.voronov@agrovolga.ru</div>
              <div className="mt-4">
                <span className="px-3 py-1 text-xs bg-primary/15 text-primary rounded-full border border-primary/25">PRO план</span>
              </div>
            </div>
            <div className="lg:col-span-2 glass-card rounded-xl p-6">
              <div className="font-semibold mb-4">Настройки профиля</div>
              <div className="space-y-3">
                {[
                  { label: "Имя", value: "Алексей Воронов" },
                  { label: "Email", value: "a.voronov@agrovolga.ru" },
                  { label: "Организация", value: "АгроВолга Холдинг" },
                  { label: "Регионы мониторинга", value: "Самарская, Саратовская, Волгоградская" },
                ].map((f, i) => (
                  <div key={i} className="flex gap-4 items-center p-3 bg-secondary/30 rounded-lg">
                    <div className="text-xs text-muted-foreground w-32 shrink-0">{f.label}</div>
                    <div className="text-sm font-medium flex-1">{f.value}</div>
                    <Icon name="Pencil" size={13} className="text-muted-foreground" />
                  </div>
                ))}
              </div>
              <button className="mt-4 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors">
                Сохранить изменения
              </button>
            </div>
          </div>
        </div>
      )}

      {/* INTEGRATIONS */}
      {activeSection === "integrations" && (
        <div className="space-y-6 animate-fade-in">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Внешние сервисы и API</h1>
            <p className="text-muted-foreground mt-1">Подключение источников данных и интеграций</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              { name: "Росгидромет API", desc: "Метеоданные в реальном времени", status: "connected", icon: "Cloud" },
              { name: "Московская биржа", desc: "Котировки сырьевых товаров", status: "connected", icon: "BarChart2" },
              { name: "ФГИС Зерно", desc: "Реестр зерна и сертификаты", status: "connected", icon: "Database" },
              { name: "Sentinel-2", desc: "Спутниковые снимки NDVI", status: "pending", icon: "Satellite" },
              { name: "1С:Агропредприятие", desc: "ERP интеграция", status: "disconnected", icon: "Server" },
              { name: "Telegram Bot", desc: "Push-уведомления в мессенджер", status: "disconnected", icon: "MessageCircle" },
            ].map((s, i) => (
              <div key={i} className="glass-card rounded-xl p-5">
                <div className="flex items-start justify-between mb-3">
                  <div className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center">
                    <Icon name={s.icon as string} size={18} className="text-foreground" />
                  </div>
                  <span className={`px-2 py-0.5 text-[10px] font-mono rounded uppercase ${s.status === "connected" ? "bg-primary/15 text-primary" : s.status === "pending" ? "bg-accent/15 text-accent" : "bg-secondary text-muted-foreground"}`}>
                    {s.status === "connected" ? "✓ подключено" : s.status === "pending" ? "⋯ ожидание" : "отключено"}
                  </span>
                </div>
                <div className="font-semibold text-sm">{s.name}</div>
                <div className="text-xs text-muted-foreground mt-1">{s.desc}</div>
                <button className={`mt-4 w-full py-1.5 text-xs rounded-lg font-medium border transition-all
                  ${s.status === "connected" ? "border-border text-muted-foreground hover:border-destructive/50 hover:text-destructive" : "border-primary/30 text-primary bg-primary/10 hover:bg-primary/20"}`}>
                  {s.status === "connected" ? "Настроить" : "Подключить"}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

    </main>
  );
}
