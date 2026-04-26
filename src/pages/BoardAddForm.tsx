import React from "react";
import Icon from "@/components/ui/icon";
import { CROPS_LIST, REGIONS_LIST } from "./BoardTypes";

interface BoardAddFormProps {
  formType: "sell" | "buy";
  formCrop: string;
  formRegion: string;
  formPrice: string;
  formVolume: string;
  formQuality: string;
  formContact: string;
  formDesc: string;
  saving: boolean;
  onFormType: (v: "sell" | "buy") => void;
  onFormCrop: (v: string) => void;
  onFormRegion: (v: string) => void;
  onFormPrice: (v: string) => void;
  onFormVolume: (v: string) => void;
  onFormQuality: (v: string) => void;
  onFormContact: (v: string) => void;
  onFormDesc: (v: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  onCancel: () => void;
}

export const BoardAddForm: React.FC<BoardAddFormProps> = ({
  formType, formCrop, formRegion, formPrice, formVolume, formQuality, formContact, formDesc,
  saving,
  onFormType, onFormCrop, onFormRegion, onFormPrice, onFormVolume, onFormQuality,
  onFormContact, onFormDesc, onSubmit, onCancel,
}) => {
  return (
    <div className="glass-card rounded-2xl p-5 border-2 border-primary/15">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center">
          <Icon name="Plus" size={14} className="text-primary" />
        </div>
        <h3 className="font-heading font-bold text-sm text-foreground">Новое объявление</h3>
      </div>

      <form onSubmit={onSubmit} className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {/* Type */}
        <div className="lg:col-span-3">
          <label className="text-xs text-muted-foreground mb-1.5 block font-medium">Тип сделки</label>
          <div className="flex gap-2">
            {(["sell", "buy"] as const).map(t => (
              <button type="button" key={t} onClick={() => onFormType(t)}
                className={`flex-1 py-2.5 text-xs font-semibold rounded-xl border transition-all flex items-center justify-center gap-1.5 ${
                  formType === t
                    ? t === "sell"
                      ? "bg-emerald-50 text-emerald-700 border-emerald-300"
                      : "bg-blue-50 text-blue-700 border-blue-300"
                    : "bg-secondary text-muted-foreground border-border hover:border-primary/30"
                }`}
              >
                <Icon name={t === "sell" ? "TrendingUp" : "ShoppingCart"} size={12} />
                {t === "sell" ? "Продажа" : "Покупка"}
              </button>
            ))}
          </div>
        </div>

        {/* Crop */}
        <div>
          <label className="text-xs text-muted-foreground mb-1.5 block font-medium">Культура</label>
          <select value={formCrop} onChange={e => onFormCrop(e.target.value)}
            className="w-full text-sm bg-secondary border border-border rounded-lg px-3 py-2 text-foreground focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20 transition">
            {CROPS_LIST.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>

        {/* Region */}
        <div>
          <label className="text-xs text-muted-foreground mb-1.5 block font-medium">Регион</label>
          <select value={formRegion} onChange={e => onFormRegion(e.target.value)}
            className="w-full text-sm bg-secondary border border-border rounded-lg px-3 py-2 text-foreground focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20 transition">
            {REGIONS_LIST.map(r => <option key={r} value={r}>{r}</option>)}
          </select>
        </div>

        {/* Price */}
        <div>
          <label className="text-xs text-muted-foreground mb-1.5 block font-medium">Цена ₽/т <span className="text-destructive">*</span></label>
          <input required type="number" min="1" step="100" value={formPrice} onChange={e => onFormPrice(e.target.value)}
            placeholder="напр. 13500"
            className="w-full text-sm bg-secondary border border-border rounded-lg px-3 py-2 text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20 transition" />
        </div>

        {/* Volume */}
        <div>
          <label className="text-xs text-muted-foreground mb-1.5 block font-medium">Объём (т) <span className="text-muted-foreground/50">(необяз.)</span></label>
          <input type="number" min="0.1" step="0.5" value={formVolume} onChange={e => onFormVolume(e.target.value)}
            placeholder="напр. 200"
            className="w-full text-sm bg-secondary border border-border rounded-lg px-3 py-2 text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20 transition" />
        </div>

        {/* Quality */}
        <div>
          <label className="text-xs text-muted-foreground mb-1.5 block font-medium">Качество / класс</label>
          <input type="text" value={formQuality} onChange={e => onFormQuality(e.target.value)}
            placeholder="3 класс, влажность 14%..."
            className="w-full text-sm bg-secondary border border-border rounded-lg px-3 py-2 text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20 transition" />
        </div>

        {/* Contact */}
        <div>
          <label className="text-xs text-muted-foreground mb-1.5 block font-medium">Контакт</label>
          <input type="text" value={formContact} onChange={e => onFormContact(e.target.value)}
            placeholder="+7 900 000-00-00 или email"
            className="w-full text-sm bg-secondary border border-border rounded-lg px-3 py-2 text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20 transition" />
        </div>

        {/* Description */}
        <div className="sm:col-span-2 lg:col-span-2">
          <label className="text-xs text-muted-foreground mb-1.5 block font-medium">Описание</label>
          <textarea value={formDesc} onChange={e => onFormDesc(e.target.value)} rows={2}
            placeholder="Район, условия, самовывоз или доставка..."
            className="w-full text-sm bg-secondary border border-border rounded-lg px-3 py-2 text-foreground placeholder:text-muted-foreground/50 resize-none focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20 transition" />
        </div>

        {/* Submit */}
        <div className="lg:col-span-3 flex gap-3">
          <button type="submit" disabled={saving || !formPrice}
            className="flex items-center gap-2 px-6 py-2.5 bg-primary text-white text-sm font-semibold rounded-xl hover:bg-primary/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed">
            {saving ? <Icon name="Loader2" size={14} className="animate-spin" /> : <Icon name="Send" size={14} />}
            {saving ? "Публикую…" : "Опубликовать"}
          </button>
          <button type="button" onClick={onCancel}
            className="px-4 py-2.5 text-sm text-muted-foreground border border-border rounded-xl hover:text-foreground transition-colors">
            Отмена
          </button>
        </div>
      </form>
    </div>
  );
};
