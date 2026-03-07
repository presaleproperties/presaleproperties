import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ArrowLeft, Sparkles, Loader2, Copy, Download, CheckCircle2,
  Building2, Image, Mail, FileText, Wand2, ChevronDown, ChevronUp,
  Eye, Code2, Save,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { buildAiEmailHtml, type AiEmailCopy, type AgentInfo, DEFAULT_AGENT } from "@/components/admin/AiEmailTemplate";

// ── Helpers ──────────────────────────────────────────────────────────────────

const AGENT_CONTACTS: Record<string, { phone: string; email: string }> = {
  "Uzair":  { phone: "778-231-3592",      email: "info@presaleproperties.com" },
  "Sarb":   { phone: "+1 (778) 846-7065", email: "sarb@presaleproperties.com"  },
  "Ravish": { phone: "+1 (604) 349-9399", email: "ravish@presaleproperties.com" },
};

const EXAMPLE_PROMPTS = [
  "New presale in Burnaby — 1 and 2 beds from $649K, completion 2027, PTT exempt",
  "Exclusive VIP offer for Lumina Surrey — extended deposit, free parking, limited units",
  "Follow-up for clients who attended the open house — remind them about floor plans",
  "Luxury waterfront project in North Van by Bosa Properties, from $1.2M",
];

interface Section {
  id: string;
  label: string;
  icon: React.ElementType;
}

const SECTIONS: Section[] = [
  { id: "ai",        label: "1 · AI Generator",    icon: Sparkles   },
  { id: "project",   label: "2 · Project Details",  icon: Building2  },
  { id: "hero",      label: "3 · Hero Image",        icon: Image      },
  { id: "copy",      label: "4 · Email Copy",        icon: FileText   },
  { id: "incentives",label: "5 · Incentives",        icon: Mail       },
];

// ── Build the branded email HTML ─────────────────────────────────────────────
function buildHtml(fields: AiEmailCopy & { heroImage?: string }, agent: AgentInfo): string {
  const base = buildAiEmailHtml(fields, agent);
  if (!fields.heroImage) return base;
  return base.replace(
    "<!-- ─── HERO STATS BAR",
    `  <!-- ─── HERO IMAGE ─── -->
  <tr>
    <td style="padding:0;line-height:0;">
      <img src="${fields.heroImage}" alt="${fields.projectName || "Project"}" width="600" style="display:block;width:100%;max-width:600px;height:auto;" />
    </td>
  </tr>

  <!-- ─── HERO STATS BAR`,
  );
}

// ── Accordion section wrapper ─────────────────────────────────────────────────
function SidebarSection({
  section, open, onToggle, children,
}: {
  section: Section;
  open: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) {
  const Icon = section.icon;
  return (
    <div className="border-b border-border last:border-b-0">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-muted/40 transition-colors text-left"
      >
        <div className="flex items-center gap-2.5">
          <Icon className="h-4 w-4 text-primary flex-shrink-0" />
          <span className="text-xs font-semibold">{section.label}</span>
        </div>
        {open ? <ChevronUp className="h-3.5 w-3.5 text-muted-foreground" /> : <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />}
      </button>
      {open && <div className="px-4 pb-4 space-y-3">{children}</div>}
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function AdminAiEmailBuilder() {
  const navigate = useNavigate();

  // Sidebar accordion
  const [openSections, setOpenSections] = useState<Set<string>>(new Set(["ai"]));
  const toggleSection = (id: string) =>
    setOpenSections(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

  // AI generation
  const [prompt, setPrompt]                   = useState("");
  const [templateType, setTemplateType]       = useState("main-project-email");
  const [selectedProjectId, setSelectedProjectId] = useState("none");
  const [aiLoading, setAiLoading]             = useState(false);
  const [activeVersion, setActiveVersion]     = useState<"A" | "B">("A");
  const [aiResult, setAiResult]               = useState<Record<string, string> | null>(null);

  // Editable fields
  const [projectName, setProjectName]         = useState("");
  const [developerName, setDeveloperName]     = useState("");
  const [city, setCity]                       = useState("");
  const [neighborhood, setNeighborhood]       = useState("");
  const [startingPrice, setStartingPrice]     = useState("");
  const [deposit, setDeposit]                 = useState("");
  const [completion, setCompletion]           = useState("");
  const [subjectLine, setSubjectLine]         = useState("");
  const [previewText, setPreviewText]         = useState("");
  const [headline, setHeadline]               = useState("");
  const [bodyCopy, setBodyCopy]               = useState("");
  const [incentiveText, setIncentiveText]     = useState("");
  const [heroImage, setHeroImage]             = useState("");

  // Preview tabs
  const [previewTab, setPreviewTab]           = useState<"preview" | "code">("preview");
  const [copied, setCopied]                   = useState(false);
  const [saving, setSaving]                   = useState(false);

  // Agent
  const [agents, setAgents] = useState<AgentInfo[]>([]);
  const [selectedAgentId, setSelectedAgentId] = useState<string>("default");
  const selectedAgent: AgentInfo = agents.find(a => a.full_name === selectedAgentId) ?? DEFAULT_AGENT;

  // Projects list
  const [projects, setProjects] = useState<Array<{ id: string; name: string; city: string; featured_image?: string | null }>>([]);

  useEffect(() => {
    supabase
      .from("presale_projects")
      .select("id, name, city, featured_image")
      .eq("is_published", true)
      .order("name")
      .limit(50)
      .then(({ data }: { data: any }) => { if (data) setProjects(data); });

    supabase
      .from("team_members_public" as any)
      .select("id, full_name, title, photo_url")
      .eq("is_active", true)
      .order("sort_order")
      .then(({ data }: { data: any }) => {
        if (data) {
          const enriched: AgentInfo[] = data.map((m: any) => {
            const firstName = (m.full_name ?? "").split(" ")[0];
            const contact = AGENT_CONTACTS[firstName] ?? { phone: "", email: "" };
            return { full_name: m.full_name ?? "", title: m.title ?? "Presale Specialist", photo_url: m.photo_url ?? null, ...contact };
          });
          setAgents(enriched);
          if (enriched.length > 0) setSelectedAgentId(enriched[0].full_name);
        }
      });
  }, []);

  // Build the current copy object
  const currentCopy = useCallback((): AiEmailCopy & { heroImage?: string } => ({
    subjectLine,
    previewText,
    headline,
    bodyCopy,
    incentiveText,
    projectName,
    city,
    neighborhood,
    developerName,
    startingPrice,
    deposit,
    completion,
    heroImage: heroImage || undefined,
  }), [subjectLine, previewText, headline, bodyCopy, incentiveText, projectName, city, neighborhood, developerName, startingPrice, deposit, completion, heroImage]);

  const previewHtml = buildHtml(currentCopy(), selectedAgent);

  // When AI generates copy, populate fields
  const applyAiResult = (result: Record<string, string>, version: "A" | "B") => {
    const isB = version === "B";
    setSubjectLine(isB ? (result.subjectLineB || result.subjectLine || "") : (result.subjectLine || ""));
    setPreviewText(isB ? (result.previewTextB || result.previewText || "") : (result.previewText || ""));
    setHeadline(isB ? (result.headlineB || result.headline || "") : (result.headline || ""));
    setBodyCopy(isB ? (result.bodyCopyB || result.bodyCopy || "") : (result.bodyCopy || ""));
    setIncentiveText(result.incentiveText || "");
    if (result.projectName) setProjectName(result.projectName);
    if (result.city)         setCity(result.city);
    if (result.neighborhood) setNeighborhood(result.neighborhood);
    if (result.developerName) setDeveloperName(result.developerName);
    if (result.startingPrice) setStartingPrice(result.startingPrice);
    if (result.deposit)       setDeposit(result.deposit);
    if (result.completion)    setCompletion(result.completion);
  };

  const handleGenerate = async () => {
    if (!prompt.trim()) { toast.error("Please enter a prompt first"); return; }
    setAiLoading(true);
    try {
      const project = projects.find(p => p.id === selectedProjectId && selectedProjectId !== "none");
      const { data, error } = await supabase.functions.invoke("generate-email-copy", {
        body: {
          prompt: prompt.trim(),
          projectDetails: project ? { name: project.name, city: project.city } : null,
          templateType,
        },
      });
      if (error) throw new Error(error.message);
      if (data?.error) throw new Error(data.error);
      setAiResult(data.copy);
      setActiveVersion("A");
      applyAiResult(data.copy, "A");
      // Auto-open edit sections after generation
      setOpenSections(new Set(["ai", "project", "copy", "incentives"]));
      // If project has a hero image, auto-populate it
      if (project?.featured_image && !heroImage) setHeroImage(project.featured_image);
    } catch (e: any) {
      toast.error(e.message || "Failed to generate copy");
    } finally {
      setAiLoading(false);
    }
  };

  const handleVersionSwitch = (v: "A" | "B") => {
    if (!aiResult) return;
    setActiveVersion(v);
    applyAiResult(aiResult, v);
  };

  // Populate from project selection
  const handleProjectSelect = (id: string) => {
    setSelectedProjectId(id);
    const p = projects.find(proj => proj.id === id);
    if (!p) return;
    setProjectName(p.name);
    setCity(p.city);
    if (p.featured_image) setHeroImage(p.featured_image);
  };

  const handleCopyHtml = () => {
    navigator.clipboard.writeText(previewHtml).then(() => {
      setCopied(true);
      toast.success("HTML copied to clipboard");
      setTimeout(() => setCopied(false), 2500);
    });
  };

  const handleSave = async () => {
    if (!projectName && !headline) { toast.error("Add at least a project name or headline first"); return; }
    setSaving(true);
    const name = `AI Email — ${projectName || headline?.slice(0, 30) || "Untitled"} (${new Date().toLocaleDateString()})`;
    const { error } = await supabase.from("campaign_templates" as any).insert({
      name,
      project_name: projectName || "Untitled",
      form_data: {
        _type: "ai-email",
        copy: currentCopy(),
        aiResult,
        activeVersion,
        html: previewHtml,
      },
    });
    if (error) toast.error("Failed to save");
    else toast.success("Template saved!");
    setSaving(false);
  };

  return (
    <AdminLayout>
      <div className="flex flex-col h-full bg-background">

        {/* ── Top bar ── */}
        <div className="flex-shrink-0 border-b border-border bg-card px-4 py-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => navigate("/admin/email-builder-hub")}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-violet-500 to-violet-700 flex items-center justify-center shadow-sm">
              <Sparkles className="h-4 w-4 text-white" />
            </div>
            <div>
              <h1 className="text-sm font-bold">AI Email Builder</h1>
              <p className="text-[10px] text-muted-foreground">Generate → Edit → Copy HTML</p>
            </div>
          </div>

          {/* Version tabs (only show when AI has run) */}
          {aiResult && (
            <div className="flex items-center bg-muted rounded-lg p-0.5 gap-0.5">
              <button
                onClick={() => handleVersionSwitch("A")}
                className={cn("px-3 py-1 text-xs font-semibold rounded transition-all", activeVersion === "A" ? "bg-emerald-600 text-white shadow-sm" : "text-muted-foreground hover:text-foreground")}
              >
                Version A
              </button>
              {(aiResult.subjectLineB || aiResult.bodyCopyB) && (
                <button
                  onClick={() => handleVersionSwitch("B")}
                  className={cn("px-3 py-1 text-xs font-semibold rounded transition-all", activeVersion === "B" ? "bg-amber-500 text-white shadow-sm" : "text-muted-foreground hover:text-foreground")}
                >
                  Version B
                </button>
              )}
            </div>
          )}

          <div className="flex items-center gap-2 ml-auto">
            <Button variant="outline" size="sm" className="h-8 text-xs gap-1.5" onClick={handleSave} disabled={saving}>
              {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
              Save
            </Button>
            <Button size="sm" className="h-8 text-xs gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white" onClick={handleCopyHtml}>
              {copied ? <CheckCircle2 className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
              {copied ? "Copied!" : "Copy HTML"}
            </Button>
          </div>
        </div>

        {/* ── Main layout: sidebar + preview ── */}
        <div className="flex flex-1 min-h-0">

          {/* ── SIDEBAR ── */}
          <div className="w-[320px] flex-shrink-0 border-r border-border bg-card flex flex-col min-h-0">
            <ScrollArea className="flex-1">
              <div>

                {/* ── Section 1: AI Generator ── */}
                <SidebarSection section={SECTIONS[0]} open={openSections.has("ai")} onToggle={() => toggleSection("ai")}>
                  {/* Prompt */}
                  <div className="space-y-1">
                    <Label className="text-xs">What's this email about?</Label>
                    <Textarea
                      value={prompt}
                      onChange={e => setPrompt(e.target.value)}
                      placeholder="e.g. New presale in Burnaby — 1 & 2 beds from $649K, completion 2027, PTT exempt. Highlight the deposit structure."
                      className="min-h-[80px] text-xs resize-none"
                      disabled={aiLoading}
                    />
                  </div>

                  {/* Examples */}
                  <div className="space-y-1">
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Quick examples</p>
                    <div className="flex flex-col gap-1">
                      {EXAMPLE_PROMPTS.map((ex, i) => (
                        <button
                          key={i}
                          onClick={() => setPrompt(ex)}
                          disabled={aiLoading}
                          className="text-left text-[11px] px-2.5 py-1.5 rounded-md border border-border bg-muted/40 hover:bg-muted hover:border-primary/30 transition-all text-muted-foreground hover:text-foreground"
                        >
                          {ex}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Style + project */}
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
                          <SelectItem value="none">No project</SelectItem>
                          {projects.map(p => (
                            <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Agent */}
                  {agents.length > 0 && (
                    <div className="space-y-1">
                      <Label className="text-[10px]">Agent Signature</Label>
                      <Select value={selectedAgentId} onValueChange={setSelectedAgentId}>
                        <SelectTrigger className="h-7 text-[11px]"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {agents.map(a => (
                            <SelectItem key={a.full_name} value={a.full_name}>
                              {a.full_name} — {a.title}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {/* Mini agent preview */}
                      <div className="flex items-center gap-2 mt-1.5 p-2 rounded-md bg-muted/50 border border-border">
                        {selectedAgent.photo_url ? (
                          <img src={selectedAgent.photo_url} alt={selectedAgent.full_name} className="w-8 h-8 rounded-full object-cover object-top border border-border flex-shrink-0" style={{ borderColor: "#C9A55A" }} />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-[10px] font-bold text-primary flex-shrink-0">
                            {selectedAgent.full_name.charAt(0)}
                          </div>
                        )}
                        <div className="min-w-0">
                          <p className="text-[11px] font-semibold truncate">{selectedAgent.full_name}</p>
                          <p className="text-[10px] text-muted-foreground truncate">{selectedAgent.phone}</p>
                        </div>
                      </div>
                    </div>
                  )}

                  <Button
                    className="w-full h-9 gap-2 text-white font-semibold text-xs"
                    style={{ background: aiLoading ? undefined : "linear-gradient(135deg,#7c3aed,#5b21b6)" }}
                    onClick={handleGenerate}
                    disabled={aiLoading || !prompt.trim()}
                  >
                    {aiLoading ? (
                      <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Writing your email…</>
                    ) : (
                      <><Wand2 className="h-3.5 w-3.5" /> {aiResult ? "Regenerate" : "Generate Email"}</>
                    )}
                  </Button>
                </SidebarSection>

                {/* ── Section 2: Project Details ── */}
                <SidebarSection section={SECTIONS[1]} open={openSections.has("project")} onToggle={() => toggleSection("project")}>
                  <div className="space-y-1">
                    <Label className="text-[10px]">Project Name</Label>
                    <Input value={projectName} onChange={e => setProjectName(e.target.value)} className="h-7 text-xs" placeholder="e.g. Lumina" />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[10px]">Developer</Label>
                    <Input value={developerName} onChange={e => setDeveloperName(e.target.value)} className="h-7 text-xs" placeholder="e.g. Bosa Properties" />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <Label className="text-[10px]">City</Label>
                      <Input value={city} onChange={e => setCity(e.target.value)} className="h-7 text-xs" placeholder="Surrey" />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[10px]">Neighbourhood</Label>
                      <Input value={neighborhood} onChange={e => setNeighborhood(e.target.value)} className="h-7 text-xs" placeholder="Fleetwood" />
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
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
                </SidebarSection>

                {/* ── Section 3: Hero Image ── */}
                <SidebarSection section={SECTIONS[2]} open={openSections.has("hero")} onToggle={() => toggleSection("hero")}>
                  <div className="space-y-1">
                    <Label className="text-[10px]">Image URL</Label>
                    <Input
                      value={heroImage}
                      onChange={e => setHeroImage(e.target.value)}
                      className="h-7 text-xs"
                      placeholder="https://… or leave blank"
                    />
                  </div>
                  {heroImage && (
                    <div className="rounded-lg overflow-hidden border border-border">
                      <img src={heroImage} alt="Hero" className="w-full h-24 object-cover" onError={() => setHeroImage("")} />
                    </div>
                  )}
                  {!heroImage && (
                    <div className="rounded-lg border-2 border-dashed border-border flex items-center justify-center h-20 text-[10px] text-muted-foreground gap-2">
                      <Image className="h-4 w-4" />
                      No hero image — email will render without one
                    </div>
                  )}
                  {projects.length > 0 && (
                    <div>
                      <p className="text-[10px] text-muted-foreground mb-1.5">Or pick from your projects:</p>
                      <div className="grid grid-cols-3 gap-1.5">
                        {projects.filter(p => p.featured_image).slice(0, 6).map(p => (
                          <button
                            key={p.id}
                            onClick={() => setHeroImage(p.featured_image!)}
                            className={cn(
                              "relative rounded overflow-hidden border-2 transition-all aspect-video",
                              heroImage === p.featured_image ? "border-primary" : "border-transparent hover:border-border",
                            )}
                          >
                            <img src={p.featured_image!} alt={p.name} className="w-full h-full object-cover" />
                            {heroImage === p.featured_image && (
                              <div className="absolute inset-0 bg-primary/20 flex items-center justify-center">
                                <CheckCircle2 className="h-4 w-4 text-primary" />
                              </div>
                            )}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </SidebarSection>

                {/* ── Section 4: Email Copy ── */}
                <SidebarSection section={SECTIONS[3]} open={openSections.has("copy")} onToggle={() => toggleSection("copy")}>
                  <div className="space-y-1">
                    <Label className="text-[10px]">Subject Line</Label>
                    <Input value={subjectLine} onChange={e => setSubjectLine(e.target.value)} className="h-7 text-xs" placeholder="🏙️ Exclusive Access: Lumina — Surrey Presale" />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[10px]">Preview Text</Label>
                    <Input value={previewText} onChange={e => setPreviewText(e.target.value)} className="h-7 text-xs" placeholder="From $649K · Surrey presale — limited units" />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[10px]">Headline</Label>
                    <Input value={headline} onChange={e => setHeadline(e.target.value)} className="h-7 text-xs" placeholder="Introducing Lumina — Surrey's Next Landmark" />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[10px]">Body Copy</Label>
                    <Textarea
                      value={bodyCopy}
                      onChange={e => setBodyCopy(e.target.value)}
                      className="min-h-[110px] text-xs resize-none"
                      placeholder="Write your body copy here. Each new line becomes a paragraph."
                    />
                    <p className="text-[10px] text-muted-foreground">Each line = one paragraph in the email.</p>
                  </div>
                </SidebarSection>

                {/* ── Section 5: Incentives ── */}
                <SidebarSection section={SECTIONS[4]} open={openSections.has("incentives")} onToggle={() => toggleSection("incentives")}>
                  <div className="space-y-1">
                    <Label className="text-[10px]">Incentive List</Label>
                    <Textarea
                      value={incentiveText}
                      onChange={e => setIncentiveText(e.target.value)}
                      className="min-h-[90px] text-xs resize-none"
                      placeholder={"✦ Extended deposit: 5% now, 5% in 180 days\n✦ Free parking valued at $35,000\n✦ Assignment clause included"}
                    />
                    <p className="text-[10px] text-muted-foreground">One bullet per line. Leave blank to hide this section.</p>
                  </div>
                </SidebarSection>

              </div>
            </ScrollArea>
          </div>

          {/* ── PREVIEW PANE ── */}
          <div className="flex-1 flex flex-col min-h-0 min-w-0">

            {/* Preview toolbar */}
            <div className="flex-shrink-0 flex items-center justify-between px-4 py-2.5 border-b border-border bg-muted/20">
              <div className="flex items-center bg-background border border-border rounded-lg p-0.5 gap-0.5">
                <button
                  onClick={() => setPreviewTab("preview")}
                  className={cn("px-3 py-1 text-xs font-medium rounded transition-all flex items-center gap-1.5", previewTab === "preview" ? "bg-card shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground")}
                >
                  <Eye className="h-3 w-3" /> Preview
                </button>
                <button
                  onClick={() => setPreviewTab("code")}
                  className={cn("px-3 py-1 text-xs font-medium rounded transition-all flex items-center gap-1.5", previewTab === "code" ? "bg-card shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground")}
                >
                  <Code2 className="h-3 w-3" /> HTML
                </button>
              </div>

              {/* Subject / preview text bar */}
              {(subjectLine || previewText) && (
                <div className="hidden md:flex items-center gap-4 text-[10px] text-muted-foreground max-w-md truncate">
                  {subjectLine && <span className="truncate"><span className="font-semibold text-foreground">Subject:</span> {subjectLine}</span>}
                </div>
              )}

              <Button variant="outline" size="sm" className="h-7 text-xs gap-1.5" onClick={handleCopyHtml}>
                {copied ? <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" /> : <Download className="h-3.5 w-3.5" />}
                {copied ? "Copied!" : "Copy HTML"}
              </Button>
            </div>

            {/* Preview content */}
            {previewTab === "preview" ? (
              <div className="flex-1 overflow-y-auto bg-[#f0ede8]" style={{ minHeight: 0 }}>
                <div style={{ width: "100%", minHeight: "100%", display: "flex", justifyContent: "center", padding: "20px 0 40px" }}>
                  <iframe
                    key={previewHtml.slice(0, 80)}
                    srcDoc={previewHtml}
                    sandbox="allow-same-origin"
                    style={{ border: "none", width: 600, minHeight: 800, flexShrink: 0, background: "#fff" }}
                  />
                </div>
              </div>
            ) : (
              <div className="flex-1 overflow-auto bg-muted/30" style={{ minHeight: 0 }}>
                <pre className="p-4 text-[10px] leading-relaxed font-mono text-muted-foreground whitespace-pre-wrap break-all">
                  {previewHtml}
                </pre>
              </div>
            )}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
