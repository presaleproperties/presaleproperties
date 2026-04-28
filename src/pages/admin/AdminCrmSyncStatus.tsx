import { useEffect, useState, useCallback } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { StatusBadge as SharedStatusBadge } from "@/components/ui/status-badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { RefreshCw, PlayCircle, CheckCircle2, XCircle, Loader2, Clock, ArrowDownToLine, ArrowUpFromLine } from "lucide-react";
import { formatDistanceToNow, format } from "date-fns";
import { CrmOutboxHealth } from "@/components/admin/CrmOutboxHealth";
import { CrmOutboxFailures } from "@/components/admin/CrmOutboxFailures";

interface SyncRun {
  id: string;
  sync_type: string;
  status: "running" | "success" | "failed" | string;
  triggered_by: string;
  started_at: string;
  finished_at: string | null;
  duration_ms: number | null;
  pulled_count: number | null;
  pushed_count: number | null;
  error_message: string | null;
  result: any;
}

function StatusBadge({ status }: { status: string }) {
  const Icon = status === "success" ? CheckCircle2 : status === "failed" ? XCircle : Loader2;
  return (
    <SharedStatusBadge
      status={status}
      icon={<Icon className={`h-3 w-3 ${status === "running" ? "animate-spin" : ""}`} />}
    />
  );
}

function formatDuration(ms: number | null) {
  if (!ms && ms !== 0) return "—";
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(1)}s`;
}

export default function AdminCrmSyncStatus() {
  const [runs, setRuns] = useState<SyncRun[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);

  const loadRuns = useCallback(async () => {
    const { data, error } = await supabase
      .from("crm_sync_runs")
      .select("*")
      .eq("sync_type", "templates")
      .order("started_at", { ascending: false })
      .limit(50);

    if (error) {
      toast.error("Failed to load sync history", { description: error.message });
    } else {
      setRuns((data || []) as SyncRun[]);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    loadRuns();
    // Auto-refresh every 10s while a run is in progress
    const interval = setInterval(() => {
      if (runs.some((r) => r.status === "running")) loadRuns();
    }, 10000);
    return () => clearInterval(interval);
  }, [loadRuns, runs]);

  const triggerSync = async () => {
    setSyncing(true);
    try {
      const { data, error } = await supabase.functions.invoke("sync-templates-with-crm", {
        body: { triggered_by: "manual" },
      });
      if (error) throw error;
      toast.success("Sync completed", {
        description: `Pulled ${data?.pulled ?? 0} • Pushed ${data?.pushed ?? 0}`,
      });
      await loadRuns();
    } catch (err: any) {
      toast.error("Sync failed", { description: err?.message || String(err) });
      await loadRuns();
    } finally {
      setSyncing(false);
    }
  };

  const lastRun = runs[0];
  const lastSuccess = runs.find((r) => r.status === "success");
  const lastFailure = runs.find((r) => r.status === "failed");

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">CRM Sync Status</h1>
            <p className="text-muted-foreground">
              Email template synchronization with DealzFlow CRM
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={loadRuns} disabled={loading}>
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
              Refresh
            </Button>
            <Button onClick={triggerSync} disabled={syncing}>
              {syncing ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <PlayCircle className="h-4 w-4 mr-2" />
              )}
              {syncing ? "Syncing…" : "Run sync now"}
            </Button>
          </div>
        </div>

        {/* Outbox health — Phase A success metric */}
        <CrmOutboxHealth />

        {/* Failed/dead messages with retry + discard */}
        <CrmOutboxFailures />

        {/* Summary cards */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="pb-2">
              <CardDescription className="flex items-center gap-2">
                <Clock className="h-3.5 w-3.5" /> Last run
              </CardDescription>
              <CardTitle className="text-xl">
                {loading ? (
                  <Skeleton className="h-6 w-32" />
                ) : lastRun ? (
                  formatDistanceToNow(new Date(lastRun.started_at), { addSuffix: true })
                ) : (
                  "Never"
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {lastRun && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <StatusBadge status={lastRun.status} />
                  <span>•</span>
                  <span>{formatDuration(lastRun.duration_ms)}</span>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardDescription className="flex items-center gap-2">
                <CheckCircle2 className="h-3.5 w-3.5 text-success" /> Last successful run
              </CardDescription>
              <CardTitle className="text-xl">
                {loading ? (
                  <Skeleton className="h-6 w-32" />
                ) : lastSuccess ? (
                  formatDistanceToNow(new Date(lastSuccess.started_at), { addSuffix: true })
                ) : (
                  "—"
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {lastSuccess && (
                <div className="flex items-center gap-3 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <ArrowDownToLine className="h-3 w-3" /> {lastSuccess.pulled_count ?? 0} pulled
                  </span>
                  <span className="flex items-center gap-1">
                    <ArrowUpFromLine className="h-3 w-3" /> {lastSuccess.pushed_count ?? 0} pushed
                  </span>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardDescription className="flex items-center gap-2">
                <XCircle className="h-3.5 w-3.5 text-destructive" /> Last failure
              </CardDescription>
              <CardTitle className="text-xl">
                {loading ? (
                  <Skeleton className="h-6 w-32" />
                ) : lastFailure ? (
                  formatDistanceToNow(new Date(lastFailure.started_at), { addSuffix: true })
                ) : (
                  "None ✨"
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {lastFailure?.error_message && (
                <p className="text-xs text-destructive line-clamp-2" title={lastFailure.error_message}>
                  {lastFailure.error_message}
                </p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* History */}
        <Card>
          <CardHeader>
            <CardTitle>Recent sync runs</CardTitle>
            <CardDescription>Last 50 template sync executions</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-2">
                {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
              </div>
            ) : runs.length === 0 ? (
              <div className="py-12 text-center text-muted-foreground">
                <p>No sync runs yet.</p>
                <p className="text-sm mt-1">Click "Run sync now" to trigger the first sync.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Started</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Trigger</TableHead>
                      <TableHead className="text-right">Pulled</TableHead>
                      <TableHead className="text-right">Pushed</TableHead>
                      <TableHead className="text-right">Duration</TableHead>
                      <TableHead>Notes</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {runs.map((run) => (
                      <TableRow key={run.id}>
                        <TableCell className="font-mono text-xs">
                          {format(new Date(run.started_at), "MMM d, HH:mm:ss")}
                        </TableCell>
                        <TableCell><StatusBadge status={run.status} /></TableCell>
                        <TableCell>
                          <Badge variant="secondary" className="text-[10px]">
                            {run.triggered_by}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right tabular-nums">
                          {run.pulled_count ?? "—"}
                        </TableCell>
                        <TableCell className="text-right tabular-nums">
                          {run.pushed_count ?? "—"}
                        </TableCell>
                        <TableCell className="text-right text-muted-foreground tabular-nums">
                          {formatDuration(run.duration_ms)}
                        </TableCell>
                        <TableCell className="max-w-[280px] truncate text-xs text-muted-foreground" title={run.error_message || ""}>
                          {run.error_message || "—"}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
