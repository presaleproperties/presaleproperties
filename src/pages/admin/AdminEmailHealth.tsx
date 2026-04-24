/**
 * Admin Email Health Command Center
 * ─────────────────────────────────────────────────────────────────────────────
 * Single "home base" for monitoring the recommendation-email pipeline:
 *   • Latest scheduled audit status (from `email_audit_runs`)
 *   • Templates that haven't been re-audited recently (or never)
 *   • Top failing link rules from the last N runs
 *   • One-click "Run audit now" — invokes `scheduled-email-audit` with
 *     `?trigger=manual_admin` and refetches the panel.
 *
 * Read-only: this page surfaces audit data already produced by the cron job
 * and the email-builder; it never edits templates or rewrites links.
 */
import { useEffect, useMemo, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { supabase } from "@/integrations/supabase/client";
import { fromTable } from "@/integrations/supabase/db-helpers";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  ShieldCheck, ShieldAlert, ShieldX, RefreshCw, PlayCircle,
  Clock, AlertTriangle, FileText, ExternalLink, Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

// ── Types ────────────────────────────────────────────────────────────────────
type AuditRun = {
  id: string;
  template_key: string;
  status: "ok" | "failed" | "error";
  total_links: number;
  total_errors: number;
  projects_sampled: number;
  errors: Array<{ rule: string; href?: string; context?: string; expected?: string }> | null;
  trigger_source: string;
  duration_ms: number | null;
  ran_at: string;
};

type TemplateRow = {
  id: string;
  name: string;
  template_key: string | null;
  template_type: string;
  updated_at: string;
};

const STALE_THRESHOLD_DAYS = 7;
const RECENT_RUN_LIMIT = 25;

// Friendly labels for audit rule codes
const RULE_LABELS: Record<string, string> = {
  empty_href: "Empty link",
  placeholder_href: "Placeholder link (#)",
  wrong_scheme: "Wrong URL scheme",
  tracked_url_missing_destination: "Tracked URL missing &url=",
  tracked_url_unparseable: "Tracked URL unparseable",
  destination_unparseable: "Destination URL unparseable",
  project_route_wrong_host: "Project link points off-site",
  project_route_invalid: "Project link path is invalid",
  no_projects_available: "No published projects to sample",
  audit_run_failed: "Audit run crashed",
};

function formatRelativeTime(iso: string | null | undefined): string {
  if (!iso) return "—";
  const then = new Date(iso).getTime();
  const diff = Date.now() - then;
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(iso).toLocaleDateString();
}

function StatusIcon({ status, className }: { status: AuditRun["status"]; className?: string }) {
  if (status === "ok") return <ShieldCheck className={cn("text-success", className)} />;
  if (status === "failed") return <ShieldAlert className={cn("text-warning", className)} />;
  return <ShieldX className={cn("text-destructive", className)} />;
}

function StatusBadge({ status }: { status: AuditRun["status"] }) {
  const map = {
    ok: { label: "Passing", cls: "bg-success/15 text-success-strong border-success/30" },
    failed: { label: "Failing", cls: "bg-warning/15 text-warning-strong border-warning/30" },
    error: { label: "Errored", cls: "bg-destructive/15 text-destructive border-destructive/30" },
  } as const;
  const v = map[status] ?? map.error;
  return <Badge variant="outline" className={cn("font-medium", v.cls)}>{v.label}</Badge>;
}

export default function AdminEmailHealth() {
  const [loading, setLoading] = useState(true);
  const [runs, setRuns] = useState<AuditRun[]>([]);
  const [templates, setTemplates] = useState<TemplateRow[]>([]);
  const [running, setRunning] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    const [runsRes, tmplRes] = await Promise.all([
      fromTable(supabase, "email_audit_runs")
        .select("*")
        .order("ran_at", { ascending: false })
        .limit(RECENT_RUN_LIMIT),
      fromTable(supabase, "email_templates")
        .select("id, name, template_key, template_type, updated_at")
        .eq("is_active", true)
        .order("updated_at", { ascending: false }),
    ]);
    if (runsRes.error) toast.error(`Failed to load audit runs: ${runsRes.error.message}`);
    if (tmplRes.error) toast.error(`Failed to load templates: ${tmplRes.error.message}`);
    setRuns((runsRes.data ?? []) as AuditRun[]);
    setTemplates((tmplRes.data ?? []) as TemplateRow[]);
    setLoading(false);
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const runAuditNow = async () => {
    setRunning(true);
    try {
      const { data, error } = await supabase.functions.invoke(
        "scheduled-email-audit?trigger=manual_admin",
        { method: "POST" },
      );
      if (error) throw error;
      const status = (data as { status?: string })?.status;
      if (status === "ok") toast.success("Audit passed — no broken links");
      else toast.warning(`Audit completed with status: ${status ?? "unknown"}`);
      await loadData();
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      toast.error(`Failed to run audit: ${msg}`);
    } finally {
      setRunning(false);
    }
  };

  // ── Derived insights ───────────────────────────────────────────────────────
  const latest = runs[0];
  const lastOk = useMemo(() => runs.find((r) => r.status === "ok") ?? null, [runs]);

  const stalenessThreshold = Date.now() - STALE_THRESHOLD_DAYS * 24 * 60 * 60 * 1000;
  const staleTemplates = useMemo(
    () => templates.filter((t) => new Date(t.updated_at).getTime() < stalenessThreshold),
    [templates, stalenessThreshold],
  );

  const ruleTally = useMemo(() => {
    const counts = new Map<string, number>();
    for (const r of runs) {
      for (const e of r.errors ?? []) {
        counts.set(e.rule, (counts.get(e.rule) ?? 0) + 1);
      }
    }
    return Array.from(counts.entries())
      .map(([rule, count]) => ({ rule, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 6);
  }, [runs]);

  const last7DayRuns = useMemo(() => {
    const cutoff = Date.now() - 7 * 24 * 60 * 60 * 1000;
    return runs.filter((r) => new Date(r.ran_at).getTime() >= cutoff);
  }, [runs]);
  const passRate7d = last7DayRuns.length === 0
    ? null
    : Math.round((last7DayRuns.filter((r) => r.status === "ok").length / last7DayRuns.length) * 100);

  return (
    <AdminLayout>
      <div className="space-y-6 max-w-7xl mx-auto">
        {/* ── Header ────────────────────────────────────────────────────── */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Email Health</h1>
            <p className="text-muted-foreground mt-1 text-sm">
              Monitor scheduled audits, template freshness, and tracked-link integrity for recommendation emails.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={loadData} disabled={loading}>
              <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
              Refresh
            </Button>
            <Button onClick={runAuditNow} disabled={running} className="gap-2">
              {running ? <Loader2 className="h-4 w-4 animate-spin" /> : <PlayCircle className="h-4 w-4" />}
              {running ? "Running…" : "Run audit now"}
            </Button>
          </div>
        </div>

        {/* ── Hero status card ──────────────────────────────────────────── */}
        <Card className="border-2">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <div className="flex items-center gap-3">
                <StatusIcon status={latest?.status ?? "error"} className="h-8 w-8" />
                <div>
                  <CardTitle className="text-xl">
                    {latest ? (
                      latest.status === "ok"
                        ? "All tracked links passing"
                        : latest.status === "failed"
                        ? `${latest.total_errors} broken link${latest.total_errors === 1 ? "" : "s"} detected`
                        : "Audit failed to complete"
                    ) : "No audit runs yet"}
                  </CardTitle>
                  <CardDescription>
                    {latest
                      ? `Last run ${formatRelativeTime(latest.ran_at)} · ${latest.trigger_source} · ${latest.projects_sampled} projects, ${latest.total_links} links`
                      : "Click \"Run audit now\" to perform the first check."}
                  </CardDescription>
                </div>
              </div>
              {latest && <StatusBadge status={latest.status} />}
            </div>
          </CardHeader>
          {latest && latest.status !== "ok" && latest.errors && latest.errors.length > 0 && (
            <CardContent className="border-t pt-4">
              <p className="text-sm font-medium mb-2 flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-warning" />
                Failures in latest run
              </p>
              <ul className="space-y-1.5 text-sm">
                {latest.errors.slice(0, 5).map((e, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <Badge variant="outline" className="font-mono text-xs shrink-0">
                      {RULE_LABELS[e.rule] ?? e.rule}
                    </Badge>
                    <span className="text-muted-foreground truncate">
                      {e.context ?? e.href ?? "—"}
                    </span>
                  </li>
                ))}
                {latest.errors.length > 5 && (
                  <li className="text-xs text-muted-foreground italic">
                    +{latest.errors.length - 5} more in run history below
                  </li>
                )}
              </ul>
            </CardContent>
          )}
        </Card>

        {/* ── Stat strip ────────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatTile
            icon={<Clock className="h-4 w-4" />}
            label="Last passing audit"
            value={lastOk ? formatRelativeTime(lastOk.ran_at) : "Never"}
            tone={lastOk ? "ok" : "danger"}
          />
          <StatTile
            icon={<ShieldCheck className="h-4 w-4" />}
            label="7-day pass rate"
            value={passRate7d === null ? "—" : `${passRate7d}%`}
            tone={passRate7d === null ? "neutral" : passRate7d >= 95 ? "ok" : passRate7d >= 70 ? "warn" : "danger"}
          />
          <StatTile
            icon={<FileText className="h-4 w-4" />}
            label="Active templates"
            value={String(templates.length)}
            tone="neutral"
          />
          <StatTile
            icon={<AlertTriangle className="h-4 w-4" />}
            label={`Stale (>${STALE_THRESHOLD_DAYS}d)`}
            value={String(staleTemplates.length)}
            tone={staleTemplates.length === 0 ? "ok" : staleTemplates.length > 5 ? "danger" : "warn"}
          />
        </div>

        {/* ── Two-column: failing rules + stale templates ───────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Top failing link rules</CardTitle>
              <CardDescription>
                Across the last {runs.length} audit run{runs.length === 1 ? "" : "s"}.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {ruleTally.length === 0 ? (
                <div className="flex items-center gap-2 text-sm text-muted-foreground py-6 justify-center">
                  <ShieldCheck className="h-4 w-4 text-success" />
                  No failures recorded — recommendation emails are clean.
                </div>
              ) : (
                <ul className="space-y-2">
                  {ruleTally.map(({ rule, count }) => (
                    <li
                      key={rule}
                      className="flex items-center justify-between p-2 rounded-md border bg-muted/30"
                    >
                      <span className="text-sm">{RULE_LABELS[rule] ?? rule}</span>
                      <Badge variant="secondary" className="font-mono">
                        {count}× failure{count === 1 ? "" : "s"}
                      </Badge>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Templates needing re-audit</CardTitle>
              <CardDescription>
                Active templates not edited in over {STALE_THRESHOLD_DAYS} days.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {staleTemplates.length === 0 ? (
                <div className="flex items-center gap-2 text-sm text-muted-foreground py-6 justify-center">
                  <ShieldCheck className="h-4 w-4 text-success" />
                  All active templates are fresh.
                </div>
              ) : (
                <ul className="space-y-2 max-h-72 overflow-y-auto">
                  {staleTemplates.slice(0, 12).map((t) => (
                    <li
                      key={t.id}
                      className="flex items-center justify-between gap-2 p-2 rounded-md border bg-muted/30"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium truncate">{t.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {t.template_type} · updated {formatRelativeTime(t.updated_at)}
                        </p>
                      </div>
                      <Button asChild variant="ghost" size="sm" className="shrink-0">
                        <Link to="/admin/email-builder">
                          Open
                          <ExternalLink className="h-3 w-3 ml-1" />
                        </Link>
                      </Button>
                    </li>
                  ))}
                  {staleTemplates.length > 12 && (
                    <li className="text-xs text-muted-foreground italic px-2">
                      +{staleTemplates.length - 12} more not shown
                    </li>
                  )}
                </ul>
              )}
            </CardContent>
          </Card>
        </div>

        {/* ── Run history ───────────────────────────────────────────────── */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Recent audit runs</CardTitle>
            <CardDescription>Last {runs.length} run{runs.length === 1 ? "" : "s"} of the recommendation-email audit.</CardDescription>
          </CardHeader>
          <CardContent className="px-0">
            {loading ? (
              <div className="py-12 flex items-center justify-center text-muted-foreground">
                <Loader2 className="h-5 w-5 animate-spin mr-2" /> Loading…
              </div>
            ) : runs.length === 0 ? (
              <div className="py-12 text-center text-sm text-muted-foreground">
                No audit runs yet. Click "Run audit now" above to perform the first check.
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Status</TableHead>
                    <TableHead>When</TableHead>
                    <TableHead>Trigger</TableHead>
                    <TableHead className="text-right">Links</TableHead>
                    <TableHead className="text-right">Errors</TableHead>
                    <TableHead className="text-right">Projects</TableHead>
                    <TableHead className="text-right">Duration</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {runs.map((r) => (
                    <TableRow key={r.id}>
                      <TableCell><StatusBadge status={r.status} /></TableCell>
                      <TableCell className="text-sm">
                        <div>{formatRelativeTime(r.ran_at)}</div>
                        <div className="text-xs text-muted-foreground">
                          {new Date(r.ran_at).toLocaleString()}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="font-mono text-xs">
                          {r.trigger_source}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right tabular-nums">{r.total_links}</TableCell>
                      <TableCell className={cn("text-right tabular-nums", r.total_errors > 0 && "text-destructive font-medium")}>
                        {r.total_errors}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">{r.projects_sampled}</TableCell>
                      <TableCell className="text-right tabular-nums text-muted-foreground">
                        {r.duration_ms ? `${r.duration_ms}ms` : "—"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}

// ── Small stat tile ────────────────────────────────────────────────────────
function StatTile({
  icon, label, value, tone,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  tone: "ok" | "warn" | "danger" | "neutral";
}) {
  const toneCls = {
    ok: "border-success/30 bg-success/5",
    warn: "border-warning/30 bg-warning/5",
    danger: "border-destructive/30 bg-destructive/5",
    neutral: "",
  }[tone];
  return (
    <Card className={cn("transition-colors", toneCls)}>
      <CardContent className="p-4">
        <div className="flex items-center gap-2 text-xs uppercase tracking-wide text-muted-foreground mb-1">
          {icon}
          <span>{label}</span>
        </div>
        <div className="text-2xl font-bold tabular-nums">{value}</div>
      </CardContent>
    </Card>
  );
}
