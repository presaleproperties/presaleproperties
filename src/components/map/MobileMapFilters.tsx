import { useState, useEffect } from "react";
import { Check, ChevronDown, X, MapPin, DollarSign, Calendar, Building, Bed, Bath } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetFooter,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

interface PropertyTypeOption {
  value: string;
  label: string;
  icon: React.ComponentType<{ className?: string }> | null;
}

interface SimpleOption {
  value: string;
  label: string;
}

interface MobileMapFiltersProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  // Cities
  cities: string[];
  selectedCities: string[];
  onCitiesChange: (cities: string[]) => void;
  // Price Range
  priceRange: [number, number];
  onPriceRangeChange: (range: [number, number]) => void;
  minPrice: number;
  maxPrice: number;
  // Year Built
  yearBuiltMin: number | null;
  yearBuiltMax: number | null;
  onYearBuiltChange: (min: number | null, max: number | null) => void;
  // Property Type
  propertyTypes: PropertyTypeOption[];
  selectedPropertyType: string;
  onPropertyTypeChange: (type: string) => void;
  // Beds & Baths
  bedOptions: SimpleOption[];
  bathOptions: SimpleOption[];
  selectedBeds: string;
  selectedBaths: string;
  onBedsChange: (beds: string) => void;
  onBathsChange: (baths: string) => void;
  // Actions
  onClearAll: () => void;
  onApply: () => void;
  activeFilterCount: number;
}

// Format price for display
const formatPrice = (value: number): string => {
  if (value >= 1000000) {
    return `$${(value / 1000000).toFixed(1)}M`;
  }
  return `$${(value / 1000).toFixed(0)}K`;
};

// Multi-select city dropdown
function CityMultiSelect({
  cities,
  selected,
  onChange,
}: {
  cities: string[];
  selected: string[];
  onChange: (cities: string[]) => void;
}) {
  const [isOpen, setIsOpen] = useState(false);

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
      : `${selected.length} cities selected`;

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "w-full flex items-center justify-between h-12 px-4 rounded-xl border transition-all text-left",
          selected.length > 0
            ? "border-primary/50 bg-primary/5"
            : "border-border hover:border-foreground/30"
        )}
      >
        <span className="flex items-center gap-2">
          <MapPin className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium truncate">{displayText}</span>
        </span>
        <ChevronDown
          className={cn(
            "h-4 w-4 text-muted-foreground transition-transform",
            isOpen && "rotate-180"
          )}
        />
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-background border border-border rounded-xl shadow-lg z-50 max-h-[280px] overflow-y-auto">
          <div className="p-2 space-y-1">
            {cities.map((city) => {
              const isSelected = selected.includes(city);
              return (
                <button
                  key={city}
                  type="button"
                  onClick={() => toggleCity(city)}
                  className={cn(
                    "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors text-left",
                    isSelected ? "bg-primary/10" : "hover:bg-muted"
                  )}
                >
                  <div
                    className={cn(
                      "w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 transition-colors",
                      isSelected
                        ? "bg-primary border-primary"
                        : "border-muted-foreground/30"
                    )}
                  >
                    {isSelected && (
                      <Check className="h-3 w-3 text-primary-foreground" />
                    )}
                  </div>
                  <span
                    className={cn(
                      "text-sm",
                      isSelected ? "font-medium text-primary" : ""
                    )}
                  >
                    {city}
                  </span>
                </button>
              );
            })}
          </div>

          {selected.length > 0 && (
            <div className="border-t border-border p-2">
              <Button
                variant="ghost"
                size="sm"
                className="w-full h-9 text-sm"
                onClick={() => {
                  onChange([]);
                  setIsOpen(false);
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

// Price Range Slider with dual thumbs
function PriceRangeSlider({
  value,
  onChange,
  min,
  max,
}: {
  value: [number, number];
  onChange: (value: [number, number]) => void;
  min: number;
  max: number;
}) {
  const step = 25000;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between text-sm">
        <span className="font-medium text-foreground">{formatPrice(value[0])}</span>
        <span className="text-muted-foreground">—</span>
        <span className="font-medium text-foreground">
          {value[1] >= max ? `${formatPrice(max)}+` : formatPrice(value[1])}
        </span>
      </div>
      
      <div className="px-1">
        <Slider
          value={value}
          onValueChange={(vals) => onChange([vals[0], vals[1]])}
          min={min}
          max={max}
          step={step}
          className="w-full"
        />
      </div>

      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>{formatPrice(min)}</span>
        <span>{formatPrice(max)}+</span>
      </div>
    </div>
  );
}

// Year Built Range Input
function YearBuiltRange({
  minYear,
  maxYear,
  onChange,
}: {
  minYear: number | null;
  maxYear: number | null;
  onChange: (min: number | null, max: number | null) => void;
}) {
  const currentYear = new Date().getFullYear();
  const [localMin, setLocalMin] = useState(minYear?.toString() || "");
  const [localMax, setLocalMax] = useState(maxYear?.toString() || "");

  useEffect(() => {
    setLocalMin(minYear?.toString() || "");
    setLocalMax(maxYear?.toString() || "");
  }, [minYear, maxYear]);

  const handleMinBlur = () => {
    const val = localMin ? parseInt(localMin) : null;
    if (val && (val < 1900 || val > currentYear + 5)) {
      setLocalMin("");
      onChange(null, maxYear);
    } else {
      onChange(val, maxYear);
    }
  };

  const handleMaxBlur = () => {
    const val = localMax ? parseInt(localMax) : null;
    if (val && (val < 1900 || val > currentYear + 5)) {
      setLocalMax("");
      onChange(minYear, null);
    } else {
      onChange(minYear, val);
    }
  };

  return (
    <div className="flex items-center gap-3">
      <div className="flex-1">
        <Input
          type="number"
          placeholder="Min Year"
          value={localMin}
          onChange={(e) => setLocalMin(e.target.value)}
          onBlur={handleMinBlur}
          className="h-12 text-base rounded-xl text-center"
          min={1900}
          max={currentYear + 5}
        />
      </div>
      <span className="text-muted-foreground font-medium">—</span>
      <div className="flex-1">
        <Input
          type="number"
          placeholder="Max Year"
          value={localMax}
          onChange={(e) => setLocalMax(e.target.value)}
          onBlur={handleMaxBlur}
          className="h-12 text-base rounded-xl text-center"
          min={1900}
          max={currentYear + 5}
        />
      </div>
    </div>
  );
}

export function MobileMapFilters({
  open,
  onOpenChange,
  cities,
  selectedCities,
  onCitiesChange,
  priceRange,
  onPriceRangeChange,
  minPrice,
  maxPrice,
  yearBuiltMin,
  yearBuiltMax,
  onYearBuiltChange,
  propertyTypes,
  selectedPropertyType,
  onPropertyTypeChange,
  bedOptions,
  bathOptions,
  selectedBeds,
  selectedBaths,
  onBedsChange,
  onBathsChange,
  onClearAll,
  onApply,
  activeFilterCount,
}: MobileMapFiltersProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="h-[85vh] flex flex-col rounded-t-3xl">
        <SheetHeader className="pb-4 border-b">
          <div className="w-12 h-1 bg-muted-foreground/30 rounded-full mx-auto mb-3" />
          <div className="flex items-center justify-between">
            <SheetTitle className="text-lg font-semibold">Filters</SheetTitle>
            {activeFilterCount > 0 && (
              <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full font-medium">
                {activeFilterCount} active
              </span>
            )}
          </div>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto py-5 space-y-6">
          {/* City Multi-Select Dropdown */}
          <div>
            <label className="flex items-center gap-2 text-sm font-semibold mb-3">
              <MapPin className="h-4 w-4 text-primary" />
              Cities
            </label>
            <CityMultiSelect
              cities={cities}
              selected={selectedCities}
              onChange={onCitiesChange}
            />
          </div>

          {/* Price Range Slider */}
          <div className="border-t pt-5">
            <label className="flex items-center gap-2 text-sm font-semibold mb-4">
              <DollarSign className="h-4 w-4 text-primary" />
              Price Range
            </label>
            <PriceRangeSlider
              value={priceRange}
              onChange={onPriceRangeChange}
              min={minPrice}
              max={maxPrice}
            />
          </div>

          {/* Year Built Range */}
          <div className="border-t pt-5">
            <label className="flex items-center gap-2 text-sm font-semibold mb-3">
              <Calendar className="h-4 w-4 text-primary" />
              Year Built
            </label>
            <YearBuiltRange
              minYear={yearBuiltMin}
              maxYear={yearBuiltMax}
              onChange={onYearBuiltChange}
            />
          </div>

          {/* Property Type */}
          <div className="border-t pt-5">
            <label className="flex items-center gap-2 text-sm font-semibold mb-3">
              <Building className="h-4 w-4 text-primary" />
              Property Type
            </label>
            <div className="flex flex-wrap gap-2">
              {propertyTypes.map((opt) => {
                const Icon = opt.icon;
                return (
                  <button
                    key={opt.value}
                    onClick={() => onPropertyTypeChange(opt.value)}
                    className={cn(
                      "flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-medium transition-all",
                      selectedPropertyType === opt.value
                        ? "bg-primary/15 border-primary text-primary"
                        : "border-border hover:border-foreground/30"
                    )}
                  >
                    {Icon && <Icon className="h-4 w-4" />}
                    {opt.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Bedrooms */}
          <div className="border-t pt-5">
            <label className="flex items-center gap-2 text-sm font-semibold mb-3">
              <Bed className="h-4 w-4 text-primary" />
              Bedrooms
            </label>
            <div className="flex flex-wrap gap-2">
              {bedOptions.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => onBedsChange(opt.value)}
                  className={cn(
                    "px-4 py-2.5 rounded-xl border text-sm font-medium min-w-[52px] transition-all",
                    selectedBeds === opt.value
                      ? "bg-primary/15 border-primary text-primary"
                      : "border-border hover:border-foreground/30"
                  )}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Bathrooms */}
          <div className="border-t pt-5">
            <label className="flex items-center gap-2 text-sm font-semibold mb-3">
              <Bath className="h-4 w-4 text-primary" />
              Bathrooms
            </label>
            <div className="flex flex-wrap gap-2">
              {bathOptions.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => onBathsChange(opt.value)}
                  className={cn(
                    "px-4 py-2.5 rounded-xl border text-sm font-medium min-w-[52px] transition-all",
                    selectedBaths === opt.value
                      ? "bg-primary/15 border-primary text-primary"
                      : "border-border hover:border-foreground/30"
                  )}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <SheetFooter className="border-t pt-4 flex-row gap-3 pb-[env(safe-area-inset-bottom)]">
          <Button
            variant="outline"
            onClick={onClearAll}
            className="flex-1 h-12 rounded-xl"
          >
            Clear All
          </Button>
          <Button
            onClick={onApply}
            className="flex-1 h-12 rounded-xl bg-primary hover:bg-primary/90"
          >
            Show Results
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
