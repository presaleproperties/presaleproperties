import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Tables } from "@/integrations/supabase/types";
import { 
  Plus, 
  Building2, 
  MapPin, 
  Bed, 
  Bath,
  Edit,
  Eye,
  Loader2,
  Send,
  Pause,
  Play,
  RefreshCw,
  MoreHorizontal
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type Listing = Tables<"listings">;

const statusLabels: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  draft: { label: "Draft", variant: "secondary" },
  pending_payment: { label: "Pending Payment", variant: "outline" },
  pending_approval: { label: "Pending Approval", variant: "outline" },
  published: { label: "Published", variant: "default" },
  rejected: { label: "Rejected", variant: "destructive" },
  expired: { label: "Expired", variant: "secondary" },
  paused: { label: "Paused", variant: "secondary" },
};

export default function DashboardListings() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("all");
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      fetchListings();
    }
  }, [user]);

  const fetchListings = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from("listings")
        .select("*")
        .eq("agent_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setListings(data || []);
    } catch (error) {
      console.error("Error fetching listings:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitForApproval = async (listing: Listing) => {
    if (!user) return;
    setActionLoading(listing.id);

    try {
      // For now, skip payment and go directly to pending_approval
      // When payment is implemented, this would first go to pending_payment
      const { error } = await supabase
        .from("listings")
        .update({ status: "pending_approval" })
        .eq("id", listing.id);

      if (error) throw error;

      toast({
        title: "Submitted for Approval",
        description: "Your listing is now pending admin review.",
      });

      fetchListings();
    } catch (error) {
      console.error("Error submitting listing:", error);
      toast({
        title: "Error",
        description: "Failed to submit listing. Please try again.",
        variant: "destructive",
      });
    } finally {
      setActionLoading(null);
    }
  };

  const handlePauseListing = async (listing: Listing) => {
    setActionLoading(listing.id);

    try {
      const { error } = await supabase
        .from("listings")
        .update({ status: "paused" })
        .eq("id", listing.id);

      if (error) throw error;

      toast({
        title: "Listing Paused",
        description: "Your listing is now hidden from the marketplace.",
      });

      fetchListings();
    } catch (error) {
      console.error("Error pausing listing:", error);
      toast({
        title: "Error",
        description: "Failed to pause listing. Please try again.",
        variant: "destructive",
      });
    } finally {
      setActionLoading(null);
    }
  };

  const handleResumeListing = async (listing: Listing) => {
    setActionLoading(listing.id);

    try {
      const { error } = await supabase
        .from("listings")
        .update({ status: "published" })
        .eq("id", listing.id);

      if (error) throw error;

      toast({
        title: "Listing Resumed",
        description: "Your listing is now visible on the marketplace.",
      });

      fetchListings();
    } catch (error) {
      console.error("Error resuming listing:", error);
      toast({
        title: "Error",
        description: "Failed to resume listing. Please try again.",
        variant: "destructive",
      });
    } finally {
      setActionLoading(null);
    }
  };

  const handleRenewListing = async (listing: Listing) => {
    setActionLoading(listing.id);

    try {
      // For now, renew directly without payment
      // When payment is implemented, this would go to pending_payment first
      const newExpiresAt = new Date();
      newExpiresAt.setFullYear(newExpiresAt.getFullYear() + 1);

      const { error } = await supabase
        .from("listings")
        .update({ 
          status: "published",
          expires_at: newExpiresAt.toISOString(),
          published_at: new Date().toISOString()
        })
        .eq("id", listing.id);

      if (error) throw error;

      toast({
        title: "Listing Renewed",
        description: "Your listing has been renewed for another 365 days.",
      });

      fetchListings();
    } catch (error) {
      console.error("Error renewing listing:", error);
      toast({
        title: "Error",
        description: "Failed to renew listing. Please try again.",
        variant: "destructive",
      });
    } finally {
      setActionLoading(null);
    }
  };

  const filteredListings = listings.filter((listing) => {
    if (activeTab === "all") return true;
    if (activeTab === "active") return listing.status === "published";
    if (activeTab === "pending") return listing.status === "pending_approval" || listing.status === "pending_payment";
    if (activeTab === "drafts") return listing.status === "draft";
    return true;
  });

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("en-CA", {
      style: "currency",
      currency: "CAD",
      maximumFractionDigits: 0,
    }).format(price);
  };

  const renderListingActions = (listing: Listing) => {
    const isLoading = actionLoading === listing.id;

    return (
      <div className="flex gap-2">
        <Link to={`/dashboard/listings/${listing.id}/edit`}>
          <Button variant="outline" size="sm" disabled={isLoading}>
            <Edit className="h-4 w-4" />
          </Button>
        </Link>
        
        {listing.status === "published" && (
          <Link to={`/assignments/${listing.id}`} target="_blank">
            <Button variant="outline" size="sm">
              <Eye className="h-4 w-4" />
            </Button>
          </Link>
        )}

        {/* Submit for Approval - Draft only */}
        {listing.status === "draft" && (
          <Button 
            size="sm" 
            onClick={() => handleSubmitForApproval(listing)}
            disabled={isLoading}
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <>
                <Send className="h-4 w-4 mr-1" />
                Submit
              </>
            )}
          </Button>
        )}

        {/* Actions Menu for Published/Paused/Expired */}
        {(listing.status === "published" || listing.status === "paused" || listing.status === "expired") && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" disabled={isLoading}>
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <MoreHorizontal className="h-4 w-4" />
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {listing.status === "published" && (
                <DropdownMenuItem onClick={() => handlePauseListing(listing)}>
                  <Pause className="h-4 w-4 mr-2" />
                  Pause Listing
                </DropdownMenuItem>
              )}
              {listing.status === "paused" && (
                <DropdownMenuItem onClick={() => handleResumeListing(listing)}>
                  <Play className="h-4 w-4 mr-2" />
                  Resume Listing
                </DropdownMenuItem>
              )}
              {listing.status === "expired" && (
                <DropdownMenuItem onClick={() => handleRenewListing(listing)}>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Renew Listing
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
    );
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">My Listings</h1>
            <p className="text-muted-foreground">Manage your assignment listings</p>
          </div>
          <Link to="/dashboard/listings/new">
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              New Listing
            </Button>
          </Link>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="all">
              All ({listings.length})
            </TabsTrigger>
            <TabsTrigger value="active">
              Active ({listings.filter(l => l.status === "published").length})
            </TabsTrigger>
            <TabsTrigger value="pending">
              Pending ({listings.filter(l => l.status === "pending_approval" || l.status === "pending_payment").length})
            </TabsTrigger>
            <TabsTrigger value="drafts">
              Drafts ({listings.filter(l => l.status === "draft").length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab} className="mt-6">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : filteredListings.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <Building2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">No listings found</h3>
                  <p className="text-muted-foreground mb-4">
                    {activeTab === "all" 
                      ? "Create your first listing to get started"
                      : `No ${activeTab} listings`}
                  </p>
                  <Link to="/dashboard/listings/new">
                    <Button>
                      <Plus className="h-4 w-4 mr-2" />
                      Create Listing
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {filteredListings.map((listing) => (
                  <Card key={listing.id} className="overflow-hidden">
                    <CardContent className="p-4">
                      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-semibold truncate">{listing.title}</h3>
                            <Badge variant={statusLabels[listing.status]?.variant || "secondary"}>
                              {statusLabels[listing.status]?.label || listing.status}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground mb-2">
                            {listing.project_name}
                          </p>
                          <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <MapPin className="h-3 w-3" />
                              {listing.city}
                            </span>
                            <span className="flex items-center gap-1">
                              <Bed className="h-3 w-3" />
                              {listing.beds} bed
                            </span>
                            <span className="flex items-center gap-1">
                              <Bath className="h-3 w-3" />
                              {listing.baths} bath
                            </span>
                          </div>
                          {listing.rejection_reason && listing.status === "rejected" && (
                            <p className="text-sm text-destructive mt-2">
                              Rejection reason: {listing.rejection_reason}
                            </p>
                          )}
                          {listing.expires_at && (listing.status === "published" || listing.status === "expired") && (
                            <p className={`text-sm mt-2 ${listing.status === "expired" ? "text-destructive" : "text-muted-foreground"}`}>
                              {listing.status === "expired" ? "Expired: " : "Expires: "}
                              {new Date(listing.expires_at).toLocaleDateString("en-CA", { year: "numeric", month: "short", day: "numeric" })}
                            </p>
                          )}
                        </div>
                        
                        <div className="text-right">
                          <p className="text-lg font-bold text-primary">
                            {formatPrice(listing.assignment_price)}
                          </p>
                        </div>
                        
                        {renderListingActions(listing)}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
