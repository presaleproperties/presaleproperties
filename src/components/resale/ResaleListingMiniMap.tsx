import { useEffect, useRef, useCallback } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { MapPin, School, ShoppingBag, Train, UtensilsCrossed, TreePine, Stethoscope, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";

const TILE_URL = "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png";
const TILE_ATTRIBUTION = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>';

interface ResaleListingMiniMapProps {
  latitude: number;
  longitude: number;
  address: string;
  price: string;
}

const amenityCategories = [
  { key: "school", label: "Schools", icon: School, color: "#3B82F6" },
  { key: "supermarket", label: "Grocery", icon: ShoppingBag, color: "#10B981" },
  { key: "transit", label: "Transit", icon: Train, color: "#8B5CF6" },
  { key: "restaurant", label: "Dining", icon: UtensilsCrossed, color: "#F59E0B" },
  { key: "park", label: "Parks", icon: TreePine, color: "#22C55E" },
  { key: "hospital", label: "Healthcare", icon: Stethoscope, color: "#EF4444" },
];

export function ResaleListingMiniMap({ 
  latitude, 
  longitude, 
  address,
  price
}: ResaleListingMiniMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);

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

    const marker = L.marker([latitude, longitude], { icon: propertyIcon });
    
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

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, [latitude, longitude, address, price]);

  useEffect(() => {
    const cleanup = initializeMap();
    return cleanup;
  }, [initializeMap]);

  const handleOpenFullMap = () => {
    window.open(
      `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`,
      "_blank"
    );
  };

  const handleSearchAmenity = (amenityKey: string) => {
    window.open(
      `https://www.google.com/maps/search/${amenityKey}/@${latitude},${longitude},15z`,
      "_blank"
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl md:text-2xl font-bold text-foreground">Location</h2>
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

        <div ref={mapContainerRef} className="w-full h-[280px] md:h-[320px]" />
      </div>

      {/* Nearby Amenities Quick Links */}
      <div>
        <p className="text-sm text-muted-foreground mb-3">
          Explore nearby amenities
        </p>
        <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
          {amenityCategories.map(({ key, label, icon: Icon, color }) => (
            <button
              key={key}
              onClick={() => handleSearchAmenity(key)}
              className="group flex flex-col items-center p-3 bg-muted/50 hover:bg-muted rounded-xl transition-colors"
            >
              <div 
                className="p-2 rounded-lg mb-1 transition-colors"
                style={{ backgroundColor: `${color}20` }}
              >
                <Icon 
                  className="h-4 w-4 transition-transform group-hover:scale-110" 
                  style={{ color }}
                />
              </div>
              <span className="text-xs font-medium text-foreground">{label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

export default ResaleListingMiniMap;