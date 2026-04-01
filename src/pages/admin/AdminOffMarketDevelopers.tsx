import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from "@/components/ui/table";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Search, CheckCircle2, XCircle, Clock, Building2, Loader2, Globe } from "lucide-react";
import { toast } from "sonner";

export default function AdminOffMarketDevelopers() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [tab, setTab] = useState("pending");
  const [confirmAction, setConfirmAction] = useState<{ id: string; action: "approve" | "reject"; name: string } | null>(null);
  const [processing, setProcessing] = useState(false);

  const { data: developers, isLoading } = useQuery({
    queryKey: ["admin-developer-profiles", tab, search],
    queryFn: async () => {
      let q = supabase
        .from("developer_profiles")
        .select("*")
        .order("created_at", { ascending: false });

      if (tab === "pending") q = q.eq("verification_status", "pending");
      else if (tab === "verified") q = q.eq("verification_status", "approved");
      else q = q.eq("verification_status", "rejected");

      if (search) q = q.ilike("company_name", `%${search}%`);

      const { data } = await q.limit(100);
      return data || [];
    },
  });

  const handleAction = async () => {
    if (!confirmAction) return;
    setProcessing(true);
    try {
      const updates: any = {
        verification_status: confirmAction.action === "approve" ? "approved" : "rejected",
      };
      if (confirmAction.action === "approve") {
        updates.verified_at = new Date().toISOString();
      }

      const { error } = await supabase
        .from("developer_profiles")
        .update(updates)
        .eq("id", confirmAction.id);
      if (error) throw error;

      toast.success(
        confirmAction.action === "approve"
          ? `${confirmAction.name} has been verified!`
          : `${confirmAction.name} has been rejected.`
      );
      queryClient.invalidateQueries({ queryKey: ["admin-developer-profiles"] });
    } catch (e: any) {
      toast.error(e.message || "Action failed");
    } finally {
      setProcessing(false);
      setConfirmAction(null);
    }
  };

  return (
    <AdminLayout>
      <div className="px-6 md:px-10 py-8 max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold">Developer Accounts</h1>
            <p className="text-sm text-muted-foreground">Manage developer portal access</p>
          </div>
        </div>

        <Tabs value={tab} onValueChange={setTab} className="space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <TabsList className="rounded-xl">
              <TabsTrigger value="pending" className="rounded-lg gap-1.5">
                <Clock className="h-3.5 w-3.5" /> Pending
              </TabsTrigger>
              <TabsTrigger value="verified" className="rounded-lg gap-1.5">
                <CheckCircle2 className="h-3.5 w-3.5" /> Verified
              </TabsTrigger>
              <TabsTrigger value="rejected" className="rounded-lg gap-1.5">
                <XCircle className="h-3.5 w-3.5" /> Rejected
              </TabsTrigger>
            </TabsList>

            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search company..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 rounded-xl"
              />
            </div>
          </div>

          <Card className="rounded-2xl border-border/50">
            <CardContent className="p-0">
              {isLoading ? (
                <div className="flex items-center justify-center py-16">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                </div>
              ) : !developers?.length ? (
                <div className="py-16 text-center text-muted-foreground">
                  <Building2 className="h-10 w-10 mx-auto mb-3 text-muted-foreground/40" />
                  <p>No {tab} developers found</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Company</TableHead>
                      <TableHead>Contact</TableHead>
                      <TableHead>Phone</TableHead>
                      <TableHead>Website</TableHead>
                      <TableHead>Date</TableHead>
                      {tab === "pending" && <TableHead className="text-right">Actions</TableHead>}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {developers.map((dev) => (
                      <TableRow key={dev.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            {dev.logo_url ? (
                              <img src={dev.logo_url} alt="" className="w-8 h-8 rounded-lg object-cover" />
                            ) : (
                              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                                <Building2 className="h-4 w-4 text-primary" />
                              </div>
                            )}
                            <span className="font-medium">{dev.company_name}</span>
                          </div>
                        </TableCell>
                        <TableCell>{dev.contact_name}</TableCell>
                        <TableCell className="text-muted-foreground">{dev.phone || "—"}</TableCell>
                        <TableCell>
                          {dev.website_url ? (
                            <a href={dev.website_url} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline flex items-center gap-1 text-sm">
                              <Globe className="h-3 w-3" /> Visit
                            </a>
                          ) : "—"}
                        </TableCell>
                        <TableCell className="text-muted-foreground text-sm">
                          {new Date(dev.created_at).toLocaleDateString()}
                        </TableCell>
                        {tab === "pending" && (
                          <TableCell className="text-right space-x-2">
                            <Button
                              size="sm"
                              className="rounded-lg bg-green-600 hover:bg-green-700 text-white text-xs"
                              onClick={() => setConfirmAction({ id: dev.id, action: "approve", name: dev.company_name })}
                            >
                              Verify
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="rounded-lg text-destructive border-destructive/30 hover:bg-destructive/10 text-xs"
                              onClick={() => setConfirmAction({ id: dev.id, action: "reject", name: dev.company_name })}
                            >
                              Reject
                            </Button>
                          </TableCell>
                        )}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </Tabs>
      </div>

      <AlertDialog open={!!confirmAction} onOpenChange={() => setConfirmAction(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {confirmAction?.action === "approve" ? "Verify Developer" : "Reject Developer"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {confirmAction?.action === "approve"
                ? `This will give ${confirmAction.name} full access to the Developer Portal.`
                : `This will deny ${confirmAction?.name} access to the Developer Portal.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleAction}
              disabled={processing}
              className={confirmAction?.action === "approve" ? "bg-green-600 hover:bg-green-700" : "bg-destructive hover:bg-destructive/90"}
            >
              {processing && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              {confirmAction?.action === "approve" ? "Verify" : "Reject"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminLayout>
  );
}
