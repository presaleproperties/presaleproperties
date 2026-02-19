import { cn } from "@/lib/utils";
import { Building2, Home, Layers } from "lucide-react";

type MapMode = "all" | "presale" | "resale" | "assignments";

interface UnifiedMapToggleProps {
  mode: MapMode;
  onModeChange: (mode: MapMode) => void;
  presaleCount?: number;
  resaleCount?: number;
  assignmentsCount?: number;
  className?: string;
}

export function UnifiedMapToggle({ 
  mode, 
  onModeChange, 
  presaleCount, 
  resaleCount,
  assignmentsCount,
  className 
}: UnifiedMapToggleProps) {
  return (
    <div className={cn(
      "bg-white/98 dark:bg-background/98 backdrop-blur-2xl rounded-[14px] shadow-lg shadow-black/8 border border-white/50 dark:border-white/10 p-1 flex items-center gap-0.5",
      className
    )}>
      <button
        onClick={() => onModeChange("all")}
        className={cn(
          "px-3 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all duration-200 whitespace-nowrap flex items-center gap-1.5",
          mode === "all"
            ? "bg-primary text-primary-foreground shadow-sm"
            : "text-muted-foreground hover:text-foreground hover:bg-black/5 dark:hover:bg-white/10"
        )}
      >
        <Layers className="h-3.5 w-3.5" />
        <span className="hidden sm:inline">All</span>
      </button>
      <button
        onClick={() => onModeChange("presale")}
        className={cn(
          "px-3 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all duration-200 whitespace-nowrap flex items-center gap-1.5",
          mode === "presale"
            ? "bg-primary text-primary-foreground shadow-sm"
            : "text-muted-foreground hover:text-foreground hover:bg-black/5 dark:hover:bg-white/10"
        )}
      >
        <Building2 className="h-3.5 w-3.5" />
        Presale
      </button>
      <button
        onClick={() => onModeChange("resale")}
        className={cn(
          "px-3 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all duration-200 whitespace-nowrap flex items-center gap-1.5",
          mode === "resale"
            ? "bg-primary text-primary-foreground shadow-sm"
            : "text-muted-foreground hover:text-foreground hover:bg-black/5 dark:hover:bg-white/10"
        )}
      >
        <Home className="h-3.5 w-3.5" />
        <span className="hidden sm:inline">Move-In</span>
        <span className="sm:hidden">MLS</span>
      </button>
    </div>
  );
}