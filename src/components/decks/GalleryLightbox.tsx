import { useEffect } from "react";
import { X, ChevronLeft, ChevronRight } from "lucide-react";

interface GalleryLightboxProps {
  images: string[];
  currentIndex: number;
  onClose: () => void;
  onPrev: () => void;
  onNext: () => void;
}

export function GalleryLightbox({ images, currentIndex, onClose, onPrev, onNext }: GalleryLightboxProps) {
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft") onPrev();
      if (e.key === "ArrowRight") onNext();
    };
    // Lock body scroll
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKey);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", handleKey);
    };
  }, [onClose, onPrev, onNext]);

  if (images.length === 0) return null;

  return (
    <div
      className="fixed inset-0 z-[200] bg-black/98 flex flex-col"
      onClick={onClose}
    >
      {/* Top bar */}
      <div className="flex items-center justify-between px-4 py-3 shrink-0">
        <span className="text-white/50 text-sm font-medium">
          {currentIndex + 1} / {images.length}
        </span>
        <button
          className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
          onClick={onClose}
          aria-label="Close"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* Main image area */}
      <div
        className="flex-1 flex items-center justify-center relative px-4 sm:px-16 min-h-0"
        onClick={(e) => e.stopPropagation()}
      >
        {images.length > 1 && (
          <button
            className="absolute left-2 sm:left-4 p-2.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors z-10 touch-manipulation"
            onClick={(e) => { e.stopPropagation(); onPrev(); }}
            aria-label="Previous"
          >
            <ChevronLeft className="h-6 w-6" />
          </button>
        )}

        <img
          src={images[currentIndex]}
          alt={`Gallery image ${currentIndex + 1}`}
          className="max-w-full max-h-full object-contain select-none rounded-md"
          style={{ maxHeight: "calc(100dvh - 160px)" }}
          draggable={false}
        />

        {images.length > 1 && (
          <button
            className="absolute right-2 sm:right-4 p-2.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors z-10 touch-manipulation"
            onClick={(e) => { e.stopPropagation(); onNext(); }}
            aria-label="Next"
          >
            <ChevronRight className="h-6 w-6" />
          </button>
        )}
      </div>

      {/* Thumbnails */}
      {images.length > 1 && (
        <div
          className="shrink-0 px-4 py-3 flex gap-2 overflow-x-auto justify-center scrollbar-hide"
          onClick={(e) => e.stopPropagation()}
          style={{ paddingBottom: "max(0.75rem, env(safe-area-inset-bottom))" }}
        >
          {images.map((img, i) => (
            <button
              key={i}
              onClick={(e) => { e.stopPropagation(); /* handled via parent state */ }}
              className={`shrink-0 w-12 h-12 rounded-lg overflow-hidden border-2 transition-all touch-manipulation ${
                i === currentIndex ? "border-primary opacity-100" : "border-transparent opacity-40 hover:opacity-70"
              }`}
            >
              <img src={img} alt="" className="w-full h-full object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
