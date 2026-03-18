import { useEffect, useRef, useState, useCallback } from "react";
import { createPortal } from "react-dom";
import { X, ChevronLeft, ChevronRight } from "lucide-react";

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
  const thumbnailRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<(HTMLDivElement | null)[]>([]);
  const [activeIndex, setActiveIndex] = useState(currentIndex);
  const isScrollingProgrammatically = useRef(false);

  // Keyboard nav (desktop)
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft" || e.key === "ArrowUp") onPrev();
      if (e.key === "ArrowRight" || e.key === "ArrowDown") onNext();
    };
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKey);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", handleKey);
    };
  }, [onClose, onPrev, onNext]);

  // When currentIndex changes externally (thumbnail click / keyboard), scroll to that item
  useEffect(() => {
    const el = itemRefs.current[currentIndex];
    if (!el || !scrollContainerRef.current) return;
    isScrollingProgrammatically.current = true;
    el.scrollIntoView({ behavior: "smooth", block: "center" });
    setActiveIndex(currentIndex);
    setTimeout(() => { isScrollingProgrammatically.current = false; }, 600);
  }, [currentIndex]);

  // Sync thumbnail strip when activeIndex changes
  useEffect(() => {
    if (!thumbnailRef.current) return;
    const active = thumbnailRef.current.querySelector(`[data-index="${activeIndex}"]`) as HTMLElement;
    if (active) active.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
  }, [activeIndex]);

  // IntersectionObserver to track which image is most visible while scrolling
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (isScrollingProgrammatically.current) return;
        let best: { index: number; ratio: number } | null = null;
        entries.forEach((entry) => {
          const idx = parseInt((entry.target as HTMLElement).dataset.imgIndex || "-1", 10);
          if (idx >= 0 && (!best || entry.intersectionRatio > best.ratio)) {
            best = { index: idx, ratio: entry.intersectionRatio };
          }
        });
        if (best && (best as any).ratio > 0.4) {
          setActiveIndex((best as any).index);
          onJumpTo?.((best as any).index);
        }
      },
      { root: container, threshold: [0.4, 0.6, 0.8] }
    );

    itemRefs.current.forEach((el) => { if (el) observer.observe(el); });
    return () => observer.disconnect();
  }, [images, onJumpTo]);

  if (images.length === 0) return null;

  return createPortal(
    <div className="fixed inset-0 z-[9999] bg-black flex flex-col" style={{ height: "100dvh" }}>
      {/* Top bar */}
      <div
        className="flex items-center justify-between px-4 shrink-0 bg-black/80 backdrop-blur-sm"
        style={{ paddingTop: "max(0.875rem, env(safe-area-inset-top))", paddingBottom: "0.875rem" }}
      >
        <span className="text-white/60 text-sm font-medium tabular-nums">
          {activeIndex + 1} / {images.length}
        </span>
        <button
          className="p-2.5 rounded-full bg-white/12 active:bg-white/25 text-white transition-colors touch-manipulation"
          onClick={onClose}
          aria-label="Close gallery"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* ── MOBILE: vertical scroll list ── */}
      <div
        ref={scrollContainerRef}
        className="sm:hidden flex-1 overflow-y-auto overscroll-contain"
        style={{ scrollSnapType: "y mandatory", WebkitOverflowScrolling: "touch" }}
      >
        {images.map((img, i) => (
          <div
            key={i}
            ref={(el) => { itemRefs.current[i] = el; }}
            data-img-index={i}
            className="flex items-center justify-center px-3 py-2"
            style={{ scrollSnapAlign: "center", minHeight: "60dvh" }}
          >
            <img
              src={img}
              alt={`Gallery image ${i + 1}`}
              className="max-w-full rounded-xl object-contain"
              style={{ maxHeight: "80dvh" }}
              loading={i === 0 ? "eager" : "lazy"}
              draggable={false}
            />
          </div>
        ))}
        {/* Bottom safe-area spacer */}
        <div style={{ height: "max(1rem, env(safe-area-inset-bottom))" }} />
      </div>

      {/* ── DESKTOP: single image with arrows ── */}
      <div className="hidden sm:flex flex-1 items-center justify-center relative min-h-0 select-none px-16">
        {images.length > 1 && (
          <button
            className="absolute left-4 p-3 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors z-10 flex items-center justify-center"
            onClick={onPrev}
            aria-label="Previous"
          >
            <ChevronLeft className="h-6 w-6" />
          </button>
        )}

        <img
          key={currentIndex}
          src={images[currentIndex]}
          alt={`Gallery image ${currentIndex + 1}`}
          className="max-w-full max-h-full object-contain rounded-md"
          style={{ maxHeight: "calc(100dvh - 140px)" }}
          draggable={false}
        />

        {images.length > 1 && (
          <button
            className="absolute right-4 p-3 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors z-10 flex items-center justify-center"
            onClick={onNext}
            aria-label="Next"
          >
            <ChevronRight className="h-6 w-6" />
          </button>
        )}
      </div>

      {/* Thumbnail strip — desktop only */}
      {images.length > 1 && (
        <div
          ref={thumbnailRef}
          className="hidden sm:flex shrink-0 px-3 pt-2 gap-2 overflow-x-auto bg-black/80 scrollbar-hide"
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
                  : "border-transparent opacity-45 hover:opacity-80"
              }`}
            >
              <img src={img} alt="" className="w-full h-full object-cover" loading="lazy" />
            </button>
          ))}
        </div>
      )}

      {/* Mobile scroll hint */}
      {images.length > 1 && (
        <div
          className="sm:hidden shrink-0 flex items-center justify-center py-2 bg-black/80"
          style={{ paddingBottom: "max(0.5rem, env(safe-area-inset-bottom))" }}
        >
          <span className="text-white/40 text-[11px] tracking-wide">Scroll to browse</span>
        </div>
      )}
    </div>,
    document.body
  );
}
