import { REWPhotoGallery } from "@/components/resale/REWPhotoGallery";
import { ImageIcon } from "lucide-react";

interface DeckGallerySectionProps {
  images: string[];
  onGalleryOpen?: () => void;
  onGalleryClose?: () => void;
}

export function DeckGallerySection({ images, onGalleryOpen, onGalleryClose }: DeckGallerySectionProps) {
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

  const photos = images.map((url) => ({ url }));

  return (
    <section id="gallery" className="relative py-8 sm:py-20 bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="mb-4 sm:mb-10 space-y-1">
          <p className="text-primary text-xs font-semibold uppercase tracking-[0.2em]">04 — Gallery</p>
          <h2 className="text-2xl sm:text-3xl font-bold text-foreground">Project Photos</h2>
        </div>

        <REWPhotoGallery
          photos={photos}
          alt="Project Gallery"
          previewAspectClassName="aspect-[4/3] lg:aspect-[16/9]"
        />
      </div>
    </section>
  );
}
