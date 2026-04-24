import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  Sparkles, Download, Copy, Loader2, Check, ImageIcon, Type,
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

interface CopyVariation {
  angle: string;
  headline: string;
  subline: string;
  caption: string;
}

export function SocialPostGenerator() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProject, setSelectedProject] = useState<string>("");
  const [loadingProjects, setLoadingProjects] = useState(true);
  const [generatingCopy, setGeneratingCopy] = useState(false);
  const [variations, setVariations] = useState<CopyVariation[]>([]);
  const [selectedImages, setSelectedImages] = useState<Set<string>>(new Set());
  const [step, setStep] = useState<"select" | "results">("select");

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

  const selectedProj = projects.find(p => p.id === selectedProject);
  const allImages = selectedProj
    ? [selectedProj.featured_image, ...(selectedProj.gallery_images || [])].filter(Boolean) as string[]
    : [];

  const toggleImage = (url: string) => {
    setSelectedImages(prev => {
      const next = new Set(prev);
      if (next.has(url)) next.delete(url);
      else next.add(url);
      return next;
    });
  };

  const selectAll = () => {
    if (selectedImages.size === allImages.length) setSelectedImages(new Set());
    else setSelectedImages(new Set(allImages));
  };

  const generateCopy = async () => {
    if (!selectedProject) { toast.error("Select a project first"); return; }
    setGeneratingCopy(true);
    try {
      const { data, error } = await supabase.functions.invoke("generate-social-post", {
        body: { projectId: selectedProject },
      });
      if (error) throw new Error(error.message);
      if (data?.error) throw new Error(data.error);
      setVariations(data.variations || []);
      setStep("results");
      toast.success("Ad copy generated!");
    } catch (e: any) {
      toast.error(e.message || "Generation failed");
    } finally {
      setGeneratingCopy(false);
    }
  };

  const copyText = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard!");
  };

  const downloadImage = async (url: string, index: number) => {
    try {
      const resp = await fetch(url);
      const blob = await resp.blob();
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      const projName = selectedProj?.name?.replace(/\s+/g, "-").toLowerCase() || "project";
      a.download = `${projName}-${index + 1}.jpg`;
      a.click();
      URL.revokeObjectURL(a.href);
    } catch {
      window.open(url, "_blank");
    }
  };

  const downloadSelected = async () => {
    const urls = Array.from(selectedImages);
    for (let i = 0; i < urls.length; i++) {
      await downloadImage(urls[i], i);
      if (i < urls.length - 1) await new Promise(r => setTimeout(r, 500));
    }
    toast.success(`Downloaded ${urls.length} image${urls.length > 1 ? "s" : ""}`);
  };

  return (
    <div className="space-y-6">
      {/* Project selector */}
      <div>
        <label className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground mb-1.5 block">
          Select Project
        </label>
        {loadingProjects ? (
          <div className="h-10 bg-muted/30 animate-pulse rounded-lg" />
        ) : (
          <select
            value={selectedProject}
            onChange={e => {
              setSelectedProject(e.target.value);
              setVariations([]);
              setSelectedImages(new Set());
              setStep("select");
            }}
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

      {/* Project preview */}
      {selectedProj && (
        <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/30 border border-border">
          {allImages[0] && (
            <img src={allImages[0]} alt={selectedProj.name} className="h-14 w-20 object-cover rounded-md" />
          )}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold">{selectedProj.name}</p>
            <p className="text-xs text-muted-foreground">
              {selectedProj.neighborhood}, {selectedProj.city}
              {selectedProj.price_range && ` · ${selectedProj.price_range}`}
              {!selectedProj.price_range && selectedProj.starting_price && ` · From $${selectedProj.starting_price.toLocaleString()}`}
              {` · ${allImages.length} images`}
            </p>
          </div>
          <Button onClick={generateCopy} disabled={generatingCopy} size="sm" className="gap-1.5 shrink-0">
            {generatingCopy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
            {generatingCopy ? "Generating…" : "Generate Ad Copy"}
          </Button>
        </div>
      )}

      {/* Two columns: Images + Copy */}
      {selectedProj && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Images panel */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <ImageIcon className="h-4 w-4 text-muted-foreground" />
                <span className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
                  Project Images
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={selectAll} className="text-[11px] text-primary hover:underline font-medium">
                  {selectedImages.size === allImages.length ? "Deselect all" : "Select all"}
                </button>
                {selectedImages.size > 0 && (
                  <Button onClick={downloadSelected} size="sm" variant="outline" className="gap-1.5 text-xs h-7">
                    <Download className="h-3 w-3" />
                    Download {selectedImages.size}
                  </Button>
                )}
              </div>
            </div>

            {allImages.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 border-2 border-dashed border-border rounded-xl text-center">
                <ImageIcon className="h-8 w-8 text-muted-foreground/20 mb-2" />
                <p className="text-sm text-muted-foreground">No images for this project</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-[500px] overflow-y-auto pr-1">
                {allImages.map((url, i) => {
                  const isSelected = selectedImages.has(url);
                  return (
                    <div
                      key={i}
                      onClick={() => toggleImage(url)}
                      className={cn(
                        "relative group cursor-pointer rounded-lg overflow-hidden border-2 transition-all aspect-[4/3]",
                        isSelected ? "border-primary ring-2 ring-primary/20" : "border-transparent hover:border-primary/30"
                      )}
                    >
                      <img src={url} alt={`Image ${i + 1}`} className="w-full h-full object-cover" loading="lazy" />
                      {/* Selection overlay */}
                      <div className={cn(
                        "absolute inset-0 transition-all flex items-center justify-center",
                        isSelected ? "bg-primary/10" : "bg-neutral-900/0 group-hover:bg-neutral-900/10"
                      )}>
                        <div className={cn(
                          "h-6 w-6 rounded-full border-2 flex items-center justify-center transition-all",
                          isSelected
                            ? "bg-primary border-primary text-primary-foreground"
                            : "border-card/70 bg-neutral-900/20 opacity-0 group-hover:opacity-100"
                        )}>
                          {isSelected && <Check className="h-3.5 w-3.5" />}
                        </div>
                      </div>
                      {/* Individual download */}
                      <button
                        onClick={e => { e.stopPropagation(); downloadImage(url, i); }}
                        className="absolute top-1.5 right-1.5 h-6 w-6 rounded-md bg-neutral-900/50 flex items-center justify-center text-on-dark opacity-0 group-hover:opacity-100 transition-opacity hover:bg-neutral-900/70"
                      >
                        <Download className="h-3 w-3" />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Copy panel */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Type className="h-4 w-4 text-muted-foreground" />
              <span className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
                Ad Copy
              </span>
              {variations.length > 0 && (
                <Badge variant="secondary" className="text-[9px] h-4 px-1.5">{variations.length} variations</Badge>
              )}
            </div>

            {variations.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 border-2 border-dashed border-border rounded-xl text-center">
                <Type className="h-8 w-8 text-muted-foreground/20 mb-2" />
                <p className="text-sm text-muted-foreground mb-1">No copy generated yet</p>
                <p className="text-xs text-muted-foreground/60 mb-3">Click "Generate Ad Copy" above</p>
              </div>
            ) : (
              <div className="space-y-4 max-h-[500px] overflow-y-auto pr-1">
                {variations.map((v, i) => (
                  <div key={i} className="rounded-xl border border-border bg-card overflow-hidden">
                    {/* Header with angle */}
                    <div className="px-4 py-2.5 bg-muted/30 border-b border-border flex items-center justify-between">
                      <Badge variant="outline" className="text-[10px] font-semibold">{v.angle}</Badge>
                      <span className="text-[10px] text-muted-foreground">Variation {i + 1}</span>
                    </div>

                    <div className="p-4 space-y-3">
                      {/* Headline preview — styled like the reference ads */}
                      <div className="rounded-lg bg-gradient-to-r from-warning/90 to-warning/90 p-4 text-on-dark">
                        <p className="text-xl font-extrabold leading-tight">{v.headline}</p>
                        <p className="text-sm font-medium mt-1 opacity-90">{v.subline}</p>
                      </div>

                      {/* Copyable headline/subline */}
                      <div className="flex gap-2">
                        <Button
                          variant="outline" size="sm"
                          className="gap-1 text-xs h-7 flex-1"
                          onClick={() => copyText(v.headline)}
                        >
                          <Copy className="h-3 w-3" /> Headline
                        </Button>
                        <Button
                          variant="outline" size="sm"
                          className="gap-1 text-xs h-7 flex-1"
                          onClick={() => copyText(v.subline)}
                        >
                          <Copy className="h-3 w-3" /> Subline
                        </Button>
                      </div>

                      {/* Caption */}
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-[10px] font-semibold text-muted-foreground uppercase">Caption</span>
                          <Button variant="ghost" size="sm" onClick={() => copyText(v.caption)} className="gap-1 text-xs h-6">
                            <Copy className="h-3 w-3" /> Copy
                          </Button>
                        </div>
                        <Textarea
                          value={v.caption}
                          readOnly
                          rows={5}
                          className="text-xs resize-none bg-muted/20 leading-relaxed"
                        />
                      </div>
                    </div>
                  </div>
                ))}

                {/* Regenerate */}
                <Button
                  onClick={generateCopy}
                  disabled={generatingCopy}
                  variant="outline"
                  className="w-full gap-1.5"
                  size="sm"
                >
                  {generatingCopy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
                  Regenerate Copy
                </Button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
