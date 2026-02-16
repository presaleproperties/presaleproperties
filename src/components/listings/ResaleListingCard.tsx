import { useState, useRef, useCallback } from "react";
import { Link } from "react-router-dom";
import { MapPin, Home, ChevronLeft, ChevronRight, Video, Building, Flame, Clock } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { getListingUrl } from "@/lib/propertiesUrls";

interface ResaleListingCardProps {
  id: string;
  listingKey: string;
  price: number;
  originalPrice?: number | null;
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
  listDate?: string | null;
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

// Market activity badge logic
const getMarketActivityBadge = (daysOnMarket: number | null) => {
  if (daysOnMarket === null || daysOnMarket === undefined) return null;
  
  if (daysOnMarket <= 7) {
    return { label: "HOT", icon: Flame, className: "bg-orange-500 text-white" };
  }
  if (daysOnMarket >= 60) {
    return { label: "OPPORTUNITY", icon: Clock, className: "bg-amber-600 text-white" };
  }
  return null;
};

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
  listDate,
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

  // Calculate days on market from list_date if daysOnMarket is null
  let calculatedDom = daysOnMarket;
  if (calculatedDom === null && listDate) {
    const listDateObj = new Date(listDate);
    const today = new Date();
    calculatedDom = Math.floor((today.getTime() - listDateObj.getTime()) / (1000 * 60 * 60 * 24));
  }
  const isNew = calculatedDom !== null && calculatedDom !== undefined && calculatedDom <= 7;
  const isLongOnMarket = calculatedDom !== null && calculatedDom !== undefined && calculatedDom >= 60;
  const isNewConstruction = yearBuilt !== null && yearBuilt !== undefined && yearBuilt >= 2024;
  const displayType = formatPropertyType(propertyType, propertySubType);
  const marketBadge = getMarketActivityBadge(calculatedDom);

  // Check for price reduction
  const isPriceReduced = originalPrice !== null && originalPrice !== undefined && originalPrice > price;
  const priceReduction = isPriceReduced ? originalPrice - price : 0;
  const priceReductionPercent = isPriceReduced ? Math.round((priceReduction / originalPrice) * 100) : 0;

  // Build specs string
  const specsArray = [];
  if (beds !== null && beds !== undefined) specsArray.push(`${beds} Bed`);
  if (baths !== null && baths !== undefined) specsArray.push(`${baths} Bath`);
  if (sqft !== null && sqft !== undefined) specsArray.push(`${sqft.toLocaleString()} Sqft`);
  const specsString = specsArray.join(" • ");

  return (
    <Link to={getListingUrl(listingKey, address, city)} className="block h-full w-full">
      <Card className="group overflow-hidden border-border/60 bg-card shadow-card hover:shadow-premium hover:border-primary/30 hover:-translate-y-2 transition-all duration-300 ease-out h-full flex flex-col rounded-2xl">
        <div 
          className={cn(
            "relative overflow-hidden bg-muted flex-shrink-0",
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
                className="h-full w-full object-cover transition-transform duration-300 ease-out group-hover:scale-105 will-change-transform backface-visibility-hidden"
                loading="lazy"
                decoding="async"
                fetchPriority="auto"
                style={{ 
                  transform: 'translateZ(0)',
                  contentVisibility: 'auto',
                }}
              />
              
              {/* Type + Status Badges - Top Left */}
              <div className="absolute top-2 left-2 sm:top-3 sm:left-3 flex flex-col gap-1">
                <Badge className="bg-emerald-600 text-white text-[9px] sm:text-[10px] font-semibold shadow-sm px-1.5 py-0.5">
                  MOVE-IN READY
                </Badge>
                {/* Price Drop Badge - Most prominent */}
                {isPriceReduced && (
                  <Badge className="bg-red-600 text-white text-[9px] sm:text-[10px] font-bold shadow-lg px-1.5 py-0.5 animate-pulse">
                    PRICE DROP -{priceReductionPercent}%
                  </Badge>
                )}
                {/* Hot Badge - New listings under 7 days */}
                {isNew && !isPriceReduced && (
                  <Badge className="bg-orange-500 text-white text-[9px] sm:text-[10px] font-semibold shadow-sm px-1.5 py-0.5 flex items-center gap-0.5">
                    <Flame className="h-2.5 w-2.5" />
                    HOT
                  </Badge>
                )}
                {/* Opportunity Badge - Long on market 60+ days */}
                {isLongOnMarket && !isPriceReduced && !isNew && (
                  <Badge className="bg-amber-600 text-white text-[9px] sm:text-[10px] font-semibold shadow-sm px-1.5 py-0.5 flex items-center gap-0.5">
                    <Clock className="h-2.5 w-2.5" />
                    OPPORTUNITY
                  </Badge>
                )}
                {isNewConstruction && (
                  <Badge className="bg-background/90 backdrop-blur-sm text-foreground text-[9px] sm:text-[10px] font-medium shadow-sm px-1.5 py-0.5 border border-border/50">
                    Built {yearBuilt}
                  </Badge>
                )}
                {virtualTourUrl && (
                  <Badge className="bg-foreground text-background text-[10px] sm:text-xs font-medium flex items-center gap-1 px-1.5 py-0.5">
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

        <CardContent className="p-2.5 sm:p-3 md:p-4 flex-1 flex flex-col min-w-0">
          <div className="flex items-start justify-between gap-1.5 sm:gap-2 min-w-0">
            {/* Left: Address, Location & Specs */}
            <div className="flex-1 min-w-0 space-y-0.5 overflow-hidden">
              <h3 className="font-semibold text-foreground line-clamp-1 group-hover:text-primary transition-colors duration-200 text-[13px] sm:text-sm md:text-base truncate">
                {address}
              </h3>
              <div className="flex items-center gap-1 text-muted-foreground min-w-0">
                <MapPin className="h-2.5 w-2.5 sm:h-3 sm:w-3 md:h-3.5 md:w-3.5 shrink-0" />
                <span className="text-[10px] sm:text-[11px] md:text-xs truncate">
                  {neighborhood ? `${neighborhood}, ${city}` : city}
                </span>
              </div>
              <p className="text-[10px] sm:text-[11px] md:text-xs text-muted-foreground truncate">
                {displayType} {specsString ? `• ${specsString}` : ""}
              </p>
            </div>

            {/* Right: Price */}
            <div className="text-right shrink-0 ml-0.5 sm:ml-1">
              <span 
                className="font-bold text-primary whitespace-nowrap"
                style={{ fontSize: '1.5rem', lineHeight: 1.1 }}
              >
                {formatPrice(price)}
              </span>
              {sqft && sqft > 0 && (
                <span className="text-[9px] sm:text-[10px] md:text-xs text-muted-foreground block leading-tight whitespace-nowrap">
                  ${Math.round(price / sqft)}/sqft
                </span>
              )}
            </div>
          </div>

          {/* Listed by Agent & Brokerage */}
          <div className="mt-auto pt-1 sm:pt-1.5">
            <div className="pt-1 sm:pt-1.5 border-t border-border">
              <div className="flex items-center gap-1 text-[8px] sm:text-[9px] md:text-[10px] text-muted-foreground min-w-0">
                <Building className="h-2 w-2 sm:h-2.5 sm:w-2.5 md:h-3 md:w-3 shrink-0" />
                <span className="truncate">
                  Listed by {listOfficeName || "MLS®"}
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
