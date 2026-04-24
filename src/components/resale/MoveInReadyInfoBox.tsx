import { Zap, Check, Calendar } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

interface MoveInReadyInfoBoxProps {
  yearBuilt?: number | null;
}

export function MoveInReadyInfoBox({ yearBuilt }: MoveInReadyInfoBoxProps) {
  // Calculate months old if year_built is provided
  const getAge = () => {
    if (!yearBuilt) return null;
    const now = new Date();
    const builtDate = new Date(yearBuilt, 0, 1); // Jan 1 of built year
    const monthsOld = Math.max(0, Math.floor((now.getTime() - builtDate.getTime()) / (1000 * 60 * 60 * 24 * 30)));
    return monthsOld;
  };

  const monthsOld = getAge();
  const builtLabel = yearBuilt ? `Built ${yearBuilt}` : "Recently completed";
  const ageLabel = monthsOld !== null && monthsOld < 12 ? ` • ${monthsOld} months old` : "";

  return (
    <Alert className="bg-success/5 border-success/20 mb-6">
      <Zap className="h-4 w-4 text-success" />
      <AlertTitle className="text-sm font-semibold text-foreground flex flex-wrap items-center gap-2">
        Move-In Ready – Brand New
        <span className="text-xs font-normal text-muted-foreground">
          {builtLabel}{ageLabel}
        </span>
      </AlertTitle>
      <AlertDescription className="text-sm text-muted-foreground">
        Never lived in • Move in within 30-60 days. This is fresh new construction available now.
      </AlertDescription>
    </Alert>
  );
}

export function MoveInReadyBenefits() {
  const benefits = [
    "No waiting - available now",
    "See the actual unit before buying",
    "Full 2-5-10 new home warranty",
    "Never lived in - you're the first owner",
    "First-time buyer rebates eligible",
    "Immediate rental income for investors",
  ];

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold text-foreground">Why Move-In Ready New Construction?</h3>
      <ul className="space-y-2">
        {benefits.map((benefit) => (
          <li key={benefit} className="flex items-center gap-2 text-sm text-muted-foreground">
            <Check className="h-4 w-4 text-success shrink-0" />
            <span>{benefit}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
