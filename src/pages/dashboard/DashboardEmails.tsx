import { useEffect, useState, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import {
  Mail,
  Search,
  Loader2,
  Send,
  Eye,
  AlertCircle,
  Clock,
  TrendingUp,
  MailOpen,
  CheckCircle2,
  XCircle,
  Plus,
  X,
  User,
  Pencil,
  FileText,
  Building2,
  ExternalLink,
} from "lucide-react";
import { format, subDays, isAfter } from "date-fns";
import { cn } from "@/lib/utils";
import { buildAiTemplateHtmlFromFormData, isAiEmailTemplate, personalizeTemplateHtml } from "@/lib/ai-email-html";

// ── Types ──────────────────────────────────────────────────────────

interface EmailLog {
  id: string;
  email_to: string;
  subject: string;
  status: string;
  template_type: string | null;
  recipient_name: string | null;
  sent_at: string;
  opened_at: string | null;
  open_count: number;
  last_opened_at: string | null;
  error_message: string | null;
}

interface OnboardedLead {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
}

interface SavedTemplate {
  id: string;
  name: string;
  project_name: string;
  thumbnail_url: string | null;
  form_data: any;
  created_at: string;
  updated_at: string;
  user_id: string | null;
}

// ── Constants ──────────────────────────────────────────────────────

const DATE_FILTERS = [
  { value: "all", label: "All Time" },
  { value: "7", label: "Last 7 Days" },
  { value: "30", label: "Last 30 Days" },
  { value: "90", label: "Last 90 Days" },
];

const STATUS_CONFIG: Record<string, { icon: typeof CheckCircle2; label: string; className: string }> = {
  sent: { icon: CheckCircle2, label: "Sent", className: "text-emerald-500 bg-emerald-500/10" },
  opened: { icon: MailOpen, label: "Opened", className: "text-blue-500 bg-blue-500/10" },
  failed: { icon: XCircle, label: "Failed", className: "text-red-500 bg-red-500/10" },
  pending: { icon: Clock, label: "Pending", className: "text-amber-500 bg-amber-500/10" },
  queued: { icon: Clock, label: "Queued", className: "text-amber-500 bg-amber-500/10" },
};

const TEMPLATE_LABELS: Record<string, string> = {
  campaign_template: "Campaign",
  builder_send: "Builder",
  deck_intro: "Deck Intro",
  welcome: "Welcome",
  direct: "Direct",
  agent_compose: "Compose",
};

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  const hrs = Math.floor(mins / 60);
  const days = Math.floor(hrs / 24);
  if (days > 0) return `${days}d ago`;
  if (hrs > 0) return `${hrs}h ago`;
  if (mins > 0) return `${mins}m ago`;
  return "Just now";
}

// ── Template Preview Dialog ────────────────────────────────────────

function TemplatePreviewDialog({
  template,
  open,
  onOpenChange,
  onUseTemplate,
}: {
  template: SavedTemplate | null;
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onUseTemplate: (t: SavedTemplate) => void;
}) {
  const [previewHtml, setPreviewHtml] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open || !template) { setPreviewHtml(""); return; }
    let cancelled = false;
    setLoading(true);

    const load = async () => {
      const fd = template.form_data;
      if (fd?.finalHtml) {
        if (!cancelled) setPreviewHtml(personalizeTemplateHtml(fd.finalHtml, "there"));
        setLoading(false);
        return;
      }
      if (isAiEmailTemplate(fd)) {
        let agentRecord: any = null;
        if (fd.selAgent) {
          const { data } = await (supabase as any)
            .from("team_members_public")
            .select("full_name, title, photo_url")
            .eq("full_name", fd.selAgent)
            .maybeSingle();
          agentRecord = data ?? null;
        }
        if (!cancelled) {
          setPreviewHtml(personalizeTemplateHtml(buildAiTemplateHtmlFromFormData(fd, agentRecord), "there"));
        }
      }
      if (!cancelled) setLoading(false);
    };
    load();
    return () => { cancelled = true; };
  }, [open, template]);

  if (!template) return null;

  const subject = template.form_data?.copy?.subjectLine || template.form_data?.subject || template.name;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl w-[calc(100%-2rem)] max-h-[90vh] flex flex-col p-0 gap-0">
        <DialogHeader className="px-5 py-4 border-b shrink-0">
          <DialogTitle className="text-sm font-semibold flex items-center gap-2">
            <Eye className="h-4 w-4 text-primary" />
            <span className="truncate">{template.name}</span>
          </DialogTitle>
          {subject && (
            <p className="text-xs text-muted-foreground truncate mt-1">Subject: {subject}</p>
          )}
        </DialogHeader>

        <div className="flex-1 overflow-auto bg-muted/30">
          {loading ? (
            <div className="flex items-center justify-center h-48">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : previewHtml ? (
            <div className="flex justify-center p-4">
              <iframe
                srcDoc={previewHtml}
                title="Template Preview"
                className="w-full bg-white rounded-md border shadow-sm"
                style={{ maxWidth: 680, height: "60vh" }}
                sandbox="allow-same-origin"
              />
            </div>
          ) : (
            <div className="flex items-center justify-center h-48 text-muted-foreground text-sm">
              No preview available
            </div>
          )}
        </div>

        <div className="px-5 py-3 border-t shrink-0 flex gap-2 justify-end">
          <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>
            Close
          </Button>
          <Button size="sm" className="gap-1.5" onClick={() => { onUseTemplate(template); onOpenChange(false); }}>
            <Pencil className="h-3.5 w-3.5" /> Edit & Send
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ── Main Component ─────────────────────────────────────────────────

export default function DashboardEmails() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<"activity" | "templates">("activity");

  // ── Activity tab state ──
  const [emails, setEmails] = useState<EmailLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("all");

  // ── Templates tab state ──
  const [templates, setTemplates] = useState<SavedTemplate[]>([]);
  const [adminTemplates, setAdminTemplates] = useState<SavedTemplate[]>([]);
  const [templatesLoading, setTemplatesLoading] = useState(true);
  const [templateSearch, setTemplateSearch] = useState("");
  const [previewTemplate, setPreviewTemplate] = useState<SavedTemplate | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);

  // ── Compose state ──
  const [composeOpen, setComposeOpen] = useState(false);
  const [leads, setLeads] = useState<OnboardedLead[]>([]);
  const [selectedLeads, setSelectedLeads] = useState<OnboardedLead[]>([]);
  const [leadSearch, setLeadSearch] = useState("");
  const [composeSubject, setComposeSubject] = useState("");
  const [composeBody, setComposeBody] = useState("");
  const [sending, setSending] = useState(false);
  const [manualEmail, setManualEmail] = useState("");

  // ── Fetch emails ──
  useEffect(() => {
    if (user) fetchEmails();
  }, [user]);

  const fetchEmails = async () => {
    if (!user) return;
    setLoading(true);
    const { data, error } = await supabase
      .from("email_logs")
      .select("id, email_to, subject, status, template_type, recipient_name, sent_at, opened_at, open_count, last_opened_at, error_message")
      .eq("sent_by", user.id)
      .order("sent_at", { ascending: false });
    if (data) setEmails(data as unknown as EmailLog[]);
    if (error) console.error("Error fetching emails:", error);
    setLoading(false);
  };

  // ── Fetch templates ──
  useEffect(() => {
    if (user) fetchTemplates();
  }, [user]);

  const fetchTemplates = async () => {
    if (!user) return;
    setTemplatesLoading(true);
    const { data } = await (supabase as any)
      .from("campaign_templates")
      .select("*")
      .order("updated_at", { ascending: false });
    if (data) {
      const all = data as SavedTemplate[];
      setTemplates(all.filter((a) => a.user_id === user.id));
      setAdminTemplates(all.filter((a) => !a.user_id));
    }
    setTemplatesLoading(false);
  };

  // ── Compose helpers ──
  const fetchLeads = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase
      .from("onboarded_leads")
      .select("id, first_name, last_name, email")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });
    if (data) setLeads(data);
  }, [user]);

  const openCompose = () => {
    setComposeOpen(true);
    setSelectedLeads([]);
    setComposeSubject("");
    setComposeBody("");
    setLeadSearch("");
    setManualEmail("");
    fetchLeads();
  };

  const filteredLeads = useMemo(() => {
    if (!leadSearch) return leads;
    const q = leadSearch.toLowerCase();
    return leads.filter(
      (l) => l.first_name.toLowerCase().includes(q) || l.last_name.toLowerCase().includes(q) || l.email.toLowerCase().includes(q)
    );
  }, [leads, leadSearch]);

  const toggleLead = (lead: OnboardedLead) => {
    setSelectedLeads((prev) => prev.some((l) => l.id === lead.id) ? prev.filter((l) => l.id !== lead.id) : [...prev, lead]);
  };

  const addManualEmail = () => {
    const email = manualEmail.trim().toLowerCase();
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { toast.error("Enter a valid email address"); return; }
    if (selectedLeads.some((l) => l.email === email)) { toast.error("Already added"); return; }
    const name = email.split("@")[0];
    setSelectedLeads((prev) => [...prev, { id: `manual-${Date.now()}`, first_name: name, last_name: "", email }]);
    setManualEmail("");
  };

  const selectAll = () => {
    const toAdd = filteredLeads.filter((l) => !selectedLeads.some((s) => s.id === l.id));
    setSelectedLeads((prev) => [...prev, ...toAdd]);
  };

  const handleSend = async () => {
    if (!selectedLeads.length) { toast.error("Select at least one recipient"); return; }
    if (!composeSubject.trim()) { toast.error("Subject line is required"); return; }
    if (!composeBody.trim()) { toast.error("Email body is required"); return; }
    setSending(true);
    try {
      const bodyHtml = composeBody.split("\n").map((line) => (line.trim() ? `<p style="margin:0 0 12px;font-size:15px;color:#444;line-height:1.7;">${line}</p>` : "<br/>")).join("");
      const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1.0"></head>
<body style="margin:0;padding:0;background:#f7f5f2;font-family:'Plus Jakarta Sans',Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f7f5f2;"><tr><td align="center" style="padding:32px 16px;">
<table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border:1px solid #e0dbd3;border-radius:8px;overflow:hidden;">
<tr><td style="padding:32px;">${bodyHtml}</td></tr>
<tr><td style="padding:16px 32px 32px;"><p style="margin:0;font-size:13px;color:#aaa;line-height:1.5;">Presale Properties &middot; <a href="https://presaleproperties.com" style="color:#888;text-decoration:underline;">presaleproperties.com</a></p></td></tr>
</table></td></tr></table></body></html>`;
      const recipients = selectedLeads.map((l) => ({ email: l.email, name: `${l.first_name} ${l.last_name}`.trim(), firstName: l.first_name }));
      const { data: profile } = await supabase.from("profiles").select("full_name").eq("user_id", user!.id).single();
      const agentFirst = profile?.full_name?.split(" ")[0] || "";
      const fromName = agentFirst ? `Presale Properties | ${agentFirst}` : "Presale Properties";
      const { data, error } = await supabase.functions.invoke("send-builder-email", { body: { subject: composeSubject, html, recipients, fromName } });
      if (error) throw error;
      if (data.sent > 0) { toast.success(`Email sent to ${data.sent} recipient${data.sent > 1 ? "s" : ""}`); setComposeOpen(false); fetchEmails(); }
      else toast.error("All sends failed");
    } catch (err: any) {
      console.error("Send error:", err);
      toast.error(err.message || "Failed to send email");
    } finally { setSending(false); }
  };

  // ── Filtered emails ──
  const filtered = useMemo(() => {
    return emails.filter((e) => {
      const q = searchQuery.toLowerCase();
      if (q && !e.email_to.toLowerCase().includes(q) && !(e.recipient_name || "").toLowerCase().includes(q) && !e.subject.toLowerCase().includes(q)) return false;
      const effectiveStatus = e.open_count > 0 ? "opened" : e.status;
      if (statusFilter !== "all" && effectiveStatus !== statusFilter) return false;
      if (dateFilter !== "all") {
        const cutoff = subDays(new Date(), parseInt(dateFilter));
        if (!isAfter(new Date(e.sent_at), cutoff)) return false;
      }
      return true;
    });
  }, [emails, searchQuery, statusFilter, dateFilter]);

  // ── Filtered templates ──
  const filteredTemplates = useMemo(() => {
    const all = [...templates, ...adminTemplates];
    if (!templateSearch) return all;
    const q = templateSearch.toLowerCase();
    return all.filter((t) =>
      t.name.toLowerCase().includes(q) ||
      t.project_name.toLowerCase().includes(q) ||
      (t.form_data?.copy?.subjectLine || "").toLowerCase().includes(q)
    );
  }, [templates, adminTemplates, templateSearch]);

  const totalSent = emails.length;
  const totalOpened = emails.filter((e) => e.open_count > 0).length;
  const openRate = totalSent > 0 ? Math.round((totalOpened / totalSent) * 100) : 0;
  const recentEmails = emails.filter((e) => isAfter(new Date(e.sent_at), subDays(new Date(), 7))).length;

  const handleUseTemplate = (t: SavedTemplate) => {
    navigate(`/dashboard/email-builder?saved=${t.id}`);
  };

  return (
    <DashboardLayout>
      <div className="space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Emails</h1>
            <p className="text-sm text-muted-foreground">Send, track & manage your email campaigns</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => navigate("/dashboard/email-builder")} className="gap-2">
              <Plus className="h-4 w-4" /> New Email
            </Button>
            <Button onClick={openCompose} className="gap-2">
              <Pencil className="h-4 w-4" /> Compose
            </Button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 p-1 bg-muted/50 rounded-lg w-fit">
          <button
            onClick={() => setActiveTab("activity")}
            className={cn(
              "px-4 py-2 rounded-md text-sm font-medium transition-all",
              activeTab === "activity"
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <div className="flex items-center gap-2">
              <Send className="h-3.5 w-3.5" /> Activity
              {totalSent > 0 && <Badge variant="secondary" className="text-[10px] h-4 px-1.5">{totalSent}</Badge>}
            </div>
          </button>
          <button
            onClick={() => setActiveTab("templates")}
            className={cn(
              "px-4 py-2 rounded-md text-sm font-medium transition-all",
              activeTab === "templates"
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <div className="flex items-center gap-2">
              <FileText className="h-3.5 w-3.5" /> Templates
              {(templates.length + adminTemplates.length) > 0 && (
                <Badge variant="secondary" className="text-[10px] h-4 px-1.5">{templates.length + adminTemplates.length}</Badge>
              )}
            </div>
          </button>
        </div>

        {/* ── Activity Tab ── */}
        {activeTab === "activity" && (
          <>
            {/* Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="flex items-center gap-3 p-3 rounded-lg border border-border">
                <Send className="h-4 w-4 text-primary" />
                <div>
                  <p className="text-lg font-bold leading-none">{totalSent}</p>
                  <p className="text-[11px] text-muted-foreground">Total Sent</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 rounded-lg border border-border">
                <MailOpen className="h-4 w-4 text-blue-500" />
                <div>
                  <p className="text-lg font-bold leading-none">{openRate}%</p>
                  <p className="text-[11px] text-muted-foreground">Open Rate</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 rounded-lg border border-border">
                <Eye className="h-4 w-4 text-emerald-500" />
                <div>
                  <p className="text-lg font-bold leading-none">{totalOpened}</p>
                  <p className="text-[11px] text-muted-foreground">Opened</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 rounded-lg border border-border">
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-lg font-bold leading-none">{recentEmails}</p>
                  <p className="text-[11px] text-muted-foreground">This Week</p>
                </div>
              </div>
            </div>

            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Search recipient, subject..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-9 text-sm h-9" />
              </div>
              <div className="flex gap-2">
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-[120px] text-sm h-9"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="sent">Sent</SelectItem>
                    <SelectItem value="opened">Opened</SelectItem>
                    <SelectItem value="failed">Failed</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={dateFilter} onValueChange={setDateFilter}>
                  <SelectTrigger className="w-[120px] text-sm h-9">
                    <Clock className="h-3 w-3 mr-1 text-muted-foreground" /><SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {DATE_FILTERS.map((f) => (<SelectItem key={f.value} value={f.value}>{f.label}</SelectItem>))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Email List */}
            {loading ? (
              <div className="flex items-center justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
            ) : filtered.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <Mail className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
                  <p className="font-medium">{searchQuery || statusFilter !== "all" ? "No emails match filters" : "No emails sent yet"}</p>
                  <p className="text-sm text-muted-foreground mt-1">{searchQuery || statusFilter !== "all" ? "Try adjusting your search." : "Use the Compose button to send your first email."}</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-2">
                <p className="text-[11px] text-muted-foreground">{filtered.length} emails</p>
                {filtered.map((email) => {
                  const effectiveStatus = email.open_count > 0 ? "opened" : email.status;
                  const statusConf = STATUS_CONFIG[effectiveStatus] || STATUS_CONFIG.sent;
                  const StatusIcon = statusConf.icon;
                  return (
                    <div key={email.id} className={cn("flex items-center gap-3 p-3 rounded-lg border transition-colors", email.open_count > 0 ? "border-blue-500/20 bg-blue-500/5" : "border-border")}>
                      <div className={cn("w-8 h-8 rounded-full flex items-center justify-center shrink-0", statusConf.className)}>
                        <StatusIcon className="h-4 w-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-medium text-sm truncate">{email.recipient_name || email.email_to}</p>
                          {email.template_type && <Badge variant="outline" className="text-[10px] h-4 px-1.5">{TEMPLATE_LABELS[email.template_type] || email.template_type}</Badge>}
                          {email.open_count > 0 && <Badge className="text-[10px] h-4 px-1.5 bg-blue-500/10 text-blue-500 border-0 gap-0.5"><Eye className="h-2.5 w-2.5" /> {email.open_count}x</Badge>}
                        </div>
                        <p className="text-xs text-muted-foreground truncate mt-0.5">{email.subject}</p>
                        {email.recipient_name && <p className="text-[11px] text-muted-foreground/70 truncate">{email.email_to}</p>}
                      </div>
                      <div className="text-right shrink-0 hidden sm:block">
                        <p className="text-[11px] text-muted-foreground">{format(new Date(email.sent_at), "MMM d")}</p>
                        <p className="text-[10px] text-muted-foreground/60">{format(new Date(email.sent_at), "h:mm a")}</p>
                        {email.last_opened_at && <p className="text-[10px] text-blue-500 mt-0.5">Opened {format(new Date(email.last_opened_at), "MMM d")}</p>}
                      </div>
                      {email.status === "failed" && email.error_message && (
                        <div className="shrink-0" title={email.error_message}><AlertCircle className="h-4 w-4 text-red-500" /></div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}

        {/* ── Templates Tab ── */}
        {activeTab === "templates" && (
          <>
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search templates by name, project, or subject..."
                value={templateSearch}
                onChange={(e) => setTemplateSearch(e.target.value)}
                className="pl-9 text-sm h-9"
              />
            </div>

            {templatesLoading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {[1, 2, 3].map(i => (
                  <div key={i} className="rounded-xl border border-border bg-muted/30 animate-pulse">
                    <div className="h-40 bg-muted/50 rounded-t-xl" />
                    <div className="p-4 space-y-2">
                      <div className="h-4 bg-muted/50 rounded w-3/4" />
                      <div className="h-3 bg-muted/50 rounded w-1/2" />
                    </div>
                  </div>
                ))}
              </div>
            ) : filteredTemplates.length === 0 ? (
              <Card>
                <CardContent className="py-16 text-center">
                  <FileText className="h-10 w-10 text-muted-foreground/20 mx-auto mb-3" />
                  <p className="font-medium text-muted-foreground">
                    {templateSearch ? "No templates match your search" : "No saved templates yet"}
                  </p>
                  <p className="text-xs text-muted-foreground/60 mt-1 mb-4">
                    {templateSearch ? "Try a different search term." : "Create an email in the builder and save it to find it here."}
                  </p>
                  {!templateSearch && (
                    <Button variant="outline" size="sm" className="gap-1.5" onClick={() => navigate("/dashboard/email-builder?template=project-email")}>
                      <Plus className="h-3.5 w-3.5" /> Create Email
                    </Button>
                  )}
                </CardContent>
              </Card>
            ) : (
              <>
                {/* Your templates */}
                {templates.length > 0 && (
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground mb-3">
                      Your Templates ({templates.filter(t => !templateSearch || filteredTemplates.includes(t)).length})
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      {filteredTemplates.filter(t => t.user_id === user?.id).map(template => (
                        <TemplateCard
                          key={template.id}
                          template={template}
                          onPreview={() => { setPreviewTemplate(template); setPreviewOpen(true); }}
                          onUse={() => handleUseTemplate(template)}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {/* Admin / shared templates */}
                {adminTemplates.length > 0 && (
                  <div className={templates.length > 0 ? "mt-6" : ""}>
                    <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground mb-3">
                      Shared Templates ({adminTemplates.filter(t => !templateSearch || filteredTemplates.includes(t)).length})
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      {filteredTemplates.filter(t => !t.user_id).map(template => (
                        <TemplateCard
                          key={template.id}
                          template={template}
                          onPreview={() => { setPreviewTemplate(template); setPreviewOpen(true); }}
                          onUse={() => handleUseTemplate(template)}
                          isShared
                        />
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </>
        )}
      </div>

      {/* Template Preview Dialog */}
      <TemplatePreviewDialog
        template={previewTemplate}
        open={previewOpen}
        onOpenChange={setPreviewOpen}
        onUseTemplate={handleUseTemplate}
      />

      {/* Compose Dialog */}
      <Dialog open={composeOpen} onOpenChange={setComposeOpen}>
        <DialogContent className="sm:max-w-[560px] p-0 gap-0 overflow-hidden max-h-[90vh] flex flex-col">
          <DialogHeader className="px-5 pt-5 pb-3 shrink-0">
            <DialogTitle className="text-base font-semibold flex items-center gap-2">
              <Pencil className="h-4 w-4 text-primary" /> Compose Email
            </DialogTitle>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto px-5 pb-3 space-y-4">
            <div className="space-y-2">
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Recipients</label>
              {selectedLeads.length > 0 && (
                <div className="flex flex-wrap gap-1.5 max-h-[80px] overflow-y-auto">
                  {selectedLeads.map((l) => (
                    <Badge key={l.id} variant="secondary" className="gap-1 pr-1 text-xs font-normal">
                      <span className="truncate max-w-[140px]">{l.first_name} {l.last_name}</span>
                      <button onClick={() => setSelectedLeads((prev) => prev.filter((s) => s.id !== l.id))} className="ml-0.5 h-4 w-4 rounded-full hover:bg-destructive/20 flex items-center justify-center">
                        <X className="h-2.5 w-2.5" />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                <Input value={leadSearch} onChange={(e) => setLeadSearch(e.target.value)} placeholder="Search your leads..." className="pl-9 h-8 text-xs" />
              </div>
              {leads.length > 0 && (
                <div className="border rounded-lg max-h-[140px] overflow-y-auto divide-y divide-border">
                  <div className="sticky top-0 bg-background px-3 py-1.5 border-b">
                    <button onClick={selectAll} className="text-[11px] text-primary font-medium hover:underline">Select All ({filteredLeads.length})</button>
                  </div>
                  {filteredLeads.map((lead) => {
                    const selected = selectedLeads.some((s) => s.id === lead.id);
                    return (
                      <button key={lead.id} onClick={() => toggleLead(lead)} className={cn("w-full text-left px-3 py-2 flex items-center gap-3 text-sm transition-colors", selected ? "bg-primary/5" : "hover:bg-muted/50")}>
                        <div className={cn("h-5 w-5 rounded border flex items-center justify-center shrink-0 transition-colors", selected ? "bg-primary border-primary" : "border-border")}>
                          {selected && <CheckCircle2 className="h-3 w-3 text-primary-foreground" />}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="font-medium text-xs truncate">{lead.first_name} {lead.last_name}</p>
                          <p className="text-[11px] text-muted-foreground truncate">{lead.email}</p>
                        </div>
                      </button>
                    );
                  })}
                  {filteredLeads.length === 0 && <p className="text-xs text-muted-foreground text-center py-3">No leads found</p>}
                </div>
              )}
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                  <Input value={manualEmail} onChange={(e) => setManualEmail(e.target.value)} onKeyDown={(e) => e.key === "Enter" && addManualEmail()} placeholder="Or type an email address…" className="pl-9 h-8 text-xs" />
                </div>
                <Button variant="outline" size="sm" className="h-8 px-2.5 text-xs gap-1" onClick={addManualEmail}><Plus className="h-3 w-3" /> Add</Button>
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Subject</label>
              <Input value={composeSubject} onChange={(e) => setComposeSubject(e.target.value)} placeholder="Email subject line..." className="text-sm" />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Message</label>
              <Textarea value={composeBody} onChange={(e) => setComposeBody(e.target.value)} placeholder="Write your message here... Use [First Name] to personalize." className="min-h-[160px] text-sm resize-none" />
              <p className="text-[10px] text-muted-foreground">Tip: Use <code className="bg-muted px-1 rounded">[First Name]</code> to personalize for each recipient</p>
            </div>
          </div>
          <div className="px-5 pb-5 pt-3 border-t shrink-0">
            <Button className="w-full h-10 gap-2 font-semibold" onClick={handleSend} disabled={sending || !selectedLeads.length || !composeSubject.trim()}>
              {sending ? <><Loader2 className="h-4 w-4 animate-spin" /> Sending…</> : <><Send className="h-4 w-4" /> Send to {selectedLeads.length} Recipient{selectedLeads.length !== 1 ? "s" : ""}</>}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}

// ── Template Card Component ────────────────────────────────────────

function TemplateCard({
  template,
  onPreview,
  onUse,
  isShared,
}: {
  template: SavedTemplate;
  onPreview: () => void;
  onUse: () => void;
  isShared?: boolean;
}) {
  const previewImg = template.thumbnail_url || template.form_data?.heroImage || null;
  const subject = template.form_data?.copy?.subjectLine || template.form_data?.subject || null;
  const displayName = template.form_data?.copy?.subjectLine || template.name;

  return (
    <div className="group relative rounded-xl border border-border bg-card overflow-hidden hover:border-primary/30 hover:shadow-md transition-all">
      {/* Preview image */}
      <div className="h-40 bg-muted/30 relative cursor-pointer overflow-hidden" onClick={onPreview}>
        {previewImg ? (
          <img src={previewImg} alt={template.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Mail className="h-10 w-10 text-muted-foreground/15" />
          </div>
        )}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all flex items-center justify-center opacity-0 group-hover:opacity-100">
          <Button size="sm" variant="secondary" className="gap-1.5 shadow-lg">
            <Eye className="h-3.5 w-3.5" /> Preview
          </Button>
        </div>
        {isShared && (
          <Badge className="absolute top-2 right-2 text-[9px] h-4 bg-primary/90 text-primary-foreground border-0">Shared</Badge>
        )}
      </div>

      {/* Info */}
      <div className="p-3">
        <p className="text-sm font-semibold truncate">{displayName}</p>
        <div className="flex items-center gap-2 mt-1">
          <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
            <Building2 className="h-3 w-3" />
            <span className="truncate">{template.project_name || "No project"}</span>
          </div>
          <span className="text-[10px] text-muted-foreground/50">·</span>
          <span className="text-[10px] text-muted-foreground">{timeAgo(template.updated_at)}</span>
        </div>
        {subject && subject !== displayName && (
          <p className="text-[11px] text-muted-foreground/70 truncate mt-1">✉ {subject}</p>
        )}
        <div className="flex gap-1.5 mt-2.5">
          <Button variant="outline" size="sm" className="flex-1 h-7 text-[11px] gap-1" onClick={onPreview}>
            <Eye className="h-3 w-3" /> Preview
          </Button>
          <Button size="sm" className="flex-1 h-7 text-[11px] gap-1" onClick={onUse}>
            <Pencil className="h-3 w-3" /> Edit & Send
          </Button>
        </div>
      </div>
    </div>
  );
}
