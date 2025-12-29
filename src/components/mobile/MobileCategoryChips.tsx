import { useRef, useState } from "react";
import { Building2, Home, FileStack, DollarSign, Percent, Calendar, Train, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";

interface CategoryChip {
  id: string;
  label: string;
  icon?: React.ReactNode;
  filter: {
    type?: string;
    maxPrice?: number;
    depositPercent?: number;
    minCompletionYear?: number;
    nearSkytrain?: boolean;
    investorFriendly?: boolean;
    isAssignment?: boolean;
  };
}

const CATEGORY_CHIPS: CategoryChip[] = [
  { id: "all", label: "All", filter: {} },
  { id: "condos", label: "Condos", icon: <Building2 className="h-3.5 w-3.5" />, filter: { type: "condo" } },
  { id: "townhomes", label: "Townhomes", icon: <Home className="h-3.5 w-3.5" />, filter: { type: "townhome" } },
  { id: "assignments", label: "Assignments", icon: <FileStack className="h-3.5 w-3.5" />, filter: { isAssignment: true } },
  { id: "under700k", label: "Under $700K", icon: <DollarSign className="h-3.5 w-3.5" />, filter: { maxPrice: 700000 } },
  { id: "10deposit", label: "10% Deposit", icon: <Percent className="h-3.5 w-3.5" />, filter: { depositPercent: 10 } },
  { id: "2027plus", label: "2027+", icon: <Calendar className="h-3.5 w-3.5" />, filter: { minCompletionYear: 2027 } },
  { id: "skytrain", label: "Near SkyTrain", icon: <Train className="h-3.5 w-3.5" />, filter: { nearSkytrain: true } },
  { id: "investor", label: "Investor Friendly", icon: <TrendingUp className="h-3.5 w-3.5" />, filter: { investorFriendly: true } },
];

interface MobileCategoryChipsProps {
  selectedChip: string;
  onChipSelect: (chipId: string, filter: CategoryChip["filter"]) => void;
}

export function MobileCategoryChips({ selectedChip, onChipSelect }: MobileCategoryChipsProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  const handleChipClick = (chip: CategoryChip) => {
    onChipSelect(chip.id, chip.filter);
    
    // Track analytics
    if (typeof window !== "undefined" && (window as any).gtag) {
      (window as any).gtag("event", "chip_selected", {
        chip_id: chip.id,
        chip_label: chip.label,
      });
    }
  };

  return (
    <div className="md:hidden overflow-hidden">
      <div
        ref={scrollRef}
        className="flex gap-2 overflow-x-auto scrollbar-hide px-4 py-3 -mx-0"
      >
        {CATEGORY_CHIPS.map((chip) => (
          <button
            key={chip.id}
            onClick={() => handleChipClick(chip)}
            className={cn(
              "flex items-center gap-1.5 px-3.5 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all active:scale-95",
              selectedChip === chip.id
                ? "bg-foreground text-background shadow-sm"
                : "bg-muted text-muted-foreground hover:bg-muted/80"
            )}
          >
            {chip.icon}
            {chip.label}
          </button>
        ))}
      </div>
    </div>
  );
}

export { CATEGORY_CHIPS };
export type { CategoryChip };
