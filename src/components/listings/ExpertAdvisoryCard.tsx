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
      <div className="rounded-xl border border-border bg-card p-5 sm:p-6 shadow-card">
        {/* Header */}
        <div className="flex items-center gap-3 mb-5">
          <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
            <Shield className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h3 className="font-bold text-foreground text-lg">Presale Expert Advisory</h3>
            <p className="text-sm text-muted-foreground">Your trusted property partner</p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-2 mb-5">
          {STATS.map((stat) => (
            <div key={stat.label} className="text-center rounded-lg bg-muted/50 border border-border py-3 px-2">
              <p className="font-bold text-foreground text-base">{stat.value}</p>
              <p className="text-[11px] text-muted-foreground leading-tight mt-0.5">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Benefits */}
        <div className="space-y-2.5 mb-5">
          {BENEFITS.map((benefit) => (
            <div key={benefit} className="flex items-start gap-2.5">
              <CheckCircle2 className="h-4.5 w-4.5 text-primary shrink-0 mt-0.5" />
              <span className="text-sm text-muted-foreground">{benefit}</span>
            </div>
          ))}
        </div>

        {/* CTA */}
        <Button onClick={() => setFormOpen(true)} className="w-full h-12 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-base gap-2">
          <ArrowRight className="h-4 w-4" />
          Contact Now!
        </Button>

        <p className="text-xs text-muted-foreground text-center mt-3">
          Free consultation • No obligation
        </p>
      </div>

      <AboutContactForm
        open={formOpen}
        onOpenChange={setFormOpen}
      />
    </>
  );
}
