import { useEffect, useRef, useCallback, useMemo, useState, forwardRef, useImperativeHandle } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet.markercluster/dist/MarkerCluster.css";
import "leaflet.markercluster/dist/MarkerCluster.Default.css";
import "leaflet.markercluster";
import { Navigation2, Plus, Minus } from "lucide-react";
import { toast } from "sonner";

// Expose flyTo and highlightItem methods for parent navigation
export interface CombinedListingsMapRef {
  flyTo: (lat: number, lng: number, zoom?: number) => void;
  highlightItem: (id: string, type: "resale" | "presale") => void;
  clearHighlight: () => void;
}

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
  /** ID of item to highlight with animation */
  highlightedItemId?: string | null;
  /** Type of highlighted item */
  highlightedItemType?: "resale" | "presale" | null;
}

function formatPrice(price: number): string {
  if (price >= 1000000) {
    const millions = price / 1000000;
    return millions % 1 === 0 ? `$${millions}M` : `$${millions.toFixed(1)}M`;
  }
  return `$${Math.round(price / 1000)}K`;
}

// Gold price pill - brand style, compact - with optional highlight
function createResalePricePillIcon(listing: MLSListing, isHighlighted: boolean = false): L.DivIcon {
  const priceText = formatPrice(listing.listing_price);
  const size = isHighlighted ? [80, 32] : [60, 22];
  
  return L.divIcon({
    className: `custom-price-marker resale-marker ${isHighlighted ? 'marker-highlighted' : ''}`,
    html: `
      <div class="price-pill-inner ${isHighlighted ? 'bouncing' : ''}" style="
        background: ${isHighlighted ? 'hsl(45, 89%, 55%)' : 'hsl(45, 89%, 55%)'};
        color: ${isHighlighted ? 'hsl(222, 47%, 11%)' : 'hsl(222, 47%, 11%)'};
        padding: ${isHighlighted ? '6px 14px' : '3px 8px'};
        border-radius: ${isHighlighted ? '16px' : '12px'};
        font-weight: ${isHighlighted ? '700' : '600'};
        font-size: ${isHighlighted ? '14px' : '11px'};
        white-space: nowrap;
        box-shadow: ${isHighlighted ? '0 0 0 4px hsla(45, 89%, 55%, 0.4), 0 6px 20px rgba(0,0,0,0.5)' : '0 1px 4px rgba(0,0,0,0.2)'};
        border: ${isHighlighted ? '3px solid hsl(222, 47%, 20%)' : '1.5px solid white'};
        cursor: pointer;
        line-height: 1.2;
        transform-origin: center bottom;
      ">
        ${priceText}
      </div>
    `,
    iconSize: [size[0], size[1]],
    iconAnchor: [size[0] / 2, size[1]],
    popupAnchor: [0, -size[1] - 2],
  });
}

// Presale marker - dark navy teardrop with gold ring and building icon - with optional highlight
function createPresalePinIcon(project: PresaleProject, isHighlighted: boolean = false): L.DivIcon {
  const size = isHighlighted ? 44 : 28;
  const iconSize = isHighlighted ? 18 : 12;
  
  return L.divIcon({
    className: `custom-presale-pin ${isHighlighted ? 'marker-highlighted' : ''}`,
    html: `
      <div class="${isHighlighted ? 'bouncing' : ''}" style="
        position: relative;
        display: flex;
        flex-direction: column;
        align-items: center;
        transform-origin: center bottom;
      ">
        <div style="
          background: ${isHighlighted ? 'hsl(45, 89%, 55%)' : 'hsl(222, 47%, 20%)'};
          width: ${size}px;
          height: ${size}px;
          border-radius: 50% 50% 50% 0;
          transform: rotate(-45deg);
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: ${isHighlighted ? '0 0 0 6px hsla(45, 89%, 55%, 0.4), 0 8px 24px rgba(0,0,0,0.5)' : '0 2px 4px rgba(0,0,0,0.3)'};
          border: ${isHighlighted ? '4px solid hsl(222, 47%, 20%)' : '2px solid hsl(45, 89%, 55%)'};
          transition: all 0.2s ease;
        ">
          <svg xmlns="http://www.w3.org/2000/svg" width="${iconSize}" height="${iconSize}" viewBox="0 0 24 24" fill="${isHighlighted ? 'hsl(222, 47%, 20%)' : 'hsl(45, 89%, 55%)'}" stroke="none" style="transform: rotate(45deg);">
            <path d="M3 21h18v-2H3v2zm0-4h18v-2H3v2zm0-4h18v-2H3v2zm0-4h18V7H3v2zm0-6v2h18V3H3z"/>
          </svg>
        </div>
      </div>
    `,
    iconSize: [size, size + 6],
    iconAnchor: [size / 2, size + 6],
    popupAnchor: [0, -(size + 6)],
  });
}

// Cluster showing count only - clean circular design
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

export const CombinedListingsMap = forwardRef<CombinedListingsMapRef, CombinedListingsMapProps>(({ 
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
  savedMapState = null,
  highlightedItemId = null,
  highlightedItemType = null
}, ref) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markerClusterRef = useRef<L.MarkerClusterGroup | null>(null);
  const presaleLayerRef = useRef<L.LayerGroup | null>(null);
  const [userLocation, setUserLocation] = useState<L.LatLng | null>(null);
  const userMarkerRef = useRef<L.Marker | null>(null);
  const hasInitializedViewRef = useRef(false);
  const hasCenteredOnUserRef = useRef(false);
  const hasRestoredSavedStateRef = useRef(false);
  
  // Track markers by ID for highlighting
  const resaleMarkersMapRef = useRef<Map<string, L.Marker>>(new Map());
  const presaleMarkersMapRef = useRef<Map<string, L.Marker>>(new Map());
  const [internalHighlightId, setInternalHighlightId] = useState<string | null>(null);

  // Expose flyTo and highlight methods to parent via ref
  useImperativeHandle(ref, () => ({
    flyTo: (lat: number, lng: number, zoom?: number) => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.flyTo([lat, lng], zoom || 14, { animate: true, duration: 0.8 });
      }
    },
    highlightItem: (id: string, type: "resale" | "presale") => {
      setInternalHighlightId(id);
      // Find the marker and fly to it
      const markersMap = type === "resale" ? resaleMarkersMapRef.current : presaleMarkersMapRef.current;
      const marker = markersMap.get(id);
      if (marker && mapInstanceRef.current) {
        const latLng = marker.getLatLng();
        mapInstanceRef.current.flyTo(latLng, Math.max(mapInstanceRef.current.getZoom(), 14), { animate: true, duration: 0.6 });
      }
    },
    clearHighlight: () => {
      setInternalHighlightId(null);
    }
  }), []);

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

      // Clear old marker references
      resaleMarkersMapRef.current.clear();
      
      for (const listing of validResaleListings) {
        const baseLat = listing.latitude!;
        const baseLng = listing.longitude!;
        const key = coordKey(baseLat, baseLng);

        const dupCount = counts.get(key) || 0;
        const idx = nextIndex.get(key) || 0;
        nextIndex.set(key, idx + 1);

        const position: L.LatLngTuple = dupCount > 1 ? jitter(baseLat, baseLng, idx) : [baseLat, baseLng];

        const marker = L.marker(position, {
          icon: createResalePricePillIcon(listing, false),
        });

        // Store marker reference for highlighting
        resaleMarkersMapRef.current.set(listing.id, marker);

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

    // Clear old presale marker references
    presaleMarkersMapRef.current.clear();

    // Add presale projects as individual pins (not clustered) if mode is "all" or "presale"
    if (mode === "all" || mode === "presale") {
      for (const project of validPresaleProjects) {
        const marker = L.marker([project.map_lat!, project.map_lng!], {
          icon: createPresalePinIcon(project, false),
          zIndexOffset: 1000, // Keep presale pins above resale clusters
        });

        // Store marker reference for highlighting
        presaleMarkersMapRef.current.set(project.id, marker);

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
  }, [validResaleListings, validPresaleProjects, mode, onListingSelect, updateVisibleItems, disablePopupsOnMobile]);

  // Effect to handle highlighting of markers
  useEffect(() => {
    const highlightId = highlightedItemId || internalHighlightId;
    const highlightType = highlightedItemType || (internalHighlightId ? 
      (resaleMarkersMapRef.current.has(internalHighlightId) ? "resale" : "presale") : null);
    
    if (!highlightId || !highlightType) return;
    
    // Find the listing/project data to recreate the icon
    if (highlightType === "resale") {
      const listing = validResaleListings.find(l => l.id === highlightId);
      const marker = resaleMarkersMapRef.current.get(highlightId);
      if (listing && marker) {
        marker.setIcon(createResalePricePillIcon(listing, true));
        marker.setZIndexOffset(2000); // Bring to front
        
        // Reset after animation
        const timeout = setTimeout(() => {
          marker.setIcon(createResalePricePillIcon(listing, false));
          marker.setZIndexOffset(0);
        }, 2000);
        return () => clearTimeout(timeout);
      }
    } else if (highlightType === "presale") {
      const project = validPresaleProjects.find(p => p.id === highlightId);
      const marker = presaleMarkersMapRef.current.get(highlightId);
      if (project && marker) {
        marker.setIcon(createPresalePinIcon(project, true));
        marker.setZIndexOffset(3000); // Bring to front
        
        // Reset after animation
        const timeout = setTimeout(() => {
          marker.setIcon(createPresalePinIcon(project, false));
          marker.setZIndexOffset(1000);
        }, 2000);
        return () => clearTimeout(timeout);
      }
    }
  }, [highlightedItemId, highlightedItemType, internalHighlightId, validResaleListings, validPresaleProjects]);

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
    if (!navigator.geolocation) {
      toast.error("Geolocation is not supported by your browser");
      return;
    }
    
    toast.loading("Finding your location...", { id: "location" });
    
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const loc = L.latLng(pos.coords.latitude, pos.coords.longitude);
        setUserLocation(loc);
        updateUserLocationMarker(loc);
        mapInstanceRef.current?.setView(loc, 14, { animate: true });
        toast.success("Location found!", { id: "location" });
      },
      (error) => {
        console.log("Geolocation error:", error.message);
        if (error.code === error.PERMISSION_DENIED) {
          toast.error("Location access denied. Please enable location in your browser settings.", { id: "location" });
        } else if (error.code === error.POSITION_UNAVAILABLE) {
          toast.error("Location unavailable. Please try again.", { id: "location" });
        } else {
          toast.error("Could not get your location. Please try again.", { id: "location" });
        }
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 60000 }
    );
  };

  const handleZoomIn = () => mapInstanceRef.current?.zoomIn();
  const handleZoomOut = () => mapInstanceRef.current?.zoomOut();

  return (
    <div className="relative w-full h-full">
      <div ref={mapRef} className="w-full h-full" />
      
      {/* Custom Controls - Right side, positioned with proper spacing on mobile */}
      <div 
        className="absolute right-3 z-[900] flex flex-col gap-2"
        style={{ top: 'calc(env(safe-area-inset-top, 0px) + 130px)' }}
      >
        {/* Zoom Controls - Matching search bar style */}
        <div className="flex flex-col rounded-[14px] overflow-hidden bg-white/98 dark:bg-background/98 backdrop-blur-2xl shadow-lg shadow-black/8 border border-white/50 dark:border-white/10">
          <button
            onClick={handleZoomIn}
            className="w-10 h-10 flex items-center justify-center text-foreground hover:bg-black/5 dark:hover:bg-white/10 transition-colors active:bg-black/10 dark:active:bg-white/20"
            aria-label="Zoom in"
          >
            <Plus className="h-4 w-4" />
          </button>
          <div className="w-full h-px bg-black/8 dark:bg-white/10" />
          <button
            onClick={handleZoomOut}
            className="w-10 h-10 flex items-center justify-center text-foreground hover:bg-black/5 dark:hover:bg-white/10 transition-colors active:bg-black/10 dark:active:bg-white/20"
            aria-label="Zoom out"
          >
            <Minus className="h-4 w-4" />
          </button>
        </div>
        
        {/* Location Button - Matching search bar style */}
        <button
          onClick={handleLocateUser}
          className="w-10 h-10 rounded-[14px] bg-white/98 dark:bg-background/98 backdrop-blur-2xl shadow-lg shadow-black/8 border border-white/50 dark:border-white/10 flex items-center justify-center hover:bg-white dark:hover:bg-background transition-colors active:bg-black/5 dark:active:bg-white/10"
          aria-label="Find my location"
        >
          <Navigation2 className="h-4 w-4 text-muted-foreground/70" />
        </button>
      </div>
    </div>
  );
});

CombinedListingsMap.displayName = 'CombinedListingsMap';
