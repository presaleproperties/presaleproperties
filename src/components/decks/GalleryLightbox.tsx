import { useEffect, useRef, useState } from "react";
import { X, ChevronLeft, ChevronRight } from "lucide-react";

interface GalleryLightboxProps {
  images: string[];
  currentIndex: number;
  onClose: () => void;
  onPrev: () => void;
  onNext: () => void;
}

export function GalleryLightbox({ images, currentIndex, onClose, onPrev, onNext }: GalleryLightboxProps) {
  const touchStartX = useRef<number | null>(null);
  const touchStartY = useRef<number | null>(null);
  const thumbnailRef = useRef<HTMLDivElement>(null);
  const [imgLoaded, setImgLoaded] = useState(false);

  // Reset loaded state on image change
  useEffect(() => { setImgLoaded(false); }, [currentIndex]);

  // Keyboard navigation + body scroll lock
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft") onPrev();
      if (e.key === "ArrowRight") onNext();
    };
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKey);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", handleKey);
    };
  }, [onClose, onPrev, onNext]);

  // Scroll active thumbnail into view
  useEffect(() => {
    if (!thumbnailRef.current) return;
    const active = thumbnailRef.current.querySelector(`[data-index="${currentIndex}"]`) as HTMLElement;
    if (active) active.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
  }, [currentIndex]);

  // Touch swipe handlers
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null || touchStartY.current === null) return;
    const dx = e.changedTouches[0].clientX - touchStartX.current;
    const dy = e.changedTouches[0].clientY - touchStartY.current;
    // Only trigger if horizontal swipe is dominant and > 40px
    if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 40) {
      dx < 0 ? onNext() : onPrev();
    }
    touchStartX.current = null;
    touchStartY.current = null;
  };

  if (images.length === 0) return null;

  return (
    <div
      className="fixed inset-0 z-[200] bg-black flex flex-col"
      style={{ height: "100dvh" }}
    >
      {/* Top bar */}
      <div
        className="flex items-center justify-between px-4 shrink-0 bg-black/80 backdrop-blur-sm"
        style={{ paddingTop: "max(0.875rem, env(safe-area-inset-top))", paddingBottom: "0.875rem" }}
      >
        <span className="text-white/60 text-sm font-medium tabular-nums">
          {currentIndex + 1} / {images.length}
        </span>
        <button
          className="p-2.5 rounded-full bg-white/12 active:bg-white/25 text-white transition-colors touch-manipulation"
          onClick={onClose}
          aria-label="Close gallery"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* Main image area — swipeable */}
      <div
        className="flex-1 flex items-center justify-center relative min-h-0 select-none"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        {/* Prev arrow — hidden on mobile (use swipe) */}
        {images.length > 1 && (
          <button
            className="hidden sm:flex absolute left-4 p-3 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors z-10 touch-manipulation items-center justify-center"
            onClick={onPrev}
            aria-label="Previous"
          >
            <ChevronLeft className="h-6 w-6" />
          </button>
        )}

        {/* Loading shimmer */}
        {!imgLoaded && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-10 h-10 rounded-full border-2 border-white/20 border-t-white/60 animate-spin" />
          </div>
        )}

        <img
          key={currentIndex}
          src={images[currentIndex]}
          alt={`Gallery image ${currentIndex + 1}`}
          onLoad={() => setImgLoaded(true)}
          className="max-w-full max-h-full object-contain rounded-md"
          style={{
            maxHeight: "calc(100dvh - 130px)",
            opacity: imgLoaded ? 1 : 0,
            transition: "opacity 0.2s ease",
          }}
          draggable={false}
        />

        {/* Next arrow — hidden on mobile */}
        {images.length > 1 && (
          <button
            className="hidden sm:flex absolute right-4 p-3 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors z-10 touch-manipulation items-center justify-center"
            onClick={onNext}
            aria-label="Next"
          >
            <ChevronRight className="h-6 w-6" />
          </button>
        )}

        {/* Mobile swipe hint — only shows briefly on first open */}
        {images.length > 1 && (
          <div className="sm:hidden absolute bottom-3 left-1/2 -translate-x-1/2 px-3 py-1.5 rounded-full bg-black/50 backdrop-blur-sm">
            <span className="text-white/60 text-[11px] tracking-wide">Swipe to browse</span>
          </div>
        )}
      </div>

      {/* Thumbnail strip */}
      {images.length > 1 && (
        <div
          ref={thumbnailRef}
          className="shrink-0 px-3 pt-2 flex gap-2 overflow-x-auto bg-black/80"
          style={{ paddingBottom: "max(0.75rem, env(safe-area-inset-bottom))" }}
          onClick={(e) => e.stopPropagation()}
        >
          {images.map((img, i) => (
            <button
              key={i}
              data-index={i}
              onClick={() => {
                // Navigate directly to tapped thumbnail
                const diff = i - currentIndex;
                if (diff > 0) { for (let j = 0; j < diff; j++) onNext(); }
                else if (diff < 0) { for (let j = 0; j < Math.abs(diff); j++) onPrev(); }
              }}
              className={`shrink-0 w-14 h-14 rounded-lg overflow-hidden border-2 transition-all touch-manipulation ${
                i === currentIndex
                  ? "border-primary opacity-100 scale-105"
                  : "border-transparent opacity-45 active:opacity-80"
              }`}
            >
              <img src={img} alt="" className="w-full h-full object-cover" loading="lazy" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
