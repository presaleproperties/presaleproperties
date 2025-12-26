import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { 
  Building2, 
  Users, 
  Clock, 
  CheckCircle,
  AlertCircle,
  Plus,
  ArrowRight
} from "lucide-react";

interface DashboardStats {
  totalListings: number;
  publishedListings: number;
  pendingListings: number;
  totalLeads: number;
  recentLeads: number;
}

export default function DashboardOverview() {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats>({
    totalListings: 0,
    publishedListings: 0,
    pendingListings: 0,
    totalLeads: 0,
    recentLeads: 0,
  });
  const [verificationStatus, setVerificationStatus] = useState<string>("unverified");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchDashboardData();
    }
  }, [user]);

  const fetchDashboardData = async () => {
    if (!user) return;

    try {
      // Fetch listings count by status
      const { data: listings } = await supabase
        .from("listings")
        .select("status")
        .eq("agent_id", user.id);

      const published = listings?.filter(l => l.status === "published").length || 0;
      const pending = listings?.filter(l => 
        l.status === "pending_approval" || l.status === "pending_payment"
      ).length || 0;

      // Fetch leads count
      const { data: leads } = await supabase
        .from("leads")
        .select("created_at")
        .eq("agent_id", user.id);

      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      const recentLeads = leads?.filter(l => 
        new Date(l.created_at) > sevenDaysAgo
      ).length || 0;

      // Fetch agent verification status
      const { data: agentProfile } = await supabase
        .from("agent_profiles")
        .select("verification_status")
        .eq("user_id", user.id)
        .single();

      setStats({
        totalListings: listings?.length || 0,
        publishedListings: published,
        pendingListings: pending,
        totalLeads: leads?.length || 0,
        recentLeads,
      });
      
      setVerificationStatus(agentProfile?.verification_status || "unverified");
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  const getVerificationBadge = () => {
    switch (verificationStatus) {
      case "verified":
        return <Badge className="bg-green-500/10 text-green-600 border-green-500/20">Verified Agent</Badge>;
      case "rejected":
        return <Badge variant="destructive">Verification Rejected</Badge>;
      default:
        return <Badge variant="secondary">Pending Verification</Badge>;
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">Dashboard</h1>
            <div className="flex items-center gap-2 mt-1">
              {getVerificationBadge()}
            </div>
          </div>
          <Link to="/dashboard/listings/new">
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              New Listing
            </Button>
          </Link>
        </div>

        {/* Verification Warning */}
        {verificationStatus !== "verified" && (
          <Card className="border-amber-500/50 bg-amber-500/5">
            <CardContent className="pt-6">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-amber-500 mt-0.5 shrink-0" />
                <div>
                  <p className="font-medium">Account Verification Pending</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Your license is being verified. You can create listings, but they won't be published until verification is complete.
                  </p>
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
                Total Listings
              </CardTitle>
              <Building2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalListings}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Published
              </CardTitle>
              <CheckCircle className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.publishedListings}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Pending
              </CardTitle>
              <Clock className="h-4 w-4 text-amber-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.pendingListings}</div>
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
              {stats.recentLeads > 0 && (
                <p className="text-xs text-muted-foreground mt-1">
                  +{stats.recentLeads} this week
                </p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Link to="/dashboard/listings/new" className="block">
                <Button variant="outline" className="w-full justify-between">
                  Create New Listing
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <Link to="/dashboard/listings" className="block">
                <Button variant="outline" className="w-full justify-between">
                  Manage Listings
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <Link to="/dashboard/leads" className="block">
                <Button variant="outline" className="w-full justify-between">
                  View Leads
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Getting Started</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3 text-sm">
                <li className="flex items-start gap-2">
                  <CheckCircle className={`h-4 w-4 mt-0.5 shrink-0 ${verificationStatus === "verified" ? "text-green-500" : "text-muted-foreground"}`} />
                  <span className={verificationStatus === "verified" ? "line-through text-muted-foreground" : ""}>
                    Complete license verification
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className={`h-4 w-4 mt-0.5 shrink-0 ${stats.totalListings > 0 ? "text-green-500" : "text-muted-foreground"}`} />
                  <span className={stats.totalListings > 0 ? "line-through text-muted-foreground" : ""}>
                    Create your first listing
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className={`h-4 w-4 mt-0.5 shrink-0 ${stats.publishedListings > 0 ? "text-green-500" : "text-muted-foreground"}`} />
                  <span className={stats.publishedListings > 0 ? "line-through text-muted-foreground" : ""}>
                    Publish a listing
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className={`h-4 w-4 mt-0.5 shrink-0 ${stats.totalLeads > 0 ? "text-green-500" : "text-muted-foreground"}`} />
                  <span className={stats.totalLeads > 0 ? "line-through text-muted-foreground" : ""}>
                    Receive your first lead
                  </span>
                </li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
