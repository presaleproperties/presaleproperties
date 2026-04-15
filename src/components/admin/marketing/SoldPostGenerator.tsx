import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  Sparkles, Copy, Loader2, RectangleVertical, Square, User, Hash, Building2, Download, MapPin, Type,
} from "lucide-react";
import logoImg from "@/assets/logo-new.png";

interface Project {
  id: string;
  name: string;
  city: string;
  neighborhood: string;
  featured_image: string | null;
  gallery_images: string[] | null;
}

interface TeamMember {
  id: string;
  full_name: string;
  title: string;
  photo_url: string | null;
  phone: string | null;
}

interface CaptionVariation {
  style: string;
  caption: string;
}

type PostSize = "post" | "story";

export function SoldPostGenerator() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [selectedProject, setSelectedProject] = useState("");
  const [selectedAgent, setSelectedAgent] = useState("");
  const [unitCount, setUnitCount] = useState("1");
  const [unitNumber, setUnitNumber] = useState("");
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [userInput, setUserInput] = useState("");
  const [postSize, setPostSize] = useState<PostSize>("post");
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [captions, setCaptions] = useState<CaptionVariation[]>([]);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  // Editable text
  const [headlineTop, setHeadlineTop] = useState("Just");
  const [headlineMain, setHeadlineMain] = useState("SOLD");
  const [customAgentName, setCustomAgentName] = useState("");
  const [customProjectName, setCustomProjectName] = useState("");

  useEffect(() => {
    Promise.all([
      supabase
        .from("presale_projects")
        .select("id, name, city, neighborhood, featured_image, gallery_images")
        .eq("is_published", true)
        .order("name"),
      supabase
        .from("team_members")
        .select("id, full_name, title, photo_url, phone")
        .eq("is_active", true)
        .order("sort_order"),
    ]).then(([projRes, teamRes]) => {
      setProjects((projRes.data as Project[]) || []);
      setTeamMembers((teamRes.data as TeamMember[]) || []);
      setLoading(false);
    });
  }, []);

  const selectedProj = projects.find(p => p.id === selectedProject);
  const selectedMember = teamMembers.find(t => t.id === selectedAgent);

  useEffect(() => {
    if (selectedProj) {
      setCustomProjectName(selectedProj.name);
    }
  }, [selectedProject]);

  useEffect(() => {
    if (selectedMember) {
      setCustomAgentName(selectedMember.full_name);
    }
  }, [selectedAgent]);

  useEffect(() => {
    if (!selectedProj) { setPreviewUrl(null); return; }
    renderPreview();
  }, [selectedProject, selectedAgent, unitCount, unitNumber, postSize, selectedImage,
      headlineTop, headlineMain, customAgentName, customProjectName]);

  const renderPreview = async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const isStory = postSize === "story";
    const w = 1080;
    const h = isStory ? 1920 : 1080;
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d")!;

    // Brand colors
    const gold = "#c8a45e";
    const darkBg = "#0f0f0f";

    // === SOLID DARK BACKGROUND ===
    ctx.fillStyle = darkBg;
    ctx.fillRect(0, 0, w, h);

    // Project image as subtle background
    const bgImage = selectedImage || selectedProj?.featured_image;
    if (bgImage) {
      try {
        const img = await loadImage(bgImage);
        const scale = Math.max(w / img.width, h / img.height);
        const sw = img.width * scale;
        const sh = img.height * scale;
        ctx.globalAlpha = 0.12;
        ctx.drawImage(img, (w - sw) / 2, (h - sh) / 2, sw, sh);
        ctx.globalAlpha = 1;
      } catch { /* fallback */ }
    }

    // Dark overlay for consistent look
    const overlay = ctx.createRadialGradient(w * 0.3, h * 0.4, 0, w * 0.5, h * 0.5, w);
    overlay.addColorStop(0, "rgba(15,15,15,0.5)");
    overlay.addColorStop(1, "rgba(15,15,15,0.85)");
    ctx.fillStyle = overlay;
    ctx.fillRect(0, 0, w, h);

    const leftMargin = isStory ? 80 : 70;

    // === TOP: PRESALE PROPERTIES branding ===
    const topY = isStory ? 75 : 55;
    ctx.fillStyle = "#FFFFFF";
    ctx.font = `600 ${isStory ? 28 : 22}px system-ui, -apple-system, sans-serif`;
    ctx.textAlign = "center";
    ctx.fillText("PRESALE PROPERTIES", w / 2, topY);

    // Thin gold line below branding
    const lineY = topY + (isStory ? 20 : 16);
    ctx.strokeStyle = gold;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(w / 2 - 80, lineY);
    ctx.lineTo(w / 2 + 80, lineY);
    ctx.stroke();

    ctx.fillStyle = "rgba(255,255,255,0.5)";
    ctx.font = `300 ${isStory ? 15 : 12}px system-ui, -apple-system, sans-serif`;
    ctx.fillText("PRESALE REAL ESTATE", w / 2, lineY + (isStory ? 22 : 18));

    // === "Just" in gold italic serif ===
    const justY = isStory ? 360 : 220;
    ctx.fillStyle = gold;
    ctx.font = `italic ${isStory ? 100 : 72}px Georgia, "Times New Roman", serif`;
    ctx.textAlign = "left";
    ctx.fillText(headlineTop, leftMargin, justY);

    // === "SOLD" large bold ===
    const soldY = justY + (isStory ? 140 : 100);
    ctx.fillStyle = "#FFFFFF";
    ctx.font = `800 ${isStory ? 170 : 130}px system-ui, -apple-system, sans-serif`;
    ctx.textAlign = "left";
    ctx.fillText(headlineMain, leftMargin - 4, soldY);

    // === Thin gold separator ===
    const sepY = soldY + (isStory ? 30 : 20);
    ctx.strokeStyle = gold;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(leftMargin, sepY);
    ctx.lineTo(leftMargin + (isStory ? 200 : 160), sepY);
    ctx.stroke();

    // === Project name + location ===
    const projY = sepY + (isStory ? 60 : 45);
    const displayProject = customProjectName || selectedProj?.name || "";
    ctx.fillStyle = "#FFFFFF";
    ctx.font = `600 ${isStory ? 40 : 30}px system-ui, -apple-system, sans-serif`;
    ctx.textAlign = "left";
    ctx.fillText(displayProject, leftMargin, projY);

    const loc = [selectedProj?.neighborhood, selectedProj?.city].filter(Boolean).join(", ");
    if (loc) {
      ctx.fillStyle = "rgba(255,255,255,0.55)";
      ctx.font = `400 ${isStory ? 28 : 22}px system-ui, -apple-system, sans-serif`;
      ctx.fillText(loc, leftMargin, projY + (isStory ? 45 : 34));
    }

    // === Units badge ===
    const units = parseInt(unitCount) || 1;
    if (units > 1) {
      const badgeY = projY + (loc ? (isStory ? 90 : 70) : (isStory ? 55 : 42));
      const badgeText = `${units} UNITS SOLD`;
      ctx.font = `600 ${isStory ? 24 : 20}px system-ui, -apple-system, sans-serif`;
      const tw = ctx.measureText(badgeText).width;
      const bw = tw + 36;
      const bh = isStory ? 44 : 36;

      ctx.fillStyle = "rgba(200,164,94,0.15)";
      roundRect(ctx, leftMargin, badgeY, bw, bh, 4);
      ctx.fill();
      ctx.strokeStyle = gold;
      ctx.lineWidth = 1.5;
      roundRect(ctx, leftMargin, badgeY, bw, bh, 4);
      ctx.stroke();

      ctx.fillStyle = gold;
      ctx.textAlign = "left";
      ctx.fillText(badgeText, leftMargin + 18, badgeY + bh * 0.68);
    }

    // === AGENT SECTION — bottom ===
    const agentName = customAgentName || selectedMember?.full_name || "";
    const agentTitle = selectedMember?.title || "";
    const agentPhone = selectedMember?.phone || "";

    // Bottom bar background
    const barH = isStory ? 200 : 160;
    const barY = h - barH;

    // Gradient fade into bar
    const barGrad = ctx.createLinearGradient(0, barY - 60, 0, barY);
    barGrad.addColorStop(0, "rgba(15,15,15,0)");
    barGrad.addColorStop(1, "rgba(10,10,10,0.95)");
    ctx.fillStyle = barGrad;
    ctx.fillRect(0, barY - 60, w, 60);

    ctx.fillStyle = "rgba(10,10,10,0.95)";
    ctx.fillRect(0, barY, w, barH);

    // Gold top line on bar
    ctx.fillStyle = gold;
    ctx.fillRect(0, barY, w, 3);

    if (selectedMember) {
      const circleSize = isStory ? 110 : 90;
      const circleX = leftMargin + circleSize / 2;
      const circleY = barY + barH / 2;

      // Agent headshot in circle
      if (selectedMember.photo_url) {
        try {
          const img = await loadImage(selectedMember.photo_url);
          ctx.save();
          ctx.beginPath();
          ctx.arc(circleX, circleY, circleSize / 2, 0, Math.PI * 2);
          ctx.closePath();
          ctx.clip();
          // Center-crop the image into circle
          const imgMin = Math.min(img.width, img.height);
          const sx = (img.width - imgMin) / 2;
          const sy = (img.height - imgMin) / 2;
          ctx.drawImage(img, sx, sy, imgMin, imgMin, circleX - circleSize / 2, circleY - circleSize / 2, circleSize, circleSize);
          ctx.restore();

          // Gold ring
          ctx.strokeStyle = gold;
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.arc(circleX, circleY, circleSize / 2 + 2, 0, Math.PI * 2);
          ctx.stroke();
        } catch { /* skip */ }
      }

      // Agent text — to the right of circle
      const textX = circleX + circleSize / 2 + (isStory ? 30 : 24);
      const textCenterY = circleY;

      ctx.fillStyle = "#FFFFFF";
      ctx.font = `700 ${isStory ? 32 : 26}px system-ui, -apple-system, sans-serif`;
      ctx.textAlign = "left";
      ctx.fillText(agentName, textX, textCenterY - (isStory ? 14 : 10));

      const subParts = [agentTitle, agentPhone].filter(Boolean).join("  ·  ");
      if (subParts) {
        ctx.fillStyle = "rgba(255,255,255,0.55)";
        ctx.font = `400 ${isStory ? 22 : 18}px system-ui, -apple-system, sans-serif`;
        ctx.fillText(subParts, textX, textCenterY + (isStory ? 22 : 18));
      }
    }

    // Real Broker badge — bottom right
    const realW = isStory ? 90 : 70;
    const realH = isStory ? 36 : 28;
    const realX = w - leftMargin - realW;
    const realY = barY + (barH - realH) / 2;
    ctx.strokeStyle = "rgba(255,255,255,0.4)";
    ctx.lineWidth = 1;
    ctx.strokeRect(realX, realY, realW, realH);
    ctx.fillStyle = "rgba(255,255,255,0.5)";
    ctx.font = `400 ${isStory ? 20 : 16}px system-ui, -apple-system, sans-serif`;
    ctx.textAlign = "center";
    ctx.fillText("real", realX + realW / 2, realY + realH * 0.72);

    // Bottom gold accent
    ctx.fillStyle = gold;
    ctx.fillRect(0, h - 4, w, 4);

    setPreviewUrl(canvas.toDataURL("image/png"));
  };

  const loadImage = (src: string): Promise<HTMLImageElement> =>
    new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = src;
    });

  function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
  }

  const generateCaption = async () => {
    if (!userInput.trim()) { toast.error("Type something about the sale first"); return; }
    setGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke("generate-sold-caption", {
        body: {
          userInput: userInput.trim(),
          projectName: customProjectName || selectedProj?.name || "",
          agentName: customAgentName || selectedMember?.full_name || "",
          unitCount: unitCount || "1",
        },
      });
      if (error) throw new Error(error.message);
      if (data?.error) throw new Error(data.error);
      setCaptions(data.captions || []);
      toast.success("Captions generated!");
    } catch (e: any) {
      toast.error(e.message || "Generation failed");
    } finally {
      setGenerating(false);
    }
  };

  const copyText = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard!");
  };

  const downloadGraphic = () => {
    if (!previewUrl) return;
    const a = document.createElement("a");
    a.href = previewUrl;
    const name = (customProjectName || selectedProj?.name || "sold").replace(/\s+/g, "-").toLowerCase();
    a.download = `${name}-sold-${postSize}.png`;
    a.click();
    toast.success("Image downloaded!");
  };

  return (
    <div className="space-y-6">
      <canvas ref={canvasRef} className="hidden" />

      {/* Selectors */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <div>
          <label className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground mb-1.5 block">
            <Building2 className="h-3 w-3 inline mr-1" />Project
          </label>
          {loading ? (
            <div className="h-10 bg-muted/30 animate-pulse rounded-lg" />
          ) : (
            <select
              value={selectedProject}
              onChange={e => { setSelectedProject(e.target.value); setCaptions([]); setSelectedImage(null); }}
              className="w-full h-10 rounded-lg border border-border bg-card px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="">Choose a project…</option>
              {projects.map(p => (
                <option key={p.id} value={p.id}>{p.name} — {p.city}</option>
              ))}
            </select>
          )}
        </div>

        <div>
          <label className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground mb-1.5 block">
            <User className="h-3 w-3 inline mr-1" />Agent
          </label>
          <select
            value={selectedAgent}
            onChange={e => setSelectedAgent(e.target.value)}
            className="w-full h-10 rounded-lg border border-border bg-card px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          >
            <option value="">Choose agent…</option>
            {teamMembers.map(t => (
              <option key={t.id} value={t.id}>{t.full_name} — {t.title}</option>
            ))}
          </select>
        </div>

        <div className="flex gap-2">
          <div className="flex-1">
            <label className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground mb-1.5 block">
              <Hash className="h-3 w-3 inline mr-1" />Units
            </label>
            <Input type="number" min={1} max={100} value={unitCount} onChange={e => setUnitCount(e.target.value)} className="h-10" />
          </div>
          <div className="flex-1">
            <label className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground mb-1.5 block">
              <MapPin className="h-3 w-3 inline mr-1" />Unit #
            </label>
            <Input type="text" placeholder="906" value={unitNumber} onChange={e => setUnitNumber(e.target.value)} className="h-10" />
          </div>
        </div>
      </div>

      {/* Customize Text */}
      <div className="rounded-xl border border-border bg-card/50 p-4 space-y-3">
        <div className="flex items-center gap-2 mb-1">
          <Type className="h-3.5 w-3.5 text-primary" />
          <span className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">Customize Text</span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div>
            <label className="text-[10px] text-muted-foreground mb-1 block">Top Line</label>
            <Input value={headlineTop} onChange={e => setHeadlineTop(e.target.value)} placeholder="Just" className="h-8 text-xs" />
          </div>
          <div>
            <label className="text-[10px] text-muted-foreground mb-1 block">Headline</label>
            <Input value={headlineMain} onChange={e => setHeadlineMain(e.target.value)} placeholder="SOLD" className="h-8 text-xs" />
          </div>
          <div>
            <label className="text-[10px] text-muted-foreground mb-1 block">Project Name</label>
            <Input value={customProjectName} onChange={e => setCustomProjectName(e.target.value)} placeholder="Project" className="h-8 text-xs" />
          </div>
          <div>
            <label className="text-[10px] text-muted-foreground mb-1 block">Agent Name</label>
            <Input value={customAgentName} onChange={e => setCustomAgentName(e.target.value)} placeholder="Agent" className="h-8 text-xs" />
          </div>
        </div>
      </div>

      {/* Size + Photos */}
      <div className="flex flex-col sm:flex-row gap-4 items-start">
        <div>
          <label className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground mb-1.5 block">Size</label>
          <div className="flex gap-2">
            <Button variant={postSize === "post" ? "default" : "outline"} size="sm" className="gap-1.5" onClick={() => setPostSize("post")}>
              <Square className="h-3.5 w-3.5" /> Post (1:1)
            </Button>
            <Button variant={postSize === "story" ? "default" : "outline"} size="sm" className="gap-1.5" onClick={() => setPostSize("story")}>
              <RectangleVertical className="h-3.5 w-3.5" /> Story (9:16)
            </Button>
          </div>
        </div>

        {selectedProj && (() => {
          const allPhotos = [selectedProj.featured_image, ...(selectedProj.gallery_images || [])].filter(Boolean) as string[];
          if (allPhotos.length <= 1) return null;
          return (
            <div className="flex-1 min-w-0">
              <label className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground mb-1.5 block">Background Photo</label>
              <div className="flex gap-2 overflow-x-auto pb-1">
                {allPhotos.map((url, i) => (
                  <button
                    key={i}
                    onClick={() => setSelectedImage(url === selectedProj.featured_image && !selectedImage ? null : url)}
                    className={cn(
                      "shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-all hover:opacity-90",
                      (selectedImage === url || (!selectedImage && url === selectedProj.featured_image))
                        ? "border-primary ring-2 ring-primary/30" : "border-border opacity-60"
                    )}
                  >
                    <img src={url} alt={`Photo ${i + 1}`} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            </div>
          );
        })()}
      </div>

      {/* Preview + Caption */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div>
          <div className="flex items-center justify-between mb-3">
            <span className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">Preview</span>
            {previewUrl && (
              <Button onClick={downloadGraphic} size="sm" variant="outline" className="gap-1.5 text-xs h-7">
                <Download className="h-3 w-3" /> Download
              </Button>
            )}
          </div>
          {previewUrl ? (
            <div className={cn(
              "rounded-xl overflow-hidden border border-border bg-muted/20 shadow-lg",
              postSize === "story" ? "max-w-[280px]" : "max-w-[440px]"
            )}>
              <img src={previewUrl} alt="Sold post preview" className="w-full h-auto" />
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-16 border-2 border-dashed border-border rounded-xl text-center">
              <Square className="h-8 w-8 text-muted-foreground/20 mb-2" />
              <p className="text-sm text-muted-foreground">Select a project to preview</p>
            </div>
          )}
        </div>

        <div>
          <span className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground mb-3 block">AI Caption Generator</span>
          <div className="space-y-3">
            <Textarea
              value={userInput}
              onChange={e => setUserInput(e.target.value)}
              placeholder="e.g. Just helped a first time buyer secure a 2 bedroom condo with just $5,000 down payment"
              rows={3}
              className="text-sm resize-none"
            />
            <Button onClick={generateCaption} disabled={generating || !userInput.trim()} className="w-full gap-1.5" size="sm">
              {generating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
              {generating ? "Generating…" : "Generate Caption"}
            </Button>
            {captions.length > 0 && (
              <div className="space-y-3 mt-4">
                {captions.map((c, i) => (
                  <div key={i} className="rounded-xl border border-border bg-card overflow-hidden">
                    <div className="px-4 py-2 bg-muted/30 border-b border-border flex items-center justify-between">
                      <Badge variant="outline" className="text-[10px] font-semibold">{c.style}</Badge>
                      <Button variant="ghost" size="sm" onClick={() => copyText(c.caption)} className="gap-1 text-xs h-6">
                        <Copy className="h-3 w-3" /> Copy
                      </Button>
                    </div>
                    <div className="p-4">
                      <Textarea value={c.caption} readOnly rows={6} className="text-xs resize-none bg-muted/20 leading-relaxed" />
                    </div>
                  </div>
                ))}
                <Button onClick={generateCaption} disabled={generating} variant="outline" className="w-full gap-1.5" size="sm">
                  {generating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
                  Regenerate
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
