import { useState } from "react";
import Icon from "@/components/ui/icon";
import { PARTNER_CATEGORIES } from "./data";

const AD_PLACEMENTS = [
  { title: "Главная страница", price: "20 000", unit: "₽/мес", icon: "LayoutDashboard", reach: "~15 000 показов/день", desc: "Баннер 728×90 в верхней части дашборда" },
  { title: "Карточка рейса / поля", price: "15 000", unit: "₽/мес", icon: "MapPin", reach: "~8 000 показов/день", desc: "Баннер 300×250 в боковой панели" },
  { title: "Push-уведомления", price: "5 000", unit: "за 10 000 показов", icon: "Bell", reach: "Прямая доставка", desc: "Спонсорское уведомление в ленте алертов" },
];

const PARTNER_BENEFITS = [
  { icon: "Users", text: "Аудитория 50 000+ фермеров, трейдеров и агроменеджеров" },
  { icon: "Target", text: "Таргетинг по региону, культуре, типу хозяйства и размеру поля" },
  { icon: "BarChart3", text: "Детальная аналитика: CTR, охват, конверсии по кампании" },
  { icon: "Star", text: "Раздел «Рекомендовано АгроПортом» — доверие аудитории" },
  { icon: "RefreshCw", text: "Ежемесячные отчисления 5–15% с продаж через платформу" },
  { icon: "Handshake", text: "Совместные email-рассылки и вебинары с базой пользователей" },
];

function PartnerForm() {
  const [category, setCategory] = useState("");
  const [company, setCompany] = useState("");
  const [contact, setContact] = useState("");
  const [comment, setComment] = useState("");
  const [sent, setSent] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSent(true);
    setTimeout(() => setSent(false), 4000);
    setCompany(""); setContact(""); setComment(""); setCategory("");
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
      <div>
        <label className="text-xs text-muted-foreground mb-1.5 block font-medium">Категория партнёрства</label>
        <select
          required value={category} onChange={e => setCategory(e.target.value)}
          className="w-full text-sm bg-secondary border border-border rounded-lg px-3 py-2 text-foreground focus:outline-none focus:border-primary/50 transition"
        >
          <option value="">Выберите категорию</option>
          {PARTNER_CATEGORIES.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
          <option value="ads">Размещение рекламы</option>
          <option value="other">Другое</option>
        </select>
      </div>
      <div>
        <label className="text-xs text-muted-foreground mb-1.5 block font-medium">Компания</label>
        <input required type="text" value={company} onChange={e => setCompany(e.target.value)}
          placeholder="ООО «АгроТех»"
          className="w-full text-sm bg-secondary border border-border rounded-lg px-3 py-2 text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary/50 transition" />
      </div>
      <div>
        <label className="text-xs text-muted-foreground mb-1.5 block font-medium">Телефон или email</label>
        <input required type="text" value={contact} onChange={e => setContact(e.target.value)}
          placeholder="+7 900 000-00-00 или partners@company.ru"
          className="w-full text-sm bg-secondary border border-border rounded-lg px-3 py-2 text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary/50 transition" />
      </div>
      <div>
        <label className="text-xs text-muted-foreground mb-1.5 block font-medium">Краткое описание предложения</label>
        <textarea rows={3} value={comment} onChange={e => setComment(e.target.value)}
          placeholder="Расскажите о вашем продукте или услуге и чего вы ожидаете от партнёрства"
          className="w-full text-sm bg-secondary border border-border rounded-lg px-3 py-2 text-foreground placeholder:text-muted-foreground/50 resize-none focus:outline-none focus:border-primary/50 transition" />
      </div>
      <button type="submit"
        className="w-full flex items-center justify-center gap-2 px-5 py-2.5 bg-primary text-white text-sm font-semibold rounded-xl hover:bg-primary/90 transition-colors">
        <Icon name="Send" size={14} />
        Отправить заявку
      </button>
    </form>
  );
}

export default function SectionPartners() {
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  return (
    <div className="space-y-5 animate-fade-in">

      {/* Hero */}
      <div className="hero-gradient rounded-2xl p-5 sm:p-7 relative overflow-hidden shadow-md">
        <div className="hero-gradient-overlay absolute inset-0" />
        <div className="bg-dots absolute inset-0 opacity-15" />
        <div className="relative">
          <div className="flex items-center gap-2 mb-1.5">
            <Icon name="Handshake" size={13} className="text-white/70" />
            <span className="text-white/55 text-xs font-mono uppercase tracking-widest">АгроПорт · Партнёрская программа</span>
          </div>
          <h1 className="font-heading font-black text-2xl sm:text-3xl text-white leading-tight">
            Партнёры и <span className="gold-text">рекламодатели</span>
          </h1>
          <p className="text-white/60 text-sm mt-1 font-body">
            50 000+ фермеров и агробизнесменов — ваша целевая аудитория на одной платформе
          </p>
        </div>
      </div>

      {/* Преимущества */}
      <div className="glass-card rounded-2xl p-5 space-y-4">
        <h2 className="font-heading font-bold text-sm text-foreground flex items-center gap-2">
          <Icon name="Star" size={14} className="text-primary" />
          Почему стоит стать партнёром
        </h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {PARTNER_BENEFITS.map((b, i) => (
            <div key={i} className="flex items-start gap-3 p-3 bg-secondary/50 rounded-xl border border-border">
              <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                <Icon name={b.icon as "Users"} size={13} className="text-primary" />
              </div>
              <p className="text-xs text-foreground leading-relaxed">{b.text}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Категории партнёров */}
      <div className="glass-card rounded-2xl p-5 space-y-4">
        <h2 className="font-heading font-bold text-sm text-foreground flex items-center gap-2">
          <Icon name="Layers" size={14} className="text-primary" />
          Категории партнёров
        </h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {PARTNER_CATEGORIES.map(c => (
            <button
              key={c.id}
              onClick={() => setActiveCategory(activeCategory === c.id ? null : c.id)}
              className={`text-left p-4 rounded-xl border transition-all flex flex-col gap-2 ${
                activeCategory === c.id
                  ? "bg-primary/8 border-primary/30 shadow-sm"
                  : "bg-secondary/50 border-border hover:border-primary/20"
              }`}
            >
              <div className="flex items-center gap-2">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${activeCategory === c.id ? "bg-primary/15" : "bg-secondary"}`}>
                  <Icon name={c.icon as "Sprout"} size={15} className={activeCategory === c.id ? "text-primary" : "text-muted-foreground"} />
                </div>
                <span className="font-heading font-bold text-sm text-foreground">{c.label}</span>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">{c.desc}</p>
              {activeCategory === c.id && (
                <div className="flex items-center gap-1 text-xs text-primary font-medium mt-1">
                  <Icon name="ArrowDown" size={11} />
                  Выбрано — заполните форму ниже
                </div>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Рекламные размещения */}
      <div className="glass-card rounded-2xl p-5 space-y-4">
        <h2 className="font-heading font-bold text-sm text-foreground flex items-center gap-2">
          <Icon name="Megaphone" size={14} className="text-primary" />
          Рекламные размещения
        </h2>
        <div className="grid sm:grid-cols-3 gap-3">
          {AD_PLACEMENTS.map((ad, i) => (
            <div key={i} className="bg-secondary/50 rounded-xl p-4 border border-border flex flex-col gap-3 hover:shadow-md transition-all">
              <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
                <Icon name={ad.icon as "LayoutDashboard"} size={16} className="text-primary" />
              </div>
              <div>
                <p className="font-heading font-bold text-sm text-foreground">{ad.title}</p>
                <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{ad.desc}</p>
              </div>
              <div className="flex items-baseline gap-1 mt-auto">
                <span className="font-mono font-black text-lg text-foreground">{ad.price}</span>
                <span className="text-xs text-muted-foreground">{ad.unit}</span>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-emerald-600 font-medium">
                <Icon name="TrendingUp" size={11} />
                {ad.reach}
              </div>
            </div>
          ))}
        </div>
        <div className="rounded-xl bg-secondary/40 border border-border p-3 flex items-start gap-2">
          <Icon name="Info" size={13} className="text-muted-foreground shrink-0 mt-0.5" />
          <p className="text-[11px] text-muted-foreground leading-relaxed">
            Спецпредложения размещаются в разделе «Рекомендовано АгроПортом».
            Партнёрские отчисления: 5–15% с продаж через реферальные ссылки платформы.
          </p>
        </div>
      </div>

      {/* Форма заявки */}
      <div className="glass-card rounded-2xl p-5 border-2 border-primary/15">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center">
            <Icon name="Send" size={14} className="text-primary" />
          </div>
          <h2 className="font-heading font-bold text-sm text-foreground">Заявка на партнёрство</h2>
        </div>
        <PartnerForm />
      </div>
    </div>
  );
}
