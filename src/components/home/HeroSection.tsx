import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Search, MapPin } from "lucide-react";
import { Input } from "@/components/ui/input";
import { SearchSuggestions } from "./SearchSuggestions";
import heroImage from "@/assets/hero-lifestyle.jpg";

const projectCities = ["Vancouver", "Surrey", "Burnaby", "Langley", "Coquitlam", "Richmond", "Abbotsford", "Delta"];
const assignmentCities = ["Vancouver", "Surrey", "Burnaby", "Langley", "Coquitlam", "Richmond", "Abbotsford", "Delta"];

type SearchTab = "projects" | "assignments";

export function HeroSection() {
  const [activeTab, setActiveTab] = useState<SearchTab>("projects");
  const [searchQuery, setSearchQuery] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const searchContainerRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

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
    const basePath = activeTab === "projects" ? "/presale-projects" : "/assignments";
    if (searchQuery.trim()) {
      navigate(`${basePath}?q=${encodeURIComponent(searchQuery)}`);
    } else {
      navigate(basePath);
    }
  };

  const handleSuggestionSelect = (value: string, type: string) => {
    setSearchQuery(value);
    setShowSuggestions(false);
    const basePath = activeTab === "projects" ? "/presale-projects" : "/assignments";
    navigate(`${basePath}?q=${encodeURIComponent(value)}`);
  };

  const handleCityClick = (city: string) => {
    const basePath = activeTab === "projects" ? "/presale-projects" : "/assignments";
    navigate(`${basePath}?city=${encodeURIComponent(city)}`);
  };

  return (
    <section className="relative min-h-[75vh] md:min-h-[80vh] flex flex-col justify-center overflow-hidden">
      {/* Background Image - Full Bleed */}
      <img 
        src={heroImage}
        alt="Luxury presale homes"
        className="absolute inset-0 w-full h-full object-cover"
        loading="eager"
        decoding="sync"
        fetchPriority="high"
      />
      
      {/* Gradient Overlay - Darker for better text contrast */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/50 to-black/70" />
      
      {/* Content - Centered */}
      <div className="container relative z-10 px-4">
        <div className="max-w-3xl mx-auto text-center">
          {/* Tagline */}
          <p className="text-primary text-sm md:text-base font-medium tracking-wide mb-4 md:mb-5">
            Vancouver's #1 Presale Condos & Townhomes Marketplace
          </p>
          
          {/* Main Heading - SEO optimized */}
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight text-white leading-[1.15] mb-4 md:mb-6">
            Find <span className="text-primary">Presale</span> Condos & Townhomes
          </h1>
          
          {/* Subheading */}
          <p className="text-white/80 text-sm sm:text-base md:text-lg mb-8 md:mb-10 max-w-xl mx-auto">
            Get instant access to floor plans, pricing sheets & book a private preview
          </p>

          {/* Floating Search Card - Overlapping style */}
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl mx-auto overflow-hidden">
            {/* Tabs Row */}
            <div className="flex items-center justify-between px-4 py-3 md:px-6 md:py-4">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setActiveTab("projects")}
                  className={`px-4 py-2 rounded-full text-sm font-semibold transition-all ${
                    activeTab === "projects"
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted"
                  }`}
                >
                  Presale
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("assignments")}
                  className={`px-4 py-2 rounded-full text-sm font-semibold transition-all ${
                    activeTab === "assignments"
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted"
                  }`}
                >
                  Assignments
                </button>
              </div>
              
              <button
                type="button"
                onClick={() => navigate("/map-search")}
                className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors font-medium"
              >
                <MapPin className="h-4 w-4" />
                <span className="hidden sm:inline">Search by Map</span>
                <span className="sm:hidden">Map</span>
              </button>
            </div>

            {/* Search Input */}
            <form onSubmit={handleSearch}>
              <div className="relative px-4 pb-4 md:px-6 md:pb-5" ref={searchContainerRef}>
                <div className="relative">
                  <Input
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
                    className="h-14 md:h-16 text-base md:text-lg pl-5 pr-14 border-border bg-muted/30 text-foreground placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-primary/50 rounded-xl"
                    autoComplete="off"
                  />
                  <button 
                    type="submit"
                    className="absolute right-2 top-1/2 -translate-y-1/2 h-10 w-10 md:h-12 md:w-12 flex items-center justify-center text-muted-foreground hover:text-foreground transition-all rounded-full"
                  >
                    <Search className="h-5 w-5 md:h-6 md:w-6" />
                  </button>
                </div>
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
        </div>
      </div>

      {/* Top Cities - Below hero on white bg */}
      <div className="absolute bottom-0 left-0 right-0 bg-background py-4 md:py-5">
        <div className="container px-4">
          <div className="flex items-center gap-4 overflow-x-auto scrollbar-hide">
            <span className="text-sm text-muted-foreground font-medium whitespace-nowrap">
              Top Cities
            </span>
            {(activeTab === "projects" ? projectCities : assignmentCities).map((city) => (
              <button
                key={city}
                onClick={() => handleCityClick(city)}
                className="px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap border border-border bg-card hover:border-primary hover:bg-primary hover:text-primary-foreground transition-all"
              >
                {city}
              </button>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
