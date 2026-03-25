import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Calendar, ArrowRight, MapPin, Shield, Users, Award } from "lucide-react";
import aboutHeroImage from "@/assets/about-hero-team.jpg";
import { AboutContactForm } from "./AboutContactForm";

const stats = [
  { value: "400+", label: "Homes Sold" },
  { value: "$200M+", label: "Transactions" },
  { value: "5.0★", label: "Google Rating" },
  { value: "5", label: "Languages" },
];

const trust = [
  { icon: Shield, label: "Licensed REALTORS®" },
  { icon: Award, label: "5.0 Google Rating" },
  { icon: Users, label: "No Cost to Buyers" },
];

export function AboutHero() {
  const [formOpen, setFormOpen] = useState(false);

  return (
    <section className="relative w-full min-h-[100svh] flex flex-col">
      {/* Background */}
      <div className="absolute inset-0">
        <img
          src={aboutHeroImage}
          alt="Presale Properties Group team"
          className="w-full h-full object-cover object-center"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/98 via-black/80 to-black/55" />
        <div className="absolute inset-0 bg-gradient-to-r from-black/85 via-black/45 to-black/10" />
      </div>

      {/* Top accent */}
      <div className="absolute top-0 inset-x-0 h-[2px] bg-gradient-to-r from-transparent via-primary to-transparent opacity-70" />

      {/* ── CONTENT ── */}
      <div className="relative flex-1 flex flex-col justify-center min-h-0">
        <div className="container px-5 sm:px-8 md:px-10 py-24 sm:py-28 md:py-32 lg:py-20">

          {/* Location chip */}
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-white/25 bg-white/10 backdrop-blur-md mb-4 sm:mb-5">
            <MapPin className="h-2.5 w-2.5 text-primary shrink-0" />
            <span className="text-[9px] sm:text-[10px] font-semibold tracking-[0.12em] text-white/75 uppercase whitespace-nowrap">
              Metro Vancouver &amp; Fraser Valley
            </span>
          </div>

          {/* Desktop: headline left, stats right */}
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6 lg:gap-12">

            {/* LEFT: headline + CTAs */}
            <div className="flex-1 min-w-0">

              <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-primary mb-2 sm:mb-3">
                We Are
              </p>

              {/* Headline */}
              <h1 className="font-extrabold text-white leading-[0.9] tracking-tight mb-3 sm:mb-4">
                <span className="block text-5xl sm:text-7xl md:text-8xl lg:text-[84px]">Presale</span>
                <span className="block text-5xl sm:text-7xl md:text-8xl lg:text-[84px]">Properties</span>
                <span className="block text-5xl sm:text-7xl md:text-8xl lg:text-[84px] text-primary">Group</span>
              </h1>

              {/* Tagline */}
              <div className="flex items-center gap-2.5 mb-3 sm:mb-4">
                <div className="h-px w-8 bg-primary/60 shrink-0" />
                <span className="text-[9px] sm:text-[10px] tracking-[0.16em] text-white/50 uppercase font-medium">
                  New Construction. Expert Help. No Extra Cost.
                </span>
              </div>

              {/* Body copy — hidden on mobile to save space */}
              <p className="hidden sm:block text-sm md:text-[15px] text-white/60 leading-relaxed max-w-md mb-4">
                BC's specialist new construction team — guiding first-time buyers and investors through presales, townhomes, and single-family homes from first call to key pickup.
              </p>

              {/* Trust badges */}
              <div className="flex flex-wrap gap-1.5 sm:gap-2 mb-4 sm:mb-5">
                {trust.map((t) => (
                  <span
                    key={t.label}
                    className="inline-flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1 sm:py-1.5 rounded-full bg-white/8 border border-white/15 text-white/75 text-[10px] sm:text-[11px] font-semibold backdrop-blur-sm"
                  >
                    <t.icon className="h-2.5 w-2.5 sm:h-3 sm:w-3 text-primary shrink-0" />
                    {t.label}
                  </span>
                ))}
              </div>

              {/* CTAs */}
              <div className="flex flex-col sm:flex-row gap-2.5 sm:gap-3">
                <Button
                  size="default"
                  className="h-11 sm:h-12 px-5 sm:px-6 text-[13px] sm:text-[14px] font-bold gap-2 shadow-xl shadow-primary/25"
                  onClick={() => setFormOpen(true)}
                >
                  <Calendar className="h-3.5 w-3.5 sm:h-4 sm:w-4 flex-shrink-0" />
                  Book Free Consultation
                </Button>
                <Button
                  size="default"
                  variant="outline"
                  className="h-11 sm:h-12 px-5 sm:px-6 text-[13px] sm:text-[14px] font-bold border border-white/25 bg-white/8 text-white hover:bg-white/15 hover:text-white hover:border-white/35 backdrop-blur-sm gap-2"
                  asChild
                >
                  <Link to="/presale-projects">
                    Browse Projects
                    <ArrowRight className="h-3.5 w-3.5 sm:h-4 sm:w-4 flex-shrink-0" />
                  </Link>
                </Button>
              </div>
            </div>

            {/* RIGHT: stats — desktop only */}
            <div className="hidden lg:grid grid-cols-2 gap-px bg-white/10 rounded-2xl overflow-hidden border border-white/10 shrink-0">
              {stats.map((s) => (
                <div key={s.label} className="bg-black/55 backdrop-blur-md px-8 py-7 text-center">
                  <div className="text-3xl font-black text-primary tracking-tight leading-none">{s.value}</div>
                  <div className="text-[10px] text-white/45 uppercase tracking-[0.15em] font-semibold mt-2">{s.label}</div>
                </div>
              ))}
            </div>

          </div>

          {/* Stats — mobile & tablet: always 4 columns */}
          <div className="lg:hidden grid grid-cols-4 gap-px mt-4 sm:mt-6 rounded-xl overflow-hidden border border-white/15 bg-white/8">
            {stats.map((s) => (
              <div key={s.label} className="bg-black/55 backdrop-blur-md px-1.5 sm:px-3 py-3 sm:py-4 text-center">
                <div className="text-base sm:text-xl font-black text-primary leading-none">{s.value}</div>
                <div className="text-[8px] sm:text-[10px] text-white/50 uppercase tracking-wide font-semibold mt-1 leading-snug">{s.label}</div>
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
