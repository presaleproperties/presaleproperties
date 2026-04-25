import { useState, useRef, useCallback } from "react";
import { Link } from "react-router-dom";
import { MapPin, Building2, Home, Warehouse, Calendar, ChevronLeft, ChevronRight, Sparkles } from "lucide-react";
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
  /** Show a green "Incentive" badge in the top-right of the image. */
  hasIncentive?: boolean;
}

const formatPrice = (price: number) => {
  if (price >= 1000000) {
    const m = price / 1000000;
    return `$${m % 1 === 0 ? m.toFixed(0) : m.toFixed(1)}M`;
  }
  return new Intl.NumberFormat('en-CA', {
    style: 'currency',
    currency: 'CAD',
    maximumFractionDigits: 0,
  }).format(price);
};

const formatType = (type: string) => {
  const typeMap: Record<string, string> = {
    condo: "Condo",
    townhome: "Townhome",
    mixed: "Mixed",
    duplex: "Duplex",
    single_family: "House",
  };
  return typeMap[type] || type.charAt(0).toUpperCase() + type.slice(1);
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
  hasIncentive = false,
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

  const TypeIcon = getTypeIcon(projectType);

  return (
    <Link to={projectUrl}>
      <div className="group overflow-hidden rounded-xl bg-card border border-border/60 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-200 h-full">
        {/* Hero Image */}
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
                className="h-full w-full object-cover transition-transform duration-300 ease-out group-hover:scale-[1.03] will-change-transform"
                loading="lazy"
                decoding="async"
                style={{ transform: 'translateZ(0)', contentVisibility: 'auto' }}
              />

              {/* Bottom gradient for price overlay */}
              <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-neutral-900/70 via-neutral-900/30 to-transparent pointer-events-none" />

              {/* Price — overlaid on image */}
              <div className="absolute bottom-3 left-3">
                {startingPrice ? (
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-on-dark/70 text-xs font-medium">From</span>
                    <span className="text-on-dark font-bold text-2xl lg:text-xl tracking-tight drop-shadow-md">
                      {formatPrice(startingPrice)}
                    </span>
                  </div>
                ) : (
                  <span className="text-on-dark/80 text-sm font-medium">Contact for Price</span>
                )}
              </div>

              {/* Status Badge — top left */}
              {statusLabel && (
                <div className="absolute top-3 left-3">
                  <Badge className="bg-primary text-primary-foreground text-[10px] font-semibold shadow-sm px-2 py-0.5">
                    {statusLabel}
                  </Badge>
                </div>
              )}

              {/* Incentive Badge — top right */}
              {hasIncentive && (
                <div className="absolute top-3 right-3">
                  <Badge className="bg-success text-success-foreground hover:bg-success text-[10px] font-bold shadow-sm px-2 py-0.5 gap-1 uppercase tracking-wide">
                    <Sparkles className="h-2.5 w-2.5" />
                    Incentive
                  </Badge>
                </div>
              )}

              {/* Image navigation arrows */}
              {imageCount > 1 && (
                <>
                  <button
                    onClick={goToPrevImage}
                    className="absolute left-2 top-1/2 -translate-y-1/2 h-7 w-7 rounded-full bg-neutral-900/50 backdrop-blur-sm text-on-dark flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    aria-label="Previous image"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <button
                    onClick={goToNextImage}
                    className="absolute right-2 top-1/2 -translate-y-1/2 h-7 w-7 rounded-full bg-neutral-900/50 backdrop-blur-sm text-on-dark flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    aria-label="Next image"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>

                  {/* Dots */}
                  <div className="absolute bottom-3 right-3 flex gap-1">
                    {allImages.slice(0, 5).map((_, idx) => (
                      <span
                        key={idx}
                        className={cn(
                          "h-1 rounded-full transition-all",
                          idx === currentImageIndex ? "bg-card w-3" : "bg-card/40 w-1"
                        )}
                      />
                    ))}
                  </div>
                </>
              )}
            </>
          ) : (
            <div className="h-full w-full flex items-center justify-center bg-muted">
              <Building2 className="h-10 w-10 text-muted-foreground/40" />
            </div>
          )}
        </div>

        {/* Info — compact and clean */}
        <div className="px-3 py-2.5 space-y-1">
          <h3 className="font-semibold text-foreground text-sm leading-tight line-clamp-1 group-hover:text-primary transition-colors">
            {name}
          </h3>
          <div className="flex items-center gap-2 text-muted-foreground text-[11px]">
            <span className="flex items-center gap-1">
              <TypeIcon className="h-3 w-3 shrink-0" />
              {formatType(projectType)}
            </span>
            <span className="text-border">·</span>
            <span className="flex items-center gap-1">
              <MapPin className="h-3 w-3 shrink-0" />
              {city}
            </span>
            {completionYear && (
              <>
                <span className="text-border">·</span>
                <span className="flex items-center gap-1">
                  <Calendar className="h-3 w-3 shrink-0" />
                  {completionYear}
                </span>
              </>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}
