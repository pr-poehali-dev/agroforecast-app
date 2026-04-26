import { useEffect, useState } from "react";
import { adminApi } from "@/lib/adminApi";
import Icon from "@/components/ui/icon";

interface NewsItem {
  id: number; title: string; summary: string; content: string;
  category: string; crop: string; impact: string; urgency: string;
  source: string; source_url: string; image_url: string;
  is_published: boolean; created_at: string;
}

const IMPACT_LABELS: Record<string, string> = { positive: "Позитив", neutral: "Нейтрально", negative: "Негатив" };
const URGENCY_LABELS: Record<string, string> = { low: "Низкий", medium: "Средний", high: "Высокий", critical: "Критический" };
const CATEGORIES = ["рынок", "цены", "урожай", "экспорт", "регулирование", "погода"];
const CROPS = ["Все культуры", "Пшеница", "Подсолнечник", "Кукуруза", "Ячмень", "Рожь"];

const emptyForm = () => ({
  title: "", summary: "", content: "", category: "рынок", crop: "Все культуры",
  impact: "neutral", urgency: "medium", source: "АгроПорт", source_url: "", image_url: "", is_published: true,
});

function NewsModal({ item, onClose, onSave }: {
  item: Partial<NewsItem> | null; onClose: () => void; onSave: () => void;
}) {
  const [form, setForm] = useState(item?.id ? { ...emptyForm(), ...item } : emptyForm());
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const set = (k: string, v: unknown) => setForm(f => ({ ...f, [k]: v }));

  const save = async () => {
    if (!form.title.trim()) { setError("Заголовок обязателен"); return; }
    setSaving(true); setError("");
    try {
      if (item?.id) {
        await adminApi.updateNews(item.id, form);
      } else {
        await adminApi.createNews(form);
      }
      onSave();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Ошибка");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="bg-background rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-5 border-b border-border">
          <h3 className="font-heading font-bold text-base">{item?.id ? "Редактировать новость" : "Новая новость"}</h3>
          <button onClick={onClose}><Icon name="X" size={18} className="text-muted-foreground" /></button>
        </div>
        <div className="p-5 space-y-4">
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1.5">Заголовок *</label>
            <input value={form.title} onChange={e => set("title", e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl border border-border bg-background text-sm focus:outline-none focus:border-primary"
              placeholder="Заголовок новости" />
          </div>

          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1.5">Краткое описание</label>
            <textarea value={form.summary} rows={2} onChange={e => set("summary", e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-border bg-background text-sm focus:outline-none focus:border-primary resize-none"
              placeholder="Краткое описание (отображается в ленте)" />
          </div>

          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1.5">Полный текст</label>
            <textarea value={form.content} rows={5} onChange={e => set("content", e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-border bg-background text-sm focus:outline-none focus:border-primary resize-none"
              placeholder="Полный текст новости" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1.5">Категория</label>
              <select value={form.category} onChange={e => set("category", e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-border bg-background text-sm focus:outline-none focus:border-primary">
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1.5">Культура</label>
              <select value={form.crop} onChange={e => set("crop", e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-border bg-background text-sm focus:outline-none focus:border-primary">
                {CROPS.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1.5">Влияние</label>
              <select value={form.impact} onChange={e => set("impact", e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-border bg-background text-sm focus:outline-none focus:border-primary">
                {Object.entries(IMPACT_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1.5">Срочность</label>
              <select value={form.urgency} onChange={e => set("urgency", e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-border bg-background text-sm focus:outline-none focus:border-primary">
                {Object.entries(URGENCY_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1.5">Источник</label>
              <input value={form.source} onChange={e => set("source", e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-border bg-background text-sm focus:outline-none focus:border-primary"
                placeholder="АгроПорт" />
            </div>
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1.5">URL источника</label>
              <input value={form.source_url} onChange={e => set("source_url", e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-border bg-background text-sm focus:outline-none focus:border-primary"
                placeholder="https://…" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1.5">URL картинки</label>
            <input value={form.image_url} onChange={e => set("image_url", e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-border bg-background text-sm focus:outline-none focus:border-primary"
              placeholder="https://cdn…/image.jpg" />
          </div>

          <label className="flex items-center gap-3 cursor-pointer">
            <div className={`w-10 h-6 rounded-full transition-colors ${form.is_published ? "bg-primary" : "bg-secondary"} relative`}
              onClick={() => set("is_published", !form.is_published)}>
              <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-all ${form.is_published ? "left-5" : "left-1"}`} />
            </div>
            <span className="text-sm font-medium">{form.is_published ? "Опубликована" : "Черновик"}</span>
          </label>

          {error && <p className="text-xs text-destructive">{error}</p>}

          <div className="flex gap-3 pt-2">
            <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-border text-sm font-medium hover:bg-secondary">Отмена</button>
            <button onClick={save} disabled={saving}
              className="flex-1 py-2.5 rounded-xl hero-gradient text-white text-sm font-medium disabled:opacity-60 flex items-center justify-center gap-2">
              {saving ? <><Icon name="Loader" size={14} className="animate-spin" />Сохранение…</> : "Сохранить"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AdminNews() {
  const [data, setData] = useState<{ news: NewsItem[]; total: number; pages: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [modal, setModal] = useState<Partial<NewsItem> | null | false>(false);

  const load = () => {
    setLoading(true);
    adminApi.getNews({ search, page })
      .then(setData)
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [search, page]);

  const handleDelete = async (id: number) => {
    if (!confirm("Скрыть новость?")) return;
    await adminApi.deleteNews(id);
    load();
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-heading font-bold text-lg">Новости</h2>
        <button onClick={() => setModal({})}
          className="flex items-center gap-2 px-3 py-2 rounded-xl hero-gradient text-white text-xs font-medium">
          <Icon name="Plus" size={14} />Добавить новость
        </button>
      </div>

      <div className="relative">
        <Icon name="Search" size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <input value={search} onChange={e => { setSearch(e.target.value); setPage(1); }}
          placeholder="Поиск по заголовку…"
          className="w-full pl-8 pr-3 py-2 rounded-xl border border-border bg-background text-sm focus:outline-none focus:border-primary" />
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><Icon name="Loader" size={24} className="animate-spin text-primary" /></div>
      ) : (
        <div className="space-y-2">
          {data?.news.map(n => (
            <div key={n.id} className="glass-card rounded-xl p-4 flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${
                    n.is_published ? "bg-emerald-100 text-emerald-700" : "bg-secondary text-muted-foreground"
                  }`}>{n.is_published ? "Опубликована" : "Черновик"}</span>
                  <span className="text-[10px] text-muted-foreground">{n.category} · {n.crop}</span>
                </div>
                <p className="text-sm font-medium truncate">{n.title}</p>
                <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{n.summary}</p>
                <p className="text-[10px] text-muted-foreground mt-1">{new Date(n.created_at).toLocaleDateString("ru")} · {n.source}</p>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <button onClick={() => setModal(n)} className="p-1.5 hover:bg-primary/10 rounded-lg text-primary">
                  <Icon name="Edit" size={14} />
                </button>
                <button onClick={() => handleDelete(n.id)} className="p-1.5 hover:bg-destructive/10 rounded-lg text-destructive">
                  <Icon name="EyeOff" size={14} />
                </button>
              </div>
            </div>
          ))}
          {data?.news.length === 0 && (
            <div className="glass-card rounded-2xl p-12 text-center">
              <Icon name="Newspaper" size={32} className="text-muted-foreground mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">Новостей нет</p>
            </div>
          )}
        </div>
      )}

      {data && data.pages > 1 && (
        <div className="flex justify-center gap-2">
          {Array.from({ length: data.pages }, (_, i) => i + 1).map(p => (
            <button key={p} onClick={() => setPage(p)}
              className={`w-8 h-8 rounded-lg text-xs font-medium ${page === p ? "bg-primary text-white" : "bg-secondary hover:bg-secondary/80"}`}>
              {p}
            </button>
          ))}
        </div>
      )}

      {modal !== false && <NewsModal item={modal || {}} onClose={() => setModal(false)} onSave={() => { setModal(false); load(); }} />}
    </div>
  );
}
