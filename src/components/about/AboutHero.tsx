import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Calendar, ArrowRight, MapPin, Shield, Users, Award } from "lucide-react";
import aboutHeroImage from "@/assets/about-hero-team.jpg";
import { AboutContactForm } from "./AboutContactForm";

const stats = [
  { value: "400+", label: "Homes Sold" },
  { value: "$200M+", label: "In Transactions" },
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
    <section className="relative w-full overflow-x-hidden">
      {/* Full-bleed background — stretches to match content height */}
      <div className="absolute inset-0">
        <img
          src={aboutHeroImage}
          alt="Presale Properties Group team"
          className="w-full h-full object-cover object-top"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-foreground via-foreground/65 to-foreground/20" />
        <div className="absolute inset-0 bg-gradient-to-r from-foreground/80 via-foreground/35 to-transparent" />
        <div className="absolute bottom-1/3 left-[5%] w-[600px] h-[500px] bg-primary/6 rounded-full blur-[180px] pointer-events-none" />
      </div>

      {/* Top gold accent line */}
      <div className="absolute top-0 inset-x-0 h-[2px] bg-gradient-to-r from-transparent via-primary to-transparent opacity-70" />

      {/* Content — top padding clears the navbar; grows naturally */}
      <div className="relative w-full pt-28 pb-16 sm:pt-32 sm:pb-20 md:pt-40 md:pb-24 lg:pt-44 lg:pb-28">
        <div className="container px-4 sm:px-6">

          {/* Location chip */}
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-white/15 bg-white/5 backdrop-blur-md mb-6">
            <MapPin className="h-3 w-3 text-primary shrink-0" />
            <span className="text-[10px] sm:text-[11px] font-semibold tracking-[0.18em] text-white/60 uppercase">
              Metro Vancouver &amp; Fraser Valley
            </span>
          </div>

          {/* Headline + stats grid */}
          <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-8 lg:gap-12">

            {/* Left — headline block */}
            <div className="w-full lg:max-w-[620px]">
              <p className="text-[10px] sm:text-[11px] font-bold uppercase tracking-[0.32em] text-primary/80 mb-3">
                We Are
              </p>

              <h1 className="font-extrabold text-white leading-[0.92] tracking-tighter">
                <span className="block text-[clamp(38px,8vw,96px)]">Presale</span>
                <span className="block text-[clamp(38px,8vw,96px)]">Properties</span>
                <span className="block text-[clamp(38px,8vw,96px)] text-primary">Group</span>
              </h1>

              <div className="mt-5 mb-4 flex items-center gap-3">
                <div className="h-px w-10 bg-primary/50 shrink-0" />
                <span className="text-[10px] sm:text-[11px] tracking-[0.18em] text-white/40 uppercase font-medium leading-snug">
                  New Construction. Expert Help. No Extra Cost.
                </span>
              </div>

              <p className="text-sm sm:text-[15px] text-white/55 leading-relaxed max-w-[480px]">
                BC's specialist new construction team — guiding first-time buyers and investors through presales, townhomes, and single-family homes from first call to key pickup.
              </p>

              {/* Trust badges */}
              <div className="flex flex-wrap gap-2 mt-5 sm:mt-6">
                {trust.map((t) => (
                  <span
                    key={t.label}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-full bg-white/5 border border-white/10 text-white/70 text-[10px] sm:text-[11px] font-semibold backdrop-blur-sm"
                  >
                    <t.icon className="h-3 w-3 text-primary shrink-0" />
                    {t.label}
                  </span>
                ))}
              </div>

              {/* CTAs */}
              <div className="flex flex-col sm:flex-row gap-3 mt-7">
                <Button
                  size="lg"
                  className="h-12 px-6 text-[13px] sm:text-[14px] font-bold tracking-wide shadow-2xl shadow-primary/20 gap-2"
                  onClick={() => setFormOpen(true)}
                >
                  <Calendar className="h-4 w-4 flex-shrink-0" />
                  Book Free Consultation
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  className="h-12 px-6 text-[13px] sm:text-[14px] font-bold border-2 border-white/15 bg-white/5 text-white hover:bg-white/10 hover:text-white hover:border-white/25 backdrop-blur-sm gap-2"
                  asChild
                >
                  <Link to="/presale-projects">
                    Browse Projects
                    <ArrowRight className="h-4 w-4 flex-shrink-0" />
                  </Link>
                </Button>
              </div>
            </div>

            {/* Right — stat pillars (desktop only) */}
            <div className="hidden lg:grid grid-cols-2 gap-px bg-white/8 rounded-2xl overflow-hidden border border-white/8 self-end mb-2 shrink-0">
              {stats.map((s) => (
                <div key={s.label} className="bg-foreground/60 backdrop-blur-md px-8 py-7 text-center">
                  <div className="text-3xl font-black text-primary tracking-tight leading-none">{s.value}</div>
                  <div className="text-[10px] text-white/40 uppercase tracking-[0.18em] font-semibold mt-2">{s.label}</div>
                </div>
              ))}
            </div>

          </div>

          {/* Mobile / tablet stats — 2×2 grid to avoid cramming 4 into a row */}
          <div className="lg:hidden grid grid-cols-2 sm:grid-cols-4 gap-px mt-8 rounded-xl overflow-hidden border border-white/10 bg-white/8">
            {stats.map((s) => (
              <div key={s.label} className="bg-foreground/60 backdrop-blur-md px-3 py-5 text-center">
                <div className="text-xl sm:text-2xl font-black text-primary leading-none">{s.value}</div>
                <div className="text-[9px] sm:text-[10px] text-white/45 uppercase tracking-wider font-medium mt-1.5 leading-snug">{s.label}</div>
              </div>
            ))}
          </div>

        </div>
      </div>

      {/* Bottom fade */}
      <div className="absolute bottom-0 inset-x-0 h-28 bg-gradient-to-t from-background to-transparent pointer-events-none" />

      <AboutContactForm open={formOpen} onOpenChange={setFormOpen} selectedAgentId={null} selectedAgentName={null} />
    </section>
  );
}
