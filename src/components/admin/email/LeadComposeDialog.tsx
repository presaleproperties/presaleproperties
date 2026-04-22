/**
 * LeadComposeDialog
 * ─────────────────────────────────────────────────────────────────────────
 * Unified Gmail-style email composer used everywhere on /admin/leads:
 *   • Single recipient (row Mail icon)
 *   • Bulk recipients (selection bar)
 *   • Manual recipient entry
 *
 * Features
 *  • 3 modes: Plain text · Rich text (Tiptap) · Use template
 *  • Recent + Favorited template quick-load
 *  • Agent signature picker (defaults to first active team member)
 *  • localStorage drafts (per recipient list hash) — survives accidental close
 *  • Cmd/Ctrl+Enter to send · Esc to close
 *  • Success state with "Send another" / "Done"
 *  • Auto-progresses lead_status: new → contacted on successful send
 */
import { useEffect, useMemo, useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Send,
  Loader2,
  Eye,
  Code2,
  Pencil,
  Wand2,
  FileText,
  Save,
  UserCircle2,
  CheckCircle2,
  Mail,
  X,
  Plus,
  Sparkles,
  Star,
  Clock,
  Users,
  History,
  ChevronDown,
  ChevronRight,
  PanelRightOpen,
  PanelRightClose,
  ChevronLeft,
  Smartphone,
  Monitor,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { getSavedHtml, type SavedAsset } from "@/lib/emailTemplateHelpers";
import { appendSignatureToHtml, type SignatureAgent } from "@/lib/emailSignature";
import { RichTextEditor } from "./RichTextEditor";
import { AiAssistMenu } from "./AiAssistMenu";
import { SubjectSuggestions } from "./SubjectSuggestions";
import { SentEmailsList } from "./SentEmailsList";
import { UndoSendBanner, BulkSendProgress } from "./UndoSendBanner";
import { TemplatePicker } from "./TemplatePicker";

// ─── Types ────────────────────────────────────────────────────────────────────
export interface ComposeRecipient {
  id?: string;
  email: string;
  name?: string | null;
  /** Lead row id for status auto-progress (project_leads.id). Optional. */
  leadId?: string;
}

interface AgentOption {
  id: string;
  full_name: string;
  title: string | null;
  photo_url: string | null;
  phone: string | null;
  email: string | null;
}

interface TemplateOption {
  id: string;
  name: string;
  project_name: string | null;
  form_data: any;
  is_favorited?: boolean | null;
  last_sent_at?: string | null;
  updated_at: string;
}

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  recipients: ComposeRecipient[];
  /** When true, show the search box for adding more recipients. */
  allowAddRecipients?: boolean;
  /** Optional label for email_logs/template_type. */
  campaignName?: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
const PLAIN_HTML_WRAPPER = (body: string, firstName: string) =>
  `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head><body style="margin:0;padding:0;background:#F1F5F9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#0F172A;"><table width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:32px 16px;"><table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#FFFFFF;border-radius:14px;border:1px solid #E2E8F0;"><tr><td style="padding:36px 36px 12px;font-size:15px;line-height:1.65;color:#0F172A;">Hi ${firstName || "there"},</td></tr><tr><td style="padding:8px 36px 28px;font-size:15px;line-height:1.65;color:#0F172A;">${body}</td></tr></table></td></tr></table></body></html>`;

function substituteVars(src: string, r: { email: string; firstName: string; name: string }): string {
  return src
    .replace(/\{\$?name\}/gi, r.name)
    .replace(/\{\$?firstName\}/gi, r.firstName)
    .replace(/\{\$?email\}/gi, r.email);
}

function firstNameOf(name?: string | null, email?: string): string {
  if (name && name.trim()) return name.trim().split(/\s+/)[0];
  return (email || "").split("@")[0] || "there";
}

function draftKey(emails: string[]): string {
  return `lead-compose-draft:${emails.slice().sort().join(",")}`;
}

// ─── Component ────────────────────────────────────────────────────────────────
export function LeadComposeDialog({
  open,
  onOpenChange,
  recipients: initialRecipients,
  allowAddRecipients = false,
  campaignName,
}: Props) {
  const qc = useQueryClient();
  const [recipients, setRecipients] = useState<ComposeRecipient[]>(initialRecipients);
  const [mode, setMode] = useState<"rich" | "plain" | "html" | "template">("rich");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState(""); // rich/plain/html source
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>("");
  const [previewOpen, setPreviewOpen] = useState(false);
  const [saveOpen, setSaveOpen] = useState(false);
  const [newTplName, setNewTplName] = useState("");
  const [newTplProject, setNewTplProject] = useState("");
  const [sending, setSending] = useState(false);
  const [saving, setSaving] = useState(false);
  const [selectedAgentId, setSelectedAgentId] = useState<string>("");
  const [includeSignature, setIncludeSignature] = useState(true);
  const [success, setSuccess] = useState<{ sent: number; failed: number } | null>(null);
  const [manualEmail, setManualEmail] = useState("");
  const [draftRestored, setDraftRestored] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [pendingSendLabel, setPendingSendLabel] = useState<string | null>(null);
  const [bulkProgress, setBulkProgress] = useState<{ sent: number; total: number } | null>(null);
  const undoRef = useRef<{ cancelled: boolean } | null>(null);
  const subjectRef = useRef<HTMLInputElement>(null);
  const [livePreviewOpen, setLivePreviewOpen] = useState(true);
  const [previewIdx, setPreviewIdx] = useState(0);
  const [previewDevice, setPreviewDevice] = useState<"desktop" | "mobile">("desktop");

  // Sync recipients when reopened
  useEffect(() => {
    if (open) {
      setRecipients(initialRecipients);
      setSuccess(null);
    }
  }, [open, initialRecipients]);

  // ── Templates ────────────────────────────────────────────────────────────
  const { data: templates } = useQuery({
    queryKey: ["lead-compose-templates"],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("campaign_templates")
        .select("id, name, project_name, form_data, is_favorited, last_sent_at, updated_at")
        .order("updated_at", { ascending: false })
        .limit(80);
      if (error) throw error;
      return (data || []) as TemplateOption[];
    },
    enabled: open,
  });

  const recentTemplates = useMemo(() => {
    if (!templates) return [];
    return [...templates]
      .filter((t) => !!t.last_sent_at)
      .sort((a, b) => new Date(b.last_sent_at!).getTime() - new Date(a.last_sent_at!).getTime())
      .slice(0, 3);
  }, [templates]);

  const favoriteTemplates = useMemo(
    () => (templates || []).filter((t) => t.is_favorited).slice(0, 3),
    [templates],
  );

  // ── Agents ──────────────────────────────────────────────────────────────
  const { data: agents } = useQuery({
    queryKey: ["lead-compose-agents"],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("team_members_public")
        .select("id, full_name, title, photo_url, phone, email, sort_order, is_active")
        .eq("is_active", true)
        .order("sort_order", { ascending: true });
      if (error) throw error;
      return (data || []) as AgentOption[];
    },
    enabled: open,
  });

  useEffect(() => {
    if (!selectedAgentId && agents && agents.length > 0) {
      setSelectedAgentId(agents[0].id);
    }
  }, [agents, selectedAgentId]);

  const selectedAgent = useMemo<SignatureAgent | null>(() => {
    if (!agents || !selectedAgentId) return null;
    const a = agents.find((x) => x.id === selectedAgentId);
    if (!a) return null;
    return {
      full_name: a.full_name,
      title: a.title,
      photo_url: a.photo_url,
      phone: a.phone,
      email: a.email,
    };
  }, [agents, selectedAgentId]);

  // ── Draft persistence ──────────────────────────────────────────────────
  const dKey = useMemo(() => draftKey(recipients.map((r) => r.email)), [recipients]);

  // Restore draft when dialog opens
  useEffect(() => {
    if (!open || !dKey) return;
    try {
      const raw = localStorage.getItem(dKey);
      if (!raw) return;
      const parsed = JSON.parse(raw);
      if (parsed?.subject || parsed?.body) {
        setSubject(parsed.subject || "");
        setBody(parsed.body || "");
        setMode(parsed.mode || "rich");
        setDraftRestored(true);
        setTimeout(() => setDraftRestored(false), 4000);
      }
    } catch {}
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, dKey]);

  // Save draft as user types
  useEffect(() => {
    if (!open || success) return;
    if (!subject && !body) return;
    const t = setTimeout(() => {
      try {
        localStorage.setItem(dKey, JSON.stringify({ subject, body, mode }));
      } catch {}
    }, 400);
    return () => clearTimeout(t);
  }, [open, subject, body, mode, dKey, success]);

  // Focus subject when opened
  useEffect(() => {
    if (open && !success) setTimeout(() => subjectRef.current?.focus(), 100);
  }, [open, success]);

  // ── Template loading ────────────────────────────────────────────────────
  const loadTemplate = (tpl: TemplateOption) => {
    const fd = tpl.form_data || {};
    const subj = fd?.copy?.subjectLine || fd?.vars?.subjectLine || fd?.subject || tpl.name;
    const html = getSavedHtml(tpl as unknown as SavedAsset);
    setSubject(subj);
    setBody(html);
    setMode("html"); // saved templates are baked HTML
    setSelectedTemplateId(tpl.id);
    toast.success(`Loaded "${tpl.name}"`);
  };

  // ── Final HTML build ────────────────────────────────────────────────────
  const buildHtmlFor = (recipient: ComposeRecipient) => {
    const firstName = firstNameOf(recipient.name, recipient.email);
    const r = { email: recipient.email, firstName, name: recipient.name || firstName };
    let baseHtml: string;
    if (mode === "html" || mode === "template") {
      baseHtml = substituteVars(body, r);
    } else if (mode === "rich") {
      // Tiptap already produces HTML — substitute vars and wrap in shell
      baseHtml = substituteVars(PLAIN_HTML_WRAPPER(body, firstName), r);
    } else {
      // plain
      const escaped = body.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/\n/g, "<br/>");
      baseHtml = substituteVars(PLAIN_HTML_WRAPPER(escaped, firstName), r);
    }
    if (!includeSignature || !selectedAgent) return baseHtml;
    return appendSignatureToHtml(baseHtml, selectedAgent);
  };

  const safePreviewIdx = recipients.length > 0 ? previewIdx % recipients.length : 0;
  const previewRecipient = recipients[safePreviewIdx] || { email: "preview@example.com", name: "Preview" };
  const previewHtml = useMemo(
    () => buildHtmlFor(previewRecipient),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [body, mode, includeSignature, selectedAgent, previewRecipient.email],
  );
  const previewSubject = useMemo(() => {
    const firstName = firstNameOf(previewRecipient.name, previewRecipient.email);
    return substituteVars(subject, {
      email: previewRecipient.email,
      firstName,
      name: previewRecipient.name || firstName,
    });
  }, [subject, previewRecipient]);

  const validRecipients = useMemo(
    () => recipients.filter((r) => !!r.email && /\S+@\S+\.\S+/.test(r.email)),
    [recipients],
  );
  const isBulk = validRecipients.length > 1;
  const canSend = subject.trim().length > 0 && body.trim().length > 0 && validRecipients.length > 0 && !sending;

  // ── Send ────────────────────────────────────────────────────────────────
  /** The actual network send — runs after the 5s undo window completes. */
  const performSend = async () => {
    setPendingSendLabel(null);
    setSending(true);
    try {
      let sentCount = 0;
      let failedCount = 0;

      if (isBulk) {
        // Per-recipient progress for clearer UX during bulk sends.
        setBulkProgress({ sent: 0, total: validRecipients.length });
        // Chunk in groups of 25 to keep edge function payloads safe and feedback fluid.
        const CHUNK = 25;
        for (let i = 0; i < validRecipients.length; i += CHUNK) {
          const slice = validRecipients.slice(i, i + CHUNK);
          const html = buildHtmlFor(slice[0]);
          const { error } = await supabase.functions.invoke("send-direct-email", {
            body: {
              to: slice.map((r) => r.email),
              subject: subject.trim(),
              html,
              campaign_name: campaignName || "admin_bulk_compose",
            },
          });
          if (error) {
            failedCount += slice.length;
          } else {
            sentCount += slice.length;
          }
          setBulkProgress({ sent: i + slice.length, total: validRecipients.length });
        }
      } else {
        const r = validRecipients[0];
        const firstName = firstNameOf(r.name, r.email);
        const finalSubject = substituteVars(subject, { email: r.email, firstName, name: r.name || firstName });
        const { error } = await supabase.functions.invoke("send-direct-email", {
          body: {
            to: r.email,
            subject: finalSubject,
            html: buildHtmlFor(r),
            campaign_name: campaignName || "lead_compose_dialog",
          },
        });
        if (error) throw error;
        sentCount = 1;
      }

      // Auto-progress lead_status: new → contacted (best-effort, project_leads only)
      const leadIds = validRecipients.map((r) => r.leadId).filter(Boolean) as string[];
      if (leadIds.length > 0) {
        supabase
          .from("project_leads")
          .update({ lead_status: "contacted", contacted_at: new Date().toISOString() } as any)
          .in("id", leadIds)
          .eq("lead_status", "new")
          .then(() => {
            qc.invalidateQueries({ queryKey: ["admin-project-leads"] });
          });
      }

      // Engagement event (best-effort)
      validRecipients.forEach((r) => {
        supabase.functions
          .invoke("send-lead-engagement-event", {
            body: {
              email: r.email,
              eventType: "template_sent",
              eventData: {
                template_name: campaignName || "lead_compose_dialog",
                sent_via: "lead_compose_dialog",
                subject,
              },
            },
          })
          .catch(() => {});
      });

      // Bump template last_sent_at
      if (selectedTemplateId) {
        (supabase as any)
          .from("campaign_templates")
          .update({ last_sent_at: new Date().toISOString() })
          .eq("id", selectedTemplateId)
          .then(() => qc.invalidateQueries({ queryKey: ["lead-compose-templates"] }));
      }

      // Clear draft
      try {
        localStorage.removeItem(dKey);
      } catch {}

      setBulkProgress(null);
      setSuccess({ sent: sentCount, failed: failedCount });
    } catch (err: any) {
      toast.error(err?.message || "Failed to send");
      setBulkProgress(null);
    } finally {
      setSending(false);
    }
  };

  /** Click handler — starts the 5-second undo window before performSend(). */
  const handleSend = () => {
    if (!canSend) return;
    const label = isBulk
      ? `Sending to ${validRecipients.length} recipients`
      : `Sending to ${validRecipients[0].name || validRecipients[0].email}`;
    setPendingSendLabel(label);
    undoRef.current = { cancelled: false };
  };

  const undoSend = () => {
    if (undoRef.current) undoRef.current.cancelled = true;
    setPendingSendLabel(null);
    toast.info("Send cancelled — your draft is back");
  };

  const onUndoTimerComplete = () => {
    if (undoRef.current?.cancelled) return;
    void performSend();
  };

  // ── Save as template ────────────────────────────────────────────────────
  const handleSaveTemplate = async () => {
    if (!newTplName.trim()) {
      toast.error("Give the template a name");
      return;
    }
    setSaving(true);
    try {
      const html = buildHtmlFor(previewRecipient);
      const { error } = await (supabase as any).from("campaign_templates").insert({
        name: newTplName.trim(),
        project_name: newTplProject.trim() || "General",
        form_data: {
          finalHtml: html,
          vars: { subjectLine: subject, bodyCopy: body },
          copy: { subjectLine: subject, bodyCopy: body },
          source: "lead_compose_dialog",
        },
        tags: ["lead-hub", "compose"],
      });
      if (error) throw error;
      toast.success(`Saved "${newTplName}"`);
      setSaveOpen(false);
      setNewTplName("");
      setNewTplProject("");
      qc.invalidateQueries({ queryKey: ["lead-compose-templates"] });
    } catch (err: any) {
      toast.error(err?.message || "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  // ── Recipient management ────────────────────────────────────────────────
  const addManual = () => {
    const email = manualEmail.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      toast.error("Invalid email");
      return;
    }
    if (recipients.some((r) => r.email.toLowerCase() === email)) {
      toast.error("Already added");
      return;
    }
    setRecipients((p) => [...p, { email, name: email.split("@")[0] }]);
    setManualEmail("");
  };
  const removeRecipient = (email: string) => {
    setRecipients((p) => p.filter((r) => r.email !== email));
  };

  // ── Keyboard shortcuts ──────────────────────────────────────────────────
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
        e.preventDefault();
        if (canSend) handleSend();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, canSend, body, subject, mode, includeSignature, selectedAgent]);

  // ── Reset on full close ─────────────────────────────────────────────────
  const handleClose = (next: boolean) => {
    if (!next) {
      setSubject("");
      setBody("");
      setMode("rich");
      setSelectedTemplateId("");
      setSuccess(null);
    }
    onOpenChange(next);
  };

  // ── Success view ────────────────────────────────────────────────────────
  if (success && open) {
    return (
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="sm:max-w-md text-center">
          <div className="flex flex-col items-center gap-3 py-6">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500/15">
              <CheckCircle2 className="h-7 w-7 text-emerald-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold">Email sent</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Delivered to {success.sent} {success.sent === 1 ? "recipient" : "recipients"}
                {success.failed > 0 && ` · ${success.failed} failed`}
              </p>
            </div>
            <div className="mt-2 flex w-full gap-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => {
                  setSuccess(null);
                  setSubject("");
                  setBody("");
                  setSelectedTemplateId("");
                }}
              >
                Send another
              </Button>
              <Button className="flex-1" onClick={() => handleClose(false)}>
                Done
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  // ── Main view ───────────────────────────────────────────────────────────
  return (
    <>
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent
          className={cn(
            "p-0 gap-0 overflow-hidden transition-[max-width] duration-200",
            livePreviewOpen ? "max-w-6xl" : "max-w-3xl",
          )}
        >
          <DialogHeader className="border-b border-border bg-muted/20 px-5 py-3">
            <div className="flex items-center justify-between">
              <DialogTitle className="flex items-center gap-2 text-base">
                {isBulk ? <Users className="h-4 w-4" /> : <Mail className="h-4 w-4" />}
                {isBulk ? `Compose · ${validRecipients.length} recipients` : "Compose email"}
              </DialogTitle>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setLivePreviewOpen((v) => !v)}
                  className="inline-flex items-center gap-1 rounded border border-border bg-background px-2 py-1 text-[10px] text-muted-foreground hover:text-foreground transition-colors"
                  title={livePreviewOpen ? "Hide live preview" : "Show live preview"}
                >
                  {livePreviewOpen ? (
                    <PanelRightClose className="h-3 w-3" />
                  ) : (
                    <PanelRightOpen className="h-3 w-3" />
                  )}
                  {livePreviewOpen ? "Hide preview" : "Show preview"}
                </button>
                <kbd className="rounded border border-border bg-background px-1.5 py-0.5 text-[10px] text-muted-foreground">
                  ⌘ + ↵ to send
                </kbd>
              </div>
            </div>
            <DialogDescription className="sr-only">Compose and send an email to selected leads.</DialogDescription>
          </DialogHeader>

          <div className="flex min-h-0 flex-1">
            <div className={cn("min-w-0 flex-1", livePreviewOpen && "border-r border-border")}>
              <ScrollArea className="max-h-[72vh]">
            <div className="space-y-4 px-5 py-4">
              {/* Recipients */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">To</Label>
                  {draftRestored && (
                    <span className="text-[10px] text-emerald-600">↺ Draft restored</span>
                  )}
                </div>
                <div className="flex flex-wrap gap-1.5 rounded-md border border-input bg-background p-2">
                  {validRecipients.length === 0 && (
                    <span className="text-xs text-muted-foreground">No recipients yet</span>
                  )}
                  {validRecipients.slice(0, 60).map((r) => (
                    <Badge key={r.email} variant="secondary" className="h-6 gap-1 pr-1 text-xs font-normal">
                      <span className="max-w-[180px] truncate">
                        {r.name ? `${r.name} ` : ""}
                        <span className="text-muted-foreground">&lt;{r.email}&gt;</span>
                      </span>
                      <button
                        type="button"
                        onClick={() => removeRecipient(r.email)}
                        className="ml-0.5 flex h-4 w-4 items-center justify-center rounded-full hover:bg-destructive/20"
                      >
                        <X className="h-2.5 w-2.5" />
                      </button>
                    </Badge>
                  ))}
                  {validRecipients.length > 60 && (
                    <Badge variant="outline" className="h-6 px-1.5 text-[10px]">
                      +{validRecipients.length - 60} more
                    </Badge>
                  )}
                </div>
                {allowAddRecipients && (
                  <div className="flex gap-2">
                    <Input
                      value={manualEmail}
                      onChange={(e) => setManualEmail(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addManual())}
                      placeholder="Add another email…"
                      className="h-8 text-xs"
                    />
                    <Button variant="outline" size="sm" onClick={addManual} className="h-8 gap-1 text-xs">
                      <Plus className="h-3 w-3" /> Add
                    </Button>
                  </div>
                )}
              </div>

              {/* Recent + Favorite templates (quick load) */}
              {(recentTemplates.length > 0 || favoriteTemplates.length > 0) && (
                <div className="space-y-1.5">
                  <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">
                    Quick templates
                  </Label>
                  <div className="flex flex-wrap gap-1.5">
                    {favoriteTemplates.map((t) => (
                      <button
                        key={`fav-${t.id}`}
                        type="button"
                        onClick={() => loadTemplate(t)}
                        className="inline-flex items-center gap-1.5 rounded-md border border-amber-500/30 bg-amber-500/5 px-2 py-1 text-[11px] hover:bg-amber-500/10"
                      >
                        <Star className="h-3 w-3 fill-amber-500 text-amber-500" />
                        <span className="max-w-[160px] truncate">{t.name}</span>
                      </button>
                    ))}
                    {recentTemplates.map((t) => (
                      <button
                        key={`rec-${t.id}`}
                        type="button"
                        onClick={() => loadTemplate(t)}
                        className="inline-flex items-center gap-1.5 rounded-md border border-border bg-card px-2 py-1 text-[11px] hover:border-primary/40 hover:bg-primary/5"
                      >
                        <Clock className="h-3 w-3 text-muted-foreground" />
                        <span className="max-w-[160px] truncate">{t.name}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Conversation history (single recipient only) */}
              {!isBulk && validRecipients.length === 1 && (
                <div className="space-y-1.5">
                  <button
                    type="button"
                    onClick={() => setShowHistory((v) => !v)}
                    className="flex w-full items-center justify-between rounded-md border border-border bg-muted/20 px-2.5 py-1.5 text-left transition-colors hover:bg-muted/40"
                  >
                    <span className="flex items-center gap-1.5 text-[11px] font-medium">
                      <History className="h-3 w-3 text-muted-foreground" />
                      Past emails to this lead
                    </span>
                    {showHistory ? (
                      <ChevronDown className="h-3 w-3 text-muted-foreground" />
                    ) : (
                      <ChevronRight className="h-3 w-3 text-muted-foreground" />
                    )}
                  </button>
                  {showHistory && <SentEmailsList email={validRecipients[0].email} />}
                </div>
              )}

              {/* Subject */}
              <div className="space-y-1">
                <Label htmlFor="compose-subject" className="text-[10px] uppercase tracking-wider text-muted-foreground">
                  Subject
                </Label>
                <Input
                  id="compose-subject"
                  ref={subjectRef}
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="A short, compelling subject…"
                  className="h-9 text-sm"
                />
                <SubjectSuggestions body={body} currentSubject={subject} onPick={setSubject} />
              </div>

              {/* Mode tabs */}
              <div className="flex items-center justify-between gap-2">
                <Tabs value={mode} onValueChange={(v) => setMode(v as any)} className="flex-1">
                  <TabsList className="grid w-full grid-cols-4 h-8">
                    <TabsTrigger value="rich" className="text-[11px] gap-1">
                      <Wand2 className="h-3 w-3" /> Rich
                    </TabsTrigger>
                    <TabsTrigger value="plain" className="text-[11px] gap-1">
                      <Pencil className="h-3 w-3" /> Plain
                    </TabsTrigger>
                    <TabsTrigger value="html" className="text-[11px] gap-1">
                      <Code2 className="h-3 w-3" /> HTML
                    </TabsTrigger>
                    <TabsTrigger value="template" className="text-[11px] gap-1">
                      <FileText className="h-3 w-3" /> Templates
                    </TabsTrigger>
                  </TabsList>
                </Tabs>
                {mode !== "template" && mode !== "html" && (
                  <AiAssistMenu body={body} onRewrite={setBody} mode={mode} disabled={!body.trim()} />
                )}
              </div>

              {/* Body */}
              {mode === "template" ? (
                <div className="space-y-1.5">
                  <Select value={selectedTemplateId} onValueChange={(id) => {
                    const t = templates?.find((x) => x.id === id);
                    if (t) loadTemplate(t);
                  }}>
                    <SelectTrigger className="h-9 text-xs">
                      <SelectValue placeholder="Pick from full template library…" />
                    </SelectTrigger>
                    <SelectContent>
                      {(templates || []).map((t) => (
                        <SelectItem key={t.id} value={t.id} className="text-xs">
                          <div className="flex items-center gap-2">
                            <span>{t.name}</span>
                            {t.project_name && (
                              <Badge variant="outline" className="h-4 px-1 text-[9px]">
                                {t.project_name}
                              </Badge>
                            )}
                          </div>
                        </SelectItem>
                      ))}
                      {(!templates || templates.length === 0) && (
                        <div className="px-2 py-3 text-xs text-muted-foreground">No templates yet</div>
                      )}
                    </SelectContent>
                  </Select>
                  {selectedTemplateId && (
                    <p className="text-[10px] text-muted-foreground">
                      Loaded — switch to Rich/HTML to tweak before sending.
                    </p>
                  )}
                </div>
              ) : mode === "rich" ? (
                <RichTextEditor
                  value={body}
                  onChange={setBody}
                  placeholder="Write a personal message…"
                />
              ) : (
                <Textarea
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  placeholder={
                    mode === "html"
                      ? "<p>Paste or write HTML…</p>"
                      : "Write a short, personal note. Line breaks become paragraphs.\n\nMerge tags: {firstName} {name} {email}"
                  }
                  className={cn("min-h-[200px] text-sm leading-relaxed", mode === "html" && "font-mono text-xs")}
                />
              )}
              <p className="text-[10px] text-muted-foreground">
                <Sparkles className="mr-0.5 inline h-2.5 w-2.5" />
                Merge tags: <code className="font-mono">{"{firstName}"}</code>,{" "}
                <code className="font-mono">{"{name}"}</code>,{" "}
                <code className="font-mono">{"{email}"}</code>
              </p>

              {/* Signature */}
              <div className="space-y-1.5 rounded-md border border-border bg-muted/20 p-2.5">
                <div className="flex items-center justify-between">
                  <Label className="flex items-center gap-1 text-[10px] uppercase tracking-wider text-muted-foreground">
                    <UserCircle2 className="h-3 w-3" />
                    Signature
                  </Label>
                  <button
                    type="button"
                    onClick={() => setIncludeSignature((v) => !v)}
                    className={cn(
                      "inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] transition-colors",
                      includeSignature
                        ? "bg-primary/10 text-primary"
                        : "text-muted-foreground hover:text-foreground",
                    )}
                  >
                    {includeSignature ? <CheckCircle2 className="h-2.5 w-2.5" /> : null}
                    {includeSignature ? "Signature on" : "Signature off"}
                  </button>
                </div>
                {includeSignature && (
                  <div className="flex flex-wrap gap-1.5">
                    {(agents || []).map((a) => (
                      <button
                        key={a.id}
                        type="button"
                        onClick={() => setSelectedAgentId(a.id)}
                        className={cn(
                          "flex flex-1 min-w-[140px] items-center gap-2 rounded-lg border px-2 py-1.5 text-left transition-all",
                          selectedAgentId === a.id
                            ? "border-primary bg-primary/8 shadow-sm"
                            : "border-border bg-card hover:border-primary/40",
                        )}
                      >
                        {a.photo_url ? (
                          <img
                            src={a.photo_url}
                            alt={a.full_name}
                            className="h-7 w-7 shrink-0 rounded-full border border-border object-cover object-top"
                          />
                        ) : (
                          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[10px] font-bold text-primary">
                            {a.full_name.charAt(0)}
                          </div>
                        )}
                        <div className="min-w-0 flex-1">
                          <div className="truncate text-[11px] font-semibold">{a.full_name}</div>
                          <div className="truncate text-[9px] text-muted-foreground">{a.title}</div>
                        </div>
                        {selectedAgentId === a.id && <CheckCircle2 className="h-3 w-3 shrink-0 text-primary" />}
                      </button>
                    ))}
                  </div>
                )}
              </div>
                </div>
              </ScrollArea>
            </div>

            {/* Live preview pane */}
            {livePreviewOpen && (
              <aside className="hidden lg:flex w-[440px] shrink-0 flex-col bg-muted/10">
                <div className="flex items-center justify-between gap-2 border-b border-border bg-muted/20 px-3 py-2">
                  <div className="flex items-center gap-1 text-[10px] uppercase tracking-wider text-muted-foreground">
                    <Eye className="h-3 w-3" />
                    Live preview
                  </div>
                  <div className="flex items-center gap-1.5">
                    {recipients.length > 1 && (
                      <div className="flex items-center gap-0.5 rounded border border-border bg-background">
                        <button
                          type="button"
                          onClick={() => setPreviewIdx((i) => (i - 1 + recipients.length) % recipients.length)}
                          className="flex h-5 w-5 items-center justify-center text-muted-foreground hover:text-foreground"
                          title="Previous recipient"
                        >
                          <ChevronLeft className="h-3 w-3" />
                        </button>
                        <span className="px-1 text-[10px] text-muted-foreground tabular-nums">
                          {safePreviewIdx + 1}/{recipients.length}
                        </span>
                        <button
                          type="button"
                          onClick={() => setPreviewIdx((i) => (i + 1) % recipients.length)}
                          className="flex h-5 w-5 items-center justify-center text-muted-foreground hover:text-foreground"
                          title="Next recipient"
                        >
                          <ChevronRight className="h-3 w-3" />
                        </button>
                      </div>
                    )}
                    <div className="flex items-center rounded border border-border bg-background">
                      <button
                        type="button"
                        onClick={() => setPreviewDevice("desktop")}
                        className={cn(
                          "flex h-5 w-6 items-center justify-center rounded-l transition-colors",
                          previewDevice === "desktop" ? "bg-primary/10 text-primary" : "text-muted-foreground hover:text-foreground",
                        )}
                        title="Desktop width"
                      >
                        <Monitor className="h-3 w-3" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setPreviewDevice("mobile")}
                        className={cn(
                          "flex h-5 w-6 items-center justify-center rounded-r transition-colors",
                          previewDevice === "mobile" ? "bg-primary/10 text-primary" : "text-muted-foreground hover:text-foreground",
                        )}
                        title="Mobile width"
                      >
                        <Smartphone className="h-3 w-3" />
                      </button>
                    </div>
                  </div>
                </div>

                <div className="border-b border-border bg-background px-3 py-2 text-[11px]">
                  <div className="truncate">
                    <span className="text-muted-foreground">To: </span>
                    <span className="font-mono text-foreground">{previewRecipient.email}</span>
                  </div>
                  <div className="mt-0.5 truncate">
                    <span className="text-muted-foreground">Subject: </span>
                    <span className="font-medium text-foreground">{previewSubject || <em className="text-muted-foreground">(empty)</em>}</span>
                  </div>
                </div>

                <div className="flex-1 overflow-auto bg-muted/30 p-3">
                  {body.trim() ? (
                    <div
                      className={cn(
                        "mx-auto overflow-hidden rounded border border-border bg-background shadow-sm transition-all",
                        previewDevice === "mobile" ? "max-w-[390px]" : "max-w-full",
                      )}
                    >
                      <iframe
                        srcDoc={previewHtml}
                        title="Live email preview"
                        sandbox=""
                        className="h-[60vh] w-full bg-white"
                      />
                    </div>
                  ) : (
                    <div className="flex h-full items-center justify-center text-center text-xs text-muted-foreground">
                      <div>
                        <Mail className="mx-auto mb-2 h-6 w-6 opacity-40" />
                        Start writing to see a live preview here.
                      </div>
                    </div>
                  )}
                </div>
              </aside>
            )}
          </div>

          {/* Footer */}
          <DialogFooter className="flex-row items-center justify-between gap-2 border-t border-border bg-muted/20 px-5 py-3 sm:flex-row">
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPreviewOpen(true)}
                disabled={!body.trim()}
                className="h-8 gap-1 text-xs"
              >
                <Eye className="h-3.5 w-3.5" />
                Preview
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setNewTplName(subject || "Untitled template");
                  setSaveOpen(true);
                }}
                disabled={!subject.trim() || !body.trim()}
                className="h-8 gap-1 text-xs"
              >
                <Save className="h-3.5 w-3.5" />
                Save as template
              </Button>
            </div>
            <Button onClick={handleSend} disabled={!canSend || !!pendingSendLabel} size="sm" className="h-8 gap-1.5 text-xs">
              {sending || pendingSendLabel ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
              {pendingSendLabel ? "Queued…" : sending ? "Sending…" : isBulk ? `Send to ${validRecipients.length}` : "Send"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Preview */}
      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-base">Email preview</DialogTitle>
            <DialogDescription className="text-xs">
              Subject: <span className="font-medium text-foreground">{previewSubject || "(no subject)"}</span> · As seen
              by <span className="font-mono">{previewRecipient.email}</span>
            </DialogDescription>
          </DialogHeader>
          <div className="overflow-hidden rounded-md border border-border bg-muted/30">
            <iframe srcDoc={previewHtml} title="Email preview" sandbox="" className="h-[460px] w-full bg-white" />
          </div>
        </DialogContent>
      </Dialog>

      {/* Save as template */}
      <Dialog open={saveOpen} onOpenChange={setSaveOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base">Save as new template</DialogTitle>
            <DialogDescription className="text-xs">
              The current draft will be saved to your Marketing Hub library so you can reuse it.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1">
              <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">Template name</Label>
              <Input
                value={newTplName}
                onChange={(e) => setNewTplName(e.target.value)}
                placeholder="e.g. South Surrey re-engagement"
                className="h-9 text-sm"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">
                Project / category (optional)
              </Label>
              <Input
                value={newTplProject}
                onChange={(e) => setNewTplProject(e.target.value)}
                placeholder="e.g. The Loop, General, Follow-up…"
                className="h-9 text-sm"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setSaveOpen(false)}>
              Cancel
            </Button>
            <Button size="sm" onClick={handleSaveTemplate} disabled={saving} className="gap-1.5">
              {saving ? <Loader2 className="h-3 w-3 animate-spin" /> : <Save className="h-3 w-3" />}
              Save template
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Undo-send banner (5s window) */}
      {pendingSendLabel && (
        <UndoSendBanner
          label={pendingSendLabel}
          onUndo={undoSend}
          onComplete={onUndoTimerComplete}
        />
      )}

      {/* Bulk send progress */}
      {bulkProgress && <BulkSendProgress sent={bulkProgress.sent} total={bulkProgress.total} />}
    </>
  );
}
