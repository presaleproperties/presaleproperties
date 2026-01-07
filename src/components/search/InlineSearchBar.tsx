import { Search, Map, SlidersHorizontal } from "lucide-react";
import { Link } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface SortOption {
  value: string;
  label: string;
}

interface InlineSearchBarProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  placeholder?: string;
  sortValue: string;
  onSortChange: (value: string) => void;
  sortOptions: SortOption[];
  mapLink: string;
  onFilterClick?: () => void;
  activeFilterCount?: number;
  className?: string;
}

export function InlineSearchBar({
  searchQuery,
  onSearchChange,
  placeholder = "Search...",
  sortValue,
  onSortChange,
  sortOptions,
  mapLink,
  onFilterClick,
  activeFilterCount = 0,
  className,
}: InlineSearchBarProps) {
  return (
    <div className={cn("flex items-center gap-2", className)}>
      {/* Search Input with integrated Map button */}
      <div className="relative flex-1 flex items-center">
        <Search className="absolute left-3 h-4 w-4 text-muted-foreground pointer-events-none" />
        <Input
          type="text"
          placeholder={placeholder}
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-10 pr-12"
        />
        <Link 
          to={mapLink} 
          className="absolute right-1 p-2 rounded-md hover:bg-muted transition-colors"
          title="View on map"
        >
          <Map className="h-4 w-4 text-muted-foreground hover:text-foreground" />
        </Link>
      </div>

      {/* Sort Dropdown */}
      <Select value={sortValue} onValueChange={onSortChange}>
        <SelectTrigger className="w-[140px] hidden sm:flex">
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

      {/* Filter Button (mobile) */}
      {onFilterClick && (
        <Button
          variant="outline"
          size="icon"
          onClick={onFilterClick}
          className="md:hidden relative"
        >
          <SlidersHorizontal className="h-4 w-4" />
          {activeFilterCount > 0 && (
            <Badge className="absolute -top-2 -right-2 h-5 w-5 p-0 flex items-center justify-center text-xs">
              {activeFilterCount}
            </Badge>
          )}
        </Button>
      )}
    </div>
  );
}
