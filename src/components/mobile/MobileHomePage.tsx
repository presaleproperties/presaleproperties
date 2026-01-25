import { useState, useCallback, useRef, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { Search, MapPin, Navigation, Map, Building2 } from "lucide-react";
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
const TOP_CITIES = [{
  name: "Vancouver",
  slug: "vancouver"
}, {
  name: "Surrey",
  slug: "surrey"
}, {
  name: "Burnaby",
  slug: "burnaby"
}, {
  name: "Langley",
  slug: "langley"
}, {
  name: "Coquitlam",
  slug: "coquitlam"
}, {
  name: "Richmond",
  slug: "richmond"
}];
interface MobileHomePageProps {
  activeTab?: SearchTab;
  onTabChange?: (tab: SearchTab) => void;
}
export function MobileHomePage({
  activeTab: controlledTab,
  onTabChange
}: MobileHomePageProps) {
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
  const [showLocationOption, setShowLocationOption] = useState(false);
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const searchContainerRef = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
        setShowLocationOption(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setShowSuggestions(false);
    setShowLocationOption(false);
    const basePath = activeTab === "projects" ? "/presale-projects" : "/resale";
    if (searchQuery.trim()) {
      navigate(`${basePath}?q=${encodeURIComponent(searchQuery)}`);
    } else {
      navigate(basePath);
    }
  };
  const handleSearchFocus = () => {
    setIsSearchFocused(true);
    if (!searchQuery.trim()) {
      setShowLocationOption(true);
      setShowSuggestions(false);
    } else {
      setShowSuggestions(true);
      setShowLocationOption(false);
    }
  };
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchQuery(value);
    if (value.trim()) {
      setShowSuggestions(true);
      setShowLocationOption(false);
    } else {
      setShowSuggestions(false);
      setShowLocationOption(true);
    }
  };
  const handleUseLocation = () => {
    setShowLocationOption(false);
    // Navigate to map page - it will auto-locate the user
    navigate("/map-search");
  };
  const handleSuggestionSelect = (value: string, type: SuggestionType, slug?: string) => {
    setSearchQuery(value);
    setShowSuggestions(false);
    setShowLocationOption(false);
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
      navigate(`/${slug}-presale-condos`);
    } else {
      navigate(`/resale/${slug}`);
    }
  };
  const handleRefresh = useCallback(async () => {
    await queryClient.invalidateQueries({
      queryKey: ["mobile-discovery"]
    });
  }, [queryClient]);
  const {
    pullDistance,
    isRefreshing,
    containerRef
  } = usePullToRefresh({
    onRefresh: handleRefresh,
    threshold: 80,
    maxPull: 120
  });
  const handleCityChange = useCallback((city: string) => {
    setSelectedCity(city);
    if (typeof window !== "undefined" && (window as any).gtag) {
      (window as any).gtag("event", "location_changed", {
        city: city
      });
    }
  }, []);
  return <div ref={containerRef} className="min-h-screen bg-background lg:hidden">
      {/* Pull to Refresh Indicator */}
      <PullToRefreshIndicator pullDistance={pullDistance} isRefreshing={isRefreshing} />

      {/* Full-Screen Hero Section - Brand Luxe Style */}
      <div className="relative min-h-[75vh] flex flex-col" style={{
      transform: pullDistance > 0 ? `translateY(${pullDistance}px)` : undefined,
      transition: pullDistance === 0 ? 'transform 0.3s ease-out' : undefined
    }}>
        {/* Background Image */}
        <div className="absolute inset-0">
          <img src={heroImage} alt="Modern home interior" className="w-full h-full object-cover" />
          {/* Gradient overlay - warmer, more luxe feel */}
          <div className="absolute inset-0 bg-gradient-to-b from-foreground/50 via-foreground/40 to-foreground/70" />
        </div>

        {/* Hero Content */}
        <div className="relative flex-1 flex flex-col justify-center items-center px-6 pt-20 pb-8">
          {/* Main Headline - Simple & Bold */}
          <h1 className="text-3xl sm:text-4xl font-black text-white leading-tight text-center mb-8 tracking-tight">
            Find Your New Home
          </h1>
          
          {/* Search Container */}
          <div ref={searchContainerRef} className="w-full max-w-md relative">
            {/* Search Input - Brand styled */}
            <form onSubmit={handleSearch} className="relative">
              <Input type="text" placeholder={activeTab === "projects" ? "Search projects, developers..." : "City, neighbourhood, address..."} value={searchQuery} onChange={handleSearchChange} onFocus={handleSearchFocus} onBlur={() => setIsSearchFocused(false)} className="h-14 text-base pl-4 pr-14 rounded-xl bg-card border border-border/20 shadow-xl focus:ring-2 focus:ring-primary/50 transition-all placeholder:text-muted-foreground" autoComplete="off" />
              <button type="submit" className="absolute right-2 top-1/2 -translate-y-1/2 h-10 w-10 flex items-center justify-center rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-all shadow-md">
                <Search className="h-5 w-5" />
              </button>
            </form>
            
            {/* Location Dropdown - Shows when search is focused and empty */}
            {showLocationOption && <div className="absolute left-0 right-0 mt-2 bg-card rounded-xl shadow-xl border border-border/50 overflow-hidden z-50">
                <button onClick={handleUseLocation} className="w-full flex items-center gap-3 px-4 py-4 hover:bg-muted/50 transition-colors text-left">
                  <div className="w-10 h-10 rounded-full bg-primary/15 flex items-center justify-center">
                    <Navigation className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <span className="font-medium text-foreground">Use my location</span>
                    <p className="text-sm text-muted-foreground">Find homes near you</p>
                  </div>
                </button>
              </div>}
            
            <SearchSuggestions query={searchQuery} onSelect={handleSuggestionSelect} isVisible={showSuggestions} onClose={() => setShowSuggestions(false)} searchMode={activeTab} />
          </div>

          {/* Mode Toggle Pills - Brand Gold Accent */}
          <div className="flex items-center gap-2 mt-6">
            <button onClick={() => handleTabChange("projects")} className={`px-5 py-2.5 rounded-full text-sm font-semibold transition-all ${activeTab === "projects" ? "bg-primary text-primary-foreground shadow-lg" : "bg-white/15 text-white backdrop-blur-sm border border-white/20"}`}>
              Presale
            </button>
            <button onClick={() => handleTabChange("resale")} className={`px-5 py-2.5 rounded-full text-sm font-semibold transition-all ${activeTab === "resale" ? "bg-primary text-primary-foreground shadow-lg" : "bg-white/15 text-white backdrop-blur-sm border border-white/20"}`}>
              Move-In Ready
            </button>
          </div>
        </div>
      </div>

      {/* Top Cities - Liquid Glass Style with Brand Accents - Edge to edge scrolling */}
      <div className="py-6 bg-background">
        <div className="flex items-center gap-2.5 overflow-x-auto scrollbar-hide pb-1 px-4">
          <span className="text-sm font-medium text-foreground whitespace-nowrap flex-shrink-0">
            Top Cities
          </span>
          {TOP_CITIES.map(city => <button key={city.slug} onClick={() => handleCityClick(city.slug)} className="px-4 py-2.5 rounded-full text-sm font-medium whitespace-nowrap bg-card backdrop-blur-md border border-border shadow-sm hover:border-primary hover:bg-primary hover:text-primary-foreground transition-all active:scale-95 flex-shrink-0">
              {city.name}
            </button>)}
        </div>
      </div>

      {/* Discovery Sections - Switch based on active tab */}
      <div className="pb-6">
        {activeTab === "projects" ? <>
            {/* Hot Projects - Featured Section */}
            <CarouselSection delay={0}>
              <MobileDiscoveryCarousel type="hot_projects" title="Most Popular Projects" subtitle="The most in-demand presale projects" city={selectedCity} />
            </CarouselSection>

            <div className="my-6 border-t border-border/50" />

            {/* Condos */}
            <CarouselSection delay={50}>
              <MobileDiscoveryCarousel type="condos" title="Presale Condos" city={selectedCity} />
            </CarouselSection>

            <div className="my-6 border-t border-border/50" />

            {/* Townhomes */}
            <CarouselSection delay={50}>
              <MobileDiscoveryCarousel type="townhomes" title="Presale Townhomes" city={selectedCity} />
            </CarouselSection>

            <div className="my-6 border-t border-border/50" />

            {/* Single-Family / Detached */}
            <CarouselSection delay={100}>
              <MobileDiscoveryCarousel type="single_family" title="Detached Homes" city={selectedCity} />
            </CarouselSection>

            <div className="my-6 border-t border-border/50" />

            {/* Projects Near You - City Quick Links */}
            <CarouselSection delay={125}>
              <MobileCityQuickLinks />
            </CarouselSection>
          </> : <>
            {/* Resale Mode - Show MLS listings */}
            <CarouselSection delay={0}>
              <MobileResaleCarousel title="Featured Listings" subtitle="New construction resale homes" />
            </CarouselSection>

            <div className="my-6 border-t border-border/50" />

            {/* City Quick Links for Resale */}
            <CarouselSection delay={50}>
              <MobileCityQuickLinks mode="resale" />
            </CarouselSection>

            <div className="my-6 border-t border-border/50" />

            {/* Resale City Carousels */}
            <CarouselSection delay={100}>
              <MobileResaleCityCarousel city="Vancouver" />
            </CarouselSection>

            <div className="my-6 border-t border-border/50" />

            <CarouselSection delay={150}>
              <MobileResaleCityCarousel city="Surrey" />
            </CarouselSection>

            <div className="my-6 border-t border-border/50" />

            <CarouselSection delay={200}>
              <MobileResaleCityCarousel city="Burnaby" />
            </CarouselSection>

            <div className="my-6 border-t border-border/50" />

            <CarouselSection delay={250}>
              <MobileResaleCityCarousel city="Langley" />
            </CarouselSection>

            <div className="my-6 border-t border-border/50" />

            <CarouselSection delay={300}>
              <MobileResaleCityCarousel city="Coquitlam" />
            </CarouselSection>

            <div className="my-6 border-t border-border/50" />

            <CarouselSection delay={350}>
              <MobileResaleCityCarousel city="Richmond" />
            </CarouselSection>

            <div className="my-6 border-t border-border/50" />

            <CarouselSection delay={400}>
              <MobileResaleCityCarousel city="Delta" />
            </CarouselSection>

            <div className="my-6 border-t border-border/50" />

            <CarouselSection delay={450}>
              <MobileResaleCityCarousel city="Abbotsford" />
            </CarouselSection>
          </>}

        {/* City-based Carousels - Only show for Presale tab */}
        {activeTab === "projects" && <>
            <CarouselSection delay={150}>
              <MobileDiscoveryCarousel type="city_vancouver" title="Vancouver" city={selectedCity} />
            </CarouselSection>

            <CarouselSection delay={200}>
              <MobileDiscoveryCarousel type="city_surrey" title="Surrey" city={selectedCity} />
            </CarouselSection>

            <CarouselSection delay={250}>
              <MobileDiscoveryCarousel type="city_burnaby" title="Burnaby" city={selectedCity} />
            </CarouselSection>

            <CarouselSection delay={300}>
              <MobileDiscoveryCarousel type="city_coquitlam" title="Coquitlam" city={selectedCity} />
            </CarouselSection>

            <CarouselSection delay={350}>
              <MobileDiscoveryCarousel type="city_langley" title="Langley" city={selectedCity} />
            </CarouselSection>

            <CarouselSection delay={400}>
              <MobileDiscoveryCarousel type="city_richmond" title="Richmond" city={selectedCity} />
            </CarouselSection>

            <CarouselSection delay={450}>
              <MobileDiscoveryCarousel type="city_delta" title="Delta" city={selectedCity} />
            </CarouselSection>

            <CarouselSection delay={500}>
              <MobileDiscoveryCarousel type="city_abbotsford" title="Abbotsford" city={selectedCity} />
            </CarouselSection>
          </>}
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

    </div>;
}

// Carousel section wrapper - no animation to prevent blinking on navigation
function CarouselSection({
  children
}: {
  children: React.ReactNode;
  delay?: number;
}) {
  return <div>
      {children}
    </div>;
}