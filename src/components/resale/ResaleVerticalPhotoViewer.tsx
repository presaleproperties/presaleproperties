import { useState, useRef, useCallback, useEffect } from "react";
import { X, ZoomIn, ZoomOut, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ResaleVerticalPhotoViewerProps {
  photos: string[];
  title: string;
  isOpen: boolean;
  onClose: () => void;
  initialIndex?: number;
}

export function ResaleVerticalPhotoViewer({ 
  photos, 
  title, 
  isOpen, 
  onClose, 
  initialIndex = 0 
}: ResaleVerticalPhotoViewerProps) {
  const [scale, setScale] = useState(1);
  const [activeIndex, setActiveIndex] = useState(initialIndex);
  const containerRef = useRef<HTMLDivElement>(null);
  const imageRefs = useRef<(HTMLDivElement | null)[]>([]);
  
  // Pinch zoom state
  const initialDistance = useRef<number | null>(null);
  const initialScale = useRef(1);
  
  // Reset state when opening
  useEffect(() => {
    if (isOpen) {
      setScale(1);
      setActiveIndex(initialIndex);
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen, initialIndex]);

  // Scroll to image on index change
  useEffect(() => {
    if (isOpen && imageRefs.current[activeIndex]) {
      imageRefs.current[activeIndex]?.scrollIntoView({ 
        behavior: 'smooth', 
        block: 'center' 
      });
    }
  }, [activeIndex, isOpen]);

  // Handle scroll to update active index
  const handleScroll = useCallback(() => {
    if (!containerRef.current) return;
    
    const container = containerRef.current;
    
    // Find which image is most visible
    let bestIndex = 0;
    let bestVisibility = 0;
    
    imageRefs.current.forEach((ref, index) => {
      if (!ref) return;
      const rect = ref.getBoundingClientRect();
      const containerRect = container.getBoundingClientRect();
      
      const visibleTop = Math.max(rect.top, containerRect.top);
      const visibleBottom = Math.min(rect.bottom, containerRect.bottom);
      const visibleHeight = Math.max(0, visibleBottom - visibleTop);
      
      if (visibleHeight > bestVisibility) {
        bestVisibility = visibleHeight;
        bestIndex = index;
      }
    });
    
    if (bestIndex !== activeIndex) {
      setActiveIndex(bestIndex);
    }
  }, [activeIndex]);

  // Pinch to zoom handlers
  const getDistance = (touches: React.TouchList) => {
    if (touches.length < 2) return 0;
    const dx = touches[0].clientX - touches[1].clientX;
    const dy = touches[0].clientY - touches[1].clientY;
    return Math.sqrt(dx * dx + dy * dy);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      initialDistance.current = getDistance(e.touches);
      initialScale.current = scale;
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 2 && initialDistance.current) {
      const currentDistance = getDistance(e.touches);
      const scaleChange = currentDistance / initialDistance.current;
      const newScale = Math.min(Math.max(initialScale.current * scaleChange, 1), 4);
      setScale(newScale);
    }
  };

  const handleTouchEnd = () => {
    initialDistance.current = null;
    // Snap back if scale is close to 1
    if (scale < 1.1) {
      setScale(1);
    }
  };

  const zoomIn = () => setScale(prev => Math.min(prev + 0.5, 4));
  const zoomOut = () => setScale(prev => Math.max(prev - 0.5, 1));

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] bg-black">
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 z-10 flex items-center justify-between p-3 bg-gradient-to-b from-black/80 to-transparent safe-top">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            className="h-11 w-11 text-white hover:bg-white/20 rounded-full"
            onClick={onClose}
          >
            <X className="h-6 w-6" />
          </Button>
          <span className="text-white font-medium text-sm">
            {activeIndex + 1} of {photos.length}
          </span>
        </div>
        
        {/* Zoom controls */}
        <div className="flex items-center gap-1 bg-white/10 backdrop-blur-sm rounded-full p-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9 text-white hover:bg-white/20 rounded-full"
            onClick={zoomOut}
            disabled={scale <= 1}
          >
            <ZoomOut className="h-5 w-5" />
          </Button>
          <span className="text-white text-xs font-medium w-10 text-center">
            {Math.round(scale * 100)}%
          </span>
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9 text-white hover:bg-white/20 rounded-full"
            onClick={zoomIn}
            disabled={scale >= 4}
          >
            <ZoomIn className="h-5 w-5" />
          </Button>
        </div>
      </div>

      {/* Scroll indicator */}
      {photos.length > 1 && scale === 1 && (
        <div className="absolute bottom-24 left-1/2 -translate-x-1/2 z-10 flex flex-col items-center gap-1 text-white/60 animate-pulse pointer-events-none">
          <ChevronDown className="h-5 w-5" />
          <span className="text-xs">Scroll to see more</span>
        </div>
      )}

      {/* Vertical scrolling photo list */}
      <div 
        ref={containerRef}
        className="h-full overflow-y-auto overflow-x-hidden snap-y snap-mandatory scrollbar-hide pt-16 pb-24"
        onScroll={handleScroll}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        style={{ 
          overscrollBehavior: 'contain',
          WebkitOverflowScrolling: 'touch'
        }}
      >
        {photos.map((photo, index) => (
          <div
            key={index}
            ref={el => imageRefs.current[index] = el}
            className={cn(
              "min-h-[80vh] flex items-center justify-center p-4 snap-center",
              scale > 1 && "overflow-auto"
            )}
          >
            <div 
              className="w-full flex items-center justify-center"
              style={{
                transform: `scale(${index === activeIndex ? scale : 1})`,
                transformOrigin: 'center center',
                transition: 'transform 0.2s ease-out'
              }}
            >
              <img
                src={photo}
                alt={`${title} - Photo ${index + 1}`}
                className="w-full max-h-[75vh] object-contain rounded-lg"
                loading={index <= activeIndex + 2 ? "eager" : "lazy"}
                draggable={false}
              />
            </div>
          </div>
        ))}
      </div>

      {/* Thumbnail strip at bottom */}
      {photos.length > 1 && (
        <div className="absolute bottom-0 left-0 right-0 z-10 bg-gradient-to-t from-black/90 via-black/70 to-transparent pt-6 pb-4 safe-bottom">
          <div className="flex gap-2 px-3 overflow-x-auto scrollbar-hide">
            {photos.map((photo, index) => (
              <button
                key={index}
                onClick={() => {
                  setActiveIndex(index);
                  imageRefs.current[index]?.scrollIntoView({ 
                    behavior: 'smooth', 
                    block: 'center' 
                  });
                }}
                className={cn(
                  "flex-shrink-0 w-14 h-14 rounded-lg overflow-hidden border-2 transition-all",
                  index === activeIndex
                    ? "border-primary ring-2 ring-primary/50 scale-105"
                    : "border-white/20 opacity-60 hover:opacity-100"
                )}
              >
                <img
                  src={photo}
                  alt={`Thumbnail ${index + 1}`}
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
