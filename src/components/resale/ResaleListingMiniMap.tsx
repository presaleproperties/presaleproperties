import { useEffect, useRef, useCallback, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { School, ShoppingBag, Train, TreePine, Stethoscope, ExternalLink, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

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
  { 
    key: "schools", 
    label: "Schools", 
    icon: School, 
    color: "#3B82F6",
    osmTags: '["amenity"~"school|kindergarten|college|university"]'
  },
  { 
    key: "grocery", 
    label: "Grocery", 
    icon: ShoppingBag, 
    color: "#10B981",
    osmTags: '["shop"~"supermarket|grocery|convenience"]'
  },
  { 
    key: "transit", 
    label: "Transit", 
    icon: Train, 
    color: "#8B5CF6",
    osmTags: '["public_transport"~"station|stop_position"]["railway"~"station|halt|tram_stop"]["highway"="bus_stop"]'
  },
  { 
    key: "parks", 
    label: "Parks", 
    icon: TreePine, 
    color: "#22C55E",
    osmTags: '["leisure"~"park|playground|garden"]'
  },
  { 
    key: "healthcare", 
    label: "Healthcare", 
    icon: Stethoscope, 
    color: "#EF4444",
    osmTags: '["amenity"~"hospital|clinic|doctors|pharmacy"]'
  },
];

// Build Overpass query for nearby amenities
function buildOverpassQuery(lat: number, lon: number, radiusMeters: number = 1000): string {
  const bbox = `(around:${radiusMeters},${lat},${lon})`;
  
  const queries = [
    // Schools
    `node["amenity"~"school|kindergarten"]${bbox};`,
    `way["amenity"~"school|kindergarten"]${bbox};`,
    // Grocery/Supermarkets
    `node["shop"~"supermarket|grocery|convenience"]${bbox};`,
    // Transit
    `node["public_transport"="station"]${bbox};`,
    `node["railway"~"station|halt|tram_stop"]${bbox};`,
    `node["highway"="bus_stop"]${bbox};`,
    // Parks
    `node["leisure"~"park|playground"]${bbox};`,
    `way["leisure"~"park|playground"]${bbox};`,
    // Healthcare
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
      scrollWheelZoom: false,
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
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
              <polyline points="9 22 9 12 15 12 15 22"></polyline>
            </svg>
          </div>
          <div class="property-marker-pulse"></div>
        </div>
      `,
      className: "property-marker-icon",
      iconSize: [48, 48],
      iconAnchor: [24, 48],
    });

    const marker = L.marker([latitude, longitude], { icon: propertyIcon, zIndexOffset: 1000 });
    
    const popupContent = `
      <div class="mini-map-popup">
        <div class="mini-map-popup-price">${price}</div>
        <div class="mini-map-popup-address">${address}</div>
      </div>
    `;
    marker.bindPopup(popupContent, { 
      closeButton: false, 
      className: "mini-map-popup-container",
      offset: [0, -40]
    });
    
    marker.addTo(map);
    marker.openPopup();

    mapRef.current = map;

    // Fetch nearby places when map initializes
    fetchNearbyPlaces();

    return () => {
      map.remove();
      mapRef.current = null;
      markersLayerRef.current = null;
    };
  }, [latitude, longitude, address, price, fetchNearbyPlaces]);

  // Update amenity markers when categories or places change
  useEffect(() => {
    const markersLayer = markersLayerRef.current;
    if (!markersLayer) return;

    // Clear existing markers
    markersLayer.clearLayers();

    // Add markers for active categories
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
          iconSize: [24, 24],
          iconAnchor: [12, 12],
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

  // Count places by category
  const categoryCounts = nearbyPlaces.reduce((acc, place) => {
    acc[place.category] = (acc[place.category] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl md:text-2xl font-bold text-foreground">Location & Nearby</h2>
        <Button
          variant="outline"
          size="sm"
          className="h-8 px-3 text-xs rounded-full gap-1.5"
          onClick={handleOpenFullMap}
        >
          <ExternalLink className="h-3.5 w-3.5" />
          Open in Maps
        </Button>
      </div>

      {/* Category Toggles */}
      <div className="flex flex-wrap gap-2">
        {amenityCategories.map(({ key, label, icon: Icon, color }) => {
          const isActive = activeCategories.has(key);
          const count = categoryCounts[key] || 0;
          
          return (
            <button
              key={key}
              onClick={() => toggleCategory(key)}
              className={`
                flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all
                ${isActive 
                  ? 'text-white shadow-sm' 
                  : 'bg-muted text-muted-foreground hover:bg-muted/80'
                }
              `}
              style={isActive ? { backgroundColor: color } : undefined}
            >
              <Icon className="h-3.5 w-3.5" />
              {label}
              {count > 0 && (
                <Badge 
                  variant="secondary" 
                  className={`h-4 min-w-4 px-1 text-[10px] ${isActive ? 'bg-white/20 text-white' : ''}`}
                >
                  {count}
                </Badge>
              )}
            </button>
          );
        })}
        {isLoading && (
          <div className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-muted-foreground">
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
            Loading...
          </div>
        )}
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
            width: 48px;
            height: 48px;
          }
          .property-marker-inner {
            position: absolute;
            top: 0;
            left: 50%;
            transform: translateX(-50%);
            width: 40px;
            height: 40px;
            background: linear-gradient(135deg, hsl(var(--primary)) 0%, hsl(var(--primary)/0.8) 100%);
            border-radius: 50% 50% 50% 0;
            transform: translateX(-50%) rotate(-45deg);
            display: flex;
            align-items: center;
            justify-content: center;
            box-shadow: 0 4px 12px rgba(0,0,0,0.25);
          }
          .property-marker-inner svg {
            transform: rotate(45deg);
            color: hsl(var(--primary-foreground));
          }
          .property-marker-pulse {
            position: absolute;
            bottom: 0;
            left: 50%;
            transform: translateX(-50%);
            width: 12px;
            height: 12px;
            background: hsl(var(--primary)/0.3);
            border-radius: 50%;
            animation: pulse 2s ease-out infinite;
          }
          @keyframes pulse {
            0% {
              transform: translateX(-50%) scale(1);
              opacity: 1;
            }
            100% {
              transform: translateX(-50%) scale(3);
              opacity: 0;
            }
          }
          .amenity-marker-icon {
            background: transparent !important;
            border: none !important;
          }
          .amenity-marker {
            width: 24px;
            height: 24px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            box-shadow: 0 2px 6px rgba(0,0,0,0.25);
            border: 2px solid white;
          }
          .amenity-marker-dot {
            width: 8px;
            height: 8px;
            background: white;
            border-radius: 50%;
          }
          .amenity-popup-container .leaflet-popup-content-wrapper {
            border-radius: 8px;
            padding: 0;
            overflow: hidden;
            box-shadow: 0 2px 8px rgba(0,0,0,0.15);
          }
          .amenity-popup-container .leaflet-popup-content {
            margin: 0;
          }
          .amenity-popup-container .leaflet-popup-tip {
            background: white;
          }
          .amenity-popup {
            padding: 8px 12px;
          }
          .amenity-popup-name {
            font-size: 13px;
            font-weight: 600;
            color: #1f2937;
          }
          .amenity-popup-type {
            font-size: 11px;
            color: #6B7280;
          }
          .mini-map-popup-container .leaflet-popup-content-wrapper {
            border-radius: 10px;
            padding: 0;
            overflow: hidden;
            box-shadow: 0 4px 16px rgba(0,0,0,0.15);
          }
          .mini-map-popup-container .leaflet-popup-content {
            margin: 0;
          }
          .mini-map-popup-container .leaflet-popup-tip {
            display: none;
          }
          .mini-map-popup {
            padding: 10px 14px;
            text-align: center;
          }
          .mini-map-popup-price {
            font-size: 16px;
            font-weight: 700;
            color: hsl(var(--primary));
          }
          .mini-map-popup-address {
            font-size: 12px;
            color: #6B7280;
            max-width: 180px;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
          }
        `}</style>

        <div ref={mapContainerRef} className="w-full h-[320px] md:h-[380px]" />
        
        {/* Legend */}
        {nearbyPlaces.length > 0 && (
          <div className="absolute bottom-3 left-3 bg-background/95 backdrop-blur-sm rounded-lg px-3 py-2 shadow-md border text-xs">
            <span className="text-muted-foreground">
              {nearbyPlaces.filter(p => activeCategories.has(p.category)).length} places nearby
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

export default ResaleListingMiniMap;