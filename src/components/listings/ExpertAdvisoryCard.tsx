import { useState } from "react";
import { Shield, CheckCircle2, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AboutContactForm } from "@/components/about/AboutContactForm";

const STATS = [
  { value: "400+", label: "Happy Clients" },
  { value: "5+", label: "Years Experience" },
  { value: "No Cost", label: "To Buyers" },
];

const BENEFITS = [
  "Personalized property recommendations",
  "Expert market insights & analysis",
  "End-to-end transaction support",
];

export function ExpertAdvisoryCard() {
  const [formOpen, setFormOpen] = useState(false);

  return (
    <>
      <div className="rounded-2xl border border-primary/20 bg-card p-5 sm:p-6 shadow-elevated relative overflow-hidden">
        {/* Subtle top accent line */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary via-primary-glow to-primary-deep" />

        {/* Header */}
        <div className="flex items-center gap-3 mb-5 mt-1">
          <div className="h-11 w-11 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
            <Shield className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h3 className="font-extrabold text-foreground text-lg tracking-tight">Presale Expert Advisory</h3>
            <p className="text-[13px] text-muted-foreground">Your trusted property partner</p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-2 mb-5">
          {STATS.map((stat) => (
            <div key={stat.label} className="text-center rounded-xl bg-primary/5 border border-primary/10 py-3 px-2">
              <p className="font-extrabold text-primary text-base tracking-tight">{stat.value}</p>
              <p className="text-[10px] sm:text-[11px] text-muted-foreground leading-tight mt-0.5 font-medium">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Benefits */}
        <div className="space-y-2.5 mb-5">
          {BENEFITS.map((benefit) => (
            <div key={benefit} className="flex items-start gap-2.5">
              <CheckCircle2 className="h-4 w-4 text-primary shrink-0 mt-0.5" />
              <span className="text-[13px] sm:text-sm text-foreground/80 font-medium">{benefit}</span>
            </div>
          ))}
        </div>

        {/* CTA */}
        <Button onClick={() => setFormOpen(true)} className="w-full h-12 bg-primary hover:bg-primary-deep text-primary-foreground font-bold text-base gap-2 rounded-xl shadow-gold transition-all duration-200 hover:shadow-gold-glow">
          Contact Now
          <ArrowRight className="h-4 w-4" />
        </Button>

        <p className="text-[11px] text-muted-foreground text-center mt-3 font-medium">
          Free consultation · No obligation
        </p>
      </div>

      <AboutContactForm
        open={formOpen}
        onOpenChange={setFormOpen}
      />
    </>
  );
}
