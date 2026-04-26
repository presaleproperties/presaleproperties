/**
 * CRM Outbox Health Widget
 *
 * Phase A success metric: prove the outbox path is delivering reliably
 * before we cut Zapier in Phase B. Renders a live status breakdown of
 * `crm_outbox` plus the last 24h throughput per kind/endpoint.
 *
 * Drop into any admin page:
 *   <CrmOutboxHealth />
 */

import { useCallback, useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { RefreshCw, PlayCircle, CheckCircle2, AlertTriangle, Clock, Inbox, Loader2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

type Status = "pending" | "delivered" | "failed" | "dead_letter" | string;

interface StatusCount {
  status: Status;
  count: number;
}

interface RecentRow {
  id: string;
  kind: string;
  endpoint: string;
  status: Status;
  attempts: number;
  last_error: string | null;
  created_at: string;
  synced_at: string | null;
}

const STATUS_META: Record<string, { label: string; tone: string; icon: typeof Clock }> = {
  pending:     { label: "Pending",      tone: "bg-amber-500/15 text-amber-700 dark:text-amber-300",  icon: Clock },
  delivered:   { label: "Delivered",    tone: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300", icon: CheckCircle2 },
  failed:      { label: "Retrying",     tone: "bg-orange-500/15 text-orange-700 dark:text-orange-300", icon: AlertTriangle },
  dead_letter: { label: "Dead-letter",  tone: "bg-destructive/15 text-destructive",                   icon: AlertTriangle },
};

export function CrmOutboxHealth() {
  const [counts, setCounts] = useState<StatusCount[]>([]);
  const [recent, setRecent] = useState<RecentRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [draining, setDraining] = useState(false);
  const [lastLoadedAt, setLastLoadedAt] = useState<Date | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      // Status breakdown — entire table (cheap, indexed on status)
      const { data: statusRows, error: statusErr } = await (supabase as any)
        .from("crm_outbox")
        .select("status")
        .limit(10000);
      if (statusErr) throw statusErr;
      const tally = new Map<string, number>();
      for (const r of statusRows ?? []) {
        tally.set(r.status, (tally.get(r.status) ?? 0) + 1);
      }
      setCounts(
        Array.from(tally.entries())
          .map(([status, count]) => ({ status, count }))
          .sort((a, b) => b.count - a.count),
      );

      // Recent activity (last 25)
      const { data: rows, error: rowsErr } = await (supabase as any)
        .from("crm_outbox")
        .select("id, kind, endpoint, status, attempts, last_error, created_at, synced_at")
        .order("created_at", { ascending: false })
        .limit(25);
      if (rowsErr) throw rowsErr;
      setRecent((rows ?? []) as RecentRow[]);
      setLastLoadedAt(new Date());
    } catch (err: any) {
      toast.error("Failed to load outbox health", { description: err?.message || String(err) });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    const t = setInterval(load, 30_000);
    return () => clearInterval(t);
  }, [load]);

  const handleDrain = async () => {
    setDraining(true);
    try {
      const { data, error } = await supabase.functions.invoke("drain-crm-outbox", { body: {} });
      if (error) throw error;
      toast.success("Drain triggered", {
        description: data?.processed != null ? `Processed ${data.processed}` : "Worker kicked",
      });
      await load();
    } catch (err: any) {
      toast.error("Drain failed", { description: err?.message || String(err) });
    } finally {
      setDraining(false);
    }
  };

  const get = (s: string) => counts.find((c) => c.status === s)?.count ?? 0;
  const pending = get("pending");
  const delivered = get("delivered");
  const failed = get("failed");
  const dead = get("dead_letter");
  const total = counts.reduce((sum, c) => sum + c.count, 0);
  const successRate = total > 0 ? Math.round((delivered / total) * 100) : 0;

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between gap-2 space-y-0">
        <div>
          <CardTitle className="flex items-center gap-2">
            <Inbox className="h-5 w-5" /> CRM Outbox Health
          </CardTitle>
          <CardDescription>
            Durable delivery queue — every CRM-bound message lands here first.{" "}
            {lastLoadedAt && (
              <span className="text-xs">
                Updated {formatDistanceToNow(lastLoadedAt, { addSuffix: true })}.
              </span>
            )}
          </CardDescription>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={load} disabled={loading}>
            <RefreshCw className={`h-3.5 w-3.5 mr-1.5 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
          <Button size="sm" onClick={handleDrain} disabled={draining}>
            {draining ? (
              <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
            ) : (
              <PlayCircle className="h-3.5 w-3.5 mr-1.5" />
            )}
            Drain now
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* KPI row */}
        <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
          <Kpi label="Total" value={loading ? null : total} />
          <Kpi label="Delivered" value={loading ? null : delivered} accent="text-emerald-600" />
          <Kpi label="Pending" value={loading ? null : pending} accent="text-amber-600" />
          <Kpi label="Retrying" value={loading ? null : failed} accent="text-orange-600" />
          <Kpi
            label="Success rate"
            value={loading ? null : `${successRate}%`}
            accent={successRate >= 95 ? "text-emerald-600" : successRate >= 80 ? "text-amber-600" : "text-destructive"}
          />
        </div>
        {dead > 0 && (
          <div className="flex items-center gap-2 rounded-md border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
            <AlertTriangle className="h-4 w-4" />
            <span>
              <strong>{dead}</strong> dead-lettered message{dead === 1 ? "" : "s"} need manual review.
            </span>
          </div>
        )}

        {/* Recent rows */}
        <div>
          <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground mb-2">
            Last 25 messages
          </div>
          {loading ? (
            <div className="space-y-1.5">
              {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-9 w-full" />)}
            </div>
          ) : recent.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">
              No outbox messages yet — submit a lead to see this fill up.
            </p>
          ) : (
            <div className="rounded-md border divide-y">
              {recent.map((row) => {
                const meta = STATUS_META[row.status] ?? { label: row.status, tone: "bg-muted text-muted-foreground", icon: Clock };
                const Icon = meta.icon;
                return (
                  <div key={row.id} className="flex items-center gap-3 px-3 py-2 text-sm">
                    <Badge className={`${meta.tone} border-0 gap-1`} variant="secondary">
                      <Icon className="h-3 w-3" />
                      {meta.label}
                    </Badge>
                    <Badge variant="outline" className="text-[10px] uppercase">
                      {row.kind}
                    </Badge>
                    <span className="font-mono text-xs text-muted-foreground truncate flex-1" title={row.endpoint}>
                      {row.endpoint}
                    </span>
                    {row.attempts > 1 && (
                      <span className="text-xs text-muted-foreground">×{row.attempts}</span>
                    )}
                    <span className="text-xs text-muted-foreground whitespace-nowrap">
                      {formatDistanceToNow(new Date(row.created_at), { addSuffix: true })}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function Kpi({ label, value, accent }: { label: string; value: number | string | null; accent?: string }) {
  return (
    <div className="rounded-md border p-3">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className={`mt-1 text-2xl font-semibold tabular-nums ${accent ?? ""}`}>
        {value === null ? <Skeleton className="h-7 w-12" /> : value}
      </div>
    </div>
  );
}
