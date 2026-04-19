import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { ResaleListingCard } from "@/components/listings/ResaleListingCard";

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

interface MobileResaleCityCarouselProps {
  city: string;
  title?: string;
}

export function MobileResaleCityCarousel({ city, title }: MobileResaleCityCarouselProps) {
  const { data: listings, isLoading } = useQuery({
    queryKey: ["mobile-resale-city-2024", city],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("mls_listings_safe")
        .select("id, listing_key, listing_price, city, neighborhood, unparsed_address, street_number, street_name, property_type, property_sub_type, bedrooms_total, bathrooms_total, living_area, photos, days_on_market, mls_status, year_built, list_agent_name, list_office_name, virtual_tour_url")
        .eq("mls_status", "Active")
        .ilike("city", `%${city}%`)
        .gte("year_built", 2024)
        .order("listing_price", { ascending: false })
        .limit(16);

      if (error) throw error;
      return data as MLSListing[];
    },
    staleTime: 2 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });

  if (isLoading) {
    return (
      <div className="px-4 sm:px-6">
        <div className="flex items-center justify-between mb-3">
          <Skeleton className="h-5 w-24" />
          <Skeleton className="h-6 w-16" />
        </div>
        <div className="flex gap-3 overflow-hidden">
          {[...Array(2)].map((_, i) => (
            <div key={i} className="flex-shrink-0 w-[calc(100vw-72px)]">
              <Skeleton className="aspect-[16/11] rounded-lg mb-2" />
              <Skeleton className="h-4 w-3/4 mb-1" />
              <Skeleton className="h-3 w-1/2" />
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
      <div className="flex items-center justify-between gap-4 px-4 sm:px-6">
        <h3 className="text-xl font-bold text-foreground">
          {title || city}
        </h3>
        <Link
          to={`/properties/${city.toLowerCase().replace(/\s+/g, "-")}`}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium text-muted-foreground bg-muted/50 hover:bg-muted transition-colors shrink-0"
        >
          View All
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>

      {/* Scrollable cards */}
      <div
        className="flex gap-2.5 overflow-x-auto scrollbar-hide px-4 sm:px-6 pb-2 scroll-snap-x scroll-snap-mandatory"
      >
        {listings.map((listing) => (
          <div
            key={listing.id}
            className="shrink-0 w-[calc(100vw-80px)] scroll-snap-start"
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
  );
}