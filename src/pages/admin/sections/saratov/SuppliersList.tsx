import Icon from "@/components/ui/icon";
import { Supplier, STATUS_LABELS, STATUS_COLORS } from "./shared";

// ── Список хозяйств и пагинация ──────────────────────────────────────────────
export default function SuppliersList({ loading, data, page, setPage, setCard, handleDelete }: {
  loading: boolean;
  data: { suppliers: Supplier[]; total: number; pages: number; stats: Record<string, number> } | null;
  page: number;
  setPage: React.Dispatch<React.SetStateAction<number>>;
  setCard: React.Dispatch<React.SetStateAction<Partial<Supplier> | null>>;
  handleDelete: (id: number) => void;
}) {
  return (
    <>
      {loading ? (
        <div className="flex justify-center py-12"><Icon name="Loader" size={24} className="animate-spin text-primary" /></div>
      ) : (
        <div className="space-y-2">
          {data?.suppliers.map(sup => (
            <div key={sup.id} onClick={() => setCard(sup)}
              className="glass-card rounded-xl p-4 flex items-start justify-between gap-3 cursor-pointer hover:border-primary/40 transition-colors">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  {(sup.priority ?? 0) >= 2 && (
                    <span className="flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[10px] font-medium bg-amber-100 text-amber-700">
                      <Icon name="Star" size={10} />Приоритет
                    </span>
                  )}
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${STATUS_COLORS[sup.status] || "bg-secondary text-muted-foreground"}`}>
                    {STATUS_LABELS[sup.status] || sup.status}
                  </span>
                  {sup.district && <span className="text-[10px] text-muted-foreground">{sup.district}{sup.locality ? `, ${sup.locality}` : ""}</span>}
                  {sup.crops && <span className="text-[10px] text-primary truncate max-w-[240px]">{sup.crops}</span>}
                </div>
                <p className="text-sm font-medium truncate">{sup.name}</p>
                <div className="flex items-center gap-3 mt-0.5 flex-wrap">
                  {sup.inn && <span className="text-[10px] text-muted-foreground">ИНН {sup.inn}</span>}
                  {sup.volume_tons != null && <span className="text-[10px] text-muted-foreground">{sup.volume_tons} т</span>}
                  {sup.contact_person && <span className="text-[10px] text-muted-foreground">{sup.contact_person}</span>}
                  {sup.phone && <span className="text-[10px] text-muted-foreground">{sup.phone}</span>}
                  {sup.ai_analysis && <span className="flex items-center gap-0.5 text-[10px] text-emerald-600"><Icon name="ClipboardCheck" size={10} />анализ</span>}
                  {sup.ai_letter && <span className="flex items-center gap-0.5 text-[10px] text-emerald-600"><Icon name="MailCheck" size={10} />письмо</span>}
                </div>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <button onClick={e => { e.stopPropagation(); setCard(sup); }} title="Открыть карточку"
                  className="flex items-center gap-1 px-2 py-1.5 rounded-lg hero-gradient text-white text-[11px] font-medium">
                  <Icon name="Sparkles" size={13} />Открыть
                </button>
                <button onClick={e => { e.stopPropagation(); handleDelete(sup.id); }} className="p-1.5 hover:bg-destructive/10 rounded-lg text-destructive"><Icon name="Trash2" size={14} /></button>
              </div>
            </div>
          ))}
          {data?.suppliers.length === 0 && (
            <div className="glass-card rounded-2xl p-12 text-center">
              <Icon name="Users" size={32} className="text-muted-foreground mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">Хозяйств пока нет. Добавьте вручную или импортируйте Excel.</p>
            </div>
          )}
        </div>
      )}

      {data && data.pages > 1 && (
        <div className="flex justify-center items-center gap-2">
          <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page <= 1}
            className="px-3 h-8 rounded-lg text-xs font-medium bg-secondary hover:bg-secondary/80 disabled:opacity-40 flex items-center gap-1">
            <Icon name="ChevronLeft" size={13} />Назад
          </button>
          <span className="text-xs text-muted-foreground">Стр. {page} из {data.pages}</span>
          <button onClick={() => setPage(p => Math.min(data.pages, p + 1))} disabled={page >= data.pages}
            className="px-3 h-8 rounded-lg text-xs font-medium bg-secondary hover:bg-secondary/80 disabled:opacity-40 flex items-center gap-1">
            Вперёд<Icon name="ChevronRight" size={13} />
          </button>
        </div>
      )}
    </>
  );
}
