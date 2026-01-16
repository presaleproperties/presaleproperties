import { useEffect, useRef, useCallback } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";

const TILE_URL = "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png";
const TILE_ATTRIBUTION = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>';

interface ProjectLocationMiniMapProps {
  latitude: number;
  longitude: number;
  projectName: string;
  address?: string | null;
}

export function ProjectLocationMiniMap({ 
  latitude, 
  longitude, 
  projectName,
  address
}: ProjectLocationMiniMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);

  // Initialize map
  const initializeMap = useCallback(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    const map = L.map(mapContainerRef.current, {
      center: [latitude, longitude],
      zoom: 15,
      zoomControl: false,
      attributionControl: false,
      scrollWheelZoom: false,
      dragging: true,
      touchZoom: true,
    });

    L.tileLayer(TILE_URL, { 
      attribution: TILE_ATTRIBUTION, 
      maxZoom: 19 
    }).addTo(map);

    // Project marker with custom icon
    const projectIcon = L.divIcon({
      html: `
        <div class="project-marker-pin">
          <div class="project-marker-inner">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <rect x="3" y="3" width="7" height="9"></rect>
              <rect x="14" y="3" width="7" height="5"></rect>
              <rect x="14" y="12" width="7" height="9"></rect>
              <rect x="3" y="16" width="7" height="5"></rect>
            </svg>
          </div>
        </div>
      `,
      className: "project-marker-icon",
      iconSize: [32, 40],
      iconAnchor: [16, 40],
    });

    const marker = L.marker([latitude, longitude], { icon: projectIcon, zIndexOffset: 1000 }).addTo(map);
    
    // Bind popup with project name
    marker.bindPopup(`
      <div class="project-popup">
        <div class="project-popup-name">${projectName}</div>
        ${address ? `<div class="project-popup-address">${address}</div>` : ''}
      </div>
    `, { closeButton: false, className: "project-popup-container" });
    
    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, [latitude, longitude, projectName, address]);

  useEffect(() => {
    const cleanup = initializeMap();
    return cleanup;
  }, [initializeMap]);

  const handleOpenFullMap = () => {
    window.open(
      `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`,
      "_blank"
    );
  };

  return (
    <div className="lg:hidden bg-muted/30 rounded-xl sm:rounded-2xl p-4 sm:p-5 overflow-hidden">
      <div className="flex items-center justify-between gap-2 mb-3">
        <h2 className="text-base sm:text-lg font-bold text-foreground">Project Location</h2>
        <Button
          variant="ghost"
          size="sm"
          className="h-8 px-3 text-xs gap-1.5 text-primary hover:text-primary shrink-0"
          onClick={handleOpenFullMap}
        >
          <ExternalLink className="h-3.5 w-3.5" />
          Open in Maps
        </Button>
      </div>

      {/* Map Container */}
      <div className="relative rounded-xl overflow-hidden border border-border/50 bg-muted">
        <style>{`
          .project-marker-icon {
            background: transparent !important;
            border: none !important;
          }
          .project-marker-pin {
            position: relative;
            width: 32px;
            height: 40px;
          }
          .project-marker-inner {
            position: absolute;
            top: 0;
            left: 50%;
            width: 28px;
            height: 28px;
            background: hsl(var(--primary));
            border-radius: 50% 50% 50% 0;
            transform: translateX(-50%) rotate(-45deg);
            display: flex;
            align-items: center;
            justify-content: center;
            box-shadow: 0 3px 8px rgba(0,0,0,0.25);
            border: 2px solid white;
          }
          .project-marker-inner svg {
            transform: rotate(45deg);
            color: hsl(var(--primary-foreground));
            width: 14px;
            height: 14px;
          }
          .project-popup-container .leaflet-popup-content-wrapper {
            border-radius: 10px;
            padding: 0;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
          }
          .project-popup-container .leaflet-popup-content {
            margin: 0;
          }
          .project-popup-container .leaflet-popup-tip {
            background: white;
          }
          .project-popup {
            padding: 10px 14px;
          }
          .project-popup-name {
            font-size: 13px;
            font-weight: 600;
            color: #1f2937;
          }
          .project-popup-address {
            font-size: 11px;
            color: #6B7280;
            margin-top: 2px;
          }
        `}</style>

        <div ref={mapContainerRef} className="w-full h-[280px] sm:h-[320px]" />
      </div>
    </div>
  );
}

export default ProjectLocationMiniMap;
