import Icon from "@/components/ui/icon";
import { PROFITABILITY_DATA } from "./data";
import { Calculator } from "./PageWidgets";

interface ExportAction {
  label: string;
  icon: string;
  tag: string;
  fn: () => void;
}

interface BusinessToolsProps {
  exporting: string | null;
  doExport: (tag: string, fn: () => void) => void;
  exportActions: ExportAction[];
}

export default function BusinessTools({ exporting, doExport, exportActions }: BusinessToolsProps) {
  return (
    <div className="space-y-6 animate-fade-in">
      {/* Hero */}
      <div className="hero-gradient rounded-2xl p-5 sm:p-6 relative overflow-hidden shadow-md">
        <div className="hero-gradient-overlay absolute inset-0" />
        <div className="bg-dots absolute inset-0 opacity-15" />
        <div className="relative">
          <div className="flex items-center gap-2 mb-1.5">
            <Icon name="Briefcase" size={13} className="text-white/75" />
            <span className="text-white/60 text-xs font-mono uppercase tracking-widest">Бизнес-инструменты</span>
          </div>
          <h1 className="font-heading font-black text-2xl sm:text-3xl text-white">Инструменты для <span className="gold-text">бизнеса</span></h1>
          <p className="text-white/60 text-sm mt-1 font-body">Калькулятор себестоимости · маржинальность · коммерческие предложения · экспорт</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        <div className="glass-card rounded-2xl p-6">
          <div className="flex items-center gap-2.5 mb-5">
            <div className="w-8 h-8 rounded-lg bg-primary/15 flex items-center justify-center">
              <Icon name="Calculator" size={15} className="text-primary" />
            </div>
            <div>
              <h2 className="font-heading font-bold text-sm text-foreground">Калькулятор маржинальности</h2>
              <div className="text-[11px] text-muted-foreground">на основе API · реальные данные</div>
            </div>
          </div>
          <Calculator />
        </div>
        <div className="space-y-4">
          <div className="glass-card rounded-2xl p-5">
            <div className="flex items-center gap-2.5 mb-4">
              <div className="w-8 h-8 rounded-lg bg-accent/15 flex items-center justify-center">
                <Icon name="GitCompare" size={15} className="text-accent" />
              </div>
              <div>
                <h2 className="font-heading font-bold text-sm text-foreground">Рейтинг культур по ROI</h2>
                <div className="text-[11px] text-muted-foreground">от лучшего к худшему</div>
              </div>
            </div>
            <div className="space-y-3">
              {[...PROFITABILITY_DATA].sort((a, b) => b.roi - a.roi).map((c, i) => (
                <div key={i} className="flex items-center gap-3">
                  <span className={`w-6 h-6 rounded-lg flex items-center justify-center text-[11px] font-black shrink-0
                    ${i === 0 ? "hero-gradient text-white shadow-sm" : i === 1 ? "bg-accent/20 text-accent" : "bg-secondary text-muted-foreground"}`}>{i + 1}</span>
                  <span className="text-sm flex-1 font-medium font-body">{c.crop.split(" ")[0]}</span>
                  <div className="w-24 h-2.5 bg-border rounded-full overflow-hidden">
                    <div className="h-full rounded-full progress-bar" style={{ width: `${c.roi}%` }} />
                  </div>
                  <span className="font-mono text-xs font-black w-14 text-right text-primary">{c.roi}%</span>
                </div>
              ))}
            </div>
          </div>
          <div className="glass-card rounded-2xl p-5">
            <div className="flex items-center gap-2.5 mb-4">
              <div className="w-8 h-8 rounded-lg bg-primary/15 flex items-center justify-center">
                <Icon name="Download" size={15} className="text-primary" />
              </div>
              <div>
                <h2 className="font-heading font-bold text-sm text-foreground">Экспорт и отчёты</h2>
                <div className="text-[11px] text-muted-foreground">PDF · Excel · JSON · 1С</div>
              </div>
            </div>
            <div className="space-y-2">
              {exportActions.map((r, i) => (
                <button key={i}
                  onClick={() => doExport(r.tag, r.fn)}
                  disabled={exporting !== null}
                  className="w-full flex items-center gap-3 p-3.5 rounded-xl bg-background border border-border hover:border-primary/30 hover:bg-primary/4 transition-all text-sm text-left disabled:opacity-60 active:scale-[0.99] group">
                  {exporting === r.tag ? (
                    <Icon name="Loader" size={15} className="text-primary animate-spin" />
                  ) : (
                    <Icon name={r.icon as string} size={15} className="text-muted-foreground group-hover:text-primary transition-colors" />
                  )}
                  <span className="flex-1">{r.label}</span>
                  <span className={`px-1.5 py-0.5 text-[10px] font-mono rounded transition-colors ${exporting === r.tag ? "bg-primary/20 text-primary" : "bg-border text-muted-foreground"}`}>
                    {exporting === r.tag ? "..." : r.tag}
                  </span>
                  <Icon name={exporting === r.tag ? "Check" : "Download"} size={14} className={exporting === r.tag ? "text-primary" : "text-muted-foreground"} />
                </button>
              ))}
            </div>
            <p className="text-[10px] text-muted-foreground mt-3 leading-relaxed">
              PDF открывается в новой вкладке для печати. CSV/JSON скачиваются автоматически. Данные: НТБ + Минсельхоз, апрель 2026.
            </p>
          </div>
        </div>
      </div>
      <div className="glass-card rounded-xl p-5">
        <div className="flex items-center gap-2 mb-4">
          <Icon name="Link" size={16} className="text-primary" />
          <h2 className="font-semibold text-sm">Интеграция с учётными системами</h2>
        </div>
        <div className="grid sm:grid-cols-3 gap-3">
          {[
            { name: "1С:Агропредприятие", desc: "Двусторонняя синхронизация данных о производстве", status: "pending" },
            { name: "SAP Agro", desc: "Импорт позиций и экспорт аналитики в ERP", status: "disconnected" },
            { name: "CRM (amoCRM)", desc: "Автоматическое создание сделок по сигналам рынка", status: "disconnected" },
          ].map((s, i) => (
            <div key={i} className="p-4 rounded-xl bg-secondary/40 border border-border">
              <div className="font-semibold text-sm mb-1">{s.name}</div>
              <div className="text-xs text-muted-foreground mb-3">{s.desc}</div>
              <button className={`w-full py-1.5 text-xs rounded-lg font-medium border transition-all ${s.status === "pending" ? "border-accent/30 text-accent bg-accent/10 hover:bg-accent/20" : "border-primary/30 text-primary bg-primary/10 hover:bg-primary/20"}`}>
                {s.status === "pending" ? "Завершить настройку" : "Подключить"}
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
