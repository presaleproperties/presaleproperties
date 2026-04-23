/**
 * HeroProjectsManager
 * ─────────────────────────────────────────────────────────────────────────
 * Admin widget — view & toggle which projects appear in the homepage Hero
 * Slider. Reads/writes `presale_projects.show_in_hero`. Used on the Admin
 * Overview dashboard and embeddable elsewhere.
 */
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Sparkles, ExternalLink, Building2, Eye, Plus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

interface HeroProject {
  id: string;
  name: string;
  slug: string;
  city: string;
  neighborhood: string | null;
  featured_image: string | null;
  show_in_hero: boolean;
  is_published: boolean;
  view_count: number | null;
}

const HERO_LIMIT = 8;

export function HeroProjectsManager({ compact = false }: { compact?: boolean }) {
  const { toast } = useToast();
  const [heroProjects, setHeroProjects] = useState<HeroProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [showCandidates, setShowCandidates] = useState(false);
  const [candidates, setCandidates] = useState<HeroProject[]>([]);

  useEffect(() => {
    fetchHero();
  }, []);

  const fetchHero = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("presale_projects")
      .select("id, name, slug, city, neighborhood, featured_image, show_in_hero, is_published, view_count")
      .eq("show_in_hero", true)
      .order("view_count", { ascending: false });

    if (!error) setHeroProjects((data || []) as HeroProject[]);
    setLoading(false);
  };

  const fetchCandidates = async () => {
    const { data } = await supabase
      .from("presale_projects")
      .select("id, name, slug, city, neighborhood, featured_image, show_in_hero, is_published, view_count")
      .eq("is_published", true)
      .eq("show_in_hero", false)
      .not("featured_image", "is", null)
      .order("view_count", { ascending: false })
      .limit(20);

    setCandidates((data || []) as HeroProject[]);
    setShowCandidates(true);
  };

  const toggleHero = async (project: HeroProject, next: boolean) => {
    setUpdatingId(project.id);
    const { error } = await supabase
      .from("presale_projects")
      .update({ show_in_hero: next })
      .eq("id", project.id);
    setUpdatingId(null);

    if (error) {
      toast({ title: "Update failed", description: error.message, variant: "destructive" });
      return;
    }

    toast({
      title: next ? "Added to Hero" : "Removed from Hero",
      description: `"${project.name}" ${next ? "now appears" : "no longer appears"} on the homepage hero.`,
    });

    // Refetch both lists so they stay consistent
    await fetchHero();
    if (showCandidates) await fetchCandidates();
  };

  const liveCount = heroProjects.filter(p => p.is_published).length;
  const overLimit = liveCount > HERO_LIMIT;

  return (
    <Card>
      <CardContent className={cn("space-y-4", compact ? "p-4" : "p-5")}>
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-2">
            <div className="rounded-lg bg-amber-100 p-1.5">
              <Sparkles className="h-4 w-4 text-amber-600" />
            </div>
            <div>
              <h3 className="text-sm font-semibold">Homepage Hero Slider</h3>
              <p className="text-xs text-muted-foreground">
                {liveCount} of up to {HERO_LIMIT} projects live on the homepage
              </p>
            </div>
          </div>
          <Button asChild size="sm" variant="ghost" className="h-7 text-xs">
            <Link to="/" target="_blank" rel="noopener noreferrer">
              <Eye className="mr-1 h-3 w-3" /> Preview
              <ExternalLink className="ml-1 h-3 w-3" />
            </Link>
          </Button>
        </div>

        {overLimit && (
          <div className="rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-xs text-amber-800">
            You have {liveCount} hero projects — only the top {HERO_LIMIT} by views will display.
          </div>
        )}

        {/* Hero list */}
        {loading ? (
          <div className="space-y-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        ) : heroProjects.length === 0 ? (
          <div className="rounded-lg border border-dashed border-muted-foreground/30 bg-muted/30 px-4 py-6 text-center">
            <Building2 className="mx-auto mb-2 h-6 w-6 text-muted-foreground" />
            <p className="text-sm font-medium">No projects pinned to hero</p>
            <p className="mb-3 text-xs text-muted-foreground">
              The slider will fall back to the most-viewed projects.
            </p>
            <Button size="sm" variant="outline" onClick={fetchCandidates}>
              <Plus className="mr-1 h-3 w-3" /> Pick projects
            </Button>
          </div>
        ) : (
          <div className="space-y-1.5">
            {heroProjects.map((p) => (
              <HeroRow
                key={p.id}
                project={p}
                checked={true}
                disabled={updatingId === p.id}
                onToggle={(v) => toggleHero(p, v)}
              />
            ))}
          </div>
        )}

        {/* Add more */}
        {!showCandidates && heroProjects.length > 0 && (
          <Button size="sm" variant="outline" onClick={fetchCandidates} className="w-full">
            <Plus className="mr-1.5 h-3.5 w-3.5" /> Add more projects
          </Button>
        )}

        {showCandidates && (
          <div className="space-y-2 border-t pt-3">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Top published projects
              </p>
              <Button size="sm" variant="ghost" className="h-6 text-xs" onClick={() => setShowCandidates(false)}>
                Hide
              </Button>
            </div>
            {candidates.length === 0 ? (
              <p className="py-2 text-center text-xs text-muted-foreground">
                All published projects with images are already in the hero.
              </p>
            ) : (
              <div className="space-y-1.5">
                {candidates.map((p) => (
                  <HeroRow
                    key={p.id}
                    project={p}
                    checked={false}
                    disabled={updatingId === p.id}
                    onToggle={(v) => toggleHero(p, v)}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

/* ── Row ─────────────────────────────────────────────────────────────── */
function HeroRow({
  project,
  checked,
  disabled,
  onToggle,
}: {
  project: HeroProject;
  checked: boolean;
  disabled: boolean;
  onToggle: (next: boolean) => void;
}) {
  return (
    <div
      className={cn(
        "flex items-center gap-3 rounded-lg border bg-card px-2.5 py-2 transition-colors",
        checked ? "border-amber-200 bg-amber-50/40" : "hover:bg-muted/40",
      )}
    >
      <div className="h-10 w-14 shrink-0 overflow-hidden rounded-md bg-muted">
        {project.featured_image ? (
          <img
            src={project.featured_image}
            alt={project.name}
            loading="lazy"
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </div>
        )}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          <p className="truncate text-sm font-medium">{project.name}</p>
          {!project.is_published && (
            <Badge variant="secondary" className="h-4 px-1 text-[10px]">
              Draft
            </Badge>
          )}
        </div>
        <p className="truncate text-[11px] text-muted-foreground">
          {project.neighborhood ? `${project.neighborhood}, ${project.city}` : project.city}
          {typeof project.view_count === "number" && project.view_count > 0 && (
            <span> · {project.view_count.toLocaleString()} views</span>
          )}
        </p>
      </div>
      <Switch checked={checked} disabled={disabled} onCheckedChange={onToggle} />
    </div>
  );
}
