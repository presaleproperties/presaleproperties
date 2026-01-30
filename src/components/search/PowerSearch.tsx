import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Search, X, MapPin, Building2, Home, Hash, TrendingUp, Loader2, ArrowRight } from "lucide-react";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { getListingUrl } from "@/lib/propertiesUrls";

export type SearchResultType = "listing" | "presale" | "city" | "neighborhood" | "address";

export interface SearchResult {
  id: string;
  type: SearchResultType;
  title: string;
  subtitle?: string;
  price?: number;
  image?: string;
  url: string;
  meta?: {
    beds?: number;
    baths?: number;
    sqft?: number;
    propertyType?: string;
    city?: string;
  };
}

interface PowerSearchProps {
  placeholder?: string;
  className?: string;
  inputClassName?: string;
  autoFocus?: boolean;
  onResultSelect?: (result: SearchResult) => void;
  showRecent?: boolean;
  maxResults?: number;
  mode?: "all" | "presale" | "resale";
  variant?: "default" | "hero" | "compact";
}

const formatPrice = (price?: number | null): string => {
  if (!price) return "";
  if (price >= 1000000) {
    const m = price / 1000000;
    return m % 1 === 0 ? `$${m}M` : `$${m.toFixed(2)}M`;
  }
  return `$${Math.round(price / 1000)}K`;
};

export function PowerSearch({
  placeholder = "Search address, MLS#, city, or project...",
  className,
  inputClassName,
  autoFocus = false,
  onResultSelect,
  showRecent = true,
  maxResults = 8,
  mode = "all",
  variant = "default",
}: PowerSearchProps) {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);
  const [debouncedQuery, setDebouncedQuery] = useState("");

  // Debounce search query
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setDebouncedQuery(query);
    }, 200);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query]);

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Search query - unified across all sources
  const { data: results = [], isLoading } = useQuery({
    queryKey: ["power-search", debouncedQuery, mode],
    queryFn: async (): Promise<SearchResult[]> => {
      if (!debouncedQuery || debouncedQuery.length < 2) return [];

      const q = debouncedQuery.toLowerCase().trim();
      const searchResults: SearchResult[] = [];
      
      // Check if searching for MLS# (R followed by digits or just digits)
      const isMLSSearch = /^r?\d{5,}$/i.test(q);
      const cleanMLSQuery = q.replace(/^r/i, "");

      // 1. Search MLS Listings (resale properties)
      if (mode === "all" || mode === "resale") {
        const { data: listings } = await supabase
          .from("mls_listings")
          .select(`
            id, listing_key, listing_price, city, neighborhood,
            street_number, street_name, street_suffix, unit_number,
            bedrooms_total, bathrooms_total, living_area,
            property_type, property_sub_type, photos
          `)
          .eq("mls_status", "Active")
          .limit(500);

        listings?.forEach((l) => {
          const listingKey = l.listing_key?.toLowerCase() || "";
          const address = [l.street_number, l.street_name, l.street_suffix].filter(Boolean).join(" ");
          const fullAddress = l.unit_number ? `#${l.unit_number} - ${address}` : address;
          const addressLower = fullAddress.toLowerCase();
          const cityLower = l.city?.toLowerCase() || "";
          const neighborhoodLower = l.neighborhood?.toLowerCase() || "";

          // Match by MLS number
          const matchesMLS = isMLSSearch && listingKey.includes(cleanMLSQuery);
          // Match by address
          const matchesAddress = !isMLSSearch && (
            addressLower.includes(q) || 
            cityLower.includes(q) || 
            neighborhoodLower.includes(q)
          );

          if (matchesMLS || matchesAddress) {
            let photo: string | undefined;
            if (l.photos && Array.isArray(l.photos) && l.photos.length > 0) {
              const firstPhoto = l.photos[0] as { MediaURL?: string };
              photo = firstPhoto?.MediaURL || undefined;
            }
            const url = getListingUrl(l.listing_key, fullAddress, l.city);
            
            searchResults.push({
              id: l.listing_key,
              type: "listing",
              title: fullAddress || l.listing_key,
              subtitle: `${l.listing_key} • ${l.city}`,
              price: l.listing_price,
              image: photo || undefined,
              url,
              meta: {
                beds: l.bedrooms_total || undefined,
                baths: l.bathrooms_total || undefined,
                sqft: l.living_area || undefined,
                propertyType: l.property_sub_type || l.property_type,
                city: l.city,
              },
            });
          }
        });
      }

      // 2. Search Presale Projects
      if (mode === "all" || mode === "presale") {
        const { data: projects } = await supabase
          .from("presale_projects")
          .select(`
            id, name, slug, city, neighborhood, 
            starting_price, featured_image, project_type, status
          `)
          .eq("is_published", true);

        projects?.forEach((p) => {
          const nameLower = p.name.toLowerCase();
          const cityLower = p.city.toLowerCase();
          const neighborhoodLower = p.neighborhood?.toLowerCase() || "";

          if (
            nameLower.includes(q) ||
            cityLower.includes(q) ||
            neighborhoodLower.includes(q)
          ) {
            searchResults.push({
              id: p.id,
              type: "presale",
              title: p.name,
              subtitle: `${p.neighborhood || ""} ${p.neighborhood ? "•" : ""} ${p.city}`.trim(),
              price: p.starting_price || undefined,
              image: p.featured_image || undefined,
              url: `/presale-projects/${p.slug}`,
              meta: {
                propertyType: p.project_type,
                city: p.city,
              },
            });
          }
        });
      }

      // 3. Aggregate cities and neighborhoods for quick filters
      const cityMap = new Map<string, number>();
      const neighborhoodMap = new Map<string, { count: number; city: string }>();

      searchResults.forEach((r) => {
        if (r.meta?.city) {
          const city = r.meta.city;
          const cityLower = city.toLowerCase();
          if (cityLower.includes(q)) {
            cityMap.set(city, (cityMap.get(city) || 0) + 1);
          }
        }
      });

      // Add city suggestions
      const cityResults: SearchResult[] = [];
      cityMap.forEach((count, city) => {
        if (count >= 2 && !searchResults.some(r => r.type === "city" && r.title === city)) {
          cityResults.push({
            id: `city-${city}`,
            type: "city",
            title: city,
            subtitle: `${count} properties`,
            url: `/map-search?city=${encodeURIComponent(city)}`,
          });
        }
      });

      // Sort results: exact matches first, then by price
      const sortedResults = [...searchResults].sort((a, b) => {
        const aExact = a.title.toLowerCase().startsWith(q) ? 0 : 1;
        const bExact = b.title.toLowerCase().startsWith(q) ? 0 : 1;
        if (aExact !== bExact) return aExact - bExact;
        
        // MLS listings first if MLS search
        if (isMLSSearch) {
          if (a.type === "listing" && b.type !== "listing") return -1;
          if (a.type !== "listing" && b.type === "listing") return 1;
        }
        
        return (b.price || 0) - (a.price || 0);
      });

      // Combine: cities first if relevant, then results
      return [...cityResults.slice(0, 2), ...sortedResults].slice(0, maxResults);
    },
    enabled: debouncedQuery.length >= 2,
    staleTime: 30000,
  });

  // Recent searches from localStorage
  const recentSearches = useMemo(() => {
    if (!showRecent || query.length >= 2) return [];
    try {
      const stored = localStorage.getItem("recentSearches");
      return stored ? JSON.parse(stored).slice(0, 4) : [];
    } catch {
      return [];
    }
  }, [showRecent, query]);

  const displayResults = query.length >= 2 ? results : recentSearches;

  // Save to recent searches
  const saveRecentSearch = useCallback((result: SearchResult) => {
    try {
      const stored = localStorage.getItem("recentSearches");
      const recent = stored ? JSON.parse(stored) : [];
      const filtered = recent.filter((r: SearchResult) => r.id !== result.id);
      const updated = [result, ...filtered].slice(0, 10);
      localStorage.setItem("recentSearches", JSON.stringify(updated));
    } catch {
      // Ignore storage errors
    }
  }, []);

  const handleSelect = useCallback((result: SearchResult) => {
    saveRecentSearch(result);
    setIsOpen(false);
    setQuery("");
    
    if (onResultSelect) {
      onResultSelect(result);
    } else {
      navigate(result.url);
    }
  }, [navigate, onResultSelect, saveRecentSearch]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen || displayResults.length === 0) return;

      switch (e.key) {
        case "ArrowDown":
          e.preventDefault();
          setActiveIndex((prev) => (prev < displayResults.length - 1 ? prev + 1 : 0));
          break;
        case "ArrowUp":
          e.preventDefault();
          setActiveIndex((prev) => (prev > 0 ? prev - 1 : displayResults.length - 1));
          break;
        case "Enter":
          e.preventDefault();
          if (activeIndex >= 0 && displayResults[activeIndex]) {
            handleSelect(displayResults[activeIndex]);
          } else if (query.trim()) {
            // Search all results
            navigate(`/map-search?q=${encodeURIComponent(query)}`);
            setIsOpen(false);
          }
          break;
        case "Escape":
          setIsOpen(false);
          inputRef.current?.blur();
          break;
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, displayResults, activeIndex, handleSelect, navigate, query]);

  // Reset active index on results change
  useEffect(() => {
    setActiveIndex(-1);
  }, [results]);

  const getIcon = (type: SearchResultType) => {
    switch (type) {
      case "listing":
        return <Home className="h-4 w-4 text-primary" />;
      case "presale":
        return <Building2 className="h-4 w-4 text-primary" />;
      case "city":
        return <MapPin className="h-4 w-4 text-muted-foreground" />;
      case "neighborhood":
        return <MapPin className="h-4 w-4 text-muted-foreground" />;
      case "address":
        return <Hash className="h-4 w-4 text-primary" />;
    }
  };

  const getTypeLabel = (type: SearchResultType) => {
    switch (type) {
      case "listing":
        return "Resale";
      case "presale":
        return "Presale";
      case "city":
        return "City";
      case "neighborhood":
        return "Area";
      case "address":
        return "Address";
    }
  };

  const isHero = variant === "hero";
  const isCompact = variant === "compact";

  return (
    <div ref={containerRef} className={cn("relative w-full", className)}>
      {/* Search Input */}
      <div className="relative">
        <Search className={cn(
          "absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none z-10",
          isHero ? "h-5 w-5 text-muted-foreground" : "h-4 w-4 text-muted-foreground"
        )} />
        <Input
          ref={inputRef}
          type="text"
          placeholder={placeholder}
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          autoFocus={autoFocus}
          className={cn(
            "pl-10 pr-10 transition-all",
            isHero && "h-14 text-base rounded-xl",
            isCompact && "h-9 text-sm",
            isOpen && displayResults.length > 0 && "rounded-b-none",
            inputClassName
          )}
        />
        {isLoading && (
          <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
        )}
        {!isLoading && query && (
          <button
            onClick={() => {
              setQuery("");
              inputRef.current?.focus();
            }}
            className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-muted transition-colors"
            type="button"
          >
            <X className="h-3.5 w-3.5 text-muted-foreground" />
          </button>
        )}
      </div>

      {/* Results Dropdown */}
      {isOpen && (displayResults.length > 0 || (query.length >= 2 && !isLoading)) && (
        <div className={cn(
          "absolute left-0 right-0 top-full z-50 bg-background border border-t-0 border-border shadow-lg overflow-hidden",
          isHero ? "rounded-b-xl" : "rounded-b-lg"
        )}>
          {/* Results List */}
          {displayResults.length > 0 ? (
            <div className="max-h-[400px] overflow-y-auto">
              {query.length < 2 && recentSearches.length > 0 && (
                <div className="px-4 py-2 border-b border-border">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Recent Searches</p>
                </div>
              )}
              {displayResults.map((result, index) => (
                <button
                  key={result.id}
                  onClick={() => handleSelect(result)}
                  onMouseEnter={() => setActiveIndex(index)}
                  className={cn(
                    "w-full flex items-center gap-3 px-4 py-3 text-left transition-colors border-b border-border/50 last:border-0",
                    index === activeIndex ? "bg-muted" : "hover:bg-muted/50"
                  )}
                >
                  {/* Image or Icon */}
                  {result.image ? (
                    <div className="w-12 h-12 rounded-lg overflow-hidden bg-muted shrink-0">
                      <img
                        src={result.image}
                        alt={result.title}
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                    </div>
                  ) : (
                    <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center shrink-0">
                      {getIcon(result.type)}
                    </div>
                  )}

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-sm truncate">{result.title}</p>
                      <span className={cn(
                        "text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded shrink-0",
                        result.type === "presale" ? "bg-primary/10 text-primary" :
                        result.type === "listing" ? "bg-accent text-accent-foreground" :
                        "bg-muted text-muted-foreground"
                      )}>
                        {getTypeLabel(result.type)}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground truncate">{result.subtitle}</p>
                    {result.meta && (result.meta.beds || result.meta.baths || result.meta.sqft) && (
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {[
                          result.meta.beds && `${result.meta.beds} bed`,
                          result.meta.baths && `${result.meta.baths} bath`,
                          result.meta.sqft && `${result.meta.sqft.toLocaleString()} sqft`,
                        ].filter(Boolean).join(" • ")}
                      </p>
                    )}
                  </div>

                  {/* Price */}
                  {result.price && (
                    <div className="text-right shrink-0">
                      <p className="font-semibold text-sm">{formatPrice(result.price)}</p>
                    </div>
                  )}
                </button>
              ))}
            </div>
          ) : (
            <div className="p-6 text-center">
              <p className="text-sm text-muted-foreground">No results found for "{query}"</p>
              <p className="text-xs text-muted-foreground mt-1">Try searching by address, MLS#, city, or project name</p>
            </div>
          )}

          {/* View All Results Link */}
          {query.length >= 2 && displayResults.length > 0 && (
            <button
              onClick={() => {
                navigate(`/map-search?q=${encodeURIComponent(query)}`);
                setIsOpen(false);
              }}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-muted/50 hover:bg-muted transition-colors text-sm font-medium text-primary"
            >
              View all results for "{query}"
              <ArrowRight className="h-4 w-4" />
            </button>
          )}
        </div>
      )}
    </div>
  );
}
