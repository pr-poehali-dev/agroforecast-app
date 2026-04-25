import React, { useState, useEffect, useCallback } from "react";
import Icon from "@/components/ui/icon";
import { apiLogistics } from "@/lib/auth";

// ─── Types ───────────────────────────────────────────────────────────────────

interface City {
  name: string;
  lat: number;
  lon: number;
  region: string;
}

interface VehicleType {
  label: string;
  capacity: number;
  rate_per_km: number;
  base: number;
}

interface CargoType {
  label: string;
  surcharge: number;
}

interface CalcResult {
  from_city: string;
  to_city: string;
  from_region: string;
  to_region: string;
  distance_km: number;
  weight_tons: number;
  vehicle_type: string;
  vehicle_label: string;
  cargo_type: string;
  cargo_label: string;
  trips_needed: number;
  cost_per_trip: number;
  total_cost: number;
  cost_per_ton: number;
  cost_per_tkm: number;
  alternatives: {
    vehicle_type: string;
    label: string;
    total_cost: number;
    cost_per_ton: number;
    trips_needed: number;
  }[];
}

interface SavedRoute {
  id: number;
  from_city: string;
  to_city: string;
  distance_km: number;
  cargo_type: string;
  weight_tons: number;
  vehicle_type: string;
  cost_estimate: number;
  cost_per_ton: number;
  status: string;
  notes: string;
  created_at: string;
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

const Sk: React.FC<{ className?: string }> = ({ className = "" }) => (
  <div className={`animate-pulse bg-gray-200 rounded ${className}`} />
);

// ─── Утилиты ──────────────────────────────────────────────────────────────────

const fmt = (n: number) => n.toLocaleString("ru-RU");

// ─── Компонент ────────────────────────────────────────────────────────────────

const SectionLogistics: React.FC = () => {
  const [tab, setTab] = useState<"calculator" | "routes">("calculator");

  // Справочники
  const [cities, setCities] = useState<City[]>([]);
  const [vehicleTypes, setVehicleTypes] = useState<Record<string, VehicleType>>({});
  const [cargoTypes, setCargoTypes] = useState<Record<string, CargoType>>({});
  const [loadingRef, setLoadingRef] = useState(true);

  // Форма расчёта
  const [fromCity, setFromCity] = useState("Москва");
  const [toCity, setToCity] = useState("Ростов-на-Дону");
  const [weightTons, setWeightTons] = useState("20");
  const [vehicleType, setVehicleType] = useState("truck_20t");
  const [cargoType, setCargoType] = useState("grain");
  const [calculating, setCalculating] = useState(false);
  const [result, setResult] = useState<CalcResult | null>(null);
  const [calcError, setCalcError] = useState("");

  // Сохранённые маршруты
  const [routes, setRoutes] = useState<SavedRoute[]>([]);
  const [loadingRoutes, setLoadingRoutes] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveNote, setSaveNote] = useState("");
  const [savedOk, setSavedOk] = useState(false);

  // Поиск города
  const [fromSearch, setFromSearch] = useState("");
  const [toSearch, setToSearch] = useState("");
  const [showFromList, setShowFromList] = useState(false);
  const [showToList, setShowToList] = useState(false);

  useEffect(() => {
    apiLogistics("cities_list")
      .then((res) => {
        setCities(res.cities || []);
        setVehicleTypes(res.vehicle_types || {});
        setCargoTypes(res.cargo_types || {});
      })
      .catch(() => {})
      .finally(() => setLoadingRef(false));
  }, []);

  const loadRoutes = useCallback(() => {
    setLoadingRoutes(true);
    apiLogistics("routes_list")
      .then((res) => setRoutes(res.routes || []))
      .catch(() => setRoutes([]))
      .finally(() => setLoadingRoutes(false));
  }, []);

  useEffect(() => {
    if (tab === "routes") loadRoutes();
  }, [tab, loadRoutes]);

  const handleCalculate = async () => {
    setCalcError("");
    setResult(null);
    if (!fromCity || !toCity) { setCalcError("Выберите города"); return; }
    if (fromCity === toCity) { setCalcError("Города совпадают"); return; }
    setCalculating(true);
    try {
      const res = await apiLogistics("calculate", {
        from_city: fromCity,
        to_city: toCity,
        weight_tons: parseFloat(weightTons) || 20,
        vehicle_type: vehicleType,
        cargo_type: cargoType,
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
        from_city: result.from_city,
        to_city: result.to_city,
        distance_km: result.distance_km,
        cargo_type: result.cargo_type,
        weight_tons: result.weight_tons,
        vehicle_type: result.vehicle_type,
        cost_estimate: result.total_cost,
        cost_per_ton: result.cost_per_ton,
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

  const filteredFrom = cities.filter((c) =>
    c.name.toLowerCase().includes(fromSearch.toLowerCase())
  );
  const filteredTo = cities.filter((c) =>
    c.name.toLowerCase().includes(toSearch.toLowerCase())
  );

  const TABS = [
    { key: "calculator" as const, label: "Калькулятор", icon: "Calculator" },
    { key: "routes" as const, label: "Мои маршруты", icon: "Route" },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="hero-gradient shadow-lg">
        <div className="max-w-screen-2xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between py-4 border-b border-white/15">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-white/15 backdrop-blur-sm border border-white/25 flex items-center justify-center">
                <Icon name="Truck" size={20} className="text-white" />
              </div>
              <div>
                <h1 className="text-lg font-heading font-bold text-white leading-none">
                  Логистика
                </h1>
                <p className="text-white/60 text-xs mt-0.5">
                  Расчёт маршрутов и стоимости доставки
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 text-white/70 text-sm">
              <Icon name="MapPin" size={14} />
              <span className="hidden sm:inline">40 городов России</span>
            </div>
          </div>

          <div className="flex items-center gap-1 py-2">
            {TABS.map((t) => (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium whitespace-nowrap transition-all duration-200 flex-shrink-0 ${
                  tab === t.key
                    ? "bg-white text-primary shadow-md"
                    : "text-white/80 hover:text-white hover:bg-white/15"
                }`}
              >
                <Icon name={t.icon} size={16} />
                <span className="hidden sm:inline">{t.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 py-6">

        {/* ─── Калькулятор ──────────────────────────────────────────────── */}
        {tab === "calculator" && (
          <div className="space-y-6">

            {/* Форма */}
            <div className="glass-card rounded-2xl p-6">
              <h2 className="text-base font-heading font-semibold text-gray-800 mb-5 flex items-center gap-2">
                <Icon name="Calculator" size={18} className="text-primary" />
                Параметры доставки
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">

                {/* Откуда */}
                <div className="relative">
                  <label className="block text-xs font-medium text-gray-600 mb-1.5">
                    Город отправления
                  </label>
                  <div className="relative">
                    <Icon name="MapPin" size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-primary" />
                    <input
                      type="text"
                      value={fromSearch || fromCity}
                      onChange={(e) => { setFromSearch(e.target.value); setShowFromList(true); }}
                      onFocus={() => { setFromSearch(""); setShowFromList(true); }}
                      onBlur={() => setTimeout(() => setShowFromList(false), 150)}
                      placeholder="Введите город..."
                      className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none text-sm bg-white"
                    />
                    {showFromList && filteredFrom.length > 0 && (
                      <div className="absolute z-20 top-full mt-1 w-full bg-white border border-gray-200 rounded-xl shadow-lg max-h-48 overflow-y-auto">
                        {filteredFrom.map((c) => (
                          <button
                            key={c.name}
                            onMouseDown={() => { setFromCity(c.name); setFromSearch(""); setShowFromList(false); }}
                            className="w-full text-left px-3 py-2 text-sm hover:bg-primary/5 flex items-center justify-between"
                          >
                            <span className="font-medium text-gray-800">{c.name}</span>
                            <span className="text-xs text-gray-400">{c.region}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Куда */}
                <div className="relative">
                  <label className="block text-xs font-medium text-gray-600 mb-1.5">
                    Город назначения
                  </label>
                  <div className="relative">
                    <Icon name="Navigation" size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-green-600" />
                    <input
                      type="text"
                      value={toSearch || toCity}
                      onChange={(e) => { setToSearch(e.target.value); setShowToList(true); }}
                      onFocus={() => { setToSearch(""); setShowToList(true); }}
                      onBlur={() => setTimeout(() => setShowToList(false), 150)}
                      placeholder="Введите город..."
                      className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none text-sm bg-white"
                    />
                    {showToList && filteredTo.length > 0 && (
                      <div className="absolute z-20 top-full mt-1 w-full bg-white border border-gray-200 rounded-xl shadow-lg max-h-48 overflow-y-auto">
                        {filteredTo.map((c) => (
                          <button
                            key={c.name}
                            onMouseDown={() => { setToCity(c.name); setToSearch(""); setShowToList(false); }}
                            className="w-full text-left px-3 py-2 text-sm hover:bg-primary/5 flex items-center justify-between"
                          >
                            <span className="font-medium text-gray-800">{c.name}</span>
                            <span className="text-xs text-gray-400">{c.region}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Вес */}
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1.5">
                    Объём груза (тонн)
                  </label>
                  <div className="relative">
                    <Icon name="Weight" size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type="number"
                      min="0.1"
                      max="1000"
                      step="0.5"
                      value={weightTons}
                      onChange={(e) => setWeightTons(e.target.value)}
                      className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none text-sm bg-white"
                    />
                  </div>
                </div>

                {/* Вид транспорта */}
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1.5">
                    Вид транспорта
                  </label>
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

                {/* Тип груза */}
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1.5">
                    Тип груза
                  </label>
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
                    disabled={calculating || loadingRef}
                    className="w-full hero-gradient text-white font-semibold py-2.5 px-6 rounded-xl flex items-center justify-center gap-2 hover:opacity-90 disabled:opacity-50 transition-opacity text-sm"
                  >
                    {calculating ? (
                      <Icon name="Loader2" size={16} className="animate-spin" />
                    ) : (
                      <Icon name="RouteOff" size={16} />
                    )}
                    {calculating ? "Рассчитываю..." : "Рассчитать"}
                  </button>
                </div>
              </div>

              {calcError && (
                <div className="mt-4 flex items-center gap-2 text-red-600 text-sm bg-red-50 rounded-xl px-4 py-3">
                  <Icon name="AlertCircle" size={16} />
                  {calcError}
                </div>
              )}
            </div>

            {/* Результат */}
            {result && (
              <div className="space-y-4">

                {/* Маршрут + основные цифры */}
                <div className="glass-card rounded-2xl p-6">
                  <div className="flex items-center gap-3 mb-5">
                    <div className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                      <span className="px-3 py-1.5 bg-primary/10 text-primary rounded-lg">
                        {result.from_city}
                      </span>
                      <Icon name="ArrowRight" size={16} className="text-gray-400" />
                      <span className="px-3 py-1.5 bg-green-100 text-green-700 rounded-lg">
                        {result.to_city}
                      </span>
                    </div>
                    <span className="ml-auto text-xs text-gray-500 flex items-center gap-1">
                      <Icon name="Milestone" size={13} />
                      {result.distance_km} км (с учётом дорог)
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    {[
                      { label: "Расстояние", value: `${result.distance_km} км`, icon: "Milestone", color: "text-blue-600", bg: "bg-blue-50" },
                      { label: "Стоимость всего", value: `${fmt(result.total_cost)} ₽`, icon: "Wallet", color: "text-primary", bg: "bg-green-50" },
                      { label: "Стоимость за тонну", value: `${fmt(result.cost_per_ton)} ₽/т`, icon: "TrendingDown", color: "text-amber-600", bg: "bg-amber-50" },
                      { label: "Рейсов", value: `${result.trips_needed} шт`, icon: "Repeat", color: "text-purple-600", bg: "bg-purple-50" },
                    ].map((k) => (
                      <div key={k.label} className={`${k.bg} rounded-xl p-4`}>
                        <div className={`flex items-center gap-2 mb-1 ${k.color}`}>
                          <Icon name={k.icon} size={15} />
                          <span className="text-xs font-medium text-gray-600">{k.label}</span>
                        </div>
                        <div className={`text-lg font-heading font-bold ${k.color}`}>
                          {k.value}
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 gap-3 text-sm text-gray-600">
                    <div className="flex items-center gap-2">
                      <Icon name="Truck" size={14} className="text-gray-400" />
                      {result.vehicle_label}
                    </div>
                    <div className="flex items-center gap-2">
                      <Icon name="Package" size={14} className="text-gray-400" />
                      {result.cargo_label}
                    </div>
                    <div className="flex items-center gap-2">
                      <Icon name="Weight" size={14} className="text-gray-400" />
                      {result.weight_tons} т груза
                    </div>
                  </div>
                </div>

                {/* Альтернативы */}
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
                              <th key={h} className="text-left px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                                {h}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {/* Текущий выбор */}
                          <tr className="bg-primary/5 border-b border-primary/10">
                            <td className="px-3 py-2.5 font-medium text-primary text-xs">
                              ✓ {result.vehicle_label}
                            </td>
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
                                  <span className="ml-1 text-xs text-green-500">
                                    −{fmt(result.total_cost - a.total_cost)}
                                  </span>
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

            {/* Подсказка */}
            {!result && !calculating && (
              <div className="glass-card rounded-2xl p-8 text-center">
                <div className="w-16 h-16 rounded-2xl hero-gradient flex items-center justify-center mx-auto mb-4">
                  <Icon name="Truck" size={28} className="text-white" />
                </div>
                <h3 className="text-base font-heading font-semibold text-gray-800 mb-2">
                  Рассчитайте стоимость доставки
                </h3>
                <p className="text-sm text-gray-500 max-w-md mx-auto">
                  Выберите города, тип груза и транспорта. Система рассчитает расстояние по дорогам, стоимость доставки и сравнит альтернативные варианты.
                </p>
                <div className="mt-5 flex flex-wrap gap-3 justify-center text-xs text-gray-500">
                  {["Зерновые", "Подсолнечник", "Кукуруза", "Удобрения", "Сельхозтехника"].map((c) => (
                    <span key={c} className="px-3 py-1 bg-gray-100 rounded-full">{c}</span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ─── Мои маршруты ─────────────────────────────────────────────── */}
        {tab === "routes" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-heading font-semibold text-gray-800">
                История маршрутов
              </h2>
              <button
                onClick={loadRoutes}
                className="text-sm text-primary flex items-center gap-1 hover:underline"
              >
                <Icon name="RefreshCw" size={13} />
                Обновить
              </button>
            </div>

            <div className="glass-card rounded-2xl overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200">
                    {["Маршрут", "Расстояние", "Груз / Тонн", "Транспорт", "Стоимость", "₽/тонна", "Дата"].map((h) => (
                      <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                {loadingRoutes ? (
                  <tbody>
                    {Array.from({ length: 5 }).map((_, i) => (
                      <tr key={i} className="border-b border-gray-100">
                        {Array.from({ length: 7 }).map((_, j) => (
                          <td key={j} className="px-4 py-3"><Sk className="h-4" /></td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                ) : routes.length === 0 ? (
                  <tbody>
                    <tr>
                      <td colSpan={7} className="text-center py-12 text-gray-400">
                        <Icon name="Route" size={32} className="mx-auto mb-2 opacity-30" />
                        <p className="text-sm">Нет сохранённых маршрутов</p>
                        <p className="text-xs mt-1">Рассчитайте маршрут и сохраните его</p>
                      </td>
                    </tr>
                  </tbody>
                ) : (
                  <tbody>
                    {routes.map((r) => (
                      <tr key={r.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1.5 text-gray-800 font-medium">
                            <span>{r.from_city}</span>
                            <Icon name="ArrowRight" size={12} className="text-gray-400" />
                            <span>{r.to_city}</span>
                          </div>
                          {r.notes && <p className="text-xs text-gray-400 mt-0.5">{r.notes}</p>}
                        </td>
                        <td className="px-4 py-3 text-gray-600 whitespace-nowrap">
                          {r.distance_km ? `${r.distance_km} км` : "—"}
                        </td>
                        <td className="px-4 py-3 text-gray-600 whitespace-nowrap">
                          <span className="text-xs bg-gray-100 px-2 py-0.5 rounded-full mr-1">{r.cargo_type}</span>
                          {r.weight_tons} т
                        </td>
                        <td className="px-4 py-3 text-gray-600 text-xs">{r.vehicle_type}</td>
                        <td className="px-4 py-3 font-semibold text-primary whitespace-nowrap">
                          {r.cost_estimate ? `${fmt(r.cost_estimate)} ₽` : "—"}
                        </td>
                        <td className="px-4 py-3 text-gray-600 whitespace-nowrap">
                          {r.cost_per_ton ? `${fmt(r.cost_per_ton)} ₽` : "—"}
                        </td>
                        <td className="px-4 py-3 text-gray-500 text-xs whitespace-nowrap">
                          {new Date(r.created_at).toLocaleDateString("ru-RU", {
                            day: "2-digit", month: "short", year: "numeric",
                          })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                )}
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SectionLogistics;
