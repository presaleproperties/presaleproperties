/**
 * AdminPaidAdsDashboard
 * ─────────────────────────────────────────────────────────────────────────────
 * Single-pane view to maximize paid ad performance & understand user behavior.
 *
 * Sections:
 *  1. Tracking Pipeline Health   — are event_id / fbp / fbc / Lofty / Meta CAPI firing?
 *  2. Attribution by Source       — UTM source/medium/campaign breakdown + CPL ready
 *  3. Form Funnel                 — which forms convert (LP vs organic vs calculator)
 *  4. Lead Quality                — temperature, score, persona mix
 *  5. Top Projects                — engagement → leads
 *  6. Recent Sync Failures        — fast debug of broken Lofty/Meta posts
 */
import { useQuery } from "@tanstack/react-query";
import { format, subDays } from "date-fns";
import {
  Activity, Target, Zap, AlertTriangle, TrendingUp, Users,
  CheckCircle2, XCircle, Flame, Snowflake, DollarSign,
} from "lucide-react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import {
  ChartContainer, ChartTooltip, ChartTooltipContent,
} from "@/components/ui/chart";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  PieChart, Pie, Cell, LineChart, Line, ResponsiveContainer,
} from "recharts";
import { useState } from "react";
import { Button } from "@/components/ui/button";

const COLORS = {
  primary: "hsl(var(--primary))",
  hot: "hsl(0 72% 51%)",
  warm: "hsl(30 95% 55%)",
  cold: "hsl(210 80% 55%)",
  muted: "hsl(var(--muted-foreground))",
};
const PIE_COLORS = [
  "hsl(var(--primary))",
  "hsl(168 76% 42%)",
  "hsl(210 80% 55%)",
  "hsl(280 65% 60%)",
  "hsl(30 95% 55%)",
  "hsl(0 72% 51%)",
];

type Range = 7 | 30 | 90;

// ─── Data hook ────────────────────────────────────────────────────────────────
function useDashboardData(days: Range) {
  const since = subDays(new Date(), days).toISOString();

  return useQuery({
    queryKey: ["paid-ads-dashboard", days],
    queryFn: async () => {
      const [leadsRes, syncLogRes] = await Promise.all([
        supabase
          .from("project_leads")
          .select(
            "id,name,email,form_type,lead_source,utm_source,utm_medium,utm_campaign," +
            "lead_score,lead_temperature,persona,event_id,fbp,fbc,value," +
            "lofty_id,lofty_synced_at,used_calculator,pages_viewed,time_on_site," +
            "device_type,created_at,project_id,presale_projects(name,city)"
          )
          .gte("created_at", since)
          .order("created_at", { ascending: false }),
        supabase
          .from("lead_sync_log")
          .select("id,destination,status,status_code,error_message,created_at,lead_id")
          .gte("created_at", since)
          .order("created_at", { ascending: false })
          .limit(500),
      ]);

      if (leadsRes.error) throw leadsRes.error;
      const leads = leadsRes.data ?? [];
      const syncLog = syncLogRes.data ?? [];

      // ─ Pipeline health ─
      const total = leads.length;
      const withEventId = leads.filter((l) => l.event_id).length;
      const withFbp = leads.filter((l) => l.fbp).length;
      const withUtm = leads.filter((l) => l.utm_source).length;
      const withLofty = leads.filter((l) => l.lofty_id).length;

      // ─ Sync log aggregates ─
      const loftySync = syncLog.filter((s) => s.destination === "lofty");
      const metaSync = syncLog.filter((s) => s.destination === "meta_capi");
      const loftySuccess = loftySync.filter((s) => s.status === "success").length;
      const metaSuccess = metaSync.filter((s) => s.status === "success").length;
      const recentFailures = syncLog
        .filter((s) => s.status !== "success")
        .slice(0, 10);

      // ─ Attribution by UTM source ─
      const sourceMap = new Map<string, { source: string; count: number; value: number }>();
      leads.forEach((l) => {
        const key = l.utm_source || l.lead_source || "direct";
        const cur = sourceMap.get(key) || { source: key, count: 0, value: 0 };
        cur.count += 1;
        cur.value += Number(l.value || 0);
        sourceMap.set(key, cur);
      });
      const sources = Array.from(sourceMap.values()).sort((a, b) => b.count - a.count);

      // ─ Campaign breakdown (utm_campaign) ─
      const campaignMap = new Map<string, number>();
      leads.forEach((l) => {
        if (!l.utm_campaign) return;
        campaignMap.set(l.utm_campaign, (campaignMap.get(l.utm_campaign) || 0) + 1);
      });
      const campaigns = Array.from(campaignMap, ([campaign, count]) => ({ campaign, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 8);

      // ─ Form-type funnel ─
      const formMap = new Map<string, number>();
      leads.forEach((l) => {
        const k = l.form_type || "unknown";
        formMap.set(k, (formMap.get(k) || 0) + 1);
      });
      const forms = Array.from(formMap, ([form, count]) => ({ form, count }))
        .sort((a, b) => b.count - a.count);

      // ─ Temperature mix ─
      const tempMap: Record<string, number> = { hot: 0, warm: 0, cold: 0 };
      leads.forEach((l) => {
        const t = (l.lead_temperature || "cold").toLowerCase();
        tempMap[t] = (tempMap[t] || 0) + 1;
      });

      // ─ Persona mix ─
      const personaMap = new Map<string, number>();
      leads.forEach((l) => {
        const p = l.persona || "unknown";
        personaMap.set(p, (personaMap.get(p) || 0) + 1);
      });
      const personas = Array.from(personaMap, ([persona, count]) => ({ persona, count }));

      // ─ Daily lead trend ─
      const dailyMap = new Map<string, { date: string; total: number; hot: number; lp: number }>();
      for (let i = days - 1; i >= 0; i--) {
        const d = format(subDays(new Date(), i), "MMM dd");
        dailyMap.set(d, { date: d, total: 0, hot: 0, lp: 0 });
      }
      leads.forEach((l) => {
        const d = format(new Date(l.created_at), "MMM dd");
        const cur = dailyMap.get(d);
        if (!cur) return;
        cur.total += 1;
        if ((l.lead_temperature || "").toLowerCase() === "hot") cur.hot += 1;
        if (l.form_type === "project_inquiry_lp") cur.lp += 1;
      });
      const daily = Array.from(dailyMap.values());

      // ─ Top projects ─
      const projMap = new Map<string, { name: string; city: string; count: number }>();
      leads.forEach((l) => {
        if (!l.project_id || !l.presale_projects) return;
        const cur = projMap.get(l.project_id) || {
          name: (l.presale_projects as any).name,
          city: (l.presale_projects as any).city,
          count: 0,
        };
        cur.count += 1;
        projMap.set(l.project_id, cur);
      });
      const topProjects = Array.from(projMap.values())
        .sort((a, b) => b.count - a.count)
        .slice(0, 8);

      // ─ Behavioral averages ─
      const behavioralLeads = leads.filter((l) => (l.pages_viewed || 0) > 0);
      const avgPages = behavioralLeads.length
        ? behavioralLeads.reduce((s, l) => s + (l.pages_viewed || 0), 0) / behavioralLeads.length
        : 0;
      const avgTimeSec = behavioralLeads.length
        ? behavioralLeads.reduce((s, l) => s + (l.time_on_site || 0), 0) / behavioralLeads.length
        : 0;
      const calcUsers = leads.filter((l) => l.used_calculator).length;
      const totalValue = leads.reduce((s, l) => s + Number(l.value || 0), 0);

      return {
        total, withEventId, withFbp, withUtm, withLofty,
        loftyTotal: loftySync.length, loftySuccess,
        metaTotal: metaSync.length, metaSuccess,
        recentFailures,
        sources, campaigns, forms, tempMap, personas, daily, topProjects,
        avgPages, avgTimeSec, calcUsers, totalValue,
      };
    },
  });
}

// ─── Small UI helpers ─────────────────────────────────────────────────────────
function StatCard({
  icon: Icon, label, value, sub, tone = "default",
}: { icon: any; label: string; value: string | number; sub?: string; tone?: "default" | "good" | "bad" | "warn" }) {
  const toneColor = {
    default: "text-foreground",
    good: "text-emerald-600 dark:text-emerald-400",
    bad: "text-destructive",
    warn: "text-amber-600 dark:text-amber-400",
  }[tone];
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
          <Icon className="h-3.5 w-3.5" />
          {label}
        </div>
        <div className={`mt-1.5 text-2xl font-bold ${toneColor}`}>{value}</div>
        {sub && <div className="text-xs text-muted-foreground mt-0.5">{sub}</div>}
      </CardContent>
    </Card>
  );
}

function HealthBar({ label, current, total, hint }: { label: string; current: number; total: number; hint: string }) {
  const pct = total ? Math.round((current / total) * 100) : 0;
  const tone = pct >= 80 ? "bg-emerald-500" : pct >= 50 ? "bg-amber-500" : "bg-destructive";
  return (
    <div>
      <div className="flex items-baseline justify-between text-xs mb-1.5">
        <span className="font-medium">{label}</span>
        <span className="tabular-nums text-muted-foreground">
          {current} / {total} <span className="font-semibold text-foreground">({pct}%)</span>
        </span>
      </div>
      <div className="h-2 bg-muted rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${tone} transition-all`} style={{ width: `${pct}%` }} />
      </div>
      <div className="text-[11px] text-muted-foreground mt-1">{hint}</div>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function AdminPaidAdsDashboard() {
  const [range, setRange] = useState<Range>(30);
  const { data, isLoading } = useDashboardData(range);

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
              <Target className="h-7 w-7 text-primary" />
              Paid Ads & Conversion Hub
            </h1>
            <p className="text-muted-foreground text-sm mt-1">
              Tracking pipeline health, attribution, and lead quality at a glance.
            </p>
          </div>
          <div className="flex gap-1 bg-muted p-1 rounded-lg">
            {([7, 30, 90] as Range[]).map((d) => (
              <Button
                key={d}
                size="sm"
                variant={range === d ? "default" : "ghost"}
                className="h-7 px-3 text-xs"
                onClick={() => setRange(d)}
              >
                {d}d
              </Button>
            ))}
          </div>
        </div>

        {isLoading || !data ? (
          <div className="grid gap-3 md:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-24" />)}
          </div>
        ) : (
          <>
            {/* ─── Top KPIs ─────────────────────────────────────── */}
            <div className="grid gap-3 grid-cols-2 md:grid-cols-4">
              <StatCard icon={Users} label="Total Leads" value={data.total} sub={`Last ${range} days`} />
              <StatCard
                icon={Flame}
                label="Hot Leads"
                value={data.tempMap.hot || 0}
                sub={data.total ? `${Math.round(((data.tempMap.hot || 0) / data.total) * 100)}% of total` : ""}
                tone="good"
              />
              <StatCard
                icon={DollarSign}
                label="Pipeline Value"
                value={`$${data.totalValue.toLocaleString()}`}
                sub="CAD ad-bidding value"
              />
              <StatCard
                icon={Activity}
                label="Avg Engagement"
                value={`${data.avgPages.toFixed(1)} pages`}
                sub={`${Math.round(data.avgTimeSec)}s on site`}
              />
            </div>

            {/* ─── Tracking Pipeline Health ─────────────────────── */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2">
                  <Zap className="h-5 w-5 text-primary" />
                  Tracking Pipeline Health
                </CardTitle>
                <CardDescription>
                  How much of your traffic is actually being attributed and synced. Aim for ≥80% on each.
                </CardDescription>
              </CardHeader>
              <CardContent className="grid gap-5 md:grid-cols-2">
                <HealthBar
                  label="Meta event_id captured"
                  current={data.withEventId} total={data.total}
                  hint="Shared ID for Pixel ↔ CAPI deduplication."
                />
                <HealthBar
                  label="Meta _fbp / _fbc cookies"
                  current={data.withFbp} total={data.total}
                  hint="Required for Meta to credit ad clicks → conversions."
                />
                <HealthBar
                  label="UTM source attribution"
                  current={data.withUtm} total={data.total}
                  hint="Ensure all paid links carry utm_source, utm_medium, utm_campaign."
                />
                <HealthBar
                  label="Lofty CRM sync"
                  current={data.withLofty} total={data.total}
                  hint="Leads that successfully landed in Lofty with a contact ID."
                />
                <HealthBar
                  label="Meta CAPI server events"
                  current={data.metaSuccess} total={data.metaTotal || data.total}
                  hint={`${data.metaSuccess} / ${data.metaTotal} CAPI calls succeeded.`}
                />
                <HealthBar
                  label="Lofty webhook calls"
                  current={data.loftySuccess} total={data.loftyTotal || data.total}
                  hint={`${data.loftySuccess} / ${data.loftyTotal} Lofty pushes succeeded.`}
                />
              </CardContent>
            </Card>

            {/* ─── Tabs: Attribution / Funnel / Quality / Behavior ─ */}
            <Tabs defaultValue="attribution" className="w-full">
              <TabsList className="grid w-full grid-cols-2 md:grid-cols-4">
                <TabsTrigger value="attribution">Attribution</TabsTrigger>
                <TabsTrigger value="funnel">Form Funnel</TabsTrigger>
                <TabsTrigger value="quality">Lead Quality</TabsTrigger>
                <TabsTrigger value="behavior">Behavior</TabsTrigger>
              </TabsList>

              {/* Attribution */}
              <TabsContent value="attribution" className="space-y-4 mt-4">
                <div className="grid gap-4 lg:grid-cols-2">
                  <Card>
                    <CardHeader><CardTitle className="text-base">Leads by Source</CardTitle></CardHeader>
                    <CardContent>
                      <ChartContainer config={{}} className="h-[280px] w-full">
                        <BarChart data={data.sources.slice(0, 8)} layout="vertical" margin={{ left: 12 }}>
                          <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                          <XAxis type="number" className="text-xs" />
                          <YAxis dataKey="source" type="category" width={100} className="text-xs" />
                          <ChartTooltip content={<ChartTooltipContent />} />
                          <Bar dataKey="count" fill={COLORS.primary} radius={[0, 6, 6, 0]} />
                        </BarChart>
                      </ChartContainer>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader><CardTitle className="text-base">Top Campaigns</CardTitle></CardHeader>
                    <CardContent>
                      {data.campaigns.length === 0 ? (
                        <div className="text-sm text-muted-foreground text-center py-12">
                          No utm_campaign data captured yet. Add <code className="px-1 bg-muted rounded">?utm_campaign=</code> to all paid ad URLs.
                        </div>
                      ) : (
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Campaign</TableHead>
                              <TableHead className="text-right">Leads</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {data.campaigns.map((c) => (
                              <TableRow key={c.campaign}>
                                <TableCell className="font-medium">{c.campaign}</TableCell>
                                <TableCell className="text-right tabular-nums">{c.count}</TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      )}
                    </CardContent>
                  </Card>
                </div>

                <Card>
                  <CardHeader><CardTitle className="text-base">Daily Lead Trend</CardTitle></CardHeader>
                  <CardContent>
                    <ChartContainer config={{}} className="h-[260px] w-full">
                      <LineChart data={data.daily}>
                        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                        <XAxis dataKey="date" className="text-xs" />
                        <YAxis className="text-xs" />
                        <ChartTooltip content={<ChartTooltipContent />} />
                        <Line type="monotone" dataKey="total" stroke={COLORS.primary} strokeWidth={2} name="Total" />
                        <Line type="monotone" dataKey="hot" stroke={COLORS.hot} strokeWidth={2} name="Hot" />
                        <Line type="monotone" dataKey="lp" stroke={COLORS.cold} strokeWidth={2} name="LP (paid)" />
                      </LineChart>
                    </ChartContainer>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Form funnel */}
              <TabsContent value="funnel" className="mt-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Leads by Form Type</CardTitle>
                    <CardDescription>
                      Compare the LP (<code>project_inquiry_lp</code>) against organic project pages and other entry points.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ChartContainer config={{}} className="h-[320px] w-full">
                      <BarChart data={data.forms} margin={{ bottom: 60 }}>
                        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                        <XAxis dataKey="form" className="text-xs" angle={-30} textAnchor="end" height={70} interval={0} />
                        <YAxis className="text-xs" />
                        <ChartTooltip content={<ChartTooltipContent />} />
                        <Bar dataKey="count" fill={COLORS.primary} radius={[6, 6, 0, 0]} />
                      </BarChart>
                    </ChartContainer>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Lead quality */}
              <TabsContent value="quality" className="mt-4 space-y-4">
                <div className="grid gap-4 lg:grid-cols-2">
                  <Card>
                    <CardHeader><CardTitle className="text-base">Lead Temperature</CardTitle></CardHeader>
                    <CardContent>
                      <ChartContainer config={{}} className="h-[260px] w-full">
                        <PieChart>
                          <Pie
                            data={[
                              { name: "Hot", value: data.tempMap.hot || 0, color: COLORS.hot },
                              { name: "Warm", value: data.tempMap.warm || 0, color: COLORS.warm },
                              { name: "Cold", value: data.tempMap.cold || 0, color: COLORS.cold },
                            ]}
                            dataKey="value"
                            nameKey="name"
                            outerRadius={90}
                            label
                          >
                            <Cell fill={COLORS.hot} />
                            <Cell fill={COLORS.warm} />
                            <Cell fill={COLORS.cold} />
                          </Pie>
                          <ChartTooltip content={<ChartTooltipContent />} />
                        </PieChart>
                      </ChartContainer>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader><CardTitle className="text-base">Persona Mix</CardTitle></CardHeader>
                    <CardContent>
                      <ChartContainer config={{}} className="h-[260px] w-full">
                        <PieChart>
                          <Pie data={data.personas} dataKey="count" nameKey="persona" outerRadius={90} label>
                            {data.personas.map((_, i) => (
                              <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                            ))}
                          </Pie>
                          <ChartTooltip content={<ChartTooltipContent />} />
                        </PieChart>
                      </ChartContainer>
                    </CardContent>
                  </Card>
                </div>

                <Card>
                  <CardHeader><CardTitle className="text-base">Top Projects by Lead Volume</CardTitle></CardHeader>
                  <CardContent>
                    {data.topProjects.length === 0 ? (
                      <div className="text-sm text-muted-foreground py-6 text-center">No project-attributed leads yet.</div>
                    ) : (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Project</TableHead>
                            <TableHead>City</TableHead>
                            <TableHead className="text-right">Leads</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {data.topProjects.map((p, i) => (
                            <TableRow key={i}>
                              <TableCell className="font-medium">{p.name}</TableCell>
                              <TableCell className="text-muted-foreground">{p.city}</TableCell>
                              <TableCell className="text-right tabular-nums">{p.count}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Behavior */}
              <TabsContent value="behavior" className="mt-4">
                <div className="grid gap-3 md:grid-cols-3">
                  <StatCard
                    icon={Activity}
                    label="Avg Pages / Lead"
                    value={data.avgPages.toFixed(1)}
                    sub="Pre-conversion exploration depth"
                  />
                  <StatCard
                    icon={TrendingUp}
                    label="Avg Time on Site"
                    value={`${Math.round(data.avgTimeSec)}s`}
                    sub="Across leads with behavioral data"
                  />
                  <StatCard
                    icon={Target}
                    label="Calculator Users"
                    value={data.calcUsers}
                    sub={data.total ? `${Math.round((data.calcUsers / data.total) * 100)}% of leads` : ""}
                    tone="good"
                  />
                </div>
              </TabsContent>
            </Tabs>

            {/* ─── Recent Sync Failures ─────────────────────────── */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <AlertTriangle className="h-4 w-4 text-amber-500" />
                  Recent Sync Failures
                </CardTitle>
                <CardDescription>Failed Lofty / Meta CAPI calls — fix these to stop losing attribution.</CardDescription>
              </CardHeader>
              <CardContent>
                {data.recentFailures.length === 0 ? (
                  <div className="flex items-center gap-2 text-sm text-emerald-600 dark:text-emerald-400 py-4">
                    <CheckCircle2 className="h-4 w-4" />
                    No sync failures in the last {range} days.
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>When</TableHead>
                        <TableHead>Destination</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Error</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {data.recentFailures.map((f) => (
                        <TableRow key={f.id}>
                          <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                            {format(new Date(f.created_at), "MMM dd, HH:mm")}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className="text-xs">{f.destination}</Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant="destructive" className="text-xs">
                              <XCircle className="h-3 w-3 mr-1" />
                              {f.status_code || f.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground max-w-md truncate">
                            {f.error_message || "—"}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </AdminLayout>
  );
}
