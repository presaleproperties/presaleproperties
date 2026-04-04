import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader2, Mail, X } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";

interface EmailTemplatePreviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  templateName: string;
  formData: any;
  onSend: () => void;
  sending: boolean;
  sent: boolean;
}

export function EmailTemplatePreviewDialog({
  open,
  onOpenChange,
  templateName,
  formData,
  onSend,
  sending,
  sent,
}: EmailTemplatePreviewDialogProps) {
  const isMobile = useIsMobile();
  const [previewHtml, setPreviewHtml] = useState<string>("");

  useEffect(() => {
    if (!open || !formData) return;
    // Build a simplified preview from form_data
    const html = formData?.finalHtml || buildPreviewFromFormData(formData);
    setPreviewHtml(html);
  }, [open, formData]);

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
            Cancel
          </Button>
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
        </div>
      </DialogContent>
    </Dialog>
  );
}

function buildPreviewFromFormData(formData: any): string {
  if (!formData) return "";
  
  const heroImage = formData.heroImage || "";
  const projectName = formData.copy?.projectName || formData.projectName || "";
  const subjectLine = formData.copy?.subjectLine || "";
  const introText = formData.copy?.introText || "";
  const ctaText = formData.copy?.ctaText || "Learn More";
  const ctaUrl = formData.copy?.ctaUrl || "#";

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0">
  <style>
    body { margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #f5f5f5; }
    .container { max-width: 680px; margin: 0 auto; background: #fff; }
    .hero img { width: 100%; display: block; }
    .content { padding: 24px 32px; }
    h1 { font-size: 22px; color: #1a1a1a; margin: 0 0 12px; }
    p { font-size: 15px; color: #444; line-height: 1.6; margin: 0 0 16px; }
    .cta { display: inline-block; background: #1a1a1a; color: #fff; padding: 12px 28px; text-decoration: none; border-radius: 6px; font-size: 14px; font-weight: 600; }
  </style>
</head>
<body>
  <div class="container">
    ${heroImage ? `<div class="hero"><img src="${heroImage}" alt="${projectName}" /></div>` : ""}
    <div class="content">
      <h1>${subjectLine || projectName}</h1>
      ${introText ? `<p>${introText}</p>` : ""}
      ${ctaUrl ? `<p><a href="${ctaUrl}" class="cta">${ctaText}</a></p>` : ""}
    </div>
  </div>
</body>
</html>`;
}
