import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet.markercluster/dist/MarkerCluster.css";
import "leaflet.markercluster/dist/MarkerCluster.Default.css";
import "leaflet.markercluster";
import { Building2, Loader2, MapPin, Navigation } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const DEFAULT_CENTER: [number, number] = [49.25, -122.9];
const DEFAULT_ZOOM = 10;

const TILE_URL = 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png';
const TILE_ATTRIBUTION = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>';

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
  map_lat: number | null;
  map_lng: number | null;
  status?: string;
  agent_id?: string;
  listing_photos?: { url: string; sort_order: number | null }[];
}

interface AssignmentsMapProps {
  assignments: Assignment[];
  isLoading?: boolean;
  savedIds?: Set<string>;
  onToggleSave?: (id: string) => void;
  onAssignmentSelect?: (assignmentId: string) => void;
  currentUserId?: string;
}

const formatPrice = (price: number) => {
  if (price >= 1000000) return `$${(price / 1000000).toFixed(1)}M`;
  return `$${(price / 1000).toFixed(0)}K`;
};

// Icon cache for performance
const assignmentIconCache = new Map<string, L.DivIcon>();

// Assignment marker - optimized pin with building icon
const createPricePillIcon = () => {
  const cacheKey = 'assignment-pin';
  const cached = assignmentIconCache.get(cacheKey);
  if (cached) return cached;

  const icon = L.divIcon({
    className: "assign-pin",
    html: `<div class="assign-marker"></div>`,
    iconSize: [24, 30],
    iconAnchor: [12, 30],
    popupAnchor: [0, -30],
  });
  
  assignmentIconCache.set(cacheKey, icon);
  return icon;
};

// Custom cluster icon - optimized
const createClusterIcon = (cluster: L.MarkerCluster) => {
  const count = cluster.getChildCount();
  const sizeClass = count >= 100 ? 'lg' : count >= 10 ? 'md' : 'sm';
  const size = count >= 100 ? 44 : count >= 10 ? 40 : 36;
  
  return L.divIcon({
    className: "mc",
    html: `<div class="cl ${sizeClass}">${count}</div>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  });
};

function popupHtml(assignment: Assignment) {
  const savings = assignment.original_price 
    ? assignment.original_price - assignment.assignment_price 
    : 0;
  const hasSavings = savings > 0;
  
  const photo = assignment.listing_photos?.sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0))?.[0]?.url;
  
  const img = photo
    ? `<div style="position:relative;margin:-12px -12px 0 -12px;width:calc(100% + 24px);">
        <img src="${photo}" alt="${assignment.title}" style="width:100%;height:130px;object-fit:cover;border-radius:8px 8px 0 0;display:block;" />
        ${hasSavings ? `<div style="position:absolute;top:8px;left:8px;background:#22c55e;color:#fff;padding:3px 8px;border-radius:4px;font-size:10px;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;white-space:nowrap;">Save ${formatPrice(savings)}</div>` : ''}
      </div>`
    : '';

  return `
    <div style="width:220px;font-family:system-ui,-apple-system,sans-serif;">
      <a href="/dashboard/assignments/${assignment.id}" style="display:block;text-decoration:none;color:inherit;padding:12px;">
        ${img}
        <div style="padding-top:${photo ? '10px' : '0'};">
          <div style="font-weight:600;font-size:14px;line-height:1.3;color:#1a1a1a;margin-bottom:4px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${assignment.project_name}</div>
          <div style="font-size:12px;color:#666;display:flex;align-items:center;gap:4px;white-space:nowrap;">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
            ${assignment.neighborhood || assignment.city}
          </div>
          <div style="font-weight:700;font-size:15px;color:#1e3a5f;margin-top:4px;">${formatPrice(assignment.assignment_price)}</div>
          <div style="font-size:11px;color:#888;margin-top:2px;white-space:nowrap;">${assignment.beds} bed • ${assignment.baths} bath${assignment.interior_sqft ? ` • ${assignment.interior_sqft} sqft` : ''}</div>
        </div>
      </a>
    </div>
  `;
}

export function AssignmentsMap({ 
  assignments, 
  isLoading, 
  savedIds, 
  onToggleSave,
  onAssignmentSelect,
  currentUserId
}: AssignmentsMapProps) {
  const { toast } = useToast();
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<L.Map | null>(null);
  const clusterGroupRef = useRef<L.MarkerClusterGroup | null>(null);
  const userCircleRef = useRef<L.Circle | null>(null);
  const [isLocating, setIsLocating] = useState(false);

  const validAssignments = useMemo(() => 
    assignments.filter(a => a.map_lat && a.map_lng),
    [assignments]
  );

  // Initialize map
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = L.map(containerRef.current, {
      center: DEFAULT_CENTER,
      zoom: DEFAULT_ZOOM,
      zoomControl: false,
      preferCanvas: true,
      fadeAnimation: false,
      markerZoomAnimation: false,
    });

    L.tileLayer(TILE_URL, {
      attribution: TILE_ATTRIBUTION,
      maxZoom: 19,
      updateWhenIdle: true,
      updateWhenZooming: false,
      keepBuffer: 2,
    }).addTo(map);

    // Create marker cluster group - optimized settings
    clusterGroupRef.current = L.markerClusterGroup({
      iconCreateFunction: createClusterIcon,
      maxClusterRadius: 50,
      spiderfyOnMaxZoom: true,
      showCoverageOnHover: false,
      disableClusteringAtZoom: 16,
      chunkedLoading: true,
      chunkDelay: 10,
      chunkInterval: 50,
      animate: false,
      animateAddingMarkers: false,
      removeOutsideVisibleBounds: true,
    });
    map.addLayer(clusterGroupRef.current);

    mapRef.current = map;
    setTimeout(() => map.invalidateSize(), 0);

    // Auto-locate user
    if (navigator.geolocation) {
      setIsLocating(true);
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const { latitude, longitude } = pos.coords;
          
          if (latitude > 48 && latitude < 51 && longitude > -125 && longitude < -120) {
            map.setView([latitude, longitude], 12, { animate: true });
            
            if (userCircleRef.current) userCircleRef.current.remove();
            userCircleRef.current = L.circle([latitude, longitude], {
              radius: 500,
              color: "hsl(40 65% 55%)",
              fillColor: "hsl(40 65% 55%)",
              fillOpacity: 0.15,
              weight: 2,
            }).addTo(map);
          }
          setIsLocating(false);
        },
        () => setIsLocating(false),
        { enableHighAccuracy: false, timeout: 5000, maximumAge: 60000 }
      );
    }
  }, []);

  // Update markers when assignments change
  useEffect(() => {
    const map = mapRef.current;
    const clusterGroup = clusterGroupRef.current;
    if (!map || !clusterGroup) return;

    clusterGroup.clearLayers();

    validAssignments.forEach((assignment) => {
      const marker = L.marker([assignment.map_lat!, assignment.map_lng!], { 
        icon: createPricePillIcon() 
      });
      
      marker.bindPopup(popupHtml(assignment), {
        maxWidth: 260,
        className: 'assignment-popup'
      });
      
      marker.on('click', () => {
        onAssignmentSelect?.(assignment.id);
      });
      
      clusterGroup.addLayer(marker);
    });

    // Fit bounds if we have assignments and no user location
    if (validAssignments.length > 0 && !userCircleRef.current) {
      const bounds = L.latLngBounds(
        validAssignments.map(a => [a.map_lat!, a.map_lng!] as [number, number])
      );
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 14 });
    }
  }, [validAssignments, onAssignmentSelect]);

  // Cleanup
  useEffect(() => {
    return () => {
      mapRef.current?.remove();
      mapRef.current = null;
      clusterGroupRef.current = null;
      userCircleRef.current = null;
    };
  }, []);

  const handleLocate = useCallback(() => {
    const map = mapRef.current;
    if (!map) return;

    if (!navigator.geolocation) {
      toast({
        title: "Geolocation not supported",
        description: "Your browser doesn't support geolocation.",
        variant: "destructive",
      });
      return;
    }

    setIsLocating(true);

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        map.setView([latitude, longitude], 13, { animate: true });

        if (userCircleRef.current) userCircleRef.current.remove();

        userCircleRef.current = L.circle([latitude, longitude], {
          radius: 500,
          color: "hsl(40 65% 55%)",
          fillColor: "hsl(40 65% 55%)",
          fillOpacity: 0.15,
          weight: 2,
        }).addTo(map);

        setIsLocating(false);
        toast({ title: "Location found", description: "Map centered on your location" });
      },
      (err) => {
        setIsLocating(false);
        let msg = "Unable to get your location.";
        if (err.code === err.PERMISSION_DENIED) msg = "Location permission denied.";
        if (err.code === err.POSITION_UNAVAILABLE) msg = "Location information unavailable.";
        if (err.code === err.TIMEOUT) msg = "Location request timed out.";
        toast({ title: "Location error", description: msg, variant: "destructive" });
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  }, [toast]);

  if (isLoading) {
    return (
      <div className="h-[500px] lg:h-[600px] rounded-xl bg-muted animate-pulse flex items-center justify-center">
        <div className="text-center text-muted-foreground">
          <MapPin className="h-12 w-12 mx-auto mb-2 animate-pulse" />
          <p>Loading map...</p>
        </div>
      </div>
    );
  }

  if (assignments.length === 0) {
    return (
      <div className="h-[500px] lg:h-[600px] rounded-xl bg-muted flex items-center justify-center">
        <div className="text-center text-muted-foreground">
          <Building2 className="h-12 w-12 mx-auto mb-2" />
          <p>No assignments to display on map</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative h-full w-full">
      <style>{`
        .assignment-popup .leaflet-popup-content-wrapper {
          padding: 0;
          border-radius: 12px;
          overflow: hidden;
        }
        .assignment-popup .leaflet-popup-content {
          margin: 0;
          width: 220px !important;
        }
        .assignment-popup .leaflet-popup-tip {
          background: white;
        }
      `}</style>
      <div ref={containerRef} className="h-full w-full rounded-xl overflow-hidden" />

      {/* Custom controls - matches presale map style exactly */}
      <div className="absolute bottom-24 lg:bottom-6 right-3 z-[900] flex flex-col gap-1.5">
        {/* Zoom controls */}
        <div className="flex flex-col rounded-full overflow-hidden bg-background/95 backdrop-blur-sm shadow-md border border-border/40">
          <button
            onClick={() => mapRef.current?.zoomIn()}
            className="w-8 h-8 flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
            title="Zoom in"
          >
            <span className="text-base font-medium">+</span>
          </button>
          <div className="w-full h-px bg-border/50" />
          <button
            onClick={() => mapRef.current?.zoomOut()}
            className="w-8 h-8 flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
            title="Zoom out"
          >
            <span className="text-base font-medium">−</span>
          </button>
        </div>
        
        {/* Locate button */}
        <button
          onClick={handleLocate}
          disabled={isLocating}
          title="Zoom to my location"
          className="w-8 h-8 rounded-full bg-background/95 backdrop-blur-sm shadow-md border border-border/40 flex items-center justify-center hover:bg-background transition-colors disabled:opacity-50"
        >
          {isLocating ? (
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
          ) : (
            <Navigation className="h-4 w-4 text-muted-foreground" />
          )}
        </button>
      </div>
    </div>
  );
}

export default AssignmentsMap;
