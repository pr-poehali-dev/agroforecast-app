import React, { useState, useEffect, useCallback } from "react";
import Icon from "@/components/ui/icon";
import { apiLogistics } from "@/lib/auth";
import { VehicleType, CargoType, SavedRoute, fmt } from "./LogisticsTypes";
import { LogisticsCalculator } from "./LogisticsCalculator";

// ─── SectionLogistics ─────────────────────────────────────────────────────────

const SectionLogistics: React.FC = () => {
  const [tab, setTab] = useState<"calculator" | "routes">("calculator");

  const [vehicleTypes, setVehicleTypes] = useState<Record<string, VehicleType>>({});
  const [cargoTypes, setCargoTypes]     = useState<Record<string, CargoType>>({});
  const [loadingRef, setLoadingRef]     = useState(true);

  const [routes, setRoutes]               = useState<SavedRoute[]>([]);
  const [loadingRoutes, setLoadingRoutes] = useState(false);

  useEffect(() => {
    apiLogistics("cities_list")
      .then((res) => {
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

  const TABS = [
    { key: "calculator" as const, label: "Калькулятор", icon: "Calculator" },
    { key: "routes" as const,     label: "Мои маршруты", icon: "Route" },
  ];

  return (
    <div className="min-h-screen bg-background">

      {/* ── Header ── */}
      <div className="hero-gradient shadow-lg">
        <div className="max-w-screen-2xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between py-4 border-b border-white/15">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-white/15 backdrop-blur-sm border border-white/25 flex items-center justify-center">
                <Icon name="Truck" size={20} className="text-white" />
              </div>
              <div>
                <h1 className="text-lg font-heading font-bold text-white leading-none">Логистика</h1>
                <p className="text-white/60 text-xs mt-0.5">Расчёт маршрутов и стоимости доставки</p>
              </div>
            </div>
            <div className="flex items-center gap-2 text-white/70 text-sm">
              <Icon name="Globe" size={14} />
              <span className="hidden sm:inline">Все населённые пункты России</span>
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
          <LogisticsCalculator
            vehicleTypes={vehicleTypes}
            cargoTypes={cargoTypes}
            loadingRef={loadingRef}
          />
        )}

        {/* ─── Мои маршруты ─────────────────────────────────────────────── */}
        {tab === "routes" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-heading font-semibold text-gray-800">История маршрутов</h2>
              <button onClick={loadRoutes} className="text-sm text-primary flex items-center gap-1 hover:underline">
                <Icon name="RefreshCw" size={13} />
                Обновить
              </button>
            </div>

            <div className="glass-card rounded-2xl overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200">
                    {["Маршрут", "Расстояние", "Груз / Тонн", "Транспорт", "Стоимость", "₽/тонна", "Дата"].map((h) => (
                      <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                {loadingRoutes ? (
                  <tbody>
                    {Array.from({ length: 5 }).map((_, i) => (
                      <tr key={i} className="border-b border-gray-100">
                        {Array.from({ length: 7 }).map((_, j) => (
                          <td key={j} className="px-4 py-3">
                            <div className="animate-pulse bg-gray-200 rounded h-4" />
                          </td>
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
