import { useState } from "react";
import Icon from "@/components/ui/icon";
import { adminApi, adminToken } from "@/lib/adminApi";

const NAV = [
  { id: "dashboard", label: "Дашборд", icon: "LayoutDashboard" },
  { id: "users", label: "Пользователи", icon: "Users" },
  { id: "appeals", label: "Заявки", icon: "MessageSquare" },
  { id: "news", label: "Новости", icon: "Newspaper" },
  { id: "docs", label: "Документы", icon: "FileText" },
];

interface Props {
  section: string;
  onSection: (s: string) => void;
  onLogout: () => void;
  newAppeals?: number;
}

export default function AdminLayout({ section, onSection, onLogout, newAppeals = 0 }: Props) {
  const [collapsed, setCollapsed] = useState(false);

  const handleLogout = async () => {
    await adminApi.logout().catch(() => {});
    adminToken.clear();
    onLogout();
  };

  return (
    <aside className={`${collapsed ? "w-16" : "w-56"} shrink-0 transition-all duration-200 flex flex-col bg-card border-r border-border h-screen sticky top-0`}>
      {/* Лого */}
      <div className="p-4 border-b border-border flex items-center gap-3">
        <div className="w-8 h-8 hero-gradient rounded-lg flex items-center justify-center shrink-0">
          <Icon name="ShieldCheck" size={16} className="text-white" />
        </div>
        {!collapsed && (
          <div className="min-w-0">
            <p className="font-heading font-bold text-sm leading-none">АгроПорт</p>
            <p className="text-[10px] text-muted-foreground mt-0.5">Администратор</p>
          </div>
        )}
        <button onClick={() => setCollapsed(c => !c)} className="ml-auto text-muted-foreground hover:text-foreground">
          <Icon name={collapsed ? "PanelLeftOpen" : "PanelLeftClose"} size={15} />
        </button>
      </div>

      {/* Навигация */}
      <nav className="flex-1 p-2 space-y-0.5 overflow-y-auto">
        {NAV.map(item => (
          <button key={item.id} onClick={() => onSection(item.id)}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all relative
              ${section === item.id
                ? "bg-primary text-white shadow-sm"
                : "text-muted-foreground hover:bg-secondary hover:text-foreground"}`}>
            <Icon name={item.icon as "Users"} size={16} className="shrink-0" />
            {!collapsed && <span className="truncate">{item.label}</span>}
            {item.id === "appeals" && newAppeals > 0 && (
              <span className={`${collapsed ? "absolute -top-1 -right-1" : "ml-auto"} bg-destructive text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center`}>
                {newAppeals > 9 ? "9+" : newAppeals}
              </span>
            )}
          </button>
        ))}
      </nav>

      {/* Выход */}
      <div className="p-2 border-t border-border">
        <button onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors">
          <Icon name="LogOut" size={16} className="shrink-0" />
          {!collapsed && <span>Выйти</span>}
        </button>
      </div>
    </aside>
  );
}
