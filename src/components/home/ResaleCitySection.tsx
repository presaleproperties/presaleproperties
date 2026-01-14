import { useRef, useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { ChevronLeft, ChevronRight, ArrowRight, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { ResaleListingCard } from "@/components/listings/ResaleListingCard";

const RESALE_CITIES = [
  "Coquitlam",
  "Langley",
  "Burnaby",
  "Surrey", 
  "Richmond",
  "Delta",
  "Abbotsford",
  "Vancouver",
];

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

interface CityCarouselProps {
  city: string;
}

function CityCarousel({ city }: CityCarouselProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const { data: listings, isLoading } = useQuery({
    queryKey: ["resale-city-listings", city],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("mls_listings")
        .select("id, listing_key, listing_price, city, neighborhood, unparsed_address, street_number, street_name, property_type, property_sub_type, bedrooms_total, bathrooms_total, living_area, photos, days_on_market, mls_status, year_built, list_agent_name, list_office_name, virtual_tour_url")
        .eq("mls_status", "Active")
        .ilike("city", `%${city}%`)
        .gte("year_built", 2024)
        .order("listing_price", { ascending: false })
        .limit(10);

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

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Skeleton className="h-6 w-32" />
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
        <div className="flex items-center gap-2">
          <MapPin className="h-5 w-5 text-primary" />
          <h3 className="text-xl font-bold text-foreground">{city}</h3>
          <span className="text-sm text-muted-foreground">
            ({listings.length} listings)
          </span>
        </div>
        <div className="flex items-center gap-2">
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
          <Button variant="ghost" size="sm" asChild className="text-primary">
            <Link to={`/resale?city=${encodeURIComponent(city)}`}>
              View All
              <ArrowRight className="h-4 w-4 ml-1" />
            </Link>
          </Button>
        </div>
      </div>

      {/* Carousel */}
      <div
        ref={scrollContainerRef}
        className="-mx-4 px-4 overflow-x-auto scrollbar-hide scroll-smooth"
        style={{ scrollSnapType: "x mandatory", scrollPaddingLeft: "16px" }}
      >
        <div className="flex gap-3 md:gap-4 pb-2">
          {listings.map((listing) => (
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
    </div>
  );
}

export function ResaleCitySection() {
  return (
    <section className="py-12 sm:py-16 md:py-20 bg-background">
      <div className="container px-4">
        {/* Section Header */}
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-8">
          <div className="space-y-2">
            <span className="text-xs font-semibold uppercase tracking-widest text-primary">
              Browse by City
            </span>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-foreground tracking-tight">
              New Homes by Location
            </h2>
            <p className="text-muted-foreground text-sm sm:text-base max-w-xl">
              Discover new construction homes across Metro Vancouver
            </p>
          </div>
          <Button variant="outline" asChild className="hidden sm:flex gap-1">
            <Link to="/resale">
              View All Listings
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>

        {/* City Carousels */}
        <div className="space-y-10">
          {RESALE_CITIES.map((city) => (
            <CityCarousel key={city} city={city} />
          ))}
        </div>
      </div>
    </section>
  );
}