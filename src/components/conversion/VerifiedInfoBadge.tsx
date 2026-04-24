import { ShieldCheck, Info } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface VerifiedInfoBadgeProps {
  lastVerified?: string;
  source?: "builder" | "sales_center" | "public_disclosure" | "agent_confirmed";
  className?: string;
}

const SOURCE_LABELS = {
  builder: "Builder",
  sales_center: "Sales Center",
  public_disclosure: "Public Disclosure",
  agent_confirmed: "Agent Confirmed",
};

export function VerifiedInfoBadge({ 
  lastVerified, 
  source = "agent_confirmed",
  className = "" 
}: VerifiedInfoBadgeProps) {
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-CA", { 
      month: "short", 
      day: "numeric",
      year: "numeric"
    });
  };

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div className={`inline-flex items-center gap-1.5 text-xs text-muted-foreground bg-muted/50 px-2.5 py-1 rounded-full cursor-help ${className}`}>
          <ShieldCheck className="h-3.5 w-3.5 text-success" />
          <span>
            Verified {lastVerified ? formatDate(lastVerified) : "Recently"}
          </span>
          <Info className="h-3 w-3 opacity-50" />
        </div>
      </TooltipTrigger>
      <TooltipContent side="bottom" className="max-w-xs">
        <div className="space-y-1.5">
          <p className="font-medium">Verified Information</p>
          <p className="text-xs text-muted-foreground">
            Source: {SOURCE_LABELS[source]}
          </p>
          <p className="text-xs text-muted-foreground">
            Pricing & availability can change quickly. Request the latest package for current info.
          </p>
        </div>
      </TooltipContent>
    </Tooltip>
  );
}
