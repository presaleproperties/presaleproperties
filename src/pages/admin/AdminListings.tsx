import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Tables } from "@/integrations/supabase/types";
import { AssignmentPreviewModal } from "@/components/admin/AssignmentPreviewModal";
import { AdminAssignmentCard } from "@/components/admin/AdminAssignmentCard";
import { 
  CheckCircle, 
  Building2,
  Loader2,
  Star,
  AlertTriangle,
  Search,
  Pause,
  FileX,
} from "lucide-react";

type Listing = Tables<"listings"> & {
  agent_profile?: {
    full_name: string | null;
    email: string;
    phone?: string | null;
  };
};

export default function AdminListings() {
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
  const [searchQuery, setSearchQuery] = useState("");
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
        // Set default expiry to 365 days if not already set
        if (!selectedListing.expires_at) {
          const expiresAt = new Date();
          expiresAt.setDate(expiresAt.getDate() + 365);
          updates.expires_at = expiresAt.toISOString();
        }
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

  // Filter by search query
  const filterBySearch = (list: Listing[]) => {
    if (!searchQuery.trim()) return list;
    const query = searchQuery.toLowerCase();
    return list.filter(l => 
      l.title.toLowerCase().includes(query) ||
      l.project_name.toLowerCase().includes(query) ||
      l.city.toLowerCase().includes(query) ||
      l.agent_profile?.full_name?.toLowerCase().includes(query) ||
      l.agent_profile?.email?.toLowerCase().includes(query)
    );
  };

  const pendingListings = listings.filter(l => l.status === "pending_approval");
  const publishedListings = listings.filter(l => l.status === "published");
  const featuredListings = listings.filter(l => l.is_featured);
  const pausedListings = listings.filter(l => l.status === "paused");
  const expiredListings = listings.filter(l => l.status === "expired");

  const getFilteredListings = () => {
    switch (activeTab) {
      case "pending": return filterBySearch(pendingListings);
      case "published": return filterBySearch(publishedListings);
      case "featured": return filterBySearch(featuredListings);
      case "paused": return filterBySearch(pausedListings);
      case "expired": return filterBySearch(expiredListings);
      default: return filterBySearch(listings);
    }
  };

  const filteredListings = getFilteredListings();

  const renderEmptyState = (icon: React.ReactNode, title: string, description?: string) => (
    <Card>
      <CardContent className="py-12 text-center">
        <div className="mx-auto mb-4 text-muted-foreground">{icon}</div>
        <h3 className="text-lg font-medium mb-2">{title}</h3>
        {description && <p className="text-muted-foreground">{description}</p>}
      </CardContent>
    </Card>
  );

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">Assignment Management</h1>
            <p className="text-muted-foreground">Manage, approve, and monitor all assignments</p>
          </div>
          
          {/* Quick Stats */}
          <div className="flex items-center gap-3">
            {pendingListings.length > 0 && (
              <Badge variant="destructive" className="px-3 py-1">
                <AlertTriangle className="h-3.5 w-3.5 mr-1" />
                {pendingListings.length} Pending Review
              </Badge>
            )}
            {expiredListings.length > 0 && (
              <Badge variant="secondary" className="px-3 py-1">
                <FileX className="h-3.5 w-3.5 mr-1" />
                {expiredListings.length} Expired
              </Badge>
            )}
          </div>
        </div>

        {/* Search */}
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by title, project, city, or agent..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3 lg:grid-cols-6 lg:w-auto lg:inline-flex">
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
            <TabsTrigger value="paused">
              <Pause className="h-4 w-4 mr-1" />
              Paused ({pausedListings.length})
            </TabsTrigger>
            <TabsTrigger value="expired">
              <FileX className="h-4 w-4 mr-1" />
              Expired ({expiredListings.length})
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
                {filteredListings.length === 0 ? (
                  renderEmptyState(
                    <CheckCircle className="h-12 w-12 text-green-500" />,
                    "All caught up!",
                    "No assignments pending approval"
                  )
                ) : (
                  <div className="space-y-4">
                    {filteredListings.map((listing) => (
                      <AdminAssignmentCard
                        key={listing.id}
                        listing={listing}
                        showApprovalActions
                        onRefresh={fetchListings}
                        onPreview={() => setPreviewListing(listing)}
                        onApprove={() => handleAction(listing, "approve")}
                        onReject={() => handleAction(listing, "reject")}
                      />
                    ))}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="published" className="mt-6">
                {filteredListings.length === 0 ? (
                  renderEmptyState(
                    <Building2 className="h-12 w-12 text-muted-foreground" />,
                    "No published assignments"
                  )
                ) : (
                  <div className="space-y-4">
                    {filteredListings.map((listing) => (
                      <AdminAssignmentCard
                        key={listing.id}
                        listing={listing}
                        onRefresh={fetchListings}
                        onPreview={() => setPreviewListing(listing)}
                        onToggleFeatured={() => toggleFeatured(listing)}
                        isUpdatingFeatured={updatingFeatured === listing.id}
                      />
                    ))}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="featured" className="mt-6">
                {filteredListings.length === 0 ? (
                  renderEmptyState(
                    <Star className="h-12 w-12 text-muted-foreground" />,
                    "No featured assignments",
                    "Feature assignments from the Published tab"
                  )
                ) : (
                  <div className="space-y-4">
                    {filteredListings.map((listing) => (
                      <AdminAssignmentCard
                        key={listing.id}
                        listing={listing}
                        onRefresh={fetchListings}
                        onPreview={() => setPreviewListing(listing)}
                        onToggleFeatured={() => toggleFeatured(listing)}
                        isUpdatingFeatured={updatingFeatured === listing.id}
                      />
                    ))}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="paused" className="mt-6">
                {filteredListings.length === 0 ? (
                  renderEmptyState(
                    <Pause className="h-12 w-12 text-muted-foreground" />,
                    "No paused assignments",
                    "Paused assignments will appear here"
                  )
                ) : (
                  <div className="space-y-4">
                    {filteredListings.map((listing) => (
                      <AdminAssignmentCard
                        key={listing.id}
                        listing={listing}
                        onRefresh={fetchListings}
                        onPreview={() => setPreviewListing(listing)}
                      />
                    ))}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="expired" className="mt-6">
                {filteredListings.length === 0 ? (
                  renderEmptyState(
                    <FileX className="h-12 w-12 text-muted-foreground" />,
                    "No expired assignments",
                    "Expired assignments will appear here"
                  )
                ) : (
                  <div className="space-y-4">
                    {filteredListings.map((listing) => (
                      <AdminAssignmentCard
                        key={listing.id}
                        listing={listing}
                        onRefresh={fetchListings}
                        onPreview={() => setPreviewListing(listing)}
                      />
                    ))}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="all" className="mt-6">
                {filteredListings.length === 0 ? (
                  renderEmptyState(
                    <Building2 className="h-12 w-12 text-muted-foreground" />,
                    searchQuery ? "No matching assignments" : "No assignments yet"
                  )
                ) : (
                  <div className="space-y-4">
                    {filteredListings.map((listing) => (
                      <AdminAssignmentCard
                        key={listing.id}
                        listing={listing}
                        showApprovalActions={listing.status === "pending_approval"}
                        onRefresh={fetchListings}
                        onPreview={() => setPreviewListing(listing)}
                        onApprove={() => handleAction(listing, "approve")}
                        onReject={() => handleAction(listing, "reject")}
                        onToggleFeatured={listing.status === "published" ? () => toggleFeatured(listing) : undefined}
                        isUpdatingFeatured={updatingFeatured === listing.id}
                      />
                    ))}
                  </div>
                )}
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
