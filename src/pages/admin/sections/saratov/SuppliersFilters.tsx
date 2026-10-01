import Icon from "@/components/ui/icon";
import { Facet, Facets } from "./shared";

type Setter<T> = React.Dispatch<React.SetStateAction<T>>;

// ── Панель фильтров базы поставщиков ─────────────────────────────────────────
export default function SuppliersFilters({
  region, setRegion, district, setDistrict, activity, setActivity, ownership, setOwnership,
  crop, setCrop, farmer, setFarmer, priorityOnly, setPriorityOnly, hasEmail, setHasEmail,
  hasPhone, setHasPhone, setPage, facets, activeFilters, resetFilters,
}: {
  region: string; setRegion: Setter<string>;
  district: string; setDistrict: Setter<string>;
  activity: string; setActivity: Setter<string>;
  ownership: string; setOwnership: Setter<string>;
  crop: string; setCrop: Setter<string>;
  farmer: boolean; setFarmer: Setter<boolean>;
  priorityOnly: boolean; setPriorityOnly: Setter<boolean>;
  hasEmail: boolean; setHasEmail: Setter<boolean>;
  hasPhone: boolean; setHasPhone: Setter<boolean>;
  setPage: Setter<number>;
  facets: Facets | null;
  activeFilters: number;
  resetFilters: () => void;
}) {
  return (
    <div className="glass-card rounded-xl p-3 space-y-2.5">
      <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
        <FilterSelect label="Регион" value={region} onChange={v => { setRegion(v); setDistrict(""); setPage(1); }}
          options={facets?.regions || []} placeholder="Вся Россия" />
        <FilterSelect label="Район" value={district} onChange={v => { setDistrict(v); setPage(1); }}
          options={facets?.districts || []} placeholder="Все районы" />
        <FilterSelect label="Вид деятельности" value={activity} onChange={v => { setActivity(v); setPage(1); }}
          options={facets?.activities || []} placeholder="Любая деятельность" />
        <FilterSelect label="Форма собственности" value={ownership} onChange={v => { setOwnership(v); setPage(1); }}
          options={facets?.ownerships || []} placeholder="Любая" />
        <div>
          <label className="block text-[10px] font-medium text-muted-foreground mb-1">Культура / продукция</label>
          <input value={crop} onChange={e => { setCrop(e.target.value); setPage(1); }} placeholder="напр. пшеница"
            className="w-full px-2.5 py-1.5 rounded-lg border border-border bg-background text-xs focus:outline-none focus:border-primary" />
        </div>
      </div>

      {/* Быстрые CRM-фильтры */}
      <div className="flex flex-wrap gap-2">
        <Toggle active={farmer} onClick={() => { setFarmer(f => !f); setPage(1); }} icon="Wheat" label="Только сельхозпроизводители" />
        <Toggle active={priorityOnly} onClick={() => { setPriorityOnly(p => !p); setPage(1); }} icon="Star" label="Районы вокруг Аткарска" />
      <Toggle active={hasEmail} onClick={() => { setHasEmail(p => !p); setPage(1); }} icon="Mail" label="Есть эл. почта" />
      <Toggle active={hasPhone} onClick={() => { setHasPhone(p => !p); setPage(1); }} icon="Phone" label="Есть телефон" />
      </div>

      {activeFilters > 0 && (
        <button onClick={resetFilters} className="flex items-center gap-1 text-[11px] text-primary hover:underline">
          <Icon name="X" size={12} />Сбросить фильтры ({activeFilters})
        </button>
      )}
    </div>
  );
}

// ── Переключатель быстрого фильтра ───────────────────────────────────────────
export function Toggle({ active, onClick, icon, label }: {
  active: boolean; onClick: () => void; icon: string; label: string;
}) {
  return (
    <button onClick={onClick}
      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium ${active ? "bg-primary text-white" : "bg-secondary text-muted-foreground hover:bg-secondary/80"}`}>
      <Icon name={icon} size={13} />{label}
    </button>
  );
}

// ── Выпадающий фильтр ────────────────────────────────────────────────────────
export function FilterSelect({ label, value, onChange, options, placeholder }: {
  label: string; value: string; onChange: (v: string) => void; options: Facet[]; placeholder: string;
}) {
  return (
    <div>
      <label className="block text-[10px] font-medium text-muted-foreground mb-1">{label}</label>
      <select value={value} onChange={e => onChange(e.target.value)}
        className="w-full px-2.5 py-1.5 rounded-lg border border-border bg-background text-xs focus:outline-none focus:border-primary">
        <option value="">{placeholder}</option>
        {options.map(o => (
          <option key={o.value} value={o.value}>{o.value} ({o.count})</option>
        ))}
      </select>
    </div>
  );
}
