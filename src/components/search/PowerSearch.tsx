import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Search, X, MapPin, Building2, Home, Hash, FileText, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { getListingUrl } from "@/lib/propertiesUrls";
import { generateProjectUrl } from "@/lib/seoUrls";

export type SearchResultType = "listing" | "presale" | "assignment" | "city" | "neighborhood";

export interface SearchResult {
  id: string;
  type: SearchResultType;
  title: string;
  subtitle?: string;
  price?: number;
  image?: string;
  url: string;
  lat?: number;
  lng?: number;
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
  mode?: "all" | "presale" | "resale" | "assignments";
  variant?: "default" | "hero" | "compact";
  hideIcon?: boolean;
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
  maxResults = 10,
  mode = "all",
  variant = "default",
  hideIcon = false,
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
    }, 150); // Faster debounce for snappier UX
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

  // Unified search query - uses database-level search
  const { data: results = [], isLoading } = useQuery({
    queryKey: ["power-search-v2", debouncedQuery, mode],
    queryFn: async (): Promise<SearchResult[]> => {
      if (!debouncedQuery || debouncedQuery.length < 2) return [];

      const q = debouncedQuery.trim();
      const qLower = q.toLowerCase();
      const searchResults: SearchResult[] = [];
      
      // Check if searching for MLS# (R followed by digits or just digits)
      const isMLSSearch = /^r?\d{5,}$/i.test(q);
      const cleanMLSQuery = q.replace(/^r/i, "").toUpperCase();

      // Run all searches in parallel for speed
      const promises: Promise<void>[] = [];

      // 1. Search MLS Listings (resale properties) - DATABASE LEVEL
      if (mode === "all" || mode === "resale") {
        const mlsPromise = (async () => {
          let query = supabase
            .from("mls_listings")
            .select(`
              id, listing_key, listing_price, city, neighborhood,
              street_number, street_name, street_suffix, unit_number,
              bedrooms_total, bathrooms_total, living_area,
              property_type, property_sub_type, photos, latitude, longitude
            `)
            .eq("mls_status", "Active");

          if (isMLSSearch) {
            // Search by MLS number (listing_key contains R + number)
            query = query.ilike("listing_key", `%${cleanMLSQuery}%`);
          } else {
            // Search by address, city, or neighborhood using database ILIKE
            query = query.or(`street_name.ilike.%${q}%,city.ilike.%${q}%,neighborhood.ilike.%${q}%,street_number.ilike.%${q}%`);
          }

          const { data: listings } = await query.limit(isMLSSearch ? 20 : 15);

          listings?.forEach((l) => {
            const address = [l.street_number, l.street_name, l.street_suffix].filter(Boolean).join(" ");
            const fullAddress = l.unit_number ? `#${l.unit_number} - ${address}` : address;
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
              image: photo,
              url,
              lat: l.latitude ?? undefined,
              lng: l.longitude ?? undefined,
              meta: {
                beds: l.bedrooms_total || undefined,
                baths: l.bathrooms_total || undefined,
                sqft: l.living_area || undefined,
                propertyType: l.property_sub_type || l.property_type,
                city: l.city,
              },
            });
          });
        })();
        promises.push(mlsPromise);
      }

      // 2. Search Presale Projects - DATABASE LEVEL
      if (mode === "all" || mode === "presale") {
        const presalePromise = (async () => {
          const { data: projects } = await supabase
            .from("presale_projects")
            .select(`
              id, name, slug, city, neighborhood, 
              starting_price, featured_image, project_type, status, map_lat, map_lng
            `)
            .eq("is_published", true)
            .or(`name.ilike.%${q}%,city.ilike.%${q}%,neighborhood.ilike.%${q}%`)
            .limit(10);

          projects?.forEach((p) => {
            const projectUrl = generateProjectUrl({
              slug: p.slug,
              neighborhood: p.neighborhood || p.city,
              projectType: p.project_type as any,
            });
            searchResults.push({
              id: p.id,
              type: "presale",
              title: p.name,
              subtitle: `${p.neighborhood || ""} ${p.neighborhood ? "•" : ""} ${p.city}`.trim(),
              price: p.starting_price || undefined,
              image: p.featured_image || undefined,
              url: projectUrl,
              lat: p.map_lat ?? undefined,
              lng: p.map_lng ?? undefined,
              meta: {
                propertyType: p.project_type,
                city: p.city,
              },
            });
          });
        })();
        promises.push(presalePromise);
      }

      // 3. Search Assignments - DATABASE LEVEL (NEW!)
      if (mode === "all" || mode === "assignments") {
        const assignmentPromise = (async () => {
          const { data: assignments } = await (supabase as any)
            .from("listings")
            .select(`
              id, title, project_name, city, neighborhood, 
              assignment_price, beds, baths, map_lat, map_lng, status
            `)
            .eq("status", "published")
            .or(`title.ilike.%${q}%,project_name.ilike.%${q}%,city.ilike.%${q}%,neighborhood.ilike.%${q}%`)
            .limit(10);

          (assignments as any[])?.forEach((a: any) => {
            searchResults.push({
              id: a.id,
              type: "assignment",
              title: a.title || a.project_name,
              subtitle: `${a.neighborhood || ""} ${a.neighborhood ? "•" : ""} ${a.city}`.trim(),
              price: a.assignment_price || undefined,
              url: `/assignments/${a.id}`,
              lat: a.map_lat ?? undefined,
              lng: a.map_lng ?? undefined,
              meta: {
                beds: a.beds || undefined,
                baths: a.baths || undefined,
                city: a.city,
              },
            });
          });
        })();
        promises.push(assignmentPromise);
      }

      // Wait for all searches to complete
      await Promise.all(promises);

      // 4. Add city suggestions for matching cities
      const matchedCities = new Set<string>();
      searchResults.forEach((r) => {
        if (r.meta?.city && r.meta.city.toLowerCase().includes(qLower)) {
          matchedCities.add(r.meta.city);
        }
      });

      const cityResults: SearchResult[] = [];
      matchedCities.forEach((city) => {
        // Only add if there are multiple results for this city and query closely matches city name
        const cityCount = searchResults.filter(r => r.meta?.city === city).length;
        if (cityCount >= 2 && city.toLowerCase().startsWith(qLower.slice(0, 3))) {
          cityResults.push({
            id: `city-${city}`,
            type: "city",
            title: city,
            subtitle: `${cityCount} properties`,
            url: `/map-search?city=${encodeURIComponent(city)}`,
          });
        }
      });

      // Sort results: exact matches first, then by relevance
      const sortedResults = [...searchResults].sort((a, b) => {
        const aExact = a.title.toLowerCase().startsWith(qLower) ? 0 : 1;
        const bExact = b.title.toLowerCase().startsWith(qLower) ? 0 : 1;
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
      case "assignment":
        return <FileText className="h-4 w-4 text-primary/70" />;
      case "city":
        return <MapPin className="h-4 w-4 text-muted-foreground" />;
      case "neighborhood":
        return <MapPin className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getTypeLabel = (type: SearchResultType) => {
    switch (type) {
      case "listing":
        return "MLS";
      case "presale":
        return "Presale";
      case "assignment":
        return "Assignment";
      case "city":
        return "City";
      case "neighborhood":
        return "Area";
    }
  };

  const getTypeBadgeClass = (type: SearchResultType) => {
    switch (type) {
      case "listing":
        return "bg-accent text-accent-foreground";
      case "presale":
        return "bg-primary/10 text-primary";
      case "assignment":
        return "bg-primary/8 text-primary/80";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  const isHero = variant === "hero";
  const isCompact = variant === "compact";

  return (
    <div ref={containerRef} className={cn("relative w-full", className)}>
      {/* Search Input */}
      <div className="relative">
        {!hideIcon && (
          <Search className={cn(
            "absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none z-10",
            isHero ? "h-5 w-5 text-muted-foreground" : "h-4 w-4 text-muted-foreground"
          )} />
        )}
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
            "transition-all",
            !hideIcon && "pl-10",
            hideIcon && "pl-3",
            "pr-10",
            isHero && !hideIcon && "h-14 text-base rounded-xl",
            isHero && hideIcon && "h-full text-sm rounded-none border-0 shadow-none bg-transparent",
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
          "absolute left-0 right-0 top-full z-[9999] overflow-hidden",
          "bg-background/98 backdrop-blur-xl",
          "border border-border/60 border-t-0",
          "shadow-[0_16px_48px_-8px_rgba(0,0,0,0.18)]",
          isHero ? "rounded-b-2xl" : "rounded-b-xl"
        )}>

          {/* Section header for recent */}
          {query.length < 2 && recentSearches.length > 0 && (
            <div className="px-4 pt-3 pb-1.5">
              <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest">Recent</p>
            </div>
          )}

          {/* Results List */}
          {displayResults.length > 0 ? (
            <div className="max-h-[min(420px,60vh)] overflow-y-auto overscroll-contain divide-y divide-border/40">
              {displayResults.map((result, index) => (
                <button
                  key={result.id}
                  onClick={() => handleSelect(result)}
                  onMouseEnter={() => setActiveIndex(index)}
                  className={cn(
                    "w-full flex items-center gap-3 px-4 py-3 text-left transition-colors",
                    index === activeIndex ? "bg-muted/70" : "hover:bg-muted/40 active:bg-muted/70"
                  )}
                >
                  {/* Thumbnail or Icon */}
                  {result.image ? (
                    <div className="w-11 h-11 rounded-lg overflow-hidden bg-muted shrink-0 ring-1 ring-border/30">
                      <img
                        src={result.image}
                        alt={result.title}
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                    </div>
                  ) : (
                    <div className={cn(
                      "w-9 h-9 rounded-lg flex items-center justify-center shrink-0",
                      result.type === "city" || result.type === "neighborhood"
                        ? "bg-muted"
                        : "bg-primary/8"
                    )}>
                      {getIcon(result.type)}
                    </div>
                  )}

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline gap-2 mb-0.5">
                      <p className="font-semibold text-[13px] text-foreground truncate leading-tight">{result.title}</p>
                      <span className={cn(
                        "text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-md shrink-0 leading-none",
                        getTypeBadgeClass(result.type)
                      )}>
                        {getTypeLabel(result.type)}
                      </span>
                    </div>
                    <p className="text-[11px] text-muted-foreground truncate leading-tight">
                      {result.subtitle}
                      {result.meta && (result.meta.beds || result.meta.sqft) && (
                        <span className="text-muted-foreground/60">
                          {" · "}
                          {[
                            result.meta.beds && `${result.meta.beds}bd`,
                            result.meta.baths && `${result.meta.baths}ba`,
                            result.meta.sqft && `${result.meta.sqft.toLocaleString()} ft²`,
                          ].filter(Boolean).join(" ")}
                        </span>
                      )}
                    </p>
                  </div>

                  {/* Price */}
                  {result.price && (
                    <p className="font-bold text-[13px] text-primary shrink-0 tabular-nums">
                      {formatPrice(result.price)}
                    </p>
                  )}
                </button>
              ))}
            </div>
          ) : (
            <div className="px-4 py-8 text-center">
              <p className="text-sm font-medium text-foreground/70">No results for "{query}"</p>
              <p className="text-xs text-muted-foreground mt-1">Try a city, address, MLS#, or project name</p>
            </div>
          )}

          {/* View All on Map footer */}
          {query.length >= 2 && results.length > 0 && (
            <button
              onClick={() => {
                navigate(`/map-search?q=${encodeURIComponent(query)}`);
                setIsOpen(false);
              }}
              className="w-full px-4 py-3 flex items-center justify-center gap-2 text-[12px] font-semibold text-primary hover:bg-primary/5 active:bg-primary/10 transition-colors border-t border-border/50"
            >
              <MapPin className="h-3.5 w-3.5" />
              See all on map
            </button>
          )}
        </div>
      )}
    </div>
  );
}
