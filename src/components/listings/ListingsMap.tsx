import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Building2, MapPin, ExternalLink, Bed, Bath, Move } from "lucide-react";

// Fix Leaflet default marker icon issue
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
});

// Custom marker icon for listings
const createListingIcon = (isFeatured: boolean = false) => {
  const color = isFeatured ? "#f59e0b" : "#3b82f6"; // amber for featured, blue for regular
  
  return L.divIcon({
    className: "custom-marker",
    html: `
      <div style="
        background-color: ${color};
        width: 32px;
        height: 32px;
        border-radius: 50% 50% 50% 0;
        transform: rotate(-45deg);
        border: 3px solid white;
        box-shadow: 0 2px 8px rgba(0,0,0,0.3);
        display: flex;
        align-items: center;
        justify-content: center;
      ">
        <div style="
          transform: rotate(45deg);
          color: white;
          font-size: 14px;
          font-weight: bold;
        ">●</div>
      </div>
    `,
    iconSize: [32, 32],
    iconAnchor: [16, 32],
    popupAnchor: [0, -32],
  });
};

// City center coordinates for fallback positioning (Lower Mainland BC)
const CITY_CENTERS: Record<string, [number, number]> = {
  "Vancouver": [49.2827, -123.1207],
  "Burnaby": [49.2488, -122.9805],
  "Richmond": [49.1666, -123.1336],
  "Surrey": [49.1913, -122.8490],
  "Coquitlam": [49.2838, -122.7932],
  "Port Coquitlam": [49.2625, -122.7811],
  "Port Moody": [49.2845, -122.8570],
  "North Vancouver": [49.3165, -123.0688],
  "West Vancouver": [49.3270, -123.1660],
  "Langley": [49.1044, -122.6581],
  "Delta": [49.0847, -123.0587],
  "Abbotsford": [49.0504, -122.3045],
  "New Westminster": [49.2057, -122.9110],
  "White Rock": [49.0253, -122.8029],
  "Maple Ridge": [49.2193, -122.5984],
  "Chilliwack": [49.1579, -121.9514],
};

// Default center (Metro Vancouver)
const DEFAULT_CENTER: [number, number] = [49.2500, -122.9000];
const DEFAULT_ZOOM = 10;

interface Listing {
  id: string;
  title: string;
  project_name: string;
  city: string;
  neighborhood: string | null;
  address: string | null;
  assignment_price: number;
  beds: number;
  baths: number;
  interior_sqft: number | null;
  is_featured: boolean | null;
  map_lat?: number | null;
  map_lng?: number | null;
  listing_photos?: { url: string; sort_order: number | null }[];
}

interface ListingsMapProps {
  listings: Listing[];
  isLoading?: boolean;
}

const formatPrice = (price: number) => {
  if (price >= 1000000) {
    return `$${(price / 1000000).toFixed(2)}M`;
  }
  return `$${(price / 1000).toFixed(0)}K`;
};

// Component to fit bounds when listings change
function FitBoundsControl({ listings }: { listings: Array<Listing & { lat: number; lng: number }> }) {
  const map = useMap();
  
  useEffect(() => {
    if (listings.length === 0) return;
    
    const validListings = listings.filter(l => l.lat && l.lng);
    
    if (validListings.length === 0) {
      map.setView(DEFAULT_CENTER, DEFAULT_ZOOM);
      return;
    }
    
    if (validListings.length === 1) {
      map.setView([validListings[0].lat, validListings[0].lng], 14);
      return;
    }
    
    const bounds = L.latLngBounds(
      validListings.map(l => L.latLng(l.lat, l.lng))
    );
    map.fitBounds(bounds, { padding: [50, 50], maxZoom: 14 });
  }, [listings, map]);
  
  return null;
}

export function ListingsMap({ listings, isLoading }: ListingsMapProps) {
  const [selectedListing, setSelectedListing] = useState<string | null>(null);
  
  // Get listings with coordinates (use city center as fallback)
  const mappedListings = useMemo(() => {
    return listings.map(listing => {
      if (listing.map_lat && listing.map_lng) {
        return { ...listing, lat: listing.map_lat, lng: listing.map_lng };
      }
      // Fallback to city center with small offset to prevent stacking
      const cityCenter = CITY_CENTERS[listing.city] || DEFAULT_CENTER;
      const offset = (Math.random() - 0.5) * 0.02; // Small random offset
      return {
        ...listing,
        lat: cityCenter[0] + offset,
        lng: cityCenter[1] + offset,
      };
    });
  }, [listings]);
  
  if (isLoading) {
    return (
      <div className="h-[500px] lg:h-[600px] rounded-xl bg-muted animate-pulse flex items-center justify-center">
        <div className="text-center text-muted-foreground">
          <MapPin className="h-12 w-12 mx-auto mb-2 animate-pulse" />
          <p>Loading map...</p>
        </div>
      </div>
    );
  }
  
  if (listings.length === 0) {
    return (
      <div className="h-[500px] lg:h-[600px] rounded-xl bg-muted flex items-center justify-center">
        <div className="text-center text-muted-foreground">
          <Building2 className="h-12 w-12 mx-auto mb-2" />
          <p>No assignments to display on map</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="h-[500px] lg:h-[600px] rounded-xl overflow-hidden border border-border relative">
      <MapContainer
        center={DEFAULT_CENTER}
        zoom={DEFAULT_ZOOM}
        className="h-full w-full"
        scrollWheelZoom={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        <FitBoundsControl listings={mappedListings} />
        
        {mappedListings.map((listing) => (
          <Marker
            key={listing.id}
            position={[listing.lat, listing.lng]}
            icon={createListingIcon(listing.is_featured || false)}
            eventHandlers={{
              click: () => setSelectedListing(listing.id),
            }}
          >
            <Popup maxWidth={280} className="listing-popup">
              <div className="p-1">
                {listing.listing_photos && listing.listing_photos.length > 0 && (
                  <img
                    src={listing.listing_photos[0].url}
                    alt={listing.title}
                    className="w-full h-32 object-cover rounded-md mb-2"
                  />
                )}
                <div className="space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-semibold text-sm line-clamp-1">{listing.title}</h3>
                    {listing.is_featured && (
                      <Badge className="bg-amber-500 text-[10px] px-1.5 py-0.5 shrink-0">
                        Featured
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {listing.project_name}
                  </p>
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <MapPin className="h-3 w-3" />
                    {listing.neighborhood ? `${listing.neighborhood}, ` : ""}{listing.city}
                  </p>
                  
                  {/* Quick stats */}
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Bed className="h-3 w-3" /> {listing.beds}
                    </span>
                    <span className="flex items-center gap-1">
                      <Bath className="h-3 w-3" /> {listing.baths}
                    </span>
                    {listing.interior_sqft && (
                      <span className="flex items-center gap-1">
                        <Move className="h-3 w-3" /> {listing.interior_sqft} sqft
                      </span>
                    )}
                  </div>
                  
                  <p className="text-base font-bold text-primary">
                    {formatPrice(listing.assignment_price)}
                  </p>
                  
                  <Link to={`/assignments/${listing.id}`}>
                    <Button size="sm" className="w-full mt-2 text-xs h-8">
                      View Assignment
                      <ExternalLink className="h-3 w-3 ml-1" />
                    </Button>
                  </Link>
                </div>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
      
      {/* Legend */}
      <div className="absolute bottom-4 left-4 z-[1000] bg-background/95 backdrop-blur-sm rounded-lg p-3 border shadow-lg">
        <p className="text-xs font-medium mb-2">Assignment Type</p>
        <div className="space-y-1.5">
          <div className="flex items-center gap-2 text-xs">
            <span className="w-3 h-3 rounded-full bg-amber-500" />
            <span>Featured</span>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <span className="w-3 h-3 rounded-full bg-blue-500" />
            <span>Standard</span>
          </div>
        </div>
      </div>
    </div>
  );
}
