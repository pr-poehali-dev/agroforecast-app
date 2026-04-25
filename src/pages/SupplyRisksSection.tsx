import Icon from "@/components/ui/icon";
import { RISK_DATA, MARKET_SOURCES, EXPORT_DATA } from "./data";
import { SupplyChart } from "./PageWidgets";

interface SupplyRisksSectionProps {
  activeSection: string;
}

export default function SupplyRisksSection({ activeSection }: SupplyRisksSectionProps) {
  return (
    <>
      {/* ── SUPPLY/DEMAND ── */}
      {activeSection === "supply" && (
        <div className="space-y-6 animate-fade-in">
          <div>
            <h1 className="font-heading font-black text-2xl text-foreground">Мониторинг спроса и предложения</h1>
            <p className="text-muted-foreground mt-1 text-sm font-body">Оптовые рынки · биржи · экспорт/импорт · прогноз баланса</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {MARKET_SOURCES.map((s, i) => (
              <div key={i} className="kpi-card rounded-xl p-4">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-9 h-9 rounded-xl bg-primary/12 flex items-center justify-center"><Icon name={s.icon as string} size={16} className="text-primary" /></div>
                  <span className="text-sm font-semibold font-heading text-foreground">{s.name}</span>
                </div>
                <div className="text-2xl font-black font-mono text-foreground">{(s.volume / 1000).toFixed(0)} <span className="text-sm font-normal text-muted-foreground">тыс. т</span></div>
                <div className={`flex items-center gap-1 text-xs font-bold mt-1.5 ${s.trend === "up" ? "text-primary" : "text-destructive"}`}>
                  <Icon name={s.trend === "up" ? "TrendingUp" : "TrendingDown"} size={11} />
                  {s.change > 0 ? "+" : ""}{s.change}% к прошлому периоду
                </div>
              </div>
            ))}
          </div>
          <div className="glass-card rounded-xl p-6">
            <div className="flex items-center gap-2 mb-4">
              <Icon name="ArrowLeftRight" size={16} className="text-primary" />
              <h2 className="font-semibold">Баланс спроса и предложения (тыс. т)</h2>
            </div>
            <SupplyChart />
            <div className="mt-4 p-3 bg-primary/8 border border-primary/20 rounded-lg">
              <div className="flex items-start gap-2">
                <Icon name="Info" size={13} className="text-primary mt-0.5 shrink-0" />
                <p className="text-xs text-foreground">Прогноз: в июне-июле ожидается профицит предложения (+38%). Рекомендуется рассмотреть форвардные контракты или складское хранение до сентября.</p>
              </div>
            </div>
          </div>
          <div className="glass-card rounded-xl p-6">
            <div className="flex items-center gap-2 mb-4">
              <Icon name="Globe" size={16} className="text-primary" />
              <h2 className="font-semibold">Экспортно-импортные потоки (тыс. т/мес)</h2>
            </div>
            <div className="space-y-3">
              {EXPORT_DATA.map((e, i) => (
                <div key={i} className="flex items-center gap-4">
                  <div className="w-40 text-xs text-muted-foreground">{e.direction}</div>
                  <div className="flex-1 h-7 bg-border rounded-lg relative overflow-hidden">
                    <div className="h-full rounded-lg transition-all duration-700 bg-primary/50" style={{ width: `${e.share * 2.8}%` }} />
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-mono font-bold">{e.volume} тыс. т</span>
                  </div>
                  <div className={`text-xs font-medium w-12 text-right ${e.trend === "up" ? "text-primary" : e.trend === "down" ? "text-destructive" : "text-muted-foreground"}`}>{e.share}%</div>
                </div>
              ))}
            </div>
          </div>
          <div className="glass-card rounded-xl p-6">
            <div className="flex items-center gap-2 mb-4">
              <Icon name="FileText" size={16} className="text-primary" />
              <h2 className="font-semibold">Крупные контракты и госзакупки</h2>
            </div>
            <div className="space-y-2">
              {[
                { buyer: "Минобороны РФ", product: "Пшеница", volume: "120 тыс. т", price: "14 100 ₽/т", status: "Исполняется", color: "primary" },
                { buyer: "Минсельхоз (ФИ)", product: "Рожь", volume: "45 тыс. т", price: "9 200 ₽/т", status: "Тендер", color: "amber" },
                { buyer: "Группа ЭФКО", product: "Подсолнечник", volume: "200 тыс. т", price: "27 800 ₽/т", status: "Подписан", color: "primary" },
                { buyer: "Экспорт (Египет)", product: "Пшеница", volume: "80 тыс. т", price: "Контракт CBOT", status: "Переговоры", color: "muted" },
              ].map((c, i) => (
                <div key={i} className="flex items-center gap-3 p-3 rounded-lg bg-secondary/30 hover:bg-secondary/50 transition-colors text-sm">
                  <div className="flex-1 min-w-0">
                    <span className="font-medium">{c.buyer}</span>
                    <span className="text-muted-foreground mx-2">·</span>
                    <span className="text-muted-foreground">{c.product}</span>
                  </div>
                  <span className="font-mono text-xs hidden sm:block">{c.volume}</span>
                  <span className="font-mono text-xs text-muted-foreground hidden lg:block">{c.price}</span>
                  <span className={`px-2 py-0.5 text-[10px] font-mono rounded uppercase shrink-0 ${c.color === "primary" ? "bg-primary/15 text-primary" : c.color === "amber" ? "bg-accent/15 text-accent" : "bg-secondary text-muted-foreground"}`}>{c.status}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── RISKS ── */}
      {activeSection === "risks" && (
        <div className="space-y-6 animate-fade-in">
          <div>
            <h1 className="font-heading font-black text-2xl text-foreground">Оценка и мониторинг рисков</h1>
            <p className="text-muted-foreground mt-1 text-sm font-body">Засуха · заморозки · вредители · переувлажнение · рекомендации по минимизации</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {[
              { label: "Критических угроз", value: "2", color: "destructive", icon: "AlertOctagon" },
              { label: "Средних рисков", value: "2", color: "amber", icon: "AlertTriangle" },
              { label: "Под контролем", value: "4", color: "primary", icon: "CheckCircle2" },
            ].map((s, i) => (
              <div key={i} className={`kpi-card rounded-xl p-5 border-l-4 ${s.color === "destructive" ? "border-l-destructive" : s.color === "amber" ? "border-l-accent" : "border-l-primary"}`}>
                <div className={`w-10 h-10 rounded-xl mb-3 flex items-center justify-center ${s.color === "destructive" ? "bg-destructive/15 text-destructive" : s.color === "amber" ? "bg-accent/15 text-accent" : "bg-primary/15 text-primary"}`}><Icon name={s.icon as string} size={18} /></div>
                <div className="text-3xl font-black font-mono">{s.value}</div>
                <div className="text-xs text-muted-foreground mt-1 font-body">{s.label}</div>
              </div>
            ))}
          </div>
          <div className="glass-card rounded-xl p-6">
            <div className="flex items-center gap-2 mb-5">
              <Icon name="ShieldAlert" size={16} className="text-primary" />
              <h2 className="font-semibold">Детальная оценка рисков</h2>
            </div>
            <div className="space-y-3">
              {RISK_DATA.map((r, i) => (
                <div key={i} className="flex flex-col sm:flex-row sm:items-center gap-3 p-3 rounded-lg bg-secondary/30 hover:bg-secondary/50 transition-colors">
                  <div className="flex items-center gap-3 flex-1">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: `${r.color}20` }}>
                      <span className="text-sm">{r.type === "Засуха" || r.type === "Суховей" ? "🌵" : r.type === "Заморозки" ? "❄️" : r.type === "Вредители" ? "🐛" : r.type === "Переувлажнение" ? "💧" : "💨"}</span>
                    </div>
                    <div><div className="font-medium text-sm">{r.region}</div><div className="text-xs text-muted-foreground">{r.type} · {r.crop}</div></div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="w-32">
                      <div className="flex justify-between text-xs mb-1"><span className="text-muted-foreground">Риск</span><span className="font-mono font-bold" style={{ color: r.color }}>{r.risk}%</span></div>
                      <div className="h-2 bg-border rounded-full"><div className="h-full rounded-full" style={{ width: `${r.risk}%`, backgroundColor: r.color }} /></div>
                    </div>
                    <span className={`px-2 py-0.5 rounded-md text-xs font-medium ${r.level === "critical" ? "bg-destructive/20 text-destructive" : r.level === "high" ? "bg-destructive/15 text-destructive" : r.level === "medium" ? "bg-accent/20 text-accent" : "bg-primary/15 text-primary"}`}>
                      {r.level === "critical" ? "Крит." : r.level === "high" ? "Высокий" : r.level === "medium" ? "Средний" : "Низкий"}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="glass-card rounded-xl p-6">
            <div className="flex items-center gap-2 mb-4">
              <Icon name="Lightbulb" size={16} className="text-accent" />
              <h2 className="font-semibold">Рекомендации по минимизации рисков</h2>
            </div>
            <div className="grid sm:grid-cols-2 gap-3">
              {[
                { icon: "Shield", title: "Страхование урожая", desc: "Волгоград, Самара: оформить полис агрострахования до 15 мая. Субсидия 50% от Минсельхоза.", tag: "Срочно" },
                { icon: "Shuffle", title: "Диверсификация посевов", desc: "Снизить долю кукурузы в Волгоградской обл. с 40% до 25%, увеличить долю засухоустойчивых сортов.", tag: "Рекомендовано" },
                { icon: "Droplets", title: "Организация полива", desc: "Капельное орошение для Самарской и Волгоградской обл. ROI при текущих ценах — 2.4 года.", tag: "Долгосрочно" },
                { icon: "Bug", title: "Обработка от вредителей", desc: "Ульяновская обл.: профилактическая обработка посевов ячменя от злаковых мух в 1-й декаде мая.", tag: "Планово" },
              ].map((r, i) => (
                <div key={i} className="flex gap-3 p-4 rounded-xl bg-secondary/30 border border-border">
                  <div className="w-9 h-9 rounded-lg bg-primary/15 text-primary flex items-center justify-center shrink-0 mt-0.5"><Icon name={r.icon as string} size={16} /></div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className="text-sm font-semibold">{r.title}</span>
                      <span className="px-1.5 py-0.5 text-[10px] bg-primary/10 text-primary rounded font-mono">{r.tag}</span>
                    </div>
                    <p className="text-xs text-muted-foreground">{r.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
