import { useEffect, useState, useMemo } from "react";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
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
};

const TEMPLATE_LABELS: Record<string, string> = {
  campaign_template: "Campaign",
  deck_intro: "Deck Intro",
  welcome: "Welcome",
  direct: "Direct",
};

export default function DashboardEmails() {
  const { user } = useAuth();
  const [emails, setEmails] = useState<EmailLog[]>([]);
  const [loading, setLoading] = useState(true);

  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("all");

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

  // Stats
  const totalSent = emails.length;
  const totalOpened = emails.filter((e) => e.open_count > 0).length;
  const openRate = totalSent > 0 ? Math.round((totalOpened / totalSent) * 100) : 0;
  const totalFailed = emails.filter((e) => e.status === "failed").length;
  const recentEmails = emails.filter((e) => isAfter(new Date(e.sent_at), subDays(new Date(), 7))).length;

  return (
    <DashboardLayout>
      <div className="space-y-5">
        <div>
          <h1 className="text-2xl font-bold">Emails</h1>
          <p className="text-sm text-muted-foreground">Track all emails sent to your leads</p>
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
                {searchQuery || statusFilter !== "all" ? "Try adjusting your search." : "Emails sent during onboarding will appear here."}
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
                  {/* Status icon */}
                  <div className={cn("w-8 h-8 rounded-full flex items-center justify-center shrink-0", statusConf.className)}>
                    <StatusIcon className="h-4 w-4" />
                  </div>

                  {/* Content */}
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

                  {/* Timestamp */}
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

                  {/* Error indicator */}
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
    </DashboardLayout>
  );
}
