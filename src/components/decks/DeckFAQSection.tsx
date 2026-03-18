import { useState } from "react";
import { Plus, Minus } from "lucide-react";
import { cn } from "@/lib/utils";

const FAQS = [
  {
    q: "Do I have to pay commissions?",
    a: "No. The developer pays your buyer's agent commissions in full. There is zero cost to you for professional representation.",
  },
  {
    q: "Can I assign my unit before completion?",
    a: "Yes. There is a 0% assignment fee from the developer. The only cost if you decide to assign is a $1,000 admin fee — and that only applies if you choose to sell.",
  },
  {
    q: "Do I need a mortgage pre-approval?",
    a: "Not at this stage — what you need is a pre-qualification. Pre-approvals are only valid for 90–120 days, and some banks offer 1–2 year completion approvals, but those come with significantly higher interest rates and a tougher stress test that can throw off your qualifying numbers.\n\nThe smartest move is to get a rough qualification number based on your current income and financial situation. That way you know what ballpark you're buying in, and you're not committing to something you won't be able to close at completion.",
  },
  {
    q: "How much do I need upfront?",
    a: "The deposit structure is spread across construction milestones — typically 5% at signing, then installments of 5–10% tied to key build stages. You're never required to put down the full amount at once.",
  },
  {
    q: "What happens if I can't close at completion?",
    a: "You have options. You can assign the unit to another buyer before completion, potentially at a profit. Alternatively, you can arrange a bridge loan or refinance closer to the possession date. Speaking to a mortgage broker early gives you the most flexibility.",
  },
  {
    q: "Is there GST on top of the purchase price?",
    a: "Yes — new construction in BC is subject to GST. For primary residences under $350,000, a federal rebate applies. Your lawyer and accountant will walk you through the exact numbers at time of purchase.",
  },
];

interface FAQItemProps {
  q: string;
  a: string;
  isOpen: boolean;
  onToggle: () => void;
  index: number;
}

function FAQItem({ q, a, isOpen, onToggle, index }: FAQItemProps) {
  return (
    <div className="border-b border-border/60 last:border-0">
      <button
        onClick={onToggle}
        className="w-full flex items-start justify-between gap-4 py-5 text-left group focus:outline-none"
        aria-expanded={isOpen}
      >
        <span className={cn(
          "text-sm sm:text-base font-medium leading-snug transition-colors duration-200",
          isOpen ? "text-primary" : "text-foreground group-hover:text-primary"
        )}>
          {q}
        </span>
        <span className={cn(
          "shrink-0 mt-0.5 w-5 h-5 rounded-full flex items-center justify-center transition-all duration-200",
          isOpen
            ? "bg-primary text-primary-foreground"
            : "bg-muted text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary"
        )}>
          {isOpen ? <Minus className="h-3 w-3" /> : <Plus className="h-3 w-3" />}
        </span>
      </button>

      <div
        className={cn(
          "overflow-hidden transition-all duration-300 ease-in-out",
          isOpen ? "max-h-[400px] opacity-100" : "max-h-0 opacity-0"
        )}
      >
        <div className="pb-5 pr-9">
          {a.split("\n\n").map((para, i) => (
            <p key={i} className={cn("text-sm text-muted-foreground leading-relaxed", i > 0 && "mt-3")}>
              {para}
            </p>
          ))}
        </div>
      </div>
    </div>
  );
}

export function DeckFAQSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const toggle = (i: number) => setOpenIndex(openIndex === i ? null : i);

  return (
    <section id="faq" className="relative py-8 sm:py-20 bg-background">
      <div className="max-w-3xl mx-auto px-4 sm:px-6">
        <div className="mb-6 sm:mb-12 space-y-1">
          <p className="text-primary text-xs font-semibold uppercase tracking-[0.2em]">FAQ</p>
          <h2 className="text-2xl sm:text-3xl font-bold text-foreground">Common Questions</h2>
        </div>

        <div>
          {FAQS.map((faq, i) => (
            <FAQItem
              key={i}
              index={i}
              q={faq.q}
              a={faq.a}
              isOpen={openIndex === i}
              onToggle={() => toggle(i)}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
