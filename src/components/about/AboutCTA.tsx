import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Calendar, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { AboutContactForm } from "./AboutContactForm";

export function AboutCTA() {
  const [formOpen, setFormOpen] = useState(false);

  return (
    <section className="py-20 md:py-28 bg-foreground text-background relative overflow-hidden">
      {/* Decorative glows */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/15 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/4 pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-primary/8 rounded-full blur-[100px] translate-y-1/2 -translate-x-1/4 pointer-events-none" />

      {/* Gold accent lines */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent" />
      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/20 to-transparent" />

      <div className="container relative px-4 sm:px-6">
        <div className="max-w-3xl mx-auto text-center">
          <span className="text-xs font-bold uppercase tracking-[0.25em] text-primary block mb-6">Get Started Today</span>

          <h2 className="text-4xl sm:text-5xl md:text-6xl font-extrabold text-background leading-tight tracking-tight mb-6">
            Start Your<br />
            <span className="text-primary">Presale Journey.</span>
          </h2>

          <p className="text-lg text-background/60 mb-12 max-w-xl mx-auto leading-relaxed">
            Whether you're buying your first home or building your next investment, having a specialist team on your side changes your outcome. Zero cost to you.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              size="lg"
              className="h-14 px-10 text-base font-bold gap-2.5 shadow-2xl shadow-primary/30"
              onClick={() => setFormOpen(true)}
            >
              <Calendar className="h-5 w-5 flex-shrink-0" />
              Book Free Consultation
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="h-14 px-10 text-base font-bold gap-2.5 border-2 border-background/20 bg-background/5 text-background hover:bg-background/10 hover:text-background"
              asChild
            >
              <Link to="/presale-projects">
                View All Projects
                <ArrowRight className="h-5 w-5 flex-shrink-0" />
              </Link>
            </Button>
          </div>
        </div>
      </div>

      <AboutContactForm open={formOpen} onOpenChange={setFormOpen} selectedAgentId={null} selectedAgentName={null} />
    </section>
  );
}
