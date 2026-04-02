import { useRef, useEffect, useCallback } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

interface Props {
  center: [number, number];
  markerPos: [number, number] | null;
  onMove: (lat: number, lng: number) => void;
  address?: string;
}

export default function ProjectLocationMap({ center, markerPos, onMove, address }: Props) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);

  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    const map = L.map(mapContainerRef.current, {
      center,
      zoom: 14,
      zoomControl: true,
      attributionControl: false,
    });

    L.tileLayer("https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png", {
      maxZoom: 19,
    }).addTo(map);

    map.on("click", (e: L.LeafletMouseEvent) => {
      const { lat, lng } = e.latlng;
      if (markerRef.current) {
        markerRef.current.setLatLng([lat, lng]);
      } else {
        markerRef.current = L.marker([lat, lng]).addTo(map);
      }
      onMove(lat, lng);
    });

    mapRef.current = map;

    // Add initial marker
    if (markerPos) {
      markerRef.current = L.marker(markerPos).addTo(map);
    }

    return () => {
      map.remove();
      mapRef.current = null;
      markerRef.current = null;
    };
  }, []);

  // Update view when center changes
  useEffect(() => {
    if (mapRef.current) {
      mapRef.current.setView(center, 14);
      if (markerPos) {
        if (markerRef.current) {
          markerRef.current.setLatLng(markerPos);
        } else {
          markerRef.current = L.marker(markerPos).addTo(mapRef.current);
        }
      }
    }
  }, [center[0], center[1]]);

  return (
    <div>
      <div
        ref={mapContainerRef}
        className="rounded-xl overflow-hidden border border-border/50 h-[250px]"
        style={{ cursor: "crosshair" }}
      />
      {address && (
        <p className="text-xs text-muted-foreground mt-2">{address}</p>
      )}
    </div>
  );
}
