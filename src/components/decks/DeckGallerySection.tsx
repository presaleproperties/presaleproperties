import { useState } from "react";
import { GalleryLightbox } from "./GalleryLightbox";
import { ImageIcon, Grid3x3 } from "lucide-react";

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

  return (
    <section id="gallery" className="relative py-8 sm:py-24 bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        {/* Watermark — desktop only */}
        <div className="hidden sm:block absolute top-8 right-8 text-[180px] font-black text-foreground/[0.025] select-none pointer-events-none leading-none">
          03
        </div>

        <div className="mb-4 sm:mb-10 space-y-1">
          <p className="text-primary text-xs font-semibold uppercase tracking-[0.2em]">03 — Gallery</p>
          <div className="flex items-center justify-between">
            <h2 className="text-2xl sm:text-4xl font-bold text-foreground">Project Photos</h2>
            {images.length > 0 && (
              <button
                onClick={() => setLightboxIndex(0)}
                className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors touch-manipulation"
              >
                <Grid3x3 className="h-3.5 w-3.5" />
                {images.length} photos
              </button>
            )}
          </div>
        </div>

        {images.length === 0 ? (
          <div className="py-16 text-center text-muted-foreground flex flex-col items-center gap-3">
            <ImageIcon className="h-10 w-10 opacity-30" />
            <p>Gallery photos coming soon.</p>
          </div>
        ) : (
          /* Unified 2-column grid — same on all screen sizes */
          <div className="columns-2 gap-2 sm:gap-3 [column-fill:balance]">
            {images.map((img, i) => (
              <button
                key={i}
                onClick={() => setLightboxIndex(i)}
                className="relative w-full mb-2 sm:mb-3 overflow-hidden rounded-xl cursor-pointer group block touch-manipulation active:opacity-90 transition-opacity"
              >
                <img
                  src={img}
                  alt={`Photo ${i + 1}`}
                  className="w-full h-auto object-cover transition-transform duration-500 group-hover:scale-105 block"
                  loading={i < 4 ? "eager" : "lazy"}
                />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 active:bg-black/10 transition-colors duration-200" />
                {/* "View all" overlay on last visible image if many */}
                {i === images.length - 1 && images.length > 6 && (
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="flex flex-col items-center gap-1 text-white">
                      <Grid3x3 className="h-5 w-5" />
                      <span className="text-xs font-bold">View All</span>
                    </div>
                  </div>
                )}
              </button>
            ))}
          </div>
        )}
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
