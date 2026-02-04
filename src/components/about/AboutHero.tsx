import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Calendar, MapPin, Star } from "lucide-react";
import aboutHeroImage from "@/assets/about-hero-team.jpg";
export function AboutHero() {
  return (
    <section className="relative py-16 md:py-24 lg:py-28 overflow-hidden">
      {/* Premium gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/8 via-background to-muted/30" />
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4" />
      
      <div className="container relative px-4">
        <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">
          {/* Content */}
          <div className="text-center lg:text-left order-2 lg:order-1">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary font-medium text-sm mb-6 border border-primary/20">
              <MapPin className="h-4 w-4" />
              Vancouver's New Construction Specialists
            </div>
            
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight text-foreground mb-6 leading-[1.1]">
              Meet Your Presale{" "}
              <span className="text-primary">Real Estate Experts</span>
            </h1>
            
            <p className="text-base sm:text-lg md:text-xl text-muted-foreground mb-8 max-w-xl mx-auto lg:mx-0 leading-relaxed">
              We help first-time buyers and investors navigate the presale journey with clarity, confidence, and results — at no cost to you.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center lg:justify-start">
              <Button size="xl" className="gap-2 shadow-lg shadow-primary/25" asChild>
                <Link to="/contact">
                  <Calendar className="h-5 w-5" />
                  Book a Free Consultation
                </Link>
              </Button>
            </div>
            
            <div className="mt-6 flex justify-center lg:justify-start">
              <Button size="lg" variant="ghost" className="text-muted-foreground hover:text-foreground" asChild>
                <Link to="/presale-projects">
                  Browse Projects →
                </Link>
              </Button>
            </div>
          </div>
          
          {/* Image */}
          <div className="relative order-1 lg:order-2">
            <div className="aspect-[4/3] rounded-2xl overflow-hidden shadow-2xl border border-border/50">
              <img
                src={aboutHeroImage}
                alt="Presale Properties Group team in Vancouver sales center"
                className="w-full h-full object-cover"
              />
            </div>
            
            {/* Stats overlay - repositioned for mobile */}
            <div className="absolute -bottom-4 sm:-bottom-6 left-2 right-2 sm:left-4 sm:right-4 md:left-6 md:right-6">
              <div className="bg-card/95 backdrop-blur-sm rounded-xl shadow-xl p-3 sm:p-4 md:p-5 grid grid-cols-3 gap-2 sm:gap-4 border">
                <div className="text-center">
                  <p className="text-xl sm:text-2xl md:text-3xl font-bold text-primary">400+</p>
                  <p className="text-[10px] sm:text-xs md:text-sm text-muted-foreground">Homes Sold</p>
                </div>
                <div className="text-center border-x border-border">
                  <p className="text-xl sm:text-2xl md:text-3xl font-bold text-primary">$200M+</p>
                  <p className="text-[10px] sm:text-xs md:text-sm text-muted-foreground">In Sales</p>
                </div>
                <div className="text-center">
                  <div className="flex items-center justify-center gap-1">
                    <Star className="h-4 w-4 sm:h-5 sm:w-5 fill-primary text-primary" />
                    <p className="text-xl sm:text-2xl md:text-3xl font-bold text-primary">5.0</p>
                  </div>
                  <p className="text-[10px] sm:text-xs md:text-sm text-muted-foreground">Google Rating</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
