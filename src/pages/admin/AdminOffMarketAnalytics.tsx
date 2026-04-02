import { useState, useEffect, useMemo } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { Eye, Unlock, TrendingUp, Building2 } from "lucide-react";
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from "recharts";
import { format, subDays, startOfDay } from "date-fns";

const COLORS = ["hsl(40,65%,55%)", "hsl(200,70%,55%)", "hsl(150,60%,45%)", "hsl(280,60%,55%)", "hsl(10,70%,55%)", "hsl(60,50%,50%)"];

export default function AdminOffMarketAnalytics() {
  const [analytics, setAnalytics] = useState<any[]>([]);
  const [accessRequests, setAccessRequests] = useState<any[]>([]);
  const [listings, setListings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetch() {
      const thirtyDaysAgo = subDays(new Date(), 30).toISOString();

      const [analyticsRes, accessRes, listingsRes] = await Promise.all([
        supabase.from("off_market_analytics").select("*").gte("created_at", thirtyDaysAgo),
        supabase.from("off_market_access").select("*, off_market_listings(linked_project_name)"),
        supabase.from("off_market_listings").select("id, linked_project_name, view_count, status").eq("status", "published"),
      ]);

      setAnalytics(analyticsRes.data || []);
      setAccessRequests(accessRes.data || []);
      setListings(listingsRes.data || []);
      setLoading(false);
    }
    fetch();
  }, []);

  // Metrics
  const totalViews = useMemo(() => analytics.filter(a => a.event_type === "page_view").length, [analytics]);
  const totalUnlocks = useMemo(() => accessRequests.length, [accessRequests]);
  const recentUnlocks = useMemo(() => accessRequests.filter(a => a.created_at >= subDays(new Date(), 30).toISOString()).length, [accessRequests]);
  const conversionRate = totalViews > 0 ? ((recentUnlocks / totalViews) * 100).toFixed(1) : "0";

  const mostPopular = useMemo(() => {
    const counts: Record<string, { name: string; count: number }> = {};
    accessRequests.forEach((a: any) => {
      const name = a.off_market_listings?.linked_project_name || "Unknown";
      if (!counts[a.listing_id]) counts[a.listing_id] = { name, count: 0 };
      counts[a.listing_id].count++;
    });
    const sorted = Object.values(counts).sort((a, b) => b.count - a.count);
    return sorted[0]?.name || "—";
  }, [accessRequests]);

  // Daily chart data
  const dailyData = useMemo(() => {
    const days: Record<string, { views: number; unlocks: number }> = {};
    for (let i = 29; i >= 0; i--) {
      const d = format(subDays(new Date(), i), "MMM dd");
      days[d] = { views: 0, unlocks: 0 };
    }
    analytics.filter(a => a.event_type === "page_view").forEach(a => {
      const d = format(new Date(a.created_at), "MMM dd");
      if (days[d]) days[d].views++;
    });
    accessRequests.forEach(a => {
      const d = format(new Date(a.created_at), "MMM dd");
      if (days[d]) days[d].unlocks++;
    });
    return Object.entries(days).map(([date, v]) => ({ date, ...v }));
  }, [analytics, accessRequests]);

  // Unlocks by project
  const unlocksByProject = useMemo(() => {
    const counts: Record<string, number> = {};
    accessRequests.forEach((a: any) => {
      const name = a.off_market_listings?.linked_project_name || "Unknown";
      counts[name] = (counts[name] || 0) + 1;
    });
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([name, count]) => ({ name: name.length > 18 ? name.slice(0, 18) + "…" : name, count }));
  }, [accessRequests]);

  // Budget distribution
  const budgetDist = useMemo(() => {
    const buckets: Record<string, number> = { "Under $500K": 0, "$500K–$700K": 0, "$700K–$1M": 0, "$1M+": 0, "Unknown": 0 };
    accessRequests.forEach((a: any) => {
      const max = a.budget_max;
      if (!max) { buckets["Unknown"]++; return; }
      if (max < 500000) buckets["Under $500K"]++;
      else if (max < 700000) buckets["$500K–$700K"]++;
      else if (max < 1000000) buckets["$700K–$1M"]++;
      else buckets["$1M+"]++;
    });
    return Object.entries(buckets).filter(([, v]) => v > 0).map(([name, value]) => ({ name, value }));
  }, [accessRequests]);

  if (loading) {
    return (
      <AdminLayout>
        <div className="space-y-6 p-6">
          <Skeleton className="h-8 w-64" />
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[1,2,3,4].map(i => <Skeleton key={i} className="h-28" />)}
          </div>
          <Skeleton className="h-72" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6 p-4 sm:p-6">
        <h1 className="text-xl font-bold">Off-Market Analytics</h1>

        {/* Metrics */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <MetricCard icon={Eye} label="Page Views (30d)" value={totalViews} />
          <MetricCard icon={Unlock} label="Unlock Requests" value={recentUnlocks} />
          <MetricCard icon={TrendingUp} label="Conversion Rate" value={`${conversionRate}%`} />
          <MetricCard icon={Building2} label="Most Popular" value={mostPopular} small />
        </div>

        {/* Line chart */}
        <Card>
          <CardHeader><CardTitle className="text-sm">Daily Views & Unlock Requests</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={dailyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} interval={4} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="views" stroke="hsl(var(--muted-foreground))" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="unlocks" stroke="hsl(40,65%,55%)" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <div className="grid md:grid-cols-2 gap-4">
          {/* Bar chart */}
          <Card>
            <CardHeader><CardTitle className="text-sm">Unlock Requests by Project</CardTitle></CardHeader>
            <CardContent>
              {unlocksByProject.length === 0 ? (
                <p className="text-sm text-muted-foreground py-8 text-center">No data yet</p>
              ) : (
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={unlocksByProject} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis type="number" tick={{ fontSize: 11 }} />
                    <YAxis dataKey="name" type="category" width={120} tick={{ fontSize: 11 }} />
                    <Tooltip />
                    <Bar dataKey="count" fill="hsl(40,65%,55%)" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          {/* Pie chart */}
          <Card>
            <CardHeader><CardTitle className="text-sm">Budget Distribution</CardTitle></CardHeader>
            <CardContent>
              {budgetDist.length === 0 ? (
                <p className="text-sm text-muted-foreground py-8 text-center">No data yet</p>
              ) : (
                <ResponsiveContainer width="100%" height={280}>
                  <PieChart>
                    <Pie data={budgetDist} cx="50%" cy="50%" innerRadius={50} outerRadius={90} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                      {budgetDist.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminLayout>
  );
}

function MetricCard({ icon: Icon, label, value, small }: { icon: any; label: string; value: string | number; small?: boolean }) {
  return (
    <Card>
      <CardContent className="pt-5 pb-4 px-4">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
            <Icon className="h-4 w-4 text-primary" />
          </div>
          <div className="min-w-0">
            <p className="text-[11px] text-muted-foreground truncate">{label}</p>
            <p className={`font-bold truncate ${small ? "text-sm" : "text-xl"}`}>{value}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
