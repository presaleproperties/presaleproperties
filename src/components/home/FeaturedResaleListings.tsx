import { useRef, useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { ChevronLeft, ChevronRight, ArrowRight, Sparkles, Building2, Home, Castle, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { ResaleListingCard } from "@/components/listings/ResaleListingCard";
import { getCityPropertiesUrl } from "@/lib/propertiesUrls";

const RESALE_TYPES = [
  { label: "Condos", citySlug: "condos", icon: Building2 },
  { label: "Townhomes", citySlug: "townhouses", icon: Home },
  { label: "Houses", citySlug: "houses", icon: Castle },
];

const RESALE_DEALS = [
  { label: "Condos Under $500K", slug: "condos-under-500k", icon: Building2 },
  { label: "Townhomes Under $800K", slug: "townhomes-under-800k", icon: Home },
];

const RESALE_CITIES = [
  "Vancouver", "Surrey", "Burnaby", "Langley", "Coquitlam", "Richmond", "New Westminster",
];

type MLSListing = {
  id: string;
  listing_key: string;
  listing_price: number;
  original_list_price: number | null;
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

export function FeaturedResaleListings() {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  // Metro Vancouver cities for filtering - excludes Vancouver Island (Langford, Victoria, etc.)
  const metroVancouverCities = [
    "Vancouver", "Surrey", "Burnaby", "Richmond", "Langley", 
    "Coquitlam", "Delta", "Abbotsford", "New Westminster", 
    "Port Coquitlam", "Port Moody", "Maple Ridge", "White Rock",
    "North Vancouver", "West Vancouver", "Chilliwack", "Mission",
    "Pitt Meadows", "Tsawwassen", "Ladner"
  ];

  const { data: listings, isLoading, isError } = useQuery({
    queryKey: ["featured-resale-listings-metro-vancouver-2024"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("mls_listings_safe")
        .select("id, listing_key, listing_price, original_list_price, city, neighborhood, unparsed_address, street_number, street_name, property_type, property_sub_type, bedrooms_total, bathrooms_total, living_area, photos, days_on_market, mls_status, year_built, list_agent_name, list_office_name, virtual_tour_url, created_at")
        .eq("mls_status", "Active")
        .in("city", metroVancouverCities)
        .gte("year_built", 2024)
        .order("created_at", { ascending: false })
        .limit(16);

      if (error) {
        console.error("FeaturedResaleListings fetch error:", error);
        throw error;
      }
      return data as MLSListing[];
    },
    retry: 1,
    staleTime: 2 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });

  // Error check moved after hooks below

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
      <section className="py-12 sm:py-16 md:py-20 bg-muted/20 relative">
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-border to-transparent" />
        <div className="container px-4">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              <Skeleton className="h-6 w-48" />
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
      </section>
    );
  }

  if (!listings || listings.length === 0) {
    return (
      <section className="py-12 sm:py-16 md:py-20 bg-muted/20 relative">
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-border to-transparent" />
        <div className="container px-4">
          <div className="text-center py-10 sm:py-12 bg-card rounded-xl border">
            <Building2 className="h-10 w-10 sm:h-12 sm:w-12 mx-auto text-muted-foreground mb-3 sm:mb-4" />
            <h3 className="text-base sm:text-lg font-medium text-foreground mb-2">
              No Move-In Ready Homes Yet
            </h3>
            <p className="text-sm sm:text-base text-muted-foreground mb-4">
              Check back soon for new listings.
            </p>
            <Button asChild>
              <Link to="/properties">Browse All Listings</Link>
            </Button>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="pt-6 sm:pt-8 pb-10 sm:pb-14 md:pb-16 bg-muted/20 relative">
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-border to-transparent" />
      
      <div className="container px-4">
        {/* Quick Search Links — compact inline */}
        <div className="flex flex-wrap items-center gap-2 mb-6">
          {RESALE_TYPES.map(({ label, citySlug, icon: Icon }) => (
            <Link
              key={citySlug}
              to={`/properties/vancouver/${citySlug}`}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-semibold bg-secondary text-secondary-foreground hover:bg-secondary/80 transition-colors border border-border"
            >
              <Icon className="h-3.5 w-3.5" />
              {label}
            </Link>
          ))}
          <span className="w-px h-5 bg-border mx-1 hidden sm:block" />
          {RESALE_DEALS.map(({ label, slug, icon: Icon }) => (
            <Link
              key={slug}
              to={`/properties/${slug}`}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-semibold bg-primary/15 text-primary hover:bg-primary/25 transition-colors border border-primary/30"
            >
              <Icon className="h-3.5 w-3.5" />
              {label}
            </Link>
          ))}
          <span className="w-px h-5 bg-border mx-1 hidden sm:block" />
          {RESALE_CITIES.map((city) => (
            <Link
              key={city}
              to={getCityPropertiesUrl(city)}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
            >
              <MapPin className="h-3 w-3 text-primary/60" />
              {city}
            </Link>
          ))}
        </div>

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3 sm:gap-6 mb-6 sm:mb-8">
          <div className="space-y-1 sm:space-y-2">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-foreground tracking-tight">
              Move-In Ready Homes
            </h2>
            <p className="text-muted-foreground text-sm sm:text-base max-w-xl">
              Brand new condos & townhomes in Metro Vancouver
            </p>
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
            <Button variant="outline" size="sm" asChild className="hidden sm:flex gap-1">
              <Link to="/properties">
                View All
                <ArrowRight className="h-4 w-4" />
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
                  originalPrice={listing.original_list_price}
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
        <div className="mt-4 sm:hidden">
          <Link to="/properties">
            <Button variant="outline" className="w-full">
              View All Listings
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
}
