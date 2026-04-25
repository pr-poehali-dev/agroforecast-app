import Icon from "@/components/ui/icon";
import { ALERTS } from "./data";

interface BusinessAlertsIntegrationsProps {
  activeSection: string;
}

export default function BusinessAlertsIntegrations({ activeSection }: BusinessAlertsIntegrationsProps) {
  return (
    <>
      {/* ── ALERTS ── */}
      {activeSection === "alerts" && (
        <div className="space-y-6 animate-fade-in">
          <div className="hero-gradient rounded-2xl p-5 relative overflow-hidden shadow-md">
            <div className="hero-gradient-overlay absolute inset-0" />
            <div className="relative flex items-center justify-between gap-4">
              <div>
                <h1 className="font-heading font-black text-2xl text-white">Центр <span className="gold-text">уведомлений</span></h1>
                <p className="text-white/60 text-sm mt-1 font-body">Критические события · погода · цены · госрегулирование</p>
              </div>
              <button className="px-4 py-2 bg-white/15 border border-white/30 text-white text-xs rounded-xl hover:bg-white/25 transition-colors font-semibold shrink-0">
                Настроить
              </button>
            </div>
          </div>
          <div className="flex gap-2 flex-wrap">
            {["Все", "Критические", "Предупреждения", "Инфо"].map(f => (
              <button key={f} className={`px-3 py-1.5 text-xs rounded-lg border transition-all ${f === "Все" ? "bg-primary/15 text-primary border-primary/30" : "bg-secondary text-muted-foreground border-border hover:border-primary/30"}`}>{f}</button>
            ))}
          </div>
          <div className="space-y-3">
            {ALERTS.map(a => (
              <div key={a.id} className={`glass-card rounded-xl p-4 border flex items-start gap-4 hover:scale-[1.005] transition-all
                ${a.type === "critical" ? "border-destructive/30" : a.type === "warning" ? "border-accent/25" : "border-border"}`}>
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${a.type === "critical" ? "bg-destructive/20 text-destructive" : a.type === "warning" ? "bg-accent/20 text-accent" : "bg-primary/20 text-primary"}`}>
                  <Icon name={a.icon as string} size={18} />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-sm">{a.title}</span>
                    <span className={`px-2 py-0.5 text-[10px] font-mono rounded uppercase ${a.type === "critical" ? "bg-destructive/20 text-destructive" : a.type === "warning" ? "bg-accent/20 text-accent" : "bg-primary/15 text-primary"}`}>
                      {a.type === "critical" ? "критично" : a.type === "warning" ? "внимание" : "инфо"}
                    </span>
                  </div>
                  <div className="text-sm text-muted-foreground mt-1">{a.desc}</div>
                </div>
                <span className="text-xs text-muted-foreground shrink-0 font-mono">{a.time}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── INTEGRATIONS ── */}
      {activeSection === "integrations" && (
        <div className="space-y-6 animate-fade-in">
          <div className="hero-gradient rounded-2xl p-5 relative overflow-hidden shadow-md">
            <div className="hero-gradient-overlay absolute inset-0" />
            <div className="bg-dots absolute inset-0 opacity-15" />
            <div className="relative">
              <h1 className="font-heading font-black text-2xl text-white">Интеграции и <span className="gold-text">источники данных</span></h1>
              <p className="text-white/60 text-sm mt-1 font-body">Биржи · спутники · метео · статистика · маркетплейсы</p>
            </div>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              { name: "Росгидромет API", desc: "Метеоданные в реальном времени по всем районам Поволжья", status: "connected", icon: "Cloud", tag: "Погода" },
              { name: "CBOT / Euronext", desc: "Мировые цены на пшеницу, кукурузу, соевые бобы", status: "connected", icon: "TrendingUp", tag: "Биржа" },
              { name: "НТБ (Нац. товарная биржа)", desc: "Котировки зерновых на внутреннем рынке РФ", status: "connected", icon: "BarChart2", tag: "Биржа" },
              { name: "Sentinel-2 / Landsat", desc: "Спутниковые снимки NDVI для мониторинга посевов", status: "connected", icon: "Satellite", tag: "Спутник" },
              { name: "Минсельхоз РФ", desc: "Открытые данные, статистика урожайности, субсидии", status: "connected", icon: "Building2", tag: "Статистика" },
              { name: "АгроСервер", desc: "Оптовые цены с маркетплейса сельхозпродукции", status: "connected", icon: "Store", tag: "Рынок" },
              { name: "OpenWeatherMap", desc: "Прогноз погоды на 16 дней с обновлением каждый час", status: "connected", icon: "CloudRain", tag: "Погода" },
              { name: "Своё Фермерство", desc: "Цены и объёмы с фермерского маркетплейса", status: "pending", icon: "Leaf", tag: "Рынок" },
              { name: "Telegram Bot", desc: "Push-уведомления о ценах, рисках, новостях", status: "disconnected", icon: "MessageCircle", tag: "Уведомления" },
            ].map((s, i) => (
              <div key={i} className="glass-card rounded-xl p-5">
                <div className="flex items-start justify-between mb-3">
                  <div className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center"><Icon name={s.icon as string} size={18} className="text-foreground" /></div>
                  <div className="flex flex-col items-end gap-1">
                    <span className={`px-2 py-0.5 text-[10px] font-mono rounded uppercase ${s.status === "connected" ? "bg-primary/15 text-primary" : s.status === "pending" ? "bg-accent/15 text-accent" : "bg-secondary text-muted-foreground"}`}>
                      {s.status === "connected" ? "✓ активно" : s.status === "pending" ? "⋯ настройка" : "отключено"}
                    </span>
                    <span className="text-[9px] text-muted-foreground uppercase font-mono">{s.tag}</span>
                  </div>
                </div>
                <div className="font-semibold text-sm">{s.name}</div>
                <div className="text-xs text-muted-foreground mt-1 mb-4">{s.desc}</div>
                <button className={`w-full py-1.5 text-xs rounded-lg font-medium border transition-all
                  ${s.status === "connected" ? "border-border text-muted-foreground hover:border-destructive/50 hover:text-destructive" : "border-primary/30 text-primary bg-primary/10 hover:bg-primary/20"}`}>
                  {s.status === "connected" ? "Настроить" : "Подключить"}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  );
}
