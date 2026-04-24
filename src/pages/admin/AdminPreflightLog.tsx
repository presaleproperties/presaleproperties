/**
 * Admin Preflight Send Log
 * ─────────────────────────────────────────────────────────────────────────
 * Reviews the last N send attempts and their pre-flight checklist results
 * (pass / warn / blocked) so admins can troubleshoot repeatedly blocked
 * sends. Pulls from `preflight_send_log`.
 */
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { formatDistanceToNow } from "date-fns";
import {
  AlertTriangle,
  CheckCircle2,
  CircleAlert,
  Filter,
  RefreshCw,
  Search,
  ShieldAlert,
  ShieldCheck,
  Send as SendIcon,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

interface PreflightCheck {
  id: string;
  label: string;
  status: "pass" | "fail" | "warn";
  blocking: boolean;
  detail?: string;
}

interface PreflightLogRow {
  id: string;
  created_at: string;
  user_id: string | null;
  asset_id: string | null;
  template_label: string | null;
  subject: string | null;
  recipient_count: number;
  status: "passed" | "passed_with_warnings" | "blocked";
  total_checks: number;
  passed_count: number;
  warn_count: number;
  blocker_count: number;
  send_attempted: boolean;
  send_succeeded: boolean | null;
  send_error: string | null;
  checks: PreflightCheck[];
}

const LIMIT_OPTIONS = [25, 50, 100, 200];

export default function AdminPreflightLog() {
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [limit, setLimit] = useState(50);

  const { data, isLoading, refetch, isFetching } = useQuery({
    queryKey: ["preflight-send-log", limit],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("preflight_send_log")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(limit);
      if (error) throw error;
      return (data || []) as PreflightLogRow[];
    },
  });

  const filtered = useMemo(() => {
    let rows = data || [];
    if (statusFilter !== "all") rows = rows.filter((r) => r.status === statusFilter);
    const q = search.trim().toLowerCase();
    if (q) {
      rows = rows.filter(
        (r) =>
          (r.template_label || "").toLowerCase().includes(q) ||
          (r.subject || "").toLowerCase().includes(q) ||
          (r.send_error || "").toLowerCase().includes(q),
      );
    }
    return rows;
  }, [data, statusFilter, search]);

  const stats = useMemo(() => {
    const rows = data || [];
    const total = rows.length;
    const blocked = rows.filter((r) => r.status === "blocked").length;
    const passed = rows.filter((r) => r.status === "passed").length;
    const warn = rows.filter((r) => r.status === "passed_with_warnings").length;
    const failedSends = rows.filter((r) => r.send_attempted && r.send_succeeded === false).length;
    return { total, blocked, passed, warn, failedSends };
  }, [data]);

  // Surface assets that are repeatedly blocked — strong signal for triage.
  const repeatOffenders = useMemo(() => {
    const counts = new Map<string, { label: string; count: number; lastAt: string }>();
    for (const r of (data || []).filter((r) => r.status === "blocked")) {
      const key = r.template_label || r.asset_id || "(unknown)";
      const prev = counts.get(key);
      if (prev) {
        prev.count++;
        if (r.created_at > prev.lastAt) prev.lastAt = r.created_at;
      } else {
        counts.set(key, { label: key, count: 1, lastAt: r.created_at });
      }
    }
    return [...counts.values()]
      .filter((x) => x.count >= 2)
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  }, [data]);

  return (
    <AdminLayout>
    <div className="container mx-auto py-8 px-4 space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <ShieldCheck className="h-6 w-6 text-primary" />
            Pre-flight Send Log
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Compliance status for the last {limit} send attempts. Use this to troubleshoot
            repeatedly blocked sends.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isFetching}>
          <RefreshCw className={cn("h-4 w-4 mr-2", isFetching && "animate-spin")} />
          Refresh
        </Button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <StatCard label="Attempts" value={stats.total} icon={SendIcon} />
        <StatCard label="Passed clean" value={stats.passed} icon={CheckCircle2} tone="ok" />
        <StatCard label="With warnings" value={stats.warn} icon={CircleAlert} tone="warn" />
        <StatCard label="Blocked" value={stats.blocked} icon={ShieldAlert} tone="error" />
        <StatCard label="Sends failed" value={stats.failedSends} icon={AlertTriangle} tone="error" />
      </div>

      {/* Repeat offenders */}
      {repeatOffenders.length > 0 && (
        <Card className="border-destructive/30 bg-destructive/5">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-destructive" />
              Repeatedly blocked templates
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <ul className="space-y-1.5">
              {repeatOffenders.map((o) => (
                <li
                  key={o.label}
                  className="flex items-center justify-between gap-3 text-xs"
                >
                  <span className="font-medium truncate">{o.label}</span>
                  <span className="flex items-center gap-2 shrink-0 text-muted-foreground">
                    <Badge variant="destructive" className="text-[10px] h-5">
                      {o.count} blocks
                    </Badge>
                    <span>last {formatDistanceToNow(new Date(o.lastAt), { addSuffix: true })}</span>
                  </span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Filters */}
      <Card>
        <CardContent className="pt-4 flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[220px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search template, subject, error…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 h-9"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[180px] h-9">
              <Filter className="h-3.5 w-3.5 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              <SelectItem value="passed">Passed</SelectItem>
              <SelectItem value="passed_with_warnings">With warnings</SelectItem>
              <SelectItem value="blocked">Blocked</SelectItem>
            </SelectContent>
          </Select>
          <Select value={String(limit)} onValueChange={(v) => setLimit(Number(v))}>
            <SelectTrigger className="w-[140px] h-9">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {LIMIT_OPTIONS.map((n) => (
                <SelectItem key={n} value={String(n)}>
                  Last {n}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* Log table */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-4 space-y-2">
              {[...Array(6)].map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="p-12 text-center text-sm text-muted-foreground">
              No pre-flight log entries match your filters.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[140px]">Time</TableHead>
                  <TableHead>Template / Subject</TableHead>
                  <TableHead className="w-[140px]">Status</TableHead>
                  <TableHead className="w-[120px]">Checks</TableHead>
                  <TableHead className="w-[110px]">Recipients</TableHead>
                  <TableHead className="w-[120px]">Send result</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((row) => (
                  <LogRow key={row.id} row={row} />
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

function StatCard({
  label,
  value,
  icon: Icon,
  tone,
}: {
  label: string;
  value: number;
  icon: React.ComponentType<{ className?: string }>;
  tone?: "ok" | "warn" | "error";
}) {
  return (
    <Card>
      <CardContent className="p-4 flex items-center justify-between">
        <div>
          <p className="text-[11px] uppercase tracking-wider text-muted-foreground">{label}</p>
          <p className="text-2xl font-bold mt-1">{value}</p>
        </div>
        <Icon
          className={cn(
            "h-7 w-7 opacity-80",
            tone === "ok" && "text-success",
            tone === "warn" && "text-warning",
            tone === "error" && "text-destructive",
            !tone && "text-muted-foreground",
          )}
        />
      </CardContent>
    </Card>
  );
}

function LogRow({ row }: { row: PreflightLogRow }) {
  const [open, setOpen] = useState(false);
  const statusBadge =
    row.status === "passed" ? (
      <Badge className="bg-success/15 text-success-strong dark:text-success hover:bg-success/20">
        Passed
      </Badge>
    ) : row.status === "passed_with_warnings" ? (
      <Badge className="bg-warning/15 text-warning-strong dark:text-warning hover:bg-warning/20">
        Warnings
      </Badge>
    ) : (
      <Badge variant="destructive">Blocked</Badge>
    );

  return (
    <>
      <TableRow
        className="cursor-pointer hover:bg-muted/40"
        onClick={() => setOpen((o) => !o)}
      >
        <TableCell className="text-xs text-muted-foreground">
          {formatDistanceToNow(new Date(row.created_at), { addSuffix: true })}
        </TableCell>
        <TableCell>
          <div className="font-medium text-sm truncate max-w-[420px]">
            {row.template_label || "(untitled)"}
          </div>
          <div className="text-xs text-muted-foreground truncate max-w-[420px]">
            {row.subject || <span className="italic">no subject</span>}
          </div>
        </TableCell>
        <TableCell>{statusBadge}</TableCell>
        <TableCell>
          <div className="flex items-center gap-1 text-xs">
            <span className="text-success font-semibold">{row.passed_count}</span>
            <span className="text-muted-foreground">/</span>
            <span className="text-warning font-semibold">{row.warn_count}</span>
            <span className="text-muted-foreground">/</span>
            <span className="text-destructive font-semibold">{row.blocker_count}</span>
          </div>
          <div className="text-[10px] text-muted-foreground">pass / warn / block</div>
        </TableCell>
        <TableCell className="text-sm">{row.recipient_count}</TableCell>
        <TableCell className="text-xs">
          {!row.send_attempted ? (
            <span className="text-muted-foreground italic">not sent</span>
          ) : row.send_succeeded ? (
            <span className="inline-flex items-center gap-1 text-success font-medium">
              <CheckCircle2 className="h-3 w-3" /> Sent
            </span>
          ) : row.send_succeeded === false ? (
            <span className="inline-flex items-center gap-1 text-destructive font-medium">
              <AlertTriangle className="h-3 w-3" /> Failed
            </span>
          ) : (
            <span className="text-muted-foreground">—</span>
          )}
        </TableCell>
      </TableRow>
      {open && (
        <TableRow>
          <TableCell colSpan={6} className="bg-muted/30 p-4">
            <div className="space-y-3">
              <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Check breakdown
              </div>
              <ul className="space-y-1.5">
                {row.checks.map((c, i) => (
                  <li
                    key={`${c.id}-${i}`}
                    className="flex items-start gap-2 text-xs leading-relaxed"
                  >
                    <span
                      className={cn(
                        "mt-1 inline-block h-2 w-2 rounded-full shrink-0",
                        c.status === "pass" && "bg-success",
                        c.status === "warn" && "bg-warning",
                        c.status === "fail" && "bg-destructive",
                      )}
                    />
                    <div className="min-w-0 flex-1">
                      <span className="font-semibold text-foreground">{c.label}</span>
                      {c.blocking && c.status !== "pass" && (
                        <Badge variant="outline" className="ml-2 text-[9px] h-4 border-destructive/50 text-destructive">
                          BLOCKER
                        </Badge>
                      )}
                      {c.detail && (
                        <div className="text-muted-foreground mt-0.5">{c.detail}</div>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
              {row.send_error && (
                <div className="rounded-md border border-destructive/30 bg-destructive/5 p-3 text-xs">
                  <div className="font-semibold text-destructive mb-1">Send error</div>
                  <div className="text-muted-foreground font-mono">{row.send_error}</div>
                </div>
              )}
            </div>
          </TableCell>
        </TableRow>
      )}
    </>
  );
}
