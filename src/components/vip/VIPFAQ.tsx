import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const faqs = [
  {
    question: "What's the difference between VIP Access and VIP Elite?",
    answer: "VIP Access (free) gives you early visibility into new projects and market intelligence. VIP Elite (when you buy with us) gives you exclusive inventory allocation, white-glove service from contract to completion, and your choice of $1,500 in closing benefits.",
  },
  {
    question: "Is there a cost to join VIP Elite?",
    answer: "No. We earn commission from the developer when you purchase (same as any realtor). The difference is the level of service, access, and expertise you receive.",
  },
  {
    question: "I already have a realtor. Can I still access exclusive inventory?",
    answer: "Unfortunately, exclusive inventory is reserved for our VIP Elite clients. These units are allocated to us based on our long-term relationships with developers—relationships built through years of volume and delivering qualified buyers. If you're serious about accessing the best units, we'd be happy to discuss working together.",
  },
  {
    question: "Do I have to buy immediately after joining?",
    answer: "No. Many VIP Elite clients take 6-12 months to find the right project. We'll show you what's available, provide our analysis, and you decide when to move forward. No pressure.",
  },
  {
    question: "How many VIP Elite clients do you work with at once?",
    answer: "We limit our active roster to 50 clients at a time. This ensures every client gets personalized attention, timely responses, and priority access to exclusive inventory. If we're at capacity, you'll be added to our waitlist.",
  },
  {
    question: "When exactly do I receive my $1,500 credit?",
    answer: "Your $1,500 credit is applied at closing when you take possession of your unit. You choose whether you want it as free legal fees, free tenant placement, or cash rebate.",
  },
];

export const VIPFAQ = () => {
  return (
    <section className="py-20 md:py-28 px-4 bg-background">
      <div className="max-w-[800px] mx-auto">
        <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground text-center mb-12">
          Frequently Asked Questions
        </h2>

        <Accordion type="single" collapsible className="space-y-4">
          {faqs.map((faq, index) => (
            <AccordionItem
              key={index}
              value={`faq-${index}`}
              className="border rounded-xl px-6 bg-card"
            >
              <AccordionTrigger className="text-left font-semibold py-5 hover:no-underline">
                {faq.question}
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground pb-5">
                {faq.answer}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  );
};
