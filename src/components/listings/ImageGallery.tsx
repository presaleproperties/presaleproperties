import { useState, useRef } from "react";
import { ChevronLeft, ChevronRight, X, Expand } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import { cn } from "@/lib/utils";

interface Photo {
  id: string;
  url: string;
  sort_order: number | null;
}

interface ImageGalleryProps {
  photos: Photo[];
  title: string;
}

export function ImageGallery({ photos, title }: ImageGalleryProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const touchStartX = useRef<number | null>(null);
  const touchEndX = useRef<number | null>(null);
  const [swipeOffset, setSwipeOffset] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);

  const hasPhotos = photos.length > 0;
  const currentPhoto = hasPhotos ? photos[currentIndex] : null;

  const goToPrevious = () => {
    if (isTransitioning) return;
    setIsTransitioning(true);
    setCurrentIndex((prev) => (prev === 0 ? photos.length - 1 : prev - 1));
    setSwipeOffset(0);
    setTimeout(() => setIsTransitioning(false), 300);
  };

  const goToNext = () => {
    if (isTransitioning) return;
    setIsTransitioning(true);
    setCurrentIndex((prev) => (prev === photos.length - 1 ? 0 : prev + 1));
    setSwipeOffset(0);
    setTimeout(() => setIsTransitioning(false), 300);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if (isTransitioning) return;
    touchStartX.current = e.touches[0].clientX;
    touchEndX.current = null;
    setSwipeOffset(0);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!touchStartX.current || isTransitioning) return;
    touchEndX.current = e.touches[0].clientX;
    
    // Calculate offset with edge resistance
    const diff = touchEndX.current - touchStartX.current;
    const isAtStart = currentIndex === 0 && diff > 0;
    const isAtEnd = currentIndex === photos.length - 1 && diff < 0;
    const resistance = isAtStart || isAtEnd ? 0.3 : 1;
    setSwipeOffset(diff * resistance);
  };

  const handleTouchEnd = () => {
    if (!touchStartX.current || isTransitioning) {
      setSwipeOffset(0);
      return;
    }
    
    const diff = touchStartX.current - (touchEndX.current || touchStartX.current);
    const threshold = 50;

    if (Math.abs(diff) > threshold && photos.length > 1) {
      if (diff > 0 && currentIndex < photos.length - 1) {
        goToNext();
      } else if (diff < 0 && currentIndex > 0) {
        goToPrevious();
      } else {
        setSwipeOffset(0);
      }
    } else {
      setSwipeOffset(0);
    }

    touchStartX.current = null;
    touchEndX.current = null;
  };

  if (!hasPhotos) {
    return (
      <div className="aspect-[4/3] bg-muted rounded-xl flex items-center justify-center">
        <p className="text-muted-foreground">No photos available</p>
      </div>
    );
  }

  return (
    <>
      {/* Main Image */}
      <div className="relative group">
        <div 
          className="aspect-[4/3] md:aspect-[4/3] bg-muted rounded-xl overflow-hidden touch-pan-y"
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          <img
            src={currentPhoto?.url}
            alt={`${title} - Photo ${currentIndex + 1}`}
            className="w-full h-full object-cover cursor-pointer"
            style={{
              transform: `translateX(${swipeOffset}px)`,
              transition: isTransitioning || !touchStartX.current 
                ? 'transform 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94)' 
                : 'none'
            }}
            onClick={() => setIsLightboxOpen(true)}
          />
        </div>
        
        {/* Navigation Arrows - Always visible on mobile */}
        {photos.length > 1 && (
          <>
            <Button
              variant="secondary"
              size="icon"
              className="absolute left-2 md:left-3 top-1/2 -translate-y-1/2 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity bg-background/80 hover:bg-background h-10 w-10 md:h-10 md:w-10 rounded-full shadow-md"
              onClick={goToPrevious}
            >
              <ChevronLeft className="h-5 w-5" />
            </Button>
            <Button
              variant="secondary"
              size="icon"
              className="absolute right-2 md:right-3 top-1/2 -translate-y-1/2 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity bg-background/80 hover:bg-background h-10 w-10 md:h-10 md:w-10 rounded-full shadow-md"
              onClick={goToNext}
            >
              <ChevronRight className="h-5 w-5" />
            </Button>
          </>
        )}

        {/* Expand Button */}
        <Button
          variant="secondary"
          size="icon"
          className="absolute top-3 right-3 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity bg-background/80 hover:bg-background h-10 w-10 rounded-full shadow-md"
          onClick={() => setIsLightboxOpen(true)}
        >
          <Expand className="h-4 w-4" />
        </Button>

        {/* Photo Counter */}
        {photos.length > 1 && (
          <div className="absolute bottom-3 left-3 bg-black/70 backdrop-blur-sm px-3 py-1.5 rounded-full text-xs font-medium text-white">
            {currentIndex + 1} / {photos.length}
          </div>
        )}

        {/* Dot Indicators for Mobile */}
        {photos.length > 1 && photos.length <= 6 && (
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5 md:hidden">
            {photos.map((_, idx) => (
              <span
                key={idx}
                className={cn(
                  "h-2 w-2 rounded-full transition-all",
                  idx === currentIndex 
                    ? "bg-white w-4" 
                    : "bg-white/50"
                )}
              />
            ))}
          </div>
        )}
      </div>

      {/* Thumbnail Strip */}
      {photos.length > 1 && (
        <div className="grid grid-cols-4 sm:grid-cols-5 md:flex gap-2 mt-3 md:overflow-x-auto md:pb-2">
          {photos.slice(0, 8).map((photo, index) => (
            <button
              key={photo.id}
              onClick={() => setCurrentIndex(index)}
              className={cn(
                "aspect-square md:aspect-auto md:flex-shrink-0 md:w-20 md:h-20 rounded-lg overflow-hidden border-2 transition-all",
                index === currentIndex
                  ? "border-primary ring-2 ring-primary/20"
                  : "border-transparent hover:border-muted-foreground/30"
              )}
            >
              <img
                src={photo.url}
                alt={`${title} thumbnail ${index + 1}`}
                className="w-full h-full object-cover"
              />
            </button>
          ))}
          {photos.length > 8 && (
            <button
              onClick={() => setIsLightboxOpen(true)}
              className="aspect-square md:flex-shrink-0 md:w-20 md:h-20 rounded-lg overflow-hidden border-2 border-transparent hover:border-muted-foreground/30 bg-muted flex items-center justify-center text-sm font-medium text-muted-foreground"
            >
              +{photos.length - 8}
            </button>
          )}
        </div>
      )}

      {/* Lightbox */}
      <Dialog open={isLightboxOpen} onOpenChange={setIsLightboxOpen}>
        <DialogContent className="max-w-[95vw] max-h-[95vh] p-0 bg-black/95 border-none" aria-describedby={undefined}>
          <VisuallyHidden>
            <DialogTitle>Image Gallery - {title}</DialogTitle>
          </VisuallyHidden>
          <div 
            className="relative w-full h-[90vh] flex items-center justify-center"
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
          >
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-4 right-4 text-white hover:bg-white/20 z-10 h-12 w-12"
              onClick={() => setIsLightboxOpen(false)}
            >
              <X className="h-6 w-6" />
            </Button>

            <img
              src={currentPhoto?.url}
              alt={`${title} - Photo ${currentIndex + 1}`}
              className="max-w-full max-h-full object-contain"
            />

            {photos.length > 1 && (
              <>
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-white hover:bg-white/20 h-12 w-12"
                  onClick={goToPrevious}
                >
                  <ChevronLeft className="h-8 w-8" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-white hover:bg-white/20 h-12 w-12"
                  onClick={goToNext}
                >
                  <ChevronRight className="h-8 w-8" />
                </Button>
              </>
            )}

            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white text-sm bg-black/50 px-3 py-1.5 rounded-full">
              {currentIndex + 1} / {photos.length}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
