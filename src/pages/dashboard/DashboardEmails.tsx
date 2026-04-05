import { useEffect, useState, useMemo, useCallback } from "react";
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
} from "lucide-react";
import { format, subDays, isAfter } from "date-fns";
import { cn } from "@/lib/utils";

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

export default function DashboardEmails() {
  const { user } = useAuth();
  const [emails, setEmails] = useState<EmailLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("all");

  // Compose state
  const [composeOpen, setComposeOpen] = useState(false);
  const [leads, setLeads] = useState<OnboardedLead[]>([]);
  const [selectedLeads, setSelectedLeads] = useState<OnboardedLead[]>([]);
  const [leadSearch, setLeadSearch] = useState("");
  const [composeSubject, setComposeSubject] = useState("");
  const [composeBody, setComposeBody] = useState("");
  const [sending, setSending] = useState(false);
  const [manualEmail, setManualEmail] = useState("");

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
      (l) =>
        l.first_name.toLowerCase().includes(q) ||
        l.last_name.toLowerCase().includes(q) ||
        l.email.toLowerCase().includes(q)
    );
  }, [leads, leadSearch]);

  const toggleLead = (lead: OnboardedLead) => {
    setSelectedLeads((prev) =>
      prev.some((l) => l.id === lead.id)
        ? prev.filter((l) => l.id !== lead.id)
        : [...prev, lead]
    );
  };

  const addManualEmail = () => {
    const email = manualEmail.trim().toLowerCase();
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      toast.error("Enter a valid email address");
      return;
    }
    if (selectedLeads.some((l) => l.email === email)) {
      toast.error("Already added");
      return;
    }
    const name = email.split("@")[0];
    setSelectedLeads((prev) => [
      ...prev,
      { id: `manual-${Date.now()}`, first_name: name, last_name: "", email },
    ]);
    setManualEmail("");
  };

  const selectAll = () => {
    const toAdd = filteredLeads.filter(
      (l) => !selectedLeads.some((s) => s.id === l.id)
    );
    setSelectedLeads((prev) => [...prev, ...toAdd]);
  };

  const handleSend = async () => {
    if (!selectedLeads.length) {
      toast.error("Select at least one recipient");
      return;
    }
    if (!composeSubject.trim()) {
      toast.error("Subject line is required");
      return;
    }
    if (!composeBody.trim()) {
      toast.error("Email body is required");
      return;
    }

    setSending(true);
    try {
      // Build simple HTML email
      const bodyHtml = composeBody
        .split("\n")
        .map((line) => (line.trim() ? `<p style="margin:0 0 12px;font-size:15px;color:#444;line-height:1.7;">${line}</p>` : "<br/>"))
        .join("");

      const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1.0"></head>
<body style="margin:0;padding:0;background:#f7f5f2;font-family:'Plus Jakarta Sans',Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f7f5f2;"><tr><td align="center" style="padding:32px 16px;">
<table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border:1px solid #e0dbd3;border-radius:8px;overflow:hidden;">
<tr><td style="padding:32px;">
${bodyHtml}
</td></tr>
<tr><td style="padding:16px 32px 32px;">
<p style="margin:0;font-size:13px;color:#aaa;line-height:1.5;">Presale Properties &middot; <a href="https://presaleproperties.com" style="color:#888;text-decoration:underline;">presaleproperties.com</a></p>
</td></tr>
</table></td></tr></table>
</body></html>`;

      const recipients = selectedLeads.map((l) => ({
        email: l.email,
        name: `${l.first_name} ${l.last_name}`.trim(),
        firstName: l.first_name,
      }));

      // Fetch agent name for fromName
      const { data: profile } = await supabase
        .from("profiles")
        .select("full_name")
        .eq("user_id", user!.id)
        .single();

      const agentFirst = profile?.full_name?.split(" ")[0] || "";
      const fromName = agentFirst
        ? `Presale Properties | ${agentFirst}`
        : "Presale Properties";

      const { data, error } = await supabase.functions.invoke("send-builder-email", {
        body: { subject: composeSubject, html, recipients, fromName },
      });

      if (error) throw error;

      if (data.sent > 0) {
        toast.success(`Email sent to ${data.sent} recipient${data.sent > 1 ? "s" : ""}`);
        setComposeOpen(false);
        fetchEmails();
      } else {
        toast.error("All sends failed");
      }
    } catch (err: any) {
      console.error("Send error:", err);
      toast.error(err.message || "Failed to send email");
    } finally {
      setSending(false);
    }
  };

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

  const totalSent = emails.length;
  const totalOpened = emails.filter((e) => e.open_count > 0).length;
  const openRate = totalSent > 0 ? Math.round((totalOpened / totalSent) * 100) : 0;
  const recentEmails = emails.filter((e) => isAfter(new Date(e.sent_at), subDays(new Date(), 7))).length;

  return (
    <DashboardLayout>
      <div className="space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Emails</h1>
            <p className="text-sm text-muted-foreground">Send & track emails to your leads</p>
          </div>
          <Button onClick={openCompose} className="gap-2">
            <Pencil className="h-4 w-4" /> Compose
          </Button>
        </div>

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
            <Input
              placeholder="Search recipient, subject..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 text-sm h-9"
            />
          </div>
          <div className="flex gap-2">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[120px] text-sm h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="sent">Sent</SelectItem>
                <SelectItem value="opened">Opened</SelectItem>
                <SelectItem value="failed">Failed</SelectItem>
              </SelectContent>
            </Select>
            <Select value={dateFilter} onValueChange={setDateFilter}>
              <SelectTrigger className="w-[120px] text-sm h-9">
                <Clock className="h-3 w-3 mr-1 text-muted-foreground" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {DATE_FILTERS.map((f) => (
                  <SelectItem key={f.value} value={f.value}>{f.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Email List */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : filtered.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Mail className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
              <p className="font-medium">{searchQuery || statusFilter !== "all" ? "No emails match filters" : "No emails sent yet"}</p>
              <p className="text-sm text-muted-foreground mt-1">
                {searchQuery || statusFilter !== "all" ? "Try adjusting your search." : "Use the Compose button to send your first email."}
              </p>
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
                <div
                  key={email.id}
                  className={cn(
                    "flex items-center gap-3 p-3 rounded-lg border transition-colors",
                    email.open_count > 0 ? "border-blue-500/20 bg-blue-500/5" : "border-border"
                  )}
                >
                  <div className={cn("w-8 h-8 rounded-full flex items-center justify-center shrink-0", statusConf.className)}>
                    <StatusIcon className="h-4 w-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-medium text-sm truncate">
                        {email.recipient_name || email.email_to}
                      </p>
                      {email.template_type && (
                        <Badge variant="outline" className="text-[10px] h-4 px-1.5">
                          {TEMPLATE_LABELS[email.template_type] || email.template_type}
                        </Badge>
                      )}
                      {email.open_count > 0 && (
                        <Badge className="text-[10px] h-4 px-1.5 bg-blue-500/10 text-blue-500 border-0 gap-0.5">
                          <Eye className="h-2.5 w-2.5" /> {email.open_count}x
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground truncate mt-0.5">{email.subject}</p>
                    {email.recipient_name && (
                      <p className="text-[11px] text-muted-foreground/70 truncate">{email.email_to}</p>
                    )}
                  </div>
                  <div className="text-right shrink-0 hidden sm:block">
                    <p className="text-[11px] text-muted-foreground">
                      {format(new Date(email.sent_at), "MMM d")}
                    </p>
                    <p className="text-[10px] text-muted-foreground/60">
                      {format(new Date(email.sent_at), "h:mm a")}
                    </p>
                    {email.last_opened_at && (
                      <p className="text-[10px] text-blue-500 mt-0.5">
                        Opened {format(new Date(email.last_opened_at), "MMM d")}
                      </p>
                    )}
                  </div>
                  {email.status === "failed" && email.error_message && (
                    <div className="shrink-0" title={email.error_message}>
                      <AlertCircle className="h-4 w-4 text-red-500" />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Compose Dialog */}
      <Dialog open={composeOpen} onOpenChange={setComposeOpen}>
        <DialogContent className="sm:max-w-[560px] p-0 gap-0 overflow-hidden max-h-[90vh] flex flex-col">
          <DialogHeader className="px-5 pt-5 pb-3 shrink-0">
            <DialogTitle className="text-base font-semibold flex items-center gap-2">
              <Pencil className="h-4 w-4 text-primary" />
              Compose Email
            </DialogTitle>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto px-5 pb-3 space-y-4">
            {/* Recipients */}
            <div className="space-y-2">
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Recipients
              </label>

              {/* Selected chips */}
              {selectedLeads.length > 0 && (
                <div className="flex flex-wrap gap-1.5 max-h-[80px] overflow-y-auto">
                  {selectedLeads.map((l) => (
                    <Badge key={l.id} variant="secondary" className="gap-1 pr-1 text-xs font-normal">
                      <span className="truncate max-w-[140px]">{l.first_name} {l.last_name}</span>
                      <button
                        onClick={() => setSelectedLeads((prev) => prev.filter((s) => s.id !== l.id))}
                        className="ml-0.5 h-4 w-4 rounded-full hover:bg-destructive/20 flex items-center justify-center"
                      >
                        <X className="h-2.5 w-2.5" />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}

              {/* Lead search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                <Input
                  value={leadSearch}
                  onChange={(e) => setLeadSearch(e.target.value)}
                  placeholder="Search your leads..."
                  className="pl-9 h-8 text-xs"
                />
              </div>

              {/* Lead list */}
              {leads.length > 0 && (
                <div className="border rounded-lg max-h-[140px] overflow-y-auto divide-y divide-border">
                  <div className="sticky top-0 bg-background px-3 py-1.5 border-b">
                    <button
                      onClick={selectAll}
                      className="text-[11px] text-primary font-medium hover:underline"
                    >
                      Select All ({filteredLeads.length})
                    </button>
                  </div>
                  {filteredLeads.map((lead) => {
                    const selected = selectedLeads.some((s) => s.id === lead.id);
                    return (
                      <button
                        key={lead.id}
                        onClick={() => toggleLead(lead)}
                        className={cn(
                          "w-full text-left px-3 py-2 flex items-center gap-3 text-sm transition-colors",
                          selected ? "bg-primary/5" : "hover:bg-muted/50"
                        )}
                      >
                        <div className={cn(
                          "h-5 w-5 rounded border flex items-center justify-center shrink-0 transition-colors",
                          selected ? "bg-primary border-primary" : "border-border"
                        )}>
                          {selected && <CheckCircle2 className="h-3 w-3 text-primary-foreground" />}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="font-medium text-xs truncate">{lead.first_name} {lead.last_name}</p>
                          <p className="text-[11px] text-muted-foreground truncate">{lead.email}</p>
                        </div>
                      </button>
                    );
                  })}
                  {filteredLeads.length === 0 && (
                    <p className="text-xs text-muted-foreground text-center py-3">No leads found</p>
                  )}
                </div>
              )}

              {/* Manual email */}
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                  <Input
                    value={manualEmail}
                    onChange={(e) => setManualEmail(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && addManualEmail()}
                    placeholder="Or type an email address…"
                    className="pl-9 h-8 text-xs"
                  />
                </div>
                <Button variant="outline" size="sm" className="h-8 px-2.5 text-xs gap-1" onClick={addManualEmail}>
                  <Plus className="h-3 w-3" /> Add
                </Button>
              </div>
            </div>

            {/* Subject */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Subject</label>
              <Input
                value={composeSubject}
                onChange={(e) => setComposeSubject(e.target.value)}
                placeholder="Email subject line..."
                className="text-sm"
              />
            </div>

            {/* Body */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Message</label>
              <Textarea
                value={composeBody}
                onChange={(e) => setComposeBody(e.target.value)}
                placeholder="Write your message here... Use [First Name] to personalize."
                className="min-h-[160px] text-sm resize-none"
              />
              <p className="text-[10px] text-muted-foreground">
                Tip: Use <code className="bg-muted px-1 rounded">[First Name]</code> to personalize for each recipient
              </p>
            </div>
          </div>

          {/* Send button */}
          <div className="px-5 pb-5 pt-3 border-t shrink-0">
            <Button
              className="w-full h-10 gap-2 font-semibold"
              onClick={handleSend}
              disabled={sending || !selectedLeads.length || !composeSubject.trim()}
            >
              {sending ? (
                <><Loader2 className="h-4 w-4 animate-spin" /> Sending…</>
              ) : (
                <><Send className="h-4 w-4" /> Send to {selectedLeads.length} Recipient{selectedLeads.length !== 1 ? "s" : ""}</>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
