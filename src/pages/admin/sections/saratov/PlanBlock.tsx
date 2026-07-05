import { useEffect, useState } from "react";
import { adminApi } from "@/lib/adminApi";
import Icon from "@/components/ui/icon";
import { REGION } from "./shared";

// ── Блок плана-стратегии ─────────────────────────────────────────────────────
export default function PlanBlock() {
  const [plan, setPlan] = useState<{ title: string; partner: string; content: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ title: "", partner: "", content: "" });
  const [msg, setMsg] = useState("");

  const load = () => {
    setLoading(true);
    adminApi.getRegionPlan(REGION)
      .then(d => {
        const p = d.plan || { title: `План работы: ${REGION}`, partner: "", content: "" };
        setPlan(p); setForm({ title: p.title, partner: p.partner || "", content: p.content || "" });
      })
      .finally(() => setLoading(false));
  };
  useEffect(load, []);

  const generate = async () => {
    setGenerating(true); setMsg("");
    try {
      const d = await adminApi.generateRegionPlan(REGION, form.partner, "Приёмка подсолнечника и пшеницы");
      setForm(f => ({ ...f, content: d.content })); setEditing(true);
    } catch (e: unknown) { setMsg(e instanceof Error ? e.message : "Ошибка ИИ"); }
    finally { setGenerating(false); }
  };

  const save = async () => {
    setSaving(true); setMsg("");
    try {
      await adminApi.saveRegionPlan({ region: REGION, ...form });
      setPlan({ ...form }); setEditing(false); setMsg("Сохранено");
    } catch (e: unknown) { setMsg(e instanceof Error ? e.message : "Ошибка"); }
    finally { setSaving(false); }
  };

  const inputCls = "w-full px-3 py-2 rounded-xl border border-border bg-background text-sm focus:outline-none focus:border-primary";

  if (loading) return <div className="glass-card rounded-2xl p-8 flex justify-center"><Icon name="Loader" size={20} className="animate-spin text-primary" /></div>;

  return (
    <div className="glass-card rounded-2xl p-5 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Icon name="Target" size={18} className="text-primary" />
          <h3 className="font-heading font-bold text-base">План-стратегия</h3>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={generate} disabled={generating}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-secondary text-xs font-medium hover:bg-secondary/80 disabled:opacity-60">
            {generating ? <Icon name="Loader" size={13} className="animate-spin" /> : <Icon name="Sparkles" size={13} />}
            {generating ? "Генерация…" : "Сгенерировать ИИ"}
          </button>
          {!editing && (
            <button onClick={() => setEditing(true)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-secondary text-xs font-medium hover:bg-secondary/80">
              <Icon name="Edit" size={13} />Изменить
            </button>
          )}
        </div>
      </div>

      {editing ? (
        <div className="space-y-3">
          <input value={form.partner} onChange={e => setForm(f => ({ ...f, partner: e.target.value }))} className={inputCls} placeholder="Партнёр / точка приёмки (напр. Аткарск)" />
          <textarea value={form.content} rows={14} onChange={e => setForm(f => ({ ...f, content: e.target.value }))} className={`${inputCls} resize-none font-mono text-xs leading-relaxed`} placeholder="Текст плана работы…" />
          <div className="flex gap-3">
            <button onClick={() => { setEditing(false); setForm({ title: plan!.title, partner: plan!.partner || "", content: plan!.content || "" }); }}
              className="flex-1 py-2.5 rounded-xl border border-border text-sm font-medium hover:bg-secondary">Отмена</button>
            <button onClick={save} disabled={saving} className="flex-1 py-2.5 rounded-xl hero-gradient text-white text-sm font-medium disabled:opacity-60 flex items-center justify-center gap-2">
              {saving ? <><Icon name="Loader" size={14} className="animate-spin" />Сохранение…</> : "Сохранить план"}
            </button>
          </div>
        </div>
      ) : (
        <>
          {plan?.partner && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Icon name="MapPin" size={13} className="text-primary" /><span>{plan.partner}</span>
            </div>
          )}
          <pre className="whitespace-pre-wrap text-sm leading-relaxed text-foreground/90 font-sans">{plan?.content || "План пока пуст. Сгенерируйте ИИ или заполните вручную."}</pre>
        </>
      )}
      {msg && <p className="text-xs text-muted-foreground">{msg}</p>}
    </div>
  );
}
