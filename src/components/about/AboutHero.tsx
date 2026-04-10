import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import aboutHeroImage from "@/assets/about-hero-team.jpg";
import { AboutContactForm } from "./AboutContactForm";

export function AboutHero() {
  const [formOpen, setFormOpen] = useState(false);

  return (
    <section className="relative min-h-[100svh] flex items-end">
      {/* Background */}
      <img
        src={aboutHeroImage}
        alt="Presale Properties Group team"
        className="absolute inset-0 w-full h-full object-cover object-center"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/60 to-black/20" />

      {/* Top accent */}
      <div className="absolute top-0 inset-x-0 h-[2px] bg-gradient-to-r from-transparent via-primary to-transparent opacity-70" />

      {/* Content — bottom-aligned */}
      <div className="relative z-10 w-full pb-16 sm:pb-20 pt-32 px-5 sm:px-8 lg:px-16">
        <div className="container mx-auto">
          <p className="text-primary text-xs font-bold tracking-[0.3em] uppercase mb-4">
            Presale Properties Group
          </p>

          <h1 className="text-[40px] sm:text-5xl md:text-6xl lg:text-7xl font-extrabold text-white leading-[1.0] tracking-tight max-w-3xl">
            Your New Home
            <br />
            <span className="text-primary">Starts Here.</span>
          </h1>

          <p className="text-white/60 text-base sm:text-lg mt-4 max-w-lg">
            Metro Vancouver's presale specialists. Expert guidance at no extra cost to you.
          </p>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row gap-3 mt-8">
            <Button
              size="default"
              className="h-12 px-7 text-[14px] font-bold shadow-xl shadow-primary/25"
              onClick={() => setFormOpen(true)}
            >
              Talk to an Expert
            </Button>
            <Button
              size="default"
              variant="outline"
              className="h-12 px-7 text-[14px] font-bold border border-white/25 bg-white/8 text-white hover:bg-white/15 hover:text-white hover:border-white/35 backdrop-blur-sm gap-2"
              asChild
            >
              <Link to="/presale-projects">
                Browse Projects
                <ArrowRight className="h-4 w-4 flex-shrink-0" />
              </Link>
            </Button>
          </div>

          {/* Stats */}
          <div className="flex flex-wrap gap-6 sm:gap-8 mt-12 pt-8 border-t border-white/10 max-w-xl">
            {[
              { value: "400+", label: "Units Sold" },
              { value: "$200M+", label: "Sales Volume" },
              { value: "5.0★", label: "Google Rating" },
            ].map((s) => (
              <div key={s.label}>
                <div className="text-2xl sm:text-3xl font-black text-primary leading-none">{s.value}</div>
                <div className="text-[10px] sm:text-xs text-white/40 uppercase tracking-wide mt-1.5">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom fade */}
      <div className="absolute bottom-0 inset-x-0 h-20 bg-gradient-to-t from-background to-transparent pointer-events-none" />

      <AboutContactForm open={formOpen} onOpenChange={setFormOpen} selectedAgentId={null} selectedAgentName={null} />
    </section>
  );
}
