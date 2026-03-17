import { useState } from "react";
import { GalleryLightbox } from "./GalleryLightbox";
import { ImageIcon, Expand, Grid3x3 } from "lucide-react";

interface DeckGallerySectionProps {
  images: string[];
}

export function DeckGallerySection({ images }: DeckGallerySectionProps) {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  const handlePrev = () =>
    setLightboxIndex((i) => (i !== null ? (i - 1 + images.length) % images.length : 0));
  const handleNext = () =>
    setLightboxIndex((i) => (i !== null ? (i + 1) % images.length : 0));
  const handleJumpTo = (i: number) => setLightboxIndex(i);

  // Mobile: horizontal scroll strip for first N images + "View All" button
  // Desktop: masonry grid
  const mobileStrip = () => {
    if (images.length === 0) return null;
    return (
      <div className="sm:hidden space-y-3">
        {/* Scrollable horizontal strip */}
        <div className="flex gap-2.5 overflow-x-auto pb-1 -mx-4 px-4 snap-x snap-mandatory scrollbar-hide">
          {images.slice(0, 12).map((img, i) => (
            <button
              key={i}
              onClick={() => setLightboxIndex(i)}
              className="shrink-0 snap-start w-[72vw] aspect-[4/3] overflow-hidden rounded-2xl relative touch-manipulation active:opacity-90 transition-opacity"
            >
              <img
                src={img}
                alt={`Gallery ${i + 1}`}
                className="w-full h-full object-cover"
                loading={i < 3 ? "eager" : "lazy"}
              />
              {/* Last tile: +more overlay */}
              {i === 11 && images.length > 12 && (
                <div className="absolute inset-0 bg-black/55 flex items-center justify-center rounded-2xl">
                  <span className="text-white font-bold text-xl">+{images.length - 11} more</span>
                </div>
              )}
            </button>
          ))}
        </div>

        {/* View all button */}
        {images.length > 1 && (
          <button
            onClick={() => setLightboxIndex(0)}
            className="flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-foreground text-background text-sm font-semibold touch-manipulation active:opacity-90 transition-opacity"
          >
            <Grid3x3 className="h-4 w-4" />
            View All {images.length} Photos
          </button>
        )}
      </div>
    );
  };

  const desktopGrid = () => {
    if (images.length === 0) return null;
    const [first, ...rest] = images;
    return (
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
          <div className="absolute bottom-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
            <div className="bg-background/80 backdrop-blur-sm rounded-lg p-1.5">
              <Expand className="h-4 w-4 text-foreground" />
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
    );
  };

  return (
    <section id="gallery" className="relative py-12 sm:py-24 bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        {/* Watermark — desktop only */}
        <div className="hidden sm:block absolute top-8 right-8 text-[180px] font-black text-foreground/[0.025] select-none pointer-events-none leading-none">
          03
        </div>

        <div className="mb-6 sm:mb-12 space-y-1.5">
          <p className="text-primary text-xs font-semibold uppercase tracking-[0.2em]">03 — Gallery</p>
          <h2 className="text-3xl sm:text-4xl font-bold text-foreground">Project Photos</h2>
          {images.length > 0 && (
            <p className="text-muted-foreground text-sm sm:hidden">Swipe to browse · tap to expand</p>
          )}
          {images.length > 0 && (
            <p className="text-muted-foreground text-sm hidden sm:block">Click any photo to view full screen</p>
          )}
        </div>

        {images.length === 0 ? (
          <div className="py-16 text-center text-muted-foreground flex flex-col items-center gap-3">
            <ImageIcon className="h-10 w-10 opacity-30" />
            <p>Gallery photos coming soon.</p>
          </div>
        ) : (
          <>
            {mobileStrip()}
            {desktopGrid()}
          </>
        )}
      </div>

      {lightboxIndex !== null && (
        <GalleryLightbox
          images={images}
          currentIndex={lightboxIndex}
          onClose={() => setLightboxIndex(null)}
          onPrev={handlePrev}
          onNext={handleNext}
        />
      )}
    </section>
  );
}
