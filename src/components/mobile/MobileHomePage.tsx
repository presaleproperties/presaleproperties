import { useState, useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { MobileContextBar } from "./MobileContextBar";
import { MobileCategoryChips, CategoryChip } from "./MobileCategoryChips";
import { MobileDiscoveryCarousel } from "./MobileDiscoveryCarousel";
import { MobileBottomNav } from "./MobileBottomNav";
import { usePullToRefresh } from "@/hooks/usePullToRefresh";
import { PullToRefreshIndicator } from "@/components/ui/pull-to-refresh";

export function MobileHomePage() {
  const [selectedCity, setSelectedCity] = useState("all");
  const [selectedChip, setSelectedChip] = useState<string | undefined>(undefined);
  const [activeFilter, setActiveFilter] = useState<CategoryChip["filter"]>({});
  const queryClient = useQueryClient();

  const handleRefresh = useCallback(async () => {
    // Invalidate all mobile discovery queries to refetch fresh data
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
        className="space-y-6 py-4 pb-28"
        style={{ 
          transform: pullDistance > 0 ? `translateY(${pullDistance}px)` : undefined,
          transition: pullDistance === 0 ? 'transform 0.3s ease-out' : undefined
        }}
      >
        {/* Hot Presale Projects - Large Cards */}
        <MobileDiscoveryCarousel
          type="hot_projects"
          title="Hot Presale Projects"
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
      </div>

      {/* Bottom Navigation */}
      <MobileBottomNav />
    </div>
  );
}
