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
  Wand2, User, TrendingUp, DollarSign, Copy, ExternalLink,
} from "lucide-react";

const UNIT_TYPES = ["Studio", "1 Bed", "1 Bed + Den", "2 Bed", "2 Bed + Den", "3 Bed", "Townhouse"];

/** Map AI-returned unit_type string to the closest UNIT_TYPES entry */
function normalizeUnitType(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const s = raw.toLowerCase().replace(/[-–—]/g, " ").trim();
  if (s.includes("studio") || s.includes("bachelor")) return "Studio";
  if (s.includes("townhouse") || s.includes("town home") || s.includes("townhome")) return "Townhouse";
  const bed3 = s.includes("3") || s.includes("three");
  const bed2 = s.includes("2") || s.includes("two");
  const bed1 = s.includes("1") || s.includes("one");
  const den  = s.includes("den") || s.includes("flex") || s.includes("+");
  if (bed3) return "3 Bed";
  if (bed2 && den) return "2 Bed + Den";
  if (bed2) return "2 Bed";
  if (bed1 && den) return "1 Bed + Den";
  if (bed1) return "1 Bed";
  return UNIT_TYPES.find(t => t.toLowerCase() === s) ?? null;
}
const UZAIR_USER_ID = "1a1c17cd-c64b-478a-832d-5874be1258d1";

interface PresaleProject {
  id: string; name: string; city: string; neighborhood: string | null;
  address: string | null; developer_name: string | null; starting_price: number | null;
  completion_year: number | null; featured_image: string | null;
  gallery_images: string[] | null; floorplan_files: string[] | null;
  map_lat: number | null; map_lng: number | null; short_description: string | null;
  occupancy_estimate: string | null;
}

interface AgentProfile { user_id: string; full_name: string; email: string; phone: string | null; }

interface FloorPlan {
  id: string; unit_type: string; size_range: string; price_from: string;
  price_per_sqft?: string; tags: string[]; image_url?: string;
  // AI extracted fields
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
        className="w-full flex items-center justify-between px-6 py-4 text-left"
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
      {open && <CardContent className="pt-0 pb-6">{children}</CardContent>}
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

  // ── Project picker ──────────────────────────────────────────────
  const [projects, setProjects] = useState<PresaleProject[]>([]);
  const [loadingProjects, setLoadingProjects] = useState(true);
  const [projectSearch, setProjectSearch] = useState("");
  const [showProjectDropdown, setShowProjectDropdown] = useState(false);
  const [linkedProjectId, setLinkedProjectId] = useState<string | null>(null);
  const [linkedProjectName, setLinkedProjectName] = useState<string>("");
  const searchRef = useRef<HTMLDivElement>(null);

  // ── Agent profiles ───────────────────────────────────────────────
  const [agents, setAgents] = useState<AgentProfile[]>([]);
  const [selectedAgentId, setSelectedAgentId] = useState<string>(UZAIR_USER_ID);

  // ── Project info ────────────────────────────────────────────────
  const [projectName, setProjectName] = useState("");
  const [tagline, setTagline] = useState("");
  const [city, setCity] = useState("");
  const [address, setAddress] = useState("");
  const [developerName, setDeveloperName] = useState("");
  const [stories, setStories] = useState("");
  const [totalUnits, setTotalUnits] = useState("");
  const [completionYear, setCompletionYear] = useState("");
  const [lat, setLat] = useState<string>("");
  const [lng, setLng] = useState<string>("");

  // ── Hero image ──────────────────────────────────────────────────
  const [heroImageUrl, setHeroImageUrl] = useState("");
  const [heroUploading, setHeroUploading] = useState(false);
  const heroInputRef = useRef<HTMLInputElement>(null);

  // ── Floor plans ─────────────────────────────────────────────────
  const [floorPlans, setFloorPlans] = useState<FloorPlan[]>([]);
  const [analyzingFp, setAnalyzingFp] = useState<string | null>(null);
  const fpInputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  // ── Gallery ─────────────────────────────────────────────────────
  const [gallery, setGallery] = useState<string[]>([]);
  const [galleryUploading, setGalleryUploading] = useState(false);
  const galleryInputRef = useRef<HTMLInputElement>(null);

  // ── Proximity highlights ────────────────────────────────────────
  const [highlights, setHighlights] = useState<ProximityHighlight[]>([
    { icon: "🚇", label: "SkyTrain Station", distance: "5 min walk" },
  ]);

  // ── Projections ─────────────────────────────────────────────────
  const [rentalMin, setRentalMin] = useState("");
  const [rentalMax, setRentalMax] = useState("");
  const [capRateMin, setCapRateMin] = useState("");
  const [capRateMax, setCapRateMax] = useState("");
  const [appreciation, setAppreciation] = useState(["4", "5", "5.5", "6", "6.5"]);
  const [projectionsFromAI, setProjectionsFromAI] = useState(false);

  // ── Contact ──────────────────────────────────────────────────────
  const [contactName, setContactName] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [contactWhatsapp, setContactWhatsapp] = useState("");

  // ── Slug + publish ───────────────────────────────────────────────
  const [slug, setSlug] = useState("");
  const [slugTaken, setSlugTaken] = useState(false);
  const [isPublished, setIsPublished] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(isEdit);

  // ── Fetch all presale projects ───────────────────────────────────
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

  // ── Fetch agent profiles ─────────────────────────────────────────
  useEffect(() => {
    (async () => {
      const { data } = await (supabase as any)
        .from("profiles")
        .select("user_id, full_name, email, phone")
        .not("full_name", "is", null)
        .order("full_name");
      if (data?.length) {
        setAgents(data);
        // Default to Uzair if not already in edit mode
        if (!isEdit) {
          const uzair = data.find((a: AgentProfile) => a.user_id === UZAIR_USER_ID);
          if (uzair) applyAgentProfile(uzair);
        }
      }
    })();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const applyAgentProfile = useCallback((agent: AgentProfile) => {
    setContactName(agent.full_name || "");
    setContactPhone(agent.phone || "");
    setContactEmail(agent.email || "");
    setContactWhatsapp(agent.phone ? agent.phone.replace(/\D/g, "") : "");
    setSelectedAgentId(agent.user_id);
  }, []);

  // ── Close dropdown on outside click ─────────────────────────────
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowProjectDropdown(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // ── Auto-populate from project ───────────────────────────────────
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
    toast.success(`Loaded "${p.name}" — all fields auto-populated.`);
  }, [heroImageUrl, tagline]);

  // ── Load existing deck ───────────────────────────────────────────
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
      setStories(data.stories || "");
      setTotalUnits(data.total_units || "");
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
      setCapRateMin(p.cap_rate_min?.toString() || "");
      setCapRateMax(p.cap_rate_max?.toString() || "");
      setAppreciation(p.appreciation?.map(String) || ["4", "5", "5.5", "6", "6.5"]);
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
  }, [id, isEdit]);

  // ── Auto-slug ────────────────────────────────────────────────────
  useEffect(() => {
    if (!isEdit && projectName) setSlug(genSlug(projectName));
  }, [projectName, isEdit]);

  // ── Slug check ───────────────────────────────────────────────────
  const checkSlug = async (s: string) => {
    if (!s) return;
    const query = (supabase as any).from("pitch_decks").select("id").eq("slug", s);
    if (isEdit && id) query.neq("id", id);
    const { data } = await query.maybeSingle();
    setSlugTaken(!!data);
  };

  // ── Upload helpers ───────────────────────────────────────────────
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

  // ── Floor plan upload + AI analysis ─────────────────────────────
  const handleFloorPlanUpload = async (e: React.ChangeEvent<HTMLInputElement>, fpId: string) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    setAnalyzingFp(fpId);
    try {
      // 1. Upload file
      const url = await uploadFile(file, `pitch-decks/${user.id}/fp-${fpId}-${Date.now()}.${file.name.split(".").pop()}`);
      if (!url) { setAnalyzingFp(null); return; }

      // 2. Update image_url immediately
      setFloorPlans((prev) => prev.map((fp) => fp.id === fpId ? { ...fp, image_url: url } : fp));

      // 3. Call AI to extract floor plan data + projections
      toast.loading("AI is analyzing floor plan…", { id: `fp-ai-${fpId}` });

      // Get current price for this floor plan (if any)
      const currentFp = floorPlans.find(fp => fp.id === fpId);
      const priceStr = currentFp?.price_from || "";

      const { data: fnData, error: fnError } = await supabase.functions.invoke("analyze-deck-floorplan", {
        body: { fileUrl: url, fileName: file.name, price: priceStr },
      });

      toast.dismiss(`fp-ai-${fpId}`);

      if (fnError || !fnData?.success) {
        toast.error("AI analysis failed — fill in details manually");
        setAnalyzingFp(null);
        return;
      }

      const { unit, projections } = fnData;

      // 4. Auto-fill floor plan fields
      setFloorPlans((prev) => prev.map((fp) => {
        if (fp.id !== fpId) return fp;
        const sizeStr = unit.interior_sqft
          ? unit.exterior_sqft
            ? `${unit.interior_sqft} + ${unit.exterior_sqft} ext sq ft`
            : `${unit.interior_sqft} sq ft`
          : fp.size_range;

        const tags: string[] = [...(unit.features || [])];
        if (unit.exposure) tags.push(unit.exposure);

        // Normalize AI unit_type to a valid UNIT_TYPES entry
        const resolvedUnitType = normalizeUnitType(unit.unit_type) || fp.unit_type;

        return {
          ...fp,
          unit_type: resolvedUnitType,
          size_range: sizeStr || fp.size_range,
          beds: unit.beds,
          baths: unit.baths,
          interior_sqft: unit.interior_sqft,
          exterior_sqft: unit.exterior_sqft,
          exposure: unit.exposure,
          tags: tags.length > 0 ? tags : fp.tags,
        };
      }));

      // 5. Auto-fill projections if not already set by user
      if (projections && !projectionsFromAI) {
        setRentalMin(projections.rental_min?.toString() || "");
        setRentalMax(projections.rental_max?.toString() || "");
        if (projections.cap_rate_min) setCapRateMin(projections.cap_rate_min.toString());
        if (projections.cap_rate_max) setCapRateMax(projections.cap_rate_max.toString());
        setAppreciation(projections.appreciation?.map(String) || appreciation);
        setProjectionsFromAI(true);
        toast.success(`AI extracted unit data & generated investment projections!`);
      } else {
        toast.success(`Floor plan analyzed — unit details auto-filled!`);
      }
    } catch (err) {
      toast.dismiss(`fp-ai-${fpId}`);
      toast.error("Analysis error — fill in details manually");
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

  // ── Floor plan helpers ───────────────────────────────────────────
  const addFloorPlan = () => {
    if (floorPlans.length >= 6) return;
    setFloorPlans((prev) => [...prev, { id: nanoid(), unit_type: "1 Bed", size_range: "", price_from: "", tags: [] }]);
  };
  const updateFloorPlan = (id: string, field: keyof FloorPlan, value: any) => {
    setFloorPlans((prev) => prev.map((fp) => fp.id === id ? { ...fp, [field]: value } : fp));
  };
  const removeFloorPlan = (id: string) => setFloorPlans((prev) => prev.filter((fp) => fp.id !== id));

  const addHighlight = () => setHighlights((prev) => [...prev, { icon: "📍", label: "", distance: "" }]);
  const updateHighlight = (i: number, field: keyof ProximityHighlight, value: string) => {
    setHighlights((prev) => prev.map((h, idx) => idx === i ? { ...h, [field]: value } : h));
  };
  const removeHighlight = (i: number) => setHighlights((prev) => prev.filter((_, idx) => idx !== i));

  // ── Save ─────────────────────────────────────────────────────────
  const handleSave = async () => {
    if (!user) return;
    if (!projectName) { toast.error("Project name is required"); return; }
    if (!slug) { toast.error("Slug is required"); return; }
    if (slugTaken) { toast.error("Slug is already taken"); return; }
    setSaving(true);

    const payload: any = {
      user_id: user.id, slug, project_name: projectName, tagline, city, address,
      developer_name: developerName,
      stories: stories ? parseInt(stories) : null,
      total_units: totalUnits ? parseInt(totalUnits) : null,
      completion_year: completionYear,
      hero_image_url: heroImageUrl, floor_plans: floorPlans, gallery,
      proximity_highlights: highlights,
      projections: {
        rental_min: rentalMin ? parseFloat(rentalMin) : null,
        rental_max: rentalMax ? parseFloat(rentalMax) : null,
        cap_rate_min: capRateMin ? parseFloat(capRateMin) : null,
        cap_rate_max: capRateMax ? parseFloat(capRateMax) : null,
        appreciation: appreciation.map((v) => parseFloat(v) || 0),
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

  // ── Filtered projects ─────────────────────────────────────────────
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
        <input
          key={fp.id} type="file"
          accept="image/*,application/pdf"
          className="hidden"
          ref={(el) => { fpInputRefs.current[fp.id] = el; }}
          onChange={(e) => handleFloorPlanUpload(e, fp.id)}
        />
      ))}

      <div className="max-w-3xl mx-auto space-y-6 pb-16">
        {/* Header */}
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">
              {isEdit ? "Edit Deck" : "New Pitch Deck"}
            </h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              {isEdit ? `Editing: ${projectName}` : "Select a project to auto-populate all fields"}
            </p>
          </div>
          <div className="flex gap-2">
            {isEdit && slug && (
              <Button variant="outline" size="sm" asChild>
                <a href={`/deck/${slug}`} target="_blank" rel="noopener noreferrer">
                  <Eye className="h-4 w-4 mr-1" />Preview
                </a>
              </Button>
            )}
            <Button onClick={handleSave} disabled={saving}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
              {saving ? "Saving..." : "Save Deck"}
            </Button>
          </div>
        </div>

        {/* ── PROJECT SELECTOR ────────────────────────────────────── */}
        <div className="rounded-xl border border-primary/30 bg-primary/5 p-4 space-y-3">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" />
            <p className="text-sm font-semibold text-foreground">Load from Project</p>
            <Badge variant="outline" className="text-[10px] ml-auto">Auto-fills all sections</Badge>
          </div>
          {linkedProjectId ? (
            <div className="flex items-center gap-3 p-3 rounded-lg bg-background border border-border">
              <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                <Building2 className="h-4 w-4 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold truncate">{linkedProjectName}</p>
                <p className="text-xs text-muted-foreground">Project data loaded — all fields editable below</p>
              </div>
              <Button variant="ghost" size="sm" className="text-xs text-muted-foreground hover:text-destructive shrink-0"
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
                  placeholder={loadingProjects ? "Loading projects..." : "Search projects by name or city…"}
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

        {/* Publish toggle */}
        <div className="flex items-center justify-between p-4 rounded-xl border border-border/50 bg-background">
          <div>
            <p className="font-semibold text-sm text-foreground">
              {isPublished ? "Published — visible to anyone with the link" : "Draft — only you can see this"}
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {isPublished ? `Public URL: /deck/${slug}` : "Publish when ready to share"}
            </p>
          </div>
          <Switch checked={isPublished} onCheckedChange={setIsPublished} />
        </div>

        {/* Section: Project Info */}
        <Section title="Project Information" subtitle="Core details shown in the deck header and stats"
          badge={linkedProjectId ? "Auto-filled" : undefined}>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2 space-y-1.5">
              <Label>Project Name *</Label>
              <Input value={projectName} onChange={(e) => setProjectName(e.target.value)} placeholder="Aurora Surrey" />
            </div>
            <div className="sm:col-span-2 space-y-1.5">
              <Label>Tagline</Label>
              <Input value={tagline} onChange={(e) => setTagline(e.target.value)} placeholder="Presale Opportunity — Surrey City Centre" />
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
              <Label>Developer Name</Label>
              <Input value={developerName} onChange={(e) => setDeveloperName(e.target.value)} placeholder="Bosa Development" />
            </div>
            <div className="space-y-1.5">
              <Label>Completion / Occupancy</Label>
              <Input value={completionYear} onChange={(e) => setCompletionYear(e.target.value)} placeholder="Spring 2027" />
            </div>
            <div className="space-y-1.5">
              <Label>Stories</Label>
              <Input type="number" value={stories} onChange={(e) => setStories(e.target.value)} placeholder="32" min={1} />
            </div>
            <div className="space-y-1.5">
              <Label>Total Units</Label>
              <Input type="number" value={totalUnits} onChange={(e) => setTotalUnits(e.target.value)} placeholder="280" min={1} />
            </div>
          </div>
        </Section>

        {/* Section: Hero Image */}
        <Section title="Hero Image" subtitle="Full-width background for the deck cover"
          badge={heroImageUrl && linkedProjectId ? "From project" : undefined}>
          <div className="space-y-4">
            {heroImageUrl ? (
              <div className="relative rounded-xl overflow-hidden aspect-video">
                <img src={heroImageUrl} alt="Hero" className="w-full h-full object-cover" />
                <div className="absolute top-2 right-2 flex gap-2">
                  <Button variant="secondary" size="sm" onClick={() => heroInputRef.current?.click()}>
                    <Upload className="h-4 w-4 mr-1" /> Replace
                  </Button>
                  <Button variant="destructive" size="sm" onClick={() => setHeroImageUrl("")}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ) : (
              <div className="border-2 border-dashed border-border rounded-xl aspect-video flex flex-col items-center justify-center gap-3 cursor-pointer hover:border-primary/50 transition-colors bg-muted/30"
                onClick={() => heroInputRef.current?.click()}>
                {heroUploading
                  ? <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  : <>
                      <Image className="h-10 w-10 text-muted-foreground/40" />
                      <div className="text-center">
                        <p className="font-medium text-sm text-foreground">Upload hero image</p>
                        <p className="text-xs text-muted-foreground">Full-width background for the deck</p>
                      </div>
                    </>
                }
              </div>
            )}
          </div>
        </Section>

        {/* Section: Floor Plans — AI Analysis */}
        <Section title={`Floor Plans (${floorPlans.length}/6)`}
          subtitle="Upload floor plan images or PDFs — AI auto-fills unit details & projections">
          <div className="space-y-4">

            {/* AI info banner */}
            <div className="flex items-start gap-3 p-3 rounded-lg bg-primary/5 border border-primary/20">
              <Wand2 className="h-4 w-4 text-primary mt-0.5 shrink-0" />
              <div>
                <p className="text-xs font-semibold text-foreground">AI-Powered Floor Plan Analysis</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Upload a floor plan image or PDF — AI reads unit type, size, beds/baths and automatically
                  generates rental estimates and cap rate projections based on BC market data.
                </p>
              </div>
            </div>

            {floorPlans.map((fp, idx) => (
              <div key={fp.id} className="p-4 rounded-xl border border-border/50 bg-muted/20 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-muted-foreground uppercase">Unit {idx + 1}</span>
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => removeFloorPlan(fp.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>

                {/* Floor plan image + AI trigger */}
                <div className="flex items-start gap-3">
                  {fp.image_url ? (
                    <div className="relative h-20 w-28 rounded-lg overflow-hidden shrink-0 border border-border">
                      <img src={fp.image_url} alt="" className="w-full h-full object-cover" />
                      <button className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity"
                        onClick={() => updateFloorPlan(fp.id, "image_url", undefined)}>
                        <Trash2 className="h-4 w-4 text-white" />
                      </button>
                    </div>
                  ) : (
                    <div
                      className="h-20 w-28 rounded-lg border-2 border-dashed border-border bg-muted/30 flex flex-col items-center justify-center gap-1 cursor-pointer hover:border-primary/50 transition-colors shrink-0"
                      onClick={() => fpInputRefs.current[fp.id]?.click()}
                    >
                      {analyzingFp === fp.id
                        ? <Loader2 className="h-5 w-5 animate-spin text-primary" />
                        : <>
                            <Wand2 className="h-4 w-4 text-primary/60" />
                            <span className="text-[9px] text-muted-foreground text-center leading-tight px-1">
                              Upload for AI analysis
                            </span>
                          </>
                      }
                    </div>
                  )}

                  <div className="flex-1 space-y-2">
                    {/* AI extracted badge */}
                    {fp.beds != null && (
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge variant="secondary" className="text-[10px] h-5">
                          <Wand2 className="h-2.5 w-2.5 mr-1" />AI Extracted
                        </Badge>
                        {fp.beds != null && <Badge variant="outline" className="text-[10px] h-5">{fp.beds}bd/{fp.baths}ba</Badge>}
                        {fp.interior_sqft && <Badge variant="outline" className="text-[10px] h-5">{fp.interior_sqft} sq ft</Badge>}
                        {fp.exposure && <Badge variant="outline" className="text-[10px] h-5">{fp.exposure}</Badge>}
                      </div>
                    )}
                    <Button type="button" variant="outline" size="sm" className="text-xs w-full"
                      onClick={() => fpInputRefs.current[fp.id]?.click()}
                      disabled={analyzingFp === fp.id}>
                      {analyzingFp === fp.id
                        ? <><Loader2 className="h-3 w-3 mr-1 animate-spin" />Analyzing…</>
                        : <><Upload className="h-3 w-3 mr-1" />{fp.image_url ? "Replace & Re-analyze" : "Upload Floor Plan (AI)"}</>
                      }
                    </Button>
                  </div>
                </div>

                {/* Editable fields — pre-filled by AI */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-1.5">
                      <Label className="text-xs">Unit Type</Label>
                      {fp.beds != null && fp.unit_type && (
                        <span className="text-[9px] font-semibold text-primary bg-primary/10 border border-primary/20 px-1.5 py-0.5 rounded-full flex items-center gap-0.5">
                          <Wand2 className="h-2.5 w-2.5" />AI
                        </span>
                      )}
                    </div>
                    <Select value={fp.unit_type} onValueChange={(v) => updateFloorPlan(fp.id, "unit_type", v)}>
                      <SelectTrigger className="h-9">
                        <SelectValue placeholder="Select type…" />
                      </SelectTrigger>
                      <SelectContent position="popper" side="bottom">
                        {UNIT_TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Size Range</Label>
                    <Input className="h-9" value={fp.size_range} onChange={(e) => updateFloorPlan(fp.id, "size_range", e.target.value)} placeholder="540–680 sq ft" />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Price From</Label>
                    <Input className="h-9" value={fp.price_from} onChange={(e) => updateFloorPlan(fp.id, "price_from", e.target.value)} placeholder="$599,900" />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Price / sqft</Label>
                    <Input className="h-9"
                      value={fp.price_per_sqft || ""}
                      onChange={(e) => updateFloorPlan(fp.id, "price_per_sqft", e.target.value)}
                      placeholder="$1,050/sqft" />
                  </div>
                </div>
              </div>
            ))}

            {floorPlans.length < 6 && (
              <Button variant="outline" onClick={addFloorPlan} className="w-full">
                <Plus className="h-4 w-4 mr-2" />Add Floor Plan
              </Button>
            )}
          </div>
        </Section>

        {/* Section: Gallery */}
        <Section title={`Photo Gallery (${gallery.length}/12)`}
          subtitle="Project photos shown in the gallery section"
          badge={gallery.length > 0 && linkedProjectId ? "From project" : undefined}>
          <div className="space-y-4">
            {gallery.length > 0 && (
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                {gallery.map((url, i) => (
                  <div key={i} className="relative aspect-square rounded-lg overflow-hidden group">
                    <img src={url} alt="" className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center gap-1 opacity-0 group-hover:opacity-100">
                      <button className="p-1 bg-white/80 rounded"
                        onClick={() => setGallery((g) => { const n = [...g]; [n[i - 1], n[i]] = [n[i], n[i - 1]]; return n; })} disabled={i === 0}>
                        <ArrowUp className="h-3 w-3" />
                      </button>
                      <button className="p-1 bg-white/80 rounded"
                        onClick={() => setGallery((g) => { const n = [...g]; [n[i], n[i + 1]] = [n[i + 1], n[i]]; return n; })} disabled={i === gallery.length - 1}>
                        <ArrowDown className="h-3 w-3" />
                      </button>
                      <button className="p-1 bg-white/80 rounded" onClick={() => setGallery((g) => g.filter((_, idx) => idx !== i))}>
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
            {gallery.length < 12 && (
              <Button variant="outline" onClick={() => galleryInputRef.current?.click()} disabled={galleryUploading}>
                <Upload className="h-4 w-4 mr-2" />
                {galleryUploading ? "Uploading..." : `Add Photos (${gallery.length}/12)`}
              </Button>
            )}
            <p className="text-xs text-muted-foreground">First photo appears larger. Use arrows to reorder.</p>
          </div>
        </Section>

        {/* Section: Location */}
        <Section title="Location & Proximity"
          subtitle="Map coordinates and nearby points of interest"
          badge={linkedProjectId && (lat || lng) ? "Coords from project" : undefined}>
          <div className="space-y-4">
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
            {highlights.map((h, i) => (
              <div key={i} className="flex items-center gap-2">
                <Input className="w-14 h-9 text-center" value={h.icon} onChange={(e) => updateHighlight(i, "icon", e.target.value)} placeholder="🚇" />
                <Input className="flex-1 h-9" value={h.label} onChange={(e) => updateHighlight(i, "label", e.target.value)} placeholder="SkyTrain Station" />
                <Input className="w-28 h-9" value={h.distance} onChange={(e) => updateHighlight(i, "distance", e.target.value)} placeholder="5 min walk" />
                <Button variant="ghost" size="icon" className="h-9 w-9 shrink-0" onClick={() => removeHighlight(i)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
            <Button variant="outline" size="sm" onClick={addHighlight}>
              <Plus className="h-4 w-4 mr-2" />Add Highlight
            </Button>
          </div>
        </Section>

        {/* Section: Investment Projections — AI-generated from floor plans */}
        <Section title="Investment Projections"
          subtitle="Rental estimates, cap rates and appreciation forecast"
          badge={projectionsFromAI ? "AI Generated" : undefined}>
          <div className="space-y-4">
            {projectionsFromAI && (
              <div className="flex items-start gap-3 p-3 rounded-lg bg-muted border border-border">
                <TrendingUp className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                <div>
                  <p className="text-xs font-semibold text-foreground">Projections generated from floor plan data</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Based on AI-extracted unit size and type using BC CMHC rental benchmarks. All values editable.
                  </p>
                </div>
              </div>
            )}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="flex items-center gap-1.5">
                  <DollarSign className="h-3.5 w-3.5 text-muted-foreground" />Monthly Rental Min
                </Label>
                <Input type="number" value={rentalMin} onChange={(e) => setRentalMin(e.target.value)} placeholder="2200" />
              </div>
              <div className="space-y-1.5">
                <Label className="flex items-center gap-1.5">
                  <DollarSign className="h-3.5 w-3.5 text-muted-foreground" />Monthly Rental Max
                </Label>
                <Input type="number" value={rentalMax} onChange={(e) => setRentalMax(e.target.value)} placeholder="2800" />
              </div>
              <div className="space-y-1.5">
                <Label>Cap Rate Min (%)</Label>
                <Input type="number" value={capRateMin} onChange={(e) => setCapRateMin(e.target.value)} placeholder="3.5" step="0.1" />
              </div>
              <div className="space-y-1.5">
                <Label>Cap Rate Max (%)</Label>
                <Input type="number" value={capRateMax} onChange={(e) => setCapRateMax(e.target.value)} placeholder="4.5" step="0.1" />
              </div>
              <div className="col-span-2">
                <Label className="mb-2 block">Annual Appreciation Forecast (Year 1–5 %)</Label>
                <div className="grid grid-cols-5 gap-2">
                  {appreciation.map((v, i) => (
                    <div key={i} className="space-y-1">
                      <Label className="text-xs text-muted-foreground">Yr {i + 1}</Label>
                      <Input type="number" className="h-9" value={v}
                        onChange={(e) => setAppreciation((prev) => { const n = [...prev]; n[i] = e.target.value; return n; })}
                        step="0.5" placeholder="5" />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </Section>

        {/* Section: Agent / Contact */}
        <Section title="Agent Contact" subtitle="Choose which agent appears on the deck">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {agents.length > 0 ? agents.map((agent) => (
              <button
                key={agent.user_id}
                type="button"
                onClick={() => applyAgentProfile(agent)}
                className={`flex items-center gap-3 p-3 rounded-xl border text-left transition-all ${
                  selectedAgentId === agent.user_id
                    ? "border-primary bg-primary/5 shadow-sm"
                    : "border-border bg-background hover:bg-accent/20"
                }`}
              >
                <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                  <span className="text-xs font-bold text-primary">
                    {(agent.full_name || "?").split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-foreground truncate">{agent.full_name}</p>
                  <p className="text-xs text-muted-foreground truncate">{agent.phone || agent.email}</p>
                </div>
                {selectedAgentId === agent.user_id && (
                  <div className="h-2 w-2 rounded-full bg-primary shrink-0" />
                )}
              </button>
            )) : (
              <p className="text-sm text-muted-foreground col-span-3">No agent profiles found.</p>
            )}
          </div>
        </Section>

        {/* Section: URL Slug */}
        <Section title="URL & Publishing" subtitle="Customize the public share link" defaultOpen={true}>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label>URL Slug *</Label>
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground shrink-0">/deck/</span>
                <Input
                  value={slug}
                  onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))}
                  onBlur={() => checkSlug(slug)}
                  placeholder="aurora-surrey"
                  className={slugTaken ? "border-destructive" : ""}
                />
              </div>
              {slugTaken && <p className="text-xs text-destructive">This slug is already taken.</p>}
            </div>
            {slug && !slugTaken && (
            <div className="rounded-lg border border-primary/30 bg-primary/5 p-3 space-y-2">
                <p className="text-xs font-semibold text-foreground">Your deck URL:</p>
                <div className="flex items-center gap-2">
                  <code className="flex-1 text-xs bg-background border border-border rounded px-3 py-2 text-primary font-mono truncate">
                    https://presaleproperties.com/deck/{slug}
                  </code>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      navigator.clipboard.writeText(`https://presaleproperties.com/deck/${slug}`);
                      toast.success("URL copied to clipboard!");
                    }}
                  >
                    <Copy className="h-3.5 w-3.5 mr-1" />Copy
                  </Button>
                  <Button type="button" variant="outline" size="sm" asChild>
                    <a href={`/deck/${slug}`} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="h-3.5 w-3.5 mr-1" />Open
                    </a>
                  </Button>
                </div>
                {!isPublished && (
                  <p className="text-xs text-muted-foreground">⚠️ Deck is currently a draft — toggle Published above to make it live.</p>
                )}
              </div>
            )}
          </div>
        </Section>

        {/* Footer save */}
        <div className="flex justify-end gap-3 pt-2">
          <Button variant="outline" onClick={() => navigate("/dashboard/decks")}>Cancel</Button>
          <Button onClick={handleSave} disabled={saving || slugTaken}>
            {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
            {saving ? "Saving..." : isEdit ? "Save Changes" : "Create Deck"}
          </Button>
        </div>
      </div>
    </DashboardLayout>
  );
}
