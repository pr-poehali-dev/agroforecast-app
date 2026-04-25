import { lazy, Suspense } from "react";
import Icon from "@/components/ui/icon";
import {
  CROPS, FORECAST_DATA, RISK_DATA, MAP_REGIONS,
  MARKET_SOURCES, EXPORT_DATA,
  getRiskColor, getRiskLabel,
} from "./data";
import { PriceChart, SupplyChart } from "./PageWidgets";

const VolgaMap = lazy(() => import("@/components/VolgaMap"));

interface SectionForecastsProps {
  activeSection: string;
  selectedRegion: string | null;
  setSelectedRegion: (id: string) => void;
  selectedCrop: string;
  setSelectedCrop: (crop: string) => void;
}

export default function SectionForecasts({
  activeSection, selectedRegion, setSelectedRegion, selectedCrop, setSelectedCrop,
}: SectionForecastsProps) {
  const selectedForecast = FORECAST_DATA.find(f => f.crop === selectedCrop) || FORECAST_DATA[0];
  const selectedRegionData = MAP_REGIONS.find(r => r.id === selectedRegion);

  return (
    <>
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
    </>
  );
}
