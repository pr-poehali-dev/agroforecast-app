import { useState } from "react";
import { adminApi } from "@/lib/adminApi";
import Icon from "@/components/ui/icon";
import { Supplier, STATUS_LABELS, emptyForm } from "./shared";

// ── Модалка карточки поставщика ──────────────────────────────────────────────
export default function SupplierModal({ item, onClose, onSave }: {
  item: Partial<Supplier> | null; onClose: () => void; onSave: () => void;
}) {
  const [form, setForm] = useState<Record<string, unknown>>(
    item?.id ? { ...emptyForm(), ...item, volume_tons: item.volume_tons ?? "" } : emptyForm()
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const set = (k: string, v: unknown) => setForm(f => ({ ...f, [k]: v }));

  const save = async () => {
    if (!String(form.name).trim()) { setError("Название хозяйства обязательно"); return; }
    setSaving(true); setError("");
    const payload = { ...form, volume_tons: form.volume_tons === "" ? null : Number(form.volume_tons) };
    try {
      if (item?.id) await adminApi.updateSupplier(item.id, payload);
      else await adminApi.createSupplier(payload);
      onSave();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Ошибка");
    } finally { setSaving(false); }
  };

  const inputCls = "w-full px-3 py-2 rounded-xl border border-border bg-background text-sm focus:outline-none focus:border-primary";
  const lblCls = "block text-xs font-medium text-muted-foreground mb-1.5";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="bg-background rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-5 border-b border-border">
          <h3 className="font-heading font-bold text-base">{item?.id ? "Редактировать хозяйство" : "Новое хозяйство"}</h3>
          <button onClick={onClose}><Icon name="X" size={18} className="text-muted-foreground" /></button>
        </div>
        <div className="p-5 space-y-4">
          <div>
            <label className={lblCls}>Название хозяйства *</label>
            <input value={String(form.name)} onChange={e => set("name", e.target.value)} className={inputCls} placeholder="ООО «Агро», КФХ Иванов И.И." />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className={lblCls}>ИНН</label>
              <input value={String(form.inn)} onChange={e => set("inn", e.target.value)} className={inputCls} placeholder="6440012345" /></div>
            <div><label className={lblCls}>Район</label>
              <input value={String(form.district)} onChange={e => set("district", e.target.value)} className={inputCls} placeholder="Аткарский" /></div>
            <div><label className={lblCls}>Населённый пункт</label>
              <input value={String(form.locality)} onChange={e => set("locality", e.target.value)} className={inputCls} placeholder="с. Елизаветино" /></div>
            <div><label className={lblCls}>Культуры</label>
              <input value={String(form.crops)} onChange={e => set("crops", e.target.value)} className={inputCls} placeholder="Подсолнечник, пшеница" /></div>
            <div><label className={lblCls}>Объём, тонн</label>
              <input type="number" value={String(form.volume_tons)} onChange={e => set("volume_tons", e.target.value)} className={inputCls} placeholder="1500" /></div>
            <div><label className={lblCls}>Статус</label>
              <select value={String(form.status)} onChange={e => set("status", e.target.value)} className={inputCls}>
                {Object.entries(STATUS_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
              </select></div>
            <div><label className={lblCls}>Контактное лицо</label>
              <input value={String(form.contact_person)} onChange={e => set("contact_person", e.target.value)} className={inputCls} placeholder="Иван Петров" /></div>
            <div><label className={lblCls}>Телефон</label>
              <input value={String(form.phone)} onChange={e => set("phone", e.target.value)} className={inputCls} placeholder="+7 900 000-00-00" /></div>
            <div><label className={lblCls}>Email</label>
              <input value={String(form.email)} onChange={e => set("email", e.target.value)} className={inputCls} placeholder="agro@mail.ru" /></div>
            <div><label className={lblCls}>Адрес</label>
              <input value={String(form.address)} onChange={e => set("address", e.target.value)} className={inputCls} placeholder="г. Аткарск, ул. …" /></div>
            <div><label className={lblCls}>Почтовый индекс</label>
              <input value={String(form.postal_code)} onChange={e => set("postal_code", e.target.value)} className={inputCls} placeholder="412420" /></div>
            <div><label className={lblCls}>Форма собственности</label>
              <input value={String(form.ownership)} onChange={e => set("ownership", e.target.value)} className={inputCls} placeholder="ООО / АО / КФХ" /></div>
            <div><label className={lblCls}>Сайт</label>
              <input value={String(form.website)} onChange={e => set("website", e.target.value)} className={inputCls} placeholder="agro.ru" /></div>
            <div><label className={lblCls}>Факс</label>
              <input value={String(form.fax)} onChange={e => set("fax", e.target.value)} className={inputCls} placeholder="+7 …" /></div>
            <div><label className={lblCls}>Выручка</label>
              <input value={String(form.revenue)} onChange={e => set("revenue", e.target.value)} className={inputCls} placeholder="120 млн ₽" /></div>
            <div><label className={lblCls}>Численность</label>
              <input value={String(form.staff_count)} onChange={e => set("staff_count", e.target.value)} className={inputCls} placeholder="45" /></div>
            <div><label className={lblCls}>Год основания</label>
              <input value={String(form.founded_year)} onChange={e => set("founded_year", e.target.value)} className={inputCls} placeholder="2005" /></div>
          </div>
          <div>
            <label className={lblCls}>Направление деятельности</label>
            <input value={String(form.activity)} onChange={e => set("activity", e.target.value)} className={inputCls} placeholder="Растениеводство, доп. услуги" />
          </div>
          <div>
            <label className={lblCls}>Заметки</label>
            <textarea value={String(form.notes)} rows={2} onChange={e => set("notes", e.target.value)} className={`${inputCls} resize-none`} placeholder="Комментарий по предприятию" />
          </div>
          {error && <p className="text-xs text-destructive">{error}</p>}
          <div className="flex gap-3 pt-2">
            <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-border text-sm font-medium hover:bg-secondary">Отмена</button>
            <button onClick={save} disabled={saving} className="flex-1 py-2.5 rounded-xl hero-gradient text-white text-sm font-medium disabled:opacity-60 flex items-center justify-center gap-2">
              {saving ? <><Icon name="Loader" size={14} className="animate-spin" />Сохранение…</> : "Сохранить"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
