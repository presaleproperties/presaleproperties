import { useEffect, useMemo, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import { MapContainer, TileLayer, Marker, Popup, useMap, Circle } from "react-leaflet";
import MarkerClusterGroup from "react-leaflet-cluster";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Building2, MapPin, ExternalLink, Navigation, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

// Fix Leaflet default marker icon issue
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
});

// Custom cluster icon
const createClusterCustomIcon = (cluster: any) => {
  const count = cluster.getChildCount();
  let size = "small";
  let diameter = 36;
  
  if (count >= 10) {
    size = "medium";
    diameter = 44;
  }
  if (count >= 25) {
    size = "large";
    diameter = 52;
  }
  
  return L.divIcon({
    html: `<div class="cluster-icon cluster-${size}">
      <span>${count}</span>
    </div>`,
    className: "custom-cluster-marker",
    iconSize: L.point(diameter, diameter, true),
  });
};

// Custom marker icon based on status
const createCustomIcon = (status: string) => {
  const colors: Record<string, string> = {
    active: "#22c55e",
    registering: "#a855f7",
    coming_soon: "#3b82f6",
    sold_out: "#6b7280",
  };
  const color = colors[status] || "#3b82f6";
  
  return L.divIcon({
    className: "custom-marker",
    html: `
      <div style="
        background-color: ${color};
        width: 32px;
        height: 32px;
        border-radius: 50% 50% 50% 0;
        transform: rotate(-45deg);
        border: 3px solid white;
        box-shadow: 0 2px 8px rgba(0,0,0,0.3);
        display: flex;
        align-items: center;
        justify-content: center;
      ">
        <div style="
          transform: rotate(45deg);
          color: white;
          font-size: 14px;
          font-weight: bold;
        ">●</div>
      </div>
    `,
    iconSize: [32, 32],
    iconAnchor: [16, 32],
    popupAnchor: [0, -32],
  });
};

// City center coordinates for fallback positioning
const CITY_CENTERS: Record<string, [number, number]> = {
  "Vancouver": [49.2827, -123.1207],
  "Burnaby": [49.2488, -122.9805],
  "Richmond": [49.1666, -123.1336],
  "Surrey": [49.1913, -122.8490],
  "Coquitlam": [49.2838, -122.7932],
  "Port Coquitlam": [49.2625, -122.7811],
  "Port Moody": [49.2845, -122.8570],
  "North Vancouver": [49.3165, -123.0688],
  "West Vancouver": [49.3270, -123.1660],
  "Langley": [49.1044, -122.6581],
  "Delta": [49.0847, -123.0587],
  "Abbotsford": [49.0504, -122.3045],
  "New Westminster": [49.2057, -122.9110],
  "White Rock": [49.0253, -122.8029],
  "Maple Ridge": [49.2193, -122.5984],
  "Chilliwack": [49.1579, -121.9514],
};

// Default center (Metro Vancouver)
const DEFAULT_CENTER: [number, number] = [49.2500, -122.9000];
const DEFAULT_ZOOM = 10;

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
  if (price >= 1000000) {
    return `$${(price / 1000000).toFixed(1)}M`;
  }
  return `$${(price / 1000).toFixed(0)}K`;
};

const getStatusLabel = (status: string) => {
  switch (status) {
    case "active": return "Selling Now";
    case "registering": return "Registering";
    case "coming_soon": return "Coming Soon";
    case "sold_out": return "Sold Out";
    default: return null;
  }
};

const getStatusColor = (status: string) => {
  switch (status) {
    case "active": return "bg-green-500";
    case "registering": return "bg-purple-500";
    case "coming_soon": return "bg-blue-500";
    case "sold_out": return "bg-gray-500";
    default: return "bg-blue-500";
  }
};

// Component to fit bounds when projects change
function FitBoundsControl({ projects }: { projects: Project[] }) {
  const map = useMap();
  
  useEffect(() => {
    if (projects.length === 0) return;
    
    const validProjects = projects.filter(p => p.map_lat && p.map_lng);
    
    if (validProjects.length === 0) {
      // If no geocoded projects, use city centers
      const cityCoords = projects
        .map(p => CITY_CENTERS[p.city])
        .filter(Boolean);
      
      if (cityCoords.length > 0) {
        const bounds = L.latLngBounds(cityCoords.map(c => L.latLng(c[0], c[1])));
        map.fitBounds(bounds, { padding: [50, 50], maxZoom: 12 });
      }
      return;
    }
    
    const bounds = L.latLngBounds(
      validProjects.map(p => L.latLng(p.map_lat!, p.map_lng!))
    );
    map.fitBounds(bounds, { padding: [50, 50], maxZoom: 14 });
  }, [projects, map]);
  
  return null;
}

// Geolocation control component
function GeolocationControl({ 
  onLocationFound 
}: { 
  onLocationFound: (lat: number, lng: number) => void 
}) {
  const map = useMap();
  const { toast } = useToast();
  const [isLocating, setIsLocating] = useState(false);

  const handleLocate = useCallback(() => {
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
      (position) => {
        const { latitude, longitude } = position.coords;
        map.setView([latitude, longitude], 13, { animate: true });
        onLocationFound(latitude, longitude);
        setIsLocating(false);
        toast({
          title: "Location found",
          description: "Map centered on your location",
        });
      },
      (error) => {
        setIsLocating(false);
        let message = "Unable to get your location.";
        if (error.code === error.PERMISSION_DENIED) {
          message = "Location permission denied. Please enable location access.";
        } else if (error.code === error.POSITION_UNAVAILABLE) {
          message = "Location information unavailable.";
        } else if (error.code === error.TIMEOUT) {
          message = "Location request timed out.";
        }
        toast({
          title: "Location error",
          description: message,
          variant: "destructive",
        });
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  }, [map, onLocationFound, toast]);

  return (
    <Button
      variant="outline"
      size="icon"
      className="absolute top-4 right-4 z-[1000] bg-background/95 backdrop-blur-sm shadow-lg h-10 w-10"
      onClick={handleLocate}
      disabled={isLocating}
      title="Zoom to my location"
    >
      {isLocating ? (
        <Loader2 className="h-5 w-5 animate-spin" />
      ) : (
        <Navigation className="h-5 w-5" />
      )}
    </Button>
  );
}

export function ProjectsMap({ projects, isLoading }: ProjectsMapProps) {
  const [selectedProject, setSelectedProject] = useState<string | null>(null);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  
  // Get projects with coordinates (use city center as fallback)
  const mappedProjects = useMemo(() => {
    return projects.map(project => {
      if (project.map_lat && project.map_lng) {
        return { ...project, lat: project.map_lat, lng: project.map_lng };
      }
      // Fallback to city center with small offset to prevent stacking
      const cityCenter = CITY_CENTERS[project.city] || DEFAULT_CENTER;
      const offset = (Math.random() - 0.5) * 0.02; // Small random offset
      return {
        ...project,
        lat: cityCenter[0] + offset,
        lng: cityCenter[1] + offset,
      };
    });
  }, [projects]);
  
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
    <div className="h-[500px] lg:h-[600px] rounded-xl overflow-hidden border border-border">
      <MapContainer
        center={DEFAULT_CENTER}
        zoom={DEFAULT_ZOOM}
        className="h-full w-full"
        scrollWheelZoom={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        <FitBoundsControl projects={mappedProjects} />
        <GeolocationControl onLocationFound={(lat, lng) => setUserLocation({ lat, lng })} />
        
        {/* User location circle */}
        {userLocation && (
          <Circle
            center={[userLocation.lat, userLocation.lng]}
            radius={500}
            pathOptions={{
              color: "hsl(43 96% 56%)",
              fillColor: "hsl(43 96% 56%)",
              fillOpacity: 0.15,
              weight: 2,
            }}
          />
        )}
        <MarkerClusterGroup
          chunkedLoading
          iconCreateFunction={createClusterCustomIcon}
          maxClusterRadius={60}
          spiderfyOnMaxZoom={true}
          showCoverageOnHover={false}
          disableClusteringAtZoom={15}
        >
          {mappedProjects.map((project) => (
            <Marker
              key={project.id}
              position={[project.lat, project.lng]}
              icon={createCustomIcon(project.status)}
              eventHandlers={{
                click: () => setSelectedProject(project.id),
              }}
            >
              <Popup maxWidth={280} className="project-popup">
                <div className="p-1">
                  {project.featured_image && (
                    <img
                      src={project.featured_image}
                      alt={project.name}
                      className="w-full h-32 object-cover rounded-md mb-2"
                    />
                  )}
                  <div className="space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="font-semibold text-sm line-clamp-1">{project.name}</h3>
                      <Badge className={`${getStatusColor(project.status)} text-[10px] px-1.5 py-0.5 shrink-0`}>
                        {getStatusLabel(project.status)}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      {project.neighborhood}, {project.city}
                    </p>
                    {project.starting_price && (
                      <p className="text-sm font-medium">
                        From {formatPrice(project.starting_price)}
                      </p>
                    )}
                    <Link to={`/presale-projects/${project.slug}`}>
                      <Button size="sm" className="w-full mt-2 text-xs h-8">
                        View Project
                        <ExternalLink className="h-3 w-3 ml-1" />
                      </Button>
                    </Link>
                  </div>
                </div>
              </Popup>
            </Marker>
          ))}
        </MarkerClusterGroup>
      </MapContainer>
      
      {/* Legend */}
      <div className="absolute bottom-4 left-4 z-[1000] bg-background/95 backdrop-blur-sm rounded-lg p-3 border shadow-lg">
        <p className="text-xs font-medium mb-2">Project Status</p>
        <div className="space-y-1.5">
          {[
            { status: "active", label: "Selling Now" },
            { status: "registering", label: "Registering" },
            { status: "coming_soon", label: "Coming Soon" },
            { status: "sold_out", label: "Sold Out" },
          ].map(({ status, label }) => (
            <div key={status} className="flex items-center gap-2 text-xs">
              <span className={`w-3 h-3 rounded-full ${getStatusColor(status)}`} />
              <span>{label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
