import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Helmet } from "react-helmet-async";
import { 
  Bed, Bath, Maximize, MapPin, Calendar, ChevronLeft, Phone, Mail,
  PawPrint, Sofa, Zap, Droplets, Wifi, Share2, Heart
} from "lucide-react";
import { ConversionHeader } from "@/components/conversion/ConversionHeader";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export default function RentalListingDetail() {
  const { listingKey } = useParams<{ listingKey: string }>();

  const { data: listing, isLoading, error } = useQuery({
    queryKey: ["rental-listing", listingKey],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("mls_listings")
        .select("*")
        .eq("listing_key", listingKey)
        .eq("is_rental", true)
        .single();
      
      if (error) throw error;
      return data;
    },
    enabled: !!listingKey,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <ConversionHeader />
        <div className="container py-8">
          <Skeleton className="h-[400px] w-full rounded-xl mb-6" />
          <Skeleton className="h-8 w-1/2 mb-4" />
          <Skeleton className="h-6 w-1/3 mb-6" />
          <div className="grid grid-cols-4 gap-4">
            <Skeleton className="h-24" />
            <Skeleton className="h-24" />
            <Skeleton className="h-24" />
            <Skeleton className="h-24" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !listing) {
    return (
      <div className="min-h-screen bg-background">
        <ConversionHeader />
        <div className="container py-16 text-center">
          <h1 className="text-2xl font-bold mb-4">Rental Not Found</h1>
          <p className="text-muted-foreground mb-6">
            This rental listing may no longer be available.
          </p>
          <Link to="/rentals">
            <Button>Browse Rentals</Button>
          </Link>
        </div>
      </div>
    );
  }

  const address = [listing.street_number, listing.street_name, listing.street_suffix]
    .filter(Boolean)
    .join(" ") || listing.neighborhood || listing.city;

  const photos = listing.photos as { MediaURL: string; order?: number }[] || [];
  const mainPhoto = photos[0]?.MediaURL;

  const formatRent = (amount: number) => `$${amount.toLocaleString()}`;
  const frequency = listing.lease_frequency?.toLowerCase() || "month";
  const frequencyLabel = frequency === "monthly" || frequency === "month" ? "/month" : `/${frequency}`;

  const handleShare = async () => {
    if (navigator.share) {
      await navigator.share({
        title: `${address} - ${formatRent(listing.lease_amount)}${frequencyLabel}`,
        url: window.location.href,
      });
    } else {
      await navigator.clipboard.writeText(window.location.href);
      toast.success("Link copied to clipboard");
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>{`${address} for Rent - ${formatRent(listing.lease_amount)}${frequencyLabel} | PresaleProperties`}</title>
        <meta name="description" content={`${listing.bedrooms_total || 0} bed, ${listing.bathrooms_total || 0} bath rental in ${listing.city}. ${formatRent(listing.lease_amount)}${frequencyLabel}.`} />
      </Helmet>

      <ConversionHeader />

      <div className="container py-6">
        {/* Back Link */}
        <Link 
          to="/rentals" 
          className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-4"
        >
          <ChevronLeft className="h-4 w-4 mr-1" />
          Back to Rentals
        </Link>

        {/* Main Content Grid */}
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Left: Photos & Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Hero Image */}
            <div className="relative aspect-[16/10] rounded-xl overflow-hidden bg-muted">
              {mainPhoto ? (
                <img 
                  src={mainPhoto} 
                  alt={address} 
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                  <MapPin className="h-16 w-16 opacity-30" />
                </div>
              )}
              
              <Badge className="absolute top-4 left-4 bg-emerald-600 text-white border-0">
                For Rent
              </Badge>

              <div className="absolute top-4 right-4 flex gap-2">
                <Button size="icon" variant="secondary" className="rounded-full" onClick={handleShare}>
                  <Share2 className="h-4 w-4" />
                </Button>
                <Button size="icon" variant="secondary" className="rounded-full">
                  <Heart className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Photo Gallery */}
            {photos.length > 1 && (
              <div className="grid grid-cols-4 gap-2">
                {photos.slice(1, 5).map((photo, i) => (
                  <div key={i} className="aspect-square rounded-lg overflow-hidden bg-muted">
                    <img 
                      src={photo.MediaURL} 
                      alt={`${address} photo ${i + 2}`} 
                      className="w-full h-full object-cover hover:scale-105 transition-transform cursor-pointer"
                    />
                  </div>
                ))}
              </div>
            )}

            {/* Price & Address */}
            <div>
              <div className="flex items-baseline gap-2 mb-2">
                <span className="text-3xl font-bold text-emerald-600">
                  {formatRent(listing.lease_amount)}
                </span>
                <span className="text-lg text-muted-foreground">{frequencyLabel}</span>
              </div>
              <h1 className="text-xl font-semibold text-foreground">{address}</h1>
              <p className="text-muted-foreground">
                {listing.neighborhood ? `${listing.neighborhood}, ` : ""}{listing.city}, BC
              </p>
            </div>

            {/* Key Specs */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="bg-muted/50 rounded-xl p-4 text-center">
                <Bed className="h-6 w-6 mx-auto mb-2 text-emerald-600" />
                <p className="text-lg font-semibold">
                  {listing.bedrooms_total === 0 ? "Studio" : listing.bedrooms_total || "—"}
                </p>
                <p className="text-xs text-muted-foreground">Bedrooms</p>
              </div>
              <div className="bg-muted/50 rounded-xl p-4 text-center">
                <Bath className="h-6 w-6 mx-auto mb-2 text-emerald-600" />
                <p className="text-lg font-semibold">{listing.bathrooms_total || "—"}</p>
                <p className="text-xs text-muted-foreground">Bathrooms</p>
              </div>
              <div className="bg-muted/50 rounded-xl p-4 text-center">
                <Maximize className="h-6 w-6 mx-auto mb-2 text-emerald-600" />
                <p className="text-lg font-semibold">
                  {listing.living_area ? listing.living_area.toLocaleString() : "—"}
                </p>
                <p className="text-xs text-muted-foreground">Sq. Ft.</p>
              </div>
              <div className="bg-muted/50 rounded-xl p-4 text-center">
                <Calendar className="h-6 w-6 mx-auto mb-2 text-emerald-600" />
                <p className="text-lg font-semibold">
                  {listing.availability_date 
                    ? new Date(listing.availability_date).toLocaleDateString("en-US", { month: "short", day: "numeric" })
                    : "Now"
                  }
                </p>
                <p className="text-xs text-muted-foreground">Available</p>
              </div>
            </div>

            {/* Features */}
            <div className="space-y-4">
              <h2 className="text-lg font-semibold">Rental Features</h2>
              <div className="flex flex-wrap gap-2">
                {listing.pets_allowed && listing.pets_allowed.toLowerCase() !== "no" && (
                  <Badge variant="outline" className="gap-1.5">
                    <PawPrint className="h-3.5 w-3.5" />
                    Pets Allowed
                  </Badge>
                )}
                {listing.furnished && listing.furnished.toLowerCase() !== "unfurnished" && (
                  <Badge variant="outline" className="gap-1.5">
                    <Sofa className="h-3.5 w-3.5" />
                    {listing.furnished}
                  </Badge>
                )}
                {listing.utilities_included?.map((util: string, i: number) => (
                  <Badge key={i} variant="outline" className="gap-1.5">
                    {util.toLowerCase().includes("hydro") && <Zap className="h-3.5 w-3.5" />}
                    {util.toLowerCase().includes("water") && <Droplets className="h-3.5 w-3.5" />}
                    {util.toLowerCase().includes("internet") && <Wifi className="h-3.5 w-3.5" />}
                    {util}
                  </Badge>
                ))}
                {listing.property_sub_type && (
                  <Badge variant="secondary">{listing.property_sub_type}</Badge>
                )}
              </div>
            </div>

            {/* Description */}
            {listing.public_remarks && (
              <div className="space-y-3">
                <h2 className="text-lg font-semibold">Description</h2>
                <p className="text-muted-foreground leading-relaxed whitespace-pre-line">
                  {listing.public_remarks}
                </p>
              </div>
            )}
          </div>

          {/* Right: Contact Sidebar */}
          <div className="lg:col-span-1">
            <div className="sticky top-24 space-y-4">
              {/* Contact Card */}
              <div className="bg-muted/30 border border-border rounded-xl p-6">
                <h3 className="font-semibold mb-4">Contact Property Manager</h3>
                
                {listing.list_agent_name && (
                  <p className="text-sm font-medium mb-1">{listing.list_agent_name}</p>
                )}
                {listing.list_office_name && (
                  <p className="text-xs text-muted-foreground mb-4">{listing.list_office_name}</p>
                )}

                <div className="space-y-3">
                  {listing.list_agent_phone && (
                    <a href={`tel:${listing.list_agent_phone}`}>
                      <Button className="w-full gap-2 bg-emerald-600 hover:bg-emerald-700">
                        <Phone className="h-4 w-4" />
                        Call Now
                      </Button>
                    </a>
                  )}
                  {listing.list_agent_email && (
                    <a href={`mailto:${listing.list_agent_email}?subject=Inquiry about ${address}`}>
                      <Button variant="outline" className="w-full gap-2">
                        <Mail className="h-4 w-4" />
                        Email Inquiry
                      </Button>
                    </a>
                  )}
                </div>
              </div>

              {/* MLS Info */}
              <div className="bg-muted/30 border border-border rounded-xl p-4">
                <p className="text-xs text-muted-foreground">
                  MLS® #{listing.listing_key}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Listed by {listing.list_office_name || "Brokerage"}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
