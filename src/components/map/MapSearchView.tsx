import { useEffect, useMemo, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MapPin, ExternalLink, RotateCcw, Locate } from "lucide-react";
import { createPriceMarker } from "./PriceMarker";

// Fix Leaflet default marker icon issue
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
});

const DEFAULT_CENTER: [number, number] = [49.25, -122.9];
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

interface MapSearchViewProps {
  projects: Project[];
  hoveredProjectId: string | null;
  onHoverProject: (id: string | null) => void;
  onBoundsChange?: (bounds: { north: number; south: number; east: number; west: number } | null) => void;
}

const formatPrice = (price: number) => {
  if (price >= 1_000_000) return `$${(price / 1_000_000).toFixed(1)}M`;
  return `$${(price / 1000).toFixed(0)}K`;
};

const getStatusLabel = (status: string) => {
  switch (status) {
    case "active":
      return "Selling Now";
    case "registering":
      return "Registering";
    case "coming_soon":
      return "Coming Soon";
    case "sold_out":
      return "Sold Out";
    default:
      return null;
  }
};

const getStatusColor = (status: string) => {
  switch (status) {
    case "active":
      return "bg-green-500";
    case "registering":
      return "bg-purple-500";
    case "coming_soon":
      return "bg-blue-500";
    case "sold_out":
      return "bg-gray-500";
    default:
      return "bg-blue-500";
  }
};

export function MapSearchView({ projects, hoveredProjectId, onHoverProject, onBoundsChange }: MapSearchViewProps) {
  const [isMounted, setIsMounted] = useState(false);
  const [map, setMap] = useState<L.Map | null>(null);
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);

  const validProjects = useMemo(() => projects.filter((p) => p.map_lat && p.map_lng), [projects]);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Fit bounds when map becomes ready (and when projects set changes)
  useEffect(() => {
    if (!map) return;
    if (validProjects.length === 0) return;

    const bounds = L.latLngBounds(validProjects.map((p) => L.latLng(p.map_lat!, p.map_lng!)));
    map.fitBounds(bounds, { padding: [50, 50], maxZoom: 13 });
  }, [map, validProjects]);

  // Track bounds changes
  useEffect(() => {
    if (!map) return;
    if (!onBoundsChange) return;

    const emit = () => {
      const b = map.getBounds();
      onBoundsChange({
        north: b.getNorth(),
        south: b.getSouth(),
        east: b.getEast(),
        west: b.getWest(),
      });
    };

    map.on("moveend", emit);
    emit();
    return () => {
      map.off("moveend", emit);
    };
  }, [map, onBoundsChange]);

  const handleReset = useCallback(() => {
    map?.setView(DEFAULT_CENTER, DEFAULT_ZOOM);
  }, [map]);

  const handleLocate = useCallback(() => {
    if (!("geolocation" in navigator)) return;

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const loc: [number, number] = [position.coords.latitude, position.coords.longitude];
        setUserLocation(loc);
        map?.setView(loc, Math.max(map.getZoom(), 12));
      },
      (error) => {
        console.warn("Geolocation error:", error);
      }
    );
  }, [map]);

  if (!isMounted) {
    return (
      <div className="h-full flex items-center justify-center bg-muted">
        <MapPin className="h-10 w-10 animate-pulse text-muted-foreground" />
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
        ref={setMap}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {userLocation && (
          <Marker
            position={userLocation}
            icon={L.divIcon({
              className: "user-location-marker",
              html: `<div style="
                width: 16px;
                height: 16px;
                background: #3b82f6;
                border: 3px solid white;
                border-radius: 50%;
                box-shadow: 0 2px 6px rgba(0,0,0,0.3);
              "></div>`,
              iconSize: [16, 16],
              iconAnchor: [8, 8],
            })}
          />
        )}

        {validProjects.map((project) => (
          <Marker
            key={project.id}
            position={[project.map_lat!, project.map_lng!]}
            icon={createPriceMarker(project.starting_price, project.status, hoveredProjectId === project.id)}
            eventHandlers={{
              mouseover: () => onHoverProject(project.id),
              mouseout: () => onHoverProject(null),
            }}
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
                    <p className="text-sm font-medium">From {formatPrice(project.starting_price)}</p>
                  ) : null}

                  <p className="text-xs text-muted-foreground capitalize">{project.project_type}</p>

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
      </MapContainer>

      {/* Controls (outside MapContainer to avoid React-Leaflet context consumer issues) */}
      <div className="absolute top-3 right-3 z-[1000] flex flex-col gap-2">
        <button
          onClick={handleReset}
          className="bg-background/95 backdrop-blur-sm rounded-lg p-2.5 border shadow-md hover:bg-muted transition-colors"
          title="Reset map view"
          type="button"
        >
          <RotateCcw className="h-4 w-4" />
        </button>
        <button
          onClick={handleLocate}
          className="bg-background/95 backdrop-blur-sm rounded-lg p-2.5 border shadow-md hover:bg-muted transition-colors"
          title="Use my location"
          type="button"
        >
          <Locate className="h-4 w-4" />
        </button>
      </div>

      {/* Legend */}
      <div className="absolute bottom-3 left-3 z-[1000] bg-background/95 backdrop-blur-sm rounded-lg p-2.5 border shadow-md text-xs hidden md:block">
        <p className="font-medium mb-1.5">Status</p>
        <div className="space-y-1">
          {[{ status: "active", label: "Selling Now" }, { status: "registering", label: "Registering" }, { status: "coming_soon", label: "Coming Soon" }].map(
            ({ status, label }) => (
              <div key={status} className="flex items-center gap-1.5">
                <span className={`w-2.5 h-2.5 rounded-full ${getStatusColor(status)}`} />
                <span>{label}</span>
              </div>
            )
          )}
        </div>
      </div>
    </div>
  );
}
