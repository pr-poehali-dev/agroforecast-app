import Icon from "@/components/ui/icon";
import { NAV_ITEMS } from "./data";

interface SidebarProps {
  activeSection: string;
  sidebarOpen: boolean;
  onNavigate: (id: string) => void;
  onClose: () => void;
}

export default function Sidebar({ activeSection, sidebarOpen, onNavigate, onClose }: SidebarProps) {
  return (
    <>
      <aside className={`
        fixed inset-y-0 left-0 z-50 w-64 bg-card border-r border-border flex flex-col
        transition-transform duration-300
        ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
        lg:relative lg:translate-x-0 lg:flex
      `}>
        <div className="p-6 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-primary/20 border border-primary/30 flex items-center justify-center glow-emerald">
              <Icon name="Wheat" size={18} className="text-primary" />
            </div>
            <div>
              <div className="font-bold text-foreground leading-none">АгроВолга</div>
              <div className="text-xs text-muted-foreground font-mono mt-0.5">v2.4.1 · live</div>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
          {NAV_ITEMS.map(item => (
            <button key={item.id}
              onClick={() => { onNavigate(item.id); onClose(); }}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 group
                ${activeSection === item.id
                  ? "bg-primary/15 text-primary border border-primary/25"
                  : "text-muted-foreground hover:text-foreground hover:bg-secondary border border-transparent"
                }`}>
              <Icon name={item.icon as string} size={16}
                className={activeSection === item.id ? "text-primary" : "text-muted-foreground group-hover:text-foreground"} />
              {item.label}
              {item.id === "alerts" && (
                <span className="ml-auto w-5 h-5 rounded-full bg-destructive text-destructive-foreground text-[10px] font-bold flex items-center justify-center">3</span>
              )}
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-border">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary/60 to-accent/60 flex items-center justify-center text-xs font-bold text-white">АВ</div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium text-foreground truncate">Алексей Воронов</div>
              <div className="text-xs text-muted-foreground">Агроном-аналитик</div>
            </div>
            <button className="text-muted-foreground hover:text-foreground transition-colors">
              <Icon name="Settings" size={15} />
            </button>
          </div>
        </div>
      </aside>

      {sidebarOpen && (
        <div className="fixed inset-0 z-40 bg-black/60 lg:hidden" onClick={onClose} />
      )}
    </>
  );
}
