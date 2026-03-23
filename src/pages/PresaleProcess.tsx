import { useState, useRef } from "react";
import { Helmet } from "react-helmet-async";
import { ConversionHeader } from "@/components/conversion/ConversionHeader";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { StepNavigator } from "@/components/presale-process/StepNavigator";
import { StepGetPreApproved } from "@/components/presale-process/StepGetPreApproved";
import { StepRegisterAccess } from "@/components/presale-process/StepRegisterAccess";
import { StepChooseUnit } from "@/components/presale-process/StepChooseUnit";
import { StepSignContract } from "@/components/presale-process/StepSignContract";
import { StepPayDeposits } from "@/components/presale-process/StepPayDeposits";
import { StepTrackConstruction } from "@/components/presale-process/StepTrackConstruction";
import { StepPDI } from "@/components/presale-process/StepPDI";
import { StepCompletionKeys } from "@/components/presale-process/StepCompletionKeys";
import { Phone, ArrowRight, ArrowLeft, RotateCcw, Shield, Building2 } from "lucide-react";
import { Link } from "react-router-dom";

const STEPS = [
  { number: 1, label: "Pre-Approval" },
  { number: 2, label: "VIP Access" },
  { number: 3, label: "Choose Unit" },
  { number: 4, label: "Sign Contract" },
  { number: 5, label: "Pay Deposits" },
  { number: 6, label: "Construction" },
  { number: 7, label: "PDI" },
  { number: 8, label: "Completion" },
];

const STEP_COMPONENTS: Record<number, React.ComponentType> = {
  1: StepGetPreApproved,
  2: StepRegisterAccess,
  3: StepChooseUnit,
  4: StepSignContract,
  5: StepPayDeposits,
  6: StepTrackConstruction,
  7: StepPDI,
  8: StepCompletionKeys,
};

export default function PresaleProcess() {
  const [currentStep, setCurrentStep] = useState(1);
  const [animating, setAnimating] = useState(false);
  const [direction, setDirection] = useState<"forward" | "back">("forward");
  const [visible, setVisible] = useState(true);
  const contentRef = useRef<HTMLDivElement>(null);

  const goToStep = (step: number) => {
    if (step === currentStep || animating) return;
    setDirection(step > currentStep ? "forward" : "back");
    setAnimating(true);
    setVisible(false);

    setTimeout(() => {
      setCurrentStep(step);
      setVisible(true);
      setAnimating(false);
      contentRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 260);
  };

  const StepContent = STEP_COMPONENTS[currentStep];

  return (
    <>
      <Helmet>
        <title>How to Buy a Presale Condo in Vancouver — 8-Step Guide | Presale Properties</title>
        <meta
          name="description"
          content="A complete 8-step guide to buying a presale condo in Vancouver, BC — from pre-approval to receiving your keys. Expert guidance at no extra cost."
        />
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
          "step": [
            {"@type":"HowToStep","position":1,"name":"Get Pre-Approved","text":"Get mortgage pre-approval before searching presale condos in Vancouver."},
            {"@type":"HowToStep","position":2,"name":"Get VIP Access","text":"Register for VIP access to get floor plans and pricing before public launch."},
            {"@type":"HowToStep","position":3,"name":"Choose Your Unit","text":"Select your floor plan, unit, and finishes from available inventory."},
            {"@type":"HowToStep","position":4,"name":"Sign the Contract","text":"Review and sign the presale contract with your lawyer during the rescission period."},
            {"@type":"HowToStep","position":5,"name":"Pay Deposits","text":"Pay deposit installments per the schedule — typically 5-20% total over 12-18 months."},
            {"@type":"HowToStep","position":6,"name":"Track Construction","text":"Monitor build progress and stay updated with developer communications."},
            {"@type":"HowToStep","position":7,"name":"Walkthrough","text":"Inspect your unit with the developer before completion to document any deficiencies."},
            {"@type":"HowToStep","position":8,"name":"Completion & Keys","text":"Complete the purchase, receive your keys, and move into your new presale home."}
          ]
        })}</script>
        <script type="application/ld+json">{JSON.stringify({
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          "itemListElement": [
            {"@type":"ListItem","position":1,"name":"Home","item":"https://presaleproperties.com"},
            {"@type":"ListItem","position":2,"name":"Presale Process","item":"https://presaleproperties.com/presale-process"}
          ]
        })}</script>
      </Helmet>

      <style>{`
        @keyframes stepFadeUp {
          from { opacity: 0; transform: translateY(12px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes stepFadeDown {
          from { opacity: 0; transform: translateY(-12px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .step-enter-forward { animation: stepFadeUp 0.3s ease-out forwards; }
        .step-enter-back    { animation: stepFadeDown 0.3s ease-out forwards; }
        /* hide nav scrollbar */
        .nav-scroll::-webkit-scrollbar { display: none; }
        .nav-scroll { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>

      <ConversionHeader />

      <main className="min-h-screen bg-background">

        {/* ── Hero ─────────────────────────────────────────────── */}
        <section className="bg-gradient-to-b from-secondary/60 to-background border-b border-border">
          <div className="w-full max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-12 lg:py-16">

            {/* Eyebrow */}
            <div className="flex items-center gap-2 mb-3 sm:mb-4">
              <Shield size={13} className="text-primary flex-shrink-0" />
              <span className="text-xs font-semibold uppercase tracking-widest text-primary">
                Expert Help. No Extra Cost.
              </span>
            </div>

            {/* Heading + trust stats: stack on mobile, side-by-side lg+ */}
            <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6 lg:gap-10">
              <div className="min-w-0">
                <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-foreground tracking-tight leading-[1.07] mb-3 sm:mb-4">
                  How to Buy a Presale
                  <span className="text-primary"> in Vancouver</span>
                </h1>
                <p className="text-sm sm:text-base text-muted-foreground leading-relaxed max-w-lg">
                  An 8-step guide to navigating the presale condo process — from pre-approval through to receiving your keys.
                </p>
              </div>

              {/* Trust signals row — always horizontal, even on mobile */}
              <div className="flex items-center gap-6 sm:gap-8 flex-shrink-0">
                {[
                  { value: "400+", label: "Happy Clients" },
                  { value: "$200M+", label: "In Sales" },
                  { value: "5.0 ★", label: "Google Rating" },
                ].map((stat) => (
                  <div key={stat.label} className="text-center">
                    <p className="text-xl sm:text-2xl font-bold text-primary leading-none">{stat.value}</p>
                    <p className="text-[10px] sm:text-xs text-muted-foreground mt-0.5 font-medium whitespace-nowrap">{stat.label}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ── Step navigator + content ──────────────────────────── */}
        <section className="w-full max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10 lg:py-14">

          {/* Navigator */}
          <div className="mb-6 sm:mb-8 lg:mb-10 nav-scroll">
            <StepNavigator
              currentStep={currentStep}
              totalSteps={STEPS.length}
              steps={STEPS}
              onStepClick={goToStep}
            />
          </div>

          {/* Current step label */}
          <div className="flex items-center gap-2.5 mb-6 sm:mb-8" ref={contentRef}>
            <div className="h-4 sm:h-5 w-0.5 bg-primary rounded-full flex-shrink-0" />
            <span className="text-[10px] sm:text-xs font-semibold uppercase tracking-widest text-primary">
              Step {currentStep} of {STEPS.length} — {STEPS[currentStep - 1].label}
            </span>
          </div>

          {/* Animated step content — overflow hidden prevents any bleedout during animation */}
          <div className="overflow-hidden">
            <div
              key={currentStep}
              className={visible
                ? (direction === "forward" ? "step-enter-forward" : "step-enter-back")
                : "opacity-0 pointer-events-none"
              }
            >
              <StepContent />
            </div>
          </div>

          {/* ── Prev / Next navigation ───────────────────────────── */}
          <div className="mt-10 sm:mt-12 lg:mt-16 pt-6 sm:pt-8 border-t border-border">
            <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-between gap-3 sm:gap-4">

              {/* Prev — full width on mobile */}
              <Button
                variant="outline"
                size="lg"
                onClick={() => goToStep(currentStep - 1)}
                disabled={currentStep === 1}
                className="gap-2 w-full sm:w-auto justify-center"
              >
                <ArrowLeft size={15} />
                Previous Step
              </Button>

              {/* Step dots — centre, hidden on mobile */}
              <div className="hidden sm:flex items-center gap-1.5 flex-shrink-0">
                {STEPS.map((s) => (
                  <button
                    key={s.number}
                    onClick={() => goToStep(s.number)}
                    aria-label={`Go to step ${s.number}`}
                    className="rounded-full transition-all duration-200 hover:opacity-80"
                    style={{
                      width: s.number === currentStep ? "18px" : "7px",
                      height: "7px",
                      background: s.number === currentStep
                        ? "hsl(var(--primary))"
                        : s.number < currentStep
                        ? "hsl(var(--primary) / 0.35)"
                        : "hsl(var(--border))",
                    }}
                  />
                ))}
              </div>

              {/* Next / Start Over — full width on mobile */}
              {currentStep < STEPS.length ? (
                <Button
                  size="lg"
                  onClick={() => goToStep(currentStep + 1)}
                  className="gap-2 w-full sm:w-auto justify-center"
                >
                  Next Step
                  <ArrowRight size={15} />
                </Button>
              ) : (
                <Button
                  size="lg"
                  onClick={() => goToStep(1)}
                  className="gap-2 w-full sm:w-auto justify-center"
                >
                  <RotateCcw size={14} />
                  Start Over
                </Button>
              )}
            </div>
          </div>
        </section>

        {/* ── CTA strip ────────────────────────────────────────── */}
        <section className="border-t border-border bg-secondary/40">
          <div className="w-full max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-12 lg:py-16">
            <div className="rounded-xl sm:rounded-2xl border border-border bg-card shadow-card p-6 sm:p-8 lg:p-12">
              <div className="flex flex-col gap-6 sm:gap-8 lg:flex-row lg:items-center lg:justify-between">

                {/* Copy */}
                <div className="min-w-0">
                  <div className="flex items-center gap-2 mb-2 sm:mb-3">
                    <Building2 size={13} className="text-primary flex-shrink-0" />
                    <span className="text-xs font-semibold uppercase tracking-widest text-primary">
                      Ready to move forward?
                    </span>
                  </div>
                  <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-foreground tracking-tight leading-tight mb-2 sm:mb-3">
                    We've helped 400+ buyers navigate this process.
                  </h2>
                  <p className="text-muted-foreground leading-relaxed text-sm max-w-lg">
                    Get a free 20-minute strategy call with a presale specialist. We'll review your timeline, budget, and the right projects for you — at no extra cost.
                  </p>
                </div>

                {/* CTAs — vertical on mobile, horizontal on sm+ */}
                <div className="flex flex-col sm:flex-row gap-3 flex-shrink-0">
                  <Button size="lg" asChild className="gap-2 shadow-gold w-full sm:w-auto justify-center">
                    <Link to="/contact">
                      <Phone size={15} />
                      Book a Free Call
                    </Link>
                  </Button>
                  <Button variant="outline" size="lg" onClick={() => goToStep(1)} className="gap-2 w-full sm:w-auto justify-center">
                    <RotateCcw size={14} />
                    Review Process
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
