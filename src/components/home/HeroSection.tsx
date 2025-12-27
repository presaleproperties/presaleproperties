import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SearchSuggestions } from "./SearchSuggestions";
import heroImage from "@/assets/hero-lifestyle.jpg";

const topCities = ["Vancouver", "Burnaby", "Surrey", "Coquitlam", "Richmond"];

export function HeroSection() {
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
    if (searchQuery.trim()) {
      navigate(`/presale-projects?q=${encodeURIComponent(searchQuery)}`);
    } else {
      navigate("/presale-projects");
    }
  };

  const handleSuggestionSelect = (value: string, type: string) => {
    setSearchQuery(value);
    setShowSuggestions(false);
    navigate(`/presale-projects?q=${encodeURIComponent(value)}`);
  };

  const handleCityClick = (city: string) => {
    navigate(`/presale-projects?city=${encodeURIComponent(city)}`);
  };

  return (
    <section className="relative min-h-[500px] sm:min-h-[600px] md:min-h-[700px] flex items-center justify-center overflow-hidden">
      {/* Background Image */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url(${heroImage})` }}
      />
      
      {/* Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-black/70" />
      
      {/* Content */}
      <div className="container relative z-10 py-12 sm:py-16 md:py-24 px-4">
        <div className="max-w-3xl mx-auto text-center space-y-5 sm:space-y-8">
          {/* Tagline */}
          <p className="text-primary font-medium tracking-wide animate-fade-in text-sm sm:text-base">
            Metro Vancouver's Premier Presale Resource
          </p>
          
          {/* Main Heading */}
          <h1 className="text-2xl sm:text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight text-white animate-fade-in leading-tight" style={{ animationDelay: "0.1s" }}>
            Discover New <span className="text-primary">Presale Condos</span> & Townhomes
          </h1>
          
          <p 
            className="text-base sm:text-lg md:text-xl text-white/90 max-w-2xl mx-auto animate-fade-in drop-shadow-md px-2" 
            style={{ animationDelay: "0.2s" }}
          >
            Explore the latest presale developments across Metro Vancouver. From condos to townhomes, find your next home before it's built.
          </p>

          {/* Floating Search Card */}
          <div 
            className="bg-white rounded-lg shadow-2xl max-w-2xl mx-auto animate-fade-in overflow-hidden"
            style={{ animationDelay: "0.3s" }}
          >
            <form onSubmit={handleSearch}>
              <div className="relative" ref={searchContainerRef}>
                  <Input
                    type="text"
                    placeholder="Search projects, developers, cities..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setShowSuggestions(true);
                  }}
                  onFocus={() => setShowSuggestions(true)}
                  className="h-12 sm:h-14 md:h-16 text-sm sm:text-base md:text-lg pl-4 sm:pl-5 pr-12 sm:pr-14 border-0 bg-white text-foreground placeholder:text-muted-foreground focus-visible:ring-0 focus-visible:ring-offset-0 rounded-lg"
                  autoComplete="off"
                />
                <button 
                  type="submit"
                  className="absolute right-2 sm:right-3 top-1/2 -translate-y-1/2 h-8 w-8 sm:h-10 sm:w-10 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
                >
                  <Search className="h-5 w-5 sm:h-6 sm:w-6" />
                </button>
                <SearchSuggestions
                  query={searchQuery}
                  onSelect={handleSuggestionSelect}
                  isVisible={showSuggestions}
                  onClose={() => setShowSuggestions(false)}
                />
              </div>
            </form>
          </div>

          {/* Top Cities */}
          <div className="space-y-3 sm:space-y-4 animate-fade-in" style={{ animationDelay: "0.4s" }}>
            <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3">
              <span className="text-xs sm:text-sm font-medium text-white/90 flex items-center gap-2 w-full sm:w-auto justify-center mb-1 sm:mb-0">
                <span className="w-1.5 h-1.5 rounded-full bg-primary"></span>
                Explore by City
              </span>
              {topCities.map((city) => (
                <Button
                  key={city}
                  variant="secondary"
                  size="sm"
                  onClick={() => handleCityClick(city)}
                  className="rounded-full bg-white/10 text-white border-white/20 hover:bg-white hover:text-foreground transition-all duration-200 text-xs sm:text-sm px-3 sm:px-4 h-8 sm:h-9"
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
