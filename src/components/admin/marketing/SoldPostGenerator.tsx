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

interface Project {
  id: string;
  name: string;
  city: string;
  neighborhood: string;
  featured_image: string | null;
  gallery_images: string[] | null;
  developer_name: string | null;
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

  // Editable text fields
  const [headlineTop, setHeadlineTop] = useState("Just");
  const [headlineMain, setHeadlineMain] = useState("SOLD");
  const [customAgentName, setCustomAgentName] = useState("");
  const [customProjectName, setCustomProjectName] = useState("");

  useEffect(() => {
    Promise.all([
      supabase
        .from("presale_projects")
        .select("id, name, city, neighborhood, featured_image, gallery_images, developer_name")
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

  // Auto-fill editable fields when selections change
  useEffect(() => {
    if (selectedProj) {
      setCustomProjectName(selectedProj.name);
      setCustomDeveloper(selectedProj.developer_name || "");
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
      headlineTop, headlineMain, priceText, customAgentName, customProjectName, customDeveloper]);

  const renderPreview = async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const isStory = postSize === "story";
    const w = 1080;
    const h = isStory ? 1920 : 1080;
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d")!;

    // === DARK BACKGROUND ===
    ctx.fillStyle = "#111111";
    ctx.fillRect(0, 0, w, h);

    // Load project image as subtle background (left/center, faded)
    const bgImage = selectedImage || selectedProj?.featured_image;
    if (bgImage) {
      try {
        const img = await loadImage(bgImage);
        const scale = Math.max(w / img.width, h / img.height);
        const sw = img.width * scale;
        const sh = img.height * scale;
        ctx.globalAlpha = 0.15;
        ctx.drawImage(img, (w - sw) / 2, (h - sh) / 2, sw, sh);
        ctx.globalAlpha = 1;
      } catch { /* fallback */ }
    }

    // Subtle gradient overlay for depth
    const grad = ctx.createLinearGradient(0, 0, w, 0);
    grad.addColorStop(0, "rgba(17,17,17,0.7)");
    grad.addColorStop(0.55, "rgba(17,17,17,0.4)");
    grad.addColorStop(1, "rgba(17,17,17,0.85)");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);

    // Top gradient
    const topGrad = ctx.createLinearGradient(0, 0, 0, h * 0.15);
    topGrad.addColorStop(0, "rgba(0,0,0,0.5)");
    topGrad.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = topGrad;
    ctx.fillRect(0, 0, w, h * 0.15);

    const leftMargin = isStory ? 70 : 60;

    // === TOP: Branding ===
    ctx.fillStyle = "#FFFFFF";
    ctx.font = `700 ${isStory ? 32 : 26}px system-ui, -apple-system, sans-serif`;
    ctx.textAlign = "center";
    ctx.fillText("PRESALE PROPERTIES", w / 2, isStory ? 80 : 60);
    ctx.font = `300 ${isStory ? 16 : 13}px system-ui, -apple-system, sans-serif`;
    ctx.letterSpacing = "4px";
    ctx.fillText("P R E S A L E   R E A L   E S T A T E", w / 2, isStory ? 110 : 82);

    // === "Just" in gold script ===
    const justY = isStory ? 340 : 200;
    ctx.fillStyle = "#c8a45e";
    ctx.font = `italic 300 ${isStory ? 110 : 80}px "Georgia", "Times New Roman", serif`;
    ctx.textAlign = "left";
    ctx.fillText(headlineTop, leftMargin, justY);

    // === "SOLD" large bold ===
    const soldY = justY + (isStory ? 150 : 110);
    ctx.fillStyle = "#FFFFFF";
    ctx.font = `900 ${isStory ? 180 : 140}px system-ui, -apple-system, sans-serif`;
    ctx.textAlign = "left";
    ctx.fillText(headlineMain, leftMargin - 5, soldY);

    // === Project name ===
    const infoY = soldY + (isStory ? 100 : 70);
    ctx.fillStyle = "#e0e0e0";
    ctx.font = `300 ${isStory ? 42 : 32}px system-ui, -apple-system, sans-serif`;
    ctx.textAlign = "left";
    const displayProject = customProjectName || selectedProj?.name || "Project Name";
    ctx.fillText(displayProject, leftMargin, infoY);

    // === Developer ===
    const devName = customDeveloper;
    if (devName) {
      const devY = infoY + (isStory ? 55 : 42);
      ctx.fillStyle = "#b0b0b0";
      ctx.font = `300 ${isStory ? 34 : 26}px system-ui, -apple-system, sans-serif`;
      const byText = "By ";
      const byWidth = ctx.measureText(byText).width;
      ctx.fillText(byText, leftMargin, devY);
      ctx.fillStyle = "#FFFFFF";
      ctx.font = `700 ${isStory ? 34 : 26}px system-ui, -apple-system, sans-serif`;
      ctx.fillText(devName, leftMargin + byWidth, devY);
    }

    // === Price ===
    if (priceText) {
      const priceY = infoY + (devName ? (isStory ? 150 : 110) : (isStory ? 90 : 70));
      ctx.fillStyle = "#FFFFFF";
      ctx.font = `900 italic ${isStory ? 80 : 60}px system-ui, -apple-system, sans-serif`;
      ctx.textAlign = "left";
      ctx.fillText(priceText, leftMargin, priceY);
    }

    // === Units badge ===
    const units = parseInt(unitCount) || 1;
    if (units > 1) {
      const priceOffset = priceText ? (isStory ? 100 : 75) : (isStory ? 60 : 45);
      const devOffset = devName ? (isStory ? 150 : 110) : (isStory ? 90 : 70);
      const badgeY = infoY + devOffset + (priceText ? priceOffset : 0);
      const badgeText = `${units} UNITS SOLD`;
      ctx.font = `600 ${isStory ? 28 : 22}px system-ui, -apple-system, sans-serif`;
      const bw = ctx.measureText(badgeText).width + 40;
      const bh = isStory ? 48 : 38;

      ctx.fillStyle = "rgba(200,164,94,0.2)";
      roundRect(ctx, leftMargin, badgeY, bw, bh, 6);
      ctx.fill();
      ctx.strokeStyle = "#c8a45e";
      ctx.lineWidth = 1.5;
      roundRect(ctx, leftMargin, badgeY, bw, bh, 6);
      ctx.stroke();

      ctx.fillStyle = "#c8a45e";
      ctx.textAlign = "left";
      ctx.fillText(badgeText, leftMargin + 20, badgeY + bh * 0.68);
    }

    // === Agent name at bottom left ===
    const agentName = customAgentName || selectedMember?.full_name || "";
    if (agentName) {
      const nameY = h - (isStory ? 160 : 100);
      // Gold line above name
      ctx.strokeStyle = "#c8a45e";
      ctx.lineWidth = 2;
      const nameWidth = (() => {
        ctx.font = `700 ${isStory ? 36 : 28}px system-ui, -apple-system, sans-serif`;
        return ctx.measureText(agentName).width;
      })();
      ctx.beginPath();
      ctx.moveTo(leftMargin, nameY - (isStory ? 20 : 15));
      ctx.lineTo(leftMargin + nameWidth, nameY - (isStory ? 20 : 15));
      ctx.stroke();

      ctx.fillStyle = "#FFFFFF";
      ctx.font = `700 ${isStory ? 36 : 28}px system-ui, -apple-system, sans-serif`;
      ctx.textAlign = "left";
      ctx.fillText(agentName, leftMargin, nameY);

      // Title below
      if (selectedMember?.title) {
        ctx.fillStyle = "#999";
        ctx.font = `400 ${isStory ? 24 : 18}px system-ui, -apple-system, sans-serif`;
        ctx.fillText(selectedMember.title, leftMargin, nameY + (isStory ? 38 : 28));
      }
    }

    // === Agent headshot — large, right side ===
    if (selectedMember?.photo_url) {
      try {
        const img = await loadImage(selectedMember.photo_url);
        // Large headshot on right side
        const headW = isStory ? 520 : 420;
        const headH = isStory ? 700 : 500;
        const headX = w - headW + (isStory ? 30 : 20);
        const headY = h - headH - (isStory ? 40 : 20);

        // Fade mask from left
        ctx.save();
        const fadeGrad = ctx.createLinearGradient(headX, 0, headX + headW * 0.35, 0);
        fadeGrad.addColorStop(0, "rgba(0,0,0,0)");
        fadeGrad.addColorStop(1, "rgba(0,0,0,1)");

        // Draw agent with fade
        const tempCanvas = document.createElement("canvas");
        tempCanvas.width = w;
        tempCanvas.height = h;
        const tempCtx = tempCanvas.getContext("2d")!;

        // Scale and position the headshot
        const imgAspect = img.width / img.height;
        const targetAspect = headW / headH;
        let sx = 0, sy = 0, sW = img.width, sH = img.height;
        if (imgAspect > targetAspect) {
          sW = img.height * targetAspect;
          sx = (img.width - sW) / 2;
        } else {
          sH = img.width / targetAspect;
          sy = 0;
        }
        tempCtx.drawImage(img, sx, sy, sW, sH, headX, headY, headW, headH);

        // Apply fade gradient as mask
        tempCtx.globalCompositeOperation = "destination-in";
        const mask = tempCtx.createLinearGradient(headX, 0, headX + headW * 0.3, 0);
        mask.addColorStop(0, "rgba(0,0,0,0)");
        mask.addColorStop(1, "rgba(0,0,0,1)");
        tempCtx.fillStyle = mask;
        tempCtx.fillRect(headX, headY, headW, headH);

        // Also fade from bottom
        tempCtx.globalCompositeOperation = "destination-in";
        const bottomMask = tempCtx.createLinearGradient(0, headY + headH - 60, 0, headY + headH);
        bottomMask.addColorStop(0, "rgba(0,0,0,1)");
        bottomMask.addColorStop(1, "rgba(0,0,0,0.3)");
        tempCtx.fillStyle = bottomMask;
        tempCtx.fillRect(headX, headY, headW, headH);

        ctx.drawImage(tempCanvas, 0, 0);
        ctx.restore();
      } catch { /* skip */ }
    }

    // === Bottom gold accent line ===
    ctx.fillStyle = "#c8a45e";
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

      {/* Row 1: Project & Agent selectors */}
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

      {/* Row 2: Editable text fields */}
      <div className="rounded-xl border border-border bg-card/50 p-4 space-y-3">
        <div className="flex items-center gap-2 mb-1">
          <Type className="h-3.5 w-3.5 text-primary" />
          <span className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">Customize Text</span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <div>
            <label className="text-[10px] text-muted-foreground mb-1 block">Top Line</label>
            <Input value={headlineTop} onChange={e => setHeadlineTop(e.target.value)} placeholder="Just" className="h-8 text-xs" />
          </div>
          <div>
            <label className="text-[10px] text-muted-foreground mb-1 block">Main Headline</label>
            <Input value={headlineMain} onChange={e => setHeadlineMain(e.target.value)} placeholder="SOLD" className="h-8 text-xs" />
          </div>
          <div>
            <label className="text-[10px] text-muted-foreground mb-1 block">Project Name</label>
            <Input value={customProjectName} onChange={e => setCustomProjectName(e.target.value)} placeholder="Project" className="h-8 text-xs" />
          </div>
          <div>
            <label className="text-[10px] text-muted-foreground mb-1 block">Developer</label>
            <Input value={customDeveloper} onChange={e => setCustomDeveloper(e.target.value)} placeholder="Developer" className="h-8 text-xs" />
          </div>
          <div>
            <label className="text-[10px] text-muted-foreground mb-1 block">Price</label>
            <Input value={priceText} onChange={e => setPriceText(e.target.value)} placeholder="$549,900" className="h-8 text-xs" />
          </div>
          <div>
            <label className="text-[10px] text-muted-foreground mb-1 block">Agent Name</label>
            <Input value={customAgentName} onChange={e => setCustomAgentName(e.target.value)} placeholder="Agent" className="h-8 text-xs" />
          </div>
        </div>
      </div>

      {/* Row 3: Size toggle + Photo picker */}
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
          <span className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground mb-3 block">
            AI Caption Generator
          </span>
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
