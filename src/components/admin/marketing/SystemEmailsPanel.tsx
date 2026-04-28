/**
 * SystemEmailsPanel
 * ─────────────────────────────────────────────────────────────────────────
 * Read-only catalog of automated/transactional emails fired by edge
 * functions (NOT stored in the email_templates table). Pulls live previews
 * from the `preview-system-emails` edge function so admins always see what
 * recipients actually receive.
 *
 * These templates live in CODE — to edit copy, an engineer must update the
 * relevant edge function (e.g. send-lead-autoresponse, send-buyer-welcome).
 * They are intentionally NOT user-editable to keep transactional emails
 * stable and reliable.
 */
import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Eye, Sparkles, Code2, Lock, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface SystemTemplate {
  key: string;
  name: string;
  category: string;
  subject: string;
  description: string;
  trigger?: string;
  edgeFunction?: string;
  html: string;
}

// Maps each template key to the edge function that fires it + the user-facing trigger
const TRIGGER_MAP: Record<string, { trigger: string; edgeFunction: string }> = {
  auto_response_a: { trigger: "Project lead form (lead has agent)", edgeFunction: "send-lead-autoresponse" },
  auto_response_b: { trigger: "Project lead form (no agent)", edgeFunction: "send-lead-autoresponse" },
  lead_magnet_guide: { trigger: "Exit-intent popup, 7 Mistakes form, newsletter signup", edgeFunction: "send-lead-autoresponse" },
  booking_confirmation: { trigger: "Consultation/showing booked", edgeFunction: "send-booking-notification" },
  buyer_welcome: { trigger: "New buyer account created", edgeFunction: "send-buyer-welcome" },
  buyer_welcome_premium: { trigger: "VIP/premium buyer account created", edgeFunction: "send-buyer-welcome" },
  project_welcome: { trigger: "Project signup (generic)", edgeFunction: "send-project-lead" },
  project_info_package: { trigger: "Project info package requested", edgeFunction: "send-project-lead" },
  buyer_recommendations: { trigger: "Tailored property matches", edgeFunction: "send-property-alerts" },
  agent_welcome: { trigger: "Agent account approved", edgeFunction: "send-welcome-email" },
  agent_request_received: { trigger: "New agent inquiry submitted", edgeFunction: "send-inquiry-notification" },
};

export function SystemEmailsPanel() {
  const [templates, setTemplates] = useState<SystemTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<SystemTemplate | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const { data, error: fnError } = await supabase.functions.invoke("preview-system-emails", {
          method: "GET",
        });
        if (fnError) throw fnError;
        const list: SystemTemplate[] = (data?.templates || []).map((t: any) => ({
          ...t,
          ...(TRIGGER_MAP[t.key] || {}),
        }));
        setTemplates(list);
      } catch (e: any) {
        setError(e?.message || "Failed to load system templates");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16 text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin mr-2" />
        Loading system emails…
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
        {error}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-info/30 bg-info/5 p-4 flex items-start gap-3">
        <Lock className="h-4 w-4 text-info mt-0.5 shrink-0" />
        <div className="text-xs leading-relaxed text-foreground/80">
          <p className="font-semibold text-foreground mb-1">Read-only — these are sent automatically by triggers.</p>
          <p>
            These emails live in code (edge functions), not in the template builder. They fire on lead form
            submissions, bookings, and account events. To change copy, message an engineer with the function name shown on each card.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {templates.map((t) => (
          <div
            key={t.key}
            className="rounded-xl border border-border bg-card overflow-hidden hover:border-primary/40 hover:shadow-md transition-all flex flex-col group"
          >
            {/* Thumbnail preview of actual email */}
            <button
              type="button"
              onClick={() => setPreview(t)}
              className="relative w-full h-48 bg-[#faf8f4] overflow-hidden border-b border-border block"
              aria-label={`Preview ${t.name}`}
            >
              <div
                className="absolute top-0 left-0 origin-top-left pointer-events-none"
                style={{
                  width: "600px",
                  transform: "scale(0.5)",
                  height: "960px",
                }}
              >
                <iframe
                  srcDoc={t.html}
                  title={`${t.name} thumbnail`}
                  className="w-[600px] h-[960px] border-0 bg-[#faf8f4] block"
                  sandbox="allow-same-origin"
                  scrolling="no"
                  tabIndex={-1}
                />
              </div>
              <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-center pb-3">
                <div className="bg-background/95 backdrop-blur-sm rounded-full px-3 py-1.5 text-xs font-medium flex items-center gap-1.5 shadow-sm">
                  <Eye className="h-3.5 w-3.5" /> Click to expand
                </div>
              </div>
            </button>
            <div className="p-4 flex-1 space-y-2.5">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-1.5">
                  <Sparkles className="h-3.5 w-3.5 text-primary shrink-0" />
                  <Badge variant="secondary" className="text-[9px] h-4 px-1.5 capitalize">
                    {t.category || "auto"}
                  </Badge>
                </div>
                <Badge variant="outline" className="text-[9px] h-4 px-1.5 gap-1 font-mono">
                  <Lock className="h-2.5 w-2.5" /> code
                </Badge>
              </div>
              <h3 className="font-semibold text-sm leading-snug">{t.name}</h3>
              <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">{t.description}</p>
              {t.subject && (
                <p className="text-[11px] text-muted-foreground/80 italic">
                  Subject: {t.subject}
                </p>
              )}
              {t.trigger && (
                <div className="pt-2 mt-2 border-t border-border/50 space-y-1">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/70">Triggered by</p>
                  <p className="text-[11px] text-foreground/80">{t.trigger}</p>
                  {t.edgeFunction && (
                    <p className="text-[10px] text-muted-foreground/70 font-mono flex items-center gap-1">
                      <Code2 className="h-2.5 w-2.5" /> {t.edgeFunction}
                    </p>
                  )}
                </div>
              )}
            </div>
            <div className="p-3 border-t border-border bg-muted/20">
              <Button
                size="sm"
                variant="ghost"
                className="w-full gap-1.5 h-8 text-xs"
                onClick={() => setPreview(t)}
              >
                <Eye className="h-3.5 w-3.5" /> Preview
              </Button>
            </div>
          </div>
        ))}
      </div>

      <Dialog open={!!preview} onOpenChange={(o) => !o && setPreview(null)}>
        <DialogContent className="max-w-4xl w-[95vw] h-[92vh] max-h-[92vh] overflow-hidden flex flex-col p-0 gap-0">
          <DialogHeader className="p-4 border-b shrink-0 space-y-1">
            <DialogTitle className="text-sm">{preview?.name}</DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              {preview?.subject ? `Subject: ${preview.subject}` : "Email preview"}
            </DialogDescription>
            {preview?.edgeFunction && (
              <p className="text-[10px] text-muted-foreground/70 font-mono flex items-center gap-1 pt-1">
                <Code2 className="h-2.5 w-2.5" /> {preview.edgeFunction}
              </p>
            )}
          </DialogHeader>
          <div className="flex-1 overflow-hidden bg-[#faf8f4] min-h-0">
            {preview && (
              <iframe
                key={preview.key}
                srcDoc={preview.html}
                title={preview.name}
                className="w-full h-full bg-[#faf8f4] border-0 block"
                sandbox="allow-same-origin allow-popups"
              />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
