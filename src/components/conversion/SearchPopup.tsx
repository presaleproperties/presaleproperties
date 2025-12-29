import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { SearchSuggestions, SuggestionType } from "@/components/home/SearchSuggestions";
import { cn } from "@/lib/utils";

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

    if (type === "presale" && slug) {
      navigate(`/presale-projects/${encodeURIComponent(slug)}`);
      onOpenChange(false);
      return;
    }

    const basePath = activeTab === "projects" ? "/presale-projects" : "/assignments";
    navigate(`${basePath}?q=${encodeURIComponent(value)}`);
    onOpenChange(false);
  };

  if (!open) return null;

  const hasSuggestions = searchQuery.length >= 2;

  return (
    <>
      {/* Backdrop with blur */}
      <div 
        className="fixed inset-0 z-50 bg-black/60 backdrop-blur-md animate-fade-in"
        onClick={() => onOpenChange(false)}
      />
      
      {/* Floating Glass Search Container - Top 1/3 on mobile */}
      <div className="fixed inset-x-0 top-[15%] md:top-[20%] z-50 px-4 animate-fade-in">
        <div className="mx-auto w-full max-w-md">
          {/* Glass Container - Matching Bottom Nav Style */}
          <div className={cn(
            "bg-black/40 backdrop-blur-2xl rounded-2xl",
            "border border-white/20 shadow-2xl",
            "overflow-hidden"
          )}>
            {/* Header with Close */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
              <span className="text-white font-semibold text-sm drop-shadow-sm">Search</span>
              <button
                onClick={() => onOpenChange(false)}
                className="h-8 w-8 flex items-center justify-center rounded-full bg-white/15 text-white hover:bg-white/25 transition-colors border border-white/20"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Tabs - Glass Pills */}
            <div className="flex items-center gap-2 px-4 py-3">
              <button
                type="button"
                onClick={() => setActiveTab("projects")}
                className={cn(
                  "px-4 py-2 rounded-full text-sm font-semibold transition-all border",
                  activeTab === "projects"
                    ? "bg-white text-foreground shadow-lg border-transparent"
                    : "bg-white/10 text-white hover:bg-white/20 border-white/20"
                )}
              >
                Projects
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("assignments")}
                className={cn(
                  "px-4 py-2 rounded-full text-sm font-semibold transition-all border",
                  activeTab === "assignments"
                    ? "bg-white text-foreground shadow-lg border-transparent"
                    : "bg-white/10 text-white hover:bg-white/20 border-white/20"
                )}
              >
                Assignments
              </button>
            </div>

            {/* Search Input - Solid white for contrast */}
            <form onSubmit={handleSearch}>
              <div className="relative px-4 pb-4" ref={searchContainerRef}>
                <div className="relative">
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
                    className={cn(
                      "h-12 text-base pl-4 pr-12 rounded-xl",
                      "bg-white border-white/80",
                      "text-foreground placeholder:text-muted-foreground",
                      "focus-visible:ring-2 focus-visible:ring-white/50 focus-visible:border-white",
                      "shadow-lg"
                    )}
                    autoComplete="off"
                  />
                  <button 
                    type="submit"
                    className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 flex items-center justify-center bg-foreground text-background rounded-lg hover:bg-foreground/90 transition-colors"
                  >
                    <Search className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </form>
            
            {/* Suggestions dropdown */}
            {showSuggestions && hasSuggestions && (
              <div className="px-4 pb-4">
                <div className="bg-white rounded-xl shadow-lg overflow-hidden max-h-[35vh] overflow-y-auto">
                  <SearchSuggestions
                    query={searchQuery}
                    onSelect={handleSuggestionSelect}
                    isVisible={showSuggestions}
                    onClose={() => setShowSuggestions(false)}
                    searchMode={activeTab}
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
