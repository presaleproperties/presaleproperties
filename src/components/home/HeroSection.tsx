import { useState, useRef, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Search, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SearchSuggestions } from "./SearchSuggestions";
import heroImage from "@/assets/hero-lifestyle.jpg";

const projectCities = ["Vancouver", "Surrey", "Langley", "Coquitlam", "Abbotsford"];
const resaleCities = ["Vancouver", "Surrey", "Langley", "Coquitlam", "Abbotsford"];

export type SearchTab = "projects" | "resale";

interface HeroSectionProps {
  activeTab?: SearchTab;
  onTabChange?: (tab: SearchTab) => void;
}

export function HeroSection({ activeTab: controlledTab, onTabChange }: HeroSectionProps) {
  const [internalTab, setInternalTab] = useState<SearchTab>("projects");
  const activeTab = controlledTab ?? internalTab;
  
  const [searchQuery, setSearchQuery] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const searchContainerRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  const handleTabChange = (tab: SearchTab) => {
    if (onTabChange) {
      onTabChange(tab);
    } else {
      setInternalTab(tab);
    }
  };

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setShowSuggestions(false);
    const basePath = activeTab === "projects" ? "/presale-projects" : "/resale";
    if (searchQuery.trim()) {
      navigate(`${basePath}?q=${encodeURIComponent(searchQuery)}`);
    } else {
      navigate(basePath);
    }
  };

  const handleSuggestionSelect = (value: string, type: string, slug?: string) => {
    setShowSuggestions(false);
    
    // Navigate directly to listing page for MLS listing type
    if (type === "listing" && slug) {
      navigate(`/resale/${slug}`);
      return;
    }
    
    // Navigate directly to presale project page
    if ((type === "presale" || type === "project") && slug) {
      navigate(`/presale/${slug}`);
      return;
    }
    
    // For cities and neighborhoods, go to search results
    setSearchQuery(value);
    const basePath = activeTab === "projects" ? "/presale-projects" : "/resale";
    navigate(`${basePath}?q=${encodeURIComponent(value)}`);
  };

  const handleCityClick = (city: string) => {
    const basePath = activeTab === "projects" ? "/presale-projects" : "/resale";
    navigate(`${basePath}?city=${encodeURIComponent(city)}`);
  };

  return (
    <section className="relative min-h-[560px] sm:min-h-[580px] md:min-h-[680px] flex items-center justify-center overflow-hidden">
      {/* Background Image - High Quality */}
      <img 
        src={heroImage}
        alt="Luxury presale homes"
        className="absolute inset-0 w-full h-full object-cover"
        loading="eager"
        decoding="sync"
        fetchPriority="high"
      />
      
      {/* Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/50 to-black/70 sm:from-black/50 sm:via-black/40 sm:to-black/60" />
      
      {/* Content */}
      <div className="container relative z-10 py-5 sm:py-14 md:py-20 px-4">
        <div className="max-w-3xl mx-auto text-center space-y-4 sm:space-y-6 md:space-y-8">
          {/* Tagline */}
          <p className="text-primary text-xs sm:text-sm md:text-base animate-fade-in font-medium tracking-wide">
            New Construction Specialists
          </p>
          
          {/* Main Heading - SEO optimized H1 */}
          <h1 className="text-[26px] sm:text-3xl md:text-5xl lg:text-6xl font-bold tracking-tight text-white animate-fade-in leading-[1.15] sm:leading-tight" style={{ animationDelay: "0.1s" }}>
            Presale Projects & <span className="text-primary">Move-In Ready</span> Homes
          </h1>
          
          {/* Subheadline */}
          <p className="text-white/80 text-sm sm:text-base animate-fade-in max-w-lg mx-auto" style={{ animationDelay: "0.15s" }}>
            Every property is brand new, never lived in. 100% new construction only.
          </p>


          {/* Floating Search Card - Compact on mobile */}
          <div 
            className="bg-white rounded-xl sm:rounded-2xl shadow-2xl max-w-2xl mx-auto animate-fade-in overflow-hidden"
            style={{ animationDelay: "0.2s" }}
          >
            {/* Search Header with Tabs */}
            <div className="flex items-center justify-between border-b border-border px-2.5 sm:px-4 py-2 sm:py-3">
              <div className="flex items-center gap-1 sm:gap-2">
                <button
                  onClick={() => handleTabChange("projects")}
                  className={`px-3 sm:px-4 py-2 rounded-full text-[12px] sm:text-sm font-semibold transition-all ${
                    activeTab === "projects" 
                      ? "bg-foreground text-background shadow-sm" 
                      : "bg-muted text-muted-foreground hover:bg-muted/80"
                  }`}
                >
                  Presale
                </button>
                <button
                  onClick={() => handleTabChange("resale")}
                  className={`px-3 sm:px-4 py-2 rounded-full text-[12px] sm:text-sm font-semibold transition-all ${
                    activeTab === "resale" 
                      ? "bg-foreground text-background shadow-sm" 
                      : "bg-muted text-muted-foreground hover:bg-muted/80"
                  }`}
                >
                  Move-In Ready
                </button>
              </div>
              <Link
                to={activeTab === "projects" ? "/map-search?mode=presale" : "/map-search?mode=resale"}
                className="hidden sm:flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                <MapPin className="h-4 w-4" />
                Open Map
              </Link>
            </div>

            {/* Search Input */}
            <form onSubmit={handleSearch}>
              <div className="relative px-2.5 sm:px-4 py-2.5 sm:py-3" ref={searchContainerRef}>
                <Input
                  type="text"
                  placeholder={activeTab === "projects" 
                    ? "City, Neighbourhood, Developer..." 
                    : "City, Neighbourhood, Address..."
                  }
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setShowSuggestions(true);
                  }}
                  onFocus={() => setShowSuggestions(true)}
                  className="h-11 sm:h-12 md:h-14 text-[15px] sm:text-base pl-3.5 pr-11 border-border bg-background text-foreground placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-primary/50 rounded-lg sm:rounded-xl"
                  autoComplete="off"
                />
                <button 
                  type="submit"
                  className="absolute right-4 sm:right-6 top-1/2 -translate-y-1/2 h-9 w-9 flex items-center justify-center text-muted-foreground hover:text-foreground active:scale-95 transition-all rounded-full"
                >
                  <Search className="h-5 w-5" />
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
          </div>

          {/* Top Cities */}
          <div className="animate-fade-in" style={{ animationDelay: "0.3s" }}>
            <span className="text-[10px] sm:text-sm text-white/70 font-medium tracking-wide block mb-2">
              Top Cities
            </span>
            <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-2.5 md:gap-3 px-2">
              {(activeTab === "projects" ? projectCities : resaleCities).map((city) => (
                <Button
                  key={city}
                  variant="outline"
                  size="sm"
                  onClick={() => handleCityClick(city)}
                  className="rounded-full bg-white/10 backdrop-blur-sm text-white border-white/30 hover:bg-white hover:text-foreground hover:border-white active:scale-95 transition-all duration-200 text-[11px] sm:text-xs md:text-sm px-3 sm:px-3.5 md:px-4 h-8 sm:h-8 font-medium whitespace-nowrap"
                >
                  {city}
                </Button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
