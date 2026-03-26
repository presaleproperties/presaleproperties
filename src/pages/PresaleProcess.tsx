import { useRef, useEffect, useState } from "react";
import { Helmet } from "@/components/seo/Helmet";
import { ConversionHeader } from "@/components/conversion/ConversionHeader";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { StepGetPreApproved } from "@/components/presale-process/StepGetPreApproved";
import { StepRegisterAccess } from "@/components/presale-process/StepRegisterAccess";
import { StepChooseUnit } from "@/components/presale-process/StepChooseUnit";
import { StepSignContract } from "@/components/presale-process/StepSignContract";
import { StepPayDeposits } from "@/components/presale-process/StepPayDeposits";
import { StepTrackConstruction } from "@/components/presale-process/StepTrackConstruction";
import { StepPDI } from "@/components/presale-process/StepPDI";
import { StepCompletionKeys } from "@/components/presale-process/StepCompletionKeys";
import { Phone, ArrowRight, CheckCircle2 } from "lucide-react";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";

const STEPS = [
  { number: 1, label: "Pre-Qualify", sublabel: "Before you begin" },
  { number: 2, label: "VIP Access", sublabel: "Get in early" },
  { number: 3, label: "Choose Unit", sublabel: "Pick wisely" },
  { number: 4, label: "Sign Contract", sublabel: "Know your rights" },
  { number: 5, label: "Pay Deposits", sublabel: "Staggered payments" },
  { number: 6, label: "Construction", sublabel: "The waiting game" },
  { number: 7, label: "PDI Walkthrough", sublabel: "Inspect everything" },
  { number: 8, label: "Completion", sublabel: "Keys in hand" },
];

const STEP_COMPONENTS = [
  StepGetPreApproved,
  StepRegisterAccess,
  StepChooseUnit,
  StepSignContract,
  StepPayDeposits,
  StepTrackConstruction,
  StepPDI,
  StepCompletionKeys,
];

export default function PresaleProcess() {
  const [activeStep, setActiveStep] = useState(0);
  const stepRefs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const idx = stepRefs.current.findIndex((r) => r === entry.target);
            if (idx !== -1) setActiveStep(idx);
          }
        });
      },
      { threshold: 0.25, rootMargin: "-10% 0px -60% 0px" }
    );
    stepRefs.current.forEach((ref) => ref && observer.observe(ref));
    return () => observer.disconnect();
  }, []);

  const scrollTo = (idx: number) => {
    stepRefs.current[idx]?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <>
      <Helmet>
        <title>How to Buy a Presale Condo in Vancouver — 8-Step Guide | Presale Properties</title>
        <meta name="description" content="A complete 8-step guide to buying a presale condo in Vancouver, BC — from pre-approval to receiving your keys. Expert guidance at no extra cost." />
        <meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1" />
        <link rel="canonical" href="https://presaleproperties.com/presale-process" />
        <meta property="og:title" content="How to Buy a Presale Condo in Vancouver — 8-Step Guide" />
        <meta property="og:description" content="A complete 8-step guide to buying a presale condo in Vancouver BC from pre-approval to receiving keys." />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://presaleproperties.com/presale-process" />
        <script type="application/ld+json">{JSON.stringify({
          "@context": "https://schema.org",
          "@type": "HowTo",
          "name": "How to Buy a Presale Condo in Vancouver",
          "description": "A complete 8-step guide to buying a presale condo in Vancouver BC from pre-approval to receiving keys.",
          "url": "https://presaleproperties.com/presale-process",
          "step": STEPS.map((s, i) => ({
            "@type": "HowToStep",
            "position": s.number,
            "name": s.label,
            "text": s.sublabel,
          }))
        })}</script>
        <script type="application/ld+json">{JSON.stringify({
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          "itemListElement": [
            { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://presaleproperties.com" },
            { "@type": "ListItem", "position": 2, "name": "Presale Process", "item": "https://presaleproperties.com/presale-process" }
          ]
        })}</script>
      </Helmet>

      <ConversionHeader />

      <main className="min-h-screen bg-background">

        {/* ── Hero ─────────────────────────────────────────── */}
        <section className="relative overflow-hidden border-b border-border">
          {/* Radial background glow */}
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_50%_at_50%_0%,hsl(var(--primary)/0.08),transparent_70%)] pointer-events-none" />

          <div className="relative w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-14 pb-16 sm:pt-16 sm:pb-20 lg:pt-20 lg:pb-24">
            {/* Eyebrow */}
            <div className="inline-flex items-center gap-2 bg-primary/10 border border-primary/20 rounded-full px-4 py-1.5 mb-6">
              <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
              <span className="text-xs font-semibold uppercase tracking-widest text-primary">
                Expert Guidance · Zero Extra Cost
              </span>
            </div>

            <div className="max-w-3xl">
              <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-foreground tracking-tight leading-[1.05] mb-5">
                The Complete Guide to
                <br />
                <span className="text-gradient-gold">Buying Presale</span> in Vancouver
              </h1>
              <p className="text-base sm:text-lg text-muted-foreground leading-relaxed max-w-2xl mb-8">
                Eight steps. Every milestone. No surprises. We've walked 400+ buyers through this exact process — here's everything you need to know before you sign.
              </p>

              {/* Step pills */}
              <div className="flex flex-wrap gap-2">
                {STEPS.map((s, i) => (
                  <button
                    key={s.number}
                    onClick={() => scrollTo(i)}
                    className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground bg-secondary border border-border rounded-full px-3 py-1.5 hover:border-primary/40 hover:text-foreground transition-all duration-200"
                  >
                    <span className="text-primary font-bold">{String(s.number).padStart(2, "0")}</span>
                    {s.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Trust strip */}
            <div className="flex items-center gap-8 sm:gap-12 mt-10 pt-8 border-t border-border">
              {[
                { value: "400+", label: "Buyers Guided" },
                { value: "$200M+", label: "In Transactions" },
                { value: "5.0 ★", label: "Google Rating" },
                { value: "8 Steps", label: "Clear Process" },
              ].map((s) => (
                <div key={s.label}>
                  <p className="text-lg sm:text-xl font-bold text-primary leading-none">{s.value}</p>
                  <p className="text-[10px] sm:text-xs text-muted-foreground mt-1 font-medium whitespace-nowrap">{s.label}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Body: sticky sidebar + scrolling steps ───────── */}
        <section className="w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 lg:py-20">
          <div className="flex gap-8 lg:gap-14 xl:gap-16 items-start">

            {/* ── Sticky sidebar nav (desktop only) ── */}
            <aside className="hidden lg:block w-52 xl:w-60 flex-shrink-0 sticky top-24 self-start">
              <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground font-semibold mb-4">
                Steps
              </p>
              <nav className="space-y-0.5">
                {STEPS.map((s, i) => {
                  const isDone = i < activeStep;
                  const isActive = i === activeStep;
                  return (
                    <button
                      key={s.number}
                      onClick={() => scrollTo(i)}
                      className={cn(
                        "w-full flex items-center gap-3 text-left px-3 py-2.5 rounded-lg transition-all duration-200 group",
                        isActive
                          ? "bg-primary/10 text-foreground"
                          : isDone
                          ? "text-muted-foreground hover:bg-secondary"
                          : "text-muted-foreground/50 hover:bg-secondary hover:text-muted-foreground"
                      )}
                    >
                      <span className={cn(
                        "w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 text-[10px] font-bold transition-colors",
                        isActive ? "bg-primary text-primary-foreground" : isDone ? "bg-primary/20 text-primary" : "bg-border text-muted-foreground"
                      )}>
                        {isDone ? <CheckCircle2 size={11} /> : s.number}
                      </span>
                      <div className="min-w-0">
                        <p className={cn("text-xs font-semibold leading-none truncate", isActive ? "text-foreground" : "")}>
                          {s.label}
                        </p>
                        <p className="text-[10px] text-muted-foreground mt-0.5 truncate">{s.sublabel}</p>
                      </div>
                    </button>
                  );
                })}
              </nav>

              {/* CTA in sidebar */}
              <div className="mt-6 rounded-xl border border-primary/20 bg-primary/5 p-4 space-y-3">
                <p className="text-xs font-semibold text-foreground leading-snug">
                  Have questions about any step?
                </p>
                <Button size="sm" asChild className="w-full gap-1.5 shadow-gold-glow text-xs">
                  <Link to="/contact">
                    <Phone size={12} />
                    Book a Free Call
                  </Link>
                </Button>
              </div>
            </aside>

            {/* ── Step content ── */}
            <div className="flex-1 min-w-0 space-y-0">
              {STEPS.map((step, idx) => {
                const StepComponent = STEP_COMPONENTS[idx];
                const isLast = idx === STEPS.length - 1;
                return (
                  <div
                    key={step.number}
                    ref={(el) => { stepRefs.current[idx] = el; }}
                    className={cn("relative", !isLast && "pb-16 sm:pb-20 lg:pb-24")}
                  >
                    {/* Connector line */}
                    {!isLast && (
                      <div className="absolute left-0 top-[3.5rem] bottom-0 w-px bg-gradient-to-b from-border via-border/50 to-transparent lg:hidden" />
                    )}

                    {/* Step header */}
                    <div className="flex items-start gap-4 sm:gap-5 mb-8 sm:mb-10">
                      <div className="flex-shrink-0 flex flex-col items-center">
                        <div className={cn(
                          "w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center text-sm sm:text-base font-bold border-2 transition-all duration-300",
                          idx === activeStep
                            ? "bg-primary border-primary text-primary-foreground shadow-gold"
                            : idx < activeStep
                            ? "bg-primary/15 border-primary/30 text-primary"
                            : "bg-secondary border-border text-muted-foreground"
                        )}>
                          {String(step.number).padStart(2, "0")}
                        </div>
                      </div>
                      <div className="pt-1 min-w-0">
                        <p className="text-[10px] uppercase tracking-[0.18em] text-primary font-semibold mb-0.5">
                          Step {step.number} of {STEPS.length}
                        </p>
                        <h2 className="text-xl sm:text-2xl font-bold text-foreground tracking-tight leading-tight">
                          {step.label}
                        </h2>
                        <p className="text-xs text-muted-foreground mt-0.5">{step.sublabel}</p>
                      </div>
                    </div>

                    {/* Step content card */}
                    <div className="rounded-2xl border border-border bg-card shadow-card p-5 sm:p-6 lg:p-8 ml-0 lg:ml-0">
                      <StepComponent />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* ── CTA Strip ────────────────────────────────────── */}
        <section className="border-t border-border">
          <div className="relative overflow-hidden">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_100%,hsl(var(--primary)/0.06),transparent_70%)] pointer-events-none" />
            <div className="relative w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20 lg:py-24">
              <div className="max-w-2xl mx-auto text-center">
                <div className="inline-flex items-center gap-2 bg-primary/10 border border-primary/20 rounded-full px-4 py-1.5 mb-6">
                  <span className="text-xs font-semibold uppercase tracking-widest text-primary">
                    Ready to Move Forward?
                  </span>
                </div>
                <h2 className="text-3xl sm:text-4xl font-bold text-foreground tracking-tight leading-tight mb-4">
                  We've guided 400+ buyers through
                  <span className="text-gradient-gold"> every one of these steps.</span>
                </h2>
                <p className="text-muted-foreground leading-relaxed mb-8 text-sm sm:text-base">
                  Book a free 20-minute strategy call with a presale specialist. We'll review your timeline, budget, and the projects that make sense for you — at no extra cost to you.
                </p>
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  <Button size="lg" asChild className="gap-2 shadow-gold-glow">
                    <Link to="/contact">
                      <Phone size={15} />
                      Book a Free Strategy Call
                    </Link>
                  </Button>
                  <Button variant="outline" size="lg" asChild className="gap-2">
                    <Link to="/presale-projects">
                      Browse Projects
                      <ArrowRight size={15} />
                    </Link>
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </section>

      </main>
      <Footer />
    </>
  );
}
