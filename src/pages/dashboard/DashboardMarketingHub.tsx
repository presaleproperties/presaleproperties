import { useState, useEffect, useMemo, useCallback } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Mail, Plus, Clock, Trash2, Copy, Tag,
  ChevronRight, Building2, Star, Megaphone, ExternalLink,
  Search, LayoutGrid, List, Send, Loader2, Users,
  Presentation, Share2,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { personalizeTemplateHtml, buildAiTemplateHtmlFromFormData, isAiEmailTemplate } from "@/lib/ai-email-html";
import { PitchDecksList } from "@/components/dashboard/PitchDecksList";
import { SocialPostGenerator } from "@/components/admin/marketing/SocialPostGenerator";

interface SavedAsset {
  id: string;
  name: string;
  project_name: string;
  thumbnail_url: string | null;
  form_data: any;
  created_at: string;
  updated_at: string;
  user_id: string | null;
  tags: string[] | null;
  is_favorited: boolean;
  last_sent_at: string | null;
}

type SortOption = "recent" | "name" | "project";

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

function getPreviewImage(asset: SavedAsset): string | null {
  return asset.thumbnail_url || asset.form_data?.heroImage || null;
}

function getSubjectLine(asset: SavedAsset): string | null {
  return asset.form_data?.copy?.subjectLine || asset.form_data?.subject || null;
}

function getDisplayName(asset: SavedAsset): string {
  return asset.form_data?.copy?.subjectLine || asset.name;
}

const CREATE_OPTIONS = [
  {
    key: "project-email",
    title: "Project Email",
    desc: "Hero image, stats, highlights, floor plans",
    icon: Building2,
    color: "text-emerald-600",
    bg: "bg-emerald-500/10",
    badge: "Most Used",
    url: "/dashboard/email-builder?template=project-email",
  },
  {
    key: "exclusive-offer",
    title: "Exclusive Offer",
    desc: "High-urgency promo with incentive spotlight",
    icon: Star,
    color: "text-amber-600",
    bg: "bg-amber-500/10",
    badge: "Promo",
    url: "/dashboard/email-builder?template=exclusive-offer",
  },
  {
    key: "blank-email",
    title: "Blank Email",
    desc: "Start from scratch",
    icon: Mail,
    color: "text-muted-foreground",
    bg: "bg-muted/40",
    badge: null,
    url: "/dashboard/email-builder?template=blank",
  },
];

export default function DashboardMarketingHub() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { user } = useAuth();
  const [assets, setAssets] = useState<SavedAsset[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [adminTemplates, setAdminTemplates] = useState<SavedAsset[]>([]);
  const [importing, setImporting] = useState<string | null>(null);

  // Tab state from URL
  const activeTab = searchParams.get("tab") || "emails";
  const setActiveTab = (tab: string) => {
    setSearchParams({ tab }, { replace: true });
  };

  // Filtering & sorting state
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTagFilter, setActiveTagFilter] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<SortOption>("recent");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  const fetchAssets = async () => {
    if (!user) return;
    setLoading(true);
    const { data } = await (supabase as any)
      .from("campaign_templates")
      .select("*")
      .order("updated_at", { ascending: false });

    if (data) {
      const all = data as SavedAsset[];
      setAssets(all.filter((a) => a.user_id === user.id));
      setAdminTemplates(all.filter((a) => !a.user_id));
    }
    setLoading(false);
  };

  useEffect(() => {
    if (user) fetchAssets();
  }, [user]);

  const allTags = useMemo(() => {
    const tags = new Set<string>();
    assets.forEach(a => a.tags?.forEach(t => tags.add(t)));
    return Array.from(tags).sort();
  }, [assets]);

  const filteredAssets = useMemo(() => {
    let result = [...assets];
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(a =>
        getDisplayName(a).toLowerCase().includes(q) ||
        a.project_name?.toLowerCase().includes(q) ||
        getSubjectLine(a)?.toLowerCase().includes(q) ||
        a.tags?.some(t => t.toLowerCase().includes(q))
      );
    }
    if (activeTagFilter) {
      result = result.filter(a => a.tags?.includes(activeTagFilter));
    }
    result.sort((a, b) => {
      if (a.is_favorited !== b.is_favorited) return a.is_favorited ? -1 : 1;
      switch (sortBy) {
        case "name": return getDisplayName(a).localeCompare(getDisplayName(b));
        case "project": return (a.project_name || "").localeCompare(b.project_name || "");
        default: return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
      }
    });
    return result;
  }, [assets, searchQuery, activeTagFilter, sortBy]);

  const handleDelete = async (id: string) => {
    setDeleting(id);
    const { error } = await (supabase as any).from("campaign_templates").delete().eq("id", id);
    if (error) toast.error("Failed to delete");
    else { toast.success("Deleted"); fetchAssets(); }
    setDeleting(null);
  };

  const handleDuplicate = async (asset: SavedAsset) => {
    if (!user) return;
    const { error } = await (supabase as any).from("campaign_templates").insert({
      name: `${asset.name} (Copy)`,
      project_name: asset.project_name,
      form_data: asset.form_data,
      user_id: user.id,
      tags: asset.tags,
    });
    if (error) toast.error("Failed to duplicate");
    else { toast.success("Duplicated"); fetchAssets(); }
  };

  const handleImport = async (asset: SavedAsset) => {
    if (!user) return;
    setImporting(asset.id);
    const { error } = await (supabase as any).from("campaign_templates").insert({
      name: asset.name,
      project_name: asset.project_name,
      form_data: asset.form_data,
      thumbnail_url: asset.thumbnail_url,
      user_id: user.id,
      tags: asset.tags,
    });
    if (error) toast.error("Failed to import");
    else { toast.success("Template imported to your collection"); fetchAssets(); }
    setImporting(null);
  };

  const handleToggleFavorite = async (asset: SavedAsset) => {
    const newVal = !asset.is_favorited;
    setAssets(prev => prev.map(a => a.id === asset.id ? { ...a, is_favorited: newVal } : a));
    const { error } = await (supabase as any)
      .from("campaign_templates")
      .update({ is_favorited: newVal })
      .eq("id", asset.id);
    if (error) {
      toast.error("Failed to update");
      setAssets(prev => prev.map(a => a.id === asset.id ? { ...a, is_favorited: !newVal } : a));
    }
  };

  // Quick send state
  const [quickSendAsset, setQuickSendAsset] = useState<SavedAsset | null>(null);
  const [quickSendLeads, setQuickSendLeads] = useState<{ id: string; first_name: string; last_name: string; email: string }[]>([]);
  const [quickSendSearch, setQuickSendSearch] = useState("");
  const [quickSendSelectedLead, setQuickSendSelectedLead] = useState<string | null>(null);
  const [quickSendSending, setQuickSendSending] = useState(false);
  const [quickSendLeadsLoading, setQuickSendLeadsLoading] = useState(false);

  const handleQuickSend = useCallback(async (asset: SavedAsset) => {
    setQuickSendAsset(asset);
    setQuickSendSearch("");
    setQuickSendSelectedLead(null);
    setQuickSendLeadsLoading(true);
    const { data } = await supabase
      .from("onboarded_leads")
      .select("id, first_name, last_name, email")
      .order("created_at", { ascending: false })
      .limit(200);
    setQuickSendLeads((data as any) || []);
    setQuickSendLeadsLoading(false);
  }, []);

  const filteredQuickSendLeads = useMemo(() => {
    if (!quickSendSearch.trim()) return quickSendLeads;
    const q = quickSendSearch.toLowerCase();
    return quickSendLeads.filter(l =>
      `${l.first_name} ${l.last_name}`.toLowerCase().includes(q) ||
      l.email.toLowerCase().includes(q)
    );
  }, [quickSendLeads, quickSendSearch]);

  const handleQuickSendConfirm = async () => {
    if (!quickSendAsset || !quickSendSelectedLead) return;
    const lead = quickSendLeads.find(l => l.id === quickSendSelectedLead);
    if (!lead) return;
    setQuickSendSending(true);
    try {
      const fd = quickSendAsset.form_data;
      let htmlOverride: string | undefined;
      if (fd?.finalHtml) {
        htmlOverride = personalizeTemplateHtml(fd.finalHtml, lead.first_name);
      } else if (fd && isAiEmailTemplate(fd)) {
        htmlOverride = personalizeTemplateHtml(buildAiTemplateHtmlFromFormData(fd), lead.first_name);
      }
      const { error } = await supabase.functions.invoke("send-template-email", {
        body: { leadId: lead.id, templateId: quickSendAsset.id, htmlOverride },
      });
      if (error) throw error;
      await (supabase as any).from("campaign_templates")
        .update({ last_sent_at: new Date().toISOString() })
        .eq("id", quickSendAsset.id);
      setAssets(prev => prev.map(a => a.id === quickSendAsset.id ? { ...a, last_sent_at: new Date().toISOString() } : a));
      toast.success(`Email sent to ${lead.first_name} ${lead.last_name}`);
      setQuickSendAsset(null);
    } catch (err: any) {
      console.error("Quick send error:", err);
      toast.error("Failed to send email");
    } finally {
      setQuickSendSending(false);
    }
  };

  // ── Template card (grid) ───────────────────────────────────────────
  const TemplateCardGrid = ({ asset, isAdmin = false }: { asset: SavedAsset; isAdmin?: boolean }) => {
    const preview = getPreviewImage(asset);
    const subject = getSubjectLine(asset);
    const openUrl = `/dashboard/email-builder?saved=${asset.id}`;

    return (
      <div className="group relative rounded-xl border border-border bg-card overflow-hidden hover:border-primary/30 hover:shadow-md transition-all">
        <div className="h-44 bg-muted/30 relative cursor-pointer overflow-hidden" onClick={() => !isAdmin && navigate(openUrl)}>
          {preview ? (
            <img src={preview} alt={asset.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
          ) : (
            <div className="w-full h-full flex items-center justify-center"><Mail className="h-10 w-10 text-muted-foreground/15" /></div>
          )}
          {!isAdmin && (
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all flex items-center justify-center opacity-0 group-hover:opacity-100">
              <Button size="sm" variant="secondary" className="gap-1.5 shadow-lg"><ExternalLink className="h-3.5 w-3.5" /> Open</Button>
            </div>
          )}
          <div className="absolute top-2 left-2 flex gap-1">
            <Badge className={cn("text-[9px] px-1.5 py-0.5 shadow-sm hover:bg-emerald-500/90", isAdmin ? "bg-card/90 text-foreground border" : "bg-emerald-500/90 text-white")}>
              {isAdmin ? "Admin" : "Email"}
            </Badge>
          </div>
          {!isAdmin && (
            <button onClick={(e) => { e.stopPropagation(); handleToggleFavorite(asset); }}
              className={cn("absolute top-2 right-2 p-1.5 rounded-full transition-all shadow-sm", asset.is_favorited ? "bg-amber-500 text-white" : "bg-card/80 text-muted-foreground hover:bg-card hover:text-amber-500")}>
              <Star className="h-3 w-3" fill={asset.is_favorited ? "currentColor" : "none"} />
            </button>
          )}
        </div>
        <div className="p-3.5">
          <p className="text-sm font-semibold truncate mb-0.5">{getDisplayName(asset)}</p>
          {subject && subject !== getDisplayName(asset) && <p className="text-[11px] text-muted-foreground truncate mb-1">Subject: {subject}</p>}
          <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground/60">
            <Clock className="h-3 w-3" />
            {timeAgo(asset.updated_at)}
            {(asset.form_data?.projectName || asset.project_name) && (
              <><span className="text-muted-foreground/30">·</span><span className="truncate">{asset.form_data?.projectName || asset.project_name}</span></>
            )}
          </div>
          {asset.last_sent_at && (
            <p className="text-[10px] text-muted-foreground/50 mt-0.5 flex items-center gap-1"><Send className="h-2.5 w-2.5" /> Last sent {timeAgo(asset.last_sent_at)}</p>
          )}
          {asset.tags && asset.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-1.5">
              {asset.tags.map(tag => <Badge key={tag} variant="outline" className="text-[9px] px-1.5 py-0 h-4 text-muted-foreground/70">{tag}</Badge>)}
            </div>
          )}
          <div className="flex items-center gap-1.5 mt-3 pt-3 border-t border-border">
            {isAdmin ? (
              <Button size="sm" className="flex-1 h-8 text-xs gap-1.5" disabled={importing === asset.id} onClick={() => handleImport(asset)}>
                <Copy className="h-3.5 w-3.5" /> {importing === asset.id ? "Importing..." : "Import"}
              </Button>
            ) : (
              <>
                <Button size="sm" variant="outline" className="flex-1 h-8 text-xs gap-1.5" onClick={() => navigate(openUrl)}>Edit</Button>
                <Button size="sm" variant="outline" className="h-8 text-xs gap-1 px-2.5" onClick={() => handleQuickSend(asset)} title="Quick send"><Send className="h-3.5 w-3.5" /></Button>
                <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={() => handleDuplicate(asset)} title="Duplicate"><Copy className="h-3.5 w-3.5" /></Button>
                <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0 text-destructive hover:text-destructive hover:bg-destructive/10" disabled={deleting === asset.id} onClick={() => handleDelete(asset.id)} title="Delete"><Trash2 className="h-3.5 w-3.5" /></Button>
              </>
            )}
          </div>
        </div>
      </div>
    );
  };

  // ── Template row (list) ────────────────────────────────────────────
  const TemplateRowList = ({ asset }: { asset: SavedAsset }) => {
    const preview = getPreviewImage(asset);
    const openUrl = `/dashboard/email-builder?saved=${asset.id}`;
    return (
      <div className="group flex items-center gap-4 p-3 rounded-xl border border-border bg-card hover:border-primary/30 hover:shadow-sm transition-all">
        <div className="h-14 w-20 rounded-lg bg-muted/30 overflow-hidden shrink-0 cursor-pointer" onClick={() => navigate(openUrl)}>
          {preview ? <img src={preview} alt="" className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center"><Mail className="h-5 w-5 text-muted-foreground/15" /></div>}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="text-sm font-semibold truncate cursor-pointer hover:text-primary" onClick={() => navigate(openUrl)}>{getDisplayName(asset)}</p>
            {asset.is_favorited && <Star className="h-3 w-3 text-amber-500 shrink-0" fill="currentColor" />}
          </div>
          <div className="flex items-center gap-2 text-[11px] text-muted-foreground/60 mt-0.5">
            <span>{timeAgo(asset.updated_at)}</span>
            {(asset.form_data?.projectName || asset.project_name) && <><span>·</span><span className="truncate">{asset.form_data?.projectName || asset.project_name}</span></>}
            {asset.last_sent_at && <><span>·</span><span className="flex items-center gap-0.5"><Send className="h-2.5 w-2.5" /> Sent {timeAgo(asset.last_sent_at)}</span></>}
          </div>
          {asset.tags && asset.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-1">
              {asset.tags.map(tag => <Badge key={tag} variant="outline" className="text-[9px] px-1.5 py-0 h-4 text-muted-foreground/70">{tag}</Badge>)}
            </div>
          )}
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <Button size="sm" variant="outline" className="h-7 text-xs gap-1 px-2" onClick={() => handleQuickSend(asset)}><Send className="h-3 w-3" /> Send</Button>
          <Button size="sm" variant="outline" className="h-7 text-xs px-2" onClick={() => navigate(openUrl)}>Edit</Button>
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleToggleFavorite(asset)}>
            <Star className={cn("h-3 w-3", asset.is_favorited ? "text-amber-500" : "text-muted-foreground")} fill={asset.is_favorited ? "currentColor" : "none"} />
          </Button>
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleDuplicate(asset)}><Copy className="h-3 w-3" /></Button>
          <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive" disabled={deleting === asset.id} onClick={() => handleDelete(asset.id)}><Trash2 className="h-3 w-3" /></Button>
        </div>
      </div>
    );
  };

  // ── Email templates content ────────────────────────────────────────
  const EmailTemplatesContent = () => (
    <div className="space-y-8">
      {/* Create new */}
      <section>
        <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground mb-3">Create New</p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {CREATE_OPTIONS.map((opt) => (
            <button key={opt.key} onClick={() => navigate(opt.url)} className="group flex items-center gap-3 p-4 rounded-xl border border-border bg-card hover:border-primary/40 hover:bg-accent/30 transition-all text-left">
              <div className={cn("h-10 w-10 rounded-lg flex items-center justify-center shrink-0", opt.bg)}>
                <opt.icon className={cn("h-4.5 w-4.5", opt.color)} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 mb-0.5">
                  <span className="text-sm font-semibold">{opt.title}</span>
                  {opt.badge && <Badge variant="secondary" className="text-[9px] h-4 px-1.5 py-0">{opt.badge}</Badge>}
                </div>
                <p className="text-[11px] text-muted-foreground leading-snug">{opt.desc}</p>
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground/30 group-hover:text-primary/60 transition-colors shrink-0" />
            </button>
          ))}
        </div>
      </section>

      {/* Your Templates */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">Your Templates ({filteredAssets.length})</p>
        </div>
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 mb-4">
          <div className="relative flex-1 w-full sm:max-w-xs">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground/50" />
            <Input placeholder="Search templates…" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="pl-8 h-8 text-xs" />
          </div>
          <Select value={sortBy} onValueChange={(v: SortOption) => setSortBy(v)}>
            <SelectTrigger className="h-8 w-[140px] text-xs"><SelectValue placeholder="Sort by" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="recent">Recently Edited</SelectItem>
              <SelectItem value="name">Name A-Z</SelectItem>
              <SelectItem value="project">Project Name</SelectItem>
            </SelectContent>
          </Select>
          <div className="flex items-center border border-border rounded-lg overflow-hidden h-8">
            <button onClick={() => setViewMode("grid")} className={cn("px-2 h-full flex items-center transition-colors", viewMode === "grid" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted")}>
              <LayoutGrid className="h-3.5 w-3.5" />
            </button>
            <button onClick={() => setViewMode("list")} className={cn("px-2 h-full flex items-center transition-colors", viewMode === "list" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted")}>
              <List className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        {allTags.length > 0 && (
          <div className="flex items-center gap-1.5 flex-wrap mb-4">
            <Tag className="h-3 w-3 text-muted-foreground/40 shrink-0" />
            <button onClick={() => setActiveTagFilter(null)} className={cn("px-2 py-0.5 text-[10px] font-semibold rounded-full border transition-all", !activeTagFilter ? "bg-primary text-primary-foreground border-primary" : "border-border text-muted-foreground hover:border-primary/30")}>All</button>
            {allTags.map(tag => (
              <button key={tag} onClick={() => setActiveTagFilter(prev => prev === tag ? null : tag)} className={cn("px-2 py-0.5 text-[10px] font-semibold rounded-full border transition-all", activeTagFilter === tag ? "bg-primary text-primary-foreground border-primary" : "border-border text-muted-foreground hover:border-primary/30")}>{tag}</button>
            ))}
          </div>
        )}

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="rounded-xl border border-border bg-muted/30 animate-pulse">
                <div className="h-40 bg-muted/50 rounded-t-xl" />
                <div className="p-4 space-y-2"><div className="h-4 bg-muted/50 rounded w-3/4" /><div className="h-3 bg-muted/50 rounded w-1/2" /></div>
              </div>
            ))}
          </div>
        ) : filteredAssets.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 border-2 border-dashed border-border rounded-xl text-center">
            <Mail className="h-10 w-10 text-muted-foreground/20 mb-3" />
            <p className="text-sm font-medium text-muted-foreground">{searchQuery || activeTagFilter ? "No templates match your filters" : "No templates saved yet"}</p>
            <p className="text-xs text-muted-foreground/60 mt-1 mb-4 max-w-xs">{searchQuery || activeTagFilter ? "Try adjusting your search or clearing filters." : "Create one above and save it to find it here."}</p>
            {!searchQuery && !activeTagFilter && (
              <Button variant="outline" size="sm" className="gap-1.5" onClick={() => navigate("/dashboard/email-builder?template=project-email")}><Plus className="h-3.5 w-3.5" /> Create Email</Button>
            )}
          </div>
        ) : viewMode === "grid" ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredAssets.map(asset => <TemplateCardGrid key={asset.id} asset={asset} />)}
          </div>
        ) : (
          <div className="space-y-2">
            {filteredAssets.map(asset => <TemplateRowList key={asset.id} asset={asset} />)}
          </div>
        )}
      </section>

      {/* Admin templates */}
      {adminTemplates.length > 0 && (
        <section>
          <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground mb-1">Company Templates ({adminTemplates.length})</p>
          <p className="text-xs text-muted-foreground/60 mb-4">Import admin-created templates into your collection</p>
          <div className={viewMode === "grid" ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4" : "space-y-2"}>
            {adminTemplates.map(asset => (
              viewMode === "grid" ? <TemplateCardGrid key={asset.id} asset={asset} isAdmin /> : (
                <div key={asset.id} className="flex items-center gap-4 p-3 rounded-xl border border-border bg-card">
                  <div className="h-14 w-20 rounded-lg bg-muted/30 overflow-hidden shrink-0">
                    {getPreviewImage(asset) ? <img src={getPreviewImage(asset)!} alt="" className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center"><Mail className="h-5 w-5 text-muted-foreground/15" /></div>}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold truncate">{getDisplayName(asset)}</p>
                    <p className="text-[11px] text-muted-foreground/60">{timeAgo(asset.updated_at)} · {asset.project_name}</p>
                  </div>
                  <Button size="sm" className="h-7 text-xs gap-1 shrink-0" disabled={importing === asset.id} onClick={() => handleImport(asset)}>
                    <Copy className="h-3 w-3" /> {importing === asset.id ? "..." : "Import"}
                  </Button>
                </div>
              )
            ))}
          </div>
        </section>
      )}
    </div>
  );

  return (
    <DashboardLayout>
      <div className="flex flex-col h-full bg-background">
        {/* Header */}
        <div className="border-b border-border bg-card px-6 py-5 shrink-0">
          <div className="flex items-center justify-between max-w-5xl mx-auto">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-xl bg-primary/10 flex items-center justify-center">
                <Megaphone className="h-4.5 w-4.5 text-primary" />
              </div>
              <div>
                <h1 className="text-lg font-bold tracking-tight">Marketing Hub</h1>
                <p className="text-xs text-muted-foreground">Email templates, pitch decks & social content</p>
              </div>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-auto">
          <div className="max-w-5xl mx-auto p-6">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="mb-6 bg-muted/60">
                <TabsTrigger value="emails" className="gap-1.5 data-[state=active]:shadow-sm">
                  <Mail className="h-3.5 w-3.5" />
                  <span>Email Templates</span>
                  <Badge variant="secondary" className="text-[9px] h-4 px-1.5 py-0 ml-1">{assets.length}</Badge>
                </TabsTrigger>
                <TabsTrigger value="decks" className="gap-1.5 data-[state=active]:shadow-sm">
                  <Presentation className="h-3.5 w-3.5" />
                  <span>Pitch Decks</span>
                </TabsTrigger>
                <TabsTrigger value="social" className="gap-1.5 data-[state=active]:shadow-sm">
                  <Share2 className="h-3.5 w-3.5" />
                  <span>Social Posts</span>
                </TabsTrigger>
              </TabsList>

              <TabsContent value="emails">
                <EmailTemplatesContent />
              </TabsContent>

              <TabsContent value="decks">
                <PitchDecksList />
              </TabsContent>

              <TabsContent value="social">
                <SocialPostGenerator />
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>

      {/* Quick Send Dialog */}
      <Dialog open={!!quickSendAsset} onOpenChange={(open) => !open && setQuickSendAsset(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><Send className="h-4 w-4" /> Quick Send</DialogTitle>
          </DialogHeader>
          {quickSendAsset && (
            <div className="space-y-4">
              <div className="p-3 rounded-lg bg-muted/50 border border-border">
                <p className="text-sm font-medium truncate">{getDisplayName(quickSendAsset)}</p>
                <p className="text-xs text-muted-foreground truncate mt-0.5">{quickSendAsset.form_data?.projectName || quickSendAsset.project_name}</p>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Select a lead</label>
                <div className="relative">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input placeholder="Search by name or email..." value={quickSendSearch} onChange={(e) => setQuickSendSearch(e.target.value)} className="pl-9" />
                </div>
              </div>
              <div className="max-h-56 overflow-y-auto border rounded-lg divide-y divide-border">
                {quickSendLeadsLoading ? (
                  <div className="flex items-center justify-center py-8"><Loader2 className="h-4 w-4 animate-spin text-muted-foreground" /></div>
                ) : filteredQuickSendLeads.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-8 text-muted-foreground"><Users className="h-5 w-5 mb-1" /><p className="text-xs">No leads found</p></div>
                ) : (
                  filteredQuickSendLeads.map((lead) => (
                    <button key={lead.id} onClick={() => setQuickSendSelectedLead(lead.id)}
                      className={cn("w-full flex items-center gap-3 px-3 py-2.5 text-left hover:bg-muted/50 transition-colors", quickSendSelectedLead === lead.id && "bg-primary/10 border-l-2 border-l-primary")}>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{lead.first_name} {lead.last_name}</p>
                        <p className="text-xs text-muted-foreground truncate">{lead.email}</p>
                      </div>
                      {quickSendSelectedLead === lead.id && <div className="h-2 w-2 rounded-full bg-primary shrink-0" />}
                    </button>
                  ))
                )}
              </div>
              <Button className="w-full gap-2" disabled={!quickSendSelectedLead || quickSendSending} onClick={handleQuickSendConfirm}>
                {quickSendSending ? <><Loader2 className="h-4 w-4 animate-spin" /> Sending...</> : <><Send className="h-4 w-4" /> Send Email</>}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
