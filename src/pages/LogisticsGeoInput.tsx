import React, { useState, useEffect, useRef } from "react";
import Icon from "@/components/ui/icon";
import { GeoPoint, geocode } from "./LogisticsTypes";

// ─── GeoInput — поле с автодополнением (Nominatim) ───────────────────────────

export interface GeoInputProps {
  label: string;
  iconName: string;
  iconColor: string;
  value: GeoPoint | null;
  onChange: (p: GeoPoint | null) => void;
  placeholder?: string;
}

export const GeoInput: React.FC<GeoInputProps> = ({
  label, iconName, iconColor, value, onChange, placeholder = "Введите населённый пункт...",
}) => {
  const [query, setQuery] = useState(value?.display || "");
  const [suggestions, setSuggestions] = useState<GeoPoint[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Синхронизируем query когда снаружи сбросили value
  useEffect(() => {
    setQuery(value?.display || "");
  }, [value]);

  const handleChange = (q: string) => {
    setQuery(q);
    onChange(null);
    if (timerRef.current) clearTimeout(timerRef.current);
    if (q.length < 2) { setSuggestions([]); setOpen(false); return; }
    timerRef.current = setTimeout(async () => {
      setLoading(true);
      const results = await geocode(q);
      setSuggestions(results);
      setOpen(results.length > 0);
      setLoading(false);
    }, 350);
  };

  const handleSelect = (p: GeoPoint) => {
    setQuery(p.display);
    onChange(p);
    setOpen(false);
    setSuggestions([]);
  };

  return (
    <div>
      <label className="block text-xs font-medium text-gray-600 mb-1.5">{label}</label>
      <div className="relative">
        {loading
          ? <Icon name="Loader2" size={15} className={`absolute left-3 top-1/2 -translate-y-1/2 animate-spin text-gray-400`} />
          : <Icon name={iconName} size={15} className={`absolute left-3 top-1/2 -translate-y-1/2 ${iconColor}`} />
        }
        <input
          type="text"
          value={query}
          onChange={(e) => handleChange(e.target.value)}
          onFocus={() => suggestions.length > 0 && setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 200)}
          placeholder={placeholder}
          autoComplete="off"
          className={`w-full pl-9 pr-9 py-2.5 rounded-xl border text-sm bg-white outline-none transition-all ${
            value
              ? "border-green-400 focus:ring-2 focus:ring-green-200"
              : "border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20"
          }`}
        />
        {value && (
          <button
            onClick={() => { onChange(null); setQuery(""); setSuggestions([]); }}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            <Icon name="X" size={14} />
          </button>
        )}
        {value && !open && (
          <span className="absolute right-8 top-1/2 -translate-y-1/2">
            <Icon name="CheckCircle" size={14} className="text-green-500" />
          </span>
        )}

        {open && suggestions.length > 0 && (
          <div className="absolute z-50 top-full mt-1 w-full bg-white border border-gray-200 rounded-xl shadow-xl max-h-56 overflow-y-auto">
            {suggestions.map((s, i) => (
              <button
                key={i}
                onMouseDown={() => handleSelect(s)}
                className="w-full text-left px-3 py-2.5 text-sm hover:bg-primary/5 border-b border-gray-50 last:border-0 flex flex-col gap-0.5"
              >
                <span className="font-medium text-gray-800">{s.name}</span>
                <span className="text-xs text-gray-400 truncate">{s.display}</span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
