import { useEffect, useRef, useCallback, useMemo, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet.markercluster/dist/MarkerCluster.css";
import "leaflet.markercluster/dist/MarkerCluster.Default.css";
import "leaflet.markercluster";
import { Crosshair, Plus, Minus } from "lucide-react";

const DEFAULT_CENTER: L.LatLngExpression = [49.2827, -123.1207];
const DEFAULT_ZOOM = 11;
const TILE_URL = "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png";
const TILE_ATTRIBUTION = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>';

interface MLSListing {
  id: string;
  listing_key: string;
  listing_price: number;
  city: string;
  neighborhood: string | null;
  street_number: string | null;
  street_name: string | null;
  street_suffix?: string | null;
  property_type: string;
  property_sub_type: string | null;
  bedrooms_total: number | null;
  bathrooms_total: number | null;
  living_area: number | null;
  latitude: number | null;
  longitude: number | null;
  photos: any;
  mls_status: string;
}

interface ResaleListingsMapProps {
  listings: MLSListing[];
  isLoading?: boolean;
  onListingSelect?: (listingId: string) => void;
  onVisibleListingsChange?: (listingIds: string[]) => void;
}

function formatPrice(price: number): string {
  if (price >= 1000000) {
    return `$${(price / 1000000).toFixed(1)}M`;
  }
  return `$${Math.round(price / 1000)}K`;
}

function createPricePillIcon(listing: MLSListing): L.DivIcon {
  const priceText = formatPrice(listing.listing_price);
  
  return L.divIcon({
    className: "custom-price-marker",
    html: `
      <div style="
        background: hsl(45, 89%, 61%);
        color: hsl(222, 47%, 11%);
        padding: 4px 8px;
        border-radius: 16px;
        font-weight: 600;
        font-size: 11px;
        white-space: nowrap;
        box-shadow: 0 2px 6px rgba(0,0,0,0.2);
        border: 2px solid white;
        cursor: pointer;
        transition: transform 0.15s ease;
      ">
        ${priceText}
      </div>
    `,
    iconSize: [80, 28],
    iconAnchor: [40, 28],
    popupAnchor: [0, -30],
  });
}

function createClusterIcon(cluster: L.MarkerCluster): L.DivIcon {
  const count = cluster.getChildCount();
  return L.divIcon({
    html: `<div style="
      background: hsl(222, 47%, 20%);
      color: white;
      width: 36px;
      height: 36px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 700;
      font-size: 13px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.3);
      border: 2px solid white;
    ">${count}</div>`,
    className: "marker-cluster-custom",
    iconSize: L.point(36, 36),
    iconAnchor: L.point(18, 18),
  });
}

function getAddress(listing: MLSListing): string {
  const parts = [listing.street_number, listing.street_name, listing.street_suffix].filter(Boolean);
  return parts.length > 0 ? parts.join(" ") : listing.neighborhood || listing.city;
}

function getPhoto(listing: MLSListing): string | null {
  if (listing.photos && Array.isArray(listing.photos) && listing.photos.length > 0) {
    return listing.photos[0]?.MediaURL || null;
  }
  return null;
}

function popupHtml(listing: MLSListing): string {
  const photo = getPhoto(listing);
  const photoHtml = photo 
    ? `<img src="${photo}" alt="${getAddress(listing)}" style="width:100%;height:100px;object-fit:cover;border-radius:8px 8px 0 0;" />`
    : `<div style="width:100%;height:80px;background:#f1f5f9;display:flex;align-items:center;justify-content:center;border-radius:8px 8px 0 0;"><span style="color:#94a3b8;">No Image</span></div>`;
  
  return `
    <div style="width:200px;font-family:system-ui,sans-serif;">
      ${photoHtml}
      <div style="padding:10px;">
        <div style="font-weight:700;font-size:16px;color:#1e293b;">${formatPrice(listing.listing_price)}</div>
        <div style="font-size:13px;color:#64748b;margin-top:2px;">${getAddress(listing)}</div>
        <div style="font-size:12px;color:#94a3b8;">${listing.city}</div>
        <div style="display:flex;gap:10px;margin-top:6px;font-size:12px;color:#64748b;">
          ${listing.bedrooms_total ? `<span>${listing.bedrooms_total} bed</span>` : ""}
          ${listing.bathrooms_total ? `<span>${listing.bathrooms_total} bath</span>` : ""}
          ${listing.living_area ? `<span>${listing.living_area} sqft</span>` : ""}
        </div>
        <a href="/resale/${listing.listing_key}" style="display:block;margin-top:8px;background:hsl(45, 89%, 61%);color:hsl(222, 47%, 11%);text-align:center;padding:6px;border-radius:6px;text-decoration:none;font-weight:600;font-size:13px;">View Details</a>
      </div>
    </div>
  `;
}

export function ResaleListingsMap({ 
  listings, 
  onListingSelect, 
  onVisibleListingsChange 
}: ResaleListingsMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markerClusterRef = useRef<L.MarkerClusterGroup | null>(null);
  const markersRef = useRef<Map<string, L.Marker>>(new Map());
  const [userLocation, setUserLocation] = useState<L.LatLng | null>(null);

  const validListings = useMemo(() => 
    listings.filter(l => l.latitude && l.longitude),
    [listings]
  );

  const updateVisibleListings = useCallback(() => {
    if (!mapInstanceRef.current || !onVisibleListingsChange) return;
    
    const bounds = mapInstanceRef.current.getBounds();
    const visible = validListings
      .filter(l => bounds.contains([l.latitude!, l.longitude!]))
      .map(l => l.id);
    
    onVisibleListingsChange(visible);
  }, [validListings, onVisibleListingsChange]);

  const initializeMap = useCallback(() => {
    if (!mapRef.current || mapInstanceRef.current) return;

    const map = L.map(mapRef.current, {
      center: DEFAULT_CENTER,
      zoom: DEFAULT_ZOOM,
      zoomControl: false,
      attributionControl: true,
    });

    L.tileLayer(TILE_URL, { 
      attribution: TILE_ATTRIBUTION,
      maxZoom: 19 
    }).addTo(map);

    const clusterGroup = L.markerClusterGroup({
      chunkedLoading: true,
      maxClusterRadius: 50,
      spiderfyOnMaxZoom: true,
      showCoverageOnHover: false,
      iconCreateFunction: createClusterIcon,
    });

    map.addLayer(clusterGroup);
    
    mapInstanceRef.current = map;
    markerClusterRef.current = clusterGroup;

    map.on("moveend", updateVisibleListings);
    map.on("zoomend", updateVisibleListings);

    // Request user location
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const loc = L.latLng(pos.coords.latitude, pos.coords.longitude);
          setUserLocation(loc);
        },
        () => {}
      );
    }
  }, [updateVisibleListings]);

  useEffect(() => {
    initializeMap();
    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [initializeMap]);

  useEffect(() => {
    const map = mapInstanceRef.current;
    const clusterGroup = markerClusterRef.current;
    if (!map || !clusterGroup) return;

    clusterGroup.clearLayers();
    markersRef.current.clear();

    if (validListings.length === 0) return;

    validListings.forEach((listing) => {
      const marker = L.marker([listing.latitude!, listing.longitude!], {
        icon: createPricePillIcon(listing),
      });

      // Only trigger carousel selection, no popup
      marker.on("click", () => {
        onListingSelect?.(listing.id);
      });

      clusterGroup.addLayer(marker);
      markersRef.current.set(listing.id, marker);
    });

    // Fit bounds to show all listings
    const bounds = L.latLngBounds(
      validListings.map(l => [l.latitude!, l.longitude!] as L.LatLngTuple)
    );
    map.fitBounds(bounds, { padding: [50, 50], maxZoom: 14 });

    setTimeout(updateVisibleListings, 100);
  }, [validListings, onListingSelect, updateVisibleListings]);

  const handleLocateUser = () => {
    if (userLocation && mapInstanceRef.current) {
      mapInstanceRef.current.setView(userLocation, 14);
    } else if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const loc = L.latLng(pos.coords.latitude, pos.coords.longitude);
          setUserLocation(loc);
          mapInstanceRef.current?.setView(loc, 14);
        },
        () => {}
      );
    }
  };

  const handleZoomIn = () => mapInstanceRef.current?.zoomIn();
  const handleZoomOut = () => mapInstanceRef.current?.zoomOut();

  return (
    <div className="relative w-full h-full">
      <div ref={mapRef} className="w-full h-full" />
      
      {/* Custom Controls */}
      <div className="absolute top-4 right-4 z-[1000] flex flex-col gap-1.5">
        <button
          onClick={handleLocateUser}
          className="w-7 h-7 rounded-full bg-background/80 backdrop-blur-sm shadow-sm border border-border/30 flex items-center justify-center hover:bg-background transition-colors"
          aria-label="Find my location"
        >
          <Crosshair className="h-3.5 w-3.5 text-muted-foreground" />
        </button>
        <div className="flex flex-col rounded-full overflow-hidden bg-background/80 backdrop-blur-sm shadow-sm border border-border/30">
          <button
            onClick={handleZoomIn}
            className="w-7 h-7 flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
            aria-label="Zoom in"
          >
            <Plus className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={handleZoomOut}
            className="w-7 h-7 flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
            aria-label="Zoom out"
          >
            <Minus className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
