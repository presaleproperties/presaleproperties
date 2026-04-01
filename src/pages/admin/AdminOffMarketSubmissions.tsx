import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { CheckCircle2, XCircle, Eye, Package, Loader2, Send, Building2, MessageSquare } from "lucide-react";
import { toast } from "sonner";
import { Link } from "react-router-dom";

export default function AdminOffMarketSubmissions() {
  const queryClient = useQueryClient();
  const [processing, setProcessing] = useState(false);
  const [feedbackDialog, setFeedbackDialog] = useState<{ id: string; name: string } | null>(null);
  const [feedback, setFeedback] = useState("");
  const [rejectConfirm, setRejectConfirm] = useState<{ id: string; name: string } | null>(null);

  const { data: submissions, isLoading } = useQuery({
    queryKey: ["admin-off-market-submissions"],
    queryFn: async () => {
      const { data } = await supabase
        .from("off_market_listings")
        .select("*")
        .eq("status", "pending_review")
        .order("updated_at", { ascending: false });

      // Get unit counts
      const listings = data || [];
      const enriched = await Promise.all(
        listings.map(async (l) => {
          const { count } = await supabase
            .from("off_market_units")
            .select("*", { count: "exact", head: true })
            .eq("listing_id", l.id);
          return { ...l, unitCount: count || 0 };
        })
      );
      return enriched;
    },
  });

  const approveAndPublish = async (id: string, name: string) => {
    setProcessing(true);
    try {
      const { error } = await supabase
        .from("off_market_listings")
        .update({
          status: "published",
          published_at: new Date().toISOString(),
          access_level: "teaser",
        })
        .eq("id", id);
      if (error) throw error;
      toast.success(`${name} has been approved and published!`);
      queryClient.invalidateQueries({ queryKey: ["admin-off-market-submissions"] });
    } catch (e: any) {
      toast.error(e.message || "Failed to approve");
    } finally {
      setProcessing(false);
    }
  };

  const requestChanges = async () => {
    if (!feedbackDialog) return;
    setProcessing(true);
    try {
      const { error } = await supabase
        .from("off_market_listings")
        .update({
          status: "draft",
          additional_notes: feedback ? `[Admin Feedback] ${feedback}\n\n` : null,
        })
        .eq("id", feedbackDialog.id);
      if (error) throw error;
      toast.success(`${feedbackDialog.name} has been sent back to draft with feedback.`);
      queryClient.invalidateQueries({ queryKey: ["admin-off-market-submissions"] });
      setFeedbackDialog(null);
      setFeedback("");
    } catch (e: any) {
      toast.error(e.message || "Failed");
    } finally {
      setProcessing(false);
    }
  };

  const rejectSubmission = async () => {
    if (!rejectConfirm) return;
    setProcessing(true);
    try {
      const { error } = await supabase
        .from("off_market_listings")
        .update({ status: "archived" })
        .eq("id", rejectConfirm.id);
      if (error) throw error;
      toast.success(`${rejectConfirm.name} has been rejected and archived.`);
      queryClient.invalidateQueries({ queryKey: ["admin-off-market-submissions"] });
      setRejectConfirm(null);
    } catch (e: any) {
      toast.error(e.message || "Failed");
    } finally {
      setProcessing(false);
    }
  };

  return (
    <AdminLayout>
      <div className="px-6 md:px-10 py-8 max-w-6xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold">Developer Submissions</h1>
          <p className="text-sm text-muted-foreground">Review off-market inventory submitted by developers</p>
        </div>

        <Card className="rounded-2xl border-border/50">
          <CardContent className="p-0">
            {isLoading ? (
              <div className="flex items-center justify-center py-16">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            ) : !submissions?.length ? (
              <div className="py-16 text-center text-muted-foreground">
                <Package className="h-10 w-10 mx-auto mb-3 text-muted-foreground/40" />
                <p className="font-medium">No pending submissions</p>
                <p className="text-sm">Developer submissions will appear here for review</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Project</TableHead>
                    <TableHead>Developer</TableHead>
                    <TableHead>Units</TableHead>
                    <TableHead>Submitted</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {submissions.map((s) => (
                    <TableRow key={s.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                            <Building2 className="h-4 w-4 text-primary" />
                          </div>
                          <div>
                            <p className="font-medium">{s.linked_project_name}</p>
                            <p className="text-xs text-muted-foreground">{s.linked_project_slug}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{s.developer_name || "—"}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="rounded-lg">{s.unitCount} units</Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {new Date(s.updated_at || s.created_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Link to={`/admin/off-market/edit/${s.id}`}>
                            <Button variant="ghost" size="sm" className="rounded-lg text-xs gap-1">
                              <Eye className="h-3 w-3" /> View
                            </Button>
                          </Link>
                          <Button
                            size="sm"
                            className="rounded-lg bg-green-600 hover:bg-green-700 text-white text-xs gap-1"
                            onClick={() => approveAndPublish(s.id, s.linked_project_name)}
                            disabled={processing}
                          >
                            <CheckCircle2 className="h-3 w-3" /> Approve
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="rounded-lg text-xs gap-1"
                            onClick={() => setFeedbackDialog({ id: s.id, name: s.linked_project_name })}
                          >
                            <MessageSquare className="h-3 w-3" /> Changes
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="rounded-lg text-destructive border-destructive/30 hover:bg-destructive/10 text-xs gap-1"
                            onClick={() => setRejectConfirm({ id: s.id, name: s.linked_project_name })}
                          >
                            <XCircle className="h-3 w-3" /> Reject
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Request Changes Dialog */}
      <Dialog open={!!feedbackDialog} onOpenChange={() => { setFeedbackDialog(null); setFeedback(""); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Request Changes — {feedbackDialog?.name}</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            This will set the listing back to "Draft" so the developer can make edits and resubmit.
          </p>
          <Textarea
            placeholder="What changes are needed? (optional)"
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            rows={4}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => { setFeedbackDialog(null); setFeedback(""); }}>Cancel</Button>
            <Button onClick={requestChanges} disabled={processing} className="gap-1.5">
              {processing && <Loader2 className="h-4 w-4 animate-spin" />}
              <Send className="h-4 w-4" /> Send Back
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject Confirm */}
      <AlertDialog open={!!rejectConfirm} onOpenChange={() => setRejectConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reject Submission</AlertDialogTitle>
            <AlertDialogDescription>
              This will archive {rejectConfirm?.name}. The developer will not be able to resubmit this listing.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={rejectSubmission} disabled={processing} className="bg-destructive hover:bg-destructive/90">
              {processing && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Reject
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminLayout>
  );
}
