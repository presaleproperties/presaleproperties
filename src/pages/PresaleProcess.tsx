import { useState, useEffect, useRef } from "react";
import { StepNavigator } from "@/components/presale-process/StepNavigator";
import { StepGetPreApproved } from "@/components/presale-process/StepGetPreApproved";
import { StepRegisterAccess } from "@/components/presale-process/StepRegisterAccess";
import { StepChooseUnit } from "@/components/presale-process/StepChooseUnit";
import { StepSignContract } from "@/components/presale-process/StepSignContract";
import { StepPayDeposits } from "@/components/presale-process/StepPayDeposits";
import { StepTrackConstruction } from "@/components/presale-process/StepTrackConstruction";
import { StepPDI } from "@/components/presale-process/StepPDI";
import { StepCompletionKeys } from "@/components/presale-process/StepCompletionKeys";
import { Phone, ArrowRight, ArrowLeft, RotateCcw } from "lucide-react";
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
    }, 280);
  };

  const StepContent = STEP_COMPONENTS[currentStep];

  return (
    <div
      className="min-h-screen"
      style={{ background: "#0D0D0D", fontFamily: "DM Sans, sans-serif" }}
    >
      {/* Load fonts */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@300;400;500;600&family=DM+Sans:wght@300;400;500;600&display=swap');
        
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
        
        @keyframes stepFadeUp {
          from { opacity: 0; transform: translateY(18px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes stepFadeDown {
          from { opacity: 0; transform: translateY(-18px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .step-enter-forward { animation: stepFadeUp 0.35s ease-out forwards; }
        .step-enter-back    { animation: stepFadeDown 0.35s ease-out forwards; }
      `}</style>

      {/* Top accent line */}
      <div className="w-full h-[2px]" style={{ background: "#C9A96E" }} />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-10 py-10 lg:py-16">

        {/* Header */}
        <div className="mb-10 lg:mb-14">
          <p
            className="text-[10px] uppercase tracking-[0.25em] mb-3"
            style={{ color: "#C9A96E", fontFamily: "DM Sans, sans-serif" }}
          >
            Presale Properties · Vancouver, BC
          </p>
          <h1
            className="font-['Cormorant_Garamond'] font-light leading-[1.05] mb-4"
            style={{ fontSize: "clamp(32px, 5vw, 60px)", color: "#F5F0E8" }}
          >
            How to Buy a Presale<br />
            <span style={{ color: "#C9A96E" }}>in Vancouver</span>
          </h1>
          <p
            className="text-sm max-w-xl leading-relaxed"
            style={{ color: "#8A8078", fontFamily: "DM Sans, sans-serif" }}
          >
            An 8-step guide to navigating the presale condo process — from pre-approval through to receiving your keys. No fluff. Just clarity.
          </p>
        </div>

        {/* Step Navigator */}
        <div className="mb-10 lg:mb-12">
          <StepNavigator
            currentStep={currentStep}
            totalSteps={STEPS.length}
            steps={STEPS}
            onStepClick={goToStep}
          />
        </div>

        {/* Step label */}
        <div className="mb-8 flex items-center gap-3">
          <div
            className="h-6 w-[2px]"
            style={{ background: "#C9A96E" }}
          />
          <p
            className="text-xs uppercase tracking-[0.2em]"
            style={{ color: "#C9A96E", fontFamily: "DM Sans, sans-serif" }}
          >
            Step {currentStep} of {STEPS.length} — {STEPS[currentStep - 1].label}
          </p>
        </div>

        {/* Step Content */}
        <div ref={contentRef}>
          <div
            key={currentStep}
            className={visible ? (direction === "forward" ? "step-enter-forward" : "step-enter-back") : "opacity-0"}
          >
            <StepContent />
          </div>
        </div>

        {/* Navigation buttons */}
        <div className="mt-12 lg:mt-16 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          {/* Prev */}
          <button
            onClick={() => goToStep(currentStep - 1)}
            disabled={currentStep === 1}
            className="flex items-center gap-2 px-6 py-3 text-sm transition-all duration-200 disabled:opacity-20 disabled:cursor-not-allowed"
            style={{
              border: "1px solid rgba(201,169,110,0.4)",
              color: "#C9A96E",
              borderRadius: "2px",
              fontFamily: "DM Sans, sans-serif",
              background: "transparent",
            }}
            onMouseEnter={e => { if (currentStep !== 1) (e.currentTarget as HTMLButtonElement).style.background = "rgba(201,169,110,0.08)"; }}
            onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = "transparent"; }}
          >
            <ArrowLeft size={15} />
            Previous Step
          </button>

          {/* Step dots */}
          <div className="hidden sm:flex items-center gap-1.5">
            {STEPS.map((s) => (
              <button
                key={s.number}
                onClick={() => goToStep(s.number)}
                className="transition-all duration-200"
                style={{
                  width: s.number === currentStep ? "20px" : "6px",
                  height: "6px",
                  borderRadius: "1px",
                  background: s.number === currentStep
                    ? "#C9A96E"
                    : s.number < currentStep
                    ? "rgba(201,169,110,0.4)"
                    : "rgba(255,255,255,0.12)",
                }}
              />
            ))}
          </div>

          {/* Next */}
          {currentStep < STEPS.length ? (
            <button
              onClick={() => goToStep(currentStep + 1)}
              className="flex items-center gap-2 px-6 py-3 text-sm font-medium transition-all duration-200"
              style={{
                background: "#C9A96E",
                color: "#0D0D0D",
                borderRadius: "2px",
                fontFamily: "DM Sans, sans-serif",
                border: "none",
              }}
              onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = "#D4B07A"; }}
              onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = "#C9A96E"; }}
            >
              Next Step
              <ArrowRight size={15} />
            </button>
          ) : (
            <button
              onClick={() => goToStep(1)}
              className="flex items-center gap-2 px-6 py-3 text-sm font-medium transition-all duration-200"
              style={{
                background: "#C9A96E",
                color: "#0D0D0D",
                borderRadius: "2px",
                fontFamily: "DM Sans, sans-serif",
                border: "none",
              }}
            >
              <RotateCcw size={14} />
              Start Over
            </button>
          )}
        </div>

        {/* Divider */}
        <div className="my-14 lg:my-20" style={{ borderTop: "1px solid rgba(201,169,110,0.14)" }} />

        {/* CTA Strip */}
        <div
          className="relative p-8 lg:p-12"
          style={{
            background: "#141414",
            borderTop: "2px solid #C9A96E",
            borderRight: "1px solid rgba(201,169,110,0.18)",
            borderBottom: "1px solid rgba(201,169,110,0.18)",
            borderLeft: "1px solid rgba(201,169,110,0.18)",
            borderRadius: "3px",
          }}
        >
          <div className="max-w-2xl">
            <p
              className="text-[10px] uppercase tracking-[0.2em] mb-3"
              style={{ color: "#C9A96E", fontFamily: "DM Sans, sans-serif" }}
            >
              Ready to move forward?
            </p>
            <h3
              className="font-['Cormorant_Garamond'] font-light mb-3"
              style={{ fontSize: "clamp(24px, 3.5vw, 38px)", color: "#F5F0E8" }}
            >
              We've helped hundreds of buyers navigate this process.
            </h3>
            <p
              className="text-sm leading-relaxed mb-8 max-w-lg"
              style={{ color: "#8A8078", fontFamily: "DM Sans, sans-serif" }}
            >
              Get a free 20-minute strategy call with a presale specialist. We'll review your timeline, budget, and the projects that make sense for you.
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <Link
                to="/contact"
                className="inline-flex items-center justify-center gap-2 px-7 py-3.5 text-sm font-medium transition-all duration-200"
                style={{
                  background: "#C9A96E",
                  color: "#0D0D0D",
                  borderRadius: "2px",
                  fontFamily: "DM Sans, sans-serif",
                  textDecoration: "none",
                }}
                onMouseEnter={e => { (e.currentTarget as HTMLAnchorElement).style.background = "#D4B07A"; }}
                onMouseLeave={e => { (e.currentTarget as HTMLAnchorElement).style.background = "#C9A96E"; }}
              >
                <Phone size={14} />
                Book a Free Call
              </Link>
              <button
                onClick={() => goToStep(1)}
                className="inline-flex items-center justify-center gap-2 px-7 py-3.5 text-sm transition-all duration-200"
                style={{
                  border: "1px solid rgba(201,169,110,0.4)",
                  color: "#C9A96E",
                  borderRadius: "2px",
                  fontFamily: "DM Sans, sans-serif",
                  background: "transparent",
                }}
                onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = "rgba(201,169,110,0.08)"; }}
                onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = "transparent"; }}
              >
                <RotateCcw size={14} />
                Review the Process
              </button>
            </div>
          </div>
        </div>

        {/* Footer spacing */}
        <div className="pb-16" />
      </div>
    </div>
  );
}
