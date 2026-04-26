import { useState } from "react";
import Icon from "@/components/ui/icon";

export const TABS = [
  { id: "plans", label: "Тарифы", icon: "CreditCard" },
  { id: "marketplace", label: "Маркетплейс", icon: "ShoppingCart" },
  { id: "reports", label: "Отчёты и данные", icon: "FileText" },
  { id: "consultations", label: "Консультации", icon: "MessageSquare" },
  { id: "api", label: "API и интеграции", icon: "Code2" },
];

export const COMMISSION_RATES = [
  { range: "до 100 т", rate: "2%", example: "Партия 80 т × 13 500 ₽ → комиссия ~21 600 ₽" },
  { range: "100–1 000 т", rate: "1%", example: "Партия 500 т × 13 500 ₽ → комиссия ~67 500 ₽" },
  { range: "свыше 1 000 т", rate: "0,5%", example: "Партия 2 000 т × 13 500 ₽ → комиссия ~135 000 ₽" },
];

export const API_PACKAGES = [
  { title: "NDVI и метеоданные", price: 10_000, unit: "регион/мес", icon: "Satellite", desc: "Спутниковые NDVI-индексы Sentinel-2, метеоданные Росгидромета" },
  { title: "Прогнозы урожайности", price: 15_000, unit: "культура/мес", icon: "TrendingUp", desc: "Модели ARIMA+LSTM, горизонт до 12 месяцев, 87% точность" },
  { title: "Аналитика цен", price: 12_000, unit: "культура/мес", icon: "BarChart3", desc: "Котировки НТБ/CBOT, биржевые данные, исторические ряды" },
  { title: "White-label платформа", price: 500_000, unit: "проект", icon: "Layers", desc: "Кастомизированная платформа АгроПорт под брендом клиента" },
];

export function CommissionCalc() {
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

export function LeadForm({ title, fields, submitLabel = "Отправить заявку" }: {
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
