import React from "react";
import Icon from "@/components/ui/icon";
import { CalcResult, fmt } from "./LogisticsTypes";

interface LogisticsResultKpiProps {
  result: CalcResult;
  saveNote: string;
  saving: boolean;
  savedOk: boolean;
  onSaveNoteChange: (v: string) => void;
  onSave: () => void;
}

export const LogisticsResultKpi: React.FC<LogisticsResultKpiProps> = ({
  result, saveNote, saving, savedOk, onSaveNoteChange, onSave,
}) => {
  return (
    <>
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
            {
              label: "Срок доставки",
              value: result.transit_days != null ? `${result.transit_days} дн.` : `${result.trips_needed} рейс.`,
              icon: "Clock", color: "text-purple-600", bg: "bg-purple-50",
            },
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
            onChange={(e) => onSaveNoteChange(e.target.value)}
            className="flex-1 px-3 py-2 rounded-xl border border-gray-200 focus:border-primary focus:ring-1 focus:ring-primary/20 outline-none text-sm"
          />
          <button
            onClick={onSave}
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
    </>
  );
};
