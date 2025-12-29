import { useState, useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { MobileContextBar } from "./MobileContextBar";
import { MobileCategoryChips, CategoryChip } from "./MobileCategoryChips";
import { MobileDiscoveryCarousel } from "./MobileDiscoveryCarousel";
import { MobileBottomNav } from "./MobileBottomNav";
import { usePullToRefresh } from "@/hooks/usePullToRefresh";
import { PullToRefreshIndicator } from "@/components/ui/pull-to-refresh";
import { NewConstructionBenefits } from "@/components/home/NewConstructionBenefits";
import { RelatedContent } from "@/components/home/RelatedContent";
import { Footer } from "@/components/layout/Footer";
import { cn } from "@/lib/utils";

export function MobileHomePage() {
  const [selectedCity, setSelectedCity] = useState("all");
  const [selectedChip, setSelectedChip] = useState<string | undefined>(undefined);
  const [activeFilter, setActiveFilter] = useState<CategoryChip["filter"]>({});
  const queryClient = useQueryClient();

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

      {/* Top Context Bar */}
      <MobileContextBar
        selectedCity={selectedCity}
        onCityChange={handleCityChange}
        alertCount={0}
      />

      {/* Category Chips - Sticky below header */}
      <div className="sticky top-12 z-30 bg-background">
        <MobileCategoryChips
          selectedChip={selectedChip}
          onChipSelect={handleChipSelect}
        />
      </div>

      {/* Mobile Hero - Brief welcome message */}
      <div 
        className="px-4 pt-4 pb-2"
        style={{ 
          transform: pullDistance > 0 ? `translateY(${pullDistance}px)` : undefined,
          transition: pullDistance === 0 ? 'transform 0.3s ease-out' : undefined
        }}
      >
        <h1 className="text-lg font-bold text-foreground">
          New Presale Condos & Townhomes
        </h1>
        <p className="text-sm text-muted-foreground">
          Browse Metro Vancouver's latest developments
        </p>
      </div>

      {/* Discovery Sections */}
      <div 
        className="space-y-6 py-2"
        style={{ 
          transform: pullDistance > 0 ? `translateY(${pullDistance}px)` : undefined,
          transition: pullDistance === 0 ? 'transform 0.3s ease-out' : undefined
        }}
      >
        {/* Condos - Large Cards */}
        <CarouselSection delay={0}>
          <MobileDiscoveryCarousel
            type="condos"
            title="Presale Condos"
            city={selectedCity}
          />
        </CarouselSection>

        {/* Townhomes - Large Cards */}
        <CarouselSection delay={50}>
          <MobileDiscoveryCarousel
            type="townhomes"
            title="Presale Townhomes"
            city={selectedCity}
          />
        </CarouselSection>

        {/* Single-Family / Detached - Large Cards */}
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

      {/* Bottom Navigation */}
      <MobileBottomNav />
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
