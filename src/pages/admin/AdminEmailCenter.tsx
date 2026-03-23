import { useState, useEffect, useRef } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  Send, Mail, Users, Clock, CheckCircle2, XCircle, Plus, Trash2,
  RefreshCw, Loader2, Eye, Code2, Zap, BarChart3, Search, ChevronRight,
  Workflow, Play, AlertCircle, Copy, Sparkles, Building2, Filter,
  ArrowUpRight, MailOpen, TrendingUp,
} from "lucide-react";
import { format } from "date-fns";
import { buildAiEmailHtml, type AiEmailCopy } from "@/components/admin/AiEmailTemplate";

// ── Types ──────────────────────────────────────────────────────────────────────
interface EmailLog {
  id: string;
  email_to: string;
  subject: string;
  status: string;
  sent_at: string;
  error_message: string | null;
  template_type: string | null;
  campaign_id: string | null;
}

interface ContactList {
  id: string;
  name: string;
  emails: string[];
  created_at: string;
}

interface SavedCampaign {
  id: string;
  name: string;
  project_name: string;
  form_data: any;
  created_at: string;
  updated_at: string;
}

interface AutomationWorkflow {
  id: string;
  name: string;
  description: string | null;
  trigger_event: string;
  is_active: boolean;
  audience_type: string;
  created_at: string;
}

// ── Helpers ────────────────────────────────────────────────────────────────────
function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { icon: React.ReactNode; cls: string }> = {
    sent:       { icon: <CheckCircle2 className="h-3 w-3" />, cls: "bg-emerald-100 text-emerald-700 border-emerald-200" },
    failed:     { icon: <XCircle      className="h-3 w-3" />, cls: "bg-red-100 text-red-700 border-red-200" },
    queued:     { icon: <Clock        className="h-3 w-3" />, cls: "bg-amber-100 text-amber-700 border-amber-200" },
    processing: { icon: <RefreshCw    className="h-3 w-3 animate-spin" />, cls: "bg-blue-100 text-blue-700 border-blue-200" },
  };
  const cfg = map[status] ?? { icon: null, cls: "bg-muted text-muted-foreground" };
  return (
    <span className={cn("inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium border", cfg.cls)}>
      {cfg.icon}{status}
    </span>
  );
}

function timeAgo(d: string) {
  const diff = Date.now() - new Date(d).getTime();
  const m = Math.floor(diff / 60000);
  const h = Math.floor(m / 60);
  const days = Math.floor(h / 24);
  if (days > 0) return `${days}d ago`;
  if (h > 0) return `${h}h ago`;
  if (m > 0) return `${m}m ago`;
  return "Just now";
}

// ── Compose Panel ──────────────────────────────────────────────────────────────
function ComposePanel({
  campaigns,
  projects,
  onSent,
}: {
  campaigns: SavedCampaign[];
  projects: Array<{ id: string; name: string; city: string }>;
  onSent: () => void;
}) {
  const [recipientMode, setRecipientMode] = useState<"single" | "list" | "leads">("single");
  const [toEmail, setToEmail] = useState("");
  const [toListRaw, setToListRaw] = useState("");
  const [projectFilter, setProjectFilter] = useState<string>("all");
  const [subject, setSubject] = useState("");
  const [htmlBody, setHtmlBody] = useState("");
  const [templateSource, setTemplateSource] = useState<"blank" | "saved">("blank");
  const [selectedCampaign, setSelectedCampaign] = useState<string>("none");
  const [previewMode, setPreviewMode] = useState<"code" | "preview">("code");
  const [sending, setSending] = useState(false);
  const [leadsCount, setLeadsCount] = useState<number | null>(null);
  const [leadsLoading, setLeadsLoading] = useState(false);

  // Load leads count when project filter changes
  useEffect(() => {
    if (recipientMode !== "leads") return;
    setLeadsLoading(true);
    const q = supabase.from("project_leads" as any).select("id", { count: "exact", head: true });
    const filtered = projectFilter !== "all" ? q.eq("project_id", projectFilter) : q;
    filtered.then(({ count }) => {
      setLeadsCount(count ?? 0);
      setLeadsLoading(false);
    });
  }, [recipientMode, projectFilter]);

  // Populate HTML when selecting saved campaign
  useEffect(() => {
    if (templateSource === "saved" && selectedCampaign !== "none") {
      const c = campaigns.find(c => c.id === selectedCampaign);
      if (c?.form_data) {
        try {
          const fd = c.form_data;
          const copy: AiEmailCopy = {
            headline:      fd.vars?.headline      || "",
            bodyCopy:      fd.vars?.bodyCopy      || "",
            subjectLine:   fd.vars?.subjectLine   || "",
            previewText:   fd.vars?.previewText   || "",
            incentiveText: fd.vars?.incentiveText || "",
            projectName:   fd.vars?.projectName   || c.project_name || "",
            city:          fd.vars?.city          || "",
            neighborhood:  fd.vars?.neighborhood  || "",
            developerName: fd.vars?.developerName || "",
            startingPrice: fd.vars?.startingPrice || "",
            deposit:       fd.vars?.deposit       || "",
            completion:    fd.vars?.completion    || "",
            featuredImage: fd.vars?.featuredImage || "",
            brochureUrl:   fd.vars?.brochureUrl   || "",
            floorplanUrl:  fd.vars?.floorplanUrl  || "",
            pricingUrl:    fd.vars?.pricingUrl    || "",
            projectUrl:    fd.vars?.projectUrl    || "",
            bookUrl:       fd.vars?.bookUrl       || "https://presaleproperties.com/book",
          };
          setHtmlBody(buildAiEmailHtml(copy));
          if (fd.vars?.subjectLine) setSubject(fd.vars.subjectLine);
        } catch (e) {
          // ignore parse errors
        }
      }
    }
  }, [templateSource, selectedCampaign, campaigns]);

  const parseRecipients = async (): Promise<string[]> => {
    if (recipientMode === "single") {
      if (!toEmail.trim()) return [];
      return [toEmail.trim()];
    }
    if (recipientMode === "list") {
      return toListRaw
        .split(/[\n,;]+/)
        .map(e => e.trim().toLowerCase())
        .filter(e => e.includes("@"));
    }
    // leads
    let q = supabase.from("project_leads" as any).select("email");
    if (projectFilter !== "all") q = q.eq("project_id", projectFilter) as any;
    const { data } = await q;
    return (data || []).map((r: any) => r.email).filter(Boolean);
  };

  const handleSend = async () => {
    if (!subject.trim()) { toast.error("Subject is required"); return; }
    if (!htmlBody.trim()) { toast.error("Email body is required"); return; }

    setSending(true);
    try {
      const recipients = await parseRecipients();
      if (!recipients.length) { toast.error("No valid recipients found"); setSending(false); return; }

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { toast.error("Not authenticated"); setSending(false); return; }

      const { data, error } = await supabase.functions.invoke("send-direct-email", {
        body: {
          to: recipients,
          subject: subject.trim(),
          html: htmlBody,
          campaign_name: "direct-send",
        },
      });

      if (error) throw new Error(error.message);
      if (data?.error) throw new Error(data.error);

      toast.success(
        `✅ Sent to ${data.sent} recipient${data.sent !== 1 ? "s" : ""}${data.failed > 0 ? ` (${data.failed} failed)` : ""}`
      );

      // Reset
      setToEmail(""); setToListRaw(""); setSubject(""); setHtmlBody("");
      setSelectedCampaign("none"); setTemplateSource("blank");
      onSent();
    } catch (e: any) {
      toast.error(e.message || "Failed to send");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      {/* Left — compose form */}
      <div className="space-y-4">
        {/* From */}
        <div className="bg-muted/30 border border-border rounded-lg px-4 py-3 flex items-center gap-3">
          <Mail className="h-4 w-4 text-muted-foreground shrink-0" />
          <div>
            <p className="text-xs text-muted-foreground">From</p>
            <p className="text-sm font-medium">Presale Properties &lt;info@presaleproperties.com&gt;</p>
          </div>
        </div>

        {/* Recipient mode */}
        <div className="space-y-2">
          <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Recipients</Label>
          <div className="flex gap-1.5 p-1 bg-muted/40 rounded-lg border border-border">
            {(["single","list","leads"] as const).map(mode => (
              <button
                key={mode}
                onClick={() => setRecipientMode(mode)}
                className={cn(
                  "flex-1 py-1.5 text-xs font-medium rounded-md transition-all capitalize",
                  recipientMode === mode ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"
                )}
              >
                {mode === "single" ? "Single Email" : mode === "list" ? "Paste List" : "Lead List"}
              </button>
            ))}
          </div>

          {recipientMode === "single" && (
            <Input value={toEmail} onChange={e => setToEmail(e.target.value)}
              placeholder="recipient@example.com" className="h-9 text-sm" />
          )}
          {recipientMode === "list" && (
            <Textarea value={toListRaw} onChange={e => setToListRaw(e.target.value)}
              placeholder={"Paste emails separated by comma, semicolon, or new line:\njohn@example.com\njane@example.com"}
              className="min-h-[100px] text-sm font-mono resize-none" />
          )}
          {recipientMode === "leads" && (
            <div className="space-y-2">
              <Select value={projectFilter} onValueChange={setProjectFilter}>
                <SelectTrigger className="h-9 text-sm"><SelectValue placeholder="Filter by project" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All leads</SelectItem>
                  {projects.map(p => (
                    <SelectItem key={p.id} value={p.id}>{p.name} — {p.city}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <div className="flex items-center gap-2 px-3 py-2 bg-muted/30 rounded-lg border border-border text-sm">
                <Users className="h-4 w-4 text-muted-foreground" />
                {leadsLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : (
                  <span className="font-medium">{leadsCount ?? "—"} leads</span>
                )}
                <span className="text-muted-foreground">will receive this email</span>
              </div>
            </div>
          )}
        </div>

        {/* Template source */}
        <div className="space-y-2">
          <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Email Template</Label>
          <div className="flex gap-1.5 p-1 bg-muted/40 rounded-lg border border-border">
            {(["blank","saved"] as const).map(mode => (
              <button key={mode} onClick={() => setTemplateSource(mode)}
                className={cn(
                  "flex-1 py-1.5 text-xs font-medium rounded-md transition-all capitalize",
                  templateSource === mode ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"
                )}>
                {mode === "blank" ? "Write from scratch" : "Use saved template"}
              </button>
            ))}
          </div>

          {templateSource === "saved" && (
            <Select value={selectedCampaign} onValueChange={setSelectedCampaign}>
              <SelectTrigger className="h-9 text-sm"><SelectValue placeholder="Choose a saved email…" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">None</SelectItem>
                {campaigns.map(c => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name} {c.project_name ? `— ${c.project_name}` : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>

        {/* Subject */}
        <div className="space-y-1.5">
          <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Subject Line</Label>
          <Input value={subject} onChange={e => setSubject(e.target.value)}
            placeholder="e.g. 🏙️ Exclusive Access: Lumina Surrey — Presale" className="h-9 text-sm" />
        </div>

        {/* Send button */}
        <Button
          className="w-full h-10 gap-2 font-semibold"
          onClick={handleSend}
          disabled={sending || !subject.trim() || !htmlBody.trim()}
        >
          {sending ? <><Loader2 className="h-4 w-4 animate-spin" />Sending…</> : <><Send className="h-4 w-4" />Send Email</>}
        </Button>
      </div>

      {/* Right — HTML editor + preview */}
      <div className="space-y-2 flex flex-col">
        <div className="flex items-center justify-between">
          <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Email Body</Label>
          <div className="flex gap-1 p-0.5 bg-muted/40 rounded-lg border border-border">
            <button onClick={() => setPreviewMode("code")}
              className={cn("px-2.5 py-1 text-xs font-medium rounded-md transition-all flex items-center gap-1",
                previewMode === "code" ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground")}>
              <Code2 className="h-3 w-3" />HTML
            </button>
            <button onClick={() => setPreviewMode("preview")}
              className={cn("px-2.5 py-1 text-xs font-medium rounded-md transition-all flex items-center gap-1",
                previewMode === "preview" ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground")}>
              <Eye className="h-3 w-3" />Preview
            </button>
          </div>
        </div>

        <div className="flex-1 min-h-[360px] rounded-lg border border-border overflow-hidden">
          {previewMode === "code" ? (
            <Textarea value={htmlBody} onChange={e => setHtmlBody(e.target.value)}
              placeholder="Paste HTML from the Email Builder, or write your own…"
              className="w-full h-full min-h-[360px] font-mono text-xs resize-none rounded-none border-0 focus-visible:ring-0" />
          ) : (
            <div className="bg-[#f0ede8] w-full h-full min-h-[360px] overflow-auto">
              {htmlBody ? (
                <iframe srcDoc={htmlBody} sandbox="allow-same-origin"
                  className="w-full border-0" style={{ height: 520, display: "block" }} />
              ) : (
                <div className="flex items-center justify-center h-full text-sm text-muted-foreground">
                  No HTML yet — write or paste it in the Code tab
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Email Log Table ────────────────────────────────────────────────────────────
function EmailLogTable({ logs, loading }: { logs: EmailLog[]; loading: boolean }) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const filtered = logs.filter(l => {
    const matchSearch = !search || l.email_to.includes(search) || l.subject.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "all" || l.status === statusFilter;
    return matchSearch && matchStatus;
  });

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search by email or subject…" className="pl-8 h-8 text-sm" />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="h-8 w-32 text-xs"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="sent">Sent</SelectItem>
            <SelectItem value="failed">Failed</SelectItem>
            <SelectItem value="queued">Queued</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground text-sm">No emails found</div>
      ) : (
        <div className="border border-border rounded-lg overflow-hidden">
          <div className="grid grid-cols-[1fr_1.5fr_80px_100px] gap-0 text-xs font-semibold uppercase tracking-wide text-muted-foreground bg-muted/30 px-4 py-2 border-b border-border">
            <span>Recipient</span><span>Subject</span><span>Status</span><span>Sent</span>
          </div>
          <div className="divide-y divide-border">
            {filtered.slice(0, 100).map(log => (
              <div key={log.id} className="grid grid-cols-[1fr_1.5fr_80px_100px] gap-0 px-4 py-3 hover:bg-muted/20 transition-colors items-center">
                <span className="text-sm truncate pr-3">{log.email_to}</span>
                <span className="text-sm text-muted-foreground truncate pr-3">{log.subject}</span>
                <span><StatusBadge status={log.status} /></span>
                <span className="text-xs text-muted-foreground">{timeAgo(log.sent_at)}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Stats Bar ──────────────────────────────────────────────────────────────────
function StatsBar({ logs }: { logs: EmailLog[] }) {
  const total = logs.length;
  const sent = logs.filter(l => l.status === "sent").length;
  const failed = logs.filter(l => l.status === "failed").length;
  const rate = total > 0 ? Math.round((sent / total) * 100) : 0;

  const stats = [
    { label: "Total Sent", value: sent, icon: <Send className="h-4 w-4 text-emerald-500" />, color: "text-emerald-600" },
    { label: "Delivery Rate", value: `${rate}%`, icon: <TrendingUp className="h-4 w-4 text-blue-500" />, color: "text-blue-600" },
    { label: "Failed", value: failed, icon: <XCircle className="h-4 w-4 text-red-500" />, color: failed > 0 ? "text-red-600" : "text-muted-foreground" },
    { label: "Total Emails", value: total, icon: <BarChart3 className="h-4 w-4 text-muted-foreground" />, color: "text-foreground" },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      {stats.map(s => (
        <div key={s.label} className="bg-card border border-border rounded-lg px-4 py-3 flex items-center gap-3">
          <div className="shrink-0">{s.icon}</div>
          <div>
            <p className={cn("text-xl font-bold leading-none", s.color)}>{s.value}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{s.label}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Automation Workflow Panel ──────────────────────────────────────────────────
function AutomationPanel({ workflows, loading, onRefresh }: {
  workflows: AutomationWorkflow[];
  loading: boolean;
  onRefresh: () => void;
}) {
  const [toggling, setToggling] = useState<string | null>(null);

  const toggleWorkflow = async (id: string, current: boolean) => {
    setToggling(id);
    const { error } = await supabase
      .from("email_workflows")
      .update({ is_active: !current })
      .eq("id", id);
    if (!error) { onRefresh(); toast.success(`Workflow ${current ? "paused" : "activated"}`); }
    else toast.error("Failed to update workflow");
    setToggling(null);
  };

  const TRIGGER_LABELS: Record<string, string> = {
    buyer_signup:       "🧑 Buyer Signup",
    project_inquiry:    "📋 Project Inquiry",
    floorplan_download: "📐 Floorplan Download",
    booking_request:    "📅 Booking Request",
    agent_signup:       "🤝 Agent Signup",
    agent_request:      "📩 Agent Request",
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Automated email sequences triggered by user actions.
          <a href="/admin/email-workflows" className="text-primary hover:underline ml-1 inline-flex items-center gap-0.5">
            Manage full workflow builder <ArrowUpRight className="h-3 w-3" />
          </a>
        </p>
        <Button variant="outline" size="sm" onClick={onRefresh}>
          <RefreshCw className="h-3.5 w-3.5" />
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
      ) : workflows.length === 0 ? (
        <div className="text-center py-12 space-y-3 border border-dashed border-border rounded-lg">
          <Workflow className="h-8 w-8 text-muted-foreground mx-auto" />
          <div>
            <p className="text-sm font-medium">No workflows yet</p>
            <p className="text-xs text-muted-foreground mt-1">Create automated email sequences from the Workflow Builder</p>
          </div>
          <Button size="sm" asChild>
            <a href="/admin/email-workflows"><Plus className="h-3.5 w-3.5 mr-1.5" />Create Workflow</a>
          </Button>
        </div>
      ) : (
        <div className="grid gap-3">
          {workflows.map(wf => (
            <div key={wf.id}
              className="flex items-center justify-between px-4 py-3 bg-card border border-border rounded-lg hover:border-primary/30 transition-colors">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-semibold">{wf.name}</span>
                  <Badge variant={wf.is_active ? "default" : "secondary"} className="text-[10px]">
                    {wf.is_active ? "Active" : "Paused"}
                  </Badge>
                  <Badge variant="outline" className="text-[10px] capitalize">{wf.audience_type}</Badge>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Trigger: <span className="font-medium">{TRIGGER_LABELS[wf.trigger_event] ?? wf.trigger_event}</span>
                  {wf.description && <span className="ml-2 opacity-70">— {wf.description}</span>}
                </p>
              </div>
              <div className="flex items-center gap-3 ml-4 shrink-0">
                {toggling === wf.id ? (
                  <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                ) : (
                  <Switch checked={wf.is_active} onCheckedChange={() => toggleWorkflow(wf.id, wf.is_active)} />
                )}
                <Button variant="ghost" size="sm" asChild>
                  <a href="/admin/email-workflows"><ChevronRight className="h-4 w-4" /></a>
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Main Page ──────────────────────────────────────────────────────────────────
export default function AdminEmailCenter() {
  const [tab, setTab] = useState("compose");
  const [logs, setLogs] = useState<EmailLog[]>([]);
  const [campaigns, setCampaigns] = useState<SavedCampaign[]>([]);
  const [workflows, setWorkflows] = useState<AutomationWorkflow[]>([]);
  const [projects, setProjects] = useState<Array<{ id: string; name: string; city: string }>>([]);
  const [loading, setLoading] = useState(true);
  const [workflowsLoading, setWorkflowsLoading] = useState(true);

  const fetchAll = async () => {
    setLoading(true);
    const [logsRes, campaignsRes, projectsRes] = await Promise.all([
      supabase.from("email_logs").select("*").order("sent_at", { ascending: false }).limit(500),
      (supabase as any).from("campaign_templates").select("id,name,project_name,form_data,created_at,updated_at").order("updated_at", { ascending: false }),
      (supabase as any).from("presale_projects").select("id,name,city").eq("is_published", true).order("name"),
    ]);
    setLogs(logsRes.data || []);
    setCampaigns(campaignsRes.data || []);
    setProjects(projectsRes.data || []);
    setLoading(false);
  };

  const fetchWorkflows = async () => {
    setWorkflowsLoading(true);
    const { data } = await supabase.from("email_workflows").select("*").order("name");
    setWorkflows(data || []);
    setWorkflowsLoading(false);
  };

  useEffect(() => {
    fetchAll();
    fetchWorkflows();
  }, []);

  const sentToday = logs.filter(l => {
    const today = new Date();
    const d = new Date(l.sent_at);
    return d.getFullYear() === today.getFullYear() &&
           d.getMonth() === today.getMonth() &&
           d.getDate() === today.getDate() &&
           l.status === "sent";
  }).length;

  return (
    <AdminLayout>
      <div className="space-y-5 max-w-[1300px]">

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
              Send emails, manage campaigns, and automate outreach from <span className="font-medium text-foreground">info@presaleproperties.com</span>
            </p>
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/40 border border-border px-3 py-2 rounded-lg">
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
            <span>{sentToday} sent today</span>
          </div>
        </div>

        {/* Stats */}
        <StatsBar logs={logs} />

        {/* Tabs */}
        <Tabs value={tab} onValueChange={setTab}>
          <TabsList className="h-9 gap-0.5">
            <TabsTrigger value="compose" className="text-xs gap-1.5 px-3">
              <Send className="h-3.5 w-3.5" />Compose & Send
            </TabsTrigger>
            <TabsTrigger value="history" className="text-xs gap-1.5 px-3">
              <Clock className="h-3.5 w-3.5" />Send History
              {logs.length > 0 && (
                <span className="ml-1 bg-muted text-muted-foreground rounded-full px-1.5 py-0 text-[10px] font-semibold">
                  {logs.length}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="automations" className="text-xs gap-1.5 px-3">
              <Zap className="h-3.5 w-3.5" />Automations
              {workflows.length > 0 && (
                <span className="ml-1 bg-muted text-muted-foreground rounded-full px-1.5 py-0 text-[10px] font-semibold">
                  {workflows.length}
                </span>
              )}
            </TabsTrigger>
          </TabsList>

          {/* Compose Tab */}
          <TabsContent value="compose" className="mt-4">
            <div className="bg-card border border-border rounded-xl p-5">
              <div className="flex items-center gap-2 mb-5 pb-4 border-b border-border">
                <div className="h-7 w-7 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Send className="h-3.5 w-3.5 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-semibold">New Email</p>
                  <p className="text-xs text-muted-foreground">Send to an individual, paste a list, or blast all leads for a project</p>
                </div>
                <div className="ml-auto">
                  <a href="/admin/email-builder"
                    className="inline-flex items-center gap-1.5 text-xs text-primary hover:text-primary/80 font-medium">
                    <Sparkles className="h-3 w-3" />Open Email Builder
                  </a>
                </div>
              </div>
              <ComposePanel campaigns={campaigns} projects={projects} onSent={fetchAll} />
            </div>
          </TabsContent>

          {/* History Tab */}
          <TabsContent value="history" className="mt-4">
            <div className="bg-card border border-border rounded-xl p-5">
              <div className="flex items-center gap-2 mb-5 pb-4 border-b border-border">
                <div className="h-7 w-7 rounded-lg bg-muted/60 flex items-center justify-center">
                  <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-sm font-semibold">Send History</p>
                  <p className="text-xs text-muted-foreground">All emails sent from info@presaleproperties.com</p>
                </div>
                <Button variant="ghost" size="sm" onClick={fetchAll} className="ml-auto h-7">
                  <RefreshCw className="h-3.5 w-3.5" />
                </Button>
              </div>
              <EmailLogTable logs={logs} loading={loading} />
            </div>
          </TabsContent>

          {/* Automations Tab */}
          <TabsContent value="automations" className="mt-4">
            <div className="bg-card border border-border rounded-xl p-5">
              <div className="flex items-center gap-2 mb-5 pb-4 border-b border-border">
                <div className="h-7 w-7 rounded-lg bg-violet-500/10 flex items-center justify-center">
                  <Zap className="h-3.5 w-3.5 text-violet-500" />
                </div>
                <div>
                  <p className="text-sm font-semibold">Email Automations</p>
                  <p className="text-xs text-muted-foreground">Workflows that fire automatically based on user behaviour</p>
                </div>
                <Button size="sm" className="ml-auto h-7 text-xs gap-1.5" asChild>
                  <a href="/admin/email-workflows">
                    <Plus className="h-3.5 w-3.5" />New Workflow
                  </a>
                </Button>
              </div>
              <AutomationPanel workflows={workflows} loading={workflowsLoading} onRefresh={fetchWorkflows} />
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
}
