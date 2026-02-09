import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";

import { 
  Users, 
  Building2, 
  FileText,
  Calendar,
  ArrowRight,
  ArrowUpRight,
  ArrowDownRight,
  AlertCircle,
  TrendingUp,
  Home,
  MapPin,
  Eye,
  Plus,
  BarChart3,
  RefreshCw,
  FileStack,
  Sparkles,
  CheckCircle,
  Clock
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
  totalBlogPosts: number;
  publishedBlogs: number;
  mlsListings: number;
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
  leadsByCity: Record<string, number>;
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
      
      // Use efficient count queries with filters instead of fetching all data
      const [
        totalProjectsRes,
        publishedProjectsRes,
        leadsRes,
        leadsThisMonthRes,
        leadsLastMonthRes,
        bookingsRes,
        pendingBookingsRes,
        totalBlogsRes,
        publishedBlogsRes,
        mlsRes,
        recentLeadsRes,
        recentBookingsRes,
        topProjectsRes,
        totalAssignmentsRes,
        publishedAssignmentsRes,
        pendingAssignmentsRes,
        leadsByCityRes
      ] = await Promise.all([
        // Count queries with filters (much faster than fetching all records)
        supabase.from("presale_projects").select("*", { count: "exact", head: true }),
        supabase.from("presale_projects").select("*", { count: "exact", head: true }).eq("is_published", true),
        supabase.from("project_leads").select("*", { count: "exact", head: true }),
        supabase.from("project_leads").select("*", { count: "exact", head: true }).gte("created_at", startOfCurrentMonth),
        supabase.from("project_leads").select("*", { count: "exact", head: true }).gte("created_at", startOfLastMonth).lt("created_at", startOfCurrentMonth),
        supabase.from("bookings").select("*", { count: "exact", head: true }),
        supabase.from("bookings").select("*", { count: "exact", head: true }).eq("status", "pending"),
        supabase.from("blog_posts").select("*", { count: "exact", head: true }),
        supabase.from("blog_posts").select("*", { count: "exact", head: true }).eq("is_published", true),
        supabase.from("mls_listings").select("*", { count: "exact", head: true }),
        supabase.from("project_leads").select("id, name, email, created_at, project_id, landing_page, presale_projects(name)").order("created_at", { ascending: false }).limit(5),
        supabase.from("bookings").select("id, name, project_name, appointment_date, status").order("created_at", { ascending: false }).limit(5),
        supabase.from("presale_projects").select("id, name, city, view_count").eq("is_published", true).order("view_count", { ascending: false }).limit(5),
        supabase.from("listings").select("*", { count: "exact", head: true }),
        supabase.from("listings").select("*", { count: "exact", head: true }).eq("status", "published"),
        supabase.from("listings").select("*", { count: "exact", head: true }).eq("status", "pending_approval"),
        // Only fetch city_interest for recent leads (last 1000) to avoid scale issues
        supabase.from("project_leads").select("city_interest").not("city_interest", "is", null).limit(1000)
      ]);

      // Process city interests from limited recent leads
      const leadsByCity: Record<string, number> = {};
      leadsByCityRes.data?.forEach(lead => {
        if (lead.city_interest && Array.isArray(lead.city_interest)) {
          (lead.city_interest as string[]).forEach(city => {
            leadsByCity[city] = (leadsByCity[city] || 0) + 1;
          });
        }
      });

      setStats({
        totalProjects: totalProjectsRes.count || 0,
        publishedProjects: publishedProjectsRes.count || 0,
        totalLeads: leadsRes.count || 0,
        leadsThisMonth: leadsThisMonthRes.count || 0,
        leadsLastMonth: leadsLastMonthRes.count || 0,
        totalBookings: bookingsRes.count || 0,
        pendingBookings: pendingBookingsRes.count || 0,
        totalBlogPosts: totalBlogsRes.count || 0,
        publishedBlogs: publishedBlogsRes.count || 0,
        mlsListings: mlsRes.count || 0,
        totalAssignments: totalAssignmentsRes.count || 0,
        publishedAssignments: publishedAssignmentsRes.count || 0,
        pendingAssignments: pendingAssignmentsRes.count || 0,
        recentLeads: recentLeadsRes.data || [],
        recentBookings: recentBookingsRes.data || [],
        topProjects: topProjectsRes.data || [],
        leadsByCity
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
          <Skeleton className="h-8 w-64" />
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-32" />)}
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-8">
        {/* Premium Header */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-6 sm:p-8">
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wMyI+PGNpcmNsZSBjeD0iMzAiIGN5PSIzMCIgcj0iMiIvPjwvZz48L2c+PC9zdmc+')] opacity-50" />
          <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-white">Command Center</h1>
              <p className="text-slate-300 mt-1">Welcome back. Here's your platform overview.</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleRefresh} 
                disabled={refreshing}
                className="bg-white/10 border-white/20 text-white hover:bg-white/20"
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
              
              <Link to="/admin/projects/new">
                <Button size="sm" className="bg-primary hover:bg-primary/90">
                  <Plus className="h-4 w-4 mr-2" />
                  New Project
                </Button>
              </Link>
            </div>
          </div>
        </div>

        {/* Urgent Alerts */}
        {stats && (stats.pendingBookings > 0 || stats.pendingAssignments > 0) && (
          <div className="grid gap-3 sm:grid-cols-2">
            {stats.pendingBookings > 0 && (
              <Card className="border-amber-500/30 bg-amber-500/5 hover:bg-amber-500/10 transition-colors">
                <CardContent className="pt-4 pb-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-amber-500/20 flex items-center justify-center">
                        <Clock className="h-5 w-5 text-amber-500" />
                      </div>
                      <div>
                        <p className="font-semibold text-amber-700 dark:text-amber-400">
                          {stats.pendingBookings} Booking{stats.pendingBookings !== 1 ? 's' : ''} Pending
                        </p>
                        <p className="text-xs text-muted-foreground">Awaiting confirmation</p>
                      </div>
                    </div>
                    <Link to="/admin/bookings">
                      <Button variant="outline" size="sm" className="border-amber-500/50 text-amber-600 hover:bg-amber-500/10">
                        Review
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            )}
            {stats.pendingAssignments > 0 && (
              <Card className="border-blue-500/30 bg-blue-500/5 hover:bg-blue-500/10 transition-colors">
                <CardContent className="pt-4 pb-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-blue-500/20 flex items-center justify-center">
                        <FileStack className="h-5 w-5 text-blue-500" />
                      </div>
                      <div>
                        <p className="font-semibold text-blue-700 dark:text-blue-400">
                          {stats.pendingAssignments} Assignment{stats.pendingAssignments !== 1 ? 's' : ''} Pending
                        </p>
                        <p className="text-xs text-muted-foreground">Awaiting approval</p>
                      </div>
                    </div>
                    <Link to="/admin/listings?tab=pending">
                      <Button variant="outline" size="sm" className="border-blue-500/50 text-blue-600 hover:bg-blue-500/10">
                        Review
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* Primary Stats Grid - Premium Cards */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card className="group relative overflow-hidden border-0 bg-gradient-to-br from-violet-500/10 via-background to-background shadow-lg hover:shadow-xl transition-all duration-300">
            <div className="absolute top-0 right-0 h-24 w-24 bg-violet-500/10 rounded-full blur-2xl group-hover:bg-violet-500/20 transition-colors" />
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Leads</CardTitle>
              <div className="h-9 w-9 rounded-xl bg-violet-500/10 flex items-center justify-center">
                <Users className="h-5 w-5 text-violet-500" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats?.totalLeads.toLocaleString()}</div>
              <div className="flex items-center gap-1 mt-2">
                {leadGrowth >= 0 ? (
                  <div className="flex items-center gap-1 text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded-full text-xs font-medium">
                    <ArrowUpRight className="h-3 w-3" />
                    {Math.abs(leadGrowth)}%
                  </div>
                ) : (
                  <div className="flex items-center gap-1 text-red-500 bg-red-500/10 px-2 py-0.5 rounded-full text-xs font-medium">
                    <ArrowDownRight className="h-3 w-3" />
                    {Math.abs(leadGrowth)}%
                  </div>
                )}
                <span className="text-xs text-muted-foreground">vs last month</span>
              </div>
            </CardContent>
          </Card>

          <Card className="group relative overflow-hidden border-0 bg-gradient-to-br from-blue-500/10 via-background to-background shadow-lg hover:shadow-xl transition-all duration-300">
            <div className="absolute top-0 right-0 h-24 w-24 bg-blue-500/10 rounded-full blur-2xl group-hover:bg-blue-500/20 transition-colors" />
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Presale Projects</CardTitle>
              <div className="h-9 w-9 rounded-xl bg-blue-500/10 flex items-center justify-center">
                <Building2 className="h-5 w-5 text-blue-500" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats?.publishedProjects}</div>
              <p className="text-xs text-muted-foreground mt-2">
                {stats?.totalProjects} total • {stats?.totalProjects! - stats?.publishedProjects!} drafts
              </p>
            </CardContent>
          </Card>

          <Card className="group relative overflow-hidden border-0 bg-gradient-to-br from-emerald-500/10 via-background to-background shadow-lg hover:shadow-xl transition-all duration-300">
            <div className="absolute top-0 right-0 h-24 w-24 bg-emerald-500/10 rounded-full blur-2xl group-hover:bg-emerald-500/20 transition-colors" />
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Assignments</CardTitle>
              <div className="h-9 w-9 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                <FileStack className="h-5 w-5 text-emerald-500" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats?.publishedAssignments}</div>
              <p className="text-xs text-muted-foreground mt-2">
                {stats?.totalAssignments} total • {stats?.pendingAssignments} pending
              </p>
            </CardContent>
          </Card>

          <Card className="group relative overflow-hidden border-0 bg-gradient-to-br from-amber-500/10 via-background to-background shadow-lg hover:shadow-xl transition-all duration-300">
            <div className="absolute top-0 right-0 h-24 w-24 bg-amber-500/10 rounded-full blur-2xl group-hover:bg-amber-500/20 transition-colors" />
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">MLS Listings</CardTitle>
              <div className="h-9 w-9 rounded-xl bg-amber-500/10 flex items-center justify-center">
                <Home className="h-5 w-5 text-amber-500" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats?.mlsListings.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground mt-2">Move-in ready homes</p>
            </CardContent>
          </Card>
        </div>

        {/* Quick Stats Row */}
        <div className="grid gap-3 sm:grid-cols-4">
          <Link to="/admin/bookings" className="group">
            <Card className="hover:border-purple-500/50 transition-all cursor-pointer h-full">
              <CardContent className="pt-5 pb-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-2xl font-bold">{stats?.totalBookings}</p>
                    <p className="text-xs text-muted-foreground">Tour Bookings</p>
                  </div>
                  <Calendar className="h-6 w-6 text-purple-500 opacity-50 group-hover:opacity-100 transition-opacity" />
                </div>
              </CardContent>
            </Card>
          </Link>
          
          <Link to="/admin/blogs" className="group">
            <Card className="hover:border-pink-500/50 transition-all cursor-pointer h-full">
              <CardContent className="pt-5 pb-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-2xl font-bold">{stats?.publishedBlogs}</p>
                    <p className="text-xs text-muted-foreground">Blog Posts</p>
                  </div>
                  <FileText className="h-6 w-6 text-pink-500 opacity-50 group-hover:opacity-100 transition-opacity" />
                </div>
              </CardContent>
            </Card>
          </Link>
          
          <Link to="/admin/leads" className="group">
            <Card className="hover:border-green-500/50 transition-all cursor-pointer h-full">
              <CardContent className="pt-5 pb-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-2xl font-bold">{stats?.leadsThisMonth}</p>
                    <p className="text-xs text-muted-foreground">Leads This Month</p>
                  </div>
                  <TrendingUp className="h-6 w-6 text-green-500 opacity-50 group-hover:opacity-100 transition-opacity" />
                </div>
              </CardContent>
            </Card>
          </Link>
          
          <Link to="/admin/leads/analytics" className="group">
            <Card className="hover:border-cyan-500/50 transition-all cursor-pointer h-full">
              <CardContent className="pt-5 pb-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-2xl font-bold">View</p>
                    <p className="text-xs text-muted-foreground">Lead Analytics</p>
                  </div>
                  <BarChart3 className="h-6 w-6 text-cyan-500 opacity-50 group-hover:opacity-100 transition-opacity" />
                </div>
              </CardContent>
            </Card>
          </Link>
        </div>

        {/* Activity Panels */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Recent Leads */}
          <Card className="border-0 shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between border-b bg-muted/30">
              <div>
                <CardTitle className="text-lg">Recent Leads</CardTitle>
                <CardDescription>Latest inquiries from potential buyers</CardDescription>
              </div>
              <Link to="/admin/leads">
                <Button variant="ghost" size="sm" className="text-primary hover:text-primary">
                  View All <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </CardHeader>
            <CardContent className="pt-4">
              {stats?.recentLeads.length === 0 ? (
                <div className="text-center py-8">
                  <Users className="h-10 w-10 text-muted-foreground/30 mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">No leads yet</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {stats?.recentLeads.map(lead => {
                    const projectName = lead.presale_projects?.name || lead.landing_page || null;
                    return (
                      <div key={lead.id} className="flex items-center justify-between p-3 rounded-xl bg-muted/30 hover:bg-muted/50 transition-colors">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-white font-semibold text-sm">
                            {lead.name.charAt(0).toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <p className="font-medium text-sm">{lead.name}</p>
                            <p className="text-xs text-muted-foreground truncate">{lead.email}</p>
                            {projectName && (
                              <p className="text-xs text-primary font-medium truncate mt-0.5">
                                {projectName}
                              </p>
                            )}
                          </div>
                        </div>
                        <p className="text-xs text-muted-foreground whitespace-nowrap ml-2">
                          {format(new Date(lead.created_at), "MMM d, h:mm a")}
                        </p>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recent Bookings */}
          <Card className="border-0 shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between border-b bg-muted/30">
              <div>
                <CardTitle className="text-lg">Recent Bookings</CardTitle>
                <CardDescription>Tour requests and appointments</CardDescription>
              </div>
              <Link to="/admin/bookings">
                <Button variant="ghost" size="sm" className="text-primary hover:text-primary">
                  View All <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </CardHeader>
            <CardContent className="pt-4">
              {stats?.recentBookings.length === 0 ? (
                <div className="text-center py-8">
                  <Calendar className="h-10 w-10 text-muted-foreground/30 mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">No bookings yet</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {stats?.recentBookings.map(booking => (
                    <div key={booking.id} className="flex items-center justify-between p-3 rounded-xl bg-muted/30 hover:bg-muted/50 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center">
                          <Calendar className="h-5 w-5 text-white" />
                        </div>
                        <div>
                          <p className="font-medium text-sm">{booking.name}</p>
                          <p className="text-xs text-muted-foreground truncate max-w-[180px]">{booking.project_name}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge 
                          variant={booking.status === 'confirmed' ? 'default' : booking.status === 'pending' ? 'secondary' : 'outline'}
                          className={booking.status === 'confirmed' ? 'bg-emerald-500' : ''}
                        >
                          {booking.status}
                        </Badge>
                        <p className="text-xs text-muted-foreground mt-1">
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
        <Card className="border-0 shadow-lg">
          <CardHeader className="border-b bg-muted/30">
            <CardTitle className="text-lg flex items-center gap-2">
              <Eye className="h-5 w-5 text-primary" />
              Top Projects by Views
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            {stats?.topProjects.length === 0 ? (
              <div className="text-center py-8">
                <Building2 className="h-10 w-10 text-muted-foreground/30 mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">No published projects yet</p>
              </div>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
                {stats?.topProjects.map((project, index) => (
                  <Link key={project.id} to={`/admin/projects/${project.id}`}>
                    <div className="p-4 rounded-xl bg-muted/30 hover:bg-muted/50 transition-colors cursor-pointer group">
                      <div className="flex items-center gap-2 mb-2">
                        <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                          index === 0 ? 'bg-amber-500/20 text-amber-600' :
                          index === 1 ? 'bg-slate-400/20 text-slate-600' :
                          index === 2 ? 'bg-orange-500/20 text-orange-600' :
                          'bg-muted text-muted-foreground'
                        }`}>
                          #{index + 1}
                        </span>
                      </div>
                      <h4 className="font-semibold text-sm truncate group-hover:text-primary transition-colors">
                        {project.name}
                      </h4>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                        <MapPin className="h-3 w-3" />
                        {project.city}
                      </div>
                      <div className="flex items-center gap-1 text-xs mt-2">
                        <Eye className="h-3 w-3 text-primary" />
                        <span className="font-medium">{project.view_count.toLocaleString()} views</span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}