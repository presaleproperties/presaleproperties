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
      <div className="h-1.5 w-full bg-secondary rounded-full mb-6 overflow-hidden">
        <div
          className="h-full bg-primary rounded-full transition-all duration-500 ease-out"
          style={{ width: `${((currentStep - 1) / (totalSteps - 1)) * 100}%` }}
        />
      </div>

      {/* Step tabs */}
      <div className="flex items-stretch overflow-x-auto scrollbar-hide gap-0 border-b border-border">
        {steps.map((step) => {
          const isActive = step.number === currentStep;
          const isCompleted = step.number < currentStep;
          return (
            <button
              key={step.number}
              onClick={() => onStepClick(step.number)}
              className={cn(
                "relative flex flex-col items-center gap-1 px-2 md:px-4 pb-3 pt-1 min-w-[56px] md:min-w-[72px] flex-1 transition-all duration-200 group",
                isActive ? "opacity-100" : isCompleted ? "opacity-70 hover:opacity-90" : "opacity-35 hover:opacity-55"
              )}
            >
              {/* Number */}
              <span
                className={cn(
                  "font-bold tabular-nums leading-none text-lg md:text-2xl transition-colors duration-200",
                  isActive ? "text-primary" : isCompleted ? "text-primary/70" : "text-muted-foreground"
                )}
              >
                {String(step.number).padStart(2, "0")}
              </span>
              {/* Label */}
              <span
                className={cn(
                  "text-[9px] md:text-[10px] uppercase tracking-wide text-center leading-tight hidden sm:block font-medium",
                  isActive ? "text-foreground" : "text-muted-foreground"
                )}
              >
                {step.label}
              </span>
              {/* Active underline */}
              <div
                className={cn(
                  "absolute bottom-0 left-0 right-0 h-0.5 rounded-full transition-all duration-300",
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
