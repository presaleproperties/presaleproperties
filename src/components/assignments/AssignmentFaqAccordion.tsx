import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Helmet } from "@/components/seo/Helmet";

export interface FaqItem {
  q: string;
  a: string | string[];
}

interface AssignmentFaqAccordionProps {
  title: string;
  subtitle?: string;
  faqs: FaqItem[];
  /** Emit JSON-LD FAQPage schema for rich results */
  jsonLd?: boolean;
}

function faqAnswerToString(a: string | string[]): string {
  if (Array.isArray(a)) return a.join(" ");
  return a;
}

export function AssignmentFaqAccordion({ title, subtitle, faqs, jsonLd = true }: AssignmentFaqAccordionProps) {
  const schema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: {
        "@type": "Answer",
        text: faqAnswerToString(f.a),
      },
    })),
  };

  return (
    <section className="bg-background py-16 sm:py-20 lg:py-28">
      {jsonLd && (
        <Helmet>
          <script type="application/ld+json">{JSON.stringify(schema)}</script>
        </Helmet>
      )}
      <div className="container px-4">
        <div className="max-w-3xl mb-10 sm:mb-14">
          <p className="text-[11px] font-bold uppercase tracking-[0.25em] text-primary mb-3">
            FAQ
          </p>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-foreground tracking-tight mb-3 text-balance">
            {title}
          </h2>
          {subtitle && (
            <p className="text-muted-foreground leading-relaxed sm:text-lg text-pretty">{subtitle}</p>
          )}
        </div>

        <div className="max-w-4xl">
          <Accordion type="single" collapsible className="w-full space-y-3">
            {faqs.map((f, i) => (
              <AccordionItem
                key={i}
                value={`faq-${i}`}
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
                  {Array.isArray(f.a)
                    ? (
                      <ul className="space-y-2">
                        {f.a.map((para, idx) => (
                          <li key={idx} className="flex gap-2.5">
                            <span className="mt-2 h-1.5 w-1.5 rounded-full bg-primary/60 shrink-0" />
                            <span>{para}</span>
                          </li>
                        ))}
                      </ul>
                    )
                    : <p>{f.a}</p>}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </div>
    </section>
  );
}
