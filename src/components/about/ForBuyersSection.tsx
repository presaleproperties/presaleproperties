import { Check, Home, TrendingUp } from "lucide-react";

const firstTimeBuyerPoints = [
  "Explain presale vs resale in simple, practical terms",
  "Shortlist projects that match your budget, lifestyle, and timing",
  "Negotiate deposit structures, credits, and incentives where possible",
  "Review contracts and disclosures so you know exactly what you're signing",
  "Support you through financing, completion, walkthroughs, and deficiencies",
];

const investorPoints = [
  "Identify projects with strong rental demand and reputable builders",
  "Run numbers on rents, costs, and projected values",
  "Secure assignment rights and investor-friendly terms",
  "Connect you with leasing and property management support",
  "Plan future purchases around cash flow and completion timelines",
];

interface BuyerCardProps {
  icon: React.ElementType;
  title: string;
  subtitle: string;
  points: string[];
  accent?: boolean;
}

function BuyerCard({ icon: Icon, title, subtitle, points, accent }: BuyerCardProps) {
  return (
    <div className={`rounded-2xl p-8 md:p-10 border transition-all duration-300 hover:shadow-lg ${
      accent
        ? "bg-foreground border-foreground text-background"
        : "bg-card border-border"
    }`}>
      <div className={`p-3 rounded-xl w-fit mb-6 ${accent ? "bg-primary/20" : "bg-primary/10"}`}>
        <Icon className="h-6 w-6 text-primary" />
      </div>
      <h3 className={`text-2xl font-extrabold mb-2 ${accent ? "text-background" : "text-foreground"}`}>{title}</h3>
      <p className={`text-sm mb-7 ${accent ? "text-background/60" : "text-muted-foreground"}`}>{subtitle}</p>
      <ul className="space-y-3.5">
        {points.map((point, i) => (
          <li key={i} className="flex items-start gap-3">
            <div className={`mt-0.5 h-5 w-5 rounded-full flex items-center justify-center flex-shrink-0 ${
              accent ? "bg-primary/20 border border-primary/40" : "bg-primary/10"
            }`}>
              <Check className="h-3 w-3 text-primary" />
            </div>
            <span className={`text-sm leading-relaxed ${accent ? "text-background/70" : "text-muted-foreground"}`}>{point}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function ForBuyersSection() {
  return (
    <section className="py-20 md:py-28 bg-background">
      <div className="container px-4 sm:px-6">
        <div className="max-w-5xl mx-auto">

          <div className="text-center mb-14">
            <span className="text-xs font-bold uppercase tracking-[0.25em] text-primary block mb-4">Who We Help</span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-foreground leading-tight">
              Guidance for Every <span className="text-primary">Buyer</span>
            </h2>
          </div>

          <div className="grid md:grid-cols-2 gap-6 md:gap-8">
            <BuyerCard
              icon={Home}
              title="First-Time Buyers"
              subtitle="We turn a confusing presale process into a clear, guided plan."
              points={firstTimeBuyerPoints}
            />
            <BuyerCard
              icon={TrendingUp}
              title="Investors"
              subtitle="We help you use presales to grow a stronger, safer portfolio."
              points={investorPoints}
              accent
            />
          </div>

        </div>
      </div>
    </section>
  );
}
