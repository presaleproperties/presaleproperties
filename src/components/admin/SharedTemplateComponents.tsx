import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  Mail, Send, Eye, Copy, Trash2, Clock, Plus, Search,
  Loader2, User, X, ChevronRight, Pencil, Check,
} from "lucide-react";
import type { SavedAsset } from "@/lib/emailTemplateHelpers";
import { timeAgo, getDisplayName, getSavedHtml } from "@/lib/emailTemplateHelpers";

// ── Template Card ──
interface TemplateCardProps {
  asset: SavedAsset;
  onSend: (asset: SavedAsset) => void;
  onPreview: (asset: SavedAsset) => void;
  onDelete: (id: string) => void;
  onDuplicate: (asset: SavedAsset) => void;
  onRename?: (id: string, newName: string) => void;
  deleting: string | null;
  /** If true, shows a selectable style instead of action buttons */
  selectable?: boolean;
  selected?: boolean;
  onSelect?: (asset: SavedAsset) => void;
}

export function TemplateCard({
  asset, onSend, onPreview, onDelete, onDuplicate, onRename, deleting,
  selectable, selected, onSelect,
}: TemplateCardProps) {
  const navigate = useNavigate();
  const fd = asset.form_data || {};
  const isEmail = fd._type === "ai-email" || !fd.plans;
  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState("");
  const editRef = useRef<HTMLInputElement>(null);

  const startRename = (e: React.MouseEvent) => {
    e.stopPropagation();
    setEditName(getDisplayName(asset));
    setEditing(true);
    setTimeout(() => editRef.current?.select(), 50);
  };

  const commitRename = () => {
    const trimmed = editName.trim();
    if (trimmed && trimmed !== asset.name && onRename) {
      onRename(asset.id, trimmed);
    }
    setEditing(false);
  };

  return (
    <div
      className={cn(
        "group relative rounded-xl border bg-card overflow-hidden hover:border-primary/30 hover:shadow-md transition-all",
        selectable && selected ? "border-primary ring-1 ring-primary/20 bg-primary/5" : "border-border"
      )}
    >
      <div
        className="h-44 bg-muted/30 relative cursor-pointer overflow-hidden"
        onClick={() => selectable && onSelect ? onSelect(asset) : onPreview(asset)}
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
        {selectable && selected && (
          <div className="absolute top-2 right-2 h-5 w-5 rounded-full bg-primary flex items-center justify-center">
            <svg className="h-3 w-3 text-primary-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
          </div>
        )}
        {!selectable && (
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all flex items-center justify-center opacity-0 group-hover:opacity-100">
            <Button size="sm" variant="secondary" className="gap-1.5 shadow-lg">
              <Eye className="h-3.5 w-3.5" /> Preview
            </Button>
          </div>
        )}
      </div>

      <div className="p-3.5">
        {editing ? (
          <div className="flex items-center gap-1">
            <input
              ref={editRef}
              value={editName}
              onChange={e => setEditName(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter") commitRename(); if (e.key === "Escape") setEditing(false); }}
              onBlur={commitRename}
              className="text-sm font-semibold bg-transparent border-b border-primary/40 outline-none w-full py-0.5"
              autoFocus
            />
            <button onClick={commitRename} className="shrink-0 h-5 w-5 rounded flex items-center justify-center hover:bg-muted">
              <Check className="h-3 w-3 text-primary" />
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-1.5 group/name">
            <p className="text-sm font-semibold truncate mb-0.5">{getDisplayName(asset)}</p>
            {onRename && !selectable && (
              <button onClick={startRename} className="shrink-0 h-5 w-5 rounded flex items-center justify-center opacity-0 group-hover/name:opacity-100 hover:bg-muted transition-opacity" title="Rename">
                <Pencil className="h-3 w-3 text-muted-foreground" />
              </button>
            )}
          </div>
        )}
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

        {!selectable && (
          <div className="flex items-center gap-1.5 pt-3 border-t border-border">
            <Button size="sm" className="flex-1 h-8 text-xs gap-1.5" onClick={() => onSend(asset)}>
              <Send className="h-3.5 w-3.5" /> Send
            </Button>
            <Button size="sm" variant="outline" className="h-8 px-2.5 text-xs gap-1" onClick={() => navigate(`/admin/email-builder?saved=${asset.id}`)}>
              Edit
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={() => onDuplicate(asset)} title="Duplicate">
              <Copy className="h-3.5 w-3.5" />
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0 text-destructive hover:text-destructive hover:bg-destructive/10" disabled={deleting === asset.id} onClick={() => onDelete(asset.id)} title="Delete">
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Preview Dialog ──
export function TemplatePreviewDialog({ asset, open, onOpenChange }: { asset: SavedAsset | null; open: boolean; onOpenChange: (v: boolean) => void }) {
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

// ── Quick Send Dialog ──
export function TemplateQuickSendDialog({
  asset, open, onOpenChange, onSent,
}: {
  asset: SavedAsset | null; open: boolean; onOpenChange: (v: boolean) => void; onSent: () => void;
}) {
  const [query, setQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Array<{ id: string; name: string; firstName?: string; email: string; source: string }>>([]);
  const [searching, setSearching] = useState(false);
  const [recipients, setRecipients] = useState<Array<{ email: string; name: string; firstName?: string }>>([]);
  const [manualEmail, setManualEmail] = useState("");
  const [sending, setSending] = useState(false);
  const [subjectLine, setSubjectLine] = useState("");
  const searchTimer = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    if (!open) { setQuery(""); setSearchResults([]); setRecipients([]); setManualEmail(""); }
    if (open && asset) {
      const fd = asset.form_data;
      setSubjectLine(fd?.vars?.subjectLine || fd?.copy?.subjectLine || asset.name || "");
    }
  }, [open, asset]);

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
    if (!recipients.length || !asset) return;
    setSending(true);
    try {
      const html = getSavedHtml(asset);
      const subject = subjectLine.trim() || asset.name;
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

      await (supabase as any).from("campaign_templates").update({ last_sent_at: new Date().toISOString() }).eq("id", asset.id);

      // Sync to DealsFlow (fire-and-forget)
      const templateName = getDisplayName(asset);
      for (const r of recipients) {
        fetch("https://cplycyfgywxhlecazvra.supabase.co/functions/v1/lead-webhook?source=email-send", {
          method: "POST",
          headers: { "Content-Type": "application/json", "X-Webhook-Secret": "presale-leads-2026" },
          body: JSON.stringify({ name: r.name || "", email: r.email || "", source: "marketing-hub", project: templateName }),
        }).catch(() => {});
      }

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
          <div className="space-y-2">
            <p className="text-xs font-semibold text-muted-foreground">Add Recipients</p>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search leads by name or email…" className="pl-9 h-9 text-sm" />
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
                  onKeyDown={e => e.key === "Enter" && addManual()} placeholder="Or type an email…" className="pl-9 h-8 text-xs" />
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
          <Button className="w-full h-10 gap-2 font-semibold" onClick={handleSend} disabled={sending || recipients.length === 0}>
            {sending ? <><Loader2 className="h-4 w-4 animate-spin" />Sending…</> : <><Send className="h-4 w-4" />Send to {recipients.length} recipient{recipients.length !== 1 ? "s" : ""}</>}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
