import { useState, useEffect, useRef, useMemo } from "react";
import { Search, X, MapPin, Building2, Home, Hash, FileText } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export interface SearchSuggestion {
  type: "city" | "neighborhood" | "project" | "listing" | "assignment";
  label: string;
  sublabel?: string;
  value: string;
  city?: string;
  lat?: number;
  lng?: number;
}

interface MLSListingForSearch {
  listing_key: string;
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

interface AssignmentForSearch {
  id: string;
  title: string;
  project_name: string;
  city: string;
  neighborhood?: string | null;
  assignment_price: number;
  map_lat?: number | null;
  map_lng?: number | null;
}

interface MobileMapSearchBarProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  onSuggestionSelect: (suggestion: SearchSuggestion) => void;
  onLocationRequest?: () => void;
  cities: string[];
  cityCoordinates: Record<string, { lat: number; lng: number; zoom: number }>;
  neighborhoods: { neighborhood: string; city: string }[];
  projects?: PresaleProjectForSearch[];
  listings?: MLSListingForSearch[];
  assignments?: AssignmentForSearch[];
  homeButton?: React.ReactNode;
  filterButton?: React.ReactNode;
  listButton?: React.ReactNode;
}

export function MobileMapSearchBar({
  searchQuery,
  onSearchChange,
  onSuggestionSelect,
  onLocationRequest,
  cities,
  cityCoordinates,
  neighborhoods,
  projects = [],
  listings = [],
  assignments = [],
  homeButton,
  filterButton,
  listButton,
}: MobileMapSearchBarProps) {
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Recent searches from localStorage
  const RECENT_SEARCHES_KEY = "pp_recent_searches";
  const [recentSearches, setRecentSearches] = useState<string[]>(() => {
    try {
      const stored = localStorage.getItem(RECENT_SEARCHES_KEY);
      return stored ? JSON.parse(stored).slice(0, 5) : [];
    } catch { return []; }
  });

  const saveRecentSearch = (query: string) => {
    const updated = [query, ...recentSearches.filter(s => s !== query)].slice(0, 5);
    setRecentSearches(updated);
    try { localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updated)); } catch {}
  };

  // Format price for display
  const formatPrice = (price?: number) => {
    if (!price) return "";
    if (price >= 1000000) return `$${(price / 1000000).toFixed(2)}M`;
    return `$${(price / 1000).toFixed(0)}K`;
  };

  // Generate suggestions based on search query
  const suggestions = useMemo(() => {
    if (!searchQuery.trim() || searchQuery.length < 2) return [];
    
    const q = searchQuery.toLowerCase().trim();
    const results: SearchSuggestion[] = [];
    
    // Check if searching for MLS# (R followed by digits)
    const isMLSSearch = /^r?\d+$/i.test(q);
    const cleanMLSQuery = q.replace(/^r/i, "");
    
    // Match MLS listings by listing_key (R#) or address - prioritize if R# search
    if (isMLSSearch || q.length >= 2) {
      listings.forEach(l => {
        const listingId = l.listing_key.toLowerCase();
        const address = [l.street_number, l.street_name, l.street_suffix].filter(Boolean).join(" ").toLowerCase();
        
        // Match by MLS number (listing_key contains the R number)
        const matchesMLS = isMLSSearch && listingId.includes(cleanMLSQuery);
        // Match by address
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

    // Match Assignments (NEW!)
    if (q.length >= 2) {
      assignments.forEach(a => {
        const titleLower = a.title.toLowerCase();
        const projectLower = a.project_name.toLowerCase();
        const cityLower = a.city.toLowerCase();
        const neighborhoodLower = a.neighborhood?.toLowerCase() || "";
        
        if (
          titleLower.includes(q) ||
          projectLower.includes(q) ||
          cityLower.includes(q) ||
          neighborhoodLower.includes(q)
        ) {
          results.push({
            type: "assignment",
            label: a.title || a.project_name,
            sublabel: `Assignment • ${a.city}${a.assignment_price ? ` • ${formatPrice(a.assignment_price)}` : ""}`,
            value: a.id,
            city: a.city,
            lat: a.map_lat ?? undefined,
            lng: a.map_lng ?? undefined,
          });
        }
      });
    }
    
    // Match cities
    cities.forEach(city => {
      if (city.toLowerCase().includes(q)) {
        const coords = cityCoordinates[city];
        results.push({
          type: "city",
          label: city,
          sublabel: "City",
          value: city,
          lat: coords?.lat,
          lng: coords?.lng,
        });
      }
    });
    
    // Match neighborhoods
    const uniqueNeighborhoods = new Map<string, { neighborhood: string; city: string }>();
    neighborhoods.forEach(n => {
      if (n.neighborhood.toLowerCase().includes(q)) {
        const key = `${n.neighborhood}-${n.city}`;
        if (!uniqueNeighborhoods.has(key)) {
          uniqueNeighborhoods.set(key, n);
        }
      }
    });
    uniqueNeighborhoods.forEach(n => {
      const cityCoords = cityCoordinates[n.city];
      results.push({
        type: "neighborhood",
        label: n.neighborhood,
        sublabel: n.city,
        value: n.neighborhood,
        city: n.city,
        lat: cityCoords?.lat,
        lng: cityCoords?.lng,
      });
    });
    
    // Match projects
    projects.forEach(p => {
      if (p.name.toLowerCase().includes(q)) {
        results.push({
          type: "project",
          label: p.name,
          sublabel: p.city,
          value: p.slug,
          city: p.city,
          lat: p.map_lat ?? undefined,
          lng: p.map_lng ?? undefined,
        });
      }
    });
    
    // Sort: listings first if MLS search, otherwise mix
    if (isMLSSearch) {
      results.sort((a, b) => {
        if (a.type === "listing" && b.type !== "listing") return -1;
        if (a.type !== "listing" && b.type === "listing") return 1;
        return 0;
      });
    }
    
    return results.slice(0, 10);
  }, [searchQuery, cities, cityCoordinates, neighborhoods, projects, listings, assignments]);

  // Close suggestions on outside click
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
    if (searchQuery.length >= 2) {
      setShowSuggestions(true);
    } else if (searchQuery.length === 0 && recentSearches.length > 0) {
      setShowSuggestions(true);
    }
  };

  const handleBlur = () => {
    setIsFocused(false);
    // Delay hiding to allow click on suggestion
    setTimeout(() => {
      setShowSuggestions(false);
    }, 200);
  };

  const handleChange = (value: string) => {
    onSearchChange(value);
    setShowSuggestions(value.length >= 2 || (value.length === 0 && recentSearches.length > 0));
  };

  const handleSuggestionClick = (suggestion: SearchSuggestion) => {
    saveRecentSearch(suggestion.label);
    onSuggestionSelect(suggestion);
    setShowSuggestions(false);
    onSearchChange("");
    inputRef.current?.blur();
  };

  const clearSearch = () => {
    onSearchChange("");
    setShowSuggestions(false);
    inputRef.current?.focus();
  };

  const getIcon = (type: SearchSuggestion["type"]) => {
    switch (type) {
      case "city":
        return <MapPin className="h-4 w-4 text-muted-foreground" />;
      case "neighborhood":
        return <Home className="h-4 w-4 text-muted-foreground" />;
      case "project":
        return <Building2 className="h-4 w-4 text-primary" />;
      case "listing":
        return <Hash className="h-4 w-4 text-primary" />;
      case "assignment":
        return <FileText className="h-4 w-4 text-warning" />;
    }
  };

  const getTypeLabel = (type: SearchSuggestion["type"]) => {
    switch (type) {
      case "city": return "City";
      case "neighborhood": return "Area";
      case "project": return "Presale";
      case "listing": return "MLS";
      case "assignment": return "Assignment";
    }
  };

  const getTypeBadgeClass = (type: SearchSuggestion["type"]) => {
    switch (type) {
      case "listing": return "bg-accent text-accent-foreground";
      case "project": return "bg-primary/10 text-primary";
      case "assignment": return "bg-warning/10 text-warning";
      default: return "bg-muted text-muted-foreground";
    }
  };

  return (
    <div ref={containerRef} className="relative w-full">
      {/* Premium Compact Search Bar */}
      <div className={cn(
        "flex items-center gap-2 bg-card/98 dark:bg-background/98 backdrop-blur-2xl rounded-[14px] shadow-lg shadow-neutral-900/8 border border-card/50 dark:border-card/10 px-3 py-1.5 transition-all",
        isFocused && "ring-2 ring-primary/20 border-primary/30"
      )}>
        {/* Menu/Home Button - Far Left */}
        {homeButton}
        {/* Divider */}
        <div className="w-px h-5 bg-neutral-900/8 dark:bg-card/10" />
        <Search className="h-4 w-4 text-muted-foreground/60 shrink-0" />
        <Input
          ref={inputRef}
          type="text"
          placeholder="City, MLS#, Address..."
          value={searchQuery}
          onChange={(e) => handleChange(e.target.value)}
          onFocus={handleFocus}
          onBlur={handleBlur}
          className="flex-1 h-8 border-0 bg-transparent focus-visible:ring-0 text-[15px] placeholder:text-muted-foreground/40 px-0 py-0"
        />
        {searchQuery && (
          <button 
            onClick={clearSearch}
            className="p-1 rounded-full hover:bg-neutral-900/5 dark:hover:bg-card/10 transition-colors"
          >
            <X className="h-3.5 w-3.5 text-muted-foreground/60" />
          </button>
        )}
        {/* Divider */}
        <div className="w-px h-5 bg-neutral-900/8 dark:bg-card/10" />
        {/* List View Button */}
        {listButton}
        {/* Divider */}
        <div className="w-px h-5 bg-neutral-900/8 dark:bg-card/10" />
        {/* Filter Button - Far Right */}
        {filterButton}
      </div>

      {/* Suggestions Dropdown */}
      {showSuggestions && suggestions.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-card/98 dark:bg-background/98 backdrop-blur-2xl border border-card/50 dark:border-card/10 rounded-2xl shadow-xl shadow-neutral-900/10 overflow-hidden z-50">
          <div className="max-h-[60vh] overflow-y-auto">
            {suggestions.map((suggestion, i) => (
              <button
                key={`${suggestion.type}-${suggestion.value}-${i}`}
                onClick={() => handleSuggestionClick(suggestion)}
                className="w-full flex items-center gap-3 px-4 py-3 hover:bg-neutral-900/5 dark:hover:bg-card/5 active:bg-neutral-900/10 dark:active:bg-card/10 transition-colors text-left border-b border-neutral-900/5 dark:border-card/5 last:border-0"
              >
                <div className="w-9 h-9 rounded-xl bg-muted/50 flex items-center justify-center shrink-0">
                  {getIcon(suggestion.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-[15px] truncate">{suggestion.label}</div>
                  {suggestion.sublabel && (
                    <div className="text-xs text-muted-foreground truncate">{suggestion.sublabel}</div>
                  )}
                </div>
                <span className={cn(
                  "text-[10px] uppercase tracking-wider px-2 py-1 rounded-md font-medium shrink-0",
                  getTypeBadgeClass(suggestion.type)
                )}>
                  {getTypeLabel(suggestion.type)}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Recent Searches - shown when focused with no query */}
      {showSuggestions && searchQuery.length < 2 && suggestions.length === 0 && recentSearches.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-card/98 dark:bg-background/98 backdrop-blur-2xl border border-card/50 dark:border-card/10 rounded-2xl shadow-xl shadow-neutral-900/10 overflow-hidden z-50">
          <div className="px-4 py-2 border-b border-neutral-900/5 dark:border-card/5">
            <span className="text-[11px] uppercase tracking-wider text-muted-foreground/60 font-semibold">Recent</span>
          </div>
          {recentSearches.map((search, i) => (
            <button
              key={`recent-${i}`}
              onClick={() => {
                onSearchChange(search);
                setShowSuggestions(true);
              }}
              className="w-full flex items-center gap-3 px-4 py-3 hover:bg-neutral-900/5 dark:hover:bg-card/5 transition-colors text-left border-b border-neutral-900/5 dark:border-card/5 last:border-0"
            >
              <Search className="h-4 w-4 text-muted-foreground/40 shrink-0" />
              <span className="text-sm text-foreground truncate">{search}</span>
            </button>
          ))}
        </div>
      )}

      {/* No results message */}
      {showSuggestions && searchQuery.length >= 2 && suggestions.length === 0 && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-card/98 dark:bg-background/98 backdrop-blur-2xl border border-card/50 dark:border-card/10 rounded-2xl shadow-xl shadow-neutral-900/10 overflow-hidden z-50 p-4 text-center">
          <p className="text-sm text-muted-foreground">No results for "{searchQuery}"</p>
          <p className="text-xs text-muted-foreground/60 mt-1">Try a city name, MLS #, or address</p>
        </div>
      )}
    </div>
  );
}
