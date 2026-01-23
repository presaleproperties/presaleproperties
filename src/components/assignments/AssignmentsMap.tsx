import { useRef, useEffect, useCallback, useMemo, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet.markercluster/dist/MarkerCluster.css";
import "leaflet.markercluster/dist/MarkerCluster.Default.css";
import "leaflet.markercluster";
import { ZoomIn, ZoomOut, Locate } from "lucide-react";

const DEFAULT_CENTER: [number, number] = [49.2827, -123.1207];
const DEFAULT_ZOOM = 11;
const TILE_URL = "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png";
const TILE_ATTRIBUTION = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>';

interface Assignment {
  id: string;
  title: string;
  project_name: string;
  city: string;
  neighborhood: string | null;
  assignment_price: number;
  original_price: number | null;
  beds: number;
  baths: number;
  interior_sqft: number | null;
  completion_month: number | null;
  completion_year: number | null;
  map_lat: number | null;
  map_lng: number | null;
  agent_id: string;
  listing_photos?: { url: string; sort_order: number }[];
}

interface AssignmentsMapProps {
  assignments: Assignment[];
  savedIds: Set<string>;
  onToggleSave: (id: string) => void;
  currentUserId?: string;
}

function formatPrice(price: number): string {
  if (price >= 1000000) {
    return `$${(price / 1000000).toFixed(2)}M`;
  }
  return `$${(price / 1000).toFixed(0)}K`;
}

function createPricePillIcon(assignment: Assignment, isSaved: boolean): L.DivIcon {
  const hasSavings = assignment.original_price && assignment.original_price > assignment.assignment_price;
  
  const bgColor = hasSavings ? '#16a34a' : '#ffffff';
  const textColor = hasSavings ? '#ffffff' : '#1f2937';
  const borderStyle = hasSavings ? 'none' : '1px solid #e5e7eb';
  
  return L.divIcon({
    className: "custom-price-pill",
    html: `
      <div style="
        position: relative;
        display: flex;
        flex-direction: column;
        align-items: center;
      ">
        <div style="
          padding: 6px 10px;
          border-radius: 9999px;
          font-size: 12px;
          font-weight: 700;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
          background-color: ${bgColor};
          color: ${textColor};
          border: ${borderStyle};
          white-space: nowrap;
          display: flex;
          align-items: center;
          gap: 4px;
          cursor: pointer;
          transition: transform 0.15s ease;
        ">
          ${formatPrice(assignment.assignment_price)}
          ${isSaved ? '<span style="color: #ef4444;">♥</span>' : ''}
        </div>
        <div style="
          width: 0;
          height: 0;
          border-left: 6px solid transparent;
          border-right: 6px solid transparent;
          border-top: 6px solid ${bgColor};
        "></div>
      </div>
    `,
    iconSize: [80, 42],
    iconAnchor: [40, 42],
  });
}

function createClusterIcon(cluster: L.MarkerCluster): L.DivIcon {
  const count = cluster.getChildCount();
  return L.divIcon({
    className: "custom-cluster",
    html: `
      <div style="
        width: 40px;
        height: 40px;
        border-radius: 50%;
        background: hsl(var(--primary));
        color: hsl(var(--primary-foreground));
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 14px;
        font-weight: 700;
        box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
        border: 2px solid white;
      ">
        ${count}
      </div>
    `,
    iconSize: [40, 40],
    iconAnchor: [20, 20],
  });
}

function getPopupHtml(assignment: Assignment, isOwn: boolean): string {
  const savings = assignment.original_price 
    ? assignment.original_price - assignment.assignment_price 
    : null;
    
  const formattedPrice = new Intl.NumberFormat("en-CA", {
    style: "currency",
    currency: "CAD",
    maximumFractionDigits: 0,
  }).format(assignment.assignment_price);

  const mainPhoto = assignment.listing_photos?.sort((a, b) => a.sort_order - b.sort_order)?.[0]?.url;

  return `
    <div style="width: 256px; padding: 0; font-family: system-ui, -apple-system, sans-serif;">
      <div style="position: relative; height: 128px; background: #f3f4f6; border-radius: 8px 8px 0 0; overflow: hidden;">
        ${mainPhoto 
          ? `<img src="${mainPhoto}" alt="${assignment.title}" style="width: 100%; height: 100%; object-fit: cover;" />`
          : `<div style="width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; color: #9ca3af;">No Image</div>`
        }
        ${isOwn ? `<span style="position: absolute; top: 8px; left: 8px; background: hsl(var(--primary)); color: white; font-size: 11px; padding: 2px 8px; border-radius: 4px;">Your Listing</span>` : ''}
        ${savings && savings > 0 ? `<span style="position: absolute; bottom: 8px; left: 8px; background: #16a34a; color: white; font-size: 11px; padding: 2px 8px; border-radius: 4px;">Save $${(savings/1000).toFixed(0)}K</span>` : ''}
      </div>
      <div style="padding: 12px;">
        <h3 style="font-weight: 600; font-size: 14px; margin: 0 0 4px 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${assignment.title || assignment.project_name}</h3>
        <p style="font-size: 12px; color: #6b7280; margin: 0 0 8px 0;">${assignment.neighborhood ? `${assignment.neighborhood}, ` : ''}${assignment.city}</p>
        <div style="display: flex; align-items: center; justify-content: space-between;">
          <span style="font-weight: 700; color: hsl(var(--primary));">${formattedPrice}</span>
          <span style="font-size: 12px; color: #6b7280;">${assignment.beds} bed · ${assignment.baths} bath</span>
        </div>
        <a 
          href="/assignments/${assignment.id}" 
          style="display: block; margin-top: 8px; text-align: center; background: hsl(var(--primary)); color: white; font-size: 12px; padding: 6px 12px; border-radius: 6px; text-decoration: none; transition: opacity 0.15s;"
          onmouseover="this.style.opacity='0.9'"
          onmouseout="this.style.opacity='1'"
        >
          View Details
        </a>
      </div>
    </div>
  `;
}

export default function AssignmentsMap({ 
  assignments, 
  savedIds, 
  onToggleSave,
  currentUserId 
}: AssignmentsMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const clusterGroupRef = useRef<L.MarkerClusterGroup | null>(null);
  const [isMapReady, setIsMapReady] = useState(false);

  const validAssignments = useMemo(() => {
    return assignments.filter(a => a.map_lat && a.map_lng);
  }, [assignments]);

  // Initialize map
  const initializeMap = useCallback(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    try {
      const map = L.map(mapContainerRef.current, {
        center: DEFAULT_CENTER,
        zoom: DEFAULT_ZOOM,
        zoomControl: false,
        attributionControl: true,
      });

      L.tileLayer(TILE_URL, {
        attribution: TILE_ATTRIBUTION,
        maxZoom: 19,
      }).addTo(map);

      const clusterGroup = L.markerClusterGroup({
        chunkedLoading: true,
        maxClusterRadius: 50,
        iconCreateFunction: createClusterIcon,
        spiderfyOnMaxZoom: true,
        showCoverageOnHover: false,
        zoomToBoundsOnClick: true,
        animate: true,
      });

      map.addLayer(clusterGroup);

      mapInstanceRef.current = map;
      clusterGroupRef.current = clusterGroup;
      setIsMapReady(true);
    } catch (error) {
      console.error("[AssignmentsMap] Error initializing map:", error);
    }
  }, []);

  // Initialize on mount
  useEffect(() => {
    // Small delay to ensure container is ready
    const timer = setTimeout(() => {
      initializeMap();
    }, 100);

    return () => {
      clearTimeout(timer);
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
        clusterGroupRef.current = null;
        setIsMapReady(false);
      }
    };
  }, [initializeMap]);

  // Update markers when assignments change
  useEffect(() => {
    if (!isMapReady || !clusterGroupRef.current || !mapInstanceRef.current) return;

    clusterGroupRef.current.clearLayers();

    if (validAssignments.length === 0) return;

    const markers: L.Marker[] = [];

    validAssignments.forEach((assignment) => {
      const isSaved = savedIds.has(assignment.id);
      const isOwn = assignment.agent_id === currentUserId;

      const marker = L.marker([assignment.map_lat!, assignment.map_lng!], {
        icon: createPricePillIcon(assignment, isSaved),
      });

      marker.bindPopup(getPopupHtml(assignment, isOwn), {
        maxWidth: 280,
        className: "custom-popup",
        closeButton: true,
      });

      markers.push(marker);
    });

    clusterGroupRef.current.addLayers(markers);

    // Fit bounds to show all markers
    if (markers.length > 0) {
      const group = L.featureGroup(markers);
      const bounds = group.getBounds();
      if (bounds.isValid()) {
        mapInstanceRef.current.fitBounds(bounds.pad(0.1), {
          maxZoom: 14,
          animate: true,
        });
      }
    }
  }, [validAssignments, savedIds, currentUserId, isMapReady]);

  const handleLocateUser = useCallback(() => {
    if (!mapInstanceRef.current) return;

    navigator.geolocation.getCurrentPosition(
      (position) => {
        mapInstanceRef.current?.flyTo(
          [position.coords.latitude, position.coords.longitude],
          14,
          { animate: true, duration: 0.8 }
        );
      },
      (error) => {
        console.error("Geolocation error:", error);
      }
    );
  }, []);

  const handleZoomIn = useCallback(() => {
    mapInstanceRef.current?.zoomIn();
  }, []);

  const handleZoomOut = useCallback(() => {
    mapInstanceRef.current?.zoomOut();
  }, []);

  return (
    <div className="relative w-full h-full rounded-xl overflow-hidden">
      <div ref={mapContainerRef} className="absolute inset-0 z-0" />

      {/* Custom Controls */}
      <div className="absolute bottom-4 right-4 flex flex-col gap-2 z-[1000]">
        <button
          onClick={handleLocateUser}
          className="p-2.5 bg-background rounded-lg shadow-lg hover:bg-muted transition-colors border border-border"
          title="Find my location"
        >
          <Locate className="h-5 w-5 text-foreground" />
        </button>
        <button
          onClick={handleZoomIn}
          className="p-2.5 bg-background rounded-lg shadow-lg hover:bg-muted transition-colors border border-border"
        >
          <ZoomIn className="h-5 w-5 text-foreground" />
        </button>
        <button
          onClick={handleZoomOut}
          className="p-2.5 bg-background rounded-lg shadow-lg hover:bg-muted transition-colors border border-border"
        >
          <ZoomOut className="h-5 w-5 text-foreground" />
        </button>
      </div>

      {/* Legend */}
      <div className="absolute top-4 left-4 bg-background/95 backdrop-blur-sm rounded-lg shadow-lg p-3 z-[1000] border border-border">
        <p className="text-xs font-medium mb-2 text-foreground">Legend</p>
        <div className="flex flex-col gap-1.5 text-xs text-muted-foreground">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-green-600"></div>
            <span>Below original price</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-background border border-border"></div>
            <span>At or above original</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-destructive">♥</span>
            <span>Saved</span>
          </div>
        </div>
      </div>

      {/* Loading state */}
      {!isMapReady && (
        <div className="absolute inset-0 flex items-center justify-center bg-muted">
          <div className="text-center text-muted-foreground">
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
            <p className="text-sm">Loading map...</p>
          </div>
        </div>
      )}
    </div>
  );
}
