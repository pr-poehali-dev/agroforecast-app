import Icon from "@/components/ui/icon";

interface Doc {
  id: string;
  label: string;
  icon: string;
}

interface DocsSidebarProps {
  docs: Doc[];
  activeDoc: string;
  pdfLoading: boolean;
  onSelect: (id: string) => void;
  onDownloadPdf: () => void;
}

export default function DocsSidebar({ docs, activeDoc, pdfLoading, onSelect, onDownloadPdf }: DocsSidebarProps) {
  return (
    <div className="lg:w-56 shrink-0 space-y-1">
      {docs.map(d => (
        <button
          key={d.id}
          onClick={() => onSelect(d.id)}
          className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium border transition-all text-left ${
            activeDoc === d.id
              ? "bg-primary text-white border-primary shadow-sm"
              : "bg-secondary/50 text-muted-foreground border-border hover:border-primary/30 hover:text-foreground"
          }`}
        >
          <Icon name={d.icon as "FileText"} size={13} className="shrink-0" />
          <span className="leading-snug">{d.label}</span>
        </button>
      ))}

      <div className="pt-3 border-t border-border mt-3 space-y-1.5">
        <button
          onClick={onDownloadPdf}
          disabled={pdfLoading}
          className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium border transition-colors bg-primary/5 border-primary/20 text-primary hover:bg-primary/10 disabled:opacity-60 disabled:cursor-wait"
        >
          {pdfLoading
            ? <><Icon name="Loader" size={12} className="animate-spin" />Генерирую PDF…</>
            : <><Icon name="Download" size={12} />Скачать PDF</>
          }
        </button>
        <button
          onClick={() => window.print()}
          className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs text-muted-foreground border border-border hover:border-primary/30 hover:text-foreground transition-colors bg-secondary/30"
        >
          <Icon name="Printer" size={12} />
          Распечатать
        </button>
      </div>
    </div>
  );
}
