import { useState } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { Search, Server, Users, AlertTriangle, Cog, RefreshCw, Loader2 } from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";

// ── System Overview ──────────────────────────────────────────────
function SystemOverview() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ["admin-system-overview"],
    queryFn: async () => {
      const [
        { count: usersCount },
        { count: projectsCount },
        { count: mlsCount },
        { count: leadsCount },
        { count: bookingsCount },
        { count: blogCount },
      ] = await Promise.all([
        supabase.from("user_roles").select("*", { count: "exact", head: true }),
        supabase.from("presale_projects").select("*", { count: "exact", head: true }),
        supabase.from("mls_listings").select("*", { count: "exact", head: true }),
        supabase.from("project_leads").select("*", { count: "exact", head: true }),
        supabase.from("bookings").select("*", { count: "exact", head: true }),
        supabase.from("blog_posts").select("*", { count: "exact", head: true }),
      ]);
      return {
        users: usersCount ?? 0,
        projects: projectsCount ?? 0,
        mlsListings: mlsCount ?? 0,
        leads: leadsCount ?? 0,
        bookings: bookingsCount ?? 0,
        blogs: blogCount ?? 0,
      };
    },
  });

  const tiles = [
    { label: "Users", value: stats?.users, color: "text-blue-600" },
    { label: "Projects", value: stats?.projects, color: "text-emerald-600" },
    { label: "MLS Listings", value: stats?.mlsListings, color: "text-violet-600" },
    { label: "Leads", value: stats?.leads, color: "text-amber-600" },
    { label: "Bookings", value: stats?.bookings, color: "text-cyan-600" },
    { label: "Blog Posts", value: stats?.blogs, color: "text-rose-500" },
  ];

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Server className="h-4 w-4 text-primary" />
          System Overview
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center py-8"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            {tiles.map((t) => (
              <div key={t.label} className="rounded-lg border bg-muted/30 p-3 text-center">
                <p className={`text-2xl font-bold ${t.color}`}>{t.value?.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{t.label}</p>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ── User Lookup ──────────────────────────────────────────────────
function UserLookup() {
  const [query, setQuery] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  const { data: results, isLoading } = useQuery({
    queryKey: ["admin-user-lookup", searchTerm],
    queryFn: async () => {
      if (!searchTerm) return [];
      // Search profiles by email or name
      const { data } = await (supabase as any)
        .from("profiles")
        .select("user_id, email, full_name, phone, created_at")
        .or(`email.ilike.%${searchTerm}%,full_name.ilike.%${searchTerm}%`)
        .limit(20);

      if (!data || data.length === 0) return [];

      // Fetch roles for matched users
      const userIds = data.map((u: any) => u.user_id);
      const { data: roles } = await supabase
        .from("user_roles")
        .select("user_id, role")
        .in("user_id", userIds);

      const roleMap = new Map<string, string[]>();
      (roles ?? []).forEach((r) => {
        const existing = roleMap.get(r.user_id) ?? [];
        existing.push(r.role);
        roleMap.set(r.user_id, existing);
      });

      return data.map((u: any) => ({
        ...u,
        roles: roleMap.get(u.user_id) ?? [],
      }));
    },
    enabled: searchTerm.length >= 2,
  });

  const handleSearch = () => {
    if (query.trim().length >= 2) setSearchTerm(query.trim());
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Users className="h-4 w-4 text-primary" />
          User Lookup
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex gap-2 mb-4">
          <Input
            placeholder="Search by email or name..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            className="max-w-sm"
          />
          <Button size="sm" onClick={handleSearch} disabled={query.trim().length < 2}>
            <Search className="h-3.5 w-3.5 mr-1.5" />
            Search
          </Button>
        </div>

        {isLoading && <div className="flex justify-center py-6"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>}

        {results && results.length > 0 && (
          <div className="rounded-lg border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Roles</TableHead>
                  <TableHead>Joined</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {results.map((u: any) => (
                  <TableRow key={u.user_id}>
                    <TableCell className="font-medium">{u.full_name || "—"}</TableCell>
                    <TableCell className="text-muted-foreground text-xs">{u.email}</TableCell>
                    <TableCell className="text-xs">{u.phone || "—"}</TableCell>
                    <TableCell>
                      <div className="flex gap-1 flex-wrap">
                        {u.roles.length > 0
                          ? u.roles.map((r: string) => (
                              <Badge key={r} variant={r === "admin" ? "destructive" : "secondary"} className="text-[10px]">
                                {r}
                              </Badge>
                            ))
                          : <span className="text-xs text-muted-foreground">user</span>}
                      </div>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {u.created_at ? format(new Date(u.created_at), "MMM d, yyyy") : "—"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}

        {results && results.length === 0 && searchTerm && (
          <p className="text-sm text-muted-foreground text-center py-4">No users found matching "{searchTerm}"</p>
        )}
      </CardContent>
    </Card>
  );
}

// ── Recent Errors ────────────────────────────────────────────────
function RecentErrors() {
  const { data: errors, isLoading, refetch } = useQuery({
    queryKey: ["admin-recent-errors"],
    queryFn: async () => {
      // Check email jobs with errors
      const { data: emailErrors } = await supabase
        .from("email_jobs")
        .select("id, to_email, template_id, error_message, created_at")
        .eq("status", "failed")
        .order("created_at", { ascending: false })
        .limit(10);

      // Check email logs with errors
      const { data: emailLogErrors } = await supabase
        .from("email_logs")
        .select("id, email_to, subject, error_message, sent_at")
        .eq("status", "failed")
        .order("sent_at", { ascending: false })
        .limit(10);

      // Check MLS sync errors
      const { data: syncErrors } = await supabase
        .from("mls_sync_logs")
        .select("id, sync_type, error_message, started_at, status")
        .eq("status", "failed")
        .order("started_at", { ascending: false })
        .limit(5);

      const combined: { id: string; source: string; message: string; detail: string; time: string }[] = [];

      (emailErrors ?? []).forEach((e) =>
        combined.push({
          id: e.id,
          source: "Email Job",
          message: e.error_message || "Unknown error",
          detail: e.to_email,
          time: e.created_at,
        })
      );

      (emailLogErrors ?? []).forEach((e) =>
        combined.push({
          id: e.id,
          source: "Email Log",
          message: e.error_message || "Unknown error",
          detail: `${e.email_to} — ${e.subject}`,
          time: e.sent_at,
        })
      );

      (syncErrors ?? []).forEach((e) =>
        combined.push({
          id: e.id,
          source: "MLS Sync",
          message: e.error_message || "Sync failed",
          detail: e.sync_type,
          time: e.started_at,
        })
      );

      return combined.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime()).slice(0, 15);
    },
  });

  return (
    <Card>
      <CardHeader className="pb-3 flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2 text-base">
          <AlertTriangle className="h-4 w-4 text-destructive" />
          Recent Errors
        </CardTitle>
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => refetch()}>
          <RefreshCw className="h-3.5 w-3.5" />
        </Button>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center py-6"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
        ) : !errors || errors.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-6">🎉 No recent errors found</p>
        ) : (
          <div className="space-y-2 max-h-[360px] overflow-y-auto">
            {errors.map((err) => (
              <div key={err.id} className="rounded-lg border border-destructive/20 bg-destructive/5 p-3">
                <div className="flex items-center justify-between mb-1">
                  <Badge variant="outline" className="text-[10px] border-destructive/30 text-destructive">
                    {err.source}
                  </Badge>
                  <span className="text-[10px] text-muted-foreground">
                    {formatDistanceToNow(new Date(err.time), { addSuffix: true })}
                  </span>
                </div>
                <p className="text-xs font-medium text-foreground line-clamp-2">{err.message}</p>
                <p className="text-[10px] text-muted-foreground mt-0.5 truncate">{err.detail}</p>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ── Background Jobs ──────────────────────────────────────────────
function BackgroundJobs() {
  const { data: jobs, isLoading, refetch } = useQuery({
    queryKey: ["admin-background-jobs"],
    queryFn: async () => {
      const [{ data: syncLogs }, { data: geocodeLogs }, { data: emailQueue }] = await Promise.all([
        supabase
          .from("mls_sync_logs")
          .select("id, sync_type, status, started_at, completed_at, listings_fetched, listings_created, listings_updated, error_message")
          .order("started_at", { ascending: false })
          .limit(10),
        supabase
          .from("geocoding_logs")
          .select("id, status, started_at, completed_at, listings_processed, listings_updated, api_calls_made, trigger_source, error_message")
          .order("started_at", { ascending: false })
          .limit(5),
        supabase
          .from("email_jobs")
          .select("id, to_email, status, scheduled_at, sent_at")
          .in("status", ["queued", "sending"])
          .order("scheduled_at", { ascending: false })
          .limit(10),
      ]);

      return {
        syncLogs: syncLogs ?? [],
        geocodeLogs: geocodeLogs ?? [],
        pendingEmails: emailQueue ?? [],
      };
    },
  });

  const statusColor = (s: string) => {
    if (s === "completed" || s === "sent") return "bg-emerald-500/15 text-emerald-700 border-emerald-200";
    if (s === "running" || s === "sending" || s === "queued") return "bg-amber-500/15 text-amber-700 border-amber-200";
    return "bg-destructive/15 text-destructive border-destructive/20";
  };

  return (
    <Card>
      <CardHeader className="pb-3 flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2 text-base">
          <Cog className="h-4 w-4 text-primary" />
          Background Jobs
        </CardTitle>
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => refetch()}>
          <RefreshCw className="h-3.5 w-3.5" />
        </Button>
      </CardHeader>
      <CardContent className="space-y-5">
        {isLoading ? (
          <div className="flex justify-center py-6"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
        ) : (
          <>
            {/* MLS Sync */}
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">MLS Sync Jobs</p>
              {jobs?.syncLogs.length === 0 ? (
                <p className="text-xs text-muted-foreground">No sync jobs found</p>
              ) : (
                <div className="rounded-lg border overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-xs">Type</TableHead>
                        <TableHead className="text-xs">Status</TableHead>
                        <TableHead className="text-xs">Fetched</TableHead>
                        <TableHead className="text-xs">Created</TableHead>
                        <TableHead className="text-xs">Updated</TableHead>
                        <TableHead className="text-xs">Started</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {jobs?.syncLogs.map((j: any) => (
                        <TableRow key={j.id}>
                          <TableCell className="text-xs font-medium">{j.sync_type}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className={`text-[10px] ${statusColor(j.status)}`}>{j.status}</Badge>
                          </TableCell>
                          <TableCell className="text-xs">{j.listings_fetched ?? 0}</TableCell>
                          <TableCell className="text-xs">{j.listings_created ?? 0}</TableCell>
                          <TableCell className="text-xs">{j.listings_updated ?? 0}</TableCell>
                          <TableCell className="text-[10px] text-muted-foreground">
                            {formatDistanceToNow(new Date(j.started_at), { addSuffix: true })}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </div>

            {/* Geocoding */}
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Geocoding Jobs</p>
              {jobs?.geocodeLogs.length === 0 ? (
                <p className="text-xs text-muted-foreground">No geocoding jobs found</p>
              ) : (
                <div className="rounded-lg border overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-xs">Trigger</TableHead>
                        <TableHead className="text-xs">Status</TableHead>
                        <TableHead className="text-xs">Processed</TableHead>
                        <TableHead className="text-xs">API Calls</TableHead>
                        <TableHead className="text-xs">Started</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {jobs?.geocodeLogs.map((j: any) => (
                        <TableRow key={j.id}>
                          <TableCell className="text-xs font-medium">{j.trigger_source ?? "manual"}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className={`text-[10px] ${statusColor(j.status)}`}>{j.status}</Badge>
                          </TableCell>
                          <TableCell className="text-xs">{j.listings_processed ?? 0}</TableCell>
                          <TableCell className="text-xs">{j.api_calls_made ?? 0}</TableCell>
                          <TableCell className="text-[10px] text-muted-foreground">
                            {formatDistanceToNow(new Date(j.started_at), { addSuffix: true })}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </div>

            {/* Pending Emails */}
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                Email Queue ({jobs?.pendingEmails.length ?? 0} pending)
              </p>
              {jobs?.pendingEmails.length === 0 ? (
                <p className="text-xs text-muted-foreground">No emails in queue</p>
              ) : (
                <div className="rounded-lg border overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-xs">To</TableHead>
                        <TableHead className="text-xs">Status</TableHead>
                        <TableHead className="text-xs">Scheduled</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {jobs?.pendingEmails.map((j: any) => (
                        <TableRow key={j.id}>
                          <TableCell className="text-xs">{j.to_email}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className={`text-[10px] ${statusColor(j.status)}`}>{j.status}</Badge>
                          </TableCell>
                          <TableCell className="text-[10px] text-muted-foreground">
                            {formatDistanceToNow(new Date(j.scheduled_at), { addSuffix: true })}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}

// ── Main Page ────────────────────────────────────────────────────
export default function AdminSystem() {
  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-xl font-bold text-foreground">System</h1>
          <p className="text-sm text-muted-foreground">Read-only system health, user lookup, errors & background jobs.</p>
        </div>
        <SystemOverview />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <RecentErrors />
          <UserLookup />
        </div>
        <BackgroundJobs />
      </div>
    </AdminLayout>
  );
}
