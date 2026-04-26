import { useState, useEffect, useCallback } from "react";
import Icon from "@/components/ui/icon";
import { BOARD_URL, CROPS_LIST, REGIONS_LIST, Listing } from "./BoardTypes";
import { BoardFilters } from "./BoardFilters";
import { BoardAddForm } from "./BoardAddForm";
import { BoardListingCard } from "./BoardListingCard";

export default function SectionBoard() {
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading]   = useState(true);
  const [total, setTotal]       = useState(0);
  const [sellCount, setSellCount] = useState(0);
  const [buyCount, setBuyCount]   = useState(0);

  // Filters
  const [filterType,     setFilterType]     = useState<"" | "sell" | "buy">("");
  const [filterCrop,     setFilterCrop]     = useState("");
  const [filterRegion,   setFilterRegion]   = useState("");
  const [filterPriceMin, setFilterPriceMin] = useState("");
  const [filterPriceMax, setFilterPriceMax] = useState("");
  const [sortBy,         setSortBy]         = useState("newest");

  // Add form
  const [showForm,    setShowForm]    = useState(false);
  const [formType,    setFormType]    = useState<"sell" | "buy">("sell");
  const [formCrop,    setFormCrop]    = useState(CROPS_LIST[0]);
  const [formRegion,  setFormRegion]  = useState(REGIONS_LIST[0]);
  const [formPrice,   setFormPrice]   = useState("");
  const [formVolume,  setFormVolume]  = useState("");
  const [formQuality, setFormQuality] = useState("");
  const [formContact, setFormContact] = useState("");
  const [formDesc,    setFormDesc]    = useState("");
  const [saving,      setSaving]      = useState(false);
  const [saveOk,      setSaveOk]      = useState(false);

  // Expanded contact
  const [expandedId, setExpandedId] = useState<number | null>(null);

  const fetchListings = useCallback(async () => {
    setLoading(true);
    try {
      const body: Record<string, unknown> = { action: "list", sort: sortBy };
      if (filterType)     body.type      = filterType;
      if (filterCrop)     body.crop      = filterCrop;
      if (filterRegion)   body.region    = filterRegion;
      if (filterPriceMin) body.price_min = parseInt(filterPriceMin);
      if (filterPriceMax) body.price_max = parseInt(filterPriceMax);

      const res = await fetch(BOARD_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      setListings(data.listings ?? []);
      setTotal(data.total ?? 0);
      setSellCount(data.sell_count ?? 0);
      setBuyCount(data.buy_count ?? 0);
    } catch {
      setListings([]);
    } finally {
      setLoading(false);
    }
  }, [filterType, filterCrop, filterRegion, filterPriceMin, filterPriceMax, sortBy]);

  useEffect(() => { fetchListings(); }, [fetchListings]);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formPrice || parseInt(formPrice) <= 0) return;
    setSaving(true);
    try {
      await fetch(BOARD_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "add",
          type: formType,
          crop: formCrop,
          region: formRegion,
          price_per_ton: parseInt(formPrice),
          volume_tons: formVolume ? parseFloat(formVolume) : undefined,
          quality: formQuality || undefined,
          contact: formContact || undefined,
          description: formDesc || undefined,
        }),
      });
      setSaveOk(true);
      setShowForm(false);
      setFormPrice(""); setFormVolume(""); setFormQuality("");
      setFormContact(""); setFormDesc("");
      setTimeout(() => setSaveOk(false), 3000);
      fetchListings();
    } finally {
      setSaving(false);
    }
  };

  const resetFilters = () => {
    setFilterType(""); setFilterCrop(""); setFilterRegion("");
    setFilterPriceMin(""); setFilterPriceMax(""); setSortBy("newest");
  };

  const hasFilters = filterType || filterCrop || filterRegion || filterPriceMin || filterPriceMax;

  return (
    <div className="space-y-5 animate-fade-in">

      {/* Hero */}
      <div className="hero-gradient rounded-2xl p-5 sm:p-7 relative overflow-hidden shadow-md">
        <div className="hero-gradient-overlay absolute inset-0" />
        <div className="bg-dots absolute inset-0 opacity-15" />
        <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <Icon name="ShoppingCart" size={13} className="text-white/70" />
              <span className="text-white/55 text-xs font-mono uppercase tracking-widest">АгроПорт · Доска объявлений</span>
            </div>
            <h1 className="font-heading font-black text-2xl sm:text-3xl text-white leading-tight">
              Купля и <span className="gold-text">продажа</span>
            </h1>
            <p className="text-white/60 text-sm mt-1 font-body">
              Агрегатор объявлений · zerno.ru · agroserver.ru · agroinvestor.ru · ваши объявления
            </p>
          </div>
          <div className="flex flex-wrap gap-2 shrink-0">
            <div className="flex flex-col items-center px-4 py-2.5 rounded-xl bg-white/10 border border-white/20 min-w-[80px]">
              <span className="text-white/55 text-[10px] uppercase tracking-wider font-mono">Всего</span>
              <span className="text-white font-heading font-black text-lg">{loading ? "…" : total}</span>
            </div>
            <div className="flex flex-col items-center px-4 py-2.5 rounded-xl bg-emerald-500/20 border border-emerald-300/30 min-w-[80px]">
              <span className="text-emerald-200 text-[10px] uppercase tracking-wider font-mono">Продажа</span>
              <span className="text-white font-heading font-black text-lg">{loading ? "…" : sellCount}</span>
            </div>
            <div className="flex flex-col items-center px-4 py-2.5 rounded-xl bg-blue-500/20 border border-blue-300/30 min-w-[80px]">
              <span className="text-blue-200 text-[10px] uppercase tracking-wider font-mono">Покупка</span>
              <span className="text-white font-heading font-black text-lg">{loading ? "…" : buyCount}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Success banner */}
      {saveOk && (
        <div className="flex items-center gap-3 p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl text-sm text-emerald-700">
          <Icon name="CheckCircle" size={16} className="text-emerald-500 shrink-0" />
          Объявление опубликовано и появится в списке
        </div>
      )}

      {/* Filters */}
      <BoardFilters
        filterType={filterType}
        filterCrop={filterCrop}
        filterRegion={filterRegion}
        filterPriceMin={filterPriceMin}
        filterPriceMax={filterPriceMax}
        sortBy={sortBy}
        hasFilters={!!hasFilters}
        onFilterType={setFilterType}
        onFilterCrop={setFilterCrop}
        onFilterRegion={setFilterRegion}
        onFilterPriceMin={setFilterPriceMin}
        onFilterPriceMax={setFilterPriceMax}
        onSortBy={setSortBy}
        onReset={resetFilters}
        onShowForm={() => setShowForm(v => !v)}
      />

      {/* Add form */}
      {showForm && (
        <BoardAddForm
          formType={formType}
          formCrop={formCrop}
          formRegion={formRegion}
          formPrice={formPrice}
          formVolume={formVolume}
          formQuality={formQuality}
          formContact={formContact}
          formDesc={formDesc}
          saving={saving}
          onFormType={setFormType}
          onFormCrop={setFormCrop}
          onFormRegion={setFormRegion}
          onFormPrice={setFormPrice}
          onFormVolume={setFormVolume}
          onFormQuality={setFormQuality}
          onFormContact={setFormContact}
          onFormDesc={setFormDesc}
          onSubmit={handleAdd}
          onCancel={() => setShowForm(false)}
        />
      )}

      {/* Listings */}
      {loading ? (
        <div className="glass-card rounded-2xl p-12 flex flex-col items-center gap-3">
          <Icon name="Loader2" size={28} className="text-primary animate-spin" />
          <p className="text-sm text-muted-foreground">Загружаю объявления…</p>
        </div>
      ) : listings.length === 0 ? (
        <div className="glass-card rounded-2xl p-12 flex flex-col items-center gap-4 text-center">
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
            <Icon name="ShoppingCart" size={28} className="text-primary/50" />
          </div>
          <div>
            <p className="font-heading font-bold text-base text-foreground">Объявлений не найдено</p>
            <p className="text-sm text-muted-foreground mt-1">Попробуйте изменить фильтры или подайте своё объявление</p>
          </div>
          {hasFilters && (
            <button onClick={resetFilters} className="text-xs text-primary hover:underline">Сбросить фильтры</button>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {listings.map(l => (
            <BoardListingCard
              key={l.id}
              listing={l}
              isExpanded={expandedId === l.id}
              onToggleExpand={id => setExpandedId(expandedId === id ? null : id)}
            />
          ))}
        </div>
      )}

      {/* External platforms */}
      <div className="glass-card rounded-2xl p-4 sm:p-5">
        <h2 className="font-heading font-semibold text-sm text-foreground flex items-center gap-2 mb-3">
          <Icon name="ExternalLink" size={14} className="text-primary" />
          Внешние торговые площадки
        </h2>
        <p className="text-xs text-muted-foreground mb-4">
          Живые объявления от реальных участников рынка — напрямую на площадках:
        </p>
        <div className="grid sm:grid-cols-3 gap-3">
          {[
            {
              name: "Зерно.ру",
              desc: "Торговля зерном, мукой и масличными. Тысячи объявлений от аграриев.",
              url: "https://zerno.ru/trade",
              color: "bg-emerald-50 border-emerald-200",
              badge: "bg-emerald-100 text-emerald-700",
            },
            {
              name: "АгроСервер",
              desc: "Крупнейшая доска объявлений агропромышленного рынка России.",
              url: "https://agroserver.ru",
              color: "bg-blue-50 border-blue-200",
              badge: "bg-blue-100 text-blue-700",
            },
            {
              name: "Фермер.ру",
              desc: "Форум и база объявлений по купле-продаже зерна от фермеров.",
              url: "https://fermer.ru/forum/torgovlya-zernom-i-zernobobulovymi",
              color: "bg-amber-50 border-amber-200",
              badge: "bg-amber-100 text-amber-700",
            },
          ].map(p => (
            <a
              key={p.name}
              href={p.url}
              target="_blank"
              rel="noopener noreferrer"
              className={`flex flex-col gap-2 p-4 rounded-xl border ${p.color} hover:shadow-md transition-all group`}
            >
              <div className="flex items-center justify-between">
                <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${p.badge}`}>{p.name}</span>
                <Icon name="ArrowUpRight" size={14} className="text-muted-foreground group-hover:text-foreground transition-colors" />
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">{p.desc}</p>
            </a>
          ))}
        </div>
      </div>

      {/* Info footer */}
      <div className="rounded-xl bg-secondary/60 border border-border p-3 flex items-start gap-2.5">
        <Icon name="Info" size={13} className="text-muted-foreground shrink-0 mt-0.5" />
        <p className="text-[11px] text-muted-foreground leading-relaxed">
          Ваши объявления публикуются сразу и действуют 30 дней.
          АгроПорт не является стороной сделки — проверяйте контрагентов самостоятельно.
        </p>
      </div>
    </div>
  );
}