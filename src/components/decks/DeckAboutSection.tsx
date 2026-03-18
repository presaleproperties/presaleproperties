import { useMemo } from "react";
import { marked } from "marked";
import DOMPurify from "dompurify";
import { CheckCircle2, Sparkles } from "lucide-react";

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
  const hasContent = description || (highlights && highlights.length > 0) || (amenities && amenities.length > 0);
  if (!hasContent) return null;

  const htmlContent = useMemo(() => {
    if (!description) return "";
    const raw = marked.parse(description, { async: false }) as string;
    return DOMPurify.sanitize(raw);
  }, [description]);

  return (
    <section className="deck-animate py-14 sm:py-20 bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16 items-start">

          {/* Left — description prose */}
          <div className="lg:col-span-7 space-y-6">
            <div className="space-y-1">
              <p className="text-primary text-xs font-semibold uppercase tracking-[0.2em]">
                About the Development
              </p>
              <h2 className="text-2xl sm:text-3xl font-bold text-foreground">
                {projectName || "Project Overview"}
              </h2>
            </div>

            {htmlContent && (
              <div
                className="deck-prose text-muted-foreground leading-relaxed space-y-4"
                dangerouslySetInnerHTML={{ __html: htmlContent }}
              />
            )}

            {/* Highlight bullets */}
            {highlights && highlights.length > 0 && (
              <ul className="space-y-2.5 pt-2">
                {highlights.map((h, i) => (
                  <li key={i} className="flex items-start gap-2.5">
                    <CheckCircle2 className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                    <span className="text-sm text-foreground leading-snug">{h}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Right — amenities */}
          {amenities && amenities.length > 0 && (
            <div className="lg:col-span-5">
              <div className="rounded-2xl border border-border bg-muted/20 p-6 space-y-4">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-primary" />
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Building Amenities
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {amenities.map((amenity, i) => (
                    <span
                      key={i}
                      className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-medium bg-background border border-border/80 text-foreground hover:border-primary/40 hover:bg-primary/5 transition-colors"
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

      {/* Prose styles scoped to this component */}
      <style>{`
        .deck-prose p { margin-bottom: 0.85rem; font-size: 0.9375rem; }
        .deck-prose strong { font-weight: 700; color: hsl(var(--foreground)); }
        .deck-prose ul { list-style: disc; padding-left: 1.25rem; margin-bottom: 0.85rem; }
        .deck-prose ul li { margin-bottom: 0.4rem; font-size: 0.9375rem; }
        .deck-prose p:last-child { margin-bottom: 0; }
      `}</style>
    </section>
  );
}
