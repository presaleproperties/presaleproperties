import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { SearchSuggestions } from "@/components/home/SearchSuggestions";

const TOP_CITIES = ["Vancouver", "Surrey", "Langley", "Coquitlam", "Burnaby"];

type SearchTab = "projects" | "assignments";

interface SearchPopupProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SearchPopup({ open, onOpenChange }: SearchPopupProps) {
  const [activeTab, setActiveTab] = useState<SearchTab>("projects");
  const [searchQuery, setSearchQuery] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const searchContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 100);
    } else {
      setSearchQuery("");
      setShowSuggestions(false);
    }
  }, [open]);

  // Handle escape key to close popup
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && open) {
        onOpenChange(false);
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open, onOpenChange]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setShowSuggestions(false);
    const basePath = activeTab === "projects" ? "/presale-projects" : "/assignments";
    if (searchQuery.trim()) {
      navigate(`${basePath}?q=${encodeURIComponent(searchQuery)}`);
    } else {
      navigate(basePath);
    }
    onOpenChange(false);
  };

  const handleSuggestionSelect = (value: string) => {
    setSearchQuery(value);
    setShowSuggestions(false);
    const basePath = activeTab === "projects" ? "/presale-projects" : "/assignments";
    navigate(`${basePath}?q=${encodeURIComponent(value)}`);
    onOpenChange(false);
  };

  const handleCityClick = (city: string) => {
    const basePath = activeTab === "projects" ? "/presale-projects" : "/assignments";
    navigate(`${basePath}?city=${encodeURIComponent(city)}`);
    onOpenChange(false);
  };

  if (!open) return null;

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm animate-fade-in"
        onClick={() => onOpenChange(false)}
      />
      
      {/* Floating Search */}
      <div className="fixed inset-x-0 top-0 z-50 px-3 sm:px-4 pt-12 sm:pt-16 md:pt-20 animate-fade-in">
        <div className="mx-auto max-w-[calc(100%-1rem)] sm:max-w-sm md:max-w-md">
          {/* Close button */}
          <button
            onClick={() => onOpenChange(false)}
            className="absolute top-4 sm:top-6 right-4 sm:right-6 h-8 w-8 sm:h-9 sm:w-9 flex items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>

          <div className="bg-background rounded-lg sm:rounded-xl shadow-2xl border border-border/30 overflow-hidden">
            {/* Tabs */}
            <div className="flex items-center gap-1 px-2 pt-2">
              <button
                type="button"
                onClick={() => setActiveTab("projects")}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  activeTab === "projects"
                    ? "bg-foreground text-background"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Projects
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("assignments")}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  activeTab === "assignments"
                    ? "bg-foreground text-background"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Assignments
              </button>
            </div>

            {/* Search Input */}
            <form onSubmit={handleSearch}>
              <div className="relative p-2" ref={searchContainerRef}>
                <Input
                  ref={inputRef}
                  type="text"
                  placeholder={activeTab === "projects" 
                    ? "Search city, developer..." 
                    : "Search project, city..."
                  }
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setShowSuggestions(true);
                  }}
                  onFocus={() => setShowSuggestions(true)}
                  className="h-10 text-sm pl-3 pr-10 border-0 bg-muted/40 text-foreground placeholder:text-muted-foreground focus-visible:ring-1 focus-visible:ring-primary/40 rounded-lg"
                  autoComplete="off"
                />
                <button 
                  type="submit"
                  className="absolute right-4 top-1/2 -translate-y-1/2 h-7 w-7 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
                >
                  <Search className="h-4 w-4" />
                </button>
              </div>
            </form>
            
            {/* Suggestions dropdown */}
            {showSuggestions && (
              <div className="border-t border-border/30">
                <SearchSuggestions
                  query={searchQuery}
                  onSelect={handleSuggestionSelect}
                  isVisible={showSuggestions}
                  onClose={() => setShowSuggestions(false)}
                  searchMode={activeTab}
                />
              </div>
            )}

            {/* City shortcuts - hidden on mobile */}
            {!showSuggestions && (
              <div className="hidden sm:flex items-center gap-2 px-3 pb-3 pt-1 flex-wrap">
                {TOP_CITIES.map((city) => (
                  <button
                    key={city}
                    type="button"
                    onClick={() => handleCityClick(city)}
                    className="px-3 py-1 text-xs font-medium rounded-full border border-border/50 text-muted-foreground hover:text-foreground hover:border-foreground/30 hover:bg-muted/50 transition-colors"
                  >
                    {city}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
