import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import { Button } from "@/components/ui/button";
import { X, ChevronLeft, ChevronRight, Expand, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";

interface Photo {
  url: string;
  alt?: string;
}

interface REWPhotoGalleryProps {
  photos: Photo[];
  virtualTourUrl?: string | null;
  alt?: string;
  className?: string;
}

type GalleryTab = "photos" | "virtualTour";

export function REWPhotoGallery({
  photos,
  virtualTourUrl,
  alt = "Property",
  className = "",
}: REWPhotoGalleryProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<GalleryTab>("photos");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [swipeOffset, setSwipeOffset] = useState(0);

  // Lock body scroll when gallery is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
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
          onTouchEnd={onTouchEnd}
        >
          <div
            onClick={() => openGallery(selectedIndex)}
            className="relative aspect-[4/3] rounded-xl overflow-hidden bg-muted"
          >
            <img
              src={photos[selectedIndex]?.url}
              alt={photos[selectedIndex]?.alt || alt}
              className="w-full h-full object-cover transition-transform duration-300"
              style={{ transform: `translateX(${swipeOffset}px)` }}
              loading="eager"
            />
            
            {/* Photo counter badge */}
            <div className="absolute bottom-3 right-3 bg-black/70 text-white text-xs font-medium px-2.5 py-1 rounded-full backdrop-blur-sm">
              {selectedIndex + 1} / {photos.length}
            </div>

          </div>

          {/* Nav arrows on preview */}
          {photos.length > 1 && (
            <>
              <Button
                variant="ghost"
                size="icon"
                className="absolute left-2 top-1/2 -translate-y-1/2 h-10 w-10 bg-white/90 hover:bg-white text-foreground shadow-md opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={(e) => { e.stopPropagation(); goToPrev(); }}
              >
                <ChevronLeft className="h-5 w-5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-2 top-1/2 -translate-y-1/2 h-10 w-10 bg-white/90 hover:bg-white text-foreground shadow-md opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={(e) => { e.stopPropagation(); goToNext(); }}
              >
                <ChevronRight className="h-5 w-5" />
              </Button>
            </>
          )}
        </div>

        {/* Thumbnail strip */}
        {photos.length > 1 && (
          <div className="hidden md:flex gap-2 overflow-x-auto pb-1">
            {photos.slice(0, 6).map((photo, i) => (
              <button
                key={i}
                onClick={() => setSelectedIndex(i)}
                className={cn(
                  "shrink-0 w-20 h-16 rounded-lg overflow-hidden border-2 transition-all",
                  selectedIndex === i ? "border-primary ring-1 ring-primary" : "border-transparent opacity-70 hover:opacity-100"
                )}
              >
                <img src={photo.url} alt="" className="w-full h-full object-cover" loading="lazy" />
              </button>
            ))}
            {photos.length > 6 && (
              <button
                onClick={() => openGallery(6)}
                className="shrink-0 w-20 h-16 rounded-lg overflow-hidden bg-muted flex items-center justify-center text-sm font-medium text-muted-foreground hover:bg-muted/80 transition-colors"
              >
                +{photos.length - 6}
              </button>
            )}
          </div>
        )}
      </div>

      {/* Full Screen Gallery Modal - REW Style */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-[100vw] max-h-[100vh] w-[100vw] h-[100vh] p-0 bg-gray-50 border-none rounded-none [&>button]:hidden overflow-hidden">
          <VisuallyHidden>
            <DialogTitle>Photo Gallery - {alt}</DialogTitle>
          </VisuallyHidden>
          
          <div className="flex flex-col h-full overflow-hidden">
            {/* Header with tabs */}
            <header className="flex items-center justify-between px-4 py-3 border-b bg-white sticky top-0 z-50">
              {/* Back button */}
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsOpen(false)}
                className="h-10 w-10 text-gray-600 hover:text-gray-900 hover:bg-gray-100"
              >
                <ChevronLeft className="h-6 w-6" />
              </Button>

              {/* Tab Toggle */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setActiveTab("photos")}
                  className={cn(
                    "px-5 py-2 rounded-full text-sm font-semibold transition-all",
                    activeTab === "photos"
                      ? "bg-primary text-primary-foreground"
                      : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50"
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
                        : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50"
                    )}
                  >
                    VIRTUAL TOURS
                  </button>
                )}
              </div>

              {/* Close button */}
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsOpen(false)}
                className="h-10 w-10 text-gray-600 hover:text-gray-900 hover:bg-gray-100"
              >
                <X className="h-6 w-6" />
              </Button>
            </header>

            {/* Content Area */}
            <div className="flex-1 overflow-y-auto overscroll-contain touch-pan-y">
              {activeTab === "photos" ? (
                <div className="p-4 md:p-8 lg:p-12 pb-20">
                  {/* 2-column grid of photos */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-6xl mx-auto">
                    {photos.map((photo, i) => (
                      <div
                        key={i}
                        className="relative aspect-[4/3] rounded-xl overflow-hidden bg-gray-200 cursor-zoom-in group"
                        onClick={() => {
                          // Could add a zoomed single-image view here
                        }}
                      >
                        <img
                          src={photo.url}
                          alt={photo.alt || `${alt} - Photo ${i + 1}`}
                          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
                          loading={i < 4 ? "eager" : "lazy"}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                /* Virtual Tour Tab */
                <div className="flex flex-col items-center justify-center h-full p-8">
                  <div className="text-center max-w-md">
                    <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                      <ExternalLink className="h-10 w-10 text-primary" />
                    </div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">Virtual Tour Available</h3>
                    <p className="text-gray-600 mb-6">
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
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
