import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
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
  // First try to get listings from same neighborhood
  const { data: neighborhoodListings } = useQuery({
    queryKey: ["related-neighborhood-listings", neighborhood, excludeListingKey],
    queryFn: async () => {
      if (!neighborhood) return [];
      
      const { data, error } = await supabase
        .from("mls_listings")
        .select("id, listing_key, listing_price, city, neighborhood, unparsed_address, street_number, street_name, property_type, property_sub_type, bedrooms_total, bathrooms_total, living_area, photos, days_on_market, mls_status, year_built, list_agent_name, list_office_name, virtual_tour_url")
        .eq("mls_status", "Active")
        .ilike("neighborhood", neighborhood)
        .neq("listing_key", excludeListingKey)
        .or("property_type.ilike.%Condo%,property_type.ilike.%Townhouse%,property_sub_type.ilike.%Condo%,property_sub_type.ilike.%Townhouse%")
        .order("list_date", { ascending: false })
        .limit(6);

      if (error) throw error;
      return data as MLSListing[];
    },
    enabled: !!neighborhood,
  });

  // Get listings from same city
  const { data: cityListings, isLoading } = useQuery({
    queryKey: ["related-city-listings", city, excludeListingKey],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("mls_listings")
        .select("id, listing_key, listing_price, city, neighborhood, unparsed_address, street_number, street_name, property_type, property_sub_type, bedrooms_total, bathrooms_total, living_area, photos, days_on_market, mls_status, year_built, list_agent_name, list_office_name, virtual_tour_url")
        .eq("mls_status", "Active")
        .ilike("city", city)
        .neq("listing_key", excludeListingKey)
        .or("property_type.ilike.%Condo%,property_type.ilike.%Townhouse%,property_sub_type.ilike.%Condo%,property_sub_type.ilike.%Townhouse%")
        .order("list_date", { ascending: false })
        .limit(10);

      if (error) throw error;
      return data as MLSListing[];
    },
  });

  if (isLoading) {
    return (
      <section className="py-8 md:py-12">
        <Skeleton className="h-8 w-64 mb-6" />
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="space-y-3">
              <Skeleton className="aspect-[4/3] rounded-xl" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
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
    <div className="space-y-12">
      {/* Neighborhood Listings */}
      {hasNeighborhoodListings && (
        <section>
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl md:text-2xl font-bold text-foreground">
                More in {neighborhood}
              </h2>
              <p className="text-sm text-muted-foreground">
                Similar properties in this neighborhood
              </p>
            </div>
            <Button variant="outline" size="sm" asChild className="hidden sm:flex">
              <Link to={`/resale/${city.toLowerCase()}?neighborhood=${encodeURIComponent(neighborhood || '')}`}>
                View All
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
            {neighborhoodListings.slice(0, 4).map((listing) => (
              <ResaleListingCard
                key={listing.id}
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
            ))}
          </div>
        </section>
      )}

      {/* City Listings */}
      {hasCityListings && (
        <section>
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl md:text-2xl font-bold text-foreground">
                More in {city}
              </h2>
              <p className="text-sm text-muted-foreground">
                Browse more condos & townhomes in {city}
              </p>
            </div>
            <Button variant="outline" size="sm" asChild className="hidden sm:flex">
              <Link to={`/resale/${city.toLowerCase()}`}>
                View All {city}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
            {cityListings.slice(0, 8).map((listing) => (
              <ResaleListingCard
                key={listing.id}
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
            ))}
          </div>

          {/* Mobile View All Button */}
          <div className="mt-6 sm:hidden">
            <Button variant="outline" className="w-full" asChild>
              <Link to={`/resale/${city.toLowerCase()}`}>
                View All {city} Listings
              </Link>
            </Button>
          </div>
        </section>
      )}
    </div>
  );
}
