import Icon from "@/components/ui/icon";
import { ALERTS, PROFITABILITY_DATA, PRICING_PLANS } from "./data";
import { Calculator } from "./PageWidgets";

interface SectionBusinessProps {
  activeSection: string;
}

export default function SectionBusiness({ activeSection }: SectionBusinessProps) {
  return (
    <>
      {/* ── ANALYTICS ── */}
      {activeSection === "analytics" && (
        <div className="space-y-6 animate-fade-in">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Аналитика и рекомендации</h1>
            <p className="text-muted-foreground mt-1 text-sm">Рентабельность культур · севооборот · оптимальные сроки продаж</p>
          </div>
          <div className="grid lg:grid-cols-2 gap-4">
            <div className="glass-card rounded-xl p-5">
              <div className="flex items-center gap-2 mb-4">
                <Icon name="BarChart3" size={16} className="text-primary" />
                <span className="font-semibold text-sm">Рентабельность по культурам</span>
              </div>
              <div className="space-y-3">
                {PROFITABILITY_DATA.map((f, i) => (
                  <div key={i} className="space-y-1">
                    <div className="flex justify-between text-xs"><span className="font-medium">{f.crop.split(" ")[0]}</span><span className="font-mono text-muted-foreground">маржа <span className={f.margin > 35 ? "text-primary font-bold" : ""}>{f.margin}%</span> · ROI {f.roi}%</span></div>
                    <div className="h-2.5 bg-border rounded-full overflow-hidden">
                      <div className="h-full rounded-full transition-all duration-700" style={{ width: `${f.margin * 2}%`, background: f.margin > 35 ? "linear-gradient(90deg, hsl(152,55%,36%), hsl(152,55%,50%))" : "linear-gradient(90deg, hsl(38,88%,46%), hsl(38,88%,60%))" }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="glass-card rounded-xl p-5">
              <div className="flex items-center gap-2 mb-4">
                <Icon name="Lightbulb" size={16} className="text-accent" />
                <span className="font-semibold text-sm">AI-рекомендации</span>
                <span className="ml-auto px-2 py-0.5 text-[10px] font-mono bg-accent/15 text-accent rounded">NLP + LSTM</span>
              </div>
              <div className="space-y-3">
                {[
                  { icon: "TrendingUp", color: "primary", title: "Увеличить долю пшеницы", desc: "Прогноз +11.3% к июлю. Оптимальное окно для наращивания позиций." },
                  { icon: "AlertTriangle", color: "amber", title: "Хеджировать риски подсолнечника", desc: "Цена снизится на 8.4%. Рекомендуется форвардный контракт." },
                  { icon: "Droplets", color: "cyan", title: "Дополнительный полив — Волгоград", desc: "ИЗМ влажности критический. Риск снижения урожайности 25%." },
                  { icon: "Calendar", color: "primary", title: "Оптимальные сроки продаж", desc: "Реализовывать пшеницу в августе-сентябре: прогноз +8% к летнему минимуму." },
                ].map((r, i) => (
                  <div key={i} className="flex gap-3 p-3 rounded-lg bg-secondary/30">
                    <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${r.color === "primary" ? "bg-primary/20 text-primary" : r.color === "amber" ? "bg-accent/20 text-accent" : "bg-cyan-500/20 text-cyan-400"}`}><Icon name={r.icon as string} size={13} /></div>
                    <div><div className="text-sm font-medium text-foreground">{r.title}</div><div className="text-xs text-muted-foreground mt-0.5">{r.desc}</div></div>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div className="glass-card rounded-xl p-5">
            <div className="flex items-center gap-2 mb-4">
              <Icon name="Activity" size={16} className="text-primary" />
              <span className="font-semibold text-sm">Метрики платформы</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {[
                { label: "Точность прогнозов цен", value: "87.4%", sub: "+2.1%", up: true },
                { label: "Точность прогн. урожая", value: "82.1%", sub: "+0.8%", up: true },
                { label: "Данных обработано", value: "1.2M", sub: "записей/сут", up: true },
                { label: "Время обновления", value: "15 мин", sub: "задержка", up: false },
              ].map((m, i) => (
                <div key={i} className="text-center p-3 rounded-lg bg-secondary/40">
                  <div className="text-xl font-bold font-mono text-foreground">{m.value}</div>
                  <div className="text-xs text-muted-foreground mt-1">{m.label}</div>
                  <div className={`text-xs font-mono mt-1 ${m.up ? "text-primary" : "text-muted-foreground"}`}>{m.sub}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── BUSINESS ── */}
      {activeSection === "business" && (
        <div className="space-y-6 animate-fade-in">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Бизнес-инструменты</h1>
            <p className="text-muted-foreground mt-1 text-sm">Калькулятор себестоимости · маржинальность · коммерческие предложения · экспорт</p>
          </div>
          <div className="grid lg:grid-cols-2 gap-4">
            <div className="glass-card rounded-xl p-6">
              <div className="flex items-center gap-2 mb-5">
                <Icon name="Calculator" size={16} className="text-primary" />
                <h2 className="font-semibold">Калькулятор маржинальности</h2>
              </div>
              <Calculator />
            </div>
            <div className="space-y-4">
              <div className="glass-card rounded-xl p-5">
                <div className="flex items-center gap-2 mb-4">
                  <Icon name="GitCompare" size={16} className="text-primary" />
                  <h2 className="font-semibold text-sm">Сравнение культур по ROI</h2>
                </div>
                <div className="space-y-2.5">
                  {[...PROFITABILITY_DATA].sort((a, b) => b.roi - a.roi).map((c, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${i === 0 ? "bg-accent text-accent-foreground" : "bg-secondary text-muted-foreground"}`}>{i + 1}</span>
                      <span className="text-sm flex-1">{c.crop.split(" ")[0]}</span>
                      <div className="w-20 h-2 bg-border rounded-full overflow-hidden">
                        <div className="h-full rounded-full bg-primary/70" style={{ width: `${c.roi}%` }} />
                      </div>
                      <span className="font-mono text-xs font-bold w-12 text-right">{c.roi}%</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="glass-card rounded-xl p-5">
                <div className="flex items-center gap-2 mb-4">
                  <Icon name="Download" size={16} className="text-primary" />
                  <h2 className="font-semibold text-sm">Экспорт и отчёты</h2>
                </div>
                <div className="space-y-2">
                  {[
                    { label: "Аналитический отчёт (PDF)", icon: "FileText", tag: "PDF" },
                    { label: "Данные прогнозов (Excel)", icon: "Table", tag: "XLSX" },
                    { label: "Коммерческое предложение", icon: "FilePlus", tag: "DOCX" },
                    { label: "Выгрузка для 1С", icon: "Database", tag: "XML" },
                  ].map((r, i) => (
                    <button key={i} className="w-full flex items-center gap-3 p-3 rounded-lg bg-secondary/40 hover:bg-secondary/70 transition-colors text-sm text-left">
                      <Icon name={r.icon as string} size={15} className="text-muted-foreground" />
                      <span className="flex-1">{r.label}</span>
                      <span className="px-1.5 py-0.5 text-[10px] font-mono bg-border rounded text-muted-foreground">{r.tag}</span>
                      <Icon name="ChevronRight" size={14} className="text-muted-foreground" />
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
          <div className="glass-card rounded-xl p-5">
            <div className="flex items-center gap-2 mb-4">
              <Icon name="Link" size={16} className="text-primary" />
              <h2 className="font-semibold text-sm">Интеграция с учётными системами</h2>
            </div>
            <div className="grid sm:grid-cols-3 gap-3">
              {[
                { name: "1С:Агропредприятие", desc: "Двусторонняя синхронизация данных о производстве", status: "pending" },
                { name: "SAP Agro", desc: "Импорт позиций и экспорт аналитики в ERP", status: "disconnected" },
                { name: "CRM (amoCRM)", desc: "Автоматическое создание сделок по сигналам рынка", status: "disconnected" },
              ].map((s, i) => (
                <div key={i} className="p-4 rounded-xl bg-secondary/40 border border-border">
                  <div className="font-semibold text-sm mb-1">{s.name}</div>
                  <div className="text-xs text-muted-foreground mb-3">{s.desc}</div>
                  <button className={`w-full py-1.5 text-xs rounded-lg font-medium border transition-all ${s.status === "pending" ? "border-accent/30 text-accent bg-accent/10 hover:bg-accent/20" : "border-primary/30 text-primary bg-primary/10 hover:bg-primary/20"}`}>
                    {s.status === "pending" ? "Завершить настройку" : "Подключить"}
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── ALERTS ── */}
      {activeSection === "alerts" && (
        <div className="space-y-6 animate-fade-in">
          <div className="flex items-start justify-between flex-wrap gap-3">
            <div>
              <h1 className="text-2xl font-bold text-foreground">Центр уведомлений</h1>
              <p className="text-muted-foreground mt-1 text-sm">Критические события · погодные аномалии · изменения цен · госрегулирование</p>
            </div>
            <button className="text-xs px-3 py-1.5 bg-secondary text-muted-foreground rounded-lg border border-border hover:border-primary/30 transition-colors">Настроить уведомления</button>
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
          <div>
            <h1 className="text-2xl font-bold text-foreground">Внешние интеграции и источники данных</h1>
            <p className="text-muted-foreground mt-1 text-sm">Биржи · спутники · метео · статистика · маркетплейсы</p>
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

      {/* ── PRICING ── */}
      {activeSection === "pricing" && (
        <div className="space-y-6 animate-fade-in">
          <div className="text-center max-w-xl mx-auto">
            <h1 className="text-2xl font-bold text-foreground">Тарифы AgroForecast Pro</h1>
            <p className="text-muted-foreground mt-2 text-sm">Выберите план в зависимости от ваших задач. Все тарифы включают 14-дневный бесплатный период.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-4 max-w-4xl mx-auto">
            {PRICING_PLANS.map((plan, i) => (
              <div key={i} className={`glass-card rounded-2xl p-6 flex flex-col relative
                ${plan.popular ? "border-2 border-primary shadow-lg" : "border border-border"}`}>
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 bg-primary text-primary-foreground text-xs font-bold rounded-full">Популярный</div>
                )}
                <div className="mb-4">
                  <div className="text-sm font-semibold text-muted-foreground mb-1">{plan.name}</div>
                  <div className="flex items-baseline gap-1">
                    <span className="text-3xl font-bold font-mono text-foreground">{plan.price === 0 ? "0" : plan.price.toLocaleString()} ₽</span>
                    <span className="text-xs text-muted-foreground">/{plan.period}</span>
                  </div>
                </div>
                <div className="flex-1 space-y-2 mb-6">
                  {plan.features.map((f, j) => (
                    <div key={j} className="flex items-start gap-2 text-sm">
                      <Icon name="Check" size={14} className="text-primary mt-0.5 shrink-0" />
                      <span className="text-foreground">{f}</span>
                    </div>
                  ))}
                  {plan.disabled?.map((f, j) => (
                    <div key={j} className="flex items-start gap-2 text-sm opacity-40">
                      <Icon name="X" size={14} className="text-muted-foreground mt-0.5 shrink-0" />
                      <span className="text-muted-foreground">{f}</span>
                    </div>
                  ))}
                </div>
                <button className={`w-full py-2.5 rounded-xl text-sm font-semibold transition-all
                  ${plan.popular
                    ? "bg-primary text-primary-foreground hover:bg-primary/90"
                    : plan.price === 0
                    ? "bg-secondary text-foreground hover:bg-secondary/80 border border-border"
                    : "bg-accent text-accent-foreground hover:bg-accent/90"
                  }`}>
                  {plan.price === 0 ? "Начать бесплатно" : "Выбрать план"}
                </button>
              </div>
            ))}
          </div>
          <div className="glass-card rounded-xl p-6 max-w-4xl mx-auto">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-primary/15 text-primary flex items-center justify-center shrink-0"><Icon name="Building2" size={22} /></div>
              <div className="flex-1">
                <div className="font-bold text-base">B2G: для региональных минсельхозов</div>
                <div className="text-sm text-muted-foreground mt-0.5">Агрегированные данные и отчёты для мониторинга продовольственной безопасности. Кастомные дашборды под требования ведомства.</div>
              </div>
              <button className="px-4 py-2 bg-primary text-primary-foreground rounded-xl text-sm font-medium hover:bg-primary/90 transition-colors shrink-0">Запросить КП</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
