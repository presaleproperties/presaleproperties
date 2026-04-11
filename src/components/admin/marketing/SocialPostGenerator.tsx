import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  Image, Smartphone, Monitor, Sparkles, Download, Copy, RefreshCw, Loader2,
} from "lucide-react";

interface Project {
  id: string;
  name: string;
  city: string;
  neighborhood: string;
  starting_price: number | null;
  price_range: string | null;
  featured_image: string | null;
  gallery_images: string[] | null;
}

interface GeneratedPost {
  imageUrl: string;
  copy: { caption: string; headline: string; cta: string };
  format: string;
}

export function SocialPostGenerator() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProject, setSelectedProject] = useState<string>("");
  const [format, setFormat] = useState<"post" | "story">("post");
  const [loading, setLoading] = useState(false);
  const [loadingProjects, setLoadingProjects] = useState(true);
  const [result, setResult] = useState<GeneratedPost | null>(null);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("presale_projects")
        .select("id, name, city, neighborhood, starting_price, price_range, featured_image, gallery_images")
        .eq("is_published", true)
        .order("name");
      setProjects((data as Project[]) || []);
      setLoadingProjects(false);
    })();
  }, []);

  const generate = async () => {
    if (!selectedProject) {
      toast.error("Select a project first");
      return;
    }
    setLoading(true);
    setResult(null);
    try {
      const { data, error } = await supabase.functions.invoke("generate-social-post", {
        body: { projectId: selectedProject, format },
      });
      if (error) throw new Error(error.message);
      if (data?.error) throw new Error(data.error);
      setResult(data);
      toast.success("Social post generated!");
    } catch (e: any) {
      toast.error(e.message || "Generation failed");
    } finally {
      setLoading(false);
    }
  };

  const copyCaption = () => {
    if (!result?.copy?.caption) return;
    navigator.clipboard.writeText(result.copy.caption);
    toast.success("Caption copied!");
  };

  const downloadImage = () => {
    if (!result?.imageUrl) return;
    const a = document.createElement("a");
    a.href = result.imageUrl;
    a.download = `social-${format}-${Date.now()}.png`;
    a.target = "_blank";
    a.click();
  };

  const selectedProj = projects.find(p => p.id === selectedProject);

  return (
    <div className="space-y-6">
      {/* Project selector */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground mb-1.5 block">
            Select Project
          </label>
          {loadingProjects ? (
            <div className="h-10 bg-muted/30 animate-pulse rounded-lg" />
          ) : (
            <select
              value={selectedProject}
              onChange={e => { setSelectedProject(e.target.value); setResult(null); }}
              className="w-full h-10 rounded-lg border border-border bg-card px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="">Choose a project…</option>
              {projects.map(p => (
                <option key={p.id} value={p.id}>
                  {p.name} — {p.city}
                </option>
              ))}
            </select>
          )}
        </div>

        <div>
          <label className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground mb-1.5 block">
            Format
          </label>
          <div className="flex gap-2">
            {([
              { key: "post" as const, label: "Post", icon: Monitor, desc: "1200×630" },
              { key: "story" as const, label: "Story", icon: Smartphone, desc: "1080×1920" },
            ]).map(f => (
              <button
                key={f.key}
                onClick={() => { setFormat(f.key); setResult(null); }}
                className={cn(
                  "flex-1 flex items-center gap-2 p-3 rounded-lg border transition-all text-left",
                  format === f.key
                    ? "border-primary bg-primary/5 ring-1 ring-primary/20"
                    : "border-border bg-card hover:border-primary/30"
                )}
              >
                <f.icon className={cn("h-4 w-4", format === f.key ? "text-primary" : "text-muted-foreground")} />
                <div>
                  <span className="text-sm font-medium">{f.label}</span>
                  <span className="text-[10px] text-muted-foreground ml-1.5">{f.desc}</span>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Preview of selected project */}
      {selectedProj && (
        <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/30 border border-border">
          {(selectedProj.featured_image || selectedProj.gallery_images?.[0]) && (
            <img
              src={selectedProj.featured_image || selectedProj.gallery_images![0]}
              alt={selectedProj.name}
              className="h-14 w-20 object-cover rounded-md"
            />
          )}
          <div>
            <p className="text-sm font-semibold">{selectedProj.name}</p>
            <p className="text-xs text-muted-foreground">
              {selectedProj.neighborhood}, {selectedProj.city}
              {selectedProj.price_range && ` · ${selectedProj.price_range}`}
              {!selectedProj.price_range && selectedProj.starting_price && ` · From $${selectedProj.starting_price.toLocaleString()}`}
            </p>
          </div>
        </div>
      )}

      {/* Generate button */}
      <Button
        onClick={generate}
        disabled={!selectedProject || loading}
        className="w-full gap-2"
        size="lg"
      >
        {loading ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Generating… (15-30s)
          </>
        ) : (
          <>
            <Sparkles className="h-4 w-4" />
            Generate {format === "story" ? "Story" : "Post"} Graphic
          </>
        )}
      </Button>

      {/* Result */}
      {result && (
        <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
          <div className="flex items-center justify-between">
            <Badge variant="secondary" className="text-[10px]">
              <Image className="h-3 w-3 mr-1" />
              Generated {format === "story" ? "Story" : "Post"}
            </Badge>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={downloadImage} className="gap-1.5 text-xs">
                <Download className="h-3.5 w-3.5" /> Download
              </Button>
              <Button variant="outline" size="sm" onClick={generate} disabled={loading} className="gap-1.5 text-xs">
                <RefreshCw className={cn("h-3.5 w-3.5", loading && "animate-spin")} /> Regenerate
              </Button>
            </div>
          </div>

          {/* Generated image */}
          <div className={cn(
            "rounded-xl border border-border overflow-hidden bg-black flex items-center justify-center",
            format === "story" ? "max-w-[320px] mx-auto" : "w-full"
          )}>
            <img
              src={result.imageUrl}
              alt="Generated social post"
              className="w-full h-auto"
            />
          </div>

          {/* Caption */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
                Caption
              </label>
              <Button variant="ghost" size="sm" onClick={copyCaption} className="gap-1.5 text-xs h-7">
                <Copy className="h-3 w-3" /> Copy
              </Button>
            </div>
            <Textarea
              value={result.copy.caption}
              readOnly
              rows={6}
              className="text-sm resize-none bg-muted/20"
            />
          </div>
        </div>
      )}
    </div>
  );
}
