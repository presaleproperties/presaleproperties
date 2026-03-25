import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { DeveloperPortalLayout } from "@/components/developer/DeveloperPortalLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, Building2, Plus, FileText, Eye, Edit } from "lucide-react";

interface Project {
  id: string;
  name: string;
  city: string;
  neighborhood: string;
  status: string;
  is_published: boolean;
  featured_image: string | null;
  floorplan_files: string[] | null;
  brochure_files: string[] | null;
}

export default function DeveloperProjects() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [developerId, setDeveloperId] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/login?type=developer");
      return;
    }

    if (user) {
      fetchDeveloperAndProjects();
    }
  }, [user, authLoading, navigate]);

  const fetchDeveloperAndProjects = async () => {
    if (!user) return;

    // Get developer profile
    const { data: devProfile, error: devError } = await supabase
      .from("developer_profiles")
      .select("id, verification_status")
      .eq("user_id", user.id)
      .maybeSingle();

    if (devError || !devProfile || devProfile.verification_status !== "approved") {
      navigate("/developer");
      return;
    }

    setDeveloperId(devProfile.id);

    // Get projects
    const { data: projectsData, error: projectsError } = await supabase
      .from("presale_projects")
      .select("id, name, city, neighborhood, status, is_published, featured_image, floorplan_files, brochure_files")
      .eq("developer_id", devProfile.id)
      .order("created_at", { ascending: false });

    if (!projectsError && projectsData) {
      setProjects(projectsData);
    }

    setLoading(false);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "coming_soon": return "bg-blue-100 text-blue-800";
      case "registering": return "bg-amber-100 text-amber-800";
      case "active": return "bg-green-100 text-green-800";
      case "sold_out": return "bg-gray-100 text-gray-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const formatStatus = (status: string) => {
    return status.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase());
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <DeveloperPortalLayout>
      <div className="container py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold">Your Projects</h1>
            <p className="text-muted-foreground">Upload and manage floor plans, pricing, and brochures</p>
          </div>
          <Link to="/developer/projects/new">
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Project
            </Button>
          </Link>
        </div>

        {projects.length === 0 ? (
          <Card>
            <CardContent className="text-center py-16">
              <Building2 className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <h2 className="text-xl font-semibold mb-2">No projects yet</h2>
              <p className="text-muted-foreground mb-6">
                Add your first project to share it with agents
              </p>
              <Link to="/developer/projects/new">
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Your First Project
                </Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {projects.map((project) => (
              <Card key={project.id}>
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    {project.featured_image ? (
                      <img
                        src={project.featured_image}
                        alt={project.name}
                        className="w-24 h-24 object-cover rounded-lg"
                      />
                    ) : (
                      <div className="w-24 h-24 bg-muted rounded-lg flex items-center justify-center">
                        <Building2 className="h-8 w-8 text-muted-foreground" />
                      </div>
                    )}

                    <div className="flex-1">
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="font-semibold text-lg">{project.name}</h3>
                          <p className="text-muted-foreground">{project.neighborhood}, {project.city}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge className={getStatusColor(project.status)}>
                            {formatStatus(project.status)}
                          </Badge>
                          {project.is_published && (
                            <Badge variant="outline" className="text-green-600 border-green-600">
                              Published
                            </Badge>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-4 mt-4 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <FileText className="h-4 w-4" />
                          {project.floorplan_files?.length || 0} floor plans
                        </span>
                        <span className="flex items-center gap-1">
                          <FileText className="h-4 w-4" />
                          {project.brochure_files?.length || 0} brochures
                        </span>
                      </div>

                      <div className="flex items-center gap-2 mt-4">
                        <Link to={`/developer/projects/${project.id}/edit`}>
                          <Button variant="outline" size="sm">
                            <Edit className="h-4 w-4 mr-2" />
                            Edit
                          </Button>
                        </Link>
                        {project.is_published && (
                          <Link to={`/presale-projects/${project.id}`} target="_blank">
                            <Button variant="ghost" size="sm">
                              <Eye className="h-4 w-4 mr-2" />
                              View Live
                            </Button>
                          </Link>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </DeveloperPortalLayout>
  );
}
