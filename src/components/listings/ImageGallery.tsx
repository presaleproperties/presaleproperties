import { useState } from "react";
import { ChevronLeft, ChevronRight, X, Expand } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";

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

  const hasPhotos = photos.length > 0;
  const currentPhoto = hasPhotos ? photos[currentIndex] : null;

  const goToPrevious = () => {
    setCurrentIndex((prev) => (prev === 0 ? photos.length - 1 : prev - 1));
  };

  const goToNext = () => {
    setCurrentIndex((prev) => (prev === photos.length - 1 ? 0 : prev + 1));
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
        <div className="aspect-[4/3] md:aspect-[4/3] bg-muted rounded-xl overflow-hidden">
          <img
            src={currentPhoto?.url}
            alt={`${title} - Photo ${currentIndex + 1}`}
            className="w-full h-full object-cover cursor-pointer transition-transform hover:scale-105"
            onClick={() => setIsLightboxOpen(true)}
          />
        </div>
        
        {/* Navigation Arrows - Always visible on mobile */}
        {photos.length > 1 && (
          <>
            <Button
              variant="secondary"
              size="icon"
              className="absolute left-2 md:left-3 top-1/2 -translate-y-1/2 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity bg-background/80 hover:bg-background h-8 w-8 md:h-10 md:w-10"
              onClick={goToPrevious}
            >
              <ChevronLeft className="h-4 w-4 md:h-5 md:w-5" />
            </Button>
            <Button
              variant="secondary"
              size="icon"
              className="absolute right-2 md:right-3 top-1/2 -translate-y-1/2 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity bg-background/80 hover:bg-background h-8 w-8 md:h-10 md:w-10"
              onClick={goToNext}
            >
              <ChevronRight className="h-4 w-4 md:h-5 md:w-5" />
            </Button>
          </>
        )}

        {/* Expand Button */}
        <Button
          variant="secondary"
          size="icon"
          className="absolute top-2 md:top-3 right-2 md:right-3 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity bg-background/80 hover:bg-background h-8 w-8 md:h-10 md:w-10"
          onClick={() => setIsLightboxOpen(true)}
        >
          <Expand className="h-4 w-4" />
        </Button>

        {/* Photo Counter */}
        {photos.length > 1 && (
          <div className="absolute bottom-2 md:bottom-3 left-2 md:left-3 bg-background/80 backdrop-blur-sm px-2 md:px-3 py-0.5 md:py-1 rounded-full text-xs md:text-sm font-medium">
            {currentIndex + 1} / {photos.length}
          </div>
        )}
      </div>

      {/* Thumbnail Strip - Grid on mobile, scroll on desktop */}
      {photos.length > 1 && (
        <div className="grid grid-cols-4 sm:grid-cols-5 md:flex gap-2 md:overflow-x-auto md:pb-2">
          {photos.slice(0, 8).map((photo, index) => (
            <button
              key={photo.id}
              onClick={() => setCurrentIndex(index)}
              className={`aspect-square md:aspect-auto md:flex-shrink-0 md:w-20 md:h-20 rounded-lg overflow-hidden border-2 transition-colors ${
                index === currentIndex
                  ? "border-primary"
                  : "border-transparent hover:border-muted-foreground/30"
              }`}
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
        <DialogContent className="max-w-[95vw] max-h-[95vh] p-0 bg-black/95 border-none">
          <div className="relative w-full h-[90vh] flex items-center justify-center">
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-4 right-4 text-white hover:bg-white/20 z-10"
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
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-white hover:bg-white/20"
                  onClick={goToPrevious}
                >
                  <ChevronLeft className="h-8 w-8" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-white hover:bg-white/20"
                  onClick={goToNext}
                >
                  <ChevronRight className="h-8 w-8" />
                </Button>
              </>
            )}

            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white text-sm">
              {currentIndex + 1} / {photos.length}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
