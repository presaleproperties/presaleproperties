import { Check, Home, TrendingUp } from "lucide-react";

const firstTimeBuyerPoints = [
  { text: "Explain presale vs resale", highlight: "in simple, practical terms" },
  { text: "Shortlist projects", highlight: "that match your budget, lifestyle, and timing" },
  { text: "Negotiate", highlight: "deposit structures, credits, and incentives" },
  { text: "Review contracts and disclosures", highlight: "so you know exactly what you're signing" },
  { text: "Support through", highlight: "financing, completion, walkthroughs, and deficiencies" },
];

const investorPoints = [
  { text: "Identify projects with", highlight: "strong rental demand and reputable builders" },
  { text: "Run numbers", highlight: "on rents, costs, and projected values" },
  { text: "Secure", highlight: "assignment rights and investor-friendly terms" },
  { text: "Connect you with", highlight: "leasing and property management support" },
  { text: "Plan purchases around", highlight: "cash flow and completion timelines" },
];

export function ForBuyersSection() {
  return (
    <section className="py-16 md:py-24 bg-muted/30">
      <div className="container px-4">
        <div className="grid md:grid-cols-2 gap-8 md:gap-12">
          {/* First-Time Buyers */}
          <div className="bg-card rounded-2xl p-6 sm:p-8 border shadow-sm">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
              <Home className="h-6 w-6 text-primary" />
            </div>
            <h3 className="text-xl sm:text-2xl font-bold text-foreground mb-2">
              For First-Time Buyers
            </h3>
            <p className="text-muted-foreground mb-6">
              We turn a <strong className="text-foreground">confusing presale process</strong> into a <strong className="text-foreground">clear, guided plan</strong>.
            </p>
            <ul className="space-y-3">
              {firstTimeBuyerPoints.map((point, index) => (
                <li key={index} className="flex items-start gap-3">
                  <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Check className="h-3 w-3 text-primary" />
                  </div>
                  <span className="text-sm text-muted-foreground">
                    {point.text} <strong className="text-foreground">{point.highlight}</strong>
                  </span>
                </li>
              ))}
            </ul>
          </div>
          
          {/* Investors */}
          <div className="bg-card rounded-2xl p-6 sm:p-8 border shadow-sm">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
              <TrendingUp className="h-6 w-6 text-primary" />
            </div>
            <h3 className="text-xl sm:text-2xl font-bold text-foreground mb-2">
              For Investors
            </h3>
            <p className="text-muted-foreground mb-6">
              We help you use presales to grow a <strong className="text-foreground">stronger, safer portfolio</strong>.
            </p>
            <ul className="space-y-3">
              {investorPoints.map((point, index) => (
                <li key={index} className="flex items-start gap-3">
                  <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Check className="h-3 w-3 text-primary" />
                  </div>
                  <span className="text-sm text-muted-foreground">
                    {point.text} <strong className="text-foreground">{point.highlight}</strong>
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
