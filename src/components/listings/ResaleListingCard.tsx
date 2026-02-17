import { useState, useRef, useCallback } from "react";
import { Link } from "react-router-dom";
import { MapPin, Home, ChevronLeft, ChevronRight, Video, Building, Building2, Warehouse, Flame, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
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
  if (price >= 1000000) {
    const m = price / 1000000;
    return `$${m % 1 === 0 ? m.toFixed(0) : m.toFixed(1)}M`;
  }
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
      "Townhouse": "Townhome",
      "Row/Townhouse": "Townhome",
      "Single Family": "House",
      "Duplex": "Duplex",
    };
    if (subTypeMap[subType]) return subTypeMap[subType];
  }
  if (!type) return "Home";
  const typeMap: Record<string, string> = {
    "Apartment/Condo": "Condo",
    "Residential": "Home",
    "Townhouse": "Townhome",
    "Single Family": "House",
    "House": "House",
  };
  return typeMap[type] || type;
};

const getTypeIcon = (type: string) => {
  const lower = type.toLowerCase();
  if (lower.includes("condo") || lower.includes("apartment")) return Building2;
  if (lower.includes("town") || lower.includes("row")) return Warehouse;
  return Home;
};

const isMobile = () => typeof window !== "undefined" && window.innerWidth < 768;

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
    if (imageCount > 1) setCurrentImageIndex((prev) => (prev + 1) % imageCount);
  }, [imageCount]);

  const goToPrevImage = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (imageCount > 1) setCurrentImageIndex((prev) => (prev - 1 + imageCount) % imageCount);
  }, [imageCount]);

  const handleTouchStart = (e: React.TouchEvent) => { touchStartX.current = e.touches[0].clientX; };
  const handleTouchMove = (e: React.TouchEvent) => { touchEndX.current = e.touches[0].clientX; };
  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!touchStartX.current || !touchEndX.current) return;
    const diff = touchStartX.current - touchEndX.current;
    if (Math.abs(diff) > 50 && imageCount > 1) {
      e.preventDefault();
      if (diff > 0) setCurrentImageIndex((prev) => (prev + 1) % imageCount);
      else setCurrentImageIndex((prev) => (prev - 1 + imageCount) % imageCount);
    }
    touchStartX.current = null;
    touchEndX.current = null;
  };

  let calculatedDom = daysOnMarket;
  if (calculatedDom === null && listDate) {
    const listDateObj = new Date(listDate);
    const today = new Date();
    calculatedDom = Math.floor((today.getTime() - listDateObj.getTime()) / (1000 * 60 * 60 * 24));
  }
  const isNew = calculatedDom !== null && calculatedDom !== undefined && calculatedDom <= 7;
  const isLongOnMarket = calculatedDom !== null && calculatedDom !== undefined && calculatedDom >= 60;
  const displayType = formatPropertyType(propertyType, propertySubType);
  const TypeIcon = getTypeIcon(displayType);

  const isPriceReduced = originalPrice !== null && originalPrice !== undefined && originalPrice > price;
  const priceReductionPercent = isPriceReduced ? Math.round(((originalPrice - price) / originalPrice) * 100) : 0;

  const specsArray = [];
  if (beds !== null && beds !== undefined) specsArray.push(`${beds} Bd`);
  if (baths !== null && baths !== undefined) specsArray.push(`${baths} Ba`);
  if (sqft !== null && sqft !== undefined) specsArray.push(`${sqft.toLocaleString()} sf`);

  // --- MOBILE LAYOUT (matches presale card style) ---
  const mobileLayout = (
    <div className="group overflow-hidden rounded-xl bg-card border border-border/40 shadow-sm active:scale-[0.98] transition-all duration-200 h-full flex flex-col">
      {/* Hero Image */}
      <div 
        className="relative bg-muted overflow-hidden aspect-[3/2]"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {imageCount > 0 ? (
          <>
            <img
              src={photoUrls[currentImageIndex]}
              alt={address}
              className="h-full w-full object-cover will-change-transform"
              loading="lazy"
              decoding="async"
              style={{ transform: 'translateZ(0)', contentVisibility: 'auto' }}
            />

            {/* Bottom gradient for price */}
            <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/70 via-black/30 to-transparent pointer-events-none" />

            {/* Price overlay */}
            <div className="absolute bottom-2.5 left-3">
              <span className="text-white font-bold text-2xl lg:text-xl tracking-tight drop-shadow-md">
                {formatPrice(price)}
              </span>
              {sqft && sqft > 0 && (
                <span className="text-white/60 text-[10px] font-medium ml-1.5">
                  ${Math.round(price / sqft)}/sf
                </span>
              )}
            </div>

            {/* Top badges */}
            <div className="absolute top-2.5 left-2.5 flex flex-col gap-1">
              <Badge className="bg-emerald-600 text-white text-[10px] font-semibold shadow-sm px-2 py-0.5">
                MOVE-IN READY
              </Badge>
              {isPriceReduced && (
                <Badge className="bg-red-600 text-white text-[10px] font-bold shadow-sm px-2 py-0.5">
                  -{priceReductionPercent}% DROP
                </Badge>
              )}
              {isNew && !isPriceReduced && (
                <Badge className="bg-orange-500 text-white text-[10px] font-semibold shadow-sm px-2 py-0.5 flex items-center gap-0.5">
                  <Flame className="h-2.5 w-2.5" /> NEW
                </Badge>
              )}
              {isLongOnMarket && !isPriceReduced && !isNew && (
                <Badge className="bg-amber-600 text-white text-[10px] font-semibold shadow-sm px-2 py-0.5 flex items-center gap-0.5">
                  <Clock className="h-2.5 w-2.5" /> OPPORTUNITY
                </Badge>
              )}
            </div>

            {/* Dots */}
            {imageCount > 1 && (
              <div className="absolute bottom-2.5 right-3 flex gap-1">
                {photoUrls.slice(0, 5).map((_, idx) => (
                  <span key={idx} className={cn("h-1 rounded-full transition-all", idx === currentImageIndex ? "bg-white w-3" : "bg-white/40 w-1")} />
                ))}
              </div>
            )}
          </>
        ) : (
          <div className="h-full w-full flex items-center justify-center bg-muted">
            <Home className="h-10 w-10 text-muted-foreground/40" />
          </div>
        )}
      </div>

      {/* Info — compact */}
      <div className="px-3 py-2.5 space-y-1 flex-1">
        <h4 className="font-semibold text-foreground text-sm leading-tight line-clamp-1">
          {address}
        </h4>
        <div className="flex items-center gap-2 text-muted-foreground text-[11px]">
          <span className="flex items-center gap-1">
            <TypeIcon className="h-3 w-3 shrink-0" />
            {displayType}
          </span>
          <span className="text-border">·</span>
          <span className="flex items-center gap-1">
            <MapPin className="h-3 w-3 shrink-0" />
            {city}
          </span>
          {specsArray.length > 0 && (
            <>
              <span className="text-border">·</span>
              <span>{specsArray.join(" · ")}</span>
            </>
          )}
        </div>
        {/* Brokerage compliance */}
        <div className="flex items-center gap-1 text-[9px] text-muted-foreground/70 pt-0.5">
          <Building className="h-2 w-2 shrink-0" />
          <span className="truncate">{listOfficeName || "MLS®"}</span>
        </div>
      </div>
    </div>
  );

  // --- DESKTOP LAYOUT (original style, unchanged) ---
  const desktopLayout = (
    <Card className="group overflow-hidden border-border/40 bg-card shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300 ease-out h-full flex flex-col">
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
                  style={{ transform: 'translateZ(0)', contentVisibility: 'auto' }}
                />

                {/* Bottom gradient for price overlay */}
                <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/70 via-black/30 to-transparent pointer-events-none" />

                {/* Price — overlaid on image */}
                <div className="absolute bottom-3 left-3">
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-white font-bold text-2xl lg:text-xl tracking-tight drop-shadow-md">
                      {formatPrice(price)}
                    </span>
                    {sqft && sqft > 0 && (
                      <span className="text-white/60 text-[10px] font-medium">
                        ${Math.round(price / sqft)}/sf
                      </span>
                    )}
                  </div>
                </div>
            
                <div className="absolute top-2 left-2 sm:top-3 sm:left-3 flex flex-col gap-1">
                  <Badge className="bg-emerald-600 text-white text-[9px] sm:text-[10px] font-semibold shadow-sm px-1.5 py-0.5">
                    MOVE-IN READY
                  </Badge>
                  {isPriceReduced && (
                    <Badge className="bg-red-600 text-white text-[9px] sm:text-[10px] font-bold shadow-lg px-1.5 py-0.5 animate-pulse">
                      PRICE DROP -{priceReductionPercent}%
                    </Badge>
                  )}
                  {isNew && !isPriceReduced && (
                    <Badge className="bg-orange-500 text-white text-[9px] sm:text-[10px] font-semibold shadow-sm px-1.5 py-0.5 flex items-center gap-0.5">
                      <Flame className="h-2.5 w-2.5" /> HOT
                    </Badge>
                  )}
                  {isLongOnMarket && !isPriceReduced && !isNew && (
                    <Badge className="bg-amber-600 text-white text-[9px] sm:text-[10px] font-semibold shadow-sm px-1.5 py-0.5 flex items-center gap-0.5">
                      <Clock className="h-2.5 w-2.5" /> OPPORTUNITY
                    </Badge>
                  )}
                  {yearBuilt && yearBuilt >= 2024 && (
                    <Badge className="bg-background/90 backdrop-blur-sm text-foreground text-[9px] sm:text-[10px] font-medium shadow-sm px-1.5 py-0.5 border border-border/50">
                      Built {yearBuilt}
                    </Badge>
                  )}
                  {virtualTourUrl && (
                    <Badge className="bg-foreground text-background text-[10px] sm:text-xs font-medium flex items-center gap-1 px-1.5 py-0.5">
                      <Video className="h-3 w-3" /> 3D Tour
                    </Badge>
                  )}
                </div>
            
                {imageCount > 1 && (
                  <>
                    <button onClick={goToPrevImage} className="absolute left-2 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full bg-black/50 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/70" aria-label="Previous image">
                      <ChevronLeft className="h-5 w-5" />
                    </button>
                    <button onClick={goToNextImage} className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full bg-black/50 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/70" aria-label="Next image">
                      <ChevronRight className="h-5 w-5" />
                    </button>
                    <div className="absolute bottom-3 right-3 flex gap-1">
                      {photoUrls.slice(0, 5).map((_, idx) => (
                        <span key={idx} className={cn("h-1 rounded-full transition-all", idx === currentImageIndex ? "bg-white w-3" : "bg-white/40 w-1")} />
                      ))}
                      {imageCount > 5 && <span className="text-white text-xs ml-1">+{imageCount - 5}</span>}
                    </div>
                  </>
                )}
              </>
            ) : (
              <div className="h-full w-full flex items-center justify-center bg-gradient-to-br from-muted to-muted/50">
                <Home className="h-12 w-12 text-muted-foreground" />
              </div>
            )}
          </div>

          <CardContent className="p-2.5 sm:p-3 md:p-4 flex-1 flex flex-col min-w-0">
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
                {displayType} {specsArray.length > 0 ? `• ${specsArray.join(" • ")}` : ""}
              </p>
            </div>
            <div className="mt-auto pt-1 sm:pt-1.5">
              <div className="pt-1 sm:pt-1.5 border-t border-border">
                <div className="flex items-center gap-1 text-[8px] sm:text-[9px] md:text-[10px] text-muted-foreground min-w-0">
                  <Building className="h-2 w-2 sm:h-2.5 sm:w-2.5 md:h-3 md:w-3 shrink-0" />
                  <span className="truncate">Listed by {listOfficeName || "MLS®"}</span>
                </div>
              </div>
            </div>
          </CardContent>
    </Card>
  );

  return (
    <Link to={getListingUrl(listingKey, address, city)} className="block h-full w-full">
      {/* Mobile: new minimal layout. Desktop: original layout */}
      <div className="md:hidden">{mobileLayout}</div>
      <div className="hidden md:block h-full">{desktopLayout}</div>
    </Link>
  );
}
