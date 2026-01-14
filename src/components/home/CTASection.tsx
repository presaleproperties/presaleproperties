import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export function CTASection() {
  return (
    <section className="py-20 md:py-28 bg-foreground text-background relative overflow-hidden">
      {/* Decorative elements */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-primary/5 via-transparent to-transparent" />
      
      <div className="container px-4 relative">
        <div className="max-w-3xl mx-auto text-center space-y-8">
          <div className="space-y-4">
            <span className="text-xs font-semibold uppercase tracking-widest text-primary">
              For Real Estate Professionals
            </span>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight">
              Ready to List Your Assignments?
            </h2>
            <p className="text-lg sm:text-xl text-background/70 max-w-2xl mx-auto">
              Join Vancouver's fastest-growing presale marketplace. Reach qualified buyers and grow your business.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
            <Link to="/presale-projects">
              <Button
                size="lg"
                className="w-full sm:w-auto text-base px-8"
              >
                Browse Projects
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Link to="/presale-guide">
              <Button
                size="lg"
                variant="outline"
                className="w-full sm:w-auto text-base px-8 border-background/30 text-background hover:bg-background hover:text-foreground"
              >
                Learn How It Works
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}