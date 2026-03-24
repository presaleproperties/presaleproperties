import { Check, Home, TrendingUp } from "lucide-react";

const firstTimeBuyerPoints = [
  "Explain presale vs resale in simple, practical terms",
  "Shortlist projects matching your budget, lifestyle & timeline",
  "Negotiate deposit structures, credits, and incentives",
  "Review contracts and disclosures — nothing hidden",
  "Support you through financing, walkthroughs, and deficiencies",
];

const investorPoints = [
  "Identify projects with strong rental demand & reputable builders",
  "Run full numbers on rents, costs, and projected values",
  "Secure assignment rights and investor-friendly contract terms",
  "Connect you with leasing and property management support",
  "Plan future purchases around cash flow and completion timelines",
];

interface BuyerCardProps {
  icon: React.ElementType;
  title: string;
  subtitle: string;
  points: string[];
  dark?: boolean;
}

function BuyerCard({ icon: Icon, title, subtitle, points, dark }: BuyerCardProps) {
  return (
    <div
      className={`rounded-3xl p-8 md:p-10 border h-full flex flex-col transition-all duration-300 ${
        dark
          ? "bg-foreground border-foreground text-background"
          : "bg-card border-border hover:border-primary/30 hover:shadow-xl"
      }`}
    >
      <div className={`p-3 rounded-2xl w-fit mb-6 ${dark ? "bg-primary/20" : "bg-primary/10"}`}>
        <Icon className="h-6 w-6 text-primary" />
      </div>

      <h3 className={`text-2xl font-extrabold mb-2 tracking-tight ${dark ? "text-background" : "text-foreground"}`}>
        {title}
      </h3>
      <p className={`text-[14px] mb-8 leading-relaxed ${dark ? "text-background/55" : "text-muted-foreground"}`}>
        {subtitle}
      </p>

      <ul className="space-y-4 flex-1">
        {points.map((point, i) => (
          <li key={i} className="flex items-start gap-3.5">
            <div
              className={`mt-0.5 h-5 w-5 rounded-full flex items-center justify-center flex-shrink-0 ${
                dark ? "bg-primary/25 border border-primary/40" : "bg-primary/10"
              }`}
            >
              <Check className="h-3 w-3 text-primary" />
            </div>
            <span
              className={`text-[14px] leading-relaxed ${
                dark ? "text-background/65" : "text-muted-foreground"
              }`}
            >
              {point}
            </span>
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

          <div className="flex flex-col lg:grid lg:grid-cols-[1fr_2fr] gap-6 lg:gap-16 lg:items-end mb-10 md:mb-14">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-[0.28em] text-primary block mb-5">
                Who We Help
              </span>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-foreground leading-[1.05] tracking-tight">
                Guidance for Every{" "}
                <span className="text-primary">Buyer</span>
              </h2>
            </div>
            <p className="text-[15px] text-muted-foreground leading-relaxed">
              Whether you're buying your first home or scaling an investment portfolio, our approach is tailored — not templated.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <BuyerCard
              icon={Home}
              title="First-Time Buyers"
              subtitle="We turn a confusing presale process into a clear, step-by-step plan — no intimidation, no rushing."
              points={firstTimeBuyerPoints}
            />
            <BuyerCard
              icon={TrendingUp}
              title="Investors"
              subtitle="We help you use presales to build a stronger, smarter portfolio with real numbers behind every decision."
              points={investorPoints}
              dark
            />
          </div>

        </div>
      </div>
    </section>
  );
}
