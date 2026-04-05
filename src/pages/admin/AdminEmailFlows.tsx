import { useState } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Loader2, Mail, Search, Zap, Plus, FileText, UserCheck, Eye } from "lucide-react";
import { FlowTimeline } from "@/components/admin/automation/FlowTimeline";
import { useAutomationFlows, getTriggerLabel } from "@/hooks/useAutomationFlows";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format } from "date-fns";
import { buildAutoResponseWithDocs, buildAutoResponseNoDocs } from "@/lib/auto-response-emails";
import { useEffect } from "react";

interface AutoEmailLog {
  id: string;
  email_to: string;
  recipient_name: string | null;
  subject: string;
  status: string;
  template_type: string | null;
  sent_at: string;
  open_count: number;
  last_opened_at: string | null;
}

const TRIGGER_OPTIONS = [
  { value: "project_inquiry", label: "Project Inquiry" },
  { value: "deck_gate", label: "Pitch Deck Lead Gate" },
  { value: "contact_form", label: "Contact Form" },
  { value: "exit_intent", label: "Exit Intent Popup" },
  { value: "calculator", label: "Calculator Lead" },
  { value: "booking", label: "Booking Request" },
];

export default function AdminEmailFlows() {
  const {
    flows, loading: flowsLoading, addStep, updateStep, deleteStep,
    reorderSteps, publishFlow, toggleFlowActive, createFlow, deleteFlow,
  } = useAutomationFlows();

  const [autoEnabled, setAutoEnabled] = useState(false);
  const [toggling, setToggling] = useState(false);
  const [logs, setLogs] = useState<AutoEmailLog[]>([]);
  const [logsLoading, setLogsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showNewFlow, setShowNewFlow] = useState(false);
  const [newFlowName, setNewFlowName] = useState("");
  const [newFlowTrigger, setNewFlowTrigger] = useState("project_inquiry");
  const [previewTemplate, setPreviewTemplate] = useState<"docs" | "no_docs" | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLogsLoading(true);
    const [settingRes, logsRes] = await Promise.all([
      supabase.from("app_settings").select("value").eq("key", "auto_response_enabled").maybeSingle(),
      (supabase as any).from("email_logs")
        .select("id, email_to, recipient_name, subject, status, template_type, sent_at, open_count, last_opened_at")
        .or("template_type.eq.auto_project_details_docs,template_type.eq.auto_agent_followup")
        .order("sent_at", { ascending: false })
        .limit(200),
    ]);
    setAutoEnabled(settingRes.data?.value === true || settingRes.data?.value === "true");
    setLogs(logsRes.data || []);
    setLogsLoading(false);
  }

  async function toggleEnabled(val: boolean) {
    setToggling(true);
    const { error } = await (supabase as any)
      .from("app_settings")
      .upsert({ key: "auto_response_enabled", value: val }, { onConflict: "key" });
    if (error) toast.error("Failed to update setting");
    else {
      setAutoEnabled(val);
      toast.success(val ? "Auto-response emails enabled" : "Auto-response emails disabled");
    }
    setToggling(false);
  }

  const handleCreateFlow = async () => {
    if (!newFlowName.trim()) return;
    await createFlow(newFlowName.trim(), newFlowTrigger);
    setShowNewFlow(false);
    setNewFlowName("");
  };

  const filtered = logs.filter(l =>
    !search ||
    l.email_to.toLowerCase().includes(search.toLowerCase()) ||
    (l.recipient_name || "").toLowerCase().includes(search.toLowerCase()) ||
    l.subject.toLowerCase().includes(search.toLowerCase())
  );

  const sentCount = logs.filter(l => l.status === "sent").length;
  const failedCount = logs.filter(l => l.status === "failed").length;
  const openedCount = logs.filter(l => l.open_count > 0).length;

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
      <div className="p-4 md:p-6 max-w-5xl space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Automation Flows</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Build automated sequences triggered by lead actions
            </p>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-muted-foreground">Auto-Response</span>
            <Switch checked={autoEnabled} onCheckedChange={toggleEnabled} disabled={toggling} />
            <Badge variant={autoEnabled ? "default" : "secondary"}>
              {autoEnabled ? "Active" : "Disabled"}
            </Badge>
          </div>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-3 gap-4">
          <Card>
            <CardContent className="pt-4 pb-3 px-4">
              <div className="flex items-center gap-2 mb-1">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <span className="text-xs text-muted-foreground font-medium">Emails Sent</span>
              </div>
              <p className="text-2xl font-bold">{sentCount}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 pb-3 px-4">
              <div className="flex items-center gap-2 mb-1">
                <Eye className="h-4 w-4 text-muted-foreground" />
                <span className="text-xs text-muted-foreground font-medium">Opened</span>
              </div>
              <p className="text-2xl font-bold">{openedCount}</p>
              {sentCount > 0 && (
                <p className="text-xs text-muted-foreground">{Math.round((openedCount / sentCount) * 100)}% open rate</p>
              )}
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

        {/* Template previews */}
        <div className="grid md:grid-cols-2 gap-4">
          <Card className="cursor-pointer hover:border-primary/50 transition-colors" onClick={() => setPreviewTemplate("docs")}>
            <CardContent className="pt-4 pb-3 px-4">
              <div className="flex items-center gap-2 mb-1">
                <FileText className="h-4 w-4 text-primary" />
                <span className="text-sm font-semibold">Template A</span>
              </div>
              <p className="text-xs text-muted-foreground">Standard auto-response with Chat Now + Call Now</p>
            </CardContent>
          </Card>
          <Card className="cursor-pointer hover:border-primary/50 transition-colors" onClick={() => setPreviewTemplate("no_docs")}>
            <CardContent className="pt-4 pb-3 px-4">
              <div className="flex items-center gap-2 mb-1">
                <UserCheck className="h-4 w-4 text-primary" />
                <span className="text-sm font-semibold">Template B</span>
              </div>
              <p className="text-xs text-muted-foreground">Agent follow-up for realtors / restricted projects</p>
            </CardContent>
          </Card>
        </div>

        {/* Flows section */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold">Flows</h2>
            <Button size="sm" className="gap-1.5" onClick={() => setShowNewFlow(true)}>
              <Plus className="h-3.5 w-3.5" /> New Flow
            </Button>
          </div>

          {flowsLoading ? (
            <div className="flex justify-center py-16">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : flows.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground">
              <Zap className="h-10 w-10 mx-auto mb-3 opacity-30" />
              <p className="text-sm">No automation flows yet</p>
              <p className="text-xs mt-1">Create your first flow to automate lead follow-ups</p>
            </div>
          ) : (
            <div className="space-y-6">
              {flows.map((flow) => (
                <FlowTimeline
                  key={flow.id}
                  flow={flow}
                  onAddStep={addStep}
                  onUpdateStep={updateStep}
                  onDeleteStep={deleteStep}
                  onReorder={reorderSteps}
                  onPublish={publishFlow}
                  onToggleActive={toggleFlowActive}
                  onDeleteFlow={deleteFlow}
                />
              ))}
            </div>
          )}
        </div>

        {/* Spacer for white space */}
        <div className="h-8" />

        {/* Email history */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-bold">Email History</h2>
            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="pl-9 h-9 text-sm"
              />
            </div>
          </div>
          <Card>
            <CardContent className="p-0">
              {logsLoading ? (
                <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
              ) : filtered.length === 0 ? (
                <p className="text-center py-8 text-sm text-muted-foreground">
                  {logs.length === 0 ? "No emails sent yet" : "No results"}
                </p>
              ) : (
                <div className="overflow-auto max-h-[400px]">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-xs">Recipient</TableHead>
                        <TableHead className="text-xs">Subject</TableHead>
                        <TableHead className="text-xs">Template</TableHead>
                        <TableHead className="text-xs">Opens</TableHead>
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
                              {log.template_type === "auto_project_details_docs" ? "Template A" : "Template B"}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <span className={log.open_count > 0 ? "text-sm font-semibold text-primary" : "text-sm text-muted-foreground"}>
                              {log.open_count}
                            </span>
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

        {/* Bottom whitespace */}
        <div className="h-32" />
      </div>

      {/* New Flow Dialog */}
      <Dialog open={showNewFlow} onOpenChange={setShowNewFlow}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Create New Flow</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <label className="text-sm font-medium mb-1 block">Flow Name</label>
              <Input
                value={newFlowName}
                onChange={(e) => setNewFlowName(e.target.value)}
                placeholder="e.g. Project Inquiry Follow-Up"
                autoFocus
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Trigger</label>
              <Select value={newFlowTrigger} onValueChange={setNewFlowTrigger}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {TRIGGER_OPTIONS.map((t) => (
                    <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNewFlow(false)}>Cancel</Button>
            <Button onClick={handleCreateFlow} disabled={!newFlowName.trim()}>Create</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Template Preview Dialog */}
      <Dialog open={!!previewTemplate} onOpenChange={() => setPreviewTemplate(null)}>
        <DialogContent className="max-w-3xl max-h-[90vh] flex flex-col p-0 gap-0">
          <DialogHeader className="px-6 py-4 border-b shrink-0">
            <DialogTitle className="text-sm font-semibold">
              {previewTemplate === "docs" ? "Template A: Standard Auto-Response" : "Template B: Agent Follow-Up"}
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
