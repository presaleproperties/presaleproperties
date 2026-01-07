import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { ArrowRight, Home } from "lucide-react";
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

interface MobileResaleCarouselProps {
  title: string;
  subtitle?: string;
  city?: string;
}

export function MobileResaleCarousel({ title, subtitle, city }: MobileResaleCarouselProps) {
  const { data: listings, isLoading } = useQuery({
    queryKey: ["mobile-resale-carousel", city],
    queryFn: async () => {
      let query = supabase
        .from("mls_listings")
        .select("id, listing_key, listing_price, city, neighborhood, unparsed_address, street_number, street_name, property_type, property_sub_type, bedrooms_total, bathrooms_total, living_area, photos, days_on_market")
        .eq("mls_status", "Active")
        .order("list_date", { ascending: false })
        .limit(10);

      if (city && city !== "all") {
        query = query.eq("city", city);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as MLSListing[];
    },
  });

  if (isLoading) {
    return (
      <div className="px-4 sm:px-6">
        <div className="flex items-center justify-between mb-4">
          <Skeleton className="h-6 w-40" />
          <Skeleton className="h-8 w-16 rounded-full" />
        </div>
        <div className="flex gap-3 overflow-hidden">
          {[1, 2].map((i) => (
            <div key={i} className="w-[calc(100vw-72px)] flex-shrink-0">
              <Skeleton className="aspect-[4/3] rounded-xl" />
              <Skeleton className="h-5 w-3/4 mt-3" />
              <Skeleton className="h-4 w-1/2 mt-2" />
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
    <div>
      {/* Header */}
      <div className="flex items-center justify-between px-4 sm:px-6 mb-4">
        <div>
          <h2 className="text-lg font-bold text-foreground">{title}</h2>
          {subtitle && (
            <p className="text-sm text-muted-foreground">{subtitle}</p>
          )}
        </div>
        <Link
          to="/resale"
          className="flex items-center gap-1 px-3 py-1.5 rounded-full text-sm font-medium text-muted-foreground bg-muted hover:bg-muted/80 transition-colors"
        >
          See all
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>

      {/* Carousel */}
      <div 
        className="flex gap-3 overflow-x-auto scrollbar-hide px-4 sm:px-6 pb-2 snap-x snap-mandatory"
        style={{ scrollPaddingLeft: '16px' }}
      >
        {listings.map((listing) => {
          const photoUrl = getFirstPhoto(listing);
          return (
            <Link
              key={listing.id}
              to={`/resale/${listing.listing_key}`}
              className="w-[calc(100vw-72px)] flex-shrink-0 snap-start group"
            >
              <div className="bg-card rounded-xl overflow-hidden border border-border transition-all group-active:scale-[0.98]">
                <div className="relative aspect-[4/3] overflow-hidden bg-muted">
                  {photoUrl ? (
                    <img
                      src={photoUrl}
                      alt={getAddress(listing)}
                      className="w-full h-full object-cover"
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
                    <h3 className="font-semibold text-lg text-foreground">
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
    </div>
  );
}
