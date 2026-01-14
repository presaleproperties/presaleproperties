import { useState, useRef, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { SearchSuggestions, SuggestionType } from "@/components/home/SearchSuggestions";
import { cn } from "@/lib/utils";

// Pages where sticky search should appear (browse/listing pages)
const SEARCH_ENABLED_PATHS = [
  "/presale-projects",
  "/resale",
  "-presale-condos",
  "-presale-townhomes",
  "/resale/vancouver",
  "/resale/surrey",
  "/resale/burnaby",
  "/resale/coquitlam",
  "/resale/langley",
  "/resale/delta",
  "/resale/abbotsford",
  "/resale/chilliwack",
  "/resale/richmond",
];

// Pages where sticky search should NOT appear (detail pages)
const SEARCH_DISABLED_PATTERNS = [
  /^\/presale-projects\/[^/]+$/, // Project detail pages
  /^\/resale\/[A-Z]\d+$/, // MLS listing detail pages (e.g., /resale/R1234567)
];

export function StickySearchHeader() {
  const [searchQuery, setSearchQuery] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();
  const location = useLocation();

  // Determine search mode based on current path
  const searchMode = location.pathname.includes("/resale") ? "resale" : "projects";

  // Check if current page should show sticky search
  const shouldShowSearch = () => {
    const path = location.pathname;
    
    // Check if it's a disabled pattern (detail page)
    for (const pattern of SEARCH_DISABLED_PATTERNS) {
      if (pattern.test(path)) return false;
    }
    
    // Check if it matches enabled paths
    for (const enabledPath of SEARCH_ENABLED_PATHS) {
      if (path === enabledPath || path.includes(enabledPath)) return true;
    }
    
    return false;
  };

  const isSearchPage = shouldShowSearch();

  // Show sticky search after scrolling past hero
  useEffect(() => {
    if (!isSearchPage) {
      setIsVisible(false);
      return;
    }

    const handleScroll = () => {
      const scrollY = window.scrollY;
      // Show after scrolling 200px
      setIsVisible(scrollY > 200);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll(); // Check initial state
    
    return () => window.removeEventListener("scroll", handleScroll);
  }, [isSearchPage, location.pathname]);

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelect = (value: string, type: SuggestionType, slug?: string) => {
    setShowSuggestions(false);
    setSearchQuery("");

    if (type === "presale" && slug) {
      navigate(`/presale-projects/${slug}`);
    } else if (type === "listing" && slug) {
      navigate(`/resale/${slug}`);
    } else if (type === "city") {
      if (searchMode === "resale") {
        navigate(`/resale/${value.toLowerCase().replace(/\s+/g, "-")}`);
      } else {
        navigate(`/${value.toLowerCase().replace(/\s+/g, "-")}-presale-condos`);
      }
    } else if (type === "neighborhood") {
      navigate(`/presale-projects?neighborhood=${encodeURIComponent(value)}`);
    } else {
      if (searchMode === "resale") {
        navigate(`/resale?search=${encodeURIComponent(value)}`);
      } else {
        navigate(`/presale-projects?search=${encodeURIComponent(value)}`);
      }
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      setShowSuggestions(false);
      if (searchMode === "resale") {
        navigate(`/resale?search=${encodeURIComponent(searchQuery.trim())}`);
      } else {
        navigate(`/presale-projects?search=${encodeURIComponent(searchQuery.trim())}`);
      }
    }
  };

  if (!isSearchPage) return null;

  return (
    <div
      className={cn(
        "fixed top-0 left-0 right-0 z-40 transition-all duration-300 ease-out",
        isVisible 
          ? "translate-y-0 opacity-100" 
          : "-translate-y-full opacity-0 pointer-events-none"
      )}
    >
      <div className="bg-background/98 backdrop-blur-lg border-b border-border shadow-sm">
        <div className="container px-4 py-2">
          <div ref={searchRef} className="relative max-w-2xl mx-auto">
            <form onSubmit={handleSearch}>
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  ref={inputRef}
                  type="text"
                  placeholder={searchMode === "resale" 
                    ? "City, Neighbourhood, Address, MLS#" 
                    : "City, Neighbourhood, Project Name"
                  }
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setShowSuggestions(true);
                  }}
                  onFocus={() => setShowSuggestions(true)}
                  className="h-11 pl-11 pr-10 text-base rounded-xl border-border bg-card"
                />
                {searchQuery && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8"
                    onClick={() => {
                      setSearchQuery("");
                      inputRef.current?.focus();
                    }}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </form>

            {showSuggestions && (
              <div className="absolute top-full left-0 right-0 mt-1 z-50">
                <SearchSuggestions
                  query={searchQuery}
                  onSelect={handleSelect}
                  isVisible={showSuggestions}
                  onClose={() => setShowSuggestions(false)}
                  searchMode={searchMode}
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
