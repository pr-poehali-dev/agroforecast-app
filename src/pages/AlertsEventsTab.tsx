import Icon from "@/components/ui/icon";
import { ALERTS } from "./data";
import { AlertFilter } from "./AlertsTypes";

function FilterBar({
  active,
  counts,
  onChange,
}: {
  active: AlertFilter;
  counts: Record<AlertFilter, number>;
  onChange: (f: AlertFilter) => void;
}) {
  const filters: { id: AlertFilter; label: string; color: string }[] = [
    { id: "all",      label: "Все",           color: "bg-primary/15 text-primary border-primary/30" },
    { id: "critical", label: "Критические",   color: "bg-destructive/15 text-destructive border-destructive/30" },
    { id: "warning",  label: "Предупреждения", color: "bg-amber-100 text-amber-700 border-amber-300" },
    { id: "info",     label: "Инфо",           color: "bg-blue-50 text-blue-600 border-blue-200" },
  ];

  return (
    <div className="flex gap-2 flex-wrap">
      {filters.map(f => (
        <button
          key={f.id}
          onClick={() => onChange(f.id)}
          className={`flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg border transition-all font-medium
            ${active === f.id
              ? f.color
              : "bg-secondary text-muted-foreground border-border hover:border-primary/30 hover:text-foreground"}`}
        >
          {f.label}
          <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold
            ${active === f.id ? "bg-white/50" : "bg-border/60"}`}>
            {counts[f.id]}
          </span>
        </button>
      ))}
    </div>
  );
}

function AlertCard({
  alert,
  read,
  onRead,
}: {
  alert: typeof ALERTS[number];
  read: boolean;
  onRead: (id: number) => void;
}) {
  const typeMap = {
    critical: {
      border: "border-destructive/30",
      iconBg: "bg-destructive/15 text-destructive",
      badge: "bg-destructive/15 text-destructive",
      label: "критично",
    },
    warning: {
      border: "border-amber-300/50",
      iconBg: "bg-amber-100 text-amber-600",
      badge: "bg-amber-100 text-amber-700",
      label: "внимание",
    },
    info: {
      border: "border-border",
      iconBg: "bg-primary/15 text-primary",
      badge: "bg-primary/10 text-primary",
      label: "инфо",
    },
  };
  const s = typeMap[alert.type as keyof typeof typeMap] ?? typeMap.info;

  return (
    <div className={`glass-card rounded-xl p-4 border flex items-start gap-4 transition-all
      ${s.border} ${read ? "opacity-50" : "hover:scale-[1.003]"}`}
    >
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${s.iconBg}`}>
        <Icon name={alert.icon as string} size={18} />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className={`font-semibold text-sm ${read ? "line-through text-muted-foreground" : "text-foreground"}`}>
            {alert.title}
          </span>
          <span className={`px-2 py-0.5 text-[10px] font-mono rounded uppercase ${s.badge}`}>
            {s.label}
          </span>
          {read && (
            <span className="px-2 py-0.5 text-[10px] font-mono rounded bg-secondary text-muted-foreground">
              прочитано
            </span>
          )}
        </div>
        <div className="text-sm text-muted-foreground mt-1 leading-relaxed">{alert.desc}</div>
        <div className="flex items-center gap-3 mt-2">
          <span className="text-[11px] text-muted-foreground font-mono flex items-center gap-1">
            <Icon name="Clock" size={10} />
            {alert.time}
          </span>
          {!read && (
            <button
              onClick={() => onRead(alert.id)}
              className="text-[11px] text-primary/70 hover:text-primary transition-colors flex items-center gap-1 font-medium"
            >
              <Icon name="CheckCircle" size={10} />
              Отметить прочитанным
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

interface AlertsEventsTabProps {
  filter: AlertFilter;
  counts: Record<AlertFilter, number>;
  readIds: Set<number>;
  filteredAlerts: typeof ALERTS;
  onFilterChange: (f: AlertFilter) => void;
  onMarkRead: (id: number) => void;
}

export default function AlertsEventsTab({
  filter,
  counts,
  readIds,
  filteredAlerts,
  onFilterChange,
  onMarkRead,
}: AlertsEventsTabProps) {
  return (
    <div className="space-y-4">
      <FilterBar active={filter} counts={counts} onChange={onFilterChange} />

      <div className="space-y-3">
        {filteredAlerts.length === 0 ? (
          <div className="glass-card rounded-xl p-8 text-center text-muted-foreground text-sm">
            Нет событий в этой категории
          </div>
        ) : (
          filteredAlerts.map(a => (
            <AlertCard
              key={a.id}
              alert={a}
              read={readIds.has(a.id)}
              onRead={onMarkRead}
            />
          ))
        )}
      </div>

      {readIds.size > 0 && (
        <p className="text-center text-xs text-muted-foreground">
          {readIds.size} из {ALERTS.length} событий прочитано
        </p>
      )}
    </div>
  );
}
