import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  FileText, Download, Loader2, Building2, MapPin, DollarSign,
  Calendar, Bed, Bath, Maximize, Eye,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Project {
  id: string;
  name: string;
  city: string;
  neighborhood: string | null;
  developer: string | null;
  status: string;
  starting_price: number | null;
  estimated_completion: string | null;
  description: string | null;
  featured_image: string | null;
  gallery_images: string[] | null;
  bedrooms_range: string | null;
  square_footage_range: string | null;
}

interface FlyerData {
  projectName: string;
  tagline: string;
  location: string;
  developer: string;
  startingPrice: string;
  completion: string;
  bedrooms: string;
  sqft: string;
  highlights: string;
  ctaText: string;
  ctaPhone: string;
  agentName: string;
  agentTitle: string;
  featuredImage: string;
}

type FlyerStyle = "luxury" | "modern" | "minimal";

function buildFlyerHtml(d: FlyerData, style: FlyerStyle): string {
  const colors = {
    luxury: { bg: "#1a1a1a", accent: "#c8a45e", text: "#ffffff", secondary: "#999" },
    modern: { bg: "#0f172a", accent: "#3b82f6", text: "#ffffff", secondary: "#94a3b8" },
    minimal: { bg: "#ffffff", accent: "#111827", text: "#111827", secondary: "#6b7280" },
  }[style];

  const highlights = d.highlights.split("\n").filter(Boolean).map(h =>
    `<li style="margin: 0 0 6px; padding-left: 8px; font-size: 12px; color: ${colors.secondary};">✦ ${h.trim()}</li>`
  ).join("");

  return `<!DOCTYPE html>
<html>
<head><style>@page{size:letter;margin:0}body{margin:0;font-family:'Helvetica Neue',Arial,sans-serif;}</style></head>
<body style="width:8.5in;height:11in;position:relative;background:${colors.bg};color:${colors.text};overflow:hidden;">
  <!-- Hero Image -->
  <div style="width:100%;height:55%;position:relative;overflow:hidden;">
    ${d.featuredImage ? `<img src="${d.featuredImage}" style="width:100%;height:100%;object-fit:cover;display:block;" />` : `<div style="width:100%;height:100%;background:linear-gradient(135deg,${colors.accent}22,${colors.accent}44);display:flex;align-items:center;justify-content:center;"><span style="font-size:48px;opacity:0.3;">🏗️</span></div>`}
    <div style="position:absolute;bottom:0;left:0;right:0;height:120px;background:linear-gradient(transparent,${colors.bg});"></div>
    <div style="position:absolute;top:24px;left:24px;">
      <span style="background:${colors.accent};color:${style === "minimal" ? "#fff" : colors.bg};padding:6px 14px;border-radius:4px;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:1.5px;">Now Selling</span>
    </div>
  </div>
  
  <!-- Content -->
  <div style="padding:24px 32px 20px;position:relative;">
    <h1 style="margin:0 0 4px;font-size:32px;font-weight:800;letter-spacing:-0.5px;color:${colors.text};">${d.projectName}</h1>
    <p style="margin:0 0 16px;font-size:14px;color:${colors.accent};font-weight:600;">${d.tagline}</p>
    
    <!-- Key Stats -->
    <div style="display:flex;gap:16px;margin-bottom:18px;padding:14px 0;border-top:1px solid ${colors.accent}33;border-bottom:1px solid ${colors.accent}33;">
      <div style="flex:1;text-align:center;">
        <p style="margin:0;font-size:9px;color:${colors.secondary};text-transform:uppercase;letter-spacing:1px;font-weight:600;">Location</p>
        <p style="margin:4px 0 0;font-size:13px;font-weight:700;">${d.location}</p>
      </div>
      <div style="flex:1;text-align:center;border-left:1px solid ${colors.accent}33;border-right:1px solid ${colors.accent}33;">
        <p style="margin:0;font-size:9px;color:${colors.secondary};text-transform:uppercase;letter-spacing:1px;font-weight:600;">Starting From</p>
        <p style="margin:4px 0 0;font-size:13px;font-weight:700;color:${colors.accent};">${d.startingPrice}</p>
      </div>
      <div style="flex:1;text-align:center;">
        <p style="margin:0;font-size:9px;color:${colors.secondary};text-transform:uppercase;letter-spacing:1px;font-weight:600;">Completion</p>
        <p style="margin:4px 0 0;font-size:13px;font-weight:700;">${d.completion}</p>
      </div>
    </div>

    <!-- Two columns: highlights + details -->
    <div style="display:flex;gap:24px;">
      <div style="flex:1;">
        <p style="margin:0 0 8px;font-size:10px;color:${colors.secondary};text-transform:uppercase;letter-spacing:1px;font-weight:700;">Highlights</p>
        <ul style="margin:0;padding:0;list-style:none;">${highlights}</ul>
      </div>
      <div style="flex:0.6;">
        <p style="margin:0 0 8px;font-size:10px;color:${colors.secondary};text-transform:uppercase;letter-spacing:1px;font-weight:700;">Details</p>
        <p style="margin:0 0 6px;font-size:12px;color:${colors.secondary};"><strong style="color:${colors.text};">Developer:</strong> ${d.developer}</p>
        <p style="margin:0 0 6px;font-size:12px;color:${colors.secondary};"><strong style="color:${colors.text};">Bedrooms:</strong> ${d.bedrooms}</p>
        <p style="margin:0 0 6px;font-size:12px;color:${colors.secondary};"><strong style="color:${colors.text};">Size:</strong> ${d.sqft}</p>
      </div>
    </div>

    <!-- CTA Bar -->
    <div style="position:absolute;bottom:20px;left:32px;right:32px;display:flex;align-items:center;justify-content:space-between;padding:14px 20px;background:${colors.accent};border-radius:8px;">
      <div>
        <p style="margin:0;font-size:14px;font-weight:800;color:${style === "minimal" ? "#fff" : colors.bg};">${d.ctaText}</p>
        <p style="margin:2px 0 0;font-size:11px;color:${style === "minimal" ? "#ffffffcc" : colors.bg + "cc"};">${d.agentName} · ${d.agentTitle}</p>
      </div>
      <p style="margin:0;font-size:16px;font-weight:800;color:${style === "minimal" ? "#fff" : colors.bg};">${d.ctaPhone}</p>
    </div>
  </div>
</body>
</html>`;
}

const DEFAULT_FLYER: FlyerData = {
  projectName: "",
  tagline: "Luxury Living Reimagined",
  location: "",
  developer: "",
  startingPrice: "",
  completion: "",
  bedrooms: "",
  sqft: "",
  highlights: "Premium finishes throughout\nEV-ready parking\nRooftop amenities\nWalk Score 90+",
  ctaText: "Book Your Private Preview",
  ctaPhone: "(672) 258-1100",
  agentName: "Uzair Muhammad",
  agentTitle: "Presale Strategist",
  featuredImage: "",
};

export function PrintFlyerBuilder() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string>("");
  const [flyerData, setFlyerData] = useState<FlyerData>(DEFAULT_FLYER);
  const [style, setStyle] = useState<FlyerStyle>("luxury");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from("presale_projects")
        .select("id, name, city, neighborhood, developer, status, starting_price, estimated_completion, description, featured_image, gallery_images, bedrooms_range, square_footage_range")
        .eq("is_published", true)
        .order("name");
      setProjects((data as any) || []);
      setLoading(false);
    })();
  }, []);

  const handleProjectSelect = (projectId: string) => {
    setSelectedProjectId(projectId);
    const project = projects.find(p => p.id === projectId);
    if (!project) return;

    setFlyerData(prev => ({
      ...prev,
      projectName: project.name,
      location: [project.neighborhood, project.city].filter(Boolean).join(", "),
      developer: project.developer || "",
      startingPrice: project.starting_price ? `$${project.starting_price.toLocaleString()}` : "Contact Us",
      completion: project.estimated_completion || "TBD",
      bedrooms: project.bedrooms_range || "1-3 Bed",
      sqft: project.square_footage_range || "450-1,200 sqft",
      featuredImage: project.featured_image || "",
    }));
  };

  const update = (field: keyof FlyerData, value: string) => {
    setFlyerData(prev => ({ ...prev, [field]: value }));
  };

  const handlePrint = () => {
    const html = buildFlyerHtml(flyerData, style);
    const win = window.open("", "_blank");
    if (win) {
      win.document.write(html);
      win.document.close();
      setTimeout(() => win.print(), 500);
    }
  };

  const handleCopyHtml = async () => {
    try {
      await navigator.clipboard.writeText(buildFlyerHtml(flyerData, style));
      toast.success("Flyer HTML copied");
    } catch {
      toast.error("Failed to copy");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">Print Flyer Builder</p>
          <p className="text-xs text-muted-foreground/60 mt-0.5">Generate branded project one-pagers for print</p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={selectedProjectId} onValueChange={handleProjectSelect}>
            <SelectTrigger className="h-9 w-[220px] text-xs">
              <SelectValue placeholder="Select a project..." />
            </SelectTrigger>
            <SelectContent>
              {projects.map(p => (
                <SelectItem key={p.id} value={p.id}>
                  <div className="flex items-center gap-2">
                    <Building2 className="h-3.5 w-3.5 text-muted-foreground" />
                    <span>{p.name}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Editor */}
        <div className="space-y-4">
          <div className="rounded-xl border border-border bg-card overflow-hidden">
            <div className="px-4 py-3 border-b border-border bg-muted/20">
              <p className="text-xs font-semibold text-muted-foreground">Flyer Details</p>
            </div>
            <div className="p-5 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <Label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">Project Name</Label>
                  <Input value={flyerData.projectName} onChange={e => update("projectName", e.target.value)} className="h-8 text-sm mt-1" />
                </div>
                <div className="col-span-2">
                  <Label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">Tagline</Label>
                  <Input value={flyerData.tagline} onChange={e => update("tagline", e.target.value)} className="h-8 text-sm mt-1" />
                </div>
                <div>
                  <Label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">Location</Label>
                  <Input value={flyerData.location} onChange={e => update("location", e.target.value)} className="h-8 text-sm mt-1" />
                </div>
                <div>
                  <Label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">Developer</Label>
                  <Input value={flyerData.developer} onChange={e => update("developer", e.target.value)} className="h-8 text-sm mt-1" />
                </div>
                <div>
                  <Label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">Starting Price</Label>
                  <Input value={flyerData.startingPrice} onChange={e => update("startingPrice", e.target.value)} className="h-8 text-sm mt-1" />
                </div>
                <div>
                  <Label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">Completion</Label>
                  <Input value={flyerData.completion} onChange={e => update("completion", e.target.value)} className="h-8 text-sm mt-1" />
                </div>
                <div>
                  <Label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">Bedrooms</Label>
                  <Input value={flyerData.bedrooms} onChange={e => update("bedrooms", e.target.value)} className="h-8 text-sm mt-1" />
                </div>
                <div>
                  <Label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">Size (sqft)</Label>
                  <Input value={flyerData.sqft} onChange={e => update("sqft", e.target.value)} className="h-8 text-sm mt-1" />
                </div>
                <div className="col-span-2">
                  <Label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">Highlights (one per line)</Label>
                  <Textarea value={flyerData.highlights} onChange={e => update("highlights", e.target.value)} className="text-sm mt-1 min-h-[80px]" />
                </div>
                <div className="col-span-2">
                  <Label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">Featured Image URL</Label>
                  <Input value={flyerData.featuredImage} onChange={e => update("featuredImage", e.target.value)} className="h-8 text-sm mt-1" />
                </div>
                <div>
                  <Label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">CTA Text</Label>
                  <Input value={flyerData.ctaText} onChange={e => update("ctaText", e.target.value)} className="h-8 text-sm mt-1" />
                </div>
                <div>
                  <Label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">CTA Phone</Label>
                  <Input value={flyerData.ctaPhone} onChange={e => update("ctaPhone", e.target.value)} className="h-8 text-sm mt-1" />
                </div>
                <div>
                  <Label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">Agent Name</Label>
                  <Input value={flyerData.agentName} onChange={e => update("agentName", e.target.value)} className="h-8 text-sm mt-1" />
                </div>
                <div>
                  <Label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">Agent Title</Label>
                  <Input value={flyerData.agentTitle} onChange={e => update("agentTitle", e.target.value)} className="h-8 text-sm mt-1" />
                </div>
              </div>
            </div>
          </div>

          {/* Style picker */}
          <div className="rounded-xl border border-border bg-card overflow-hidden">
            <div className="px-4 py-3 border-b border-border bg-muted/20">
              <p className="text-xs font-semibold text-muted-foreground">Style</p>
            </div>
            <div className="p-4 flex items-center gap-2">
              {([
                { id: "luxury", label: "Luxury Dark", color: "bg-neutral-900" },
                { id: "modern", label: "Modern Blue", color: "bg-slate-900" },
                { id: "minimal", label: "Minimal Light", color: "bg-white border" },
              ] as const).map(s => (
                <button
                  key={s.id}
                  onClick={() => setStyle(s.id)}
                  className={cn(
                    "flex items-center gap-2 px-3 py-2 rounded-lg border text-xs font-medium transition-all",
                    style === s.id ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:border-primary/30"
                  )}
                >
                  <div className={cn("h-4 w-4 rounded", s.color)} />
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2">
            <Button className="gap-1.5" onClick={handlePrint} disabled={!flyerData.projectName}>
              <Download className="h-3.5 w-3.5" /> Print / Save as PDF
            </Button>
            <Button variant="outline" className="gap-1.5" onClick={handleCopyHtml}>
              <FileText className="h-3.5 w-3.5" /> Copy HTML
            </Button>
          </div>
        </div>

        {/* Right: Preview */}
        <div className="space-y-3">
          <div className="rounded-xl border border-border bg-card overflow-hidden">
            <div className="px-4 py-2.5 border-b border-border bg-muted/20 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Eye className="h-3.5 w-3.5 text-muted-foreground" />
                <p className="text-xs font-semibold text-muted-foreground">Preview</p>
              </div>
              <Badge variant="secondary" className="text-[9px]">8.5" × 11"</Badge>
            </div>
            <div className="p-4 flex justify-center bg-muted/10">
              <div className="w-full max-w-[400px] shadow-2xl rounded-lg overflow-hidden" style={{ aspectRatio: "8.5 / 11" }}>
                <iframe
                  srcDoc={buildFlyerHtml(flyerData, style)}
                  title="Flyer Preview"
                  className="w-full h-full border-0"
                  sandbox="allow-same-origin"
                  style={{ pointerEvents: "none" }}
                />
              </div>
            </div>
          </div>
          <p className="text-[10px] text-muted-foreground/50 text-center">
            Click "Print / Save as PDF" to generate a high-quality printable version
          </p>
        </div>
      </div>
    </div>
  );
}
