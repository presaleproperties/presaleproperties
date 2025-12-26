import { useState, useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { Building2, MapPin, MapPinned, HardHat } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

type SuggestionType = "project" | "neighborhood" | "city" | "developer";

interface SearchSuggestionsProps {
  query: string;
  onSelect: (value: string, type: SuggestionType) => void;
  isVisible: boolean;
  onClose: () => void;
}

interface Suggestion {
  value: string;
  type: SuggestionType;
  count: number;
}

export type { SuggestionType };

export function SearchSuggestions({ query, onSelect, isVisible, onClose }: SearchSuggestionsProps) {
  const [activeIndex, setActiveIndex] = useState(-1);
  const listRef = useRef<HTMLDivElement>(null);

  const { data: suggestions = [] } = useQuery({
    queryKey: ["search-suggestions", query],
    queryFn: async () => {
      if (!query || query.length < 2) return [];

      const { data: listings, error } = await supabase
        .from("listings")
        .select("project_name, neighborhood, city, developer_name")
        .eq("status", "published");

      if (error) throw error;

      const lowerQuery = query.toLowerCase();
      const projectCounts = new Map<string, number>();
      const neighborhoodCounts = new Map<string, number>();
      const cityCounts = new Map<string, number>();
      const developerCounts = new Map<string, number>();

      listings?.forEach((listing) => {
        if (listing.project_name.toLowerCase().includes(lowerQuery)) {
          projectCounts.set(
            listing.project_name,
            (projectCounts.get(listing.project_name) || 0) + 1
          );
        }
        if (listing.neighborhood?.toLowerCase().includes(lowerQuery)) {
          neighborhoodCounts.set(
            listing.neighborhood,
            (neighborhoodCounts.get(listing.neighborhood) || 0) + 1
          );
        }
        if (listing.city.toLowerCase().includes(lowerQuery)) {
          cityCounts.set(
            listing.city,
            (cityCounts.get(listing.city) || 0) + 1
          );
        }
        if (listing.developer_name?.toLowerCase().includes(lowerQuery)) {
          developerCounts.set(
            listing.developer_name,
            (developerCounts.get(listing.developer_name) || 0) + 1
          );
        }
      });

      const results: Suggestion[] = [];

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

      return results.sort((a, b) => b.count - a.count).slice(0, 8);
    },
    enabled: query.length >= 2 && isVisible,
  });

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

  if (!isVisible || suggestions.length === 0 || query.length < 2) {
    return null;
  }

  return (
    <div
      ref={listRef}
      className="absolute top-full left-0 right-0 mt-2 bg-background border border-border rounded-lg shadow-xl z-50 overflow-hidden"
    >
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
          {suggestion.type === "project" && <Building2 className="h-4 w-4 text-primary shrink-0" />}
          {suggestion.type === "neighborhood" && <MapPin className="h-4 w-4 text-muted-foreground shrink-0" />}
          {suggestion.type === "city" && <MapPinned className="h-4 w-4 text-blue-500 shrink-0" />}
          {suggestion.type === "developer" && <HardHat className="h-4 w-4 text-amber-500 shrink-0" />}
          <div className="flex-1 min-w-0">
            <p className="font-medium text-foreground truncate">{suggestion.value}</p>
            <p className="text-xs text-muted-foreground">
              {suggestion.type === "project" && "Project"}
              {suggestion.type === "neighborhood" && "Neighborhood"}
              {suggestion.type === "city" && "City"}
              {suggestion.type === "developer" && "Developer"}
              {" "}· {suggestion.count} listing{suggestion.count !== 1 ? "s" : ""}
            </p>
          </div>
        </button>
      ))}
    </div>
  );
}
