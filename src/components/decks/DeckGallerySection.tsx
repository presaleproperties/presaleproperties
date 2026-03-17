import { useState } from "react";
import { GalleryLightbox } from "./GalleryLightbox";
import { ImageIcon } from "lucide-react";

interface DeckGallerySectionProps {
  images: string[];
}

export function DeckGallerySection({ images }: DeckGallerySectionProps) {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  const handlePrev = () =>
    setLightboxIndex((i) => (i !== null ? (i - 1 + images.length) % images.length : 0));
  const handleNext = () =>
    setLightboxIndex((i) => (i !== null ? (i + 1) % images.length : 0));

  return (
    <section id="gallery" className="relative py-24 bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        {/* Watermark */}
        <div className="absolute top-8 right-8 text-[180px] font-black text-foreground/[0.025] select-none pointer-events-none leading-none">
          03
        </div>

        <div className="mb-12 space-y-2">
          <p className="text-primary text-sm font-semibold uppercase tracking-widest">03 — Gallery</p>
          <h2 className="text-4xl font-bold text-foreground">Project Photos</h2>
        </div>

        {images.length === 0 ? (
          <div className="py-16 text-center text-muted-foreground flex flex-col items-center gap-3">
            <ImageIcon className="h-10 w-10 opacity-30" />
            <p>Gallery photos coming soon.</p>
          </div>
        ) : (
          <div className="grid grid-cols-3 md:grid-cols-4 gap-2 auto-rows-[160px] md:auto-rows-[200px]">
            {images.map((img, i) => (
              <div
                key={i}
                className={`overflow-hidden rounded-lg cursor-pointer relative group ${
                  i === 0 ? "col-span-2 row-span-2" : ""
                }`}
                onClick={() => setLightboxIndex(i)}
              >
                <img
                  src={img}
                  alt={`Gallery ${i + 1}`}
                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-200" />
              </div>
            ))}
          </div>
        )}

        {/* View count hint */}
        {images.length > 0 && (
          <p className="text-sm text-muted-foreground mt-4 text-right">
            Click any photo to view full screen
          </p>
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
