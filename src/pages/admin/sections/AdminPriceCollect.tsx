import { useEffect, useState } from "react";
import Icon from "@/components/ui/icon";
import { adminToken } from "@/lib/adminApi";

const PRICES_URL = "https://functions.poehali.dev/52189484-0746-4acc-8694-949dc8ee7f62";

interface CollectRun { at: string; trigger: string; status: string; saved: number; message: string }
interface CollectStatus {
  last_collect: string | null;
  days_with_data: number;
  rows_total: number;
  missing_days_30: string[];
  runs: CollectRun[];
}

const TRIGGER: Record<string, string> = {
  schedule: "по расписанию", admin: "вручную (админ)", force: "принудительно", visit: "при открытии сайта",
};

const fmt = (s: string) => new Date(s.replace(" ", "T")).toLocaleString("ru", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });

async function call(action: string) {
  const r = await fetch(`${PRICES_URL}?action=${action}`, { headers: { "X-Admin-Token": adminToken.get() } });
  const d = await r.json().catch(() => ({}));
  if (r.status === 403) throw new Error("Нет доступа — войдите в админку заново");
  return d;
}

// Журнал ежедневного сбора цен закупщиков
export default function AdminPriceCollect() {
  const [data, setData] = useState<CollectStatus | null>(null);
  const [error, setError] = useState("");
  const [running, setRunning] = useState(false);
  const [msg, setMsg] = useState("");

  const load = () => call("collect_status").then(setData).catch(e => setError(e.message));
  useEffect(() => { load(); }, []);

  const runNow = async () => {
    setRunning(true); setMsg("Собираю цены…");
    try {
      const r = await call("collect");
      setMsg(r.ok ? `Готово: сохранено ${r.saved} цен${r.status?.cenazerna === "partial" ? " (не все культуры — см. журнал)" : ""}.` : "Источник не ответил, попытка записана в журнал.");
      load();
    } catch (e: unknown) {
      setMsg(e instanceof Error ? e.message : "Ошибка");
    } finally { setRunning(false); }
  };

  const lastAgeH = data?.last_collect ? (Date.now() - new Date(data.last_collect.replace(" ", "T")).getTime()) / 3.6e6 : null;
  const healthy = lastAgeH !== null && lastAgeH < 26;
  const hasSchedule = data?.runs.some(r => r.trigger === "schedule");

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <Icon name="CalendarClock" size={18} className="text-primary" />
          <h2 className="font-heading font-bold text-lg">Сбор цен</h2>
        </div>
        <button onClick={runNow} disabled={running}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl hero-gradient text-white text-xs font-medium disabled:opacity-60">
          {running ? <Icon name="Loader" size={13} className="animate-spin" /> : <Icon name="RefreshCw" size={13} />}
          Собрать сейчас
        </button>
      </div>

      {msg && <div className="text-xs px-3 py-2 rounded-xl bg-secondary">{msg}</div>}
      {error && <div className="text-xs px-3 py-2 rounded-xl bg-rose-100 text-rose-700">{error}</div>}

      {!data && !error && (
        <div className="flex justify-center py-10"><Icon name="Loader" size={22} className="animate-spin text-primary" /></div>
      )}

      {data && (
        <>
          <div className="grid sm:grid-cols-4 gap-3">
            <div className={`glass-card rounded-xl p-4 ${healthy ? "" : "border-rose-300"}`}>
              <div className="text-[11px] text-muted-foreground">Последний сбор</div>
              <div className="font-mono font-bold text-sm mt-1">{data.last_collect ? fmt(data.last_collect) : "—"}</div>
              <div className={`text-[11px] mt-1 font-semibold ${healthy ? "text-emerald-600" : "text-rose-600"}`}>
                {healthy ? "в норме" : "больше суток назад"}
              </div>
            </div>
            <div className="glass-card rounded-xl p-4">
              <div className="text-[11px] text-muted-foreground">Дней с данными</div>
              <div className="font-mono font-bold text-xl mt-1">{data.days_with_data}</div>
            </div>
            <div className="glass-card rounded-xl p-4">
              <div className="text-[11px] text-muted-foreground">Цен в базе</div>
              <div className="font-mono font-bold text-xl mt-1">{data.rows_total.toLocaleString("ru")}</div>
            </div>
            <div className="glass-card rounded-xl p-4">
              <div className="text-[11px] text-muted-foreground">Пропуски за 30 дней</div>
              <div className={`font-mono font-bold text-xl mt-1 ${data.missing_days_30.length ? "text-amber-600" : "text-emerald-600"}`}>
                {data.missing_days_30.length}
              </div>
            </div>
          </div>

          {!hasSchedule && (
            <div className="flex items-start gap-2 text-xs px-3 py-2.5 rounded-xl bg-amber-50 text-amber-800 border border-amber-200">
              <Icon name="AlertTriangle" size={14} className="shrink-0 mt-0.5" />
              <span>Сбора по расписанию ещё не было. Пока планировщик не настроен, цены собираются только при открытии сайта.</span>
            </div>
          )}

          {data.missing_days_30.length > 0 && (
            <div className="glass-card rounded-xl p-4">
              <div className="text-xs font-semibold mb-2">Дни без сбора (последние 30 дней)</div>
              <div className="flex flex-wrap gap-1.5">
                {data.missing_days_30.map(d => (
                  <span key={d} className="px-2 py-0.5 rounded-md bg-secondary text-[11px] font-mono">{d.slice(5).split("-").reverse().join(".")}</span>
                ))}
              </div>
            </div>
          )}

          <div className="glass-card rounded-xl overflow-hidden">
            <div className="px-4 py-2.5 border-b border-border text-xs font-semibold">Последние запуски</div>
            <table className="w-full text-xs">
              <tbody>
                {data.runs.length === 0 && (
                  <tr><td className="px-4 py-4 text-muted-foreground">Запусков пока не было</td></tr>
                )}
                {data.runs.map((r, i) => (
                  <tr key={i} className="border-t border-border/60">
                    <td className="px-4 py-2 font-mono">{fmt(r.at)}</td>
                    <td className="px-4 py-2 text-muted-foreground">{TRIGGER[r.trigger] ?? r.trigger}</td>
                    <td className="px-4 py-2">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${r.status === "ok" ? "bg-emerald-100 text-emerald-700" : r.status === "partial" ? "bg-amber-100 text-amber-700" : "bg-rose-100 text-rose-700"}`}>
                        {r.status === "ok" ? "успешно" : r.status === "partial" ? "частично" : "ошибка"}
                      </span>
                    </td>
                    <td className="px-4 py-2 text-right font-mono">{r.saved}</td>
                    <td className="px-4 py-2 text-muted-foreground">{r.message}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
