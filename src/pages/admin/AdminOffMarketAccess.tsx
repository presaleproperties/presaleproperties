import { useState, useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger
} from "@/components/ui/alert-dialog";
import {
  Check, X, ArrowLeft, Search, Clock, CheckCircle, XCircle,
  User, Mail, Phone, Building2, DollarSign, Calendar, Users
} from "lucide-react";
import { toast } from "sonner";
import { format, formatDistanceToNow } from "date-fns";
import { Link } from "react-router-dom";

const statusConfig: Record<string, { color: string; icon: typeof Clock; label: string }> = {
  pending: { color: "bg-primary/10 text-primary border border-primary/20", icon: Clock, label: "Pending" },
  approved: { color: "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20", icon: CheckCircle, label: "Approved" },
  denied: { color: "bg-destructive/10 text-destructive border border-destructive/20", icon: XCircle, label: "Denied" },
};

export default function AdminOffMarketAccess() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState("pending");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const { data: requests, isLoading } = useQuery({
    queryKey: ["off-market-access", statusFilter, search],
    queryFn: async () => {
      let q = supabase.from("off_market_access").select("*, off_market_listings(linked_project_name)").order("created_at", { ascending: false });
      if (statusFilter !== "all") q = q.eq("status", statusFilter);
      if (search) q = q.or(`first_name.ilike.%${search}%,last_name.ilike.%${search}%,email.ilike.%${search}%`);
      const { data, error } = await q.limit(200);
      if (error) throw error;
      return data || [];
    },
  });

  // Stats
  const { data: stats } = useQuery({
    queryKey: ["off-market-access-stats"],
    queryFn: async () => {
      const [{ count: pending }, { count: approved }, { count: denied }] = await Promise.all([
        supabase.from("off_market_access").select("*", { count: "exact", head: true }).eq("status", "pending"),
        supabase.from("off_market_access").select("*", { count: "exact", head: true }).eq("status", "approved"),
        supabase.from("off_market_access").select("*", { count: "exact", head: true }).eq("status", "denied"),
      ]);
      return { pending: pending || 0, approved: approved || 0, denied: denied || 0, total: (pending || 0) + (approved || 0) + (denied || 0) };
    },
  });

  const handleAction = async (id: string, action: "approved" | "denied") => {
    const updates: any = { status: action };
    if (action === "approved") {
      updates.approved_at = new Date().toISOString();
      updates.approved_by = user?.email || "admin";
    }
    const { error } = await supabase.from("off_market_access").update(updates).eq("id", id);
    if (error) { toast.error("Failed to update"); return; }
    toast.success(action === "approved" ? "Access approved ✓" : "Access denied");
    setSelected(prev => { const next = new Set(prev); next.delete(id); return next; });
    queryClient.invalidateQueries({ queryKey: ["off-market-access"] });
    queryClient.invalidateQueries({ queryKey: ["off-market-access-stats"] });
    queryClient.invalidateQueries({ queryKey: ["off-market-stats"] });
  };

  const handleBulkApprove = async () => {
    const ids = Array.from(selected);
    if (!ids.length) return;
    const updates = { status: "approved", approved_at: new Date().toISOString(), approved_by: user?.email || "admin" };
    const { error } = await supabase.from("off_market_access").update(updates).in("id", ids);
    if (error) { toast.error("Bulk approve failed"); return; }
    toast.success(`${ids.length} requests approved ✓`);
    setSelected(new Set());
    queryClient.invalidateQueries({ queryKey: ["off-market-access"] });
    queryClient.invalidateQueries({ queryKey: ["off-market-access-stats"] });
  };

  const toggleSelect = (id: string) => {
    setSelected(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const selectAll = () => {
    const pendingIds = (requests || []).filter((r: any) => r.status === "pending").map((r: any) => r.id);
    if (selected.size === pendingIds.length && pendingIds.length > 0) {
      setSelected(new Set());
    } else {
      setSelected(new Set(pendingIds));
    }
  };

  const pendingCount = (requests || []).filter((r: any) => r.status === "pending").length;
  const allPendingSelected = pendingCount > 0 && selected.size === pendingCount;

  const statCards = [
    { label: "Pending", value: stats?.pending ?? 0, icon: Clock, active: statusFilter === "pending", filter: "pending", accent: "text-primary" },
    { label: "Approved", value: stats?.approved ?? 0, icon: CheckCircle, active: statusFilter === "approved", filter: "approved", accent: "text-emerald-500" },
    { label: "Denied", value: stats?.denied ?? 0, icon: XCircle, active: statusFilter === "denied", filter: "denied", accent: "text-destructive" },
    { label: "Total", value: stats?.total ?? 0, icon: Users, active: statusFilter === "all", filter: "all", accent: "text-foreground" },
  ];

  return (
    <AdminLayout>
      <div className="px-6 md:px-10 py-8 max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Link to="/admin/off-market">
              <Button variant="ghost" size="sm" className="rounded-xl gap-1.5">
                <ArrowLeft className="h-4 w-4" /> Back
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold">Access Requests</h1>
              <p className="text-muted-foreground text-sm">Review and manage VIP unlock requests</p>
            </div>
          </div>
          {selected.size > 0 && (
            <Button onClick={handleBulkApprove} className="rounded-xl gap-1.5 shadow-md font-bold">
              <Check className="h-4 w-4" /> Approve {selected.size} Selected
            </Button>
          )}
        </div>

        {/* Stat pills */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
          {statCards.map(({ label, value, icon: Icon, active, filter, accent }) => (
            <button
              key={filter}
              onClick={() => setStatusFilter(filter)}
              className={`rounded-xl border p-4 text-left transition-all ${
                active
                  ? "border-primary/40 bg-primary/5 shadow-sm"
                  : "border-border/50 bg-card hover:border-border"
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider">{label}</span>
                <Icon className={`h-4 w-4 ${accent}`} />
              </div>
              <p className="text-2xl font-bold">{value}</p>
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="flex gap-3 mb-5 items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search by name or email..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9 rounded-xl" />
          </div>
          {statusFilter === "pending" && pendingCount > 0 && (
            <Button variant="outline" size="sm" className="rounded-xl gap-1.5" onClick={selectAll}>
              <Checkbox checked={allPendingSelected} className="mr-1" />
              {allPendingSelected ? "Deselect All" : "Select All"}
            </Button>
          )}
        </div>

        {/* Request cards */}
        {isLoading ? (
          <div className="grid gap-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <Card key={i} className="rounded-2xl border-border/50">
                <CardContent className="p-5">
                  <div className="flex gap-4">
                    <Skeleton className="w-10 h-10 rounded-full flex-shrink-0" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-5 w-1/3" />
                      <Skeleton className="h-4 w-1/2" />
                      <Skeleton className="h-4 w-2/3" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : !requests?.length ? (
          <Card className="rounded-2xl border-border/50">
            <CardContent className="py-20 text-center">
              <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mx-auto mb-4">
                <Users className="h-8 w-8 text-muted-foreground/40" />
              </div>
              <p className="font-semibold text-lg mb-1">No requests found</p>
              <p className="text-sm text-muted-foreground">
                {statusFilter !== "all" ? "Try changing the filter or search" : "Access requests will appear here when users submit the unlock form"}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-3">
            {requests.map((r: any) => {
              const cfg = statusConfig[r.status] || statusConfig.pending;
              const StatusIcon = cfg.icon;
              const projectName = r.off_market_listings?.linked_project_name || "Unknown Project";

              return (
                <Card
                  key={r.id}
                  className={`rounded-2xl border-border/50 transition-all ${
                    selected.has(r.id) ? "border-primary/40 bg-primary/5" : "hover:border-border"
                  }`}
                >
                  <CardContent className="p-4 sm:p-5">
                    <div className="flex items-start gap-4">
                      {/* Checkbox or status icon */}
                      <div className="flex-shrink-0 pt-0.5">
                        {r.status === "pending" ? (
                          <Checkbox
                            checked={selected.has(r.id)}
                            onCheckedChange={() => toggleSelect(r.id)}
                            className="mt-1"
                          />
                        ) : (
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                            r.status === "approved" ? "bg-emerald-500/10" : "bg-destructive/10"
                          }`}>
                            <StatusIcon className={`h-4 w-4 ${r.status === "approved" ? "text-emerald-500" : "text-destructive"}`} />
                          </div>
                        )}
                      </div>

                      {/* Main content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <h3 className="font-bold text-sm">{r.first_name} {r.last_name}</h3>
                          <Badge className={`${cfg.color} text-[10px] rounded-md`}>
                            {cfg.label}
                          </Badge>
                          {r.has_agent && (
                            <Badge variant="outline" className="text-[10px] border-primary/30 text-primary">Has Agent</Badge>
                          )}
                        </div>

                        {/* Details grid */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-x-4 gap-y-1.5 mt-2">
                          <div className="flex items-center gap-1.5 text-xs text-muted-foreground min-w-0">
                            <Mail className="h-3 w-3 flex-shrink-0" />
                            <span className="truncate">{r.email}</span>
                          </div>
                          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                            <Phone className="h-3 w-3 flex-shrink-0" />
                            <span>{r.phone}</span>
                          </div>
                          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                            <Building2 className="h-3 w-3 flex-shrink-0" />
                            <span className="truncate font-medium text-foreground">{projectName}</span>
                          </div>
                          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                            <Clock className="h-3 w-3 flex-shrink-0" />
                            <span>{formatDistanceToNow(new Date(r.created_at), { addSuffix: true })}</span>
                          </div>
                        </div>

                        {/* Extra info row */}
                        {(r.budget_range || r.timeline || r.message) && (
                          <div className="flex items-center gap-3 mt-2 flex-wrap">
                            {r.budget_range && (
                              <span className="inline-flex items-center gap-1 text-xs bg-muted rounded-md px-2 py-0.5">
                                <DollarSign className="h-3 w-3" /> {r.budget_range}
                              </span>
                            )}
                            {r.timeline && (
                              <span className="inline-flex items-center gap-1 text-xs bg-muted rounded-md px-2 py-0.5">
                                <Calendar className="h-3 w-3" /> {r.timeline}
                              </span>
                            )}
                            {r.message && (
                              <span className="text-xs text-muted-foreground italic truncate max-w-[300px]">
                                "{r.message}"
                              </span>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Actions */}
                      {r.status === "pending" && (
                        <div className="flex items-center gap-1.5 flex-shrink-0">
                          <Button
                            size="sm"
                            className="rounded-xl gap-1 h-8 px-3 text-xs font-semibold"
                            onClick={() => handleAction(r.id, "approved")}
                          >
                            <Check className="h-3.5 w-3.5" /> Approve
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="outline" size="sm" className="rounded-xl gap-1 h-8 px-3 text-xs text-destructive hover:text-destructive">
                                <X className="h-3.5 w-3.5" /> Deny
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Deny access request?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  This will deny access for {r.first_name} {r.last_name} to {projectName}. They will not be notified automatically.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction onClick={() => handleAction(r.id, "denied")} className="bg-destructive text-destructive-foreground">Deny Access</AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      )}

                      {r.status !== "pending" && (
                        <span className="text-[11px] text-muted-foreground flex-shrink-0">
                          {format(new Date(r.created_at), "MMM d, yyyy")}
                        </span>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
