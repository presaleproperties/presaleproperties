import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  Sparkles, Copy, Loader2, RectangleVertical, Square, User, Hash, Building2, Download,
} from "lucide-react";

interface Project {
  id: string;
  name: string;
  city: string;
  neighborhood: string;
  featured_image: string | null;
}

interface TeamMember {
  id: string;
  full_name: string;
  title: string;
  photo_url: string | null;
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
      supabase.rpc("get_public_team_members"),
    ]).then(([projRes, teamRes]) => {
      setProjects((projRes.data as Project[]) || []);
      setTeamMembers((teamRes.data as TeamMember[]) || []);
      setLoading(false);
    });
  }, []);

  const selectedProj = projects.find(p => p.id === selectedProject);
  const selectedMember = teamMembers.find(t => t.id === selectedAgent);

  // Generate canvas preview
  useEffect(() => {
    if (!selectedProj) { setPreviewUrl(null); return; }
    renderPreview();
  }, [selectedProject, selectedAgent, unitCount, postSize]);

  const renderPreview = async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const isStory = postSize === "story";
    const w = isStory ? 1080 : 1080;
    const h = isStory ? 1920 : 1080;
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d")!;

    // Background
    ctx.fillStyle = "#111827";
    ctx.fillRect(0, 0, w, h);

    // Load project image as background
    if (selectedProj?.featured_image) {
      try {
        const img = await loadImage(selectedProj.featured_image);
        const scale = Math.max(w / img.width, h / img.height);
        const sw = img.width * scale;
        const sh = img.height * scale;
        ctx.globalAlpha = 0.35;
        ctx.drawImage(img, (w - sw) / 2, (h - sh) / 2, sw, sh);
        ctx.globalAlpha = 1;
      } catch { /* fallback solid bg */ }
    }

    // Dark gradient overlay from bottom
    const grad = ctx.createLinearGradient(0, h * 0.3, 0, h);
    grad.addColorStop(0, "rgba(17,24,39,0.3)");
    grad.addColorStop(0.5, "rgba(17,24,39,0.85)");
    grad.addColorStop(1, "rgba(17,24,39,0.98)");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);

    // "SOLD" banner
    const bannerY = isStory ? 320 : 180;
    ctx.fillStyle = "#c8a45e";
    const bannerH = isStory ? 140 : 120;
    ctx.fillRect(0, bannerY, w, bannerH);

    ctx.fillStyle = "#FFFFFF";
    ctx.font = `bold ${isStory ? 90 : 80}px system-ui, -apple-system, sans-serif`;
    ctx.textAlign = "center";
    ctx.fillText("JUST SOLD", w / 2, bannerY + bannerH * 0.72);

    // Project name
    const nameY = bannerY + bannerH + (isStory ? 100 : 80);
    ctx.fillStyle = "#FFFFFF";
    ctx.font = `bold ${isStory ? 56 : 48}px system-ui, -apple-system, sans-serif`;
    ctx.textAlign = "center";
    const projName = selectedProj?.name || "Project Name";
    ctx.fillText(projName, w / 2, nameY);

    // Location
    ctx.fillStyle = "#9CA3AF";
    ctx.font = `${isStory ? 36 : 30}px system-ui, -apple-system, sans-serif`;
    ctx.fillText(
      `${selectedProj?.neighborhood || ""}, ${selectedProj?.city || ""}`,
      w / 2, nameY + (isStory ? 55 : 45)
    );

    // Unit count badge
    const units = parseInt(unitCount) || 1;
    if (units > 0) {
      const badgeY = nameY + (isStory ? 120 : 100);
      const badgeText = units === 1 ? "1 Unit Sold" : `${units} Units Sold`;
      ctx.font = `bold ${isStory ? 34 : 28}px system-ui, -apple-system, sans-serif`;
      const metrics = ctx.measureText(badgeText);
      const badgeW = metrics.width + 60;
      const badgeH = isStory ? 60 : 50;

      ctx.fillStyle = "rgba(200, 164, 94, 0.2)";
      roundRect(ctx, w / 2 - badgeW / 2, badgeY - badgeH / 2, badgeW, badgeH, 12);
      ctx.fill();

      ctx.strokeStyle = "#c8a45e";
      ctx.lineWidth = 2;
      roundRect(ctx, w / 2 - badgeW / 2, badgeY - badgeH / 2, badgeW, badgeH, 12);
      ctx.stroke();

      ctx.fillStyle = "#c8a45e";
      ctx.fillText(badgeText, w / 2, badgeY + (isStory ? 12 : 10));
    }

    // Agent headshot + name at bottom
    if (selectedMember) {
      const bottomY = h - (isStory ? 200 : 140);
      const headshotSize = isStory ? 100 : 80;

      if (selectedMember.photo_url) {
        try {
          const img = await loadImage(selectedMember.photo_url);
          ctx.save();
          ctx.beginPath();
          ctx.arc(w / 2, bottomY, headshotSize / 2, 0, Math.PI * 2);
          ctx.closePath();
          ctx.clip();
          ctx.drawImage(img, w / 2 - headshotSize / 2, bottomY - headshotSize / 2, headshotSize, headshotSize);
          ctx.restore();

          // Border
          ctx.strokeStyle = "#c8a45e";
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.arc(w / 2, bottomY, headshotSize / 2 + 2, 0, Math.PI * 2);
          ctx.stroke();
        } catch { /* skip headshot */ }
      }

      ctx.fillStyle = "#FFFFFF";
      ctx.font = `bold ${isStory ? 30 : 24}px system-ui, -apple-system, sans-serif`;
      ctx.textAlign = "center";
      ctx.fillText(selectedMember.full_name, w / 2, bottomY + headshotSize / 2 + (isStory ? 40 : 32));

      ctx.fillStyle = "#9CA3AF";
      ctx.font = `${isStory ? 22 : 18}px system-ui, -apple-system, sans-serif`;
      ctx.fillText(selectedMember.title, w / 2, bottomY + headshotSize / 2 + (isStory ? 70 : 56));
    }

    // Branding
    ctx.fillStyle = "rgba(255,255,255,0.4)";
    ctx.font = `${isStory ? 20 : 16}px system-ui, -apple-system, sans-serif`;
    ctx.textAlign = "center";
    ctx.fillText("presaleproperties.com", w / 2, h - (isStory ? 60 : 40));

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
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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

        {/* Units */}
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
        <div>
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
              "rounded-xl overflow-hidden border border-border bg-muted/20",
              postSize === "story" ? "max-w-[280px]" : "max-w-[400px]"
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
