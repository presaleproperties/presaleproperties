import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Search,
  FileText,
  Image as ImageIcon,
  Download,
  Building2,
  MapPin,
  Lock,
  CheckCircle,
  AlertCircle,
  ExternalLink,
  Loader2,
  FolderOpen,
  Crown,
  Filter,
} from "lucide-react";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";

interface PresaleProject {
  id: string;
  name: string;
  slug: string;
  city: string;
  neighborhood: string | null;
  developer_name: string | null;
  project_type: string;
  status: string;
  starting_price: number | null;
  featured_image: string | null;
  brochure_files: string[] | null;
  floorplan_files: string[] | null;
  completion_year: number | null;
}

export default function DashboardProjectDocuments() {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCity, setSelectedCity] = useState<string>("all");
  const [selectedType, setSelectedType] = useState<string>("all");
  const [selectedProject, setSelectedProject] = useState<PresaleProject | null>(null);
  const [isDocumentModalOpen, setIsDocumentModalOpen] = useState(false);

  // Check agent verification status
  const { data: agentProfile, isLoading: profileLoading } = useQuery({
    queryKey: ["agent-profile", user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const { data, error } = await (supabase as any)
        .from("agent_profiles")
        .select("verification_status")
        .eq("user_id", user.id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  const isVerified = agentProfile?.verification_status === "verified";

  // Fetch all published presale projects with documents
  const { data: projects, isLoading: projectsLoading } = useQuery({
    queryKey: ["presale-projects-with-docs"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("presale_projects")
        .select(`
          id, name, slug, city, neighborhood, developer_name,
          project_type, status, starting_price, featured_image,
          brochure_files, floorplan_files, completion_year
        `)
        .eq("is_published", true)
        .order("name", { ascending: true });
      if (error) throw error;
      return data as PresaleProject[];
    },
  });

  // Get unique cities for filter
  const cities = useMemo(() => {
    if (!projects) return [];
    const uniqueCities = [...new Set(projects.map((p) => p.city))].sort();
    return uniqueCities;
  }, [projects]);

  // Filter projects
  const filteredProjects = useMemo(() => {
    if (!projects) return [];
    return projects.filter((project) => {
      const matchesSearch =
        project.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        project.city.toLowerCase().includes(searchQuery.toLowerCase()) ||
        project.developer_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        project.neighborhood?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCity = selectedCity === "all" || project.city === selectedCity;
      const matchesType = selectedType === "all" || project.project_type === selectedType;
      return matchesSearch && matchesCity && matchesType;
    });
  }, [projects, searchQuery, selectedCity, selectedType]);

  // Count projects with documents
  const projectsWithDocs = useMemo(() => {
    if (!projects) return 0;
    return projects.filter(
      (p) =>
        (p.brochure_files && p.brochure_files.length > 0) ||
        (p.floorplan_files && p.floorplan_files.length > 0)
    ).length;
  }, [projects]);

  const openDocumentModal = (project: PresaleProject) => {
    setSelectedProject(project);
    setIsDocumentModalOpen(true);
  };

  const formatPrice = (price: number | null) => {
    if (!price) return "TBA";
    return new Intl.NumberFormat("en-CA", {
      style: "currency",
      currency: "CAD",
      maximumFractionDigits: 0,
    }).format(price);
  };

  const getProjectTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      condo: "Condo",
      townhome: "Townhome",
      single_family: "Single Family",
      mixed: "Mixed Use",
      duplex: "Duplex",
    };
    return labels[type] || type;
  };

  const hasDocuments = (project: PresaleProject) =>
    (project.brochure_files && project.brochure_files.length > 0) ||
    (project.floorplan_files && project.floorplan_files.length > 0);

  if (profileLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-[60vh]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  // Not verified - show locked state
  if (!isVerified) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          {/* Header */}
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary/10 via-primary/5 to-background border border-primary/20 p-6 md:p-8">
            <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
            <div className="relative">
              <div className="flex items-center gap-2 mb-2">
                <Crown className="h-5 w-5 text-primary" />
                <span className="text-sm font-medium text-primary">Premium Agent Benefit</span>
              </div>
              <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-2">
                Project Document Library
              </h1>
              <p className="text-muted-foreground">
                Access floorplans, brochures, and pricing sheets for all BC presale projects.
              </p>
            </div>
          </div>

          {/* Locked Card */}
          <Card className="border-amber-500/30 bg-gradient-to-br from-amber-500/5 to-background">
            <CardContent className="py-12">
              <div className="flex flex-col items-center justify-center text-center max-w-md mx-auto">
                <div className="p-4 rounded-full bg-amber-500/10 mb-4">
                  <Lock className="h-10 w-10 text-amber-600" />
                </div>
                <h2 className="text-xl font-semibold mb-2">Verification Required</h2>
                <p className="text-muted-foreground mb-6">
                  Complete your BCFSA license verification to unlock access to project documents,
                  floorplans, and pricing sheets for all {projects?.length || 0}+ presale projects.
                </p>
                <div className="flex gap-3">
                  <Link to="/dashboard/profile">
                    <Button className="gap-2">
                      <CheckCircle className="h-4 w-4" />
                      Complete Verification
                    </Button>
                  </Link>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Preview of what's available - blurred */}
          <div className="relative">
            <div className="absolute inset-0 backdrop-blur-sm bg-background/50 z-10 rounded-xl flex items-center justify-center">
              <Badge variant="outline" className="gap-2 py-2 px-4 bg-background/80">
                <Lock className="h-4 w-4" />
                Unlock with verification
              </Badge>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 opacity-50">
              {[1, 2, 3].map((i) => (
                <Card key={i}>
                  <Skeleton className="h-32 w-full" />
                  <CardContent className="pt-4">
                    <Skeleton className="h-5 w-3/4 mb-2" />
                    <Skeleton className="h-4 w-1/2" />
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary/10 via-primary/5 to-background border border-primary/20 p-6 md:p-8">
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
          <div className="relative">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Crown className="h-5 w-5 text-primary" />
                  <span className="text-sm font-medium text-primary">Verified Agent Access</span>
                  <Badge variant="default" className="bg-green-500/20 text-green-700 border-green-500/30">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Verified
                  </Badge>
                </div>
                <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-2">
                  Project Document Library
                </h1>
                <p className="text-muted-foreground">
                  Access floorplans, brochures, and pricing sheets for {projects?.length || 0} presale projects.
                </p>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted/50 px-4 py-2 rounded-lg">
                <FolderOpen className="h-4 w-4" />
                <span>{projectsWithDocs} projects with documents</span>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by project name, city, developer..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <div className="flex gap-3">
                <Select value={selectedCity} onValueChange={setSelectedCity}>
                  <SelectTrigger className="w-[160px]">
                    <Filter className="h-4 w-4 mr-2" />
                    <SelectValue placeholder="All Cities" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Cities</SelectItem>
                    {cities.map((city) => (
                      <SelectItem key={city} value={city}>
                        {city}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={selectedType} onValueChange={setSelectedType}>
                  <SelectTrigger className="w-[160px]">
                    <SelectValue placeholder="All Types" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="condo">Condo</SelectItem>
                    <SelectItem value="townhome">Townhome</SelectItem>
                    <SelectItem value="single_family">Single Family</SelectItem>
                    <SelectItem value="mixed">Mixed Use</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Projects Grid */}
        {projectsLoading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Card key={i}>
                <Skeleton className="h-40 w-full" />
                <CardContent className="pt-4">
                  <Skeleton className="h-5 w-3/4 mb-2" />
                  <Skeleton className="h-4 w-1/2" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : filteredProjects.length === 0 ? (
          <Card>
            <CardContent className="py-12">
              <div className="flex flex-col items-center justify-center text-center">
                <Building2 className="h-12 w-12 text-muted-foreground/50 mb-4" />
                <h3 className="font-semibold mb-1">No Projects Found</h3>
                <p className="text-muted-foreground text-sm">
                  Try adjusting your search or filters.
                </p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filteredProjects.map((project) => (
              <Card
                key={project.id}
                className={cn(
                  "overflow-hidden group hover:shadow-lg transition-all cursor-pointer",
                  hasDocuments(project) && "border-primary/20 hover:border-primary/40"
                )}
                onClick={() => openDocumentModal(project)}
              >
                {/* Image */}
                <div className="relative h-40 bg-muted">
                  {project.featured_image ? (
                    <img
                      src={project.featured_image}
                      alt={project.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Building2 className="h-12 w-12 text-muted-foreground/30" />
                    </div>
                  )}
                  {/* Document badges */}
                  <div className="absolute top-2 right-2 flex gap-1">
                    {project.floorplan_files && project.floorplan_files.length > 0 && (
                      <Badge className="bg-blue-500/90 text-white text-xs">
                        <ImageIcon className="h-3 w-3 mr-1" />
                        {project.floorplan_files.length} Floorplans
                      </Badge>
                    )}
                    {project.brochure_files && project.brochure_files.length > 0 && (
                      <Badge className="bg-green-500/90 text-white text-xs">
                        <FileText className="h-3 w-3 mr-1" />
                        Brochure
                      </Badge>
                    )}
                  </div>
                  {/* Type badge */}
                  <Badge
                    variant="secondary"
                    className="absolute bottom-2 left-2 bg-background/90"
                  >
                    {getProjectTypeLabel(project.project_type)}
                  </Badge>
                </div>

                <CardContent className="pt-4">
                  <h3 className="font-semibold text-lg mb-1 group-hover:text-primary transition-colors line-clamp-1">
                    {project.name}
                  </h3>
                  <div className="flex items-center gap-1 text-sm text-muted-foreground mb-2">
                    <MapPin className="h-3.5 w-3.5" />
                    <span>{project.city}</span>
                    {project.neighborhood && (
                      <>
                        <span>•</span>
                        <span>{project.neighborhood}</span>
                      </>
                    )}
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">
                      {project.developer_name || "Developer TBA"}
                    </span>
                    <span className="font-medium text-primary">
                      {formatPrice(project.starting_price)}
                    </span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Document Access Modal */}
        <Dialog open={isDocumentModalOpen} onOpenChange={setIsDocumentModalOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh]">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <FolderOpen className="h-5 w-5 text-primary" />
                {selectedProject?.name} Documents
              </DialogTitle>
              <DialogDescription>
                Download floorplans and brochures for {selectedProject?.name}
              </DialogDescription>
            </DialogHeader>

            {selectedProject && (
              <ScrollArea className="max-h-[60vh]">
                <div className="space-y-6 pr-4">
                  {/* Project Info */}
                  <div className="flex items-start gap-4 p-4 bg-muted/50 rounded-lg">
                    {selectedProject.featured_image ? (
                      <img
                        src={selectedProject.featured_image}
                        alt={selectedProject.name}
                        className="w-20 h-20 rounded-lg object-cover"
                      />
                    ) : (
                      <div className="w-20 h-20 rounded-lg bg-muted flex items-center justify-center">
                        <Building2 className="h-8 w-8 text-muted-foreground/50" />
                      </div>
                    )}
                    <div className="flex-1">
                      <h3 className="font-semibold">{selectedProject.name}</h3>
                      <p className="text-sm text-muted-foreground">
                        {selectedProject.city}
                        {selectedProject.neighborhood && ` • ${selectedProject.neighborhood}`}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {selectedProject.developer_name || "Developer TBA"}
                      </p>
                      <div className="flex gap-2 mt-2">
                        <Badge variant="secondary">
                          {getProjectTypeLabel(selectedProject.project_type)}
                        </Badge>
                        {selectedProject.completion_year && (
                          <Badge variant="outline">
                            Completion {selectedProject.completion_year}
                          </Badge>
                        )}
                      </div>
                    </div>
                    <Link to={`/presales/${selectedProject.slug}`} target="_blank">
                      <Button variant="outline" size="sm" className="gap-2">
                        <ExternalLink className="h-4 w-4" />
                        View Project
                      </Button>
                    </Link>
                  </div>

                  {/* Floorplans Section */}
                  <div>
                    <h4 className="font-medium mb-3 flex items-center gap-2">
                      <ImageIcon className="h-4 w-4 text-blue-500" />
                      Floorplans
                    </h4>
                    {selectedProject.floorplan_files &&
                    selectedProject.floorplan_files.length > 0 ? (
                      <div className="grid gap-2">
                        {selectedProject.floorplan_files.map((file, index) => (
                          <a
                            key={index}
                            href={file}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 transition-colors group"
                          >
                            <div className="flex items-center gap-3">
                              <div className="p-2 rounded-lg bg-blue-500/10">
                                <FileText className="h-4 w-4 text-blue-500" />
                              </div>
                              <span className="text-sm font-medium">
                                Floorplan {index + 1}
                              </span>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="gap-2 opacity-70 group-hover:opacity-100"
                            >
                              <Download className="h-4 w-4" />
                              Download
                            </Button>
                          </a>
                        ))}
                      </div>
                    ) : (
                      <div className="p-4 rounded-lg border border-dashed text-center text-muted-foreground text-sm">
                        <AlertCircle className="h-5 w-5 mx-auto mb-2 opacity-50" />
                        No floorplans uploaded yet
                      </div>
                    )}
                  </div>

                  {/* Brochures Section */}
                  <div>
                    <h4 className="font-medium mb-3 flex items-center gap-2">
                      <FileText className="h-4 w-4 text-green-500" />
                      Brochures & Pricing Sheets
                    </h4>
                    {selectedProject.brochure_files &&
                    selectedProject.brochure_files.length > 0 ? (
                      <div className="grid gap-2">
                        {selectedProject.brochure_files.map((file, index) => (
                          <a
                            key={index}
                            href={file}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 transition-colors group"
                          >
                            <div className="flex items-center gap-3">
                              <div className="p-2 rounded-lg bg-green-500/10">
                                <FileText className="h-4 w-4 text-green-500" />
                              </div>
                              <span className="text-sm font-medium">
                                {index === 0 ? "Project Brochure" : `Brochure ${index + 1}`}
                              </span>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="gap-2 opacity-70 group-hover:opacity-100"
                            >
                              <Download className="h-4 w-4" />
                              Download
                            </Button>
                          </a>
                        ))}
                      </div>
                    ) : (
                      <div className="p-4 rounded-lg border border-dashed text-center text-muted-foreground text-sm">
                        <AlertCircle className="h-5 w-5 mx-auto mb-2 opacity-50" />
                        No brochures uploaded yet
                      </div>
                    )}
                  </div>
                </div>
              </ScrollArea>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
