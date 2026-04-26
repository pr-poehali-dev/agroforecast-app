import { useEffect, useRef, useState } from "react";
import { adminApi } from "@/lib/adminApi";
import Icon from "@/components/ui/icon";

interface Message {
  id?: number;
  role: "user" | "assistant";
  content: string;
  created_at?: string;
}

const QUICK_COMMANDS = [
  "Что нужно сделать прямо сейчас?",
  "Составь план на этот месяц",
  "Мы на каком этапе стратегии?",
  "Какие главные риски проекта?",
  "Как привлечь первых 1000 пользователей?",
  "Предложи метрики для отслеживания прогресса",
];

export default function AdminAgent() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const loadHistory = async () => {
    setFetching(true);
    try {
      const d = await adminApi.getAgentMessages(50);
      setMessages(d.messages || []);
    } catch {
      setMessages([]);
    } finally {
      setFetching(false);
    }
  };

  useEffect(() => { loadHistory(); }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const send = async (text?: string) => {
    const msg = (text || input).trim();
    if (!msg || loading) return;
    setInput("");

    const userMsg: Message = { role: "user", content: msg };
    setMessages(prev => [...prev, userMsg]);
    setLoading(true);

    try {
      const res = await adminApi.sendAgentMessage(msg);
      const agentMsg: Message = { role: "assistant", content: res.reply, id: res.id };
      setMessages(prev => [...prev, agentMsg]);
    } catch (e: unknown) {
      const errMsg: Message = {
        role: "assistant",
        content: e instanceof Error ? e.message : "Произошла ошибка. Попробуйте ещё раз.",
      };
      setMessages(prev => [...prev, errMsg]);
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  };

  const clearHistory = async () => {
    if (!confirm("Очистить историю переписки с агентом?")) return;
    await adminApi.clearAgentHistory().catch(() => {});
    setMessages([]);
  };

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-130px)]">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 hero-gradient rounded-xl flex items-center justify-center shrink-0">
            <Icon name="Bot" size={20} className="text-white" />
          </div>
          <div>
            <h2 className="font-heading font-bold text-base leading-none">Алексей Громов</h2>
            <p className="text-xs text-muted-foreground mt-0.5">ИИ менеджер проекта АгроПорт · подчиняется Администратору</p>
          </div>
          <span className="flex items-center gap-1 text-[10px] text-emerald-600 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full font-medium">
            <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full" />
            Онлайн
          </span>
        </div>
        {messages.length > 0 && (
          <button onClick={clearHistory}
            className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-destructive px-3 py-1.5 border border-border rounded-lg hover:border-destructive/30 transition-colors">
            <Icon name="Trash2" size={12} />
            Очистить
          </button>
        )}
      </div>

      <div className="flex-1 glass-card rounded-2xl overflow-hidden flex flex-col">
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {fetching ? (
            <div className="flex justify-center pt-8">
              <Icon name="Loader" size={20} className="animate-spin text-primary" />
            </div>
          ) : messages.length === 0 ? (
            <div className="space-y-4 pt-4">
              <div className="flex gap-3">
                <div className="w-8 h-8 hero-gradient rounded-xl flex items-center justify-center shrink-0 mt-0.5">
                  <Icon name="Bot" size={16} className="text-white" />
                </div>
                <div className="flex-1">
                  <div className="bg-secondary rounded-2xl rounded-tl-sm p-3.5 max-w-lg">
                    <p className="text-sm">
                      Здравствуйте! Я Алексей Громов, менеджер проекта АгроПорт.<br /><br />
                      Я знаю стратегию развития платформы по всем 4 этапам и готов помочь вам:
                    </p>
                    <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
                      <li className="flex items-center gap-2"><Icon name="CheckCircle2" size={12} className="text-primary" /> Составить план действий</li>
                      <li className="flex items-center gap-2"><Icon name="CheckCircle2" size={12} className="text-primary" /> Расставить приоритеты задач</li>
                      <li className="flex items-center gap-2"><Icon name="CheckCircle2" size={12} className="text-primary" /> Выявить риски и предложить решения</li>
                      <li className="flex items-center gap-2"><Icon name="CheckCircle2" size={12} className="text-primary" /> Подготовить отчёт о статусе проекта</li>
                    </ul>
                    <p className="text-sm mt-2">С чего начнём?</p>
                  </div>
                </div>
              </div>
              <div className="flex flex-wrap gap-2 pl-11">
                {QUICK_COMMANDS.map((cmd, i) => (
                  <button key={i} onClick={() => send(cmd)}
                    className="text-xs px-3 py-1.5 border border-primary/30 text-primary bg-primary/5 rounded-xl hover:bg-primary/10 transition-colors">
                    {cmd}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            messages.map((msg, i) => (
              <div key={i} className={`flex gap-3 ${msg.role === "user" ? "flex-row-reverse" : ""}`}>
                {msg.role === "assistant" ? (
                  <div className="w-8 h-8 hero-gradient rounded-xl flex items-center justify-center shrink-0 mt-0.5">
                    <Icon name="Bot" size={16} className="text-white" />
                  </div>
                ) : (
                  <div className="w-8 h-8 bg-secondary border border-border rounded-xl flex items-center justify-center shrink-0 mt-0.5">
                    <Icon name="User" size={16} className="text-foreground" />
                  </div>
                )}
                <div className={`max-w-[75%] ${msg.role === "user" ? "items-end" : "items-start"} flex flex-col`}>
                  <div className={`rounded-2xl p-3.5 text-sm whitespace-pre-wrap ${
                    msg.role === "user"
                      ? "hero-gradient text-white rounded-tr-sm"
                      : "bg-secondary text-foreground rounded-tl-sm"
                  }`}>
                    {msg.content}
                  </div>
                  {msg.created_at && (
                    <p className="text-[10px] text-muted-foreground mt-1 px-1">
                      {new Date(msg.created_at).toLocaleTimeString("ru", { hour: "2-digit", minute: "2-digit" })}
                    </p>
                  )}
                </div>
              </div>
            ))
          )}
          {loading && (
            <div className="flex gap-3">
              <div className="w-8 h-8 hero-gradient rounded-xl flex items-center justify-center shrink-0">
                <Icon name="Bot" size={16} className="text-white" />
              </div>
              <div className="bg-secondary rounded-2xl rounded-tl-sm px-4 py-3 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                <span className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                <span className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        <div className="border-t border-border p-3">
          {messages.length > 0 && !loading && (
            <div className="flex gap-2 mb-3 flex-wrap">
              {QUICK_COMMANDS.slice(0, 3).map((cmd, i) => (
                <button key={i} onClick={() => send(cmd)}
                  className="text-[10px] px-2.5 py-1 border border-primary/30 text-primary bg-primary/5 rounded-lg hover:bg-primary/10 transition-colors">
                  {cmd}
                </button>
              ))}
            </div>
          )}
          <div className="flex gap-2">
            <textarea
              ref={inputRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKey}
              placeholder="Напишите задание для менеджера проекта... (Enter — отправить)"
              className="flex-1 px-3 py-2.5 border border-border rounded-xl text-sm bg-background focus:outline-none focus:border-primary resize-none min-h-[42px] max-h-32"
              rows={1}
            />
            <button onClick={() => send()} disabled={!input.trim() || loading}
              className="px-4 py-2 hero-gradient text-white rounded-xl disabled:opacity-40 transition-opacity shrink-0">
              <Icon name="Send" size={16} />
            </button>
          </div>
          <p className="text-[10px] text-muted-foreground mt-1.5 text-center">
            Shift+Enter — новая строка · Enter — отправить
          </p>
        </div>
      </div>
    </div>
  );
}
