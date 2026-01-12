import { useRef, useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { ChevronLeft, ChevronRight, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { ResaleListingCard } from "@/components/listings/ResaleListingCard";

interface ResalePropertyTypeCarouselProps {
  propertyType: "condo" | "townhouse" | "house";
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
  photos: any;
  days_on_market: number | null;
  mls_status: string;
  year_built: number | null;
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

// Property type filter mapping - matches inferred types from sync
const PROPERTY_TYPE_FILTERS = {
  condo: ["Apartment/Condo", "Condo", "Apartment"],
  townhouse: ["Townhouse", "Row/Townhouse", "Townhome", "Duplex"],
  house: ["Single Family", "House", "Detached", "Single Family Residential"],
};

export function ResalePropertyTypeCarousel({ propertyType, title, subtitle }: ResalePropertyTypeCarouselProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const metroVancouverCities = [
    "Vancouver", "Surrey", "Burnaby", "Richmond", "Langley",
    "Coquitlam", "Delta", "Abbotsford", "New Westminster",
    "Port Coquitlam", "Port Moody", "Maple Ridge", "White Rock",
    "North Vancouver", "West Vancouver", "Chilliwack", "Mission",
    "Pitt Meadows", "Tsawwassen", "Ladner"
  ];

  const { data: listings, isLoading } = useQuery({
    queryKey: ["resale-property-type-carousel", propertyType],
    queryFn: async () => {
      const typeFilters = PROPERTY_TYPE_FILTERS[propertyType];
      
      // Build OR filter for property types
      const orFilter = typeFilters
        .map(t => `property_type.ilike.%${t}%,property_sub_type.ilike.%${t}%`)
        .join(",");

      const { data, error } = await supabase
        .from("mls_listings")
        .select("id, listing_key, listing_price, city, neighborhood, unparsed_address, street_number, street_name, property_type, property_sub_type, bedrooms_total, bathrooms_total, living_area, photos, days_on_market, mls_status, year_built, list_agent_name, list_office_name, virtual_tour_url")
        .eq("mls_status", "Active")
        .in("city", metroVancouverCities)
        .gte("year_built", 2024)
        .or(orFilter)
        .order("created_at", { ascending: false })
        .limit(12);

      if (error) throw error;
      return data as MLSListing[];
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });

  const checkScroll = () => {
    const container = scrollContainerRef.current;
    if (container) {
      setCanScrollLeft(container.scrollLeft > 0);
      setCanScrollRight(
        container.scrollLeft < container.scrollWidth - container.clientWidth - 10
      );
    }
  };

  useEffect(() => {
    const container = scrollContainerRef.current;
    if (container) {
      container.addEventListener("scroll", checkScroll);
      checkScroll();
      return () => container.removeEventListener("scroll", checkScroll);
    }
  }, [listings]);

  const scroll = (direction: "left" | "right") => {
    const container = scrollContainerRef.current;
    if (container) {
      const scrollAmount = 320;
      container.scrollBy({
        left: direction === "left" ? -scrollAmount : scrollAmount,
        behavior: "smooth",
      });
    }
  };

  // Get the URL filter param for this property type
  const getTypeParam = () => {
    switch (propertyType) {
      case "condo": return "Apartment/Condo";
      case "townhouse": return "Townhouse";
      case "house": return "House";
      default: return "";
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <Skeleton className="h-6 w-48 mb-1" />
            {subtitle && <Skeleton className="h-4 w-32" />}
          </div>
        </div>
        <div className="flex gap-4 overflow-hidden">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="flex-shrink-0 w-[280px]">
              <Skeleton className="aspect-[16/11] rounded-lg mb-3" />
              <Skeleton className="h-5 w-3/4 mb-2" />
              <Skeleton className="h-4 w-1/2" />
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
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg sm:text-xl font-semibold text-foreground">{title}</h3>
          {subtitle && (
            <p className="text-sm text-muted-foreground">{subtitle}</p>
          )}
        </div>
        <div className="flex items-center gap-2">
          {/* Desktop Nav Arrows */}
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
          <Link
            to={`/resale?type=${encodeURIComponent(getTypeParam())}`}
            className="text-sm font-medium text-primary hover:underline flex items-center gap-1"
          >
            View All
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>

      {/* Carousel */}
      <div
        ref={scrollContainerRef}
        className="-mx-4 px-4 overflow-x-auto scrollbar-hide scroll-smooth"
        style={{ scrollSnapType: "x mandatory", scrollPaddingLeft: "16px" }}
      >
        <div className="flex gap-3 md:gap-4 pb-2">
          {listings.map((listing, index) => (
            <div
              key={listing.id}
              className="flex-shrink-0 w-[280px] sm:w-[300px] md:w-[320px]"
              style={{ scrollSnapAlign: "start" }}
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
                photos={Array.isArray(listing.photos) ? listing.photos : []}
                daysOnMarket={listing.days_on_market}
                status={listing.mls_status}
                listAgentName={listing.list_agent_name}
                listOfficeName={listing.list_office_name}
                virtualTourUrl={listing.virtual_tour_url}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Mobile View All */}
      <div className="md:hidden">
        <Link to={`/resale?type=${encodeURIComponent(getTypeParam())}`}>
          <Button variant="outline" size="sm" className="w-full">
            View All {title}
          </Button>
        </Link>
      </div>
    </div>
  );
}
