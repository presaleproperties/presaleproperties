import { Home, BadgeDollarSign, Star, MessageSquare } from "lucide-react";

const impactStats = [
  {
    icon: Home,
    stat: "400+",
    label: "Homes Sold",
  },
  {
    icon: BadgeDollarSign,
    stat: "$200M+",
    label: "In Presale Transactions",
  },
  {
    icon: Star,
    stat: "31+",
    label: "Five-Star Google Reviews",
  },
  {
    icon: MessageSquare,
    stat: "5-Figure",
    label: "Incentives Negotiated",
  },
];

export function ClientImpact() {
  return (
    <section className="py-16 md:py-24">
      <div className="container px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Results & Reviews
          </h2>
          <div className="w-20 h-1 bg-primary mx-auto mb-6 rounded-full" />
          <p className="text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto">
            Clients highlight clear communication, no pressure, and honest advice — especially for their first purchase or first investment.
          </p>
        </div>
        
        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
          {impactStats.map((item) => (
            <div
              key={item.label}
              className="bg-card rounded-xl p-4 sm:p-6 border shadow-sm text-center"
            >
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3 sm:mb-4">
                <item.icon className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
              </div>
              <p className="text-xl sm:text-2xl md:text-3xl font-bold text-foreground mb-1">{item.stat}</p>
              <p className="text-xs sm:text-sm text-muted-foreground">{item.label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
