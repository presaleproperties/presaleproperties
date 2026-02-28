import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { createPortal } from "react-dom";
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
  dropdownContainer?: React.RefObject<HTMLElement | null>;
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
  dropdownContainer,
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
      {isOpen && (displayResults.length > 0 || (query.length >= 2 && !isLoading)) && (() => {
        const dropdown = (
          <div
            className={cn(
              "absolute left-0 right-0 top-full z-[9999] overflow-hidden",
              "bg-white dark:bg-card",
              "border border-border/40 border-t-0",
              "shadow-[0_24px_64px_-12px_rgba(0,0,0,0.25)]",
              "animate-in fade-in-0 slide-in-from-top-2 duration-200 ease-out",
              isHero ? "rounded-b-2xl" : "rounded-b-xl"
            )}
          >
            {/* Section label for recent */}
            {query.length < 2 && recentSearches.length > 0 && (
              <div className="px-5 pt-3.5 pb-1">
                <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-[0.14em]">Recent</p>
              </div>
            )}

            {/* Results list */}
            {displayResults.length > 0 ? (
              <ul className="max-h-[min(440px,65vh)] overflow-y-auto overscroll-contain">
                {displayResults.map((result, index) => (
                  <li key={result.id}>
                    <button
                      onClick={() => handleSelect(result)}
                      onMouseEnter={() => setActiveIndex(index)}
                      className={cn(
                        "w-full flex items-center gap-3.5 px-4 py-3 text-left transition-colors duration-100",
                        "border-b border-border/30 last:border-0",
                        index === activeIndex
                          ? "bg-muted/60"
                          : "hover:bg-muted/35 active:bg-muted/60"
                      )}
                    >
                      {/* Thumbnail */}
                      {result.image ? (
                        <div className="w-12 h-12 rounded-xl overflow-hidden bg-muted shrink-0 shadow-sm">
                          <img src={result.image} alt={result.title} className="w-full h-full object-cover" loading="lazy" />
                        </div>
                      ) : (
                        <div className={cn(
                          "w-10 h-10 rounded-xl flex items-center justify-center shrink-0",
                          result.type === "city" || result.type === "neighborhood" ? "bg-muted/70" : "bg-primary/10"
                        )}>
                          {getIcon(result.type)}
                        </div>
                      )}

                      {/* Text */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className="font-semibold text-[13.5px] text-foreground truncate leading-snug">{result.title}</span>
                          <span className={cn("text-[9px] font-bold uppercase tracking-wider px-1.5 py-[3px] rounded-md shrink-0 leading-none", getTypeBadgeClass(result.type))}>
                            {getTypeLabel(result.type)}
                          </span>
                        </div>
                        <p className="text-[11.5px] text-muted-foreground truncate leading-snug">
                          {result.subtitle}
                          {result.meta && (result.meta.beds || result.meta.sqft) && (
                            <span className="text-muted-foreground/55">
                              {" · "}{[result.meta.beds && `${result.meta.beds} bd`, result.meta.baths && `${result.meta.baths} ba`, result.meta.sqft && `${result.meta.sqft.toLocaleString()} ft²`].filter(Boolean).join(" ")}
                            </span>
                          )}
                        </p>
                      </div>

                      {/* Price */}
                      {result.price && (
                        <span className="font-bold text-[14px] text-primary shrink-0 tabular-nums">{formatPrice(result.price)}</span>
                      )}
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="px-5 py-8 text-center">
                <Search className="h-8 w-8 text-muted-foreground/30 mx-auto mb-2.5" />
                <p className="text-sm font-medium text-foreground/60">No results for "{query}"</p>
                <p className="text-xs text-muted-foreground/50 mt-1">Try a city, address, MLS#, or project name</p>
              </div>
            )}

            {/* Footer CTA */}
            {query.length >= 2 && results.length > 0 && (
              <button
                onClick={() => { navigate(`/map-search?q=${encodeURIComponent(query)}`); setIsOpen(false); }}
                className="w-full px-5 py-3.5 flex items-center justify-center gap-2 text-[12px] font-semibold text-primary hover:bg-primary/5 active:bg-primary/10 transition-colors border-t border-border/40"
              >
                <MapPin className="h-3.5 w-3.5" />
                See all results on map
              </button>
            )}
          </div>
        );

        return dropdownContainer?.current
          ? createPortal(dropdown, dropdownContainer.current)
          : dropdown;
      })()}
    </div>
  );
}
