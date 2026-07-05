import Icon from "@/components/ui/icon";
import PlanBlock from "./saratov/PlanBlock";
import SuppliersBlock from "./saratov/SuppliersBlock";

// ── Главный раздел ───────────────────────────────────────────────────────────
export default function AdminSaratov() {
  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 hero-gradient rounded-xl flex items-center justify-center">
          <Icon name="MapPin" size={18} className="text-white" />
        </div>
        <div>
          <h2 className="font-heading font-bold text-lg leading-none">Саратовская область</h2>
          <p className="text-xs text-muted-foreground mt-1">CRM сельхозпроизводителей с ИИ-помощником менеджера</p>
        </div>
      </div>
      <PlanBlock />
      <SuppliersBlock />
    </div>
  );
}