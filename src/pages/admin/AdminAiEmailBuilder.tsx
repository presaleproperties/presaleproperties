import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Switch } from "@/components/ui/switch";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  ArrowLeft, Sparkles, Loader2, Copy, CheckCircle2,
  Building2, Image, Mail, FileText, Wand2,
  Eye, Code2, Save, X, Upload, ChevronDown, ChevronUp, Monitor, Smartphone, Type, Bold,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { buildAiEmailHtml, type AiEmailCopy, type AgentInfo, DEFAULT_AGENT, EMAIL_FONT_PAIRINGS, type EmailFontPairing } from "@/components/admin/AiEmailTemplate";

// ─── Constants ────────────────────────────────────────────────────────────────
const AGENT_CONTACTS: Record<string, { phone: string; email: string }> = {
  "Uzair":  { phone: "778-231-3592",      email: "info@presaleproperties.com" },
  "Sarb":   { phone: "+1 (778) 846-7065", email: "sarb@presaleproperties.com"  },
  "Ravish": { phone: "+1 (604) 349-9399", email: "ravish@presaleproperties.com" },
};

// ─── Types ────────────────────────────────────────────────────────────────────
interface FloorPlanEntry { id: string; url: string; label: string; sqft: string }
interface ImageCardEntry { id: string; url: string; caption: string }
interface CampaignAsset {
  id: string; name: string; project_name: string;
  brochure_url: string | null; pricing_sheet_url: string | null; thumbnail_url: string | null;
}

// ─── Step section (matches manual builder) ───────────────────────────────────
function StepSection({
  step, title, icon, done, doneLabel, accent, defaultOpen = true, children,
}: {
  step: number; title: string; icon: React.ReactNode;
  done?: boolean; doneLabel?: string; accent?: "gold" | "green";
  defaultOpen?: boolean; children: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border-b border-border last:border-b-0">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-muted/30 transition-colors text-left"
      >
        {/* Step number */}
        <div className={cn(
          "w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 transition-colors",
          done ? "bg-emerald-500 text-white" : "bg-muted text-muted-foreground"
        )}>
          {done ? "✓" : step}
        </div>
        {/* Icon + Title */}
        <div className={cn(
          "shrink-0",
          accent === "gold" ? "text-amber-500" : accent === "green" ? "text-emerald-500" : "text-primary"
        )}>
          {icon}
        </div>
        <div className="flex-1 min-w-0">
          <span className="text-[11px] font-semibold text-foreground">{title}</span>
          {done && doneLabel && (
            <span className="text-[10px] text-muted-foreground ml-2 truncate">{doneLabel}</span>
          )}
        </div>
        {open
          ? <ChevronUp className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
          : <ChevronDown className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
        }
      </button>
      {open && <div className="px-3 pb-3 pt-0.5 space-y-2.5">{children}</div>}
    </div>
  );
}

// ─── Build final email HTML ───────────────────────────────────────────────────
function buildFinalHtml(
  fields: AiEmailCopy, agent: AgentInfo, heroImage: string,
  floorPlans: FloorPlanEntry[], fpHeading: string, fpSubheading: string, ctaUrl?: string,
  font?: EmailFontPairing,
): string {
  // Headline always shows in the body — never suppressed
  const base   = buildAiEmailHtml(fields, agent, ctaUrl, font, false);
  const ACCENT = "#C9A55A";
  const DARK   = "#0d1f18";
  const bodyFont = font?.body || "'DM Sans', Helvetica, Arial, sans-serif";

  // Hero image sits above the stats bar, no text overlay — clean editorial look
  let html = heroImage
    ? base.replace(
        "<!-- ─── HERO STATS BAR",
        `  <!-- ─── HERO IMAGE ─── -->
  <tr>
    <td style="padding:0;line-height:0;font-size:0;">
      <img src="${heroImage}" alt="${fields.projectName || "Project"}" width="600"
           style="display:block;width:100%;max-width:600px;height:auto;" />
    </td>
  </tr>
  <!-- ─── HERO STATS BAR`,
      )
    : base;

  if (floorPlans.length > 0) {
    const active = floorPlans.filter(fp => fp.url);
    if (active.length > 0) {
      const heading = fpHeading  || "Available Floor Plans";
      const sub     = fpSubheading || "Limited units remaining — register now for priority access";
      const cells   = active.map(fp => `
        <td style="padding:8px;width:${active.length === 1 ? "100%" : "50%"};vertical-align:top;text-align:center;">
          <div style="border:1px solid #e0dbd3;overflow:hidden;background:#fafaf8;">
            <img src="${fp.url}" alt="${fp.label || "Floor Plan"}" width="100%" style="display:block;width:100%;height:auto;" />
            ${fp.label || fp.sqft ? `<div style="padding:10px 12px 12px;">
              ${fp.label ? `<p style="margin:0 0 3px 0;font-family:${bodyFont};font-size:11px;font-weight:600;letter-spacing:1.5px;text-transform:uppercase;color:#111;">${fp.label}</p>` : ""}
              ${fp.sqft  ? `<p style="margin:0;font-family:${bodyFont};font-size:10px;color:#888;">${fp.sqft}</p>`  : ""}
            </div>` : ""}
          </div>
        </td>`).join("");
      const displayFont = font?.display || "'Cormorant Garamond', Georgia, serif";
      const block = `
  <!-- ─── FLOOR PLANS ─── -->
  <tr><td style="background:${DARK};padding:0;"><div style="height:3px;background:${ACCENT};"></div></td></tr>
  <tr><td style="background:${DARK};padding:28px 36px 8px;">
    <p style="margin:0 0 6px 0;font-family:${bodyFont};font-size:9px;letter-spacing:3px;text-transform:uppercase;color:${ACCENT};">FLOOR PLANS</p>
    <p style="margin:0 0 8px 0;font-family:${displayFont};font-size:26px;font-weight:600;color:#ffffff;line-height:1.15;">${heading}</p>
    <p style="margin:0;font-family:${bodyFont};font-size:12px;color:#8aaa96;line-height:1.6;">${sub}</p>
  </td></tr>
  <tr><td style="background:${DARK};padding:16px 28px 28px;">
    <table cellpadding="0" cellspacing="0" border="0" width="100%"><tr>${cells}</tr></table>
  </td></tr>
  <tr><td style="background:${DARK};padding:0 36px 28px;">
    <table cellpadding="0" cellspacing="0" border="0"><tr>
      <td style="background:${ACCENT};padding:13px 32px;">
        <a href="https://wa.me/16722581100?text=${encodeURIComponent(`Hi! I'm interested in the floor plans for ${fields.projectName || "this project"}. Can you send me more details?`)}" style="font-family:${bodyFont};font-size:9px;letter-spacing:3px;text-transform:uppercase;color:${DARK};text-decoration:none;font-weight:600;">I'M INTERESTED →</a>
      </td>
    </tr></table>
  </td></tr>`;
      html = html.replace("<!-- ─── AGENT CARD", block + "\n  <!-- ─── AGENT CARD");
    }
  }
  return html;
}

// ─── Main component ───────────────────────────────────────────────────────────
const DRAFT_KEY = "ai-email-builder-draft";

// Template presets from URL ?template= param
const TEMPLATE_PRESETS: Record<string, Partial<{
  templateType: string; headline: string; bodyCopy: string;
  subjectLine: string; previewText: string; incentiveText: string;
}>> = {
  "project-email": {
    templateType: "main-project-email",
    headline: "Introducing — [Project Name]",
    subjectLine: "🏙️ Exclusive Access: [Project Name] — [City] Presale",
    previewText: "From $[Price] · limited units available",
    bodyCopy: "I wanted to personally reach out with the full details on this opportunity. Below you'll find everything — the pricing, floor plans, deposit structure, and key highlights. I work exclusively with buyers, so my job is to make sure you have everything you need to make the right decision. Give me a call whenever you're ready.\n\nUzair Muhammad",
    incentiveText: "",
  },
  "exclusive-offer": {
    templateType: "exclusive-offer",
    headline: "Exclusive Offer — [Time-Sensitive Pricing]",
    subjectLine: "⚡ VIP-Only Offer: [Project Name] — Act Before [Date]",
    previewText: "Exclusive savings available for a limited time — see details inside",
    bodyCopy: "This is one of those rare moments where everything lines up — the right project, the right price, and the right timing. I've been holding this back for our VIP list only. Below are the details. This window is short, so please reach out as soon as you've had a chance to review.\n\nUzair Muhammad",
    incentiveText: "✦ Extended deposit structure: 5% now, 5% in 180 days\n✦ Developer bonus: $10,000 in upgrades\n✦ Free parking (valued at $35,000)\n✦ Assignment clause included",
  },
  "blank": {
    templateType: "main-project-email",
    headline: "", bodyCopy: "", subjectLine: "", previewText: "", incentiveText: "",
  },
};

export default function AdminEmailBuilderPage() {
  const navigate        = useNavigate();
  const [searchParams]  = useSearchParams();
  const heroInputRef    = useRef<HTMLInputElement>(null);
  const fpInputRef      = useRef<HTMLInputElement>(null);
  const imgCardInputRef = useRef<HTMLInputElement>(null);
  const iframeRef       = useRef<HTMLIFrameElement>(null);

  // Resolve URL template preset (only on first mount, before reading draft)
  const urlTemplate = searchParams.get("template") ?? "";
  const urlPreset   = TEMPLATE_PRESETS[urlTemplate] ?? null;

  // ── Restore draft from localStorage ─────────────────────────────────────────
  // If a URL template preset is specified, skip the saved draft and use preset values
  const savedDraft = useMemo(() => {
    if (urlPreset) return null; // fresh start when navigating from hub
    try { return JSON.parse(localStorage.getItem(DRAFT_KEY) || "null"); } catch { return null; }
  }, []); // eslint-disable-line

  // AI state
  const [prompt,         setPrompt]         = useState(savedDraft?.prompt         ?? "");
  const [templateType,   setTemplateType]   = useState(urlPreset?.templateType ?? savedDraft?.templateType   ?? "main-project-email");
  const [selProjectId,   setSelProjectId]   = useState(savedDraft?.selProjectId   ?? "none");
  const [aiLoading,      setAiLoading]      = useState(false);
  const [boldLoading,    setBoldLoading]    = useState(false);
  const [activeVersion,  setActiveVersion]  = useState<"A" | "B">(savedDraft?.activeVersion ?? "A");
  const [aiResult,       setAiResult]       = useState<Record<string, string> | null>(savedDraft?.aiResult ?? null);

  // Copy fields
  const [projectName,       setProjectName]       = useState(savedDraft?.projectName       ?? "");
  const [developerName,     setDevName]            = useState(savedDraft?.developerName     ?? "");
  const [showProjectName,   setShowProjectName]    = useState(savedDraft?.showProjectName   ?? true);
  const [showDeveloperName, setShowDeveloperName]  = useState(savedDraft?.showDeveloperName ?? true);
  const [customHeader,      setCustomHeader]       = useState(savedDraft?.customHeader      ?? "");
  const [city,              setCity]               = useState(savedDraft?.city              ?? "");
  const [neighborhood,      setNeighborhood]       = useState(savedDraft?.neighborhood      ?? "");
  const [startingPrice,     setStartingPrice]      = useState(savedDraft?.startingPrice     ?? "");
  const [deposit,           setDeposit]            = useState(savedDraft?.deposit           ?? "");
  const [completion,        setCompletion]         = useState(savedDraft?.completion        ?? "");
  const [infoRows,          setInfoRows]           = useState<string[]>(savedDraft?.infoRows ?? []);
  const [subjectLine,       setSubjectLine]        = useState(urlPreset?.subjectLine   ?? savedDraft?.subjectLine       ?? "");
  const [previewText,       setPreviewText]        = useState(urlPreset?.previewText   ?? savedDraft?.previewText       ?? "");
  const [headline,          setHeadline]           = useState(urlPreset?.headline      ?? savedDraft?.headline          ?? "");
  const [bodyCopy,          setBodyCopy]           = useState(urlPreset?.bodyCopy      ?? savedDraft?.bodyCopy          ?? "");
  const [incentiveText,     setIncentiveText]      = useState(urlPreset?.incentiveText ?? savedDraft?.incentiveText     ?? "");

  // Media
  const [heroImage,     setHeroImage]     = useState(savedDraft?.heroImage ?? "");
  const [heroUploading, setHeroUploading] = useState(false);
  const [floorPlans,    setFloorPlans]    = useState<FloorPlanEntry[]>(savedDraft?.floorPlans ?? []);
  const [fpHeading,     setFpHeading]     = useState(savedDraft?.fpHeading    ?? "Available Floor Plans");
  const [fpSubheading,  setFpSubheading]  = useState(savedDraft?.fpSubheading ?? "Limited units remaining — register now for priority access");
  const [fpUploading,   setFpUploading]   = useState(false);
  const [imageCards,    setImageCards]    = useState<ImageCardEntry[]>(savedDraft?.imageCards ?? []);
  const [imgCardUploading, setImgCardUploading] = useState(false);

  // Campaign assets
  const [campaignAssets,   setCampaignAssets]   = useState<CampaignAsset[]>([]);
  const [selectedAssetId,  setSelectedAssetId]  = useState<string>(savedDraft?.selectedAssetId ?? "none");
  const [directCtaUrl,     setDirectCtaUrl]     = useState(savedDraft?.directCtaUrl ?? "");
  const [ctaPdfUploading,  setCtaPdfUploading]  = useState(false);
  const ctaPdfInputRef = useRef<HTMLInputElement>(null);
  const selectedAsset = campaignAssets.find(a => a.id === selectedAssetId) ?? null;
  const ctaUrl = directCtaUrl || selectedAsset?.brochure_url || selectedAsset?.pricing_sheet_url || undefined;

  // Typography
  const savedFontId = savedDraft?.fontId ?? "cormorant-dm";
  const [selectedFontId, setSelectedFontId] = useState<string>(savedFontId);
  const selectedFont = EMAIL_FONT_PAIRINGS.find(f => f.id === selectedFontId) ?? EMAIL_FONT_PAIRINGS[0];

  // UI
  const [previewMode,   setPreviewMode]   = useState<"preview" | "edit" | "code">("preview");
  const [previewDevice, setPreviewDevice] = useState<"desktop" | "mobile">("desktop");
  const [copied,        setCopied]        = useState(false);
  const [saving,        setSaving]        = useState(false);
  const [draftSavedAt,  setDraftSavedAt]  = useState<Date | null>(savedDraft ? new Date(savedDraft._savedAt || Date.now()) : null);

  // Data
  const [agents,   setAgents]   = useState<AgentInfo[]>([]);
  const [selAgent, setSelAgent] = useState(savedDraft?.selAgent ?? "default");
  const selectedAgent: AgentInfo = agents.find(a => a.full_name === selAgent) ?? DEFAULT_AGENT;
  const [projects, setProjects] = useState<Array<{
    id: string; name: string; city: string; neighborhood?: string | null;
    developer_name?: string | null; starting_price?: number | null; price_range?: string | null;
    deposit_structure?: string | null; deposit_percent?: number | null;
    completion_year?: number | null; completion_month?: number | null;
    featured_image?: string | null; incentives?: string | null;
  }>>([]);

  useEffect(() => {
    supabase.from("presale_projects")
      .select("id, name, city, neighborhood, developer_name, starting_price, price_range, deposit_structure, deposit_percent, completion_year, completion_month, featured_image, incentives")
      .order("name").limit(100)
      .then(({ data }: any) => { if (data) setProjects(data); });

    supabase.from("team_members_public" as any).select("id, full_name, title, photo_url")
      .eq("is_active", true).order("sort_order")
      .then(({ data }: any) => {
        if (data) {
          const enriched: AgentInfo[] = data.map((m: any) => {
            const c = AGENT_CONTACTS[m.full_name?.split(" ")[0]] ?? { phone: "", email: "" };
            return { full_name: m.full_name ?? "", title: m.title ?? "Presale Specialist", photo_url: m.photo_url ?? null, ...c };
          });
          setAgents(enriched);
          // Only set default agent if no draft
          if (enriched.length > 0 && !savedDraft?.selAgent) setSelAgent(enriched[0].full_name);
        }
      });

    supabase.from("campaign_templates" as any)
      .select("id, name, project_name, brochure_url, pricing_sheet_url, thumbnail_url")
      .order("updated_at", { ascending: false }).limit(50)
      .then(({ data }: any) => {
        if (data) setCampaignAssets(data.filter((a: any) => a.brochure_url || a.pricing_sheet_url));
      });
  }, []);

  // ── Auto-save draft to localStorage ─────────────────────────────────────────
  const autoSaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);
    autoSaveTimerRef.current = setTimeout(() => {
      const draft = {
        _savedAt: new Date().toISOString(),
        prompt, templateType, selProjectId, activeVersion, aiResult,
        projectName, developerName, showProjectName, showDeveloperName, customHeader,
        city, neighborhood, startingPrice, deposit, completion, infoRows,
        subjectLine, previewText, headline, bodyCopy, incentiveText,
        heroImage, floorPlans, fpHeading, fpSubheading, imageCards,
        selectedAssetId, directCtaUrl, selAgent, fontId: selectedFontId,
      };
      try { localStorage.setItem(DRAFT_KEY, JSON.stringify(draft)); } catch {}
      setDraftSavedAt(new Date());
    }, 1500);
    return () => { if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current); };
  }, [
    prompt, templateType, selProjectId, activeVersion, aiResult,
    projectName, developerName, showProjectName, showDeveloperName, customHeader,
    city, neighborhood, startingPrice, deposit, completion, infoRows,
    subjectLine, previewText, headline, bodyCopy, incentiveText,
    heroImage, floorPlans, fpHeading, fpSubheading, imageCards,
    selectedAssetId, directCtaUrl, selAgent, selectedFontId,
  ]);

  // ── Derived HTML ─────────────────────────────────────────────────────────────
  const currentCopy = useCallback((): AiEmailCopy => ({
    subjectLine, previewText, headline, bodyCopy, incentiveText,
    projectName: showProjectName ? projectName : (customHeader || ""),
    city, neighborhood,
    developerName: showDeveloperName ? developerName : "",
    startingPrice, deposit, completion,
    infoRows: infoRows.filter(r => r.includes("|")),
    imageCards: imageCards.filter(c => c.url),
  }), [subjectLine, previewText, headline, bodyCopy, incentiveText, projectName, showProjectName, customHeader, city, neighborhood, developerName, showDeveloperName, startingPrice, deposit, completion, infoRows, imageCards]);

  // Debounced preview HTML — updates 800ms after last change so iframe doesn't re-render on every keystroke
  const [previewHtml, setPreviewHtml] = useState(() =>
    buildFinalHtml(currentCopy(), selectedAgent, heroImage, floorPlans, fpHeading, fpSubheading, ctaUrl, selectedFont)
  );
  const previewTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (previewTimerRef.current) clearTimeout(previewTimerRef.current);
    previewTimerRef.current = setTimeout(() => {
      setPreviewHtml(buildFinalHtml(currentCopy(), selectedAgent, heroImage, floorPlans, fpHeading, fpSubheading, ctaUrl, selectedFont));
    }, 800);
    return () => { if (previewTimerRef.current) clearTimeout(previewTimerRef.current); };
  }, [currentCopy, selectedAgent, heroImage, floorPlans, fpHeading, fpSubheading, ctaUrl, selectedFont]);

  // finalHtml used only for copy/save — always reflects latest state
  const finalHtml = buildFinalHtml(currentCopy(), selectedAgent, heroImage, floorPlans, fpHeading, fpSubheading, ctaUrl, selectedFont);

  // ── AI generation ─────────────────────────────────────────────────────────────
  const applyResult = (result: Record<string, string>, v: "A" | "B") => {
    const b = v === "B";
    setSubjectLine(b ? (result.subjectLineB || result.subjectLine || "") : (result.subjectLine || ""));
    setPreviewText(b ? (result.previewTextB || result.previewText || "") : (result.previewText || ""));
    setHeadline(b   ? (result.headlineB    || result.headline    || "") : (result.headline    || ""));
    setBodyCopy(b   ? (result.bodyCopyB    || result.bodyCopy    || "") : (result.bodyCopy    || ""));
    setIncentiveText(result.incentiveText || "");
    if (result.projectName)  setProjectName(result.projectName);
    if (result.city)         setCity(result.city);
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
      const project = projects.find(p => p.id === selProjectId && selProjectId !== "none");
      const { data, error } = await supabase.functions.invoke("generate-email-copy", {
        body: { prompt: prompt.trim(), projectDetails: project ? { name: project.name, city: project.city } : null, templateType },
      });
      if (error) throw new Error(error.message);
      if (data?.error) throw new Error(data.error);
      setAiResult(data.copy);
      setActiveVersion("A");
      applyResult(data.copy, "A");
      if (project?.featured_image && !heroImage) setHeroImage(project.featured_image);
      toast.success("Email copy generated ✓");
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

  // ── Bold keywords only ────────────────────────────────────────────────────────
  const handleBoldKeywords = async () => {
    if (!bodyCopy.trim() && !headline.trim()) { toast.error("Paste your copy first"); return; }
    setBoldLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("bold-email-keywords", {
        body: { bodyCopy: bodyCopy.trim(), headline: headline.trim() },
      });
      if (error) throw new Error(error.message);
      if (data?.error) throw new Error(data.error);
      if (data?.bodyCopy) setBodyCopy(data.bodyCopy);
      if (data?.headline) setHeadline(data.headline);
      toast.success("Keywords bolded ✓");
    } catch (e: any) {
      toast.error(e.message || "Failed to bold keywords");
    } finally {
      setBoldLoading(false);
    }
  };

  const handleProjectSelect = (id: string) => {
    setSelProjectId(id);
    const p = projects.find(proj => proj.id === id);
    if (!p) return;
    setProjectName(p.name);
    setCity(p.city);
    if (p.neighborhood)    setNeighborhood(p.neighborhood);
    if (p.developer_name)  setDevName(p.developer_name);
    if (p.featured_image)  setHeroImage(p.featured_image);
    if (p.incentives)      setIncentiveText(p.incentives);
    // Populate starting price
    const priceStr = p.price_range || (p.starting_price ? `From $${(p.starting_price / 1000).toFixed(0)}K` : "");
    if (priceStr) setStartingPrice(priceStr);
    // Populate deposit
    const depositStr = p.deposit_structure || (p.deposit_percent ? `${p.deposit_percent}%` : "");
    if (depositStr) setDeposit(depositStr);
    // Populate completion
    if (p.completion_year) {
      const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
      const monthStr = p.completion_month ? `${MONTHS[p.completion_month - 1]} ` : "";
      setCompletion(`${monthStr}${p.completion_year}`);
    }
    toast.success(`Loaded: ${p.name}`);
  };

  // ── Uploads ──────────────────────────────────────────────────────────────────
  const uploadImage = async (file: File, bucket: string, path: string): Promise<string> => {
    const { error } = await supabase.storage.from(bucket).upload(path, file, { upsert: true, contentType: file.type });
    if (error) throw error;
    return supabase.storage.from(bucket).getPublicUrl(path).data.publicUrl;
  };

  const handleHeroUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return;
    setHeroUploading(true);
    try { setHeroImage(await uploadImage(file, "email-assets", `email-hero/${Date.now()}-${file.name}`)); toast.success("Hero image uploaded"); }
    catch (err: any) { toast.error("Upload failed: " + err.message); }
    finally { setHeroUploading(false); e.target.value = ""; }
  };

  const handleCtaPdfUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return;
    setCtaPdfUploading(true);
    try {
      const path = `email-cta-pdfs/${Date.now()}-${file.name}`;
      const { error } = await supabase.storage.from("listing-files").upload(path, file, { upsert: true, contentType: file.type });
      if (error) throw error;
      const url = supabase.storage.from("listing-files").getPublicUrl(path).data.publicUrl;
      setDirectCtaUrl(url);
      setSelectedAssetId("none");
      toast.success("PDF uploaded & linked to CTA ✓");
    } catch (err: any) { toast.error("Upload failed: " + err.message); }
    finally { setCtaPdfUploading(false); e.target.value = ""; }
  };

  const handleFpUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []); if (!files.length) return;
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

  const handleImgCardUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []); if (!files.length) return;
    setImgCardUploading(true);
    try {
      const uploaded: ImageCardEntry[] = [];
      const remaining = 3 - imageCards.length;
      for (const file of files.slice(0, remaining)) {
        const url = await uploadImage(file, "email-assets", `email-imgcards/${Date.now()}-${file.name}`);
        uploaded.push({ id: crypto.randomUUID(), url, caption: "" });
      }
      setImageCards(prev => [...prev, ...uploaded].slice(0, 3));
      toast.success(`${uploaded.length} image${uploaded.length > 1 ? "s" : ""} added`);
    } catch (err: any) { toast.error("Upload failed: " + err.message); }
    finally { setImgCardUploading(false); e.target.value = ""; }
  };

  const removeImgCard = (id: string) => setImageCards(prev => prev.filter(c => c.id !== id));
  const updateImgCard = (id: string, caption: string) =>
    setImageCards(prev => prev.map(c => c.id === id ? { ...c, caption } : c));

  // ── Edit-in-preview iframe designMode ────────────────────────────────────────
  const enableIframeEdit = useCallback(() => {
    const doc = iframeRef.current?.contentDocument;
    if (!doc || !doc.body) return;
    doc.designMode = "on";
    // Inject subtle edit-mode styles
    const existing = doc.getElementById("__edit-style");
    if (existing) return;
    const style = doc.createElement("style");
    style.id = "__edit-style";
    style.textContent = `
      body { outline: none !important; cursor: text; }
      td:hover, p:hover, div:hover, a:hover, span:hover {
        outline: 1.5px dashed rgba(201,165,90,0.5) !important;
        outline-offset: 1px;
      }
    `;
    doc.head?.appendChild(style);
  }, []);

  // When user switches to edit mode, enable designMode immediately (iframe is already loaded)
  useEffect(() => {
    if (previewMode === "edit") {
      // Try immediately, then retry after short delay in case of timing
      enableIframeEdit();
      const t = setTimeout(enableIframeEdit, 150);
      return () => clearTimeout(t);
    }
  }, [previewMode, enableIframeEdit]);

  const getExportHtml = useCallback((): string => {
    if (previewMode === "edit" && iframeRef.current?.contentDocument) {
      return "<!DOCTYPE html>\n" + iframeRef.current.contentDocument.documentElement.outerHTML;
    }
    return finalHtml;
  }, [previewMode, finalHtml]);

  // ── Export ────────────────────────────────────────────────────────────────────
  const handleCopy = () => {
    navigator.clipboard.writeText(getExportHtml()).then(() => {
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

  // ─────────────────────────────────────────────────────────────────────────────
  return (
    <AdminLayout>
      <div className="p-4 md:p-6 max-w-[1400px] mx-auto space-y-3">

        {/* ── Top bar ── */}
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => navigate("/admin/marketing-hub")}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-emerald-600 to-emerald-800 flex items-center justify-center shadow-sm">
              <Mail className="h-4 w-4 text-white" />
            </div>
            <div>
              <h1 className="text-base font-bold leading-none">
                Email Builder
                {urlTemplate === "exclusive-offer" && <span className="ml-2 text-[11px] font-normal text-amber-600">· Exclusive Offer</span>}
                {urlTemplate === "project-email"   && <span className="ml-2 text-[11px] font-normal text-emerald-600">· Project Email</span>}
              </h1>
              <p className="text-[11px] text-muted-foreground mt-0.5">Paste copy → Bold keywords → Copy HTML</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Draft saved indicator */}
            {draftSavedAt && (
              <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                <CheckCircle2 className="h-3 w-3 text-emerald-500" />
                <span>Draft saved {draftSavedAt.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
                <button
                  onClick={() => { localStorage.removeItem(DRAFT_KEY); window.location.reload(); }}
                  className="ml-1 text-muted-foreground/50 hover:text-destructive transition-colors"
                  title="Clear draft & start fresh"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            )}
            {/* Version tabs */}
            {aiResult && (
              <div className="flex items-center bg-muted rounded-lg p-0.5 gap-0.5">
                <button onClick={() => handleVersionSwitch("A")} className={cn("px-2.5 py-1 text-[11px] font-semibold rounded transition-all", activeVersion === "A" ? "bg-emerald-600 text-white shadow-sm" : "text-muted-foreground hover:text-foreground")}>Ver A</button>
                {(aiResult.subjectLineB || aiResult.bodyCopyB) && (
                  <button onClick={() => handleVersionSwitch("B")} className={cn("px-2.5 py-1 text-[11px] font-semibold rounded transition-all", activeVersion === "B" ? "bg-amber-500 text-white shadow-sm" : "text-muted-foreground hover:text-foreground")}>Ver B</button>
                )}
              </div>
            )}
            <Button variant="outline" size="sm" className="h-9 gap-1.5" onClick={handleSave} disabled={saving}>
              {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />} Save to Hub
            </Button>
            <Button size="sm"
              className={cn("h-9 gap-1.5 font-semibold transition-all duration-200", copied ? "bg-emerald-600 hover:bg-emerald-600 text-white" : "bg-primary text-primary-foreground hover:bg-primary/90")}
              onClick={handleCopy}>
              {copied ? <><CheckCircle2 className="h-3.5 w-3.5" /> Copied!</> : <><Copy className="h-3.5 w-3.5" /> Copy HTML</>}
            </Button>
          </div>
        </div>

        {/* ── Inbox preview bar ── */}
        <div className="rounded-lg border border-border bg-card overflow-hidden">
          <div className="flex items-center gap-2 px-3 py-2 bg-muted/30 border-b border-border">
            <div className="flex items-center gap-1 shrink-0">
              <div className="h-2.5 w-2.5 rounded-full bg-red-400/80" />
              <div className="h-2.5 w-2.5 rounded-full bg-amber-400/80" />
              <div className="h-2.5 w-2.5 rounded-full bg-green-400/80" />
            </div>
            <Separator orientation="vertical" className="h-4 mx-1" />
            <div className="flex items-center gap-1 flex-1 min-w-0">
              <div className="flex items-center gap-1.5 shrink-0 bg-muted/50 rounded px-2 py-0.5">
                <div className="w-3 h-3 rounded-full bg-primary/40 shrink-0" />
                <span className="text-[10px] font-medium text-foreground">PresaleProperties</span>
              </div>
              <span className="text-muted-foreground/40 shrink-0 text-xs">›</span>
              <span className={cn("text-xs truncate flex-1 min-w-0", subjectLine ? "font-medium text-foreground" : "italic text-muted-foreground")}>
                {subjectLine || "Your subject line will appear here…"}
              </span>
              {previewText && (
                <span className="text-muted-foreground text-[11px] truncate hidden lg:block shrink-0 max-w-[240px]">— {previewText}</span>
              )}
            </div>
            <Badge variant="outline" className="shrink-0 text-[9px] py-0 h-4 px-1.5 text-muted-foreground/60">Gmail</Badge>
          </div>
        </div>

        {/* ── Main 2-panel layout ── */}
        <div className="grid grid-cols-[1fr_360px] gap-3 h-[calc(100vh-220px)] min-h-[600px]">

          {/* ── LEFT: Email preview ── */}
          <div className="flex flex-col rounded-xl border border-border bg-card overflow-hidden shadow-sm">
            {/* Preview toolbar */}
            <div className="flex items-center justify-between px-3 py-2 border-b border-border bg-muted/10 shrink-0">
              <div className="flex items-center gap-0.5 bg-muted/50 rounded-lg p-0.5">
                <Button variant="ghost" size="sm"
                  className={cn("h-6 px-2.5 text-[11px] gap-1.5 rounded-md transition-all font-medium", previewMode === "preview" && "bg-card shadow-sm text-foreground")}
                  onClick={() => setPreviewMode("preview")}>
                  <Eye className="h-3 w-3" /> Preview
                </Button>
                <Button variant="ghost" size="sm"
                  className={cn("h-6 px-2.5 text-[11px] gap-1.5 rounded-md transition-all font-medium", previewMode === "edit" && "bg-amber-500/90 shadow-sm text-white")}
                  onClick={() => setPreviewMode("edit")}
                  title="Click to edit text directly in the email">
                  <Bold className="h-3 w-3" /> Edit
                </Button>
                <Button variant="ghost" size="sm"
                  className={cn("h-6 px-2.5 text-[11px] gap-1.5 rounded-md transition-all font-medium", previewMode === "code" && "bg-card shadow-sm text-foreground")}
                  onClick={() => setPreviewMode("code")}>
                  <Code2 className="h-3 w-3" /> HTML
                </Button>
              </div>

              {(previewMode === "preview" || previewMode === "edit") && (
                <div className="flex items-center gap-0.5 bg-muted/50 rounded-lg p-0.5">
                  <Button variant="ghost" size="sm"
                    className={cn("h-6 w-7 p-0 rounded-md transition-all", previewDevice === "desktop" && "bg-card shadow-sm text-foreground")}
                    onClick={() => setPreviewDevice("desktop")}><Monitor className="h-3 w-3" /></Button>
                  <Button variant="ghost" size="sm"
                    className={cn("h-6 w-7 p-0 rounded-md transition-all", previewDevice === "mobile" && "bg-card shadow-sm text-foreground")}
                    onClick={() => setPreviewDevice("mobile")}><Smartphone className="h-3 w-3" /></Button>
                </div>
              )}

              <div className="flex items-center gap-2">
                <span className="text-[10px] text-muted-foreground/50 hidden lg:block">
                  {previewMode === "code" ? `${Math.round(finalHtml.length / 1024)}KB` : previewDevice === "desktop" ? "600px" : "375px"}
                </span>
                {previewMode === "code" && (
                  <Button variant="ghost" size="sm" className="h-6 px-2 text-[11px] gap-1" onClick={handleCopy}>
                    <Copy className="h-3 w-3" /> {copied ? "Copied!" : "Copy"}
                  </Button>
                )}
              </div>
            </div>

            {/* Edit mode hint bar */}
            {previewMode === "edit" && (
              <div className="flex items-center gap-2 px-3 py-1.5 bg-amber-500/10 border-b border-amber-500/20 shrink-0">
                <Bold className="h-3 w-3 text-amber-500 shrink-0" />
                <span className="text-[10px] text-amber-600 dark:text-amber-400">Click any text in the email to edit it directly. Changes are included when you copy the HTML.</span>
              </div>
            )}

            {previewMode === "preview" || previewMode === "edit" ? (
              <div className={cn("flex-1 overflow-auto", previewDevice === "mobile" ? "bg-[#e8e5e0] flex justify-center" : "bg-[#e8e5e0]")}>
                <iframe
                  ref={iframeRef}
                  srcDoc={previewHtml}
                  className="border-0 h-full"
                  style={previewDevice === "mobile" ? { width: "375px", minHeight: "100%" } : { width: "100%" }}
                  sandbox="allow-same-origin"
                  title="Email Preview"
                  onLoad={previewMode === "edit" ? enableIframeEdit : undefined}
                />
              </div>
            ) : (
              <div className="flex-1 overflow-auto" style={{ background: "#0d1117" }}>
                <div className="sticky top-0 px-4 py-2 flex items-center justify-between border-b border-white/5" style={{ background: "#161b22" }}>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono text-emerald-400">email.html</span>
                    <Badge className="text-[9px] h-4 px-1.5 bg-emerald-500/10 text-emerald-400 border-emerald-500/20">Mailchimp-ready</Badge>
                  </div>
                  <span className="text-[10px] text-white/30">{finalHtml.length.toLocaleString()} chars</span>
                </div>
                <pre className="p-4 text-[11px] font-mono whitespace-pre-wrap break-all leading-relaxed" style={{ color: "#e6edf3" }}>{finalHtml}</pre>
              </div>
            )}
          </div>

          {/* ── RIGHT: Editor panel ── */}
          <div className="flex flex-col rounded-xl border border-border bg-card overflow-hidden shadow-sm">
            {/* Panel header */}
            <div className="px-4 pt-3 pb-2.5 border-b border-border bg-gradient-to-r from-primary/5 to-transparent shrink-0">
              <div className="flex items-center gap-2">
                <div className="h-5 w-5 rounded bg-primary/10 flex items-center justify-center">
                  <Sparkles className="h-3 w-3 text-primary" />
                </div>
                <span className="text-sm font-semibold text-foreground">Build Your Email</span>
                {projectName && (
                  <Badge variant="outline" className="text-[9px] h-4 px-1.5 border-primary/20 text-primary/70 font-normal">{projectName}</Badge>
                )}
              </div>
            </div>

            <div className="flex-1 overflow-y-auto">

              {/* ── PROJECT SELECTOR (top-level, always visible) ── */}
              <div className="px-3 py-2.5 border-b border-border bg-muted/20">
                <Label className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold block mb-1.5">
                  Select Project <span className="normal-case tracking-normal font-normal text-muted-foreground/50">— auto-fills all fields</span>
                </Label>
                <Select value={selProjectId} onValueChange={handleProjectSelect}>
                  <SelectTrigger className="h-8 text-xs w-full">
                    <SelectValue placeholder="Choose a project to auto-fill details…" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">— Start from scratch —</SelectItem>
                    {projects.map(p => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.name}{p.city ? ` · ${p.city}` : ""}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* ── STEP 1: PASTE YOUR COPY ── */}
              <StepSection
                step={1} title="Paste Your Copy" icon={<FileText className="h-3.5 w-3.5" />}
                done={!!bodyCopy} doneLabel={bodyCopy ? "Copy ready" : undefined}
                defaultOpen={true}
              >
                <div>
                  <Label className="text-[10px] text-muted-foreground">Headline</Label>
                  <Input value={headline} onChange={e => setHeadline(e.target.value)} className="h-8 text-xs mt-0.5" placeholder="Introducing Lumina — From $649K in Surrey" />
                </div>
                <div>
                  <div className="flex items-center justify-between mb-0.5">
                    <Label className="text-[10px] text-muted-foreground">Body Copy <span className="text-muted-foreground/40">— paste your email copy here</span></Label>
                    {bodyCopy && (
                      <span className="text-[9px] text-muted-foreground/50">{bodyCopy.split(/\s+/).filter(Boolean).length} words</span>
                    )}
                  </div>
                  <Textarea
                    value={bodyCopy}
                    onChange={e => setBodyCopy(e.target.value)}
                    className="text-xs mt-0.5 min-h-[130px] resize-none leading-relaxed"
                    placeholder={"Hi [First Name],\n\nPaste your full email copy here. The AI will only bold key phrases — it won't change a single word.\n\nUzair Muhammad"}
                  />
                </div>
                <Button
                  className="w-full h-8 gap-1.5 text-xs font-semibold"
                  style={{ background: boldLoading ? undefined : "linear-gradient(135deg,#b8860b,#c9a55a)", color: "white" }}
                  onClick={handleBoldKeywords}
                  disabled={boldLoading || (!bodyCopy.trim() && !headline.trim())}
                >
                  {boldLoading
                    ? <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Formatting copy…</>
                    : <><Wand2 className="h-3.5 w-3.5" /> Format & Polish Copy</>
                  }
                </Button>
                <p className="text-[10px] text-muted-foreground/50 text-center -mt-1">AI fixes spacing, structure & bolds key phrases — words stay untouched</p>

                {/* ── AI Brief (optional / collapsed) ── */}
                <details className="mt-1 group">
                  <summary className="cursor-pointer text-[10px] text-muted-foreground/60 hover:text-muted-foreground flex items-center gap-1.5 list-none select-none py-1">
                    <span className="h-3.5 w-3.5 rounded-full border border-muted-foreground/30 flex items-center justify-center text-[8px] font-bold shrink-0">+</span>
                    Or generate copy with AI instead
                  </summary>
                  <div className="mt-2 space-y-2 border-t border-border pt-2">
                    <Textarea
                      value={prompt}
                      onChange={e => setPrompt(e.target.value)}
                      placeholder="Describe this email: project, city, price, completion date, incentives, tone…"
                      className="min-h-[60px] text-xs resize-none"
                      disabled={aiLoading}
                    />
                    <div className="grid grid-cols-2 gap-1.5">
                      <div>
                        <Label className="text-[10px] text-muted-foreground">Style</Label>
                        <Select value={templateType} onValueChange={setTemplateType} disabled={aiLoading}>
                          <SelectTrigger className="h-7 text-[11px] mt-0.5"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="main-project-email">Main Project</SelectItem>
                            <SelectItem value="exclusive-offer">Exclusive Offer</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label className="text-[10px] text-muted-foreground">Project</Label>
                        <Select value={selProjectId} onValueChange={handleProjectSelect} disabled={aiLoading}>
                          <SelectTrigger className="h-7 text-[11px] mt-0.5"><SelectValue placeholder="Select…" /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">None</SelectItem>
                            {projects.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    {aiResult && (
                      <div className="flex gap-1.5">
                        <button onClick={() => handleVersionSwitch("A")} className={cn("flex-1 py-1.5 text-[11px] font-semibold rounded-lg border transition-all", activeVersion === "A" ? "bg-emerald-600 text-white border-emerald-600" : "border-border text-muted-foreground hover:border-primary/30")}>Version A</button>
                        {(aiResult.subjectLineB || aiResult.bodyCopyB) && (
                          <button onClick={() => handleVersionSwitch("B")} className={cn("flex-1 py-1.5 text-[11px] font-semibold rounded-lg border transition-all", activeVersion === "B" ? "bg-amber-500 text-white border-amber-500" : "border-border text-muted-foreground hover:border-amber-300")}>Version B</button>
                        )}
                      </div>
                    )}
                    <Button className="w-full h-8 gap-1.5 text-xs font-semibold"
                      style={{ background: aiLoading ? undefined : "linear-gradient(135deg,#7c3aed,#5b21b6)", color: "white" }}
                      onClick={handleGenerate} disabled={aiLoading || !prompt.trim()}>
                      {aiLoading ? <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Writing…</> : <><Wand2 className="h-3.5 w-3.5" />{aiResult ? "Regenerate" : "Generate Email"}</>}
                    </Button>
                  </div>
                </details>
              </StepSection>

              {/* ── STEP 2: TYPOGRAPHY ── */}
              <StepSection
                step={2} title="Typography" icon={<Type className="h-3.5 w-3.5" />}
                done={true} doneLabel={selectedFont.label}
                defaultOpen={false}
              >
                <div className="grid grid-cols-2 gap-1.5">
                  {EMAIL_FONT_PAIRINGS.map(fp => (
                    <button
                      key={fp.id}
                      onClick={() => setSelectedFontId(fp.id)}
                      className={cn(
                        "text-left px-2.5 py-2 rounded-lg border transition-all",
                        selectedFontId === fp.id
                          ? "border-amber-500 bg-amber-500/8 shadow-sm"
                          : "border-border bg-muted/10 hover:border-primary/40"
                      )}
                    >
                      <div className="text-[11px] font-semibold truncate text-foreground">{fp.label}</div>
                      <div className="text-[9px] text-muted-foreground mt-0.5">{fp.tag}</div>
                    </button>
                  ))}
                </div>
              </StepSection>

              {/* ── STEP 3: AGENT ── */}
              <StepSection
                step={3} title="Agent Signature" icon={<Mail className="h-3.5 w-3.5" />}
                done={!!selAgent && selAgent !== "default"}
                doneLabel={selectedAgent.full_name}
                defaultOpen={false}
              >
                <div className="flex gap-1.5 flex-wrap">
                  {agents.map(a => (
                    <button key={a.full_name} onClick={() => setSelAgent(a.full_name)}
                      className={cn(
                        "flex items-center gap-2 px-2 py-1.5 rounded-lg border text-left transition-all flex-1 min-w-[110px]",
                        selAgent === a.full_name ? "border-primary bg-primary/8 shadow-sm" : "border-border bg-muted/20 hover:border-primary/40"
                      )}>
                      {a.photo_url
                        ? <img src={a.photo_url} alt={a.full_name} className="w-8 h-8 rounded-full object-cover object-top border border-border shrink-0" />
                        : <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-[10px] font-bold text-primary shrink-0">{a.full_name.charAt(0)}</div>
                      }
                      <div className="min-w-0 flex-1">
                        <div className="text-[11px] font-semibold truncate">{a.full_name}</div>
                        <div className="text-[9px] text-muted-foreground">{a.title.split(" ").slice(0, 2).join(" ")}</div>
                      </div>
                      {selAgent === a.full_name && <CheckCircle2 className="h-3.5 w-3.5 text-primary shrink-0" />}
                    </button>
                  ))}
                </div>
              </StepSection>

              {/* ── STEP 3: PROJECT DETAILS ── */}
              <StepSection
                step={3} title="Project Details" icon={<Building2 className="h-3.5 w-3.5" />}
                done={!!projectName} doneLabel={projectName}
                defaultOpen={false}
              >
                <div className="grid grid-cols-2 gap-1.5">
                  <div className="col-span-2">
                    <div className="flex items-center justify-between mb-0.5">
                      <Label className="text-[10px] text-muted-foreground">Project Name</Label>
                      <div className="flex items-center gap-1.5">
                        <span className="text-[9px] text-muted-foreground">{showProjectName ? "Visible" : "Hidden"}</span>
                        <Switch checked={showProjectName} onCheckedChange={setShowProjectName} className="scale-75 origin-right" />
                      </div>
                    </div>
                    <Input value={projectName} onChange={e => setProjectName(e.target.value)} className={cn("h-7 text-xs", !showProjectName && "opacity-40")} placeholder="Lumina" />
                  </div>
                  {!showProjectName && (
                    <div className="col-span-2">
                      <Label className="text-[10px] text-muted-foreground">Custom Header</Label>
                      <Input value={customHeader} onChange={e => setCustomHeader(e.target.value)} className="h-7 text-xs mt-0.5" placeholder="New Presale Release" />
                    </div>
                  )}
                  <div className="col-span-2">
                    <div className="flex items-center justify-between mb-0.5">
                      <Label className="text-[10px] text-muted-foreground">Developer</Label>
                      <div className="flex items-center gap-1.5">
                        <span className="text-[9px] text-muted-foreground">{showDeveloperName ? "Visible" : "Hidden"}</span>
                        <Switch checked={showDeveloperName} onCheckedChange={setShowDeveloperName} className="scale-75 origin-right" />
                      </div>
                    </div>
                    <Input value={developerName} onChange={e => setDevName(e.target.value)} className={cn("h-7 text-xs", !showDeveloperName && "opacity-40")} placeholder="Bosa Properties" />
                  </div>
                  <div>
                    <Label className="text-[10px] text-muted-foreground">City</Label>
                    <Input value={city} onChange={e => setCity(e.target.value)} className="h-7 text-xs mt-0.5" placeholder="Surrey" />
                  </div>
                  <div>
                    <Label className="text-[10px] text-muted-foreground">Neighbourhood</Label>
                    <Input value={neighborhood} onChange={e => setNeighborhood(e.target.value)} className="h-7 text-xs mt-0.5" placeholder="Fleetwood" />
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-1.5 mt-1">
                  {([
                    { val: startingPrice, set: setStartingPrice, label: "From Price", hint: "+ GST",     ph: "$649K"       },
                    { val: deposit,       set: setDeposit,       label: "Deposit",    hint: "to secure",  ph: "5% signing"  },
                    { val: completion,    set: setCompletion,    label: "Completion", hint: "est. date",  ph: "2027"        },
                  ]).map(({ val, set, label, hint, ph }) => (
                    <div key={label} className={cn("rounded-lg border p-2 transition-all", val ? "border-primary/40 bg-primary/5" : "border-border bg-muted/10")}>
                      <Label className="text-[9px] text-muted-foreground uppercase tracking-wide block mb-1">{label}</Label>
                      <Input value={val} onChange={e => set(e.target.value)} className="h-6 text-xs border-0 bg-transparent p-0 focus-visible:ring-0 font-semibold" placeholder={ph} />
                      <p className="text-[9px] text-muted-foreground/40 mt-0.5">{hint}</p>
                    </div>
                  ))}
                </div>
              </StepSection>

              {/* ── DEPOSIT & OTHER INFO ── */}
              <StepSection
                step={3} title="Deposit & Other Info" icon={<FileText className="h-3.5 w-3.5" />}
                done={infoRows.some(r => r.includes("|"))}
                doneLabel={infoRows.filter(r => r.includes("|")).length > 0 ? `${infoRows.filter(r => r.includes("|")).length} row${infoRows.filter(r => r.includes("|")).length > 1 ? "s" : ""}` : undefined}
                defaultOpen={false}
              >
                <p className="text-[10px] text-muted-foreground/60 leading-relaxed -mt-1">
                  Add rows like <span className="font-semibold text-muted-foreground">Deposit Structure | 5% on signing, 5% in 180 days</span>. Each row renders as a label/value table below the stats bar.
                </p>
                {infoRows.map((row, idx) => (
                  <div key={idx} className="flex items-center gap-1.5">
                    <Input
                      value={row}
                      onChange={e => setInfoRows(prev => prev.map((r, i) => i === idx ? e.target.value : r))}
                      className="h-7 text-xs flex-1"
                      placeholder="Deposit Structure | 5% on signing"
                    />
                    <Button
                      variant="ghost" size="icon" className="h-7 w-7 shrink-0 text-muted-foreground hover:text-destructive"
                      onClick={() => setInfoRows(prev => prev.filter((_, i) => i !== idx))}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
                <Button
                  variant="outline" size="sm" className="w-full h-7 text-xs gap-1.5 border-dashed"
                  onClick={() => setInfoRows(prev => [...prev, ""])}
                >
                  + Add Row
                </Button>
                {infoRows.length === 0 && (
                  <div className="grid grid-cols-1 gap-1">
                    {[
                      "Deposit Structure | 5% on signing, 5% in 180 days",
                      "Strata Fees | Est. $0.45/sq ft",
                      "Assignment | Allowed with consent",
                    ].map(suggestion => (
                      <button key={suggestion} onClick={() => setInfoRows(prev => [...prev, suggestion])}
                        className="text-left text-[10px] text-muted-foreground/50 hover:text-primary px-2 py-1 rounded hover:bg-muted/30 transition-colors truncate">
                        + {suggestion}
                      </button>
                    ))}
                  </div>
                )}
              </StepSection>

              {/* ── STEP 4: INBOX COPY ── */}
              <StepSection
                step={4} title="Inbox Copy" icon={<Mail className="h-3.5 w-3.5" />}
                done={!!subjectLine} doneLabel={subjectLine ? `"${subjectLine.slice(0, 28)}…"` : undefined}
                defaultOpen={false}
              >
                <div>
                  <Label className="text-[10px] text-muted-foreground">Subject Line <span className="text-muted-foreground/50 font-normal">· shown in inbox</span></Label>
                  <Input value={subjectLine} onChange={e => setSubjectLine(e.target.value)} className="h-8 text-xs mt-0.5" placeholder="🏙️ Exclusive Access: Lumina" />
                </div>
                <div>
                  <Label className="text-[10px] text-muted-foreground">Preview Text <span className="text-muted-foreground/50 font-normal">· shown after subject</span></Label>
                  <Input value={previewText} onChange={e => setPreviewText(e.target.value)} className="h-8 text-xs mt-0.5" placeholder="From $649K · limited units" />
                </div>
                <div>
                  <Label className="text-[10px] text-muted-foreground">Incentives <span className="text-muted-foreground/40">— one per line, gold bullets</span></Label>
                  <Textarea value={incentiveText} onChange={e => setIncentiveText(e.target.value)} className="text-xs mt-0.5 min-h-[60px] resize-none leading-relaxed" placeholder={"✦ Extended deposit: 5% now, 5% in 180 days\n✦ Free parking · $35,000 value"} />
                </div>
              </StepSection>

              {/* ── STEP 5: IMAGES ── */}
              <StepSection
                step={5} title="Images" icon={<Image className="h-3.5 w-3.5" />}
                done={!!(heroImage || floorPlans.length)} doneLabel={[heroImage && "Hero", floorPlans.length && `${floorPlans.length} FP`].filter(Boolean).join(" · ")}
                defaultOpen={false}
              >
                <input ref={heroInputRef} type="file" accept="image/*" className="hidden" onChange={handleHeroUpload} />
                <input ref={fpInputRef}   type="file" accept="image/*" multiple className="hidden" onChange={handleFpUpload} />

                {/* Hero */}
                <div>
                  <Label className="text-[10px] text-muted-foreground">Hero Image URL</Label>
                  <div className="flex gap-1.5 mt-0.5">
                    <Input value={heroImage} onChange={e => setHeroImage(e.target.value)} className="h-7 text-xs flex-1" placeholder="https://… or upload" />
                    <Button variant="outline" size="icon" className="h-7 w-7 shrink-0" onClick={() => heroInputRef.current?.click()} disabled={heroUploading}>
                      {heroUploading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Upload className="h-3 w-3" />}
                    </Button>
                  </div>
                </div>
                {heroImage && (
                  <div className="relative rounded overflow-hidden border border-border">
                    <img src={heroImage} alt="Hero" className="w-full h-20 object-cover" onError={() => setHeroImage("")} />
                    <button onClick={() => setHeroImage("")} className="absolute top-1 right-1 h-5 w-5 bg-destructive/90 rounded-full flex items-center justify-center">
                      <X className="h-3 w-3 text-white" />
                    </button>
                  </div>
                )}
                {projects.filter(p => p.featured_image).length > 0 && (
                  <div>
                    <p className="text-[10px] text-muted-foreground mb-1">Pick from projects:</p>
                    <div className="grid grid-cols-3 gap-1">
                      {projects.filter(p => p.featured_image).slice(0, 6).map(p => (
                        <button key={p.id} onClick={() => setHeroImage(p.featured_image!)}
                          className={cn("relative rounded overflow-hidden border-2 aspect-video transition-all", heroImage === p.featured_image ? "border-primary" : "border-transparent hover:border-muted-foreground/40")}>
                          <img src={p.featured_image!} alt={p.name} className="w-full h-full object-cover" />
                          {heroImage === p.featured_image && <div className="absolute inset-0 bg-primary/20 flex items-center justify-center"><CheckCircle2 className="h-3.5 w-3.5 text-white" /></div>}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Floor plans */}
                <div className="pt-1">
                  <Label className="text-[10px] text-muted-foreground">Floor Plans <span className="text-muted-foreground/50">(up to 2)</span></Label>
                  {floorPlans.length < 2 && (
                    <button onClick={() => fpInputRef.current?.click()} disabled={fpUploading}
                      className="w-full mt-1 flex items-center justify-center gap-1.5 h-14 rounded-lg border-2 border-dashed border-border hover:border-primary/50 hover:bg-muted/30 transition-all text-muted-foreground text-xs font-medium">
                      {fpUploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                      {fpUploading ? "Uploading…" : `Upload floor plan${floorPlans.length === 1 ? " (1 more)" : "s"}`}
                    </button>
                  )}
                  {floorPlans.map(fp => (
                    <div key={fp.id} className="mt-1.5 border border-border rounded-lg overflow-hidden bg-muted/20">
                      <div className="relative">
                        <img src={fp.url} alt="Floor plan" className="w-full h-24 object-contain bg-white" />
                        <button onClick={() => removeFp(fp.id)} className="absolute top-1 right-1 h-5 w-5 bg-destructive/90 rounded-full flex items-center justify-center">
                          <X className="h-3 w-3 text-white" />
                        </button>
                      </div>
                      <div className="p-2 grid grid-cols-2 gap-1.5">
                        <div>
                          <Label className="text-[9px]">Label</Label>
                          <Input value={fp.label} onChange={e => updateFp(fp.id, "label", e.target.value)} className="h-6 text-[11px] mt-0.5" placeholder="1 Bed + Den" />
                        </div>
                        <div>
                          <Label className="text-[9px]">Size</Label>
                          <Input value={fp.sqft} onChange={e => updateFp(fp.id, "sqft", e.target.value)} className="h-6 text-[11px] mt-0.5" placeholder="678 sq ft" />
                        </div>
                      </div>
                    </div>
                  ))}
                  {floorPlans.length > 0 && (
                    <div className="mt-2 space-y-1.5">
                      <div>
                        <Label className="text-[10px] text-muted-foreground">Section Heading</Label>
                        <Input value={fpHeading} onChange={e => setFpHeading(e.target.value)} className="h-7 text-xs mt-0.5" />
                      </div>
                      <div>
                        <Label className="text-[10px] text-muted-foreground">Sub-heading</Label>
                        <Input value={fpSubheading} onChange={e => setFpSubheading(e.target.value)} className="h-7 text-xs mt-0.5" />
                      </div>
                    </div>
                  )}
                </div>
              </StepSection>

              {/* ── STEP 6: CAMPAIGN ASSETS ── */}
              <StepSection
                step={6} title="Plans & Pricing CTA" icon={<FileText className="h-3.5 w-3.5" />}
                done={!!(ctaUrl)} doneLabel={directCtaUrl ? "PDF uploaded" : selectedAsset?.name}
                defaultOpen={false}
              >
                <input ref={ctaPdfInputRef} type="file" accept="application/pdf" className="hidden" onChange={handleCtaPdfUpload} />

                {/* Direct PDF upload */}
                <div>
                  <Label className="text-[10px] text-muted-foreground mb-1 block">Upload PDF <span className="text-muted-foreground/50 font-normal">· pricing sheet or brochure</span></Label>
                  {directCtaUrl ? (
                    <div className="flex items-center gap-2 rounded-lg border border-emerald-500/30 bg-emerald-500/5 px-3 py-2">
                      <FileText className="h-4 w-4 text-emerald-600 shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-[11px] font-semibold text-emerald-700 truncate">PDF linked to CTA ✓</p>
                        <p className="text-[9px] text-muted-foreground truncate">{directCtaUrl.split("/").pop()}</p>
                      </div>
                      <Button variant="ghost" size="icon" className="h-6 w-6 shrink-0 text-muted-foreground hover:text-destructive"
                        onClick={() => setDirectCtaUrl("")}>
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  ) : (
                    <button
                      onClick={() => { setSelectedAssetId("none"); ctaPdfInputRef.current?.click(); }}
                      disabled={ctaPdfUploading}
                      className="w-full flex items-center justify-center gap-2 h-12 rounded-lg border-2 border-dashed border-border hover:border-primary/50 hover:bg-muted/30 transition-all text-muted-foreground text-xs font-medium"
                    >
                      {ctaPdfUploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                      {ctaPdfUploading ? "Uploading…" : "Upload pricing sheet / brochure PDF"}
                    </button>
                  )}
                </div>

                {/* Or pick from campaign */}
                {!directCtaUrl && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-px bg-border" />
                      <span className="text-[9px] text-muted-foreground uppercase tracking-wider">or link campaign asset</span>
                      <div className="flex-1 h-px bg-border" />
                    </div>
                    {campaignAssets.length === 0 ? (
                      <p className="text-[10px] text-muted-foreground leading-relaxed">
                        No assets found. Save a campaign in the <strong>Campaign Builder</strong> with a brochure or pricing sheet.
                      </p>
                    ) : (
                      <>
                        <Select value={selectedAssetId} onValueChange={id => { setSelectedAssetId(id); setDirectCtaUrl(""); }}>
                          <SelectTrigger className="h-7 text-[11px]"><SelectValue placeholder="Select campaign…" /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">None</SelectItem>
                            {campaignAssets.map(a => (
                              <SelectItem key={a.id} value={a.id}>{a.name} — {a.project_name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {selectedAsset && (
                          <div className="rounded-lg border border-border bg-muted/30 p-2.5 space-y-1.5">
                            {selectedAsset.thumbnail_url && <img src={selectedAsset.thumbnail_url} alt={selectedAsset.name} className="w-full h-16 object-cover rounded" />}
                            <p className="text-[11px] font-semibold truncate">{selectedAsset.name}</p>
                            {selectedAsset.brochure_url && <div className="flex items-center gap-1.5 text-[10px] text-emerald-600"><div className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> Brochure linked</div>}
                            {selectedAsset.pricing_sheet_url && <div className="flex items-center gap-1.5 text-[10px] text-amber-600"><div className="h-1.5 w-1.5 rounded-full bg-amber-500" /> Pricing sheet linked</div>}
                          </div>
                        )}
                      </>
                    )}
                  </div>
                )}
              </StepSection>

              <div className="h-4" />
            </div>

            {/* Bottom action bar */}
            <div className="px-3 pb-3 pt-2.5 border-t border-border shrink-0 bg-muted/5">
              <Button
                className={cn("w-full h-9 gap-2 font-semibold text-sm transition-all duration-200",
                  copied ? "bg-emerald-600 hover:bg-emerald-600 text-white" : "bg-primary text-primary-foreground hover:bg-primary/90"
                )}
                onClick={handleCopy}
              >
                {copied ? <><CheckCircle2 className="h-3.5 w-3.5" /> Copied! Paste into Mailchimp</> : <><Copy className="h-3.5 w-3.5" /> Copy HTML</>}
              </Button>
              <p className="text-[9px] text-muted-foreground/40 text-center mt-1.5 uppercase tracking-wide">Inline CSS · Mailchimp-ready</p>
            </div>
          </div>

        </div>
      </div>
    </AdminLayout>
  );
}
