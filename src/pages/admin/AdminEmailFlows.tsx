import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Loader2, Mail, Search, Eye, Zap, FileText, UserCheck } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import { format } from "date-fns";
import { buildAutoResponseWithDocs, buildAutoResponseNoDocs } from "@/lib/auto-response-emails";

interface AutoEmailLog {
  id: string;
  email_to: string;
  recipient_name: string | null;
  subject: string;
  status: string;
  template_type: string | null;
  sent_at: string;
  error_message: string | null;
}

export default function AdminEmailFlows() {
  const [enabled, setEnabled] = useState(false);
  const [toggling, setToggling] = useState(false);
  const [logs, setLogs] = useState<AutoEmailLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [previewTemplate, setPreviewTemplate] = useState<"docs" | "no_docs" | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    const [settingRes, logsRes] = await Promise.all([
      supabase.from("app_settings").select("value").eq("key", "auto_response_enabled").maybeSingle(),
      (supabase as any).from("email_logs")
        .select("id, email_to, recipient_name, subject, status, template_type, sent_at, error_message")
        .or("template_type.eq.auto_project_details_docs,template_type.eq.auto_agent_followup")
        .order("sent_at", { ascending: false })
        .limit(200),
    ]);
    setEnabled(settingRes.data?.value === true || settingRes.data?.value === "true");
    setLogs(logsRes.data || []);
    setLoading(false);
  }

  async function toggleEnabled(val: boolean) {
    setToggling(true);
    const { error } = await (supabase as any)
      .from("app_settings")
      .upsert({ key: "auto_response_enabled", value: val }, { onConflict: "key" });
    if (error) {
      toast.error("Failed to update setting");
    } else {
      setEnabled(val);
      toast.success(val ? "Auto-response emails enabled" : "Auto-response emails disabled");
    }
    setToggling(false);
  }

  const filtered = logs.filter(l =>
    !search ||
    l.email_to.toLowerCase().includes(search.toLowerCase()) ||
    (l.recipient_name || "").toLowerCase().includes(search.toLowerCase()) ||
    l.subject.toLowerCase().includes(search.toLowerCase())
  );

  const sentCount = logs.filter(l => l.status === "sent").length;
  const failedCount = logs.filter(l => l.status === "failed").length;
  const docsCount = logs.filter(l => l.template_type === "auto_project_details_docs").length;
  const followupCount = logs.filter(l => l.template_type === "auto_agent_followup").length;

  const sampleProject = {
    projectName: "The Jericho",
    city: "Vancouver",
    developerName: "Anthem Properties",
    heroImage: "",
    startingPrice: "From $599,900",
    deposit: "10%",
    completion: "2027",
    projectUrl: "https://presaleproperties.com/projects/the-jericho",
    brochureUrl: "https://example.com/brochure.pdf",
    floorplanUrl: "https://example.com/floorplans.pdf",
  };

  return (
    <AdminLayout>
      <div className="p-4 md:p-6 space-y-6 max-w-6xl">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Email Flows</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Automated emails sent when leads request floor plans & pricing
            </p>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-muted-foreground">Auto-Response</span>
            <Switch
              checked={enabled}
              onCheckedChange={toggleEnabled}
              disabled={toggling}
            />
            <Badge variant={enabled ? "default" : "secondary"}>
              {enabled ? "Active" : "Disabled"}
            </Badge>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-4 pb-3 px-4">
              <div className="flex items-center gap-2 mb-1">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <span className="text-xs text-muted-foreground font-medium">Total Sent</span>
              </div>
              <p className="text-2xl font-bold">{sentCount}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 pb-3 px-4">
              <div className="flex items-center gap-2 mb-1">
                <FileText className="h-4 w-4 text-muted-foreground" />
                <span className="text-xs text-muted-foreground font-medium">With Documents</span>
              </div>
              <p className="text-2xl font-bold">{docsCount}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 pb-3 px-4">
              <div className="flex items-center gap-2 mb-1">
                <UserCheck className="h-4 w-4 text-muted-foreground" />
                <span className="text-xs text-muted-foreground font-medium">Agent Follow-Up</span>
              </div>
              <p className="text-2xl font-bold">{followupCount}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 pb-3 px-4">
              <div className="flex items-center gap-2 mb-1">
                <Zap className="h-4 w-4 text-destructive" />
                <span className="text-xs text-muted-foreground font-medium">Failed</span>
              </div>
              <p className="text-2xl font-bold text-destructive">{failedCount}</p>
            </CardContent>
          </Card>
        </div>

        {/* Template Previews */}
        <div className="grid md:grid-cols-2 gap-4">
          <Card className="cursor-pointer hover:border-primary/50 transition-colors" onClick={() => setPreviewTemplate("docs")}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <FileText className="h-4 w-4 text-primary" />
                Template A: Project Details + Documents
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground">
                Sent when the project has brochure or floor plan files available. Includes CTA buttons to view documents.
              </p>
              <Button variant="ghost" size="sm" className="mt-2 text-xs" onClick={(e) => { e.stopPropagation(); setPreviewTemplate("docs"); }}>
                <Eye className="h-3 w-3 mr-1" /> Preview
              </Button>
            </CardContent>
          </Card>
          <Card className="cursor-pointer hover:border-primary/50 transition-colors" onClick={() => setPreviewTemplate("no_docs")}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <UserCheck className="h-4 w-4 text-primary" />
                Template B: Agent Follow-Up
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground">
                Sent when no documents are publicly available. Notifies the lead that an agent will reach out personally.
              </p>
              <Button variant="ghost" size="sm" className="mt-2 text-xs" onClick={(e) => { e.stopPropagation(); setPreviewTemplate("no_docs"); }}>
                <Eye className="h-3 w-3 mr-1" /> Preview
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Logs */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Auto-Response History</CardTitle>
              <div className="relative w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by email, name, or subject..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="pl-9 h-9 text-sm"
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
            ) : filtered.length === 0 ? (
              <p className="text-center py-8 text-sm text-muted-foreground">
                {logs.length === 0 ? "No auto-response emails sent yet" : "No results matching your search"}
              </p>
            ) : (
              <div className="overflow-auto max-h-[400px]">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-xs">Recipient</TableHead>
                      <TableHead className="text-xs">Subject</TableHead>
                      <TableHead className="text-xs">Template</TableHead>
                      <TableHead className="text-xs">Status</TableHead>
                      <TableHead className="text-xs">Sent</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filtered.map(log => (
                      <TableRow key={log.id}>
                        <TableCell className="text-sm">
                          <div>{log.recipient_name || "—"}</div>
                          <div className="text-xs text-muted-foreground">{log.email_to}</div>
                        </TableCell>
                        <TableCell className="text-sm max-w-[200px] truncate">{log.subject}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-xs">
                            {log.template_type === "auto_project_details_docs" ? "With Docs" : "Follow-Up"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={log.status === "sent" ? "default" : "destructive"} className="text-xs">
                            {log.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {format(new Date(log.sent_at), "MMM d, h:mm a")}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Template Preview Dialog */}
      <Dialog open={!!previewTemplate} onOpenChange={() => setPreviewTemplate(null)}>
        <DialogContent className="max-w-3xl max-h-[90vh] flex flex-col p-0 gap-0">
          <DialogHeader className="px-6 py-4 border-b shrink-0">
            <DialogTitle className="text-sm font-semibold">
              {previewTemplate === "docs" ? "Template A: Project Details + Documents" : "Template B: Agent Follow-Up"}
            </DialogTitle>
          </DialogHeader>
          <div className="flex-1 overflow-auto bg-muted/30 p-4">
            <iframe
              srcDoc={
                previewTemplate === "docs"
                  ? buildAutoResponseWithDocs(sampleProject, "Sarah")
                  : buildAutoResponseNoDocs({ projectName: "The Jericho", city: "Vancouver", developerName: "Anthem Properties", startingPrice: "From $599,900", deposit: "10%", completion: "2027", projectUrl: "https://presaleproperties.com/projects/the-jericho" }, "Sarah")
              }
              title="Template Preview"
              className="w-full bg-white rounded-md border shadow-sm"
              style={{ maxWidth: 680, height: "65vh", margin: "0 auto", display: "block" }}
              sandbox="allow-same-origin"
            />
          </div>
          <div className="px-6 py-3 border-t flex justify-end">
            <Button variant="outline" onClick={() => setPreviewTemplate(null)}>Close</Button>
          </div>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
