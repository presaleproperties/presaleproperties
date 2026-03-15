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
      </Helmet>

      <style>{`
        @keyframes stepFadeUp {
          from { opacity: 0; transform: translateY(14px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes stepFadeDown {
          from { opacity: 0; transform: translateY(-14px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .step-enter-forward { animation: stepFadeUp 0.32s ease-out forwards; }
        .step-enter-back    { animation: stepFadeDown 0.32s ease-out forwards; }
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>

      <ConversionHeader />

      <main className="min-h-screen bg-background">

        {/* ── Hero ─────────────────────────────────────────────── */}
        <section className="bg-gradient-to-b from-secondary/60 to-background border-b border-border">
          <div className="container max-w-5xl mx-auto px-4 lg:px-6 py-12 lg:py-16">
            {/* Eyebrow */}
            <div className="flex items-center gap-2 mb-4">
              <Shield size={13} className="text-primary" />
              <span className="text-xs font-semibold uppercase tracking-widest text-primary">
                Expert Help. No Extra Cost.
              </span>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-end">
              <div>
                <h1 className="text-4xl md:text-5xl font-bold text-foreground tracking-tight leading-[1.05] mb-4">
                  How to Buy a Presale
                  <span className="text-primary"> in Vancouver</span>
                </h1>
                <p className="text-muted-foreground leading-relaxed max-w-lg">
                  An 8-step guide to navigating the presale condo process — from pre-approval through to receiving your keys. No fluff. Just clarity.
                </p>
              </div>

              {/* Trust signals */}
              <div className="flex flex-wrap gap-4 lg:justify-end">
                {[
                  { value: "400+", label: "Happy Clients" },
                  { value: "$200M+", label: "In Sales" },
                  { value: "5.0 ★", label: "Google Rating" },
                ].map((stat) => (
                  <div key={stat.label} className="text-center">
                    <p className="text-2xl font-bold text-primary leading-none">{stat.value}</p>
                    <p className="text-xs text-muted-foreground mt-0.5 font-medium">{stat.label}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ── Step navigator + content ──────────────────────────── */}
        <section className="container max-w-5xl mx-auto px-4 lg:px-6 py-10 lg:py-14">

          {/* Navigator */}
          <div className="mb-8 lg:mb-10">
            <StepNavigator
              currentStep={currentStep}
              totalSteps={STEPS.length}
              steps={STEPS}
              onStepClick={goToStep}
            />
          </div>

          {/* Step label pill */}
          <div className="flex items-center gap-3 mb-8" ref={contentRef}>
            <div className="h-5 w-0.5 bg-primary rounded-full" />
            <span className="text-xs font-semibold uppercase tracking-widest text-primary">
              Step {currentStep} of {STEPS.length} — {STEPS[currentStep - 1].label}
            </span>
          </div>

          {/* Animated step content */}
          <div
            key={currentStep}
            className={visible
              ? (direction === "forward" ? "step-enter-forward" : "step-enter-back")
              : "opacity-0"
            }
          >
            <StepContent />
          </div>

          {/* ── Prev / Next navigation ───────────────────────── */}
          <div className="mt-12 lg:mt-16 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            {/* Prev */}
            <Button
              variant="outline"
              size="lg"
              onClick={() => goToStep(currentStep - 1)}
              disabled={currentStep === 1}
              className="gap-2"
            >
              <ArrowLeft size={15} />
              Previous Step
            </Button>

            {/* Step dots */}
            <div className="hidden sm:flex items-center gap-1.5">
              {STEPS.map((s) => (
                <button
                  key={s.number}
                  onClick={() => goToStep(s.number)}
                  className="rounded-full transition-all duration-200 hover:opacity-80"
                  style={{
                    width: s.number === currentStep ? "20px" : "7px",
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

            {/* Next */}
            {currentStep < STEPS.length ? (
              <Button
                size="lg"
                onClick={() => goToStep(currentStep + 1)}
                className="gap-2"
              >
                Next Step
                <ArrowRight size={15} />
              </Button>
            ) : (
              <Button size="lg" onClick={() => goToStep(1)} className="gap-2">
                <RotateCcw size={14} />
                Start Over
              </Button>
            )}
          </div>
        </section>

        {/* ── CTA strip ────────────────────────────────────────── */}
        <section className="border-t border-border bg-secondary/40">
          <div className="container max-w-5xl mx-auto px-4 lg:px-6 py-12 lg:py-16">
            <div className="rounded-2xl border border-border bg-card shadow-card p-8 lg:p-12">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <Building2 size={14} className="text-primary" />
                    <span className="text-xs font-semibold uppercase tracking-widest text-primary">
                      Ready to move forward?
                    </span>
                  </div>
                  <h2 className="text-2xl md:text-3xl font-bold text-foreground tracking-tight leading-tight mb-3">
                    We've helped 400+ buyers navigate this process.
                  </h2>
                  <p className="text-muted-foreground leading-relaxed text-sm">
                    Get a free 20-minute strategy call with a presale specialist. We'll review your timeline, budget, and the projects that make sense for you — at no extra cost.
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row lg:flex-col xl:flex-row gap-3 lg:justify-end">
                  <Button size="xl" asChild className="gap-2 shadow-gold">
                    <Link to="/contact">
                      <Phone size={15} />
                      Book a Free Call
                    </Link>
                  </Button>
                  <Button variant="outline" size="xl" onClick={() => goToStep(1)} className="gap-2">
                    <RotateCcw size={14} />
                    Review the Process
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
