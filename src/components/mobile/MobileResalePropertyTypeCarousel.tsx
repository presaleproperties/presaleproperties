import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { ArrowRight, Building2, Home, Building } from "lucide-react";
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
};

function getAddress(listing: MLSListing): string {
  if (listing.unparsed_address) return listing.unparsed_address;
  if (listing.street_number && listing.street_name) {
    return `${listing.street_number} ${listing.street_name}`;
  }
  return listing.city;
}

// Metro Vancouver cities
const METRO_VANCOUVER_CITIES = [
  "Vancouver", "Surrey", "Burnaby", "Richmond", "Langley", 
  "Coquitlam", "Delta", "Abbotsford", "New Westminster", 
  "Port Coquitlam", "Port Moody", "Maple Ridge", "White Rock",
  "North Vancouver", "West Vancouver", "Chilliwack", "Mission",
  "Pitt Meadows", "Tsawwassen", "Ladner"
];

// Property type filter mapping - matches inferred types from sync
const PROPERTY_TYPE_FILTERS = {
  condo: ["Apartment/Condo", "Condo", "Apartment"],
  townhouse: ["Townhouse", "Row/Townhouse", "Townhome", "Duplex"],
  house: ["Single Family", "House", "Detached", "Single Family Residential"],
};

const PROPERTY_TYPE_ICONS = {
  condo: Building2,
  townhouse: Building,
  house: Home,
};

interface MobileResalePropertyTypeCarouselProps {
  propertyType: "condo" | "townhouse" | "house";
  title: string;
  subtitle?: string;
}

export function MobileResalePropertyTypeCarousel({ 
  propertyType, 
  title, 
  subtitle 
}: MobileResalePropertyTypeCarouselProps) {
  const Icon = PROPERTY_TYPE_ICONS[propertyType];
  const typeFilters = PROPERTY_TYPE_FILTERS[propertyType];

  const { data: listings, isLoading } = useQuery({
    queryKey: ["mobile-resale-property-type-2020", propertyType],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("mls_listings")
        .select("id, listing_key, listing_price, city, neighborhood, unparsed_address, street_number, street_name, property_type, property_sub_type, bedrooms_total, bathrooms_total, living_area, photos, days_on_market, mls_status, year_built, list_agent_name, list_office_name, created_at")
        .eq("mls_status", "Active")
        .in("city", METRO_VANCOUVER_CITIES)
        .in("property_sub_type", typeFilters)
        .gte("year_built", 2024)
        .order("created_at", { ascending: false })
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
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 px-4 sm:px-6">
        <div className="flex items-center gap-2">
          <Icon className="h-5 w-5 text-primary" />
          <div>
            <h2 className="text-xl font-bold text-foreground">{title}</h2>
            {subtitle && (
              <p className="text-sm text-muted-foreground mt-0.5">{subtitle}</p>
            )}
          </div>
        </div>
        <Link
          to={`/resale?type=${propertyType}`}
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
          <div key={listing.id} className="shrink-0 w-[calc(100vw-80px)] scroll-snap-start">
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
            />
          </div>
        ))}
      </div>
    </div>
  );
}
