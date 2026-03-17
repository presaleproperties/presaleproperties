import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import {
  Plus, Trash2, Loader2, Upload, Image, ArrowUp, ArrowDown,
  ChevronDown, ChevronUp, Save, Eye, Search, Building2, Sparkles, X,
  Wand2, DollarSign, Copy, ExternalLink, CheckCircle2,
} from "lucide-react";

const UNIT_TYPES = ["Studio", "1 Bed", "1 Bed + Den", "2 Bed", "2 Bed + Den", "3 Bed", "Townhouse"];

function normalizeUnitType(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const s = raw.toLowerCase().replace(/[-–—]/g, " ").trim();
  if (s.includes("studio") || s.includes("bachelor")) return "Studio";
  if (s.includes("townhouse") || s.includes("town home") || s.includes("townhome")) return "Townhouse";
  const bed3 = s.includes("3") || s.includes("three");
  const bed2 = s.includes("2") || s.includes("two");
  const bed1 = s.includes("1") || s.includes("one");
  const den = s.includes("den") || s.includes("flex") || s.includes("+");
  if (bed3) return "3 Bed";
  if (bed2 && den) return "2 Bed + Den";
  if (bed2) return "2 Bed";
  if (bed1 && den) return "1 Bed + Den";
  if (bed1) return "1 Bed";
  return UNIT_TYPES.find(t => t.toLowerCase() === s) ?? null;
}

interface PresaleProject {
  id: string; name: string; city: string; neighborhood: string | null;
  address: string | null; developer_name: string | null; starting_price: number | null;
  completion_year: number | null; featured_image: string | null;
  gallery_images: string[] | null; floorplan_files: string[] | null;
  map_lat: number | null; map_lng: number | null; short_description: string | null;
  occupancy_estimate: string | null;
}

interface AgentProfile {
  id: string;
  full_name: string;
  title: string | null;
  photo_url: string | null;
  email: string | null;
  phone: string | null;
}

interface FloorPlan {
  id: string; unit_type: string; size_range: string; price_from: string;
  price_per_sqft?: string; tags: string[]; image_url?: string;
  beds?: number | null; baths?: number | null; exposure?: string | null;
  interior_sqft?: number | null; exterior_sqft?: number | null;
}

interface ProximityHighlight { icon: string; label: string; distance: string; }

interface SectionProps {
  title: string; subtitle?: string; children: React.ReactNode;
  defaultOpen?: boolean; badge?: string;
}

function Section({ title, subtitle, children, defaultOpen = true, badge }: SectionProps) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <Card>
      <button
        type="button"
        className="w-full flex items-center justify-between px-5 py-4 text-left"
        onClick={() => setOpen((o) => !o)}
      >
        <div>
          <div className="flex items-center gap-2">
            <span className="font-semibold text-foreground">{title}</span>
            {badge && <Badge variant="secondary" className="text-[10px] h-4 px-1.5">{badge}</Badge>}
          </div>
          {subtitle && <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>}
        </div>
        {open ? <ChevronUp className="h-4 w-4 text-muted-foreground shrink-0" /> : <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />}
      </button>
      {open && <CardContent className="pt-0 pb-5 px-5">{children}</CardContent>}
    </Card>
  );
}

function genSlug(name: string) {
  return name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "").slice(0, 80);
}
function nanoid() { return Math.random().toString(36).slice(2, 10); }

export default function DashboardDeckBuilder() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const isEdit = !!id;

  const [projects, setProjects] = useState<PresaleProject[]>([]);
  const [loadingProjects, setLoadingProjects] = useState(true);
  const [projectSearch, setProjectSearch] = useState("");
  const [showProjectDropdown, setShowProjectDropdown] = useState(false);
  const [linkedProjectId, setLinkedProjectId] = useState<string | null>(null);
  const [linkedProjectName, setLinkedProjectName] = useState<string>("");
  const searchRef = useRef<HTMLDivElement>(null);

  const [agents, setAgents] = useState<AgentProfile[]>([]);
  const [selectedAgentId, setSelectedAgentId] = useState<string | null>(null);

  const [projectName, setProjectName] = useState("");
  const [tagline, setTagline] = useState("");
  const [city, setCity] = useState("");
  const [address, setAddress] = useState("");
  const [developerName, setDeveloperName] = useState("");
  const [completionYear, setCompletionYear] = useState("");
  const [lat, setLat] = useState<string>("");
  const [lng, setLng] = useState<string>("");

  const [heroImageUrl, setHeroImageUrl] = useState("");
  const [heroUploading, setHeroUploading] = useState(false);
  const heroInputRef = useRef<HTMLInputElement>(null);

  const [floorPlans, setFloorPlans] = useState<FloorPlan[]>([]);
  const [analyzingFp, setAnalyzingFp] = useState<string | null>(null);
  const fpInputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  const [gallery, setGallery] = useState<string[]>([]);
  const [galleryUploading, setGalleryUploading] = useState(false);
  const galleryInputRef = useRef<HTMLInputElement>(null);

  const [highlights, setHighlights] = useState<ProximityHighlight[]>([
    { icon: "🚇", label: "SkyTrain Station", distance: "5 min walk" },
  ]);

  const [rentalMin, setRentalMin] = useState("");
  const [rentalMax, setRentalMax] = useState("");
  const [appreciationRate, setAppreciationRate] = useState("5");
  const [projectionsFromAI, setProjectionsFromAI] = useState(false);

  const [contactName, setContactName] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [contactWhatsapp, setContactWhatsapp] = useState("");

  const [slug, setSlug] = useState("");
  const [slugTaken, setSlugTaken] = useState(false);
  const [isPublished, setIsPublished] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(isEdit);

  // Fetch presale projects
  useEffect(() => {
    (async () => {
      setLoadingProjects(true);
      const { data } = await (supabase as any)
        .from("presale_projects")
        .select("id,name,city,neighborhood,address,developer_name,starting_price,completion_year,featured_image,gallery_images,floorplan_files,map_lat,map_lng,short_description,occupancy_estimate")
        .order("name");
      setProjects(data || []);
      setLoadingProjects(false);
    })();
  }, []);

  // Map team member to contact fields (name only — phone/email filled manually or from hardcoded lookup)
  const applyAgentProfile = useCallback((agent: AgentProfile) => {
    setContactName(agent.full_name || "");
    setSelectedAgentId(agent.id || null);
  }, []);

  // Fetch active team members from team_members_public view
  useEffect(() => {
    (async () => {
      const { data } = await (supabase as any)
        .from("team_members_public")
        .select("id, full_name, title, photo_url")
        .order("sort_order", { ascending: true });
      if (data?.length) {
        setAgents(data as unknown as AgentProfile[]);
        if (!isEdit) {
          applyAgentProfile((data as unknown as AgentProfile[])[0]);
        }
      }
    })();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowProjectDropdown(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Auto-populate from project
  const applyProject = useCallback((p: PresaleProject) => {
    setLinkedProjectId(p.id);
    setLinkedProjectName(p.name);
    setProjectSearch(p.name);
    setShowProjectDropdown(false);
    setProjectName(p.name);
    const cityStr = [p.city, p.neighborhood].filter(Boolean).join(", ");
    setCity(cityStr || p.city || "");
    setAddress(p.address || "");
    setDeveloperName(p.developer_name || "");
    setCompletionYear(p.occupancy_estimate || p.completion_year?.toString() || "");
    if (p.map_lat) setLat(p.map_lat.toString());
    if (p.map_lng) setLng(p.map_lng.toString());
    if (p.featured_image && !heroImageUrl) setHeroImageUrl(p.featured_image);
    if (p.gallery_images?.length || p.featured_image) {
      const imgs = [...(p.featured_image ? [p.featured_image] : []), ...(p.gallery_images || [])];
      setGallery(Array.from(new Set(imgs)).filter(Boolean).slice(0, 12));
    }
    if (!tagline) setTagline(`Presale Opportunity — ${p.city || "BC"}${p.completion_year ? ` · ${p.completion_year}` : ""}`);
    toast.success(`"${p.name}" loaded — review and tweak as needed.`);
  }, [heroImageUrl, tagline]);

  // Load existing deck for edit
  useEffect(() => {
    if (!isEdit || !id) return;
    (async () => {
      const { data, error } = await (supabase as any)
        .from("pitch_decks").select("*").eq("id", id).single();
      if (error || !data) { toast.error("Deck not found"); navigate("/dashboard/decks"); return; }
      setProjectName(data.project_name || "");
      setTagline(data.tagline || "");
      setCity(data.city || "");
      setAddress(data.address || "");
      setDeveloperName(data.developer_name || "");
      setCompletionYear(data.completion_year || "");
      setHeroImageUrl(data.hero_image_url || "");
      setFloorPlans(data.floor_plans || []);
      setGallery(data.gallery || []);
      setHighlights(data.proximity_highlights || []);
      if (data.lat) setLat(data.lat.toString());
      if (data.lng) setLng(data.lng.toString());
      const p = data.projections || {};
      setRentalMin(p.rental_min?.toString() || "");
      setRentalMax(p.rental_max?.toString() || "");
      const firstRate = p.appreciation?.[0];
      setAppreciationRate(firstRate != null ? String(firstRate) : "5");
      setContactName(data.contact_name || "");
      setContactPhone(data.contact_phone || "");
      setContactEmail(data.contact_email || "");
      setContactWhatsapp(data.contact_whatsapp || "");
      setSlug(data.slug || "");
      setIsPublished(data.is_published || false);
      if (data.linked_project_id) {
        setLinkedProjectId(data.linked_project_id);
        setLinkedProjectName(data.project_name || "");
        setProjectSearch(data.project_name || "");
      }
      setLoading(false);
    })();
  }, [id, isEdit]); // eslint-disable-line react-hooks/exhaustive-deps

  // Auto-slug
  useEffect(() => {
    if (!isEdit && projectName) setSlug(genSlug(projectName));
  }, [projectName, isEdit]);

  const checkSlug = async (s: string) => {
    if (!s) return;
    const query = (supabase as any).from("pitch_decks").select("id").eq("slug", s);
    if (isEdit && id) query.neq("id", id);
    const { data } = await query.maybeSingle();
    setSlugTaken(!!data);
  };

  const uploadFile = async (file: File, path: string): Promise<string | null> => {
    const { error } = await supabase.storage.from("listing-files").upload(path, file, { upsert: true });
    if (error) { toast.error(`Upload failed: ${error.message}`); return null; }
    const { data: urlData } = supabase.storage.from("listing-files").getPublicUrl(path);
    return urlData.publicUrl;
  };

  const handleHeroUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    setHeroUploading(true);
    const url = await uploadFile(file, `pitch-decks/${user.id}/hero-${Date.now()}-${file.name}`);
    if (url) setHeroImageUrl(url);
    setHeroUploading(false);
  };

  const handleFloorPlanUpload = async (e: React.ChangeEvent<HTMLInputElement>, fpId: string) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    setAnalyzingFp(fpId);
    try {
      const url = await uploadFile(file, `pitch-decks/${user.id}/fp-${fpId}-${Date.now()}.${file.name.split(".").pop()}`);
      if (!url) { setAnalyzingFp(null); return; }
      setFloorPlans((prev) => prev.map((fp) => fp.id === fpId ? { ...fp, image_url: url } : fp));
      toast.loading("AI analyzing floor plan…", { id: `fp-ai-${fpId}` });
      const currentFp = floorPlans.find(fp => fp.id === fpId);
      const { data: fnData, error: fnError } = await supabase.functions.invoke("analyze-deck-floorplan", {
        body: { fileUrl: url, fileName: file.name, price: currentFp?.price_from || "" },
      });
      toast.dismiss(`fp-ai-${fpId}`);
      if (fnError || !fnData?.success) {
        toast.error("AI analysis failed — fill in manually");
        setAnalyzingFp(null);
        return;
      }
      const { unit, projections } = fnData;
      setFloorPlans((prev) => prev.map((fp) => {
        if (fp.id !== fpId) return fp;
        const sizeStr = unit.interior_sqft
          ? unit.exterior_sqft ? `${unit.interior_sqft} + ${unit.exterior_sqft} ext sq ft` : `${unit.interior_sqft} sq ft`
          : fp.size_range;
        const tags: string[] = [...(unit.features || [])];
        if (unit.exposure) tags.push(unit.exposure);
        return {
          ...fp,
          unit_type: normalizeUnitType(unit.unit_type) || fp.unit_type,
          size_range: sizeStr || fp.size_range,
          beds: unit.beds, baths: unit.baths,
          interior_sqft: unit.interior_sqft, exterior_sqft: unit.exterior_sqft,
          exposure: unit.exposure,
          tags: tags.length > 0 ? tags : fp.tags,
        };
      }));
      if (projections && !projectionsFromAI) {
        setRentalMin(projections.rental_min?.toString() || "");
        setRentalMax(projections.rental_max?.toString() || "");
        if (projections.appreciation?.[0]) setAppreciationRate(String(projections.appreciation[0]));
        setProjectionsFromAI(true);
        toast.success("AI filled unit data & projections!");
      } else {
        toast.success("Floor plan analyzed!");
      }
    } catch {
      toast.dismiss(`fp-ai-${fpId}`);
      toast.error("Analysis error — fill in manually");
    }
    setAnalyzingFp(null);
  };

  const handleGalleryUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (!files.length || !user) return;
    setGalleryUploading(true);
    const remaining = 12 - gallery.length;
    const urls: string[] = [];
    for (const file of files.slice(0, remaining)) {
      const url = await uploadFile(file, `pitch-decks/${user.id}/gallery-${Date.now()}-${file.name}`);
      if (url) urls.push(url);
    }
    setGallery((prev) => [...prev, ...urls]);
    setGalleryUploading(false);
  };

  const addFloorPlan = () => {
    if (floorPlans.length >= 6) return;
    setFloorPlans((prev) => [...prev, { id: nanoid(), unit_type: "1 Bed", size_range: "", price_from: "", tags: [] }]);
  };
  const updateFloorPlan = (fpId: string, field: keyof FloorPlan, value: any) => {
    setFloorPlans((prev) => prev.map((fp) => fp.id === fpId ? { ...fp, [field]: value } : fp));
  };
  const removeFloorPlan = (fpId: string) => setFloorPlans((prev) => prev.filter((fp) => fp.id !== fpId));

  const addHighlight = () => setHighlights((prev) => [...prev, { icon: "📍", label: "", distance: "" }]);
  const updateHighlight = (i: number, field: keyof ProximityHighlight, value: string) => {
    setHighlights((prev) => prev.map((h, idx) => idx === i ? { ...h, [field]: value } : h));
  };
  const removeHighlight = (i: number) => setHighlights((prev) => prev.filter((_, idx) => idx !== i));

  const buildAppreciation = () => {
    const base = parseFloat(appreciationRate) || 5;
    return [base, base + 0.5, base + 0.5, base + 1, base + 1];
  };

  const handleSave = async () => {
    if (!user) return;
    if (!projectName) { toast.error("Project name is required"); return; }
    if (!slug) { toast.error("URL slug is required"); return; }
    if (slugTaken) { toast.error("That URL slug is already taken"); return; }
    setSaving(true);
    const payload: any = {
      user_id: user.id, slug, project_name: projectName, tagline, city, address,
      developer_name: developerName,
      completion_year: completionYear,
      hero_image_url: heroImageUrl, floor_plans: floorPlans, gallery,
      proximity_highlights: highlights,
      projections: {
        rental_min: rentalMin ? parseFloat(rentalMin) : null,
        rental_max: rentalMax ? parseFloat(rentalMax) : null,
        cap_rate_min: null, cap_rate_max: null,
        appreciation: buildAppreciation(),
      },
      contact_name: contactName, contact_phone: contactPhone,
      contact_email: contactEmail, contact_whatsapp: contactWhatsapp,
      is_published: isPublished, linked_project_id: linkedProjectId,
      lat: lat ? parseFloat(lat) : null,
      lng: lng ? parseFloat(lng) : null,
    };
    let error;
    if (isEdit && id) {
      ({ error } = await (supabase as any).from("pitch_decks").update(payload).eq("id", id));
    } else {
      ({ error } = await (supabase as any).from("pitch_decks").insert(payload));
    }
    if (error) { toast.error(`Save failed: ${error.message}`); }
    else { toast.success(isEdit ? "Deck updated!" : "Deck created!"); navigate("/dashboard/decks"); }
    setSaving(false);
  };

  const filteredProjects = projects.filter((p) =>
    p.name.toLowerCase().includes(projectSearch.toLowerCase()) ||
    (p.city || "").toLowerCase().includes(projectSearch.toLowerCase())
  ).slice(0, 8);

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      {/* Hidden file inputs */}
      <input type="file" ref={heroInputRef} className="hidden" accept="image/*" onChange={handleHeroUpload} />
      <input type="file" ref={galleryInputRef} className="hidden" accept="image/*" multiple onChange={handleGalleryUpload} />
      {floorPlans.map((fp) => (
        <input key={fp.id} type="file" accept="image/*,application/pdf" className="hidden"
          ref={(el) => { fpInputRefs.current[fp.id] = el; }}
          onChange={(e) => handleFloorPlanUpload(e, fp.id)} />
      ))}

      <div className="max-w-2xl mx-auto space-y-4 pb-28">
        {/* Header */}
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-foreground">
              {isEdit ? `Edit — ${projectName || "Deck"}` : "New Pitch Deck"}
            </h1>
            <p className="text-sm text-muted-foreground">
              Internal · Presale Properties
            </p>
          </div>
          {isEdit && slug && (
            <Button variant="outline" size="sm" asChild>
              <a href={`/deck/${slug}`} target="_blank" rel="noopener noreferrer">
                <Eye className="h-4 w-4 mr-1" />Preview
              </a>
            </Button>
          )}
        </div>

        {/* ── STEP 1: Load from project ──────────────────────────────── */}
        <div className="rounded-xl border border-primary/30 bg-primary/5 p-4 space-y-3">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" />
            <p className="text-sm font-semibold text-foreground">1. Pick a Project</p>
            <Badge variant="outline" className="text-[10px] ml-auto">Auto-fills everything</Badge>
          </div>
          {linkedProjectId ? (
            <div className="flex items-center gap-3 p-3 rounded-lg bg-background border border-border">
              <CheckCircle2 className="h-5 w-5 text-primary shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold truncate">{linkedProjectName}</p>
                <p className="text-xs text-muted-foreground">Linked — edit any field below to override</p>
              </div>
              <Button variant="ghost" size="sm" className="text-xs text-muted-foreground shrink-0"
                onClick={() => { setLinkedProjectId(null); setLinkedProjectName(""); setProjectSearch(""); }}>
                <X className="h-3.5 w-3.5 mr-1" />Change
              </Button>
            </div>
          ) : (
            <div ref={searchRef} className="relative">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input
                  type="text"
                  value={projectSearch}
                  onChange={(e) => { setProjectSearch(e.target.value); setShowProjectDropdown(true); }}
                  onFocus={() => setShowProjectDropdown(true)}
                  placeholder={loadingProjects ? "Loading projects..." : "Search by project name or city…"}
                  disabled={loadingProjects}
                  className="w-full h-10 pl-9 pr-4 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/50 placeholder:text-muted-foreground/60 transition-colors"
                />
              </div>
              {showProjectDropdown && filteredProjects.length > 0 && (
                <div className="absolute z-50 top-full mt-1 left-0 right-0 rounded-xl border border-border bg-card shadow-xl overflow-hidden">
                  {filteredProjects.map((p) => (
                    <button key={p.id} type="button" onClick={() => applyProject(p)}
                      className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-accent/50 transition-colors border-b border-border/40 last:border-0">
                      {p.featured_image
                        ? <img src={p.featured_image} alt="" className="h-10 w-14 rounded object-cover shrink-0" />
                        : <div className="h-10 w-14 rounded bg-muted flex items-center justify-center shrink-0">
                            <Building2 className="h-4 w-4 text-muted-foreground" />
                          </div>
                      }
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold truncate">{p.name}</p>
                        <p className="text-xs text-muted-foreground">{[p.city, p.neighborhood].filter(Boolean).join(" · ")}</p>
                      </div>
                      {p.starting_price && (
                        <span className="text-xs font-semibold text-primary shrink-0">
                          from ${(p.starting_price / 1000).toFixed(0)}K
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* ── STEP 2: Hero Image ──────────────────────────────────────── */}
        <Section title="2. Hero Image" subtitle="Full-width cover photo for the deck"
          badge={heroImageUrl ? "✓ Set" : undefined}>
          <div>
            {heroImageUrl ? (
              <div className="relative rounded-xl overflow-hidden aspect-video">
                <img src={heroImageUrl} alt="Hero" className="w-full h-full object-cover" />
                <div className="absolute top-2 right-2 flex gap-2">
                  <Button variant="secondary" size="sm" onClick={() => heroInputRef.current?.click()}>
                    <Upload className="h-4 w-4 mr-1" />Replace
                  </Button>
                  <Button variant="destructive" size="sm" onClick={() => setHeroImageUrl("")}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ) : (
              <div
                className="border-2 border-dashed border-border rounded-xl aspect-video flex flex-col items-center justify-center gap-3 cursor-pointer hover:border-primary/50 hover:bg-primary/5 transition-colors"
                onClick={() => heroInputRef.current?.click()}
              >
                {heroUploading
                  ? <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  : <>
                      <Image className="h-10 w-10 text-muted-foreground/30" />
                      <p className="text-sm font-medium text-foreground">Click to upload hero image</p>
                      <p className="text-xs text-muted-foreground">JPG, PNG — landscape recommended</p>
                    </>
                }
              </div>
            )}
          </div>
        </Section>

        {/* ── STEP 3: Project Details ─────────────────────────────────── */}
        <Section title="3. Project Details"
          badge={linkedProjectId ? "Auto-filled" : undefined}>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2 space-y-1.5">
              <Label>Project Name *</Label>
              <Input value={projectName} onChange={(e) => setProjectName(e.target.value)} placeholder="Aurora Surrey" />
            </div>
            <div className="sm:col-span-2 space-y-1.5">
              <Label>Tagline <span className="text-muted-foreground font-normal text-xs">(optional)</span></Label>
              <Input value={tagline} onChange={(e) => setTagline(e.target.value)} placeholder="Presale Opportunity — Surrey City Centre · 2027" />
            </div>
            <div className="space-y-1.5">
              <Label>City / Neighbourhood</Label>
              <Input value={city} onChange={(e) => setCity(e.target.value)} placeholder="Surrey, BC" />
            </div>
            <div className="space-y-1.5">
              <Label>Full Address</Label>
              <Input value={address} onChange={(e) => setAddress(e.target.value)} placeholder="10188 City Pkwy, Surrey" />
            </div>
            <div className="space-y-1.5">
              <Label>Developer</Label>
              <Input value={developerName} onChange={(e) => setDeveloperName(e.target.value)} placeholder="Bosa Development" />
            </div>
            <div className="space-y-1.5">
              <Label>Completion / Occupancy</Label>
              <Input value={completionYear} onChange={(e) => setCompletionYear(e.target.value)} placeholder="Spring 2027" />
            </div>
          </div>
        </Section>

        {/* ── STEP 4: Floor Plans ─────────────────────────────────────── */}
        <Section title={`4. Floor Plans (${floorPlans.length}/6)`}
          subtitle="Upload image — AI auto-fills size, type & pricing">
          <div className="space-y-3">
            {floorPlans.map((fp, idx) => (
              <div key={fp.id} className="p-4 rounded-xl border border-border/50 bg-muted/20 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Unit {idx + 1}</span>
                  <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive"
                    onClick={() => removeFloorPlan(fp.id)}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>

                <div className="flex items-start gap-3">
                  <div
                    className="h-20 w-28 rounded-lg border-2 border-dashed border-border bg-muted/30 flex flex-col items-center justify-center gap-1 cursor-pointer hover:border-primary/50 transition-colors shrink-0 overflow-hidden relative"
                    onClick={() => fpInputRefs.current[fp.id]?.click()}
                  >
                    {fp.image_url ? (
                      <>
                        <img src={fp.image_url} alt="" className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                          <Upload className="h-4 w-4 text-white" />
                        </div>
                      </>
                    ) : analyzingFp === fp.id ? (
                      <Loader2 className="h-5 w-5 animate-spin text-primary" />
                    ) : (
                      <>
                        <Wand2 className="h-4 w-4 text-primary/50" />
                        <span className="text-[9px] text-muted-foreground text-center px-1 leading-tight">Upload + AI</span>
                      </>
                    )}
                  </div>

                  <div className="flex-1 grid grid-cols-2 gap-2">
                    <div className="space-y-1 col-span-2">
                      <div className="flex items-center gap-1">
                        <Label className="text-xs">Unit Type</Label>
                        {fp.beds != null && <Badge variant="secondary" className="text-[9px] h-4 px-1 ml-1"><Wand2 className="h-2.5 w-2.5 mr-0.5" />AI</Badge>}
                      </div>
                      <Select value={fp.unit_type} onValueChange={(v) => updateFloorPlan(fp.id, "unit_type", v)}>
                        <SelectTrigger className="h-8 text-xs">
                          <SelectValue placeholder="Select type…" />
                        </SelectTrigger>
                        <SelectContent position="popper" side="bottom">
                          {UNIT_TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Price From</Label>
                      <Input className="h-8 text-xs" value={fp.price_from}
                        onChange={(e) => updateFloorPlan(fp.id, "price_from", e.target.value)} placeholder="$599,900" />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Size</Label>
                      <Input className="h-8 text-xs" value={fp.size_range}
                        onChange={(e) => updateFloorPlan(fp.id, "size_range", e.target.value)} placeholder="540–680 sqft" />
                    </div>
                  </div>
                </div>

                {fp.beds != null && (
                  <div className="flex flex-wrap gap-1.5">
                    <Badge variant="outline" className="text-[10px] h-5">{fp.beds}bd / {fp.baths}ba</Badge>
                    {fp.interior_sqft && <Badge variant="outline" className="text-[10px] h-5">{fp.interior_sqft} sqft</Badge>}
                    {fp.exposure && <Badge variant="outline" className="text-[10px] h-5">{fp.exposure}</Badge>}
                  </div>
                )}
              </div>
            ))}

            {floorPlans.length < 6 && (
              <Button variant="outline" onClick={addFloorPlan} className="w-full">
                <Plus className="h-4 w-4 mr-2" />Add Floor Plan
              </Button>
            )}
          </div>
        </Section>

        {/* ── STEP 5: Gallery ─────────────────────────────────────────── */}
        <Section title={`5. Photo Gallery (${gallery.length}/12)`}
          subtitle="First image shown largest — use arrows to reorder"
          badge={gallery.length > 0 && linkedProjectId ? "From project" : undefined}>
          <div className="space-y-3">
            {gallery.length > 0 && (
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                {gallery.map((url, i) => (
                  <div key={i} className="relative aspect-square rounded-lg overflow-hidden group">
                    <img src={url} alt="" className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/50 transition-colors flex items-center justify-center gap-1 opacity-0 group-hover:opacity-100">
                      <button className="p-1.5 bg-white/80 rounded hover:bg-white transition-colors"
                        onClick={() => setGallery((g) => { const n = [...g]; [n[i - 1], n[i]] = [n[i], n[i - 1]]; return n; })} disabled={i === 0}>
                        <ArrowUp className="h-3 w-3" />
                      </button>
                      <button className="p-1.5 bg-white/80 rounded hover:bg-white transition-colors"
                        onClick={() => setGallery((g) => { const n = [...g]; [n[i], n[i + 1]] = [n[i + 1], n[i]]; return n; })} disabled={i === gallery.length - 1}>
                        <ArrowDown className="h-3 w-3" />
                      </button>
                      <button className="p-1.5 bg-destructive/80 rounded hover:bg-destructive transition-colors"
                        onClick={() => setGallery((g) => g.filter((_, idx) => idx !== i))}>
                        <Trash2 className="h-3 w-3 text-white" />
                      </button>
                    </div>
                    {i === 0 && <div className="absolute bottom-1 left-1 bg-primary text-primary-foreground text-[8px] font-bold px-1 py-0.5 rounded">HERO</div>}
                  </div>
                ))}
              </div>
            )}
            {gallery.length < 12 && (
              <Button variant="outline" className="w-full" onClick={() => galleryInputRef.current?.click()} disabled={galleryUploading}>
                {galleryUploading
                  ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Uploading…</>
                  : <><Upload className="h-4 w-4 mr-2" />Upload Photos ({gallery.length}/12)</>
                }
              </Button>
            )}
          </div>
        </Section>

        {/* ── STEP 6: Location ────────────────────────────────────────── */}
        <Section title="6. Location & Nearby" subtitle="Map pin + transit & amenity callouts" defaultOpen={false}
          badge={linkedProjectId && lat ? "Coords loaded" : undefined}>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Latitude</Label>
                <Input className="h-9" value={lat} onChange={(e) => setLat(e.target.value)} placeholder="49.1913" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Longitude</Label>
                <Input className="h-9" value={lng} onChange={(e) => setLng(e.target.value)} placeholder="-122.8490" />
              </div>
            </div>
            <p className="text-xs text-muted-foreground">Nearby points of interest:</p>
            {highlights.map((h, i) => (
              <div key={i} className="flex items-center gap-2">
                <Input className="w-12 h-9 text-center px-1 text-base" value={h.icon}
                  onChange={(e) => updateHighlight(i, "icon", e.target.value)} placeholder="🚇" />
                <Input className="flex-1 h-9 text-sm" value={h.label}
                  onChange={(e) => updateHighlight(i, "label", e.target.value)} placeholder="SkyTrain Station" />
                <Input className="w-28 h-9 text-sm" value={h.distance}
                  onChange={(e) => updateHighlight(i, "distance", e.target.value)} placeholder="5 min walk" />
                <Button variant="ghost" size="icon" className="h-9 w-9 shrink-0 text-muted-foreground hover:text-destructive"
                  onClick={() => removeHighlight(i)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
            <Button variant="outline" size="sm" onClick={addHighlight}>
              <Plus className="h-4 w-4 mr-2" />Add Point of Interest
            </Button>
          </div>
        </Section>

        {/* ── STEP 7: Investment Numbers ──────────────────────────────── */}
        <Section title="7. Investment Numbers" subtitle="Rental range & appreciation for projections section" defaultOpen={false}
          badge={projectionsFromAI ? "AI Generated" : undefined}>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="flex items-center gap-1.5 text-sm">
                <DollarSign className="h-3.5 w-3.5 text-muted-foreground" />Rental Min / mo
              </Label>
              <Input type="number" value={rentalMin} onChange={(e) => setRentalMin(e.target.value)} placeholder="2,200" />
            </div>
            <div className="space-y-1.5">
              <Label className="flex items-center gap-1.5 text-sm">
                <DollarSign className="h-3.5 w-3.5 text-muted-foreground" />Rental Max / mo
              </Label>
              <Input type="number" value={rentalMax} onChange={(e) => setRentalMax(e.target.value)} placeholder="2,800" />
            </div>
            <div className="col-span-2 space-y-1.5">
              <Label className="text-sm">Annual Appreciation (%)</Label>
              <Input type="number" step="0.5" value={appreciationRate}
                onChange={(e) => setAppreciationRate(e.target.value)} placeholder="5" />
              <p className="text-xs text-muted-foreground">Base rate for 5-year forecast chart — years auto-graduated.</p>
            </div>
          </div>
        </Section>

        {/* ── STEP 8: Contact on Deck ─────────────────────────────────── */}
        <Section title="8. Contact on Deck" subtitle="Team member shown as the agent contact">
          <div className="space-y-4">
            {agents.length > 0 && (
              <div>
                <p className="text-xs text-muted-foreground mb-2 font-medium uppercase tracking-wider">Team member</p>
                <div className="flex flex-wrap gap-2">
                  {agents.map((agent) => (
                    <button key={agent.id} type="button" onClick={() => applyAgentProfile(agent)}
                      className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-sm transition-all ${
                        selectedAgentId === agent.id
                          ? "border-primary bg-primary/10 text-primary font-medium"
                          : "border-border bg-background text-muted-foreground hover:border-primary/40 hover:text-foreground"
                      }`}>
                      {agent.photo_url ? (
                        <img src={agent.photo_url} alt={agent.full_name || ""} className="h-6 w-6 rounded-full object-cover object-top shrink-0" />
                      ) : (
                        <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center text-[9px] font-bold text-primary shrink-0">
                          {(agent.full_name || "?").split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()}
                        </div>
                      )}
                      <div className="text-left">
                        <p className="text-sm leading-tight">{agent.full_name}</p>
                        {agent.title && <p className="text-[10px] text-muted-foreground leading-tight">{agent.title}</p>}
                      </div>
                      {selectedAgentId === agent.id && <CheckCircle2 className="h-3.5 w-3.5 ml-0.5 shrink-0" />}
                    </button>
                  ))}
                </div>
              </div>
            )}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Name</Label>
                <Input className="h-9" value={contactName} onChange={(e) => setContactName(e.target.value)} placeholder="Uzair Dada" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Phone</Label>
                <Input className="h-9" value={contactPhone} onChange={(e) => setContactPhone(e.target.value)} placeholder="+1 604 000 0000" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Email</Label>
                <Input className="h-9" type="email" value={contactEmail} onChange={(e) => setContactEmail(e.target.value)} placeholder="agent@presaleproperties.com" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">WhatsApp Number</Label>
                <Input className="h-9" value={contactWhatsapp} onChange={(e) => setContactWhatsapp(e.target.value)} placeholder="16040000000" />
              </div>
            </div>
          </div>
        </Section>

        {/* ── STEP 9: URL & Publishing ─────────────────────────────────── */}
        <Section title="9. URL & Publishing" defaultOpen={false}>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label className="text-sm">Deck URL Slug</Label>
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground shrink-0">/deck/</span>
                <Input
                  value={slug}
                  onChange={(e) => { setSlug(e.target.value); checkSlug(e.target.value); }}
                  placeholder="aurora-surrey"
                  className={slugTaken ? "border-destructive" : ""}
                />
              </div>
              {slugTaken && <p className="text-xs text-destructive">This slug is already taken — choose another.</p>}
            </div>
          </div>
        </Section>
      </div>

      {/* ── STICKY FOOTER ───────────────────────────────────────────── */}
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-background/95 backdrop-blur-md border-t border-border/50 shadow-lg">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <Switch checked={isPublished} onCheckedChange={setIsPublished} />
            <div className="min-w-0">
              <p className="text-sm font-semibold text-foreground leading-tight">
                {isPublished ? "Published" : "Draft"}
              </p>
              {slug && (
                <div className="flex items-center gap-1.5 mt-0.5">
                  <code className="text-[10px] text-muted-foreground font-mono truncate max-w-[180px]">
                    /deck/{slug}
                  </code>
                  <button
                    className="text-muted-foreground hover:text-primary transition-colors"
                    onClick={() => {
                      navigator.clipboard.writeText(`${window.location.origin}/deck/${slug}`);
                      toast.success("Link copied!");
                    }}
                  >
                    <Copy className="h-3 w-3" />
                  </button>
                  <a href={`/deck/${slug}`} target="_blank" rel="noopener noreferrer"
                    className="text-muted-foreground hover:text-primary transition-colors">
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
              )}
            </div>
          </div>
          <div className="flex gap-2 shrink-0">
            <Button variant="outline" size="sm" onClick={() => navigate("/dashboard/decks")}>Cancel</Button>
            <Button onClick={handleSave} disabled={saving || slugTaken} size="sm">
              {saving ? <Loader2 className="h-4 w-4 animate-spin mr-1.5" /> : <Save className="h-4 w-4 mr-1.5" />}
              {saving ? "Saving…" : isEdit ? "Save Changes" : "Create Deck"}
            </Button>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
