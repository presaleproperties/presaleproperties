import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Search, X, MapPin } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { SearchSuggestions } from "@/components/home/SearchSuggestions";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md p-0 gap-0 overflow-hidden">
        <DialogHeader className="sr-only">
          <DialogTitle>Search Projects</DialogTitle>
        </DialogHeader>
        
        {/* Tabs */}
        <div className="flex items-center gap-1 p-3 border-b border-border">
          <button
            type="button"
            onClick={() => setActiveTab("projects")}
            className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
              activeTab === "projects"
                ? "bg-foreground text-background"
                : "text-muted-foreground hover:text-foreground hover:bg-muted"
            }`}
          >
            Presale Projects
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("assignments")}
            className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
              activeTab === "assignments"
                ? "bg-foreground text-background"
                : "text-muted-foreground hover:text-foreground hover:bg-muted"
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
              className="h-11 text-base pl-4 pr-10 border-border bg-background text-foreground placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-primary/50"
              autoComplete="off"
            />
            <button 
              type="submit"
              className="absolute right-5 top-1/2 -translate-y-1/2 h-8 w-8 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors rounded-full"
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
        <div className="px-3 pb-3">
          <p className="text-xs text-muted-foreground mb-2">Popular Cities</p>
          <div className="flex flex-wrap gap-1.5">
            {topCities.map((city) => (
              <Button
                key={city}
                variant="outline"
                size="sm"
                onClick={() => handleCityClick(city)}
                className="h-7 text-xs rounded-full px-3"
              >
                <MapPin className="h-3 w-3 mr-1" />
                {city}
              </Button>
            ))}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
