import React, { useState, useEffect, useCallback } from "react";
import Icon from "@/components/ui/icon";
import { apiCRM } from "@/lib/auth";
import {
  Deal,
  Task,
  Activity,
  KANBAN_STAGES,
  TASK_STATUSES,
  ACTIVITY_TYPES,
  PRIORITY_CONFIG,
  STAGE_LABELS,
  Skeleton,
  SkeletonRows,
} from "./CrmTypes";

// ─── Deals Tab ────────────────────────────────────────────────────────────────

export const DealsTab: React.FC = () => {
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

export const TasksTab: React.FC = () => {
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

export const ActivitiesTab: React.FC = () => {
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