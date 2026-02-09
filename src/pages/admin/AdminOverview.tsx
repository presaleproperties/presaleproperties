import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";

import { 
  Users, 
  Building2, 
  Calendar,
  ArrowRight,
  ArrowUpRight,
  ArrowDownRight,
  Clock,
  Home,
  MapPin,
  Eye,
  FileStack,
  RefreshCw
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
    id: string;
    name: string;
    city: string;
    view_count: number;
  }>;
}

export default function AdminOverview() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const startOfCurrentMonth = startOfMonth(new Date()).toISOString();
      const startOfLastMonth = startOfMonth(subDays(new Date(), 30)).toISOString();
      
      const [
        totalProjectsRes,
        publishedProjectsRes,
        leadsRes,
        leadsThisMonthRes,
        leadsLastMonthRes,
        bookingsRes,
        pendingBookingsRes,
        recentLeadsRes,
        recentBookingsRes,
        topProjectsRes,
        totalAssignmentsRes,
        publishedAssignmentsRes,
        pendingAssignmentsRes,
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
        supabase.from("presale_projects").select("id, name, city, view_count").eq("is_published", true).order("view_count", { ascending: false }).limit(5),
        supabase.from("listings").select("*", { count: "exact", head: true }),
        supabase.from("listings").select("*", { count: "exact", head: true }).eq("status", "published"),
        supabase.from("listings").select("*", { count: "exact", head: true }).eq("status", "pending_approval"),
      ]);

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
      });
    } catch (error) {
      console.error("Error fetching stats:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    fetchStats();
  };

  const leadGrowth = stats?.leadsLastMonth 
    ? Math.round(((stats.leadsThisMonth - stats.leadsLastMonth) / stats.leadsLastMonth) * 100)
    : 0;

  if (loading) {
    return (
      <AdminLayout>
        <div className="space-y-6">
          <Skeleton className="h-6 w-48" />
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-24" />)}
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-foreground">Overview</h1>
            <p className="text-sm text-muted-foreground">
              {format(new Date(), "EEEE, MMMM d")}
            </p>
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleRefresh} 
            disabled={refreshing}
            className="h-8 text-xs"
          >
            <RefreshCw className={`h-3.5 w-3.5 mr-1.5 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>

        {/* Alerts */}
        {stats && (stats.pendingBookings > 0 || stats.pendingAssignments > 0) && (
          <div className="flex flex-wrap gap-2">
            {stats.pendingBookings > 0 && (
              <Link to="/admin/bookings">
                <Badge variant="outline" className="gap-1.5 py-1.5 px-3 bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100 cursor-pointer">
                  <Clock className="h-3 w-3" />
                  {stats.pendingBookings} pending booking{stats.pendingBookings !== 1 ? 's' : ''}
                </Badge>
              </Link>
            )}
            {stats.pendingAssignments > 0 && (
              <Link to="/admin/listings?tab=pending">
                <Badge variant="outline" className="gap-1.5 py-1.5 px-3 bg-sky-50 text-sky-700 border-sky-200 hover:bg-sky-100 cursor-pointer">
                  <FileStack className="h-3 w-3" />
                  {stats.pendingAssignments} pending assignment{stats.pendingAssignments !== 1 ? 's' : ''}
                </Badge>
              </Link>
            )}
          </div>
        )}

        {/* Stats */}
        <div className="grid gap-3 grid-cols-2 lg:grid-cols-4">
          <StatCard
            label="Leads"
            value={stats?.totalLeads || 0}
            sub={
              <span className={`inline-flex items-center gap-0.5 text-xs ${leadGrowth >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                {leadGrowth >= 0 ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                {Math.abs(leadGrowth)}% vs last month
              </span>
            }
            icon={Users}
          />
          <StatCard
            label="Projects"
            value={stats?.publishedProjects || 0}
            sub={<span className="text-xs text-muted-foreground">{stats?.totalProjects} total</span>}
            icon={Building2}
          />
          <StatCard
            label="Assignments"
            value={stats?.publishedAssignments || 0}
            sub={<span className="text-xs text-muted-foreground">{stats?.totalAssignments} total</span>}
            icon={FileStack}
          />
          <StatCard
            label="Bookings"
            value={stats?.totalBookings || 0}
            sub={<span className="text-xs text-muted-foreground">{stats?.pendingBookings} pending</span>}
            icon={Calendar}
          />
        </div>

        {/* Activity */}
        <div className="grid gap-4 lg:grid-cols-2">
          {/* Recent Leads */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between py-3 px-4">
              <CardTitle className="text-sm font-medium">Recent Leads</CardTitle>
              <Link to="/admin/leads">
                <Button variant="ghost" size="sm" className="h-7 text-xs text-muted-foreground">
                  View all <ArrowRight className="ml-1 h-3 w-3" />
                </Button>
              </Link>
            </CardHeader>
            <CardContent className="px-4 pb-4 pt-0">
              {stats?.recentLeads.length === 0 ? (
                <EmptyPlaceholder icon={Users} message="No leads yet" />
              ) : (
                <div className="space-y-1">
                  {stats?.recentLeads.map(lead => {
                    const projectName = lead.presale_projects?.name || lead.landing_page || null;
                    return (
                      <div key={lead.id} className="flex items-center justify-between py-2 px-2 -mx-2 rounded-md hover:bg-muted/40 transition-colors">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center text-xs font-medium text-muted-foreground shrink-0">
                            {lead.name.charAt(0).toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-medium truncate">{lead.name}</p>
                            {projectName && (
                              <p className="text-xs text-muted-foreground truncate">{projectName}</p>
                            )}
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
            <CardHeader className="flex flex-row items-center justify-between py-3 px-4">
              <CardTitle className="text-sm font-medium">Recent Bookings</CardTitle>
              <Link to="/admin/bookings">
                <Button variant="ghost" size="sm" className="h-7 text-xs text-muted-foreground">
                  View all <ArrowRight className="ml-1 h-3 w-3" />
                </Button>
              </Link>
            </CardHeader>
            <CardContent className="px-4 pb-4 pt-0">
              {stats?.recentBookings.length === 0 ? (
                <EmptyPlaceholder icon={Calendar} message="No bookings yet" />
              ) : (
                <div className="space-y-1">
                  {stats?.recentBookings.map(booking => (
                    <div key={booking.id} className="flex items-center justify-between py-2 px-2 -mx-2 rounded-md hover:bg-muted/40 transition-colors">
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">{booking.name}</p>
                        <p className="text-xs text-muted-foreground truncate">{booking.project_name}</p>
                      </div>
                      <div className="flex items-center gap-2 ml-3 shrink-0">
                        <Badge 
                          variant="outline"
                          className={`text-[10px] px-1.5 py-0 ${
                            booking.status === 'confirmed' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                            booking.status === 'pending' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                            ''
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

        {/* Top Projects */}
        {stats?.topProjects && stats.topProjects.length > 0 && (
          <Card>
            <CardHeader className="py-3 px-4">
              <CardTitle className="text-sm font-medium flex items-center gap-1.5">
                <Eye className="h-3.5 w-3.5 text-muted-foreground" />
                Top Projects
              </CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-4 pt-0">
              <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-5">
                {stats.topProjects.map((project, index) => (
                  <Link key={project.id} to={`/admin/projects/${project.id}/edit`}>
                    <div className="p-3 rounded-lg border border-border/60 hover:border-border hover:bg-muted/30 transition-colors cursor-pointer group">
                      <div className="flex items-baseline justify-between mb-1">
                        <span className="text-[10px] font-mono text-muted-foreground">#{index + 1}</span>
                        <span className="text-[11px] text-muted-foreground flex items-center gap-0.5">
                          <Eye className="h-2.5 w-2.5" />
                          {project.view_count.toLocaleString()}
                        </span>
                      </div>
                      <h4 className="text-xs font-medium truncate group-hover:text-foreground transition-colors">
                        {project.name}
                      </h4>
                      <p className="text-[10px] text-muted-foreground flex items-center gap-0.5 mt-0.5">
                        <MapPin className="h-2.5 w-2.5" />
                        {project.city}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </AdminLayout>
  );
}

function StatCard({ 
  label, value, sub, icon: Icon 
}: { 
  label: string; 
  value: number; 
  sub: React.ReactNode; 
  icon: React.ComponentType<{ className?: string }>;
}) {
  return (
    <Card className="border-border/60">
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-2">
          <p className="text-xs font-medium text-muted-foreground">{label}</p>
          <Icon className="h-4 w-4 text-muted-foreground/50" />
        </div>
        <p className="text-2xl font-semibold tracking-tight">{value.toLocaleString()}</p>
        <div className="mt-1">{sub}</div>
      </CardContent>
    </Card>
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
