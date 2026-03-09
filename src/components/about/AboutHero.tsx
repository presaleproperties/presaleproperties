import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Calendar, ArrowRight, MapPin, Star, Shield, Users, Award } from "lucide-react";
import aboutHeroImage from "@/assets/about-hero-team.jpg";
import { AboutContactForm } from "./AboutContactForm";

const stats = [
  { value: "400+", label: "Homes Sold" },
  { value: "$200M+", label: "In Transactions" },
  { value: "5.0★", label: "Google Rating" },
  { value: "6+", label: "Languages" },
];

const trust = [
  { icon: Shield, label: "Licensed REALTORS®" },
  { icon: Award, label: "5.0 Google Rating" },
  { icon: Users, label: "No Cost to Buyers" },
];

export function AboutHero() {
  const [formOpen, setFormOpen] = useState(false);

  return (
    <section className="relative min-h-screen flex items-end overflow-hidden">

      {/* ── Full-bleed photograph ── */}
      <div className="absolute inset-0">
        <img
          src={aboutHeroImage}
          alt="Presale Properties Group team"
          className="w-full h-full object-cover object-top"
        />
        {/* Multi-stop cinematic gradient */}
        <div className="absolute inset-0 bg-gradient-to-t from-foreground via-foreground/60 to-foreground/10" />
        <div className="absolute inset-0 bg-gradient-to-r from-foreground/80 via-foreground/30 to-transparent" />
        {/* Gold atmospheric bloom */}
        <div className="absolute bottom-1/3 left-[10%] w-[900px] h-[600px] bg-primary/6 rounded-full blur-[200px] pointer-events-none" />
      </div>

      {/* ── Horizontal rule — top gold line ── */}
      <div className="absolute top-0 inset-x-0 h-[2px] bg-gradient-to-r from-transparent via-primary to-transparent opacity-70" />

      {/* ── Main content — anchored to bottom ── */}
      <div className="relative w-full pb-20 md:pb-28 pt-40">
        <div className="container px-4 sm:px-6">

          {/* Location chip */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-white/12 bg-white/5 backdrop-blur-md mb-8">
            <MapPin className="h-3 w-3 text-primary" />
            <span className="text-[11px] font-semibold tracking-[0.2em] text-white/60 uppercase">
              Metro Vancouver &amp; Fraser Valley
            </span>
          </div>

          {/* ── Headline grid: text left / stats right ── */}
          <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-12">

            {/* Left — headline block */}
            <div className="max-w-[680px]">
              {/* Eye-line label */}
              <p className="text-[11px] font-bold uppercase tracking-[0.32em] text-primary/80 mb-4">
                We Are
              </p>

              {/* Main title — massive editorial type */}
              <h1 className="font-extrabold text-white leading-[0.92] tracking-tighter">
                <span className="block text-[clamp(52px,9vw,108px)]">
                  Presale
                </span>
                <span className="block text-[clamp(52px,9vw,108px)]">
                  Properties
                </span>
                <span className="block text-[clamp(52px,9vw,108px)] text-primary">
                  Group
                </span>
              </h1>

              {/* ── Divider ── */}
              <div className="mt-8 mb-7 flex items-center gap-4">
                <div className="h-px w-12 bg-primary/50" />
                <span className="text-[11px] tracking-[0.25em] text-white/35 uppercase font-medium">
                  New Construction. Expert Help. No Extra Cost.
                </span>
              </div>

              {/* Tagline */}
              <p className="text-base text-white/50 leading-relaxed max-w-[480px]">
                BC's specialist new construction team — guiding first-time buyers and investors through presales, townhomes, and single-family homes from first call to key pickup.
              </p>

              {/* ── Trust badges ── */}
              <div className="flex flex-wrap gap-2.5 mt-8">
                {trust.map((t) => (
                  <span
                    key={t.label}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-white/65 text-[11px] font-semibold backdrop-blur-sm"
                  >
                    <t.icon className="h-3 w-3 text-primary" />
                    {t.label}
                  </span>
                ))}
              </div>

              {/* ── CTAs ── */}
              <div className="flex flex-col sm:flex-row gap-3 mt-10">
                <Button
                  size="lg"
                  className="h-13 px-8 text-[14px] font-bold tracking-wide shadow-2xl shadow-primary/20 gap-2.5"
                  onClick={() => setFormOpen(true)}
                >
                  <Calendar className="h-4 w-4 flex-shrink-0" />
                  Book Free Consultation
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  className="h-13 px-8 text-[14px] font-bold border-2 border-white/12 bg-white/4 text-white hover:bg-white/10 hover:text-white hover:border-white/22 backdrop-blur-sm gap-2"
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
                <div
                  key={s.label}
                  className="bg-foreground/60 backdrop-blur-md px-8 py-7 text-center"
                >
                  <div className="text-3xl font-black text-primary tracking-tight leading-none">
                    {s.value}
                  </div>
                  <div className="text-[10px] text-white/38 uppercase tracking-[0.18em] font-semibold mt-2">
                    {s.label}
                  </div>
                </div>
              ))}
            </div>

          </div>

          {/* Mobile stats row */}
          <div className="lg:hidden grid grid-cols-4 gap-0 mt-10 rounded-xl overflow-hidden border border-white/8">
            {stats.map((s) => (
              <div
                key={s.label}
                className="bg-foreground/60 backdrop-blur-md px-3 py-4 text-center"
              >
                <div className="text-lg font-black text-primary leading-none">{s.value}</div>
                <div className="text-[9px] text-white/38 uppercase tracking-wider font-medium mt-1.5 leading-snug">{s.label}</div>
              </div>
            ))}
          </div>

        </div>
      </div>

      {/* ── Bottom fade into page ── */}
      <div className="absolute bottom-0 inset-x-0 h-32 bg-gradient-to-t from-background to-transparent" />

      <AboutContactForm open={formOpen} onOpenChange={setFormOpen} selectedAgentId={null} selectedAgentName={null} />
    </section>
  );
}
