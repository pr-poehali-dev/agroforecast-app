import { useState } from "react";
import Icon from "@/components/ui/icon";
import { apiAuth, setToken } from "@/lib/auth";

interface AuthPageProps {
  onLogin: (isNew?: boolean) => void;
  onOpenDocs?: () => void;
}

const ROLES = [
  { value: "farmer",     label: "Фермер" },
  { value: "trader",     label: "Трейдер" },
  { value: "agronomist", label: "Агроном" },
  { value: "processor",  label: "Переработчик" },
  { value: "investor",   label: "Инвестор" },
];

export default function AuthPage({ onLogin, onOpenDocs }: AuthPageProps) {
  const [mode, setMode] = useState<"login" | "register" | "verify">("login");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [verifyToken, setVerifyToken] = useState("");
  const [verifyCode, setVerifyCode] = useState("");
  const [form, setForm] = useState({ email: "", password: "", full_name: "", company: "", role: "farmer" });
  const [docsAccepted, setDocsAccepted] = useState(false);

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

  async function submit() {
    setError(""); setLoading(true);
    try {
      if (mode === "login") {
        const d = await apiAuth("login", { email: form.email, password: form.password });
        if (d.error) { setError(d.error); return; }
        setToken(d.token); onLogin();
      } else if (mode === "register") {
        const d = await apiAuth("register", form);
        if (d.error) { setError(d.error); return; }
        setToken(d.token);
        setVerifyToken(d.verify_token || "");
        setMode("verify");
      } else {
        const d = await apiAuth("verify", { token: verifyCode || verifyToken });
        if (d.error) { setError(d.error); return; }
        if (d.token) setToken(d.token);
        onLogin(true);
      }
    } catch { setError("Ошибка соединения. Попробуйте ещё раз."); }
    finally { setLoading(false); }
  }

  return (
    <div className="min-h-screen hero-gradient flex items-center justify-center p-4 relative overflow-hidden">
      <div className="hero-gradient-overlay absolute inset-0" />
      <div className="bg-dots absolute inset-0 opacity-20" />
      <div className="absolute -right-20 -top-20 w-96 h-96 rounded-full bg-white/5 blur-3xl pointer-events-none" />
      <div className="absolute -left-10 -bottom-10 w-64 h-64 rounded-full bg-accent/10 blur-2xl pointer-events-none" />
      <div className="relative w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-white/20 border border-white/30 flex items-center justify-center mx-auto mb-3 shadow-xl backdrop-blur-sm">
            <Icon name="Wheat" size={32} className="text-white" />
          </div>
          <h1 className="font-heading font-black text-3xl text-white">АгроПорт</h1>
          <p className="text-white/60 text-sm mt-1 font-body">Платформа агроаналитики России</p>
        </div>

        <div className="rounded-3xl p-8 shadow-2xl border border-white/20 bg-white">
          {mode !== "verify" && (
            <>
              <div className="flex gap-1 bg-secondary p-1 rounded-xl mb-6">
                {(["login", "register"] as const).map(m => (
                  <button key={m} onClick={() => { setMode(m); setError(""); }}
                    className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-all
                      ${mode === m ? "bg-white text-primary shadow-md border border-border" : "text-muted-foreground hover:text-foreground"}`}>
                    {m === "login" ? "Войти" : "Регистрация"}
                  </button>
                ))}
              </div>
              <div className="space-y-4">
                {mode === "register" && (
                  <div>
                    <label className="text-xs font-semibold text-muted-foreground mb-1.5 block uppercase tracking-wide">Ваше имя</label>
                    <div className="relative">
                      <Icon name="User" size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                      <input value={form.full_name} onChange={e => set("full_name", e.target.value)} placeholder="Иван Петров"
                        className="w-full pl-10 pr-4 py-3 rounded-xl border border-border bg-background text-sm focus:outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/10" />
                    </div>
                  </div>
                )}
                <div>
                  <label className="text-xs font-semibold text-muted-foreground mb-1.5 block uppercase tracking-wide">Email</label>
                  <div className="relative">
                    <Icon name="Mail" size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    <input type="email" value={form.email} onChange={e => set("email", e.target.value)} placeholder="email@хозяйство.ru"
                      className="w-full pl-10 pr-4 py-3 rounded-xl border border-border bg-background text-sm focus:outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/10" />
                  </div>
                </div>
                <div>
                  <label className="text-xs font-semibold text-muted-foreground mb-1.5 block uppercase tracking-wide">Пароль</label>
                  <div className="relative">
                    <Icon name="Lock" size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    <input type={showPw ? "text" : "password"} value={form.password} onChange={e => set("password", e.target.value)} placeholder="Минимум 6 символов"
                      className="w-full pl-10 pr-11 py-3 rounded-xl border border-border bg-background text-sm focus:outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/10" />
                    <button onClick={() => setShowPw(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                      <Icon name={showPw ? "EyeOff" : "Eye"} size={16} />
                    </button>
                  </div>
                </div>
                {mode === "register" && (
                  <>
                    <div>
                      <label className="text-xs font-semibold text-muted-foreground mb-1.5 block uppercase tracking-wide">Компания / Хозяйство</label>
                      <div className="relative">
                        <Icon name="Building2" size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                        <input value={form.company} onChange={e => set("company", e.target.value)} placeholder="ООО «Зерновой колос»"
                          className="w-full pl-10 pr-4 py-3 rounded-xl border border-border bg-background text-sm focus:outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/10" />
                      </div>
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-muted-foreground mb-1.5 block uppercase tracking-wide">Ваша роль</label>
                      <select value={form.role} onChange={e => set("role", e.target.value)}
                        className="w-full px-4 py-3 rounded-xl border border-border bg-background text-sm focus:outline-none focus:border-primary/50">
                        {ROLES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
                      </select>
                    </div>
                  </>
                )}
                {mode === "register" && (
                  <label className="flex items-start gap-3 cursor-pointer group">
                    <div className="relative mt-0.5 shrink-0">
                      <input
                        type="checkbox"
                        checked={docsAccepted}
                        onChange={e => setDocsAccepted(e.target.checked)}
                        className="sr-only"
                      />
                      <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-colors
                        ${docsAccepted ? "bg-primary border-primary" : "border-border bg-background group-hover:border-primary/50"}`}>
                        {docsAccepted && <Icon name="Check" size={12} className="text-white" />}
                      </div>
                    </div>
                    <p className="text-[11px] text-muted-foreground leading-relaxed">
                      Я ознакомился с{" "}
                      <button type="button" onClick={onOpenDocs} className="underline font-semibold text-foreground hover:no-underline">
                        Правилами пользования и условиями программы АгроБаллы
                      </button>
                      {" "}(1 балл = 1 ₽, оплата баллами до 50%), а также даю согласие на обработку персональных данных согласно{" "}
                      <button type="button" onClick={onOpenDocs} className="underline font-semibold text-foreground hover:no-underline">
                        152-ФЗ
                      </button>.
                    </p>
                  </label>
                )}
              </div>
            </>
          )}

          {mode === "verify" && (
            <div className="space-y-4">
              <div className="text-center mb-4">
                <div className="w-14 h-14 rounded-2xl bg-primary/15 flex items-center justify-center mx-auto mb-3">
                  <Icon name="Mail" size={24} className="text-primary" />
                </div>
                <h2 className="font-heading font-bold text-lg text-foreground">Подтвердите email</h2>
                <p className="text-sm text-muted-foreground mt-1 font-body">Письмо отправлено на <strong>{form.email}</strong></p>
              </div>
              {verifyToken && (
                <div className="p-3 bg-primary/8 border border-primary/20 rounded-xl text-xs font-mono text-primary break-all">
                  <div className="text-[10px] text-muted-foreground mb-1 font-sans uppercase tracking-wide">Код для подтверждения:</div>
                  {verifyToken}
                </div>
              )}
              <div>
                <label className="text-xs font-semibold text-muted-foreground mb-1.5 block uppercase tracking-wide">Введите код</label>
                <input value={verifyCode} onChange={e => setVerifyCode(e.target.value)} placeholder="Вставьте код из письма"
                  className="w-full px-4 py-3 rounded-xl border border-border bg-background text-sm font-mono focus:outline-none focus:border-primary/50" />
              </div>
              {verifyToken && (
                <button onClick={() => setVerifyCode(verifyToken)} className="text-xs text-primary hover:underline">
                  Использовать код автоматически →
                </button>
              )}
              <button onClick={() => setMode("login")} className="text-xs text-muted-foreground hover:text-foreground block">
                ← Вернуться ко входу
              </button>
            </div>
          )}

          {error && (
            <div className="mt-4 p-3 bg-destructive/10 border border-destructive/25 rounded-xl text-sm text-destructive flex items-center gap-2">
              <Icon name="AlertCircle" size={14} className="shrink-0" />{error}
            </div>
          )}

          <button onClick={submit} disabled={loading || (mode === "register" && !docsAccepted)}
            className="w-full mt-6 flex items-center justify-center gap-2 py-3.5 hero-gradient text-white font-heading font-bold rounded-xl text-sm shadow-lg hover:opacity-95 transition-opacity disabled:opacity-60 active:scale-[0.99]">
            {loading ? <><Icon name="Loader" size={16} className="animate-spin" />Подождите...</>
              : mode === "login" ? <><Icon name="LogIn" size={16} />Войти в платформу</>
              : mode === "register" ? <><Icon name="UserPlus" size={16} />Создать аккаунт</>
              : <><Icon name="ShieldCheck" size={16} />Подтвердить email</>}
          </button>

          <p className="text-center text-[11px] text-muted-foreground mt-5 font-body">
            {onOpenDocs ? (
              <>
                Продолжая, вы соглашаетесь с{" "}
                <button onClick={onOpenDocs} className="underline hover:no-underline text-primary">
                  условиями использования АгроПорт
                </button>
              </>
            ) : "Продолжая, вы соглашаетесь с условиями использования АгроПорт"}
          </p>
        </div>
      </div>
    </div>
  );
}