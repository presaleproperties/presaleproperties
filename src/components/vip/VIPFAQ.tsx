import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const faqs = [
  {
    question: "Is there a cost to join VIP membership?",
    answer: "No. VIP membership is complimentary. We earn commission from developers when you purchase—you pay nothing extra for our services or the membership benefits.",
  },
  {
    question: "Do I have to purchase right away?",
    answer: "Not at all. Many VIP members take 6-12 months to find the right project. We'll show you what's available, provide our analysis, and you decide when the timing is right for you.",
  },
  {
    question: "How do I receive the $1,500 closing credit?",
    answer: "When you purchase a presale through us, the $1,500 credit is applied at closing when you take possession. You choose whether to use it for legal fees, tenant placement, or as a cash rebate.",
  },
  {
    question: "What makes your inventory 'exclusive'?",
    answer: "Top developers reserve 40-60% of units for trusted partners before public launch. Through our long-term relationships, VIP members get access to these allocations—units that never appear on public listings.",
  },
  {
    question: "I'm an investor. Is this relevant for me?",
    answer: "Absolutely. Many of our VIP members are investors building portfolios. We provide ROI analysis, rental yield projections, multi-unit negotiation, and ongoing portfolio strategy support.",
  },
  {
    question: "How often will you contact me?",
    answer: "We respect your inbox. You'll receive relevant project alerts based on your criteria and monthly market intelligence. You can adjust preferences or unsubscribe anytime.",
  },
];

export const VIPFAQ = () => {
  return (
    <section className="py-16 md:py-24 px-4 bg-background">
      <div className="max-w-[700px] mx-auto">
        <h2 className="text-2xl md:text-3xl font-bold text-foreground text-center mb-10">
          Frequently Asked Questions
        </h2>

        <Accordion type="single" collapsible className="space-y-3">
          {faqs.map((faq, index) => (
            <AccordionItem
              key={index}
              value={`faq-${index}`}
              className="border rounded-xl px-5 bg-card"
            >
              <AccordionTrigger className="text-left font-medium py-4 hover:no-underline text-sm">
                {faq.question}
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground text-sm pb-4">
                {faq.answer}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  );
};
