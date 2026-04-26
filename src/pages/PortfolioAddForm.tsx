import Icon from "@/components/ui/icon";
import { CROPS, REGIONS, CROP_DATA, calcLocal, fmtM } from "./PortfolioTypes";

interface PortfolioAddFormProps {
  crop: string;
  area: string;
  region: string;
  notes: string;
  customYield: string;
  saving: boolean;
  onCropChange: (v: string) => void;
  onAreaChange: (v: string) => void;
  onRegionChange: (v: string) => void;
  onNotesChange: (v: string) => void;
  onCustomYieldChange: (v: string) => void;
  onSubmit: (e: React.FormEvent) => void;
}

export default function PortfolioAddForm({
  crop, area, region, notes, customYield, saving,
  onCropChange, onAreaChange, onRegionChange, onNotesChange, onCustomYieldChange,
  onSubmit,
}: PortfolioAddFormProps) {
  const areaNum = parseFloat(area) || 0;
  const cyNum = customYield ? parseFloat(customYield) : undefined;
  const preview = areaNum > 0 ? calcLocal(crop, areaNum, cyNum) : null;

  return (
    <div className="glass-card rounded-2xl p-5 space-y-4 h-fit">
      <div className="flex items-center gap-2 mb-1">
        <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center">
          <Icon name="Plus" size={14} className="text-primary" />
        </div>
        <h2 className="font-heading font-bold text-base text-foreground">Добавить культуру</h2>
      </div>

      <form onSubmit={onSubmit} className="space-y-3.5">
        {/* Crop */}
        <div>
          <label className="text-xs text-muted-foreground mb-1.5 block font-medium">Культура</label>
          <select
            value={crop}
            onChange={e => onCropChange(e.target.value)}
            className="w-full text-sm bg-secondary border border-border rounded-lg px-3 py-2 text-foreground focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20 transition"
          >
            {CROPS.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>

        {/* Area */}
        <div>
          <label className="text-xs text-muted-foreground mb-1.5 block font-medium">
            Площадь (га)
          </label>
          <input
            type="number"
            min="0.1"
            step="0.1"
            value={area}
            onChange={e => onAreaChange(e.target.value)}
            placeholder="напр. 500"
            className="w-full text-sm bg-secondary border border-border rounded-lg px-3 py-2 text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20 transition"
            required
          />
        </div>

        {/* Region */}
        <div>
          <label className="text-xs text-muted-foreground mb-1.5 block font-medium">Регион</label>
          <select
            value={region}
            onChange={e => onRegionChange(e.target.value)}
            className="w-full text-sm bg-secondary border border-border rounded-lg px-3 py-2 text-foreground focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20 transition"
          >
            {REGIONS.map(r => <option key={r} value={r}>{r}</option>)}
          </select>
        </div>

        {/* Custom yield (optional) */}
        <div>
          <label className="text-xs text-muted-foreground mb-1.5 block font-medium">
            Урожайность ц/га
            <span className="ml-1 text-[10px] text-muted-foreground/70">
              (необязательно — умолч. {CROP_DATA[crop]?.yield_cha} ц/га)
            </span>
          </label>
          <input
            type="number"
            min="1"
            step="0.1"
            value={customYield}
            onChange={e => onCustomYieldChange(e.target.value)}
            placeholder={String(CROP_DATA[crop]?.yield_cha)}
            className="w-full text-sm bg-secondary border border-border rounded-lg px-3 py-2 text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20 transition"
          />
        </div>

        {/* Notes */}
        <div>
          <label className="text-xs text-muted-foreground mb-1.5 block font-medium">
            Заметки <span className="text-[10px] text-muted-foreground/60">(необязательно)</span>
          </label>
          <textarea
            value={notes}
            onChange={e => onNotesChange(e.target.value)}
            rows={2}
            placeholder="Поле №3, поливной участок…"
            className="w-full text-sm bg-secondary border border-border rounded-lg px-3 py-2 text-foreground placeholder:text-muted-foreground/50 resize-none focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20 transition"
          />
        </div>

        {/* Preview */}
        {preview && (
          <div className="rounded-xl border border-primary/20 bg-primary/5 p-3 space-y-1.5">
            <p className="text-[10px] text-primary/70 uppercase tracking-wider font-mono font-semibold mb-2">
              Предварительный расчёт
            </p>
            <div className="grid grid-cols-3 gap-1.5 text-center">
              <div className="rounded-lg bg-white/70 px-2 py-1.5">
                <p className="text-[9px] text-muted-foreground uppercase tracking-wide">Выручка</p>
                <p className="text-xs font-bold text-foreground font-heading">{fmtM(preview.revenue)}</p>
              </div>
              <div className="rounded-lg bg-white/70 px-2 py-1.5">
                <p className="text-[9px] text-muted-foreground uppercase tracking-wide">Затраты</p>
                <p className="text-xs font-bold text-foreground font-heading">{fmtM(preview.costs)}</p>
              </div>
              <div className="rounded-lg bg-white/70 px-2 py-1.5">
                <p className="text-[9px] text-muted-foreground uppercase tracking-wide">Прибыль</p>
                <p className={`text-xs font-bold font-heading ${preview.profit >= 0 ? "text-emerald-600" : "text-red-500"}`}>
                  {fmtM(preview.profit)}
                </p>
              </div>
            </div>
            <p className="text-center text-[10px] text-muted-foreground">
              ROI <span className="font-semibold text-primary">{preview.roi_pct}%</span>
              &nbsp;·&nbsp;
              Ур-сть <span className="font-semibold">{preview.yield_cha} ц/га</span>
            </p>
          </div>
        )}

        <button
          type="submit"
          disabled={saving || !area || parseFloat(area) <= 0}
          className="w-full py-2.5 bg-primary text-white rounded-xl text-sm font-semibold hover:bg-primary/90 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-sm"
        >
          {saving
            ? <><Icon name="Loader2" size={14} className="animate-spin" />Добавляю…</>
            : <><Icon name="Plus" size={14} />Добавить в портфель</>
          }
        </button>
      </form>
    </div>
  );
}
