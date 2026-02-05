import { Users, ShieldCheck, HeartHandshake } from "lucide-react";

const benefits = [
  {
    icon: Users,
    title: "Specialist Presale Team",
    description: "We understand developers, contracts, and deposit structures inside and out.",
  },
  {
    icon: ShieldCheck,
    title: "True Buyer Representation",
    description: "Expert advocacy at no cost — our fees are paid by the developer.",
  },
  {
    icon: HeartHandshake,
    title: "End-to-End Support",
    description: "From first consult to key pickup and beyond.",
  },
];

export function WhatWeDoDifferently() {
  return (
    <section className="py-12 sm:py-16 md:py-24">
      <div className="container px-4">
        <div className="max-w-3xl mx-auto text-center mb-8 sm:mb-12">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-foreground mb-3 sm:mb-4">
            Why Work With Us
          </h2>
          <div className="w-16 sm:w-20 h-1 bg-primary mx-auto mb-4 sm:mb-6 rounded-full" />
          <p className="text-sm sm:text-base md:text-lg text-muted-foreground">
            Most agents occasionally do presales. <span className="text-primary font-medium">We live and breathe them.</span>
          </p>
        </div>
        
        <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6 md:gap-8">
          {benefits.map((item) => (
            <div
              key={item.title}
              className="bg-card rounded-xl p-5 sm:p-6 md:p-8 border shadow-sm hover:shadow-md hover:border-primary/30 transition-all text-center"
            >
              <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3 sm:mb-4">
                <item.icon className="h-6 w-6 sm:h-7 sm:w-7 text-primary" />
              </div>
              <h3 className="font-semibold text-foreground text-base sm:text-lg mb-2">{item.title}</h3>
              <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">{item.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
