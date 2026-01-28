import { useEffect, useRef, useState, useCallback } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { Button } from "@/components/ui/button";
import { MapPin, Move, Check, RotateCcw } from "lucide-react";

interface InteractiveMapPickerProps {
  lat: number | null;
  lng: number | null;
  onLocationChange: (lat: number, lng: number) => void;
  className?: string;
}

const TILE_URL = 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png';
const TILE_ATTRIBUTION = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>';
const DEFAULT_CENTER: [number, number] = [49.25, -123.1]; // Vancouver

export function InteractiveMapPicker({ lat, lng, onLocationChange, className }: InteractiveMapPickerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [initialPosition, setInitialPosition] = useState<[number, number] | null>(null);

  const hasValidCoords = lat !== null && lng !== null && !isNaN(lat) && !isNaN(lng);

  // Initialize map
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const center: [number, number] = hasValidCoords ? [lat!, lng!] : DEFAULT_CENTER;
    
    const map = L.map(containerRef.current, {
      center,
      zoom: hasValidCoords ? 16 : 12,
      zoomControl: true,
      attributionControl: false,
    });

    L.tileLayer(TILE_URL, {
      attribution: TILE_ATTRIBUTION,
      maxZoom: 19,
    }).addTo(map);

    mapRef.current = map;

    // Save initial position for reset
    if (hasValidCoords) {
      setInitialPosition([lat!, lng!]);
    }

    return () => {
      map.remove();
      mapRef.current = null;
      markerRef.current = null;
    };
  }, []);

  // Update marker when coordinates change
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    if (!hasValidCoords) {
      if (markerRef.current) {
        markerRef.current.remove();
        markerRef.current = null;
      }
      return;
    }

    const position: [number, number] = [lat!, lng!];

    if (!markerRef.current) {
      // Create custom icon
      const icon = L.divIcon({
        className: "map-picker-marker",
        html: `
          <div style="
            width: 40px;
            height: 40px;
            background: linear-gradient(135deg, hsl(var(--primary)), hsl(var(--primary) / 0.8));
            border-radius: 50% 50% 50% 0;
            transform: rotate(-45deg);
            border: 3px solid white;
            box-shadow: 0 4px 12px rgba(0,0,0,0.3);
            display: flex;
            align-items: center;
            justify-content: center;
          ">
            <svg style="transform: rotate(45deg); width: 18px; height: 18px; color: white;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
              <circle cx="12" cy="10" r="3"/>
            </svg>
          </div>
        `,
        iconSize: [40, 40],
        iconAnchor: [20, 40],
      });

      markerRef.current = L.marker(position, {
        icon,
        draggable: true,
        autoPan: true,
      }).addTo(map);

      // Handle drag events
      markerRef.current.on('dragstart', () => setIsDragging(true));
      markerRef.current.on('dragend', (e: L.DragEndEvent) => {
        const newPos = e.target.getLatLng();
        onLocationChange(newPos.lat, newPos.lng);
        setIsDragging(false);
      });
    } else {
      markerRef.current.setLatLng(position);
    }

    map.setView(position, map.getZoom() < 14 ? 16 : map.getZoom(), { animate: true });
  }, [lat, lng, hasValidCoords, onLocationChange]);

  const handleReset = useCallback(() => {
    if (initialPosition) {
      onLocationChange(initialPosition[0], initialPosition[1]);
    }
  }, [initialPosition, onLocationChange]);

  if (!hasValidCoords) {
    return (
      <div className={`rounded-lg border-2 border-dashed border-border bg-muted/30 flex flex-col items-center justify-center p-6 ${className}`}>
        <MapPin className="h-8 w-8 text-muted-foreground mb-2" />
        <p className="text-sm text-muted-foreground text-center">
          Enter an address above to place the pin on the map
        </p>
      </div>
    );
  }

  return (
    <div className={`relative rounded-lg overflow-hidden border border-border ${className}`}>
      <div ref={containerRef} className="h-full w-full min-h-[200px]" />
      
      {/* Pin adjustment controls */}
      <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between gap-2 pointer-events-none">
        <div className={`px-3 py-1.5 rounded-full text-xs font-medium flex items-center gap-1.5 pointer-events-auto transition-colors ${
          isDragging 
            ? "bg-primary text-primary-foreground" 
            : "bg-background/95 backdrop-blur-sm text-muted-foreground border"
        }`}>
          <Move className="h-3 w-3" />
          {isDragging ? "Drop to place pin" : "Drag pin to adjust"}
        </div>

        {initialPosition && (lat !== initialPosition[0] || lng !== initialPosition[1]) && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleReset}
            className="h-7 text-xs pointer-events-auto bg-background/95 backdrop-blur-sm"
          >
            <RotateCcw className="h-3 w-3 mr-1" />
            Reset
          </Button>
        )}
      </div>

      {/* Coordinates display */}
      <div className="absolute top-2 right-2 px-2 py-1 bg-background/90 backdrop-blur-sm rounded text-xs text-muted-foreground font-mono border">
        {lat?.toFixed(5)}, {lng?.toFixed(5)}
      </div>
    </div>
  );
}
