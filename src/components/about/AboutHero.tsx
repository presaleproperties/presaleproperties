import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { ArrowRight, MapPin, CheckCircle2 } from "lucide-react";
import aboutHeroImage from "@/assets/about-hero-team.jpg";
import { AboutContactForm } from "./AboutContactForm";

const trustPoints = [
  "400+ families guided",
  "Completely free for buyers",
  "5.0★ Google rated",
];

export function AboutHero() {
  const [formOpen, setFormOpen] = useState(false);

  return (
    <section className="relative w-full min-h-[92svh] flex flex-col">
      {/* Background */}
      <div className="absolute inset-0">
        <img
          src={aboutHeroImage}
          alt="Presale Properties Group team"
          className="w-full h-full object-cover object-center"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/75 to-black/50" />
        <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/40 to-black/5" />
      </div>

      {/* Top accent */}
      <div className="absolute top-0 inset-x-0 h-[2px] bg-gradient-to-r from-transparent via-primary to-transparent opacity-70" />

      {/* CONTENT */}
      <div className="relative flex-1 flex flex-col justify-center">
        <div className="container px-5 sm:px-8 md:px-10 pt-28 sm:pt-32 md:pt-36 pb-16 sm:pb-20">

          {/* Location chip */}
          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-white/20 bg-white/8 backdrop-blur-md mb-6">
            <MapPin className="h-3 w-3 text-primary shrink-0" />
            <span className="text-[10px] sm:text-[11px] font-semibold tracking-[0.12em] text-white/70 uppercase">
              Metro Vancouver &amp; Fraser Valley
            </span>
          </div>

          <div className="max-w-2xl">
            {/* Headline — tight & punchy */}
            <h1 className="font-extrabold text-white leading-[1.0] tracking-tight mb-5">
              <span className="block text-[38px] sm:text-[52px] md:text-[62px] lg:text-[72px]">
                New home experts.
              </span>
              <span className="block text-[38px] sm:text-[52px] md:text-[62px] lg:text-[72px] text-primary">
                Zero cost to you.
              </span>
            </h1>

            {/* One-line value prop */}
            <p className="text-[14px] sm:text-[16px] text-white/60 leading-relaxed max-w-md mb-7">
              We guide buyers through presale condos, townhomes & new builds — so you never overpay or miss an incentive.
            </p>

            {/* Trust points — inline */}
            <div className="flex flex-wrap items-center gap-x-5 gap-y-2 mb-8">
              {trustPoints.map((p) => (
                <span key={p} className="flex items-center gap-1.5">
                  <CheckCircle2 className="h-3.5 w-3.5 text-primary shrink-0" />
                  <span className="text-[12px] sm:text-[13px] text-white/65 font-medium">{p}</span>
                </span>
              ))}
            </div>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row gap-3 lg:mr-20">
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

        </div>
      </div>

      {/* Bottom fade */}
      <div className="absolute bottom-0 inset-x-0 h-20 bg-gradient-to-t from-background to-transparent pointer-events-none" />

      <AboutContactForm open={formOpen} onOpenChange={setFormOpen} selectedAgentId={null} selectedAgentName={null} />
    </section>
  );
}
