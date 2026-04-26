import Icon from "@/components/ui/icon";

const INTEGRATIONS = [
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
];

export default function AlertsIntegrationsSection() {
  return (
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
        {INTEGRATIONS.map((s, i) => (
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
              {s.status === "connected" ? "Открыть источник →" : "Подключить →"}
            </a>
          </div>
        ))}
      </div>
    </div>
  );
}
