import { useState, useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { MobileContextBar } from "./MobileContextBar";
import { MobileCategoryChips, CategoryChip } from "./MobileCategoryChips";
import { MobileDiscoveryCarousel } from "./MobileDiscoveryCarousel";

import { usePullToRefresh } from "@/hooks/usePullToRefresh";
import { PullToRefreshIndicator } from "@/components/ui/pull-to-refresh";
import { NewConstructionBenefits } from "@/components/home/NewConstructionBenefits";
import { RelatedContent } from "@/components/home/RelatedContent";
import { Footer } from "@/components/layout/Footer";

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

      {/* Category Chips - Functional Navigation */}
      <MobileCategoryChips
        selectedChip={selectedChip}
        onChipSelect={handleChipSelect}
      />

      {/* Discovery Sections */}
      <div 
        className="space-y-6 py-4"
        style={{ 
          transform: pullDistance > 0 ? `translateY(${pullDistance}px)` : undefined,
          transition: pullDistance === 0 ? 'transform 0.3s ease-out' : undefined
        }}
      >
        {/* Condos - Large Cards */}
        <MobileDiscoveryCarousel
          type="condos"
          title="Presale Condos"
          city={selectedCity}
        />

        {/* Townhomes - Large Cards */}
        <MobileDiscoveryCarousel
          type="townhomes"
          title="Presale Townhomes"
          city={selectedCity}
        />

        {/* Single-Family / Detached - Large Cards */}
        <MobileDiscoveryCarousel
          type="single_family"
          title="Detached Homes"
          city={selectedCity}
        />

        {/* City-based Carousels */}
        <MobileDiscoveryCarousel
          type="city_vancouver"
          title="Vancouver"
          city={selectedCity}
        />

        <MobileDiscoveryCarousel
          type="city_surrey"
          title="Surrey"
          city={selectedCity}
        />

        <MobileDiscoveryCarousel
          type="city_burnaby"
          title="Burnaby"
          city={selectedCity}
        />

        <MobileDiscoveryCarousel
          type="city_coquitlam"
          title="Coquitlam"
          city={selectedCity}
        />

        <MobileDiscoveryCarousel
          type="city_langley"
          title="Langley"
          city={selectedCity}
        />

        <MobileDiscoveryCarousel
          type="city_richmond"
          title="Richmond"
          city={selectedCity}
        />

        <MobileDiscoveryCarousel
          type="city_delta"
          title="Delta"
          city={selectedCity}
        />

        <MobileDiscoveryCarousel
          type="city_abbotsford"
          title="Abbotsford"
          city={selectedCity}
        />
      </div>

      {/* Benefits Section - Mobile optimized */}
      <div className="mt-4">
        <NewConstructionBenefits />
      </div>

      {/* Quick Links Section */}
      <RelatedContent />

      {/* Footer */}
      <Footer />
    </div>
  );
}
