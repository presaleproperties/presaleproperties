import { Check, Home, TrendingUp } from "lucide-react";

const firstTimeBuyerPoints = [
  "We explain the presale process in plain language — no jargon, no rushing",
  "We match you to projects that fit your real budget, not just your max",
  "We negotiate deposit structures, credits, and incentives on your behalf",
  "We review every contract clause before you sign anything",
  "We stay with you from first call all the way to key pickup",
];

const investorPoints = [
  "We find projects with strong rental demand and builder track records",
  "We run the real numbers — rent, costs, yield — before you commit",
  "We secure assignment rights and investor-friendly contract terms",
  "We connect you with leasing and property management when you're ready",
  "We help you plan your next purchase around cash flow, not guesswork",
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
                Your path.{" "}
                <br className="hidden sm:block" />
                <span className="text-primary">Your pace.</span>
              </h2>
            </div>
            <p className="text-[15px] text-muted-foreground leading-relaxed">
              Whether you're buying your first home or adding to a growing portfolio — we adapt to you. No pressure, no template, no wasted time.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <BuyerCard
              icon={Home}
              title="First-Time Buyers"
              subtitle="You don't need to know how presale works. That's our job. We'll guide you through every step so you buy with confidence — not anxiety."
              points={firstTimeBuyerPoints}
            />
            <BuyerCard
              icon={TrendingUp}
              title="Investors"
              subtitle="Good investment decisions start with good data. We bring the numbers, the market knowledge, and the contracts that protect your upside."
              points={investorPoints}
              dark
            />
          </div>

        </div>
      </div>
    </section>
  );
}
