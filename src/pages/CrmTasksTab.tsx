import React, { useState, useEffect, useCallback } from "react";
import Icon from "@/components/ui/icon";
import { apiCRM } from "@/lib/auth";
import { Task, TASK_STATUSES, PRIORITY_CONFIG, Skeleton } from "./CrmTypes";

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
