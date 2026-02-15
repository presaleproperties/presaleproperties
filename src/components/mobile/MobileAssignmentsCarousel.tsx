import { useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ChevronRight, Bed, Bath, Square } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";

interface MobileAssignmentsCarouselProps {
  title: string;
  subtitle?: string;
  featured?: boolean;
  showCityFilter?: boolean;
}

interface Listing {
  id: string;
  title: string;
  project_name: string;
  city: string;
  neighborhood: string | null;
  beds: number;
  baths: number;
  interior_sqft: number | null;
  assignment_price: number;
  is_featured: boolean | null;
  listing_photos: { url: string; sort_order: number | null }[];
}

function formatPrice(price: number): string {
  if (price >= 1000000) {
    return `$${(price / 1000000).toFixed(2)}M`;
  }
  return `$${(price / 1000).toFixed(0)}K`;
}

const CITIES = ["All", "Vancouver", "Burnaby", "Surrey", "Richmond", "Coquitlam", "Langley"];

export function MobileAssignmentsCarousel({ title, subtitle, featured = false, showCityFilter = false }: MobileAssignmentsCarouselProps) {
  const [selectedCity, setSelectedCity] = useState("All");

  const { data: listings, isLoading } = useQuery({
    queryKey: ["mobile-assignments", featured, selectedCity],
    queryFn: async () => {
      let query = supabase
        .from("listings")
        .select(`
          id,
          title,
          project_name,
          city,
          neighborhood,
          beds,
          baths,
          interior_sqft,
          assignment_price,
          is_featured,
          listing_photos (url, sort_order)
        `)
        .eq("status", "published")
        .order("published_at", { ascending: false })
        .limit(10);

      if (featured) {
        query = query.eq("is_featured", true);
      }

      if (selectedCity !== "All") {
        query = query.eq("city", selectedCity);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as Listing[];
    },
  });

  if (isLoading) {
    return (
      <div className="px-4 sm:px-6">
        <div className="flex items-center justify-between mb-3">
          <Skeleton className="h-6 w-40" />
          <Skeleton className="h-4 w-16" />
        </div>
        <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-2">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="flex-shrink-0 w-[260px]">
              <Skeleton className="aspect-[4/3] rounded-lg mb-2" />
              <Skeleton className="h-4 w-24 mb-1" />
              <Skeleton className="h-3 w-32" />
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
    <div className="px-4 sm:px-6">
      {/* Section Header */}
      <div className="flex items-center justify-between mb-3">
        <div>
          <h2 className="text-lg font-bold text-foreground">{title}</h2>
          {subtitle && (
            <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>
          )}
        </div>
        <Link
          to="/assignments"
          className="flex items-center gap-1 text-sm font-medium text-primary"
        >
          See all
          <ChevronRight className="h-4 w-4" />
        </Link>
      </div>

      {/* City Filter Chips */}
      {showCityFilter && (
        <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-3 -mx-4 px-4 sm:-mx-6 sm:px-6">
          {CITIES.map((city) => (
            <button
              key={city}
              onClick={() => setSelectedCity(city)}
              className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                selectedCity === city
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              }`}
            >
              {city}
            </button>
          ))}
        </div>
      )}

      {/* Horizontal Scroll Cards */}
      <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-2 -mx-4 px-4 sm:-mx-6 sm:px-6">
        {listings.map((listing) => {
          const imageUrl = listing.listing_photos?.[0]?.url;

          return (
            <Link
              key={listing.id}
              to={`/assignments/${listing.id}`}
              className="flex-shrink-0 w-[260px] group"
            >
              {/* Image */}
              <div className="relative aspect-[4/3] rounded-lg overflow-hidden mb-2 bg-muted">
                {imageUrl ? (
                  <img
                    src={imageUrl}
                    alt={listing.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    loading="lazy"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                    No Image
                  </div>
                )}
                {listing.is_featured && (
                  <div className="absolute top-2 left-2 bg-primary text-primary-foreground text-[10px] font-semibold px-2 py-0.5 rounded-full">
                    Featured
                  </div>
                )}
              </div>

              {/* Content */}
              <div className="space-y-1">
                <p className="text-base font-bold text-foreground">
                  {formatPrice(listing.assignment_price)}
                </p>
                <p className="text-sm text-foreground font-medium line-clamp-1">
                  {listing.project_name}
                </p>
                <p className="text-xs text-muted-foreground line-clamp-1">
                  {listing.neighborhood ? `${listing.neighborhood}, ` : ""}{listing.city}
                </p>
                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Bed className="h-3 w-3" />
                    {listing.beds}
                  </span>
                  <span className="flex items-center gap-1">
                    <Bath className="h-3 w-3" />
                    {listing.baths}
                  </span>
                  {listing.interior_sqft && (
                    <span className="flex items-center gap-1">
                      <Square className="h-3 w-3" />
                      {listing.interior_sqft} sqft
                    </span>
                  )}
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
