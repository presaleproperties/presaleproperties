import { Link } from "react-router-dom";
import { MapPin, Bed, Bath, Ruler, Calendar, TrendingDown, Video } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { slugify } from "@/lib/seoUrls";
import type { Json } from "@/integrations/supabase/types";

interface ResaleListingCardProps {
  id: string;
  listingKey: string;
  price: number;
  originalPrice?: number | null;
  address?: string;
  city: string;
  neighborhood?: string | null;
  propertyType?: string;
  propertySubType?: string | null;
  beds?: number | null;
  baths?: number | null;
  sqft?: number | null;
  photos?: Json | Json[];
  daysOnMarket?: number | null;
  status?: string;
  listAgentName?: string | null;
  listOfficeName?: string | null;
  virtualTourUrl?: string | null;
  streetNumber?: string | null;
  streetName?: string | null;
  yearBuilt?: number | null;
  listDate?: string | null;
}

function formatPrice(price: number) {
  if (price >= 1000000) {
    return `$${(price / 1000000).toFixed(price % 100000 === 0 ? 1 : 2)}M`;
  }
  return `$${(price / 1000).toFixed(0)}K`;
}

function getFirstPhotoUrl(photos: Json | Json[] | undefined): string | null {
  if (!photos) return null;
  if (Array.isArray(photos)) {
    const first = photos[0];
    if (typeof first === "string") return first;
    if (first && typeof first === "object" && "MediaURL" in (first as Record<string, unknown>)) {
      return (first as Record<string, unknown>).MediaURL as string;
    }
  }
  return null;
}

export function ResaleListingCard({
  id,
  listingKey,
  price,
  originalPrice,
  address,
  city,
  neighborhood,
  propertyType,
  propertySubType,
  beds,
  baths,
  sqft,
  photos,
  daysOnMarket,
  status,
  listAgentName,
  listOfficeName,
  virtualTourUrl,
  streetNumber,
  streetName,
}: ResaleListingCardProps) {
  const displayAddress = address || [streetNumber, streetName].filter(Boolean).join(" ");
  const imageUrl = getFirstPhotoUrl(photos);
  
  // Build SEO-friendly URL
  const addressSlug = displayAddress ? slugify(displayAddress) : "";
  const citySlug = slugify(city);
  const listingUrl = addressSlug 
    ? `/properties/${addressSlug}-${citySlug}-bc-${listingKey}`
    : `/properties/${listingKey}`;

  const priceReduced = originalPrice && price < originalPrice;
  const priceReduction = priceReduced ? Math.round(((originalPrice - price) / originalPrice) * 100) : 0;

  return (
    <Link to={listingUrl} className="group block">
      <div className="rounded-xl border border-border/60 bg-card overflow-hidden transition-all duration-300 hover:shadow-lg hover:border-border hover:-translate-y-0.5">
        {/* Image */}
        <div className="relative aspect-[16/10] overflow-hidden bg-muted">
          {imageUrl ? (
            <img
              src={imageUrl}
              alt={`${displayAddress || "Property"} - ${city}`}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              loading="lazy"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-muted">
              <MapPin className="h-12 w-12 text-muted-foreground/30" />
            </div>
          )}

          {/* Status Badge */}
          {status && status !== "Active" && (
            <Badge className="absolute top-3 left-3 text-[11px] font-semibold px-2.5 py-0.5 bg-amber-500/90 text-white border-0 shadow-sm">
              {status}
            </Badge>
          )}

          {/* Price Reduced */}
          {priceReduced && priceReduction > 0 && (
            <Badge className="absolute top-3 right-3 text-[10px] font-medium bg-red-500/90 text-white border-0 shadow-sm flex items-center gap-1">
              <TrendingDown className="h-3 w-3" />
              {priceReduction}% off
            </Badge>
          )}

          {/* Virtual Tour */}
          {virtualTourUrl && (
            <div className="absolute bottom-3 right-3">
              <Badge variant="secondary" className="text-[10px] bg-background/80 backdrop-blur-sm border-0 flex items-center gap-1">
                <Video className="h-3 w-3" />
                3D Tour
              </Badge>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-3 sm:p-4 space-y-2">
          {/* Price */}
          <div className="flex items-center justify-between">
            <span className="text-base sm:text-lg font-bold text-foreground">
              {formatPrice(price)}
            </span>
            {propertySubType && (
              <Badge variant="outline" className="text-[10px] font-medium">
                {propertySubType}
              </Badge>
            )}
          </div>

          {/* Address */}
          {displayAddress && (
            <p className="text-sm font-medium text-foreground line-clamp-1">
              {displayAddress}
            </p>
          )}

          {/* Location */}
          <div className="flex items-center gap-1.5 text-muted-foreground text-xs">
            <MapPin className="h-3.5 w-3.5 shrink-0" />
            <span className="line-clamp-1">
              {neighborhood ? `${neighborhood}, ${city}` : city}
            </span>
          </div>

          {/* Stats */}
          <div className="flex items-center gap-3 text-xs text-muted-foreground pt-1">
            {beds != null && (
              <span className="flex items-center gap-1">
                <Bed className="h-3.5 w-3.5" />
                {beds}
              </span>
            )}
            {baths != null && (
              <span className="flex items-center gap-1">
                <Bath className="h-3.5 w-3.5" />
                {baths}
              </span>
            )}
            {sqft != null && (
              <span className="flex items-center gap-1">
                <Ruler className="h-3.5 w-3.5" />
                {sqft.toLocaleString()} sqft
              </span>
            )}
            {daysOnMarket != null && (
              <span className="flex items-center gap-1 ml-auto">
                <Calendar className="h-3 w-3" />
                {daysOnMarket}d
              </span>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}
