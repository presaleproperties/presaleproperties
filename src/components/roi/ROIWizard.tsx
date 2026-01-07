import { useState } from "react";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Calculator } from "lucide-react";
import { ROIInputs, ROIResults } from "@/types/roi";
import { PropertyFinancingStep } from "./steps/PropertyFinancingStep";
import { IncomeExpensesStep } from "./steps/IncomeExpensesStep";
import { ClosingExitStep } from "./steps/ClosingExitStep";
import { ROIResultsDisplay } from "./ROIResultsDisplay";
import { SavedAnalysis } from "@/hooks/useSavedAnalyses";

interface ROIWizardProps {
  inputs: ROIInputs;
  results: ROIResults;
  activeScenario: 'conservative' | 'base' | 'aggressive';
  updateInputs: (section: keyof ROIInputs, field: string, value: number | string | boolean | null) => void;
  applyScenario: (scenario: 'conservative' | 'base' | 'aggressive') => void;
  resetInputs: () => void;
  onTrackEvent?: (event: string) => void;
  // Compare feature props
  savedAnalyses?: SavedAnalysis[];
  canSave?: boolean;
  canCompare?: boolean;
  maxSaved?: number;
  onSaveAnalysis?: (inputs: ROIInputs, results: ROIResults) => { success: boolean; error?: string };
  onDeleteAnalysis?: (id: string) => void;
  onCompare?: () => void;
}

const STEPS = [
  { id: 1, title: "Property & Financing", shortTitle: "Property" },
  { id: 2, title: "Income & Expenses", shortTitle: "Income" },
  { id: 3, title: "Closing & Exit", shortTitle: "Exit" },
  { id: 4, title: "Results", shortTitle: "Results" },
];

export function ROIWizard({
  inputs,
  results,
  activeScenario,
  updateInputs,
  applyScenario,
  resetInputs,
  onTrackEvent,
  savedAnalyses,
  canSave,
  canCompare,
  maxSaved,
  onSaveAnalysis,
  onDeleteAnalysis,
  onCompare,
}: ROIWizardProps) {
  const [currentStep, setCurrentStep] = useState(1);

  const progress = (currentStep / STEPS.length) * 100;

  const handleNext = () => {
    if (currentStep < STEPS.length) {
      setCurrentStep(currentStep + 1);
      if (currentStep === 3) {
        onTrackEvent?.("roi_calc_completed");
      }
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleStepClick = (stepId: number) => {
    setCurrentStep(stepId);
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <PropertyFinancingStep
            purchase={inputs.purchase}
            financing={inputs.financing}
            updatePurchase={(field, value) => updateInputs("purchase", field, value)}
            updateFinancing={(field, value) => updateInputs("financing", field, value)}
          />
        );
      case 2:
        return (
          <IncomeExpensesStep
            rental={inputs.rental}
            expenses={inputs.expenses}
            updateRental={(field, value) => updateInputs("rental", field, value)}
            updateExpenses={(field, value) => updateInputs("expenses", field, value)}
          />
        );
      case 3:
        return (
          <ClosingExitStep
            exit={inputs.exit}
            purchasePrice={inputs.purchase.purchasePrice}
            updateInputs={(field, value) => updateInputs("exit", field, value)}
          />
        );
      case 4:
        return (
          <ROIResultsDisplay
            inputs={inputs}
            results={results}
            activeScenario={activeScenario}
            applyScenario={applyScenario}
            onTrackEvent={onTrackEvent}
            savedAnalyses={savedAnalyses}
            canSave={canSave}
            canCompare={canCompare}
            maxSaved={maxSaved}
            onSaveAnalysis={onSaveAnalysis}
            onDeleteAnalysis={onDeleteAnalysis}
            onCompare={onCompare}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Progress bar */}
      <div className="space-y-3">
        <Progress value={progress} className="h-2" />
        
        {/* Step indicators */}
        <div className="flex justify-between gap-1">
          {STEPS.map((step) => (
            <button
              key={step.id}
              onClick={() => handleStepClick(step.id)}
              className={`flex-1 py-2 px-1 text-xs sm:text-sm font-medium rounded-md transition-colors ${
                currentStep === step.id
                  ? "bg-primary text-primary-foreground"
                  : currentStep > step.id
                  ? "bg-primary/20 text-primary hover:bg-primary/30"
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              }`}
            >
              <span className="hidden sm:inline">{step.title}</span>
              <span className="sm:hidden">{step.shortTitle}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Current step content */}
      <div className="min-h-[400px]">
        {renderStep()}
      </div>

      {/* Navigation buttons */}
      {currentStep < 4 && (
        <div className="flex justify-between gap-4 pt-4 border-t">
          <Button
            variant="outline"
            onClick={handleBack}
            disabled={currentStep === 1}
            className="flex items-center gap-2"
          >
            <ChevronLeft className="h-4 w-4" />
            Back
          </Button>
          
          <Button
            onClick={handleNext}
            className="flex items-center gap-2"
          >
            {currentStep === 3 ? (
              <>
                <Calculator className="h-4 w-4" />
                Calculate ROI
              </>
            ) : (
              <>
                Next
                <ChevronRight className="h-4 w-4" />
              </>
            )}
          </Button>
        </div>
      )}

      {currentStep === 4 && (
        <div className="flex justify-center pt-4 border-t">
          <Button
            variant="outline"
            onClick={() => {
              resetInputs();
              setCurrentStep(1);
            }}
          >
            Start New Calculation
          </Button>
        </div>
      )}
    </div>
  );
}
