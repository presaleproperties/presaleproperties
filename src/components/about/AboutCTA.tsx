import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Calendar } from "lucide-react";
import { AboutContactForm } from "./AboutContactForm";

export function AboutCTA() {
  const [formOpen, setFormOpen] = useState(false);

  return (
    <section className="py-12 sm:py-16 md:py-24">
      <div className="container px-4">
        <div className="relative overflow-hidden rounded-xl sm:rounded-2xl md:rounded-3xl bg-gradient-to-br from-foreground to-foreground/90 text-background">
          {/* Decorative elements */}
          <div className="absolute top-0 right-0 w-48 sm:w-64 md:w-96 h-48 sm:h-64 md:h-96 bg-primary/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-0 w-32 sm:w-48 md:w-64 h-32 sm:h-48 md:h-64 bg-primary/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />
          
          <div className="relative px-4 py-8 sm:px-8 sm:py-12 md:px-16 md:py-20 text-center">
            <h2 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold mb-3 sm:mb-4">
              Start Your <span className="text-primary">Presale Journey</span>
            </h2>
            <p className="text-sm sm:text-base md:text-lg text-background/80 mb-5 sm:mb-6 md:mb-8 max-w-2xl mx-auto">
              Whether you're buying your first home or your next investment, having a specialist team on your side changes your outcome.
            </p>
            
            <div className="flex justify-center">
              <Button
                size="lg"
                className="bg-primary text-primary-foreground hover:bg-primary/90 gap-2 text-sm sm:text-base px-5 sm:px-6 py-2.5 sm:py-3 h-auto w-full sm:w-auto"
                onClick={() => setFormOpen(true)}
              >
                <Calendar className="h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0" />
                <span>Book Free Consultation</span>
              </Button>
            </div>
          </div>
        </div>
      </div>

      <AboutContactForm
        open={formOpen}
        onOpenChange={setFormOpen}
        selectedAgentId={null}
        selectedAgentName={null}
      />
    </section>
  );
}
