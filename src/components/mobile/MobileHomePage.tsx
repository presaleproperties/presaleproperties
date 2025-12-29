import { useState, useCallback } from "react";
import { MobileContextBar } from "./MobileContextBar";
import { MobileCategoryChips, CategoryChip } from "./MobileCategoryChips";
import { MobileDiscoveryCarousel } from "./MobileDiscoveryCarousel";
import { MobileBottomNav } from "./MobileBottomNav";

export function MobileHomePage() {
  const [selectedCity, setSelectedCity] = useState("all");
  const [selectedChip, setSelectedChip] = useState<string | undefined>(undefined);
  const [activeFilter, setActiveFilter] = useState<CategoryChip["filter"]>({});

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
    <div className="min-h-screen bg-background md:hidden">
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
      <div className="space-y-6 py-4 pb-28">
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
