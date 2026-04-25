import Icon from "@/components/ui/icon";

interface HomeWhyUsProps {
  setActiveSection: (section: string) => void;
}

export default function HomeWhyUs({ setActiveSection }: HomeWhyUsProps) {
  return (
    <>
      {/* ══════════════════════════════════════════════
          ЧТО ВЫ ПОЛУЧАЕТЕ — как у ExactFarming
      ══════════════════════════════════════════════ */}
      <div>
        <div className="text-center mb-6">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-accent/10 border border-accent/25 text-accent text-xs font-semibold mb-3">
            <Icon name="Sparkles" size={12} />Конкретные результаты
          </div>
          <h2 className="font-heading font-black text-2xl sm:text-3xl text-foreground">
            Что вы получаете <span className="text-primary">с первого дня</span>
          </h2>
          <p className="text-muted-foreground text-sm mt-2 max-w-lg mx-auto font-body">
            Не просто данные — конкретные решения для каждого участника агрорынка
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[
            {
              role: "Фермеру", icon: "Wheat", color: "primary",
              items: [
                "Оптимальный срок посева и уборки по вашему региону",
                "Прогноз урожайности за 3–6 месяцев с точностью 87%",
                "Карта NDVI ваших угодий — здоровье посевов из космоса",
                "Сигнал о засухе, заморозках и вредителях — заранее",
              ],
            },
            {
              role: "Трейдеру", icon: "TrendingUp", color: "accent",
              items: [
                "Прогноз цены пшеницы, подсолнечника, кукурузы на 3–12 мес",
                "Лучший момент для покупки и продажи по модели ARIMA+LSTM",
                "Мониторинг экспортных пошлин и мировых котировок CBOT",
                "Реальные новости рынка с zerno.ru и agroinvestor.ru",
              ],
            },
            {
              role: "Агроному", icon: "Sprout", color: "primary",
              items: [
                "История NDVI-снимков по Sentinel-2 за несколько сезонов",
                "Фазы вегетации и целевые значения индекса по культуре",
                "Карта рисков засухи и переувлажнения по районам",
                "Рекомендации по применению удобрений (NPK)",
              ],
            },
            {
              role: "Переработчику", icon: "Factory", color: "accent",
              items: [
                "Прогноз объёма сырья по регионам на следующий сезон",
                "Карта хозяйств с культурами рядом с вашим предприятием",
                "Калькулятор себестоимости и маржинальности переработки",
                "Интеграция с 1С и ERP через API",
              ],
            },
            {
              role: "Инвестору", icon: "BarChart3", color: "primary",
              items: [
                "ROI по каждой культуре и сравнение регионов",
                "Индекс рисков с вероятностью по каждому типу угрозы",
                "Прогноз урожая в России — данные СовЭкон + AI",
                "Экспортная аналитика: Турция, Египет, Алжир, Иран",
              ],
            },
            {
              role: "Руководителю АПК", icon: "Building2", color: "accent",
              items: [
                "Единый дашборд по всем хозяйствам и регионам",
                "Автоматические алерты о критических событиях рынка",
                "Отчёты в PDF/Excel для Минсельхоза и инвесторов",
                "B2G-интеграция для региональных министерств",
              ],
            },
          ].map((b, i) => (
            <div key={i} className={`rounded-2xl p-5 border transition-all hover:shadow-md
              ${b.color === "primary"
                ? "bg-primary/5 border-primary/15 hover:border-primary/30"
                : "bg-accent/5 border-accent/15 hover:border-accent/30"}`}>
              <div className="flex items-center gap-3 mb-4">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shadow-sm
                  ${b.color === "primary" ? "bg-primary text-white" : "bg-accent text-accent-foreground"}`}>
                  <Icon name={b.icon as string} size={18} />
                </div>
                <div className={`font-heading font-bold text-sm ${b.color === "primary" ? "text-primary" : "text-accent"}`}>
                  {b.role}
                </div>
              </div>
              <ul className="space-y-2">
                {b.items.map((item, j) => (
                  <li key={j} className="flex items-start gap-2 text-xs text-foreground font-body">
                    <Icon name="Check" size={12}
                      className={`mt-0.5 shrink-0 ${b.color === "primary" ? "text-primary" : "text-accent"}`} />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      {/* ══════════════════════════════════════════════
          СРАВНЕНИЕ С ExactFarming
      ══════════════════════════════════════════════ */}
      <div className="glass-card rounded-2xl p-6">
        <div className="text-center mb-6">
          <h2 className="font-heading font-black text-xl text-foreground">
            АгроПорт vs конкуренты
          </h2>
          <p className="text-muted-foreground text-sm mt-1 font-body">Почему профессионалы выбирают нас</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-3 pr-4 text-muted-foreground font-medium text-xs uppercase tracking-wide">Функция</th>
                <th className="py-3 px-4 text-center">
                  <span className="font-heading font-black text-primary text-sm">АгроПорт</span>
                </th>
                <th className="py-3 px-4 text-center text-muted-foreground text-xs">ExactFarming</th>
                <th className="py-3 pl-4 text-center text-muted-foreground text-xs">Другие</th>
              </tr>
            </thead>
            <tbody>
              {[
                { f: "Прогноз цен AI (ARIMA+LSTM)",     ap: true,  ef: false, ot: false },
                { f: "NDVI-мониторинг Sentinel-2",      ap: true,  ef: true,  ot: true  },
                { f: "Охват 23 региона России",         ap: true,  ef: true,  ot: false },
                { f: "Реальные RSS-новости рынка",      ap: true,  ef: false, ot: false },
                { f: "Японские свечи и графики",        ap: true,  ef: false, ot: false },
                { f: "Калькулятор маржинальности",      ap: true,  ef: true,  ot: false },
                { f: "Карта рисков засухи/заморозков",  ap: true,  ef: true,  ot: false },
                { f: "Интеграция 1С / API",             ap: true,  ef: true,  ot: false },
                { f: "Данные экспорта (Турция/Египет)", ap: true,  ef: false, ot: false },
                { f: "Бесплатный базовый доступ",       ap: true,  ef: false, ot: false },
              ].map((row, i) => (
                <tr key={i} className={`border-b border-border/40 ${i % 2 === 0 ? "" : "bg-secondary/20"}`}>
                  <td className="py-2.5 pr-4 text-foreground font-body text-xs">{row.f}</td>
                  <td className="py-2.5 px-4 text-center">
                    {row.ap
                      ? <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-primary/15 text-primary"><Icon name="Check" size={12} /></span>
                      : <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-secondary text-muted-foreground"><Icon name="Minus" size={12} /></span>}
                  </td>
                  <td className="py-2.5 px-4 text-center">
                    {row.ef
                      ? <span className="text-muted-foreground text-xs">✓</span>
                      : <span className="text-muted-foreground text-xs opacity-40">—</span>}
                  </td>
                  <td className="py-2.5 pl-4 text-center">
                    {row.ot
                      ? <span className="text-muted-foreground text-xs">✓</span>
                      : <span className="text-muted-foreground text-xs opacity-40">—</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ══════════════════════════════════════════════
          ФИНАЛЬНЫЙ CTA — как у ExactFarming
      ══════════════════════════════════════════════ */}
      <div className="hero-gradient rounded-3xl p-8 sm:p-10 relative overflow-hidden text-center">
        <div className="hero-gradient-overlay absolute inset-0" />
        <div className="bg-dots absolute inset-0 opacity-15" />
        <div className="absolute -right-16 -bottom-16 w-64 h-64 rounded-full bg-accent/15 blur-3xl pointer-events-none" />
        <div className="relative">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/20 border border-white/30 text-white text-xs font-semibold mb-4">
            <Icon name="Zap" size={11} />Начните бесплатно уже сейчас
          </div>
          <h2 className="font-heading font-black text-2xl sm:text-3xl lg:text-4xl text-white leading-tight mb-3">
            Переведите агробизнес<br />на <span className="gold-text">язык данных</span>
          </h2>
          <p className="text-white/70 text-sm sm:text-base font-body max-w-xl mx-auto mb-8">
            Более <strong className="text-white">1 200 фермеров, трейдеров и агрономов</strong> уже используют АгроПорт
            для принятия решений. Базовый доступ — бесплатно.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <button onClick={() => setActiveSection("forecasts")}
              className="flex items-center gap-2 px-8 py-3.5 bg-white text-primary rounded-xl text-sm font-black hover:bg-white/95 transition-all shadow-xl hover:shadow-2xl active:scale-[0.98]">
              <Icon name="TrendingUp" size={16} />Смотреть прогнозы цен
            </button>
            <button onClick={() => setActiveSection("ndvi")}
              className="flex items-center gap-2 px-8 py-3.5 bg-white/15 border border-white/35 text-white rounded-xl text-sm font-bold hover:bg-white/25 transition-all backdrop-blur-sm active:scale-[0.98]">
              <Icon name="Satellite" size={16} />Мониторинг NDVI
            </button>
            <button onClick={() => setActiveSection("pricing")}
              className="flex items-center gap-2 px-8 py-3.5 border border-white/25 text-white/85 rounded-xl text-sm font-semibold hover:border-white/45 hover:text-white transition-all">
              <Icon name="CreditCard" size={16} />Тарифы и возможности
            </button>
          </div>
          <p className="text-white/40 text-xs mt-5 font-mono">
            Данные НТБ · Росгидромет · Sentinel-2 · Минсельхоз РФ · zerno.ru · agroinvestor.ru
          </p>
        </div>
      </div>
    </>
  );
}
