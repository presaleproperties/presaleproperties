import type { EmailBlockData } from "./EmailBlock";

interface EmailPreviewProps {
  blocks: EmailBlockData[];
  subject: string;
}

export function EmailPreview({ blocks, subject }: EmailPreviewProps) {
  const generateBlockHTML = (block: EmailBlockData): string => {
    switch (block.type) {
      case "heading":
        const tag = block.content.level || "h1";
        const fontSize = tag === "h1" ? "24px" : tag === "h2" ? "20px" : "18px";
        return `<${tag} style="margin: 0 0 16px; font-size: ${fontSize}; font-weight: bold; text-align: ${block.content.align};">${block.content.text}</${tag}>`;
      
      case "text":
        return `<p style="margin: 0 0 16px; line-height: 1.6; text-align: ${block.content.align};">${block.content.text}</p>`;
      
      case "image":
        if (!block.content.src) return "";
        return `<img src="${block.content.src}" alt="${block.content.alt}" style="max-width: 100%; width: ${block.content.width}; display: block; margin: 0 auto 16px;" />`;
      
      case "button":
        return `<div style="text-align: ${block.content.align}; margin: 16px 0;">
          <a href="${block.content.url}" style="display: inline-block; padding: 12px 24px; background-color: ${block.content.color}; color: #ffffff; text-decoration: none; border-radius: 4px; font-weight: 500;">${block.content.text}</a>
        </div>`;
      
      case "divider":
        return `<hr style="border: none; border-top: 1px ${block.content.style} ${block.content.color}; margin: 24px 0;" />`;
      
      case "columns":
        return `<table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 16px;">
          <tr>
            <td width="48%" valign="top" style="padding-right: 2%;">${block.content.left}</td>
            <td width="48%" valign="top" style="padding-left: 2%;">${block.content.right}</td>
          </tr>
        </table>`;
      
      case "list":
        const items = block.content.items?.map((item: string) => `<li style="margin-bottom: 8px;">${item}</li>`).join("") || "";
        return `<ul style="margin: 0 0 16px; padding-left: 24px;">${items}</ul>`;
      
      default:
        return "";
    }
  };

  const fullHTML = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${subject}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f5f5f5; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.05);">
          <tr>
            <td style="padding: 40px;">
              ${blocks.map(generateBlockHTML).join("\n")}
            </td>
          </tr>
          <tr>
            <td style="padding: 20px 40px; background-color: #f9f9f9; border-top: 1px solid #eee; text-align: center; color: #666; font-size: 12px;">
              <p style="margin: 0;">PresaleProperties.com | Vancouver, BC</p>
              <p style="margin: 8px 0 0;">You received this email because you signed up for project updates.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  return (
    <div className="border rounded-lg overflow-hidden bg-muted/30">
      <div className="bg-muted px-4 py-2 border-b">
        <p className="text-sm font-medium">Preview</p>
        <p className="text-xs text-muted-foreground truncate">Subject: {subject || "No subject"}</p>
      </div>
      <div className="h-[500px] overflow-auto">
        <iframe
          srcDoc={fullHTML}
          className="w-full h-full border-0"
          title="Email Preview"
        />
      </div>
    </div>
  );
}

export function generateEmailHTML(blocks: EmailBlockData[]): string {
  const generateBlockHTML = (block: EmailBlockData): string => {
    switch (block.type) {
      case "heading":
        const tag = block.content.level || "h1";
        const fontSize = tag === "h1" ? "24px" : tag === "h2" ? "20px" : "18px";
        return `<${tag} style="margin: 0 0 16px; font-size: ${fontSize}; font-weight: bold; text-align: ${block.content.align};">${block.content.text}</${tag}>`;
      case "text":
        return `<p style="margin: 0 0 16px; line-height: 1.6; text-align: ${block.content.align};">${block.content.text}</p>`;
      case "image":
        if (!block.content.src) return "";
        return `<img src="${block.content.src}" alt="${block.content.alt}" style="max-width: 100%; width: ${block.content.width}; display: block; margin: 0 auto 16px;" />`;
      case "button":
        return `<div style="text-align: ${block.content.align}; margin: 16px 0;"><a href="${block.content.url}" style="display: inline-block; padding: 12px 24px; background-color: ${block.content.color}; color: #ffffff; text-decoration: none; border-radius: 4px; font-weight: 500;">${block.content.text}</a></div>`;
      case "divider":
        return `<hr style="border: none; border-top: 1px ${block.content.style} ${block.content.color}; margin: 24px 0;" />`;
      case "columns":
        return `<table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 16px;"><tr><td width="48%" valign="top" style="padding-right: 2%;">${block.content.left}</td><td width="48%" valign="top" style="padding-left: 2%;">${block.content.right}</td></tr></table>`;
      case "list":
        const items = block.content.items?.map((item: string) => `<li style="margin-bottom: 8px;">${item}</li>`).join("") || "";
        return `<ul style="margin: 0 0 16px; padding-left: 24px;">${items}</ul>`;
      default:
        return "";
    }
  };

  return blocks.map(generateBlockHTML).join("\n");
}