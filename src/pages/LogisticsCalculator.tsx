import React, { useState } from "react";
import Icon from "@/components/ui/icon";
import { apiLogistics } from "@/lib/auth";
import { GeoPoint, VehicleType, CargoType, CalcResult, fmt } from "./LogisticsTypes";
import { GeoInput } from "./LogisticsGeoInput";
import { RouteMap } from "./LogisticsRouteMap";

// ─── Props ────────────────────────────────────────────────────────────────────

interface LogisticsCalculatorProps {
  vehicleTypes: Record<string, VehicleType>;
  cargoTypes: Record<string, CargoType>;
  loadingRef: boolean;
}

// ─── Компонент ────────────────────────────────────────────────────────────────

export const LogisticsCalculator: React.FC<LogisticsCalculatorProps> = ({
  vehicleTypes,
  cargoTypes,
  loadingRef,
}) => {
  const [fromPoint, setFromPoint] = useState<GeoPoint | null>(null);
  const [toPoint, setToPoint]     = useState<GeoPoint | null>(null);
  const [weightTons, setWeightTons]     = useState("20");
  const [vehicleType, setVehicleType]   = useState("truck_20t");
  const [cargoType, setCargoType]       = useState("grain");
  const [calculating, setCalculating]   = useState(false);
  const [result, setResult]             = useState<CalcResult | null>(null);
  const [calcError, setCalcError]       = useState("");

  const [saving, setSaving]   = useState(false);
  const [saveNote, setSaveNote] = useState("");
  const [savedOk, setSavedOk]   = useState(false);

  const canCalculate = fromPoint !== null && toPoint !== null && !calculating && !loadingRef;

  const handleCalculate = async () => {
    if (!fromPoint || !toPoint) {
      setCalcError("Выберите пункты отправления и назначения из списка");
      return;
    }
    setCalcError("");
    setResult(null);
    setCalculating(true);
    try {
      const res = await apiLogistics("calculate", {
        from_city:   fromPoint.name,
        to_city:     toPoint.name,
        from_lat:    fromPoint.lat,
        from_lon:    fromPoint.lon,
        to_lat:      toPoint.lat,
        to_lon:      toPoint.lon,
        from_region: fromPoint.region || "",
        to_region:   toPoint.region || "",
        weight_tons: parseFloat(weightTons) || 20,
        vehicle_type: vehicleType,
        cargo_type:   cargoType,
      });
      if (res.error) { setCalcError(res.error); return; }
      setResult(res);
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
        from_city:    result.from_city,
        to_city:      result.to_city,
        distance_km:  result.distance_km,
        cargo_type:   result.cargo_type,
        weight_tons:  result.weight_tons,
        vehicle_type: result.vehicle_type,
        cost_estimate: result.total_cost,
        cost_per_ton:  result.cost_per_ton,
        notes: saveNote,
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

  return (
    <div className="space-y-6">

      {/* Форма */}
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
              {calculating ? (
                <Icon name="Loader2" size={16} className="animate-spin" />
              ) : (
                <Icon name="Route" size={16} />
              )}
              {calculating ? "Рассчитываю..." : "Рассчитать маршрут"}
            </button>
          </div>
        </div>

        {/* Подсказка про геокодер */}
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

      {/* ── Результат ── */}
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
                { label: "Рейсов",             value: `${result.trips_needed} шт`,       icon: "Repeat",       color: "text-purple-600", bg: "bg-purple-50" },
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
              <div className="flex items-center gap-2"><Icon name="Truck"   size={14} className="text-gray-400" />{result.vehicle_label}</div>
              <div className="flex items-center gap-2"><Icon name="Package" size={14} className="text-gray-400" />{result.cargo_label}</div>
              <div className="flex items-center gap-2"><Icon name="Weight"  size={14} className="text-gray-400" />{result.weight_tons} т груза</div>
            </div>
          </div>

          {/* Сравнение транспорта */}
          {result.alternatives.length > 0 && (
            <div className="glass-card rounded-2xl p-6">
              <h3 className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2">
                <Icon name="GitCompare" size={16} className="text-primary" />
                Сравнение транспорта
              </h3>
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
            </div>
          )}

          {/* Сохранить */}
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
                {saving ? <Icon name="Loader2" size={14} className="animate-spin" /> : <Icon name="Save" size={14} />}
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

      {/* Пустое состояние */}
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
            {[
              "Зерновые", "Подсолнечник", "Кукуруза", "Удобрения",
              "Сельхозтехника", "Овощи", "Сахарная свёкла",
            ].map((c) => (
              <span key={c} className="px-3 py-1 bg-gray-100 rounded-full">{c}</span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
