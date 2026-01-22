import { Button } from "@/components/ui/button";
import { ArrowRight, Crown } from "lucide-react";

export const VIPHero = () => {
  const scrollToForm = () => {
    document.getElementById("membership-form")?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <section className="relative py-20 md:py-28 px-4 bg-gradient-to-b from-muted/50 to-background">
      <div className="max-w-[900px] mx-auto text-center">
        {/* Badge */}
        <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-medium mb-8">
          <Crown className="w-4 h-4" />
          Limited Time Offer
        </div>

        {/* Headline */}
        <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-foreground leading-tight mb-6 tracking-tight">
          Claim Your
          <span className="text-primary block mt-2">$1,500 Closing Credit</span>
        </h1>

        {/* Subheadline */}
        <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed">
          Join our VIP membership and receive exclusive early access to Vancouver's best presales, 
          VIP pricing, and expert guidance—plus a $1,500 credit toward your closing costs.
        </p>

        {/* CTA */}
        <Button
          onClick={scrollToForm}
          size="xl"
          className="bg-primary text-primary-foreground font-semibold text-lg shadow-gold hover:shadow-gold-glow"
        >
          Join VIP Membership
          <ArrowRight className="w-5 h-5 ml-2" />
        </Button>

        {/* Trust line */}
        <p className="text-sm text-muted-foreground mt-6">
          Complimentary membership · No obligation to purchase
        </p>
      </div>
    </section>
  );
};
