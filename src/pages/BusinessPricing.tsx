import Icon from "@/components/ui/icon";
import { PRICING_PLANS } from "./data";

export default function BusinessPricing() {
  return (
    <div className="space-y-6 animate-fade-in">

      {/* ── Публичная ссылка / О сайте ── */}
      <div className="glass-card rounded-2xl overflow-hidden shadow-md">
        <div className="relative h-52 overflow-hidden">
          <img
            src="https://cdn.poehali.dev/projects/31e2ff5d-24f0-43ce-888c-a6833c49513a/files/6afcbe50-6a55-4dde-a0ee-875369234543.jpg"
            alt="АгроПорт — поля пшеницы России, уборка урожая"
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
  );
}