import { FileText, Maximize2, Download } from "lucide-react";
import { useState } from "react";

interface DeckFloorPlansPdfSectionProps {
  pdfUrl: string;
}

export function DeckFloorPlansPdfSection({ pdfUrl }: DeckFloorPlansPdfSectionProps) {
  const [expanded, setExpanded] = useState(false);

  return (
    <section className="relative py-16 sm:py-24 bg-muted/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-8">
        <div className="mb-10 space-y-1 flex items-end justify-between gap-4 flex-wrap">
          <div className="space-y-1">
            <p className="text-primary text-xs font-semibold uppercase tracking-[0.2em]">Floor Plans</p>
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground flex items-center gap-2">
              <FileText className="h-6 w-6 text-primary shrink-0" />
              Full Floor Plan Document
            </h2>
            <p className="text-muted-foreground text-sm">Scroll through the complete floor plan package below.</p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => setExpanded((v) => !v)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border/60 bg-background text-xs font-medium text-muted-foreground hover:border-primary/40 hover:text-foreground transition-colors"
            >
              <Maximize2 className="h-3.5 w-3.5" />
              {expanded ? "Collapse" : "Expand"}
            </button>
            <a
              href={pdfUrl}
              target="_blank"
              rel="noopener noreferrer"
              download
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90 transition-colors"
            >
              <Download className="h-3.5 w-3.5" />
              Download PDF
            </a>
          </div>
        </div>

        <div
          className={`relative rounded-2xl overflow-hidden border border-border/50 shadow-sm bg-muted/30 transition-all duration-300 ${expanded ? "h-[85dvh]" : "h-[520px] sm:h-[680px]"}`}
        >
          <iframe
            src={`${pdfUrl}#toolbar=0&navpanes=0&scrollbar=1&view=FitH`}
            className="w-full h-full"
            title="Floor Plans PDF"
            style={{ border: "none" }}
          />
        </div>

        {/* Fallback link for browsers that block iframes */}
        <p className="text-xs text-muted-foreground text-center mt-3">
          Can't see the PDF?{" "}
          <a href={pdfUrl} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
            Open in a new tab ↗
          </a>
        </p>
      </div>
    </section>
  );
}
