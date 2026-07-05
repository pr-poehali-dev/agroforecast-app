import { useEffect, useState } from "react";
import { adminApi } from "@/lib/adminApi";
import Icon from "@/components/ui/icon";
import { Interaction, INTERACTION_TYPES } from "./shared";

const QUICK_TYPES = ["note", "call", "email", "meeting"] as const;

function formatDate(iso: string) {
  const d = new Date(iso.includes("T") ? iso : iso.replace(" ", "T"));
  if (isNaN(d.getTime())) return iso;
  return d.toLocaleString("ru-RU", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

// ── Вкладка «История взаимодействия» ─────────────────────────────────────────
export default function HistoryTab({ supplierId }: { supplierId: number }) {
  const [items, setItems] = useState<Interaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [type, setType] = useState<string>("note");
  const [content, setContent] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const load = () => {
    setLoading(true);
    adminApi.getSupplierHistory(supplierId)
      .then(d => setItems(d.interactions || []))
      .finally(() => setLoading(false));
  };
  useEffect(load, [supplierId]);

  const add = async () => {
    if (!content.trim()) { setError("Введите текст записи"); return; }
    setSaving(true); setError("");
    try {
      await adminApi.addSupplierInteraction(supplierId, { type, content: content.trim() });
      setContent("");
      load();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Ошибка");
    } finally { setSaving(false); }
  };

  const remove = async (hid: number) => {
    if (!confirm("Удалить запись из истории?")) return;
    await adminApi.deleteSupplierInteraction(hid);
    load();
  };

  const inputCls = "w-full px-3 py-2 rounded-xl border border-border bg-background text-sm focus:outline-none focus:border-primary";

  return (
    <div className="space-y-4">
      {/* Форма добавления */}
      <div className="glass-card rounded-xl p-3 space-y-2.5">
        <div className="flex flex-wrap gap-1.5">
          {QUICK_TYPES.map(t => {
            const cfg = INTERACTION_TYPES[t];
            return (
              <button key={t} onClick={() => setType(t)}
                className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium ${type === t ? "bg-primary text-white" : "bg-secondary text-muted-foreground hover:bg-secondary/80"}`}>
                <Icon name={cfg.icon} size={12} />{cfg.label}
              </button>
            );
          })}
        </div>
        <textarea value={content} rows={2} onChange={e => setContent(e.target.value)}
          className={`${inputCls} resize-none`} placeholder="Что обсудили, договорённости, результат…" />
        {error && <p className="text-xs text-destructive">{error}</p>}
        <button onClick={add} disabled={saving}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl hero-gradient text-white text-xs font-medium disabled:opacity-60">
          {saving ? <Icon name="Loader" size={13} className="animate-spin" /> : <Icon name="Plus" size={13} />}
          Добавить в историю
        </button>
      </div>

      {/* Таймлайн */}
      {loading ? (
        <div className="flex justify-center py-8"><Icon name="Loader" size={22} className="animate-spin text-primary" /></div>
      ) : items.length === 0 ? (
        <div className="glass-card rounded-xl p-8 text-center">
          <Icon name="History" size={28} className="text-muted-foreground mx-auto mb-2" />
          <p className="text-xs text-muted-foreground">Истории пока нет. Добавьте первую запись о звонке или встрече.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {items.map(it => {
            const cfg = INTERACTION_TYPES[it.type] || INTERACTION_TYPES.note;
            return (
              <div key={it.id} className="glass-card rounded-xl p-3 flex items-start gap-3 group">
                <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${cfg.color}`}>
                  <Icon name={cfg.icon} size={14} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-[11px] font-medium">{cfg.label}</span>
                    <span className="text-[10px] text-muted-foreground">{formatDate(it.created_at)}</span>
                    {it.author && <span className="text-[10px] text-muted-foreground">· {it.author}</span>}
                  </div>
                  <p className="text-sm text-foreground/90 whitespace-pre-wrap break-words">{it.content}</p>
                </div>
                <button onClick={() => remove(it.id)}
                  className="p-1 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                  <Icon name="Trash2" size={13} />
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
