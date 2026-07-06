import React, { useState, useEffect, useCallback } from "react";
import Icon from "@/components/ui/icon";
import { apiCRM } from "@/lib/auth";
import { Deal, KANBAN_STAGES, SkeletonRows } from "./CrmTypes";

// ─── Deals Tab ────────────────────────────────────────────────────────────────

interface AiResult {
  next_step?: string;
  health?: number;
  risk?: string;
  summary?: string;
}
interface AiEmail {
  subject?: string;
  body?: string;
  recipient?: string;
}
interface TimelineItem {
  channel: string;
  title: string;
  text?: string;
  at: string;
  dir: string;
  status?: string;
}

const CHANNEL_ICON: Record<string, string> = {
  email: "Mail", telegram: "Send", max: "MessageCircle", call: "Phone",
  meeting: "Users", note: "StickyNote", stage: "GitBranch", task: "CheckSquare",
};

const healthColor = (h?: number) =>
  h == null ? "text-gray-400" : h >= 70 ? "text-green-600" : h >= 40 ? "text-amber-500" : "text-red-500";
const healthBg = (h?: number) =>
  h == null ? "bg-gray-300" : h >= 70 ? "bg-green-500" : h >= 40 ? "bg-amber-500" : "bg-red-500";

export const DealsTab: React.FC = () => {
  const [deals, setDeals] = useState<Deal[]>([]);
  const [loading, setLoading] = useState(true);
  const [stageFilter, setStageFilter] = useState("all");
  const [updatingId, setUpdatingId] = useState<number | null>(null);
  const [aiDealId, setAiDealId] = useState<number | null>(null);
  const [aiBusy, setAiBusy] = useState(false);
  const [aiResult, setAiResult] = useState<AiResult | null>(null);
  const [emailBusy, setEmailBusy] = useState(false);
  const [email, setEmail] = useState<AiEmail | null>(null);
  const [timeline, setTimeline] = useState<TimelineItem[] | null>(null);
  const [tlBusy, setTlBusy] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    apiCRM("deals_list")
      .then((res) => setDeals(Array.isArray(res?.deals) ? res.deals : Array.isArray(res) ? res : []))
      .catch(() => setDeals([]))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const filtered = stageFilter === "all" ? deals : deals.filter((d) => d.stage === stageFilter);

  const handleStageChange = async (id: number, stage: string) => {
    setUpdatingId(id);
    try {
      await apiCRM("deals_update", { stage }, id);
      setDeals((prev) => prev.map((d) => (d.id === id ? { ...d, stage } : d)));
    } catch {
      // ignore
    } finally {
      setUpdatingId(null);
    }
  };

  const runAi = async (deal: Deal) => {
    setAiDealId(deal.id);
    setAiBusy(true);
    setAiResult(null);
    setEmail(null);
    setTimeline(null);
    try {
      const r = await apiCRM("deal_ai_next", {}, deal.id);
      if (r?.success) {
        setAiResult(r);
        setDeals((prev) => prev.map((d) => (d.id === deal.id ? { ...d, next_step: r.next_step, health: r.health } : d)));
      }
    } finally {
      setAiBusy(false);
    }
  };

  const runEmail = async (deal: Deal) => {
    setEmailBusy(true);
    setEmail(null);
    try {
      const r = await apiCRM("deal_ai_email", { purpose: "продвинуть сделку на следующий этап" }, deal.id);
      if (r?.success) setEmail(r);
    } finally {
      setEmailBusy(false);
    }
  };

  const loadTimeline = async (deal: Deal) => {
    setTlBusy(true);
    try {
      const r = await apiCRM("deal_timeline", undefined, deal.id);
      setTimeline(Array.isArray(r?.timeline) ? r.timeline : []);
    } finally {
      setTlBusy(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Stage filter */}
      <div className="flex gap-2 flex-wrap">
        <button
          onClick={() => setStageFilter("all")}
          className={`text-xs px-3 py-1.5 rounded-lg font-medium border transition-all ${
            stageFilter === "all" ? "tab-active border-primary/30" : "border-gray-200 text-gray-600 hover:border-gray-300"
          }`}
        >
          Все
        </button>
        {KANBAN_STAGES.map((s) => (
          <button
            key={s.key}
            onClick={() => setStageFilter(s.key)}
            className={`text-xs px-3 py-1.5 rounded-lg font-medium border transition-all ${
              stageFilter === s.key ? "tab-active border-primary/30" : "border-gray-200 text-gray-600 hover:border-gray-300"
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
              {["Название", "Здоровье", "Сумма", "Культура", "Контакт", "Стадия", "ИИ"].map((h) => (
                <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">
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
                  <Icon name="Handshake" size={32} className="mx-auto mb-2 opacity-30" />
                  <p className="text-sm">Сделки не найдены</p>
                </td>
              </tr>
            </tbody>
          ) : (
            <tbody>
              {filtered.map((d) => (
                <React.Fragment key={d.id}>
                  <tr className="border-b border-gray-100 hover:bg-green-50/50 transition-colors">
                    <td className="px-4 py-3 font-medium text-gray-800 max-w-[160px] truncate">{d.title}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5">
                        <div className="w-10 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                          <div className={`h-full rounded-full ${healthBg(d.health)}`} style={{ width: `${d.health ?? 0}%` }} />
                        </div>
                        <span className={`text-[11px] font-semibold ${healthColor(d.health)}`}>{d.health ?? "—"}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-primary font-semibold">
                      {d.amount ? `${d.amount.toLocaleString("ru-RU")} ₽` : "—"}
                    </td>
                    <td className="px-4 py-3 text-gray-600 max-w-[120px] truncate">{d.crop || d.culture || "—"}</td>
                    <td className="px-4 py-3 text-gray-600">{d.contact_name || "—"}</td>
                    <td className="px-4 py-3">
                      {updatingId === d.id ? (
                        <Icon name="Loader2" size={14} className="animate-spin text-primary" />
                      ) : (
                        <select
                          value={d.stage || "new"}
                          onChange={(e) => handleStageChange(d.id, e.target.value)}
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
                    <td className="px-4 py-3">
                      <button
                        onClick={() => runAi(d)}
                        disabled={aiBusy && aiDealId === d.id}
                        title="ИИ-совет по сделке"
                        className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg hero-gradient text-white text-xs font-medium hover:opacity-90 disabled:opacity-60"
                      >
                        {aiBusy && aiDealId === d.id ? (
                          <Icon name="Loader2" size={13} className="animate-spin" />
                        ) : (
                          <Icon name="Sparkles" size={13} />
                        )}
                        ИИ
                      </button>
                    </td>
                  </tr>

                  {/* ИИ-панель под сделкой */}
                  {aiDealId === d.id && (aiResult || d.next_step || email) && (
                    <tr className="bg-primary/5">
                      <td colSpan={7} className="px-4 py-3">
                        {aiResult && (
                          <div className="space-y-2">
                            <div className="flex items-start gap-2">
                              <Icon name="Lightbulb" size={15} className="text-amber-500 mt-0.5 shrink-0" />
                              <div>
                                <p className="text-xs font-semibold text-gray-700">Следующий шаг</p>
                                <p className="text-xs text-gray-600">{aiResult.next_step}</p>
                              </div>
                            </div>
                            {aiResult.risk && (
                              <div className="flex items-start gap-2">
                                <Icon name="TriangleAlert" size={15} className="text-red-500 mt-0.5 shrink-0" />
                                <div>
                                  <p className="text-xs font-semibold text-gray-700">Риск</p>
                                  <p className="text-xs text-gray-600">{aiResult.risk}</p>
                                </div>
                              </div>
                            )}
                            <div className="flex gap-2 pt-1">
                              <button
                                onClick={() => runEmail(d)}
                                disabled={emailBusy}
                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-primary/30 text-primary text-xs font-medium hover:bg-primary/5 disabled:opacity-60"
                              >
                                {emailBusy ? <Icon name="Loader2" size={13} className="animate-spin" /> : <Icon name="Mail" size={13} />}
                                Сгенерировать письмо
                              </button>
                              <button
                                onClick={() => loadTimeline(d)}
                                disabled={tlBusy}
                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-gray-200 text-gray-600 text-xs font-medium hover:bg-gray-50 disabled:opacity-60"
                              >
                                {tlBusy ? <Icon name="Loader2" size={13} className="animate-spin" /> : <Icon name="History" size={13} />}
                                История общения
                              </button>
                              <button
                                onClick={() => { setAiDealId(null); setAiResult(null); setEmail(null); setTimeline(null); }}
                                className="text-xs text-gray-500 hover:text-gray-700 px-2"
                              >
                                Скрыть
                              </button>
                            </div>
                          </div>
                        )}
                        {email && (
                          <div className="mt-3 bg-white rounded-lg border border-gray-200 p-3">
                            <p className="text-xs font-semibold text-gray-700 mb-1">
                              Тема: {email.subject}
                              {email.recipient && <span className="text-gray-400 font-normal"> · для {email.recipient}</span>}
                            </p>
                            <pre className="text-xs text-gray-600 whitespace-pre-wrap font-sans">{email.body}</pre>
                            <button
                              onClick={() => navigator.clipboard?.writeText(`${email.subject}\n\n${email.body}`)}
                              className="mt-2 flex items-center gap-1 text-xs text-primary hover:underline"
                            >
                              <Icon name="Copy" size={12} />Скопировать
                            </button>
                          </div>
                        )}
                        {timeline && (
                          <div className="mt-3">
                            <p className="text-xs font-semibold text-gray-700 mb-2 flex items-center gap-1.5">
                              <Icon name="History" size={13} className="text-gray-500" />История общения (все каналы)
                            </p>
                            {timeline.length === 0 ? (
                              <p className="text-xs text-gray-400">Пока нет событий по этой сделке.</p>
                            ) : (
                              <div className="space-y-1.5 max-h-64 overflow-y-auto pr-1">
                                {timeline.map((t, i) => (
                                  <div key={i} className="flex items-start gap-2 bg-white rounded-lg border border-gray-100 px-2.5 py-2">
                                    <Icon name={CHANNEL_ICON[t.channel] || "Circle"} size={13} className={`mt-0.5 shrink-0 ${t.dir === "out" ? "text-blue-500" : "text-gray-400"}`} />
                                    <div className="min-w-0 flex-1">
                                      <div className="flex items-center justify-between gap-2">
                                        <span className="text-xs font-medium text-gray-700 truncate">{t.title}</span>
                                        <span className="text-[10px] text-gray-400 shrink-0">{new Date(t.at).toLocaleDateString("ru-RU")}</span>
                                      </div>
                                      {t.text && <p className="text-[11px] text-gray-500 line-clamp-2">{t.text}</p>}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        )}
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
            </tbody>
          )}
        </table>
      </div>
    </div>
  );
};

export default DealsTab;