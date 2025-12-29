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

          {/* Glassmorphism Container */}
          <div className="bg-white/10 backdrop-blur-2xl rounded-2xl shadow-2xl border border-white/20 overflow-hidden">
            {/* Tabs */}
            <div className="flex items-center gap-1 px-3 pt-3">
              <button
                type="button"
                onClick={() => setActiveTab("projects")}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                  activeTab === "projects"
                    ? "bg-white/20 text-white"
                    : "text-white/60 hover:text-white"
                }`}
              >
                Projects
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("assignments")}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                  activeTab === "assignments"
                    ? "bg-white/20 text-white"
                    : "text-white/60 hover:text-white"
                }`}
              >
                Assignments
              </button>
            </div>

            {/* Search Input - Thinner iPhone-like style */}
            <form onSubmit={handleSearch}>
              <div className="relative p-3" ref={searchContainerRef}>
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
                    setShowSuggestions(e.target.value.length >= 2);
                  }}
                  className="h-9 text-sm pl-3 pr-9 border-0 bg-white/15 backdrop-blur-xl text-white placeholder:text-white/50 focus-visible:ring-1 focus-visible:ring-white/30 rounded-full"
                  autoComplete="off"
                />
                <button 
                  type="submit"
                  className="absolute right-5 top-1/2 -translate-y-1/2 h-6 w-6 flex items-center justify-center text-white/60 hover:text-white transition-colors"
                >
                  <Search className="h-4 w-4" />
                </button>
              </div>
            </form>
            
            {/* Suggestions dropdown - Only when typing */}
            {showSuggestions && hasSuggestions && (
              <div className="border-t border-white/10">
                <SearchSuggestions
                  query={searchQuery}
                  onSelect={handleSuggestionSelect}
                  isVisible={showSuggestions}
                  onClose={() => setShowSuggestions(false)}
                  searchMode={activeTab}
                  glassStyle
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
