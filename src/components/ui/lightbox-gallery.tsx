import { useState, useEffect, useCallback, useRef } from "react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, X, ZoomIn, ZoomOut, RotateCcw, Expand } from "lucide-react";
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
  const [touchStart, setTouchStart] = useState<{ x: number; y: number } | null>(null);
  const [touchEnd, setTouchEnd] = useState<{ x: number; y: number } | null>(null);
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [initialPinchDistance, setInitialPinchDistance] = useState<number | null>(null);
  const [initialScale, setInitialScale] = useState(1);
  const containerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const lastTapRef = useRef<number>(0);

  const minSwipeDistance = 50;
  const MIN_SCALE = 1;
  const MAX_SCALE = 4;

  useEffect(() => {
    setCurrentIndex(initialIndex);
    resetZoom();
  }, [initialIndex, open]);

  const resetZoom = useCallback(() => {
    setScale(1);
    setPosition({ x: 0, y: 0 });
  }, []);

  const goToNext = useCallback(() => {
    if (scale > 1) return; // Don't navigate when zoomed
    setCurrentIndex((prev) => (prev + 1) % images.length);
    resetZoom();
  }, [images.length, scale, resetZoom]);

  const goToPrev = useCallback(() => {
    if (scale > 1) return; // Don't navigate when zoomed
    setCurrentIndex((prev) => (prev - 1 + images.length) % images.length);
    resetZoom();
  }, [images.length, scale, resetZoom]);

  const goToIndex = useCallback((index: number) => {
    if (index >= 0 && index < images.length) {
      setCurrentIndex(index);
      resetZoom();
    }
  }, [images.length, resetZoom]);

  const zoomIn = useCallback(() => {
    setScale((prev) => Math.min(prev + 0.5, MAX_SCALE));
  }, []);

  const zoomOut = useCallback(() => {
    setScale((prev) => {
      const newScale = Math.max(prev - 0.5, MIN_SCALE);
      if (newScale === 1) setPosition({ x: 0, y: 0 });
      return newScale;
    });
  }, []);

  // Calculate pinch distance
  const getPinchDistance = (touches: React.TouchList) => {
    return Math.hypot(
      touches[0].clientX - touches[1].clientX,
      touches[0].clientY - touches[1].clientY
    );
  };

  // Keyboard navigation
  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") goToNext();
      if (e.key === "ArrowLeft") goToPrev();
      if (e.key === "Escape") onOpenChange(false);
      if (e.key === "+" || e.key === "=") zoomIn();
      if (e.key === "-") zoomOut();
      if (e.key === "0") resetZoom();
      
      const num = parseInt(e.key, 10);
      if (num >= 1 && num <= 9) {
        goToIndex(num - 1);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, goToNext, goToPrev, onOpenChange, goToIndex, zoomIn, zoomOut, resetZoom]);

  // Touch handlers for swipe and pinch-to-zoom
  const onTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      // Pinch start
      setInitialPinchDistance(getPinchDistance(e.touches));
      setInitialScale(scale);
    } else if (e.touches.length === 1) {
      // Single touch - check for double tap
      const now = Date.now();
      if (now - lastTapRef.current < 300) {
        // Double tap - toggle zoom
        if (scale > 1) {
          resetZoom();
        } else {
          setScale(2.5);
        }
        lastTapRef.current = 0;
        return;
      }
      lastTapRef.current = now;

      setTouchEnd(null);
      setTouchStart({ x: e.targetTouches[0].clientX, y: e.targetTouches[0].clientY });
      if (scale > 1) {
        setIsDragging(true);
      }
    }
  };

  const onTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 2 && initialPinchDistance) {
      // Pinch zoom
      const currentDistance = getPinchDistance(e.touches);
      const scaleChange = currentDistance / initialPinchDistance;
      const newScale = Math.min(Math.max(initialScale * scaleChange, MIN_SCALE), MAX_SCALE);
      setScale(newScale);
      if (newScale === 1) setPosition({ x: 0, y: 0 });
    } else if (e.touches.length === 1) {
      const touch = e.targetTouches[0];
      setTouchEnd({ x: touch.clientX, y: touch.clientY });

      if (isDragging && touchStart && scale > 1) {
        // Pan when zoomed
        const deltaX = touch.clientX - touchStart.x;
        const deltaY = touch.clientY - touchStart.y;
        setPosition((prev) => ({
          x: prev.x + deltaX,
          y: prev.y + deltaY,
        }));
        setTouchStart({ x: touch.clientX, y: touch.clientY });
      }
    }
  };

  const onTouchEnd = () => {
    setInitialPinchDistance(null);
    setIsDragging(false);

    if (!touchStart || !touchEnd || scale > 1) {
      setTouchStart(null);
      setTouchEnd(null);
      return;
    }

    const distanceX = touchStart.x - touchEnd.x;
    const distanceY = Math.abs(touchStart.y - touchEnd.y);

    // Only swipe if horizontal movement is greater than vertical
    if (Math.abs(distanceX) > distanceY) {
      if (distanceX > minSwipeDistance) {
        goToNext();
      } else if (distanceX < -minSwipeDistance) {
        goToPrev();
      }
    }

    setTouchStart(null);
    setTouchEnd(null);
  };

  // Mouse wheel zoom
  const onWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    if (e.deltaY < 0) {
      zoomIn();
    } else {
      zoomOut();
    }
  };

  if (images.length === 0) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[100vw] max-h-[100vh] w-[100vw] h-[100vh] p-0 bg-black/98 border-none rounded-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-100 duration-200" aria-describedby={undefined}>
        <VisuallyHidden>
          <DialogTitle>Image Gallery - {alt}</DialogTitle>
        </VisuallyHidden>
        <div
          ref={containerRef}
          className="relative w-full h-full flex items-center justify-center overflow-hidden"
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMove}
          onTouchEnd={onTouchEnd}
          onWheel={onWheel}
          onClick={() => onOpenChange(false)}
        >
          {/* Close button */}
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-4 right-4 z-50 text-white hover:bg-white/20 h-10 w-10"
            onClick={(e) => {
              e.stopPropagation();
              onOpenChange(false);
            }}
          >
            <X className="h-6 w-6" />
          </Button>

          {/* Image counter and zoom controls */}
          <div className="absolute top-4 left-4 z-50 flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
            <div className="text-white/80 text-sm font-medium bg-black/40 px-3 py-1.5 rounded-full">
              {currentIndex + 1} / {images.length}
            </div>
            <div className="hidden md:flex items-center gap-1 bg-black/40 rounded-full px-1">
              <Button
                variant="ghost"
                size="icon"
                className="text-white hover:bg-white/20 h-8 w-8"
                onClick={zoomOut}
                disabled={scale <= MIN_SCALE}
              >
                <ZoomOut className="h-4 w-4" />
              </Button>
              <span className="text-white/80 text-xs font-medium min-w-[40px] text-center">
                {Math.round(scale * 100)}%
              </span>
              <Button
                variant="ghost"
                size="icon"
                className="text-white hover:bg-white/20 h-8 w-8"
                onClick={zoomIn}
                disabled={scale >= MAX_SCALE}
              >
                <ZoomIn className="h-4 w-4" />
              </Button>
              {scale > 1 && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-white hover:bg-white/20 h-8 w-8"
                  onClick={resetZoom}
                >
                  <RotateCcw className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>

          {/* Previous button */}
          {images.length > 1 && scale <= 1 && (
            <Button
              variant="ghost"
              size="icon"
              className="absolute left-2 md:left-4 z-50 text-white hover:bg-white/20 h-12 w-12"
              onClick={(e) => {
                e.stopPropagation();
                goToPrev();
              }}
            >
              <ChevronLeft className="h-8 w-8" />
            </Button>
          )}

          {/* Main image - larger display with zoom support */}
          <div 
            className="w-full h-full flex items-center justify-center px-4 py-20 md:px-16 md:py-24"
            style={{ cursor: scale > 1 ? 'grab' : 'default' }}
            onClick={(e) => e.stopPropagation()}
          >
            <img
              ref={imageRef}
              src={images[currentIndex]}
              alt={`${alt} ${currentIndex + 1}`}
              className="max-w-full max-h-full w-auto h-auto object-contain select-none transition-transform duration-100"
              style={{ 
                transform: `scale(${scale}) translate(${position.x / scale}px, ${position.y / scale}px)`,
                maxHeight: 'calc(100vh - 100px)', 
                maxWidth: 'calc(100vw - 32px)'
              }}
              draggable={false}
              onDoubleClick={() => {
                if (scale > 1) {
                  resetZoom();
                } else {
                  setScale(2.5);
                }
              }}
            />
          </div>

          {/* Next button */}
          {images.length > 1 && scale <= 1 && (
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-2 md:right-4 z-50 text-white hover:bg-white/20 h-12 w-12"
              onClick={(e) => {
                e.stopPropagation();
                goToNext();
              }}
            >
              <ChevronRight className="h-8 w-8" />
            </Button>
          )}

          {/* Thumbnail strip - moved up on mobile to avoid browser navigation */}
          {images.length > 1 && scale <= 1 && (
            <div 
              className="absolute bottom-20 md:bottom-4 left-1/2 -translate-x-1/2 z-50 flex gap-2 p-2 bg-black/40 rounded-lg max-w-[90vw] overflow-x-auto"
              onClick={(e) => e.stopPropagation()}
            >
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

          {/* Mobile zoom hint - positioned above thumbnails */}
          <div className="absolute bottom-36 md:bottom-24 left-1/2 -translate-x-1/2 text-white/50 text-xs md:hidden text-center">
            {scale > 1 ? "Pinch or double-tap to zoom out" : "Double-tap or pinch to zoom • Swipe to navigate"}
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
