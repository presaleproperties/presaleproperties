import { useState, useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { Building2, MapPin, MapPinned, HardHat, TrendingUp } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

type SuggestionType = "project" | "neighborhood" | "city" | "developer" | "presale";

interface SearchSuggestionsProps {
  query: string;
  onSelect: (value: string, type: SuggestionType) => void;
  isVisible: boolean;
  onClose: () => void;
  searchMode?: "assignments" | "projects";
}

interface Suggestion {
  value: string;
  type: SuggestionType;
  count: number;
  slug?: string;
}

export type { SuggestionType };

export function SearchSuggestions({ 
  query, 
  onSelect, 
  isVisible, 
  onClose,
  searchMode = "projects"
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
        // Get listings data for assignments
        const { data: listings } = await supabase
          .from("listings")
          .select("project_name, neighborhood, city, developer_name")
          .eq("status", "published");

        const projectCounts = new Map<string, number>();
        const cityCounts = new Map<string, number>();

        listings?.forEach((listing) => {
          projectCounts.set(listing.project_name, (projectCounts.get(listing.project_name) || 0) + 1);
          cityCounts.set(listing.city, (cityCounts.get(listing.city) || 0) + 1);
        });

        // Top projects
        Array.from(projectCounts.entries())
          .sort((a, b) => b[1] - a[1])
          .slice(0, 4)
          .forEach(([project, count]) => {
            results.push({ value: project, type: "project", count });
          });

        // Top cities
        Array.from(cityCounts.entries())
          .sort((a, b) => b[1] - a[1])
          .slice(0, 3)
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
        // Search listings for assignments
        const { data: listings } = await supabase
          .from("listings")
          .select("project_name, neighborhood, city, developer_name")
          .eq("status", "published");

        const projectCounts = new Map<string, number>();
        const neighborhoodCounts = new Map<string, number>();
        const cityCounts = new Map<string, number>();
        const developerCounts = new Map<string, number>();

        listings?.forEach((listing) => {
          if (listing.project_name.toLowerCase().includes(lowerQuery)) {
            projectCounts.set(listing.project_name, (projectCounts.get(listing.project_name) || 0) + 1);
          }
          if (listing.neighborhood?.toLowerCase().includes(lowerQuery)) {
            neighborhoodCounts.set(listing.neighborhood, (neighborhoodCounts.get(listing.neighborhood) || 0) + 1);
          }
          if (listing.city.toLowerCase().includes(lowerQuery)) {
            cityCounts.set(listing.city, (cityCounts.get(listing.city) || 0) + 1);
          }
          if (listing.developer_name?.toLowerCase().includes(lowerQuery)) {
            developerCounts.set(listing.developer_name, (developerCounts.get(listing.developer_name) || 0) + 1);
          }
        });

        projectCounts.forEach((count, value) => {
          results.push({ value, type: "project", count });
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
      }

      return results.sort((a, b) => b.count - a.count).slice(0, 8);
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
            onSelect(suggestions[activeIndex].value, suggestions[activeIndex].type);
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
    switch (type) {
      case "project":
      case "presale":
        return <Building2 className="h-4 w-4 text-primary shrink-0" />;
      case "neighborhood":
        return <MapPin className="h-4 w-4 text-muted-foreground shrink-0" />;
      case "city":
        return <MapPinned className="h-4 w-4 text-blue-500 shrink-0" />;
      case "developer":
        return <HardHat className="h-4 w-4 text-amber-500 shrink-0" />;
    }
  };

  const getLabel = (type: SuggestionType) => {
    switch (type) {
      case "project":
        return "Project";
      case "presale":
        return "Presale Project";
      case "neighborhood":
        return "Neighborhood";
      case "city":
        return "City";
      case "developer":
        return "Developer";
    }
  };

  return (
    <div
      ref={listRef}
      className="absolute top-full left-0 right-0 mt-2 bg-background border border-border rounded-lg shadow-xl z-50 overflow-hidden"
    >
      {isShowingPopular && (
        <div className="flex items-center gap-2 px-4 py-2 text-xs text-muted-foreground border-b border-border bg-muted/30">
          <TrendingUp className="h-3 w-3" />
          Popular Searches
        </div>
      )}
      {suggestions.map((suggestion, index) => (
        <button
          key={`${suggestion.type}-${suggestion.value}`}
          className={cn(
            "w-full flex items-center gap-3 px-4 py-3 text-left transition-colors",
            index === activeIndex
              ? "bg-muted"
              : "hover:bg-muted/50"
          )}
          onClick={() => onSelect(suggestion.value, suggestion.type)}
          onMouseEnter={() => setActiveIndex(index)}
        >
          {getIcon(suggestion.type)}
          <div className="flex-1 min-w-0">
            <p className="font-medium text-foreground truncate">{suggestion.value}</p>
            <p className="text-xs text-muted-foreground">
              {getLabel(suggestion.type)}
              {suggestion.count > 1 && ` · ${suggestion.count} ${suggestion.type === "presale" ? "project" : "listing"}${suggestion.count !== 1 ? "s" : ""}`}
            </p>
          </div>
        </button>
      ))}
    </div>
  );
}