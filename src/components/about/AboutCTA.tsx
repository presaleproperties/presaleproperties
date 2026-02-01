import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Calendar, ArrowRight } from "lucide-react";

export function AboutCTA() {
  return (
    <section className="py-16 md:py-24">
      <div className="container px-4">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-foreground to-foreground/90 text-background">
          {/* Decorative elements */}
          <div className="absolute top-0 right-0 w-96 h-96 bg-primary/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-primary/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />
          
          <div className="relative px-8 py-16 md:px-16 md:py-20 text-center">
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4">
              Your Journey Starts With the Right Team
            </h2>
            <p className="text-lg md:text-xl text-background/80 mb-8 max-w-2xl mx-auto">
              Let us help you find your next home or investment — fully protected, fully guided, fully free.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                size="xl"
                className="bg-primary text-primary-foreground hover:bg-primary/90 gap-2"
                asChild
              >
                <Link to="/contact">
                  <Calendar className="h-5 w-5" />
                  Book a Free Consultation
                </Link>
              </Button>
              <Button
                size="xl"
                variant="outline"
                className="border-background/30 text-background hover:bg-background/10 gap-2"
                asChild
              >
                <Link to="/presale-projects">
                  Browse Projects
                  <ArrowRight className="h-5 w-5" />
                </Link>
              </Button>
            </div>
            
            {/* Trust badges */}
            <div className="mt-12 pt-8 border-t border-background/20">
              <p className="text-sm text-background/60 mb-4">Trusted by hundreds of families across Metro Vancouver</p>
              <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6 text-background/80">
                <span className="text-xs sm:text-sm">✓ New Construction Specialists</span>
                <span className="text-xs sm:text-sm">✓ Developer Pays Our Fee</span>
                <span className="text-xs sm:text-sm">✓ Multilingual Support</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
