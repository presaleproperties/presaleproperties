import { Home, BadgeDollarSign, Star, TrendingUp, Calculator, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

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
    <section className="py-16 md:py-24">
      <div className="container px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Results & Reviews
          </h2>
          <div className="w-20 h-1 bg-primary mx-auto mb-6 rounded-full" />
          <p className="text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto">
            Clients highlight clear communication, no pressure, and honest advice — especially for their first purchase or investment.
          </p>
        </div>
        
        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-12">
          {impactStats.map((item) => (
            <div
              key={item.label}
              className="bg-card rounded-xl p-4 sm:p-6 border shadow-sm text-center"
            >
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3 sm:mb-4">
                <item.icon className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
              </div>
              <p className="text-2xl sm:text-3xl md:text-4xl font-bold text-primary mb-1">{item.stat}</p>
              <p className="text-xs sm:text-sm text-muted-foreground font-medium">{item.label}</p>
            </div>
          ))}
        </div>

        {/* Calculator Resource */}
        <div className="bg-gradient-to-br from-muted/50 to-muted/20 rounded-2xl p-6 sm:p-8 border">
          <div className="flex flex-col md:flex-row items-center gap-6">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
              <Calculator className="h-8 w-8 text-primary" />
            </div>
            <div className="flex-1 text-center md:text-left">
              <h3 className="text-lg sm:text-xl font-semibold text-foreground mb-2">
                Free Investment Calculator
              </h3>
              <p className="text-sm sm:text-base text-muted-foreground">
                Run the numbers on any property with our BC-specific calculator — includes GST, PTT, closing costs, and rental ROI projections.
              </p>
            </div>
            <Button size="lg" className="gap-2 text-sm sm:text-base px-5 sm:px-6 py-3 h-auto" asChild>
              <Link to="/calculators">
                <span>Try Calculator</span>
                <ArrowRight className="h-4 w-4 flex-shrink-0" />
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
