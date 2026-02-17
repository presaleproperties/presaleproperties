import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

interface ClickableMapPreviewProps {
  lat: number;
  lng: number;
  onLocationChange: (lat: number, lng: number) => void;
}

export function ClickableMapPreview({ lat, lng, onLocationChange }: ClickableMapPreviewProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);

  // Store callback ref to avoid stale closure
  const onLocationChangeRef = useRef(onLocationChange);
  onLocationChangeRef.current = onLocationChange;

  // Initialize map once on mount
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    mapRef.current = L.map(mapContainerRef.current, {
      center: [lat, lng],
      zoom: 15,
      zoomControl: true,
      attributionControl: false,
    });

    // Add CartoDB Voyager tiles for clean look
    L.tileLayer("https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png", {
      maxZoom: 19,
    }).addTo(mapRef.current);

    // Create custom marker icon
    const markerIcon = L.divIcon({
      className: "custom-marker",
      html: `<div style="
        width: 24px;
        height: 24px;
        background: hsl(43, 96%, 56%);
        border: 3px solid white;
        border-radius: 50%;
        box-shadow: 0 2px 8px rgba(0,0,0,0.3);
      "></div>`,
      iconSize: [24, 24],
      iconAnchor: [12, 12],
    });

    // Add draggable marker
    markerRef.current = L.marker([lat, lng], {
      icon: markerIcon,
      draggable: true,
    }).addTo(mapRef.current);

    // Handle marker drag
    markerRef.current.on("dragend", () => {
      const position = markerRef.current?.getLatLng();
      if (position) {
        onLocationChangeRef.current(position.lat, position.lng);
      }
    });

    // Handle map click to move marker
    mapRef.current.on("click", (e: L.LeafletMouseEvent) => {
      if (markerRef.current) {
        markerRef.current.setLatLng(e.latlng);
        onLocationChangeRef.current(e.latlng.lat, e.latlng.lng);
      }
    });

    // Cleanup on unmount only
    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
        markerRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Update marker position when props change (but don't reinitialize map)
  useEffect(() => {
    if (mapRef.current && markerRef.current) {
      const currentPos = markerRef.current.getLatLng();
      if (Math.abs(currentPos.lat - lat) > 0.00001 || Math.abs(currentPos.lng - lng) > 0.00001) {
        markerRef.current.setLatLng([lat, lng]);
        mapRef.current.setView([lat, lng], mapRef.current.getZoom());
      }
    }
  }, [lat, lng]);

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium">Preview</span>
        <span className="text-xs text-muted-foreground">Click or drag marker to adjust</span>
      </div>
      <div 
        ref={mapContainerRef} 
        className="h-48 rounded-lg overflow-hidden border"
        style={{ cursor: "crosshair" }}
      />
      <div className="text-xs text-muted-foreground text-center">
        {lat.toFixed(5)}, {lng.toFixed(5)}
      </div>
    </div>
  );
}
