import { useEffect, useState } from "react";
import { adminApi } from "@/lib/adminApi";
import Icon from "@/components/ui/icon";

interface Appeal {
  id: number; user_id: number | null; name: string; email: string;
  subject: string; message: string; status: string;
  admin_reply: string | null; replied_at: string | null;
  created_at: string; updated_at: string;
}

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  new: { label: "Новая", color: "bg-blue-100 text-blue-700" },
  in_progress: { label: "В работе", color: "bg-amber-100 text-amber-700" },
  closed: { label: "Закрыта", color: "bg-emerald-100 text-emerald-700" },
};

function AppealModal({ appeal, onClose, onSave }: { appeal: Appeal; onClose: () => void; onSave: () => void }) {
  const [status, setStatus] = useState(appeal.status);
  const [reply, setReply] = useState(appeal.admin_reply || "");
  const [saving, setSaving] = useState(false);

  const save = async () => {
    setSaving(true);
    try {
      await adminApi.updateAppeal(appeal.id, { status, admin_reply: reply || undefined });
      onSave();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="bg-background rounded-2xl shadow-2xl w-full max-w-xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-5 border-b border-border">
          <h3 className="font-heading font-bold text-base">Заявка #{appeal.id}</h3>
          <button onClick={onClose}><Icon name="X" size={18} className="text-muted-foreground" /></button>
        </div>
        <div className="p-5 space-y-4">
          <div className="p-4 bg-secondary/50 rounded-xl space-y-2 text-sm">
            <div className="flex gap-2"><span className="text-muted-foreground w-24 shrink-0">От:</span><strong>{appeal.name}</strong></div>
            <div className="flex gap-2"><span className="text-muted-foreground w-24 shrink-0">Email:</span><span>{appeal.email}</span></div>
            <div className="flex gap-2"><span className="text-muted-foreground w-24 shrink-0">Тема:</span><span>{appeal.subject || "—"}</span></div>
            <div className="flex gap-2"><span className="text-muted-foreground w-24 shrink-0">Дата:</span><span>{new Date(appeal.created_at).toLocaleString("ru")}</span></div>
          </div>

          <div className="p-4 bg-secondary/30 rounded-xl border-l-2 border-primary">
            <p className="text-xs text-muted-foreground mb-1">Сообщение:</p>
            <p className="text-sm whitespace-pre-wrap">{appeal.message}</p>
          </div>

          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1.5">Статус</label>
            <div className="flex gap-2">
              {Object.entries(STATUS_CONFIG).map(([v, c]) => (
                <button key={v} onClick={() => setStatus(v)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-medium border transition-colors ${
                    status === v ? "bg-primary text-white border-primary" : "border-border hover:border-primary/50"
                  }`}>
                  {c.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1.5">Ответ администратора</label>
            <textarea value={reply} rows={4}
              onChange={e => setReply(e.target.value)}
              placeholder="Введите ответ пользователю…"
              className="w-full px-3 py-2 rounded-xl border border-border bg-background text-sm focus:outline-none focus:border-primary resize-none" />
          </div>

          <div className="flex gap-3">
            <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-border text-sm font-medium hover:bg-secondary">Отмена</button>
            <button onClick={save} disabled={saving}
              className="flex-1 py-2.5 rounded-xl hero-gradient text-white text-sm font-medium disabled:opacity-60 flex items-center justify-center gap-2">
              {saving ? <><Icon name="Loader" size={14} className="animate-spin" />Сохранение…</> : "Сохранить"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AdminAppeals() {
  const [data, setData] = useState<{ appeals: Appeal[]; total: number; counts: Record<string, number> } | null>(null);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<Appeal | null>(null);

  const load = () => {
    setLoading(true);
    adminApi.getAppeals({ status: statusFilter, page })
      .then(setData)
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [statusFilter, page]);

  const handleSave = () => { setSelected(null); load(); };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-heading font-bold text-lg">Заявки и обращения</h2>
        {data && <span className="text-xs text-muted-foreground">Всего: {data.total}</span>}
      </div>

      {/* Фильтр по статусу */}
      <div className="flex gap-2 flex-wrap">
        <button onClick={() => { setStatusFilter(""); setPage(1); }}
          className={`px-3 py-1.5 rounded-xl text-xs font-medium border transition-colors ${!statusFilter ? "bg-primary text-white border-primary" : "border-border hover:border-primary/50"}`}>
          Все {data?.total ? `(${data.total})` : ""}
        </button>
        {Object.entries(STATUS_CONFIG).map(([v, c]) => (
          <button key={v} onClick={() => { setStatusFilter(v); setPage(1); }}
            className={`px-3 py-1.5 rounded-xl text-xs font-medium border transition-colors ${
              statusFilter === v ? "bg-primary text-white border-primary" : "border-border hover:border-primary/50"
            }`}>
            {c.label} {data?.counts?.[v] ? `(${data.counts[v]})` : ""}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><Icon name="Loader" size={24} className="animate-spin text-primary" /></div>
      ) : data?.appeals.length === 0 ? (
        <div className="glass-card rounded-2xl p-12 text-center">
          <Icon name="MessageSquare" size={32} className="text-muted-foreground mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">Заявок нет</p>
        </div>
      ) : (
        <div className="space-y-2">
          {data?.appeals.map(a => (
            <div key={a.id} onClick={() => setSelected(a)}
              className="glass-card rounded-xl p-4 cursor-pointer hover:border-primary/30 transition-colors">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${STATUS_CONFIG[a.status]?.color || "bg-secondary"}`}>
                      {STATUS_CONFIG[a.status]?.label || a.status}
                    </span>
                    <span className="text-xs text-muted-foreground">#{a.id}</span>
                  </div>
                  <p className="text-sm font-medium truncate">{a.subject || "Без темы"}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">от {a.name} · {a.email}</p>
                  <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{a.message}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-[10px] text-muted-foreground">{new Date(a.created_at).toLocaleDateString("ru")}</p>
                  {a.admin_reply && <p className="text-[10px] text-emerald-600 mt-1">Ответ отправлен</p>}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {selected && <AppealModal appeal={selected} onClose={() => setSelected(null)} onSave={handleSave} />}
    </div>
  );
}
