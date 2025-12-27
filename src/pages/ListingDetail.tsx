import { useParams, Link, useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Helmet } from "react-helmet-async";
import { useRef } from "react";
import { 
  ArrowLeft, 
  Bed, 
  Bath, 
  Maximize, 
  Building2, 
  Calendar, 
  MapPin,
  Car,
  Package,
  Compass,
  Layers,
  AlertTriangle,
  Lock
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { supabase } from "@/integrations/supabase/client";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { ImageGallery } from "@/components/listings/ImageGallery";
import { LeadCaptureForm } from "@/components/listings/LeadCaptureForm";
import { AgentContactCard } from "@/components/listings/AgentContactCard";
import { ShareButtons } from "@/components/listings/ShareButtons";
import { SaveButton } from "@/components/listings/SaveButton";
import { MobileCTABar } from "@/components/listings/MobileCTABar";
import { useAuth } from "@/hooks/useAuth";

const formatPrice = (price: number) => {
  return new Intl.NumberFormat("en-CA", {
    style: "currency",
    currency: "CAD",
    maximumFractionDigits: 0,
  }).format(price);
};

const formatUnitType = (type: string) => {
  const map: Record<string, string> = {
    studio: "Studio",
    "1bed": "1 Bedroom",
    "1bed_den": "1 Bed + Den",
    "2bed": "2 Bedroom",
    "2bed_den": "2 Bed + Den",
    "3bed": "3 Bedroom",
    penthouse: "Penthouse",
  };
  return map[type] || type;
};

const formatPropertyType = (type: string) => {
  return type.charAt(0).toUpperCase() + type.slice(1);
};

const formatConstructionStatus = (status: string) => {
  const map: Record<string, string> = {
    pre_construction: "Pre-Construction",
    under_construction: "Under Construction",
    completed: "Completed",
  };
  return map[status] || status;
};

const getCompletionDate = (year?: number | null, month?: number | null) => {
  if (!year) return "TBD";
  const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  if (month && month >= 1 && month <= 12) {
    return `${monthNames[month - 1]} ${year}`;
  }
  return year.toString();
};

interface AgentInfo {
  full_name: string | null;
  email: string;
  phone: string | null;
  avatar_url: string | null;
  brokerage_name: string;
  license_number: string;
  is_verified: boolean;
}

export default function ListingDetail() {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const { isAdmin, user } = useAuth();
  const isPreview = searchParams.get("preview") === "true";
  const formRef = useRef<HTMLDivElement>(null);

  const scrollToForm = () => {
    formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const { data: listing, isLoading, error } = useQuery({
    queryKey: ["listing", id, isAdmin],
    queryFn: async () => {
      // Build the query
      let query = supabase
        .from("listings")
        .select(`
          *,
          listing_photos (id, url, sort_order)
        `)
        .eq("id", id);

      // If not admin, only show published listings
      // Admins and listing owners can view any status
      if (!isAdmin && !user) {
        query = query.eq("status", "published");
      }

      const { data, error } = await query.maybeSingle();

      if (error) throw error;
      
      // For non-admins and non-owners, only allow viewing published listings
      if (data && !isAdmin && data.agent_id !== user?.id && data.status !== "published") {
        return null;
      }
      
      return data;
    },
    enabled: !!id,
  });

  // Fetch agent info from the secure public view (excludes sensitive fields like license_number)
  const { data: agentInfo } = useQuery({
    queryKey: ["agent", listing?.agent_id],
    queryFn: async () => {
      if (!listing?.agent_id) return null;

      // Use the public_agent_profiles view which excludes sensitive fields
      const { data: agentData } = await supabase
        .from("public_agent_profiles")
        .select("full_name, email, phone, avatar_url, brokerage_name, verification_status")
        .eq("user_id", listing.agent_id)
        .maybeSingle();

      if (!agentData) return null;

      return {
        full_name: agentData.full_name,
        email: agentData.email,
        phone: agentData.phone,
        avatar_url: agentData.avatar_url,
        brokerage_name: agentData.brokerage_name,
        license_number: "", // Not exposed publicly for security
        is_verified: agentData.verification_status === "verified",
      } as AgentInfo;
    },
    enabled: !!listing?.agent_id,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
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
        <Header />
        <main className="container py-16 text-center">
          <h1 className="text-2xl font-bold text-foreground mb-4">
            Listing Not Found
          </h1>
          <p className="text-muted-foreground mb-6">
            This listing may have been removed or is no longer available.
          </p>
          <Link to="/assignments">
            <Button>Browse All Assignments</Button>
          </Link>
        </main>
        <Footer />
      </div>
    );
  }

  const photos = listing.listing_photos?.sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0)) || [];
  const isRestricted = (listing as any).visibility_mode === "restricted";
  
  // For restricted listings, use generic title
  const displayTitle = isRestricted 
    ? "Presale Condo Assignment – Vancouver" 
    : listing.title;
  
  const displayProjectName = isRestricted 
    ? `${formatUnitType(listing.unit_type)} Assignment` 
    : listing.project_name;

  const pageTitle = isRestricted 
    ? `Presale Condo Assignment - ${formatUnitType(listing.unit_type)} | AssignmentHub Vancouver`
    : `${listing.project_name} - ${formatUnitType(listing.unit_type)} | AssignmentHub Vancouver`;
  
  const pageDescription = isRestricted 
    ? `${formatUnitType(listing.unit_type)} presale condo assignment in ${listing.city}. ${formatPrice(Number(listing.assignment_price))}. ${listing.beds} bed, ${listing.baths} bath${listing.interior_sqft ? `, ${listing.interior_sqft} sqft` : ''}.`
    : `${formatUnitType(listing.unit_type)} assignment at ${listing.project_name} in ${listing.neighborhood || listing.city}. ${formatPrice(Number(listing.assignment_price))}. ${listing.beds} bed, ${listing.baths} bath${listing.interior_sqft ? `, ${listing.interior_sqft} sqft` : ''}.`;

  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>{pageTitle}</title>
        <meta name="description" content={pageDescription} />
        <meta property="og:title" content={pageTitle} />
        <meta property="og:description" content={pageDescription} />
      </Helmet>
      <Header />
      
      <main className="container px-4 py-4 md:py-8 pb-24 lg:pb-8">
        {/* Preview Banner for non-published listings */}
        {listing.status !== "published" && (
          <Alert className="mb-4 md:mb-6 border-amber-500/50 bg-amber-500/10">
            <AlertTriangle className="h-4 w-4 text-amber-500" />
            <AlertDescription className="text-amber-700 text-sm">
              <strong>Preview Mode:</strong> This listing is not yet published (Status: {listing.status.replace(/_/g, " ")}).
            </AlertDescription>
          </Alert>
        )}

        {/* Restricted Listing Notice */}
        {isRestricted && (
          <Alert className="mb-4 md:mb-6 border-amber-500/50 bg-amber-500/10">
            <Lock className="h-4 w-4 text-amber-600" />
            <AlertDescription className="text-amber-700 text-sm">
              <strong>🔒 Restricted</strong> — Some details hidden. Contact the agent for full info.
            </AlertDescription>
          </Alert>
        )}

        {/* Back Button */}
        <Link 
          to={isAdmin && listing.status !== "published" ? "/admin/listings" : "/assignments"} 
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-4 md:mb-6 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Assignments
        </Link>

        <div className="grid lg:grid-cols-3 gap-6 lg:gap-8">
          {/* Left Column - Images & Details */}
          <div className="lg:col-span-2 space-y-6 md:space-y-8">
            {/* Image Gallery */}
            <ImageGallery photos={photos} title={displayTitle} />

            {/* Title & Price */}
            <div>
              <div className="flex flex-wrap items-center gap-2 mb-2">
                <div className="flex flex-wrap items-center gap-2">
                  {listing.is_featured && (
                    <Badge className="bg-primary text-primary-foreground text-xs">Featured</Badge>
                  )}
                  {isRestricted && (
                    <Badge variant="secondary" className="bg-amber-500/90 text-white gap-1 text-xs">
                      <Lock className="h-3 w-3" />
                      Restricted
                    </Badge>
                  )}
                  <Badge variant="secondary" className="text-xs">
                    {formatConstructionStatus(listing.construction_status)}
                  </Badge>
                </div>
                <div className="flex items-center gap-2 ml-auto">
                  <ShareButtons title={isRestricted ? "Presale Condo Assignment" : `${listing.project_name} - ${formatUnitType(listing.unit_type)}`} />
                  <SaveButton listingId={listing.id} variant="full" />
                </div>
              </div>
              <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-foreground mb-2">
                {displayTitle}
              </h1>
              <div className="flex items-center gap-2 text-sm md:text-base text-muted-foreground mb-3 md:mb-4">
                <MapPin className="h-4 w-4 shrink-0" />
                <span>
                  {isRestricted ? (
                    <>
                      {listing.city}
                      {listing.neighborhood && ` · ${listing.neighborhood}`}
                    </>
                  ) : (
                    <>
                      {listing.project_name}
                      {listing.neighborhood && ` · ${listing.neighborhood}`}
                      {listing.city && ` · ${listing.city}`}
                    </>
                  )}
                </span>
              </div>
              <div className="text-2xl sm:text-3xl md:text-4xl font-bold text-primary">
                {formatPrice(Number(listing.assignment_price))}
              </div>
              {!isRestricted && listing.original_price && (
                <p className="text-xs md:text-sm text-muted-foreground mt-1">
                  Original Price: {formatPrice(Number(listing.original_price))}
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
                    <p className="font-semibold text-sm md:text-base">{listing.beds === 0 ? "Studio" : listing.beds}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 md:gap-3">
                  <div className="p-1.5 md:p-2 bg-primary/10 rounded-lg">
                    <Bath className="h-4 w-4 md:h-5 md:w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-xs md:text-sm text-muted-foreground">Bathrooms</p>
                    <p className="font-semibold text-sm md:text-base">{listing.baths}</p>
                  </div>
                </div>
                {listing.interior_sqft && (
                  <div className="flex items-center gap-2 md:gap-3">
                    <div className="p-1.5 md:p-2 bg-primary/10 rounded-lg">
                      <Maximize className="h-4 w-4 md:h-5 md:w-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-xs md:text-sm text-muted-foreground">Interior</p>
                      <p className="font-semibold text-sm md:text-base">{listing.interior_sqft} sqft</p>
                    </div>
                  </div>
                )}
                {listing.exterior_sqft && (
                  <div className="flex items-center gap-2 md:gap-3">
                    <div className="p-1.5 md:p-2 bg-primary/10 rounded-lg">
                      <Maximize className="h-4 w-4 md:h-5 md:w-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-xs md:text-sm text-muted-foreground">Exterior</p>
                      <p className="font-semibold text-sm md:text-base">{listing.exterior_sqft} sqft</p>
                    </div>
                  </div>
                )}
                <div className="flex items-center gap-2 md:gap-3">
                  <div className="p-1.5 md:p-2 bg-primary/10 rounded-lg">
                    <Building2 className="h-4 w-4 md:h-5 md:w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-xs md:text-sm text-muted-foreground">Type</p>
                    <p className="font-semibold text-sm md:text-base">{formatPropertyType(listing.property_type)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 md:gap-3">
                  <div className="p-1.5 md:p-2 bg-primary/10 rounded-lg">
                    <Calendar className="h-4 w-4 md:h-5 md:w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-xs md:text-sm text-muted-foreground">Completion</p>
                    <p className="font-semibold text-sm md:text-base">{getCompletionDate(listing.completion_year, listing.completion_month)}</p>
                  </div>
                </div>
                {listing.floor_level && (
                  <div className="flex items-center gap-2 md:gap-3">
                    <div className="p-1.5 md:p-2 bg-primary/10 rounded-lg">
                      <Layers className="h-4 w-4 md:h-5 md:w-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-xs md:text-sm text-muted-foreground">Floor</p>
                      <p className="font-semibold text-sm md:text-base">{listing.floor_level}</p>
                    </div>
                  </div>
                )}
                {listing.exposure && (
                  <div className="flex items-center gap-2 md:gap-3">
                    <div className="p-1.5 md:p-2 bg-primary/10 rounded-lg">
                      <Compass className="h-4 w-4 md:h-5 md:w-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-xs md:text-sm text-muted-foreground">Exposure</p>
                      <p className="font-semibold text-sm md:text-base">{listing.exposure}</p>
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
                      {listing.has_parking ? `${listing.parking_count || 1} Stall${(listing.parking_count || 1) > 1 ? 's' : ''}` : 'None'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 md:gap-3">
                  <div className="p-1.5 md:p-2 bg-primary/10 rounded-lg">
                    <Package className="h-4 w-4 md:h-5 md:w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-xs md:text-sm text-muted-foreground">Storage</p>
                    <p className="font-semibold text-sm md:text-base">{listing.has_storage ? 'Included' : 'None'}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Financial Details - Hidden for restricted listings */}
            {!isRestricted && (listing.deposit_paid || listing.assignment_fee) && (
              <div className="bg-muted/30 rounded-xl p-4 md:p-6">
                <h2 className="text-base md:text-lg font-semibold text-foreground mb-3 md:mb-4">Financial Details</h2>
                <div className="grid grid-cols-2 gap-3 md:gap-4">
                  {listing.deposit_paid && (
                    <div>
                      <p className="text-xs md:text-sm text-muted-foreground">Deposit Paid</p>
                      <p className="font-semibold text-base md:text-lg">{formatPrice(Number(listing.deposit_paid))}</p>
                    </div>
                  )}
                  {listing.assignment_fee && (
                    <div>
                      <p className="text-xs md:text-sm text-muted-foreground">Assignment Fee</p>
                      <p className="font-semibold text-base md:text-lg">{formatPrice(Number(listing.assignment_fee))}</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Description */}
            {listing.description && (
              <div>
                <h2 className="text-lg font-semibold text-foreground mb-4">Description</h2>
                <p className="text-muted-foreground leading-relaxed whitespace-pre-line">
                  {listing.description}
                </p>
              </div>
            )}

            {/* Developer Info - Hidden for restricted listings */}
            {!isRestricted && listing.developer_name && (
              <div className="bg-muted/30 rounded-xl p-6">
                <h2 className="text-lg font-semibold text-foreground mb-2">Developer</h2>
                <p className="font-medium">{listing.developer_name}</p>
              </div>
            )}
          </div>

          {/* Right Column - Lead Form & Agent Info */}
          <div className="lg:col-span-1">
            <div ref={formRef} className="sticky top-6 space-y-6">
              <LeadCaptureForm 
                listingId={listing.id} 
                agentId={listing.agent_id}
                listingTitle={displayTitle}
                isRestricted={isRestricted}
              />
              <AgentContactCard agent={agentInfo || null} />
            </div>
          </div>
        </div>
      </main>

      {/* Sticky Mobile CTA */}
      <MobileCTABar 
        price={formatPrice(Number(listing.assignment_price))}
        projectName={listing.project_name}
        onContactClick={scrollToForm}
        phoneNumber={agentInfo?.phone || undefined}
      />

      <Footer />
    </div>
  );
}
