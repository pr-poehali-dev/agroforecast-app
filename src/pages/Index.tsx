import { useState, useEffect } from "react";
import Icon from "@/components/ui/icon";
import { NAV_ITEMS } from "./data";
import Sidebar from "./Sidebar";
import PageContent from "./PageContent";

export default function Index() {
  const [activeSection, setActiveSection] = useState("home");
  const [selectedRegion, setSelectedRegion] = useState<string | null>("volgograd");
  const [selectedCrop, setSelectedCrop] = useState("Пшеница озимая");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [animKey, setAnimKey] = useState(0);

  useEffect(() => {
    setAnimKey(k => k + 1);
  }, [activeSection]);

  return (
    <div className="min-h-screen bg-background font-golos flex overflow-hidden">
      <Sidebar
        activeSection={activeSection}
        sidebarOpen={sidebarOpen}
        onNavigate={setActiveSection}
        onClose={() => setSidebarOpen(false)}
      />

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="h-14 border-b border-border flex items-center px-4 gap-4 bg-card/50 backdrop-blur shrink-0">
          <button className="lg:hidden text-muted-foreground hover:text-foreground" onClick={() => setSidebarOpen(true)}>
            <Icon name="Menu" size={20} />
          </button>
          <div className="flex-1 flex items-center gap-2">
            <span className="text-sm text-muted-foreground hidden sm:block">
              {NAV_ITEMS.find(n => n.id === activeSection)?.label}
            </span>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-primary/10 border border-primary/25 text-primary text-xs font-mono">
              <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse-glow" />
              LIVE
            </div>
            <span className="text-xs text-muted-foreground font-mono hidden sm:block">25 апр 2026</span>
            <button className="relative text-muted-foreground hover:text-foreground transition-colors" onClick={() => setActiveSection("alerts")}>
              <Icon name="Bell" size={18} />
              <span className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-destructive text-[9px] text-white flex items-center justify-center font-bold">7</span>
            </button>
          </div>
        </header>

        <PageContent
          activeSection={activeSection}
          animKey={animKey}
          selectedRegion={selectedRegion}
          setSelectedRegion={setSelectedRegion}
          selectedCrop={selectedCrop}
          setSelectedCrop={setSelectedCrop}
          setActiveSection={setActiveSection}
        />
      </div>
    </div>
  );
}