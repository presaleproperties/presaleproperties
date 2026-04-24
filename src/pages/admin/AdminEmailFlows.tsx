import { useState, useEffect } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Loader2, Zap, Mail, Eye, FileText, UserCheck, Search, ChevronDown, ChevronRight } from "lucide-react";
import { FlowCanvas } from "@/components/admin/automation/FlowCanvas";
import { FlowSelector } from "@/components/admin/automation/FlowSelector";
import { useAutomationFlows } from "@/hooks/useAutomationFlows";
import { supabase } from "@/integrations/supabase/client";
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

  const [selectedFlowId, setSelectedFlowId] = useState<string | null>(null);
  const [autoEnabled, setAutoEnabled] = useState(false);
  const [toggling, setToggling] = useState(false);
  const [showNewFlow, setShowNewFlow] = useState(false);
  const [newFlowName, setNewFlowName] = useState("");
  const [newFlowTrigger, setNewFlowTrigger] = useState("project_inquiry");
  const [previewTemplate, setPreviewTemplate] = useState<"docs" | "no_docs" | null>(null);

  // Email history
  const [logs, setLogs] = useState<AutoEmailLog[]>([]);
  const [logsLoading, setLogsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [historyOpen, setHistoryOpen] = useState(false);

  useEffect(() => {
    if (flows.length > 0 && !selectedFlowId) {
      setSelectedFlowId(flows[0].id);
    }
  }, [flows, selectedFlowId]);

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
      toast.success(val ? "Auto-response enabled" : "Auto-response disabled");
    }
    setToggling(false);
  }

  const handleCreateFlow = async () => {
    if (!newFlowName.trim()) return;
    await createFlow(newFlowName.trim(), newFlowTrigger);
    setShowNewFlow(false);
    setNewFlowName("");
    setTimeout(() => {
      if (flows.length > 0) setSelectedFlowId(flows[flows.length - 1]?.id || null);
    }, 500);
  };

  const handleDeleteFlow = (flowId: string) => {
    deleteFlow(flowId);
    if (selectedFlowId === flowId) {
      const remaining = flows.filter((f) => f.id !== flowId);
      setSelectedFlowId(remaining[0]?.id || null);
    }
  };

  const selectedFlow = flows.find((f) => f.id === selectedFlowId);

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
      <div className="flex flex-col h-[calc(100vh-64px)]">
        {/* Top header bar */}
        <div className="flex items-center justify-between px-5 py-3 border-b bg-card">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <Zap className="h-4 w-4 text-primary" />
            </div>
            <div>
              <h1 className="text-base font-bold leading-tight">Automation Flows</h1>
              <p className="text-xs text-muted-foreground">Visual workflow builder</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {/* Stats pills */}
            <div className="hidden md:flex items-center gap-3 mr-4">
              <div className="flex items-center gap-1.5 text-xs">
                <Mail className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="font-semibold">{sentCount}</span>
                <span className="text-muted-foreground">sent</span>
              </div>
              <div className="flex items-center gap-1.5 text-xs">
                <Eye className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="font-semibold">{openedCount}</span>
                <span className="text-muted-foreground">opened</span>
                {sentCount > 0 && (
                  <span className="text-muted-foreground">({Math.round((openedCount / sentCount) * 100)}%)</span>
                )}
              </div>
              {failedCount > 0 && (
                <div className="flex items-center gap-1.5 text-xs">
                  <span className="font-semibold text-destructive">{failedCount}</span>
                  <span className="text-destructive">failed</span>
                </div>
              )}
            </div>

            {/* Template previews */}
            <div className="hidden lg:flex items-center gap-1.5 mr-3">
              <Button variant="outline" size="sm" className="h-7 text-xs gap-1.5" onClick={() => setPreviewTemplate("docs")}>
                <FileText className="h-3 w-3" /> Template A
              </Button>
              <Button variant="outline" size="sm" className="h-7 text-xs gap-1.5" onClick={() => setPreviewTemplate("no_docs")}>
                <UserCheck className="h-3 w-3" /> Template B
              </Button>
            </div>

            {/* Auto-response toggle */}
            <span className="text-xs text-muted-foreground">Auto-Response</span>
            <Switch checked={autoEnabled} onCheckedChange={toggleEnabled} disabled={toggling} className="scale-90" />
            <Badge variant={autoEnabled ? "default" : "secondary"} className="text-xs">
              {autoEnabled ? "Active" : "Off"}
            </Badge>
          </div>
        </div>

        {/* Flow selector tabs */}
        {flowsLoading ? (
          <div className="flex-1 flex items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : flows.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground"
            style={{
              backgroundImage: "radial-gradient(circle, hsl(var(--border)) 1px, transparent 1px)",
              backgroundSize: "20px 20px",
            }}
          >
            <Zap className="h-12 w-12 mb-4 opacity-20" />
            <p className="text-sm font-medium">No flows yet</p>
            <p className="text-xs mt-1 mb-4">Create your first automation flow</p>
            <Button size="sm" onClick={() => setShowNewFlow(true)}>Create Flow</Button>
          </div>
        ) : (
          <>
            <FlowSelector
              flows={flows}
              selectedId={selectedFlowId}
              onSelect={setSelectedFlowId}
              onNew={() => setShowNewFlow(true)}
              onPublish={publishFlow}
              onToggleActive={toggleFlowActive}
              onDeleteFlow={handleDeleteFlow}
            />

            {selectedFlow ? (
              <FlowCanvas
                flow={selectedFlow}
                onAddStep={addStep}
                onUpdateStep={updateStep}
                onDeleteStep={deleteStep}
                onReorder={reorderSteps}
              />
            ) : (
              <div className="flex-1 flex items-center justify-center text-sm text-muted-foreground">
                Select a flow to edit
              </div>
            )}
          </>
        )}

        {/* Email History collapsible footer */}
        <div className="border-t bg-card shrink-0">
          <button
            onClick={() => setHistoryOpen(!historyOpen)}
            className="w-full flex items-center justify-between px-5 py-2.5 hover:bg-muted/30 transition-colors"
          >
            <div className="flex items-center gap-2">
              {historyOpen ? <ChevronDown className="h-4 w-4 text-muted-foreground" /> : <ChevronRight className="h-4 w-4 text-muted-foreground" />}
              <span className="text-sm font-semibold">Email History</span>
              <Badge variant="secondary" className="text-[10px] h-4">{logs.length}</Badge>
            </div>
            {historyOpen && (
              <div className="relative w-48" onClick={(e) => e.stopPropagation()}>
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                <Input
                  placeholder="Search..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="pl-8 h-7 text-xs"
                />
              </div>
            )}
          </button>

          {historyOpen && (
            <div className="max-h-[250px] overflow-auto border-t">
              {logsLoading ? (
                <div className="flex justify-center py-6"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
              ) : filtered.length === 0 ? (
                <p className="text-center py-6 text-xs text-muted-foreground">
                  {logs.length === 0 ? "No emails sent yet" : "No results"}
                </p>
              ) : (
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
                        <TableCell className="text-xs py-2">
                          <div>{log.recipient_name || "—"}</div>
                          <div className="text-muted-foreground">{log.email_to}</div>
                        </TableCell>
                        <TableCell className="text-xs max-w-[180px] truncate py-2">{log.subject}</TableCell>
                        <TableCell className="py-2">
                          <Badge variant="outline" className="text-[10px]">
                            {log.template_type === "auto_project_details_docs" ? "A" : "B"}
                          </Badge>
                        </TableCell>
                        <TableCell className="py-2">
                          <span className={log.open_count > 0 ? "text-xs font-semibold text-primary" : "text-xs text-muted-foreground"}>
                            {log.open_count}
                          </span>
                        </TableCell>
                        <TableCell className="py-2">
                          <Badge variant={log.status === "sent" ? "default" : "destructive"} className="text-[10px]">
                            {log.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-[10px] text-muted-foreground py-2">
                          {format(new Date(log.sent_at), "MMM d, h:mm a")}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </div>
          )}
        </div>
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
              className="w-full bg-card rounded-md border shadow-sm"
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
