import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
  Globe
} from "lucide-react";

type Listing = Tables<"listings"> & {
  agent_profile?: {
    full_name: string | null;
    email: string;
  };
};

export default function AdminListings() {
  const navigate = useNavigate();
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedListing, setSelectedListing] = useState<Listing | null>(null);
  const [actionType, setActionType] = useState<"approve" | "reject" | null>(null);
  const [notes, setNotes] = useState("");
  const [processing, setProcessing] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchListings();
  }, []);

  const fetchListings = async () => {
    try {
      const { data, error } = await supabase
        .from("listings")
        .select("*")
        .eq("status", "pending_approval")
        .order("created_at", { ascending: true });

      if (error) throw error;

      // Fetch agent profiles for each listing
      const listingsWithAgents = await Promise.all(
        (data || []).map(async (listing) => {
          const { data: profile } = await supabase
            .from("profiles")
            .select("full_name, email")
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
        description: "Failed to load listings",
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
        title: actionType === "approve" ? "Listing Approved" : "Listing Rejected",
        description: `"${selectedListing.title}" has been ${actionType === "approve" ? "published" : "rejected"}`,
      });

      // Refresh the list
      fetchListings();
    } catch (error) {
      console.error("Error updating listing:", error);
      toast({
        title: "Error",
        description: "Failed to update listing status",
        variant: "destructive",
      });
    } finally {
      setProcessing(false);
      setSelectedListing(null);
      setActionType(null);
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("en-CA", {
      style: "currency",
      currency: "CAD",
      maximumFractionDigits: 0,
    }).format(price);
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Listing Approval</h1>
          <p className="text-muted-foreground">Review and approve pending listings</p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : listings.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Building2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">No pending listings</h3>
              <p className="text-muted-foreground">
                All listings have been reviewed
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {listings.map((listing) => (
              <Card key={listing.id}>
                <CardContent className="p-6">
                  <div className="flex flex-col lg:flex-row lg:items-start gap-4">
                    <div className="flex-1 space-y-3">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-semibold text-lg">{listing.title}</h3>
                        <Badge variant="secondary">Pending Approval</Badge>
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

                      <div className="flex items-center gap-2 text-sm">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <span>
                          {listing.agent_profile?.full_name || "Unknown Agent"} 
                          <span className="text-muted-foreground"> ({listing.agent_profile?.email})</span>
                        </span>
                      </div>

                      <div className="text-lg font-bold text-primary">
                        {formatPrice(listing.assignment_price)}
                      </div>

                      {listing.description && (
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {listing.description}
                        </p>
                      )}
                    </div>

                    <div className="flex flex-col gap-2">
                      <Button
                        variant="outline"
                        className="text-green-600 border-green-600 hover:bg-green-50"
                        onClick={() => handleAction(listing, "approve")}
                      >
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Approve
                      </Button>
                      <Button
                        variant="outline"
                        className="text-red-600 border-red-600 hover:bg-red-50"
                        onClick={() => handleAction(listing, "reject")}
                      >
                        <XCircle className="h-4 w-4 mr-2" />
                        Reject
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => navigate(`/assignments/${listing.id}`)}
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        Preview
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Confirmation Dialog */}
      <Dialog open={!!selectedListing && !!actionType} onOpenChange={() => { setSelectedListing(null); setActionType(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {actionType === "approve" ? "Approve Listing" : "Reject Listing"}
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
                  placeholder="Explain why the listing was rejected..."
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
    </AdminLayout>
  );
}
