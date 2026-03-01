import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Calendar, Star, ArrowRight, ShieldCheck, Award } from "lucide-react";
import aboutHeroImage from "@/assets/about-hero-team.jpg";
import { AboutContactForm } from "./AboutContactForm";

const stats = [
  { value: "400+", label: "Homes Sold" },
  { value: "$200M+", label: "In Transactions" },
  { value: "5.0★", label: "Google Rating" },
];

export function AboutHero() {
  const [formOpen, setFormOpen] = useState(false);

  return (
    <section className="relative min-h-[92vh] flex items-center overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0">
        <img
          src={aboutHeroImage}
          alt="Presale Properties team"
          className="w-full h-full object-cover object-top"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-foreground/95 via-foreground/80 to-foreground/30" />
        <div className="absolute inset-0 bg-gradient-to-t from-foreground/60 via-transparent to-transparent" />
      </div>

      {/* Gold accent line */}
      <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-primary to-transparent" />

      {/* Glow */}
      <div className="absolute top-1/3 left-1/4 w-[600px] h-[600px] bg-primary/10 rounded-full blur-[150px] pointer-events-none" />

      <div className="container relative px-4 sm:px-6 py-24 md:py-32">
        <div className="max-w-2xl">
          {/* Eyebrow */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/15 border border-primary/25 backdrop-blur-sm mb-8">
            <Award className="h-3.5 w-3.5 text-primary" />
            <span className="text-xs font-bold uppercase tracking-[0.2em] text-primary">
              Metro Vancouver & Fraser Valley
            </span>
          </div>

          {/* Headline */}
          <h1 className="text-5xl sm:text-6xl md:text-7xl font-extrabold text-white leading-[1.0] tracking-tight mb-6">
            New Construction.<br />
            <span className="text-primary">Expert Help.</span><br />
            No Extra Cost.
          </h1>

          <p className="text-lg text-white/65 leading-relaxed mb-10 max-w-lg">
            A specialized team guiding first-time buyers and investors through condos, townhomes, and single-family homes — from project selection to key pickup.
          </p>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row gap-4 mb-14">
            <Button
              size="lg"
              className="gap-2.5 h-14 px-8 text-base font-bold shadow-2xl shadow-primary/30"
              onClick={() => setFormOpen(true)}
            >
              <Calendar className="h-5 w-5 flex-shrink-0" />
              Book Free Consultation
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="gap-2.5 h-14 px-8 text-base font-bold border-2 border-white/25 bg-white/5 text-white hover:bg-white/10 hover:text-white backdrop-blur-sm"
              asChild
            >
              <Link to="/presale-projects">
                Browse Projects
                <ArrowRight className="h-5 w-5 flex-shrink-0" />
              </Link>
            </Button>
          </div>

          {/* Stats row */}
          <div className="flex flex-wrap gap-6 pt-8 border-t border-white/10">
            {stats.map((s) => (
              <div key={s.label}>
                <div className="text-3xl font-extrabold text-primary leading-none">{s.value}</div>
                <div className="text-xs text-white/50 uppercase tracking-widest mt-1">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom fade */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-background to-transparent" />

      <AboutContactForm open={formOpen} onOpenChange={setFormOpen} selectedAgentId={null} selectedAgentName={null} />
    </section>
  );
}
