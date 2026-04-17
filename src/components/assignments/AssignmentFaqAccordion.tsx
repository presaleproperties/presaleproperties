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
    <section className="bg-background py-16 lg:py-24">
      {jsonLd && (
        <Helmet>
          <script type="application/ld+json">{JSON.stringify(schema)}</script>
        </Helmet>
      )}
      <div className="container px-4">
        <div className="max-w-3xl mb-10">
          <p className="text-[11px] font-bold uppercase tracking-[0.25em] text-primary mb-3">
            FAQ
          </p>
          <h2 className="text-3xl sm:text-4xl font-bold text-foreground tracking-tight mb-3">
            {title}
          </h2>
          {subtitle && (
            <p className="text-muted-foreground leading-relaxed">{subtitle}</p>
          )}
        </div>

        <div className="max-w-4xl">
          <Accordion type="single" collapsible className="w-full divide-y divide-border border-y border-border">
            {faqs.map((f, i) => (
              <AccordionItem key={i} value={`faq-${i}`} className="border-0">
                <AccordionTrigger className="text-left text-base sm:text-lg font-semibold text-foreground hover:no-underline py-5">
                  <span className="flex gap-3">
                    <span className="text-primary text-sm font-bold pt-1 shrink-0">{String(i + 1).padStart(2, "0")}</span>
                    <span>{f.q}</span>
                  </span>
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground leading-relaxed pb-6 pl-9 space-y-3">
                  {Array.isArray(f.a)
                    ? f.a.map((para, idx) => <p key={idx}>{para}</p>)
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
