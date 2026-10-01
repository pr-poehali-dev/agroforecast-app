import { useEffect, useMemo, useState } from "react";
import { CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import Icon from "@/components/ui/icon";
import {
  BacktestPoint, ModelCrop, ModelSummary, fetchBacktest, fetchModelSummary, fmtPeriod, fmtRub,
} from "@/lib/priceModel";

const HORIZON_LABEL: Record<number, string> = { 1: "1 мес", 3: "3 мес", 6: "6 мес" };

function SkillBadge({ skill }: { skill?: number | null }) {
  if (skill === undefined || skill === null) return null;
  const good = skill > 0;
  return (
    <span className={`px-1.5 py-0.5 rounded text-[10px] font-semibold ${good ? "bg-primary/15 text-primary" : "bg-secondary text-muted-foreground"}`}>
      {good ? `точнее ориентира на ${skill}%` : skill === 0 ? "на уровне ориентира" : `хуже ориентира на ${Math.abs(skill)}%`}
    </span>
  );
}

// Прогноз цены с метриками проверки на истории. Используется в разделе прогнозов и на странице /tech.
export default function ValidatedForecast({ compact = false }: { compact?: boolean }) {
  const [data, setData] = useState<ModelSummary | null>(null);
  const [error, setError] = useState("");
  const [crop, setCrop] = useState<ModelCrop["crop"]>("wheat");
  const [h, setH] = useState(1);
  const [points, setPoints] = useState<BacktestPoint[]>([]);

  useEffect(() => {
    fetchModelSummary().then(setData).catch(e => setError(e.message));
  }, []);

  useEffect(() => {
    fetchBacktest(crop, h).then(setPoints).catch(() => setPoints([]));
  }, [crop, h]);

  const current = data?.crops.find(c => c.crop === crop);
  const hz = current?.horizons.find(x => x.h === h);

  const chart = useMemo(() => {
    const rows: Record<string, { t: string; actual?: number; pred?: number; naive?: number }> = {};
    const addMonths = (p: string, n: number) => {
      const [y, m] = p.split("-").map(Number);
      const d = new Date(y, m - 1 + n, 1);
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    };
    points.forEach(p => {
      const target = addMonths(p.t, h);
      rows[target] = { t: target, actual: p.actual, pred: p.pred, naive: p.base };
    });
    return Object.values(rows).sort((a, b) => a.t.localeCompare(b.t));
  }, [points, h]);

  if (error) {
    return <div className="glass-card rounded-2xl p-5 text-sm text-muted-foreground">Прогноз временно недоступен: {error}</div>;
  }
  if (!data) {
    return (
      <div className="glass-card rounded-2xl p-6 flex items-center gap-2 text-sm text-muted-foreground">
        <Icon name="Loader" size={16} className="animate-spin text-primary" />Загрузка модели…
      </div>
    );
  }

  return (
    <div className="glass-card rounded-2xl overflow-hidden">
      <div className="px-5 py-4 border-b border-border flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
            <Icon name="ShieldCheck" size={16} className="text-primary" />
          </div>
          <div>
            <div className="font-heading font-bold text-sm text-foreground">Прогноз цены с проверкой на истории</div>
            <div className="text-[11px] text-muted-foreground">Цены производителей по РФ · Росстат, Всемирный банк, Банк России</div>
          </div>
        </div>
        <div className="flex gap-1 bg-secondary p-1 rounded-xl">
          {data.crops.map(c => (
            <button key={c.crop} onClick={() => setCrop(c.crop)}
              className={`px-3 py-1.5 text-xs rounded-lg font-semibold transition-all ${crop === c.crop ? "bg-white text-primary shadow-sm" : "text-muted-foreground hover:text-foreground"}`}>
              {c.name.split(" ")[0]}
            </button>
          ))}
        </div>
      </div>

      {current && (
        <div className="p-5 space-y-5">
          <div className="grid sm:grid-cols-3 gap-3">
            {current.horizons.map(x => (
              <button key={x.h} onClick={() => setH(x.h)}
                className={`text-left rounded-xl border p-4 transition-all ${h === x.h ? "border-primary bg-primary/5" : "border-border hover:border-primary/40"}`}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-muted-foreground">Через {HORIZON_LABEL[x.h]}</span>
                  {x.forecast && <span className="text-[10px] text-muted-foreground">{fmtPeriod(x.forecast.target_period)}</span>}
                </div>
                {x.forecast ? (
                  <>
                    <div className="font-mono font-black text-xl text-foreground">{fmtRub(x.forecast.forecast)}</div>
                    <div className={`text-xs font-semibold ${x.forecast.change_pct > 0 ? "text-primary" : x.forecast.change_pct < 0 ? "text-destructive" : "text-muted-foreground"}`}>
                      {x.forecast.change_pct > 0 ? "+" : ""}{x.forecast.change_pct}% к {fmtPeriod(x.forecast.base_period)}
                    </div>
                    <div className="text-[11px] text-muted-foreground mt-1">
                      80% интервал: {x.forecast.low80.toLocaleString("ru")}–{x.forecast.high80.toLocaleString("ru")}
                    </div>
                    <div className="mt-2 pt-2 border-t border-border space-y-1">
                      <div className="text-[11px] text-foreground">Ошибка на истории: <b>{x.mape}%</b> <span className="text-muted-foreground">(ориентир «без изменений»: {x.mape_naive}%)</span></div>
                      <SkillBadge skill={x.skill_pct} />
                    </div>
                  </>
                ) : (
                  <div className="text-xs text-muted-foreground">Проверка на истории ещё не выполнялась</div>
                )}
              </button>
            ))}
          </div>

          {!compact && chart.length > 0 && (
            <div>
              <div className="text-xs font-semibold text-foreground mb-2">
                Проверка на истории, горизонт {HORIZON_LABEL[h]}: прогноз модели и факт ({hz?.n} прогнозов, {fmtPeriod(hz?.test_from)} – {fmtPeriod(hz?.test_to)})
              </div>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chart} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="t" tickFormatter={fmtPeriod} tick={{ fontSize: 10 }} minTickGap={24} />
                    <YAxis tick={{ fontSize: 10 }} width={56} tickFormatter={v => `${Math.round(v / 1000)}к`} domain={["auto", "auto"]} />
                    <Tooltip formatter={(v: number) => fmtRub(v)} labelFormatter={fmtPeriod} />
                    <Legend wrapperStyle={{ fontSize: 11 }} />
                    <Line type="monotone" dataKey="actual" name="Факт" stroke="hsl(var(--foreground))" strokeWidth={2} dot={false} />
                    <Line type="monotone" dataKey="pred" name="Прогноз модели" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} />
                    <Line type="monotone" dataKey="naive" name="Ориентир «без изменений»" stroke="hsl(var(--muted-foreground))" strokeDasharray="4 4" dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          <div className="flex items-start gap-2 text-[11px] text-muted-foreground bg-secondary/60 rounded-xl px-3 py-2">
            <Icon name="Info" size={13} className="text-primary mt-0.5 shrink-0" />
            <span>
              Ошибка — средняя абсолютная ошибка в процентах (MAPE) на отложенном периоде: модель на каждом шаге обучалась только на прошлых данных.
              Ориентир «без изменений» — прогноз, что цена останется прежней; модель полезна там, где её ошибка ниже ориентира.
              Последние официальные данные: {fmtPeriod(current.last_period)}, {fmtRub(current.last_price)}.
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
