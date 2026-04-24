/**
 * CatalogueProjectsPanel
 * ─────────────────────────────────────────────────────────────────────────────
 * Search-and-pick UI for building a "project catalogue" email.
 * - Search up to 5 published presale projects
 * - Per-project CTA toggles (View Details, Floor Plans, Brochure, Pricing)
 * - Auto-fills all data (price, completion, hero, description, URLs)
 *
 * Used inside AdminAiEmailBuilder when layoutVersion === "catalogue".
 */

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Search, X, Loader2, Plus, GripVertical, Star, FileText, FileSpreadsheet, LayoutGrid, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";
import { generateProjectUrl } from "@/lib/seoUrls";
import type { CatalogueProject, CatalogueProjectCtaToggles } from "@/components/admin/campaign/buildCatalogueEmailHtml";

const MAX_PROJECTS = 5;
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
  deposit_percent: number | null;
  deposit_structure: string | null;
  completion_year: number | null;
  completion_month: number | null;
  occupancy_estimate: string | null;
  short_description: string | null;
  featured_image: string | null;
  gallery_images: string[] | null;
  floorplan_files: any[] | null;
  brochure_files: any[] | null;
  pricing_sheets: any[] | null;
  project_type: string;
}

function formatPrice(n: number | null, fallback: string | null): string {
  if (n && n > 0) return `$${Math.round(n).toLocaleString()}`;
  return fallback || "";
}

function formatCompletion(year: number | null, month: number | null, est: string | null): string {
  if (est) return est;
  if (year) {
    const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
    if (month && month >= 1 && month <= 12) return `${months[month - 1]} ${year}`;
    return String(year);
  }
  return "";
}

function formatDeposit(pct: number | null, struct: string | null): string {
  if (pct && pct > 0) return `${pct}%`;
  if (struct) {
    // Pull leading "X%" if present
    const m = struct.match(/(\d{1,2})\s*%/);
    if (m) return `${m[1]}%`;
  }
  return "";
}

function firstFileUrl(files: any): string | undefined {
  if (!Array.isArray(files) || files.length === 0) return undefined;
  const f = files[0];
  if (typeof f === "string") return f;
  if (f && typeof f === "object") return f.url || f.file_url || f.path || undefined;
  return undefined;
}

export function rawToCatalogueProject(raw: RawProject): CatalogueProject {
  const projectType = (raw.project_type || "condo") as any;
  const path = raw.neighborhood
    ? generateProjectUrl({ slug: raw.slug, neighborhood: raw.neighborhood, projectType })
    : `/presale-projects/${raw.slug}`;
  const projectUrl = `${SITE_BASE}${path}?utm_source=email&utm_medium=catalogue&utm_campaign=agent_send`;

  return {
    id: raw.id,
    projectName: raw.name,
    city: raw.city,
    neighborhood: raw.neighborhood || undefined,
    developerName: raw.developer_name || undefined,
    startingPrice: formatPrice(raw.starting_price, raw.price_range),
    deposit: formatDeposit(raw.deposit_percent, raw.deposit_structure),
    completion: formatCompletion(raw.completion_year, raw.completion_month, raw.occupancy_estimate),
    description: raw.short_description || undefined,
    featuredImage: raw.featured_image || raw.gallery_images?.[0] || undefined,
    projectUrl,
    floorPlansUrl: `${projectUrl}#floor-plans`,
    brochureUrl: firstFileUrl(raw.brochure_files),
    pricingUrl: firstFileUrl(raw.pricing_sheets),
    ctas: {
      showWebsite: true,
      showFloorPlans: false,
      showBrochure: !!firstFileUrl(raw.brochure_files),
      showPricing: !!firstFileUrl(raw.pricing_sheets),
    },
  };
}

interface CatalogueProjectsPanelProps {
  projects: CatalogueProject[];
  onChange: (projects: CatalogueProject[]) => void;
}

export function CatalogueProjectsPanel({ projects, onChange }: CatalogueProjectsPanelProps) {
  const [search, setSearch] = useState("");
  const [results, setResults] = useState<RawProject[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);

  // Search published projects (debounced)
  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      setLoading(true);
      let q = (supabase as any)
        .from("presale_projects")
        .select("id, name, slug, city, neighborhood, developer_name, starting_price, price_range, deposit_percent, deposit_structure, completion_year, completion_month, occupancy_estimate, short_description, featured_image, gallery_images, floorplan_files, brochure_files, pricing_sheets, project_type")
        .eq("is_published", true)
        .order("is_featured", { ascending: false })
        .order("name")
        .limit(20);
      if (search.trim()) {
        const s = `%${search.trim()}%`;
        q = q.or(`name.ilike.${s},city.ilike.${s},neighborhood.ilike.${s},developer_name.ilike.${s}`);
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

  const selectedIds = useMemo(() => new Set(projects.map((p) => p.id)), [projects]);

  const addProject = (raw: RawProject) => {
    if (projects.length >= MAX_PROJECTS) return;
    if (selectedIds.has(raw.id)) return;
    onChange([...projects, rawToCatalogueProject(raw)]);
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

  const updateCta = (id: string, key: keyof CatalogueProjectCtaToggles, value: boolean) => {
    onChange(
      projects.map((p) =>
        p.id === id ? { ...p, ctas: { ...(p.ctas || {}), [key]: value } } : p,
      ),
    );
  };

  const updateField = (id: string, field: keyof CatalogueProject, value: string) => {
    onChange(
      projects.map((p) => (p.id === id ? { ...p, [field]: value } : p)),
    );
  };

  return (
    <div className="space-y-3">
      {/* Selected projects list */}
      {projects.length > 0 && (
        <div className="space-y-2">
          {projects.map((p, idx) => (
            <div
              key={p.id}
              className={cn(
                "rounded-lg border bg-card overflow-hidden",
                idx === 0 && projects.length > 1 ? "border-warning/60 ring-1 ring-warning/30" : "border-border",
              )}
            >
              {/* Header */}
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
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {idx === 0 && projects.length > 1 && (
                      <Badge variant="outline" className="h-4 px-1.5 text-[8px] gap-0.5 border-warning/60 text-warning bg-warning-soft">
                        <Star className="h-2.5 w-2.5 fill-warning text-warning" />
                        FEATURED
                      </Badge>
                    )}
                    <p className="text-[12px] font-semibold text-foreground truncate">
                      {p.projectName}
                    </p>
                  </div>
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

              {/* Editable fields (compact) */}
              <div className="grid grid-cols-3 gap-1.5 p-2.5 border-b border-border">
                <div>
                  <Label className="text-[9px] text-muted-foreground uppercase tracking-wide">From</Label>
                  <Input
                    value={p.startingPrice || ""}
                    onChange={(e) => updateField(p.id, "startingPrice", e.target.value)}
                    className="h-6 text-[11px] mt-0.5"
                    placeholder="$649K"
                  />
                </div>
                <div>
                  <Label className="text-[9px] text-muted-foreground uppercase tracking-wide">Deposit</Label>
                  <Input
                    value={p.deposit || ""}
                    onChange={(e) => updateField(p.id, "deposit", e.target.value)}
                    className="h-6 text-[11px] mt-0.5"
                    placeholder="10%"
                  />
                </div>
                <div>
                  <Label className="text-[9px] text-muted-foreground uppercase tracking-wide">Completion</Label>
                  <Input
                    value={p.completion || ""}
                    onChange={(e) => updateField(p.id, "completion", e.target.value)}
                    className="h-6 text-[11px] mt-0.5"
                    placeholder="2027"
                  />
                </div>
              </div>

              {/* CTA toggles */}
              <div className="p-2.5 space-y-1.5">
                <Label className="text-[9px] text-muted-foreground uppercase tracking-wide font-bold">CTA Buttons</Label>

                <div className="flex items-center justify-between text-[11px]">
                  <span className="flex items-center gap-1.5 text-foreground">
                    <ExternalLink className="h-3 w-3 text-success" />
                    View Project Details
                    <span className="text-[8px] text-muted-foreground">(always on)</span>
                  </span>
                  <Switch checked disabled className="scale-75" />
                </div>

                <div className="flex items-center justify-between text-[11px]">
                  <span className="flex items-center gap-1.5 text-foreground">
                    <LayoutGrid className="h-3 w-3 text-info" />
                    Floor Plans
                  </span>
                  <Switch
                    checked={!!p.ctas?.showFloorPlans}
                    onCheckedChange={(v) => updateCta(p.id, "showFloorPlans", v)}
                    className="scale-75"
                  />
                </div>

                <div
                  className={cn(
                    "flex items-center justify-between text-[11px]",
                    !p.brochureUrl && "opacity-50",
                  )}
                >
                  <span className="flex items-center gap-1.5 text-foreground">
                    <FileText className="h-3 w-3 text-warning" />
                    Brochure {!p.brochureUrl && <span className="text-[8px] text-muted-foreground">(none uploaded)</span>}
                  </span>
                  <Switch
                    checked={!!p.ctas?.showBrochure && !!p.brochureUrl}
                    onCheckedChange={(v) => updateCta(p.id, "showBrochure", v)}
                    disabled={!p.brochureUrl}
                    className="scale-75"
                  />
                </div>

                <div
                  className={cn(
                    "flex items-center justify-between text-[11px]",
                    !p.pricingUrl && "opacity-50",
                  )}
                >
                  <span className="flex items-center gap-1.5 text-foreground">
                    <FileSpreadsheet className="h-3 w-3 text-primary" />
                    Pricing Sheet {!p.pricingUrl && <span className="text-[8px] text-muted-foreground">(none uploaded)</span>}
                  </span>
                  <Switch
                    checked={!!p.ctas?.showPricing && !!p.pricingUrl}
                    onCheckedChange={(v) => updateCta(p.id, "showPricing", v)}
                    disabled={!p.pricingUrl}
                    className="scale-75"
                  />
                </div>
              </div>
            </div>
          ))}
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
                        <p className="text-[11px] font-medium text-foreground truncate">{r.name}</p>
                        <p className="text-[9px] text-muted-foreground truncate">
                          {[r.neighborhood, r.city].filter(Boolean).join(" · ")}
                          {r.starting_price ? ` · From $${Math.round(r.starting_price).toLocaleString()}` : ""}
                        </p>
                      </div>
                      {already ? (
                        <span className="text-[9px] text-success font-medium shrink-0">Added</span>
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

      {projects.length > 0 && projects.length < 2 && (
        <p className="text-[10px] text-muted-foreground italic">
          Tip: Add 2–3 projects to unlock the "Featured Pick" treatment for the first card.
        </p>
      )}
    </div>
  );
}
