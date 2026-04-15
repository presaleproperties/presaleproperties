import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Copy, Eye, Pencil, Loader2, Save } from "lucide-react";
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

interface EditableFields {
  fullName: string;
  title: string;
  phone: string;
  email: string;
  website: string;
  brokerage: string;
  photoUrl: string;
  instagram: string;
}

// ── Horizontal layout: headshot on the left ──────────────────────────
function buildHorizontalHtml(d: EditableFields): string {
  const initials = d.fullName.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase();
  return `<table cellpadding="0" cellspacing="0" border="0" style="font-family: Arial, Helvetica, sans-serif; color: #1a1a1a; font-size: 14px; line-height: 1.4; max-width: 480px;">
  <tr>
    <td style="padding-right: 18px; vertical-align: top;">
      ${d.photoUrl
        ? `<img src="${d.photoUrl}" alt="${d.fullName}" width="96" height="96" style="border-radius: 50%; object-fit: cover; display: block; border: 3px solid #c8a45e;" />`
        : `<div style="width:96px;height:96px;border-radius:50%;background:#c8a45e;color:#fff;font-size:28px;font-weight:700;text-align:center;line-height:96px;">${initials}</div>`}
    </td>
    <td style="vertical-align: top; border-left: 3px solid #c8a45e; padding-left: 18px;">
      <p style="margin: 0 0 2px; font-size: 18px; font-weight: 700; color: #1a1a1a;">${d.fullName}</p>
      <p style="margin: 0 0 10px; font-size: 13px; color: #c8a45e; font-weight: 600;">${d.title}</p>
      <p style="margin: 0 0 4px; font-size: 12px; color: #555;">${d.brokerage}</p>
      <table cellpadding="0" cellspacing="0" border="0" style="font-size: 13px; margin-top: 6px;">
        <tr><td style="padding: 2px 8px 2px 0; color: #999; font-size: 11px; font-weight: 600;">P</td><td style="padding: 2px 0;"><a href="tel:${d.phone}" style="color: #1a1a1a; text-decoration: none;">${d.phone}</a></td></tr>
        <tr><td style="padding: 2px 8px 2px 0; color: #999; font-size: 11px; font-weight: 600;">E</td><td style="padding: 2px 0;"><a href="mailto:${d.email}" style="color: #1a1a1a; text-decoration: none;">${d.email}</a></td></tr>
        <tr><td style="padding: 2px 8px 2px 0; color: #999; font-size: 11px; font-weight: 600;">W</td><td style="padding: 2px 0;"><a href="${d.website}" style="color: #c8a45e; text-decoration: none;">${d.website.replace(/^https?:\/\//, "")}</a></td></tr>
      </table>
    </td>
  </tr>
</table>`;
}

// ── Stacked layout: headshot on top ──────────────────────────────────
function buildStackedHtml(d: EditableFields): string {
  const initials = d.fullName.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase();
  return `<table cellpadding="0" cellspacing="0" border="0" style="font-family: Arial, Helvetica, sans-serif; color: #1a1a1a; font-size: 14px; line-height: 1.4; max-width: 320px;">
  <tr>
    <td style="text-align: center; padding-bottom: 14px;">
      ${d.photoUrl
        ? `<img src="${d.photoUrl}" alt="${d.fullName}" width="100" height="100" style="border-radius: 50%; object-fit: cover; display: inline-block; border: 3px solid #c8a45e;" />`
        : `<div style="width:100px;height:100px;border-radius:50%;background:#c8a45e;color:#fff;font-size:30px;font-weight:700;text-align:center;line-height:100px;display:inline-block;">${initials}</div>`}
    </td>
  </tr>
  <tr>
    <td style="text-align: center; padding-bottom: 10px;">
      <p style="margin: 0 0 2px; font-size: 18px; font-weight: 700; color: #1a1a1a;">${d.fullName}</p>
      <p style="margin: 0; font-size: 13px; color: #c8a45e; font-weight: 600;">${d.title}</p>
    </td>
  </tr>
  <tr>
    <td style="text-align: center;">
      <div style="width: 50px; height: 2px; background: #c8a45e; margin: 0 auto 12px;"></div>
      <p style="margin: 0 0 4px; font-size: 12px; color: #555;">${d.brokerage}</p>
      <p style="margin: 0 0 2px; font-size: 13px;"><a href="tel:${d.phone}" style="color: #1a1a1a; text-decoration: none;">${d.phone}</a></p>
      <p style="margin: 0 0 2px; font-size: 13px;"><a href="mailto:${d.email}" style="color: #1a1a1a; text-decoration: none;">${d.email}</a></p>
      <p style="margin: 0; font-size: 13px;"><a href="${d.website}" style="color: #c8a45e; text-decoration: none;">${d.website.replace(/^https?:\/\//, "")}</a></p>
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

  // Load saved overrides from app_settings on mount
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
        // If current agent has saved overrides, apply them
        if (overrides[TEAM_AGENTS[0].id]) {
          setFields(overrides[TEAM_AGENTS[0].id]);
        }
      }
      setLoading(false);
    })();
  }, []);

  // When agent changes, load saved overrides or defaults
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

  // Update both iframe previews
  useEffect(() => {
    [
      { ref: iframeHRef, html: horizontalHtml },
      { ref: iframeVRef, html: stackedHtml },
    ].forEach(({ ref, html }) => {
      if (!ref.current) return;
      const doc = ref.current.contentDocument;
      if (!doc) return;
      doc.open();
      doc.write(`<!DOCTYPE html><html><head><style>body{margin:16px;font-family:Arial,sans-serif;background:#fff;}</style></head><body>${html}</body></html>`);
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
          <p className="text-xs text-muted-foreground/60 mt-0.5">Generate professional signatures for the team</p>
        </div>
        <div className="flex items-center gap-2">
          {/* Agent selector */}
          <Select value={selectedAgentId} onValueChange={handleAgentChange}>
            <SelectTrigger className="h-9 w-[200px] text-xs">
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
          {/* Mode toggle */}
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
            <div className="space-y-3 rounded-xl border border-border bg-card p-5">
              <div className="flex items-center gap-3 mb-2">
                <img src={fields.photoUrl || selectedAgent.photoUrl} alt="" className="h-12 w-12 rounded-full object-cover ring-2 ring-primary/20" />
                <div>
                  <p className="text-sm font-semibold">{fields.fullName}</p>
                  <p className="text-[11px] text-muted-foreground">{fields.title}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <Label className="text-xs">Full Name</Label>
                  <Input value={fields.fullName} onChange={e => update("fullName", e.target.value)} className="h-8 text-sm mt-1" />
                </div>
                <div>
                  <Label className="text-xs">Title</Label>
                  <Input value={fields.title} onChange={e => update("title", e.target.value)} className="h-8 text-sm mt-1" />
                </div>
                <div>
                  <Label className="text-xs">Phone</Label>
                  <Input value={fields.phone} onChange={e => update("phone", e.target.value)} className="h-8 text-sm mt-1" />
                </div>
                <div>
                  <Label className="text-xs">Email</Label>
                  <Input value={fields.email} onChange={e => update("email", e.target.value)} className="h-8 text-sm mt-1" />
                </div>
                <div>
                  <Label className="text-xs">Website</Label>
                  <Input value={fields.website} onChange={e => update("website", e.target.value)} className="h-8 text-sm mt-1" />
                </div>
                <div>
                  <Label className="text-xs">Brokerage</Label>
                  <Input value={fields.brokerage} onChange={e => update("brokerage", e.target.value)} className="h-8 text-sm mt-1" />
                </div>
                <div>
                  <Label className="text-xs">Instagram</Label>
                  <Input value={fields.instagram} onChange={e => update("instagram", e.target.value)} className="h-8 text-sm mt-1" placeholder="https://instagram.com/..." />
                </div>
                <div className="col-span-2">
                  <Label className="text-xs">Headshot URL</Label>
                  <Input value={fields.photoUrl} onChange={e => update("photoUrl", e.target.value)} className="h-8 text-sm mt-1" />
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Horizontal HTML */}
              <div className="rounded-xl border border-border bg-card p-4">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs font-semibold text-muted-foreground">Variation 1 — Headshot Left</p>
                  <Button size="sm" variant="outline" className="h-7 text-xs gap-1.5" onClick={() => handleCopyHtml(horizontalHtml)}>
                    <Copy className="h-3 w-3" /> Copy
                  </Button>
                </div>
                <Textarea value={horizontalHtml} readOnly className="font-mono text-[10px] min-h-[200px] bg-muted/30" />
              </div>
              {/* Stacked HTML */}
              <div className="rounded-xl border border-border bg-card p-4">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs font-semibold text-muted-foreground">Variation 2 — Headshot Top</p>
                  <Button size="sm" variant="outline" className="h-7 text-xs gap-1.5" onClick={() => handleCopyHtml(stackedHtml)}>
                    <Copy className="h-3 w-3" /> Copy
                  </Button>
                </div>
                <Textarea value={stackedHtml} readOnly className="font-mono text-[10px] min-h-[200px] bg-muted/30" />
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
          <div className={cn("rounded-xl border bg-card overflow-hidden transition-all", layout === "horizontal" ? "border-primary ring-2 ring-primary/20" : "border-border")}>
            <div className="px-4 py-2.5 border-b border-border bg-muted/30 flex items-center justify-between">
              <button onClick={() => setLayout("horizontal")} className="flex items-center gap-2 text-left">
                <div className={cn("h-3 w-3 rounded-full border-2 transition-colors", layout === "horizontal" ? "border-primary bg-primary" : "border-muted-foreground/40")} />
                <p className="text-xs font-semibold text-muted-foreground">Headshot Left</p>
              </button>
              <div className="flex items-center gap-1.5">
                {layout === "horizontal" && <Badge className="text-[9px] bg-primary/10 text-primary border-0">Selected</Badge>}
                <Button size="sm" variant="ghost" className="h-6 text-[10px] gap-1 px-2" onClick={() => handleCopyHtml(horizontalHtml)}>
                  <Copy className="h-2.5 w-2.5" /> Copy
                </Button>
              </div>
            </div>
            <div className="bg-white">
              <iframe
                ref={iframeHRef}
                title="Horizontal Signature"
                className="w-full border-0"
                style={{ minHeight: 160 }}
                sandbox="allow-same-origin"
              />
            </div>
          </div>

          {/* Variation 2: Stacked */}
          <div className={cn("rounded-xl border bg-card overflow-hidden transition-all", layout === "stacked" ? "border-primary ring-2 ring-primary/20" : "border-border")}>
            <div className="px-4 py-2.5 border-b border-border bg-muted/30 flex items-center justify-between">
              <button onClick={() => setLayout("stacked")} className="flex items-center gap-2 text-left">
                <div className={cn("h-3 w-3 rounded-full border-2 transition-colors", layout === "stacked" ? "border-primary bg-primary" : "border-muted-foreground/40")} />
                <p className="text-xs font-semibold text-muted-foreground">Headshot Top</p>
              </button>
              <div className="flex items-center gap-1.5">
                {layout === "stacked" && <Badge className="text-[9px] bg-primary/10 text-primary border-0">Selected</Badge>}
                <Button size="sm" variant="ghost" className="h-6 text-[10px] gap-1 px-2" onClick={() => handleCopyHtml(stackedHtml)}>
                  <Copy className="h-2.5 w-2.5" /> Copy
                </Button>
              </div>
            </div>
            <div className="bg-white">
              <iframe
                ref={iframeVRef}
                title="Stacked Signature"
                className="w-full border-0"
                style={{ minHeight: 220 }}
                sandbox="allow-same-origin"
              />
            </div>
          </div>

          <p className="text-[10px] text-muted-foreground/50 text-center">
            Select a variation, then copy the HTML into your email client's signature settings
          </p>
        </div>
      </div>
    </div>
  );
}
