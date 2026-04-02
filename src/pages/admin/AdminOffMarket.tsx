import { useState } from "react";
import { Link } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Building2, Package, Lock, Clock, Plus, Search,
  Eye, Archive, Pencil, MoreVertical, Trash2, CheckCircle, MapPin, Users
} from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

const statusColors: Record<string, string> = {
  draft: "bg-muted text-muted-foreground",
  pending_review: "bg-primary/10 text-primary border border-primary/20",
  published: "bg-primary/10 text-primary border border-primary/20",
  archived: "bg-muted text-muted-foreground",
  sold: "bg-muted text-muted-foreground",
};

export default function AdminOffMarket() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortBy, setSortBy] = useState("newest");
  const [confirmAction, setConfirmAction] = useState<{ id: string; type: "delete" | "sold" | "archive"; name: string } | null>(null);
  const [processing, setProcessing] = useState(false);

  // Stats
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ["off-market-stats"],
    queryFn: async () => {
      const [
        { count: activeListings },
        { data: availableData },
        { count: pendingRequests },
        { count: pendingSubmissions },
      ] = await Promise.all([
        supabase.from("off_market_listings").select("*", { count: "exact", head: true }).eq("status", "published"),
        supabase.from("off_market_listings").select("available_units").eq("status", "published"),
        supabase.from("off_market_access").select("*", { count: "exact", head: true }).eq("status", "pending"),
        supabase.from("off_market_listings").select("*", { count: "exact", head: true }).eq("status", "pending_review"),
      ]);
      const totalAvailable = (availableData || []).reduce((s: number, r: any) => s + (r.available_units || 0), 0);
      return {
        activeListings: activeListings || 0,
        availableUnits: totalAvailable,
        pendingRequests: pendingRequests || 0,
        pendingSubmissions: pendingSubmissions || 0,
      };
    },
  });

  // Listings with project image
  const { data: listings, isLoading: listingsLoading } = useQuery({
    queryKey: ["off-market-listings", search, statusFilter, sortBy],
    queryFn: async () => {
      let q = supabase
        .from("off_market_listings")
        .select("*");

      if (statusFilter !== "all") q = q.eq("status", statusFilter);
      if (search) q = q.ilike("linked_project_name", `%${search}%`);

      if (sortBy === "newest") q = q.order("created_at", { ascending: false });
      else if (sortBy === "requests") q = q.order("unlock_request_count", { ascending: false });
      else if (sortBy === "units") q = q.order("total_units", { ascending: false });

      const { data, error } = await q.limit(50);
      if (error) throw error;

      // Fetch project images by slug
      const slugs = (data || []).map((l: any) => l.linked_project_slug).filter(Boolean);
      let projectImages: Record<string, { featured_image: string | null; city: string | null; neighborhood: string | null }> = {};
      if (slugs.length > 0) {
        const { data: projects } = await supabase
          .from("presale_projects")
          .select("slug, featured_image, city, neighborhood")
          .in("slug", slugs);
        (projects || []).forEach((p: any) => {
          projectImages[p.slug] = { featured_image: p.featured_image, city: p.city, neighborhood: p.neighborhood };
        });
      }

      return (data || []).map((l: any) => ({
        ...l,
        project_image: projectImages[l.linked_project_slug]?.featured_image || null,
        project_city: projectImages[l.linked_project_slug]?.city || null,
        project_neighborhood: projectImages[l.linked_project_slug]?.neighborhood || null,
      }));
    },
  });

  const refreshAll = () => {
    queryClient.invalidateQueries({ queryKey: ["off-market-listings"] });
    queryClient.invalidateQueries({ queryKey: ["off-market-stats"] });
  };

  const handleConfirmAction = async () => {
    if (!confirmAction) return;
    setProcessing(true);
    try {
      if (confirmAction.type === "delete") {
        // Delete units first, then listing
        await supabase.from("off_market_units").delete().eq("listing_id", confirmAction.id);
        const { error } = await supabase.from("off_market_listings").delete().eq("id", confirmAction.id);
        if (error) throw error;
        toast.success(`"${confirmAction.name}" deleted permanently`);
      } else if (confirmAction.type === "sold") {
        const { error } = await supabase.from("off_market_listings")
          .update({ status: "archived", available_units: 0 })
          .eq("id", confirmAction.id);
        if (error) throw error;
        // Also mark all units as sold
        await supabase.from("off_market_units")
          .update({ status: "sold", sold_at: new Date().toISOString() })
          .eq("listing_id", confirmAction.id);
        toast.success(`"${confirmAction.name}" marked as sold`);
      } else if (confirmAction.type === "archive") {
        const { error } = await supabase.from("off_market_listings")
          .update({ status: "archived" })
          .eq("id", confirmAction.id);
        if (error) throw error;
        toast.success(`"${confirmAction.name}" archived`);
      }
      refreshAll();
    } catch (err: any) {
      toast.error(err.message || "Action failed");
    } finally {
      setProcessing(false);
      setConfirmAction(null);
    }
  };

  // Recent activity
  const { data: recentActivity } = useQuery({
    queryKey: ["off-market-activity"],
    queryFn: async () => {
      const [{ data: requests }, { data: submissions }] = await Promise.all([
        supabase.from("off_market_access").select("id, first_name, last_name, listing_id, created_at, status").order("created_at", { ascending: false }).limit(5),
        supabase.from("off_market_listings").select("id, linked_project_name, status, created_at").eq("status", "pending_review").order("created_at", { ascending: false }).limit(5),
      ]);
      const events: { id: string; type: string; label: string; time: string }[] = [];
      (requests || []).forEach((r: any) => events.push({
        id: r.id, type: "unlock_request",
        label: `${r.first_name} ${r.last_name} requested access`,
        time: r.created_at,
      }));
      (submissions || []).forEach((s: any) => events.push({
        id: s.id, type: "submission",
        label: `"${s.linked_project_name}" submitted for review`,
        time: s.created_at,
      }));
      return events.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime()).slice(0, 10);
    },
  });

  const statCards = [
    { label: "Active Listings", value: stats?.activeListings ?? 0, icon: Building2, color: "text-primary" },
    { label: "Available Units", value: stats?.availableUnits ?? 0, icon: Package, color: "text-emerald-500" },
    { label: "Pending Requests", value: stats?.pendingRequests ?? 0, icon: Lock, color: "text-yellow-500" },
    { label: "Pending Submissions", value: stats?.pendingSubmissions ?? 0, icon: Clock, color: "text-blue-400" },
  ];

  const getConfirmDetails = () => {
    if (!confirmAction) return null;
    switch (confirmAction.type) {
      case "delete":
        return {
          title: "Delete Listing Permanently",
          description: `This will permanently delete "${confirmAction.name}" and all its units. This cannot be undone.`,
          actionLabel: "Delete",
          destructive: true,
        };
      case "sold":
        return {
          title: "Mark as Sold Out",
          description: `Mark "${confirmAction.name}" as sold out? All units will be marked as sold and the listing will be archived.`,
          actionLabel: "Mark Sold",
          destructive: false,
        };
      case "archive":
        return {
          title: "Archive Listing",
          description: `Archive "${confirmAction.name}"? It will be hidden from public view but can be restored later.`,
          actionLabel: "Archive",
          destructive: false,
        };
      default:
        return null;
    }
  };

  const confirmDetails = getConfirmDetails();

  return (
    <AdminLayout>
      <div className="px-6 md:px-10 py-8 max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold">Off-Market Inventory</h1>
            <p className="text-muted-foreground text-sm">Manage exclusive developer inventory for VIP clients</p>
          </div>
          <div className="flex gap-2">
            <Link to="/admin/off-market/access">
              <Button variant="outline" className="rounded-xl gap-1.5">
                <Lock className="h-4 w-4" /> Access Requests
                {(stats?.pendingRequests ?? 0) > 0 && (
                  <Badge className="ml-1 bg-yellow-500 text-black text-xs px-1.5">{stats?.pendingRequests}</Badge>
                )}
              </Button>
            </Link>
            <Link to="/admin/off-market/new">
              <Button className="rounded-xl gap-1.5 shadow-gold hover:shadow-gold-glow font-bold">
                <Plus className="h-4 w-4" /> New Listing
              </Button>
            </Link>
          </div>
        </div>

        {/* Stat cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {statCards.map(({ label, value, icon: Icon, color }) => (
            <Card key={label} className="rounded-2xl border-border/50">
              <CardContent className="p-5">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">{label}</p>
                  <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Icon className={`h-4 w-4 ${color}`} />
                  </div>
                </div>
                {statsLoading ? <Skeleton className="h-8 w-16" /> : <div className="text-3xl font-bold">{value}</div>}
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid lg:grid-cols-[1fr_320px] gap-6">
          {/* Listings */}
          <div>
            <div className="flex flex-wrap gap-3 mb-5">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Search projects..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9 rounded-xl" />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[140px] rounded-xl"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="published">Published</SelectItem>
                  <SelectItem value="pending_review">Pending</SelectItem>
                  <SelectItem value="archived">Archived</SelectItem>
                </SelectContent>
              </Select>
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-[150px] rounded-xl"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="newest">Newest First</SelectItem>
                  <SelectItem value="requests">Most Requests</SelectItem>
                  <SelectItem value="units">Most Units</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Card-based listings */}
            {listingsLoading ? (
              <div className="grid gap-4">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Card key={i} className="rounded-2xl border-border/50">
                    <CardContent className="p-4 flex gap-4">
                      <Skeleton className="w-28 h-28 rounded-xl flex-shrink-0" />
                      <div className="flex-1 space-y-2">
                        <Skeleton className="h-5 w-2/3" />
                        <Skeleton className="h-4 w-1/3" />
                        <Skeleton className="h-4 w-1/2" />
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : !listings?.length ? (
              <Card className="rounded-2xl border-border/50">
                <CardContent className="py-16 text-center text-muted-foreground">
                  <Building2 className="h-10 w-10 mx-auto mb-3 opacity-30" />
                  <p className="font-medium">No off-market listings yet</p>
                  <p className="text-sm mt-1">Create your first listing to get started</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-3">
                {listings.map((l: any) => (
                  <Card key={l.id} className="rounded-2xl border-border/50 hover:border-border transition-colors group">
                    <CardContent className="p-0">
                      <div className="flex items-stretch">
                        {/* Project Image */}
                        <div className="w-32 sm:w-40 flex-shrink-0 relative overflow-hidden rounded-l-2xl">
                          {l.project_image ? (
                            <img
                              src={l.project_image}
                              alt={l.linked_project_name}
                              className="w-full h-full object-cover min-h-[120px] transition-transform duration-300 group-hover:scale-105"
                              loading="lazy"
                            />
                          ) : (
                            <div className="w-full h-full min-h-[120px] bg-muted flex items-center justify-center">
                              <Building2 className="h-8 w-8 text-muted-foreground/30" />
                            </div>
                          )}
                          <Badge className={`absolute top-2 left-2 ${statusColors[l.status || "draft"]} border-0 text-[10px] rounded-md capitalize`}>
                            {(l.status || "draft").replace("_", " ")}
                          </Badge>
                        </div>

                        {/* Content */}
                        <div className="flex-1 p-4 flex flex-col justify-between min-w-0">
                          <div>
                            <div className="flex items-start justify-between gap-2">
                              <div className="min-w-0">
                                <h3 className="font-bold text-base truncate">{l.linked_project_name}</h3>
                                <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground">
                                  {(l.project_city || l.developer_name) && (
                                    <span className="flex items-center gap-1 truncate">
                                      <MapPin className="h-3 w-3 flex-shrink-0" />
                                      {l.project_neighborhood ? `${l.project_neighborhood}, ${l.project_city}` : l.project_city || l.developer_name}
                                    </span>
                                  )}
                                  {l.developer_name && l.project_city && (
                                    <span className="truncate">by {l.developer_name}</span>
                                  )}
                                </div>
                              </div>

                              {/* Actions dropdown */}
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0 flex-shrink-0">
                                    <MoreVertical className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-48">
                                  <Link to={`/off-market/${l.linked_project_slug}`} target="_blank">
                                    <DropdownMenuItem>
                                      <Eye className="h-4 w-4 mr-2" /> Preview Public Page
                                    </DropdownMenuItem>
                                  </Link>
                                  <Link to={`/admin/off-market/edit/${l.id}`}>
                                    <DropdownMenuItem>
                                      <Pencil className="h-4 w-4 mr-2" /> Edit Listing
                                    </DropdownMenuItem>
                                  </Link>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem
                                    onClick={() => setConfirmAction({ id: l.id, type: "sold", name: l.linked_project_name })}
                                  >
                                    <CheckCircle className="h-4 w-4 mr-2" /> Mark as Sold
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onClick={() => setConfirmAction({ id: l.id, type: "archive", name: l.linked_project_name })}
                                  >
                                    <Archive className="h-4 w-4 mr-2" /> Archive
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem
                                    className="text-destructive focus:text-destructive"
                                    onClick={() => setConfirmAction({ id: l.id, type: "delete", name: l.linked_project_name })}
                                  >
                                    <Trash2 className="h-4 w-4 mr-2" /> Delete Permanently
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                          </div>

                          {/* Bottom row */}
                          <div className="flex items-center justify-between mt-3 gap-3 flex-wrap">
                            <div className="flex items-center gap-3 text-sm">
                              <span className="flex items-center gap-1">
                                <Package className="h-3.5 w-3.5 text-muted-foreground" />
                                <span className="text-emerald-500 font-semibold">{l.available_units}</span>
                                <span className="text-muted-foreground">/ {l.total_units} units</span>
                              </span>
                              <span className="flex items-center gap-1 text-muted-foreground">
                                <Users className="h-3.5 w-3.5" />
                                {l.unlock_request_count || 0} requests
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              {l.construction_stage && (
                                <Badge variant="outline" className="text-[10px] capitalize">{l.construction_stage.replace("-", " ")}</Badge>
                              )}
                              <span className="text-xs text-muted-foreground">
                                {l.updated_at ? format(new Date(l.updated_at), "MMM d, yyyy") : ""}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>

          {/* Recent Activity */}
          <div>
            <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground mb-4">Recent Activity</h2>
            <div className="space-y-3">
              {!recentActivity?.length ? (
                <p className="text-sm text-muted-foreground">No recent activity</p>
              ) : (
                recentActivity.map((e) => (
                  <Card key={e.id} className="rounded-xl border-border/50">
                    <CardContent className="p-3">
                      <div className="flex items-start gap-2">
                        <div className={`mt-0.5 w-2 h-2 rounded-full flex-shrink-0 ${e.type === "unlock_request" ? "bg-yellow-500" : "bg-blue-400"}`} />
                        <div className="min-w-0">
                          <p className="text-sm truncate">{e.label}</p>
                          <p className="text-xs text-muted-foreground">{format(new Date(e.time), "MMM d, h:mm a")}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Confirm Dialog */}
      <AlertDialog open={!!confirmAction} onOpenChange={() => setConfirmAction(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{confirmDetails?.title}</AlertDialogTitle>
            <AlertDialogDescription>{confirmDetails?.description}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={processing}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmAction}
              disabled={processing}
              className={confirmDetails?.destructive ? "bg-destructive hover:bg-destructive/90" : ""}
            >
              {processing ? "Processing..." : confirmDetails?.actionLabel}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminLayout>
  );
}
