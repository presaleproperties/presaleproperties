import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { SearchSuggestions, SuggestionType } from "@/components/home/SearchSuggestions";

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

  const handleSuggestionSelect = (value: string, type: SuggestionType, slug?: string) => {
    setSearchQuery(value);
    setShowSuggestions(false);

    // If this is a specific presale project, go to its detail page
    if (type === "presale" && slug) {
      navigate(`/presale-projects/${encodeURIComponent(slug)}`);
      onOpenChange(false);
      return;
    }

    // Otherwise, fall back to a search results page for the active tab
    const basePath = activeTab === "projects" ? "/presale-projects" : "/assignments";
    navigate(`${basePath}?q=${encodeURIComponent(value)}`);
    onOpenChange(false);
  };

  if (!open) return null;

  const hasSuggestions = searchQuery.length >= 2;

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 z-50 bg-black/60 backdrop-blur-md animate-fade-in"
        onClick={() => onOpenChange(false)}
      />
      
      {/* Floating Search */}
      <div className="fixed inset-x-0 top-0 z-50 px-4 pt-24 sm:pt-28 md:pt-32 animate-fade-in">
        <div className="mx-auto w-full max-w-[320px] sm:max-w-[360px] md:max-w-[400px]">
          {/* Close button */}
          <button
            onClick={() => onOpenChange(false)}
            className="absolute top-8 sm:top-10 right-4 sm:right-6 h-8 w-8 flex items-center justify-center rounded-full bg-white/10 backdrop-blur-xl text-white hover:bg-white/20 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>

          {/* Solid White Container - Matching Hero Style */}
          <div className="bg-white rounded-xl sm:rounded-2xl shadow-2xl overflow-hidden">
            {/* Tabs */}
            <div className="flex items-center border-b border-border px-3 py-2.5 sm:py-3">
              <div className="flex items-center gap-1 sm:gap-2">
                <button
                  type="button"
                  onClick={() => setActiveTab("projects")}
                  className={`px-3 sm:px-4 py-2 rounded-full text-xs sm:text-sm font-semibold transition-all ${
                    activeTab === "projects"
                      ? "bg-foreground text-background shadow-sm"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted"
                  }`}
                >
                  Projects
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("assignments")}
                  className={`px-3 sm:px-4 py-2 rounded-full text-xs sm:text-sm font-semibold transition-all ${
                    activeTab === "assignments"
                      ? "bg-foreground text-background shadow-sm"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted"
                  }`}
                >
                  Assignments
                </button>
              </div>
            </div>

            {/* Search Input - Matching Hero Style */}
            <form onSubmit={handleSearch}>
              <div className="relative px-3 py-2.5 sm:py-3" ref={searchContainerRef}>
                <Input
                  ref={inputRef}
                  type="text"
                  placeholder={activeTab === "projects" 
                    ? "City, Developer, Project..." 
                    : "Project, City..."
                  }
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setShowSuggestions(e.target.value.length >= 2);
                  }}
                  className="h-10 sm:h-11 text-sm sm:text-base pl-3.5 pr-10 border-border bg-background text-foreground placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-primary/50 rounded-lg sm:rounded-xl"
                  autoComplete="off"
                />
                <button 
                  type="submit"
                  className="absolute right-5 top-1/2 -translate-y-1/2 h-8 w-8 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors rounded-full"
                >
                  <Search className="h-4 w-4 sm:h-5 sm:w-5" />
                </button>
              </div>
            </form>
            
            {/* Suggestions dropdown - Only when typing */}
            {showSuggestions && hasSuggestions && (
              <div className="border-t border-border">
                <SearchSuggestions
                  query={searchQuery}
                  onSelect={handleSuggestionSelect}
                  isVisible={showSuggestions}
                  onClose={() => setShowSuggestions(false)}
                  searchMode={activeTab}
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
