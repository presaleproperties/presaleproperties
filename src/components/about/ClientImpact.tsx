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
    <section className="py-12 sm:py-16 md:py-24">
      <div className="container px-4">
        <div className="text-left md:text-center mb-8 sm:mb-12">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-foreground mb-3 sm:mb-4">
            Results & Reviews
          </h2>
          <div className="w-16 sm:w-20 h-1 bg-primary md:mx-auto mb-4 sm:mb-6 rounded-full" />
          <p className="text-sm sm:text-base md:text-lg text-muted-foreground max-w-2xl md:mx-auto">
            Clients highlight clear communication, no pressure, and honest advice — especially for their first purchase or investment.
          </p>
        </div>
        
        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6 mb-8 sm:mb-12">
          {impactStats.map((item) => (
            <div
              key={item.label}
              className="bg-card rounded-lg sm:rounded-xl p-3 sm:p-4 md:p-6 border shadow-sm text-left sm:text-center"
            >
              <div className="w-9 h-9 sm:w-10 sm:h-10 md:w-12 md:h-12 rounded-full bg-primary/10 flex items-center justify-center sm:mx-auto mb-2 sm:mb-3 md:mb-4">
                <item.icon className="h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6 text-primary" />
              </div>
              <p className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold text-primary mb-0.5 sm:mb-1">{item.stat}</p>
              <p className="text-[10px] sm:text-xs md:text-sm text-muted-foreground font-medium">{item.label}</p>
            </div>
          ))}
        </div>

        {/* Calculator Resource */}
        <div className="bg-gradient-to-br from-muted/50 to-muted/20 rounded-xl sm:rounded-2xl p-4 sm:p-6 md:p-8 border">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-6">
            <div className="w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
              <Calculator className="h-6 w-6 sm:h-7 sm:w-7 md:h-8 md:w-8 text-primary" />
            </div>
            <div className="flex-1 text-left">
              <h3 className="text-base sm:text-lg md:text-xl font-semibold text-foreground mb-1 sm:mb-2">
                Free Investment Calculator
              </h3>
              <p className="text-xs sm:text-sm md:text-base text-muted-foreground">
                Run the numbers on any property with our BC-specific calculator — includes GST, PTT, closing costs, and rental ROI projections.
              </p>
            </div>
            <Button size="lg" className="gap-2 text-sm sm:text-base px-5 sm:px-6 py-2.5 sm:py-3 h-auto w-full sm:w-auto" asChild>
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
