import { forwardRef } from "react";

interface Doc {
  id: string;
  label: string;
  icon: string;
}

interface DocsViewerProps {
  docs: Doc[];
  activeDoc: string;
  DocComponent: React.FC;
}

const DocsViewer = forwardRef<HTMLDivElement, DocsViewerProps>(
  ({ docs, activeDoc, DocComponent }, ref) => {
    return (
      <div ref={ref} className="flex-1 glass-card rounded-2xl p-5 sm:p-6 overflow-hidden">
        <div className="flex items-center justify-between mb-5 pb-3 border-b border-border">
          <h2 className="font-heading font-bold text-base text-foreground">
            {docs.find(d => d.id === activeDoc)?.label}
          </h2>
          <span className="text-[10px] text-muted-foreground font-mono bg-secondary px-2 py-0.5 rounded-full border border-border">
            ред. 26.04.2026
          </span>
        </div>
        <DocComponent />
      </div>
    );
  }
);

DocsViewer.displayName = "DocsViewer";

export default DocsViewer;
