import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Helmet } from "react-helmet-async";
import { useRef, useState, useEffect } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { 
  Bed, 
  Bath, 
  Maximize, 
  Building2, 
  Calendar, 
  MapPin,
  Car,
  Home,
  DollarSign,
  Clock,
  Layers,
  ChevronRight,
  Map,
  Navigation,
  Sparkles,
  Phone,
  User,
  Flame,
  Snowflake,
  Eye,
  FileText,
  Users,
  Waves,
  TreePine,
  MessageSquare
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { ConversionHeader } from "@/components/conversion/ConversionHeader";
import { Footer } from "@/components/layout/Footer";
import { ShareButtons } from "@/components/listings/ShareButtons";
import { MortgageCalculator } from "@/components/listings/MortgageCalculator";
import { REWPhotoGallery } from "@/components/resale/REWPhotoGallery";
import { ResaleScheduleForm } from "@/components/resale/ResaleScheduleForm";
import { RelatedCityListings } from "@/components/resale/RelatedCityListings";
import { PropertyValueTrends } from "@/components/resale/PropertyValueTrends";
import { ResaleListingMiniMap } from "@/components/resale/ResaleListingMiniMap";
import { WalkTransitScore } from "@/components/resale/WalkTransitScore";

import { SimilarListings } from "@/components/resale/SimilarListings";
import { RelatedPresaleProjects } from "@/components/resale/RelatedPresaleProjects";
import { useIsMobile, useIsMobileOrTablet } from "@/hooks/use-mobile";
import { usePropertyViewTracking } from "@/hooks/useBehaviorTracking";
import { MetaEvents } from "@/components/tracking/MetaPixel";

const formatPrice = (price: number) => {
  return new Intl.NumberFormat("en-CA", {
    style: "currency",
    currency: "CAD",
    maximumFractionDigits: 0,
  }).format(price);
};

const formatPropertyType = (type: string | null) => {
  if (!type) return "Residential";
  return type.split(/[\s/]+/).map(word => 
    word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
  ).join(" ");
};

type MLSListing = {
  id: string;
  listing_id: string;
  listing_key: string;
  listing_price: number;
  original_list_price: number | null;
  mls_status: string;
  property_type: string;
  property_sub_type: string | null;
  city: string;
  neighborhood: string | null;
  subdivision_name: string | null;
  unparsed_address: string | null;
  street_number: string | null;
  street_name: string | null;
  street_suffix: string | null;
  unit_number: string | null;
  postal_code: string | null;
  state_or_province: string | null;
  bedrooms_total: number | null;
  bathrooms_total: number | null;
  bathrooms_full: number | null;
  bathrooms_half: number | null;
  living_area: number | null;
  lot_size_area: number | null;
  lot_size_units: string | null;
  year_built: number | null;
  stories: number | null;
  parking_total: number | null;
  garage_spaces: number | null;
  latitude: number | null;
  longitude: number | null;
  photos: any | null;
  days_on_market: number | null;
  cumulative_days_on_market: number | null;
  list_date: string | null;
  public_remarks: string | null;
  list_agent_name: string | null;
  list_agent_phone: string | null;
  list_agent_email: string | null;
  list_office_name: string | null;
  list_office_phone: string | null;
  buyer_agent_name: string | null;
  buyer_office_name: string | null;
  association_fee: number | null;
  association_fee_frequency: string | null;
  tax_annual_amount: number | null;
  tax_year: number | null;
  interior_features: string[] | null;
  exterior_features: string[] | null;
  community_features: string[] | null;
  appliances: string[] | null;
  heating: string[] | null;
  cooling: string[] | null;
  view: string[] | null;
  virtual_tour_url: string | null;
  pool_yn: boolean | null;
  waterfront_yn: boolean | null;
  open_house_date: string | null;
  open_house_start_time: string | null;
  open_house_end_time: string | null;
  open_house_remarks: string | null;
};

export default function ResaleListingDetail() {
  const { listingKey } = useParams<{ listingKey: string }>();
  const formRef = useRef<HTMLDivElement>(null);
  
  const isMobile = useIsMobile();
  const isMobileOrTablet = useIsMobileOrTablet();
  const [showMobileScheduler, setShowMobileScheduler] = useState(false);

  const scrollToForm = () => {
    formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const { data: listing, isLoading, error } = useQuery({
    queryKey: ["mls-listing", listingKey],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("mls_listings")
        .select("*")
        .eq("listing_key", listingKey)
        .maybeSingle();

      if (error) throw error;
      return data as MLSListing | null;
    },
    enabled: !!listingKey,
  });

  // Track listing view with behavioral tracking
  usePropertyViewTracking(listing ? {
    project_id: listing.id,
    project_name: listing.unparsed_address || listing.street_name || "Resale Listing",
    city: listing.city,
    price_from: listing.listing_price,
  } : null);

  // Track Meta ViewContent event when listing loads
  useEffect(() => {
    if (listing) {
      MetaEvents.viewContent({
        content_name: listing.unparsed_address || listing.street_name || "Resale Listing",
        content_ids: [listing.listing_key],
        content_type: "resale_listing",
        content_category: listing.property_type,
        value: listing.listing_price,
        currency: "CAD",
      });
    }
  }, [listing?.id]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <ConversionHeader />
        <main className="container py-8">
          <Skeleton className="h-8 w-48 mb-6" />
          <div className="grid lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
              <Skeleton className="aspect-[4/3] rounded-lg" />
              <Skeleton className="h-64" />
            </div>
            <div>
              <Skeleton className="h-96" />
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (error || !listing) {
    return (
      <div className="min-h-screen bg-background">
        <ConversionHeader />
        <main className="container py-16 text-center">
          <h1 className="text-2xl font-bold text-foreground mb-4">
            Listing Not Found
          </h1>
          <p className="text-muted-foreground mb-6">
            This listing may have been sold or is no longer available.
          </p>
          <Link to="/resale">
            <Button>Browse All New Homes</Button>
          </Link>
        </main>
        <Footer />
      </div>
    );
  }

  // Parse photos
  const getPhotos = () => {
    if (!listing.photos) return [];
    if (Array.isArray(listing.photos)) {
      return listing.photos.map((photo: any, index: number) => {
        const url = photo?.MediaURL || photo?.url || (typeof photo === 'string' ? photo : null);
        return url ? { url, alt: `Photo ${index + 1}` } : null;
      }).filter(Boolean);
    }
    return [];
  };

  const photos = getPhotos();

  const getAddress = () => {
    if (listing.unparsed_address) return listing.unparsed_address;
    const parts = [];
    if (listing.unit_number) parts.push(`#${listing.unit_number}`);
    if (listing.street_number) parts.push(listing.street_number);
    if (listing.street_name) parts.push(listing.street_name);
    if (listing.street_suffix) parts.push(listing.street_suffix);
    return parts.length > 0 ? parts.join(" ") : listing.city;
  };

  const address = getAddress();
  const pageTitle = `${address} | ${listing.city} | PresaleProperties`;
  const pageDescription = `${listing.bedrooms_total || 0} bed, ${listing.bathrooms_total || 0} bath ${formatPropertyType(listing.property_type)} for sale in ${listing.city}. ${formatPrice(listing.listing_price)}. ${listing.living_area ? `${listing.living_area} sqft.` : ''}`;
  const canonicalUrl = `https://presaleproperties.com/resale/${listing.listing_key}`;

  // Calculate days on market
  const getDaysOnMarket = () => {
    let dom = listing.days_on_market;
    if (dom === null && listing.list_date) {
      const listDate = new Date(listing.list_date);
      const today = new Date();
      dom = Math.floor((today.getTime() - listDate.getTime()) / (1000 * 60 * 60 * 24));
    }
    return dom;
  };

  const daysOnMarket = getDaysOnMarket();

  // JSON-LD Structured Data
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "RealEstateListing",
    "name": address,
    "description": listing.public_remarks || pageDescription,
    "url": canonicalUrl,
    "image": photos[0]?.url,
    "address": {
      "@type": "PostalAddress",
      "streetAddress": address,
      "addressLocality": listing.city,
      "addressRegion": "BC",
      "postalCode": listing.postal_code,
      "addressCountry": "CA"
    },
    "geo": listing.latitude && listing.longitude ? {
      "@type": "GeoCoordinates",
      "latitude": listing.latitude,
      "longitude": listing.longitude
    } : undefined,
    "offers": {
      "@type": "Offer",
      "price": listing.listing_price,
      "priceCurrency": "CAD",
      "availability": listing.mls_status === "Active" ? "https://schema.org/InStock" : "https://schema.org/SoldOut"
    },
    "numberOfRooms": listing.bedrooms_total,
    "numberOfBathroomsTotal": listing.bathrooms_total,
    "floorSize": listing.living_area ? {
      "@type": "QuantitativeValue",
      "value": listing.living_area,
      "unitCode": "FTK"
    } : undefined
  };

  const breadcrumbData = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://presaleproperties.com" },
      { "@type": "ListItem", "position": 2, "name": "For Sale", "item": "https://presaleproperties.com/resale" },
      { "@type": "ListItem", "position": 3, "name": listing.city, "item": `https://presaleproperties.com/resale?city=${listing.city}` },
      { "@type": "ListItem", "position": 4, "name": address }
    ]
  };

  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>{pageTitle}</title>
        <meta name="description" content={pageDescription} />
        <link rel="canonical" href={canonicalUrl} />
        <meta property="og:title" content={pageTitle} />
        <meta property="og:description" content={pageDescription} />
        <meta property="og:url" content={canonicalUrl} />
        <meta property="og:type" content="website" />
        {photos[0] && <meta property="og:image" content={photos[0].url} />}
        <script type="application/ld+json">{JSON.stringify(structuredData)}</script>
        <script type="application/ld+json">{JSON.stringify(breadcrumbData)}</script>
      </Helmet>
      <ConversionHeader />
      
      <main className="container px-4 py-2 lg:py-2 pb-24 lg:pb-8">
        <article itemScope itemType="https://schema.org/RealEstateListing">
        {/* Breadcrumbs */}
        <nav aria-label="Breadcrumb" className="flex items-center gap-1 text-xs text-muted-foreground mb-2 lg:mb-1.5 overflow-x-auto">
          <ol className="flex items-center gap-1">
            <li>
              <Link to="/" className="hover:text-foreground transition-colors shrink-0">
                <Home className="h-3.5 w-3.5" />
              </Link>
            </li>
            <li><ChevronRight className="h-3.5 w-3.5 shrink-0" /></li>
            <li>
              <Link to="/resale" className="hover:text-foreground transition-colors shrink-0">
                For Sale
              </Link>
            </li>
            <li><ChevronRight className="h-3.5 w-3.5 shrink-0" /></li>
            <li>
              <Link to={`/resale?city=${listing.city}`} className="hover:text-foreground transition-colors shrink-0">
                {listing.city}
              </Link>
            </li>
            <li><ChevronRight className="h-3.5 w-3.5 shrink-0" /></li>
            <li><span className="text-foreground font-medium truncate max-w-[200px]">{address}</span></li>
          </ol>
        </nav>

        <div className="grid lg:grid-cols-3 gap-3 lg:gap-5">
          {/* Left Column - Images & Details */}
          <div className="lg:col-span-2 space-y-3 lg:space-y-3">
            {/* Image Gallery - REW Style */}
            <REWPhotoGallery
              photos={photos}
              virtualTourUrl={listing.virtual_tour_url}
              alt={address}
            />

            {/* Mobile & Tablet Hero Info - Unified single-column layout */}
            {isMobileOrTablet && (
              <div className="space-y-4">
                {/* Key Badges - FIRST, right under photo */}
                <div className="flex flex-wrap items-center gap-2">
                  {listing.year_built && listing.year_built >= 2024 && (
                    <Badge className="bg-gradient-to-r from-primary to-amber-500 text-primary-foreground gap-1 text-xs">
                      <Sparkles className="h-3 w-3" />
                      Move-In Ready
                    </Badge>
                  )}
                  {daysOnMarket !== null && (
                    <Badge className={`gap-1 text-xs ${daysOnMarket <= 7 ? 'bg-blue-600 text-white' : 'bg-muted text-muted-foreground'}`}>
                      <Clock className="h-3 w-3" />
                      {daysOnMarket === 0 ? 'New Today' : `${daysOnMarket}d ago`}
                    </Badge>
                  )}
                  <Badge variant="secondary" className="text-xs">
                    {formatPropertyType(listing.property_sub_type || listing.property_type)}
                  </Badge>
                  {listing.open_house_date && new Date(listing.open_house_date) >= new Date(new Date().toDateString()) && (
                    <Badge className="bg-orange-500 text-white gap-1 text-xs">
                      <Calendar className="h-3 w-3" />
                      Open House
                    </Badge>
                  )}
                </div>

                {/* Price - Large & Primary */}
                <div className="flex items-baseline gap-2 flex-wrap">
                  <span className="text-5xl sm:text-3xl font-bold text-foreground">
                    {formatPrice(listing.listing_price)}
                  </span>
                  {listing.living_area && (
                    <span className="text-sm text-muted-foreground">
                      ${Math.round(listing.listing_price / listing.living_area).toLocaleString()}/sqft
                    </span>
                  )}
                </div>

                {/* Address - Smaller */}
                <h1 className="text-sm font-medium text-muted-foreground">{address}</h1>

                {/* City & Neighborhood */}
                <div className="flex items-center gap-2 text-sm">
                  <Link to={`/resale?city=${listing.city}`} className="text-primary hover:underline font-medium">
                    {listing.city}
                  </Link>
                  {listing.neighborhood && (
                    <>
                      <span className="text-muted-foreground">•</span>
                      <span className="text-muted-foreground">{listing.neighborhood}</span>
                    </>
                  )}
                </div>

                {/* Bed/Bath/Sqft/Year - Compact Row */}
                <div className="flex flex-wrap items-center gap-4 text-sm">
                  {listing.bedrooms_total !== null && (
                    <span className="flex items-center gap-1.5">
                      <Bed className="h-4 w-4 text-primary" />
                      <span className="font-semibold">{listing.bedrooms_total}</span>
                      <span className="text-muted-foreground">Bed</span>
                    </span>
                  )}
                  {listing.bathrooms_total !== null && (
                    <span className="flex items-center gap-1.5">
                      <Bath className="h-4 w-4 text-primary" />
                      <span className="font-semibold">{listing.bathrooms_total}</span>
                      <span className="text-muted-foreground">Bath</span>
                    </span>
                  )}
                  {listing.living_area && (
                    <span className="flex items-center gap-1.5">
                      <Maximize className="h-4 w-4 text-primary" />
                      <span className="font-semibold">{listing.living_area.toLocaleString()}</span>
                      <span className="text-muted-foreground">sqft</span>
                    </span>
                  )}
                  {listing.year_built && (
                    <span className="flex items-center gap-1.5">
                      <Calendar className="h-4 w-4 text-primary" />
                      <span className="font-semibold">{listing.year_built}</span>
                    </span>
                  )}
                </div>

                {/* Listed By */}
                {(listing.list_agent_name || listing.list_office_name) && (
                  <p className="text-xs text-muted-foreground">
                    Listed by: {listing.list_agent_name}{listing.list_office_name && ` • ${listing.list_office_name}`}
                  </p>
                )}

                {/* Quick Actions - Maps, Street View, Share */}
                <div className="flex items-center gap-2 pt-2 border-t">
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-9 px-3 text-xs rounded-full gap-1.5"
                    onClick={() => {
                      if (listing.latitude && listing.longitude) {
                        window.open(`https://www.google.com/maps/search/?api=1&query=${listing.latitude},${listing.longitude}`, "_blank");
                      }
                    }}
                    disabled={!listing.latitude || !listing.longitude}
                  >
                    <Map className="h-3.5 w-3.5" />
                    Map
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-9 px-3 text-xs rounded-full gap-1.5"
                    onClick={() => {
                      if (listing.latitude && listing.longitude) {
                        window.open(`https://www.google.com/maps/@?api=1&map_action=pano&viewpoint=${listing.latitude},${listing.longitude}`, "_blank");
                      }
                    }}
                    disabled={!listing.latitude || !listing.longitude}
                  >
                    <MapPin className="h-3.5 w-3.5" />
                    Street
                  </Button>
                  {listing.virtual_tour_url && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-9 px-3 text-xs rounded-full gap-1.5"
                      asChild
                    >
                      <a href={listing.virtual_tour_url} target="_blank" rel="noopener noreferrer">
                        <Navigation className="h-3.5 w-3.5" />
                        Tour
                      </a>
                    </Button>
                  )}
                  <div className="ml-auto">
                    <ShareButtons title={`${address} - ${formatPropertyType(listing.property_type)}`} />
                  </div>
                </div>

                {/* Schedule Form - Hidden on mobile/tablet, show on desktop only */}
                <div className="hidden lg:block bg-card border rounded-xl p-4 shadow-sm">
                  <ResaleScheduleForm 
                    listingId={listing.id}
                    listingAddress={address}
                    listingCity={listing.city}
                  />
                </div>
              </div>
            )}

            {/* Desktop Quick Actions */}
            <div className="hidden lg:flex flex-wrap items-center gap-2">
              {listing.virtual_tour_url && (
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 px-3 text-xs rounded-full gap-1.5 hover:bg-muted"
                  asChild
                >
                  <a
                    href={listing.virtual_tour_url}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Navigation className="h-3.5 w-3.5" />
                    Virtual Tour
                  </a>
                </Button>
              )}
              <Button
                variant="outline"
                size="sm"
                className="h-8 px-3 text-xs rounded-full gap-1.5 hover:bg-muted"
                onClick={() => {
                  if (listing.latitude && listing.longitude) {
                    window.open(
                      `https://www.google.com/maps/search/?api=1&query=${listing.latitude},${listing.longitude}`,
                      "_blank"
                    );
                  }
                }}
                disabled={!listing.latitude || !listing.longitude}
              >
                <Map className="h-3.5 w-3.5" />
                Map
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="h-8 px-3 text-xs rounded-full gap-1.5 hover:bg-muted"
                onClick={() => {
                  if (listing.latitude && listing.longitude) {
                    window.open(
                      `https://www.google.com/maps/@?api=1&map_action=pano&viewpoint=${listing.latitude},${listing.longitude}`,
                      "_blank"
                    );
                  }
                }}
                disabled={!listing.latitude || !listing.longitude}
              >
                <MapPin className="h-3.5 w-3.5" />
                Street View
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="h-8 px-3 text-xs rounded-full gap-1.5 hover:bg-muted"
                onClick={() => {
                  if (listing.latitude && listing.longitude) {
                    window.open(
                      `https://www.google.com/maps/dir/?api=1&destination=${listing.latitude},${listing.longitude}`,
                      "_blank"
                    );
                  }
                }}
                disabled={!listing.latitude || !listing.longitude}
              >
                <Navigation className="h-3.5 w-3.5" />
                Directions
              </Button>
              <div className="ml-auto">
                <ShareButtons title={`${address} - ${formatPropertyType(listing.property_type)}`} />
              </div>
            </div>

            {/* Desktop Price Section */}
            <div className="hidden lg:block space-y-1">
              {/* Badges Row */}
              <div className="flex flex-wrap items-center gap-1.5">
                {listing.year_built && listing.year_built >= 2024 && (
                  <Badge className="bg-gradient-to-r from-primary to-amber-500 text-primary-foreground gap-1">
                    <Sparkles className="h-3 w-3" />
                    New Construction
                  </Badge>
                )}
                <Badge variant="secondary" className="text-xs">
                  {formatPropertyType(listing.property_sub_type || listing.property_type)}
                </Badge>
                <Badge 
                  variant="secondary" 
                  className={listing.mls_status === "Active" ? "bg-green-500/10 text-green-700 border-green-200" : ""}
                >
                  {listing.mls_status}
                </Badge>
                {daysOnMarket !== null && daysOnMarket >= 0 && (
                  daysOnMarket <= 7 ? (
                    <Badge className="bg-blue-600 text-white gap-1">
                      <Clock className="h-3 w-3" />
                      {daysOnMarket === 0 ? 'New Today' : `${daysOnMarket} Days on Market`}
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="text-xs gap-1">
                      <Clock className="h-3 w-3" />
                      {daysOnMarket} Days on Market
                    </Badge>
                  )
                )}
                {listing.open_house_date && new Date(listing.open_house_date) >= new Date(new Date().toDateString()) && (
                  <Badge className="bg-orange-500 text-white gap-1">
                    <Calendar className="h-3 w-3" />
                    Open House: {new Date(listing.open_house_date).toLocaleDateString('en-CA', { weekday: 'short', month: 'short', day: 'numeric' })}
                    {listing.open_house_start_time && ` ${listing.open_house_start_time.slice(0, 5)}`}
                    {listing.open_house_end_time && `-${listing.open_house_end_time.slice(0, 5)}`}
                  </Badge>
                )}
              </div>
              
              {/* Price with Est. Monthly */}
              <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
                <span className="text-2xl md:text-3xl font-bold text-foreground">
                  {formatPrice(listing.listing_price)}
                </span>
                {listing.living_area && (
                  <span className="text-sm font-medium text-muted-foreground">
                    ${Math.round(listing.listing_price / listing.living_area).toLocaleString()}/sqft
                  </span>
                )}
              </div>

              {/* Estimated Monthly */}
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">
                  Est. {formatPrice(Math.round(listing.listing_price * 0.00507))}/mo
                </span>
                <span className="text-muted-foreground">•</span>
                <button 
                  onClick={scrollToForm}
                  className="text-sm text-primary hover:underline font-medium"
                >
                  Get pre-approved
                </button>
              </div>

              {/* Full Address */}
              <h1 className="text-lg md:text-xl font-semibold text-foreground">
                {address}
              </h1>
              
              {/* City, Province, Postal • Neighborhood */}
              <div className="flex flex-wrap items-center gap-1 text-sm text-muted-foreground">
                <Link to={`/resale?city=${listing.city}`} className="text-primary hover:underline font-medium">
                  {listing.city}
                </Link>
                <span>, BC</span>
                {listing.postal_code && <span>, {listing.postal_code}</span>}
                {listing.neighborhood && (
                  <>
                    <span className="mx-1">•</span>
                    <span className="font-medium">{listing.neighborhood}</span>
                  </>
                )}
              </div>

              {/* Beds • Baths • Sqft • Year - Inline with icons */}
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-foreground">
                {listing.bedrooms_total !== null && (
                  <span className="flex items-center gap-1.5">
                    <Bed className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">{listing.bedrooms_total}</span>
                    <span className="text-muted-foreground">Beds</span>
                  </span>
                )}
                {listing.bathrooms_total !== null && (
                  <span className="flex items-center gap-1.5">
                    <Bath className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">{listing.bathrooms_total}</span>
                    <span className="text-muted-foreground">Baths</span>
                  </span>
                )}
                {listing.living_area && (
                  <span className="flex items-center gap-1.5">
                    <Maximize className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">{listing.living_area.toLocaleString()}</span>
                    <span className="text-muted-foreground">Sqft</span>
                  </span>
                )}
                {listing.year_built && (
                  <span className="flex items-center gap-1.5">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">{listing.year_built}</span>
                    <span className="text-muted-foreground">Built</span>
                  </span>
                )}
              </div>

              {listing.original_list_price && listing.original_list_price !== listing.listing_price && (
                <p className="text-sm text-muted-foreground mt-3 flex items-center gap-2">
                  <span>Original: <span className="line-through">{formatPrice(listing.original_list_price)}</span></span>
                  {listing.original_list_price > listing.listing_price && (
                    <Badge variant="outline" className="text-xs text-green-600 border-green-200 bg-green-50">
                      {formatPrice(listing.original_list_price - listing.listing_price)} below asking
                    </Badge>
                  )}
                </p>
              )}
            </div>

            {/* About this home */}
            {listing.public_remarks && (
              <div>
                <h2 className="text-lg md:text-xl font-bold text-foreground mb-3">About this home</h2>
                <p className="text-sm md:text-base text-muted-foreground leading-relaxed whitespace-pre-line">
                  {listing.public_remarks}
                </p>
              </div>
            )}

            {/* Home Facts & Features - Comprehensive REW-style */}
            <div className="space-y-6">
              <h2 className="text-lg md:text-xl font-bold text-foreground flex items-center gap-2">
                <FileText className="h-5 w-5 text-primary" />
                Home Facts & Features
              </h2>

              {/* Price Details Section */}
              <div className="bg-muted/30 rounded-xl p-4 md:p-5">
                <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-primary" />
                  Price Details
                </h3>
                <div className="grid grid-cols-1 gap-3">
                  <div className="flex justify-between items-center py-2 border-b border-border/50">
                    <span className="text-sm text-muted-foreground">List Price</span>
                    <span className="font-semibold text-foreground">{formatPrice(listing.listing_price)}</span>
                  </div>
                  {listing.original_list_price && listing.original_list_price !== listing.listing_price && (
                    <div className="flex justify-between items-center py-2 border-b border-border/50">
                      <span className="text-sm text-muted-foreground">Original Price</span>
                      <span className="font-semibold text-foreground line-through">{formatPrice(listing.original_list_price)}</span>
                    </div>
                  )}
                  {listing.tax_annual_amount !== null && (
                    <div className="flex justify-between items-center py-2 border-b border-border/50">
                      <span className="text-sm text-muted-foreground">Gross Taxes {listing.tax_year ? `(${listing.tax_year})` : ''}</span>
                      <span className="font-semibold text-foreground">{formatPrice(listing.tax_annual_amount)}</span>
                    </div>
                  )}
                  {listing.association_fee !== null && (
                    <div className="flex justify-between items-center py-2 border-b border-border/50">
                      <span className="text-sm text-muted-foreground">Strata Maintenance Fees</span>
                      <span className="font-semibold text-foreground">
                        {formatPrice(listing.association_fee)}{listing.association_fee_frequency ? `/${listing.association_fee_frequency === 'Monthly' ? 'mo' : listing.association_fee_frequency.toLowerCase()}` : '/mo'}
                      </span>
                    </div>
                  )}
                  {listing.living_area && (
                    <div className="flex justify-between items-center py-2 border-b border-border/50">
                      <span className="text-sm text-muted-foreground">Price per Sqft</span>
                      <span className="font-semibold text-foreground">${Math.round(listing.listing_price / listing.living_area).toLocaleString()}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Home Facts Section */}
              <div className="bg-muted/30 rounded-xl p-4 md:p-5">
                <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                  <Home className="h-4 w-4 text-primary" />
                  Home Facts
                </h3>
                <div className="grid grid-cols-1 gap-3">
                  {listing.bedrooms_total !== null && (
                    <div className="flex justify-between items-center py-2 border-b border-border/50">
                      <span className="text-sm text-muted-foreground">Bedrooms</span>
                      <span className="font-semibold text-foreground">{listing.bedrooms_total}</span>
                    </div>
                  )}
                  {listing.bathrooms_total !== null && (
                    <div className="flex justify-between items-center py-2 border-b border-border/50">
                      <span className="text-sm text-muted-foreground">Bathrooms</span>
                      <span className="font-semibold text-foreground">
                        {listing.bathrooms_total}
                        {listing.bathrooms_full && listing.bathrooms_half && ` (${listing.bathrooms_full} Full, ${listing.bathrooms_half} Half)`}
                      </span>
                    </div>
                  )}
                  {listing.living_area && (
                    <div className="flex justify-between items-center py-2 border-b border-border/50">
                      <span className="text-sm text-muted-foreground">Living Area</span>
                      <span className="font-semibold text-foreground">{listing.living_area.toLocaleString()} sqft</span>
                    </div>
                  )}
                  <div className="flex justify-between items-center py-2 border-b border-border/50">
                    <span className="text-sm text-muted-foreground">Property Type</span>
                    <span className="font-semibold text-foreground">{formatPropertyType(listing.property_sub_type || listing.property_type)}</span>
                  </div>
                  {listing.year_built && (
                    <div className="flex justify-between items-center py-2 border-b border-border/50">
                      <span className="text-sm text-muted-foreground">Year Built</span>
                      <span className="font-semibold text-foreground">
                        {listing.year_built} ({new Date().getFullYear() - listing.year_built} yrs old)
                      </span>
                    </div>
                  )}
                  {listing.stories && (
                    <div className="flex justify-between items-center py-2 border-b border-border/50">
                      <span className="text-sm text-muted-foreground">Stories</span>
                      <span className="font-semibold text-foreground">{listing.stories}</span>
                    </div>
                  )}
                  {listing.lot_size_area && (
                    <div className="flex justify-between items-center py-2 border-b border-border/50">
                      <span className="text-sm text-muted-foreground">Lot Size</span>
                      <span className="font-semibold text-foreground">
                        {listing.lot_size_area.toLocaleString()} {listing.lot_size_units || 'sqft'}
                      </span>
                    </div>
                  )}
                  {listing.parking_total !== null && listing.parking_total > 0 && (
                    <div className="flex justify-between items-center py-2 border-b border-border/50">
                      <span className="text-sm text-muted-foreground">Parking</span>
                      <span className="font-semibold text-foreground">
                        {listing.parking_total} space{listing.parking_total > 1 ? 's' : ''}
                        {listing.garage_spaces ? ` (${listing.garage_spaces} garage)` : ''}
                      </span>
                    </div>
                  )}
                  {listing.subdivision_name && (
                    <div className="flex justify-between items-center py-2 border-b border-border/50">
                      <span className="text-sm text-muted-foreground">Community</span>
                      <span className="font-semibold text-foreground">{listing.subdivision_name}</span>
                    </div>
                  )}
                  {(listing.pool_yn || listing.waterfront_yn) && (
                    <>
                      {listing.pool_yn && (
                        <div className="flex justify-between items-center py-2 border-b border-border/50">
                          <span className="text-sm text-muted-foreground">Pool</span>
                          <span className="font-semibold text-foreground text-green-600">Yes</span>
                        </div>
                      )}
                      {listing.waterfront_yn && (
                        <div className="flex justify-between items-center py-2 border-b border-border/50">
                          <span className="text-sm text-muted-foreground">Waterfront</span>
                          <span className="font-semibold text-foreground text-green-600">Yes</span>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>

              {/* Heating & Cooling Section */}
              {(listing.heating?.length || listing.cooling?.length) && (
                <div className="bg-muted/30 rounded-xl p-4 md:p-5">
                  <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                    <Flame className="h-4 w-4 text-primary" />
                    Heating & Cooling
                  </h3>
                  <div className="grid grid-cols-1 gap-3">
                    {listing.heating && listing.heating.length > 0 && (
                      <div className="flex justify-between items-start py-2 border-b border-border/50">
                        <span className="text-sm text-muted-foreground">Heating</span>
                        <span className="font-semibold text-foreground text-right max-w-[60%]">{listing.heating.join(", ")}</span>
                      </div>
                    )}
                    {listing.cooling && listing.cooling.length > 0 && (
                      <div className="flex justify-between items-start py-2 border-b border-border/50">
                        <span className="text-sm text-muted-foreground flex items-center gap-1">
                          <Snowflake className="h-3 w-3" /> Cooling
                        </span>
                        <span className="font-semibold text-foreground text-right max-w-[60%]">{listing.cooling.join(", ")}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Features Section */}
              {listing.interior_features && listing.interior_features.length > 0 && (
                <div className="bg-muted/30 rounded-xl p-4 md:p-5">
                  <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-primary" />
                    Features
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {listing.interior_features.map((feature, idx) => (
                      <Badge key={idx} variant="secondary" className="text-xs">
                        {feature}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Amenities Section */}
              {listing.community_features && listing.community_features.length > 0 && (
                <div className="bg-muted/30 rounded-xl p-4 md:p-5">
                  <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                    <Users className="h-4 w-4 text-primary" />
                    Amenities
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {listing.community_features.map((feature, idx) => (
                      <Badge key={idx} variant="secondary" className="text-xs">
                        {feature}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Appliances Section */}
              {listing.appliances && listing.appliances.length > 0 && (
                <div className="bg-muted/30 rounded-xl p-4 md:p-5">
                  <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                    <Layers className="h-4 w-4 text-primary" />
                    Appliances
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {listing.appliances.map((appliance, idx) => (
                      <Badge key={idx} variant="secondary" className="text-xs">
                        {appliance}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Exterior Features & View */}
              {(listing.exterior_features?.length || listing.view?.length) && (
                <div className="bg-muted/30 rounded-xl p-4 md:p-5 space-y-4">
                  {listing.exterior_features && listing.exterior_features.length > 0 && (
                    <div>
                      <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                        <TreePine className="h-4 w-4 text-primary" />
                        Exterior Features
                      </h3>
                      <div className="flex flex-wrap gap-2">
                        {listing.exterior_features.map((feature, idx) => (
                          <Badge key={idx} variant="secondary" className="text-xs">
                            {feature}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                  {listing.view && listing.view.length > 0 && (
                    <div>
                      <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                        <Eye className="h-4 w-4 text-primary" />
                        View
                      </h3>
                      <div className="flex flex-wrap gap-2">
                        {listing.view.map((v, idx) => (
                          <Badge key={idx} variant="secondary" className="text-xs">
                            {v}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Agent Details Section */}
              {(listing.list_agent_name || listing.list_office_name || listing.buyer_agent_name) && (
                <div className="bg-muted/30 rounded-xl p-4 md:p-5">
                  <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                    <User className="h-4 w-4 text-primary" />
                    Agent Details
                  </h3>
                  <div className="grid grid-cols-1 gap-3">
                    {listing.list_agent_name && (
                      <div className="flex justify-between items-center py-2 border-b border-border/50">
                        <span className="text-sm text-muted-foreground">Listing Agent</span>
                        <span className="font-semibold text-foreground">{listing.list_agent_name}</span>
                      </div>
                    )}
                    {listing.list_office_name && (
                      <div className="flex justify-between items-center py-2 border-b border-border/50">
                        <span className="text-sm text-muted-foreground">Brokerage</span>
                        <span className="font-semibold text-foreground">{listing.list_office_name}</span>
                      </div>
                    )}
                    {listing.list_agent_phone && (
                      <div className="flex justify-between items-center py-2 border-b border-border/50">
                        <span className="text-sm text-muted-foreground">Agent Phone</span>
                        <a href={`tel:${listing.list_agent_phone}`} className="font-semibold text-primary hover:underline">
                          {listing.list_agent_phone}
                        </a>
                      </div>
                    )}
                    {listing.buyer_agent_name && (
                      <div className="flex justify-between items-center py-2 border-b border-border/50">
                        <span className="text-sm text-muted-foreground">Buyer's Agent</span>
                        <span className="font-semibold text-foreground">{listing.buyer_agent_name}</span>
                      </div>
                    )}
                    {listing.buyer_office_name && (
                      <div className="flex justify-between items-center py-2 border-b border-border/50">
                        <span className="text-sm text-muted-foreground">Buyer's Brokerage</span>
                        <span className="font-semibold text-foreground">{listing.buyer_office_name}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Listing Details Section */}
              <div className="bg-muted/30 rounded-xl p-4 md:p-5">
                <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                  <FileText className="h-4 w-4 text-primary" />
                  Listing Details
                </h3>
                <div className="grid grid-cols-1 gap-3">
                  {daysOnMarket !== null && (
                    <div className="flex justify-between items-center py-2 border-b border-border/50">
                      <span className="text-sm text-muted-foreground">Days on Market</span>
                      <span className="font-semibold text-foreground">{daysOnMarket} Days</span>
                    </div>
                  )}
                  <div className="flex justify-between items-center py-2 border-b border-border/50">
                    <span className="text-sm text-muted-foreground">MLS® Number</span>
                    <span className="font-semibold text-foreground">{listing.listing_id}</span>
                  </div>
                  {listing.list_date && (
                    <div className="flex justify-between items-center py-2 border-b border-border/50">
                      <span className="text-sm text-muted-foreground">Listed Date</span>
                      <span className="font-semibold text-foreground">
                        {new Date(listing.list_date).toLocaleDateString('en-CA', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between items-center py-2 border-b border-border/50">
                    <span className="text-sm text-muted-foreground">Status</span>
                    <Badge 
                      variant="secondary" 
                      className={listing.mls_status === "Active" ? "bg-green-500/10 text-green-700 border-green-200" : ""}
                    >
                      {listing.mls_status}
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-border/50">
                    <span className="text-sm text-muted-foreground">Source</span>
                    <span className="font-semibold text-foreground text-xs">CREA DDF®</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Virtual Tour */}
            {listing.virtual_tour_url && (
              <div>
                <h2 className="text-base md:text-lg font-semibold text-foreground mb-3">Virtual Tour</h2>
                <a 
                  href={listing.virtual_tour_url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-primary hover:underline"
                >
                  View Virtual Tour →
                </a>
              </div>
            )}

            {/* Walkability & Transit Scores */}
            {listing.latitude && listing.longitude && (
              <WalkTransitScore
                latitude={listing.latitude}
                longitude={listing.longitude}
              />
            )}

            {/* Interactive Mini-Map */}
            {listing.latitude && listing.longitude && (
              <ResaleListingMiniMap
                latitude={listing.latitude}
                longitude={listing.longitude}
                address={address}
                price={formatPrice(listing.listing_price)}
              />
            )}

            {/* Property Value Trends */}
            <PropertyValueTrends
              city={listing.city}
              neighborhood={listing.neighborhood}
              propertyType={listing.property_sub_type || listing.property_type}
              currentPrice={listing.listing_price}
            />

            {/* Listing Details - Compact */}
            <div className="border-t pt-4 space-y-2">
              <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                <span>MLS® #{listing.listing_id}</span>
                {listing.list_date && (
                  <span>Listed: {new Date(listing.list_date).toLocaleDateString('en-CA', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                )}
                {daysOnMarket !== null && <span>{daysOnMarket} days on market</span>}
              </div>
              {(listing.list_agent_name || listing.list_office_name) && (
                <p className="text-xs text-muted-foreground">
                  Listed by: {listing.list_agent_name}{listing.list_office_name && ` • ${listing.list_office_name}`}
                </p>
              )}
              <p className="text-xs text-muted-foreground">
                Data from CREA DDF®. Information deemed reliable but not guaranteed.
              </p>
            </div>
          </div>

          {/* Right Column - Contact Form & Calculator (Desktop Only) */}
          <div className="hidden lg:block space-y-6">
            <div ref={formRef} className="sticky top-24">
              {/* Schedule Tour Form */}
              <div className="bg-card border rounded-xl p-4 md:p-6 shadow-sm mb-6">
                <ResaleScheduleForm 
                  listingId={listing.id}
                  listingAddress={address}
                  listingCity={listing.city}
                />
              </div>

              {/* Mortgage Calculator */}
              <MortgageCalculator price={listing.listing_price} />
            </div>
          </div>
        </div>

        {/* Tablet: Mortgage Calculator Below Content */}
        <div className="hidden md:block lg:hidden mt-8">
          <MortgageCalculator price={listing.listing_price} />
        </div>

        {/* Similar Listings */}
        <div className="mt-12 md:mt-16 border-t pt-8">
          <SimilarListings 
            city={listing.city}
            bedrooms={listing.bedrooms_total}
            bathrooms={listing.bathrooms_total}
            price={listing.listing_price}
            excludeListingKey={listing.listing_key}
          />
        </div>

        {/* Related Listings */}
        <div className="mt-12 md:mt-16 border-t pt-8">
          <RelatedCityListings 
            city={listing.city}
            neighborhood={listing.neighborhood}
            excludeListingKey={listing.listing_key}
          />
        </div>

        {/* Related Presale Projects */}
        <div className="mt-8">
          <RelatedPresaleProjects 
            city={listing.city}
            neighborhood={listing.neighborhood || undefined}
            title={`Presale Projects in ${listing.city}`}
            subtitle="Buy before completion and customize your new home"
          />
        </div>
        </article>
      </main>

      {/* Mobile CTA Bar - Only on mobile, not tablet (form is inline on tablet) */}
      <div className="fixed bottom-0 left-0 right-0 bg-background/95 backdrop-blur-sm border-t px-4 py-3 flex items-center gap-3 md:hidden z-40 shadow-lg safe-area-pb">
        <Button 
          variant="outline"
          onClick={() => window.location.href = "tel:+16722581100"} 
          className="h-12 w-12 shrink-0 rounded-xl"
        >
          <Phone className="h-5 w-5" />
        </Button>
        <Button 
          onClick={() => setShowMobileScheduler(true)} 
          className="flex-1 h-12 bg-foreground hover:bg-foreground/90 text-background font-semibold"
        >
          <Calendar className="h-4 w-4 mr-2" />
          Schedule Showing
        </Button>
      </div>

      {/* Mobile Scheduler Sheet */}
      <Sheet open={showMobileScheduler} onOpenChange={setShowMobileScheduler}>
        <SheetContent side="bottom" className="h-auto max-h-[90vh] rounded-t-2xl">
          <SheetHeader className="pb-2">
            <SheetTitle className="text-left">{address}</SheetTitle>
          </SheetHeader>
          <div className="overflow-y-auto max-h-[calc(90vh-80px)] -mx-6 px-6 pb-safe">
            <ResaleScheduleForm
              listingId={listing.id}
              listingAddress={address}
              listingCity={listing.city}
            />
          </div>
        </SheetContent>
      </Sheet>

      <Footer />
    </div>
  );
}
