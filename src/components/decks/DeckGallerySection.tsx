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
      <section id="gallery" className="relative py-16 sm:py-24 bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-8">
          <div className="mb-10 space-y-1.5">
            <p className="text-primary text-[11px] font-bold uppercase tracking-[0.25em]">03 — Gallery</p>
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground tracking-tight">Project Photos</h2>
          </div>
          <div className="py-16 text-center text-muted-foreground flex flex-col items-center gap-3">
            <ImageIcon className="h-10 w-10 opacity-20" />
            <p className="text-sm">Gallery photos coming soon.</p>
          </div>
        </div>
      </section>
    );
  }

  const photos = images.map((url) => ({ url }));

  return (
    <section id="gallery" className="relative py-16 sm:py-24 bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-8">
        <div className="mb-10 space-y-1.5">
          <p className="text-primary text-[11px] font-bold uppercase tracking-[0.25em]">03 — Gallery</p>
          <h2 className="text-3xl sm:text-4xl font-bold text-foreground tracking-tight">Project Photos</h2>
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
