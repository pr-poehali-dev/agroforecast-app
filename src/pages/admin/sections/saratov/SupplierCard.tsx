import { useState } from "react";
import Icon from "@/components/ui/icon";
import { Supplier, STATUS_LABELS, STATUS_COLORS } from "./shared";
import ProfileTab from "./ProfileTab";
import HistoryTab from "./HistoryTab";
import AiTab from "./AiTab";
import ProcurementTab from "./ProcurementTab";

type Tab = "profile" | "history" | "ai" | "procurement";

// ── Полная карточка поставщика с вкладками ───────────────────────────────────
export default function SupplierCard({ item, onClose, onSaved }: {
  item: Partial<Supplier>; onClose: () => void; onSaved: () => void;
}) {
  const isNew = !item.id;
  const [tab, setTab] = useState<Tab>("profile");

  const tabs: { key: Tab; label: string; icon: string }[] = [
    { key: "profile", label: "Профиль", icon: "User" },
    { key: "procurement", label: "Закупщик", icon: "Send" },
    { key: "history", label: "История", icon: "History" },
    { key: "ai", label: "ИИ-помощник", icon: "Sparkles" },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="bg-background rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Шапка */}
        <div className="p-5 border-b border-border sticky top-0 bg-background z-10 space-y-3">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h3 className="font-heading font-bold text-base truncate">
                {isNew ? "Новое хозяйство" : item.name}
              </h3>
              {!isNew && (
                <div className="flex items-center gap-2 mt-1 flex-wrap">
                  {(item.priority ?? 0) >= 2 && (
                    <span className="flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[10px] font-medium bg-amber-100 text-amber-700">
                      <Icon name="Star" size={10} />Приоритет
                    </span>
                  )}
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${STATUS_COLORS[item.status || "new"] || "bg-secondary text-muted-foreground"}`}>
                    {STATUS_LABELS[item.status || "new"] || item.status}
                  </span>
                  {item.district && <span className="text-[11px] text-muted-foreground">{item.district} р-н</span>}
                  {item.inn && <span className="text-[11px] text-muted-foreground">ИНН {item.inn}</span>}
                </div>
              )}
            </div>
            <button onClick={onClose}><Icon name="X" size={18} className="text-muted-foreground" /></button>
          </div>

          {/* Вкладки — только для существующего поставщика */}
          {!isNew && (
            <div className="flex gap-2">
              {tabs.map(t => (
                <button key={t.key} onClick={() => setTab(t.key)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium ${tab === t.key ? "bg-primary text-white" : "bg-secondary text-muted-foreground hover:bg-secondary/80"}`}>
                  <Icon name={t.icon} size={13} />{t.label}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Контент вкладки */}
        <div className="p-5">
          {(isNew || tab === "profile") && <ProfileTab item={item} onSaved={onSaved} />}
          {!isNew && tab === "procurement" && <ProcurementTab item={item as Supplier} />}
          {!isNew && tab === "history" && <HistoryTab supplierId={item.id!} />}
          {!isNew && tab === "ai" && <AiTab item={item as Supplier} />}
        </div>
      </div>
    </div>
  );
}