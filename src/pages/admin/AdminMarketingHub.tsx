import { useState, useEffect, useMemo, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  Mail, FileText, Plus, Clock, Trash2, Copy, Eye, Send,
  ChevronRight, Building2, Star, Megaphone, ExternalLink,
  Search, Loader2, User, X,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { buildAiEmailHtml, type AiEmailCopy } from "@/components/admin/AiEmailTemplate";

interface SavedAsset {
  id: string;
  name: string;
  project_name: string;
  thumbnail_url: string | null;
  form_data: any;
  created_at: string;
  updated_at: string;
  tags: string[] | null;
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

function getDisplayName(asset: SavedAsset): string {
  return asset.form_data?.copy?.subjectLine || asset.name;
}

function getSavedHtml(asset: SavedAsset): string {
  const fd = asset.form_data;
  // Use the exact saved/rendered HTML if available
  if (fd?.finalHtml) return fd.finalHtml;
  // Fallback: rebuild from vars
  try {
    if (!fd?.vars) return "";
    const copy: AiEmailCopy = {
      headline: fd.vars?.headline || "",
      bodyCopy: fd.vars?.bodyCopy || "",
      subjectLine: fd.vars?.subjectLine || "",
      previewText: fd.vars?.previewText || "",
      incentiveText: fd.vars?.incentiveText || "",
      projectName: fd.vars?.projectName || asset.project_name || "",
      city: fd.vars?.city || "",
      neighborhood: fd.vars?.neighborhood || "",
      developerName: fd.vars?.developerName || "",
      startingPrice: fd.vars?.startingPrice || "",
      deposit: fd.vars?.deposit || "",
      completion: fd.vars?.completion || "",
    };
    return buildAiEmailHtml(copy);
  } catch {
    return "";
  }
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
    url: "/admin/email-builder?template=project-email",
  },
  {
    key: "exclusive-offer",
    title: "Exclusive Offer",
    desc: "High-urgency promo with incentive spotlight",
    icon: Star,
    color: "text-amber-600",
    bg: "bg-amber-500/10",
    badge: "Promo",
    url: "/admin/email-builder?template=exclusive-offer",
  },
  {
    key: "blank-email",
    title: "Blank Email",
    desc: "Start from scratch",
    icon: Mail,
    color: "text-muted-foreground",
    bg: "bg-muted/40",
    badge: null,
    url: "/admin/email-builder?template=blank",
  },
];

// ── Quick Send Dialog ──────────────────────────────────────────
function QuickSendDialog({
  asset,
  open,
  onOpenChange,
  onSent,
}: {
  asset: SavedAsset | null;
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onSent: () => void;
}) {
  const [query, setQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Array<{ id: string; name: string; firstName?: string; email: string; source: string }>>([]);
  const [searching, setSearching] = useState(false);
  const [recipients, setRecipients] = useState<Array<{ email: string; name: string; firstName?: string }>>([]);
  const [manualEmail, setManualEmail] = useState("");
  const [sending, setSending] = useState(false);
  const searchTimer = useRef<ReturnType<typeof setTimeout>>();

  // Reset on close
  useEffect(() => {
    if (!open) {
      setQuery("");
      setSearchResults([]);
      setRecipients([]);
      setManualEmail("");
    }
  }, [open]);

  // Debounced lead search
  useEffect(() => {
    if (!query || query.length < 2) { setSearchResults([]); return; }
    clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(async () => {
      setSearching(true);
      const term = `%${query}%`;
      const [leadsRes, clientsRes] = await Promise.all([
        supabase.from("project_leads").select("id, name, email, phone").or(`name.ilike.${term},email.ilike.${term}`).limit(8),
        supabase.from("clients").select("id, first_name, last_name, email").or(`first_name.ilike.${term},last_name.ilike.${term},email.ilike.${term}`).limit(8),
      ]);
      const mapped: typeof searchResults = [];
      const seen = new Set<string>();
      if (leadsRes.data) for (const l of leadsRes.data) {
        if (!seen.has(l.email)) { seen.add(l.email); mapped.push({ id: l.id, name: l.name, firstName: l.name?.trim().split(/\s+/)[0], email: l.email, source: "lead" }); }
      }
      if (clientsRes.data) for (const c of clientsRes.data) {
        if (!seen.has(c.email)) { seen.add(c.email); mapped.push({ id: c.id, name: [c.first_name, c.last_name].filter(Boolean).join(" ") || c.email, firstName: c.first_name ?? undefined, email: c.email, source: "client" }); }
      }
      setSearchResults(mapped);
      setSearching(false);
    }, 300);
    return () => clearTimeout(searchTimer.current);
  }, [query]);

  const addRecipient = (r: typeof searchResults[0]) => {
    if (recipients.some(rec => rec.email === r.email)) return;
    setRecipients(prev => [...prev, { email: r.email, name: r.name, firstName: r.firstName }]);
    setQuery(""); setSearchResults([]);
  };

  const addManual = () => {
    const email = manualEmail.trim().toLowerCase();
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return;
    if (recipients.some(r => r.email === email)) return;
    setRecipients(prev => [...prev, { email, name: email.split("@")[0], firstName: email.split("@")[0] }]);
    setManualEmail("");
  };

  const handleSend = async () => {
    if (!recipients.length) { toast.error("Add at least one recipient"); return; }
    if (!asset) return;
    setSending(true);
    try {
      const html = getSavedHtml(asset);
      const subject = asset.form_data?.vars?.subjectLine || asset.form_data?.copy?.subjectLine || asset.name;
      if (!html || !subject) { toast.error("Template has no content"); setSending(false); return; }

      const { data, error } = await supabase.functions.invoke("send-builder-email", {
        body: {
          subject,
          html,
          recipients: recipients.map(r => ({ email: r.email, name: r.name, firstName: r.firstName })),
        },
      });
      if (error) throw error;
      toast.success(`✅ Sent to ${data.sent} recipient${data.sent > 1 ? "s" : ""}`);

      // Update last_sent_at
      await (supabase as any).from("campaign_templates").update({ last_sent_at: new Date().toISOString() }).eq("id", asset.id);

      onSent();
      onOpenChange(false);
    } catch (e: any) {
      toast.error(e.message || "Failed to send");
    } finally {
      setSending(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Send className="h-4 w-4 text-primary" />
            Quick Send: {asset ? getDisplayName(asset) : ""}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Search leads */}
          <div className="space-y-2">
            <p className="text-xs font-semibold text-muted-foreground">Add Recipients</p>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder="Search leads by name or email…"
                className="pl-9 h-9 text-sm"
              />
              {searching && <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 animate-spin text-muted-foreground" />}
            </div>

            {searchResults.length > 0 && (
              <div className="border border-border rounded-lg max-h-[160px] overflow-y-auto divide-y divide-border bg-background shadow-sm">
                {searchResults.map(r => {
                  const added = recipients.some(rec => rec.email === r.email);
                  return (
                    <button key={r.id} onClick={() => addRecipient(r)} disabled={added}
                      className={cn("w-full text-left px-3 py-2 flex items-center gap-3 text-sm transition-colors", added ? "opacity-40" : "hover:bg-muted/50")}>
                      <div className="h-7 w-7 rounded-full bg-muted flex items-center justify-center shrink-0">
                        <User className="h-3.5 w-3.5 text-muted-foreground" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-xs truncate">{r.name}</p>
                        <p className="text-[11px] text-muted-foreground truncate">{r.email}</p>
                      </div>
                      <Badge variant="outline" className="text-[9px] shrink-0">{r.source}</Badge>
                    </button>
                  );
                })}
              </div>
            )}

            <div className="flex gap-2">
              <div className="relative flex-1">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                <Input value={manualEmail} onChange={e => setManualEmail(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && addManual()}
                  placeholder="Or type an email…" className="pl-9 h-8 text-xs" />
              </div>
              <Button variant="outline" size="sm" className="h-8 text-xs gap-1" onClick={addManual}>
                <Plus className="h-3 w-3" /> Add
              </Button>
            </div>

            {recipients.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {recipients.map(r => (
                  <Badge key={r.email} variant="secondary" className="gap-1 pr-1 text-xs font-normal">
                    <span className="truncate max-w-[160px]">{r.name}</span>
                    <button onClick={() => setRecipients(prev => prev.filter(p => p.email !== r.email))}
                      className="ml-0.5 h-4 w-4 rounded-full hover:bg-destructive/20 flex items-center justify-center">
                      <X className="h-2.5 w-2.5" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
          </div>

          {/* Send button */}
          <Button className="w-full h-10 gap-2 font-semibold" onClick={handleSend} disabled={sending || recipients.length === 0}>
            {sending ? <><Loader2 className="h-4 w-4 animate-spin" />Sending…</> : <><Send className="h-4 w-4" />Send to {recipients.length} recipient{recipients.length !== 1 ? "s" : ""}</>}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ── Preview Dialog ──────────────────────────────────────────────
function PreviewDialog({ asset, open, onOpenChange }: { asset: SavedAsset | null; open: boolean; onOpenChange: (v: boolean) => void }) {
  const html = asset ? getSavedHtml(asset) : "";
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>{asset ? getDisplayName(asset) : ""}</DialogTitle>
        </DialogHeader>
        {asset?.form_data?.vars?.subjectLine && (
          <p className="text-sm"><span className="font-medium">Subject:</span> {asset.form_data.vars.subjectLine}</p>
        )}
        <iframe
          srcDoc={html}
          className="w-full border rounded-lg bg-white"
          style={{ height: "60vh" }}
          sandbox="allow-same-origin"
          title="Template Preview"
        />
        <div className="flex justify-end gap-2 pt-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>Close</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ── Main Component ──────────────────────────────────────────────
export default function AdminMarketingHub() {
  const navigate = useNavigate();
  const [emailAssets, setEmailAssets] = useState<SavedAsset[]>([]);
  const [campaignAssets, setCampaignAssets] = useState<SavedAsset[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"emails" | "flyers">("emails");
  const [activeTagFilter, setActiveTagFilter] = useState<string | null>(null);
  const [sendAsset, setSendAsset] = useState<SavedAsset | null>(null);
  const [previewAsset, setPreviewAsset] = useState<SavedAsset | null>(null);

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

  const handleDelete = async (id: string) => {
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

  const filteredAssets = useMemo(() => {
    const base = activeTab === "emails" ? emailAssets : campaignAssets;
    if (!activeTagFilter) return base;
    return base.filter(a => a.tags?.includes(activeTagFilter));
  }, [activeTab, emailAssets, campaignAssets, activeTagFilter]);

  return (
    <AdminLayout>
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
                <p className="text-xs text-muted-foreground">Create and manage email campaigns</p>
              </div>
            </div>
            <Badge variant="outline" className="text-[11px] px-2.5 py-1">
              {emailAssets.length + campaignAssets.length} saved
            </Badge>
          </div>
        </div>

        <div className="flex-1 overflow-auto">
          <div className="max-w-5xl mx-auto p-6 space-y-8">
            {/* Create new */}
            <section>
              <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground mb-3">Create New</p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {CREATE_OPTIONS.map((opt) => (
                  <button
                    key={opt.key}
                    onClick={() => navigate(opt.url)}
                    className="group flex items-center gap-3 p-4 rounded-xl border border-border bg-card hover:border-primary/40 hover:bg-accent/30 transition-all text-left"
                  >
                    <div className={cn("h-10 w-10 rounded-lg flex items-center justify-center shrink-0", opt.bg)}>
                      <opt.icon className={cn("h-4.5 w-4.5", opt.color)} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 mb-0.5">
                        <span className="text-sm font-semibold">{opt.title}</span>
                        {opt.badge && (
                          <Badge variant="secondary" className="text-[9px] h-4 px-1.5 py-0">{opt.badge}</Badge>
                        )}
                      </div>
                      <p className="text-[11px] text-muted-foreground leading-snug">{opt.desc}</p>
                    </div>
                    <ChevronRight className="h-4 w-4 text-muted-foreground/30 group-hover:text-primary/60 transition-colors shrink-0" />
                  </button>
                ))}
              </div>
            </section>

            {/* Saved work */}
            <section>
              <div className="flex items-center justify-between mb-4">
                <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">Saved Work</p>
                <div className="flex items-center bg-muted rounded-lg p-0.5 gap-0.5">
                  {(["emails", "flyers"] as const).map(tab => (
                    <button
                      key={tab}
                      onClick={() => setActiveTab(tab)}
                      className={cn(
                        "px-3 py-1 text-[11px] font-semibold rounded-md transition-all capitalize",
                        activeTab === tab ? "bg-card shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"
                      )}
                    >
                      {tab} ({tab === "emails" ? emailAssets.length : campaignAssets.length})
                    </button>
                  ))}
                </div>
              </div>

              {loading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="rounded-xl border border-border bg-muted/30 animate-pulse">
                      <div className="h-44 bg-muted/50 rounded-t-xl" />
                      <div className="p-4 space-y-2">
                        <div className="h-4 bg-muted/50 rounded w-3/4" />
                        <div className="h-3 bg-muted/50 rounded w-1/2" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : filteredAssets.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 border-2 border-dashed border-border rounded-xl text-center">
                  {activeTab === "emails"
                    ? <Mail className="h-10 w-10 text-muted-foreground/20 mb-3" />
                    : <FileText className="h-10 w-10 text-muted-foreground/20 mb-3" />}
                  <p className="text-sm font-medium text-muted-foreground">No {activeTab} saved yet</p>
                  <p className="text-xs text-muted-foreground/60 mt-1 mb-4 max-w-xs">
                    Create one above and save it to find it here.
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-1.5"
                    onClick={() => navigate("/admin/email-builder?template=project-email")}
                  >
                    <Plus className="h-3.5 w-3.5" />
                    Create {activeTab === "emails" ? "Email" : "Flyer"}
                  </Button>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredAssets.map(asset => {
                    const previewHtml = getSavedHtml(asset);
                    const fd = asset.form_data || {};
                    const isEmail = fd._type === "ai-email" || !fd.plans;
                    const openUrl = `/admin/email-builder?saved=${asset.id}`;

                    return (
                      <div
                        key={asset.id}
                        className="group relative rounded-xl border border-border bg-card overflow-hidden hover:border-primary/30 hover:shadow-md transition-all"
                      >
                        {/* Preview image */}
                        <div
                          className="h-44 bg-muted/30 relative cursor-pointer overflow-hidden"
                          onClick={() => setPreviewAsset(asset)}
                        >
                          {(asset.thumbnail_url || fd.heroImage) ? (
                            <img
                              src={asset.thumbnail_url || fd.heroImage}
                              alt={asset.name}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <Mail className="h-10 w-10 text-muted-foreground/15" />
                            </div>
                          )}
                          {/* Type badge */}
                          <div className="absolute top-2 left-2">
                            <Badge className={cn(
                              "text-[9px] px-1.5 py-0.5 shadow-sm",
                              isEmail
                                ? "bg-emerald-500/90 text-white hover:bg-emerald-500/90"
                                : "bg-violet-500/90 text-white hover:bg-violet-500/90"
                            )}>
                              {isEmail ? "Email" : "Flyer"}
                            </Badge>
                          </div>
                          {/* Hover overlay */}
                          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all flex items-center justify-center opacity-0 group-hover:opacity-100">
                            <Button size="sm" variant="secondary" className="gap-1.5 shadow-lg">
                              <Eye className="h-3.5 w-3.5" /> Preview
                            </Button>
                          </div>
                        </div>

                        {/* Info */}
                        <div className="p-3.5">
                          <p className="text-sm font-semibold truncate mb-0.5">{getDisplayName(asset)}</p>
                          <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground/60 mb-1">
                            <Clock className="h-3 w-3" />
                            {timeAgo(asset.updated_at)}
                            {(fd.projectName || fd.vars?.projectName || asset.project_name) && (
                              <>
                                <span className="text-muted-foreground/30">·</span>
                                <span className="truncate">{fd.projectName || fd.vars?.projectName || asset.project_name}</span>
                              </>
                            )}
                          </div>
                          {asset.tags && asset.tags.length > 0 && (
                            <div className="flex flex-wrap gap-1 mb-2">
                              {asset.tags.map(tag => (
                                <Badge key={tag} variant="outline" className="text-[9px] px-1.5 py-0 h-4 text-muted-foreground/70">{tag}</Badge>
                              ))}
                            </div>
                          )}

                          {/* Action buttons */}
                          <div className="flex items-center gap-1.5 pt-3 border-t border-border">
                            <Button
                              size="sm"
                              className="flex-1 h-8 text-xs gap-1.5"
                              onClick={() => setSendAsset(asset)}
                            >
                              <Send className="h-3.5 w-3.5" /> Send
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-8 px-2.5 text-xs gap-1"
                              onClick={() => navigate(openUrl)}
                            >
                              Edit
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 shrink-0"
                              onClick={() => handleDuplicate(asset)}
                              title="Duplicate"
                            >
                              <Copy className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 shrink-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                              disabled={deleting === asset.id}
                              onClick={() => handleDelete(asset.id)}
                              title="Delete"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
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

      {/* Quick Send Dialog */}
      <QuickSendDialog
        asset={sendAsset}
        open={!!sendAsset}
        onOpenChange={(v) => { if (!v) setSendAsset(null); }}
        onSent={fetchAssets}
      />

      {/* Preview Dialog */}
      <PreviewDialog
        asset={previewAsset}
        open={!!previewAsset}
        onOpenChange={(v) => { if (!v) setPreviewAsset(null); }}
      />
    </AdminLayout>
  );
}
