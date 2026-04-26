import React from "react";
import Icon from "@/components/ui/icon";
import { GeoPoint, VehicleType, CargoType } from "./LogisticsTypes";
import { GeoInput } from "./LogisticsGeoInput";

interface LogisticsCalcFormProps {
  fromPoint: GeoPoint | null;
  toPoint: GeoPoint | null;
  weightTons: string;
  vehicleType: string;
  cargoType: string;
  calculating: boolean;
  loadingRef: boolean;
  calcError: string;
  vehicleTypes: Record<string, VehicleType>;
  cargoTypes: Record<string, CargoType>;
  onFromChange: (p: GeoPoint | null) => void;
  onToChange: (p: GeoPoint | null) => void;
  onWeightChange: (v: string) => void;
  onVehicleChange: (v: string) => void;
  onCargoChange: (v: string) => void;
  onCalculate: () => void;
}

export const LogisticsCalcForm: React.FC<LogisticsCalcFormProps> = ({
  fromPoint, toPoint, weightTons, vehicleType, cargoType,
  calculating, loadingRef, calcError,
  vehicleTypes, cargoTypes,
  onFromChange, onToChange, onWeightChange, onVehicleChange, onCargoChange,
  onCalculate,
}) => {
  const canCalculate = fromPoint !== null && toPoint !== null && !calculating && !loadingRef;

  return (
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
          onChange={onFromChange}
          placeholder="Город, село, деревня..."
        />
        <GeoInput
          label="Пункт назначения"
          iconName="Navigation"
          iconColor="text-blue-600"
          value={toPoint}
          onChange={onToChange}
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
              onChange={(e) => onWeightChange(e.target.value)}
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
              onChange={(e) => onVehicleChange(e.target.value)}
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
              onChange={(e) => onCargoChange(e.target.value)}
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
            onClick={onCalculate}
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
  );
};
