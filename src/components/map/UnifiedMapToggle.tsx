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
      "bg-background/95 backdrop-blur-md rounded-full shadow-lg border border-border/50 p-1 flex items-center gap-0.5",
      className
    )}>
      <button
        onClick={() => onModeChange("all")}
        className={cn(
          "px-3 py-1.5 rounded-full text-xs font-semibold transition-all duration-200",
          mode === "all"
            ? "bg-primary text-primary-foreground shadow-sm"
            : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
        )}
      >
        All
        {totalCount > 0 && (
          <span className="ml-1 opacity-70">({totalCount.toLocaleString()})</span>
        )}
      </button>
      <button
        onClick={() => onModeChange("presale")}
        className={cn(
          "px-3 py-1.5 rounded-full text-xs font-semibold transition-all duration-200",
          mode === "presale"
            ? "bg-foreground text-background shadow-sm"
            : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
        )}
      >
        Presale
        {presaleCount !== undefined && presaleCount > 0 && (
          <span className="ml-1 opacity-70">({presaleCount})</span>
        )}
      </button>
      <button
        onClick={() => onModeChange("resale")}
        className={cn(
          "px-3 py-1.5 rounded-full text-xs font-semibold transition-all duration-200",
          mode === "resale"
            ? "bg-foreground text-background shadow-sm"
            : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
        )}
      >
        Move-In Ready
        {resaleCount !== undefined && resaleCount > 0 && (
          <span className="ml-1 opacity-70">({resaleCount.toLocaleString()})</span>
        )}
      </button>
    </div>
  );
}
