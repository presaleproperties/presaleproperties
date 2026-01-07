import { cn } from "@/lib/utils";

interface QuickFilterChipsProps {
  options: { value: string; label: string }[];
  selected: string;
  onSelect: (value: string) => void;
  className?: string;
}

export function QuickFilterChips({ options, selected, onSelect, className }: QuickFilterChipsProps) {
  return (
    <div className={cn("flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide", className)}>
      {options.map((option) => (
        <button
          key={option.value}
          onClick={() => onSelect(option.value === selected ? "any" : option.value)}
          className={cn(
            "shrink-0 px-3 py-1.5 rounded-full text-sm font-medium transition-all border",
            option.value === selected
              ? "bg-foreground text-background border-foreground"
              : "bg-background text-muted-foreground border-border hover:border-foreground/50 hover:text-foreground"
          )}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}
