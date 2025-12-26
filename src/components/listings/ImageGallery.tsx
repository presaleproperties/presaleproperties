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
        <div className="aspect-[4/3] bg-muted rounded-xl overflow-hidden">
          <img
            src={currentPhoto?.url}
            alt={`${title} - Photo ${currentIndex + 1}`}
            className="w-full h-full object-cover cursor-pointer transition-transform hover:scale-105"
            onClick={() => setIsLightboxOpen(true)}
          />
        </div>
        
        {/* Navigation Arrows */}
        {photos.length > 1 && (
          <>
            <Button
              variant="secondary"
              size="icon"
              className="absolute left-3 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-background/80 hover:bg-background"
              onClick={goToPrevious}
            >
              <ChevronLeft className="h-5 w-5" />
            </Button>
            <Button
              variant="secondary"
              size="icon"
              className="absolute right-3 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-background/80 hover:bg-background"
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
          className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity bg-background/80 hover:bg-background"
          onClick={() => setIsLightboxOpen(true)}
        >
          <Expand className="h-4 w-4" />
        </Button>

        {/* Photo Counter */}
        {photos.length > 1 && (
          <div className="absolute bottom-3 left-3 bg-background/80 backdrop-blur-sm px-3 py-1 rounded-full text-sm font-medium">
            {currentIndex + 1} / {photos.length}
          </div>
        )}
      </div>

      {/* Thumbnail Strip */}
      {photos.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-2">
          {photos.map((photo, index) => (
            <button
              key={photo.id}
              onClick={() => setCurrentIndex(index)}
              className={`flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 transition-colors ${
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
