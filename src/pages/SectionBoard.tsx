import { useState, useEffect, useCallback } from "react";
import Icon from "@/components/ui/icon";

const BOARD_URL = "https://functions.poehali.dev/6571fced-d479-410d-9c80-3af212a355f3";

const CROPS_LIST = [
  "Пшеница озимая", "Подсолнечник", "Кукуруза", "Ячмень яровой", "Рожь",
];

const REGIONS_LIST = [
  "Самарская", "Саратовская", "Волгоградская", "Краснодарский",
  "Ростовская", "Ставропольский", "Воронежская", "Белгородская",
  "Оренбургская", "Татарстан", "Башкортостан", "Ульяновская",
  "Пензенская", "Астраханская", "Курская", "Тамбовская",
];

const SOURCE_LABELS: Record<string, { label: string; color: string }> = {
  "zerno.ru":        { label: "zerno.ru",        color: "bg-emerald-100 text-emerald-700" },
  "agroserver.ru":   { label: "agroserver.ru",   color: "bg-blue-100 text-blue-700" },
  "agroinvestor.ru": { label: "agroinvestor.ru", color: "bg-purple-100 text-purple-700" },
  "user":            { label: "Пользователь",    color: "bg-amber-100 text-amber-700" },
};

interface Listing {
  id: number;
  type: "sell" | "buy";
  crop: string;
  region: string;
  price_per_ton: number;
  volume_tons: number | null;
  quality: string | null;
  contact: string | null;
  description: string | null;
  source: string;
  source_url: string | null;
  created_at: string;
}

function fmt(n: number) {
  return n.toLocaleString("ru-RU");
}

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const h = Math.floor(diff / 3_600_000);
  if (h < 1) return "только что";
  if (h < 24) return `${h} ч назад`;
  const d = Math.floor(h / 24);
  return `${d} д назад`;
}

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
  const [showForm,   setShowForm]   = useState(false);
  const [formType,   setFormType]   = useState<"sell" | "buy">("sell");
  const [formCrop,   setFormCrop]   = useState(CROPS_LIST[0]);
  const [formRegion, setFormRegion] = useState(REGIONS_LIST[0]);
  const [formPrice,  setFormPrice]  = useState("");
  const [formVolume, setFormVolume] = useState("");
  const [formQuality,setFormQuality]= useState("");
  const [formContact,setFormContact]= useState("");
  const [formDesc,   setFormDesc]   = useState("");
  const [saving,     setSaving]     = useState(false);
  const [saveOk,     setSaveOk]     = useState(false);

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

      {/* Filters + Add button row */}
      <div className="glass-card rounded-2xl p-4 space-y-3">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <h2 className="font-heading font-semibold text-sm text-foreground flex items-center gap-2">
            <Icon name="SlidersHorizontal" size={14} className="text-primary" />
            Фильтры
          </h2>
          <div className="flex gap-2">
            {hasFilters && (
              <button onClick={resetFilters} className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors">
                <Icon name="X" size={12} />Сбросить
              </button>
            )}
            <button
              onClick={() => setShowForm(v => !v)}
              className="flex items-center gap-1.5 px-4 py-2 bg-primary text-white text-xs font-semibold rounded-xl hover:bg-primary/90 transition-colors"
            >
              <Icon name="Plus" size={13} />
              Подать объявление
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
          {/* Type */}
          <div className="flex gap-1 col-span-2 sm:col-span-1">
            {(["", "sell", "buy"] as const).map(t => (
              <button
                key={t}
                onClick={() => setFilterType(t)}
                className={`flex-1 py-2 text-[11px] font-semibold rounded-lg border transition-all ${
                  filterType === t
                    ? t === "sell"
                      ? "bg-emerald-50 text-emerald-700 border-emerald-300"
                      : t === "buy"
                      ? "bg-blue-50 text-blue-700 border-blue-300"
                      : "bg-primary/10 text-primary border-primary/30"
                    : "bg-secondary text-muted-foreground border-border hover:border-primary/30"
                }`}
              >
                {t === "" ? "Все" : t === "sell" ? "Продажа" : "Покупка"}
              </button>
            ))}
          </div>

          {/* Crop */}
          <select
            value={filterCrop}
            onChange={e => setFilterCrop(e.target.value)}
            className="text-xs bg-secondary border border-border rounded-lg px-3 py-2 text-foreground focus:outline-none focus:border-primary/50 transition"
          >
            <option value="">Все культуры</option>
            {CROPS_LIST.map(c => <option key={c} value={c}>{c}</option>)}
          </select>

          {/* Region */}
          <select
            value={filterRegion}
            onChange={e => setFilterRegion(e.target.value)}
            className="text-xs bg-secondary border border-border rounded-lg px-3 py-2 text-foreground focus:outline-none focus:border-primary/50 transition"
          >
            <option value="">Все регионы</option>
            {REGIONS_LIST.map(r => <option key={r} value={r}>{r}</option>)}
          </select>

          {/* Price min */}
          <input
            type="number" min="0" step="500"
            value={filterPriceMin}
            onChange={e => setFilterPriceMin(e.target.value)}
            placeholder="Цена от ₽/т"
            className="text-xs bg-secondary border border-border rounded-lg px-3 py-2 text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary/50 transition"
          />

          {/* Price max */}
          <input
            type="number" min="0" step="500"
            value={filterPriceMax}
            onChange={e => setFilterPriceMax(e.target.value)}
            placeholder="Цена до ₽/т"
            className="text-xs bg-secondary border border-border rounded-lg px-3 py-2 text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary/50 transition"
          />

          {/* Sort */}
          <select
            value={sortBy}
            onChange={e => setSortBy(e.target.value)}
            className="text-xs bg-secondary border border-border rounded-lg px-3 py-2 text-foreground focus:outline-none focus:border-primary/50 transition"
          >
            <option value="newest">Новые сначала</option>
            <option value="price_asc">Цена: дешевле</option>
            <option value="price_desc">Цена: дороже</option>
          </select>
        </div>
      </div>

      {/* Add form */}
      {showForm && (
        <div className="glass-card rounded-2xl p-5 border-2 border-primary/15">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center">
              <Icon name="Plus" size={14} className="text-primary" />
            </div>
            <h3 className="font-heading font-bold text-sm text-foreground">Новое объявление</h3>
          </div>

          <form onSubmit={handleAdd} className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {/* Type */}
            <div className="lg:col-span-3">
              <label className="text-xs text-muted-foreground mb-1.5 block font-medium">Тип сделки</label>
              <div className="flex gap-2">
                {(["sell", "buy"] as const).map(t => (
                  <button type="button" key={t} onClick={() => setFormType(t)}
                    className={`flex-1 py-2.5 text-xs font-semibold rounded-xl border transition-all flex items-center justify-center gap-1.5 ${
                      formType === t
                        ? t === "sell"
                          ? "bg-emerald-50 text-emerald-700 border-emerald-300"
                          : "bg-blue-50 text-blue-700 border-blue-300"
                        : "bg-secondary text-muted-foreground border-border hover:border-primary/30"
                    }`}
                  >
                    <Icon name={t === "sell" ? "TrendingUp" : "ShoppingCart"} size={12} />
                    {t === "sell" ? "Продажа" : "Покупка"}
                  </button>
                ))}
              </div>
            </div>

            {/* Crop */}
            <div>
              <label className="text-xs text-muted-foreground mb-1.5 block font-medium">Культура</label>
              <select value={formCrop} onChange={e => setFormCrop(e.target.value)}
                className="w-full text-sm bg-secondary border border-border rounded-lg px-3 py-2 text-foreground focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20 transition">
                {CROPS_LIST.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>

            {/* Region */}
            <div>
              <label className="text-xs text-muted-foreground mb-1.5 block font-medium">Регион</label>
              <select value={formRegion} onChange={e => setFormRegion(e.target.value)}
                className="w-full text-sm bg-secondary border border-border rounded-lg px-3 py-2 text-foreground focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20 transition">
                {REGIONS_LIST.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>

            {/* Price */}
            <div>
              <label className="text-xs text-muted-foreground mb-1.5 block font-medium">Цена ₽/т <span className="text-destructive">*</span></label>
              <input required type="number" min="1" step="100" value={formPrice} onChange={e => setFormPrice(e.target.value)}
                placeholder="напр. 13500"
                className="w-full text-sm bg-secondary border border-border rounded-lg px-3 py-2 text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20 transition" />
            </div>

            {/* Volume */}
            <div>
              <label className="text-xs text-muted-foreground mb-1.5 block font-medium">Объём (т) <span className="text-muted-foreground/50">(необяз.)</span></label>
              <input type="number" min="0.1" step="0.5" value={formVolume} onChange={e => setFormVolume(e.target.value)}
                placeholder="напр. 200"
                className="w-full text-sm bg-secondary border border-border rounded-lg px-3 py-2 text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20 transition" />
            </div>

            {/* Quality */}
            <div>
              <label className="text-xs text-muted-foreground mb-1.5 block font-medium">Качество / класс</label>
              <input type="text" value={formQuality} onChange={e => setFormQuality(e.target.value)}
                placeholder="3 класс, влажность 14%..."
                className="w-full text-sm bg-secondary border border-border rounded-lg px-3 py-2 text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20 transition" />
            </div>

            {/* Contact */}
            <div>
              <label className="text-xs text-muted-foreground mb-1.5 block font-medium">Контакт</label>
              <input type="text" value={formContact} onChange={e => setFormContact(e.target.value)}
                placeholder="+7 900 000-00-00 или email"
                className="w-full text-sm bg-secondary border border-border rounded-lg px-3 py-2 text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20 transition" />
            </div>

            {/* Description */}
            <div className="sm:col-span-2 lg:col-span-2">
              <label className="text-xs text-muted-foreground mb-1.5 block font-medium">Описание</label>
              <textarea value={formDesc} onChange={e => setFormDesc(e.target.value)} rows={2}
                placeholder="Район, условия, самовывоз или доставка..."
                className="w-full text-sm bg-secondary border border-border rounded-lg px-3 py-2 text-foreground placeholder:text-muted-foreground/50 resize-none focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20 transition" />
            </div>

            {/* Submit */}
            <div className="lg:col-span-3 flex gap-3">
              <button type="submit" disabled={saving || !formPrice}
                className="flex items-center gap-2 px-6 py-2.5 bg-primary text-white text-sm font-semibold rounded-xl hover:bg-primary/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed">
                {saving ? <Icon name="Loader2" size={14} className="animate-spin" /> : <Icon name="Send" size={14} />}
                {saving ? "Публикую…" : "Опубликовать"}
              </button>
              <button type="button" onClick={() => setShowForm(false)}
                className="px-4 py-2.5 text-sm text-muted-foreground border border-border rounded-xl hover:text-foreground transition-colors">
                Отмена
              </button>
            </div>
          </form>
        </div>
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
          {listings.map(l => {
            const isSell = l.type === "sell";
            const src = SOURCE_LABELS[l.source] ?? { label: l.source, color: "bg-gray-100 text-gray-600" };
            const isExpanded = expandedId === l.id;

            return (
              <div key={l.id} className="glass-card rounded-2xl p-4 sm:p-5 transition-all hover:shadow-md">
                <div className="flex items-start justify-between gap-3 flex-wrap">
                  {/* Left: type badge + crop */}
                  <div className="flex items-start gap-3">
                    <div className={`mt-0.5 px-2.5 py-1 rounded-lg text-[11px] font-bold shrink-0 ${
                      isSell ? "bg-emerald-100 text-emerald-700" : "bg-blue-100 text-blue-700"
                    }`}>
                      {isSell ? "ПРОДАЖА" : "ПОКУПКА"}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-heading font-bold text-sm text-foreground">{l.crop}</span>
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <Icon name="MapPin" size={11} />
                          {l.region}
                        </span>
                      </div>
                      {l.quality && (
                        <p className="text-[11px] text-muted-foreground mt-0.5">{l.quality}</p>
                      )}
                      {l.description && (
                        <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{l.description}</p>
                      )}
                    </div>
                  </div>

                  {/* Right: price */}
                  <div className="text-right shrink-0">
                    <p className={`text-xl font-heading font-black ${isSell ? "text-emerald-600" : "text-blue-600"}`}>
                      {fmt(l.price_per_ton)} ₽/т
                    </p>
                    {l.volume_tons && (
                      <p className="text-xs text-muted-foreground font-mono mt-0.5">
                        {fmt(l.volume_tons)} т
                      </p>
                    )}
                  </div>
                </div>

                {/* Footer */}
                <div className="mt-3 flex items-center gap-3 flex-wrap">
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${src.color}`}>
                    {src.label}
                  </span>
                  <span className="text-[11px] text-muted-foreground font-mono flex items-center gap-1">
                    <Icon name="Clock" size={10} />
                    {timeAgo(l.created_at)}
                  </span>

                  {l.source_url && l.source !== "user" && (
                    <a href={l.source_url} target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-1 text-[11px] font-medium text-primary hover:text-primary/70 transition-colors border border-primary/20 rounded-lg px-2 py-0.5">
                      <Icon name="ExternalLink" size={11} />
                      Оригинал объявления
                    </a>
                  )}

                  {l.contact && (
                    <button
                      onClick={() => setExpandedId(isExpanded ? null : l.id)}
                      className="ml-auto flex items-center gap-1.5 text-xs font-medium text-primary hover:text-primary/80 transition-colors"
                    >
                      <Icon name={isExpanded ? "EyeOff" : "Phone"} size={12} />
                      {isExpanded ? "Скрыть" : "Показать контакт"}
                    </button>
                  )}
                </div>

                {/* Contact reveal */}
                {isExpanded && l.contact && (
                  <div className="mt-3 flex items-center gap-2 p-3 bg-primary/5 border border-primary/15 rounded-xl text-sm text-foreground">
                    <Icon name="Phone" size={14} className="text-primary shrink-0" />
                    <span className="font-medium">{l.contact}</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Info footer */}
      <div className="rounded-xl bg-secondary/60 border border-border p-3 flex items-start gap-2.5">
        <Icon name="Info" size={13} className="text-muted-foreground shrink-0 mt-0.5" />
        <p className="text-[11px] text-muted-foreground leading-relaxed">
          Объявления агрегированы с площадок zerno.ru, agroserver.ru и agroinvestor.ru и обновляются ежедневно.
          Ваши объявления публикуются сразу и действуют 30 дней.
          АгроПорт не является стороной сделки — проверяйте контрагентов самостоятельно.
        </p>
      </div>
    </div>
  );
}