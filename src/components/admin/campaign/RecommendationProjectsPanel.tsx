/**
 * RecommendationProjectsPanel
 * ─────────────────────────────────────────────────────────────────────────────
 * Search-and-pick UI for the "Recommendation" (Catalogue V2) email.
 *
 * Differences from CatalogueProjectsPanel:
 *  - Supports 2-8 projects (vs 1-5)
 *  - Each project tagged with a category: condo / townhome / detached
 *  - Toggle to group cards by category in the rendered email
 *  - Personalization context field (e.g. "based on your interest in Brentwood")
 */

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Search,
  X,
  Loader2,
  Plus,
  GripVertical,
  ExternalLink,
  Building2,
  Home,
  Trees,
  Layers,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { generateProjectUrl } from "@/lib/seoUrls";
import type {
  RecommendationProject,
  RecommendationCategory,
} from "@/components/admin/campaign/buildRecommendationEmailHtml";

const MIN_PROJECTS = 2;
const MAX_PROJECTS = 8;
const SITE_BASE = "https://presaleproperties.com";

interface RawProject {
  id: string;
  name: string;
  slug: string;
  city: string;
  neighborhood: string | null;
  developer_name: string | null;
  starting_price: number | null;
  price_range: string | null;
  completion_year: number | null;
  completion_month: number | null;
  occupancy_estimate: string | null;
  featured_image: string | null;
  gallery_images: string[] | null;
  project_type: string;
}

const CATEGORY_META: Record<
  RecommendationCategory,
  { label: string; icon: React.ComponentType<{ className?: string }>; color: string }
> = {
  condo: { label: "Condo", icon: Building2, color: "text-sky-500" },
  townhome: { label: "Townhome", icon: Home, color: "text-emerald-500" },
  detached: { label: "Detached", icon: Trees, color: "text-amber-500" },
};

function inferCategory(projectType: string | null): RecommendationCategory {
  const t = (projectType || "").toLowerCase();
  if (t.includes("town")) return "townhome";
  if (t.includes("single") || t.includes("detach") || t.includes("duplex"))
    return "detached";
  return "condo";
}

function formatPrice(n: number | null, fallback: string | null): string {
  if (n && n > 0) return `$${Math.round(n).toLocaleString()}`;
  return fallback || "";
}

function formatCompletion(
  year: number | null,
  month: number | null,
  est: string | null,
): string {
  if (est) return est;
  if (year) {
    const months = [
      "Jan","Feb","Mar","Apr","May","Jun",
      "Jul","Aug","Sep","Oct","Nov","Dec",
    ];
    if (month && month >= 1 && month <= 12) return `${months[month - 1]} ${year}`;
    return String(year);
  }
  return "";
}

function rawToRecommendation(raw: RawProject): RecommendationProject {
  const projectType = (raw.project_type || "condo") as any;
  const path = raw.neighborhood
    ? generateProjectUrl({
        slug: raw.slug,
        neighborhood: raw.neighborhood,
        projectType,
      })
    : `/presale-projects/${raw.slug}`;
  const projectUrl = `${SITE_BASE}${path}?utm_source=email&utm_medium=recommendation&utm_campaign=auto_recommend`;

  return {
    id: raw.id,
    category: inferCategory(raw.project_type),
    projectName: raw.name,
    city: raw.city,
    neighborhood: raw.neighborhood || undefined,
    developerName: raw.developer_name || undefined,
    startingPrice: formatPrice(raw.starting_price, raw.price_range),
    completion: formatCompletion(
      raw.completion_year,
      raw.completion_month,
      raw.occupancy_estimate,
    ),
    featuredImage: raw.featured_image || raw.gallery_images?.[0] || undefined,
    projectUrl,
  };
}

interface RecommendationProjectsPanelProps {
  projects: RecommendationProject[];
  onChange: (projects: RecommendationProject[]) => void;
  groupByCategory: boolean;
  onGroupByCategoryChange: (v: boolean) => void;
  personalizationContext: string;
  onPersonalizationContextChange: (v: string) => void;
}

export function RecommendationProjectsPanel({
  projects,
  onChange,
  groupByCategory,
  onGroupByCategoryChange,
  personalizationContext,
  onPersonalizationContextChange,
}: RecommendationProjectsPanelProps) {
  const [search, setSearch] = useState("");
  const [results, setResults] = useState<RawProject[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      setLoading(true);
      let q = (supabase as any)
        .from("presale_projects")
        .select(
          "id, name, slug, city, neighborhood, developer_name, starting_price, price_range, completion_year, completion_month, occupancy_estimate, featured_image, gallery_images, project_type",
        )
        .eq("is_published", true)
        .order("is_featured", { ascending: false })
        .order("name")
        .limit(20);
      if (search.trim()) {
        const s = `%${search.trim()}%`;
        q = q.or(
          `name.ilike.${s},city.ilike.${s},neighborhood.ilike.${s},developer_name.ilike.${s}`,
        );
      }
      const { data } = await q;
      if (!cancelled) {
        setResults((data || []) as RawProject[]);
        setLoading(false);
      }
    };
    const t = setTimeout(run, 200);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [search]);

  const selectedIds = useMemo(
    () => new Set(projects.map((p) => p.id)),
    [projects],
  );

  // Category counts for the summary chip row
  const categoryCounts = useMemo(() => {
    const counts: Record<RecommendationCategory, number> = {
      condo: 0,
      townhome: 0,
      detached: 0,
    };
    for (const p of projects) counts[p.category]++;
    return counts;
  }, [projects]);

  const addProject = (raw: RawProject) => {
    if (projects.length >= MAX_PROJECTS) return;
    if (selectedIds.has(raw.id)) return;
    onChange([...projects, rawToRecommendation(raw)]);
    setSearch("");
  };

  const removeProject = (id: string) => {
    onChange(projects.filter((p) => p.id !== id));
  };

  const moveProject = (id: string, dir: -1 | 1) => {
    const idx = projects.findIndex((p) => p.id === id);
    const next = idx + dir;
    if (idx < 0 || next < 0 || next >= projects.length) return;
    const out = [...projects];
    [out[idx], out[next]] = [out[next], out[idx]];
    onChange(out);
  };

  const updateCategory = (id: string, category: RecommendationCategory) => {
    onChange(
      projects.map((p) => (p.id === id ? { ...p, category } : p)),
    );
  };

  const belowMin = projects.length < MIN_PROJECTS;

  return (
    <div className="space-y-3">
      {/* Personalization context */}
      <div>
        <Label className="text-[9px] text-muted-foreground uppercase tracking-wide font-bold">
          Personalization Context
        </Label>
        <Input
          value={personalizationContext}
          onChange={(e) => onPersonalizationContextChange(e.target.value)}
          placeholder="e.g. based on your interest in Brentwood"
          className="h-7 text-[11px] mt-1"
        />
        <p className="text-[9px] text-muted-foreground mt-1 leading-snug">
          Shows in a gold pill above the hero. Optional.
        </p>
      </div>

      {/* Group by category toggle */}
      <div className="flex items-center justify-between rounded-lg border border-border bg-muted/20 px-3 py-2">
        <div className="flex items-center gap-2">
          <Layers className="h-3.5 w-3.5 text-amber-500" />
          <div>
            <p className="text-[11px] font-semibold text-foreground">
              Group by category
            </p>
            <p className="text-[9px] text-muted-foreground">
              Show "Condos" / "Townhomes" / "Detached" headers
            </p>
          </div>
        </div>
        <Switch
          checked={groupByCategory}
          onCheckedChange={onGroupByCategoryChange}
          className="scale-90"
        />
      </div>

      {/* Category summary chips */}
      {projects.length > 0 && (
        <div className="flex items-center gap-1.5 flex-wrap">
          {(Object.keys(CATEGORY_META) as RecommendationCategory[]).map((cat) => {
            const meta = CATEGORY_META[cat];
            const count = categoryCounts[cat];
            const Icon = meta.icon;
            return (
              <Badge
                key={cat}
                variant="outline"
                className={cn(
                  "h-5 gap-1 text-[9px] font-semibold",
                  count === 0 && "opacity-40",
                )}
              >
                <Icon className={cn("h-2.5 w-2.5", meta.color)} />
                {meta.label}: {count}
              </Badge>
            );
          })}
          <Badge
            variant={belowMin ? "destructive" : "secondary"}
            className="h-5 text-[9px] font-semibold ml-auto"
          >
            {projects.length} / {MAX_PROJECTS}
            {belowMin && " (min 2)"}
          </Badge>
        </div>
      )}

      {/* Selected projects list */}
      {projects.length > 0 && (
        <div className="space-y-2">
          {projects.map((p, idx) => {
            const meta = CATEGORY_META[p.category];
            const Icon = meta.icon;
            return (
              <div
                key={p.id}
                className="rounded-lg border border-border bg-card overflow-hidden"
              >
                <div className="flex items-start gap-2 p-2.5 bg-muted/30">
                  <div className="flex flex-col gap-0.5 pt-0.5">
                    <button
                      onClick={() => moveProject(p.id, -1)}
                      disabled={idx === 0}
                      className="text-muted-foreground hover:text-foreground disabled:opacity-30"
                      title="Move up"
                    >
                      <GripVertical className="h-3 w-3" />
                    </button>
                  </div>
                  {p.featuredImage && (
                    <img
                      src={p.featuredImage}
                      alt={p.projectName}
                      className="h-10 w-14 rounded object-cover shrink-0 border border-border"
                    />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-[12px] font-semibold text-foreground truncate">
                      {p.projectName}
                    </p>
                    <p className="text-[10px] text-muted-foreground truncate">
                      {[p.neighborhood, p.city].filter(Boolean).join(" · ")}
                      {p.startingPrice && ` · From ${p.startingPrice}`}
                    </p>
                  </div>
                  <div className="flex items-center gap-0.5">
                    <a
                      href={p.projectUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="h-6 w-6 inline-flex items-center justify-center rounded hover:bg-muted text-muted-foreground hover:text-foreground"
                      title="Open project page"
                    >
                      <ExternalLink className="h-3 w-3" />
                    </a>
                    <button
                      onClick={() => removeProject(p.id)}
                      className="h-6 w-6 inline-flex items-center justify-center rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive"
                      title="Remove"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                </div>

                {/* Category picker */}
                <div className="px-2.5 py-2 flex items-center gap-1.5 border-t border-border">
                  <Icon className={cn("h-3 w-3", meta.color)} />
                  <Label className="text-[9px] text-muted-foreground uppercase tracking-wide font-bold mr-1">
                    Category
                  </Label>
                  <div className="flex gap-1 flex-1">
                    {(Object.keys(CATEGORY_META) as RecommendationCategory[]).map(
                      (cat) => {
                        const m = CATEGORY_META[cat];
                        const active = p.category === cat;
                        return (
                          <button
                            key={cat}
                            onClick={() => updateCategory(p.id, cat)}
                            className={cn(
                              "flex-1 px-2 py-1 rounded text-[10px] font-semibold border transition-colors",
                              active
                                ? "border-primary bg-primary/10 text-foreground"
                                : "border-border bg-background text-muted-foreground hover:border-primary/50",
                            )}
                          >
                            {m.label}
                          </button>
                        );
                      },
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add project search */}
      {projects.length < MAX_PROJECTS && (
        <div className="space-y-2 rounded-lg border border-dashed border-border p-2.5 bg-muted/10">
          <Label className="text-[10px] text-muted-foreground uppercase tracking-wide font-bold">
            Add Project ({projects.length}/{MAX_PROJECTS})
          </Label>
          <div className="relative">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setOpen(true);
              }}
              onFocus={() => setOpen(true)}
              placeholder="Search by name, city, neighborhood…"
              className="h-7 text-[11px] pl-7"
            />
          </div>
          {open && (
            <div className="max-h-64 overflow-y-auto rounded border border-border bg-popover divide-y divide-border">
              {loading && (
                <div className="flex items-center justify-center py-3 text-[10px] text-muted-foreground">
                  <Loader2 className="h-3 w-3 animate-spin mr-1.5" />
                  Searching…
                </div>
              )}
              {!loading && results.length === 0 && (
                <div className="py-3 text-center text-[10px] text-muted-foreground">
                  No projects found
                </div>
              )}
              {!loading &&
                results.map((r) => {
                  const already = selectedIds.has(r.id);
                  return (
                    <button
                      key={r.id}
                      onClick={() => addProject(r)}
                      disabled={already}
                      className={cn(
                        "w-full flex items-center gap-2 px-2 py-1.5 text-left hover:bg-muted/50 transition-colors",
                        already && "opacity-40 cursor-not-allowed",
                      )}
                    >
                      {r.featured_image ? (
                        <img
                          src={r.featured_image}
                          alt={r.name}
                          className="h-7 w-9 rounded object-cover shrink-0"
                        />
                      ) : (
                        <div className="h-7 w-9 rounded bg-muted shrink-0" />
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-[11px] font-medium text-foreground truncate">
                          {r.name}
                        </p>
                        <p className="text-[9px] text-muted-foreground truncate">
                          {[r.neighborhood, r.city].filter(Boolean).join(" · ")}
                          {r.starting_price
                            ? ` · From $${Math.round(r.starting_price).toLocaleString()}`
                            : ""}
                        </p>
                      </div>
                      {already ? (
                        <span className="text-[9px] text-emerald-600 font-medium shrink-0">
                          Added
                        </span>
                      ) : (
                        <Plus className="h-3 w-3 text-muted-foreground shrink-0" />
                      )}
                    </button>
                  );
                })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
