import { Button } from "@/components/ui/button";
import { Images, Map, MapPin, Navigation } from "lucide-react";

interface ResaleQuickActionsProps {
  photoCount: number;
  latitude: number | null;
  longitude: number | null;
  virtualTourUrl?: string | null;
  onPhotosClick: () => void;
}

export function ResaleQuickActions({
  photoCount,
  latitude,
  longitude,
  virtualTourUrl,
  onPhotosClick,
}: ResaleQuickActionsProps) {
  const hasLocation = latitude && longitude;

  return (
    <div className="flex items-center gap-2 overflow-x-auto py-2 scrollbar-hide">
      <Button
        variant="outline"
        size="sm"
        className="h-10 px-4 text-sm rounded-full gap-2 shrink-0 bg-background hover:bg-muted border-border"
        onClick={onPhotosClick}
      >
        <Images className="h-4 w-4" />
        {photoCount} Photos
      </Button>
      
      <Button
        variant="outline"
        size="sm"
        className="h-10 px-4 text-sm rounded-full gap-2 shrink-0 bg-background hover:bg-muted border-border"
        onClick={() => {
          if (hasLocation) {
            window.open(`https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`, "_blank");
          }
        }}
        disabled={!hasLocation}
      >
        <Map className="h-4 w-4" />
        Map
      </Button>
      
      <Button
        variant="outline"
        size="sm"
        className="h-10 px-4 text-sm rounded-full gap-2 shrink-0 bg-background hover:bg-muted border-border"
        onClick={() => {
          if (hasLocation) {
            window.open(`https://www.google.com/maps/@?api=1&map_action=pano&viewpoint=${latitude},${longitude}`, "_blank");
          }
        }}
        disabled={!hasLocation}
      >
        <MapPin className="h-4 w-4" />
        Street View
      </Button>
      
      <Button
        variant="outline"
        size="sm"
        className="h-10 px-4 text-sm rounded-full gap-2 shrink-0 bg-background hover:bg-muted border-border"
        onClick={() => {
          if (hasLocation) {
            window.open(`https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}`, "_blank");
          }
        }}
        disabled={!hasLocation}
      >
        <Navigation className="h-4 w-4" />
        Directions
      </Button>

      {virtualTourUrl && (
        <Button
          variant="outline"
          size="sm"
          className="h-10 px-4 text-sm rounded-full gap-2 shrink-0 bg-background hover:bg-muted border-border"
          asChild
        >
          <a href={virtualTourUrl} target="_blank" rel="noopener noreferrer">
            <Navigation className="h-4 w-4" />
            Virtual Tour
          </a>
        </Button>
      )}
    </div>
  );
}
