import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { ArrowRight, Building2, Home } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
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
};

function formatPrice(price: number): string {
  if (price >= 1000000) {
    return `$${(price / 1000000).toFixed(2)}M`;
  }
  return `$${(price / 1000).toFixed(0)}K`;
}

function getAddress(listing: MLSListing): string {
  if (listing.unparsed_address) return listing.unparsed_address;
  if (listing.street_number && listing.street_name) {
    return `${listing.street_number} ${listing.street_name}`;
  }
  return listing.city;
}

function getFirstPhoto(listing: MLSListing): string | null {
  if (!listing.photos) return null;
  if (Array.isArray(listing.photos) && listing.photos.length > 0) {
    const photo = listing.photos[0];
    return photo?.MediaURL || photo?.url || (typeof photo === 'string' ? photo : null);
  }
  return null;
}

export function FeaturedResaleListings() {
  const { data: listings, isLoading } = useQuery({
    queryKey: ["featured-resale-listings"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("mls_listings")
        .select("id, listing_key, listing_price, city, neighborhood, unparsed_address, street_number, street_name, property_type, property_sub_type, bedrooms_total, bathrooms_total, living_area, photos, days_on_market")
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
            {listings.map((listing) => {
              const photoUrl = getFirstPhoto(listing);
              return (
                <Link
                  key={listing.id}
                  to={`/resale/${listing.listing_key}`}
                  className="group"
                >
                  <div className="bg-card rounded-xl overflow-hidden border transition-all hover:shadow-lg hover:-translate-y-0.5">
                    <div className="relative aspect-[4/3] overflow-hidden bg-muted">
                      {photoUrl ? (
                        <img
                          src={photoUrl}
                          alt={getAddress(listing)}
                          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                          loading="lazy"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Home className="h-12 w-12 text-muted-foreground/50" />
                        </div>
                      )}
                      <Badge className="absolute top-3 left-3 bg-green-500 hover:bg-green-600">
                        Active
                      </Badge>
                      {listing.days_on_market && listing.days_on_market <= 7 && (
                        <Badge className="absolute top-3 right-3 bg-primary">
                          New
                        </Badge>
                      )}
                    </div>
                    <div className="p-4">
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <h3 className="font-semibold text-lg text-foreground line-clamp-1">
                          {formatPrice(listing.listing_price)}
                        </h3>
                        {listing.property_sub_type && (
                          <Badge variant="secondary" className="shrink-0 text-xs">
                            {listing.property_sub_type}
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground line-clamp-1 mb-2">
                        {getAddress(listing)}
                      </p>
                      <div className="flex items-center gap-3 text-sm text-muted-foreground">
                        {listing.bedrooms_total && (
                          <span>{listing.bedrooms_total} bed</span>
                        )}
                        {listing.bathrooms_total && (
                          <span>{listing.bathrooms_total} bath</span>
                        )}
                        {listing.living_area && (
                          <span>{listing.living_area.toLocaleString()} sqft</span>
                        )}
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })}
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
