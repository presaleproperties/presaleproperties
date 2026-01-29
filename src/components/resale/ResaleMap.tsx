import { useEffect, useRef, useMemo, useState, useCallback } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet.markercluster/dist/MarkerCluster.css";
import "leaflet.markercluster/dist/MarkerCluster.Default.css";
import "leaflet.markercluster";
import { Locate, ZoomIn, ZoomOut, Home } from "lucide-react";
import { getListingUrl } from "@/lib/propertiesUrls";

const DEFAULT_CENTER: [number, number] = [49.2827, -123.1207];
const DEFAULT_ZOOM = 11;

const TILE_URL = "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png";
const TILE_ATTRIBUTION = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>';

interface MLSListing {
  id: string;
  listing_key: string;
  listing_price: number;
  city: string;
  neighborhood: string | null;
  unparsed_address: string | null;
  latitude: number | null;
  longitude: number | null;
  bedrooms_total: number | null;
  bathrooms_total: number | null;
}

interface ResaleMapProps {
  listings: MLSListing[];
  onListingSelect?: (listingKey: string) => void;
}

function formatPrice(price: number) {
  if (price >= 1000000) return `$${(price / 1000000).toFixed(1)}M`;
  return `$${(price / 1000).toFixed(0)}K`;
}

function createPricePillIcon(listing: MLSListing) {
  const priceText = formatPrice(listing.listing_price);
  
  const html = `
    <div class="resale-price-pill">
      <span class="resale-price-text">${priceText}</span>
    </div>
  `;

  return L.divIcon({
    html,
    className: "resale-marker-icon",
    iconSize: [70, 28],
    iconAnchor: [35, 14],
  });
}

function createClusterIcon(cluster: L.MarkerCluster) {
  const count = cluster.getChildCount();
  return L.divIcon({
    html: `<div class="resale-cluster-icon">${count}</div>`,
    className: "resale-cluster-marker",
    iconSize: [40, 40],
    iconAnchor: [20, 20],
  });
}

export function ResaleMap({ listings, onListingSelect }: ResaleMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const clusterGroupRef = useRef<L.MarkerClusterGroup | null>(null);
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);

  const validListings = useMemo(() => 
    listings.filter(l => l.latitude && l.longitude),
    [listings]
  );

  const initializeMap = useCallback(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    const map = L.map(mapContainerRef.current, {
      center: DEFAULT_CENTER,
      zoom: DEFAULT_ZOOM,
      zoomControl: false,
      attributionControl: true,
    });

    L.tileLayer(TILE_URL, { attribution: TILE_ATTRIBUTION, maxZoom: 19 }).addTo(map);

    const clusterGroup = L.markerClusterGroup({
      showCoverageOnHover: false,
      maxClusterRadius: 50,
      spiderfyOnMaxZoom: true,
      iconCreateFunction: createClusterIcon,
    });
    map.addLayer(clusterGroup);

    mapRef.current = map;
    clusterGroupRef.current = clusterGroup;

    // Request user location on load
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const loc: [number, number] = [position.coords.latitude, position.coords.longitude];
          setUserLocation(loc);
        },
        () => console.log("Location access denied")
      );
    }

    return () => {
      map.remove();
      mapRef.current = null;
      clusterGroupRef.current = null;
    };
  }, []);

  useEffect(() => {
    const cleanup = initializeMap();
    return cleanup;
  }, [initializeMap]);

  useEffect(() => {
    const map = mapRef.current;
    const clusterGroup = clusterGroupRef.current;
    if (!map || !clusterGroup) return;

    clusterGroup.clearLayers();

    validListings.forEach((listing) => {
      const marker = L.marker([listing.latitude!, listing.longitude!], {
        icon: createPricePillIcon(listing),
      });

      const listingUrl = getListingUrl(listing.listing_key, listing.unparsed_address, listing.city);
      const popupContent = `
        <div class="resale-popup">
          <div class="resale-popup-price">${formatPrice(listing.listing_price)}</div>
          <div class="resale-popup-address">${listing.unparsed_address || listing.city}</div>
          <div class="resale-popup-details">
            ${listing.bedrooms_total ? `${listing.bedrooms_total} bed` : ''} 
            ${listing.bathrooms_total ? `• ${listing.bathrooms_total} bath` : ''}
          </div>
          <a href="${listingUrl}" class="resale-popup-link">View Details →</a>
        </div>
      `;
      marker.bindPopup(popupContent, { closeButton: true, className: "resale-popup-container" });

      marker.on("click", () => {
        onListingSelect?.(listing.listing_key);
      });

      clusterGroup.addLayer(marker);
    });

    if (validListings.length > 0) {
      const bounds = L.latLngBounds(
        validListings.map(l => [l.latitude!, l.longitude!] as [number, number])
      );
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 14 });
    }
  }, [validListings, onListingSelect]);

  const handleLocateUser = () => {
    if (userLocation && mapRef.current) {
      mapRef.current.setView(userLocation, 13, { animate: true });
    } else if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const loc: [number, number] = [position.coords.latitude, position.coords.longitude];
          setUserLocation(loc);
          mapRef.current?.setView(loc, 13, { animate: true });
        },
        () => alert("Unable to get your location")
      );
    }
  };

  const handleZoomIn = () => mapRef.current?.zoomIn();
  const handleZoomOut = () => mapRef.current?.zoomOut();

  return (
    <div className="relative w-full h-full">
      <style>{`
        .resale-marker-icon {
          background: transparent !important;
          border: none !important;
        }
        .resale-price-pill {
          background: linear-gradient(135deg, #10B981 0%, #059669 100%);
          color: white;
          padding: 4px 10px;
          border-radius: 20px;
          font-size: 12px;
          font-weight: 600;
          white-space: nowrap;
          box-shadow: 0 2px 8px rgba(0,0,0,0.2);
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .resale-cluster-marker {
          background: transparent !important;
          border: none !important;
        }
        .resale-cluster-icon {
          background: linear-gradient(135deg, #1a1a1a 0%, #333 100%);
          color: white;
          width: 40px;
          height: 40px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 13px;
          font-weight: 700;
          box-shadow: 0 3px 10px rgba(0,0,0,0.3);
        }
        .resale-popup-container .leaflet-popup-content-wrapper {
          border-radius: 12px;
          padding: 0;
          overflow: hidden;
        }
        .resale-popup-container .leaflet-popup-content {
          margin: 0;
          min-width: 180px;
        }
        .resale-popup {
          padding: 12px;
        }
        .resale-popup-price {
          font-size: 18px;
          font-weight: 700;
          color: #10B981;
          margin-bottom: 4px;
        }
        .resale-popup-address {
          font-size: 13px;
          color: #374151;
          margin-bottom: 4px;
        }
        .resale-popup-details {
          font-size: 12px;
          color: #6B7280;
          margin-bottom: 8px;
        }
        .resale-popup-link {
          display: inline-block;
          font-size: 12px;
          font-weight: 600;
          color: #10B981;
          text-decoration: none;
        }
        .resale-popup-link:hover {
          text-decoration: underline;
        }
      `}</style>

      <div ref={mapContainerRef} className="w-full h-full z-0" />

      {/* Custom Controls */}
      <div className="absolute top-4 right-4 z-[1000] flex flex-col gap-2">
        <button
          onClick={handleLocateUser}
          className="w-10 h-10 bg-background border rounded-lg shadow-md flex items-center justify-center hover:bg-muted transition-colors"
          aria-label="Find my location"
        >
          <Locate className="h-5 w-5 text-foreground" />
        </button>
        <button
          onClick={handleZoomIn}
          className="w-10 h-10 bg-background border rounded-lg shadow-md flex items-center justify-center hover:bg-muted transition-colors"
          aria-label="Zoom in"
        >
          <ZoomIn className="h-5 w-5 text-foreground" />
        </button>
        <button
          onClick={handleZoomOut}
          className="w-10 h-10 bg-background border rounded-lg shadow-md flex items-center justify-center hover:bg-muted transition-colors"
          aria-label="Zoom out"
        >
          <ZoomOut className="h-5 w-5 text-foreground" />
        </button>
      </div>
    </div>
  );
}

export default ResaleMap;
