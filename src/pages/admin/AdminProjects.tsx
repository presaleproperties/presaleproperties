import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { 
  Plus,
  Search,
  Building2,
  MapPin,
  Calendar,
  Star,
  Eye,
  EyeOff,
  Loader2,
  Pencil,
  Copy,
  Trash2,
  Upload
} from "lucide-react";

type Project = {
  id: string;
  name: string;
  slug: string;
  city: string;
  neighborhood: string;
  status: "coming_soon" | "active" | "sold_out";
  completion_year: number | null;
  is_featured: boolean;
  is_published: boolean;
  updated_at: string;
};

export default function AdminProjects() {
  const navigate = useNavigate();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [cityFilter, setCityFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [publishedFilter, setPublishedFilter] = useState<string>("all");
  const [deleteProject, setDeleteProject] = useState<Project | null>(null);
  const [deleting, setDeleting] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      const { data, error } = await supabase
        .from("presale_projects")
        .select("id, name, slug, city, neighborhood, status, completion_year, is_featured, is_published, updated_at")
        .order("updated_at", { ascending: false });

      if (error) throw error;
      setProjects(data || []);
    } catch (error) {
      console.error("Error fetching projects:", error);
      toast({
        title: "Error",
        description: "Failed to load projects",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteProject) return;
    setDeleting(true);
    try {
      const { error } = await supabase
        .from("presale_projects")
        .delete()
        .eq("id", deleteProject.id);

      if (error) throw error;

      toast({
        title: "Project Deleted",
        description: `"${deleteProject.name}" has been deleted`,
      });
      fetchProjects();
    } catch (error) {
      console.error("Error deleting project:", error);
      toast({
        title: "Error",
        description: "Failed to delete project",
        variant: "destructive",
      });
    } finally {
      setDeleting(false);
      setDeleteProject(null);
    }
  };

  const handleDuplicate = async (project: Project) => {
    try {
      const { data: original, error: fetchError } = await supabase
        .from("presale_projects")
        .select("*")
        .eq("id", project.id)
        .single();

      if (fetchError) throw fetchError;

      const { id, slug, created_at, updated_at, ...rest } = original;
      const newSlug = `${slug}-copy-${Date.now()}`;
      
      const { error } = await supabase
        .from("presale_projects")
        .insert({
          ...rest,
          name: `${rest.name} (Copy)`,
          slug: newSlug,
          is_published: false,
        });

      if (error) throw error;

      toast({
        title: "Project Duplicated",
        description: "A copy has been created as a draft",
      });
      fetchProjects();
    } catch (error) {
      console.error("Error duplicating project:", error);
      toast({
        title: "Error",
        description: "Failed to duplicate project",
        variant: "destructive",
      });
    }
  };

  const togglePublished = async (project: Project) => {
    try {
      const updates: { is_published: boolean; published_at?: string | null } = {
        is_published: !project.is_published,
      };
      
      if (!project.is_published) {
        updates.published_at = new Date().toISOString();
      }

      const { error } = await supabase
        .from("presale_projects")
        .update(updates)
        .eq("id", project.id);

      if (error) throw error;

      toast({
        title: project.is_published ? "Project Unpublished" : "Project Published",
        description: `"${project.name}" is now ${project.is_published ? "hidden" : "live"}`,
      });
      fetchProjects();
    } catch (error) {
      console.error("Error updating project:", error);
      toast({
        title: "Error",
        description: "Failed to update project",
        variant: "destructive",
      });
    }
  };

  const toggleFeatured = async (project: Project) => {
    try {
      const { error } = await supabase
        .from("presale_projects")
        .update({ is_featured: !project.is_featured })
        .eq("id", project.id);

      if (error) throw error;

      toast({
        title: project.is_featured ? "Removed from Featured" : "Added to Featured",
        description: `"${project.name}" is ${project.is_featured ? "no longer" : "now"} featured`,
      });
      fetchProjects();
    } catch (error) {
      console.error("Error updating project:", error);
      toast({
        title: "Error",
        description: "Failed to update project",
        variant: "destructive",
      });
    }
  };

  const cities = [...new Set(projects.map(p => p.city))].sort();

  const filteredProjects = projects.filter(project => {
    const matchesSearch = project.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      project.neighborhood.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCity = cityFilter === "all" || project.city === cityFilter;
    const matchesStatus = statusFilter === "all" || project.status === statusFilter;
    const matchesPublished = publishedFilter === "all" || 
      (publishedFilter === "published" ? project.is_published : !project.is_published);
    return matchesSearch && matchesCity && matchesStatus && matchesPublished;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "coming_soon": return "bg-blue-100 text-blue-800";
      case "active": return "bg-green-100 text-green-800";
      case "sold_out": return "bg-gray-100 text-gray-800";
      default: return "";
    }
  };

  const formatStatus = (status: string) => {
    return status.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase());
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">Presale Projects</h1>
            <p className="text-muted-foreground">Manage presale projects</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => navigate("/admin/projects/import")} className="gap-2">
              <Upload className="h-4 w-4" />
              Import CSV
            </Button>
            <Button onClick={() => navigate("/admin/projects/new")} className="gap-2">
              <Plus className="h-4 w-4" />
              Create Project
            </Button>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search projects..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={cityFilter} onValueChange={setCityFilter}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder="City" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Cities</SelectItem>
              {cities.map(city => (
                <SelectItem key={city} value={city}>{city}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="coming_soon">Coming Soon</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="sold_out">Sold Out</SelectItem>
            </SelectContent>
          </Select>
          <Select value={publishedFilter} onValueChange={setPublishedFilter}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder="Published" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="published">Published</SelectItem>
              <SelectItem value="draft">Draft</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Projects List */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : filteredProjects.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Building2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">No projects found</h3>
              <p className="text-muted-foreground mb-4">
                {projects.length === 0 
                  ? "Get started by creating your first project" 
                  : "Try adjusting your filters"}
              </p>
              {projects.length === 0 && (
                <Button onClick={() => navigate("/admin/projects/new")}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Project
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {filteredProjects.map((project) => (
              <Card key={project.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <h3 className="font-semibold truncate">{project.name}</h3>
                        {project.is_featured && (
                          <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                        )}
                        <Badge className={getStatusColor(project.status)}>
                          {formatStatus(project.status)}
                        </Badge>
                        <Badge variant={project.is_published ? "default" : "secondary"}>
                          {project.is_published ? "Published" : "Draft"}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {project.city}, {project.neighborhood}
                        </span>
                        {project.completion_year && (
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {project.completion_year}
                          </span>
                        )}
                        <span className="text-xs">
                          Updated {new Date(project.updated_at).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => togglePublished(project)}
                        title={project.is_published ? "Unpublish" : "Publish"}
                      >
                        {project.is_published ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleFeatured(project)}
                        title={project.is_featured ? "Remove from Featured" : "Add to Featured"}
                        className={project.is_featured ? "text-yellow-500 hover:text-yellow-600" : ""}
                      >
                        <Star className={`h-4 w-4 ${project.is_featured ? "fill-current" : ""}`} />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => navigate(`/admin/projects/${project.id}/edit`)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDuplicate(project)}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setDeleteProject(project)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteProject} onOpenChange={() => setDeleteProject(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Project</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{deleteProject?.name}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={deleting}
            >
              {deleting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminLayout>
  );
}