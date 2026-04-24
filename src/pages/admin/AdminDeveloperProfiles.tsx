import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Building2, CheckCircle, XCircle, Eye, ExternalLink } from "lucide-react";

interface DeveloperProfile {
  id: string;
  user_id: string;
  company_name: string;
  contact_name: string;
  phone: string | null;
  website_url: string | null;
  verification_status: string;
  verification_notes: string | null;
  verified_at: string | null;
  created_at: string;
}

export default function AdminDeveloperProfiles() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedDeveloper, setSelectedDeveloper] = useState<DeveloperProfile | null>(null);
  const [notes, setNotes] = useState("");

  const { data: developers, isLoading } = useQuery({
    queryKey: ["admin-developer-profiles"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("developer_profiles")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as DeveloperProfile[];
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status, notes }: { id: string; status: string; notes: string }) => {
      const { error } = await supabase
        .from("developer_profiles")
        .update({
          verification_status: status,
          verification_notes: notes || null,
          verified_at: status === "approved" ? new Date().toISOString() : null,
        })
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-developer-profiles"] });
      setSelectedDeveloper(null);
      setNotes("");
      toast({
        title: "Status updated",
        description: "Developer verification status has been updated.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update status",
        variant: "destructive",
      });
    },
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <Badge variant="outline" className="bg-warning-soft text-warning-strong border-warning/30">Pending</Badge>;
      case "approved":
        return <Badge variant="outline" className="bg-success-soft text-success-strong border-success/30">Approved</Badge>;
      case "rejected":
        return <Badge variant="outline" className="bg-danger-soft text-danger-strong border-danger/30">Rejected</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const pendingCount = developers?.filter(d => d.verification_status === "pending").length || 0;

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Developer Accounts</h1>
          <p className="text-muted-foreground">
            Review and approve developer account requests
          </p>
        </div>

        {pendingCount > 0 && (
          <Card className="border-warning/30 bg-warning-soft">
            <CardContent className="py-4">
              <div className="flex items-center gap-2">
                <Building2 className="h-5 w-5 text-warning" />
                <span className="font-medium text-warning-strong">
                  {pendingCount} developer{pendingCount !== 1 ? "s" : ""} pending review
                </span>
              </div>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle>All Developers</CardTitle>
            <CardDescription>
              {developers?.length || 0} developer accounts
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : developers?.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No developer accounts found
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Company</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead>Website</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Submitted</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {developers?.map((developer) => (
                    <TableRow key={developer.id}>
                      <TableCell className="font-medium">
                        {developer.company_name}
                      </TableCell>
                      <TableCell>
                        <div>{developer.contact_name}</div>
                        {developer.phone && (
                          <div className="text-sm text-muted-foreground">{developer.phone}</div>
                        )}
                      </TableCell>
                      <TableCell>
                        {developer.website_url ? (
                          <a
                            href={developer.website_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1 text-primary hover:underline text-sm"
                          >
                            Website <ExternalLink className="h-3 w-3" />
                          </a>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell>{getStatusBadge(developer.verification_status)}</TableCell>
                      <TableCell>
                        {new Date(developer.created_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSelectedDeveloper(developer);
                            setNotes(developer.verification_notes || "");
                          }}
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          Review
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Review Dialog */}
        <Dialog open={!!selectedDeveloper} onOpenChange={() => setSelectedDeveloper(null)}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Review Developer</DialogTitle>
              <DialogDescription>
                {selectedDeveloper?.company_name}
              </DialogDescription>
            </DialogHeader>

            {selectedDeveloper && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <div className="text-muted-foreground">Contact</div>
                    <div className="font-medium">{selectedDeveloper.contact_name}</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">Phone</div>
                    <div className="font-medium">{selectedDeveloper.phone || "-"}</div>
                  </div>
                  <div className="col-span-2">
                    <div className="text-muted-foreground">Website</div>
                    {selectedDeveloper.website_url ? (
                      <a
                        href={selectedDeveloper.website_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:underline"
                      >
                        {selectedDeveloper.website_url}
                      </a>
                    ) : (
                      <span>-</span>
                    )}
                  </div>
                  <div className="col-span-2">
                    <div className="text-muted-foreground">Current Status</div>
                    <div>{getStatusBadge(selectedDeveloper.verification_status)}</div>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Notes (optional)</label>
                  <Textarea
                    placeholder="Add notes about this decision..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                  />
                </div>

                <div className="flex gap-2">
                  <Button
                    className="flex-1"
                    onClick={() => updateStatusMutation.mutate({
                      id: selectedDeveloper.id,
                      status: "approved",
                      notes,
                    })}
                    disabled={updateStatusMutation.isPending}
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Approve
                  </Button>
                  <Button
                    variant="destructive"
                    className="flex-1"
                    onClick={() => updateStatusMutation.mutate({
                      id: selectedDeveloper.id,
                      status: "rejected",
                      notes,
                    })}
                    disabled={updateStatusMutation.isPending}
                  >
                    <XCircle className="h-4 w-4 mr-2" />
                    Reject
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
}
