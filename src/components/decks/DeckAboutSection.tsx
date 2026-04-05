import { useState, useMemo } from "react";
import { marked } from "marked";
import DOMPurify from "dompurify";
import { CheckCircle2, Sparkles, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface DeckAboutSectionProps {
  description?: string | null;
  highlights?: string[] | null;
  amenities?: string[] | null;
  projectName?: string;
}

export function DeckAboutSection({
  description,
  highlights,
  amenities,
  projectName,
}: DeckAboutSectionProps) {
  const [highlightsOpen, setHighlightsOpen] = useState(false);

  const htmlContent = useMemo(() => {
    if (!description) return "";
    const raw = marked.parse(description, { async: false }) as string;
    return DOMPurify.sanitize(raw);
  }, [description]);

  const hasContent = description || (highlights && highlights.length > 0) || (amenities && amenities.length > 0);
  if (!hasContent) return null;

  return (
    <section id="about" className="py-16 sm:py-24 bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-8">

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16 items-start">

          {/* Left — description */}
          <div className="lg:col-span-7 space-y-6">
            <div className="space-y-1.5">
              <p className="text-primary text-[11px] font-bold uppercase tracking-[0.25em]">02 — About the Development</p>
              <h2 className="text-3xl sm:text-4xl font-bold text-foreground tracking-tight">
                {projectName ? `Welcome to ${projectName}` : "About the Development"}
              </h2>
            </div>

            {htmlContent && (
              <div
                className="deck-prose text-muted-foreground leading-relaxed"
                dangerouslySetInnerHTML={{ __html: htmlContent }}
              />
            )}

            {/* Collapsible highlights */}
            {highlights && highlights.length > 0 && (
              <div className="border border-border/40 rounded-xl overflow-hidden">
                <button
                  type="button"
                  onClick={() => setHighlightsOpen((v) => !v)}
                  className="w-full flex items-center justify-between px-5 py-4 bg-muted/15 hover:bg-muted/30 transition-colors touch-manipulation"
                >
                  <span className="text-[15px] font-semibold text-foreground flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />
                    Project Highlights
                    <span className="text-sm font-normal text-muted-foreground">({highlights.length})</span>
                  </span>
                  <ChevronDown className={cn("h-4 w-4 text-muted-foreground transition-transform duration-200", highlightsOpen && "rotate-180")} />
                </button>

                <div
                  className="overflow-hidden transition-all duration-300"
                  style={{ maxHeight: highlightsOpen ? `${highlights.length * 52}px` : "0" }}
                >
                  <ul className="px-5 py-4 space-y-3 border-t border-border/20">
                    {highlights.map((h, i) => (
                      <li key={i} className="flex items-start gap-2.5">
                        <CheckCircle2 className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                        <span className="text-[15px] text-foreground leading-snug">{h}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}
          </div>

          {/* Right — amenities */}
          {amenities && amenities.length > 0 && (
            <div className="lg:col-span-5">
              <div className="rounded-2xl border border-border/40 bg-card p-6 space-y-4 sticky top-24">
                <div className="flex items-center gap-2 mb-1">
                  <Sparkles className="h-4 w-4 text-primary" />
                  <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-muted-foreground">
                    Building Amenities
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {amenities.map((amenity, i) => (
                    <span
                      key={i}
                      className="inline-flex items-center px-3.5 py-2 rounded-full text-sm font-medium bg-background border border-border/50 text-foreground hover:border-primary/30 transition-colors"
                    >
                      {amenity}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <style>{`
        .deck-prose p { margin-bottom: 1rem; font-size: 1.0625rem; line-height: 1.8; }
        .deck-prose strong { font-weight: 700; color: hsl(var(--foreground)); }
        .deck-prose ul { list-style: disc; padding-left: 1.25rem; margin-bottom: 1rem; }
        .deck-prose ul li { margin-bottom: 0.5rem; font-size: 1.0625rem; line-height: 1.8; }
        .deck-prose p:last-child { margin-bottom: 0; }
        .deck-prose h2, .deck-prose h3 { font-weight: 700; color: hsl(var(--foreground)); margin-bottom: 0.6rem; font-size: 1.25rem; }
      `}</style>
    </section>
  );
}
