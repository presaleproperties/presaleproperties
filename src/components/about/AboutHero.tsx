import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Calendar, Star, ArrowRight } from "lucide-react";
import aboutHeroImage from "@/assets/about-hero-team.jpg";

export function AboutHero() {
  return (
    <section className="relative py-20 md:py-28 lg:py-32 overflow-hidden">
      {/* Premium multi-layer gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-foreground via-foreground/95 to-foreground/90" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-primary/20 via-transparent to-transparent" />
      <div className="absolute bottom-0 left-0 w-full h-1/2 bg-gradient-to-t from-primary/5 to-transparent" />
      
      {/* Decorative glow */}
      <div className="absolute top-1/4 right-0 w-[500px] h-[500px] bg-primary/15 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/4" />
      <div className="absolute bottom-0 left-1/4 w-[300px] h-[300px] bg-primary/10 rounded-full blur-[80px]" />
      
      <div className="container relative px-4">
        <div className="grid lg:grid-cols-2 gap-10 lg:gap-16 items-center">
          {/* Content */}
          <div className="text-center lg:text-left order-2 lg:order-1">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/20 border border-primary/30 mb-8">
              <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
              <span className="text-sm font-semibold text-primary tracking-wide uppercase">
                Vancouver's Presale Specialists
              </span>
            </div>
            
            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight text-background mb-6 leading-[1.05]">
              New Condos.{" "}
              <span className="text-primary">Expert Help.</span>{" "}
              <span className="block mt-2">No Extra Cost.</span>
            </h1>
            
            <p className="text-lg sm:text-xl text-background/70 mb-10 max-w-xl mx-auto lg:mx-0 leading-relaxed">
              A <span className="text-background font-semibold">specialized team</span> guiding first-time buyers and investors through every step — from <span className="text-background font-semibold">project selection</span> to <span className="text-background font-semibold">move‑in or assignment</span>.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
              <Button size="xl" className="gap-2 shadow-xl shadow-primary/30 text-base" asChild>
                <Link to="/contact">
                  <Calendar className="h-5 w-5" />
                  Book a Free Consultation
                </Link>
              </Button>
              <Button 
                size="xl" 
                variant="outline" 
                className="gap-2 border-background/30 text-background hover:bg-background/10 text-base"
                asChild
              >
                <Link to="/presale-projects">
                  Browse Projects
                  <ArrowRight className="h-5 w-5" />
                </Link>
              </Button>
            </div>
            
            {/* Trust indicators */}
            <div className="mt-10 pt-8 border-t border-background/10">
              <div className="grid grid-cols-3 gap-4 sm:gap-8">
                <div className="text-center lg:text-left">
                  <p className="text-3xl sm:text-4xl font-bold text-primary">400+</p>
                  <p className="text-sm text-background/60">Homes Sold</p>
                </div>
                <div className="text-center">
                  <p className="text-3xl sm:text-4xl font-bold text-primary">$200M+</p>
                  <p className="text-sm text-background/60">In Transactions</p>
                </div>
                <div className="text-center lg:text-right">
                  <div className="flex items-center justify-center lg:justify-end gap-1.5">
                    <Star className="h-5 w-5 sm:h-6 sm:w-6 fill-primary text-primary" />
                    <p className="text-3xl sm:text-4xl font-bold text-primary">5.0</p>
                  </div>
                  <p className="text-sm text-background/60">Google Rating</p>
                </div>
              </div>
            </div>
          </div>
          
          {/* Image */}
          <div className="relative order-1 lg:order-2">
            <div className="relative">
              {/* Glow behind image */}
              <div className="absolute -inset-4 bg-primary/20 rounded-3xl blur-2xl" />
              <div className="relative aspect-[4/3] rounded-2xl overflow-hidden shadow-2xl border border-background/10">
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
    </section>
  );
}
