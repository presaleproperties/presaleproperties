import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

const TILE_URL = 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png';
const TILE_ATTRIBUTION = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>';

interface AssignmentLocationMapProps {
  lat: number;
  lng: number;
  projectName: string;
  address?: string | null;
}

export function AssignmentLocationMap({ lat, lng, projectName, address }: AssignmentLocationMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = L.map(containerRef.current, {
      center: [lat, lng],
      zoom: 15,
      zoomControl: false,
      scrollWheelZoom: false,
      dragging: true,
    });

    L.tileLayer(TILE_URL, {
      attribution: TILE_ATTRIBUTION,
      maxZoom: 19,
    }).addTo(map);

    // Custom marker
    const icon = L.divIcon({
      className: "assignment-loc-pin",
      html: `<div style="width:36px;height:36px;background:hsl(var(--primary));border-radius:50% 50% 50% 0;transform:rotate(-45deg);display:flex;align-items:center;justify-content:center;box-shadow:0 2px 8px rgba(0,0,0,0.3);border:3px solid white;">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" style="transform:rotate(45deg)">
          <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>
        </svg>
      </div>`,
      iconSize: [36, 36],
      iconAnchor: [18, 36],
      popupAnchor: [0, -36],
    });

    const marker = L.marker([lat, lng], { icon }).addTo(map);
    marker.bindPopup(
      `<div style="font-family:system-ui;padding:4px 0;">
        <div style="font-weight:600;font-size:14px;">${projectName}</div>
        ${address ? `<div style="font-size:12px;color:#666;margin-top:2px;">${address}</div>` : ""}
      </div>`,
      { className: "assignment-loc-popup" }
    );

    // Zoom controls
    L.control.zoom({ position: "bottomright" }).addTo(map);

    mapRef.current = map;
    setTimeout(() => map.invalidateSize(), 100);

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, [lat, lng, projectName, address]);

  return (
    <div className="rounded-xl overflow-hidden border border-border">
      <div ref={containerRef} className="h-[300px] w-full" />
    </div>
  );
}
