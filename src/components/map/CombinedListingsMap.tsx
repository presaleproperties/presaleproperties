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

interface CombinedListingsMapProps {
  resaleListings: MLSListing[];
  presaleProjects: PresaleProject[];
  mode: "all" | "presale" | "resale";
  onListingSelect?: (id: string, type: "resale" | "presale") => void;
  onVisibleItemsChange?: (resaleIds: string[], presaleIds: string[]) => void;
}

function formatPrice(price: number): string {
  if (price >= 1000000) {
    return `$${(price / 1000000).toFixed(1)}M`;
  }
  return `$${Math.round(price / 1000)}K`;
}

// Resale marker - yellow pill
function createResalePricePillIcon(listing: MLSListing): L.DivIcon {
  const priceText = formatPrice(listing.listing_price);
  
  return L.divIcon({
    className: "custom-price-marker resale-marker",
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
      ">
        ${priceText}
      </div>
    `,
    iconSize: [80, 28],
    iconAnchor: [40, 28],
    popupAnchor: [0, -30],
  });
}

// Presale marker - simple pin with crane/building icon (no price)
function createPresalePinIcon(): L.DivIcon {
  // Building icon for new construction
  const buildingIcon = `<svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="hsl(222, 47%, 20%)" stroke="hsl(222, 47%, 20%)" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M6 22V2l12 6v14"/><path d="M6 12H2"/><path d="M6 7H2"/><path d="M6 17H2"/><path d="M18 22V8"/><path d="M10 11h.01"/><path d="M10 15h.01"/><path d="M14 11h.01"/><path d="M14 15h.01"/></svg>`;
  
  return L.divIcon({
    className: "custom-presale-pin",
    html: `
      <div style="
        position: relative;
        width: 24px;
        height: 30px;
      ">
        <svg width="24" height="30" viewBox="0 0 24 30" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 0C5.373 0 0 5.373 0 12c0 7.5 12 18 12 18s12-10.5 12-18c0-6.627-5.373-12-12-12z" fill="hsl(222, 47%, 25%)"/>
          <circle cx="12" cy="11" r="7" fill="hsl(45, 89%, 55%)"/>
        </svg>
        <div style="
          position: absolute;
          top: 5px;
          left: 50%;
          transform: translateX(-50%);
          display: flex;
          align-items: center;
          justify-content: center;
          width: 14px;
          height: 14px;
        ">
          ${buildingIcon}
        </div>
      </div>
    `,
    iconSize: [24, 30],
    iconAnchor: [12, 30],
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
  const photoHtml = photo 
    ? `<img src="${photo}" alt="${getResaleAddress(listing)}" style="width:100%;height:100px;object-fit:cover;border-radius:8px 8px 0 0;" />`
    : `<div style="width:100%;height:80px;background:#f1f5f9;display:flex;align-items:center;justify-content:center;border-radius:8px 8px 0 0;"><span style="color:#94a3b8;">No Image</span></div>`;
  
  // Build attribution string
  const attribution = listing.list_agent_name && listing.list_office_name
    ? `${listing.list_agent_name} • ${listing.list_office_name}`
    : listing.list_agent_name || listing.list_office_name || null;
  
  return `
    <div style="width:200px;font-family:system-ui,sans-serif;">
      ${photoHtml}
      <div style="padding:10px;">
        <div style="display:flex;align-items:center;gap:6px;margin-bottom:4px;">
          <span style="background:hsl(45,89%,61%);color:hsl(222,47%,11%);font-size:9px;font-weight:700;padding:2px 6px;border-radius:4px;">MOVE-IN READY</span>
        </div>
        <div style="font-weight:700;font-size:16px;color:#1e293b;">${formatPrice(listing.listing_price)}</div>
        <div style="font-size:13px;color:#64748b;margin-top:2px;">${getResaleAddress(listing)}</div>
        <div style="font-size:12px;color:#94a3b8;">${listing.city}</div>
        <div style="display:flex;gap:10px;margin-top:6px;font-size:12px;color:#64748b;">
          ${listing.bedrooms_total ? `<span>${listing.bedrooms_total} bed</span>` : ""}
          ${listing.bathrooms_total ? `<span>${listing.bathrooms_total} bath</span>` : ""}
          ${listing.living_area ? `<span>${listing.living_area} sqft</span>` : ""}
        </div>
        ${attribution ? `<div style="font-size:10px;color:#94a3b8;margin-top:6px;border-top:1px solid #e2e8f0;padding-top:6px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">Listed by ${attribution}</div>` : ""}
        <a href="/resale/${listing.listing_key}" style="display:block;margin-top:8px;background:hsl(45, 89%, 61%);color:hsl(222, 47%, 11%);text-align:center;padding:6px;border-radius:6px;text-decoration:none;font-weight:600;font-size:13px;">View Details</a>
      </div>
    </div>
  `;
}

function presalePopupHtml(project: PresaleProject): string {
  const photo = project.featured_image;
  const photoHtml = photo 
    ? `<img src="${photo}" alt="${project.name}" style="width:100%;height:100px;object-fit:cover;border-radius:8px 8px 0 0;" />`
    : `<div style="width:100%;height:80px;background:#f1f5f9;display:flex;align-items:center;justify-content:center;border-radius:8px 8px 0 0;"><span style="color:#94a3b8;">No Image</span></div>`;
  
  const statusLabel = project.status === "active" ? "Selling Now" : 
                      project.status === "registering" ? "Registering" : 
                      project.status === "coming_soon" ? "Coming Soon" : project.status;
  
  return `
    <div style="width:200px;font-family:system-ui,sans-serif;">
      ${photoHtml}
      <div style="padding:10px;">
        <div style="display:flex;align-items:center;gap:6px;margin-bottom:4px;">
          <span style="background:hsl(222,47%,20%);color:white;font-size:9px;font-weight:700;padding:2px 6px;border-radius:4px;">PRESALE</span>
          <span style="font-size:10px;color:#64748b;">${statusLabel}</span>
        </div>
        <div style="font-weight:700;font-size:15px;color:#1e293b;">${project.name}</div>
        <div style="font-size:13px;color:#64748b;margin-top:2px;">${project.neighborhood}</div>
        <div style="font-size:12px;color:#94a3b8;">${project.city}</div>
        ${project.starting_price ? `<div style="font-weight:600;font-size:14px;color:#1e293b;margin-top:4px;">From ${formatPrice(project.starting_price)}</div>` : ""}
        <a href="/presale-projects/${project.slug}" style="display:block;margin-top:8px;background:hsl(222, 47%, 20%);color:white;text-align:center;padding:6px;border-radius:6px;text-decoration:none;font-weight:600;font-size:13px;">View Project</a>
      </div>
    </div>
  `;
}

export function CombinedListingsMap({ 
  resaleListings,
  presaleProjects,
  mode,
  onListingSelect, 
  onVisibleItemsChange 
}: CombinedListingsMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markerClusterRef = useRef<L.MarkerClusterGroup | null>(null);
  const [userLocation, setUserLocation] = useState<L.LatLng | null>(null);
  const userMarkerRef = useRef<L.Marker | null>(null);

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
      chunkDelay: 50,
      chunkInterval: 100,
      maxClusterRadius: 80, // Increased from 60 - more aggressive clustering
      spiderfyOnMaxZoom: true,
      showCoverageOnHover: false,
      disableClusteringAtZoom: 18, // Increased from 17 - cluster until very zoomed in
      animate: false,
      removeOutsideVisibleBounds: true,
      iconCreateFunction: createClusterIcon,
      spiderfyDistanceMultiplier: 1.5, // Spread out spiderfied markers more
    });

    map.addLayer(clusterGroup);
    
    mapInstanceRef.current = map;
    markerClusterRef.current = clusterGroup;

    map.on("moveend", updateVisibleItems);
    map.on("zoomend", updateVisibleItems);

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const loc = L.latLng(pos.coords.latitude, pos.coords.longitude);
          setUserLocation(loc);
        },
        () => {}
      );
    }
  }, [updateVisibleItems]);

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
    if (!map || !clusterGroup) return;

    clusterGroup.clearLayers();

    const markers: L.Marker[] = [];
    const allCoords: L.LatLngTuple[] = [];

    // Add resale listings if mode is "all" or "resale"
    if (mode === "all" || mode === "resale") {
      for (const listing of validResaleListings) {
        const marker = L.marker([listing.latitude!, listing.longitude!], {
          icon: createResalePricePillIcon(listing),
        });

        marker.bindPopup(resalePopupHtml(listing), {
          maxWidth: 220,
          minWidth: 200,
          closeButton: true,
          className: "resale-listing-popup",
        });

        marker.on("click", () => {
          onListingSelect?.(listing.id, "resale");
        });

        markers.push(marker);
        allCoords.push([listing.latitude!, listing.longitude!]);
      }
    }

    // Add presale projects if mode is "all" or "presale"
    if (mode === "all" || mode === "presale") {
      for (const project of validPresaleProjects) {
        const marker = L.marker([project.map_lat!, project.map_lng!], {
          icon: createPresalePinIcon(),
        });

        marker.bindPopup(presalePopupHtml(project), {
          maxWidth: 220,
          minWidth: 200,
          closeButton: true,
          className: "presale-project-popup",
        });

        marker.on("click", () => {
          onListingSelect?.(project.id, "presale");
        });

        markers.push(marker);
        allCoords.push([project.map_lat!, project.map_lng!]);
      }
    }

    clusterGroup.addLayers(markers);

    // Fit bounds to show all items
    if (allCoords.length > 0) {
      const bounds = L.latLngBounds(allCoords);
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 13, animate: false });
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
      
      {/* Custom Controls - Top right to avoid being covered by carousel */}
      <div className="absolute top-20 lg:top-4 right-3 z-[900] flex flex-col gap-1.5">
        <button
          onClick={handleLocateUser}
          className="w-10 h-10 rounded-full bg-background/95 backdrop-blur-sm shadow-md border border-border/40 flex items-center justify-center hover:bg-background transition-colors"
          aria-label="Find my location"
        >
          <Crosshair className="h-5 w-5 text-primary" />
        </button>
        <div className="flex flex-col rounded-full overflow-hidden bg-background/95 backdrop-blur-sm shadow-md border border-border/40">
          <button
            onClick={handleZoomIn}
            className="w-10 h-10 flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
            aria-label="Zoom in"
          >
            <Plus className="h-5 w-5" />
          </button>
          <div className="w-full h-px bg-border/50" />
          <button
            onClick={handleZoomOut}
            className="w-10 h-10 flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
            aria-label="Zoom out"
          >
            <Minus className="h-5 w-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
