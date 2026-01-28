import { cn } from "@/lib/utils";
import { Lock } from "lucide-react";

type MapMode = "all" | "presale" | "resale" | "assignments";

interface UnifiedMapToggleProps {
  mode: MapMode;
  onModeChange: (mode: MapMode) => void;
  presaleCount?: number;
  resaleCount?: number;
  assignmentCount?: number;
  className?: string;
}

export function UnifiedMapToggle({ 
  mode, 
  onModeChange, 
  presaleCount, 
  resaleCount,
  assignmentCount,
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
          "px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-200 whitespace-nowrap",
          mode === "all"
            ? "bg-primary text-primary-foreground shadow-sm"
            : "text-muted-foreground hover:text-foreground hover:bg-black/5 dark:hover:bg-white/10"
        )}
      >
        All
      </button>
      <button
        onClick={() => onModeChange("presale")}
        className={cn(
          "px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-200 whitespace-nowrap",
          mode === "presale"
            ? "bg-foreground text-background shadow-sm"
            : "text-muted-foreground hover:text-foreground hover:bg-black/5 dark:hover:bg-white/10"
        )}
      >
        Presale
      </button>
      <button
        onClick={() => onModeChange("resale")}
        className={cn(
          "px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-200 whitespace-nowrap",
          mode === "resale"
            ? "bg-foreground text-background shadow-sm"
            : "text-muted-foreground hover:text-foreground hover:bg-black/5 dark:hover:bg-white/10"
        )}
      >
        Move-In
      </button>
      <button
        onClick={() => onModeChange("assignments")}
        className={cn(
          "px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-200 whitespace-nowrap flex items-center gap-1.5",
          mode === "assignments"
            ? "bg-purple-600 text-white shadow-sm"
            : "text-muted-foreground hover:text-foreground hover:bg-black/5 dark:hover:bg-white/10"
        )}
      >
        <Lock className="h-3 w-3" />
        Assign
      </button>
    </div>
  );
}
