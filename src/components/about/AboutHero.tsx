import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Calendar, ArrowRight, MapPin, Star } from "lucide-react";
import aboutHeroImage from "@/assets/about-hero-team.jpg";
import { AboutContactForm } from "./AboutContactForm";

const stats = [
  { value: "400+", label: "Homes Sold" },
  { value: "$200M+", label: "In Transactions" },
  { value: "5.0", label: "Google Rating", suffix: "★" },
  { value: "6+", label: "Languages Spoken" },
];

export function AboutHero() {
  const [formOpen, setFormOpen] = useState(false);

  return (
    <section className="relative min-h-[96vh] flex items-center overflow-hidden">
      {/* Full-bleed background */}
      <div className="absolute inset-0">
        <img
          src={aboutHeroImage}
          alt="Presale Properties Group team"
          className="w-full h-full object-cover object-top"
        />
        {/* Layered overlays for depth */}
        <div className="absolute inset-0 bg-gradient-to-r from-foreground/97 via-foreground/85 to-foreground/20" />
        <div className="absolute inset-0 bg-gradient-to-t from-foreground/70 via-transparent to-transparent" />
        {/* Warm gold glow */}
        <div className="absolute top-1/3 left-[15%] w-[700px] h-[700px] bg-primary/8 rounded-full blur-[180px] pointer-events-none" />
      </div>

      {/* Top gold line */}
      <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-primary to-transparent" />

      <div className="container relative px-4 sm:px-6 py-28 md:py-36">
        <div className="max-w-[640px]">

          {/* Location pill */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 backdrop-blur-sm mb-8">
            <MapPin className="h-3.5 w-3.5 text-primary" />
            <span className="text-xs font-semibold tracking-[0.18em] text-white/70 uppercase">
              Metro Vancouver & Fraser Valley
            </span>
          </div>

          {/* Main headline — "Presale Properties Group" */}
          <h1 className="font-extrabold text-white leading-[1.0] tracking-tight mb-6">
            <span className="block text-[13px] sm:text-sm font-bold uppercase tracking-[0.3em] text-primary/90 mb-3">
              We Are
            </span>
            <span className="block text-5xl sm:text-6xl md:text-7xl">
              Presale Properties
            </span>
            <span className="block text-5xl sm:text-6xl md:text-7xl text-primary mt-1">
              Group
            </span>
          </h1>

          {/* Tagline */}
          <p className="text-[15px] sm:text-base text-white/55 leading-relaxed mb-10 max-w-[480px]">
            BC's specialist new construction team — guiding first-time buyers and investors through presales, townhomes, and single-family homes from first call to key pickup.
          </p>

          {/* Trust micro-badges */}
          <div className="flex flex-wrap gap-3 mb-10">
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary/15 border border-primary/25 text-primary text-xs font-semibold">
              <Star className="h-3 w-3 fill-primary" />
              5.0 Google Rating
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-white/70 text-xs font-semibold">
              Licensed REALTORS®
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-white/70 text-xs font-semibold">
              No Cost to Buyers
            </span>
          </div>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row gap-3">
            <Button
              size="lg"
              className="h-13 px-8 text-[15px] font-bold shadow-2xl shadow-primary/25 gap-2.5"
              onClick={() => setFormOpen(true)}
            >
              <Calendar className="h-4.5 w-4.5 flex-shrink-0" />
              Book Free Consultation
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="h-13 px-8 text-[15px] font-bold border-2 border-white/15 bg-white/4 text-white hover:bg-white/10 hover:text-white hover:border-white/25 backdrop-blur-sm gap-2"
              asChild
            >
              <Link to="/presale-projects">
                Browse Projects
                <ArrowRight className="h-4 w-4 flex-shrink-0" />
              </Link>
            </Button>
          </div>

          {/* Stats row */}
          <div className="mt-14 pt-10 border-t border-white/8 grid grid-cols-2 sm:grid-cols-4 gap-6">
            {stats.map((s) => (
              <div key={s.label}>
                <div className="text-3xl font-black text-primary leading-none tracking-tight">
                  {s.value}{s.suffix && <span className="text-xl">{s.suffix}</span>}
                </div>
                <div className="text-[11px] text-white/40 uppercase tracking-widest mt-1.5 font-medium">{s.label}</div>
              </div>
            ))}
          </div>

        </div>
      </div>

      {/* Bottom fade into page */}
      <div className="absolute bottom-0 left-0 right-0 h-40 bg-gradient-to-t from-background to-transparent" />

      <AboutContactForm open={formOpen} onOpenChange={setFormOpen} selectedAgentId={null} selectedAgentName={null} />
    </section>
  );
}
