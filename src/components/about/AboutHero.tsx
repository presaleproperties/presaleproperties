import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Calendar, Star, ArrowRight } from "lucide-react";
import aboutHeroImage from "@/assets/about-hero-team.jpg";
import { AboutContactForm } from "./AboutContactForm";

export function AboutHero() {
  const [formOpen, setFormOpen] = useState(false);

  return (
    <section className="relative py-10 sm:py-14 md:py-20 lg:py-28 overflow-hidden">
      {/* Premium multi-layer gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-foreground via-foreground/95 to-foreground/90" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-primary/20 via-transparent to-transparent" />
      <div className="absolute bottom-0 left-0 w-full h-1/2 bg-gradient-to-t from-primary/5 to-transparent" />
      
      {/* Decorative glow */}
      <div className="absolute top-1/4 right-0 w-[300px] sm:w-[400px] lg:w-[500px] h-[300px] sm:h-[400px] lg:h-[500px] bg-primary/15 rounded-full blur-[80px] sm:blur-[100px] lg:blur-[120px] -translate-y-1/2 translate-x-1/4" />
      <div className="absolute bottom-0 left-1/4 w-[200px] sm:w-[250px] lg:w-[300px] h-[200px] sm:h-[250px] lg:h-[300px] bg-primary/10 rounded-full blur-[60px] sm:blur-[70px] lg:blur-[80px]" />
      
      <div className="container relative px-4 sm:px-6">
        <div className="grid lg:grid-cols-2 gap-8 lg:gap-16 items-center">
          {/* Content */}
          <div className="text-center lg:text-left order-2 lg:order-1">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/20 border border-primary/30 mb-5 sm:mb-6 lg:mb-8">
              <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
              <span className="text-[11px] sm:text-xs font-semibold text-primary tracking-wide uppercase">
                Metro Vancouver & Fraser Valley
              </span>
            </div>
            
            {/* Headline - Optimized for mobile/tablet readability */}
            <h1 className="text-[1.75rem] leading-[1.15] sm:text-4xl md:text-[2.75rem] lg:text-5xl xl:text-6xl font-bold tracking-tight text-background mb-4 sm:mb-5 lg:mb-6">
              <span className="block">New Construction.</span>
              <span className="block text-primary mt-1 sm:mt-2">Expert Help.</span>
              <span className="block mt-1 sm:mt-2">No Extra Cost.</span>
            </h1>
            
            {/* Subheader - Better mobile sizing */}
            <p className="text-[15px] leading-relaxed sm:text-base md:text-lg text-background/70 mb-6 sm:mb-7 lg:mb-8 max-w-md sm:max-w-lg mx-auto lg:mx-0">
              A specialized team guiding first-time buyers and investors through condos, townhomes, duplexes, and single-family homes — from project selection to move‑in or assignment.
            </p>
            
            {/* CTA Buttons - Better mobile stack */}
            <div className="flex flex-col sm:flex-row gap-3 justify-center lg:justify-start max-w-sm sm:max-w-none mx-auto lg:mx-0">
              <Button 
                size="lg" 
                className="gap-2 shadow-xl shadow-primary/30 text-sm sm:text-base px-5 py-3 h-12 sm:h-auto w-full sm:w-auto" 
                onClick={() => setFormOpen(true)}
              >
                <Calendar className="h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0" />
                <span>Book Free Consultation</span>
              </Button>
              <Button 
                size="lg" 
                variant="outline" 
                className="gap-2 border-2 border-background/40 bg-background/5 text-background hover:bg-background/10 text-sm sm:text-base px-5 py-3 h-12 sm:h-auto w-full sm:w-auto"
                asChild
              >
                <Link to="/presale-projects">
                  <span>Browse Projects</span>
                  <ArrowRight className="h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0" />
                </Link>
              </Button>
            </div>
            
            {/* Trust indicators - Compact mobile layout */}
            <div className="mt-6 sm:mt-8 pt-5 sm:pt-6 border-t border-background/10">
              <div className="flex justify-between sm:grid sm:grid-cols-3 gap-2 sm:gap-6 lg:gap-8">
                <div className="text-center lg:text-left">
                  <p className="text-lg sm:text-2xl md:text-3xl font-bold text-primary">400+</p>
                  <p className="text-[10px] sm:text-xs text-background/60 mt-0.5">Homes Sold</p>
                </div>
                <div className="text-center">
                  <p className="text-lg sm:text-2xl md:text-3xl font-bold text-primary">$200M+</p>
                  <p className="text-[10px] sm:text-xs text-background/60 mt-0.5">In Transactions</p>
                </div>
                <div className="text-center lg:text-right">
                  <div className="flex items-center gap-1 justify-center lg:justify-end">
                    <Star className="h-3.5 w-3.5 sm:h-4 sm:w-4 md:h-5 md:w-5 fill-primary text-primary" />
                    <p className="text-lg sm:text-2xl md:text-3xl font-bold text-primary">5.0</p>
                  </div>
                  <p className="text-[10px] sm:text-xs text-background/60 mt-0.5">Google Rating</p>
                </div>
              </div>
            </div>
          </div>
          
          {/* Image - Better mobile/tablet presentation */}
          <div className="relative order-1 lg:order-2">
            <div className="relative max-w-md sm:max-w-lg mx-auto lg:max-w-none">
              {/* Glow behind image */}
              <div className="absolute -inset-2 sm:-inset-3 lg:-inset-4 bg-primary/20 rounded-xl sm:rounded-2xl blur-xl sm:blur-2xl" />
              <div className="relative aspect-[4/3] rounded-xl sm:rounded-2xl overflow-hidden shadow-2xl border border-background/10">
                <img
                  src={aboutHeroImage}
                  alt="Presale Properties Group team in Vancouver sales center"
                  className="w-full h-full object-cover"
                />
                {/* Overlay gradient */}
                <div className="absolute inset-0 bg-gradient-to-t from-foreground/40 via-transparent to-transparent" />
              </div>
            </div>
          </div>
        </div>
      </div>

      <AboutContactForm
        open={formOpen}
        onOpenChange={setFormOpen}
        selectedAgentId={null}
        selectedAgentName={null}
      />
    </section>
  );
}
