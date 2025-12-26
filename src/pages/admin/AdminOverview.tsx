import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { 
  Users, 
  Building2, 
  FileCheck, 
  DollarSign,
  ArrowRight,
  AlertCircle,
  Clock
} from "lucide-react";

interface AdminStats {
  pendingAgents: number;
  verifiedAgents: number;
  pendingListings: number;
  publishedListings: number;
  totalLeads: number;
  totalPayments: number;
}

export default function AdminOverview() {
  const [stats, setStats] = useState<AdminStats>({
    pendingAgents: 0,
    verifiedAgents: 0,
    pendingListings: 0,
    publishedListings: 0,
    totalLeads: 0,
    totalPayments: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      // Fetch agent stats
      const { data: agents } = await supabase
        .from("agent_profiles")
        .select("verification_status");

      const pendingAgents = agents?.filter(a => a.verification_status === "unverified").length || 0;
      const verifiedAgents = agents?.filter(a => a.verification_status === "verified").length || 0;

      // Fetch listing stats
      const { data: listings } = await supabase
        .from("listings")
        .select("status");

      const pendingListings = listings?.filter(l => l.status === "pending_approval").length || 0;
      const publishedListings = listings?.filter(l => l.status === "published").length || 0;

      // Fetch leads count
      const { count: leadsCount } = await supabase
        .from("leads")
        .select("*", { count: "exact", head: true });

      // Fetch payments count
      const { count: paymentsCount } = await supabase
        .from("payments")
        .select("*", { count: "exact", head: true });

      setStats({
        pendingAgents,
        verifiedAgents,
        pendingListings,
        publishedListings,
        totalLeads: leadsCount || 0,
        totalPayments: paymentsCount || 0,
      });
    } catch (error) {
      console.error("Error fetching stats:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Admin Dashboard</h1>
          <p className="text-muted-foreground">Manage agents, listings, and platform settings</p>
        </div>

        {/* Alerts */}
        {(stats.pendingAgents > 0 || stats.pendingListings > 0) && (
          <Card className="border-amber-500/50 bg-amber-500/5">
            <CardContent className="pt-6">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-amber-500 mt-0.5 shrink-0" />
                <div className="space-y-1">
                  {stats.pendingAgents > 0 && (
                    <p className="text-sm">
                      <strong>{stats.pendingAgents}</strong> agent(s) awaiting verification
                    </p>
                  )}
                  {stats.pendingListings > 0 && (
                    <p className="text-sm">
                      <strong>{stats.pendingListings}</strong> listing(s) awaiting approval
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Stats Grid */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Pending Agents
              </CardTitle>
              <Clock className="h-4 w-4 text-amber-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.pendingAgents}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {stats.verifiedAgents} verified
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Pending Listings
              </CardTitle>
              <FileCheck className="h-4 w-4 text-amber-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.pendingListings}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {stats.publishedListings} published
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Leads
              </CardTitle>
              <Users className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalLeads}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Payments
              </CardTitle>
              <DollarSign className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalPayments}</div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Pending Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Link to="/admin/agents" className="block">
                <Button variant="outline" className="w-full justify-between">
                  <span className="flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    Review Agent Verifications
                  </span>
                  {stats.pendingAgents > 0 && (
                    <span className="bg-amber-500 text-white text-xs px-2 py-0.5 rounded-full">
                      {stats.pendingAgents}
                    </span>
                  )}
                </Button>
              </Link>
              <Link to="/admin/listings" className="block">
                <Button variant="outline" className="w-full justify-between">
                  <span className="flex items-center gap-2">
                    <FileCheck className="h-4 w-4" />
                    Review Listing Approvals
                  </span>
                  {stats.pendingListings > 0 && (
                    <span className="bg-amber-500 text-white text-xs px-2 py-0.5 rounded-full">
                      {stats.pendingListings}
                    </span>
                  )}
                </Button>
              </Link>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Management</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Link to="/admin/all-listings" className="block">
                <Button variant="outline" className="w-full justify-between">
                  <span className="flex items-center gap-2">
                    <Building2 className="h-4 w-4" />
                    Manage All Listings
                  </span>
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <Link to="/admin/payments" className="block">
                <Button variant="outline" className="w-full justify-between">
                  <span className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4" />
                    View Payments
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
