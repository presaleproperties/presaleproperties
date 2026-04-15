import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  Sparkles, Copy, Loader2, RectangleVertical, Square, User, Hash, Building2, Download, MapPin,
} from "lucide-react";

interface Project {
  id: string;
  name: string;
  city: string;
  neighborhood: string;
  featured_image: string | null;
  address?: string | null;
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
  const [userInput, setUserInput] = useState("");
  const [postSize, setPostSize] = useState<PostSize>("post");
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [captions, setCaptions] = useState<CaptionVariation[]>([]);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([
      supabase
        .from("presale_projects")
        .select("id, name, city, neighborhood, featured_image")
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
    if (!selectedProj) { setPreviewUrl(null); return; }
    renderPreview();
  }, [selectedProject, selectedAgent, unitCount, unitNumber, postSize]);

  const renderPreview = async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const isStory = postSize === "story";
    const w = 1080;
    const h = isStory ? 1920 : 1080;
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d")!;

    // Solid dark background fallback
    ctx.fillStyle = "#0a0a0a";
    ctx.fillRect(0, 0, w, h);

    // Load project image — fill the entire canvas
    if (selectedProj?.featured_image) {
      try {
        const img = await loadImage(selectedProj.featured_image);
        const scale = Math.max(w / img.width, h / img.height);
        const sw = img.width * scale;
        const sh = img.height * scale;
        ctx.drawImage(img, (w - sw) / 2, (h - sh) / 2, sw, sh);
      } catch { /* solid bg fallback */ }
    }

    // Subtle dark vignette overlay for text readability
    const vignetteTop = ctx.createLinearGradient(0, 0, 0, h * 0.18);
    vignetteTop.addColorStop(0, "rgba(0,0,0,0.65)");
    vignetteTop.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = vignetteTop;
    ctx.fillRect(0, 0, w, h * 0.18);

    // Bottom area overlay for bars
    const bottomBarHeight = isStory ? 320 : 220;
    const vignetteBot = ctx.createLinearGradient(0, h - bottomBarHeight - 80, 0, h - bottomBarHeight);
    vignetteBot.addColorStop(0, "rgba(0,0,0,0)");
    vignetteBot.addColorStop(1, "rgba(0,0,0,0.9)");
    ctx.fillStyle = vignetteBot;
    ctx.fillRect(0, h - bottomBarHeight - 80, w, 80);

    // === TOP BAR: Project name + unit/address ===
    const topBarH = isStory ? 80 : 65;
    ctx.fillStyle = "rgba(0,0,0,0.55)";
    ctx.fillRect(0, 0, w, topBarH);

    ctx.fillStyle = "#FFFFFF";
    ctx.font = `500 ${isStory ? 30 : 26}px system-ui, -apple-system, sans-serif`;
    ctx.textAlign = "center";
    const topText = [
      selectedProj?.name?.toUpperCase() || "",
      unitNumber ? `#${unitNumber}` : "",
      selectedProj?.neighborhood ? `${selectedProj.neighborhood}, ${selectedProj.city}` : selectedProj?.city || "",
    ].filter(Boolean).join("   |   ");
    ctx.fillText(topText, w / 2, topBarH * 0.65);

    // === CENTER: Large "SOLD" text ===
    const soldY = isStory ? h * 0.32 : h * 0.42;
    ctx.save();
    ctx.shadowColor = "rgba(0,0,0,0.5)";
    ctx.shadowBlur = 40;
    ctx.shadowOffsetY = 8;
    ctx.fillStyle = "#FFFFFF";
    ctx.font = `bold italic ${isStory ? 260 : 220}px "Georgia", "Times New Roman", serif`;
    ctx.textAlign = "center";
    ctx.fillText("SOLD", w / 2, soldY);
    ctx.restore();

    // Units badge below SOLD (if more than 1)
    const units = parseInt(unitCount) || 1;
    if (units > 1) {
      const badgeY = soldY + (isStory ? 60 : 40);
      const badgeText = `${units} UNITS`;
      ctx.font = `600 ${isStory ? 32 : 26}px system-ui, -apple-system, sans-serif`;
      const metrics = ctx.measureText(badgeText);
      const bw = metrics.width + 50;
      const bh = isStory ? 52 : 42;

      ctx.fillStyle = "rgba(200, 164, 94, 0.85)";
      roundRect(ctx, w / 2 - bw / 2, badgeY - bh / 2, bw, bh, 6);
      ctx.fill();

      ctx.fillStyle = "#FFFFFF";
      ctx.textAlign = "center";
      ctx.fillText(badgeText, w / 2, badgeY + (isStory ? 11 : 9));
    }

    // === BOTTOM: Branding bar ===
    const brandBarH = isStory ? 130 : 100;
    const agentBarH = isStory ? 90 : 70;
    const totalBottom = brandBarH + agentBarH;
    
    // Brand bar (dark)
    ctx.fillStyle = "#111111";
    ctx.fillRect(0, h - totalBottom, w, brandBarH);

    // "Presale Properties" branding text (left side)
    ctx.fillStyle = "#FFFFFF";
    ctx.font = `600 ${isStory ? 36 : 30}px system-ui, -apple-system, sans-serif`;
    ctx.textAlign = "left";
    ctx.fillText("PRESALE PROPERTIES", 50, h - totalBottom + brandBarH * 0.58);

    // "Real Broker" text (right side)
    ctx.fillStyle = "#FFFFFF";
    ctx.font = `500 ${isStory ? 28 : 22}px system-ui, -apple-system, sans-serif`;
    ctx.textAlign = "right";

    // Draw a subtle border box for "real" branding
    const realText = "real";
    const realW = isStory ? 110 : 85;
    const realH = isStory ? 46 : 36;
    const realX = w - 50 - realW;
    const realY = h - totalBottom + (brandBarH - realH) / 2;
    ctx.strokeStyle = "#FFFFFF";
    ctx.lineWidth = 2;
    ctx.strokeRect(realX, realY, realW, realH);
    ctx.font = `400 ${isStory ? 28 : 22}px system-ui, -apple-system, sans-serif`;
    ctx.textAlign = "center";
    ctx.fillText(realText, realX + realW / 2, realY + realH * 0.72);

    // === BOTTOM: Agent bar ===
    const agentBarY = h - agentBarH;
    // Gold/dark gradient bar
    ctx.fillStyle = "#1a1a1a";
    ctx.fillRect(0, agentBarY, w, agentBarH);

    // Thin gold accent line
    ctx.fillStyle = "#c8a45e";
    ctx.fillRect(0, agentBarY, w, 2);

    if (selectedMember) {
      const headSize = isStory ? 60 : 48;
      const headX = 50 + headSize / 2;
      const headY = agentBarY + agentBarH / 2;

      // Agent headshot circle
      if (selectedMember.photo_url) {
        try {
          const img = await loadImage(selectedMember.photo_url);
          ctx.save();
          ctx.beginPath();
          ctx.arc(headX, headY, headSize / 2, 0, Math.PI * 2);
          ctx.closePath();
          ctx.clip();
          ctx.drawImage(img, headX - headSize / 2, headY - headSize / 2, headSize, headSize);
          ctx.restore();

          // Gold border
          ctx.strokeStyle = "#c8a45e";
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.arc(headX, headY, headSize / 2 + 1, 0, Math.PI * 2);
          ctx.stroke();
        } catch { /* skip */ }
      } else {
        // Placeholder circle
        ctx.fillStyle = "#333";
        ctx.beginPath();
        ctx.arc(headX, headY, headSize / 2, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "#999";
        ctx.font = `${isStory ? 24 : 18}px system-ui`;
        ctx.textAlign = "center";
        ctx.fillText("👤", headX, headY + 6);
      }

      // Agent info text
      const textX = headX + headSize / 2 + 25;
      const agentParts = [
        selectedMember.full_name.toUpperCase(),
        selectedMember.title.toUpperCase(),
        selectedMember.phone || "",
      ].filter(Boolean);

      ctx.fillStyle = "#FFFFFF";
      ctx.font = `500 ${isStory ? 24 : 19}px system-ui, -apple-system, sans-serif`;
      ctx.textAlign = "left";
      ctx.fillText(agentParts.join("   |   "), textX, headY + (isStory ? 8 : 6));
    }

    // Presale Properties icon/watermark bottom right of agent bar
    ctx.fillStyle = "rgba(200,164,94,0.6)";
    ctx.font = `${isStory ? 22 : 18}px system-ui`;
    ctx.textAlign = "right";
    ctx.fillText("✦", w - 30, agentBarY + agentBarH * 0.65);

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
          projectName: selectedProj?.name || "",
          agentName: selectedMember?.full_name || "",
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
    const name = selectedProj?.name?.replace(/\s+/g, "-").toLowerCase() || "sold";
    a.download = `${name}-sold-${postSize}.png`;
    a.click();
    toast.success("Image downloaded!");
  };

  return (
    <div className="space-y-6">
      <canvas ref={canvasRef} className="hidden" />

      {/* Controls */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Project selector */}
        <div>
          <label className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground mb-1.5 block">
            <Building2 className="h-3 w-3 inline mr-1" />Project
          </label>
          {loading ? (
            <div className="h-10 bg-muted/30 animate-pulse rounded-lg" />
          ) : (
            <select
              value={selectedProject}
              onChange={e => { setSelectedProject(e.target.value); setCaptions([]); }}
              className="w-full h-10 rounded-lg border border-border bg-card px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="">Choose a project…</option>
              {projects.map(p => (
                <option key={p.id} value={p.id}>{p.name} — {p.city}</option>
              ))}
            </select>
          )}
        </div>

        {/* Agent selector */}
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

        {/* Unit number */}
        <div>
          <label className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground mb-1.5 block">
            <MapPin className="h-3 w-3 inline mr-1" />Unit # (optional)
          </label>
          <Input
            type="text"
            placeholder="e.g. 906"
            value={unitNumber}
            onChange={e => setUnitNumber(e.target.value)}
            className="h-10"
          />
        </div>

        {/* Units sold */}
        <div>
          <label className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground mb-1.5 block">
            <Hash className="h-3 w-3 inline mr-1" />Units Sold
          </label>
          <Input
            type="number"
            min={1}
            max={100}
            value={unitCount}
            onChange={e => setUnitCount(e.target.value)}
            className="h-10"
          />
        </div>

        {/* Size toggle */}
        <div className="sm:col-span-2 lg:col-span-2">
          <label className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground mb-1.5 block">
            Post Size
          </label>
          <div className="flex gap-2">
            <Button
              variant={postSize === "post" ? "default" : "outline"}
              size="sm"
              className="flex-1 gap-1.5"
              onClick={() => setPostSize("post")}
            >
              <Square className="h-3.5 w-3.5" />
              Post (1:1)
            </Button>
            <Button
              variant={postSize === "story" ? "default" : "outline"}
              size="sm"
              className="flex-1 gap-1.5"
              onClick={() => setPostSize("story")}
            >
              <RectangleVertical className="h-3.5 w-3.5" />
              Story (9:16)
            </Button>
          </div>
        </div>
      </div>

      {/* Preview + Caption side by side */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Graphic preview */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <span className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
              Preview
            </span>
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

        {/* Caption generator */}
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
            <Button
              onClick={generateCaption}
              disabled={generating || !userInput.trim()}
              className="w-full gap-1.5"
              size="sm"
            >
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
                      <Textarea
                        value={c.caption}
                        readOnly
                        rows={6}
                        className="text-xs resize-none bg-muted/20 leading-relaxed"
                      />
                    </div>
                  </div>
                ))}
                <Button
                  onClick={generateCaption}
                  disabled={generating}
                  variant="outline"
                  className="w-full gap-1.5"
                  size="sm"
                >
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
