import { useState, useEffect } from "react";
import Icon from "@/components/ui/icon";
import { CROPS, FORECAST_DATA } from "./data";
import { PriceChart } from "./PageWidgets";
import { AiSingle, AiTableRow } from "./ForecastsTypes";

// ── Live-prices backend ────────────────────────────────────────────────────
const PRICES_URL = "https://functions.poehali.dev/52189484-0746-4acc-8694-949dc8ee7f62";

// ── Types ──────────────────────────────────────────────────────────────────
interface LivePrice {
  crop: string;
  price: number;
  price_prev: number;
  week_change: number;
  week_change_pct: number;
  trend: "up" | "down";
  region: string;
  quality: string;
  source: string;
  fetched_at: string;
  is_fallback: boolean;
}

interface PricesResponse {
  prices: LivePrice[];
  updated_at: string;
  any_live: boolean;
  source_status: Record<string, string>;
  from_cache?: boolean;
  cache_age_min?: number;
}

// ── Helper: format timestamp in Russian ───────────────────────────────────
function fmtRuDateTime(iso: string): string {
  try {
    const d = new Date(iso + (iso.endsWith("Z") ? "" : "Z"));
    const months = ["янв","фев","мар","апр","май","июн","июл","авг","сен","окт","ноя","дек"];
    const dd  = d.getUTCDate();
    const mon = months[d.getUTCMonth()];
    const hh  = String(d.getUTCHours()).padStart(2, "0");
    const mm  = String(d.getUTCMinutes()).padStart(2, "0");
    return `${dd} ${mon} ${d.getUTCFullYear()}, ${hh}:${mm}`;
  } catch {
    return iso;
  }
}

// ── Props ──────────────────────────────────────────────────────────────────
interface ForecastsSectionProps {
  selectedCrop: string;
  setSelectedCrop: (crop: string) => void;
  aiSingle: AiSingle | null;
  aiSingleLoading: boolean;
  aiTable: AiTableRow[];
  aiTableLoading: boolean;
}

// ── Component ──────────────────────────────────────────────────────────────
export default function ForecastsSection({
  selectedCrop, setSelectedCrop,
  aiSingle, aiSingleLoading,
  aiTable, aiTableLoading,
}: ForecastsSectionProps) {

  // Live prices state
  const [pricesData,    setPricesData]    = useState<PricesResponse | null>(null);
  const [pricesLoading, setPricesLoading] = useState(true);
  const [pricesError,   setPricesError]   = useState(false);

  useEffect(() => {
    let cancelled = false;
    setPricesLoading(true);
    setPricesError(false);
    fetch(PRICES_URL)
      .then(r => r.json())
      .then((d: PricesResponse) => {
        if (!cancelled) { setPricesData(d); setPricesLoading(false); }
      })
      .catch(() => {
        if (!cancelled) { setPricesError(true); setPricesLoading(false); }
      });
    return () => { cancelled = true; };
  }, []);

  // Build a map crop → live price for quick lookup
  const livePriceMap: Record<string, LivePrice> = {};
  if (pricesData?.prices) {
    pricesData.prices.forEach(p => { livePriceMap[p.crop] = p; });
  }

  // Merge live prices into FORECAST_DATA for the forecast card + table
  const mergedForecast = FORECAST_DATA.map(f => {
    const lp = livePriceMap[f.crop];
    return lp ? { ...f, currentPrice: lp.price } : f;
  });

  const cropFull = mergedForecast.find(f => f.crop.includes(selectedCrop) || selectedCrop.includes(f.crop.split(" ")[0]))?.crop || selectedCrop;
  const baseForecast = mergedForecast.find(f => f.crop === cropFull) || mergedForecast[0];
  const selectedForecast = aiSingle ? { ...baseForecast, ...aiSingle } : baseForecast;
  const tableData: AiTableRow[] = aiTable.length > 0
    ? aiTable.map(row => {
        const lp = livePriceMap[row.crop];
        return lp ? { ...row, currentPrice: lp.price } : row;
      })
    : mergedForecast.map(f => ({ ...f, trend: f.trend as "up" | "down" }));

  // Determine how many live (non-fallback) sources succeeded
  const liveCount = pricesData?.prices.filter(p => !p.is_fallback).length ?? 0;

  return (
    <div className="space-y-6 animate-fade-in">

      {/* ── Hero ── */}
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
              { v: "12",    l: "культур"  },
            ].map((s, i) => (
              <div key={i} className="bg-white/15 border border-white/25 rounded-xl px-4 py-3 text-center">
                <div className="font-mono font-black text-xl text-white">{s.v}</div>
                <div className="text-white/60 text-[10px] mt-0.5">{s.l}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Актуальные котировки ── */}
      <div className="glass-card rounded-2xl overflow-hidden">
        {/* Header */}
        <div className="px-5 py-3.5 border-b border-border flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center">
              <Icon name="BarChart2" size={14} className="text-primary" />
            </div>
            <span className="font-heading font-semibold text-sm text-foreground">Актуальные котировки</span>
            {/* Live / cache badge */}
            {!pricesLoading && pricesData && (
              liveCount > 0
                ? <span className="flex items-center gap-1 text-[10px] text-primary bg-primary/10 border border-primary/20 px-2 py-0.5 rounded-full font-mono">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                    LIVE · {liveCount} источн.
                  </span>
                : <span className="flex items-center gap-1 text-[10px] text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full font-mono">
                    <Icon name="Clock" size={9} />
                    Данные из кэша
                  </span>
            )}
            {pricesLoading && (
              <span className="flex items-center gap-1 text-[10px] text-muted-foreground animate-pulse bg-secondary px-2 py-0.5 rounded-full">
                <Icon name="Loader2" size={9} className="animate-spin" />загрузка...
              </span>
            )}
          </div>

          {/* Timestamp */}
          {!pricesLoading && pricesData?.updated_at && (
            <span className="text-[10px] text-muted-foreground font-mono flex items-center gap-1">
              <Icon name="RefreshCw" size={9} />
              Данные обновлены: {fmtRuDateTime(pricesData.updated_at)}
            </span>
          )}
        </div>

        {/* Prices ticker grid */}
        <div className="p-4">
          {pricesLoading ? (
            /* Skeleton */
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="rounded-xl bg-secondary/60 animate-pulse h-20" />
              ))}
            </div>
          ) : pricesError ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground px-2 py-3">
              <Icon name="WifiOff" size={14} className="text-red-400" />
              Не удалось загрузить котировки — показаны данные из НТБ (апрель 2026)
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
              {(pricesData?.prices ?? []).map(p => {
                const isUp      = p.trend === "up";
                const changeAbs = Math.abs(p.week_change);
                const changePct = Math.abs(p.week_change_pct);
                const isSel     = cropFull === p.crop;

                return (
                  <button
                    key={p.crop}
                    onClick={() => setSelectedCrop(p.crop)}
                    className={`relative text-left rounded-xl border p-3 transition-all hover:scale-[1.02] hover:shadow-sm active:scale-[0.98]
                      ${isSel
                        ? "border-primary/40 bg-primary/5 shadow-sm ring-1 ring-primary/15"
                        : "border-border bg-background hover:border-primary/25"}`}
                  >
                    {/* Source badge */}
                    <div className="flex items-center justify-between mb-1.5">
                      <span className={`text-[9px] font-mono px-1.5 py-0.5 rounded-full
                        ${p.is_fallback
                          ? "bg-amber-50 text-amber-600 border border-amber-200"
                          : "bg-primary/10 text-primary border border-primary/20"}`}>
                        {p.source.replace(" (кэш)", "")}
                      </span>
                      {p.is_fallback && (
                        <Icon name="Clock" size={9} className="text-amber-400" />
                      )}
                    </div>

                    {/* Crop name */}
                    <p className="text-[11px] font-semibold text-foreground leading-tight mb-1.5">
                      {p.crop}
                    </p>

                    {/* Price */}
                    <p className="font-mono font-black text-base text-foreground leading-none">
                      {p.price.toLocaleString("ru")}
                      <span className="text-[10px] font-normal text-muted-foreground ml-0.5">₽/т</span>
                    </p>

                    {/* Weekly change */}
                    <div className={`flex items-center gap-1 mt-1.5 text-[10px] font-mono font-semibold
                      ${isUp ? "text-emerald-600" : "text-red-500"}`}>
                      <Icon name={isUp ? "TrendingUp" : "TrendingDown"} size={10} />
                      {isUp ? "+" : "−"}{changeAbs.toLocaleString("ru")} ₽
                      <span className="opacity-70">({isUp ? "+" : "−"}{changePct.toFixed(1)}%)</span>
                    </div>
                  </button>
                );
              })}
            </div>
          )}

          {/* Source status footer */}
          {!pricesLoading && pricesData?.source_status && (
            <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t border-border/50">
              {Object.entries(pricesData.source_status).map(([src, st]) => (
                <span key={src}
                  className={`flex items-center gap-1 text-[9px] font-mono px-2 py-0.5 rounded-full border
                    ${st === "ok"
                      ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                      : st === "no_data"
                        ? "bg-amber-50 text-amber-600 border-amber-200"
                        : "bg-red-50 text-red-500 border-red-200"}`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${st === "ok" ? "bg-emerald-500" : st === "no_data" ? "bg-amber-400" : "bg-red-400"}`} />
                  {src}: {st === "ok" ? "ок" : st === "no_data" ? "нет данных" : "недоступен"}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Фильтр культур ── */}
      <div className="flex gap-2 flex-wrap">
        {CROPS.map(c => {
          const isActive = selectedForecast.crop.includes(c);
          return (
            <button key={c}
              onClick={() => setSelectedCrop(mergedForecast.find(f => f.crop.includes(c))?.crop || c)}
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
                  <span className="text-[10px] text-muted-foreground animate-pulse flex items-center gap-1 bg-secondary px-2 py-0.5 rounded-full">
                    <Icon name="Loader" size={9} />считаю...
                  </span>
                ) : aiSingle ? (
                  <span className="text-[10px] text-primary bg-primary/10 border border-primary/20 px-2 py-0.5 rounded-full font-mono flex items-center gap-1">
                    <Icon name="Brain" size={9} />AI · live
                  </span>
                ) : null}
                {/* Live price indicator on forecast card */}
                {livePriceMap[selectedForecast.crop] && !livePriceMap[selectedForecast.crop].is_fallback && (
                  <span className="text-[10px] text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full font-mono flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    live котировка
                  </span>
                )}
              </div>
              <div className="flex items-center gap-4 flex-wrap">
                <div className="bg-background rounded-xl px-4 py-3 border border-border">
                  <div className="text-[11px] text-muted-foreground mb-1">Текущая цена</div>
                  <div className="font-mono font-black text-2xl text-foreground">
                    {selectedForecast.currentPrice.toLocaleString()}
                    <span className="text-sm font-normal text-muted-foreground"> ₽/т</span>
                  </div>
                  {/* Weekly change under current price */}
                  {livePriceMap[selectedForecast.crop] && (() => {
                    const lp = livePriceMap[selectedForecast.crop];
                    const isUp = lp.trend === "up";
                    return (
                      <div className={`text-[10px] font-mono mt-0.5 flex items-center gap-0.5
                        ${isUp ? "text-emerald-600" : "text-red-500"}`}>
                        <Icon name={isUp ? "TrendingUp" : "TrendingDown"} size={9} />
                        {isUp ? "+" : "−"}{Math.abs(lp.week_change).toLocaleString("ru")} ₽ за нед.
                      </div>
                    );
                  })()}
                </div>
                <div className="flex items-center">
                  <Icon name="ArrowRight" size={20} className="text-muted-foreground" />
                </div>
                <div className={`rounded-xl px-4 py-3 border ${selectedForecast.trend === "up" ? "bg-primary/8 border-primary/25" : "bg-destructive/8 border-destructive/25"}`}>
                  <div className="text-[11px] text-muted-foreground mb-1">Прогноз AI (+3 мес)</div>
                  <div className={`font-mono font-black text-2xl ${selectedForecast.trend === "up" ? "text-primary" : "text-destructive"}`}>
                    {selectedForecast.forecastPrice.toLocaleString()}
                    <span className="text-sm font-normal"> ₽/т</span>
                  </div>
                </div>
              </div>
            </div>
            <div className="flex gap-3 shrink-0">
              <div className={`px-5 py-4 rounded-2xl border-2 text-center shadow-sm
                ${selectedForecast.trend === "up" ? "bg-primary/8 border-primary/30 text-primary" : "bg-destructive/8 border-destructive/30 text-destructive"}`}>
                <div className="flex items-center justify-center gap-1 mb-1">
                  <Icon name={selectedForecast.trend === "up" ? "TrendingUp" : "TrendingDown"} size={14} />
                </div>
                <div className="text-2xl font-black font-mono">
                  {selectedForecast.change > 0 ? "+" : ""}
                  {typeof selectedForecast.change === "number" ? selectedForecast.change.toFixed(1) : selectedForecast.change}%
                </div>
                <div className="text-[10px] opacity-70 mt-0.5">изменение</div>
              </div>
              <div className="px-5 py-4 rounded-2xl border-2 border-accent/30 bg-accent/8 text-center shadow-sm">
                <div className="flex items-center justify-center gap-1 mb-1">
                  <Icon name="Brain" size={14} className="text-accent" />
                </div>
                <div className="text-2xl font-black font-mono text-accent">
                  {typeof selectedForecast.confidence === "number" ? selectedForecast.confidence.toFixed(0) : selectedForecast.confidence}%
                </div>
                <div className="text-[10px] text-muted-foreground mt-0.5">уверенность</div>
              </div>
            </div>
          </div>

          {/* Confidence bar */}
          <div className="mb-6 bg-background rounded-xl p-4 border border-border">
            <div className="flex justify-between text-xs text-muted-foreground mb-2">
              <span className="flex items-center gap-1">
                <Icon name="Brain" size={11} />Уверенность модели ARIMA + LSTM
              </span>
              <span className="font-mono font-bold text-accent">
                {typeof selectedForecast.confidence === "number" ? selectedForecast.confidence.toFixed(0) : selectedForecast.confidence}%
              </span>
            </div>
            <div className="h-2.5 bg-border rounded-full overflow-hidden">
              <div className="h-full rounded-full progress-bar-gold transition-all duration-700"
                style={{ width: `${selectedForecast.confidence}%` }} />
            </div>
            <div className="flex justify-between text-[10px] text-muted-foreground mt-1.5">
              <span>Низкая</span><span>Средняя</span><span>Высокая</span>
            </div>
          </div>

          {/* Chart */}
          <div>
            <PriceChart crop={cropFull} />
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
              <span className="text-[10px] text-muted-foreground animate-pulse flex items-center gap-1 bg-secondary px-2 py-0.5 rounded-full ml-1">
                <Icon name="Loader" size={9} />обновляю...
              </span>
            ) : aiTable.length > 0 ? (
              <span className="text-[10px] text-primary bg-primary/10 border border-primary/20 px-2 py-0.5 rounded-full font-mono flex items-center gap-1 ml-1">
                <Icon name="Brain" size={9} />AI · live
              </span>
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
              {tableData.map((f, i) => {
                const lp = livePriceMap[f.crop];
                return (
                  <tr key={i}
                    className={`border-b border-border/50 hover:bg-primary/4 transition-colors cursor-pointer group ${i % 2 === 0 ? "" : "bg-secondary/20"}`}
                    onClick={() => setSelectedCrop(f.crop)}>
                    <td className="py-3.5 px-4 pl-6">
                      <div className="flex items-center gap-2">
                        <span className={`w-1 h-8 rounded-full ${f.trend === "up" ? "bg-primary" : "bg-destructive"} opacity-0 group-hover:opacity-100 transition-opacity`} />
                        <div>
                          <span className="font-semibold text-foreground font-body">{f.crop}</span>
                          {lp && !lp.is_fallback && (
                            <span className="ml-1.5 text-[9px] text-emerald-600 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded-full font-mono">live</span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-mono text-muted-foreground text-xs">
                        {f.currentPrice.toLocaleString()} ₽
                      </div>
                      {lp && (
                        <div className={`text-[10px] font-mono flex items-center gap-0.5 mt-0.5
                          ${lp.trend === "up" ? "text-emerald-600" : "text-red-500"}`}>
                          <Icon name={lp.trend === "up" ? "TrendingUp" : "TrendingDown"} size={8} />
                          {lp.trend === "up" ? "+" : "−"}{Math.abs(lp.week_change).toLocaleString("ru")} ₽/нед
                        </div>
                      )}
                    </td>
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
                        <span className="font-mono text-xs text-muted-foreground">
                          {typeof f.confidence === "number" ? f.confidence.toFixed(0) : f.confidence}%
                        </span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 pr-6">
                      <span className={`font-mono text-xs font-bold ${f.yieldForecast > f.yield ? "text-primary" : "text-destructive"}`}>
                        {typeof f.yieldForecast === "number" ? f.yieldForecast.toFixed(1) : f.yieldForecast} ц/га
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
