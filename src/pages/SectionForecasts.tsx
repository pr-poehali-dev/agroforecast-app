import { lazy, Suspense, useState, useEffect } from "react";
import Icon from "@/components/ui/icon";
import {
  CROPS, FORECAST_DATA, RISK_DATA, MAP_REGIONS,
  MARKET_SOURCES, EXPORT_DATA,
  getRiskColor, getRiskLabel,
} from "./data";
import { PriceChart, SupplyChart } from "./PageWidgets";

const VolgaMap = lazy(() => import("@/components/VolgaMap"));

const AI_URL = "https://functions.poehali.dev/3f769f53-b21b-473e-91b9-b7a755123928";

const CROP_REGION_MAP: Record<string, string> = {
  "Пшеница озимая": "samara",
  "Подсолнечник": "samara",
  "Кукуруза": "volgograd",
  "Ячмень яровой": "tatarstan",
  "Рожь": "penza",
};

interface AiTableRow {
  crop: string;
  currentPrice: number;
  forecastPrice: number;
  change: number;
  confidence: number;
  trend: "up" | "down";
  yieldForecast: number;
  yield: number;
}

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
  const selectedRegionData = MAP_REGIONS.find(r => r.id === selectedRegion);

  // AI data for single selected crop detail card
  const [aiSingle, setAiSingle] = useState<{ currentPrice: number; forecastPrice: number; change: number; confidence: number; trend: "up" | "down"; yieldForecast: number } | null>(null);
  const [aiSingleLoading, setAiSingleLoading] = useState(false);

  // AI data for summary table
  const [aiTable, setAiTable] = useState<AiTableRow[]>([]);
  const [aiTableLoading, setAiTableLoading] = useState(false);

  const cropFull = FORECAST_DATA.find(f => f.crop.includes(selectedCrop) || selectedCrop.includes(f.crop.split(" ")[0]))?.crop
    || selectedCrop;
  const region = CROP_REGION_MAP[cropFull] || "samara";

  // Load single crop AI forecast when section or crop changes
  useEffect(() => {
    if (activeSection !== "forecasts") return;
    const abort = new AbortController();
    setAiSingleLoading(true);
    fetch(`${AI_URL}?crop=${encodeURIComponent(cropFull)}&region=${region}&horizon=3`, { signal: abort.signal })
      .then(r => r.json())
      .then(d => {
        const pf = d.price_forecast;
        const yf = d.yield_forecast;
        if (!pf) return;
        setAiSingle({
          currentPrice: Math.round(pf.price_rub_t / (1 + pf.change_pct / 100)),
          forecastPrice: pf.price_rub_t,
          change: pf.change_pct,
          confidence: pf.confidence_pct,
          trend: pf.trend,
          yieldForecast: yf?.yield_cha ?? 0,
        });
        setAiSingleLoading(false);
      })
      .catch(() => setAiSingleLoading(false));
    return () => abort.abort();
  }, [activeSection, cropFull, region]);

  // Load all crops for summary table
  useEffect(() => {
    if (activeSection !== "forecasts") return;
    const abort = new AbortController();
    setAiTableLoading(true);
    Promise.all(
      FORECAST_DATA.map(f =>
        fetch(`${AI_URL}?crop=${encodeURIComponent(f.crop)}&region=${CROP_REGION_MAP[f.crop] || "samara"}&horizon=3`, { signal: abort.signal })
          .then(r => r.json())
          .then(d => ({
            crop: f.crop,
            currentPrice: d.price_forecast ? Math.round(d.price_forecast.price_rub_t / (1 + d.price_forecast.change_pct / 100)) : f.currentPrice,
            forecastPrice: d.price_forecast?.price_rub_t ?? f.forecastPrice,
            change: d.price_forecast?.change_pct ?? f.change,
            confidence: d.price_forecast?.confidence_pct ?? f.confidence,
            trend: (d.price_forecast?.trend ?? f.trend) as "up" | "down",
            yieldForecast: d.yield_forecast?.yield_cha ?? f.yieldForecast,
            yield: d.yield_forecast?.yield_low ?? f.yield,
          }))
          .catch(() => ({ ...f, trend: f.trend as "up" | "down" }))
      )
    )
      .then(rows => { setAiTable(rows); setAiTableLoading(false); })
      .catch(() => setAiTableLoading(false));
    return () => abort.abort();
  }, [activeSection]);

  // Merge AI data into selected forecast display
  const baseForecast = FORECAST_DATA.find(f => f.crop === cropFull) || FORECAST_DATA[0];
  const selectedForecast = aiSingle
    ? { ...baseForecast, ...aiSingle }
    : baseForecast;

  const tableData: AiTableRow[] = aiTable.length > 0 ? aiTable : FORECAST_DATA.map(f => ({ ...f, trend: f.trend as "up" | "down" }));

  return (
    <>
      {/* ── FORECASTS ── */}
      {activeSection === "forecasts" && (
        <div className="space-y-6 animate-fade-in">

          {/* ── Hero-шапка ── */}
          <div className="hero-gradient rounded-2xl p-5 sm:p-6 relative overflow-hidden shadow-md">
            <div className="hero-gradient-overlay absolute inset-0" />
            <div className="bg-dots absolute inset-0 opacity-15" />
            <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 mb-1.5">
                  <Icon name="TrendingUp" size={14} className="text-white/80" />
                  <span className="text-white/70 text-xs font-mono uppercase tracking-widest">Прогнозирование цен</span>
                </div>
                <h1 className="font-heading font-black text-2xl sm:text-3xl text-white leading-tight">
                  Прогнозы цен<br />и <span className="gold-text">урожайности</span>
                </h1>
                <p className="text-white/65 text-sm mt-1 font-body">ARIMA + LSTM · горизонт 3–12 месяцев · апрель 2026</p>
              </div>
              <div className="flex gap-2 shrink-0">
                {[
                  { v: "94.7%", l: "Точность" },
                  { v: "12", l: "культур" },
                ].map((s, i) => (
                  <div key={i} className="bg-white/15 border border-white/25 rounded-xl px-4 py-3 text-center">
                    <div className="font-mono font-black text-xl text-white">{s.v}</div>
                    <div className="text-white/60 text-[10px] mt-0.5">{s.l}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* ── Фильтр культур ── */}
          <div className="flex gap-2 flex-wrap">
            {CROPS.map(c => {
              const isActive = selectedForecast.crop.includes(c);
              return (
                <button key={c} onClick={() => setSelectedCrop(FORECAST_DATA.find(f => f.crop.includes(c))?.crop || c)}
                  className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-sm font-semibold border transition-all shadow-sm active:scale-[0.97]
                    ${isActive
                      ? "bg-primary text-white border-primary shadow-md shadow-primary/20"
                      : "bg-white text-muted-foreground border-border hover:border-primary/40 hover:text-primary"}`}>
                  <Icon name="Wheat" size={12} className={isActive ? "text-white/80" : "text-muted-foreground"} />
                  {c}
                </button>
              );
            })}
          </div>

          {/* ── Карточка прогноза ── */}
          <div className={`glass-card rounded-2xl overflow-hidden transition-opacity ${aiSingleLoading ? "opacity-70" : ""}`}>
            {/* Цветной акцент сверху */}
            <div className={`h-1 w-full ${selectedForecast.trend === "up" ? "bg-gradient-to-r from-primary to-primary/60" : "bg-gradient-to-r from-destructive to-destructive/60"}`} />
            <div className="p-6">
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-6">
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-8 h-8 rounded-lg bg-primary/15 flex items-center justify-center">
                      <Icon name="Wheat" size={15} className="text-primary" />
                    </div>
                    <h2 className="font-heading font-bold text-lg text-foreground">{selectedForecast.crop}</h2>
                    {aiSingleLoading ? (
                      <span className="text-[10px] text-muted-foreground animate-pulse flex items-center gap-1 bg-secondary px-2 py-0.5 rounded-full"><Icon name="Loader" size={9} />считаю...</span>
                    ) : aiSingle ? (
                      <span className="text-[10px] text-primary bg-primary/10 border border-primary/20 px-2 py-0.5 rounded-full font-mono flex items-center gap-1"><Icon name="Brain" size={9} />AI · live</span>
                    ) : null}
                  </div>
                  <div className="flex items-center gap-4 flex-wrap">
                    <div className="bg-background rounded-xl px-4 py-3 border border-border">
                      <div className="text-[11px] text-muted-foreground mb-1">Текущая цена</div>
                      <div className="font-mono font-black text-2xl text-foreground">{selectedForecast.currentPrice.toLocaleString()} <span className="text-sm font-normal text-muted-foreground">₽/т</span></div>
                    </div>
                    <div className="flex items-center">
                      <Icon name="ArrowRight" size={20} className="text-muted-foreground" />
                    </div>
                    <div className={`rounded-xl px-4 py-3 border ${selectedForecast.trend === "up" ? "bg-primary/8 border-primary/25" : "bg-destructive/8 border-destructive/25"}`}>
                      <div className="text-[11px] text-muted-foreground mb-1">Прогноз AI (+3 мес)</div>
                      <div className={`font-mono font-black text-2xl ${selectedForecast.trend === "up" ? "text-primary" : "text-destructive"}`}>{selectedForecast.forecastPrice.toLocaleString()} <span className="text-sm font-normal">₽/т</span></div>
                    </div>
                  </div>
                </div>
                <div className="flex gap-3 shrink-0">
                  <div className={`px-5 py-4 rounded-2xl border-2 text-center shadow-sm
                    ${selectedForecast.trend === "up" ? "bg-primary/8 border-primary/30 text-primary" : "bg-destructive/8 border-destructive/30 text-destructive"}`}>
                    <div className="flex items-center justify-center gap-1 mb-1">
                      <Icon name={selectedForecast.trend === "up" ? "TrendingUp" : "TrendingDown"} size={14} />
                    </div>
                    <div className="text-2xl font-black font-mono">{selectedForecast.change > 0 ? "+" : ""}{typeof selectedForecast.change === "number" ? selectedForecast.change.toFixed(1) : selectedForecast.change}%</div>
                    <div className="text-[10px] opacity-70 mt-0.5">изменение</div>
                  </div>
                  <div className="px-5 py-4 rounded-2xl border-2 border-accent/30 bg-accent/8 text-center shadow-sm">
                    <div className="flex items-center justify-center gap-1 mb-1">
                      <Icon name="Brain" size={14} className="text-accent" />
                    </div>
                    <div className="text-2xl font-black font-mono text-accent">{typeof selectedForecast.confidence === "number" ? selectedForecast.confidence.toFixed(0) : selectedForecast.confidence}%</div>
                    <div className="text-[10px] text-muted-foreground mt-0.5">уверенность</div>
                  </div>
                </div>
              </div>

              {/* Прогресс уверенности */}
              <div className="mb-6 bg-background rounded-xl p-4 border border-border">
                <div className="flex justify-between text-xs text-muted-foreground mb-2">
                  <span className="flex items-center gap-1"><Icon name="Brain" size={11} />Уверенность модели ARIMA + LSTM</span>
                  <span className="font-mono font-bold text-accent">{typeof selectedForecast.confidence === "number" ? selectedForecast.confidence.toFixed(0) : selectedForecast.confidence}%</span>
                </div>
                <div className="h-2.5 bg-border rounded-full overflow-hidden">
                  <div className="h-full rounded-full progress-bar-gold transition-all duration-700" style={{ width: `${selectedForecast.confidence}%` }} />
                </div>
                <div className="flex justify-between text-[10px] text-muted-foreground mt-1.5"><span>Низкая</span><span>Средняя</span><span>Высокая</span></div>
              </div>

              {/* График */}
              <div>
                <div className="flex items-center gap-4 mb-3">
                  <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <span className="w-6 h-0.5 bg-primary inline-block rounded" />Факт (2025)
                  </span>
                  <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <span className="w-6 border-t-2 border-dashed border-accent inline-block" />Прогноз AI
                  </span>
                </div>
                <PriceChart />
              </div>
            </div>
          </div>

          {/* ── Сводная таблица ── */}
          <div className="glass-card rounded-2xl overflow-hidden">
            <div className="px-6 pt-5 pb-4 border-b border-border flex items-center justify-between flex-wrap gap-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-primary/15 flex items-center justify-center">
                  <Icon name="Table" size={15} className="text-primary" />
                </div>
                <div>
                  <div className="font-heading font-bold text-sm text-foreground">Сводная таблица прогнозов</div>
                  <div className="text-[11px] text-muted-foreground">все культуры · горизонт +3 мес</div>
                </div>
                {aiTableLoading ? (
                  <span className="text-[10px] text-muted-foreground animate-pulse flex items-center gap-1 bg-secondary px-2 py-0.5 rounded-full ml-1"><Icon name="Loader" size={9} />обновляю...</span>
                ) : aiTable.length > 0 ? (
                  <span className="text-[10px] text-primary bg-primary/10 border border-primary/20 px-2 py-0.5 rounded-full font-mono flex items-center gap-1 ml-1"><Icon name="Brain" size={9} />AI · live</span>
                ) : null}
              </div>
            </div>
            <div className={`overflow-x-auto transition-opacity ${aiTableLoading ? "opacity-60" : ""}`}>
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-secondary/40">
                    {["Культура", "Цена сейчас", "Прогноз AI", "Изменение", "Уверенность", "Урожайность"].map(h => (
                      <th key={h} className="text-left text-[11px] text-muted-foreground font-semibold py-3 px-4 first:pl-6 last:pr-6 uppercase tracking-wide">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {tableData.map((f, i) => (
                    <tr key={i}
                      className={`border-b border-border/50 hover:bg-primary/4 transition-colors cursor-pointer group ${i % 2 === 0 ? "" : "bg-secondary/20"}`}
                      onClick={() => setSelectedCrop(f.crop)}>
                      <td className="py-3.5 px-4 pl-6">
                        <div className="flex items-center gap-2">
                          <span className={`w-1 h-8 rounded-full ${f.trend === "up" ? "bg-primary" : "bg-destructive"} opacity-0 group-hover:opacity-100 transition-opacity`} />
                          <span className="font-semibold text-foreground font-body">{f.crop}</span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 font-mono text-muted-foreground text-xs">{f.currentPrice.toLocaleString()} ₽</td>
                      <td className="py-3.5 px-4 font-mono font-bold text-foreground">{f.forecastPrice.toLocaleString()} ₽</td>
                      <td className="py-3.5 px-4">
                        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-bold
                          ${f.trend === "up" ? "bg-primary/12 text-primary" : "bg-destructive/12 text-destructive"}`}>
                          <Icon name={f.trend === "up" ? "TrendingUp" : "TrendingDown"} size={10} />
                          {f.change > 0 ? "+" : ""}{typeof f.change === "number" ? f.change.toFixed(1) : f.change}%
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2">
                          <div className="w-16 h-1.5 bg-border rounded-full overflow-hidden">
                            <div className="h-full progress-bar-gold rounded-full" style={{ width: `${f.confidence}%` }} />
                          </div>
                          <span className="font-mono text-xs text-muted-foreground">{typeof f.confidence === "number" ? f.confidence.toFixed(0) : f.confidence}%</span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 pr-6">
                        <span className={`font-mono text-xs font-bold ${f.yieldForecast > f.yield ? "text-primary" : "text-destructive"}`}>
                          {typeof f.yieldForecast === "number" ? f.yieldForecast.toFixed(1) : f.yieldForecast} ц/га
                        </span>
                      </td>
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
          <div className="flex items-start justify-between flex-wrap gap-3">
            <div>
              <h1 className="font-heading font-black text-2xl text-foreground">Карта урожайности Поволжья</h1>
              <p className="text-muted-foreground mt-1 text-sm font-body">Спутниковые данные Sentinel-2 · NDVI · метеоусловия · нажмите регион для деталей</p>
            </div>
            <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/25 text-primary text-xs font-mono">
              <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse-glow" />LIVE · Sentinel-2
            </span>
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
            <h1 className="font-heading font-black text-2xl text-foreground">Мониторинг спроса и предложения</h1>
            <p className="text-muted-foreground mt-1 text-sm font-body">Оптовые рынки · биржи · экспорт/импорт · прогноз баланса</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {MARKET_SOURCES.map((s, i) => (
              <div key={i} className="kpi-card rounded-xl p-4">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-9 h-9 rounded-xl bg-primary/12 flex items-center justify-center"><Icon name={s.icon as string} size={16} className="text-primary" /></div>
                  <span className="text-sm font-semibold font-heading text-foreground">{s.name}</span>
                </div>
                <div className="text-2xl font-black font-mono text-foreground">{(s.volume / 1000).toFixed(0)} <span className="text-sm font-normal text-muted-foreground">тыс. т</span></div>
                <div className={`flex items-center gap-1 text-xs font-bold mt-1.5 ${s.trend === "up" ? "text-primary" : "text-destructive"}`}>
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
            <h1 className="font-heading font-black text-2xl text-foreground">Оценка и мониторинг рисков</h1>
            <p className="text-muted-foreground mt-1 text-sm font-body">Засуха · заморозки · вредители · переувлажнение · рекомендации по минимизации</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {[
              { label: "Критических угроз", value: "2", color: "destructive", icon: "AlertOctagon" },
              { label: "Средних рисков", value: "2", color: "amber", icon: "AlertTriangle" },
              { label: "Под контролем", value: "4", color: "primary", icon: "CheckCircle2" },
            ].map((s, i) => (
              <div key={i} className={`kpi-card rounded-xl p-5 border-l-4 ${s.color === "destructive" ? "border-l-destructive" : s.color === "amber" ? "border-l-accent" : "border-l-primary"}`}>
                <div className={`w-10 h-10 rounded-xl mb-3 flex items-center justify-center ${s.color === "destructive" ? "bg-destructive/15 text-destructive" : s.color === "amber" ? "bg-accent/15 text-accent" : "bg-primary/15 text-primary"}`}><Icon name={s.icon as string} size={18} /></div>
                <div className="text-3xl font-black font-mono">{s.value}</div>
                <div className="text-xs text-muted-foreground mt-1 font-body">{s.label}</div>
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