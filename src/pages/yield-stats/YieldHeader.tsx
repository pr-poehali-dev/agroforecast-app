import Icon from "@/components/ui/icon";
import { CROP_ICONS, Meta } from "./types";

interface Stats {
  avg: string;
  max: string;
  min: string;
  totalHarvest: string;
  totalArea: string;
}

interface Props {
  meta: Meta | null;
  crop: string;
  setCrop: (c: string) => void;
  year: number;
  setYear: (y: number) => void;
  stats: Stats | null;
}

export default function YieldHeader({ meta, crop, setCrop, year, setYear, stats }: Props) {
  return (
    <>
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <Icon name="BarChart3" size={16} className="text-primary" />
          <span className="font-semibold text-sm">Статистика урожайности по годам</span>
        </div>
        <select
          value={year}
          onChange={(e) => setYear(Number(e.target.value))}
          className="bg-secondary border border-border rounded-md px-3 py-1.5 text-xs font-mono"
        >
          {(meta?.years || [2024]).map((y) => (
            <option key={y} value={y}>{y} год</option>
          ))}
        </select>
      </div>

      <div>
        <div className="text-[10px] font-medium text-muted-foreground mb-2 uppercase tracking-wider">Выберите культуру</div>
        <div className="flex gap-2 flex-wrap">
          {(meta?.crops || ["Пшеница озимая"]).map((c) => {
            const active = c === crop;
            return (
              <button
                key={c}
                onClick={() => setCrop(c)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg border-2 text-xs font-semibold transition-all ${
                  active
                    ? "bg-primary text-primary-foreground border-primary shadow-md"
                    : "bg-secondary/50 border-border text-foreground hover:border-primary/50 hover:bg-secondary"
                }`}
              >
                <Icon name={CROP_ICONS[c] || "Wheat"} size={14} />
                {c}
              </button>
            );
          })}
        </div>
      </div>

      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
          {[
            { label: "Средняя", value: `${stats.avg} ц/га`, icon: "Activity" },
            { label: "Максимум", value: `${stats.max} ц/га`, icon: "TrendingUp" },
            { label: "Минимум", value: `${stats.min} ц/га`, icon: "TrendingDown" },
            { label: "Валовой сбор", value: `${stats.totalHarvest} млн т`, icon: "Wheat" },
            { label: "Площадь", value: `${stats.totalArea} млн га`, icon: "Map" },
          ].map((s) => (
            <div key={s.label} className="bg-secondary/40 rounded-lg p-2.5">
              <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground mb-1">
                <Icon name={s.icon} size={11} />
                {s.label}
              </div>
              <div className="font-mono font-bold text-sm">{s.value}</div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
