import { useEffect, useRef, useCallback, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { ExternalLink, School, Train, TreePine, ShoppingBag, Stethoscope, Loader2, Map } from "lucide-react";
import { Button } from "@/components/ui/button";

const TILE_URL = "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png";
const TILE_ATTRIBUTION = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>';

interface ProjectLocationMiniMapProps {
  latitude: number;
  longitude: number;
  projectName: string;
  address?: string | null;
}

interface NearbyPlace {
  id: number;
  name: string;
  lat: number;
  lon: number;
  type: string;
  category: string;
}

const amenityCategories = [
  { key: "schools", label: "Schools", icon: School, color: "#64748B" },
  { key: "transit", label: "Transit", icon: Train, color: "#64748B" },
  { key: "parks", label: "Parks", icon: TreePine, color: "#64748B" },
  { key: "grocery", label: "Shops", icon: ShoppingBag, color: "#64748B" },
  { key: "healthcare", label: "Health", icon: Stethoscope, color: "#64748B" },
];

function buildOverpassQuery(lat: number, lon: number, radiusMeters: number = 1000): string {
  const bbox = `(around:${radiusMeters},${lat},${lon})`;
  
  const queries = [
    `node["amenity"~"school|kindergarten"]${bbox};`,
    `way["amenity"~"school|kindergarten"]${bbox};`,
    `node["shop"~"supermarket|grocery|convenience"]${bbox};`,
    `node["public_transport"="station"]${bbox};`,
    `node["railway"~"station|halt|tram_stop"]${bbox};`,
    `node["highway"="bus_stop"]${bbox};`,
    `node["leisure"~"park|playground"]${bbox};`,
    `way["leisure"~"park|playground"]${bbox};`,
    `node["amenity"~"hospital|clinic|doctors|pharmacy"]${bbox};`,
  ];

  return `[out:json][timeout:10];(${queries.join('')});out center 50;`;
}

function categorizePlace(tags: Record<string, string>): { category: string; type: string } {
  if (tags.amenity === "school" || tags.amenity === "kindergarten") {
    return { category: "schools", type: tags.amenity };
  }
  if (tags.shop === "supermarket" || tags.shop === "grocery" || tags.shop === "convenience") {
    return { category: "grocery", type: tags.shop };
  }
  if (tags.public_transport || tags.railway || tags.highway === "bus_stop") {
    return { category: "transit", type: tags.railway || tags.public_transport || "bus_stop" };
  }
  if (tags.leisure === "park" || tags.leisure === "playground" || tags.leisure === "garden") {
    return { category: "parks", type: tags.leisure };
  }
  if (tags.amenity === "hospital" || tags.amenity === "clinic" || tags.amenity === "doctors" || tags.amenity === "pharmacy") {
    return { category: "healthcare", type: tags.amenity };
  }
  return { category: "other", type: "unknown" };
}

export function ProjectLocationMiniMap({ 
  latitude, 
  longitude, 
  projectName,
  address
}: ProjectLocationMiniMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);
  
  const [nearbyPlaces, setNearbyPlaces] = useState<NearbyPlace[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [activeCategories, setActiveCategories] = useState<Set<string>>(new Set(["schools", "transit", "parks"]));
  const [placesLoaded, setPlacesLoaded] = useState(false);

  const fetchNearbyPlaces = useCallback(async () => {
    if (placesLoaded) return;
    
    setIsLoading(true);
    try {
      const query = buildOverpassQuery(latitude, longitude, 1000);
      const response = await fetch("https://overpass-api.de/api/interpreter", {
        method: "POST",
        body: query,
      });
      
      if (!response.ok) throw new Error("Failed to fetch nearby places");
      
      const data = await response.json();
      
      const places: NearbyPlace[] = data.elements
        .filter((el: any) => el.tags?.name)
        .map((el: any) => {
          const { category, type } = categorizePlace(el.tags || {});
          return {
            id: el.id,
            name: el.tags.name,
            lat: el.lat || el.center?.lat,
            lon: el.lon || el.center?.lon,
            type,
            category,
          };
        })
        .filter((p: NearbyPlace) => p.lat && p.lon && p.category !== "other");
      
      setNearbyPlaces(places);
      setPlacesLoaded(true);
    } catch (error) {
      console.error("Error fetching nearby places:", error);
    } finally {
      setIsLoading(false);
    }
  }, [latitude, longitude, placesLoaded]);

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

    const markersLayer = L.layerGroup().addTo(map);
    markersLayerRef.current = markersLayer;

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
    
    marker.bindPopup(`
      <div class="project-popup">
        <div class="project-popup-name">${projectName}</div>
        ${address ? `<div class="project-popup-address">${address}</div>` : ''}
      </div>
    `, { closeButton: false, className: "project-popup-container" });
    
    mapRef.current = map;
    fetchNearbyPlaces();

    return () => {
      map.remove();
      mapRef.current = null;
      markersLayerRef.current = null;
    };
  }, [latitude, longitude, projectName, address, fetchNearbyPlaces]);

  useEffect(() => {
    const markersLayer = markersLayerRef.current;
    if (!markersLayer) return;

    markersLayer.clearLayers();

    nearbyPlaces
      .filter(place => activeCategories.has(place.category))
      .forEach(place => {
        const categoryConfig = amenityCategories.find(c => c.key === place.category);
        if (!categoryConfig) return;

        const icon = L.divIcon({
          html: `
            <div class="amenity-marker" style="background-color: ${categoryConfig.color};">
              <span class="amenity-marker-dot"></span>
            </div>
          `,
          className: "amenity-marker-icon",
          iconSize: [12, 12],
          iconAnchor: [6, 6],
        });

        const marker = L.marker([place.lat, place.lon], { icon });
        marker.bindPopup(`
          <div class="amenity-popup">
            <div class="amenity-popup-name">${place.name}</div>
            <div class="amenity-popup-type">${categoryConfig.label}</div>
          </div>
        `, { closeButton: false, className: "amenity-popup-container" });
        
        markersLayer.addLayer(marker);
      });
  }, [nearbyPlaces, activeCategories]);

  useEffect(() => {
    const cleanup = initializeMap();
    return cleanup;
  }, [initializeMap]);

  const toggleCategory = (categoryKey: string) => {
    setActiveCategories(prev => {
      const next = new Set(prev);
      if (next.has(categoryKey)) {
        next.delete(categoryKey);
      } else {
        next.add(categoryKey);
      }
      return next;
    });
  };

  const handleOpenFullMap = () => {
    window.location.href = `/map-search?lat=${latitude}&lng=${longitude}&zoom=16&project=${encodeURIComponent(projectName)}`;
  };

  return (
    <div className="bg-muted/30 rounded-xl sm:rounded-2xl p-4 sm:p-5 md:p-6 overflow-hidden">
      <div className="flex items-center justify-between gap-2 mb-3">
        <h2 className="text-base sm:text-lg font-bold text-foreground">Project Location</h2>
        <Button
          variant="ghost"
          size="sm"
          className="h-8 px-3 text-xs gap-1.5 text-primary hover:text-primary shrink-0"
          onClick={handleOpenFullMap}
        >
          <Map className="h-3.5 w-3.5" />
          View Full Map
        </Button>
      </div>

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
          .amenity-marker-icon {
            background: transparent !important;
            border: none !important;
          }
          .amenity-marker {
            width: 12px;
            height: 12px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            box-shadow: 0 1px 3px rgba(0,0,0,0.15);
            border: 1.5px solid white;
          }
          .amenity-marker-dot {
            width: 4px;
            height: 4px;
            background: white;
            border-radius: 50%;
          }
          .amenity-popup-container .leaflet-popup-content-wrapper {
            border-radius: 6px;
            padding: 0;
            box-shadow: 0 2px 6px rgba(0,0,0,0.15);
          }
          .amenity-popup-container .leaflet-popup-content {
            margin: 0;
          }
          .amenity-popup-container .leaflet-popup-tip {
            background: white;
          }
          .amenity-popup {
            padding: 6px 10px;
          }
          .amenity-popup-name {
            font-size: 11px;
            font-weight: 500;
            color: #1f2937;
          }
          .amenity-popup-type {
            font-size: 9px;
            color: #6B7280;
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

        <div ref={mapContainerRef} className="w-full h-[280px] sm:h-[320px] md:h-[380px]" />
        
        {/* Amenity filter pills */}
        <div className="absolute bottom-2 left-2 right-2 z-[1000] flex justify-center gap-1">
          {amenityCategories.map(({ key, icon: Icon }) => {
            const isActive = activeCategories.has(key);
            return (
              <button
                key={key}
                onClick={() => toggleCategory(key)}
                className={`
                  w-7 h-7 rounded-full flex items-center justify-center transition-all
                  ${isActive 
                    ? 'bg-foreground text-background shadow-sm' 
                    : 'bg-background/80 text-muted-foreground hover:bg-background border border-border/30'
                  }
                `}
                title={key.charAt(0).toUpperCase() + key.slice(1)}
              >
                <Icon className="h-3.5 w-3.5" />
              </button>
            );
          })}
          {isLoading && (
            <div className="w-7 h-7 rounded-full bg-background/80 flex items-center justify-center">
              <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default ProjectLocationMiniMap;
