import { useRef, useEffect, useCallback, useMemo } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet.markercluster/dist/MarkerCluster.css";
import "leaflet.markercluster/dist/MarkerCluster.Default.css";
import "leaflet.markercluster";
import { Heart, ZoomIn, ZoomOut, Locate } from "lucide-react";

const DEFAULT_CENTER: [number, number] = [49.2827, -123.1207];
const DEFAULT_ZOOM = 11;

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
  
  return L.divIcon({
    className: "custom-price-pill",
    html: `
      <div class="relative">
        <div class="
          px-2.5 py-1.5 rounded-full text-xs font-bold shadow-lg
          ${hasSavings ? 'bg-green-500 text-white' : 'bg-white text-gray-900 border border-gray-200'}
          hover:scale-105 transition-transform cursor-pointer
          flex items-center gap-1
        ">
          ${formatPrice(assignment.assignment_price)}
          ${isSaved ? '<span class="text-red-500">♥</span>' : ''}
        </div>
        <div class="absolute left-1/2 -translate-x-1/2 top-full w-0 h-0 
          border-l-[6px] border-l-transparent 
          border-r-[6px] border-r-transparent 
          ${hasSavings ? 'border-t-[6px] border-t-green-500' : 'border-t-[6px] border-t-white'}
        "></div>
      </div>
    `,
    iconSize: [80, 36],
    iconAnchor: [40, 36],
  });
}

function createClusterIcon(cluster: L.MarkerCluster): L.DivIcon {
  const count = cluster.getChildCount();
  return L.divIcon({
    className: "custom-cluster",
    html: `
      <div class="
        w-10 h-10 rounded-full bg-primary text-primary-foreground
        flex items-center justify-center text-sm font-bold shadow-lg
        border-2 border-white
      ">
        ${count}
      </div>
    `,
    iconSize: [40, 40],
    iconAnchor: [20, 20],
  });
}

function popupHtml(assignment: Assignment, isOwn: boolean): string {
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
    <div class="w-64 p-0 font-sans">
      <div class="relative h-32 bg-muted rounded-t-lg overflow-hidden">
        ${mainPhoto 
          ? `<img src="${mainPhoto}" alt="${assignment.title}" class="w-full h-full object-cover" />`
          : `<div class="w-full h-full flex items-center justify-center text-muted-foreground">No Image</div>`
        }
        ${isOwn ? `<span class="absolute top-2 left-2 bg-primary text-primary-foreground text-xs px-2 py-0.5 rounded">Your Listing</span>` : ''}
        ${savings && savings > 0 ? `<span class="absolute bottom-2 left-2 bg-green-600 text-white text-xs px-2 py-0.5 rounded">Save $${(savings/1000).toFixed(0)}K</span>` : ''}
      </div>
      <div class="p-3">
        <h3 class="font-semibold text-sm mb-1 line-clamp-1">${assignment.title || assignment.project_name}</h3>
        <p class="text-xs text-muted-foreground mb-2">${assignment.neighborhood ? `${assignment.neighborhood}, ` : ''}${assignment.city}</p>
        <div class="flex items-center justify-between">
          <span class="font-bold text-primary">${formattedPrice}</span>
          <span class="text-xs text-muted-foreground">${assignment.beds} bed · ${assignment.baths} bath</span>
        </div>
        <a 
          href="/assignments/${assignment.id}" 
          class="mt-2 block text-center bg-primary text-primary-foreground text-xs py-1.5 px-3 rounded hover:bg-primary/90 transition-colors"
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
  const mapRef = useRef<L.Map | null>(null);
  const clusterGroupRef = useRef<L.MarkerClusterGroup | null>(null);

  const validAssignments = useMemo(() => {
    return assignments.filter(a => a.map_lat && a.map_lng);
  }, [assignments]);

  const initializeMap = useCallback(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    const map = L.map(mapContainerRef.current, {
      center: DEFAULT_CENTER,
      zoom: DEFAULT_ZOOM,
      zoomControl: false,
    });

    L.tileLayer("https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png", {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      maxZoom: 19,
    }).addTo(map);

    const clusterGroup = L.markerClusterGroup({
      chunkedLoading: true,
      maxClusterRadius: 50,
      iconCreateFunction: createClusterIcon,
      spiderfyOnMaxZoom: true,
      showCoverageOnHover: false,
      zoomToBoundsOnClick: true,
    });

    map.addLayer(clusterGroup);

    mapRef.current = map;
    clusterGroupRef.current = clusterGroup;
  }, []);

  // Initialize map
  useEffect(() => {
    initializeMap();

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
        clusterGroupRef.current = null;
      }
    };
  }, [initializeMap]);

  // Update markers when assignments change
  useEffect(() => {
    if (!clusterGroupRef.current || !mapRef.current) return;

    clusterGroupRef.current.clearLayers();

    if (validAssignments.length === 0) return;

    const markers: L.Marker[] = [];

    validAssignments.forEach((assignment) => {
      const isSaved = savedIds.has(assignment.id);
      const isOwn = assignment.agent_id === currentUserId;

      const marker = L.marker([assignment.map_lat!, assignment.map_lng!], {
        icon: createPricePillIcon(assignment, isSaved),
      });

      marker.bindPopup(popupHtml(assignment, isOwn), {
        maxWidth: 280,
        className: "custom-popup",
      });

      markers.push(marker);
    });

    clusterGroupRef.current.addLayers(markers);

    // Fit bounds to show all markers
    if (markers.length > 0) {
      const group = L.featureGroup(markers);
      mapRef.current.fitBounds(group.getBounds().pad(0.1));
    }
  }, [validAssignments, savedIds, currentUserId]);

  const handleLocateUser = () => {
    if (!mapRef.current) return;

    navigator.geolocation.getCurrentPosition(
      (position) => {
        mapRef.current?.setView(
          [position.coords.latitude, position.coords.longitude],
          14
        );
      },
      (error) => {
        console.error("Geolocation error:", error);
      }
    );
  };

  const handleZoomIn = () => mapRef.current?.zoomIn();
  const handleZoomOut = () => mapRef.current?.zoomOut();

  return (
    <div className="relative w-full h-full rounded-xl overflow-hidden">
      <div ref={mapContainerRef} className="absolute inset-0" />

      {/* Custom Controls */}
      <div className="absolute bottom-4 right-4 flex flex-col gap-2 z-[1000]">
        <button
          onClick={handleLocateUser}
          className="p-2.5 bg-white rounded-lg shadow-lg hover:bg-gray-50 transition-colors"
          title="Find my location"
        >
          <Locate className="h-5 w-5 text-gray-700" />
        </button>
        <button
          onClick={handleZoomIn}
          className="p-2.5 bg-white rounded-lg shadow-lg hover:bg-gray-50 transition-colors"
        >
          <ZoomIn className="h-5 w-5 text-gray-700" />
        </button>
        <button
          onClick={handleZoomOut}
          className="p-2.5 bg-white rounded-lg shadow-lg hover:bg-gray-50 transition-colors"
        >
          <ZoomOut className="h-5 w-5 text-gray-700" />
        </button>
      </div>

      {/* Legend */}
      <div className="absolute top-4 left-4 bg-white/95 backdrop-blur-sm rounded-lg shadow-lg p-3 z-[1000]">
        <p className="text-xs font-medium mb-2">Legend</p>
        <div className="flex flex-col gap-1.5 text-xs">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-green-500"></div>
            <span>Below original price</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-white border border-gray-300"></div>
            <span>At or above original</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-red-500">♥</span>
            <span>Saved</span>
          </div>
        </div>
      </div>
    </div>
  );
}
