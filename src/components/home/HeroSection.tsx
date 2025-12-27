import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Search, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SearchSuggestions } from "./SearchSuggestions";
import heroImage from "@/assets/hero-lifestyle.jpg";

const projectCities = ["Vancouver", "Burnaby", "Surrey", "Coquitlam", "Richmond"];
const assignmentCities = ["Vancouver", "Burnaby", "Surrey", "Coquitlam", "Richmond"];

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
    <section className="relative min-h-[480px] sm:min-h-[540px] md:min-h-[600px] flex items-center justify-center overflow-hidden">
      {/* Background Image */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url(${heroImage})` }}
      />
      
      {/* Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-black/40 to-black/60" />
      
      {/* Content */}
      <div className="container relative z-10 py-10 sm:py-14 md:py-20 px-4">
        <div className="max-w-3xl mx-auto text-center space-y-6 sm:space-y-8">
          {/* Tagline */}
          <p className="text-white/80 text-sm sm:text-base animate-fade-in">
            Vancouver's Premier Presale Marketplace
          </p>
          
          {/* Main Heading */}
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight text-white animate-fade-in leading-tight" style={{ animationDelay: "0.1s" }}>
            Made for <span className="text-primary">real estate</span> people
          </h1>

          {/* Floating Search Card */}
          <div 
            className="bg-white rounded-xl shadow-2xl max-w-2xl mx-auto animate-fade-in overflow-hidden"
            style={{ animationDelay: "0.2s" }}
          >
            {/* Tabs */}
            <div className="flex items-center justify-between border-b border-border px-4 py-3">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setActiveTab("projects")}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
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
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                    activeTab === "assignments"
                      ? "bg-foreground text-background"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted"
                  }`}
                >
                  Assignments
                </button>
              </div>
              <button
                type="button"
                onClick={() => navigate(activeTab === "projects" ? "/presale-projects" : "/assignments")}
                className="hidden sm:flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                <MapPin className="h-4 w-4" />
                Browse All
              </button>
            </div>

            {/* Search Input */}
            <form onSubmit={handleSearch}>
              <div className="relative px-4 py-3" ref={searchContainerRef}>
                <Input
                  type="text"
                  placeholder={activeTab === "projects" 
                    ? "City, Neighbourhood, Developer Name..." 
                    : "Project, Neighbourhood, City..."
                  }
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setShowSuggestions(true);
                  }}
                  onFocus={() => setShowSuggestions(true)}
                  className="h-12 sm:h-14 text-base pl-4 pr-12 border-border bg-background text-foreground placeholder:text-muted-foreground focus-visible:ring-1 focus-visible:ring-primary rounded-lg"
                  autoComplete="off"
                />
                <button 
                  type="submit"
                  className="absolute right-6 top-1/2 -translate-y-1/2 h-10 w-10 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
                >
                  <Search className="h-5 w-5" />
                </button>
                {activeTab === "projects" && (
                  <SearchSuggestions
                    query={searchQuery}
                    onSelect={handleSuggestionSelect}
                    isVisible={showSuggestions}
                    onClose={() => setShowSuggestions(false)}
                  />
                )}
              </div>
            </form>
          </div>

          {/* Top Cities */}
          <div className="space-y-3 animate-fade-in" style={{ animationDelay: "0.3s" }}>
            <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3">
              <span className="text-sm text-white/70 mr-1">
                Top Cities
              </span>
              {(activeTab === "projects" ? projectCities : assignmentCities).map((city) => (
                <Button
                  key={city}
                  variant="outline"
                  size="sm"
                  onClick={() => handleCityClick(city)}
                  className="rounded-full bg-transparent text-white border-white/30 hover:bg-white hover:text-foreground hover:border-white transition-all duration-200 text-xs sm:text-sm px-3 sm:px-4 h-8"
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
