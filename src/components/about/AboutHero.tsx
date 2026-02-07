import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Calendar, Star } from "lucide-react";
import aboutHeroImage from "@/assets/about-hero-team.jpg";
import { AboutContactForm } from "./AboutContactForm";

export function AboutHero() {
  const [formOpen, setFormOpen] = useState(false);

  return (
    <section className="relative overflow-hidden">
      {/* Full-bleed image with overlay */}
      <div className="absolute inset-0">
        <img
          src={aboutHeroImage}
          alt="Presale Properties Group team in Vancouver sales center"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-foreground/80" />
        <div className="absolute inset-0 bg-gradient-to-b from-foreground/40 via-foreground/60 to-foreground/90" />
      </div>

      <div className="container relative px-4 py-24 sm:py-32 md:py-40 lg:py-48">
        <div className="max-w-3xl mx-auto text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/15 border border-primary/25 mb-6 sm:mb-8">
            <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
            <span className="text-[11px] sm:text-xs font-semibold text-primary tracking-wider uppercase">
              Metro Vancouver & Fraser Valley
            </span>
          </div>

          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight text-background leading-[1.08] mb-5 sm:mb-6">
            Your New Construction{" "}
            <span className="text-primary">Specialists</span>
          </h1>

          <p className="text-base sm:text-lg md:text-xl text-background/70 leading-relaxed max-w-2xl mx-auto mb-8 sm:mb-10">
            Whether you're buying your first home or building an investment portfolio, we guide you through every step — from project selection to move‑in or assignment.
          </p>

          <Button
            size="lg"
            className="gap-2 shadow-xl shadow-primary/30 text-sm sm:text-base px-6 sm:px-8 py-3 h-auto"
            onClick={() => setFormOpen(true)}
          >
            <Calendar className="h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0" />
            <span>Book Free Consultation</span>
          </Button>

          {/* Trust strip */}
          <div className="mt-10 sm:mt-14 pt-6 border-t border-background/10">
            <div className="flex flex-wrap items-center justify-center gap-6 sm:gap-10">
              <div className="text-center">
                <p className="text-2xl sm:text-3xl font-bold text-primary">400+</p>
                <p className="text-[11px] sm:text-xs text-background/50 mt-0.5">Homes Sold</p>
              </div>
              <div className="w-px h-8 bg-background/10 hidden sm:block" />
              <div className="text-center">
                <p className="text-2xl sm:text-3xl font-bold text-primary">$200M+</p>
                <p className="text-[11px] sm:text-xs text-background/50 mt-0.5">In Transactions</p>
              </div>
              <div className="w-px h-8 bg-background/10 hidden sm:block" />
              <div className="text-center flex flex-col items-center">
                <div className="flex items-center gap-1">
                  <Star className="h-4 w-4 sm:h-5 sm:w-5 fill-primary text-primary" />
                  <p className="text-2xl sm:text-3xl font-bold text-primary">5.0</p>
                </div>
                <p className="text-[11px] sm:text-xs text-background/50 mt-0.5">Google Rating</p>
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
