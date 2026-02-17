import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Upload, Trash2, Image, Globe, Smartphone, ExternalLink, RefreshCw } from "lucide-react";
import { toast } from "sonner";

interface FaviconUrls {
  favicon_32: string;
  favicon_192: string;
  favicon_512: string;
  apple_touch_icon: string;
  og_image: string;
}

const DEFAULT_URLS: FaviconUrls = {
  favicon_32: "/favicon.png",
  favicon_192: "/favicon.png",
  favicon_512: "/favicon.png",
  apple_touch_icon: "/favicon.png",
  og_image: "/og-image.png",
};

const SLOTS = [
  { key: "favicon_32" as const, label: "Favicon (32×32)", desc: "Browser tab icon", icon: Globe, accept: ".png,.ico,.svg", recommended: "32×32 PNG" },
  { key: "favicon_192" as const, label: "Favicon (192×192)", desc: "Android home screen", icon: Smartphone, accept: ".png", recommended: "192×192 PNG" },
  { key: "favicon_512" as const, label: "Favicon (512×512)", desc: "PWA splash / Google Search", icon: Image, accept: ".png", recommended: "512×512 PNG" },
  { key: "apple_touch_icon" as const, label: "Apple Touch Icon", desc: "iOS home screen", icon: Smartphone, accept: ".png", recommended: "180×180 PNG" },
  { key: "og_image" as const, label: "OG Image", desc: "Social media share preview", icon: ExternalLink, accept: ".png,.jpg,.jpeg,.webp", recommended: "1200×630 PNG/JPG" },
];

export function FaviconManager() {
  const [urls, setUrls] = useState<FaviconUrls>(DEFAULT_URLS);
  const [uploading, setUploading] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [previewZoom, setPreviewZoom] = useState(80);
  const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const { data } = await supabase
        .from("app_settings")
        .select("value")
        .eq("key", "favicon_settings")
        .maybeSingle();

      if (data?.value) {
        setUrls({ ...DEFAULT_URLS, ...(data.value as object) });
      }
    } catch (err) {
      console.error("Error loading favicon settings:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const saveSettings = async (newUrls: FaviconUrls) => {
    try {
      const { data: existing } = await supabase
        .from("app_settings")
        .select("id")
        .eq("key", "favicon_settings")
        .maybeSingle();

      if (existing) {
        await supabase
          .from("app_settings")
          .update({ value: newUrls as any, updated_at: new Date().toISOString() })
          .eq("key", "favicon_settings");
      } else {
        await supabase
          .from("app_settings")
          .insert([{ key: "favicon_settings", value: newUrls as any }]);
      }

      // Apply favicon changes immediately
      applyFavicons(newUrls);
      toast.success("Favicon settings saved!");
    } catch (err) {
      console.error("Error saving favicon settings:", err);
      toast.error("Failed to save favicon settings");
    }
  };

  const handleUpload = async (slot: keyof FaviconUrls, file: File) => {
    setUploading(slot);
    try {
      const ext = file.name.split(".").pop();
      const path = `${slot}.${ext}`;

      // Remove old file if exists
      await supabase.storage.from("branding").remove([path]);

      const { error } = await supabase.storage
        .from("branding")
        .upload(path, file, { upsert: true, contentType: file.type });

      if (error) throw error;

      const { data: publicUrl } = supabase.storage
        .from("branding")
        .getPublicUrl(path);

      // Add cache-buster
      const url = `${publicUrl.publicUrl}?v=${Date.now()}`;
      const newUrls = { ...urls, [slot]: url };
      setUrls(newUrls);
      await saveSettings(newUrls);
    } catch (err: any) {
      console.error("Upload error:", err);
      toast.error(`Upload failed: ${err.message}`);
    } finally {
      setUploading(null);
    }
  };

  const handleReset = async (slot: keyof FaviconUrls) => {
    const newUrls = { ...urls, [slot]: DEFAULT_URLS[slot] };
    setUrls(newUrls);
    await saveSettings(newUrls);
  };

  const applyFavicons = (faviconUrls: FaviconUrls) => {
    // Update all link[rel="icon"] elements
    const iconLinks = document.querySelectorAll('link[rel="icon"], link[rel="shortcut icon"]');
    iconLinks.forEach((link) => {
      const el = link as HTMLLinkElement;
      const sizes = el.getAttribute("sizes");
      if (sizes === "512x512") {
        el.href = faviconUrls.favicon_512;
      } else {
        el.href = faviconUrls.favicon_32;
      }
    });

    // Apple touch icon
    const appleTouchIcon = document.querySelector('link[rel="apple-touch-icon"]') as HTMLLinkElement;
    if (appleTouchIcon) {
      appleTouchIcon.href = faviconUrls.apple_touch_icon;
    }

    // OG image
    const ogImage = document.querySelector('meta[property="og:image"]') as HTMLMetaElement;
    if (ogImage) ogImage.content = faviconUrls.og_image;
    const twitterImage = document.querySelector('meta[name="twitter:image"]') as HTMLMetaElement;
    if (twitterImage) twitterImage.content = faviconUrls.og_image;
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center h-32">
          <RefreshCw className="h-5 w-5 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Image className="h-5 w-5 text-primary" />
          Favicon & Social Images
        </CardTitle>
        <CardDescription>
          Upload custom favicons for browser tabs, mobile home screens, and social sharing.
          Changes apply immediately and will update in Google Search after next crawl.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex items-center gap-3 p-3 rounded-lg border bg-muted/20">
          <Label className="text-xs font-medium whitespace-nowrap">Preview Size</Label>
          <input
            type="range"
            min={32}
            max={256}
            step={16}
            value={previewZoom}
            onChange={(e) => setPreviewZoom(Number(e.target.value))}
            className="flex-1 accent-primary"
          />
          <span className="text-xs text-muted-foreground w-12 text-right">{previewZoom}px</span>
        </div>
        {SLOTS.map((slot) => {
          const currentUrl = urls[slot.key];
          const isDefault = currentUrl === DEFAULT_URLS[slot.key];
          const isUploading = uploading === slot.key;

          return (
            <div key={slot.key} className="flex items-start gap-4 p-4 rounded-lg border bg-muted/30">
              {/* Preview */}
              <div className="shrink-0 rounded-lg border bg-background flex items-center justify-center overflow-hidden" style={{ width: previewZoom, height: previewZoom }}>
                {currentUrl && !isDefault ? (
                  <img
                    src={currentUrl}
                    alt={slot.label}
                    className="w-full h-full object-contain"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = "none";
                    }}
                  />
                ) : (
                  <slot.icon className="h-6 w-6 text-muted-foreground" />
                )}
              </div>

              {/* Info + Actions */}
              <div className="flex-1 min-w-0 space-y-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-medium text-sm">{slot.label}</span>
                  {isDefault ? (
                    <Badge variant="secondary" className="text-[10px]">Default</Badge>
                  ) : (
                    <Badge variant="default" className="text-[10px]">Custom</Badge>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">{slot.desc} — Recommended: {slot.recommended}</p>

                <div className="flex items-center gap-2">
                  <input
                    ref={(el) => { fileInputRefs.current[slot.key] = el; }}
                    type="file"
                    accept={slot.accept}
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleUpload(slot.key, file);
                      e.target.value = "";
                    }}
                  />
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => fileInputRefs.current[slot.key]?.click()}
                    disabled={isUploading}
                  >
                    {isUploading ? (
                      <RefreshCw className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                    ) : (
                      <Upload className="h-3.5 w-3.5 mr-1.5" />
                    )}
                    {isUploading ? "Uploading..." : "Upload"}
                  </Button>
                  {!isDefault && (
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-destructive hover:text-destructive"
                      onClick={() => handleReset(slot.key)}
                    >
                      <Trash2 className="h-3.5 w-3.5 mr-1.5" />
                      Reset
                    </Button>
                  )}
                </div>
              </div>
            </div>
          );
        })}

        <div className="p-3 rounded-lg border border-warning/30 bg-warning/5">
          <p className="text-xs text-warning-foreground">
            <strong>Google Search tip:</strong> After updating, request re-indexing via{" "}
            <a href="https://search.google.com/search-console" target="_blank" rel="noopener noreferrer" className="underline">
              Google Search Console
            </a>{" "}
            to speed up the favicon change in search results. Google may take days to weeks to update cached favicons.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
