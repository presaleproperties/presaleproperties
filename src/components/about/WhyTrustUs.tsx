import { ShieldCheck, Users, Award, HeartHandshake } from "lucide-react";

const trustPillars = [
  {
    icon: Users,
    title: "Specialist Presale Team",
    description: "80%+ of our business is new construction. We understand developers, contracts, and deposit structures inside and out.",
  },
  {
    icon: ShieldCheck,
    title: "True Buyer Representation",
    description: "We represent you — not the developer. Expert advocacy and negotiation at no cost to you.",
  },
  {
    icon: Award,
    title: "Proven Track Record",
    description: "400+ homes sold, $200M+ in transactions, and a 5.0 Google rating from real clients across Metro Vancouver and Fraser Valley.",
  },
  {
    icon: HeartHandshake,
    title: "End-to-End Support",
    description: "From your first call through to key pickup and beyond — including walkthroughs, deficiencies, and move-in coordination.",
  },
];

export function WhyTrustUs() {
  return (
    <section className="py-12 sm:py-16 md:py-24 bg-muted/30">
      <div className="container px-4">
        <div className="max-w-3xl mx-auto text-center mb-8 sm:mb-12">
          <p className="text-xs sm:text-sm font-semibold text-primary tracking-widest uppercase mb-2 sm:mb-3">
            Why Trust Us
          </p>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-foreground mb-3 sm:mb-4">
            Why Clients Choose Our Team
          </h2>
          <div className="w-16 sm:w-20 h-1 bg-primary mx-auto mb-4 sm:mb-6 rounded-full" />
          <p className="text-sm sm:text-base md:text-lg text-muted-foreground">
            Most agents occasionally do presales. <span className="text-primary font-medium">We live and breathe them.</span>
          </p>
        </div>

        <div className="grid sm:grid-cols-2 gap-4 sm:gap-6 md:gap-8">
          {trustPillars.map((item) => (
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
