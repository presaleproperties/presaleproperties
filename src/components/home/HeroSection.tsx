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
export function HeroSection({
  activeTab: controlledTab,
  onTabChange
}: HeroSectionProps) {
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
      navigate(`/properties/${slug}`);
      return;
    }

    // Navigate directly to presale project page
    if ((type === "presale" || type === "project") && slug) {
      navigate(`/presale-projects/${slug}`);
      return;
    }

    // For cities and neighborhoods, go to search results
    setSearchQuery(value);
    const basePath = activeTab === "projects" ? "/presale-projects" : "/properties";
    navigate(`${basePath}?q=${encodeURIComponent(value)}`);
  };
  const handleCityClick = (city: string) => {
    const citySlug = city.toLowerCase().replace(/\s+/g, '-');
    if (activeTab === "projects") {
      navigate(`/${citySlug}-presale-condos`);
    } else {
      navigate(`/properties/${citySlug}`);
    }
  };
  return (
    <section className="relative min-h-[600px] sm:min-h-[640px] md:min-h-[720px] lg:min-h-[800px] flex items-center justify-center overflow-hidden">
      {/* Background Image - High Quality */}
      <img 
        src={heroImage} 
        alt="Luxury presale homes" 
        className="absolute inset-0 w-full h-full object-cover scale-105" 
        loading="eager" 
        decoding="sync" 
        fetchPriority="high" 
      />
      
      {/* Premium Multi-Layer Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/50 to-black/80" />
      <div className="absolute inset-0 bg-gradient-to-r from-black/30 via-transparent to-black/30" />
      
      {/* Subtle warm ambient glow */}
      <div className="absolute inset-0 bg-gradient-to-tr from-primary/8 via-transparent to-primary/5" />
      
      {/* Content */}
      <div className="container relative z-10 py-8 sm:py-16 md:py-24 px-4">
        <div className="max-w-4xl mx-auto text-center space-y-6 sm:space-y-8 md:space-y-10">
          {/* Tagline - More refined */}
          <p className="text-primary text-xs sm:text-sm md:text-base animate-fade-in font-semibold tracking-[0.25em] uppercase">
            Vancouver's New Construction Marketplace
          </p>
          
          {/* Main Heading - Premium typography */}
          <h1 
            className="text-[36px] sm:text-5xl md:text-6xl lg:text-7xl font-extrabold tracking-tight text-white animate-fade-in leading-[1.1] drop-shadow-2xl" 
            style={{ animationDelay: "0.1s" }}
          >
            Find Your{" "}
            <span className="text-primary drop-shadow-[0_0_40px_hsl(43_96%_56%/0.6)] relative">
              New
              <span className="absolute -inset-1 bg-primary/10 blur-2xl -z-10" />
            </span>{" "}
            Home
          </h1>
          
          {/* Subheadline - Cleaner */}
          <p 
            className="text-white/85 text-lg sm:text-xl md:text-2xl font-light animate-fade-in max-w-2xl mx-auto leading-relaxed tracking-wide" 
            style={{ animationDelay: "0.15s" }}
          >
            Search Presale & Move-In Ready Homes
          </p>

          {/* Premium Search Card */}
          <div 
            className="bg-white rounded-2xl sm:rounded-3xl shadow-[0_25px_80px_-15px_rgba(0,0,0,0.4)] max-w-2xl mx-auto animate-fade-in overflow-hidden border border-border/10" 
            style={{ animationDelay: "0.2s" }}
          >
            {/* Search Header with Tabs */}
            <div className="flex items-center justify-between border-b border-border/20 px-4 sm:px-5 py-2 sm:py-2.5 bg-muted/30">
              <div className="flex items-center gap-1.5 sm:gap-2">
                <button 
                  onClick={() => handleTabChange("projects")} 
                  className={`px-4 sm:px-5 py-2 sm:py-2.5 rounded-full text-xs sm:text-sm font-semibold transition-all duration-300 ${
                    activeTab === "projects" 
                      ? "bg-foreground text-background shadow-lg" 
                      : "bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground"
                  }`}
                >
                  Presale
                </button>
                <button 
                  onClick={() => handleTabChange("resale")} 
                  className={`px-4 sm:px-5 py-2 sm:py-2.5 rounded-full text-xs sm:text-sm font-semibold transition-all duration-300 ${
                    activeTab === "resale" 
                      ? "bg-foreground text-background shadow-lg" 
                      : "bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground"
                  }`}
                >
                  Move-In Ready
                </button>
              </div>
              <Link 
                to={activeTab === "projects" ? "/map-search?mode=presale" : "/map-search?mode=resale"} 
                className="flex items-center gap-2 text-sm text-foreground/80 hover:text-primary transition-colors font-medium group"
              >
                <MapPin className="h-4 w-4 group-hover:scale-110 transition-transform" />
                <span className="hidden sm:inline">Open Map</span>
              </Link>
            </div>

            {/* Search Input */}
            <form onSubmit={handleSearch}>
              <div className="relative px-4 sm:px-5 py-3 sm:py-3.5" ref={searchContainerRef}>
                <Input 
                  type="text" 
                  placeholder={activeTab === "projects" ? "Search projects, developers, neighbourhoods..." : "City, neighbourhood, address..."} 
                  value={searchQuery} 
                  onChange={e => {
                    setSearchQuery(e.target.value);
                    setShowSuggestions(true);
                  }} 
                  onFocus={() => setShowSuggestions(true)} 
                  className="h-11 sm:h-12 md:h-14 text-base sm:text-lg pl-5 pr-14 border-2 border-border bg-muted/20 text-foreground placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-primary/30 focus-visible:border-primary rounded-xl transition-all duration-300" 
                  autoComplete="off" 
                />
                <button 
                  type="submit" 
                  className="absolute right-6 sm:right-8 top-1/2 -translate-y-1/2 h-10 w-10 flex items-center justify-center text-muted-foreground hover:text-primary hover:bg-primary/10 active:scale-95 transition-all rounded-full"
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

          {/* Explore Map CTA - More prominent */}
          <div 
            className="animate-fade-in pt-2" 
            style={{ animationDelay: "0.25s" }}
          >
            <Link 
              to={activeTab === "projects" ? "/map-search?mode=presale" : "/map-search?mode=resale"}
              className="inline-flex items-center gap-2.5 px-6 py-3 rounded-full bg-white/15 backdrop-blur-md border border-white/30 text-white font-medium text-sm sm:text-base hover:bg-white/25 hover:border-white/50 hover:scale-105 active:scale-100 transition-all duration-300 shadow-lg"
            >
              <MapPin className="h-4 w-4 sm:h-5 sm:w-5" />
              Explore Interactive Map
            </Link>
          </div>

          {/* Top Cities - Premium pills */}
          <div className="animate-fade-in pt-4" style={{ animationDelay: "0.3s" }}>
            <span className="text-xs sm:text-sm text-white/50 font-medium tracking-[0.2em] uppercase block mb-4">
              Popular Cities
            </span>
            <div className="flex flex-wrap items-center justify-center gap-2.5 sm:gap-3 px-2">
              {(activeTab === "projects" ? projectCities : resaleCities).map(city => (
                <Button 
                  key={city} 
                  variant="outline" 
                  size="sm" 
                  onClick={() => handleCityClick(city)} 
                  className="rounded-full bg-white/10 backdrop-blur-md text-white border-white/20 hover:bg-white hover:text-foreground hover:border-white hover:shadow-xl hover:scale-105 active:scale-100 transition-all duration-300 text-xs sm:text-sm px-4 sm:px-5 h-9 sm:h-10 font-medium whitespace-nowrap"
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