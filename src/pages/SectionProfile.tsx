import React, { useState, useEffect } from "react";
import Icon from "@/components/ui/icon";
import { apiAuth, apiCRM, getToken, removeToken, User } from "@/lib/auth";
import SectionCRM from "./SectionCRM";

// ─── Skeleton ─────────────────────────────────────────────────────────────────

const Sk: React.FC<{ className?: string }> = ({ className = "" }) => (
  <div className={`animate-pulse bg-gray-200 rounded ${className}`} />
);

// ─── Утилиты ──────────────────────────────────────────────────────────────────

const PLAN_LABELS: Record<string, { label: string; color: string; bg: string }> = {
  free:       { label: "Бесплатный",   color: "text-gray-600",  bg: "bg-gray-100" },
  starter:    { label: "Стартер",      color: "text-blue-700",  bg: "bg-blue-100" },
  pro:        { label: "Про",          color: "text-primary",   bg: "bg-green-100" },
  enterprise: { label: "Корпоратив",   color: "text-purple-700",bg: "bg-purple-100" },
};

const ROLE_LABELS: Record<string, string> = {
  farmer:     "Фермер",
  trader:     "Трейдер",
  agronomist: "Агроном",
  processor:  "Переработчик",
  investor:   "Инвестор",
  admin:      "Администратор",
};

// ─── Компонент ────────────────────────────────────────────────────────────────

interface SectionProfileProps {
  onLogout: () => void;
}

const SectionProfile: React.FC<SectionProfileProps> = ({ onLogout }) => {
  const [tab, setTab] = useState<"profile" | "crm" | "stats">("profile");
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveOk, setSaveOk] = useState(false);
  const [form, setForm] = useState({ full_name: "", company: "", phone: "" });
  const [crmStats, setCrmStats] = useState<{contacts?: number; leads?: number; deals?: number; tasks?: number} | null>(null);

  useEffect(() => {
    if (!getToken()) { onLogout(); return; }
    apiAuth("me")
      .then((res) => {
        if (res.error) { onLogout(); return; }
        setUser(res.user || res);
        setForm({
          full_name: res.user?.full_name || res.full_name || "",
          company: res.user?.company || res.company || "",
          phone: res.user?.phone || res.phone || "",
        });
      })
      .catch(() => onLogout())
      .finally(() => setLoading(false));
  }, [onLogout]);

  useEffect(() => {
    if (tab === "crm" || tab === "stats") {
      apiCRM("dashboard")
        .then((res) => setCrmStats(res?.data || res))
        .catch(() => {});
    }
  }, [tab]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await apiAuth("update_profile", form);
      setUser((u) => u ? { ...u, ...form } : u);
      setEditMode(false);
      setSaveOk(true);
      setTimeout(() => setSaveOk(false), 3000);
    } catch {
      // ignore
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = () => {
    removeToken();
    onLogout();
  };

  const TABS = [
    { key: "profile" as const, label: "Профиль", icon: "User" },
    { key: "crm" as const,     label: "CRM",     icon: "Briefcase" },
    { key: "stats" as const,   label: "Сводка",  icon: "BarChart2" },
  ];

  const plan = user?.plan ? PLAN_LABELS[user.plan] ?? PLAN_LABELS.free : PLAN_LABELS.free;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="hero-gradient shadow-lg">
        <div className="max-w-screen-2xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between py-4 border-b border-white/15">
            <div className="flex items-center gap-3">
              {loading ? (
                <Sk className="w-10 h-10 rounded-xl" />
              ) : (
                <div className="w-10 h-10 rounded-xl bg-white/20 border border-white/30 flex items-center justify-center text-white font-bold text-lg">
                  {user?.full_name?.charAt(0) || user?.email?.charAt(0) || "?"}
                </div>
              )}
              <div>
                {loading ? (
                  <>
                    <Sk className="h-4 w-32 mb-1" />
                    <Sk className="h-3 w-20" />
                  </>
                ) : (
                  <>
                    <h1 className="text-base font-heading font-bold text-white leading-none">
                      {user?.full_name || "Личный кабинет"}
                    </h1>
                    <p className="text-white/60 text-xs mt-0.5">{user?.email}</p>
                  </>
                )}
              </div>
            </div>
            <div className="flex items-center gap-3">
              {user?.plan && (
                <span className={`text-xs font-semibold px-3 py-1 rounded-full bg-white/20 text-white`}>
                  {plan.label}
                </span>
              )}
              <button
                onClick={handleLogout}
                className="flex items-center gap-1.5 text-white/70 hover:text-white text-sm transition-colors"
              >
                <Icon name="LogOut" size={15} />
                <span className="hidden sm:inline">Выйти</span>
              </button>
            </div>
          </div>

          <div className="flex items-center gap-1 py-2 overflow-x-auto scrollbar-none">
            {TABS.map((t) => (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium whitespace-nowrap transition-all duration-200 flex-shrink-0 ${
                  tab === t.key
                    ? "bg-white text-primary shadow-md"
                    : "text-white/80 hover:text-white hover:bg-white/15"
                }`}
              >
                <Icon name={t.icon} size={16} />
                <span className="hidden sm:inline">{t.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 py-6">

        {/* ─── Профиль ──────────────────────────────────────────────────── */}
        {tab === "profile" && (
          <div className="space-y-5 max-w-2xl">

            {/* Карточка профиля */}
            <div className="glass-card rounded-2xl p-6">
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-base font-heading font-semibold text-gray-800 flex items-center gap-2">
                  <Icon name="User" size={18} className="text-primary" />
                  Данные профиля
                </h2>
                {!editMode && (
                  <button
                    onClick={() => setEditMode(true)}
                    className="text-sm text-primary flex items-center gap-1.5 hover:underline"
                  >
                    <Icon name="Pencil" size={13} />
                    Редактировать
                  </button>
                )}
              </div>

              {loading ? (
                <div className="space-y-4">
                  {Array.from({ length: 4 }).map((_, i) => <Sk key={i} className="h-10" />)}
                </div>
              ) : editMode ? (
                <div className="space-y-3">
                  {[
                    { key: "full_name", label: "Полное имя", icon: "User", type: "text" },
                    { key: "company",   label: "Компания",   icon: "Building2", type: "text" },
                    { key: "phone",     label: "Телефон",    icon: "Phone", type: "tel" },
                  ].map((f) => (
                    <div key={f.key}>
                      <label className="block text-xs font-medium text-gray-500 mb-1">{f.label}</label>
                      <div className="relative">
                        <Icon name={f.icon} size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                          type={f.type}
                          value={(form as Record<string, string>)[f.key]}
                          onChange={(e) => setForm((p) => ({ ...p, [f.key]: e.target.value }))}
                          className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-gray-200 focus:border-primary focus:ring-1 focus:ring-primary/20 outline-none text-sm"
                        />
                      </div>
                    </div>
                  ))}
                  <div className="flex gap-2 mt-4">
                    <button
                      onClick={handleSave}
                      disabled={saving}
                      className="hero-gradient text-white text-sm font-medium px-5 py-2 rounded-xl flex items-center gap-2 hover:opacity-90 disabled:opacity-50"
                    >
                      {saving ? <Icon name="Loader2" size={14} className="animate-spin" /> : <Icon name="Check" size={14} />}
                      Сохранить
                    </button>
                    <button
                      onClick={() => setEditMode(false)}
                      className="text-sm text-gray-600 bg-gray-100 hover:bg-gray-200 px-5 py-2 rounded-xl"
                    >
                      Отмена
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  {[
                    { label: "Имя", value: user?.full_name, icon: "User" },
                    { label: "Email", value: user?.email, icon: "Mail" },
                    { label: "Компания", value: user?.company, icon: "Building2" },
                    { label: "Телефон", value: user?.phone, icon: "Phone" },
                    { label: "Роль", value: ROLE_LABELS[user?.role || ""] || user?.role, icon: "Briefcase" },
                  ].map((f) => (
                    <div key={f.label} className="flex items-center gap-3 py-2.5 border-b border-gray-100 last:border-0">
                      <Icon name={f.icon} size={15} className="text-gray-400 flex-shrink-0" />
                      <span className="text-xs text-gray-500 w-24 flex-shrink-0">{f.label}</span>
                      <span className="text-sm text-gray-800 font-medium">{f.value || "—"}</span>
                    </div>
                  ))}
                </div>
              )}

              {saveOk && (
                <div className="mt-4 flex items-center gap-2 text-green-600 text-sm">
                  <Icon name="CheckCircle" size={15} />
                  Профиль обновлён
                </div>
              )}
            </div>

            {/* Тариф */}
            <div className="glass-card rounded-2xl p-6">
              <h2 className="text-base font-heading font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <Icon name="CreditCard" size={18} className="text-primary" />
                Тарифный план
              </h2>
              <div className="flex items-center gap-3">
                <span className={`text-sm font-semibold px-4 py-2 rounded-xl ${plan.bg} ${plan.color}`}>
                  {plan.label}
                </span>
                <div className="text-sm text-gray-500">
                  {user?.is_verified
                    ? <span className="flex items-center gap-1.5 text-green-600"><Icon name="ShieldCheck" size={14} /> Email подтверждён</span>
                    : <span className="flex items-center gap-1.5 text-amber-600"><Icon name="ShieldAlert" size={14} /> Email не подтверждён</span>
                  }
                </div>
              </div>
              {user?.created_at && (
                <p className="text-xs text-gray-400 mt-3 flex items-center gap-1.5">
                  <Icon name="Calendar" size={12} />
                  Зарегистрирован {new Date(user.created_at).toLocaleDateString("ru-RU", { day: "2-digit", month: "long", year: "numeric" })}
                </p>
              )}
            </div>

            {/* Выход */}
            <button
              onClick={handleLogout}
              className="w-full flex items-center justify-center gap-2 text-red-600 border border-red-200 bg-red-50 hover:bg-red-100 py-2.5 rounded-xl text-sm font-medium transition-colors"
            >
              <Icon name="LogOut" size={15} />
              Выйти из аккаунта
            </button>
          </div>
        )}

        {/* ─── CRM ──────────────────────────────────────────────────────── */}
        {tab === "crm" && (
          <div className="-mx-4 -my-6 sm:-mx-6">
            <SectionCRM />
          </div>
        )}

        {/* ─── Сводка ───────────────────────────────────────────────────── */}
        {tab === "stats" && (
          <div className="space-y-5">
            <h2 className="text-base font-heading font-semibold text-gray-800">Сводка по CRM</h2>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: "Контакты",  value: crmStats?.contacts, icon: "Users",       color: "text-blue-600",   bg: "bg-blue-50" },
                { label: "Лиды",      value: crmStats?.leads,    icon: "UserPlus",     color: "text-purple-600", bg: "bg-purple-50" },
                { label: "Сделки",    value: crmStats?.deals,    icon: "Handshake",    color: "text-primary",    bg: "bg-green-50" },
                { label: "Задачи",    value: crmStats?.tasks,    icon: "CheckSquare",  color: "text-orange-600", bg: "bg-orange-50" },
              ].map((k) => (
                <div key={k.label} className={`${k.bg} rounded-2xl p-5`}>
                  <div className={`flex items-center gap-2 mb-2 ${k.color}`}>
                    <Icon name={k.icon} size={16} />
                    <span className="text-xs font-medium text-gray-600">{k.label}</span>
                  </div>
                  <div className={`text-2xl font-heading font-bold ${k.color}`}>
                    {k.value ?? <span className="animate-pulse">·</span>}
                  </div>
                </div>
              ))}
            </div>

            <div className="glass-card rounded-2xl p-6">
              <p className="text-sm text-gray-500 mb-4">Перейдите в <strong>CRM</strong> для управления контактами, лидами, сделками и задачами.</p>
              <button
                onClick={() => setTab("crm")}
                className="hero-gradient text-white text-sm font-medium px-5 py-2.5 rounded-xl flex items-center gap-2 hover:opacity-90"
              >
                <Icon name="Briefcase" size={15} />
                Открыть CRM
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SectionProfile;
