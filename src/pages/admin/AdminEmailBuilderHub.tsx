import { useState, useEffect, useRef } from "react";
import { buildAiEmailHtml, type AiEmailCopy } from "@/components/admin/AiEmailTemplate";
import { useNavigate } from "react-router-dom";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Plus, Mail, Clock, Trash2, Copy, ChevronRight,
  Wand2, Star, BookMarked,
  Download, Eye, X, ZoomIn, Sparkles, Loader2,
  Building2, CheckCircle2, ArrowRight,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface EmailTemplate {
  id: string;
  name: string;
  project_name: string;
  thumbnail_url: string | null;
  form_data: any;
  created_at: string;
  updated_at: string;
}

// ─── Starter templates config ─────────────────────────────────────────────────
const BUILTIN_TEMPLATES = [
  {
    key: "main-project-email",
    name: "Main Project Email",
    desc: "Hero image, stats bar, highlights, floor plan CTA, agent card.",
    icon: Mail,
    color: "from-emerald-600 to-emerald-800",
    iconBg: "bg-emerald-500/10",
    iconColor: "text-emerald-600",
    badge: "Core",
    badgeColor: "bg-emerald-500/15 text-emerald-600 border-emerald-500/30",
    form_data: {
      vars: {
        headline: "Introducing — [Project Name]",
        bodyCopy: "I wanted to personally reach out with the full details on this opportunity. Below you'll find everything — the pricing, floor plans, deposit structure, and key highlights. I work exclusively with buyers, so my job is to make sure you have everything you need to make the right decision. Give me a call whenever you're ready.",
        subjectLine: "🏙️ Exclusive Access: [Project Name] — [City] Presale",
        previewText: "From $[Price] · [City] presale — limited units available",
        incentiveText: "",
        greeting: "",
        projectName: "",
        developerName: "",
        address: "",
        city: "",
        neighborhood: "",
        completion: "",
        startingPrice: "",
        deposit: "",
        featuredImage: "",
        brochureUrl: "",
        floorplanUrl: "",
        pricingUrl: "",
        projectUrl: "",
        bookUrl: "https://presaleproperties.com/book",
      },
      cta: { brochure: false, floorplan: true, pricing: false, viewProject: true, bookConsult: true },
      fontIdx: 0,
    },
  },
  {
    key: "exclusive-offer",
    name: "Exclusive Offer",
    desc: "High-urgency email for limited-time promotions, incentives, or special pricing windows.",
    icon: Star,
    color: "from-amber-500 to-amber-700",
    iconBg: "bg-amber-500/10",
    iconColor: "text-amber-600",
    badge: "Promo",
    badgeColor: "bg-amber-500/15 text-amber-600 border-amber-500/30",
    form_data: {
      vars: {
        headline: "Exclusive Offer — [Time-Sensitive Pricing]",
        bodyCopy: "This is one of those rare moments where everything lines up — the right project, the right price, and the right timing. I've been holding this back for our VIP list only. Below are the details. This window is short, so please reach out as soon as you've had a chance to review.",
        subjectLine: "⚡ VIP-Only Offer: [Project Name] — Act Before [Date]",
        previewText: "Exclusive savings available for a limited time — see details inside",
        incentiveText: "✦ Extended deposit structure: 5% now, 5% in 180 days\n✦ Developer bonus: $10,000 in upgrades\n✦ Free parking (valued at $35,000)\n✦ Assignment clause included",
        greeting: "",
        projectName: "",
        developerName: "",
        address: "",
        city: "",
        neighborhood: "",
        completion: "",
        startingPrice: "",
        deposit: "5%",
        featuredImage: "",
        brochureUrl: "",
        floorplanUrl: "",
        pricingUrl: "",
        projectUrl: "",
        bookUrl: "https://presaleproperties.com/book",
      },
      cta: { brochure: false, floorplan: true, pricing: true, viewProject: false, bookConsult: true },
      fontIdx: 0,
    },
  },
];

// ─── Full-size preview modal ──────────────────────────────────────────────────
function PreviewModal({ html, name, onClose }: { html: string; name: string; onClose: () => void }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div
        className="bg-card rounded-2xl border border-border shadow-2xl overflow-hidden w-full max-w-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-border bg-muted/30">
          <div className="flex items-center gap-2">
            <Eye className="h-4 w-4 text-primary" />
            <span className="text-sm font-semibold">{name}</span>
          </div>
          <button onClick={onClose} className="h-7 w-7 rounded-md flex items-center justify-center hover:bg-muted transition-colors">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div style={{ height: 600, overflowY: "auto", background: "#f4f4f0" }}>
          <iframe
            srcDoc={html}
            sandbox="allow-same-origin"
            style={{ border: "none", width: "100%", height: "1200px", display: "block" }}
          />
        </div>
      </div>
    </div>
  );
}

// ─── AI Email Modal ───────────────────────────────────────────────────────────
const EXAMPLE_PROMPTS = [
  "New project in Burnaby — 1 and 2 beds starting from $649K, completion 2027, PTT exempt",
  "Exclusive VIP offer for Lumina Surrey — extended deposit, free parking, limited units left",
  "Follow-up email for clients who registered at the open house",
  "Luxury waterfront project in North Van — developer is Bosa, from $1.2M",
];

function copyCombined(r: Record<string, string>, versionB = false): AiEmailCopy {
  return {
    subjectLine:   versionB ? (r.subjectLineB  || r.subjectLine)  : r.subjectLine,
    previewText:   versionB ? (r.previewTextB  || r.previewText)  : r.previewText,
    headline:      versionB ? (r.headlineB     || r.headline)     : r.headline,
    bodyCopy:      versionB ? (r.bodyCopyB     || r.bodyCopy)     : r.bodyCopy,
    incentiveText: r.incentiveText,
    projectName:   r.projectName,
    city:          r.city,
    neighborhood:  r.neighborhood,
    developerName: r.developerName,
    startingPrice: r.startingPrice,
    deposit:       r.deposit,
    completion:    r.completion,
  };
}

function AiEmailModal({
  open,
  onClose,
  projects,
}: {
  open: boolean;
  onClose: () => void;
  projects: Array<{ id: string; name: string; city: string }>;
}) {
  const [prompt, setPrompt] = useState("");
  const [selectedProjectId, setSelectedProjectId] = useState<string>("none");
  const [templateType, setTemplateType] = useState<string>("main-project-email");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<Record<string, string> | null>(null);
  const [activeVersion, setActiveVersion] = useState<"A" | "B">("A");
  const [copied, setCopied] = useState(false);

  const activeCopy = result ? copyCombined(result, activeVersion === "B") : null;
  const previewHtml = activeCopy ? buildAiEmailHtml(activeCopy) : "";

  const handleGenerate = async () => {
    if (!prompt.trim()) { toast.error("Please enter a brief prompt first"); return; }
    setLoading(true);
    setResult(null);
    try {
      const project = projects.find(p => p.id === selectedProjectId && selectedProjectId !== "none");
      const { data, error } = await supabase.functions.invoke("generate-email-copy", {
        body: { prompt: prompt.trim(), projectDetails: project ? { name: project.name, city: project.city } : null, templateType },
      });
      if (error) throw new Error(error.message);
      if (data?.error) throw new Error(data.error);
      setResult(data.copy);
      setActiveVersion("A");
    } catch (e: any) {
      toast.error(e.message || "Failed to generate copy");
    } finally {
      setLoading(false);
    }
  };

  const handleCopyHtml = () => {
    if (!previewHtml) return;
    navigator.clipboard.writeText(previewHtml).then(() => {
      setCopied(true);
      toast.success("HTML copied to clipboard");
      setTimeout(() => setCopied(false), 2500);
    });
  };

  const handleClose = () => {
    setPrompt("");
    setSelectedProjectId("none");
    setResult(null);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-5xl max-h-[94vh] overflow-hidden p-0 flex flex-col">
        <div className="flex-shrink-0 border-b border-border px-6 py-4">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2.5">
              <div className="h-8 w-8 rounded-lg bg-violet-500/10 flex items-center justify-center flex-shrink-0">
                <Sparkles className="h-4 w-4 text-violet-600" />
              </div>
              <div>
                <div className="text-sm font-bold">AI Email Writer</div>
                <div className="text-xs text-muted-foreground font-normal">Trained on Uzair's voice · Writes Version A & B</div>
              </div>
            </DialogTitle>
          </DialogHeader>
        </div>

        <div className="flex flex-1 min-h-0">
          {/* Compose */}
          <div className={cn("flex flex-col overflow-y-auto border-r border-border", result ? "w-[340px] flex-shrink-0" : "w-full max-w-xl mx-auto")}>
            <div className="p-5 space-y-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">What's this email about?</Label>
                <Textarea
                  value={prompt}
                  onChange={e => setPrompt(e.target.value)}
                  placeholder="e.g. New presale in Burnaby — 1 and 2 beds from $649K, completion 2027. PTT exempt."
                  className="min-h-[80px] text-sm resize-none"
                  disabled={loading}
                />
                <p className="text-[11px] text-muted-foreground">Include price, location, incentives, or tone for best results.</p>
              </div>

              <div className="flex flex-col gap-1">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Quick examples</p>
                {EXAMPLE_PROMPTS.map((ex, i) => (
                  <button
                    key={i}
                    onClick={() => setPrompt(ex)}
                    disabled={loading}
                    className="text-left text-xs px-3 py-2 rounded-lg border border-border bg-muted/40 hover:bg-muted hover:border-primary/30 transition-all text-muted-foreground hover:text-foreground"
                  >
                    {ex}
                  </button>
                ))}
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <Label className="text-xs font-medium">Style</Label>
                  <Select value={templateType} onValueChange={setTemplateType} disabled={loading}>
                    <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="main-project-email">Main Project Email</SelectItem>
                      <SelectItem value="exclusive-offer">Exclusive Offer</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs font-medium">Project <span className="text-muted-foreground">(optional)</span></Label>
                  <Select value={selectedProjectId} onValueChange={setSelectedProjectId} disabled={loading}>
                    <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Select…" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">None</SelectItem>
                      {projects.map(p => (
                        <SelectItem key={p.id} value={p.id}>{p.name} — {p.city}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Button
                className="w-full h-9 gap-2 font-semibold text-white bg-violet-600 hover:bg-violet-700"
                onClick={handleGenerate}
                disabled={loading || !prompt.trim()}
              >
                {loading
                  ? <><Loader2 className="h-4 w-4 animate-spin" /> Writing…</>
                  : <><Sparkles className="h-4 w-4" /> {result ? "Regenerate" : "Generate Email"}</>
                }
              </Button>

              {result && (
                <div className="flex flex-wrap gap-1.5">
                  {result.projectName && <Badge variant="outline" className="text-[10px]">🏙 {result.projectName}</Badge>}
                  {result.city && <Badge variant="outline" className="text-[10px]">📍 {result.city}</Badge>}
                  {result.startingPrice && <Badge variant="outline" className="text-[10px]">💰 {result.startingPrice}</Badge>}
                </div>
              )}
            </div>
          </div>

          {/* Preview */}
          {result && (
            <div className="flex-1 flex flex-col min-w-0 min-h-0">
              <div className="flex-shrink-0 flex items-center justify-between px-4 py-2.5 border-b border-border bg-muted/10">
                <div className="flex items-center bg-background border border-border rounded-lg p-0.5 gap-0.5">
                  <button
                    onClick={() => setActiveVersion("A")}
                    className={cn("px-3 py-1 text-xs font-semibold rounded transition-all", activeVersion === "A" ? "bg-emerald-600 text-white shadow-sm" : "text-muted-foreground hover:text-foreground")}
                  >
                    Version A — Detailed
                  </button>
                  {(result.subjectLineB || result.bodyCopyB) && (
                    <button
                      onClick={() => setActiveVersion("B")}
                      className={cn("px-3 py-1 text-xs font-semibold rounded transition-all", activeVersion === "B" ? "bg-amber-500 text-white shadow-sm" : "text-muted-foreground hover:text-foreground")}
                    >
                      Version B — Punchy
                    </button>
                  )}
                </div>
                <Button variant="outline" size="sm" className="h-7 text-xs gap-1.5" onClick={handleCopyHtml}>
                  {copied ? <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" /> : <Download className="h-3.5 w-3.5" />}
                  {copied ? "Copied!" : "Copy HTML"}
                </Button>
              </div>

              {activeCopy && (
                <div className="flex-shrink-0 px-4 py-2.5 border-b border-border bg-muted/10 space-y-1">
                  {activeCopy.subjectLine && (
                    <div className="flex items-baseline gap-2">
                      <span className="text-[10px] uppercase tracking-wider text-muted-foreground w-16 flex-shrink-0">Subject</span>
                      <span className="text-xs font-semibold truncate">{activeCopy.subjectLine}</span>
                    </div>
                  )}
                  {activeCopy.previewText && (
                    <div className="flex items-baseline gap-2">
                      <span className="text-[10px] uppercase tracking-wider text-muted-foreground w-16 flex-shrink-0">Preview</span>
                      <span className="text-xs text-muted-foreground truncate">{activeCopy.previewText}</span>
                    </div>
                  )}
                </div>
              )}

              <div className="flex-1 overflow-y-auto bg-[#f0ede8]" style={{ minHeight: 0 }}>
                <div style={{ display: "flex", justifyContent: "center", padding: "16px 0" }}>
                  <iframe
                    key={previewHtml.slice(0, 60)}
                    srcDoc={previewHtml}
                    sandbox="allow-same-origin"
                    style={{ border: "none", width: 600, height: 900, flexShrink: 0, background: "#fff" }}
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function AdminEmailBuilderHub() {
  const navigate = useNavigate();
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [previewModal, setPreviewModal] = useState<{ html: string; name: string } | null>(null);
  const [aiModalOpen, setAiModalOpen] = useState(false);
  const [projects, setProjects] = useState<Array<{ id: string; name: string; city: string }>>([]);

  const fetchTemplates = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("campaign_templates" as any)
      .select("*")
      .order("updated_at", { ascending: false });
    if (!error && data) setTemplates(data as unknown as EmailTemplate[]);
    setLoading(false);
  };

  useEffect(() => { fetchTemplates(); }, []);

  useEffect(() => {
    supabase
      .from("presale_projects")
      .select("id, name, city")
      .eq("is_published", true)
      .order("name")
      .limit(50)
      .then(({ data }: { data: any }) => { if (data) setProjects(data); });
  }, []);

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Delete "${name}"?`)) return;
    setDeleting(id);
    const { error } = await supabase.from("campaign_templates" as any).delete().eq("id", id);
    if (error) toast.error("Failed to delete");
    else { toast.success("Deleted"); await fetchTemplates(); }
    setDeleting(null);
  };

  const handleDuplicate = async (template: EmailTemplate) => {
    const { error } = await supabase.from("campaign_templates" as any).insert({
      name: `${template.name} (Copy)`,
      project_name: template.project_name,
      form_data: template.form_data,
    });
    if (error) toast.error("Failed to duplicate");
    else { toast.success("Duplicated"); await fetchTemplates(); }
  };

  const handleOpenBuiltin = (tpl: typeof BUILTIN_TEMPLATES[0]) => {
    const draft = {
      vars: tpl.form_data.vars,
      cta: tpl.form_data.cta,
      fontIdx: tpl.form_data.fontIdx,
      savedAt: new Date().toISOString(),
    };
    localStorage.setItem("email_builder_draft_v2", JSON.stringify(draft));
    navigate("/admin/email-builder");
  };

  const handleOpenSaved = (template: EmailTemplate) => {
    const fd = template.form_data || {};
    const draft = {
      vars: fd.vars || {},
      cta: fd.cta || {},
      fontIdx: fd.fontIdx ?? 0,
      agentId: fd.agentId,
      savedAt: new Date().toISOString(),
      _overwriteId: template.id,
      _templateName: template.name,
    };
    localStorage.setItem("email_builder_draft_v2", JSON.stringify(draft));
    navigate("/admin/email-builder");
  };

  const timeAgo = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    const hrs = Math.floor(mins / 60);
    const days = Math.floor(hrs / 24);
    if (days > 0) return `${days}d ago`;
    if (hrs > 0) return `${hrs}h ago`;
    if (mins > 0) return `${mins}m ago`;
    return "Just now";
  };

  return (
    <AdminLayout>
      {previewModal && (
        <PreviewModal
          html={previewModal.html}
          name={previewModal.name}
          onClose={() => setPreviewModal(null)}
        />
      )}

      <AiEmailModal
        open={aiModalOpen}
        onClose={() => setAiModalOpen(false)}
        projects={projects}
      />

      <div className="flex flex-col h-full bg-background">

        {/* Header */}
        <div className="border-b border-border bg-card px-6 py-4 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <Mail className="h-4 w-4 text-primary" />
            </div>
            <div>
              <h1 className="text-base font-bold tracking-tight">Email Builder</h1>
              <p className="text-xs text-muted-foreground">Mailchimp-ready HTML in under a minute</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              onClick={() => setAiModalOpen(true)}
              className="gap-1.5 h-8 text-xs bg-violet-600 hover:bg-violet-700 text-white"
            >
              <Sparkles className="h-3.5 w-3.5" />
              Write with AI
            </Button>
            <Button
              onClick={() => navigate("/admin/email-builder")}
              variant="outline"
              className="gap-1.5 h-8 text-xs"
            >
              <Plus className="h-3.5 w-3.5" />
              Blank
            </Button>
          </div>
        </div>

        <div className="flex-1 overflow-auto">
          <div className="max-w-4xl mx-auto p-6 space-y-8">

            {/* Quick Start */}
            <section>
              <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground mb-3">Templates</p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                {/* AI */}
                <button
                  onClick={() => setAiModalOpen(true)}
                  className="group flex items-center gap-3 p-4 rounded-xl border-2 border-violet-500/30 bg-violet-500/5 hover:border-violet-500/60 hover:bg-violet-500/10 transition-all text-left"
                >
                  <div className="h-9 w-9 rounded-lg bg-violet-500/15 flex items-center justify-center shrink-0">
                    <Sparkles className="h-4 w-4 text-violet-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold">Write with AI</div>
                    <div className="text-[11px] text-muted-foreground">Describe it — AI writes the copy</div>
                  </div>
                  <ArrowRight className="h-4 w-4 text-violet-500/60 opacity-0 group-hover:opacity-100 transition-opacity" />
                </button>

                {/* Builtin templates */}
                {BUILTIN_TEMPLATES.map(tpl => (
                  <button
                    key={tpl.key}
                    onClick={() => handleOpenBuiltin(tpl)}
                    className="group flex items-center gap-3 p-4 rounded-xl border border-border bg-card hover:border-primary/40 hover:bg-accent/20 transition-all text-left"
                  >
                    <div className={cn("h-9 w-9 rounded-lg flex items-center justify-center shrink-0", tpl.iconBg)}>
                      <tpl.icon className={cn("h-4 w-4", tpl.iconColor)} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 mb-0.5">
                        <span className="text-sm font-semibold">{tpl.name}</span>
                        <Badge className={cn("text-[9px] h-4 px-1.5 border", tpl.badgeColor)}>{tpl.badge}</Badge>
                      </div>
                      <div className="text-[11px] text-muted-foreground line-clamp-1">{tpl.desc}</div>
                    </div>
                    <ChevronRight className="h-4 w-4 text-muted-foreground/40 opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                  </button>
                ))}
              </div>
            </section>

            {/* Saved templates */}
            <section>
              <div className="flex items-center justify-between mb-3">
                <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">Saved Emails</p>
                <Badge variant="outline" className="text-[10px]">{templates.length} saved</Badge>
              </div>

              {loading ? (
                <div className="space-y-2">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="h-14 rounded-lg border border-border bg-muted/30 animate-pulse" />
                  ))}
                </div>
              ) : templates.length === 0 ? (
                <div className="text-center py-12 border-2 border-dashed border-border rounded-xl">
                  <BookMarked className="h-8 w-8 text-muted-foreground/30 mx-auto mb-2" />
                  <p className="text-sm font-medium text-muted-foreground">No saved emails yet</p>
                  <p className="text-xs text-muted-foreground/60 mt-1 mb-3">Build an email and hit "Save Template" to store it here.</p>
                  <Button onClick={() => navigate("/admin/email-builder")} variant="outline" size="sm" className="gap-1.5">
                    <Plus className="h-3.5 w-3.5" /> Create First Email
                  </Button>
                </div>
              ) : (
                <div className="space-y-1.5">
                  {templates.map(template => {
                    const fd = template.form_data || {};
                    const vars = fd.vars || {};
                    return (
                      <div
                        key={template.id}
                        className="group flex items-center gap-3 px-4 py-3 rounded-lg border border-border bg-card hover:border-primary/30 hover:bg-accent/20 transition-all"
                      >
                        {/* Icon */}
                        <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                          <Mail className="h-4 w-4 text-primary" />
                        </div>

                        {/* Info */}
                         <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold truncate">{fd.copy?.subjectLine || template.name}</p>
                          <div className="flex items-center gap-2 mt-0.5">
                            {(vars.projectName || template.project_name) && (
                              <span className="text-[11px] text-muted-foreground truncate">
                                {vars.projectName || template.project_name}
                                {vars.city && ` · ${vars.city}`}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Timestamp */}
                        <span className="text-[11px] text-muted-foreground/50 shrink-0 hidden sm:flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {timeAgo(template.updated_at)}
                        </span>

                        {/* Actions */}
                        <div className="flex items-center gap-1.5 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 px-3 text-xs"
                            onClick={() => handleOpenSaved(template)}
                          >
                            Open
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            onClick={() => handleDuplicate(template)}
                            title="Duplicate"
                          >
                            <Copy className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 hover:text-destructive"
                            disabled={deleting === template.id}
                            onClick={() => handleDelete(template.id, template.name)}
                            title="Delete"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </section>

          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
