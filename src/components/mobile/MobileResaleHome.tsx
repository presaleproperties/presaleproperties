import { useState, useRef, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Search, Map, Building2, Home } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Footer } from "@/components/layout/Footer";
import { FeaturedResaleListings } from "@/components/home/FeaturedResaleListings";
import { ResaleCitySection } from "@/components/resale/ResaleCitySection";
import { ResaleMapSection } from "@/components/resale/ResaleMapSection";
import { NewConstructionBenefits } from "@/components/home/NewConstructionBenefits";
import { RelatedContent } from "@/components/home/RelatedContent";
import { SearchSuggestions } from "@/components/home/SearchSuggestions";
import { PullToRefresh } from "@/components/ui/pull-to-refresh";
import { useQueryClient } from "@tanstack/react-query";
import heroImage from "@/assets/hero-lifestyle.jpg";

const TOP_CITIES = ["Vancouver", "Burnaby", "Surrey", "Coquitlam", "Langley", "Richmond"];

export function MobileResaleHome() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
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

  const handleRefresh = async () => {
    await queryClient.invalidateQueries({ queryKey: ["featured-resale-listings"] });
  };

  return (
    <PullToRefresh onRefresh={handleRefresh}>
      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative min-h-[60vh] flex items-center justify-center overflow-hidden">
          {/* Background */}
          <div className="absolute inset-0">
            <img
              src={heroImage}
              alt="Metro Vancouver Real Estate"
              className="h-full w-full object-cover"
              loading="eager"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-black/70" />
          </div>

          {/* Content */}
          <div className="relative z-10 container px-4 text-center py-8">
            <div className="max-w-lg mx-auto space-y-4">
              <span className="inline-block text-[10px] font-medium uppercase tracking-widest text-white/80 bg-white/10 backdrop-blur-sm px-3 py-1.5 rounded-full">
                MLS Listings
              </span>

              <h1 className="text-2xl font-bold text-white leading-tight">
                Find Your Perfect{" "}
                <span className="text-primary">Condo or Townhome</span>
              </h1>

              {/* Search Card */}
              <div className="bg-white/95 backdrop-blur-md rounded-xl shadow-xl p-4">
                {/* Property Type Toggle */}
                <div className="flex items-center justify-center gap-1 mb-3">
                  <button
                    onClick={() => setPropertyType("condos")}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                      propertyType === "condos"
                        ? "bg-foreground text-background"
                        : "text-muted-foreground bg-muted/50"
                    }`}
                  >
                    <Building2 className="h-3.5 w-3.5" />
                    Condos
                  </button>
                  <button
                    onClick={() => setPropertyType("townhomes")}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                      propertyType === "townhomes"
                        ? "bg-foreground text-background"
                        : "text-muted-foreground bg-muted/50"
                    }`}
                  >
                    <Home className="h-3.5 w-3.5" />
                    Townhomes
                  </button>
                </div>

                {/* Search */}
                <div ref={searchRef}>
                  <form onSubmit={handleSearch} className="relative">
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          type="text"
                          placeholder="City or neighborhood..."
                          value={searchQuery}
                          onChange={(e) => {
                            setSearchQuery(e.target.value);
                            setShowSuggestions(e.target.value.length > 0);
                          }}
                          onFocus={() => setShowSuggestions(true)}
                          className="pl-10 h-11 text-sm border-border rounded-lg"
                        />
                        {showSuggestions && (
                          <div className="absolute left-0 right-0 top-full mt-1 bg-background border border-border rounded-lg shadow-xl overflow-hidden z-50">
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
                        className="h-11 px-4 rounded-lg bg-foreground text-background"
                      >
                        <Search className="h-4 w-4" />
                      </Button>
                    </div>
                  </form>
                </div>

                {/* Map Link */}
                <div className="mt-3 flex justify-center">
                  <Link
                    to="/resale-map"
                    className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <Map className="h-3.5 w-3.5" />
                    Open Map
                  </Link>
                </div>
              </div>

              {/* Top Cities */}
              <div className="overflow-x-auto scrollbar-hide -mx-4 px-4">
                <div className="flex gap-2 justify-start min-w-max">
                  {TOP_CITIES.map((city) => (
                    <button
                      key={city}
                      onClick={() => handleCityClick(city)}
                      className="px-3 py-1.5 text-xs font-medium text-white/90 bg-white/10 backdrop-blur-sm rounded-full hover:bg-white/20 transition-all whitespace-nowrap"
                    >
                      {city}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Content Sections */}
        <FeaturedResaleListings />
        <ResaleCitySection />
        <ResaleMapSection />
        <NewConstructionBenefits />
        <RelatedContent />
      </main>

      <Footer />
    </PullToRefresh>
  );
}
