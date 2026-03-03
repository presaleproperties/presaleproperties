import { useState, useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { Building2, MapPin, MapPinned, HardHat, TrendingUp, Hash } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

type SuggestionType = "project" | "neighborhood" | "city" | "developer" | "presale" | "listing";

interface SearchSuggestionsProps {
  query: string;
  onSelect: (value: string, type: SuggestionType, slug?: string) => void;
  isVisible: boolean;
  onClose: () => void;
  searchMode?: "projects" | "resale" | "assignments";
  glassStyle?: boolean;
}

interface Suggestion {
  value: string;
  type: SuggestionType;
  count: number;
  slug?: string;
  sublabel?: string;
}

export type { SuggestionType };

export function SearchSuggestions({ 
  query, 
  onSelect, 
  isVisible, 
  onClose,
  searchMode = "projects",
  glassStyle = false
}: SearchSuggestionsProps) {
  const [activeIndex, setActiveIndex] = useState(-1);
  const listRef = useRef<HTMLDivElement>(null);

  // Fetch popular suggestions (shown when no query)
  const { data: popularSuggestions = [] } = useQuery({
    queryKey: ["popular-suggestions", searchMode],
    queryFn: async () => {
      const results: Suggestion[] = [];

      if (searchMode === "projects") {
        // Get popular presale projects
        const { data: projects } = await supabase
          .from("presale_projects")
          .select("name, slug, city, neighborhood")
          .eq("is_published", true)
          .order("created_at", { ascending: false })
          .limit(5);

        projects?.forEach((project) => {
          results.push({ 
            value: project.name, 
            type: "presale", 
            count: 1,
            slug: project.slug 
          });
        });

        // Get popular cities from presale projects
        const { data: cityCounts } = await supabase
          .from("presale_projects")
          .select("city")
          .eq("is_published", true);

        const cityMap = new Map<string, number>();
        cityCounts?.forEach((p) => {
          cityMap.set(p.city, (cityMap.get(p.city) || 0) + 1);
        });
        
        Array.from(cityMap.entries())
          .sort((a, b) => b[1] - a[1])
          .slice(0, 3)
          .forEach(([city, count]) => {
            results.push({ value: city, type: "city", count });
          });
      } else {
        // Get MLS listings data for resale
        const { data: listings } = await supabase
          .from("mls_listings_safe")
          .select("city, neighborhood")
          .eq("mls_status", "Active")
          .limit(100);

        const cityCounts = new Map<string, number>();

        listings?.forEach((listing) => {
          if (listing.city) {
            cityCounts.set(listing.city, (cityCounts.get(listing.city) || 0) + 1);
          }
        });

        // Top cities
        Array.from(cityCounts.entries())
          .sort((a, b) => b[1] - a[1])
          .slice(0, 5)
          .forEach(([city, count]) => {
            results.push({ value: city, type: "city", count });
          });
      }

      return results;
    },
    enabled: isVisible && query.length < 2,
    staleTime: 60000, // Cache for 1 minute
  });

  // Fetch search suggestions (shown when query has 2+ chars)
  const { data: searchSuggestions = [] } = useQuery({
    queryKey: ["search-suggestions", query, searchMode],
    queryFn: async () => {
      if (!query || query.length < 2) return [];

      const lowerQuery = query.toLowerCase();
      const results: Suggestion[] = [];

      if (searchMode === "projects") {
        // Search presale projects
        const { data: projects } = await supabase
          .from("presale_projects")
          .select("name, slug, city, neighborhood, developer_name")
          .eq("is_published", true);

        const presaleCounts = new Map<string, { count: number; slug: string }>();
        const neighborhoodCounts = new Map<string, number>();
        const cityCounts = new Map<string, number>();
        const developerCounts = new Map<string, number>();

        projects?.forEach((project) => {
          if (project.name.toLowerCase().includes(lowerQuery)) {
            presaleCounts.set(project.name, { count: 1, slug: project.slug });
          }
          if (project.neighborhood?.toLowerCase().includes(lowerQuery)) {
            neighborhoodCounts.set(project.neighborhood, (neighborhoodCounts.get(project.neighborhood) || 0) + 1);
          }
          if (project.city.toLowerCase().includes(lowerQuery)) {
            cityCounts.set(project.city, (cityCounts.get(project.city) || 0) + 1);
          }
          if (project.developer_name?.toLowerCase().includes(lowerQuery)) {
            developerCounts.set(project.developer_name, (developerCounts.get(project.developer_name) || 0) + 1);
          }
        });

        presaleCounts.forEach(({ count, slug }, value) => {
          results.push({ value, type: "presale", count, slug });
        });
        neighborhoodCounts.forEach((count, value) => {
          results.push({ value, type: "neighborhood", count });
        });
        cityCounts.forEach((count, value) => {
          results.push({ value, type: "city", count });
        });
        developerCounts.forEach((count, value) => {
          results.push({ value, type: "developer", count });
        });
      } else {
        // Search MLS listings for resale - include MLS# and address search
        const lowerQuery = query.toLowerCase().trim();
        
        // Check if searching for MLS# (R followed by digits)
        const isMLSSearch = /^r?\d+$/i.test(lowerQuery);
        const cleanMLSQuery = lowerQuery.replace(/^r/i, "");
        
        // Fetch more data to support MLS# and address search
        const { data: listings } = await supabase
          .from("mls_listings_safe")
          .select("listing_key, city, neighborhood, street_number, street_name, street_suffix, listing_price")
          .eq("mls_status", "Active")
          .gte("year_built", 2024)
          .limit(1000);

        const neighborhoodCounts = new Map<string, number>();
        const cityCounts = new Map<string, number>();

        // Format price for display
        const formatPrice = (price?: number) => {
          if (!price) return "";
          if (price >= 1000000) return `$${(price / 1000000).toFixed(2)}M`;
          return `$${(price / 1000).toFixed(0)}K`;
        };

        listings?.forEach((listing) => {
          const listingKey = listing.listing_key?.toLowerCase() || "";
          const address = [listing.street_number, listing.street_name, listing.street_suffix].filter(Boolean).join(" ");
          const addressLower = address.toLowerCase();
          
          // Match by MLS number
          if (isMLSSearch && listingKey.includes(cleanMLSQuery)) {
            const displayAddress = address || listing.listing_key;
            const priceStr = formatPrice(listing.listing_price);
            results.push({
              value: listing.listing_key, // Use listing_key as the value for navigation
              type: "listing" as SuggestionType,
              count: 1,
              slug: listing.listing_key,
              sublabel: `${displayAddress} • ${listing.city}${priceStr ? ` • ${priceStr}` : ""}`
            });
          }
          // Match by address
          else if (!isMLSSearch && addressLower.includes(lowerQuery)) {
            const priceStr = formatPrice(listing.listing_price);
            results.push({
              value: listing.listing_key,
              type: "listing" as SuggestionType,
              count: 1,
              slug: listing.listing_key,
              sublabel: `${address} • ${listing.city}${priceStr ? ` • ${priceStr}` : ""}`
            });
          }
          
          // Also match neighborhoods and cities
          if (listing.neighborhood?.toLowerCase().includes(lowerQuery)) {
            neighborhoodCounts.set(listing.neighborhood, (neighborhoodCounts.get(listing.neighborhood) || 0) + 1);
          }
          if (listing.city?.toLowerCase().includes(lowerQuery)) {
            cityCounts.set(listing.city, (cityCounts.get(listing.city) || 0) + 1);
          }
        });

        // Add neighborhood and city results after listings
        neighborhoodCounts.forEach((count, value) => {
          results.push({ value, type: "neighborhood", count });
        });
        cityCounts.forEach((count, value) => {
          results.push({ value, type: "city", count });
        });
      }

      // Sort: listings first if MLS search, then by count
      if (/^r?\d+$/i.test(query.trim())) {
        results.sort((a, b) => {
          if (a.type === "listing" && b.type !== "listing") return -1;
          if (a.type !== "listing" && b.type === "listing") return 1;
          return b.count - a.count;
        });
      } else {
        results.sort((a, b) => b.count - a.count);
      }

      return results.slice(0, 10);
    },
    enabled: query.length >= 2 && isVisible,
  });

  const suggestions = query.length >= 2 ? searchSuggestions : popularSuggestions;
  const isShowingPopular = query.length < 2 && popularSuggestions.length > 0;

  useEffect(() => {
    setActiveIndex(-1);
  }, [query]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isVisible || suggestions.length === 0) return;

      switch (e.key) {
        case "ArrowDown":
          e.preventDefault();
          setActiveIndex((prev) => (prev < suggestions.length - 1 ? prev + 1 : 0));
          break;
        case "ArrowUp":
          e.preventDefault();
          setActiveIndex((prev) => (prev > 0 ? prev - 1 : suggestions.length - 1));
          break;
        case "Enter":
          e.preventDefault();
          if (activeIndex >= 0 && suggestions[activeIndex]) {
            const s = suggestions[activeIndex];
            onSelect(s.value, s.type, s.slug);
          }
          break;
        case "Escape":
          onClose();
          break;
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isVisible, suggestions, activeIndex, onSelect, onClose]);

  if (!isVisible || suggestions.length === 0) {
    return null;
  }

  const getIcon = (type: SuggestionType) => {
    const iconClass = glassStyle ? "text-white/80" : "text-primary";
    const mutedIconClass = glassStyle ? "text-white/60" : "text-muted-foreground";
    
    switch (type) {
      case "project":
      case "presale":
        return <Building2 className={cn("h-4 w-4 shrink-0", iconClass)} />;
      case "neighborhood":
        return <MapPin className={cn("h-4 w-4 shrink-0", mutedIconClass)} />;
      case "city":
        return <MapPinned className={cn("h-4 w-4 shrink-0", iconClass)} />;
      case "developer":
        return <HardHat className={cn("h-4 w-4 shrink-0", iconClass)} />;
      case "listing":
        return <Hash className={cn("h-4 w-4 shrink-0", iconClass)} />;
    }
  };

  const getLabel = (type: SuggestionType, sublabel?: string) => {
    if (type === "listing" && sublabel) {
      return sublabel;
    }
    switch (type) {
      case "project":
        return "Presale";
      case "presale":
        return "Presale";
      case "neighborhood":
        return "Neighborhood";
      case "city":
        return "City";
      case "developer":
        return "Developer";
      case "listing":
        return "MLS Listing";
    }
  };

  return (
    <div
      ref={listRef}
      className={cn(
        "overflow-hidden max-h-64 overflow-y-auto",
        glassStyle ? "bg-transparent" : "bg-background"
      )}
    >
      {suggestions.map((suggestion, index) => (
        <button
          key={`${suggestion.type}-${suggestion.value}`}
          type="button"
          className={cn(
            "w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors",
            glassStyle 
              ? index === activeIndex 
                ? "bg-white/20" 
                : "hover:bg-white/10"
              : index === activeIndex 
                ? "bg-muted" 
                : "hover:bg-muted/50"
          )}
          onClick={() => onSelect(suggestion.value, suggestion.type, suggestion.slug)}
          onMouseEnter={() => setActiveIndex(index)}
        >
          {getIcon(suggestion.type)}
          <div className="flex-1 min-w-0">
            <p className={cn(
              "font-medium truncate text-sm",
              glassStyle ? "text-white" : "text-foreground"
            )}>
              {suggestion.type === "listing" ? suggestion.sublabel?.split(" • ")[0] || suggestion.value : suggestion.value}
            </p>
            <p className={cn(
              "text-xs truncate",
              glassStyle ? "text-white/60" : "text-muted-foreground"
            )}>
              {getLabel(suggestion.type, suggestion.sublabel)}
              {suggestion.type !== "listing" && suggestion.count > 1 && ` · ${suggestion.count} ${suggestion.type === "presale" ? "project" : "listing"}${suggestion.count !== 1 ? "s" : ""}`}
            </p>
          </div>
        </button>
      ))}
    </div>
  );
}