import { useEffect, useState, useRef } from "react";
import * as XLSX from "xlsx";
import { adminApi } from "@/lib/adminApi";
import { apiCRM } from "@/lib/auth";
import Icon from "@/components/ui/icon";
import { Supplier, Facets, QualityReport, REGION, STATUS_LABELS } from "./shared";
import SupplierCard from "./SupplierCard";
import RadarPanel from "./RadarPanel";
import SuppliersFilters from "./SuppliersFilters";
import SuppliersQualityPanel from "./SuppliersQualityPanel";
import SuppliersList from "./SuppliersList";
import AnalyticsModal from "./SuppliersAnalyticsModal";

// ── Блок базы поставщиков ────────────────────────────────────────────────────
export default function SuppliersBlock() {
  const [data, setData] = useState<{ suppliers: Supplier[]; total: number; pages: number; stats: Record<string, number> } | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [region, setRegion] = useState("");         // "" = вся Россия (полная база)
  const [district, setDistrict] = useState("");
  const [activity, setActivity] = useState("");
  const [crop, setCrop] = useState("");
  const [ownership, setOwnership] = useState("");
  const [farmer, setFarmer] = useState(true);       // по умолчанию — только сельхозпроизводители
  const [priorityOnly, setPriorityOnly] = useState(false); // районы вокруг Аткарска
  const [hasEmail, setHasEmail] = useState(false);   // только с электронной почтой
  const [hasPhone, setHasPhone] = useState(false);   // только с телефоном
  const [page, setPage] = useState(1);
  const [card, setCard] = useState<Partial<Supplier> | null>(null);
  const [importMsg, setImportMsg] = useState("");
  const [importing, setImporting] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [enrichingAll, setEnrichingAll] = useState(false);
  const [crmImporting, setCrmImporting] = useState(false);
  const [facets, setFacets] = useState<Facets | null>(null);
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [quality, setQuality] = useState<QualityReport | null>(null);
  const [qualityLoading, setQualityLoading] = useState(false);
  const [showQuality, setShowQuality] = useState(false);
  const [showRadar, setShowRadar] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const filterParams = () => ({
    region, district, activity, crop, ownership, search, status,
    farmer: farmer ? "1" : "",
    priority: priorityOnly ? "2" : "",
    has_email: hasEmail ? "1" : "",
    has_phone: hasPhone ? "1" : "",
  });

  const load = () => {
    setLoading(true);
    adminApi.getSuppliers({ ...filterParams(), page })
      .then(setData).finally(() => setLoading(false));
  };
  useEffect(() => { load(); }, [search, status, region, district, activity, crop, ownership, farmer, priorityOnly, hasEmail, hasPhone, page]);

  // Справочники фильтров зависят от выбранного региона
  useEffect(() => {
    adminApi.getSupplierFacets(region, "").then(setFacets).catch(() => {});
  }, [region]);

  // Анализ качества данных по текущей выборке фильтров
  const runQuality = async () => {
    if (showQuality) { setShowQuality(false); return; }
    setShowQuality(true); setQualityLoading(true);
    try {
      const r = await adminApi.suppliersQuality(filterParams());
      setQuality(r);
    } catch {
      setQuality(null);
    } finally { setQualityLoading(false); }
  };

  const resetFilters = () => {
    setDistrict(""); setActivity(""); setCrop(""); setOwnership(""); setSearch(""); setStatus("");
    setRegion(""); setPriorityOnly(false); setHasEmail(false); setHasPhone(false); setPage(1);
  };
  const activeFilters = [region, district, activity, crop, ownership].filter(Boolean).length + (priorityOnly ? 1 : 0);

  // Убрать дубли из базы поставщиков (по ИНН, а при пустом ИНН — по названию+районе)
  const handleDedup = async () => {
    setImportMsg("Ищу дубли…");
    try {
      const prev = await adminApi.dedupSuppliers(true);
      const dup = prev?.duplicates || 0;
      if (dup === 0) { setImportMsg("Дубли не найдены — база чистая."); return; }
      if (!confirm(`Найдено дублей: ${dup}. Удалить их, оставив по одной лучшей записи на хозяйство?`)) {
        setImportMsg(""); return;
      }
      setImportMsg("Удаляю дубли…");
      const r = await adminApi.dedupSuppliers(false);
      setImportMsg(`Удалено дублей: ${r.removed}. Осталось хозяйств: ${r.remaining}.`);
      setPage(1); load();
    } catch (e: unknown) {
      setImportMsg(e instanceof Error ? e.message : "Ошибка при удалении дублей");
    }
  };

  // Массовый перенос отфильтрованных хозяйств в контакты CRM
  const handleCrmImport = async () => {
    const limit = 500;
    if (!confirm(`Перенести отфильтрованные хозяйства в контакты CRM (до ${limit} за раз)?\nДубликаты по ИНН будут пропущены.`)) return;
    setCrmImporting(true); setImportMsg("Переношу хозяйства в CRM…");
    try {
      const r = await apiCRM("import_suppliers_bulk", {
        region: region || undefined,
        district: district || undefined,
        priority_only: priorityOnly,
        farmer_only: farmer,
        limit,
      });
      if (r?.success) {
        setImportMsg(`Перенесено в CRM: ${r.imported}. Пропущено (дубли/лимит): ${r.skipped}. Всего под фильтр: ${r.total_match}.`);
      } else {
        setImportMsg(r?.error || "Не удалось перенести в CRM");
      }
    } catch {
      setImportMsg("Ошибка соединения с CRM");
    } finally { setCrmImporting(false); }
  };

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

  const downloadTemplate = () => {
    const rows = [{
      "Название хозяйства": "ООО Пример / КФХ Иванов",
      "ИНН": "6400000000",
      "Район": "Аткарский",
      "Населённый пункт": "с. Пример",
      "Культуры / продукция": "пшеница, подсолнечник",
      "Объём, т": 1500,
      "Контактное лицо": "Иванов Иван Иванович",
      "Телефон": "+7 900 000-00-00",
      "Email": "example@mail.ru",
      "Адрес": "Саратовская обл., Аткарский р-н, с. Пример",
    }];
    const ws = XLSX.utils.json_to_sheet(rows);
    ws["!cols"] = [{ wch: 26 }, { wch: 14 }, { wch: 16 }, { wch: 18 }, { wch: 24 }, { wch: 10 }, { wch: 26 }, { wch: 18 }, { wch: 20 }, { wch: 36 }];
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Шаблон");
    XLSX.writeFile(wb, "шаблон_загрузки_хозяйств.xlsx");
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

  // Массовое ИИ-обогащение саратовских хозяйств без досье (партиями)
  const handleEnrichAll = async () => {
    if (!confirm("ИИ сформирует досье для саратовских хозяйств без анализа. Это может занять несколько минут. Продолжить?")) return;
    setEnrichingAll(true); setImportMsg("ИИ обогащает карточки…");
    try {
      let totalDone = 0;
      for (let i = 0; i < 60; i++) {
        const res = await adminApi.enrichSuppliersBatch("64", 4);
        totalDone += res.processed || 0;
        setImportMsg(`ИИ обработал ${totalDone} хозяйств, осталось ~${res.remaining}…`);
        if (!res.processed || res.remaining <= 0) break;
      }
      setImportMsg(`Готово. ИИ сформировал досье для ${totalDone} хозяйств.`);
      load();
    } catch (e: unknown) {
      setImportMsg(e instanceof Error ? e.message : "Ошибка обогащения");
    } finally { setEnrichingAll(false); }
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
          <button onClick={() => setShowRadar(v => !v)} title="Рейтинг потенциальных клиентов по вероятности сделки"
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium ${showRadar ? "bg-primary text-white" : "bg-secondary hover:bg-secondary/80"}`}>
            <Icon name="Radar" size={13} className={showRadar ? "" : "text-primary"} />Радар
          </button>
          <button onClick={() => setShowAnalytics(true)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-secondary text-xs font-medium hover:bg-secondary/80">
            <Icon name="BarChart3" size={13} className="text-primary" />Аналитика
          </button>
          <button onClick={runQuality} title="Анализ качества данных по текущей выборке фильтров"
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium ${showQuality ? "bg-primary text-white" : "bg-secondary hover:bg-secondary/80"}`}>
            <Icon name="ClipboardCheck" size={13} className={showQuality ? "" : "text-primary"} />Анализ
          </button>
          <button onClick={handleExport} disabled={exporting}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-secondary text-xs font-medium hover:bg-secondary/80 disabled:opacity-60">
            {exporting ? <Icon name="Loader" size={13} className="animate-spin" /> : <Icon name="Download" size={13} className="text-primary" />}
            Выгрузить
          </button>
          <button onClick={handleEnrichAll} disabled={enrichingAll} title="ИИ формирует досье для саратовских хозяйств без анализа"
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-secondary text-xs font-medium hover:bg-secondary/80 disabled:opacity-60">
            {enrichingAll ? <Icon name="Loader" size={13} className="animate-spin" /> : <Icon name="Wand2" size={13} className="text-primary" />}
            ИИ-обогащение
          </button>
          <button onClick={handleCrmImport} disabled={crmImporting} title="Перенести отфильтрованные хозяйства в контакты CRM"
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-secondary text-xs font-medium hover:bg-secondary/80 disabled:opacity-60">
            {crmImporting ? <Icon name="Loader" size={13} className="animate-spin" /> : <Icon name="Contact" size={13} className="text-primary" />}
            Перенести в CRM
          </button>
          <button onClick={handleDedup} title="Найти и удалить дубли (по ИНН, при пустом — по названию и району)"
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-secondary text-xs font-medium hover:bg-secondary/80">
            <Icon name="CopyMinus" size={13} className="text-primary" />Убрать дубли
          </button>
          <button onClick={downloadTemplate} title="Скачать пустой Excel с нужными колонками"
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-secondary text-xs font-medium hover:bg-secondary/80">
            <Icon name="FileSpreadsheet" size={13} className="text-primary" />Шаблон
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

      {/* Радар потенциальных клиентов */}
      {showRadar && (
        <RadarPanel
          filterParams={filterParams}
          onClose={() => setShowRadar(false)}
          onOpen={(item) => setCard(item)}
        />
      )}

      {/* Анализ качества данных */}
      {showQuality && (
        <SuppliersQualityPanel quality={quality} qualityLoading={qualityLoading} setShowQuality={setShowQuality} />
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
        <input value={search} onChange={e => { setSearch(e.target.value); setPage(1); }}
          placeholder="Умный поиск: название, ИНН, ФИО, телефон, район, культура…"
          className="w-full pl-8 pr-8 py-2 rounded-xl border border-border bg-background text-sm focus:outline-none focus:border-primary" />
        {search && (
          <button onClick={() => { setSearch(""); setPage(1); }}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
            <Icon name="X" size={14} />
          </button>
        )}
      </div>
      <p className="text-[11px] text-muted-foreground -mt-1 flex items-center gap-1.5">
        <Icon name="Sparkles" size={11} className="text-primary" />
        Ищет с полуслова по всем полям. Можно вводить несколько слов и даже в неверной раскладке — система поймёт.
      </p>

      {/* Панель фильтров */}
      <SuppliersFilters
        region={region} setRegion={setRegion} district={district} setDistrict={setDistrict}
        activity={activity} setActivity={setActivity} ownership={ownership} setOwnership={setOwnership}
        crop={crop} setCrop={setCrop} farmer={farmer} setFarmer={setFarmer}
        priorityOnly={priorityOnly} setPriorityOnly={setPriorityOnly} hasEmail={hasEmail} setHasEmail={setHasEmail}
        hasPhone={hasPhone} setHasPhone={setHasPhone} setPage={setPage} facets={facets}
        activeFilters={activeFilters} resetFilters={resetFilters}
      />

      <SuppliersList loading={loading} data={data} page={page} setPage={setPage} setCard={setCard} handleDelete={handleDelete} />

      {card && <SupplierCard item={card} onClose={() => { setCard(null); load(); }} onSaved={() => { setCard(null); load(); }} />}
      {showAnalytics && <AnalyticsModal region={region} onClose={() => setShowAnalytics(false)}
        onPick={(f) => { if (f.district !== undefined) setDistrict(f.district); if (f.activity !== undefined) setActivity(f.activity); if (f.ownership !== undefined) setOwnership(f.ownership); setPage(1); setShowAnalytics(false); }} />}
    </div>
  );
}
