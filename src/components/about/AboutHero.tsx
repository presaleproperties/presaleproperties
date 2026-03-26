import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { ArrowRight, MapPin, CheckCircle2 } from "lucide-react";
import aboutHeroImage from "@/assets/about-hero-team.jpg";
import { AboutContactForm } from "./AboutContactForm";
import { supabase } from "@/integrations/supabase/client";

const problems = [
  "Not sure if presale is right for you?",
  "Confused by contracts, deposits & timelines?",
  "Worried about making a costly mistake?",
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
        <div className="absolute inset-0 bg-gradient-to-t from-black/98 via-black/85 to-black/60" />
        <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/50 to-black/10" />
      </div>

      {/* Top accent */}
      <div className="absolute top-0 inset-x-0 h-[2px] bg-gradient-to-r from-transparent via-primary to-transparent opacity-70" />

      {/* CONTENT */}
      <div className="relative flex-1 flex flex-col justify-center">
        <div className="container px-5 sm:px-8 md:px-10 pt-28 sm:pt-32 md:pt-36 pb-16 sm:pb-20">

          {/* Location chip */}
          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-white/20 bg-white/8 backdrop-blur-md mb-6 sm:mb-8">
            <MapPin className="h-3 w-3 text-primary shrink-0" />
            <span className="text-[10px] sm:text-[11px] font-semibold tracking-[0.12em] text-white/70 uppercase">
              Metro Vancouver &amp; Fraser Valley
            </span>
          </div>

          {/* Two-column layout on desktop */}
          <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-10 lg:gap-16">

            {/* LEFT: headline + CTAs */}
            <div className="flex-1 min-w-0 max-w-2xl">

              {/* Empathy-first headline */}
              <h1 className="font-extrabold text-white leading-[1.0] tracking-tight mb-5 sm:mb-6">
                <span className="block text-[13px] sm:text-[14px] font-bold uppercase tracking-[0.3em] text-primary mb-3">
                  You deserve clarity.
                </span>
                <span className="block text-[38px] sm:text-[52px] md:text-[62px] lg:text-[68px]">
                  Buying a new home
                </span>
                <span className="block text-[38px] sm:text-[52px] md:text-[62px] lg:text-[68px]">
                  shouldn't feel like
                </span>
                <span className="block text-[38px] sm:text-[52px] md:text-[62px] lg:text-[68px] text-primary">
                  a gamble.
                </span>
              </h1>

              {/* Body copy */}
              <p className="text-[14px] sm:text-[15px] text-white/65 leading-relaxed max-w-lg mb-7 sm:mb-8">
                Most buyers go into presale without a specialist in their corner — and end up paying more, missing incentives, or signing contracts they don't fully understand. We fix that. At no cost to you.
              </p>

              {/* Problems we solve */}
              <ul className="space-y-2.5 mb-8 sm:mb-10">
                {problems.map((p) => (
                  <li key={p} className="flex items-center gap-2.5">
                    <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />
                    <span className="text-[13px] sm:text-[14px] text-white/70">{p}</span>
                  </li>
                ))}
              </ul>

              {/* CTAs */}
              <div className="flex flex-col sm:flex-row gap-3">
                <Button
                  size="default"
                  className="h-12 px-7 text-[14px] font-bold gap-2 shadow-xl shadow-primary/25"
                  onClick={() => setFormOpen(true)}
                >
                  Get Free Expert Guidance
                </Button>
                <Button
                  size="default"
                  variant="outline"
                  className="h-12 px-7 text-[14px] font-bold border border-white/25 bg-white/8 text-white hover:bg-white/15 hover:text-white hover:border-white/35 backdrop-blur-sm gap-2"
                  asChild
                >
                  <Link to="/presale-projects">
                    See New Homes
                    <ArrowRight className="h-4 w-4 flex-shrink-0" />
                  </Link>
                </Button>
              </div>

            </div>

            {/* RIGHT: social proof — desktop */}
            <div className="hidden lg:flex flex-col gap-3 shrink-0 w-64">
              <div className="rounded-2xl border border-white/10 bg-black/50 backdrop-blur-md p-6">
                <div className="text-[11px] font-bold uppercase tracking-[0.2em] text-white/40 mb-4">
                  What clients say
                </div>
                <p className="text-[13px] text-white/70 leading-relaxed italic mb-4">
                  "They explained everything I didn't know I needed to know. I saved $18,000 in negotiated credits."
                </p>
                <div className="flex items-center gap-2.5 pt-4 border-t border-white/8">
                  <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center text-primary text-xs font-black">H</div>
                  <div>
                    <p className="text-[12px] font-bold text-white/80">Harpreet K.</p>
                    <p className="text-[11px] text-white/40">First-time buyer, Surrey</p>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { value: "400+", label: "Homes guided" },
                  { value: "$0", label: "Cost to you" },
                  { value: "5.0★", label: "Google rating" },
                  { value: "5", label: "Languages" },
                ].map((s) => (
                  <div key={s.label} className="rounded-xl border border-white/10 bg-black/50 backdrop-blur-md p-4 text-center">
                    <div className="text-xl font-black text-primary leading-none">{s.value}</div>
                    <div className="text-[9px] text-white/40 uppercase tracking-wide font-semibold mt-1.5 leading-snug">{s.label}</div>
                  </div>
                ))}
              </div>
            </div>

          </div>

          {/* Stats — mobile/tablet: 2x2 grid */}
          <div className="lg:hidden grid grid-cols-2 sm:grid-cols-4 gap-2 mt-8 rounded-xl overflow-hidden border border-white/10">
            {[
              { value: "400+", label: "Homes guided" },
              { value: "$0", label: "Cost to you" },
              { value: "5.0★", label: "Google rating" },
              { value: "5", label: "Languages" },
            ].map((s) => (
              <div key={s.label} className="bg-black/55 backdrop-blur-md px-3 py-4 text-center">
                <div className="text-xl sm:text-2xl font-black text-primary leading-none">{s.value}</div>
                <div className="text-[9px] sm:text-[10px] text-white/45 uppercase tracking-wide font-semibold mt-1.5 leading-snug">{s.label}</div>
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
