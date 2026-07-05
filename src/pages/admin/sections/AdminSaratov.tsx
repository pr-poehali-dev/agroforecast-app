import { useEffect, useState, useRef } from "react";
import * as XLSX from "xlsx";
import { adminApi } from "@/lib/adminApi";
import Icon from "@/components/ui/icon";

const REGION = "Саратовская область";

interface Supplier {
  id: number; name: string; inn: string; region: string; district: string;
  locality: string; crops: string; volume_tons: number | null;
  contact_person: string; phone: string; email: string; address: string;
  status: string; source: string; notes: string; created_at: string;
  ownership?: string; website?: string; fax?: string; revenue?: string;
  staff_count?: string; founded_year?: string; activity?: string; postal_code?: string;
}

const STATUS_LABELS: Record<string, string> = {
  new: "Новый", in_progress: "В работе", negotiation: "Переговоры",
  partner: "Партнёр", rejected: "Отказ",
};
const STATUS_COLORS: Record<string, string> = {
  new: "bg-secondary text-muted-foreground",
  in_progress: "bg-blue-100 text-blue-700",
  negotiation: "bg-amber-100 text-amber-700",
  partner: "bg-emerald-100 text-emerald-700",
  rejected: "bg-rose-100 text-rose-700",
};

const emptyForm = () => ({
  name: "", inn: "", region: REGION, district: "", locality: "", crops: "",
  volume_tons: "", contact_person: "", phone: "", email: "", address: "",
  status: "new", notes: "", ownership: "", website: "", fax: "", revenue: "",
  staff_count: "", founded_year: "", activity: "", postal_code: "",
});

// ── Модалка карточки поставщика ──────────────────────────────────────────────
function SupplierModal({ item, onClose, onSave }: {
  item: Partial<Supplier> | null; onClose: () => void; onSave: () => void;
}) {
  const [form, setForm] = useState<Record<string, unknown>>(
    item?.id ? { ...emptyForm(), ...item, volume_tons: item.volume_tons ?? "" } : emptyForm()
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const set = (k: string, v: unknown) => setForm(f => ({ ...f, [k]: v }));

  const save = async () => {
    if (!String(form.name).trim()) { setError("Название хозяйства обязательно"); return; }
    setSaving(true); setError("");
    const payload = { ...form, volume_tons: form.volume_tons === "" ? null : Number(form.volume_tons) };
    try {
      if (item?.id) await adminApi.updateSupplier(item.id, payload);
      else await adminApi.createSupplier(payload);
      onSave();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Ошибка");
    } finally { setSaving(false); }
  };

  const inputCls = "w-full px-3 py-2 rounded-xl border border-border bg-background text-sm focus:outline-none focus:border-primary";
  const lblCls = "block text-xs font-medium text-muted-foreground mb-1.5";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="bg-background rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-5 border-b border-border">
          <h3 className="font-heading font-bold text-base">{item?.id ? "Редактировать хозяйство" : "Новое хозяйство"}</h3>
          <button onClick={onClose}><Icon name="X" size={18} className="text-muted-foreground" /></button>
        </div>
        <div className="p-5 space-y-4">
          <div>
            <label className={lblCls}>Название хозяйства *</label>
            <input value={String(form.name)} onChange={e => set("name", e.target.value)} className={inputCls} placeholder="ООО «Агро», КФХ Иванов И.И." />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className={lblCls}>ИНН</label>
              <input value={String(form.inn)} onChange={e => set("inn", e.target.value)} className={inputCls} placeholder="6440012345" /></div>
            <div><label className={lblCls}>Район</label>
              <input value={String(form.district)} onChange={e => set("district", e.target.value)} className={inputCls} placeholder="Аткарский" /></div>
            <div><label className={lblCls}>Населённый пункт</label>
              <input value={String(form.locality)} onChange={e => set("locality", e.target.value)} className={inputCls} placeholder="с. Елизаветино" /></div>
            <div><label className={lblCls}>Культуры</label>
              <input value={String(form.crops)} onChange={e => set("crops", e.target.value)} className={inputCls} placeholder="Подсолнечник, пшеница" /></div>
            <div><label className={lblCls}>Объём, тонн</label>
              <input type="number" value={String(form.volume_tons)} onChange={e => set("volume_tons", e.target.value)} className={inputCls} placeholder="1500" /></div>
            <div><label className={lblCls}>Статус</label>
              <select value={String(form.status)} onChange={e => set("status", e.target.value)} className={inputCls}>
                {Object.entries(STATUS_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
              </select></div>
            <div><label className={lblCls}>Контактное лицо</label>
              <input value={String(form.contact_person)} onChange={e => set("contact_person", e.target.value)} className={inputCls} placeholder="Иван Петров" /></div>
            <div><label className={lblCls}>Телефон</label>
              <input value={String(form.phone)} onChange={e => set("phone", e.target.value)} className={inputCls} placeholder="+7 900 000-00-00" /></div>
            <div><label className={lblCls}>Email</label>
              <input value={String(form.email)} onChange={e => set("email", e.target.value)} className={inputCls} placeholder="agro@mail.ru" /></div>
            <div><label className={lblCls}>Адрес</label>
              <input value={String(form.address)} onChange={e => set("address", e.target.value)} className={inputCls} placeholder="г. Аткарск, ул. …" /></div>
            <div><label className={lblCls}>Почтовый индекс</label>
              <input value={String(form.postal_code)} onChange={e => set("postal_code", e.target.value)} className={inputCls} placeholder="412420" /></div>
            <div><label className={lblCls}>Форма собственности</label>
              <input value={String(form.ownership)} onChange={e => set("ownership", e.target.value)} className={inputCls} placeholder="ООО / АО / КФХ" /></div>
            <div><label className={lblCls}>Сайт</label>
              <input value={String(form.website)} onChange={e => set("website", e.target.value)} className={inputCls} placeholder="agro.ru" /></div>
            <div><label className={lblCls}>Факс</label>
              <input value={String(form.fax)} onChange={e => set("fax", e.target.value)} className={inputCls} placeholder="+7 …" /></div>
            <div><label className={lblCls}>Выручка</label>
              <input value={String(form.revenue)} onChange={e => set("revenue", e.target.value)} className={inputCls} placeholder="120 млн ₽" /></div>
            <div><label className={lblCls}>Численность</label>
              <input value={String(form.staff_count)} onChange={e => set("staff_count", e.target.value)} className={inputCls} placeholder="45" /></div>
            <div><label className={lblCls}>Год основания</label>
              <input value={String(form.founded_year)} onChange={e => set("founded_year", e.target.value)} className={inputCls} placeholder="2005" /></div>
          </div>
          <div>
            <label className={lblCls}>Направление деятельности</label>
            <input value={String(form.activity)} onChange={e => set("activity", e.target.value)} className={inputCls} placeholder="Растениеводство, доп. услуги" />
          </div>
          <div>
            <label className={lblCls}>Заметки</label>
            <textarea value={String(form.notes)} rows={2} onChange={e => set("notes", e.target.value)} className={`${inputCls} resize-none`} placeholder="Комментарий по предприятию" />
          </div>
          {error && <p className="text-xs text-destructive">{error}</p>}
          <div className="flex gap-3 pt-2">
            <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-border text-sm font-medium hover:bg-secondary">Отмена</button>
            <button onClick={save} disabled={saving} className="flex-1 py-2.5 rounded-xl hero-gradient text-white text-sm font-medium disabled:opacity-60 flex items-center justify-center gap-2">
              {saving ? <><Icon name="Loader" size={14} className="animate-spin" />Сохранение…</> : "Сохранить"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Блок плана-стратегии ─────────────────────────────────────────────────────
function PlanBlock() {
  const [plan, setPlan] = useState<{ title: string; partner: string; content: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ title: "", partner: "", content: "" });
  const [msg, setMsg] = useState("");

  const load = () => {
    setLoading(true);
    adminApi.getRegionPlan(REGION)
      .then(d => {
        const p = d.plan || { title: `План работы: ${REGION}`, partner: "", content: "" };
        setPlan(p); setForm({ title: p.title, partner: p.partner || "", content: p.content || "" });
      })
      .finally(() => setLoading(false));
  };
  useEffect(load, []);

  const generate = async () => {
    setGenerating(true); setMsg("");
    try {
      const d = await adminApi.generateRegionPlan(REGION, form.partner, "Приёмка подсолнечника и пшеницы");
      setForm(f => ({ ...f, content: d.content })); setEditing(true);
    } catch (e: unknown) { setMsg(e instanceof Error ? e.message : "Ошибка ИИ"); }
    finally { setGenerating(false); }
  };

  const save = async () => {
    setSaving(true); setMsg("");
    try {
      await adminApi.saveRegionPlan({ region: REGION, ...form });
      setPlan({ ...form }); setEditing(false); setMsg("Сохранено");
    } catch (e: unknown) { setMsg(e instanceof Error ? e.message : "Ошибка"); }
    finally { setSaving(false); }
  };

  const inputCls = "w-full px-3 py-2 rounded-xl border border-border bg-background text-sm focus:outline-none focus:border-primary";

  if (loading) return <div className="glass-card rounded-2xl p-8 flex justify-center"><Icon name="Loader" size={20} className="animate-spin text-primary" /></div>;

  return (
    <div className="glass-card rounded-2xl p-5 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Icon name="Target" size={18} className="text-primary" />
          <h3 className="font-heading font-bold text-base">План-стратегия</h3>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={generate} disabled={generating}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-secondary text-xs font-medium hover:bg-secondary/80 disabled:opacity-60">
            {generating ? <Icon name="Loader" size={13} className="animate-spin" /> : <Icon name="Sparkles" size={13} />}
            {generating ? "Генерация…" : "Сгенерировать ИИ"}
          </button>
          {!editing && (
            <button onClick={() => setEditing(true)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-secondary text-xs font-medium hover:bg-secondary/80">
              <Icon name="Edit" size={13} />Изменить
            </button>
          )}
        </div>
      </div>

      {editing ? (
        <div className="space-y-3">
          <input value={form.partner} onChange={e => setForm(f => ({ ...f, partner: e.target.value }))} className={inputCls} placeholder="Партнёр / точка приёмки (напр. Аткарск)" />
          <textarea value={form.content} rows={14} onChange={e => setForm(f => ({ ...f, content: e.target.value }))} className={`${inputCls} resize-none font-mono text-xs leading-relaxed`} placeholder="Текст плана работы…" />
          <div className="flex gap-3">
            <button onClick={() => { setEditing(false); setForm({ title: plan!.title, partner: plan!.partner || "", content: plan!.content || "" }); }}
              className="flex-1 py-2.5 rounded-xl border border-border text-sm font-medium hover:bg-secondary">Отмена</button>
            <button onClick={save} disabled={saving} className="flex-1 py-2.5 rounded-xl hero-gradient text-white text-sm font-medium disabled:opacity-60 flex items-center justify-center gap-2">
              {saving ? <><Icon name="Loader" size={14} className="animate-spin" />Сохранение…</> : "Сохранить план"}
            </button>
          </div>
        </div>
      ) : (
        <>
          {plan?.partner && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Icon name="MapPin" size={13} className="text-primary" /><span>{plan.partner}</span>
            </div>
          )}
          <pre className="whitespace-pre-wrap text-sm leading-relaxed text-foreground/90 font-sans">{plan?.content || "План пока пуст. Сгенерируйте ИИ или заполните вручную."}</pre>
        </>
      )}
      {msg && <p className="text-xs text-muted-foreground">{msg}</p>}
    </div>
  );
}

// ── Блок базы поставщиков ────────────────────────────────────────────────────
function SuppliersBlock() {
  const [data, setData] = useState<{ suppliers: Supplier[]; total: number; pages: number; stats: Record<string, number> } | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);
  const [modal, setModal] = useState<Partial<Supplier> | null | false>(false);
  const [importMsg, setImportMsg] = useState("");
  const [importing, setImporting] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const load = () => {
    setLoading(true);
    adminApi.getSuppliers({ region: REGION, search, status, page })
      .then(setData).finally(() => setLoading(false));
  };
  useEffect(() => { load(); }, [search, status, page]);

  const handleDelete = async (id: number) => {
    if (!confirm("Удалить хозяйство из базы?")) return;
    await adminApi.deleteSupplier(id); load();
  };

  const KEY_MAP: Record<string, string> = {
    "название": "name", "наименование": "name", "хозяйство": "name", "name": "name", "организация": "name",
    "инн": "inn", "inn": "inn",
    "район": "district", "district": "district",
    "населенныйпункт": "locality", "нас.пункт": "locality", "село": "locality", "locality": "locality", "город": "locality",
    "культуры": "crops", "культура": "crops", "crops": "crops",
    "объем": "volume_tons", "объемтонн": "volume_tons", "объём": "volume_tons", "тонн": "volume_tons", "volume": "volume_tons",
    "контакт": "contact_person", "контактноелицо": "contact_person", "фио": "contact_person", "contact": "contact_person",
    "телефон": "phone", "тел": "phone", "phone": "phone",
    "email": "email", "почта": "email", "e-mail": "email",
    "адрес": "address", "address": "address",
    "заметки": "notes", "комментарий": "notes", "notes": "notes",
  };

  const normKey = (k: string) => KEY_MAP[k.toLowerCase().replace(/[\s._-]/g, "")] || "";

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImporting(true); setImportMsg("ИИ разбирает таблицу…");
    try {
      const buf = await file.arrayBuffer();
      const wb = XLSX.read(buf, { type: "array" });
      const sheet = wb.Sheets[wb.SheetNames[0]];
      const raw: Record<string, unknown>[] = XLSX.utils.sheet_to_json(sheet, { defval: "" });
      if (!raw.length) { setImportMsg("Файл пустой или без данных."); setImporting(false); return; }

      // Сначала ИИ сам определяет колонки (наименование юрлица, ИНН, район, культуры…)
      try {
        const res = await adminApi.aiImportSuppliers(raw, REGION);
        setImportMsg(`ИИ распознал таблицу и добавил производителей: ${res.imported}`);
        setPage(1); load();
        return;
      } catch {
        setImportMsg("ИИ недоступен, разбираю по заголовкам столбцов…");
      }

      // Запасной вариант — по известным заголовкам
      const rows = raw.map(r => {
        const obj: Record<string, unknown> = {};
        for (const [k, v] of Object.entries(r)) {
          const nk = normKey(k);
          if (nk && v !== "") obj[nk] = nk === "volume_tons" ? Number(String(v).replace(",", ".")) || null : String(v).trim();
        }
        return obj;
      }).filter(o => o.name);
      if (!rows.length) { setImportMsg("Не удалось распознать производителей. Проверьте таблицу."); setImporting(false); return; }
      const res = await adminApi.importSuppliers(rows, REGION);
      setImportMsg(`Импортировано производителей: ${res.imported}`);
      setPage(1); load();
    } catch (err: unknown) {
      setImportMsg(err instanceof Error ? err.message : "Ошибка чтения файла");
    } finally {
      setImporting(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const s = data?.stats || {};

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <Icon name="Users" size={18} className="text-primary" />
          <h3 className="font-heading font-bold text-base">База поставщиков</h3>
          {data && <span className="text-xs text-muted-foreground">· {data.total}</span>}
        </div>
        <div className="flex items-center gap-2">
          <input ref={fileRef} type="file" accept=".xlsx,.xls,.csv" onChange={handleFile} className="hidden" />
          <button onClick={() => fileRef.current?.click()} disabled={importing}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-secondary text-xs font-medium hover:bg-secondary/80 disabled:opacity-60">
            {importing ? <Icon name="Loader" size={13} className="animate-spin" /> : <Icon name="Upload" size={13} />}
            Импорт Excel
          </button>
          <button onClick={() => setModal({})} className="flex items-center gap-1.5 px-3 py-2 rounded-xl hero-gradient text-white text-xs font-medium">
            <Icon name="Plus" size={14} />Добавить
          </button>
        </div>
      </div>

      {importMsg && (
        <div className="flex items-center gap-2 text-xs px-3 py-2 rounded-xl bg-secondary text-foreground/80">
          <Icon name="Info" size={13} className="text-primary shrink-0" /><span>{importMsg}</span>
        </div>
      )}

      {/* Сводка по статусам */}
      <div className="flex flex-wrap gap-2">
        <button onClick={() => { setStatus(""); setPage(1); }}
          className={`px-3 py-1.5 rounded-xl text-xs font-medium ${status === "" ? "bg-primary text-white" : "bg-secondary text-muted-foreground hover:bg-secondary/80"}`}>
          Все {data ? `· ${data.total}` : ""}
        </button>
        {Object.entries(STATUS_LABELS).map(([v, l]) => (
          <button key={v} onClick={() => { setStatus(v); setPage(1); }}
            className={`px-3 py-1.5 rounded-xl text-xs font-medium ${status === v ? "bg-primary text-white" : "bg-secondary text-muted-foreground hover:bg-secondary/80"}`}>
            {l} {s[v] ? `· ${s[v]}` : ""}
          </button>
        ))}
      </div>

      <div className="relative">
        <Icon name="Search" size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <input value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} placeholder="Поиск по названию, ИНН, контакту…"
          className="w-full pl-8 pr-3 py-2 rounded-xl border border-border bg-background text-sm focus:outline-none focus:border-primary" />
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><Icon name="Loader" size={24} className="animate-spin text-primary" /></div>
      ) : (
        <div className="space-y-2">
          {data?.suppliers.map(sup => (
            <div key={sup.id} className="glass-card rounded-xl p-4 flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${STATUS_COLORS[sup.status] || "bg-secondary text-muted-foreground"}`}>
                    {STATUS_LABELS[sup.status] || sup.status}
                  </span>
                  {sup.district && <span className="text-[10px] text-muted-foreground">{sup.district}{sup.locality ? `, ${sup.locality}` : ""}</span>}
                  {sup.crops && <span className="text-[10px] text-primary">{sup.crops}</span>}
                </div>
                <p className="text-sm font-medium truncate">{sup.name}</p>
                <div className="flex items-center gap-3 mt-0.5 flex-wrap">
                  {sup.inn && <span className="text-[10px] text-muted-foreground">ИНН {sup.inn}</span>}
                  {sup.volume_tons != null && <span className="text-[10px] text-muted-foreground">{sup.volume_tons} т</span>}
                  {sup.contact_person && <span className="text-[10px] text-muted-foreground">{sup.contact_person}</span>}
                  {sup.phone && <span className="text-[10px] text-muted-foreground">{sup.phone}</span>}
                </div>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <button onClick={() => setModal(sup)} className="p-1.5 hover:bg-primary/10 rounded-lg text-primary"><Icon name="Edit" size={14} /></button>
                <button onClick={() => handleDelete(sup.id)} className="p-1.5 hover:bg-destructive/10 rounded-lg text-destructive"><Icon name="Trash2" size={14} /></button>
              </div>
            </div>
          ))}
          {data?.suppliers.length === 0 && (
            <div className="glass-card rounded-2xl p-12 text-center">
              <Icon name="Users" size={32} className="text-muted-foreground mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">Хозяйств пока нет. Добавьте вручную или импортируйте Excel.</p>
            </div>
          )}
        </div>
      )}

      {data && data.pages > 1 && (
        <div className="flex justify-center gap-2 flex-wrap">
          {Array.from({ length: data.pages }, (_, i) => i + 1).map(p => (
            <button key={p} onClick={() => setPage(p)}
              className={`w-8 h-8 rounded-lg text-xs font-medium ${page === p ? "bg-primary text-white" : "bg-secondary hover:bg-secondary/80"}`}>{p}</button>
          ))}
        </div>
      )}

      {modal !== false && <SupplierModal item={modal || {}} onClose={() => setModal(false)} onSave={() => { setModal(false); load(); }} />}
    </div>
  );
}

// ── Главный раздел ───────────────────────────────────────────────────────────
export default function AdminSaratov() {
  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 hero-gradient rounded-xl flex items-center justify-center">
          <Icon name="MapPin" size={18} className="text-white" />
        </div>
        <div>
          <h2 className="font-heading font-bold text-lg leading-none">Саратовская область</h2>
          <p className="text-xs text-muted-foreground mt-1">План работы и база сельхозпроизводителей</p>
        </div>
      </div>
      <PlanBlock />
      <SuppliersBlock />
    </div>
  );
}