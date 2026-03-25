import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { DeveloperPortalLayout } from "@/components/developer/DeveloperPortalLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Loader2, Building2, Plus, Eye, TrendingUp, Clock, AlertCircle, CheckCircle,
  Package,
} from "lucide-react";

interface DeveloperProfile {
  id: string;
  company_name: string;
  contact_name: string;
  verification_status: string;
  created_at: string;
}

interface ProjectCard {
  id: string;
  name: string;
  city: string;
  neighborhood: string;
  status: string;
  is_published: boolean;
  view_count: number | null;
}

interface Stats {
  totalProjects: number;
  availableUnits: number;
  unitsSold: number;
  totalViews: number;
}

export default function DeveloperDashboardNew() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<DeveloperProfile | null>(null);
  const [projects, setProjects] = useState<ProjectCard[]>([]);
  const [stats, setStats] = useState<Stats>({ totalProjects: 0, availableUnits: 0, unitsSold: 0, totalViews: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) navigate("/developer/login");
    if (user) fetchData();
  }, [user, authLoading]);

  const fetchData = async () => {
    if (!user) return;
    const { data: dev } = await supabase
      .from("developer_profiles")
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle();

    if (!dev) { navigate("/developer/login"); return; }
    setProfile(dev);

    if (dev.verification_status === "approved") {
      const { data: proj } = await supabase
        .from("presale_projects")
        .select("id, name, city, neighborhood, status, is_published, view_count")
        .eq("developer_id", dev.id)
        .order("created_at", { ascending: false })
        .limit(5);

      setProjects(proj || []);

      const totalProjects = proj?.length || 0;
      const totalViews = (proj || []).reduce((sum, p) => sum + (p.view_count || 0), 0);

      const { count: availCount } = await supabase
        .from("listings")
        .select("*", { count: "exact", head: true })
        .in("project_id", (proj || []).map(p => p.id))
        .eq("status", "published");

      const { count: soldCount } = await supabase
        .from("listings")
        .select("*", { count: "exact", head: true })
        .in("project_id", (proj || []).map(p => p.id))
        .eq("status", "sold");

      setStats({ totalProjects, availableUnits: availCount || 0, unitsSold: soldCount || 0, totalViews });
    }
    setLoading(false);
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!profile) return null;

  if (profile.verification_status === "pending") {
    return (
      <DeveloperPortalLayout>
        <div className="max-w-xl mx-auto px-6 py-20 text-center">
          <div className="w-16 h-16 rounded-full bg-amber-100 flex items-center justify-center mx-auto mb-5">
            <Clock className="h-8 w-8 text-amber-600" />
          </div>
          <h1 className="text-2xl font-bold mb-2">Account Under Review</h1>
          <p className="text-muted-foreground mb-2">
            We're verifying your developer account. This usually takes 1–2 business days.
          </p>
          <p className="text-sm text-muted-foreground">
            Company: <span className="font-medium text-foreground">{profile.company_name}</span> ·{" "}
            Submitted: {new Date(profile.created_at).toLocaleDateString()}
          </p>
        </div>
      </DeveloperPortalLayout>
    );
  }

  if (profile.verification_status === "rejected") {
    return (
      <DeveloperPortalLayout>
        <div className="max-w-xl mx-auto px-6 py-20 text-center">
          <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mx-auto mb-5">
            <AlertCircle className="h-8 w-8 text-destructive" />
          </div>
          <h1 className="text-2xl font-bold mb-2">Application Not Approved</h1>
          <p className="text-muted-foreground">
            Contact us at{" "}
            <a href="mailto:support@presaleproperties.ca" className="text-primary underline">
              support@presaleproperties.ca
            </a>{" "}
            for more information.
          </p>
        </div>
      </DeveloperPortalLayout>
    );
  }

  return (
    <DeveloperPortalLayout>
      <div className="px-6 md:px-10 py-8 max-w-5xl mx-auto">
        {/* Welcome Banner */}
        {projects.length === 0 ? (
          <div className="bg-foreground rounded-2xl p-8 mb-8 flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="text-background">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle className="h-4 w-4 text-primary" />
                <span className="text-primary text-sm font-medium">Account Verified</span>
              </div>
              <h1 className="text-2xl font-bold mb-1">Welcome, {profile.contact_name}!</h1>
              <p className="text-background/50">You're all set. Add your first project to get started.</p>
            </div>
            <Link to="/developer/projects/new" className="flex-shrink-0">
              <Button className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold px-6 py-3 rounded-lg">
                <Plus className="h-4 w-4 mr-2" />
                Add Your First Project
              </Button>
            </Link>
          </div>
        ) : (
          <div className="mb-8 flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">Welcome back, {profile.contact_name}</h1>
              <p className="text-muted-foreground text-sm">{profile.company_name}</p>
            </div>
            <Link to="/developer/projects/new">
              <Button className="font-bold rounded-lg">
                <Plus className="h-4 w-4 mr-2" />
                Add Project
              </Button>
            </Link>
          </div>
        )}

        {/* Stats Row */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[
            { label: "Total Projects", value: stats.totalProjects, icon: Building2 },
            { label: "Available Units", value: stats.availableUnits, icon: Package },
            { label: "Units Sold", value: stats.unitsSold, icon: TrendingUp },
            { label: "Total Views", value: stats.totalViews, icon: Eye },
          ].map(({ label, value, icon: Icon }) => (
            <Card key={label} className="rounded-xl shadow-sm">
              <CardContent className="p-5">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs text-muted-foreground font-medium">{label}</p>
                  <Icon className="h-4 w-4 text-primary" />
                </div>
                <div className="text-2xl font-bold">{value}</div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Projects List */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold">Your Projects</h2>
            {projects.length > 0 && (
              <Link to="/developer/projects" className="text-sm text-primary hover:underline font-medium">
                View all →
              </Link>
            )}
          </div>

          {projects.length === 0 ? (
            <Card className="rounded-xl border-dashed">
              <CardContent className="py-16 text-center">
                <Building2 className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
                <h3 className="font-semibold mb-1">No projects yet</h3>
                <p className="text-muted-foreground text-sm mb-5">
                  Add your first project to start reaching buyers
                </p>
                <Link to="/developer/projects/new">
                  <Button className="font-bold rounded-lg">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Project
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {projects.map((project) => (
                <Card key={project.id} className="rounded-xl shadow-sm">
                  <CardContent className="p-5 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
                        <Building2 className="h-5 w-5 text-muted-foreground" />
                      </div>
                      <div>
                        <h3 className="font-semibold">{project.name}</h3>
                        <p className="text-sm text-muted-foreground">{project.neighborhood}, {project.city}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 flex-shrink-0">
                      <div className="hidden sm:flex items-center gap-1 text-sm text-muted-foreground">
                        <Eye className="h-3.5 w-3.5" />
                        {project.view_count || 0}
                      </div>
                      {project.is_published ? (
                        <Badge className="bg-green-100 text-green-700 border-0 text-xs">Published</Badge>
                      ) : (
                        <Badge variant="outline" className="text-xs">Draft</Badge>
                      )}
                      <Link to={`/developer/projects/${project.id}/edit`}>
                        <Button variant="outline" size="sm" className="text-xs rounded-lg">Edit</Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </DeveloperPortalLayout>
  );
}
