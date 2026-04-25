import { useState } from "react";
import Icon from "@/components/ui/icon";
import { ALERTS, PROFITABILITY_DATA, PRICING_PLANS } from "./data";
import { Calculator } from "./PageWidgets";
import { exportAnalyticsPdf, exportForecastsXlsx, exportCommercialPdf, exportFor1C } from "@/lib/useExport";

interface SectionBusinessProps {
  activeSection: string;
}

export default function SectionBusiness({ activeSection }: SectionBusinessProps) {
  const [exporting, setExporting] = useState<string | null>(null);

  const doExport = async (tag: string, fn: () => void) => {
    setExporting(tag);
    await new Promise(r => setTimeout(r, 300));
    fn();
    setTimeout(() => setExporting(null), 800);
  };

  const EXPORT_ACTIONS = [
    { label: "Аналитический отчёт (PDF)", icon: "FileText", tag: "PDF",  fn: exportAnalyticsPdf },
    { label: "Данные прогнозов (Excel)", icon: "Table",    tag: "XLSX", fn: exportForecastsXlsx },
    { label: "Коммерческое предложение", icon: "FilePlus", tag: "КП",   fn: exportCommercialPdf },
    { label: "Выгрузка для 1С / API",   icon: "Database", tag: "JSON",  fn: exportFor1C },
  ];

  return (
    <>
      {/* ── ANALYTICS ── */}
      {activeSection === "analytics" && (
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
      )}

      {/* ── BUSINESS ── */}
      {activeSection === "business" && (
        <div className="space-y-6 animate-fade-in">
          {/* Hero */}
          <div className="hero-gradient rounded-2xl p-5 sm:p-6 relative overflow-hidden shadow-md">
            <div className="hero-gradient-overlay absolute inset-0" />
            <div className="bg-dots absolute inset-0 opacity-15" />
            <div className="relative">
              <div className="flex items-center gap-2 mb-1.5">
                <Icon name="Briefcase" size={13} className="text-white/75" />
                <span className="text-white/60 text-xs font-mono uppercase tracking-widest">Бизнес-инструменты</span>
              </div>
              <h1 className="font-heading font-black text-2xl sm:text-3xl text-white">Инструменты для <span className="gold-text">бизнеса</span></h1>
              <p className="text-white/60 text-sm mt-1 font-body">Калькулятор себестоимости · маржинальность · коммерческие предложения · экспорт</p>
            </div>
          </div>

          <div className="grid lg:grid-cols-2 gap-4">
            <div className="glass-card rounded-2xl p-6">
              <div className="flex items-center gap-2.5 mb-5">
                <div className="w-8 h-8 rounded-lg bg-primary/15 flex items-center justify-center">
                  <Icon name="Calculator" size={15} className="text-primary" />
                </div>
                <div>
                  <h2 className="font-heading font-bold text-sm text-foreground">Калькулятор маржинальности</h2>
                  <div className="text-[11px] text-muted-foreground">на основе API · реальные данные</div>
                </div>
              </div>
              <Calculator />
            </div>
            <div className="space-y-4">
              <div className="glass-card rounded-2xl p-5">
                <div className="flex items-center gap-2.5 mb-4">
                  <div className="w-8 h-8 rounded-lg bg-accent/15 flex items-center justify-center">
                    <Icon name="GitCompare" size={15} className="text-accent" />
                  </div>
                  <div>
                    <h2 className="font-heading font-bold text-sm text-foreground">Рейтинг культур по ROI</h2>
                    <div className="text-[11px] text-muted-foreground">от лучшего к худшему</div>
                  </div>
                </div>
                <div className="space-y-3">
                  {[...PROFITABILITY_DATA].sort((a, b) => b.roi - a.roi).map((c, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <span className={`w-6 h-6 rounded-lg flex items-center justify-center text-[11px] font-black shrink-0
                        ${i === 0 ? "hero-gradient text-white shadow-sm" : i === 1 ? "bg-accent/20 text-accent" : "bg-secondary text-muted-foreground"}`}>{i + 1}</span>
                      <span className="text-sm flex-1 font-medium font-body">{c.crop.split(" ")[0]}</span>
                      <div className="w-24 h-2.5 bg-border rounded-full overflow-hidden">
                        <div className="h-full rounded-full progress-bar" style={{ width: `${c.roi}%` }} />
                      </div>
                      <span className="font-mono text-xs font-black w-14 text-right text-primary">{c.roi}%</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="glass-card rounded-2xl p-5">
                <div className="flex items-center gap-2.5 mb-4">
                  <div className="w-8 h-8 rounded-lg bg-primary/15 flex items-center justify-center">
                    <Icon name="Download" size={15} className="text-primary" />
                  </div>
                  <div>
                    <h2 className="font-heading font-bold text-sm text-foreground">Экспорт и отчёты</h2>
                    <div className="text-[11px] text-muted-foreground">PDF · Excel · JSON · 1С</div>
                  </div>
                </div>
                <div className="space-y-2">
                  {EXPORT_ACTIONS.map((r, i) => (
                    <button key={i}
                      onClick={() => doExport(r.tag, r.fn)}
                      disabled={exporting !== null}
                      className="w-full flex items-center gap-3 p-3.5 rounded-xl bg-background border border-border hover:border-primary/30 hover:bg-primary/4 transition-all text-sm text-left disabled:opacity-60 active:scale-[0.99] group">
                      {exporting === r.tag ? (
                        <Icon name="Loader" size={15} className="text-primary animate-spin" />
                      ) : (
                        <Icon name={r.icon as string} size={15} className="text-muted-foreground group-hover:text-primary transition-colors" />
                      )}
                      <span className="flex-1">{r.label}</span>
                      <span className={`px-1.5 py-0.5 text-[10px] font-mono rounded transition-colors ${exporting === r.tag ? "bg-primary/20 text-primary" : "bg-border text-muted-foreground"}`}>
                        {exporting === r.tag ? "..." : r.tag}
                      </span>
                      <Icon name={exporting === r.tag ? "Check" : "Download"} size={14} className={exporting === r.tag ? "text-primary" : "text-muted-foreground"} />
                    </button>
                  ))}
                </div>
                <p className="text-[10px] text-muted-foreground mt-3 leading-relaxed">
                  PDF открывается в новой вкладке для печати. CSV/JSON скачиваются автоматически. Данные: НТБ + Минсельхоз, апрель 2026.
                </p>
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

      {/* ── PRICING ── */}
      {activeSection === "pricing" && (
        <div className="space-y-6 animate-fade-in">

          {/* ── Публичная ссылка / О сайте ── */}
          <div className="glass-card rounded-2xl overflow-hidden shadow-md">
            <div className="relative h-52 overflow-hidden">
              <img
                src="https://cdn.poehali.dev/projects/31e2ff5d-24f0-43ce-888c-a6833c49513a/files/575017c4-0707-42ab-9815-55c71fb2b881.jpg"
                alt="АгроПорт — мониторинг агрорынка России"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-5">
                <div className="flex items-center gap-2 mb-1">
                  <span className="px-2 py-0.5 bg-primary/90 text-white text-[10px] font-bold rounded-full font-mono uppercase tracking-wide">Агро-аналитика · Россия</span>
                  <span className="px-2 py-0.5 bg-accent/90 text-white text-[10px] font-bold rounded-full font-mono">AI · 2026</span>
                </div>
                <h2 className="font-heading font-black text-2xl text-white leading-tight">АгроПорт — умный мониторинг<br />агрорынка России</h2>
              </div>
            </div>

            <div className="p-6 space-y-5">
              {/* Адрес сайта */}
              <div>
                <div className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-2 flex items-center gap-1.5">
                  <Icon name="Globe" size={11} />Адрес сайта
                </div>
                <div className="flex items-center gap-3 p-3 bg-secondary/50 rounded-xl border border-border">
                  <div className="w-8 h-8 rounded-lg bg-primary/15 flex items-center justify-center shrink-0">
                    <Icon name="Globe" size={15} className="text-primary" />
                  </div>
                  <span className="font-mono font-bold text-foreground text-sm flex-1">https://agroport-ai.ru</span>
                  <button
                    className="px-3 py-1.5 bg-primary text-white text-xs font-semibold rounded-lg hover:bg-primary/90 transition-colors flex items-center gap-1.5"
                    onClick={() => navigator.clipboard?.writeText("https://agroport-ai.ru")}>
                    <Icon name="Copy" size={11} />Скопировать
                  </button>
                </div>
              </div>

              {/* Информация о сайте */}
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <div className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-2 flex items-center gap-1.5">
                    <Icon name="Info" size={11} />О платформе
                  </div>
                  <div className="space-y-2 text-sm">
                    {[
                      { label: "Название", value: "АгроПорт" },
                      { label: "Версия", value: "v3.0 (апрель 2026)" },
                      { label: "Охват", value: "23 региона России" },
                      { label: "Культуры", value: "12 агрокультур" },
                      { label: "Обновление данных", value: "Каждые 15 минут" },
                    ].map((r, i) => (
                      <div key={i} className="flex justify-between border-b border-border/40 pb-1.5">
                        <span className="text-muted-foreground">{r.label}</span>
                        <span className="font-medium text-foreground">{r.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <div className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-2 flex items-center gap-1.5">
                    <Icon name="Zap" size={11} />Возможности
                  </div>
                  <div className="space-y-1.5">
                    {[
                      "Прогнозы цен зерновых (ARIMA + LSTM)",
                      "Спутниковый NDVI-мониторинг",
                      "Карта рисков по регионам",
                      "Погода и метеопрогноз",
                      "Калькулятор маржинальности",
                      "AI-рекомендации по культурам",
                    ].map((f, i) => (
                      <div key={i} className="flex items-center gap-2 text-xs text-foreground">
                        <span className="w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
                        {f}
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Описание */}
              <div>
                <div className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-2 flex items-center gap-1.5">
                  <Icon name="FileText" size={11} />Описание сайта
                </div>
                <div className="p-4 bg-secondary/30 rounded-xl border border-border text-sm text-foreground leading-relaxed font-body">
                  <p>
                    <strong>АгроПорт</strong> — профессиональная платформа для мониторинга и прогнозирования агрорынка России.
                    Объединяет спутниковые данные Sentinel-2, биржевые котировки НТБ, данные Минсельхоза РФ и Росгидромета
                    в единую аналитическую систему для фермеров, трейдеров и агробизнеса.
                  </p>
                  <p className="mt-2">
                    Нейросетевые модели (ARIMA + LSTM) анализируют 23 ключевых агрорегиона России и дают прогнозы цен
                    на пшеницу, подсолнечник, кукурузу, ячмень и рожь с горизонтом до 12 месяцев.
                    Точность прогнозов — 87.4%.
                  </p>
                </div>
              </div>

              {/* Кнопки действий */}
              <div className="flex flex-wrap gap-3 pt-1">
                <a
                  href="https://agroport-ai.ru"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-5 py-2.5 hero-gradient text-white text-sm font-bold rounded-xl hover:opacity-90 transition-opacity shadow-md">
                  <Icon name="ExternalLink" size={14} />
                  Открыть сайт
                </a>
                <button className="flex items-center gap-2 px-5 py-2.5 bg-secondary border border-border text-foreground text-sm font-semibold rounded-xl hover:border-primary/40 transition-colors">
                  <Icon name="Share2" size={14} />
                  Поделиться
                </button>
                <button className="flex items-center gap-2 px-5 py-2.5 bg-secondary border border-border text-foreground text-sm font-semibold rounded-xl hover:border-primary/40 transition-colors">
                  <Icon name="QrCode" size={14} />
                  QR-код
                </button>
              </div>
            </div>
          </div>

          <div className="text-center max-w-xl mx-auto">
            <h1 className="text-2xl font-bold text-foreground">Тарифы АгроПорт</h1>
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