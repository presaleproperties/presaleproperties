import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import {
  Plus, Trash2, Loader2, Upload, Image, ArrowUp, ArrowDown,
  ChevronDown, ChevronUp, Save, Eye,
} from "lucide-react";

const UNIT_TYPES = ["Studio", "1 Bed", "2 Bed", "2 Bed + Den", "3 Bed"];

interface FloorPlan {
  id: string;
  unit_type: string;
  size_range: string;
  price_from: string;
  tags: string[];
  image_url?: string;
}

interface ProximityHighlight {
  icon: string;
  label: string;
  distance: string;
}

interface SectionProps {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}

function Section({ title, children, defaultOpen = true }: SectionProps) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <Card>
      <button
        type="button"
        className="w-full flex items-center justify-between px-6 py-4 text-left"
        onClick={() => setOpen((o) => !o)}
      >
        <span className="font-semibold text-foreground">{title}</span>
        {open ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
      </button>
      {open && <CardContent className="pt-0 pb-6">{children}</CardContent>}
    </Card>
  );
}

function genSlug(name: string) {
  return name
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    .slice(0, 80);
}

function nanoid() {
  return Math.random().toString(36).slice(2, 10);
}

export default function DashboardDeckBuilder() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const isEdit = !!id;

  // Project info
  const [projectName, setProjectName] = useState("");
  const [tagline, setTagline] = useState("");
  const [city, setCity] = useState("");
  const [address, setAddress] = useState("");
  const [developerName, setDeveloperName] = useState("");
  const [stories, setStories] = useState("");
  const [totalUnits, setTotalUnits] = useState("");
  const [completionYear, setCompletionYear] = useState("");

  // Hero image
  const [heroImageUrl, setHeroImageUrl] = useState("");
  const [heroUploading, setHeroUploading] = useState(false);
  const heroInputRef = useRef<HTMLInputElement>(null);

  // Floor plans
  const [floorPlans, setFloorPlans] = useState<FloorPlan[]>([]);
  const fpInputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  // Gallery
  const [gallery, setGallery] = useState<string[]>([]);
  const [galleryUploading, setGalleryUploading] = useState(false);
  const galleryInputRef = useRef<HTMLInputElement>(null);

  // Proximity highlights
  const [highlights, setHighlights] = useState<ProximityHighlight[]>([
    { icon: "🚇", label: "SkyTrain Station", distance: "5 min walk" },
  ]);

  // Projections
  const [rentalMin, setRentalMin] = useState("");
  const [rentalMax, setRentalMax] = useState("");
  const [capRateMin, setCapRateMin] = useState("");
  const [capRateMax, setCapRateMax] = useState("");
  const [appreciation, setAppreciation] = useState(["4", "5", "5.5", "6", "6.5"]);

  // Contact
  const [contactName, setContactName] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [contactWhatsapp, setContactWhatsapp] = useState("");

  // Slug + publish
  const [slug, setSlug] = useState("");
  const [slugTaken, setSlugTaken] = useState(false);
  const [isPublished, setIsPublished] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(isEdit);

  // Hidden file inputs must be at top level (outside accordions)
  // so refs don't become null when sections collapse

  // Load existing deck
  useEffect(() => {
    if (!isEdit || !id) return;
    (async () => {
      const { data, error } = await (supabase as any)
        .from("pitch_decks")
        .select("*")
        .eq("id", id)
        .single();
      if (error || !data) { toast.error("Deck not found"); navigate("/dashboard/decks"); return; }
      setProjectName(data.project_name || "");
      setTagline(data.tagline || "");
      setCity(data.city || "");
      setAddress(data.address || "");
      setDeveloperName(data.developer_name || "");
      setStories(data.stories?.toString() || "");
      setTotalUnits(data.total_units?.toString() || "");
      setCompletionYear(data.completion_year || "");
      setHeroImageUrl(data.hero_image_url || "");
      setFloorPlans(data.floor_plans || []);
      setGallery(data.gallery || []);
      setHighlights(data.proximity_highlights || []);
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
      setLoading(false);
    })();
  }, [id, isEdit]);

  // Auto-slug from project name
  useEffect(() => {
    if (!isEdit && projectName) setSlug(genSlug(projectName));
  }, [projectName, isEdit]);

  // Slug uniqueness check
  const checkSlug = async (s: string) => {
    if (!s) return;
    const query = (supabase as any).from("pitch_decks").select("id").eq("slug", s);
    if (isEdit && id) query.neq("id", id);
    const { data } = await query.single();
    setSlugTaken(!!data);
  };

  // --- Upload helpers ---
  const uploadFile = async (file: File, path: string): Promise<string | null> => {
    const { error } = await supabase.storage
      .from("listing-files")
      .upload(path, file, { upsert: true });
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

  const handleFloorPlanImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, fpId: string) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    const url = await uploadFile(file, `pitch-decks/${user.id}/fp-${fpId}-${Date.now()}`);
    if (url) {
      setFloorPlans((prev) => prev.map((fp) => fp.id === fpId ? { ...fp, image_url: url } : fp));
    }
  };

  const handleGalleryUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (!files.length || !user) return;
    setGalleryUploading(true);
    const remaining = 12 - gallery.length;
    const toUpload = files.slice(0, remaining);
    const urls: string[] = [];
    for (const file of toUpload) {
      const url = await uploadFile(file, `pitch-decks/${user.id}/gallery-${Date.now()}-${file.name}`);
      if (url) urls.push(url);
    }
    setGallery((prev) => [...prev, ...urls]);
    setGalleryUploading(false);
  };

  // --- Floor plan helpers ---
  const addFloorPlan = () => {
    if (floorPlans.length >= 6) return;
    setFloorPlans((prev) => [...prev, { id: nanoid(), unit_type: "1 Bed", size_range: "", price_from: "", tags: [] }]);
  };

  const updateFloorPlan = (id: string, field: keyof FloorPlan, value: any) => {
    setFloorPlans((prev) => prev.map((fp) => fp.id === id ? { ...fp, [field]: value } : fp));
  };

  const removeFloorPlan = (id: string) => {
    setFloorPlans((prev) => prev.filter((fp) => fp.id !== id));
  };

  // --- Highlight helpers ---
  const addHighlight = () => {
    setHighlights((prev) => [...prev, { icon: "📍", label: "", distance: "" }]);
  };

  const updateHighlight = (i: number, field: keyof ProximityHighlight, value: string) => {
    setHighlights((prev) => prev.map((h, idx) => idx === i ? { ...h, [field]: value } : h));
  };

  const removeHighlight = (i: number) => {
    setHighlights((prev) => prev.filter((_, idx) => idx !== i));
  };

  // --- Save ---
  const handleSave = async () => {
    if (!user) return;
    if (!projectName) { toast.error("Project name is required"); return; }
    if (!slug) { toast.error("Slug is required"); return; }
    if (slugTaken) { toast.error("Slug is already taken"); return; }
    setSaving(true);

    const payload = {
      user_id: user.id,
      slug,
      project_name: projectName,
      tagline,
      city,
      address,
      developer_name: developerName,
      stories: stories ? parseInt(stories) : null,
      total_units: totalUnits ? parseInt(totalUnits) : null,
      completion_year: completionYear,
      hero_image_url: heroImageUrl,
      floor_plans: floorPlans,
      gallery,
      proximity_highlights: highlights,
      projections: {
        rental_min: rentalMin ? parseFloat(rentalMin) : null,
        rental_max: rentalMax ? parseFloat(rentalMax) : null,
        cap_rate_min: capRateMin ? parseFloat(capRateMin) : null,
        cap_rate_max: capRateMax ? parseFloat(capRateMax) : null,
        appreciation: appreciation.map((v) => parseFloat(v) || 0),
      },
      contact_name: contactName,
      contact_phone: contactPhone,
      contact_email: contactEmail,
      contact_whatsapp: contactWhatsapp,
      is_published: isPublished,
    };

    let error;
    if (isEdit && id) {
      ({ error } = await (supabase as any).from("pitch_decks").update(payload).eq("id", id));
    } else {
      ({ error } = await (supabase as any).from("pitch_decks").insert(payload));
    }

    if (error) {
      toast.error(`Save failed: ${error.message}`);
    } else {
      toast.success(isEdit ? "Deck updated!" : "Deck created!");
      navigate("/dashboard/decks");
    }
    setSaving(false);
  };

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
      {/* Hidden file inputs — at top level so refs persist through accordion toggles */}
      <input type="file" ref={heroInputRef} className="hidden" accept="image/*" onChange={handleHeroUpload} />
      <input type="file" ref={galleryInputRef} className="hidden" accept="image/*" multiple onChange={handleGalleryUpload} />
      {floorPlans.map((fp) => (
        <input
          key={fp.id}
          type="file"
          accept="image/*"
          className="hidden"
          ref={(el) => { fpInputRefs.current[fp.id] = el; }}
          onChange={(e) => handleFloorPlanImageUpload(e, fp.id)}
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
              {isEdit ? `Editing: ${projectName}` : "Create a shareable investor presentation"}
            </p>
          </div>
          <div className="flex gap-2">
            {isEdit && isPublished && (
              <Button variant="outline" size="sm" asChild>
                <a href={`/deck/${slug}`} target="_blank" rel="noopener noreferrer">
                  <Eye className="h-4 w-4 mr-1" />
                  Preview
                </a>
              </Button>
            )}
            <Button onClick={handleSave} disabled={saving}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
              {saving ? "Saving..." : "Save Deck"}
            </Button>
          </div>
        </div>

        {/* Publish toggle — always visible */}
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
        <Section title="Project Information">
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
              <Label>Completion Year</Label>
              <Input value={completionYear} onChange={(e) => setCompletionYear(e.target.value)} placeholder="2027" />
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
        <Section title="Hero Image">
          <div className="space-y-4">
            {heroImageUrl ? (
              <div className="relative rounded-xl overflow-hidden aspect-video">
                <img src={heroImageUrl} alt="Hero" className="w-full h-full object-cover" />
                <Button
                  variant="destructive"
                  size="sm"
                  className="absolute top-2 right-2"
                  onClick={() => setHeroImageUrl("")}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <div
                className="border-2 border-dashed border-border rounded-xl aspect-video flex flex-col items-center justify-center gap-3 cursor-pointer hover:border-primary/50 transition-colors bg-muted/30"
                onClick={() => heroInputRef.current?.click()}
              >
                {heroUploading ? (
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                ) : (
                  <>
                    <Image className="h-10 w-10 text-muted-foreground/40" />
                    <div className="text-center">
                      <p className="font-medium text-sm text-foreground">Upload hero image</p>
                      <p className="text-xs text-muted-foreground">Full-width background for the deck</p>
                    </div>
                  </>
                )}
              </div>
            )}
            {!heroImageUrl && (
              <Button variant="outline" onClick={() => heroInputRef.current?.click()} disabled={heroUploading}>
                <Upload className="h-4 w-4 mr-2" />
                {heroUploading ? "Uploading..." : "Upload Hero Image"}
              </Button>
            )}
          </div>
        </Section>

        {/* Section: Floor Plans */}
        <Section title={`Floor Plans (${floorPlans.length}/6)`}>
          <div className="space-y-4">
            {floorPlans.map((fp, idx) => (
              <div key={fp.id} className="p-4 rounded-xl border border-border/50 bg-muted/20 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-muted-foreground uppercase">Unit {idx + 1}</span>
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => removeFloorPlan(fp.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs">Unit Type</Label>
                    <Select value={fp.unit_type} onValueChange={(v) => updateFloorPlan(fp.id, "unit_type", v)}>
                      <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                      <SelectContent>
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
                    <Label className="text-xs">Feature Tags <span className="font-normal text-muted-foreground">(comma separated)</span></Label>
                    <Input
                      className="h-9"
                      value={fp.tags.join(", ")}
                      onChange={(e) => updateFloorPlan(fp.id, "tags", e.target.value.split(",").map((s) => s.trim()).filter(Boolean))}
                      placeholder="Balcony, Den, Parking"
                    />
                  </div>
                </div>
                {/* Floor plan image */}
                <div className="flex items-center gap-3">
                  {fp.image_url ? (
                    <div className="relative h-16 w-24 rounded overflow-hidden shrink-0">
                      <img src={fp.image_url} alt="" className="w-full h-full object-cover" />
                      <button
                        className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity"
                        onClick={() => updateFloorPlan(fp.id, "image_url", undefined)}
                      >
                        <Trash2 className="h-4 w-4 text-white" />
                      </button>
                    </div>
                  ) : null}
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="text-xs"
                    onClick={() => fpInputRefs.current[fp.id]?.click()}
                  >
                    <Upload className="h-3 w-3 mr-1" />
                    {fp.image_url ? "Replace Image" : "Upload Floor Plan"}
                  </Button>
                </div>
              </div>
            ))}
            {floorPlans.length < 6 && (
              <Button variant="outline" onClick={addFloorPlan} className="w-full">
                <Plus className="h-4 w-4 mr-2" />
                Add Floor Plan
              </Button>
            )}
          </div>
        </Section>

        {/* Section: Gallery */}
        <Section title={`Photo Gallery (${gallery.length}/12)`}>
          <div className="space-y-4">
            {gallery.length > 0 && (
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                {gallery.map((url, i) => (
                  <div key={i} className="relative aspect-square rounded-lg overflow-hidden group">
                    <img src={url} alt="" className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center gap-1 opacity-0 group-hover:opacity-100">
                      <button
                        className="p-1 bg-white/80 rounded"
                        onClick={() => setGallery((g) => { const n = [...g]; [n[i-1], n[i]] = [n[i], n[i-1]]; return n; })}
                        disabled={i === 0}
                      >
                        <ArrowUp className="h-3 w-3" />
                      </button>
                      <button
                        className="p-1 bg-white/80 rounded"
                        onClick={() => setGallery((g) => { const n = [...g]; [n[i], n[i+1]] = [n[i+1], n[i]]; return n; })}
                        disabled={i === gallery.length - 1}
                      >
                        <ArrowDown className="h-3 w-3" />
                      </button>
                      <button
                        className="p-1 bg-white/80 rounded"
                        onClick={() => setGallery((g) => g.filter((_, idx) => idx !== i))}
                      >
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
            <p className="text-xs text-muted-foreground">First photo appears larger in gallery. Use arrows to reorder.</p>
          </div>
        </Section>

        {/* Section: Location */}
        <Section title="Location & Proximity">
          <div className="space-y-3">
            <p className="text-xs text-muted-foreground">Address auto-fills from Project Info. Add nearby highlights below.</p>
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
              <Plus className="h-4 w-4 mr-2" />
              Add Highlight
            </Button>
          </div>
        </Section>

        {/* Section: Projections */}
        <Section title="Investment Projections">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Monthly Rental Min (CAD)</Label>
              <Input type="number" value={rentalMin} onChange={(e) => setRentalMin(e.target.value)} placeholder="2200" />
            </div>
            <div className="space-y-1.5">
              <Label>Monthly Rental Max (CAD)</Label>
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
                    <Input
                      type="number"
                      className="h-9"
                      value={v}
                      onChange={(e) => setAppreciation((prev) => { const n = [...prev]; n[i] = e.target.value; return n; })}
                      step="0.5"
                      placeholder="5"
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Section>

        {/* Section: Contact Override */}
        <Section title="Contact Information" defaultOpen={false}>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Agent Name</Label>
              <Input value={contactName} onChange={(e) => setContactName(e.target.value)} placeholder="Sarb Grewal" />
            </div>
            <div className="space-y-1.5">
              <Label>Phone</Label>
              <Input value={contactPhone} onChange={(e) => setContactPhone(e.target.value)} placeholder="+1 (604) 555-0100" />
            </div>
            <div className="space-y-1.5">
              <Label>Email</Label>
              <Input type="email" value={contactEmail} onChange={(e) => setContactEmail(e.target.value)} placeholder="sarb@realbroker.ca" />
            </div>
            <div className="space-y-1.5">
              <Label>WhatsApp Number</Label>
              <Input value={contactWhatsapp} onChange={(e) => setContactWhatsapp(e.target.value)} placeholder="+16045550100" />
            </div>
          </div>
        </Section>

        {/* Section: URL Slug */}
        <Section title="URL & Publishing">
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
              {slugTaken && (
                <p className="text-xs text-destructive">This slug is already in use. Please choose another.</p>
              )}
              {slug && !slugTaken && (
                <p className="text-xs text-muted-foreground">
                  Public URL: {window.location.origin}/deck/{slug}
                </p>
              )}
            </div>
          </div>
        </Section>

        {/* Footer save */}
        <div className="flex justify-end gap-3 pt-2">
          <Button variant="outline" onClick={() => navigate("/dashboard/decks")}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={saving || slugTaken}>
            {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
            {saving ? "Saving..." : isEdit ? "Save Changes" : "Create Deck"}
          </Button>
        </div>
      </div>
    </DashboardLayout>
  );
}
