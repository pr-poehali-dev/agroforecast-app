import { useState, useEffect, useCallback } from "react";
import Icon from "@/components/ui/icon";

const PORTFOLIO_URL = "https://functions.poehali.dev/c0f0c7ac-c29c-495f-954c-79fcc97efce7";

// ── Агроэкономика (зеркало backend/CROP_DATA) ──────────────────────────────
const CROP_DATA: Record<string, { price_per_t: number; yield_cha: number; cost_per_ha: number }> = {
  "Пшеница озимая": { price_per_t: 13650, yield_cha: 29.4, cost_per_ha: 31600 },
  "Подсолнечник":   { price_per_t: 46500, yield_cha: 23.1, cost_per_ha: 45200 },
  "Кукуруза":       { price_per_t: 13800, yield_cha: 56.8, cost_per_ha: 28900 },
  "Ячмень яровой":  { price_per_t: 12200, yield_cha: 28.1, cost_per_ha: 23400 },
  "Рожь":           { price_per_t: 10100, yield_cha: 18.2, cost_per_ha: 20600 },
};

const CROPS = Object.keys(CROP_DATA);

const REGIONS = [
  "Самарская", "Саратовская", "Волгоградская", "Краснодарский",
  "Ростовская", "Ставропольский", "Воронежская", "Белгородская",
  "Оренбургская", "Татарстан",
];

const CROP_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  "Пшеница озимая": { bg: "bg-emerald-50",  text: "text-emerald-700", border: "border-emerald-200" },
  "Подсолнечник":   { bg: "bg-amber-50",    text: "text-amber-700",   border: "border-amber-200"   },
  "Кукуруза":       { bg: "bg-orange-50",   text: "text-orange-700",  border: "border-orange-200"  },
  "Ячмень яровой":  { bg: "bg-lime-50",     text: "text-lime-700",    border: "border-lime-200"    },
  "Рожь":           { bg: "bg-slate-50",    text: "text-slate-600",   border: "border-slate-200"   },
};

const CROP_ICONS: Record<string, string> = {
  "Пшеница озимая": "Wheat",
  "Подсолнечник":   "Sun",
  "Кукуруза":       "Sprout",
  "Ячмень яровой":  "Leaf",
  "Рожь":           "Grass",
};

// ── Типы ───────────────────────────────────────────────────────────────────
interface PortfolioItem {
  id: number;
  crop: string;
  area_ha: number;
  region: string;
  custom_yield: number | null;
  notes: string | null;
  created_at: string;
  yield_cha: number;
  price_per_t: number;
  cost_per_ha: number;
  revenue: number;
  costs: number;
  profit: number;
  roi_pct: number;
}

interface Summary {
  total_area: number;
  total_revenue: number;
  total_costs: number;
  total_profit: number;
  count: number;
}

// ── Вспомогательные функции ─────────────────────────────────────────────────
function fmt(n: number): string {
  return n.toLocaleString("ru-RU");
}

function fmtM(n: number): string {
  if (Math.abs(n) >= 1_000_000) return (n / 1_000_000).toFixed(1).replace(".", ",") + " млн ₽";
  return fmt(n) + " ₽";
}

function calcLocal(crop: string, area_ha: number, custom_yield?: number) {
  const eco = CROP_DATA[crop];
  if (!eco) return { revenue: 0, costs: 0, profit: 0, roi_pct: 0, yield_cha: 0 };
  const yc = custom_yield ?? eco.yield_cha;
  const revenue = area_ha * (yc / 10) * eco.price_per_t;
  const costs = area_ha * eco.cost_per_ha;
  const profit = revenue - costs;
  const roi_pct = costs > 0 ? (profit / costs) * 100 : 0;
  return { revenue: Math.round(revenue), costs: Math.round(costs), profit: Math.round(profit), roi_pct: Math.round(roi_pct * 10) / 10, yield_cha: yc };
}

// ── Компонент ───────────────────────────────────────────────────────────────
export default function SectionPortfolio() {
  const [items, setItems] = useState<PortfolioItem[]>([]);
  const [summary, setSummary] = useState<Summary>({ total_area: 0, total_revenue: 0, total_costs: 0, total_profit: 0, count: 0 });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [crop, setCrop] = useState(CROPS[0]);
  const [area, setArea] = useState("");
  const [region, setRegion] = useState(REGIONS[0]);
  const [notes, setNotes] = useState("");
  const [customYield, setCustomYield] = useState("");

  // Preview calculation
  const areaNum = parseFloat(area) || 0;
  const cyNum = customYield ? parseFloat(customYield) : undefined;
  const preview = areaNum > 0 ? calcLocal(crop, areaNum, cyNum) : null;

  // ── Fetch list ─────────────────────────────────────────────────────────────
  const fetchList = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(PORTFOLIO_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "list", user_id: "guest" }),
      });
      if (!res.ok) throw new Error("HTTP " + res.status);
      const data = await res.json();
      setItems(data.items ?? []);
      setSummary(data.summary ?? { total_area: 0, total_revenue: 0, total_costs: 0, total_profit: 0, count: 0 });
    } catch (e: unknown) {
      setError("Не удалось загрузить портфель. Проверьте подключение.");
      // Fallback: keep empty state with no crash
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchList(); }, [fetchList]);

  // ── Add item ──────────────────────────────────────────────────────────────
  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!crop || !area || parseFloat(area) <= 0) return;
    setSaving(true);
    setError(null);
    try {
      const body: Record<string, unknown> = {
        action: "add",
        user_id: "guest",
        crop,
        area_ha: parseFloat(area),
        region,
      };
      if (notes.trim()) body.notes = notes.trim();
      if (customYield && parseFloat(customYield) > 0) body.custom_yield = parseFloat(customYield);

      const res = await fetch(PORTFOLIO_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Ошибка сервера");
      }
      // Reset form
      setArea("");
      setNotes("");
      setCustomYield("");
      await fetchList();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Ошибка при добавлении");
    } finally {
      setSaving(false);
    }
  };

  // ── Delete item ───────────────────────────────────────────────────────────
  const handleDelete = async (id: number) => {
    setDeletingId(id);
    setError(null);
    try {
      const res = await fetch(PORTFOLIO_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "delete", user_id: "guest", id }),
      });
      if (!res.ok) throw new Error("Ошибка удаления");
      await fetchList();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Ошибка при удалении");
    } finally {
      setDeletingId(null);
    }
  };

  // Best crop by ROI
  const bestCrop = items.length > 0
    ? items.reduce((best, i) => (i.roi_pct > best.roi_pct ? i : best), items[0])
    : null;

  const profitColor = summary.total_profit >= 0 ? "text-emerald-600" : "text-red-500";

  return (
    <div className="space-y-6 animate-fade-in">

      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <div className="hero-gradient rounded-2xl p-5 sm:p-7 relative overflow-hidden shadow-md">
        <div className="hero-gradient-overlay absolute inset-0" />
        <div className="bg-dots absolute inset-0 opacity-15" />

        <div className="relative flex flex-col sm:flex-row sm:items-start justify-between gap-5">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <Icon name="Sprout" size={13} className="text-white/75" />
              <span className="text-white/60 text-xs font-mono uppercase tracking-widest">АгроПорт · Портфель</span>
            </div>
            <h1 className="font-heading font-black text-2xl sm:text-3xl text-white leading-tight">
              Мой <span className="gold-text">портфель</span>
            </h1>
            <p className="text-white/60 text-sm mt-1 font-body">
              Культуры, площади и расчёт выручки · цены НТБ апрель 2026
            </p>
          </div>

          {/* Summary pills */}
          <div className="flex flex-wrap gap-2 shrink-0">
            <div className="flex flex-col items-center px-4 py-2.5 rounded-xl bg-white/10 border border-white/20 min-w-[90px]">
              <span className="text-white/55 text-[10px] uppercase tracking-wider font-mono">Площадь</span>
              <span className="text-white font-heading font-black text-lg leading-tight">
                {loading ? "…" : fmt(Math.round(summary.total_area))}
                <span className="text-white/60 text-xs font-body font-normal ml-0.5">га</span>
              </span>
            </div>
            <div className="flex flex-col items-center px-4 py-2.5 rounded-xl bg-white/10 border border-white/20 min-w-[110px]">
              <span className="text-white/55 text-[10px] uppercase tracking-wider font-mono">Выручка</span>
              <span className="text-white font-heading font-black text-lg leading-tight">
                {loading ? "…" : fmtM(summary.total_revenue)}
              </span>
            </div>
            <div className="flex flex-col items-center px-4 py-2.5 rounded-xl bg-white/10 border border-white/20 min-w-[110px]">
              <span className="text-white/55 text-[10px] uppercase tracking-wider font-mono">Прибыль</span>
              <span className={`font-heading font-black text-lg leading-tight ${summary.total_profit >= 0 ? "text-amber-300" : "text-red-300"}`}>
                {loading ? "…" : fmtM(summary.total_profit)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Error banner ─────────────────────────────────────────────────── */}
      {error && (
        <div className="flex items-center gap-3 p-3.5 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
          <Icon name="AlertCircle" size={16} className="shrink-0 text-red-500" />
          <span>{error}</span>
          <button onClick={() => setError(null)} className="ml-auto text-red-400 hover:text-red-600 transition-colors">
            <Icon name="X" size={14} />
          </button>
        </div>
      )}

      {/* ── Main grid ────────────────────────────────────────────────────── */}
      <div className="grid lg:grid-cols-[380px_1fr] gap-6">

        {/* ── Add form ───────────────────────────────────────────────────── */}
        <div className="glass-card rounded-2xl p-5 space-y-4 h-fit">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center">
              <Icon name="Plus" size={14} className="text-primary" />
            </div>
            <h2 className="font-heading font-bold text-base text-foreground">Добавить культуру</h2>
          </div>

          <form onSubmit={handleAdd} className="space-y-3.5">
            {/* Crop */}
            <div>
              <label className="text-xs text-muted-foreground mb-1.5 block font-medium">Культура</label>
              <select
                value={crop}
                onChange={e => setCrop(e.target.value)}
                className="w-full text-sm bg-secondary border border-border rounded-lg px-3 py-2 text-foreground focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20 transition"
              >
                {CROPS.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>

            {/* Area */}
            <div>
              <label className="text-xs text-muted-foreground mb-1.5 block font-medium">
                Площадь (га)
              </label>
              <input
                type="number"
                min="0.1"
                step="0.1"
                value={area}
                onChange={e => setArea(e.target.value)}
                placeholder="напр. 500"
                className="w-full text-sm bg-secondary border border-border rounded-lg px-3 py-2 text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20 transition"
                required
              />
            </div>

            {/* Region */}
            <div>
              <label className="text-xs text-muted-foreground mb-1.5 block font-medium">Регион</label>
              <select
                value={region}
                onChange={e => setRegion(e.target.value)}
                className="w-full text-sm bg-secondary border border-border rounded-lg px-3 py-2 text-foreground focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20 transition"
              >
                {REGIONS.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>

            {/* Custom yield (optional) */}
            <div>
              <label className="text-xs text-muted-foreground mb-1.5 block font-medium">
                Урожайность ц/га
                <span className="ml-1 text-[10px] text-muted-foreground/70">
                  (необязательно — умолч. {CROP_DATA[crop]?.yield_cha} ц/га)
                </span>
              </label>
              <input
                type="number"
                min="1"
                step="0.1"
                value={customYield}
                onChange={e => setCustomYield(e.target.value)}
                placeholder={String(CROP_DATA[crop]?.yield_cha)}
                className="w-full text-sm bg-secondary border border-border rounded-lg px-3 py-2 text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20 transition"
              />
            </div>

            {/* Notes */}
            <div>
              <label className="text-xs text-muted-foreground mb-1.5 block font-medium">
                Заметки <span className="text-[10px] text-muted-foreground/60">(необязательно)</span>
              </label>
              <textarea
                value={notes}
                onChange={e => setNotes(e.target.value)}
                rows={2}
                placeholder="Поле №3, поливной участок…"
                className="w-full text-sm bg-secondary border border-border rounded-lg px-3 py-2 text-foreground placeholder:text-muted-foreground/50 resize-none focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20 transition"
              />
            </div>

            {/* Preview */}
            {preview && (
              <div className="rounded-xl border border-primary/20 bg-primary/5 p-3 space-y-1.5">
                <p className="text-[10px] text-primary/70 uppercase tracking-wider font-mono font-semibold mb-2">
                  Предварительный расчёт
                </p>
                <div className="grid grid-cols-3 gap-1.5 text-center">
                  <div className="rounded-lg bg-white/70 px-2 py-1.5">
                    <p className="text-[9px] text-muted-foreground uppercase tracking-wide">Выручка</p>
                    <p className="text-xs font-bold text-foreground font-heading">{fmtM(preview.revenue)}</p>
                  </div>
                  <div className="rounded-lg bg-white/70 px-2 py-1.5">
                    <p className="text-[9px] text-muted-foreground uppercase tracking-wide">Затраты</p>
                    <p className="text-xs font-bold text-foreground font-heading">{fmtM(preview.costs)}</p>
                  </div>
                  <div className="rounded-lg bg-white/70 px-2 py-1.5">
                    <p className="text-[9px] text-muted-foreground uppercase tracking-wide">Прибыль</p>
                    <p className={`text-xs font-bold font-heading ${preview.profit >= 0 ? "text-emerald-600" : "text-red-500"}`}>
                      {fmtM(preview.profit)}
                    </p>
                  </div>
                </div>
                <p className="text-center text-[10px] text-muted-foreground">
                  ROI <span className="font-semibold text-primary">{preview.roi_pct}%</span>
                  &nbsp;·&nbsp;
                  Ур-сть <span className="font-semibold">{preview.yield_cha} ц/га</span>
                </p>
              </div>
            )}

            <button
              type="submit"
              disabled={saving || !area || parseFloat(area) <= 0}
              className="w-full py-2.5 bg-primary text-white rounded-xl text-sm font-semibold hover:bg-primary/90 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-sm"
            >
              {saving
                ? <><Icon name="Loader2" size={14} className="animate-spin" />Добавляю…</>
                : <><Icon name="Plus" size={14} />Добавить в портфель</>
              }
            </button>
          </form>
        </div>

        {/* ── Portfolio table ─────────────────────────────────────────────── */}
        <div className="space-y-4">

          {loading ? (
            <div className="glass-card rounded-2xl p-12 flex flex-col items-center justify-center gap-3">
              <Icon name="Loader2" size={28} className="text-primary animate-spin" />
              <p className="text-sm text-muted-foreground">Загружаю портфель…</p>
            </div>
          ) : items.length === 0 ? (
            /* ── Empty state ── */
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
          ) : (
            /* ── Items list ── */
            <div className="space-y-3">
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
                        onClick={() => handleDelete(item.id)}
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
            </div>
          )}

          {/* ── Summary block ───────────────────────────────────────────── */}
          {!loading && items.length > 0 && (
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
          )}

        </div>
      </div>
    </div>
  );
}