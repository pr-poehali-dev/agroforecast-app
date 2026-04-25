import { useState, useEffect } from "react";
import Icon from "@/components/ui/icon";

const NEWS_URL = "https://functions.poehali.dev/be0f7858-8fb0-425f-b039-4a119700c633";

const REGION_NAMES: Record<string, string> = {
  samara: "Самарская", saratov: "Саратовская", volgograd: "Волгоградская",
  ulyanovsk: "Ульяновская", penza: "Пензенская", orenburg: "Оренбургская",
  tatarstan: "Татарстан", bashkortostan: "Башкортостан",
};

const WEATHER_ICONS: Record<string, string> = {
  Sun: "☀️", Cloud: "☁️", CloudRain: "🌧️", Snowflake: "❄️",
};

interface NewsItem {
  id: number; date: string; time: string;
  source: string; category: string; crop: string;
  title: string; summary: string;
  impact: "positive" | "negative" | "neutral";
  urgency: "critical" | "high" | "medium" | "low";
  regions: string[];
  action: string;
}

interface WeatherDay {
  day: string; icon: string; max: number; min: number; rain_mm: number; desc: string;
}

interface RegionWeather {
  name: string; current_temp: number; current_desc: string;
  rain_today: number; humidity: number; wind_ms: number;
  forecast_7d: WeatherDay[];
  month_outlook: string;
  agro_alert: string | null;
  ndvi_trend: string;
}

function impactColor(impact: string) {
  if (impact === "positive") return "text-primary";
  if (impact === "negative") return "text-destructive";
  return "text-muted-foreground";
}
function impactBg(impact: string) {
  if (impact === "positive") return "bg-primary/10 border-primary/20";
  if (impact === "negative") return "bg-destructive/10 border-destructive/20";
  return "bg-secondary/50 border-border";
}
function urgencyBadge(u: string) {
  if (u === "critical") return "bg-destructive text-white";
  if (u === "high")     return "bg-destructive/20 text-destructive";
  if (u === "medium")   return "bg-accent/20 text-accent";
  return "bg-secondary text-muted-foreground";
}
function urgencyLabel(u: string) {
  if (u === "critical") return "СРОЧНО";
  if (u === "high")     return "Важно";
  if (u === "medium")   return "Средн.";
  return "Инфо";
}
function ndviIcon(trend: string) {
  if (trend === "critical")  return { icon: "TrendingDown", color: "text-destructive" };
  if (trend === "declining") return { icon: "TrendingDown", color: "text-accent" };
  if (trend === "improving") return { icon: "TrendingUp",   color: "text-primary" };
  return { icon: "Minus", color: "text-muted-foreground" };
}

export default function SectionNews() {
  const [news, setNews] = useState<NewsItem[]>([]);
  const [weather, setWeather] = useState<RegionWeather[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"news" | "weather">("news");
  const [category, setCategory] = useState("все");
  const [categories, setCategories] = useState<string[]>([]);
  const [selectedWeatherRegion, setSelectedWeatherRegion] = useState("samara");
  const [expandedNews, setExpandedNews] = useState<number | null>(null);

  useEffect(() => {
    Promise.all([
      fetch(NEWS_URL).then(r => r.json()),
      fetch(`${NEWS_URL}?weather=1`).then(r => r.json()),
    ]).then(([n, w]) => {
      setNews(n.news || []);
      setCategories(n.categories || []);
      setWeather(w.regions || []);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (category === "все") {
      fetch(NEWS_URL).then(r => r.json()).then(d => setNews(d.news || [])).catch(() => {});
    } else {
      fetch(`${NEWS_URL}?category=${encodeURIComponent(category)}`).then(r => r.json()).then(d => setNews(d.news || [])).catch(() => {});
    }
  }, [category]);

  const selWeather = weather.find(w => {
    const key = Object.keys(REGION_NAMES).find(k => REGION_NAMES[k] === w.name);
    return key === selectedWeatherRegion;
  });

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Новости и метеопрогноз</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            zerno.ru · agroinvestor.ru · oilworld.ru · НГС.ру · Минсельхоз РФ · Росгидромет · апрель 2026
          </p>
        </div>
        {!loading && news.filter(n => n.urgency === "critical").length > 0 && (
          <div className="flex items-center gap-2 px-3 py-1.5 bg-destructive/10 border border-destructive/25 rounded-lg text-xs text-destructive font-medium">
            <Icon name="AlertOctagon" size={13} />
            {news.filter(n => n.urgency === "critical").length} срочных события
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-secondary/50 p-1 rounded-xl w-fit">
        {(["news", "weather"] as const).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-1.5 text-xs rounded-lg font-medium transition-all
              ${tab === t ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}>
            {t === "news" ? "Лента новостей" : "Метеопрогноз"}
          </button>
        ))}
      </div>

      {loading && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground animate-pulse">
          <Icon name="Newspaper" size={14} className="text-primary" />Загрузка данных...
        </div>
      )}

      {/* ── НОВОСТИ ── */}
      {tab === "news" && !loading && (
        <div className="space-y-4">
          {/* Category filter */}
          <div className="flex gap-1.5 flex-wrap">
            {categories.map(c => (
              <button key={c} onClick={() => setCategory(c)}
                className={`px-3 py-1 text-xs rounded-lg border transition-all font-medium capitalize
                  ${category === c ? "bg-primary/15 text-primary border-primary/30" : "bg-secondary text-muted-foreground border-border hover:border-primary/30"}`}>
                {c}
              </button>
            ))}
          </div>

          {/* News list */}
          <div className="space-y-3">
            {news.map(item => (
              <div key={item.id}
                className={`glass-card rounded-xl border overflow-hidden transition-all ${impactBg(item.impact)}`}>
                <div className="p-4">
                  <div className="flex items-start gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-2">
                        <span className={`px-1.5 py-0.5 text-[10px] font-mono font-bold rounded uppercase ${urgencyBadge(item.urgency)}`}>
                          {urgencyLabel(item.urgency)}
                        </span>
                        <span className="text-[10px] text-muted-foreground bg-secondary px-1.5 py-0.5 rounded">{item.category}</span>
                        <span className="text-[10px] text-muted-foreground font-mono">{item.source}</span>
                        <span className="text-[10px] text-muted-foreground ml-auto">{item.date} {item.time}</span>
                      </div>
                      <div className="font-semibold text-sm text-foreground mb-1 leading-snug">{item.title}</div>
                      <div className="text-xs text-muted-foreground leading-relaxed">
                        {expandedNews === item.id ? item.summary : item.summary.slice(0, 120) + (item.summary.length > 120 ? "..." : "")}
                      </div>
                      {item.summary.length > 120 && (
                        <button onClick={() => setExpandedNews(expandedNews === item.id ? null : item.id)}
                          className="text-xs text-primary hover:text-primary/80 mt-1 transition-colors">
                          {expandedNews === item.id ? "Свернуть ↑" : "Читать полностью ↓"}
                        </button>
                      )}
                    </div>
                    <div className={`shrink-0 mt-0.5 ${impactColor(item.impact)}`}>
                      <Icon name={item.impact === "positive" ? "TrendingUp" : item.impact === "negative" ? "TrendingDown" : "Minus"} size={16} />
                    </div>
                  </div>

                  {/* Action + regions */}
                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <div className="flex items-start gap-1.5 flex-1">
                      <Icon name="Zap" size={11} className="text-primary mt-0.5 shrink-0" />
                      <span className="text-xs font-medium text-primary">{item.action}</span>
                    </div>
                    {item.regions.length > 0 && (
                      <div className="flex gap-1 flex-wrap">
                        {item.regions.slice(0, 3).map(r => (
                          <span key={r} className="text-[10px] bg-secondary px-1.5 py-0.5 rounded text-muted-foreground">{r}</span>
                        ))}
                        {item.regions.length > 3 && (
                          <span className="text-[10px] text-muted-foreground">+{item.regions.length - 3}</span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {news.length === 0 && (
            <div className="text-center py-12 text-muted-foreground text-sm">Новостей по данной категории не найдено</div>
          )}
        </div>
      )}

      {/* ── МЕТЕОПРОГНОЗ ── */}
      {tab === "weather" && !loading && (
        <div className="space-y-4">
          {/* Region selector */}
          <div className="flex gap-1.5 flex-wrap">
            {Object.entries(REGION_NAMES).map(([id, name]) => {
              const w = weather.find(r => r.name === name);
              return (
                <button key={id} onClick={() => setSelectedWeatherRegion(id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg border transition-all font-medium
                    ${selectedWeatherRegion === id ? "bg-primary/15 text-primary border-primary/30" : "bg-secondary text-muted-foreground border-border hover:border-primary/30"}`}>
                  {w?.agro_alert && <span className="w-1.5 h-1.5 rounded-full bg-destructive shrink-0" />}
                  {name}
                  {w && <span className="font-mono">{w.current_temp}°</span>}
                </button>
              );
            })}
          </div>

          {selWeather && (
            <div className="space-y-4">
              {/* Alert */}
              {selWeather.agro_alert && (
                <div className="p-4 bg-destructive/10 border border-destructive/25 rounded-xl text-sm font-semibold text-destructive">
                  {selWeather.agro_alert}
                </div>
              )}

              {/* Current + 7 days */}
              <div className="glass-card rounded-xl p-5">
                <div className="flex flex-wrap items-start justify-between gap-4 mb-5">
                  <div>
                    <div className="flex items-center gap-2">
                      <Icon name="MapPin" size={14} className="text-primary" />
                      <h2 className="font-semibold">{selWeather.name} обл. — погода апрель 2026</h2>
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">Росгидромет · прогноз на 7 дней</div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-center">
                      <div className="text-3xl font-bold font-mono text-foreground">+{selWeather.current_temp}°C</div>
                      <div className="text-xs text-muted-foreground">{selWeather.current_desc}</div>
                    </div>
                    <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1"><Icon name="Droplets" size={10} />Влажность: {selWeather.humidity}%</span>
                      <span className="flex items-center gap-1"><Icon name="Wind" size={10} />Ветер: {selWeather.wind_ms} м/с</span>
                      <span className="flex items-center gap-1"><Icon name="CloudRain" size={10} />Сегодня: {selWeather.rain_today} мм</span>
                      <span className="flex items-center gap-1">
                        <Icon name={ndviIcon(selWeather.ndvi_trend).icon as string} size={10} className={ndviIcon(selWeather.ndvi_trend).color} />
                        NDVI: {selWeather.ndvi_trend === "improving" ? "растёт" : selWeather.ndvi_trend === "declining" ? "снижается" : selWeather.ndvi_trend === "critical" ? "критично" : "стабильно"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* 7-day forecast */}
                <div className="grid grid-cols-7 gap-2">
                  {selWeather.forecast_7d.map((d, i) => (
                    <div key={i} className={`flex flex-col items-center p-2 rounded-xl text-center
                      ${d.icon === "Snowflake" ? "bg-blue-500/10 border border-blue-500/20" : "bg-secondary/40"}`}>
                      <div className="text-[10px] text-muted-foreground font-mono mb-1">{d.day}</div>
                      <div className="text-lg mb-1">{WEATHER_ICONS[d.icon] || "🌤️"}</div>
                      <div className="text-xs font-bold text-foreground">+{d.max}°</div>
                      <div className="text-[10px] text-muted-foreground">{d.min}°</div>
                      {d.rain_mm > 0 && (
                        <div className="text-[10px] text-primary mt-1 font-mono">{d.rain_mm}мм</div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Month outlook */}
              <div className="glass-card rounded-xl p-5">
                <div className="flex items-center gap-2 mb-3">
                  <Icon name="CalendarDays" size={14} className="text-primary" />
                  <h3 className="font-semibold text-sm">Прогноз на май 2026</h3>
                </div>
                <p className="text-sm text-foreground leading-relaxed">{selWeather.month_outlook}</p>
              </div>

              {/* All regions quick view */}
              <div className="glass-card rounded-xl p-5">
                <div className="flex items-center gap-2 mb-4">
                  <Icon name="Globe" size={14} className="text-primary" />
                  <h3 className="font-semibold text-sm">Сводка по всем регионам</h3>
                </div>
                <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  {weather.map((w, i) => (
                    <div key={i}
                      className={`p-3 rounded-xl border cursor-pointer transition-all hover:scale-[1.02]
                        ${w.agro_alert ? "border-destructive/30 bg-destructive/5" : "border-border bg-secondary/30"}`}
                      onClick={() => {
                        const id = Object.keys(REGION_NAMES).find(k => REGION_NAMES[k] === w.name);
                        if (id) setSelectedWeatherRegion(id);
                      }}>
                      <div className="flex justify-between items-start mb-1">
                        <div className="text-xs font-semibold text-foreground">{w.name}</div>
                        <div className="text-sm font-bold font-mono text-foreground">+{w.current_temp}°</div>
                      </div>
                      <div className="text-[10px] text-muted-foreground truncate">{w.current_desc}</div>
                      {w.agro_alert && (
                        <div className="mt-1.5 text-[9px] text-destructive font-medium flex items-center gap-1">
                          <Icon name="AlertTriangle" size={9} />
                          {w.agro_alert.slice(0, 30)}...
                        </div>
                      )}
                      <div className="mt-2 flex gap-1">
                        {w.forecast_7d.slice(0, 4).map((d, j) => (
                          <div key={j} className="flex-1 text-center text-[9px]">
                            <div>{WEATHER_ICONS[d.icon] || "🌤️"}</div>
                            <div className="text-muted-foreground">{d.max}°</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
