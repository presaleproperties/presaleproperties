import { useState } from "react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Helmet } from "@/components/seo/Helmet";
import { cn } from "@/lib/utils";

export interface HubFaqItem {
  q: string;
  a: string | string[];
  topic: "buying" | "selling" | "general";
}

interface AssignmentsHubFaqProps {
  faqs: HubFaqItem[];
}

const TABS: { id: "all" | "buying" | "selling" | "general"; label: string }[] = [
  { id: "all", label: "All" },
  { id: "buying", label: "Buying" },
  { id: "selling", label: "Selling" },
  { id: "general", label: "General" },
];

function answerToString(a: string | string[]): string {
  return Array.isArray(a) ? a.join(" ") : a;
}

export function AssignmentsHubFaq({ faqs }: AssignmentsHubFaqProps) {
  const [tab, setTab] = useState<"all" | "buying" | "selling" | "general">("all");
  const visible = tab === "all" ? faqs : faqs.filter((f) => f.topic === tab);

  const schema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: answerToString(f.a) },
    })),
  };

  return (
    <section id="faq" className="bg-background py-16 sm:py-20 lg:py-24 scroll-mt-20">
      <Helmet>
        <script type="application/ld+json">{JSON.stringify(schema)}</script>
      </Helmet>
      <div className="container px-4">
        <div className="max-w-3xl mb-8 sm:mb-12">
          <p className="text-[11px] font-bold uppercase tracking-[0.25em] text-primary mb-3">FAQ</p>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-foreground tracking-tight mb-3 text-balance">
            Everything you need to know about assignments
          </h2>
          <p className="text-muted-foreground leading-relaxed sm:text-lg text-pretty">
            Honest answers — whether you’re buying, selling, or still figuring it out.
          </p>
        </div>

        {/* Topic tabs */}
        <div
          role="tablist"
          aria-label="FAQ topics"
          className="inline-flex flex-wrap gap-1.5 p-1 rounded-xl border border-border bg-muted/40 mb-8"
        >
          {TABS.map((t) => {
            const active = tab === t.id;
            const count = t.id === "all" ? faqs.length : faqs.filter((f) => f.topic === t.id).length;
            return (
              <button
                key={t.id}
                role="tab"
                aria-selected={active}
                onClick={() => setTab(t.id)}
                className={cn(
                  "px-4 py-2 rounded-lg text-sm font-semibold transition-all",
                  active
                    ? "bg-card text-foreground shadow-sm border border-border"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {t.label}
                <span
                  className={cn(
                    "ml-2 text-[10px] font-bold tabular-nums px-1.5 py-0.5 rounded",
                    active ? "bg-primary/10 text-primary" : "bg-background text-muted-foreground"
                  )}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        <div className="max-w-4xl">
          <Accordion type="single" collapsible className="w-full space-y-3">
            {visible.map((f, i) => (
              <AccordionItem
                key={`${tab}-${i}`}
                value={`faq-${tab}-${i}`}
                className="group border border-border rounded-xl bg-card data-[state=open]:border-primary/40 data-[state=open]:shadow-sm transition-colors"
              >
                <AccordionTrigger className="text-left text-base sm:text-lg font-semibold text-foreground hover:no-underline py-5 px-5 sm:px-6">
                  <span className="flex items-start gap-3 sm:gap-4 pr-3">
                    <span className="text-[10px] sm:text-xs font-bold text-primary bg-primary/10 rounded-md px-2 py-1 shrink-0 tabular-nums leading-none mt-0.5">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <span className="leading-snug">{f.q}</span>
                  </span>
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground leading-relaxed pb-6 px-5 sm:px-6 pl-12 sm:pl-[3.75rem] space-y-3 text-sm sm:text-base">
                  {Array.isArray(f.a) ? (
                    <ul className="space-y-2">
                      {f.a.map((para, idx) => (
                        <li key={idx} className="flex gap-2.5">
                          <span className="mt-2 h-1.5 w-1.5 rounded-full bg-primary/60 shrink-0" />
                          <span>{para}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p>{f.a}</p>
                  )}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </div>
    </section>
  );
}
