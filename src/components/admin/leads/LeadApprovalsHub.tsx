/**
 * LeadApprovalsHub
 * ─────────────────────────────────────────────────────────────────────────
 * Self-contained Lead Approvals UI (no AdminLayout wrapper) so it can be
 * embedded inside the unified AdminLeads workspace tabs.
 */
import { useEffect, useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import {
  CheckCircle2,
  XCircle,
  Mail,
  Phone,
  Clock,
  AlertTriangle,
  Search,
  ShieldAlert,
  Sparkles,
  ExternalLink,
  Bell,
  BellOff,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import {
  pushSupported,
  getCurrentSubscription,
  enablePushNotifications,
  disablePushNotifications,
} from "@/lib/pushNotifications";

type ApprovalStatus = "pending" | "approved" | "rejected";

interface LeadRow {
  id: string;
  name: string | null;
  email: string | null;
  phone: string | null;
  message: string | null;
  lead_source: string | null;
  persona: string | null;
  agent_status: string | null;
  project_id: string | null;
  project_name: string | null;
  approval_status: ApprovalStatus;
  approved_at: string | null;
  rejection_reason: string | null;
  realtor_risk_score: number;
  realtor_risk_signals: Array<{ type: string; weight: number; detail: string }>;
  auto_response_sent_at: string | null;
  created_at: string;
  utm_source: string | null;
  utm_campaign: string | null;
}

function riskBadge(score: number) {
  if (score >= 60) {
    return (
      <Badge variant="destructive" className="gap-1">
        <ShieldAlert className="h-3 w-3" /> High risk · {score}
      </Badge>
    );
  }
  if (score >= 30) {
    return (
      <Badge variant="secondary" className="gap-1">
        <AlertTriangle className="h-3 w-3" /> Medium · {score}
      </Badge>
    );
  }
  return (
    <Badge variant="outline" className="gap-1">
      <CheckCircle2 className="h-3 w-3" /> Low · {score}
    </Badge>
  );
}

export function LeadApprovalsHub() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [tab, setTab] = useState<ApprovalStatus>("pending");
  const [search, setSearch] = useState("");
  const [acting, setActing] = useState<string | null>(null);
  const [rejectingLead, setRejectingLead] = useState<LeadRow | null>(null);
  const [rejectReason, setRejectReason] = useState("");

  const { data: leads, isLoading } = useQuery({
    queryKey: ["admin", "lead-approvals", tab],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("project_leads")
        .select(
          "id, name, email, phone, message, lead_source, persona, agent_status, project_id, approval_status, approved_at, rejection_reason, realtor_risk_score, realtor_risk_signals, auto_response_sent_at, created_at, utm_source, utm_campaign, presale_projects(project_name)",
        )
        .eq("approval_status", tab)
        .order("created_at", { ascending: false })
        .limit(200);
      if (error) throw error;
      return ((data ?? []) as any[]).map((row) => ({
        ...row,
        project_name: row.presale_projects?.project_name ?? null,
      })) as LeadRow[];
    },
    refetchInterval: tab === "pending" ? 30_000 : false,
  });

  const { data: pendingCount } = useQuery({
    queryKey: ["admin", "lead-approvals", "count", "pending"],
    queryFn: async () => {
      const { count } = await supabase
        .from("project_leads")
        .select("id", { count: "exact", head: true })
        .eq("approval_status", "pending");
      return count ?? 0;
    },
    refetchInterval: 30_000,
  });

  const filtered = useMemo(() => {
    if (!leads) return [];
    const q = search.trim().toLowerCase();
    if (!q) return leads;
    return leads.filter(
      (l) =>
        l.name?.toLowerCase().includes(q) ||
        l.email?.toLowerCase().includes(q) ||
        l.phone?.toLowerCase().includes(q) ||
        l.lead_source?.toLowerCase().includes(q),
    );
  }, [leads, search]);

  async function act(leadId: string, action: "approve" | "reject", reason?: string) {
    setActing(leadId);
    try {
      const { data, error } = await supabase.functions.invoke("approve-lead", {
        body: { leadId, action, reason },
      });
      if (error) throw error;
      toast({
        title: action === "approve" ? "Lead approved" : "Lead rejected",
        description:
          action === "approve"
            ? data?.autoResponseFired
              ? "Auto-response email sent."
              : "Approved, but auto-response failed to send. Check edge function logs."
            : "Lead marked as rejected. No email sent.",
      });
      queryClient.invalidateQueries({ queryKey: ["admin", "lead-approvals"] });
    } catch (err: any) {
      toast({
        title: "Action failed",
        description: err?.message ?? "Unknown error",
        variant: "destructive",
      });
    } finally {
      setActing(null);
      setRejectingLead(null);
      setRejectReason("");
    }
  }

  useEffect(() => {
    document.title = "Lead Approvals — Admin";
  }, []);

  // Push notification subscription state
  const [pushEnabled, setPushEnabled] = useState(false);
  const [pushBusy, setPushBusy] = useState(false);
  const isPushSupported = pushSupported();

  useEffect(() => {
    if (!isPushSupported) return;
    getCurrentSubscription().then((s) => setPushEnabled(!!s));
  }, [isPushSupported]);

  async function togglePush() {
    setPushBusy(true);
    try {
      if (pushEnabled) {
        const r = await disablePushNotifications();
        if (!r.ok) throw new Error(r.error);
        setPushEnabled(false);
        toast({ title: "Notifications off", description: "You'll no longer receive lead push alerts on this device." });
      } else {
        const r = await enablePushNotifications();
        if (!r.ok) throw new Error(r.error);
        setPushEnabled(true);
        toast({ title: "Notifications on ✓", description: "You'll get a push alert with Approve/Reject buttons for new pending leads." });
      }
    } catch (err: any) {
      toast({ title: "Notification setup failed", description: err?.message ?? "Unknown error", variant: "destructive" });
    } finally {
      setPushBusy(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h2 className="text-xl font-semibold tracking-tight flex items-center gap-2">
            Lead Approvals
            {!!pendingCount && pendingCount > 0 && (
              <Badge variant="destructive" className="ml-2">
                {pendingCount} pending
              </Badge>
            )}
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Review project lead form submissions before the auto-response email goes out.
            Approve verified buyers; reject suspected realtors.
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          {isPushSupported && (
            <Button
              size="sm"
              variant={pushEnabled ? "secondary" : "outline"}
              disabled={pushBusy}
              onClick={togglePush}
              className="gap-1.5"
            >
              {pushEnabled ? <Bell className="h-3.5 w-3.5" /> : <BellOff className="h-3.5 w-3.5" />}
              {pushBusy ? "…" : pushEnabled ? "Push on" : "Enable push"}
            </Button>
          )}
          <Sparkles className="h-3 w-3" /> Risk score combines persona, brokerage email
          domain, message keywords, and submission frequency.
        </div>
      </div>

      <Tabs value={tab} onValueChange={(v) => setTab(v as ApprovalStatus)}>
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <TabsList>
            <TabsTrigger value="pending" className="gap-2">
              <Clock className="h-3.5 w-3.5" /> Pending
              {!!pendingCount && pendingCount > 0 && (
                <span className="ml-1 inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full bg-destructive text-destructive-foreground text-[10px] font-semibold">
                  {pendingCount}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="approved">Approved</TabsTrigger>
            <TabsTrigger value="rejected">Rejected</TabsTrigger>
          </TabsList>
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search name, email, phone…"
              className="pl-8 h-9"
            />
          </div>
        </div>

        <TabsContent value={tab} className="mt-4 space-y-3">
          {isLoading && (
            <Card>
              <CardContent className="p-8 text-center text-muted-foreground">
                Loading leads…
              </CardContent>
            </Card>
          )}

          {!isLoading && filtered.length === 0 && (
            <Card>
              <CardContent className="p-10 text-center text-muted-foreground">
                {tab === "pending"
                  ? "🎉 No leads waiting for approval."
                  : `No ${tab} leads.`}
              </CardContent>
            </Card>
          )}

          {filtered.map((lead) => (
            <Card key={lead.id} className="overflow-hidden">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-3 flex-wrap">
                  <div className="space-y-1">
                    <CardTitle className="text-base flex items-center gap-2 flex-wrap">
                      {lead.name || "Anonymous"}
                      {riskBadge(lead.realtor_risk_score)}
                      {lead.persona === "realtor" && (
                        <Badge variant="destructive">Self-declared realtor</Badge>
                      )}
                    </CardTitle>
                    <div className="text-xs text-muted-foreground flex items-center gap-3 flex-wrap">
                      <span className="flex items-center gap-1">
                        <Mail className="h-3 w-3" /> {lead.email || "—"}
                      </span>
                      <span className="flex items-center gap-1">
                        <Phone className="h-3 w-3" /> {lead.phone || "—"}
                      </span>
                      <span>
                        {formatDistanceToNow(new Date(lead.created_at), { addSuffix: true })}
                      </span>
                      {lead.utm_source && (
                        <Badge variant="outline" className="text-[10px]">
                          {lead.utm_source}
                          {lead.utm_campaign ? ` · ${lead.utm_campaign}` : ""}
                        </Badge>
                      )}
                      {lead.lead_source && (
                        <Badge variant="outline" className="text-[10px]">
                          {lead.lead_source}
                        </Badge>
                      )}
                    </div>
                  </div>

                  {tab === "pending" && (
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={acting === lead.id}
                        onClick={() => {
                          setRejectingLead(lead);
                          setRejectReason("");
                        }}
                      >
                        <XCircle className="h-4 w-4 mr-1" /> Reject
                      </Button>
                      <Button
                        size="sm"
                        disabled={acting === lead.id}
                        onClick={() => act(lead.id, "approve")}
                      >
                        <CheckCircle2 className="h-4 w-4 mr-1" />
                        {acting === lead.id ? "Sending…" : "Approve & send email"}
                      </Button>
                    </div>
                  )}
                </div>
              </CardHeader>
              <CardContent className="pt-0 space-y-3">
                {lead.message && (
                  <div className="text-sm bg-muted/40 rounded-md px-3 py-2 border border-border/40">
                    “{lead.message}”
                  </div>
                )}

                {lead.realtor_risk_signals?.length > 0 && (
                  <div className="space-y-1">
                    <div className="text-[11px] uppercase tracking-wide text-muted-foreground font-semibold">
                      Risk signals
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {lead.realtor_risk_signals.map((s, i) => (
                        <Badge
                          key={i}
                          variant="outline"
                          className="text-[10px] font-normal"
                          title={`+${s.weight} pts`}
                        >
                          {s.type.replace(/_/g, " ")}: {s.detail}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {tab !== "pending" && (
                  <div className="text-xs text-muted-foreground space-y-0.5">
                    {lead.approved_at && (
                      <div>
                        {tab === "approved" ? "Approved" : "Rejected"}:{" "}
                        {formatDistanceToNow(new Date(lead.approved_at), { addSuffix: true })}
                        {lead.auto_response_sent_at && tab === "approved" && (
                          <span className="ml-2 text-primary">· Email sent</span>
                        )}
                      </div>
                    )}
                    {lead.rejection_reason && (
                      <div>Reason: {lead.rejection_reason}</div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </TabsContent>
      </Tabs>

      <Dialog open={!!rejectingLead} onOpenChange={(o) => !o && setRejectingLead(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject lead?</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              No auto-response email will be sent to{" "}
              <strong>{rejectingLead?.email}</strong>. The lead stays in the database.
            </p>
            <Textarea
              placeholder="Optional internal note (e.g. 'Suspected realtor — RE/MAX domain')"
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              maxLength={500}
              rows={3}
            />
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setRejectingLead(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              disabled={acting === rejectingLead?.id}
              onClick={() =>
                rejectingLead && act(rejectingLead.id, "reject", rejectReason || undefined)
              }
            >
              Reject lead
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
