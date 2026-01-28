import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
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
  Mail,
  Eye,
  Plus,
  BarChart3,
  RefreshCw,
  Crown,
  DollarSign,
  Activity,
  Sparkles,
  BedDouble,
  Clock
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
  
  // MLS & Rental stats
  mlsListings: number;
  rentalListings: number;
  avg1BedRent: number;
  avg2BedRent: number;
  avgTownhomeRent: number;
  
  // VIP & Client stats
  vipBuyers: number;
  totalClients: number;
  activeClients: number;
  
  // Recent activity
  recentLeads: Array<{
    id: string;
    name: string;
    email: string;
    created_at: string;
    project_id: string | null;
    lead_source: string | null;
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
  
  // Sync status
  lastMlsSync: string | null;
  lastRentalSync: string | null;
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
        rentalsRes,
        rentalStatsRes,
        vipBuyersRes,
        clientsRes,
        recentLeadsRes,
        recentBookingsRes,
        topProjectsRes,
        lastSyncRes
      ] = await Promise.all([
        supabase.from("presale_projects").select("id, is_published", { count: "exact" }),
        supabase.from("project_leads").select("*", { count: "exact", head: true }),
        supabase.from("project_leads").select("*", { count: "exact", head: true }).gte("created_at", startOfCurrentMonth),
        supabase.from("project_leads").select("*", { count: "exact", head: true }).gte("created_at", startOfLastMonth).lt("created_at", startOfCurrentMonth),
        supabase.from("bookings").select("*", { count: "exact", head: true }),
        supabase.from("bookings").select("*", { count: "exact", head: true }).eq("status", "pending"),
        supabase.from("blog_posts").select("id, is_published", { count: "exact" }),
        supabase.from("mls_listings").select("*", { count: "exact", head: true }).eq("mls_status", "Active").eq("is_rental", false),
        supabase.from("mls_listings").select("*", { count: "exact", head: true }).eq("is_rental", true).eq("mls_status", "Active"),
        supabase.from("mls_listings").select("lease_amount, bedrooms_total, property_sub_type").eq("is_rental", true).eq("mls_status", "Active").gt("lease_amount", 0),
        supabase.from("buyer_profiles").select("*", { count: "exact", head: true }).eq("is_vip", true),
        supabase.from("clients").select("id, last_seen_at", { count: "exact" }),
        supabase.from("project_leads").select("id, name, email, created_at, project_id, lead_source").order("created_at", { ascending: false }).limit(5),
        supabase.from("bookings").select("id, name, project_name, appointment_date, status").order("created_at", { ascending: false }).limit(5),
        supabase.from("presale_projects").select("id, name, city, view_count").eq("is_published", true).order("view_count", { ascending: false }).limit(5),
        supabase.from("mls_sync_logs").select("completed_at, sync_type").eq("status", "completed").order("completed_at", { ascending: false }).limit(5)
      ]);

      // Calculate rental averages
      let avg1Bed = 0, avg2Bed = 0, avgTownhome = 0;
      if (rentalStatsRes.data) {
        const oneBed = rentalStatsRes.data.filter(r => r.bedrooms_total === 1 && !r.property_sub_type?.toLowerCase().includes('townhouse'));
        const twoBed = rentalStatsRes.data.filter(r => r.bedrooms_total === 2 && !r.property_sub_type?.toLowerCase().includes('townhouse'));
        const townhomes = rentalStatsRes.data.filter(r => r.property_sub_type?.toLowerCase().includes('townhouse') || r.property_sub_type?.toLowerCase().includes('townhome'));
        
        if (oneBed.length) avg1Bed = Math.round(oneBed.reduce((s, r) => s + (r.lease_amount || 0), 0) / oneBed.length);
        if (twoBed.length) avg2Bed = Math.round(twoBed.reduce((s, r) => s + (r.lease_amount || 0), 0) / twoBed.length);
        if (townhomes.length) avgTownhome = Math.round(townhomes.reduce((s, r) => s + (r.lease_amount || 0), 0) / townhomes.length);
      }

      // Active clients (seen in last 7 days)
      const sevenDaysAgo = subDays(new Date(), 7);
      const activeClients = clientsRes.data?.filter(c => c.last_seen_at && new Date(c.last_seen_at) > sevenDaysAgo).length || 0;

      const publishedProjects = projectsRes.data?.filter(p => p.is_published).length || 0;
      const publishedBlogs = blogsRes.data?.filter(b => b.is_published).length || 0;

      // Get last sync times
      const mlsSync = lastSyncRes.data?.find(s => s.sync_type !== 'rental');
      const rentalSync = lastSyncRes.data?.find(s => s.sync_type === 'rental');

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
        rentalListings: rentalsRes.count || 0,
        avg1BedRent: avg1Bed,
        avg2BedRent: avg2Bed,
        avgTownhomeRent: avgTownhome,
        vipBuyers: vipBuyersRes.count || 0,
        totalClients: clientsRes.count || 0,
        activeClients,
        recentLeads: recentLeadsRes.data || [],
        recentBookings: recentBookingsRes.data || [],
        topProjects: topProjectsRes.data || [],
        lastMlsSync: mlsSync?.completed_at || null,
        lastRentalSync: rentalSync?.completed_at || null,
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

  const formatCurrency = (amount: number) => `$${amount.toLocaleString()}`;

  if (loading) {
    return (
      <AdminLayout>
        <div className="space-y-6">
          <Skeleton className="h-10 w-80" />
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-36" />)}
          </div>
          <div className="grid gap-4 lg:grid-cols-3">
            {[1, 2, 3].map(i => <Skeleton key={i} className="h-48" />)}
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-8">
        {/* Premium Header */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-6 md:p-8">
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxwYXRoIGQ9Ik0zNiAxOGMzLjMxNCAwIDYgMi42ODYgNiA2cy0yLjY4NiA2LTYgNi02LTIuNjg2LTYtNiAyLjY4Ni02IDYtNiIgc3Ryb2tlPSJyZ2JhKDI1NSwyNTUsMjU1LDAuMDUpIiBzdHJva2Utd2lkdGg9IjIiLz48L2c+PC9zdmc+')] opacity-30" />
          <div className="relative flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-white flex items-center gap-3">
                <Sparkles className="h-7 w-7 text-amber-400" />
                Admin Command Center
              </h1>
              <p className="text-slate-400 mt-1">Real-time insights across your entire platform</p>
            </div>
            <div className="flex gap-3">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleRefresh} 
                disabled={refreshing}
                className="border-white/20 text-white hover:bg-white/10"
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
              <Link to="/admin/projects/new">
                <Button size="sm" className="bg-amber-500 hover:bg-amber-600 text-black font-semibold">
                  <Plus className="h-4 w-4 mr-2" />
                  New Project
                </Button>
              </Link>
            </div>
          </div>
          
          {/* Time indicator */}
          <div className="mt-4 flex items-center gap-2 text-xs text-slate-500">
            <Clock className="h-3 w-3" />
            Last updated: {format(new Date(), "MMM d, h:mm a")}
          </div>
        </div>

        {/* Alert Banner */}
        {stats && stats.pendingBookings > 0 && (
          <Card className="border-amber-500/50 bg-gradient-to-r from-amber-500/10 to-amber-600/5 backdrop-blur">
            <CardContent className="py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-amber-500/20 flex items-center justify-center">
                    <AlertCircle className="h-5 w-5 text-amber-500" />
                  </div>
                  <div>
                    <p className="font-medium">
                      {stats.pendingBookings} booking{stats.pendingBookings !== 1 ? 's' : ''} awaiting confirmation
                    </p>
                    <p className="text-xs text-muted-foreground">Review and confirm to keep leads engaged</p>
                  </div>
                </div>
                <Link to="/admin/bookings">
                  <Button size="sm" className="bg-amber-500 hover:bg-amber-600 text-black">
                    Review Now
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Primary KPI Grid */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {/* Leads */}
          <Card className="relative overflow-hidden group hover:shadow-lg transition-all duration-300 border-0 bg-gradient-to-br from-emerald-50 to-emerald-100/50 dark:from-emerald-950/50 dark:to-emerald-900/30">
            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full -translate-y-1/2 translate-x-1/2" />
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-emerald-700 dark:text-emerald-400">Total Leads</CardTitle>
              <Users className="h-5 w-5 text-emerald-600" />
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold text-emerald-900 dark:text-emerald-100">{stats?.totalLeads.toLocaleString()}</div>
              <div className="flex items-center gap-2 mt-2">
                {leadGrowth >= 0 ? (
                  <Badge className="bg-emerald-500 hover:bg-emerald-600">
                    <ArrowUpRight className="h-3 w-3 mr-1" />
                    {Math.abs(leadGrowth)}%
                  </Badge>
                ) : (
                  <Badge variant="destructive">
                    <ArrowDownRight className="h-3 w-3 mr-1" />
                    {Math.abs(leadGrowth)}%
                  </Badge>
                )}
                <span className="text-xs text-muted-foreground">vs last month</span>
              </div>
            </CardContent>
          </Card>

          {/* Projects */}
          <Card className="relative overflow-hidden group hover:shadow-lg transition-all duration-300 border-0 bg-gradient-to-br from-blue-50 to-blue-100/50 dark:from-blue-950/50 dark:to-blue-900/30">
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full -translate-y-1/2 translate-x-1/2" />
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-blue-700 dark:text-blue-400">Presale Projects</CardTitle>
              <Building2 className="h-5 w-5 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold text-blue-900 dark:text-blue-100">{stats?.publishedProjects}</div>
              <div className="mt-2">
                <div className="flex justify-between text-xs text-muted-foreground mb-1">
                  <span>Published</span>
                  <span>{stats?.publishedProjects}/{stats?.totalProjects}</span>
                </div>
                <Progress value={(stats?.publishedProjects || 0) / (stats?.totalProjects || 1) * 100} className="h-1.5" />
              </div>
            </CardContent>
          </Card>

          {/* MLS Listings */}
          <Card className="relative overflow-hidden group hover:shadow-lg transition-all duration-300 border-0 bg-gradient-to-br from-violet-50 to-violet-100/50 dark:from-violet-950/50 dark:to-violet-900/30">
            <div className="absolute top-0 right-0 w-32 h-32 bg-violet-500/10 rounded-full -translate-y-1/2 translate-x-1/2" />
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-violet-700 dark:text-violet-400">MLS Listings</CardTitle>
              <Home className="h-5 w-5 text-violet-600" />
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold text-violet-900 dark:text-violet-100">{stats?.mlsListings.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground mt-2">Move-in ready homes</p>
            </CardContent>
          </Card>

          {/* VIP Buyers */}
          <Card className="relative overflow-hidden group hover:shadow-lg transition-all duration-300 border-0 bg-gradient-to-br from-amber-50 to-amber-100/50 dark:from-amber-950/50 dark:to-amber-900/30">
            <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 rounded-full -translate-y-1/2 translate-x-1/2" />
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-amber-700 dark:text-amber-400">VIP Buyers</CardTitle>
              <Crown className="h-5 w-5 text-amber-600" />
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold text-amber-900 dark:text-amber-100">{stats?.vipBuyers}</div>
              <p className="text-xs text-muted-foreground mt-2">Verified investors</p>
            </CardContent>
          </Card>
        </div>

        {/* Rental Intelligence Section */}
        <Card className="border-0 bg-gradient-to-r from-slate-900 to-slate-800 text-white overflow-hidden">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg flex items-center gap-2">
                  <DollarSign className="h-5 w-5 text-emerald-400" />
                  Rental Market Intelligence
                </CardTitle>
                <CardDescription className="text-slate-400">Metro Vancouver average rents from {stats?.rentalListings.toLocaleString()} active listings</CardDescription>
              </div>
              <Link to="/admin/rental-sync">
                <Button variant="outline" size="sm" className="border-white/20 text-white hover:bg-white/10">
                  View Dashboard
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-6">
              <div className="text-center p-4 rounded-xl bg-white/5 backdrop-blur">
                <BedDouble className="h-6 w-6 mx-auto text-emerald-400 mb-2" />
                <p className="text-3xl font-bold">{formatCurrency(stats?.avg1BedRent || 0)}</p>
                <p className="text-sm text-slate-400">1 Bedroom</p>
              </div>
              <div className="text-center p-4 rounded-xl bg-white/5 backdrop-blur">
                <BedDouble className="h-6 w-6 mx-auto text-blue-400 mb-2" />
                <p className="text-3xl font-bold">{formatCurrency(stats?.avg2BedRent || 0)}</p>
                <p className="text-sm text-slate-400">2 Bedroom</p>
              </div>
              <div className="text-center p-4 rounded-xl bg-white/5 backdrop-blur">
                <Building2 className="h-6 w-6 mx-auto text-amber-400 mb-2" />
                <p className="text-3xl font-bold">{formatCurrency(stats?.avgTownhomeRent || 0)}</p>
                <p className="text-sm text-slate-400">Townhome</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Secondary Stats Row */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Link to="/admin/bookings">
            <Card className="cursor-pointer transition-all hover:shadow-md hover:border-primary/50 h-full">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Tour Bookings</p>
                    <p className="text-3xl font-bold">{stats?.totalBookings}</p>
                    <p className="text-xs text-amber-600 font-medium mt-1">{stats?.pendingBookings} pending</p>
                  </div>
                  <Calendar className="h-10 w-10 text-primary/30" />
                </div>
              </CardContent>
            </Card>
          </Link>

          <Link to="/admin/clients">
            <Card className="cursor-pointer transition-all hover:shadow-md hover:border-primary/50 h-full">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Clients</p>
                    <p className="text-3xl font-bold">{stats?.totalClients}</p>
                    <p className="text-xs text-emerald-600 font-medium mt-1">{stats?.activeClients} active this week</p>
                  </div>
                  <Activity className="h-10 w-10 text-primary/30" />
                </div>
              </CardContent>
            </Card>
          </Link>

          <Link to="/admin/blogs">
            <Card className="cursor-pointer transition-all hover:shadow-md hover:border-primary/50 h-full">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Blog Posts</p>
                    <p className="text-3xl font-bold">{stats?.publishedBlogs}</p>
                    <p className="text-xs text-muted-foreground mt-1">{stats?.totalBlogPosts! - stats?.publishedBlogs!} drafts</p>
                  </div>
                  <FileText className="h-10 w-10 text-primary/30" />
                </div>
              </CardContent>
            </Card>
          </Link>

          <Link to="/admin/leads/analytics">
            <Card className="cursor-pointer transition-all hover:shadow-md hover:border-primary/50 h-full">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">This Month</p>
                    <p className="text-3xl font-bold">{stats?.leadsThisMonth}</p>
                    <p className="text-xs text-muted-foreground mt-1">{stats?.leadsLastMonth} last month</p>
                  </div>
                  <TrendingUp className="h-10 w-10 text-primary/30" />
                </div>
              </CardContent>
            </Card>
          </Link>
        </div>

        {/* Activity Panels */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Recent Leads */}
          <Card className="border shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between border-b bg-muted/30">
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
            <CardContent className="p-0">
              {stats?.recentLeads.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-12">No leads yet</p>
              ) : (
                <div className="divide-y">
                  {stats?.recentLeads.map(lead => (
                    <div key={lead.id} className="flex items-center justify-between p-4 hover:bg-muted/50 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center text-white font-semibold text-sm">
                          {lead.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-medium text-sm">{lead.name}</p>
                          <p className="text-xs text-muted-foreground">{lead.email}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        {lead.lead_source && (
                          <Badge variant="outline" className="text-xs mb-1">{lead.lead_source.replace(/_/g, ' ')}</Badge>
                        )}
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

          {/* Top Projects */}
          <Card className="border shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between border-b bg-muted/30">
              <div>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Eye className="h-5 w-5" />
                  Top Projects by Views
                </CardTitle>
              </div>
              <Link to="/admin/projects">
                <Button variant="ghost" size="sm">
                  View All <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </CardHeader>
            <CardContent className="p-0">
              {stats?.topProjects.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-12">No project views yet</p>
              ) : (
                <div className="divide-y">
                  {stats?.topProjects.map((project, index) => (
                    <Link key={project.id} to={`/admin/projects/${project.id}`}>
                      <div className="flex items-center gap-4 p-4 hover:bg-muted/50 transition-colors">
                        <span className={`text-2xl font-bold w-8 ${index === 0 ? 'text-amber-500' : index === 1 ? 'text-slate-400' : index === 2 ? 'text-amber-700' : 'text-muted-foreground/40'}`}>
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
                          <p className="text-lg font-bold">{project.view_count.toLocaleString()}</p>
                          <p className="text-xs text-muted-foreground">views</p>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Quick Actions</CardTitle>
            <CardDescription>Common administrative tasks</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
              <Link to="/admin/projects/new">
                <Button variant="outline" className="w-full h-20 flex-col gap-2 hover:border-primary hover:bg-primary/5">
                  <Building2 className="h-5 w-5" />
                  <span className="text-xs">Add Project</span>
                </Button>
              </Link>
              <Link to="/admin/blogs/new">
                <Button variant="outline" className="w-full h-20 flex-col gap-2 hover:border-primary hover:bg-primary/5">
                  <FileText className="h-5 w-5" />
                  <span className="text-xs">Write Blog</span>
                </Button>
              </Link>
              <Link to="/admin/mls-sync">
                <Button variant="outline" className="w-full h-20 flex-col gap-2 hover:border-primary hover:bg-primary/5">
                  <RefreshCw className="h-5 w-5" />
                  <span className="text-xs">MLS Sync</span>
                </Button>
              </Link>
              <Link to="/admin/rental-sync">
                <Button variant="outline" className="w-full h-20 flex-col gap-2 hover:border-primary hover:bg-primary/5">
                  <DollarSign className="h-5 w-5" />
                  <span className="text-xs">Rentals</span>
                </Button>
              </Link>
              <Link to="/admin/email-workflows">
                <Button variant="outline" className="w-full h-20 flex-col gap-2 hover:border-primary hover:bg-primary/5">
                  <Mail className="h-5 w-5" />
                  <span className="text-xs">Workflows</span>
                </Button>
              </Link>
              <Link to="/admin/leads/analytics">
                <Button variant="outline" className="w-full h-20 flex-col gap-2 hover:border-primary hover:bg-primary/5">
                  <BarChart3 className="h-5 w-5" />
                  <span className="text-xs">Analytics</span>
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
