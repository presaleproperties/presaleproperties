import { useRef } from "react";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";

interface CategoryChip {
  id: string;
  label: string;
  icon?: React.ReactNode;
  route: string;
  filter: {
    type?: string;
    maxPrice?: number;
    depositPercent?: number;
    minCompletionYear?: number;
  };
}

const CATEGORY_CHIPS: CategoryChip[] = [
  { 
    id: "all", 
    label: "All Projects", 
    route: "/presale-projects",
    filter: {} 
  },
  { 
    id: "condos", 
    label: "Condos", 
    route: "/presale-projects?type=condo",
    filter: { type: "condo" } 
  },
  { 
    id: "townhomes", 
    label: "Townhomes", 
    route: "/presale-projects?type=townhome",
    filter: { type: "townhome" } 
  },
  { 
    id: "5deposit", 
    label: "5% Deposit Only", 
    route: "/presale-projects?deposit=5",
    filter: { depositPercent: 5 } 
  },
  { 
    id: "2027plus", 
    label: "2027+", 
    route: "/presale-projects?completionYear=2027",
    filter: { minCompletionYear: 2027 } 
  },
];

interface MobileCategoryChipsProps {
  selectedChip?: string;
  onChipSelect?: (chipId: string, filter: CategoryChip["filter"]) => void;
}

export function MobileCategoryChips({ selectedChip, onChipSelect }: MobileCategoryChipsProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  const handleChipClick = (chip: CategoryChip) => {
    // Track analytics
    if (typeof window !== "undefined" && (window as any).gtag) {
      (window as any).gtag("event", "chip_selected", {
        chip_id: chip.id,
        chip_label: chip.label,
      });
    }

    // Navigate to the filtered projects page
    navigate(chip.route);
    
    // Also call callback if provided
    if (onChipSelect) {
      onChipSelect(chip.id, chip.filter);
    }
  };

  return (
    <div className="md:hidden overflow-hidden">
      <div
        ref={scrollRef}
        className="flex gap-1.5 overflow-x-auto scrollbar-hide px-3 py-1"
      >
        {CATEGORY_CHIPS.map((chip) => (
          <button
            key={chip.id}
            onClick={() => handleChipClick(chip)}
            className={cn(
              "px-2.5 py-0.5 rounded-full text-[11px] font-medium whitespace-nowrap transition-all active:scale-95",
              selectedChip === chip.id
                ? "bg-foreground text-background"
                : "bg-muted/70 text-muted-foreground"
            )}
          >
            {chip.label}
          </button>
        ))}
      </div>
    </div>
  );
}

export { CATEGORY_CHIPS };
export type { CategoryChip };
