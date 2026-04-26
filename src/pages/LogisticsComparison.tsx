import React from "react";
import Icon from "@/components/ui/icon";
import { CalcResult, TransportOption, fmt } from "./LogisticsTypes";

const MODE_ICON: Record<string, string> = {
  truck_5t:  "Truck",
  truck_10t: "Truck",
  truck_20t: "Truck",
  truck_40t: "Truck",
  rail:      "Train",
  bulk_ship: "Ship",
};

const MODE_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  truck_20t: { bg: "bg-blue-50",    text: "text-blue-700",   border: "border-blue-200"   },
  truck_40t: { bg: "bg-indigo-50",  text: "text-indigo-700", border: "border-indigo-200" },
  rail:      { bg: "bg-amber-50",   text: "text-amber-700",  border: "border-amber-200"  },
  bulk_ship: { bg: "bg-cyan-50",    text: "text-cyan-700",   border: "border-cyan-200"   },
};
const DEFAULT_COLOR = { bg: "bg-gray-50", text: "text-gray-700", border: "border-gray-200" };

interface LogisticsComparisonProps {
  result: CalcResult;
  comparison: TransportOption[] | null;
  comparisonLoading: boolean;
}

export const LogisticsComparison: React.FC<LogisticsComparisonProps> = ({
  result, comparison, comparisonLoading,
}) => {
  const cheapestCost = comparison ? Math.min(...comparison.map(o => o.cost)) : Infinity;

  return (
    <div className="glass-card rounded-2xl p-6">
      <div className="flex items-center gap-2 mb-5">
        <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center">
          <Icon name="GitCompare" size={16} className="text-primary" />
        </div>
        <div>
          <h3 className="text-sm font-heading font-semibold text-gray-800">
            Сравнение видов транспорта
          </h3>
          <p className="text-xs text-gray-500">
            {result.distance_km} км · {result.weight_tons} т · {result.cargo_label}
          </p>
        </div>
        {comparisonLoading && (
          <Icon name="Loader2" size={14} className="ml-auto text-primary animate-spin" />
        )}
      </div>

      {/* Rich comparison from backend */}
      {comparison && comparison.length > 0 ? (
        <div className="space-y-3">
          {comparison.map((opt, idx) => {
            const isCheapest = opt.cost === cheapestCost;
            const isSelected = opt.vehicle_key === result.vehicle_type;
            const clr = MODE_COLORS[opt.vehicle_key] ?? DEFAULT_COLOR;
            const iconName = (MODE_ICON[opt.vehicle_key] ?? opt.icon) as string;

            return (
              <div
                key={opt.vehicle_key}
                className={`relative rounded-2xl border p-4 transition-all
                  ${isCheapest
                    ? "border-emerald-300 bg-emerald-50/60 shadow-sm"
                    : isSelected
                      ? "border-primary/30 bg-primary/5"
                      : "border-gray-200 bg-white hover:border-gray-300"}`}
              >
                {/* Badges */}
                <div className="absolute -top-2.5 right-3 flex gap-1.5">
                  {isCheapest && opt.savings_badge && (
                    <span className="px-2.5 py-0.5 bg-emerald-500 text-white text-[10px] font-bold rounded-full shadow-sm">
                      {opt.savings_badge}
                    </span>
                  )}
                  {isSelected && (
                    <span className="px-2.5 py-0.5 bg-primary text-white text-[10px] font-bold rounded-full shadow-sm">
                      ✓ Выбранный
                    </span>
                  )}
                  {idx === 0 && !isSelected && (
                    <span className="px-2.5 py-0.5 bg-amber-400 text-white text-[10px] font-bold rounded-full shadow-sm">
                      Рекомендуем
                    </span>
                  )}
                </div>

                <div className="flex items-start gap-3">
                  {/* Icon */}
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border ${clr.bg} ${clr.border}`}>
                    <Icon name={iconName} size={18} className={clr.text} />
                  </div>

                  {/* Main info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 flex-wrap">
                      <div>
                        <p className="text-sm font-semibold text-gray-800 leading-tight">{opt.mode}</p>
                        <div className="flex items-center gap-3 mt-1 flex-wrap">
                          <span className="flex items-center gap-1 text-[11px] text-gray-500">
                            <Icon name="Clock" size={10} className="text-gray-400" />
                            {opt.days} {opt.days === 1 ? "день" : opt.days < 5 ? "дня" : "дней"}
                          </span>
                          <span className="flex items-center gap-1 text-[11px] text-gray-500">
                            <Icon name="Repeat" size={10} className="text-gray-400" />
                            {opt.trips} {opt.trips === 1 ? "рейс" : opt.trips < 5 ? "рейса" : "рейсов"}
                          </span>
                        </div>
                      </div>

                      {/* Cost */}
                      <div className="text-right shrink-0">
                        <p className={`text-xl font-heading font-black ${isCheapest ? "text-emerald-600" : isSelected ? "text-primary" : "text-gray-800"}`}>
                          {fmt(opt.cost)} ₽
                        </p>
                        <p className="text-xs text-gray-500 font-mono">
                          {fmt(opt.cost_per_ton)} ₽/т
                        </p>
                      </div>
                    </div>

                    {/* Pros / cons */}
                    <div className="mt-2.5 flex flex-wrap gap-2">
                      <span className="flex items-center gap-1 text-[11px] text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-full px-2.5 py-0.5">
                        <Icon name="Check" size={9} className="text-emerald-500" />
                        {opt.pros}
                      </span>
                      <span className="flex items-center gap-1 text-[11px] text-orange-700 bg-orange-50 border border-orange-200 rounded-full px-2.5 py-0.5">
                        <Icon name="AlertTriangle" size={9} className="text-orange-400" />
                        {opt.cons}
                      </span>
                    </div>

                    {/* Cost bar relative to max */}
                    {(() => {
                      const maxCost = Math.max(...comparison.map(o => o.cost));
                      const pct = maxCost > 0 ? Math.round((opt.cost / maxCost) * 100) : 100;
                      return (
                        <div className="mt-2.5 flex items-center gap-2">
                          <div className="flex-1 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all duration-700
                                ${isCheapest ? "bg-emerald-500" : isSelected ? "bg-primary" : "bg-gray-400"}`}
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                          <span className="text-[10px] font-mono text-gray-400 w-8 text-right">{pct}%</span>
                        </div>
                      );
                    })()}
                  </div>
                </div>
              </div>
            );
          })}

          {/* Cost-per-ton summary bar */}
          <div className="mt-2 rounded-xl bg-gray-50 border border-gray-200 p-3">
            <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-2.5">
              ₽/тонну — визуальное сравнение
            </p>
            <div className="space-y-2">
              {[...comparison].sort((a, b) => a.cost_per_ton - b.cost_per_ton).map(opt => {
                const maxCpt = Math.max(...comparison.map(o => o.cost_per_ton));
                const pct = maxCpt > 0 ? Math.round((opt.cost_per_ton / maxCpt) * 100) : 100;
                const isCheap = opt.cost_per_ton === Math.min(...comparison.map(o => o.cost_per_ton));
                const clr = MODE_COLORS[opt.vehicle_key] ?? DEFAULT_COLOR;
                return (
                  <div key={opt.vehicle_key} className="flex items-center gap-2">
                    <span className="text-[10px] text-gray-600 w-36 truncate leading-tight">{opt.mode.split(" · ")[1] ?? opt.mode}</span>
                    <div className="flex-1 h-4 bg-gray-200 rounded-md overflow-hidden relative">
                      <div
                        className={`h-full rounded-md transition-all duration-700 ${isCheap ? "bg-emerald-500" : clr.bg.replace("bg-", "bg-").replace("-50", "-400")}`}
                        style={{ width: `${pct}%`, background: isCheap ? "#10b981" : undefined }}
                      />
                      <span className="absolute inset-y-0 left-2 flex items-center text-[10px] font-mono font-bold text-white mix-blend-screen">
                        {fmt(opt.cost_per_ton)} ₽/т
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      ) : (
        /* Fallback: alternatives table */
        !comparisonLoading && result.alternatives.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200">
                  {["Транспорт", "Рейсов", "Стоимость", "₽/тонна"].map((h) => (
                    <th key={h} className="text-left px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <tr className="bg-primary/5 border-b border-primary/10">
                  <td className="px-3 py-2.5 font-medium text-primary text-xs">✓ {result.vehicle_label}</td>
                  <td className="px-3 py-2.5 text-gray-700">{result.trips_needed}</td>
                  <td className="px-3 py-2.5 font-semibold text-primary">{fmt(result.total_cost)} ₽</td>
                  <td className="px-3 py-2.5 text-gray-700">{fmt(result.cost_per_ton)} ₽</td>
                </tr>
                {result.alternatives.map((a) => (
                  <tr key={a.vehicle_type} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="px-3 py-2.5 text-gray-700 text-xs">{a.label}</td>
                    <td className="px-3 py-2.5 text-gray-600">{a.trips_needed}</td>
                    <td className={`px-3 py-2.5 font-medium ${a.total_cost < result.total_cost ? "text-green-600" : "text-gray-700"}`}>
                      {fmt(a.total_cost)} ₽
                      {a.total_cost < result.total_cost && (
                        <span className="ml-1 text-xs text-green-500">−{fmt(result.total_cost - a.total_cost)}</span>
                      )}
                    </td>
                    <td className="px-3 py-2.5 text-gray-600">{fmt(a.cost_per_ton)} ₽</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      )}

      {comparisonLoading && !comparison && (
        <div className="flex items-center justify-center gap-2 py-8 text-sm text-gray-500">
          <Icon name="Loader2" size={16} className="animate-spin text-primary" />
          Загружаю сравнение транспорта…
        </div>
      )}
    </div>
  );
};
