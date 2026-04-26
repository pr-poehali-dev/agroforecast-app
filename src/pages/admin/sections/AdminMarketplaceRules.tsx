import { useState } from "react";
import Icon from "@/components/ui/icon";

const RULES = [
  {
    section: "Роль администратора",
    icon: "ShieldCheck",
    color: "bg-primary/10 text-primary",
    items: [
      "Администратор платформы АгроПорт является посредником между продавцами и покупателями на маркетплейсе.",
      "Администратор не является стороной торговых сделок и не несёт ответственности за качество товара и исполнение обязательств по сделкам.",
      "Администратор обеспечивает соответствие размещаемых объявлений правилам платформы и действующему законодательству РФ.",
      "Администратор вправе запрашивать подтверждающие документы у участников сделок при наличии оснований.",
    ],
  },
  {
    section: "Модерация объявлений",
    icon: "ClipboardCheck",
    color: "bg-amber-500/10 text-amber-600",
    items: [
      "Все новые объявления проходят предварительную модерацию до публикации (статус «На проверке»).",
      "Срок рассмотрения объявления — не более 1 рабочего дня с момента подачи.",
      "Объявление одобряется, если соответствует всем требованиям платформы, указана актуальная цена, корректно заполнены поля культуры и региона.",
      "Объявление отклоняется с указанием причины: недостоверные данные, запрещённый товар, спам, дублирование.",
      "Автор уведомляется об отклонении через личный кабинет с указанием причины.",
    ],
  },
  {
    section: "Требования к объявлениям",
    icon: "ListChecks",
    color: "bg-emerald-500/10 text-emerald-600",
    items: [
      "Обязательные поля: культура, регион, цена за тонну, контактные данные.",
      "Цена должна быть актуальной и соответствовать рыночным значениям. Демпинговые и заведомо завышенные цены подлежат проверке.",
      "Запрещено размещать объявления на товары, оборот которых ограничен или запрещён законодательством РФ.",
      "Одному пользователю разрешено не более 10 активных объявлений одновременно.",
      "Объявление действительно 30 дней, после чего снимается с публикации автоматически.",
    ],
  },
  {
    section: "Комиссия и расчёты",
    icon: "Percent",
    color: "bg-blue-500/10 text-blue-600",
    items: [
      "Размещение объявлений на платформе бесплатно для всех зарегистрированных пользователей.",
      "При совершении сделки через механизм безопасной сделки взимается комиссия: 2% (до 100 т), 1% (100–1000 т), 0,5% (свыше 1000 т).",
      "Комиссия списывается только после подтверждения факта получения товара покупателем.",
      "Администратор управляет эскроу-счётом и обязан перечислить средства продавцу в течение 3 рабочих дней после подтверждения сделки.",
      "В случае спора администратор выступает арбитром и принимает решение на основании предоставленных документов.",
    ],
  },
  {
    section: "Санкции и ограничения",
    icon: "Ban",
    color: "bg-red-500/10 text-red-600",
    items: [
      "Три отклонения объявлений пользователя в течение 30 дней влекут временную приостановку размещения на 7 дней.",
      "Выявление мошеннических действий (недостоверные данные, фиктивные сделки) влечёт немедленную блокировку аккаунта.",
      "Жалобы на объявления рассматриваются в течение 2 рабочих дней.",
      "Повторное нарушение после предупреждения влечёт постоянную блокировку аккаунта без права восстановления.",
    ],
  },
];

export default function AdminMarketplaceRules() {
  const [expanded, setExpanded] = useState<number | null>(0);

  return (
    <div className="space-y-5">
      {/* Заголовок */}
      <div className="hero-gradient rounded-2xl p-5 sm:p-7 relative overflow-hidden shadow-md">
        <div className="hero-gradient-overlay absolute inset-0" />
        <div className="bg-dots absolute inset-0 opacity-15" />
        <div className="relative">
          <div className="flex items-center gap-2 mb-1.5">
            <Icon name="ScrollText" size={13} className="text-white/70" />
            <span className="text-white/55 text-xs font-mono uppercase tracking-widest">АгроПорт · Администратор</span>
          </div>
          <h1 className="font-heading font-black text-2xl sm:text-3xl text-white leading-tight">
            Правила <span className="gold-text">маркетплейса</span>
          </h1>
          <p className="text-white/60 text-sm mt-1">
            Внутренний регламент для администраторов платформы. Версия 1.0 · Апрель 2025
          </p>
        </div>
      </div>

      {/* Аннотация */}
      <div className="glass-card rounded-2xl p-5 flex items-start gap-3 border border-amber-200 bg-amber-50/50">
        <Icon name="Info" size={16} className="text-amber-600 shrink-0 mt-0.5" />
        <p className="text-sm text-amber-800 leading-relaxed">
          Данный документ определяет порядок работы администратора платформы АгроПорт как посредника при проведении торговых операций через маркетплейс. Регламент обязателен к исполнению всеми сотрудниками, имеющими административный доступ.
        </p>
      </div>

      {/* Разделы */}
      <div className="space-y-3">
        {RULES.map((block, i) => (
          <div key={i} className="glass-card rounded-2xl border border-border overflow-hidden">
            <button
              onClick={() => setExpanded(expanded === i ? null : i)}
              className="w-full flex items-center gap-3 p-5 text-left hover:bg-secondary/30 transition-colors"
            >
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${block.color.replace("text-", "").split(" ")[0]}`}>
                <Icon name={block.icon as "ShieldCheck"} size={16} className={block.color.split(" ").find(c => c.startsWith("text-")) ?? ""} />
              </div>
              <span className="font-heading font-bold text-sm text-foreground flex-1">{block.section}</span>
              <Icon
                name={expanded === i ? "ChevronUp" : "ChevronDown"}
                size={16}
                className="text-muted-foreground shrink-0"
              />
            </button>
            {expanded === i && (
              <div className="px-5 pb-5 space-y-2.5 border-t border-border/50 pt-4">
                {block.items.map((rule, j) => (
                  <div key={j} className="flex items-start gap-3">
                    <span className="shrink-0 w-5 h-5 rounded-full bg-primary/10 text-primary text-[11px] font-bold flex items-center justify-center mt-0.5">
                      {j + 1}
                    </span>
                    <p className="text-sm text-foreground leading-relaxed">{rule}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Подпись */}
      <div className="glass-card rounded-2xl p-5 flex items-center gap-4 border border-border">
        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
          <Icon name="FileCheck" size={18} className="text-primary" />
        </div>
        <div className="flex-1">
          <p className="text-sm font-semibold text-foreground">Документ утверждён</p>
          <p className="text-xs text-muted-foreground mt-0.5">Администрация платформы АгроПорт · Апрель 2025</p>
        </div>
        <button
          onClick={() => window.print()}
          className="flex items-center gap-2 px-4 py-2 bg-secondary border border-border rounded-xl text-sm text-foreground hover:border-primary/40 transition-colors"
        >
          <Icon name="Printer" size={14} />
          Печать
        </button>
      </div>
    </div>
  );
}
