import { useParams, Navigate, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Helmet } from "react-helmet-async";
import { supabase } from "@/integrations/supabase/client";
import { useVerifiedAgent } from "@/hooks/useVerifiedAgent";
import { ConversionHeader } from "@/components/conversion/ConversionHeader";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Lock, 
  MapPin, 
  Bed, 
  Bath, 
  Maximize, 
  Building2, 
  Calendar, 
  DollarSign,
  ArrowLeft,
  Phone,
  Mail,
  ChevronLeft,
  ChevronRight,
  Home,
  Shield,
  FileText,
  MessageSquare
} from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

interface Assignment {
  id: string;
  title: string;
  project_name: string;
  developer_name: string | null;
  city: string;
  neighborhood: string | null;
  address: string | null;
  assignment_price: number;
  original_price: number | null;
  deposit_paid: number | null;
  assignment_fee: number | null;
  beds: number;
  baths: number;
  interior_sqft: number | null;
  exterior_sqft: number | null;
  floor_level: number | null;
  exposure: string | null;
  completion_month: number | null;
  completion_year: number | null;
  construction_status: string;
  has_parking: boolean | null;
  parking_count: number | null;
  has_storage: boolean | null;
  amenities: string[] | null;
  description: string | null;
  map_lat: number | null;
  map_lng: number | null;
  agent_id: string;
  listing_photos: { url: string; sort_order: number }[];
  listing_files: { url: string; file_type: string; file_name: string | null }[];
}

export default function AssignmentDetail() {
  const { id } = useParams<{ id: string }>();
  const { isVerified: isVerifiedAgent, loading: agentLoading } = useVerifiedAgent();
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  // Fetch assignment details
  const { data: assignment, isLoading, error } = useQuery({
    queryKey: ["assignment-detail", id],
    queryFn: async () => {
      if (!id) throw new Error("No assignment ID");

      const { data, error } = await (supabase as any)
        .from("listings")
        .select(`
          *,
          listing_photos (url, sort_order),
          listing_files (url, file_type, file_name)
        `)
        .eq("id", id)
        .eq("status", "published")
        .maybeSingle();

      if (error) throw error;
      if (!data) throw new Error("Assignment not found");

      return data as Assignment;
    },
    enabled: !!id,
  });

  // Fetch agent info - use separate queries for profiles
  const { data: agentProfile } = useQuery({
    queryKey: ["assignment-agent-profile", assignment?.agent_id],
    queryFn: async () => {
      if (!assignment?.agent_id) return null;

      const { data, error } = await (supabase as any)
        .from("agent_profiles")
        .select("user_id, brokerage_name")
        .eq("user_id", assignment.agent_id)
        .maybeSingle();

      if (error) throw error;
      return data;
    },
    enabled: !!assignment?.agent_id && isVerifiedAgent,
  });

  // Fetch profile info separately
  const { data: userProfile } = useQuery({
    queryKey: ["assignment-user-profile", agentProfile?.user_id],
    queryFn: async () => {
      if (!agentProfile?.user_id) return null;

      const { data, error } = await (supabase as any)
        .from("profiles")
        .select("full_name, email, phone")
        .eq("user_id", agentProfile.user_id)
        .maybeSingle();

      if (error) throw error;
      return data;
    },
    enabled: !!agentProfile?.user_id && isVerifiedAgent,
  });

  // Combine agent data
  const agent = agentProfile && userProfile ? {
    brokerage_name: agentProfile.brokerage_name,
    full_name: userProfile.full_name,
    email: userProfile.email,
    phone: userProfile.phone,
  } : null;

  // If not verified agent and not loading, redirect or show locked state
  if (!agentLoading && !isVerifiedAgent) {
    return (
      <div className="min-h-screen bg-background">
        <ConversionHeader />
        <main className="container px-4 py-12">
          <div className="max-w-2xl mx-auto text-center">
            <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mx-auto mb-6">
              <Lock className="h-10 w-10 text-muted-foreground" />
            </div>
            <h1 className="text-3xl font-bold mb-4">Agent Access Only</h1>
            <p className="text-muted-foreground mb-8">
              Assignment details are only available to verified real estate agents. 
              Sign in with your agent account to view full details, contact information, and documents.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/login?type=agent">
                <Button size="lg">
                  <Shield className="h-4 w-4 mr-2" />
                  Agent Login
                </Button>
              </Link>
              <Link to="/for-agents">
                <Button variant="outline" size="lg">
                  Learn More
                </Button>
              </Link>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (isLoading || agentLoading) {
    return (
      <div className="min-h-screen bg-background">
        <ConversionHeader />
        <main className="container px-4 py-8">
          <Skeleton className="h-8 w-48 mb-6" />
          <div className="grid lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              <Skeleton className="aspect-[16/10] w-full rounded-xl" />
            </div>
            <div>
              <Skeleton className="h-64 w-full rounded-xl" />
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (error || !assignment) {
    return (
      <div className="min-h-screen bg-background">
        <ConversionHeader />
        <main className="container px-4 py-12 text-center">
          <h1 className="text-2xl font-bold mb-4">Assignment Not Found</h1>
          <p className="text-muted-foreground mb-8">This assignment may have been sold or removed.</p>
          <Link to="/map-search?mode=assignments">
            <Button>Browse Assignments</Button>
          </Link>
        </main>
        <Footer />
      </div>
    );
  }

  const photos = assignment.listing_photos?.sort((a, b) => a.sort_order - b.sort_order) || [];
  const mainPhoto = photos[0]?.url || "/placeholder.svg";
  
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("en-CA", {
      style: "currency",
      currency: "CAD",
      maximumFractionDigits: 0,
    }).format(price);
  };

  const completionDate = assignment.completion_year
    ? assignment.completion_month
      ? `${new Date(2024, assignment.completion_month - 1).toLocaleString("default", { month: "short" })} ${assignment.completion_year}`
      : assignment.completion_year.toString()
    : "TBD";

  const discount = assignment.original_price 
    ? assignment.original_price - assignment.assignment_price 
    : null;

  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>{assignment.title} | Assignment Sale | PresaleProperties</title>
        <meta name="description" content={`${assignment.beds}BR assignment at ${assignment.project_name} in ${assignment.city}. ${formatPrice(assignment.assignment_price)}.`} />
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>

      <ConversionHeader />

      <main className="container px-4 py-6 lg:py-8">
        {/* Back Link */}
        <Link 
          to="/map-search?mode=assignments" 
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Assignments
        </Link>

        {/* Main Grid */}
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Left Column - Photos & Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Photo Gallery */}
            <div className="relative rounded-xl overflow-hidden bg-muted">
              <div className="aspect-[16/10]">
                <img
                  src={photos[currentImageIndex]?.url || mainPhoto}
                  alt={assignment.title}
                  className="w-full h-full object-cover"
                />
              </div>
              
              {/* Assignment Badge */}
              <Badge className="absolute top-4 left-4 bg-amber-500 hover:bg-amber-600">
                Assignment
              </Badge>

              {/* Photo Navigation */}
              {photos.length > 1 && (
                <>
                  <button
                    onClick={() => setCurrentImageIndex(i => i === 0 ? photos.length - 1 : i - 1)}
                    className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-background/80 backdrop-blur-sm flex items-center justify-center hover:bg-background transition-colors"
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </button>
                  <button
                    onClick={() => setCurrentImageIndex(i => i === photos.length - 1 ? 0 : i + 1)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-background/80 backdrop-blur-sm flex items-center justify-center hover:bg-background transition-colors"
                  >
                    <ChevronRight className="h-5 w-5" />
                  </button>
                  <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5">
                    {photos.map((_, i) => (
                      <button
                        key={i}
                        onClick={() => setCurrentImageIndex(i)}
                        className={cn(
                          "w-2 h-2 rounded-full transition-colors",
                          i === currentImageIndex ? "bg-white" : "bg-white/50"
                        )}
                      />
                    ))}
                  </div>
                </>
              )}
            </div>

            {/* Thumbnail Strip */}
            {photos.length > 1 && (
              <div className="flex gap-2 overflow-x-auto pb-2">
                {photos.map((photo, i) => (
                  <button
                    key={i}
                    onClick={() => setCurrentImageIndex(i)}
                    className={cn(
                      "w-20 h-14 rounded-lg overflow-hidden shrink-0 border-2 transition-colors",
                      i === currentImageIndex ? "border-primary" : "border-transparent"
                    )}
                  >
                    <img src={photo.url} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}

            {/* Property Info */}
            <div>
              <h1 className="text-2xl lg:text-3xl font-bold mb-2">{assignment.title}</h1>
              <div className="flex items-center gap-2 text-muted-foreground mb-4">
                <MapPin className="h-4 w-4" />
                <span>{assignment.project_name}, {assignment.neighborhood || assignment.city}</span>
              </div>

              {/* Quick Stats */}
              <div className="flex flex-wrap gap-4 text-sm">
                <div className="flex items-center gap-1.5">
                  <Bed className="h-4 w-4 text-muted-foreground" />
                  <span>{assignment.beds} Bed{assignment.beds !== 1 ? "s" : ""}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Bath className="h-4 w-4 text-muted-foreground" />
                  <span>{assignment.baths} Bath{assignment.baths !== 1 ? "s" : ""}</span>
                </div>
                {assignment.interior_sqft && (
                  <div className="flex items-center gap-1.5">
                    <Maximize className="h-4 w-4 text-muted-foreground" />
                    <span>{assignment.interior_sqft.toLocaleString()} sqft</span>
                  </div>
                )}
                {assignment.floor_level && (
                  <div className="flex items-center gap-1.5">
                    <Building2 className="h-4 w-4 text-muted-foreground" />
                    <span>Floor {assignment.floor_level}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Description */}
            {assignment.description && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Description</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground whitespace-pre-wrap">{assignment.description}</p>
                </CardContent>
              </Card>
            )}

            {/* Unit Details */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Unit Details</CardTitle>
              </CardHeader>
              <CardContent>
                <dl className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-sm">
                  <div>
                    <dt className="text-muted-foreground">Project</dt>
                    <dd className="font-medium">{assignment.project_name}</dd>
                  </div>
                  {assignment.developer_name && (
                    <div>
                      <dt className="text-muted-foreground">Developer</dt>
                      <dd className="font-medium">{assignment.developer_name}</dd>
                    </div>
                  )}
                  <div>
                    <dt className="text-muted-foreground">Location</dt>
                    <dd className="font-medium">{assignment.city}</dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground">Completion</dt>
                    <dd className="font-medium">{completionDate}</dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground">Status</dt>
                    <dd className="font-medium capitalize">{assignment.construction_status.replace("_", " ")}</dd>
                  </div>
                  {assignment.exposure && (
                    <div>
                      <dt className="text-muted-foreground">Exposure</dt>
                      <dd className="font-medium">{assignment.exposure}</dd>
                    </div>
                  )}
                  <div>
                    <dt className="text-muted-foreground">Parking</dt>
                    <dd className="font-medium">
                      {assignment.has_parking ? `${assignment.parking_count || 1} Stall${(assignment.parking_count || 1) > 1 ? "s" : ""}` : "None"}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground">Storage</dt>
                    <dd className="font-medium">{assignment.has_storage ? "Yes" : "No"}</dd>
                  </div>
                </dl>
              </CardContent>
            </Card>

            {/* Documents */}
            {assignment.listing_files && assignment.listing_files.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Documents</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {assignment.listing_files.map((file, i) => (
                      <a
                        key={i}
                        href={file.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-3 p-3 rounded-lg border border-border hover:bg-muted transition-colors"
                      >
                        <FileText className="h-5 w-5 text-primary" />
                        <span className="flex-1 truncate">{file.file_name || `Document ${i + 1}`}</span>
                        <span className="text-xs text-muted-foreground uppercase">{file.file_type}</span>
                      </a>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Right Column - Pricing & Contact */}
          <div className="space-y-6">
            {/* Pricing Card */}
            <Card className="border-primary/20 bg-gradient-to-b from-primary/5 to-background">
              <CardContent className="pt-6">
                <div className="text-3xl font-bold text-foreground mb-2">
                  {formatPrice(assignment.assignment_price)}
                </div>
                
                {discount && discount > 0 && (
                  <div className="flex items-center gap-2 mb-4">
                    <span className="text-sm text-muted-foreground line-through">
                      {formatPrice(assignment.original_price!)}
                    </span>
                    <Badge variant="secondary" className="bg-success/10 text-success">
                      Save {formatPrice(discount)}
                    </Badge>
                  </div>
                )}

                <div className="space-y-3 text-sm border-t border-border pt-4 mt-4">
                  {assignment.original_price && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Original Price</span>
                      <span className="font-medium">{formatPrice(assignment.original_price)}</span>
                    </div>
                  )}
                  {assignment.deposit_paid && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Deposit Paid</span>
                      <span className="font-medium">{formatPrice(assignment.deposit_paid)}</span>
                    </div>
                  )}
                  {assignment.assignment_fee !== null && assignment.assignment_fee !== undefined && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Assignment Fee</span>
                      <span className="font-medium">{formatPrice(assignment.assignment_fee)}</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Agent Contact Card */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Listing Agent</CardTitle>
              </CardHeader>
              <CardContent>
                {agent ? (
                  <div className="space-y-4">
                    <div>
                      <p className="font-medium">{agent.full_name || "Agent"}</p>
                      <p className="text-sm text-muted-foreground">{agent.brokerage_name}</p>
                    </div>
                    
                    <div className="space-y-2">
                      {agent.phone && (
                        <a
                          href={`tel:${agent.phone}`}
                          className="flex items-center gap-2 text-sm hover:text-primary transition-colors"
                        >
                          <Phone className="h-4 w-4" />
                          {agent.phone}
                        </a>
                      )}
                      {agent.email && (
                        <a
                          href={`mailto:${agent.email}?subject=Inquiry: ${assignment.title}`}
                          className="flex items-center gap-2 text-sm hover:text-primary transition-colors"
                        >
                          <Mail className="h-4 w-4" />
                          {agent.email}
                        </a>
                      )}
                    </div>

                    <Button className="w-full" size="lg">
                      <MessageSquare className="h-4 w-4 mr-2" />
                      Contact Agent
                    </Button>
                  </div>
                ) : (
                  <div className="text-center py-4">
                    <p className="text-sm text-muted-foreground">Loading agent info...</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Key Dates */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Key Dates</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 text-sm">
                  <div className="flex items-center gap-3">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="font-medium">Estimated Completion</p>
                      <p className="text-muted-foreground">{completionDate}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Home className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="font-medium">Construction Status</p>
                      <p className="text-muted-foreground capitalize">{assignment.construction_status.replace("_", " ")}</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
