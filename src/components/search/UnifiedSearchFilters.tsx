import { useState } from "react";
import { Search, SlidersHorizontal, X, Map, ChevronDown } from "lucide-react";
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

// Filter chip button component
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
  
  // Calculate active filter count
  const activeFilterCount = filters.filter(
    f => filterValues[f.key] && filterValues[f.key] !== "any"
  ).length;
  
  // Get active filter pills for display
  const activeFilters = filters
    .filter(f => filterValues[f.key] && filterValues[f.key] !== "any")
    .map(f => ({
      key: f.key,
      paramKey: f.paramKey,
      label: f.options.find(o => o.value === filterValues[f.key])?.label || filterValues[f.key],
    }));

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
          {filters.map((filter) => (
            <FilterChip
              key={filter.key}
              label={filter.label}
              value={filterValues[filter.key] || "any"}
              options={filter.options}
              onChange={(value) => onFilterChange(filter.paramKey, value)}
              isActive={filterValues[filter.key] !== undefined && filterValues[filter.key] !== "any"}
            />
          ))}
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
          <SheetContent side="bottom" className="h-auto max-h-[85vh] rounded-t-2xl">
            <SheetHeader className="pb-4 border-b border-border">
              <SheetTitle>Filters</SheetTitle>
            </SheetHeader>
            <div className="py-4 space-y-4 max-h-[60vh] overflow-y-auto">
              {filters.map((filter) => (
                <div key={filter.key}>
                  <label className="text-sm font-medium text-foreground mb-2 block">
                    {filter.label}
                  </label>
                  <Select 
                    value={filterValues[filter.key] || "any"} 
                    onValueChange={(v) => onFilterChange(filter.paramKey, v)}
                  >
                    <SelectTrigger className="h-11">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {filter.options.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              ))}
              
              {activeFilterCount > 0 && (
                <Button 
                  variant="outline" 
                  onClick={() => {
                    onClearAll?.();
                    setMobileFiltersOpen(false);
                  }} 
                  className="w-full"
                >
                  <X className="h-4 w-4 mr-2" />
                  Clear All Filters
                </Button>
              )}
            </div>
            
            <div className="pt-4 border-t border-border">
              <Button 
                className="w-full" 
                onClick={() => setMobileFiltersOpen(false)}
              >
                Show {resultCount || 0} Results
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
              onClick={() => onFilterChange(filter.paramKey, "any")}
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
