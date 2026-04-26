import { useState, useEffect } from "react";
import Icon from "@/components/ui/icon";
import { ALERTS } from "./data";
import { usePushNotifications } from "@/lib/usePushNotifications";
import {
  AlertFilter, Trigger,
  loadTriggers, saveTriggers,
} from "./AlertsTypes";
import AlertsEventsTab from "./AlertsEventsTab";
import AlertsTriggersTab from "./AlertsTriggersTab";
import AlertsIntegrationsSection from "./AlertsIntegrationsSection";

interface BusinessAlertsIntegrationsProps {
  activeSection: string;
}

export default function BusinessAlertsIntegrations({ activeSection }: BusinessAlertsIntegrationsProps) {

  // ── Push notifications ────────────────────────────────────────────────────
  const { status: pushStatus, requestPermission, showTestNotification } = usePushNotifications();
  const [pushRequesting, setPushRequesting] = useState(false);

  const handleEnablePush = async () => {
    setPushRequesting(true);
    await requestPermission();
    setPushRequesting(false);
  };

  // ── Alerts tab state ──────────────────────────────────────────────────────
  const [alertsTab, setAlertsTab] = useState<"events" | "triggers">("events");
  const [filter, setFilter] = useState<AlertFilter>("all");
  const [readIds, setReadIds] = useState<Set<number>>(new Set());

  // ── Triggers state ────────────────────────────────────────────────────────
  const [triggers, setTriggers] = useState<Trigger[]>(() => loadTriggers());

  useEffect(() => { saveTriggers(triggers); }, [triggers]);

  // ── Derived values ────────────────────────────────────────────────────────
  const counts: Record<AlertFilter, number> = {
    all:      ALERTS.length,
    critical: ALERTS.filter(a => a.type === "critical").length,
    warning:  ALERTS.filter(a => a.type === "warning").length,
    info:     ALERTS.filter(a => a.type === "info").length,
  };

  const filteredAlerts = filter === "all"
    ? ALERTS
    : ALERTS.filter(a => {
        if (filter === "critical") return a.type === "critical";
        if (filter === "warning")  return a.type === "warning";
        if (filter === "info")     return a.type === "info";
        return true;
      });

  const unreadCount = ALERTS.length - readIds.size;

  // ── Handlers ──────────────────────────────────────────────────────────────
  const handleMarkRead = (id: number) => {
    setReadIds(prev => new Set([...prev, id]));
  };

  const handleMarkAllRead = () => {
    setReadIds(new Set(ALERTS.map(a => a.id)));
  };

  const handleAddTrigger = (t: Trigger) => {
    setTriggers(prev => [t, ...prev]);
  };

  const handleDeleteTrigger = (id: string) => {
    setTriggers(prev => prev.filter(t => t.id !== id));
  };

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <>
      {/* ALERTS SECTION */}
      {activeSection === "alerts" && (
        <div className="space-y-5 animate-fade-in">

          {/* Hero */}
          <div className="hero-gradient rounded-2xl p-5 relative overflow-hidden shadow-md">
            <div className="hero-gradient-overlay absolute inset-0" />
            <div className="bg-dots absolute inset-0 opacity-15" />
            <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <Icon name="Bell" size={13} className="text-white/70" />
                  <span className="text-white/55 text-xs font-mono uppercase tracking-widest">АгроПорт · Алерты</span>
                </div>
                <h1 className="font-heading font-black text-2xl sm:text-3xl text-white leading-tight">
                  Центр <span className="gold-text">уведомлений</span>
                </h1>
                <p className="text-white/60 text-sm mt-1 font-body">
                  Критические события · погода · цены · госрегулирование
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {unreadCount > 0 && (
                  <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-red-500/80 border border-red-300/40 text-white text-xs font-bold font-mono">
                    <Icon name="BellRing" size={11} />
                    {unreadCount} новых
                  </span>
                )}
                <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/15 border border-white/25 text-white text-xs font-mono">
                  <Icon name="Zap" size={10} />
                  LIVE
                </span>
              </div>
            </div>
          </div>

          {/* Push-уведомления */}
          {pushStatus !== "unsupported" && (
            <div className={`rounded-2xl p-4 flex items-center gap-4 border ${
              pushStatus === "granted"
                ? "bg-primary/8 border-primary/20"
                : pushStatus === "denied"
                ? "bg-destructive/8 border-destructive/20"
                : "bg-amber-50 border-amber-200"
            }`}>
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                pushStatus === "granted" ? "bg-primary/15 text-primary"
                : pushStatus === "denied" ? "bg-destructive/15 text-destructive"
                : "bg-amber-100 text-amber-600"
              }`}>
                <Icon name={pushStatus === "granted" ? "BellRing" : pushStatus === "denied" ? "BellOff" : "Bell"} size={18} />
              </div>
              <div className="flex-1 min-w-0">
                {pushStatus === "granted" && (
                  <>
                    <p className="text-sm font-semibold text-primary">Push-уведомления включены</p>
                    <p className="text-xs text-muted-foreground mt-0.5">Триггеры проверяются каждые 5 минут. Сигнал придёт даже с закрытым сайтом.</p>
                  </>
                )}
                {pushStatus === "denied" && (
                  <>
                    <p className="text-sm font-semibold text-destructive">Push-уведомления заблокированы</p>
                    <p className="text-xs text-muted-foreground mt-0.5">Разрешите уведомления в настройках браузера для этого сайта.</p>
                  </>
                )}
                {pushStatus === "default" && (
                  <>
                    <p className="text-sm font-semibold text-amber-700">Включите push-уведомления</p>
                    <p className="text-xs text-muted-foreground mt-0.5">Браузер сообщит о сработавшем триггере даже когда сайт закрыт.</p>
                  </>
                )}
              </div>
              <div className="flex gap-2 shrink-0">
                {pushStatus === "granted" && (
                  <button
                    onClick={showTestNotification}
                    className="px-3 py-1.5 text-xs rounded-lg border border-primary/30 text-primary bg-primary/8 hover:bg-primary/15 font-medium transition-colors"
                  >
                    Тест
                  </button>
                )}
                {pushStatus === "default" && (
                  <button
                    onClick={handleEnablePush}
                    disabled={pushRequesting}
                    className="px-4 py-2 text-xs rounded-xl bg-primary text-white font-semibold hover:bg-primary/90 transition-colors disabled:opacity-60"
                  >
                    {pushRequesting ? "..." : "Включить"}
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Inner tabs */}
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div className="flex gap-1 bg-secondary p-1 rounded-xl shadow-inner">
              {(["events", "triggers"] as const).map(t => (
                <button
                  key={t}
                  onClick={() => setAlertsTab(t)}
                  className={`flex items-center gap-1.5 px-4 py-2 text-xs rounded-lg font-semibold transition-all
                    ${alertsTab === t
                      ? "bg-white text-primary shadow-sm border border-border"
                      : "text-muted-foreground hover:text-foreground"}`}
                >
                  <Icon name={t === "events" ? "BellRing" : "SlidersHorizontal"} size={12} />
                  {t === "events" ? "Активные события" : "Настройка триггеров"}
                  {t === "events" && unreadCount > 0 && (
                    <span className="ml-0.5 px-1.5 py-0.5 rounded-full bg-red-100 text-red-600 text-[10px] font-bold">
                      {unreadCount}
                    </span>
                  )}
                  {t === "triggers" && triggers.length > 0 && (
                    <span className="ml-0.5 px-1.5 py-0.5 rounded-full bg-primary/10 text-primary text-[10px] font-bold">
                      {triggers.length}
                    </span>
                  )}
                </button>
              ))}
            </div>

            {alertsTab === "events" && unreadCount > 0 && (
              <button
                onClick={handleMarkAllRead}
                className="flex items-center gap-1.5 text-xs text-primary/70 hover:text-primary transition-colors font-medium"
              >
                <Icon name="CheckCheck" size={13} />
                Прочитать все
              </button>
            )}
          </div>

          {/* Tab content */}
          {alertsTab === "events" && (
            <AlertsEventsTab
              filter={filter}
              counts={counts}
              readIds={readIds}
              filteredAlerts={filteredAlerts}
              onFilterChange={setFilter}
              onMarkRead={handleMarkRead}
            />
          )}

          {alertsTab === "triggers" && (
            <AlertsTriggersTab
              triggers={triggers}
              onAddTrigger={handleAddTrigger}
              onDeleteTrigger={handleDeleteTrigger}
              onClearAll={() => setTriggers([])}
            />
          )}
        </div>
      )}

      {/* INTEGRATIONS SECTION */}
      {activeSection === "integrations" && (
        <AlertsIntegrationsSection />
      )}
    </>
  );
}
