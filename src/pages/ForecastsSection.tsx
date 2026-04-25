import Icon from "@/components/ui/icon";
import { CROPS, FORECAST_DATA } from "./data";
import { PriceChart } from "./PageWidgets";
import { AiSingle, AiTableRow } from "./ForecastsTypes";

interface ForecastsSectionProps {
  selectedCrop: string;
  setSelectedCrop: (crop: string) => void;
  aiSingle: AiSingle | null;
  aiSingleLoading: boolean;
  aiTable: AiTableRow[];
  aiTableLoading: boolean;
}

export default function ForecastsSection({
  selectedCrop, setSelectedCrop,
  aiSingle, aiSingleLoading,
  aiTable, aiTableLoading,
}: ForecastsSectionProps) {
  const cropFull = FORECAST_DATA.find(f => f.crop.includes(selectedCrop) || selectedCrop.includes(f.crop.split(" ")[0]))?.crop || selectedCrop;
  const baseForecast = FORECAST_DATA.find(f => f.crop === cropFull) || FORECAST_DATA[0];
  const selectedForecast = aiSingle ? { ...baseForecast, ...aiSingle } : baseForecast;
  const tableData: AiTableRow[] = aiTable.length > 0 ? aiTable : FORECAST_DATA.map(f => ({ ...f, trend: f.trend as "up" | "down" }));

  return (
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
  );
}
