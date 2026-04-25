import { useState } from "react";
import Icon from "@/components/ui/icon";
import { useAuth } from "@/lib/useAuth";

interface AuthModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

const ROLES = [
  { id: "farmer",    label: "Фермер",        icon: "Wheat" },
  { id: "trader",    label: "Трейдер",        icon: "TrendingUp" },
  { id: "agronomist",label: "Агроном",        icon: "Sprout" },
  { id: "processor", label: "Переработчик",   icon: "Factory" },
  { id: "investor",  label: "Инвестор",       icon: "BarChart3" },
  { id: "manager",   label: "Руководитель АПК",icon: "Building2" },
];

export default function AuthModal({ onClose, onSuccess }: AuthModalProps) {
  const { login, register, forgotPassword } = useAuth();
  const [mode, setMode] = useState<"login" | "register" | "forgot">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [role, setRole] = useState("farmer");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(""); setSuccess(""); setLoading(true);
    try {
      if (mode === "login") {
        await login(email, password);
        onSuccess();
      } else if (mode === "register") {
        const r = await register(email, password, fullName, role);
        setSuccess(r.message || "Регистрация успешна! Проверьте почту.");
        setTimeout(onSuccess, 1500);
      } else {
        const r = await forgotPassword(email);
        setSuccess(r.message || "Письмо отправлено");
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Ошибка");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-fade-in">

        {/* Шапка */}
        <div className="hero-gradient p-6 relative overflow-hidden">
          <div className="hero-gradient-overlay absolute inset-0" />
          <div className="relative flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Icon name="Wheat" size={20} className="text-white" />
                <span className="font-heading font-black text-white text-lg">АгроПорт</span>
              </div>
              <p className="text-white/70 text-xs font-body">
                {mode === "login" ? "Вход в личный кабинет" :
                 mode === "register" ? "Создать аккаунт" : "Восстановление пароля"}
              </p>
            </div>
            <button onClick={onClose}
              className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-white hover:bg-white/30 transition-colors">
              <Icon name="X" size={16} />
            </button>
          </div>
        </div>

        {/* Форма */}
        <div className="p-6">
          {error && (
            <div className="mb-4 p-3 bg-destructive/10 border border-destructive/25 rounded-xl flex items-center gap-2 text-sm text-destructive">
              <Icon name="AlertCircle" size={14} />
              {error}
            </div>
          )}
          {success && (
            <div className="mb-4 p-3 bg-primary/10 border border-primary/25 rounded-xl flex items-center gap-2 text-sm text-primary">
              <Icon name="CheckCircle2" size={14} />
              {success}
            </div>
          )}

          <form onSubmit={submit} className="space-y-4">
            {mode === "register" && (
              <div>
                <label className="text-xs text-muted-foreground mb-1.5 block font-medium">Ваше имя</label>
                <input value={fullName} onChange={e => setFullName(e.target.value)}
                  placeholder="Иван Петров"
                  className="w-full px-4 py-2.5 rounded-xl border border-border bg-secondary/30 text-sm focus:outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/10 transition-all"
                />
              </div>
            )}

            <div>
              <label className="text-xs text-muted-foreground mb-1.5 block font-medium">Email</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                placeholder="email@company.ru" required
                className="w-full px-4 py-2.5 rounded-xl border border-border bg-secondary/30 text-sm focus:outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/10 transition-all"
              />
            </div>

            {mode !== "forgot" && (
              <div>
                <label className="text-xs text-muted-foreground mb-1.5 block font-medium">Пароль</label>
                <div className="relative">
                  <input type={showPass ? "text" : "password"} value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="Минимум 6 символов" required
                    className="w-full px-4 py-2.5 pr-10 rounded-xl border border-border bg-secondary/30 text-sm focus:outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/10 transition-all"
                  />
                  <button type="button" onClick={() => setShowPass(v => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                    <Icon name={showPass ? "EyeOff" : "Eye"} size={15} />
                  </button>
                </div>
              </div>
            )}

            {mode === "register" && (
              <div>
                <label className="text-xs text-muted-foreground mb-2 block font-medium">Я — <span className="text-primary">{ROLES.find(r => r.id === role)?.label}</span></label>
                <div className="grid grid-cols-3 gap-2">
                  {ROLES.map(r => (
                    <button key={r.id} type="button" onClick={() => setRole(r.id)}
                      className={`flex flex-col items-center gap-1 p-2.5 rounded-xl border text-xs font-medium transition-all
                        ${role === r.id ? "bg-primary text-white border-primary shadow-md" : "bg-secondary/40 text-muted-foreground border-border hover:border-primary/40"}`}>
                      <Icon name={r.icon as string} size={16} />
                      {r.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <button type="submit" disabled={loading}
              className="w-full hero-gradient text-white font-bold py-3 rounded-xl text-sm hover:opacity-90 transition-opacity shadow-lg disabled:opacity-60 flex items-center justify-center gap-2">
              {loading && <Icon name="Loader" size={14} className="animate-spin" />}
              {mode === "login" ? "Войти" : mode === "register" ? "Зарегистрироваться" : "Отправить письмо"}
            </button>
          </form>

          {/* Переключатели */}
          <div className="mt-4 flex flex-col items-center gap-2 text-xs text-muted-foreground">
            {mode === "login" && (
              <>
                <button onClick={() => { setMode("register"); setError(""); }}
                  className="text-primary hover:underline font-medium">
                  Нет аккаунта? Зарегистрироваться
                </button>
                <button onClick={() => { setMode("forgot"); setError(""); }}
                  className="hover:text-foreground transition-colors">
                  Забыли пароль?
                </button>
              </>
            )}
            {mode === "register" && (
              <button onClick={() => { setMode("login"); setError(""); }}
                className="text-primary hover:underline font-medium">
                Уже есть аккаунт? Войти
              </button>
            )}
            {mode === "forgot" && (
              <button onClick={() => { setMode("login"); setError(""); }}
                className="text-primary hover:underline font-medium">
                ← Вернуться ко входу
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
