import { useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAgentVerification } from "@/hooks/useAgentVerification";
import { ConversionHeader } from "@/components/conversion/ConversionHeader";
import { Footer } from "@/components/layout/Footer";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { 
  ArrowLeft, Bed, Bath, Square, Building2, Calendar, MapPin, 
  Lock, Shield, Phone, Mail, Briefcase, MessageSquare, Car, Box,
  Compass, Layers, DollarSign, Clock, CheckCircle2
} from "lucide-react";
import { Helmet } from "react-helmet-async";
import { cn } from "@/lib/utils";
import { SendInquiryButton } from "@/components/agent/SendInquiryButton";

function formatPrice(price: number): string {
  return `$${price.toLocaleString()}`;
}

// Agent Contact Card Component
function AgentContactCard({ 
  agentId, 
  isVerifiedAgent 
}: { 
  agentId: string; 
  isVerifiedAgent: boolean;
}) {
  const { data: agentProfile } = useQuery({
    queryKey: ["agent-profile", agentId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, user_id, full_name, email, phone")
        .eq("user_id", agentId)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: isVerifiedAgent && !!agentId,
  });

  const { data: agentDetails } = useQuery({
    queryKey: ["agent-details", agentId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("agent_profiles")
        .select("brokerage_name, license_number, verification_status")
        .eq("user_id", agentId)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: isVerifiedAgent && !!agentId,
  });

  if (!isVerifiedAgent) {
    return (
      <Card className="border-teal-200 dark:border-teal-800 bg-gradient-to-br from-teal-50/50 to-white dark:from-teal-950/30 dark:to-background">
        <CardContent className="p-6 text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-teal-100 dark:bg-teal-900/50 flex items-center justify-center">
            <Lock className="h-8 w-8 text-teal-600 dark:text-teal-400" />
          </div>
          <h3 className="font-semibold text-lg mb-2">Agent Contact Locked</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Only verified agents can view listing agent contact details and send inquiries.
          </p>
          <Link to="/for-agents">
            <Button className="w-full bg-teal-600 hover:bg-teal-700">
              <Shield className="h-4 w-4 mr-2" />
              Login to Agent Portal
            </Button>
          </Link>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-teal-200 dark:border-teal-800">
      <CardContent className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <Shield className="h-5 w-5 text-teal-600" />
          <h3 className="font-semibold text-lg">Listing Agent</h3>
          <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200">
            <CheckCircle2 className="h-3 w-3 mr-1" />
            Verified
          </Badge>
        </div>
        
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-teal-100 dark:bg-teal-900/50 flex items-center justify-center">
              <Briefcase className="h-6 w-6 text-teal-600" />
            </div>
            <div>
              <p className="font-medium">{agentProfile?.full_name || "Agent"}</p>
              <p className="text-sm text-muted-foreground">{agentDetails?.brokerage_name}</p>
            </div>
          </div>
          
          {agentProfile?.email && (
            <div className="flex items-center gap-2 text-sm">
              <Mail className="h-4 w-4 text-muted-foreground" />
              <a href={`mailto:${agentProfile.email}`} className="text-teal-600 hover:underline">
                {agentProfile.email}
              </a>
            </div>
          )}
          
          {agentProfile?.phone && (
            <div className="flex items-center gap-2 text-sm">
              <Phone className="h-4 w-4 text-muted-foreground" />
              <a href={`tel:${agentProfile.phone}`} className="text-teal-600 hover:underline">
                {agentProfile.phone}
              </a>
            </div>
          )}
          
          {agentDetails?.license_number && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground pt-2 border-t">
              <span>License: {agentDetails.license_number}</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// Blurred Content Overlay for Non-Agents
function BlurredOverlay() {
  return (
    <div className="absolute inset-0 bg-gradient-to-b from-white/80 via-white/90 to-white dark:from-background/80 dark:via-background/90 dark:to-background backdrop-blur-md flex flex-col items-center justify-center z-10 rounded-xl">
      <div className="text-center max-w-md px-6">
        <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-br from-teal-100 to-teal-200 dark:from-teal-900/50 dark:to-teal-800/50 flex items-center justify-center">
          <Lock className="h-10 w-10 text-teal-600 dark:text-teal-400" />
        </div>
        <h2 className="text-2xl font-bold mb-2">Agent-Exclusive Listing</h2>
        <p className="text-muted-foreground mb-6">
          Assignment listings are only accessible to verified real estate agents. 
          Login to your agent portal to view full details and connect with the listing agent.
        </p>
        <Link to="/for-agents">
          <Button size="lg" className="bg-teal-600 hover:bg-teal-700">
            <Shield className="h-5 w-5 mr-2" />
            Access Agent Portal
          </Button>
        </Link>
      </div>
    </div>
  );
}

export default function AssignmentDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { isVerifiedAgent, isLoading: agentLoading } = useAgentVerification();

  const { data: assignment, isLoading, error } = useQuery({
    queryKey: ["assignment", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("listings")
        .select(`
          *,
          listing_photos (id, url, sort_order)
        `)
        .eq("id", id)
        .eq("status", "published")
        .maybeSingle();
      
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [id]);

  if (isLoading || agentLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600"></div>
      </div>
    );
  }

  if (error || !assignment) {
    return (
      <div className="min-h-screen flex flex-col">
        <ConversionHeader />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-4">Assignment Not Found</h1>
            <p className="text-muted-foreground mb-6">This assignment may have been sold or removed.</p>
            <Link to="/map-search">
              <Button>Browse All Properties</Button>
            </Link>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const photos = assignment.listing_photos?.sort((a: any, b: any) => (a.sort_order || 0) - (b.sort_order || 0)) || [];
  const mainPhoto = photos[0]?.url;
  const savings = assignment.original_price ? assignment.original_price - assignment.assignment_price : null;

  return (
    <>
      <Helmet>
        <title>{isVerifiedAgent ? `${assignment.title} | Assignment` : "Agent-Exclusive Assignment"}</title>
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>
      
      <div className="min-h-screen flex flex-col bg-background">
        <ConversionHeader />
        
        <main className="flex-1">
          {/* Back Navigation */}
          <div className="container max-w-6xl mx-auto px-4 pt-6">
            <button 
              onClick={() => navigate(-1)}
              className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Search
            </button>
          </div>

          {/* Main Content */}
          <div className="container max-w-6xl mx-auto px-4 py-6">
            <div className="grid lg:grid-cols-3 gap-8">
              {/* Left Column - Details */}
              <div className="lg:col-span-2 space-y-6 relative">
                {!isVerifiedAgent && <BlurredOverlay />}
                
                {/* Photo Gallery */}
                <div className="relative rounded-xl overflow-hidden aspect-[16/10] bg-muted">
                  {mainPhoto ? (
                    <img 
                      src={mainPhoto} 
                      alt={assignment.title}
                      className={cn(
                        "w-full h-full object-cover",
                        !isVerifiedAgent && "blur-lg scale-110"
                      )}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-teal-100 to-teal-50">
                      <Building2 className="h-16 w-16 text-teal-300" />
                    </div>
                  )}
                  
                  {/* Badges */}
                  <div className="absolute top-4 left-4 flex gap-2">
                    <Badge className="bg-teal-600 text-white">Assignment</Badge>
                    {savings && savings > 0 && (
                      <Badge className="bg-green-600 text-white">
                        Save ${Math.round(savings / 1000)}K
                      </Badge>
                    )}
                  </div>
                </div>

                {/* Price & Title */}
                <div>
                  <div className="flex items-baseline gap-3 mb-2">
                    <span className="text-3xl font-bold text-foreground">
                      {isVerifiedAgent ? formatPrice(assignment.assignment_price) : "$XXX,XXX"}
                    </span>
                    {assignment.original_price && isVerifiedAgent && (
                      <span className="text-lg text-muted-foreground line-through">
                        {formatPrice(assignment.original_price)}
                      </span>
                    )}
                  </div>
                  <h1 className="text-xl font-semibold text-foreground mb-1">
                    {isVerifiedAgent ? assignment.title : "Agent-Exclusive Assignment"}
                  </h1>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <MapPin className="h-4 w-4" />
                    <span>
                      {isVerifiedAgent 
                        ? `${assignment.neighborhood || ""} ${assignment.neighborhood ? "•" : ""} ${assignment.city}`
                        : "Location Hidden"
                      }
                    </span>
                  </div>
                </div>

                {/* Quick Stats */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div className="bg-muted/50 rounded-lg p-4 text-center">
                    <Bed className="h-5 w-5 mx-auto mb-1 text-teal-600" />
                    <p className="text-lg font-semibold">{assignment.beds}</p>
                    <p className="text-xs text-muted-foreground">Bedrooms</p>
                  </div>
                  <div className="bg-muted/50 rounded-lg p-4 text-center">
                    <Bath className="h-5 w-5 mx-auto mb-1 text-teal-600" />
                    <p className="text-lg font-semibold">{assignment.baths}</p>
                    <p className="text-xs text-muted-foreground">Bathrooms</p>
                  </div>
                  <div className="bg-muted/50 rounded-lg p-4 text-center">
                    <Square className="h-5 w-5 mx-auto mb-1 text-teal-600" />
                    <p className="text-lg font-semibold">
                      {isVerifiedAgent && assignment.interior_sqft 
                        ? assignment.interior_sqft.toLocaleString() 
                        : "***"
                      }
                    </p>
                    <p className="text-xs text-muted-foreground">Sq Ft</p>
                  </div>
                  <div className="bg-muted/50 rounded-lg p-4 text-center">
                    <Building2 className="h-5 w-5 mx-auto mb-1 text-teal-600" />
                    <p className="text-lg font-semibold capitalize">{assignment.property_type}</p>
                    <p className="text-xs text-muted-foreground">Type</p>
                  </div>
                </div>

                <Separator />

                {/* Project Details */}
                <div>
                  <h2 className="text-lg font-semibold mb-4">Project Information</h2>
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div className="flex items-center gap-3">
                      <Building2 className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="text-sm text-muted-foreground">Project</p>
                        <p className="font-medium">
                          {isVerifiedAgent ? assignment.project_name : "Hidden"}
                        </p>
                      </div>
                    </div>
                    {assignment.developer_name && (
                      <div className="flex items-center gap-3">
                        <Briefcase className="h-5 w-5 text-muted-foreground" />
                        <div>
                          <p className="text-sm text-muted-foreground">Developer</p>
                          <p className="font-medium">
                            {isVerifiedAgent ? assignment.developer_name : "Hidden"}
                          </p>
                        </div>
                      </div>
                    )}
                    {assignment.floor_level && (
                      <div className="flex items-center gap-3">
                        <Layers className="h-5 w-5 text-muted-foreground" />
                        <div>
                          <p className="text-sm text-muted-foreground">Floor</p>
                          <p className="font-medium">{assignment.floor_level}</p>
                        </div>
                      </div>
                    )}
                    {assignment.exposure && (
                      <div className="flex items-center gap-3">
                        <Compass className="h-5 w-5 text-muted-foreground" />
                        <div>
                          <p className="text-sm text-muted-foreground">Exposure</p>
                          <p className="font-medium">{assignment.exposure}</p>
                        </div>
                      </div>
                    )}
                    <div className="flex items-center gap-3">
                      <Clock className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="text-sm text-muted-foreground">Construction</p>
                        <p className="font-medium capitalize">
                          {assignment.construction_status?.replace(/_/g, " ")}
                        </p>
                      </div>
                    </div>
                    {(assignment.completion_month || assignment.completion_year) && (
                      <div className="flex items-center gap-3">
                        <Calendar className="h-5 w-5 text-muted-foreground" />
                        <div>
                          <p className="text-sm text-muted-foreground">Completion</p>
                          <p className="font-medium">
                            {assignment.completion_month && `Q${Math.ceil(assignment.completion_month / 3)} `}
                            {assignment.completion_year}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <Separator />

                {/* Features */}
                <div>
                  <h2 className="text-lg font-semibold mb-4">Features</h2>
                  <div className="grid sm:grid-cols-3 gap-3">
                    <div className={cn(
                      "flex items-center gap-2 p-3 rounded-lg border",
                      assignment.has_parking ? "border-green-200 bg-green-50 text-green-700" : "border-muted"
                    )}>
                      <Car className="h-4 w-4" />
                      <span className="text-sm">
                        {assignment.has_parking 
                          ? `${assignment.parking_count || 1} Parking` 
                          : "No Parking"
                        }
                      </span>
                    </div>
                    <div className={cn(
                      "flex items-center gap-2 p-3 rounded-lg border",
                      assignment.has_storage ? "border-green-200 bg-green-50 text-green-700" : "border-muted"
                    )}>
                      <Box className="h-4 w-4" />
                      <span className="text-sm">
                        {assignment.has_storage ? "Storage Locker" : "No Storage"}
                      </span>
                    </div>
                    {assignment.exterior_sqft && (
                      <div className="flex items-center gap-2 p-3 rounded-lg border border-muted">
                        <Square className="h-4 w-4" />
                        <span className="text-sm">{assignment.exterior_sqft} sqft Outdoor</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Financial Details */}
                {isVerifiedAgent && (
                  <>
                    <Separator />
                    <div>
                      <h2 className="text-lg font-semibold mb-4">Financial Details</h2>
                      <div className="grid sm:grid-cols-2 gap-4">
                        <div className="flex items-center gap-3">
                          <DollarSign className="h-5 w-5 text-muted-foreground" />
                          <div>
                            <p className="text-sm text-muted-foreground">Assignment Price</p>
                            <p className="font-medium">{formatPrice(assignment.assignment_price)}</p>
                          </div>
                        </div>
                        {assignment.original_price && (
                          <div className="flex items-center gap-3">
                            <DollarSign className="h-5 w-5 text-muted-foreground" />
                            <div>
                              <p className="text-sm text-muted-foreground">Original Price</p>
                              <p className="font-medium">{formatPrice(assignment.original_price)}</p>
                            </div>
                          </div>
                        )}
                        {assignment.deposit_paid && (
                          <div className="flex items-center gap-3">
                            <DollarSign className="h-5 w-5 text-muted-foreground" />
                            <div>
                              <p className="text-sm text-muted-foreground">Deposit Paid</p>
                              <p className="font-medium">{formatPrice(assignment.deposit_paid)}</p>
                            </div>
                          </div>
                        )}
                        {assignment.assignment_fee && (
                          <div className="flex items-center gap-3">
                            <DollarSign className="h-5 w-5 text-muted-foreground" />
                            <div>
                              <p className="text-sm text-muted-foreground">Assignment Fee</p>
                              <p className="font-medium">{formatPrice(assignment.assignment_fee)}</p>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </>
                )}

                {/* Description */}
                {assignment.description && isVerifiedAgent && (
                  <>
                    <Separator />
                    <div>
                      <h2 className="text-lg font-semibold mb-4">Description</h2>
                      <p className="text-muted-foreground whitespace-pre-line">
                        {assignment.description}
                      </p>
                    </div>
                  </>
                )}
              </div>

              {/* Right Column - Agent Card & CTA */}
              <div className="space-y-6">
                <AgentContactCard 
                  agentId={assignment.agent_id} 
                  isVerifiedAgent={isVerifiedAgent} 
                />
                
                {isVerifiedAgent && (
                  <SendInquiryButton
                    listingId={assignment.id}
                    toAgentId={assignment.agent_id}
                    projectName={assignment.project_name}
                    className="w-full"
                  />
                )}

                {/* Quick Info Card */}
                <Card>
                  <CardContent className="p-4 space-y-3">
                    <h4 className="font-medium text-sm">About Assignment Sales</h4>
                    <p className="text-xs text-muted-foreground">
                      Assignment sales allow buyers to purchase a pre-sale contract from the original purchaser 
                      before the building is complete. This is an agent-to-agent transaction.
                    </p>
                    <div className="flex items-center gap-2 text-xs text-teal-600">
                      <Shield className="h-3 w-3" />
                      <span>Verified agents only</span>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </main>

        <Footer />
      </div>
    </>
  );
}
