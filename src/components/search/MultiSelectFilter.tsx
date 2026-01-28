import React, { useState, useRef, useEffect } from "react";
import { Check, ChevronDown, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface Option {
  value: string;
  label: string;
  icon?: React.ComponentType<{ className?: string }>;
}

interface MultiSelectFilterProps {
  options: Option[];
  selected: string[];
  onChange: (selected: string[]) => void;
  placeholder?: string;
  label?: string;
  icon?: React.ComponentType<{ className?: string }> | React.ReactNode;
  className?: string;
  allLabel?: string;
}

export function MultiSelectFilter({
  options,
  selected,
  onChange,
  placeholder,
  label,
  icon,
  className,
  allLabel = "All",
}: MultiSelectFilterProps) {
  // Handle icon - can be a component or a ReactNode (JSX element)
  const renderIcon = () => {
    if (!icon) return null;
    // Check if it's a React component (function or class)
    if (typeof icon === 'function') {
      const IconComponent = icon as React.ComponentType<{ className?: string }>;
      return <IconComponent className="h-3 w-3 text-muted-foreground shrink-0" />;
    }
    // Check if it's a valid React element (JSX)
    if (React.isValidElement(icon)) {
      return icon;
    }
    return null;
  };
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const toggleOption = (value: string) => {
    if (selected.includes(value)) {
      onChange(selected.filter((v) => v !== value));
    } else {
      onChange([...selected, value]);
    }
  };

  const clearAll = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange([]);
  };

  // Display text
  const displayText = selected.length === 0 
    ? allLabel
    : selected.length === 1 
      ? options.find(o => o.value === selected[0])?.label || selected[0]
      : `${selected.length} selected`;

  return (
    <div ref={containerRef} className={cn("relative", className)}>
      <Button
        variant="outline"
        size="sm"
        className={cn(
          "h-8 text-xs justify-between gap-1 min-w-[100px] font-normal",
          selected.length > 0 && "border-primary/50 bg-primary/5"
        )}
        onClick={() => setOpen(!open)}
      >
        <span className="flex items-center gap-1.5 truncate">
          {renderIcon()}
          <span className="truncate">{label || displayText}</span>
        </span>
        <span className="flex items-center gap-0.5 shrink-0">
          {selected.length > 0 && (
            <span
              onClick={clearAll}
              role="button"
              tabIndex={0}
              className="p-0.5 hover:bg-muted rounded cursor-pointer"
              onKeyDown={(e) => e.key === 'Enter' && clearAll(e as any)}
            >
              <X className="h-3 w-3 text-muted-foreground" />
            </span>
          )}
          <ChevronDown className={cn("h-3 w-3 text-muted-foreground transition-transform", open && "rotate-180")} />
        </span>
      </Button>

      {open && (
        <div className="absolute top-full left-0 mt-1 min-w-[180px] bg-background border border-border rounded-lg shadow-lg z-[9999] overflow-hidden">
          <div className="max-h-[280px] overflow-y-auto p-1">
            {options.map((option) => {
              const isSelected = selected.includes(option.value);
              const OptionIcon = option.icon;
              return (
                <button
                  key={option.value}
                  onClick={() => toggleOption(option.value)}
                  className={cn(
                    "w-full flex items-center gap-2 px-3 py-2 text-sm rounded-md transition-colors text-left",
                    isSelected ? "bg-primary/10 text-primary" : "hover:bg-muted"
                  )}
                >
                  <div className={cn(
                    "w-4 h-4 rounded border flex items-center justify-center shrink-0",
                    isSelected ? "bg-primary border-primary" : "border-border"
                  )}>
                    {isSelected && <Check className="h-3 w-3 text-primary-foreground" />}
                  </div>
                  {OptionIcon && <OptionIcon className="h-4 w-4 text-muted-foreground" />}
                  <span className="flex-1 truncate">{option.label}</span>
                </button>
              );
            })}
          </div>
          
          {selected.length > 0 && (
            <div className="border-t border-border p-2">
              <Button
                variant="ghost"
                size="sm"
                className="w-full h-7 text-xs"
                onClick={() => {
                  onChange([]);
                  setOpen(false);
                }}
              >
                Clear selection
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// Price range presets for multi-select
export const PRICE_RANGE_OPTIONS = [
  { value: "0-500000", label: "Under $500K" },
  { value: "500000-750000", label: "$500K - $750K" },
  { value: "750000-1000000", label: "$750K - $1M" },
  { value: "1000000-1500000", label: "$1M - $1.5M" },
  { value: "1500000-2000000", label: "$1.5M - $2M" },
  { value: "2000000-3000000", label: "$2M - $3M" },
  { value: "3000000-5000000", label: "$3M+" },
];

// Helper to convert price range selections to min/max
export function getPriceMinMax(selectedRanges: string[]): { min: number | null; max: number | null } {
  if (selectedRanges.length === 0) return { min: null, max: null };
  
  let overallMin = Infinity;
  let overallMax = 0;
  
  selectedRanges.forEach(range => {
    const [minStr, maxStr] = range.split("-");
    const min = parseInt(minStr);
    const max = maxStr === "max" ? Infinity : parseInt(maxStr);
    
    if (min < overallMin) overallMin = min;
    if (max > overallMax) overallMax = max;
  });
  
  return {
    min: overallMin === 0 ? null : overallMin,
    max: overallMax === Infinity || overallMax >= 5000000 ? null : overallMax,
  };
}

// Helper to check if a price falls within any of the selected ranges
export function priceMatchesRanges(price: number, selectedRanges: string[]): boolean {
  if (selectedRanges.length === 0) return true;
  
  return selectedRanges.some(range => {
    const [minStr, maxStr] = range.split("-");
    const min = parseInt(minStr);
    const max = maxStr === "max" || parseInt(maxStr) >= 5000000 ? Infinity : parseInt(maxStr);
    return price >= min && price <= max;
  });
}
