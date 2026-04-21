/**
 * BulkEmailDialog
 * ─────────────────────────────────────────────────────────────────────────
 * In-app bulk email composer for the Admin Leads bulk action bar.
 * Sends individually to each recipient via the `send-direct-email`
 * edge function (which already loops + logs to email_logs). Replaces the
 * previous `mailto:` workflow that opened the OS mail client.
 */
import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Loader2, Send, Eye, Code2, Sparkles, Users, UserCircle2, CheckCircle2 } from "lucide-react";
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
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { appendSignatureToHtml, type SignatureAgent } from "@/lib/emailSignature";

interface AgentOption {
  id: string;
  full_name: string;
  title: string | null;
  photo_url: string | null;
  phone: string | null;
  email: string | null;
}

interface Recipient {
  id: string;
  email: string;
  name?: string | null;
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  recipients: Recipient[];
  /** Optional label for email_logs `template_type`. */
  campaignName?: string;
}

const BULK_HTML_WRAPPER = (body: string) => `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head><body style="margin:0;padding:0;background:#F1F5F9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#0F172A;"><table width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:32px 16px;"><table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#FFFFFF;border-radius:14px;border:1px solid #E2E8F0;"><tr><td style="padding:36px;font-size:15px;line-height:1.65;color:#0F172A;white-space:pre-wrap;">${body}</td></tr><tr><td style="padding:0 36px 36px;border-top:1px solid #E2E8F0;padding-top:20px;font-size:13px;color:#475569;">Best,<br/><strong style="color:#0F172A;">Presale Properties Team</strong><br/><span style="color:#64748B;">presaleproperties.com</span></td></tr></table></td></tr></table></body></html>`;

export function BulkEmailDialog({ open, onOpenChange, recipients, campaignName }: Props) {
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [bodyIsHtml, setBodyIsHtml] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [sending, setSending] = useState(false);
  const [selectedAgentId, setSelectedAgentId] = useState<string>("");
  const [includeSignature, setIncludeSignature] = useState(true);

  const validRecipients = useMemo(
    () => recipients.filter((r) => !!r.email && /\S+@\S+/.test(r.email)),
    [recipients],
  );

  const { data: agents } = useQuery({
    queryKey: ["bulk-email-agents"],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("team_members_public")
        .select("id, full_name, title, photo_url, phone, email, sort_order, is_active")
        .eq("is_active", true)
        .order("sort_order", { ascending: true });
      if (error) throw error;
      return (data || []) as AgentOption[];
    },
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

  const finalHtml = useMemo(() => {
    const base = bodyIsHtml ? body : BULK_HTML_WRAPPER(body.replace(/\n/g, "<br/>"));
    if (!includeSignature || !selectedAgent) return base;
    return appendSignatureToHtml(base, selectedAgent);
  }, [body, bodyIsHtml, includeSignature, selectedAgent]);

  const canSend =
    subject.trim().length > 0 &&
    body.trim().length > 0 &&
    validRecipients.length > 0 &&
    !sending;

  const handleSend = async () => {
    if (!canSend) return;
    setSending(true);
    try {
      const { error } = await supabase.functions.invoke("send-direct-email", {
        body: {
          to: validRecipients.map((r) => r.email),
          subject: subject.trim(),
          html: finalHtml,
          campaign_name: campaignName || "admin_bulk_email",
        },
      });
      if (error) throw error;
      toast.success(
        `Email sent to ${validRecipients.length} recipient${validRecipients.length === 1 ? "" : "s"}`,
      );
      // reset & close
      setSubject("");
      setBody("");
      setBodyIsHtml(false);
      onOpenChange(false);
    } catch (err: any) {
      toast.error(err?.message || "Failed to send bulk email");
    } finally {
      setSending(false);
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base">
              <Users className="h-4 w-4" />
              Bulk email — {validRecipients.length} recipient
              {validRecipients.length === 1 ? "" : "s"}
            </DialogTitle>
            <DialogDescription className="text-xs">
              Sends individually via your in-app email service. Each send is
              logged to the Email Center — recipients won't see each other.
            </DialogDescription>
          </DialogHeader>

          {/* Recipient chips */}
          <ScrollArea className="max-h-[88px] rounded-md border border-border bg-muted/30 p-2">
            <div className="flex flex-wrap gap-1">
              {validRecipients.slice(0, 60).map((r) => (
                <Badge
                  key={r.id}
                  variant="secondary"
                  className="h-5 px-1.5 text-[10px] font-normal"
                >
                  {r.email}
                </Badge>
              ))}
              {validRecipients.length > 60 && (
                <Badge variant="outline" className="h-5 px-1.5 text-[10px]">
                  +{validRecipients.length - 60} more
                </Badge>
              )}
            </div>
          </ScrollArea>

          {/* Subject */}
          <div className="space-y-1">
            <Label htmlFor="bulk-subject" className="text-[10px] uppercase tracking-wider text-muted-foreground">
              Subject
            </Label>
            <Input
              id="bulk-subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="e.g. New presale opportunity in Surrey"
              className="h-9 text-sm"
            />
          </div>

          {/* Body */}
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <Label htmlFor="bulk-body" className="text-[10px] uppercase tracking-wider text-muted-foreground">
                Message
              </Label>
              <button
                type="button"
                onClick={() => setBodyIsHtml((v) => !v)}
                className={cn(
                  "inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] transition-colors",
                  bodyIsHtml
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:text-foreground",
                )}
                title="Toggle raw HTML mode"
              >
                <Code2 className="h-2.5 w-2.5" />
                {bodyIsHtml ? "HTML mode" : "Plain text"}
              </button>
            </div>
            <Textarea
              id="bulk-body"
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder={
                bodyIsHtml
                  ? "<p>Paste or write HTML…</p>"
                  : "Write a short, personal note. Line breaks become paragraphs."
              }
              className={cn(
                "min-h-[180px] text-sm leading-relaxed",
                bodyIsHtml && "font-mono text-xs",
              )}
            />
            <p className="text-[10px] text-muted-foreground">
              <Sparkles className="mr-0.5 inline h-2.5 w-2.5" />
              Same message goes to all selected leads — keep it generic.
            </p>
          </div>

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPreviewOpen(true)}
              disabled={!body.trim()}
              className="gap-1.5"
            >
              <Eye className="h-3.5 w-3.5" />
              Preview
            </Button>
            <Button
              size="sm"
              onClick={handleSend}
              disabled={!canSend}
              className="gap-1.5"
            >
              {sending ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Send className="h-3.5 w-3.5" />
              )}
              Send to {validRecipients.length}
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
              Subject:{" "}
              <span className="font-medium text-foreground">
                {subject || "(no subject)"}
              </span>
            </DialogDescription>
          </DialogHeader>
          <div className="overflow-hidden rounded-md border border-border bg-muted/30">
            <iframe
              srcDoc={finalHtml}
              title="Bulk email preview"
              sandbox=""
              className="h-[460px] w-full bg-white"
            />
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
