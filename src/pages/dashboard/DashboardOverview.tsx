import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { 
  Building2, 
  Users, 
  Clock, 
  CheckCircle,
  AlertCircle,
  Plus,
  ArrowRight,
  TrendingUp,
  Eye,
  Sparkles,
  Target,
  Zap,
  Crown,
  FolderOpen
} from "lucide-react";
import { cn } from "@/lib/utils";

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
  const [agentName, setAgentName] = useState<string>("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchDashboardData();
    }
  }, [user]);

  const fetchDashboardData = async () => {
    if (!user) return;

    try {
      // Fetch agent profile with name
      const { data: profile } = await supabase
        .from("profiles")
        .select("full_name")
        .eq("user_id", user.id)
        .single();

      if (profile?.full_name) {
        // Extract first name
        const firstName = profile.full_name.split(" ")[0];
        setAgentName(firstName);
      }

      const { data: listings } = await supabase
        .from("listings")
        .select("status")
        .eq("agent_id", user.id);

      const published = listings?.filter(l => l.status === "published").length || 0;
      const pending = listings?.filter(l => 
        l.status === "pending_approval" || l.status === "pending_payment"
      ).length || 0;

      const { data: leads } = await supabase
        .from("leads")
        .select("created_at")
        .eq("agent_id", user.id);

      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      const recentLeads = leads?.filter(l => 
        new Date(l.created_at) > sevenDaysAgo
      ).length || 0;

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

  // Calculate onboarding progress
  const onboardingSteps = [
    { id: 1, label: "Complete verification", done: verificationStatus === "verified" },
    { id: 2, label: "Create first listing", done: stats.totalListings > 0 },
    { id: 3, label: "Publish a listing", done: stats.publishedListings > 0 },
    { id: 4, label: "Receive your first lead", done: stats.totalLeads > 0 },
  ];
  const completedSteps = onboardingSteps.filter(s => s.done).length;
  const progressPercent = (completedSteps / onboardingSteps.length) * 100;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Welcome Header */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary/10 via-primary/5 to-background border border-primary/20 p-6 md:p-8">
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
          <div className="relative">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Sparkles className="h-5 w-5 text-primary" />
                  <span className="text-sm font-medium text-primary">Agent Dashboard</span>
                </div>
                <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-2">
                  Welcome back{agentName ? `, ${agentName}` : ""}!
                </h1>
                <p className="text-muted-foreground">
                  Manage your assignment listings and grow your business.
                </p>
              </div>
              <div className="flex flex-wrap gap-3">
                <Link to="/dashboard/projects">
                  <Button variant="outline" className="gap-2 border-primary/30 hover:border-primary hover:bg-primary/5">
                    <FolderOpen className="h-4 w-4" />
                    <span className="hidden sm:inline">Project Documents</span>
                    <span className="sm:hidden">Documents</span>
                  </Button>
                </Link>
                <Link to="/map-search?mode=assignments">
                  <Button variant="outline" className="gap-2 border-amber-500/30 hover:border-amber-500 hover:bg-amber-500/5">
                    <Building2 className="h-4 w-4 text-amber-600" />
                    <span className="hidden sm:inline">Browse Marketplace</span>
                    <span className="sm:hidden">Marketplace</span>
                  </Button>
                </Link>
                <Link to="/dashboard/listings/new">
                  <Button className="gap-2 shadow-lg shadow-primary/20">
                    <Plus className="h-4 w-4" />
                    New Listing
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Verification Warning */}
        {verificationStatus !== "verified" && (
          <Card className="border-amber-500/50 bg-gradient-to-r from-amber-500/10 to-amber-500/5">
            <CardContent className="pt-6">
              <div className="flex items-start gap-4">
                <div className="p-2 rounded-full bg-amber-500/20">
                  <AlertCircle className="h-5 w-5 text-amber-600" />
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-foreground">Complete Your Verification</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Your license is being verified. Listings will be published once verification is complete.
                  </p>
                </div>
                <Link to="/dashboard/profile">
                  <Button variant="outline" size="sm">
                    Check Status
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Stats Grid */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card className="relative overflow-hidden group hover:shadow-lg transition-shadow">
            <div className="absolute top-0 right-0 w-20 h-20 bg-primary/10 rounded-full blur-2xl group-hover:bg-primary/20 transition-colors" />
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Listings
              </CardTitle>
              <div className="p-2 rounded-lg bg-primary/10">
                <Building2 className="h-4 w-4 text-primary" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats.totalListings}</div>
              <p className="text-xs text-muted-foreground mt-1">All your listings</p>
            </CardContent>
          </Card>

          <Card className="relative overflow-hidden group hover:shadow-lg transition-shadow">
            <div className="absolute top-0 right-0 w-20 h-20 bg-green-500/10 rounded-full blur-2xl group-hover:bg-green-500/20 transition-colors" />
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Published
              </CardTitle>
              <div className="p-2 rounded-lg bg-green-500/10">
                <CheckCircle className="h-4 w-4 text-green-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-600">{stats.publishedListings}</div>
              <p className="text-xs text-muted-foreground mt-1">Live on marketplace</p>
            </CardContent>
          </Card>

          <Card className="relative overflow-hidden group hover:shadow-lg transition-shadow">
            <div className="absolute top-0 right-0 w-20 h-20 bg-amber-500/10 rounded-full blur-2xl group-hover:bg-amber-500/20 transition-colors" />
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Pending Review
              </CardTitle>
              <div className="p-2 rounded-lg bg-amber-500/10">
                <Clock className="h-4 w-4 text-amber-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-amber-600">{stats.pendingListings}</div>
              <p className="text-xs text-muted-foreground mt-1">Awaiting approval</p>
            </CardContent>
          </Card>

          <Card className="relative overflow-hidden group hover:shadow-lg transition-shadow">
            <div className="absolute top-0 right-0 w-20 h-20 bg-blue-500/10 rounded-full blur-2xl group-hover:bg-blue-500/20 transition-colors" />
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Leads
              </CardTitle>
              <div className="p-2 rounded-lg bg-blue-500/10">
                <Users className="h-4 w-4 text-blue-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-blue-600">{stats.totalLeads}</div>
              {stats.recentLeads > 0 ? (
                <p className="text-xs text-green-600 mt-1 flex items-center gap-1">
                  <TrendingUp className="h-3 w-3" />
                  +{stats.recentLeads} this week
                </p>
              ) : (
                <p className="text-xs text-muted-foreground mt-1">Buyer inquiries</p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Two Column Layout */}
        <div className="grid gap-6 lg:grid-cols-5">
          {/* Onboarding Progress */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Target className="h-5 w-5 text-primary" />
                  <CardTitle className="text-lg">Getting Started</CardTitle>
                </div>
                <Badge variant="outline" className="text-xs">
                  {completedSteps}/{onboardingSteps.length}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-muted-foreground">Progress</span>
                  <span className="text-sm font-medium">{Math.round(progressPercent)}%</span>
                </div>
                <Progress value={progressPercent} className="h-2" />
              </div>
              
              <ul className="space-y-3">
                {onboardingSteps.map((step) => (
                  <li key={step.id} className="flex items-center gap-3">
                    <div className={cn(
                      "w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium transition-colors",
                      step.done 
                        ? "bg-green-500 text-white" 
                        : "bg-muted text-muted-foreground"
                    )}>
                      {step.done ? <CheckCircle className="h-4 w-4" /> : step.id}
                    </div>
                    <span className={cn(
                      "text-sm",
                      step.done && "text-muted-foreground line-through"
                    )}>
                      {step.label}
                    </span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card className="lg:col-span-3">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Zap className="h-5 w-5 text-primary" />
                <CardTitle className="text-lg">Quick Actions</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3 sm:grid-cols-2">
                <Link to="/dashboard/listings/new" className="group">
                  <div className="p-4 rounded-xl border border-border hover:border-primary/50 hover:bg-primary/5 transition-all">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="p-2 rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors">
                        <Plus className="h-5 w-5 text-primary" />
                      </div>
                      <span className="font-medium">Create Listing</span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      List a new assignment for sale
                    </p>
                  </div>
                </Link>
                
                <Link to="/map-search?mode=assignments" className="group">
                  <div className="p-4 rounded-xl border border-amber-500/30 hover:border-amber-500 hover:bg-amber-500/5 transition-all bg-gradient-to-br from-amber-500/5 to-transparent">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="p-2 rounded-lg bg-amber-500/10 group-hover:bg-amber-500/20 transition-colors">
                        <Building2 className="h-5 w-5 text-amber-600" />
                      </div>
                      <span className="font-medium">Assignment Marketplace</span>
                      <Badge className="text-[10px] px-1.5 py-0 h-4 bg-amber-500 text-white">
                        Live
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Browse assignments on the map
                    </p>
                  </div>
                </Link>
                
                <Link to="/dashboard/listings" className="group">
                  <div className="p-4 rounded-xl border border-border hover:border-primary/50 hover:bg-primary/5 transition-all">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="p-2 rounded-lg bg-muted group-hover:bg-primary/10 transition-colors">
                        <Eye className="h-5 w-5 text-muted-foreground group-hover:text-primary" />
                      </div>
                      <span className="font-medium">Manage Listings</span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Edit, renew, or remove listings
                    </p>
                  </div>
                </Link>
                
                <Link to="/dashboard/leads" className="group">
                  <div className="p-4 rounded-xl border border-border hover:border-primary/50 hover:bg-primary/5 transition-all">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="p-2 rounded-lg bg-muted group-hover:bg-primary/10 transition-colors">
                        <Users className="h-5 w-5 text-muted-foreground group-hover:text-primary" />
                      </div>
                      <span className="font-medium">View Leads</span>
                      {stats.recentLeads > 0 && (
                        <Badge variant="destructive" className="text-[10px] px-1.5 py-0 h-4">
                          {stats.recentLeads} new
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Connect with interested buyers
                    </p>
                  </div>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Pro Tip Banner */}
        <Card className="bg-gradient-to-r from-primary/10 via-primary/5 to-background border-primary/20">
          <CardContent className="py-6">
            <div className="flex flex-col md:flex-row md:items-center gap-4">
              <div className="p-3 rounded-xl bg-primary/20 w-fit">
                <Crown className="h-6 w-6 text-primary" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold mb-1">Pro Tip: Maximize Your Exposure</h3>
                <p className="text-sm text-muted-foreground">
                  Listings with high-quality photos and detailed descriptions get 3x more leads. 
                  Make sure to upload at least 5 photos and write a compelling description.
                </p>
              </div>
              <Link to="/dashboard/listings/new">
                <Button variant="outline" className="whitespace-nowrap">
                  Create Listing
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
