import SectionHome from "./SectionHome";
import SectionForecasts from "./SectionForecasts";
import SectionBusiness from "./SectionBusiness";
import SectionAiModel from "./SectionAiModel";
import SectionNdvi from "./SectionNdvi";
import SectionNews from "./SectionNews";
import SectionPlanner from "./SectionPlanner";
import SectionLogistics from "./SectionLogistics";
import SectionProfile from "./SectionProfile";

interface PageContentProps {
  activeSection: string;
  animKey: number;
  selectedRegion: string | null;
  setSelectedRegion: (id: string) => void;
  selectedCrop: string;
  setSelectedCrop: (crop: string) => void;
  setActiveSection: (section: string) => void;
}

export default function PageContent({
  activeSection, animKey, selectedRegion, setSelectedRegion,
  selectedCrop, setSelectedCrop, setActiveSection,
}: PageContentProps) {
  const isFullscreen = activeSection === "profile";

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

      {activeSection === "profile" && (
        <SectionProfile onLogout={() => setActiveSection("home")} />
      )}

      {(activeSection === "analytics" || activeSection === "business" || activeSection === "alerts" || activeSection === "integrations" || activeSection === "pricing") && (
        <SectionBusiness activeSection={activeSection} />
      )}
    </main>
  );
}
