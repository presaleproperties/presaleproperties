import { useState, useEffect, useRef, useMemo } from "react";
import { Search, X, MapPin, Building2, Home, Hash } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export interface SearchSuggestion {
  type: "city" | "neighborhood" | "project" | "listing";
  label: string;
  sublabel?: string;
  value: string;
  city?: string;
  lat?: number;
  lng?: number;
}

interface MLSListingForSearch {
  listing_key: string;
  listing_id?: string;
  city: string;
  street_number?: string | null;
  street_name?: string | null;
  street_suffix?: string | null;
  listing_price?: number;
  latitude?: number | null;
  longitude?: number | null;
}

interface PresaleProjectForSearch {
  name: string;
  city: string;
  slug: string;
  map_lat?: number | null;
  map_lng?: number | null;
}

interface MapSearchBarProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  onSuggestionSelect?: (suggestion: SearchSuggestion) => void;
  placeholder?: string;
  cities: string[];
  neighborhoods: { neighborhood: string; city: string }[];
  projects?: PresaleProjectForSearch[];
  listings?: MLSListingForSearch[];
  className?: string;
}

export function MapSearchBar({
  searchQuery,
  onSearchChange,
  onSuggestionSelect,
  placeholder = "Search city, neighborhood, MLS#, or address...",
  cities,
  neighborhoods,
  projects = [],
  listings = [],
  className,
}: MapSearchBarProps) {
  const [isFocused, setIsFocused] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const formatPrice = (price?: number) => {
    if (!price) return "";
    if (price >= 1000000) return `$${(price / 1000000).toFixed(2)}M`;
    return `$${(price / 1000).toFixed(0)}K`;
  };

  const suggestions = useMemo(() => {
    if (!searchQuery.trim() || searchQuery.length < 2) return [];
    
    const q = searchQuery.toLowerCase().trim();
    const results: SearchSuggestion[] = [];
    
    const isMLSSearch = /^r?\d+$/i.test(q);
    const cleanMLSQuery = q.replace(/^r/i, "");
    
    if (isMLSSearch || q.length >= 2) {
      listings.forEach(l => {
        const listingId = l.listing_key.toLowerCase();
        const address = [l.street_number, l.street_name, l.street_suffix].filter(Boolean).join(" ").toLowerCase();
        
        const matchesMLS = isMLSSearch && listingId.includes(cleanMLSQuery);
        const matchesAddress = !isMLSSearch && address.includes(q);
        
        if (matchesMLS || matchesAddress) {
          const displayAddress = [l.street_number, l.street_name, l.street_suffix].filter(Boolean).join(" ");
          results.push({
            type: "listing",
            label: displayAddress || l.listing_key,
            sublabel: `${l.listing_key} • ${l.city}${l.listing_price ? ` • ${formatPrice(l.listing_price)}` : ""}`,
            value: l.listing_key,
            city: l.city,
            lat: l.latitude ?? undefined,
            lng: l.longitude ?? undefined,
          });
        }
      });
    }
    
    cities.forEach(city => {
      if (city.toLowerCase().includes(q)) {
        results.push({ type: "city", label: city, sublabel: "City", value: city });
      }
    });
    
    const uniqueNeighborhoods = new Map<string, { neighborhood: string; city: string }>();
    neighborhoods.forEach(n => {
      if (n.neighborhood.toLowerCase().includes(q)) {
        const key = `${n.neighborhood}-${n.city}`;
        if (!uniqueNeighborhoods.has(key)) uniqueNeighborhoods.set(key, n);
      }
    });
    uniqueNeighborhoods.forEach(n => {
      results.push({ type: "neighborhood", label: n.neighborhood, sublabel: n.city, value: n.neighborhood, city: n.city });
    });
    
    projects.forEach(p => {
      if (p.name.toLowerCase().includes(q)) {
        results.push({ type: "project", label: p.name, sublabel: p.city, value: p.slug, city: p.city, lat: p.map_lat ?? undefined, lng: p.map_lng ?? undefined });
      }
    });
    
    if (isMLSSearch) {
      results.sort((a, b) => {
        if (a.type === "listing" && b.type !== "listing") return -1;
        if (a.type !== "listing" && b.type === "listing") return 1;
        return 0;
      });
    }
    
    return results.slice(0, 12);
  }, [searchQuery, cities, neighborhoods, projects, listings]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleFocus = () => {
    setIsFocused(true);
    if (searchQuery.length >= 2) setShowSuggestions(true);
  };

  const handleChange = (value: string) => {
    onSearchChange(value);
    setShowSuggestions(value.length >= 2);
  };

  const handleSuggestionClick = (suggestion: SearchSuggestion) => {
    onSuggestionSelect?.(suggestion);
    setShowSuggestions(false);
    inputRef.current?.blur();
  };

  const clearSearch = () => {
    onSearchChange("");
    setShowSuggestions(false);
    inputRef.current?.focus();
  };

  const getIcon = (type: SearchSuggestion["type"]) => {
    switch (type) {
      case "city": return <MapPin className="h-4 w-4 text-muted-foreground" />;
      case "neighborhood": return <Home className="h-4 w-4 text-muted-foreground" />;
      case "project": return <Building2 className="h-4 w-4 text-primary" />;
      case "listing": return <Hash className="h-4 w-4 text-primary" />;
    }
  };

  const getTypeLabel = (type: SearchSuggestion["type"]) => {
    switch (type) {
      case "city": return "City";
      case "neighborhood": return "Area";
      case "project": return "Presale";
      case "listing": return "MLS";
    }
  };

  const getTypeBadgeClass = (type: SearchSuggestion["type"]) => {
    switch (type) {
      case "listing": return "bg-accent text-accent-foreground";
      case "project": return "bg-primary/10 text-primary";
      default: return "bg-muted text-muted-foreground";
    }
  };

  return (
    <div ref={containerRef} className={cn("relative", className)}>
      <div className="relative flex items-center">
        <Search className="absolute left-3 h-4 w-4 text-muted-foreground pointer-events-none z-10" />
        <Input
          ref={inputRef}
          type="text"
          placeholder={placeholder}
          value={searchQuery}
          onChange={(e) => handleChange(e.target.value)}
          onFocus={handleFocus}
          onBlur={() => setIsFocused(false)}
          className={cn("pl-10 pr-10 bg-background", isFocused && "ring-2 ring-primary/20")}
        />
        {searchQuery && (
          <button onClick={clearSearch} className="absolute right-3 p-1 rounded-full hover:bg-muted transition-colors z-10" type="button">
            <X className="h-3.5 w-3.5 text-muted-foreground" />
          </button>
        )}
      </div>

      {showSuggestions && suggestions.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-background border border-border rounded-lg shadow-lg z-50 overflow-hidden">
          <div className="max-h-[350px] overflow-y-auto">
            {suggestions.map((suggestion, i) => (
              <button
                key={`${suggestion.type}-${suggestion.value}-${i}`}
                onClick={() => handleSuggestionClick(suggestion)}
                className="w-full flex items-center gap-3 px-4 py-3 hover:bg-muted transition-colors text-left border-b border-border/50 last:border-0"
              >
                <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center shrink-0">
                  {getIcon(suggestion.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm truncate">{suggestion.label}</div>
                  {suggestion.sublabel && <div className="text-xs text-muted-foreground truncate">{suggestion.sublabel}</div>}
                </div>
                <span className={cn("text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded shrink-0", getTypeBadgeClass(suggestion.type))}>
                  {getTypeLabel(suggestion.type)}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {showSuggestions && searchQuery.length >= 2 && suggestions.length === 0 && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-background border border-border rounded-lg shadow-lg z-50 p-4 text-center">
          <p className="text-sm text-muted-foreground">No results found for "{searchQuery}"</p>
        </div>
      )}
    </div>
  );
}
