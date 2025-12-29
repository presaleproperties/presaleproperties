import { useState, useCallback } from "react";
import { MobileContextBar } from "./MobileContextBar";
import { MobileCategoryChips, CategoryChip } from "./MobileCategoryChips";
import { MobileDiscoveryCarousel } from "./MobileDiscoveryCarousel";
import { MobileBottomNav } from "./MobileBottomNav";

export function MobileHomePage() {
  const [selectedCity, setSelectedCity] = useState("all");
  const [selectedChip, setSelectedChip] = useState("all");
  const [activeFilter, setActiveFilter] = useState<CategoryChip["filter"]>({});

  const handleCityChange = useCallback((city: string) => {
    setSelectedCity(city);
    
    // Track location change
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

      {/* Category Chips */}
      <MobileCategoryChips
        selectedChip={selectedChip}
        onChipSelect={handleChipSelect}
      />

      {/* Discovery Sections */}
      <div className="space-y-6 py-4 pb-20">
        <MobileDiscoveryCarousel
          type="selling_now"
          title="Selling Now"
          city={selectedCity}
        />

        <MobileDiscoveryCarousel
          type="newly_launched"
          title="Newly Launched"
          city={selectedCity}
        />

        <MobileDiscoveryCarousel
          type="best_entry_price"
          title="Best Entry Price"
          city={selectedCity}
        />

        <MobileDiscoveryCarousel
          type="completing_soon"
          title="Completing Soon"
          city={selectedCity}
        />

        <MobileDiscoveryCarousel
          type="investor_picks"
          title="Investor Picks"
          city={selectedCity}
        />

        <MobileDiscoveryCarousel
          type="near_skytrain"
          title="Near SkyTrain"
          city={selectedCity}
        />
      </div>

      {/* Bottom Navigation */}
      <MobileBottomNav />
    </div>
  );
}
