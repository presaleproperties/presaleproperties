import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { ResaleListingCard } from "@/components/listings/ResaleListingCard";
import { supabase } from "@/integrations/supabase/client";

interface RelatedCityListingsProps {
  city: string;
  neighborhood?: string | null;
  excludeListingKey: string;
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

export function RelatedCityListings({ city, neighborhood, excludeListingKey }: RelatedCityListingsProps) {
  // First try to get listings from same neighborhood - 2024+ builds only
  const { data: neighborhoodListings } = useQuery({
    queryKey: ["related-neighborhood-listings-2025", neighborhood, excludeListingKey],
    queryFn: async () => {
      if (!neighborhood) return [];
      
      const { data, error } = await supabase
        .from("mls_listings")
        .select("id, listing_key, listing_price, city, neighborhood, unparsed_address, street_number, street_name, property_type, property_sub_type, bedrooms_total, bathrooms_total, living_area, photos, days_on_market, mls_status, year_built, list_agent_name, list_office_name, virtual_tour_url")
        .eq("mls_status", "Active")
        .ilike("neighborhood", neighborhood)
        .neq("listing_key", excludeListingKey)
        .gte("year_built", 2024)
        .order("list_date", { ascending: false })
        .limit(10);

      if (error) throw error;
      return data as MLSListing[];
    },
    enabled: !!neighborhood,
  });

  // Get listings from same city - 2024+ builds only
  const { data: cityListings, isLoading } = useQuery({
    queryKey: ["related-city-listings-2025", city, excludeListingKey],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("mls_listings")
        .select("id, listing_key, listing_price, city, neighborhood, unparsed_address, street_number, street_name, property_type, property_sub_type, bedrooms_total, bathrooms_total, living_area, photos, days_on_market, mls_status, year_built, list_agent_name, list_office_name, virtual_tour_url")
        .eq("mls_status", "Active")
        .ilike("city", city)
        .neq("listing_key", excludeListingKey)
        .gte("year_built", 2024)
        .order("list_date", { ascending: false })
        .limit(12);

      if (error) throw error;
      return data as MLSListing[];
    },
  });

  if (isLoading) {
    return (
      <section className="py-6 md:py-8">
        <div className="px-4 sm:px-6 lg:px-0">
          <Skeleton className="h-6 w-48 mb-2" />
          <Skeleton className="h-4 w-64 mb-4" />
        </div>
        <div className="flex gap-3 overflow-hidden px-4 sm:px-6 lg:px-0">
          {[1, 2, 3].map((i) => (
            <div key={i} className="shrink-0 w-[280px] md:w-[300px]">
              <Skeleton className="aspect-[4/3] rounded-xl" />
              <Skeleton className="h-5 w-3/4 mt-3" />
              <Skeleton className="h-4 w-1/2 mt-2" />
            </div>
          ))}
        </div>
      </section>
    );
  }

  const hasNeighborhoodListings = neighborhoodListings && neighborhoodListings.length > 0;
  const hasCityListings = cityListings && cityListings.length > 0;

  if (!hasNeighborhoodListings && !hasCityListings) return null;

  return (
    <div className="space-y-8 md:space-y-10">
      {/* Neighborhood Listings Carousel */}
      {hasNeighborhoodListings && (
        <section className="space-y-4">
          {/* Header - Matches site carousel pattern */}
          <div className="flex items-center justify-between gap-4 px-4 sm:px-6 lg:px-0">
            <div className="min-w-0">
              <span className="text-xs font-semibold uppercase tracking-widest text-primary mb-1 block">
                Same Neighborhood
              </span>
              <h2 className="text-xl font-bold text-foreground leading-tight">
                More in {neighborhood}
              </h2>
              <p className="text-sm text-muted-foreground mt-1">
                Similar properties nearby
              </p>
            </div>
            <Link 
              to={`/resale/${city.toLowerCase()}?neighborhood=${encodeURIComponent(neighborhood || '')}`}
              className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground bg-muted/50 hover:bg-muted px-3 py-1.5 rounded-full transition-colors shrink-0"
            >
              See all
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          
          {/* Horizontal Scrollable Carousel */}
          <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-2 snap-x snap-mandatory px-4 sm:px-6 lg:px-0 scroll-px-4 sm:scroll-px-6 lg:scroll-px-0">
            {neighborhoodListings.map((listing) => (
              <div 
                key={listing.id} 
                className="snap-start shrink-0 w-[280px] md:w-[300px] lg:w-[320px]"
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
                  yearBuilt={listing.year_built}
                />
              </div>
            ))}
          </div>
        </section>
      )}

      {/* City Listings Carousel */}
      {hasCityListings && (
        <section className="space-y-4">
          {/* Header */}
          <div className="flex items-center justify-between gap-4 px-4 sm:px-6 lg:px-0">
            <div className="min-w-0">
              <span className="text-xs font-semibold uppercase tracking-widest text-primary mb-1 block">
                Explore More
              </span>
              <h2 className="text-xl font-bold text-foreground leading-tight">
                More in {city}
              </h2>
              <p className="text-sm text-muted-foreground mt-1">
                Browse more new homes in {city}
              </p>
            </div>
            <Link 
              to={`/resale/${city.toLowerCase()}`}
              className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground bg-muted/50 hover:bg-muted px-3 py-1.5 rounded-full transition-colors shrink-0"
            >
              See all
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          
          {/* Horizontal Scrollable Carousel */}
          <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-2 snap-x snap-mandatory px-4 sm:px-6 lg:px-0 scroll-px-4 sm:scroll-px-6 lg:scroll-px-0">
            {cityListings.map((listing) => (
              <div 
                key={listing.id} 
                className="snap-start shrink-0 w-[280px] md:w-[300px] lg:w-[320px]"
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
                  yearBuilt={listing.year_built}
                />
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
