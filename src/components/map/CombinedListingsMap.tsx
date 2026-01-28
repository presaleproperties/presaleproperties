import { useEffect, useMemo, useRef, useState, useCallback, forwardRef, useImperativeHandle } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet.markercluster/dist/MarkerCluster.css";
import "leaflet.markercluster/dist/MarkerCluster.Default.css";
import "leaflet.markercluster";
import { Navigation2, Plus, Minus } from "lucide-react";
import { toast } from "sonner";

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
  
  const size = isHighlighted ? [80, 32] : [60, 22];
  
  const icon = L.divIcon({
    className: `price-marker ${isHighlighted ? 'marker-hl' : ''}`,
    html: `<div class="pp${isHighlighted ? ' hl' : ''}">${priceText}</div>`,
    iconSize: [size[0], size[1]],
    iconAnchor: [size[0] / 2, size[1]],
    popupAnchor: [0, -size[1] - 2],
  });
  
  if (!isHighlighted) iconCache.set(cacheKey, icon);
  return icon;
}

function createPresalePinIcon(project: PresaleProject, isHighlighted: boolean = false): L.DivIcon {
  const cacheKey = `presale-${isHighlighted}`;
  
  const cached = iconCache.get(cacheKey);
  if (cached && !isHighlighted) return cached;
  
  const size = isHighlighted ? 44 : 28;
  
  const icon = L.divIcon({
    className: `presale-pin${isHighlighted ? ' hl' : ''}`,
    html: `<div class="pin${isHighlighted ? ' hl' : ''}"></div>`,
    iconSize: [size, size + 6],
    iconAnchor: [size / 2, size + 6],
    popupAnchor: [0, -(size + 6)],
  });
  
  if (!isHighlighted) iconCache.set(cacheKey, icon);
  return icon;
}

// Assignment marker - emerald colored pill
function createAssignmentPinIcon(assignment: Assignment, isHighlighted: boolean = false): L.DivIcon {
  const priceText = formatPrice(assignment.assignment_price);
  const cacheKey = `assignment-${priceText}-${isHighlighted}`;
  
  const cached = iconCache.get(cacheKey);
  if (cached && !isHighlighted) return cached;
  
  const size = isHighlighted ? [80, 32] : [65, 24];
  
  const icon = L.divIcon({
    className: `assignment-marker ${isHighlighted ? 'marker-hl' : ''}`,
    html: `<div class="ap${isHighlighted ? ' hl' : ''}">${priceText}</div>`,
    iconSize: [size[0], size[1]],
    iconAnchor: [size[0] / 2, size[1]],
    popupAnchor: [0, -size[1] - 2],
  });
  
  if (!isHighlighted) iconCache.set(cacheKey, icon);
  return icon;
}

function createClusterIcon(cluster: L.MarkerCluster): L.DivIcon {
  const count = cluster.getChildCount();
  const sizeClass = count >= 100 ? 'lg' : count >= 10 ? 'md' : 'sm';
  const size = count >= 100 ? 44 : count >= 10 ? 40 : 36;
  
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

function resalePopupHtml(listing: MLSListing): string {
  const photo = getResalePhoto(listing);
  const fullPrice = `$${listing.listing_price.toLocaleString()}`;
  const address = getResaleAddress(listing);
  const specs = [
    listing.bedrooms_total ? `${listing.bedrooms_total} bd` : null,
    listing.bathrooms_total ? `${listing.bathrooms_total} ba` : null,
    listing.living_area ? `${listing.living_area.toLocaleString()} sqft` : null,
  ].filter(Boolean).join(' • ');
  const propType = listing.property_sub_type || listing.property_type || '';
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
    </div>
  `;
}

function assignmentPopupHtml(assignment: Assignment, isVerified: boolean): string {
  const fullPrice = `$${assignment.assignment_price.toLocaleString()}`;
  
  if (!isVerified) {
    return `
      <div style="position:relative;">
        <div style="width:280px;font-family:system-ui,sans-serif;background:white;border-radius:10px;overflow:hidden;box-shadow:0 4px 16px rgba(0,0,0,0.18);border:2px solid #10b981;">
          <div style="padding:20px;text-align:center;">
            <div style="font-size:24px;margin-bottom:8px;">🔒</div>
            <div style="font-weight:600;font-size:14px;color:#1a1a1a;margin-bottom:4px;">Agent Access Required</div>
            <div style="font-size:12px;color:#64748b;margin-bottom:12px;">Verify as an agent to view assignment details</div>
            <a href="/for-agents" style="display:inline-block;background:#10b981;color:white;padding:8px 16px;border-radius:6px;font-size:12px;font-weight:600;text-decoration:none;">Become a Verified Agent</a>
          </div>
        </div>
      </div>
    `;
  }
  
  return `
    <div style="position:relative;">
      <a href="/assignments/${assignment.id}" style="display:block;width:280px;font-family:system-ui,sans-serif;text-decoration:none;color:inherit;background:white;border-radius:10px;overflow:hidden;box-shadow:0 4px 16px rgba(0,0,0,0.18);border:2px solid #10b981;">
        <div style="padding:14px;">
          <div style="display:flex;align-items:center;gap:8px;margin-bottom:8px;">
            <span style="background:#10b981;color:white;font-size:9px;font-weight:700;padding:3px 8px;border-radius:4px;letter-spacing:0.3px;">ASSIGNMENT</span>
          </div>
          <div style="font-weight:700;font-size:18px;color:#10b981;margin-bottom:4px;">${fullPrice}</div>
          <div style="font-weight:600;font-size:14px;color:#1a1a1a;margin-bottom:4px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${assignment.project_name}</div>
          <div style="font-size:12px;color:#64748b;margin-bottom:4px;">${assignment.neighborhood || assignment.city}</div>
          <div style="font-size:11px;color:#94a3b8;">${assignment.beds} bed • ${assignment.baths} bath</div>
        </div>
      </a>
    </div>
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
  isVerifiedAgent = false
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

  const updateVisibleItems = useCallback(() => {
    if (!mapInstanceRef.current || !onVisibleItemsChange) return;
    
    const bounds = mapInstanceRef.current.getBounds();
    
    const visibleResale = validResaleListings
      .filter(l => bounds.contains([l.latitude!, l.longitude!]))
      .map(l => l.id);
    
    const visiblePresale = validPresaleProjects
      .filter(p => bounds.contains([p.map_lat!, p.map_lng!]))
      .map(p => p.id);
    
    const visibleAssignments = validAssignments
      .filter(a => bounds.contains([a.map_lat!, a.map_lng!]))
      .map(a => a.id);
    
    onVisibleItemsChange(visibleResale, visiblePresale, visibleAssignments);
  }, [validResaleListings, validPresaleProjects, validAssignments, onVisibleItemsChange]);

  const initializeMap = useCallback(() => {
    if (!mapRef.current || mapInstanceRef.current) return;

    const initialCenter: L.LatLngExpression = savedMapState 
      ? [savedMapState.center.lat, savedMapState.center.lng]
      : DEFAULT_CENTER;
    const initialZoom = savedMapState ? savedMapState.zoom : DEFAULT_ZOOM;

    const map = L.map(mapRef.current, {
      center: initialCenter,
      zoom: initialZoom,
      zoomControl: false,
      attributionControl: true,
      preferCanvas: true,
      fadeAnimation: false,
      zoomAnimation: true,
      markerZoomAnimation: false,
    });

    L.tileLayer(TILE_URL, { 
      attribution: TILE_ATTRIBUTION,
      maxZoom: 19,
      updateWhenIdle: true,
      updateWhenZooming: false,
      keepBuffer: 2,
    }).addTo(map);

    const clusterGroup = L.markerClusterGroup({
      chunkedLoading: true,
      chunkDelay: 10,
      chunkInterval: 50,
      chunkProgress: null,
      maxClusterRadius: 40,
      spiderfyOnMaxZoom: true,
      showCoverageOnHover: false,
      disableClusteringAtZoom: 15,
      animate: false,
      animateAddingMarkers: false,
      removeOutsideVisibleBounds: true,
      singleMarkerMode: false,
      iconCreateFunction: createClusterIcon,
      spiderfyDistanceMultiplier: 1.5,
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
    const assignmentLayer = assignmentLayerRef.current;
    if (!map || !clusterGroup || !presaleLayer || !assignmentLayer) return;

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
            maxWidth: 400,
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
            maxWidth: 400,
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

    // Fit bounds on initial load
    if (allCoords.length > 0 && !hasInitializedViewRef.current) {
      const bounds = L.latLngBounds(allCoords);
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 14 });
      hasInitializedViewRef.current = true;
    }

    updateVisibleItems();
  }, [validResaleListings, validPresaleProjects, validAssignments, mode, onListingSelect, disablePopupsOnMobile, internalHighlightId, highlightedItemId, isVerifiedAgent, updateVisibleItems]);

  // Center on user location
  useEffect(() => {
    if (!mapInstanceRef.current || !initialUserLocation || hasCenteredOnUserRef.current || hasRestoredSavedStateRef.current) return;
    
    mapInstanceRef.current.setView([initialUserLocation.lat, initialUserLocation.lng], 13, { animate: true });
    hasCenteredOnUserRef.current = true;
  }, [initialUserLocation]);

  return (
    <div className="relative w-full h-full">
      <style>{`
        .price-marker, .presale-pin, .assignment-marker { background: transparent !important; border: none !important; }
        .pp { background: linear-gradient(135deg, hsl(45,89%,50%) 0%, hsl(43,96%,56%) 100%); color: hsl(222,47%,15%); padding: 3px 8px; border-radius: 12px; font-size: 11px; font-weight: 700; white-space: nowrap; box-shadow: 0 2px 8px rgba(0,0,0,0.15), 0 0 0 1.5px rgba(255,255,255,0.5); display: flex; align-items: center; justify-content: center; }
        .pp.hl { transform: scale(1.15); box-shadow: 0 4px 12px rgba(0,0,0,0.25), 0 0 0 2px hsl(45,89%,50%); }
        .pin { width: 28px; height: 34px; background: linear-gradient(180deg, hsl(222,47%,20%) 0%, hsl(222,47%,15%) 100%); border-radius: 50% 50% 50% 0; transform: rotate(-45deg); border: 2.5px solid hsl(45,89%,50%); box-shadow: 0 2px 8px rgba(0,0,0,0.2); }
        .pin.hl { width: 36px; height: 42px; border-width: 3px; box-shadow: 0 4px 12px rgba(0,0,0,0.3); }
        .ap { background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 4px 10px; border-radius: 12px; font-size: 11px; font-weight: 700; white-space: nowrap; box-shadow: 0 2px 8px rgba(0,0,0,0.15), 0 0 0 1.5px rgba(255,255,255,0.5); display: flex; align-items: center; justify-content: center; }
        .ap.hl { transform: scale(1.15); box-shadow: 0 4px 12px rgba(0,0,0,0.25), 0 0 0 2px #10b981; }
        .mc { background: transparent !important; border: none !important; }
        .cl { background: linear-gradient(135deg, hsl(222,47%,20%) 0%, hsl(222,47%,15%) 100%); color: white; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: 700; box-shadow: 0 3px 10px rgba(0,0,0,0.2), 0 0 0 2.5px hsl(45,89%,50%); }
        .cl.sm { width: 36px; height: 36px; font-size: 12px; }
        .cl.md { width: 40px; height: 40px; font-size: 13px; }
        .cl.lg { width: 44px; height: 44px; font-size: 14px; }
        .premium-popup .leaflet-popup-content-wrapper { padding: 0; border-radius: 10px; overflow: hidden; box-shadow: 0 10px 40px rgba(0,0,0,0.2); }
        .premium-popup .leaflet-popup-content { margin: 0; }
        .premium-popup .leaflet-popup-tip { display: none; }
      `}</style>
      <div ref={mapRef} className="w-full h-full z-0" />
      
      {/* Custom Controls */}
      <div className="absolute bottom-24 lg:bottom-6 right-3 z-[900] flex flex-col gap-1.5">
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
          className="w-9 h-9 rounded-full bg-background/95 backdrop-blur-sm shadow-md border border-border/40 flex items-center justify-center hover:bg-background transition-colors"
          title="Find my location"
        >
          <Navigation2 className="h-4 w-4 text-muted-foreground" />
        </button>
        <div className="flex flex-col rounded-full overflow-hidden bg-background/95 backdrop-blur-sm shadow-md border border-border/40">
          <button
            onClick={() => mapInstanceRef.current?.zoomIn()}
            className="w-9 h-9 flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
          >
            <Plus className="h-4 w-4" />
          </button>
          <div className="w-full h-px bg-border/50" />
          <button
            onClick={() => mapInstanceRef.current?.zoomOut()}
            className="w-9 h-9 flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
          >
            <Minus className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
});

CombinedListingsMap.displayName = "CombinedListingsMap";