import { useState, useRef, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Search, Map, Building2, Home } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SearchSuggestions } from "@/components/home/SearchSuggestions";
import heroImage from "@/assets/hero-lifestyle.jpg";

const TOP_CITIES = ["Vancouver", "Burnaby", "Surrey", "Coquitlam", "Langley", "Richmond"];

export function ResaleHeroSection() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [propertyType, setPropertyType] = useState<"condos" | "townhomes">("condos");
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
    const typeFilter = propertyType === "condos" ? "Condo/Strata" : "Townhouse";
    if (searchQuery.trim()) {
      navigate(`/resale?q=${encodeURIComponent(searchQuery)}&type=${typeFilter}`);
    } else {
      navigate(`/resale?type=${typeFilter}`);
    }
  };

  const handleSuggestionSelect = (suggestion: any) => {
    const typeFilter = propertyType === "condos" ? "Condo/Strata" : "Townhouse";
    if (suggestion.type === "city") {
      navigate(`/resale?city=${suggestion.city}&type=${typeFilter}`);
    } else {
      navigate(`/resale?q=${encodeURIComponent(suggestion.name || suggestion.city)}&type=${typeFilter}`);
    }
    setShowSuggestions(false);
  };

  const handleCityClick = (city: string) => {
    const typeFilter = propertyType === "condos" ? "Condo/Strata" : "Townhouse";
    navigate(`/resale?city=${city}&type=${typeFilter}`);
  };

  return (
    <section className="relative min-h-[70vh] md:min-h-[75vh] flex items-center justify-center overflow-hidden">
      {/* Background Image */}
      <div className="absolute inset-0">
        <img
          src={heroImage}
          alt="Metro Vancouver Real Estate"
          className="h-full w-full object-cover"
          loading="eager"
          fetchPriority="high"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-black/70" />
      </div>

      {/* Content */}
      <div className="relative z-10 container px-4 text-center">
        <div className="max-w-3xl mx-auto space-y-6 md:space-y-8">
          {/* Tagline */}
          <span className="inline-block text-xs md:text-sm font-medium uppercase tracking-widest text-white/80 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full">
            MLS Listings • Metro Vancouver
          </span>

          {/* Headline */}
          <h1 className="text-3xl md:text-5xl lg:text-6xl font-bold text-white leading-tight">
            Find Your Perfect{" "}
            <span className="text-primary">Condo or Townhome</span>
          </h1>

          <p className="text-white/80 text-sm md:text-lg max-w-xl mx-auto">
            Browse thousands of active MLS listings across Metro Vancouver
          </p>

          {/* Search Card */}
          <div className="bg-white/95 backdrop-blur-md rounded-2xl shadow-2xl p-4 md:p-6 max-w-2xl mx-auto">
            {/* Property Type Toggle */}
            <div className="flex items-center justify-center gap-2 mb-4">
              <button
                onClick={() => setPropertyType("condos")}
                className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all ${
                  propertyType === "condos"
                    ? "bg-foreground text-background shadow-sm"
                    : "text-muted-foreground hover:text-foreground bg-muted/50"
                }`}
              >
                <Building2 className="h-4 w-4" />
                Condos
              </button>
              <button
                onClick={() => setPropertyType("townhomes")}
                className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all ${
                  propertyType === "townhomes"
                    ? "bg-foreground text-background shadow-sm"
                    : "text-muted-foreground hover:text-foreground bg-muted/50"
                }`}
              >
                <Home className="h-4 w-4" />
                Townhomes
              </button>
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
                    Search
                  </Button>
                </div>
              </form>
            </div>

            {/* Map Link */}
            <div className="mt-4 flex justify-center">
              <Link
                to="/resale-map"
                className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                <Map className="h-4 w-4" />
                Open Map
              </Link>
            </div>
          </div>

          {/* Top Cities */}
          <div className="pt-4">
            <p className="text-white/60 text-xs mb-3 uppercase tracking-wider">Top Cities</p>
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
