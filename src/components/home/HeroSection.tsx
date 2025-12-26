import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Search, MapPin } from "lucide-react";
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
      navigate(`/assignments?q=${encodeURIComponent(searchQuery)}`);
    } else {
      navigate("/assignments");
    }
  };

  const handleSuggestionSelect = (value: string, type: "project" | "neighborhood") => {
    setSearchQuery(value);
    setShowSuggestions(false);
    // Navigate with the appropriate filter
    if (type === "project") {
      navigate(`/assignments?q=${encodeURIComponent(value)}`);
    } else {
      navigate(`/assignments?q=${encodeURIComponent(value)}`);
    }
  };

  const handleCityClick = (city: string) => {
    navigate(`/assignments?city=${encodeURIComponent(city)}`);
  };

  return (
    <section className="relative min-h-[600px] md:min-h-[700px] flex items-center justify-center overflow-hidden">
      {/* Background Image */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url(${heroImage})` }}
      />
      
      {/* Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-black/70" />
      
      {/* Content */}
      <div className="container relative z-10 py-16 md:py-24">
        <div className="max-w-3xl mx-auto text-center space-y-8">
          {/* Tagline */}
          <p className="text-primary font-medium tracking-wide animate-fade-in">
            Assignment Listings • Metro Vancouver
          </p>
          
          {/* Main Heading */}
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight text-white animate-fade-in" style={{ animationDelay: "0.1s" }}>
            Find Your Next <span className="text-primary">Assignment</span> Here
          </h1>
          
          <p 
            className="text-lg md:text-xl text-white max-w-2xl mx-auto animate-fade-in drop-shadow-md" 
            style={{ animationDelay: "0.2s" }}
          >
            Discover presale condo assignments in Metro Vancouver. Browse listings, 
            connect with verified agents, and find your perfect investment.
          </p>

          {/* Floating Search Card */}
          <div 
            className="bg-background/95 backdrop-blur-sm rounded-xl shadow-2xl p-6 max-w-2xl mx-auto animate-fade-in border border-border/50"
            style={{ animationDelay: "0.3s" }}
          >
            <form onSubmit={handleSearch} className="space-y-4">
              <div className="relative" ref={searchContainerRef}>
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground z-10" />
                <Input
                  type="text"
                  placeholder="Search by project, neighborhood, or developer..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setShowSuggestions(true);
                  }}
                  onFocus={() => setShowSuggestions(true)}
                  className="pl-12 h-14 text-base bg-background border-2 border-border focus-visible:ring-2 focus-visible:ring-primary focus-visible:border-primary"
                  autoComplete="off"
                />
                <SearchSuggestions
                  query={searchQuery}
                  onSelect={handleSuggestionSelect}
                  isVisible={showSuggestions}
                  onClose={() => setShowSuggestions(false)}
                />
              </div>
              <div className="flex flex-col sm:flex-row gap-3">
                <Button type="submit" size="lg" className="flex-1 h-12 text-base font-semibold shadow-gold">
                  <Search className="mr-2 h-5 w-5" />
                  Search Assignments
                </Button>
                <Button 
                  type="button" 
                  variant="outline" 
                  size="lg" 
                  className="h-12"
                  onClick={() => navigate("/assignments")}
                >
                  <MapPin className="mr-2 h-5 w-5" />
                  Browse All
                </Button>
              </div>
            </form>
          </div>

          {/* Top Cities */}
          <div className="space-y-4 animate-fade-in" style={{ animationDelay: "0.4s" }}>
            <div className="flex flex-wrap items-center justify-center gap-3">
              <span className="text-sm font-medium text-white/90 flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-primary"></span>
                Top Cities
              </span>
              {topCities.map((city) => (
                <Button
                  key={city}
                  variant="secondary"
                  size="sm"
                  onClick={() => handleCityClick(city)}
                  className="rounded-full bg-white/10 text-white border-white/20 hover:bg-white hover:text-foreground transition-all duration-200"
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
