import { useEffect, useState } from "react";
import { adminApi } from "@/lib/adminApi";
import Icon from "@/components/ui/icon";

interface Stats {
  summary: {
    total_users: number; verified_users: number; blocked_users: number;
    new_users: number; total_points: number; total_appeals: number;
    new_appeals: number; total_news: number;
  };
  reg_by_day: { date: string; count: number }[];
  by_role: { role: string; count: number }[];
  by_plan: { plan: string; count: number }[];
  appeals_by_status: Record<string, number>;
  recent_users: { id: number; email: string; full_name: string; role: string; plan: string; created_at: string }[];
  period: number;
}

const ROLE_LABELS: Record<string, string> = { farmer: "Фермер", trader: "Трейдер", agronomist: "Агроном", admin: "Админ" };
const PLAN_LABELS: Record<string, string> = { free: "Бесплатный", pro: "Профессионал", corp: "Корпоративный" };
const STATUS_LABELS: Record<string, string> = { new: "Новые", in_progress: "В работе", closed: "Закрыты" };

function Card({ icon, label, value, sub, color = "primary" }: { icon: string; label: string; value: string | number; sub?: string; color?: string }) {
  const colors: Record<string, string> = {
    primary: "text-primary bg-primary/10",
    green: "text-emerald-600 bg-emerald-100",
    amber: "text-amber-600 bg-amber-100",
    red: "text-red-500 bg-red-100",
  };
  return (
    <div className="glass-card rounded-2xl p-4 flex items-start gap-3">
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${colors[color]}`}>
        <Icon name={icon as "Users"} size={18} />
      </div>
      <div className="min-w-0">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="font-heading font-bold text-xl leading-tight">{value}</p>
        {sub && <p className="text-[10px] text-muted-foreground mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

export default function AdminDashboard({ onSection }: { onSection: (s: string) => void }) {
  const [stats, setStats] = useState<Stats | null>(null);
  const [period, setPeriod] = useState(30);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    adminApi.getStats(period)
      .then(setStats)
      .finally(() => setLoading(false));
  }, [period]);

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <Icon name="Loader" size={24} className="animate-spin text-primary" />
    </div>
  );

  if (!stats) return null;
  const s = stats.summary;

  const maxReg = Math.max(...stats.reg_by_day.map(d => d.count), 1);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h2 className="font-heading font-bold text-lg">Дашборд</h2>
        <div className="flex gap-1 bg-secondary rounded-xl p-1">
          {[7, 30, 90].map(d => (
            <button key={d} onClick={() => setPeriod(d)}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${period === d ? "bg-white shadow text-foreground" : "text-muted-foreground"}`}>
              {d}д
            </button>
          ))}
        </div>
      </div>

      {/* KPI */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Card icon="Users" label="Всего пользователей" value={s.total_users} sub={`+${s.new_users} за ${period}д`} />
        <Card icon="BadgeCheck" label="Подтверждены" value={s.verified_users} sub={`${Math.round(s.verified_users/Math.max(s.total_users,1)*100)}%`} color="green" />
        <Card icon="Star" label="АгроБаллы (всего)" value={s.total_points.toLocaleString("ru")} color="amber" />
        <Card icon="MessageSquare" label="Заявки (новые)" value={`${s.new_appeals} / ${s.total_appeals}`}
          sub={s.new_appeals > 0 ? "Требуют ответа" : "Всё обработано"} color={s.new_appeals > 0 ? "red" : "green"} />
      </div>

      <div className="grid lg:grid-cols-3 gap-5">
        {/* График регистраций */}
        <div className="lg:col-span-2 glass-card rounded-2xl p-4">
          <p className="font-heading font-semibold text-sm mb-4">Регистрации за {period} дней</p>
          {stats.reg_by_day.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-8">Нет данных за период</p>
          ) : (
            <div className="flex items-end gap-1 h-32">
              {stats.reg_by_day.map((d, i) => (
                <div key={i} className="flex-1 flex flex-col items-center gap-1 group">
                  <div className="relative w-full bg-primary/20 rounded-t hover:bg-primary/40 transition-colors cursor-default"
                    style={{ height: `${(d.count / maxReg) * 100}%`, minHeight: "4px" }}>
                    <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-foreground text-background text-[10px] px-1.5 py-0.5 rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity">
                      {d.count}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* По ролям */}
        <div className="glass-card rounded-2xl p-4 space-y-3">
          <p className="font-heading font-semibold text-sm">По ролям</p>
          {stats.by_role.map((r, i) => (
            <div key={i}>
              <div className="flex justify-between text-xs mb-1">
                <span>{ROLE_LABELS[r.role] || r.role}</span>
                <span className="font-medium">{r.count}</span>
              </div>
              <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
                <div className="h-full bg-primary rounded-full" style={{ width: `${(r.count / s.total_users) * 100}%` }} />
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-5">
        {/* По планам */}
        <div className="glass-card rounded-2xl p-4 space-y-3">
          <p className="font-heading font-semibold text-sm">По тарифам</p>
          {stats.by_plan.map((p, i) => (
            <div key={i} className="flex items-center justify-between">
              <span className="text-xs">{PLAN_LABELS[p.plan] || p.plan}</span>
              <div className="flex items-center gap-2">
                <div className="w-24 h-1.5 bg-secondary rounded-full overflow-hidden">
                  <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${(p.count / s.total_users) * 100}%` }} />
                </div>
                <span className="text-xs font-medium w-6 text-right">{p.count}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Заявки по статусу */}
        <div className="glass-card rounded-2xl p-4 space-y-3">
          <div className="flex items-center justify-between">
            <p className="font-heading font-semibold text-sm">Заявки</p>
            <button onClick={() => onSection("appeals")} className="text-xs text-primary hover:underline">Все заявки →</button>
          </div>
          {Object.entries(stats.appeals_by_status).map(([status, count]) => (
            <div key={status} className="flex items-center justify-between p-2.5 bg-secondary/50 rounded-xl">
              <span className="text-xs">{STATUS_LABELS[status] || status}</span>
              <span className="text-xs font-bold">{count}</span>
            </div>
          ))}
          {Object.keys(stats.appeals_by_status).length === 0 && (
            <p className="text-xs text-muted-foreground text-center py-4">Заявок пока нет</p>
          )}
        </div>
      </div>

      {/* Последние регистрации */}
      <div className="glass-card rounded-2xl p-4">
        <div className="flex items-center justify-between mb-3">
          <p className="font-heading font-semibold text-sm">Последние регистрации</p>
          <button onClick={() => onSection("users")} className="text-xs text-primary hover:underline">Все пользователи →</button>
        </div>
        <div className="space-y-2">
          {stats.recent_users.map(u => (
            <div key={u.id} className="flex items-center gap-3 p-2.5 bg-secondary/40 rounded-xl">
              <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center shrink-0">
                <Icon name="User" size={14} className="text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium truncate">{u.full_name || u.email}</p>
                <p className="text-[10px] text-muted-foreground truncate">{u.email}</p>
              </div>
              <div className="text-right shrink-0">
                <p className="text-[10px] text-muted-foreground">{ROLE_LABELS[u.role] || u.role}</p>
                <p className="text-[10px] text-muted-foreground">{new Date(u.created_at).toLocaleDateString("ru")}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
