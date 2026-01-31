import { useState, useRef, useCallback, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { 
  X, ChevronUp, ChevronDown, Bed, Bath, Ruler, Building2, 
  Home, MapPin, Calendar, Lock, Phone, Mail, Heart
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { getListingUrl } from "@/lib/propertiesUrls";

// Types
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
  interior_sqft: number | null;
  map_lat: number | null;
  map_lng: number | null;
  status: string;
}

interface MobilePropertyPreviewProps {
  item: {
    type: "resale" | "presale" | "assignment";
    data: MLSListing | PresaleProject | Assignment;
  } | null;
  isOpen: boolean;
  onClose: () => void;
  isVerifiedAgent?: boolean;
}

function formatPrice(price: number | null): string {
  if (!price) return "Price TBA";
  if (price >= 1000000) {
    const millions = price / 1000000;
    return millions % 1 === 0 ? `$${millions}M` : `$${millions.toFixed(2)}M`;
  }
  return `$${price.toLocaleString()}`;
}

function getResaleAddress(listing: MLSListing): string {
  const parts = [listing.street_number, listing.street_name, listing.street_suffix].filter(Boolean);
  return parts.length > 0 ? parts.join(" ") : listing.neighborhood || listing.city;
}

function getResalePhotos(listing: MLSListing): string[] {
  if (listing.photos && Array.isArray(listing.photos)) {
    return listing.photos
      .filter((p: any) => p?.MediaURL)
      .map((p: any) => p.MediaURL);
  }
  return [];
}

export function MobilePropertyPreview({ 
  item, 
  isOpen, 
  onClose, 
  isVerifiedAgent = false 
}: MobilePropertyPreviewProps) {
  const navigate = useNavigate();
  const [sheetExpanded, setSheetExpanded] = useState(false);
  const [activePhotoIndex, setActivePhotoIndex] = useState(0);
  const photoContainerRef = useRef<HTMLDivElement>(null);
  const sheetRef = useRef<HTMLDivElement>(null);
  const startYRef = useRef<number>(0);
  const currentYRef = useRef<number>(0);
  
  // Reset state when item changes or opens
  useEffect(() => {
    if (isOpen) {
      setSheetExpanded(false);
      setActivePhotoIndex(0);
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen, item]);

  // Handle photo scroll to update active index
  const handlePhotoScroll = useCallback(() => {
    if (!photoContainerRef.current) return;
    const container = photoContainerRef.current;
    const scrollTop = container.scrollTop;
    const photoHeight = container.clientHeight;
    const newIndex = Math.round(scrollTop / photoHeight);
    if (newIndex !== activePhotoIndex) {
      setActivePhotoIndex(newIndex);
    }
  }, [activePhotoIndex]);

  // Sheet drag handlers
  const handleSheetTouchStart = useCallback((e: React.TouchEvent) => {
    startYRef.current = e.touches[0].clientY;
    currentYRef.current = e.touches[0].clientY;
  }, []);

  const handleSheetTouchMove = useCallback((e: React.TouchEvent) => {
    currentYRef.current = e.touches[0].clientY;
  }, []);

  const handleSheetTouchEnd = useCallback(() => {
    const deltaY = startYRef.current - currentYRef.current;
    const threshold = 50;
    
    if (deltaY > threshold && !sheetExpanded) {
      setSheetExpanded(true);
    } else if (deltaY < -threshold && sheetExpanded) {
      setSheetExpanded(false);
    }
  }, [sheetExpanded]);

  const handleViewFullDetails = useCallback(() => {
    if (!item) return;
    
    let url = "";
    if (item.type === "presale") {
      const presaleData = item.data as PresaleProject;
      url = `/presale-projects/${presaleData.slug}`;
    } else if (item.type === "resale") {
      const resaleData = item.data as MLSListing;
      const address = getResaleAddress(resaleData);
      url = getListingUrl(resaleData.listing_key, address, resaleData.city);
    } else if (item.type === "assignment" && isVerifiedAgent) {
      url = `/assignments/${item.data.id}`;
    }
    
    if (url) {
      onClose();
      navigate(url);
    }
  }, [item, isVerifiedAgent, navigate, onClose]);

  if (!isOpen || !item) return null;

  const isPresale = item.type === "presale";
  const isResale = item.type === "resale";
  const isAssignment = item.type === "assignment";
  const isLocked = isAssignment && !isVerifiedAgent;

  // Get photos based on type
  let photos: string[] = [];
  if (isResale) {
    photos = getResalePhotos(item.data as MLSListing);
  } else if (isPresale && (item.data as PresaleProject).featured_image) {
    photos = [(item.data as PresaleProject).featured_image!];
  }

  // Property details
  const price = isPresale 
    ? (item.data as PresaleProject).starting_price 
    : isResale 
    ? (item.data as MLSListing).listing_price
    : (item.data as Assignment).assignment_price;

  const title = isPresale 
    ? (item.data as PresaleProject).name 
    : isResale 
    ? getResaleAddress(item.data as MLSListing)
    : (item.data as Assignment).project_name;

  const location = isPresale
    ? `${(item.data as PresaleProject).neighborhood}, ${(item.data as PresaleProject).city}`
    : isResale
    ? `${(item.data as MLSListing).neighborhood || ""} ${(item.data as MLSListing).city}`.trim()
    : `${(item.data as Assignment).neighborhood || ""} ${(item.data as Assignment).city}`.trim();

  const beds = isResale 
    ? (item.data as MLSListing).bedrooms_total 
    : isAssignment 
    ? (item.data as Assignment).beds 
    : null;
    
  const baths = isResale 
    ? (item.data as MLSListing).bathrooms_total 
    : isAssignment 
    ? (item.data as Assignment).baths 
    : null;
    
  const sqft = isResale 
    ? (item.data as MLSListing).living_area 
    : isAssignment 
    ? (item.data as Assignment).interior_sqft 
    : null;

  const propertyType = isPresale
    ? (item.data as PresaleProject).project_type || "Condo"
    : isResale
    ? (item.data as MLSListing).property_sub_type || (item.data as MLSListing).property_type
    : "Assignment";

  const statusLabel = isPresale 
    ? ((item.data as PresaleProject).status === "active" ? "Selling Now" : 
       (item.data as PresaleProject).status === "registering" ? "Registering" : 
       (item.data as PresaleProject).status === "coming_soon" ? "Coming Soon" : 
       (item.data as PresaleProject).status)
    : isResale
    ? "Move-In Ready"
    : "Assignment";

  const typeColor = isPresale 
    ? "bg-foreground text-background" 
    : isAssignment 
    ? "bg-amber-500 text-white" 
    : "bg-primary text-primary-foreground";

  return (
    <div className="fixed inset-0 z-[100] bg-black">
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 z-20 flex items-center justify-between p-3 bg-gradient-to-b from-black/70 to-transparent safe-top">
        <button
          onClick={onClose}
          className="w-10 h-10 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center text-white active:bg-black/60 transition-colors"
        >
          <X className="h-5 w-5" />
        </button>
        
        <div className="flex items-center gap-2">
          <Badge className={cn("text-xs font-semibold px-2 py-1", typeColor)}>
            {isPresale ? "PRESALE" : isAssignment ? "ASSIGNMENT" : "RESALE"}
          </Badge>
          {photos.length > 1 && (
            <span className="text-white text-sm font-medium bg-black/40 backdrop-blur-sm px-2 py-1 rounded-full">
              {activePhotoIndex + 1} / {photos.length}
            </span>
          )}
        </div>
        
        <button className="w-10 h-10 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center text-white active:bg-black/60 transition-colors">
          <Heart className="h-5 w-5" />
        </button>
      </div>

      {/* Photo Gallery - Vertical Scroll */}
      <div 
        ref={photoContainerRef}
        className={cn(
          "absolute inset-0 overflow-y-auto snap-y snap-mandatory",
          sheetExpanded ? "pointer-events-none" : ""
        )}
        style={{ 
          paddingBottom: sheetExpanded ? '70vh' : '35vh',
          WebkitOverflowScrolling: 'touch'
        }}
        onScroll={handlePhotoScroll}
      >
        {photos.length > 0 ? (
          photos.map((photo, index) => (
            <div 
              key={index}
              className="w-full h-screen snap-start flex items-center justify-center"
            >
              <img
                src={photo}
                alt={`${title} - Photo ${index + 1}`}
                className={cn(
                  "w-full h-full object-cover",
                  isLocked && "blur-xl"
                )}
                loading={index <= 1 ? "eager" : "lazy"}
                draggable={false}
              />
            </div>
          ))
        ) : (
          <div className="w-full h-screen snap-start flex items-center justify-center bg-gradient-to-br from-muted to-muted/70">
            <div className="text-center">
              {isPresale ? (
                <Building2 className="h-16 w-16 mx-auto text-muted-foreground/50 mb-3" />
              ) : (
                <Home className="h-16 w-16 mx-auto text-muted-foreground/50 mb-3" />
              )}
              <p className="text-muted-foreground">No photos available</p>
            </div>
          </div>
        )}
      </div>

      {/* Photo Dots Indicator */}
      {photos.length > 1 && (
        <div className="absolute right-3 top-1/2 -translate-y-1/2 z-10 flex flex-col gap-1.5">
          {photos.slice(0, 10).map((_, index) => (
            <div 
              key={index}
              className={cn(
                "w-1.5 h-1.5 rounded-full transition-all",
                index === activePhotoIndex ? "bg-white scale-125" : "bg-white/40"
              )}
            />
          ))}
          {photos.length > 10 && (
            <span className="text-white/60 text-[8px]">+{photos.length - 10}</span>
          )}
        </div>
      )}

      {/* Locked Overlay for Assignments */}
      {isLocked && (
        <div className="absolute inset-0 z-10 flex items-center justify-center pointer-events-none">
          <div className="bg-black/60 backdrop-blur-sm rounded-2xl p-6 text-center pointer-events-auto">
            <Lock className="h-10 w-10 mx-auto text-white mb-3" />
            <h3 className="text-white font-semibold text-lg mb-2">Agent Access Only</h3>
            <p className="text-white/70 text-sm mb-4">Verify as an agent to view this assignment</p>
            <Button 
              onClick={() => { onClose(); navigate("/for-agents"); }}
              className="bg-amber-500 hover:bg-amber-600 text-white"
            >
              Become an Agent
            </Button>
          </div>
        </div>
      )}

      {/* Swipe-up Details Sheet */}
      <div 
        ref={sheetRef}
        className={cn(
          "absolute left-0 right-0 z-30 bg-background rounded-t-3xl shadow-2xl transition-all duration-300 ease-out",
          sheetExpanded ? "h-[75vh]" : "h-auto"
        )}
        style={{ 
          bottom: 0,
          maxHeight: '80vh'
        }}
        onTouchStart={handleSheetTouchStart}
        onTouchMove={handleSheetTouchMove}
        onTouchEnd={handleSheetTouchEnd}
      >
        {/* Drag Handle */}
        <div className="flex justify-center pt-3 pb-2">
          <div className="w-10 h-1 rounded-full bg-muted-foreground/30" />
        </div>

        {/* Sheet Content - Scrollable when expanded */}
        <div 
          className={cn(
            "px-4 pb-4 overflow-y-auto",
            sheetExpanded ? "h-[calc(75vh-100px)]" : ""
          )}
          style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 80px)' }}
        >
          {/* Price & Expand Hint */}
          <div className="flex items-start justify-between mb-2">
            <div>
              <p className={cn(
                "text-2xl font-bold",
                isAssignment ? "text-amber-600" : "text-foreground"
              )}>
                {isPresale ? "From " : ""}{formatPrice(price)}
              </p>
              {isPresale && (
                <Badge variant="secondary" className="mt-1 text-xs">
                  {statusLabel}
                </Badge>
              )}
            </div>
            <button 
              onClick={() => setSheetExpanded(!sheetExpanded)}
              className="p-2 rounded-full bg-muted active:bg-muted/80 transition-colors"
            >
              {sheetExpanded ? (
                <ChevronDown className="h-5 w-5 text-muted-foreground" />
              ) : (
                <ChevronUp className="h-5 w-5 text-muted-foreground" />
              )}
            </button>
          </div>

          {/* Title & Location */}
          <h2 className="text-lg font-semibold text-foreground mb-1">{title}</h2>
          <p className="text-sm text-muted-foreground flex items-center gap-1 mb-3">
            <MapPin className="h-3.5 w-3.5" />
            {location}
          </p>

          {/* Quick Stats */}
          {(beds !== null || baths !== null || sqft !== null) && (
            <div className="flex items-center gap-4 mb-4">
              {beds !== null && (
                <div className="flex items-center gap-1.5 text-sm">
                  <Bed className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">{beds}</span>
                  <span className="text-muted-foreground">Beds</span>
                </div>
              )}
              {baths !== null && (
                <div className="flex items-center gap-1.5 text-sm">
                  <Bath className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">{baths}</span>
                  <span className="text-muted-foreground">Baths</span>
                </div>
              )}
              {sqft !== null && (
                <div className="flex items-center gap-1.5 text-sm">
                  <Ruler className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">{sqft.toLocaleString()}</span>
                  <span className="text-muted-foreground">sqft</span>
                </div>
              )}
            </div>
          )}

          {/* Property Type Badge */}
          <div className="flex items-center gap-2 mb-4">
            <Badge variant="outline" className="text-xs">
              {propertyType}
            </Badge>
            {isResale && (item.data as MLSListing).mls_status && (
              <Badge variant="outline" className="text-xs text-primary border-primary">
                {(item.data as MLSListing).mls_status}
              </Badge>
            )}
          </div>

          {/* Expanded Content */}
          {sheetExpanded && (
            <div className="space-y-4 animate-in fade-in duration-200">
              {/* Overview Section */}
              <div className="border-t pt-4">
                <h3 className="font-semibold text-foreground mb-2">Overview</h3>
                {isPresale && (
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <p className="text-muted-foreground">Developer</p>
                      <p className="font-medium">Developer Info</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Project Type</p>
                      <p className="font-medium">{(item.data as PresaleProject).project_type || "Condo"}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Status</p>
                      <p className="font-medium">{statusLabel}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Location</p>
                      <p className="font-medium">{(item.data as PresaleProject).neighborhood}</p>
                    </div>
                  </div>
                )}
                {isResale && (
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <p className="text-muted-foreground">Property Type</p>
                      <p className="font-medium">{(item.data as MLSListing).property_sub_type || (item.data as MLSListing).property_type}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">MLS #</p>
                      <p className="font-medium">{(item.data as MLSListing).listing_key}</p>
                    </div>
                    {(item.data as MLSListing).list_office_name && (
                      <div className="col-span-2">
                        <p className="text-muted-foreground">Listed by</p>
                        <p className="font-medium">{(item.data as MLSListing).list_office_name}</p>
                      </div>
                    )}
                  </div>
                )}
                {isAssignment && !isLocked && (
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <p className="text-muted-foreground">Project</p>
                      <p className="font-medium">{(item.data as Assignment).project_name}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Unit</p>
                      <p className="font-medium">{(item.data as Assignment).title}</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Key Features */}
              {isPresale && (
                <div className="border-t pt-4">
                  <h3 className="font-semibold text-foreground mb-2">Why This Project</h3>
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-start gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 shrink-0" />
                      <span>Prime {(item.data as PresaleProject).neighborhood} location</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 shrink-0" />
                      <span>Starting from {formatPrice(price)}</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 shrink-0" />
                      <span>{(item.data as PresaleProject).project_type || "Condo"} development in {(item.data as PresaleProject).city}</span>
                    </li>
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Fixed CTA Buttons */}
        <div 
          className="absolute bottom-0 left-0 right-0 p-4 bg-background border-t flex gap-3"
          style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 16px)' }}
        >
          <Button 
            variant="outline" 
            className="flex-1 gap-2"
            onClick={() => window.open('tel:+1234567890')}
          >
            <Phone className="h-4 w-4" />
            Call
          </Button>
          <Button 
            className="flex-1 gap-2"
            onClick={handleViewFullDetails}
            disabled={isLocked}
          >
            View Details
          </Button>
        </div>
      </div>
    </div>
  );
}
