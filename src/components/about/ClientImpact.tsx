import { Home, BadgeDollarSign, Star, TrendingUp } from "lucide-react";

const impactStats = [
  {
    icon: Home,
    stat: "400+",
    label: "Families Helped",
    desc: "Real buyers, real homes, real outcomes",
    accent: false,
  },
  {
    icon: BadgeDollarSign,
    stat: "$200M+",
    label: "In Transactions",
    desc: "Managed on behalf of our clients",
    accent: true,
  },
  {
    icon: Star,
    stat: "5.0★",
    label: "Google Rating",
    desc: "Every review is earned, not asked for",
    accent: false,
  },
  {
    icon: TrendingUp,
    stat: "5-Figure",
    label: "Avg. Savings",
    desc: "Incentives negotiated per client",
    accent: false,
  },
];

export function ClientImpact() {
  return (
    <section className="py-20 md:py-28 bg-muted/30">
      <div className="container px-4 sm:px-6">
        <div className="max-w-5xl mx-auto">

          <div className="grid lg:grid-cols-[1fr_2.5fr] gap-12 lg:gap-16 items-center mb-14">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-[0.28em] text-primary block mb-4">
                Real Results
              </span>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-foreground leading-[1.05] tracking-tight">
                The proof is in<br />
                <span className="text-primary">our clients' outcomes.</span>
              </h2>
            </div>
            <p className="text-[15px] text-muted-foreground leading-relaxed max-w-xl">
              These aren't vanity metrics. Every number represents a buyer who got better guidance, better terms, and a smoother experience than they would have had going it alone.
            </p>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            {impactStats.map((item) => (
              <div
                key={item.label}
                className={`relative group rounded-2xl p-4 sm:p-6 lg:p-7 border transition-all duration-300 overflow-hidden ${
                  item.accent
                    ? "bg-foreground border-foreground"
                    : "bg-card border-border hover:border-primary/30 hover:shadow-lg"
                }`}
              >
                {!item.accent && (
                  <div className="absolute inset-0 bg-primary/3 opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl" />
                )}

                <div className="relative">
                  <div className={`w-9 h-9 sm:w-11 sm:h-11 rounded-xl flex items-center justify-center mb-4 sm:mb-5 ${
                    item.accent ? "bg-primary/20" : "bg-primary/10 group-hover:bg-primary/15 transition-colors"
                  }`}>
                    <item.icon className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                  </div>
                  <div className="text-2xl sm:text-3xl lg:text-4xl font-black mb-1.5 text-primary">
                    {item.stat}
                  </div>
                  <div className={`text-[12px] sm:text-[13px] font-bold mb-1 ${item.accent ? "text-background" : "text-foreground"}`}>
                    {item.label}
                  </div>
                  <div className={`text-[11px] sm:text-[12px] leading-snug ${item.accent ? "text-background/50" : "text-muted-foreground"}`}>
                    {item.desc}
                  </div>
                </div>
              </div>
            ))}
          </div>

        </div>
      </div>
    </section>
  );
}
