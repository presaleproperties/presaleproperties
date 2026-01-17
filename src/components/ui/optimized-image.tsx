import { useState, useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

interface OptimizedImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  alt: string;
  priority?: boolean;
  quality?: "high" | "auto";
  aspectRatio?: string;
  objectFit?: "cover" | "contain" | "fill";
  showSkeleton?: boolean;
  /** Preload next/prev images in a carousel context */
  preloadSiblings?: string[];
}

export function OptimizedImage({
  src,
  alt,
  priority = false,
  quality = "high",
  aspectRatio,
  objectFit = "cover",
  showSkeleton = true,
  preloadSiblings,
  className,
  ...props
}: OptimizedImageProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);

  // Preload sibling images for smoother carousel navigation
  useEffect(() => {
    if (!preloadSiblings || preloadSiblings.length === 0) return;
    
    const preloadLinks: HTMLLinkElement[] = [];
    preloadSiblings.forEach((url) => {
      if (!url) return;
      const link = document.createElement('link');
      link.rel = 'preload';
      link.as = 'image';
      link.href = url;
      document.head.appendChild(link);
      preloadLinks.push(link);
    });

    return () => {
      preloadLinks.forEach((link) => {
        if (link.parentNode) {
          link.parentNode.removeChild(link);
        }
      });
    };
  }, [preloadSiblings]);

  // Use Intersection Observer for lazy loading with eager decoding once visible
  useEffect(() => {
    if (priority || !imgRef.current) return;
    
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && imgRef.current) {
            // Force decode when in view for smoother experience
            imgRef.current.decode?.().catch(() => {});
          }
        });
      },
      { rootMargin: '100px' }
    );

    observer.observe(imgRef.current);
    return () => observer.disconnect();
  }, [priority, src]);

  return (
    <div 
      className={cn(
        "relative overflow-hidden gpu-accelerated",
        aspectRatio && `aspect-[${aspectRatio}]`
      )}
      style={aspectRatio ? { aspectRatio } : undefined}
    >
      {/* Skeleton loader */}
      {showSkeleton && isLoading && !hasError && (
        <div className="absolute inset-0 bg-muted animate-pulse" />
      )}
      
      {/* Actual image */}
      <img
        ref={imgRef}
        src={src}
        alt={alt}
        loading={priority ? "eager" : "lazy"}
        decoding={priority ? "sync" : "async"}
        fetchPriority={priority ? "high" : "auto"}
        onLoad={() => setIsLoading(false)}
        onError={() => {
          setIsLoading(false);
          setHasError(true);
        }}
        className={cn(
          "w-full h-full img-optimized",
          objectFit === "cover" && "object-cover",
          objectFit === "contain" && "object-contain",
          objectFit === "fill" && "object-fill",
          isLoading ? "opacity-0" : "opacity-100",
          className
        )}
        style={{
          transform: 'translateZ(0)',
          contentVisibility: priority ? 'visible' : 'auto',
        }}
        {...props}
      />
      
      {/* Error fallback */}
      {hasError && (
        <div className="absolute inset-0 bg-muted flex items-center justify-center">
          <span className="text-muted-foreground text-sm">Failed to load</span>
        </div>
      )}
    </div>
  );
}
