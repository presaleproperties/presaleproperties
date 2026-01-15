import { cn } from "@/lib/utils";

type MapMode = "all" | "presale" | "resale";

interface UnifiedMapToggleProps {
  mode: MapMode;
  onModeChange: (mode: MapMode) => void;
  presaleCount?: number;
  resaleCount?: number;
  className?: string;
}

export function UnifiedMapToggle({ 
  mode, 
  onModeChange, 
  presaleCount, 
  resaleCount,
  className 
}: UnifiedMapToggleProps) {
  const totalCount = (presaleCount || 0) + (resaleCount || 0);
  
  return (
    <div className={cn(
      "bg-background/90 backdrop-blur-xl rounded-2xl shadow-lg border border-border/30 p-1 flex items-center gap-0.5",
      className
    )}>
      <button
        onClick={() => onModeChange("all")}
        className={cn(
          "px-4 sm:px-5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all duration-200 whitespace-nowrap",
          mode === "all"
            ? "bg-primary text-primary-foreground shadow-sm"
            : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
        )}
      >
        All
        <span className="ml-1 opacity-70 hidden sm:inline">({totalCount.toLocaleString()})</span>
      </button>
      <button
        onClick={() => onModeChange("presale")}
        className={cn(
          "px-4 sm:px-5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all duration-200 whitespace-nowrap",
          mode === "presale"
            ? "bg-foreground text-background shadow-sm"
            : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
        )}
      >
        Presale
      </button>
      <button
        onClick={() => onModeChange("resale")}
        className={cn(
          "px-4 sm:px-5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all duration-200 whitespace-nowrap",
          mode === "resale"
            ? "bg-foreground text-background shadow-sm"
            : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
        )}
      >
        Move-In
      </button>
    </div>
  );
}
