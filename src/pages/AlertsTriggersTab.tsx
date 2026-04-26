import { useState } from "react";
import Icon from "@/components/ui/icon";
import {
  Trigger, PriceTrigger, WeatherTrigger, TriggerType,
  PRICE_CROPS, WEATHER_REGIONS, SETTINGS_URL,
  genId, todayStr, loadEmail, saveEmail,
} from "./AlertsTypes";

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

interface AlertsTriggersTabProps {
  triggers: Trigger[];
  onAddTrigger: (t: Trigger) => void;
  onDeleteTrigger: (id: string) => void;
  onClearAll: () => void;
}

export default function AlertsTriggersTab({
  triggers,
  onAddTrigger,
  onDeleteTrigger,
  onClearAll,
}: AlertsTriggersTabProps) {
  const [triggerType, setTriggerType] = useState<TriggerType>("price");
  const [priceCrop, setPriceCrop] = useState(PRICE_CROPS[0]);
  const [priceCondition, setPriceCondition] = useState<"above" | "below">("above");
  const [priceThreshold, setPriceThreshold] = useState("");
  const [weatherRegion, setWeatherRegion] = useState(WEATHER_REGIONS[0]);
  const [weatherRisk, setWeatherRisk] = useState<"critical" | "high">("high");

  const [email, setEmail] = useState(() => loadEmail());
  const [emailSaved, setEmailSaved] = useState(false);
  const [testSending, setTestSending] = useState(false);
  const [testResult, setTestResult] = useState<{ ok: boolean; msg: string } | null>(null);

  const canAddPrice = priceThreshold !== "" && parseFloat(priceThreshold) > 0;

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
      onAddTrigger(t);
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
      onAddTrigger(t);
    }
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
      setTestResult({ ok: true, msg: "Email сохранён локально (сервер недоступен)" });
    } finally {
      setTestSending(false);
    }
  };

  return (
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
              onClick={onClearAll}
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
              <TriggerChip key={t.id} trigger={t} onDelete={onDeleteTrigger} />
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
  );
}
