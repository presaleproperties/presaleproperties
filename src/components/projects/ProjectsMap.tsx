import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet.markercluster/dist/MarkerCluster.css";
import "leaflet.markercluster/dist/MarkerCluster.Default.css";
import "leaflet.markercluster";
import { Button } from "@/components/ui/button";
import { Building2, Loader2, MapPin, Navigation } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

// City center coordinates for fallback positioning
const CITY_CENTERS: Record<string, [number, number]> = {
  Vancouver: [49.2827, -123.1207],
  Burnaby: [49.2488, -122.9805],
  Richmond: [49.1666, -123.1336],
  Surrey: [49.1913, -122.849],
  Coquitlam: [49.2838, -122.7932],
  "Port Coquitlam": [49.2625, -122.7811],
  "Port Moody": [49.2845, -122.857],
  "North Vancouver": [49.3165, -123.0688],
  "West Vancouver": [49.327, -123.166],
  Langley: [49.1044, -122.6581],
  Delta: [49.0847, -123.0587],
  Abbotsford: [49.0504, -122.3045],
  "New Westminster": [49.2057, -122.911],
  "White Rock": [49.0253, -122.8029],
  "Maple Ridge": [49.2193, -122.5984],
  Chilliwack: [49.1579, -121.9514],
};

const DEFAULT_CENTER: [number, number] = [49.25, -122.9];
const DEFAULT_ZOOM = 10;

// CartoDB Voyager - clean, colorful Apple Maps-like style
const TILE_URL = 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png';
const TILE_ATTRIBUTION = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>';

interface Project {
  id: string;
  name: string;
  slug: string;
  city: string;
  neighborhood: string;
  status: "coming_soon" | "registering" | "active" | "sold_out";
  project_type: "condo" | "townhome" | "mixed";
  starting_price: number | null;
  featured_image: string | null;
  map_lat?: number | null;
  map_lng?: number | null;
}

interface ProjectsMapProps {
  projects: Project[];
  isLoading?: boolean;
  onProjectSelect?: (projectId: string) => void;
  onVisibleProjectsChange?: (projectIds: string[]) => void;
}

const formatPrice = (price: number) => {
  if (price >= 1000000) return `$${(price / 1000000).toFixed(1)}M`;
  return `$${(price / 1000).toFixed(0)}K`;
};

const getStatusLabel = (status: Project["status"]) => {
  switch (status) {
    case "active":
      return "Selling Now";
    case "registering":
      return "Registering";
    case "coming_soon":
      return "Coming Soon";
    case "sold_out":
      return "Sold Out";
  }
};

// Smaller, refined price pill marker
const createPricePillIcon = (project: Project) => {
  const priceText = project.starting_price
    ? formatPrice(project.starting_price)
    : "TBD";

  return L.divIcon({
    className: "price-pill-marker",
    html: `
      <div style="
        display: inline-block;
        background: #F5C243;
        color: #1a1a1a;
        padding: 4px 8px;
        border-radius: 4px;
        font-size: 11px;
        font-weight: 600;
        white-space: nowrap;
        box-shadow: 0 1px 4px rgba(0,0,0,0.2);
        border: 1.5px solid white;
        cursor: pointer;
        font-family: system-ui, -apple-system, sans-serif;
      ">${priceText}</div>
    `,
    iconSize: [60, 22],
    iconAnchor: [30, 11],
    popupAnchor: [0, -11],
  });
};

// Custom cluster icon
const createClusterIcon = (cluster: L.MarkerCluster) => {
  const count = cluster.getChildCount();
  return L.divIcon({
    className: "custom-cluster-icon",
    html: `
      <div style="
        display: flex;
        align-items: center;
        justify-content: center;
        background: #F5C243;
        color: #1a1a1a;
        width: 36px;
        height: 36px;
        border-radius: 50%;
        font-size: 12px;
        font-weight: 700;
        box-shadow: 0 2px 8px rgba(0,0,0,0.25);
        border: 2px solid white;
        font-family: system-ui, -apple-system, sans-serif;
      ">${count}</div>
    `,
    iconSize: [36, 36],
    iconAnchor: [18, 18],
  });
};

function popupHtml(project: Project) {
  const img = project.featured_image
    ? `<img src="${project.featured_image}" alt="${project.name}" style="width:100%;height:120px;object-fit:cover;border-radius:8px;margin-bottom:8px;" />`
    : "";

  const price = project.starting_price
    ? `<div style="margin-top:4px;font-weight:600;font-size:14px;">From ${formatPrice(project.starting_price)}</div>`
    : "";

  const statusLabel = getStatusLabel(project.status);

  return `
    <div style="padding:2px;max-width:240px;font-family:system-ui,-apple-system,sans-serif;">
      ${img}
      <div style="display:flex;justify-content:space-between;gap:8px;align-items:flex-start;">
        <div style="font-weight:600;font-size:13px;line-height:1.3;">${project.name}</div>
        <div style="font-size:10px;color:#666;white-space:nowrap;">${statusLabel}</div>
      </div>
      <div style="margin-top:4px;font-size:11px;color:#888;">${project.neighborhood}, ${project.city}</div>
      ${price}
      <a href="/presale-projects/${project.slug}" style="display:block;margin-top:8px;text-align:center;background:#1e3a5f;color:#fff;text-decoration:none;padding:6px 8px;border-radius:6px;font-size:11px;font-weight:600;">View Project</a>
    </div>
  `;
}

export function ProjectsMap({ projects, isLoading, onProjectSelect, onVisibleProjectsChange }: ProjectsMapProps) {
  const { toast } = useToast();
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<L.Map | null>(null);
  const clusterGroupRef = useRef<L.MarkerClusterGroup | null>(null);
  const userCircleRef = useRef<L.Circle | null>(null);
  const [isLocating, setIsLocating] = useState(false);
  const mappedProjectsRef = useRef<Array<Project & { lat: number; lng: number }>>([]);

  // Function to calculate visible projects within map bounds
  const updateVisibleProjects = useCallback(() => {
    const map = mapRef.current;
    if (!map || !onVisibleProjectsChange) return;
    
    const bounds = map.getBounds();
    const visibleIds = mappedProjectsRef.current
      .filter(p => bounds.contains([p.lat, p.lng]))
      .map(p => p.id);
    
    onVisibleProjectsChange(visibleIds);
  }, [onVisibleProjectsChange]);

  const mappedProjects = useMemo(() => {
    const mapped = projects.map((p) => {
      if (p.map_lat && p.map_lng) return { ...p, lat: p.map_lat, lng: p.map_lng };
      const center = CITY_CENTERS[p.city] || DEFAULT_CENTER;
      const offset = (Math.random() - 0.5) * 0.02;
      return { ...p, lat: center[0] + offset, lng: center[1] + offset };
    });
    mappedProjectsRef.current = mapped;
    return mapped;
  }, [projects]);

  // Auto-locate user on mount and setup viewport change listener
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = L.map(containerRef.current, {
      center: DEFAULT_CENTER,
      zoom: DEFAULT_ZOOM,
      zoomControl: false,
    });

    L.tileLayer(TILE_URL, {
      attribution: TILE_ATTRIBUTION,
      maxZoom: 19,
    }).addTo(map);

    // Create marker cluster group
    clusterGroupRef.current = L.markerClusterGroup({
      iconCreateFunction: createClusterIcon,
      maxClusterRadius: 50,
      spiderfyOnMaxZoom: true,
      showCoverageOnHover: false,
      disableClusteringAtZoom: 15,
    });
    map.addLayer(clusterGroupRef.current);

    mapRef.current = map;
    setTimeout(() => map.invalidateSize(), 0);

    // Listen for map viewport changes
    map.on('moveend', updateVisibleProjects);
    map.on('zoomend', updateVisibleProjects);

    // Auto-locate user on mount
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
              color: "hsl(43 96% 56%)",
              fillColor: "hsl(43 96% 56%)",
              fillOpacity: 0.15,
              weight: 2,
            }).addTo(map);
          }
          setIsLocating(false);
          // Update visible projects after initial location
          setTimeout(updateVisibleProjects, 100);
        },
        () => {
          setIsLocating(false);
          setTimeout(updateVisibleProjects, 100);
        },
        { enableHighAccuracy: false, timeout: 5000, maximumAge: 60000 }
      );
    } else {
      setTimeout(updateVisibleProjects, 100);
    }
  }, [updateVisibleProjects]);

  // Update markers when projects change
  useEffect(() => {
    const map = mapRef.current;
    const clusterGroup = clusterGroupRef.current;
    if (!map || !clusterGroup) return;

    clusterGroup.clearLayers();

    mappedProjects.forEach((p) => {
      const marker = L.marker([p.lat, p.lng], { icon: createPricePillIcon(p) });
      
      // Only trigger carousel selection, no popup
      marker.on('click', () => {
        onProjectSelect?.(p.id);
      });
      
      clusterGroup.addLayer(marker);
    });

    // Only fit bounds if user location circle isn't showing (meaning we didn't auto-locate)
    if (mappedProjects.length > 0 && !userCircleRef.current) {
      const bounds = L.latLngBounds(mappedProjects.map((p) => [p.lat, p.lng] as [number, number]));
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 14 });
    }
  }, [mappedProjects, onProjectSelect]);

  useEffect(() => {
    return () => {
      mapRef.current?.remove();
      mapRef.current = null;
      clusterGroupRef.current = null;
      userCircleRef.current = null;
    };
  }, []);

  const handleLocate = () => {
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
          color: "hsl(43 96% 56%)",
          fillColor: "hsl(43 96% 56%)",
          fillOpacity: 0.15,
          weight: 2,
        }).addTo(map);

        setIsLocating(false);
        toast({ title: "Location found", description: "Map centered on your location" });
      },
      (err) => {
        setIsLocating(false);
        let msg = "Unable to get your location.";
        if (err.code === err.PERMISSION_DENIED) msg = "Location permission denied. Please enable location access.";
        if (err.code === err.POSITION_UNAVAILABLE) msg = "Location information unavailable.";
        if (err.code === err.TIMEOUT) msg = "Location request timed out.";
        toast({ title: "Location error", description: msg, variant: "destructive" });
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

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

  if (projects.length === 0) {
    return (
      <div className="h-[500px] lg:h-[600px] rounded-xl bg-muted flex items-center justify-center">
        <div className="text-center text-muted-foreground">
          <Building2 className="h-12 w-12 mx-auto mb-2" />
          <p>No projects to display on map</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative h-[500px] lg:h-[600px] rounded-xl overflow-hidden border border-border">
      <div ref={containerRef} className="h-full w-full" />

      {/* Custom controls - stacked on right */}
      <div className="absolute top-3 right-3 z-[1000] flex flex-col gap-2">
        {/* Locate button */}
        <button
          onClick={handleLocate}
          disabled={isLocating}
          title="Zoom to my location"
          className="w-9 h-9 rounded-lg bg-white/95 backdrop-blur-sm shadow-md border border-border/50 flex items-center justify-center hover:bg-white transition-colors disabled:opacity-50"
        >
          {isLocating ? <Loader2 className="h-4 w-4 animate-spin text-foreground" /> : <Navigation className="h-4 w-4 text-foreground" />}
        </button>
        
        {/* Zoom controls */}
        <div className="flex flex-col rounded-lg overflow-hidden bg-white/95 backdrop-blur-sm shadow-md border border-border/50">
          <button
            onClick={() => mapRef.current?.zoomIn()}
            className="w-9 h-9 flex items-center justify-center text-foreground hover:bg-muted transition-colors border-b border-border/50"
            title="Zoom in"
          >
            <span className="text-lg font-medium">+</span>
          </button>
          <button
            onClick={() => mapRef.current?.zoomOut()}
            className="w-9 h-9 flex items-center justify-center text-foreground hover:bg-muted transition-colors"
            title="Zoom out"
          >
            <span className="text-lg font-medium">−</span>
          </button>
        </div>
      </div>
    </div>
  );
}
