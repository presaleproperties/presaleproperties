import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Search, SlidersHorizontal, Map, X } from "lucide-react";
import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

interface FilterOption {
  value: string;
  label: string;
}

interface ResaleFilterBarProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  cityFilter: string;
  onCityChange: (value: string) => void;
  propertyTypeFilter: string;
  onPropertyTypeChange: (value: string) => void;
  priceFilter: string;
  onPriceChange: (value: string) => void;
  bedsFilter: string;
  onBedsChange: (value: string) => void;
  sortBy: string;
  onSortChange: (value: string) => void;
  onClearFilters: () => void;
  activeFilterCount: number;
  showMapLink?: boolean;
  mapLinkPath?: string;
  cityOptions?: FilterOption[];
  propertyTypeOptions?: FilterOption[];
  priceRangeOptions?: FilterOption[];
  bedsOptions?: FilterOption[];
  sortOptions?: FilterOption[];
}

const DEFAULT_CITIES: FilterOption[] = [
  { value: "all", label: "All Cities" },
  { value: "Vancouver", label: "Vancouver" },
  { value: "Surrey", label: "Surrey" },
  { value: "Burnaby", label: "Burnaby" },
  { value: "Richmond", label: "Richmond" },
  { value: "Coquitlam", label: "Coquitlam" },
  { value: "Langley", label: "Langley" },
  { value: "Delta", label: "Delta" },
  { value: "Abbotsford", label: "Abbotsford" },
];

const DEFAULT_PROPERTY_TYPES: FilterOption[] = [
  { value: "all", label: "All Types" },
  { value: "Apartment/Condo", label: "Condo" },
  { value: "Townhouse", label: "Townhouse" },
  { value: "Single Family", label: "House" },
];

const DEFAULT_PRICE_RANGES: FilterOption[] = [
  { value: "all", label: "Any Price" },
  { value: "0-500000", label: "Under $500K" },
  { value: "500000-750000", label: "$500K - $750K" },
  { value: "750000-1000000", label: "$750K - $1M" },
  { value: "1000000-1500000", label: "$1M - $1.5M" },
  { value: "1500000-2000000", label: "$1.5M - $2M" },
  { value: "2000000-999999999", label: "$2M+" },
];

const DEFAULT_BEDS: FilterOption[] = [
  { value: "all", label: "Any Beds" },
  { value: "1", label: "1+ Bed" },
  { value: "2", label: "2+ Beds" },
  { value: "3", label: "3+ Beds" },
  { value: "4", label: "4+ Beds" },
];

const DEFAULT_SORT: FilterOption[] = [
  { value: "newest", label: "Newest" },
  { value: "price_asc", label: "Price: Low to High" },
  { value: "price_desc", label: "Price: High to Low" },
  { value: "beds_desc", label: "Most Bedrooms" },
];

export const ResaleFilterBar = ({
  searchQuery,
  onSearchChange,
  cityFilter,
  onCityChange,
  propertyTypeFilter,
  onPropertyTypeChange,
  priceFilter,
  onPriceChange,
  bedsFilter,
  onBedsChange,
  sortBy,
  onSortChange,
  onClearFilters,
  activeFilterCount,
  showMapLink = true,
  mapLinkPath = "/map-search?mode=resale",
  cityOptions = DEFAULT_CITIES,
  propertyTypeOptions = DEFAULT_PROPERTY_TYPES,
  priceRangeOptions = DEFAULT_PRICE_RANGES,
  bedsOptions = DEFAULT_BEDS,
  sortOptions = DEFAULT_SORT,
}: ResaleFilterBarProps) => {
  const FilterControls = ({ isMobile = false }: { isMobile?: boolean }) => (
    <div className={`${isMobile ? "space-y-4" : "flex flex-wrap items-center gap-3"}`}>
      <Select value={cityFilter} onValueChange={onCityChange}>
        <SelectTrigger className={`${isMobile ? "w-full" : "w-[140px]"} h-10`}>
          <SelectValue placeholder="City" />
        </SelectTrigger>
        <SelectContent className="bg-popover border-border z-[100]">
          {cityOptions.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select value={propertyTypeFilter} onValueChange={onPropertyTypeChange}>
        <SelectTrigger className={`${isMobile ? "w-full" : "w-[140px]"} h-10`}>
          <SelectValue placeholder="Property Type" />
        </SelectTrigger>
        <SelectContent className="bg-popover border-border z-[100]">
          {propertyTypeOptions.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select value={priceFilter} onValueChange={onPriceChange}>
        <SelectTrigger className={`${isMobile ? "w-full" : "w-[150px]"} h-10`}>
          <SelectValue placeholder="Price Range" />
        </SelectTrigger>
        <SelectContent className="bg-popover border-border z-[100]">
          {priceRangeOptions.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select value={bedsFilter} onValueChange={onBedsChange}>
        <SelectTrigger className={`${isMobile ? "w-full" : "w-[120px]"} h-10`}>
          <SelectValue placeholder="Beds" />
        </SelectTrigger>
        <SelectContent className="bg-popover border-border z-[100]">
          {bedsOptions.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select value={sortBy} onValueChange={onSortChange}>
        <SelectTrigger className={`${isMobile ? "w-full" : "w-[160px]"} h-10`}>
          <SelectValue placeholder="Sort By" />
        </SelectTrigger>
        <SelectContent className="bg-popover border-border z-[100]">
          {sortOptions.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {activeFilterCount > 0 && (
        <Button
          variant="ghost"
          size="sm"
          onClick={onClearFilters}
          className="text-muted-foreground hover:text-foreground gap-1"
        >
          <X className="h-4 w-4" />
          Clear
        </Button>
      )}
    </div>
  );

  return (
    <div className="bg-card border border-border rounded-xl p-3 sm:p-4 shadow-sm">
      {/* Search row */}
      <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by address, city, or MLS#..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-10 h-11 text-base"
          />
        </div>

        {/* Mobile filter button */}
        <Sheet>
          <SheetTrigger asChild>
            <Button
              variant="outline"
              size="icon"
              className="h-11 w-11 lg:hidden relative flex-shrink-0"
            >
              <SlidersHorizontal className="h-4 w-4" />
              {activeFilterCount > 0 && (
                <Badge className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center text-xs bg-primary text-primary-foreground">
                  {activeFilterCount}
                </Badge>
              )}
            </Button>
          </SheetTrigger>
          <SheetContent side="bottom" className="h-auto max-h-[80vh] rounded-t-2xl">
            <SheetHeader className="pb-4">
              <SheetTitle>Filters</SheetTitle>
            </SheetHeader>
            <FilterControls isMobile />
          </SheetContent>
        </Sheet>

        {/* Map link */}
        {showMapLink && (
          <Link to={mapLinkPath}>
            <Button
              variant="outline"
              className="h-11 gap-2 whitespace-nowrap flex-shrink-0"
            >
              <Map className="h-4 w-4" />
              <span className="hidden sm:inline">Map</span>
            </Button>
          </Link>
        )}
      </div>

      {/* Desktop filters */}
      <div className="hidden lg:block">
        <FilterControls />
      </div>
    </div>
  );
};
