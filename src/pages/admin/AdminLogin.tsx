import { useState } from "react";
import { adminApi, adminToken } from "@/lib/adminApi";
import Icon from "@/components/ui/icon";

interface Props {
  onLogin: () => void;
}

export default function AdminLogin({ onLogin }: Props) {
  const [form, setForm] = useState({ login: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPw, setShowPw] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await adminApi.login(form.login, form.password);
      adminToken.set(res.token);
      onLogin();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Ошибка входа");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="hero-gradient rounded-2xl p-6 mb-6 text-center relative overflow-hidden">
          <div className="hero-gradient-overlay absolute inset-0" />
          <div className="relative">
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center mx-auto mb-3">
              <Icon name="ShieldCheck" size={24} className="text-white" />
            </div>
            <h1 className="font-heading font-black text-xl text-white">АгроПорт</h1>
            <p className="text-white/60 text-xs mt-1">Кабинет администратора</p>
          </div>
        </div>

        <form onSubmit={submit} className="glass-card rounded-2xl p-6 space-y-4">
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1.5">Логин</label>
            <input
              type="text"
              value={form.login}
              onChange={e => setForm(f => ({ ...f, login: e.target.value }))}
              className="w-full px-3 py-2.5 rounded-xl border border-border bg-background text-sm focus:outline-none focus:border-primary transition-colors"
              placeholder="Введите логин"
              autoComplete="username"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1.5">Пароль</label>
            <div className="relative">
              <input
                type={showPw ? "text" : "password"}
                value={form.password}
                onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                className="w-full px-3 py-2.5 pr-10 rounded-xl border border-border bg-background text-sm focus:outline-none focus:border-primary transition-colors"
                placeholder="Введите пароль"
                autoComplete="current-password"
              />
              <button type="button" onClick={() => setShowPw(p => !p)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                <Icon name={showPw ? "EyeOff" : "Eye"} size={15} />
              </button>
            </div>
          </div>

          {error && (
            <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-xl flex items-center gap-2">
              <Icon name="AlertCircle" size={13} className="text-destructive shrink-0" />
              <span className="text-xs text-destructive">{error}</span>
            </div>
          )}

          <button type="submit" disabled={loading || !form.login || !form.password}
            className="w-full py-3 hero-gradient text-white font-heading font-bold rounded-xl text-sm disabled:opacity-60 flex items-center justify-center gap-2">
            {loading
              ? <><Icon name="Loader" size={15} className="animate-spin" />Вход…</>
              : <><Icon name="LogIn" size={15} />Войти в кабинет</>
            }
          </button>
        </form>
      </div>
    </div>
  );
}
