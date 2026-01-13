import { useState, useCallback, useRef, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { Search, MapPin } from "lucide-react";
import { SuggestionType } from "@/components/home/SearchSuggestions";
import { MobileDiscoveryCarousel } from "./MobileDiscoveryCarousel";
import { MobileResaleCarousel } from "./MobileResaleCarousel";
import { MobileResaleCityCarousel } from "./MobileResaleCityCarousel";
import { MobileCityQuickLinks } from "./MobileCityQuickLinks";
import { usePullToRefresh } from "@/hooks/usePullToRefresh";
import { PullToRefreshIndicator } from "@/components/ui/pull-to-refresh";
import { NewConstructionBenefits } from "@/components/home/NewConstructionBenefits";
import { RelatedContent } from "@/components/home/RelatedContent";
import { ROICalculatorTeaser } from "@/components/home/ROICalculatorTeaser";
import { HomeUnifiedMapSection } from "@/components/map/HomeUnifiedMapSection";
import { Footer } from "@/components/layout/Footer";
import { Input } from "@/components/ui/input";
import { SearchSuggestions } from "@/components/home/SearchSuggestions";
import heroImage from "@/assets/hero-lifestyle.jpg";
import { SearchTab } from "@/components/home/HeroSection";

const TOP_CITIES = [
  { name: "Vancouver", slug: "vancouver" },
  { name: "Surrey", slug: "surrey" },
  { name: "Burnaby", slug: "burnaby" },
  { name: "Langley", slug: "langley" },
  { name: "Coquitlam", slug: "coquitlam" },
  { name: "Richmond", slug: "richmond" },
];

interface MobileHomePageProps {
  activeTab?: SearchTab;
  onTabChange?: (tab: SearchTab) => void;
}

export function MobileHomePage({ activeTab: controlledTab, onTabChange }: MobileHomePageProps) {
  const [internalTab, setInternalTab] = useState<SearchTab>("projects");
  const activeTab = controlledTab ?? internalTab;
  
  const handleTabChange = (tab: SearchTab) => {
    if (onTabChange) {
      onTabChange(tab);
    } else {
      setInternalTab(tab);
    }
  };
  
  const [selectedCity, setSelectedCity] = useState("all");
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
    const basePath = activeTab === "projects" ? "/presale-projects" : "/resale";
    if (searchQuery.trim()) {
      navigate(`${basePath}?q=${encodeURIComponent(searchQuery)}`);
    } else {
      navigate(basePath);
    }
  };

  const handleSuggestionSelect = (value: string, type: SuggestionType, slug?: string) => {
    setSearchQuery(value);
    setShowSuggestions(false);

    if (activeTab === "projects") {
      // Navigate directly to project detail if a presale project is selected
      if (type === "presale" && slug) {
        navigate(`/presale-projects/${encodeURIComponent(slug)}`);
        return;
      }
      // For other types (city, neighborhood, developer), search the directory
      navigate(`/presale-projects?q=${encodeURIComponent(value)}`);
    } else {
      // Resale mode - navigate to resale search
      navigate(`/resale?q=${encodeURIComponent(value)}`);
    }
  };

  const handleCityClick = (slug: string) => {
    if (activeTab === "projects") {
      navigate(`/presale-condos/${slug}`);
    } else {
      navigate(`/resale?city=${slug}`);
    }
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
          {/* Gradient overlay for text readability */}
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
            {/* Search Header with Tabs */}
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => handleTabChange("projects")}
                  className={`px-3 py-1.5 rounded-full text-sm font-semibold transition-all ${
                    activeTab === "projects" 
                      ? "bg-foreground text-background" 
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  Presale
                </button>
                <button
                  onClick={() => handleTabChange("resale")}
                  className={`px-3 py-1.5 rounded-full text-sm font-semibold transition-all ${
                    activeTab === "resale" 
                      ? "bg-foreground text-background" 
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  Move-In Ready
                </button>
              </div>
              
              <button 
                onClick={() => navigate("/map-search")}
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
                placeholder={activeTab === "projects" 
                  ? "City, Neighbourhood, Project..." 
                  : "City, Neighbourhood, Address..."
                }
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
              searchMode={activeTab}
            />
          </div>
        </div>
      </div>
      {/* Top Cities - Horizontal Scroll with adaptive padding */}
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

      {/* Discovery Sections - Switch based on active tab */}
      <div className="pb-6">
        {activeTab === "projects" ? (
          <>
            {/* Hot Projects - Featured Section */}
            <CarouselSection delay={0}>
              <MobileDiscoveryCarousel
                type="hot_projects"
                title="Most Popular Projects"
                subtitle="The most in-demand presale projects"
                city={selectedCity}
              />
            </CarouselSection>

            <div className="my-6 mx-4 sm:mx-6 border-t border-border/50" />

            {/* Condos */}
            <CarouselSection delay={50}>
              <MobileDiscoveryCarousel
                type="condos"
                title="Presale Condos"
                city={selectedCity}
              />
            </CarouselSection>

            <div className="my-6 mx-4 sm:mx-6 border-t border-border/50" />

            {/* Townhomes */}
            <CarouselSection delay={50}>
              <MobileDiscoveryCarousel
                type="townhomes"
                title="Presale Townhomes"
                city={selectedCity}
              />
            </CarouselSection>

            <div className="my-6 mx-4 sm:mx-6 border-t border-border/50" />

            {/* Single-Family / Detached */}
            <CarouselSection delay={100}>
              <MobileDiscoveryCarousel
                type="single_family"
                title="Detached Homes"
                city={selectedCity}
              />
            </CarouselSection>

            <div className="my-6 mx-4 sm:mx-6 border-t border-border/50" />

            {/* Projects Near You - City Quick Links */}
            <CarouselSection delay={125}>
              <MobileCityQuickLinks />
            </CarouselSection>
          </>
        ) : (
          <>
            {/* Resale Mode - Show MLS listings */}
            <CarouselSection delay={0}>
              <MobileResaleCarousel
                title="Featured Listings"
                subtitle="New construction resale homes"
              />
            </CarouselSection>

            <div className="my-6 mx-4 sm:mx-6 border-t border-border/50" />

            {/* City Quick Links for Resale */}
            <CarouselSection delay={50}>
              <MobileCityQuickLinks mode="resale" />
            </CarouselSection>

            <div className="my-6 mx-4 sm:mx-6 border-t border-border/50" />

            {/* Resale City Carousels */}
            <CarouselSection delay={100}>
              <MobileResaleCityCarousel city="Vancouver" />
            </CarouselSection>

            <div className="my-6 mx-4 sm:mx-6 border-t border-border/50" />

            <CarouselSection delay={150}>
              <MobileResaleCityCarousel city="Surrey" />
            </CarouselSection>

            <div className="my-6 mx-4 sm:mx-6 border-t border-border/50" />

            <CarouselSection delay={200}>
              <MobileResaleCityCarousel city="Burnaby" />
            </CarouselSection>

            <div className="my-6 mx-4 sm:mx-6 border-t border-border/50" />

            <CarouselSection delay={250}>
              <MobileResaleCityCarousel city="Langley" />
            </CarouselSection>

            <div className="my-6 mx-4 sm:mx-6 border-t border-border/50" />

            <CarouselSection delay={300}>
              <MobileResaleCityCarousel city="Coquitlam" />
            </CarouselSection>

            <div className="my-6 mx-4 sm:mx-6 border-t border-border/50" />

            <CarouselSection delay={350}>
              <MobileResaleCityCarousel city="Richmond" />
            </CarouselSection>

            <div className="my-6 mx-4 sm:mx-6 border-t border-border/50" />

            <CarouselSection delay={400}>
              <MobileResaleCityCarousel city="Delta" />
            </CarouselSection>

            <div className="my-6 mx-4 sm:mx-6 border-t border-border/50" />

            <CarouselSection delay={450}>
              <MobileResaleCityCarousel city="Abbotsford" />
            </CarouselSection>
          </>
        )}

        {/* City-based Carousels - Only show for Presale tab */}
        {activeTab === "projects" && (
          <>
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
          </>
        )}
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
        <HomeUnifiedMapSection initialMode={activeTab === "projects" ? "presale" : "resale"} contextType="home" />
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
