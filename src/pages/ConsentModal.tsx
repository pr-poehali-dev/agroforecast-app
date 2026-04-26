import { useState } from "react";
import Icon from "@/components/ui/icon";

interface ConsentModalProps {
  onAccept: () => void;
}

const CONSENTS = [
  {
    id: "terms",
    required: true,
    label: (onNav: () => void) => (
      <span>
        Я ознакомился(-ась) и принимаю{" "}
        <button onClick={onNav} className="text-primary underline hover:no-underline font-medium">
          Правила пользования платформой АгроПорт
        </button>
      </span>
    ),
  },
  {
    id: "loyalty",
    required: true,
    label: (onNav: () => void) => (
      <span>
        Я принимаю{" "}
        <button onClick={onNav} className="text-primary underline hover:no-underline font-medium">
          Правила программы лояльности «АгроБаллы»
        </button>
        , в том числе условие: 1 АгроБалл = 1 рубль, оплата баллами — не более 50% стоимости услуги, использование только на услугах АгроПорт
      </span>
    ),
  },
  {
    id: "privacy",
    required: true,
    label: (onNav: () => void) => (
      <span>
        Я даю согласие на обработку моих персональных данных в соответствии с{" "}
        <button onClick={onNav} className="text-primary underline hover:no-underline font-medium">
          Политикой обработки персональных данных
        </button>{" "}
        (152-ФЗ) в целях исполнения договора
      </span>
    ),
  },
  {
    id: "marketing",
    required: false,
    label: (_onNav: () => void) => (
      <span>
        Я согласен(-на) на получение маркетинговых и информационных сообщений от АгроПорт (необязательно)
      </span>
    ),
  },
];

export default function ConsentModal({ onAccept }: ConsentModalProps) {
  const [checked, setChecked] = useState<Record<string, boolean>>({});
  const [showDoc, setShowDoc] = useState<string | null>(null);

  const toggle = (id: string) => setChecked(c => ({ ...c, [id]: !c[id] }));

  const allRequired = CONSENTS.filter(c => c.required).every(c => checked[c.id]);

  const docMap: Record<string, string> = {
    terms: "Правила пользования платформой",
    loyalty: "Правила программы «АгроБаллы»",
    privacy: "Политика обработки персональных данных (152-ФЗ)",
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">

        {/* Шапка */}
        <div className="hero-gradient p-5 rounded-t-2xl relative overflow-hidden">
          <div className="hero-gradient-overlay absolute inset-0" />
          <div className="relative flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 border border-white/30 flex items-center justify-center shrink-0">
              <Icon name="Wheat" size={20} className="text-white" />
            </div>
            <div>
              <h2 className="font-heading font-black text-lg text-white leading-tight">Добро пожаловать в АгроПорт</h2>
              <p className="text-white/60 text-xs mt-0.5">Пожалуйста, ознакомьтесь с условиями и подпишите</p>
            </div>
          </div>
        </div>

        {/* Просмотр документа */}
        {showDoc && (
          <div className="p-4 border-b border-border bg-secondary/40">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-foreground">{docMap[showDoc]}</span>
              <button onClick={() => setShowDoc(null)} className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1">
                <Icon name="X" size={12} /> Закрыть
              </button>
            </div>
            <div className="max-h-48 overflow-y-auto text-[11px] text-muted-foreground leading-relaxed space-y-2 p-3 bg-white rounded-xl border border-border">
              {showDoc === "terms" && (
                <>
                  <p><strong>1. Общие положения.</strong> Настоящие Правила регулируют использование платформы agroport-ai.ru. Регистрация означает полное принятие условий.</p>
                  <p><strong>2. Оплата и тарифы.</strong> Оплата производится в рублях РФ. При оплате услуг допускается использование АгроБаллов.</p>
                  <p><strong>3. Запрещённые действия.</strong> Перепродажа доступа, парсинг данных без API-договора, публикация ложных объявлений на маркетплейсе.</p>
                  <p><strong>4. Ответственность.</strong> Платформа предоставляет аналитику в информационных целях. Оператор не несёт ответственности за хозяйственные решения на основе данных.</p>
                  <p className="font-semibold">Полный текст: раздел «Документы» платформы.</p>
                </>
              )}
              {showDoc === "loyalty" && (
                <>
                  <p><strong>Ключевые условия АгроБаллов:</strong></p>
                  <p>• <strong>1 АгроБалл = 1 рубль (₽)</strong> — фиксированный внутренний курс.</p>
                  <p>• <strong>Лимит оплаты баллами — не более 50%</strong> от стоимости услуги. Остаток оплачивается деньгами.</p>
                  <p>• <strong>Использование только на услугах АгроПорт</strong>: подписки, отчёты, консультации, курсы, маркетплейс.</p>
                  <p>• Обмен на деньги, перевод другим пользователям и вывод с платформы <strong>не допускаются</strong>.</p>
                  <p>• Баллы действительны 12 месяцев с момента последней активности.</p>
                  <p>• АгроБаллы не являются платёжным средством или ценными бумагами.</p>
                </>
              )}
              {showDoc === "privacy" && (
                <>
                  <p><strong>Обработка ПДн в соответствии с 152-ФЗ.</strong></p>
                  <p>Оператор: ООО «АгроПорт». Данные: ФИО, email, телефон, регион, данные хозяйства.</p>
                  <p>Цели: идентификация, исполнение договора, программа лояльности, сервисные уведомления.</p>
                  <p>Хранение: серверы на территории РФ. Срок: до 5 лет после прекращения договора.</p>
                  <p>Права: доступ, исправление, удаление, отзыв согласия — через privacy@agroport-ai.ru.</p>
                </>
              )}
            </div>
          </div>
        )}

        {/* Тело */}
        <div className="p-5 space-y-4">

          {/* Инфо-плашка о баллах */}
          <div className="flex items-start gap-3 p-3 bg-amber-50 border border-amber-200 rounded-xl">
            <Icon name="Crown" size={15} className="text-amber-500 shrink-0 mt-0.5" />
            <div className="text-[11px] text-amber-800 leading-relaxed">
              <strong>Программа «АгроБаллы»:</strong> 1 балл = 1 ₽ · Оплата баллами до 50% стоимости услуги · Используются только на услугах АгроПорт · Вывод и обмен на деньги запрещён
            </div>
          </div>

          {/* Чекбоксы */}
          <div className="space-y-3">
            {CONSENTS.map(c => (
              <label key={c.id} className={`flex items-start gap-3 cursor-pointer p-3 rounded-xl border transition-colors ${
                checked[c.id] ? "bg-primary/5 border-primary/20" : "bg-secondary/30 border-border hover:border-primary/20"
              }`}>
                <div className="mt-0.5 shrink-0">
                  <div
                    onClick={() => toggle(c.id)}
                    className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all cursor-pointer ${
                      checked[c.id] ? "bg-primary border-primary" : "bg-white border-border"
                    }`}
                  >
                    {checked[c.id] && <Icon name="Check" size={12} className="text-white" />}
                  </div>
                </div>
                <div className="text-[12px] text-foreground leading-relaxed flex-1">
                  {c.label(() => setShowDoc(c.id === "marketing" ? null : c.id))}
                  {c.required && <span className="text-destructive ml-1">*</span>}
                </div>
              </label>
            ))}
          </div>

          <p className="text-[10px] text-muted-foreground">* Обязательные пункты. Без их принятия использование платформы невозможно.</p>

          {/* Дата и подпись */}
          <div className="flex items-center gap-2 p-3 bg-secondary/50 rounded-xl border border-border">
            <Icon name="Calendar" size={12} className="text-muted-foreground shrink-0" />
            <p className="text-[11px] text-muted-foreground">
              Дата принятия: <strong className="text-foreground">{new Date().toLocaleDateString("ru-RU", { day: "2-digit", month: "long", year: "numeric" })}</strong>
              {" "}· Версия документов: <strong className="text-foreground">26.04.2026</strong>
            </p>
          </div>

          {/* Кнопка */}
          <button
            onClick={onAccept}
            disabled={!allRequired}
            className={`w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold transition-all ${
              allRequired
                ? "bg-primary text-white hover:bg-primary/90 shadow-md"
                : "bg-secondary text-muted-foreground cursor-not-allowed border border-border"
            }`}
          >
            <Icon name="CheckCircle" size={16} />
            {allRequired ? "Принять и продолжить" : "Отметьте обязательные пункты"}
          </button>
        </div>
      </div>
    </div>
  );
}
