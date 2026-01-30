import { useState, useRef, useEffect } from "react";
import { Search, SlidersHorizontal, X, Map, ChevronDown, Check } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

interface FilterOption {
  value: string;
  label: string;
}

interface FilterConfig {
  key: string;
  label: string;
  paramKey: string;
  options: FilterOption[];
  icon?: React.ReactNode;
  multiSelect?: boolean; // NEW: Enable multi-select for this filter
}

interface SortOption {
  value: string;
  label: string;
}

interface UnifiedSearchFiltersProps {
  // Search
  searchQuery: string;
  onSearchChange: (value: string) => void;
  searchPlaceholder?: string;
  
  // Filters
  filters: FilterConfig[];
  filterValues: Record<string, string>;
  onFilterChange: (key: string, value: string) => void;
  
  // Sort
  sortOptions: SortOption[];
  sortValue: string;
  onSortChange: (value: string) => void;
  
  // Map
  mapLink?: string;
  
  // Results
  resultCount?: number;
  
  // Clear
  onClearAll?: () => void;
  
  className?: string;
}

// Single-select filter chip
function FilterChip({
  label,
  value,
  options,
  onChange,
  isActive,
}: {
  label: string;
  value: string;
  options: FilterOption[];
  onChange: (value: string) => void;
  isActive: boolean;
}) {
  const [open, setOpen] = useState(false);
  const selectedLabel = options.find(o => o.value === value)?.label || label;
  
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          className={cn(
            "flex items-center gap-1.5 px-3 py-2 h-9 rounded-lg text-sm font-medium transition-all border whitespace-nowrap",
            isActive
              ? "bg-foreground text-background border-foreground"
              : "bg-background text-foreground border-border hover:border-foreground/50"
          )}
        >
          <span className="truncate max-w-[120px]">{isActive ? selectedLabel : label}</span>
          <ChevronDown className={cn("h-3.5 w-3.5 shrink-0 transition-transform", open && "rotate-180")} />
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-48 p-1" align="start">
        <div className="max-h-[280px] overflow-y-auto">
          {options.map((option) => (
            <button
              key={option.value}
              onClick={() => {
                onChange(option.value);
                setOpen(false);
              }}
              className={cn(
                "w-full flex items-center gap-2 px-3 py-2 text-sm rounded-md transition-colors text-left",
                option.value === value 
                  ? "bg-primary/10 text-primary font-medium" 
                  : "hover:bg-muted"
              )}
            >
              {option.label}
            </button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}

// Multi-select filter chip
function MultiSelectFilterChip({
  label,
  selectedValues,
  options,
  onChange,
}: {
  label: string;
  selectedValues: string[];
  options: FilterOption[];
  onChange: (values: string[]) => void;
}) {
  const [open, setOpen] = useState(false);
  const isActive = selectedValues.length > 0;
  
  // Filter out 'any' from options for multi-select
  const selectableOptions = options.filter(o => o.value !== "any");
  
  const displayLabel = isActive
    ? selectedValues.length === 1
      ? selectableOptions.find(o => o.value === selectedValues[0])?.label || selectedValues[0]
      : `${selectedValues.length} selected`
    : label;

  const toggleOption = (value: string) => {
    if (selectedValues.includes(value)) {
      onChange(selectedValues.filter(v => v !== value));
    } else {
      onChange([...selectedValues, value]);
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          className={cn(
            "flex items-center gap-1.5 px-3 py-2 h-9 rounded-lg text-sm font-medium transition-all border whitespace-nowrap",
            isActive
              ? "bg-foreground text-background border-foreground"
              : "bg-background text-foreground border-border hover:border-foreground/50"
          )}
        >
          <span className="truncate max-w-[120px]">{displayLabel}</span>
          {isActive && (
            <span
              onClick={(e) => { e.stopPropagation(); onChange([]); }}
              className="p-0.5 hover:bg-background/20 rounded cursor-pointer"
            >
              <X className="h-3 w-3" />
            </span>
          )}
          <ChevronDown className={cn("h-3.5 w-3.5 shrink-0 transition-transform", open && "rotate-180")} />
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-52 p-1" align="start">
        <div className="max-h-[280px] overflow-y-auto">
          {selectableOptions.map((option) => {
            const isSelected = selectedValues.includes(option.value);
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
                <span className="flex-1 truncate">{option.label}</span>
              </button>
            );
          })}
        </div>
        {selectedValues.length > 0 && (
          <div className="border-t border-border pt-1 mt-1">
            <button
              onClick={() => { onChange([]); setOpen(false); }}
              className="w-full px-3 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-muted rounded-md transition-colors"
            >
              Clear selection
            </button>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}

export function UnifiedSearchFilters({
  searchQuery,
  onSearchChange,
  searchPlaceholder = "Search projects...",
  filters,
  filterValues,
  onFilterChange,
  sortOptions,
  sortValue,
  onSortChange,
  mapLink,
  resultCount,
  onClearAll,
  className,
}: UnifiedSearchFiltersProps) {
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  
  // Helper to get multi-select values from comma-separated string
  const getMultiSelectValues = (value: string | undefined): string[] => {
    if (!value || value === "any") return [];
    return value.split(",").filter(Boolean);
  };
  
  // Calculate active filter count
  const activeFilterCount = filters.filter(f => {
    const val = filterValues[f.key];
    if (f.multiSelect) {
      return getMultiSelectValues(val).length > 0;
    }
    return val && val !== "any";
  }).length;
  
  // Get active filter pills for display
  const activeFilters = filters
    .filter(f => {
      const val = filterValues[f.key];
      if (f.multiSelect) {
        return getMultiSelectValues(val).length > 0;
      }
      return val && val !== "any";
    })
    .flatMap(f => {
      if (f.multiSelect) {
        const values = getMultiSelectValues(filterValues[f.key]);
        return values.map(v => ({
          key: `${f.key}-${v}`,
          paramKey: f.paramKey,
          value: v,
          label: f.options.find(o => o.value === v)?.label || v,
          isMulti: true,
          allValues: values,
        }));
      }
      return [{
        key: f.key,
        paramKey: f.paramKey,
        value: filterValues[f.key],
        label: f.options.find(o => o.value === filterValues[f.key])?.label || filterValues[f.key],
        isMulti: false,
        allValues: [],
      }];
    });

  return (
    <div className={cn("space-y-3", className)}>
      {/* Main Search Bar Row */}
      <div className="flex items-center gap-2">
        {/* Search Input */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
          <Input
            type="text"
            placeholder={searchPlaceholder}
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-10 h-10"
          />
        </div>
        
        {/* Desktop Filter Chips */}
        <div className="hidden md:flex items-center gap-2 flex-wrap">
          {filters.map((filter) => {
            if (filter.multiSelect) {
              const selectedValues = getMultiSelectValues(filterValues[filter.key]);
              return (
                <MultiSelectFilterChip
                  key={filter.key}
                  label={filter.label}
                  selectedValues={selectedValues}
                  options={filter.options}
                  onChange={(values) => onFilterChange(filter.paramKey, values.length > 0 ? values.join(",") : "any")}
                />
              );
            }
            return (
              <FilterChip
                key={filter.key}
                label={filter.label}
                value={filterValues[filter.key] || "any"}
                options={filter.options}
                onChange={(value) => onFilterChange(filter.paramKey, value)}
                isActive={filterValues[filter.key] !== undefined && filterValues[filter.key] !== "any"}
              />
            );
          })}
        </div>
        
        {/* Mobile Filters Button */}
        <Sheet open={mobileFiltersOpen} onOpenChange={setMobileFiltersOpen}>
          <SheetTrigger asChild>
            <Button 
              variant="outline" 
              size="sm" 
              className="md:hidden h-10 px-3 relative"
            >
              <SlidersHorizontal className="h-4 w-4" />
              {activeFilterCount > 0 && (
                <Badge className="absolute -top-2 -right-2 h-5 w-5 p-0 flex items-center justify-center text-xs">
                  {activeFilterCount}
                </Badge>
              )}
            </Button>
          </SheetTrigger>
          <SheetContent 
            side="bottom" 
            className="h-auto max-h-[85vh] rounded-t-3xl px-0 pb-0"
          >
            {/* Drag Handle */}
            <div className="flex justify-center pt-3 pb-2">
              <div className="w-10 h-1 rounded-full bg-border" />
            </div>
            
            {/* Header */}
            <div className="flex items-center justify-between px-5 pb-4">
              <div>
                <h2 className="text-lg font-semibold text-foreground">Filters</h2>
                {activeFilterCount > 0 && (
                  <p className="text-sm text-muted-foreground">{activeFilterCount} active</p>
                )}
              </div>
              {activeFilterCount > 0 && (
                <button 
                  onClick={() => onClearAll?.()}
                  className="text-sm font-medium text-primary hover:text-primary/80 transition-colors"
                >
                  Reset all
                </button>
              )}
            </div>
            
            {/* Filters Content */}
            <div className="px-5 pb-6 space-y-6 max-h-[55vh] overflow-y-auto">
              {filters.map((filter, index) => (
                <div key={filter.key} className="space-y-3">
                  <label className="text-sm font-medium text-foreground flex items-center gap-2">
                    {filter.label}
                  </label>
                  {filter.multiSelect ? (
                    // Multi-select chips with premium styling
                    <div className="flex flex-wrap gap-2">
                      {filter.options.filter(o => o.value !== "any").map((opt) => {
                        const selectedValues = getMultiSelectValues(filterValues[filter.key]);
                        const isSelected = selectedValues.includes(opt.value);
                        return (
                          <button
                            key={opt.value}
                            onClick={() => {
                              const newValues = isSelected
                                ? selectedValues.filter(v => v !== opt.value)
                                : [...selectedValues, opt.value];
                              onFilterChange(filter.paramKey, newValues.length > 0 ? newValues.join(",") : "any");
                            }}
                            className={cn(
                              "px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200",
                              isSelected
                                ? "bg-foreground text-background shadow-sm"
                                : "bg-secondary/60 text-foreground hover:bg-secondary"
                            )}
                          >
                            {isSelected && <Check className="h-3.5 w-3.5 inline mr-1.5" />}
                            {opt.label}
                          </button>
                        );
                      })}
                    </div>
                  ) : (
                    // Single select with premium grid
                    <div className="grid grid-cols-3 gap-2">
                      {filter.options.map((opt) => {
                        const isSelected = (filterValues[filter.key] || "any") === opt.value;
                        return (
                          <button
                            key={opt.value}
                            onClick={() => onFilterChange(filter.paramKey, opt.value)}
                            className={cn(
                              "py-3 px-3 rounded-xl text-sm font-medium transition-all duration-200 text-center",
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
                  )}
                  {index < filters.length - 1 && (
                    <div className="h-px bg-border/50 mt-4" />
                  )}
                </div>
              ))}
            </div>
            
            {/* Fixed Bottom Action */}
            <div className="px-5 py-4 border-t border-border bg-background">
              <Button 
                className="w-full h-12 text-base font-medium rounded-xl" 
                onClick={() => setMobileFiltersOpen(false)}
              >
                Show {resultCount?.toLocaleString() || 0} Results
              </Button>
            </div>
          </SheetContent>
        </Sheet>
        
        {/* Sort Dropdown */}
        <Select value={sortValue} onValueChange={onSortChange}>
          <SelectTrigger className="w-[150px] h-10 hidden sm:flex">
            <SelectValue placeholder="Sort" />
          </SelectTrigger>
          <SelectContent>
            {sortOptions.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        
        {/* Map Link */}
        {mapLink && (
          <Link to={mapLink}>
            <Button variant="outline" size="icon" className="h-10 w-10 shrink-0">
              <Map className="h-4 w-4" />
            </Button>
          </Link>
        )}
      </div>
      
      {/* Active Filters Pills Row */}
      {activeFilters.length > 0 && (
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm text-muted-foreground">Active:</span>
          {activeFilters.map((filter) => (
            <Badge 
              key={filter.key} 
              variant="secondary" 
              className="gap-1.5 text-xs py-1 px-2.5 cursor-pointer hover:bg-secondary/80"
              onClick={() => {
                if (filter.isMulti) {
                  // Remove just this value from multi-select
                  const newValues = filter.allValues.filter(v => v !== filter.value);
                  onFilterChange(filter.paramKey, newValues.length > 0 ? newValues.join(",") : "any");
                } else {
                  onFilterChange(filter.paramKey, "any");
                }
              }}
            >
              {filter.label}
              <X className="h-3 w-3" />
            </Badge>
          ))}
          {activeFilters.length > 1 && (
            <button 
              onClick={onClearAll}
              className="text-xs text-muted-foreground hover:text-foreground underline-offset-2 hover:underline"
            >
              Clear all
            </button>
          )}
        </div>
      )}
    </div>
  );
}
