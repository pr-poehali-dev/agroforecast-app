import React, { useState, useEffect, useCallback } from "react";
import Icon from "@/components/ui/icon";
import { apiCRM } from "@/lib/auth";
import { Contact, Lead, SkeletonRows } from "./CrmTypes";

// ─── Contacts Tab ─────────────────────────────────────────────────────────────

export const ContactsTab: React.FC = () => {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [selected, setSelected] = useState<Contact | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    full_name: "",
    phone: "",
    email: "",
    company: "",
    region: "",
    status: "active",
  });

  const load = useCallback(() => {
    setLoading(true);
    apiCRM("contacts_list")
      .then((res) => setContacts(res?.data || res || []))
      .catch(() => setContacts([]))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const filtered = contacts.filter((c) => {
    const q = search.toLowerCase();
    return (
      c.full_name?.toLowerCase().includes(q) ||
      c.email?.toLowerCase().includes(q) ||
      c.company?.toLowerCase().includes(q) ||
      c.phone?.toLowerCase().includes(q)
    );
  });

  const handleAdd = async () => {
    if (!form.full_name.trim()) return;
    setSaving(true);
    try {
      await apiCRM("contacts_create", form);
      setShowAdd(false);
      setForm({
        full_name: "",
        phone: "",
        email: "",
        company: "",
        region: "",
        status: "active",
      });
      load();
    } catch {
      // ignore
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <Icon
            name="Search"
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
          />
          <input
            type="text"
            placeholder="Поиск контактов..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-lg border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none text-sm"
          />
        </div>
        <button
          onClick={() => setShowAdd((v) => !v)}
          className="hero-gradient text-white text-sm font-medium px-4 py-2 rounded-lg flex items-center gap-2 hover:opacity-90 transition-opacity"
        >
          <Icon name="UserPlus" size={16} />
          Добавить контакт
        </button>
      </div>

      {/* Add form */}
      {showAdd && (
        <div className="glass-card rounded-xl p-5 border-2 border-primary/20">
          <h4 className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2">
            <Icon name="UserPlus" size={16} className="text-primary" />
            Новый контакт
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {[
              { name: "full_name", placeholder: "Полное имя *", icon: "User" },
              { name: "phone", placeholder: "Телефон", icon: "Phone" },
              { name: "email", placeholder: "Email", icon: "Mail" },
              { name: "company", placeholder: "Компания", icon: "Building2" },
              { name: "region", placeholder: "Регион", icon: "MapPin" },
            ].map((f) => (
              <div key={f.name} className="relative">
                <Icon
                  name={f.icon}
                  size={14}
                  className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400"
                />
                <input
                  type="text"
                  placeholder={f.placeholder}
                  value={(form as Record<string, string>)[f.name]}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, [f.name]: e.target.value }))
                  }
                  className="w-full pl-8 pr-3 py-2 rounded-lg border border-gray-200 focus:border-primary focus:ring-1 focus:ring-primary/20 outline-none text-sm"
                />
              </div>
            ))}
          </div>
          <div className="flex gap-2 mt-4">
            <button
              onClick={handleAdd}
              disabled={saving}
              className="hero-gradient text-white text-sm font-medium px-5 py-2 rounded-lg flex items-center gap-2 hover:opacity-90 disabled:opacity-50"
            >
              {saving ? (
                <Icon name="Loader2" size={14} className="animate-spin" />
              ) : (
                <Icon name="Check" size={14} />
              )}
              Сохранить
            </button>
            <button
              onClick={() => setShowAdd(false)}
              className="text-sm text-gray-600 bg-gray-100 hover:bg-gray-200 px-5 py-2 rounded-lg transition-colors"
            >
              Отмена
            </button>
          </div>
        </div>
      )}

      {/* Contact detail panel */}
      {selected && (
        <div className="glass-card rounded-xl p-5 border-2 border-primary/20">
          <div className="flex items-center justify-between mb-4">
            <h4 className="font-semibold text-gray-800 flex items-center gap-2">
              <Icon name="User" size={18} className="text-primary" />
              {selected.full_name}
            </h4>
            <button
              onClick={() => setSelected(null)}
              className="text-gray-400 hover:text-gray-600"
            >
              <Icon name="X" size={18} />
            </button>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-sm">
            {selected.phone && (
              <div className="flex items-center gap-2 text-gray-600">
                <Icon name="Phone" size={14} className="text-gray-400" />
                {selected.phone}
              </div>
            )}
            {selected.email && (
              <div className="flex items-center gap-2 text-gray-600">
                <Icon name="Mail" size={14} className="text-gray-400" />
                {selected.email}
              </div>
            )}
            {selected.company && (
              <div className="flex items-center gap-2 text-gray-600">
                <Icon name="Building2" size={14} className="text-gray-400" />
                {selected.company}
              </div>
            )}
            {selected.region && (
              <div className="flex items-center gap-2 text-gray-600">
                <Icon name="MapPin" size={14} className="text-gray-400" />
                {selected.region}
              </div>
            )}
            {selected.status && (
              <div className="flex items-center gap-2 text-gray-600">
                <Icon name="Circle" size={14} className="text-gray-400" />
                {selected.status}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Table */}
      <div className="glass-card rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                Имя
              </th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide hidden md:table-cell">
                Телефон
              </th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide hidden lg:table-cell">
                Email
              </th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide hidden md:table-cell">
                Компания
              </th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide hidden xl:table-cell">
                Регион
              </th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                Статус
              </th>
            </tr>
          </thead>
          {loading ? (
            <SkeletonRows rows={6} cols={6} />
          ) : filtered.length === 0 ? (
            <tbody>
              <tr>
                <td colSpan={6} className="text-center py-10 text-gray-400">
                  <Icon
                    name="Users"
                    size={32}
                    className="mx-auto mb-2 opacity-30"
                  />
                  <p className="text-sm">Контакты не найдены</p>
                </td>
              </tr>
            </tbody>
          ) : (
            <tbody>
              {filtered.map((c) => (
                <tr
                  key={c.id}
                  onClick={() => setSelected(c.id === selected?.id ? null : c)}
                  className={`border-b border-gray-100 cursor-pointer hover:bg-green-50/50 transition-colors ${
                    selected?.id === c.id ? "bg-primary/5" : ""
                  }`}
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full hero-gradient flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                        {c.full_name?.charAt(0) || "?"}
                      </div>
                      <span className="font-medium text-gray-800 text-sm">
                        {c.full_name}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-600 hidden md:table-cell">
                    {c.phone || "—"}
                  </td>
                  <td className="px-4 py-3 text-gray-600 hidden lg:table-cell">
                    {c.email || "—"}
                  </td>
                  <td className="px-4 py-3 text-gray-600 hidden md:table-cell">
                    {c.company || "—"}
                  </td>
                  <td className="px-4 py-3 text-gray-600 hidden xl:table-cell">
                    {c.region || "—"}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        c.status === "active"
                          ? "bg-green-100 text-green-700"
                          : "bg-gray-100 text-gray-600"
                      }`}
                    >
                      {c.status || "активный"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          )}
        </table>
      </div>
    </div>
  );
};

// ─── Leads Tab ────────────────────────────────────────────────────────────────

export const LeadsTab: React.FC = () => {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    full_name: "",
    culture: "",
    area: "",
    budget: "",
    region: "",
    status: "new",
  });

  const load = useCallback(() => {
    setLoading(true);
    apiCRM("leads_list")
      .then((res) => setLeads(res?.data || res || []))
      .catch(() => setLeads([]))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const STATUS_COLORS: Record<string, string> = {
    new: "bg-blue-100 text-blue-700",
    contacted: "bg-purple-100 text-purple-700",
    qualified: "bg-green-100 text-green-700",
    disqualified: "bg-red-100 text-red-700",
  };

  const handleAdd = async () => {
    if (!form.full_name.trim()) return;
    setSaving(true);
    try {
      await apiCRM("leads_create", {
        full_name: form.full_name,
        culture: form.culture,
        area: form.area ? Number(form.area) : undefined,
        budget: form.budget ? Number(form.budget) : undefined,
        region: form.region,
        status: form.status,
      });
      setShowAdd(false);
      setForm({
        full_name: "",
        culture: "",
        area: "",
        budget: "",
        region: "",
        status: "new",
      });
      load();
    } catch {
      // ignore
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <button
          onClick={() => setShowAdd((v) => !v)}
          className="hero-gradient text-white text-sm font-medium px-4 py-2 rounded-lg flex items-center gap-2 hover:opacity-90"
        >
          <Icon name="Plus" size={16} />
          Добавить лид
        </button>
      </div>

      {showAdd && (
        <div className="glass-card rounded-xl p-5 border-2 border-primary/20">
          <h4 className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2">
            <Icon name="UserPlus" size={16} className="text-primary" />
            Новый лид
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {[
              { name: "full_name", placeholder: "Имя *", type: "text", icon: "User" },
              { name: "culture", placeholder: "Культура", type: "text", icon: "Wheat" },
              { name: "area", placeholder: "Площадь (га)", type: "number", icon: "Crop" },
              { name: "budget", placeholder: "Бюджет, ₽", type: "number", icon: "Wallet" },
              { name: "region", placeholder: "Регион", type: "text", icon: "MapPin" },
            ].map((f) => (
              <div key={f.name} className="relative">
                <Icon
                  name={f.icon}
                  size={14}
                  className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400"
                />
                <input
                  type={f.type}
                  placeholder={f.placeholder}
                  value={(form as Record<string, string>)[f.name]}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, [f.name]: e.target.value }))
                  }
                  className="w-full pl-8 pr-3 py-2 rounded-lg border border-gray-200 focus:border-primary focus:ring-1 focus:ring-primary/20 outline-none text-sm"
                />
              </div>
            ))}
          </div>
          <div className="flex gap-2 mt-4">
            <button
              onClick={handleAdd}
              disabled={saving}
              className="hero-gradient text-white text-sm font-medium px-5 py-2 rounded-lg flex items-center gap-2 hover:opacity-90 disabled:opacity-50"
            >
              {saving ? (
                <Icon name="Loader2" size={14} className="animate-spin" />
              ) : (
                <Icon name="Check" size={14} />
              )}
              Сохранить
            </button>
            <button
              onClick={() => setShowAdd(false)}
              className="text-sm text-gray-600 bg-gray-100 hover:bg-gray-200 px-5 py-2 rounded-lg"
            >
              Отмена
            </button>
          </div>
        </div>
      )}

      <div className="glass-card rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200">
              {["Имя", "Культура", "Площадь", "Бюджет", "Регион", "Статус"].map(
                (h) => (
                  <th
                    key={h}
                    className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide"
                  >
                    {h}
                  </th>
                )
              )}
            </tr>
          </thead>
          {loading ? (
            <SkeletonRows rows={5} cols={6} />
          ) : leads.length === 0 ? (
            <tbody>
              <tr>
                <td colSpan={6} className="text-center py-10 text-gray-400">
                  <Icon
                    name="UserPlus"
                    size={32}
                    className="mx-auto mb-2 opacity-30"
                  />
                  <p className="text-sm">Лиды не найдены</p>
                </td>
              </tr>
            </tbody>
          ) : (
            <tbody>
              {leads.map((l) => (
                <tr
                  key={l.id}
                  className="border-b border-gray-100 hover:bg-green-50/50 transition-colors"
                >
                  <td className="px-4 py-3 font-medium text-gray-800">
                    {l.full_name}
                  </td>
                  <td className="px-4 py-3 text-gray-600">
                    {l.culture || "—"}
                  </td>
                  <td className="px-4 py-3 text-gray-600">
                    {l.area ? `${l.area} га` : "—"}
                  </td>
                  <td className="px-4 py-3 text-gray-600">
                    {l.budget
                      ? `${l.budget.toLocaleString("ru-RU")} ₽`
                      : "—"}
                  </td>
                  <td className="px-4 py-3 text-gray-600">
                    {l.region || "—"}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        STATUS_COLORS[l.status || "new"] || STATUS_COLORS.new
                      }`}
                    >
                      {l.status || "Новый"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          )}
        </table>
      </div>
    </div>
  );
};