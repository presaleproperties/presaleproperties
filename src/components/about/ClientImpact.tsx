import { Home, BadgeDollarSign, Star, TrendingUp } from "lucide-react";

const impactStats = [
  {
    icon: Home,
    stat: "400+",
    label: "Homes Sold",
  },
  {
    icon: BadgeDollarSign,
    stat: "$200M+",
    label: "In Transactions",
  },
  {
    icon: Star,
    stat: "5.0",
    label: "Google Rating",
  },
  {
    icon: TrendingUp,
    stat: "5-Figure",
    label: "Incentives Negotiated",
  },
];

export function ClientImpact() {
  return (
    <section className="py-12 sm:py-16 md:py-24">
      <div className="container px-4">
        <div className="text-center mb-8 sm:mb-12">
          <p className="text-xs sm:text-sm font-semibold text-primary tracking-widest uppercase mb-2 sm:mb-3">
            Show Me Proof
          </p>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-foreground mb-3 sm:mb-4">
            Results That Speak for Themselves
          </h2>
          <div className="w-16 sm:w-20 h-1 bg-primary mx-auto mb-4 sm:mb-6 rounded-full" />
          <p className="text-sm sm:text-base md:text-lg text-muted-foreground max-w-2xl mx-auto">
            Clients highlight clear communication, no pressure, and honest advice — especially for their first purchase or investment.
          </p>
        </div>
        
        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6 mb-8 sm:mb-12">
          {impactStats.map((item) => (
            <div
              key={item.label}
              className="bg-card rounded-lg sm:rounded-xl p-3 sm:p-4 md:p-6 border shadow-sm text-center"
            >
              <div className="w-9 h-9 sm:w-10 sm:h-10 md:w-12 md:h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-2 sm:mb-3 md:mb-4">
                <item.icon className="h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6 text-primary" />
              </div>
              <p className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold text-primary mb-0.5 sm:mb-1">{item.stat}</p>
              <p className="text-[10px] sm:text-xs md:text-sm text-muted-foreground font-medium">{item.label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
