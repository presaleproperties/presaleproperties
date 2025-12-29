import { useState, useRef, useCallback } from "react";
import { Link } from "react-router-dom";
import { Calendar, Building2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

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
  return new Intl.NumberFormat('en-CA', {
    style: 'currency',
    currency: 'CAD',
    maximumFractionDigits: 0,
  }).format(price);
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

  // Combine featured image with gallery images
  const allImages = [
    featuredImage,
    ...(galleryImages || []),
  ].filter(Boolean) as string[];

  const imageCount = allImages.length;

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

  const handleCardTap = (e: React.MouseEvent) => {
    // Prevent navigation if we just swiped
    if (isSwiping.current) {
      e.preventDefault();
      return;
    }
    
    if (typeof window !== "undefined" && (window as any).gtag) {
      (window as any).gtag("event", "project_card_tap", {
        project_id: id,
        project_name: name,
        project_city: city,
      });
    }
  };

  const isLarge = size === "large";

  return (
    <Link 
      to={`/presale-projects/${slug}`} 
      onClick={handleCardTap}
      className={cn(
        "block shrink-0",
        isLarge ? "w-[300px]" : "w-[260px]"
      )}
    >
      <div className="bg-card rounded-xl overflow-hidden border border-border shadow-sm active:scale-[0.98] transition-transform duration-150">
        {/* Larger Image - with swipe support */}
        <div 
          className={cn(
            "relative bg-muted overflow-hidden",
            isLarge ? "aspect-[4/3]" : "aspect-[16/11]"
          )}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          {allImages.length > 0 ? (
            <img
              src={allImages[currentImageIndex]}
              alt={name}
              className="h-full w-full object-cover"
              loading="lazy"
              decoding="async"
            />
          ) : (
            <div className="h-full w-full flex items-center justify-center bg-gradient-to-br from-muted to-muted/50">
              <Building2 className="h-10 w-10 text-muted-foreground" />
            </div>
          )}
          
          {/* Status Badge - top left */}
          {statusLabel && (
            <Badge className="absolute top-2 left-2 bg-primary text-primary-foreground px-2 py-0.5 text-[10px] font-medium border-0 shadow-sm">
              {statusLabel}
            </Badge>
          )}

          {/* Dots indicator for multiple images */}
          {imageCount > 1 && (
            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1">
              {allImages.slice(0, 5).map((_, idx) => (
                <span
                  key={idx}
                  className={cn(
                    "h-1 w-1 rounded-full transition-all",
                    idx === currentImageIndex 
                      ? "bg-white w-2" 
                      : "bg-white/50"
                  )}
                />
              ))}
              {imageCount > 5 && (
                <span className="text-white text-[8px] ml-0.5">+{imageCount - 5}</span>
              )}
            </div>
          )}

          {/* Deposit badge - bottom right on image */}
          {depositPercent && (
            <div className="absolute bottom-2 right-2">
              <span className="text-[11px] font-bold text-white bg-primary/90 px-2 py-1 rounded shadow-sm">
                {depositPercent}%
              </span>
            </div>
          )}
        </div>

        {/* Info Section - Side by side layout */}
        <div className="px-3 py-2.5 flex items-start justify-between gap-2">
          {/* Left: Name & Location */}
          <div className="min-w-0 flex-1">
            <h4 className="font-semibold text-sm text-foreground truncate">{name}</h4>
            <p className="text-xs text-muted-foreground truncate">{city}</p>
            {completionYear && (
              <p className="text-[10px] text-muted-foreground mt-0.5">{completionYear}</p>
            )}
          </div>
          
          {/* Right: Price - Prominent */}
          <div className="text-right shrink-0">
            {startingPrice ? (
              <>
                <span className="text-[9px] text-muted-foreground uppercase tracking-wide block">From</span>
                <p className="text-base font-bold text-foreground leading-tight">
                  {formatPrice(startingPrice)}
                </p>
              </>
            ) : (
              <span className="text-xs text-primary font-medium">TBA</span>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}
