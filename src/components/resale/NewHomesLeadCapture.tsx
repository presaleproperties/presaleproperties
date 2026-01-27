import { useState } from "react";
import { CheckCircle2, Calendar, ArrowRight, Home } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AccessPackModal } from "@/components/conversion/AccessPackModal";

interface NewHomesLeadCaptureProps {
  isOpen?: boolean;
}

export function NewHomesLeadCapture({ isOpen }: NewHomesLeadCaptureProps) {
  const [modalOpen, setModalOpen] = useState(false);

  return (
    <>
      <section id="lead-capture" className="py-16 md:py-24 bg-foreground text-background">
        <div className="container px-4">
          <div className="max-w-4xl mx-auto">
            <div className="grid md:grid-cols-2 gap-8 md:gap-12 items-center">
              {/* Left - Copy */}
              <div className="text-center md:text-left">
                <span className="text-xs font-semibold uppercase tracking-widest text-primary mb-3 block">
                  Get Priority Access
                </span>
                <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold mb-4">
                  Get Access to All New Move-In-Ready Homes
                </h2>
                <p className="text-background/80 mb-6">
                  Be the first to see new inventory before it hits the public market. Our team monitors developer releases daily.
                </p>
                
                <div className="space-y-3 text-sm text-background/70">
                  <div className="flex items-center gap-2 justify-center md:justify-start">
                    <CheckCircle2 className="h-4 w-4 text-primary flex-shrink-0" />
                    <span>Curated listings matching your criteria</span>
                  </div>
                  <div className="flex items-center gap-2 justify-center md:justify-start">
                    <CheckCircle2 className="h-4 w-4 text-primary flex-shrink-0" />
                    <span>Early access to new releases</span>
                  </div>
                  <div className="flex items-center gap-2 justify-center md:justify-start">
                    <CheckCircle2 className="h-4 w-4 text-primary flex-shrink-0" />
                    <span>Expert guidance from a new-construction specialist</span>
                  </div>
                </div>
              </div>

              {/* Right - CTA Card */}
              <div className="bg-background text-foreground rounded-2xl p-6 md:p-8 shadow-xl text-center">
                <div className="inline-flex items-center justify-center w-14 h-14 bg-primary/10 rounded-full mb-4">
                  <Home className="h-7 w-7 text-primary" />
                </div>
                <h3 className="text-xl font-bold mb-2">Ready to Find Your New Home?</h3>
                <p className="text-muted-foreground text-sm mb-6">
                  Tell us your preferences and we'll match you with the perfect move-in-ready properties.
                </p>
                <Button
                  size="lg"
                  className="w-full h-12 bg-foreground text-background hover:bg-foreground/90"
                  onClick={() => setModalOpen(true)}
                >
                  Get Access
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
                <p className="text-xs text-muted-foreground text-center mt-4">
                  By submitting, you agree to our{" "}
                  <a href="/privacy" className="underline hover:text-foreground">
                    Privacy Policy
                  </a>
                  . We respect your privacy and will never spam.
                </p>
              </div>
            </div>

            {/* Secondary CTA */}
            <div className="mt-10 text-center">
              <p className="text-background/70 text-sm mb-3">
                Ready to start your search now?
              </p>
              <Button
                variant="outline"
                size="lg"
                className="border-background/30 text-background hover:bg-background/10"
                asChild
              >
                <a href="#book-call">
                  <Calendar className="mr-2 h-4 w-4" />
                  Book a New Home Strategy Call
                </a>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Use AccessPackModal with general_interest variant */}
      <AccessPackModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        variant="general_interest"
        source="general_interest"
      />
    </>
  );
}
