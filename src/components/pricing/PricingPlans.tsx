import Icon from "@/components/ui/icon";
import { PRICING_PLANS } from "@/pages/data";

interface Props {
  billingYear: boolean;
  setBillingYear: (v: boolean | ((prev: boolean) => boolean)) => void;
}

export default function PricingPlans({ billingYear, setBillingYear }: Props) {
  return (
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
  );
}
