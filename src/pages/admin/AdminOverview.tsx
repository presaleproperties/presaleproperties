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
  Clock,
  TrendingUp,
  Home,
  MapPin,
  Mail,
  Eye,
  Plus,
  BarChart3,
  RefreshCw
} from "lucide-react";
import { format, subDays, startOfMonth } from "date-fns";

interface DashboardStats {
  // Core stats
  totalProjects: number;
  publishedProjects: number;
  totalLeads: number;
  leadsThisMonth: number;
  leadsLastMonth: number;
  totalBookings: number;
  pendingBookings: number;
  totalBlogPosts: number;
  publishedBlogs: number;
  
  // MLS stats
  mlsListings: number;
  
  // Recent activity
  recentLeads: Array<{
    id: string;
    name: string;
    email: string;
    created_at: string;
    project_id: string | null;
  }>;
  recentBookings: Array<{
    id: string;
    name: string;
    project_name: string;
    appointment_date: string;
    status: string;
  }>;
  
  // Top projects by views
  topProjects: Array<{
    id: string;
    name: string;
    city: string;
    view_count: number;
  }>;
  
  // Lead sources
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
      
      // Fetch all data in parallel
      const [
        projectsRes,
        leadsRes,
        leadsThisMonthRes,
        leadsLastMonthRes,
        bookingsRes,
        pendingBookingsRes,
        blogsRes,
        mlsRes,
        recentLeadsRes,
        recentBookingsRes,
        topProjectsRes
      ] = await Promise.all([
        supabase.from("presale_projects").select("id, is_published", { count: "exact" }),
        supabase.from("project_leads").select("*", { count: "exact", head: true }),
        supabase.from("project_leads").select("*", { count: "exact", head: true }).gte("created_at", startOfCurrentMonth),
        supabase.from("project_leads").select("*", { count: "exact", head: true }).gte("created_at", startOfLastMonth).lt("created_at", startOfCurrentMonth),
        supabase.from("bookings").select("*", { count: "exact", head: true }),
        supabase.from("bookings").select("*", { count: "exact", head: true }).eq("status", "pending"),
        supabase.from("blog_posts").select("id, is_published", { count: "exact" }),
        supabase.from("mls_listings").select("*", { count: "exact", head: true }),
        supabase.from("project_leads").select("id, name, email, created_at, project_id").order("created_at", { ascending: false }).limit(5),
        supabase.from("bookings").select("id, name, project_name, appointment_date, status").order("created_at", { ascending: false }).limit(5),
        supabase.from("presale_projects").select("id, name, city, view_count").eq("is_published", true).order("view_count", { ascending: false }).limit(5)
      ]);

      // Get leads by city
      const { data: leadsByCityData } = await supabase
        .from("project_leads")
        .select("city_interest");
      
      const leadsByCity: Record<string, number> = {};
      leadsByCityData?.forEach(lead => {
        if (lead.city_interest && Array.isArray(lead.city_interest)) {
          (lead.city_interest as string[]).forEach(city => {
            leadsByCity[city] = (leadsByCity[city] || 0) + 1;
          });
        }
      });

      const publishedProjects = projectsRes.data?.filter(p => p.is_published).length || 0;
      const publishedBlogs = blogsRes.data?.filter(b => b.is_published).length || 0;

      setStats({
        totalProjects: projectsRes.count || 0,
        publishedProjects,
        totalLeads: leadsRes.count || 0,
        leadsThisMonth: leadsThisMonthRes.count || 0,
        leadsLastMonth: leadsLastMonthRes.count || 0,
        totalBookings: bookingsRes.count || 0,
        pendingBookings: pendingBookingsRes.count || 0,
        totalBlogPosts: blogsRes.count || 0,
        publishedBlogs,
        mlsListings: mlsRes.count || 0,
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
          <div className="grid gap-4 lg:grid-cols-2">
            <Skeleton className="h-80" />
            <Skeleton className="h-80" />
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">Dashboard Overview</h1>
            <p className="text-muted-foreground">Welcome back! Here's what's happening with your platform.</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handleRefresh} disabled={refreshing}>
              <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Link to="/admin/projects/new">
              <Button size="sm">
                <Plus className="h-4 w-4 mr-2" />
                New Project
              </Button>
            </Link>
          </div>
        </div>

        {/* Alerts */}
        {stats && stats.pendingBookings > 0 && (
          <Card className="border-amber-500/50 bg-amber-500/5">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <AlertCircle className="h-5 w-5 text-amber-500" />
                  <p className="text-sm">
                    <strong>{stats.pendingBookings}</strong> booking{stats.pendingBookings !== 1 ? 's' : ''} awaiting confirmation
                  </p>
                </div>
                <Link to="/admin/bookings">
                  <Button variant="outline" size="sm">Review</Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Primary Stats Grid */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card className="relative overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Leads</CardTitle>
              <Users className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats?.totalLeads.toLocaleString()}</div>
              <div className="flex items-center gap-1 mt-1">
                {leadGrowth >= 0 ? (
                  <ArrowUpRight className="h-4 w-4 text-green-500" />
                ) : (
                  <ArrowDownRight className="h-4 w-4 text-red-500" />
                )}
                <span className={`text-sm ${leadGrowth >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                  {Math.abs(leadGrowth)}%
                </span>
                <span className="text-xs text-muted-foreground">vs last month</span>
              </div>
            </CardContent>
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-primary/20 to-primary" />
          </Card>

          <Card className="relative overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Presale Projects</CardTitle>
              <Building2 className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats?.publishedProjects}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {stats?.totalProjects} total ({stats?.totalProjects! - stats?.publishedProjects!} drafts)
              </p>
            </CardContent>
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500/20 to-blue-500" />
          </Card>

          <Card className="relative overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">MLS Listings</CardTitle>
              <Home className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats?.mlsListings.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground mt-1">Move-in ready homes</p>
            </CardContent>
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-green-500/20 to-green-500" />
          </Card>

          <Card className="relative overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Tour Bookings</CardTitle>
              <Calendar className="h-4 w-4 text-purple-500" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats?.totalBookings}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {stats?.pendingBookings} pending confirmation
              </p>
            </CardContent>
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-purple-500/20 to-purple-500" />
          </Card>
        </div>

        {/* Secondary Stats */}
        <div className="grid gap-4 sm:grid-cols-3">
          <Link to="/admin/blogs">
            <Card className="cursor-pointer transition-all hover:shadow-md hover:border-primary/50">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Blog Posts</p>
                    <p className="text-2xl font-bold">{stats?.publishedBlogs}</p>
                    <p className="text-xs text-muted-foreground">{stats?.totalBlogPosts! - stats?.publishedBlogs!} drafts</p>
                  </div>
                  <FileText className="h-8 w-8 text-muted-foreground/50" />
                </div>
              </CardContent>
            </Card>
          </Link>

          <Link to="/admin/leads">
            <Card className="cursor-pointer transition-all hover:shadow-md hover:border-primary/50">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Leads This Month</p>
                    <p className="text-2xl font-bold">{stats?.leadsThisMonth}</p>
                    <p className="text-xs text-muted-foreground">{stats?.leadsLastMonth} last month</p>
                  </div>
                  <TrendingUp className="h-8 w-8 text-muted-foreground/50" />
                </div>
              </CardContent>
            </Card>
          </Link>

          <Link to="/admin/leads/analytics">
            <Card className="cursor-pointer transition-all hover:shadow-md hover:border-primary/50">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Lead Analytics</p>
                    <p className="text-2xl font-bold">View</p>
                    <p className="text-xs text-muted-foreground">Conversion insights</p>
                  </div>
                  <BarChart3 className="h-8 w-8 text-muted-foreground/50" />
                </div>
              </CardContent>
            </Card>
          </Link>
        </div>

        {/* Activity Panels */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Recent Leads */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-lg">Recent Leads</CardTitle>
                <CardDescription>Latest inquiries from potential buyers</CardDescription>
              </div>
              <Link to="/admin/leads">
                <Button variant="ghost" size="sm">
                  View All <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </CardHeader>
            <CardContent>
              {stats?.recentLeads.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">No leads yet</p>
              ) : (
                <div className="space-y-4">
                  {stats?.recentLeads.map(lead => (
                    <div key={lead.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                          <Users className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium text-sm">{lead.name}</p>
                          <p className="text-xs text-muted-foreground">{lead.email}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-muted-foreground">
                          {format(new Date(lead.created_at), "MMM d, h:mm a")}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recent Bookings */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-lg">Recent Bookings</CardTitle>
                <CardDescription>Tour requests and appointments</CardDescription>
              </div>
              <Link to="/admin/bookings">
                <Button variant="ghost" size="sm">
                  View All <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </CardHeader>
            <CardContent>
              {stats?.recentBookings.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">No bookings yet</p>
              ) : (
                <div className="space-y-4">
                  {stats?.recentBookings.map(booking => (
                    <div key={booking.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-purple-500/10 flex items-center justify-center">
                          <Calendar className="h-5 w-5 text-purple-500" />
                        </div>
                        <div>
                          <p className="font-medium text-sm">{booking.name}</p>
                          <p className="text-xs text-muted-foreground">{booking.project_name}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge variant={booking.status === 'confirmed' ? 'default' : booking.status === 'pending' ? 'secondary' : 'outline'}>
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

        {/* Top Projects & Quick Actions */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Top Projects by Views */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Eye className="h-5 w-5" />
                Top Projects by Views
              </CardTitle>
            </CardHeader>
            <CardContent>
              {stats?.topProjects.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">No project views yet</p>
              ) : (
                <div className="space-y-3">
                  {stats?.topProjects.map((project, index) => (
                    <Link key={project.id} to={`/admin/projects/${project.id}`}>
                      <div className="flex items-center gap-4 p-3 rounded-lg hover:bg-muted transition-colors">
                        <span className="text-2xl font-bold text-muted-foreground/50 w-8">
                          {index + 1}
                        </span>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">{project.name}</p>
                          <p className="text-xs text-muted-foreground flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            {project.city}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold">{project.view_count.toLocaleString()}</p>
                          <p className="text-xs text-muted-foreground">views</p>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Link to="/admin/projects/new" className="block">
                <Button variant="outline" className="w-full justify-between h-12">
                  <span className="flex items-center gap-2">
                    <Building2 className="h-4 w-4" />
                    Add New Project
                  </span>
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <Link to="/admin/blogs/new" className="block">
                <Button variant="outline" className="w-full justify-between h-12">
                  <span className="flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    Write Blog Post
                  </span>
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <Link to="/admin/mls-sync" className="block">
                <Button variant="outline" className="w-full justify-between h-12">
                  <span className="flex items-center gap-2">
                    <RefreshCw className="h-4 w-4" />
                    MLS Sync Dashboard
                  </span>
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <Link to="/admin/market-data" className="block">
                <Button variant="outline" className="w-full justify-between h-12">
                  <span className="flex items-center gap-2">
                    <TrendingUp className="h-4 w-4" />
                    Update Market Data
                  </span>
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <Link to="/admin/email-templates" className="block">
                <Button variant="outline" className="w-full justify-between h-12">
                  <span className="flex items-center gap-2">
                    <Mail className="h-4 w-4" />
                    Email Templates
                  </span>
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminLayout>
  );
}
