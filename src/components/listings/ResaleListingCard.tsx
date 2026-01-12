import { useState, useRef, useCallback } from "react";
import { Link } from "react-router-dom";
import { MapPin, Home, ChevronLeft, ChevronRight, Video, Sparkles, Building } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface ResaleListingCardProps {
  id: string;
  listingKey: string;
  price: number;
  address: string;
  city: string;
  neighborhood?: string | null;
  propertyType: string;
  propertySubType?: string | null;
  beds?: number | null;
  baths?: number | null;
  sqft?: number | null;
  photos?: any[];
  daysOnMarket?: number | null;
  status?: string;
  listAgentName?: string | null;
  listOfficeName?: string | null;
  virtualTourUrl?: string | null;
  yearBuilt?: number | null;
  size?: "default" | "large" | "featured";
}

const formatPrice = (price: number) => {
  return new Intl.NumberFormat("en-CA", {
    style: "currency",
    currency: "CAD",
    maximumFractionDigits: 0,
  }).format(price);
};

function getPhotoUrl(photos: any[] | null | undefined, index: number): string | null {
  if (!photos || !Array.isArray(photos) || photos.length === 0) return null;
  const photo = photos[index];
  if (!photo) return null;
  return photo?.MediaURL || photo?.url || (typeof photo === 'string' ? photo : null);
}

const formatPropertyType = (type: string | null, subType?: string | null) => {
  if (subType) {
    const subTypeMap: Record<string, string> = {
      "Apartment/Condo": "Condo",
      "Townhouse": "Townhouse",
      "Row/Townhouse": "Townhouse",
      "Single Family": "House",
      "Duplex": "Duplex",
    };
    if (subTypeMap[subType]) return subTypeMap[subType];
  }
  if (!type) return "Home";
  const typeMap: Record<string, string> = {
    "Apartment/Condo": "Condo",
    "Residential": "Home",
    "Townhouse": "Townhouse",
    "Single Family": "House",
    "House": "House",
  };
  return typeMap[type] || type;
};

export function ResaleListingCard({
  id,
  listingKey,
  price,
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
  status = "Active",
  listAgentName,
  listOfficeName,
  virtualTourUrl,
  yearBuilt,
  size = "default",
}: ResaleListingCardProps) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const touchStartX = useRef<number | null>(null);
  const touchEndX = useRef<number | null>(null);

  const photoUrls = photos?.map((_, i) => getPhotoUrl(photos, i)).filter(Boolean) as string[] || [];
  const imageCount = photoUrls.length;

  const goToNextImage = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (imageCount > 1) {
      setCurrentImageIndex((prev) => (prev + 1) % imageCount);
    }
  }, [imageCount]);

  const goToPrevImage = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (imageCount > 1) {
      setCurrentImageIndex((prev) => (prev - 1 + imageCount) % imageCount);
    }
  }, [imageCount]);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    touchEndX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!touchStartX.current || !touchEndX.current) return;
    
    const diff = touchStartX.current - touchEndX.current;
    const threshold = 50;

    if (Math.abs(diff) > threshold && imageCount > 1) {
      e.preventDefault();
      if (diff > 0) {
        setCurrentImageIndex((prev) => (prev + 1) % imageCount);
      } else {
        setCurrentImageIndex((prev) => (prev - 1 + imageCount) % imageCount);
      }
    }

    touchStartX.current = null;
    touchEndX.current = null;
  };

  const isNew = daysOnMarket !== null && daysOnMarket !== undefined && daysOnMarket <= 7;
  const isNewConstruction = yearBuilt !== null && yearBuilt !== undefined && yearBuilt >= 2024;
  const displayType = formatPropertyType(propertyType, propertySubType);

  // Build specs string
  const specsArray = [];
  if (beds !== null && beds !== undefined) specsArray.push(`${beds} Bed`);
  if (baths !== null && baths !== undefined) specsArray.push(`${baths} Bath`);
  if (sqft !== null && sqft !== undefined) specsArray.push(`${sqft.toLocaleString()} Sqft`);
  const specsString = specsArray.join(" • ");

  return (
    <Link to={`/resale/${listingKey}`}>
      <Card className="group overflow-hidden border-border bg-card shadow-card hover:shadow-[0_8px_40px_rgb(0,0,0,0.12),0_0_0_1px_hsl(var(--primary)/0.2),0_0_20px_hsl(var(--primary)/0.15)] hover:border-primary/40 hover:-translate-y-2 transition-all duration-300 ease-out h-full">
        <div 
          className={cn(
            "relative overflow-hidden bg-muted",
            size === "featured" ? "aspect-[16/9]" : size === "large" ? "aspect-[3/2]" : "aspect-[4/3]"
          )}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          {imageCount > 0 ? (
            <>
              <img
                src={photoUrls[currentImageIndex]}
                alt={address}
                className="h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-110"
                loading="lazy"
                decoding="async"
              />
              
              {/* Status Badge - Top Left (matching presale style) */}
              <div className="absolute top-2 left-2 sm:top-3 sm:left-3 flex flex-col gap-1.5">
                {isNewConstruction ? (
                  <Badge className="bg-emerald-600 text-white text-[10px] sm:text-xs font-medium shadow-sm px-1.5 py-0.5 sm:px-2 sm:py-1 flex items-center gap-1">
                    <Sparkles className="h-3 w-3" />
                    New Build {yearBuilt}
                  </Badge>
                ) : isNew ? (
                  <Badge className="bg-primary text-primary-foreground text-[10px] sm:text-xs font-medium shadow-sm px-1.5 py-0.5 sm:px-2 sm:py-1">
                    Just Listed
                  </Badge>
                ) : (
                  <Badge className="bg-primary text-primary-foreground text-[10px] sm:text-xs font-medium shadow-sm px-1.5 py-0.5 sm:px-2 sm:py-1">
                    Move-In Ready
                  </Badge>
                )}
                {virtualTourUrl && (
                  <Badge className="bg-foreground text-background text-[10px] sm:text-xs font-medium flex items-center gap-1 px-1.5 py-0.5 sm:px-2 sm:py-1">
                    <Video className="h-3 w-3" />
                    3D Tour
                  </Badge>
                )}
              </div>
              
              {/* Image navigation arrows */}
              {imageCount > 1 && (
                <>
                  <button
                    onClick={goToPrevImage}
                    className="absolute left-2 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full bg-black/50 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/70"
                    aria-label="Previous image"
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </button>
                  <button
                    onClick={goToNextImage}
                    className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full bg-black/50 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/70"
                    aria-label="Next image"
                  >
                    <ChevronRight className="h-5 w-5" />
                  </button>
                  
                  {/* Dots indicator */}
                  <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
                    {photoUrls.slice(0, 5).map((_, idx) => (
                      <span
                        key={idx}
                        className={cn(
                          "h-1.5 w-1.5 rounded-full transition-all",
                          idx === currentImageIndex 
                            ? "bg-white w-3" 
                            : "bg-white/50"
                        )}
                      />
                    ))}
                    {imageCount > 5 && (
                      <span className="text-white text-xs ml-1">+{imageCount - 5}</span>
                    )}
                  </div>
                </>
              )}
            </>
          ) : (
            <div className="h-full w-full flex items-center justify-center bg-gradient-to-br from-muted to-muted/50">
              <Home className="h-12 w-12 text-muted-foreground" />
            </div>
          )}
          
          {/* Gradient overlay on hover */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />

          {/* Photo Count - Bottom Right */}
          {imageCount > 1 && (
            <div className="absolute bottom-3 right-3 flex items-center gap-1.5 bg-black/70 text-white text-xs font-medium px-2 py-1 rounded-md backdrop-blur-sm">
              <span>{currentImageIndex + 1}/{imageCount}</span>
            </div>
          )}
        </div>

        <CardContent className="p-3 sm:p-4">
          <div className="flex items-start justify-between gap-3">
            {/* Left: Address, Location & Specs */}
            <div className="flex-1 min-w-0 space-y-1">
              <h3 className="font-semibold text-foreground line-clamp-1 group-hover:text-primary transition-colors duration-200 text-sm sm:text-base">
                {address}
              </h3>
              <div className="flex items-center gap-1.5 text-muted-foreground">
                <MapPin className="h-3.5 w-3.5 shrink-0" />
                <span className="text-xs sm:text-sm truncate">
                  {neighborhood ? `${neighborhood}, ${city}` : city}
                </span>
              </div>
              <p className="text-xs sm:text-sm text-muted-foreground">
                {displayType} {specsString ? `• ${specsString}` : ""}
              </p>
            </div>

            {/* Right: Price */}
            <div className="text-right shrink-0">
              <span className="text-sm sm:text-base md:text-lg font-bold text-foreground group-hover:text-primary transition-colors duration-200">
                {formatPrice(price)}
              </span>
              {sqft && sqft > 0 && (
                <span className="text-[10px] sm:text-xs text-muted-foreground block leading-tight">
                  ${Math.round(price / sqft)}/sqft
                </span>
              )}
            </div>
          </div>

          {/* Listed by Agent & Brokerage - Bottom badge matching presale style */}
          {(listAgentName || listOfficeName) && (
            <div className="mt-3 pt-2 border-t border-border">
              <div className="flex items-center gap-1.5 text-[10px] sm:text-xs text-muted-foreground">
                <Building className="h-3 w-3 shrink-0" />
                <span className="truncate">
                  Listed by {listAgentName && listOfficeName 
                    ? `${listAgentName} • ${listOfficeName}`
                    : listAgentName || listOfficeName}
                </span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </Link>
  );
}
