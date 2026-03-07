import { useState, useEffect, useRef, useCallback } from "react";
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
  LayoutGrid, FolderOpen, Wand2, Star, BookMarked,
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

// ─── Sample email HTML builder for preview ────────────────────────────────────
function buildPreviewHtml(opts: {
  headline: string;
  projectName: string;
  city: string;
  price: string;
  accentColor: string;
  heroGradient: string;
  showIncentives: boolean;
  bodyCopy: string;
}): string {
  const { headline, projectName, city, price, accentColor, heroGradient, showIncentives, bodyCopy } = opts;
  return `<!DOCTYPE html>
<html><head><meta charset="UTF-8"/>
<link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@300;400&family=DM+Sans:wght@300;400;500&display=swap" rel="stylesheet"/>
<style>body{margin:0;padding:0;background:#f4f4f0;font-family:'DM Sans',sans-serif;}*{box-sizing:border-box;}</style>
</head>
<body>
<table width="600" align="center" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;width:100%;background:#fff;">
  <!-- HEADER -->
  <tr><td style="padding:24px 36px 22px;background:#0d1f18;">
    <div style="font-family:'DM Sans',sans-serif;font-size:8px;letter-spacing:2px;text-transform:uppercase;color:${accentColor};margin-bottom:6px;">PRESALE PROPERTIES</div>
    <div style="font-family:'Cormorant Garamond',Georgia,serif;font-size:36px;font-weight:400;color:#fff;line-height:1;margin-bottom:8px;">${projectName || "New Release"}</div>
    <div style="font-family:'DM Sans',sans-serif;font-size:11px;color:#8aaa96;">Your Presale Specialist · presaleproperties.com</div>
    <div style="width:40px;height:2px;background:${accentColor};margin-top:12px;"></div>
  </td></tr>
  <!-- HERO -->
  <tr><td style="padding:0;height:160px;background:${heroGradient};position:relative;">
    <div style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;">
      <div style="text-align:center;">
        ${city ? `<div style="font-family:'DM Sans',sans-serif;font-size:9px;letter-spacing:3px;text-transform:uppercase;color:rgba(255,255,255,0.6);margin-bottom:8px;">${city.toUpperCase()}</div>` : ""}
        <div style="font-family:'DM Sans',sans-serif;font-size:8px;letter-spacing:4px;text-transform:uppercase;color:${accentColor};">ADD HERO IMAGE IN BUILDER</div>
      </div>
    </div>
  </td></tr>
  ${city || projectName ? `<tr><td style="padding:11px 36px;background:${accentColor};"><div style="font-family:'DM Sans',sans-serif;font-size:9px;letter-spacing:3px;text-transform:uppercase;color:#fff;">${[projectName,city].filter(Boolean).map(s=>s.toUpperCase()).join("  ·  ")}</div></td></tr>` : ""}
  <!-- BODY -->
  <tr><td style="padding:32px 36px 24px;background:#fff;">
    <div style="font-family:'DM Sans',sans-serif;font-size:9px;letter-spacing:2px;text-transform:uppercase;color:${accentColor};margin-bottom:10px;">EXCLUSIVE OPPORTUNITY</div>
    <div style="font-family:'Cormorant Garamond',Georgia,serif;font-size:28px;font-weight:400;color:#111;line-height:1.15;margin-bottom:16px;">${headline}</div>
    ${price ? `
    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="border-top:1px solid #efefef;border-bottom:1px solid #efefef;margin-bottom:20px;">
      <tr>
        <td style="padding:14px 0;width:33%;"><div style="font-family:'Cormorant Garamond',serif;font-size:26px;color:#111;">${price}</div><div style="font-family:'DM Sans',sans-serif;font-size:8px;letter-spacing:1px;text-transform:uppercase;color:#aaa;margin-top:4px;">Starting + GST</div></td>
      </tr>
    </table>` : ""}
    <div style="font-family:'DM Sans',sans-serif;font-size:13px;color:#555;line-height:1.8;">${bodyCopy.split("\n").filter(Boolean).slice(0,3).map(l=>`<div style="margin-bottom:10px;padding-left:16px;border-left:3px solid ${accentColor};">${l}</div>`).join("")}</div>
  </td></tr>
  ${showIncentives ? `
  <tr><td style="padding:24px 36px;background:#0f2419;">
    <div style="font-family:'DM Sans',sans-serif;font-size:8px;letter-spacing:2px;text-transform:uppercase;color:${accentColor};margin-bottom:12px;">EXCLUSIVE INCENTIVES</div>
    ${["Extended deposit structure: 5% now, 5% in 180 days","Developer bonus: $10,000 in upgrades","Free parking (valued at $35,000)"].map(l=>`<div style="display:flex;gap:8px;margin-bottom:8px;"><div style="width:5px;height:5px;background:${accentColor};margin-top:5px;flex-shrink:0;"></div><div style="font-family:'DM Sans',sans-serif;font-size:12px;color:#c8d8cc;">${l}</div></div>`).join("")}
  </td></tr>` : ""}
  <!-- CTA -->
  <tr><td style="padding:24px 36px 28px;">
    <table cellpadding="0" cellspacing="0" border="0" style="margin-bottom:10px;">
      <tr><td style="background:#0d1f18;padding:14px 36px;text-align:center;"><a href="#" style="font-family:'DM Sans',sans-serif;font-size:9px;letter-spacing:3px;text-transform:uppercase;color:#fff;text-decoration:none;">VIEW FLOOR PLANS &amp; BROCHURE →</a></td></tr>
    </table>
    <table cellpadding="0" cellspacing="0" border="0">
      <tr><td style="border:1.5px solid ${accentColor};padding:12px 36px;text-align:center;"><a href="#" style="font-family:'DM Sans',sans-serif;font-size:9px;letter-spacing:3px;text-transform:uppercase;color:${accentColor};text-decoration:none;">BOOK A PRIVATE CONSULTATION</a></td></tr>
    </table>
  </td></tr>
  <!-- FOOTER -->
  <tr><td style="padding:20px 36px;background:#0d1f18;border-top:1px solid #1a2e24;">
    <div style="font-family:'DM Sans',sans-serif;font-size:10px;font-weight:500;color:#fff;margin-bottom:2px;">Your Presale Specialist</div>
    <div style="font-family:'DM Sans',sans-serif;font-size:10px;color:#5a7a66;">Presale Properties · presaleproperties.com</div>
  </td></tr>
</table>
</body></html>`;
}

// ─── Built-in starter templates ───────────────────────────────────────────────
const BUILTIN_TEMPLATES = [
  {
    key: "main-project-email",
    name: "Main Project Email",
    desc: "Your go-to template for introducing a new presale project to your VIP list. Includes hero image, stats, highlights, and CTAs.",
    icon: Mail,
    color: "from-emerald-600 to-emerald-800",
    badge: "Core",
    badgeColor: "bg-emerald-500/15 text-emerald-600 border-emerald-500/30",
    preview: {
      headline: "Introducing — [Project Name]",
      projectName: "Lumina",
      city: "Surrey",
      price: "$749,900",
      accentColor: "#C9A55A",
      heroGradient: "linear-gradient(135deg, #0d1f18 0%, #1a3028 50%, #0a1a10 100%)",
      showIncentives: false,
      bodyCopy: "Park-facing homes available\nPTT exemption eligible\nCo-op commission available\nLimited units — register now",
    },
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
    desc: "High-urgency email for limited-time promotions, incentives, or special pricing windows. Bold headline, incentive spotlight, and direct CTA.",
    icon: Star,
    color: "from-amber-500 to-amber-700",
    badge: "Promo",
    badgeColor: "bg-amber-500/15 text-amber-600 border-amber-500/30",
    preview: {
      headline: "Exclusive Offer — [Time-Sensitive Pricing]",
      projectName: "Meridian",
      city: "Burnaby",
      price: "$599,900",
      accentColor: "#e8a020",
      heroGradient: "linear-gradient(135deg, #1a1000 0%, #2d1f00 50%, #1a1000 100%)",
      showIncentives: true,
      bodyCopy: "Extended deposit: 5% now, 5% in 180 days\n$10,000 developer bonus\nFree parking valued at $35,000",
    },
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

// ─── Scaled iframe preview component ─────────────────────────────────────────
function EmailIframePreview({ html, scale = 0.35, height = 280 }: { html: string; scale?: number; height?: number }) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const iframeWidth = 600;

  return (
    <div
      style={{
        width: "100%",
        height,
        overflow: "hidden",
        position: "relative",
        borderRadius: "0",
        background: "#f4f4f0",
      }}
    >
      <div
        style={{
          position: "absolute",
          top: 0,
          left: "50%",
          transform: `translateX(-50%) scale(${scale})`,
          transformOrigin: "top center",
          width: iframeWidth,
          height: Math.round(height / scale),
          pointerEvents: "none",
        }}
      >
        <iframe
          ref={iframeRef}
          srcDoc={html}
          sandbox="allow-same-origin"
          scrolling="no"
          style={{
            border: "none",
            width: iframeWidth,
            height: Math.round(height / scale),
            display: "block",
          }}
        />
      </div>
    </div>
  );
}

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
            <Badge variant="outline" className="text-[10px]">Preview</Badge>
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

// ─── AI Email Copy Generator Modal ───────────────────────────────────────────
const EXAMPLE_PROMPTS = [
  "New project in Burnaby — 1 and 2 beds starting from $649K, completion 2027, PTT exempt",
  "Exclusive VIP offer for Lumina Surrey — extended deposit, free parking, limited units left",
  "Follow-up email for clients who registered at the open house — remind them about floor plans",
  "Introducing a luxury waterfront project in North Van — developer is Bosa, from $1.2M",
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
  const [tab, setTab] = useState<"compose" | "preview">("compose");
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
      setTab("preview");
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
    setTab("compose");
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-5xl max-h-[94vh] overflow-hidden p-0 flex flex-col">
        {/* ── Header ── */}
        <div className="flex-shrink-0 bg-card border-b border-border px-6 py-4">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2.5">
              <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-violet-500 to-violet-700 flex items-center justify-center shadow-sm flex-shrink-0">
                <Sparkles className="h-5 w-5 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-base font-bold">AI Email Writer</div>
                <div className="text-xs text-muted-foreground font-normal">Trained on Uzair's voice · Writes Version A & B automatically</div>
              </div>
              {/* Tab switcher */}
              {result && (
                <div className="flex items-center bg-muted rounded-lg p-0.5 gap-0.5 ml-auto">
                  <button
                    onClick={() => setTab("compose")}
                    className={cn("px-3 py-1.5 text-xs font-medium rounded-md transition-all", tab === "compose" ? "bg-card shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground")}
                  >
                    Compose
                  </button>
                  <button
                    onClick={() => setTab("preview")}
                    className={cn("px-3 py-1.5 text-xs font-medium rounded-md transition-all", tab === "preview" ? "bg-card shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground")}
                  >
                    Preview
                  </button>
                </div>
              )}
            </DialogTitle>
          </DialogHeader>
        </div>

        {/* ── Body ── */}
        <div className="flex flex-1 min-h-0">

          {/* ── LEFT: Compose panel ── */}
          <div className={cn("flex flex-col overflow-y-auto", result ? "w-[380px] flex-shrink-0 border-r border-border" : "w-full")}>
            <div className="p-5 space-y-4">
              {/* Prompt */}
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">What's this email about?</Label>
                <Textarea
                  value={prompt}
                  onChange={e => setPrompt(e.target.value)}
                  placeholder="e.g. New presale in Burnaby — 1 and 2 beds from $649K, completion 2027. PTT exempt. Highlight the extended deposit structure."
                  className="min-h-[90px] text-sm resize-none"
                  disabled={loading}
                />
                <p className="text-[11px] text-muted-foreground">Include price, location, incentives, audience, or tone — the more detail, the better.</p>
              </div>

              {/* Examples */}
              <div className="space-y-1">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Quick examples</p>
                <div className="flex flex-col gap-1">
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
              </div>

              {/* Options */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs font-medium">Template style</Label>
                  <Select value={templateType} onValueChange={setTemplateType} disabled={loading}>
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="main-project-email">Main Project Email</SelectItem>
                      <SelectItem value="exclusive-offer">Exclusive Offer</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs font-medium">Link to project <span className="text-muted-foreground">(optional)</span></Label>
                  <Select value={selectedProjectId} onValueChange={setSelectedProjectId} disabled={loading}>
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue placeholder="Select project…" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">No project</SelectItem>
                      {projects.map(p => (
                        <SelectItem key={p.id} value={p.id}>{p.name} — {p.city}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Generate */}
              <Button
                className="w-full h-10 gap-2 font-semibold text-white"
                style={{ background: "linear-gradient(135deg, #7c3aed, #5b21b6)" }}
                onClick={handleGenerate}
                disabled={loading || !prompt.trim()}
              >
                {loading ? (
                  <><Loader2 className="h-4 w-4 animate-spin" /> Writing your email…</>
                ) : (
                  <><Sparkles className="h-4 w-4" /> {result ? "Regenerate" : "Generate Email Copy"}</>
                )}
              </Button>

              {/* Metadata badges */}
              {result && (
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {result.projectName && <Badge variant="outline" className="text-[10px]">🏙 {result.projectName}</Badge>}
                  {result.city && <Badge variant="outline" className="text-[10px]">📍 {result.city}</Badge>}
                  {result.startingPrice && <Badge variant="outline" className="text-[10px]">💰 {result.startingPrice}</Badge>}
                  {result.deposit && <Badge variant="outline" className="text-[10px]">📋 {result.deposit}</Badge>}
                  {result.completion && <Badge variant="outline" className="text-[10px]">🏗 {result.completion}</Badge>}
                </div>
              )}
            </div>
          </div>

          {/* ── RIGHT: Preview / copy panel ── */}
          {result && (
            <div className="flex-1 flex flex-col min-w-0 min-h-0">
              {/* Version tabs + actions */}
              <div className="flex-shrink-0 flex items-center justify-between px-4 py-2.5 border-b border-border bg-muted/20">
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
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" className="h-7 text-xs gap-1.5" onClick={handleCopyHtml}>
                    {copied ? <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" /> : <Download className="h-3.5 w-3.5" />}
                    {copied ? "Copied!" : "Copy HTML"}
                  </Button>
                </div>
              </div>

              {/* Subject + preheader bar */}
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

              {/* Email preview iframe */}
              <div className="flex-1 overflow-y-auto bg-[#f0ede8]" style={{ minHeight: 0 }}>
                <div style={{ width: "100%", minHeight: "100%", display: "flex", justifyContent: "center", padding: "16px 0" }}>
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

          {/* ── Empty state when no result ── */}
          {!result && !loading && (
            <div className="hidden" />
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
  
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

  // Fetch projects for AI modal context
  useEffect(() => {
    supabase
      .from("presale_projects")
      .select("id, name, city")
      .eq("is_published", true)
      .order("name")
      .limit(50)
      .then(({ data }: { data: any }) => { if (data) setProjects(data as Array<{ id: string; name: string; city: string }>); });
  }, []);

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Delete template "${name}"? This cannot be undone.`)) return;
    setDeleting(id);
    const { error } = await supabase.from("campaign_templates" as any).delete().eq("id", id);
    if (error) toast.error("Failed to delete");
    else { toast.success("Template deleted"); await fetchTemplates(); }
    setDeleting(null);
  };

  const handleDuplicate = async (template: EmailTemplate) => {
    const { error } = await supabase.from("campaign_templates" as any).insert({
      name: `${template.name} (Copy)`,
      project_name: template.project_name,
      form_data: template.form_data,
    });
    if (error) toast.error("Failed to duplicate");
    else { toast.success("Template duplicated"); await fetchTemplates(); }
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

  // Generate preview HTML for saved templates
  const getSavedPreviewHtml = (template: EmailTemplate) => {
    const vars = template.form_data?.vars || {};
    return buildPreviewHtml({
      headline: vars.headline || "New Presale Opportunity",
      projectName: vars.projectName || template.project_name || "Project",
      city: vars.city || "",
      price: vars.startingPrice || "",
      accentColor: "#C9A55A",
      heroGradient: "linear-gradient(135deg, #0d1f18 0%, #1a3028 50%, #0a1a10 100%)",
      showIncentives: !!(vars.incentiveText?.trim()),
      bodyCopy: vars.bodyCopy || "",
    });
  };

  // Apply AI-generated copy to the builder
  const handleAiApply = (copy: Record<string, string>, templateType: string) => {
    const baseTpl = BUILTIN_TEMPLATES.find(t => t.key === templateType) || BUILTIN_TEMPLATES[0];
    const draft = {
      vars: {
        ...baseTpl.form_data.vars,
        subjectLine: copy.subjectLine || baseTpl.form_data.vars.subjectLine,
        previewText: copy.previewText || baseTpl.form_data.vars.previewText,
        headline: copy.headline || baseTpl.form_data.vars.headline,
        bodyCopy: copy.bodyCopy || baseTpl.form_data.vars.bodyCopy,
        incentiveText: copy.incentiveText || baseTpl.form_data.vars.incentiveText,
        startingPrice: copy.startingPrice || "",
        deposit: copy.deposit || "",
        completion: copy.completion || "",
        projectName: copy.projectName || "",
        city: copy.city || "",
        neighborhood: copy.neighborhood || "",
        developerName: copy.developerName || "",
      },
      cta: baseTpl.form_data.cta,
      fontIdx: baseTpl.form_data.fontIdx,
      savedAt: new Date().toISOString(),
    };
    localStorage.setItem("email_builder_draft_v2", JSON.stringify(draft));
    navigate("/admin/email-builder");
    toast.success("AI copy loaded — finish customizing and save!");
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
        onApply={handleAiApply}
      />

      <div className="flex flex-col h-full bg-background">

        {/* ── Header ── */}
        <div className="border-b border-border bg-card px-6 py-4 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center shadow-sm">
              <Mail className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold tracking-tight">Email Builder</h1>
              <p className="text-xs text-muted-foreground">Mailchimp-ready HTML emails in under a minute</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-4 text-xs text-muted-foreground">
              <span className="flex items-center gap-1.5"><LayoutGrid className="h-3.5 w-3.5" />{templates.length} saved</span>
              <span className="flex items-center gap-1.5"><FolderOpen className="h-3.5 w-3.5" />{BUILTIN_TEMPLATES.length} starters</span>
            </div>
            <Button
              onClick={() => setAiModalOpen(true)}
              className="gap-2 bg-gradient-to-r from-violet-600 to-violet-800 hover:from-violet-700 hover:to-violet-900 text-white"
            >
              <Sparkles className="h-4 w-4" />
              Write with AI
            </Button>
            <Button
              onClick={() => navigate("/admin/email-builder")}
              variant="outline"
              className="gap-2"
            >
              <Plus className="h-4 w-4" />
              Blank
            </Button>
          </div>
        </div>

        {/* ── Main content ── */}
        <div className="flex-1 overflow-auto p-6 space-y-10">

          {/* ── Quick Start row ── */}
          <section>
            <h2 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-3">Quick Start</h2>
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
              <button
                onClick={() => setAiModalOpen(true)}
                className="group flex items-center gap-4 p-4 rounded-xl border-2 border-violet-500/40 bg-violet-500/5 hover:border-violet-500/70 hover:bg-violet-500/10 hover:shadow-md transition-all text-left"
              >
                <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-violet-500 to-violet-700 flex items-center justify-center shrink-0 shadow-sm group-hover:scale-105 transition-transform">
                  <Sparkles className="h-5 w-5 text-white" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-semibold">Write with AI</div>
                  <div className="text-[11px] text-muted-foreground mt-0.5">Describe it — AI writes the copy</div>
                </div>
                <ChevronRight className="h-4 w-4 text-violet-500 ml-auto shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
              </button>
              {[
                {
                  icon: Wand2,
                  title: "Blank Email",
                  desc: "Start from scratch with a clean slate",
                  color: "from-slate-500 to-slate-700",
                  action: () => navigate("/admin/email-builder"),
                },
                ...BUILTIN_TEMPLATES.map(t => ({
                  icon: t.icon,
                  title: t.name,
                  desc: t.desc.slice(0, 60) + "…",
                  color: t.color,
                  action: () => handleOpenBuiltin(t),
                })),
              ].map(({ icon: Icon, title, desc, color, action }) => (
                <button
                  key={title}
                  onClick={action}
                  className="group flex items-center gap-4 p-4 rounded-xl border border-border bg-card hover:border-primary/40 hover:shadow-md transition-all text-left"
                >
                  <div className={cn("h-10 w-10 rounded-xl bg-gradient-to-br flex items-center justify-center shrink-0 shadow-sm group-hover:scale-105 transition-transform", color)}>
                    <Icon className="h-5 w-5 text-white" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-semibold">{title}</div>
                    <div className="text-[11px] text-muted-foreground mt-0.5 line-clamp-1">{desc}</div>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground ml-auto shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
                </button>
              ))}
            </div>
          </section>


          {/* ── Starter Templates with LIVE PREVIEW ── */}
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Starter Templates</h2>
              <Badge variant="outline" className="text-[10px]">{BUILTIN_TEMPLATES.length} templates</Badge>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {BUILTIN_TEMPLATES.map((tpl) => {
                const Icon = tpl.icon;
                const previewHtml = buildPreviewHtml(tpl.preview);
                return (
                  <div
                    key={tpl.key}
                    className="group relative rounded-2xl border border-border bg-card hover:border-primary/40 hover:shadow-xl transition-all overflow-hidden"
                  >
                    {/* Live email preview thumbnail */}
                    <div className="relative overflow-hidden border-b border-border" style={{ height: 260 }}>
                      <EmailIframePreview html={previewHtml} scale={0.43} height={260} />

                      {/* Hover overlay */}
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all flex items-center justify-center opacity-0 group-hover:opacity-100">
                        <button
                          onClick={(e) => { e.stopPropagation(); setPreviewModal({ html: previewHtml, name: tpl.name }); }}
                          className="bg-card/95 border border-border rounded-lg px-3 py-2 text-xs font-medium flex items-center gap-1.5 shadow-lg hover:bg-card transition-colors"
                        >
                          <ZoomIn className="h-3.5 w-3.5" /> Full Preview
                        </button>
                      </div>

                      {/* Badge */}
                      <div className="absolute top-3 right-3">
                        <Badge className={cn("text-[9px] h-5 border font-semibold", tpl.badgeColor)}>
                          {tpl.badge}
                        </Badge>
                      </div>
                    </div>

                    {/* Info */}
                    <div className="p-4">
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div className="flex items-center gap-2">
                          <div className={cn("h-8 w-8 rounded-lg bg-gradient-to-br flex items-center justify-center shrink-0", tpl.color)}>
                            <Icon className="h-4 w-4 text-white" />
                          </div>
                          <div>
                            <p className="text-sm font-bold">{tpl.name}</p>
                            <p className="text-[11px] text-muted-foreground">{tpl.badge} template</p>
                          </div>
                        </div>
                      </div>

                      <p className="text-xs text-muted-foreground leading-relaxed mb-3">{tpl.desc}</p>

                      {/* Feature pills */}
                      <div className="flex flex-wrap gap-1.5 mb-4">
                        {tpl.key === "main-project-email" && (
                          <>
                            <span className="text-[10px] bg-muted/60 text-muted-foreground rounded-full px-2 py-0.5">Hero Image</span>
                            <span className="text-[10px] bg-muted/60 text-muted-foreground rounded-full px-2 py-0.5">Stats Row</span>
                            <span className="text-[10px] bg-muted/60 text-muted-foreground rounded-full px-2 py-0.5">Floor Plans CTA</span>
                            <span className="text-[10px] bg-muted/60 text-muted-foreground rounded-full px-2 py-0.5">Book Consult</span>
                          </>
                        )}
                        {tpl.key === "exclusive-offer" && (
                          <>
                            <span className="text-[10px] bg-muted/60 text-muted-foreground rounded-full px-2 py-0.5">Urgency Copy</span>
                            <span className="text-[10px] bg-muted/60 text-muted-foreground rounded-full px-2 py-0.5">Incentive Block</span>
                            <span className="text-[10px] bg-muted/60 text-muted-foreground rounded-full px-2 py-0.5">Pricing CTA</span>
                            <span className="text-[10px] bg-muted/60 text-muted-foreground rounded-full px-2 py-0.5">Limited-Time</span>
                          </>
                        )}
                      </div>

                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          className={cn("flex-1 h-9 text-xs gap-1.5 text-white", `bg-gradient-to-r ${tpl.color}`)}
                          onClick={() => handleOpenBuiltin(tpl)}
                        >
                          <Wand2 className="h-3.5 w-3.5" /> Use This Template
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-9 w-9 p-0 shrink-0"
                          onClick={() => setPreviewModal({ html: previewHtml, name: tpl.name })}
                          title="Preview email"
                        >
                          <Eye className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          {/* ── Saved Templates ── */}
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">My Saved Emails</h2>
              <Badge variant="outline" className="text-[10px]">{templates.length} saved</Badge>
            </div>

            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {[1, 2, 3].map(i => (
                  <div key={i} className="h-44 rounded-xl border border-border bg-muted/30 animate-pulse" />
                ))}
              </div>
            ) : templates.length === 0 ? (
              <div className="text-center py-14 border-2 border-dashed border-border rounded-2xl">
                <BookMarked className="h-10 w-10 text-muted-foreground/40 mx-auto mb-3" />
                <p className="text-sm font-semibold text-muted-foreground">No saved emails yet</p>
                <p className="text-xs text-muted-foreground mt-1 mb-4">Build an email and hit "Save Template" to store it here.</p>
                <Button onClick={() => navigate("/admin/email-builder")} variant="outline" size="sm" className="gap-1.5">
                  <Plus className="h-3.5 w-3.5" /> Create First Email
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {templates.map(template => {
                  const fd = template.form_data || {};
                  const vars = fd.vars || {};
                  const previewHtml = getSavedPreviewHtml(template);
                  return (
                    <div
                      key={template.id}
                      className="group relative rounded-2xl border border-border bg-card hover:border-primary/40 hover:shadow-xl transition-all overflow-hidden"
                    >
                      {/* Live email preview thumbnail */}
                      <div className="relative overflow-hidden border-b border-border" style={{ height: 200 }}>
                        <EmailIframePreview html={previewHtml} scale={0.35} height={200} />

                        {/* Hover overlay */}
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/25 transition-all flex items-center justify-center opacity-0 group-hover:opacity-100 gap-2">
                          <button
                            onClick={(e) => { e.stopPropagation(); setPreviewModal({ html: previewHtml, name: template.name }); }}
                            className="bg-card/95 border border-border rounded-lg px-2.5 py-1.5 text-xs font-medium flex items-center gap-1 shadow-lg hover:bg-card transition-colors"
                          >
                            <ZoomIn className="h-3 w-3" /> Preview
                          </button>
                        </div>

                        <div className="absolute top-2 right-2">
                          <div className="bg-blue-500/90 rounded-full px-2 py-0.5 text-[9px] font-bold text-white">EMAIL</div>
                        </div>
                      </div>

                      {/* Info */}
                      <div className="p-3">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <p className="text-sm font-semibold truncate">{template.name}</p>
                            <p className="text-[10px] text-muted-foreground truncate mt-0.5">
                              {vars.projectName || template.project_name || "Untitled"}
                              {vars.city && ` · ${vars.city}`}
                            </p>
                            <div className="flex items-center gap-1.5 mt-1">
                              <Clock className="h-3 w-3 text-muted-foreground" />
                              <span className="text-[10px] text-muted-foreground">{timeAgo(template.updated_at)}</span>
                            </div>
                          </div>
                        </div>

                        {vars.subjectLine && (
                          <p className="text-[10px] text-muted-foreground mt-1.5 truncate italic">
                            ✉ {vars.subjectLine}
                          </p>
                        )}

                        {/* Actions */}
                        <div className="flex gap-2 mt-3">
                          <Button
                            size="sm"
                            className="flex-1 h-8 text-xs gap-1.5 bg-blue-600 hover:bg-blue-700 text-white"
                            onClick={() => handleOpenSaved(template)}
                          >
                            <Download className="h-3 w-3" /> Open & Edit
                          </Button>
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-8 w-8 shrink-0"
                            title="Duplicate"
                            onClick={() => handleDuplicate(template)}
                          >
                            <Copy className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-8 w-8 shrink-0 hover:border-destructive hover:text-destructive"
                            title="Delete"
                            disabled={deleting === template.id}
                            onClick={() => handleDelete(template.id, template.name)}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        </div>
      </div>
    </AdminLayout>
  );
}
