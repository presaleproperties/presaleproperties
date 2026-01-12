import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Helmet } from "react-helmet-async";
import { useRef, useState } from "react";
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
  TreePine
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { ConversionHeader } from "@/components/conversion/ConversionHeader";
import { Footer } from "@/components/layout/Footer";
import { ShareButtons } from "@/components/listings/ShareButtons";
import { MortgageCalculator } from "@/components/listings/MortgageCalculator";
import { GalleryWithLightbox } from "@/components/ui/lightbox-gallery";
import { ResaleScheduleForm } from "@/components/resale/ResaleScheduleForm";
import { RelatedCityListings } from "@/components/resale/RelatedCityListings";
import { PropertyValueTrends } from "@/components/resale/PropertyValueTrends";
import { ResaleListingMiniMap } from "@/components/resale/ResaleListingMiniMap";
import { WalkTransitScore } from "@/components/resale/WalkTransitScore";

import { SimilarListings } from "@/components/resale/SimilarListings";
import { RelatedPresaleProjects } from "@/components/resale/RelatedPresaleProjects";
import { useIsMobile } from "@/hooks/use-mobile";

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
};

export default function ResaleListingDetail() {
  const { listingKey } = useParams<{ listingKey: string }>();
  const formRef = useRef<HTMLDivElement>(null);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const isMobile = useIsMobile();

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
      
      <main className="container px-4 py-4 md:py-8 pb-24 lg:pb-8">
        {/* Breadcrumbs */}
        <nav aria-label="Breadcrumb" className="flex items-center gap-1 text-sm text-muted-foreground mb-4 overflow-x-auto">
          <Link to="/" className="hover:text-foreground transition-colors shrink-0">
            <Home className="h-3.5 w-3.5" />
          </Link>
          <ChevronRight className="h-3.5 w-3.5 shrink-0" />
          <Link to="/resale" className="hover:text-foreground transition-colors shrink-0">
            For Sale
          </Link>
          <ChevronRight className="h-3.5 w-3.5 shrink-0" />
          <Link to={`/resale?city=${listing.city}`} className="hover:text-foreground transition-colors shrink-0">
            {listing.city}
          </Link>
          <ChevronRight className="h-3.5 w-3.5 shrink-0" />
          <span className="text-foreground font-medium truncate max-w-[200px]">{address}</span>
        </nav>

        <div className="grid lg:grid-cols-3 gap-6 lg:gap-8">
          {/* Left Column - Images & Details */}
          <div className="lg:col-span-2 space-y-6 md:space-y-8">
            {/* Image Gallery */}
            {photos.length > 0 ? (
              <GalleryWithLightbox
                images={photos.map(p => p.url)}
                selectedIndex={selectedImageIndex}
                onSelectIndex={setSelectedImageIndex}
                alt={address}
                className="rounded-xl overflow-hidden"
              />
            ) : (
              <div className="aspect-[4/3] bg-muted rounded-xl flex items-center justify-center">
                <Home className="h-16 w-16 text-muted-foreground/50" />
              </div>
            )}

            {/* Quick Actions - Map & Street View */}
            <div className="flex flex-wrap items-center gap-2">
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

            {/* Price Section */}
            <div>
              {/* Badges Row */}
              <div className="flex flex-wrap items-center gap-2 mb-3">
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
                {/* Days on Market - Prominent display */}
                {listing.days_on_market !== null && listing.days_on_market <= 3 && (
                  <Badge className="bg-blue-600 text-white gap-1">
                    <Clock className="h-3 w-3" />
                    New Today
                  </Badge>
                )}
                {listing.days_on_market !== null && listing.days_on_market > 3 && listing.days_on_market <= 7 && (
                  <Badge className="bg-blue-500 text-white gap-1">
                    <Clock className="h-3 w-3" />
                    {listing.days_on_market} Days on Market
                  </Badge>
                )}
                {listing.days_on_market !== null && listing.days_on_market > 7 && (
                  <Badge variant="outline" className="text-xs gap-1">
                    <Clock className="h-3 w-3" />
                    {listing.days_on_market} Days on Market
                  </Badge>
                )}
              </div>
              
              {/* Price with Est. Monthly */}
              <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1 mb-2">
                <span className="text-2xl sm:text-3xl md:text-4xl font-bold text-foreground">
                  {formatPrice(listing.listing_price)}
                </span>
                {listing.living_area && (
                  <span className="text-sm font-medium text-muted-foreground">
                    ${Math.round(listing.listing_price / listing.living_area).toLocaleString()}/sqft
                  </span>
                )}
              </div>

              {/* Estimated Monthly */}
              <div className="flex items-center gap-2 mb-3">
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
              <h1 className="text-lg sm:text-xl md:text-2xl font-semibold text-foreground mb-1">
                {address}
              </h1>
              
              {/* City, Province, Postal • Neighborhood */}
              <div className="flex flex-wrap items-center gap-1 text-sm text-muted-foreground mb-3">
                <Link to={`/resale?city=${listing.city}`} className="text-primary hover:underline font-medium">
                  {listing.city}
                </Link>
                <span>, BC</span>
                {listing.postal_code && <span className="hidden sm:inline">, {listing.postal_code}</span>}
                {listing.neighborhood && (
                  <>
                    <span className="mx-1">•</span>
                    <span className="font-medium">{listing.neighborhood}</span>
                  </>
                )}
              </div>

              {/* Beds • Baths • Sqft • Year - Inline with icons */}
              <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm md:text-base text-foreground">
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
                <p className="text-xs md:text-sm text-muted-foreground mt-3 flex items-center gap-2">
                  <span>Original: <span className="line-through">{formatPrice(listing.original_list_price)}</span></span>
                  {listing.original_list_price > listing.listing_price && (
                    <Badge variant="outline" className="text-xs text-green-600 border-green-200 bg-green-50">
                      {formatPrice(listing.original_list_price - listing.listing_price)} below asking
                    </Badge>
                  )}
                </p>
              )}
            </div>

            {/* Price Details Section */}
            <div className="bg-muted/30 rounded-xl p-4 md:p-6">
              <h2 className="text-base md:text-lg font-semibold text-foreground mb-3 md:mb-4">Price Details</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex justify-between items-center py-2 border-b border-border/50">
                  <span className="text-sm text-muted-foreground">List Price</span>
                  <span className="font-semibold text-foreground">{formatPrice(listing.listing_price)}</span>
                </div>
                {listing.tax_annual_amount !== null && (
                  <div className="flex justify-between items-center py-2 border-b border-border/50">
                    <span className="text-sm text-muted-foreground">
                      Gross Taxes {listing.tax_year ? `for ${listing.tax_year}` : ''}
                    </span>
                    <span className="font-semibold text-foreground">
                      {listing.tax_annual_amount === 0 ? '$0' : formatPrice(listing.tax_annual_amount)}
                    </span>
                  </div>
                )}
                {listing.association_fee !== null && (
                  <div className="flex justify-between items-center py-2 border-b border-border/50">
                    <span className="text-sm text-muted-foreground">Strata Maintenance Fees</span>
                    <span className="font-semibold text-foreground">
                      {formatPrice(listing.association_fee)}
                      {listing.association_fee_frequency && ` /${listing.association_fee_frequency.toLowerCase()}`}
                    </span>
                  </div>
                )}
                {listing.living_area && (
                  <div className="flex justify-between items-center py-2 border-b border-border/50">
                    <span className="text-sm text-muted-foreground">Price per Sqft</span>
                    <span className="font-semibold text-foreground">
                      ${Math.round(listing.listing_price / listing.living_area).toLocaleString()}/sqft
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Home Facts Section */}
            <div className="bg-muted/30 rounded-xl p-4 md:p-6">
              <h2 className="text-base md:text-lg font-semibold text-foreground mb-3 md:mb-4">Home Facts</h2>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-x-4 gap-y-3">
                <div className="flex justify-between items-center py-2 border-b border-border/50">
                  <span className="text-sm text-muted-foreground">Bedrooms</span>
                  <span className="font-semibold text-foreground">{listing.bedrooms_total ?? "—"}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-border/50">
                  <span className="text-sm text-muted-foreground">
                    {listing.bathrooms_full ? 'Full Bathrooms' : 'Bathrooms'}
                  </span>
                  <span className="font-semibold text-foreground">
                    {listing.bathrooms_full ?? listing.bathrooms_total ?? "—"}
                  </span>
                </div>
                {listing.bathrooms_half !== null && listing.bathrooms_half > 0 && (
                  <div className="flex justify-between items-center py-2 border-b border-border/50">
                    <span className="text-sm text-muted-foreground">Half Bathrooms</span>
                    <span className="font-semibold text-foreground">{listing.bathrooms_half}</span>
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
                      Built in {listing.year_built}
                      {new Date().getFullYear() - listing.year_built <= 2 && (
                        <span className="text-xs text-muted-foreground ml-1">
                          ({new Date().getFullYear() - listing.year_built} yr{new Date().getFullYear() - listing.year_built !== 1 ? 's' : ''} old)
                        </span>
                      )}
                    </span>
                  </div>
                )}
                {listing.living_area && (
                  <div className="flex justify-between items-center py-2 border-b border-border/50">
                    <span className="text-sm text-muted-foreground">Living Area</span>
                    <span className="font-semibold text-foreground">{listing.living_area.toLocaleString()} sqft</span>
                  </div>
                )}
                {listing.lot_size_area && (
                  <div className="flex justify-between items-center py-2 border-b border-border/50">
                    <span className="text-sm text-muted-foreground">Lot Size</span>
                    <span className="font-semibold text-foreground">{listing.lot_size_area.toLocaleString()} sqft</span>
                  </div>
                )}
                {listing.stories && (
                  <div className="flex justify-between items-center py-2 border-b border-border/50">
                    <span className="text-sm text-muted-foreground">Stories</span>
                    <span className="font-semibold text-foreground">{listing.stories}</span>
                  </div>
                )}
                <div className="flex justify-between items-center py-2 border-b border-border/50">
                  <span className="text-sm text-muted-foreground">Parking</span>
                  <span className="font-semibold text-foreground">
                    {listing.parking_total ? `${listing.parking_total} Space${listing.parking_total > 1 ? 's' : ''}` : "—"}
                    {listing.garage_spaces ? ` (${listing.garage_spaces} Garage)` : ""}
                  </span>
                </div>
                {(listing.heating && listing.heating.length > 0) && (
                  <div className="flex justify-between items-center py-2 border-b border-border/50">
                    <span className="text-sm text-muted-foreground">Heating Type</span>
                    <span className="font-semibold text-foreground text-right text-sm">{listing.heating.join(", ")}</span>
                  </div>
                )}
                {(listing.cooling && listing.cooling.length > 0) && (
                  <div className="flex justify-between items-center py-2 border-b border-border/50">
                    <span className="text-sm text-muted-foreground">Cooling</span>
                    <span className="font-semibold text-foreground text-right text-sm">{listing.cooling.join(", ")}</span>
                  </div>
                )}
                {listing.pool_yn && (
                  <div className="flex justify-between items-center py-2 border-b border-border/50">
                    <span className="text-sm text-muted-foreground">Pool</span>
                    <span className="font-semibold text-foreground">Yes</span>
                  </div>
                )}
                {listing.waterfront_yn && (
                  <div className="flex justify-between items-center py-2 border-b border-border/50">
                    <span className="text-sm text-muted-foreground">Waterfront</span>
                    <span className="font-semibold text-foreground">Yes</span>
                  </div>
                )}
                {(listing.neighborhood || listing.subdivision_name) && (
                  <div className="flex justify-between items-center py-2 border-b border-border/50">
                    <span className="text-sm text-muted-foreground">Community</span>
                    <span className="font-semibold text-foreground">{listing.neighborhood || listing.subdivision_name}</span>
                  </div>
                )}
              </div>
            </div>

            {/* About this home - REW Style */}
            {listing.public_remarks && (
              <div>
                <h2 className="text-xl md:text-2xl font-bold text-foreground mb-4">About this home</h2>
                <p className="text-sm md:text-base text-muted-foreground leading-relaxed whitespace-pre-line">
                  {listing.public_remarks}
                </p>
              </div>
            )}

            {/* Features & Amenities */}
            {(listing.interior_features?.length || listing.exterior_features?.length || listing.appliances?.length || listing.community_features?.length || listing.view?.length) && (
              <div className="bg-muted/30 rounded-xl p-4 md:p-6 space-y-4">
                <h2 className="text-base md:text-lg font-semibold text-foreground">Features & Amenities</h2>
                
                {listing.interior_features && listing.interior_features.length > 0 && (
                  <div>
                    <h3 className="text-sm font-medium text-foreground mb-2">Features</h3>
                    <p className="text-sm text-muted-foreground">{listing.interior_features.join(", ")}</p>
                  </div>
                )}
                
                {listing.community_features && listing.community_features.length > 0 && (
                  <div>
                    <h3 className="text-sm font-medium text-foreground mb-2">Amenities</h3>
                    <p className="text-sm text-muted-foreground">{listing.community_features.join(", ")}</p>
                  </div>
                )}
                
                {listing.appliances && listing.appliances.length > 0 && (
                  <div>
                    <h3 className="text-sm font-medium text-foreground mb-2">Appliances</h3>
                    <p className="text-sm text-muted-foreground">{listing.appliances.join(", ")}</p>
                  </div>
                )}

                {listing.exterior_features && listing.exterior_features.length > 0 && (
                  <div>
                    <h3 className="text-sm font-medium text-foreground mb-2">Exterior Features</h3>
                    <p className="text-sm text-muted-foreground">{listing.exterior_features.join(", ")}</p>
                  </div>
                )}

                {listing.view && listing.view.length > 0 && (
                  <div>
                    <h3 className="text-sm font-medium text-foreground mb-2">View</h3>
                    <p className="text-sm text-muted-foreground">{listing.view.join(", ")}</p>
                  </div>
                )}
              </div>
            )}

            {/* Agent Details */}
            {(listing.list_agent_name || listing.list_office_name) && (
              <div className="bg-muted/30 rounded-xl p-4 md:p-6">
                <h2 className="text-base md:text-lg font-semibold text-foreground mb-3 md:mb-4">Agent Details</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {listing.list_agent_name && (
                    <div className="flex justify-between items-center py-2 border-b border-border/50">
                      <span className="text-sm text-muted-foreground">Primary Agent</span>
                      <span className="font-semibold text-foreground">{listing.list_agent_name}</span>
                    </div>
                  )}
                  {listing.list_office_name && (
                    <div className="flex justify-between items-center py-2 border-b border-border/50">
                      <span className="text-sm text-muted-foreground">Primary Broker</span>
                      <span className="font-semibold text-foreground text-right text-sm">{listing.list_office_name}</span>
                    </div>
                  )}
                  {listing.buyer_agent_name && (
                    <div className="flex justify-between items-center py-2 border-b border-border/50">
                      <span className="text-sm text-muted-foreground">Secondary Agent</span>
                      <span className="font-semibold text-foreground">{listing.buyer_agent_name}</span>
                    </div>
                  )}
                  {listing.buyer_office_name && (
                    <div className="flex justify-between items-center py-2 border-b border-border/50">
                      <span className="text-sm text-muted-foreground">Secondary Broker</span>
                      <span className="font-semibold text-foreground text-right text-sm">{listing.buyer_office_name}</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Listing Details */}
            <div className="bg-muted/30 rounded-xl p-4 md:p-6">
              <h2 className="text-base md:text-lg font-semibold text-foreground mb-3 md:mb-4">Listing Details</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-3">
                {(listing.days_on_market !== null || listing.cumulative_days_on_market !== null) && (
                  <div className="flex justify-between items-center py-2 border-b border-border/50">
                    <span className="text-sm text-muted-foreground">Days on Market</span>
                    <span className="font-semibold text-foreground">
                      {listing.cumulative_days_on_market ?? listing.days_on_market ?? 0} Days
                    </span>
                  </div>
                )}
                {listing.list_date && (
                  <div className="flex justify-between items-center py-2 border-b border-border/50">
                    <span className="text-sm text-muted-foreground">Listed Date</span>
                    <span className="font-semibold text-foreground">
                      {new Date(listing.list_date).toLocaleDateString('en-CA', { 
                        month: 'short', 
                        day: 'numeric', 
                        year: 'numeric' 
                      })}
                    </span>
                  </div>
                )}
                <div className="flex justify-between items-center py-2 border-b border-border/50">
                  <span className="text-sm text-muted-foreground">MLS® Number</span>
                  <span className="font-semibold text-foreground">{listing.listing_id}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-border/50">
                  <span className="text-sm text-muted-foreground">Source</span>
                  <span className="font-semibold text-foreground text-right text-sm">CREA DDF®</span>
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


            {/* MLS Disclaimer */}
            <div className="text-xs text-muted-foreground border-t pt-4">
              <p>MLS® #{listing.listing_id}</p>
              <p className="mt-1">
                The data relating to real estate on this website comes in part from the MLS® Reciprocity program. 
                Information is deemed reliable but not guaranteed.
              </p>
            </div>
          </div>

          {/* Right Column - Contact Form & Calculator */}
          <div className="space-y-6">
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
      </main>

      {/* Mobile CTA Bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-background/95 backdrop-blur-sm border-t p-3 sm:p-4 flex items-center gap-3 lg:hidden z-40 shadow-lg">
        <div className="flex-1 min-w-0">
          <div className="flex items-baseline gap-2">
            <p className="text-lg font-bold text-foreground">{formatPrice(listing.listing_price)}</p>
            {listing.living_area && (
              <p className="text-xs text-muted-foreground">${Math.round(listing.listing_price / listing.living_area)}/sqft</p>
            )}
          </div>
          <p className="text-xs text-muted-foreground truncate">
            {listing.bedrooms_total} bed · {listing.bathrooms_total} bath
            {listing.living_area && ` · ${listing.living_area.toLocaleString()} sqft`}
          </p>
        </div>
        <Button onClick={scrollToForm} className="h-12 px-5 sm:px-6 bg-foreground hover:bg-foreground/90 text-background shrink-0">
          <Phone className="h-4 w-4 mr-2" />
          Contact
        </Button>
      </div>

      <Footer />
    </div>
  );
}
