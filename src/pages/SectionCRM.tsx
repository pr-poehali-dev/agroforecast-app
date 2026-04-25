import React, { useState } from "react";
import Icon from "@/components/ui/icon";
import { Tab, TABS } from "./CrmTypes";
import { DashboardTab, KanbanTab } from "./CrmDashboardKanban";
import { ContactsTab, LeadsTab } from "./CrmContactsLeads";
import { DealsTab, TasksTab, ActivitiesTab } from "./CrmDealsTasksActivities";

// ─── Main SectionCRM ──────────────────────────────────────────────────────────

const SectionCRM: React.FC = () => {
  const [tab, setTab] = useState<Tab>("dashboard");

  const renderTab = () => {
    switch (tab) {
      case "dashboard":
        return <DashboardTab />;
      case "kanban":
        return <KanbanTab />;
      case "contacts":
        return <ContactsTab />;
      case "leads":
        return <LeadsTab />;
      case "deals":
        return <DealsTab />;
      case "tasks":
        return <TasksTab />;
      case "activities":
        return <ActivitiesTab />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="hero-gradient shadow-lg">
        <div className="max-w-screen-2xl mx-auto px-4 sm:px-6">
          {/* Top bar */}
          <div className="flex items-center justify-between py-4 border-b border-white/15">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-white/15 backdrop-blur-sm border border-white/25 flex items-center justify-center">
                <Icon name="Sprout" size={20} className="text-white" />
              </div>
              <div>
                <h1 className="text-lg font-heading font-bold text-white leading-none">
                  АгроПорт CRM
                </h1>
                <p className="text-white/60 text-xs mt-0.5">
                  Управление клиентами
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 text-white/70 text-sm">
              <Icon name="Calendar" size={14} />
              <span>
                {new Date().toLocaleDateString("ru-RU", {
                  day: "2-digit",
                  month: "long",
                  year: "numeric",
                })}
              </span>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex items-center gap-1 py-2 overflow-x-auto scrollbar-none">
            {TABS.map((t) => (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium whitespace-nowrap transition-all duration-200 flex-shrink-0 ${
                  tab === t.key
                    ? "bg-white text-primary shadow-md"
                    : "text-white/80 hover:text-white hover:bg-white/15"
                }`}
              >
                <Icon name={t.icon} size={16} />
                <span className="hidden sm:inline">{t.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 py-6">
        {renderTab()}
      </div>
    </div>
  );
};

export default SectionCRM;
