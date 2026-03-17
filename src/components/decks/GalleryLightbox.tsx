import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { X, ChevronLeft, ChevronRight, Grid3x3 } from "lucide-react";

interface GalleryLightboxProps {
  images: string[];
  currentIndex: number;
  onClose: () => void;
  onPrev: () => void;
  onNext: () => void;
  onJumpTo?: (index: number) => void;
}

export function GalleryLightbox({
  images,
  currentIndex,
  onClose,
  onPrev,
  onNext,
  onJumpTo,
}: GalleryLightboxProps) {
  const touchStartX = useRef<number | null>(null);
  const touchStartY = useRef<number | null>(null);
  const thumbnailRef = useRef<HTMLDivElement>(null);
  const [imgLoaded, setImgLoaded] = useState(false);
  const [mode, setMode] = useState<"single" | "grid">("single");

  // Reset loaded state on image change
  useEffect(() => { setImgLoaded(false); }, [currentIndex]);

  // Keyboard navigation + body scroll lock
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (mode === "grid") setMode("single");
        else onClose();
      }
      if (e.key === "ArrowLeft" && mode === "single") onPrev();
      if (e.key === "ArrowRight" && mode === "single") onNext();
    };
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKey);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", handleKey);
    };
  }, [onClose, onPrev, onNext, mode]);

  // Scroll active thumbnail into view
  useEffect(() => {
    if (!thumbnailRef.current) return;
    const active = thumbnailRef.current.querySelector(`[data-index="${currentIndex}"]`) as HTMLElement;
    if (active) active.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
  }, [currentIndex]);

  // Touch swipe on main image area
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null || touchStartY.current === null) return;
    const dx = e.changedTouches[0].clientX - touchStartX.current;
    const dy = e.changedTouches[0].clientY - touchStartY.current;
    if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 40) {
      dx < 0 ? onNext() : onPrev();
    }
    touchStartX.current = null;
    touchStartY.current = null;
  };

  if (images.length === 0) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] bg-white flex flex-col"
      style={{ height: "100dvh" }}
    >
      {/* Top bar */}
      <div
        className="flex items-center justify-between px-4 shrink-0 bg-white border-b border-border/30"
        style={{ paddingTop: "max(0.875rem, env(safe-area-inset-top))", paddingBottom: "0.875rem" }}
      >
        {/* Back / grid toggle */}
        <button
          className="p-2 rounded-full bg-muted hover:bg-muted/80 text-foreground transition-colors touch-manipulation"
          onClick={() => mode === "grid" ? setMode("single") : onPrev()}
          aria-label={mode === "grid" ? "Back to photo" : "Previous"}
        >
          <ChevronLeft className="h-4 w-4" />
        </button>

        {/* Center label */}
        <button
          onClick={() => setMode(mode === "grid" ? "single" : "grid")}
          className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary text-primary-foreground text-xs font-bold uppercase tracking-widest touch-manipulation"
        >
          {mode === "grid" ? (
            <><ChevronLeft className="h-3 w-3 -ml-1" /> Photo</>
          ) : (
            <><Grid3x3 className="h-3 w-3" /> Photos</>
          )}
        </button>

        <button
          className="p-2.5 rounded-full bg-muted hover:bg-muted/80 text-foreground transition-colors touch-manipulation"
          onClick={onClose}
          aria-label="Close gallery"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {mode === "grid" ? (
        /* Grid view — scrollable 2-column, matching project gallery style */
        <div
          className="flex-1 overflow-y-auto bg-[#f5f5f7]"
          style={{ paddingBottom: "max(1rem, env(safe-area-inset-bottom))" }}
        >
          <div className="columns-2 gap-2 p-3">
            {images.map((img, i) => (
              <button
                key={i}
                onClick={() => { onJumpTo?.(i); setMode("single"); }}
                className={`relative w-full mb-2 overflow-hidden rounded-xl block touch-manipulation transition-opacity active:opacity-80 ${
                  i === currentIndex ? "ring-2 ring-primary ring-offset-1" : ""
                }`}
              >
                <img
                  src={img}
                  alt={`Photo ${i + 1}`}
                  className="w-full h-auto object-cover block"
                  loading="lazy"
                />
              </button>
            ))}
          </div>
        </div>
      ) : (
        <>
          {/* Main image area — swipeable */}
          <div
            className="flex-1 flex items-center justify-center relative min-h-0 select-none px-0 sm:px-16 bg-white"
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
          >
            {/* Prev arrow — desktop only */}
            {images.length > 1 && (
              <button
                className="hidden sm:flex absolute left-4 p-3 rounded-full bg-muted hover:bg-muted/80 text-foreground transition-colors z-10 touch-manipulation items-center justify-center"
                onClick={onPrev}
                aria-label="Previous"
              >
                <ChevronLeft className="h-6 w-6" />
              </button>
            )}

            {/* Loading spinner */}
            {!imgLoaded && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="w-10 h-10 rounded-full border-2 border-border border-t-primary animate-spin" />
              </div>
            )}

            <img
              key={currentIndex}
              src={images[currentIndex]}
              alt={`Gallery image ${currentIndex + 1}`}
              onLoad={() => setImgLoaded(true)}
              className="max-w-full max-h-full object-contain rounded-md pointer-events-none"
              style={{
                maxHeight: "calc(100dvh - 160px)",
                opacity: imgLoaded ? 1 : 0,
                transition: "opacity 0.25s ease",
              }}
              draggable={false}
            />

            {/* Next arrow — desktop only */}
            {images.length > 1 && (
              <button
                className="hidden sm:flex absolute right-4 p-3 rounded-full bg-muted hover:bg-muted/80 text-foreground transition-colors z-10 touch-manipulation items-center justify-center"
                onClick={onNext}
                aria-label="Next"
              >
                <ChevronRight className="h-6 w-6" />
              </button>
            )}

            {/* Mobile swipe indicator */}
            {images.length > 1 && (
              <div className="sm:hidden absolute bottom-3 left-1/2 -translate-x-1/2 px-3 py-1.5 rounded-full bg-black/30 backdrop-blur-sm pointer-events-none">
                <span className="text-white text-[11px] tracking-wide">{currentIndex + 1} / {images.length}</span>
              </div>
            )}
          </div>

          {/* Thumbnail strip */}
          {images.length > 1 && (
            <div
              ref={thumbnailRef}
              className="shrink-0 px-3 pt-2 flex gap-2 overflow-x-auto bg-white border-t border-border/20 scrollbar-hide"
              style={{ paddingBottom: "max(0.75rem, env(safe-area-inset-bottom))" }}
            >
              {images.map((img, i) => (
                <button
                  key={i}
                  data-index={i}
                  onClick={() => onJumpTo?.(i)}
                  className={`shrink-0 w-14 h-14 rounded-lg overflow-hidden border-2 transition-all touch-manipulation ${
                    i === currentIndex
                      ? "border-primary opacity-100 scale-105"
                      : "border-transparent opacity-50 hover:opacity-80"
                  }`}
                >
                  <img src={img} alt="" className="w-full h-full object-cover" loading="lazy" />
                </button>
              ))}
            </div>
          )}
        </>
      )}
    </div>,
    document.body
  );
}
