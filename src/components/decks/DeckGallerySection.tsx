import { useState } from "react";
import { GalleryLightbox } from "./GalleryLightbox";
import { ImageIcon, Expand } from "lucide-react";

interface DeckGallerySectionProps {
  images: string[];
}

export function DeckGallerySection({ images }: DeckGallerySectionProps) {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  const handlePrev = () =>
    setLightboxIndex((i) => (i !== null ? (i - 1 + images.length) % images.length : 0));
  const handleNext = () =>
    setLightboxIndex((i) => (i !== null ? (i + 1) % images.length : 0));

  // Build a masonry-style layout: first image spans 2 cols + 2 rows
  const buildGrid = () => {
    if (images.length === 0) return null;
    const [first, ...rest] = images;
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 sm:gap-3">
        {/* Hero image: full-width on mobile, 2-col span on sm+ */}
        <div
          className="col-span-2 row-span-2 overflow-hidden rounded-xl cursor-pointer relative group aspect-[16/10] sm:aspect-auto sm:h-[360px] md:h-[420px]"
          onClick={() => setLightboxIndex(0)}
        >
          <img
            src={first}
            alt="Gallery 1"
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            loading="lazy"
          />
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-200" />
          <div className="absolute bottom-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
            <div className="bg-background/80 backdrop-blur-sm rounded-lg p-1.5">
              <Expand className="h-4 w-4 text-foreground" />
            </div>
          </div>
        </div>

        {/* Rest of images */}
        {rest.slice(0, 6).map((img, i) => (
          <div
            key={i + 1}
            className="overflow-hidden rounded-xl cursor-pointer relative group aspect-square sm:h-[200px]"
            onClick={() => setLightboxIndex(i + 1)}
          >
            <img
              src={img}
              alt={`Gallery ${i + 2}`}
              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
              loading="lazy"
            />
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/25 transition-colors duration-200" />
            {/* Show "+N more" overlay on last visible tile if there are more */}
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
    <section id="gallery" className="relative py-16 sm:py-24 bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        {/* Watermark — hidden on mobile to avoid overflow */}
        <div className="hidden sm:block absolute top-8 right-8 text-[180px] font-black text-foreground/[0.025] select-none pointer-events-none leading-none">
          03
        </div>

        <div className="mb-8 sm:mb-12 space-y-2">
          <p className="text-primary text-xs font-semibold uppercase tracking-[0.2em]">03 — Gallery</p>
          <h2 className="text-3xl sm:text-4xl font-bold text-foreground">Project Photos</h2>
          {images.length > 0 && (
            <p className="text-muted-foreground text-sm">Tap any photo to view full screen</p>
          )}
        </div>

        {images.length === 0 ? (
          <div className="py-16 text-center text-muted-foreground flex flex-col items-center gap-3">
            <ImageIcon className="h-10 w-10 opacity-30" />
            <p>Gallery photos coming soon.</p>
          </div>
        ) : (
          buildGrid()
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
