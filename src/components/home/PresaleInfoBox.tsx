import { ClipboardList, Check } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

interface PresaleInfoBoxProps {
  completionYear?: number | null;
  completionMonth?: number | null;
}

const getMonthName = (month: number) => {
  return new Date(2000, month - 1).toLocaleString("default", { month: "long" });
};

export function PresaleInfoBox({ completionYear, completionMonth }: PresaleInfoBoxProps) {
  const timeframe = completionYear 
    ? completionMonth 
      ? `${getMonthName(completionMonth)} ${completionYear}`
      : `${completionYear}`
    : "upon completion";

  return (
    <Alert className="bg-primary/5 border-primary/20 mb-6">
      <ClipboardList className="h-4 w-4 text-primary" />
      <AlertTitle className="text-sm font-semibold text-foreground">
        Presale Project (Pre-Construction)
      </AlertTitle>
      <AlertDescription className="text-sm text-muted-foreground">
        Purchase now, take possession when construction completes in {timeframe}. Your new home will be built brand new with full warranty.
      </AlertDescription>
    </Alert>
  );
}

export function PresaleBenefits() {
  const benefits = [
    "Lock in today's pricing",
    "Full 2-5-10 new home warranty",
    "First-time buyer rebates eligible",
    "Brand new, never lived in",
    "Modern finishes and layouts",
  ];

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold text-foreground">What You Get With Presale</h3>
      <ul className="space-y-2">
        {benefits.map((benefit) => (
          <li key={benefit} className="flex items-center gap-2 text-sm text-muted-foreground">
            <Check className="h-4 w-4 text-primary shrink-0" />
            <span>{benefit}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
