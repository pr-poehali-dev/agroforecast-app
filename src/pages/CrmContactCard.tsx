import React, { useState, useEffect, useCallback } from "react";
import Icon from "@/components/ui/icon";
import { apiCRM } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";

interface ContactDetail {
  id: number;
  name?: string;
  full_name?: string;
  phone?: string;
  email?: string;
  company?: string;
  position?: string;
  region?: string;
  status?: string;
  notes?: string;
  activities?: { id: number; type?: string; title?: string; created_at?: string }[];
  deals?: { id: number; title?: string; stage?: string; amount?: number }[];
}

interface Props {
  contactId: number;
  onClose: () => void;
  onChanged: () => void;
}

const FIELDS: { key: keyof ContactDetail; label: string; icon: string }[] = [
  { key: "name", label: "Имя", icon: "User" },
  { key: "phone", label: "Телефон", icon: "Phone" },
  { key: "email", label: "Email", icon: "Mail" },
  { key: "company", label: "Компания", icon: "Building2" },
  { key: "position", label: "Должность", icon: "Briefcase" },
  { key: "region", label: "Регион", icon: "MapPin" },
];

export const CrmContactCard: React.FC<Props> = ({ contactId, onClose, onChanged }) => {
  const { toast } = useToast();
  const [data, setData] = useState<ContactDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [edit, setEdit] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [form, setForm] = useState<Record<string, string>>({});

  const load = useCallback(() => {
    setLoading(true);
    apiCRM("contacts_get", undefined, contactId)
      .then((res) => {
        if (res?.error) throw new Error(res.error);
        const c: ContactDetail = { ...res.contact, name: res.contact.name || res.contact.full_name };
        setData(c);
        setForm({
          name: c.name || "", phone: c.phone || "", email: c.email || "",
          company: c.company || "", position: c.position || "", region: c.region || "",
          status: c.status || "active", notes: c.notes || "",
        });
      })
      .catch((e) => toast({ title: "Не удалось открыть карточку", description: String(e.message || e), variant: "destructive" }))
      .finally(() => setLoading(false));
  }, [contactId, toast]);

  useEffect(() => { load(); }, [load]);

  const save = async () => {
    if (!form.name.trim()) {
      toast({ title: "Укажите имя контакта", variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      const res = await apiCRM("contacts_update", form, contactId);
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

  const remove = async () => {
    if (!confirm("Удалить контакт? Связанные сделки и задачи будут отвязаны.")) return;
    setDeleting(true);
    try {
      const res = await apiCRM("contacts_delete", {}, contactId);
      if (!res?.success) throw new Error(res?.error || "Не удалось удалить");
      toast({ title: "Контакт удалён" });
      onChanged();
      onClose();
    } catch (e) {
      toast({ title: "Ошибка удаления", description: String((e as Error).message), variant: "destructive" });
      setDeleting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[85vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-5 border-b border-gray-100 sticky top-0 bg-white">
          <h3 className="font-heading font-bold text-gray-800 flex items-center gap-2">
            <Icon name="User" size={18} className="text-primary" />
            {loading ? "Загрузка…" : data?.name || "Контакт"}
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <Icon name="X" size={20} />
          </button>
        </div>

        {loading ? (
          <div className="p-8 text-center text-gray-400">
            <Icon name="Loader2" size={28} className="animate-spin mx-auto" />
          </div>
        ) : !data ? (
          <div className="p-8 text-center text-gray-400 text-sm">Карточка недоступна</div>
        ) : (
          <div className="p-5 space-y-5">
            {/* Поля */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {FIELDS.map((f) => (
                <div key={f.key as string} className="relative">
                  <label className="text-[11px] text-gray-400 font-medium ml-1">{f.label}</label>
                  {edit ? (
                    <div className="relative">
                      <Icon name={f.icon} size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
                      <input
                        value={form[f.key as string] || ""}
                        onChange={(e) => setForm((p) => ({ ...p, [f.key as string]: e.target.value }))}
                        className="w-full pl-8 pr-3 py-2 rounded-lg border border-gray-200 focus:border-primary focus:ring-1 focus:ring-primary/20 outline-none text-sm"
                      />
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 text-sm text-gray-700 px-1 py-2">
                      <Icon name={f.icon} size={14} className="text-gray-400" />
                      {(data[f.key] as string) || "—"}
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Заметки */}
            <div>
              <label className="text-[11px] text-gray-400 font-medium ml-1">Заметки</label>
              {edit ? (
                <textarea
                  value={form.notes || ""}
                  onChange={(e) => setForm((p) => ({ ...p, notes: e.target.value }))}
                  rows={3}
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:border-primary focus:ring-1 focus:ring-primary/20 outline-none text-sm"
                />
              ) : (
                <p className="text-sm text-gray-600 px-1 py-2 whitespace-pre-wrap">{data.notes || "—"}</p>
              )}
            </div>

            {/* Сделки */}
            {!edit && data.deals && data.deals.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-gray-700 mb-2 flex items-center gap-1.5">
                  <Icon name="Handshake" size={13} className="text-primary" />Сделки ({data.deals.length})
                </p>
                <div className="space-y-1.5">
                  {data.deals.map((d) => (
                    <div key={d.id} className="flex items-center justify-between text-xs bg-gray-50 rounded-lg px-3 py-2">
                      <span className="text-gray-700 truncate">{d.title}</span>
                      <span className="text-primary font-medium shrink-0 ml-2">
                        {d.amount ? `${d.amount.toLocaleString("ru-RU")} ₽` : "—"}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

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

export default CrmContactCard;
