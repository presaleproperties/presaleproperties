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
    <section className="py-16 md:py-24">
      <div className="container px-4">
        <div className="max-w-3xl mx-auto text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Why Work With Us
          </h2>
          <div className="w-20 h-1 bg-primary mx-auto mb-6 rounded-full" />
          <p className="text-lg sm:text-xl text-muted-foreground font-medium">
            Most agents occasionally do presales. <span className="text-foreground">We live and breathe them.</span>
          </p>
        </div>
        
        <div className="grid md:grid-cols-3 gap-6 md:gap-8">
          {benefits.map((item) => (
            <div
              key={item.title}
              className="bg-card rounded-xl p-6 sm:p-8 border shadow-sm hover:shadow-md hover:border-primary/30 transition-all text-center"
            >
              <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <item.icon className="h-7 w-7 text-primary" />
              </div>
              <h3 className="font-semibold text-foreground text-lg mb-2">{item.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{item.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
