import { useState, useEffect, useRef, useCallback } from "react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import { Button } from "@/components/ui/button";
import { X, ChevronLeft, ChevronRight, Expand, ExternalLink, ZoomIn, ZoomOut, Calendar, Download } from "lucide-react";
import { cn } from "@/lib/utils";

interface Photo {
  url: string;
  alt?: string;
}

interface REWPhotoGalleryProps {
  photos: Photo[];
  virtualTourUrl?: string | null;
  videoUrl?: string | null;
  alt?: string;
  className?: string;
  /**
   * Override the preview image aspect ratio classes.
   * Default: "aspect-[4/3] lg:aspect-[16/9]" (REW-style).
   */
  previewAspectClassName?: string;
  /**
   * Callback when user clicks "Schedule Showing" button in fullscreen gallery
   */
  onScheduleShowing?: () => void;
  /**
   * Callback for generic CTA button in fullscreen gallery (e.g., "Download Info" for presale)
   */
  onGalleryCTA?: () => void;
  /** Label for the generic gallery CTA button */
  galleryCTALabel?: string;
}

type GalleryTab = "photos" | "virtualTour" | "video";
type ViewMode = "grid" | "single";

// Helper to parse video URLs and return embed URLs
function getVideoEmbedUrl(url: string): string | null {
  if (!url) return null;
  
  // YouTube (watch, shorts, youtu.be)
  const ytMatch = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
  if (ytMatch) {
    return `https://www.youtube.com/embed/${ytMatch[1]}`;
  }
  
  // Vimeo (supports private videos with hash: vimeo.com/123456789/abc123)
  const vimeoMatch = url.match(/vimeo\.com\/(?:video\/)?(\d+)(?:\/([a-zA-Z0-9]+))?/);
  if (vimeoMatch) {
    const videoId = vimeoMatch[1];
    const hash = vimeoMatch[2];
    return hash 
      ? `https://player.vimeo.com/video/${videoId}?h=${hash}`
      : `https://player.vimeo.com/video/${videoId}`;
  }
  
  return null;
}

export function REWPhotoGallery({
  photos,
  virtualTourUrl,
  videoUrl,
  alt = "Property",
  className = "",
  previewAspectClassName = "aspect-[4/3] lg:aspect-[16/9]",
  onScheduleShowing,
  onGalleryCTA,
  galleryCTALabel = "Download Info",
}: REWPhotoGalleryProps) {
  const videoEmbedUrl = videoUrl ? getVideoEmbedUrl(videoUrl) : null;
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<GalleryTab>("photos");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [swipeOffset, setSwipeOffset] = useState(0);
  
  // Single image view state
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [zoomedIndex, setZoomedIndex] = useState(0);
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const lastTouchRef = useRef<{ x: number; y: number } | null>(null);
  const initialPinchDistanceRef = useRef<number | null>(null);
  const initialScaleRef = useRef(1);

  // Lock body scroll when gallery is open & notify other components
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
      window.dispatchEvent(new CustomEvent("gallery-opened"));
    } else {
      document.body.style.overflow = "";
      window.dispatchEvent(new CustomEvent("gallery-closed"));
    }
    return () => {
      document.body.style.overflow = "";
      window.dispatchEvent(new CustomEvent("gallery-closed"));
    };
  }, [isOpen]);

  // Reset view mode when closing
  useEffect(() => {
    if (!isOpen) {
      setViewMode("grid");
      setScale(1);
      setPosition({ x: 0, y: 0 });
    }
  }, [isOpen]);

  const openGallery = (index: number = 0) => {
    setSelectedIndex(index);
    setIsOpen(true);
  };

  const goToNext = () => {
    setSelectedIndex((prev) => (prev + 1) % photos.length);
  };

  const goToPrev = () => {
    setSelectedIndex((prev) => (prev - 1 + photos.length) % photos.length);
  };

  // Single view navigation
  const goToNextZoomed = useCallback(() => {
    if (scale > 1) return;
    setZoomedIndex((prev) => (prev + 1) % photos.length);
    setScale(1);
    setPosition({ x: 0, y: 0 });
  }, [photos.length, scale]);

  const goToPrevZoomed = useCallback(() => {
    if (scale > 1) return;
    setZoomedIndex((prev) => (prev - 1 + photos.length) % photos.length);
    setScale(1);
    setPosition({ x: 0, y: 0 });
  }, [photos.length, scale]);

  const openSingleView = (index: number) => {
    setZoomedIndex(index);
    setViewMode("single");
    setScale(1);
    setPosition({ x: 0, y: 0 });
  };

  const closeSingleView = () => {
    setViewMode("grid");
    setScale(1);
    setPosition({ x: 0, y: 0 });
  };

  // Zoom controls
  const zoomIn = () => setScale((s) => Math.min(s + 0.5, 4));
  const zoomOut = () => {
    setScale((s) => {
      const newScale = Math.max(s - 0.5, 1);
      if (newScale === 1) setPosition({ x: 0, y: 0 });
      return newScale;
    });
  };

  // Touch handlers for preview swipe
  const onTouchStart = (e: React.TouchEvent) => {
    setTouchStart(e.targetTouches[0].clientX);
  };

  const onTouchMove = (e: React.TouchEvent) => {
    if (!touchStart) return;
    const diff = e.targetTouches[0].clientX - touchStart;
    const isAtStart = selectedIndex === 0 && diff > 0;
    const isAtEnd = selectedIndex === photos.length - 1 && diff < 0;
    setSwipeOffset(diff * (isAtStart || isAtEnd ? 0.3 : 1));
  };

  const onTouchEnd = () => {
    if (Math.abs(swipeOffset) > 50) {
      if (swipeOffset < 0 && selectedIndex < photos.length - 1) goToNext();
      if (swipeOffset > 0 && selectedIndex > 0) goToPrev();
    }
    setSwipeOffset(0);
    setTouchStart(null);
  };

  // Touch handlers for zoomed view
  const getPinchDistance = (touches: React.TouchList) => {
    return Math.hypot(
      touches[0].clientX - touches[1].clientX,
      touches[0].clientY - touches[1].clientY
    );
  };

  const onZoomedTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      initialPinchDistanceRef.current = getPinchDistance(e.touches);
      initialScaleRef.current = scale;
    } else if (e.touches.length === 1) {
      lastTouchRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
      if (scale > 1) setIsDragging(true);
    }
  };

  const onZoomedTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 2 && initialPinchDistanceRef.current) {
      const currentDistance = getPinchDistance(e.touches);
      const scaleChange = currentDistance / initialPinchDistanceRef.current;
      const newScale = Math.min(Math.max(initialScaleRef.current * scaleChange, 1), 4);
      setScale(newScale);
      if (newScale === 1) setPosition({ x: 0, y: 0 });
    } else if (e.touches.length === 1 && isDragging && lastTouchRef.current && scale > 1) {
      const deltaX = e.touches[0].clientX - lastTouchRef.current.x;
      const deltaY = e.touches[0].clientY - lastTouchRef.current.y;
      setPosition((prev) => ({ x: prev.x + deltaX, y: prev.y + deltaY }));
      lastTouchRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    } else if (e.touches.length === 1 && scale <= 1 && lastTouchRef.current) {
      // Swipe to navigate
      const diff = e.touches[0].clientX - lastTouchRef.current.x;
      if (Math.abs(diff) > 80) {
        if (diff < 0) goToNextZoomed();
        else goToPrevZoomed();
        lastTouchRef.current = null;
      }
    }
  };

  const onZoomedTouchEnd = () => {
    initialPinchDistanceRef.current = null;
    setIsDragging(false);
    lastTouchRef.current = null;
  };

  // Keyboard navigation for single view
  useEffect(() => {
    if (!isOpen || viewMode !== "single") return;
    
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") goToNextZoomed();
      if (e.key === "ArrowLeft") goToPrevZoomed();
      if (e.key === "Escape") closeSingleView();
      if (e.key === "+" || e.key === "=") zoomIn();
      if (e.key === "-") zoomOut();
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, viewMode, goToNextZoomed, goToPrevZoomed]);

  if (photos.length === 0) {
    return (
      <div className={cn("aspect-[4/3] rounded-xl bg-muted flex items-center justify-center", className)}>
        <Expand className="h-16 w-16 text-muted-foreground/50" />
      </div>
    );
  }

  return (
    <>
      {/* Preview Gallery */}
      <div className={cn("space-y-2", className)}>
        {/* Main Image */}
        <div
          className="relative group cursor-pointer"
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMove}
          onTouchEnd={(e) => {
            const wasSwiping = Math.abs(swipeOffset) > 10;
            onTouchEnd();
            // If it was a tap (not a swipe), open gallery
            if (!wasSwiping) {
              openGallery(selectedIndex);
            }
          }}
        >
          <div
            onClick={() => openGallery(selectedIndex)}
            className={cn(
              "relative overflow-hidden bg-muted lg:rounded-xl",
              previewAspectClassName
            )}
          >
            <img
              src={photos[selectedIndex]?.url}
              alt={photos[selectedIndex]?.alt || alt}
              className="w-full h-full object-cover transition-transform duration-200 will-change-transform backface-visibility-hidden"
              style={{ 
                transform: `translateX(${swipeOffset}px) translateZ(0)`,
                imageRendering: "auto",
              }}
              sizes="(max-width: 768px) 100vw, (max-width: 1280px) 66vw, 900px"
              loading="eager"
              decoding="sync"
              fetchpriority="high"
            />
            
            {/* Photo counter badge - hidden on mobile (dots shown instead), visible on tablet/desktop */}
            <div className="hidden sm:block absolute sm:bottom-3 right-2.5 sm:right-3 bg-neutral-900/50 text-on-dark text-xs font-medium px-2.5 py-1 rounded-full backdrop-blur-sm">
              {selectedIndex + 1}/{photos.length}
            </div>

            {/* Pill indicators - overlaid at bottom of image, mobile only */}
            {photos.length > 1 && (
              <div className="sm:hidden absolute bottom-2.5 left-1/2 -translate-x-1/2 flex items-center gap-[5px]">
                {photos.slice(0, Math.min(photos.length, 7)).map((_, i) => (
                  <span
                    key={i}
                    className={cn(
                      "block rounded-full transition-all duration-300",
                      selectedIndex === i
                        ? "w-5 h-[5px] bg-primary"
                        : "w-[5px] h-[5px] bg-card/50"
                    )}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Nav arrows on preview */}
          {photos.length > 1 && (
            <>
              <Button
                variant="ghost"
                size="icon"
                className="absolute left-2 top-1/2 -translate-y-1/2 h-10 w-10 bg-card/90 hover:bg-card text-foreground shadow-md opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={(e) => { e.stopPropagation(); goToPrev(); }}
              >
                <ChevronLeft className="h-5 w-5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-2 top-1/2 -translate-y-1/2 h-10 w-10 bg-card/90 hover:bg-card text-foreground shadow-md opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={(e) => { e.stopPropagation(); goToNext(); }}
              >
                <ChevronRight className="h-5 w-5" />
              </Button>
            </>
          )}
        </div>

        {/* Thumbnail strip - Desktop/Tablet (hidden on mobile) */}
        {photos.length > 1 && (
          <div className="hidden sm:flex gap-2 mt-2 px-0 lg:px-0" style={{ maxHeight: '100px' }}>
            {photos.slice(0, 5).map((photo, i) => (
              <div
                key={i}
                className={cn(
                  "relative aspect-[4/3] rounded-lg overflow-hidden bg-muted cursor-pointer border-2 transition-all",
                  "w-[calc(20%-0.4rem)]",
                  selectedIndex === i ? "border-primary" : "border-transparent hover:border-primary/40"
                )}
                onClick={() => {
                  if (i === 4 && photos.length > 5) {
                    openGallery(0);
                  } else {
                    setSelectedIndex(i);
                  }
                }}
              >
                <img
                  src={photo.url}
                  alt={photo.alt || `${alt} - Thumbnail ${i + 1}`}
                  className="w-full h-full object-cover"
                  loading="lazy"
                  decoding="async"
                />
                {/* "+N more" overlay on last thumbnail */}
                {i === 4 && photos.length > 5 && (
                  <div className="absolute inset-0 bg-neutral-900/60 flex items-center justify-center">
                    <span className="text-on-dark font-bold text-sm md:text-base">
                      +{photos.length - 5} more
                    </span>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}


      </div>

      {/* Full Screen Gallery Modal - REW Style */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent 
          className="max-w-[100vw] w-[100vw] p-0 bg-muted border-none rounded-none [&>button]:hidden overflow-hidden"
          style={{ height: '100dvh', maxHeight: '100dvh' }}
          aria-describedby={undefined}
        >
          <VisuallyHidden>
            <DialogTitle>Photo Gallery - {alt}</DialogTitle>
          </VisuallyHidden>
          
          <div className="flex flex-col h-full overflow-hidden">
            {/* Header with tabs */}
            <header className="flex items-center justify-between px-4 py-3 border-b bg-card sticky top-0 z-50" style={{ paddingTop: 'max(12px, env(safe-area-inset-top, 12px))' }}>
              {/* Back button */}
              <Button
                variant="ghost"
                size="icon"
                onClick={() => viewMode === "single" ? closeSingleView() : setIsOpen(false)}
                className="h-10 w-10 text-foreground hover:text-foreground hover:bg-muted"
              >
                <ChevronLeft className="h-6 w-6" />
              </Button>

              {/* Tab Toggle or Photo Counter */}
              {viewMode === "grid" ? (
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setActiveTab("photos")}
                    className={cn(
                      "px-5 py-2 rounded-full text-sm font-semibold transition-all",
                      activeTab === "photos"
                        ? "bg-primary text-primary-foreground"
                        : "bg-card text-foreground border border-input hover:bg-muted"
                    )}
                  >
                    PHOTOS
                  </button>
                  {virtualTourUrl && (
                    <button
                      onClick={() => setActiveTab("virtualTour")}
                      className={cn(
                        "px-5 py-2 rounded-full text-sm font-semibold transition-all",
                        activeTab === "virtualTour"
                          ? "bg-primary text-primary-foreground"
                          : "bg-card text-foreground border border-input hover:bg-muted"
                      )}
                    >
                      VIRTUAL TOURS
                    </button>
                  )}
                  {videoEmbedUrl && (
                    <button
                      onClick={() => setActiveTab("video")}
                      className={cn(
                        "px-5 py-2 rounded-full text-sm font-semibold transition-all",
                        activeTab === "video"
                          ? "bg-primary text-primary-foreground"
                          : "bg-card text-foreground border border-input hover:bg-muted"
                      )}
                    >
                      VIDEO
                    </button>
                  )}
                </div>
              ) : (
                <div className="flex items-center gap-3">
                  <span className="text-foreground font-medium">
                    {zoomedIndex + 1} / {photos.length}
                  </span>
                  <div className="flex items-center gap-1 bg-muted rounded-full px-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-foreground hover:text-foreground"
                      onClick={zoomOut}
                      disabled={scale <= 1}
                    >
                      <ZoomOut className="h-4 w-4" />
                    </Button>
                    <span className="text-xs text-foreground min-w-[40px] text-center">
                      {Math.round(scale * 100)}%
                    </span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-foreground hover:text-foreground"
                      onClick={zoomIn}
                      disabled={scale >= 4}
                    >
                      <ZoomIn className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}

              {/* Close button */}
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsOpen(false)}
                className="h-10 w-10 text-foreground hover:text-foreground hover:bg-muted"
              >
                <X className="h-6 w-6" />
              </Button>
            </header>

            {/* Content Area */}
            {viewMode === "grid" ? (
              <div className="flex-1 overflow-y-auto overscroll-contain touch-pan-y">
                {activeTab === "photos" ? (
                  <div className="p-4 md:p-8 lg:p-12 pb-20">
                    {/* 2-column grid of photos */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-6xl mx-auto">
                      {photos.map((photo, i) => (
                        <div
                          key={i}
                          className="relative aspect-[4/3] rounded-xl overflow-hidden bg-surface-strong cursor-zoom-in group"
                          onClick={() => openSingleView(i)}
                        >
                          <img
                            src={photo.url}
                            alt={photo.alt || `${alt} - Photo ${i + 1}`}
                            className="w-full h-full object-cover transition-transform duration-200 group-hover:scale-[1.01] will-change-transform backface-visibility-hidden"
                            loading={i < 6 ? "eager" : "lazy"}
                            decoding={i < 6 ? "sync" : "async"}
                            fetchPriority={i < 4 ? "high" : "auto"}
                            sizes="(max-width: 768px) 100vw, 50vw"
                            style={{ 
                              transform: 'translateZ(0)',
                              contentVisibility: i >= 6 ? 'auto' : 'visible',
                              imageRendering: 'auto',
                            }}
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                ) : activeTab === "virtualTour" ? (
                  /* Virtual Tour Tab */
                  <div className="flex flex-col items-center justify-center h-full p-8">
                    <div className="text-center max-w-md">
                      <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                        <ExternalLink className="h-10 w-10 text-primary" />
                      </div>
                      <h3 className="text-xl font-semibold text-foreground mb-2">Virtual Tour Available</h3>
                      <p className="text-foreground mb-6">
                        Explore this property from the comfort of your home with an immersive 3D tour.
                      </p>
                      <Button
                        size="lg"
                        className="gap-2"
                        onClick={() => virtualTourUrl && window.open(virtualTourUrl, "_blank")}
                      >
                        <ExternalLink className="h-4 w-4" />
                        Open Virtual Tour
                      </Button>
                    </div>
                  </div>
                ) : activeTab === "video" && videoEmbedUrl ? (
                  /* Video Tab */
                  <div className="flex flex-col items-center justify-center h-full p-4 md:p-8">
                    <div className="w-full max-w-4xl">
                      <div className="relative aspect-video rounded-xl overflow-hidden bg-neutral-900 shadow-lg">
                        <iframe
                          src={videoEmbedUrl}
                          className="absolute inset-0 w-full h-full"
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                          allowFullScreen
                          title={`${alt} Video Tour`}
                        />
                      </div>
                      <p className="text-center text-muted-foreground text-sm mt-4">
                        Watch the video tour to explore this property
                      </p>
                    </div>
                  </div>
                ) : null}
              </div>
            ) : (
              /* Single Image View with Zoom */
              <div 
                className="flex-1 bg-neutral-900 flex items-center justify-center relative overflow-hidden"
                onTouchStart={onZoomedTouchStart}
                onTouchMove={onZoomedTouchMove}
                onTouchEnd={onZoomedTouchEnd}
              >
                {/* Previous button */}
                {photos.length > 1 && scale <= 1 && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute left-4 z-10 h-12 w-12 text-on-dark bg-neutral-900/40 hover:bg-neutral-900/60"
                    onClick={goToPrevZoomed}
                  >
                    <ChevronLeft className="h-8 w-8" />
                  </Button>
                )}

                {/* Image */}
                <img
                  src={photos[zoomedIndex]?.url}
                  alt={photos[zoomedIndex]?.alt || `${alt} - Photo ${zoomedIndex + 1}`}
                  className="max-w-full max-h-full object-contain select-none"
                  loading="eager"
                  fetchpriority="high"
                  sizes="100vw"
                  style={{
                    transform: `scale(${scale}) translate(${position.x / scale}px, ${position.y / scale}px)`,
                    transition: isDragging ? 'none' : 'transform 0.2s ease-out',
                    cursor: scale > 1 ? 'grab' : 'default',
                    imageRendering: 'auto',
                  }}
                  draggable={false}
                  onDoubleClick={() => {
                    if (scale > 1) {
                      setScale(1);
                      setPosition({ x: 0, y: 0 });
                    } else {
                      setScale(2.5);
                    }
                  }}
                />

                {/* Next button */}
                {photos.length > 1 && scale <= 1 && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute right-4 z-10 h-12 w-12 text-on-dark bg-neutral-900/40 hover:bg-neutral-900/60"
                    onClick={goToNextZoomed}
                  >
                    <ChevronRight className="h-8 w-8" />
                  </Button>
                )}
              </div>
            )}
            
            {/* Floating CTA - Mobile only */}
            {(onScheduleShowing || onGalleryCTA) && (
              <div className="fixed bottom-0 left-0 right-0 px-4 pt-3 pb-4 bg-gradient-to-t from-neutral-900/90 to-transparent md:hidden z-50" style={{ paddingBottom: 'max(1rem, env(safe-area-inset-bottom))' }}>
                <Button 
                  onClick={() => {
                    setIsOpen(false);
                    if (onScheduleShowing) onScheduleShowing();
                    else if (onGalleryCTA) onGalleryCTA();
                  }}
                  className="w-full h-12 bg-foreground hover:bg-foreground/90 text-background font-semibold text-base rounded-xl shadow-xl"
                >
                  {onScheduleShowing ? (
                    <>
                      <Calendar className="h-5 w-5 mr-2" />
                      Schedule Showing
                    </>
                  ) : (
                    <>
                      <Download className="h-5 w-5 mr-2" />
                      {galleryCTALabel}
                    </>
                  )}
                </Button>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
