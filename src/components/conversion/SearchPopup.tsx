import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Search, X, MapPin } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { SearchSuggestions } from "@/components/home/SearchSuggestions";

const topCities = ["Surrey", "Langley", "Coquitlam", "Abbotsford"];

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

  // Focus input when dialog opens
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
      {/* Backdrop with blur */}
      <div 
        className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm animate-fade-in"
        onClick={() => onOpenChange(false)}
      />
      
      {/* Floating Search Card */}
      <div className="fixed inset-x-0 top-0 z-50 p-4 pt-20 sm:pt-24 animate-fade-in">
        <div className="mx-auto max-w-lg">
          <div className="bg-background/95 backdrop-blur-md rounded-2xl shadow-2xl border border-border/50 overflow-hidden">
            {/* Close button */}
            <button
              onClick={() => onOpenChange(false)}
              className="absolute top-6 right-6 sm:top-8 sm:right-8 h-10 w-10 flex items-center justify-center rounded-full bg-white/10 backdrop-blur-sm text-white hover:bg-white/20 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>

            {/* Tabs */}
            <div className="flex items-center gap-1.5 p-3 border-b border-border/50">
              <button
                type="button"
                onClick={() => setActiveTab("projects")}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                  activeTab === "projects"
                    ? "bg-foreground text-background shadow-sm"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                }`}
              >
                Presale Projects
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("assignments")}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                  activeTab === "assignments"
                    ? "bg-foreground text-background shadow-sm"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                }`}
              >
                Assignments
              </button>
            </div>

            {/* Search Input */}
            <form onSubmit={handleSearch}>
              <div className="relative p-3" ref={searchContainerRef}>
                <Input
                  ref={inputRef}
                  type="text"
                  placeholder={activeTab === "projects" 
                    ? "City, Neighbourhood, Developer..." 
                    : "Project, Neighbourhood, City..."
                  }
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setShowSuggestions(true);
                  }}
                  onFocus={() => setShowSuggestions(true)}
                  className="h-12 text-base pl-4 pr-12 border-border/50 bg-muted/30 text-foreground placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-primary/50 rounded-xl"
                  autoComplete="off"
                />
                <button 
                  type="submit"
                  className="absolute right-5 top-1/2 -translate-y-1/2 h-9 w-9 flex items-center justify-center bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
                >
                  <Search className="h-4 w-4" />
                </button>
                <SearchSuggestions
                  query={searchQuery}
                  onSelect={handleSuggestionSelect}
                  isVisible={showSuggestions}
                  onClose={() => setShowSuggestions(false)}
                  searchMode={activeTab}
                />
              </div>
            </form>

            {/* Quick Cities */}
            <div className="px-3 pb-4">
              <p className="text-xs text-muted-foreground mb-2">Popular Cities</p>
              <div className="flex flex-wrap gap-2">
                {topCities.map((city) => (
                  <Button
                    key={city}
                    variant="outline"
                    size="sm"
                    onClick={() => handleCityClick(city)}
                    className="h-8 text-xs rounded-full px-3 bg-muted/30 border-border/50 hover:bg-muted"
                  >
                    <MapPin className="h-3 w-3 mr-1.5" />
                    {city}
                  </Button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
