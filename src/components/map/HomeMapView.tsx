import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import MarkerClusterGroup from "react-leaflet-cluster";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MapPin, ExternalLink, Building2, RotateCcw } from "lucide-react";
import { createPriceMarker, createClusterIcon } from "./PriceMarker";

// Fix Leaflet default marker icon issue
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
});

const DEFAULT_CENTER: [number, number] = [49.2500, -122.9000];
const DEFAULT_ZOOM = 10;

interface Project {
  id: string;
  name: string;
  slug: string;
  city: string;
  neighborhood: string;
  status: string;
  project_type: string;
  starting_price: number | null;
  featured_image: string | null;
  map_lat: number | null;
  map_lng: number | null;
}

interface HomeMapViewProps {
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

// Component to fit bounds
function FitBoundsControl({ projects }: { projects: Project[] }) {
  const map = useMap();
  
  useEffect(() => {
    if (!map || projects.length === 0) return;
    
    const validProjects = projects.filter(p => p.map_lat && p.map_lng);
    if (validProjects.length === 0) return;
    
    const bounds = L.latLngBounds(
      validProjects.map(p => L.latLng(p.map_lat!, p.map_lng!))
    );
    map.fitBounds(bounds, { padding: [50, 50], maxZoom: 12 });
  }, [projects, map]);
  
  return null;
}

// Reset map button
function ResetMapButton() {
  const map = useMap();
  
  const handleReset = () => {
    map.setView(DEFAULT_CENTER, DEFAULT_ZOOM);
  };
  
  return (
    <button
      onClick={handleReset}
      className="absolute top-3 right-3 z-[1000] bg-background/95 backdrop-blur-sm rounded-lg p-2 border shadow-md hover:bg-muted transition-colors"
      title="Reset map view"
    >
      <RotateCcw className="h-4 w-4" />
    </button>
  );
}

export function HomeMapView({ projects, isLoading }: HomeMapViewProps) {
  const [isMounted, setIsMounted] = useState(false);
  
  useEffect(() => {
    setIsMounted(true);
  }, []);

  const validProjects = useMemo(() => {
    return projects.filter(p => p.map_lat && p.map_lng);
  }, [projects]);

  if (isLoading || !isMounted) {
    return (
      <div className="h-full flex items-center justify-center bg-muted">
        <div className="text-center text-muted-foreground">
          <MapPin className="h-10 w-10 mx-auto mb-2 animate-pulse" />
          <p>Loading map...</p>
        </div>
      </div>
    );
  }

  if (validProjects.length === 0) {
    return (
      <div className="h-full flex items-center justify-center bg-muted">
        <div className="text-center text-muted-foreground">
          <Building2 className="h-10 w-10 mx-auto mb-2" />
          <p>No projects with map locations</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full w-full relative">
      <MapContainer
        center={DEFAULT_CENTER}
        zoom={DEFAULT_ZOOM}
        className="h-full w-full"
        scrollWheelZoom={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        <FitBoundsControl projects={validProjects} />
        <ResetMapButton />
        
        <MarkerClusterGroup
          chunkedLoading
          iconCreateFunction={(cluster) => createClusterIcon(cluster.getChildCount())}
          maxClusterRadius={60}
          spiderfyOnMaxZoom={true}
          showCoverageOnHover={false}
        >
          {validProjects.map((project) => (
            <Marker
              key={project.id}
              position={[project.map_lat!, project.map_lng!]}
              icon={createPriceMarker(project.starting_price, project.status)}
            >
              <Popup maxWidth={280}>
                <div className="p-1">
                  {project.featured_image ? (
                    <img
                      src={project.featured_image}
                      alt={project.name}
                      className="w-full h-28 object-cover rounded-md mb-2"
                    />
                  ) : null}
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
                    {project.starting_price ? (
                      <p className="text-sm font-medium">
                        From {formatPrice(project.starting_price)}
                      </p>
                    ) : null}
                    <p className="text-xs text-muted-foreground capitalize">
                      {project.project_type}
                    </p>
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
      <div className="absolute bottom-3 left-3 z-[1000] bg-background/95 backdrop-blur-sm rounded-lg p-2.5 border shadow-md text-xs">
        <p className="font-medium mb-1.5">Status</p>
        <div className="space-y-1">
          {[
            { status: "active", label: "Selling" },
            { status: "registering", label: "Registering" },
            { status: "coming_soon", label: "Coming" },
          ].map(({ status, label }) => (
            <div key={status} className="flex items-center gap-1.5">
              <span className={`w-2.5 h-2.5 rounded-full ${getStatusColor(status)}`} />
              <span>{label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
