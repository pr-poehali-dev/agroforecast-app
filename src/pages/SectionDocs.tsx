import { useState, useRef } from "react";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import DocsHero from "@/components/docs/DocsHero";
import DocsSidebar from "@/components/docs/DocsSidebar";
import DocsViewer from "@/components/docs/DocsViewer";
import { TermsDoc, LoyaltyRulesDoc, PrivacyDoc, ConsentDoc } from "@/components/docs/DocContents";

const DOCS = [
  { id: "terms", label: "Правила пользования", icon: "FileText" },
  { id: "loyalty-rules", label: "Правила программы АгроБаллы", icon: "Crown" },
  { id: "privacy", label: "Политика обработки персональных данных", icon: "Shield" },
  { id: "consent", label: "Согласие на обработку ПДн", icon: "UserCheck" },
];

const DOC_COMPONENTS: Record<string, React.FC> = {
  terms: TermsDoc,
  "loyalty-rules": LoyaltyRulesDoc,
  privacy: PrivacyDoc,
  consent: ConsentDoc,
};

export default function SectionDocs() {
  const [activeDoc, setActiveDoc] = useState("terms");
  const [pdfLoading, setPdfLoading] = useState(false);
  const docRef = useRef<HTMLDivElement>(null);
  const DocComponent = DOC_COMPONENTS[activeDoc];

  const downloadPdf = async () => {
    if (!docRef.current) return;
    setPdfLoading(true);
    try {
      const canvas = await html2canvas(docRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: "#ffffff",
        logging: false,
      });
      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
      const pageW = pdf.internal.pageSize.getWidth();
      const pageH = pdf.internal.pageSize.getHeight();
      const margin = 10;
      const imgW = pageW - margin * 2;
      const imgH = (canvas.height * imgW) / canvas.width;
      let y = margin;
      let remainH = imgH;
      while (remainH > 0) {
        pdf.addImage(imgData, "PNG", margin, y, imgW, imgH);
        remainH -= pageH - margin * 2;
        if (remainH > 0) {
          pdf.addPage();
          y = margin - (imgH - remainH);
        }
      }
      const docLabel = DOCS.find(d => d.id === activeDoc)?.label ?? activeDoc;
      pdf.save(`АгроПорт — ${docLabel}.pdf`);
    } finally {
      setPdfLoading(false);
    }
  };

  return (
    <div className="space-y-5 animate-fade-in max-w-4xl mx-auto">
      <DocsHero />

      <div className="flex flex-col lg:flex-row gap-5">
        <DocsSidebar
          docs={DOCS}
          activeDoc={activeDoc}
          pdfLoading={pdfLoading}
          onSelect={setActiveDoc}
          onDownloadPdf={downloadPdf}
        />
        <DocsViewer
          ref={docRef}
          docs={DOCS}
          activeDoc={activeDoc}
          DocComponent={DocComponent}
        />
      </div>
    </div>
  );
}
