import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export function CTASection() {
  return (
    <section className="py-12 sm:py-16 md:py-20 bg-foreground text-background">
      <div className="container px-4">
        <div className="max-w-3xl mx-auto text-center space-y-4 sm:space-y-6">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold">
            Are You a Real Estate Agent?
          </h2>
          <p className="text-base sm:text-lg text-background/80 px-2">
            List your presale assignments on Vancouver's fastest-growing marketplace. 
            Reach qualified buyers and grow your business.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center pt-2">
            <Link to="/agents">
              <Button
                size="lg"
                className="w-full sm:w-auto"
              >
                Get Started Free
                <ArrowRight className="ml-2 h-4 w-4 sm:h-5 sm:w-5" />
              </Button>
            </Link>
            <Link to="/how-it-works">
              <Button
                size="lg"
                variant="outline"
                className="w-full sm:w-auto border-background text-background hover:bg-background hover:text-foreground"
              >
                Learn How It Works
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}