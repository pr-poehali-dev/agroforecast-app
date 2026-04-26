import { useState } from "react";
import Icon from "@/components/ui/icon";
import { TABS } from "@/components/pricing/PricingShared";
import PricingPlans from "@/components/pricing/PricingPlans";
import PricingMarketplace from "@/components/pricing/PricingMarketplace";
import { PricingReports, PricingConsultations, PricingApi } from "@/components/pricing/PricingReportsConsultationsApi";

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

      {activeTab === "plans" && <PricingPlans billingYear={billingYear} setBillingYear={setBillingYear} />}
      {activeTab === "marketplace" && <PricingMarketplace />}
      {activeTab === "reports" && <PricingReports />}
      {activeTab === "consultations" && <PricingConsultations />}
      {activeTab === "api" && <PricingApi />}
    </div>
  );
}
