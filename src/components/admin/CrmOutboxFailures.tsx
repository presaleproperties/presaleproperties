/**
 * CRM Outbox Failures Panel
 *
 * Shows the messages that the drain worker gave up on (status = 'failed' or
 * 'dead'). Lets ops:
 *   - Inspect last_error + payload
 *   - Retry one row (resets attempts/next_attempt_at, drain picks it up)
 *   - Discard a row permanently (mark as 'dead')
 *   - Bulk retry all failed
 *
 * Runs alongside <CrmOutboxHealth /> on /admin/crm-sync-status.
 */

import { useCallback, useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  RefreshCw,
  AlertTriangle,
  Trash2,
  RotateCcw,
  Eye,
  Skull,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface FailedRow {
  id: string;
  kind: string;
  endpoint: string;
  status: "failed" | "dead" | string;
  attempts: number;
  last_error: string | null;
  email: string | null;
  payload: any;
  created_at: string;
  updated_at: string;
}

export function CrmOutboxFailures() {
  const [rows, setRows] = useState<FailedRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [bulkBusy, setBulkBusy] = useState(false);
  const [inspecting, setInspecting] = useState<FailedRow | null>(null);

  const load = useCallback(async () => {
    const { data, error } = await (supabase as any)
      .from("crm_outbox")
      .select("id, kind, endpoint, status, attempts, last_error, email, payload, created_at, updated_at")
      .in("status", ["failed", "dead"])
      .order("updated_at", { ascending: false })
      .limit(100);

    if (error) {
      toast.error("Failed to load outbox failures", { description: error.message });
    } else {
      setRows((data || []) as FailedRow[]);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const retryOne = async (row: FailedRow) => {
    setBusyId(row.id);
    const { error } = await (supabase as any)
      .from("crm_outbox")
      .update({
        status: "failed",
        attempts: 0,
        next_attempt_at: new Date().toISOString(),
        last_error: null,
      })
      .eq("id", row.id);

    if (error) {
      toast.error("Retry failed", { description: error.message });
    } else {
      // Kick the drain worker
      supabase.functions.invoke("drain-crm-outbox", { body: {} }).catch(() => {});
      toast.success("Queued for retry");
      await load();
    }
    setBusyId(null);
  };

  const discardOne = async (row: FailedRow) => {
    if (!confirm(`Permanently discard this ${row.kind} message? This cannot be undone.`)) return;
    setBusyId(row.id);
    const { error } = await (supabase as any)
      .from("crm_outbox")
      .update({ status: "dead", last_error: "Manually discarded by admin" })
      .eq("id", row.id);

    if (error) toast.error("Discard failed", { description: error.message });
    else { toast.success("Discarded"); await load(); }
    setBusyId(null);
  };

  const retryAllFailed = async () => {
    const failed = rows.filter((r) => r.status === "failed");
    if (failed.length === 0) return;
    if (!confirm(`Retry all ${failed.length} failed message${failed.length === 1 ? "" : "s"}?`)) return;

    setBulkBusy(true);
    const { error } = await (supabase as any)
      .from("crm_outbox")
      .update({
        attempts: 0,
        next_attempt_at: new Date().toISOString(),
        last_error: null,
      })
      .in("id", failed.map((r) => r.id));

    if (error) {
      toast.error("Bulk retry failed", { description: error.message });
    } else {
      supabase.functions.invoke("drain-crm-outbox", { body: {} }).catch(() => {});
      toast.success(`Queued ${failed.length} message${failed.length === 1 ? "" : "s"} for retry`);
      await load();
    }
    setBulkBusy(false);
  };

  const failedCount = rows.filter((r) => r.status === "failed").length;
  const deadCount = rows.filter((r) => r.status === "dead").length;

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between gap-4">
            <div>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-destructive" />
                Failed CRM Deliveries
              </CardTitle>
              <CardDescription>
                Messages the drain worker could not deliver to DealsFlow. Retry restarts the
                exponential-backoff schedule; discard removes them permanently.
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={load} disabled={loading}>
                <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
                Refresh
              </Button>
              <Button
                variant="default"
                size="sm"
                onClick={retryAllFailed}
                disabled={bulkBusy || failedCount === 0}
              >
                <RotateCcw className={`h-4 w-4 mr-2 ${bulkBusy ? "animate-spin" : ""}`} />
                Retry all failed ({failedCount})
              </Button>
            </div>
          </div>

          <div className="flex gap-2 mt-3">
            <Badge variant="destructive">{failedCount} failed</Badge>
            <Badge variant="outline" className="border-muted-foreground/30">
              <Skull className="h-3 w-3 mr-1" /> {deadCount} dead
            </Badge>
          </div>
        </CardHeader>

        <CardContent>
          {loading ? (
            <div className="space-y-2">
              {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-14 w-full" />)}
            </div>
          ) : rows.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground text-sm">
              ✓ No failed deliveries — outbox is healthy.
            </div>
          ) : (
            <div className="space-y-2">
              {rows.map((row) => (
                <div
                  key={row.id}
                  className="flex items-start justify-between gap-3 p-3 rounded-md border bg-muted/30"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <Badge variant={row.status === "dead" ? "outline" : "destructive"}>
                        {row.status === "dead" ? <Skull className="h-3 w-3 mr-1" /> : null}
                        {row.status}
                      </Badge>
                      <span className="text-sm font-medium">{row.kind}</span>
                      <span className="text-xs text-muted-foreground">→ {row.endpoint}</span>
                      <span className="text-xs text-muted-foreground">
                        · {row.attempts} attempt{row.attempts === 1 ? "" : "s"}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        · {formatDistanceToNow(new Date(row.updated_at), { addSuffix: true })}
                      </span>
                    </div>
                    {row.email && (
                      <div className="text-xs text-muted-foreground mb-1">
                        {row.email}
                      </div>
                    )}
                    {row.last_error && (
                      <div className="text-xs text-destructive font-mono truncate">
                        {row.last_error}
                      </div>
                    )}
                  </div>

                  <div className="flex gap-1 flex-shrink-0">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setInspecting(row)}
                      title="Inspect payload"
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => retryOne(row)}
                      disabled={busyId === row.id}
                      title="Retry"
                    >
                      <RotateCcw
                        className={`h-4 w-4 ${busyId === row.id ? "animate-spin" : ""}`}
                      />
                    </Button>
                    {row.status !== "dead" && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => discardOne(row)}
                        disabled={busyId === row.id}
                        title="Discard"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={!!inspecting} onOpenChange={(o) => !o && setInspecting(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Outbox payload</DialogTitle>
            <DialogDescription>
              {inspecting?.kind} → {inspecting?.endpoint}
            </DialogDescription>
          </DialogHeader>
          {inspecting && (
            <div className="space-y-3">
              {inspecting.last_error && (
                <div>
                  <div className="text-xs font-medium mb-1">Last error</div>
                  <pre className="text-xs bg-destructive/10 text-destructive p-2 rounded overflow-auto max-h-32">
                    {inspecting.last_error}
                  </pre>
                </div>
              )}
              <div>
                <div className="text-xs font-medium mb-1">Payload</div>
                <pre className="text-xs bg-muted p-2 rounded overflow-auto max-h-96">
                  {JSON.stringify(inspecting.payload, null, 2)}
                </pre>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
