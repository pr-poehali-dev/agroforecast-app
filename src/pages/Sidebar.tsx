import Icon from "@/components/ui/icon";
import { NAV_ITEMS } from "./data";

interface SidebarProps {
  activeSection: string;
  sidebarOpen: boolean;
  onNavigate: (id: string) => void;
  onClose: () => void;
}

const NAV_GROUPS = [
  {
    label: "Мониторинг",
    items: ["home", "forecasts", "map", "supply", "ndvi", "news"],
  },
  {
    label: "Управление",
    items: ["risks", "ai-model", "analytics", "business", "planner", "alerts"],
  },
  {
    label: "Платформа",
    items: ["integrations", "pricing"],
  },
];

export default function Sidebar({ activeSection, sidebarOpen, onNavigate, onClose }: SidebarProps) {
  return (
    <>
      <aside className={`
        fixed inset-y-0 left-0 z-50 w-64 bg-card border-r border-border flex flex-col
        transition-transform duration-300
        ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
        lg:relative lg:translate-x-0 lg:flex
      `}>
        {/* Logo */}
        <div className="p-5 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-primary/20 border border-primary/30 flex items-center justify-center">
              <Icon name="Wheat" size={18} className="text-primary" />
            </div>
            <div>
              <div className="font-bold text-foreground leading-none text-sm">AgroForecast Pro</div>
              <div className="text-[10px] text-muted-foreground font-mono mt-0.5">Поволжье · v2.5.0</div>
            </div>
          </div>
        </div>

        {/* Nav groups */}
        <nav className="flex-1 p-3 overflow-y-auto space-y-4">
          {NAV_GROUPS.map(group => {
            const groupItems = NAV_ITEMS.filter(n => group.items.includes(n.id));
            return (
              <div key={group.label}>
                <div className="px-2 mb-1 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                  {group.label}
                </div>
                <div className="space-y-0.5">
                  {groupItems.map(item => (
                    <button key={item.id}
                      onClick={() => { onNavigate(item.id); onClose(); }}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 group
                        ${activeSection === item.id
                          ? "bg-primary/15 text-primary border border-primary/25"
                          : "text-muted-foreground hover:text-foreground hover:bg-secondary border border-transparent"
                        }`}>
                      <Icon name={item.icon as string} size={15}
                        className={activeSection === item.id ? "text-primary" : "text-muted-foreground group-hover:text-foreground"} />
                      <span className="flex-1 text-left">{item.label}</span>
                      {item.id === "alerts" && (
                        <span className="w-5 h-5 rounded-full bg-destructive text-destructive-foreground text-[10px] font-bold flex items-center justify-center">7</span>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
        </nav>

        {/* User block */}
        <div className="p-4 border-t border-border">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary/60 to-accent/60 flex items-center justify-center text-xs font-bold text-white shrink-0">АВ</div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium text-foreground truncate">Алексей Воронов</div>
              <div className="text-[10px] text-muted-foreground">Профессионал · до 1 мая</div>
            </div>
            <button className="text-muted-foreground hover:text-foreground transition-colors">
              <Icon name="Settings" size={14} />
            </button>
          </div>
          <div className="h-1.5 bg-border rounded-full">
            <div className="h-full w-[68%] rounded-full bg-primary/60" />
          </div>
          <div className="flex justify-between mt-1 text-[10px] text-muted-foreground">
            <span>API: 340/500 запросов</span>
            <span>68%</span>
          </div>
        </div>
      </aside>

      {sidebarOpen && (
        <div className="fixed inset-0 z-40 bg-black/60 lg:hidden" onClick={onClose} />
      )}
    </>
  );
}