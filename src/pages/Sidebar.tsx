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
    icon: "Activity",
    items: ["home", "forecasts", "map", "supply", "ndvi", "news"],
  },
  {
    label: "Управление",
    icon: "Settings2",
    items: ["risks", "ai-model", "analytics", "business", "planner", "alerts"],
  },
  {
    label: "Платформа",
    icon: "Layers",
    items: ["integrations", "pricing"],
  },
];

const SECTION_ICONS: Record<string, string> = {
  home: "LayoutDashboard",
  forecasts: "TrendingUp",
  map: "Map",
  supply: "ArrowLeftRight",
  ndvi: "Satellite",
  news: "Newspaper",
  risks: "ShieldAlert",
  "ai-model": "Brain",
  analytics: "BarChart3",
  business: "Briefcase",
  planner: "ClipboardList",
  alerts: "Bell",
  integrations: "Plug",
  pricing: "CreditCard",
};

export default function Sidebar({ activeSection, sidebarOpen, onNavigate, onClose }: SidebarProps) {
  return (
    <>
      <aside className={`
        fixed inset-y-0 left-0 z-50 w-64 flex flex-col
        bg-white border-r border-border
        transition-transform duration-300 ease-in-out
        ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
        lg:relative lg:translate-x-0 lg:flex
      `}>

        {/* ── Логотип ── */}
        <div className="relative overflow-hidden">
          <div className="hero-gradient p-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white/20 border border-white/30 flex items-center justify-center shadow-lg">
                <Icon name="Wheat" size={20} className="text-white" />
              </div>
              <div>
                <div className="font-heading font-bold text-white leading-tight text-[15px] tracking-wide">АгроПорт</div>
                <div className="text-[10px] text-white/70 font-mono mt-0.5 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse-glow inline-block" />
                  Поволжье · v2.5
                </div>
              </div>
            </div>
            {/* Декоративные элементы */}
            <div className="absolute right-4 top-3 opacity-10">
              <Icon name="Sprout" size={48} className="text-white" />
            </div>
          </div>
          {/* Золотая полоска */}
          <div className="h-0.5 bg-gradient-to-r from-accent via-yellow-300 to-accent" />
        </div>

        {/* ── Навигация ── */}
        <nav className="flex-1 px-3 py-4 overflow-y-auto space-y-5">
          {NAV_GROUPS.map(group => {
            const groupItems = NAV_ITEMS.filter(n => group.items.includes(n.id));
            return (
              <div key={group.label}>
                <div className="flex items-center gap-1.5 px-2 mb-2">
                  <Icon name={group.icon as string} size={10} className="text-muted-foreground" />
                  <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest">{group.label}</span>
                </div>
                <div className="space-y-0.5">
                  {groupItems.map(item => {
                    const isActive = activeSection === item.id;
                    const iconName = SECTION_ICONS[item.id] || item.icon;
                    return (
                      <button key={item.id}
                        onClick={() => { onNavigate(item.id); onClose(); }}
                        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 group relative
                          ${isActive
                            ? "bg-primary/12 text-primary border border-primary/20"
                            : "text-muted-foreground hover:text-foreground hover:bg-secondary border border-transparent"
                          }`}>
                        {isActive && (
                          <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-primary rounded-r-full" />
                        )}
                        <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 transition-all
                          ${isActive ? "bg-primary/20" : "bg-secondary group-hover:bg-primary/10"}`}>
                          <Icon name={iconName as string} size={14}
                            className={isActive ? "text-primary" : "text-muted-foreground group-hover:text-primary"} />
                        </div>
                        <span className="flex-1 text-left font-body text-[13px]">{item.label}</span>
                        {item.id === "alerts" && (
                          <span className="w-5 h-5 rounded-full bg-destructive text-destructive-foreground text-[9px] font-bold flex items-center justify-center badge-pulse">7</span>
                        )}
                        {item.id === "ai-model" && (
                          <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-accent/20 text-accent border border-accent/30">AI</span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </nav>

        {/* ── Пользователь ── */}
        <div className="p-4 border-t border-border bg-secondary/30">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-9 h-9 rounded-full hero-gradient flex items-center justify-center text-xs font-bold text-white shrink-0 shadow">
              <Icon name="User" size={16} className="text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1">
                <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-accent/20 text-accent border border-accent/25">PRO</span>
              </div>
            </div>
            <button className="w-7 h-7 rounded-lg flex items-center justify-center text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors">
              <Icon name="Settings" size={13} />
            </button>
          </div>


        </div>
      </aside>

      {sidebarOpen && (
        <div className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm lg:hidden" onClick={onClose} />
      )}
    </>
  );
}