import { useState, useEffect } from "react";
import Icon from "@/components/ui/icon";
import {
  AI_URL, CROPS, HORIZONS, REGION_NAMES,
  ModelMeta, RegionForecast, SingleForecast, ChartPoint,
} from "./AiModelTypes";
import AiModelSingleTab from "./AiModelSingleTab";
import AiModelAllTab from "./AiModelAllTab";
import AiModelChartTab from "./AiModelChartTab";

export default function SectionAiModel() {
  const [crop, setCrop] = useState("Пшеница озимая");
  const [region, setRegion] = useState("samara");
  const [horizon, setHorizon] = useState(3);
  const [tab, setTab] = useState<"single" | "all" | "chart">("single");

  const [meta, setMeta] = useState<ModelMeta | null>(null);
  const [single, setSingle] = useState<SingleForecast | null>(null);
  const [allRegions, setAllRegions] = useState<RegionForecast[]>([]);
  const [chart, setChart] = useState<ChartPoint[]>([]);
  const [loading, setLoading] = useState(false);

  // Load model metadata once
  useEffect(() => {
    fetch(AI_URL).then(r => r.json()).then(d => setMeta(d.model_info)).catch(() => {});
  }, []);

  // Load data when params change
  useEffect(() => {
    setLoading(true);
    const baseUrl = `${AI_URL}?crop=${encodeURIComponent(crop)}&horizon=${horizon}`;
    const urls = [
      fetch(`${baseUrl}&region=${region}`).then(r => r.json()),
      fetch(`${baseUrl}&all=1`).then(r => r.json()),
      fetch(`${baseUrl}&region=${region}&chart=1`).then(r => r.json()),
    ];
    Promise.all(urls)
      .then(([s, a, c]) => {
        setSingle(s);
        setAllRegions(a.regions || []);
        setChart(c.series || []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [crop, region, horizon]);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground">AI‑модель прогнозирования</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            LSTM + Random Forest · ARIMA + Prophet + Transformer · горизонт 3–12 месяцев
          </p>
        </div>
        {meta && (
          <div className="flex gap-2 flex-wrap">
            <div className="px-3 py-1.5 rounded-lg bg-primary/10 border border-primary/20 text-xs font-mono text-primary">
              MAPE цен: {meta.validation_mape_price}%
            </div>
            <div className="px-3 py-1.5 rounded-lg bg-primary/10 border border-primary/20 text-xs font-mono text-primary">
              MAPE урожай: {meta.validation_mape_yield}%
            </div>
            <div className="px-3 py-1.5 rounded-lg bg-accent/10 border border-accent/20 text-xs font-mono text-accent">
              Точность рисков: {meta.risk_accuracy_pct}%
            </div>
          </div>
        )}
      </div>

      {/* Model architecture cards */}
      {meta && (
        <div className="grid sm:grid-cols-3 gap-3">
          {[
            { icon: "Brain", label: "Модуль урожайности", value: meta.yield_model, badge: `MAPE ${meta.validation_mape_yield}%`, color: "primary" },
            { icon: "TrendingUp", label: "Модуль цен", value: meta.price_model, badge: `MAPE ${meta.validation_mape_price}%`, color: "accent" },
            { icon: "ShieldAlert", label: "Модуль рисков", value: meta.risk_model, badge: `Точность ${meta.risk_accuracy_pct}%`, color: "primary" },
          ].map((m, i) => (
            <div key={i} className="glass-card rounded-xl p-4">
              <div className="flex items-center gap-2 mb-3">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${m.color === "primary" ? "bg-primary/15 text-primary" : "bg-accent/15 text-accent"}`}>
                  <Icon name={m.icon as string} size={15} />
                </div>
                <span className="text-xs font-medium text-muted-foreground">{m.label}</span>
              </div>
              <div className="text-xs font-semibold text-foreground leading-snug mb-2">{m.value}</div>
              <span className={`px-2 py-0.5 text-[10px] font-mono rounded border ${m.color === "primary" ? "bg-primary/10 border-primary/25 text-primary" : "bg-accent/10 border-accent/25 text-accent"}`}>{m.badge}</span>
            </div>
          ))}
        </div>
      )}

      {/* Controls */}
      <div className="glass-card rounded-xl p-5">
        <div className="grid sm:grid-cols-3 gap-4">
          <div>
            <label className="text-xs text-muted-foreground mb-1.5 block">Культура</label>
            <div className="flex flex-wrap gap-1.5">
              {CROPS.map(c => (
                <button key={c} onClick={() => setCrop(c)}
                  className={`px-2.5 py-1 text-xs rounded-lg border transition-all font-medium
                    ${crop === c ? "bg-primary/15 text-primary border-primary/30" : "bg-secondary text-muted-foreground border-border hover:border-primary/30"}`}>
                  {c.split(" ")[0]}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1.5 block">Регион</label>
            <select value={region} onChange={e => setRegion(e.target.value)}
              className="w-full text-xs bg-secondary border border-border rounded-lg px-3 py-2 text-foreground focus:outline-none focus:border-primary/40">
              {Object.entries(REGION_NAMES).map(([id, name]) => (
                <option key={id} value={id}>{name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1.5 block">Горизонт прогноза</label>
            <div className="flex gap-1.5">
              {HORIZONS.map(h => (
                <button key={h} onClick={() => setHorizon(h)}
                  className={`flex-1 py-1.5 text-xs rounded-lg border transition-all font-mono
                    ${horizon === h ? "bg-primary/15 text-primary border-primary/30" : "bg-secondary text-muted-foreground border-border hover:border-primary/30"}`}>
                  {h} мес
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-secondary/50 p-1 rounded-xl w-fit">
        {(["single", "all", "chart"] as const).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-1.5 text-xs rounded-lg font-medium transition-all
              ${tab === t ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}>
            {t === "single" ? "Детальный прогноз" : t === "all" ? "Все регионы" : "График цен"}
          </button>
        ))}
      </div>

      {loading && (
        <div className="flex items-center gap-3 text-sm text-muted-foreground animate-pulse">
          <Icon name="Brain" size={14} className="text-primary" />
          Модель считает прогноз...
        </div>
      )}

      {tab === "single" && single && !loading && (
        <AiModelSingleTab single={single} />
      )}

      {tab === "all" && allRegions.length > 0 && !loading && (
        <AiModelAllTab
          allRegions={allRegions}
          crop={crop}
          horizon={horizon}
          onSelectRegion={(id) => { setRegion(id); setTab("single"); }}
        />
      )}

      {tab === "chart" && chart.length > 0 && !loading && (
        <AiModelChartTab
          chart={chart}
          crop={crop}
          region={region}
          horizon={horizon}
          meta={meta}
        />
      )}
    </div>
  );
}
