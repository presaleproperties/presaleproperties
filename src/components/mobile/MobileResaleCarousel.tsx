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
  year_built: number | null;
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
  // Featured cities for Move-In Ready homes
  const featuredCities = [
    "Burnaby", "Vancouver", "Coquitlam", "Langley"
  ];

  // 2024+ builds only (move-in ready new construction)
  const { data: listings, isLoading } = useQuery({
    queryKey: ["mobile-resale-carousel-2024", city],
    queryFn: async () => {
      let query = supabase
        .from("mls_listings")
        .select("id, listing_key, listing_price, city, neighborhood, unparsed_address, street_number, street_name, property_type, property_sub_type, bedrooms_total, bathrooms_total, living_area, photos, days_on_market, mls_status, year_built, created_at")
        .eq("mls_status", "Active")
        .gte("year_built", 2024)
        .order("created_at", { ascending: false })
        .limit(16);

      if (city && city !== "all") {
        query = query.ilike("city", city);
      } else {
        // If no city specified, filter to featured cities only
        query = query.in("city", featuredCities);
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
            <div key={i} className="w-[calc(100vw-40px)] flex-shrink-0">
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
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 px-4 sm:px-6">
        <div>
          <h2 className="text-xl font-bold text-foreground">{title}</h2>
          {subtitle && (
            <p className="text-sm text-muted-foreground mt-0.5">{subtitle}</p>
          )}
        </div>
        <Link
          to="/properties"
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
          <div key={listing.id} className="shrink-0 w-[calc(100vw-48px)] scroll-snap-start">
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
