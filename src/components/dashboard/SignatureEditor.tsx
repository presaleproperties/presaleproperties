import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Copy, Eye, Pencil, Loader2, Save, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface AgentInfo {
  id: string;
  fullName: string;
  title: string;
  photoUrl: string;
  phone: string;
  email: string;
  website: string;
  brokerage: string;
  instagram: string;
}

const TEAM_AGENTS: AgentInfo[] = [
  {
    id: "uzair",
    fullName: "Uzair Muhammad PREC",
    title: "Founder & Presale Strategist",
    photoUrl: "https://thvlisplwqhtjpzpedhq.supabase.co/storage/v1/object/public/avatars/team/1772579582217-unijnf.jpg",
    phone: "(672) 258-1100",
    email: "uzair@presaleproperties.com",
    website: "https://presaleproperties.com",
    brokerage: "Real Broker",
    instagram: "https://www.instagram.com/presalewithuzair",
  },
  {
    id: "ravish",
    fullName: "Ravish Passy",
    title: "Presale Expert",
    photoUrl: "https://thvlisplwqhtjpzpedhq.supabase.co/storage/v1/object/public/avatars/team/1769973742728-csckvf.png",
    phone: "(672) 258-1100",
    email: "ravish@presaleproperties.com",
    website: "https://presaleproperties.com",
    brokerage: "Real Broker",
    instagram: "",
  },
  {
    id: "sarb",
    fullName: "Sarb Grewal",
    title: "Presale Expert",
    photoUrl: "https://thvlisplwqhtjpzpedhq.supabase.co/storage/v1/object/public/avatars/team/1769973843032-qlc6fc.png",
    phone: "(672) 258-1100",
    email: "sarb@presaleproperties.com",
    website: "https://presaleproperties.com",
    brokerage: "Real Broker",
    instagram: "",
  },
];

type LayoutVariant = "horizontal" | "stacked";
type HeadshotShape = "circle" | "rounded";

interface EditableFields {
  fullName: string;
  title: string;
  phone: string;
  email: string;
  website: string;
  brokerage: string;
  photoUrl: string;
  instagram: string;
  headshotLink: string;
  headshotShape: HeadshotShape;
}

// ── Helper: build headshot img tag based on shape ────────────────────
function buildHeadshotTag(d: EditableFields, size: number): string {
  const initials = d.fullName.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase();
  const radius = d.headshotShape === "circle" ? "50%" : "14px";
  const img = d.photoUrl
    ? `<img src="${d.photoUrl}" alt="${d.fullName}" width="${size}" height="${size}" style="border-radius: ${radius}; object-fit: cover; display: block; border: 3px solid #c8a45e; box-shadow: 0 4px 16px rgba(200,164,94,0.2);" />`
    : `<div style="width:${size}px;height:${size}px;border-radius:${radius};background:linear-gradient(135deg,#c8a45e,#a8843e);color:#fff;font-size:${Math.round(size * 0.32)}px;font-weight:700;text-align:center;line-height:${size}px;box-shadow:0 4px 16px rgba(200,164,94,0.2);border:3px solid #c8a45e;">${initials}</div>`;
  return d.headshotLink ? `<a href="${d.headshotLink}" target="_blank" style="text-decoration:none;">${img}</a>` : img;
}

// ── Horizontal layout: headshot on the left with gold divider ────────
function buildHorizontalHtml(d: EditableFields): string {
  const headshot = buildHeadshotTag(d, 100);

  return `<table cellpadding="0" cellspacing="0" border="0" style="font-family: 'Helvetica Neue', Arial, sans-serif; color: #1a1a1a; font-size: 14px; line-height: 1.5; max-width: 520px;">
  <tr>
    <td style="padding-right: 18px; vertical-align: middle;">
      ${headshot}
    </td>
    <td style="border-left: 3px solid #c8a45e; padding-left: 18px; vertical-align: middle;">
      <p style="margin: 0 0 1px; font-size: 19px; font-weight: 700; color: #1a1a1a; letter-spacing: -0.3px;">${d.fullName}</p>
      <p style="margin: 0 0 10px; font-size: 11px; color: #c8a45e; font-weight: 700; text-transform: uppercase; letter-spacing: 1px;">${d.title} · ${d.brokerage}</p>
      <p style="margin: 0; font-size: 13px; color: #333;">
        <a href="tel:${d.phone}" style="color: #333; text-decoration: none;">${d.phone}</a>
        <span style="color: #ddd; padding: 0 6px;">|</span>
        <a href="mailto:${d.email}" style="color: #333; text-decoration: none;">${d.email}</a>
      </p>
      <p style="margin: 4px 0 0; font-size: 13px;">
        <a href="${d.website}" style="color: #c8a45e; text-decoration: none; font-weight: 600;">${d.website.replace(/^https?:\/\//, "")}</a>${d.instagram ? `
        <span style="color: #ddd; padding: 0 6px;">|</span>
        <a href="${d.instagram}" target="_blank" style="color: #c8a45e; text-decoration: none; font-weight: 600; font-size: 12px;">Instagram</a>` : ""}
      </p>
    </td>
  </tr>
</table>`;
}

// ── Stacked layout: headshot on top, centered ────────────────────────
function buildStackedHtml(d: EditableFields): string {
  const headshot = buildHeadshotTag(d, 110);

  return `<table cellpadding="0" cellspacing="0" border="0" style="font-family: 'Helvetica Neue', Arial, sans-serif; color: #1a1a1a; font-size: 14px; line-height: 1.5; max-width: 340px;">
  <tr>
    <td style="text-align: center; padding-bottom: 14px;">
      ${headshot}
    </td>
  </tr>
  <tr>
    <td style="text-align: center;">
      <p style="margin: 0 0 2px; font-size: 20px; font-weight: 700; color: #1a1a1a; letter-spacing: -0.3px;">${d.fullName}</p>
      <p style="margin: 0 0 12px; font-size: 11px; color: #c8a45e; font-weight: 700; text-transform: uppercase; letter-spacing: 1px;">${d.title} · ${d.brokerage}</p>
      <div style="width: 40px; height: 2px; background: #c8a45e; margin: 0 auto 12px; border-radius: 1px;"></div>
      <p style="margin: 0 0 3px; font-size: 13px;">
        <a href="tel:${d.phone}" style="color: #333; text-decoration: none;">${d.phone}</a>
        <span style="color: #ddd; padding: 0 6px;">|</span>
        <a href="mailto:${d.email}" style="color: #333; text-decoration: none;">${d.email}</a>
      </p>
      <p style="margin: 0; font-size: 13px;">
        <a href="${d.website}" style="color: #c8a45e; text-decoration: none; font-weight: 600;">${d.website.replace(/^https?:\/\//, "")}</a>${d.instagram ? `
        <span style="color: #ddd; padding: 0 6px;">|</span>
        <a href="${d.instagram}" target="_blank" style="color: #c8a45e; text-decoration: none; font-weight: 600; font-size: 12px;">Instagram</a>` : ""}
      </p>
    </td>
  </tr>
</table>`;
}

function agentToFields(a: AgentInfo): EditableFields {
  return {
    fullName: a.fullName,
    title: a.title,
    phone: a.phone,
    email: a.email,
    website: a.website,
    brokerage: a.brokerage,
    photoUrl: a.photoUrl,
    instagram: a.instagram,
    headshotLink: "",
    headshotShape: "rounded" as HeadshotShape,
  };
}

export function SignatureEditor() {
  const [selectedAgentId, setSelectedAgentId] = useState(TEAM_AGENTS[0].id);
  const [layout, setLayout] = useState<LayoutVariant>("horizontal");
  const [mode, setMode] = useState<"form" | "html">("form");
  const [fields, setFields] = useState<EditableFields>(() => agentToFields(TEAM_AGENTS[0]));
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [savedOverrides, setSavedOverrides] = useState<Record<string, EditableFields>>({});
  const iframeHRef = useRef<HTMLIFrameElement>(null);
  const iframeVRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    (async () => {
      const { data } = await (supabase as any)
        .from("app_settings")
        .select("value")
        .eq("key", "team_signature_overrides")
        .maybeSingle();
      if (data?.value) {
        const overrides = data.value as Record<string, EditableFields>;
        setSavedOverrides(overrides);
        if (overrides[TEAM_AGENTS[0].id]) {
          setFields(overrides[TEAM_AGENTS[0].id]);
        }
      }
      setLoading(false);
    })();
  }, []);

  const handleAgentChange = (agentId: string) => {
    setSelectedAgentId(agentId);
    if (savedOverrides[agentId]) {
      setFields(savedOverrides[agentId]);
    } else {
      const agent = TEAM_AGENTS.find(a => a.id === agentId);
      if (agent) setFields(agentToFields(agent));
    }
  };

  const handleSave = async () => {
    setSaving(true);
    const updated = { ...savedOverrides, [selectedAgentId]: fields };
    const { error } = await (supabase as any).from("app_settings").upsert(
      { key: "team_signature_overrides", value: updated },
      { onConflict: "key" }
    );
    if (error) toast.error("Failed to save");
    else {
      setSavedOverrides(updated);
      toast.success("Signature saved");
    }
    setSaving(false);
  };

  const update = (field: keyof EditableFields, value: string) => {
    setFields(prev => ({ ...prev, [field]: value }));
  };

  const horizontalHtml = buildHorizontalHtml(fields);
  const stackedHtml = buildStackedHtml(fields);
  const activeHtml = layout === "horizontal" ? horizontalHtml : stackedHtml;

  useEffect(() => {
    [
      { ref: iframeHRef, html: horizontalHtml },
      { ref: iframeVRef, html: stackedHtml },
    ].forEach(({ ref, html }) => {
      if (!ref.current) return;
      const doc = ref.current.contentDocument;
      if (!doc) return;
      doc.open();
      doc.write(`<!DOCTYPE html><html><head><style>body{margin:20px;font-family:'Helvetica Neue',Arial,sans-serif;background:#fff;}</style></head><body>${html}</body></html>`);
      doc.close();
    });
  }, [horizontalHtml, stackedHtml]);

  const handleCopyHtml = async (html?: string) => {
    try {
      await navigator.clipboard.writeText(html || activeHtml);
      toast.success("HTML copied to clipboard");
    } catch {
      toast.error("Failed to copy");
    }
  };

  const selectedAgent = TEAM_AGENTS.find(a => a.id === selectedAgentId)!;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">Email Signature</p>
          <p className="text-xs text-muted-foreground/60 mt-0.5">Generate premium signatures for the team</p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={selectedAgentId} onValueChange={handleAgentChange}>
            <SelectTrigger className="h-9 w-[210px] text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {TEAM_AGENTS.map(a => (
                <SelectItem key={a.id} value={a.id}>
                  <div className="flex items-center gap-2">
                    <img src={a.photoUrl} alt="" className="h-5 w-5 rounded-full object-cover" />
                    <span>{a.fullName.split(" ").slice(0, 2).join(" ")}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
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
        {/* Left: Editor / HTML */}
        <div className="space-y-4">
          {mode === "form" ? (
            <div className="rounded-xl border border-border bg-card overflow-hidden">
              {/* Agent preview header */}
              <div className="bg-gradient-to-r from-primary/5 to-primary/10 border-b border-border p-4 flex items-center gap-3">
                <img src={fields.photoUrl || selectedAgent.photoUrl} alt="" className="h-14 w-14 rounded-full object-cover ring-2 ring-primary/30 ring-offset-2 ring-offset-background shadow-md" />
                <div>
                  <p className="text-sm font-bold">{fields.fullName}</p>
                  <p className="text-[11px] text-primary font-semibold uppercase tracking-wide">{fields.title}</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">{fields.brokerage}</p>
                </div>
              </div>
              {/* Fields */}
              <div className="p-5 space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div className="col-span-2">
                    <Label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">Full Name</Label>
                    <Input value={fields.fullName} onChange={e => update("fullName", e.target.value)} className="h-8 text-sm mt-1" />
                  </div>
                  <div>
                    <Label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">Title</Label>
                    <Input value={fields.title} onChange={e => update("title", e.target.value)} className="h-8 text-sm mt-1" />
                  </div>
                  <div>
                    <Label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">Phone</Label>
                    <Input value={fields.phone} onChange={e => update("phone", e.target.value)} className="h-8 text-sm mt-1" />
                  </div>
                  <div>
                    <Label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">Email</Label>
                    <Input value={fields.email} onChange={e => update("email", e.target.value)} className="h-8 text-sm mt-1" />
                  </div>
                  <div>
                    <Label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">Website</Label>
                    <Input value={fields.website} onChange={e => update("website", e.target.value)} className="h-8 text-sm mt-1" />
                  </div>
                  <div>
                    <Label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">Brokerage</Label>
                    <Input value={fields.brokerage} onChange={e => update("brokerage", e.target.value)} className="h-8 text-sm mt-1" />
                  </div>
                  <div>
                    <Label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">Instagram</Label>
                    <Input value={fields.instagram} onChange={e => update("instagram", e.target.value)} className="h-8 text-sm mt-1" placeholder="https://instagram.com/..." />
                  </div>
                  <div className="col-span-2">
                    <Label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">Headshot URL</Label>
                    <Input value={fields.photoUrl} onChange={e => update("photoUrl", e.target.value)} className="h-8 text-sm mt-1" />
                  </div>
                  <div className="col-span-2">
                    <Label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1">
                      <ExternalLink className="h-3 w-3" /> Headshot Link URL
                    </Label>
                    <Input value={fields.headshotLink} onChange={e => update("headshotLink", e.target.value)} className="h-8 text-sm mt-1" placeholder="https://... (clicking headshot opens this link)" />
                    <p className="text-[10px] text-muted-foreground/50 mt-1">When set, the headshot image becomes clickable and links to this URL</p>
                  </div>
                  <div className="col-span-2">
                    <Label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">Headshot Shape</Label>
                    <div className="flex items-center gap-2 mt-1.5">
                      <button
                        onClick={() => setFields(prev => ({ ...prev, headshotShape: "circle" }))}
                        className={cn("flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-medium transition-all", fields.headshotShape === "circle" ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:border-primary/30")}
                      >
                        <div className="h-5 w-5 rounded-full border-2 border-current" />
                        Circle
                      </button>
                      <button
                        onClick={() => setFields(prev => ({ ...prev, headshotShape: "rounded" }))}
                        className={cn("flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-medium transition-all", fields.headshotShape === "rounded" ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:border-primary/30")}
                      >
                        <div className="h-5 w-5 rounded-[4px] border-2 border-current" />
                        Rounded
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="rounded-xl border border-border bg-card overflow-hidden">
                <div className="px-4 py-3 border-b border-border bg-muted/30 flex items-center justify-between">
                  <p className="text-xs font-semibold text-muted-foreground">Variation 1 — Headshot Left</p>
                  <Button size="sm" variant="outline" className="h-7 text-xs gap-1.5" onClick={() => handleCopyHtml(horizontalHtml)}>
                    <Copy className="h-3 w-3" /> Copy
                  </Button>
                </div>
                <div className="p-3">
                  <Textarea value={horizontalHtml} readOnly className="font-mono text-[10px] min-h-[180px] bg-muted/20 border-0" />
                </div>
              </div>
              <div className="rounded-xl border border-border bg-card overflow-hidden">
                <div className="px-4 py-3 border-b border-border bg-muted/30 flex items-center justify-between">
                  <p className="text-xs font-semibold text-muted-foreground">Variation 2 — Headshot Top</p>
                  <Button size="sm" variant="outline" className="h-7 text-xs gap-1.5" onClick={() => handleCopyHtml(stackedHtml)}>
                    <Copy className="h-3 w-3" /> Copy
                  </Button>
                </div>
                <div className="p-3">
                  <Textarea value={stackedHtml} readOnly className="font-mono text-[10px] min-h-[180px] bg-muted/20 border-0" />
                </div>
              </div>
            </div>
          )}

          {/* Save button */}
          <Button className="gap-1.5" onClick={handleSave} disabled={saving}>
            {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
            Save Changes
          </Button>
        </div>

        {/* Right: Both Previews */}
        <div className="space-y-4">
          {/* Variation 1: Horizontal */}
          <div className={cn(
            "rounded-xl border bg-card overflow-hidden transition-all cursor-pointer",
            layout === "horizontal" ? "border-primary ring-2 ring-primary/15 shadow-md" : "border-border hover:border-primary/20"
          )} onClick={() => setLayout("horizontal")}>
            <div className="px-4 py-2.5 border-b border-border bg-muted/20 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className={cn("h-3.5 w-3.5 rounded-full border-2 transition-colors flex items-center justify-center", layout === "horizontal" ? "border-primary bg-primary" : "border-muted-foreground/30")}>
                  {layout === "horizontal" && <div className="h-1.5 w-1.5 rounded-full bg-primary-foreground" />}
                </div>
                <p className="text-xs font-semibold">Headshot Left</p>
                {layout === "horizontal" && <Badge className="text-[9px] bg-primary/10 text-primary border-0 h-4 px-1.5">Active</Badge>}
              </div>
              <Button size="sm" variant="ghost" className="h-6 text-[10px] gap-1 px-2" onClick={(e) => { e.stopPropagation(); handleCopyHtml(horizontalHtml); }}>
                <Copy className="h-2.5 w-2.5" /> Copy
              </Button>
            </div>
            <div className="bg-white">
              <iframe
                ref={iframeHRef}
                title="Horizontal Signature"
                className="w-full border-0 pointer-events-none"
                style={{ minHeight: 170 }}
                sandbox="allow-same-origin"
              />
            </div>
          </div>

          {/* Variation 2: Stacked */}
          <div className={cn(
            "rounded-xl border bg-card overflow-hidden transition-all cursor-pointer",
            layout === "stacked" ? "border-primary ring-2 ring-primary/15 shadow-md" : "border-border hover:border-primary/20"
          )} onClick={() => setLayout("stacked")}>
            <div className="px-4 py-2.5 border-b border-border bg-muted/20 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className={cn("h-3.5 w-3.5 rounded-full border-2 transition-colors flex items-center justify-center", layout === "stacked" ? "border-primary bg-primary" : "border-muted-foreground/30")}>
                  {layout === "stacked" && <div className="h-1.5 w-1.5 rounded-full bg-primary-foreground" />}
                </div>
                <p className="text-xs font-semibold">Headshot Top</p>
                {layout === "stacked" && <Badge className="text-[9px] bg-primary/10 text-primary border-0 h-4 px-1.5">Active</Badge>}
              </div>
              <Button size="sm" variant="ghost" className="h-6 text-[10px] gap-1 px-2" onClick={(e) => { e.stopPropagation(); handleCopyHtml(stackedHtml); }}>
                <Copy className="h-2.5 w-2.5" /> Copy
              </Button>
            </div>
            <div className="bg-white">
              <iframe
                ref={iframeVRef}
                title="Stacked Signature"
                className="w-full border-0 pointer-events-none"
                style={{ minHeight: 240 }}
                sandbox="allow-same-origin"
              />
            </div>
          </div>

          <p className="text-[10px] text-muted-foreground/50 text-center">
            Click a variation to select it · Copy the HTML into your email client's signature settings
          </p>
        </div>
      </div>
    </div>
  );
}
