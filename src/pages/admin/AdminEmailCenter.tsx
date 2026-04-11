import { useState, useEffect, useCallback } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  Send, Mail, Clock, CheckCircle2, XCircle, Plus, Trash2,
  RefreshCw, Loader2, Eye, Zap, BarChart3, Search,
  Workflow, MailOpen, TrendingUp,
} from "lucide-react";
import { format } from "date-fns";
import { useNavigate } from "react-router-dom";
import type { SavedAsset } from "@/lib/emailTemplateHelpers";
import { timeAgo } from "@/lib/emailTemplateHelpers";
import {
  TemplateCard,
  TemplatePreviewDialog,
  TemplateQuickSendDialog,
} from "@/components/admin/SharedTemplateComponents";

// ── Types ──
interface EmailLog {
  id: string;
  email_to: string;
  recipient_name: string | null;
  subject: string;
  status: string;
  sent_at: string;
  error_message: string | null;
  template_type: string | null;
  campaign_id: string | null;
  opened_at: string | null;
  open_count: number;
  last_opened_at: string | null;
  tracking_id: string | null;
  clicked_at: string | null;
  click_count: number;
  last_clicked_at: string | null;
  clicked_url: string | null;
}

interface AutomationWorkflow {
  id: string;
  name: string;
  description: string | null;
  trigger_event: string;
  is_active: boolean;
  audience_type: string;
}

// ── Helpers ──
function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { cls: string }> = {
    sent:   { cls: "bg-emerald-100 text-emerald-700 border-emerald-200" },
    failed: { cls: "bg-red-100 text-red-700 border-red-200" },
    queued: { cls: "bg-amber-100 text-amber-700 border-amber-200" },
  };
  const cfg = map[status] ?? { cls: "bg-muted text-muted-foreground" };
  return (
    <span className={cn("inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border", cfg.cls)}>
      {status}
    </span>
  );
}

// ── Quick Send Tab (uses shared template cards) ──
function QuickSendTab({
  campaigns, onSent, onRefreshCampaigns,
}: {
  campaigns: SavedAsset[];
  onSent: () => void;
  onRefreshCampaigns: () => void;
}) {
  const navigate = useNavigate();
  const [sendAsset, setSendAsset] = useState<SavedAsset | null>(null);
  const [previewAsset, setPreviewAsset] = useState<SavedAsset | null>(null);

  const handleDelete = async (id: string) => {
    const { error } = await (supabase as any).from("campaign_templates").delete().eq("id", id);
    if (!error) { toast.success("Template deleted"); onRefreshCampaigns(); } else { toast.error("Failed to delete"); }
  };

  const handleDuplicate = async (asset: SavedAsset) => {
    const { error } = await (supabase as any).from("campaign_templates").insert({
      name: `${asset.name} (Copy)`, project_name: asset.project_name, form_data: asset.form_data,
    });
    if (!error) { toast.success("Duplicated"); onRefreshCampaigns(); } else { toast.error("Failed to duplicate"); }
  };

  return (
    <>
      <div className="space-y-5">
        <div className="flex items-center gap-2">
          <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center text-[10px] font-bold text-primary">1</div>
          <span className="text-sm font-semibold">Choose a Template & Send</span>
        </div>

        {campaigns.length === 0 ? (
          <div className="border border-dashed border-border rounded-lg p-6 text-center space-y-2">
            <Mail className="h-8 w-8 text-muted-foreground mx-auto" />
            <p className="text-sm text-muted-foreground">No saved templates yet.</p>
            <Button size="sm" variant="outline" onClick={() => navigate("/admin/marketing-hub")}>
              <Plus className="h-3.5 w-3.5 mr-1.5" />Go to Marketing Hub
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {campaigns.map(c => (
              <TemplateCard
                key={c.id}
                asset={c}
                onSend={setSendAsset}
                onPreview={setPreviewAsset}
                onDelete={handleDelete}
                onDuplicate={handleDuplicate}
                deleting={null}
              />
            ))}
          </div>
        )}
      </div>

      <TemplateQuickSendDialog
        asset={sendAsset}
        open={!!sendAsset}
        onOpenChange={(v) => { if (!v) setSendAsset(null); }}
        onSent={() => { onSent(); setSendAsset(null); }}
      />

      <TemplatePreviewDialog
        asset={previewAsset}
        open={!!previewAsset}
        onOpenChange={(v) => { if (!v) setPreviewAsset(null); }}
      />
    </>
  );
}

// ── Dashboard Stats ──
function DashboardStats({ logs }: { logs: EmailLog[] }) {
  const total = logs.length;
  const sent = logs.filter(l => l.status === "sent").length;
  const failed = logs.filter(l => l.status === "failed").length;
  const opened = logs.filter(l => l.opened_at).length;
  const openRate = sent > 0 ? Math.round((opened / sent) * 100) : 0;
  const clicked = logs.filter(l => l.clicked_at).length;
  const clickRate = sent > 0 ? Math.round((clicked / sent) * 100) : 0;
  const reopened = logs.filter(l => l.open_count >= 2).length;

  const stats = [
    { label: "Total Sent", value: sent, icon: <Send className="h-4 w-4 text-emerald-500" />, color: "text-emerald-600" },
    { label: "Opened", value: opened, icon: <MailOpen className="h-4 w-4 text-blue-500" />, color: "text-blue-600" },
    { label: "Open Rate", value: `${openRate}%`, icon: <TrendingUp className="h-4 w-4 text-violet-500" />, color: "text-violet-600" },
    { label: "Clicked", value: `${clicked} (${clickRate}%)`, icon: <Zap className="h-4 w-4 text-orange-500" />, color: "text-orange-600" },
    { label: "Re-opened", value: reopened, icon: <RefreshCw className="h-4 w-4 text-amber-500" />, color: "text-amber-600" },
    { label: "Failed", value: failed, icon: <XCircle className="h-4 w-4 text-red-500" />, color: failed > 0 ? "text-red-600" : "text-muted-foreground" },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
      {stats.map(s => (
        <div key={s.label} className="bg-card border border-border rounded-lg px-4 py-3">
          <div className="flex items-center gap-2 mb-1">
            {s.icon}
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">{s.label}</p>
          </div>
          <p className={cn("text-2xl font-bold", s.color)}>{s.value}</p>
        </div>
      ))}
    </div>
  );
}

// ── Email Log with Open Tracking ──
function EmailLogTable({ logs, loading, onDelete }: { logs: EmailLog[]; loading: boolean; onDelete: (id: string) => void }) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [openFilter, setOpenFilter] = useState("all");
  const [deleting, setDeleting] = useState<string | null>(null);

  const handleDelete = async (id: string) => {
    setDeleting(id);
    const { error } = await supabase.from("email_logs").delete().eq("id", id);
    if (!error) { onDelete(id); toast.success("Email log deleted"); } else { toast.error("Failed to delete"); }
    setDeleting(null);
  };

  const filtered = logs.filter(l => {
    const matchSearch = !search || l.email_to.includes(search) || l.subject.toLowerCase().includes(search.toLowerCase()) || (l.recipient_name || "").toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "all" || l.status === statusFilter;
    const matchOpen = openFilter === "all"
      || (openFilter === "opened" && l.opened_at)
      || (openFilter === "unopened" && !l.opened_at && l.status === "sent")
      || (openFilter === "reopened" && l.open_count >= 2)
      || (openFilter === "clicked" && l.clicked_at);
    return matchSearch && matchStatus && matchOpen;
  });

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search by name, email or subject…" className="pl-8 h-8 text-sm" />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="h-8 w-28 text-xs"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="sent">Sent</SelectItem>
            <SelectItem value="failed">Failed</SelectItem>
          </SelectContent>
        </Select>
        <Select value={openFilter} onValueChange={setOpenFilter}>
          <SelectTrigger className="h-8 w-28 text-xs"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Opens</SelectItem>
            <SelectItem value="opened">Opened</SelectItem>
            <SelectItem value="unopened">Unopened</SelectItem>
            <SelectItem value="reopened">Re-opened</SelectItem>
            <SelectItem value="clicked">Clicked</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground text-sm">No emails found</div>
      ) : (
        <div className="border border-border rounded-lg overflow-hidden">
          <div className="grid grid-cols-[1fr_1fr_70px_80px_60px_70px_80px_40px] gap-0 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground bg-muted/30 px-4 py-2 border-b border-border">
            <span>Recipient</span><span>Subject</span><span>Status</span><span>Opens</span><span>Clicks</span><span>Last Open</span><span>Sent</span><span></span>
          </div>
          <div className="divide-y divide-border max-h-[500px] overflow-y-auto">
            {filtered.slice(0, 200).map(log => (
              <div key={log.id} className="grid grid-cols-[1fr_1fr_70px_80px_60px_70px_80px_40px] gap-0 px-4 py-2.5 hover:bg-muted/20 transition-colors items-center group">
                <div className="min-w-0 pr-2">
                  <p className="text-sm font-medium truncate">{log.recipient_name || log.email_to.split("@")[0]}</p>
                  <p className="text-[11px] text-muted-foreground truncate">{log.email_to}</p>
                </div>
                <span className="text-xs text-muted-foreground truncate pr-2">{log.subject}</span>
                <span><StatusBadge status={log.status} /></span>
                <span className="flex items-center gap-1.5">
                  {log.opened_at ? (
                    <>
                      <MailOpen className="h-3 w-3 text-blue-500" />
                      <span className="text-xs font-medium text-blue-600">{log.open_count}×</span>
                    </>
                  ) : log.status === "sent" ? (
                    <span className="text-[10px] text-muted-foreground">—</span>
                  ) : null}
                </span>
                <span className="text-[10px] text-muted-foreground">
                  {log.last_opened_at ? timeAgo(log.last_opened_at) : "—"}
                </span>
                <span className="text-[10px] text-muted-foreground">{timeAgo(log.sent_at)}</span>
                <button
                  onClick={() => handleDelete(log.id)}
                  disabled={deleting === log.id}
                  className="h-7 w-7 rounded-md flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-destructive/10 text-muted-foreground hover:text-destructive"
                  title="Delete"
                >
                  {deleting === log.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Automation Panel ──
function AutomationPanel({ workflows, loading, onRefresh }: {
  workflows: AutomationWorkflow[]; loading: boolean; onRefresh: () => void;
}) {
  const [toggling, setToggling] = useState<string | null>(null);
  const toggleWorkflow = async (id: string, current: boolean) => {
    setToggling(id);
    const { error } = await supabase.from("email_workflows").update({ is_active: !current }).eq("id", id);
    if (!error) { onRefresh(); toast.success(`Workflow ${current ? "paused" : "activated"}`); }
    setToggling(null);
  };

  return (
    <div className="space-y-3">
      {loading ? (
        <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
      ) : workflows.length === 0 ? (
        <div className="text-center py-12 border border-dashed border-border rounded-lg">
          <Workflow className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">No automated workflows yet</p>
        </div>
      ) : (
        <div className="grid gap-3">
          {workflows.map(wf => (
            <div key={wf.id} className="flex items-center justify-between px-4 py-3 bg-card border border-border rounded-lg">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold">{wf.name}</span>
                  <Badge variant={wf.is_active ? "default" : "secondary"} className="text-[10px]">
                    {wf.is_active ? "Active" : "Paused"}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Trigger: <span className="font-medium">{wf.trigger_event}</span>
                </p>
              </div>
              <div className="flex items-center gap-3 ml-4 shrink-0">
                {toggling === wf.id ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Switch checked={wf.is_active} onCheckedChange={() => toggleWorkflow(wf.id, wf.is_active)} />
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Main Page ──
export default function AdminEmailCenter() {
  const [tab, setTab] = useState("send");
  const [logs, setLogs] = useState<EmailLog[]>([]);
  const [campaigns, setCampaigns] = useState<SavedAsset[]>([]);
  const [workflows, setWorkflows] = useState<AutomationWorkflow[]>([]);
  const [loading, setLoading] = useState(true);
  const [workflowsLoading, setWorkflowsLoading] = useState(true);

  const fetchAll = async () => {
    setLoading(true);
    const [logsRes, campaignsRes] = await Promise.all([
      supabase.from("email_logs").select("*").order("sent_at", { ascending: false }).limit(500),
      (supabase as any).from("campaign_templates").select("id,name,project_name,form_data,created_at,updated_at,thumbnail_url,tags").order("updated_at", { ascending: false }),
    ]);
    setLogs((logsRes.data || []) as EmailLog[]);
    setCampaigns(campaignsRes.data || []);
    setLoading(false);
  };

  const fetchWorkflows = async () => {
    setWorkflowsLoading(true);
    const { data } = await supabase.from("email_workflows").select("*").order("name");
    setWorkflows(data || []);
    setWorkflowsLoading(false);
  };

  useEffect(() => { fetchAll(); fetchWorkflows(); }, []);

  const sentEmails = logs.filter(l => l.status === "sent");
  const openedCount = sentEmails.filter(l => l.opened_at).length;
  const openRate = sentEmails.length > 0 ? Math.round((openedCount / sentEmails.length) * 100) : 0;

  return (
    <AdminLayout>
      <div className="space-y-5 max-w-[1400px]">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2.5">
              <div className="h-8 w-8 rounded-xl bg-primary/10 flex items-center justify-center">
                <Mail className="h-4.5 w-4.5 text-primary" />
              </div>
              Email Center
            </h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              Send template emails & track engagement
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-4 text-xs bg-muted/40 border border-border px-4 py-2 rounded-lg">
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                <span className="font-semibold">{sentEmails.length}</span> sent
              </span>
              <span className="flex items-center gap-1.5">
                <MailOpen className="h-3.5 w-3.5 text-blue-500" />
                <span className="font-semibold">{openRate}%</span> open rate
              </span>
            </div>
            <Button variant="outline" size="sm" onClick={fetchAll}>
              <RefreshCw className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>

        {/* Stats Dashboard */}
        <DashboardStats logs={logs} />

        {/* Tabs */}
        <Tabs value={tab} onValueChange={setTab}>
          <TabsList className="h-9 gap-0.5">
            <TabsTrigger value="send" className="text-xs gap-1.5 px-4">
              <Send className="h-3.5 w-3.5" />Send Email
            </TabsTrigger>
            <TabsTrigger value="history" className="text-xs gap-1.5 px-4">
              <BarChart3 className="h-3.5 w-3.5" />History & Tracking
              {logs.length > 0 && (
                <span className="ml-1 bg-muted text-muted-foreground rounded-full px-1.5 text-[10px] font-semibold">{logs.length}</span>
              )}
            </TabsTrigger>
            <TabsTrigger value="automations" className="text-xs gap-1.5 px-4">
              <Zap className="h-3.5 w-3.5" />Automations
            </TabsTrigger>
          </TabsList>

          <TabsContent value="send" className="mt-4">
            <div className="bg-card border border-border rounded-xl p-6">
              <div className="flex items-center gap-2 mb-5 pb-4 border-b border-border">
                <Send className="h-4 w-4 text-primary" />
                <div>
                  <p className="text-sm font-semibold">Quick Send</p>
                  <p className="text-xs text-muted-foreground">Pick a template, add recipients, and send — all tracked automatically</p>
                </div>
              </div>
              <QuickSendTab campaigns={campaigns} onSent={fetchAll} onRefreshCampaigns={fetchAll} />
            </div>
          </TabsContent>

          <TabsContent value="history" className="mt-4">
            <div className="bg-card border border-border rounded-xl p-6">
              <div className="flex items-center gap-2 mb-5 pb-4 border-b border-border">
                <BarChart3 className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-semibold">Email History & Open Tracking</p>
                  <p className="text-xs text-muted-foreground">See who opened your emails and how many times</p>
                </div>
              </div>
              <EmailLogTable logs={logs} loading={loading} onDelete={(id) => setLogs(prev => prev.filter(l => l.id !== id))} />
            </div>
          </TabsContent>

          <TabsContent value="automations" className="mt-4">
            <div className="bg-card border border-border rounded-xl p-6">
              <div className="flex items-center gap-2 mb-5 pb-4 border-b border-border">
                <Zap className="h-4 w-4 text-violet-500" />
                <div>
                  <p className="text-sm font-semibold">Email Automations</p>
                  <p className="text-xs text-muted-foreground">Workflows that fire automatically based on user actions</p>
                </div>
              </div>
              <AutomationPanel workflows={workflows} loading={workflowsLoading} onRefresh={fetchWorkflows} />
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
}
