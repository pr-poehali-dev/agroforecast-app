import Icon from "@/components/ui/icon";
import { PREMIUM_REPORTS, CONSULTATIONS } from "@/pages/data";
import { API_PACKAGES, LeadForm } from "./PricingShared";

export function PricingReports() {
  return (
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
  );
}

export function PricingConsultations() {
  return (
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
  );
}

export function PricingApi() {
  return (
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
  );
}
