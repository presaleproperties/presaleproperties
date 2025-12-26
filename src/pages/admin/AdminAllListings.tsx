import { useEffect, useState } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Tables } from "@/integrations/supabase/types";
import { 
  Building2,
  MapPin,
  Bed,
  Bath,
  Star,
  Loader2,
  Eye
} from "lucide-react";
import { Link } from "react-router-dom";

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

export default function AdminAllListings() {
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("all");
  const [updatingFeatured, setUpdatingFeatured] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchListings();
  }, []);

  const fetchListings = async () => {
    try {
      const { data, error } = await supabase
        .from("listings")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setListings(data || []);
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

  const filteredListings = listings.filter((listing) => {
    if (activeTab === "all") return true;
    if (activeTab === "published") return listing.status === "published";
    if (activeTab === "featured") return listing.is_featured;
    if (activeTab === "pending") return listing.status === "pending_approval";
    return true;
  });

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
          <h1 className="text-2xl font-bold">All Listings</h1>
          <p className="text-muted-foreground">Manage all listings on the platform</p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="all">
              All ({listings.length})
            </TabsTrigger>
            <TabsTrigger value="published">
              Published ({listings.filter(l => l.status === "published").length})
            </TabsTrigger>
            <TabsTrigger value="featured">
              <Star className="h-4 w-4 mr-1" />
              Featured ({listings.filter(l => l.is_featured).length})
            </TabsTrigger>
            <TabsTrigger value="pending">
              Pending ({listings.filter(l => l.status === "pending_approval").length})
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
                  <p className="text-muted-foreground">
                    No listings match the current filter
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {filteredListings.map((listing) => (
                  <Card key={listing.id}>
                    <CardContent className="p-4">
                      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-semibold truncate">{listing.title}</h3>
                            <Badge variant={statusLabels[listing.status]?.variant || "secondary"}>
                              {statusLabels[listing.status]?.label || listing.status}
                            </Badge>
                            {listing.is_featured && (
                              <Badge className="bg-amber-500/10 text-amber-600 border-amber-500/20">
                                <Star className="h-3 w-3 mr-1 fill-current" />
                                Featured
                              </Badge>
                            )}
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
                        </div>
                        
                        <div className="text-right">
                          <p className="text-lg font-bold text-primary">
                            {formatPrice(listing.assignment_price)}
                          </p>
                        </div>

                        <div className="flex items-center gap-4">
                          {listing.status === "published" && (
                            <div className="flex items-center gap-2">
                              <span className="text-sm text-muted-foreground">Featured</span>
                              <Switch
                                checked={listing.is_featured || false}
                                onCheckedChange={() => toggleFeatured(listing)}
                                disabled={updatingFeatured === listing.id}
                              />
                            </div>
                          )}
                          
                          {listing.status === "published" && (
                            <Link to={`/assignments/${listing.id}`} target="_blank">
                              <Button variant="outline" size="sm">
                                <Eye className="h-4 w-4" />
                              </Button>
                            </Link>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
}
