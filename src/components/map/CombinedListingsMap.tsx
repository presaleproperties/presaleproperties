import { useEffect, useMemo, useRef, useState, useCallback, forwardRef, useImperativeHandle } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet.markercluster/dist/MarkerCluster.css";
import "leaflet.markercluster/dist/MarkerCluster.Default.css";
import "leaflet.markercluster";
import { Navigation2, Plus, Minus } from "lucide-react";
import { toast } from "sonner";
import { getListingUrl } from "@/lib/propertiesUrls";

export interface CombinedListingsMapRef {
  flyTo: (lat: number, lng: number, zoom?: number) => void;
  highlightItem: (id: string, type: "resale" | "presale" | "assignment") => void;
  clearHighlight: () => void;
}

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
  list_agent_name?: string | null;
  list_office_name?: string | null;
}

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

interface Assignment {
  id: string;
  title: string;
  project_name: string;
  city: string;
  neighborhood: string | null;
  assignment_price: number;
  beds: number;
  baths: number;
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
  assignments?: Assignment[];
  mode: "all" | "presale" | "resale" | "assignments";
  onListingSelect?: (id: string, type: "resale" | "presale" | "assignment") => void;
  onVisibleItemsChange?: (resaleIds: string[], presaleIds: string[], assignmentIds?: string[]) => void;
  onMapInteraction?: () => void;
  onMapStateChange?: (center: { lat: number; lng: number }, zoom: number) => void;
  disablePopupsOnMobile?: boolean;
  centerOnUserLocation?: boolean;
  initialUserLocation?: { lat: number; lng: number } | null;
  savedMapState?: SavedMapState | null;
  highlightedItemId?: string | null;
  highlightedItemType?: "resale" | "presale" | "assignment" | null;
  isVerifiedAgent?: boolean;
  panelOpen?: boolean;
  mobileCarouselOpen?: boolean;
}

function formatPrice(price: number): string {
  if (price >= 1000000) {
    const millions = price / 1000000;
    return millions % 1 === 0 ? `$${millions}M` : `$${millions.toFixed(1)}M`;
  }
  return `$${Math.round(price / 1000)}K`;
}

const iconCache = new Map<string, L.DivIcon>();

function createResalePricePillIcon(listing: MLSListing, isHighlighted: boolean = false): L.DivIcon {
  const priceText = formatPrice(listing.listing_price);
  const cacheKey = `resale-${priceText}-${isHighlighted}`;
  
  const cached = iconCache.get(cacheKey);
  if (cached && !isHighlighted) return cached;
  
  // Larger touch targets for mobile
  const size = isHighlighted ? [88, 36] : [72, 30];
  
  const icon = L.divIcon({
    className: `price-marker ${isHighlighted ? 'marker-hl' : ''}`,
    html: `<div class="pp${isHighlighted ? ' hl' : ''}">${priceText}</div>`,
    iconSize: [size[0], size[1]],
    iconAnchor: [size[0] / 2, size[1]],
    popupAnchor: [0, -size[1] - 4],
  });
  
  if (!isHighlighted) iconCache.set(cacheKey, icon);
  return icon;
}

function createPresalePinIcon(project: PresaleProject, isHighlighted: boolean = false): L.DivIcon {
  const cacheKey = `presale-${isHighlighted}`;
  
  const cached = iconCache.get(cacheKey);
  if (cached && !isHighlighted) return cached;
  
  // Larger pins for easier tapping
  const size = isHighlighted ? 48 : 36;
  
  const icon = L.divIcon({
    className: `presale-pin${isHighlighted ? ' hl' : ''}`,
    html: `<div class="pin${isHighlighted ? ' hl' : ''}"></div>`,
    iconSize: [size, size + 8],
    iconAnchor: [size / 2, size + 8],
    popupAnchor: [0, -(size + 8)],
  });
  
  if (!isHighlighted) iconCache.set(cacheKey, icon);
  return icon;
}

// Assignment marker - minimalistic amber dot
function createAssignmentPinIcon(assignment: Assignment, isHighlighted: boolean = false): L.DivIcon {
  const cacheKey = `assignment-dot-${isHighlighted}`;
  
  const cached = iconCache.get(cacheKey);
  if (cached && !isHighlighted) return cached;
  
  // Small circular pin
  const size = isHighlighted ? 18 : 14;
  
  const icon = L.divIcon({
    className: `assignment-marker ${isHighlighted ? 'marker-hl' : ''}`,
    html: `<div class="ap-dot${isHighlighted ? ' hl' : ''}"></div>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    popupAnchor: [0, -size / 2 - 4],
  });
  
  if (!isHighlighted) iconCache.set(cacheKey, icon);
  return icon;
}

function createClusterIcon(cluster: L.MarkerCluster): L.DivIcon {
  const count = cluster.getChildCount();
  const sizeClass = count >= 100 ? 'lg' : count >= 10 ? 'md' : 'sm';
  // Larger cluster icons for easier tapping
  const size = count >= 100 ? 52 : count >= 10 ? 46 : 40;
  
  return L.divIcon({
    html: `<div class="cl ${sizeClass}">${count}</div>`,
    className: "mc",
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

// Minimalistic popup matching grid card style
function resalePopupHtml(listing: MLSListing): string {
  const photo = getResalePhoto(listing);
  const price = `$${listing.listing_price.toLocaleString()}`;
  const address = getResaleAddress(listing);
  const specs = [
    listing.bedrooms_total ? `${listing.bedrooms_total} bd` : null,
    listing.bathrooms_total ? `${listing.bathrooms_total} ba` : null,
    listing.living_area ? `${listing.living_area.toLocaleString()} sf` : null,
  ].filter(Boolean).join(' • ');
  const propType = listing.property_sub_type || listing.property_type || '';
  const listingUrl = getListingUrl(listing.listing_key, address, listing.city);
  
  return `
    <a href="${listingUrl}" class="popup-card resale">
      <div class="popup-img">
        ${photo 
          ? `<img src="${photo}" alt="${address}" />`
          : `<div class="popup-placeholder"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9,22 9,12 15,12 15,22"/></svg></div>`
        }
        <span class="popup-badge resale">Move-In Ready</span>
      </div>
      <div class="popup-content">
        <div class="popup-price resale">${price}</div>
        <div class="popup-address">${address}</div>
        <div class="popup-specs">${specs}</div>
        ${propType ? `<div class="popup-type">${propType}</div>` : ''}
      </div>
    </a>
  `;
}

function presalePopupHtml(project: PresaleProject): string {
  const photo = project.featured_image;
  const price = project.starting_price ? `From $${project.starting_price.toLocaleString()}` : 'Price TBA';
  const statusLabel = project.status === "active" ? "Selling Now" : 
                      project.status === "registering" ? "Registering" : 
                      project.status === "coming_soon" ? "Coming Soon" : project.status;
  
  return `
    <a href="/presale-projects/${project.slug}" class="popup-card presale">
      <div class="popup-img">
        ${photo 
          ? `<img src="${photo}" alt="${project.name}" />`
          : `<div class="popup-placeholder presale"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M3 21h18"/><path d="M5 21V7l8-4v18"/><path d="M19 21V11l-6-4"/></svg></div>`
        }
        <span class="popup-badge presale">Presale</span>
      </div>
      <div class="popup-content">
        <div class="popup-price presale">${price}</div>
        <div class="popup-address">${project.name}</div>
        <div class="popup-specs">${project.neighborhood} • ${project.city}</div>
        <div class="popup-status">${project.project_type || 'Condo'} • <span class="status-label">${statusLabel}</span></div>
      </div>
    </a>
  `;
}

function assignmentPopupHtml(assignment: Assignment, isVerified: boolean): string {
  const price = `$${assignment.assignment_price.toLocaleString()}`;
  const specs = `${assignment.beds} bd • ${assignment.baths} ba`;
  
  if (!isVerified) {
    return `
      <div class="popup-card assignment locked">
        <div class="popup-lock">
          <div class="lock-icon">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
          </div>
          <div class="lock-title">Agent Access Only</div>
          <div class="lock-desc">Verify as an agent to view</div>
          <a href="/for-agents" class="lock-btn">Become Agent</a>
        </div>
      </div>
    `;
  }
  
  return `
    <a href="/assignments/${assignment.id}" class="popup-card assignment">
      <div class="popup-img">
        <div class="popup-placeholder assignment"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M3 21h18"/><path d="M5 21V7l8-4v18"/><path d="M19 21V11l-6-4"/></svg></div>
        <span class="popup-badge assignment">Assignment</span>
      </div>
      <div class="popup-content">
        <div class="popup-price assignment">${price}</div>
        <div class="popup-address">${assignment.project_name}</div>
        <div class="popup-specs">${assignment.neighborhood || assignment.city}</div>
        <div class="popup-type">${specs}</div>
      </div>
    </a>
  `;
}

export const CombinedListingsMap = forwardRef<CombinedListingsMapRef, CombinedListingsMapProps>(({ 
  resaleListings,
  presaleProjects,
  assignments = [],
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
  highlightedItemType = null,
  isVerifiedAgent = false,
  panelOpen = false,
  mobileCarouselOpen = false
}, ref) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markerClusterRef = useRef<L.MarkerClusterGroup | null>(null);
  const presaleLayerRef = useRef<L.LayerGroup | null>(null);
  const assignmentLayerRef = useRef<L.LayerGroup | null>(null);
  const [userLocation, setUserLocation] = useState<L.LatLng | null>(null);
  const userMarkerRef = useRef<L.Marker | null>(null);
  const hasInitializedViewRef = useRef(false);
  const hasCenteredOnUserRef = useRef(false);
  const hasRestoredSavedStateRef = useRef(false);
  
  const resaleMarkersMapRef = useRef<Map<string, L.Marker>>(new Map());
  const presaleMarkersMapRef = useRef<Map<string, L.Marker>>(new Map());
  const assignmentMarkersMapRef = useRef<Map<string, L.Marker>>(new Map());
  const [internalHighlightId, setInternalHighlightId] = useState<string | null>(null);

  useImperativeHandle(ref, () => ({
    flyTo: (lat: number, lng: number, zoom?: number) => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.flyTo([lat, lng], zoom || 14, { animate: true, duration: 0.8 });
      }
    },
    highlightItem: (id: string, type: "resale" | "presale" | "assignment") => {
      setInternalHighlightId(id);
      const markersMap = type === "resale" ? resaleMarkersMapRef.current : 
                         type === "presale" ? presaleMarkersMapRef.current :
                         assignmentMarkersMapRef.current;
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

  const validAssignments = useMemo(() => 
    assignments.filter(a => a.map_lat && a.map_lng),
    [assignments]
  );

  // Optimized debounced update for visible items - prevents UI lag
  const updateVisibleItemsTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastBoundsRef = useRef<string>("");
  
  const updateVisibleItems = useCallback(() => {
    if (!mapInstanceRef.current || !onVisibleItemsChange) return;
    
    // Debounce to prevent too many updates
    if (updateVisibleItemsTimeoutRef.current) {
      clearTimeout(updateVisibleItemsTimeoutRef.current);
    }
    
    updateVisibleItemsTimeoutRef.current = setTimeout(() => {
      if (!mapInstanceRef.current) return;
      
      const bounds = mapInstanceRef.current.getBounds();
      
      // Skip if bounds haven't changed significantly (performance optimization)
      const boundsKey = `${bounds.getNorth().toFixed(3)},${bounds.getSouth().toFixed(3)},${bounds.getEast().toFixed(3)},${bounds.getWest().toFixed(3)}`;
      if (boundsKey === lastBoundsRef.current) return;
      lastBoundsRef.current = boundsKey;
      
      // Use requestIdleCallback for non-critical UI updates
      const computeVisible = () => {
        if (!mapInstanceRef.current) return;
        
        const visibleResale = validResaleListings
          .filter(l => bounds.contains([l.latitude!, l.longitude!]))
          .map(l => l.id);
        
        const visiblePresale = validPresaleProjects
          .filter(p => bounds.contains([p.map_lat!, p.map_lng!]))
          .map(p => p.id);
        
        const visibleAssignmentsIds = validAssignments
          .filter(a => bounds.contains([a.map_lat!, a.map_lng!]))
          .map(a => a.id);
        
        onVisibleItemsChange(visibleResale, visiblePresale, visibleAssignmentsIds);
      };
      
      // Use requestIdleCallback if available, otherwise use setTimeout
      if ('requestIdleCallback' in window) {
        (window as any).requestIdleCallback(computeVisible, { timeout: 100 });
      } else {
        computeVisible();
      }
    }, 200); // 200ms debounce for smoother experience
  }, [validResaleListings, validPresaleProjects, validAssignments, onVisibleItemsChange]);

  const initializeMap = useCallback(() => {
    if (!mapRef.current || mapInstanceRef.current) return;

    const initialCenter: L.LatLngExpression = savedMapState 
      ? [savedMapState.center.lat, savedMapState.center.lng]
      : DEFAULT_CENTER;
    const initialZoom = savedMapState ? savedMapState.zoom : DEFAULT_ZOOM;
    
    // When restoring from saved state, skip animations for instant display
    const isRestoringState = !!savedMapState;

    // Smooth, Google Maps-like map initialization
    const map = L.map(mapRef.current, {
      center: initialCenter,
      zoom: initialZoom,
      zoomControl: false,
      attributionControl: true,
      preferCanvas: true,
      // Disable animations on restore for instant view, enable for normal use
      fadeAnimation: !isRestoringState,
      zoomAnimation: !isRestoringState,
      markerZoomAnimation: !isRestoringState,
      zoomAnimationThreshold: 4,
      inertia: true,
      inertiaDeceleration: 2000,
      easeLinearity: 0.25,
      worldCopyJump: false,
      maxBoundsViscosity: 0.8,
      touchZoom: 'center',
      bounceAtZoomLimits: false,
    });
    
    // Re-enable animations after initial render for smooth interactions
    if (isRestoringState) {
      requestAnimationFrame(() => {
        map.options.fadeAnimation = true;
        map.options.zoomAnimation = true;
        map.options.markerZoomAnimation = true;
      });
    }

    // Optimized tile layer with faster loading
    const tileLayer = L.tileLayer(TILE_URL, { 
      attribution: TILE_ATTRIBUTION,
      maxZoom: 19,
      updateWhenIdle: false,
      updateWhenZooming: true,
      keepBuffer: 8, // Larger buffer for seamless panning
      crossOrigin: true,
    });
    
    // Preload tiles for the current view immediately
    tileLayer.addTo(map);
    
    // Skip animations for markers when restoring state
    const skipMarkerAnimation = isRestoringState;

    // Optimized cluster settings for fast rendering
    const clusterGroup = L.markerClusterGroup({
      chunkedLoading: true,
      chunkDelay: 5, // Faster chunking
      chunkInterval: 25, // Faster interval
      maxClusterRadius: 50,
      spiderfyOnMaxZoom: true,
      showCoverageOnHover: false,
      disableClusteringAtZoom: 17,
      animate: !skipMarkerAnimation, // Skip animation on restore
      animateAddingMarkers: false,
      removeOutsideVisibleBounds: true,
      singleMarkerMode: false,
      iconCreateFunction: createClusterIcon,
      spiderfyDistanceMultiplier: 1.5,
      zoomToBoundsOnClick: true,
      spiderLegPolylineOptions: { weight: 1.5, color: 'hsl(222, 47%, 60%)', opacity: 0.5 },
    });

    const presaleLayer = L.layerGroup();
    const assignmentLayer = L.layerGroup();

    map.addLayer(clusterGroup);
    map.addLayer(presaleLayer);
    map.addLayer(assignmentLayer);
    
    mapInstanceRef.current = map;
    markerClusterRef.current = clusterGroup;
    presaleLayerRef.current = presaleLayer;
    assignmentLayerRef.current = assignmentLayer;

    if (savedMapState) {
      hasInitializedViewRef.current = true;
      hasRestoredSavedStateRef.current = true;
    }

    // Throttled event handlers
    map.on("moveend", updateVisibleItems);
    map.on("zoomend", updateVisibleItems);
    
    map.on("movestart", () => {
      if (onMapInteraction) onMapInteraction();
    });
    
    map.on("moveend", () => {
      if (onMapStateChange && mapInstanceRef.current) {
        const center = mapInstanceRef.current.getCenter();
        const zoom = mapInstanceRef.current.getZoom();
        onMapStateChange({ lat: center.lat, lng: center.lng }, zoom);
      }
    });
  }, [updateVisibleItems, savedMapState, onMapInteraction, onMapStateChange]);

  useEffect(() => {
    initializeMap();
    return () => {
      // Clean up debounce timeout
      if (updateVisibleItemsTimeoutRef.current) {
        clearTimeout(updateVisibleItemsTimeoutRef.current);
      }
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [initializeMap]);

  // Track data changes to prevent unnecessary marker rebuilds
  const dataHashRef = useRef<string>("");
  const lastModeRef = useRef<string>(mode);
  
  // Update markers when data or mode changes - optimized to minimize re-renders
  useEffect(() => {
    const map = mapInstanceRef.current;
    const clusterGroup = markerClusterRef.current;
    const presaleLayer = presaleLayerRef.current;
    const assignmentLayer = assignmentLayerRef.current;
    if (!map || !clusterGroup || !presaleLayer || !assignmentLayer) return;

    // Create a robust hash using first/last IDs to detect actual data changes
    const resaleIds = validResaleListings.slice(0, 3).map(l => l.id).join(',');
    const presaleIds = validPresaleProjects.slice(0, 3).map(p => p.id).join(',');
    const assignmentIds = validAssignments.slice(0, 3).map(a => a.id).join(',');
    
    const currentHash = `${mode}-${validResaleListings.length}-${resaleIds}-${validPresaleProjects.length}-${presaleIds}-${validAssignments.length}-${assignmentIds}`;
    
    // Skip rebuild if data hasn't changed (performance optimization for back navigation)
    // Only skip if we have markers AND mode hasn't changed AND data is the same
    if (currentHash === dataHashRef.current && 
        mode === lastModeRef.current &&
        (resaleMarkersMapRef.current.size > 0 || presaleMarkersMapRef.current.size > 0 || assignmentMarkersMapRef.current.size > 0)) {
      // Still need to update highlighted state without rebuilding
      return;
    }
    
    dataHashRef.current = currentHash;
    lastModeRef.current = mode;

    clusterGroup.clearLayers();
    presaleLayer.clearLayers();
    assignmentLayer.clearLayers();
    resaleMarkersMapRef.current.clear();
    presaleMarkersMapRef.current.clear();
    assignmentMarkersMapRef.current.clear();

    const allCoords: L.LatLngTuple[] = [];

    // Add resale listings
    if (mode === "all" || mode === "resale") {
      const seen = new Map<string, MLSListing>();
      validResaleListings.forEach(l => {
        const key = `${l.latitude?.toFixed(5)}-${l.longitude?.toFixed(5)}`;
        if (!seen.has(key) || l.listing_price > (seen.get(key)?.listing_price || 0)) {
          seen.set(key, l);
        }
      });
      
      seen.forEach((listing) => {
        const isHighlighted = internalHighlightId === listing.id || highlightedItemId === listing.id;
        const marker = L.marker([listing.latitude!, listing.longitude!], {
          icon: createResalePricePillIcon(listing, isHighlighted),
        });

        if (!disablePopupsOnMobile) {
          marker.bindPopup(resalePopupHtml(listing), {
            maxWidth: 300,
            className: "premium-popup resale-popup",
            closeButton: true,
          });
        }

        marker.on("click", () => {
          onListingSelect?.(listing.id, "resale");
        });

        resaleMarkersMapRef.current.set(listing.id, marker);
        clusterGroup.addLayer(marker);
        allCoords.push([listing.latitude!, listing.longitude!]);
      });
    }

    // Add presale projects
    if (mode === "all" || mode === "presale") {
      validPresaleProjects.forEach((project) => {
        const isHighlighted = internalHighlightId === project.id || highlightedItemId === project.id;
        const marker = L.marker([project.map_lat!, project.map_lng!], {
          icon: createPresalePinIcon(project, isHighlighted),
        });

        if (!disablePopupsOnMobile) {
          marker.bindPopup(presalePopupHtml(project), {
            maxWidth: 300,
            className: "premium-popup presale-popup",
            closeButton: true,
          });
        }

        marker.on("click", () => {
          onListingSelect?.(project.id, "presale");
        });

        presaleMarkersMapRef.current.set(project.id, marker);
        presaleLayer.addLayer(marker);
        allCoords.push([project.map_lat!, project.map_lng!]);
      });
    }

    // Add assignments
    if (mode === "all" || mode === "assignments") {
      validAssignments.forEach((assignment) => {
        const isHighlighted = internalHighlightId === assignment.id || highlightedItemId === assignment.id;
        const marker = L.marker([assignment.map_lat!, assignment.map_lng!], {
          icon: createAssignmentPinIcon(assignment, isHighlighted),
        });

        if (!disablePopupsOnMobile) {
          marker.bindPopup(assignmentPopupHtml(assignment, isVerifiedAgent), {
            maxWidth: 300,
            className: "premium-popup assignment-popup",
            closeButton: true,
          });
        }

        marker.on("click", () => {
          onListingSelect?.(assignment.id, "assignment");
        });

        assignmentMarkersMapRef.current.set(assignment.id, marker);
        assignmentLayer.addLayer(marker);
        allCoords.push([assignment.map_lat!, assignment.map_lng!]);
      });
    }

    // Fit bounds on initial load - ONLY if no saved state (don't override user's position)
    if (allCoords.length > 0 && !hasInitializedViewRef.current && !hasRestoredSavedStateRef.current) {
      const bounds = L.latLngBounds(allCoords);
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 14 });
      hasInitializedViewRef.current = true;
    } else if (hasRestoredSavedStateRef.current) {
      // Mark as initialized but don't fit bounds - user's saved position is already set
      hasInitializedViewRef.current = true;
    }

    // Defer visible items update to next frame for smoother rendering
    requestAnimationFrame(() => {
      updateVisibleItems();
    });
  }, [validResaleListings, validPresaleProjects, validAssignments, mode, onListingSelect, disablePopupsOnMobile, internalHighlightId, highlightedItemId, isVerifiedAgent, updateVisibleItems]);

  // Center on user location
  useEffect(() => {
    if (!mapInstanceRef.current || !initialUserLocation || hasCenteredOnUserRef.current || hasRestoredSavedStateRef.current) return;
    
    mapInstanceRef.current.setView([initialUserLocation.lat, initialUserLocation.lng], 13, { animate: true });
    hasCenteredOnUserRef.current = true;
  }, [initialUserLocation]);

  return (
    <div className="relative w-full h-full bg-muted" style={{ contain: 'layout style paint', willChange: 'transform' }}>
      <style>{`
        /* GPU acceleration and prevent flash */
        .leaflet-container { 
          -webkit-transform: translate3d(0,0,0); 
          transform: translate3d(0,0,0);
          -webkit-backface-visibility: hidden;
          backface-visibility: hidden;
          font-family: 'Plus Jakarta Sans', system-ui, -apple-system, sans-serif;
          background: hsl(var(--muted)) !important;
        }
        .leaflet-tile-container { 
          -webkit-transform: translate3d(0,0,0); 
          transform: translate3d(0,0,0);
        }
        .leaflet-tile { 
          -webkit-backface-visibility: hidden;
          backface-visibility: hidden;
          transition: opacity 0.15s ease-out;
        }
        .leaflet-tile-loaded { opacity: 1 !important; }
        
        /* Base marker reset */
        .price-marker, .presale-pin, .assignment-marker { background: transparent !important; border: none !important; }
        
        /* Resale price pills - clean and subtle */
        .pp { 
          background: hsl(45, 89%, 52%); 
          color: hsl(222, 47%, 12%); 
          padding: 5px 10px; 
          border-radius: 16px; 
          font-size: 12px; 
          font-weight: 700; 
          white-space: nowrap; 
          box-shadow: 0 2px 6px rgba(0,0,0,0.12); 
          display: flex; 
          align-items: center; 
          justify-content: center; 
          transition: transform 0.15s ease, box-shadow 0.15s ease;
          min-height: 28px;
          cursor: pointer;
        }
        .pp:hover, .pp.hl { 
          transform: scale(1.08); 
          box-shadow: 0 4px 12px rgba(0,0,0,0.18); 
        }
        
        /* Presale pins - subtle, professional */
        .pin { 
          width: 32px; 
          height: 38px; 
          background: hsl(222, 47%, 22%); 
          border-radius: 50% 50% 50% 0; 
          transform: rotate(-45deg); 
          border: 2px solid hsl(45, 89%, 52%); 
          box-shadow: 0 2px 6px rgba(0,0,0,0.15);
          transition: transform 0.15s ease, box-shadow 0.15s ease;
          cursor: pointer;
        }
        .pin:hover, .pin.hl { 
          width: 36px; 
          height: 42px; 
          box-shadow: 0 3px 10px rgba(0,0,0,0.2); 
        }
        
        /* Assignment dots - minimalistic amber */
        .ap-dot { 
          width: 12px;
          height: 12px;
          background: #f59e0b; 
          border: 2px solid white;
          border-radius: 50%; 
          box-shadow: 0 1px 4px rgba(0,0,0,0.2); 
          transition: transform 0.15s ease, box-shadow 0.15s ease;
          cursor: pointer;
        }
        .ap-dot:hover, .ap-dot.hl { 
          transform: scale(1.3); 
          box-shadow: 0 2px 8px rgba(245, 158, 11, 0.4); 
        }
        
        /* Cluster icons - clean Google Maps style */
        .mc { background: transparent !important; border: none !important; }
        .cl { 
          background: hsl(222, 47%, 22%); 
          color: white; 
          border-radius: 50%; 
          display: flex; 
          align-items: center; 
          justify-content: center; 
          font-weight: 700; 
          box-shadow: 0 2px 8px rgba(0,0,0,0.15); 
          border: 2px solid hsl(45, 89%, 52%);
          transition: transform 0.15s ease;
          cursor: pointer;
        }
        .cl:hover { transform: scale(1.1); }
        .cl.sm { width: 40px; height: 40px; font-size: 13px; }
        .cl.md { width: 46px; height: 46px; font-size: 14px; }
        .cl.lg { width: 52px; height: 52px; font-size: 15px; }
        
        /* Popup styling - clean cards */
        .premium-popup .leaflet-popup-content-wrapper { 
          padding: 0; 
          border-radius: 12px; 
          overflow: hidden; 
          box-shadow: 0 8px 24px rgba(0,0,0,0.12); 
          background: white; 
          border: 1px solid hsl(220, 13%, 91%);
        }
        .premium-popup .leaflet-popup-content { margin: 0; width: auto !important; }
        .premium-popup .leaflet-popup-tip { background: white; border: 1px solid hsl(220, 13%, 91%); border-top: none; border-left: none; }
        .premium-popup .leaflet-popup-close-button { 
          top: 8px !important; 
          right: 8px !important; 
          width: 24px !important; 
          height: 24px !important; 
          background: rgba(255,255,255,0.95) !important; 
          backdrop-filter: blur(4px); 
          border-radius: 50% !important; 
          box-shadow: 0 1px 4px rgba(0,0,0,0.1); 
          display: flex !important; 
          align-items: center !important; 
          justify-content: center !important; 
          font-size: 14px !important; 
          color: #64748b !important; 
          font-weight: 400 !important; 
          z-index: 10; 
          line-height: 1;
        }
        .premium-popup .leaflet-popup-close-button:hover { 
          color: #1e293b !important; 
          background: white !important; 
        }
        
        /* Popup card layout */
        .popup-card { display: flex; width: 280px; text-decoration: none; color: inherit; font-family: inherit; border-radius: 12px; overflow: hidden; background: white; }
        .popup-card.resale { border: none; }
        .popup-card.presale { border: none; }
        .popup-card.assignment { border-left: 3px solid #f59e0b; }
        .popup-card.locked { display: block; width: 240px; }
        
        /* Image section */
        .popup-img { position: relative; width: 100px; min-height: 100px; flex-shrink: 0; background: #f8fafc; }
        .popup-img img { width: 100%; height: 100%; object-fit: cover; display: block; }
        .popup-placeholder { width: 100%; height: 100%; min-height: 100px; display: flex; align-items: center; justify-content: center; color: #94a3b8; background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%); }
        .popup-placeholder.presale { background: linear-gradient(135deg, hsl(45, 89%, 97%) 0%, hsl(45, 89%, 92%) 100%); color: hsl(45, 89%, 45%); }
        .popup-placeholder.assignment { background: linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%); color: #f59e0b; }
        
        /* Badges */
        .popup-badge { position: absolute; top: 6px; left: 6px; font-size: 9px; font-weight: 600; padding: 3px 7px; border-radius: 4px; text-transform: uppercase; letter-spacing: 0.3px; }
        .popup-badge.resale { background: hsl(220, 14%, 96%); color: hsl(220, 25%, 25%); }
        .popup-badge.presale { background: hsl(45, 89%, 52%); color: hsl(222, 47%, 12%); }
        .popup-badge.assignment { background: #f59e0b; color: white; }
        
        /* Content */
        .popup-content { flex: 1; padding: 12px; display: flex; flex-direction: column; justify-content: center; min-width: 0; }
        .popup-price { font-weight: 700; font-size: 17px; margin-bottom: 4px; letter-spacing: -0.3px; color: hsl(220, 25%, 10%); }
        .popup-price.assignment { color: #d97706; }
        .popup-address { font-weight: 600; font-size: 13px; color: hsl(220, 25%, 15%); margin-bottom: 3px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .popup-specs { font-size: 12px; color: hsl(220, 10%, 45%); margin-bottom: 2px; }
        .popup-type { font-size: 11px; color: hsl(220, 10%, 55%); }
        .popup-status { font-size: 11px; color: hsl(220, 10%, 45%); }
        .popup-status .status-label { font-weight: 600; color: hsl(45, 89%, 42%); }
        
        /* Locked assignment */
        .popup-lock { padding: 20px; text-align: center; }
        .lock-icon { width: 40px; height: 40px; background: linear-gradient(135deg, #fffbeb, #fef3c7); border-radius: 12px; display: flex; align-items: center; justify-content: center; margin: 0 auto 12px; color: #f59e0b; }
        .lock-title { font-weight: 600; font-size: 14px; color: hsl(220, 25%, 10%); margin-bottom: 4px; }
        .lock-desc { font-size: 12px; color: hsl(220, 10%, 45%); margin-bottom: 14px; }
        .lock-btn { display: inline-block; background: #f59e0b; color: white; padding: 10px 18px; border-radius: 8px; font-size: 12px; font-weight: 600; text-decoration: none; transition: background 0.15s; }
        .lock-btn:hover { background: #d97706; }
        
        /* Smooth marker cluster animations */
        .marker-cluster-anim .leaflet-marker-icon,
        .marker-cluster-anim .leaflet-marker-shadow {
          transition: transform 0.25s ease-out, opacity 0.25s ease-out;
        }
      `}</style>
      <div ref={mapRef} className="w-full h-full z-0" style={{ willChange: 'transform' }} />
      
      {/* Custom Controls - Compact on mobile/tablet, positioned to avoid carousel */}
      <div 
        className={`absolute right-2 lg:right-3 z-[900] flex flex-col gap-0.5 lg:gap-1.5 transition-all duration-300 lg:bottom-6 ${
          panelOpen ? 'lg:right-[456px]' : 'lg:right-3'
        }`}
        style={{
          // Keep controls above the mobile/tablet carousel (and above safe-area)
          bottom: mobileCarouselOpen
            ? 'calc(env(safe-area-inset-bottom, 0px) + 280px)'
            : 'calc(env(safe-area-inset-bottom, 0px) + 72px)'
        }}
      >
        <div className="flex flex-col rounded-full overflow-hidden bg-background/95 backdrop-blur-sm shadow-md border border-border/40">
          <button
            onClick={() => mapInstanceRef.current?.zoomIn()}
            className="w-5 h-5 lg:w-9 lg:h-9 flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
          >
            <Plus className="h-2.5 w-2.5 lg:h-4 lg:w-4" />
          </button>
          <div className="w-full h-px bg-border/50" />
          <button
            onClick={() => mapInstanceRef.current?.zoomOut()}
            className="w-5 h-5 lg:w-9 lg:h-9 flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
          >
            <Minus className="h-2.5 w-2.5 lg:h-4 lg:w-4" />
          </button>
        </div>
        <button
          onClick={() => {
            if (navigator.geolocation) {
              navigator.geolocation.getCurrentPosition(
                (pos) => {
                  mapInstanceRef.current?.setView([pos.coords.latitude, pos.coords.longitude], 14, { animate: true });
                },
                () => toast.error("Could not get your location")
              );
            }
          }}
          className="w-5 h-5 lg:w-9 lg:h-9 rounded-full bg-background/95 backdrop-blur-sm shadow-md border border-border/40 flex items-center justify-center hover:bg-background transition-colors"
          title="Find my location"
        >
          <Navigation2 className="h-2.5 w-2.5 lg:h-4 lg:w-4 text-muted-foreground" />
        </button>
      </div>
    </div>
  );
});

CombinedListingsMap.displayName = "CombinedListingsMap";