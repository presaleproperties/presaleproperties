import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { DeveloperLayout } from "@/components/developer/DeveloperLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, Building2, FileText, Calendar, Clock, AlertCircle, CheckCircle } from "lucide-react";
import { Link } from "react-router-dom";

interface DeveloperProfile {
  id: string;
  company_name: string;
  contact_name: string;
  verification_status: string;
  created_at: string;
}

export default function DeveloperDashboard() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<DeveloperProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [projectCount, setProjectCount] = useState(0);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/login?type=developer");
      return;
    }

    if (user) {
      fetchDeveloperProfile();
    }
  }, [user, authLoading, navigate]);

  const fetchDeveloperProfile = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from("developer_profiles")
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle();

    if (error || !data) {
      // Not a developer, redirect to login
      navigate("/login?type=developer");
      return;
    }

    setProfile(data);

    // Get project count if approved
    if (data.verification_status === "approved") {
      const { count } = await supabase
        .from("presale_projects")
        .select("*", { count: "exact", head: true })
        .eq("developer_id", data.id);
      
      setProjectCount(count || 0);
    }

    setLoading(false);
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!profile) {
    return null;
  }

  // Pending approval state
  if (profile.verification_status === "pending") {
    return (
      <DeveloperLayout>
        <div className="container max-w-2xl py-12">
          <Card>
            <CardHeader className="text-center">
              <div className="mx-auto w-16 h-16 rounded-full bg-amber-100 flex items-center justify-center mb-4">
                <Clock className="h-8 w-8 text-amber-600" />
              </div>
              <CardTitle className="text-2xl">Pending Approval</CardTitle>
              <CardDescription className="text-base">
                Your developer account is being reviewed
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center space-y-4">
              <p className="text-muted-foreground">
                We're reviewing your request. This usually takes 1-2 business days.
              </p>
              <p className="text-muted-foreground">
                Once approved, you'll be able to upload projects and share them with agents.
              </p>
              <div className="pt-4 border-t">
                <p className="text-sm text-muted-foreground">
                  Company: <span className="font-medium text-foreground">{profile.company_name}</span>
                </p>
                <p className="text-sm text-muted-foreground">
                  Submitted: <span className="font-medium text-foreground">
                    {new Date(profile.created_at).toLocaleDateString()}
                  </span>
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </DeveloperLayout>
    );
  }

  // Rejected state
  if (profile.verification_status === "rejected") {
    return (
      <DeveloperLayout>
        <div className="container max-w-2xl py-12">
          <Card>
            <CardHeader className="text-center">
              <div className="mx-auto w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mb-4">
                <AlertCircle className="h-8 w-8 text-red-600" />
              </div>
              <CardTitle className="text-2xl">Access Not Approved</CardTitle>
              <CardDescription className="text-base">
                We couldn't verify your developer account
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center space-y-4">
              <p className="text-muted-foreground">
                Please contact us at <a href="mailto:support@presaleproperties.com" className="text-primary underline">support@presaleproperties.com</a> for more information.
              </p>
            </CardContent>
          </Card>
        </div>
      </DeveloperLayout>
    );
  }

  // Approved - show dashboard
  return (
    <DeveloperLayout>
      <div className="container py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Welcome, {profile.contact_name}</h1>
          <p className="text-muted-foreground">{profile.company_name}</p>
        </div>

        <div className="grid gap-6 md:grid-cols-3 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Projects</CardTitle>
              <Building2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{projectCount}</div>
              <p className="text-xs text-muted-foreground">Active projects</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Status</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">Verified</div>
              <p className="text-xs text-muted-foreground">Account approved</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Tour Requests</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">0</div>
              <p className="text-xs text-muted-foreground">Pending requests</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Your Projects</CardTitle>
              <CardDescription>
                Upload and manage your presale projects
              </CardDescription>
            </CardHeader>
            <CardContent>
              {projectCount === 0 ? (
                <div className="text-center py-8">
                  <Building2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground mb-4">No projects yet</p>
                  <Link to="/developer/projects/new">
                    <Button>Add Your First Project</Button>
                  </Link>
                </div>
              ) : (
                <div className="space-y-4">
                  <Link to="/developer/projects">
                    <Button variant="outline" className="w-full">View All Projects</Button>
                  </Link>
                  <Link to="/developer/projects/new">
                    <Button className="w-full">Add New Project</Button>
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>
                Common tasks and settings
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Link to="/developer/projects" className="block">
                <Button variant="outline" className="w-full justify-start">
                  <FileText className="h-4 w-4 mr-2" />
                  Manage Floor Plans & Pricing
                </Button>
              </Link>
              <Link to="/developer/tour-requests" className="block">
                <Button variant="outline" className="w-full justify-start">
                  <Calendar className="h-4 w-4 mr-2" />
                  View Tour Requests
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </DeveloperLayout>
  );
}
