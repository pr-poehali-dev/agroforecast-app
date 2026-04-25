import React from "react";

// ─── Types ────────────────────────────────────────────────────────────────────

export type Tab =
  | "dashboard"
  | "kanban"
  | "contacts"
  | "leads"
  | "deals"
  | "tasks"
  | "activities";

export interface KpiData {
  contacts?: number;
  leads?: number;
  deals?: number;
  revenue?: number;
  tasks?: number;
  funnel?: number;
  recent_activities?: Activity[];
}

export interface Contact {
  id: number;
  full_name: string;
  phone?: string;
  email?: string;
  company?: string;
  region?: string;
  status?: string;
}

export interface Lead {
  id: number;
  full_name: string;
  culture?: string;
  area?: number;
  budget?: number;
  status?: string;
  region?: string;
}

export interface Deal {
  id: number;
  title: string;
  amount?: number;
  culture?: string;
  volume?: number;
  region?: string;
  stage?: string;
  contact_name?: string;
  close_probability?: number;
}

export interface Task {
  id: number;
  title: string;
  priority?: "low" | "medium" | "high" | "critical";
  status?: "todo" | "in_progress" | "review" | "done";
  due_date?: string;
  assigned_to?: string;
}

export interface Activity {
  id: number;
  type?: "call" | "meeting" | "email" | "task";
  title?: string;
  contact_name?: string;
  result?: string;
  created_at?: string;
}

// ─── Constants ────────────────────────────────────────────────────────────────

export const KANBAN_STAGES: { key: string; label: string; color: string }[] = [
  { key: "new", label: "Новые", color: "bg-gray-100 border-gray-300" },
  { key: "contact", label: "Контакт", color: "bg-blue-50 border-blue-200" },
  { key: "qualify", label: "Квалификация", color: "bg-purple-50 border-purple-200" },
  { key: "proposal", label: "Предложение", color: "bg-yellow-50 border-yellow-200" },
  { key: "negotiation", label: "Переговоры", color: "bg-orange-50 border-orange-200" },
  { key: "won", label: "Выиграно", color: "bg-green-50 border-green-300" },
  { key: "lost", label: "Проиграно", color: "bg-red-50 border-red-200" },
];

export const TASK_STATUSES: { key: Task["status"]; label: string; color: string }[] = [
  { key: "todo", label: "К выполнению", color: "border-gray-300 bg-gray-50" },
  { key: "in_progress", label: "В работе", color: "border-blue-300 bg-blue-50" },
  { key: "review", label: "На проверке", color: "border-yellow-300 bg-yellow-50" },
  { key: "done", label: "Завершено", color: "border-green-300 bg-green-50" },
];

export const ACTIVITY_TYPES: { key: Activity["type"]; label: string; icon: string; color: string }[] = [
  { key: "call", label: "Звонок", icon: "Phone", color: "text-blue-500 bg-blue-100" },
  { key: "meeting", label: "Встреча", icon: "Users", color: "text-purple-500 bg-purple-100" },
  { key: "email", label: "Email", icon: "Mail", color: "text-orange-500 bg-orange-100" },
  { key: "task", label: "Задача", icon: "CheckSquare", color: "text-green-500 bg-green-100" },
];

export const PRIORITY_CONFIG: Record<string, { label: string; color: string }> = {
  low: { label: "Низкий", color: "bg-gray-100 text-gray-600" },
  medium: { label: "Средний", color: "bg-blue-100 text-blue-700" },
  high: { label: "Высокий", color: "bg-orange-100 text-orange-700" },
  critical: { label: "Критический", color: "bg-red-100 text-red-700" },
};

export const STAGE_LABELS: Record<string, string> = {
  new: "Новые",
  contact: "Контакт",
  qualify: "Квалификация",
  proposal: "Предложение",
  negotiation: "Переговоры",
  won: "Выиграно",
  lost: "Проиграно",
};

export const TABS: { key: Tab; label: string; icon: string }[] = [
  { key: "dashboard", label: "Дашборд", icon: "LayoutDashboard" },
  { key: "kanban", label: "Канбан", icon: "Columns" },
  { key: "contacts", label: "Контакты", icon: "Users" },
  { key: "leads", label: "Лиды", icon: "UserPlus" },
  { key: "deals", label: "Сделки", icon: "Handshake" },
  { key: "tasks", label: "Задачи", icon: "CheckSquare" },
  { key: "activities", label: "Активности", icon: "Activity" },
];

// ─── Skeleton helpers ─────────────────────────────────────────────────────────

export const Skeleton: React.FC<{ className?: string }> = ({ className = "" }) =>
  React.createElement("div", { className: `animate-pulse bg-gray-200 rounded ${className}` });

export const SkeletonRows: React.FC<{ rows?: number; cols?: number }> = ({ rows = 5, cols = 4 }) =>
  React.createElement(
    "tbody",
    null,
    Array.from({ length: rows }).map((_, i) =>
      React.createElement(
        "tr",
        { key: i, className: "border-b border-gray-100" },
        Array.from({ length: cols }).map((_, j) =>
          React.createElement(
            "td",
            { key: j, className: "px-4 py-3" },
            React.createElement(Skeleton, { className: "h-4" })
          )
        )
      )
    )
  );
