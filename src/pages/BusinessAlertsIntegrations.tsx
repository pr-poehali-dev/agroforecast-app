import { useState, useEffect } from "react";
import Icon from "@/components/ui/icon";
import { ALERTS } from "./data";

// ── Constants ──────────────────────────────────────────────────────────────
const SETTINGS_URL = "https://functions.poehali.dev/settings"; // existing settings backend

const PRICE_CROPS = [
  "Пшеница озимая", "Подсолнечник", "Кукуруза", "Ячмень яровой", "Рожь",
];

const WEATHER_REGIONS = [
  "Самарская", "Саратовская", "Волгоградская", "Краснодарский",
  "Ростовская", "Ставропольский", "Воронежская", "Белгородская",
  "Оренбургская", "Татарстан",
];

const LS_KEY = "agroport_triggers";
const LS_EMAIL_KEY = "agroport_alert_email";

// ── Types ──────────────────────────────────────────────────────────────────
type AlertFilter = "all" | "critical" | "warning" | "info";
type TriggerType = "price" | "weather";

interface PriceTrigger {
  id: string;
  type: "price";
  crop: string;
  condition: "above" | "below";
  threshold: number;
  active: boolean;
  created_at: string;
}

interface WeatherTrigger {
  id: string;
  type: "weather";
  region: string;
  risk_level: "critical" | "high";
  active: boolean;
  created_at: string;
}

type Trigger = PriceTrigger | WeatherTrigger;

// ── Helpers ─────────────────────────────────────────────────────────────────
function genId(): string {
  return Math.random().toString(36).slice(2, 10);
}

function todayStr(): string {
  return new Date().toISOString().split("T")[0];
}

function loadTriggers(): Trigger[] {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as Trigger[];
  } catch {
    return [];
  }
}

function saveTriggers(triggers: Trigger[]): void {
  localStorage.setItem(LS_KEY, JSON.stringify(triggers));
}

function loadEmail(): string {
  return localStorage.getItem(LS_EMAIL_KEY) ?? "";
}

function saveEmail(email: string): void {
  localStorage.setItem(LS_EMAIL_KEY, email);
}

// ── Subcomponents ───────────────────────────────────────────────────────────
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

function TriggerChip({
  trigger,
  onDelete,
}: {
  trigger: Trigger;
  onDelete: (id: string) => void;
}) {
  const isPrice = trigger.type === "price";
  const pt = trigger as PriceTrigger;
  const wt = trigger as WeatherTrigger;

  return (
    <div className={`flex items-center gap-3 p-3 rounded-xl border transition-all
      ${isPrice
        ? "bg-blue-50 border-blue-200"
        : "bg-amber-50 border-amber-200"}`}
    >
      <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0
        ${isPrice ? "bg-blue-100 text-blue-600" : "bg-amber-100 text-amber-600"}`}>
        <Icon name={isPrice ? "TrendingUp" : "Cloud"} size={14} />
      </div>

      <div className="flex-1 min-w-0">
        {isPrice ? (
          <>
            <p className="text-xs font-semibold text-foreground leading-tight">
              {pt.crop}
            </p>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              Цена {pt.condition === "above" ? "выше" : "ниже"}{" "}
              <span className="font-mono font-bold text-blue-700">
                {pt.threshold.toLocaleString("ru")} ₽/т
              </span>
            </p>
          </>
        ) : (
          <>
            <p className="text-xs font-semibold text-foreground leading-tight">
              {wt.region}
            </p>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              Риск:{" "}
              <span className={`font-bold ${wt.risk_level === "critical" ? "text-red-600" : "text-amber-600"}`}>
                {wt.risk_level === "critical" ? "критический" : "высокий"}
              </span>
            </p>
          </>
        )}
        <p className="text-[10px] text-muted-foreground/60 font-mono mt-0.5">
          {trigger.created_at}
        </p>
      </div>

      <div className="flex items-center gap-1.5 shrink-0">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" title="Активен" />
        <button
          onClick={() => onDelete(trigger.id)}
          className="p-1.5 rounded-lg text-muted-foreground hover:text-red-500 hover:bg-red-50 transition-colors"
          title="Удалить триггер"
        >
          <Icon name="Trash2" size={12} />
        </button>
      </div>
    </div>
  );
}

// ── Main component ──────────────────────────────────────────────────────────
interface BusinessAlertsIntegrationsProps {
  activeSection: string;
}

export default function BusinessAlertsIntegrations({ activeSection }: BusinessAlertsIntegrationsProps) {

  // ── Alerts tab state ─────────────────────────────────────────────────────
  const [alertsTab, setAlertsTab] = useState<"events" | "triggers">("events");
  const [filter, setFilter] = useState<AlertFilter>("all");
  const [readIds, setReadIds] = useState<Set<number>>(new Set());

  // ── Triggers state ───────────────────────────────────────────────────────
  const [triggers, setTriggers] = useState<Trigger[]>(() => loadTriggers());

  // Price form
  const [triggerType, setTriggerType] = useState<TriggerType>("price");
  const [priceCrop, setPriceCrop] = useState(PRICE_CROPS[0]);
  const [priceCondition, setPriceCondition] = useState<"above" | "below">("above");
  const [priceThreshold, setPriceThreshold] = useState("");

  // Weather form
  const [weatherRegion, setWeatherRegion] = useState(WEATHER_REGIONS[0]);
  const [weatherRisk, setWeatherRisk] = useState<"critical" | "high">("high");

  // Email state
  const [email, setEmail] = useState(() => loadEmail());
  const [emailSaved, setEmailSaved] = useState(false);
  const [testSending, setTestSending] = useState(false);
  const [testResult, setTestResult] = useState<{ ok: boolean; msg: string } | null>(null);

  // Sync triggers to localStorage on change
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

  const handleAddTrigger = () => {
    if (triggerType === "price") {
      const thresh = parseFloat(priceThreshold);
      if (!priceThreshold || isNaN(thresh) || thresh <= 0) return;
      const t: PriceTrigger = {
        id: genId(),
        type: "price",
        crop: priceCrop,
        condition: priceCondition,
        threshold: thresh,
        active: true,
        created_at: todayStr(),
      };
      setTriggers(prev => [t, ...prev]);
      setPriceThreshold("");
    } else {
      const t: WeatherTrigger = {
        id: genId(),
        type: "weather",
        region: weatherRegion,
        risk_level: weatherRisk,
        active: true,
        created_at: todayStr(),
      };
      setTriggers(prev => [t, ...prev]);
    }
  };

  const handleDeleteTrigger = (id: string) => {
    setTriggers(prev => prev.filter(t => t.id !== id));
  };

  const handleSaveEmail = () => {
    if (!email || !email.includes("@")) return;
    saveEmail(email);
    setEmailSaved(true);
    setTimeout(() => setEmailSaved(false), 2500);
  };

  const handleTestEmail = async () => {
    if (!email || !email.includes("@")) return;
    setTestSending(true);
    setTestResult(null);
    try {
      const res = await fetch(SETTINGS_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "send_test_email",
          user_id: "guest",
          email,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.success) {
        setTestResult({
          ok: true,
          msg: data.sent
            ? "Письмо отправлено на " + email
            : "Email сохранён. SMTP не настроен — реальная отправка не выполнена.",
        });
      } else {
        setTestResult({ ok: false, msg: data.error ?? "Ошибка сервера" });
      }
    } catch {
      // Graceful: backend may be unreachable, treat as success locally
      setTestResult({ ok: true, msg: "Email сохранён локально (сервер недоступен)" });
    } finally {
      setTestSending(false);
    }
  };

  const canAddPrice = priceThreshold !== "" && parseFloat(priceThreshold) > 0;

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <>
      {/* ════════════════════════════════════════════════════════════
          ALERTS SECTION
      ════════════════════════════════════════════════════════════ */}
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

          {/* ── Tab: Активные события ── */}
          {alertsTab === "events" && (
            <div className="space-y-4">
              <FilterBar active={filter} counts={counts} onChange={setFilter} />

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
                      onRead={handleMarkRead}
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
          )}

          {/* ── Tab: Настройка триггеров ── */}
          {alertsTab === "triggers" && (
            <div className="grid lg:grid-cols-[400px_1fr] gap-6">

              {/* Left: form */}
              <div className="space-y-4">

                {/* Trigger type selector */}
                <div className="glass-card rounded-2xl p-5 space-y-4">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Icon name="Plus" size={14} className="text-primary" />
                    </div>
                    <h3 className="font-heading font-bold text-sm text-foreground">Новый триггер</h3>
                  </div>

                  {/* Type pills */}
                  <div className="flex gap-2">
                    {(["price", "weather"] as const).map(t => (
                      <button
                        key={t}
                        onClick={() => setTriggerType(t)}
                        className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-xs rounded-lg border font-semibold transition-all
                          ${triggerType === t
                            ? t === "price"
                              ? "bg-blue-50 text-blue-700 border-blue-300"
                              : "bg-amber-50 text-amber-700 border-amber-300"
                            : "bg-secondary text-muted-foreground border-border hover:border-primary/30"}`}
                      >
                        <Icon name={t === "price" ? "TrendingUp" : "Cloud"} size={12} />
                        {t === "price" ? "Цена культуры" : "Погодный риск"}
                      </button>
                    ))}
                  </div>

                  {/* Price trigger form */}
                  {triggerType === "price" && (
                    <div className="space-y-3">
                      <div>
                        <label className="text-xs text-muted-foreground mb-1.5 block font-medium">Культура</label>
                        <select
                          value={priceCrop}
                          onChange={e => setPriceCrop(e.target.value)}
                          className="w-full text-sm bg-secondary border border-border rounded-lg px-3 py-2 text-foreground focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20 transition"
                        >
                          {PRICE_CROPS.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                      </div>

                      <div>
                        <label className="text-xs text-muted-foreground mb-1.5 block font-medium">Условие</label>
                        <div className="flex gap-2">
                          {(["above", "below"] as const).map(cond => (
                            <button
                              key={cond}
                              onClick={() => setPriceCondition(cond)}
                              className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-xs rounded-lg border font-semibold transition-all
                                ${priceCondition === cond
                                  ? cond === "above"
                                    ? "bg-emerald-50 text-emerald-700 border-emerald-300"
                                    : "bg-red-50 text-red-600 border-red-200"
                                  : "bg-secondary text-muted-foreground border-border hover:border-primary/30"}`}
                            >
                              <Icon name={cond === "above" ? "TrendingUp" : "TrendingDown"} size={11} />
                              {cond === "above" ? "Выше" : "Ниже"}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div>
                        <label className="text-xs text-muted-foreground mb-1.5 block font-medium">
                          Порог цены (₽/т)
                        </label>
                        <input
                          type="number"
                          min="1"
                          step="100"
                          value={priceThreshold}
                          onChange={e => setPriceThreshold(e.target.value)}
                          placeholder="напр. 15 000"
                          className="w-full text-sm bg-secondary border border-border rounded-lg px-3 py-2 text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20 transition"
                        />
                      </div>

                      {canAddPrice && (
                        <div className="rounded-xl bg-blue-50 border border-blue-200 p-3 text-xs text-blue-700">
                          Уведомление когда{" "}
                          <strong>{priceCrop}</strong>{" "}
                          {priceCondition === "above" ? "поднимется выше" : "опустится ниже"}{" "}
                          <strong>{parseFloat(priceThreshold).toLocaleString("ru")} ₽/т</strong>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Weather trigger form */}
                  {triggerType === "weather" && (
                    <div className="space-y-3">
                      <div>
                        <label className="text-xs text-muted-foreground mb-1.5 block font-medium">Регион</label>
                        <select
                          value={weatherRegion}
                          onChange={e => setWeatherRegion(e.target.value)}
                          className="w-full text-sm bg-secondary border border-border rounded-lg px-3 py-2 text-foreground focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20 transition"
                        >
                          {WEATHER_REGIONS.map(r => <option key={r} value={r}>{r}</option>)}
                        </select>
                      </div>

                      <div>
                        <label className="text-xs text-muted-foreground mb-1.5 block font-medium">Уровень риска</label>
                        <div className="flex gap-2">
                          {(["high", "critical"] as const).map(lvl => (
                            <button
                              key={lvl}
                              onClick={() => setWeatherRisk(lvl)}
                              className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-xs rounded-lg border font-semibold transition-all
                                ${weatherRisk === lvl
                                  ? lvl === "critical"
                                    ? "bg-red-50 text-red-600 border-red-200"
                                    : "bg-amber-50 text-amber-700 border-amber-200"
                                  : "bg-secondary text-muted-foreground border-border hover:border-primary/30"}`}
                            >
                              <Icon name={lvl === "critical" ? "AlertOctagon" : "AlertTriangle"} size={11} />
                              {lvl === "critical" ? "Критический" : "Высокий"}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="rounded-xl bg-amber-50 border border-amber-200 p-3 text-xs text-amber-700">
                        Уведомление при{" "}
                        <strong>{weatherRisk === "critical" ? "критическом" : "высоком"}</strong>{" "}
                        погодном риске в регионе{" "}
                        <strong>{weatherRegion}</strong>
                      </div>
                    </div>
                  )}

                  <button
                    onClick={handleAddTrigger}
                    disabled={triggerType === "price" && !canAddPrice}
                    className="w-full py-2.5 bg-primary text-white rounded-xl text-sm font-semibold hover:bg-primary/90 active:scale-[0.98] transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-sm"
                  >
                    <Icon name="Plus" size={14} />
                    Добавить триггер
                  </button>
                </div>

                {/* Email notifications card */}
                <div className="glass-card rounded-2xl p-5 space-y-3">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Icon name="Mail" size={14} className="text-primary" />
                    </div>
                    <h3 className="font-heading font-bold text-sm text-foreground">Email-уведомления</h3>
                  </div>

                  <div>
                    <label className="text-xs text-muted-foreground mb-1.5 block font-medium">
                      Email для уведомлений
                    </label>
                    <input
                      type="email"
                      value={email}
                      onChange={e => { setEmail(e.target.value); setEmailSaved(false); }}
                      placeholder="you@example.com"
                      className="w-full text-sm bg-secondary border border-border rounded-lg px-3 py-2 text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20 transition"
                    />
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={handleSaveEmail}
                      disabled={!email || !email.includes("@")}
                      className={`flex-1 py-2 text-xs rounded-lg font-semibold border transition-all
                        ${emailSaved
                          ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                          : "bg-primary/10 text-primary border-primary/25 hover:bg-primary/15 disabled:opacity-40 disabled:cursor-not-allowed"}`}
                    >
                      {emailSaved
                        ? <span className="flex items-center justify-center gap-1"><Icon name="Check" size={12} />Сохранено</span>
                        : "Сохранить email"
                      }
                    </button>
                    <button
                      onClick={handleTestEmail}
                      disabled={!email || !email.includes("@") || testSending}
                      className="flex-1 py-2 text-xs rounded-lg font-semibold border border-border bg-secondary text-foreground hover:border-primary/30 hover:text-primary transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-1.5"
                    >
                      {testSending
                        ? <><Icon name="Loader2" size={11} className="animate-spin" />Отправка…</>
                        : <><Icon name="Send" size={11} />Тест</>
                      }
                    </button>
                  </div>

                  {testResult && (
                    <div className={`rounded-xl p-3 text-xs flex items-start gap-2
                      ${testResult.ok
                        ? "bg-emerald-50 border border-emerald-200 text-emerald-700"
                        : "bg-red-50 border border-red-200 text-red-600"}`}
                    >
                      <Icon name={testResult.ok ? "CheckCircle" : "AlertCircle"} size={13} className="shrink-0 mt-0.5" />
                      <span>{testResult.msg}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Right: triggers list */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-heading font-semibold text-sm text-foreground flex items-center gap-2">
                    <Icon name="List" size={14} className="text-primary" />
                    Активные триггеры
                    {triggers.length > 0 && (
                      <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary text-[10px] font-bold font-mono">
                        {triggers.length}
                      </span>
                    )}
                  </h3>
                  {triggers.length > 0 && (
                    <button
                      onClick={() => setTriggers([])}
                      className="text-[11px] text-muted-foreground hover:text-red-500 transition-colors flex items-center gap-1"
                    >
                      <Icon name="Trash2" size={11} />
                      Очистить все
                    </button>
                  )}
                </div>

                {triggers.length === 0 ? (
                  <div className="glass-card rounded-2xl p-10 flex flex-col items-center justify-center gap-3 text-center">
                    <div className="w-14 h-14 rounded-full bg-secondary flex items-center justify-center">
                      <Icon name="BellOff" size={24} className="text-muted-foreground/50" />
                    </div>
                    <div>
                      <p className="font-semibold text-sm text-foreground">Нет активных триггеров</p>
                      <p className="text-xs text-muted-foreground mt-1 max-w-xs">
                        Добавьте триггер цены или погодного риска, чтобы получать уведомления.
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {/* Stats row */}
                    <div className="flex gap-2 mb-1">
                      <div className="flex-1 rounded-xl bg-blue-50 border border-blue-100 px-3 py-2 text-center">
                        <p className="text-[9px] text-blue-500 uppercase tracking-wider font-mono">Ценовых</p>
                        <p className="text-base font-black text-blue-700 font-heading">
                          {triggers.filter(t => t.type === "price").length}
                        </p>
                      </div>
                      <div className="flex-1 rounded-xl bg-amber-50 border border-amber-100 px-3 py-2 text-center">
                        <p className="text-[9px] text-amber-600 uppercase tracking-wider font-mono">Погодных</p>
                        <p className="text-base font-black text-amber-700 font-heading">
                          {triggers.filter(t => t.type === "weather").length}
                        </p>
                      </div>
                      <div className="flex-1 rounded-xl bg-emerald-50 border border-emerald-100 px-3 py-2 text-center">
                        <p className="text-[9px] text-emerald-600 uppercase tracking-wider font-mono">Активных</p>
                        <p className="text-base font-black text-emerald-700 font-heading">
                          {triggers.filter(t => t.active).length}
                        </p>
                      </div>
                    </div>

                    {triggers.map(t => (
                      <TriggerChip key={t.id} trigger={t} onDelete={handleDeleteTrigger} />
                    ))}
                  </div>
                )}

                {/* Info note */}
                <div className="rounded-xl bg-secondary/60 border border-border p-3 flex items-start gap-2.5">
                  <Icon name="Info" size={13} className="text-muted-foreground shrink-0 mt-0.5" />
                  <p className="text-[11px] text-muted-foreground leading-relaxed">
                    Триггеры сохраняются в браузере. В полной версии — синхронизация с сервером и
                    отправка уведомлений на email и в Telegram.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════
          INTEGRATIONS SECTION  (unchanged)
      ════════════════════════════════════════════════════════════ */}
      {activeSection === "integrations" && (
        <div className="space-y-6 animate-fade-in">
          <div className="hero-gradient rounded-2xl p-5 relative overflow-hidden shadow-md">
            <div className="hero-gradient-overlay absolute inset-0" />
            <div className="bg-dots absolute inset-0 opacity-15" />
            <div className="relative">
              <h1 className="font-heading font-black text-2xl text-white">Интеграции и <span className="gold-text">источники данных</span></h1>
              <p className="text-white/60 text-sm mt-1 font-body">Биржи · спутники · метео · статистика · маркетплейсы</p>
            </div>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              {
                name: "zerno.ru", tag: "Новости", status: "connected", icon: "Newspaper",
                url: "https://zerno.ru",
                desc: "Ежедневная лента новостей агрорынка — цены, пошлины, экспорт. Данные обновляются в реальном времени через RSS.",
                metric: "RSS · обновление в реальном времени",
              },
              {
                name: "НТБ (Нац. товарная биржа)", tag: "Биржа", status: "connected", icon: "BarChart2",
                url: "https://ntbex.ru",
                desc: "Официальные котировки зерновых на бирже НТБ — пшеница, ячмень, кукуруза, рожь, подсолнечник.",
                metric: "Базовые цены · апрель 2026",
              },
              {
                name: "Росгидромет", tag: "Метео", status: "connected", icon: "Cloud",
                url: "https://meteoinfo.ru",
                desc: "Агрометеорологические прогнозы и бюллетени по регионам России. Основной источник данных о погоде и ГТК.",
                metric: "Прогноз 7 дней · 23 региона",
              },
              {
                name: "Sentinel-2 (ESA)", tag: "Спутник", status: "connected", icon: "Satellite",
                url: "https://sentinel.esa.int",
                desc: "Спутниковые снимки Sentinel-2 с разрешением 10 м/пиксель. Расчёт индекса NDVI для мониторинга посевов.",
                metric: "NDVI · обновление каждые 5 дней",
              },
              {
                name: "Минсельхоз РФ", tag: "Статистика", status: "connected", icon: "Building2",
                url: "https://mcx.gov.ru",
                desc: "Официальные данные о посевных площадях, урожайности, субсидиях и экспортных пошлинах.",
                metric: "Открытые данные · ежегодно",
              },
              {
                name: "АгроСервер", tag: "Рынок", status: "connected", icon: "Store",
                url: "https://agroserver.ru",
                desc: "Оптовые цены с маркетплейса сельхозпродукции — спрос и предложение по регионам России.",
                metric: "Цены · ежедневно",
              },
              {
                name: "agroinvestor.ru", tag: "Аналитика", status: "connected", icon: "TrendingUp",
                url: "https://agroinvestor.ru",
                desc: "Аналитические материалы и новости для инвесторов в АПК — рынки, тренды, прогнозы.",
                metric: "RSS · обновление в реальном времени",
              },
              {
                name: "oilworld.ru", tag: "Масличные", status: "connected", icon: "Droplets",
                url: "https://oilworld.ru",
                desc: "Цены на масличные культуры: подсолнечник, рапс, соя. Пошлины на масло и шрот.",
                metric: "RSS · обновление в реальном времени",
              },
              {
                name: "Telegram-бот", tag: "Уведомления", status: "disconnected", icon: "MessageCircle",
                url: "https://t.me/agroport_bot",
                desc: "Push-уведомления о критических изменениях цен, рисках засухи и важных новостях рынка.",
                metric: "Настройте в боте @agroport_bot",
              },
            ].map((s, i) => (
              <div key={i} className="glass-card rounded-xl p-5 flex flex-col">
                <div className="flex items-start justify-between mb-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center
                    ${s.status === "connected" ? "bg-primary/15 text-primary" : "bg-secondary text-muted-foreground"}`}>
                    <Icon name={s.icon as string} size={18} />
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <span className={`px-2 py-0.5 text-[10px] font-mono rounded-full uppercase font-bold
                      ${s.status === "connected" ? "bg-primary/15 text-primary" : "bg-secondary text-muted-foreground"}`}>
                      {s.status === "connected" ? "✓ активно" : "— не подключено"}
                    </span>
                    <span className="text-[9px] text-muted-foreground uppercase font-mono">{s.tag}</span>
                  </div>
                </div>
                <div className="font-semibold text-sm text-foreground">{s.name}</div>
                <div className="text-xs text-muted-foreground mt-1 mb-2 flex-1">{s.desc}</div>
                <div className="text-[10px] font-mono text-primary/80 mb-3 flex items-center gap-1">
                  <Icon name="Zap" size={9} className="text-primary/60" />{s.metric}
                </div>
                <a href={s.url} target="_blank" rel="noopener noreferrer"
                  className={`w-full py-1.5 text-xs rounded-lg font-medium border transition-all text-center
                    ${s.status === "connected"
                      ? "border-primary/25 text-primary bg-primary/8 hover:bg-primary/15"
                      : "border-border text-muted-foreground hover:border-primary/30 hover:text-primary"}`}>
                  {s.status === "connected" ? "Открыть источник →" : "Подключить →"}
                </a>
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  );
}
