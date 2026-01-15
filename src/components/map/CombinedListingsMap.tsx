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

// Resale/MLS listing type
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
  list_agent_name?: string | null;
  list_office_name?: string | null;
}

// Presale project type
interface PresaleProject {
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

interface SavedMapState {
  center: { lat: number; lng: number };
  zoom: number;
  timestamp: number;
}

interface CombinedListingsMapProps {
  resaleListings: MLSListing[];
  presaleProjects: PresaleProject[];
  mode: "all" | "presale" | "resale";
  onListingSelect?: (id: string, type: "resale" | "presale") => void;
  onVisibleItemsChange?: (resaleIds: string[], presaleIds: string[]) => void;
  onMapInteraction?: () => void;
  onMapStateChange?: (center: { lat: number; lng: number }, zoom: number) => void;
  /** On mobile, skip popups and just use carousel */
  disablePopupsOnMobile?: boolean;
  /** Center map on user's location when it becomes available */
  centerOnUserLocation?: boolean;
  /** User location passed from parent (triggers centering) */
  initialUserLocation?: { lat: number; lng: number } | null;
  /** Saved map state to restore on mount */
  savedMapState?: SavedMapState | null;
}

function formatPrice(price: number): string {
  if (price >= 1000000) {
    const millions = price / 1000000;
    return millions % 1 === 0 ? `$${millions}M` : `$${millions.toFixed(1)}M`;
  }
  return `$${Math.round(price / 1000)}K`;
}

// Gold price pill - brand style, compact
function createResalePricePillIcon(listing: MLSListing): L.DivIcon {
  const priceText = formatPrice(listing.listing_price);
  
  return L.divIcon({
    className: "custom-price-marker resale-marker",
    html: `
      <div style="
        background: hsl(45, 89%, 55%);
        color: hsl(222, 47%, 11%);
        padding: 3px 8px;
        border-radius: 12px;
        font-weight: 600;
        font-size: 11px;
        white-space: nowrap;
        box-shadow: 0 1px 4px rgba(0,0,0,0.2);
        border: 1.5px solid white;
        cursor: pointer;
        line-height: 1.2;
      ">
        ${priceText}
      </div>
    `,
    iconSize: [60, 22],
    iconAnchor: [30, 22],
    popupAnchor: [0, -24],
  });
}

// Presale marker - dark navy teardrop with gold ring and building icon
function createPresalePinIcon(project: PresaleProject): L.DivIcon {
  return L.divIcon({
    className: "custom-presale-pin",
    html: `
      <div style="
        position: relative;
        display: flex;
        flex-direction: column;
        align-items: center;
      ">
        <div style="
          background: hsl(222, 47%, 20%);
          width: 28px;
          height: 28px;
          border-radius: 50% 50% 50% 0;
          transform: rotate(-45deg);
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 2px 4px rgba(0,0,0,0.3);
          border: 2px solid hsl(45, 89%, 55%);
        ">
          <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="hsl(45, 89%, 55%)" stroke="none" style="transform: rotate(45deg);">
            <path d="M3 21h18v-2H3v2zm0-4h18v-2H3v2zm0-4h18v-2H3v2zm0-4h18V7H3v2zm0-6v2h18V3H3z"/>
          </svg>
        </div>
      </div>
    `,
    iconSize: [28, 34],
    iconAnchor: [14, 34],
    popupAnchor: [0, -34],
  });
}

// Cluster showing "X Units"
function createClusterIcon(cluster: L.MarkerCluster): L.DivIcon {
  const count = cluster.getChildCount();
  const label = count === 1 ? '1 Unit' : `${count} Units`;
  
  return L.divIcon({
    html: `<div style="
      background: hsl(222, 47%, 20%);
      color: white;
      padding: 4px 10px;
      border-radius: 12px;
      font-weight: 600;
      font-size: 11px;
      white-space: nowrap;
      box-shadow: 0 2px 6px rgba(0,0,0,0.25);
      border: 1.5px solid hsl(45, 89%, 55%);
      line-height: 1.2;
    ">${label}</div>`,
    className: "marker-cluster-custom",
    iconSize: L.point(70, 26),
    iconAnchor: L.point(35, 13),
  });
}

function getResaleAddress(listing: MLSListing): string {
  const parts = [listing.street_number, listing.street_name, listing.street_suffix].filter(Boolean);
  return parts.length > 0 ? parts.join(" ") : listing.neighborhood || listing.city;
}

function getResalePhoto(listing: MLSListing): string | null {
  if (listing.photos && Array.isArray(listing.photos) && listing.photos.length > 0) {
    return listing.photos[0]?.MediaURL || null;
  }
  return null;
}

function resalePopupHtml(listing: MLSListing): string {
  const photo = getResalePhoto(listing);
  const fullPrice = `$${listing.listing_price.toLocaleString()}`;
  const address = getResaleAddress(listing);
  
  // Build specs string like "3 bd • 2 ba • 1200 sq"
  const specs = [
    listing.bedrooms_total ? `${listing.bedrooms_total} bd` : null,
    listing.bathrooms_total ? `${listing.bathrooms_total} ba` : null,
    listing.living_area ? `${listing.living_area.toLocaleString()} sqft` : null,
  ].filter(Boolean).join(' • ');
  
  // Property type
  const propType = listing.property_sub_type || listing.property_type || '';
  
  // Brokerage
  const brokerage = listing.list_office_name || '';
  
  const photoHtml = photo 
    ? `<img src="${photo}" alt="${address}" style="width:160px;height:100%;min-height:120px;object-fit:cover;border-radius:0;" loading="eager" />`
    : `<div style="width:160px;min-height:120px;background:#f1f5f9;display:flex;align-items:center;justify-content:center;"><span style="color:#94a3b8;font-size:11px;">No Image</span></div>`;
  
  return `
    <div style="position:relative;">
      <a href="/resale/${listing.listing_key}" style="display:flex;width:380px;font-family:system-ui,sans-serif;text-decoration:none;color:inherit;background:white;border-radius:10px;overflow:hidden;box-shadow:0 4px 16px rgba(0,0,0,0.18);border:2px solid hsl(222,47%,20%);">
        <div style="flex-shrink:0;position:relative;">
          ${photoHtml}
          <span style="position:absolute;top:6px;left:6px;background:hsl(222,47%,20%);color:white;font-size:9px;font-weight:700;padding:3px 8px;border-radius:4px;letter-spacing:0.3px;">MOVE-IN READY</span>
        </div>
        <div style="flex:1;padding:12px 14px;display:flex;flex-direction:column;justify-content:center;min-width:0;">
          <div style="font-weight:700;font-size:18px;color:hsl(222,47%,20%);margin-bottom:4px;">${fullPrice}</div>
          <div style="font-size:13px;color:#475569;margin-bottom:4px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${address}</div>
          <div style="font-size:12px;color:#64748b;margin-bottom:2px;">${specs}</div>
          ${propType ? `<div style="font-size:11px;color:#64748b;">${propType}</div>` : ''}
          ${brokerage ? `<div style="font-size:10px;color:#94a3b8;margin-top:4px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${brokerage}</div>` : ''}
        </div>
      </a>
      <div style="position:absolute;bottom:-10px;left:50%;transform:translateX(-50%);width:0;height:0;border-left:10px solid transparent;border-right:10px solid transparent;border-top:10px solid hsl(222,47%,20%);"></div>
    </div>
  `;
}

function presalePopupHtml(project: PresaleProject): string {
  const photo = project.featured_image;
  const fullPrice = project.starting_price ? `From $${project.starting_price.toLocaleString()}` : 'Price TBA';
  
  const statusLabel = project.status === "active" ? "Selling Now" : 
                      project.status === "registering" ? "Registering" : 
                      project.status === "coming_soon" ? "Coming Soon" : project.status;
  
  const photoHtml = photo 
    ? `<img src="${photo}" alt="${project.name}" style="width:160px;height:100%;min-height:120px;object-fit:cover;border-radius:0;" loading="eager" />`
    : `<div style="width:160px;min-height:120px;background:hsl(45,89%,95%);display:flex;align-items:center;justify-content:center;"><span style="color:hsl(45,89%,40%);font-size:11px;">No Image</span></div>`;
  
  return `
    <div style="position:relative;">
      <a href="/presale-projects/${project.slug}" style="display:flex;width:380px;font-family:system-ui,sans-serif;text-decoration:none;color:inherit;background:white;border-radius:10px;overflow:hidden;box-shadow:0 4px 16px rgba(0,0,0,0.18);border:2px solid hsl(45,89%,50%);">
        <div style="flex-shrink:0;position:relative;">
          ${photoHtml}
          <span style="position:absolute;top:6px;left:6px;background:hsl(45,89%,50%);color:hsl(222,47%,15%);font-size:9px;font-weight:700;padding:3px 8px;border-radius:4px;letter-spacing:0.3px;">PRESALE</span>
        </div>
        <div style="flex:1;padding:12px 14px;display:flex;flex-direction:column;justify-content:center;min-width:0;">
          <div style="font-weight:700;font-size:15px;color:hsl(45,89%,40%);margin-bottom:2px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${project.name}</div>
          <div style="font-weight:700;font-size:17px;color:hsl(222,47%,20%);margin-bottom:4px;white-space:nowrap;">${fullPrice}</div>
          <div style="font-size:12px;color:#64748b;margin-bottom:2px;">${project.neighborhood}, ${project.city}</div>
          <div style="font-size:11px;color:#64748b;">${project.project_type || 'Condo'} • ${statusLabel}</div>
        </div>
      </a>
      <div style="position:absolute;bottom:-10px;left:50%;transform:translateX(-50%);width:0;height:0;border-left:10px solid transparent;border-right:10px solid transparent;border-top:10px solid hsl(45,89%,50%);"></div>
    </div>
  `;
}

export function CombinedListingsMap({ 
  resaleListings,
  presaleProjects,
  mode,
  onListingSelect, 
  onVisibleItemsChange,
  onMapInteraction,
  onMapStateChange,
  disablePopupsOnMobile = false,
  centerOnUserLocation = false,
  initialUserLocation = null,
  savedMapState = null
}: CombinedListingsMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markerClusterRef = useRef<L.MarkerClusterGroup | null>(null);
  const presaleLayerRef = useRef<L.LayerGroup | null>(null);
  const [userLocation, setUserLocation] = useState<L.LatLng | null>(null);
  const userMarkerRef = useRef<L.Marker | null>(null);
  const hasInitializedViewRef = useRef(false);
  const hasCenteredOnUserRef = useRef(false);
  const hasRestoredSavedStateRef = useRef(false);

  const validResaleListings = useMemo(() => 
    resaleListings.filter(l => l.latitude && l.longitude),
    [resaleListings]
  );

  const validPresaleProjects = useMemo(() => 
    presaleProjects.filter(p => p.map_lat && p.map_lng),
    [presaleProjects]
  );

  const updateVisibleItems = useCallback(() => {
    if (!mapInstanceRef.current || !onVisibleItemsChange) return;
    
    const bounds = mapInstanceRef.current.getBounds();
    
    const visibleResale = validResaleListings
      .filter(l => bounds.contains([l.latitude!, l.longitude!]))
      .map(l => l.id);
    
    const visiblePresale = validPresaleProjects
      .filter(p => bounds.contains([p.map_lat!, p.map_lng!]))
      .map(p => p.id);
    
    onVisibleItemsChange(visibleResale, visiblePresale);
  }, [validResaleListings, validPresaleProjects, onVisibleItemsChange]);

  const initializeMap = useCallback(() => {
    if (!mapRef.current || mapInstanceRef.current) return;

    // Use saved state if available, otherwise defaults
    const initialCenter: L.LatLngExpression = savedMapState 
      ? [savedMapState.center.lat, savedMapState.center.lng]
      : DEFAULT_CENTER;
    const initialZoom = savedMapState ? savedMapState.zoom : DEFAULT_ZOOM;

    const map = L.map(mapRef.current, {
      center: initialCenter,
      zoom: initialZoom,
      zoomControl: false,
      attributionControl: true,
    });

    L.tileLayer(TILE_URL, { 
      attribution: TILE_ATTRIBUTION,
      maxZoom: 19 
    }).addTo(map);

    // Cluster group for resale listings only
    // Low radius = fewer/smaller clusters → more individual pins visible
    const clusterGroup = L.markerClusterGroup({
      chunkedLoading: true,
      chunkDelay: 50,
      chunkInterval: 100,
      maxClusterRadius: 35, // tighter clustering – more individual pins
      spiderfyOnMaxZoom: true,
      showCoverageOnHover: false,
      disableClusteringAtZoom: 15, // unclustered at neighborhood zoom
      animate: false,
      removeOutsideVisibleBounds: true,
      iconCreateFunction: createClusterIcon,
      spiderfyDistanceMultiplier: 1.8,
    });

    // Separate layer for presale projects (no clustering)
    const presaleLayer = L.layerGroup();

    map.addLayer(clusterGroup);
    map.addLayer(presaleLayer);
    
    mapInstanceRef.current = map;
    markerClusterRef.current = clusterGroup;
    presaleLayerRef.current = presaleLayer;

    // If we have saved state, mark as initialized to prevent fitBounds overriding
    if (savedMapState) {
      hasInitializedViewRef.current = true;
      hasRestoredSavedStateRef.current = true;
    }

    map.on("moveend", updateVisibleItems);
    map.on("zoomend", updateVisibleItems);
    
    // Notify parent when user starts interacting with map (drag/zoom)
    map.on("movestart", () => {
      if (onMapInteraction) onMapInteraction();
    });
    
    // Save map state on every move/zoom for persistence
    map.on("moveend", () => {
      if (onMapStateChange && mapInstanceRef.current) {
        const center = mapInstanceRef.current.getCenter();
        const zoom = mapInstanceRef.current.getZoom();
        onMapStateChange({ lat: center.lat, lng: center.lng }, zoom);
      }
    });

    // Removed auto-geolocation from here - now handled by parent with permission prompt
  }, [updateVisibleItems, savedMapState, onMapInteraction, onMapStateChange]);

  useEffect(() => {
    initializeMap();
    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [initializeMap]);

  // Update markers when data or mode changes
  useEffect(() => {
    const map = mapInstanceRef.current;
    const clusterGroup = markerClusterRef.current;
    const presaleLayer = presaleLayerRef.current;
    if (!map || !clusterGroup || !presaleLayer) return;

    clusterGroup.clearLayers();
    presaleLayer.clearLayers();

    const resaleMarkers: L.Marker[] = [];
    const allCoords: L.LatLngTuple[] = [];

    // Add resale listings to cluster group if mode is "all" or "resale"
    if (mode === "all" || mode === "resale") {
      // Many MLS feeds reuse the exact same lat/lng for multiple units in the same building.
      // When clustering is loosened, those price pills stack perfectly and become unreadable.
      // We apply a tiny deterministic "fan" offset for identical coordinates so pins stay distinct.
      const counts = new globalThis.Map<string, number>();
      const nextIndex = new globalThis.Map<string, number>();

      const coordKey = (lat: number, lng: number) => `${lat.toFixed(6)},${lng.toFixed(6)}`;

      for (const l of validResaleListings) {
        const lat = l.latitude!;
        const lng = l.longitude!;
        const key = coordKey(lat, lng);
        counts.set(key, (counts.get(key) || 0) + 1);
      }

      const jitter = (lat: number, lng: number, idx: number) => {
        // ~8–14m ring around the original point depending on idx
        const baseMeters = 10;
        const radiusMeters = baseMeters + (idx % 3) * 2;
        const angle = (idx * 2.399963229728653) % (Math.PI * 2); // golden angle

        const dLat = (radiusMeters * Math.cos(angle)) / 111320;
        const dLng = (radiusMeters * Math.sin(angle)) / (111320 * Math.cos((lat * Math.PI) / 180));
        return [lat + dLat, lng + dLng] as L.LatLngTuple;
      };

      for (const listing of validResaleListings) {
        const baseLat = listing.latitude!;
        const baseLng = listing.longitude!;
        const key = coordKey(baseLat, baseLng);

        const dupCount = counts.get(key) || 0;
        const idx = nextIndex.get(key) || 0;
        nextIndex.set(key, idx + 1);

        const position: L.LatLngTuple = dupCount > 1 ? jitter(baseLat, baseLng, idx) : [baseLat, baseLng];

        const marker = L.marker(position, {
          icon: createResalePricePillIcon(listing),
        });

        // Only bind popup if not disabled (mobile uses carousel instead)
        if (!disablePopupsOnMobile) {
          marker.bindPopup(resalePopupHtml(listing), {
            maxWidth: 400,
            minWidth: 340,
            closeButton: true,
            className: "resale-listing-popup",
            offset: L.point(0, -10),
            autoPan: true,
            autoPanPaddingTopLeft: L.point(50, 100),
            autoPanPaddingBottomRight: L.point(50, 50),
          });
        }

        marker.on("click", () => {
          onListingSelect?.(listing.id, "resale");
        });

        resaleMarkers.push(marker);
        // Use the *original* coordinate for fitBounds so the view doesn't drift.
        allCoords.push([baseLat, baseLng]);
      }
    }

    // Add presale projects as individual pins (not clustered) if mode is "all" or "presale"
    if (mode === "all" || mode === "presale") {
      for (const project of validPresaleProjects) {
        const marker = L.marker([project.map_lat!, project.map_lng!], {
          icon: createPresalePinIcon(project),
          zIndexOffset: 1000, // Keep presale pins above resale clusters
        });

        // Only bind popup if not disabled (mobile uses carousel instead)
        if (!disablePopupsOnMobile) {
          marker.bindPopup(presalePopupHtml(project), {
            maxWidth: 420,
            minWidth: 360,
            closeButton: true,
            className: "presale-project-popup",
            offset: L.point(0, -20),
            autoPan: true,
            autoPanPaddingTopLeft: L.point(50, 100),
            autoPanPaddingBottomRight: L.point(50, 50),
          });
        }

        marker.on("click", () => {
          onListingSelect?.(project.id, "presale");
        });

        presaleLayer.addLayer(marker);
        allCoords.push([project.map_lat!, project.map_lng!]);
      }
    }

    clusterGroup.addLayers(resaleMarkers);

    // Only fit bounds on initial load, not when toggling mode or filters
    if (!hasInitializedViewRef.current && allCoords.length > 0) {
      const bounds = L.latLngBounds(allCoords);
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 13, animate: false });
      hasInitializedViewRef.current = true;
    }

    requestAnimationFrame(() => {
      setTimeout(updateVisibleItems, 50);
    });
  }, [validResaleListings, validPresaleProjects, mode, onListingSelect, updateVisibleItems]);

  // Create user location marker icon
  const createUserLocationIcon = useCallback(() => {
    return L.divIcon({
      className: "user-location-marker",
      html: `
        <div style="
          position: relative;
          width: 20px;
          height: 20px;
        ">
          <div style="
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            width: 20px;
            height: 20px;
            background: hsl(217, 91%, 60%);
            border: 3px solid white;
            border-radius: 50%;
            box-shadow: 0 2px 8px rgba(59, 130, 246, 0.5);
          "></div>
          <div style="
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            width: 40px;
            height: 40px;
            background: hsla(217, 91%, 60%, 0.2);
            border-radius: 50%;
            animation: pulse 2s ease-out infinite;
          "></div>
        </div>
        <style>
          @keyframes pulse {
            0% { transform: translate(-50%, -50%) scale(0.8); opacity: 1; }
            100% { transform: translate(-50%, -50%) scale(2); opacity: 0; }
          }
        </style>
      `,
      iconSize: [40, 40],
      iconAnchor: [20, 20],
    });
  }, []);

  // Add or update user location marker
  const updateUserLocationMarker = useCallback((loc: L.LatLng) => {
    if (!mapInstanceRef.current) return;
    
    if (userMarkerRef.current) {
      userMarkerRef.current.setLatLng(loc);
    } else {
      const marker = L.marker(loc, { 
        icon: createUserLocationIcon(),
        zIndexOffset: 1000 
      });
      marker.addTo(mapInstanceRef.current);
      userMarkerRef.current = marker;
    }
  }, [createUserLocationIcon]);

  // Center on user location when provided from parent (after permission granted)
  useEffect(() => {
    if (!initialUserLocation || !mapInstanceRef.current || hasCenteredOnUserRef.current) return;
    
    const loc = L.latLng(initialUserLocation.lat, initialUserLocation.lng);
    setUserLocation(loc);
    updateUserLocationMarker(loc);
    
    // Center map on user location with a nice zoom level
    mapInstanceRef.current.setView(loc, 13, { animate: true });
    hasCenteredOnUserRef.current = true;
    hasInitializedViewRef.current = true; // Prevent fitBounds from overriding
    
    // Update visible items after centering
    setTimeout(updateVisibleItems, 100);
  }, [initialUserLocation, updateUserLocationMarker, updateVisibleItems]);

  const handleLocateUser = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const loc = L.latLng(pos.coords.latitude, pos.coords.longitude);
          setUserLocation(loc);
          updateUserLocationMarker(loc);
          mapInstanceRef.current?.setView(loc, 14);
        },
        (error) => {
          console.log("Geolocation error:", error.message);
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
      );
    }
  };

  const handleZoomIn = () => mapInstanceRef.current?.zoomIn();
  const handleZoomOut = () => mapInstanceRef.current?.zoomOut();

  return (
    <div className="relative w-full h-full">
      <div ref={mapRef} className="w-full h-full" />
      
      {/* Custom Controls - Right side, Apple Maps style */}
      <div className="absolute top-16 lg:top-4 right-3 z-[900] flex flex-col gap-2">
        {/* Zoom Controls */}
        <div className="flex flex-col rounded-2xl overflow-hidden bg-background/90 backdrop-blur-xl shadow-lg border border-border/30">
          <button
            onClick={handleZoomIn}
            className="w-11 h-11 flex items-center justify-center text-foreground hover:bg-muted/50 transition-colors"
            aria-label="Zoom in"
          >
            <Plus className="h-5 w-5" />
          </button>
          <div className="w-full h-px bg-border/40" />
          <button
            onClick={handleZoomOut}
            className="w-11 h-11 flex items-center justify-center text-foreground hover:bg-muted/50 transition-colors"
            aria-label="Zoom out"
          >
            <Minus className="h-5 w-5" />
          </button>
        </div>
        
        {/* Location Button - Below zoom controls */}
        <button
          onClick={handleLocateUser}
          className="w-11 h-11 rounded-2xl bg-background/90 backdrop-blur-xl shadow-lg border border-border/30 flex items-center justify-center hover:bg-muted/50 transition-colors"
          aria-label="Find my location"
        >
          <Crosshair className="h-5 w-5 text-primary" />
        </button>
      </div>
    </div>
  );
}
