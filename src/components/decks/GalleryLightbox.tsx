import { useEffect, useRef, useState } from "react";
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

  // Lock body scroll + keyboard nav
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

  // Scroll to item when currentIndex changes (external control)
  useEffect(() => {
    const el = itemRefs.current[currentIndex];
    if (!el || !scrollContainerRef.current) return;
    isScrollingProgrammatically.current = true;
    el.scrollIntoView({ behavior: "smooth", block: "center" });
    setActiveIndex(currentIndex);
    setTimeout(() => { isScrollingProgrammatically.current = false; }, 700);
  }, [currentIndex]);

  // Sync thumbnail strip
  useEffect(() => {
    if (!thumbnailRef.current) return;
    const active = thumbnailRef.current.querySelector(`[data-index="${activeIndex}"]`) as HTMLElement;
    if (active) active.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
  }, [activeIndex]);

  // IntersectionObserver — track active image while user scrolls
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
        if (best && (best as any).ratio > 0.35) {
          setActiveIndex((best as any).index);
          onJumpTo?.((best as any).index);
        }
      },
      { root: container, threshold: [0.35, 0.5, 0.75, 1.0] }
    );
    itemRefs.current.forEach((el) => { if (el) observer.observe(el); });
    return () => observer.disconnect();
  }, [images, onJumpTo]);

  if (images.length === 0) return null;

  return createPortal(
    <div className="fixed inset-0 z-[9999] bg-black flex flex-col" style={{ height: "100dvh" }}>

      {/* Top bar */}
      <div
        className="flex items-center justify-between px-4 shrink-0 bg-black/90 backdrop-blur-sm"
        style={{ paddingTop: "max(0.875rem, env(safe-area-inset-top))", paddingBottom: "0.875rem" }}
      >
        <span className="text-white/60 text-sm font-medium tabular-nums">
          {activeIndex + 1} / {images.length}
        </span>
        <button
          className="p-2.5 rounded-full bg-white/10 hover:bg-white/20 active:bg-white/30 text-white transition-colors touch-manipulation"
          onClick={onClose}
          aria-label="Close gallery"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* ── UNIFIED: smooth vertical scroll for ALL devices ── */}
      <div
        ref={scrollContainerRef}
        className="flex-1 overflow-y-auto overscroll-contain"
        style={{
          WebkitOverflowScrolling: "touch",
          scrollBehavior: "smooth",
        }}
      >
        <div className="flex flex-col" style={{ gap: "2px" }}>
          {images.map((img, i) => (
            <div
              key={i}
              ref={(el) => { itemRefs.current[i] = el; }}
              data-img-index={i}
              className="flex items-center justify-center bg-black"
              style={{ minHeight: "80dvh" }}
            >
              <img
                src={img}
                alt={`Gallery image ${i + 1}`}
                className="w-full object-contain"
                style={{ maxHeight: "80dvh", display: "block" }}
                loading={i <= 1 ? "eager" : "lazy"}
                draggable={false}
              />
            </div>
          ))}
          <div style={{ height: "max(1rem, env(safe-area-inset-bottom))" }} />
        </div>
      </div>

      {/* Desktop arrow nav — overlaid on sides */}
      {images.length > 1 && (
        <>
          <button
            className="hidden sm:flex absolute left-4 top-1/2 -translate-y-1/2 z-10 p-3 rounded-full bg-black/50 hover:bg-black/70 text-white transition-colors items-center justify-center"
            onClick={onPrev}
            aria-label="Previous"
          >
            <ChevronLeft className="h-6 w-6" />
          </button>
          <button
            className="hidden sm:flex absolute right-4 top-1/2 -translate-y-1/2 z-10 p-3 rounded-full bg-black/50 hover:bg-black/70 text-white transition-colors items-center justify-center"
            onClick={onNext}
            aria-label="Next"
          >
            <ChevronRight className="h-6 w-6" />
          </button>
        </>
      )}

      {/* Thumbnail strip */}
      {images.length > 1 && (
        <div
          ref={thumbnailRef}
          className="shrink-0 flex px-3 pt-2 gap-2 overflow-x-auto bg-black/90 scrollbar-hide"
          style={{ paddingBottom: "max(0.75rem, env(safe-area-inset-bottom))" }}
        >
          {images.map((img, i) => (
            <button
              key={i}
              data-index={i}
              onClick={() => onJumpTo?.(i)}
              className={`shrink-0 w-12 h-12 sm:w-14 sm:h-14 rounded-lg overflow-hidden border-2 transition-all touch-manipulation ${
                i === activeIndex
                  ? "border-primary opacity-100 scale-105"
                  : "border-transparent opacity-40 hover:opacity-70"
              }`}
            >
              <img src={img} alt="" className="w-full h-full object-cover" loading="lazy" />
            </button>
          ))}
        </div>
      )}
    </div>,
    document.body
  );
}
