import { useEffect, useMemo, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
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

// CartoDB Voyager tiles - clean, colorful, modern
const TILE_URL = "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png";
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

// Price pill marker (like the reference image)
const createPricePillIcon = (project: Project) => {
  const priceText = project.starting_price
    ? formatPrice(project.starting_price)
    : "TBD";

  return L.divIcon({
    className: "price-pill-marker",
    html: `
      <div style="
        display: inline-block;
        background: linear-gradient(135deg, #1e3a5f 0%, #0f2744 100%);
        color: white;
        padding: 6px 12px;
        border-radius: 20px;
        font-size: 12px;
        font-weight: 700;
        white-space: nowrap;
        box-shadow: 0 2px 8px rgba(0,0,0,0.25);
        border: 2px solid white;
        cursor: pointer;
      ">${priceText}</div>
    `,
    iconSize: [80, 28],
    iconAnchor: [40, 14],
    popupAnchor: [0, -14],
  });
};

function popupHtml(project: Project) {
  const img = project.featured_image
    ? `<img src="${project.featured_image}" alt="${project.name}" style="width:100%;height:128px;object-fit:cover;border-radius:12px;margin-bottom:10px;" />`
    : "";

  const price = project.starting_price
    ? `<div style="margin-top:6px;font-weight:600;">From ${formatPrice(project.starting_price)}</div>`
    : "";

  const statusLabel = getStatusLabel(project.status);

  return `
    <div style="padding:4px;max-width:260px;">
      ${img}
      <div style="display:flex;justify-content:space-between;gap:10px;align-items:flex-start;">
        <div style="font-weight:700;line-height:1.2;">${project.name}</div>
        <div style="font-size:11px;opacity:.7;white-space:nowrap;">${statusLabel}</div>
      </div>
      <div style="margin-top:6px;font-size:12px;opacity:.75;">${project.neighborhood}, ${project.city}</div>
      ${price}
      <a href="/presale-projects/${project.slug}" style="display:block;margin-top:10px;text-align:center;background:#1e3a5f;color:#fff;text-decoration:none;padding:8px 10px;border-radius:10px;font-size:12px;font-weight:700;">View Project</a>
    </div>
  `;
}

export function ProjectsMap({ projects, isLoading }: ProjectsMapProps) {
  const { toast } = useToast();
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);
  const userCircleRef = useRef<L.Circle | null>(null);
  const [isLocating, setIsLocating] = useState(false);

  const mappedProjects = useMemo(() => {
    return projects.map((p) => {
      if (p.map_lat && p.map_lng) return { ...p, lat: p.map_lat, lng: p.map_lng };
      const center = CITY_CENTERS[p.city] || DEFAULT_CENTER;
      const offset = (Math.random() - 0.5) * 0.02;
      return { ...p, lat: center[0] + offset, lng: center[1] + offset };
    });
  }, [projects]);

  useEffect(() => {
    if (!containerRef.current) return;

    if (!mapRef.current) {
      const map = L.map(containerRef.current, {
        center: DEFAULT_CENTER,
        zoom: DEFAULT_ZOOM,
        zoomControl: true,
      });

      L.tileLayer(TILE_URL, {
        attribution: TILE_ATTRIBUTION,
        maxZoom: 19,
      }).addTo(map);

      markersLayerRef.current = L.layerGroup().addTo(map);
      mapRef.current = map;

      setTimeout(() => map.invalidateSize(), 0);
    }

    const map = mapRef.current;
    const layer = markersLayerRef.current;
    if (!map || !layer) return;

    layer.clearLayers();

    mappedProjects.forEach((p) => {
      const marker = L.marker([p.lat, p.lng], { icon: createPricePillIcon(p) });
      marker.bindPopup(popupHtml(p), { maxWidth: 300 });
      marker.addTo(layer);
    });

    if (mappedProjects.length > 0) {
      const bounds = L.latLngBounds(mappedProjects.map((p) => [p.lat, p.lng] as [number, number]));
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 14 });
    }
  }, [mappedProjects]);

  useEffect(() => {
    return () => {
      mapRef.current?.remove();
      mapRef.current = null;
      markersLayerRef.current = null;
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

      <Button
        variant="outline"
        size="icon"
        className="absolute top-4 right-4 z-[1000] bg-background/95 backdrop-blur-sm shadow-lg h-10 w-10"
        onClick={handleLocate}
        disabled={isLocating}
        title="Zoom to my location"
      >
        {isLocating ? <Loader2 className="h-5 w-5 animate-spin" /> : <Navigation className="h-5 w-5" />}
      </Button>
    </div>
  );
}
