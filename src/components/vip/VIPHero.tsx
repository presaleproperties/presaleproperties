import { Button } from "@/components/ui/button";
import { ArrowRight, Crown } from "lucide-react";

export const VIPHero = () => {
  const scrollToForm = () => {
    document.getElementById("membership-form")?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <section className="relative py-20 md:py-28 px-4 bg-gradient-to-b from-muted/50 to-background">
      <div className="max-w-[900px] mx-auto text-center">
        {/* Tagline */}
        <p className="text-primary text-sm sm:text-base md:text-lg font-bold tracking-widest uppercase mb-6">
          VANCOUVER'S NEW CONSTRUCTION MARKETPLACE
        </p>

        {/* Badge */}
        <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-medium mb-8">
          <Crown className="w-4 h-4" />
          Limited Time Offer
        </div>

        {/* Headline */}
        <h1 className="text-[32px] sm:text-4xl md:text-5xl lg:text-6xl font-extrabold text-foreground leading-[1.05] mb-6 tracking-tightest">
          Claim Your
          <span className="text-primary block mt-2 drop-shadow-[0_0_25px_hsl(33_50%_53%/0.3)]">$1,500 Closing Credit</span>
        </h1>

        {/* Subheadline */}
        <p className="text-base sm:text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed font-medium">
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
