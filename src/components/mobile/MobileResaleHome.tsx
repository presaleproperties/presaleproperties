import { useState, useRef, useEffect, useCallback } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Search, MapPin, Flame } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Footer } from "@/components/layout/Footer";
import { MobileResaleCarousel } from "./MobileResaleCarousel";
import { MobileResalePropertyTypeCarousel } from "./MobileResalePropertyTypeCarousel";
import { MobileCityQuickLinks } from "./MobileCityQuickLinks";
import { SearchSuggestions } from "@/components/home/SearchSuggestions";
import { NewConstructionBenefits } from "@/components/home/NewConstructionBenefits";
import { HomeUnifiedMapSection } from "@/components/map/HomeUnifiedMapSection";
import { ROICalculatorTeaser } from "@/components/home/ROICalculatorTeaser";
import { RelatedContent } from "@/components/home/RelatedContent";
import { PullToRefreshIndicator } from "@/components/ui/pull-to-refresh";
import { usePullToRefresh } from "@/hooks/usePullToRefresh";
import { useQueryClient } from "@tanstack/react-query";
import heroImage from "@/assets/hero-lifestyle.jpg";

const TOP_CITIES = [
  { name: "Coquitlam", slug: "coquitlam" },
  { name: "Langley", slug: "langley" },
  { name: "Burnaby", slug: "burnaby" },
  { name: "Surrey", slug: "surrey" },
  { name: "Vancouver", slug: "vancouver" },
];

const CITY_CAROUSELS = [
  { city: "Coquitlam", title: "Coquitlam", subtitle: "Brand new, never lived in" },
  { city: "Langley", title: "Langley", subtitle: "Brand new homes ready for move-in" },
  { city: "Burnaby", title: "Burnaby", subtitle: "Brand new homes ready for move-in" },
  { city: "Surrey", title: "Surrey", subtitle: "Brand new, never lived in" },
  { city: "Richmond", title: "Richmond", subtitle: "Brand new, never lived in" },
  { city: "Delta", title: "Delta", subtitle: "Brand new homes ready for move-in" },
  { city: "Abbotsford", title: "Abbotsford", subtitle: "Brand new, never lived in" },
  { city: "Vancouver", title: "Vancouver", subtitle: "Brand new homes ready for move-in" },
];

export function MobileResaleHome() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSearch = (e?: React.FormEvent) => {
    e?.preventDefault();
    setShowSuggestions(false);
    if (searchQuery.trim()) {
      navigate(`/resale?q=${encodeURIComponent(searchQuery)}`);
    } else {
      navigate("/resale");
    }
  };

  const handleSuggestionSelect = (value: string, type: string, slug?: string) => {
    setSearchQuery(value);
    setShowSuggestions(false);
    if (type === "city") {
      navigate(`/resale/${value.toLowerCase()}`);
    } else {
      navigate(`/resale?q=${encodeURIComponent(value)}`);
    }
  };

  const handleCityClick = (slug: string) => {
    navigate(`/resale/${slug}`);
  };

  const handleRefresh = useCallback(async () => {
    await queryClient.invalidateQueries({ queryKey: ["featured-resale-listings-2025"] });
    await queryClient.invalidateQueries({ queryKey: ["mobile-resale-property-type-2025"] });
    await queryClient.invalidateQueries({ queryKey: ["mobile-resale-carousel-2025"] });
  }, [queryClient]);

  const { pullDistance, isRefreshing, containerRef } = usePullToRefresh({
    onRefresh: handleRefresh,
    threshold: 80,
    maxPull: 120,
  });

  return (
    <div 
      ref={containerRef}
      className="min-h-screen bg-background lg:hidden"
    >
      {/* Pull to Refresh Indicator */}
      <PullToRefreshIndicator 
        pullDistance={pullDistance} 
        isRefreshing={isRefreshing} 
      />

      {/* Hero Section - Compact, above the fold */}
      <div 
        className="relative min-h-[28vh] flex flex-col"
        style={{ 
          transform: pullDistance > 0 ? `translateY(${pullDistance}px)` : undefined,
          transition: pullDistance === 0 ? 'transform 0.3s ease-out' : undefined
        }}
      >
        {/* Background Image */}
        <div className="absolute inset-0">
          <img 
            src={heroImage} 
            alt="Modern home interior" 
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/50 to-black/60" />
        </div>

        {/* Hero Content - Compact mobile messaging */}
        <div className="relative flex-1 flex flex-col justify-center items-center px-4 pt-14 pb-4 text-center">
          <h1 className="text-xl font-bold text-white leading-tight">
            Presale & <span className="text-primary">Move-In Ready</span> Homes
          </h1>
          <p className="text-white/80 text-xs mt-1.5">
            Brand new. Never lived in.
          </p>
        </div>

        {/* Floating Search Card */}
        <div className="relative px-4 -mb-14 z-10">
          <div 
            ref={searchContainerRef}
            className="bg-card rounded-xl shadow-lg border border-border p-4"
          >
            {/* Search Header */}
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-semibold text-foreground">
                Search New Homes
              </span>
              <button 
                onClick={() => navigate("/map-search?mode=resale")}
                className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                <MapPin className="h-4 w-4" />
                <span className="hidden xs:inline">Map</span>
              </button>
            </div>

            {/* Search Input */}
            <form onSubmit={handleSearch} className="relative">
              <Input
                type="text"
                placeholder="City, Neighbourhood, Address..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setShowSuggestions(true);
                }}
                onFocus={() => setShowSuggestions(true)}
                className="h-14 text-base pl-4 pr-14 rounded-xl bg-muted/50 border-border focus:bg-background focus:border-primary/50 transition-all"
                autoComplete="off"
              />
              <button 
                type="submit"
                className="absolute right-2 top-1/2 -translate-y-1/2 h-10 w-10 flex items-center justify-center rounded-lg bg-foreground text-background hover:bg-foreground/90 active:scale-95 transition-all"
              >
                <Search className="h-5 w-5" />
              </button>
            </form>
            
            <SearchSuggestions
              query={searchQuery}
              onSelect={handleSuggestionSelect}
              isVisible={showSuggestions}
              onClose={() => setShowSuggestions(false)}
              searchMode="resale"
            />
          </div>
        </div>
      </div>

      {/* Top Cities - Horizontal Scroll */}
      <div className="pt-20 pb-6 px-4 sm:px-6 bg-background">
        <div className="flex items-center gap-2.5 overflow-x-auto scrollbar-hide pb-1 -mx-4 px-4 sm:-mx-6 sm:px-6">
          <span className="text-sm text-muted-foreground whitespace-nowrap flex-shrink-0">
            Top Cities
          </span>
          {TOP_CITIES.map((city) => (
            <button
              key={city.slug}
              onClick={() => handleCityClick(city.slug)}
              className="px-3.5 py-2 rounded-full text-sm font-medium whitespace-nowrap border border-border bg-card hover:border-primary hover:bg-primary hover:text-primary-foreground transition-all active:scale-95 flex-shrink-0"
            >
              {city.name}
            </button>
          ))}
        </div>
      </div>

      {/* Discovery Sections */}
      <div className="pb-6">
        {/* Hottest / Newest Listings */}
        <CarouselSection delay={0}>
          <div className="px-4 sm:px-6 mb-2">
            <div className="flex items-center gap-1.5 text-primary text-xs font-semibold uppercase tracking-wide">
              <Flame className="h-3.5 w-3.5" />
              Don't Miss Out
            </div>
          </div>
          <MobileResaleCarousel
            title="Hottest Listings"
            subtitle="Newest homes in Metro Vancouver"
          />
        </CarouselSection>

        <div className="my-6 mx-4 sm:mx-6 border-t border-border/50" />

        {/* Property Type Carousels */}
        <CarouselSection delay={50}>
          <MobileResalePropertyTypeCarousel
            propertyType="condo"
            title="Move-In Ready Condos"
            subtitle="Brand new, never lived in"
          />
        </CarouselSection>

        <div className="my-6 mx-4 sm:mx-6 border-t border-border/50" />

        <CarouselSection delay={75}>
          <MobileResalePropertyTypeCarousel
            propertyType="townhouse"
            title="Move-In Ready Townhomes"
            subtitle="Brand new homes ready for move-in"
          />
        </CarouselSection>

        <div className="my-6 mx-4 sm:mx-6 border-t border-border/50" />

        <CarouselSection delay={100}>
          <MobileResalePropertyTypeCarousel
            propertyType="house"
            title="Move-In Ready Single Family"
            subtitle="Brand new, never lived in"
          />
        </CarouselSection>

        <div className="my-6 mx-4 sm:mx-6 border-t border-border/50" />

        {/* City Quick Links */}
        <CarouselSection delay={125}>
          <MobileCityQuickLinks mode="resale" />
        </CarouselSection>

        <div className="my-6 mx-4 sm:mx-6 border-t border-border/50" />

        {/* City-based Carousels */}
        <div className="px-4 sm:px-6 mb-4">
          <h3 className="text-lg font-bold text-foreground">Browse by City</h3>
          <p className="text-sm text-muted-foreground">Find new homes in your area</p>
        </div>
        
        {CITY_CAROUSELS.map((carousel, index) => (
          <CarouselSection key={carousel.city} delay={150 + index * 25}>
            <MobileResaleCarousel
              city={carousel.city}
              title={carousel.title}
              subtitle={carousel.subtitle}
            />
            {index < CITY_CAROUSELS.length - 1 && (
              <div className="my-6 mx-4 sm:mx-6 border-t border-border/50" />
            )}
          </CarouselSection>
        ))}
      </div>

      {/* Benefits Section */}
      <div className="mt-6">
        <NewConstructionBenefits />
      </div>

      {/* ROI Calculator Teaser */}
      <div className="mt-4">
        <ROICalculatorTeaser />
      </div>

      {/* Quick Links Section */}
      <div className="mt-4">
        <RelatedContent />
      </div>

      {/* Large Map Section - Page Ending */}
      <div className="mt-4">
        <HomeUnifiedMapSection initialMode="resale" contextType="resale" />
      </div>

      {/* Footer - with extra bottom padding for nav */}
      <div className="pb-28">
        <Footer />
      </div>
    </div>
  );
}

// Animated carousel section wrapper
function CarouselSection({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
  return (
    <div 
      className="animate-fade-in"
      style={{ animationDelay: `${delay}ms`, animationFillMode: 'both' }}
    >
      {children}
    </div>
  );
}
