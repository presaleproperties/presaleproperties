import { Users, ShieldCheck, HeartHandshake } from "lucide-react";

const benefits = [
  {
    icon: Users,
    title: "Specialist Presale Team",
    description: "We understand developers, contracts, and deposit structures inside and out. Most agents occasionally do presales — we live and breathe them.",
  },
  {
    icon: ShieldCheck,
    title: "True Buyer Representation",
    description: "Expert advocacy at no cost to you. Our fees are paid by the developer, so your interests always come first.",
  },
  {
    icon: HeartHandshake,
    title: "End-to-End Support",
    description: "From your first consult to key pickup and beyond — we're there for every step, including assignments and completions.",
  },
];

export function WhatWeDoDifferently() {
  return (
    <section className="py-20 md:py-28 bg-foreground text-background">
      <div className="container px-4 sm:px-6">
        <div className="max-w-5xl mx-auto">

          <div className="text-center mb-16">
            <span className="text-xs font-bold uppercase tracking-[0.25em] text-primary block mb-4">Why Work With Us</span>
            <h2 className="text-3xl sm:text-4xl md:text-[42px] font-extrabold text-background leading-tight tracking-tight">
              A Different Kind of<br />
              <span className="text-primary">Real Estate Team</span>
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-6 md:gap-8">
            {benefits.map((item, i) => (
              <div
                key={item.title}
                className="relative rounded-2xl border border-background/10 bg-background/5 p-8 hover:border-primary/40 hover:bg-background/8 transition-all duration-300 group"
              >
                {/* Number */}
                <div className="absolute top-6 right-7 text-5xl font-black text-background/5 group-hover:text-primary/10 transition-colors leading-none select-none">
                  {String(i + 1).padStart(2, "0")}
                </div>
                <div className="p-3 bg-primary/15 rounded-xl w-fit mb-6">
                  <item.icon className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-bold text-background text-lg mb-3 leading-snug">{item.title}</h3>
                <p className="text-sm text-background/60 leading-relaxed">{item.description}</p>
              </div>
            ))}
          </div>

        </div>
      </div>
    </section>
  );
}
