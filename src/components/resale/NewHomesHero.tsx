import { useState, useRef, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Search, Map, Building2, Home, Bell, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SearchSuggestions } from "@/components/home/SearchSuggestions";
import heroImage from "@/assets/hero-lifestyle.jpg";

const TOP_CITIES = [
  "Vancouver", 
  "Burnaby", 
  "Surrey", 
  "Coquitlam", 
  "Langley", 
  "Delta", 
  "Richmond",
  "Abbotsford"
];

interface NewHomesHeroProps {
  onOpenLeadForm?: () => void;
}

export function NewHomesHero({ onOpenLeadForm }: NewHomesHeroProps) {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [propertyType, setPropertyType] = useState<"all" | "condos" | "townhomes" | "detached">("all");
  const searchRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSearch = (e?: React.FormEvent) => {
    e?.preventDefault();
    let typeFilter = "";
    if (propertyType === "condos") typeFilter = "Condo";
    else if (propertyType === "townhomes") typeFilter = "Townhouse";
    else if (propertyType === "detached") typeFilter = "Detached";
    
    const params = new URLSearchParams();
    if (searchQuery.trim()) params.set("q", searchQuery);
    if (typeFilter) params.set("type", typeFilter);
    params.set("new", "true"); // Filter for 2025+ only
    
    navigate(`/resale?${params.toString()}`);
  };

  const handleSuggestionSelect = (suggestion: any) => {
    if (suggestion.type === "city") {
      navigate(`/resale/${suggestion.city.toLowerCase()}`);
    } else {
      handleSearch();
    }
    setShowSuggestions(false);
  };

  const handleCityClick = (city: string) => {
    navigate(`/resale/${city.toLowerCase()}`);
  };

  return (
    <section className="relative min-h-[75vh] md:min-h-[80vh] flex items-center justify-center overflow-hidden">
      {/* Background Image */}
      <div className="absolute inset-0">
        <img
          src={heroImage}
          alt="Ready-to-Move-In New Homes in Metro Vancouver"
          className="h-full w-full object-cover"
          loading="eager"
          fetchPriority="high"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/65 via-black/45 to-black/75" />
      </div>

      {/* Content */}
      <div className="relative z-10 container px-4 text-center">
        <div className="max-w-4xl mx-auto space-y-6 md:space-y-8">
          {/* Badge */}
          <span className="inline-block text-xs md:text-sm font-semibold uppercase tracking-widest text-white bg-primary/90 px-4 py-2 rounded-full">
            New Construction • Built 2024+
          </span>

          {/* Headline */}
          <h1 className="text-3xl md:text-5xl lg:text-6xl font-bold text-white leading-tight">
            Find <span className="text-primary">New Construction</span> Homes
          </h1>
          
          <p className="text-white/90 text-base md:text-xl max-w-2xl mx-auto font-medium">
            Condos, Townhomes & Single Family Homes Across Metro Vancouver
          </p>

          {/* Search Card */}
          <div className="bg-white/95 backdrop-blur-md rounded-2xl shadow-2xl p-4 md:p-6 max-w-3xl mx-auto">
            {/* Property Type Toggle */}
            <div className="flex items-center justify-center gap-1 md:gap-2 mb-4 flex-wrap">
              {[
                { key: "all", label: "All Types", icon: null },
                { key: "condos", label: "Condos", icon: Building2 },
                { key: "townhomes", label: "Townhomes", icon: Home },
                { key: "detached", label: "Detached", icon: Home },
              ].map((type) => (
                <button
                  key={type.key}
                  onClick={() => setPropertyType(type.key as typeof propertyType)}
                  className={`flex items-center gap-1.5 px-3 md:px-4 py-2 rounded-full text-xs md:text-sm font-medium transition-all ${
                    propertyType === type.key
                      ? "bg-foreground text-background shadow-sm"
                      : "text-muted-foreground hover:text-foreground bg-muted/50"
                  }`}
                >
                  {type.icon && <type.icon className="h-3.5 w-3.5" />}
                  {type.label}
                </button>
              ))}
            </div>

            {/* Search Input */}
            <div ref={searchRef}>
              <form onSubmit={handleSearch} className="relative">
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                    <Input
                      type="text"
                      placeholder="Search by city, neighborhood..."
                      value={searchQuery}
                      onChange={(e) => {
                        setSearchQuery(e.target.value);
                        setShowSuggestions(e.target.value.length > 0);
                      }}
                      onFocus={() => setShowSuggestions(true)}
                      className="pl-12 h-12 md:h-14 text-base md:text-lg border-border rounded-xl"
                    />
                    {showSuggestions && (
                      <div className="absolute left-0 right-0 top-full mt-1 bg-background border border-border rounded-xl shadow-xl overflow-hidden z-50">
                        <SearchSuggestions
                          query={searchQuery}
                          isVisible={showSuggestions}
                          onSelect={(value, type, slug) => {
                            if (type === "city") {
                              handleSuggestionSelect({ type: "city", city: value });
                            } else {
                              handleSuggestionSelect({ type, name: value, slug });
                            }
                          }}
                          onClose={() => setShowSuggestions(false)}
                          searchMode="resale"
                        />
                      </div>
                    )}
                  </div>
                  <Button
                    type="submit"
                    size="lg"
                    className="h-12 md:h-14 px-6 md:px-8 rounded-xl bg-foreground text-background hover:bg-foreground/90"
                  >
                    <span className="hidden md:inline">Browse New Homes</span>
                    <Search className="h-5 w-5 md:hidden" />
                  </Button>
                </div>
              </form>
            </div>

            {/* Micro-copy */}
            <p className="text-xs text-muted-foreground mt-3 text-center">
              Condos, townhomes & single family homes built 2024 or newer.
            </p>

            {/* Action Links */}
            <div className="mt-4 flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link
                to="/resale-map"
                className="flex items-center gap-2 text-sm font-medium text-foreground/80 hover:text-foreground transition-colors"
              >
                <Map className="h-4 w-4" />
                List View / Map View
              </Link>
              <span className="hidden sm:block text-muted-foreground">•</span>
              <button
                onClick={onOpenLeadForm}
                className="flex items-center gap-2 text-sm font-medium text-primary hover:text-primary/80 transition-colors"
              >
                <Bell className="h-4 w-4" />
                Get New Build Alerts
              </button>
            </div>
          </div>

          {/* Top Cities */}
          <div className="pt-4">
            <p className="text-white/60 text-xs mb-3 uppercase tracking-wider">Browse by City</p>
            <div className="flex flex-wrap justify-center gap-2">
              {TOP_CITIES.map((city) => (
                <button
                  key={city}
                  onClick={() => handleCityClick(city)}
                  className="px-4 py-2 text-sm font-medium text-white/90 bg-white/10 backdrop-blur-sm rounded-full hover:bg-white/20 transition-all hover:scale-105"
                >
                  {city}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
