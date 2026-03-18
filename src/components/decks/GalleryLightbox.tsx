import { useEffect, useRef, useState, useCallback } from "react";
import { createPortal } from "react-dom";
import { X, ChevronLeft, ChevronRight, ZoomIn } from "lucide-react";

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
  const [isVisible, setIsVisible] = useState(false);
  const isScrollingProgrammatically = useRef(false);

  // Zoom state per image
  const [zoomScale, setZoomScale] = useState(1);
  const [zoomOrigin, setZoomOrigin] = useState({ x: 50, y: 50 });
  const pinchStartDistance = useRef<number | null>(null);
  const pinchStartScale = useRef(1);
  const lastTap = useRef<number>(0);

  // Fade in on mount
  useEffect(() => {
    const frame = requestAnimationFrame(() => setIsVisible(true));
    return () => cancelAnimationFrame(frame);
  }, []);

  // Lock body scroll + keyboard nav
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") handleClose();
      if (e.key === "ArrowLeft" || e.key === "ArrowUp") { setZoomScale(1); onPrev(); }
      if (e.key === "ArrowRight" || e.key === "ArrowDown") { setZoomScale(1); onNext(); }
    };
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKey);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", handleKey);
    };
  }, [onClose, onPrev, onNext]);

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(onClose, 200);
  };

  // Scroll to item when currentIndex changes (external control)
  useEffect(() => {
    const el = itemRefs.current[currentIndex];
    if (!el || !scrollContainerRef.current) return;
    isScrollingProgrammatically.current = true;
    setZoomScale(1);
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
          setZoomScale(1);
          onJumpTo?.((best as any).index);
        }
      },
      { root: container, threshold: [0.35, 0.5, 0.75, 1.0] }
    );
    itemRefs.current.forEach((el) => { if (el) observer.observe(el); });
    return () => observer.disconnect();
  }, [images, onJumpTo]);

  // Pinch-to-zoom
  const getDistance = (touches: React.TouchList) => {
    const dx = touches[0].clientX - touches[1].clientX;
    const dy = touches[0].clientY - touches[1].clientY;
    return Math.sqrt(dx * dx + dy * dy);
  };

  const getMidpoint = (touches: React.TouchList) => ({
    x: (touches[0].clientX + touches[1].clientX) / 2,
    y: (touches[0].clientY + touches[1].clientY) / 2,
  });

  const handleTouchStart = useCallback((e: React.TouchEvent<HTMLDivElement>) => {
    if (e.touches.length === 2) {
      pinchStartDistance.current = getDistance(e.touches);
      pinchStartScale.current = zoomScale;
    }
  }, [zoomScale]);

  const handleTouchMove = useCallback((e: React.TouchEvent<HTMLDivElement>) => {
    if (e.touches.length === 2 && pinchStartDistance.current) {
      const dist = getDistance(e.touches);
      const ratio = dist / pinchStartDistance.current;
      const newScale = Math.min(Math.max(pinchStartScale.current * ratio, 1), 4);
      const mid = getMidpoint(e.touches);
      const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
      setZoomOrigin({
        x: ((mid.x - rect.left) / rect.width) * 100,
        y: ((mid.y - rect.top) / rect.height) * 100,
      });
      setZoomScale(newScale);
      if (newScale > 1) e.preventDefault();
    }
  }, []);

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    if (e.touches.length < 2) {
      pinchStartDistance.current = null;
      // Snap back if barely zoomed
      if (zoomScale < 1.15) setZoomScale(1);
    }
  }, [zoomScale]);

  // Double-tap to zoom/unzoom
  const handleDoubleTap = useCallback((e: React.MouseEvent | React.TouchEvent, imgIndex: number) => {
    if (imgIndex !== activeIndex) return;
    const now = Date.now();
    if (now - lastTap.current < 300) {
      // Double tap
      if (zoomScale > 1) {
        setZoomScale(1);
      } else {
        const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
        let cx: number, cy: number;
        if ('clientX' in e) {
          cx = e.clientX;
          cy = e.clientY;
        } else {
          cx = e.touches[0]?.clientX ?? rect.left + rect.width / 2;
          cy = e.touches[0]?.clientY ?? rect.top + rect.height / 2;
        }
        setZoomOrigin({
          x: ((cx - rect.left) / rect.width) * 100,
          y: ((cy - rect.top) / rect.height) * 100,
        });
        setZoomScale(2.5);
      }
    }
    lastTap.current = now;
  }, [zoomScale, activeIndex]);

  if (images.length === 0) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] flex flex-col bg-black"
      style={{
        height: "100dvh",
        opacity: isVisible ? 1 : 0,
        transition: "opacity 0.2s ease",
      }}
    >
      {/* Top bar */}
      <div
        className="flex items-center justify-between px-4 shrink-0 bg-gradient-to-b from-black via-black/80 to-transparent absolute top-0 left-0 right-0 z-20 pointer-events-none"
        style={{ paddingTop: "max(0.875rem, env(safe-area-inset-top))", paddingBottom: "3rem" }}
      >
        <div className="flex items-center gap-3 pointer-events-auto">
          <button
            className="p-2.5 rounded-full bg-white/10 hover:bg-white/20 active:bg-white/30 text-white transition-colors touch-manipulation backdrop-blur-sm"
            onClick={handleClose}
            aria-label="Close gallery"
          >
            <X className="h-5 w-5" />
          </button>
          <span className="text-white/80 text-sm font-medium tabular-nums">
            {activeIndex + 1} <span className="text-white/40">/</span> {images.length}
          </span>
        </div>

        {zoomScale > 1 && (
          <button
            className="pointer-events-auto flex items-center gap-1.5 bg-white/10 backdrop-blur-sm text-white text-xs font-medium px-3 py-1.5 rounded-full border border-white/20 touch-manipulation"
            onClick={() => setZoomScale(1)}
          >
            <ZoomIn className="h-3.5 w-3.5" />
            Reset zoom
          </button>
        )}
      </div>

      {/* Scrollable image stack */}
      <div
        ref={scrollContainerRef}
        className="flex-1 overflow-y-auto overflow-x-hidden overscroll-contain"
        style={{
          WebkitOverflowScrolling: "touch",
          scrollBehavior: "smooth",
          overflowX: zoomScale > 1 ? "auto" : "hidden",
        }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <div className="flex flex-col">
          {/* Top spacer for header overlap */}
          <div className="shrink-0" style={{ height: "max(3.5rem, env(safe-area-inset-top))" }} />

          {images.map((img, i) => (
            <div
              key={i}
              ref={(el) => { itemRefs.current[i] = el; }}
              data-img-index={i}
              className="flex items-center justify-center bg-black select-none"
              style={{ minHeight: "82dvh" }}
              onClick={(e) => handleDoubleTap(e, i)}
            >
              <img
                src={img}
                alt={`Gallery image ${i + 1}`}
                className="w-full object-contain"
                style={{
                  maxHeight: "82dvh",
                  display: "block",
                  transform: i === activeIndex && zoomScale > 1
                    ? `scale(${zoomScale})`
                    : "scale(1)",
                  transformOrigin: `${zoomOrigin.x}% ${zoomOrigin.y}%`,
                  transition: zoomScale === 1 ? "transform 0.25s cubic-bezier(0.25,0.46,0.45,0.94)" : "none",
                  willChange: "transform",
                  cursor: zoomScale > 1 ? "zoom-out" : "zoom-in",
                  touchAction: zoomScale > 1 ? "none" : "pan-y",
                  userSelect: "none",
                  WebkitUserSelect: "none",
                }}
                loading={i <= currentIndex + 1 ? "eager" : "lazy"}
                draggable={false}
              />
            </div>
          ))}

          <div style={{ height: "max(1rem, env(safe-area-inset-bottom))" }} />
        </div>
      </div>

      {/* Desktop arrow nav */}
      {images.length > 1 && zoomScale <= 1 && (
        <>
          <button
            className="hidden sm:flex absolute left-4 top-1/2 -translate-y-1/2 z-20 p-3 rounded-full bg-black/50 hover:bg-black/80 active:scale-95 text-white transition-all items-center justify-center border border-white/10 backdrop-blur-sm"
            onClick={() => { setZoomScale(1); onPrev(); }}
            aria-label="Previous"
          >
            <ChevronLeft className="h-6 w-6" />
          </button>
          <button
            className="hidden sm:flex absolute right-4 top-1/2 -translate-y-1/2 z-20 p-3 rounded-full bg-black/50 hover:bg-black/80 active:scale-95 text-white transition-all items-center justify-center border border-white/10 backdrop-blur-sm"
            onClick={() => { setZoomScale(1); onNext(); }}
            aria-label="Next"
          >
            <ChevronRight className="h-6 w-6" />
          </button>
        </>
      )}

      {/* Hint: double-tap to zoom (mobile, shown briefly) */}
      {zoomScale === 1 && (
        <div
          className="sm:hidden absolute bottom-24 left-1/2 -translate-x-1/2 z-20 pointer-events-none"
          style={{ opacity: 0.5 }}
        >
          <span className="text-white text-[10px] font-medium bg-black/50 backdrop-blur-sm px-2 py-1 rounded-full">
            Double-tap to zoom
          </span>
        </div>
      )}

      {/* Thumbnail strip */}
      {images.length > 1 && (
        <div
          ref={thumbnailRef}
          className="shrink-0 flex px-3 pt-2 gap-2 overflow-x-auto bg-gradient-to-t from-black to-black/90 scrollbar-hide z-20"
          style={{ paddingBottom: "max(0.75rem, env(safe-area-inset-bottom))" }}
        >
          {images.map((img, i) => (
            <button
              key={i}
              data-index={i}
              onClick={() => { setZoomScale(1); onJumpTo?.(i); }}
              className={`shrink-0 rounded-lg overflow-hidden border-2 transition-all duration-200 touch-manipulation ${
                i === activeIndex
                  ? "border-primary opacity-100 scale-110 shadow-lg shadow-primary/30"
                  : "border-transparent opacity-40 hover:opacity-70"
              }`}
              style={{ width: 52, height: 52 }}
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
