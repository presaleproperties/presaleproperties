import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Switch } from "@/components/ui/switch";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  ArrowLeft, Sparkles, Loader2, Copy, Download, CheckCircle2,
  Building2, Image, Mail, FileText, Wand2, ChevronDown, ChevronUp,
  Eye, Code2, Save, X, Upload, LayoutGrid,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { buildAiEmailHtml, type AiEmailCopy, type AgentInfo, DEFAULT_AGENT } from "@/components/admin/AiEmailTemplate";

// ─── Constants ────────────────────────────────────────────────────────────────
const AGENT_CONTACTS: Record<string, { phone: string; email: string }> = {
  "Uzair":  { phone: "778-231-3592",      email: "info@presaleproperties.com" },
  "Sarb":   { phone: "+1 (778) 846-7065", email: "sarb@presaleproperties.com"  },
  "Ravish": { phone: "+1 (604) 349-9399", email: "ravish@presaleproperties.com" },
};

const EXAMPLE_PROMPTS = [
  "New presale in Burnaby — 1 & 2 beds from $649K, 2027 completion, PTT exempt",
  "VIP-only offer for Lumina Surrey — extended deposit, free parking, very limited units",
  "Luxury waterfront in North Van by Bosa — from $1.2M, stunning views, act fast",
  "Follow-up for open house attendees — floor plans ready, limited units remaining",
];

interface SectionDef { id: string; label: string; icon: React.ElementType }
const SECTIONS: SectionDef[] = [
  { id: "generate",   label: "Generate",       icon: Sparkles   },
  { id: "details",    label: "Project Details", icon: Building2  },
  { id: "copy",       label: "Email Copy",      icon: FileText   },
  { id: "floorplans", label: "Floor Plans",     icon: LayoutGrid },
  { id: "hero",       label: "Hero Image",      icon: Image      },
];

// ─── Accordion wrapper ────────────────────────────────────────────────────────
function Section({ def, open, onToggle, children }: {
  def: SectionDef; open: boolean; onToggle: () => void; children: React.ReactNode;
}) {
  const Icon = def.icon;
  return (
    <div className="border-b border-border last:border-b-0">
      <button onClick={onToggle} className="w-full flex items-center justify-between px-4 py-3 hover:bg-muted/40 transition-colors text-left">
        <div className="flex items-center gap-2.5">
          <Icon className="h-3.5 w-3.5 text-primary flex-shrink-0" />
          <span className="text-xs font-semibold">{def.label}</span>
        </div>
        {open ? <ChevronUp className="h-3.5 w-3.5 text-muted-foreground" /> : <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />}
      </button>
      {open && <div className="px-4 pb-4 space-y-3">{children}</div>}
    </div>
  );
}

// ─── Floor plan image entry ───────────────────────────────────────────────────
interface FloorPlanEntry { id: string; url: string; label: string; sqft: string }

// ─── Build email HTML (with hero + floor plans injected) ─────────────────────
function buildFinalHtml(
  fields: AiEmailCopy,
  agent: AgentInfo,
  heroImage: string,
  floorPlans: FloorPlanEntry[],
  fpHeading: string,
  fpSubheading: string,
): string {
  const base = buildAiEmailHtml(fields, agent);
  const ACCENT = "#C9A55A";
  const DARK = "#0d1f18";

  // 1. Inject hero image after location banner
  let html = heroImage
    ? base.replace(
        "<!-- ─── HERO STATS BAR",
        `  <!-- ─── HERO IMAGE ─── -->
  <tr>
    <td style="padding:0;line-height:0;">
      <img src="${heroImage}" alt="${fields.projectName || "Project"}" width="600" style="display:block;width:100%;max-width:600px;height:auto;" />
    </td>
  </tr>

  <!-- ─── HERO STATS BAR`,
      )
    : base;

  // 2. Inject floor plans block before the agent card
  if (floorPlans.length > 0) {
    const activePlans = floorPlans.filter(fp => fp.url);
    if (activePlans.length > 0) {
      const heading = fpHeading || "Available Floor Plans";
      const sub = fpSubheading || "Limited units remaining — register now for priority access";
      
      // Build floor plan grid (1 or 2 columns)
      const planCells = activePlans.map(fp => `
        <td style="padding:8px;width:${activePlans.length === 1 ? "100%" : "50%"};vertical-align:top;text-align:center;">
          <div style="border:1px solid #e0dbd3;overflow:hidden;background:#fafaf8;">
            <img src="${fp.url}" alt="${fp.label || "Floor Plan"}" width="100%" style="display:block;width:100%;height:auto;" />
            ${fp.label || fp.sqft ? `
            <div style="padding:10px 12px 12px;">
              ${fp.label ? `<p style="margin:0 0 3px 0;font-family:'DM Sans',Arial,sans-serif;font-size:11px;font-weight:600;letter-spacing:1.5px;text-transform:uppercase;color:#111;">${fp.label}</p>` : ""}
              ${fp.sqft ? `<p style="margin:0;font-family:'DM Sans',Arial,sans-serif;font-size:10px;color:#888;">${fp.sqft}</p>` : ""}
            </div>` : ""}
          </div>
        </td>`).join("");

      const floorPlanBlock = `
  <!-- ─── FLOOR PLANS ─── -->
  <tr>
    <td style="background:${DARK};padding:0;">
      <!-- Top gold bar -->
      <div style="height:3px;background:${ACCENT};"></div>
    </td>
  </tr>
  <tr>
    <td style="background:${DARK};padding:28px 36px 8px;">
      <p style="margin:0 0 6px 0;font-family:'DM Sans',Arial,sans-serif;font-size:9px;letter-spacing:3px;text-transform:uppercase;color:${ACCENT};">FLOOR PLANS</p>
      <p style="margin:0 0 8px 0;font-family:'Cormorant Garamond',Georgia,serif;font-size:26px;font-weight:400;color:#ffffff;line-height:1.15;">${heading}</p>
      <p style="margin:0;font-family:'DM Sans',Arial,sans-serif;font-size:12px;color:#8aaa96;line-height:1.6;">${sub}</p>
    </td>
  </tr>
  <tr>
    <td style="background:${DARK};padding:16px 28px 28px;">
      <table cellpadding="0" cellspacing="0" border="0" width="100%">
        <tr>${planCells}</tr>
      </table>
    </td>
  </tr>
  <tr>
    <td style="background:${DARK};padding:0 36px 28px;">
      <table cellpadding="0" cellspacing="0" border="0">
        <tr>
          <td style="background:${ACCENT};padding:13px 32px;">
            <a href="https://presaleproperties.com/book" style="font-family:'DM Sans',Arial,sans-serif;font-size:9px;letter-spacing:3px;text-transform:uppercase;color:${DARK};text-decoration:none;font-weight:600;">REGISTER FOR FLOOR PLAN ACCESS →</a>
          </td>
        </tr>
      </table>
    </td>
  </tr>`;

      html = html.replace("<!-- ─── AGENT CARD", floorPlanBlock + "\n  <!-- ─── AGENT CARD");
    }
  }

  return html;
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function AdminAiEmailBuilder() {
  const navigate = useNavigate();
  const heroInputRef = useRef<HTMLInputElement>(null);
  const fpInputRef   = useRef<HTMLInputElement>(null);

  // Accordion
  const [open, setOpen] = useState<Set<string>>(new Set(["generate"]));
  const toggle = (id: string) => setOpen(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });

  // AI
  const [prompt, setPrompt]           = useState("");
  const [templateType, setTemplateType] = useState("main-project-email");
  const [selectedProjectId, setSelProject] = useState("none");
  const [aiLoading, setAiLoading]     = useState(false);
  const [activeVersion, setActiveVersion] = useState<"A" | "B">("A");
  const [aiResult, setAiResult]       = useState<Record<string, string> | null>(null);

  // Editable copy fields
  const [projectName, setProjectName] = useState("");
  const [developerName, setDevName]   = useState("");
  const [showProjectName, setShowProjectName] = useState(true);
  const [showDeveloperName, setShowDeveloperName] = useState(true);
  const [customHeader, setCustomHeader] = useState("");
  const [city, setCity]               = useState("");
  const [neighborhood, setNeighborhood] = useState("");
  const [startingPrice, setStartingPrice] = useState("");
  const [deposit, setDeposit]         = useState("");
  const [completion, setCompletion]   = useState("");
  const [subjectLine, setSubjectLine] = useState("");
  const [previewText, setPreviewText] = useState("");
  const [headline, setHeadline]       = useState("");
  const [bodyCopy, setBodyCopy]       = useState("");
  const [incentiveText, setIncentiveText] = useState("");

  // Hero image
  const [heroImage, setHeroImage]     = useState("");
  const [heroUploading, setHeroUploading] = useState(false);

  // Floor plans
  const [floorPlans, setFloorPlans]   = useState<FloorPlanEntry[]>([]);
  const [fpHeading, setFpHeading]     = useState("Available Floor Plans");
  const [fpSubheading, setFpSubheading] = useState("Limited units remaining — register now for priority access");
  const [fpUploading, setFpUploading] = useState(false);

  // UI
  const [previewTab, setPreviewTab]   = useState<"preview" | "code">("preview");
  const [copied, setCopied]           = useState(false);
  const [saving, setSaving]           = useState(false);

  // Data
  const [agents, setAgents]           = useState<AgentInfo[]>([]);
  const [selectedAgentId, setSelAgent] = useState("default");
  const selectedAgent: AgentInfo = agents.find(a => a.full_name === selectedAgentId) ?? DEFAULT_AGENT;
  const [projects, setProjects]       = useState<Array<{ id: string; name: string; city: string; featured_image?: string | null }>>([]);

  useEffect(() => {
    supabase.from("presale_projects").select("id, name, city, featured_image").eq("is_published", true).order("name").limit(50)
      .then(({ data }: any) => { if (data) setProjects(data); });
    supabase.from("team_members_public" as any).select("id, full_name, title, photo_url").eq("is_active", true).order("sort_order")
      .then(({ data }: any) => {
        if (data) {
          const enriched: AgentInfo[] = data.map((m: any) => {
            const contact = AGENT_CONTACTS[m.full_name?.split(" ")[0]] ?? { phone: "", email: "" };
            return { full_name: m.full_name ?? "", title: m.title ?? "Presale Specialist", photo_url: m.photo_url ?? null, ...contact };
          });
          setAgents(enriched);
          if (enriched.length > 0) setSelAgent(enriched[0].full_name);
        }
      });
  }, []);

  const currentCopy = useCallback((): AiEmailCopy => ({
    subjectLine, previewText, headline, bodyCopy, incentiveText,
    projectName: showProjectName ? projectName : (customHeader || ""),
    city, neighborhood,
    developerName: showDeveloperName ? developerName : "",
    startingPrice, deposit, completion,
  }), [subjectLine, previewText, headline, bodyCopy, incentiveText, projectName, showProjectName, customHeader, city, neighborhood, developerName, showDeveloperName, startingPrice, deposit, completion]);

  const previewHtml = buildFinalHtml(currentCopy(), selectedAgent, heroImage, floorPlans, fpHeading, fpSubheading);

  // ── AI generation ──
  const applyResult = (result: Record<string, string>, v: "A" | "B") => {
    const b = v === "B";
    setSubjectLine(b ? (result.subjectLineB || result.subjectLine || "") : (result.subjectLine || ""));
    setPreviewText(b ? (result.previewTextB || result.previewText || "") : (result.previewText || ""));
    setHeadline(b ? (result.headlineB || result.headline || "") : (result.headline || ""));
    setBodyCopy(b ? (result.bodyCopyB || result.bodyCopy || "") : (result.bodyCopy || ""));
    setIncentiveText(result.incentiveText || "");
    if (result.projectName) setProjectName(result.projectName);
    if (result.city) setCity(result.city);
    if (result.neighborhood) setNeighborhood(result.neighborhood);
    if (result.developerName) setDevName(result.developerName);
    if (result.startingPrice) setStartingPrice(result.startingPrice);
    if (result.deposit) setDeposit(result.deposit);
    if (result.completion) setCompletion(result.completion);
  };

  const handleGenerate = async () => {
    if (!prompt.trim()) { toast.error("Enter a prompt first"); return; }
    setAiLoading(true);
    try {
      const project = projects.find(p => p.id === selectedProjectId && selectedProjectId !== "none");
      const { data, error } = await supabase.functions.invoke("generate-email-copy", {
        body: { prompt: prompt.trim(), projectDetails: project ? { name: project.name, city: project.city } : null, templateType },
      });
      if (error) throw new Error(error.message);
      if (data?.error) throw new Error(data.error);
      setAiResult(data.copy);
      setActiveVersion("A");
      applyResult(data.copy, "A");
      setOpen(new Set(["generate", "details", "copy"]));
      if (project?.featured_image && !heroImage) setHeroImage(project.featured_image);
    } catch (e: any) {
      toast.error(e.message || "Failed to generate");
    } finally {
      setAiLoading(false);
    }
  };

  const handleVersionSwitch = (v: "A" | "B") => {
    if (!aiResult) return;
    setActiveVersion(v);
    applyResult(aiResult, v);
  };

  const handleProjectSelect = (id: string) => {
    setSelProject(id);
    const p = projects.find(proj => proj.id === id);
    if (!p) return;
    setProjectName(p.name);
    setCity(p.city);
    if (p.featured_image) setHeroImage(p.featured_image);
  };

  // ── Image upload helpers ──
  const uploadImage = async (file: File, bucket: string, path: string): Promise<string> => {
    const { error } = await supabase.storage.from(bucket).upload(path, file, { upsert: true, contentType: file.type });
    if (error) throw error;
    const { data: { publicUrl } } = supabase.storage.from(bucket).getPublicUrl(path);
    return publicUrl;
  };

  const handleHeroUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setHeroUploading(true);
    try {
      const path = `email-hero/${Date.now()}-${file.name}`;
      const url = await uploadImage(file, "email-assets", path);
      setHeroImage(url);
      toast.success("Hero image uploaded");
    } catch (err: any) {
      toast.error("Upload failed: " + err.message);
    } finally {
      setHeroUploading(false);
      e.target.value = "";
    }
  };

  const handleFpUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    setFpUploading(true);
    try {
      const uploaded: FloorPlanEntry[] = [];
      for (const file of files.slice(0, 2)) {
        const path = `email-floorplans/${Date.now()}-${file.name}`;
        const url = await uploadImage(file, "email-assets", path);
        uploaded.push({ id: crypto.randomUUID(), url, label: "", sqft: "" });
      }
      setFloorPlans(prev => [...prev, ...uploaded].slice(0, 2));
      if (!open.has("floorplans")) setOpen(prev => new Set([...prev, "floorplans"]));
      toast.success(`${uploaded.length} floor plan${uploaded.length > 1 ? "s" : ""} uploaded`);
    } catch (err: any) {
      toast.error("Upload failed: " + err.message);
    } finally {
      setFpUploading(false);
      e.target.value = "";
    }
  };

  const removeFp = (id: string) => setFloorPlans(prev => prev.filter(fp => fp.id !== id));
  const updateFp = (id: string, field: keyof FloorPlanEntry, val: string) =>
    setFloorPlans(prev => prev.map(fp => fp.id === id ? { ...fp, [field]: val } : fp));

  // ── Export + Save ──
  const handleCopyHtml = () => {
    navigator.clipboard.writeText(previewHtml).then(() => {
      setCopied(true);
      toast.success("HTML copied to clipboard");
      setTimeout(() => setCopied(false), 2500);
    });
  };

  const handleSave = async () => {
    if (!projectName && !headline) { toast.error("Add a project name or headline first"); return; }
    setSaving(true);
    const name = `AI Email — ${projectName || headline?.slice(0, 30) || "Untitled"} (${new Date().toLocaleDateString()})`;
    const { error } = await supabase.from("campaign_templates" as any).insert({
      name, project_name: projectName || "Untitled",
      form_data: { _type: "ai-email", copy: currentCopy(), heroImage, floorPlans, fpHeading, fpSubheading, aiResult, activeVersion },
    });
    if (error) toast.error("Failed to save");
    else toast.success("Saved!");
    setSaving(false);
  };

  return (
    <AdminLayout>
      <div className="flex flex-col h-full bg-background">

        {/* ── Top bar ── */}
        <div className="flex-shrink-0 border-b border-border bg-card px-4 py-2.5 flex items-center gap-3">
          <Button variant="ghost" size="icon" className="h-8 w-8 flex-shrink-0" onClick={() => navigate("/admin/email-builder-hub")}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="h-7 w-7 rounded-md bg-gradient-to-br from-violet-500 to-violet-700 flex items-center justify-center shadow-sm flex-shrink-0">
            <Sparkles className="h-3.5 w-3.5 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-sm font-bold leading-none">AI Email Builder</h1>
            <p className="text-[10px] text-muted-foreground mt-0.5">Prompt → Edit → Copy HTML</p>
          </div>

          {/* Version tabs */}
          {aiResult && (
            <div className="flex items-center bg-muted rounded-lg p-0.5 gap-0.5">
              <button onClick={() => handleVersionSwitch("A")} className={cn("px-2.5 py-1 text-[11px] font-semibold rounded transition-all", activeVersion === "A" ? "bg-emerald-600 text-white shadow-sm" : "text-muted-foreground hover:text-foreground")}>Ver A</button>
              {(aiResult.subjectLineB || aiResult.bodyCopyB) && (
                <button onClick={() => handleVersionSwitch("B")} className={cn("px-2.5 py-1 text-[11px] font-semibold rounded transition-all", activeVersion === "B" ? "bg-amber-500 text-white shadow-sm" : "text-muted-foreground hover:text-foreground")}>Ver B</button>
              )}
            </div>
          )}

          <div className="flex items-center gap-1.5">
            <Button variant="outline" size="sm" className="h-7 text-xs gap-1" onClick={handleSave} disabled={saving}>
              {saving ? <Loader2 className="h-3 w-3 animate-spin" /> : <Save className="h-3 w-3" />} Save
            </Button>
            <Button size="sm" className="h-7 text-xs gap-1 bg-emerald-600 hover:bg-emerald-700 text-white" onClick={handleCopyHtml}>
              {copied ? <CheckCircle2 className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
              {copied ? "Copied!" : "Copy HTML"}
            </Button>
          </div>
        </div>

        {/* ── Layout ── */}
        <div className="flex flex-1 min-h-0">

          {/* ── SIDEBAR ── */}
          <div className="w-[300px] flex-shrink-0 border-r border-border bg-card flex flex-col min-h-0">
            <ScrollArea className="flex-1">

              {/* ── 1. Generate ── */}
              <Section def={SECTIONS[0]} open={open.has("generate")} onToggle={() => toggle("generate")}>
                <Textarea
                  value={prompt}
                  onChange={e => setPrompt(e.target.value)}
                  placeholder="Describe this email: project, city, price, completion date, incentives, tone…"
                  className="min-h-[72px] text-xs resize-none"
                  disabled={aiLoading}
                />
                <div className="space-y-1">
                  <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Examples</p>
                  <div className="flex flex-col gap-1">
                    {EXAMPLE_PROMPTS.map((ex, i) => (
                      <button key={i} onClick={() => setPrompt(ex)} disabled={aiLoading}
                        className="text-left text-[11px] px-2.5 py-1.5 rounded border border-border bg-muted/30 hover:bg-muted hover:border-primary/30 transition-all text-muted-foreground hover:text-foreground leading-snug">
                        {ex}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <Label className="text-[10px]">Style</Label>
                    <Select value={templateType} onValueChange={setTemplateType} disabled={aiLoading}>
                      <SelectTrigger className="h-7 text-[11px]"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="main-project-email">Main Project</SelectItem>
                        <SelectItem value="exclusive-offer">Exclusive Offer</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[10px]">Project <span className="text-muted-foreground">(opt)</span></Label>
                    <Select value={selectedProjectId} onValueChange={handleProjectSelect} disabled={aiLoading}>
                      <SelectTrigger className="h-7 text-[11px]"><SelectValue placeholder="Select…" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">None</SelectItem>
                        {projects.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Agent */}
                {agents.length > 0 && (
                  <div className="space-y-1.5">
                    <Label className="text-[10px]">Agent Signature</Label>
                    <Select value={selectedAgentId} onValueChange={setSelAgent}>
                      <SelectTrigger className="h-7 text-[11px]"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {agents.map(a => <SelectItem key={a.full_name} value={a.full_name}>{a.full_name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                    <div className="flex items-center gap-2 p-2 rounded-md bg-muted/40 border border-border">
                      {selectedAgent.photo_url
                        ? <img src={selectedAgent.photo_url} alt={selectedAgent.full_name} className="w-7 h-7 rounded-full object-cover object-top flex-shrink-0" style={{ border: "1.5px solid #C9A55A" }} />
                        : <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center text-[10px] font-bold text-primary flex-shrink-0">{selectedAgent.full_name.charAt(0)}</div>
                      }
                      <div className="min-w-0">
                        <p className="text-[11px] font-semibold truncate">{selectedAgent.full_name}</p>
                        <p className="text-[10px] text-muted-foreground truncate">{selectedAgent.phone}</p>
                      </div>
                    </div>
                  </div>
                )}

                <Button className="w-full h-9 gap-2 text-white font-semibold text-xs"
                  style={{ background: aiLoading ? undefined : "linear-gradient(135deg,#7c3aed,#5b21b6)" }}
                  onClick={handleGenerate} disabled={aiLoading || !prompt.trim()}>
                  {aiLoading ? <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Writing…</> : <><Wand2 className="h-3.5 w-3.5" />{aiResult ? "Regenerate" : "Generate Email"}</>}
                </Button>
              </Section>

              {/* ── 2. Project Details ── */}
              <Section def={SECTIONS[1]} open={open.has("details")} onToggle={() => toggle("details")}>
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1 col-span-2">
                    <div className="flex items-center justify-between">
                      <Label className="text-[10px]">Project Name</Label>
                      <div className="flex items-center gap-1.5">
                        <span className="text-[9px] text-muted-foreground">{showProjectName ? "Visible" : "Hidden"}</span>
                        <Switch checked={showProjectName} onCheckedChange={setShowProjectName} className="scale-75 origin-right" />
                      </div>
                    </div>
                    <Input value={projectName} onChange={e => setProjectName(e.target.value)} className={cn("h-7 text-xs", !showProjectName && "opacity-40")} placeholder="Lumina" />
                  </div>
                  {!showProjectName && (
                    <div className="space-y-1 col-span-2">
                      <Label className="text-[10px]">Custom Header <span className="text-muted-foreground">(replaces project name)</span></Label>
                      <Input value={customHeader} onChange={e => setCustomHeader(e.target.value)} className="h-7 text-xs" placeholder="New Presale Release" autoFocus />
                    </div>
                  )}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <Label className="text-[10px]">Developer</Label>
                      <div className="flex items-center gap-1.5">
                        <span className="text-[9px] text-muted-foreground">{showDeveloperName ? "Visible" : "Hidden"}</span>
                        <Switch checked={showDeveloperName} onCheckedChange={setShowDeveloperName} className="scale-75 origin-right" />
                      </div>
                    </div>
                    <Input value={developerName} onChange={e => setDevName(e.target.value)} className={cn("h-7 text-xs", !showDeveloperName && "opacity-40")} placeholder="Bosa Properties" />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[10px]">City</Label>
                    <Input value={city} onChange={e => setCity(e.target.value)} className="h-7 text-xs" placeholder="Surrey" />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[10px]">Neighbourhood</Label>
                    <Input value={neighborhood} onChange={e => setNeighborhood(e.target.value)} className="h-7 text-xs" placeholder="Fleetwood" />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[10px]">Starting Price</Label>
                    <Input value={startingPrice} onChange={e => setStartingPrice(e.target.value)} className="h-7 text-xs" placeholder="$649K" />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[10px]">Deposit</Label>
                    <Input value={deposit} onChange={e => setDeposit(e.target.value)} className="h-7 text-xs" placeholder="5%" />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[10px]">Completion</Label>
                    <Input value={completion} onChange={e => setCompletion(e.target.value)} className="h-7 text-xs" placeholder="2027" />
                  </div>
                </div>
              </Section>

              {/* ── 3. Email Copy ── */}
              <Section def={SECTIONS[2]} open={open.has("copy")} onToggle={() => toggle("copy")}>
                <div className="space-y-1">
                  <Label className="text-[10px]">Subject Line</Label>
                  <Input value={subjectLine} onChange={e => setSubjectLine(e.target.value)} className="h-7 text-xs" placeholder="🏙️ Exclusive Access: Lumina — Surrey Presale" />
                </div>
                <div className="space-y-1">
                  <Label className="text-[10px]">Preview Text</Label>
                  <Input value={previewText} onChange={e => setPreviewText(e.target.value)} className="h-7 text-xs" placeholder="From $649K · limited units" />
                </div>
                <div className="space-y-1">
                  <Label className="text-[10px]">Headline</Label>
                  <Input value={headline} onChange={e => setHeadline(e.target.value)} className="h-7 text-xs" placeholder="Introducing Lumina — Surrey's Next Landmark" />
                </div>
                <div className="space-y-1">
                  <Label className="text-[10px]">Body Copy</Label>
                  <Textarea value={bodyCopy} onChange={e => setBodyCopy(e.target.value)} className="min-h-[100px] text-xs resize-none" placeholder="Each line = one paragraph in the email." />
                </div>
                <div className="space-y-1">
                  <Label className="text-[10px]">Incentives <span className="text-muted-foreground">(one per line)</span></Label>
                  <Textarea value={incentiveText} onChange={e => setIncentiveText(e.target.value)} className="min-h-[70px] text-xs resize-none" placeholder={"✦ Extended deposit: 5% now, 5% in 180 days\n✦ Free parking · $35,000 value"} />
                </div>
              </Section>

              {/* ── 4. Floor Plans ── */}
              <Section def={SECTIONS[3]} open={open.has("floorplans")} onToggle={() => toggle("floorplans")}>
                {/* Upload button */}
                <input ref={fpInputRef} type="file" accept="image/*" multiple className="hidden" onChange={handleFpUpload} />
                {floorPlans.length < 2 && (
                  <button
                    onClick={() => fpInputRef.current?.click()}
                    disabled={fpUploading}
                    className="w-full flex items-center justify-center gap-2 h-16 rounded-lg border-2 border-dashed border-border hover:border-primary/50 hover:bg-muted/30 transition-all text-muted-foreground hover:text-foreground"
                  >
                    {fpUploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                    <span className="text-xs font-medium">{fpUploading ? "Uploading…" : `Upload floor plan${floorPlans.length === 1 ? " (1 more allowed)" : "s (up to 2)"}`}</span>
                  </button>
                )}

                {/* Uploaded plans */}
                {floorPlans.map(fp => (
                  <div key={fp.id} className="border border-border rounded-lg overflow-hidden bg-muted/20">
                    <div className="relative">
                      <img src={fp.url} alt="Floor plan" className="w-full h-28 object-contain bg-white" />
                      <button onClick={() => removeFp(fp.id)} className="absolute top-1.5 right-1.5 h-5 w-5 bg-destructive/90 hover:bg-destructive rounded-full flex items-center justify-center transition-colors">
                        <X className="h-3 w-3 text-white" />
                      </button>
                    </div>
                    <div className="p-2 grid grid-cols-2 gap-1.5">
                      <div className="space-y-0.5">
                        <Label className="text-[9px]">Label (e.g. 1 Bed)</Label>
                        <Input value={fp.label} onChange={e => updateFp(fp.id, "label", e.target.value)} className="h-6 text-[11px]" placeholder="1 Bed + Den" />
                      </div>
                      <div className="space-y-0.5">
                        <Label className="text-[9px]">Size</Label>
                        <Input value={fp.sqft} onChange={e => updateFp(fp.id, "sqft", e.target.value)} className="h-6 text-[11px]" placeholder="678 sq ft" />
                      </div>
                    </div>
                  </div>
                ))}

                {/* Section heading/subheading */}
                {floorPlans.length > 0 && (
                  <>
                    <div className="space-y-1">
                      <Label className="text-[10px]">Section Heading</Label>
                      <Input value={fpHeading} onChange={e => setFpHeading(e.target.value)} className="h-7 text-xs" />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[10px]">Sub-heading</Label>
                      <Input value={fpSubheading} onChange={e => setFpSubheading(e.target.value)} className="h-7 text-xs" />
                    </div>
                  </>
                )}

                {floorPlans.length === 0 && (
                  <p className="text-[10px] text-muted-foreground text-center pb-1">Upload 1–2 floor plan images. The section only appears in the email if you add images.</p>
                )}
              </Section>

              {/* ── 5. Hero Image ── */}
              <Section def={SECTIONS[4]} open={open.has("hero")} onToggle={() => toggle("hero")}>
                <input ref={heroInputRef} type="file" accept="image/*" className="hidden" onChange={handleHeroUpload} />
                <div className="space-y-1">
                  <Label className="text-[10px]">Image URL</Label>
                  <div className="flex gap-1.5">
                    <Input value={heroImage} onChange={e => setHeroImage(e.target.value)} className="h-7 text-xs flex-1" placeholder="https://… or upload below" />
                    <Button variant="outline" size="icon" className="h-7 w-7 flex-shrink-0" onClick={() => heroInputRef.current?.click()} disabled={heroUploading} title="Upload image">
                      {heroUploading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Upload className="h-3 w-3" />}
                    </Button>
                  </div>
                </div>
                {heroImage && (
                  <div className="relative rounded overflow-hidden border border-border">
                    <img src={heroImage} alt="Hero" className="w-full h-24 object-cover" onError={() => setHeroImage("")} />
                    <button onClick={() => setHeroImage("")} className="absolute top-1 right-1 h-5 w-5 bg-destructive/90 hover:bg-destructive rounded-full flex items-center justify-center">
                      <X className="h-3 w-3 text-white" />
                    </button>
                  </div>
                )}
                {projects.filter(p => p.featured_image).length > 0 && (
                  <div>
                    <p className="text-[10px] text-muted-foreground mb-1.5">Pick from projects:</p>
                    <div className="grid grid-cols-3 gap-1.5">
                      {projects.filter(p => p.featured_image).slice(0, 6).map(p => (
                        <button key={p.id} onClick={() => setHeroImage(p.featured_image!)}
                          className={cn("relative rounded overflow-hidden border-2 transition-all aspect-video", heroImage === p.featured_image ? "border-primary" : "border-transparent hover:border-muted-foreground/40")}>
                          <img src={p.featured_image!} alt={p.name} className="w-full h-full object-cover" />
                          {heroImage === p.featured_image && <div className="absolute inset-0 bg-primary/20 flex items-center justify-center"><CheckCircle2 className="h-4 w-4 text-white" /></div>}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </Section>

            </ScrollArea>
          </div>

          {/* ── PREVIEW PANE ── */}
          <div className="flex-1 flex flex-col min-h-0 min-w-0">
            {/* Toolbar */}
            <div className="flex-shrink-0 flex items-center justify-between px-4 py-2 border-b border-border bg-muted/20">
              <div className="flex items-center bg-background border border-border rounded-lg p-0.5 gap-0.5">
                <button onClick={() => setPreviewTab("preview")} className={cn("px-2.5 py-1 text-xs font-medium rounded transition-all flex items-center gap-1", previewTab === "preview" ? "bg-card shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground")}>
                  <Eye className="h-3 w-3" /> Preview
                </button>
                <button onClick={() => setPreviewTab("code")} className={cn("px-2.5 py-1 text-xs font-medium rounded transition-all flex items-center gap-1", previewTab === "code" ? "bg-card shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground")}>
                  <Code2 className="h-3 w-3" /> HTML
                </button>
              </div>
              {subjectLine && <span className="hidden md:block text-[10px] text-muted-foreground truncate max-w-xs mx-4"><span className="font-semibold text-foreground">Subject:</span> {subjectLine}</span>}
              <Button variant="outline" size="sm" className="h-7 text-xs gap-1" onClick={handleCopyHtml}>
                {copied ? <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" /> : <Download className="h-3.5 w-3.5" />}
                {copied ? "Copied!" : "Copy HTML"}
              </Button>
            </div>

            {previewTab === "preview" ? (
              <div className="flex-1 overflow-y-auto bg-[#f0ede8]" style={{ minHeight: 0 }}>
                <div style={{ width: "100%", minHeight: "100%", display: "flex", justifyContent: "center", padding: "20px 0 40px" }}>
                  <iframe key={previewHtml.slice(0, 100)} srcDoc={previewHtml} sandbox="allow-same-origin"
                    style={{ border: "none", width: 600, minHeight: 900, flexShrink: 0, background: "#fff" }} />
                </div>
              </div>
            ) : (
              <div className="flex-1 overflow-auto bg-muted/30" style={{ minHeight: 0 }}>
                <pre className="p-4 text-[10px] leading-relaxed font-mono text-muted-foreground whitespace-pre-wrap break-all">{previewHtml}</pre>
              </div>
            )}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
