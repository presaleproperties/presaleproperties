import { useState } from "react";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Calculator } from "lucide-react";
import { ROIInputs, ROIResults } from "@/types/roi";
import { PurchaseStep } from "./steps/PurchaseStep";
import { FinancingStep } from "./steps/FinancingStep";
import { RentalIncomeStep } from "./steps/RentalIncomeStep";
import { OperatingExpensesStep } from "./steps/OperatingExpensesStep";
import { ExitAssumptionsStep } from "./steps/ExitAssumptionsStep";
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
  { id: 1, title: "Purchase", shortTitle: "Purchase" },
  { id: 2, title: "Financing", shortTitle: "Finance" },
  { id: 3, title: "Rental Income", shortTitle: "Rental" },
  { id: 4, title: "Expenses", shortTitle: "Costs" },
  { id: 5, title: "Exit", shortTitle: "Exit" },
  { id: 6, title: "Results", shortTitle: "Results" },
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
      if (currentStep === 5) {
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
          <PurchaseStep
            purchase={inputs.purchase}
            updateInputs={(field, value) => updateInputs("purchase", field, value)}
          />
        );
      case 2:
        return (
          <FinancingStep
            financing={inputs.financing}
            purchasePrice={inputs.purchase.purchasePrice}
            updateInputs={(field, value) => updateInputs("financing", field, value)}
          />
        );
      case 3:
        return (
          <RentalIncomeStep
            rental={inputs.rental}
            updateInputs={(field, value) => updateInputs("rental", field, value)}
          />
        );
      case 4:
        return (
          <OperatingExpensesStep
            expenses={inputs.expenses}
            updateInputs={(field, value) => updateInputs("expenses", field, value)}
          />
        );
      case 5:
        return (
          <ExitAssumptionsStep
            exit={inputs.exit}
            purchasePrice={inputs.purchase.purchasePrice}
            updateInputs={(field, value) => updateInputs("exit", field, value)}
          />
        );
      case 6:
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
      {currentStep < 6 && (
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
            {currentStep === 5 ? (
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

      {currentStep === 6 && (
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
