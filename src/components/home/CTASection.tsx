import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export function CTASection() {
  return (
    <section className="py-20 bg-foreground text-background">
      <div className="container">
        <div className="max-w-3xl mx-auto text-center space-y-6">
          <h2 className="text-3xl md:text-4xl font-bold">
            Are You a Real Estate Agent?
          </h2>
          <p className="text-lg text-background/80">
            List your presale assignments on Vancouver's fastest-growing marketplace. 
            Reach qualified buyers and grow your business.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/register">
              <Button
                size="lg"
                className="w-full sm:w-auto"
              >
                Get Started Free
                <ArrowRight className="ml-2 h-5 w-5" />
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