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
              Start Your Presale Journey
            </h2>
            <p className="text-lg md:text-xl text-background/80 mb-8 max-w-2xl mx-auto">
              Whether you're buying your first home or your next investment, having a specialist team on your side changes your outcome.
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
                  Browse Presale Projects
                  <ArrowRight className="h-5 w-5" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
