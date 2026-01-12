import { useEffect, useRef, useCallback, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { School, ShoppingBag, Train, TreePine, Stethoscope, ExternalLink, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

const TILE_URL = "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png";
const TILE_ATTRIBUTION = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>';

interface ResaleListingMiniMapProps {
  latitude: number;
  longitude: number;
  address: string;
  price: string;
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
  { key: "schools", label: "Schools", icon: School, color: "#3B82F6" },
  { key: "transit", label: "Transit", icon: Train, color: "#8B5CF6" },
  { key: "parks", label: "Parks", icon: TreePine, color: "#22C55E" },
  { key: "grocery", label: "Shops", icon: ShoppingBag, color: "#10B981" },
  { key: "healthcare", label: "Health", icon: Stethoscope, color: "#EF4444" },
];

// Build Overpass query for nearby amenities
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

export function ResaleListingMiniMap({ 
  latitude, 
  longitude, 
  address,
  price
}: ResaleListingMiniMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);
  
  const [nearbyPlaces, setNearbyPlaces] = useState<NearbyPlace[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  // Show schools, transit, parks by default
  const [activeCategories, setActiveCategories] = useState<Set<string>>(new Set(["schools", "transit", "parks"]));
  const [placesLoaded, setPlacesLoaded] = useState(false);

  // Fetch nearby places from Overpass API
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

  // Initialize map
  const initializeMap = useCallback(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    const map = L.map(mapContainerRef.current, {
      center: [latitude, longitude],
      zoom: 15,
      zoomControl: false,
      attributionControl: false,
      scrollWheelZoom: true,
      dragging: true,
      touchZoom: true,
    });

    L.tileLayer(TILE_URL, { 
      attribution: TILE_ATTRIBUTION, 
      maxZoom: 19 
    }).addTo(map);

    // Create markers layer group
    const markersLayer = L.layerGroup().addTo(map);
    markersLayerRef.current = markersLayer;

    // Property marker with custom icon
    const propertyIcon = L.divIcon({
      html: `
        <div class="property-marker-pin">
          <div class="property-marker-inner">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
              <polyline points="9 22 9 12 15 12 15 22"></polyline>
            </svg>
          </div>
        </div>
      `,
      className: "property-marker-icon",
      iconSize: [36, 44],
      iconAnchor: [18, 44],
    });

    L.marker([latitude, longitude], { icon: propertyIcon, zIndexOffset: 1000 }).addTo(map);
    
    mapRef.current = map;

    // Fetch nearby places when map initializes
    fetchNearbyPlaces();

    return () => {
      map.remove();
      mapRef.current = null;
      markersLayerRef.current = null;
    };
  }, [latitude, longitude, fetchNearbyPlaces]);

  // Update amenity markers when categories or places change
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
          iconSize: [20, 20],
          iconAnchor: [10, 10],
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
    window.open(
      `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`,
      "_blank"
    );
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-lg md:text-xl font-bold text-foreground">Location & Nearby</h2>
        <Button
          variant="ghost"
          size="sm"
          className="h-7 px-2 text-xs gap-1 text-primary hover:text-primary"
          onClick={handleOpenFullMap}
        >
          <ExternalLink className="h-3 w-3" />
          Open Maps
        </Button>
      </div>

      {/* Map Container */}
      <div className="relative rounded-xl overflow-hidden border border-border bg-muted">
        <style>{`
          .property-marker-icon {
            background: transparent !important;
            border: none !important;
          }
          .property-marker-pin {
            position: relative;
            width: 36px;
            height: 44px;
          }
          .property-marker-inner {
            position: absolute;
            top: 0;
            left: 50%;
            width: 32px;
            height: 32px;
            background: linear-gradient(135deg, hsl(var(--primary)) 0%, hsl(var(--primary)/0.8) 100%);
            border-radius: 50% 50% 50% 0;
            transform: translateX(-50%) rotate(-45deg);
            display: flex;
            align-items: center;
            justify-content: center;
            box-shadow: 0 3px 10px rgba(0,0,0,0.25);
          }
          .property-marker-inner svg {
            transform: rotate(45deg);
            color: hsl(var(--primary-foreground));
          }
          .amenity-marker-icon {
            background: transparent !important;
            border: none !important;
          }
          .amenity-marker {
            width: 20px;
            height: 20px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            box-shadow: 0 2px 4px rgba(0,0,0,0.2);
            border: 2px solid white;
          }
          .amenity-marker-dot {
            width: 6px;
            height: 6px;
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
            font-size: 12px;
            font-weight: 600;
            color: #1f2937;
          }
          .amenity-popup-type {
            font-size: 10px;
            color: #6B7280;
          }
        `}</style>

        <div ref={mapContainerRef} className="w-full h-[280px] md:h-[320px]" />
        
        {/* Compact overlay toggles on map */}
        <div className="absolute top-2 left-2 z-[1000] flex flex-wrap gap-1">
          {amenityCategories.map(({ key, icon: Icon, color }) => {
            const isActive = activeCategories.has(key);
            return (
              <button
                key={key}
                onClick={() => toggleCategory(key)}
                className={`
                  w-7 h-7 rounded-full flex items-center justify-center transition-all shadow-sm
                  ${isActive 
                    ? 'text-white shadow-md' 
                    : 'bg-background/90 text-muted-foreground hover:bg-background border border-border/50'
                  }
                `}
                style={isActive ? { backgroundColor: color } : undefined}
                title={key.charAt(0).toUpperCase() + key.slice(1)}
              >
                <Icon className="h-3.5 w-3.5" />
              </button>
            );
          })}
          {isLoading && (
            <div className="w-7 h-7 rounded-full bg-background/90 flex items-center justify-center">
              <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default ResaleListingMiniMap;