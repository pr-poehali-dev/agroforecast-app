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
              {
                name: "zerno.ru", tag: "Новости", status: "connected", icon: "Newspaper",
                url: "https://zerno.ru",
                desc: "Ежедневная лента новостей агрорынка — цены, пошлины, экспорт. Данные обновляются в реальном времени через RSS.",
                metric: "RSS · обновление в реальном времени",
              },
              {
                name: "НТБ (Нац. товарная биржа)", tag: "Биржа", status: "connected", icon: "BarChart2",
                url: "https://ntbex.ru",
                desc: "Официальные котировки зерновых на бирже НТБ — пшеница, ячмень, кукуруза, рожь, подсолнечник.",
                metric: "Базовые цены · апрель 2026",
              },
              {
                name: "Росгидромет", tag: "Метео", status: "connected", icon: "Cloud",
                url: "https://meteoinfo.ru",
                desc: "Агрометеорологические прогнозы и бюллетени по регионам России. Основной источник данных о погоде и ГТК.",
                metric: "Прогноз 7 дней · 23 региона",
              },
              {
                name: "Sentinel-2 (ESA)", tag: "Спутник", status: "connected", icon: "Satellite",
                url: "https://sentinel.esa.int",
                desc: "Спутниковые снимки Sentinel-2 с разрешением 10 м/пиксель. Расчёт индекса NDVI для мониторинга посевов.",
                metric: "NDVI · обновление каждые 5 дней",
              },
              {
                name: "Минсельхоз РФ", tag: "Статистика", status: "connected", icon: "Building2",
                url: "https://mcx.gov.ru",
                desc: "Официальные данные о посевных площадях, урожайности, субсидиях и экспортных пошлинах.",
                metric: "Открытые данные · ежегодно",
              },
              {
                name: "АгроСервер", tag: "Рынок", status: "connected", icon: "Store",
                url: "https://agroserver.ru",
                desc: "Оптовые цены с маркетплейса сельхозпродукции — спрос и предложение по регионам России.",
                metric: "Цены · ежедневно",
              },
              {
                name: "agroinvestor.ru", tag: "Аналитика", status: "connected", icon: "TrendingUp",
                url: "https://agroinvestor.ru",
                desc: "Аналитические материалы и новости для инвесторов в АПК — рынки, тренды, прогнозы.",
                metric: "RSS · обновление в реальном времени",
              },
              {
                name: "oilworld.ru", tag: "Масличные", status: "connected", icon: "Droplets",
                url: "https://oilworld.ru",
                desc: "Цены на масличные культуры: подсолнечник, рапс, соя. Пошлины на масло и шрот.",
                metric: "RSS · обновление в реальном времени",
              },
              {
                name: "Telegram-бот", tag: "Уведомления", status: "disconnected", icon: "MessageCircle",
                url: "https://t.me/agroport_bot",
                desc: "Push-уведомления о критических изменениях цен, рисках засухи и важных новостях рынка.",
                metric: "Настройте в боте @agroport_bot",
              },
            ].map((s, i) => (
              <div key={i} className="glass-card rounded-xl p-5 flex flex-col">
                <div className="flex items-start justify-between mb-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center
                    ${s.status === "connected" ? "bg-primary/15 text-primary" : "bg-secondary text-muted-foreground"}`}>
                    <Icon name={s.icon as string} size={18} />
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <span className={`px-2 py-0.5 text-[10px] font-mono rounded-full uppercase font-bold
                      ${s.status === "connected" ? "bg-primary/15 text-primary" : "bg-secondary text-muted-foreground"}`}>
                      {s.status === "connected" ? "✓ активно" : "— не подключено"}
                    </span>
                    <span className="text-[9px] text-muted-foreground uppercase font-mono">{s.tag}</span>
                  </div>
                </div>
                <div className="font-semibold text-sm text-foreground">{s.name}</div>
                <div className="text-xs text-muted-foreground mt-1 mb-2 flex-1">{s.desc}</div>
                <div className="text-[10px] font-mono text-primary/80 mb-3 flex items-center gap-1">
                  <Icon name="Zap" size={9} className="text-primary/60" />{s.metric}
                </div>
                <a href={s.url} target="_blank" rel="noopener noreferrer"
                  className={`w-full py-1.5 text-xs rounded-lg font-medium border transition-all text-center
                    ${s.status === "connected"
                      ? "border-primary/25 text-primary bg-primary/8 hover:bg-primary/15"
                      : "border-border text-muted-foreground hover:border-primary/30 hover:text-primary"}`}>
                  {s.status === "connected" ? "Открыть источник →" : "Подключить"}
                </a>
              </div>
            ))}
          </div>

          {/* Статус системы */}
          <div className="glass-card rounded-xl p-5">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-7 h-7 rounded-lg bg-primary/15 flex items-center justify-center">
                <Icon name="Activity" size={13} className="text-primary" />
              </div>
              <span className="font-heading font-bold text-sm text-foreground">Статус системы · апрель 2026</span>
              <span className="ml-auto flex items-center gap-1.5 text-xs text-primary font-mono">
                <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse-glow" />Все системы работают
              </span>
            </div>
            <div className="grid sm:grid-cols-3 gap-3">
              {[
                { label: "AI-прогнозирование", val: "87.4% точность", ok: true },
                { label: "RSS-лента новостей", val: "Обновление в реальном времени", ok: true },
                { label: "NDVI-мониторинг", val: "23 региона охвачено", ok: true },
                { label: "Метеопрогноз", val: "7 дней по каждому региону", ok: true },
                { label: "Цены НТБ", val: "Базовые данные апрель 2026", ok: true },
                { label: "Telegram-бот", val: "Требует настройки", ok: false },
              ].map((r, i) => (
                <div key={i} className={`flex items-center gap-2.5 p-3 rounded-lg border
                  ${r.ok ? "bg-primary/5 border-primary/15" : "bg-secondary/30 border-border"}`}>
                  <Icon name={r.ok ? "CheckCircle2" : "Circle"} size={14}
                    className={r.ok ? "text-primary shrink-0" : "text-muted-foreground shrink-0"} />
                  <div>
                    <div className="text-xs font-semibold text-foreground">{r.label}</div>
                    <div className="text-[10px] text-muted-foreground">{r.val}</div>
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