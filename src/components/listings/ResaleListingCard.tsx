import { useState, useRef, useCallback } from "react";
import { Link } from "react-router-dom";
import { Camera, ChevronLeft, ChevronRight, Home, Video } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
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

  // Format property type for display
  const displayType = propertySubType || propertyType || "Residential";

  return (
    <Link to={`/resale/${listingKey}`}>
      <Card className="group overflow-hidden border-border bg-card shadow-card hover:shadow-[0_8px_30px_rgb(0,0,0,0.08),0_0_0_1px_hsl(var(--primary)/0.1)] hover:border-primary/30 hover:-translate-y-1.5 transition-all duration-300 ease-out">
        <div 
          className="relative aspect-[4/3] overflow-hidden bg-muted"
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
              />
              
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
              <Home className="h-12 w-12 text-muted-foreground/50" />
            </div>
          )}
          
          {/* Gradient overlay on hover */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
          
          {/* Badges - Top Left */}
          <div className="absolute top-3 left-3 flex flex-col gap-2">
            {virtualTourUrl && (
              <Badge className="bg-foreground text-background flex items-center gap-1">
                <Video className="h-3 w-3" />
                VIRTUAL TOUR
              </Badge>
            )}
            {isNew && (
              <Badge className="bg-primary text-primary-foreground shadow-gold">
                New
              </Badge>
            )}
          </div>

          {/* Photo Count - Bottom Right */}
          {imageCount > 1 && (
            <div className="absolute bottom-3 right-3 flex items-center gap-1.5 bg-black/70 text-white text-xs font-medium px-2 py-1 rounded-md backdrop-blur-sm">
              <Camera className="h-3.5 w-3.5" />
              <span>{currentImageIndex + 1}/{imageCount}</span>
            </div>
          )}
        </div>

        <CardContent className="p-3 sm:p-4 space-y-2">
          {/* Price - Prominent */}
          <p className="text-xl sm:text-2xl font-bold text-foreground group-hover:text-primary transition-colors duration-200">
            {formatPrice(price)}
          </p>

          {/* Address */}
          <h3 className="font-medium text-foreground line-clamp-1 text-sm sm:text-base">
            {address}
          </h3>

          {/* Neighborhood • City */}
          <p className="text-xs sm:text-sm text-muted-foreground line-clamp-1">
            {neighborhood ? `${neighborhood} • ${city}` : city}
          </p>

          {/* Beds • Baths • Sqft • Type */}
          <p className="text-xs sm:text-sm text-muted-foreground">
            {beds !== null && beds !== undefined && `${beds} bd`}
            {baths !== null && baths !== undefined && ` • ${baths} ba`}
            {sqft !== null && sqft !== undefined && ` • ${sqft.toLocaleString()} sf`}
          </p>

          {/* Agent Info - REW Style */}
          {(listAgentName || listOfficeName) && (
            <div className="flex items-center gap-2 pt-2 border-t border-border">
              <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center shrink-0">
                <span className="text-xs font-medium text-muted-foreground">
                  {listAgentName ? listAgentName.charAt(0).toUpperCase() : 'A'}
                </span>
              </div>
              <div className="min-w-0">
                {listAgentName && (
                  <p className="text-xs font-medium text-foreground truncate">{listAgentName}</p>
                )}
                {listOfficeName && (
                  <p className="text-[10px] text-muted-foreground truncate">{listOfficeName}</p>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </Link>
  );
}
