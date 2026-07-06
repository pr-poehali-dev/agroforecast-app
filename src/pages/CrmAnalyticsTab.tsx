import React, { useState, useEffect } from "react";
import Icon from "@/components/ui/icon";
import { apiCRM } from "@/lib/auth";
import { Analytics } from "./CrmTypes";

const fmtMoney = (n: number) =>
  n >= 1_000_000 ? `${(n / 1_000_000).toFixed(1)} млн ₽` : `${Math.round(n).toLocaleString("ru-RU")} ₽`;

const KpiCard: React.FC<{ icon: string; label: string; value: string; accent?: string; hint?: string }> = ({
  icon, label, value, accent = "text-primary", hint,
}) => (
  <div className="glass-card rounded-xl p-4">
    <div className="flex items-center justify-between mb-2">
      <span className="text-xs text-gray-500 font-medium">{label}</span>
      <Icon name={icon} size={16} className={accent} />
    </div>
    <div className="text-xl font-heading font-bold text-gray-800">{value}</div>
    {hint && <div className="text-[11px] text-gray-400 mt-0.5">{hint}</div>}
  </div>
);

export const AnalyticsTab: React.FC = () => {
  const [data, setData] = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    apiCRM("analytics")
      .then((res) => setData(res && !res.error ? res : null))
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, []);

  if (loading)
    return (
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="glass-card rounded-xl p-4 animate-pulse h-24" />
        ))}
      </div>
    );

  if (!data)
    return (
      <div className="text-center py-16 text-gray-400">
        <Icon name="TrendingUp" size={40} className="mx-auto mb-3 opacity-30" />
        <p className="text-sm">Нет данных для аналитики</p>
      </div>
    );

  const maxFunnel = Math.max(...data.funnel.map((f) => f.count), 1);
  const maxMgr = Math.max(...data.managers.map((m) => m.revenue), 1);

  return (
    <div className="space-y-5">
      {/* KPI cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <KpiCard icon="Wallet" label="Выручка (закрыто)" value={fmtMoney(data.revenue)} />
        <KpiCard icon="TrendingUp" label="Прогноз (взвеш.)" value={fmtMoney(data.forecast)} accent="text-amber-500" hint="по вероятности сделок" />
        <KpiCard icon="Target" label="Конверсия" value={`${data.conversion}%`} accent="text-green-600" hint={`${data.won} выиграно / ${data.lost} потеряно`} />
        <KpiCard icon="Receipt" label="Средний чек" value={fmtMoney(data.avg_deal)} accent="text-blue-500" />
        <KpiCard icon="Handshake" label="Всего сделок" value={String(data.total_deals)} accent="text-purple-500" />
        <KpiCard icon="Wheat" label="Закуплено, т" value={data.volume_won.toLocaleString("ru-RU")} accent="text-yellow-600" />
        <KpiCard icon="AlarmClock" label="Застряло" value={String(data.stalled)} accent={data.stalled ? "text-red-500" : "text-gray-400"} hint="без активности 5+ дней" />
        <KpiCard icon="Users" label="Менеджеров" value={String(data.managers.length)} accent="text-indigo-500" />
      </div>

      {/* Funnel */}
      <div className="glass-card rounded-xl p-5">
        <h4 className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2">
          <Icon name="Filter" size={16} className="text-primary" />Воронка продаж
        </h4>
        <div className="space-y-2">
          {data.funnel.map((f) => (
            <div key={f.id} className="flex items-center gap-3">
              <span className="text-xs text-gray-600 w-28 shrink-0">{f.label}</span>
              <div className="flex-1 h-7 bg-gray-100 rounded-lg overflow-hidden relative">
                <div
                  className="h-full rounded-lg transition-all flex items-center px-2"
                  style={{ width: `${Math.max((f.count / maxFunnel) * 100, f.count ? 8 : 0)}%`, backgroundColor: f.color }}
                >
                  {f.count > 0 && <span className="text-[11px] font-bold text-white">{f.count}</span>}
                </div>
              </div>
              <span className="text-xs text-gray-500 w-24 text-right shrink-0">{fmtMoney(f.amount)}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Managers KPI */}
        <div className="glass-card rounded-xl p-5">
          <h4 className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2">
            <Icon name="Award" size={16} className="text-primary" />KPI менеджеров
          </h4>
          {data.managers.length === 0 ? (
            <p className="text-xs text-gray-400">Нет данных</p>
          ) : (
            <div className="space-y-3">
              {data.managers.map((m) => (
                <div key={m.name}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-gray-700 font-medium">{m.name}</span>
                    <span className="text-gray-500">{m.won}/{m.deals} сделок · {fmtMoney(m.revenue)}</span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full hero-gradient rounded-full" style={{ width: `${(m.revenue / maxMgr) * 100}%` }} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* By crop forecast */}
        <div className="glass-card rounded-xl p-5">
          <h4 className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2">
            <Icon name="Sprout" size={16} className="text-primary" />Прогноз закупок по культурам
          </h4>
          {data.by_crop.length === 0 ? (
            <p className="text-xs text-gray-400">Нет данных</p>
          ) : (
            <div className="space-y-2.5">
              {data.by_crop.map((c) => (
                <div key={c.crop} className="flex items-center justify-between text-xs">
                  <span className="text-gray-700 truncate max-w-[55%]" title={c.crop}>{c.crop}</span>
                  <span className="text-gray-500">
                    {c.volume_t > 0 && <span className="mr-2">{c.volume_t.toLocaleString("ru-RU")} т</span>}
                    <span className="font-semibold text-primary">{fmtMoney(c.amount)}</span>
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AnalyticsTab;
