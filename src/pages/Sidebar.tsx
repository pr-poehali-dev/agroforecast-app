import Icon from "@/components/ui/icon";
import { NAV_ITEMS } from "./data";

interface SidebarProps {
  activeSection: string;
  sidebarOpen: boolean;
  collapsed: boolean;
  onNavigate: (id: string) => void;
  onClose: () => void;
  onToggleCollapse: () => void;
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
    items: ["risks", "ai-model", "analytics", "business", "logistics", "board", "crm", "planner", "alerts"],
  },
  {
    label: "Платформа",
    icon: "Layers",
    items: ["integrations", "pricing", "loyalty", "partners"],
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
  loyalty: "Crown",
  partners: "Handshake",
  logistics: "Truck",
  board: "ShoppingCart",
  crm: "Briefcase",
  profile: "UserCircle",
};

export default function Sidebar({ activeSection, sidebarOpen, collapsed, onNavigate, onClose, onToggleCollapse }: SidebarProps) {
  const w = collapsed ? "w-16" : "w-64";

  return (
    <>
      <aside className={`
        fixed inset-y-0 left-0 z-50 flex flex-col
        bg-white border-r border-border
        transition-all duration-300 ease-in-out
        ${w}
        ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
        lg:relative lg:translate-x-0 lg:flex
      `}>

        {/* ── Логотип ── */}
        <div className="relative overflow-hidden shrink-0">
          <div className="hero-gradient p-4">
            <div className={`flex items-center ${collapsed ? "justify-center" : "gap-3"}`}>
              <div className="w-9 h-9 rounded-xl bg-white/20 border border-white/30 flex items-center justify-center shadow-lg shrink-0">
                <Icon name="Wheat" size={18} className="text-white" />
              </div>
              {!collapsed && (
                <div className="min-w-0">
                  <div className="font-heading font-bold text-white leading-tight text-[15px] tracking-wide">АгроПорт</div>
                  <div className="text-[10px] text-white/70 font-mono mt-0.5 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse-glow inline-block" />
                    Россия · v3.0
                  </div>
                </div>
              )}
            </div>
            {!collapsed && (
              <div className="absolute right-4 top-3 opacity-10">
                <Icon name="Sprout" size={40} className="text-white" />
              </div>
            )}
          </div>
          {/* Золотая полоска */}
          <div className="h-0.5 bg-gradient-to-r from-accent via-yellow-300 to-accent" />
        </div>

        {/* ── Кнопка свернуть (только на desktop) ── */}
        <button
          onClick={onToggleCollapse}
          className="hidden lg:flex items-center justify-center w-full py-2 text-muted-foreground hover:text-primary hover:bg-primary/5 transition-colors border-b border-border"
          title={collapsed ? "Развернуть меню" : "Свернуть меню"}>
          <Icon name={collapsed ? "ChevronsRight" : "ChevronsLeft"} size={15} />
          {!collapsed && <span className="ml-2 text-[11px] font-medium">Свернуть</span>}
        </button>

        {/* ── Навигация ── */}
        <nav className="flex-1 px-2 py-3 overflow-y-auto space-y-4">
          {NAV_GROUPS.map(group => {
            const groupItems = NAV_ITEMS.filter(n => group.items.includes(n.id));
            return (
              <div key={group.label}>
                {!collapsed && (
                  <div className="flex items-center gap-1.5 px-2 mb-2">
                    <Icon name={group.icon as string} size={10} className="text-muted-foreground" />
                    <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest">{group.label}</span>
                  </div>
                )}
                {collapsed && (
                  <div className="flex justify-center mb-1">
                    <div className="w-6 h-px bg-border" />
                  </div>
                )}
                <div className="space-y-0.5">
                  {groupItems.map(item => {
                    const isActive = activeSection === item.id;
                    const iconName = SECTION_ICONS[item.id] || item.icon;
                    return (
                      <button
                        key={item.id}
                        onClick={() => { onNavigate(item.id); onClose(); }}
                        title={collapsed ? item.label : undefined}
                        className={`w-full flex items-center rounded-lg transition-all duration-200 group relative
                          ${collapsed ? "justify-center px-0 py-2.5" : "gap-3 px-3 py-2.5"}
                          ${isActive
                            ? "bg-primary/12 text-primary border border-primary/20"
                            : "text-muted-foreground hover:text-foreground hover:bg-secondary border border-transparent"
                          }`}>
                        {isActive && !collapsed && (
                          <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-primary rounded-r-full" />
                        )}
                        <div className={`flex items-center justify-center shrink-0 rounded-lg transition-all relative
                          ${collapsed ? "w-9 h-9" : "w-7 h-7"}
                          ${isActive ? "bg-primary/20" : "bg-secondary group-hover:bg-primary/10"}`}>
                          <Icon
                            name={iconName as string}
                            size={collapsed ? 16 : 14}
                            className={isActive ? "text-primary" : "text-muted-foreground group-hover:text-primary"}
                          />
                          {/* Бейджи в свёрнутом режиме */}
                          {collapsed && item.id === "alerts" && (
                            <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-destructive text-[8px] text-white flex items-center justify-center font-bold badge-pulse">7</span>
                          )}
                        </div>
                        {!collapsed && (
                          <>
                            <span className="flex-1 text-left font-body text-[13px]">{item.label}</span>
                            {item.id === "alerts" && (
                              <span className="w-5 h-5 rounded-full bg-destructive text-destructive-foreground text-[9px] font-bold flex items-center justify-center badge-pulse">7</span>
                            )}
                            {item.id === "ai-model" && (
                              <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-accent/20 text-accent border border-accent/30">AI</span>
                            )}
                          </>
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
        <div className={`shrink-0 border-t border-border bg-secondary/30 ${collapsed ? "p-2" : "p-4"}`}>
          <div className={`flex items-center ${collapsed ? "justify-center" : "gap-3"}`}>
            <div className="w-9 h-9 rounded-full hero-gradient flex items-center justify-center text-white shrink-0 shadow">
              <Icon name="User" size={16} className="text-white" />
            </div>
            {!collapsed && (
              <>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-accent/20 text-accent border border-accent/25">PRO</span>
                    <button
                      onClick={() => { onNavigate("loyalty"); onClose(); }}
                      className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-amber-100 border border-amber-200 hover:bg-amber-200 transition-colors">
                      <Icon name="Crown" size={9} className="text-amber-600" />
                      <span className="text-[9px] font-bold font-mono text-amber-700">210 баллов</span>
                    </button>
                  </div>
                </div>
                <button className="w-7 h-7 rounded-lg flex items-center justify-center text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors">
                  <Icon name="Settings" size={13} />
                </button>
              </>
            )}
          </div>
          {collapsed && (
            <button
              onClick={() => { onNavigate("loyalty"); onClose(); }}
              className="mt-2 w-full flex items-center justify-center p-1.5 rounded-lg bg-amber-50 border border-amber-200 hover:bg-amber-100 transition-colors"
              title="Программа лояльности — 210 баллов">
              <Icon name="Crown" size={13} className="text-amber-500" />
            </button>
          )}
        </div>
      </aside>

      {/* Оверлей для мобайла */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm lg:hidden" onClick={onClose} />
      )}
    </>
  );
}