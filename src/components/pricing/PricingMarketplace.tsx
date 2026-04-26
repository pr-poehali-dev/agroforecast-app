import Icon from "@/components/ui/icon";
import { COMMISSION_RATES, CommissionCalc } from "./PricingShared";

export default function PricingMarketplace() {
  return (
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
  );
}
