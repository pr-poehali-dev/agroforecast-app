import React, { useState } from "react";
import Icon from "@/components/ui/icon";
import { apiLogistics } from "@/lib/auth";
import { GeoPoint, VehicleType, CargoType, CalcResult, TransportOption } from "./LogisticsTypes";
import { RouteMap } from "./LogisticsRouteMap";
import { LogisticsCalcForm } from "./LogisticsCalcForm";
import { LogisticsResultKpi } from "./LogisticsResultKpi";
import { LogisticsComparison } from "./LogisticsComparison";

// ─── Props ────────────────────────────────────────────────────────────────────

interface LogisticsCalculatorProps {
  vehicleTypes: Record<string, VehicleType>;
  cargoTypes: Record<string, CargoType>;
  loadingRef: boolean;
}

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
  const [saving,   setSaving]   = useState(false);
  const [saveNote, setSaveNote] = useState("");
  const [savedOk,  setSavedOk]  = useState(false);

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

  return (
    <div className="space-y-6">

      {/* ── Форма ── */}
      <LogisticsCalcForm
        fromPoint={fromPoint}
        toPoint={toPoint}
        weightTons={weightTons}
        vehicleType={vehicleType}
        cargoType={cargoType}
        calculating={calculating}
        loadingRef={loadingRef}
        calcError={calcError}
        vehicleTypes={vehicleTypes}
        cargoTypes={cargoTypes}
        onFromChange={setFromPoint}
        onToChange={setToPoint}
        onWeightChange={setWeightTons}
        onVehicleChange={setVehicleType}
        onCargoChange={setCargoType}
        onCalculate={handleCalculate}
      />

      {/* ── Результаты ── */}
      {result && (
        <div className="space-y-4">
          <RouteMap result={result} />

          <LogisticsResultKpi
            result={result}
            saveNote={saveNote}
            saving={saving}
            savedOk={savedOk}
            onSaveNoteChange={setSaveNote}
            onSave={handleSave}
          />

          <LogisticsComparison
            result={result}
            comparison={comparison}
            comparisonLoading={comparisonLoading}
          />
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
