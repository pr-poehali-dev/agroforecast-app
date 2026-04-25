import Icon from "@/components/ui/icon";
import { RegionDetail } from "./NdviTypes";

interface NdviDetailProps {
  detail: RegionDetail | null;
  detailLoading: boolean;
}

export default function NdviDetail({ detail, detailLoading }: NdviDetailProps) {
  if (detailLoading) {
    return <div className="h-48 glass-card rounded-xl animate-pulse" />;
  }

  if (!detail) return null;

  return (
    <div className="space-y-4">
      {/* Header card */}
      <div className="glass-card rounded-xl p-6">
        <div className="flex flex-wrap items-start justify-between gap-4 mb-5">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Icon name="MapPin" size={16} style={{ color: detail.color }} />
              <h2 className="text-lg font-bold text-foreground">{detail.name} обл.</h2>
              <span className="px-2 py-0.5 text-[10px] font-mono rounded border" style={{ background: detail.color + "20", color: detail.color, borderColor: detail.color + "40" }}>{detail.label}</span>
            </div>
            <div className="text-xs text-muted-foreground font-mono">{detail.source} · {detail.generated_at?.slice(0, 16).replace("T", " ")}</div>
          </div>
          <div className="flex gap-3">
            <div className="text-center p-3 rounded-xl border" style={{ background: detail.color + "12", borderColor: detail.color + "40" }}>
              <div className="text-3xl font-bold font-mono" style={{ color: detail.color }}>{detail.ndvi.toFixed(2)}</div>
              <div className="text-[10px] text-muted-foreground">NDVI текущий</div>
            </div>
            <div className="text-center p-3 rounded-xl border border-border bg-secondary/40">
              <div className="text-3xl font-bold font-mono text-muted-foreground">{detail.ndvi_hist_avg.toFixed(2)}</div>
              <div className="text-[10px] text-muted-foreground">Норма 5 лет</div>
            </div>
            <div className="text-center p-3 rounded-xl border border-primary/25 bg-primary/10">
              <div className={`text-3xl font-bold font-mono ${detail.anomaly_pct < 0 ? "text-destructive" : "text-primary"}`}>
                {detail.anomaly_pct > 0 ? "+" : ""}{detail.anomaly_pct.toFixed(1)}%
              </div>
              <div className="text-[10px] text-muted-foreground">Откл. от нормы</div>
            </div>
          </div>
        </div>

        {/* Формула NDVI */}
        <div className="bg-secondary/50 rounded-xl p-4 border border-border mb-5">
          <div className="text-[10px] text-muted-foreground font-mono uppercase tracking-wide mb-2">Расчёт NDVI (Sentinel-2, Band 4 Red + Band 8 NIR)</div>
          <div className="font-mono text-sm text-foreground font-bold">{detail.ndvi_formula}</div>
          <div className="text-xs text-muted-foreground mt-1.5">NIR = отражение в ближнем ИК диапазоне · Red = отражение в красном диапазоне</div>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: "Фаза развития", value: detail.phase, icon: "Sprout" },
            { label: "День сезона", value: `${detail.phase_day} день`, icon: "Calendar" },
            { label: "Осадки/мес", value: `${detail.rain_mm} мм`, icon: "Droplets" },
            { label: "Температура", value: `+${detail.temp_c}°C`, icon: "Thermometer" },
          ].map((s, i) => (
            <div key={i} className="bg-secondary/30 rounded-xl p-3 flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-primary/15 text-primary flex items-center justify-center shrink-0">
                <Icon name={s.icon as string} size={14} />
              </div>
              <div>
                <div className="text-[10px] text-muted-foreground">{s.label}</div>
                <div className="text-sm font-semibold text-foreground">{s.value}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Прогноз урожайности + структура посевов */}
      <div className="grid lg:grid-cols-2 gap-4">
        <div className="glass-card rounded-xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <Icon name="Wheat" size={15} className="text-primary" />
            <h3 className="font-semibold text-sm">Прогноз урожайности по NDVI</h3>
            <span className="ml-auto text-[10px] font-mono text-muted-foreground">MAPE ±{detail.yield_forecast.mape_pct}%</span>
          </div>
          <div className="text-4xl font-bold font-mono text-primary mb-1">
            {detail.yield_forecast.yield_cha} <span className="text-lg font-normal text-muted-foreground">ц/га</span>
          </div>
          <div className="text-xs text-muted-foreground mb-4">
            Диапазон: {detail.yield_forecast.yield_low} – {detail.yield_forecast.yield_high} ц/га
          </div>
          <div className="space-y-2 text-xs">
            {[
              { label: "Ожидаемый пиковый NDVI", value: detail.yield_forecast.ndvi_peak_forecast.toFixed(3) },
              { label: "Пик прошлого сезона", value: detail.ndvi_peak_last_season.toFixed(2) },
              { label: "Площадь пашни", value: `${detail.area_kha} тыс. га` },
              { label: "Облачность (помехи)", value: `${detail.cloud_pct}%` },
            ].map((r, i) => (
              <div key={i} className="flex justify-between border-b border-border/40 pb-1.5">
                <span className="text-muted-foreground">{r.label}</span>
                <span className="font-mono font-semibold text-foreground">{r.value}</span>
              </div>
            ))}
          </div>
          <div className="mt-4 p-3 bg-primary/8 border border-primary/20 rounded-lg text-xs text-foreground">
            <span className="font-semibold">Методология:</span> квадратичная регрессия NDVI→урожай, данные Минсельхоз РФ 2015–2024, корреляция r²=0.83
          </div>
        </div>

        {/* Структура посевов */}
        <div className="glass-card rounded-xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <Icon name="PieChart" size={15} className="text-primary" />
            <h3 className="font-semibold text-sm">Структура посевных площадей</h3>
          </div>
          <div className="space-y-3">
            {[
              { label: "Пшеница озимая", pct: detail.crop_structure.wheat_pct, color: "#10b981" },
              { label: "Подсолнечник",   pct: detail.crop_structure.sunflower_pct, color: "#f59e0b" },
              { label: "Кукуруза",       pct: detail.crop_structure.corn_pct, color: "#f97316" },
              { label: "Ячмень яровой",  pct: detail.crop_structure.barley_pct, color: "#84cc16" },
              { label: "Прочие культуры", pct: 100 - detail.crop_structure.wheat_pct - detail.crop_structure.sunflower_pct - detail.crop_structure.corn_pct - detail.crop_structure.barley_pct, color: "#94a3b8" },
            ].map((c, i) => (
              <div key={i}>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-foreground font-medium">{c.label}</span>
                  <span className="font-mono font-bold" style={{ color: c.color }}>{c.pct}%</span>
                </div>
                <div className="h-2 bg-border rounded-full">
                  <div className="h-full rounded-full transition-all duration-700" style={{ width: `${c.pct}%`, background: c.color }} />
                </div>
              </div>
            ))}
          </div>
          <div className="mt-4 text-xs text-muted-foreground border-t border-border pt-3">
            Общая площадь пашни: <span className="font-mono font-semibold text-foreground">{detail.area_kha} тыс. га</span>
          </div>
        </div>
      </div>

      {/* Alerts / рекомендации */}
      {detail.alerts.length > 0 && (
        <div className="glass-card rounded-xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <Icon name="Bell" size={15} className="text-accent" />
            <h3 className="font-semibold text-sm">Аномалии и рекомендации</h3>
          </div>
          <div className="space-y-3">
            {detail.alerts.map((a, i) => (
              <div key={i} className={`flex gap-3 p-4 rounded-xl border
                ${a.type === "critical" ? "bg-destructive/10 border-destructive/25" :
                  a.type === "warning" ? "bg-accent/8 border-accent/20" : "bg-secondary/40 border-border"}`}>
                <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0
                  ${a.type === "critical" ? "bg-destructive/20 text-destructive" :
                    a.type === "warning" ? "bg-accent/20 text-accent" : "bg-primary/20 text-primary"}`}>
                  <Icon name={a.icon as string} size={15} />
                </div>
                <div className="flex-1">
                  <div className="text-sm font-semibold text-foreground mb-1">{a.title}</div>
                  <div className="text-xs text-muted-foreground mb-2">{a.desc}</div>
                  <div className="flex items-center gap-1.5 text-xs">
                    <Icon name="Zap" size={11} className="text-primary" />
                    <span className="font-medium text-primary">{a.action}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
