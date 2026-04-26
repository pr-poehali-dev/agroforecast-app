import Icon from "@/components/ui/icon";

export default function DocsHero() {
  return (
    <div className="hero-gradient rounded-2xl p-5 sm:p-7 relative overflow-hidden shadow-md">
      <div className="hero-gradient-overlay absolute inset-0" />
      <div className="bg-dots absolute inset-0 opacity-15" />
      <div className="relative">
        <div className="flex items-center gap-2 mb-1.5">
          <Icon name="FileText" size={13} className="text-white/70" />
          <span className="text-white/55 text-xs font-mono uppercase tracking-widest">АгроПорт · Правовые документы</span>
        </div>
        <h1 className="font-heading font-black text-2xl sm:text-3xl text-white leading-tight">
          Документы и <span className="gold-text">условия</span>
        </h1>
        <p className="text-white/60 text-sm mt-1 font-body">
          Правила пользования · АгроБаллы · Персональные данные (152-ФЗ)
        </p>
      </div>
    </div>
  );
}
