import React, { useState, useEffect, useCallback } from "react";
import Icon from "@/components/ui/icon";
import { apiCRM } from "@/lib/auth";

// ─── Types ───────────────────────────────────────────────────────────────────

type Tab =
  | "dashboard"
  | "kanban"
  | "contacts"
  | "leads"
  | "deals"
  | "tasks"
  | "activities";

interface KpiData {
  contacts?: number;
  leads?: number;
  deals?: number;
  revenue?: number;
  tasks?: number;
  funnel?: number;
  recent_activities?: Activity[];
}

interface Contact {
  id: number;
  full_name: string;
  phone?: string;
  email?: string;
  company?: string;
  region?: string;
  status?: string;
}

interface Lead {
  id: number;
  full_name: string;
  culture?: string;
  area?: number;
  budget?: number;
  status?: string;
  region?: string;
}

interface Deal {
  id: number;
  title: string;
  amount?: number;
  culture?: string;
  volume?: number;
  region?: string;
  stage?: string;
  contact_name?: string;
  close_probability?: number;
}

interface Task {
  id: number;
  title: string;
  priority?: "low" | "medium" | "high" | "critical";
  status?: "todo" | "in_progress" | "review" | "done";
  due_date?: string;
  assigned_to?: string;
}

interface Activity {
  id: number;
  type?: "call" | "meeting" | "email" | "task";
  title?: string;
  contact_name?: string;
  result?: string;
  created_at?: string;
}

// ─── Constants ───────────────────────────────────────────────────────────────

const KANBAN_STAGES: { key: string; label: string; color: string }[] = [
  { key: "new", label: "Новые", color: "bg-gray-100 border-gray-300" },
  { key: "contact", label: "Контакт", color: "bg-blue-50 border-blue-200" },
  { key: "qualify", label: "Квалификация", color: "bg-purple-50 border-purple-200" },
  { key: "proposal", label: "Предложение", color: "bg-yellow-50 border-yellow-200" },
  { key: "negotiation", label: "Переговоры", color: "bg-orange-50 border-orange-200" },
  { key: "won", label: "Выиграно", color: "bg-green-50 border-green-300" },
  { key: "lost", label: "Проиграно", color: "bg-red-50 border-red-200" },
];

const TASK_STATUSES: { key: Task["status"]; label: string; color: string }[] = [
  { key: "todo", label: "К выполнению", color: "border-gray-300 bg-gray-50" },
  { key: "in_progress", label: "В работе", color: "border-blue-300 bg-blue-50" },
  { key: "review", label: "На проверке", color: "border-yellow-300 bg-yellow-50" },
  { key: "done", label: "Завершено", color: "border-green-300 bg-green-50" },
];

const ACTIVITY_TYPES: { key: Activity["type"]; label: string; icon: string; color: string }[] = [
  { key: "call", label: "Звонок", icon: "Phone", color: "text-blue-500 bg-blue-100" },
  { key: "meeting", label: "Встреча", icon: "Users", color: "text-purple-500 bg-purple-100" },
  { key: "email", label: "Email", icon: "Mail", color: "text-orange-500 bg-orange-100" },
  { key: "task", label: "Задача", icon: "CheckSquare", color: "text-green-500 bg-green-100" },
];

const PRIORITY_CONFIG: Record<string, { label: string; color: string }> = {
  low: { label: "Низкий", color: "bg-gray-100 text-gray-600" },
  medium: { label: "Средний", color: "bg-blue-100 text-blue-700" },
  high: { label: "Высокий", color: "bg-orange-100 text-orange-700" },
  critical: { label: "Критический", color: "bg-red-100 text-red-700" },
};

const STAGE_LABELS: Record<string, string> = {
  new: "Новые",
  contact: "Контакт",
  qualify: "Квалификация",
  proposal: "Предложение",
  negotiation: "Переговоры",
  won: "Выиграно",
  lost: "Проиграно",
};

// ─── Skeleton ────────────────────────────────────────────────────────────────

const Skeleton: React.FC<{ className?: string }> = ({ className = "" }) => (
  <div className={`animate-pulse bg-gray-200 rounded ${className}`} />
);

const SkeletonRows: React.FC<{ rows?: number; cols?: number }> = ({
  rows = 5,
  cols = 4,
}) => (
  <tbody>
    {Array.from({ length: rows }).map((_, i) => (
      <tr key={i} className="border-b border-gray-100">
        {Array.from({ length: cols }).map((_, j) => (
          <td key={j} className="px-4 py-3">
            <Skeleton className="h-4" />
          </td>
        ))}
      </tr>
    ))}
  </tbody>
);

// ─── Tab Navigation ──────────────────────────────────────────────────────────

interface TabItem {
  key: Tab;
  label: string;
  icon: string;
}

const TABS: TabItem[] = [
  { key: "dashboard", label: "Дашборд", icon: "LayoutDashboard" },
  { key: "kanban", label: "Канбан", icon: "Columns" },
  { key: "contacts", label: "Контакты", icon: "Users" },
  { key: "leads", label: "Лиды", icon: "UserPlus" },
  { key: "deals", label: "Сделки", icon: "Handshake" },
  { key: "tasks", label: "Задачи", icon: "CheckSquare" },
  { key: "activities", label: "Активности", icon: "Activity" },
];

// ─── Dashboard Tab ────────────────────────────────────────────────────────────

const DashboardTab: React.FC = () => {
  const [data, setData] = useState<KpiData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiCRM("dashboard")
      .then((res) => setData(res?.data || res))
      .catch(() => setData({}))
      .finally(() => setLoading(false));
  }, []);

  const kpis = [
    {
      label: "Контакты",
      value: data?.contacts ?? 0,
      icon: "Users",
      color: "text-blue-600",
      bg: "bg-blue-100",
    },
    {
      label: "Лиды",
      value: data?.leads ?? 0,
      icon: "UserPlus",
      color: "text-purple-600",
      bg: "bg-purple-100",
    },
    {
      label: "Сделки",
      value: data?.deals ?? 0,
      icon: "Handshake",
      color: "text-primary",
      bg: "bg-green-100",
    },
    {
      label: "Выручка",
      value: data?.revenue
        ? `${(data.revenue / 1_000_000).toFixed(1)}М ₽`
        : "0 ₽",
      icon: "TrendingUp",
      color: "text-amber-600",
      bg: "bg-amber-100",
    },
    {
      label: "Задачи",
      value: data?.tasks ?? 0,
      icon: "CheckSquare",
      color: "text-orange-600",
      bg: "bg-orange-100",
    },
    {
      label: "Воронка",
      value: data?.funnel ? `${data.funnel}%` : "0%",
      icon: "Filter",
      color: "text-teal-600",
      bg: "bg-teal-100",
    },
  ];

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
        {loading
          ? Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="kpi-card rounded-xl p-4">
                <Skeleton className="h-8 w-8 rounded-lg mb-3" />
                <Skeleton className="h-6 w-16 mb-1" />
                <Skeleton className="h-3 w-20" />
              </div>
            ))
          : kpis.map((k) => (
              <div key={k.label} className="kpi-card rounded-xl p-4">
                <div
                  className={`inline-flex items-center justify-center w-9 h-9 rounded-lg ${k.bg} mb-3`}
                >
                  <Icon name={k.icon} size={18} className={k.color} />
                </div>
                <div className="text-xl font-heading font-bold text-gray-800">
                  {k.value}
                </div>
                <div className="text-xs text-gray-500 mt-0.5">{k.label}</div>
              </div>
            ))}
      </div>

      {/* Recent activities */}
      <div className="glass-card rounded-xl p-6">
        <h3 className="text-base font-heading font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <Icon name="Clock" size={18} className="text-primary" />
          Последние активности
        </h3>
        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex gap-3 items-center">
                <Skeleton className="h-8 w-8 rounded-full flex-shrink-0" />
                <div className="flex-1 space-y-1.5">
                  <Skeleton className="h-3 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : (data?.recent_activities || []).length === 0 ? (
          <div className="text-center py-8 text-gray-400">
            <Icon name="Inbox" size={32} className="mx-auto mb-2 opacity-40" />
            <p className="text-sm">Нет активностей</p>
          </div>
        ) : (
          <div className="space-y-3">
            {(data?.recent_activities || []).map((act) => {
              const typeConfig = ACTIVITY_TYPES.find(
                (t) => t.key === act.type
              ) || ACTIVITY_TYPES[3];
              return (
                <div
                  key={act.id}
                  className="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${typeConfig.color}`}
                  >
                    <Icon name={typeConfig.icon} size={14} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800 truncate">
                      {act.title}
                    </p>
                    <p className="text-xs text-gray-500">
                      {act.contact_name && (
                        <span className="font-medium">{act.contact_name}</span>
                      )}
                      {act.result && (
                        <span className="ml-1 text-gray-400">— {act.result}</span>
                      )}
                    </p>
                  </div>
                  {act.created_at && (
                    <span className="text-xs text-gray-400 flex-shrink-0">
                      {new Date(act.created_at).toLocaleDateString("ru-RU")}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

// ─── Kanban Tab ───────────────────────────────────────────────────────────────

const KanbanTab: React.FC = () => {
  const [columns, setColumns] = useState<Record<string, Deal[]>>({});
  const [loading, setLoading] = useState(true);
  const [addingStage, setAddingStage] = useState<string | null>(null);
  const [newDeal, setNewDeal] = useState({
    title: "",
    amount: "",
    contact_name: "",
    close_probability: "",
    stage: "",
  });
  const [saving, setSaving] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    apiCRM("kanban")
      .then((res) => {
        const raw: Deal[] = res?.data || res || [];
        const grouped: Record<string, Deal[]> = {};
        KANBAN_STAGES.forEach((s) => (grouped[s.key] = []));
        (Array.isArray(raw) ? raw : []).forEach((d) => {
          const stage = d.stage || "new";
          if (!grouped[stage]) grouped[stage] = [];
          grouped[stage].push(d);
        });
        setColumns(grouped);
      })
      .catch(() => setColumns({}))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const openAdd = (stage: string) => {
    setAddingStage(stage);
    setNewDeal({
      title: "",
      amount: "",
      contact_name: "",
      close_probability: "",
      stage,
    });
  };

  const handleAddDeal = async (stage: string) => {
    if (!newDeal.title.trim()) return;
    setSaving(true);
    try {
      await apiCRM("deals_create", {
        title: newDeal.title,
        amount: newDeal.amount ? Number(newDeal.amount) : undefined,
        contact_name: newDeal.contact_name,
        close_probability: newDeal.close_probability
          ? Number(newDeal.close_probability)
          : undefined,
        stage,
      });
      setAddingStage(null);
      load();
    } catch {
      // ignore
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="overflow-x-auto pb-4">
      <div className="flex gap-4 min-w-max">
        {KANBAN_STAGES.map((stg) => {
          const deals = columns[stg.key] || [];
          const total = deals.reduce((s, d) => s + (d.amount || 0), 0);
          return (
            <div
              key={stg.key}
              className={`w-64 rounded-xl border-2 ${stg.color} flex flex-col`}
            >
              {/* Column header */}
              <div className="p-3 border-b border-inherit">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-semibold text-gray-700">
                    {stg.label}
                  </span>
                  <span className="text-xs bg-white/70 text-gray-600 rounded-full px-2 py-0.5 font-medium">
                    {loading ? "..." : deals.length}
                  </span>
                </div>
                {!loading && total > 0 && (
                  <span className="text-xs text-gray-500">
                    {(total / 1000).toFixed(0)} тыс. ₽
                  </span>
                )}
              </div>

              {/* Cards */}
              <div className="flex-1 p-2 space-y-2 min-h-[80px]">
                {loading
                  ? Array.from({ length: 2 }).map((_, i) => (
                      <div
                        key={i}
                        className="bg-white rounded-lg p-3 shadow-sm space-y-2"
                      >
                        <Skeleton className="h-3 w-3/4" />
                        <Skeleton className="h-3 w-1/2" />
                      </div>
                    ))
                  : deals.map((d) => (
                      <div
                        key={d.id}
                        className="bg-white rounded-lg p-3 shadow-sm hover:shadow-md transition-shadow border border-gray-100"
                      >
                        <p className="text-sm font-medium text-gray-800 leading-snug mb-2">
                          {d.title}
                        </p>
                        {d.amount && (
                          <p className="text-xs font-semibold text-primary">
                            {d.amount.toLocaleString("ru-RU")} ₽
                          </p>
                        )}
                        {d.contact_name && (
                          <p className="text-xs text-gray-500 flex items-center gap-1 mt-1">
                            <Icon name="User" size={10} />
                            {d.contact_name}
                          </p>
                        )}
                        {d.close_probability !== undefined && (
                          <div className="mt-2">
                            <div className="flex justify-between text-xs text-gray-400 mb-0.5">
                              <span>Закрытие</span>
                              <span>{d.close_probability}%</span>
                            </div>
                            <div className="h-1 bg-gray-100 rounded-full overflow-hidden">
                              <div
                                className="h-full progress-bar"
                                style={{ width: `${d.close_probability}%` }}
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    ))}

                {/* Add form inline */}
                {addingStage === stg.key && (
                  <div className="bg-white rounded-lg p-3 shadow-sm border border-primary/30 space-y-2">
                    <input
                      autoFocus
                      type="text"
                      placeholder="Название сделки"
                      value={newDeal.title}
                      onChange={(e) =>
                        setNewDeal((p) => ({ ...p, title: e.target.value }))
                      }
                      className="w-full text-sm border border-gray-200 rounded-lg px-2 py-1.5 focus:border-primary focus:ring-1 focus:ring-primary/20 outline-none"
                    />
                    <input
                      type="number"
                      placeholder="Сумма, ₽"
                      value={newDeal.amount}
                      onChange={(e) =>
                        setNewDeal((p) => ({ ...p, amount: e.target.value }))
                      }
                      className="w-full text-sm border border-gray-200 rounded-lg px-2 py-1.5 focus:border-primary focus:ring-1 focus:ring-primary/20 outline-none"
                    />
                    <input
                      type="text"
                      placeholder="Контакт"
                      value={newDeal.contact_name}
                      onChange={(e) =>
                        setNewDeal((p) => ({
                          ...p,
                          contact_name: e.target.value,
                        }))
                      }
                      className="w-full text-sm border border-gray-200 rounded-lg px-2 py-1.5 focus:border-primary focus:ring-1 focus:ring-primary/20 outline-none"
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleAddDeal(stg.key)}
                        disabled={saving}
                        className="flex-1 text-xs hero-gradient text-white rounded-lg py-1.5 font-medium disabled:opacity-50"
                      >
                        {saving ? "..." : "Добавить"}
                      </button>
                      <button
                        onClick={() => setAddingStage(null)}
                        className="flex-1 text-xs bg-gray-100 text-gray-600 rounded-lg py-1.5 font-medium hover:bg-gray-200"
                      >
                        Отмена
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Add button */}
              {addingStage !== stg.key && (
                <div className="p-2">
                  <button
                    onClick={() => openAdd(stg.key)}
                    className="w-full text-xs text-gray-500 hover:text-primary hover:bg-white/70 rounded-lg py-2 flex items-center justify-center gap-1 transition-all"
                  >
                    <Icon name="Plus" size={14} />
                    Добавить сделку
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

// ─── Contacts Tab ─────────────────────────────────────────────────────────────

const ContactsTab: React.FC = () => {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [selected, setSelected] = useState<Contact | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    full_name: "",
    phone: "",
    email: "",
    company: "",
    region: "",
    status: "active",
  });

  const load = useCallback(() => {
    setLoading(true);
    apiCRM("contacts_list")
      .then((res) => setContacts(res?.data || res || []))
      .catch(() => setContacts([]))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const filtered = contacts.filter((c) => {
    const q = search.toLowerCase();
    return (
      c.full_name?.toLowerCase().includes(q) ||
      c.email?.toLowerCase().includes(q) ||
      c.company?.toLowerCase().includes(q) ||
      c.phone?.toLowerCase().includes(q)
    );
  });

  const handleAdd = async () => {
    if (!form.full_name.trim()) return;
    setSaving(true);
    try {
      await apiCRM("contacts_create", form);
      setShowAdd(false);
      setForm({
        full_name: "",
        phone: "",
        email: "",
        company: "",
        region: "",
        status: "active",
      });
      load();
    } catch {
      // ignore
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <Icon
            name="Search"
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
          />
          <input
            type="text"
            placeholder="Поиск контактов..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-lg border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none text-sm"
          />
        </div>
        <button
          onClick={() => setShowAdd((v) => !v)}
          className="hero-gradient text-white text-sm font-medium px-4 py-2 rounded-lg flex items-center gap-2 hover:opacity-90 transition-opacity"
        >
          <Icon name="UserPlus" size={16} />
          Добавить контакт
        </button>
      </div>

      {/* Add form */}
      {showAdd && (
        <div className="glass-card rounded-xl p-5 border-2 border-primary/20">
          <h4 className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2">
            <Icon name="UserPlus" size={16} className="text-primary" />
            Новый контакт
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {[
              { name: "full_name", placeholder: "Полное имя *", icon: "User" },
              { name: "phone", placeholder: "Телефон", icon: "Phone" },
              { name: "email", placeholder: "Email", icon: "Mail" },
              { name: "company", placeholder: "Компания", icon: "Building2" },
              { name: "region", placeholder: "Регион", icon: "MapPin" },
            ].map((f) => (
              <div key={f.name} className="relative">
                <Icon
                  name={f.icon}
                  size={14}
                  className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400"
                />
                <input
                  type="text"
                  placeholder={f.placeholder}
                  value={(form as Record<string, string>)[f.name]}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, [f.name]: e.target.value }))
                  }
                  className="w-full pl-8 pr-3 py-2 rounded-lg border border-gray-200 focus:border-primary focus:ring-1 focus:ring-primary/20 outline-none text-sm"
                />
              </div>
            ))}
          </div>
          <div className="flex gap-2 mt-4">
            <button
              onClick={handleAdd}
              disabled={saving}
              className="hero-gradient text-white text-sm font-medium px-5 py-2 rounded-lg flex items-center gap-2 hover:opacity-90 disabled:opacity-50"
            >
              {saving ? (
                <Icon name="Loader2" size={14} className="animate-spin" />
              ) : (
                <Icon name="Check" size={14} />
              )}
              Сохранить
            </button>
            <button
              onClick={() => setShowAdd(false)}
              className="text-sm text-gray-600 bg-gray-100 hover:bg-gray-200 px-5 py-2 rounded-lg transition-colors"
            >
              Отмена
            </button>
          </div>
        </div>
      )}

      {/* Contact detail panel */}
      {selected && (
        <div className="glass-card rounded-xl p-5 border-2 border-primary/20">
          <div className="flex items-center justify-between mb-4">
            <h4 className="font-semibold text-gray-800 flex items-center gap-2">
              <Icon name="User" size={18} className="text-primary" />
              {selected.full_name}
            </h4>
            <button
              onClick={() => setSelected(null)}
              className="text-gray-400 hover:text-gray-600"
            >
              <Icon name="X" size={18} />
            </button>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-sm">
            {selected.phone && (
              <div className="flex items-center gap-2 text-gray-600">
                <Icon name="Phone" size={14} className="text-gray-400" />
                {selected.phone}
              </div>
            )}
            {selected.email && (
              <div className="flex items-center gap-2 text-gray-600">
                <Icon name="Mail" size={14} className="text-gray-400" />
                {selected.email}
              </div>
            )}
            {selected.company && (
              <div className="flex items-center gap-2 text-gray-600">
                <Icon name="Building2" size={14} className="text-gray-400" />
                {selected.company}
              </div>
            )}
            {selected.region && (
              <div className="flex items-center gap-2 text-gray-600">
                <Icon name="MapPin" size={14} className="text-gray-400" />
                {selected.region}
              </div>
            )}
            {selected.status && (
              <div className="flex items-center gap-2 text-gray-600">
                <Icon name="Circle" size={14} className="text-gray-400" />
                {selected.status}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Table */}
      <div className="glass-card rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                Имя
              </th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide hidden md:table-cell">
                Телефон
              </th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide hidden lg:table-cell">
                Email
              </th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide hidden md:table-cell">
                Компания
              </th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide hidden xl:table-cell">
                Регион
              </th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                Статус
              </th>
            </tr>
          </thead>
          {loading ? (
            <SkeletonRows rows={6} cols={6} />
          ) : filtered.length === 0 ? (
            <tbody>
              <tr>
                <td colSpan={6} className="text-center py-10 text-gray-400">
                  <Icon
                    name="Users"
                    size={32}
                    className="mx-auto mb-2 opacity-30"
                  />
                  <p className="text-sm">Контакты не найдены</p>
                </td>
              </tr>
            </tbody>
          ) : (
            <tbody>
              {filtered.map((c) => (
                <tr
                  key={c.id}
                  onClick={() => setSelected(c.id === selected?.id ? null : c)}
                  className={`border-b border-gray-100 cursor-pointer hover:bg-green-50/50 transition-colors ${
                    selected?.id === c.id ? "bg-primary/5" : ""
                  }`}
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full hero-gradient flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                        {c.full_name?.charAt(0) || "?"}
                      </div>
                      <span className="font-medium text-gray-800 text-sm">
                        {c.full_name}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-600 hidden md:table-cell">
                    {c.phone || "—"}
                  </td>
                  <td className="px-4 py-3 text-gray-600 hidden lg:table-cell">
                    {c.email || "—"}
                  </td>
                  <td className="px-4 py-3 text-gray-600 hidden md:table-cell">
                    {c.company || "—"}
                  </td>
                  <td className="px-4 py-3 text-gray-600 hidden xl:table-cell">
                    {c.region || "—"}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        c.status === "active"
                          ? "bg-green-100 text-green-700"
                          : "bg-gray-100 text-gray-600"
                      }`}
                    >
                      {c.status || "активный"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          )}
        </table>
      </div>
    </div>
  );
};

// ─── Leads Tab ────────────────────────────────────────────────────────────────

const LeadsTab: React.FC = () => {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    full_name: "",
    culture: "",
    area: "",
    budget: "",
    region: "",
    status: "new",
  });

  const load = useCallback(() => {
    setLoading(true);
    apiCRM("leads_list")
      .then((res) => setLeads(res?.data || res || []))
      .catch(() => setLeads([]))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const STATUS_COLORS: Record<string, string> = {
    new: "bg-blue-100 text-blue-700",
    contacted: "bg-purple-100 text-purple-700",
    qualified: "bg-green-100 text-green-700",
    disqualified: "bg-red-100 text-red-700",
  };

  const handleAdd = async () => {
    if (!form.full_name.trim()) return;
    setSaving(true);
    try {
      await apiCRM("leads_create", {
        full_name: form.full_name,
        culture: form.culture,
        area: form.area ? Number(form.area) : undefined,
        budget: form.budget ? Number(form.budget) : undefined,
        region: form.region,
        status: form.status,
      });
      setShowAdd(false);
      setForm({
        full_name: "",
        culture: "",
        area: "",
        budget: "",
        region: "",
        status: "new",
      });
      load();
    } catch {
      // ignore
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <button
          onClick={() => setShowAdd((v) => !v)}
          className="hero-gradient text-white text-sm font-medium px-4 py-2 rounded-lg flex items-center gap-2 hover:opacity-90"
        >
          <Icon name="Plus" size={16} />
          Добавить лид
        </button>
      </div>

      {showAdd && (
        <div className="glass-card rounded-xl p-5 border-2 border-primary/20">
          <h4 className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2">
            <Icon name="UserPlus" size={16} className="text-primary" />
            Новый лид
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {[
              { name: "full_name", placeholder: "Имя *", type: "text", icon: "User" },
              { name: "culture", placeholder: "Культура", type: "text", icon: "Wheat" },
              { name: "area", placeholder: "Площадь (га)", type: "number", icon: "Crop" },
              { name: "budget", placeholder: "Бюджет, ₽", type: "number", icon: "Wallet" },
              { name: "region", placeholder: "Регион", type: "text", icon: "MapPin" },
            ].map((f) => (
              <div key={f.name} className="relative">
                <Icon
                  name={f.icon}
                  size={14}
                  className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400"
                />
                <input
                  type={f.type}
                  placeholder={f.placeholder}
                  value={(form as Record<string, string>)[f.name]}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, [f.name]: e.target.value }))
                  }
                  className="w-full pl-8 pr-3 py-2 rounded-lg border border-gray-200 focus:border-primary focus:ring-1 focus:ring-primary/20 outline-none text-sm"
                />
              </div>
            ))}
          </div>
          <div className="flex gap-2 mt-4">
            <button
              onClick={handleAdd}
              disabled={saving}
              className="hero-gradient text-white text-sm font-medium px-5 py-2 rounded-lg flex items-center gap-2 hover:opacity-90 disabled:opacity-50"
            >
              {saving ? (
                <Icon name="Loader2" size={14} className="animate-spin" />
              ) : (
                <Icon name="Check" size={14} />
              )}
              Сохранить
            </button>
            <button
              onClick={() => setShowAdd(false)}
              className="text-sm text-gray-600 bg-gray-100 hover:bg-gray-200 px-5 py-2 rounded-lg"
            >
              Отмена
            </button>
          </div>
        </div>
      )}

      <div className="glass-card rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200">
              {["Имя", "Культура", "Площадь", "Бюджет", "Регион", "Статус"].map(
                (h) => (
                  <th
                    key={h}
                    className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide"
                  >
                    {h}
                  </th>
                )
              )}
            </tr>
          </thead>
          {loading ? (
            <SkeletonRows rows={5} cols={6} />
          ) : leads.length === 0 ? (
            <tbody>
              <tr>
                <td colSpan={6} className="text-center py-10 text-gray-400">
                  <Icon
                    name="UserPlus"
                    size={32}
                    className="mx-auto mb-2 opacity-30"
                  />
                  <p className="text-sm">Лиды не найдены</p>
                </td>
              </tr>
            </tbody>
          ) : (
            <tbody>
              {leads.map((l) => (
                <tr
                  key={l.id}
                  className="border-b border-gray-100 hover:bg-green-50/50 transition-colors"
                >
                  <td className="px-4 py-3 font-medium text-gray-800">
                    {l.full_name}
                  </td>
                  <td className="px-4 py-3 text-gray-600">
                    {l.culture || "—"}
                  </td>
                  <td className="px-4 py-3 text-gray-600">
                    {l.area ? `${l.area} га` : "—"}
                  </td>
                  <td className="px-4 py-3 text-gray-600">
                    {l.budget
                      ? `${l.budget.toLocaleString("ru-RU")} ₽`
                      : "—"}
                  </td>
                  <td className="px-4 py-3 text-gray-600">
                    {l.region || "—"}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        STATUS_COLORS[l.status || "new"] || STATUS_COLORS.new
                      }`}
                    >
                      {l.status || "Новый"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          )}
        </table>
      </div>
    </div>
  );
};

// ─── Deals Tab ────────────────────────────────────────────────────────────────

const DealsTab: React.FC = () => {
  const [deals, setDeals] = useState<Deal[]>([]);
  const [loading, setLoading] = useState(true);
  const [stageFilter, setStageFilter] = useState("all");
  const [updatingId, setUpdatingId] = useState<number | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    apiCRM("deals_list")
      .then((res) => setDeals(res?.data || res || []))
      .catch(() => setDeals([]))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const filtered =
    stageFilter === "all"
      ? deals
      : deals.filter((d) => d.stage === stageFilter);

  const handleStageChange = async (id: number, stage: string) => {
    setUpdatingId(id);
    try {
      await apiCRM("deals_update", { stage }, id);
      setDeals((prev) =>
        prev.map((d) => (d.id === id ? { ...d, stage } : d))
      );
    } catch {
      // ignore
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div className="space-y-4">
      {/* Stage filter */}
      <div className="flex gap-2 flex-wrap">
        <button
          onClick={() => setStageFilter("all")}
          className={`text-xs px-3 py-1.5 rounded-lg font-medium border transition-all ${
            stageFilter === "all"
              ? "tab-active border-primary/30"
              : "border-gray-200 text-gray-600 hover:border-gray-300"
          }`}
        >
          Все
        </button>
        {KANBAN_STAGES.map((s) => (
          <button
            key={s.key}
            onClick={() => setStageFilter(s.key)}
            className={`text-xs px-3 py-1.5 rounded-lg font-medium border transition-all ${
              stageFilter === s.key
                ? "tab-active border-primary/30"
                : "border-gray-200 text-gray-600 hover:border-gray-300"
            }`}
          >
            {s.label}
          </button>
        ))}
      </div>

      <div className="glass-card rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200">
              {[
                "Название",
                "Сумма",
                "Культура",
                "Объём",
                "Регион",
                "Контакт",
                "Стадия",
              ].map((h) => (
                <th
                  key={h}
                  className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          {loading ? (
            <SkeletonRows rows={5} cols={7} />
          ) : filtered.length === 0 ? (
            <tbody>
              <tr>
                <td colSpan={7} className="text-center py-10 text-gray-400">
                  <Icon
                    name="Handshake"
                    size={32}
                    className="mx-auto mb-2 opacity-30"
                  />
                  <p className="text-sm">Сделки не найдены</p>
                </td>
              </tr>
            </tbody>
          ) : (
            <tbody>
              {filtered.map((d) => (
                <tr
                  key={d.id}
                  className="border-b border-gray-100 hover:bg-green-50/50 transition-colors"
                >
                  <td className="px-4 py-3 font-medium text-gray-800 max-w-[160px] truncate">
                    {d.title}
                  </td>
                  <td className="px-4 py-3 text-primary font-semibold">
                    {d.amount
                      ? `${d.amount.toLocaleString("ru-RU")} ₽`
                      : "—"}
                  </td>
                  <td className="px-4 py-3 text-gray-600">
                    {d.culture || "—"}
                  </td>
                  <td className="px-4 py-3 text-gray-600">
                    {d.volume ? `${d.volume} т` : "—"}
                  </td>
                  <td className="px-4 py-3 text-gray-600">
                    {d.region || "—"}
                  </td>
                  <td className="px-4 py-3 text-gray-600">
                    {d.contact_name || "—"}
                  </td>
                  <td className="px-4 py-3">
                    {updatingId === d.id ? (
                      <Icon
                        name="Loader2"
                        size={14}
                        className="animate-spin text-primary"
                      />
                    ) : (
                      <select
                        value={d.stage || "new"}
                        onChange={(e) =>
                          handleStageChange(d.id, e.target.value)
                        }
                        className="text-xs border border-gray-200 rounded-lg px-2 py-1 focus:border-primary focus:ring-1 focus:ring-primary/20 outline-none bg-white"
                      >
                        {KANBAN_STAGES.map((s) => (
                          <option key={s.key} value={s.key}>
                            {s.label}
                          </option>
                        ))}
                      </select>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          )}
        </table>
      </div>
    </div>
  );
};

// ─── Tasks Tab ────────────────────────────────────────────────────────────────

const TasksTab: React.FC = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [completingId, setCompletingId] = useState<number | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    apiCRM("tasks_list")
      .then((res) => setTasks(res?.data || res || []))
      .catch(() => setTasks([]))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleComplete = async (id: number) => {
    setCompletingId(id);
    try {
      await apiCRM("tasks_update", { status: "done" }, id);
      setTasks((prev) =>
        prev.map((t) => (t.id === id ? { ...t, status: "done" } : t))
      );
    } catch {
      // ignore
    } finally {
      setCompletingId(null);
    }
  };

  return (
    <div className="overflow-x-auto pb-2">
      <div className="flex gap-4 min-w-max">
        {TASK_STATUSES.map((st) => {
          const colTasks = tasks.filter((t) => (t.status || "todo") === st.key);
          return (
            <div
              key={st.key}
              className={`w-64 rounded-xl border-2 ${st.color} flex flex-col`}
            >
              <div className="p-3 border-b border-inherit">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-gray-700">
                    {st.label}
                  </span>
                  <span className="text-xs bg-white/70 text-gray-600 rounded-full px-2 py-0.5 font-medium">
                    {loading ? "..." : colTasks.length}
                  </span>
                </div>
              </div>

              <div className="flex-1 p-2 space-y-2 min-h-[80px]">
                {loading
                  ? Array.from({ length: 2 }).map((_, i) => (
                      <div
                        key={i}
                        className="bg-white rounded-lg p-3 shadow-sm space-y-2"
                      >
                        <Skeleton className="h-3 w-3/4" />
                        <Skeleton className="h-3 w-1/3" />
                      </div>
                    ))
                  : colTasks.length === 0 ? (
                      <p className="text-xs text-gray-400 text-center py-4">
                        Нет задач
                      </p>
                    ) : (
                      colTasks.map((t) => {
                        const pCfg =
                          PRIORITY_CONFIG[t.priority || "medium"];
                        return (
                          <div
                            key={t.id}
                            className="bg-white rounded-lg p-3 shadow-sm hover:shadow-md transition-shadow border border-gray-100"
                          >
                            <p className="text-sm font-medium text-gray-800 leading-snug mb-2">
                              {t.title}
                            </p>
                            <div className="flex items-center justify-between gap-2">
                              <span
                                className={`text-xs px-2 py-0.5 rounded-full font-medium ${pCfg.color}`}
                              >
                                {pCfg.label}
                              </span>
                              {t.due_date && (
                                <span className="text-xs text-gray-400 flex items-center gap-0.5">
                                  <Icon name="Calendar" size={10} />
                                  {new Date(t.due_date).toLocaleDateString(
                                    "ru-RU",
                                    { day: "2-digit", month: "short" }
                                  )}
                                </span>
                              )}
                            </div>
                            {t.assigned_to && (
                              <p className="text-xs text-gray-400 mt-1 flex items-center gap-1">
                                <Icon name="User" size={10} />
                                {t.assigned_to}
                              </p>
                            )}
                            {st.key !== "done" && (
                              <button
                                onClick={() => handleComplete(t.id)}
                                disabled={completingId === t.id}
                                className="mt-2 w-full text-xs bg-primary/10 text-primary hover:bg-primary hover:text-white rounded-lg py-1.5 font-medium transition-all flex items-center justify-center gap-1 disabled:opacity-50"
                              >
                                {completingId === t.id ? (
                                  <Icon
                                    name="Loader2"
                                    size={12}
                                    className="animate-spin"
                                  />
                                ) : (
                                  <Icon name="CheckCircle" size={12} />
                                )}
                                Завершить
                              </button>
                            )}
                          </div>
                        );
                      })
                    )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// ─── Activities Tab ───────────────────────────────────────────────────────────

const ActivitiesTab: React.FC = () => {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    type: "call",
    title: "",
    contact_name: "",
    result: "",
  });

  const load = useCallback(() => {
    setLoading(true);
    apiCRM("activities_list")
      .then((res) => setActivities(res?.data || res || []))
      .catch(() => setActivities([]))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleAdd = async () => {
    if (!form.title.trim()) return;
    setSaving(true);
    try {
      await apiCRM("activities_create", form);
      setShowAdd(false);
      setForm({ type: "call", title: "", contact_name: "", result: "" });
      load();
    } catch {
      // ignore
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <button
          onClick={() => setShowAdd((v) => !v)}
          className="hero-gradient text-white text-sm font-medium px-4 py-2 rounded-lg flex items-center gap-2 hover:opacity-90"
        >
          <Icon name="Plus" size={16} />
          Добавить активность
        </button>
      </div>

      {showAdd && (
        <div className="glass-card rounded-xl p-5 border-2 border-primary/20">
          <h4 className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2">
            <Icon name="Activity" size={16} className="text-primary" />
            Новая активность
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Type */}
            <div className="relative">
              <Icon
                name="Tag"
                size={14}
                className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
              />
              <select
                value={form.type}
                onChange={(e) =>
                  setForm((p) => ({ ...p, type: e.target.value }))
                }
                className="w-full pl-8 pr-3 py-2 rounded-lg border border-gray-200 focus:border-primary focus:ring-1 focus:ring-primary/20 outline-none text-sm appearance-none bg-white"
              >
                {ACTIVITY_TYPES.map((t) => (
                  <option key={t.key} value={t.key || ""}>
                    {t.label}
                  </option>
                ))}
              </select>
            </div>
            {/* Title */}
            <div className="relative">
              <Icon
                name="AlignLeft"
                size={14}
                className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400"
              />
              <input
                type="text"
                placeholder="Описание *"
                value={form.title}
                onChange={(e) =>
                  setForm((p) => ({ ...p, title: e.target.value }))
                }
                className="w-full pl-8 pr-3 py-2 rounded-lg border border-gray-200 focus:border-primary focus:ring-1 focus:ring-primary/20 outline-none text-sm"
              />
            </div>
            {/* Contact */}
            <div className="relative">
              <Icon
                name="User"
                size={14}
                className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400"
              />
              <input
                type="text"
                placeholder="Контакт"
                value={form.contact_name}
                onChange={(e) =>
                  setForm((p) => ({ ...p, contact_name: e.target.value }))
                }
                className="w-full pl-8 pr-3 py-2 rounded-lg border border-gray-200 focus:border-primary focus:ring-1 focus:ring-primary/20 outline-none text-sm"
              />
            </div>
            {/* Result */}
            <div className="relative">
              <Icon
                name="MessageSquare"
                size={14}
                className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400"
              />
              <input
                type="text"
                placeholder="Результат"
                value={form.result}
                onChange={(e) =>
                  setForm((p) => ({ ...p, result: e.target.value }))
                }
                className="w-full pl-8 pr-3 py-2 rounded-lg border border-gray-200 focus:border-primary focus:ring-1 focus:ring-primary/20 outline-none text-sm"
              />
            </div>
          </div>
          <div className="flex gap-2 mt-4">
            <button
              onClick={handleAdd}
              disabled={saving}
              className="hero-gradient text-white text-sm font-medium px-5 py-2 rounded-lg flex items-center gap-2 hover:opacity-90 disabled:opacity-50"
            >
              {saving ? (
                <Icon name="Loader2" size={14} className="animate-spin" />
              ) : (
                <Icon name="Check" size={14} />
              )}
              Сохранить
            </button>
            <button
              onClick={() => setShowAdd(false)}
              className="text-sm text-gray-600 bg-gray-100 hover:bg-gray-200 px-5 py-2 rounded-lg"
            >
              Отмена
            </button>
          </div>
        </div>
      )}

      {/* Feed */}
      <div className="glass-card rounded-xl p-2">
        {loading ? (
          <div className="space-y-1 p-2">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="flex gap-3 items-center p-3">
                <Skeleton className="h-9 w-9 rounded-full flex-shrink-0" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-3 w-2/3" />
                  <Skeleton className="h-3 w-1/3" />
                </div>
                <Skeleton className="h-3 w-20 flex-shrink-0" />
              </div>
            ))}
          </div>
        ) : activities.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            <Icon
              name="Activity"
              size={36}
              className="mx-auto mb-3 opacity-30"
            />
            <p className="text-sm">Нет активностей</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {activities.map((act, idx) => {
              const typeConfig =
                ACTIVITY_TYPES.find((t) => t.key === act.type) ||
                ACTIVITY_TYPES[3];
              return (
                <div
                  key={act.id}
                  className="flex items-start gap-4 p-4 hover:bg-gray-50/80 transition-colors"
                >
                  {/* Timeline connector */}
                  <div className="relative flex flex-col items-center">
                    <div
                      className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 ${typeConfig.color}`}
                    >
                      <Icon name={typeConfig.icon} size={16} />
                    </div>
                    {idx < activities.length - 1 && (
                      <div className="w-px flex-1 bg-gray-200 mt-2 min-h-[16px]" />
                    )}
                  </div>

                  <div className="flex-1 min-w-0 pt-1">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide mr-2">
                          {typeConfig.label}
                        </span>
                        <span className="text-sm font-medium text-gray-800">
                          {act.title}
                        </span>
                      </div>
                      {act.created_at && (
                        <span className="text-xs text-gray-400 flex-shrink-0 pt-0.5">
                          {new Date(act.created_at).toLocaleDateString("ru-RU", {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                          })}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 mt-1">
                      {act.contact_name && (
                        <span className="text-xs text-gray-500 flex items-center gap-1">
                          <Icon name="User" size={11} className="text-gray-400" />
                          {act.contact_name}
                        </span>
                      )}
                      {act.result && (
                        <span className="text-xs text-gray-500 flex items-center gap-1">
                          <Icon
                            name="MessageSquare"
                            size={11}
                            className="text-gray-400"
                          />
                          {act.result}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

// ─── Main SectionCRM ──────────────────────────────────────────────────────────

const SectionCRM: React.FC = () => {
  const [tab, setTab] = useState<Tab>("dashboard");

  const renderTab = () => {
    switch (tab) {
      case "dashboard":
        return <DashboardTab />;
      case "kanban":
        return <KanbanTab />;
      case "contacts":
        return <ContactsTab />;
      case "leads":
        return <LeadsTab />;
      case "deals":
        return <DealsTab />;
      case "tasks":
        return <TasksTab />;
      case "activities":
        return <ActivitiesTab />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="hero-gradient shadow-lg">
        <div className="max-w-screen-2xl mx-auto px-4 sm:px-6">
          {/* Top bar */}
          <div className="flex items-center justify-between py-4 border-b border-white/15">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-white/15 backdrop-blur-sm border border-white/25 flex items-center justify-center">
                <Icon name="Sprout" size={20} className="text-white" />
              </div>
              <div>
                <h1 className="text-lg font-heading font-bold text-white leading-none">
                  АгроПорт CRM
                </h1>
                <p className="text-white/60 text-xs mt-0.5">
                  Управление клиентами
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 text-white/70 text-sm">
              <Icon name="Calendar" size={14} />
              <span>
                {new Date().toLocaleDateString("ru-RU", {
                  day: "2-digit",
                  month: "long",
                  year: "numeric",
                })}
              </span>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex items-center gap-1 py-2 overflow-x-auto scrollbar-none">
            {TABS.map((t) => (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium whitespace-nowrap transition-all duration-200 flex-shrink-0 ${
                  tab === t.key
                    ? "bg-white text-primary shadow-md"
                    : "text-white/80 hover:text-white hover:bg-white/15"
                }`}
              >
                <Icon name={t.icon} size={16} />
                <span className="hidden sm:inline">{t.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 py-6">
        {renderTab()}
      </div>
    </div>
  );
};

export default SectionCRM;
