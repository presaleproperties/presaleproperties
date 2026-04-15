import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Save, Copy, Eye, Pencil, RotateCcw, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface SignatureData {
  fullName: string;
  title: string;
  phone: string;
  email: string;
  website: string;
  brokerage: string;
  licenseNumber: string;
  headshotUrl: string;
  logoUrl: string;
  customHtml: string;
}

const DEFAULT_DATA: SignatureData = {
  fullName: "",
  title: "Real Estate Advisor",
  phone: "",
  email: "",
  website: "https://presaleproperties.com",
  brokerage: "",
  licenseNumber: "",
  headshotUrl: "",
  logoUrl: "",
  customHtml: "",
};

function buildSignatureHtml(d: SignatureData): string {
  return `<table cellpadding="0" cellspacing="0" border="0" style="font-family: Arial, Helvetica, sans-serif; color: #1a1a1a; font-size: 14px; line-height: 1.4;">
  <tr>
    <td style="padding-right: 16px; vertical-align: top;">
      ${d.headshotUrl ? `<img src="${d.headshotUrl}" alt="${d.fullName}" width="90" height="90" style="border-radius: 50%; object-fit: cover; display: block;" />` : `<div style="width:90px;height:90px;border-radius:50%;background:#c8a45e;display:flex;align-items:center;justify-content:center;color:#fff;font-size:28px;font-weight:700;">${d.fullName.split(" ").map(n => n[0]).join("").slice(0, 2)}</div>`}
    </td>
    <td style="vertical-align: top; border-left: 3px solid #c8a45e; padding-left: 16px;">
      <p style="margin: 0 0 2px; font-size: 18px; font-weight: 700; color: #1a1a1a;">${d.fullName || "Your Name"}</p>
      <p style="margin: 0 0 8px; font-size: 13px; color: #c8a45e; font-weight: 600;">${d.title}</p>
      ${d.brokerage ? `<p style="margin: 0 0 2px; font-size: 12px; color: #555;">${d.brokerage}</p>` : ""}
      ${d.licenseNumber ? `<p style="margin: 0 0 8px; font-size: 11px; color: #888;">License #${d.licenseNumber}</p>` : ""}
      <table cellpadding="0" cellspacing="0" border="0" style="font-size: 13px;">
        ${d.phone ? `<tr><td style="padding: 1px 8px 1px 0; color: #888; font-size: 12px;">P:</td><td style="padding: 1px 0;"><a href="tel:${d.phone}" style="color: #1a1a1a; text-decoration: none;">${d.phone}</a></td></tr>` : ""}
        ${d.email ? `<tr><td style="padding: 1px 8px 1px 0; color: #888; font-size: 12px;">E:</td><td style="padding: 1px 0;"><a href="mailto:${d.email}" style="color: #1a1a1a; text-decoration: none;">${d.email}</a></td></tr>` : ""}
        ${d.website ? `<tr><td style="padding: 1px 8px 1px 0; color: #888; font-size: 12px;">W:</td><td style="padding: 1px 0;"><a href="${d.website}" style="color: #c8a45e; text-decoration: none;">${d.website.replace(/^https?:\/\//, "")}</a></td></tr>` : ""}
      </table>
      ${d.logoUrl ? `<img src="${d.logoUrl}" alt="Logo" height="28" style="margin-top: 10px; display: block;" />` : ""}
    </td>
  </tr>
</table>`;
}

export function SignatureEditor() {
  const { user } = useAuth();
  const [data, setData] = useState<SignatureData>(DEFAULT_DATA);
  const [mode, setMode] = useState<"form" | "html">("form");
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [useCustomHtml, setUseCustomHtml] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // Load saved signature
  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data: profile } = await (supabase as any)
        .from("profiles")
        .select("full_name, phone, email")
        .eq("user_id", user.id)
        .maybeSingle();

      const { data: agentProfile } = await (supabase as any)
        .from("agent_profiles")
        .select("brokerage_name, license_number")
        .eq("user_id", user.id)
        .maybeSingle();

      const { data: saved } = await (supabase as any)
        .from("app_settings")
        .select("value")
        .eq("key", `agent_signature_${user.id}`)
        .maybeSingle();

      if (saved?.value) {
        setData(saved.value as SignatureData);
        setUseCustomHtml(!!(saved.value as SignatureData).customHtml);
      } else {
        setData({
          ...DEFAULT_DATA,
          fullName: profile?.full_name || user.user_metadata?.full_name || "",
          phone: profile?.phone || "",
          email: profile?.email || user.email || "",
          brokerage: agentProfile?.brokerage_name || "",
          licenseNumber: agentProfile?.license_number || "",
        });
      }
      setLoading(false);
    })();
  }, [user]);

  const generatedHtml = useCustomHtml && data.customHtml ? data.customHtml : buildSignatureHtml(data);

  // Update iframe preview
  useEffect(() => {
    if (!iframeRef.current) return;
    const doc = iframeRef.current.contentDocument;
    if (!doc) return;
    doc.open();
    doc.write(`<!DOCTYPE html><html><head><style>body{margin:16px;font-family:Arial,sans-serif;}</style></head><body>${generatedHtml}</body></html>`);
    doc.close();
  }, [generatedHtml]);

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    const { error } = await (supabase as any).from("app_settings").upsert(
      { key: `agent_signature_${user.id}`, value: data },
      { onConflict: "key" }
    );
    if (error) toast.error("Failed to save signature");
    else toast.success("Signature saved");
    setSaving(false);
  };

  const handleCopyHtml = async () => {
    try {
      await navigator.clipboard.writeText(generatedHtml);
      toast.success("HTML copied to clipboard");
    } catch {
      toast.error("Failed to copy");
    }
  };

  const update = (field: keyof SignatureData, value: string) => {
    setData(prev => ({ ...prev, [field]: value }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Mode toggle */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">Email Signature</p>
          <p className="text-xs text-muted-foreground/60 mt-0.5">Create your professional email signature</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center border border-border rounded-lg overflow-hidden h-8">
            <button
              onClick={() => setMode("form")}
              className={cn("px-3 h-full flex items-center gap-1.5 text-xs font-medium transition-colors", mode === "form" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted")}
            >
              <Pencil className="h-3 w-3" /> Edit
            </button>
            <button
              onClick={() => setMode("html")}
              className={cn("px-3 h-full flex items-center gap-1.5 text-xs font-medium transition-colors", mode === "html" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted")}
            >
              <Eye className="h-3 w-3" /> HTML
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Editor */}
        <div className="space-y-4">
          {mode === "form" ? (
            <div className="space-y-3 rounded-xl border border-border bg-card p-5">
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <Label className="text-xs">Full Name</Label>
                  <Input value={data.fullName} onChange={e => update("fullName", e.target.value)} className="h-8 text-sm mt-1" placeholder="John Smith" />
                </div>
                <div>
                  <Label className="text-xs">Title</Label>
                  <Input value={data.title} onChange={e => update("title", e.target.value)} className="h-8 text-sm mt-1" placeholder="Real Estate Advisor" />
                </div>
                <div>
                  <Label className="text-xs">Phone</Label>
                  <Input value={data.phone} onChange={e => update("phone", e.target.value)} className="h-8 text-sm mt-1" placeholder="(604) 555-0123" />
                </div>
                <div>
                  <Label className="text-xs">Email</Label>
                  <Input value={data.email} onChange={e => update("email", e.target.value)} className="h-8 text-sm mt-1" placeholder="you@example.com" />
                </div>
                <div>
                  <Label className="text-xs">Website</Label>
                  <Input value={data.website} onChange={e => update("website", e.target.value)} className="h-8 text-sm mt-1" placeholder="https://..." />
                </div>
                <div>
                  <Label className="text-xs">Brokerage</Label>
                  <Input value={data.brokerage} onChange={e => update("brokerage", e.target.value)} className="h-8 text-sm mt-1" placeholder="Real Broker" />
                </div>
                <div>
                  <Label className="text-xs">License #</Label>
                  <Input value={data.licenseNumber} onChange={e => update("licenseNumber", e.target.value)} className="h-8 text-sm mt-1" />
                </div>
                <div className="col-span-2">
                  <Label className="text-xs">Headshot URL</Label>
                  <Input value={data.headshotUrl} onChange={e => update("headshotUrl", e.target.value)} className="h-8 text-sm mt-1" placeholder="https://..." />
                </div>
                <div className="col-span-2">
                  <Label className="text-xs">Logo URL</Label>
                  <Input value={data.logoUrl} onChange={e => update("logoUrl", e.target.value)} className="h-8 text-sm mt-1" placeholder="https://..." />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="useCustomHtml"
                  checked={useCustomHtml}
                  onChange={e => setUseCustomHtml(e.target.checked)}
                  className="rounded border-border"
                />
                <Label htmlFor="useCustomHtml" className="text-xs text-muted-foreground cursor-pointer">Use custom HTML instead</Label>
              </div>

              {useCustomHtml && (
                <div>
                  <Label className="text-xs">Custom HTML</Label>
                  <Textarea
                    value={data.customHtml}
                    onChange={e => update("customHtml", e.target.value)}
                    className="mt-1 text-xs font-mono min-h-[160px]"
                    placeholder="Paste your custom signature HTML here..."
                  />
                </div>
              )}
            </div>
          ) : (
            <div className="rounded-xl border border-border bg-card p-5">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-semibold text-muted-foreground">Generated HTML</p>
                <Button size="sm" variant="outline" className="h-7 text-xs gap-1.5" onClick={handleCopyHtml}>
                  <Copy className="h-3 w-3" /> Copy
                </Button>
              </div>
              <Textarea
                value={generatedHtml}
                readOnly
                className="font-mono text-[11px] min-h-[300px] bg-muted/30"
              />
            </div>
          )}

          <div className="flex items-center gap-2">
            <Button className="gap-1.5" onClick={handleSave} disabled={saving}>
              {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
              Save Signature
            </Button>
            <Button variant="outline" className="gap-1.5" onClick={handleCopyHtml}>
              <Copy className="h-3.5 w-3.5" /> Copy HTML
            </Button>
            <Button variant="ghost" className="gap-1.5 text-muted-foreground" onClick={() => { setData(DEFAULT_DATA); setUseCustomHtml(false); }}>
              <RotateCcw className="h-3.5 w-3.5" /> Reset
            </Button>
          </div>
        </div>

        {/* Right: Live Preview */}
        <div>
          <div className="rounded-xl border border-border bg-card overflow-hidden">
            <div className="px-4 py-2.5 border-b border-border bg-muted/30 flex items-center justify-between">
              <p className="text-xs font-semibold text-muted-foreground">Live Preview</p>
              <Badge variant="outline" className="text-[9px]">Email Client View</Badge>
            </div>
            <div className="bg-white">
              <iframe
                ref={iframeRef}
                title="Signature Preview"
                className="w-full border-0"
                style={{ minHeight: 220 }}
                sandbox="allow-same-origin"
              />
            </div>
          </div>
          <p className="text-[10px] text-muted-foreground/50 mt-2 text-center">
            Copy the HTML and paste it into your email client's signature settings
          </p>
        </div>
      </div>
    </div>
  );
}
