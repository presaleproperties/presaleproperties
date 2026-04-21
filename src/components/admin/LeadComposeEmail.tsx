/**
 * LeadComposeEmail
 * ─────────────────────────────────────────────────────────────────────────
 * Full email composer rendered inside the Lead Hub.
 *  • Mode A — Write: free-form subject + body (HTML or plain text)
 *  • Mode B — Use template: load any saved campaign_template into the editor
 *  • Mode C — Save as new template: save the current draft as a re-usable template
 *  • Sends via the `send-direct-email` edge function (Resend)
 *  • Logs to email_logs and fires the engagement webhook
 */
import { useEffect, useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Pencil,
  FileText,
  Save,
  Send,
  Loader2,
  Eye,
  Code2,
  Sparkles,
  Wand2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { getSavedHtml, type SavedAsset } from "@/lib/emailTemplateHelpers";

interface Props {
  leadEmail: string;
  leadName: string;
  firstName: string;
}

interface TemplateOption {
  id: string;
  name: string;
  project_name: string | null;
  form_data: any;
}

const PLAIN_HTML_WRAPPER = (body: string, firstName: string) => `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head><body style="margin:0;padding:0;background:#F1F5F9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#0F172A;"><table width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:32px 16px;"><table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#FFFFFF;border-radius:14px;border:1px solid #E2E8F0;"><tr><td style="padding:36px 36px 12px;font-size:15px;line-height:1.65;color:#0F172A;">Hi ${firstName || "there"},</td></tr><tr><td style="padding:8px 36px 28px;font-size:15px;line-height:1.65;color:#0F172A;white-space:pre-wrap;">${body}</td></tr><tr><td style="padding:0 36px 36px;border-top:1px solid #E2E8F0;padding-top:20px;font-size:13px;color:#475569;">Best,<br/><strong style="color:#0F172A;">Uzair Muhammad</strong><br/><span style="color:#64748B;">Presale Properties · presaleproperties.com</span></td></tr></table></td></tr></table></body></html>`;

function substituteVars(src: string, r: { email: string; firstName: string; name: string }): string {
  return src
    .replace(/\{\$?name\}/gi, r.name)
    .replace(/\{\$?firstName\}/gi, r.firstName)
    .replace(/\{\$?email\}/gi, r.email);
}

export function LeadComposeEmail({ leadEmail, leadName, firstName }: Props) {
  const qc = useQueryClient();
  const [mode, setMode] = useState<"write" | "template">("write");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [bodyIsHtml, setBodyIsHtml] = useState(false);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>("");
  const [previewOpen, setPreviewOpen] = useState(false);
  const [saveOpen, setSaveOpen] = useState(false);
  const [newTplName, setNewTplName] = useState("");
  const [newTplProject, setNewTplProject] = useState("");
  const [sending, setSending] = useState(false);
  const [saving, setSaving] = useState(false);

  const { data: templates } = useQuery({
    queryKey: ["lead-compose-templates"],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("campaign_templates")
        .select("id, name, project_name, form_data")
        .order("updated_at", { ascending: false })
        .limit(80);
      if (error) throw error;
      return (data || []) as TemplateOption[];
    },
  });

  // When a template is picked, hydrate the editor with its content
  useEffect(() => {
    if (mode !== "template" || !selectedTemplateId || !templates) return;
    const tpl = templates.find((t) => t.id === selectedTemplateId);
    if (!tpl) return;
    const fd = tpl.form_data || {};
    const subj =
      fd?.copy?.subjectLine ||
      fd?.vars?.subjectLine ||
      fd?.subject ||
      tpl.name;
    const html = getSavedHtml(tpl as unknown as SavedAsset);
    setSubject(subj);
    setBody(html);
    setBodyIsHtml(true);
  }, [selectedTemplateId, mode, templates]);

  const finalHtml = useMemo(() => {
    const r = { email: leadEmail, firstName, name: leadName };
    if (bodyIsHtml) return substituteVars(body, r);
    return substituteVars(PLAIN_HTML_WRAPPER(body.replace(/\n/g, "<br/>"), firstName), r);
  }, [body, bodyIsHtml, leadEmail, leadName, firstName]);

  const finalSubject = useMemo(
    () => substituteVars(subject, { email: leadEmail, firstName, name: leadName }),
    [subject, leadEmail, leadName, firstName],
  );

  const canSend = subject.trim().length > 0 && body.trim().length > 0 && !sending;

  const handleSend = async () => {
    if (!canSend) return;
    setSending(true);
    try {
      const { error } = await supabase.functions.invoke("send-direct-email", {
        body: {
          to: leadEmail,
          subject: finalSubject,
          html: finalHtml,
          campaign_name: mode === "template" ? "lead_hub_template_send" : "lead_hub_compose",
        },
      });
      if (error) throw error;
      toast.success(`Email sent to ${leadEmail}`);

      // Fire engagement event (best-effort)
      supabase.functions.invoke("send-lead-engagement-event", {
        body: {
          email: leadEmail,
          eventType: "template_sent",
          eventData: {
            template_name: mode === "template" ? "compose_from_template" : "compose_freeform",
            sent_via: "lead_hub_compose",
            subject: finalSubject,
          },
        },
      }).catch(() => {});

      // Reset draft
      setSubject("");
      setBody("");
      setSelectedTemplateId("");
      setMode("write");
      setBodyIsHtml(false);
    } catch (err: any) {
      toast.error(err?.message || "Failed to send email");
    } finally {
      setSending(false);
    }
  };

  const handleSaveTemplate = async () => {
    if (!newTplName.trim()) {
      toast.error("Give the template a name");
      return;
    }
    setSaving(true);
    try {
      const { error } = await (supabase as any).from("campaign_templates").insert({
        name: newTplName.trim(),
        project_name: newTplProject.trim() || "General",
        form_data: {
          finalHtml: finalHtml,
          vars: {
            subjectLine: subject,
            bodyCopy: body,
          },
          copy: { subjectLine: subject, bodyCopy: body },
          source: "lead_hub_compose",
        },
        tags: ["lead-hub", "compose"],
      });
      if (error) throw error;
      toast.success(`Saved "${newTplName}" as new template`);
      setSaveOpen(false);
      setNewTplName("");
      setNewTplProject("");
      qc.invalidateQueries({ queryKey: ["lead-compose-templates"] });
      qc.invalidateQueries({ queryKey: ["lead-hub-templates"] });
    } catch (err: any) {
      toast.error(err?.message || "Failed to save template");
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="space-y-2.5">
      <header className="flex items-center justify-between">
        <h4 className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
          <Wand2 className="h-3 w-3" />
          Compose & send
        </h4>
        <span className="text-[10px] text-muted-foreground">
          To <span className="font-mono text-foreground">{leadEmail}</span>
        </span>
      </header>

      <div className="rounded-lg border border-border bg-card p-3 space-y-3">
        {/* Mode tabs */}
        <Tabs value={mode} onValueChange={(v) => setMode(v as "write" | "template")}>
          <TabsList className="grid w-full grid-cols-2 h-8">
            <TabsTrigger value="write" className="text-[11px] gap-1">
              <Pencil className="h-3 w-3" /> Write
            </TabsTrigger>
            <TabsTrigger value="template" className="text-[11px] gap-1">
              <FileText className="h-3 w-3" /> Use template
            </TabsTrigger>
          </TabsList>

          <TabsContent value="template" className="mt-2.5">
            <Select value={selectedTemplateId} onValueChange={setSelectedTemplateId}>
              <SelectTrigger className="h-9 text-xs">
                <SelectValue placeholder="Pick a saved template…" />
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
                  <div className="px-2 py-3 text-xs text-muted-foreground">
                    No templates yet
                  </div>
                )}
              </SelectContent>
            </Select>
            {selectedTemplateId && (
              <p className="mt-1.5 text-[10px] text-muted-foreground">
                Loaded into editor below — tweak before sending.
              </p>
            )}
          </TabsContent>
        </Tabs>

        {/* Subject */}
        <div className="space-y-1">
          <Label htmlFor="compose-subject" className="text-[10px] uppercase tracking-wider text-muted-foreground">
            Subject
          </Label>
          <Input
            id="compose-subject"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="e.g. Quick update on a project I think you'd love"
            className="h-9 text-sm"
          />
        </div>

        {/* Body */}
        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <Label htmlFor="compose-body" className="text-[10px] uppercase tracking-wider text-muted-foreground">
              Message
            </Label>
            <button
              type="button"
              onClick={() => setBodyIsHtml((v) => !v)}
              className={cn(
                "inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] transition-colors",
                bodyIsHtml ? "bg-primary/10 text-primary" : "text-muted-foreground hover:text-foreground",
              )}
              title="Toggle raw HTML mode"
            >
              <Code2 className="h-2.5 w-2.5" />
              {bodyIsHtml ? "HTML mode" : "Plain text"}
            </button>
          </div>
          <Textarea
            id="compose-body"
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder={
              bodyIsHtml
                ? "<p>Paste or write HTML…</p>"
                : "Write a short, personal note — line breaks become paragraphs.\n\nYou can use {firstName}, {name}, or {email} as merge tags."
            }
            className={cn("min-h-[160px] text-sm leading-relaxed", bodyIsHtml && "font-mono text-xs")}
          />
          <p className="text-[10px] text-muted-foreground">
            <Sparkles className="mr-0.5 inline h-2.5 w-2.5" />
            Merge tags supported: <code className="font-mono">{"{firstName}"}</code>,{" "}
            <code className="font-mono">{"{name}"}</code>,{" "}
            <code className="font-mono">{"{email}"}</code>
          </p>
        </div>

        {/* Actions */}
        <div className="flex flex-wrap items-center gap-2 pt-1">
          <Button
            size="sm"
            onClick={handleSend}
            disabled={!canSend}
            className="h-8 gap-1.5 text-[11px]"
          >
            {sending ? <Loader2 className="h-3 w-3 animate-spin" /> : <Send className="h-3 w-3" />}
            Send to {firstName || "lead"}
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => setPreviewOpen(true)}
            disabled={!body.trim()}
            className="h-8 gap-1.5 text-[11px]"
          >
            <Eye className="h-3 w-3" />
            Preview
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              setNewTplName(subject || "Untitled template");
              setSaveOpen(true);
            }}
            disabled={!subject.trim() || !body.trim()}
            className="h-8 gap-1.5 text-[11px]"
          >
            <Save className="h-3 w-3" />
            Save as template
          </Button>
        </div>
      </div>

      {/* Preview dialog */}
      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-base">Email preview</DialogTitle>
            <DialogDescription className="text-xs">
              Subject: <span className="font-medium text-foreground">{finalSubject || "(no subject)"}</span> · To{" "}
              <span className="font-mono">{leadEmail}</span>
            </DialogDescription>
          </DialogHeader>
          <div className="rounded-md border border-border bg-muted/30 overflow-hidden">
            <iframe
              srcDoc={finalHtml}
              title="Email preview"
              sandbox=""
              className="h-[460px] w-full bg-white"
            />
          </div>
        </DialogContent>
      </Dialog>

      {/* Save-as-template dialog */}
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
              <Label htmlFor="tpl-name" className="text-[10px] uppercase tracking-wider text-muted-foreground">
                Template name
              </Label>
              <Input
                id="tpl-name"
                value={newTplName}
                onChange={(e) => setNewTplName(e.target.value)}
                placeholder="e.g. South Surrey re-engagement"
                className="h-9 text-sm"
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="tpl-project" className="text-[10px] uppercase tracking-wider text-muted-foreground">
                Project / category (optional)
              </Label>
              <Input
                id="tpl-project"
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
    </section>
  );
}
