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
      <div className="h-[2px] w-full bg-[rgba(201,169,110,0.12)] mb-6 relative">
        <div
          className="h-full bg-[#C9A96E] transition-all duration-500 ease-out"
          style={{ width: `${((currentStep - 1) / (totalSteps - 1)) * 100}%` }}
        />
      </div>

      {/* Step pills */}
      <div className="flex items-start gap-0 overflow-x-auto scrollbar-hide pb-1">
        {steps.map((step, idx) => {
          const isActive = step.number === currentStep;
          const isCompleted = step.number < currentStep;
          return (
            <button
              key={step.number}
              onClick={() => onStepClick(step.number)}
              className={`flex flex-col items-center gap-1.5 px-3 md:px-4 min-w-[60px] md:min-w-[80px] group flex-1 transition-all duration-200 ${
                isActive ? "opacity-100" : isCompleted ? "opacity-60 hover:opacity-80" : "opacity-30 hover:opacity-50"
              }`}
            >
              {/* Numeral */}
              <span
                className="font-['Cormorant_Garamond'] font-light leading-none transition-all duration-200"
                style={{
                  fontSize: "clamp(22px, 3vw, 36px)",
                  color: isActive ? "#C9A96E" : isCompleted ? "#C9A96E" : "#8A8078",
                }}
              >
                {String(step.number).padStart(2, "0")}
              </span>
              {/* Label */}
              <span
                className="text-[10px] md:text-[11px] tracking-wide text-center leading-tight hidden sm:block"
                style={{ color: isActive ? "#F5F0E8" : "#8A8078", fontFamily: "DM Sans, sans-serif" }}
              >
                {step.label}
              </span>
              {/* Bottom indicator */}
              <div
                className="h-[2px] w-full transition-all duration-300"
                style={{
                  background: isActive ? "#C9A96E" : "transparent",
                }}
              />
            </button>
          );
        })}
      </div>
    </div>
  );
}
