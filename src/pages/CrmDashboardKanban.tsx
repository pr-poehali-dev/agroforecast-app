import React, { useState, useEffect, useCallback } from "react";
import Icon from "@/components/ui/icon";
import { apiCRM } from "@/lib/auth";
import { KpiData, Deal, KANBAN_STAGES, ACTIVITY_TYPES, Skeleton } from "./CrmTypes";

// ─── Dashboard Tab ────────────────────────────────────────────────────────────

export const DashboardTab: React.FC = () => {
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

export const KanbanTab: React.FC = () => {
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