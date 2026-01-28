import { Link } from "react-router-dom";
import { Bed, Bath, Maximize, MapPin, Calendar, PawPrint, Sofa } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export interface RentalListing {
  id: string;
  listing_key: string;
  lease_amount: number;
  lease_frequency: string | null;
  city: string;
  neighborhood: string | null;
  street_number: string | null;
  street_name: string | null;
  street_suffix: string | null;
  property_type: string;
  property_sub_type: string | null;
  bedrooms_total: number | null;
  bathrooms_total: number | null;
  living_area: number | null;
  latitude: number | null;
  longitude: number | null;
  photos: any;
  mls_status: string;
  availability_date: string | null;
  pets_allowed: string | null;
  furnished: string | null;
  utilities_included: string[] | null;
  list_agent_name?: string | null;
  list_office_name?: string | null;
}

interface RentalListingCardProps {
  listing: RentalListing;
  className?: string;
  variant?: "default" | "compact";
}

export function RentalListingCard({ listing, className, variant = "default" }: RentalListingCardProps) {
  // Get first photo
  const getPhoto = () => {
    if (listing.photos && Array.isArray(listing.photos) && listing.photos.length > 0) {
      return listing.photos[0]?.MediaURL || null;
    }
    return null;
  };

  const photo = getPhoto();
  const address = [listing.street_number, listing.street_name, listing.street_suffix]
    .filter(Boolean)
    .join(" ") || listing.neighborhood || listing.city;

  const formatRent = (amount: number) => {
    return `$${amount.toLocaleString()}`;
  };

  const frequency = listing.lease_frequency?.toLowerCase() || "month";
  const frequencyLabel = frequency === "monthly" || frequency === "month" ? "/mo" : `/${frequency}`;

  const isCompact = variant === "compact";

  return (
    <Link
      to={`/rentals/${listing.listing_key}`}
      className={cn(
        "group block bg-background border border-border rounded-xl overflow-hidden transition-all duration-300 hover:shadow-lg hover:border-emerald-500/50",
        isCompact && "flex h-28",
        className
      )}
    >
      {/* Image */}
      <div className={cn(
        "relative overflow-hidden bg-muted",
        isCompact ? "w-32 h-full flex-shrink-0" : "aspect-[4/3]"
      )}>
        {photo ? (
          <img
            src={photo}
            alt={address}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-muted-foreground">
            <MapPin className="h-8 w-8 opacity-30" />
          </div>
        )}
        
        {/* Rental Badge */}
        <Badge 
          className="absolute top-2 left-2 bg-emerald-600 text-white border-0 text-[10px] font-bold uppercase tracking-wide"
        >
          For Rent
        </Badge>

        {/* Pet Friendly Badge */}
        {listing.pets_allowed && listing.pets_allowed.toLowerCase() !== "no" && (
          <Badge 
            className="absolute top-2 right-2 bg-amber-500 text-white border-0 text-[10px]"
          >
            <PawPrint className="h-3 w-3 mr-1" />
            Pets OK
          </Badge>
        )}
      </div>

      {/* Content */}
      <div className={cn("p-4", isCompact && "flex-1 py-3 px-4")}>
        {/* Price */}
        <div className="flex items-baseline gap-1 mb-1">
          <span className="text-xl font-bold text-emerald-600">
            {formatRent(listing.lease_amount)}
          </span>
          <span className="text-sm text-muted-foreground">{frequencyLabel}</span>
        </div>

        {/* Address */}
        <p className="text-sm font-medium text-foreground truncate mb-2">
          {address}
        </p>

        {/* Specs Row */}
        <div className="flex items-center gap-3 text-xs text-muted-foreground mb-2">
          {listing.bedrooms_total !== null && (
            <span className="flex items-center gap-1">
              <Bed className="h-3.5 w-3.5" />
              {listing.bedrooms_total === 0 ? "Studio" : `${listing.bedrooms_total} Bed`}
            </span>
          )}
          {listing.bathrooms_total !== null && (
            <span className="flex items-center gap-1">
              <Bath className="h-3.5 w-3.5" />
              {listing.bathrooms_total} Bath
            </span>
          )}
          {listing.living_area && (
            <span className="flex items-center gap-1">
              <Maximize className="h-3.5 w-3.5" />
              {listing.living_area.toLocaleString()} sqft
            </span>
          )}
        </div>

        {/* Extra Info */}
        {!isCompact && (
          <div className="flex items-center gap-2 flex-wrap">
            {listing.furnished && listing.furnished.toLowerCase() !== "unfurnished" && (
              <Badge variant="outline" className="text-[10px] py-0.5">
                <Sofa className="h-3 w-3 mr-1" />
                Furnished
              </Badge>
            )}
            {listing.availability_date && (
              <Badge variant="outline" className="text-[10px] py-0.5">
                <Calendar className="h-3 w-3 mr-1" />
                Avail. {new Date(listing.availability_date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
              </Badge>
            )}
          </div>
        )}

        {/* Location */}
        <p className="text-xs text-muted-foreground mt-2 truncate">
          {listing.neighborhood ? `${listing.neighborhood}, ${listing.city}` : listing.city}
        </p>
      </div>
    </Link>
  );
}
