import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Plus, Mail, Clock, Trash2, Copy, Sparkles, ChevronRight,
  LayoutGrid, FolderOpen, Wand2, Star, FileText, Layers,
  BookMarked, Download
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface EmailTemplate {
  id: string;
  name: string;
  project_name: string;
  thumbnail_url: string | null;
  form_data: any;
  created_at: string;
  updated_at: string;
}

// ─── Built-in starter templates ───────────────────────────────────────────────
const BUILTIN_TEMPLATES = [
  {
    key: "main-project-email",
    name: "Main Project Email",
    desc: "Your go-to template for introducing a new presale project to your VIP list. Includes hero image, stats, highlights, and CTAs.",
    icon: Mail,
    color: "from-emerald-600 to-emerald-800",
    badge: "Core",
    badgeColor: "bg-emerald-500/15 text-emerald-600 border-emerald-500/30",
    form_data: {
      vars: {
        headline: "Introducing — [Project Name]",
        bodyCopy: "I wanted to personally reach out with the full details on this opportunity. Below you'll find everything — the pricing, floor plans, deposit structure, and key highlights. I work exclusively with buyers, so my job is to make sure you have everything you need to make the right decision. Give me a call whenever you're ready.",
        subjectLine: "🏙️ Exclusive Access: [Project Name] — [City] Presale",
        previewText: "From $[Price] · [City] presale — limited units available",
        incentiveText: "",
        greeting: "",
        projectName: "",
        developerName: "",
        address: "",
        city: "",
        neighborhood: "",
        completion: "",
        startingPrice: "",
        deposit: "",
        featuredImage: "",
        brochureUrl: "",
        floorplanUrl: "",
        pricingUrl: "",
        projectUrl: "",
        bookUrl: "https://presaleproperties.com/book",
      },
      cta: { brochure: false, floorplan: true, pricing: false, viewProject: true, bookConsult: true },
      fontIdx: 0,
    },
  },
  {
    key: "exclusive-offer",
    name: "Exclusive Offer",
    desc: "High-urgency email for limited-time promotions, incentives, or special pricing windows. Bold headline, incentive spotlight, and direct CTA.",
    icon: Star,
    color: "from-amber-500 to-amber-700",
    badge: "Promo",
    badgeColor: "bg-amber-500/15 text-amber-600 border-amber-500/30",
    form_data: {
      vars: {
        headline: "Exclusive Offer — [Time-Sensitive Pricing]",
        bodyCopy: "This is one of those rare moments where everything lines up — the right project, the right price, and the right timing. I've been holding this back for our VIP list only. Below are the details. This window is short, so please reach out as soon as you've had a chance to review.",
        subjectLine: "⚡ VIP-Only Offer: [Project Name] — Act Before [Date]",
        previewText: "Exclusive savings available for a limited time — see details inside",
        incentiveText: "✦ Extended deposit structure: 5% now, 5% in 180 days\n✦ Developer bonus: $10,000 in upgrades\n✦ Free parking (valued at $35,000)\n✦ Assignment clause included",
        greeting: "",
        projectName: "",
        developerName: "",
        address: "",
        city: "",
        neighborhood: "",
        completion: "",
        startingPrice: "",
        deposit: "5%",
        featuredImage: "",
        brochureUrl: "",
        floorplanUrl: "",
        pricingUrl: "",
        projectUrl: "",
        bookUrl: "https://presaleproperties.com/book",
      },
      cta: { brochure: false, floorplan: true, pricing: true, viewProject: false, bookConsult: true },
      fontIdx: 0,
    },
  },
];

export default function AdminEmailBuilderHub() {
  const navigate = useNavigate();
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);

  const fetchTemplates = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("campaign_templates" as any)
      .select("*")
      .order("updated_at", { ascending: false });
    if (!error && data) setTemplates(data as unknown as EmailTemplate[]);
    setLoading(false);
  };

  useEffect(() => { fetchTemplates(); }, []);

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Delete template "${name}"? This cannot be undone.`)) return;
    setDeleting(id);
    const { error } = await supabase.from("campaign_templates" as any).delete().eq("id", id);
    if (error) toast.error("Failed to delete");
    else { toast.success("Template deleted"); await fetchTemplates(); }
    setDeleting(null);
  };

  const handleDuplicate = async (template: EmailTemplate) => {
    const { error } = await supabase.from("campaign_templates" as any).insert({
      name: `${template.name} (Copy)`,
      project_name: template.project_name,
      form_data: template.form_data,
    });
    if (error) toast.error("Failed to duplicate");
    else { toast.success("Template duplicated"); await fetchTemplates(); }
  };

  // Open a built-in starter by seeding it into localStorage then navigating to builder
  const handleOpenBuiltin = (tpl: typeof BUILTIN_TEMPLATES[0]) => {
    const draft = {
      vars: tpl.form_data.vars,
      cta: tpl.form_data.cta,
      fontIdx: tpl.form_data.fontIdx,
      savedAt: new Date().toISOString(),
    };
    localStorage.setItem("email_builder_draft_v2", JSON.stringify(draft));
    navigate("/admin/email-builder");
  };

  // Load saved template into builder
  const handleOpenSaved = (template: EmailTemplate) => {
    const fd = template.form_data || {};
    const draft = {
      vars: fd.vars || {},
      cta: fd.cta || {},
      fontIdx: fd.fontIdx ?? 0,
      agentId: fd.agentId,
      savedAt: new Date().toISOString(),
      _overwriteId: template.id,
      _templateName: template.name,
    };
    localStorage.setItem("email_builder_draft_v2", JSON.stringify(draft));
    navigate("/admin/email-builder");
  };

  const timeAgo = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    const hrs = Math.floor(mins / 60);
    const days = Math.floor(hrs / 24);
    if (days > 0) return `${days}d ago`;
    if (hrs > 0) return `${hrs}h ago`;
    if (mins > 0) return `${mins}m ago`;
    return "Just now";
  };

  return (
    <AdminLayout>
      <div className="flex flex-col h-full bg-background">

        {/* ── Header ── */}
        <div className="border-b border-border bg-card px-6 py-4 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center shadow-sm">
              <Mail className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold tracking-tight">Email Builder</h1>
              <p className="text-xs text-muted-foreground">Mailchimp-ready HTML emails in under a minute</p>
            </div>
          </div>
          <Button
            onClick={() => navigate("/admin/email-builder")}
            className="gap-2 bg-blue-600 hover:bg-blue-700 text-white"
          >
            <Plus className="h-4 w-4" />
            New Email
          </Button>
        </div>

        {/* ── Stats bar ── */}
        <div className="border-b border-border bg-muted/30 px-6 py-3 flex items-center gap-6 shrink-0">
          {[
            { icon: LayoutGrid, label: "Saved Templates", value: templates.length },
            { icon: Layers, label: "Starter Templates", value: BUILTIN_TEMPLATES.length },
            { icon: FolderOpen, label: "This Month", value: templates.filter(t => new Date(t.created_at) > new Date(Date.now() - 30 * 86400000)).length },
          ].map(({ icon: Icon, label, value }) => (
            <div key={label} className="flex items-center gap-2">
              <Icon className="h-4 w-4 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">{label}:</span>
              <span className="text-sm font-bold">{value}</span>
            </div>
          ))}
        </div>

        {/* ── Main content ── */}
        <div className="flex-1 overflow-auto p-6 space-y-8">

          {/* ── Quick Start ── */}
          <section>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Quick Start</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {[
                {
                  icon: Wand2,
                  title: "Blank Email",
                  desc: "Start from scratch with a clean slate",
                  color: "from-violet-500 to-violet-700",
                  action: () => navigate("/admin/email-builder"),
                },
                ...BUILTIN_TEMPLATES.map(t => ({
                  icon: t.icon,
                  title: t.name,
                  desc: t.desc.slice(0, 60) + "…",
                  color: t.color,
                  action: () => handleOpenBuiltin(t),
                })),
              ].map(({ icon: Icon, title, desc, color, action }) => (
                <button
                  key={title}
                  onClick={action}
                  className="group flex items-center gap-4 p-4 rounded-xl border border-border bg-card hover:border-primary/40 hover:shadow-md transition-all text-left"
                >
                  <div className={cn("h-10 w-10 rounded-xl bg-gradient-to-br flex items-center justify-center shrink-0 shadow-sm group-hover:scale-105 transition-transform", color)}>
                    <Icon className="h-5 w-5 text-white" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-semibold">{title}</div>
                    <div className="text-[11px] text-muted-foreground mt-0.5 line-clamp-1">{desc}</div>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground ml-auto shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
                </button>
              ))}
            </div>
          </section>

          {/* ── Built-in Templates Gallery ── */}
          <section>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Starter Templates</h2>
              <Badge variant="outline" className="text-[10px]">{BUILTIN_TEMPLATES.length} templates</Badge>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {BUILTIN_TEMPLATES.map((tpl) => {
                const Icon = tpl.icon;
                return (
                  <div
                    key={tpl.key}
                    className="group relative rounded-xl border border-border bg-card hover:border-primary/40 hover:shadow-lg transition-all overflow-hidden"
                  >
                    {/* Visual header */}
                    <div className={cn("h-24 bg-gradient-to-br relative overflow-hidden", tpl.color)}>
                      <div className="absolute inset-0 flex items-center justify-center opacity-20">
                        <Icon className="h-16 w-16 text-white" />
                      </div>
                      <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
                      <div className="absolute bottom-3 left-4 right-4">
                        <p className="text-white text-base font-bold">{tpl.name}</p>
                      </div>
                      <div className="absolute top-3 right-3">
                        <Badge className={cn("text-[9px] h-5 border font-semibold", tpl.badgeColor)}>
                          {tpl.badge}
                        </Badge>
                      </div>
                    </div>

                    {/* Info */}
                    <div className="p-4">
                      <p className="text-xs text-muted-foreground leading-relaxed">{tpl.desc}</p>

                      {/* Feature pills */}
                      <div className="flex flex-wrap gap-1.5 mt-3">
                        {tpl.key === "main-project-email" && (
                          <>
                            <span className="text-[10px] bg-muted/60 text-muted-foreground rounded-full px-2 py-0.5">Hero Image</span>
                            <span className="text-[10px] bg-muted/60 text-muted-foreground rounded-full px-2 py-0.5">Stats Row</span>
                            <span className="text-[10px] bg-muted/60 text-muted-foreground rounded-full px-2 py-0.5">Floor Plans CTA</span>
                            <span className="text-[10px] bg-muted/60 text-muted-foreground rounded-full px-2 py-0.5">Book Consult</span>
                          </>
                        )}
                        {tpl.key === "exclusive-offer" && (
                          <>
                            <span className="text-[10px] bg-muted/60 text-muted-foreground rounded-full px-2 py-0.5">Urgency Copy</span>
                            <span className="text-[10px] bg-muted/60 text-muted-foreground rounded-full px-2 py-0.5">Incentive Block</span>
                            <span className="text-[10px] bg-muted/60 text-muted-foreground rounded-full px-2 py-0.5">Pricing CTA</span>
                            <span className="text-[10px] bg-muted/60 text-muted-foreground rounded-full px-2 py-0.5">Limited-Time</span>
                          </>
                        )}
                      </div>

                      <Button
                        size="sm"
                        className={cn("w-full mt-4 h-9 text-xs gap-1.5 text-white", `bg-gradient-to-r ${tpl.color}`)}
                        onClick={() => handleOpenBuiltin(tpl)}
                      >
                        <Wand2 className="h-3.5 w-3.5" /> Use This Template
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          {/* ── Saved Templates ── */}
          <section>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">My Saved Emails</h2>
              <Badge variant="outline" className="text-[10px]">{templates.length} saved</Badge>
            </div>

            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {[1, 2, 3].map(i => (
                  <div key={i} className="h-44 rounded-xl border border-border bg-muted/30 animate-pulse" />
                ))}
              </div>
            ) : templates.length === 0 ? (
              <div className="text-center py-14 border-2 border-dashed border-border rounded-2xl">
                <BookMarked className="h-10 w-10 text-muted-foreground/40 mx-auto mb-3" />
                <p className="text-sm font-semibold text-muted-foreground">No saved emails yet</p>
                <p className="text-xs text-muted-foreground mt-1 mb-4">Build an email and hit "Save Template" to store it here.</p>
                <Button onClick={() => navigate("/admin/email-builder")} variant="outline" size="sm" className="gap-1.5">
                  <Plus className="h-3.5 w-3.5" /> Create First Email
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {templates.map(template => {
                  const fd = template.form_data || {};
                  const vars = fd.vars || {};
                  return (
                    <div
                      key={template.id}
                      className="group relative rounded-xl border border-border bg-card hover:border-primary/40 hover:shadow-lg transition-all overflow-hidden"
                    >
                      {/* Thumbnail strip */}
                      <div className="h-28 bg-gradient-to-br from-slate-800 via-slate-900 to-slate-800 relative overflow-hidden">
                        {vars.featuredImage ? (
                          <img src={vars.featuredImage} alt="" className="w-full h-full object-cover opacity-50" />
                        ) : (
                          <div className="absolute inset-0 flex items-center justify-center">
                            <Mail className="h-8 w-8 text-white/15" />
                          </div>
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
                        <div className="absolute bottom-2 left-3 right-3">
                          <p className="text-white text-sm font-bold truncate">{vars.projectName || template.project_name || "Untitled"}</p>
                          {vars.city && <p className="text-white/60 text-[10px] truncate">{vars.city}</p>}
                        </div>
                        <div className="absolute top-2 right-2">
                          <div className="bg-blue-500/90 rounded-full px-2 py-0.5 text-[9px] font-bold text-white">EMAIL</div>
                        </div>
                      </div>

                      {/* Info */}
                      <div className="p-3">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <p className="text-sm font-semibold truncate">{template.name}</p>
                            <div className="flex items-center gap-1.5 mt-1">
                              <Clock className="h-3 w-3 text-muted-foreground" />
                              <span className="text-[10px] text-muted-foreground">{timeAgo(template.updated_at)}</span>
                            </div>
                          </div>
                        </div>

                        {/* Subject line preview */}
                        {vars.subjectLine && (
                          <p className="text-[10px] text-muted-foreground mt-1.5 truncate italic">
                            ✉ {vars.subjectLine}
                          </p>
                        )}

                        {/* Actions */}
                        <div className="flex gap-2 mt-3">
                          <Button
                            size="sm"
                            className="flex-1 h-8 text-xs gap-1.5 bg-blue-600 hover:bg-blue-700 text-white"
                            onClick={() => handleOpenSaved(template)}
                          >
                            <Download className="h-3 w-3" /> Open & Edit
                          </Button>
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-8 w-8 shrink-0"
                            title="Duplicate"
                            onClick={() => handleDuplicate(template)}
                          >
                            <Copy className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-8 w-8 shrink-0 hover:border-destructive hover:text-destructive"
                            title="Delete"
                            disabled={deleting === template.id}
                            onClick={() => handleDelete(template.id, template.name)}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        </div>
      </div>
    </AdminLayout>
  );
}
