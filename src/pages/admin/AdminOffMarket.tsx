import { useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Building2, Package, Lock, Clock, Plus, Search,
  Eye, TrendingUp, Archive, Pencil
} from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

const statusColors: Record<string, string> = {
  draft: "bg-muted text-muted-foreground",
  pending_review: "bg-yellow-500/10 text-yellow-500",
  published: "bg-green-500/10 text-green-500",
  archived: "bg-red-500/10 text-red-400",
};

export default function AdminOffMarket() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortBy, setSortBy] = useState("newest");

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
      const totalAvailable = (availableData || []).reduce((s, r) => s + (r.available_units || 0), 0);
      return {
        activeListings: activeListings || 0,
        availableUnits: totalAvailable,
        pendingRequests: pendingRequests || 0,
        pendingSubmissions: pendingSubmissions || 0,
      };
    },
  });

  // Listings
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
      return data || [];
    },
  });

  // Recent activity
  const { data: recentActivity } = useQuery({
    queryKey: ["off-market-activity"],
    queryFn: async () => {
      const [{ data: requests }, { data: submissions }] = await Promise.all([
        supabase.from("off_market_access").select("id, first_name, last_name, listing_id, created_at, status").order("created_at", { ascending: false }).limit(5),
        supabase.from("off_market_listings").select("id, linked_project_name, status, created_at").eq("status", "pending_review").order("created_at", { ascending: false }).limit(5),
      ]);
      const events: { id: string; type: string; label: string; time: string }[] = [];
      (requests || []).forEach(r => events.push({
        id: r.id,
        type: "unlock_request",
        label: `${r.first_name} ${r.last_name} requested access`,
        time: r.created_at,
      }));
      (submissions || []).forEach(s => events.push({
        id: s.id,
        type: "submission",
        label: `"${s.linked_project_name}" submitted for review`,
        time: s.created_at,
      }));
      return events.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime()).slice(0, 10);
    },
  });

  const handleArchive = async (id: string) => {
    const { error } = await supabase.from("off_market_listings").update({ status: "archived" }).eq("id", id);
    if (error) { toast.error("Failed to archive"); return; }
    toast.success("Listing archived");
  };

  const statCards = [
    { label: "Active Listings", value: stats?.activeListings ?? 0, icon: Building2, color: "text-primary" },
    { label: "Available Units", value: stats?.availableUnits ?? 0, icon: Package, color: "text-green-500" },
    { label: "Pending Requests", value: stats?.pendingRequests ?? 0, icon: Lock, color: "text-yellow-500" },
    { label: "Pending Submissions", value: stats?.pendingSubmissions ?? 0, icon: Clock, color: "text-blue-400" },
  ];

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
          {/* Listings table */}
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

            <Card className="rounded-2xl border-border/50 overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Project</TableHead>
                    <TableHead>Developer</TableHead>
                    <TableHead className="text-center">Units</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-center">Requests</TableHead>
                    <TableHead>Updated</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {listingsLoading ? (
                    Array.from({ length: 5 }).map((_, i) => (
                      <TableRow key={i}>
                        {Array.from({ length: 7 }).map((_, j) => (
                          <TableCell key={j}><Skeleton className="h-5 w-full" /></TableCell>
                        ))}
                      </TableRow>
                    ))
                  ) : !listings?.length ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-16 text-muted-foreground">
                        <Building2 className="h-10 w-10 mx-auto mb-3 opacity-30" />
                        <p className="font-medium">No off-market listings yet</p>
                        <p className="text-sm mt-1">Create your first listing to get started</p>
                      </TableCell>
                    </TableRow>
                  ) : (
                    listings.map((l) => (
                      <TableRow key={l.id} className="cursor-pointer hover:bg-muted/30">
                        <TableCell className="font-medium">{l.linked_project_name}</TableCell>
                        <TableCell className="text-muted-foreground">{l.developer_name || "—"}</TableCell>
                        <TableCell className="text-center">
                          <span className="text-green-500 font-semibold">{l.available_units}</span>
                          <span className="text-muted-foreground"> / {l.total_units}</span>
                        </TableCell>
                        <TableCell>
                          <Badge className={`${statusColors[l.status || "draft"]} border-0 text-xs rounded-lg capitalize`}>
                            {(l.status || "draft").replace("_", " ")}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-center">{l.unlock_request_count || 0}</TableCell>
                        <TableCell className="text-muted-foreground text-sm">
                          {l.updated_at ? format(new Date(l.updated_at), "MMM d, yyyy") : "—"}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Link to={`/admin/off-market/edit/${l.id}`}>
                              <Button variant="ghost" size="sm" className="h-8 w-8 p-0"><Pencil className="h-3.5 w-3.5" /></Button>
                            </Link>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-muted-foreground hover:text-red-400" onClick={() => handleArchive(l.id)}>
                              <Archive className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </Card>
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
    </AdminLayout>
  );
}
