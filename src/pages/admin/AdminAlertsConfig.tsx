/**
 * AdminAlertsConfig — configure email alerts (hot leads, sync failures,
 * daily digest) + Meta CAPI test mode toggle.
 */
import { useEffect, useState } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Bell, Flame, AlertTriangle, Calendar, FlaskConical } from "lucide-react";

interface AlertConfig {
  id: string;
  recipient_email: string;
  hot_lead_enabled: boolean;
  hot_lead_threshold: number;
  sync_failure_enabled: boolean;
  daily_digest_enabled: boolean;
  digest_hour_utc: number;
  meta_test_mode: boolean;
  meta_test_event_code: string | null;
}

export default function AdminAlertsConfig() {
  const [cfg, setCfg] = useState<AlertConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    supabase.from("alert_config").select("*").maybeSingle().then(({ data }) => {
      setCfg(data as AlertConfig);
      setLoading(false);
    });
  }, []);

  const save = async () => {
    if (!cfg) return;
    setSaving(true);
    const { error } = await supabase.from("alert_config").update({
      recipient_email: cfg.recipient_email,
      hot_lead_enabled: cfg.hot_lead_enabled,
      hot_lead_threshold: cfg.hot_lead_threshold,
      sync_failure_enabled: cfg.sync_failure_enabled,
      daily_digest_enabled: cfg.daily_digest_enabled,
      digest_hour_utc: cfg.digest_hour_utc,
      meta_test_mode: cfg.meta_test_mode,
      meta_test_event_code: cfg.meta_test_event_code,
      updated_at: new Date().toISOString(),
    }).eq("id", cfg.id);
    setSaving(false);
    if (error) toast.error("Could not save", { description: error.message });
    else toast.success("Settings saved");
  };

  const sendTest = async () => {
    const { error } = await supabase.functions.invoke("alert-dispatcher", {
      body: { type: "test", recipient: cfg?.recipient_email },
    });
    if (error) toast.error("Test failed", { description: error.message });
    else toast.success("Test alert sent");
  };

  if (loading) return <AdminLayout><div className="p-6"><Skeleton className="h-96" /></div></AdminLayout>;
  if (!cfg) return <AdminLayout><div className="p-6">No config row.</div></AdminLayout>;

  return (
    <AdminLayout>
      <div className="space-y-6 p-6 max-w-3xl">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2"><Bell className="h-7 w-7" />Alerts & test mode</h1>
          <p className="text-muted-foreground">Email notifications for hot leads, sync failures, and daily summaries.</p>
        </div>

        <Card>
          <CardHeader><CardTitle>Recipient</CardTitle><CardDescription>Where alerts are sent.</CardDescription></CardHeader>
          <CardContent>
            <Label>Email address</Label>
            <Input value={cfg.recipient_email} onChange={e => setCfg({ ...cfg, recipient_email: e.target.value })} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><Flame className="h-5 w-5 text-destructive" />Hot lead alerts</CardTitle><CardDescription>Instant email when a lead scores above threshold.</CardDescription></CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <Label>Enabled</Label>
              <Switch checked={cfg.hot_lead_enabled} onCheckedChange={v => setCfg({ ...cfg, hot_lead_enabled: v })} />
            </div>
            <div>
              <Label>Score threshold (0-100)</Label>
              <Input type="number" min={0} max={100} value={cfg.hot_lead_threshold} onChange={e => setCfg({ ...cfg, hot_lead_threshold: Number(e.target.value) })} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><AlertTriangle className="h-5 w-5" />Sync failure alerts</CardTitle><CardDescription>Email when Lofty / Meta CAPI sync errors out.</CardDescription></CardHeader>
          <CardContent className="flex items-center justify-between">
            <Label>Enabled</Label>
            <Switch checked={cfg.sync_failure_enabled} onCheckedChange={v => setCfg({ ...cfg, sync_failure_enabled: v })} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><Calendar className="h-5 w-5" />Daily digest</CardTitle><CardDescription>Once-a-day summary of leads, spend, and conversions.</CardDescription></CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <Label>Enabled</Label>
              <Switch checked={cfg.daily_digest_enabled} onCheckedChange={v => setCfg({ ...cfg, daily_digest_enabled: v })} />
            </div>
            <div>
              <Label>Send hour (UTC, 0-23)</Label>
              <Input type="number" min={0} max={23} value={cfg.digest_hour_utc} onChange={e => setCfg({ ...cfg, digest_hour_utc: Number(e.target.value) })} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><FlaskConical className="h-5 w-5" />Meta CAPI test mode</CardTitle>
            <CardDescription>Route Meta Conversion API events to a test bucket so live ads aren't affected.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <Label>Test mode <Badge variant="secondary" className="ml-2">{cfg.meta_test_mode ? "ON" : "OFF"}</Badge></Label>
              <Switch checked={cfg.meta_test_mode} onCheckedChange={v => setCfg({ ...cfg, meta_test_mode: v })} />
            </div>
            <div>
              <Label>Test event code (from Meta Events Manager)</Label>
              <Input placeholder="TEST12345" value={cfg.meta_test_event_code || ""} onChange={e => setCfg({ ...cfg, meta_test_event_code: e.target.value })} />
            </div>
          </CardContent>
        </Card>

        <div className="flex gap-2">
          <Button onClick={save} disabled={saving}>{saving ? "Saving…" : "Save settings"}</Button>
          <Button variant="outline" onClick={sendTest}>Send test email</Button>
        </div>
      </div>
    </AdminLayout>
  );
}
