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
      <div className="max-w-5xl mx-auto px-5 sm:px-10">

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-10 lg:gap-16 items-start">

          {/* Left — description */}
          <div className="lg:col-span-3 space-y-6">
            <div className="space-y-2">
              <p className="text-primary text-xs font-semibold uppercase tracking-[0.2em]">The Development</p>
              <h2 className="text-2xl sm:text-3xl font-bold text-foreground">
                {projectName ? `About ${projectName}` : "About the Development"}
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
              <div className="border border-border/50 rounded-xl overflow-hidden">
                <button
                  type="button"
                  onClick={() => setHighlightsOpen((v) => !v)}
                  className="w-full flex items-center justify-between px-4 py-3 bg-muted/20 hover:bg-muted/40 transition-colors touch-manipulation"
                >
                  <span className="text-sm font-semibold text-foreground flex items-center gap-2">
                    <CheckCircle2 className="h-3.5 w-3.5 text-primary shrink-0" />
                    Project Highlights
                    <span className="text-xs font-normal text-muted-foreground">({highlights.length})</span>
                  </span>
                  <ChevronDown className={cn("h-4 w-4 text-muted-foreground transition-transform duration-200", highlightsOpen && "rotate-180")} />
                </button>

                <div
                  className="overflow-hidden transition-all duration-300"
                  style={{ maxHeight: highlightsOpen ? `${highlights.length * 44}px` : "0" }}
                >
                  <ul className="px-4 py-3 space-y-2 border-t border-border/30">
                    {highlights.map((h, i) => (
                      <li key={i} className="flex items-start gap-2.5">
                        <CheckCircle2 className="h-3.5 w-3.5 text-primary shrink-0 mt-0.5" />
                        <span className="text-sm text-foreground leading-snug">{h}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}
          </div>

          {/* Right — amenities */}
          {amenities && amenities.length > 0 && (
            <div className="lg:col-span-2">
              <div className="rounded-2xl border border-border/50 bg-muted/20 p-5 space-y-3 sticky top-24">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-3.5 w-3.5 text-primary" />
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Amenities
                  </p>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {amenities.map((amenity, i) => (
                    <span
                      key={i}
                      className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-background border border-border/60 text-foreground"
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
        .deck-prose p { margin-bottom: 0.85rem; font-size: 0.9375rem; line-height: 1.75; }
        .deck-prose strong { font-weight: 700; color: hsl(var(--foreground)); }
        .deck-prose ul { list-style: disc; padding-left: 1.25rem; margin-bottom: 0.85rem; }
        .deck-prose ul li { margin-bottom: 0.4rem; font-size: 0.9375rem; }
        .deck-prose p:last-child { margin-bottom: 0; }
        .deck-prose h2, .deck-prose h3 { font-weight: 700; color: hsl(var(--foreground)); margin-bottom: 0.5rem; }
      `}</style>
    </section>
  );
}
