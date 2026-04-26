import { useEffect, useState } from "react";
import { adminApi } from "@/lib/adminApi";
import Icon from "@/components/ui/icon";

type ModerationStatus = "pending" | "approved" | "rejected";

interface Listing {
  id: number;
  type: string;
  crop: string;
  region: string;
  price_per_ton: number;
  volume_tons: number | null;
  quality: string | null;
  contact: string | null;
  description: string | null;
  source: string;
  is_active: boolean;
  is_hidden: boolean;
  moderation_status: ModerationStatus;
  moderation_comment: string | null;
  moderated_at: string | null;
  created_at: string;
  expires_at: string | null;
}

const STATUS_LABELS: Record<ModerationStatus, { label: string; color: string }> = {
  pending:  { label: "На проверке", color: "bg-amber-100 text-amber-700 border-amber-200" },
  approved: { label: "Одобрено",    color: "bg-emerald-100 text-emerald-700 border-emerald-200" },
  rejected: { label: "Отклонено",   color: "bg-red-100 text-red-700 border-red-200" },
};

const TABS: { id: string; label: string; statusFilter: string }[] = [
  { id: "pending",  label: "На проверке", statusFilter: "pending" },
  { id: "approved", label: "Одобрённые",  statusFilter: "approved" },
  { id: "rejected", label: "Отклонённые", statusFilter: "rejected" },
  { id: "all",      label: "Все",         statusFilter: "" },
];

export default function AdminListings() {
  const [tab, setTab] = useState("pending");
  const [items, setItems] = useState<Listing[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState<Listing | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [editData, setEditData] = useState<Partial<Listing>>({});
  const [rejectComment, setRejectComment] = useState("");
  const [rejectDialogId, setRejectDialogId] = useState<number | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  const currentFilter = TABS.find(t => t.id === tab)?.statusFilter ?? "";

  const load = async (p = page) => {
    setLoading(true);
    try {
      const params: Record<string, string | number> = { page: p, limit: 20 };
      if (currentFilter) params.status = currentFilter;
      if (search.trim()) params.search = search.trim();
      const data = await adminApi.getListings(params);
      setItems(data.items);
      setTotal(data.total);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { setPage(1); }, [tab, search]);
  useEffect(() => { load(page); }, [tab, page, search]);

  const handleModerate = async (id: number, action: "approve" | "reject" | "hide" | "restore", comment?: string) => {
    setActionLoading(true);
    try {
      await adminApi.moderateListing(id, action, comment);
      await load(page);
      if (selected?.id === id) setSelected(null);
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Удалить объявление? Действие необратимо.")) return;
    setActionLoading(true);
    try {
      await adminApi.deleteListing(id);
      await load(page);
      if (selected?.id === id) setSelected(null);
    } finally {
      setActionLoading(false);
    }
  };

  const handleSaveEdit = async () => {
    if (!selected) return;
    setActionLoading(true);
    try {
      await adminApi.updateListing(selected.id, editData);
      await load(page);
      setEditMode(false);
      setSelected(null);
    } finally {
      setActionLoading(false);
    }
  };

  const openEdit = (item: Listing) => {
    setSelected(item);
    setEditData({
      crop: item.crop,
      region: item.region,
      price_per_ton: item.price_per_ton,
      volume_tons: item.volume_tons ?? undefined,
      quality: item.quality ?? "",
      contact: item.contact ?? "",
      description: item.description ?? "",
    });
    setEditMode(true);
  };

  const totalPages = Math.ceil(total / 20);

  return (
    <div className="space-y-5">
      {/* Заголовок */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="font-heading font-bold text-xl text-foreground">Маркетплейс</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Модерация объявлений · {total} записей</p>
        </div>
        <div className="relative">
          <Icon name="Search" size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Поиск по культуре, региону..."
            className="pl-8 pr-4 py-2 text-sm bg-secondary border border-border rounded-xl text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary/50 w-64"
          />
        </div>
      </div>

      {/* Вкладки */}
      <div className="flex gap-2 border-b border-border pb-0">
        {TABS.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors -mb-px ${
              tab === t.id
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Список */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Icon name="Loader" size={24} className="animate-spin text-primary" />
        </div>
      ) : items.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground text-sm">Объявлений нет</div>
      ) : (
        <div className="space-y-2">
          {items.map(item => (
            <div key={item.id} className="glass-card rounded-xl p-4 border border-border flex items-start gap-4">
              {/* Тип */}
              <div className={`shrink-0 px-2 py-0.5 rounded-lg text-[11px] font-bold uppercase ${
                item.type === "sell" ? "bg-emerald-100 text-emerald-700" : "bg-blue-100 text-blue-700"
              }`}>
                {item.type === "sell" ? "Продажа" : "Покупка"}
              </div>

              {/* Основное */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start gap-2 flex-wrap">
                  <span className="font-heading font-bold text-sm text-foreground">{item.crop}</span>
                  <span className="text-xs text-muted-foreground">{item.region}</span>
                </div>
                <div className="flex items-center gap-3 mt-1 flex-wrap">
                  <span className="font-mono text-sm font-bold text-foreground">{item.price_per_ton.toLocaleString()} ₽/т</span>
                  {item.volume_tons && <span className="text-xs text-muted-foreground">{item.volume_tons} т</span>}
                  {item.contact && <span className="text-xs text-muted-foreground truncate max-w-[160px]">{item.contact}</span>}
                </div>
                <div className="flex items-center gap-2 mt-2">
                  <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border ${STATUS_LABELS[item.moderation_status as ModerationStatus]?.color}`}>
                    {STATUS_LABELS[item.moderation_status as ModerationStatus]?.label}
                  </span>
                  {item.is_hidden && (
                    <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full border bg-gray-100 text-gray-600 border-gray-200">Скрыто</span>
                  )}
                  <span className="text-[11px] text-muted-foreground">{new Date(item.created_at).toLocaleDateString("ru-RU")}</span>
                </div>
              </div>

              {/* Действия */}
              <div className="flex items-center gap-1 shrink-0">
                {item.moderation_status === "pending" && (
                  <>
                    <button
                      onClick={() => handleModerate(item.id, "approve")}
                      disabled={actionLoading}
                      title="Одобрить"
                      className="p-1.5 rounded-lg hover:bg-emerald-50 text-emerald-600 transition-colors"
                    >
                      <Icon name="CheckCircle" size={16} />
                    </button>
                    <button
                      onClick={() => { setRejectDialogId(item.id); setRejectComment(""); }}
                      disabled={actionLoading}
                      title="Отклонить"
                      className="p-1.5 rounded-lg hover:bg-red-50 text-red-500 transition-colors"
                    >
                      <Icon name="XCircle" size={16} />
                    </button>
                  </>
                )}
                {item.moderation_status === "approved" && !item.is_hidden && (
                  <button
                    onClick={() => handleModerate(item.id, "hide")}
                    disabled={actionLoading}
                    title="Скрыть"
                    className="p-1.5 rounded-lg hover:bg-amber-50 text-amber-600 transition-colors"
                  >
                    <Icon name="EyeOff" size={16} />
                  </button>
                )}
                {item.is_hidden && (
                  <button
                    onClick={() => handleModerate(item.id, "restore")}
                    disabled={actionLoading}
                    title="Восстановить"
                    className="p-1.5 rounded-lg hover:bg-emerald-50 text-emerald-600 transition-colors"
                  >
                    <Icon name="Eye" size={16} />
                  </button>
                )}
                <button
                  onClick={() => openEdit(item)}
                  title="Редактировать"
                  className="p-1.5 rounded-lg hover:bg-secondary text-muted-foreground transition-colors"
                >
                  <Icon name="Pencil" size={16} />
                </button>
                <button
                  onClick={() => handleDelete(item.id)}
                  disabled={actionLoading}
                  title="Удалить"
                  className="p-1.5 rounded-lg hover:bg-red-50 text-red-500 transition-colors"
                >
                  <Icon name="Trash2" size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Пагинация */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
            className="px-3 py-1.5 text-sm rounded-lg border border-border bg-secondary disabled:opacity-40 hover:border-primary/40 transition-colors"
          >
            <Icon name="ChevronLeft" size={14} />
          </button>
          <span className="text-sm text-muted-foreground">{page} / {totalPages}</span>
          <button
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="px-3 py-1.5 text-sm rounded-lg border border-border bg-secondary disabled:opacity-40 hover:border-primary/40 transition-colors"
          >
            <Icon name="ChevronRight" size={14} />
          </button>
        </div>
      )}

      {/* Диалог отклонения */}
      {rejectDialogId !== null && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-card rounded-2xl p-6 w-full max-w-sm shadow-xl border border-border space-y-4">
            <h3 className="font-heading font-bold text-base text-foreground">Отклонить объявление</h3>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block font-medium">Причина отклонения (необязательно)</label>
              <textarea
                rows={3}
                value={rejectComment}
                onChange={e => setRejectComment(e.target.value)}
                placeholder="Опишите причину..."
                className="w-full text-sm bg-secondary border border-border rounded-lg px-3 py-2 text-foreground placeholder:text-muted-foreground/50 resize-none focus:outline-none focus:border-primary/50"
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setRejectDialogId(null)}
                className="flex-1 py-2 rounded-xl text-sm border border-border bg-secondary text-foreground hover:border-primary/40 transition-colors"
              >
                Отмена
              </button>
              <button
                onClick={async () => {
                  await handleModerate(rejectDialogId, "reject", rejectComment);
                  setRejectDialogId(null);
                }}
                disabled={actionLoading}
                className="flex-1 py-2 rounded-xl text-sm bg-destructive text-white font-semibold hover:bg-destructive/90 transition-colors"
              >
                Отклонить
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Диалог редактирования */}
      {editMode && selected && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-card rounded-2xl p-6 w-full max-w-lg shadow-xl border border-border space-y-4 my-auto">
            <div className="flex items-center justify-between">
              <h3 className="font-heading font-bold text-base text-foreground">Редактировать объявление #{selected.id}</h3>
              <button onClick={() => { setEditMode(false); setSelected(null); }} className="text-muted-foreground hover:text-foreground">
                <Icon name="X" size={18} />
              </button>
            </div>
            <div className="grid sm:grid-cols-2 gap-3">
              {([
                { key: "crop",          label: "Культура" },
                { key: "region",        label: "Регион" },
                { key: "price_per_ton", label: "Цена ₽/т", type: "number" },
                { key: "volume_tons",   label: "Объём (т)", type: "number" },
                { key: "quality",       label: "Качество" },
                { key: "contact",       label: "Контакт" },
              ] as { key: keyof Listing; label: string; type?: string }[]).map(f => (
                <div key={f.key}>
                  <label className="text-xs text-muted-foreground mb-1 block font-medium">{f.label}</label>
                  <input
                    type={f.type || "text"}
                    value={(editData[f.key] as string | number) ?? ""}
                    onChange={e => setEditData(d => ({ ...d, [f.key]: f.type === "number" ? Number(e.target.value) : e.target.value }))}
                    className="w-full text-sm bg-secondary border border-border rounded-lg px-3 py-2 text-foreground focus:outline-none focus:border-primary/50"
                  />
                </div>
              ))}
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block font-medium">Описание</label>
              <textarea
                rows={3}
                value={(editData.description as string) ?? ""}
                onChange={e => setEditData(d => ({ ...d, description: e.target.value }))}
                className="w-full text-sm bg-secondary border border-border rounded-lg px-3 py-2 text-foreground resize-none focus:outline-none focus:border-primary/50"
              />
            </div>
            <div className="flex gap-2 pt-1">
              <button
                onClick={() => { setEditMode(false); setSelected(null); }}
                className="flex-1 py-2.5 rounded-xl text-sm border border-border bg-secondary text-foreground hover:border-primary/40 transition-colors"
              >
                Отмена
              </button>
              <button
                onClick={handleSaveEdit}
                disabled={actionLoading}
                className="flex-1 py-2.5 rounded-xl text-sm bg-primary text-white font-semibold hover:bg-primary/90 transition-colors flex items-center justify-center gap-2"
              >
                {actionLoading ? <Icon name="Loader" size={14} className="animate-spin" /> : <Icon name="Save" size={14} />}
                Сохранить
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
