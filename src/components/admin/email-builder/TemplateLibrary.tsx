import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Mail, UserPlus, Bell, Megaphone, Gift, Calendar, Eye, Copy, Check } from "lucide-react";
import type { EmailBlockData } from "./EmailBlock";

export interface TemplatePreset {
  id: string;
  name: string;
  description: string;
  category: "welcome" | "followup" | "campaign";
  icon: React.ReactNode;
  subject: string;
  blocks: EmailBlockData[];
}

const TEMPLATE_PRESETS: TemplatePreset[] = [
  {
    id: "welcome-modern",
    name: "Modern Welcome",
    description: "Clean, professional welcome email with project highlights",
    category: "welcome",
    icon: <UserPlus className="h-5 w-5" />,
    subject: "Welcome to {{project_name}} – Your Journey Starts Here",
    blocks: [
      {
        id: crypto.randomUUID(),
        type: "heading",
        content: { text: "Welcome to {{project_name}}", level: "h1", align: "center" },
      },
      {
        id: crypto.randomUUID(),
        type: "text",
        content: {
          text: "Hi {{lead_name}},\n\nThank you for your interest in {{project_name}} located in {{project_city}}. We're excited to share this exclusive opportunity with you.",
          align: "left",
        },
      },
      {
        id: crypto.randomUUID(),
        type: "divider",
        content: {},
      },
      {
        id: crypto.randomUUID(),
        type: "heading",
        content: { text: "What's Next?", level: "h2", align: "left" },
      },
      {
        id: crypto.randomUUID(),
        type: "list",
        content: {
          items: [
            "Review the attached floor plans and pricing",
            "Schedule a private consultation with our team",
            "Get early access to unit selection",
          ],
        },
      },
      {
        id: crypto.randomUUID(),
        type: "button",
        content: { text: "View Floor Plans", url: "#", align: "center", color: "#d4af37" },
      },
      {
        id: crypto.randomUUID(),
        type: "text",
        content: {
          text: "We'll be in touch shortly with more details. In the meantime, feel free to reach out with any questions.\n\nBest regards,\nThe PresaleProperties Team",
          align: "left",
        },
      },
    ],
  },
  {
    id: "welcome-minimal",
    name: "Minimal Welcome",
    description: "Simple and elegant welcome with call-to-action",
    category: "welcome",
    icon: <Mail className="h-5 w-5" />,
    subject: "Thank You for Your Interest in {{project_name}}",
    blocks: [
      {
        id: crypto.randomUUID(),
        type: "text",
        content: {
          text: "Hi {{lead_name}},\n\nThank you for registering your interest in {{project_name}}.\n\nAttached you'll find the floor plans and pricing information you requested. Our team will reach out within 24 hours to answer any questions.",
          align: "left",
        },
      },
      {
        id: crypto.randomUUID(),
        type: "button",
        content: { text: "Download Brochure", url: "#", align: "left", color: "#1a1a1a" },
      },
      {
        id: crypto.randomUUID(),
        type: "text",
        content: { text: "Warm regards,\nPresaleProperties Team", align: "left" },
      },
    ],
  },
  {
    id: "followup-check-in",
    name: "Friendly Check-In",
    description: "Warm follow-up to re-engage leads",
    category: "followup",
    icon: <Bell className="h-5 w-5" />,
    subject: "Still Interested in {{project_name}}?",
    blocks: [
      {
        id: crypto.randomUUID(),
        type: "heading",
        content: { text: "We Haven't Forgotten About You", level: "h1", align: "center" },
      },
      {
        id: crypto.randomUUID(),
        type: "text",
        content: {
          text: "Hi {{lead_name}},\n\nWe noticed you registered interest in {{project_name}} a while back. We wanted to check in and see if you had any questions.\n\nUnits are moving quickly, and we'd hate for you to miss out on this opportunity.",
          align: "left",
        },
      },
      {
        id: crypto.randomUUID(),
        type: "columns",
        content: {
          left: "✓ Prime location in {{project_city}}\n✓ Premium finishes\n✓ Flexible deposit structure",
          right: "✓ Move-in ready soon\n✓ Limited units remaining\n✓ Special incentives available",
        },
      },
      {
        id: crypto.randomUUID(),
        type: "button",
        content: { text: "Schedule a Call", url: "#", align: "center", color: "#2563eb" },
      },
    ],
  },
  {
    id: "followup-update",
    name: "Project Update",
    description: "Share construction progress or milestones",
    category: "followup",
    icon: <Calendar className="h-5 w-5" />,
    subject: "Exciting Update on {{project_name}}!",
    blocks: [
      {
        id: crypto.randomUUID(),
        type: "heading",
        content: { text: "Construction Update", level: "h1", align: "center" },
      },
      {
        id: crypto.randomUUID(),
        type: "image",
        content: { src: "", alt: "Construction Progress" },
      },
      {
        id: crypto.randomUUID(),
        type: "text",
        content: {
          text: "Hi {{lead_name}},\n\nWe're thrilled to share the latest progress on {{project_name}}! Construction is on track and we're getting closer to completion every day.",
          align: "left",
        },
      },
      {
        id: crypto.randomUUID(),
        type: "heading",
        content: { text: "Key Milestones", level: "h2", align: "left" },
      },
      {
        id: crypto.randomUUID(),
        type: "list",
        content: {
          items: [
            "Foundation complete",
            "Structure rising on schedule",
            "Interior work beginning soon",
          ],
        },
      },
      {
        id: crypto.randomUUID(),
        type: "button",
        content: { text: "View More Photos", url: "#", align: "center", color: "#059669" },
      },
    ],
  },
  {
    id: "campaign-launch",
    name: "New Project Launch",
    description: "Announce a new presale project with impact",
    category: "campaign",
    icon: <Megaphone className="h-5 w-5" />,
    subject: "🏠 Introducing {{project_name}} – Now Open for Registration",
    blocks: [
      {
        id: crypto.randomUUID(),
        type: "heading",
        content: { text: "Introducing {{project_name}}", level: "h1", align: "center" },
      },
      {
        id: crypto.randomUUID(),
        type: "text",
        content: { text: "A new standard of living in {{project_city}}", align: "center" },
      },
      {
        id: crypto.randomUUID(),
        type: "image",
        content: { src: "", alt: "Project Rendering" },
      },
      {
        id: crypto.randomUUID(),
        type: "divider",
        content: {},
      },
      {
        id: crypto.randomUUID(),
        type: "text",
        content: {
          text: "We're excited to announce the launch of {{project_name}}, a stunning new development that redefines modern living.\n\nBe among the first to secure your home in this highly anticipated project.",
          align: "left",
        },
      },
      {
        id: crypto.randomUUID(),
        type: "heading",
        content: { text: "Project Highlights", level: "h2", align: "left" },
      },
      {
        id: crypto.randomUUID(),
        type: "list",
        content: {
          items: [
            "Studios to 3-bedroom homes",
            "World-class amenities",
            "Steps to transit and shopping",
            "Developer incentives available",
          ],
        },
      },
      {
        id: crypto.randomUUID(),
        type: "button",
        content: { text: "Register Now – Limited Time", url: "#", align: "center", color: "#dc2626" },
      },
    ],
  },
  {
    id: "campaign-incentive",
    name: "Special Incentive",
    description: "Promote limited-time offers and discounts",
    category: "campaign",
    icon: <Gift className="h-5 w-5" />,
    subject: "🎁 Exclusive Offer: Save on {{project_name}}",
    blocks: [
      {
        id: crypto.randomUUID(),
        type: "heading",
        content: { text: "Limited Time Offer", level: "h1", align: "center" },
      },
      {
        id: crypto.randomUUID(),
        type: "text",
        content: {
          text: "Hi {{lead_name}},\n\nFor a limited time, we're offering exclusive incentives on {{project_name}} that you won't want to miss.",
          align: "left",
        },
      },
      {
        id: crypto.randomUUID(),
        type: "divider",
        content: {},
      },
      {
        id: crypto.randomUUID(),
        type: "heading",
        content: { text: "Your Exclusive Benefits", level: "h2", align: "center" },
      },
      {
        id: crypto.randomUUID(),
        type: "columns",
        content: {
          left: "💰 $10,000 OFF\nSelect floor plans",
          right: "🚗 FREE PARKING\nValued at $35,000",
        },
      },
      {
        id: crypto.randomUUID(),
        type: "text",
        content: {
          text: "This offer expires at the end of the month. Don't miss your chance to save on your dream home.",
          align: "center",
        },
      },
      {
        id: crypto.randomUUID(),
        type: "button",
        content: { text: "Claim Your Offer", url: "#", align: "center", color: "#7c3aed" },
      },
    ],
  },
];

// Generate preview HTML for a template
function generatePreviewHTML(blocks: EmailBlockData[], subject: string): string {
  const generateBlockHTML = (block: EmailBlockData): string => {
    switch (block.type) {
      case "heading":
        const tag = block.content.level || "h1";
        const fontSize = tag === "h1" ? "24px" : tag === "h2" ? "20px" : "18px";
        return `<${tag} style="margin: 0 0 16px; font-size: ${fontSize}; font-weight: bold; text-align: ${block.content.align};">${block.content.text}</${tag}>`;
      case "text":
        return `<p style="margin: 0 0 16px; line-height: 1.6; text-align: ${block.content.align}; white-space: pre-wrap;">${block.content.text}</p>`;
      case "image":
        if (!block.content.src) return `<div style="background: #f0f0f0; height: 120px; display: flex; align-items: center; justify-content: center; margin-bottom: 16px; border-radius: 4px; color: #999;">Image Placeholder</div>`;
        return `<img src="${block.content.src}" alt="${block.content.alt}" style="max-width: 100%; display: block; margin: 0 auto 16px;" />`;
      case "button":
        return `<div style="text-align: ${block.content.align}; margin: 16px 0;"><a href="#" style="display: inline-block; padding: 12px 24px; background-color: ${block.content.color}; color: #ffffff; text-decoration: none; border-radius: 4px; font-weight: 500;">${block.content.text}</a></div>`;
      case "divider":
        return `<hr style="border: none; border-top: 1px solid #eee; margin: 24px 0;" />`;
      case "columns":
        return `<table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 16px;"><tr><td width="48%" valign="top" style="padding-right: 2%; white-space: pre-wrap;">${block.content.left}</td><td width="48%" valign="top" style="padding-left: 2%; white-space: pre-wrap;">${block.content.right}</td></tr></table>`;
      case "list":
        const items = block.content.items?.map((item: string) => `<li style="margin-bottom: 8px;">${item}</li>`).join("") || "";
        return `<ul style="margin: 0 0 16px; padding-left: 24px;">${items}</ul>`;
      default:
        return "";
    }
  };

  return `
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
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

interface TemplateLibraryProps {
  onSelectTemplate: (template: TemplatePreset) => void;
}

export function TemplateLibrary({ onSelectTemplate }: TemplateLibraryProps) {
  const [previewTemplate, setPreviewTemplate] = useState<TemplatePreset | null>(null);
  
  const categories = [
    { id: "welcome", label: "Welcome Emails", color: "bg-green-500" },
    { id: "followup", label: "Follow-ups", color: "bg-blue-500" },
    { id: "campaign", label: "Campaigns", color: "bg-purple-500" },
  ] as const;

  const handlePreview = (template: TemplatePreset, e: React.MouseEvent) => {
    e.stopPropagation();
    setPreviewTemplate(template);
  };

  const handleDuplicate = (template: TemplatePreset, e: React.MouseEvent) => {
    e.stopPropagation();
    const duplicated: TemplatePreset = {
      ...template,
      id: crypto.randomUUID(),
      name: `${template.name} (Copy)`,
      blocks: template.blocks.map((b) => ({ ...b, id: crypto.randomUUID() })),
    };
    onSelectTemplate(duplicated);
  };

  const handleUseFromPreview = () => {
    if (previewTemplate) {
      onSelectTemplate(previewTemplate);
      setPreviewTemplate(null);
    }
  };

  return (
    <>
      <div className="space-y-6">
        <div className="text-center space-y-2">
          <h3 className="text-lg font-semibold">Start with a Template</h3>
          <p className="text-sm text-muted-foreground">
            Choose a pre-built design to customize, or start from scratch
          </p>
        </div>

        {categories.map((category) => {
          const templates = TEMPLATE_PRESETS.filter((t) => t.category === category.id);
          
          return (
            <div key={category.id} className="space-y-3">
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${category.color}`} />
                <h4 className="font-medium text-sm">{category.label}</h4>
              </div>
              
              <div className="grid sm:grid-cols-2 gap-3">
                {templates.map((template) => (
                  <Card
                    key={template.id}
                    className="cursor-pointer hover:border-primary/50 hover:shadow-md transition-all group"
                    onClick={() => onSelectTemplate(template)}
                  >
                    <CardHeader className="pb-2">
                      <div className="flex items-start justify-between">
                        <div className="p-2 rounded-lg bg-muted group-hover:bg-primary/10 transition-colors">
                          {template.icon}
                        </div>
                        <Badge variant="secondary" className="text-xs">
                          {template.blocks.length} blocks
                        </Badge>
                      </div>
                      <CardTitle className="text-base">{template.name}</CardTitle>
                      <CardDescription className="text-xs line-clamp-2">
                        {template.description}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="flex-1 text-xs"
                          onClick={(e) => handlePreview(template, e)}
                        >
                          <Eye className="h-3 w-3 mr-1" />
                          Preview
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="flex-1 text-xs"
                          onClick={(e) => handleDuplicate(template, e)}
                        >
                          <Copy className="h-3 w-3 mr-1" />
                          Duplicate
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Preview Dialog */}
      <Dialog open={!!previewTemplate} onOpenChange={() => setPreviewTemplate(null)}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {previewTemplate?.icon}
              {previewTemplate?.name}
            </DialogTitle>
            <DialogDescription>
              Subject: {previewTemplate?.subject}
            </DialogDescription>
          </DialogHeader>
          
          <div className="flex-1 overflow-hidden border rounded-lg bg-muted/30">
            <div className="h-[400px] overflow-auto">
              {previewTemplate && (
                <iframe
                  srcDoc={generatePreviewHTML(previewTemplate.blocks, previewTemplate.subject)}
                  className="w-full h-full border-0"
                  title="Template Preview"
                />
              )}
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <Button variant="outline" className="flex-1" onClick={() => setPreviewTemplate(null)}>
              Close
            </Button>
            <Button className="flex-1" onClick={handleUseFromPreview}>
              <Check className="h-4 w-4 mr-2" />
              Use This Template
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

export { TEMPLATE_PRESETS };
