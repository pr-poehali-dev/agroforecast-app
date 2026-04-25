import Icon from "@/components/ui/icon";
import { PROFITABILITY_DATA } from "./data";

export default function BusinessAnalytics() {
  return (
    <div className="space-y-6 animate-fade-in">
      {/* Hero */}
      <div className="hero-gradient rounded-2xl p-5 sm:p-6 relative overflow-hidden shadow-md">
        <div className="hero-gradient-overlay absolute inset-0" />
        <div className="bg-dots absolute inset-0 opacity-15" />
        <div className="relative">
          <div className="flex items-center gap-2 mb-1.5">
            <Icon name="BarChart3" size={13} className="text-white/75" />
            <span className="text-white/60 text-xs font-mono uppercase tracking-widest">Аналитика</span>
          </div>
          <h1 className="font-heading font-black text-2xl sm:text-3xl text-white">Аналитика и <span className="gold-text">рекомендации</span></h1>
          <p className="text-white/60 text-sm mt-1 font-body">Рентабельность культур · севооборот · оптимальные сроки продаж</p>
        </div>
      </div>

      {/* Метрики платформы */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Точность прогнозов цен", value: "87.4%", sub: "+2.1%", up: true, icon: "TrendingUp" },
          { label: "Точность урожая", value: "82.1%", sub: "+0.8%", up: true, icon: "Sprout" },
          { label: "Данных обработано", value: "1.2M", sub: "записей/сут", up: true, icon: "Database" },
          { label: "Время обновления", value: "15 мин", sub: "задержка", up: false, icon: "Clock" },
        ].map((m, i) => (
          <div key={i} className="kpi-card rounded-xl p-4">
            <div className={`w-9 h-9 rounded-xl mb-3 flex items-center justify-center ${m.up ? "bg-primary/15 text-primary" : "bg-secondary text-muted-foreground"}`}>
              <Icon name={m.icon as string} size={16} />
            </div>
            <div className="font-mono font-black text-2xl text-foreground">{m.value}</div>
            <div className="text-[11px] text-muted-foreground mt-1 font-body">{m.label}</div>
            <div className={`text-[11px] font-mono font-bold mt-0.5 ${m.up ? "text-primary" : "text-muted-foreground"}`}>{m.sub}</div>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        {/* Рентабельность */}
        <div className="glass-card rounded-2xl p-5">
          <div className="flex items-center gap-2.5 mb-5">
            <div className="w-8 h-8 rounded-lg bg-primary/15 flex items-center justify-center">
              <Icon name="BarChart3" size={15} className="text-primary" />
            </div>
            <div>
              <div className="font-heading font-bold text-sm text-foreground">Рентабельность по культурам</div>
              <div className="text-[11px] text-muted-foreground">маржа и ROI · апрель 2026</div>
            </div>
          </div>
          <div className="space-y-4">
            {PROFITABILITY_DATA.map((f, i) => (
              <div key={i}>
                <div className="flex justify-between text-xs mb-1.5">
                  <span className="font-semibold font-heading text-foreground">{f.crop.split(" ")[0]}</span>
                  <span className="font-mono text-muted-foreground">
                    маржа <span className={f.margin > 35 ? "text-primary font-bold" : "text-accent font-bold"}>{f.margin}%</span>
                    {" · "}ROI <span className="text-foreground font-bold">{f.roi}%</span>
                  </span>
                </div>
                <div className="h-3 bg-border rounded-full overflow-hidden">
                  <div className="h-full rounded-full transition-all duration-700" style={{
                    width: `${f.margin * 2}%`,
                    background: f.margin > 35
                      ? "linear-gradient(90deg, #2E7D32, #4CAF50)"
                      : "linear-gradient(90deg, #FFC107, #FFD54F)"
                  }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* AI-рекомендации */}
        <div className="glass-card rounded-2xl p-5">
          <div className="flex items-center gap-2.5 mb-5">
            <div className="w-8 h-8 rounded-lg bg-accent/15 flex items-center justify-center">
              <Icon name="Lightbulb" size={15} className="text-accent" />
            </div>
            <div>
              <div className="font-heading font-bold text-sm text-foreground">AI-рекомендации</div>
              <div className="text-[11px] text-muted-foreground font-mono">NLP + LSTM · live</div>
            </div>
          </div>
          <div className="space-y-3">
            {[
              { icon: "TrendingUp", color: "primary", title: "Увеличить долю пшеницы", desc: "Прогноз +11.3% к июлю. Оптимальное окно для наращивания позиций." },
              { icon: "AlertTriangle", color: "amber", title: "Хеджировать риски подсолнечника", desc: "Цена снизится на 8.4%. Рекомендуется форвардный контракт." },
              { icon: "Droplets", color: "cyan", title: "Дополнительный полив — Волгоград", desc: "Риск снижения урожайности 25%. Критический уровень влажности." },
              { icon: "Calendar", color: "primary", title: "Оптимальные сроки продаж", desc: "Пшеницу в августе-сентябре: прогноз +8% к летнему минимуму." },
            ].map((r, i) => (
              <div key={i} className={`flex gap-3 p-3.5 rounded-xl border transition-all
                ${r.color === "primary" ? "bg-primary/5 border-primary/15 hover:bg-primary/8" :
                  r.color === "amber" ? "bg-amber-50 border-amber-200/60 hover:bg-amber-50" :
                  "bg-cyan-50/50 border-cyan-200/40"}`}>
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 shadow-sm
                  ${r.color === "primary" ? "bg-primary text-white" : r.color === "amber" ? "bg-accent text-accent-foreground" : "bg-cyan-500 text-white"}`}>
                  <Icon name={r.icon as string} size={14} />
                </div>
                <div>
                  <div className="text-sm font-semibold font-heading text-foreground">{r.title}</div>
                  <div className="text-xs text-muted-foreground mt-0.5 font-body">{r.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
