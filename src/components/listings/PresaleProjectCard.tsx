import { useState, useRef, useCallback } from "react";
import { Link } from "react-router-dom";
import { Building2, ChevronLeft, ChevronRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface PresaleProjectCardProps {
  id: string;
  slug: string;
  name: string;
  city: string;
  neighborhood: string;
  projectType: "condo" | "townhome" | "mixed";
  status?: "coming_soon" | "active" | "sold_out";
  completionYear?: number | null;
  developerName?: string | null;
  address?: string | null;
  featuredImage?: string | null;
  galleryImages?: string[] | null;
}

const formatType = (type: string) => {
  return type.charAt(0).toUpperCase() + type.slice(1);
};

const getStatusLabel = (status: string) => {
  switch (status) {
    case "active":
      return "Now Selling";
    case "coming_soon":
      return "Register Now";
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
  developerName,
  address,
  featuredImage,
  galleryImages,
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

  return (
    <Link to={`/presale-projects/${slug}`}>
      <Card className="group overflow-hidden border-border bg-card shadow-card hover:shadow-lg hover:-translate-y-1 transition-all duration-300 h-full">
        <div className="flex flex-col sm:flex-row">
          {/* Image Section */}
          <div 
            className="relative aspect-[4/3] sm:aspect-square sm:w-48 md:w-56 lg:w-64 shrink-0 overflow-hidden bg-muted"
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
          >
            {allImages.length > 0 ? (
              <>
                <img
                  src={allImages[currentImageIndex]}
                  alt={name}
                  className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
                
                {/* Status Badge */}
                {statusLabel && (
                  <Badge 
                    variant="secondary" 
                    className="absolute top-3 left-3 bg-background/95 text-foreground text-xs font-medium shadow-sm"
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
          </div>

          {/* Content Section */}
          <CardContent className="flex-1 p-4 sm:p-5 flex flex-col justify-between">
            <div className="space-y-2">
              <h3 className="font-semibold text-foreground text-base sm:text-lg group-hover:text-primary transition-colors line-clamp-1">
                {name}
              </h3>
              
              {address && (
                <p className="text-sm text-muted-foreground line-clamp-1">
                  {address}
                </p>
              )}
              
              <p className="text-sm text-muted-foreground">
                {neighborhood} • {city}
              </p>
              
              <p className="text-sm text-muted-foreground">
                {formatType(projectType)} • {completionYear ? `Move in ${completionYear}` : "Coming Soon"}
              </p>
            </div>
            
            {developerName && (
              <div className="mt-4 pt-3 border-t border-border">
                <p className="text-xs text-muted-foreground">Developer</p>
                <p className="text-sm font-medium text-foreground line-clamp-1">{developerName}</p>
              </div>
            )}
          </CardContent>
        </div>
      </Card>
    </Link>
  );
}
