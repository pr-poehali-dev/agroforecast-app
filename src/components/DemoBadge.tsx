import Icon from "@/components/ui/icon";

// Единая плашка «демонстрационные данные» — честно помечает блоки,
// в которых показаны иллюстративные (не рыночные) значения.
export default function DemoBadge({ className = "", text = "Демо-данные" }: { className?: string; text?: string }) {
  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 border border-amber-200 text-[10px] font-semibold ${className}`}
      title="Демонстрационные данные для показа возможностей платформы"
    >
      <Icon name="Info" size={11} />
      {text}
    </span>
  );
}
