import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
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
  Upload,
  Download,
  MapPinned,
  CheckCircle2,
  XCircle,
  AlertCircle,
  FileText,
  LayoutGrid,
  DollarSign,
  Check,
  X,
  Sparkles,
  Search as SearchIcon
} from "lucide-react";
import { generateProjectUrl } from "@/lib/seoUrls";

type Project = {
  id: string;
  name: string;
  slug: string;
  city: string;
  neighborhood: string;
  status: "coming_soon" | "registering" | "active" | "sold_out";
  completion_year: number | null;
  is_featured: boolean;
  is_published: boolean;
  show_in_hero: boolean;
  updated_at: string;
  brochure_files: string[] | null;
  floorplan_files: string[] | null;
  pricing_sheets: string[] | null;
  seo_title: string | null;
  seo_description: string | null;
};

type ProjectForGeocoding = {
  id: string;
  name: string;
  address: string | null;
  city: string;
  neighborhood: string;
  map_lat: number | null;
  map_lng: number | null;
};

type GeocodingResult = {
  id: string;
  name: string;
  status: 'pending' | 'success' | 'failed' | 'skipped';
  message?: string;
};

export default function AdminProjects() {
  const navigate = useNavigate();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [cityFilter, setCityFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [publishedFilter, setPublishedFilter] = useState<string>("all");
  const [docsFilter, setDocsFilter] = useState<string>("all");
  const [deleteProject, setDeleteProject] = useState<Project | null>(null);
  const [deleting, setDeleting] = useState(false);
  const { toast } = useToast();

  // Bulk geocoding state
  const [geocodingModalOpen, setGeocodingModalOpen] = useState(false);
  const [projectsToGeocode, setProjectsToGeocode] = useState<ProjectForGeocoding[]>([]);
  const [geocodingResults, setGeocodingResults] = useState<GeocodingResult[]>([]);
  const [geocodingInProgress, setGeocodingInProgress] = useState(false);
  const [geocodingProgress, setGeocodingProgress] = useState(0);
  const [geocodingComplete, setGeocodingComplete] = useState(false);
  const [geocodeAllProjects, setGeocodeAllProjects] = useState(false);

  // Bulk SEO generation state
  const [seoModalOpen, setSeoModalOpen] = useState(false);
  const [seoGenerating, setSeoGenerating] = useState(false);
  const [seoResults, setSeoResults] = useState<{ totalProcessed: number; totalErrors: number; results: { name: string; seo_title: string; seo_description: string }[] } | null>(null);
  const [seoMissingCount, setSeoMissingCount] = useState(0);

  useEffect(() => {
    fetchProjects();
    fetchSeoMissingCount();
  }, []);

  const fetchProjects = async () => {
    try {
      const { data, error } = await supabase
        .from("presale_projects")
        .select("id, name, slug, city, neighborhood, status, completion_year, is_featured, is_published, show_in_hero, updated_at, brochure_files, floorplan_files, pricing_sheets, seo_title, seo_description")
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

  const fetchSeoMissingCount = async () => {
    try {
      const { count, error } = await supabase
        .from("presale_projects")
        .select("*", { count: "exact", head: true })
        .eq("is_published", true)
        .or("seo_title.is.null,seo_title.eq.,seo_description.is.null,seo_description.eq.");

      if (!error) {
        setSeoMissingCount(count || 0);
      }
    } catch (error) {
      console.error("Error fetching SEO missing count:", error);
    }
  };

  const runBulkSeoGeneration = async (dryRun: boolean = false) => {
    setSeoGenerating(true);
    setSeoResults(null);
    
    try {
      const { data, error } = await supabase.functions.invoke("generate-project-seo", {
        body: { batchMode: true, dryRun },
      });

      if (error) throw error;
      
      setSeoResults(data);
      
      if (!dryRun && data.totalProcessed > 0) {
        toast({
          title: "SEO Generation Complete",
          description: `Updated ${data.totalProcessed} projects with SEO meta`,
        });
        fetchSeoMissingCount();
      }
    } catch (error) {
      console.error("Error generating SEO:", error);
      toast({
        title: "Error",
        description: "Failed to generate SEO meta",
        variant: "destructive",
      });
    } finally {
      setSeoGenerating(false);
    }
  };

  // Fetch projects for geocoding (missing only or all)
  const fetchProjectsForGeocoding = async (includeAll: boolean = false) => {
    try {
      let query = supabase
        .from("presale_projects")
        .select("id, name, address, city, neighborhood, map_lat, map_lng")
        .order("name");
      
      if (!includeAll) {
        query = query.or("map_lat.is.null,map_lng.is.null");
      }

      const { data, error } = await query;

      if (error) throw error;
      setProjectsToGeocode(data || []);
      setGeocodingResults(
        (data || []).map(p => ({
          id: p.id,
          name: p.name,
          status: 'pending' as const
        }))
      );
    } catch (error) {
      console.error("Error fetching projects for geocoding:", error);
      toast({
        title: "Error",
        description: "Failed to load projects for geocoding",
        variant: "destructive",
      });
    }
  };

  // Open geocoding modal
  const openGeocodingModal = async (regeocodeAll: boolean = false) => {
    setGeocodeAllProjects(regeocodeAll);
    setGeocodingModalOpen(true);
    setGeocodingComplete(false);
    setGeocodingProgress(0);
    await fetchProjectsForGeocoding(regeocodeAll);
  };

  // Geocode a single address using Google Maps API via edge function
  const geocodeAddress = async (address: string, neighborhood: string, city: string): Promise<{ lat: number; lng: number } | null> => {
    const query = [address, neighborhood, city, "BC", "Canada"]
      .filter(Boolean)
      .join(", ");
    
    try {
      const { data: { publicUrl } } = supabase.storage.from('listing-photos').getPublicUrl('');
      const supabaseUrl = publicUrl.split('/storage/')[0];
      
      const response = await fetch(`${supabaseUrl}/functions/v1/geocode-address`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ address: query, action: 'geocode' }),
      });
      
      if (!response.ok) return null;
      
      const data = await response.json();
      if (data.lat && data.lng) {
        return {
          lat: data.lat,
          lng: data.lng
        };
      }
      return null;
    } catch (error) {
      console.error("Geocoding error:", error);
      return null;
    }
  };

  // Run bulk geocoding
  const runBulkGeocoding = async () => {
    setGeocodingInProgress(true);
    setGeocodingComplete(false);
    
    const results = [...geocodingResults];
    let successCount = 0;
    let failCount = 0;
    
    for (let i = 0; i < projectsToGeocode.length; i++) {
      const project = projectsToGeocode[i];
      
      // Skip if no address available
      if (!project.address && !project.neighborhood) {
        results[i] = { ...results[i], status: 'skipped', message: 'No address or neighborhood' };
        setGeocodingResults([...results]);
        setGeocodingProgress(((i + 1) / projectsToGeocode.length) * 100);
        continue;
      }
      
      // Small delay to avoid overwhelming the API
      if (i > 0) {
        await new Promise(resolve => setTimeout(resolve, 300));
      }
      
      const coords = await geocodeAddress(
        project.address || "",
        project.neighborhood,
        project.city
      );
      
      if (coords) {
        // Update database
        const { error } = await supabase
          .from("presale_projects")
          .update({ map_lat: coords.lat, map_lng: coords.lng })
          .eq("id", project.id);
        
        if (error) {
          results[i] = { ...results[i], status: 'failed', message: 'Database update failed' };
          failCount++;
        } else {
          results[i] = { ...results[i], status: 'success', message: `${coords.lat.toFixed(4)}, ${coords.lng.toFixed(4)}` };
          successCount++;
        }
      } else {
        results[i] = { ...results[i], status: 'failed', message: 'Coordinates not found' };
        failCount++;
      }
      
      setGeocodingResults([...results]);
      setGeocodingProgress(((i + 1) / projectsToGeocode.length) * 100);
    }
    
    setGeocodingInProgress(false);
    setGeocodingComplete(true);
    
    toast({
      title: "Bulk Geocoding Complete",
      description: `${successCount} succeeded, ${failCount} failed, ${projectsToGeocode.length - successCount - failCount} skipped`,
    });
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

  const toggleHero = async (project: Project) => {
    try {
      const { error } = await supabase
        .from("presale_projects")
        .update({ show_in_hero: !project.show_in_hero })
        .eq("id", project.id);

      if (error) throw error;

      toast({
        title: project.show_in_hero ? "Removed from Hero Slider" : "Added to Hero Slider",
        description: `"${project.name}" ${project.show_in_hero ? "no longer appears" : "now appears"} on the homepage hero`,
      });
      fetchProjects();
    } catch (error) {
      console.error("Error updating project:", error);
      toast({
        title: "Error",
        description: "Failed to update hero slider status",
        variant: "destructive",
      });
    }
  };

  const exportProjectsToCSV = async () => {
    try {
      // Fetch full project data for export
      const { data, error } = await supabase
        .from("presale_projects")
        .select("id, name, slug, city, neighborhood, project_type, status, is_published, is_featured, starting_price, completion_year")
        .order("name");

      if (error) throw error;

      if (!data || data.length === 0) {
        toast({
          title: "No Data",
          description: "No projects to export",
          variant: "destructive",
        });
        return;
      }

      // Generate CSV content
      const headers = ["Project Name", "City", "Neighborhood", "Project Type", "Status", "Published", "Featured", "Starting Price", "Completion Year", "Project URL"];
      
      const rows = data.map(project => {
        const projectUrl = generateProjectUrl({
          slug: project.slug,
          neighborhood: project.neighborhood || project.city,
          projectType: project.project_type as "condo" | "townhome" | "mixed" | "duplex" | "single_family",
        });
        const fullUrl = `${window.location.origin}${projectUrl}`;
        
        return [
          `"${(project.name || "").replace(/"/g, '""')}"`,
          `"${(project.city || "").replace(/"/g, '""')}"`,
          `"${(project.neighborhood || "").replace(/"/g, '""')}"`,
          `"${(project.project_type || "").replace(/"/g, '""')}"`,
          `"${(project.status || "").replace(/"/g, '""')}"`,
          project.is_published ? "Yes" : "No",
          project.is_featured ? "Yes" : "No",
          project.starting_price || "",
          project.completion_year || "",
          `"${fullUrl}"`
        ].join(",");
      });

      const csvContent = [headers.join(","), ...rows].join("\n");
      
      // Create and download file
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `presale-projects-export-${new Date().toISOString().split("T")[0]}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast({
        title: "Export Complete",
        description: `Exported ${data.length} projects to CSV`,
      });
    } catch (error) {
      console.error("Error exporting projects:", error);
      toast({
        title: "Export Failed",
        description: "Failed to export projects",
        variant: "destructive",
      });
    }
  };

  const cities = [...new Set(projects.map(p => p.city))].sort();

  // Helper functions for document status
  const hasDoc = (files: string[] | null) => files && files.length > 0;
  const hasSeo = (project: Project) => project.seo_title && project.seo_title.trim() !== '' && project.seo_description && project.seo_description.trim() !== '';
  
  const filteredProjects = projects.filter(project => {
    const matchesSearch = project.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      project.neighborhood.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCity = cityFilter === "all" || project.city === cityFilter;
    const matchesStatus = statusFilter === "all" || project.status === statusFilter;
    const matchesPublished = publishedFilter === "all" || 
      (publishedFilter === "published" ? project.is_published : !project.is_published);
    
    // Document filter logic
    let matchesDocs = true;
    if (docsFilter === "missing_brochure") {
      matchesDocs = !hasDoc(project.brochure_files);
    } else if (docsFilter === "missing_floorplan") {
      matchesDocs = !hasDoc(project.floorplan_files);
    } else if (docsFilter === "missing_pricing") {
      matchesDocs = !hasDoc(project.pricing_sheets);
    } else if (docsFilter === "missing_seo") {
      matchesDocs = !hasSeo(project);
    } else if (docsFilter === "complete") {
      matchesDocs = hasDoc(project.brochure_files) && hasDoc(project.floorplan_files) && hasDoc(project.pricing_sheets);
    } else if (docsFilter === "incomplete") {
      matchesDocs = !hasDoc(project.brochure_files) || !hasDoc(project.floorplan_files) || !hasDoc(project.pricing_sheets);
    }
    
    return matchesSearch && matchesCity && matchesStatus && matchesPublished && matchesDocs;
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

  // Stats calculations
  const totalProjects = projects.length;
  const missingBrochureCount = projects.filter(p => !hasDoc(p.brochure_files)).length;

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">Presale Projects</h1>
            <p className="text-muted-foreground">Manage presale projects</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button 
              variant="outline" 
              onClick={() => setSeoModalOpen(true)} 
              className="gap-2"
              disabled={seoMissingCount === 0}
            >
              <Sparkles className="h-4 w-4" />
              Generate SEO {seoMissingCount > 0 && `(${seoMissingCount})`}
            </Button>
            <Button variant="outline" onClick={() => openGeocodingModal(false)} className="gap-2">
              <MapPinned className="h-4 w-4" />
              Bulk Geocode
            </Button>
            <Button variant="outline" onClick={() => openGeocodingModal(true)} className="gap-2">
              <MapPinned className="h-4 w-4" />
              Re-geocode All
            </Button>
            <Button variant="outline" onClick={() => navigate("/admin/projects/import")} className="gap-2">
              <Upload className="h-4 w-4" />
              Import CSV
            </Button>
            <Button variant="outline" onClick={exportProjectsToCSV} className="gap-2">
              <Download className="h-4 w-4" />
              Export CSV
            </Button>
            <Button onClick={() => navigate("/admin/projects/new")} className="gap-2">
              <Plus className="h-4 w-4" />
              Create Project
            </Button>
          </div>
        </div>

        {/* Stats Bar - Clickable Filters */}
        <div className="flex items-center gap-4 text-sm flex-wrap">
          <button 
            onClick={() => setDocsFilter("all")}
            className={cn(
              "flex items-center gap-2 px-3 py-1.5 rounded-full transition-colors",
              docsFilter === "all" 
                ? "bg-primary/10 text-primary" 
                : "hover:bg-muted"
            )}
          >
            <Building2 className="h-4 w-4" />
            <span className="font-medium">{totalProjects}</span>
            <span className="text-muted-foreground">Total</span>
          </button>
          <button 
            onClick={() => setDocsFilter(docsFilter === "missing_brochure" ? "all" : "missing_brochure")}
            className={cn(
              "flex items-center gap-2 px-3 py-1.5 rounded-full transition-colors",
              docsFilter === "missing_brochure" 
                ? "bg-destructive/20 text-destructive ring-1 ring-destructive/30" 
                : "hover:bg-destructive/10 text-destructive/80 hover:text-destructive"
            )}
          >
            <FileText className="h-4 w-4" />
            <span className="font-medium">{missingBrochureCount}</span>
            <span>Missing Brochure</span>
          </button>
          {seoMissingCount > 0 && (
            <button 
              onClick={() => setDocsFilter(docsFilter === "missing_seo" ? "all" : "missing_seo")}
              className={cn(
                "flex items-center gap-2 px-3 py-1.5 rounded-full transition-colors",
                docsFilter === "missing_seo" 
                  ? "bg-amber-100 text-amber-700 ring-1 ring-amber-300" 
                  : "hover:bg-amber-50 text-amber-600 hover:text-amber-700"
              )}
            >
              <Sparkles className="h-4 w-4" />
              <span className="font-medium">{seoMissingCount}</span>
              <span>Missing SEO</span>
            </button>
          )}
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
          <Select value={docsFilter} onValueChange={setDocsFilter}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder="Documents" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Documents</SelectItem>
              <SelectItem value="missing_brochure">Missing Brochure</SelectItem>
              <SelectItem value="missing_floorplan">Missing Floorplans</SelectItem>
              <SelectItem value="missing_pricing">Missing Pricing</SelectItem>
              <SelectItem value="missing_seo">Missing SEO</SelectItem>
              <SelectItem value="incomplete">Any Missing</SelectItem>
              <SelectItem value="complete">All Complete</SelectItem>
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
                        {/* Document Status Indicators */}
                        <div className="flex items-center gap-1 border-l pl-3 ml-2">
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <div className={cn(
                                "flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium transition-colors",
                                hasDoc(project.brochure_files) 
                                  ? "bg-green-100 text-green-600" 
                                  : "bg-destructive/10 text-destructive"
                              )}>
                                <FileText className="h-3 w-3" />
                                {hasDoc(project.brochure_files) ? <Check className="h-3 w-3" /> : <X className="h-3 w-3" />}
                              </div>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Brochure: {hasDoc(project.brochure_files) ? "Uploaded" : "Missing"}</p>
                            </TooltipContent>
                          </Tooltip>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <div className={cn(
                                "flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium transition-colors",
                                hasDoc(project.floorplan_files) 
                                  ? "bg-green-100 text-green-600" 
                                  : "bg-destructive/10 text-destructive"
                              )}>
                                <LayoutGrid className="h-3 w-3" />
                                {hasDoc(project.floorplan_files) ? <Check className="h-3 w-3" /> : <X className="h-3 w-3" />}
                              </div>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Floorplans: {hasDoc(project.floorplan_files) ? "Uploaded" : "Missing"}</p>
                            </TooltipContent>
                          </Tooltip>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <div className={cn(
                                "flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium transition-colors",
                                hasDoc(project.pricing_sheets) 
                                  ? "bg-green-100 text-green-600" 
                                  : "bg-destructive/10 text-destructive"
                              )}>
                                <DollarSign className="h-3 w-3" />
                                {hasDoc(project.pricing_sheets) ? <Check className="h-3 w-3" /> : <X className="h-3 w-3" />}
                              </div>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Pricing: {hasDoc(project.pricing_sheets) ? "Uploaded" : "Missing"}</p>
                            </TooltipContent>
                          </Tooltip>
                        </div>
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

      {/* Bulk Geocoding Modal */}
      <Dialog open={geocodingModalOpen} onOpenChange={setGeocodingModalOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MapPinned className="h-5 w-5" />
              {geocodeAllProjects ? "Re-geocode All Projects" : "Bulk Geocoding Tool"}
            </DialogTitle>
            <DialogDescription>
              {geocodeAllProjects 
                ? "Re-fetch coordinates for all projects using Google Maps API."
                : "Automatically fetch coordinates for projects missing latitude/longitude data."}
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 overflow-hidden flex flex-col gap-4">
            {projectsToGeocode.length === 0 ? (
              <Card>
                <CardContent className="py-8 text-center">
                  <CheckCircle2 className="h-12 w-12 text-green-500 mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">
                    {geocodeAllProjects ? "No projects found" : "All projects have coordinates!"}
                  </h3>
                  <p className="text-muted-foreground">
                    {geocodeAllProjects 
                      ? "There are no projects in the database."
                      : "There are no projects missing map coordinates."}
                  </p>
                </CardContent>
              </Card>
            ) : (
              <>
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">
                      {geocodeAllProjects 
                        ? `${projectsToGeocode.length} total projects`
                        : `${projectsToGeocode.length} projects missing coordinates`}
                    </CardTitle>
                    <CardDescription>
                      Uses Google Maps Geocoding API
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {geocodingInProgress && (
                      <div className="space-y-2">
                        <Progress value={geocodingProgress} className="h-2" />
                        <p className="text-sm text-muted-foreground text-center">
                          Processing... {Math.round(geocodingProgress)}%
                        </p>
                      </div>
                    )}
                    
                    {!geocodingInProgress && !geocodingComplete && (
                      <Button onClick={runBulkGeocoding} className="w-full gap-2">
                        <MapPinned className="h-4 w-4" />
                        Start Geocoding ({projectsToGeocode.length} projects)
                      </Button>
                    )}

                    {geocodingComplete && (
                      <div className="flex gap-2">
                        <Button 
                          variant="outline" 
                          onClick={() => setGeocodingModalOpen(false)} 
                          className="flex-1"
                        >
                          Close
                        </Button>
                        <Button 
                          onClick={() => {
                            setGeocodingComplete(false);
                            fetchProjectsForGeocoding(geocodeAllProjects);
                          }} 
                          className="flex-1 gap-2"
                        >
                          <Loader2 className="h-4 w-4" />
                          Retry Failed
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>

                <div className="flex-1 overflow-y-auto border rounded-lg">
                  <div className="divide-y">
                    {geocodingResults.map((result, index) => (
                      <div 
                        key={result.id} 
                        className="flex items-center gap-3 px-4 py-2.5 text-sm"
                      >
                        <div className="shrink-0">
                          {result.status === 'pending' && (
                            <div className="h-5 w-5 rounded-full border-2 border-muted-foreground/30" />
                          )}
                          {result.status === 'success' && (
                            <CheckCircle2 className="h-5 w-5 text-green-500" />
                          )}
                          {result.status === 'failed' && (
                            <XCircle className="h-5 w-5 text-destructive" />
                          )}
                          {result.status === 'skipped' && (
                            <AlertCircle className="h-5 w-5 text-yellow-500" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">{result.name}</p>
                          {result.message && (
                            <p className="text-xs text-muted-foreground truncate">
                              {result.message}
                            </p>
                          )}
                        </div>
                        <Badge 
                          variant={
                            result.status === 'success' ? 'default' :
                            result.status === 'failed' ? 'destructive' :
                            result.status === 'skipped' ? 'secondary' : 'outline'
                          }
                          className="shrink-0"
                        >
                          {result.status}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Bulk SEO Generation Modal */}
      <Dialog open={seoModalOpen} onOpenChange={setSeoModalOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-amber-500" />
              Bulk SEO Generation
            </DialogTitle>
            <DialogDescription>
              Automatically generate SEO titles and descriptions for all projects missing them.
              This uses smart templates based on project data (name, city, price, type).
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 overflow-hidden flex flex-col gap-4">
            {seoMissingCount === 0 && !seoResults ? (
              <Card>
                <CardContent className="py-8 text-center">
                  <CheckCircle2 className="h-12 w-12 text-green-500 mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">All projects have SEO meta!</h3>
                  <p className="text-muted-foreground">
                    Every published project already has SEO title and description.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <>
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">
                      {seoResults 
                        ? `${seoResults.totalProcessed} projects updated`
                        : `${seoMissingCount} projects missing SEO meta`}
                    </CardTitle>
                    <CardDescription>
                      Auto-generates optimized titles (≤60 chars) and descriptions (≤160 chars)
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {seoGenerating && (
                      <div className="flex items-center justify-center gap-3 py-4">
                        <Loader2 className="h-5 w-5 animate-spin text-primary" />
                        <p className="text-sm text-muted-foreground">Generating SEO meta...</p>
                      </div>
                    )}
                    
                    {!seoGenerating && !seoResults && (
                      <div className="flex gap-2">
                        <Button 
                          variant="outline"
                          onClick={() => runBulkSeoGeneration(true)} 
                          className="flex-1 gap-2"
                        >
                          <Eye className="h-4 w-4" />
                          Preview ({seoMissingCount})
                        </Button>
                        <Button 
                          onClick={() => runBulkSeoGeneration(false)} 
                          className="flex-1 gap-2"
                        >
                          <Sparkles className="h-4 w-4" />
                          Generate & Save
                        </Button>
                      </div>
                    )}

                    {seoResults && (
                      <div className="flex gap-2">
                        <Button 
                          variant="outline" 
                          onClick={() => {
                            setSeoModalOpen(false);
                            setSeoResults(null);
                          }} 
                          className="flex-1"
                        >
                          Close
                        </Button>
                        {seoResults.totalErrors > 0 && (
                          <Button 
                            onClick={() => {
                              setSeoResults(null);
                              runBulkSeoGeneration(false);
                            }} 
                            className="flex-1 gap-2"
                          >
                            <Loader2 className="h-4 w-4" />
                            Retry Failed
                          </Button>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>

                {seoResults && seoResults.results.length > 0 && (
                  <div className="flex-1 overflow-y-auto border rounded-lg">
                    <div className="divide-y">
                      {seoResults.results.map((result, index) => (
                        <div key={index} className="px-4 py-3 space-y-1">
                          <div className="flex items-center gap-2">
                            <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />
                            <p className="font-medium text-sm">{result.name}</p>
                          </div>
                          <p className="text-xs text-primary ml-6 truncate">{result.seo_title}</p>
                          <p className="text-xs text-muted-foreground ml-6 line-clamp-2">{result.seo_description}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}