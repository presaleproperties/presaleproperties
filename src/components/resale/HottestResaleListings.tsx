import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { ArrowRight, Building2, Flame } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ResaleListingCard } from "@/components/listings/ResaleListingCard";
import { supabase } from "@/integrations/supabase/client";

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

// Featured cities for Move-In Ready homes
const FEATURED_CITIES = [
  "Burnaby", "Vancouver", "Coquitlam", "Langley"
];

export function HottestResaleListings() {
  const { data: listings, isLoading } = useQuery({
    queryKey: ["hottest-resale-listings-2024"],
    queryFn: async () => {
      // Get newest listings with good photos (proxy for "hottest")
      const { data, error } = await supabase
        .from("mls_listings")
        .select("id, listing_key, listing_price, city, neighborhood, unparsed_address, street_number, street_name, property_type, property_sub_type, bedrooms_total, bathrooms_total, living_area, photos, days_on_market, mls_status, year_built, list_agent_name, list_office_name, virtual_tour_url, created_at")
        .eq("mls_status", "Active")
        .in("city", FEATURED_CITIES)
        .gte("year_built", 2024)
        .order("created_at", { ascending: false })
        .limit(12);

      if (error) throw error;
      return data as MLSListing[];
    },
    staleTime: 2 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });

  return (
    <section className="py-12 sm:py-16 md:py-20 lg:py-28 bg-muted/20 relative">
      {/* Top divider */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-border to-transparent" />
      
      <div className="container px-4">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 sm:gap-6 mb-8 sm:mb-10 md:mb-12">
          <div className="space-y-2 sm:space-y-3">
            <span className="text-[10px] sm:text-xs font-semibold uppercase tracking-widest text-primary flex items-center gap-1.5">
              <Flame className="h-3.5 w-3.5" />
              Don't Miss Out
            </span>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-foreground tracking-tight">
              Hottest Move-In Ready Homes
            </h2>
            <p className="text-muted-foreground text-sm sm:text-base md:text-lg max-w-xl">
              The newest new-built homes across Metro Vancouver
            </p>
          </div>
          <Button variant="outline" size="lg" asChild className="hidden sm:flex w-fit group">
            <Link to="/properties">
              View All Listings
              <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>
          </Button>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 md:gap-5 lg:gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-card rounded-xl overflow-hidden border">
                <Skeleton className="h-40 sm:h-48 w-full" />
                <div className="p-4 sm:p-5 space-y-3">
                  <Skeleton className="h-5 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                  <Skeleton className="h-4 w-full" />
                </div>
              </div>
            ))}
          </div>
        ) : listings && listings.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 md:gap-5 lg:gap-6">
            {listings.map((listing) => (
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
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-10 sm:py-12 bg-card rounded-xl border">
            <Building2 className="h-10 w-10 sm:h-12 sm:w-12 mx-auto text-muted-foreground mb-3 sm:mb-4" />
            <h3 className="text-base sm:text-lg font-medium text-foreground mb-2">
              New Listings Coming Soon
            </h3>
            <p className="text-sm sm:text-base text-muted-foreground mb-4">
              We're adding new construction homes daily.
            </p>
            <Button asChild>
              <Link to="/properties">Browse All Listings</Link>
            </Button>
          </div>
        )}

        {/* Mobile CTA */}
        <div className="mt-6 sm:hidden">
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
