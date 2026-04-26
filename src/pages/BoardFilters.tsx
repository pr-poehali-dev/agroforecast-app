import React from "react";
import Icon from "@/components/ui/icon";
import { CROPS_LIST, REGIONS_LIST } from "./BoardTypes";

interface BoardFiltersProps {
  filterType: "" | "sell" | "buy";
  filterCrop: string;
  filterRegion: string;
  filterPriceMin: string;
  filterPriceMax: string;
  sortBy: string;
  hasFilters: boolean;
  onFilterType: (v: "" | "sell" | "buy") => void;
  onFilterCrop: (v: string) => void;
  onFilterRegion: (v: string) => void;
  onFilterPriceMin: (v: string) => void;
  onFilterPriceMax: (v: string) => void;
  onSortBy: (v: string) => void;
  onReset: () => void;
  onShowForm: () => void;
}

export const BoardFilters: React.FC<BoardFiltersProps> = ({
  filterType, filterCrop, filterRegion, filterPriceMin, filterPriceMax, sortBy,
  hasFilters,
  onFilterType, onFilterCrop, onFilterRegion, onFilterPriceMin, onFilterPriceMax,
  onSortBy, onReset, onShowForm,
}) => {
  return (
    <div className="glass-card rounded-2xl p-4 space-y-3">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <h2 className="font-heading font-semibold text-sm text-foreground flex items-center gap-2">
          <Icon name="SlidersHorizontal" size={14} className="text-primary" />
          Фильтры
        </h2>
        <div className="flex gap-2">
          {hasFilters && (
            <button onClick={onReset} className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors">
              <Icon name="X" size={12} />Сбросить
            </button>
          )}
          <button
            onClick={onShowForm}
            className="flex items-center gap-1.5 px-4 py-2 bg-primary text-white text-xs font-semibold rounded-xl hover:bg-primary/90 transition-colors"
          >
            <Icon name="Plus" size={13} />
            Подать объявление
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
        {/* Type */}
        <div className="flex gap-1 col-span-2 sm:col-span-1">
          {(["", "sell", "buy"] as const).map(t => (
            <button
              key={t}
              onClick={() => onFilterType(t)}
              className={`flex-1 py-2 text-[11px] font-semibold rounded-lg border transition-all ${
                filterType === t
                  ? t === "sell"
                    ? "bg-emerald-50 text-emerald-700 border-emerald-300"
                    : t === "buy"
                    ? "bg-blue-50 text-blue-700 border-blue-300"
                    : "bg-primary/10 text-primary border-primary/30"
                  : "bg-secondary text-muted-foreground border-border hover:border-primary/30"
              }`}
            >
              {t === "" ? "Все" : t === "sell" ? "Продажа" : "Покупка"}
            </button>
          ))}
        </div>

        {/* Crop */}
        <select
          value={filterCrop}
          onChange={e => onFilterCrop(e.target.value)}
          className="text-xs bg-secondary border border-border rounded-lg px-3 py-2 text-foreground focus:outline-none focus:border-primary/50 transition"
        >
          <option value="">Все культуры</option>
          {CROPS_LIST.map(c => <option key={c} value={c}>{c}</option>)}
        </select>

        {/* Region */}
        <select
          value={filterRegion}
          onChange={e => onFilterRegion(e.target.value)}
          className="text-xs bg-secondary border border-border rounded-lg px-3 py-2 text-foreground focus:outline-none focus:border-primary/50 transition"
        >
          <option value="">Все регионы</option>
          {REGIONS_LIST.map(r => <option key={r} value={r}>{r}</option>)}
        </select>

        {/* Price min */}
        <input
          type="number" min="0" step="500"
          value={filterPriceMin}
          onChange={e => onFilterPriceMin(e.target.value)}
          placeholder="Цена от ₽/т"
          className="text-xs bg-secondary border border-border rounded-lg px-3 py-2 text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary/50 transition"
        />

        {/* Price max */}
        <input
          type="number" min="0" step="500"
          value={filterPriceMax}
          onChange={e => onFilterPriceMax(e.target.value)}
          placeholder="Цена до ₽/т"
          className="text-xs bg-secondary border border-border rounded-lg px-3 py-2 text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary/50 transition"
        />

        {/* Sort */}
        <select
          value={sortBy}
          onChange={e => onSortBy(e.target.value)}
          className="text-xs bg-secondary border border-border rounded-lg px-3 py-2 text-foreground focus:outline-none focus:border-primary/50 transition"
        >
          <option value="newest">Новые сначала</option>
          <option value="price_asc">Цена: дешевле</option>
          <option value="price_desc">Цена: дороже</option>
        </select>
      </div>
    </div>
  );
};
