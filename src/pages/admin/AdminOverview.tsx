import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { EngagementFunnel } from "@/components/admin/dashboard/EngagementFunnel";
import { TopProjectsTable } from "@/components/admin/dashboard/TopProjectsTable";
import { TopListingsTable } from "@/components/admin/dashboard/TopListingsTable";
import { TopMlsListingsTable } from "@/components/admin/dashboard/TopMlsListingsTable";

import { 
  Users, 
  Building2, 
  Calendar,
  ArrowRight,
  ArrowUpRight,
  ArrowDownRight,
  Clock,
  FileStack,
  RefreshCw,
  Sparkles,
} from "lucide-react";
import { format, subDays, startOfMonth } from "date-fns";

interface DashboardStats {
  totalProjects: number;
  publishedProjects: number;
  totalLeads: number;
  leadsThisMonth: number;
  leadsLastMonth: number;
  totalBookings: number;
  pendingBookings: number;
  totalAssignments: number;
  publishedAssignments: number;
  pendingAssignments: number;
  recentLeads: Array<{
    id: string;
    name: string;
    email: string;
    created_at: string;
    project_id: string | null;
    landing_page: string | null;
    presale_projects?: { name: string } | null;
  }>;
  recentBookings: Array<{
    id: string;
    name: string;
    project_name: string;
    appointment_date: string;
    status: string;
  }>;
  topProjects: Array<{
    project_id: string;
    project_name: string;
    project_city: string;
    total_views: number;
    unique_visitors: number;
    floorplan_views: number;
    cta_clicks: number;
    form_starts: number;
    form_submits: number;
  }>;
  topListings: Array<{
    id: string;
    title: string;
    project_name: string;
    city: string;
    assignment_price: number;
    status: string;
    view_count: number;
    lead_count: number;
  }>;
  topMlsListings: Array<{
    listing_id: string;
    listing_key: string;
    property_address: string;
    city: string;
    bedrooms_total: number | null;
    bathrooms_total: number | null;
    listing_price: number;
    total_views: number;
    unique_viewers: number;
    cta_clicks: number;
    form_starts: number;
  }>;
  funnel: {
    total_page_views: number;
    total_property_views: number;
    total_floorplan_views: number;
    total_cta_clicks: number;
    total_form_starts: number;
    total_form_submits: number;
    unique_page_viewers: number;
    unique_property_viewers: number;
  } | null;
}

const statCardConfigs = [
  { label: "Leads", icon: Users, iconBg: "bg-emerald-100", iconColor: "text-emerald-600", accentBorder: "border-l-emerald-500" },
  { label: "Projects", icon: Building2, iconBg: "bg-blue-100", iconColor: "text-blue-600", accentBorder: "border-l-blue-500" },
  { label: "Assignments", icon: FileStack, iconBg: "bg-violet-100", iconColor: "text-violet-600", accentBorder: "border-l-violet-500" },
  { label: "Bookings", icon: Calendar, iconBg: "bg-amber-100", iconColor: "text-amber-600", accentBorder: "border-l-amber-500" },
];

export default function AdminOverview() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => { fetchStats(); }, []);

  const fetchStats = async () => {
    try {
      const startOfCurrentMonth = startOfMonth(new Date()).toISOString();
      const startOfLastMonth = startOfMonth(subDays(new Date(), 30)).toISOString();
      
      const [
        totalProjectsRes, publishedProjectsRes,
        leadsRes, leadsThisMonthRes, leadsLastMonthRes,
        bookingsRes, pendingBookingsRes,
        recentLeadsRes, recentBookingsRes,
        topProjectsRes,
        totalAssignmentsRes, publishedAssignmentsRes, pendingAssignmentsRes,
        funnelRes,
        topListingsRes,
        topMlsListingsRes,
      ] = await Promise.all([
        supabase.from("presale_projects").select("*", { count: "exact", head: true }),
        supabase.from("presale_projects").select("*", { count: "exact", head: true }).eq("is_published", true),
        supabase.from("project_leads").select("*", { count: "exact", head: true }),
        supabase.from("project_leads").select("*", { count: "exact", head: true }).gte("created_at", startOfCurrentMonth),
        supabase.from("project_leads").select("*", { count: "exact", head: true }).gte("created_at", startOfLastMonth).lt("created_at", startOfCurrentMonth),
        supabase.from("bookings").select("*", { count: "exact", head: true }),
        supabase.from("bookings").select("*", { count: "exact", head: true }).eq("status", "pending"),
        supabase.from("project_leads").select("id, name, email, created_at, project_id, landing_page, presale_projects(name)").order("created_at", { ascending: false }).limit(5),
        supabase.from("bookings").select("id, name, project_name, appointment_date, status").order("created_at", { ascending: false }).limit(5),
        supabase.rpc("get_top_projects_with_engagement", { days_back: 90, result_limit: 10 }),
        (supabase as any).from("listings").select("*", { count: "exact", head: true }),
        (supabase as any).from("listings").select("*", { count: "exact", head: true }).eq("status", "published"),
        (supabase as any).from("listings").select("*", { count: "exact", head: true }).eq("status", "pending_approval"),
        supabase.rpc("get_engagement_funnel", { days_back: 90 }),
        (supabase as any).from("listings").select("id, title, project_name, city, assignment_price, status").eq("status", "published").order("created_at", { ascending: false }).limit(5),
        supabase.rpc("get_top_mls_listings_with_engagement", { days_back: 90, result_limit: 5 }),
      ]);

      // Build top listings with lead counts
      const listingsData = (topListingsRes.data || []).map((l: any) => ({
        ...l,
        view_count: 0,
        lead_count: 0,
      }));

      const funnelData = funnelRes.data;

      setStats({
        totalProjects: totalProjectsRes.count || 0,
        publishedProjects: publishedProjectsRes.count || 0,
        totalLeads: leadsRes.count || 0,
        leadsThisMonth: leadsThisMonthRes.count || 0,
        leadsLastMonth: leadsLastMonthRes.count || 0,
        totalBookings: bookingsRes.count || 0,
        pendingBookings: pendingBookingsRes.count || 0,
        totalAssignments: totalAssignmentsRes.count || 0,
        publishedAssignments: publishedAssignmentsRes.count || 0,
        pendingAssignments: pendingAssignmentsRes.count || 0,
        recentLeads: recentLeadsRes.data || [],
        recentBookings: recentBookingsRes.data || [],
        topProjects: topProjectsRes.data || [],
        topListings: listingsData,
        topMlsListings: topMlsListingsRes.data || [],
        funnel: Array.isArray(funnelData) ? funnelData[0] || null : funnelData,
      });
    } catch (error) {
      console.error("Error fetching stats:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => { setRefreshing(true); fetchStats(); };

  const leadGrowth = stats?.leadsLastMonth 
    ? Math.round(((stats.leadsThisMonth - stats.leadsLastMonth) / stats.leadsLastMonth) * 100)
    : 0;

  if (loading) {
    return (
      <AdminLayout>
        <div className="space-y-6">
          <Skeleton className="h-8 w-48" />
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-28" />)}
          </div>
          <Skeleton className="h-64" />
        </div>
      </AdminLayout>
    );
  }

  const statValues = [
    {
      value: stats?.totalLeads ?? 0,
      sub: (
        <span className={`inline-flex items-center gap-0.5 text-xs font-medium ${leadGrowth >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
          {leadGrowth >= 0 ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
          {Math.abs(leadGrowth)}% vs last month
        </span>
      ),
    },
    { value: stats?.publishedProjects ?? 0, sub: <span className="text-xs text-muted-foreground">{stats?.totalProjects} total</span> },
    { value: stats?.publishedAssignments ?? 0, sub: <span className="text-xs text-muted-foreground">{stats?.totalAssignments} total</span> },
    { value: stats?.totalBookings ?? 0, sub: <span className="text-xs text-muted-foreground">{stats?.pendingBookings} pending</span> },
  ];

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Sparkles className="h-5 w-5 text-primary" />
              <h1 className="text-xl font-bold text-foreground">Overview</h1>
            </div>
            <p className="text-sm text-muted-foreground">{format(new Date(), "EEEE, MMMM d")}</p>
          </div>
          <Button variant="outline" size="sm" onClick={handleRefresh} disabled={refreshing} className="h-9 text-xs gap-1.5">
            <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>

        {/* Alerts */}
        {stats && (stats.pendingBookings > 0 || stats.pendingAssignments > 0) && (
          <div className="flex flex-wrap gap-2">
            {stats.pendingBookings > 0 && (
              <Link to="/admin/bookings">
                <Badge variant="outline" className="gap-1.5 py-1.5 px-3 bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100 cursor-pointer transition-colors">
                  <Clock className="h-3 w-3" />
                  {stats.pendingBookings} pending booking{stats.pendingBookings !== 1 ? 's' : ''}
                </Badge>
              </Link>
            )}
            {stats.pendingAssignments > 0 && (
              <Link to="/admin/listings?tab=pending">
                <Badge variant="outline" className="gap-1.5 py-1.5 px-3 bg-violet-50 text-violet-700 border-violet-200 hover:bg-violet-100 cursor-pointer transition-colors">
                  <FileStack className="h-3 w-3" />
                  {stats.pendingAssignments} pending assignment{stats.pendingAssignments !== 1 ? 's' : ''}
                </Badge>
              </Link>
            )}
          </div>
        )}

        {/* Stats */}
        <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
          {statCardConfigs.map((config, i) => {
            const Icon = config.icon;
            return (
              <Card key={config.label} className={`border-l-4 ${config.accentBorder} overflow-hidden`}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className={`rounded-xl ${config.iconBg} p-2.5`}>
                      <Icon className={`h-5 w-5 ${config.iconColor}`} />
                    </div>
                  </div>
                  <p className="text-2xl font-bold tracking-tight text-foreground">{(statValues[i]?.value ?? 0).toLocaleString()}</p>
                  <p className="text-xs font-medium text-muted-foreground mt-0.5 mb-1">{config.label}</p>
                  <div>{statValues[i]?.sub}</div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Engagement Funnel */}
        <EngagementFunnel data={stats?.funnel ?? null} />

        {/* Top Projects Table */}
        <TopProjectsTable projects={stats?.topProjects ?? []} />

        {/* Activity + Top Listings */}
        <div className="grid gap-4 lg:grid-cols-2">
          {/* Recent Leads */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between py-4 px-5">
              <div className="flex items-center gap-2">
                <div className="rounded-lg bg-emerald-100 p-1.5">
                  <Users className="h-3.5 w-3.5 text-emerald-600" />
                </div>
                <CardTitle className="text-sm font-semibold">Recent Leads</CardTitle>
              </div>
              <Link to="/admin/leads">
                <Button variant="ghost" size="sm" className="h-7 text-xs text-muted-foreground hover:text-foreground">
                  View all <ArrowRight className="ml-1 h-3 w-3" />
                </Button>
              </Link>
            </CardHeader>
            <CardContent className="px-5 pb-4 pt-0">
              {stats?.recentLeads.length === 0 ? (
                <EmptyPlaceholder icon={Users} message="No leads yet" />
              ) : (
                <div className="space-y-0.5">
                  {stats?.recentLeads.map(lead => {
                    const projectName = lead.presale_projects?.name || lead.landing_page || null;
                    return (
                      <div key={lead.id} className="flex items-center justify-between py-2.5 px-3 -mx-3 rounded-lg hover:bg-muted/50 transition-colors">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="h-9 w-9 rounded-full bg-gradient-to-br from-emerald-100 to-emerald-50 flex items-center justify-center text-xs font-bold text-emerald-700 shrink-0">
                            {lead.name.charAt(0).toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-medium truncate">{lead.name}</p>
                            {projectName && <p className="text-xs text-muted-foreground truncate">{projectName}</p>}
                          </div>
                        </div>
                        <p className="text-[11px] text-muted-foreground whitespace-nowrap ml-3">
                          {format(new Date(lead.created_at), "MMM d")}
                        </p>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recent Bookings */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between py-4 px-5">
              <div className="flex items-center gap-2">
                <div className="rounded-lg bg-amber-100 p-1.5">
                  <Calendar className="h-3.5 w-3.5 text-amber-600" />
                </div>
                <CardTitle className="text-sm font-semibold">Recent Bookings</CardTitle>
              </div>
              <Link to="/admin/bookings">
                <Button variant="ghost" size="sm" className="h-7 text-xs text-muted-foreground hover:text-foreground">
                  View all <ArrowRight className="ml-1 h-3 w-3" />
                </Button>
              </Link>
            </CardHeader>
            <CardContent className="px-5 pb-4 pt-0">
              {stats?.recentBookings.length === 0 ? (
                <EmptyPlaceholder icon={Calendar} message="No bookings yet" />
              ) : (
                <div className="space-y-0.5">
                  {stats?.recentBookings.map(booking => (
                    <div key={booking.id} className="flex items-center justify-between py-2.5 px-3 -mx-3 rounded-lg hover:bg-muted/50 transition-colors">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="h-9 w-9 rounded-full bg-gradient-to-br from-amber-100 to-amber-50 flex items-center justify-center text-xs font-bold text-amber-700 shrink-0">
                          {booking.name.charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium truncate">{booking.name}</p>
                          <p className="text-xs text-muted-foreground truncate">{booking.project_name}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 ml-3 shrink-0">
                        <Badge 
                          variant="outline"
                          className={`text-[10px] px-1.5 py-0 ${
                            booking.status === 'confirmed' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                            booking.status === 'pending' ? 'bg-amber-50 text-amber-700 border-amber-200' : ''
                          }`}
                        >
                          {booking.status}
                        </Badge>
                        <p className="text-[11px] text-muted-foreground whitespace-nowrap">
                          {format(new Date(booking.appointment_date), "MMM d")}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Top Listings */}
        <TopListingsTable listings={stats?.topListings ?? []} />

        {/* Top Move-In Ready (MLS) */}
        <TopMlsListingsTable listings={stats?.topMlsListings ?? []} />
      </div>
    </AdminLayout>
  );
}

function EmptyPlaceholder({ icon: Icon, message }: { icon: React.ComponentType<{ className?: string }>; message: string }) {
  return (
    <div className="text-center py-8">
      <Icon className="h-8 w-8 text-muted-foreground/20 mx-auto mb-2" />
      <p className="text-xs text-muted-foreground">{message}</p>
    </div>
  );
}
