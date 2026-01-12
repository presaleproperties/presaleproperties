import { useState, useRef, useEffect, useCallback } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Search, MapPin } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Footer } from "@/components/layout/Footer";
import { MobileResaleCarousel } from "./MobileResaleCarousel";
import { MobileCityQuickLinks } from "./MobileCityQuickLinks";
import { SearchSuggestions } from "@/components/home/SearchSuggestions";
import { NewConstructionBenefits } from "@/components/home/NewConstructionBenefits";
import { ResaleMapSection } from "@/components/resale/ResaleMapSection";
import { ROICalculatorTeaser } from "@/components/home/ROICalculatorTeaser";
import { RelatedContent } from "@/components/home/RelatedContent";
import { PullToRefreshIndicator } from "@/components/ui/pull-to-refresh";
import { usePullToRefresh } from "@/hooks/usePullToRefresh";
import { useQueryClient } from "@tanstack/react-query";
import heroImage from "@/assets/hero-lifestyle.jpg";

const TOP_CITIES = [
  { name: "Vancouver", slug: "vancouver" },
  { name: "Burnaby", slug: "burnaby" },
  { name: "Surrey", slug: "surrey" },
  { name: "Coquitlam", slug: "coquitlam" },
  { name: "Langley", slug: "langley" },
  { name: "Delta", slug: "delta" },
];

const CITY_CAROUSELS = [
  { city: "Vancouver", title: "Vancouver New Homes", subtitle: "Condos, Townhomes & Single Family" },
  { city: "Burnaby", title: "Burnaby New Homes", subtitle: "Metrotown & Brentwood" },
  { city: "Surrey", title: "Surrey New Homes", subtitle: "South Surrey & Guildford" },
  { city: "Coquitlam", title: "Coquitlam New Homes", subtitle: "Tri-Cities Area" },
  { city: "Langley", title: "Langley New Homes", subtitle: "Township & City" },
  { city: "Delta", title: "Delta New Homes", subtitle: "Tsawwassen & Ladner" },
  { city: "Richmond", title: "Richmond New Homes", subtitle: "City Centre & Steveston" },
  { city: "Abbotsford", title: "Abbotsford New Homes", subtitle: "Fraser Valley" },
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

        {/* Hero Content */}
        <div className="relative flex-1 flex flex-col justify-center items-center px-4 pt-14 pb-4 text-center">
          <h1 className="text-xl font-bold text-white leading-tight">
            Find <span className="text-primary">New Construction</span> Homes
          </h1>
          <p className="text-white/80 text-xs mt-1.5">
            Condos, Townhomes & Single Family • Built 2024+
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
                onClick={() => navigate("/resale-map")}
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
        <div className="flex items-center gap-3 overflow-x-auto scrollbar-hide pb-1">
          <span className="text-sm text-muted-foreground whitespace-nowrap flex-shrink-0">
            Top Cities
          </span>
          {TOP_CITIES.map((city) => (
            <button
              key={city.slug}
              onClick={() => handleCityClick(city.slug)}
              className="px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap border border-border bg-card hover:border-primary hover:bg-primary hover:text-primary-foreground transition-all active:scale-95"
            >
              {city.name}
            </button>
          ))}
        </div>
      </div>

      {/* Discovery Sections */}
      <div className="pb-6">
        {/* Featured Listings */}
        <CarouselSection delay={0}>
          <MobileResaleCarousel
            title="Featured Listings"
            subtitle="New construction resale homes"
          />
        </CarouselSection>

        <div className="my-6 mx-4 sm:mx-6 border-t border-border/50" />

        {/* City Quick Links */}
        <CarouselSection delay={50}>
          <MobileCityQuickLinks mode="resale" />
        </CarouselSection>

        <div className="my-6 mx-4 sm:mx-6 border-t border-border/50" />

        {/* City-based Carousels */}
        {CITY_CAROUSELS.map((carousel, index) => (
          <CarouselSection key={carousel.city} delay={100 + index * 50}>
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

      {/* Map Section */}
      <div className="mt-4">
        <ResaleMapSection />
      </div>

      {/* ROI Calculator Teaser */}
      <div className="mt-4">
        <ROICalculatorTeaser />
      </div>

      {/* Quick Links Section */}
      <div className="mt-4">
        <RelatedContent />
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
