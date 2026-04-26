import { useEffect, useState } from "react";
import { adminApi } from "@/lib/adminApi";
import Icon from "@/components/ui/icon";

interface User {
  id: number; email: string; full_name: string; company: string;
  role: string; plan: string; is_verified: boolean; is_blocked: boolean;
  loyalty_points: number; phone: string; admin_notes: string;
  created_at: string; updated_at: string;
}

const ROLE_LABELS: Record<string, string> = { farmer: "Фермер", trader: "Трейдер", agronomist: "Агроном", admin: "Админ" };
const PLAN_LABELS: Record<string, string> = { free: "Бесплатный", pro: "Профессионал", corp: "Корпоративный" };

function UserModal({ user, onClose, onSave }: { user: User; onClose: () => void; onSave: () => void }) {
  const [form, setForm] = useState({
    full_name: user.full_name || "",
    company: user.company || "",
    phone: user.phone || "",
    role: user.role || "farmer",
    plan: user.plan || "free",
    loyalty_points: user.loyalty_points || 0,
    is_blocked: user.is_blocked || false,
    admin_notes: user.admin_notes || "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const save = async () => {
    setSaving(true); setError("");
    try {
      await adminApi.updateUser(user.id, form);
      onSave();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Ошибка");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="bg-background rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-5 border-b border-border">
          <h3 className="font-heading font-bold text-base">Пользователь #{user.id}</h3>
          <button onClick={onClose}><Icon name="X" size={18} className="text-muted-foreground" /></button>
        </div>
        <div className="p-5 space-y-4">
          <div className="p-3 bg-secondary/50 rounded-xl text-xs text-muted-foreground space-y-1">
            <p><strong>Email:</strong> {user.email}</p>
            <p><strong>Зарегистрирован:</strong> {new Date(user.created_at).toLocaleString("ru")}</p>
            <p><strong>Email подтверждён:</strong> {user.is_verified ? "Да" : "Нет"}</p>
          </div>

          {[
            { key: "full_name", label: "Имя" },
            { key: "company", label: "Компания" },
            { key: "phone", label: "Телефон" },
          ].map(f => (
            <div key={f.key}>
              <label className="block text-xs font-medium text-muted-foreground mb-1.5">{f.label}</label>
              <input value={(form as Record<string, string | number | boolean>)[f.key] as string}
                onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))}
                className="w-full px-3 py-2 rounded-xl border border-border bg-background text-sm focus:outline-none focus:border-primary" />
            </div>
          ))}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1.5">Роль</label>
              <select value={form.role} onChange={e => setForm(p => ({ ...p, role: e.target.value }))}
                className="w-full px-3 py-2 rounded-xl border border-border bg-background text-sm focus:outline-none focus:border-primary">
                {Object.entries(ROLE_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1.5">Тариф</label>
              <select value={form.plan} onChange={e => setForm(p => ({ ...p, plan: e.target.value }))}
                className="w-full px-3 py-2 rounded-xl border border-border bg-background text-sm focus:outline-none focus:border-primary">
                {Object.entries(PLAN_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1.5">АгроБаллы</label>
            <input type="number" value={form.loyalty_points}
              onChange={e => setForm(p => ({ ...p, loyalty_points: Number(e.target.value) }))}
              className="w-full px-3 py-2 rounded-xl border border-border bg-background text-sm focus:outline-none focus:border-primary" />
          </div>

          <label className="flex items-center gap-3 cursor-pointer">
            <div className={`w-10 h-6 rounded-full transition-colors ${form.is_blocked ? "bg-destructive" : "bg-secondary"} relative`}
              onClick={() => setForm(p => ({ ...p, is_blocked: !p.is_blocked }))}>
              <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-all ${form.is_blocked ? "left-5" : "left-1"}`} />
            </div>
            <span className="text-sm font-medium">{form.is_blocked ? "Заблокирован" : "Активен"}</span>
          </label>

          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1.5">Заметки администратора</label>
            <textarea value={form.admin_notes} rows={3}
              onChange={e => setForm(p => ({ ...p, admin_notes: e.target.value }))}
              className="w-full px-3 py-2 rounded-xl border border-border bg-background text-sm focus:outline-none focus:border-primary resize-none" />
          </div>

          {error && <p className="text-xs text-destructive">{error}</p>}

          <div className="flex gap-3 pt-2">
            <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-border text-sm font-medium hover:bg-secondary transition-colors">Отмена</button>
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

export default function AdminUsers() {
  const [data, setData] = useState<{ users: User[]; total: number; pages: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [role, setRole] = useState("");
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<User | null>(null);

  const load = () => {
    setLoading(true);
    adminApi.getUsers({ search, role, page })
      .then(setData)
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [search, role, page]);

  const handleSave = () => { setSelected(null); load(); };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-heading font-bold text-lg">Пользователи</h2>
        {data && <span className="text-xs text-muted-foreground">Всего: {data.total}</span>}
      </div>

      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-40">
          <Icon name="Search" size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input value={search} onChange={e => { setSearch(e.target.value); setPage(1); }}
            placeholder="Поиск по email, имени…"
            className="w-full pl-8 pr-3 py-2 rounded-xl border border-border bg-background text-sm focus:outline-none focus:border-primary" />
        </div>
        <select value={role} onChange={e => { setRole(e.target.value); setPage(1); }}
          className="px-3 py-2 rounded-xl border border-border bg-background text-sm focus:outline-none focus:border-primary">
          <option value="">Все роли</option>
          {Object.entries(ROLE_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
        </select>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><Icon name="Loader" size={24} className="animate-spin text-primary" /></div>
      ) : (
        <div className="glass-card rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead className="bg-secondary/70">
                <tr>
                  {["#","Email","Имя","Роль","Тариф","Баллы","Статус","Дата",""].map(h => (
                    <th key={h} className="text-left p-3 font-semibold text-muted-foreground">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {data?.users.map(u => (
                  <tr key={u.id} className="hover:bg-secondary/30 transition-colors">
                    <td className="p-3 text-muted-foreground">{u.id}</td>
                    <td className="p-3 font-medium max-w-[140px] truncate">{u.email}</td>
                    <td className="p-3 max-w-[100px] truncate">{u.full_name || "—"}</td>
                    <td className="p-3">{ROLE_LABELS[u.role] || u.role}</td>
                    <td className="p-3">{PLAN_LABELS[u.plan] || u.plan}</td>
                    <td className="p-3 font-mono">{u.loyalty_points}</td>
                    <td className="p-3">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${
                        u.is_blocked ? "bg-destructive/15 text-destructive" :
                        u.is_verified ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"
                      }`}>
                        {u.is_blocked ? "Блок" : u.is_verified ? "Активен" : "Не верифицирован"}
                      </span>
                    </td>
                    <td className="p-3 text-muted-foreground whitespace-nowrap">{new Date(u.created_at).toLocaleDateString("ru")}</td>
                    <td className="p-3">
                      <button onClick={() => setSelected(u)} className="p-1.5 hover:bg-primary/10 rounded-lg transition-colors text-primary">
                        <Icon name="Edit" size={13} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {data && data.pages > 1 && (
            <div className="flex justify-center gap-2 p-4 border-t border-border">
              {Array.from({ length: data.pages }, (_, i) => i + 1).map(p => (
                <button key={p} onClick={() => setPage(p)}
                  className={`w-8 h-8 rounded-lg text-xs font-medium transition-colors ${page === p ? "bg-primary text-white" : "bg-secondary hover:bg-secondary/80"}`}>
                  {p}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {selected && <UserModal user={selected} onClose={() => setSelected(null)} onSave={handleSave} />}
    </div>
  );
}
