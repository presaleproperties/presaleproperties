/**
 * AdminAlertsConfig — single Notification Rules page.
 * ─────────────────────────────────────────────────────────────────────────────
 * One screen to configure WHEN we alert (rules + thresholds) and WHERE we
 * deliver (email + Slack incoming-webhook). Each rule has an enable switch
 * and, where applicable, a threshold input. The two delivery channels at the
 * top apply to every rule — i.e. "audit failed" goes to whichever channel(s)
 * are turned on globally.
 *
 * Rules covered:
 *   • Hot lead         — lead_score ≥ threshold (existing behavior)
 *   • Sync failure     — lead_sync_log row with non-success status (existing)
 *   • Daily digest     — once-per-day summary (existing)
 *   • Audit failure    — scheduled-email-audit run with status ≠ ok
 *   • Bounce spike     — ≥ N bounces in last hour (configurable)
 *   • Click anomaly    — drop in click-through ≥ X% vs prior period
 *
 * Each section has a "Send test" button that hits alert-dispatcher with the
 * matching `type` so admins can confirm the channel actually delivers.
 */
import { useEffect, useState } from "react";
import { AdminPage } from "@/components/admin/AdminPage";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  Bell, Flame, AlertTriangle, Calendar, FlaskConical,
  Mail, MessageSquare, ShieldAlert, MailX, MousePointerClick, Send,
} from "lucide-react";

interface AlertConfig {
  id: string;
  recipient_email: string;
  // Channels
  email_enabled: boolean;
  slack_enabled: boolean;
  slack_webhook_url: string | null;
  // Existing rules
  hot_lead_enabled: boolean;
  hot_lead_threshold: number;
  sync_failure_enabled: boolean;
  daily_digest_enabled: boolean;
  digest_hour_utc: number;
  // New rules
  audit_failure_enabled: boolean;
  bounce_spike_enabled: boolean;
  bounce_spike_threshold: number;
  click_anomaly_enabled: boolean;
  click_anomaly_drop_pct: number;
  // Misc (kept on this page since it's the only "settings" surface)
  meta_test_mode: boolean;
  meta_test_event_code: string | null;
}

type TestType =
  | "test"
  | "hot_lead"
  | "sync_failure"
  | "daily_digest"
  | "audit_failure"
  | "bounce_spike"
  | "click_anomaly";

export default function AdminAlertsConfig() {
  const [cfg, setCfg] = useState<AlertConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState<TestType | null>(null);

  useEffect(() => {
    supabase.from("alert_config").select("*").maybeSingle().then(({ data }) => {
      setCfg(data as unknown as AlertConfig);
      setLoading(false);
    });
  }, []);

  const update = <K extends keyof AlertConfig>(k: K, v: AlertConfig[K]) =>
    setCfg((c) => (c ? { ...c, [k]: v } : c));

  const save = async () => {
    if (!cfg) return;
    setSaving(true);
    const { id, ...patch } = cfg;
    const { error } = await supabase
      .from("alert_config")
      // The newer columns aren't in generated types yet — cast safely
      .update({ ...(patch as Record<string, unknown>), updated_at: new Date().toISOString() })
      .eq("id", id);
    setSaving(false);
    if (error) toast.error("Could not save", { description: error.message });
    else toast.success("Notification rules saved");
  };

  const sendTest = async (type: TestType) => {
    setTesting(type);
    try {
      const { error } = await supabase.functions.invoke("alert-dispatcher", {
        body: { type, recipient: cfg?.recipient_email },
      });
      if (error) toast.error("Test failed", { description: error.message });
      else toast.success(`Test sent (${type.replace(/_/g, " ")})`);
    } finally {
      setTesting(null);
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="p-6 max-w-3xl space-y-4">
          <Skeleton className="h-12 w-72" />
          <Skeleton className="h-64 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      </AdminLayout>
    );
  }
  if (!cfg) {
    return (
      <AdminLayout>
        <div className="p-6">No alert config row found.</div>
      </AdminLayout>
    );
  }

  // Tiny helper for the enabled/threshold/test layout shared by every rule
  const RuleRow = ({
    enabled, onToggle, testType, children,
  }: {
    enabled: boolean;
    onToggle: (v: boolean) => void;
    testType: TestType;
    children?: React.ReactNode;
  }) => (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <Label>Enabled</Label>
        <Switch checked={enabled} onCheckedChange={onToggle} />
      </div>
      {children}
      <Button
        type="button"
        size="sm"
        variant="outline"
        onClick={() => sendTest(testType)}
        disabled={testing === testType || (!cfg.email_enabled && !cfg.slack_enabled)}
        className="gap-1"
      >
        <Send className="h-3.5 w-3.5" />
        {testing === testType ? "Sending…" : "Send test"}
      </Button>
    </div>
  );

  const noChannel = !cfg.email_enabled && !cfg.slack_enabled;

  return (
    <AdminLayout>
      <div className="space-y-6 p-6 max-w-3xl">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Bell className="h-7 w-7" />Notification rules
          </h1>
          <p className="text-muted-foreground">
            One place to configure when we alert and where the alerts go. Each
            rule below uses the global Email + Slack delivery settings.
          </p>
        </div>

        {/* ── Delivery channels ─────────────────────────────────────────── */}
        <Card>
          <CardHeader>
            <CardTitle>Delivery channels</CardTitle>
            <CardDescription>
              Where every enabled rule below will be sent. You can use one or both.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            {/* Email */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="flex items-center gap-2">
                  <Mail className="h-4 w-4" /> Email
                  <Badge variant={cfg.email_enabled ? "default" : "outline"} className="ml-1 text-[10px]">
                    {cfg.email_enabled ? "ON" : "OFF"}
                  </Badge>
                </Label>
                <Switch
                  checked={cfg.email_enabled}
                  onCheckedChange={(v) => update("email_enabled", v)}
                />
              </div>
              <div>
                <Label>Recipient email</Label>
                <Input
                  type="email"
                  value={cfg.recipient_email}
                  onChange={(e) => update("recipient_email", e.target.value)}
                  placeholder="alerts@yourdomain.com"
                />
              </div>
            </div>

            <Separator />

            {/* Slack */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="flex items-center gap-2">
                  <MessageSquare className="h-4 w-4" /> Slack
                  <Badge variant={cfg.slack_enabled ? "default" : "outline"} className="ml-1 text-[10px]">
                    {cfg.slack_enabled ? "ON" : "OFF"}
                  </Badge>
                </Label>
                <Switch
                  checked={cfg.slack_enabled}
                  onCheckedChange={(v) => update("slack_enabled", v)}
                />
              </div>
              <div>
                <Label>Slack incoming-webhook URL</Label>
                <Input
                  type="url"
                  value={cfg.slack_webhook_url ?? ""}
                  onChange={(e) => update("slack_webhook_url", e.target.value || null)}
                  placeholder="https://hooks.slack.com/services/T…/B…/…"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Create a webhook in your Slack workspace under{" "}
                  <em>Apps → Incoming Webhooks</em>, pick a channel, and paste
                  the URL here. We post a simple message — no extra permissions.
                </p>
              </div>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => sendTest("test")}
                disabled={testing === "test" || noChannel}
                className="gap-1"
              >
                <Send className="h-3.5 w-3.5" />
                {testing === "test" ? "Sending…" : "Send test to all enabled channels"}
              </Button>
              {noChannel && (
                <p className="text-xs text-destructive">
                  No delivery channel enabled — rules will save but won't deliver.
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* ── Rules ─────────────────────────────────────────────────────── */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Flame className="h-5 w-5 text-destructive" /> Hot lead
            </CardTitle>
            <CardDescription>Instant alert when a lead scores above the threshold.</CardDescription>
          </CardHeader>
          <CardContent>
            <RuleRow
              enabled={cfg.hot_lead_enabled}
              onToggle={(v) => update("hot_lead_enabled", v)}
              testType="hot_lead"
            >
              <div>
                <Label>Score threshold (0–100)</Label>
                <Input
                  type="number" min={0} max={100}
                  value={cfg.hot_lead_threshold}
                  onChange={(e) => update("hot_lead_threshold", Number(e.target.value))}
                />
              </div>
            </RuleRow>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShieldAlert className="h-5 w-5 text-amber-600" /> Email audit failure
            </CardTitle>
            <CardDescription>
              Fires whenever the scheduled recommendation-email audit reports
              broken or off-site project links.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <RuleRow
              enabled={cfg.audit_failure_enabled}
              onToggle={(v) => update("audit_failure_enabled", v)}
              testType="audit_failure"
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MailX className="h-5 w-5 text-destructive" /> Bounce spike
            </CardTitle>
            <CardDescription>
              Alerts when more than the threshold number of email sends bounce
              in the last hour — useful for catching list-quality issues fast.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <RuleRow
              enabled={cfg.bounce_spike_enabled}
              onToggle={(v) => update("bounce_spike_enabled", v)}
              testType="bounce_spike"
            >
              <div>
                <Label>Bounces per hour threshold</Label>
                <Input
                  type="number" min={1} max={1000}
                  value={cfg.bounce_spike_threshold}
                  onChange={(e) => update("bounce_spike_threshold", Number(e.target.value))}
                />
              </div>
            </RuleRow>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MousePointerClick className="h-5 w-5 text-primary" /> Click anomaly
            </CardTitle>
            <CardDescription>
              Alerts when click-through on tracked email links drops by more
              than the configured percent versus the prior comparable period.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <RuleRow
              enabled={cfg.click_anomaly_enabled}
              onToggle={(v) => update("click_anomaly_enabled", v)}
              testType="click_anomaly"
            >
              <div>
                <Label>Drop threshold (%)</Label>
                <Input
                  type="number" min={5} max={95}
                  value={cfg.click_anomaly_drop_pct}
                  onChange={(e) => update("click_anomaly_drop_pct", Number(e.target.value))}
                />
              </div>
            </RuleRow>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" /> Lead-sync failure
            </CardTitle>
            <CardDescription>Alerts when a Lofty / Meta CAPI sync errors out.</CardDescription>
          </CardHeader>
          <CardContent>
            <RuleRow
              enabled={cfg.sync_failure_enabled}
              onToggle={(v) => update("sync_failure_enabled", v)}
              testType="sync_failure"
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" /> Daily digest
            </CardTitle>
            <CardDescription>Once-a-day summary of leads, conversions, and sync health.</CardDescription>
          </CardHeader>
          <CardContent>
            <RuleRow
              enabled={cfg.daily_digest_enabled}
              onToggle={(v) => update("daily_digest_enabled", v)}
              testType="daily_digest"
            >
              <div>
                <Label>Send hour (UTC, 0–23)</Label>
                <Input
                  type="number" min={0} max={23}
                  value={cfg.digest_hour_utc}
                  onChange={(e) => update("digest_hour_utc", Number(e.target.value))}
                />
              </div>
            </RuleRow>
          </CardContent>
        </Card>

        {/* Meta CAPI test mode kept here as it's the existing settings home */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FlaskConical className="h-5 w-5" /> Meta CAPI test mode
            </CardTitle>
            <CardDescription>
              Route Meta Conversion API events to a test bucket so live ads
              aren't affected.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <Label>
                Test mode{" "}
                <Badge variant="secondary" className="ml-2">
                  {cfg.meta_test_mode ? "ON" : "OFF"}
                </Badge>
              </Label>
              <Switch
                checked={cfg.meta_test_mode}
                onCheckedChange={(v) => update("meta_test_mode", v)}
              />
            </div>
            <div>
              <Label>Test event code (from Meta Events Manager)</Label>
              <Input
                placeholder="TEST12345"
                value={cfg.meta_test_event_code || ""}
                onChange={(e) => update("meta_test_event_code", e.target.value)}
              />
            </div>
          </CardContent>
        </Card>

        <div className="flex gap-2 sticky bottom-4 bg-background/80 backdrop-blur p-3 -mx-3 rounded-lg border border-border">
          <Button onClick={save} disabled={saving}>
            {saving ? "Saving…" : "Save notification rules"}
          </Button>
        </div>
      </div>
    </AdminLayout>
  );
}
