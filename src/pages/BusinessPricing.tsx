import { useState } from "react";
import Icon from "@/components/ui/icon";
import { PRICING_PLANS, CONSULTATIONS, PREMIUM_REPORTS } from "./data";

const TABS = [
  { id: "plans", label: "Тарифы", icon: "CreditCard" },
  { id: "marketplace", label: "Маркетплейс", icon: "ShoppingCart" },
  { id: "reports", label: "Отчёты и данные", icon: "FileText" },
  { id: "consultations", label: "Консультации", icon: "MessageSquare" },
  { id: "api", label: "API и интеграции", icon: "Code2" },
];

const COMMISSION_RATES = [
  { range: "до 100 т", rate: "2%", example: "Партия 80 т × 13 500 ₽ → комиссия ~21 600 ₽" },
  { range: "100–1 000 т", rate: "1%", example: "Партия 500 т × 13 500 ₽ → комиссия ~67 500 ₽" },
  { range: "свыше 1 000 т", rate: "0,5%", example: "Партия 2 000 т × 13 500 ₽ → комиссия ~135 000 ₽" },
];

const API_PACKAGES = [
  { title: "NDVI и метеоданные", price: 10_000, unit: "регион/мес", icon: "Satellite", desc: "Спутниковые NDVI-индексы Sentinel-2, метеоданные Росгидромета" },
  { title: "Прогнозы урожайности", price: 15_000, unit: "культура/мес", icon: "TrendingUp", desc: "Модели ARIMA+LSTM, горизонт до 12 месяцев, 87% точность" },
  { title: "Аналитика цен", price: 12_000, unit: "культура/мес", icon: "BarChart3", desc: "Котировки НТБ/CBOT, биржевые данные, исторические ряды" },
  { title: "White-label платформа", price: 500_000, unit: "проект", icon: "Layers", desc: "Кастомизированная платформа АгроПорт под брендом клиента" },
];

function CommissionCalc() {
  const [volume, setVolume] = useState("500");
  const [price, setPrice] = useState("13500");

  const v = parseFloat(volume) || 0;
  const p = parseFloat(price) || 0;
  const total = v * p;
  const rate = v > 1000 ? 0.005 : v > 100 ? 0.01 : 0.02;
  const commission = total * rate;
  const rateLabel = v > 1000 ? "0,5%" : v > 100 ? "1%" : "2%";

  return (
    <div className="glass-card rounded-2xl p-5 space-y-4">
      <h3 className="font-heading font-bold text-sm text-foreground flex items-center gap-2">
        <Icon name="Calculator" size={14} className="text-primary" />
        Калькулятор комиссии
      </h3>
      <div className="grid sm:grid-cols-2 gap-3">
        <div>
          <label className="text-xs text-muted-foreground mb-1.5 block font-medium">Объём (тонн)</label>
          <input
            type="number" min="1" value={volume} onChange={e => setVolume(e.target.value)}
            className="w-full text-sm bg-secondary border border-border rounded-lg px-3 py-2 text-foreground focus:outline-none focus:border-primary/50 transition"
          />
        </div>
        <div>
          <label className="text-xs text-muted-foreground mb-1.5 block font-medium">Цена ₽/т</label>
          <input
            type="number" min="1" value={price} onChange={e => setPrice(e.target.value)}
            className="w-full text-sm bg-secondary border border-border rounded-lg px-3 py-2 text-foreground focus:outline-none focus:border-primary/50 transition"
          />
        </div>
      </div>
      {v > 0 && p > 0 && (
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-secondary/60 rounded-xl p-3 text-center">
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-mono mb-1">Сумма сделки</p>
            <p className="font-heading font-black text-base text-foreground">{total.toLocaleString("ru-RU")} ₽</p>
          </div>
          <div className="bg-primary/8 border border-primary/20 rounded-xl p-3 text-center">
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-mono mb-1">Ставка</p>
            <p className="font-heading font-black text-base text-primary">{rateLabel}</p>
          </div>
          <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 text-center">
            <p className="text-[10px] text-emerald-600 uppercase tracking-wider font-mono mb-1">Комиссия</p>
            <p className="font-heading font-black text-base text-emerald-700">{commission.toLocaleString("ru-RU")} ₽</p>
          </div>
        </div>
      )}
    </div>
  );
}

function LeadForm({ title, fields, submitLabel = "Отправить заявку" }: {
  title: string;
  fields: { name: string; label: string; type?: string; placeholder?: string }[];
  submitLabel?: string;
}) {
  const [values, setValues] = useState<Record<string, string>>({});
  const [sent, setSent] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSent(true);
    setTimeout(() => setSent(false), 4000);
    setValues({});
  };

  if (sent) {
    return (
      <div className="flex flex-col items-center gap-3 py-8">
        <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center">
          <Icon name="CheckCircle" size={24} className="text-emerald-600" />
        </div>
        <p className="font-heading font-bold text-base text-foreground">Заявка отправлена!</p>
        <p className="text-sm text-muted-foreground text-center">Наш менеджер свяжется с вами в течение рабочего дня</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <h3 className="font-heading font-bold text-sm text-foreground">{title}</h3>
      {fields.map(f => (
        <div key={f.name}>
          <label className="text-xs text-muted-foreground mb-1 block font-medium">{f.label}</label>
          {f.type === "textarea" ? (
            <textarea
              rows={3}
              value={values[f.name] || ""}
              onChange={e => setValues(v => ({ ...v, [f.name]: e.target.value }))}
              placeholder={f.placeholder}
              className="w-full text-sm bg-secondary border border-border rounded-lg px-3 py-2 text-foreground placeholder:text-muted-foreground/50 resize-none focus:outline-none focus:border-primary/50 transition"
            />
          ) : (
            <input
              type={f.type || "text"}
              required
              value={values[f.name] || ""}
              onChange={e => setValues(v => ({ ...v, [f.name]: e.target.value }))}
              placeholder={f.placeholder}
              className="w-full text-sm bg-secondary border border-border rounded-lg px-3 py-2 text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary/50 transition"
            />
          )}
        </div>
      ))}
      <button type="submit" className="w-full flex items-center justify-center gap-2 px-5 py-2.5 bg-primary text-white text-sm font-semibold rounded-xl hover:bg-primary/90 transition-colors">
        <Icon name="Send" size={14} />
        {submitLabel}
      </button>
    </form>
  );
}

export default function BusinessPricing() {
  const [activeTab, setActiveTab] = useState("plans");
  const [billingYear, setBillingYear] = useState(false);

  return (
    <div className="space-y-5 animate-fade-in">

      {/* Hero */}
      <div className="hero-gradient rounded-2xl p-5 sm:p-7 relative overflow-hidden shadow-md">
        <div className="hero-gradient-overlay absolute inset-0" />
        <div className="bg-dots absolute inset-0 opacity-15" />
        <div className="relative">
          <div className="flex items-center gap-2 mb-1.5">
            <Icon name="CreditCard" size={13} className="text-white/70" />
            <span className="text-white/55 text-xs font-mono uppercase tracking-widest">АгроПорт · Монетизация</span>
          </div>
          <h1 className="font-heading font-black text-2xl sm:text-3xl text-white leading-tight">
            Тарифы и <span className="gold-text">услуги</span>
          </h1>
          <p className="text-white/60 text-sm mt-1 font-body">
            Подписки · Маркетплейс · API · Консультации · Премиум-отчёты
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {TABS.map(t => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap border transition-all shrink-0 ${
              activeTab === t.id
                ? "bg-primary text-white border-primary shadow-sm"
                : "bg-secondary text-muted-foreground border-border hover:border-primary/30 hover:text-foreground"
            }`}
          >
            <Icon name={t.icon as "CreditCard"} size={12} />
            {t.label}
          </button>
        ))}
      </div>

      {/* ── PLANS ── */}
      {activeTab === "plans" && (
        <div className="space-y-5">
          {/* Billing toggle */}
          <div className="flex items-center justify-center gap-3">
            <span className={`text-sm font-medium ${!billingYear ? "text-foreground" : "text-muted-foreground"}`}>Помесячно</span>
            <button
              onClick={() => setBillingYear(v => !v)}
              className={`relative w-11 h-6 rounded-full transition-colors ${billingYear ? "bg-primary" : "bg-border"}`}
            >
              <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all ${billingYear ? "left-5.5 translate-x-0.5" : "left-0.5"}`} />
            </button>
            <span className={`text-sm font-medium ${billingYear ? "text-foreground" : "text-muted-foreground"}`}>
              Годовая <span className="text-emerald-600 font-bold text-xs ml-1">−17%</span>
            </span>
          </div>

          <div className="grid md:grid-cols-3 gap-4">
            {PRICING_PLANS.map((plan, i) => {
              const yearPrice = plan.price > 0 ? Math.round(plan.price * 12 * 0.83) : 0;
              return (
                <div key={i} className={`glass-card rounded-2xl p-6 flex flex-col relative ${plan.popular ? "border-2 border-primary shadow-lg" : "border border-border"}`}>
                  {plan.popular && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 bg-primary text-white text-xs font-bold rounded-full">Популярный</div>
                  )}
                  <div className="mb-4">
                    <div className="text-sm font-semibold text-muted-foreground mb-1">{plan.name}</div>
                    {plan.price === 0 ? (
                      <div className="flex items-baseline gap-1">
                        <span className="text-3xl font-bold font-mono text-foreground">Бесплатно</span>
                      </div>
                    ) : plan.price >= 8000 ? (
                      <div className="flex items-baseline gap-1">
                        <span className="text-xl font-bold font-mono text-foreground">Индивидуально</span>
                      </div>
                    ) : (
                      <div className="flex items-baseline gap-1">
                        <span className="text-3xl font-bold font-mono text-foreground">
                          {billingYear ? Math.round(yearPrice / 12).toLocaleString() : plan.price.toLocaleString()} ₽
                        </span>
                        <span className="text-xs text-muted-foreground">/мес</span>
                      </div>
                    )}
                    {billingYear && plan.price > 0 && plan.price < 8000 && (
                      <p className="text-xs text-emerald-600 font-medium mt-1">{yearPrice.toLocaleString()} ₽/год · экономия {(plan.price * 12 - yearPrice).toLocaleString()} ₽</p>
                    )}
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
                  <button className={`w-full py-2.5 rounded-xl text-sm font-semibold transition-all ${
                    plan.popular
                      ? "bg-primary text-white hover:bg-primary/90 shadow-md"
                      : plan.price >= 8000
                      ? "bg-accent/15 text-accent border border-accent/30 hover:bg-accent/25"
                      : "bg-secondary text-foreground border border-border hover:border-primary/40"
                  }`}>
                    {plan.price === 0 ? "Начать бесплатно" : plan.price >= 8000 ? "Связаться с нами" : "Выбрать план"}
                  </button>
                </div>
              );
            })}
          </div>

          {/* Comparison note */}
          <div className="glass-card rounded-2xl p-4 flex items-start gap-3">
            <Icon name="Info" size={14} className="text-primary shrink-0 mt-0.5" />
            <p className="text-xs text-muted-foreground leading-relaxed">
              Все тарифы включают 14-дневный бесплатный период. Отмена в любой момент без штрафов.
              Корпоративный тариф включает SLA 99,9%, выделенного менеджера и обучение персонала.
              Для агрохолдингов и банков — white-label решение от 500 000 ₽/проект.
            </p>
          </div>
        </div>
      )}

      {/* ── MARKETPLACE ── */}
      {activeTab === "marketplace" && (
        <div className="space-y-5">
          <div className="glass-card rounded-2xl p-5 space-y-4">
            <h2 className="font-heading font-bold text-base text-foreground flex items-center gap-2">
              <Icon name="ShoppingCart" size={15} className="text-primary" />
              Комиссия с торговых сделок
            </h2>
            <p className="text-sm text-muted-foreground">
              При совершении сделки через доску объявлений АгроПорта взимается комиссия в зависимости от объёма партии.
            </p>
            <div className="grid sm:grid-cols-3 gap-3">
              {COMMISSION_RATES.map((r, i) => (
                <div key={i} className="bg-secondary/50 rounded-xl p-4 border border-border">
                  <div className="text-xs text-muted-foreground font-mono mb-1">{r.range}</div>
                  <div className="text-3xl font-heading font-black text-primary mb-2">{r.rate}</div>
                  <div className="text-[11px] text-muted-foreground leading-relaxed">{r.example}</div>
                </div>
              ))}
            </div>
          </div>

          <CommissionCalc />

          <div className="glass-card rounded-2xl p-5 space-y-4">
            <h2 className="font-heading font-bold text-sm text-foreground flex items-center gap-2">
              <Icon name="Star" size={14} className="text-amber-500" />
              Премиум-размещение объявлений
            </h2>
            <div className="grid sm:grid-cols-2 gap-3">
              {[
                { title: "Топ-3 в выдаче", price: "500–5 000", unit: "₽/день", icon: "ArrowUp", desc: "Объявление показывается первым в списке для всех пользователей" },
                { title: "Гарантированная сделка", price: "+0,3%", unit: "к комиссии", icon: "Shield", desc: "Эскроу-счёт: деньги хранятся у нас до подтверждения получения товара" },
              ].map((item, i) => (
                <div key={i} className="flex gap-3 p-4 bg-amber-50 border border-amber-200 rounded-xl">
                  <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center shrink-0">
                    <Icon name={item.icon as "Star"} size={15} className="text-amber-600" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-baseline gap-1 mb-1">
                      <span className="font-heading font-bold text-sm text-foreground">{item.title}</span>
                    </div>
                    <div className="flex items-baseline gap-1 mb-1">
                      <span className="font-mono font-bold text-amber-700">{item.price}</span>
                      <span className="text-xs text-muted-foreground">{item.unit}</span>
                    </div>
                    <p className="text-xs text-muted-foreground">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── REPORTS ── */}
      {activeTab === "reports" && (
        <div className="space-y-5">
          <div className="glass-card rounded-2xl p-5 space-y-4">
            <h2 className="font-heading font-bold text-base text-foreground flex items-center gap-2">
              <Icon name="FileText" size={15} className="text-primary" />
              Эксклюзивные аналитические отчёты
            </h2>
            <div className="grid sm:grid-cols-2 gap-3">
              {PREMIUM_REPORTS.map((r, i) => (
                <div key={i} className="glass-card rounded-xl p-4 flex flex-col gap-3 hover:shadow-md transition-all border border-border">
                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                      <Icon name={r.icon as "FileText"} size={16} className="text-primary" />
                    </div>
                    <div className="flex-1">
                      <p className="font-heading font-bold text-sm text-foreground leading-snug">{r.title}</p>
                      <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{r.desc}</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between pt-1 border-t border-border/50">
                    <span className="font-mono font-black text-lg text-foreground">{r.price.toLocaleString()} ₽</span>
                    <button className="flex items-center gap-1.5 px-3 py-1.5 bg-primary text-white text-xs font-semibold rounded-lg hover:bg-primary/90 transition-colors">
                      <Icon name="ShoppingCart" size={11} />
                      Купить
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="glass-card rounded-2xl p-5 space-y-4">
            <h2 className="font-heading font-bold text-sm text-foreground flex items-center gap-2">
              <Icon name="Calculator" size={14} className="text-primary" />
              Расширенные калькуляторы (подписка)
            </h2>
            <div className="grid sm:grid-cols-3 gap-3">
              {[
                { title: "Оптимизатор севооборота", price: "5 000 ₽/сезон", icon: "RotateCcw", desc: "Подбор оптимальной структуры культур под ваши поля и риски" },
                { title: "Планировщик затрат", price: "3 000 ₽/сезон", icon: "ClipboardList", desc: "Детальный расчёт затрат на сезон по операциям и ресурсам" },
                { title: "История региона (5 лет)", price: "15 000 ₽", icon: "Database", desc: "Цены, урожайность, NDVI и погода по выбранному региону за 5 лет" },
              ].map((item, i) => (
                <div key={i} className="bg-secondary/50 rounded-xl p-4 border border-border flex flex-col gap-2">
                  <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Icon name={item.icon as "Calculator"} size={15} className="text-primary" />
                  </div>
                  <p className="font-heading font-bold text-sm text-foreground">{item.title}</p>
                  <p className="text-xs text-muted-foreground flex-1">{item.desc}</p>
                  <p className="font-mono font-bold text-sm text-primary">{item.price}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── CONSULTATIONS ── */}
      {activeTab === "consultations" && (
        <div className="space-y-5">
          <div className="glass-card rounded-2xl p-5 space-y-4">
            <h2 className="font-heading font-bold text-base text-foreground flex items-center gap-2">
              <Icon name="MessageSquare" size={15} className="text-primary" />
              Экспертные консультации
            </h2>
            <div className="grid sm:grid-cols-3 gap-3">
              {CONSULTATIONS.map((c, i) => (
                <div key={i} className={`rounded-xl p-5 border flex flex-col gap-3 ${c.color}`}>
                  <div className="flex items-center gap-2">
                    <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${c.badge}`}>{c.role}</span>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed flex-1">{c.desc}</p>
                  <div className="flex items-center justify-between border-t border-border/40 pt-3">
                    <div>
                      <span className="font-mono font-black text-xl text-foreground">{c.price.toLocaleString()}</span>
                      <span className="text-xs text-muted-foreground ml-1">₽/час</span>
                    </div>
                    <button className="flex items-center gap-1.5 px-3 py-1.5 bg-primary text-white text-xs font-semibold rounded-lg hover:bg-primary/90 transition-colors">
                      <Icon name="Calendar" size={11} />
                      Записаться
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="glass-card rounded-2xl p-5 space-y-4">
            <h2 className="font-heading font-bold text-sm text-foreground flex items-center gap-2">
              <Icon name="MapPin" size={14} className="text-primary" />
              Аудит полей
            </h2>
            <div className="flex gap-4 flex-col sm:flex-row">
              <div className="flex-1 space-y-2">
                {[
                  "Выезд специалиста на поле",
                  "Анализ NDVI-данных за 3 года",
                  "Отчёт с рекомендациями по агротехнике",
                  "Сравнение с эталонными хозяйствами региона",
                  "Прогноз урожайности по полю",
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-2 text-sm">
                    <Icon name="Check" size={13} className="text-primary shrink-0" />
                    <span className="text-foreground">{item}</span>
                  </div>
                ))}
                <div className="pt-2">
                  <span className="font-mono font-black text-2xl text-foreground">от 15 000</span>
                  <span className="text-sm text-muted-foreground ml-2">₽/поле</span>
                </div>
              </div>
              <div className="sm:w-72">
                <LeadForm
                  title="Заявка на аудит"
                  fields={[
                    { name: "name", label: "Ваше имя", placeholder: "Иван Иванов" },
                    { name: "phone", label: "Телефон", type: "tel", placeholder: "+7 900 000-00-00" },
                    { name: "region", label: "Регион и площадь полей", placeholder: "Самарская обл., 500 га" },
                  ]}
                  submitLabel="Заказать аудит"
                />
              </div>
            </div>
          </div>

          <div className="glass-card rounded-2xl p-5 space-y-4">
            <h2 className="font-heading font-bold text-sm text-foreground flex items-center gap-2">
              <Icon name="GraduationCap" size={14} className="text-primary" />
              Обучение и сертификация
            </h2>
            <div className="grid sm:grid-cols-3 gap-3">
              {[
                { title: "Онлайн-курс «Агроаналитик PRO»", price: "25 000 ₽", icon: "Play", desc: "12 модулей, сертификат, доступ навсегда" },
                { title: "Вебинары с экспертами", price: "3 000–7 000 ₽", icon: "Video", desc: "Еженедельные вебинары по рынку и технологиям" },
                { title: "Корпоративное обучение", price: "от 50 000 ₽", icon: "Users", desc: "Обучение команды хозяйства на базе ваших данных" },
              ].map((item, i) => (
                <div key={i} className="bg-secondary/50 rounded-xl p-4 border border-border flex flex-col gap-2">
                  <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Icon name={item.icon as "Play"} size={15} className="text-primary" />
                  </div>
                  <p className="font-heading font-bold text-sm text-foreground">{item.title}</p>
                  <p className="text-xs text-muted-foreground flex-1">{item.desc}</p>
                  <p className="font-mono font-bold text-sm text-primary">{item.price}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── API ── */}
      {activeTab === "api" && (
        <div className="space-y-5">
          <div className="glass-card rounded-2xl p-5 space-y-4">
            <h2 className="font-heading font-bold text-base text-foreground flex items-center gap-2">
              <Icon name="Code2" size={15} className="text-primary" />
              API-доступ к данным
            </h2>
            <div className="grid sm:grid-cols-2 gap-3">
              {API_PACKAGES.map((pkg, i) => (
                <div key={i} className="glass-card rounded-xl p-4 border border-border hover:shadow-md transition-all flex flex-col gap-3">
                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                      <Icon name={pkg.icon as "Code2"} size={16} className="text-primary" />
                    </div>
                    <div>
                      <p className="font-heading font-bold text-sm text-foreground">{pkg.title}</p>
                      <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{pkg.desc}</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between pt-1 border-t border-border/50">
                    <div>
                      <span className="font-mono font-black text-lg text-foreground">{pkg.price.toLocaleString()}</span>
                      <span className="text-xs text-muted-foreground ml-1">₽/{pkg.unit}</span>
                    </div>
                    <button className="flex items-center gap-1.5 px-3 py-1.5 bg-secondary border border-border text-foreground text-xs font-semibold rounded-lg hover:border-primary/40 transition-colors">
                      <Icon name="ArrowRight" size={11} />
                      Подключить
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="glass-card rounded-2xl p-5 space-y-4">
            <h2 className="font-heading font-bold text-sm text-foreground flex items-center gap-2">
              <Icon name="Plug" size={14} className="text-primary" />
              Интеграция с ERP/CRM
            </h2>
            <div className="grid sm:grid-cols-2 gap-3">
              <div className="flex gap-3 p-4 bg-secondary/50 rounded-xl border border-border">
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  <Icon name="Settings" size={15} className="text-primary" />
                </div>
                <div>
                  <p className="font-heading font-bold text-sm text-foreground">Разовая настройка</p>
                  <p className="text-xs text-muted-foreground mt-0.5">1С, SAP, Битрикс, amoCRM и другие системы</p>
                  <p className="font-mono font-bold text-primary mt-2">50 000 ₽</p>
                </div>
              </div>
              <div className="flex gap-3 p-4 bg-secondary/50 rounded-xl border border-border">
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  <Icon name="RefreshCw" size={15} className="text-primary" />
                </div>
                <div>
                  <p className="font-heading font-bold text-sm text-foreground">Ежемесячное сопровождение</p>
                  <p className="text-xs text-muted-foreground mt-0.5">Обновления, мониторинг, поддержка</p>
                  <p className="font-mono font-bold text-primary mt-2">10 000 ₽/мес</p>
                </div>
              </div>
            </div>

            <LeadForm
              title="Заявка на интеграцию"
              fields={[
                { name: "company", label: "Компания", placeholder: "ООО «АгроХолдинг»" },
                { name: "system", label: "Ваша ERP/CRM система", placeholder: "1С:ERP, SAP, другое" },
                { name: "contact", label: "Контакт", type: "tel", placeholder: "+7 900 000-00-00" },
                { name: "comment", label: "Задача", type: "textarea", placeholder: "Кратко опишите, что нужно интегрировать" },
              ]}
              submitLabel="Отправить заявку"
            />
          </div>
        </div>
      )}
    </div>
  );
}
