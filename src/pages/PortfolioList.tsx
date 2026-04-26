import Icon from "@/components/ui/icon";
import { PortfolioItem, Summary, CROP_COLORS, CROP_ICONS, fmt, fmtM } from "./PortfolioTypes";

interface PortfolioListProps {
  items: PortfolioItem[];
  summary: Summary;
  loading: boolean;
  deletingId: number | null;
  onDelete: (id: number) => void;
}

export default function PortfolioList({
  items, summary, loading, deletingId, onDelete,
}: PortfolioListProps) {
  const profitColor = summary.total_profit >= 0 ? "text-emerald-600" : "text-red-500";

  const bestCrop = items.length > 0
    ? items.reduce((best, i) => (i.roi_pct > best.roi_pct ? i : best), items[0])
    : null;

  if (loading) {
    return (
      <div className="glass-card rounded-2xl p-12 flex flex-col items-center justify-center gap-3">
        <Icon name="Loader2" size={28} className="text-primary animate-spin" />
        <p className="text-sm text-muted-foreground">Загружаю портфель…</p>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="glass-card rounded-2xl p-12 flex flex-col items-center justify-center gap-4 text-center">
        <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
          <Icon name="Sprout" size={28} className="text-primary/60" />
        </div>
        <div>
          <p className="font-heading font-bold text-base text-foreground">Портфель пуст</p>
          <p className="text-sm text-muted-foreground mt-1 max-w-xs">
            Добавьте первую культуру с помощью формы слева — и мы рассчитаем ожидаемую выручку и прибыль.
          </p>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-primary/70 bg-primary/8 px-3 py-1.5 rounded-full border border-primary/15">
          <Icon name="ArrowLeft" size={11} />
          <span>Заполните форму добавления</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Items list */}
      {items.map(item => {
        const colors = CROP_COLORS[item.crop] ?? { bg: "bg-gray-50", text: "text-gray-700", border: "border-gray-200" };
        const iconName = CROP_ICONS[item.crop] ?? "Leaf";
        const isDeleting = deletingId === item.id;
        return (
          <div
            key={item.id}
            className={`glass-card rounded-2xl p-4 sm:p-5 transition-all ${isDeleting ? "opacity-40 scale-[0.99]" : ""}`}
          >
            {/* Header row */}
            <div className="flex items-start justify-between gap-3 mb-3.5">
              <div className="flex items-center gap-3">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center border ${colors.bg} ${colors.border}`}>
                  <Icon name={iconName} size={16} className={colors.text} />
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-heading font-bold text-sm text-foreground">{item.crop}</span>
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${colors.bg} ${colors.text} ${colors.border}`}>
                      {item.region}
                    </span>
                  </div>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    {fmt(item.area_ha)} га
                    {item.notes && <span className="ml-2 text-muted-foreground/70">· {item.notes}</span>}
                  </p>
                </div>
              </div>

              <button
                onClick={() => onDelete(item.id)}
                disabled={isDeleting}
                className="p-1.5 rounded-lg text-muted-foreground hover:text-red-500 hover:bg-red-50 transition-colors shrink-0 disabled:opacity-40"
                title="Удалить"
              >
                {isDeleting
                  ? <Icon name="Loader2" size={14} className="animate-spin" />
                  : <Icon name="Trash2" size={14} />
                }
              </button>
            </div>

            {/* Economics grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <div className="rounded-xl bg-secondary/70 px-3 py-2 text-center">
                <p className="text-[9px] text-muted-foreground uppercase tracking-wider font-mono">Урожайность</p>
                <p className="text-sm font-bold text-foreground font-heading mt-0.5">{item.yield_cha} ц/га</p>
              </div>
              <div className="rounded-xl bg-blue-50 border border-blue-100 px-3 py-2 text-center">
                <p className="text-[9px] text-blue-500 uppercase tracking-wider font-mono">Выручка</p>
                <p className="text-sm font-bold text-blue-700 font-heading mt-0.5">{fmtM(item.revenue)}</p>
              </div>
              <div className="rounded-xl bg-orange-50 border border-orange-100 px-3 py-2 text-center">
                <p className="text-[9px] text-orange-500 uppercase tracking-wider font-mono">Затраты</p>
                <p className="text-sm font-bold text-orange-700 font-heading mt-0.5">{fmtM(item.costs)}</p>
              </div>
              <div className={`rounded-xl px-3 py-2 text-center border ${item.profit >= 0 ? "bg-emerald-50 border-emerald-100" : "bg-red-50 border-red-100"}`}>
                <p className={`text-[9px] uppercase tracking-wider font-mono ${item.profit >= 0 ? "text-emerald-600" : "text-red-500"}`}>
                  Прибыль
                </p>
                <p className={`text-sm font-bold font-heading mt-0.5 ${item.profit >= 0 ? "text-emerald-700" : "text-red-600"}`}>
                  {fmtM(item.profit)}
                </p>
              </div>
            </div>

            {/* ROI bar */}
            <div className="mt-3 flex items-center gap-2">
              <span className="text-[10px] text-muted-foreground font-mono">ROI</span>
              <div className="flex-1 h-1.5 bg-border rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${item.roi_pct >= 50 ? "bg-emerald-500" : item.roi_pct >= 20 ? "bg-amber-400" : "bg-red-400"}`}
                  style={{ width: Math.min(100, Math.max(0, item.roi_pct)) + "%" }}
                />
              </div>
              <span className={`text-[10px] font-bold font-mono ${item.roi_pct >= 50 ? "text-emerald-600" : item.roi_pct >= 20 ? "text-amber-600" : "text-red-500"}`}>
                {item.roi_pct}%
              </span>
            </div>
          </div>
        );
      })}

      {/* Summary block */}
      <div className="glass-card rounded-2xl p-5 border-l-4 border-l-primary space-y-4">
        <div className="flex items-center gap-2">
          <Icon name="BarChart3" size={16} className="text-primary" />
          <h3 className="font-heading font-bold text-sm text-foreground">Сводка по портфелю</h3>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="rounded-xl bg-secondary/80 px-4 py-3 text-center">
            <p className="text-[9px] text-muted-foreground uppercase tracking-wider font-mono">Всего площадь</p>
            <p className="text-xl font-black text-foreground font-heading mt-0.5">
              {fmt(Math.round(summary.total_area))}
              <span className="text-sm font-normal text-muted-foreground ml-0.5">га</span>
            </p>
            <p className="text-[10px] text-muted-foreground mt-0.5">{summary.count} позиц.</p>
          </div>
          <div className="rounded-xl bg-blue-50 border border-blue-100 px-4 py-3 text-center">
            <p className="text-[9px] text-blue-500 uppercase tracking-wider font-mono">Общая выручка</p>
            <p className="text-xl font-black text-blue-700 font-heading mt-0.5">{fmtM(summary.total_revenue)}</p>
            <p className="text-[10px] text-blue-400 mt-0.5">
              {summary.total_area > 0 ? fmtM(Math.round(summary.total_revenue / summary.total_area)) + "/га" : "—"}
            </p>
          </div>
          <div className="rounded-xl bg-orange-50 border border-orange-100 px-4 py-3 text-center">
            <p className="text-[9px] text-orange-500 uppercase tracking-wider font-mono">Общие затраты</p>
            <p className="text-xl font-black text-orange-700 font-heading mt-0.5">{fmtM(summary.total_costs)}</p>
            <p className="text-[10px] text-orange-400 mt-0.5">
              {summary.total_area > 0 ? fmtM(Math.round(summary.total_costs / summary.total_area)) + "/га" : "—"}
            </p>
          </div>
          <div className={`rounded-xl border px-4 py-3 text-center ${summary.total_profit >= 0 ? "bg-emerald-50 border-emerald-100" : "bg-red-50 border-red-100"}`}>
            <p className={`text-[9px] uppercase tracking-wider font-mono ${summary.total_profit >= 0 ? "text-emerald-600" : "text-red-500"}`}>
              Чистая прибыль
            </p>
            <p className={`text-xl font-black font-heading mt-0.5 ${profitColor}`}>
              {fmtM(summary.total_profit)}
            </p>
            <p className={`text-[10px] mt-0.5 ${profitColor}`}>
              {summary.total_costs > 0
                ? "ROI " + Math.round(summary.total_profit / summary.total_costs * 100) + "%"
                : "—"}
            </p>
          </div>
        </div>

        {/* Best crop + recommendation */}
        {bestCrop && (
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1 rounded-xl bg-amber-50 border border-amber-200 px-4 py-3 flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center shrink-0">
                <Icon name="Trophy" size={14} className="text-amber-600" />
              </div>
              <div>
                <p className="text-[10px] text-amber-600 font-mono uppercase tracking-wider">Лучшая культура по ROI</p>
                <p className="font-heading font-bold text-sm text-amber-800">{bestCrop.crop}</p>
                <p className="text-[10px] text-amber-600">ROI {bestCrop.roi_pct}% · {fmtM(bestCrop.profit)} прибыль</p>
              </div>
            </div>

            <div className="flex-1 rounded-xl bg-primary/5 border border-primary/20 px-4 py-3 flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                <Icon name="Lightbulb" size={14} className="text-primary" />
              </div>
              <div>
                <p className="text-[10px] text-primary/70 font-mono uppercase tracking-wider">Рекомендация</p>
                <p className="text-xs text-foreground leading-relaxed mt-0.5">
                  {summary.total_profit > 0
                    ? `Портфель прибыльный. Рассмотрите увеличение доли «${bestCrop.crop}» — максимальный ROI среди ваших культур.`
                    : "Пересмотрите структуру посевов — текущий портфель убыточен. Снизьте долю культур с низким ROI."}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
