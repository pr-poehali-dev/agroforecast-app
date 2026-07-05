import { useState } from "react";
import { adminApi } from "@/lib/adminApi";
import Icon from "@/components/ui/icon";
import { Supplier } from "./shared";

// ── CRM: ИИ-помощник менеджера (анализ + письмо) ─────────────────────────────
export default function CrmModal({ item, onClose }: {
  item: Supplier; onClose: () => void;
}) {
  const [tab, setTab] = useState<"analysis" | "letter">("analysis");
  const [analysis, setAnalysis] = useState(item.ai_analysis || "");
  const [letter, setLetter] = useState(item.ai_letter || "");
  const [tone, setTone] = useState("деловой");
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState("");

  const runAnalysis = async () => {
    setLoading(true); setError("");
    try {
      const d = await adminApi.analyzeSupplier(item.id);
      setAnalysis(d.analysis);
    } catch (e: unknown) { setError(e instanceof Error ? e.message : "Ошибка ИИ"); }
    finally { setLoading(false); }
  };

  const runLetter = async () => {
    setLoading(true); setError("");
    try {
      const d = await adminApi.generateSupplierLetter(item.id, { tone });
      setLetter(d.letter);
    } catch (e: unknown) { setError(e instanceof Error ? e.message : "Ошибка ИИ"); }
    finally { setLoading(false); }
  };

  const copy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true); setTimeout(() => setCopied(false), 1500);
  };

  const current = tab === "analysis" ? analysis : letter;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="bg-background rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-5 border-b border-border sticky top-0 bg-background z-10">
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-8 h-8 hero-gradient rounded-lg flex items-center justify-center shrink-0">
              <Icon name="Sparkles" size={15} className="text-white" />
            </div>
            <div className="min-w-0">
              <h3 className="font-heading font-bold text-sm truncate">ИИ-менеджер по поставщику</h3>
              <p className="text-[11px] text-muted-foreground truncate">{item.name}</p>
            </div>
          </div>
          <button onClick={onClose}><Icon name="X" size={18} className="text-muted-foreground" /></button>
        </div>

        {/* Краткая справка о поставщике */}
        <div className="px-5 pt-4 flex flex-wrap gap-2 text-[11px]">
          {item.inn && <span className="px-2 py-0.5 rounded-full bg-secondary">ИНН {item.inn}</span>}
          {item.district && <span className="px-2 py-0.5 rounded-full bg-secondary">{item.district} р-н</span>}
          {item.crops && <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary max-w-[220px] truncate">{item.crops}</span>}
          {item.contact_person && <span className="px-2 py-0.5 rounded-full bg-secondary">{item.contact_person}</span>}
          {item.phone && <span className="px-2 py-0.5 rounded-full bg-secondary">{item.phone}</span>}
        </div>

        {/* Табы */}
        <div className="px-5 pt-4 flex gap-2">
          <button onClick={() => setTab("analysis")}
            className={`px-3 py-1.5 rounded-xl text-xs font-medium flex items-center gap-1.5 ${tab === "analysis" ? "bg-primary text-white" : "bg-secondary text-muted-foreground hover:bg-secondary/80"}`}>
            <Icon name="ClipboardList" size={13} />Анализ
          </button>
          <button onClick={() => setTab("letter")}
            className={`px-3 py-1.5 rounded-xl text-xs font-medium flex items-center gap-1.5 ${tab === "letter" ? "bg-primary text-white" : "bg-secondary text-muted-foreground hover:bg-secondary/80"}`}>
            <Icon name="Mail" size={13} />Письмо
          </button>
        </div>

        <div className="p-5 space-y-3">
          {tab === "letter" && (
            <div className="flex items-center gap-2">
              <label className="text-[11px] text-muted-foreground">Тон письма:</label>
              <select value={tone} onChange={e => setTone(e.target.value)}
                className="px-2.5 py-1.5 rounded-lg border border-border bg-background text-xs focus:outline-none focus:border-primary">
                <option value="деловой">Деловой</option>
                <option value="дружелюбный деловой">Дружелюбный</option>
                <option value="официальный">Официальный</option>
                <option value="краткий и энергичный">Краткий</option>
              </select>
            </div>
          )}

          <div className="flex gap-2">
            <button onClick={tab === "analysis" ? runAnalysis : runLetter} disabled={loading}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl hero-gradient text-white text-xs font-medium disabled:opacity-60">
              {loading ? <Icon name="Loader" size={13} className="animate-spin" /> : <Icon name="Sparkles" size={13} />}
              {loading ? "ИИ работает…" : (current ? "Сгенерировать заново" : (tab === "analysis" ? "Проанализировать" : "Составить письмо"))}
            </button>
            {current && (
              <button onClick={() => copy(current)}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-secondary text-xs font-medium hover:bg-secondary/80">
                <Icon name={copied ? "Check" : "Copy"} size={13} className={copied ? "text-emerald-600" : ""} />
                {copied ? "Скопировано" : "Копировать"}
              </button>
            )}
          </div>

          {error && <p className="text-xs text-destructive">{error}</p>}

          {current ? (
            <div className="glass-card rounded-xl p-4">
              <pre className="whitespace-pre-wrap text-sm leading-relaxed text-foreground/90 font-sans">{current}</pre>
            </div>
          ) : (
            <div className="glass-card rounded-xl p-8 text-center">
              <Icon name={tab === "analysis" ? "ClipboardList" : "Mail"} size={28} className="text-muted-foreground mx-auto mb-2" />
              <p className="text-xs text-muted-foreground">
                {tab === "analysis"
                  ? "ИИ проанализирует поставщика: профиль, что закупать, потенциал, риски и первый шаг."
                  : "ИИ составит готовое письмо о сотрудничестве под этого производителя."}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
