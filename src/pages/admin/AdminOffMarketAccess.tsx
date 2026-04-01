import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger
} from "@/components/ui/alert-dialog";
import { Check, X, ArrowLeft, Search } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { Link } from "react-router-dom";

const statusBadge: Record<string, string> = {
  pending: "bg-yellow-500/10 text-yellow-500",
  approved: "bg-green-500/10 text-green-500",
  denied: "bg-red-500/10 text-red-400",
};

export default function AdminOffMarketAccess() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const { data: requests, isLoading } = useQuery({
    queryKey: ["off-market-access", statusFilter, search],
    queryFn: async () => {
      let q = supabase.from("off_market_access").select("*, off_market_listings(linked_project_name)").order("created_at", { ascending: false });
      if (statusFilter !== "all") q = q.eq("status", statusFilter);
      if (search) q = q.or(`first_name.ilike.%${search}%,last_name.ilike.%${search}%,email.ilike.%${search}%`);
      const { data, error } = await q.limit(100);
      if (error) throw error;
      return data || [];
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
    toast.success(action === "approved" ? "Access approved" : "Access denied");
    queryClient.invalidateQueries({ queryKey: ["off-market-access"] });
    queryClient.invalidateQueries({ queryKey: ["off-market-stats"] });
  };

  const handleBulkApprove = async () => {
    const ids = Array.from(selected);
    if (!ids.length) return;
    const updates = { status: "approved", approved_at: new Date().toISOString(), approved_by: user?.email || "admin" };
    const { error } = await supabase.from("off_market_access").update(updates).in("id", ids);
    if (error) { toast.error("Bulk approve failed"); return; }
    toast.success(`${ids.length} requests approved`);
    setSelected(new Set());
    queryClient.invalidateQueries({ queryKey: ["off-market-access"] });
  };

  const toggleSelect = (id: string) => {
    setSelected(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  return (
    <AdminLayout>
      <div className="px-6 md:px-10 py-8 max-w-7xl mx-auto">
        <div className="flex items-center gap-3 mb-8">
          <Link to="/admin/off-market">
            <Button variant="ghost" size="sm" className="rounded-xl gap-1.5">
              <ArrowLeft className="h-4 w-4" /> Back
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold">Access Requests</h1>
            <p className="text-muted-foreground text-sm">Manage off-market inventory unlock requests</p>
          </div>
        </div>

        <div className="flex flex-wrap gap-3 mb-5 items-center">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search by name or email..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9 rounded-xl" />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[140px] rounded-xl"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="approved">Approved</SelectItem>
              <SelectItem value="denied">Denied</SelectItem>
            </SelectContent>
          </Select>
          {selected.size > 0 && (
            <Button onClick={handleBulkApprove} className="rounded-xl gap-1.5 shadow-gold font-bold">
              <Check className="h-4 w-4" /> Approve Selected ({selected.size})
            </Button>
          )}
        </div>

        <Card className="rounded-2xl border-border/50 overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-10"></TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Project</TableHead>
                <TableHead>Budget</TableHead>
                <TableHead>Timeline</TableHead>
                <TableHead>Agent</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Submitted</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    {Array.from({ length: 11 }).map((_, j) => (
                      <TableCell key={j}><Skeleton className="h-5 w-full" /></TableCell>
                    ))}
                  </TableRow>
                ))
              ) : !requests?.length ? (
                <TableRow>
                  <TableCell colSpan={11} className="text-center py-16 text-muted-foreground">
                    No access requests yet
                  </TableCell>
                </TableRow>
              ) : (
                requests.map((r: any) => (
                  <TableRow key={r.id}>
                    <TableCell>
                      {r.status === "pending" && (
                        <Checkbox checked={selected.has(r.id)} onCheckedChange={() => toggleSelect(r.id)} />
                      )}
                    </TableCell>
                    <TableCell className="font-medium">{r.first_name} {r.last_name}</TableCell>
                    <TableCell className="text-muted-foreground text-sm">{r.email}</TableCell>
                    <TableCell className="text-muted-foreground text-sm">{r.phone}</TableCell>
                    <TableCell className="text-sm">{r.off_market_listings?.linked_project_name || "—"}</TableCell>
                    <TableCell className="text-sm">{r.budget_range || "—"}</TableCell>
                    <TableCell className="text-sm">{r.timeline || "—"}</TableCell>
                    <TableCell className="text-sm">{r.has_agent ? "Yes" : "No"}</TableCell>
                    <TableCell>
                      <Badge className={`${statusBadge[r.status]} border-0 text-xs rounded-lg capitalize`}>{r.status}</Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {format(new Date(r.created_at), "MMM d, yyyy")}
                    </TableCell>
                    <TableCell className="text-right">
                      {r.status === "pending" && (
                        <div className="flex items-center justify-end gap-1">
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-green-500 hover:text-green-400" onClick={() => handleAction(r.id, "approved")}>
                            <Check className="h-4 w-4" />
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-red-500 hover:text-red-400">
                                <X className="h-4 w-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Deny access request?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  This will deny access for {r.first_name} {r.last_name}. They will not be notified automatically.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction onClick={() => handleAction(r.id, "denied")} className="bg-destructive text-destructive-foreground">Deny</AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </Card>
      </div>
    </AdminLayout>
  );
}
