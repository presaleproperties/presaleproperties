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

export interface PresetConfig {
  priceMin?: number;
  priceMax?: number;
  propertyType?: string;
  cities?: string[];
  beds?: string;
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
  // Square Footage
  sqftMin: number | null;
  sqftMax: number | null;
  onSqftChange: (min: number | null, max: number | null) => void;
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
  // Atomic preset application - applies all changes in one URL update
  onApplyPreset: (preset: PresetConfig) => void;
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

// Square Footage Range Input
function SqftRange({
  minSqft,
  maxSqft,
  onChange,
}: {
  minSqft: number | null;
  maxSqft: number | null;
  onChange: (min: number | null, max: number | null) => void;
}) {
  const [localMin, setLocalMin] = useState(minSqft?.toString() || "");
  const [localMax, setLocalMax] = useState(maxSqft?.toString() || "");

  useEffect(() => {
    setLocalMin(minSqft?.toString() || "");
    setLocalMax(maxSqft?.toString() || "");
  }, [minSqft, maxSqft]);

  const handleMinBlur = () => {
    const val = localMin ? parseInt(localMin) : null;
    if (val && val < 0) {
      setLocalMin("");
      onChange(null, maxSqft);
    } else {
      onChange(val, maxSqft);
    }
  };

  const handleMaxBlur = () => {
    const val = localMax ? parseInt(localMax) : null;
    if (val && val < 0) {
      setLocalMax("");
      onChange(minSqft, null);
    } else {
      onChange(minSqft, val);
    }
  };

  return (
    <div className="flex items-center gap-3">
      <div className="flex-1">
        <Input
          type="number"
          placeholder="Min sqft"
          value={localMin}
          onChange={(e) => setLocalMin(e.target.value)}
          onBlur={handleMinBlur}
          className="h-12 text-base rounded-xl text-center"
          min={0}
        />
      </div>
      <span className="text-muted-foreground font-medium">—</span>
      <div className="flex-1">
        <Input
          type="number"
          placeholder="Max sqft"
          value={localMax}
          onChange={(e) => setLocalMax(e.target.value)}
          onBlur={handleMaxBlur}
          className="h-12 text-base rounded-xl text-center"
          min={0}
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
  sqftMin,
  sqftMax,
  onSqftChange,
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
  onApplyPreset,
  activeFilterCount,
}: MobileMapFiltersProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="h-[85vh] flex flex-col rounded-t-3xl px-0 pb-0">
        {/* Drag Handle */}
        <div className="flex justify-center pt-3 pb-2">
          <div className="w-10 h-1 rounded-full bg-border" />
        </div>
        
        {/* Header */}
        <div className="flex items-center justify-between px-5 pb-4 border-b border-border">
          <div>
            <h2 className="text-lg font-semibold text-foreground">Filters</h2>
            {activeFilterCount > 0 && (
              <p className="text-sm text-muted-foreground">{activeFilterCount} active</p>
            )}
          </div>
          {activeFilterCount > 0 && (
            <button 
              onClick={onClearAll}
              className="text-sm font-medium text-primary hover:text-primary/80 transition-colors"
            >
              Reset all
            </button>
          )}
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-5 space-y-6">

          {/* City Multi-Select Dropdown */}
          <div className="space-y-3">
            <label className="flex items-center gap-2 text-sm font-medium text-foreground">
              <MapPin className="h-4 w-4 text-muted-foreground" />
              Cities
            </label>
            <CityMultiSelect
              cities={cities}
              selected={selectedCities}
              onChange={onCitiesChange}
            />
          </div>

          <div className="h-px bg-border/50" />

          {/* Price Range Slider */}
          <div className="space-y-3">
            <label className="flex items-center gap-2 text-sm font-medium text-foreground">
              <DollarSign className="h-4 w-4 text-muted-foreground" />
              Price Range
            </label>
            <PriceRangeSlider
              value={priceRange}
              onChange={onPriceRangeChange}
              min={minPrice}
              max={maxPrice}
            />
          </div>

          <div className="h-px bg-border/50" />

          {/* Year Built Range */}
          <div className="space-y-3">
            <label className="flex items-center gap-2 text-sm font-medium text-foreground">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              Year Built
            </label>
            <YearBuiltRange
              minYear={yearBuiltMin}
              maxYear={yearBuiltMax}
              onChange={onYearBuiltChange}
            />
          </div>

          <div className="h-px bg-border/50" />

          {/* Square Footage */}
          <div className="space-y-3">
            <label className="flex items-center gap-2 text-sm font-medium text-foreground">
              <Building className="h-4 w-4 text-muted-foreground" />
              Square Footage
            </label>
            <SqftRange
              minSqft={sqftMin}
              maxSqft={sqftMax}
              onChange={onSqftChange}
            />
          </div>

          <div className="h-px bg-border/50" />

          {/* Property Type */}
          <div className="space-y-3">
            <label className="flex items-center gap-2 text-sm font-medium text-foreground">
              <Building className="h-4 w-4 text-muted-foreground" />
              Property Type
            </label>
            <div className="flex flex-wrap gap-2">
              {propertyTypes.map((opt) => {
                const Icon = opt.icon;
                const isSelected = selectedPropertyType === opt.value;
                return (
                  <button
                    key={opt.value}
                    onClick={() => onPropertyTypeChange(opt.value)}
                    className={cn(
                      "flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200",
                      isSelected
                        ? "bg-foreground text-background shadow-sm"
                        : "bg-secondary/60 text-foreground hover:bg-secondary"
                    )}
                  >
                    {Icon && <Icon className="h-4 w-4" />}
                    {opt.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="h-px bg-border/50" />

          {/* Bedrooms */}
          <div className="space-y-3">
            <label className="flex items-center gap-2 text-sm font-medium text-foreground">
              <Bed className="h-4 w-4 text-muted-foreground" />
              Bedrooms
            </label>
            <div className="grid grid-cols-5 gap-2">
              {bedOptions.map((opt) => {
                const isSelected = selectedBeds === opt.value;
                return (
                  <button
                    key={opt.value}
                    onClick={() => onBedsChange(opt.value)}
                    className={cn(
                      "py-3 rounded-xl text-sm font-medium transition-all duration-200 text-center",
                      isSelected
                        ? "bg-foreground text-background shadow-sm"
                        : "bg-secondary/60 text-foreground hover:bg-secondary"
                    )}
                  >
                    {opt.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="h-px bg-border/50" />

          {/* Bathrooms */}
          <div className="space-y-3">
            <label className="flex items-center gap-2 text-sm font-medium text-foreground">
              <Bath className="h-4 w-4 text-muted-foreground" />
              Bathrooms
            </label>
            <div className="grid grid-cols-5 gap-2">
              {bathOptions.map((opt) => {
                const isSelected = selectedBaths === opt.value;
                return (
                  <button
                    key={opt.value}
                    onClick={() => onBathsChange(opt.value)}
                    className={cn(
                      "py-3 rounded-xl text-sm font-medium transition-all duration-200 text-center",
                      isSelected
                        ? "bg-foreground text-background shadow-sm"
                        : "bg-secondary/60 text-foreground hover:bg-secondary"
                    )}
                  >
                    {opt.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Fixed Bottom Action */}
        <div className="px-5 py-4 border-t border-border bg-background pb-[max(env(safe-area-inset-bottom),16px)]">
          <Button
            onClick={onApply}
            className="w-full h-12 text-base font-medium rounded-xl"
          >
            Show Results
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
