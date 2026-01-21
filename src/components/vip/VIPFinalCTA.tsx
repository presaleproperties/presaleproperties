import { Button } from "@/components/ui/button";
import { Phone, Mail } from "lucide-react";

export const VIPFinalCTA = () => {
  const scrollToForm = () => {
    document.getElementById("application-form")?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <section className="py-20 md:py-28 px-4 bg-foreground text-white">
      <div className="max-w-[800px] mx-auto text-center">
        <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-6">
          READY TO ACCESS VANCOUVER'S BEST PRESALES?
        </h2>
        <p className="text-lg text-white/70 mb-10">
          Join 400+ discerning buyers who get first access to<br />
          exclusive inventory, VIP pricing, and expert guidance.
        </p>

        <div className="flex flex-col sm:flex-row justify-center gap-4 mb-12">
          <Button
            onClick={scrollToForm}
            size="lg"
            className="bg-primary text-primary-foreground font-semibold"
          >
            Apply for VIP Elite Membership →
          </Button>
          <Button
            onClick={scrollToForm}
            size="lg"
            variant="outline"
            className="border-white text-white hover:bg-white/10"
          >
            Join Free VIP Access →
          </Button>
        </div>

        <div className="border-t border-white/20 pt-10">
          <p className="text-white/80 mb-4">Questions? Book a 15-minute consultation.</p>
          <div className="flex flex-col sm:flex-row justify-center gap-6 text-white/80">
            <a href="tel:+16045551234" className="flex items-center justify-center gap-2 hover:text-primary transition-colors">
              <Phone className="w-4 h-4" />
              <span>604-555-1234</span>
            </a>
            <a href="mailto:uzair@presaleproperties.com" className="flex items-center justify-center gap-2 hover:text-primary transition-colors">
              <Mail className="w-4 h-4" />
              <span>uzair@presaleproperties.com</span>
            </a>
          </div>
        </div>

        <div className="mt-10 pt-6 border-t border-white/10">
          <p className="text-white/60 text-sm">
            <span className="text-white font-semibold">Presale Properties</span><br />
            Surrey's #1 Presale Specialists<br />
            80% Presales | 400+ Clients | $150M+ Transacted
          </p>
        </div>
      </div>
    </section>
  );
};
