import { Home, BadgeDollarSign, Star, TrendingUp } from "lucide-react";

const impactStats = [
  { icon: Home, stat: "400+", label: "Homes Sold", desc: "Across Metro Vancouver & Fraser Valley" },
  { icon: BadgeDollarSign, stat: "$200M+", label: "In Transactions", desc: "Successfully closed for our clients" },
  { icon: Star, stat: "5.0★", label: "Google Rating", desc: "Consistently 5-star service" },
  { icon: TrendingUp, stat: "5-Figure", label: "Incentives Negotiated", desc: "Savings secured per client on average" },
];

export function ClientImpact() {
  return (
    <section className="py-20 md:py-28 bg-muted/30">
      <div className="container px-4 sm:px-6">
        <div className="max-w-5xl mx-auto">

          <div className="text-center mb-14">
            <span className="text-xs font-bold uppercase tracking-[0.25em] text-primary block mb-4">Our Track Record</span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-foreground leading-tight">
              Results That <span className="text-primary">Speak for Themselves</span>
            </h2>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
            {impactStats.map((item, i) => (
              <div
                key={item.label}
                className="relative rounded-2xl bg-card border border-border p-6 text-center group hover:border-primary/30 hover:shadow-lg transition-all duration-300 overflow-hidden"
              >
                {/* Subtle gold glow on hover */}
                <div className="absolute inset-0 bg-primary/3 opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl" />
                <div className="relative">
                  <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4 group-hover:bg-primary/15 transition-colors">
                    <item.icon className="h-5 w-5 text-primary" />
                  </div>
                  <div className="text-3xl md:text-4xl font-black text-primary mb-1">{item.stat}</div>
                  <div className="text-sm font-bold text-foreground mb-1">{item.label}</div>
                  <div className="text-[11px] text-muted-foreground leading-snug">{item.desc}</div>
                </div>
              </div>
            ))}
          </div>

        </div>
      </div>
    </section>
  );
}
