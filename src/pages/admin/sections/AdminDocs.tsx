import Icon from "@/components/ui/icon";

const DOCS = [
  {
    id: "terms",
    label: "Правила пользования",
    icon: "FileText",
    file: "src/components/docs/DocContents.tsx",
    section: "TermsDoc",
    desc: "Условия использования платформы, тарифы, ответственность, запрещённые действия.",
  },
  {
    id: "loyalty",
    label: "Правила программы АгроБаллы",
    icon: "Crown",
    file: "src/components/docs/DocContents.tsx",
    section: "LoyaltyRulesDoc",
    desc: "Условия начисления и списания АгроБаллов, курс, ограничения.",
  },
  {
    id: "privacy",
    label: "Политика обработки ПДн",
    icon: "Shield",
    file: "src/components/docs/DocContents.tsx",
    section: "PrivacyDoc",
    desc: "Политика конфиденциальности в соответствии с 152-ФЗ.",
  },
  {
    id: "consent",
    label: "Согласие на обработку ПДн",
    icon: "UserCheck",
    file: "src/components/docs/DocContents.tsx",
    section: "ConsentDoc",
    desc: "Форма согласия по ст. 9 ФЗ-152.",
  },
];

export default function AdminDocs() {
  return (
    <div className="space-y-5">
      <div>
        <h2 className="font-heading font-bold text-lg">Документы</h2>
        <p className="text-xs text-muted-foreground mt-1">Тексты документов хранятся в коде проекта и редактируются через разработчика.</p>
      </div>

      <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl flex gap-3">
        <Icon name="Info" size={15} className="text-amber-600 shrink-0 mt-0.5" />
        <div className="text-xs text-amber-800 space-y-1">
          <p><strong>Как редактировать документы:</strong></p>
          <p>Тексты документов находятся в файле <code className="bg-amber-100 px-1 rounded">src/components/docs/DocContents.tsx</code>. Каждый документ — отдельный компонент (TermsDoc, LoyaltyRulesDoc, PrivacyDoc, ConsentDoc).</p>
          <p>Попросите разработчика отредактировать нужный раздел, или воспользуйтесь чатом с ИИ-ассистентом.</p>
        </div>
      </div>

      <div className="grid sm:grid-cols-2 gap-3">
        {DOCS.map(doc => (
          <div key={doc.id} className="glass-card rounded-2xl p-5 space-y-3">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center shrink-0">
                <Icon name={doc.icon as "FileText"} size={18} className="text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-heading font-semibold text-sm">{doc.label}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{doc.desc}</p>
              </div>
            </div>
            <div className="p-3 bg-secondary/50 rounded-xl">
              <p className="text-[10px] text-muted-foreground font-mono">
                <span className="text-muted-foreground">Компонент: </span>
                <span className="text-foreground">{doc.section}</span>
              </p>
              <p className="text-[10px] text-muted-foreground font-mono mt-0.5 truncate">{doc.file}</p>
            </div>
            <p className="text-[10px] text-muted-foreground">
              Редакция от 26 апреля 2026 г.
            </p>
          </div>
        ))}
      </div>

      <div className="glass-card rounded-2xl p-5">
        <p className="font-heading font-semibold text-sm mb-3">Быстрое редактирование</p>
        <p className="text-xs text-muted-foreground mb-4">
          Напишите в чате с ИИ-ассистентом, что именно нужно изменить. Например:
        </p>
        <div className="space-y-2">
          {[
            "«Измени ОГРН в правилах пользования на 123456789»",
            "«Добавь новый пункт в раздел 4 Правил пользования»",
            "«Обнови email в Политике обработки данных»",
          ].map((ex, i) => (
            <div key={i} className="flex items-start gap-2 p-2.5 bg-secondary/40 rounded-xl">
              <Icon name="MessageSquare" size={12} className="text-primary shrink-0 mt-0.5" />
              <p className="text-xs text-muted-foreground italic">{ex}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
