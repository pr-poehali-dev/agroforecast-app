import React, { useState, useEffect, useCallback } from "react";
import Icon from "@/components/ui/icon";
import { apiCRM } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";
import { KANBAN_STAGES } from "./CrmTypes";

interface DealDetail {
  id: number;
  title?: string;
  stage?: string;
  amount?: number;
  crop?: string;
  volume_t?: number;
  price_per_t?: number;
  region?: string;
  probability?: number;
  health?: number;
  next_step?: string;
  notes?: string;
  contact_name?: string;
  contact_phone?: string;
  contact_email?: string;
  activities?: { id: number; type?: string; title?: string; created_at?: string }[];
}

interface Props {
  dealId: number;
  onClose: () => void;
  onChanged: () => void;
}

export const CrmDealCard: React.FC<Props> = ({ dealId, onClose, onChanged }) => {
  const { toast } = useToast();
  const [data, setData] = useState<DealDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [edit, setEdit] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [form, setForm] = useState<Record<string, string>>({});

  const load = useCallback(() => {
    setLoading(true);
    apiCRM("deals_get", undefined, dealId)
      .then((res) => {
        if (res?.error) throw new Error(res.error);
        const d: DealDetail = res.deal;
        setData(d);
        setForm({
          title: d.title || "", stage: d.stage || "new", amount: String(d.amount ?? ""),
          crop: d.crop || "", volume_t: String(d.volume_t ?? ""), price_per_t: String(d.price_per_t ?? ""),
          region: d.region || "", notes: d.notes || "",
        });
      })
      .catch((e) => toast({ title: "Не удалось открыть сделку", description: String(e.message || e), variant: "destructive" }))
      .finally(() => setLoading(false));
  }, [dealId, toast]);

  useEffect(() => { load(); }, [load]);

  const save = async () => {
    if (!form.title.trim()) {
      toast({ title: "Укажите название сделки", variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      const payload = {
        title: form.title, stage: form.stage, crop: form.crop, region: form.region, notes: form.notes,
        amount: form.amount ? Number(form.amount) : 0,
        volume_t: form.volume_t ? Number(form.volume_t) : null,
        price_per_t: form.price_per_t ? Number(form.price_per_t) : null,
      };
      const res = await apiCRM("deals_update", payload, dealId);
      if (res?.error) throw new Error(res.error);
      toast({ title: "Сохранено" });
      setEdit(false);
      load();
      onChanged();
    } catch (e) {
      toast({ title: "Ошибка сохранения", description: String((e as Error).message), variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const changeStage = async (stage: string) => {
    try {
      const res = await apiCRM("deals_update", { stage }, dealId);
      if (res?.error) throw new Error(res.error);
      setData((p) => (p ? { ...p, stage } : p));
      onChanged();
    } catch (e) {
      toast({ title: "Не удалось сменить стадию", description: String((e as Error).message), variant: "destructive" });
    }
  };

  const remove = async () => {
    if (!confirm("Удалить сделку?")) return;
    setDeleting(true);
    try {
      const res = await apiCRM("deals_delete", {}, dealId);
      if (!res?.success) throw new Error(res?.error || "Не удалось удалить");
      toast({ title: "Сделка удалена" });
      onChanged();
      onClose();
    } catch (e) {
      toast({ title: "Ошибка удаления", description: String((e as Error).message), variant: "destructive" });
      setDeleting(false);
    }
  };

  const inputs: { key: string; label: string; icon: string; type?: string }[] = [
    { key: "title", label: "Название", icon: "Tag" },
    { key: "amount", label: "Сумма, ₽", icon: "Wallet", type: "number" },
    { key: "crop", label: "Культура", icon: "Wheat" },
    { key: "volume_t", label: "Объём, т", icon: "Package", type: "number" },
    { key: "price_per_t", label: "Цена, ₽/т", icon: "Coins", type: "number" },
    { key: "region", label: "Регион", icon: "MapPin" },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[85vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between p-5 border-b border-gray-100 sticky top-0 bg-white">
          <h3 className="font-heading font-bold text-gray-800 flex items-center gap-2">
            <Icon name="Handshake" size={18} className="text-primary" />
            {loading ? "Загрузка…" : data?.title || "Сделка"}
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <Icon name="X" size={20} />
          </button>
        </div>

        {loading ? (
          <div className="p-8 text-center text-gray-400"><Icon name="Loader2" size={28} className="animate-spin mx-auto" /></div>
        ) : !data ? (
          <div className="p-8 text-center text-gray-400 text-sm">Карточка недоступна</div>
        ) : (
          <div className="p-5 space-y-5">
            {/* Стадия */}
            <div>
              <label className="text-[11px] text-gray-400 font-medium ml-1">Стадия</label>
              <select
                value={data.stage || "new"}
                onChange={(e) => changeStage(e.target.value)}
                className="w-full mt-1 px-3 py-2 rounded-lg border border-gray-200 focus:border-primary outline-none text-sm bg-white"
              >
                {KANBAN_STAGES.map((s) => (
                  <option key={s.key} value={s.key}>{s.label}</option>
                ))}
              </select>
            </div>

            {/* Контакт */}
            {data.contact_name && (
              <div className="bg-gray-50 rounded-lg px-3 py-2 text-sm text-gray-700 flex items-center gap-2 flex-wrap">
                <Icon name="User" size={14} className="text-gray-400" />
                <span className="font-medium">{data.contact_name}</span>
                {data.contact_phone && <span className="text-gray-500">· {data.contact_phone}</span>}
                {data.contact_email && <span className="text-gray-500">· {data.contact_email}</span>}
              </div>
            )}

            {/* Поля */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {inputs.map((f) => (
                <div key={f.key} className={f.key === "title" ? "sm:col-span-2" : ""}>
                  <label className="text-[11px] text-gray-400 font-medium ml-1">{f.label}</label>
                  {edit ? (
                    <div className="relative">
                      <Icon name={f.icon} size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
                      <input
                        type={f.type || "text"}
                        value={form[f.key] || ""}
                        onChange={(e) => setForm((p) => ({ ...p, [f.key]: e.target.value }))}
                        className="w-full pl-8 pr-3 py-2 rounded-lg border border-gray-200 focus:border-primary focus:ring-1 focus:ring-primary/20 outline-none text-sm"
                      />
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 text-sm text-gray-700 px-1 py-2">
                      <Icon name={f.icon} size={14} className="text-gray-400" />
                      {f.key === "amount" && data.amount ? `${data.amount.toLocaleString("ru-RU")} ₽`
                        : (data[f.key as keyof DealDetail] as string | number) || "—"}
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* ИИ следующий шаг */}
            {!edit && data.next_step && (
              <div className="bg-amber-50 rounded-lg px-3 py-2.5 flex items-start gap-2">
                <Icon name="Lightbulb" size={15} className="text-amber-500 mt-0.5 shrink-0" />
                <div>
                  <p className="text-xs font-semibold text-gray-700">Следующий шаг</p>
                  <p className="text-xs text-gray-600">{data.next_step}</p>
                </div>
              </div>
            )}

            {/* Заметки */}
            <div>
              <label className="text-[11px] text-gray-400 font-medium ml-1">Заметки</label>
              {edit ? (
                <textarea
                  value={form.notes || ""}
                  onChange={(e) => setForm((p) => ({ ...p, notes: e.target.value }))}
                  rows={3}
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:border-primary outline-none text-sm"
                />
              ) : (
                <p className="text-sm text-gray-600 px-1 py-2 whitespace-pre-wrap">{data.notes || "—"}</p>
              )}
            </div>

            {/* Активности */}
            {!edit && data.activities && data.activities.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-gray-700 mb-2 flex items-center gap-1.5">
                  <Icon name="Activity" size={13} className="text-primary" />История ({data.activities.length})
                </p>
                <div className="space-y-1.5 max-h-40 overflow-y-auto">
                  {data.activities.map((a) => (
                    <div key={a.id} className="flex items-start gap-2 text-xs bg-gray-50 rounded-lg px-3 py-2">
                      <Icon name="Circle" size={10} className="text-gray-400 mt-1 shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-gray-700 truncate">{a.title}</p>
                        {a.created_at && <p className="text-[10px] text-gray-400">{new Date(a.created_at).toLocaleDateString("ru-RU")}</p>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Кнопки */}
            <div className="flex items-center gap-2 pt-2 border-t border-gray-100">
              {edit ? (
                <>
                  <button onClick={save} disabled={saving}
                    className="hero-gradient text-white text-sm font-medium px-4 py-2 rounded-lg flex items-center gap-2 hover:opacity-90 disabled:opacity-50">
                    {saving ? <Icon name="Loader2" size={14} className="animate-spin" /> : <Icon name="Check" size={14} />}
                    Сохранить
                  </button>
                  <button onClick={() => setEdit(false)} className="text-sm text-gray-600 bg-gray-100 hover:bg-gray-200 px-4 py-2 rounded-lg">
                    Отмена
                  </button>
                </>
              ) : (
                <>
                  <button onClick={() => setEdit(true)}
                    className="text-sm font-medium px-4 py-2 rounded-lg flex items-center gap-2 bg-primary/10 text-primary hover:bg-primary/20">
                    <Icon name="Pencil" size={14} />Редактировать
                  </button>
                  <button onClick={remove} disabled={deleting}
                    className="text-sm font-medium px-4 py-2 rounded-lg flex items-center gap-2 bg-red-50 text-red-600 hover:bg-red-100 disabled:opacity-50 ml-auto">
                    {deleting ? <Icon name="Loader2" size={14} className="animate-spin" /> : <Icon name="Trash2" size={14} />}
                    Удалить
                  </button>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CrmDealCard;
