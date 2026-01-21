import { Check, X } from "lucide-react";

const comparisons = [
  { without: "Public inventory only", with: "Exclusive off-market access" },
  { without: "Higher public pricing", with: "VIP pricing (save $10K-$25K)" },
  { without: "No expert guidance", with: "White-glove service" },
  { without: "Pay $1,500 in legal fees", with: "$1,500 credit" },
  { without: "Hope for the best", with: "Protected at every step" },
  { without: "Rushed decisions", with: "Strategic timing" },
  { without: "Transaction-focused", with: "Wealth-building focused" },
];

export const VIPComparison = () => {
  return (
    <section className="py-20 md:py-28 px-4 bg-muted/30">
      <div className="max-w-[1200px] mx-auto">
        <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground text-center mb-16">
          Why VIP Elite Members Get Better Results
        </h2>

        <div className="grid md:grid-cols-2 gap-6 md:gap-8">
          {/* Without VIP Elite */}
          <div className="bg-card rounded-2xl p-6 md:p-8 border-2 border-border">
            <div className="text-center mb-8">
              <h3 className="text-xl md:text-2xl font-bold text-foreground mb-2">WITHOUT VIP ELITE</h3>
              <p className="text-sm text-muted-foreground">(Going Solo or Regular Agent)</p>
            </div>
            <ul className="space-y-4 mb-8">
              {comparisons.map((item, index) => (
                <li key={index} className="flex items-center gap-3 text-muted-foreground">
                  <X className="w-5 h-5 text-destructive flex-shrink-0" />
                  <span>{item.without}</span>
                </li>
              ))}
            </ul>
            <div className="bg-muted/50 rounded-xl p-4 text-center">
              <p className="font-bold text-foreground mb-1">RESULT:</p>
              <p className="text-sm text-muted-foreground">Risk overpaying, limited selection, on your own</p>
            </div>
          </div>

          {/* With VIP Elite */}
          <div className="bg-card rounded-2xl p-6 md:p-8 border-2 border-primary shadow-gold">
            <div className="text-center mb-8">
              <h3 className="text-xl md:text-2xl font-bold text-foreground mb-2">WITH VIP ELITE</h3>
              <p className="text-sm text-muted-foreground">(Working With Us)</p>
            </div>
            <ul className="space-y-4 mb-8">
              {comparisons.map((item, index) => (
                <li key={index} className="flex items-center gap-3 text-foreground">
                  <Check className="w-5 h-5 text-success flex-shrink-0" />
                  <span className="font-medium">{item.with}</span>
                </li>
              ))}
            </ul>
            <div className="bg-primary rounded-xl p-4 text-center">
              <p className="font-bold text-primary-foreground mb-1">RESULT:</p>
              <p className="text-sm text-primary-foreground/90">Best units, best pricing, expert protection</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
