import { useState } from "react";
import { exportAnalyticsPdf, exportForecastsXlsx, exportCommercialPdf, exportFor1C } from "@/lib/useExport";
import BusinessAnalytics from "./BusinessAnalytics";
import BusinessTools from "./BusinessTools";
import BusinessAlertsIntegrations from "./BusinessAlertsIntegrations";
import BusinessPricing from "./BusinessPricing";

interface SectionBusinessProps {
  activeSection: string;
}

export default function SectionBusiness({ activeSection }: SectionBusinessProps) {
  const [exporting, setExporting] = useState<string | null>(null);

  const doExport = async (tag: string, fn: () => void) => {
    setExporting(tag);
    await new Promise(r => setTimeout(r, 300));
    fn();
    setTimeout(() => setExporting(null), 800);
  };

  const exportActions = [
    { label: "Аналитический отчёт (PDF)", icon: "FileText", tag: "PDF",  fn: exportAnalyticsPdf },
    { label: "Данные прогнозов (Excel)", icon: "Table",    tag: "XLSX", fn: exportForecastsXlsx },
    { label: "Коммерческое предложение", icon: "FilePlus", tag: "КП",   fn: exportCommercialPdf },
    { label: "Выгрузка для 1С / API",   icon: "Database", tag: "JSON",  fn: exportFor1C },
  ];

  return (
    <>
      {activeSection === "analytics" && <BusinessAnalytics />}

      {activeSection === "business" && (
        <BusinessTools
          exporting={exporting}
          doExport={doExport}
          exportActions={exportActions}
        />
      )}

      {(activeSection === "alerts" || activeSection === "integrations") && (
        <BusinessAlertsIntegrations activeSection={activeSection} />
      )}

      {activeSection === "pricing" && <BusinessPricing />}
    </>
  );
}
