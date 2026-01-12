import { useRef, useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { ChevronLeft, ChevronRight, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ResaleListingCard } from "@/components/listings/ResaleListingCard";
import { supabase } from "@/integrations/supabase/client";

interface ResaleCityCarouselProps {
  city: string;
  title: string;
  subtitle?: string;
}

type MLSListing = {
  id: string;
  listing_key: string;
  listing_price: number;
  city: string;
  neighborhood: string | null;
  unparsed_address: string | null;
  street_number: string | null;
  street_name: string | null;
  property_type: string;
  property_sub_type: string | null;
  bedrooms_total: number | null;
  bathrooms_total: number | null;
  living_area: number | null;
  photos: any | null;
  days_on_market: number | null;
  mls_status: string;
  list_agent_name: string | null;
  list_office_name: string | null;
  virtual_tour_url: string | null;
};

function getAddress(listing: MLSListing): string {
  if (listing.unparsed_address) return listing.unparsed_address;
  if (listing.street_number && listing.street_name) {
    return `${listing.street_number} ${listing.street_name}`;
  }
  return listing.city;
}

export function ResaleCityCarousel({ city, title, subtitle }: ResaleCityCarouselProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  // Optimized query with caching for city carousels - 2025+ builds, newest first
  const { data: listings, isLoading } = useQuery({
    queryKey: ["resale-city-carousel-2025", city],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("mls_listings")
        .select("id, listing_key, listing_price, city, neighborhood, unparsed_address, street_number, street_name, property_type, property_sub_type, bedrooms_total, bathrooms_total, living_area, photos, days_on_market, mls_status, list_agent_name, list_office_name, virtual_tour_url, year_built, created_at")
        .eq("mls_status", "Active")
        .ilike("city", city)
        .gte("year_built", 2024)
        .order("created_at", { ascending: false }) // Newest listings first
        .limit(12);

      if (error) throw error;
      return data as MLSListing[];
    },
    staleTime: 3 * 60 * 1000, // Cache for 3 minutes
    gcTime: 10 * 60 * 1000, // Keep in cache for 10 minutes
  });

  const checkScroll = () => {
    if (!scrollRef.current) return;
    const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
    setCanScrollLeft(scrollLeft > 10);
    setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10);
  };

  useEffect(() => {
    const scrollEl = scrollRef.current;
    if (scrollEl) {
      scrollEl.addEventListener("scroll", checkScroll);
      checkScroll();
      return () => scrollEl.removeEventListener("scroll", checkScroll);
    }
  }, [listings]);

  const scroll = (direction: "left" | "right") => {
    if (!scrollRef.current) return;
    const scrollAmount = scrollRef.current.clientWidth * 0.8;
    scrollRef.current.scrollBy({
      left: direction === "left" ? -scrollAmount : scrollAmount,
      behavior: "smooth",
    });
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex justify-between items-end">
          <div>
            <Skeleton className="h-6 w-48 mb-2" />
            <Skeleton className="h-4 w-32" />
          </div>
        </div>
        <div className="flex gap-4 overflow-hidden">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="w-[280px] flex-shrink-0">
              <Skeleton className="h-48 w-full rounded-xl" />
              <div className="p-4 space-y-2">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!listings || listings.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex justify-between items-end">
        <div>
          <h3 className="text-xl md:text-2xl font-bold text-foreground">{title}</h3>
          {subtitle && (
            <p className="text-sm text-muted-foreground mt-0.5">{subtitle}</p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Link 
            to={`/resale/${city.toLowerCase()}`}
            className="hidden sm:flex items-center gap-1 text-sm font-medium text-primary hover:text-primary/80 transition-colors"
          >
            View All
            <ArrowRight className="h-4 w-4" />
          </Link>
          {/* Desktop scroll buttons */}
          <div className="hidden md:flex items-center gap-1">
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8 rounded-full"
              onClick={() => scroll("left")}
              disabled={!canScrollLeft}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8 rounded-full"
              onClick={() => scroll("right")}
              disabled={!canScrollRight}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Carousel */}
      <div
        ref={scrollRef}
        className="flex gap-3 overflow-x-auto scroll-smooth snap-x snap-mandatory pb-2 -mx-4 px-4 scrollbar-hide"
        style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
      >
        {listings.map((listing) => (
          <div
            key={listing.id}
            className="w-[280px] sm:w-[300px] flex-shrink-0 snap-start"
          >
            <ResaleListingCard
              id={listing.id}
              listingKey={listing.listing_key}
              price={listing.listing_price}
              address={getAddress(listing)}
              city={listing.city}
              neighborhood={listing.neighborhood}
              propertyType={listing.property_type}
              propertySubType={listing.property_sub_type}
              beds={listing.bedrooms_total}
              baths={listing.bathrooms_total}
              sqft={listing.living_area}
              photos={listing.photos}
              daysOnMarket={listing.days_on_market}
              status={listing.mls_status}
              listAgentName={listing.list_agent_name}
              listOfficeName={listing.list_office_name}
              virtualTourUrl={listing.virtual_tour_url}
            />
          </div>
        ))}
      </div>

      {/* Mobile View All */}
      <div className="sm:hidden">
        <Link to={`/resale/${city.toLowerCase()}`}>
          <Button variant="outline" className="w-full">
            View All {city} Listings
          </Button>
        </Link>
      </div>
    </div>
  );
}
