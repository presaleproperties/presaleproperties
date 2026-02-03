import { useState, useRef, useEffect } from "react";
import { Check, ChevronDown, MapPin, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface CityMultiSelectDropdownProps {
  cities: string[];
  selected: string[];
  onChange: (cities: string[]) => void;
  className?: string;
}

export function CityMultiSelectDropdown({
  cities,
  selected,
  onChange,
  className,
}: CityMultiSelectDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const toggleCity = (city: string) => {
    if (selected.includes(city)) {
      onChange(selected.filter((c) => c !== city));
    } else {
      onChange([...selected, city]);
    }
  };

  const displayText =
    selected.length === 0
      ? "All Cities"
      : selected.length === 1
      ? selected[0]
      : `${selected.length} cities`;

  return (
    <div ref={containerRef} className={cn("relative", className)}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "w-full flex items-center justify-between h-10 px-3 rounded-lg border transition-all text-left text-sm",
          selected.length > 0
            ? "border-primary/50 bg-primary/5"
            : "border-border hover:border-foreground/30"
        )}
      >
        <span className="flex items-center gap-2">
          <MapPin className="h-4 w-4 text-muted-foreground shrink-0" />
          <span className="font-medium truncate">{displayText}</span>
        </span>
        <ChevronDown
          className={cn(
            "h-4 w-4 text-muted-foreground transition-transform shrink-0",
            isOpen && "rotate-180"
          )}
        />
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-background border border-border rounded-lg shadow-lg z-50 max-h-[280px] overflow-hidden">
          <div className="overflow-y-auto max-h-[240px] p-1.5">
            <div className="grid grid-cols-2 gap-1">
              {cities.map((city) => {
                const isSelected = selected.includes(city);
                return (
                  <button
                    key={city}
                    type="button"
                    onClick={() => toggleCity(city)}
                    className={cn(
                      "flex items-center gap-2 px-2.5 py-2 rounded-md transition-colors text-left text-sm",
                      isSelected ? "bg-primary/10" : "hover:bg-muted"
                    )}
                  >
                    <div
                      className={cn(
                        "w-4 h-4 rounded border flex items-center justify-center shrink-0 transition-colors",
                        isSelected
                          ? "bg-primary border-primary"
                          : "border-muted-foreground/40"
                      )}
                    >
                      {isSelected && (
                        <Check className="h-3 w-3 text-primary-foreground" />
                      )}
                    </div>
                    <span
                      className={cn(
                        "truncate",
                        isSelected ? "font-medium text-primary" : "text-foreground"
                      )}
                    >
                      {city}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {selected.length > 0 && (
            <div className="border-t border-border p-1.5">
              <Button
                variant="ghost"
                size="sm"
                className="w-full h-8 text-xs"
                onClick={() => {
                  onChange([]);
                  setIsOpen(false);
                }}
              >
                Clear all
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
