import { useState, useCallback } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { Map, Building2, Home, Calendar, Castle, MapPin, DollarSign, BedDouble } from "lucide-react";
import { MobileDiscoveryCarousel } from "./MobileDiscoveryCarousel";
import { MobileResaleCarousel } from "./MobileResaleCarousel";
import { MobileResaleCityCarousel } from "./MobileResaleCityCarousel";
import { MobileCityQuickLinks } from "./MobileCityQuickLinks";
import { usePullToRefresh } from "@/hooks/usePullToRefresh";
import { PullToRefreshIndicator } from "@/components/ui/pull-to-refresh";
import { PresaleExpertsSection } from "@/components/home/PresaleExpertsSection";
import { RelatedContent } from "@/components/home/RelatedContent";
import { ROICalculatorTeaser } from "@/components/home/ROICalculatorTeaser";
import { HomeUnifiedMapSection } from "@/components/map/HomeUnifiedMapSection";
import { Footer } from "@/components/layout/Footer";
import { PowerSearch } from "@/components/search/PowerSearch";
import heroImage from "@/assets/hero-lifestyle.jpg";
import { SearchTab } from "@/components/home/HeroSection";


const TOP_CITIES = [
{ name: "Vancouver", slug: "vancouver" },
{ name: "Surrey", slug: "surrey" },
{ name: "Burnaby", slug: "burnaby" },
{ name: "Langley", slug: "langley" },
{ name: "Coquitlam", slug: "coquitlam" },
{ name: "Richmond", slug: "richmond" }];


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
  const queryClient = useQueryClient();
  const navigate = useNavigate();


  const handleCityClick = (slug: string) => {
    if (activeTab === "projects") {
      navigate(`/${slug}-presale-condos`);
    } else {
      navigate(`/properties/${slug}`);
    }
  };

  const handleRefresh = useCallback(async () => {
    await queryClient.invalidateQueries({ queryKey: ["mobile-discovery"] });
  }, [queryClient]);

  const { pullDistance, isRefreshing, containerRef } = usePullToRefresh({
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

  return (
    <div
      ref={containerRef}
      className="min-h-screen bg-background lg:hidden">

      {/* Pull to Refresh Indicator */}
      <PullToRefreshIndicator
        pullDistance={pullDistance}
        isRefreshing={isRefreshing} />



      {/* Full-Screen Hero Section - Brand Luxe Style */}
      <div
        className="relative min-h-[75vh] flex flex-col"
        style={{
          transform: pullDistance > 0 ? `translateY(${pullDistance}px)` : undefined,
          transition: pullDistance === 0 ? 'transform 0.3s ease-out' : undefined
        }}>

        {/* Background Image */}
        <div className="absolute inset-0">
          <img
            src={heroImage}
            alt="Modern home interior"
            className="w-full h-full object-cover" />

          {/* Gradient overlay - warmer, more luxe feel */}
          <div className="absolute inset-0 bg-gradient-to-b from-foreground/50 via-foreground/40 to-foreground/70" />
        </div>

        {/* Hero Content */}
        <div className="relative flex-1 flex flex-col justify-center items-center px-6 pt-20 pb-8">
          {/* Main Headline - Simple & Bold */}
          <h1 className="text-3xl sm:text-4xl font-black text-white leading-tight text-center mb-2 tracking-tight">
            Vancouver Presales
          </h1>
          <p className="text-lg sm:text-xl font-semibold text-primary text-center mb-8">
            Made Simple
          </p>
          
          {/* Search Container */}
          <div className="w-full max-w-md">
            <PowerSearch
              placeholder={activeTab === "projects" ?
              "Search projects, address, neighbourhood..." :
              "Address, MLS#, city, neighbourhood..."
              }
              mode={activeTab === "projects" ? "presale" : "resale"}
              variant="hero"
              inputClassName="h-14 text-base rounded-xl bg-card border border-border/20 shadow-xl focus:ring-2 focus:ring-primary/50 placeholder:text-muted-foreground" />

          </div>

          {/* Mode Toggle Pills - Brand Gold Accent */}
          <div className="flex items-center gap-2 mt-6">
            <button
              onClick={() => handleTabChange("projects")}
              className={`px-5 py-2.5 rounded-full text-sm font-semibold transition-all ${
              activeTab === "projects" ?
              "bg-primary text-primary-foreground shadow-lg" :
              "bg-white/15 text-white backdrop-blur-sm border border-white/20"}`
              }>

              Presale
            </button>
            <button
              onClick={() => handleTabChange("resale")}
              className={`px-5 py-2.5 rounded-full text-sm font-semibold transition-all ${
              activeTab === "resale" ?
              "bg-primary text-primary-foreground shadow-lg" :
              "bg-white/15 text-white backdrop-blur-sm border border-white/20"}`
              }>

              Move-In Ready
            </button>
          </div>
        </div>
      </div>

      {/* Stats bar */}
      <div className="grid grid-cols-4 bg-foreground divide-x divide-white/10">
        {[
          { value: "$200M+", label: "Sold" },
          { value: "400+", label: "Homes" },
          { value: "15+", label: "Yrs Exp" },
          { value: "5.0★", label: "Rating" },
        ].map((s, i) => (
          <div key={i} className="flex flex-col items-center py-3 px-1 gap-0.5">
            <span className="text-sm font-extrabold text-primary leading-none">{s.value}</span>
            <span className="text-[9px] text-white/45 uppercase tracking-wider">{s.label}</span>
          </div>
        ))}
      </div>

      {/* Quick Navigation — Cities only */}
      <div className="py-4 pb-5 bg-background border-b border-border/40">
        <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide px-4">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground whitespace-nowrap shrink-0 min-w-[52px]">
            Cities
          </span>
          {TOP_CITIES.map((city) => (
            <button
              key={city.slug}
              onClick={() => handleCityClick(city.slug)}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-medium whitespace-nowrap bg-card border border-border shadow-sm hover:border-primary/50 active:scale-95 transition-all shrink-0"
            >
              <MapPin className="h-3 w-3 text-muted-foreground" />
              {city.name}
            </button>
          ))}
        </div>
      </div>

      {/* Discovery Sections - Switch based on active tab */}
      <div className="pb-6">
        {activeTab === "projects" ?
        <>
            {/* Hot Projects - Featured Section */}
            <CarouselSection delay={0}>
              <MobileDiscoveryCarousel
              type="hot_projects"
              title="Most Popular Projects"
              subtitle="The most in-demand presale projects"
              city={selectedCity} />

            </CarouselSection>

            <div className="my-6 border-t border-border/50" />

            {/* Condos */}
            <CarouselSection delay={50}>
              <MobileDiscoveryCarousel
              type="condos"
              title="Presale Condos"
              city={selectedCity} />

            </CarouselSection>

            <div className="my-6 border-t border-border/50" />

            {/* Townhomes */}
            <CarouselSection delay={50}>
              <MobileDiscoveryCarousel
              type="townhomes"
              title="Presale Townhomes"
              city={selectedCity} />

            </CarouselSection>

            <div className="my-6 border-t border-border/50" />

            {/* Single-Family / Detached */}
            <CarouselSection delay={100}>
              <MobileDiscoveryCarousel
              type="single_family"
              title="Detached Homes"
              city={selectedCity} />

            </CarouselSection>

            <div className="my-6 border-t border-border/50" />

            {/* Projects Near You - City Quick Links */}
            <CarouselSection delay={125}>
              <MobileCityQuickLinks />
            </CarouselSection>
          </> :

        <>
            {/* Resale Mode - Show MLS listings */}
            <CarouselSection delay={0}>
              <MobileResaleCarousel
              title="Featured Listings"
              subtitle="New construction resale homes" />

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
          </>
        }

        {/* City-based Carousels - Only show for Presale tab */}
        {activeTab === "projects" &&
        <>
            <CarouselSection delay={150}>
              <MobileDiscoveryCarousel
              type="city_vancouver"
              title="Vancouver"
              city={selectedCity} />

            </CarouselSection>

            <CarouselSection delay={200}>
              <MobileDiscoveryCarousel
              type="city_surrey"
              title="Surrey"
              city={selectedCity} />

            </CarouselSection>

            <CarouselSection delay={250}>
              <MobileDiscoveryCarousel
              type="city_burnaby"
              title="Burnaby"
              city={selectedCity} />

            </CarouselSection>

            <CarouselSection delay={300}>
              <MobileDiscoveryCarousel
              type="city_coquitlam"
              title="Coquitlam"
              city={selectedCity} />

            </CarouselSection>

            <CarouselSection delay={350}>
              <MobileDiscoveryCarousel
              type="city_langley"
              title="Langley"
              city={selectedCity} />

            </CarouselSection>

            <CarouselSection delay={400}>
              <MobileDiscoveryCarousel
              type="city_richmond"
              title="Richmond"
              city={selectedCity} />

            </CarouselSection>

            <CarouselSection delay={450}>
              <MobileDiscoveryCarousel
              type="city_delta"
              title="Delta"
              city={selectedCity} />

            </CarouselSection>

            <CarouselSection delay={500}>
              <MobileDiscoveryCarousel
              type="city_abbotsford"
              title="Abbotsford"
              city={selectedCity} />

            </CarouselSection>
          </>
        }
      </div>

      {/* Benefits Section */}
      <div className="mt-6">
        <PresaleExpertsSection />
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

      {/* Floating Map Button - bottom right, above nav */}
      <button
        onClick={() => navigate(`/map-search?mode=${activeTab === "projects" ? "presale" : "resale"}`)}
        className="fixed right-4 z-40 lg:hidden h-14 w-14 rounded-full bg-primary text-primary-foreground shadow-xl shadow-primary/40 flex items-center justify-center hover:bg-primary/90 active:scale-90 transition-all animate-[pulse_3s_ease-in-out_infinite] ring-4 ring-primary/20"
        style={{ bottom: 'calc(env(safe-area-inset-bottom, 0px) + 76px)' }}
        aria-label="Map Search">
        <Map className="h-6 w-6" />
      </button>

    </div>);

}

// Carousel section wrapper - no animation to prevent blinking on navigation
function CarouselSection({ children }: {children: React.ReactNode;delay?: number;}) {
  return (
    <div>
      {children}
    </div>);

}
