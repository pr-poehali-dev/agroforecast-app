import { useEffect, useState } from "react";
import { adminApi } from "@/lib/adminApi";
import Icon from "@/components/ui/icon";
import { Supplier } from "./shared";

interface Msg {
  id: number; channel: string; recipient: string; subject: string; body: string;
  status: string; error?: string; created_at: string; sent_at?: string;
}

const GOALS: { value: string; label: string }[] = [
  { value: "first_contact", label: "Первичное касание" },
  { value: "price_request", label: "Запрос цен и качества" },
  { value: "negotiation", label: "Переговоры по цене" },
  { value: "follow_up", label: "Напоминание / дожим" },
  { value: "contract", label: "Предложить договор" },
];

function fmt(iso?: string) {
  if (!iso) return "";
  const d = new Date(iso.includes("T") ? iso : iso.replace(" ", "T"));
  return isNaN(d.getTime()) ? iso : d.toLocaleString("ru-RU", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });
}

// ── Вкладка «ИИ-закупщик»: генерация письма и отправка с подтверждением ───────
export default function ProcurementTab({ item }: { item: Supplier }) {
  const [channel, setChannel] = useState<"email" | "max">("email");
  const [goal, setGoal] = useState("first_contact");
  const [instructions, setInstructions] = useState("");
  const [draftId, setDraftId] = useState<number | null>(null);
  const [recipient, setRecipient] = useState(item.email || "");
  const [subject, setSubject] = useState("");
  const [text, setText] = useState("");
  const [composing, setComposing] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [okMsg, setOkMsg] = useState("");
  const [messages, setMessages] = useState<Msg[]>([]);
  const [maxChatId, setMaxChatId] = useState<number | null>(null);
  const [maxInbox, setMaxInbox] = useState<{ sender: string; text: string; created_at: string }[]>([]);

  const loadMessages = () => adminApi.getSupplierMessages(item.id).then(d => setMessages(d.messages || [])).catch(() => {});
  useEffect(loadMessages, [item.id]);
  useEffect(() => {
    adminApi.getMaxStatus(item.id).then(d => { setMaxChatId(d.max_chat_id || null); setMaxInbox(d.inbox || []); }).catch(() => {});
  }, [item.id]);

  const compose = async () => {
    setComposing(true); setError(""); setOkMsg("");
    try {
      const d = await adminApi.composeMessage(item.id, { channel, goal, instructions });
      setDraftId(d.id); setSubject(d.subject || ""); setText(d.body || "");
      setRecipient(d.recipient || (channel === "email" ? item.email || "" : item.phone || ""));
    } catch (e: unknown) { setError(e instanceof Error ? e.message : "Ошибка ИИ"); }
    finally { setComposing(false); }
  };

  const send = async () => {
    if (!draftId) return;
    if (!recipient.trim()) { setError(channel === "email" ? "Укажите email получателя" : "Укажите адрес получателя"); return; }
    setSending(true); setError(""); setOkMsg("");
    try {
      await adminApi.sendMessage(draftId, { recipient, subject, body: text });
      setOkMsg("Сообщение отправлено и записано в историю.");
      setDraftId(null); setText(""); setSubject("");
      loadMessages();
    } catch (e: unknown) { setError(e instanceof Error ? e.message : "Не удалось отправить"); }
    finally { setSending(false); }
  };

  const inputCls = "w-full px-3 py-2 rounded-xl border border-border bg-background text-sm focus:outline-none focus:border-primary";

  return (
    <div className="space-y-4">
      {/* Настройка запроса */}
      <div className="glass-card rounded-xl p-3 space-y-2.5">
        <div className="flex gap-1.5">
          <button onClick={() => { setChannel("email"); setRecipient(item.email || ""); }}
            className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium ${channel === "email" ? "bg-primary text-white" : "bg-secondary text-muted-foreground hover:bg-secondary/80"}`}>
            <Icon name="Mail" size={12} />Email
          </button>
          <button onClick={() => { setChannel("max"); setRecipient(maxChatId ? String(maxChatId) : ""); }}
            className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium ${channel === "max" ? "bg-primary text-white" : "bg-secondary text-muted-foreground hover:bg-secondary/80"}`}>
            <Icon name="MessageCircle" size={12} />MAX
          </button>
        </div>

        {channel === "max" && (
          <div className={`rounded-lg px-2.5 py-2 text-[11px] ${maxChatId ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"}`}>
            {maxChatId
              ? <span className="flex items-center gap-1"><Icon name="CheckCircle2" size={12} />Поставщик привязан к MAX — можно писать напрямую.</span>
              : <span className="flex items-center gap-1"><Icon name="Info" size={12} />Бот в MAX не может написать первым. Попросите поставщика написать вашему боту — привязка появится автоматически.</span>}
          </div>
        )}

        <div>
          <label className="block text-[10px] font-medium text-muted-foreground mb-1">Цель обращения</label>
          <select value={goal} onChange={e => setGoal(e.target.value)} className={inputCls}>
            {GOALS.map(g => <option key={g.value} value={g.value}>{g.label}</option>)}
          </select>
        </div>

        <textarea value={instructions} rows={2} onChange={e => setInstructions(e.target.value)}
          className={`${inputCls} resize-none`} placeholder="Доп. указания ИИ (необязательно): напр. «предложи цену 14 500 ₽/т, самовывоз»" />

        <button onClick={compose} disabled={composing}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl hero-gradient text-white text-xs font-medium disabled:opacity-60">
          {composing ? <Icon name="Loader" size={13} className="animate-spin" /> : <Icon name="Sparkles" size={13} />}
          {composing ? "ИИ пишет…" : "Составить сообщение"}
        </button>
      </div>

      {/* Черновик с правкой и отправкой */}
      {draftId && (
        <div className="glass-card rounded-xl p-3 space-y-2.5 border-primary/40">
          <div className="flex items-center gap-1.5 text-xs font-medium text-primary">
            <Icon name="PenLine" size={13} />Черновик — проверьте и отправьте
          </div>
          <div>
            <label className="block text-[10px] font-medium text-muted-foreground mb-1">
              {channel === "email" ? "Кому (email)" : "Кому (MAX)"}
            </label>
            <input value={recipient} onChange={e => setRecipient(e.target.value)} className={inputCls}
              placeholder={channel === "email" ? "agro@mail.ru" : "адрес в MAX"} />
          </div>
          {channel === "email" && (
            <div>
              <label className="block text-[10px] font-medium text-muted-foreground mb-1">Тема</label>
              <input value={subject} onChange={e => setSubject(e.target.value)} className={inputCls} />
            </div>
          )}
          <textarea value={text} rows={10} onChange={e => setText(e.target.value)} className={`${inputCls} resize-y font-sans`} />
          <div className="flex gap-2">
            <button onClick={send} disabled={sending}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl hero-gradient text-white text-xs font-medium disabled:opacity-60">
              {sending ? <Icon name="Loader" size={13} className="animate-spin" /> : <Icon name="Send" size={13} />}
              {sending ? "Отправляю…" : "Отправить"}
            </button>
            <button onClick={() => { navigator.clipboard.writeText(text); setOkMsg("Скопировано"); }}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-secondary text-xs font-medium hover:bg-secondary/80">
              <Icon name="Copy" size={13} />Копировать
            </button>
          </div>
        </div>
      )}

      {okMsg && (
        <div className="flex items-center gap-2 text-xs px-3 py-2 rounded-xl bg-emerald-50 text-emerald-700">
          <Icon name="CheckCircle2" size={13} />{okMsg}
        </div>
      )}
      {error && <p className="text-xs text-destructive">{error}</p>}

      {/* История отправленных */}
      {maxInbox.length > 0 && (
        <div className="space-y-2">
          <p className="text-[11px] font-medium text-muted-foreground flex items-center gap-1">
            <Icon name="MessageCircle" size={12} className="text-primary" />Входящие из MAX
          </p>
          {maxInbox.map((m, i) => (
            <div key={i} className="glass-card rounded-xl p-3">
              <div className="flex items-center gap-2 mb-0.5">
                <span className="text-[11px] font-medium">{m.sender || "Поставщик"}</span>
                <span className="text-[10px] text-muted-foreground">{fmt(m.created_at)}</span>
              </div>
              <p className="text-xs text-foreground/80 whitespace-pre-wrap">{m.text}</p>
            </div>
          ))}
        </div>
      )}

      {messages.length > 0 && (
        <div className="space-y-2">
          <p className="text-[11px] font-medium text-muted-foreground">Отправленные сообщения</p>
          {messages.map(m => (
            <div key={m.id} className="glass-card rounded-xl p-3">
              <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                <Icon name={m.channel === "email" ? "Mail" : "MessageCircle"} size={12} className="text-primary" />
                <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${m.status === "sent" ? "bg-emerald-100 text-emerald-700" : m.status === "failed" ? "bg-rose-100 text-rose-700" : "bg-secondary text-muted-foreground"}`}>
                  {m.status === "sent" ? "отправлено" : m.status === "failed" ? "ошибка" : "черновик"}
                </span>
                <span className="text-[10px] text-muted-foreground">{fmt(m.sent_at || m.created_at)}</span>
                {m.recipient && <span className="text-[10px] text-muted-foreground truncate">→ {m.recipient}</span>}
              </div>
              {m.subject && <p className="text-xs font-medium">{m.subject}</p>}
              <p className="text-xs text-foreground/80 whitespace-pre-wrap line-clamp-3">{m.body}</p>
              {m.error && <p className="text-[10px] text-destructive mt-1">{m.error}</p>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}