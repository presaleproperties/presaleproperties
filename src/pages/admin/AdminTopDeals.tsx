import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  ArrowLeft,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  Eye,
  EyeOff,
  Upload,
  X,
  Loader2,
  Maximize2,
  Minimize2,
  Building2,
  MapPin,
  Calendar,
  DollarSign,
  Home,
  Layers,
  CheckCircle2,
  Search,
  Sparkles,
  RotateCcw,
} from "lucide-react";
import { MortgageCalculator } from "@/components/listings/MortgageCalculator";
import { toast } from "sonner";

// ── Types ──────────────────────────────────────────────────────────
interface Project {
  id: string;
  name: string;
  city: string;
  neighborhood: string | null;
  developer_name: string | null;
  starting_price: number | null;
  completion_year: number | null;
  deposit_structure: string | null;
  short_description: string | null;
  gallery_images: string[] | null;
  featured_image: string | null;
  address: string | null;
  map_lat: number | null;
  map_lng: number | null;
  status: string | null;
  project_type: string | null;
}

interface FloorPlan {
  file: File;
  preview: string;
  scanning: boolean;
  metrics: {
    planName?: string;
    unitType?: string;
    interiorSqft?: number | null;
    balconySqft?: number | null;
  } | null;
}

interface PrivacyToggles {
  showProjectName: boolean;
  showDeveloper: boolean;
  showExactAddress: boolean;
}

const SLIDES = ["intro", "gallery", "highlights", "floorplans", "calculator"] as const;
type Slide = typeof SLIDES[number];

const SLIDE_LABELS: Record<Slide, string> = {
  intro: "Overview",
  gallery: "Gallery",
  highlights: "Key Details",
  floorplans: "Floor Plans",
  calculator: "The Numbers",
};

// ── Mortgage Calculator defaults ──────────────────────────────────
const DEFAULT_PRICE = 850000;

// ── Helpers ────────────────────────────────────────────────────────
function formatCurrency(n: number | null | undefined) {
  if (!n) return "—";
  return new Intl.NumberFormat("en-CA", { style: "currency", currency: "CAD", maximumFractionDigits: 0 }).format(n);
}

function getPhotos(p: Project): string[] {
  const all: string[] = [];
  if (p.featured_image) all.push(p.featured_image);
  if (p.gallery_images?.length) all.push(...p.gallery_images);
  const unique = Array.from(new Set(all)).filter(Boolean);
  return unique.length ? unique : [];
}

// ══════════════════════════════════════════════════════════════════
export default function AdminTopDeals() {
  const navigate = useNavigate();

  // Project selection
  const [projects, setProjects] = useState<Project[]>([]);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Project | null>(null);
  const [loadingProjects, setLoadingProjects] = useState(true);

  // Privacy toggles
  const [privacy, setPrivacy] = useState<PrivacyToggles>({
    showProjectName: true,
    showDeveloper: true,
    showExactAddress: false,
  });

  // Slide navigation
  const [slide, setSlide] = useState<Slide>("intro");
  const [fullscreen, setFullscreen] = useState(false);
  const presenterRef = useRef<HTMLDivElement>(null);

  // Gallery
  const [photoIndex, setPhotoIndex] = useState(0);

  // Floor plans
  const [floorPlans, setFloorPlans] = useState<FloorPlan[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ── Load projects ────────────────────────────────────────────────
  useEffect(() => {
    (async () => {
      setLoadingProjects(true);
      const { data } = await (supabase as any)
        .from("presale_projects")
        .select("id,name,city,neighborhood,developer_name,starting_price,completion_year,deposit_structure,short_description,gallery_images,featured_image,address,map_lat,map_lng,status,project_type")
        .order("name");
      setProjects(data || []);
      setLoadingProjects(false);
    })();
  }, []);

  // ── Fullscreen ───────────────────────────────────────────────────
  const toggleFullscreen = useCallback(async () => {
    if (!document.fullscreenElement) {
      await presenterRef.current?.requestFullscreen?.();
      setFullscreen(true);
    } else {
      await document.exitFullscreen();
      setFullscreen(false);
    }
  }, []);

  useEffect(() => {
    const handler = () => setFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", handler);
    return () => document.removeEventListener("fullscreenchange", handler);
  }, []);

  // ── Keyboard nav ─────────────────────────────────────────────────
  useEffect(() => {
    if (!selected) return;
    const handler = (e: KeyboardEvent) => {
      const idx = SLIDES.indexOf(slide);
      if (e.key === "ArrowRight" || e.key === "ArrowDown") {
        if (idx < SLIDES.length - 1) setSlide(SLIDES[idx + 1]);
      }
      if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
        if (idx > 0) setSlide(SLIDES[idx - 1]);
      }
      if (e.key === "Escape" && fullscreen) document.exitFullscreen();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [slide, selected, fullscreen]);

  // ── Floor plan upload + AI scan ───────────────────────────────────
  const handleFloorPlanUpload = async (files: FileList | null) => {
    if (!files) return;
    const newPlans: FloorPlan[] = [];
    for (let i = 0; i < Math.min(files.length, 2 - floorPlans.length); i++) {
      const file = files[i];
      const preview = URL.createObjectURL(file);
      newPlans.push({ file, preview, scanning: true, metrics: null });
    }
    setFloorPlans((prev) => [...prev, ...newPlans]);

    // Upload each to storage and scan with AI
    for (let i = 0; i < newPlans.length; i++) {
      const plan = newPlans[i];
      const planIndex = floorPlans.length + i;
      try {
        // Upload to storage
        const path = `floorplans/${Date.now()}-${plan.file.name}`;
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from("listing-files")
          .upload(path, plan.file, { upsert: true });

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage.from("listing-files").getPublicUrl(path);

        // Call AI extraction
        const { data: fnData, error: fnError } = await supabase.functions.invoke("extract-floorplan-data", {
          body: { imageUrl: publicUrl },
        });

        if (fnError) throw fnError;

        setFloorPlans((prev) => {
          const updated = [...prev];
          updated[planIndex] = { ...updated[planIndex], scanning: false, metrics: fnData };
          return updated;
        });
        toast.success("Floor plan scanned successfully");
      } catch (err) {
        console.error(err);
        setFloorPlans((prev) => {
          const updated = [...prev];
          updated[planIndex] = { ...updated[planIndex], scanning: false, metrics: {} };
          return updated;
        });
        toast.error("Could not scan floor plan — metrics unavailable");
      }
    }
  };

  const removeFloorPlan = (idx: number) => {
    setFloorPlans((prev) => {
      const updated = [...prev];
      URL.revokeObjectURL(updated[idx].preview);
      updated.splice(idx, 1);
      return updated;
    });
  };

  // ── Derived ───────────────────────────────────────────────────────
  const photos = selected ? getPhotos(selected) : [];
  const currentSlideIdx = SLIDES.indexOf(slide);
  const filteredProjects = projects.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.city.toLowerCase().includes(search.toLowerCase())
  );

  const priceForCalc = selected?.starting_price ?? DEFAULT_PRICE;

  // ── Reset when project changes ────────────────────────────────────
  const selectProject = (p: Project) => {
    setSelected(p);
    setSlide("intro");
    setPhotoIndex(0);
    setFloorPlans([]);
  };

  // ════════════════════════════════════════════════════════════════
  // SETUP PANEL (no project selected)
  // ════════════════════════════════════════════════════════════════
  if (!selected) {
    return (
      <AdminLayout>
        <div className="min-h-screen bg-background p-6 md:p-10">
          {/* Header */}
          <div className="max-w-3xl mx-auto">
            <div className="flex items-center gap-3 mb-8">
              <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={() => navigate("/admin")}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <div>
                <h1 className="text-2xl font-bold tracking-tight text-foreground">Top Deals Presenter</h1>
                <p className="text-sm text-muted-foreground mt-0.5">Build a pitch deck for investor calls & screen recordings</p>
              </div>
            </div>

            {/* Search */}
            <div className="relative mb-5">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search projects by name or city…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full h-11 pl-10 pr-4 rounded-xl border border-border bg-card text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all"
              />
            </div>

            {/* Project grid */}
            {loadingProjects ? (
              <div className="flex justify-center py-16">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {filteredProjects.map((p) => {
                  const thumb = p.featured_image || p.gallery_images?.[0];
                  return (
                    <button
                      key={p.id}
                      onClick={() => selectProject(p)}
                      className="group flex items-center gap-4 p-4 rounded-xl border border-border bg-card hover:border-primary/40 hover:shadow-md transition-all text-left"
                    >
                      <div className="h-14 w-14 rounded-lg overflow-hidden shrink-0 bg-muted">
                        {thumb ? (
                          <img src={thumb} alt={p.name} className="h-full w-full object-cover" />
                        ) : (
                          <div className="h-full w-full flex items-center justify-center">
                            <Building2 className="h-6 w-6 text-muted-foreground/40" />
                          </div>
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold text-sm truncate text-foreground">{p.name}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">{p.city}{p.neighborhood ? ` · ${p.neighborhood}` : ""}</p>
                        {p.starting_price && (
                          <p className="text-xs font-medium text-primary mt-1">
                            From {formatCurrency(p.starting_price)}
                          </p>
                        )}
                      </div>
                      <ChevronRight className="h-4 w-4 text-muted-foreground/40 group-hover:text-primary transition-colors shrink-0" />
                    </button>
                  );
                })}
              </div>
            )}

            {!loadingProjects && filteredProjects.length === 0 && (
              <div className="text-center py-16 text-muted-foreground text-sm">No projects found</div>
            )}
          </div>
        </div>
      </AdminLayout>
    );
  }

  // ════════════════════════════════════════════════════════════════
  // PRESENTER MODE (project selected)
  // ════════════════════════════════════════════════════════════════
  const displayName = privacy.showProjectName ? selected.name : "Confidential Project";
  const displayDev = privacy.showDeveloper ? selected.developer_name : null;
  const displayAddr = privacy.showExactAddress ? selected.address : `${selected.neighborhood || selected.city}, BC`;

  return (
    <div
      ref={presenterRef}
      className={cn(
        "flex flex-col bg-background",
        fullscreen ? "fixed inset-0 z-[9999]" : "min-h-screen"
      )}
    >
      {/* ── TOP BAR ─────────────────────────────────────────────── */}
      <div className="flex items-center justify-between gap-4 px-5 py-3 border-b border-border/60 bg-card/80 backdrop-blur-sm shrink-0">
        {/* Left: back + project name */}
        <div className="flex items-center gap-3 min-w-0">
          <button
            onClick={() => { setSelected(null); setFloorPlans([]); }}
            className="h-8 w-8 rounded-lg border border-border flex items-center justify-center hover:bg-muted transition-colors shrink-0"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <div className="min-w-0">
            <p className="font-bold text-sm truncate text-foreground">{displayName}</p>
            <p className="text-[11px] text-muted-foreground truncate">{selected.city}</p>
          </div>
        </div>

        {/* Center: slide tabs */}
        <div className="hidden md:flex items-center gap-1 bg-muted/50 rounded-xl p-1">
          {SLIDES.map((s, i) => (
            <button
              key={s}
              onClick={() => setSlide(s)}
              className={cn(
                "px-3 py-1.5 rounded-lg text-[11px] font-medium transition-all",
                slide === s
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <span className="mr-1.5 text-muted-foreground/50">{i + 1}</span>
              {SLIDE_LABELS[s]}
            </button>
          ))}
        </div>

        {/* Right: controls */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Privacy toggles */}
          <div className="hidden lg:flex items-center gap-1 border border-border rounded-xl p-1">
            <ToggleChip
              label="Name"
              active={privacy.showProjectName}
              onClick={() => setPrivacy((v) => ({ ...v, showProjectName: !v.showProjectName }))}
            />
            <ToggleChip
              label="Developer"
              active={privacy.showDeveloper}
              onClick={() => setPrivacy((v) => ({ ...v, showDeveloper: !v.showDeveloper }))}
            />
            <ToggleChip
              label="Address"
              active={privacy.showExactAddress}
              onClick={() => setPrivacy((v) => ({ ...v, showExactAddress: !v.showExactAddress }))}
            />
          </div>

          <button
            onClick={toggleFullscreen}
            className="h-8 w-8 rounded-lg border border-border flex items-center justify-center hover:bg-muted transition-colors"
            title={fullscreen ? "Exit fullscreen (Esc)" : "Fullscreen"}
          >
            {fullscreen ? <Minimize2 className="h-3.5 w-3.5" /> : <Maximize2 className="h-3.5 w-3.5" />}
          </button>
        </div>
      </div>

      {/* ── SLIDE AREA ──────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-5xl mx-auto px-4 md:px-8 py-8">

          {/* ── SLIDE 1: INTRO ──────────────────────────────────── */}
          {slide === "intro" && (
            <div className="animate-fade-in">
              <div className="grid md:grid-cols-2 gap-8 items-start">
                {/* Hero image */}
                <div className="relative rounded-2xl overflow-hidden aspect-[4/3] bg-muted">
                  {photos[0] ? (
                    <img src={photos[0]} alt={displayName} className="h-full w-full object-cover" />
                  ) : (
                    <div className="h-full w-full flex items-center justify-center">
                      <Building2 className="h-16 w-16 text-muted-foreground/20" />
                    </div>
                  )}
                  {selected.status && (
                    <div className="absolute top-3 left-3">
                      <Badge variant="secondary" className="text-[10px] font-semibold bg-background/80 backdrop-blur-sm">
                        {selected.status}
                      </Badge>
                    </div>
                  )}
                </div>

                {/* Overview */}
                <div className="space-y-6">
                  <div>
                    <h2 className="text-3xl font-bold tracking-tight text-foreground">{displayName}</h2>
                    {displayDev && (
                      <p className="text-sm text-muted-foreground mt-1">by {displayDev}</p>
                    )}
                    <div className="flex items-center gap-1.5 mt-2 text-sm text-muted-foreground">
                      <MapPin className="h-3.5 w-3.5 shrink-0" />
                      <span>{displayAddr}</span>
                    </div>
                  </div>

                  {/* Quick stats */}
                  <div className="grid grid-cols-2 gap-3">
                    <StatCard
                      icon={<DollarSign className="h-4 w-4" />}
                      label="Starting From"
                      value={formatCurrency(selected.min_price)}
                      accent
                    />
                    {selected.max_price && (
                      <StatCard
                        icon={<DollarSign className="h-4 w-4" />}
                        label="Up To"
                        value={formatCurrency(selected.max_price)}
                      />
                    )}
                    {selected.estimated_completion && (
                      <StatCard
                        icon={<Calendar className="h-4 w-4" />}
                        label="Est. Completion"
                        value={selected.estimated_completion}
                      />
                    )}
                    {selected.deposit_structure && (
                      <StatCard
                        icon={<Layers className="h-4 w-4" />}
                        label="Deposit"
                        value={selected.deposit_structure}
                      />
                    )}
                  </div>

                  {selected.description && (
                    <p className="text-sm text-muted-foreground leading-relaxed line-clamp-4">
                      {selected.description}
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ── SLIDE 2: GALLERY ────────────────────────────────── */}
          {slide === "gallery" && (
            <div className="animate-fade-in">
              {photos.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-24 text-muted-foreground gap-3">
                  <Home className="h-12 w-12 opacity-20" />
                  <p className="text-sm">No photos available for this project</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Main image */}
                  <div className="relative rounded-2xl overflow-hidden bg-muted" style={{ aspectRatio: "16/9" }}>
                    <img
                      key={photoIndex}
                      src={photos[photoIndex]}
                      alt={`${displayName} – ${photoIndex + 1}`}
                      className="h-full w-full object-cover animate-fade-in"
                    />
                    {/* Nav arrows */}
                    {photos.length > 1 && (
                      <>
                        <button
                          onClick={() => setPhotoIndex((i) => (i - 1 + photos.length) % photos.length)}
                          className="absolute left-3 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full bg-background/80 backdrop-blur-sm border border-border flex items-center justify-center hover:bg-background transition-colors"
                        >
                          <ArrowLeft className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => setPhotoIndex((i) => (i + 1) % photos.length)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full bg-background/80 backdrop-blur-sm border border-border flex items-center justify-center hover:bg-background transition-colors"
                        >
                          <ArrowRight className="h-4 w-4" />
                        </button>
                        <div className="absolute bottom-3 right-3 bg-background/70 backdrop-blur-sm rounded-full px-3 py-1 text-xs font-medium">
                          {photoIndex + 1} / {photos.length}
                        </div>
                      </>
                    )}
                  </div>

                  {/* Thumbnails */}
                  {photos.length > 1 && (
                    <div className="flex gap-2 overflow-x-auto pb-1">
                      {photos.map((url, i) => (
                        <button
                          key={i}
                          onClick={() => setPhotoIndex(i)}
                          className={cn(
                            "shrink-0 h-16 w-24 rounded-lg overflow-hidden border-2 transition-all",
                            i === photoIndex ? "border-primary" : "border-transparent opacity-60 hover:opacity-100"
                          )}
                        >
                          <img src={url} alt="" className="h-full w-full object-cover" />
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* ── SLIDE 3: HIGHLIGHTS ─────────────────────────────── */}
          {slide === "highlights" && (
            <div className="animate-fade-in">
              <h2 className="text-2xl font-bold mb-6 text-foreground">Key Details</h2>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <HighlightCard icon={<DollarSign />} label="Price Range" value={
                  selected.min_price && selected.max_price
                    ? `${formatCurrency(selected.min_price)} – ${formatCurrency(selected.max_price)}`
                    : formatCurrency(selected.min_price)
                } />
                <HighlightCard icon={<Layers />} label="Deposit Structure" value={selected.deposit_structure || "Contact for details"} />
                <HighlightCard icon={<Calendar />} label="Est. Completion" value={selected.estimated_completion || "TBD"} />
                <HighlightCard icon={<MapPin />} label="Location" value={displayAddr || "—"} />
                {displayDev && (
                  <HighlightCard icon={<Building2 />} label="Developer" value={displayDev} />
                )}
                {selected.city && (
                  <HighlightCard icon={<Home />} label="City" value={selected.city} />
                )}
              </div>

              {/* Price per sqft from floor plans */}
              {floorPlans.some((fp) => fp.metrics?.interiorSqft && selected.min_price) && (
                <div className="mt-6">
                  <h3 className="text-sm font-semibold text-foreground mb-3">Price Per Sqft (from floor plans)</h3>
                  <div className="flex flex-wrap gap-3">
                    {floorPlans.map((fp, i) =>
                      fp.metrics?.interiorSqft && selected.min_price ? (
                        <div key={i} className="px-4 py-2.5 rounded-xl border border-border bg-card text-sm">
                          <span className="text-muted-foreground">{fp.metrics.planName || `Plan ${i + 1}`} — </span>
                          <span className="font-semibold text-primary">
                            {formatCurrency(Math.round(selected.min_price / fp.metrics.interiorSqft))}/sqft
                          </span>
                        </div>
                      ) : null
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── SLIDE 4: FLOOR PLANS ────────────────────────────── */}
          {slide === "floorplans" && (
            <div className="animate-fade-in">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-foreground">Floor Plans</h2>
                {floorPlans.length < 2 && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-2"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Upload className="h-3.5 w-3.5" />
                    Upload {floorPlans.length === 0 ? "Floor Plans" : "Another"}
                  </Button>
                )}
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*,.pdf"
                multiple
                className="hidden"
                onChange={(e) => handleFloorPlanUpload(e.target.files)}
              />

              {floorPlans.length === 0 ? (
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full border-2 border-dashed border-border rounded-2xl p-12 flex flex-col items-center gap-3 hover:border-primary/40 hover:bg-muted/30 transition-all group"
                >
                  <Upload className="h-8 w-8 text-muted-foreground/40 group-hover:text-primary/60 transition-colors" />
                  <div className="text-center">
                    <p className="font-medium text-sm text-foreground">Upload floor plans (up to 2)</p>
                    <p className="text-xs text-muted-foreground mt-1">AI will auto-extract size, type, and sqft</p>
                  </div>
                </button>
              ) : (
                <div className={cn("grid gap-6", floorPlans.length === 2 ? "md:grid-cols-2" : "")}>
                  {floorPlans.map((fp, i) => (
                    <div key={i} className="relative rounded-2xl border border-border bg-card overflow-hidden">
                      {/* Remove button */}
                      <button
                        onClick={() => removeFloorPlan(i)}
                        className="absolute top-3 right-3 z-10 h-7 w-7 rounded-full bg-background/80 backdrop-blur-sm border border-border flex items-center justify-center hover:bg-destructive/10 hover:border-destructive/30 transition-colors"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>

                      {/* Image */}
                      <div className="relative bg-muted" style={{ aspectRatio: "4/3" }}>
                        <img src={fp.preview} alt="Floor plan" className="h-full w-full object-contain" />
                        {fp.scanning && (
                          <div className="absolute inset-0 bg-background/70 backdrop-blur-sm flex flex-col items-center justify-center gap-2">
                            <Sparkles className="h-6 w-6 text-primary animate-pulse" />
                            <p className="text-sm font-medium">AI scanning…</p>
                          </div>
                        )}
                      </div>

                      {/* Metrics */}
                      <div className="p-4">
                        {fp.scanning ? (
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            Extracting metrics…
                          </div>
                        ) : fp.metrics && Object.keys(fp.metrics).length > 0 ? (
                          <div className="space-y-2">
                            {fp.metrics.planName && (
                              <p className="font-semibold text-foreground">{fp.metrics.planName}</p>
                            )}
                            <div className="flex flex-wrap gap-2">
                              {fp.metrics.unitType && (
                                <MetricPill label="Type" value={fp.metrics.unitType} />
                              )}
                              {fp.metrics.interiorSqft && (
                                <MetricPill label="Interior" value={`${fp.metrics.interiorSqft} sqft`} accent />
                              )}
                              {fp.metrics.balconySqft && (
                                <MetricPill label="Outdoor" value={`${fp.metrics.balconySqft} sqft`} />
                              )}
                              {fp.metrics.interiorSqft && selected.min_price && (
                                <MetricPill
                                  label="$/sqft"
                                  value={formatCurrency(Math.round(selected.min_price / fp.metrics.interiorSqft))}
                                  accent
                                />
                              )}
                            </div>
                            <div className="flex items-center gap-1.5 text-[11px] text-primary mt-1">
                              <CheckCircle2 className="h-3 w-3" />
                              AI extracted
                            </div>
                          </div>
                        ) : (
                          <p className="text-xs text-muted-foreground italic">Could not extract metrics automatically</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ── SLIDE 5: CALCULATOR ─────────────────────────────── */}
          {slide === "calculator" && (
            <div className="animate-fade-in">
              <h2 className="text-2xl font-bold mb-2 text-foreground">The Numbers</h2>
              <p className="text-sm text-muted-foreground mb-6">
                Estimates based on {formatCurrency(priceForCalc)} — adjust the sliders to model different scenarios
              </p>
              <div className="max-w-md">
                <MortgageCalculator
                  price={priceForCalc}
                  taxAnnualAmount={null}
                  associationFee={null}
                  livingArea={floorPlans[0]?.metrics?.interiorSqft ?? null}
                />
              </div>
            </div>
          )}

        </div>
      </div>

      {/* ── BOTTOM NAV ──────────────────────────────────────────── */}
      <div className="shrink-0 border-t border-border/60 bg-card/80 backdrop-blur-sm px-5 py-3">
        <div className="max-w-5xl mx-auto flex items-center justify-between gap-4">
          {/* Progress dots */}
          <div className="flex items-center gap-1.5">
            {SLIDES.map((s, i) => (
              <button
                key={s}
                onClick={() => setSlide(s)}
                className={cn(
                  "rounded-full transition-all duration-200",
                  slide === s
                    ? "h-2 w-6 bg-primary"
                    : "h-2 w-2 bg-muted-foreground/30 hover:bg-muted-foreground/60"
                )}
              />
            ))}
          </div>

          {/* Mobile slide label */}
          <span className="md:hidden text-xs font-medium text-muted-foreground">
            {currentSlideIdx + 1}/{SLIDES.length} · {SLIDE_LABELS[slide]}
          </span>

          {/* Prev / Next */}
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={currentSlideIdx === 0}
              onClick={() => setSlide(SLIDES[currentSlideIdx - 1])}
              className="gap-1.5"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Back
            </Button>
            <Button
              size="sm"
              disabled={currentSlideIdx === SLIDES.length - 1}
              onClick={() => setSlide(SLIDES[currentSlideIdx + 1])}
              className="gap-1.5"
            >
              Next
              <ArrowRight className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Small reusable components ──────────────────────────────────────

function ToggleChip({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-medium transition-all",
        active ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground hover:bg-muted"
      )}
    >
      {active ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />}
      {label}
    </button>
  );
}

function StatCard({ icon, label, value, accent }: { icon: React.ReactNode; label: string; value: string; accent?: boolean }) {
  return (
    <div className="flex items-start gap-3 p-3.5 rounded-xl border border-border bg-card">
      <div className={cn("h-7 w-7 rounded-lg flex items-center justify-center shrink-0", accent ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground")}>
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-[10px] text-muted-foreground uppercase tracking-wide">{label}</p>
        <p className={cn("text-sm font-semibold truncate mt-0.5", accent ? "text-primary" : "text-foreground")}>{value}</p>
      </div>
    </div>
  );
}

function HighlightCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="p-5 rounded-2xl border border-border bg-card hover:border-primary/20 transition-colors">
      <div className="h-9 w-9 rounded-xl bg-primary/10 flex items-center justify-center text-primary mb-3">
        {icon}
      </div>
      <p className="text-[11px] uppercase tracking-widest text-muted-foreground font-medium mb-1">{label}</p>
      <p className="text-base font-semibold text-foreground">{value}</p>
    </div>
  );
}

function MetricPill({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className={cn(
      "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border",
      accent ? "bg-primary/8 text-primary border-primary/20" : "bg-muted text-muted-foreground border-transparent"
    )}>
      <span className="opacity-60">{label}</span>
      <span>{value}</span>
    </div>
  );
}
