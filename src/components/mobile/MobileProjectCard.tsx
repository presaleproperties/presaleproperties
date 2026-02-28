import { useState, useRef, useCallback } from "react";
import { Link } from "react-router-dom";
import { Calendar, Building2, Home, Warehouse, MapPin, ChevronLeft, ChevronRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { generateProjectUrl } from "@/lib/seoUrls";

interface MobileProjectCardProps {
  id: string;
  slug: string;
  name: string;
  city: string;
  neighborhood: string;
  projectType: "condo" | "townhome" | "mixed" | "duplex" | "single_family";
  status?: "coming_soon" | "registering" | "active" | "sold_out";
  completionYear?: number | null;
  startingPrice?: number | null;
  depositPercent?: number | null;
  featuredImage?: string | null;
  galleryImages?: string[] | null;
  lastVerifiedDate?: string | null;
  size?: "default" | "large";
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
    case "active": return "Selling Now";
    case "registering": return "Registering";
    case "coming_soon": return "Coming Soon";
    case "sold_out": return "Sold Out";
    default: return null;
  }
};

export function MobileProjectCard({
  id,
  slug,
  name,
  city,
  neighborhood,
  projectType,
  status = "coming_soon",
  completionYear,
  startingPrice,
  depositPercent,
  featuredImage,
  galleryImages,
  lastVerifiedDate,
  size = "default",
}: MobileProjectCardProps) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const touchStartX = useRef<number | null>(null);
  const touchEndX = useRef<number | null>(null);
  const isSwiping = useRef(false);

  const statusLabel = getStatusLabel(status);
  const TypeIcon = getTypeIcon(projectType);

  const allImages = [
    featuredImage,
    ...(galleryImages || []),
  ].filter(Boolean) as string[];

  const imageCount = allImages.length;

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

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    isSwiping.current = false;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    touchEndX.current = e.touches[0].clientX;
    if (touchStartX.current && Math.abs(touchStartX.current - touchEndX.current) > 10) {
      isSwiping.current = true;
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!touchStartX.current || !touchEndX.current) return;
    const diff = touchStartX.current - touchEndX.current;
    if (Math.abs(diff) > 80 && imageCount > 1) {
      e.preventDefault();
      if (diff > 0) setCurrentImageIndex((prev) => (prev + 1) % imageCount);
      else setCurrentImageIndex((prev) => (prev - 1 + imageCount) % imageCount);
    }
    touchStartX.current = null;
    touchEndX.current = null;
  };

  const handleCardTap = (e: React.MouseEvent) => {
    if (isSwiping.current) { e.preventDefault(); return; }
    if (typeof window !== "undefined" && (window as any).gtag) {
      (window as any).gtag("event", "project_card_tap", {
        project_id: id, project_name: name, project_city: city,
      });
    }
  };

  const isLarge = size === "large";
  const projectUrl = generateProjectUrl({ slug, neighborhood, projectType });

  return (
    <Link 
      to={projectUrl} 
      onClick={handleCardTap}
      className={cn(
        "block shrink-0",
        isLarge ? "w-[calc(100vw-48px)] max-w-[420px]" : "w-[260px] md:w-[300px]"
      )}
    >
      <div className="group overflow-hidden rounded-xl bg-card border border-border/60 shadow-sm hover:shadow-md active:scale-[0.98] transition-all duration-200 h-full">
        {/* Hero Image — dominant */}
        <div 
          className={cn(
            "relative bg-muted overflow-hidden",
            isLarge ? "aspect-[16/10]" : "aspect-[3/2]"
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
                className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03] will-change-transform"
                loading="lazy"
                decoding="async"
                style={{ transform: 'translateZ(0)', contentVisibility: 'auto' }}
              />

              {/* Bottom gradient for price overlay */}
              <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/70 via-black/30 to-transparent pointer-events-none" />

              {/* Price — overlaid on image, large and prominent */}
              <div className="absolute bottom-2.5 left-3">
                {startingPrice ? (
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-white/70 text-[10px] font-medium">From</span>
                    <span className="text-white font-bold text-xl tracking-tight drop-shadow-md">
                      {formatPrice(startingPrice)}
                    </span>
                  </div>
                ) : (
                  <span className="text-white/80 text-sm font-medium">Contact for Price</span>
                )}
              </div>

              {/* Status Badge — top left */}
              {statusLabel && (
                <div className="absolute top-2.5 left-2.5">
                  <Badge className="bg-primary text-primary-foreground text-[10px] font-semibold shadow-sm px-2 py-0.5">
                    {statusLabel}
                  </Badge>
                </div>
              )}

              {/* Image nav arrows — tablet+ */}
              {imageCount > 1 && (
                <>
                  <button onClick={goToPrevImage} className="absolute left-2 top-1/2 -translate-y-1/2 h-7 w-7 rounded-full bg-black/50 backdrop-blur-sm text-white hidden md:flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity" aria-label="Previous image">
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <button onClick={goToNextImage} className="absolute right-2 top-1/2 -translate-y-1/2 h-7 w-7 rounded-full bg-black/50 backdrop-blur-sm text-white hidden md:flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity" aria-label="Next image">
                    <ChevronRight className="h-4 w-4" />
                  </button>

                  {/* Dots */}
                  <div className="absolute bottom-2.5 right-3 flex gap-1">
                    {allImages.slice(0, 5).map((_, idx) => (
                      <span key={idx} className={cn("h-1 rounded-full transition-all", idx === currentImageIndex ? "bg-white w-3" : "bg-white/40 w-1")} />
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
          <h4 className="font-semibold text-foreground text-sm leading-tight line-clamp-1 group-hover:text-primary transition-colors">
            {name}
          </h4>
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
