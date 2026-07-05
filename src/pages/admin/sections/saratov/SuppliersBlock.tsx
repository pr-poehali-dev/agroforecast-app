import { useEffect, useState, useRef } from "react";
import * as XLSX from "xlsx";
import { adminApi } from "@/lib/adminApi";
import Icon from "@/components/ui/icon";
import { Supplier, Facet, Facets, Analytics, REGION, STATUS_LABELS, STATUS_COLORS } from "./shared";
import SupplierCard from "./SupplierCard";

// ── Блок базы поставщиков ────────────────────────────────────────────────────
export default function SuppliersBlock() {
  const [data, setData] = useState<{ suppliers: Supplier[]; total: number; pages: number; stats: Record<string, number> } | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [region, setRegion] = useState(REGION);
  const [district, setDistrict] = useState("");
  const [activity, setActivity] = useState("");
  const [crop, setCrop] = useState("");
  const [ownership, setOwnership] = useState("");
  const [farmer, setFarmer] = useState(true);       // по умолчанию — только сельхозпроизводители
  const [priorityOnly, setPriorityOnly] = useState(false); // районы вокруг Аткарска
  const [saratovOnly, setSaratovOnly] = useState(false);   // ИНН 64
  const [page, setPage] = useState(1);
  const [card, setCard] = useState<Partial<Supplier> | null>(null);
  const [importMsg, setImportMsg] = useState("");
  const [importing, setImporting] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [facets, setFacets] = useState<Facets | null>(null);
  const [showAnalytics, setShowAnalytics] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const filterParams = () => ({
    region, district, activity, crop, ownership, search, status,
    farmer: farmer ? "1" : "",
    priority: priorityOnly ? "2" : "",
    inn_prefix: saratovOnly ? "64" : "",
  });

  const load = () => {
    setLoading(true);
    adminApi.getSuppliers({ ...filterParams(), page })
      .then(setData).finally(() => setLoading(false));
  };
  useEffect(() => { load(); }, [search, status, region, district, activity, crop, ownership, farmer, priorityOnly, saratovOnly, page]);

  // Справочники фильтров зависят от выбранного региона
  useEffect(() => {
    adminApi.getSupplierFacets(region).then(setFacets).catch(() => {});
  }, [region]);

  const resetFilters = () => {
    setDistrict(""); setActivity(""); setCrop(""); setOwnership(""); setSearch(""); setStatus("");
    setPriorityOnly(false); setSaratovOnly(false); setPage(1);
  };
  const activeFilters = [district, activity, crop, ownership].filter(Boolean).length + (priorityOnly ? 1 : 0) + (saratovOnly ? 1 : 0);

  // Выгрузка отфильтрованного перечня в Excel
  const handleExport = async () => {
    setExporting(true); setImportMsg("Готовлю выгрузку…");
    try {
      const rows: Record<string, unknown>[] = [];
      const first = await adminApi.getSuppliers({ ...filterParams(), page: 1 });
      const pages = first.pages || 1;
      const collect = (list: Supplier[]) => list.forEach(x => rows.push({
        "Название": x.name, "ИНН": x.inn, "Район": x.district || "",
        "Населённый пункт": x.locality || "", "Культуры / продукция": x.crops || "",
        "Направление": x.activity || "", "Объём, т": x.volume_tons ?? "",
        "Форма собственности": x.ownership || "", "Контактное лицо": x.contact_person || "",
        "Телефон": x.phone || "", "Email": x.email || "", "Адрес": x.address || "",
        "Статус": STATUS_LABELS[x.status] || x.status,
      }));
      collect(first.suppliers);
      for (let p = 2; p <= pages; p++) {
        setImportMsg(`Выгружаю ${p} из ${pages} страниц…`);
        const d = await adminApi.getSuppliers({ ...filterParams(), page: p });
        collect(d.suppliers);
      }
      const ws = XLSX.utils.json_to_sheet(rows);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Хозяйства");
      XLSX.writeFile(wb, `хозяйства_${region}${priorityOnly ? "_приоритет" : ""}.xlsx`);
      setImportMsg(`Выгружено хозяйств: ${rows.length}.`);
    } catch (e: unknown) {
      setImportMsg(e instanceof Error ? e.message : "Ошибка выгрузки");
    } finally { setExporting(false); }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Удалить хозяйство из базы?")) return;
    await adminApi.deleteSupplier(id); load();
  };

  // Ключевые слова, по которым определяем строку заголовков
  const HEADER_HINTS = ["назван", "наимен", "инн", "руковод", "телефон", "адрес",
    "предприят", "организац", "почт", "продукц", "деятельн", "собственн", "e_mail", "email"];

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImporting(true); setImportMsg("Читаю файл…");
    try {
      const buf = await file.arrayBuffer();
      const wb = XLSX.read(buf, { type: "array" });
      const sheet = wb.Sheets[wb.SheetNames[0]];
      // Читаем как матрицу — сами находим строку заголовков
      const matrix: unknown[][] = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: "" });
      if (!matrix.length) { setImportMsg("Файл пустой или без данных."); setImporting(false); return; }

      // Ищем строку заголовков в первых 15 строках
      let headerIdx = 0, bestScore = -1;
      for (let i = 0; i < Math.min(15, matrix.length); i++) {
        const cells = matrix[i].map(c => String(c).toLowerCase());
        const score = cells.filter(c => HEADER_HINTS.some(h => c.includes(h))).length;
        if (score > bestScore) { bestScore = score; headerIdx = i; }
      }
      const headers = matrix[headerIdx].map(c => String(c).trim());
      // Строки данных → объекты с заголовками-ключами
      const raw: Record<string, unknown>[] = [];
      for (let i = headerIdx + 1; i < matrix.length; i++) {
        const row = matrix[i];
        if (!row || row.every(c => String(c).trim() === "")) continue;
        const obj: Record<string, unknown> = {};
        headers.forEach((h, j) => { if (h) obj[h] = row[j] ?? ""; });
        raw.push(obj);
      }
      if (!raw.length) { setImportMsg("Не нашёл строк с данными. Проверьте, что в файле есть таблица с заголовками."); setImporting(false); return; }

      // Отправляем батчами по 100 строк (чтобы большой файл не обрывался)
      const CHUNK = 100;
      let total = 0; let usedAi = false;
      for (let i = 0; i < raw.length; i += CHUNK) {
        const chunk = raw.slice(i, i + CHUNK);
        setImportMsg(`Обрабатываю ${Math.min(i + CHUNK, raw.length)} из ${raw.length}…`);
        const res = await adminApi.aiImportSuppliers(chunk, REGION);
        total += res.imported || 0;
        usedAi = usedAi || !!res.used_ai;
      }
      const how = usedAi ? "ИИ распознал таблицу" : "Таблица распознана по заголовкам";
      setImportMsg(`${how}. Добавлено производителей: ${total} из ${raw.length}.`);
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
          <button onClick={() => setShowAnalytics(true)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-secondary text-xs font-medium hover:bg-secondary/80">
            <Icon name="BarChart3" size={13} className="text-primary" />Аналитика
          </button>
          <button onClick={handleExport} disabled={exporting}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-secondary text-xs font-medium hover:bg-secondary/80 disabled:opacity-60">
            {exporting ? <Icon name="Loader" size={13} className="animate-spin" /> : <Icon name="Download" size={13} className="text-primary" />}
            Выгрузить
          </button>
          <button onClick={() => fileRef.current?.click()} disabled={importing}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-secondary text-xs font-medium hover:bg-secondary/80 disabled:opacity-60">
            {importing ? <Icon name="Loader" size={13} className="animate-spin" /> : <Icon name="Upload" size={13} />}
            Импорт Excel
          </button>
          <button onClick={() => setCard({})} className="flex items-center gap-1.5 px-3 py-2 rounded-xl hero-gradient text-white text-xs font-medium">
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

      {/* Панель фильтров */}
      <div className="glass-card rounded-xl p-3 space-y-2.5">
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
          <FilterSelect label="Регион" value={region} onChange={v => { setRegion(v); setDistrict(""); setPage(1); }}
            options={facets?.regions || []} placeholder="Все регионы" />
          <FilterSelect label="Район" value={district} onChange={v => { setDistrict(v); setPage(1); }}
            options={facets?.districts || []} placeholder="Все районы" />
          <FilterSelect label="Вид деятельности" value={activity} onChange={v => { setActivity(v); setPage(1); }}
            options={facets?.activities || []} placeholder="Любая деятельность" />
          <FilterSelect label="Форма собственности" value={ownership} onChange={v => { setOwnership(v); setPage(1); }}
            options={facets?.ownerships || []} placeholder="Любая" />
          <div>
            <label className="block text-[10px] font-medium text-muted-foreground mb-1">Культура / продукция</label>
            <input value={crop} onChange={e => { setCrop(e.target.value); setPage(1); }} placeholder="напр. пшеница"
              className="w-full px-2.5 py-1.5 rounded-lg border border-border bg-background text-xs focus:outline-none focus:border-primary" />
          </div>
        </div>

        {/* Быстрые CRM-фильтры */}
        <div className="flex flex-wrap gap-2">
          <Toggle active={farmer} onClick={() => { setFarmer(f => !f); setPage(1); }} icon="Wheat" label="Только сельхозпроизводители" />
          <Toggle active={priorityOnly} onClick={() => { setPriorityOnly(p => !p); setPage(1); }} icon="Star" label="Районы вокруг Аткарска" />
          <Toggle active={saratovOnly} onClick={() => { setSaratovOnly(p => !p); setPage(1); }} icon="MapPin" label="Саратовские (ИНН 64)" />
        </div>

        {activeFilters > 0 && (
          <button onClick={resetFilters} className="flex items-center gap-1 text-[11px] text-primary hover:underline">
            <Icon name="X" size={12} />Сбросить фильтры ({activeFilters})
          </button>
        )}
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><Icon name="Loader" size={24} className="animate-spin text-primary" /></div>
      ) : (
        <div className="space-y-2">
          {data?.suppliers.map(sup => (
            <div key={sup.id} onClick={() => setCard(sup)}
              className="glass-card rounded-xl p-4 flex items-start justify-between gap-3 cursor-pointer hover:border-primary/40 transition-colors">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  {(sup.priority ?? 0) >= 2 && (
                    <span className="flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[10px] font-medium bg-amber-100 text-amber-700">
                      <Icon name="Star" size={10} />Приоритет
                    </span>
                  )}
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${STATUS_COLORS[sup.status] || "bg-secondary text-muted-foreground"}`}>
                    {STATUS_LABELS[sup.status] || sup.status}
                  </span>
                  {sup.district && <span className="text-[10px] text-muted-foreground">{sup.district}{sup.locality ? `, ${sup.locality}` : ""}</span>}
                  {sup.crops && <span className="text-[10px] text-primary truncate max-w-[240px]">{sup.crops}</span>}
                </div>
                <p className="text-sm font-medium truncate">{sup.name}</p>
                <div className="flex items-center gap-3 mt-0.5 flex-wrap">
                  {sup.inn && <span className="text-[10px] text-muted-foreground">ИНН {sup.inn}</span>}
                  {sup.volume_tons != null && <span className="text-[10px] text-muted-foreground">{sup.volume_tons} т</span>}
                  {sup.contact_person && <span className="text-[10px] text-muted-foreground">{sup.contact_person}</span>}
                  {sup.phone && <span className="text-[10px] text-muted-foreground">{sup.phone}</span>}
                  {sup.ai_analysis && <span className="flex items-center gap-0.5 text-[10px] text-emerald-600"><Icon name="ClipboardCheck" size={10} />анализ</span>}
                  {sup.ai_letter && <span className="flex items-center gap-0.5 text-[10px] text-emerald-600"><Icon name="MailCheck" size={10} />письмо</span>}
                </div>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <button onClick={e => { e.stopPropagation(); setCard(sup); }} title="Открыть карточку"
                  className="flex items-center gap-1 px-2 py-1.5 rounded-lg hero-gradient text-white text-[11px] font-medium">
                  <Icon name="Sparkles" size={13} />Открыть
                </button>
                <button onClick={e => { e.stopPropagation(); handleDelete(sup.id); }} className="p-1.5 hover:bg-destructive/10 rounded-lg text-destructive"><Icon name="Trash2" size={14} /></button>
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
        <div className="flex justify-center items-center gap-2">
          <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page <= 1}
            className="px-3 h-8 rounded-lg text-xs font-medium bg-secondary hover:bg-secondary/80 disabled:opacity-40 flex items-center gap-1">
            <Icon name="ChevronLeft" size={13} />Назад
          </button>
          <span className="text-xs text-muted-foreground">Стр. {page} из {data.pages}</span>
          <button onClick={() => setPage(p => Math.min(data.pages, p + 1))} disabled={page >= data.pages}
            className="px-3 h-8 rounded-lg text-xs font-medium bg-secondary hover:bg-secondary/80 disabled:opacity-40 flex items-center gap-1">
            Вперёд<Icon name="ChevronRight" size={13} />
          </button>
        </div>
      )}

      {card && <SupplierCard item={card} onClose={() => { setCard(null); load(); }} onSaved={() => { setCard(null); load(); }} />}
      {showAnalytics && <AnalyticsModal region={region} onClose={() => setShowAnalytics(false)}
        onPick={(f) => { if (f.district !== undefined) setDistrict(f.district); if (f.activity !== undefined) setActivity(f.activity); if (f.ownership !== undefined) setOwnership(f.ownership); setPage(1); setShowAnalytics(false); }} />}
    </div>
  );
}

// ── Переключатель быстрого фильтра ───────────────────────────────────────────
function Toggle({ active, onClick, icon, label }: {
  active: boolean; onClick: () => void; icon: string; label: string;
}) {
  return (
    <button onClick={onClick}
      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium ${active ? "bg-primary text-white" : "bg-secondary text-muted-foreground hover:bg-secondary/80"}`}>
      <Icon name={icon} size={13} />{label}
    </button>
  );
}

// ── Выпадающий фильтр ────────────────────────────────────────────────────────
function FilterSelect({ label, value, onChange, options, placeholder }: {
  label: string; value: string; onChange: (v: string) => void; options: Facet[]; placeholder: string;
}) {
  return (
    <div>
      <label className="block text-[10px] font-medium text-muted-foreground mb-1">{label}</label>
      <select value={value} onChange={e => onChange(e.target.value)}
        className="w-full px-2.5 py-1.5 rounded-lg border border-border bg-background text-xs focus:outline-none focus:border-primary">
        <option value="">{placeholder}</option>
        {options.map(o => (
          <option key={o.value} value={o.value}>{o.value} ({o.count})</option>
        ))}
      </select>
    </div>
  );
}

// ── Модалка аналитики ────────────────────────────────────────────────────────
function AnalyticsModal({ region, onClose, onPick }: {
  region: string; onClose: () => void;
  onPick: (f: { district?: string; activity?: string; ownership?: string }) => void;
}) {
  const [data, setData] = useState<Analytics | null>(null);
  useEffect(() => { adminApi.getSupplierAnalytics(region).then(setData).catch(() => {}); }, [region]);
  const max = (arr: { count: number }[]) => Math.max(1, ...arr.map(x => x.count));

  const Bar = ({ label, count, total, onClick }: { label: string; count: number; total: number; onClick: () => void }) => (
    <button onClick={onClick} className="w-full text-left group">
      <div className="flex items-center justify-between text-[11px] mb-0.5">
        <span className="truncate group-hover:text-primary">{label}</span>
        <span className="text-muted-foreground shrink-0 ml-2">{count}</span>
      </div>
      <div className="h-1.5 rounded-full bg-secondary overflow-hidden">
        <div className="h-full hero-gradient rounded-full" style={{ width: `${(count / total) * 100}%` }} />
      </div>
    </button>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="bg-background rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-5 border-b border-border sticky top-0 bg-background z-10">
          <div className="flex items-center gap-2">
            <Icon name="BarChart3" size={18} className="text-primary" />
            <h3 className="font-heading font-bold text-base">Аналитика · {region}</h3>
            {data && <span className="text-xs text-muted-foreground">{data.total} предприятий</span>}
          </div>
          <button onClick={onClose}><Icon name="X" size={18} className="text-muted-foreground" /></button>
        </div>
        {!data ? (
          <div className="flex justify-center py-16"><Icon name="Loader" size={24} className="animate-spin text-primary" /></div>
        ) : (
          <div className="p-5 grid md:grid-cols-2 gap-5">
            <div className="space-y-2">
              <h4 className="text-xs font-heading font-bold flex items-center gap-1.5"><Icon name="MapPin" size={13} className="text-primary" />По районам</h4>
              <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                {data.by_district.map(d => (
                  <Bar key={d.district} label={d.district} count={d.count} total={max(data.by_district)}
                    onClick={() => onPick({ district: d.district.startsWith("—") ? "" : d.district })} />
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <h4 className="text-xs font-heading font-bold flex items-center gap-1.5"><Icon name="Wheat" size={13} className="text-primary" />По видам деятельности</h4>
              <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                {data.by_activity.map(a => (
                  <Bar key={a.activity} label={a.activity} count={a.count} total={max(data.by_activity)}
                    onClick={() => onPick({ activity: a.activity })} />
                ))}
              </div>
            </div>
            <div className="space-y-2 md:col-span-2">
              <h4 className="text-xs font-heading font-bold flex items-center gap-1.5"><Icon name="Building2" size={13} className="text-primary" />По форме собственности</h4>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {data.by_ownership.map(o => (
                  <Bar key={o.ownership} label={o.ownership} count={o.count} total={max(data.by_ownership)}
                    onClick={() => onPick({ ownership: o.ownership.startsWith("—") ? "" : o.ownership })} />
                ))}
              </div>
            </div>
            <p className="md:col-span-2 text-[11px] text-muted-foreground flex items-center gap-1">
              <Icon name="MousePointerClick" size={12} />Нажмите на любую строку, чтобы отфильтровать базу
            </p>
          </div>
        )}
      </div>
    </div>
  );
}