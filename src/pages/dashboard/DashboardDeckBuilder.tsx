import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import {
  Plus, Trash2, Loader2, Upload, Image, ArrowUp, ArrowDown,
  ChevronDown, ChevronUp, Save, Eye, Search, Building2, Sparkles, X,
  Wand2, DollarSign, Copy, ExternalLink, CheckCircle2, GripVertical,
  Monitor, Smartphone, RefreshCw,
} from "lucide-react";
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable";

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
  full_description: string | null;
  highlights: string[] | null;
  amenities: string[] | null;
}

interface AgentProfile {
  id: string; full_name: string; title: string | null;
  photo_url: string | null; email: string | null; phone: string | null;
}

interface FloorPlan {
  id: string; unit_type: string; size_range: string; price_from: string;
  price_per_sqft?: string; tags: string[]; image_url?: string;
  beds?: number | null; baths?: number | null; exposure?: string | null;
  interior_sqft?: number | null; exterior_sqft?: number | null;
  projected_rent?: number | null; exclusive_credit?: string;
}

interface ProximityHighlight { icon: string; label: string; distance: string; }

interface DepositStep {
  id: string; label: string; percent: number; timing: string; note?: string;
}

const DEFAULT_DEPOSIT_STEPS: DepositStep[] = [
  { id: "d1", label: "Upon Signing", percent: 2.5, timing: "Due within 7 days", note: "Paid to the developer's trust account." },
  { id: "d2", label: "2nd Deposit", percent: 2.5, timing: "Due in 3 months", note: "Due within 90 days of signing." },
  { id: "d3", label: "3rd Deposit", percent: 5, timing: "Due in 6 months", note: "Due within 180 days. Nothing more until completion." },
];

interface SectionProps {
  title: string; subtitle?: string; children: React.ReactNode;
  defaultOpen?: boolean; badge?: string; step?: number;
}

function Section({ title, subtitle, children, defaultOpen = true, badge, step }: SectionProps) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <Card className="overflow-hidden">
      <button
        type="button"
        className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-muted/30 transition-colors"
        onClick={() => setOpen((o) => !o)}
      >
        <div className="flex items-center gap-3 min-w-0">
          {step && (
            <span className="flex-shrink-0 h-6 w-6 rounded-full bg-primary/10 text-primary text-[11px] font-bold flex items-center justify-center">
              {step}
            </span>
          )}
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-semibold text-foreground text-sm">{title}</span>
              {badge && <Badge variant="secondary" className="text-[10px] h-4 px-1.5">{badge}</Badge>}
            </div>
            {subtitle && <p className="text-xs text-muted-foreground mt-0.5 leading-snug">{subtitle}</p>}
          </div>
        </div>
        {open ? <ChevronUp className="h-4 w-4 text-muted-foreground shrink-0 ml-2" /> : <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0 ml-2" />}
      </button>
      {open && <CardContent className="pt-0 pb-5 px-5">{children}</CardContent>}
    </Card>
  );
}

function genSlug(name: string) {
  return name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "").slice(0, 80);
}
function nanoid() { return Math.random().toString(36).slice(2, 10); }

function TagInput({ items, onAdd, onRemove, placeholder = "Add item…" }: {
  items: string[]; onAdd: (v: string) => void; onRemove: (i: number) => void; placeholder?: string;
}) {
  const [val, setVal] = useState("");
  const submit = () => { const t = val.trim(); if (t) { onAdd(t); setVal(""); } };
  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        {items.map((item, i) => (
          <div key={i} className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-muted border border-border/60 text-sm font-medium text-foreground">
            {item}
            <button type="button" onClick={() => onRemove(i)} className="ml-1 text-muted-foreground hover:text-destructive transition-colors">
              <X className="h-3 w-3" />
            </button>
          </div>
        ))}
        <div className="flex items-center gap-1">
          <input
            type="text" value={val}
            onChange={(e) => setVal(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); submit(); } }}
            placeholder={placeholder}
            className="h-8 px-3 text-sm rounded-full border border-dashed border-border bg-background focus:outline-none focus:border-primary/50 w-32"
          />
          <button type="button" onClick={submit}
            className="h-8 w-8 flex items-center justify-center rounded-full border border-dashed border-border hover:border-primary/50 bg-background text-muted-foreground hover:text-primary transition-colors">
            <Plus className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}

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
  const [previewMode, setPreviewMode] = useState<"desktop" | "mobile">("desktop");
  const [previewKey, setPreviewKey] = useState(0);

  const [agents, setAgents] = useState<AgentProfile[]>([]);
  const [selectedAgentId, setSelectedAgentId] = useState<string | null>(null);

  // Project details
  const [projectName, setProjectName] = useState("");
  const [tagline, setTagline] = useState("");
  const [city, setCity] = useState("");
  const [address, setAddress] = useState("");
  const [developerName, setDeveloperName] = useState("");
  const [completionYear, setCompletionYear] = useState("");
  const [lat, setLat] = useState<string>("");
  const [lng, setLng] = useState<string>("");

  // Hero image
  const [heroImageUrl, setHeroImageUrl] = useState("");
  const [heroUploading, setHeroUploading] = useState(false);
  const heroInputRef = useRef<HTMLInputElement>(null);

  // Floor plans
  const [floorPlans, setFloorPlans] = useState<FloorPlan[]>([]);
  const [analyzingFp, setAnalyzingFp] = useState<string | null>(null);
  const fpInputRefs = useRef<Record<string, HTMLInputElement | null>>({});
  const dragFpIdx = useRef<number | null>(null);
  const [dragOverFpIdx, setDragOverFpIdx] = useState<number | null>(null);

  // Gallery
  const [gallery, setGallery] = useState<string[]>([]);
  const [galleryUploading, setGalleryUploading] = useState(false);
  const galleryInputRef = useRef<HTMLInputElement>(null);

  // PDF
  const [floorPlansPdfUrl, setFloorPlansPdfUrl] = useState("");
  const [pdfUploading, setPdfUploading] = useState(false);
  const pdfInputRef = useRef<HTMLInputElement>(null);

  // Location
  const [highlights, setHighlights] = useState<ProximityHighlight[]>([
    { icon: "🚇", label: "SkyTrain Station", distance: "5 min walk" },
  ]);

  // Investment
  const [appreciationRate, setAppreciationRate] = useState("5");
  const [projectionsFromAI, setProjectionsFromAI] = useState(false);

  // Deposits
  const [depositSteps, setDepositSteps] = useState<DepositStep[]>(DEFAULT_DEPOSIT_STEPS);

  // Contact
  const [contactName, setContactName] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [contactWhatsapp, setContactWhatsapp] = useState("");

  // Key facts
  const [assignmentFee, setAssignmentFee] = useState("");
  const [includedItems, setIncludedItems] = useState<string[]>(["1 Parking Stall", "1 Storage Locker", "AC"]);

  // About (description pulled from project)
  const [description, setDescription] = useState<string>("");
  const [deckHighlights, setDeckHighlights] = useState<string[]>([]);
  const [deckAmenities, setDeckAmenities] = useState<string[]>([]);

  // Scarcity
  const [unitsRemaining, setUnitsRemaining] = useState<string>("");
  const [nextPriceIncrease, setNextPriceIncrease] = useState<string>("");

  // Lead Gate
  const ALL_GATE_SECTIONS = [
    { id: "floor-plans", label: "Floor Plans & Pricing" },
    { id: "deposit-timeline", label: "Deposit Timeline" },
    { id: "projections", label: "Investment Calculator" },
  ] as const;
  const [gateEnabled, setGateEnabled] = useState(true);
  const [gatedSections, setGatedSections] = useState<string[]>(["floor-plans", "deposit-timeline", "projections"]);

  // Publishing
  const [slug, setSlug] = useState("");
  const [slugTaken, setSlugTaken] = useState(false);
  const [isPublished, setIsPublished] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(isEdit);

  // Fetch projects
  useEffect(() => {
    (async () => {
      setLoadingProjects(true);
      const { data } = await (supabase as any)
        .from("presale_projects")
        .select("id,name,city,neighborhood,address,developer_name,starting_price,completion_year,featured_image,gallery_images,floorplan_files,map_lat,map_lng,short_description,occupancy_estimate,full_description,highlights,amenities")
        .order("name");
      setProjects(data || []);
      setLoadingProjects(false);
    })();
  }, []);

  const applyAgentProfile = useCallback((agent: AgentProfile) => {
    setContactName(agent.full_name || "");
    setContactPhone(agent.phone || "");
    setContactEmail(agent.email || "");
    setContactWhatsapp(agent.phone ? agent.phone.replace(/\D/g, "") : "");
    setSelectedAgentId(agent.id || null);
  }, []);

  // Fetch team members
  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("team_members")
        .select("id, full_name, title, photo_url, email, phone")
        .eq("is_active", true)
        .order("sort_order", { ascending: true });
      if (data?.length) {
        setAgents(data as AgentProfile[]);
        if (!isEdit) applyAgentProfile((data as AgentProfile[])[0]);
      }
    })();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) setShowProjectDropdown(false);
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
    setCity([p.city, p.neighborhood].filter(Boolean).join(", ") || p.city || "");
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
    // Always sync description / highlights / amenities from project
    if (p.full_description) setDescription(p.full_description);
    if (p.highlights?.length) setDeckHighlights(p.highlights);
    if (p.amenities?.length) setDeckAmenities(p.amenities);
    toast.success(`"${p.name}" loaded — review and adjust as needed.`);
  }, [heroImageUrl, tagline]);

  // Load existing deck for edit
  useEffect(() => {
    if (!isEdit || !id) return;
    (async () => {
      const { data, error } = await (supabase as any).from("pitch_decks").select("*").eq("id", id).single();
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
      const firstRate = p.appreciation?.[0];
      setAppreciationRate(firstRate != null ? String(firstRate) : "5");
      setContactName(data.contact_name || "");
      setContactPhone(data.contact_phone || "");
      setContactEmail(data.contact_email || "");
      setContactWhatsapp(data.contact_whatsapp || "");
      if (data.deposit_steps?.length) setDepositSteps(data.deposit_steps);
      setFloorPlansPdfUrl(data.floor_plans_pdf_url || "");
      setAssignmentFee(data.assignment_fee || "");
      setIncludedItems(data.included_items?.length ? data.included_items : ["1 Parking Stall", "1 Storage Locker", "AC"]);
      setUnitsRemaining(data.units_remaining != null ? String(data.units_remaining) : "");
      setNextPriceIncrease(data.next_price_increase || "");
      setDescription(data.description || "");
      setDeckHighlights(data.highlights || []);
      setDeckAmenities(data.amenities || []);
      setSlug(data.slug || "");
      setIsPublished(data.is_published || false);
      setGateEnabled(data.gate_enabled !== false); // default true if null
      setGatedSections(data.gated_sections?.length ? data.gated_sections : ["floor-plans", "deposit-timeline", "projections"]);
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
      if (fnError || !fnData?.success) { toast.error("AI analysis failed — fill in manually"); setAnalyzingFp(null); return; }
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

  const handlePdfUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    if (file.type !== "application/pdf") { toast.error("Please upload a PDF file"); return; }
    setPdfUploading(true);
    const url = await uploadFile(file, `pitch-decks/${user.id}/floor-plans-${Date.now()}.pdf`);
    if (url) { setFloorPlansPdfUrl(url); toast.success("Floor plans PDF uploaded!"); }
    setPdfUploading(false);
  };

  const addFloorPlan = () => {
    if (floorPlans.length >= 6) return;
    setFloorPlans((prev) => [...prev, { id: nanoid(), unit_type: "1 Bed", size_range: "", price_from: "", tags: [] }]);
  };
  const updateFloorPlan = (fpId: string, field: keyof FloorPlan, value: any) => {
    setFloorPlans((prev) => prev.map((fp) => fp.id === fpId ? { ...fp, [field]: value } : fp));
  };
  const removeFloorPlan = (fpId: string) => setFloorPlans((prev) => prev.filter((fp) => fp.id !== fpId));

  const handleFpDragStart = (idx: number) => { dragFpIdx.current = idx; };
  const handleFpDragOver = (e: React.DragEvent, idx: number) => { e.preventDefault(); setDragOverFpIdx(idx); };
  const handleFpDrop = (idx: number) => {
    const from = dragFpIdx.current;
    if (from === null || from === idx) { dragFpIdx.current = null; setDragOverFpIdx(null); return; }
    setFloorPlans((prev) => {
      const next = [...prev];
      const [moved] = next.splice(from, 1);
      next.splice(idx, 0, moved);
      return next;
    });
    dragFpIdx.current = null;
    setDragOverFpIdx(null);
  };
  const handleFpDragEnd = () => { dragFpIdx.current = null; setDragOverFpIdx(null); };

  const addHighlight = () => setHighlights((prev) => [...prev, { icon: "📍", label: "", distance: "" }]);
  const updateHighlight = (i: number, field: keyof ProximityHighlight, value: string) => {
    setHighlights((prev) => prev.map((h, idx) => idx === i ? { ...h, [field]: value } : h));
  };
  const removeHighlight = (i: number) => setHighlights((prev) => prev.filter((_, idx) => idx !== i));

  const handleSave = async () => {
    if (!user) return;
    if (!projectName) { toast.error("Project name is required"); return; }
    if (!slug) { toast.error("URL slug is required"); return; }
    if (slugTaken) { toast.error("That URL slug is already taken"); return; }
    setSaving(true);
    const payload: any = {
      user_id: user.id, slug, project_name: projectName, tagline, city, address,
      developer_name: developerName, completion_year: completionYear,
      hero_image_url: heroImageUrl, floor_plans: floorPlans, gallery,
      proximity_highlights: highlights, deposit_steps: depositSteps,
      projections: { appreciation: buildAppreciation() },
      contact_name: contactName, contact_phone: contactPhone,
      contact_email: contactEmail, contact_whatsapp: contactWhatsapp,
      is_published: isPublished, linked_project_id: linkedProjectId,
      lat: lat ? parseFloat(lat) : null,
      lng: lng ? parseFloat(lng) : null,
      floor_plans_pdf_url: floorPlansPdfUrl || null,
      assignment_fee: assignmentFee || null,
      included_items: includedItems.filter(Boolean),
      units_remaining: unitsRemaining ? parseInt(unitsRemaining, 10) : null,
      next_price_increase: nextPriceIncrease || null,
      description: description || null,
      highlights: deckHighlights.filter(Boolean),
      amenities: deckAmenities.filter(Boolean),
      gate_enabled: gateEnabled,
      gated_sections: gatedSections,
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

  function buildAppreciation() {
    const base = parseFloat(appreciationRate) || 5;
    return [base, base + 0.5, base + 0.5, base + 1, base + 1];
  }

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
    <DashboardLayout noPadding>
      {/* Hidden file inputs */}
      <input type="file" ref={heroInputRef} className="hidden" accept="image/*" onChange={handleHeroUpload} />
      <input type="file" ref={galleryInputRef} className="hidden" accept="image/*" multiple onChange={handleGalleryUpload} />
      <input type="file" ref={pdfInputRef} className="hidden" accept="application/pdf" onChange={handlePdfUpload} />
      {floorPlans.map((fp) => (
        <input key={fp.id} type="file" accept="image/*,application/pdf" className="hidden"
          ref={(el) => { fpInputRefs.current[fp.id] = el; }}
          onChange={(e) => handleFloorPlanUpload(e, fp.id)} />
      ))}

      {/* Two-column layout: builder left, resizable preview right */}
      <ResizablePanelGroup direction="horizontal" className="min-h-screen">
        <ResizablePanel defaultSize={65} minSize={40}>
        {/* Builder column */}
        <div className="overflow-y-auto h-screen">
        <div className="max-w-2xl mx-auto space-y-3 pb-28 px-4 md:px-6 pt-6">

        {/* Page header */}
        <div className="flex items-center justify-between gap-4 pb-1">
          <div>
            <h1 className="text-xl font-bold text-foreground">
              {isEdit ? (projectName || "Edit Deck") : "New Pitch Deck"}
            </h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              {isPublished ? "🟢 Published" : "⚪ Draft"}{slug ? ` · /deck/${slug}` : ""}
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {isEdit && slug && (
              <Button variant="outline" size="sm" asChild>
                <a href={`/deck/${slug}`} target="_blank" rel="noopener noreferrer">
                  <Eye className="h-3.5 w-3.5 mr-1.5" />Preview
                </a>
              </Button>
            )}
          </div>
        </div>

        {/* ── STEP 1: Link Project ── */}
        <div className="rounded-xl border border-primary/30 bg-primary/5 p-4 space-y-3">
          <div className="flex items-center gap-2">
            <span className="h-6 w-6 rounded-full bg-primary text-primary-foreground text-[11px] font-bold flex items-center justify-center shrink-0">1</span>
            <p className="text-sm font-semibold text-foreground">Link a Project</p>
            <Badge variant="outline" className="text-[10px] ml-auto border-primary/40 text-primary">Auto-fills everything</Badge>
          </div>
          {linkedProjectId ? (
            <div className="flex items-center gap-3 p-3 rounded-lg bg-background border border-border">
              <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold truncate">{linkedProjectName}</p>
                <p className="text-xs text-muted-foreground">Linked — all fields synced from project</p>
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
                  type="text" value={projectSearch}
                  onChange={(e) => { setProjectSearch(e.target.value); setShowProjectDropdown(true); }}
                  onFocus={() => setShowProjectDropdown(true)}
                  placeholder={loadingProjects ? "Loading…" : "Search by project name or city…"}
                  disabled={loadingProjects}
                  className="w-full h-10 pl-9 pr-4 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/50"
                />
              </div>
              {showProjectDropdown && filteredProjects.length > 0 && (
                <div className="absolute z-50 top-full mt-1 left-0 right-0 rounded-xl border border-border bg-card shadow-xl overflow-hidden">
                  {filteredProjects.map((p) => (
                    <button key={p.id} type="button" onClick={() => applyProject(p)}
                      className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-accent/50 transition-colors border-b border-border/40 last:border-0">
                      {p.featured_image
                        ? <img src={p.featured_image} alt="" className="h-10 w-14 rounded object-cover shrink-0" />
                        : <div className="h-10 w-14 rounded bg-muted flex items-center justify-center shrink-0"><Building2 className="h-4 w-4 text-muted-foreground" /></div>
                      }
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold truncate">{p.name}</p>
                        <p className="text-xs text-muted-foreground">{[p.city, p.neighborhood].filter(Boolean).join(" · ")}</p>
                      </div>
                      {p.starting_price && (
                        <span className="text-xs font-semibold text-primary shrink-0">from ${(p.starting_price / 1000).toFixed(0)}K</span>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* ── STEP 2: Hero Image ── */}
        <Section step={2} title="Hero Image" subtitle="Full-width cover photo" badge={heroImageUrl ? "✓ Set" : undefined}>
          {heroImageUrl ? (
            <div className="relative rounded-xl overflow-hidden aspect-video">
              <img src={heroImageUrl} alt="Hero" className="w-full h-full object-cover" />
              <div className="absolute top-2 right-2 flex gap-2">
                <Button variant="secondary" size="sm" onClick={() => heroInputRef.current?.click()}>
                  <Upload className="h-3.5 w-3.5 mr-1" />Replace
                </Button>
                <Button variant="destructive" size="sm" onClick={() => setHeroImageUrl("")}>
                  <Trash2 className="h-3.5 w-3.5" />
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
                    <p className="text-xs text-muted-foreground">JPG, PNG — landscape recommended (16:9)</p>
                  </>
              }
            </div>
          )}
        </Section>

        {/* ── STEP 3: Project Details ── */}
        <Section step={3} title="Project Details" badge={linkedProjectId ? "Synced" : undefined}>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2 space-y-1.5">
              <Label>Project Name *</Label>
              <Input value={projectName} onChange={(e) => setProjectName(e.target.value)} placeholder="Aurora Surrey" />
            </div>
            <div className="sm:col-span-2 space-y-1.5">
              <Label>Tagline <span className="text-muted-foreground font-normal text-xs">(shown under project name)</span></Label>
              <Input value={tagline} onChange={(e) => setTagline(e.target.value)} placeholder="Presale Opportunity — Surrey City Centre · 2027" />
            </div>
            <div className="space-y-1.5">
              <Label>City / Neighbourhood</Label>
              <Input value={city} onChange={(e) => setCity(e.target.value)} placeholder="Surrey, BC" />
            </div>
            <div className="space-y-1.5">
              <Label>Completion / Occupancy</Label>
              <Input value={completionYear} onChange={(e) => setCompletionYear(e.target.value)} placeholder="Spring 2027" />
            </div>
            <div className="space-y-1.5">
              <Label>Developer</Label>
              <Input value={developerName} onChange={(e) => setDeveloperName(e.target.value)} placeholder="Bosa Development" />
            </div>
            <div className="space-y-1.5">
              <Label>Full Address</Label>
              <Input value={address} onChange={(e) => setAddress(e.target.value)} placeholder="10188 City Pkwy, Surrey" />
            </div>
          </div>
        </Section>

        {/* ── STEP 4: About the Project ── */}
        <Section step={4} title="About the Project"
          subtitle="Description & amenities — synced from project page"
          defaultOpen={false}
          badge={(description || deckHighlights.length > 0 || deckAmenities.length > 0) ? "✓ Set" : undefined}>
          <div className="space-y-5">
            <div className="space-y-1.5">
              <Label>Project Description <span className="text-muted-foreground font-normal text-xs">(Markdown supported)</span></Label>
              <textarea
                className="w-full min-h-[140px] rounded-lg border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/50 resize-y"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder={"Welcome to **Eden** by Zenterra…\n\nLocated near parks and walking trails…"}
              />
              <p className="text-xs text-muted-foreground">Use **bold** for emphasis. Auto-synced from linked project.</p>
            </div>

            <div className="space-y-2">
              <Label>Feature Highlights <span className="text-muted-foreground font-normal text-xs">(bullet list)</span></Label>
              {deckHighlights.map((item, i) => (
                <div key={i} className="flex items-center gap-2">
                  <Input
                    className="h-8 text-xs flex-1" value={item}
                    onChange={(e) => setDeckHighlights((prev) => prev.map((h, idx) => idx === i ? e.target.value : h))}
                    placeholder="Over 2 acres of lush green spaces"
                  />
                  <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0 text-muted-foreground hover:text-destructive"
                    onClick={() => setDeckHighlights((prev) => prev.filter((_, idx) => idx !== i))}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              ))}
              <Button variant="outline" size="sm" onClick={() => setDeckHighlights((prev) => [...prev, ""])}>
                <Plus className="h-4 w-4 mr-2" />Add Highlight
              </Button>
            </div>

            <div className="space-y-2">
              <Label>Building Amenities</Label>
              <TagInput
                items={deckAmenities}
                onAdd={(v) => { if (v && !deckAmenities.includes(v)) setDeckAmenities((p) => [...p, v]); }}
                onRemove={(i) => setDeckAmenities((prev) => prev.filter((_, idx) => idx !== i))}
                placeholder="Add amenity…"
              />
            </div>
          </div>
        </Section>

        {/* ── STEP 5: Floor Plans ── */}
        <Section step={5} title={`Floor Plans (${floorPlans.length}/6)`}
          subtitle="Upload image — AI auto-fills size, type & pricing">
          <div className="space-y-3">
            {floorPlans.map((fp, idx) => (
              <div
                key={fp.id}
                draggable
                onDragStart={() => handleFpDragStart(idx)}
                onDragOver={(e) => handleFpDragOver(e, idx)}
                onDrop={() => handleFpDrop(idx)}
                onDragEnd={handleFpDragEnd}
                className={`p-4 rounded-xl border bg-muted/20 space-y-3 transition-all duration-150 ${
                  dragOverFpIdx === idx && dragFpIdx.current !== idx
                    ? "border-primary/60 ring-2 ring-primary/20 bg-primary/5"
                    : "border-border/50"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="cursor-grab active:cursor-grabbing text-muted-foreground/40 hover:text-muted-foreground transition-colors touch-none">
                      <GripVertical className="h-4 w-4" />
                    </div>
                    <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Unit {idx + 1}</span>
                  </div>
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
                    <div className="space-y-1">
                      <Label className="text-xs flex items-center gap-1"><DollarSign className="h-3 w-3" />Projected Rent/mo</Label>
                      <Input className="h-8 text-xs" type="number" value={fp.projected_rent ?? ""}
                        onChange={(e) => updateFloorPlan(fp.id, "projected_rent", e.target.value ? parseFloat(e.target.value) : null)} placeholder="2,300" />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Exclusive Credit</Label>
                      <Input className="h-8 text-xs" value={fp.exclusive_credit ?? ""}
                        onChange={(e) => updateFloorPlan(fp.id, "exclusive_credit", e.target.value)} placeholder="$10,000 off" />
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
                <Plus className="h-4 w-4 mr-2" />Add Unit
              </Button>
            )}

            {/* Assignment fee & included items */}
            <div className="pt-3 border-t border-border/40 space-y-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Assignment Fee <span className="text-muted-foreground font-normal">(e.g. $0 or $5,000 + GST)</span></Label>
                <Input
                  value={assignmentFee}
                  onChange={(e) => setAssignmentFee(e.target.value)}
                  placeholder="$0 — No Assignment Fee"
                  className="h-9"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">What's Included in Price</Label>
                <p className="text-xs text-muted-foreground">Be specific: e.g. "1 Parking Stall", "1 Storage Locker", "AC"</p>
                <TagInput
                  items={includedItems}
                  onAdd={(v) => { if (v && !includedItems.includes(v)) setIncludedItems((p) => [...p, v]); }}
                  onRemove={(i) => setIncludedItems((prev) => prev.filter((_, idx) => idx !== i))}
                  placeholder="1 Parking Stall…"
                />
              </div>
            </div>
          </div>
        </Section>

        {/* ── STEP 5b: Floor Plans PDF ── */}
        <Section title="Floor Plans PDF" subtitle="Full floor plan document (optional)" defaultOpen={false}
          badge={floorPlansPdfUrl ? "✓ Uploaded" : undefined}>
          {floorPlansPdfUrl ? (
            <div className="flex items-center gap-3 p-4 rounded-xl border border-border bg-muted/20">
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                <Upload className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-foreground">Floor Plans PDF</p>
                <a href={floorPlansPdfUrl} target="_blank" rel="noopener noreferrer"
                  className="text-xs text-primary hover:underline truncate block">View PDF ↗</a>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => pdfInputRef.current?.click()}>Replace</Button>
                <Button variant="ghost" size="sm" className="text-destructive" onClick={() => setFloorPlansPdfUrl("")}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ) : (
            <div
              className="border-2 border-dashed border-border rounded-xl p-8 flex flex-col items-center justify-center gap-3 cursor-pointer hover:border-primary/50 hover:bg-primary/5 transition-colors"
              onClick={() => pdfInputRef.current?.click()}
            >
              {pdfUploading ? <Loader2 className="h-8 w-8 animate-spin text-primary" /> : (
                <>
                  <Upload className="h-8 w-8 text-muted-foreground/40" />
                  <p className="text-sm font-medium text-foreground">Click to upload PDF</p>
                  <p className="text-xs text-muted-foreground">PDF only</p>
                </>
              )}
            </div>
          )}
        </Section>

        {/* ── STEP 6: Gallery ── */}
        <Section step={6} title={`Photo Gallery (${gallery.length}/12)`}
          subtitle="First image is the hero — drag to reorder"
          badge={gallery.length > 0 ? `${gallery.length} photos` : undefined}>
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
                {galleryUploading ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Uploading…</> : <><Upload className="h-4 w-4 mr-2" />Upload Photos</>}
              </Button>
            )}
          </div>
        </Section>

        {/* ── STEP 7: Location ── */}
        <Section step={7} title="Location & Nearby" defaultOpen={false}
          badge={lat ? "Coords set" : undefined}>
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
            <p className="text-xs text-muted-foreground font-medium">Nearby points of interest:</p>
            {highlights.map((h, i) => (
              <div key={i} className="flex items-center gap-2">
                <Input className="w-12 h-9 text-center px-1 text-base" value={h.icon}
                  onChange={(e) => updateHighlight(i, "icon", e.target.value)} />
                <Input className="flex-1 h-9 text-sm" value={h.label}
                  onChange={(e) => updateHighlight(i, "label", e.target.value)} placeholder="SkyTrain Station" />
                <Input className="w-24 h-9 text-sm" value={h.distance}
                  onChange={(e) => updateHighlight(i, "distance", e.target.value)} placeholder="5 min" />
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

        {/* ── STEP 8: Payment Plan ── */}
        <Section step={8} title={`Payment Plan (${depositSteps.length} deposits)`}
          subtitle="When do buyers pay? — defaults are 2.5% + 2.5% + 5% standard structure"
          defaultOpen={false}
          badge={depositSteps.length > 0 ? "✓ Set" : undefined}>
          <div className="space-y-3">
            {depositSteps.map((step, idx) => (
              <div key={step.id} className="p-4 rounded-xl border border-border/50 bg-muted/20 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Deposit {idx + 1}</span>
                  <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive"
                    onClick={() => setDepositSteps(prev => prev.filter(s => s.id !== step.id))}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <Label className="text-xs">Label</Label>
                    <Input className="h-8 text-xs" value={step.label}
                      onChange={e => setDepositSteps(prev => prev.map(s => s.id === step.id ? { ...s, label: e.target.value } : s))}
                      placeholder="Upon Signing" />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Timing</Label>
                    <Input className="h-8 text-xs" value={step.timing}
                      onChange={e => setDepositSteps(prev => prev.map(s => s.id === step.id ? { ...s, timing: e.target.value } : s))}
                      placeholder="Due in 7 days" />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Deposit %</Label>
                    <Input className="h-8 text-xs" type="number" step="0.5" value={step.percent}
                      onChange={e => setDepositSteps(prev => prev.map(s => s.id === step.id ? { ...s, percent: parseFloat(e.target.value) || 0 } : s))}
                      placeholder="2.5" />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Note (optional)</Label>
                    <Input className="h-8 text-xs" value={step.note || ""}
                      onChange={e => setDepositSteps(prev => prev.map(s => s.id === step.id ? { ...s, note: e.target.value } : s))}
                      placeholder="Held in trust" />
                  </div>
                </div>
                <p className="text-[10px] text-muted-foreground">
                  At $800K: <span className="font-semibold text-foreground">${Math.round(800000 * step.percent / 100).toLocaleString()}</span>
                </p>
              </div>
            ))}
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={() =>
                setDepositSteps(prev => [...prev, { id: Math.random().toString(36).slice(2, 8), label: "", percent: 5, timing: "", note: "" }])
              }>
                <Plus className="h-4 w-4 mr-1" />Add Deposit
              </Button>
              <Button variant="ghost" size="sm" className="text-xs text-muted-foreground"
                onClick={() => setDepositSteps(DEFAULT_DEPOSIT_STEPS)}>
                Reset to defaults
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Total: <span className="font-semibold text-foreground">{depositSteps.reduce((a, s) => a + s.percent, 0)}%</span> during construction.
            </p>
          </div>
        </Section>

        {/* ── STEP 8b: Scarcity ── */}
        <Section title="Urgency / Scarcity" subtitle="Shown as inline badge near floor plans — leave blank to hide" defaultOpen={true}
          badge={unitsRemaining || nextPriceIncrease ? "✓ Active" : undefined}>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs">Units Remaining</Label>
              <Input type="number" min={1} value={unitsRemaining}
                onChange={(e) => setUnitsRemaining(e.target.value)} placeholder="e.g. 3" className="h-9" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Next Price Increase</Label>
              <Input value={nextPriceIncrease}
                onChange={(e) => setNextPriceIncrease(e.target.value)} placeholder="$5K more" className="h-9" />
            </div>
          </div>
        </Section>

        {/* ── STEP 9: Contact ── */}
        <Section step={9} title="Contact on Deck" subtitle="The agent buyers will reach out to">
          <div className="space-y-4">
            {agents.length > 0 && (
              <div>
                <p className="text-xs text-muted-foreground mb-2 font-medium">Select team member:</p>
                <div className="flex flex-wrap gap-2">
                  {agents.map((agent) => (
                    <button key={agent.id} type="button" onClick={() => applyAgentProfile(agent)}
                      className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-sm transition-all ${
                        selectedAgentId === agent.id
                          ? "border-primary bg-primary/10 text-primary font-medium"
                          : "border-border bg-background text-muted-foreground hover:border-primary/40"
                      }`}>
                      {agent.photo_url
                        ? <img src={agent.photo_url} alt={agent.full_name || ""} className="h-6 w-6 rounded-full object-cover shrink-0" />
                        : <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center text-[9px] font-bold text-primary shrink-0">
                            {(agent.full_name || "?").split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()}
                          </div>
                      }
                      {agent.full_name}
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

        {/* ── Lead Gate ── */}
        <Section step={10} title="Lead Gate" defaultOpen={true}
          badge={gateEnabled ? "Active" : "Off"}
          subtitle="Lock high-value sections behind a lead capture form">
          <div className="space-y-5">

            {/* Master toggle */}
            <div className="flex items-center justify-between p-4 rounded-xl border border-border/60 bg-muted/20">
              <div>
                <p className="text-sm font-semibold text-foreground">Lead Gate {gateEnabled ? "Enabled" : "Disabled"}</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {gateEnabled
                    ? "Visitors must submit their name, phone & email to unlock gated sections."
                    : "Deck is fully open — no form required."}
                </p>
              </div>
              <Switch checked={gateEnabled} onCheckedChange={setGateEnabled} />
            </div>

            {/* Section toggles */}
            {gateEnabled && (
              <div className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Locked Sections</p>
                {ALL_GATE_SECTIONS.map(({ id, label }) => {
                  const isLocked = gatedSections.includes(id);
                  return (
                    <div
                      key={id}
                      className="flex items-center justify-between px-4 py-2.5 rounded-lg border border-border/50 bg-background"
                    >
                      <div className="flex items-center gap-2.5">
                        <span className="text-sm text-foreground">{label}</span>
                        {isLocked
                          ? <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">Locked</span>
                          : <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-muted text-muted-foreground border border-border/40">Open</span>
                        }
                      </div>
                      <Switch
                        checked={isLocked}
                        onCheckedChange={(checked) =>
                          setGatedSections((prev) =>
                            checked ? [...prev, id] : prev.filter((s) => s !== id)
                          )
                        }
                      />
                    </div>
                  );
                })}
                {gatedSections.length === 0 && (
                  <p className="text-xs text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg px-3 py-2">
                    No sections are locked — the gate will still appear but unlock immediately.
                  </p>
                )}
              </div>
            )}

          </div>
        </Section>

        {/* ── STEP 11: URL & Publishing ── */}
        <Section step={11} title="URL & Publishing" defaultOpen={false}
          badge={isPublished ? "Live" : "Draft"}>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label className="text-sm">Deck URL</Label>

              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground shrink-0 font-mono">/deck/</span>
                <Input
                  value={slug}
                  onChange={(e) => { setSlug(e.target.value); checkSlug(e.target.value); }}
                  placeholder="aurora-surrey"
                  className={slugTaken ? "border-destructive" : ""}
                />
                {slug && (
                  <button onClick={() => {
                    // OG proxy URL — gives rich WhatsApp/social previews, redirects humans to the real deck
                    const shareUrl = `https://thvlisplwqhtjpzpedhq.supabase.co/functions/v1/og-property-meta?deckSlug=${slug}`;
                    navigator.clipboard.writeText(shareUrl);
                    toast.success("Share link copied! WhatsApp & social previews will show the deck image.");
                  }}
                    className="shrink-0 text-muted-foreground hover:text-primary transition-colors">
                    <Copy className="h-4 w-4" />
                  </button>
                )}
              </div>
              {slugTaken && <p className="text-xs text-destructive">This URL is taken — choose another.</p>}
              {slug && !slugTaken && (
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <a href={`/deck/${slug}`} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline flex items-center gap-0.5">
                    presaleproperties.com/deck/{slug} <ExternalLink className="h-2.5 w-2.5" />
                  </a>
                </p>
              )}
            </div>

            <div className="flex items-center justify-between p-4 rounded-xl border border-border/60 bg-muted/20">
              <div>
                <p className="text-sm font-semibold text-foreground">{isPublished ? "Published" : "Draft"}</p>
                <p className="text-xs text-muted-foreground">{isPublished ? "Visible to anyone with the link" : "Only you can see this deck"}</p>
              </div>
              <Switch checked={isPublished} onCheckedChange={setIsPublished} />
            </div>
          </div>
        </Section>
        </div>{/* end builder inner */}
        </div>{/* end builder column */}
        </ResizablePanel>

        {/* Resizable handle — only on xl+ */}
        <ResizableHandle withHandle className="hidden xl:flex" />

        <ResizablePanel defaultSize={35} minSize={20} className="hidden xl:flex">
        {/* Live preview column */}
        <div className="flex flex-col w-full sticky top-0 h-screen border-l border-border/50 bg-muted/20">
          {/* Preview header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-border/50 bg-background shrink-0">
            <div className="flex items-center gap-2">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-60" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-primary" />
              </span>
              <p className="text-sm font-semibold text-foreground">Live Preview</p>
            </div>
            <div className="flex items-center gap-3">
              {/* Refresh */}
              <button
                onClick={() => setPreviewKey((k) => k + 1)}
                className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                title="Refresh preview"
              >
                <RefreshCw className="h-3.5 w-3.5" />
              </button>
              {/* Desktop / Mobile toggle */}
              <div className="flex items-center bg-muted rounded-lg p-0.5 gap-0.5">
                <button
                  onClick={() => setPreviewMode("desktop")}
                  className={`p-1.5 rounded-md transition-colors ${previewMode === "desktop" ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"}`}
                  title="Desktop preview"
                >
                  <Monitor className="h-3.5 w-3.5" />
                </button>
                <button
                  onClick={() => setPreviewMode("mobile")}
                  className={`p-1.5 rounded-md transition-colors ${previewMode === "mobile" ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"}`}
                  title="Mobile preview (iPhone 17 Pro Max)"
                >
                  <Smartphone className="h-3.5 w-3.5" />
                </button>
              </div>
              {slug ? (
                <a
                  href={`/deck/${slug}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-xs text-muted-foreground hover:text-primary transition-colors"
                >
                  <ExternalLink className="h-3 w-3" />
                  Open
                </a>
              ) : (
                <span className="text-xs text-muted-foreground">Save to preview</span>
              )}
            </div>
          </div>

          {/* iframe or placeholder */}
          <div className="flex-1 overflow-hidden relative flex items-start justify-center">
            {slug ? (
              previewMode === "mobile" ? (
                /* iPhone 17 Pro Max frame: 430×932 */
                <div className="mt-6 relative" style={{ width: 430 * 0.75, height: 932 * 0.75 }}>
                  {/* Phone bezel */}
                  <div className="absolute inset-0 rounded-[40px] border-[3px] border-foreground/20 bg-black pointer-events-none z-10">
                    <div className="absolute top-2 left-1/2 -translate-x-1/2 w-[90px] h-[22px] bg-black rounded-full" />
                    <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-[100px] h-[4px] bg-foreground/20 rounded-full" />
                  </div>
                  <div className="absolute inset-[3px] rounded-[37px] overflow-hidden bg-background">
                    <iframe
                      key={`${slug}-mobile-${previewKey}`}
                      src={`/deck/${slug}`}
                      title="Deck Mobile Preview"
                      className="border-0"
                      style={{
                        width: 430,
                        height: 932,
                        transform: "scale(0.75)",
                        transformOrigin: "top left",
                      }}
                    />
                  </div>
                </div>
              ) : (
                /* Desktop view — scaled to fit */
                <iframe
                  key={`${slug}-desktop-${previewKey}`}
                  src={`/deck/${slug}`}
                  title="Deck Desktop Preview"
                  className="w-full h-full border-0"
                  style={{ transform: "scale(0.75)", transformOrigin: "top left", width: "133.33%", height: "133.33%" }}
                />
              )
            ) : (
              <div className="flex flex-col items-center justify-center h-full gap-4 px-8 text-center">
                <Eye className="h-12 w-12 text-muted-foreground/20" />
                <div>
                  <p className="text-sm font-semibold text-foreground">Preview will appear here</p>
                  <p className="text-xs text-muted-foreground mt-1">Save the deck first to see the live preview</p>
                </div>
              </div>
            )}
          </div>
          {previewMode === "mobile" && (
            <div className="px-4 py-2 border-t border-border/50 bg-background shrink-0">
              <p className="text-[10px] text-muted-foreground text-center">iPhone 17 Pro Max · 430 × 932</p>
            </div>
          )}
        </div>
        </ResizablePanel>
      </ResizablePanelGroup>

      {/* Sticky footer */}
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-background/95 backdrop-blur-md border-t border-border/50 shadow-lg">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <div className="min-w-0">
              <p className="text-sm font-semibold text-foreground leading-tight">
                {isPublished ? "🟢 Published" : "⚪ Draft"}
              </p>
              {slug && (
                <code className="text-[10px] text-muted-foreground font-mono truncate max-w-[160px] block">
                  /deck/{slug}
                </code>
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
