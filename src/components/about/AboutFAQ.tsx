import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { FAQSchema, type FAQItem } from "@/components/seo/FAQSchema";

const faqs: FAQItem[] = [
  {
    question: "Do I pay anything for your services?",
    answer: "No. Our commission is paid by the developer, not by you. You get expert representation at no additional cost.",
  },
  {
    question: "What's the difference between presale and resale?",
    answer: "A presale (or pre-construction) home is purchased before it's built, typically from a developer. A resale is an existing property sold by a current owner. Presales have different contracts, deposit structures, timelines, and risks — which is why specialist guidance matters.",
  },
  {
    question: "Can you help with assignments?",
    answer: "Yes. If you need to sell your presale contract before completion, we handle pricing, marketing, and negotiation to maximise your return. We also help buyers looking for assignment opportunities.",
  },
  {
    question: "Which areas do you serve?",
    answer: "We serve all of Metro Vancouver and the Fraser Valley, including Vancouver, Burnaby, Surrey, Coquitlam, Langley, Richmond, and surrounding cities.",
  },
  {
    question: "Do you work with investors?",
    answer: "Absolutely. We help investors identify projects with strong rental demand, run cash flow projections, secure investor-friendly terms, and plan purchases around completion timelines.",
  },
  {
    question: "What languages does your team speak?",
    answer: "Our team speaks English, Hindi, Punjabi, Urdu, Arabic, and Korean — making your home buying experience comfortable regardless of your preferred language.",
  },
];

export function AboutFAQ() {
  return (
    <>
      <FAQSchema faqs={faqs} />
      <section className="py-12 sm:py-16 md:py-24">
        <div className="container px-4">
          <div className="max-w-3xl mx-auto">
            <div className="text-center mb-8 sm:mb-12">
              <p className="text-xs sm:text-sm font-semibold text-primary tracking-widest uppercase mb-2 sm:mb-3">
                Good to Know
              </p>
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-foreground mb-3 sm:mb-4">
                Questions We Hear Most
              </h2>
              <div className="w-16 sm:w-20 h-1 bg-primary mx-auto rounded-full" />
            </div>

            <Accordion type="single" collapsible className="w-full">
              {faqs.map((faq, index) => (
                <AccordionItem key={index} value={`faq-${index}`} className="border-border">
                  <AccordionTrigger className="text-left text-sm sm:text-base font-medium text-foreground hover:text-primary hover:no-underline py-4 sm:py-5">
                    {faq.question}
                  </AccordionTrigger>
                  <AccordionContent className="text-xs sm:text-sm text-muted-foreground leading-relaxed pb-4 sm:pb-5">
                    {faq.answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </div>
      </section>
    </>
  );
}
