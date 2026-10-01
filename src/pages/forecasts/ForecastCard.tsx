import Icon from "@/components/ui/icon";
import { CROPS, FORECAST_DATA } from "../data";
import { PriceChart } from "../PageWidgets";
import { AiSingle } from "../ForecastsTypes";
import { LivePrice } from "./LiveQuotesPanel";

type ForecastItem = (typeof FORECAST_DATA)[number];

// ── Фильтр культур и карточка прогноза ─────────────────────────────────────
export default function ForecastCard({
  selectedForecast, mergedForecast, cropFull, setSelectedCrop, aiSingle, aiSingleLoading, livePriceMap,
}: {
  selectedForecast: ForecastItem;
  mergedForecast: ForecastItem[];
  cropFull: string;
  setSelectedCrop: (crop: string) => void;
  aiSingle: AiSingle | null;
  aiSingleLoading: boolean;
  livePriceMap: Record<string, LivePrice>;
}) {
  return (
    <>
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
                    <Icon name="Info" size={9} />демо-модель
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
                  {livePriceMap[selectedForecast.crop] && livePriceMap[selectedForecast.crop].change && (() => {
                    const lp = livePriceMap[selectedForecast.crop];
                    const isUp = lp.trend === "up";
                    return (
                      <div className={`text-[10px] font-mono mt-0.5 flex items-center gap-0.5
                        ${isUp ? "text-emerald-600" : "text-red-500"}`}>
                        <Icon name={isUp ? "TrendingUp" : "TrendingDown"} size={9} />
                        {isUp ? "+" : "−"}{Math.abs(lp.change ?? 0).toLocaleString("ru")} ₽ за {lp.change_period}
                      </div>
                    );
                  })()}
                </div>
                <div className="flex items-center">
                  <Icon name="ArrowRight" size={20} className="text-muted-foreground" />
                </div>
                <div className={`rounded-xl px-4 py-3 border ${selectedForecast.trend === "up" ? "bg-primary/8 border-primary/25" : "bg-destructive/8 border-destructive/25"}`}>
                  <div className="text-[11px] text-muted-foreground mb-1">Демо-оценка (+3 мес)</div>
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
                <Icon name="Brain" size={11} />Уверенность модели
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
    </>
  );
}
