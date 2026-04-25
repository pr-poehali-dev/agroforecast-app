import { useState, useEffect } from "react";
import Icon from "@/components/ui/icon";
import Sidebar from "./Sidebar";
import PageContent from "./PageContent";

const SECTION_TITLES: Record<string, { label: string; desc: string }> = {
  home:         { label: "Главная",            desc: "Дашборд и сводка по рынку" },
  forecasts:    { label: "Прогнозы",           desc: "Цены и урожайность культур" },
  map:          { label: "Карта регионов",     desc: "Россия · 23 региона" },
  supply:       { label: "Спрос и предложение",desc: "Баланс рынка" },
  ndvi:         { label: "NDVI-мониторинг",    desc: "Спутниковые данные Sentinel-2" },
  news:         { label: "Новости АПК",        desc: "Актуальные события" },
  risks:        { label: "Риски",              desc: "Засуха, заморозки, вредители" },
  "ai-model":   { label: "AI-модель",          desc: "ARIMA + LSTM прогнозирование" },
  analytics:    { label: "Аналитика",          desc: "Рентабельность и рекомендации" },
  business:     { label: "Бизнес-инструменты",desc: "Калькулятор, экспорт, интеграции" },
  planner:      { label: "Планировщик",        desc: "Посевные площади и севооборот" },
  alerts:       { label: "Алерты",             desc: "Уведомления и события" },
  integrations: { label: "Интеграции",         desc: "1С, ERP, API" },
  pricing:      { label: "Тарифы",             desc: "Планы и возможности" },
};

export default function Index() {
  const [activeSection, setActiveSection] = useState("home");
  const [selectedRegion, setSelectedRegion] = useState<string | null>("volgograd");
  const [selectedCrop, setSelectedCrop] = useState("Пшеница озимая");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [animKey, setAnimKey] = useState(0);
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    setAnimKey(k => k + 1);
  }, [activeSection]);

  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 60000);
    return () => clearInterval(t);
  }, []);

  const section = SECTION_TITLES[activeSection] || { label: activeSection, desc: "" };

  return (
    <div className="min-h-screen bg-background font-body flex overflow-hidden">
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
          <div className="flex-1 flex items-center gap-2 min-w-0">
            <div className="hidden sm:flex items-center gap-1.5 text-xs text-muted-foreground">
              <Icon name="Wheat" size={11} className="text-primary shrink-0" />
              <button
                onClick={() => setActiveSection("home")}
                className="text-primary font-medium hover:text-primary/80 hover:underline transition-colors cursor-pointer">
                АгроПорт
              </button>
              <Icon name="ChevronRight" size={12} />
              <button
                onClick={() => setActiveSection(activeSection)}
                className="text-foreground font-medium hover:text-primary transition-colors cursor-pointer truncate">
                {section.label}
              </button>
            </div>
            {section.desc && (
              <button
                onClick={() => setActiveSection("home")}
                className="hidden md:block text-[11px] text-muted-foreground border-l border-border pl-2 ml-1 truncate hover:text-primary transition-colors cursor-pointer">
                {section.desc}
              </button>
            )}
          </div>

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

            {/* Профиль */}
            <button
              className="flex items-center gap-2 pl-2 border-l border-border ml-1"
              onClick={() => setActiveSection("pricing")}>
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
        />
      </div>
    </div>
  );
}