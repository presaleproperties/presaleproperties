import { useState, useEffect, lazy, Suspense, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { Map, MapPin, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ListingModeToggle } from "@/components/ui/ListingModeToggle";
import { supabase } from "@/integrations/supabase/client";
import { SafeMapWrapper } from "@/components/map/SafeMapWrapper";
import { useEnabledCities } from "@/hooks/useEnabledCities";

// Lazy load the map component
const ResaleListingsMap = lazy(() => 
  import("@/components/map/ResaleListingsMap").then(m => ({ default: m.ResaleListingsMap }))
);

interface ResaleMapSectionProps {
  /** Optional city to filter listings */
  cityContext?: string;
}

export function ResaleMapSection({ cityContext }: ResaleMapSectionProps = {}) {
  const [isVisible, setIsVisible] = useState(false);
  const [shouldLoad, setShouldLoad] = useState(false);
  const sectionRef = useRef<HTMLElement>(null);

  // Get enabled cities from admin settings
  const { data: enabledCities } = useEnabledCities();

  // Optimized Intersection Observer with larger root margin
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsVisible(true);
            setShouldLoad(true);
            observer.disconnect();
          }
        });
      },
      { 
        rootMargin: "400px", // Preload earlier
        threshold: 0.01 
      }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => observer.disconnect();
  }, []);

  // Metro Vancouver cities fallback
  const metroVancouverCities = [
    "Vancouver", "Surrey", "Burnaby", "Richmond", "Langley",
    "Coquitlam", "Delta", "Abbotsford", "New Westminster",
    "Port Coquitlam", "Port Moody", "Maple Ridge", "White Rock",
    "North Vancouver", "West Vancouver", "Chilliwack", "Mission",
    "Pitt Meadows", "Tsawwassen", "Ladner"
  ];

  // Optimized query with parallel fetching for better performance
  const { data: listings, isLoading } = useQuery({
    queryKey: ["resale-map-section-listings-2024", enabledCities, cityContext],
    queryFn: async () => {
      const citiesToUse = cityContext 
        ? [cityContext]
        : (enabledCities && enabledCities.length > 0 ? enabledCities : metroVancouverCities);
      
      const pageSize = 1000;
      const maxRows = 2000;
      
      // Fetch first page
      const { data: firstPage, error: firstError } = await supabase
        .from("mls_listings")
        .select("id, listing_key, listing_price, list_date, city, neighborhood, street_number, street_name, property_type, property_sub_type, bedrooms_total, bathrooms_total, living_area, latitude, longitude, photos, year_built, list_agent_name, list_office_name")
        .eq("mls_status", "Active")
        .not("latitude", "is", null)
        .not("longitude", "is", null)
        .in("city", citiesToUse)
        .gte("year_built", 2024)
        .gte("latitude", 48.9)
        .lte("latitude", 49.6)
        .gte("longitude", -123.35)
        .lte("longitude", -121.7)
        .order("list_date", { ascending: false, nullsFirst: false })
        .limit(pageSize);

      if (firstError) throw firstError;
      const firstChunk = firstPage || [];
      
      // If first page is full, fetch second page in parallel
      if (firstChunk.length === pageSize) {
        const { data: secondPage } = await supabase
          .from("mls_listings")
          .select("id, listing_key, listing_price, list_date, city, neighborhood, street_number, street_name, property_type, property_sub_type, bedrooms_total, bathrooms_total, living_area, latitude, longitude, photos, year_built, list_agent_name, list_office_name")
          .eq("mls_status", "Active")
          .not("latitude", "is", null)
          .not("longitude", "is", null)
          .in("city", citiesToUse)
          .gte("year_built", 2024)
          .gte("latitude", 48.9)
          .lte("latitude", 49.6)
          .gte("longitude", -123.35)
          .lte("longitude", -121.7)
          .order("list_date", { ascending: false, nullsFirst: false })
          .range(pageSize, maxRows - 1);
        
        return [...firstChunk, ...(secondPage || [])];
      }
      
      return firstChunk;
    },
    enabled: shouldLoad,
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes - prevents refetch on back navigation
    gcTime: 15 * 60 * 1000, // Keep in cache for 15 minutes
    refetchOnWindowFocus: false, // Don't refetch when returning to page
  });

  const validListings = listings?.filter(l => l.latitude && l.longitude) || [];
  const hasValidListings = validListings.length > 0;

  const LoadingPlaceholder = () => (
    <div className="h-[400px] lg:h-[500px] rounded-xl bg-muted animate-pulse flex items-center justify-center">
      <div className="text-center text-muted-foreground">
        <Map className="h-12 w-12 mx-auto mb-2 animate-pulse" />
        <p>Loading map...</p>
      </div>
    </div>
  );

  return (
    <section 
      ref={sectionRef}
      className="py-12 md:py-16 lg:py-20 bg-muted/30"
    >
      <div className="container px-4">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-6 md:mb-8">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <MapPin className="h-5 w-5 text-primary" />
              <span className="text-sm font-medium text-primary uppercase tracking-wider">
                Interactive Map
              </span>
            </div>
            <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-foreground">
              {cityContext ? `${cityContext} Move-In Ready Homes` : "Explore Move-In Ready Homes"}
            </h2>
            <p className="text-muted-foreground mt-2 text-sm md:text-base max-w-xl">
              Find new built condos, townhomes & houses{cityContext ? ` in ${cityContext}` : ""}. Click any pin for details.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <ListingModeToggle size="sm" />
            <Link to={`/map-search?mode=resale${cityContext ? `&city=${encodeURIComponent(cityContext)}` : ""}`}>
              <Button variant="outline" className="gap-2">
                <Map className="h-4 w-4" />
                Full Map
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>

        {/* Map Container */}
        {!isVisible ? (
          <LoadingPlaceholder />
        ) : !shouldLoad || isLoading ? (
          <LoadingPlaceholder />
        ) : !hasValidListings ? (
          <div className="h-[400px] lg:h-[500px] rounded-xl bg-muted flex items-center justify-center border border-border">
            <div className="text-center text-muted-foreground p-6">
              <Map className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <h3 className="font-semibold text-foreground mb-2">Listings Loading</h3>
              <p className="text-sm mb-4">
                Map data is being prepared. Use our search to browse listings.
              </p>
              <Link to="/properties">
                <Button variant="default" size="sm">
                  Browse All Listings
                </Button>
              </Link>
            </div>
          </div>
        ) : (
          <SafeMapWrapper height="h-[400px] lg:h-[500px]">
            <Suspense fallback={<LoadingPlaceholder />}>
              <div className="h-[400px] lg:h-[500px] rounded-xl overflow-hidden border border-border">
                <ResaleListingsMap 
                  listings={validListings as any}
                />
              </div>
            </Suspense>
          </SafeMapWrapper>
        )}
      </div>
    </section>
  );
}
