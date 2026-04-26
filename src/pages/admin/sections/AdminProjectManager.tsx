import { useEffect, useState } from "react";
import { adminApi } from "@/lib/adminApi";
import Icon from "@/components/ui/icon";

interface Task {
  id: number;
  stage: number;
  title: string;
  description: string;
  status: string;
  priority: string;
  due_date: string | null;
  completed_at: string | null;
}

const STAGES = [
  { id: 1, label: "Этап 1", sub: "Запуск ядра (0–6 мес)", color: "bg-blue-500", light: "bg-blue-50 border-blue-200 text-blue-700" },
  { id: 2, label: "Этап 2", sub: "Расширение (6–12 мес)", color: "bg-emerald-500", light: "bg-emerald-50 border-emerald-200 text-emerald-700" },
  { id: 3, label: "Этап 3", sub: "ИИ и Big Data (12–24 мес)", color: "bg-violet-500", light: "bg-violet-50 border-violet-200 text-violet-700" },
  { id: 4, label: "Этап 4", sub: "Масштабирование (24+ мес)", color: "bg-orange-500", light: "bg-orange-50 border-orange-200 text-orange-700" },
];

const INITIAL_TASKS = [
  { stage: 1, title: "Разработать веб-интерфейс платформы", description: "Главная страница, личный кабинет, адаптивный дизайн", priority: "high" },
  { stage: 1, title: "Реализовать модуль прогноза урожайности (NDVI)", description: "Интеграция спутниковых данных NDVI, алгоритм прогноза", priority: "high" },
  { stage: 1, title: "Создать интерактивную карту полей", description: "Визуализация NDVI и погодных условий на карте", priority: "high" },
  { stage: 1, title: "Внедрить систему уведомлений", description: "Push и email уведомления о заморозках, засухе, критических событиях", priority: "medium" },
  { stage: 1, title: "Запустить калькулятор рентабельности", description: "Расчёт рентабельности посевов по культуре и региону", priority: "medium" },
  { stage: 1, title: "Сформировать базу регионов и культур", description: "БД по регионам РФ, культурам, метеостанциям", priority: "medium" },
  { stage: 1, title: "Привлечь 1 000 первых пользователей", description: "Маркетинг в агро-сообществах Поволжья, партнёрства с хозяйствами", priority: "high" },
  { stage: 2, title: "Запустить маркетплейс сельхозпродукции", description: "Объявления о продаже/покупке зерна, масла, овощей", priority: "high" },
  { stage: 2, title: "Разработать модуль логистики", description: "Поиск транспорта, расчёт маршрутов, тарифы перевозчиков", priority: "high" },
  { stage: 2, title: "Интеграция с ERP-системами (1С, SAP)", description: "API-коннекторы к популярным учётным системам", priority: "medium" },
  { stage: 2, title: "Запустить тариф PRO", description: "Подписка 4 990 руб./мес или 49 900 руб./год", priority: "high" },
  { stage: 2, title: "Подписать 3+ партнёрства с банками и логистами", description: "Спецпредложения по кредитам, лизингу техники, транспортировке", priority: "medium" },
  { stage: 3, title: "Внедрить модели Transformer и LSTM+XGBoost", description: "Улучшение точности прогнозов: MAPE < 10% по урожайности", priority: "high" },
  { stage: 3, title: "Разработать предиктивную диагностику", description: "Выявление болезней растений по снимкам со смартфонов и дронов", priority: "high" },
  { stage: 3, title: "Создать цифровые двойники полей", description: "Виртуальные модели участков с симуляцией агроопераций", priority: "medium" },
  { stage: 3, title: "Открыть API для разработчиков", description: "Документация, SDK, Developer Portal, онбординг партнёров", priority: "medium" },
  { stage: 4, title: "Покрыть всю территорию РФ", description: "Фокус на Кубань, Черноземье, Сибирь, Урал", priority: "high" },
  { stage: 4, title: "Локализация для Казахстана и Беларуси", description: "Перевод, местные данные, партнёрства с агроструктурами", priority: "medium" },
  { stage: 4, title: "Внедрить блокчейн для цепочек поставок", description: "Прозрачность от поля до прилавка, сертификация", priority: "low" },
  { stage: 4, title: "Запустить программу лояльности АгроБаллы", description: "Баллы за активность, скидки у партнёров", priority: "medium" },
];

const STATUS_CONFIG: Record<string, { label: string; icon: string; color: string }> = {
  pending: { label: "Ожидает", icon: "Clock", color: "text-muted-foreground" },
  in_progress: { label: "В работе", icon: "PlayCircle", color: "text-blue-600" },
  done: { label: "Выполнено", icon: "CheckCircle2", color: "text-emerald-600" },
  blocked: { label: "Заблокировано", icon: "XCircle", color: "text-destructive" },
};

const PRIORITY_CONFIG: Record<string, { label: string; color: string }> = {
  high: { label: "Высокий", color: "text-red-600 bg-red-50 border-red-200" },
  medium: { label: "Средний", color: "text-amber-600 bg-amber-50 border-amber-200" },
  low: { label: "Низкий", color: "text-muted-foreground bg-secondary border-border" },
};

export default function AdminProjectManager() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeStage, setActiveStage] = useState(1);
  const [showAdd, setShowAdd] = useState(false);
  const [initialized, setInitialized] = useState(false);

  const load = async () => {
    try {
      const d = await adminApi.getTasks();
      setTasks(d.items || []);
      setInitialized(true);
    } catch {
      setTasks([]);
    } finally {
      setLoading(false);
    }
  };

  const initTasks = async () => {
    setLoading(true);
    try {
      const d = await adminApi.getTasks();
      if ((d.items || []).length === 0) {
        for (const t of INITIAL_TASKS) {
          await adminApi.createTask(t);
        }
        await load();
      } else {
        setTasks(d.items);
        setInitialized(true);
        setLoading(false);
      }
    } catch {
      setLoading(false);
    }
  };

  useEffect(() => { initTasks(); }, []);

  const stageTasks = tasks.filter(t => t.stage === activeStage);
  const doneCount = stageTasks.filter(t => t.status === "done").length;
  const progress = stageTasks.length ? Math.round((doneCount / stageTasks.length) * 100) : 0;
  const stage = STAGES[activeStage - 1];

  const updateStatus = async (id: number, status: string) => {
    await adminApi.updateTask(id, { status });
    setTasks(prev => prev.map(t => t.id === id ? { ...t, status } : t));
  };

  const deleteTask = async (id: number) => {
    await adminApi.deleteTask(id);
    setTasks(prev => prev.filter(t => t.id !== id));
  };

  const totalDone = tasks.filter(t => t.status === "done").length;
  const totalProgress = tasks.length ? Math.round((totalDone / tasks.length) * 100) : 0;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-heading font-bold text-lg">Менеджер проекта</h2>
          <p className="text-xs text-muted-foreground mt-1">План развития АгроПорт по стратегии · {totalDone}/{tasks.length} задач выполнено</p>
        </div>
        <button onClick={() => setShowAdd(true)}
          className="flex items-center gap-2 px-4 py-2 hero-gradient text-white text-sm font-semibold rounded-xl">
          <Icon name="Plus" size={15} />
          Задача
        </button>
      </div>

      <div className="glass-card rounded-2xl p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-medium text-muted-foreground">Общий прогресс проекта</span>
          <span className="text-xs font-bold text-primary">{totalProgress}%</span>
        </div>
        <div className="h-2 bg-secondary rounded-full overflow-hidden">
          <div className="h-full bg-primary rounded-full transition-all duration-500" style={{ width: `${totalProgress}%` }} />
        </div>
      </div>

      <div className="grid grid-cols-4 gap-2">
        {STAGES.map(s => {
          const st = tasks.filter(t => t.stage === s.id);
          const done = st.filter(t => t.status === "done").length;
          return (
            <button key={s.id} onClick={() => setActiveStage(s.id)}
              className={`p-3 rounded-2xl border text-left transition-all ${activeStage === s.id ? "border-primary bg-primary/5" : "border-border hover:border-primary/40 glass-card"}`}>
              <div className={`w-6 h-6 rounded-lg flex items-center justify-center mb-2 ${s.color}`}>
                <span className="text-white text-[10px] font-bold">{s.id}</span>
              </div>
              <p className="text-xs font-semibold leading-tight">{s.label}</p>
              <p className="text-[10px] text-muted-foreground mt-0.5">{done}/{st.length} задач</p>
            </button>
          );
        })}
      </div>

      <div className="glass-card rounded-2xl p-4">
        <div className="flex items-center justify-between mb-3">
          <div>
            <p className="font-heading font-bold text-sm">{stage.label}: {stage.sub}</p>
            <p className="text-xs text-muted-foreground">{doneCount} из {stageTasks.length} задач · {progress}%</p>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-1.5 w-24 bg-secondary rounded-full overflow-hidden">
              <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${progress}%` }} />
            </div>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-8"><Icon name="Loader" size={20} className="animate-spin text-primary" /></div>
        ) : (
          <div className="space-y-2">
            {stageTasks.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-6">Задач нет. Нажмите «+ Задача» чтобы добавить.</p>
            )}
            {stageTasks.map(task => (
              <TaskCard key={task.id} task={task} onStatusChange={updateStatus} onDelete={deleteTask} />
            ))}
          </div>
        )}
      </div>

      {showAdd && (
        <AddTaskModal
          stage={activeStage}
          onClose={() => setShowAdd(false)}
          onCreate={async (data) => {
            await adminApi.createTask(data);
            await load();
            setShowAdd(false);
          }}
        />
      )}
    </div>
  );
}

function TaskCard({ task, onStatusChange, onDelete }: {
  task: Task;
  onStatusChange: (id: number, status: string) => void;
  onDelete: (id: number) => void;
}) {
  const [open, setOpen] = useState(false);
  const status = STATUS_CONFIG[task.status] || STATUS_CONFIG.pending;
  const priority = PRIORITY_CONFIG[task.priority] || PRIORITY_CONFIG.medium;

  const nextStatus: Record<string, string> = {
    pending: "in_progress",
    in_progress: "done",
    done: "pending",
    blocked: "pending",
  };

  return (
    <div className={`border rounded-xl p-3 transition-all ${task.status === "done" ? "opacity-60 bg-secondary/30" : "bg-background border-border hover:border-primary/30"}`}>
      <div className="flex items-start gap-3">
        <button onClick={() => onStatusChange(task.id, nextStatus[task.status] || "pending")}
          className={`mt-0.5 shrink-0 ${status.color}`}>
          <Icon name={status.icon as "Clock"} size={16} />
        </button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className={`text-sm font-medium ${task.status === "done" ? "line-through text-muted-foreground" : ""}`}>
              {task.title}
            </p>
            <span className={`text-[10px] px-1.5 py-0.5 rounded border font-medium ${priority.color}`}>
              {priority.label}
            </span>
          </div>
          {task.description && (
            <p className="text-xs text-muted-foreground mt-0.5 truncate">{task.description}</p>
          )}
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <select value={task.status} onChange={e => onStatusChange(task.id, e.target.value)}
            className="text-[10px] border border-border rounded-lg px-1.5 py-1 bg-background focus:outline-none">
            {Object.entries(STATUS_CONFIG).map(([k, v]) => (
              <option key={k} value={k}>{v.label}</option>
            ))}
          </select>
          <button onClick={() => onDelete(task.id)}
            className="p-1 text-muted-foreground hover:text-destructive transition-colors">
            <Icon name="Trash2" size={13} />
          </button>
        </div>
      </div>
    </div>
  );
}

function AddTaskModal({ stage, onClose, onCreate }: {
  stage: number;
  onClose: () => void;
  onCreate: (data: Record<string, unknown>) => void;
}) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState("medium");

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-background rounded-2xl p-6 w-full max-w-sm space-y-4 shadow-xl">
        <h3 className="font-heading font-bold text-base">Новая задача · Этап {stage}</h3>
        <div>
          <label className="text-xs text-muted-foreground mb-1 block">Название</label>
          <input value={title} onChange={e => setTitle(e.target.value)}
            className="w-full px-3 py-2 border border-border rounded-xl text-sm bg-background focus:outline-none focus:border-primary" />
        </div>
        <div>
          <label className="text-xs text-muted-foreground mb-1 block">Описание</label>
          <textarea value={description} onChange={e => setDescription(e.target.value)}
            className="w-full px-3 py-2 border border-border rounded-xl text-sm bg-background focus:outline-none focus:border-primary resize-none h-20" />
        </div>
        <div>
          <label className="text-xs text-muted-foreground mb-1 block">Приоритет</label>
          <select value={priority} onChange={e => setPriority(e.target.value)}
            className="w-full px-3 py-2 border border-border rounded-xl text-sm bg-background focus:outline-none">
            <option value="high">Высокий</option>
            <option value="medium">Средний</option>
            <option value="low">Низкий</option>
          </select>
        </div>
        <div className="flex gap-2">
          <button onClick={() => title && onCreate({ stage, title, description, priority })}
            className="flex-1 py-2 hero-gradient text-white text-sm font-semibold rounded-xl">
            Добавить
          </button>
          <button onClick={onClose} className="flex-1 py-2 border border-border text-sm rounded-xl hover:bg-secondary">
            Отмена
          </button>
        </div>
      </div>
    </div>
  );
}
