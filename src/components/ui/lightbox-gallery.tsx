import { useState, useEffect, useCallback, useRef } from "react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, X, Expand } from "lucide-react";
import { cn } from "@/lib/utils";

interface LightboxGalleryProps {
  images: string[];
  initialIndex?: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  alt?: string;
}

export function LightboxGallery({
  images,
  initialIndex = 0,
  open,
  onOpenChange,
  alt = "Gallery image",
}: LightboxGalleryProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Minimum swipe distance (in px)
  const minSwipeDistance = 50;

  useEffect(() => {
    setCurrentIndex(initialIndex);
  }, [initialIndex, open]);

  const goToNext = useCallback(() => {
    setCurrentIndex((prev) => (prev + 1) % images.length);
  }, [images.length]);

  const goToPrev = useCallback(() => {
    setCurrentIndex((prev) => (prev - 1 + images.length) % images.length);
  }, [images.length]);

  const goToIndex = useCallback((index: number) => {
    if (index >= 0 && index < images.length) {
      setCurrentIndex(index);
    }
  }, [images.length]);

  // Keyboard navigation
  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") goToNext();
      if (e.key === "ArrowLeft") goToPrev();
      if (e.key === "Escape") onOpenChange(false);
      
      // 1-9 for quick image selection
      const num = parseInt(e.key, 10);
      if (num >= 1 && num <= 9) {
        goToIndex(num - 1);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, goToNext, goToPrev, onOpenChange, goToIndex]);

  // Touch handlers for swipe
  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const onTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;

    if (isLeftSwipe) {
      goToNext();
    } else if (isRightSwipe) {
      goToPrev();
    }

    setTouchStart(null);
    setTouchEnd(null);
  };

  if (images.length === 0) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[100vw] max-h-[100vh] w-[100vw] h-[100vh] p-0 bg-black/98 border-none rounded-none" aria-describedby={undefined}>
        <VisuallyHidden>
          <DialogTitle>Image Gallery - {alt}</DialogTitle>
        </VisuallyHidden>
        <div
          ref={containerRef}
          className="relative w-full h-full flex items-center justify-center"
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMove}
          onTouchEnd={onTouchEnd}
        >
          {/* Close button */}
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-4 right-4 z-50 text-white hover:bg-white/20 h-10 w-10"
            onClick={() => onOpenChange(false)}
          >
            <X className="h-6 w-6" />
          </Button>

          {/* Image counter */}
          <div className="absolute top-4 left-4 z-50 text-white/80 text-sm font-medium bg-black/40 px-3 py-1.5 rounded-full">
            {currentIndex + 1} / {images.length}
          </div>

          {/* Previous button */}
          {images.length > 1 && (
            <Button
              variant="ghost"
              size="icon"
              className="absolute left-2 md:left-4 z-50 text-white hover:bg-white/20 h-12 w-12"
              onClick={goToPrev}
            >
              <ChevronLeft className="h-8 w-8" />
            </Button>
          )}

          {/* Main image - constrained to fit without zooming */}
          <div className="w-full h-full flex items-center justify-center px-16 py-24 md:px-20 md:py-28">
            <img
              src={images[currentIndex]}
              alt={`${alt} ${currentIndex + 1}`}
              className="max-w-full max-h-full w-auto h-auto object-contain select-none"
              style={{ maxHeight: 'calc(100vh - 140px)', maxWidth: 'calc(100vw - 120px)' }}
              draggable={false}
            />
          </div>

          {/* Next button */}
          {images.length > 1 && (
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-2 md:right-4 z-50 text-white hover:bg-white/20 h-12 w-12"
              onClick={goToNext}
            >
              <ChevronRight className="h-8 w-8" />
            </Button>
          )}

          {/* Thumbnail strip */}
          {images.length > 1 && (
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-50 flex gap-2 p-2 bg-black/40 rounded-lg max-w-[90vw] overflow-x-auto">
              {images.map((img, i) => (
                <button
                  key={i}
                  onClick={() => setCurrentIndex(i)}
                  className={`shrink-0 w-12 h-12 md:w-16 md:h-16 rounded-md overflow-hidden border-2 transition-all ${
                    currentIndex === i
                      ? "border-white scale-105"
                      : "border-transparent opacity-60 hover:opacity-100"
                  }`}
                >
                  <img
                    src={img}
                    alt=""
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                </button>
              ))}
            </div>
          )}

          {/* Swipe hint on mobile */}
          <div className="absolute bottom-24 left-1/2 -translate-x-1/2 text-white/50 text-xs md:hidden">
            Swipe to navigate
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

interface GalleryTriggerProps {
  images: string[];
  selectedIndex: number;
  onSelectIndex: (index: number) => void;
  alt?: string;
  className?: string;
  compact?: boolean;
}

export function GalleryWithLightbox({
  images,
  selectedIndex,
  onSelectIndex,
  alt = "Gallery image",
  className = "",
  compact = false,
}: GalleryTriggerProps) {
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);

  const minSwipeDistance = 50;

  const openLightbox = (index: number) => {
    setLightboxIndex(index);
    setLightboxOpen(true);
  };

  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const onTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;

    if (isLeftSwipe) {
      onSelectIndex((selectedIndex + 1) % images.length);
    } else if (isRightSwipe) {
      onSelectIndex((selectedIndex - 1 + images.length) % images.length);
    }

    setTouchStart(null);
    setTouchEnd(null);
  };

  if (images.length === 0) {
    return (
      <div className={`aspect-[4/3] md:aspect-[16/10] rounded-xl overflow-hidden bg-muted flex items-center justify-center ${className}`}>
        <Expand className="h-16 w-16 text-muted-foreground" />
      </div>
    );
  }

  // Compact mode uses shorter aspect ratio for tablet/desktop side-by-side layouts
  const mainAspectClass = compact 
    ? "aspect-[4/3] md:aspect-[4/3] lg:aspect-[4/3]" 
    : "aspect-[4/3] md:aspect-[16/10] lg:aspect-[4/3]";

  return (
    <>
      <div className="space-y-2 md:space-y-3">
        {/* Main image with navigation arrows and swipe support */}
        <div 
          className="relative group"
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMove}
          onTouchEnd={onTouchEnd}
        >
          <div
            onClick={() => openLightbox(selectedIndex)}
            className={`relative w-full ${mainAspectClass} rounded-lg md:rounded-xl overflow-hidden bg-muted cursor-pointer`}
          >
            <img
              src={images[selectedIndex]}
              alt={alt}
              className="w-full h-full object-cover"
            />
          </div>

          {/* Navigation arrows - always visible on mobile/tablet, hover on desktop */}
          {images.length > 1 && (
            <>
              <Button
                variant="secondary"
                size="icon"
                className="absolute left-2 top-1/2 -translate-y-1/2 opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity bg-background/80 hover:bg-background h-8 w-8 md:h-10 md:w-10 rounded-full shadow-md z-10"
                onClick={(e) => {
                  e.stopPropagation();
                  onSelectIndex((selectedIndex - 1 + images.length) % images.length);
                }}
              >
                <ChevronLeft className="h-4 w-4 md:h-5 md:w-5" />
              </Button>
              <Button
                variant="secondary"
                size="icon"
                className="absolute right-2 top-1/2 -translate-y-1/2 opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity bg-background/80 hover:bg-background h-8 w-8 md:h-10 md:w-10 rounded-full shadow-md z-10"
                onClick={(e) => {
                  e.stopPropagation();
                  onSelectIndex((selectedIndex + 1) % images.length);
                }}
              >
                <ChevronRight className="h-4 w-4 md:h-5 md:w-5" />
              </Button>
            </>
          )}

          {/* Expand Button */}
          <Button
            variant="secondary"
            size="icon"
            className="absolute top-2 right-2 md:top-3 md:right-3 opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity bg-background/80 hover:bg-background h-8 w-8 md:h-10 md:w-10 rounded-full shadow-md z-10"
            onClick={() => openLightbox(selectedIndex)}
          >
            <Expand className="h-3.5 w-3.5 md:h-4 md:w-4" />
          </Button>

          {/* Photo Counter */}
          {images.length > 1 && (
            <div className="absolute bottom-2 left-2 md:bottom-3 md:left-3 bg-black/70 backdrop-blur-sm px-2 py-1 md:px-3 md:py-1.5 rounded-full text-[11px] md:text-xs font-medium text-white">
              {selectedIndex + 1} / {images.length}
            </div>
          )}

          {/* Dot Indicators for Mobile/Tablet */}
          {images.length > 1 && images.length <= 8 && (
            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1 lg:hidden">
              {images.map((_, idx) => (
                <span
                  key={idx}
                  className={cn(
                    "h-1.5 w-1.5 md:h-2 md:w-2 rounded-full transition-all",
                    idx === selectedIndex 
                      ? "bg-white w-3 md:w-4" 
                      : "bg-white/50"
                  )}
                />
              ))}
            </div>
          )}
        </div>

        {/* Thumbnails - hide on mobile, horizontal scroll on tablet, grid on desktop */}
        {images.length > 1 && (
          <>
            {/* Tablet: Compact horizontal scroll */}
            <div className="hidden md:flex lg:hidden gap-1.5 overflow-x-auto pb-1 scrollbar-hide">
              {images.map((img, i) => (
                <button
                  key={i}
                  onClick={() => onSelectIndex(i)}
                  className={`shrink-0 w-14 h-14 rounded-lg overflow-hidden border-2 transition-all ${
                    selectedIndex === i
                      ? "border-primary"
                      : "border-transparent opacity-70 hover:opacity-100"
                  }`}
                >
                  <img src={img} alt="" className="w-full h-full object-cover" loading="lazy" />
                </button>
              ))}
            </div>

            {/* Desktop: Grid layout */}
            <div className="hidden lg:grid grid-cols-6 gap-2">
              {images.slice(0, 5).map((img, i) => (
                <button
                  key={i}
                  onClick={() => onSelectIndex(i)}
                  className={`aspect-square rounded-xl overflow-hidden border-2 transition-all hover:scale-105 shadow-sm ${
                    selectedIndex === i
                      ? "border-primary ring-2 ring-primary/20"
                      : "border-transparent hover:border-muted-foreground/50"
                  }`}
                >
                  <img src={img} alt="" className="w-full h-full object-cover" loading="lazy" />
                </button>
              ))}
              {images.length > 5 && (
                <button
                  onClick={() => openLightbox(5)}
                  className="aspect-square rounded-xl overflow-hidden border-2 border-transparent hover:border-muted-foreground/50 bg-muted/80 flex items-center justify-center text-sm font-semibold text-muted-foreground hover:scale-105 transition-all shadow-sm"
                >
                  +{images.length - 5}
                </button>
              )}
            </div>
          </>
        )}
      </div>

      <LightboxGallery
        images={images}
        initialIndex={lightboxIndex}
        open={lightboxOpen}
        onOpenChange={setLightboxOpen}
        alt={alt}
      />
    </>
  );
}
