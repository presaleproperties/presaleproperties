import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet.markercluster/dist/MarkerCluster.css";
import "leaflet.markercluster/dist/MarkerCluster.Default.css";
import "leaflet.markercluster";
import { Button } from "@/components/ui/button";
import { Building2, Loader2, MapPin, Navigation } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { generateProjectUrl } from "@/lib/seoUrls";

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
  initialCenter?: [number, number];
  initialZoom?: number;
  initialProjectSlug?: string;
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

// Presale marker - clean pin style (no excessive glow)
const createPricePillIcon = () => {
  // Building icon for new construction
  const buildingIcon = `<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="hsl(30, 15%, 18%)" stroke="hsl(30, 15%, 18%)" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M6 22V2l12 6v14"/><path d="M6 12H2"/><path d="M6 7H2"/><path d="M6 17H2"/><path d="M18 22V8"/><path d="M10 11h.01"/><path d="M10 15h.01"/><path d="M14 11h.01"/><path d="M14 15h.01"/></svg>`;

  return L.divIcon({
    className: "presale-pin-marker",
    html: `
      <div style="
        position: relative;
        width: 32px;
        height: 40px;
        cursor: pointer;
      ">
        <svg width="32" height="40" viewBox="0 0 32 40" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M16 0C7.163 0 0 7.163 0 16c0 10 16 24 16 24s16-14 16-24c0-8.837-7.163-16-16-16z" fill="hsl(30, 15%, 18%)"/>
          <circle cx="16" cy="14" r="9" fill="hsl(40, 65%, 55%)"/>
        </svg>
        <div style="
          position: absolute;
          top: 6px;
          left: 50%;
          transform: translateX(-50%);
          display: flex;
          align-items: center;
          justify-content: center;
          width: 18px;
          height: 18px;
        ">
          ${buildingIcon}
        </div>
      </div>
    `,
    iconSize: [32, 40],
    iconAnchor: [16, 40],
    popupAnchor: [0, -40],
  });
};

// Custom cluster icon - clean, larger for touch
const createClusterIcon = (cluster: L.MarkerCluster) => {
  const count = cluster.getChildCount();
  const size = count >= 100 ? 52 : count >= 10 ? 46 : 40;
  return L.divIcon({
    className: "custom-cluster-icon",
    html: `
      <div style="
        display: flex;
        align-items: center;
        justify-content: center;
        background: hsl(30, 15%, 18%);
        color: white;
        width: ${size}px;
        height: ${size}px;
        border-radius: 50%;
        font-size: ${count >= 100 ? '14' : count >= 10 ? '13' : '12'}px;
        font-weight: 700;
        box-shadow: 0 2px 8px rgba(0,0,0,0.15);
        border: 2px solid hsl(40, 65%, 55%);
        font-family: system-ui, -apple-system, sans-serif;
        cursor: pointer;
        transition: transform 0.15s ease;
      ">${count}</div>
    `,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  });
};

function getStatusColor(status: Project["status"]) {
  switch (status) {
    case "active":
      return { bg: "#22c55e", text: "#fff" };
    case "registering":
      return { bg: "#3b82f6", text: "#fff" };
    case "coming_soon":
      return { bg: "#f59e0b", text: "#fff" };
    case "sold_out":
      return { bg: "#94a3b8", text: "#fff" };
  }
}

function popupHtml(project: Project) {
  const statusLabel = getStatusLabel(project.status);
  const statusColor = getStatusColor(project.status);

  const img = project.featured_image
    ? `<div style="position:relative;margin:-12px -12px 0 -12px;">
        <img src="${project.featured_image}" alt="${project.name}" style="width:100%;height:130px;object-fit:cover;border-radius:8px 8px 0 0;" />
        <div style="position:absolute;top:8px;left:8px;background:${statusColor.bg};color:${statusColor.text};padding:3px 8px;border-radius:4px;font-size:10px;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;">${statusLabel}</div>
      </div>`
    : `<div style="position:absolute;top:-4px;left:-4px;background:${statusColor.bg};color:${statusColor.text};padding:3px 8px;border-radius:4px;font-size:10px;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;">${statusLabel}</div>`;

  const price = project.starting_price
    ? `<div style="font-weight:700;font-size:15px;color:#1e3a5f;margin-top:2px;">From ${formatPrice(project.starting_price)}</div>`
    : `<div style="font-size:13px;color:#888;margin-top:2px;">Price TBD</div>`;

  // Generate SEO-friendly URL
  const projectUrl = generateProjectUrl({
    slug: project.slug,
    neighborhood: project.neighborhood || project.city,
    projectType: project.project_type,
  });

  return `
    <a href="${projectUrl}" style="display:block;text-decoration:none;color:inherit;padding:12px;max-width:220px;font-family:system-ui,-apple-system,sans-serif;position:relative;">
      ${img}
      <div style="padding-top:${project.featured_image ? '10px' : '20px'};">
        <div style="font-weight:600;font-size:14px;line-height:1.3;color:#1a1a1a;margin-bottom:4px;">${project.name}</div>
        <div style="font-size:12px;color:#666;display:flex;align-items:center;gap:4px;">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
          ${project.neighborhood}, ${project.city}
        </div>
        ${price}
      </div>
    </a>
  `;
}

export function ProjectsMap({ projects, isLoading, onProjectSelect, onVisibleProjectsChange, initialCenter, initialZoom, initialProjectSlug }: ProjectsMapProps) {
  const { toast } = useToast();
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<L.Map | null>(null);
  const clusterGroupRef = useRef<L.MarkerClusterGroup | null>(null);
  const userCircleRef = useRef<L.Circle | null>(null);
  const [isLocating, setIsLocating] = useState(false);
  const mappedProjectsRef = useRef<Array<Project & { lat: number; lng: number }>>([]);
  const hasInitializedRef = useRef(false);

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

  // Auto-select initial project when projects load
  useEffect(() => {
    if (initialProjectSlug && mappedProjects.length > 0 && !hasInitializedRef.current) {
      const project = mappedProjects.find(p => p.slug === initialProjectSlug);
      if (project && onProjectSelect) {
        hasInitializedRef.current = true;
        // Small delay to ensure map is ready
        setTimeout(() => {
          onProjectSelect(project.id);
        }, 300);
      }
    }
  }, [initialProjectSlug, mappedProjects, onProjectSelect]);

  // Initialize map
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    // Use initial center/zoom if provided, otherwise defaults
    const startCenter = initialCenter || DEFAULT_CENTER;
    const startZoom = initialZoom || DEFAULT_ZOOM;

    const map = L.map(containerRef.current, {
      center: startCenter,
      zoom: startZoom,
      zoomControl: false,
      fadeAnimation: true, // Smooth transitions
      zoomAnimation: true, // Google Maps-like zoom
      markerZoomAnimation: true,
      inertia: true,
      inertiaDeceleration: 2000,
      easeLinearity: 0.25,
      touchZoom: 'center',
    });

    L.tileLayer(TILE_URL, {
      attribution: TILE_ATTRIBUTION,
      maxZoom: 19,
      keepBuffer: 4,
    }).addTo(map);

    // Create marker cluster group - smooth, Google Maps-style clustering
    clusterGroupRef.current = L.markerClusterGroup({
      iconCreateFunction: createClusterIcon,
      maxClusterRadius: 50, // Tighter for precision
      spiderfyOnMaxZoom: true,
      showCoverageOnHover: false,
      disableClusteringAtZoom: 17, // Show pins at higher zoom
      spiderfyDistanceMultiplier: 1.8, // More spread for easier tapping
      zoomToBoundsOnClick: true, // Single click zooms smoothly
      animate: true, // Smooth cluster animations
      animateAddingMarkers: false,
      spiderLegPolylineOptions: { weight: 1.5, color: 'hsl(40, 65%, 60%)', opacity: 0.5 },
    });
    map.addLayer(clusterGroupRef.current);

    mapRef.current = map;
    setTimeout(() => map.invalidateSize(), 0);

    // Listen for map viewport changes
    map.on('moveend', updateVisibleProjects);
    map.on('zoomend', updateVisibleProjects);

    // Only auto-locate if no initial center was provided
    if (!initialCenter && navigator.geolocation) {
      setIsLocating(true);
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const { latitude, longitude } = pos.coords;
          // Bail if map was destroyed while waiting for geolocation
          if (mapRef.current !== map) return;
          try {
            const c = map.getContainer();
            if (!c || !document.body.contains(c)) return;
          } catch { return; }

          if (latitude > 48 && latitude < 51 && longitude > -125 && longitude < -120) {
            try { map.setView([latitude, longitude], 12, { animate: false }); } catch { return; }

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
  }, [updateVisibleProjects, initialCenter, initialZoom]);

  // Handle initial center/zoom changes after mount (for deep-linking)
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !initialCenter) return;
    
    // Check if map container is still valid before calling setView
    // This prevents the "_leaflet_pos" error when map is destroyed
    try {
      const container = map.getContainer();
      if (!container || !document.body.contains(container)) return;
      
      // Use setView with no animation to prevent shaking/jitter
      // The clusters re-rendering during flyTo causes visual shaking
      map.setView(initialCenter, initialZoom || 16, { animate: false });
    } catch (e) {
      // Map may have been destroyed, ignore
      console.warn('Map setView failed:', e);
    }
  }, [initialCenter, initialZoom]);


  // Update markers when projects change
  useEffect(() => {
    const map = mapRef.current;
    const clusterGroup = clusterGroupRef.current;
    if (!map || !clusterGroup) return;

    clusterGroup.clearLayers();

    mappedProjects.forEach((p) => {
      const marker = L.marker([p.lat, p.lng], { icon: createPricePillIcon() });
      
      // Bind popup for navigation and trigger carousel selection
      marker.bindPopup(popupHtml(p), {
        maxWidth: 260,
        className: 'project-popup'
      });
      
      marker.on('click', () => {
        onProjectSelect?.(p.id);
      });
      
      clusterGroup.addLayer(marker);
    });

    // Only fit bounds if:
    // 1. User location circle isn't showing (meaning we didn't auto-locate)
    // 2. No initial center was provided (meaning we're not deep-linking to a specific project)
    if (mappedProjects.length > 0 && !userCircleRef.current && !initialCenter) {
      try {
        const c = map.getContainer();
        if (!c || !document.body.contains(c)) return;
        const bounds = L.latLngBounds(mappedProjects.map((p) => [p.lat, p.lng] as [number, number]));
        map.fitBounds(bounds, { padding: [50, 50], maxZoom: 14, animate: false });
      } catch (e) {
        console.warn('fitBounds skipped:', e);
      }
    }
  }, [mappedProjects, onProjectSelect, initialCenter]);

  useEffect(() => {
    return () => {
      const map = mapRef.current;
      if (map) {
        // Stop any in-flight animations before removing to prevent _leaflet_pos errors
        try { map.stop(); } catch (_) {}
        map.off();
        map.remove();
      }
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
        if (mapRef.current !== map) return;
        try {
          const c = map.getContainer();
          if (!c || !document.body.contains(c)) return;
        } catch { return; }
        try { map.setView([latitude, longitude], 13, { animate: false }); } catch { return; }

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
    <div className="relative h-full w-full">
      <div ref={containerRef} className="h-full w-full" />

      {/* Custom controls - bottom right to avoid overlaps on mobile */}
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
          {isLocating ? <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" /> : <Navigation className="h-4 w-4 text-muted-foreground" />}
        </button>
      </div>
    </div>
  );
}
