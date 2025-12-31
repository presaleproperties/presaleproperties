import { useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Building2, Home, Percent, Calendar, LayoutGrid } from "lucide-react";
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
    label: "All", 
    icon: <LayoutGrid className="h-3.5 w-3.5" />, 
    route: "/presale-projects",
    filter: {} 
  },
  { 
    id: "condos", 
    label: "Condos", 
    icon: <Building2 className="h-3.5 w-3.5" />, 
    route: "/presale-projects?type=condo",
    filter: { type: "condo" } 
  },
  { 
    id: "townhomes", 
    label: "Townhomes", 
    icon: <Home className="h-3.5 w-3.5" />, 
    route: "/presale-projects?type=townhome",
    filter: { type: "townhome" } 
  },
  { 
    id: "5deposit", 
    label: "5% Deposit", 
    icon: <Percent className="h-3.5 w-3.5" />, 
    route: "/presale-projects?deposit=5",
    filter: { depositPercent: 5 } 
  },
  { 
    id: "2027plus", 
    label: "2027+", 
    icon: <Calendar className="h-3.5 w-3.5" />, 
    route: "/presale-projects?year=2027",
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
    <div className="md:hidden overflow-hidden border-b border-border bg-background shadow-sm">
      <div
        ref={scrollRef}
        className="flex gap-2 overflow-x-auto scrollbar-hide px-4 py-2.5"
      >
        {CATEGORY_CHIPS.map((chip) => (
          <button
            key={chip.id}
            onClick={() => handleChipClick(chip)}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all active:scale-95 border",
              selectedChip === chip.id
                ? "bg-primary text-primary-foreground border-primary shadow-md"
                : "bg-card text-foreground border-border hover:border-primary/50 hover:bg-muted shadow-sm"
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
