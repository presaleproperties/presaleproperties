import { Clock, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export function AssignmentsComingSoon() {
  return (
    <section className="py-12 bg-gradient-to-r from-primary/5 via-primary/10 to-primary/5 border-y border-primary/20">
      <div className="container px-4">
        <div className="max-w-3xl mx-auto text-center space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-primary/10 rounded-full text-primary text-sm font-medium">
            <Clock className="h-4 w-4" />
            Coming Soon
          </div>
          
          <h2 className="text-2xl md:text-3xl font-bold text-foreground">
            Assignment Sales Marketplace
          </h2>
          
          <p className="text-muted-foreground text-base md:text-lg max-w-xl mx-auto">
            Buy or sell presale contracts before completion. Get early access to exclusive assignment listings from verified agents.
          </p>
          
          <Button 
            variant="outline" 
            className="mt-2 border-primary/30 text-primary hover:bg-primary hover:text-primary-foreground"
            disabled
          >
            Get Notified
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </div>
    </section>
  );
}
