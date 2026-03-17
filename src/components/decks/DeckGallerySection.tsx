import { useState, useRef } from "react";
import { GalleryLightbox } from "./GalleryLightbox";
import { ImageIcon, Grid3x3 } from "lucide-react";

interface DeckGallerySectionProps {
  images: string[];
}

export function DeckGallerySection({ images }: DeckGallerySectionProps) {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const stripRef = useRef<HTMLDivElement>(null);

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
            <p className="text-primary text-xs font-semibold uppercase tracking-[0.2em]">03 — Gallery</p>
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
    <section id="gallery" className="relative py-8 sm:py-24 bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        {/* Watermark — desktop only */}
        <div className="hidden sm:block absolute top-8 right-8 text-[180px] font-black text-foreground/[0.025] select-none pointer-events-none leading-none">
          03
        </div>

        <div className="mb-4 sm:mb-12 space-y-1">
          <p className="text-primary text-xs font-semibold uppercase tracking-[0.2em]">03 — Gallery</p>
          <h2 className="text-2xl sm:text-4xl font-bold text-foreground">Project Photos</h2>
        </div>

        {/* ── Mobile: hero + horizontal thumbnail strip ── */}
        <div className="sm:hidden space-y-2">
          <button
            onClick={() => setLightboxIndex(0)}
            className="relative w-full aspect-[16/9] overflow-hidden rounded-xl touch-manipulation active:opacity-90 transition-opacity"
          >
            <img src={first} alt="Gallery hero" className="w-full h-full object-cover" loading="eager" />
            <div className="absolute bottom-2.5 right-2.5 flex items-center gap-1 bg-black/60 backdrop-blur-sm text-white text-[11px] font-semibold px-2.5 py-1 rounded-full">
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
                  onClick={() => setLightboxIndex(i + 1)}
                  className="snap-start shrink-0 w-24 h-20 rounded-lg overflow-hidden touch-manipulation active:opacity-80 transition-opacity"
                >
                  <img src={img} alt={`Photo ${i + 2}`} className="w-full h-full object-cover" loading="lazy" />
                </button>
              ))}
              <button
                onClick={() => setLightboxIndex(0)}
                className="snap-start shrink-0 w-24 h-20 rounded-lg bg-foreground/90 flex flex-col items-center justify-center gap-1 touch-manipulation"
              >
                <Grid3x3 className="h-4 w-4 text-background" />
                <span className="text-background text-[10px] font-bold">All Photos</span>
              </button>
            </div>
          )}
        </div>

        {/* ── Desktop: hero + grid ── */}
        <div className="hidden sm:grid grid-cols-3 md:grid-cols-4 gap-2 sm:gap-3">
          {/* Hero image: 2-col span */}
          <div
            className="col-span-2 row-span-2 overflow-hidden rounded-xl cursor-pointer relative group h-[360px] md:h-[420px]"
            onClick={() => setLightboxIndex(0)}
          >
            <img
              src={first}
              alt="Gallery 1"
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              loading="eager"
            />
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-200" />
            <div className="absolute bottom-3 left-3 opacity-0 group-hover:opacity-100 transition-opacity">
              <div className="bg-background/80 backdrop-blur-sm rounded-lg px-3 py-1.5 flex items-center gap-1.5 text-xs font-semibold text-foreground">
                <Grid3x3 className="h-3.5 w-3.5" />
                View All {images.length} Photos
              </div>
            </div>
          </div>

          {rest.slice(0, 6).map((img, i) => (
            <div
              key={i + 1}
              className="overflow-hidden rounded-xl cursor-pointer relative group h-[170px] md:h-[200px]"
              onClick={() => setLightboxIndex(i + 1)}
            >
              <img
                src={img}
                alt={`Gallery ${i + 2}`}
                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/25 transition-colors duration-200" />
              {i === 5 && images.length > 8 && (
                <div className="absolute inset-0 bg-black/55 flex items-center justify-center">
                  <span className="text-white font-bold text-lg">+{images.length - 7} more</span>
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
          onClose={() => setLightboxIndex(null)}
          onPrev={handlePrev}
          onNext={handleNext}
          onJumpTo={handleJumpTo}
        />
      )}
    </section>
  );
}
