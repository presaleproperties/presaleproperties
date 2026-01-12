import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { ArrowRight, Building2 } from "lucide-react";
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
};

function getAddress(listing: MLSListing): string {
  if (listing.unparsed_address) return listing.unparsed_address;
  if (listing.street_number && listing.street_name) {
    return `${listing.street_number} ${listing.street_name}`;
  }
  return listing.city;
}

export function FeaturedResaleListings() {
  const { data: listings, isLoading } = useQuery({
    queryKey: ["featured-resale-listings"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("mls_listings")
        .select("id, listing_key, listing_price, city, neighborhood, unparsed_address, street_number, street_name, property_type, property_sub_type, bedrooms_total, bathrooms_total, living_area, photos, days_on_market, mls_status")
        .eq("mls_status", "Active")
        .order("list_date", { ascending: false })
        .limit(6);

      if (error) throw error;
      return data as MLSListing[];
    },
  });

  return (
    <section className="py-12 sm:py-16 md:py-20 lg:py-28 bg-muted/20 relative">
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-border to-transparent" />
      
      <div className="container px-4">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 sm:gap-6 mb-8 sm:mb-10 md:mb-12">
          <div className="space-y-2 sm:space-y-3">
            <span className="text-[10px] sm:text-xs font-semibold uppercase tracking-widest text-primary">
              Just Listed
            </span>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-foreground tracking-tight">
              Hottest Resale Properties
            </h2>
            <p className="text-muted-foreground text-sm sm:text-base md:text-lg max-w-xl">
              The newest listings across Metro Vancouver
            </p>
          </div>
          <Button variant="outline" size="lg" asChild className="hidden sm:flex w-fit group">
            <Link to="/resale">
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
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-10 sm:py-12 bg-card rounded-xl border">
            <Building2 className="h-10 w-10 sm:h-12 sm:w-12 mx-auto text-muted-foreground mb-3 sm:mb-4" />
            <h3 className="text-base sm:text-lg font-medium text-foreground mb-2">
              No Resale Listings Yet
            </h3>
            <p className="text-sm sm:text-base text-muted-foreground mb-4">
              Check back soon for new listings.
            </p>
            <Button asChild>
              <Link to="/resale">Browse All Listings</Link>
            </Button>
          </div>
        )}

        <div className="mt-6 sm:hidden">
          <Link to="/resale">
            <Button variant="outline" className="w-full">
              View All Listings
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
}
