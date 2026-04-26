import { useState } from "react";
import Icon from "@/components/ui/icon";
import { LOYALTY_ACTIONS, LOYALTY_REWARDS } from "./data";

const HISTORY = [
  { date: "26 апр", action: "Публикация данных по полю", points: +10, balance: 210 },
  { date: "24 апр", action: "Сделка на маркетплейсе 150 000 ₽", points: +150, balance: 200 },
  { date: "22 апр", action: "Участие в опросе", points: +5, balance: 50 },
  { date: "20 апр", action: "Обмен — 50 доп. уведомлений", points: -200, balance: 45 },
  { date: "18 апр", action: "Приглашение коллеги", points: +50, balance: 245 },
  { date: "15 апр", action: "Отзыв о платформе", points: +15, balance: 195 },
];

export default function SectionLoyalty() {
  const [balance] = useState(210);
  const [redeemId, setRedeemId] = useState<number | null>(null);
  const [redeemed, setRedeemed] = useState<number[]>([]);

  const handleRedeem = (i: number, points: number) => {
    if (balance < points) return;
    setRedeemId(i);
    setTimeout(() => {
      setRedeemed(r => [...r, i]);
      setRedeemId(null);
    }, 1200);
  };

  return (
    <div className="space-y-5 animate-fade-in">

      {/* Hero */}
      <div className="hero-gradient rounded-2xl p-5 sm:p-7 relative overflow-hidden shadow-md">
        <div className="hero-gradient-overlay absolute inset-0" />
        <div className="bg-dots absolute inset-0 opacity-15" />
        <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <Icon name="Crown" size={13} className="text-white/70" />
              <span className="text-white/55 text-xs font-mono uppercase tracking-widest">АгроПорт · Программа лояльности</span>
            </div>
            <h1 className="font-heading font-black text-2xl sm:text-3xl text-white leading-tight">
              АгроБаллы — <span className="gold-text">ваши привилегии</span>
            </h1>
            <p className="text-white/60 text-sm mt-1 font-body">
              Зарабатывайте баллы за активность и обменивайте на подписки, отчёты и консультации
            </p>
          </div>
          {/* Balance widget */}
          <div className="shrink-0 flex flex-col items-center px-6 py-4 rounded-2xl bg-white/10 border border-white/20 min-w-[140px]">
            <span className="text-white/60 text-[10px] uppercase tracking-widest font-mono mb-1">Ваш баланс</span>
            <div className="flex items-baseline gap-1">
              <span className="text-white font-heading font-black text-4xl">{balance}</span>
            </div>
            <span className="text-white/50 text-xs mt-0.5">АгроБаллов</span>
            <div className="mt-2 w-full bg-white/20 rounded-full h-1.5">
              <div className="bg-accent h-1.5 rounded-full" style={{ width: `${Math.min(balance / 10, 100)}%` }} />
            </div>
            <span className="text-white/40 text-[10px] mt-1">{1000 - balance} до 1 месяца PRO</span>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-5">

        {/* Как заработать */}
        <div className="glass-card rounded-2xl p-5 space-y-3">
          <h2 className="font-heading font-bold text-sm text-foreground flex items-center gap-2">
            <Icon name="Plus" size={14} className="text-emerald-500" />
            Как зарабатывать баллы
          </h2>
          <div className="space-y-2">
            {LOYALTY_ACTIONS.map((a, i) => (
              <div key={i} className="flex items-center gap-3 p-3 bg-secondary/50 rounded-xl border border-border hover:border-primary/20 transition-colors">
                <div className="w-8 h-8 rounded-lg bg-emerald-50 border border-emerald-100 flex items-center justify-center shrink-0">
                  <Icon name={a.icon as "MapPin"} size={14} className="text-emerald-600" />
                </div>
                <span className="flex-1 text-sm text-foreground">{a.action}</span>
                <span className="font-mono font-bold text-sm text-emerald-600 shrink-0">+{a.points}</span>
              </div>
            ))}
          </div>
        </div>

        {/* На что обменять */}
        <div className="glass-card rounded-2xl p-5 space-y-3">
          <h2 className="font-heading font-bold text-sm text-foreground flex items-center gap-2">
            <Icon name="Gift" size={14} className="text-amber-500" />
            Обмен баллов
          </h2>
          <div className="space-y-2">
            {LOYALTY_REWARDS.map((r, i) => {
              const canAfford = balance >= r.points;
              const done = redeemed.includes(i);
              const loading = redeemId === i;
              return (
                <div key={i} className={`flex items-center gap-3 p-3 rounded-xl border transition-colors ${
                  done ? "bg-emerald-50 border-emerald-200" : canAfford ? "bg-secondary/50 border-border hover:border-amber-300" : "bg-secondary/30 border-border opacity-60"
                }`}>
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 border ${r.color}`}>
                    <Icon name={r.icon as "Crown"} size={14} />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-foreground">{r.title}</p>
                    <p className="text-xs text-muted-foreground font-mono">{r.points.toLocaleString()} баллов</p>
                  </div>
                  <button
                    onClick={() => handleRedeem(i, r.points)}
                    disabled={!canAfford || done || loading}
                    className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all flex items-center gap-1 shrink-0 ${
                      done
                        ? "bg-emerald-100 text-emerald-700"
                        : canAfford
                        ? "bg-amber-500 text-white hover:bg-amber-600"
                        : "bg-secondary text-muted-foreground cursor-not-allowed"
                    }`}
                  >
                    {loading ? <Icon name="Loader2" size={11} className="animate-spin" /> : done ? <Icon name="Check" size={11} /> : null}
                    {done ? "Получено" : loading ? "..." : "Обменять"}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* История */}
      <div className="glass-card rounded-2xl p-5 space-y-3">
        <h2 className="font-heading font-bold text-sm text-foreground flex items-center gap-2">
          <Icon name="History" size={14} className="text-primary" />
          История начислений
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left text-xs text-muted-foreground font-medium pb-2">Дата</th>
                <th className="text-left text-xs text-muted-foreground font-medium pb-2">Действие</th>
                <th className="text-right text-xs text-muted-foreground font-medium pb-2">Баллы</th>
                <th className="text-right text-xs text-muted-foreground font-medium pb-2">Баланс</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              {HISTORY.map((h, i) => (
                <tr key={i} className="hover:bg-secondary/30 transition-colors">
                  <td className="py-2.5 text-xs text-muted-foreground font-mono pr-4 whitespace-nowrap">{h.date}</td>
                  <td className="py-2.5 text-foreground pr-4">{h.action}</td>
                  <td className={`py-2.5 text-right font-mono font-bold whitespace-nowrap ${h.points > 0 ? "text-emerald-600" : "text-destructive"}`}>
                    {h.points > 0 ? `+${h.points}` : h.points}
                  </td>
                  <td className="py-2.5 text-right font-mono text-muted-foreground whitespace-nowrap">{h.balance}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Уровни */}
      <div className="glass-card rounded-2xl p-5 space-y-3">
        <h2 className="font-heading font-bold text-sm text-foreground flex items-center gap-2">
          <Icon name="TrendingUp" size={14} className="text-primary" />
          Уровни участника
        </h2>
        <div className="grid sm:grid-cols-4 gap-3">
          {[
            { level: "Новичок", range: "0–499", icon: "Sprout", color: "bg-secondary border-border text-muted-foreground", active: false },
            { level: "Фермер", range: "500–1 999", icon: "Wheat", color: "bg-emerald-50 border-emerald-200 text-emerald-700", active: true },
            { level: "Агроэксперт", range: "2 000–9 999", icon: "Star", color: "bg-blue-50 border-blue-200 text-blue-700", active: false },
            { level: "АгроПро", range: "10 000+", icon: "Crown", color: "bg-amber-50 border-amber-200 text-amber-700", active: false },
          ].map((lvl, i) => (
            <div key={i} className={`rounded-xl p-4 border flex flex-col items-center gap-2 text-center ${lvl.color} ${lvl.active ? "ring-2 ring-primary/30" : ""}`}>
              <Icon name={lvl.icon as "Sprout"} size={22} />
              <p className="font-heading font-bold text-sm">{lvl.level}</p>
              <p className="text-[11px] font-mono opacity-70">{lvl.range} баллов</p>
              {lvl.active && <span className="text-[10px] font-bold bg-primary text-white px-2 py-0.5 rounded-full">Ваш уровень</span>}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
