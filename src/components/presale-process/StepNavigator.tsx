import { cn } from "@/lib/utils";

interface StepNavigatorProps {
  currentStep: number;
  totalSteps: number;
  steps: { number: number; label: string }[];
  onStepClick: (step: number) => void;
}

export function StepNavigator({ currentStep, totalSteps, steps, onStepClick }: StepNavigatorProps) {
  return (
    <div className="w-full">
      {/* Progress bar */}
      <div className="h-1.5 w-full bg-secondary rounded-full mb-5 overflow-hidden">
        <div
          className="h-full bg-primary rounded-full transition-all duration-500 ease-out"
          style={{ width: `${((currentStep - 1) / (totalSteps - 1)) * 100}%` }}
        />
      </div>

      {/* Step tabs — scrollable on mobile, distribute evenly on larger screens */}
      <div
        className="flex items-stretch border-b border-border overflow-x-auto"
        style={{ WebkitOverflowScrolling: "touch", scrollbarWidth: "none", msOverflowStyle: "none" }}
      >
        {steps.map((step) => {
          const isActive = step.number === currentStep;
          const isCompleted = step.number < currentStep;
          return (
            <button
              key={step.number}
              onClick={() => onStepClick(step.number)}
              aria-label={`Step ${step.number}: ${step.label}`}
              className={cn(
                "relative flex flex-col items-center justify-center gap-0.5",
                // Mobile: fixed width so all 8 fit within scroll; tablet+: flex-1
                "min-w-[52px] sm:min-w-0 sm:flex-1",
                "px-1.5 sm:px-3 py-2.5 sm:pb-3",
                // Touch target
                "min-h-[52px]",
                "transition-all duration-200 select-none",
                isActive ? "opacity-100" : isCompleted ? "opacity-65 hover:opacity-85" : "opacity-30 hover:opacity-50"
              )}
            >
              {/* Step number */}
              <span
                className={cn(
                  "font-bold tabular-nums leading-none transition-colors duration-200",
                  // Smaller on mobile to prevent overflow
                  "text-base sm:text-xl md:text-2xl",
                  isActive ? "text-primary" : isCompleted ? "text-primary/70" : "text-muted-foreground"
                )}
              >
                {String(step.number).padStart(2, "0")}
              </span>
              {/* Label — visible sm+ only */}
              <span
                className={cn(
                  "text-[9px] sm:text-[10px] uppercase tracking-wide text-center leading-tight hidden sm:block font-medium",
                  "whitespace-nowrap overflow-hidden text-ellipsis w-full text-center",
                  isActive ? "text-foreground" : "text-muted-foreground"
                )}
                style={{ maxWidth: "72px" }}
              >
                {step.label}
              </span>
              {/* Active underline */}
              <div
                className={cn(
                  "absolute bottom-0 left-0 right-0 h-0.5 transition-all duration-300",
                  isActive ? "bg-primary" : "bg-transparent"
                )}
              />
            </button>
          );
        })}
      </div>
    </div>
  );
}
