import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Calendar } from "lucide-react";
import { PresentationDeckGenerator } from "./PresentationDeckGenerator";

export function AboutHero() {
  return (
    <section className="relative py-20 md:py-28 overflow-hidden">
      {/* Background with subtle gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-primary/5 to-background" />
      
      <div className="container relative px-4">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Content */}
          <div className="text-center lg:text-left">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary font-medium text-sm mb-6">
              Vancouver's New Construction Specialists
            </div>
            
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight text-foreground mb-6">
              Meet Your New Construction{" "}
              <span className="text-primary">Real Estate Specialists</span>
            </h1>
            
            <p className="text-lg md:text-xl text-muted-foreground mb-8 max-w-xl mx-auto lg:mx-0">
              We help first-time buyers and investors navigate the presale journey with clarity, confidence, and results.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
              <Button size="xl" className="gap-2" asChild>
                <Link to="/contact">
                  <Calendar className="h-5 w-5" />
                  Schedule a Free Strategy Call
                </Link>
              </Button>
              <PresentationDeckGenerator />
            </div>
            
            <div className="mt-4 flex justify-center lg:justify-start">
              <Button size="lg" variant="ghost" asChild>
                <Link to="/presale-projects">
                  Browse Projects →
                </Link>
              </Button>
            </div>
          </div>
          
          {/* Image */}
          <div className="relative">
            <div className="aspect-[4/3] rounded-2xl overflow-hidden shadow-2xl">
              <img
                src="https://images.unsplash.com/photo-1560518883-ce09059eeffa?q=80&w=1973&auto=format&fit=crop"
                alt="Presale Properties Group team helping clients"
                className="w-full h-full object-cover"
              />
            </div>
            {/* Stats overlay */}
            <div className="absolute -bottom-6 left-4 right-4 md:left-8 md:right-8">
              <div className="bg-card rounded-xl shadow-xl p-4 md:p-6 grid grid-cols-3 gap-4 border">
                <div className="text-center">
                  <p className="text-2xl md:text-3xl font-bold text-primary">400+</p>
                  <p className="text-xs md:text-sm text-muted-foreground">Homes Sold</p>
                </div>
                <div className="text-center border-x border-border">
                  <p className="text-2xl md:text-3xl font-bold text-primary">$200M+</p>
                  <p className="text-xs md:text-sm text-muted-foreground">In Sales</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl md:text-3xl font-bold text-primary">5+</p>
                  <p className="text-xs md:text-sm text-muted-foreground">Years Experience</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
