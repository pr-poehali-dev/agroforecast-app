import { lazy, Suspense } from "react";
import Icon from "@/components/ui/icon";
import { MAP_REGIONS, getRiskColor, getRiskLabel } from "./data";
import YieldStatsPanel from "./YieldStatsPanel";

const VolgaMap = lazy(() => import("@/components/VolgaMap"));

interface MapSectionProps {
  selectedRegion: string | null;
  setSelectedRegion: (id: string) => void;
}

export default function MapSection({ selectedRegion, setSelectedRegion }: MapSectionProps) {
  const selectedRegionData = MAP_REGIONS.find(r => r.id === selectedRegion);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="font-heading font-black text-2xl text-foreground">Карта урожайности России</h1>
          <p className="text-muted-foreground mt-1 text-sm font-body">Спутниковые данные Sentinel-2 · NDVI · метеоусловия · нажмите регион для деталей</p>
        </div>
        <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/25 text-primary text-xs font-mono">
          <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse-glow" />Прямой эфир · Sentinel-2
        </span>
      </div>
      <div className="grid lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 glass-card rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Icon name="Satellite" size={14} className="text-primary" />
              <span className="text-xs font-mono text-muted-foreground">КАРТА АГРОРЕГИОНОВ РОССИИ</span>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-primary"><span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse-glow" />Прямой эфир</div>
          </div>
          <Suspense fallback={<div className="h-[420px] rounded-xl bg-secondary/40 animate-pulse flex items-center justify-center text-muted-foreground text-sm">Загрузка карты...</div>}>
            <VolgaMap selectedRegion={selectedRegion} onSelect={setSelectedRegion} />
          </Suspense>
          <div className="flex gap-4 mt-4 flex-wrap">
            {[{ label: "Критический риск", color: "bg-destructive" }, { label: "Средний риск", color: "bg-accent" }, { label: "Низкий риск", color: "bg-primary" }].map(l => (
              <span key={l.label} className="flex items-center gap-1.5 text-xs text-muted-foreground"><span className={`w-2.5 h-2.5 rounded-full ${l.color}`} />{l.label}</span>
            ))}
          </div>
        </div>
        <div className="space-y-3">
          {selectedRegionData && (
            <div className="glass-card rounded-xl p-4 border" style={{ borderColor: `${getRiskColor(selectedRegionData.risk)}40` }}>
              <div className="flex items-center gap-2 mb-3">
                <Icon name="MapPin" size={14} style={{ color: getRiskColor(selectedRegionData.risk) }} />
                <span className="font-semibold text-sm">{selectedRegionData.name} обл.</span>
              </div>
              <div className="space-y-2.5">
                {[
                  { label: "Индекс риска", value: `${selectedRegionData.risk}%`, colored: true },
                  { label: "NDVI (вегетация)", value: selectedRegionData.ndvi.toFixed(2), colored: false },
                  { label: "Осадки, мм/мес", value: `${selectedRegionData.rain} мм`, colored: false },
                  { label: "Температура", value: `+${selectedRegionData.temp}°C`, colored: false },
                  { label: "Площадь угодий", value: `${selectedRegionData.area} тыс. га`, colored: false },
                ].map((row, i) => (
                  <div key={i} className="flex justify-between text-xs border-b border-border/40 pb-1.5">
                    <span className="text-muted-foreground">{row.label}</span>
                    <span className="font-mono font-bold" style={row.colored ? { color: getRiskColor(selectedRegionData.risk) } : undefined}>{row.value}</span>
                  </div>
                ))}
                <div>
                  <div className="flex justify-between text-xs mb-1"><span className="text-muted-foreground">Уровень</span><span className="font-medium" style={{ color: getRiskColor(selectedRegionData.risk) }}>{getRiskLabel(selectedRegionData.risk)}</span></div>
                  <div className="h-2 bg-border rounded-full"><div className="h-full rounded-full transition-all duration-500" style={{ width: `${selectedRegionData.risk}%`, backgroundColor: getRiskColor(selectedRegionData.risk) }} /></div>
                </div>
              </div>
            </div>
          )}
          <div className="glass-card rounded-xl p-4">
            <div className="text-xs font-medium text-muted-foreground mb-3">ВСЕ РЕГИОНЫ</div>
            <div className="space-y-1.5">
              {MAP_REGIONS.map(r => (
                <button key={r.id} onClick={() => setSelectedRegion(r.id)}
                  className={`w-full flex items-center gap-2 p-2 rounded-lg text-xs transition-all ${selectedRegion === r.id ? "bg-secondary" : "hover:bg-secondary/50"}`}>
                  <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: getRiskColor(r.risk) }} />
                  <span className="text-foreground flex-1 text-left">{r.name}</span>
                  <span className="font-mono text-muted-foreground text-[10px]">NDVI {r.ndvi.toFixed(2)}</span>
                  <span className="font-mono font-bold" style={{ color: getRiskColor(r.risk) }}>{r.risk}%</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
      <YieldStatsPanel selectedRegionId={selectedRegion} />
      <div className="flex items-center justify-center gap-2 py-3 px-4 rounded-lg bg-secondary/30 border border-border/50">
        <Icon name="Shield" size={14} className="text-primary shrink-0" />
        <span className="text-xs text-muted-foreground text-center">
          Интеллектуальный продукт <span className="font-semibold text-foreground">ООО «МАТ-Лабс»</span> · все права защищены © {new Date().getFullYear()}
        </span>
      </div>
    </div>
  );
}