import { useState, useEffect, useCallback, useRef } from "react";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, X, ZoomIn } from "lucide-react";

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
      <DialogContent className="max-w-[95vw] max-h-[95vh] w-full h-full p-0 bg-black/95 border-none" aria-describedby={undefined}>
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

          {/* Main image */}
          <div className="w-full h-full flex items-center justify-center p-4 md:p-12">
            <img
              src={images[currentIndex]}
              alt={`${alt} ${currentIndex + 1}`}
              className="max-w-full max-h-full object-contain select-none"
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
}

export function GalleryWithLightbox({
  images,
  selectedIndex,
  onSelectIndex,
  alt = "Gallery image",
  className = "",
}: GalleryTriggerProps) {
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  const openLightbox = (index: number) => {
    setLightboxIndex(index);
    setLightboxOpen(true);
  };

  if (images.length === 0) {
    return (
      <div className={`aspect-[4/3] md:aspect-[16/10] rounded-xl overflow-hidden bg-muted flex items-center justify-center ${className}`}>
        <ZoomIn className="h-16 w-16 text-muted-foreground" />
      </div>
    );
  }

  return (
    <>
      <div className="space-y-3">
        {/* Main image */}
        <button
          onClick={() => openLightbox(selectedIndex)}
          className="relative w-full aspect-[3/4] sm:aspect-[4/3] md:aspect-[16/10] rounded-xl overflow-hidden bg-muted group cursor-zoom-in"
        >
          <img
            src={images[selectedIndex]}
            alt={alt}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center">
            <div className="opacity-0 group-hover:opacity-100 transition-opacity bg-black/50 rounded-full p-3">
              <ZoomIn className="h-6 w-6 text-white" />
            </div>
          </div>
          {images.length > 1 && (
            <div className="absolute bottom-3 right-3 bg-black/60 text-white text-xs px-2.5 py-1 rounded-full">
              {selectedIndex + 1} / {images.length}
            </div>
          )}
        </button>

        {/* Thumbnails - horizontal scroll on mobile, grid on desktop */}
        {images.length > 1 && (
          <>
            {/* Mobile: Single row horizontal scroll */}
            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide sm:hidden -mx-1 px-1">
              {images.map((img, i) => (
                <button
                  key={i}
                  onClick={() => onSelectIndex(i)}
                  className={`shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-all ${
                    selectedIndex === i
                      ? "border-primary ring-2 ring-primary/20"
                      : "border-transparent"
                  }`}
                >
                  <img src={img} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>

            {/* Desktop: Grid layout */}
            <div className="hidden sm:grid grid-cols-5 md:grid-cols-4 lg:grid-cols-6 gap-2">
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
                  <img src={img} alt="" className="w-full h-full object-cover" />
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
