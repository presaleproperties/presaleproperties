import { useState, useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { Building2, MapPin } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

interface SearchSuggestionsProps {
  query: string;
  onSelect: (value: string, type: "project" | "neighborhood") => void;
  isVisible: boolean;
  onClose: () => void;
}

interface Suggestion {
  value: string;
  type: "project" | "neighborhood";
  count: number;
}

export function SearchSuggestions({ query, onSelect, isVisible, onClose }: SearchSuggestionsProps) {
  const [activeIndex, setActiveIndex] = useState(-1);
  const listRef = useRef<HTMLDivElement>(null);

  const { data: suggestions = [] } = useQuery({
    queryKey: ["search-suggestions", query],
    queryFn: async () => {
      if (!query || query.length < 2) return [];

      const { data: listings, error } = await supabase
        .from("listings")
        .select("project_name, neighborhood, city")
        .eq("status", "published");

      if (error) throw error;

      // Extract unique projects and neighborhoods with counts
      const projectCounts = new Map<string, number>();
      const neighborhoodCounts = new Map<string, number>();

      listings?.forEach((listing) => {
        if (listing.project_name.toLowerCase().includes(query.toLowerCase())) {
          projectCounts.set(
            listing.project_name,
            (projectCounts.get(listing.project_name) || 0) + 1
          );
        }
        if (listing.neighborhood?.toLowerCase().includes(query.toLowerCase())) {
          neighborhoodCounts.set(
            listing.neighborhood,
            (neighborhoodCounts.get(listing.neighborhood) || 0) + 1
          );
        }
      });

      const results: Suggestion[] = [];

      // Add projects
      projectCounts.forEach((count, value) => {
        results.push({ value, type: "project", count });
      });

      // Add neighborhoods
      neighborhoodCounts.forEach((count, value) => {
        results.push({ value, type: "neighborhood", count });
      });

      // Sort by count and limit to 6
      return results.sort((a, b) => b.count - a.count).slice(0, 6);
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
          {suggestion.type === "project" ? (
            <Building2 className="h-4 w-4 text-primary shrink-0" />
          ) : (
            <MapPin className="h-4 w-4 text-muted-foreground shrink-0" />
          )}
          <div className="flex-1 min-w-0">
            <p className="font-medium text-foreground truncate">{suggestion.value}</p>
            <p className="text-xs text-muted-foreground">
              {suggestion.type === "project" ? "Project" : "Neighborhood"} · {suggestion.count} listing{suggestion.count !== 1 ? "s" : ""}
            </p>
          </div>
        </button>
      ))}
    </div>
  );
}
