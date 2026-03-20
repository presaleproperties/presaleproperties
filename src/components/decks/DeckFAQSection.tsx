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
    q: "Do I need to pay GST out of pocket on top of my down payment as an investor?",
    a: "No. As an investor, you do not pay GST separately out of pocket. The GST is added to the purchase price, and your 20% down payment is calculated on that combined total (Purchase Price + GST = Final Price). The remaining GST balance is simply rolled into your mortgage — so your cash requirement at signing only reflects the down payment on the full price, nothing extra on top.",
  },
  {
    q: "Do I need to pay Property Transfer Tax (PTT) out of pocket as an investor?",
    a: "Yes. PTT cannot be added to your mortgage — it must be paid out of pocket at completion. As an investor purchasing a new construction property, PTT is calculated on the final purchase price (including GST) and is due in full at closing. This is a separate cash requirement on top of your down payment, so it's important to budget for it in advance.",
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
    <div
      className={cn(
        "rounded-2xl border transition-all duration-200 overflow-hidden",
        isOpen
          ? "border-primary/40 bg-primary/4 shadow-sm"
          : "border-border/60 bg-card hover:border-border"
      )}
    >
      <button
        onClick={onToggle}
        className="w-full flex items-start justify-between gap-4 px-5 py-5 text-left group focus:outline-none"
        aria-expanded={isOpen}
      >
        <div className="flex items-start gap-3 flex-1 min-w-0">
          <span className={cn(
            "shrink-0 mt-0.5 text-[11px] font-bold w-5 h-5 rounded-full flex items-center justify-center border transition-all duration-200",
            isOpen
              ? "bg-primary border-primary text-primary-foreground"
              : "border-border/60 text-muted-foreground bg-muted/50"
          )}>
            {index + 1}
          </span>
          <span className={cn(
            "text-base sm:text-[17px] font-semibold leading-snug transition-colors duration-200",
            isOpen ? "text-primary" : "text-foreground group-hover:text-primary"
          )}>
            {q}
          </span>
        </div>
        <span className={cn(
          "shrink-0 mt-0.5 w-6 h-6 rounded-full flex items-center justify-center transition-all duration-200",
          isOpen
            ? "bg-primary text-primary-foreground rotate-180"
            : "bg-muted text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary"
        )}>
          <Plus className={cn("h-3.5 w-3.5 transition-transform duration-300", isOpen && "rotate-45")} />
        </span>
      </button>

      <div
        className={cn(
          "overflow-hidden transition-all duration-300 ease-in-out",
          isOpen ? "max-h-[500px] opacity-100" : "max-h-0 opacity-0"
        )}
      >
        <div className="px-5 pb-5 pl-[3.25rem]">
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
    <section id="faq" className="relative py-16 sm:py-24 bg-muted/20">
      <div className="max-w-7xl mx-auto px-4 sm:px-8">
        <div className="mb-10 space-y-1">
          <p className="text-primary text-xs font-semibold uppercase tracking-[0.2em]">07 — Questions</p>
          <h2 className="text-3xl sm:text-4xl font-bold text-foreground">Common Questions</h2>
          <p className="text-muted-foreground text-sm">Everything buyers typically want to know before moving forward.</p>
        </div>

        <div className="space-y-2.5">
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

