import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  Copy, Download, Trash2, Upload, Search, Loader2,
  Image, FolderOpen, Grid3X3, List, ExternalLink, FileImage,
} from "lucide-react";
import { cn } from "@/lib/utils";
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


interface AssetItem {
  name: string;
  bucket: string;
  url: string;
  size: number;
  type: string;
  created_at: string;
}

const BUCKETS = [
  { id: "branding", label: "Branding", icon: "🎨" },
  { id: "avatars", label: "Team Photos", icon: "👤" },
  { id: "email-assets", label: "Email Assets", icon: "✉️" },
  { id: "blog-images", label: "Blog Images", icon: "📝" },
  { id: "social-posts", label: "Social Posts", icon: "📱" },
  { id: "listing-photos", label: "Listing Photos", icon: "🏠" },
];

function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
}

export function BrandAssetLibrary() {
  const [activeBucket, setActiveBucket] = useState("branding");
  const [assets, setAssets] = useState<AssetItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [uploading, setUploading] = useState(false);
  const [previewAsset, setPreviewAsset] = useState<AssetItem | null>(null);

  const loadAssets = useCallback(async (bucket: string) => {
    setLoading(true);
    const { data, error } = await supabase.storage.from(bucket).list("", {
      limit: 200,
      sortBy: { column: "created_at", order: "desc" },
    });

    if (error) {
      toast.error("Failed to load assets");
      setLoading(false);
      return;
    }

    const items: AssetItem[] = (data || [])
      .filter((f: StorageFile) => f.name && !f.name.startsWith("."))
      .map((f: StorageFile) => {
        const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(f.name);
        return {
          name: f.name,
          bucket,
          url: urlData.publicUrl,
          size: f.metadata?.size || 0,
          type: f.metadata?.mimetype || "unknown",
          created_at: f.created_at,
        };
      });

    setAssets(items);
    setLoading(false);
  }, []);

  useEffect(() => {
    loadAssets(activeBucket);
  }, [activeBucket, loadAssets]);

  const handleBucketChange = (bucket: string) => {
    setActiveBucket(bucket);
    setSearchQuery("");
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files?.length) return;

    setUploading(true);
    let uploaded = 0;

    for (const file of Array.from(files)) {
      const fileName = `${Date.now()}-${file.name.replace(/\s+/g, "-")}`;
      const { error } = await supabase.storage.from(activeBucket).upload(fileName, file, {
        cacheControl: "3600",
        upsert: false,
      });
      if (!error) uploaded++;
    }

    if (uploaded > 0) {
      toast.success(`Uploaded ${uploaded} file${uploaded > 1 ? "s" : ""}`);
      loadAssets(activeBucket);
    } else {
      toast.error("Upload failed");
    }

    setUploading(false);
    e.target.value = "";
  };

  const handleCopyUrl = async (url: string) => {
    try {
      await navigator.clipboard.writeText(url);
      toast.success("URL copied to clipboard");
    } catch {
      toast.error("Failed to copy");
    }
  };

  const handleDelete = async (asset: AssetItem) => {
    const { error } = await supabase.storage.from(asset.bucket).remove([asset.name]);
    if (error) {
      toast.error("Failed to delete");
    } else {
      toast.success("Asset deleted");
      setAssets(prev => prev.filter(a => a.name !== asset.name));
      if (previewAsset?.name === asset.name) setPreviewAsset(null);
    }
  };

  const filteredAssets = assets.filter(a =>
    a.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const currentBucket = BUCKETS.find(b => b.id === activeBucket);
  const isImage = (type: string) => type.startsWith("image/");

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">Brand Assets</p>
          <p className="text-xs text-muted-foreground/60 mt-0.5">Logos, headshots, project photos & brand assets</p>
        </div>
        <div className="flex items-center gap-2">
          <label className="cursor-pointer">
            <input type="file" multiple accept="image/*,.pdf,.svg" className="hidden" onChange={handleUpload} />
            <Button size="sm" variant="default" className="gap-1.5 text-xs" asChild disabled={uploading}>
              <span>
                {uploading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Upload className="h-3.5 w-3.5" />}
                Upload
              </span>
            </Button>
          </label>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[220px_1fr] gap-5">
        {/* Sidebar: Bucket folders */}
        <div className="space-y-1">
          {BUCKETS.map(b => (
            <button
              key={b.id}
              onClick={() => handleBucketChange(b.id)}
              className={cn(
                "w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-all text-left",
                activeBucket === b.id
                  ? "bg-primary/10 text-primary border border-primary/20"
                  : "text-muted-foreground hover:bg-muted/60 border border-transparent"
              )}
            >
              <span className="text-sm">{b.icon}</span>
              <span>{b.label}</span>
            </button>
          ))}
        </div>

        {/* Main content */}
        <div className="space-y-4">
          {/* Search & view toggle */}
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                placeholder={`Search ${currentBucket?.label || "assets"}...`}
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="pl-9 h-8 text-xs"
              />
            </div>
            <div className="flex items-center border border-border rounded-lg overflow-hidden h-8">
              <button
                onClick={() => setViewMode("grid")}
                className={cn("px-2.5 h-full flex items-center transition-colors", viewMode === "grid" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted")}
              >
                <Grid3X3 className="h-3.5 w-3.5" />
              </button>
              <button
                onClick={() => setViewMode("list")}
                className={cn("px-2.5 h-full flex items-center transition-colors", viewMode === "list" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted")}
              >
                <List className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>

          {/* Assets */}
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : filteredAssets.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <FolderOpen className="h-10 w-10 text-muted-foreground/30 mb-3" />
              <p className="text-sm font-medium text-muted-foreground">No assets found</p>
              <p className="text-xs text-muted-foreground/50 mt-1">Upload files or try a different folder</p>
            </div>
          ) : viewMode === "grid" ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {filteredAssets.map(asset => (
                <div
                  key={asset.name}
                  className="group rounded-xl border border-border bg-card overflow-hidden hover:border-primary/30 hover:shadow-md transition-all cursor-pointer"
                  onClick={() => setPreviewAsset(asset)}
                >
                  <div className="aspect-square bg-muted/30 flex items-center justify-center overflow-hidden">
                    {isImage(asset.type) ? (
                      <img src={asset.url} alt={asset.name} className="w-full h-full object-cover" loading="lazy" />
                    ) : (
                      <FileImage className="h-10 w-10 text-muted-foreground/30" />
                    )}
                  </div>
                  <div className="p-2.5">
                    <p className="text-[11px] font-medium truncate">{asset.name}</p>
                    <p className="text-[10px] text-muted-foreground/60 mt-0.5">{formatBytes(asset.size)}</p>
                  </div>
                  <div className="px-2.5 pb-2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button size="sm" variant="ghost" className="h-6 w-6 p-0" onClick={e => { e.stopPropagation(); handleCopyUrl(asset.url); }}>
                      <Copy className="h-3 w-3" />
                    </Button>
                    <a href={asset.url} download target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()}>
                      <Button size="sm" variant="ghost" className="h-6 w-6 p-0">
                        <Download className="h-3 w-3" />
                      </Button>
                    </a>
                    <Button size="sm" variant="ghost" className="h-6 w-6 p-0 text-destructive" onClick={e => { e.stopPropagation(); handleDelete(asset); }}>
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-xl border border-border bg-card overflow-hidden">
              <div className="divide-y divide-border">
                {filteredAssets.map(asset => (
                  <div
                    key={asset.name}
                    className="flex items-center gap-3 px-4 py-2.5 hover:bg-muted/30 transition-colors cursor-pointer"
                    onClick={() => setPreviewAsset(asset)}
                  >
                    <div className="h-10 w-10 rounded-lg bg-muted/40 flex items-center justify-center overflow-hidden flex-shrink-0">
                      {isImage(asset.type) ? (
                        <img src={asset.url} alt={asset.name} className="w-full h-full object-cover" loading="lazy" />
                      ) : (
                        <FileImage className="h-4 w-4 text-muted-foreground/40" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium truncate">{asset.name}</p>
                      <p className="text-[10px] text-muted-foreground/60">{formatBytes(asset.size)} · {asset.type}</p>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={e => { e.stopPropagation(); handleCopyUrl(asset.url); }}>
                        <Copy className="h-3 w-3" />
                      </Button>
                      <a href={asset.url} download target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()}>
                        <Button size="sm" variant="ghost" className="h-7 w-7 p-0">
                          <Download className="h-3 w-3" />
                        </Button>
                      </a>
                      <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-destructive" onClick={e => { e.stopPropagation(); handleDelete(asset); }}>
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <p className="text-[10px] text-muted-foreground/50 text-center">
            {filteredAssets.length} asset{filteredAssets.length !== 1 ? "s" : ""} in {currentBucket?.label}
          </p>
        </div>
      </div>

      {/* Preview Dialog */}
      <Dialog open={!!previewAsset} onOpenChange={() => setPreviewAsset(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-sm font-semibold truncate">{previewAsset?.name}</DialogTitle>
          </DialogHeader>
          {previewAsset && (
            <div className="space-y-4">
              <div className="rounded-xl bg-muted/20 border border-border overflow-hidden flex items-center justify-center min-h-[300px]">
                {isImage(previewAsset.type) ? (
                  <img src={previewAsset.url} alt={previewAsset.name} className="max-w-full max-h-[500px] object-contain" />
                ) : (
                  <div className="text-center py-12">
                    <FileImage className="h-16 w-16 text-muted-foreground/20 mx-auto mb-3" />
                    <p className="text-sm text-muted-foreground">Preview not available</p>
                  </div>
                )}
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">{formatBytes(previewAsset.size)} · {previewAsset.type}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Button size="sm" variant="outline" className="h-8 text-xs gap-1.5" onClick={() => handleCopyUrl(previewAsset.url)}>
                    <Copy className="h-3 w-3" /> Copy URL
                  </Button>
                  <a href={previewAsset.url} download target="_blank" rel="noopener noreferrer">
                    <Button size="sm" variant="outline" className="h-8 text-xs gap-1.5">
                      <Download className="h-3 w-3" /> Download
                    </Button>
                  </a>
                  <Button size="sm" variant="outline" className="h-8 text-xs gap-1.5" onClick={() => window.open(previewAsset.url, "_blank")}>
                    <ExternalLink className="h-3 w-3" /> Open
                  </Button>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
