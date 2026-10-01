import Icon from "@/components/ui/icon";

const SOURCE_NAMES: Record<string, string> = { cenazerna: "Цена Зерна", mcx: "Минсельхоз", zerno: "zerno.ru", ikar: "ИКАР", agroinvestor: "Агроинвестор" };

// ── Types ──────────────────────────────────────────────────────────────────
export interface LivePrice {
  crop: string;
  price: number;
  change: number | null;
  change_pct: number | null;
  change_period: string | null;
  trend: "up" | "down" | "flat" | null;
  range_min: number | null;
  range_max: number | null;
  buyers: number | null;
  offers: number | null;
  small_sample?: boolean;
  price_date: string | null;
  region: string;
  quality: string;
  source: string;
  fetched_at: string;
  is_fallback: boolean;
}

export interface PricesResponse {
  prices: LivePrice[];
  updated_at: string;
  any_live: boolean;
  source_status: Record<string, string>;
  from_cache?: boolean;
  stored_age_min?: number;
  cache_age_min?: number;
}

// ── Helper: format timestamp in Russian ───────────────────────────────────
function fmtRuDateTime(iso: string): string {
  try {
    const d = new Date(iso + (iso.endsWith("Z") ? "" : "Z"));
    const months = ["янв","фев","мар","апр","май","июн","июл","авг","сен","окт","ноя","дек"];
    const dd  = d.getUTCDate();
    const mon = months[d.getUTCMonth()];
    const hh  = String(d.getUTCHours()).padStart(2, "0");
    const mm  = String(d.getUTCMinutes()).padStart(2, "0");
    return `${dd} ${mon} ${d.getUTCFullYear()}, ${hh}:${mm}`;
  } catch {
    return iso;
  }
}

// ── Актуальные котировки ───────────────────────────────────────────────────
export default function LiveQuotesPanel({
  pricesData, pricesLoading, pricesError, liveCount, cropFull, setSelectedCrop,
}: {
  pricesData: PricesResponse | null;
  pricesLoading: boolean;
  pricesError: boolean;
  liveCount: number;
  cropFull: string;
  setSelectedCrop: (crop: string) => void;
}) {
  // ── Актуальные котировки ──
  return (
    <div className="glass-card rounded-2xl overflow-hidden">
      {/* Header */}
      <div className="px-5 py-3.5 border-b border-border flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center">
            <Icon name="BarChart2" size={14} className="text-primary" />
          </div>
          <span className="font-heading font-semibold text-sm text-foreground">Актуальные котировки</span>
          {/* Live / cache badge */}
          {!pricesLoading && pricesData && (
            liveCount > 0
              ? <span className="flex items-center gap-1 text-[10px] text-primary bg-primary/10 border border-primary/20 px-2 py-0.5 rounded-full font-mono">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                  LIVE · {new Set((pricesData?.prices ?? []).filter(p => !p.is_fallback).map(p => p.source.replace(" (сохранено)", ""))).size} источн.
                </span>
              : <span className="flex items-center gap-1 text-[10px] text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full font-mono">
                  <Icon name="Clock" size={9} />
                  Данные из кэша
                </span>
          )}
          {pricesLoading && (
            <span className="flex items-center gap-1 text-[10px] text-muted-foreground animate-pulse bg-secondary px-2 py-0.5 rounded-full">
              <Icon name="Loader2" size={9} className="animate-spin" />загрузка...
            </span>
          )}
        </div>

        {/* Timestamp */}
        {!pricesLoading && pricesData?.updated_at && (
          <span className="text-[10px] text-muted-foreground font-mono flex items-center gap-1">
            <Icon name="RefreshCw" size={9} />
            Данные обновлены: {fmtRuDateTime(pricesData.updated_at)}
          </span>
        )}
      </div>

      {/* Prices ticker grid */}
      <div className="p-4">
        {pricesLoading ? (
          /* Skeleton */
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="rounded-xl bg-secondary/60 animate-pulse h-20" />
            ))}
          </div>
        ) : pricesError ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground px-2 py-3">
            <Icon name="WifiOff" size={14} className="text-red-400" />
            Не удалось загрузить котировки — показаны ориентировочные значения
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            {(pricesData?.prices ?? []).map(p => {
              const isUp      = p.trend === "up";
              const isSel     = cropFull === p.crop;

              return (
                <button
                  key={p.crop}
                  onClick={() => setSelectedCrop(p.crop)}
                  className={`relative text-left rounded-xl border p-3 transition-all hover:scale-[1.02] hover:shadow-sm active:scale-[0.98]
                    ${isSel
                      ? "border-primary/40 bg-primary/5 shadow-sm ring-1 ring-primary/15"
                      : "border-border bg-background hover:border-primary/25"}`}
                >
                  {/* Source badge */}
                  <div className="flex items-center justify-between mb-1.5">
                    <span className={`text-[9px] font-mono px-1.5 py-0.5 rounded-full
                      ${p.is_fallback
                        ? "bg-amber-50 text-amber-600 border border-amber-200"
                        : "bg-primary/10 text-primary border border-primary/20"}`}>
                      {p.source.replace(" (кэш)", "")}
                    </span>
                    {p.is_fallback && (
                      <Icon name="Clock" size={9} className="text-amber-400" />
                    )}
                  </div>

                  {/* Crop name */}
                  <p className="text-[11px] font-semibold text-foreground leading-tight mb-1.5">
                    {p.crop}
                  </p>

                  {/* Price */}
                  <p className="font-mono font-black text-base text-foreground leading-none">
                    {p.price.toLocaleString("ru")}
                    <span className="text-[10px] font-normal text-muted-foreground ml-0.5">₽/т</span>
                  </p>

                  {/* Change vs previous day */}
                  {p.change !== null && p.trend !== "flat" && (
                    <div className={`flex items-center gap-1 mt-1.5 text-[10px] font-mono font-semibold
                      ${isUp ? "text-emerald-600" : "text-red-500"}`}>
                      <Icon name={isUp ? "TrendingUp" : "TrendingDown"} size={10} />
                      {isUp ? "+" : "−"}{Math.abs(p.change).toLocaleString("ru")} ₽ за {p.change_period}
                    </div>
                  )}
                  {p.trend === "flat" && (
                    <div className="mt-1.5 text-[10px] font-mono text-muted-foreground">без изменений за {p.change_period}</div>
                  )}
                  {p.range_min !== null && (
                    <div className="mt-1 text-[10px] text-muted-foreground leading-tight">
                      {p.range_min.toLocaleString("ru")}–{p.range_max?.toLocaleString("ru")} · {p.buyers} закуп.
                      {p.small_sample && <span className="text-amber-600"> · мало данных</span>}
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        )}

        {!pricesLoading && (pricesData?.prices ?? []).some(p => p.source.startsWith("Цена Зерна")) && (
          <p className="mt-3 text-[10px] text-muted-foreground leading-relaxed">
            Цена — медиана цен закупщиков на условиях доставки до покупателя (CPT) по данным сервиса «Цена Зерна»
            (ценазерна.рф); диапазон и число закупщиков — на последнюю дату публикации. Не совпадает с ценами
            производителей Росстата, которые используются для прогноза: другая методика и состав сделок.
          </p>
        )}
        {/* Source status footer */}
        {!pricesLoading && pricesData?.source_status && (
          <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t border-border/50">
            {Object.entries(pricesData.source_status).map(([src, st]) => (
              <span key={src}
                className={`flex items-center gap-1 text-[9px] font-mono px-2 py-0.5 rounded-full border
                  ${st === "ok" || st === "stored"
                    ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                    : st === "no_data"
                      ? "bg-amber-50 text-amber-600 border-amber-200"
                      : "bg-red-50 text-red-500 border-red-200"}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${st === "ok" || st === "stored" ? "bg-emerald-500" : st === "no_data" ? "bg-amber-400" : "bg-red-400"}`} />
                {SOURCE_NAMES[src] ?? src}: {st === "ok" ? "ок" : st === "stored" ? `сбор ${pricesData?.stored_age_min ?? 0} мин назад` : st === "no_data" ? "нет данных" : "недоступен"}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
