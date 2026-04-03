import { FileText, Maximize2, Download, ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import { useState, useEffect, useRef, useCallback } from "react";
import * as pdfjsLib from "pdfjs-dist";
import pdfjsWorkerUrl from "pdfjs-dist/build/pdf.worker.min.mjs?url";

// Set up PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorkerUrl;
try {
  pdfjsLib.GlobalWorkerOptions.workerPort = new Worker(pdfjsWorkerUrl, { type: "module" });
} catch {
  // Fallback to workerSrc only
}

interface DeckFloorPlansPdfSectionProps {
  pdfUrl: string;
}

export function DeckFloorPlansPdfSection({ pdfUrl }: DeckFloorPlansPdfSectionProps) {
  const [expanded, setExpanded] = useState(false);
  const [pages, setPages] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  // Render PDF pages to canvas → data URLs
  useEffect(() => {
    if (!pdfUrl) return;
    let cancelled = false;

    async function render() {
      setLoading(true);
      setError(false);
      setPages([]);
      setCurrentPage(0);

      try {
        const pdf = await pdfjsLib.getDocument({ url: pdfUrl }).promise;
        const rendered: string[] = [];

        for (let i = 1; i <= pdf.numPages; i++) {
          if (cancelled) return;
          const page = await pdf.getPage(i);
          const scale = 2; // High-res rendering
          const viewport = page.getViewport({ scale });

          const canvas = document.createElement("canvas");
          canvas.width = viewport.width;
          canvas.height = viewport.height;
          const ctx = canvas.getContext("2d")!;

          await page.render({ canvasContext: ctx, viewport }).promise;
          rendered.push(canvas.toDataURL("image/png"));
        }

        if (!cancelled) {
          setPages(rendered);
          setLoading(false);
        }
      } catch (err) {
        console.error("PDF render failed:", err);
        if (!cancelled) {
          setError(true);
          setLoading(false);
        }
      }
    }

    render();
    return () => { cancelled = true; };
  }, [pdfUrl]);

  const goNext = useCallback(() => setCurrentPage((p) => Math.min(p + 1, pages.length - 1)), [pages.length]);
  const goPrev = useCallback(() => setCurrentPage((p) => Math.max(p - 1, 0)), []);

  return (
    <section className="relative py-16 sm:py-24 bg-muted/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-8">
        {/* Header */}
        <div className="mb-10 space-y-1 flex items-end justify-between gap-4 flex-wrap">
          <div className="space-y-1">
            <p className="text-primary text-xs font-semibold uppercase tracking-[0.2em]">Floor Plans</p>
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground flex items-center gap-2">
              <FileText className="h-6 w-6 text-primary shrink-0" />
              Full Floor Plan Document
            </h2>
            <p className="text-muted-foreground text-sm">
              {pages.length > 1
                ? `Browse ${pages.length} pages — swipe or use arrows to navigate.`
                : "Scroll through the complete floor plan package below."}
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {pages.length > 1 && (
              <button
                onClick={() => setExpanded((v) => !v)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border/60 bg-background text-xs font-medium text-muted-foreground hover:border-primary/40 hover:text-foreground transition-colors"
              >
                <Maximize2 className="h-3.5 w-3.5" />
                {expanded ? "Collapse" : "Expand"}
              </button>
            )}
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

        {/* Content */}
        <div
          ref={containerRef}
          className={`relative rounded-2xl overflow-hidden border border-border/50 shadow-sm bg-muted/30 transition-all duration-300 flex items-center justify-center ${
            expanded ? "min-h-[85dvh]" : "min-h-[420px] sm:min-h-[580px]"
          }`}
        >
          {loading && (
            <div className="flex flex-col items-center gap-3 py-20">
              <Loader2 className="h-8 w-8 text-primary animate-spin" />
              <p className="text-sm text-muted-foreground">Rendering floor plans…</p>
            </div>
          )}

          {error && !loading && (
            <div className="flex flex-col items-center gap-3 py-20 px-4 text-center">
              <FileText className="h-10 w-10 text-muted-foreground/40" />
              <p className="text-sm text-muted-foreground">
                Unable to render the PDF in-browser.
              </p>
              <a
                href={pdfUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-primary hover:underline font-medium"
              >
                Open PDF in a new tab ↗
              </a>
            </div>
          )}

          {!loading && !error && pages.length > 0 && (
            <>
              {/* Rendered page image */}
              <img
                src={pages[currentPage]}
                alt={`Floor plan page ${currentPage + 1}`}
                className="w-full h-auto max-h-[80dvh] object-contain select-none"
                draggable={false}
              />

              {/* Navigation arrows */}
              {pages.length > 1 && (
                <>
                  <button
                    onClick={goPrev}
                    disabled={currentPage === 0}
                    className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 p-2 rounded-full bg-background/90 backdrop-blur-sm border border-border/50 shadow-md text-foreground hover:bg-muted transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </button>
                  <button
                    onClick={goNext}
                    disabled={currentPage === pages.length - 1}
                    className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 p-2 rounded-full bg-background/90 backdrop-blur-sm border border-border/50 shadow-md text-foreground hover:bg-muted transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    <ChevronRight className="h-5 w-5" />
                  </button>

                  {/* Page indicator */}
                  <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-1.5 bg-background/90 backdrop-blur-sm rounded-full px-3 py-1.5 border border-border/40 shadow-sm">
                    <span className="text-xs font-medium text-foreground">
                      {currentPage + 1} / {pages.length}
                    </span>
                  </div>
                </>
              )}
            </>
          )}
        </div>

        {/* Fallback link */}
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
