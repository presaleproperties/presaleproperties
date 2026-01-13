import { useState, useRef, useCallback } from "react";
import { Link } from "react-router-dom";
import { MapPin, Building2, ChevronLeft, ChevronRight } from "lucide-react";
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
          {allImages.length > 0 ? (
            <>
              <img
                src={allImages[currentImageIndex]}
                alt={name}
                className="h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-110"
                loading="lazy"
                decoding="async"
              />
              
              {/* Status Badge - Top Left */}
              {statusLabel && (
                <Badge 
                  className="absolute top-2 left-2 sm:top-3 sm:left-3 bg-primary text-primary-foreground text-[10px] sm:text-xs font-medium shadow-sm px-1.5 py-0.5 sm:px-2 sm:py-1"
                >
                  {statusLabel}
                </Badge>
              )}
              
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
                    {allImages.slice(0, 5).map((_, idx) => (
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
              <Building2 className="h-12 w-12 text-muted-foreground" />
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

        <CardContent className="p-3 sm:p-4 min-w-0">
          <div className="flex items-start justify-between gap-2 min-w-0">
            {/* Left: Name, Location & Type */}
            <div className="flex-1 min-w-0 space-y-0.5 overflow-hidden">
              <h3 className="font-semibold text-foreground line-clamp-1 group-hover:text-primary transition-colors duration-200 text-sm sm:text-base truncate">
                {name}
              </h3>
              <div className="flex items-center gap-1 text-muted-foreground min-w-0">
                <MapPin className="h-3 w-3 sm:h-3.5 sm:w-3.5 shrink-0" />
                <span className="text-[11px] sm:text-xs truncate">
                  {city}
                </span>
              </div>
              <p className="text-[11px] sm:text-xs text-muted-foreground truncate">
                {formatType(projectType)} • {completionYear ? `${completionYear}` : "Coming Soon"}
              </p>
            </div>

            {/* Right: Price */}
            <div className="text-right shrink-0 ml-1">
              {startingPrice ? (
                <>
                  <span className="text-[9px] sm:text-[10px] text-muted-foreground block leading-tight whitespace-nowrap">From</span>
                  <span className="text-sm sm:text-base font-bold text-foreground group-hover:text-primary transition-colors duration-200 whitespace-nowrap">
                    {formatPrice(startingPrice)}
                  </span>
                </>
              ) : (
                <span className="text-[11px] sm:text-xs text-muted-foreground whitespace-nowrap">Contact for pricing</span>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
