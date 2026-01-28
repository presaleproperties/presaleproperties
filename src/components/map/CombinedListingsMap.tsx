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
  highlightItem: (id: string, type: "resale" | "presale" | "assignment") => void;
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

// Assignment listing type
interface Assignment {
  id: string;
  title: string;
  project_name: string;
  city: string;
  neighborhood: string | null;
  assignment_price: number;
  original_price: number | null;
  beds: number;
  baths: number;
  interior_sqft: number | null;
  map_lat: number | null;
  map_lng: number | null;
  listing_photos?: { url: string; sort_order: number | null }[];
}

// Rental listing type (from MLS with rental-specific fields)
interface RentalListing {
  id: string;
  listing_key: string;
  lease_amount: number | null;
  city: string;
  neighborhood: string | null;
  street_number: string | null;
  street_name: string | null;
  street_suffix: string | null;
  property_type: string;
  property_sub_type: string | null;
  bedrooms_total: number | null;
  bathrooms_total: number | null;
  living_area: number | null;
  latitude: number | null;
  longitude: number | null;
  photos: any;
  mls_status: string;
  pets_allowed: string | null;
  furnished: string | null;
  availability_date: string | null;
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
  rentals?: RentalListing[];
  isVerifiedAgent?: boolean;
  mode: "all" | "presale" | "resale" | "assignments" | "rental";
  onListingSelect?: (id: string, type: "resale" | "presale" | "assignment" | "rental") => void;
  onVisibleItemsChange?: (resaleIds: string[], presaleIds: string[], assignmentIds?: string[], rentalIds?: string[]) => void;
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
  highlightedItemType?: "resale" | "presale" | "rental" | null;
}

function formatPrice(price: number): string {
  if (price >= 1000000) {
    const millions = price / 1000000;
    return millions % 1 === 0 ? `$${millions}M` : `$${millions.toFixed(1)}M`;
  }
  return `$${Math.round(price / 1000)}K`;
}

// Icon cache for performance - avoid recreating identical icons
const iconCache = new Map<string, L.DivIcon>();

// Gold price pill - brand style, compact - with optional highlight
function createResalePricePillIcon(listing: MLSListing, isHighlighted: boolean = false): L.DivIcon {
  const priceText = formatPrice(listing.listing_price);
  const cacheKey = `resale-${priceText}-${isHighlighted}`;
  
  const cached = iconCache.get(cacheKey);
  if (cached && !isHighlighted) return cached; // Only cache non-highlighted
  
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

// Presale marker - dark navy teardrop with gold ring and building icon - with optional highlight
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

// Assignment marker - purple price pill with lock icon for non-agents, full price for agents
function createAssignmentMarkerIcon(assignment: Assignment, isVerifiedAgent: boolean, isHighlighted: boolean = false): L.DivIcon {
  const priceText = isVerifiedAgent ? formatPrice(assignment.assignment_price) : '🔒';
  const cacheKey = `assignment-${isVerifiedAgent}-${isVerifiedAgent ? priceText : 'locked'}-${isHighlighted}`;
  
  const cached = iconCache.get(cacheKey);
  if (cached && !isHighlighted) return cached;
  
  const size = isHighlighted ? [80, 32] : [60, 24];
  
  const icon = L.divIcon({
    className: `assignment-marker ${isHighlighted ? 'marker-hl' : ''}`,
    html: `<div class="ap${isHighlighted ? ' hl' : ''}${!isVerifiedAgent ? ' locked' : ''}">${priceText}</div>`,
    iconSize: [size[0], size[1]],
    iconAnchor: [size[0] / 2, size[1]],
    popupAnchor: [0, -size[1] - 2],
  });
  
  if (!isHighlighted) iconCache.set(cacheKey, icon);
  return icon;
}

// Rental price pill - emerald green with /mo suffix - matches brand style
function createRentalPricePillIcon(rental: RentalListing, isHighlighted: boolean = false): L.DivIcon {
  const leaseAmount = rental.lease_amount || 0;
  const priceText = `$${Math.round(leaseAmount).toLocaleString()}/mo`;
  const cacheKey = `rental-${priceText}-${isHighlighted}`;
  
  const cached = iconCache.get(cacheKey);
  if (cached && !isHighlighted) return cached;
  
  const size = isHighlighted ? [90, 32] : [70, 22];
  
  const icon = L.divIcon({
    className: `rental-marker ${isHighlighted ? 'marker-hl' : ''}`,
    html: `<div class="rp${isHighlighted ? ' hl' : ''}">${priceText}</div>`,
    iconSize: [size[0], size[1]],
    iconAnchor: [size[0] / 2, size[1]],
    popupAnchor: [0, -size[1] - 2],
  });
  
  if (!isHighlighted) iconCache.set(cacheKey, icon);
  return icon;
}

// Cluster showing count only - clean circular design (optimized)
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

// Assignment popup HTML - full details for verified agents, blurred for others
function assignmentPopupHtml(assignment: Assignment, isVerifiedAgent: boolean): string {
  const photo = assignment.listing_photos?.[0]?.url;
  
  if (!isVerifiedAgent) {
    // Fully blurred popup for non-agents - photo completely obscured
    const photoHtml = photo 
      ? `<div style="width:100%;height:100%;position:relative;overflow:hidden;background:#f3e8e4;">
          <img src="${photo}" alt="" style="width:100%;height:100%;object-fit:cover;filter:blur(20px) saturate(0.3);transform:scale(1.3);opacity:0.5;" />
          <div style="position:absolute;inset:0;background:linear-gradient(135deg,rgba(234,88,12,0.3),rgba(194,65,12,0.2));"></div>
        </div>` 
      : '<div style="width:100%;height:100%;background:linear-gradient(135deg,hsl(18,50%,90%),hsl(18,40%,85%));"></div>';
    
    return `
      <div style="position:relative;">
        <div style="display:flex;width:380px;font-family:system-ui,sans-serif;background:white;border-radius:10px;overflow:hidden;box-shadow:0 4px 16px rgba(0,0,0,0.18);border:2px solid hsl(18,85%,50%);">
          <div style="flex-shrink:0;position:relative;width:160px;min-height:120px;overflow:hidden;">
            ${photoHtml}
            <div style="position:absolute;inset:0;background:rgba(255,255,255,0.85);backdrop-filter:blur(4px);display:flex;flex-direction:column;align-items:center;justify-content:center;">
              <div style="width:44px;height:44px;border-radius:50%;background:linear-gradient(135deg,hsl(18,85%,55%),hsl(15,80%,45%));display:flex;align-items:center;justify-content:center;margin-bottom:6px;box-shadow:0 4px 12px hsla(18,85%,50%,0.4);">
                <span style="font-size:20px;">🔒</span>
              </div>
              <span style="font-size:10px;font-weight:700;color:hsl(18,85%,40%);text-transform:uppercase;letter-spacing:0.5px;">Agent Only</span>
            </div>
            <span style="position:absolute;top:6px;left:6px;background:linear-gradient(135deg,hsl(18,85%,50%),hsl(15,80%,45%));color:white;font-size:9px;font-weight:700;padding:4px 10px;border-radius:6px;letter-spacing:0.3px;z-index:10;">ASSIGNMENT</span>
          </div>
          <div style="flex:1;padding:14px 16px;display:flex;flex-direction:column;justify-content:center;min-width:0;">
            <div style="font-weight:700;font-size:18px;color:hsl(18,85%,40%);margin-bottom:6px;display:flex;align-items:center;gap:6px;">
              <span>🔒</span> $XXX,XXX
            </div>
            <div style="height:14px;width:75%;background:linear-gradient(90deg,#e2e8f0,#f1f5f9,#e2e8f0);border-radius:4px;margin-bottom:6px;"></div>
            <div style="height:12px;width:55%;background:#f1f5f9;border-radius:4px;margin-bottom:10px;"></div>
            <a href="/for-agents" onclick="event.stopPropagation();" style="display:inline-flex;align-items:center;justify-content:center;gap:6px;background:linear-gradient(135deg,hsl(18,85%,50%),hsl(15,80%,45%));color:white;font-size:11px;font-weight:600;padding:10px 14px;border-radius:8px;text-decoration:none;box-shadow:0 2px 8px hsla(18,85%,50%,0.3);transition:transform 0.2s,box-shadow 0.2s;">
              🔒 Login to View Details
            </a>
          </div>
        </div>
        <div style="position:absolute;bottom:-10px;left:50%;transform:translateX(-50%);width:0;height:0;border-left:10px solid transparent;border-right:10px solid transparent;border-top:10px solid hsl(18,85%,50%);"></div>
      </div>
    `;
  }
  
  // Full popup for verified agents - matching presale/resale style
  const fullPrice = `$${assignment.assignment_price.toLocaleString()}`;
  const savings = assignment.original_price ? assignment.original_price - assignment.assignment_price : null;
  const specs = [
    `${assignment.beds} bd`,
    `${assignment.baths} ba`,
    assignment.interior_sqft ? `${assignment.interior_sqft.toLocaleString()} sqft` : null,
  ].filter(Boolean).join(' • ');
  
  const photoHtml = photo 
    ? `<img src="${photo}" alt="${assignment.title}" style="width:160px;height:100%;min-height:120px;object-fit:cover;border-radius:0;" loading="eager" />`
    : `<div style="width:160px;min-height:120px;background:linear-gradient(135deg,hsl(18,50%,95%),hsl(18,40%,90%));display:flex;align-items:center;justify-content:center;"><span style="color:hsl(18,85%,50%);font-size:11px;">No Image</span></div>`;
  
  const savingsHtml = savings && savings > 0 ? `<span style="position:absolute;top:6px;right:6px;background:#16a34a;color:white;font-size:9px;font-weight:700;padding:3px 8px;border-radius:4px;">Save $${Math.round(savings/1000)}K</span>` : '';
  
  return `
    <div style="position:relative;">
      <a href="/assignments/${assignment.id}" style="display:flex;width:380px;font-family:system-ui,sans-serif;text-decoration:none;color:inherit;background:white;border-radius:10px;overflow:hidden;box-shadow:0 4px 16px rgba(0,0,0,0.18);border:2px solid hsl(18,85%,50%);">
        <div style="flex-shrink:0;position:relative;">
          ${photoHtml}
          <span style="position:absolute;top:6px;left:6px;background:hsl(18,85%,50%);color:white;font-size:9px;font-weight:700;padding:3px 8px;border-radius:4px;letter-spacing:0.3px;">ASSIGNMENT</span>
          ${savingsHtml}
        </div>
        <div style="flex:1;padding:12px 14px;display:flex;flex-direction:column;justify-content:center;min-width:0;">
          <div style="font-weight:700;font-size:18px;color:hsl(18,85%,40%);margin-bottom:4px;">${fullPrice}</div>
          <div style="font-size:13px;color:#475569;margin-bottom:4px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${assignment.project_name}</div>
          <div style="font-size:12px;color:#64748b;margin-bottom:2px;">${specs}</div>
          <div style="font-size:11px;color:#64748b;">${assignment.neighborhood || assignment.city}</div>
        </div>
      </a>
      <div style="position:absolute;bottom:-10px;left:50%;transform:translateX(-50%);width:0;height:0;border-left:10px solid transparent;border-right:10px solid transparent;border-top:10px solid hsl(18,85%,50%);"></div>
    </div>
  `;
}

// Rental popup HTML - emerald green theme matching site branding
function rentalPopupHtml(rental: RentalListing): string {
  const photo = rental.photos && Array.isArray(rental.photos) && rental.photos.length > 0 
    ? rental.photos[0]?.MediaURL || null 
    : null;
  const fullPrice = rental.lease_amount ? `$${rental.lease_amount.toLocaleString()}/mo` : 'Contact for Price';
  const address = [rental.street_number, rental.street_name, rental.street_suffix].filter(Boolean).join(" ") || rental.neighborhood || rental.city;
  
  const specs = [
    rental.bedrooms_total ? `${rental.bedrooms_total} bd` : null,
    rental.bathrooms_total ? `${rental.bathrooms_total} ba` : null,
    rental.living_area ? `${rental.living_area.toLocaleString()} sqft` : null,
  ].filter(Boolean).join(' • ');
  
  const features = [];
  if (rental.pets_allowed && rental.pets_allowed !== 'No') features.push('🐾 Pets OK');
  if (rental.furnished && rental.furnished !== 'Unfurnished') features.push('🪑 Furnished');
  const featuresHtml = features.length > 0 ? `<div style="font-size:10px;color:#16a34a;margin-top:4px;">${features.join(' • ')}</div>` : '';
  
  const photoHtml = photo 
    ? `<img src="${photo}" alt="${address}" style="width:160px;height:100%;min-height:120px;object-fit:cover;border-radius:0;" loading="eager" />`
    : `<div style="width:160px;min-height:120px;background:#ecfdf5;display:flex;align-items:center;justify-content:center;"><span style="color:#059669;font-size:11px;">No Image</span></div>`;
  
  return `
    <div style="position:relative;">
      <a href="/rentals/${rental.listing_key}" style="display:flex;width:380px;font-family:system-ui,sans-serif;text-decoration:none;color:inherit;background:white;border-radius:10px;overflow:hidden;box-shadow:0 4px 16px rgba(0,0,0,0.18);border:2px solid #059669;">
        <div style="flex-shrink:0;position:relative;">
          ${photoHtml}
          <span style="position:absolute;top:6px;left:6px;background:#059669;color:white;font-size:9px;font-weight:700;padding:3px 8px;border-radius:4px;letter-spacing:0.3px;">FOR RENT</span>
        </div>
        <div style="flex:1;padding:12px 14px;display:flex;flex-direction:column;justify-content:center;min-width:0;">
          <div style="font-weight:700;font-size:18px;color:#059669;margin-bottom:4px;">${fullPrice}</div>
          <div style="font-size:13px;color:#475569;margin-bottom:4px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${address}</div>
          <div style="font-size:12px;color:#64748b;margin-bottom:2px;">${specs}</div>
          ${featuresHtml}
        </div>
      </a>
      <div style="position:absolute;bottom:-10px;left:50%;transform:translateX(-50%);width:0;height:0;border-left:10px solid transparent;border-right:10px solid transparent;border-top:10px solid #059669;"></div>
    </div>
  `;
}

export const CombinedListingsMap = forwardRef<CombinedListingsMapRef, CombinedListingsMapProps>(({ 
  resaleListings,
  presaleProjects,
  assignments = [],
  rentals = [],
  isVerifiedAgent = false,
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
  const assignmentLayerRef = useRef<L.LayerGroup | null>(null);
  const rentalLayerRef = useRef<L.LayerGroup | null>(null);
  const [userLocation, setUserLocation] = useState<L.LatLng | null>(null);
  const userMarkerRef = useRef<L.Marker | null>(null);
  const hasInitializedViewRef = useRef(false);
  const hasCenteredOnUserRef = useRef(false);
  const hasRestoredSavedStateRef = useRef(false);
  
  // Track markers by ID for highlighting
  const resaleMarkersMapRef = useRef<Map<string, L.Marker>>(new Map());
  const presaleMarkersMapRef = useRef<Map<string, L.Marker>>(new Map());
  const assignmentMarkersMapRef = useRef<Map<string, L.Marker>>(new Map());
  const rentalMarkersMapRef = useRef<Map<string, L.Marker>>(new Map());
  const [internalHighlightId, setInternalHighlightId] = useState<string | null>(null);

  // Expose flyTo and highlight methods to parent via ref
  useImperativeHandle(ref, () => ({
    flyTo: (lat: number, lng: number, zoom?: number) => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.flyTo([lat, lng], zoom || 14, { animate: true, duration: 0.8 });
      }
    },
    highlightItem: (id: string, type: "resale" | "presale" | "assignment" | "rental") => {
      setInternalHighlightId(id);
      // Find the marker and fly to it
      const markersMap = type === "resale" ? resaleMarkersMapRef.current : 
                         type === "presale" ? presaleMarkersMapRef.current : 
                         type === "rental" ? rentalMarkersMapRef.current :
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

  const validRentals = useMemo(() => 
    rentals.filter(r => r.latitude && r.longitude && r.lease_amount && r.lease_amount > 0),
    [rentals]
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
    
    const visibleRentals = validRentals
      .filter(r => bounds.contains([r.latitude!, r.longitude!]))
      .map(r => r.id);
    
    onVisibleItemsChange(visibleResale, visiblePresale, visibleAssignments, visibleRentals);
  }, [validResaleListings, validPresaleProjects, validAssignments, validRentals, onVisibleItemsChange]);

  // Store callbacks in refs to avoid recreating markers on every render
  const updateVisibleItemsRef = useRef(updateVisibleItems);
  const onMapInteractionRef = useRef(onMapInteraction);
  const onMapStateChangeRef = useRef(onMapStateChange);
  const onListingSelectRef = useRef(onListingSelect);
  const savedMapStateRef = useRef(savedMapState);
  
  // Keep refs updated
  useEffect(() => {
    updateVisibleItemsRef.current = updateVisibleItems;
  }, [updateVisibleItems]);
  
  useEffect(() => {
    onMapInteractionRef.current = onMapInteraction;
  }, [onMapInteraction]);
  
  useEffect(() => {
    onMapStateChangeRef.current = onMapStateChange;
  }, [onMapStateChange]);
  
  useEffect(() => {
    onListingSelectRef.current = onListingSelect;
  }, [onListingSelect]);

  // Initialize map only once on mount
  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;
    
    // Track if component is still mounted
    let isMounted = true;

    // Use saved state if available, otherwise defaults
    const initialState = savedMapStateRef.current;
    const initialCenter: L.LatLngExpression = initialState 
      ? [initialState.center.lat, initialState.center.lng]
      : DEFAULT_CENTER;
    const initialZoom = initialState ? initialState.zoom : DEFAULT_ZOOM;

    const map = L.map(mapRef.current, {
      center: initialCenter,
      zoom: initialZoom,
      zoomControl: false,
      attributionControl: true,
      preferCanvas: true, // Use canvas for better performance
      fadeAnimation: false, // Disable fade for speed
      zoomAnimation: true,
      markerZoomAnimation: false, // Disable marker zoom animation
    });

    L.tileLayer(TILE_URL, { 
      attribution: TILE_ATTRIBUTION,
      maxZoom: 19,
      updateWhenIdle: true, // Only update tiles when map stops moving
      updateWhenZooming: false, // Don't update during zoom
      keepBuffer: 2, // Keep fewer tiles in memory
    }).addTo(map);

    // Cluster group for resale listings only - optimized settings
    const clusterGroup = L.markerClusterGroup({
      chunkedLoading: true,
      chunkDelay: 10, // Faster chunk processing
      chunkInterval: 50, // More frequent chunks
      chunkProgress: null, // Disable progress callback overhead
      maxClusterRadius: 40, // Slightly larger for fewer clusters = faster
      spiderfyOnMaxZoom: true,
      showCoverageOnHover: false,
      disableClusteringAtZoom: 15,
      animate: false, // No cluster animations
      animateAddingMarkers: false, // No add animation
      removeOutsideVisibleBounds: true,
      singleMarkerMode: false,
      iconCreateFunction: createClusterIcon,
      spiderfyDistanceMultiplier: 1.5,
    });

    // Separate layer for presale projects (no clustering)
    const presaleLayer = L.layerGroup();
    
    // Separate layer for assignment listings
    const assignmentLayer = L.layerGroup();
    
    // Separate layer for rental listings
    const rentalLayer = L.layerGroup();

    map.addLayer(clusterGroup);
    map.addLayer(presaleLayer);
    map.addLayer(assignmentLayer);
    map.addLayer(rentalLayer);
    
    mapInstanceRef.current = map;
    markerClusterRef.current = clusterGroup;
    presaleLayerRef.current = presaleLayer;
    assignmentLayerRef.current = assignmentLayer;
    rentalLayerRef.current = rentalLayer;

    // If we have saved state, mark as initialized to prevent fitBounds overriding
    if (initialState) {
      hasInitializedViewRef.current = true;
      hasRestoredSavedStateRef.current = true;
    }

    map.on("moveend", () => {
      if (!isMounted) return;
      updateVisibleItemsRef.current?.();
    });
    map.on("zoomend", () => {
      if (!isMounted) return;
      updateVisibleItemsRef.current?.();
    });
    
     // Notify parent when user starts interacting with map (USER gestures only).
     // IMPORTANT: using "movestart" here can fire during programmatic flyTo/autoPan,
     // which can immediately hide the mobile carousel right after a pin is clicked.
     map.on("dragstart", () => {
       if (!isMounted) return;
       onMapInteractionRef.current?.();
     });

     map.on("zoomstart", () => {
       if (!isMounted) return;
       onMapInteractionRef.current?.();
     });
    
    // Save map state on every move/zoom for persistence
    map.on("moveend", () => {
      if (!isMounted || !mapInstanceRef.current) return;
      const center = mapInstanceRef.current.getCenter();
      const zoom = mapInstanceRef.current.getZoom();
      onMapStateChangeRef.current?.({ lat: center.lat, lng: center.lng }, zoom);
    });

    return () => {
      isMounted = false;
      if (mapInstanceRef.current) {
        // Remove all event listeners before destroying
        mapInstanceRef.current.off();
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
      markerClusterRef.current = null;
      presaleLayerRef.current = null;
      assignmentLayerRef.current = null;
      rentalLayerRef.current = null;
    };
  }, []); // Empty deps - only run once on mount

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
          onListingSelectRef.current?.(listing.id, "resale");
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
          onListingSelectRef.current?.(project.id, "presale");
        });

        presaleLayer.addLayer(marker);
        allCoords.push([project.map_lat!, project.map_lng!]);
      }
    }

    // Clear old assignment marker references
    assignmentMarkersMapRef.current.clear();
    const assignmentLayer = assignmentLayerRef.current!;
    assignmentLayer.clearLayers();

    // Add assignment listings as individual pins if mode is "all" or "assignments"
    if (mode === "all" || mode === "assignments") {
      for (const assignment of validAssignments) {
        const marker = L.marker([assignment.map_lat!, assignment.map_lng!], {
          icon: createAssignmentMarkerIcon(assignment, isVerifiedAgent, false),
          zIndexOffset: 1200, // Keep assignment pins above presale
        });

        // Store marker reference for highlighting
        assignmentMarkersMapRef.current.set(assignment.id, marker);

        // Only bind popup if not disabled (mobile uses carousel instead)
        if (!disablePopupsOnMobile) {
          marker.bindPopup(assignmentPopupHtml(assignment, isVerifiedAgent), {
            maxWidth: 420,
            minWidth: 360,
            closeButton: true,
            className: "assignment-popup",
            offset: L.point(0, -20),
            autoPan: true,
            autoPanPaddingTopLeft: L.point(50, 100),
            autoPanPaddingBottomRight: L.point(50, 50),
          });
        }

        marker.on("click", () => {
          onListingSelectRef.current?.(assignment.id, "assignment");
        });

        assignmentLayer.addLayer(marker);
        allCoords.push([assignment.map_lat!, assignment.map_lng!]);
      }
    }

    // Clear old rental marker references and layer
    rentalMarkersMapRef.current.clear();
    const rentalLayer = rentalLayerRef.current!;
    rentalLayer.clearLayers();

    // Add rental listings if mode is "all" or "rental"
    if (mode === "all" || mode === "rental") {
      for (const rental of validRentals) {
        const marker = L.marker([rental.latitude!, rental.longitude!], {
          icon: createRentalPricePillIcon(rental, false),
          zIndexOffset: 1100, // Between presale and assignments
        });

        // Store marker reference for highlighting
        rentalMarkersMapRef.current.set(rental.id, marker);

        // Only bind popup if not disabled (mobile uses carousel instead)
        if (!disablePopupsOnMobile) {
          marker.bindPopup(rentalPopupHtml(rental), {
            maxWidth: 420,
            minWidth: 360,
            closeButton: true,
            className: "rental-popup",
            offset: L.point(0, -20),
            autoPan: true,
            autoPanPaddingTopLeft: L.point(50, 100),
            autoPanPaddingBottomRight: L.point(50, 50),
          });
        }

        marker.on("click", () => {
          onListingSelectRef.current?.(rental.id, "rental");
        });

        rentalLayer.addLayer(marker);
        allCoords.push([rental.latitude!, rental.longitude!]);
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
      setTimeout(() => updateVisibleItemsRef.current?.(), 50);
    });
  }, [validResaleListings, validPresaleProjects, validAssignments, validRentals, mode, isVerifiedAgent, disablePopupsOnMobile]);

  // Effect to handle highlighting of markers
  useEffect(() => {
    const highlightId = highlightedItemId || internalHighlightId;
    const highlightType = highlightedItemType || (internalHighlightId ? 
      (resaleMarkersMapRef.current.has(internalHighlightId) ? "resale" : 
       presaleMarkersMapRef.current.has(internalHighlightId) ? "presale" : "assignment") : null);
    
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
    } else if (highlightType === "assignment") {
      const assignment = validAssignments.find(a => a.id === highlightId);
      const marker = assignmentMarkersMapRef.current.get(highlightId);
      if (assignment && marker) {
        marker.setIcon(createAssignmentMarkerIcon(assignment, isVerifiedAgent, true));
        marker.setZIndexOffset(3500); // Bring to front
        
        // Reset after animation
        const timeout = setTimeout(() => {
          marker.setIcon(createAssignmentMarkerIcon(assignment, isVerifiedAgent, false));
          marker.setZIndexOffset(1200);
        }, 2000);
        return () => clearTimeout(timeout);
      }
    } else if (highlightType === "rental") {
      const rental = validRentals.find(r => r.id === highlightId);
      const marker = rentalMarkersMapRef.current.get(highlightId);
      if (rental && marker) {
        marker.setIcon(createRentalPricePillIcon(rental, true));
        marker.setZIndexOffset(3000); // Bring to front
        
        // Reset after animation
        const timeout = setTimeout(() => {
          marker.setIcon(createRentalPricePillIcon(rental, false));
          marker.setZIndexOffset(1100);
        }, 2000);
        return () => clearTimeout(timeout);
      }
    }
  }, [highlightedItemId, highlightedItemType, internalHighlightId, validResaleListings, validPresaleProjects, validAssignments, validRentals, isVerifiedAgent]);

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
