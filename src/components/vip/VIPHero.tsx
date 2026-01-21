import { Button } from "@/components/ui/button";
import { Check, Gift, Home, DollarSign, Shield } from "lucide-react";

const benefits = [
  {
    icon: Gift,
    title: "$1,500 Credit",
    description: "Legal Fees, Tenant Placement, or Cash",
  },
  {
    icon: Home,
    title: "Exclusive Off-Market Inventory",
    description: "Before Public Release",
  },
  {
    icon: DollarSign,
    title: "VIP Pricing",
    description: "Save $10K-$25K vs. Public Launch",
  },
  {
    icon: Shield,
    title: "White-Glove Service",
    description: "Signing → Completion",
  },
];

export const VIPHero = () => {
  const scrollToForm = () => {
    document.getElementById("application-form")?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <section className="relative min-h-screen flex items-center justify-center bg-gradient-to-b from-foreground via-foreground/95 to-foreground/90 pt-20 pb-20 px-4">
      <div className="max-w-[1200px] mx-auto text-center">
        {/* Eyebrow */}
        <p className="text-primary font-semibold text-sm md:text-base tracking-widest mb-6 animate-fade-in">
          VIP ELITE MEMBERSHIP
        </p>

        {/* Main Headline */}
        <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-white leading-tight mb-6 animate-fade-in-up">
          CLAIM YOUR $1,500 CREDIT
          <br />
          <span className="text-primary">+ Get First Access to Vancouver's Best Presales</span>
        </h1>

        {/* Subheadline */}
        <p className="text-lg md:text-xl text-white/70 max-w-2xl mx-auto mb-12 animate-fade-in-up" style={{ animationDelay: "0.1s" }}>
          Join 400+ smart buyers who get exclusive inventory,
          VIP pricing, and expert guidance—PLUS $1,500 at closing.
        </p>

        {/* Benefits Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-12">
          {benefits.map((benefit, index) => (
            <div
              key={benefit.title}
              className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-4 md:p-6 text-center animate-fade-in-up"
              style={{ animationDelay: `${0.2 + index * 0.1}s` }}
            >
              <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-primary/20 flex items-center justify-center">
                <benefit.icon className="w-6 h-6 text-primary" />
              </div>
              <div className="flex items-center justify-center gap-2 mb-2">
                <Check className="w-4 h-4 text-success" />
                <span className="text-white font-semibold text-sm md:text-base">{benefit.title}</span>
              </div>
              <p className="text-white/60 text-xs md:text-sm">{benefit.description}</p>
            </div>
          ))}
        </div>

        {/* CTA Button */}
        <Button
          onClick={scrollToForm}
          size="xl"
          className="bg-primary text-primary-foreground font-bold text-lg px-8 py-6 shadow-gold hover:shadow-gold-glow animate-fade-in-up"
          style={{ animationDelay: "0.6s" }}
        >
          Claim Your $1,500 Credit + VIP Access →
        </Button>

        {/* Trust Line */}
        <p className="text-white/50 text-sm mt-6 animate-fade-in-up" style={{ animationDelay: "0.7s" }}>
          No Cost. No Catch. Just Better Access.
        </p>
      </div>
    </section>
  );
};
