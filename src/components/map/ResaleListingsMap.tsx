import { useEffect, useRef, useCallback, useMemo, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet.markercluster/dist/MarkerCluster.css";
import "leaflet.markercluster/dist/MarkerCluster.Default.css";
import "leaflet.markercluster";
import { Crosshair, Plus, Minus } from "lucide-react";
import { getListingUrl } from "@/lib/propertiesUrls";

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
  year_built?: number | null;
  list_agent_name?: string | null;
  list_office_name?: string | null;
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
  const size = count >= 100 ? 44 : count >= 10 ? 40 : 36;
  const fontSize = count >= 100 ? 12 : count >= 10 ? 13 : 14;
  
  return L.divIcon({
    html: `<div style="
      background: linear-gradient(135deg, hsl(222, 47%, 18%) 0%, hsl(222, 47%, 25%) 100%);
      color: white;
      width: ${size}px;
      height: ${size}px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 700;
      font-size: ${fontSize}px;
      box-shadow: 0 3px 10px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.1);
      border: 2.5px solid hsl(45, 89%, 55%);
      font-family: system-ui, -apple-system, sans-serif;
    ">${count}</div>`,
    className: "marker-cluster-custom",
    iconSize: L.point(size, size),
    iconAnchor: L.point(size / 2, size / 2),
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
    ? `<img src="${photo}" alt="${getAddress(listing)}" style="width:100%;height:160px;object-fit:cover;border-radius:12px 12px 0 0;" loading="eager" fetchpriority="high" />`
    : `<div style="width:100%;height:160px;background:linear-gradient(135deg, #f1f5f9, #e2e8f0);display:flex;align-items:center;justify-content:center;border-radius:12px 12px 0 0;"><span style="color:#94a3b8;font-weight:500;">No Image</span></div>`;
  
  // Build attribution string
  const attribution = listing.list_agent_name && listing.list_office_name
    ? `${listing.list_agent_name} • ${listing.list_office_name}`
    : listing.list_agent_name || listing.list_office_name || null;
  
  const listingUrl = getListingUrl(listing.listing_key, getAddress(listing), listing.city);
  
  return `
    <div style="width:320px;font-family:system-ui,-apple-system,sans-serif;border-radius:12px;overflow:hidden;box-shadow:0 10px 40px -10px rgba(0,0,0,0.2);">
      ${photoHtml}
      <div style="padding:14px 16px;">
        <div style="font-weight:800;font-size:20px;color:#1e293b;letter-spacing:-0.02em;">${formatPrice(listing.listing_price)}</div>
        <div style="font-size:14px;color:#475569;margin-top:4px;font-weight:500;">${getAddress(listing)}</div>
        <div style="font-size:13px;color:#64748b;margin-top:2px;">${listing.city}</div>
        <div style="display:flex;gap:12px;margin-top:10px;font-size:13px;color:#475569;font-weight:500;">
          ${listing.bedrooms_total ? `<span>${listing.bedrooms_total} bed</span>` : ""}
          ${listing.bathrooms_total ? `<span>${listing.bathrooms_total} bath</span>` : ""}
          ${listing.living_area ? `<span>${listing.living_area.toLocaleString()} sqft</span>` : ""}
        </div>
        ${attribution ? `<div style="font-size:11px;color:#94a3b8;margin-top:10px;border-top:1px solid #e2e8f0;padding-top:10px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">Listed by ${attribution}</div>` : ""}
        <a href="${listingUrl}" style="display:block;margin-top:12px;background:linear-gradient(135deg,hsl(43,96%,56%),hsl(38,92%,50%));color:hsl(222,47%,11%);text-align:center;padding:10px;border-radius:8px;text-decoration:none;font-weight:700;font-size:14px;box-shadow:0 2px 8px rgba(0,0,0,0.1);transition:transform 0.15s;">View Details</a>
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

    // Optimized cluster settings - aggressive clustering to prevent overlapping pills
    const clusterGroup = L.markerClusterGroup({
      chunkedLoading: true,
      chunkDelay: 50,
      chunkInterval: 100,
      maxClusterRadius: 80, // Increased for more aggressive clustering
      spiderfyOnMaxZoom: true,
      showCoverageOnHover: false,
      disableClusteringAtZoom: 18, // Cluster until very zoomed in
      animate: false, // Disable animations for better performance
      removeOutsideVisibleBounds: true, // Only render visible markers
      iconCreateFunction: createClusterIcon,
      spiderfyDistanceMultiplier: 1.5, // Spread spiderfied markers more
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

    // For large datasets, batch marker creation for better performance
    clusterGroup.clearLayers();
    markersRef.current.clear();

    if (validListings.length === 0) return;

    // Create markers in batches for better performance with large datasets
    const BATCH_SIZE = 500;
    const markers: L.Marker[] = [];
    
    for (let i = 0; i < validListings.length; i++) {
      const listing = validListings[i];
      const marker = L.marker([listing.latitude!, listing.longitude!], {
        icon: createPricePillIcon(listing),
      });

      // Bind popup with listing details
      marker.bindPopup(popupHtml(listing), {
        maxWidth: 220,
        minWidth: 200,
        closeButton: true,
        className: "resale-listing-popup",
      });

      marker.on("click", () => {
        onListingSelect?.(listing.id);
      });

      markers.push(marker);
      markersRef.current.set(listing.id, marker);
    }

    // Add all markers at once for better clustering performance
    clusterGroup.addLayers(markers);

    // Fit bounds to show all listings (only if we have valid data)
    if (validListings.length > 0) {
      const bounds = L.latLngBounds(
        validListings.map(l => [l.latitude!, l.longitude!] as L.LatLngTuple)
      );
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 13, animate: false });
    }

    // Delay visibility update slightly for rendering
    requestAnimationFrame(() => {
      setTimeout(updateVisibleListings, 50);
    });
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
      
      {/* Custom Controls - Bottom right on mobile to avoid conflicts */}
      <div className="absolute bottom-24 lg:bottom-6 right-3 z-[900] flex flex-col gap-1.5">
        <button
          onClick={handleLocateUser}
          className="w-8 h-8 rounded-full bg-background/95 backdrop-blur-sm shadow-md border border-border/40 flex items-center justify-center hover:bg-background transition-colors"
          aria-label="Find my location"
        >
          <Crosshair className="h-4 w-4 text-muted-foreground" />
        </button>
        <div className="flex flex-col rounded-full overflow-hidden bg-background/95 backdrop-blur-sm shadow-md border border-border/40">
          <button
            onClick={handleZoomIn}
            className="w-8 h-8 flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
            aria-label="Zoom in"
          >
            <Plus className="h-4 w-4" />
          </button>
          <div className="w-full h-px bg-border/50" />
          <button
            onClick={handleZoomOut}
            className="w-8 h-8 flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
            aria-label="Zoom out"
          >
            <Minus className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
