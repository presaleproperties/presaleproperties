import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  buildAiTemplateHtmlFromFormData,
  isAiEmailTemplate,
  personalizeTemplateHtml,
} from "@/lib/ai-email-html";
import {
  Send,
  Search,
  X,
  Loader2,
  CheckCircle2,
  User,
  Mail,
  ArrowLeft,
  ArrowRight,
  FileText,
  Sparkles,
} from "lucide-react";

interface QuickSendDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface LeadResult {
  id: string;
  name: string;
  firstName?: string;
  email: string;
  source: "lead" | "client" | "manual";
}

interface TemplateRow {
  id: string;
  name: string;
  project_name: string | null;
  thumbnail_url: string | null;
  form_data: any;
  updated_at: string;
}

type Step = "recipients" | "template" | "preview" | "done";

function getTemplateCardPreviewImage(template: TemplateRow): string | null {
  const fd = template.form_data || {};
  return (
    template.thumbnail_url ||
    fd.heroImage ||
    fd.copy?.heroImage ||
    fd.imageCards?.find?.((card: any) => card?.url)?.url ||
    null
  );
}

function getTemplateCardPreviewHtml(template: TemplateRow): string {
  const fd = template.form_data || {};

  if (fd.finalHtml) {
    return personalizeTemplateHtml(fd.finalHtml, "there");
  }

  if (isAiEmailTemplate(fd)) {
    return personalizeTemplateHtml(buildAiTemplateHtmlFromFormData(fd), "there");
  }

  return fd.html || fd.htmlContent || fd.html_content || fd.body || "";
}

export function QuickSendDialog({ open, onOpenChange }: QuickSendDialogProps) {
  const [step, setStep] = useState<Step>("recipients");

  // Recipients
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<LeadResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [recipients, setRecipients] = useState<LeadResult[]>([]);
  const [manualEmail, setManualEmail] = useState("");
  const searchTimer = useRef<ReturnType<typeof setTimeout>>();

  // Templates
  const [templates, setTemplates] = useState<TemplateRow[]>([]);
  const [templatesLoading, setTemplatesLoading] = useState(false);
  const [tplSearch, setTplSearch] = useState("");
  const [selectedTplId, setSelectedTplId] = useState<string | null>(null);

  // Preview
  const [previewHtml, setPreviewHtml] = useState("");
  const [previewLoading, setPreviewLoading] = useState(false);

  // Send
  const [sending, setSending] = useState(false);
  const [sendResult, setSendResult] = useState<{ sent: number; failed: number } | null>(null);

  // Reset on close
  useEffect(() => {
    if (!open) {
      setTimeout(() => {
        setStep("recipients");
        setQuery("");
        setResults([]);
        setRecipients([]);
        setManualEmail("");
        setTplSearch("");
        setSelectedTplId(null);
        setPreviewHtml("");
        setSendResult(null);
      }, 200);
    }
  }, [open]);

  // Debounced lead search
  useEffect(() => {
    if (!query || query.length < 2) {
      setResults([]);
      return;
    }
    clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => searchLeads(query), 300);
    return () => clearTimeout(searchTimer.current);
  }, [query]);

  const searchLeads = useCallback(async (q: string) => {
    setSearching(true);
    try {
      const term = `%${q}%`;
      const [onboardedRes, leadsRes, clientsRes] = await Promise.all([
        supabase
          .from("onboarded_leads")
          .select("id, first_name, last_name, email")
          .or(`first_name.ilike.${term},last_name.ilike.${term},email.ilike.${term}`)
          .limit(8),
        (supabase as any)
          .from("project_leads")
          .select("id, name, email")
          .or(`name.ilike.${term},email.ilike.${term}`)
          .limit(8),
        supabase
          .from("clients")
          .select("id, first_name, last_name, email")
          .or(`first_name.ilike.${term},last_name.ilike.${term},email.ilike.${term}`)
          .limit(8),
      ]);

      const mapped: LeadResult[] = [];
      const seen = new Set<string>();

      const push = (item: LeadResult) => {
        if (item.email && !seen.has(item.email)) {
          seen.add(item.email);
          mapped.push(item);
        }
      };

      (onboardedRes.data as any[] | null)?.forEach((o) =>
        push({
          id: o.id,
          name: [o.first_name, o.last_name].filter(Boolean).join(" ") || o.email,
          firstName: o.first_name ?? undefined,
          email: o.email,
          source: "lead",
        })
      );
      (leadsRes.data as any[] | null)?.forEach((l) =>
        push({
          id: l.id,
          name: l.name || l.email,
          firstName: l.name?.trim().split(/\s+/)[0],
          email: l.email,
          source: "lead",
        })
      );
      (clientsRes.data as any[] | null)?.forEach((c) =>
        push({
          id: c.id,
          name: [c.first_name, c.last_name].filter(Boolean).join(" ") || c.email,
          firstName: c.first_name ?? undefined,
          email: c.email,
          source: "client",
        })
      );

      setResults(mapped);
    } catch (err) {
      console.error("[QuickSend] search error:", err);
    } finally {
      setSearching(false);
    }
  }, []);

  const addRecipient = (lead: LeadResult) => {
    if (recipients.some((r) => r.email === lead.email)) return;
    setRecipients((prev) => [...prev, lead]);
    setQuery("");
    setResults([]);
  };

  const addManualRecipient = () => {
    const email = manualEmail.trim().toLowerCase();
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      toast.error("Enter a valid email");
      return;
    }
    if (recipients.some((r) => r.email === email)) return;
    const local = email.split("@")[0];
    setRecipients((prev) => [
      ...prev,
      { id: email, name: local, firstName: local, email, source: "manual" },
    ]);
    setManualEmail("");
  };

  const removeRecipient = (email: string) =>
    setRecipients((prev) => prev.filter((r) => r.email !== email));

  // Load templates when entering template step
  const loadTemplates = useCallback(async () => {
    setTemplatesLoading(true);
    const { data } = await (supabase as any)
      .from("campaign_templates")
      .select("id, name, project_name, thumbnail_url, form_data, updated_at")
      .order("updated_at", { ascending: false })
      .limit(100);
    setTemplates((data as TemplateRow[]) || []);
    setTemplatesLoading(false);
  }, []);

  useEffect(() => {
    if (open && step === "template" && templates.length === 0) {
      loadTemplates();
    }
  }, [open, step, templates.length, loadTemplates]);

  const filteredTemplates = useMemo(() => {
    if (!tplSearch.trim()) return templates;
    const q = tplSearch.toLowerCase();
    return templates.filter(
      (t) =>
        t.name?.toLowerCase().includes(q) ||
        t.project_name?.toLowerCase().includes(q)
    );
  }, [templates, tplSearch]);

  const selectedTemplate = useMemo(
    () => templates.find((t) => t.id === selectedTplId) || null,
    [templates, selectedTplId]
  );

  // Build preview when entering preview step
  useEffect(() => {
    if (step !== "preview" || !selectedTemplate) return;
    let cancelled = false;
    (async () => {
      setPreviewLoading(true);
      try {
        const fd = selectedTemplate.form_data;
        const firstName = recipients[0]?.firstName || recipients[0]?.name?.split(" ")[0] || "there";

        if (fd?.finalHtml) {
          if (!cancelled) setPreviewHtml(personalizeTemplateHtml(fd.finalHtml, firstName));
        } else if (isAiEmailTemplate(fd)) {
          let agentRecord: any = null;
          if (fd.selAgent) {
            const { data } = await (supabase as any)
              .from("team_members_public")
              .select("full_name, title, photo_url")
              .eq("full_name", fd.selAgent)
              .maybeSingle();
            agentRecord = data;
          }
          if (!cancelled) {
            setPreviewHtml(
              personalizeTemplateHtml(
                buildAiTemplateHtmlFromFormData(fd, agentRecord),
                firstName
              )
            );
          }
        } else {
          // Fallback: try common html fields stored on the template
          const raw = fd?.html || fd?.htmlContent || fd?.html_content || fd?.body || "";
          if (!cancelled) {
            setPreviewHtml(
              raw
                ? personalizeTemplateHtml(raw, firstName)
                : "<div style='padding:32px;font-family:sans-serif;color:#666;text-align:center;'>This template has no rendered HTML yet. Open it in the Email Builder to generate a preview.</div>"
            );
          }
        }
      } catch (err) {
        console.error("[QuickSend] preview error:", err);
        if (!cancelled) setPreviewHtml("<p>Preview failed to load.</p>");
      } finally {
        if (!cancelled) setPreviewLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [step, selectedTemplate, recipients]);

  const handleSend = async () => {
    if (!selectedTemplate || !recipients.length) return;
    setSending(true);
    let sent = 0;
    let failed = 0;

    try {
      for (const r of recipients) {
        try {
          const fd = selectedTemplate.form_data;
          const firstName = r.firstName || r.name?.split(" ")[0] || "there";
          let htmlOverride: string | undefined;

          if (fd?.finalHtml) {
            htmlOverride = personalizeTemplateHtml(fd.finalHtml, firstName);
          } else if (isAiEmailTemplate(fd)) {
            htmlOverride = personalizeTemplateHtml(
              buildAiTemplateHtmlFromFormData(fd),
              firstName
            );
          }

          // Onboarded leads already have a project_leads-compatible id;
          // for clients/manual we fall back to direct email send.
          const body: any =
            r.source === "lead"
              ? { leadId: r.id, templateId: selectedTemplate.id, htmlOverride }
              : {
                  templateId: selectedTemplate.id,
                  htmlOverride,
                  recipient: { email: r.email, name: r.name, firstName },
                };

          const { error } = await supabase.functions.invoke("send-template-email", {
            body,
          });
          if (error) throw error;
          sent++;
        } catch (err) {
          console.error("[QuickSend] send failed for", r.email, err);
          failed++;
        }
      }

      // Update template's last_sent_at
      await (supabase as any)
        .from("campaign_templates")
        .update({ last_sent_at: new Date().toISOString() })
        .eq("id", selectedTemplate.id);

      setSendResult({ sent, failed });
      setStep("done");
      if (failed === 0) {
        toast.success(`Email sent to ${sent} recipient${sent !== 1 ? "s" : ""}`);
      } else if (sent > 0) {
        toast.warning(`Sent ${sent}, failed ${failed}`);
      } else {
        toast.error("All sends failed");
      }
    } finally {
      setSending(false);
    }
  };

  // Step indicator
  const StepDots = () => (
    <div className="flex items-center justify-center gap-1.5 mt-1">
      {(["recipients", "template", "preview"] as const).map((s, i) => {
        const order: Step[] = ["recipients", "template", "preview"];
        const currentIdx = order.indexOf(step === "done" ? "preview" : step);
        const isActive = i <= currentIdx;
        return (
          <div
            key={s}
            className={cn(
              "h-1 rounded-full transition-all",
              isActive ? "bg-primary w-6" : "bg-muted w-3"
            )}
          />
        );
      })}
    </div>
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[560px] p-0 gap-0 overflow-hidden max-h-[90vh] flex flex-col">
        <DialogHeader className="px-5 pt-5 pb-3 border-b border-border/60">
          <DialogTitle className="text-base font-semibold flex items-center gap-2">
            <Send className="h-4 w-4 text-primary" />
            {step === "recipients" && "Who should this go to?"}
            {step === "template" && "Pick a template"}
            {step === "preview" && "Preview & send"}
            {step === "done" && "Email sent"}
          </DialogTitle>
          {step !== "done" && <StepDots />}
        </DialogHeader>

        {/* STEP 1: RECIPIENTS */}
        {step === "recipients" && (
          <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search a lead or client by name…"
                className="pl-9 h-10 text-sm"
                autoFocus
              />
              {searching && (
                <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 animate-spin text-muted-foreground" />
              )}
            </div>

            {results.length > 0 && (
              <div className="border border-border rounded-lg max-h-[200px] overflow-y-auto divide-y divide-border bg-background">
                {results.map((r) => {
                  const added = recipients.some((rec) => rec.email === r.email);
                  return (
                    <button
                      key={`${r.source}-${r.id}`}
                      onClick={() => addRecipient(r)}
                      disabled={added}
                      className={cn(
                        "w-full text-left px-3 py-2 flex items-center gap-3 text-sm transition-colors",
                        added ? "opacity-40 cursor-not-allowed" : "hover:bg-muted/50"
                      )}
                    >
                      <div className="h-7 w-7 rounded-full bg-muted flex items-center justify-center shrink-0">
                        <User className="h-3.5 w-3.5 text-muted-foreground" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-xs truncate">{r.name}</p>
                        <p className="text-[11px] text-muted-foreground truncate">{r.email}</p>
                      </div>
                      {added && <CheckCircle2 className="h-3.5 w-3.5 text-primary shrink-0" />}
                    </button>
                  );
                })}
              </div>
            )}

            {query.length >= 2 && !searching && results.length === 0 && (
              <p className="text-xs text-muted-foreground text-center py-2">
                No matches for "{query}"
              </p>
            )}

            <div className="flex gap-2 pt-1">
              <div className="relative flex-1">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                <Input
                  value={manualEmail}
                  onChange={(e) => setManualEmail(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && addManualRecipient()}
                  placeholder="Or type an email address…"
                  className="pl-9 h-9 text-xs"
                />
              </div>
              <Button variant="outline" size="sm" className="h-9 px-3 text-xs" onClick={addManualRecipient}>
                Add
              </Button>
            </div>

            {recipients.length > 0 && (
              <div className="pt-2">
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium mb-2">
                  Sending to ({recipients.length})
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {recipients.map((r) => (
                    <Badge key={r.email} variant="secondary" className="gap-1 pr-1 text-xs font-normal">
                      <span className="truncate max-w-[160px]">{r.name}</span>
                      <button
                        onClick={() => removeRecipient(r.email)}
                        className="ml-0.5 h-4 w-4 rounded-full hover:bg-destructive/20 flex items-center justify-center transition-colors"
                      >
                        <X className="h-2.5 w-2.5" />
                      </button>
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* STEP 2: TEMPLATE */}
        {step === "template" && (
          <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                value={tplSearch}
                onChange={(e) => setTplSearch(e.target.value)}
                placeholder="Search your templates…"
                className="pl-9 h-10 text-sm"
              />
            </div>

            {templatesLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            ) : filteredTemplates.length === 0 ? (
              <div className="text-center py-10 space-y-2">
                <FileText className="h-8 w-8 text-muted-foreground/40 mx-auto" />
                <p className="text-sm text-muted-foreground">
                  {templates.length === 0 ? "No templates yet" : "No matches"}
                </p>
                <p className="text-[11px] text-muted-foreground">
                  Build templates in the Email Builder
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2.5 max-h-[360px] overflow-y-auto pr-1">
                {filteredTemplates.map((t) => {
                  const selected = selectedTplId === t.id;
                  return (
                    <button
                      key={t.id}
                      onClick={() => setSelectedTplId(t.id)}
                      className={cn(
                        "group relative text-left rounded-xl border overflow-hidden transition-all",
                        selected
                          ? "border-primary ring-2 ring-primary/30 shadow-md"
                          : "border-border hover:border-primary/40"
                      )}
                    >
                      <div className="aspect-[4/3] bg-muted overflow-hidden">
                        {t.thumbnail_url ? (
                          <img
                            src={t.thumbnail_url}
                            alt={t.name}
                            className="w-full h-full object-cover"
                            loading="lazy"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-muted to-muted/50">
                            <Sparkles className="h-6 w-6 text-muted-foreground/40" />
                          </div>
                        )}
                      </div>
                      <div className="p-2.5 bg-card">
                        <p className="font-medium text-xs truncate">{t.name}</p>
                        {t.project_name && (
                          <p className="text-[10px] text-muted-foreground truncate mt-0.5">
                            {t.project_name}
                          </p>
                        )}
                      </div>
                      {selected && (
                        <div className="absolute top-2 right-2 h-5 w-5 rounded-full bg-primary flex items-center justify-center shadow-sm">
                          <CheckCircle2 className="h-3 w-3 text-primary-foreground" />
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* STEP 3: PREVIEW */}
        {step === "preview" && (
          <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
            <div className="rounded-lg bg-muted/40 px-3 py-2 text-xs">
              <p className="text-muted-foreground">
                <span className="font-medium text-foreground">To:</span>{" "}
                {recipients.map((r) => r.name).join(", ")}
              </p>
              {selectedTemplate && (
                <p className="text-muted-foreground mt-0.5">
                  <span className="font-medium text-foreground">Template:</span>{" "}
                  {selectedTemplate.name}
                </p>
              )}
            </div>

            <div className="rounded-lg border border-border overflow-hidden bg-background">
              {previewLoading ? (
                <div className="flex items-center justify-center py-16">
                  <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <iframe
                  title="Email preview"
                  srcDoc={previewHtml}
                  className="w-full h-[360px] border-0 bg-white"
                  sandbox="allow-same-origin"
                />
              )}
            </div>
          </div>
        )}

        {/* STEP 4: DONE */}
        {step === "done" && sendResult && (
          <div className="px-5 py-10 text-center">
            <div className="mx-auto h-14 w-14 rounded-full bg-primary/10 flex items-center justify-center mb-4">
              <CheckCircle2 className="h-7 w-7 text-primary" />
            </div>
            <p className="font-semibold text-lg">
              {sendResult.failed === 0
                ? `Sent to ${sendResult.sent} recipient${sendResult.sent !== 1 ? "s" : ""}`
                : `${sendResult.sent} sent, ${sendResult.failed} failed`}
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              You'll receive a copy in your inbox.
            </p>
            <Button className="mt-5" onClick={() => onOpenChange(false)}>
              Done
            </Button>
          </div>
        )}

        {/* FOOTER NAV */}
        {step !== "done" && (
          <div className="px-5 py-3 border-t border-border bg-muted/20 flex items-center justify-between gap-2">
            {step === "recipients" ? (
              <Button variant="ghost" size="sm" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
            ) : (
              <Button
                variant="ghost"
                size="sm"
                className="gap-1.5"
                onClick={() => setStep(step === "template" ? "recipients" : "template")}
                disabled={sending}
              >
                <ArrowLeft className="h-3.5 w-3.5" /> Back
              </Button>
            )}

            {step === "recipients" && (
              <Button
                size="sm"
                className="gap-1.5"
                disabled={recipients.length === 0}
                onClick={() => setStep("template")}
              >
                Next <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            )}

            {step === "template" && (
              <Button
                size="sm"
                className="gap-1.5"
                disabled={!selectedTplId}
                onClick={() => setStep("preview")}
              >
                Preview <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            )}

            {step === "preview" && (
              <Button size="sm" className="gap-1.5" disabled={sending} onClick={handleSend}>
                {sending ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" /> Sending…
                  </>
                ) : (
                  <>
                    <Send className="h-3.5 w-3.5" /> Send to {recipients.length}
                  </>
                )}
              </Button>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
