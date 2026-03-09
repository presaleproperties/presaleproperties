import { Users, ShieldCheck, HeartHandshake } from "lucide-react";

const benefits = [
  {
    icon: Users,
    number: "01",
    title: "Specialist Presale Team",
    description:
      "We understand developers, contracts, and deposit structures inside and out. Most agents occasionally do presales — we live and breathe them every single day.",
  },
  {
    icon: ShieldCheck,
    number: "02",
    title: "True Buyer Representation",
    description:
      "Expert advocacy at zero cost to you. Our fees are paid by the developer, so your interests always come first — no compromise, no conflict.",
  },
  {
    icon: HeartHandshake,
    number: "03",
    title: "End-to-End Support",
    description:
      "From your first consult to key pickup and beyond — every step, including assignments, deficiency walkthroughs, and completions.",
  },
];

export function WhatWeDoDifferently() {
  return (
    <section className="py-20 md:py-28 bg-foreground text-background relative overflow-hidden">
      {/* Subtle texture grid */}
      <div
        className="absolute inset-0 opacity-[0.03] pointer-events-none"
        style={{
          backgroundImage:
            "linear-gradient(hsl(var(--background)) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--background)) 1px, transparent 1px)",
          backgroundSize: "48px 48px",
        }}
      />
      {/* Gold glow top-right */}
      <div className="absolute -top-32 right-0 w-[600px] h-[600px] bg-primary/12 rounded-full blur-[160px] pointer-events-none" />

      {/* Top accent line */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent" />

      <div className="container relative px-4 sm:px-6">
        <div className="max-w-5xl mx-auto">

          <div className="grid lg:grid-cols-[1fr_2fr] gap-12 lg:gap-20 items-start">

            {/* Left label */}
            <div className="lg:sticky lg:top-24">
              <span className="text-[11px] font-bold uppercase tracking-[0.28em] text-primary block mb-5">
                Why Work With Us
              </span>
              <h2 className="text-3xl sm:text-4xl md:text-[44px] font-extrabold text-background leading-[1.05] tracking-tight">
                A Different Kind of
                <br />
                <span className="text-primary">Real Estate Team</span>
              </h2>
            </div>

            {/* Right — benefit cards */}
            <div className="space-y-5">
              {benefits.map((item, i) => (
                <div
                  key={item.title}
                  className="group relative rounded-2xl border border-background/10 bg-background/4 p-8 hover:border-primary/40 hover:bg-background/7 transition-all duration-300"
                >
                  {/* Ghost number */}
                  <div className="absolute top-7 right-7 text-6xl font-black text-background/[0.04] group-hover:text-primary/8 transition-colors leading-none select-none">
                    {item.number}
                  </div>

                  <div className="flex items-start gap-5">
                    <div className="p-3 bg-primary/15 rounded-xl w-fit shrink-0 group-hover:bg-primary/20 transition-colors">
                      <item.icon className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-bold text-background text-lg mb-2.5 leading-snug">{item.title}</h3>
                      <p className="text-[14px] text-background/55 leading-relaxed max-w-lg">{item.description}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

          </div>
        </div>
      </div>

      {/* Bottom accent */}
      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
    </section>
  );
}
