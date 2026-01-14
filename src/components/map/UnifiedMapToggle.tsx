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
      "bg-background/95 backdrop-blur-md rounded-full shadow-lg border border-border/40 p-1 flex items-center gap-0.5",
      className
    )}>
      <button
        onClick={() => onModeChange("all")}
        className={cn(
          "px-3 sm:px-4 py-2 rounded-full text-xs sm:text-sm font-semibold transition-all duration-200 whitespace-nowrap",
          mode === "all"
            ? "bg-primary text-primary-foreground shadow-sm"
            : "text-muted-foreground hover:text-foreground"
        )}
      >
        All
        <span className="ml-1 opacity-70 hidden sm:inline">({totalCount.toLocaleString()})</span>
      </button>
      <button
        onClick={() => onModeChange("presale")}
        className={cn(
          "px-3 sm:px-4 py-2 rounded-full text-xs sm:text-sm font-semibold transition-all duration-200 whitespace-nowrap",
          mode === "presale"
            ? "bg-foreground text-background shadow-sm"
            : "text-muted-foreground hover:text-foreground"
        )}
      >
        Presale
      </button>
      <button
        onClick={() => onModeChange("resale")}
        className={cn(
          "px-3 sm:px-4 py-2 rounded-full text-xs sm:text-sm font-semibold transition-all duration-200 whitespace-nowrap",
          mode === "resale"
            ? "bg-foreground text-background shadow-sm"
            : "text-muted-foreground hover:text-foreground"
        )}
      >
        Move-In
      </button>
    </div>
  );
}
