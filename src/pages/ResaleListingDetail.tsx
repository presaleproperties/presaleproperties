import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Helmet } from "react-helmet-async";
import { useRef, useState } from "react";
import { 
  ArrowLeft, 
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
  Layers
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
import { ProjectLeadForm } from "@/components/projects/ProjectLeadForm";

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
  unparsed_address: string | null;
  street_number: string | null;
  street_name: string | null;
  street_suffix: string | null;
  unit_number: string | null;
  postal_code: string | null;
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
  list_date: string | null;
  public_remarks: string | null;
  list_agent_name: string | null;
  list_agent_phone: string | null;
  list_agent_email: string | null;
  list_office_name: string | null;
  association_fee: number | null;
  association_fee_frequency: string | null;
  tax_annual_amount: number | null;
  interior_features: string[] | null;
  exterior_features: string[] | null;
  appliances: string[] | null;
  heating: string[] | null;
  cooling: string[] | null;
  view: string[] | null;
  virtual_tour_url: string | null;
};

export default function ResaleListingDetail() {
  const { listingKey } = useParams<{ listingKey: string }>();
  const formRef = useRef<HTMLDivElement>(null);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);

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
            <Button>Browse All Resale Listings</Button>
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

  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>{pageTitle}</title>
        <meta name="description" content={pageDescription} />
        <meta property="og:title" content={pageTitle} />
        <meta property="og:description" content={pageDescription} />
        {photos[0] && <meta property="og:image" content={photos[0].url} />}
      </Helmet>
      <ConversionHeader />
      
      <main className="container px-4 py-4 md:py-8 pb-24 lg:pb-8">
        {/* Back Button */}
        <Link 
          to="/resale" 
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-4 md:mb-6 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Resale Listings
        </Link>

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

            {/* Title & Price */}
            <div>
              <div className="flex flex-wrap items-center gap-2 mb-2">
                <Badge variant="secondary" className="text-xs">
                  {formatPropertyType(listing.property_sub_type || listing.property_type)}
                </Badge>
                <Badge 
                  variant="secondary" 
                  className={listing.mls_status === "Active" ? "bg-green-500/10 text-green-700" : ""}
                >
                  {listing.mls_status}
                </Badge>
                {listing.days_on_market !== null && (
                  <Badge variant="outline" className="text-xs gap-1">
                    <Clock className="h-3 w-3" />
                    {listing.days_on_market} days on market
                  </Badge>
                )}
                <div className="flex items-center gap-2 ml-auto">
                  <ShareButtons title={`${address} - ${formatPropertyType(listing.property_type)}`} />
                </div>
              </div>
              <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-foreground mb-2">
                {address}
              </h1>
              <div className="flex items-center gap-2 text-sm md:text-base text-muted-foreground mb-3 md:mb-4">
                <MapPin className="h-4 w-4 shrink-0" />
                <span>
                  {listing.neighborhood && `${listing.neighborhood} · `}
                  {listing.city}
                  {listing.postal_code && ` · ${listing.postal_code}`}
                </span>
              </div>
              <div className="text-2xl sm:text-3xl md:text-4xl font-bold text-primary">
                {formatPrice(listing.listing_price)}
              </div>
              {listing.original_list_price && listing.original_list_price !== listing.listing_price && (
                <p className="text-xs md:text-sm text-muted-foreground mt-1">
                  Original List Price: {formatPrice(listing.original_list_price)}
                </p>
              )}
            </div>

            {/* Key Facts Grid */}
            <div className="bg-muted/30 rounded-xl p-4 md:p-6">
              <h2 className="text-base md:text-lg font-semibold text-foreground mb-3 md:mb-4">Property Details</h2>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4">
                <div className="flex items-center gap-2 md:gap-3">
                  <div className="p-1.5 md:p-2 bg-primary/10 rounded-lg">
                    <Bed className="h-4 w-4 md:h-5 md:w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-xs md:text-sm text-muted-foreground">Bedrooms</p>
                    <p className="font-semibold text-sm md:text-base">{listing.bedrooms_total ?? "—"}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 md:gap-3">
                  <div className="p-1.5 md:p-2 bg-primary/10 rounded-lg">
                    <Bath className="h-4 w-4 md:h-5 md:w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-xs md:text-sm text-muted-foreground">Bathrooms</p>
                    <p className="font-semibold text-sm md:text-base">{listing.bathrooms_total ?? "—"}</p>
                  </div>
                </div>
                {listing.living_area && (
                  <div className="flex items-center gap-2 md:gap-3">
                    <div className="p-1.5 md:p-2 bg-primary/10 rounded-lg">
                      <Maximize className="h-4 w-4 md:h-5 md:w-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-xs md:text-sm text-muted-foreground">Living Area</p>
                      <p className="font-semibold text-sm md:text-base">{listing.living_area.toLocaleString()} sqft</p>
                    </div>
                  </div>
                )}
                {listing.lot_size_area && (
                  <div className="flex items-center gap-2 md:gap-3">
                    <div className="p-1.5 md:p-2 bg-primary/10 rounded-lg">
                      <Maximize className="h-4 w-4 md:h-5 md:w-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-xs md:text-sm text-muted-foreground">Lot Size</p>
                      <p className="font-semibold text-sm md:text-base">{listing.lot_size_area.toLocaleString()} sqft</p>
                    </div>
                  </div>
                )}
                <div className="flex items-center gap-2 md:gap-3">
                  <div className="p-1.5 md:p-2 bg-primary/10 rounded-lg">
                    <Building2 className="h-4 w-4 md:h-5 md:w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-xs md:text-sm text-muted-foreground">Type</p>
                    <p className="font-semibold text-sm md:text-base">{formatPropertyType(listing.property_sub_type || listing.property_type)}</p>
                  </div>
                </div>
                {listing.year_built && (
                  <div className="flex items-center gap-2 md:gap-3">
                    <div className="p-1.5 md:p-2 bg-primary/10 rounded-lg">
                      <Calendar className="h-4 w-4 md:h-5 md:w-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-xs md:text-sm text-muted-foreground">Year Built</p>
                      <p className="font-semibold text-sm md:text-base">{listing.year_built}</p>
                    </div>
                  </div>
                )}
                {listing.stories && (
                  <div className="flex items-center gap-2 md:gap-3">
                    <div className="p-1.5 md:p-2 bg-primary/10 rounded-lg">
                      <Layers className="h-4 w-4 md:h-5 md:w-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-xs md:text-sm text-muted-foreground">Stories</p>
                      <p className="font-semibold text-sm md:text-base">{listing.stories}</p>
                    </div>
                  </div>
                )}
                <div className="flex items-center gap-2 md:gap-3">
                  <div className="p-1.5 md:p-2 bg-primary/10 rounded-lg">
                    <Car className="h-4 w-4 md:h-5 md:w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-xs md:text-sm text-muted-foreground">Parking</p>
                    <p className="font-semibold text-sm md:text-base">
                      {listing.parking_total ? `${listing.parking_total} Spaces` : "—"}
                      {listing.garage_spaces ? ` (${listing.garage_spaces} Garage)` : ""}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Financial Details */}
            {(listing.association_fee || listing.tax_annual_amount) && (
              <div className="bg-muted/30 rounded-xl p-4 md:p-6">
                <h2 className="text-base md:text-lg font-semibold text-foreground mb-3 md:mb-4">Financial Details</h2>
                <div className="grid grid-cols-2 gap-3 md:gap-4">
                  {listing.association_fee && (
                    <div className="flex items-center gap-2 md:gap-3">
                      <div className="p-1.5 md:p-2 bg-primary/10 rounded-lg">
                        <DollarSign className="h-4 w-4 md:h-5 md:w-5 text-primary" />
                      </div>
                      <div>
                        <p className="text-xs md:text-sm text-muted-foreground">Strata Fee</p>
                        <p className="font-semibold text-sm md:text-base">
                          {formatPrice(listing.association_fee)}
                          {listing.association_fee_frequency && ` / ${listing.association_fee_frequency}`}
                        </p>
                      </div>
                    </div>
                  )}
                  {listing.tax_annual_amount && (
                    <div className="flex items-center gap-2 md:gap-3">
                      <div className="p-1.5 md:p-2 bg-primary/10 rounded-lg">
                        <DollarSign className="h-4 w-4 md:h-5 md:w-5 text-primary" />
                      </div>
                      <div>
                        <p className="text-xs md:text-sm text-muted-foreground">Annual Taxes</p>
                        <p className="font-semibold text-sm md:text-base">{formatPrice(listing.tax_annual_amount)}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Description */}
            {listing.public_remarks && (
              <div>
                <h2 className="text-base md:text-lg font-semibold text-foreground mb-3">Description</h2>
                <p className="text-sm md:text-base text-muted-foreground leading-relaxed whitespace-pre-line">
                  {listing.public_remarks}
                </p>
              </div>
            )}

            {/* Features */}
            {(listing.interior_features?.length || listing.exterior_features?.length || listing.appliances?.length) && (
              <div className="space-y-4">
                <h2 className="text-base md:text-lg font-semibold text-foreground">Features & Amenities</h2>
                
                {listing.interior_features && listing.interior_features.length > 0 && (
                  <div>
                    <h3 className="text-sm font-medium text-foreground mb-2">Interior Features</h3>
                    <div className="flex flex-wrap gap-2">
                      {listing.interior_features.map((feature, i) => (
                        <Badge key={i} variant="outline" className="text-xs">{feature}</Badge>
                      ))}
                    </div>
                  </div>
                )}
                
                {listing.exterior_features && listing.exterior_features.length > 0 && (
                  <div>
                    <h3 className="text-sm font-medium text-foreground mb-2">Exterior Features</h3>
                    <div className="flex flex-wrap gap-2">
                      {listing.exterior_features.map((feature, i) => (
                        <Badge key={i} variant="outline" className="text-xs">{feature}</Badge>
                      ))}
                    </div>
                  </div>
                )}
                
                {listing.appliances && listing.appliances.length > 0 && (
                  <div>
                    <h3 className="text-sm font-medium text-foreground mb-2">Appliances</h3>
                    <div className="flex flex-wrap gap-2">
                      {listing.appliances.map((appliance, i) => (
                        <Badge key={i} variant="outline" className="text-xs">{appliance}</Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

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

            {/* Listing Agent Info */}
            {listing.list_agent_name && (
              <div className="bg-muted/30 rounded-xl p-4 md:p-6">
                <h2 className="text-base md:text-lg font-semibold text-foreground mb-3">Listing Agent</h2>
                <div className="space-y-1">
                  <p className="font-medium">{listing.list_agent_name}</p>
                  {listing.list_office_name && (
                    <p className="text-sm text-muted-foreground">{listing.list_office_name}</p>
                  )}
                </div>
              </div>
            )}

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
              {/* Contact Form */}
              <div className="bg-card border rounded-xl p-4 md:p-6 shadow-sm mb-6">
                <h3 className="text-lg font-semibold text-foreground mb-4">
                  Interested in this property?
                </h3>
                <ProjectLeadForm 
                  projectId={listing.id}
                  projectName={`Resale: ${address} - ${listing.city}`}
                  status="active"
                  leadSource="general_inquiry"
                />
              </div>

              {/* Mortgage Calculator */}
              <MortgageCalculator price={listing.listing_price} />
            </div>
          </div>
        </div>
      </main>

      {/* Mobile CTA Bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-background border-t p-4 flex items-center gap-3 lg:hidden z-40">
        <div className="flex-1">
          <p className="text-lg font-bold text-foreground">{formatPrice(listing.listing_price)}</p>
          <p className="text-xs text-muted-foreground">{listing.bedrooms_total} bed · {listing.bathrooms_total} bath</p>
        </div>
        <Button onClick={scrollToForm} className="px-6">
          Contact Agent
        </Button>
      </div>

      <Footer />
    </div>
  );
}
