import { Link } from "react-router-dom";
import { Calculator, TrendingUp, DollarSign, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export function ROICalculatorTeaser() {
  return (
    <section className="py-16 bg-gradient-to-br from-primary/5 via-background to-primary/5">
      <div className="container">
        <div className="max-w-4xl mx-auto">
          <div className="grid md:grid-cols-2 gap-8 items-center">
            {/* Left side - Content */}
            <div className="space-y-6">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium">
                <Calculator className="h-4 w-4" />
                Investment Tool
              </div>
              <h2 className="text-3xl md:text-4xl">
                Calculate Your Presale ROI
              </h2>
              <p className="text-muted-foreground text-lg">
                Estimate your potential returns with our free presale investment calculator. 
                Compare mortgage vs cash scenarios, see 5-year projections, and download a professional PDF report.
              </p>
              <div className="flex flex-wrap gap-4">
                <Link to="/roi-calculator">
                  <Button size="lg" className="gap-2">
                    Open Calculator
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
              </div>
            </div>

            {/* Right side - Feature highlights */}
            <div className="grid grid-cols-2 gap-4">
              <div className="p-5 rounded-xl bg-card border shadow-sm">
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center mb-3">
                  <TrendingUp className="h-5 w-5 text-primary" />
                </div>
                <h3 className="font-semibold mb-1">5-Year Projections</h3>
                <p className="text-sm text-muted-foreground">See your investment grow over time</p>
              </div>
              <div className="p-5 rounded-xl bg-card border shadow-sm">
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center mb-3">
                  <DollarSign className="h-5 w-5 text-primary" />
                </div>
                <h3 className="font-semibold mb-1">Cash vs Mortgage</h3>
                <p className="text-sm text-muted-foreground">Compare financing scenarios</p>
              </div>
              <div className="p-5 rounded-xl bg-card border shadow-sm">
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center mb-3">
                  <Calculator className="h-5 w-5 text-primary" />
                </div>
                <h3 className="font-semibold mb-1">Deposit Timeline</h3>
                <p className="text-sm text-muted-foreground">Plan your payment schedule</p>
              </div>
              <div className="p-5 rounded-xl bg-card border shadow-sm">
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center mb-3">
                  <ArrowRight className="h-5 w-5 text-primary" />
                </div>
                <h3 className="font-semibold mb-1">PDF Report</h3>
                <p className="text-sm text-muted-foreground">Download your analysis</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
