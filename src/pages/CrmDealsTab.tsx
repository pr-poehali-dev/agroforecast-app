import React, { useState, useEffect, useCallback } from "react";
import Icon from "@/components/ui/icon";
import { apiCRM } from "@/lib/auth";
import { Deal, KANBAN_STAGES, SkeletonRows } from "./CrmTypes";

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
