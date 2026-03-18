import { useState, useRef } from "react";
import { GalleryLightbox } from "./GalleryLightbox";
import { ImageIcon, Grid3x3 } from "lucide-react";

interface DeckGallerySectionProps {
  images: string[];
  onGalleryOpen?: () => void;
  onGalleryClose?: () => void;
}

export function DeckGallerySection({ images, onGalleryOpen, onGalleryClose }: DeckGallerySectionProps) {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const stripRef = useRef<HTMLDivElement>(null);

  const openLightbox = (index: number) => {
    onGalleryOpen?.();
    setLightboxIndex(index);
  };

  const closeLightbox = () => {
    setLightboxIndex(null);
    onGalleryClose?.();
  };

  const handlePrev = () =>
    setLightboxIndex((i) => (i !== null ? (i - 1 + images.length) % images.length : 0));
  const handleNext = () =>
    setLightboxIndex((i) => (i !== null ? (i + 1) % images.length : 0));
  const handleJumpTo = (i: number) => setLightboxIndex(i);

  if (images.length === 0) {
    return (
      <section id="gallery" className="relative py-8 sm:py-24 bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="mb-4 sm:mb-12 space-y-1">
            <p className="text-primary text-xs font-semibold uppercase tracking-[0.2em]">04 — Gallery</p>
            <h2 className="text-2xl sm:text-4xl font-bold text-foreground">Project Photos</h2>
          </div>
          <div className="py-16 text-center text-muted-foreground flex flex-col items-center gap-3">
            <ImageIcon className="h-10 w-10 opacity-30" />
            <p>Gallery photos coming soon.</p>
          </div>
        </div>
      </section>
    );
  }

  const [first, ...rest] = images;

  return (
    <section id="gallery" className="relative py-8 sm:py-20 bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="mb-4 sm:mb-10 space-y-1">
          <p className="text-primary text-xs font-semibold uppercase tracking-[0.2em]">04 — Gallery</p>
          <h2 className="text-2xl sm:text-3xl font-bold text-foreground">Project Photos</h2>
        </div>

        {/* ── Mobile: hero + horizontal thumbnail strip ── */}
        <div className="sm:hidden space-y-2">
          <button
            onClick={() => openLightbox(0)}
            className="relative w-full overflow-hidden rounded-2xl touch-manipulation active:opacity-90 transition-opacity"
            style={{ aspectRatio: "16/9" }}
          >
            <img src={first} alt="Gallery hero" className="w-full h-full object-cover" loading="eager" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
            <div className="absolute bottom-3 right-3 flex items-center gap-1.5 bg-black/70 backdrop-blur-sm text-white text-xs font-semibold px-3 py-1.5 rounded-full">
              <Grid3x3 className="h-3 w-3" />
              {images.length} photos
            </div>
          </button>

          {rest.length > 0 && (
            <div
              ref={stripRef}
              className="flex gap-2 overflow-x-auto snap-x snap-mandatory pb-1"
              style={{ scrollbarWidth: "none", WebkitOverflowScrolling: "touch" }}
            >
              {rest.map((img, i) => (
                <button
                  key={i + 1}
                  onClick={() => openLightbox(i + 1)}
                  className="snap-start shrink-0 w-24 h-20 rounded-xl overflow-hidden touch-manipulation active:opacity-80 transition-opacity"
                >
                  <img src={img} alt={`Photo ${i + 2}`} className="w-full h-full object-cover" loading="lazy" />
                </button>
              ))}
              <button
                onClick={() => openLightbox(0)}
                className="snap-start shrink-0 w-24 h-20 rounded-xl bg-foreground/90 flex flex-col items-center justify-center gap-1 touch-manipulation"
              >
                <Grid3x3 className="h-4 w-4 text-background" />
                <span className="text-background text-[10px] font-bold">All Photos</span>
              </button>
            </div>
          )}
        </div>

        {/* ── Desktop: hero + masonry-style grid ── */}
        <div className="hidden sm:grid grid-cols-4 gap-2">
          {/* Hero image: 2-col, 2-row span */}
          <div
            className="col-span-2 row-span-2 overflow-hidden rounded-2xl cursor-pointer relative group"
            style={{ height: "440px" }}
            onClick={() => openLightbox(0)}
          >
            <img
              src={first}
              alt="Gallery 1"
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              loading="eager"
            />
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/15 transition-colors duration-200" />
            <div className="absolute bottom-3 left-3 opacity-0 group-hover:opacity-100 transition-opacity">
              <div className="bg-background/90 backdrop-blur-sm rounded-lg px-3 py-1.5 flex items-center gap-1.5 text-xs font-semibold text-foreground">
                <Grid3x3 className="h-3.5 w-3.5" />
                View All {images.length} Photos
              </div>
            </div>
          </div>

          {rest.slice(0, 4).map((img, i) => (
            <div
              key={i + 1}
              className="overflow-hidden rounded-2xl cursor-pointer relative group"
              style={{ height: "214px" }}
              onClick={() => openLightbox(i + 1)}
            >
              <img
                src={img}
                alt={`Gallery ${i + 2}`}
                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-200" />
              {i === 3 && images.length > 6 && (
                <div className="absolute inset-0 bg-black/55 flex flex-col items-center justify-center gap-1">
                  <span className="text-white font-bold text-xl">+{images.length - 5}</span>
                  <span className="text-white/70 text-xs font-medium">more photos</span>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {lightboxIndex !== null && (
        <GalleryLightbox
          images={images}
          currentIndex={lightboxIndex}
          onClose={closeLightbox}
          onPrev={handlePrev}
          onNext={handleNext}
          onJumpTo={handleJumpTo}
        />
      )}
    </section>
  );
}
