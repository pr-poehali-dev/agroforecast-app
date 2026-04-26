import { useState, useEffect, useCallback } from "react";
import Icon from "@/components/ui/icon";
import {
  PORTFOLIO_URL, CROPS, REGIONS,
  PortfolioItem, Summary,
  fmt, fmtM,
} from "./PortfolioTypes";
import PortfolioAddForm from "./PortfolioAddForm";
import PortfolioList from "./PortfolioList";

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
    } catch {
      setError("Не удалось загрузить портфель. Проверьте подключение.");
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
        <PortfolioAddForm
          crop={crop}
          area={area}
          region={region}
          notes={notes}
          customYield={customYield}
          saving={saving}
          onCropChange={setCrop}
          onAreaChange={setArea}
          onRegionChange={setRegion}
          onNotesChange={setNotes}
          onCustomYieldChange={setCustomYield}
          onSubmit={handleAdd}
        />

        <PortfolioList
          items={items}
          summary={summary}
          loading={loading}
          deletingId={deletingId}
          onDelete={handleDelete}
        />
      </div>
    </div>
  );
}
