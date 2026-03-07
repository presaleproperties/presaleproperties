import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Switch } from "@/components/ui/switch";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  ArrowLeft, ArrowRight, Sparkles, Loader2, Copy, Download, CheckCircle2,
  Building2, Image, Mail, FileText, Wand2, Eye, Code2, Save, X, Upload,
  LayoutGrid, Link2, User, Check,
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

// ─── Step definitions ────────────────────────────────────────────────────────
const STEPS = [
  { id: "agent",    label: "Agent",      icon: User       },
  { id: "brief",    label: "Brief",      icon: Wand2      },
  { id: "copy",     label: "Copy",       icon: FileText   },
  { id: "details",  label: "Details",    icon: Building2  },
  { id: "media",    label: "Media",      icon: Image      },
  { id: "assets",   label: "Assets",     icon: Link2      },
  { id: "preview",  label: "Preview",    icon: Eye        },
] as const;

type StepId = typeof STEPS[number]["id"];

// ─── Types ────────────────────────────────────────────────────────────────────
interface FloorPlanEntry { id: string; url: string; label: string; sqft: string }
interface CampaignAsset { id: string; name: string; project_name: string; brochure_url: string | null; pricing_sheet_url: string | null; thumbnail_url: string | null; }

// ─── Build email HTML (hero + floor plans injected) ───────────────────────────
function buildFinalHtml(
  fields: AiEmailCopy,
  agent: AgentInfo,
  heroImage: string,
  floorPlans: FloorPlanEntry[],
  fpHeading: string,
  fpSubheading: string,
  ctaUrl?: string,
): string {
  const base = buildAiEmailHtml(fields, agent, ctaUrl);
  const ACCENT = "#C9A55A";
  const DARK   = "#0d1f18";

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

  if (floorPlans.length > 0) {
    const activePlans = floorPlans.filter(fp => fp.url);
    if (activePlans.length > 0) {
      const heading = fpHeading || "Available Floor Plans";
      const sub     = fpSubheading || "Limited units remaining — register now for priority access";
      const planCells = activePlans.map(fp => `
        <td style="padding:8px;width:${activePlans.length === 1 ? "100%" : "50%"};vertical-align:top;text-align:center;">
          <div style="border:1px solid #e0dbd3;overflow:hidden;background:#fafaf8;">
            <img src="${fp.url}" alt="${fp.label || "Floor Plan"}" width="100%" style="display:block;width:100%;height:auto;" />
            ${fp.label || fp.sqft ? `
            <div style="padding:10px 12px 12px;">
              ${fp.label ? `<p style="margin:0 0 3px 0;font-family:'DM Sans',Arial,sans-serif;font-size:11px;font-weight:600;letter-spacing:1.5px;text-transform:uppercase;color:#111;">${fp.label}</p>` : ""}
              ${fp.sqft  ? `<p style="margin:0;font-family:'DM Sans',Arial,sans-serif;font-size:10px;color:#888;">${fp.sqft}</p>` : ""}
            </div>` : ""}
          </div>
        </td>`).join("");

      const floorPlanBlock = `
  <!-- ─── FLOOR PLANS ─── -->
  <tr><td style="background:${DARK};padding:0;"><div style="height:3px;background:${ACCENT};"></div></td></tr>
  <tr>
    <td style="background:${DARK};padding:28px 36px 8px;">
      <p style="margin:0 0 6px 0;font-family:'DM Sans',Arial,sans-serif;font-size:9px;letter-spacing:3px;text-transform:uppercase;color:${ACCENT};">FLOOR PLANS</p>
      <p style="margin:0 0 8px 0;font-family:'Cormorant Garamond',Georgia,serif;font-size:26px;font-weight:400;color:#ffffff;line-height:1.15;">${heading}</p>
      <p style="margin:0;font-family:'DM Sans',Arial,sans-serif;font-size:12px;color:#8aaa96;line-height:1.6;">${sub}</p>
    </td>
  </tr>
  <tr>
    <td style="background:${DARK};padding:16px 28px 28px;">
      <table cellpadding="0" cellspacing="0" border="0" width="100%"><tr>${planCells}</tr></table>
    </td>
  </tr>
  <tr>
    <td style="background:${DARK};padding:0 36px 28px;">
      <table cellpadding="0" cellspacing="0" border="0">
        <tr>
          <td style="background:${ACCENT};padding:13px 32px;">
            <a href="https://wa.me/16722581100?text=${encodeURIComponent(`Hi! I'm interested in the floor plans for ${fields.projectName || "this project"}. Can you send me more details?`)}" style="font-family:'DM Sans',Arial,sans-serif;font-size:9px;letter-spacing:3px;text-transform:uppercase;color:${DARK};text-decoration:none;font-weight:600;">I'M INTERESTED →</a>
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

// ─── Step progress indicator ──────────────────────────────────────────────────
function StepBar({ current, onGoto, completed }: {
  current: number; onGoto: (i: number) => void; completed: Set<number>;
}) {
  return (
    <div className="flex items-center gap-0 overflow-x-auto">
      {STEPS.map((step, i) => {
        const Icon     = step.icon;
        const isActive = i === current;
        const isDone   = completed.has(i) && i !== current;
        const canClick = i <= Math.max(...Array.from(completed), current);
        return (
          <div key={step.id} className="flex items-center">
            <button
              onClick={() => canClick && onGoto(i)}
              disabled={!canClick}
              className={cn(
                "flex items-center gap-1.5 px-3 py-2 text-[11px] font-semibold transition-all whitespace-nowrap",
                isActive && "text-foreground border-b-2 border-primary",
                isDone   && "text-emerald-600 cursor-pointer hover:text-emerald-700",
                !isActive && !isDone && "text-muted-foreground",
                !canClick && "opacity-40 cursor-not-allowed",
              )}
            >
              {isDone
                ? <Check className="h-3 w-3 text-emerald-500 flex-shrink-0" />
                : <Icon className={cn("h-3 w-3 flex-shrink-0", isActive ? "text-primary" : "text-muted-foreground")} />
              }
              <span className="hidden sm:inline">{step.label}</span>
            </button>
            {i < STEPS.length - 1 && (
              <div className={cn("h-px w-4 flex-shrink-0", isDone ? "bg-emerald-400/50" : "bg-border")} />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function AdminAiEmailBuilder() {
  const navigate = useNavigate();
  const heroInputRef = useRef<HTMLInputElement>(null);
  const fpInputRef   = useRef<HTMLInputElement>(null);

  // Wizard
  const [currentStep, setCurrentStep] = useState(0);
  const [completed, setCompleted]     = useState<Set<number>>(new Set());

  const goTo = (i: number) => setCurrentStep(i);
  const next  = () => {
    setCompleted(prev => new Set([...prev, currentStep]));
    setCurrentStep(s => Math.min(s + 1, STEPS.length - 1));
  };
  const back  = () => setCurrentStep(s => Math.max(s - 1, 0));

  // AI
  const [prompt, setPrompt]               = useState("");
  const [templateType, setTemplateType]   = useState("main-project-email");
  const [selectedProjectId, setSelProject] = useState("none");
  const [aiLoading, setAiLoading]         = useState(false);
  const [activeVersion, setActiveVersion] = useState<"A" | "B">("A");
  const [aiResult, setAiResult]           = useState<Record<string, string> | null>(null);

  // Copy
  const [projectName,       setProjectName]       = useState("");
  const [developerName,     setDevName]            = useState("");
  const [showProjectName,   setShowProjectName]    = useState(true);
  const [showDeveloperName, setShowDeveloperName]  = useState(true);
  const [customHeader,      setCustomHeader]       = useState("");
  const [city,              setCity]               = useState("");
  const [neighborhood,      setNeighborhood]       = useState("");
  const [startingPrice,     setStartingPrice]      = useState("");
  const [deposit,           setDeposit]            = useState("");
  const [completion,        setCompletion]         = useState("");
  const [subjectLine,       setSubjectLine]        = useState("");
  const [previewText,       setPreviewText]        = useState("");
  const [headline,          setHeadline]           = useState("");
  const [bodyCopy,          setBodyCopy]           = useState("");
  const [incentiveText,     setIncentiveText]      = useState("");

  // Media
  const [heroImage,     setHeroImage]     = useState("");
  const [heroUploading, setHeroUploading] = useState(false);
  const [floorPlans,    setFloorPlans]    = useState<FloorPlanEntry[]>([]);
  const [fpHeading,     setFpHeading]     = useState("Available Floor Plans");
  const [fpSubheading,  setFpSubheading]  = useState("Limited units remaining — register now for priority access");
  const [fpUploading,   setFpUploading]   = useState(false);

  // Campaign assets
  const [campaignAssets,  setCampaignAssets]  = useState<CampaignAsset[]>([]);
  const [selectedAssetId, setSelectedAssetId] = useState<string>("none");
  const selectedAsset = campaignAssets.find(a => a.id === selectedAssetId) ?? null;
  const ctaUrl = selectedAsset?.brochure_url || selectedAsset?.pricing_sheet_url || undefined;

  // UI
  const [previewTab, setPreviewTab] = useState<"preview" | "code">("preview");
  const [copied,     setCopied]     = useState(false);
  const [saving,     setSaving]     = useState(false);

  // Data
  const [agents,    setAgents]    = useState<AgentInfo[]>([]);
  const [selAgent,  setSelAgent]  = useState("default");
  const selectedAgent: AgentInfo  = agents.find(a => a.full_name === selAgent) ?? DEFAULT_AGENT;
  const [projects,  setProjects]  = useState<Array<{ id: string; name: string; city: string; featured_image?: string | null }>>([]);

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
    supabase.from("campaign_templates" as any)
      .select("id, name, project_name, brochure_url, pricing_sheet_url, thumbnail_url")
      .order("updated_at", { ascending: false }).limit(50)
      .then(({ data }: any) => {
        if (data) setCampaignAssets(data.filter((a: any) => a.brochure_url || a.pricing_sheet_url));
      });
  }, []);

  const currentCopy = useCallback((): AiEmailCopy => ({
    subjectLine, previewText, headline, bodyCopy, incentiveText,
    projectName: showProjectName ? projectName : (customHeader || ""),
    city, neighborhood,
    developerName: showDeveloperName ? developerName : "",
    startingPrice, deposit, completion,
  }), [subjectLine, previewText, headline, bodyCopy, incentiveText, projectName, showProjectName, customHeader, city, neighborhood, developerName, showDeveloperName, startingPrice, deposit, completion]);

  const previewHtml = buildFinalHtml(currentCopy(), selectedAgent, heroImage, floorPlans, fpHeading, fpSubheading, ctaUrl);

  // ── AI generation ──
  const applyResult = (result: Record<string, string>, v: "A" | "B") => {
    const b = v === "B";
    setSubjectLine(b ? (result.subjectLineB || result.subjectLine || "") : (result.subjectLine || ""));
    setPreviewText(b ? (result.previewTextB || result.previewText || "") : (result.previewText || ""));
    setHeadline(b   ? (result.headlineB    || result.headline    || "") : (result.headline    || ""));
    setBodyCopy(b   ? (result.bodyCopyB    || result.bodyCopy    || "") : (result.bodyCopy    || ""));
    setIncentiveText(result.incentiveText || "");
    if (result.projectName) setProjectName(result.projectName);
    if (result.city)        setCity(result.city);
    if (result.neighborhood) setNeighborhood(result.neighborhood);
    if (result.developerName) setDevName(result.developerName);
    if (result.startingPrice) setStartingPrice(result.startingPrice);
    if (result.deposit)      setDeposit(result.deposit);
    if (result.completion)   setCompletion(result.completion);
  };

  const handleGenerate = async () => {
    if (!prompt.trim()) { toast.error("Enter a brief first"); return; }
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
      if (project?.featured_image && !heroImage) setHeroImage(project.featured_image);
      setCompleted(prev => new Set([...prev, 1]));
      // Advance to copy step
      setCurrentStep(2);
      toast.success("Email copy generated — review and refine below");
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

  // ── Upload helpers ──
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
      const url = await uploadImage(file, "email-assets", `email-hero/${Date.now()}-${file.name}`);
      setHeroImage(url);
      toast.success("Hero image uploaded");
    } catch (err: any) { toast.error("Upload failed: " + err.message); }
    finally { setHeroUploading(false); e.target.value = ""; }
  };

  const handleFpUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    setFpUploading(true);
    try {
      const uploaded: FloorPlanEntry[] = [];
      for (const file of files.slice(0, 2)) {
        const url = await uploadImage(file, "email-assets", `email-floorplans/${Date.now()}-${file.name}`);
        uploaded.push({ id: crypto.randomUUID(), url, label: "", sqft: "" });
      }
      setFloorPlans(prev => [...prev, ...uploaded].slice(0, 2));
      toast.success(`${uploaded.length} floor plan${uploaded.length > 1 ? "s" : ""} uploaded`);
    } catch (err: any) { toast.error("Upload failed: " + err.message); }
    finally { setFpUploading(false); e.target.value = ""; }
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
    else toast.success("Saved to Campaign Hub!");
    setSaving(false);
  };

  // ── Step panels ──────────────────────────────────────────────────────────────
  const stepContent: Record<StepId, React.ReactNode> = {

    // ── STEP 0: Agent ─────────────────────────────────────────────────────────
    agent: (
      <StepPanel
        title="Who's sending this email?"
        subtitle="Choose the agent signature that will appear at the bottom of the email."
        onNext={next} nextLabel="Continue"
      >
        <div className="grid gap-3">
          {agents.map(a => (
            <button
              key={a.full_name}
              onClick={() => setSelAgent(a.full_name)}
              className={cn(
                "flex items-center gap-3 p-3 rounded-xl border-2 transition-all text-left w-full",
                selAgent === a.full_name
                  ? "border-primary bg-primary/5 shadow-sm"
                  : "border-border hover:border-muted-foreground/40 hover:bg-muted/30",
              )}
            >
              {a.photo_url
                ? <img src={a.photo_url} alt={a.full_name} className="w-11 h-11 rounded-full object-cover object-top flex-shrink-0" style={{ border: "2px solid #C9A55A" }} />
                : <div className="w-11 h-11 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold text-primary flex-shrink-0">{a.full_name.charAt(0)}</div>
              }
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold">{a.full_name}</p>
                <p className="text-xs text-muted-foreground">{a.title}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{a.phone}</p>
              </div>
              {selAgent === a.full_name && <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0" />}
            </button>
          ))}
          {agents.length === 0 && <p className="text-sm text-muted-foreground text-center py-4">Loading agents…</p>}
        </div>
      </StepPanel>
    ),

    // ── STEP 1: Brief ────────────────────────────────────────────────────────
    brief: (
      <StepPanel
        title="Describe this email"
        subtitle="Give the AI context about the project, pricing, completion, and any special offers."
        onNext={handleGenerate}
        nextLabel={aiLoading ? "Generating…" : aiResult ? "Regenerate" : "Generate Email"}
        nextIcon={aiLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wand2 className="h-4 w-4" />}
        onBack={back}
        nextDisabled={!prompt.trim() || aiLoading}
        nextHighlight
      >
        <div className="space-y-4">
          <div className="space-y-2">
            <Label className="text-sm font-medium">Your brief</Label>
            <Textarea
              value={prompt}
              onChange={e => setPrompt(e.target.value)}
              placeholder="e.g. New presale in Surrey — 1 & 2 beds from $649K, 2027 completion, PTT exempt. Extended deposit. Highlight the location near King George SkyTrain."
              className="min-h-[120px] text-sm resize-none"
              disabled={aiLoading}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-sm font-medium">Email style</Label>
              <Select value={templateType} onValueChange={setTemplateType} disabled={aiLoading}>
                <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="main-project-email">Main Project Introduction</SelectItem>
                  <SelectItem value="exclusive-offer">Exclusive / VIP Offer</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm font-medium">Link project <span className="text-muted-foreground font-normal">(optional)</span></Label>
              <Select value={selectedProjectId} onValueChange={handleProjectSelect} disabled={aiLoading}>
                <SelectTrigger className="h-9 text-sm"><SelectValue placeholder="Select a project…" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No project</SelectItem>
                  {projects.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

          {aiResult && (
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 dark:bg-emerald-950/20 dark:border-emerald-800 p-4">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="h-5 w-5 text-emerald-500 flex-shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-emerald-700 dark:text-emerald-400">Email generated</p>
                  <p className="text-xs text-emerald-600 dark:text-emerald-500 mt-0.5">Two versions ready — switch between them in the toolbar.</p>
                  <div className="flex gap-2 mt-2">
                    <button onClick={() => handleVersionSwitch("A")} className={cn("px-3 py-1 text-xs font-semibold rounded-full border transition-all", activeVersion === "A" ? "bg-emerald-600 text-white border-emerald-600" : "border-emerald-300 text-emerald-600 hover:bg-emerald-50")}>Version A — Detailed</button>
                    {(aiResult.subjectLineB || aiResult.bodyCopyB) && (
                      <button onClick={() => handleVersionSwitch("B")} className={cn("px-3 py-1 text-xs font-semibold rounded-full border transition-all", activeVersion === "B" ? "bg-amber-500 text-white border-amber-500" : "border-amber-300 text-amber-600 hover:bg-amber-50")}>Version B — Punchy</button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </StepPanel>
    ),

    // ── STEP 2: Copy ────────────────────────────────────────────────────────
    copy: (
      <StepPanel
        title="Review & refine copy"
        subtitle="Edit the AI-generated copy. Every field maps directly to the email."
        onNext={next} onBack={back} nextLabel="Looks good"
      >
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label className="text-sm font-medium">Subject line</Label>
            <Input value={subjectLine} onChange={e => setSubjectLine(e.target.value)} className="h-9 text-sm" placeholder="🏙️ Exclusive Access: Lumina — Surrey Presale" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-sm font-medium">Preview text <span className="text-xs text-muted-foreground font-normal">(shown in inbox)</span></Label>
            <Input value={previewText} onChange={e => setPreviewText(e.target.value)} className="h-9 text-sm" placeholder="From $649K · limited units" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-sm font-medium">Headline</Label>
            <Input value={headline} onChange={e => setHeadline(e.target.value)} className="h-9 text-sm" placeholder="Introducing Lumina — Surrey's Next Landmark" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-sm font-medium">Body copy <span className="text-xs text-muted-foreground font-normal">(each line = paragraph)</span></Label>
            <Textarea value={bodyCopy} onChange={e => setBodyCopy(e.target.value)} className="min-h-[140px] text-sm resize-none" placeholder="Write conversational copy here…" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-sm font-medium">Incentives <span className="text-xs text-muted-foreground font-normal">(one per line, optional)</span></Label>
            <Textarea value={incentiveText} onChange={e => setIncentiveText(e.target.value)} className="min-h-[80px] text-sm resize-none" placeholder={"✦ Extended deposit: 5% now, 5% in 180 days\n✦ Free parking · $35,000 value"} />
          </div>
        </div>
      </StepPanel>
    ),

    // ── STEP 3: Details ──────────────────────────────────────────────────────
    details: (
      <StepPanel
        title="Project details"
        subtitle="These populate the pricing stats bar and location banner in the email."
        onNext={next} onBack={back} nextLabel="Continue"
      >
        <div className="space-y-4">
          {/* Project name */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium">Project name</Label>
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">{showProjectName ? "Visible in email" : "Hidden"}</span>
                <Switch checked={showProjectName} onCheckedChange={setShowProjectName} />
              </div>
            </div>
            <Input value={projectName} onChange={e => setProjectName(e.target.value)} className={cn("h-9 text-sm", !showProjectName && "opacity-40")} placeholder="Lumina" />
          </div>
          {!showProjectName && (
            <div className="space-y-1.5">
              <Label className="text-sm font-medium">Custom header <span className="text-xs text-muted-foreground font-normal">(replaces project name)</span></Label>
              <Input value={customHeader} onChange={e => setCustomHeader(e.target.value)} className="h-9 text-sm" placeholder="New Presale Release" />
            </div>
          )}
          {/* Developer */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium">Developer</Label>
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">{showDeveloperName ? "Visible" : "Hidden"}</span>
                <Switch checked={showDeveloperName} onCheckedChange={setShowDeveloperName} />
              </div>
            </div>
            <Input value={developerName} onChange={e => setDevName(e.target.value)} className={cn("h-9 text-sm", !showDeveloperName && "opacity-40")} placeholder="Bosa Properties" />
          </div>
          {/* Grid fields */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-sm font-medium">City</Label>
              <Input value={city} onChange={e => setCity(e.target.value)} className="h-9 text-sm" placeholder="Surrey" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm font-medium">Neighbourhood</Label>
              <Input value={neighborhood} onChange={e => setNeighborhood(e.target.value)} className="h-9 text-sm" placeholder="Fleetwood" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm font-medium">Starting price</Label>
              <Input value={startingPrice} onChange={e => setStartingPrice(e.target.value)} className="h-9 text-sm" placeholder="$649K" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm font-medium">Deposit</Label>
              <Input value={deposit} onChange={e => setDeposit(e.target.value)} className="h-9 text-sm" placeholder="5%" />
            </div>
            <div className="space-y-1.5 col-span-2">
              <Label className="text-sm font-medium">Completion</Label>
              <Input value={completion} onChange={e => setCompletion(e.target.value)} className="h-9 text-sm" placeholder="2027" />
            </div>
          </div>
        </div>
      </StepPanel>
    ),

    // ── STEP 4: Media ────────────────────────────────────────────────────────
    media: (
      <StepPanel
        title="Add images"
        subtitle="A hero image and floor plans make the email far more engaging."
        onNext={next} onBack={back} nextLabel="Continue"
      >
        <input ref={heroInputRef} type="file" accept="image/*" className="hidden" onChange={handleHeroUpload} />
        <input ref={fpInputRef}   type="file" accept="image/*" multiple className="hidden" onChange={handleFpUpload} />

        <div className="space-y-6">
          {/* Hero */}
          <div className="space-y-2">
            <Label className="text-sm font-medium flex items-center gap-1.5"><Image className="h-3.5 w-3.5 text-muted-foreground" /> Hero image</Label>
            {heroImage ? (
              <div className="relative rounded-xl overflow-hidden border border-border">
                <img src={heroImage} alt="Hero" className="w-full h-36 object-cover" onError={() => setHeroImage("")} />
                <button onClick={() => setHeroImage("")} className="absolute top-2 right-2 h-6 w-6 bg-destructive/90 hover:bg-destructive rounded-full flex items-center justify-center shadow">
                  <X className="h-3.5 w-3.5 text-white" />
                </button>
              </div>
            ) : (
              <button onClick={() => heroInputRef.current?.click()} disabled={heroUploading}
                className="w-full h-24 rounded-xl border-2 border-dashed border-border hover:border-primary/50 hover:bg-muted/30 transition-all flex flex-col items-center justify-center gap-1.5 text-muted-foreground">
                {heroUploading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Upload className="h-5 w-5" />}
                <span className="text-xs font-medium">{heroUploading ? "Uploading…" : "Upload hero image"}</span>
              </button>
            )}
            {/* Project image picker */}
            {projects.filter(p => p.featured_image).length > 0 && !heroImage && (
              <div className="space-y-1.5">
                <p className="text-xs text-muted-foreground">Or pick from your projects:</p>
                <div className="grid grid-cols-4 gap-1.5">
                  {projects.filter(p => p.featured_image).slice(0, 8).map(p => (
                    <button key={p.id} onClick={() => setHeroImage(p.featured_image!)}
                      className="relative rounded-lg overflow-hidden border-2 border-transparent hover:border-primary/50 aspect-video transition-all">
                      <img src={p.featured_image!} alt={p.name} className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              </div>
            )}
            {/* Manual URL */}
            <div className="flex gap-2 items-center">
              <div className="h-px flex-1 bg-border" />
              <span className="text-[10px] text-muted-foreground">or enter URL</span>
              <div className="h-px flex-1 bg-border" />
            </div>
            <Input value={heroImage} onChange={e => setHeroImage(e.target.value)} className="h-9 text-sm" placeholder="https://…" />
          </div>

          {/* Floor plans */}
          <div className="space-y-2">
            <Label className="text-sm font-medium flex items-center gap-1.5"><LayoutGrid className="h-3.5 w-3.5 text-muted-foreground" /> Floor plans <span className="text-xs text-muted-foreground font-normal">(up to 2)</span></Label>
            {floorPlans.length < 2 && (
              <button onClick={() => fpInputRef.current?.click()} disabled={fpUploading}
                className="w-full h-20 rounded-xl border-2 border-dashed border-border hover:border-primary/50 hover:bg-muted/30 transition-all flex flex-col items-center justify-center gap-1.5 text-muted-foreground">
                {fpUploading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Upload className="h-5 w-5" />}
                <span className="text-xs font-medium">{fpUploading ? "Uploading…" : `Upload floor plan${floorPlans.length === 1 ? " (1 more allowed)" : "s"}`}</span>
              </button>
            )}
            {floorPlans.map(fp => (
              <div key={fp.id} className="border border-border rounded-xl overflow-hidden bg-muted/20">
                <div className="relative">
                  <img src={fp.url} alt="Floor plan" className="w-full h-32 object-contain bg-white" />
                  <button onClick={() => removeFp(fp.id)} className="absolute top-2 right-2 h-6 w-6 bg-destructive/90 hover:bg-destructive rounded-full flex items-center justify-center shadow">
                    <X className="h-3.5 w-3.5 text-white" />
                  </button>
                </div>
                <div className="p-2.5 grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <Label className="text-xs">Label</Label>
                    <Input value={fp.label} onChange={e => updateFp(fp.id, "label", e.target.value)} className="h-8 text-xs" placeholder="1 Bed + Den" />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Size</Label>
                    <Input value={fp.sqft}  onChange={e => updateFp(fp.id, "sqft",  e.target.value)} className="h-8 text-xs" placeholder="678 sq ft" />
                  </div>
                </div>
              </div>
            ))}
            {floorPlans.length > 0 && (
              <div className="space-y-2 pt-1">
                <div className="space-y-1">
                  <Label className="text-xs">Section heading</Label>
                  <Input value={fpHeading}    onChange={e => setFpHeading(e.target.value)}    className="h-8 text-sm" />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Sub-heading</Label>
                  <Input value={fpSubheading} onChange={e => setFpSubheading(e.target.value)} className="h-8 text-sm" />
                </div>
              </div>
            )}
          </div>
        </div>
      </StepPanel>
    ),

    // ── STEP 5: Assets ───────────────────────────────────────────────────────
    assets: (
      <StepPanel
        title="Link campaign assets"
        subtitle='Connect a saved campaign to power the "VIEW PLANS & PRICING" CTA button.'
        onNext={next} onBack={back} nextLabel="Continue"
      >
        {campaignAssets.length === 0 ? (
          <div className="rounded-xl border border-border bg-muted/30 p-6 text-center space-y-2">
            <Link2 className="h-8 w-8 text-muted-foreground mx-auto" />
            <p className="text-sm font-medium text-muted-foreground">No campaign assets yet</p>
            <p className="text-xs text-muted-foreground">Save a campaign in the Campaign Builder with a brochure or pricing sheet URL — it will appear here.</p>
          </div>
        ) : (
          <div className="space-y-4">
            <Select value={selectedAssetId} onValueChange={setSelectedAssetId}>
              <SelectTrigger className="h-9 text-sm"><SelectValue placeholder="Select a campaign…" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">None — use default link</SelectItem>
                {campaignAssets.map(a => (
                  <SelectItem key={a.id} value={a.id}>{a.name} — {a.project_name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selectedAsset && (
              <div className="rounded-xl border border-border bg-muted/20 overflow-hidden">
                {selectedAsset.thumbnail_url && (
                  <img src={selectedAsset.thumbnail_url} alt={selectedAsset.name} className="w-full h-28 object-cover" />
                )}
                <div className="p-3 space-y-2">
                  <p className="text-sm font-semibold">{selectedAsset.name}</p>
                  <p className="text-xs text-muted-foreground">{selectedAsset.project_name}</p>
                  {selectedAsset.brochure_url && (
                    <div className="flex items-center gap-2 text-xs text-emerald-600">
                      <div className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                      Brochure URL linked to CTA button
                    </div>
                  )}
                  {selectedAsset.pricing_sheet_url && (
                    <div className="flex items-center gap-2 text-xs text-amber-600">
                      <div className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                      Pricing sheet URL linked to CTA button
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </StepPanel>
    ),

    // ── STEP 6: Preview ──────────────────────────────────────────────────────
    preview: (
      <div className="flex flex-col h-full min-h-0">
        {/* Toolbar */}
        <div className="flex-shrink-0 flex items-center justify-between px-5 py-2.5 border-b border-border bg-muted/20">
          <div className="flex items-center gap-1 bg-background border border-border rounded-lg p-0.5">
            <button onClick={() => setPreviewTab("preview")} className={cn("px-2.5 py-1 text-xs font-medium rounded transition-all flex items-center gap-1", previewTab === "preview" ? "bg-card shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground")}>
              <Eye className="h-3 w-3" /> Preview
            </button>
            <button onClick={() => setPreviewTab("code")} className={cn("px-2.5 py-1 text-xs font-medium rounded transition-all flex items-center gap-1", previewTab === "code" ? "bg-card shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground")}>
              <Code2 className="h-3 w-3" /> HTML
            </button>
          </div>
          {subjectLine && <span className="hidden md:block text-[11px] text-muted-foreground truncate max-w-sm mx-4"><span className="font-semibold text-foreground">Subject:</span> {subjectLine}</span>}
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" className="h-8 text-xs gap-1.5" onClick={back}>
              <ArrowLeft className="h-3.5 w-3.5" /> Back
            </Button>
            <Button variant="outline" size="sm" className="h-8 text-xs gap-1.5" onClick={handleSave} disabled={saving}>
              {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />} Save
            </Button>
            <Button size="sm" className="h-8 text-xs gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white" onClick={handleCopyHtml}>
              {copied ? <CheckCircle2 className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
              {copied ? "Copied!" : "Copy HTML"}
            </Button>
          </div>
        </div>
        {/* Preview / Code */}
        {previewTab === "preview" ? (
          <div className="flex-1 overflow-y-auto bg-[#f0ede8]" style={{ minHeight: 0 }}>
            <div style={{ width: "100%", minHeight: "100%", display: "flex", justifyContent: "center", padding: "24px 0 48px" }}>
              <iframe key={previewHtml.slice(0, 100)} srcDoc={previewHtml} sandbox="allow-same-origin"
                style={{ border: "none", width: 600, minHeight: 900, flexShrink: 0, background: "#fff" }} />
            </div>
          </div>
        ) : (
          <div className="flex-1 overflow-auto bg-muted/30" style={{ minHeight: 0 }}>
            <pre className="p-5 text-[10px] leading-relaxed font-mono text-muted-foreground whitespace-pre-wrap break-all">{previewHtml}</pre>
          </div>
        )}
      </div>
    ),
  };

  const currentStepId = STEPS[currentStep].id;

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
            <p className="text-[10px] text-muted-foreground mt-0.5">Step-by-step email generation</p>
          </div>

          {/* Version tabs (shown when AI result exists) */}
          {aiResult && currentStepId !== "preview" && (
            <div className="flex items-center bg-muted rounded-lg p-0.5 gap-0.5">
              <button onClick={() => handleVersionSwitch("A")} className={cn("px-2.5 py-1 text-[11px] font-semibold rounded transition-all", activeVersion === "A" ? "bg-emerald-600 text-white shadow-sm" : "text-muted-foreground hover:text-foreground")}>Ver A</button>
              {(aiResult.subjectLineB || aiResult.bodyCopyB) && (
                <button onClick={() => handleVersionSwitch("B")} className={cn("px-2.5 py-1 text-[11px] font-semibold rounded transition-all", activeVersion === "B" ? "bg-amber-500 text-white shadow-sm" : "text-muted-foreground hover:text-foreground")}>Ver B</button>
              )}
            </div>
          )}

          {currentStepId !== "preview" && (
            <Button size="sm" className="h-7 text-xs gap-1 bg-emerald-600 hover:bg-emerald-700 text-white" onClick={() => { setCompleted(prev => new Set([...prev, ...STEPS.map((_, i) => i)])); setCurrentStep(STEPS.length - 1); }} disabled={!headline && !subjectLine}>
              <Eye className="h-3 w-3" /> Preview
            </Button>
          )}
        </div>

        {/* ── Step bar ── */}
        <div className="flex-shrink-0 border-b border-border bg-card px-4">
          <StepBar current={currentStep} onGoto={goTo} completed={completed} />
        </div>

        {/* ── Step content ── */}
        <div className="flex-1 min-h-0 overflow-hidden">
          {currentStepId === "preview"
            ? <div className="h-full flex flex-col">{stepContent.preview}</div>
            : (
              <div className="h-full overflow-y-auto">
                <div className="max-w-xl mx-auto px-6 py-8">
                  {stepContent[currentStepId]}
                </div>
              </div>
            )
          }
        </div>
      </div>
    </AdminLayout>
  );
}

// ─── Reusable step panel wrapper ─────────────────────────────────────────────
function StepPanel({
  title, subtitle, children, onNext, onBack, nextLabel = "Continue",
  nextIcon, nextDisabled = false, nextHighlight = false,
}: {
  title: string; subtitle?: string; children: React.ReactNode;
  onNext?: () => void; onBack?: () => void;
  nextLabel?: string; nextIcon?: React.ReactNode;
  nextDisabled?: boolean; nextHighlight?: boolean;
}) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold tracking-tight">{title}</h2>
        {subtitle && <p className="text-sm text-muted-foreground mt-1">{subtitle}</p>}
      </div>
      <div>{children}</div>
      <div className="flex items-center justify-between pt-2">
        {onBack
          ? <Button variant="outline" onClick={onBack} className="gap-1.5"><ArrowLeft className="h-3.5 w-3.5" /> Back</Button>
          : <div />
        }
        {onNext && (
          <Button
            onClick={onNext}
            disabled={nextDisabled}
            className={cn("gap-1.5 min-w-[120px]", nextHighlight && "bg-gradient-to-r from-violet-600 to-violet-700 hover:from-violet-700 hover:to-violet-800 text-white")}
          >
            {nextIcon}
            {nextLabel}
            {!nextIcon && <ArrowRight className="h-3.5 w-3.5" />}
          </Button>
        )}
      </div>
    </div>
  );
}
