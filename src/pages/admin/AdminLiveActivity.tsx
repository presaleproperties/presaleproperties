import { useEffect, useState, useRef } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Activity,
  Users,
  ShieldAlert,
  Eye,
  Bot,
  Monitor,
  Smartphone,
  Tablet,
  Globe,
  AlertTriangle,
  CheckCircle2,
  Clock,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { format, formatDistanceToNow } from "date-fns";

// --- IP Blocklist (same as edge functions) ---
const BLOCKED_IP_PREFIXES = [
  "43.173.", "42.106.", "45.83.", "185.220.",
  "194.165.", "167.94.", "216.244.",
];

const IP_REGION_MAP: Record<string, string> = {
  "43.173.": "China (Tencent Cloud)",
  "42.106.": "India (Jio DC)",
  "45.83.":  "Eastern Europe DC",
  "185.220.": "Tor Exit Node",
  "194.165.": "Russia DC",
  "167.94.": "Censys Scanner",
  "216.244.": "DotSematext Bot",
};

function getIPRegion(ip: string | null): string | null {
  if (!ip) return null;
  const match = BLOCKED_IP_PREFIXES.find(prefix => ip.startsWith(prefix));
  return match ? IP_REGION_MAP[match] : null;
}

function isBlockedIP(ip: string | null): boolean {
  if (!ip) return false;
  return BLOCKED_IP_PREFIXES.some(prefix => ip.startsWith(prefix));
}

type ActivityRow = {
  id: string;
  created_at: string;
  activity_type: string;
  visitor_id: string | null;
  ip_address: string | null;
  city: string | null;
  page_url: string | null;
  page_title: string | null;
  device_type: string | null;
  client_id: string | null;
  session_id: string | null;
};

type Stats = {
  activeSessions: number;
  flaggedIPs: number;
  uniqueVisitorsToday: number;
  botAttempts: number;
};

type SuspiciousIP = {
  ip: string;
  count: number;
  lastSeen: string;
  region: string;
};

export default function AdminLiveActivity() {
  const [activities, setActivities] = useState<ActivityRow[]>([]);
  const [stats, setStats] = useState<Stats>({ activeSessions: 0, flaggedIPs: 0, uniqueVisitorsToday: 0, botAttempts: 0 });
  const [suspiciousIPs, setSuspiciousIPs] = useState<SuspiciousIP[]>([]);
  const [topVisitors, setTopVisitors] = useState<{ visitor_id: string; count: number }[]>([]);
  const [topPages, setTopPages] = useState<{ page: string; count: number }[]>([]);
  const [deviceBreakdown, setDeviceBreakdown] = useState<{ device: string; count: number }[]>([]);
  const [loading, setLoading] = useState(true);
  const [liveCount, setLiveCount] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  async function fetchActivities() {
    const { data } = await supabase
      .from("client_activity")
      .select("id, created_at, activity_type, visitor_id, ip_address, city, page_url, page_title, device_type, client_id, session_id")
      .order("created_at", { ascending: false })
      .limit(200);
    if (data) setActivities(data);
    setLoading(false);
  }

  async function fetchStats() {
    const now = new Date();
    const thirtyMinAgo = new Date(now.getTime() - 30 * 60 * 1000).toISOString();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
    const twentyFourHAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000).toISOString();

    // Active sessions (last 30m)
    const { data: sessionsData } = await supabase
      .from("client_activity")
      .select("session_id")
      .gte("created_at", thirtyMinAgo);
    const activeSessions = new Set(sessionsData?.map(r => r.session_id).filter(Boolean)).size;

    // Unique visitors today
    const { data: visitorsData } = await supabase
      .from("client_activity")
      .select("visitor_id")
      .gte("created_at", todayStart);
    const uniqueVisitorsToday = new Set(visitorsData?.map(r => r.visitor_id).filter(Boolean)).size;

    // Flagged IPs and bot attempts (last 24h) — fetch all and filter client-side
    const { data: ipData } = await supabase
      .from("client_activity")
      .select("ip_address, visitor_id, created_at")
      .gte("created_at", twentyFourHAgo)
      .not("ip_address", "is", null);

    const flaggedSet = new Set<string>();
    let botAttempts = 0;
    const ipCountMap: Record<string, { count: number; lastSeen: string }> = {};

    ipData?.forEach(row => {
      if (row.ip_address && isBlockedIP(row.ip_address)) {
        flaggedSet.add(row.ip_address);
        botAttempts++;
        if (!ipCountMap[row.ip_address]) {
          ipCountMap[row.ip_address] = { count: 0, lastSeen: row.created_at };
        }
        ipCountMap[row.ip_address].count++;
        if (row.created_at > ipCountMap[row.ip_address].lastSeen) {
          ipCountMap[row.ip_address].lastSeen = row.created_at;
        }
      }
    });

    const suspicious: SuspiciousIP[] = Object.entries(ipCountMap).map(([ip, { count, lastSeen }]) => ({
      ip,
      count,
      lastSeen,
      region: getIPRegion(ip) || "Unknown",
    })).sort((a, b) => b.count - a.count).slice(0, 15);

    setSuspiciousIPs(suspicious);
    setStats({ activeSessions, flaggedIPs: flaggedSet.size, uniqueVisitorsToday, botAttempts });

    // Top visitors (last 1h)
    const { data: recentData } = await supabase
      .from("client_activity")
      .select("visitor_id, page_url, device_type")
      .gte("created_at", oneHourAgo);

    const visitorCounts: Record<string, number> = {};
    const pageCounts: Record<string, number> = {};
    const deviceCounts: Record<string, number> = {};

    recentData?.forEach(row => {
      if (row.visitor_id) visitorCounts[row.visitor_id] = (visitorCounts[row.visitor_id] || 0) + 1;
      if (row.page_url) {
        const page = row.page_url.replace(/^https?:\/\/[^/]+/, "").split("?")[0] || "/";
        pageCounts[page] = (pageCounts[page] || 0) + 1;
      }
      const device = row.device_type || "unknown";
      deviceCounts[device] = (deviceCounts[device] || 0) + 1;
    });

    setTopVisitors(Object.entries(visitorCounts).map(([visitor_id, count]) => ({ visitor_id, count })).sort((a, b) => b.count - a.count).slice(0, 5));
    setTopPages(Object.entries(pageCounts).map(([page, count]) => ({ page, count })).sort((a, b) => b.count - a.count).slice(0, 5));
    setDeviceBreakdown(Object.entries(deviceCounts).map(([device, count]) => ({ device, count })).sort((a, b) => b.count - a.count));
  }

  useEffect(() => {
    fetchActivities();
    fetchStats();

    intervalRef.current = setInterval(fetchStats, 10000);

    const channel = supabase
      .channel("live-activity-feed")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "client_activity" }, (payload) => {
        setActivities(prev => [payload.new as ActivityRow, ...prev].slice(0, 200));
        setLiveCount(c => c + 1);
      })
      .subscribe();

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      supabase.removeChannel(channel);
    };
  }, []);

  const getRowClass = (row: ActivityRow) => {
    if (isBlockedIP(row.ip_address)) return "bg-destructive/5 hover:bg-destructive/10";
    if (row.client_id) return "bg-success/5 hover:bg-success/10";
    return "hover:bg-muted/40";
  };

  const DeviceIcon = ({ type }: { type: string | null }) => {
    if (type === "mobile") return <Smartphone className="h-3 w-3 text-muted-foreground" />;
    if (type === "tablet") return <Tablet className="h-3 w-3 text-muted-foreground" />;
    return <Monitor className="h-3 w-3 text-muted-foreground" />;
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
              <Activity className="h-6 w-6 text-danger" />
              Live Activity Monitor
            </h1>
            <p className="text-sm text-muted-foreground mt-0.5">Real-time visitor sessions, IP flags & bot detection</p>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground bg-muted/50 px-3 py-1.5 rounded-full">
              <span className="h-2 w-2 rounded-full bg-success animate-pulse" />
              Live — {liveCount} events received
            </div>
          </div>
        </div>

        {/* Stats Bar */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: "Active Sessions", value: stats.activeSessions, icon: Users, color: "text-info", sub: "last 30 min" },
            { label: "Flagged IPs", value: stats.flaggedIPs, icon: ShieldAlert, color: "text-danger", sub: "last 24h" },
            { label: "Unique Visitors", value: stats.uniqueVisitorsToday, icon: Eye, color: "text-success", sub: "today" },
            { label: "Bot Attempts", value: stats.botAttempts, icon: Bot, color: "text-warning", sub: "last 24h (blocked)" },
          ].map(({ label, value, icon: Icon, color, sub }) => (
            <Card key={label}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground">{label}</p>
                    <p className="text-2xl font-bold text-foreground mt-1">{value.toLocaleString()}</p>
                    <p className="text-[10px] text-muted-foreground/60 mt-0.5">{sub}</p>
                  </div>
                  <Icon className={cn("h-5 w-5 mt-0.5", color)} />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Live Feed — takes 2/3 */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-success animate-pulse" />
                  Live Activity Feed
                  <span className="ml-auto text-[10px] font-normal text-muted-foreground">newest first · max 200</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <ScrollArea className="h-[480px]">
                  {loading ? (
                    <div className="flex items-center justify-center h-40 text-sm text-muted-foreground">Loading activity...</div>
                  ) : activities.length === 0 ? (
                    <div className="flex items-center justify-center h-40 text-sm text-muted-foreground">No activity yet</div>
                  ) : (
                    <table className="w-full text-xs">
                      <thead className="sticky top-0 bg-card z-10 border-b">
                        <tr>
                          <th className="text-left px-3 py-2 font-medium text-muted-foreground w-[80px]">Time</th>
                          <th className="text-left px-3 py-2 font-medium text-muted-foreground">Type</th>
                          <th className="text-left px-3 py-2 font-medium text-muted-foreground">Visitor</th>
                          <th className="text-left px-3 py-2 font-medium text-muted-foreground">IP</th>
                          <th className="text-left px-3 py-2 font-medium text-muted-foreground hidden md:table-cell">Page</th>
                          <th className="text-left px-3 py-2 font-medium text-muted-foreground hidden lg:table-cell">Device</th>
                          <th className="text-left px-3 py-2 font-medium text-muted-foreground">Flags</th>
                        </tr>
                      </thead>
                      <tbody>
                        {activities.map((row) => {
                          const blocked = isBlockedIP(row.ip_address);
                          const region = getIPRegion(row.ip_address);
                          return (
                            <tr key={row.id} className={cn("border-b border-border/30 transition-colors", getRowClass(row))}>
                              <td className="px-3 py-2 text-muted-foreground whitespace-nowrap">
                                <div className="flex items-center gap-1">
                                  <Clock className="h-2.5 w-2.5" />
                                  {format(new Date(row.created_at), "HH:mm:ss")}
                                </div>
                              </td>
                              <td className="px-3 py-2">
                                <span className="font-mono text-[10px] bg-muted px-1.5 py-0.5 rounded">
                                  {row.activity_type}
                                </span>
                              </td>
                              <td className="px-3 py-2 font-mono text-muted-foreground">
                                {row.visitor_id ? row.visitor_id.slice(0, 8) + "…" : "—"}
                              </td>
                              <td className="px-3 py-2 font-mono">
                                <span className={cn(blocked ? "text-destructive font-semibold" : "text-muted-foreground")}>
                                  {row.ip_address || "—"}
                                </span>
                              </td>
                              <td className="px-3 py-2 hidden md:table-cell text-muted-foreground max-w-[160px]">
                                <span className="truncate block" title={row.page_url || ""}>
                                  {row.page_url ? row.page_url.replace(/^https?:\/\/[^/]+/, "").split("?")[0] || "/" : "—"}
                                </span>
                              </td>
                              <td className="px-3 py-2 hidden lg:table-cell">
                                <div className="flex items-center gap-1">
                                  <DeviceIcon type={row.device_type} />
                                  <span className="text-muted-foreground capitalize">{row.device_type || "—"}</span>
                                </div>
                              </td>
                              <td className="px-3 py-2">
                                <div className="flex items-center gap-1 flex-wrap">
                                  {blocked && (
                                    <Badge className="text-[9px] px-1 py-0 bg-destructive/15 text-destructive border-destructive/20 h-4">
                                      <Bot className="h-2 w-2 mr-0.5" />bot
                                    </Badge>
                                  )}
                                  {row.client_id && (
                                    <Badge className="text-[9px] px-1 py-0 bg-success/15 text-success border-success/20 h-4">
                                      <CheckCircle2 className="h-2 w-2 mr-0.5" />lead
                                    </Badge>
                                  )}
                                  {!blocked && !row.client_id && (
                                    <span className="text-muted-foreground/40">—</span>
                                  )}
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  )}
                </ScrollArea>
              </CardContent>
            </Card>
          </div>

          {/* Suspicious Traffic Alerts Sidebar */}
          <div className="space-y-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-warning" />
                  Suspicious Traffic
                  <span className="ml-auto text-[10px] font-normal text-muted-foreground">last 24h</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <ScrollArea className="h-[440px]">
                  {suspiciousIPs.length === 0 ? (
                    <div className="flex items-center justify-center h-24 text-sm text-muted-foreground px-4 text-center">
                      <div>
                        <CheckCircle2 className="h-5 w-5 text-success mx-auto mb-1" />
                        No flagged IPs in last 24h
                      </div>
                    </div>
                  ) : (
                    <div className="divide-y divide-border/40">
                      {suspiciousIPs.map((entry) => (
                        <div key={entry.ip} className="px-4 py-3 hover:bg-muted/30 transition-colors">
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0">
                              <p className="font-mono text-xs font-semibold text-destructive truncate">{entry.ip}</p>
                              <p className="text-[10px] text-muted-foreground mt-0.5">{entry.region}</p>
                              <p className="text-[10px] text-muted-foreground/60 mt-1 flex items-center gap-1">
                                <Clock className="h-2.5 w-2.5" />
                                {formatDistanceToNow(new Date(entry.lastSeen), { addSuffix: true })}
                              </p>
                            </div>
                            <div className="flex-shrink-0 text-right">
                              <span className="text-xs font-bold text-destructive">{entry.count}</span>
                              <p className="text-[9px] text-muted-foreground/60">hits</p>
                            </div>
                          </div>
                          <div className="mt-2 p-1.5 bg-muted/50 rounded text-[9px] text-muted-foreground font-mono">
                            Prefix: {BLOCKED_IP_PREFIXES.find(p => entry.ip.startsWith(p)) || "—"}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </ScrollArea>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Session Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Top Visitors */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Users className="h-4 w-4 text-info" />
                Top Visitors
                <span className="ml-auto text-[10px] font-normal text-muted-foreground">last hour</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0 space-y-2">
              {topVisitors.length === 0 ? (
                <p className="text-xs text-muted-foreground">No activity in last hour</p>
              ) : topVisitors.map(({ visitor_id, count }, i) => (
                <div key={visitor_id} className="flex items-center gap-2">
                  <span className="text-[10px] text-muted-foreground/50 w-3">{i + 1}.</span>
                  <span className="font-mono text-xs text-muted-foreground flex-1 truncate">{visitor_id.slice(0, 12)}…</span>
                  <Badge variant="outline" className="text-[10px] h-4 px-1">{count}</Badge>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Top Pages */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Globe className="h-4 w-4 text-success" />
                Top Pages
                <span className="ml-auto text-[10px] font-normal text-muted-foreground">last hour</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0 space-y-2">
              {topPages.length === 0 ? (
                <p className="text-xs text-muted-foreground">No activity in last hour</p>
              ) : topPages.map(({ page, count }, i) => (
                <div key={page} className="flex items-center gap-2">
                  <span className="text-[10px] text-muted-foreground/50 w-3">{i + 1}.</span>
                  <span className="text-xs text-muted-foreground flex-1 truncate" title={page}>{page || "/"}</span>
                  <Badge variant="outline" className="text-[10px] h-4 px-1">{count}</Badge>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Device Breakdown */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Monitor className="h-4 w-4 text-primary" />
                Devices
                <span className="ml-auto text-[10px] font-normal text-muted-foreground">last hour</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0 space-y-2">
              {deviceBreakdown.length === 0 ? (
                <p className="text-xs text-muted-foreground">No activity in last hour</p>
              ) : deviceBreakdown.map(({ device, count }) => {
                const total = deviceBreakdown.reduce((s, d) => s + d.count, 0);
                const pct = Math.round((count / total) * 100);
                return (
                  <div key={device} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-1.5 capitalize">
                        {device === "mobile" ? <Smartphone className="h-3 w-3 text-muted-foreground" /> :
                          device === "tablet" ? <Tablet className="h-3 w-3 text-muted-foreground" /> :
                          <Monitor className="h-3 w-3 text-muted-foreground" />}
                        <span className="text-muted-foreground">{device}</span>
                      </div>
                      <span className="text-muted-foreground">{pct}% · {count}</span>
                    </div>
                    <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                      <div className="h-full bg-primary/60 rounded-full transition-all" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminLayout>
  );
}
