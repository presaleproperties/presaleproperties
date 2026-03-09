import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Calendar, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { AboutContactForm } from "./AboutContactForm";

export function AboutCTA() {
  const [formOpen, setFormOpen] = useState(false);

  return (
    <section className="py-20 md:py-28 bg-foreground text-background relative overflow-hidden">
      {/* Atmospheric glows */}
      <div className="absolute -top-40 right-0 w-[700px] h-[700px] bg-primary/12 rounded-full blur-[180px] pointer-events-none" />
      <div className="absolute -bottom-40 left-0 w-[500px] h-[500px] bg-primary/7 rounded-full blur-[130px] pointer-events-none" />

      {/* Top / bottom accent lines */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent" />
      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/20 to-transparent" />

      {/* Subtle grid overlay */}
      <div
        className="absolute inset-0 opacity-[0.025] pointer-events-none"
        style={{
          backgroundImage:
            "linear-gradient(hsl(var(--background)) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--background)) 1px, transparent 1px)",
          backgroundSize: "60px 60px",
        }}
      />

      <div className="container relative px-4 sm:px-6">
        <div className="max-w-3xl mx-auto text-center">

          <span className="text-[11px] font-bold uppercase tracking-[0.28em] text-primary block mb-7">
            Get Started Today
          </span>

          <h2 className="text-4xl sm:text-5xl md:text-[56px] font-extrabold text-background leading-[1.0] tracking-tight mb-7">
            Start Your
            <br />
            <span className="text-primary">Presale Journey.</span>
          </h2>

          <p className="text-[15px] text-background/50 mb-12 max-w-lg mx-auto leading-relaxed">
            Whether you're buying your first home or expanding your portfolio — having a specialist team changes your outcome. Always at zero cost to buyers.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-14">
            <Button
              size="lg"
              className="h-14 px-10 text-[15px] font-bold gap-2.5 shadow-2xl shadow-primary/25"
              onClick={() => setFormOpen(true)}
            >
              <Calendar className="h-5 w-5 flex-shrink-0" />
              Book Free Consultation
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="h-14 px-10 text-[15px] font-bold gap-2.5 border-2 border-background/15 bg-background/4 text-background hover:bg-background/10 hover:text-background hover:border-background/25"
              asChild
            >
              <Link to="/presale-projects">
                View All Projects
                <ArrowRight className="h-5 w-5 flex-shrink-0" />
              </Link>
            </Button>
          </div>

          {/* Trust row */}
          <div className="flex flex-wrap items-center justify-center gap-6 pt-10 border-t border-background/8">
            {[
              "400+ Homes Sold",
              "5.0★ Google Rating",
              "No Cost to Buyers",
              "Licensed REALTORS®",
            ].map((trust) => (
              <span key={trust} className="text-[12px] text-background/35 font-medium tracking-wide">
                {trust}
              </span>
            ))}
          </div>

        </div>
      </div>

      <AboutContactForm open={formOpen} onOpenChange={setFormOpen} selectedAgentId={null} selectedAgentName={null} />
    </section>
  );
}
