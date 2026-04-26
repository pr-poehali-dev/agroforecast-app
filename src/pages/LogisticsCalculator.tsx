import React, { useState } from "react";
import Icon from "@/components/ui/icon";
import { apiLogistics } from "@/lib/auth";
import { GeoPoint, VehicleType, CargoType, CalcResult, TransportOption, fmt } from "./LogisticsTypes";
import { GeoInput } from "./LogisticsGeoInput";
import { RouteMap } from "./LogisticsRouteMap";

// ─── Props ────────────────────────────────────────────────────────────────────

interface LogisticsCalculatorProps {
  vehicleTypes: Record<string, VehicleType>;
  cargoTypes: Record<string, CargoType>;
  loadingRef: boolean;
}

// ─── Transport mode meta ──────────────────────────────────────────────────────

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

// ─── Component ────────────────────────────────────────────────────────────────

export const LogisticsCalculator: React.FC<LogisticsCalculatorProps> = ({
  vehicleTypes,
  cargoTypes,
  loadingRef,
}) => {
  const [fromPoint,   setFromPoint]   = useState<GeoPoint | null>(null);
  const [toPoint,     setToPoint]     = useState<GeoPoint | null>(null);
  const [weightTons,  setWeightTons]  = useState("20");
  const [vehicleType, setVehicleType] = useState("truck_20t");
  const [cargoType,   setCargoType]   = useState("grain");
  const [calculating, setCalculating] = useState(false);
  const [result,      setResult]      = useState<CalcResult | null>(null);
  const [calcError,   setCalcError]   = useState("");

  // Comparison state
  const [comparison,        setComparison]        = useState<TransportOption[] | null>(null);
  const [comparisonLoading, setComparisonLoading] = useState(false);

  // Save state
  const [saving,    setSaving]    = useState(false);
  const [saveNote,  setSaveNote]  = useState("");
  const [savedOk,   setSavedOk]   = useState(false);

  const canCalculate = fromPoint !== null && toPoint !== null && !calculating && !loadingRef;

  // ── Calculate + fetch comparison ──────────────────────────────────────────
  const handleCalculate = async () => {
    if (!fromPoint || !toPoint) {
      setCalcError("Выберите пункты отправления и назначения из списка");
      return;
    }
    setCalcError("");
    setResult(null);
    setComparison(null);
    setCalculating(true);

    const payload = {
      from_city:    fromPoint.name,
      to_city:      toPoint.name,
      from_lat:     fromPoint.lat,
      from_lon:     fromPoint.lon,
      to_lat:       toPoint.lat,
      to_lon:       toPoint.lon,
      from_region:  fromPoint.region || "",
      to_region:    toPoint.region   || "",
      weight_tons:  parseFloat(weightTons) || 20,
      vehicle_type: vehicleType,
      cargo_type:   cargoType,
    };

    try {
      const res = await apiLogistics("calculate", payload);
      if (res.error) { setCalcError(res.error); return; }
      setResult(res);

      // Fire compare_transport in parallel (non-blocking)
      setComparisonLoading(true);
      apiLogistics("compare_transport", {
        from_city:   fromPoint.name,
        to_city:     toPoint.name,
        from_lat:    fromPoint.lat,
        from_lon:    fromPoint.lon,
        to_lat:      toPoint.lat,
        to_lon:      toPoint.lon,
        weight_tons: parseFloat(weightTons) || 20,
        cargo_type:  cargoType,
      })
        .then((cmp) => { if (cmp?.options) setComparison(cmp.options); })
        .catch(() => {/* graceful — keep null */})
        .finally(() => setComparisonLoading(false));
    } catch {
      setCalcError("Ошибка расчёта, попробуйте снова");
    } finally {
      setCalculating(false);
    }
  };

  const handleSave = async () => {
    if (!result) return;
    setSaving(true);
    try {
      await apiLogistics("routes_save", {
        from_city:     result.from_city,
        to_city:       result.to_city,
        distance_km:   result.distance_km,
        cargo_type:    result.cargo_type,
        weight_tons:   result.weight_tons,
        vehicle_type:  result.vehicle_type,
        cost_estimate: result.total_cost,
        cost_per_ton:  result.cost_per_ton,
        notes:         saveNote,
      });
      setSavedOk(true);
      setTimeout(() => setSavedOk(false), 3000);
      setSaveNote("");
    } catch {
      // ignore
    } finally {
      setSaving(false);
    }
  };

  // ── Helpers ───────────────────────────────────────────────────────────────
  const cheapestCost = comparison ? Math.min(...comparison.map(o => o.cost)) : Infinity;

  return (
    <div className="space-y-6">

      {/* ── Форма ── */}
      <div className="glass-card rounded-2xl p-6">
        <h2 className="text-base font-heading font-semibold text-gray-800 mb-1 flex items-center gap-2">
          <Icon name="Calculator" size={18} className="text-primary" />
          Параметры доставки
        </h2>
        <p className="text-xs text-gray-500 mb-5">
          Введите название города, села, деревни — поиск по всей России через OpenStreetMap
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          <GeoInput
            label="Пункт отправления"
            iconName="MapPin"
            iconColor="text-green-600"
            value={fromPoint}
            onChange={setFromPoint}
            placeholder="Город, село, деревня..."
          />
          <GeoInput
            label="Пункт назначения"
            iconName="Navigation"
            iconColor="text-blue-600"
            value={toPoint}
            onChange={setToPoint}
            placeholder="Город, село, деревня..."
          />

          {/* Вес */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1.5">Объём груза (тонн)</label>
            <div className="relative">
              <Icon name="Weight" size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="number" min="0.1" max="10000" step="0.5"
                value={weightTons}
                onChange={(e) => setWeightTons(e.target.value)}
                className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none text-sm bg-white"
              />
            </div>
          </div>

          {/* Транспорт */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1.5">Вид транспорта</label>
            <div className="relative">
              <Icon name="Truck" size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
              <select
                value={vehicleType}
                onChange={(e) => setVehicleType(e.target.value)}
                className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none text-sm bg-white appearance-none"
              >
                {loadingRef
                  ? <option>Загрузка...</option>
                  : Object.entries(vehicleTypes).map(([k, v]) => (
                      <option key={k} value={k}>{v.label}</option>
                    ))
                }
              </select>
            </div>
          </div>

          {/* Груз */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1.5">Тип груза</label>
            <div className="relative">
              <Icon name="Package" size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
              <select
                value={cargoType}
                onChange={(e) => setCargoType(e.target.value)}
                className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none text-sm bg-white appearance-none"
              >
                {loadingRef
                  ? <option>Загрузка...</option>
                  : Object.entries(cargoTypes).map(([k, v]) => (
                      <option key={k} value={k}>{v.label}</option>
                    ))
                }
              </select>
            </div>
          </div>

          {/* Кнопка */}
          <div className="flex items-end">
            <button
              onClick={handleCalculate}
              disabled={!canCalculate}
              title={!fromPoint || !toPoint ? "Выберите пункты из списка подсказок" : ""}
              className={`w-full font-semibold py-2.5 px-6 rounded-xl flex items-center justify-center gap-2 transition-all text-sm ${
                canCalculate
                  ? "hero-gradient text-white hover:opacity-90 shadow-md hover:shadow-lg cursor-pointer"
                  : "bg-gray-100 text-gray-400 cursor-not-allowed"
              }`}
            >
              {calculating
                ? <Icon name="Loader2" size={16} className="animate-spin" />
                : <Icon name="Route" size={16} />
              }
              {calculating ? "Рассчитываю..." : "Рассчитать маршрут"}
            </button>
          </div>
        </div>

        {(!fromPoint || !toPoint) && !calcError && (
          <div className="mt-4 flex items-start gap-2 text-xs text-gray-500 bg-blue-50 rounded-xl px-4 py-3">
            <Icon name="Info" size={14} className="text-blue-400 flex-shrink-0 mt-0.5" />
            <span>
              Начните вводить название — выберите нужный пункт из выпадающего списка.
              Поиск работает по всем городам, сёлам, деревням и хуторам России.
            </span>
          </div>
        )}

        {calcError && (
          <div className="mt-4 flex items-center gap-2 text-red-600 text-sm bg-red-50 rounded-xl px-4 py-3">
            <Icon name="AlertCircle" size={16} />
            {calcError}
          </div>
        )}
      </div>

      {/* ── Результаты ── */}
      {result && (
        <div className="space-y-4">

          {/* Карта */}
          <RouteMap result={result} />

          {/* KPI */}
          <div className="glass-card rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-5 flex-wrap">
              <div className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                <span className="px-3 py-1.5 bg-green-100 text-green-700 rounded-lg">{result.from_city}</span>
                <Icon name="ArrowRight" size={16} className="text-gray-400" />
                <span className="px-3 py-1.5 bg-blue-100 text-blue-700 rounded-lg">{result.to_city}</span>
              </div>
              <span className="ml-auto text-xs text-gray-500 flex items-center gap-1">
                <Icon name="Milestone" size={13} />
                {result.distance_km} км (с учётом дорог)
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {[
                { label: "Расстояние",        value: `${result.distance_km} км`,        icon: "Milestone",    color: "text-blue-600",   bg: "bg-blue-50" },
                { label: "Стоимость всего",    value: `${fmt(result.total_cost)} ₽`,     icon: "Wallet",       color: "text-primary",    bg: "bg-green-50" },
                { label: "Стоимость за тонну", value: `${fmt(result.cost_per_ton)} ₽/т`, icon: "TrendingDown", color: "text-amber-600",  bg: "bg-amber-50" },
                { label: "Срок доставки",      value: result.transit_days != null ? `${result.transit_days} дн.` : `${result.trips_needed} рейс.`, icon: "Clock", color: "text-purple-600", bg: "bg-purple-50" },
              ].map((k) => (
                <div key={k.label} className={`${k.bg} rounded-xl p-4`}>
                  <div className={`flex items-center gap-2 mb-1 ${k.color}`}>
                    <Icon name={k.icon} size={15} />
                    <span className="text-xs font-medium text-gray-600">{k.label}</span>
                  </div>
                  <div className={`text-lg font-heading font-bold ${k.color}`}>{k.value}</div>
                </div>
              ))}
            </div>

            <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 gap-3 text-sm text-gray-600">
              <div className="flex items-center gap-2">
                <Icon name="Truck"   size={14} className="text-gray-400" />{result.vehicle_label}
              </div>
              <div className="flex items-center gap-2">
                <Icon name="Package" size={14} className="text-gray-400" />{result.cargo_label}
              </div>
              <div className="flex items-center gap-2">
                <Icon name="Weight"  size={14} className="text-gray-400" />{result.weight_tons} т груза
              </div>
            </div>

            {/* Recommendation */}
            {result.recommendation && (
              <div className="mt-4 flex items-start gap-2.5 bg-primary/5 border border-primary/15 rounded-xl px-4 py-3">
                <Icon name="Lightbulb" size={15} className="text-primary shrink-0 mt-0.5" />
                <p className="text-xs text-gray-700 leading-relaxed">
                  <span className="font-semibold text-primary">Рекомендация:</span>{" "}
                  {result.recommendation}
                </p>
              </div>
            )}
          </div>

          {/* ── Сравнение видов транспорта ── */}
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

            {/* New rich comparison from backend */}
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
              /* Fallback: existing alternatives table */
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

          {/* ── Сохранить ── */}
          <div className="glass-card rounded-2xl p-5 border-2 border-primary/10">
            <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
              <Icon name="Bookmark" size={15} className="text-primary" />
              Сохранить маршрут
            </h3>
            <div className="flex gap-3">
              <input
                type="text"
                placeholder="Примечание (необязательно)"
                value={saveNote}
                onChange={(e) => setSaveNote(e.target.value)}
                className="flex-1 px-3 py-2 rounded-xl border border-gray-200 focus:border-primary focus:ring-1 focus:ring-primary/20 outline-none text-sm"
              />
              <button
                onClick={handleSave}
                disabled={saving}
                className="hero-gradient text-white text-sm font-medium px-5 py-2 rounded-xl flex items-center gap-2 hover:opacity-90 disabled:opacity-50"
              >
                {saving
                  ? <Icon name="Loader2" size={14} className="animate-spin" />
                  : <Icon name="Save" size={14} />
                }
                Сохранить
              </button>
            </div>
            {savedOk && (
              <div className="mt-3 flex items-center gap-2 text-green-600 text-sm">
                <Icon name="CheckCircle" size={15} />
                Маршрут сохранён в истории
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Пустое состояние ── */}
      {!result && !calculating && (
        <div className="glass-card rounded-2xl p-8 text-center">
          <div className="w-16 h-16 rounded-2xl hero-gradient flex items-center justify-center mx-auto mb-4">
            <Icon name="Truck" size={28} className="text-white" />
          </div>
          <h3 className="text-base font-heading font-semibold text-gray-800 mb-2">
            Рассчитайте стоимость доставки
          </h3>
          <p className="text-sm text-gray-500 max-w-lg mx-auto">
            Поиск работает по всем населённым пунктам России — городам, сёлам, деревням, станицам и хуторам.
            Введите название и выберите из подсказок.
          </p>
          <div className="mt-5 flex flex-wrap gap-3 justify-center text-xs text-gray-500">
            {["Зерновые", "Подсолнечник", "Кукуруза", "Удобрения", "Сельхозтехника", "Овощи", "Сахарная свёкла"].map((c) => (
              <span key={c} className="px-3 py-1 bg-gray-100 rounded-full">{c}</span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
