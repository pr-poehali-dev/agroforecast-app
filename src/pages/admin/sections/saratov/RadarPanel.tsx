import { useEffect, useState } from "react";
import Icon from "@/components/ui/icon";
import { adminApi } from "@/lib/adminApi";
import { RadarItem, RadarReport, Supplier, STATUS_LABELS } from "./shared";

const TEMP = {
  hot:  { label: "Горячий", cls: "bg-rose-100 text-rose-700 border-rose-200",     bar: "bg-rose-500",   icon: "Flame" },
  warm: { label: "Тёплый",  cls: "bg-amber-100 text-amber-700 border-amber-200",  bar: "bg-amber-500",  icon: "Thermometer" },
  cold: { label: "Холодный",cls: "bg-secondary text-muted-foreground border-border", bar: "bg-muted-foreground/40", icon: "Snowflake" },
} as const;

// ── Радар потенциальных клиентов: рейтинг по вероятности сделки ───────────────
export default function RadarPanel({
  filterParams, onClose, onOpen,
}: {
  filterParams: () => Record<string, string>;
  onClose: () => void;
  onOpen: (item: Partial<Supplier>) => void;
}) {
  const [report, setReport] = useState<RadarReport | null>(null);
  const [loading, setLoading] = useState(true);

  const load = () => {
    setLoading(true);
    adminApi.suppliersRadar({ ...filterParams(), limit: "50" })
      .then(setReport)
      .catch(() => setReport(null))
      .finally(() => setLoading(false));
  };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { load(); }, []);

  const s = report?.summary;

  return (
    <div className="glass-card rounded-xl p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="font-heading font-bold text-sm flex items-center gap-2">
          <Icon name="Radar" size={15} className="text-primary" />
          Радар клиентов
          {s && <span className="text-xs font-normal text-muted-foreground">· топ по вероятности сделки</span>}
        </h4>
        <div className="flex items-center gap-1">
          <button onClick={load} title="Пересчитать" className="p-1 text-muted-foreground hover:text-foreground">
            <Icon name="RefreshCw" size={15} />
          </button>
          <button onClick={onClose} className="p-1 text-muted-foreground hover:text-foreground">
            <Icon name="X" size={16} />
          </button>
        </div>
      </div>

      {/* Сводка */}
      {s && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {[
            { label: "В выборке", val: s.total, icon: "Users", cls: "text-foreground" },
            { label: "Горячие", val: s.hot, icon: "Flame", cls: "text-rose-600" },
            { label: "Тёплые", val: s.warm, icon: "Thermometer", cls: "text-amber-600" },
            { label: "Без ИИ-досье", val: s.no_analysis, icon: "Sparkles", cls: "text-muted-foreground" },
          ].map(m => (
            <div key={m.label} className="rounded-lg border border-border p-2.5">
              <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground mb-0.5">
                <Icon name={m.icon} size={12} className="text-primary" />{m.label}
              </div>
              <div className={`font-heading font-bold text-lg ${m.cls}`}>{m.val}</div>
            </div>
          ))}
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-8"><Icon name="Loader" size={22} className="animate-spin text-primary" /></div>
      ) : !report || report.radar.length === 0 ? (
        <p className="text-xs text-muted-foreground py-4 text-center">Нет клиентов в текущей выборке.</p>
      ) : (
        <div className="space-y-2">
          {report.radar.map((r: RadarItem, i: number) => {
            const t = TEMP[r.temp];
            return (
              <div key={r.id} onClick={() => onOpen(r as Partial<Supplier>)}
                className="rounded-xl border border-border p-3 flex items-start gap-3 cursor-pointer hover:border-primary/40 transition-colors">
                <div className="w-6 text-center text-xs font-bold text-muted-foreground pt-1.5">{i + 1}</div>

                {/* Балл */}
                <div className="flex flex-col items-center shrink-0 w-12">
                  <div className={`font-heading font-black text-lg leading-none ${r.temp === "hot" ? "text-rose-600" : r.temp === "warm" ? "text-amber-600" : "text-muted-foreground"}`}>
                    {r.score}
                  </div>
                  <div className="w-full h-1.5 rounded-full bg-secondary overflow-hidden mt-1">
                    <div className={`h-full ${t.bar}`} style={{ width: `${r.score}%` }} />
                  </div>
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-sm text-foreground truncate max-w-full">{r.name}</span>
                    <span className={`px-1.5 py-0.5 rounded-full border text-[10px] font-semibold ${t.cls}`}>
                      <Icon name={t.icon} size={9} className="inline mr-0.5" />{t.label}
                    </span>
                  </div>
                  <div className="text-[11px] text-muted-foreground mt-0.5 flex flex-wrap gap-x-2 gap-y-0.5">
                    {r.district && <span>📍 {r.district}</span>}
                    {r.crops && <span className="truncate max-w-[180px]">🌾 {r.crops}</span>}
                    <span>{STATUS_LABELS[r.status] || r.status}</span>
                  </div>
                  {r.reasons.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-1.5">
                      {r.reasons.slice(0, 4).map((rs, k) => (
                        <span key={k} className="text-[10px] bg-secondary px-1.5 py-0.5 rounded text-muted-foreground">{rs}</span>
                      ))}
                    </div>
                  )}
                </div>

                <div className="shrink-0 flex flex-col items-end gap-1">
                  {r.phone && <span className="text-[11px] text-primary font-mono">{r.phone}</span>}
                  <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                    {r.ai_analysis ? <><Icon name="CheckCircle2" size={11} className="text-emerald-500" />ИИ-досье</> :
                     <><Icon name="Sparkles" size={11} className="text-primary" />нужен ИИ-анализ</>}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <p className="text-[11px] text-muted-foreground flex items-start gap-1.5">
        <Icon name="Lightbulb" size={12} className="text-amber-500 mt-0.5 shrink-0" />
        Балл учитывает объём, контакты, приоритетный район, статус и давность касания. Откройте клиента и во вкладке «ИИ» получите развёрнутый анализ и прогноз.
      </p>
    </div>
  );
}
