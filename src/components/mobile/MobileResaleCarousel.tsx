import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
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
        .select("id, listing_key, listing_price, city, neighborhood, unparsed_address, street_number, street_name, property_type, property_sub_type, bedrooms_total, bathrooms_total, living_area, photos, days_on_market, mls_status")
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
        {listings.map((listing) => (
          <div key={listing.id} className="w-[calc(100vw-72px)] flex-shrink-0 snap-start">
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
            />
          </div>
        ))}
      </div>
    </div>
  );
}
