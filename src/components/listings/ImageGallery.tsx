import { REWPhotoGallery } from "@/components/resale/REWPhotoGallery";

interface Photo {
  id: string;
  url: string;
  sort_order: number | null;
}

interface ImageGalleryProps {
  photos: Photo[];
  title: string;
}

export function ImageGallery({ photos, title }: ImageGalleryProps) {
  return (
    <REWPhotoGallery
      photos={photos.map(p => ({ url: p.url, alt: `${title} - Photo` }))}
      alt={title}
    />
  );
}
