import { useState, useEffect } from "react";
import Icon from "@/components/ui/icon";
import Sidebar from "./Sidebar";
import PageContent from "./PageContent";
import ConsentModal from "./ConsentModal";

const SECTION_TITLES: Record<string, { label: string; desc: string; seoTitle: string; seoDesc: string }> = {
  home:         { label: "Главная",             desc: "Дашборд и сводка по рынку",              seoTitle: "АгроПорт — AI-мониторинг агрорынка России",                                                     seoDesc: "Дашборд агрорынка России: цены на зерно, NDVI-мониторинг посевов, прогнозы урожайности и карта рисков в реальном времени." },
  forecasts:    { label: "Прогнозы цен",        desc: "Цены и урожайность культур",             seoTitle: "Прогнозы цен на зерно 2026 — АгроПорт",                                                        seoDesc: "AI-прогнозы цен на пшеницу, подсолнечник, кукурузу и ячмень. Точность моделей ARIMA+LSTM — 87%. Актуальные котировки НТБ." },
  map:          { label: "Карта урожайности",   desc: "Россия · 23 региона",                   seoTitle: "Карта урожайности регионов России — АгроПорт",                                                  seoDesc: "Интерактивная карта урожайности 23 регионов России. NDVI-индексы, площади посевов, риски засухи и заморозков." },
  supply:       { label: "Спрос и предложение", desc: "Баланс рынка",                          seoTitle: "Спрос и предложение на зерновом рынке России — АгроПорт",                                      seoDesc: "Баланс агрорынка России: объёмы производства, экспорт, внутреннее потребление зерновых и масличных культур." },
  ndvi:         { label: "NDVI-мониторинг",     desc: "Спутниковые данные Sentinel-2",         seoTitle: "NDVI-мониторинг посевов — спутниковые данные Sentinel-2 | АгроПорт",                          seoDesc: "Спутниковый мониторинг посевов России по данным Sentinel-2. NDVI-индексы вегетации, динамика по регионам и культурам." },
  news:         { label: "Новости АПК",         desc: "Актуальные события",                    seoTitle: "Новости агрорынка и АПК России 2026 — АгроПорт",                                               seoDesc: "Актуальные новости агропромышленного комплекса России. Котировки, экспортные пошлины, погода и прогнозы урожая." },
  risks:        { label: "Карта рисков",        desc: "Засуха, заморозки, вредители",          seoTitle: "Карта агрорисков России — засуха, заморозки, вредители | АгроПорт",                          seoDesc: "Карта агрорисков по регионам России: засуха, заморозки, суховей, переувлажнение. Уровни риска и рекомендации." },
  "ai-model":   { label: "AI-модель",           desc: "ARIMA + LSTM прогнозирование",          seoTitle: "AI-модель прогнозирования цен на зерно — ARIMA+LSTM | АгроПорт",                             seoDesc: "Машинное обучение для прогноза цен на агрорынке. Модели ARIMA и LSTM с точностью 87%. Настраиваемые параметры и горизонт прогноза." },
  analytics:    { label: "Аналитика",           desc: "Рентабельность и рекомендации",         seoTitle: "Аналитика рентабельности агробизнеса — АгроПорт",                                              seoDesc: "Расчёт рентабельности сельхозпроизводства. Сравнение культур, анализ затрат и маржинальности, рекомендации по портфелю." },
  business:     { label: "Бизнес-инструменты", desc: "Калькулятор, экспорт, интеграции",      seoTitle: "Бизнес-инструменты для агропредприятий — АгроПорт",                                            seoDesc: "Калькулятор прибыльности, экспорт отчётов, инструменты планирования и интеграции для фермеров и агротрейдеров." },
  planner:      { label: "Планировщик посевов", desc: "Посевные площади и севооборот",         seoTitle: "Планировщик посевных площадей и севооборота — АгроПорт",                                       seoDesc: "Планирование посевных площадей, севооборота и агрокалендаря. Оптимизация структуры посевов под текущие цены и риски." },
  alerts:       { label: "Уведомления",         desc: "Уведомления и события",                 seoTitle: "Агро-уведомления и алерты рынка — АгроПорт",                                                   seoDesc: "Система уведомлений об изменениях цен, погодных рисках и рыночных событиях агрорынка России в реальном времени." },
  integrations: { label: "Интеграции",          desc: "1С, ERP, API",                          seoTitle: "Интеграции АгроПорт с 1С, ERP и внешними системами",                                           seoDesc: "API-интеграции платформы АгроПорт с 1С, ERP-системами и внешними источниками данных агрорынка." },
  pricing:      { label: "Тарифы и услуги",     desc: "Подписки, API, консультации",           seoTitle: "Тарифы и услуги АгроПорт — подписки, API, консультации",                                       seoDesc: "Тарифные планы, API-доступ, экспертные консультации и премиум-отчёты платформы АгроПорт для фермеров, трейдеров и агрохолдингов." },
  loyalty:      { label: "Программа лояльности", desc: "АгроБаллы и привилегии",              seoTitle: "Программа лояльности АгроПорт — АгроБаллы",                                                    seoDesc: "Зарабатывайте АгроБаллы за активность и обменивайте на подписки, премиум-отчёты и консультации экспертов." },
  partners:     { label: "Партнёры",             desc: "Партнёрская программа и реклама",      seoTitle: "Партнёрская программа АгроПорт — реклама и интеграции",                                        seoDesc: "Партнёрство с АгроПортом: реклама для 50 000+ аграриев, совместные программы с банками, агрохолдингами и поставщиками техники." },
  docs:         { label: "Документы",            desc: "Правила, ПДн, АгроБаллы",             seoTitle: "Правовые документы АгроПорт — правила, персональные данные",                                   seoDesc: "Правила пользования платформой АгроПорт, Политика обработки персональных данных (152-ФЗ), Правила программы АгроБаллы." },
  logistics:    { label: "Логистика",           desc: "Расчёт маршрутов и стоимости доставки", seoTitle: "Логистика зерна — расчёт маршрутов и стоимости доставки | АгроПорт",                         seoDesc: "Расчёт логистики и стоимости доставки зерна по России. Оптимизация маршрутов, тарифы перевозчиков, карта элеваторов." },
  board:        { label: "Доска объявлений",    desc: "Купля и продажа сельхозпродукции",      seoTitle: "Доска объявлений зерна и сельхозпродукции — АгроПорт",                                         seoDesc: "Купля и продажа пшеницы, подсолнечника, кукурузы и других культур. Объявления с zerno.ru, agroserver.ru и от пользователей." },
  crm:          { label: "Личный кабинет",      desc: "CRM, профиль и сделки",                 seoTitle: "Личный кабинет — CRM и управление сделками | АгроПорт",                                        seoDesc: "Личный кабинет агропредприятия: CRM-система, управление контактами, сделками и задачами на платформе АгроПорт." },
  portfolio:    { label: "Мой портфель",        desc: "Культуры, площади и расчёт выручки",    seoTitle: "Мой портфель культур — АгроПорт",                                                               seoDesc: "Управляйте своим портфелем культур: рассчитайте ожидаемую выручку, прибыль и рентабельность по каждой культуре и региону." },
};

export default function Index() {
  const getInitialSection = () => {
    const hash = window.location.hash.replace("#", "");
    return hash && SECTION_TITLES[hash] ? hash : "home";
  };

  const [activeSection, setActiveSection] = useState(getInitialSection);
  const [selectedRegion, setSelectedRegion] = useState<string | null>("volgograd");
  const [selectedCrop, setSelectedCrop] = useState("Пшеница озимая");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [animKey, setAnimKey] = useState(0);
  const [time, setTime] = useState(new Date());
  const [showConsent, setShowConsent] = useState(false);

  useEffect(() => {
    setAnimKey(k => k + 1);
    const s = SECTION_TITLES[activeSection];
    if (!s) return;
    document.title = s.seoTitle;
    const metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc) metaDesc.setAttribute("content", s.seoDesc);
    const ogTitle = document.querySelector('meta[property="og:title"]');
    if (ogTitle) ogTitle.setAttribute("content", s.seoTitle);
    const ogDesc = document.querySelector('meta[property="og:description"]');
    if (ogDesc) ogDesc.setAttribute("content", s.seoDesc);
    const canonical = document.querySelector('link[rel="canonical"]');
    if (canonical) {
      const url = activeSection === "home" ? "https://agroport-ai.ru" : `https://agroport-ai.ru/#${activeSection}`;
      canonical.setAttribute("href", url);
    }
    window.history.replaceState(null, "", activeSection === "home" ? "/" : `/#${activeSection}`);
    const breadcrumb = {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      "itemListElement": activeSection === "home"
        ? [{ "@type": "ListItem", "position": 1, "name": "АгроПорт", "item": "https://agroport-ai.ru" }]
        : [
            { "@type": "ListItem", "position": 1, "name": "АгроПорт", "item": "https://agroport-ai.ru" },
            { "@type": "ListItem", "position": 2, "name": s.label,    "item": `https://agroport-ai.ru/#${activeSection}` },
          ],
    };
    let ld = document.getElementById("ld-breadcrumb");
    if (!ld) { ld = document.createElement("script"); ld.id = "ld-breadcrumb"; ld.setAttribute("type", "application/ld+json"); document.head.appendChild(ld); }
    ld.textContent = JSON.stringify(breadcrumb);
  }, [activeSection]);

  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 60000);
    return () => clearInterval(t);
  }, []);

  const section = SECTION_TITLES[activeSection] || { label: activeSection, desc: "", seoTitle: "", seoDesc: "" };

  const handleConsentAccept = () => {
    localStorage.setItem("agroport_consent_v1", new Date().toISOString());
    setShowConsent(false);
  };

  return (
    <div className="min-h-screen bg-background font-body flex overflow-hidden">
      {showConsent && <ConsentModal onAccept={handleConsentAccept} />}
      <Sidebar
        activeSection={activeSection}
        sidebarOpen={sidebarOpen}
        collapsed={sidebarCollapsed}
        onNavigate={setActiveSection}
        onClose={() => setSidebarOpen(false)}
        onToggleCollapse={() => setSidebarCollapsed(c => !c)}
      />

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">

        {/* ── Header ── */}
        <header className="h-14 border-b border-border flex items-center px-4 gap-3 bg-white/80 backdrop-blur-md shrink-0 shadow-sm">

          {/* Бургер (мобайл) */}
          <button
            className="lg:hidden w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"
            onClick={() => setSidebarOpen(true)}>
            <Icon name="Menu" size={18} />
          </button>

          {/* Свернуть/развернуть сайдбар (desktop) */}
          <button
            className="hidden lg:flex w-8 h-8 rounded-lg items-center justify-center text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"
            title={sidebarCollapsed ? "Развернуть меню" : "Свернуть меню"}
            onClick={() => setSidebarCollapsed(c => !c)}>
            <Icon name={sidebarCollapsed ? "PanelLeftOpen" : "PanelLeftClose"} size={18} />
          </button>

          {/* Breadcrumb */}
          <nav aria-label="Breadcrumb" className="flex-1 flex items-center gap-2 min-w-0">
            <ol className="hidden sm:flex items-center gap-1 text-xs min-w-0">
              <li className="flex items-center gap-1 shrink-0">
                <Icon name="Wheat" size={11} className="text-primary" />
                {activeSection === "home" ? (
                  <span className="text-foreground font-semibold">АгроПорт</span>
                ) : (
                  <button
                    onClick={() => setActiveSection("home")}
                    className="text-primary font-medium hover:underline transition-colors">
                    АгроПорт
                  </button>
                )}
              </li>
              {activeSection !== "home" && (
                <>
                  <li className="text-muted-foreground/50 shrink-0" aria-hidden>
                    <Icon name="ChevronRight" size={12} />
                  </li>
                  <li className="flex items-center gap-1 min-w-0">
                    <span className="text-foreground font-semibold truncate">{section.label}</span>
                  </li>
                </>
              )}
            </ol>
            {activeSection !== "home" && section.desc && (
              <span className="hidden md:block text-[11px] text-muted-foreground border-l border-border pl-2 ml-0.5 truncate">
                {section.desc}
              </span>
            )}
          </nav>

          {/* Правая часть */}
          <div className="flex items-center gap-2 shrink-0">
            {/* LIVE индикатор */}
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-primary/10 border border-primary/25 text-primary text-xs font-mono">
              <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse-glow" />
              <span className="hidden sm:inline">LIVE</span>
            </div>

            {/* Дата */}
            <span className="text-xs text-muted-foreground font-mono hidden md:block">
              {time.toLocaleDateString("ru-RU", { day: "2-digit", month: "short", year: "numeric" })}
            </span>

            {/* Алерты */}
            <button
              className="relative w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"
              onClick={() => setActiveSection("alerts")}>
              <Icon name="Bell" size={17} />
              <span className="absolute top-1 right-1 w-3 h-3 rounded-full bg-destructive text-[8px] text-white flex items-center justify-center font-bold leading-none badge-pulse">7</span>
            </button>

            {/* АгроБаллы */}
            <button
              onClick={() => setActiveSection("loyalty")}
              className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-50 border border-amber-200 hover:bg-amber-100 transition-colors group">
              <Icon name="Crown" size={12} className="text-amber-500" />
              <span className="text-xs font-mono font-bold text-amber-700">210</span>
              <span className="text-[10px] text-amber-500 hidden md:inline">баллов</span>
            </button>

            {/* Профиль */}
            <button
              className="flex items-center gap-2 pl-2 border-l border-border ml-1"
              onClick={() => setActiveSection("crm")}>
              <div className="w-7 h-7 rounded-full hero-gradient flex items-center justify-center text-white shadow-sm">
                <Icon name="User" size={14} className="text-white" />
              </div>
            </button>
          </div>
        </header>

        <PageContent
          activeSection={activeSection}
          animKey={animKey}
          selectedRegion={selectedRegion}
          setSelectedRegion={setSelectedRegion}
          selectedCrop={selectedCrop}
          setSelectedCrop={setSelectedCrop}
          setActiveSection={setActiveSection}
          onRegister={() => {
            if (!localStorage.getItem("agroport_consent_v1")) setShowConsent(true);
          }}
        />
      </div>
    </div>
  );
}