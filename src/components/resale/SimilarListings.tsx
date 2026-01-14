import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { ResaleListingCard } from "@/components/listings/ResaleListingCard";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { ChevronRight, Sparkles } from "lucide-react";

interface SimilarListingsProps {
  city: string;
  bedrooms: number | null;
  bathrooms: number | null;
  price: number;
  excludeListingKey: string;
}

export function SimilarListings({
  city,
  bedrooms,
  bathrooms,
  price,
  excludeListingKey,
}: SimilarListingsProps) {
  // Calculate price range (±20%)
  const minPrice = Math.round(price * 0.8);
  const maxPrice = Math.round(price * 1.2);

  const { data: listings, isLoading } = useQuery({
    queryKey: ["similar-listings", city, bedrooms, bathrooms, price, excludeListingKey],
    queryFn: async () => {
      let query = supabase
        .from("mls_listings")
        .select(`
          id, listing_key, listing_price, city, neighborhood,
          unparsed_address, street_number, street_name,
          property_type, property_sub_type, bedrooms_total,
          bathrooms_total, living_area, photos, days_on_market,
          mls_status, year_built, list_agent_name, list_office_name, virtual_tour_url
        `)
        .eq("mls_status", "Active")
        .ilike("city", city)
        .neq("listing_key", excludeListingKey)
        .gte("listing_price", minPrice)
        .lte("listing_price", maxPrice)
        .gte("year_built", 2020);

      // Match bedrooms if available (±1)
      if (bedrooms !== null) {
        query = query
          .gte("bedrooms_total", Math.max(0, bedrooms - 1))
          .lte("bedrooms_total", bedrooms + 1);
      }

      // Match bathrooms if available (±1)
      if (bathrooms !== null) {
        query = query
          .gte("bathrooms_total", Math.max(0, bathrooms - 1))
          .lte("bathrooms_total", bathrooms + 1);
      }

      const { data, error } = await query
        .order("days_on_market", { ascending: true })
        .limit(10);

      if (error) throw error;
      return data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-6 w-48" />
        <div className="flex gap-4 overflow-hidden">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-72 w-72 shrink-0 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  if (!listings || listings.length === 0) {
    return null;
  }

  const formatPrice = (price: number) => {
    if (price >= 1000000) {
      return `$${(price / 1000000).toFixed(2)}M`;
    }
    return `$${(price / 1000).toFixed(0)}K`;
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between px-4 sm:px-0">
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
          <h2 className="text-lg md:text-xl font-bold text-foreground">
            Similar Homes
          </h2>
          <span className="text-sm text-muted-foreground">
            ({listings.length} found)
          </span>
        </div>
        <Button variant="ghost" size="sm" className="text-primary gap-1" asChild>
          <Link to={`/resale?city=${city}&minPrice=${minPrice}&maxPrice=${maxPrice}`}>
            See all
            <ChevronRight className="h-4 w-4" />
          </Link>
        </Button>
      </div>

      <p className="text-sm text-muted-foreground px-4 sm:px-0">
        {bedrooms !== null && `${bedrooms}${bedrooms > 0 ? '±1' : ''} beds`}
        {bathrooms !== null && ` · ${bathrooms}${bathrooms > 0 ? '±1' : ''} baths`}
        {` · ${formatPrice(minPrice)} - ${formatPrice(maxPrice)}`}
        {` in ${city}`}
      </p>

      {/* Mobile carousel */}
      <div className="md:hidden -mx-4">
        <div 
          className="flex gap-4 overflow-x-auto snap-x snap-mandatory scrollbar-hide px-4"
          style={{ scrollPaddingLeft: '16px', scrollPaddingRight: '16px' }}
        >
          {listings.map((listing) => {
            const address = listing.unparsed_address || 
              [listing.street_number, listing.street_name].filter(Boolean).join(' ') || 
              listing.city;
            
            return (
              <div 
                key={listing.id} 
                className="w-[calc(100vw-72px)] shrink-0 snap-start"
              >
                <ResaleListingCard
                  id={listing.id}
                  listingKey={listing.listing_key}
                  price={listing.listing_price}
                  address={address}
                  city={listing.city}
                  neighborhood={listing.neighborhood}
                  propertyType={listing.property_type}
                  propertySubType={listing.property_sub_type}
                  beds={listing.bedrooms_total}
                  baths={listing.bathrooms_total}
                  sqft={listing.living_area}
                  photos={listing.photos as any[]}
                  daysOnMarket={listing.days_on_market}
                  status={listing.mls_status}
                  listAgentName={listing.list_agent_name}
                  listOfficeName={listing.list_office_name}
                  virtualTourUrl={listing.virtual_tour_url}
                  yearBuilt={listing.year_built}
                />
              </div>
            );
          })}
        </div>
      </div>

      {/* Desktop grid */}
      <div className="hidden md:grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {listings.slice(0, 6).map((listing) => {
          const address = listing.unparsed_address || 
            [listing.street_number, listing.street_name].filter(Boolean).join(' ') || 
            listing.city;
          
          return (
            <ResaleListingCard
              key={listing.id}
              id={listing.id}
              listingKey={listing.listing_key}
              price={listing.listing_price}
              address={address}
              city={listing.city}
              neighborhood={listing.neighborhood}
              propertyType={listing.property_type}
              propertySubType={listing.property_sub_type}
              beds={listing.bedrooms_total}
              baths={listing.bathrooms_total}
              sqft={listing.living_area}
              photos={listing.photos as any[]}
              daysOnMarket={listing.days_on_market}
              status={listing.mls_status}
              listAgentName={listing.list_agent_name}
              listOfficeName={listing.list_office_name}
              virtualTourUrl={listing.virtual_tour_url}
              yearBuilt={listing.year_built}
            />
          );
        })}
      </div>
    </div>
  );
}