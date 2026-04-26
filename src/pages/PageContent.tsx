import { useState, useEffect } from "react";
import SectionHome from "./SectionHome";
import SectionForecasts from "./SectionForecasts";
import SectionBusiness from "./SectionBusiness";
import SectionAiModel from "./SectionAiModel";
import SectionNdvi from "./SectionNdvi";
import SectionNews from "./SectionNews";
import SectionPlanner from "./SectionPlanner";
import SectionLogistics from "./SectionLogistics";
import SectionProfile from "./SectionProfile";
import SectionPortfolio from "./SectionPortfolio";
import SectionBoard from "./SectionBoard";
import SectionLoyalty from "./SectionLoyalty";
import SectionPartners from "./SectionPartners";
import SectionDocs from "./SectionDocs";
import AuthPage from "./AuthPage";
import { getToken } from "@/lib/auth";

interface PageContentProps {
  activeSection: string;
  animKey: number;
  selectedRegion: string | null;
  setSelectedRegion: (id: string) => void;
  selectedCrop: string;
  setSelectedCrop: (crop: string) => void;
  setActiveSection: (section: string) => void;
  onRegister?: () => void;
}

export default function PageContent({
  activeSection, animKey, selectedRegion, setSelectedRegion,
  selectedCrop, setSelectedCrop, setActiveSection, onRegister,
}: PageContentProps) {
  const [isAuthed, setIsAuthed] = useState(() => !!getToken());

  // Синхронизируем при смене секции (на случай если токен появился/исчез)
  useEffect(() => {
    setIsAuthed(!!getToken());
  }, [activeSection]);

  const isFullscreen = activeSection === "crm";

  const handleLogin = (isNew?: boolean) => {
    setIsAuthed(true);
    if (isNew) onRegister?.();
  };

  const handleLogout = () => {
    setIsAuthed(false);
    setActiveSection("home");
  };

  return (
    <main
      className={`flex-1 overflow-y-auto bg-grid bg-background ${isFullscreen ? "" : "p-4 lg:p-6"}`}
      key={animKey}
    >
      {activeSection === "home" && (
        <SectionHome
          selectedRegion={selectedRegion}
          setSelectedRegion={setSelectedRegion}
          setSelectedCrop={setSelectedCrop}
          setActiveSection={setActiveSection}
        />
      )}

      {(activeSection === "forecasts" || activeSection === "map" || activeSection === "supply" || activeSection === "risks") && (
        <SectionForecasts
          activeSection={activeSection}
          selectedRegion={selectedRegion}
          setSelectedRegion={setSelectedRegion}
          selectedCrop={selectedCrop}
          setSelectedCrop={setSelectedCrop}
        />
      )}

      {activeSection === "ndvi" && <SectionNdvi />}
      {activeSection === "news" && <SectionNews />}
      {activeSection === "planner" && <SectionPlanner />}
      {activeSection === "ai-model" && <SectionAiModel />}
      {activeSection === "logistics" && <SectionLogistics />}

      {activeSection === "crm" && (
        isAuthed
          ? <SectionProfile onLogout={handleLogout} />
          : <AuthPage onLogin={handleLogin} onOpenDocs={() => setActiveSection("docs")} />
      )}

      {(activeSection === "analytics" || activeSection === "business" || activeSection === "alerts" || activeSection === "integrations" || activeSection === "pricing") && (
        <SectionBusiness activeSection={activeSection} />
      )}

      {activeSection === "portfolio" && <SectionPortfolio />}
      {activeSection === "board" && <SectionBoard />}
      {activeSection === "loyalty" && <SectionLoyalty />}
      {activeSection === "partners" && <SectionPartners />}
      {activeSection === "docs" && <SectionDocs />}
    </main>
  );
}