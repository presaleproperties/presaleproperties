import { useState, useRef, useCallback } from "react";
import { Link } from "react-router-dom";
import { MapPin, Building2, Home, Warehouse, Calendar, ChevronLeft, ChevronRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { generateProjectUrl } from "@/lib/seoUrls";

interface PresaleProjectCardProps {
  id: string;
  slug: string;
  name: string;
  city: string;
  neighborhood: string;
  projectType: "condo" | "townhome" | "mixed" | "duplex" | "single_family";
  status?: "coming_soon" | "registering" | "active" | "sold_out";
  completionYear?: number | null;
  startingPrice?: number | null;
  featuredImage?: string | null;
  galleryImages?: string[] | null;
  lastVerifiedDate?: string | null;
  size?: "default" | "large" | "featured";
}

const formatPrice = (price: number) => {
  return new Intl.NumberFormat('en-CA', {
    style: 'currency',
    currency: 'CAD',
    maximumFractionDigits: 0,
  }).format(price);
};

const formatType = (type: string) => {
  const typeMap: Record<string, string> = {
    condo: "Condos",
    townhome: "Townhomes",
    mixed: "Mixed",
    duplex: "Duplexes",
    single_family: "Single Family Homes",
  };
  return typeMap[type] || type.charAt(0).toUpperCase() + type.slice(1) + "s";
};

const getTypeIcon = (type: string) => {
  switch (type) {
    case "condo": return Building2;
    case "townhome": return Warehouse;
    case "single_family": return Home;
    case "duplex": return Home;
    default: return Building2;
  }
};

const getStatusLabel = (status: string) => {
  switch (status) {
    case "active":
      return "Selling Now";
    case "registering":
      return "Registering";
    case "coming_soon":
      return "Coming Soon";
    case "sold_out":
      return "Sold Out";
    default:
      return null;
  }
};

export function PresaleProjectCard({
  id,
  slug,
  name,
  city,
  neighborhood,
  projectType,
  status = "coming_soon",
  completionYear,
  startingPrice,
  featuredImage,
  galleryImages,
  size = "default",
}: PresaleProjectCardProps) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const touchStartX = useRef<number | null>(null);
  const touchEndX = useRef<number | null>(null);

  // Combine featured image with gallery images
  const allImages = [
    featuredImage,
    ...(galleryImages || []),
  ].filter(Boolean) as string[];

  const imageCount = allImages.length;

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

  const statusLabel = getStatusLabel(status);
  
  // Generate SEO-friendly URL
  const projectUrl = generateProjectUrl({
    slug,
    neighborhood,
    projectType,
  });

  return (
    <Link to={projectUrl}>
      <Card className="group overflow-hidden border-border/80 bg-card shadow-card hover:shadow-premium hover:border-primary/30 hover:-translate-y-1.5 transition-all duration-300 ease-out h-full">
        <div
          className={cn(
            "relative overflow-hidden bg-muted",
            size === "featured" ? "aspect-[16/9]" : size === "large" ? "aspect-[3/2]" : "aspect-[4/3]"
          )}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          {allImages.length > 0 ? (
            <>
              <img
                src={allImages[currentImageIndex]}
                alt={name}
                className="h-full w-full object-cover transition-transform duration-300 ease-out group-hover:scale-[1.03] will-change-transform backface-visibility-hidden"
                loading="lazy"
                decoding="async"
                fetchPriority="auto"
                style={{ 
                  transform: 'translateZ(0)',
                  contentVisibility: 'auto',
                }}
              />
              
              {/* Status Badge - Top Left */}
              {statusLabel && (
                <div className="absolute top-2 left-2 sm:top-3 sm:left-3">
                  <Badge 
                    className="bg-primary text-primary-foreground text-[9px] sm:text-xs font-bold shadow-gold px-2.5 py-0.5 tracking-wide"
                  >
                    {statusLabel}
                  </Badge>
                </div>
              )}
              
              {/* Image navigation arrows */}
              {imageCount > 1 && (
                <>
                  <button
                    onClick={goToPrevImage}
                    className="absolute left-2 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full bg-black/60 backdrop-blur-sm text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-200 hover:bg-black/80 hover:scale-110"
                    aria-label="Previous image"
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </button>
                  <button
                    onClick={goToNextImage}
                    className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full bg-black/60 backdrop-blur-sm text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-200 hover:bg-black/80 hover:scale-110"
                    aria-label="Next image"
                  >
                    <ChevronRight className="h-5 w-5" />
                  </button>
                  
                  {/* Dots indicator */}
                  <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
                    {allImages.slice(0, 5).map((_, idx) => (
                      <span
                        key={idx}
                        className={cn(
                          "h-1.5 rounded-full transition-all duration-200",
                          idx === currentImageIndex 
                            ? "bg-white w-4 shadow-sm" 
                            : "bg-white/50 w-1.5"
                        )}
                      />
                    ))}
                    {imageCount > 5 && (
                      <span className="text-white text-xs ml-1 font-medium">+{imageCount - 5}</span>
                    )}
                  </div>
                </>
              )}
            </>
          ) : (
            <div className="h-full w-full flex items-center justify-center bg-gradient-to-br from-muted via-muted to-muted/80">
              <Building2 className="h-12 w-12 text-muted-foreground/50" />
            </div>
          )}
          
          {/* Premium gradient overlay on hover */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />

          {/* Photo Count - Bottom Right */}
          {imageCount > 1 && (
            <div className="absolute bottom-3 right-3 flex items-center gap-1.5 bg-black/70 backdrop-blur-sm text-white text-xs font-semibold px-2 py-1 rounded-md">
              <span>{currentImageIndex + 1}/{imageCount}</span>
            </div>
          )}
        </div>

        <CardContent className="px-3 py-2.5 sm:px-4 sm:py-3 min-w-0">
          <div className="flex items-start justify-between gap-2 min-w-0">
            {/* Left: Name & Details */}
            <div className="flex-1 min-w-0 space-y-1 overflow-hidden">
              <h3 className="font-semibold text-foreground line-clamp-1 group-hover:text-primary transition-colors duration-200 text-sm sm:text-base leading-tight tracking-tight">
                {name}
              </h3>
              <div className="flex items-center gap-3 text-muted-foreground flex-wrap">
                <span className="flex items-center gap-1 text-xs">
                  {(() => { const TypeIcon = getTypeIcon(projectType); return <TypeIcon className="h-3 w-3 shrink-0" />; })()}
                  {formatType(projectType)}
                </span>
                <span className="flex items-center gap-1 text-xs">
                  <MapPin className="h-3 w-3 shrink-0" />
                  {city}
                </span>
                {completionYear && (
                  <span className="flex items-center gap-1 text-xs">
                    <Calendar className="h-3 w-3 shrink-0" />
                    {completionYear}
                  </span>
                )}
              </div>
            </div>

            {/* Right: Price */}
            <div className="text-right shrink-0">
              {startingPrice ? (
                <>
                  <span className="text-[10px] text-muted-foreground block leading-tight whitespace-nowrap font-medium">From</span>
                  <span className="text-sm sm:text-base font-bold text-primary whitespace-nowrap tracking-tight">
                    {formatPrice(startingPrice)}
                  </span>
                </>
              ) : (
                <span className="text-xs text-muted-foreground whitespace-nowrap font-medium">Contact</span>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
