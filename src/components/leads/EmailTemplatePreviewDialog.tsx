import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader2, Mail } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";

interface EmailTemplatePreviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  templateName: string;
  formData: any;
  onSend: () => void;
  sending: boolean;
  sent: boolean;
  recipientName?: string;
  showSendButton?: boolean;
}

export function EmailTemplatePreviewDialog({
  open,
  onOpenChange,
  templateName,
  formData,
  onSend,
  sending,
  sent,
  recipientName,
  showSendButton = true,
}: EmailTemplatePreviewDialogProps) {
  const isMobile = useIsMobile();
  const [previewHtml, setPreviewHtml] = useState<string>("");

  useEffect(() => {
    if (!open || !formData) return;
    setPreviewHtml(buildEmailHtml(formData, recipientName));
  }, [open, formData, recipientName]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-w-3xl w-[calc(100%-2rem)] max-h-[90vh] flex flex-col p-0 gap-0"
      >
        <DialogHeader className="px-4 py-3 sm:px-6 sm:py-4 border-b shrink-0">
          <DialogTitle className="text-sm sm:text-base font-semibold truncate pr-8">
            Preview: {templateName}
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-auto bg-muted/30">
          {previewHtml ? (
            <div className="flex justify-center p-2 sm:p-4">
              <iframe
                srcDoc={previewHtml}
                title="Email Preview"
                className="w-full bg-white rounded-md border shadow-sm"
                style={{
                  maxWidth: isMobile ? "100%" : 680,
                  height: isMobile ? "60vh" : "65vh",
                }}
                sandbox="allow-same-origin"
              />
            </div>
          ) : (
            <div className="flex items-center justify-center h-48 text-muted-foreground text-sm">
              No preview available
            </div>
          )}
        </div>

        <div className="px-4 py-3 sm:px-6 sm:py-4 border-t shrink-0 flex gap-2 justify-end"
          style={{ paddingBottom: "max(0.75rem, env(safe-area-inset-bottom))" }}
        >
          <Button variant="outline" onClick={() => onOpenChange(false)} size={isMobile ? "sm" : "default"}>
            Close
          </Button>
          {showSendButton && (
            <Button
              onClick={onSend}
              disabled={sending || sent}
              size={isMobile ? "sm" : "default"}
            >
              {sending ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Mail className="h-4 w-4 mr-2" />
              )}
              {sent ? "Sent!" : "Send Email"}
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

/**
 * Builds the same HTML as the send-template-email edge function
 * so agents see an accurate preview before sending.
 */
function buildEmailHtml(fd: any, recipientFirstName?: string): string {
  if (!fd) return "";

  const copy = fd.copy || {};
  const firstName = recipientFirstName || "there";
  const projectName = fd.projectName || copy.projectName || "New Development";
  const heroImage = fd.heroImage || "";
  const headline = copy.headline || projectName;
  const bodyCopy = copy.bodyCopy || "";
  const subjectLine = copy.subjectLine || `${projectName} — Exclusive Overview`;
  const startingPrice = copy.startingPrice || "";
  const deposit = copy.deposit || "";
  const completion = copy.completion || "";
  const city = copy.city || fd.city || "";
  const ctaUrl = fd.directCtaUrl || fd.ctaUrl || copy.ctaUrl || "";
  const incentiveText = copy.incentiveText || "";

  // Build floor plan rows
  let floorPlanRows = "";
  try {
    const plans = Array.isArray(fd.floorPlans) ? fd.floorPlans : [];
    floorPlanRows = plans.slice(0, 4).map((fp: any) => {
      const label = fp.label || `${fp.beds || "?"} Bed + ${fp.baths || "?"} Bath`;
      const size = fp.sqft ? `${fp.sqft} sq ft` : "";
      const price = fp.price ? `From $${Number(fp.price).toLocaleString()}` : "";
      return `<tr><td style="padding:8px 16px;font-size:14px;color:#1a1a1a;border-bottom:1px solid #f0ede8;">${label}</td><td style="padding:8px 16px;font-size:14px;color:#666;border-bottom:1px solid #f0ede8;">${size}</td><td style="padding:8px 16px;font-size:14px;color:#1a1a1a;font-weight:600;border-bottom:1px solid #f0ede8;text-align:right;">${price}</td></tr>`;
    }).join("");
  } catch { /* ignore */ }

  // Build stats rows
  let statsHtml = "";
  const stats = [
    startingPrice && { label: "Starting From", value: startingPrice },
    deposit && { label: "Deposit", value: deposit },
    completion && { label: "Completion", value: completion },
  ].filter(Boolean);
  if (stats.length) {
    statsHtml = `<tr><td style="padding:16px 32px;"><table width="100%" cellpadding="0" cellspacing="0">${stats.map((s: any) =>
      `<tr><td style="padding:6px 0;font-size:13px;color:#888;">${s.label}</td><td style="padding:6px 0;font-size:14px;color:#1a1a1a;font-weight:600;text-align:right;">${s.value}</td></tr>`
    ).join("")}</table></td></tr>`;
  }

  // Build info rows (custom rows from the builder)
  let infoRowsHtml = "";
  try {
    const infoRows = fd.infoRows || (copy.infoRows ? copy.infoRows : null);
    if (typeof infoRows === "string" && infoRows.trim()) {
      const rows = infoRows.split("  ").filter(Boolean);
      if (rows.length) {
        infoRowsHtml = `<tr><td style="padding:0 32px 16px;"><table width="100%" cellpadding="0" cellspacing="0">${rows.map((row: string) => {
          const [label, value] = row.split("|").map((s: string) => s.trim());
          return `<tr><td style="padding:6px 0;font-size:13px;color:#888;">${label || ""}</td><td style="padding:6px 0;font-size:14px;color:#1a1a1a;font-weight:600;text-align:right;">${value || ""}</td></tr>`;
        }).join("")}</table></td></tr>`;
      }
    } else if (Array.isArray(infoRows)) {
      const validRows = infoRows.filter((r: any) => r && (r.label || r.value));
      if (validRows.length) {
        infoRowsHtml = `<tr><td style="padding:0 32px 16px;"><table width="100%" cellpadding="0" cellspacing="0">${validRows.map((r: any) =>
          `<tr><td style="padding:6px 0;font-size:13px;color:#888;">${r.label || ""}</td><td style="padding:6px 0;font-size:14px;color:#1a1a1a;font-weight:600;text-align:right;">${r.value || ""}</td></tr>`
        ).join("")}</table></td></tr>`;
      }
    }
  } catch { /* ignore */ }

  // Personalise body copy — convert markdown bold to HTML
  const personalBody = bodyCopy
    .replace(/\{first_name\}/gi, firstName)
    .replace(/\{name\}/gi, firstName)
    .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
    .replace(/\n\n/g, "</p><p style='margin:0 0 12px;font-size:15px;color:#444;line-height:1.75;'>")
    .replace(/\n/g, "<br>");

  return `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1"></head>
<body style="margin:0;padding:0;background:#f7f5f2;font-family:'Plus Jakarta Sans',Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f7f5f2;"><tr><td align="center" style="padding:32px 16px;">
<table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border:1px solid #e0dbd3;border-radius:8px;overflow:hidden;max-width:100%;">

${heroImage ? `<tr><td>${ctaUrl ? `<a href="${ctaUrl}" target="_blank">` : ""}<img src="${heroImage}" alt="${projectName}" width="600" style="display:block;width:100%;height:auto;">${ctaUrl ? "</a>" : ""}</td></tr>` : ""}

<tr><td style="padding:32px 32px 0;">
<h1 style="margin:0 0 8px;font-size:26px;font-weight:700;color:#1a1a1a;">${headline}</h1>
${city ? `<p style="margin:0 0 12px;font-size:14px;color:#888;">${city}</p>` : ""}
</td></tr>

${statsHtml}

<tr><td style="padding:16px 32px;">
<p style="margin:0 0 12px;font-size:15px;color:#444;line-height:1.75;">Hi ${firstName},</p>
${personalBody ? `<p style="margin:0 0 16px;font-size:15px;color:#444;line-height:1.75;">${personalBody}</p>` : ""}
</td></tr>

${incentiveText ? `<tr><td style="padding:0 32px 16px;"><div style="background:#f7f5f2;padding:16px 20px;border-radius:6px;font-size:14px;color:#444;line-height:1.7;">${incentiveText.replace(/\n/g, "<br>")}</div></td></tr>` : ""}

${ctaUrl ? `<tr><td align="center" style="padding:8px 32px 24px;"><a href="${ctaUrl}" target="_blank" style="display:inline-block;background:#1a1a1a;color:#ffffff;font-size:15px;font-weight:600;text-decoration:none;padding:14px 40px;border-radius:50px;">View Full Details</a></td></tr>` : ""}

${floorPlanRows ? `<tr><td style="padding:0 32px 16px;"><p style="margin:0 0 12px;font-size:16px;font-weight:700;color:#1a1a1a;">Floor Plans</p><table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #f0ede8;border-radius:6px;overflow:hidden;">${floorPlanRows}</table></td></tr>` : ""}

${infoRowsHtml}

<tr><td style="padding:16px 32px 32px;">
<p style="margin:0;font-size:13px;color:#aaa;line-height:1.5;">Presale Properties &middot; <a href="https://presaleproperties.com" style="color:#888;text-decoration:underline;">presaleproperties.com</a></p>
</td></tr>

</table></td></tr></table>
</body></html>`;
}
