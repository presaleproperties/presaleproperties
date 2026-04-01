import { cn } from "@/lib/utils";
import { Check } from "lucide-react";

const steps = [
  { num: 1, label: "Select Project" },
  { num: 2, label: "Inventory Details" },
  { num: 3, label: "Add Units" },
  { num: 4, label: "Review & Publish" },
];

export function WizardProgress({ currentStep }: { currentStep: number }) {
  return (
    <div className="flex items-center gap-2">
      {steps.map((s, i) => (
        <div key={s.num} className="flex items-center gap-2 flex-1">
          <div className="flex items-center gap-2 flex-shrink-0">
            <div
              className={cn(
                "w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-colors",
                currentStep > s.num
                  ? "bg-primary text-primary-foreground"
                  : currentStep === s.num
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground"
              )}
            >
              {currentStep > s.num ? <Check className="h-4 w-4" /> : s.num}
            </div>
            <span
              className={cn(
                "text-sm font-medium hidden sm:inline",
                currentStep >= s.num ? "text-foreground" : "text-muted-foreground"
              )}
            >
              {s.label}
            </span>
          </div>
          {i < steps.length - 1 && (
            <div
              className={cn(
                "flex-1 h-0.5 rounded-full",
                currentStep > s.num ? "bg-primary" : "bg-muted"
              )}
            />
          )}
        </div>
      ))}
    </div>
  );
}
