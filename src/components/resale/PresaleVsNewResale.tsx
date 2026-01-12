import { Check, X, Clock, Home, DollarSign, AlertTriangle } from "lucide-react";

const comparisonData = [
  {
    category: "Move-In Timeline",
    presale: "1-3 years from purchase",
    newResale: "Immediate possession",
    icon: Clock
  },
  {
    category: "Construction Risk",
    presale: "Delays possible",
    newResale: "Already completed",
    icon: AlertTriangle
  },
  {
    category: "See Before Buying",
    presale: "Renderings & floor plans only",
    newResale: "Walk through the actual unit",
    icon: Home
  },
  {
    category: "Financing",
    presale: "Mortgage not needed until completion",
    newResale: "Standard mortgage process",
    icon: DollarSign
  },
  {
    category: "Price Lock",
    presale: "Lock today's price for future",
    newResale: "Current market price",
    icon: DollarSign
  },
  {
    category: "Warranty",
    presale: "Full new home warranty",
    newResale: "Full new home warranty",
    icon: Check
  }
];

export function PresaleVsNewResale() {
  return (
    <section className="py-12 md:py-20 bg-muted/30">
      <div className="container px-4">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8 md:mb-12">
            <span className="text-xs font-semibold uppercase tracking-widest text-primary mb-2 block">
              Know The Difference
            </span>
            <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-foreground mb-3">
              Presale vs. Move-In Ready
            </h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              Both are new construction — but with key differences in timeline and risk.
            </p>
          </div>

          {/* Comparison Table */}
          <div className="bg-background rounded-2xl border border-border overflow-hidden shadow-sm">
            {/* Header */}
            <div className="grid grid-cols-3 bg-muted/50 border-b border-border">
              <div className="p-4 md:p-5 font-medium text-foreground text-sm md:text-base">
                Feature
              </div>
              <div className="p-4 md:p-5 font-medium text-foreground text-sm md:text-base text-center border-l border-border">
                Presale
              </div>
              <div className="p-4 md:p-5 font-medium text-primary text-sm md:text-base text-center border-l border-border bg-primary/5">
                Move-In Ready
              </div>
            </div>

            {/* Rows */}
            {comparisonData.map((row, index) => (
              <div 
                key={index}
                className={`grid grid-cols-3 ${index !== comparisonData.length - 1 ? 'border-b border-border' : ''}`}
              >
                <div className="p-4 md:p-5 flex items-center gap-2 text-sm text-foreground">
                  <row.icon className="h-4 w-4 text-muted-foreground flex-shrink-0 hidden sm:block" />
                  <span>{row.category}</span>
                </div>
                <div className="p-4 md:p-5 text-sm text-muted-foreground text-center border-l border-border">
                  {row.presale}
                </div>
                <div className="p-4 md:p-5 text-sm text-foreground text-center border-l border-border bg-primary/5 font-medium">
                  {row.newResale}
                </div>
              </div>
            ))}
          </div>

          {/* Summary */}
          <div className="mt-6 md:mt-8 text-center">
            <p className="text-sm text-muted-foreground max-w-2xl mx-auto">
              <strong className="text-foreground">Bottom line:</strong> If you need a home now and want brand-new construction with full warranty protection, move-in ready homes are your best option.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
