import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { DeveloperPortalLayout } from "@/components/developer/DeveloperPortalLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import {
  Loader2, Building2, Plus, Home, Eye, Search, Link2, CheckCircle2,
  ArrowRight, Package, ExternalLink
} from "lucide-react";

interface DeveloperProfile {
  id: string;
  company_name: string;
  verification_status: string;
}

interface Project {
  id: string;
  name: string;
  city: string;
  neighborhood: string | null;
  status: string;
  is_published: boolean;
  featured_image: string | null;
  developer_id: string | null;
  developer_name: string | null;
  view_count: number;
  _unitCount?: number;
  _claimed?: boolean;
}

const statusLabel: Record<string, string> = {
  coming_soon: "Coming Soon",
  registering: "Registering",
  active: "Active",
  sold_out: "Sold Out",
};

const statusStyle: Record<string, string> = {
  coming_soon: "bg-blue-100 text-blue-800 border-blue-200",
  registering: "bg-amber-100 text-amber-800 border-amber-200",
  active: "bg-emerald-100 text-emerald-800 border-emerald-200",
  sold_out: "bg-slate-100 text-slate-600 border-slate-200",
};

export default function DeveloperProjects() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  const [profile, setProfile] = useState<DeveloperProfile | null>(null);
  const [myProjects, setMyProjects] = useState<Project[]>([]);
  const [matchedProjects, setMatchedProjects] = useState<Project[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [claiming, setClaiming] = useState<string | null>(null);
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) { navigate("/developer/login"); return; }
    if (user) init();
  }, [user, authLoading]);

  const init = async () => {
    const { data: dev } = await supabase
      .from("developer_profiles")
      .select("id, company_name, verification_status")
      .eq("user_id", user!.id)
      .maybeSingle();

    if (!dev || dev.verification_status !== "approved") { navigate("/developer"); return; }
    setProfile(dev);

    await loadProjects(dev);
    setLoading(false);
  };

  const loadProjects = async (dev: DeveloperProfile) => {
    // Look up the matching developers table entry by company name (FK target)
    const { data: devEntry } = await (supabase as any)
      .from("developers")
      .select("id")
      .ilike("name", dev.company_name)
      .maybeSingle();

    const devTableId = devEntry?.id ?? null;

    // Build query: projects linked by developer_id (via developers table) OR by developer_name match
    const linkedQuery = devTableId
      ? supabase
          .from("presale_projects")
          .select("id, name, city, neighborhood, status, is_published, featured_image, developer_id, developer_name, view_count")
          .eq("developer_id", devTableId)
          .order("created_at", { ascending: false })
      : Promise.resolve({ data: [] });

    const [linkedResult, nameMatchedResult] = await Promise.all([
      linkedQuery,
      supabase
        .from("presale_projects")
        .select("id, name, city, neighborhood, status, is_published, featured_image, developer_id, developer_name, view_count")
        .ilike("developer_name", `%${dev.company_name}%`)
        .is("developer_id", null)
        .order("created_at", { ascending: false }),
    ]);

    const linked = (linkedResult as any).data || [];
    const nameMatched = (nameMatchedResult as any).data || [];
    const linkedIds = new Set(linked.map((p: any) => p.id));

    // Enrich with unit counts
    const enriched = async (projects: any[]): Promise<Project[]> => {
      if (!projects.length) return [];
      const ids = projects.map(p => p.id);
      const { data: unitData } = await (supabase as any)
        .from("listings")
        .select("project_id, status")
        .in("project_id", ids);
      const countMap: Record<string, number> = {};
      (unitData || []).forEach((u: any) => {
        countMap[u.project_id] = (countMap[u.project_id] || 0) + 1;
      });
      return projects.map(p => ({ ...p, _unitCount: countMap[p.id] || 0, _claimed: !!p.developer_id }));
    };

    const mine = await enriched(linked);
    const suggested = await enriched(nameMatched.filter((p: any) => !linkedIds.has(p.id)));

    setMyProjects(mine);
    setMatchedProjects(suggested);
  };

  const claimProject = async (projectId: string) => {
    if (!profile) return;
    setClaiming(projectId);

    // Find the developers table ID for this company
    const { data: devEntry } = await (supabase as any)
      .from("developers")
      .select("id")
      .ilike("name", profile.company_name)
      .maybeSingle();

    if (!devEntry) {
      toast.error("Could not find your company in our developer directory. Please contact support.");
      setClaiming(null);
      return;
    }

    const { error } = await supabase
      .from("presale_projects")
      .update({ developer_id: devEntry.id, developer_name: profile.company_name } as any)
      .eq("id", projectId);

    if (error) {
      toast.error("Failed to claim project. Please contact support.");
    } else {
      toast.success("Project linked to your account!");
      await loadProjects(profile);
    }
    setClaiming(null);
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    setSearching(true);
    const { data } = await supabase
      .from("presale_projects")
      .select("id, name, city, neighborhood, status, is_published, featured_image, developer_id, developer_name, view_count")
      .or(`name.ilike.%${searchQuery}%,developer_name.ilike.%${searchQuery}%,city.ilike.%${searchQuery}%`)
      .order("name")
      .limit(10);

    const myIds = new Set([...myProjects.map(p => p.id), ...matchedProjects.map(p => p.id)]);
    setSearchResults((data || []).filter(p => !myIds.has(p.id)).map(p => ({ ...p, _unitCount: 0, _claimed: !!p.developer_id })));
    setSearching(false);
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const ProjectCard = ({ project, showClaim = false }: { project: Project; showClaim?: boolean }) => (
    <Card className="overflow-hidden border border-border/60 hover:shadow-md transition-all group">
      <CardContent className="p-0">
        <div className="flex items-stretch gap-0">
          {/* Thumbnail */}
          <div className="w-24 shrink-0 bg-muted relative overflow-hidden">
            {project.featured_image ? (
              <img src={project.featured_image} alt={project.name} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <Building2 className="h-8 w-8 text-muted-foreground/30" />
              </div>
            )}
          </div>

          {/* Info */}
          <div className="flex-1 p-4 flex flex-col justify-between gap-2">
            <div className="flex items-start justify-between gap-2">
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="font-semibold text-foreground text-sm">{project.name}</h3>
                  {project._claimed && (
                    <span className="inline-flex items-center gap-1 text-[10px] bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded-full font-medium">
                      <CheckCircle2 className="h-2.5 w-2.5" /> Linked
                    </span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {[project.neighborhood, project.city].filter(Boolean).join(", ")}
                </p>
                {project.developer_name && (
                  <p className="text-[11px] text-muted-foreground/70 mt-0.5">{project.developer_name}</p>
                )}
              </div>
              <Badge variant="outline" className={`text-[10px] shrink-0 ${statusStyle[project.status] || "bg-slate-100 text-slate-600"}`}>
                {statusLabel[project.status] || project.status}
              </Badge>
            </div>

            <div className="flex items-center justify-between gap-2 flex-wrap">
              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Package className="h-3 w-3" />
                  {project._unitCount} unit{project._unitCount !== 1 ? "s" : ""}
                </span>
                <span className="flex items-center gap-1">
                  <Eye className="h-3 w-3" />
                  {(project.view_count || 0).toLocaleString()} views
                </span>
              </div>

              <div className="flex items-center gap-1.5 flex-wrap">
                {showClaim ? (
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-7 text-xs gap-1 border-primary/40 text-primary hover:bg-primary/10"
                    disabled={claiming === project.id}
                    onClick={() => claimProject(project.id)}
                  >
                    {claiming === project.id ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : (
                      <Link2 className="h-3 w-3" />
                    )}
                    Link to My Account
                  </Button>
                ) : (
                  <>
                    <Link to={`/developer/projects/${project.id}/inventory`}>
                      <Button size="sm" className="h-7 text-xs gap-1 bg-primary hover:bg-primary/90">
                        <Package className="h-3 w-3" />
                        Manage Inventory
                      </Button>
                    </Link>
                    {project.is_published && (
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-7 text-xs gap-1 text-muted-foreground hover:text-foreground"
                        onClick={() => window.open(`/presale-projects/${project.id}`, "_blank")}
                      >
                        <ExternalLink className="h-3 w-3" />
                      </Button>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <DeveloperPortalLayout>
      <div className="px-4 md:px-8 py-8 max-w-4xl mx-auto space-y-8">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Your Projects</h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              Manage inventory for your presale projects on PresaleProperties.ca
            </p>
          </div>
          <Link to="/developer/projects/new">
            <Button className="h-9 gap-1.5 font-semibold shadow-gold">
              <Plus className="h-4 w-4" />
              New Project
            </Button>
          </Link>
        </div>

        {/* My Linked Projects */}
        <section className="space-y-3">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
            <h2 className="text-sm font-semibold text-foreground">My Projects</h2>
            <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4">{myProjects.length}</Badge>
          </div>

          {myProjects.length === 0 ? (
            <Card className="border border-dashed border-border bg-muted/20">
              <CardContent className="py-10 text-center">
                <Building2 className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
                <p className="text-sm font-medium text-foreground mb-1">No linked projects yet</p>
                <p className="text-xs text-muted-foreground mb-4">
                  Projects on our site that match your company name are shown below — link them or create a new one.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-2">
              {myProjects.map(project => <ProjectCard key={project.id} project={project} />)}
            </div>
          )}
        </section>

        {/* Auto-matched by company name */}
        {matchedProjects.length > 0 && (
          <section className="space-y-3">
            <div className="flex items-center gap-2">
              <Link2 className="h-4 w-4 text-amber-500" />
              <h2 className="text-sm font-semibold text-foreground">Projects Matching Your Company</h2>
              <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4 border-amber-200 text-amber-700">
                {matchedProjects.length} found
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground -mt-1">
              We found these projects on our site that appear to belong to <strong>{profile?.company_name}</strong>. 
              Link them to your account to manage their inventory.
            </p>
            <div className="space-y-2">
              {matchedProjects.map(project => <ProjectCard key={project.id} project={project} showClaim />)}
            </div>
          </section>
        )}

        {/* Search for a project */}
        <section className="space-y-3">
          <div className="flex items-center gap-2">
            <Search className="h-4 w-4 text-muted-foreground" />
            <h2 className="text-sm font-semibold text-foreground">Find a Project</h2>
          </div>
          <p className="text-xs text-muted-foreground -mt-1">
            Can't find your project above? Search by name, developer, or city.
          </p>
          <div className="flex gap-2">
            <Input
              placeholder="Search project name, city or developer..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              onKeyDown={e => e.key === "Enter" && handleSearch()}
              className="h-9 text-sm"
            />
            <Button
              variant="outline"
              className="h-9 px-4 text-sm shrink-0"
              onClick={handleSearch}
              disabled={searching}
            >
              {searching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
            </Button>
          </div>

          {searchResults.length > 0 && (
            <div className="space-y-2">
              {searchResults.map(project => (
                <ProjectCard key={project.id} project={project} showClaim={!project.developer_id} />
              ))}
            </div>
          )}

          {searchResults.length === 0 && searchQuery && !searching && (
            <p className="text-xs text-muted-foreground py-4 text-center">
              No results. If your project isn't listed yet,{" "}
              <Link to="/developer/projects/new" className="text-primary hover:underline font-medium">create it here</Link>.
            </p>
          )}
        </section>

      </div>
    </DeveloperPortalLayout>
  );
}
