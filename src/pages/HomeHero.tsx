import Icon from "@/components/ui/icon";

interface HomeHeroProps {
  setActiveSection: (section: string) => void;
}

export default function HomeHero({ setActiveSection }: HomeHeroProps) {
  return (
    <>
      {/* ══════════════════════════════════════════════
          HERO — главный экран
      ══════════════════════════════════════════════ */}
      <div className="hero-gradient rounded-3xl overflow-hidden relative shadow-2xl">
        <div className="hero-gradient-overlay absolute inset-0" />
        <div className="bg-dots absolute inset-0 opacity-20" />
        {/* Декоративные круги */}
        <div className="absolute -right-20 -top-20 w-96 h-96 rounded-full bg-white/5 blur-3xl pointer-events-none" />
        <div className="absolute -left-10 -bottom-10 w-64 h-64 rounded-full bg-accent/10 blur-2xl pointer-events-none" />

        <div className="relative p-7 sm:p-10">
          {/* Верхний бейдж */}
          <div className="flex flex-wrap items-center gap-2 mb-5">
            <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/20 border border-white/30 text-white text-xs font-semibold backdrop-blur-sm">
              <span className="w-2 h-2 rounded-full bg-accent animate-pulse-glow" />
              Данные обновлены · апрель 2026
            </span>
            <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-accent/25 border border-accent/40 text-accent text-xs font-bold">
              <Icon name="Brain" size={11} />ARIMA + LSTM · v3.0
            </span>
            <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/10 border border-white/20 text-white/80 text-xs font-mono">
              🇷🇺 23 региона России
            </span>
          </div>

          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8">
            <div className="flex-1 max-w-2xl">
              <h1 className="font-heading font-black leading-[1.05] text-white">
                <span className="text-3xl sm:text-4xl lg:text-5xl block">Принимайте решения</span>
                <span className="text-3xl sm:text-4xl lg:text-5xl block mt-1">на основе <span className="gold-text">реальных данных</span></span>
              </h1>
              <p className="text-white/75 mt-4 text-base font-body max-w-xl leading-relaxed">
                АгроПорт — единая платформа прогнозирования цен, мониторинга урожайности и управления рисками
                для фермеров, трейдеров и агробизнеса России.
              </p>
              <div className="flex flex-wrap gap-3 mt-6">
                <button onClick={() => setActiveSection("forecasts")}
                  className="flex items-center gap-2 px-6 py-3 bg-white text-primary rounded-xl text-sm font-black hover:bg-white/95 transition-all shadow-xl active:scale-[0.98] hover:shadow-2xl">
                  <Icon name="TrendingUp" size={16} />Смотреть прогнозы
                </button>
                <button onClick={() => setActiveSection("ai-model")}
                  className="flex items-center gap-2 px-6 py-3 bg-white/15 border border-white/35 text-white rounded-xl text-sm font-bold hover:bg-white/25 transition-all backdrop-blur-sm active:scale-[0.98]">
                  <Icon name="Brain" size={16} />AI-модель
                </button>
                <button onClick={() => setActiveSection("pricing")}
                  className="flex items-center gap-2 px-6 py-3 bg-transparent border border-white/20 text-white/80 rounded-xl text-sm font-semibold hover:border-white/40 hover:text-white transition-all">
                  <Icon name="CreditCard" size={16} />Тарифы
                </button>
              </div>
            </div>

            {/* Большие KPI-цифры */}
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-2 gap-3 shrink-0 lg:w-64">
              {[
                { v: "87%",  l: "Точность AI",      icon: "Target" },
                { v: "23",   l: "Региона России",   icon: "MapPin" },
                { v: "12",   l: "Культур",           icon: "Wheat" },
                { v: "LIVE", l: "Обновление данных", icon: "Zap" },
              ].map((s, i) => (
                <div key={i} className="bg-white/12 border border-white/20 rounded-2xl p-4 text-center backdrop-blur-sm hover:bg-white/18 transition-colors">
                  <Icon name={s.icon as string} size={16} className="text-white/60 mx-auto mb-1.5" />
                  <div className="text-white font-mono font-black text-2xl leading-none">{s.v}</div>
                  <div className="text-white/55 text-[10px] mt-1.5 leading-tight">{s.l}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════════════
          ПОЧЕМУ МЫ ЛУЧШЕ — блок преимуществ
      ══════════════════════════════════════════════ */}
      <div>
        <div className="text-center mb-6">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-semibold mb-3">
            <Icon name="Award" size={12} />Почему АгроПорт
          </div>
          <h2 className="font-heading font-black text-2xl sm:text-3xl text-foreground">
            Аналитика, которой <span className="text-primary">доверяет бизнес</span>
          </h2>
          <p className="text-muted-foreground mt-2 text-sm max-w-xl mx-auto font-body">
            Мы объединяем спутниковые данные, биржевые котировки и нейросети в одном инструменте
          </p>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[
            {
              icon: "Brain", color: "primary",
              title: "AI с точностью 87%",
              desc: "ARIMA + LSTM + Random Forest. Валидация на данных 2015–2024. MAPE цен 8.7%, урожайности 12.4%.",
              badge: "vs 65% у конкурентов",
            },
            {
              icon: "Satellite", color: "accent",
              title: "Спутниковый NDVI",
              desc: "Sentinel-2 (ESA) с разрешением 10 м/пиксель. Обновление каждые 5 дней. 23 региона России.",
              badge: "Sentinel-2 · ESA",
            },
            {
              icon: "Globe", color: "primary",
              title: "Реальные цены рынка",
              desc: "НТБ, zerno.ru, agroinvestor.ru — в реальном времени через RSS. Без задержек и ручного ввода.",
              badge: "RSS · Live",
            },
            {
              icon: "ShieldAlert", color: "accent",
              title: "Карта рисков России",
              desc: "Засуха, заморозки, вредители — вероятностная модель по каждому из 23 регионов с рекомендациями.",
              badge: "23 региона",
            },
            {
              icon: "Calculator", color: "primary",
              title: "Калькулятор прибыли",
              desc: "Введите культуру и площадь — получите выручку, затраты, маржу, ROI и лучший срок продажи.",
              badge: "API · реальные данные",
            },
            {
              icon: "CandlestickChart", color: "accent",
              title: "Японские свечи",
              desc: "Интерактивный график с японскими свечами, выбором периода и hover-подсказками по каждой точке.",
              badge: "Новинка v3.0",
            },
          ].map((f, i) => (
            <div key={i} className="glass-card rounded-2xl p-5 hover:shadow-md transition-all group border border-border hover:border-primary/20">
              <div className="flex items-start justify-between mb-4">
                <div className={`w-11 h-11 rounded-xl flex items-center justify-center shadow-sm
                  ${f.color === "primary" ? "bg-primary/15 text-primary" : "bg-accent/15 text-accent"}`}>
                  <Icon name={f.icon as string} size={20} />
                </div>
                <span className={`text-[10px] font-mono font-bold px-2 py-1 rounded-full
                  ${f.color === "primary" ? "bg-primary/10 text-primary" : "bg-accent/15 text-accent"}`}>
                  {f.badge}
                </span>
              </div>
              <h3 className="font-heading font-bold text-sm text-foreground mb-1.5">{f.title}</h3>
              <p className="text-xs text-muted-foreground leading-relaxed font-body">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ══════════════════════════════════════════════
          СОЦИАЛЬНОЕ ДОВЕРИЕ — цифры и партнёры
      ══════════════════════════════════════════════ */}
      <div className="hero-gradient rounded-2xl p-6 sm:p-8 relative overflow-hidden">
        <div className="hero-gradient-overlay absolute inset-0" />
        <div className="bg-dots absolute inset-0 opacity-10" />
        <div className="relative">
          <div className="text-center mb-6">
            <p className="text-white/60 text-xs font-mono uppercase tracking-widest mb-2">Цифры платформы</p>
            <h2 className="font-heading font-black text-2xl text-white">Нам доверяют <span className="gold-text">профессионалы</span></h2>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
            {[
              { v: "1 200+", l: "Пользователей", icon: "Users" },
              { v: "85.9 млн т", l: "Прогноз пшеницы 2026", icon: "Wheat" },
              { v: "3.2 млн т", l: "Экспорт в апреле", icon: "Globe" },
              { v: "15 мин", l: "Обновление данных", icon: "Clock" },
            ].map((s, i) => (
              <div key={i} className="text-center">
                <Icon name={s.icon as string} size={20} className="text-white/50 mx-auto mb-2" />
                <div className="font-mono font-black text-xl sm:text-2xl text-white leading-none">{s.v}</div>
                <div className="text-white/55 text-[11px] mt-1.5 font-body">{s.l}</div>
              </div>
            ))}
          </div>
          {/* Источники данных */}
          <div className="border-t border-white/15 pt-5">
            <p className="text-white/45 text-[11px] font-mono uppercase tracking-widest text-center mb-4">Источники данных</p>
            <div className="flex flex-wrap justify-center gap-3">
              {[
                "НТБ (биржа)", "Минсельхоз РФ", "Росгидромет", "Sentinel-2 (ESA)",
                "zerno.ru", "agroinvestor.ru", "oilworld.ru", "Русагротранс",
              ].map((s, i) => (
                <span key={i} className="px-3 py-1.5 bg-white/10 border border-white/20 rounded-lg text-white/75 text-xs font-medium">
                  {s}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
