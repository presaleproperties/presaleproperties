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
      "bg-background/80 backdrop-blur-2xl rounded-full shadow-lg border border-white/20 p-0.5 flex items-center",
      className
    )}>
      <button
        onClick={() => onModeChange("all")}
        className={cn(
          "px-4 py-1.5 rounded-full text-xs font-semibold transition-all duration-200 whitespace-nowrap",
          mode === "all"
            ? "bg-primary text-primary-foreground shadow-sm"
            : "text-muted-foreground hover:text-foreground"
        )}
      >
        All
      </button>
      <button
        onClick={() => onModeChange("presale")}
        className={cn(
          "px-4 py-1.5 rounded-full text-xs font-semibold transition-all duration-200 whitespace-nowrap",
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
          "px-4 py-1.5 rounded-full text-xs font-semibold transition-all duration-200 whitespace-nowrap",
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
