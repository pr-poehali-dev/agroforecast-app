import { useEffect, useState, useRef } from "react";
import { adminApi } from "@/lib/adminApi";
import Icon from "@/components/ui/icon";

interface Doc {
  id: number;
  title: string;
  category: string;
  content: string;
  is_published: boolean;
  sort_order: number;
  updated_at: string;
}

const STRATEGY_CONTENT = `### Стратегия развития экосистемы «АгроПорт»

#### Этап 1. Запуск ядра (0–6 месяцев)

**Цель:** создать базовую платформу с ключевыми функциями и привлечь первых пользователей.

**Основные задачи:**
* разработать веб‑интерфейс и мобильное приложение (iOS/Android);
* реализовать модуль прогноза урожайности на основе NDVI и метеоданных;
* создать интерактивную карту с визуализацией NDVI и погодных условий;
* внедрить систему уведомлений (push, email) о критических событиях (заморозки, засуха);
* запустить простой калькулятор рентабельности посевов;
* сформировать базу данных по регионам, культурам, метеостанциям.

**Целевая аудитория:** фермеры и агрономы средних хозяйств в Поволжье.

**Метрики успеха:**
* 1 000+ зарегистрированных пользователей;
* средняя оценка приложения 4,5+ в сторах;
* ежедневная активность 30% пользователей.

**Монетизация:**
* бесплатная базовая версия с ограниченным функционалом;
* пилотные партнёрства с поставщиками удобрений и семян.

---

#### Этап 2. Расширение функционала (6–12 месяцев)

**Цель:** увеличить ценность платформы за счёт интеграции смежных сервисов.

**Новые модули:**
* маркетплейс для торговли сельхозпродукцией (объявления о продаже/покупке зерна, масла, овощей);
* модуль логистики (поиск транспорта, расчёт маршрутов, тарифы перевозчиков);
* интеграция с ERP‑системами (1С, SAP) и учётными программами;
* раздел аналитики и отчётов (динамика цен, баланс спроса/предложения, экспортные тренды);
* библиотека знаний (статьи, вебинары, обучающие курсы по агротехнологиям);
* чат‑бот поддержки с ответами на частые вопросы.

**Партнёрства:**
* с логистическими компаниями;
* с банками и лизинговыми компаниями;
* с поставщиками семян, удобрений, СЗР.

**Метрики успеха:**
* 5 000+ активных пользователей;
* 100+ сделок через маркетплейс ежемесячно;
* интеграция с 3+ ERP‑системами;
* запуск премиум‑тарифа PRO (4 990 руб./мес).

**Монетизация:**
* подписка PRO (4 990 руб./мес или 49 900 руб./год);
* комиссия 0,5–2% с сделок на маркетплейсе;
* таргетированная реклама для партнёров.

---

#### Этап 3. Развитие ИИ и Big Data (12–24 месяца)

**Цель:** повысить точность прогнозов и персонализировать рекомендации за счёт внедрения ИИ.

**Ключевые разработки:**
* улучшение моделей прогнозирования урожайности и цен (Transformer, LSTM + XGBoost);
* предиктивная диагностика болезней растений по снимкам;
* цифровые двойники полей;
* планировщик севооборота;
* API для разработчиков.

**Метрики успеха:**
* точность прогнозов урожайности MAPE < 10%;
* точность прогнозов цен MAPE < 7%;
* 20+ приложений через API;
* корпоративный тариф с white‑label.

**Монетизация:**
* корпоративный тариф (индивидуальное ценообразование);
* платный API‑доступ к данным;
* white‑label решения для агрохолдингов (от 500 000 руб./проект).

---

#### Этап 4. Масштабирование (24+ месяцев)

**Цель:** выход на новые регионы и рынки, превращение в федеральную/международную платформу.

**Действия:**
* покрытие всей территории РФ;
* локализация для СНГ (Казахстан, Беларусь) и Восточной Европы;
* модули точного земледелия;
* блокчейн для прозрачности цепочек поставок;
* программа лояльности;
* образовательные программы.

**Метрики успеха:**
* 50 000+ активных пользователей по РФ;
* выход на 2+ зарубежных рынка;
* 10% рынка цифровой агроаналитики в РФ;
* 30+ партнёров в программе лояльности.

**Монетизация:**
* международные подписки;
* партнёрские отчисления 5–15%;
* экспертные консультации от 15 000 руб./поле;
* эксклюзивные отчёты от 5 000 до 10 000 руб.

---

### Ключевые принципы

1. Открытость: API для интеграции с внешними сервисами.
2. Безопасность: шифрование, 2FA, ФЗ‑152 и GDPR.
3. Ценность для всех: фермеры, трейдеры, переработчики, инвесторы, партнёры.
4. Непрерывное обучение: регулярное обновление моделей ИИ.
5. Омниканальность: веб, мобайл, Telegram‑бот, голосовые ассистенты.
6. Прозрачность алгоритмов.
7. Постепенное вовлечение: free → PRO → корпоративные решения.

---

### Источники финансирования

* Гранты Минсельхоза и Минцифры;
* Подписки PRO и корпоративные тарифы;
* Комиссия с маркетплейса;
* Плата за API‑доступ;
* Реклама партнёров.`;

function renderMarkdown(text: string) {
  return text
    .split("\n")
    .map((line, i) => {
      if (line.startsWith("#### ")) return <h4 key={i} className="font-heading font-bold text-base mt-6 mb-2 text-foreground">{line.slice(5)}</h4>;
      if (line.startsWith("### ")) return <h3 key={i} className="font-heading font-black text-lg mt-8 mb-3 text-foreground">{line.slice(4)}</h3>;
      if (line.startsWith("---")) return <hr key={i} className="my-4 border-border" />;
      if (line.startsWith("**") && line.endsWith("**")) return <p key={i} className="font-semibold text-sm mt-3 mb-1">{line.slice(2, -2)}</p>;
      if (line.startsWith("* ")) return <li key={i} className="text-sm text-muted-foreground ml-4 list-disc">{line.slice(2).replace(/\*\*(.*?)\*\*/g, "$1")}</li>;
      if (/^\d+\./.test(line)) return <li key={i} className="text-sm text-muted-foreground ml-4 list-decimal">{line.replace(/^\d+\.\s/, "")}</li>;
      if (line.trim() === "") return <div key={i} className="h-1" />;
      return <p key={i} className="text-sm text-muted-foreground">{line}</p>;
    });
}

export default function AdminStrategy() {
  const [docs, setDocs] = useState<Doc[]>([]);
  const [selected, setSelected] = useState<Doc | null>(null);
  const [editing, setEditing] = useState(false);
  const [editContent, setEditContent] = useState("");
  const [editTitle, setEditTitle] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const initialized = useRef(false);

  const load = async () => {
    setLoading(true);
    try {
      const d = await adminApi.getDocuments();
      setDocs(d.items || []);
      if (d.items?.length > 0 && !selected) setSelected(d.items[0]);
    } catch {
      setDocs([]);
    } finally {
      setLoading(false);
    }
  };

  const initStrategy = async () => {
    if (initialized.current) return;
    initialized.current = true;
    try {
      const d = await adminApi.getDocuments();
      if ((d.items || []).length === 0) {
        await adminApi.createDocument({
          title: "Стратегия развития экосистемы «АгроПорт»",
          category: "strategy",
          content: STRATEGY_CONTENT,
          sort_order: 1,
        });
        load();
      } else {
        setDocs(d.items);
        setSelected(d.items[0]);
        setLoading(false);
      }
    } catch {
      setLoading(false);
    }
  };

  useEffect(() => { initStrategy(); }, []);

  const startEdit = (doc: Doc) => {
    setEditTitle(doc.title);
    setEditContent(doc.content);
    setEditing(true);
  };

  const saveEdit = async () => {
    if (!selected) return;
    setSaving(true);
    try {
      await adminApi.updateDocument(selected.id, { title: editTitle, content: editContent });
      await load();
      setEditing(false);
    } finally {
      setSaving(false);
    }
  };

  const createDoc = async (title: string, category: string) => {
    await adminApi.createDocument({ title, category, content: "", sort_order: docs.length + 1 });
    await load();
    setShowCreate(false);
  };

  const deleteDoc = async (id: number) => {
    if (!confirm("Удалить документ?")) return;
    await adminApi.deleteDocument(id);
    setSelected(null);
    await load();
  };

  const CATEGORY_LABELS: Record<string, string> = {
    strategy: "Стратегия",
    plan: "План",
    report: "Отчёт",
    general: "Общее",
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-heading font-bold text-lg">Документы проекта</h2>
          <p className="text-xs text-muted-foreground mt-1">Стратегия, планы и материалы АгроПорт</p>
        </div>
        <button onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 px-4 py-2 hero-gradient text-white text-sm font-semibold rounded-xl">
          <Icon name="Plus" size={15} />
          Добавить
        </button>
      </div>

      {showCreate && (
        <CreateDocModal onClose={() => setShowCreate(false)} onCreate={createDoc} />
      )}

      <div className="flex gap-4 h-[calc(100vh-200px)]">
        <div className="w-56 shrink-0 space-y-1 overflow-y-auto">
          {loading ? (
            <div className="flex justify-center pt-8"><Icon name="Loader" size={20} className="animate-spin text-primary" /></div>
          ) : docs.map(doc => (
            <button key={doc.id} onClick={() => { setSelected(doc); setEditing(false); }}
              className={`w-full text-left px-3 py-2.5 rounded-xl text-sm transition-all ${selected?.id === doc.id ? "bg-primary text-white" : "hover:bg-secondary text-foreground"}`}>
              <p className="font-medium truncate">{doc.title}</p>
              <p className={`text-[10px] mt-0.5 ${selected?.id === doc.id ? "text-white/70" : "text-muted-foreground"}`}>
                {CATEGORY_LABELS[doc.category] || doc.category}
              </p>
            </button>
          ))}
        </div>

        <div className="flex-1 glass-card rounded-2xl overflow-hidden flex flex-col">
          {!selected ? (
            <div className="flex-1 flex items-center justify-center text-muted-foreground text-sm">
              Выберите документ
            </div>
          ) : editing ? (
            <div className="flex flex-col h-full p-4 gap-3">
              <input value={editTitle} onChange={e => setEditTitle(e.target.value)}
                className="px-3 py-2 border border-border rounded-xl text-sm font-semibold bg-background focus:outline-none focus:border-primary" />
              <textarea value={editContent} onChange={e => setEditContent(e.target.value)}
                className="flex-1 px-3 py-2 border border-border rounded-xl text-sm bg-background focus:outline-none focus:border-primary resize-none font-mono text-xs" />
              <div className="flex gap-2">
                <button onClick={saveEdit} disabled={saving}
                  className="flex items-center gap-2 px-4 py-2 hero-gradient text-white text-sm font-semibold rounded-xl disabled:opacity-60">
                  {saving ? <Icon name="Loader" size={14} className="animate-spin" /> : <Icon name="Save" size={14} />}
                  Сохранить
                </button>
                <button onClick={() => setEditing(false)}
                  className="px-4 py-2 border border-border text-sm rounded-xl hover:bg-secondary">
                  Отмена
                </button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col h-full">
              <div className="flex items-center justify-between px-5 py-3 border-b border-border">
                <div>
                  <p className="font-heading font-bold text-sm">{selected.title}</p>
                  <p className="text-[10px] text-muted-foreground">{CATEGORY_LABELS[selected.category]} · обновлён {new Date(selected.updated_at).toLocaleDateString("ru")}</p>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => startEdit(selected)}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs border border-border rounded-lg hover:bg-secondary">
                    <Icon name="Pencil" size={12} /> Редактировать
                  </button>
                  <button onClick={() => deleteDoc(selected.id)}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs border border-destructive/30 text-destructive rounded-lg hover:bg-destructive/10">
                    <Icon name="Trash2" size={12} /> Удалить
                  </button>
                </div>
              </div>
              <div className="flex-1 overflow-y-auto p-5">
                {selected.content ? (
                  <div className="prose-sm">{renderMarkdown(selected.content)}</div>
                ) : (
                  <p className="text-muted-foreground text-sm">Документ пустой. Нажмите «Редактировать» чтобы добавить содержимое.</p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function CreateDocModal({ onClose, onCreate }: { onClose: () => void; onCreate: (title: string, category: string) => void }) {
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("general");

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-background rounded-2xl p-6 w-full max-w-sm space-y-4 shadow-xl">
        <h3 className="font-heading font-bold text-base">Новый документ</h3>
        <div>
          <label className="text-xs text-muted-foreground mb-1 block">Название</label>
          <input value={title} onChange={e => setTitle(e.target.value)}
            className="w-full px-3 py-2 border border-border rounded-xl text-sm bg-background focus:outline-none focus:border-primary" />
        </div>
        <div>
          <label className="text-xs text-muted-foreground mb-1 block">Категория</label>
          <select value={category} onChange={e => setCategory(e.target.value)}
            className="w-full px-3 py-2 border border-border rounded-xl text-sm bg-background focus:outline-none">
            <option value="strategy">Стратегия</option>
            <option value="plan">План</option>
            <option value="report">Отчёт</option>
            <option value="general">Общее</option>
          </select>
        </div>
        <div className="flex gap-2">
          <button onClick={() => title && onCreate(title, category)}
            className="flex-1 py-2 hero-gradient text-white text-sm font-semibold rounded-xl">
            Создать
          </button>
          <button onClick={onClose} className="flex-1 py-2 border border-border text-sm rounded-xl hover:bg-secondary">
            Отмена
          </button>
        </div>
      </div>
    </div>
  );
}
