import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Mail, FileText, Sparkles, Plus, Clock, Trash2, Copy,
  ChevronRight, Building2, Star, Layers, ArrowRight, Megaphone,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface SavedAsset {
  id: string;
  name: string;
  project_name: string;
  thumbnail_url: string | null;
  form_data: any;
  created_at: string;
  updated_at: string;
}

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  const hrs = Math.floor(mins / 60);
  const days = Math.floor(hrs / 24);
  if (days > 0) return `${days}d ago`;
  if (hrs > 0) return `${hrs}h ago`;
  if (mins > 0) return `${mins}m ago`;
  return "Just now";
}

// ─── Create options ───────────────────────────────────────────────────────────
const CREATE_OPTIONS = [
  {
    key: "project-email",
    title: "Project Email",
    desc: "Introduce a new presale to your VIP list. Hero image, stats bar, body copy, floor plans, agent card.",
    icon: Building2,
    gradient: "from-emerald-600 to-emerald-800",
    badge: "Most Used",
    badgeColor: "bg-emerald-500/15 text-emerald-600 border-emerald-500/20",
    url: "/admin/email-builder?template=project-email",
  },
  {
    key: "exclusive-offer",
    title: "Exclusive Offer",
    desc: "High-urgency promo email with incentive spotlight and bold CTAs. Perfect for VIP-only pricing windows.",
    icon: Star,
    gradient: "from-amber-500 to-amber-700",
    badge: "Promo",
    badgeColor: "bg-amber-500/15 text-amber-600 border-amber-500/20",
    url: "/admin/email-builder?template=exclusive-offer",
  },
  {
    key: "campaign-flyer",
    title: "Campaign Flyer / One-Pager",
    desc: "Branded marketing collateral — a print-ready single-page PDF for sharing at presentations.",
    icon: FileText,
    gradient: "from-violet-600 to-violet-800",
    badge: "PDF Export",
    badgeColor: "bg-violet-500/15 text-violet-600 border-violet-500/20",
    url: "/admin/campaign-builder/new",
  },
  {
    key: "blank-email",
    title: "Blank Email",
    desc: "Start from scratch. Paste your own copy and use AI to bold keywords.",
    icon: Mail,
    gradient: "from-slate-600 to-slate-800",
    badge: "Custom",
    badgeColor: "bg-slate-500/15 text-slate-500 border-slate-500/20",
    url: "/admin/email-builder?template=blank",
  },
];

export default function AdminMarketingHub() {
  const navigate = useNavigate();
  const [emailAssets, setEmailAssets] = useState<SavedAsset[]>([]);
  const [campaignAssets, setCampaignAssets] = useState<SavedAsset[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"emails" | "flyers">("emails");

  const fetchAssets = async () => {
    setLoading(true);
    const { data } = await (supabase as any)
      .from("campaign_templates")
      .select("*")
      .order("updated_at", { ascending: false });
    if (data) {
      setEmailAssets((data as SavedAsset[]).filter((a: any) => a.form_data?._type === "ai-email" || !a.form_data?._type));
      setCampaignAssets((data as SavedAsset[]).filter((a: any) => a.form_data?._type !== "ai-email" && a.form_data?.plans));
    }
    setLoading(false);
  };

  useEffect(() => { fetchAssets(); }, []);

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Delete "${name}"? This cannot be undone.`)) return;
    setDeleting(id);
    const { error } = await (supabase as any).from("campaign_templates").delete().eq("id", id);
    if (error) toast.error("Failed to delete");
    else { toast.success("Deleted"); fetchAssets(); }
    setDeleting(null);
  };

  const handleDuplicate = async (asset: SavedAsset) => {
    const { error } = await (supabase as any).from("campaign_templates").insert({
      name: `${asset.name} (Copy)`,
      project_name: asset.project_name,
      form_data: asset.form_data,
    });
    if (error) toast.error("Failed to duplicate");
    else { toast.success("Duplicated"); fetchAssets(); }
  };

  const activeAssets = activeTab === "emails" ? emailAssets : campaignAssets;

  return (
    <AdminLayout>
      <div className="flex flex-col min-h-full bg-background">

        {/* ── Page header ── */}
        <div className="border-b border-border bg-card px-6 py-5 shrink-0">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-3.5">
              <div className="h-11 w-11 rounded-xl bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center shadow-sm">
                <Megaphone className="h-5 w-5 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-xl font-bold tracking-tight leading-none">Marketing Hub</h1>
                <p className="text-xs text-muted-foreground mt-1">Create emails, promos, and campaign flyers — all in one place</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-[10px]">
                {emailAssets.length + campaignAssets.length} saved
              </Badge>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-auto">
          <div className="max-w-[1200px] mx-auto p-6 space-y-8">

            {/* ── Create new section ── */}
            <section>
              <div className="flex items-center gap-2 mb-4">
                <Plus className="h-4 w-4 text-muted-foreground" />
                <h2 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Create New</h2>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {CREATE_OPTIONS.map((opt) => (
                  <button
                    key={opt.key}
                    onClick={() => navigate(opt.url)}
                    className="group relative flex flex-col text-left p-5 rounded-2xl border-2 border-border bg-card hover:border-primary/40 hover:shadow-lg transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
                  >
                    {/* Icon */}
                    <div className={cn(
                      "h-12 w-12 rounded-xl bg-gradient-to-br flex items-center justify-center shadow-md mb-4 group-hover:scale-105 transition-transform",
                      opt.gradient
                    )}>
                      <opt.icon className="h-6 w-6 text-white" />
                    </div>

                    {/* Badge */}
                    <Badge className={cn("text-[9px] h-4 px-1.5 mb-2 w-fit", opt.badgeColor)}>
                      {opt.badge}
                    </Badge>

                    {/* Text */}
                    <p className="text-sm font-bold mb-1 text-foreground">{opt.title}</p>
                    <p className="text-[11px] text-muted-foreground leading-relaxed flex-1">{opt.desc}</p>

                    {/* Arrow */}
                    <div className="flex items-center gap-1 mt-4 text-primary text-[11px] font-semibold opacity-0 group-hover:opacity-100 transition-opacity">
                      Start <ArrowRight className="h-3 w-3" />
                    </div>
                  </button>
                ))}
              </div>
            </section>

            {/* ── Saved work ── */}
            <section>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Layers className="h-4 w-4 text-muted-foreground" />
                  <h2 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Saved Work</h2>
                </div>
                {/* Tab toggle */}
                <div className="flex items-center bg-muted rounded-lg p-0.5 gap-0.5">
                  <button
                    onClick={() => setActiveTab("emails")}
                    className={cn(
                      "px-3 py-1 text-[11px] font-semibold rounded-md transition-all",
                      activeTab === "emails" ? "bg-card shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    Emails ({emailAssets.length})
                  </button>
                  <button
                    onClick={() => setActiveTab("flyers")}
                    className={cn(
                      "px-3 py-1 text-[11px] font-semibold rounded-md transition-all",
                      activeTab === "flyers" ? "bg-card shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    Flyers ({campaignAssets.length})
                  </button>
                </div>
              </div>

              {loading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {[1, 2, 3, 4].map(i => (
                    <div key={i} className="h-48 rounded-xl border border-border bg-muted/30 animate-pulse" />
                  ))}
                </div>
              ) : activeAssets.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 border-2 border-dashed border-border rounded-2xl text-center">
                  <div className="h-12 w-12 rounded-full bg-muted/50 flex items-center justify-center mb-3">
                    {activeTab === "emails" ? <Mail className="h-5 w-5 text-muted-foreground/50" /> : <FileText className="h-5 w-5 text-muted-foreground/50" />}
                  </div>
                  <p className="text-sm font-semibold text-muted-foreground">
                    No {activeTab === "emails" ? "emails" : "flyers"} saved yet
                  </p>
                  <p className="text-xs text-muted-foreground mt-1 mb-4 max-w-xs">
                    {activeTab === "emails"
                      ? "Create a Project Email or Exclusive Offer above and save it to find it here."
                      : "Create a Campaign Flyer above and save it to re-use it any time."}
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-1.5"
                    onClick={() => navigate(activeTab === "emails" ? "/admin/email-builder?template=project-email" : "/admin/campaign-builder/new")}
                  >
                    <Plus className="h-3.5 w-3.5" />
                    Create {activeTab === "emails" ? "Email" : "Flyer"}
                  </Button>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {activeAssets.map(asset => {
                    const fd = asset.form_data || {};
                    const isEmail = fd._type === "ai-email" || !fd.plans;
                    const openUrl = isEmail
                      ? `/admin/email-builder?saved=${asset.id}`
                      : `/admin/campaign-builder/${asset.id}`;

                    return (
                      <div
                        key={asset.id}
                        className="group rounded-xl border border-border bg-card hover:border-primary/30 hover:shadow-md transition-all overflow-hidden"
                      >
                        {/* Thumbnail */}
                        <div className="h-28 bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 relative overflow-hidden">
                          {(fd.heroImage || fd.thumbnail_url) ? (
                            <img
                              src={fd.heroImage || fd.thumbnail_url}
                              alt=""
                              className="w-full h-full object-cover opacity-70"
                            />
                          ) : (
                            <div className="absolute inset-0 flex items-center justify-center">
                              {isEmail
                                ? <Mail className="h-8 w-8 text-white/15" />
                                : <FileText className="h-8 w-8 text-white/15" />}
                            </div>
                          )}
                          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
                          <div className="absolute bottom-2 left-3 right-3">
                            <p className="text-white text-xs font-bold truncate">
                              {fd.projectName || asset.project_name || "Untitled"}
                            </p>
                            {fd.city && <p className="text-white/50 text-[10px]">{fd.city}</p>}
                          </div>
                          <div className="absolute top-2 right-2">
                            <Badge className={cn(
                              "text-[9px] h-4 px-1.5",
                              isEmail ? "bg-emerald-500/80 text-white border-0" : "bg-violet-500/80 text-white border-0"
                            )}>
                              {isEmail ? "Email" : "Flyer"}
                            </Badge>
                          </div>
                        </div>

                        {/* Info */}
                        <div className="p-3">
                          <p className="text-xs font-semibold truncate mb-1">{asset.name}</p>
                          <div className="flex items-center gap-1 mb-3">
                            <Clock className="h-3 w-3 text-muted-foreground/50" />
                            <span className="text-[10px] text-muted-foreground">{timeAgo(asset.updated_at)}</span>
                          </div>
                          <div className="flex gap-1.5">
                            <Button
                              size="sm"
                              className="flex-1 h-7 text-[11px] gap-1"
                              onClick={() => navigate(openUrl)}
                            >
                              <ChevronRight className="h-3 w-3" /> Open
                            </Button>
                            <Button
                              variant="outline"
                              size="icon"
                              className="h-7 w-7 shrink-0"
                              onClick={() => handleDuplicate(asset)}
                              title="Duplicate"
                            >
                              <Copy className="h-3 w-3" />
                            </Button>
                            <Button
                              variant="outline"
                              size="icon"
                              className="h-7 w-7 shrink-0 hover:border-destructive hover:text-destructive"
                              disabled={deleting === asset.id}
                              onClick={() => handleDelete(asset.id, asset.name)}
                              title="Delete"
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
      </div>
    </AdminLayout>
  );
}
