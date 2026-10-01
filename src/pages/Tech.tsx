import { useEffect, useState } from "react";
import Icon from "@/components/ui/icon";
import ValidatedForecast from "@/components/ValidatedForecast";
import { ModelSummary, fetchModelSummary, fmtPeriod } from "@/lib/priceModel";

const STATUS = {
  done: { label: "Работает", cls: "bg-primary/15 text-primary" },
  partial: { label: "Частично", cls: "bg-amber-100 text-amber-700" },
  dev: { label: "В разработке", cls: "bg-secondary text-muted-foreground" },
} as const;

const MODULES: { name: string; status: keyof typeof STATUS; desc: string }[] = [
  { name: "Прогноз цен производителей (пшеница, кукуруза, подсолнечник)", status: "done", desc: "Модель на открытых рядах Росстата, Всемирного банка и курса ЦБ. Проверка на истории скользящим окном, метрики публикуются на этой странице." },
  { name: "Сбор котировок с отраслевых сайтов", status: "partial", desc: "Опрос четырёх источников, собранные цены сохраняются в базу для будущего обучения. Часть источников сейчас не отдаёт цены в разбираемом виде." },
  { name: "Лента новостей АПК", status: "done", desc: "Сбор из открытых RSS-лент, накопление в базе с дедупликацией." },
  { name: "База сельхозпроизводителей и CRM", status: "done", desc: "Карточки хозяйств, поиск, рейтинг перспективности, обогащение по ЕГРЮЛ, история контактов." },
  { name: "Маркетплейс объявлений", status: "partial", desc: "Публикация, модерация и фильтры объявлений. Сделки и оплата внутри платформы не реализованы." },
  { name: "NDVI-мониторинг по снимкам Sentinel-2", status: "dev", desc: "Сейчас показан демонстрационный модуль. План: расчёт NDVI по контуру поля через Copernicus Data Space." },
  { name: "Прогноз урожайности", status: "dev", desc: "Есть история урожайности по регионам 2019–2024; регрессия по погоде и NDVI — в плане работ." },
];

const ARCH = [
  { icon: "Database", title: "Данные", items: ["Росстат: средние цены производителей, помесячно с 2008 г.", "Всемирный банк: мировые цены (Pink Sheet)", "Банк России: курс USD/RUB", "Отраслевые сайты и RSS: котировки и новости"] },
  { icon: "Cpu", title: "Модель", items: ["Цель: относительное изменение цены за h месяцев", "Признаки: импульс цены, мировая цена в рублях, отклонение от экспортного паритета, сезонность", "Гребневая регрессия; степень доверия к сигналу подбирается на валидации", "80% интервал — по распределению ошибок на истории"] },
  { icon: "ShieldCheck", title: "Проверка", items: ["Подбор параметров: 2012–2019", "Оценка: 2020 – последние данные, скользящим окном", "На каждом шаге модель видит только прошлое", "Сравнение с ориентиром «цена не изменится»"] },
  { icon: "Server", title: "Инфраструктура", items: ["Веб-приложение: React + TypeScript", "Серверные функции на Python 3.11", "PostgreSQL: ряды, метрики, история котировок", "Пересчёт метрик — по запросу, результаты версионируются в базе"] },
];

const ROADMAP = [
  { stage: "Этап 1", title: "Проверяемый прогноз цен", items: ["Открытые ряды и честные метрики", "Публичная страница методики"], done: true },
  { stage: "Этап 2", title: "Расширение модели", items: ["Региональные ряды цен", "Экспортные цены и пошлины как факторы", "Сравнение с SARIMA и градиентным бустингом"] },
  { stage: "Этап 3", title: "Спутниковый мониторинг", items: ["NDVI по контуру поля (Sentinel-2)", "Оценка состояния посевов в сезоне"] },
  { stage: "Этап 4", title: "Прогноз урожайности", items: ["Модель по погоде и NDVI", "Связка урожайности и цены в одном прогнозе"] },
];

export default function Tech() {
  const [data, setData] = useState<ModelSummary | null>(null);
  useEffect(() => {
    document.title = "Технология и метрики модели | АгроПорт";
    fetchModelSummary().then(setData).catch(() => {});
  }, []);

  const rows = data?.crops.flatMap(c => c.horizons.map(h => ({ crop: c.name, ...h }))) ?? [];

  return (
    <div className="min-h-screen bg-background font-body">
      <header className="border-b border-border bg-white/80 backdrop-blur sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-5 py-3 flex items-center justify-between">
          <a href="/" className="font-heading font-black text-lg text-foreground">Агро<span className="text-primary">Порт</span></a>
          <nav className="flex items-center gap-4 text-sm">
            <a href="#metrics" className="text-muted-foreground hover:text-foreground">Метрики</a>
            <a href="#arch" className="text-muted-foreground hover:text-foreground">Архитектура</a>
            <a href="#roadmap" className="text-muted-foreground hover:text-foreground">Дорожная карта</a>
            <a href="/" className="px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-semibold">На платформу</a>
          </nav>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-5 py-8 space-y-12">
        <section className="hero-gradient rounded-2xl p-7 sm:p-10 relative overflow-hidden">
          <div className="hero-gradient-overlay absolute inset-0" />
          <div className="relative max-w-3xl">
            <div className="text-white/70 text-xs font-mono uppercase tracking-widest mb-3">Для экспертов · технология</div>
            <h1 className="font-heading font-black text-3xl sm:text-4xl text-white leading-tight">
              Прогноз цен на зерно и масличные <span className="gold-text">с открытой проверкой точности</span>
            </h1>
            <p className="text-white/75 mt-4 text-base leading-relaxed">
              На этой странице — что именно делает модель, на каких данных она обучена, как проверена и с какой ошибкой работает.
              Все цифры ниже рассчитываются сервером из открытых данных, а не вписаны вручную.
            </p>
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="font-heading font-bold text-2xl text-foreground">Задача</h2>
          <div className="grid md:grid-cols-3 gap-4">
            {[
              { icon: "HelpCircle", t: "Проблема", d: "Сельхозпроизводителю нужно решить, когда продавать урожай. Решение принимается по интуиции и разрозненным новостям; ошибка в сроке продажи стоит процентов выручки." },
              { icon: "Target", t: "Что делаем", d: "Прогнозируем цену производителя на 1, 3 и 6 месяцев с интервалом неопределённости и показываем, насколько модель точнее простого ориентира." },
              { icon: "Scale", t: "Почему этому можно верить", d: "Модель проверена на 2020–2026 годах, которые она не видела при настройке. Если на каком-то горизонте она не лучше ориентира — мы это показываем." },
            ].map(x => (
              <div key={x.t} className="glass-card rounded-2xl p-5">
                <Icon name={x.icon} size={20} className="text-primary mb-2" />
                <div className="font-heading font-bold text-foreground mb-1">{x.t}</div>
                <p className="text-sm text-muted-foreground leading-relaxed">{x.d}</p>
              </div>
            ))}
          </div>
        </section>

        <section id="metrics" className="space-y-4 scroll-mt-20">
          <h2 className="font-heading font-bold text-2xl text-foreground">Метрики модели</h2>
          <p className="text-sm text-muted-foreground max-w-3xl">
            MAPE — средняя абсолютная ошибка прогноза в процентах. Улучшение — насколько ошибка модели ниже ошибки ориентира «цена не изменится».
            Направление — доля случаев, когда модель верно угадала рост или падение.
          </p>
          <div className="glass-card rounded-2xl overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-secondary/50">
                <tr>
                  {["Культура", "Горизонт", "MAPE модели", "MAPE ориентира", "Улучшение", "Направление", "Прогнозов", "Период проверки"].map(h => (
                    <th key={h} className="text-left text-[11px] uppercase tracking-wide text-muted-foreground font-semibold px-4 py-3">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.length === 0 && (
                  <tr><td colSpan={8} className="px-4 py-6 text-center text-muted-foreground">Загрузка метрик…</td></tr>
                )}
                {rows.map((r, i) => (
                  <tr key={i} className="border-t border-border">
                    <td className="px-4 py-2.5 font-medium text-foreground">{r.crop}</td>
                    <td className="px-4 py-2.5">{r.h} мес</td>
                    <td className="px-4 py-2.5 font-mono font-semibold">{r.mape ?? "—"}%</td>
                    <td className="px-4 py-2.5 font-mono text-muted-foreground">{r.mape_naive ?? "—"}%</td>
                    <td className={`px-4 py-2.5 font-mono font-semibold ${(r.skill_pct ?? 0) > 0 ? "text-primary" : (r.skill_pct ?? 0) < 0 ? "text-destructive" : "text-muted-foreground"}`}>
                      {r.skill_pct === null || r.skill_pct === undefined ? "—" : `${r.skill_pct > 0 ? "+" : ""}${r.skill_pct}%`}
                    </td>
                    <td className="px-4 py-2.5 font-mono">{r.dir_accuracy_pct != null ? `${r.dir_accuracy_pct}%` : "—"}</td>
                    <td className="px-4 py-2.5 font-mono">{r.n ?? "—"}</td>
                    <td className="px-4 py-2.5 text-muted-foreground">{fmtPeriod(r.test_from)} – {fmtPeriod(r.test_to)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="glass-card rounded-2xl p-5 text-sm text-muted-foreground leading-relaxed space-y-2">
            <div className="font-heading font-bold text-foreground">Как читать результат</div>
            <p>На момент последнего пересчёта модель точнее ориентира по подсолнечнику на 1 и 3 месяца и чаще угадывает направление движения цены. По пшенице на 1 месяц — на уровне ориентира. На горизонте 6 месяцев по пшенице и на коротких горизонтах по кукурузе модель пока не лучше ориентира. Наша рабочая гипотеза — в периоде проверки на внутренние цены сильно влияли экспортные пошлины и квоты, которых в модели ещё нет; её проверка — главный предмет следующего этапа. Таблица выше пересчитывается сервером, этот комментарий относится к результатам на октябрь 2026.</p>
          </div>
          <ValidatedForecast />
        </section>

        <section className="space-y-4">
          <h2 className="font-heading font-bold text-2xl text-foreground">Что работает сейчас</h2>
          <div className="grid md:grid-cols-2 gap-3">
            {MODULES.map(m => (
              <div key={m.name} className="glass-card rounded-xl p-4">
                <div className="flex items-start justify-between gap-3 mb-1">
                  <div className="font-semibold text-sm text-foreground">{m.name}</div>
                  <span className={`shrink-0 px-2 py-0.5 rounded-full text-[10px] font-semibold ${STATUS[m.status].cls}`}>{STATUS[m.status].label}</span>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">{m.desc}</p>
              </div>
            ))}
          </div>
        </section>

        <section id="arch" className="space-y-4 scroll-mt-20">
          <h2 className="font-heading font-bold text-2xl text-foreground">Архитектура</h2>
          <div className="grid md:grid-cols-4 gap-3">
            {ARCH.map((a, i) => (
              <div key={a.title} className="glass-card rounded-2xl p-5 relative">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center"><Icon name={a.icon} size={16} className="text-primary" /></div>
                  <div className="font-heading font-bold text-foreground">{a.title}</div>
                </div>
                <ul className="space-y-1.5">
                  {a.items.map(it => <li key={it} className="text-xs text-muted-foreground leading-relaxed flex gap-1.5"><span className="text-primary">•</span>{it}</li>)}
                </ul>
                {i < ARCH.length - 1 && <Icon name="ChevronRight" size={18} className="hidden md:block absolute -right-3 top-1/2 -translate-y-1/2 text-muted-foreground/50" />}
              </div>
            ))}
          </div>
          {data && (
            <div className="text-xs text-muted-foreground">
              <b className="text-foreground">Источники данных:</b> {data.sources.join(" · ")}
            </div>
          )}
        </section>

        <section id="roadmap" className="space-y-4 scroll-mt-20">
          <h2 className="font-heading font-bold text-2xl text-foreground">Дорожная карта</h2>
          <div className="grid md:grid-cols-4 gap-3">
            {ROADMAP.map(r => (
              <div key={r.stage} className={`rounded-2xl p-5 border ${r.done ? "border-primary bg-primary/5" : "border-border bg-white"}`}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[11px] font-mono uppercase text-muted-foreground">{r.stage}</span>
                  {r.done && <span className="text-[10px] font-semibold text-primary flex items-center gap-1"><Icon name="Check" size={11} />выполнено</span>}
                </div>
                <div className="font-heading font-bold text-foreground mb-2">{r.title}</div>
                <ul className="space-y-1">
                  {r.items.map(it => <li key={it} className="text-xs text-muted-foreground">— {it}</li>)}
                </ul>
              </div>
            ))}
          </div>
          <p className="text-xs text-muted-foreground">Сроки этапов будут указаны после утверждения плана R&D.</p>
        </section>

        <section className="space-y-4">
          <h2 className="font-heading font-bold text-2xl text-foreground">Команда</h2>
          <div className="glass-card rounded-2xl p-6 text-sm text-muted-foreground flex items-center gap-3">
            <Icon name="Users" size={20} className="text-primary shrink-0" />
            Раздел будет заполнен сведениями о команде проекта.
          </div>
        </section>
      </main>

      <footer className="border-t border-border py-6 text-center text-xs text-muted-foreground">
        АгроПорт · agroport-ai.ru · методика и метрики модели
      </footer>
    </div>
  );
}