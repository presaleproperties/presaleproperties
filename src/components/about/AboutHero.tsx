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
    <section className="relative w-full min-h-screen flex flex-col">
      {/* Background */}
      <div className="absolute inset-0">
        <img
          src={aboutHeroImage}
          alt="Presale Properties Group team"
          className="w-full h-full object-cover object-center"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/55 to-black/30" />
        <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/25 to-transparent" />
      </div>

      {/* Top accent */}
      <div className="absolute top-0 inset-x-0 h-[2px] bg-gradient-to-r from-transparent via-primary to-transparent opacity-70" />

      {/* Content — fills full screen height, content at bottom half */}
      <div className="relative flex-1 flex flex-col justify-end">
        <div className="container px-4 sm:px-6 pb-8 sm:pb-12 md:pb-16 lg:pb-20 pt-20">

          {/* Location chip */}
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-white/20 bg-white/8 backdrop-blur-md mb-4 sm:mb-5 max-w-full">
            <MapPin className="h-2.5 w-2.5 text-primary shrink-0" />
            <span className="text-[10px] font-semibold tracking-[0.15em] text-white/65 uppercase truncate">
              Metro Vancouver &amp; Fraser Valley
            </span>
          </div>

          {/* Main layout: headline left, stats right on desktop */}
          <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6 lg:gap-10">

            {/* Left — headline + body + CTAs */}
            <div className="flex-1 min-w-0">
              <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-primary/90 mb-2">
                We Are
              </p>

              {/* Title — tightly constrained so it NEVER overflows viewport height */}
              <h1 className="font-extrabold text-white leading-[0.88] tracking-tight mb-4 sm:mb-5">
                <span className="block text-[clamp(32px,5.5vw,72px)]">Presale</span>
                <span className="block text-[clamp(32px,5.5vw,72px)]">Properties</span>
                <span className="block text-[clamp(32px,5.5vw,72px)] text-primary">Group</span>
              </h1>

              {/* Divider + tagline */}
              <div className="flex items-center gap-3 mb-3 sm:mb-4">
                <div className="h-px w-8 bg-primary/60 shrink-0" />
                <span className="text-[9px] sm:text-[10px] tracking-[0.18em] text-white/40 uppercase font-medium">
                  New Construction. Expert Help. No Extra Cost.
                </span>
              </div>

              {/* Body copy — hidden on very small screens to save space */}
              <p className="hidden sm:block text-sm text-white/55 leading-relaxed max-w-md mb-4">
                BC's specialist new construction team — guiding first-time buyers and investors through presales, townhomes, and single-family homes from first call to key pickup.
              </p>

              {/* Trust badges */}
              <div className="flex flex-wrap gap-1.5 sm:gap-2 mb-5 sm:mb-6">
                {trust.map((t) => (
                  <span
                    key={t.label}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/6 border border-white/12 text-white/70 text-[10px] font-semibold backdrop-blur-sm"
                  >
                    <t.icon className="h-2.5 w-2.5 text-primary shrink-0" />
                    {t.label}
                  </span>
                ))}
              </div>

              {/* CTAs */}
              <div className="flex flex-col sm:flex-row gap-2.5">
                <Button
                  size="default"
                  className="h-11 px-5 text-[13px] font-bold gap-2 shadow-xl shadow-primary/20"
                  onClick={() => setFormOpen(true)}
                >
                  <Calendar className="h-3.5 w-3.5 flex-shrink-0" />
                  Book Free Consultation
                </Button>
                <Button
                  size="default"
                  variant="outline"
                  className="h-11 px-5 text-[13px] font-bold border border-white/20 bg-white/6 text-white hover:bg-white/12 hover:text-white hover:border-white/30 backdrop-blur-sm gap-2"
                  asChild
                >
                  <Link to="/presale-projects">
                    Browse Projects
                    <ArrowRight className="h-3.5 w-3.5 flex-shrink-0" />
                  </Link>
                </Button>
              </div>
            </div>

            {/* Right — stat pillars, desktop only */}
            <div className="hidden lg:grid grid-cols-2 gap-px bg-white/10 rounded-2xl overflow-hidden border border-white/10 shrink-0 self-end">
              {stats.map((s) => (
                <div key={s.label} className="bg-black/60 backdrop-blur-md px-7 py-6 text-center">
                  <div className="text-2xl font-black text-primary tracking-tight leading-none">{s.value}</div>
                  <div className="text-[9px] text-white/40 uppercase tracking-[0.15em] font-semibold mt-1.5">{s.label}</div>
                </div>
              ))}
            </div>

          </div>

          {/* Mobile/tablet stats — 4 in a row on sm+, 2×2 on xs */}
          <div className="lg:hidden grid grid-cols-2 sm:grid-cols-4 gap-px mt-5 sm:mt-6 rounded-xl overflow-hidden border border-white/10 bg-white/8">
            {stats.map((s) => (
              <div key={s.label} className="bg-black/60 backdrop-blur-md px-3 py-4 text-center">
                <div className="text-lg sm:text-xl font-black text-primary leading-none">{s.value}</div>
                <div className="text-[9px] sm:text-[10px] text-white/45 uppercase tracking-wider font-medium mt-1 leading-snug">{s.label}</div>
              </div>
            ))}
          </div>

        </div>
      </div>

      {/* Bottom fade into page */}
      <div className="absolute bottom-0 inset-x-0 h-24 bg-gradient-to-t from-background to-transparent pointer-events-none" />

      <AboutContactForm open={formOpen} onOpenChange={setFormOpen} selectedAgentId={null} selectedAgentName={null} />
    </section>
  );
}
