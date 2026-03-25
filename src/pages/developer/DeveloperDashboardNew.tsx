import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { DeveloperPortalLayout } from "@/components/developer/DeveloperPortalLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Loader2, Building2, Plus, Eye, TrendingUp, Clock, AlertCircle,
  CheckCircle, Package, Sparkles
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

  // ── Pending ──
  if (profile.verification_status === "pending") {
    return (
      <DeveloperPortalLayout>
        <div className="max-w-xl mx-auto px-6 py-20 text-center">
          <div className="w-16 h-16 rounded-2xl bg-warning/10 flex items-center justify-center mx-auto mb-5">
            <Clock className="h-8 w-8 text-warning" />
          </div>
          <h1 className="text-2xl font-bold mb-2">Account Under Review</h1>
          <p className="text-muted-foreground mb-2">
            We're verifying your developer account. This usually takes 1–2 business days.
          </p>
          <p className="text-sm text-muted-foreground">
            Company: <span className="font-semibold text-foreground">{profile.company_name}</span> ·{" "}
            Submitted: {new Date(profile.created_at).toLocaleDateString()}
          </p>
        </div>
      </DeveloperPortalLayout>
    );
  }

  // ── Rejected ──
  if (profile.verification_status === "rejected") {
    return (
      <DeveloperPortalLayout>
        <div className="max-w-xl mx-auto px-6 py-20 text-center">
          <div className="w-16 h-16 rounded-2xl bg-destructive/10 flex items-center justify-center mx-auto mb-5">
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

        {/* ── Welcome Banner ── */}
        {projects.length === 0 ? (
          <div className="relative rounded-2xl overflow-hidden mb-8 bg-foreground p-8">
            {/* Glow */}
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,hsl(var(--primary)/0.2),transparent_60%)] pointer-events-none" />
            <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent" />
            <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
              <div className="text-background">
                <div className="flex items-center gap-2 mb-3">
                  <CheckCircle className="h-4 w-4 text-primary" />
                  <span className="text-primary text-sm font-semibold">Account Verified</span>
                </div>
                <h1 className="text-2xl font-bold mb-1">Welcome, {profile.contact_name}!</h1>
                <p className="text-background/50">You're all set. Add your first project to get started.</p>
              </div>
              <Link to="/developer/projects/new" className="flex-shrink-0">
                <Button className="shadow-gold hover:shadow-gold-glow font-bold px-6 py-3 rounded-xl group">
                  <Sparkles className="h-4 w-4 mr-2" />
                  Add Your First Project
                </Button>
              </Link>
            </div>
          </div>
        ) : (
          <div className="mb-8 flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">Welcome back, {profile.contact_name}</h1>
              <p className="text-muted-foreground text-sm">{profile.company_name}</p>
            </div>
            <Link to="/developer/projects/new">
              <Button className="shadow-gold hover:shadow-gold-glow font-bold rounded-xl">
                <Plus className="h-4 w-4 mr-2" />
                Add Project
              </Button>
            </Link>
          </div>
        )}

        {/* ── Stats Row ── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[
            { label: "Total Projects", value: stats.totalProjects, icon: Building2 },
            { label: "Available Units", value: stats.availableUnits, icon: Package },
            { label: "Units Sold", value: stats.unitsSold, icon: TrendingUp },
            { label: "Total Views", value: stats.totalViews, icon: Eye },
          ].map(({ label, value, icon: Icon }) => (
            <Card key={label} className="rounded-2xl shadow-card hover:shadow-card-hover transition-shadow border-border/50">
              <CardContent className="p-5">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">{label}</p>
                  <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Icon className="h-4 w-4 text-primary" />
                  </div>
                </div>
                <div className="text-3xl font-bold">{value}</div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* ── Projects List ── */}
        <div>
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-lg font-bold">Your Projects</h2>
            {projects.length > 0 && (
              <Link to="/developer/projects" className="text-sm text-primary hover:underline font-medium">
                View all →
              </Link>
            )}
          </div>

          {projects.length === 0 ? (
            <Card className="rounded-2xl border-dashed border-border/60">
              <CardContent className="py-16 text-center">
                <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mx-auto mb-4">
                  <Building2 className="h-8 w-8 text-muted-foreground/50" />
                </div>
                <h3 className="font-semibold mb-2">No projects yet</h3>
                <p className="text-muted-foreground text-sm mb-6">
                  Add your first project to start reaching buyers
                </p>
                <Link to="/developer/projects/new">
                  <Button className="shadow-gold font-bold rounded-xl">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Project
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {projects.map((project) => (
                <Card
                  key={project.id}
                  className="rounded-2xl shadow-card hover:shadow-card-hover transition-all duration-200 border-border/50 hover:border-primary/20 group"
                >
                  <CardContent className="p-5 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <div className="w-11 h-11 rounded-xl bg-primary/10 group-hover:bg-primary flex items-center justify-center flex-shrink-0 transition-colors duration-300">
                        <Building2 className="h-5 w-5 text-primary group-hover:text-primary-foreground transition-colors duration-300" />
                      </div>
                      <div>
                        <h3 className="font-semibold">{project.name}</h3>
                        <p className="text-sm text-muted-foreground">{project.neighborhood}, {project.city}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 flex-shrink-0">
                      <div className="hidden sm:flex items-center gap-1.5 text-sm text-muted-foreground">
                        <Eye className="h-3.5 w-3.5" />
                        {project.view_count || 0}
                      </div>
                      {project.is_published ? (
                        <Badge className="bg-green-100 text-green-700 border-0 text-xs rounded-lg">Published</Badge>
                      ) : (
                        <Badge variant="outline" className="text-xs rounded-lg">Draft</Badge>
                      )}
                      <Link to={`/developer/projects/${project.id}/edit`}>
                        <Button variant="outline" size="sm" className="text-xs rounded-xl">Edit</Button>
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
