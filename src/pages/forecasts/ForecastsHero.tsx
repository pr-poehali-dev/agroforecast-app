import Icon from "@/components/ui/icon";

// ── Hero блока прогнозов ───────────────────────────────────────────────────
export default function ForecastsHero() {
  // ── Hero ──
  return (
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
          <p className="text-white/65 text-sm mt-1 font-body">Аналитическая модель · горизонт 3–12 месяцев</p>
        </div>
        <div className="shrink-0">
          <div className="bg-white/15 border border-white/25 rounded-xl px-4 py-3 text-center max-w-[220px]">
            <div className="text-white/85 text-[11px] leading-snug flex items-center gap-1.5">
              <Icon name="Info" size={13} className="shrink-0" />
              Прогноз носит аналитический характер и не является рекомендацией к сделке
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
