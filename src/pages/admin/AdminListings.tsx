import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Tables } from "@/integrations/supabase/types";
import { AssignmentPreviewModal } from "@/components/admin/AssignmentPreviewModal";
import { 
  CheckCircle, 
  XCircle, 
  Building2,
  MapPin,
  Bed,
  Bath,
  User,
  Loader2,
  Eye,
  Lock,
  Globe,
  Star
} from "lucide-react";
type Listing = Tables<"listings"> & {
  agent_profile?: {
    full_name: string | null;
    email: string;
    phone?: string | null;
  };
};

const statusLabels: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  draft: { label: "Draft", variant: "secondary" },
  pending_payment: { label: "Pending Payment", variant: "outline" },
  pending_approval: { label: "Pending Approval", variant: "outline" },
  published: { label: "Published", variant: "default" },
  rejected: { label: "Rejected", variant: "destructive" },
  expired: { label: "Expired", variant: "secondary" },
  paused: { label: "Paused", variant: "secondary" },
};

export default function AdminListings() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(searchParams.get("tab") || "pending");
  const [selectedListing, setSelectedListing] = useState<Listing | null>(null);
  const [actionType, setActionType] = useState<"approve" | "reject" | null>(null);
  const [notes, setNotes] = useState("");
  const [processing, setProcessing] = useState(false);
  const [updatingFeatured, setUpdatingFeatured] = useState<string | null>(null);
  const [previewListing, setPreviewListing] = useState<Listing | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchListings();
  }, []);

  useEffect(() => {
    setSearchParams({ tab: activeTab });
  }, [activeTab]);

  const fetchListings = async () => {
    try {
      const { data, error } = await supabase
        .from("listings")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Fetch agent profiles for each listing
      const listingsWithAgents = await Promise.all(
        (data || []).map(async (listing) => {
          const { data: profile } = await supabase
            .from("profiles")
            .select("full_name, email, phone")
            .eq("user_id", listing.agent_id)
            .single();
          
          return { ...listing, agent_profile: profile || undefined };
        })
      );

      setListings(listingsWithAgents);
    } catch (error) {
      console.error("Error fetching listings:", error);
      toast({
        title: "Error",
        description: "Failed to load assignments",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAction = (listing: Listing, action: "approve" | "reject") => {
    setSelectedListing(listing);
    setActionType(action);
    setNotes("");
  };

  const confirmAction = async () => {
    if (!selectedListing || !actionType) return;

    setProcessing(true);
    try {
      const newStatus = actionType === "approve" ? "published" : "rejected";
      const updates: { 
        status: "published" | "rejected"; 
        rejection_reason?: string | null; 
        published_at?: string | null; 
        expires_at?: string | null 
      } = { status: newStatus };

      if (actionType === "approve") {
        updates.published_at = new Date().toISOString();
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 365);
        updates.expires_at = expiresAt.toISOString();
      } else {
        updates.rejection_reason = notes || null;
      }
      
      const { error } = await supabase
        .from("listings")
        .update(updates)
        .eq("id", selectedListing.id);

      if (error) throw error;

      toast({
        title: actionType === "approve" ? "Assignment Approved" : "Assignment Rejected",
        description: `"${selectedListing.title}" has been ${actionType === "approve" ? "published" : "rejected"}`,
      });

      fetchListings();
    } catch (error) {
      console.error("Error updating listing:", error);
      toast({
        title: "Error",
        description: "Failed to update assignment status",
        variant: "destructive",
      });
    } finally {
      setProcessing(false);
      setSelectedListing(null);
      setActionType(null);
    }
  };

  const toggleFeatured = async (listing: Listing) => {
    setUpdatingFeatured(listing.id);
    try {
      const { error } = await supabase
        .from("listings")
        .update({ is_featured: !listing.is_featured })
        .eq("id", listing.id);

      if (error) throw error;

      setListings(prev => 
        prev.map(l => l.id === listing.id ? { ...l, is_featured: !l.is_featured } : l)
      );

      toast({
        title: listing.is_featured ? "Removed from Featured" : "Added to Featured",
        description: `"${listing.title}" has been ${listing.is_featured ? "unfeatured" : "featured"}`,
      });
    } catch (error) {
      console.error("Error updating featured status:", error);
      toast({
        title: "Error",
        description: "Failed to update featured status",
        variant: "destructive",
      });
    } finally {
      setUpdatingFeatured(null);
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("en-CA", {
      style: "currency",
      currency: "CAD",
      maximumFractionDigits: 0,
    }).format(price);
  };

  const pendingListings = listings.filter(l => l.status === "pending_approval");
  const publishedListings = listings.filter(l => l.status === "published");
  const featuredListings = listings.filter(l => l.is_featured);

  const filteredListings = (() => {
    switch (activeTab) {
      case "pending": return pendingListings;
      case "published": return publishedListings;
      case "featured": return featuredListings;
      default: return listings;
    }
  })();

  const renderListingCard = (listing: Listing, showApprovalActions = false) => (
    <Card key={listing.id}>
      <CardContent className="p-4 sm:p-6">
        <div className="flex flex-col lg:flex-row lg:items-start gap-4">
          <div className="flex-1 space-y-3 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-semibold text-lg truncate">{listing.title}</h3>
              <Badge variant={statusLabels[listing.status]?.variant || "secondary"}>
                {statusLabels[listing.status]?.label || listing.status}
              </Badge>
              {listing.is_featured && (
                <Badge className="bg-amber-500/10 text-amber-600 border-amber-500/20">
                  <Star className="h-3 w-3 mr-1 fill-current" />
                  Featured
                </Badge>
              )}
              {listing.visibility_mode === "restricted" ? (
                <Badge variant="outline" className="text-amber-600 border-amber-600">
                  <Lock className="h-3 w-3 mr-1" />
                  Restricted
                </Badge>
              ) : (
                <Badge variant="outline" className="text-green-600 border-green-600">
                  <Globe className="h-3 w-3 mr-1" />
                  Public
                </Badge>
              )}
            </div>
            
            <p className="text-muted-foreground">{listing.project_name}</p>
            
            <div className="flex flex-wrap items-center gap-4 text-sm">
              <span className="flex items-center gap-1">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                {listing.city}
                {listing.neighborhood && `, ${listing.neighborhood}`}
              </span>
              <span className="flex items-center gap-1">
                <Bed className="h-4 w-4 text-muted-foreground" />
                {listing.beds} bed
              </span>
              <span className="flex items-center gap-1">
                <Bath className="h-4 w-4 text-muted-foreground" />
                {listing.baths} bath
              </span>
            </div>

            {listing.agent_profile && (
              <div className="flex items-center gap-2 text-sm">
                <User className="h-4 w-4 text-muted-foreground" />
                <span>
                  {listing.agent_profile.full_name || "Unknown Agent"} 
                  <span className="text-muted-foreground"> ({listing.agent_profile.email})</span>
                </span>
              </div>
            )}

            <div className="text-lg font-bold text-primary">
              {formatPrice(listing.assignment_price)}
            </div>
          </div>

          <div className="flex flex-col gap-2 shrink-0">
            {showApprovalActions && (
              <>
                <Button
                  variant="default"
                  className="bg-primary hover:bg-primary/90"
                  onClick={() => setPreviewListing(listing)}
                >
                  <Eye className="h-4 w-4 mr-2" />
                  Preview & Review
                </Button>
              </>
            )}
            
            {listing.status === "published" && !showApprovalActions && (
              <div className="flex items-center gap-2 mb-2">
                <span className="text-sm text-muted-foreground">Featured</span>
                <Switch
                  checked={listing.is_featured || false}
                  onCheckedChange={() => toggleFeatured(listing)}
                  disabled={updatingFeatured === listing.id}
                />
              </div>
            )}
            
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => setPreviewListing(listing)}
            >
              <Eye className="h-4 w-4 mr-2" />
              Quick View
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Assignments</h1>
          <p className="text-muted-foreground">Manage assignments and approval queue</p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4 lg:w-auto lg:inline-flex">
            <TabsTrigger value="pending" className="relative">
              Pending
              {pendingListings.length > 0 && (
                <Badge variant="destructive" className="ml-2 h-5 px-1.5">
                  {pendingListings.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="published">
              Published ({publishedListings.length})
            </TabsTrigger>
            <TabsTrigger value="featured">
              <Star className="h-4 w-4 mr-1" />
              Featured ({featuredListings.length})
            </TabsTrigger>
            <TabsTrigger value="all">
              All ({listings.length})
            </TabsTrigger>
          </TabsList>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <>
              <TabsContent value="pending" className="mt-6">
                {pendingListings.length === 0 ? (
                  <Card>
                    <CardContent className="py-12 text-center">
                      <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
                      <h3 className="text-lg font-medium mb-2">All caught up!</h3>
                      <p className="text-muted-foreground">No assignments pending approval</p>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="space-y-4">
                    {pendingListings.map((listing) => renderListingCard(listing, true))}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="published" className="mt-6">
                <div className="space-y-4">
                  {publishedListings.length === 0 ? (
                    <Card>
                      <CardContent className="py-12 text-center">
                        <Building2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                        <h3 className="text-lg font-medium mb-2">No published assignments</h3>
                      </CardContent>
                    </Card>
                  ) : (
                    publishedListings.map((listing) => renderListingCard(listing))
                  )}
                </div>
              </TabsContent>

              <TabsContent value="featured" className="mt-6">
                <div className="space-y-4">
                  {featuredListings.length === 0 ? (
                    <Card>
                      <CardContent className="py-12 text-center">
                        <Star className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                        <h3 className="text-lg font-medium mb-2">No featured assignments</h3>
                        <p className="text-muted-foreground">Feature assignments from the Published tab</p>
                      </CardContent>
                    </Card>
                  ) : (
                    featuredListings.map((listing) => renderListingCard(listing))
                  )}
                </div>
              </TabsContent>

              <TabsContent value="all" className="mt-6">
                <div className="space-y-4">
                  {listings.length === 0 ? (
                    <Card>
                      <CardContent className="py-12 text-center">
                        <Building2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                        <h3 className="text-lg font-medium mb-2">No assignments yet</h3>
                      </CardContent>
                    </Card>
                  ) : (
                    listings.map((listing) => renderListingCard(listing, listing.status === "pending_approval"))
                  )}
                </div>
              </TabsContent>
            </>
          )}
        </Tabs>
      </div>

      {/* Confirmation Dialog */}
      <Dialog open={!!selectedListing && !!actionType} onOpenChange={() => { setSelectedListing(null); setActionType(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {actionType === "approve" ? "Approve Assignment" : "Reject Assignment"}
            </DialogTitle>
            <DialogDescription>
              {actionType === "approve" 
                ? `Approve "${selectedListing?.title}"? It will be published immediately.`
                : `Reject "${selectedListing?.title}"? Please provide a reason.`}
            </DialogDescription>
          </DialogHeader>
          
          {actionType === "reject" && (
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Rejection Reason</label>
                <Textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Explain why the assignment was rejected..."
                  className="mt-1"
                />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => { setSelectedListing(null); setActionType(null); }}>
              Cancel
            </Button>
            <Button
              onClick={confirmAction}
              disabled={processing || (actionType === "reject" && !notes.trim())}
              className={actionType === "approve" ? "bg-green-600 hover:bg-green-700" : "bg-red-600 hover:bg-red-700"}
            >
              {processing && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {actionType === "approve" ? "Confirm Approval" : "Confirm Rejection"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Assignment Preview Modal */}
      <AssignmentPreviewModal
        listing={previewListing}
        open={!!previewListing}
        onOpenChange={(open) => !open && setPreviewListing(null)}
        onApprove={() => {
          if (previewListing) {
            setSelectedListing(previewListing);
            setActionType("approve");
            setPreviewListing(null);
          }
        }}
        onReject={() => {
          if (previewListing) {
            setSelectedListing(previewListing);
            setActionType("reject");
            setPreviewListing(null);
          }
        }}
        processing={processing}
      />
    </AdminLayout>
  );
}
