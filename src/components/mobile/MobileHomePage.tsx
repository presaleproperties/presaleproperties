import { useState, useCallback, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { Search } from "lucide-react";
import { SuggestionType } from "@/components/home/SearchSuggestions";
import { MobileCategoryChips, CategoryChip } from "./MobileCategoryChips";
import { MobileDiscoveryCarousel } from "./MobileDiscoveryCarousel";
import { FloatingBottomNav } from "./FloatingBottomNav";
import { usePullToRefresh } from "@/hooks/usePullToRefresh";
import { PullToRefreshIndicator } from "@/components/ui/pull-to-refresh";
import { NewConstructionBenefits } from "@/components/home/NewConstructionBenefits";
import { RelatedContent } from "@/components/home/RelatedContent";
import { Footer } from "@/components/layout/Footer";
import { Input } from "@/components/ui/input";
import { SearchSuggestions } from "@/components/home/SearchSuggestions";
import { cn } from "@/lib/utils";

export function MobileHomePage() {
  const [selectedCity, setSelectedCity] = useState("all");
  const [selectedChip, setSelectedChip] = useState<string | undefined>(undefined);
  const [activeFilter, setActiveFilter] = useState<CategoryChip["filter"]>({});
  const [searchQuery, setSearchQuery] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const searchContainerRef = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();
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

  const handleSuggestionSelect = (value: string, type: SuggestionType, slug?: string) => {
    setSearchQuery(value);
    setShowSuggestions(false);

    // Navigate directly to project detail if a presale project is selected
    if (type === "presale" && slug) {
      navigate(`/presale-projects/${encodeURIComponent(slug)}`);
      return;
    }

    // For other types (city, neighborhood, developer), search the directory
    navigate(`/presale-projects?q=${encodeURIComponent(value)}`);
  };

  const handleRefresh = useCallback(async () => {
    await queryClient.invalidateQueries({ queryKey: ["mobile-discovery"] });
  }, [queryClient]);

  const { pullDistance, isRefreshing, containerRef } = usePullToRefresh({
    onRefresh: handleRefresh,
    threshold: 80,
    maxPull: 120,
  });

  const handleCityChange = useCallback((city: string) => {
    setSelectedCity(city);
    
    if (typeof window !== "undefined" && (window as any).gtag) {
      (window as any).gtag("event", "location_changed", {
        city: city,
      });
    }
  }, []);

  const handleChipSelect = useCallback((chipId: string, filter: CategoryChip["filter"]) => {
    setSelectedChip(chipId);
    setActiveFilter(filter);
  }, []);

  return (
    <div 
      ref={containerRef}
      className="min-h-screen bg-background md:hidden"
    >
      {/* Pull to Refresh Indicator */}
      <PullToRefreshIndicator 
        pullDistance={pullDistance} 
        isRefreshing={isRefreshing} 
      />

      {/* Category Chips - Sticky below header */}
      <div className="sticky top-12 z-30 bg-background/95 backdrop-blur-sm">
        <MobileCategoryChips
          selectedChip={selectedChip}
          onChipSelect={handleChipSelect}
        />
      </div>

      {/* Mobile Hero - Compact welcome */}
      <div 
        className="px-4 pt-3 pb-2"
        style={{ 
          transform: pullDistance > 0 ? `translateY(${pullDistance}px)` : undefined,
          transition: pullDistance === 0 ? 'transform 0.3s ease-out' : undefined
        }}
      >
        <h1 className="text-base font-bold text-foreground">
          New Presale Condos & Townhomes
        </h1>
        <p className="text-xs text-muted-foreground mb-3">
          Metro Vancouver's latest developments
        </p>
        
        {/* Compact Search Bar */}
        <div ref={searchContainerRef} className="relative">
          <form onSubmit={handleSearch}>
            <Input
              type="text"
              placeholder="Search projects, cities..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setShowSuggestions(true);
              }}
              onFocus={() => {
                setShowSuggestions(true);
                setIsSearchFocused(true);
              }}
              onBlur={() => setIsSearchFocused(false)}
              className="h-10 text-sm pl-3 pr-10 rounded-lg bg-muted/50 border-border focus:bg-background transition-colors"
              autoComplete="off"
            />
            <button 
              type="submit"
              className="absolute right-2 top-1/2 -translate-y-1/2 h-7 w-7 flex items-center justify-center text-muted-foreground hover:text-foreground active:scale-95 transition-all rounded-full"
            >
              <Search className={cn(
                "h-4 w-4 transition-all duration-300",
                isSearchFocused && "text-primary scale-110"
              )} />
            </button>
          </form>
          <SearchSuggestions
            query={searchQuery}
            onSelect={handleSuggestionSelect}
            isVisible={showSuggestions}
            onClose={() => setShowSuggestions(false)}
            searchMode="projects"
          />
        </div>
      </div>

      {/* Discovery Sections */}
      <div 
        className="space-y-4 py-1"
        style={{ 
          transform: pullDistance > 0 ? `translateY(${pullDistance}px)` : undefined,
          transition: pullDistance === 0 ? 'transform 0.3s ease-out' : undefined
        }}
      >
        {/* Condos */}
        <CarouselSection delay={0}>
          <MobileDiscoveryCarousel
            type="condos"
            title="Presale Condos"
            city={selectedCity}
          />
        </CarouselSection>

        {/* Townhomes */}
        <CarouselSection delay={50}>
          <MobileDiscoveryCarousel
            type="townhomes"
            title="Presale Townhomes"
            city={selectedCity}
          />
        </CarouselSection>

        {/* Single-Family / Detached */}
        <CarouselSection delay={100}>
          <MobileDiscoveryCarousel
            type="single_family"
            title="Detached Homes"
            city={selectedCity}
          />
        </CarouselSection>

        {/* City-based Carousels */}
        <CarouselSection delay={150}>
          <MobileDiscoveryCarousel
            type="city_vancouver"
            title="Vancouver"
            city={selectedCity}
          />
        </CarouselSection>

        <CarouselSection delay={200}>
          <MobileDiscoveryCarousel
            type="city_surrey"
            title="Surrey"
            city={selectedCity}
          />
        </CarouselSection>

        <CarouselSection delay={250}>
          <MobileDiscoveryCarousel
            type="city_burnaby"
            title="Burnaby"
            city={selectedCity}
          />
        </CarouselSection>

        <CarouselSection delay={300}>
          <MobileDiscoveryCarousel
            type="city_coquitlam"
            title="Coquitlam"
            city={selectedCity}
          />
        </CarouselSection>

        <CarouselSection delay={350}>
          <MobileDiscoveryCarousel
            type="city_langley"
            title="Langley"
            city={selectedCity}
          />
        </CarouselSection>

        <CarouselSection delay={400}>
          <MobileDiscoveryCarousel
            type="city_richmond"
            title="Richmond"
            city={selectedCity}
          />
        </CarouselSection>

        <CarouselSection delay={450}>
          <MobileDiscoveryCarousel
            type="city_delta"
            title="Delta"
            city={selectedCity}
          />
        </CarouselSection>

        <CarouselSection delay={500}>
          <MobileDiscoveryCarousel
            type="city_abbotsford"
            title="Abbotsford"
            city={selectedCity}
          />
        </CarouselSection>
      </div>

      {/* Benefits Section - Mobile optimized */}
      <div className="mt-4">
        <NewConstructionBenefits />
      </div>

      {/* Quick Links Section */}
      <RelatedContent />

      {/* Footer - with extra bottom padding for nav */}
      <div className="pb-28">
        <Footer />
      </div>

      {/* Bottom Navigation with Location Picker */}
      <FloatingBottomNav 
        selectedCity={selectedCity}
        onCityChange={handleCityChange}
      />
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
