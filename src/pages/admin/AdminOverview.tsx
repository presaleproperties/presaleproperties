import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

import {
  Plus,
  Mail,
  Users,
  Building2,
  Calendar,
  ArrowRight,
  ArrowUpRight,
  ArrowDownRight,
  RefreshCw,
  ExternalLink,
  Star,
  FileStack,
  AlertCircle,
  XCircle,
  CheckCheck,
  ShieldCheck,
  UserCheck,
  Home,
  BarChart3,
  Sparkles,
  Presentation,
} from "lucide-react";
import { format, startOfMonth } from "date-fns";

export default function AdminOverview() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState<any>(null);
  const [pendingListings, setPendingListings] = useState<any[]>([]);
  const [pendingDevelopers, setPendingDevelopers] = useState<any[]>([]);
  const [pendingAgents, setPendingAgents] = useState<any[]>([]);
  const [approvingId, setApprovingId] = useState<string | null>(null);

  useEffect(() => { fetchAll(); }, []);

  const fetchAll = async () => {
    const startOfCurrentMonth = startOfMonth(new Date()).toISOString();
    const startOfLastMonth = startOfMonth(new Date(new Date().getFullYear(), new Date().getMonth() - 1, 1)).toISOString();

    const [
      leadsRes, leadsThisMonthRes, leadsLastMonthRes,
      projectsRes, publishedProjectsRes,
      assignmentsRes, pendingAssignmentsRes,
      bookingsRes, pendingBookingsRes,
      listingsRes, developersRes, agentsRes,
    ] = await Promise.allSettled([
      supabase.from("project_leads").select("*", { count: "exact", head: true }),
      supabase.from("project_leads").select("*", { count: "exact", head: true }).gte("created_at", startOfCurrentMonth),
      supabase.from("project_leads").select("*", { count: "exact", head: true }).gte("created_at", startOfLastMonth).lt("created_at", startOfCurrentMonth),
      supabase.from("presale_projects").select("*", { count: "exact", head: true }),
      supabase.from("presale_projects").select("*", { count: "exact", head: true }).eq("is_published", true),
      (supabase as any).from("listings").select("*", { count: "exact", head: true }),
      (supabase as any).from("listings").select("*", { count: "exact", head: true }).eq("status", "pending_approval"),
      supabase.from("bookings").select("*", { count: "exact", head: true }),
      supabase.from("bookings").select("*", { count: "exact", head: true }).eq("status", "pending"),
      (supabase as any).from("listings").select("id, title, project_name, city, beds, baths, assignment_price, created_at").eq("status", "pending_approval").order("created_at", { ascending: false }).limit(10),
      supabase.from("developer_profiles").select("id, company_name, contact_name, phone, website_url, created_at").eq("verification_status", "pending").order("created_at", { ascending: false }).limit(10),
      supabase.from("agent_profiles").select("id, user_id, license_number, brokerage_name, created_at").eq("verification_status", "unverified").order("created_at", { ascending: false }).limit(10),
    ]);

    const c = (r: PromiseSettledResult<any>) => r.status === "fulfilled" ? (r.value as any)?.count ?? 0 : 0;
    const d = (r: PromiseSettledResult<any>) => r.status === "fulfilled" ? (r.value as any)?.data ?? [] : [];

    const totalLeads = c(leadsRes);
    const leadsThisMonth = c(leadsThisMonthRes);
    const leadsLastMonth = c(leadsLastMonthRes);
    const growth = leadsLastMonth ? Math.round(((leadsThisMonth - leadsLastMonth) / leadsLastMonth) * 100) : 0;

    setStats({
      totalLeads, leadsThisMonth, leadsLastMonth, growth,
      totalProjects: c(projectsRes), publishedProjects: c(publishedProjectsRes),
      totalAssignments: c(assignmentsRes), pendingAssignments: c(pendingAssignmentsRes),
      totalBookings: c(bookingsRes), pendingBookings: c(pendingBookingsRes),
    });
    setPendingListings(d(listingsRes));
    setPendingDevelopers(d(developersRes));
    setPendingAgents(d(agentsRes));
    setLoading(false);
    setRefreshing(false);
  };

  const handleRefresh = () => { setRefreshing(true); fetchAll(); };

  // Approval handlers
  const approve = async (table: string, id: string, updates: any, setter: Function) => {
    setApprovingId(id);
    const { error } = await (supabase as any).from(table).update(updates).eq("id", id);
    if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
    else { toast({ title: "Approved!" }); setter((p: any[]) => p.filter(x => x.id !== id)); }
    setApprovingId(null);
  };
  const reject = async (table: string, id: string, updates: any, setter: Function) => {
    setApprovingId(id);
    const { error } = await (supabase as any).from(table).update(updates).eq("id", id);
    if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
    else { toast({ title: "Rejected" }); setter((p: any[]) => p.filter(x => x.id !== id)); }
    setApprovingId(null);
  };

  const totalPending = pendingListings.length + pendingDevelopers.length + pendingAgents.length;

  if (loading) {
    return (
      <AdminLayout>
        <div className="space-y-6 p-1">
          <Skeleton className="h-10 w-64" />
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"><Skeleton className="h-32" /><Skeleton className="h-32" /><Skeleton className="h-32" /></div>
          <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">{[1,2,3,4].map(i => <Skeleton key={i} className="h-24" />)}</div>
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
            <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
            <p className="text-sm text-muted-foreground">{format(new Date(), "EEEE, MMMM d, yyyy")}</p>
          </div>
          <Button variant="outline" size="sm" onClick={handleRefresh} disabled={refreshing} className="gap-1.5">
            <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>

        {/* ── QUICK ACTIONS ── */}
        <div className="grid gap-3 sm:grid-cols-2">
          <Link to="/admin/projects/new">
            <Card className="group cursor-pointer border-2 border-dashed border-primary/30 hover:border-primary/60 bg-primary/5 hover:bg-primary/10 transition-all h-full">
              <CardContent className="p-5 flex items-center gap-4">
                <div className="rounded-xl bg-primary/15 p-3 group-hover:scale-110 transition-transform">
                  <Plus className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="font-bold text-foreground">Add Project</p>
                  <p className="text-xs text-muted-foreground">Publish a new presale project</p>
                </div>
              </CardContent>
            </Card>
          </Link>

          <Link to="/dashboard/decks">
            <Card className="group cursor-pointer hover:shadow-card-hover transition-all h-full border-teal-200/60 bg-gradient-to-br from-teal-50/50 to-transparent">
              <CardContent className="p-5 flex items-center gap-4">
                <div className="rounded-xl bg-teal-100 p-3 group-hover:scale-110 transition-transform">
                  <Presentation className="h-6 w-6 text-teal-600" />
                </div>
                <div>
                  <p className="font-bold text-foreground">Pitch Decks</p>
                  <p className="text-xs text-muted-foreground">Create & send project decks</p>
                </div>
              </CardContent>
            </Card>
          </Link>
        </div>

        {/* ── PORTALS ROW ── */}
        <div className="grid gap-3 sm:grid-cols-2">
          <Link to="/developer">
            <Card className="group cursor-pointer border-amber-200/60 bg-gradient-to-r from-amber-50/80 to-orange-50/50 hover:shadow-card-hover transition-all h-full">
              <CardContent className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="rounded-xl bg-amber-100 p-2.5">
                    <Building2 className="h-5 w-5 text-amber-600" />
                  </div>
                  <div>
                    <p className="font-semibold text-foreground text-sm">Developer Portal</p>
                    <p className="text-xs text-muted-foreground">Inventory & tour requests</p>
                  </div>
                </div>
                <ExternalLink className="h-4 w-4 text-amber-500 group-hover:translate-x-0.5 transition-transform" />
              </CardContent>
            </Card>
          </Link>
          <Link to="/dashboard">
            <Card className="group cursor-pointer border-blue-200/60 bg-gradient-to-r from-blue-50/80 to-indigo-50/50 hover:shadow-card-hover transition-all h-full">
              <CardContent className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="rounded-xl bg-blue-100 p-2.5">
                    <Sparkles className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="font-semibold text-foreground text-sm">Agent Hub</p>
                    <p className="text-xs text-muted-foreground">Listings, leads & decks</p>
                  </div>
                </div>
                <ExternalLink className="h-4 w-4 text-blue-500 group-hover:translate-x-0.5 transition-transform" />
              </CardContent>
            </Card>
          </Link>
        </div>

        {/* ── KPI STATS ── */}
        <div className="grid gap-3 grid-cols-2 lg:grid-cols-4">
          {[
            { label: "Leads", value: stats.totalLeads, icon: Users, color: "text-emerald-600", bg: "bg-emerald-100", href: "/admin/leads", sub: (
              <span className={`inline-flex items-center gap-0.5 text-xs font-medium ${stats.growth >= 0 ? "text-emerald-600" : "text-red-500"}`}>
                {stats.growth >= 0 ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                {Math.abs(stats.growth)}% vs last mo
              </span>
            )},
            { label: "Projects", value: stats.publishedProjects, icon: Building2, color: "text-blue-600", bg: "bg-blue-100", href: "/admin/projects", sub: <span className="text-xs text-muted-foreground">{stats.totalProjects} total</span> },
            { label: "Assignments", value: stats.totalAssignments, icon: FileStack, color: "text-violet-600", bg: "bg-violet-100", href: "/admin/assignments", sub: stats.pendingAssignments > 0 ? <span className="text-xs text-amber-600">{stats.pendingAssignments} pending</span> : <span className="text-xs text-muted-foreground">All clear</span> },
            { label: "Bookings", value: stats.totalBookings, icon: Calendar, color: "text-amber-600", bg: "bg-amber-100", href: "/admin/bookings", sub: stats.pendingBookings > 0 ? <span className="text-xs text-amber-600">{stats.pendingBookings} pending</span> : <span className="text-xs text-muted-foreground">None pending</span> },
          ].map(({ label, value, icon: Icon, color, bg, href, sub }) => (
            <Link key={label} to={href}>
              <Card className="group cursor-pointer hover:shadow-card-hover transition-all h-full">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className={`rounded-lg ${bg} p-1.5`}><Icon className={`h-4 w-4 ${color}`} /></div>
                    <span className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">{label}</span>
                  </div>
                  <p className="text-2xl font-bold text-foreground">{value.toLocaleString()}</p>
                  <div className="mt-1">{sub}</div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>

        {/* ── SECONDARY ACTIONS ── */}
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { label: "View Leads", href: "/admin/leads", icon: Users, desc: "Lead pipeline" },
            { label: "Bookings", href: "/admin/bookings", icon: Calendar, desc: "Tour requests" },
            { label: "Analytics", href: "/admin/leads/analytics", icon: BarChart3, desc: "Reports & data" },
            { label: "All Projects", href: "/admin/projects", icon: Building2, desc: "Manage inventory" },
          ].map(({ label, href, icon: Icon, desc }) => (
            <Link key={label} to={href}>
              <Card className="group cursor-pointer hover:shadow-card-hover transition-all h-full">
                <CardContent className="p-3 flex items-center gap-3">
                  <Icon className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors shrink-0" />
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-foreground">{label}</p>
                    <p className="text-[11px] text-muted-foreground">{desc}</p>
                  </div>
                  <ArrowRight className="h-3 w-3 text-muted-foreground/30 ml-auto shrink-0 group-hover:translate-x-0.5 transition-transform" />
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>

        {/* ── PENDING APPROVALS ── */}
        {totalPending > 0 && (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-destructive" />
              <h2 className="text-sm font-semibold">Pending Approvals</h2>
              <Badge variant="destructive" className="text-[10px] px-1.5 py-0 h-4">{totalPending}</Badge>
            </div>

            {pendingListings.length > 0 && (
              <Card>
                <CardContent className="p-4 space-y-2">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1.5">
                    <Home className="h-3 w-3" /> Assignments · {pendingListings.length} pending
                  </p>
                  {pendingListings.map(l => (
                    <div key={l.id} className="flex items-center justify-between rounded-lg border bg-muted/30 px-3 py-2">
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">{l.title || l.project_name}</p>
                        <p className="text-xs text-muted-foreground">{l.city} · {l.beds}bd · ${l.assignment_price?.toLocaleString()}</p>
                      </div>
                      <div className="flex gap-1.5 shrink-0 ml-3">
                        <Button size="sm" variant="outline" className="h-7 text-xs border-destructive/40 text-destructive" disabled={approvingId === l.id} onClick={() => reject("listings", l.id, { status: "rejected", rejection_reason: "Rejected from dashboard" }, setPendingListings)}>
                          <XCircle className="h-3 w-3" />
                        </Button>
                        <Button size="sm" className="h-7 text-xs bg-emerald-600 hover:bg-emerald-700 text-white" disabled={approvingId === l.id} onClick={() => approve("listings", l.id, { status: "published", published_at: new Date().toISOString() }, setPendingListings)}>
                          <CheckCheck className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            {pendingDevelopers.length > 0 && (
              <Card>
                <CardContent className="p-4 space-y-2">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1.5">
                    <Building2 className="h-3 w-3" /> Developers · {pendingDevelopers.length} pending
                  </p>
                  {pendingDevelopers.map(dev => (
                    <div key={dev.id} className="flex items-center justify-between rounded-lg border bg-muted/30 px-3 py-2">
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">{dev.company_name}</p>
                        <p className="text-xs text-muted-foreground">{dev.contact_name}</p>
                      </div>
                      <div className="flex gap-1.5 shrink-0 ml-3">
                        <Button size="sm" variant="outline" className="h-7 text-xs border-destructive/40 text-destructive" disabled={approvingId === dev.id} onClick={() => reject("developer_profiles", dev.id, { verification_status: "rejected" }, setPendingDevelopers)}>
                          <XCircle className="h-3 w-3" />
                        </Button>
                        <Button size="sm" className="h-7 text-xs bg-emerald-600 hover:bg-emerald-700 text-white" disabled={approvingId === dev.id} onClick={() => approve("developer_profiles", dev.id, { verification_status: "approved", verified_at: new Date().toISOString() }, setPendingDevelopers)}>
                          <ShieldCheck className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            {pendingAgents.length > 0 && (
              <Card>
                <CardContent className="p-4 space-y-2">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1.5">
                    <UserCheck className="h-3 w-3" /> Agents · {pendingAgents.length} pending
                  </p>
                  {pendingAgents.map(a => (
                    <div key={a.id} className="flex items-center justify-between rounded-lg border bg-muted/30 px-3 py-2">
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">{a.brokerage_name || "Unknown"}</p>
                        <p className="text-xs text-muted-foreground">License: {a.license_number}</p>
                      </div>
                      <div className="flex gap-1.5 shrink-0 ml-3">
                        <Button size="sm" variant="outline" className="h-7 text-xs border-destructive/40 text-destructive" disabled={approvingId === a.id} onClick={() => reject("agent_profiles", a.id, { verification_status: "rejected" }, setPendingAgents)}>
                          <XCircle className="h-3 w-3" />
                        </Button>
                        <Button size="sm" className="h-7 text-xs bg-emerald-600 hover:bg-emerald-700 text-white" disabled={approvingId === a.id} onClick={() => approve("agent_profiles", a.id, { verification_status: "verified", verified_at: new Date().toISOString() }, setPendingAgents)}>
                          <ShieldCheck className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
