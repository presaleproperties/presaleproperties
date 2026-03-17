import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { cn } from "@/lib/utils";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
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
  Search,
  Sparkles,
  CheckCircle2,
  Calculator,
} from "lucide-react";
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
  publicUrl: string | null;
  scanning: boolean;
  metrics: {
    planName?: string | null;
    unitType?: string | null;
    interiorSqft?: number | null;
    balconySqft?: number | null;
    unit_number?: string | null;
    unit_type?: string | null;
    beds?: number | null;
    baths?: number | null;
    interior_sqft?: number | null;
    exterior_sqft?: number | null;
    floor_plan_name?: string | null;
  } | null;
  customPrice: string;
  customRent: string;
}

const SLIDES = ["overview", "gallery", "details", "map", "floorplans", "numbers"] as const;
type Slide = typeof SLIDES[number];

const SLIDE_LABELS: Record<Slide, string> = {
  overview: "Overview",
  gallery: "Gallery",
  details: "Key Details",
  map: "Location",
  floorplans: "Floor Plans",
  numbers: "The Numbers",
};

function fmt(n: number | null | undefined) {
  if (!n) return "—";
  return new Intl.NumberFormat("en-CA", { style: "currency", currency: "CAD", maximumFractionDigits: 0 }).format(n);
}

function getPhotos(p: Project): string[] {
  const all: string[] = [];
  if (p.featured_image) all.push(p.featured_image);
  if (p.gallery_images?.length) all.push(...p.gallery_images);
  return Array.from(new Set(all)).filter(Boolean);
}

// ══════════════════════════════════════════════════════════════════
export default function AdminTopDeals() {
  const navigate = useNavigate();

  const [projects, setProjects] = useState<Project[]>([]);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Project | null>(null);
  const [loadingProjects, setLoadingProjects] = useState(true);

  const [showName, setShowName] = useState(true);
  const [showDev, setShowDev] = useState(true);
  const [showAddr, setShowAddr] = useState(false);

  const [slide, setSlide] = useState<Slide>("overview");
  const [fullscreen, setFullscreen] = useState(false);
  const presenterRef = useRef<HTMLDivElement>(null);

  const [photoIndex, setPhotoIndex] = useState(0);
  const [floorPlans, setFloorPlans] = useState<FloorPlan[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Calculator state
  const [downPct, setDownPct] = useState(20);
  const [rate, setRate] = useState(4.2);
  const [amort, setAmort] = useState(25);
  // Override price for the numbers slide
  const [customCalcPrice, setCustomCalcPrice] = useState<string>("");

  // ── Load projects
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

  // ── Fullscreen
  const toggleFullscreen = useCallback(async () => {
    if (!document.fullscreenElement) {
      await presenterRef.current?.requestFullscreen?.();
    } else {
      await document.exitFullscreen();
    }
  }, []);

  useEffect(() => {
    const handler = () => setFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", handler);
    return () => document.removeEventListener("fullscreenchange", handler);
  }, []);

  // ── Keyboard nav
  useEffect(() => {
    if (!selected) return;
    const handler = (e: KeyboardEvent) => {
      const idx = SLIDES.indexOf(slide);
      if (e.key === "ArrowRight" || e.key === "ArrowDown") {
        if (idx < SLIDES.length - 1) setSlide(SLIDES[idx + 1]);
      } else if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
        if (idx > 0) setSlide(SLIDES[idx - 1]);
      } else if (e.key === "Escape" && fullscreen) {
        document.exitFullscreen();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [slide, selected, fullscreen]);

  // ── Floor plan upload + AI scan
  const handleFloorPlanUpload = async (files: FileList | null) => {
    if (!files) return;
    const remaining = 3 - floorPlans.length;
    if (remaining <= 0) return;

    const newPlans: FloorPlan[] = [];
    for (let i = 0; i < Math.min(files.length, remaining); i++) {
      const file = files[i];
      newPlans.push({ file, preview: URL.createObjectURL(file), publicUrl: null, scanning: true, metrics: null, customPrice: "", customRent: "" });
    }
    const startIdx = floorPlans.length;
    setFloorPlans((prev) => [...prev, ...newPlans]);

    for (let i = 0; i < newPlans.length; i++) {
      const plan = newPlans[i];
      const planIndex = startIdx + i;
      try {
        // Sanitize filename — replace spaces and special chars
        const safeName = plan.file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
        const path = `floorplans/topdeals-${Date.now()}-${safeName}`;
        const { error: uploadError } = await supabase.storage
          .from("listing-files")
          .upload(path, plan.file, { upsert: true, contentType: plan.file.type });
        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage.from("listing-files").getPublicUrl(path);

        // Use the more capable extract-floor-plan function
        const { data: fnData, error: fnError } = await supabase.functions.invoke("extract-floor-plan", {
          body: { fileUrl: publicUrl, fileName: safeName },
        });
        if (fnError) throw fnError;

        const metrics = fnData?.data || fnData || {};
        setFloorPlans((prev) => {
          const updated = [...prev];
          updated[planIndex] = { ...updated[planIndex], scanning: false, metrics, publicUrl };
          return updated;
        });
        toast.success("Floor plan scanned");
      } catch (err) {
        console.error(err);
        setFloorPlans((prev) => {
          const updated = [...prev];
          updated[planIndex] = { ...updated[planIndex], scanning: false, metrics: {} };
          return updated;
        });
        toast.error("Scan failed — upload may still be viewable");
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

  // ── Mortgage calculations
  const calcPrice = customCalcPrice ? parseInt(customCalcPrice.replace(/\D/g, "")) || (selected?.starting_price ?? 850000) : (selected?.starting_price ?? 850000);
  const calc = useMemo(() => {
    const down = (calcPrice * downPct) / 100;
    const principal = calcPrice - down;
    let cmhc = 0;
    if (downPct < 20) {
      cmhc = principal * (downPct >= 15 ? 0.028 : downPct >= 10 ? 0.031 : 0.04);
    }
    const mortgage = principal + cmhc;
    const mr = rate / 100 / 12;
    const n = amort * 12;
    const monthly = mr > 0 ? (mortgage * mr * Math.pow(1 + mr, n)) / (Math.pow(1 + mr, n) - 1) : mortgage / n;
    const fp0Sqft = floorPlans[0]?.metrics?.interior_sqft ?? floorPlans[0]?.metrics?.interiorSqft;
    const strata = fp0Sqft ? fp0Sqft * 0.5 : 350;
    const tax = Math.round((calcPrice * 0.003) / 12);
    return { down, mortgage, cmhc, monthly, strata, tax, total: monthly + strata + tax };
  }, [calcPrice, downPct, rate, amort, floorPlans]);

  // ── Derived
  const photos = selected ? getPhotos(selected) : [];
  const currentIdx = SLIDES.indexOf(slide);
  const filteredProjects = projects.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.city.toLowerCase().includes(search.toLowerCase())
  );

  const displayName = showName ? selected?.name : "Confidential Project";
  const displayDev = showDev ? selected?.developer_name : null;
  const displayAddr = selected
    ? showAddr
      ? selected.address
      : `${selected.neighborhood || selected.city}, BC`
    : null;

  const selectProject = (p: Project) => {
    setSelected(p);
    setSlide("overview");
    setPhotoIndex(0);
    setFloorPlans([]);
  };

  // ════════════════════════════════════════════════════════════════
  // SETUP PANEL
  // ════════════════════════════════════════════════════════════════
  if (!selected) {
    return (
      <AdminLayout>
        <div className="min-h-screen bg-background">
          <div className="max-w-2xl mx-auto px-6 py-10">
            <div className="flex items-center gap-3 mb-10">
              <button
                onClick={() => navigate("/admin")}
                className="h-9 w-9 rounded-xl border border-border flex items-center justify-center hover:bg-muted transition-colors"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <div>
                <h1 className="text-xl font-bold text-foreground tracking-tight">Deal Presenter</h1>
                <p className="text-xs text-muted-foreground mt-0.5">Select a project to begin your pitch</p>
              </div>
            </div>

            <div className="relative mb-6">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search by name or city…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full h-11 pl-10 pr-4 rounded-xl border border-border bg-card text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all"
              />
            </div>

            {loadingProjects ? (
              <div className="flex justify-center py-20">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <div className="space-y-2">
                {filteredProjects.map((p) => {
                  const thumb = p.featured_image || p.gallery_images?.[0];
                  return (
                    <button
                      key={p.id}
                      onClick={() => selectProject(p)}
                      className="group w-full flex items-center gap-4 p-3.5 rounded-xl border border-border bg-card hover:border-primary/50 hover:shadow-md transition-all text-left"
                    >
                      <div className="h-12 w-12 rounded-lg overflow-hidden shrink-0 bg-muted">
                        {thumb ? (
                          <img src={thumb} alt={p.name} className="h-full w-full object-cover" />
                        ) : (
                          <div className="h-full w-full flex items-center justify-center">
                            <Building2 className="h-5 w-5 text-muted-foreground/30" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm text-foreground truncate">{p.name}</p>
                        <p className="text-xs text-muted-foreground">{p.city}{p.neighborhood ? ` · ${p.neighborhood}` : ""}</p>
                      </div>
                      {p.starting_price && (
                        <span className="text-xs font-bold text-primary shrink-0">{fmt(p.starting_price)}</span>
                      )}
                      <ChevronRight className="h-4 w-4 text-muted-foreground/30 group-hover:text-primary transition-colors shrink-0" />
                    </button>
                  );
                })}
                {filteredProjects.length === 0 && (
                  <p className="text-center text-sm text-muted-foreground py-16">No projects found</p>
                )}
              </div>
            )}
          </div>
        </div>
      </AdminLayout>
    );
  }

  // ════════════════════════════════════════════════════════════════
  // PRESENTER MODE
  // ════════════════════════════════════════════════════════════════
  return (
    <div
      ref={presenterRef}
      className={cn(
        "flex flex-col bg-background text-foreground",
        fullscreen ? "fixed inset-0 z-[9999]" : "h-screen"
      )}
    >
      {/* ── TOP BAR ─────────────────────────────────────────── */}
      <div className="flex items-center justify-between gap-3 px-4 py-2.5 border-b border-border/60 bg-card/90 backdrop-blur-sm shrink-0">
        {/* Back + project */}
        <div className="flex items-center gap-2.5 min-w-0">
          <button
            onClick={() => { setSelected(null); setFloorPlans([]); }}
            className="h-7 w-7 rounded-lg border border-border flex items-center justify-center hover:bg-muted transition-colors shrink-0"
          >
            <ChevronLeft className="h-3.5 w-3.5" />
          </button>
          <div className="min-w-0">
            <p className="font-bold text-sm truncate">{displayName}</p>
            <p className="text-[10px] text-muted-foreground truncate">{selected.city}</p>
          </div>
        </div>

        {/* Slide tabs */}
        <div className="hidden md:flex items-center gap-0.5 bg-muted/40 rounded-lg p-0.5">
          {SLIDES.map((s, i) => (
            <button
              key={s}
              onClick={() => setSlide(s)}
              className={cn(
                "px-3 py-1.5 rounded-md text-[11px] font-medium transition-all",
                slide === s
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <span className="mr-1 opacity-40">{i + 1}.</span>{SLIDE_LABELS[s]}
            </button>
          ))}
        </div>

        {/* Controls */}
        <div className="flex items-center gap-1.5 shrink-0">
          <div className="hidden sm:flex items-center gap-0.5 bg-muted/40 rounded-lg p-0.5">
            <PrivacyChip label="Name" on={showName} toggle={() => setShowName(v => !v)} />
            <PrivacyChip label="Dev" on={showDev} toggle={() => setShowDev(v => !v)} />
            <PrivacyChip label="Addr" on={showAddr} toggle={() => setShowAddr(v => !v)} />
          </div>
          <button
            onClick={toggleFullscreen}
            className="h-7 w-7 rounded-lg border border-border flex items-center justify-center hover:bg-muted transition-colors"
            title="Toggle fullscreen"
          >
            {fullscreen ? <Minimize2 className="h-3 w-3" /> : <Maximize2 className="h-3 w-3" />}
          </button>
        </div>
      </div>

      {/* ── SLIDE AREA ──────────────────────────────────────── */}
      <div className="flex-1 overflow-hidden relative">

        {/* ── SLIDE 1: OVERVIEW ───────────────────────────────────── */}
        {slide === "overview" && (
          <div className="h-full flex flex-col md:flex-row animate-fade-in">
            {/* Hero image — dominant left side */}
            <div className="relative flex-1 bg-muted overflow-hidden">
              {photos[0] ? (
                <img src={photos[0]} alt={displayName ?? ""} className="h-full w-full object-cover" />
              ) : (
                <div className="h-full w-full flex items-center justify-center">
                  <Building2 className="h-20 w-20 text-muted-foreground/20" />
                </div>
              )}
              {/* Gradient overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
              {/* Project name badge on image */}
              <div className="absolute bottom-0 left-0 right-0 p-6 md:p-8">
                <p className="text-white/70 text-xs font-medium uppercase tracking-widest mb-1">
                  {selected.project_type || "Presale"} · {selected.city}
                </p>
                <h2 className="text-white text-3xl md:text-4xl font-bold tracking-tight leading-tight">
                  {displayName}
                </h2>
                {displayDev && (
                  <p className="text-white/70 text-sm mt-1">by {displayDev}</p>
                )}
              </div>
            </div>

            {/* Info panel — right side */}
            <div className="md:w-80 lg:w-96 bg-card border-l border-border overflow-y-auto flex flex-col">
              <div className="p-6 flex-1 space-y-5">
                {/* Location */}
                <div className="flex items-start gap-2.5">
                  <div className="mt-0.5 h-7 w-7 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                    <MapPin className="h-3.5 w-3.5 text-primary" />
                  </div>
                  <div>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">Location</p>
                    <p className="text-sm font-semibold mt-0.5">{displayAddr}</p>
                  </div>
                </div>

                {/* Starting price */}
                <div className="flex items-start gap-2.5">
                  <div className="mt-0.5 h-7 w-7 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                    <DollarSign className="h-3.5 w-3.5 text-primary" />
                  </div>
                  <div>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">Starting From</p>
                    <p className="text-2xl font-bold text-primary mt-0.5">{fmt(selected.starting_price)}</p>
                  </div>
                </div>

                {/* Deposit */}
                {selected.deposit_structure && (
                  <div className="flex items-start gap-2.5">
                    <div className="mt-0.5 h-7 w-7 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                      <Layers className="h-3.5 w-3.5 text-primary" />
                    </div>
                    <div>
                      <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">Deposit Structure</p>
                      <p className="text-sm font-semibold mt-0.5">{selected.deposit_structure}</p>
                    </div>
                  </div>
                )}

                {/* Completion */}
                {selected.completion_year && (
                  <div className="flex items-start gap-2.5">
                    <div className="mt-0.5 h-7 w-7 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                      <Calendar className="h-3.5 w-3.5 text-primary" />
                    </div>
                    <div>
                      <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">Est. Completion</p>
                      <p className="text-sm font-semibold mt-0.5">{selected.completion_year}</p>
                    </div>
                  </div>
                )}

                {/* Description */}
                {selected.short_description && (
                  <div className="pt-2 border-t border-border">
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      {selected.short_description}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ── SLIDE 2: GALLERY ──────────────────────────────────────── */}
        {slide === "gallery" && (
          <div className="h-full flex flex-col animate-fade-in bg-black">
            {/* Main image */}
            <div className="flex-1 relative overflow-hidden">
              {photos.length > 0 ? (
                <>
                  <img
                    key={photoIndex}
                    src={photos[photoIndex]}
                    alt=""
                    className="h-full w-full object-contain animate-fade-in"
                  />
                  {/* Nav */}
                  {photos.length > 1 && (
                    <>
                      <button
                        onClick={() => setPhotoIndex((i) => (i - 1 + photos.length) % photos.length)}
                        className="absolute left-4 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full bg-black/50 backdrop-blur-sm border border-white/20 flex items-center justify-center hover:bg-black/70 transition-colors text-white"
                      >
                        <ArrowLeft className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => setPhotoIndex((i) => (i + 1) % photos.length)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full bg-black/50 backdrop-blur-sm border border-white/20 flex items-center justify-center hover:bg-black/70 transition-colors text-white"
                      >
                        <ArrowRight className="h-4 w-4" />
                      </button>
                      <div className="absolute bottom-4 right-4 bg-black/50 backdrop-blur-sm rounded-full px-3 py-1 text-xs text-white font-medium">
                        {photoIndex + 1} / {photos.length}
                      </div>
                    </>
                  )}
                  {/* Project name overlay */}
                  <div className="absolute top-4 left-4">
                    <p className="text-white/80 text-xs font-semibold uppercase tracking-widest">{displayName}</p>
                  </div>
                </>
              ) : (
                <div className="h-full flex items-center justify-center">
                  <p className="text-white/40 text-sm">No photos available</p>
                </div>
              )}
            </div>

            {/* Thumbnail strip */}
            {photos.length > 1 && (
              <div className="shrink-0 h-20 bg-black/80 border-t border-white/10 flex items-center gap-2 px-4 overflow-x-auto">
                {photos.map((url, i) => (
                  <button
                    key={i}
                    onClick={() => setPhotoIndex(i)}
                    className={cn(
                      "shrink-0 h-14 w-20 rounded-md overflow-hidden border-2 transition-all",
                      i === photoIndex ? "border-primary opacity-100" : "border-transparent opacity-40 hover:opacity-70"
                    )}
                  >
                    <img src={url} alt="" className="h-full w-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── SLIDE 3: KEY DETAILS ──────────────────────────────────── */}
        {slide === "details" && (
          <div className="h-full flex flex-col md:flex-row animate-fade-in">
            {/* Background image with overlay */}
            <div className="relative md:flex-1 h-48 md:h-full overflow-hidden">
              {photos[0] && (
                <img src={photos[0]} alt="" className="h-full w-full object-cover" />
              )}
              <div className="absolute inset-0 bg-gradient-to-br from-black/80 via-black/60 to-transparent" />
              <div className="absolute inset-0 flex flex-col justify-end p-6 md:p-10">
                <p className="text-white/60 text-xs uppercase tracking-widest font-medium mb-2">Key Details</p>
                <h2 className="text-white text-2xl md:text-3xl font-bold">{displayName}</h2>
              </div>
            </div>

            {/* Stats grid */}
            <div className="md:w-96 bg-card border-l border-border overflow-y-auto">
              <div className="p-6 space-y-4">
                <DetailRow icon={<DollarSign />} label="Starting Price" value={fmt(selected.starting_price)} highlight />
                {selected.deposit_structure && (
                  <DetailRow icon={<Layers />} label="Deposit Structure" value={selected.deposit_structure} />
                )}
                {selected.completion_year && (
                  <DetailRow icon={<Calendar />} label="Est. Completion" value={String(selected.completion_year)} />
                )}
                <DetailRow icon={<MapPin />} label="Location" value={displayAddr || "—"} />
                {displayDev && (
                  <DetailRow icon={<Building2 />} label="Developer" value={displayDev} />
                )}
                {selected.project_type && (
                  <DetailRow icon={<Home />} label="Property Type" value={selected.project_type} />
                )}

                {/* Price per sqft from floor plans */}
                {floorPlans.some((fp) => fp.metrics?.interiorSqft && selected.starting_price) && (
                  <div className="pt-4 border-t border-border">
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium mb-3">Price Per Sqft</p>
                    {floorPlans.map((fp, i) =>
                      fp.metrics?.interiorSqft && selected.starting_price ? (
                        <div key={i} className="flex items-center justify-between py-2 border-b border-border/50 last:border-0">
                          <span className="text-xs text-muted-foreground">{fp.metrics.planName || `Plan ${i + 1}`}</span>
                          <span className="text-sm font-bold text-primary">
                            {fmt(Math.round(selected.starting_price / fp.metrics.interiorSqft))}/sqft
                          </span>
                        </div>
                      ) : null
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ── SLIDE 4: MAP ──────────────────────────────────────────── */}
        {slide === "map" && (
          <div className="h-full flex flex-col animate-fade-in">
            <MapSlide project={selected} displayName={displayName ?? ""} displayAddr={displayAddr ?? ""} />
          </div>
        )}

        {/* ── SLIDE 5: FLOOR PLANS ──────────────────────────────────── */}
        {slide === "floorplans" && (
          <div className="h-full overflow-y-auto animate-fade-in">
            <div className="p-6 md:p-8">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-xl font-bold">Floor Plans</h2>
                  <p className="text-xs text-muted-foreground mt-0.5">Upload 1–3 plans · AI extracts key metrics</p>
                </div>
                {floorPlans.length < 3 && (
                  <Button variant="outline" size="sm" className="gap-1.5" onClick={() => fileInputRef.current?.click()}>
                    <Upload className="h-3.5 w-3.5" />
                    Add Plan
                  </Button>
                )}
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={(e) => handleFloorPlanUpload(e.target.files)}
              />

              {floorPlans.length === 0 ? (
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full border-2 border-dashed border-border rounded-2xl p-16 flex flex-col items-center gap-3 hover:border-primary/40 hover:bg-muted/20 transition-all group"
                >
                  <Upload className="h-10 w-10 text-muted-foreground/30 group-hover:text-primary/50 transition-colors" />
                  <div className="text-center">
                    <p className="font-semibold text-sm">Upload floor plans</p>
                    <p className="text-xs text-muted-foreground mt-1">Up to 3 · AI will auto-extract size, type & price/sqft</p>
                  </div>
                </button>
              ) : (
                <div className={cn(
                  "grid gap-5",
                  floorPlans.length === 1 ? "grid-cols-1 max-w-lg" :
                  floorPlans.length === 2 ? "md:grid-cols-2" :
                  "md:grid-cols-3"
                )}>
                  {floorPlans.map((fp, i) => (
                    <div key={i} className="rounded-2xl border border-border bg-card overflow-hidden">
                      {/* Plan image */}
                      <div className="relative bg-muted" style={{ aspectRatio: "3/4" }}>
                        <img src={fp.preview} alt="Floor plan" className="h-full w-full object-contain" />
                        <button
                          onClick={() => removeFloorPlan(i)}
                          className="absolute top-2 right-2 h-7 w-7 rounded-full bg-background/80 backdrop-blur-sm border border-border flex items-center justify-center hover:bg-destructive/10 hover:border-destructive/30 transition-colors"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                        {fp.scanning && (
                          <div className="absolute inset-0 bg-background/70 backdrop-blur-sm flex flex-col items-center justify-center gap-2">
                            <Sparkles className="h-6 w-6 text-primary animate-pulse" />
                            <p className="text-xs font-medium">Scanning…</p>
                          </div>
                        )}
                      </div>

                      {/* Metrics */}
                      <div className="p-4">
                        {fp.scanning ? (
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            Extracting metrics…
                          </div>
                        ) : fp.metrics && Object.keys(fp.metrics).length > 0 ? (
                          <div className="space-y-2.5">
                            <div className="flex items-center justify-between">
                              <p className="font-bold text-sm">{fp.metrics.planName || `Plan ${i + 1}`}</p>
                              <div className="flex items-center gap-1 text-[10px] text-primary">
                                <CheckCircle2 className="h-3 w-3" />
                                AI scanned
                              </div>
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                              {fp.metrics.unitType && (
                                <div className="rounded-lg bg-muted/50 p-2">
                                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Type</p>
                                  <p className="text-xs font-semibold mt-0.5">{fp.metrics.unitType}</p>
                                </div>
                              )}
                              {fp.metrics.interiorSqft && (
                                <div className="rounded-lg bg-muted/50 p-2">
                                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Interior</p>
                                  <p className="text-xs font-semibold mt-0.5">{fp.metrics.interiorSqft} sqft</p>
                                </div>
                              )}
                              {fp.metrics.balconySqft && (
                                <div className="rounded-lg bg-muted/50 p-2">
                                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Outdoor</p>
                                  <p className="text-xs font-semibold mt-0.5">{fp.metrics.balconySqft} sqft</p>
                                </div>
                              )}
                              {fp.metrics.interiorSqft && selected.starting_price && (
                                <div className="rounded-lg bg-primary/10 p-2">
                                  <p className="text-[10px] text-primary/70 uppercase tracking-wider">$/sqft</p>
                                  <p className="text-xs font-bold text-primary mt-0.5">
                                    {fmt(Math.round(selected.starting_price / fp.metrics.interiorSqft))}
                                  </p>
                                </div>
                              )}
                            </div>
                          </div>
                        ) : (
                          <p className="text-xs text-muted-foreground italic">No metrics extracted</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── SLIDE 6: THE NUMBERS ──────────────────────────────────── */}
        {slide === "numbers" && (
          <div className="h-full flex flex-col md:flex-row animate-fade-in">
            {/* Left: visual summary */}
            <div className="relative md:flex-1 h-48 md:h-full overflow-hidden bg-foreground">
              {photos[0] && (
                <img src={photos[0]} alt="" className="h-full w-full object-cover opacity-20" />
              )}
              <div className="absolute inset-0 flex flex-col justify-center p-6 md:p-10">
                <div className="flex items-center gap-2 mb-4">
                  <Calculator className="h-5 w-5 text-primary" />
                  <p className="text-primary text-sm font-semibold uppercase tracking-wider">The Numbers</p>
                </div>
                <h2 className="text-white text-2xl md:text-4xl font-bold mb-2">{displayName}</h2>
                <p className="text-white/50 text-sm">{displayAddr}</p>

                <div className="mt-8 hidden md:block">
                  <p className="text-white/40 text-[10px] uppercase tracking-widest mb-3">Est. Monthly Cost</p>
                  <p className="text-white text-5xl font-bold">{fmt(calc.total)}<span className="text-white/40 text-lg font-normal">/mo</span></p>
                  <p className="text-white/40 text-xs mt-2">Based on {downPct}% down · {rate}% rate · {amort}yr</p>
                </div>

                {/* Floor plan summary */}
                {floorPlans.some(fp => fp.metrics?.interiorSqft) && (
                  <div className="mt-6 space-y-2 hidden md:block">
                    {floorPlans.map((fp, i) => fp.metrics?.interiorSqft ? (
                      <div key={i} className="flex items-center justify-between text-sm">
                        <span className="text-white/50">{fp.metrics.planName || `Plan ${i + 1}`} · {fp.metrics.unitType}</span>
                        <span className="text-white font-semibold">{fp.metrics.interiorSqft} sqft</span>
                      </div>
                    ) : null)}
                  </div>
                )}
              </div>
            </div>

            {/* Right: calculator */}
            <div className="md:w-96 bg-card border-l border-border overflow-y-auto">
              <div className="p-6 space-y-5">
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium mb-1">Purchase Price</p>
                  <p className="text-2xl font-bold text-primary">{fmt(calcPrice)}</p>
                </div>

                <div className="space-y-4 pt-2 border-t border-border">
                  {/* Down payment */}
                  <div>
                    <div className="flex justify-between mb-2">
                      <label className="text-xs font-medium">Down Payment</label>
                      <span className="text-xs font-bold text-primary">{downPct}% · {fmt(calc.down)}</span>
                    </div>
                    <Slider value={[downPct]} onValueChange={v => setDownPct(v[0])} min={5} max={50} step={5} />
                    <div className="flex justify-between text-[10px] text-muted-foreground mt-1"><span>5%</span><span>50%</span></div>
                  </div>

                  {/* Interest */}
                  <div>
                    <div className="flex justify-between mb-2">
                      <label className="text-xs font-medium">Interest Rate</label>
                      <span className="text-xs font-bold">{rate.toFixed(1)}%</span>
                    </div>
                    <Slider value={[rate]} onValueChange={v => setRate(v[0])} min={3} max={8} step={0.1} />
                    <div className="flex justify-between text-[10px] text-muted-foreground mt-1"><span>3%</span><span>8%</span></div>
                  </div>

                  {/* Amortization */}
                  <div>
                    <div className="flex justify-between mb-2">
                      <label className="text-xs font-medium">Amortization</label>
                      <span className="text-xs font-bold">{amort} yrs</span>
                    </div>
                    <Slider value={[amort]} onValueChange={v => setAmort(v[0])} min={15} max={30} step={5} />
                    <div className="flex justify-between text-[10px] text-muted-foreground mt-1"><span>15</span><span>30</span></div>
                  </div>
                </div>

                {/* Results */}
                <div className="pt-4 border-t border-border space-y-2.5">
                  <CalcRow label="Mortgage Amount" value={fmt(calc.mortgage)} />
                  {calc.cmhc > 0 && <CalcRow label="CMHC Insurance" value={`+${fmt(calc.cmhc)}`} muted />}
                  <CalcRow label="Principal & Interest" value={`${fmt(calc.monthly)}/mo`} />
                  <CalcRow label="Est. Property Tax" value={`${fmt(calc.tax)}/mo`} muted />
                  <CalcRow label="Est. Strata Fee" value={`${fmt(calc.strata)}/mo`} muted />
                  <div className="flex justify-between items-center pt-3 border-t border-border">
                    <span className="font-bold text-sm">Total Monthly</span>
                    <span className="text-2xl font-bold text-primary">{fmt(calc.total)}</span>
                  </div>
                </div>

                <p className="text-[10px] text-muted-foreground text-center">
                  Estimates only — consult a mortgage broker
                </p>
              </div>
            </div>
          </div>
        )}

      </div>

      {/* ── BOTTOM NAV ──────────────────────────────────────────── */}
      <div className="shrink-0 flex items-center justify-between gap-4 px-4 py-2.5 border-t border-border/60 bg-card/80 backdrop-blur-sm">
        {/* Dots */}
        <div className="flex items-center gap-1.5">
          {SLIDES.map((s) => (
            <button
              key={s}
              onClick={() => setSlide(s)}
              className={cn(
                "rounded-full transition-all duration-200",
                slide === s ? "h-1.5 w-5 bg-primary" : "h-1.5 w-1.5 bg-muted-foreground/30 hover:bg-muted-foreground/60"
              )}
            />
          ))}
        </div>

        <span className="md:hidden text-xs text-muted-foreground">
          {currentIdx + 1}/{SLIDES.length} · {SLIDE_LABELS[slide]}
        </span>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" disabled={currentIdx === 0} onClick={() => setSlide(SLIDES[currentIdx - 1])} className="gap-1">
            <ArrowLeft className="h-3 w-3" /> Back
          </Button>
          <Button size="sm" disabled={currentIdx === SLIDES.length - 1} onClick={() => setSlide(SLIDES[currentIdx + 1])} className="gap-1">
            Next <ArrowRight className="h-3 w-3" />
          </Button>
        </div>
      </div>
    </div>
  );
}

// ── Map Slide ──────────────────────────────────────────────────────
function MapSlide({ project, displayName, displayAddr }: { project: Project; displayName: string; displayAddr: string }) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);

  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;
    if (!project.map_lat || !project.map_lng) return;

    const map = L.map(mapRef.current, {
      center: [project.map_lat, project.map_lng],
      zoom: 15,
      zoomControl: true,
      attributionControl: false,
    });

    L.tileLayer("https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png", {
      maxZoom: 19,
    }).addTo(map);

    const icon = L.divIcon({
      className: "",
      html: `<div style="width:16px;height:16px;background:hsl(40,65%,55%);border:3px solid white;border-radius:50%;box-shadow:0 2px 8px rgba(0,0,0,0.4)"></div>`,
      iconSize: [16, 16],
      iconAnchor: [8, 8],
    });

    L.marker([project.map_lat, project.map_lng], { icon }).addTo(map);
    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, [project.map_lat, project.map_lng]);

  const hasCoords = project.map_lat && project.map_lng;

  return (
    <div className="h-full flex flex-col md:flex-row">
      {/* Map — dominant */}
      <div className="relative flex-1">
        {hasCoords ? (
          <div ref={mapRef} className="h-full w-full" />
        ) : (
          <div className="h-full flex flex-col items-center justify-center gap-3 bg-muted/30">
            <MapPin className="h-12 w-12 text-muted-foreground/20" />
            <p className="text-sm text-muted-foreground">No coordinates set for this project</p>
          </div>
        )}
      </div>

      {/* Location info panel */}
      <div className="md:w-80 bg-card border-l border-border flex flex-col">
        <div className="p-6 flex-1">
          <div className="flex items-center gap-2 mb-4">
            <MapPin className="h-4 w-4 text-primary" />
            <p className="text-sm font-semibold uppercase tracking-wider text-primary">Location</p>
          </div>
          <h3 className="text-xl font-bold mb-2">{displayName}</h3>
          <p className="text-sm text-muted-foreground">{displayAddr}</p>
          {project.neighborhood && (
            <div className="mt-4 pt-4 border-t border-border">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium mb-1">Neighbourhood</p>
              <p className="text-sm font-semibold">{project.neighborhood}</p>
            </div>
          )}
          {project.city && (
            <div className="mt-3">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium mb-1">City</p>
              <p className="text-sm font-semibold">{project.city}</p>
            </div>
          )}
          {hasCoords && (
            <div className="mt-3">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium mb-1">Coordinates</p>
              <p className="text-xs font-mono text-muted-foreground">{project.map_lat?.toFixed(4)}, {project.map_lng?.toFixed(4)}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Sub-components ─────────────────────────────────────────────────
function PrivacyChip({ label, on, toggle }: { label: string; on: boolean; toggle: () => void }) {
  return (
    <button
      onClick={toggle}
      className={cn(
        "flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-medium transition-all",
        on ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
      )}
    >
      {on ? <Eye className="h-2.5 w-2.5" /> : <EyeOff className="h-2.5 w-2.5" />}
      {label}
    </button>
  );
}

function DetailRow({ icon, label, value, highlight }: { icon: React.ReactNode; label: string; value: string; highlight?: boolean }) {
  return (
    <div className="flex items-start gap-3 py-3 border-b border-border/50 last:border-0">
      <div className="mt-0.5 h-6 w-6 rounded-md bg-primary/10 flex items-center justify-center shrink-0 [&_svg]:h-3 [&_svg]:w-3 [&_svg]:text-primary">
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">{label}</p>
        <p className={cn("text-sm font-semibold mt-0.5 truncate", highlight && "text-primary text-base")}>{value}</p>
      </div>
    </div>
  );
}

function CalcRow({ label, value, muted }: { label: string; value: string; muted?: boolean }) {
  return (
    <div className="flex justify-between items-center">
      <span className={cn("text-xs", muted ? "text-muted-foreground" : "text-foreground")}>{label}</span>
      <span className={cn("text-xs font-semibold", muted && "text-muted-foreground")}>{value}</span>
    </div>
  );
}
