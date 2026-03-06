import { useState, useEffect, useRef, useCallback } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  Copy,
  RefreshCw,
  Upload,
  Mail,
  Eye,
  Code2,
  Building2,
  CheckCircle2,
  FileText,
  Link2,
  Sparkles,
  Monitor,
  Smartphone,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ─── Types ────────────────────────────────────────────────────────────────────
interface Project {
  id: string;
  name: string;
  slug: string;
  city: string;
  neighborhood: string | null;
  address: string | null;
  developer_name: string | null;
  starting_price: number | null;
  completion_year: number | null;
  completion_month: number | null;
  featured_image: string | null;
  brochure_files: string[] | null;
  floorplan_files: string[] | null;
  pricing_sheets: string[] | null;
  short_description: string | null;
  highlights: string[] | null;
  project_type: string;
}

interface TemplateVars {
  projectName: string;
  developerName: string;
  address: string;
  city: string;
  neighborhood: string;
  completion: string;
  startingPrice: string;
  featuredImage: string;
  brochureUrl: string;
  floorplanUrl: string;
  pricingUrl: string;
  projectUrl: string;
  headline: string;
  bodyCopy: string;
  bookUrl: string;
  subjectLine: string;
  previewText: string;
}

interface CtaToggles {
  brochure: boolean;
  floorplan: boolean;
  pricing: boolean;
  viewProject: boolean;
  bookConsult: boolean;
}

const EMPTY_VARS: TemplateVars = {
  projectName: "",
  developerName: "",
  address: "",
  city: "",
  neighborhood: "",
  completion: "",
  startingPrice: "",
  featuredImage: "",
  brochureUrl: "",
  floorplanUrl: "",
  pricingUrl: "",
  projectUrl: "",
  headline: "",
  bodyCopy: "",
  bookUrl: "https://presaleproperties.ca/book",
  subjectLine: "",
  previewText: "",
};

const DEFAULT_CTA: CtaToggles = {
  brochure: true,
  floorplan: true,
  pricing: false,
  viewProject: true,
  bookConsult: true,
};

// ─── Template builder ─────────────────────────────────────────────────────────
function buildEmailHtml(vars: TemplateVars, cta: CtaToggles): string {
  const locationTag = [vars.neighborhood, vars.city ? vars.city.toUpperCase() : ""].filter(Boolean).join("&nbsp;&nbsp;·&nbsp;&nbsp;").toUpperCase();

  // Hero image — full-bleed, no border radius
  const heroImg = vars.featuredImage
    ? `<tr>
        <td style="padding:0; margin:0; line-height:0; font-size:0;">
          <img src="${vars.featuredImage}" alt="${vars.projectName}" width="600"
               style="display:block; width:100%; max-width:600px; height:auto; min-height:300px; object-fit:cover; border:0;" />
        </td>
      </tr>`
    : `<tr>
        <td style="padding:0; margin:0; line-height:0; font-size:0; background-color:#1a1a1a; height:300px; text-align:center; vertical-align:middle;">
          <div style="font-family:'Cormorant Garamond', Georgia, serif; font-size:14px; letter-spacing:4px; text-transform:uppercase; color:#C9A55A; padding:120px 0;">NO IMAGE — ADD HERO IMAGE URL</div>
        </td>
      </tr>`;

  // Gold location tag bar below hero
  const locationBar = locationTag
    ? `<tr>
        <td style="padding:14px 48px; background-color:#ffffff; border-bottom:1px solid #efefef;">
          <div style="font-family:'DM Sans', Helvetica, Arial, sans-serif; font-size:10px; font-weight:400; letter-spacing:3.5px; text-transform:uppercase; color:#999999;">
            ${locationTag}${vars.completion ? `&nbsp;&nbsp;·&nbsp;&nbsp;EST. COMPLETION ${vars.completion.toUpperCase()}` : ""}
          </div>
        </td>
      </tr>`
    : "";

  // Stats row — price, bedrooms range, open date styled like the reference
  const statsRow = (vars.startingPrice || vars.developerName || vars.city)
    ? `<table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="border-top:1px solid #efefef; border-bottom:1px solid #efefef; margin-bottom:40px;">
        <tr>
          ${vars.startingPrice ? `
          <td valign="top" style="padding:20px 0; padding-right:32px; width:33%;">
            <div style="font-family:'Cormorant Garamond', Georgia, serif; font-size:36px; font-weight:400; color:#111111; line-height:1;">${vars.startingPrice}</div>
            <div style="font-family:'DM Sans', Helvetica, Arial, sans-serif; font-size:9px; font-weight:400; letter-spacing:2.5px; text-transform:uppercase; color:#aaaaaa; margin-top:7px;">Starting From + GST</div>
          </td>
          <td style="width:1px; padding:0; background:#efefef;">&nbsp;</td>` : ""}
          ${vars.developerName ? `
          <td valign="top" style="padding:20px 16px; width:33%;">
            <div style="font-family:'Cormorant Garamond', Georgia, serif; font-size:26px; font-weight:400; color:#111111; line-height:1.15;">${vars.developerName}</div>
            <div style="font-family:'DM Sans', Helvetica, Arial, sans-serif; font-size:9px; font-weight:400; letter-spacing:2.5px; text-transform:uppercase; color:#aaaaaa; margin-top:7px;">Developer</div>
          </td>
          <td style="width:1px; padding:0; background:#efefef;">&nbsp;</td>` : ""}
          ${vars.city ? `
          <td valign="top" style="padding:20px 0 20px 16px; width:33%;">
            <div style="font-family:'Cormorant Garamond', Georgia, serif; font-size:26px; font-weight:400; color:#111111; line-height:1.15;">${vars.city}, BC</div>
            <div style="font-family:'DM Sans', Helvetica, Arial, sans-serif; font-size:9px; font-weight:400; letter-spacing:2.5px; text-transform:uppercase; color:#aaaaaa; margin-top:7px;">Location</div>
          </td>` : ""}
        </tr>
      </table>`
    : "";

  // CTA buttons — primary dark fill, secondary outlined
  const primaryCta = (href: string, label: string) =>
    href
      ? `<table role="presentation" cellpadding="0" cellspacing="0" style="margin-bottom:10px;">
          <tr>
            <td style="background-color:#111111; padding:17px 44px;">
              <a href="${href}" target="_blank" style="font-family:'DM Sans', Helvetica, Arial, sans-serif; font-size:10px; font-weight:500; letter-spacing:3px; text-transform:uppercase; color:#ffffff; text-decoration:none; white-space:nowrap; display:block;">${label}&nbsp;&nbsp;&rarr;</a>
            </td>
          </tr>
        </table>`
      : "";

  const secondaryCta = (href: string, label: string) =>
    href
      ? `<table role="presentation" cellpadding="0" cellspacing="0" style="margin-bottom:10px;">
          <tr>
            <td style="border:1px solid #C9A55A; padding:16px 44px;">
              <a href="${href}" target="_blank" style="font-family:'DM Sans', Helvetica, Arial, sans-serif; font-size:10px; font-weight:400; letter-spacing:3px; text-transform:uppercase; color:#C9A55A; text-decoration:none; white-space:nowrap; display:block;">${label}</a>
            </td>
          </tr>
        </table>`
      : "";

  const ctaSection = [
    cta.floorplan && vars.floorplanUrl ? primaryCta(vars.floorplanUrl, "View Floor Plans &amp; Pricing") : "",
    cta.brochure && vars.brochureUrl ? primaryCta(vars.brochureUrl, "Download Brochure") : "",
    cta.pricing && vars.pricingUrl ? primaryCta(vars.pricingUrl, "View Pricing") : "",
    cta.bookConsult && vars.bookUrl ? secondaryCta(vars.bookUrl, "Book a Private Tour") : "",
    cta.viewProject && vars.projectUrl ? secondaryCta(vars.projectUrl, "View Full Project") : "",
  ].filter(Boolean).join("\n");

  // Highlights list — gold bullet squares
  const highlightsList = vars.bodyCopy
    ? vars.bodyCopy.split("\n").filter(Boolean).map((line) =>
        `<tr>
          <td valign="top" style="padding-bottom:14px; padding-right:14px; width:12px;">
            <div style="width:5px; height:5px; background-color:#C9A55A; margin-top:7px;"></div>
          </td>
          <td valign="top" style="padding-bottom:14px;">
            <div style="font-family:'DM Sans', Helvetica, Arial, sans-serif; font-size:13px; font-weight:300; color:#444444; line-height:1.75;">${line}</div>
          </td>
        </tr>`
      ).join("\n")
    : "";

  return `<!DOCTYPE html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <meta name="x-apple-disable-message-reformatting">
  <title>${vars.subjectLine || vars.projectName || "Presale Properties"}</title>
  <!--[if mso]>
  <noscript><xml><o:OfficeDocumentSettings><o:AllowPNG/><o:PixelsPerInch>96</o:PixelsPerInch></o:OfficeDocumentSettings></xml></noscript>
  <![endif]-->
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600;1,300;1,400;1,600&family=DM+Sans:wght@300;400;500&display=swap');
    * { margin: 0; padding: 0; }
    body { margin: 0 !important; padding: 0 !important; background-color: #f4f4f0; width: 100% !important; -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
    table { border-collapse: collapse; mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
    img { -ms-interpolation-mode: bicubic; border: 0; height: auto; line-height: 100%; outline: none; text-decoration: none; display: block; }
    a { text-decoration: none; }
    @media only screen and (max-width: 620px) {
      .email-container { width: 100% !important; }
      .mobile-pad { padding: 32px 24px !important; }
      .hero-text { font-size: 38px !important; line-height: 44px !important; }
      .stats-cell { display: block !important; width: 100% !important; padding: 14px 0 !important; }
    }
  </style>
</head>
<body style="margin:0; padding:0; background-color:#f4f4f0; font-family:'DM Sans', Helvetica, Arial, sans-serif;">

  <!-- PREHEADER (hidden) -->
  <div style="display:none; max-height:0; overflow:hidden; color:#f4f4f0; font-size:1px; line-height:1px;">
    ${vars.previewText || `Exclusive presale opportunity — ${vars.projectName || "Now Available"}`}&#847;&zwnj;&nbsp;&#847;&zwnj;&nbsp;&#847;&zwnj;&nbsp;&#847;&zwnj;&nbsp;
  </div>

  <!-- EMAIL WRAPPER -->
  <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background-color:#f4f4f0;">
    <tr>
      <td align="center" valign="top" style="padding:32px 16px;">

        <!-- MAIN CONTAINER -->
        <table class="email-container" role="presentation" cellpadding="0" cellspacing="0" width="600" style="max-width:600px; background-color:#ffffff;">

          <!-- ═══════════ HEADER ═══════════ -->
          <tr>
            <td style="padding:36px 48px 28px 48px; background-color:#ffffff; border-bottom:1px solid #efefef;">
              <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
                <tr>
                  <td valign="bottom">
                    <div style="font-family:'DM Sans', Helvetica, Arial, sans-serif; font-size:9px; font-weight:400; letter-spacing:4px; text-transform:uppercase; color:#999999; margin-bottom:4px;">P R E S A L E</div>
                    <div style="font-family:'Cormorant Garamond', Georgia, serif; font-size:44px; font-weight:300; letter-spacing:6px; text-transform:uppercase; color:#111111; line-height:1;">PROPERTIES</div>
                  </td>
                  <td align="right" valign="bottom">
                    <div style="font-family:'DM Sans', Helvetica, Arial, sans-serif; font-size:9px; font-weight:300; letter-spacing:2.5px; text-transform:uppercase; color:#aaaaaa; line-height:1.8; text-align:right;">S U R R E Y &nbsp;·&nbsp; L A N G L E Y<br>M E T R O &nbsp; V A N C O U V E R</div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- ═══════════ HERO IMAGE ═══════════ -->
          ${heroImg}

          <!-- ═══════════ LOCATION TAG ═══════════ -->
          ${locationBar}

          <!-- ═══════════ MAIN CONTENT ═══════════ -->
          <tr>
            <td class="mobile-pad" style="padding:44px 48px 36px 48px; background-color:#ffffff;">

              <!-- Greeting -->
              <div style="font-family:'DM Sans', Helvetica, Arial, sans-serif; font-size:13px; font-weight:300; color:#888888; margin-bottom:20px;">Hi [First Name],</div>

              <!-- Headline: "The Moment is Now." style -->
              ${vars.headline
                ? `<div class="hero-text" style="font-family:'Cormorant Garamond', Georgia, serif; font-size:52px; font-weight:300; color:#111111; line-height:1.05; margin-bottom:28px; letter-spacing:-0.5px;">${vars.headline}</div>`
                : `<div class="hero-text" style="font-family:'Cormorant Garamond', Georgia, serif; font-size:52px; font-weight:300; color:#111111; line-height:1.05; margin-bottom:0; letter-spacing:-0.5px;">${vars.projectName || "The Moment"}</div>
                   <div class="hero-text" style="font-family:'Cormorant Garamond', Georgia, serif; font-size:52px; font-weight:300; font-style:italic; color:#C9A55A; line-height:1.05; margin-bottom:28px; letter-spacing:-0.5px;">is Now.</div>`
              }

              <!-- Body paragraph -->
              <div style="font-family:'DM Sans', Helvetica, Arial, sans-serif; font-size:14px; font-weight:300; color:#444444; line-height:1.85; margin-bottom:36px;">
                We're bringing you an exclusive first look at <strong style="font-weight:500; color:#111111;">${vars.projectName || "this opportunity"}</strong>${vars.neighborhood ? ` in <strong style="font-weight:500; color:#111111;">${vars.neighborhood}</strong>` : ""}${vars.city ? `, ${vars.city}` : ""}. ${vars.startingPrice ? `Starting from <strong style="font-weight:500;">${vars.startingPrice}</strong> — ` : ""}this is your chance to secure preferred pricing before public launch. Limited units available.
              </div>

              <!-- Thin divider -->
              <div style="width:100%; height:1px; background-color:#efefef; margin-bottom:36px;"></div>

              <!-- Stats Row -->
              ${statsRow}

              <!-- CTA Buttons -->
              ${ctaSection}

            </td>
          </tr>

          ${highlightsList ? `
          <!-- ═══════════ WHY THIS PROJECT ═══════════ -->
          <tr>
            <td style="padding:36px 48px 36px 48px; background-color:#fafaf8; border-top:1px solid #efefef; border-bottom:1px solid #efefef;">
              <div style="font-family:'DM Sans', Helvetica, Arial, sans-serif; font-size:9px; font-weight:500; letter-spacing:3.5px; text-transform:uppercase; color:#aaaaaa; margin-bottom:20px;">W H Y &nbsp; T H I S &nbsp; P R O J E C T</div>
              <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
                ${highlightsList}
              </table>
            </td>
          </tr>` : ""}

          <!-- ═══════════ SIGNATURE ═══════════ -->
          <tr>
            <td style="padding:40px 48px 36px 48px; background-color:#ffffff;">
              <div style="font-family:'Cormorant Garamond', Georgia, serif; font-size:26px; font-weight:400; color:#111111; margin-bottom:4px;">Uzair Muhammad</div>
              <div style="font-family:'DM Sans', Helvetica, Arial, sans-serif; font-size:9px; font-weight:400; letter-spacing:2.5px; text-transform:uppercase; color:#aaaaaa; margin-bottom:20px;">Presale Specialist &nbsp;·&nbsp; Presale Properties</div>
              <table role="presentation" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="padding-right:28px;">
                    <a href="tel:+16041234567" style="font-family:'DM Sans', Helvetica, Arial, sans-serif; font-size:13px; font-weight:300; color:#555555; text-decoration:none;">📞 604.XXX.XXXX</a>
                  </td>
                  <td>
                    <a href="https://presaleproperties.ca" style="font-family:'DM Sans', Helvetica, Arial, sans-serif; font-size:13px; font-weight:300; color:#C9A55A; text-decoration:none;">🌐 presaleproperties.ca</a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- ═══════════ FOOTER ═══════════ -->
          <tr>
            <td style="padding:28px 48px; background-color:#111111; border-top:3px solid #C9A55A;">
              <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
                <tr>
                  <td valign="top">
                    <div style="font-family:'DM Sans', Helvetica, Arial, sans-serif; font-size:9px; font-weight:400; letter-spacing:3px; text-transform:uppercase; color:#C9A55A; margin-bottom:8px;">Display &amp; Presentation Centre</div>
                    <div style="font-family:'DM Sans', Helvetica, Arial, sans-serif; font-size:12px; font-weight:300; color:#888888; line-height:1.8;">#108 2350 165 Street, Surrey BC</div>
                    <div style="font-family:'DM Sans', Helvetica, Arial, sans-serif; font-size:12px; font-weight:300; color:#888888; line-height:1.8;">Open Daily 12–5pm &nbsp;|&nbsp; Closed Thu &amp; Fri</div>
                  </td>
                  ${vars.projectUrl ? `<td align="right" valign="bottom">
                    <a href="${vars.projectUrl}" style="font-family:'DM Sans', Helvetica, Arial, sans-serif; font-size:9px; font-weight:400; letter-spacing:2.5px; text-transform:uppercase; color:#C9A55A; text-decoration:none;">View Project &rarr;</a>
                  </td>` : ""}
                </tr>
              </table>
            </td>
          </tr>

          <!-- ═══════════ LEGAL ═══════════ -->
          <tr>
            <td style="padding:20px 48px 24px 48px; background-color:#0d0d0d;">
              <div style="font-family:'DM Sans', Helvetica, Arial, sans-serif; font-size:10px; font-weight:300; color:#555555; line-height:1.7; margin-bottom:12px;">
                *Prices exclude taxes and are subject to availability at the time of inquiry and/or change without notice. This is not an offering for sale. Any such offering can only be made with a Disclosure Statement. E.&amp;O.E.
              </div>
              <div>
                <a href="*|UNSUB|*" style="font-family:'DM Sans', Helvetica, Arial, sans-serif; font-size:10px; font-weight:300; color:#444444; text-decoration:underline;">Unsubscribe</a>
                <span style="color:#333333; margin:0 8px;">·</span>
                <a href="*|UPDATE_PROFILE|*" style="font-family:'DM Sans', Helvetica, Arial, sans-serif; font-size:10px; font-weight:300; color:#444444; text-decoration:underline;">Update Preferences</a>
              </div>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>

</body>
</html>`;
}

  const heroImg = vars.featuredImage
    ? `<tr>
        <td style="padding:0; margin:0; line-height:0;">
          <img src="${vars.featuredImage}" alt="${vars.projectName}" width="600"
               style="display:block; width:100%; max-width:600px; height:320px; object-fit:cover;" />
        </td>
      </tr>`
    : "";

  const goldBar = `<tr>
    <td style="background-color:#C9A55A; padding: 14px 48px;">
      <div style="font-family:'DM Sans', Helvetica, Arial, sans-serif; font-size:11px; font-weight:500; letter-spacing:3px; text-transform:uppercase; color:#0C1A14;">
        ${[vars.neighborhood, locationLine ? locationLine : vars.city].filter(Boolean).join(" &nbsp;·&nbsp; ")}${vars.completion ? ` &nbsp;·&nbsp; EST. COMPLETION ${vars.completion.toUpperCase()}` : ""}
      </div>
    </td>
  </tr>`;

  const statsRow = (vars.startingPrice || vars.completion || vars.city)
    ? `<table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="margin-bottom:40px;">
        <tr>
          ${vars.startingPrice ? `
          <td width="33%" valign="top" style="padding-right:16px;">
            <div style="font-family:'Cormorant Garamond', Georgia, serif; font-size:32px; font-weight:600; color:#0C1A14; line-height:1;">${vars.startingPrice}</div>
            <div style="font-family:'DM Sans', Helvetica, Arial, sans-serif; font-size:10px; font-weight:400; letter-spacing:2px; text-transform:uppercase; color:#888; margin-top:6px;">Starting From + GST</div>
          </td>
          <td width="1" style="background-color:#E8E4DF; padding:0 1px;">&nbsp;</td>` : ""}
          ${vars.developerName ? `
          <td width="33%" valign="top" style="padding: 0 16px;">
            <div style="font-family:'Cormorant Garamond', Georgia, serif; font-size:22px; font-weight:600; color:#0C1A14; line-height:1.2;">${vars.developerName}</div>
            <div style="font-family:'DM Sans', Helvetica, Arial, sans-serif; font-size:10px; font-weight:400; letter-spacing:2px; text-transform:uppercase; color:#888; margin-top:6px;">Developer</div>
          </td>
          <td width="1" style="background-color:#E8E4DF; padding:0 1px;">&nbsp;</td>` : ""}
          ${vars.city ? `
          <td width="33%" valign="top" style="padding-left:16px;">
            <div style="font-family:'Cormorant Garamond', Georgia, serif; font-size:22px; font-weight:600; color:#0C1A14; line-height:1.2;">${vars.city}, BC</div>
            <div style="font-family:'DM Sans', Helvetica, Arial, sans-serif; font-size:10px; font-weight:400; letter-spacing:2px; text-transform:uppercase; color:#888; margin-top:6px;">Location</div>
          </td>` : ""}
        </tr>
      </table>`
    : "";

  // Primary CTA (dark fill)
  const primaryCta = (href: string, label: string) =>
    href
      ? `<table role="presentation" cellpadding="0" cellspacing="0" style="margin-bottom:12px;">
          <tr>
            <td style="background-color:#0C1A14; padding: 16px 40px;">
              <a href="${href}" style="font-family:'DM Sans', Helvetica, Arial, sans-serif; font-size:11px; font-weight:500; letter-spacing:3px; text-transform:uppercase; color:#FAFAF8; text-decoration:none; white-space:nowrap;">${label} &rarr;</a>
            </td>
          </tr>
        </table>`
      : "";

  // Secondary CTA (gold border)
  const secondaryCta = (href: string, label: string) =>
    href
      ? `<table role="presentation" cellpadding="0" cellspacing="0" style="margin-bottom:12px;">
          <tr>
            <td style="border: 1px solid #C9A55A; padding: 14px 40px;">
              <a href="${href}" style="font-family:'DM Sans', Helvetica, Arial, sans-serif; font-size:11px; font-weight:500; letter-spacing:3px; text-transform:uppercase; color:#C9A55A; text-decoration:none; white-space:nowrap;">${label}</a>
            </td>
          </tr>
        </table>`
      : "";

  const ctaSection = [
    cta.floorplan && vars.floorplanUrl ? primaryCta(vars.floorplanUrl, "View Floorplans &amp; Pricing") : "",
    cta.brochure && vars.brochureUrl ? primaryCta(vars.brochureUrl, "Download Brochure") : "",
    cta.pricing && vars.pricingUrl ? primaryCta(vars.pricingUrl, "View Pricing") : "",
    cta.viewProject && vars.projectUrl ? secondaryCta(vars.projectUrl, "View Full Project") : "",
    cta.bookConsult && vars.bookUrl ? secondaryCta(vars.bookUrl, "Book a Private Tour") : "",
  ].filter(Boolean).join("\n");

  const highlightsList = vars.bodyCopy
    ? vars.bodyCopy.split("\n").filter(Boolean).map((line) =>
        `<tr>
          <td valign="top" style="padding-bottom:12px;">
            <table role="presentation" cellpadding="0" cellspacing="0">
              <tr>
                <td style="padding-right:14px; padding-top:5px;">
                  <div style="width:6px; height:6px; background-color:#C9A55A;"></div>
                </td>
                <td>
                  <div style="font-family:'DM Sans', Helvetica, Arial, sans-serif; font-size:14px; font-weight:300; color:#3A3A3A; line-height:1.7;">${line}</div>
                </td>
              </tr>
            </table>
          </td>
        </tr>`
      ).join("\n")
    : "";

  return `<!DOCTYPE html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <meta name="x-apple-disable-message-reformatting">
  <title>${vars.subjectLine || vars.projectName || "Presale Properties"}</title>
  <!--[if mso]>
  <noscript><xml><o:OfficeDocumentSettings><o:AllowPNG/><o:PixelsPerInch>96</o:PixelsPerInch></o:OfficeDocumentSettings></xml></noscript>
  <![endif]-->
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,600;1,400&family=DM+Sans:wght@300;400;500&display=swap');
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { margin: 0 !important; padding: 0 !important; background-color: #F5F2EE; width: 100% !important; }
    table { border-collapse: collapse; }
    img { -ms-interpolation-mode: bicubic; border: 0; height: auto; line-height: 100%; outline: none; text-decoration: none; }
    a { text-decoration: none; }
    @media only screen and (max-width: 600px) {
      .email-container { width: 100% !important; }
      .mobile-padding { padding: 32px 24px !important; }
      .hero-text { font-size: 36px !important; line-height: 42px !important; }
      .sub-text { font-size: 14px !important; }
      .stat-block { display: block !important; width: 100% !important; text-align: center !important; }
    }
  </style>
</head>
<body style="margin:0; padding:0; background-color:#F5F2EE; font-family:'DM Sans', Helvetica, Arial, sans-serif;">

  <!-- PREHEADER -->
  <div style="display:none; max-height:0; overflow:hidden; color:#F5F2EE; font-size:1px;">
    ${vars.previewText || `Exclusive presale opportunity — ${vars.projectName || "Now Available"}`}&#847;&zwnj;&nbsp;&#847;&zwnj;&nbsp;
  </div>

  <!-- EMAIL WRAPPER -->
  <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background-color:#F5F2EE;">
    <tr>
      <td align="center" valign="top" style="padding: 32px 16px;">

        <!-- MAIN CONTAINER -->
        <table class="email-container" role="presentation" cellpadding="0" cellspacing="0" width="600" style="max-width:600px; background-color:#FAFAF8;">

          <!-- HEADER -->
          <tr>
            <td style="background-color:#0C1A14; padding: 36px 48px 32px 48px;">
              <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
                <tr>
                  <td>
                    <div style="font-family:'Cormorant Garamond', Georgia, serif; font-size:11px; font-weight:600; letter-spacing:4px; text-transform:uppercase; color:#C9A55A; margin-bottom:6px;">PRESALE</div>
                    <div style="font-family:'Cormorant Garamond', Georgia, serif; font-size:46px; font-weight:600; letter-spacing:1px; color:#FAFAF8; line-height:1;">PROPERTIES</div>
                    <div style="width:40px; height:2px; background-color:#C9A55A; margin-top:14px;"></div>
                  </td>
                  <td align="right" valign="bottom">
                    <div style="font-family:'DM Sans', Helvetica, Arial, sans-serif; font-size:10px; font-weight:300; letter-spacing:3px; text-transform:uppercase; color:#888; line-height:1.6;">SURREY · LANGLEY<br>METRO VANCOUVER</div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- HERO IMAGE -->
          ${heroImg}

          <!-- GOLD ACCENT BAR -->
          ${goldBar}

          <!-- MAIN CONTENT -->
          <tr>
            <td class="mobile-padding" style="padding: 52px 48px 40px 48px;">

              <!-- Greeting -->
              <div style="font-family:'DM Sans', Helvetica, Arial, sans-serif; font-size:13px; font-weight:400; color:#888; letter-spacing:1px; margin-bottom:20px;">Hi [First Name],</div>

              <!-- Headline -->
              ${vars.headline
                ? `<div class="hero-text" style="font-family:'Cormorant Garamond', Georgia, serif; font-size:44px; font-weight:600; color:#0C1A14; line-height:1.1; margin-bottom:32px;">${vars.headline}</div>`
                : `<div class="hero-text" style="font-family:'Cormorant Garamond', Georgia, serif; font-size:44px; font-weight:600; color:#0C1A14; line-height:1.1; margin-bottom:8px;">${vars.projectName || "New Presale"}</div>
                   <div class="hero-text" style="font-family:'Cormorant Garamond', Georgia, serif; font-size:44px; font-weight:400; font-style:italic; color:#C9A55A; line-height:1.1; margin-bottom:32px;">is Now Available.</div>`
              }

              <!-- Divider -->
              <div style="width:100%; height:1px; background-color:#E8E4DF; margin-bottom:40px;"></div>

              <!-- Stats Row -->
              ${statsRow}

              <!-- CTA Buttons -->
              ${ctaSection}

            </td>
          </tr>

          ${highlightsList ? `
          <!-- PROJECT HIGHLIGHTS -->
          <tr>
            <td style="background-color:#F0EDE8; padding: 36px 48px;">
              <div style="font-family:'DM Sans', Helvetica, Arial, sans-serif; font-size:10px; font-weight:500; letter-spacing:3px; text-transform:uppercase; color:#888; margin-bottom:16px;">Why This Project</div>
              <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
                ${highlightsList}
              </table>
            </td>
          </tr>` : ""}

          <!-- SIGNATURE -->
          <tr>
            <td style="padding: 40px 48px 36px 48px;">
              <div style="width:100%; height:1px; background-color:#E8E4DF; margin-bottom:28px;"></div>
              <div style="font-family:'Cormorant Garamond', Georgia, serif; font-size:22px; font-weight:600; color:#0C1A14; margin-bottom:4px;">Uzair Muhammad</div>
              <div style="font-family:'DM Sans', Helvetica, Arial, sans-serif; font-size:12px; font-weight:400; letter-spacing:1px; color:#888; margin-bottom:16px; text-transform:uppercase;">Presale Specialist · Presale Properties</div>
              <table role="presentation" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="padding-right:24px;">
                    <a href="tel:+16041234567" style="font-family:'DM Sans', Helvetica, Arial, sans-serif; font-size:13px; font-weight:400; color:#C9A55A; text-decoration:none;">📞 604.XXX.XXXX</a>
                  </td>
                  <td>
                    <a href="https://presaleproperties.ca" style="font-family:'DM Sans', Helvetica, Arial, sans-serif; font-size:13px; font-weight:400; color:#C9A55A; text-decoration:none;">🌐 presaleproperties.ca</a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- FOOTER -->
          <tr>
            <td style="background-color:#0C1A14; padding: 28px 48px;">
              <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
                <tr>
                  <td>
                    <div style="font-family:'DM Sans', Helvetica, Arial, sans-serif; font-size:10px; font-weight:400; letter-spacing:2px; text-transform:uppercase; color:#C9A55A; margin-bottom:6px;">Display &amp; Presentation Centre</div>
                    <div style="font-family:'DM Sans', Helvetica, Arial, sans-serif; font-size:12px; font-weight:300; color:#AAA; line-height:1.7;">#108 2350 165 Street, Surrey BC</div>
                    <div style="font-family:'DM Sans', Helvetica, Arial, sans-serif; font-size:12px; font-weight:300; color:#AAA; line-height:1.7;">Open Daily 12–5pm &nbsp;|&nbsp; Closed Thu &amp; Fri</div>
                  </td>
                  ${vars.projectUrl ? `<td align="right" valign="bottom">
                    <a href="${vars.projectUrl}" style="font-family:'DM Sans', Helvetica, Arial, sans-serif; font-size:10px; font-weight:400; letter-spacing:2px; text-transform:uppercase; color:#C9A55A; text-decoration:none;">View Project &rarr;</a>
                  </td>` : ""}
                </tr>
              </table>
            </td>
          </tr>

          <!-- LEGAL -->
          <tr>
            <td style="padding: 20px 48px; background-color:#F0EDE8;">
              <div style="font-family:'DM Sans', Helvetica, Arial, sans-serif; font-size:10px; font-weight:300; color:#AAA; line-height:1.6;">
                *Prices exclude taxes and are subject to availability at the time of inquiry and/or change without notice. This is not an offering for sale. Any such offering can only be made with a Disclosure Statement. E.&amp;O.E.
              </div>
              <div style="margin-top:12px;">
                <a href="*|UNSUB|*" style="font-family:'DM Sans', Helvetica, Arial, sans-serif; font-size:10px; font-weight:400; color:#888; text-decoration:underline;">Unsubscribe</a>
                &nbsp;&nbsp;·&nbsp;&nbsp;
                <a href="*|UPDATE_PROFILE|*" style="font-family:'DM Sans', Helvetica, Arial, sans-serif; font-size:10px; font-weight:400; color:#888; text-decoration:underline;">Update Preferences</a>
              </div>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>

</body>
</html>`;
}

// ─── Component ────────────────────────────────────────────────────────────────
export default function AdminEmailBuilder() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string>("");
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [loadingProjects, setLoadingProjects] = useState(true);
  const [copied, setCopied] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [importHtml, setImportHtml] = useState("");
  const [useCustomHtml, setUseCustomHtml] = useState(false);
  const [previewMode, setPreviewMode] = useState<"preview" | "code">("preview");
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const [vars, setVars] = useState<TemplateVars>({ ...EMPTY_VARS });
  const [cta, setCta] = useState<CtaToggles>({ ...DEFAULT_CTA });

  // Fetch projects (all, admin context)
  useEffect(() => {
    const load = async () => {
      setLoadingProjects(true);
      const { data } = await supabase
        .from("presale_projects")
        .select(
          "id,name,slug,city,neighborhood,address,developer_name,starting_price,completion_year,completion_month,featured_image,brochure_files,floorplan_files,pricing_sheets,short_description,highlights,project_type"
        )
        .order("name");
      if (data) setProjects(data as Project[]);
      setLoadingProjects(false);
    };
    load();
  }, []);

  // When project is selected, populate vars
  useEffect(() => {
    if (!selectedProjectId) return;
    const p = projects.find((x) => x.id === selectedProjectId);
    if (!p) return;
    setSelectedProject(p);

    const completion = p.completion_year
      ? p.completion_month
        ? `${new Date(0, p.completion_month - 1).toLocaleString("en", { month: "long" })} ${p.completion_year}`
        : String(p.completion_year)
      : "";

    const startingPrice = p.starting_price
      ? `$${Number(p.starting_price).toLocaleString()}`
      : "";

    const brochureUrl = p.brochure_files?.[0] ?? "";
    const floorplanUrl = p.floorplan_files?.[0] ?? "";
    const pricingUrl = p.pricing_sheets?.[0] ?? "";
    const projectUrl = `https://presaleproperties.ca/presale/${p.slug}`;

    setCta((prev) => ({
      ...prev,
      brochure: !!brochureUrl,
      floorplan: !!floorplanUrl,
      pricing: !!pricingUrl,
    }));

    setVars((prev) => ({
      ...prev,
      projectName: p.name,
      developerName: p.developer_name ?? "",
      address: p.address ?? "",
      city: p.city,
      neighborhood: p.neighborhood ?? "",
      completion,
      startingPrice,
      featuredImage: p.featured_image ?? "",
      brochureUrl,
      floorplanUrl,
      pricingUrl,
      projectUrl,
      headline: `Introducing ${p.name} \u2014 ${p.city}'s Most Anticipated Presale`,
      bodyCopy:
        p.short_description ||
        `${p.name} is an exclusive presale opportunity in ${p.city}, BC. ${
          startingPrice ? `Starting from ${startingPrice}, this is your chance to invest before prices rise.` : "Contact us today to get priority access before public launch."
        } Limited units available \u2014 register now for VIP pricing and floor plan access.`,
      subjectLine: `\uD83C\uDFD9\uFE0F Exclusive Access: ${p.name} \u2014 ${p.city} Presale`,
      previewText: `${startingPrice ? `From ${startingPrice} \u00B7 ` : ""}${p.city} presale \u2014 limited units available`,
    }));

    setUseCustomHtml(false);
  }, [selectedProjectId, projects]);

  const finalHtml = useCustomHtml ? importHtml : buildEmailHtml(vars, cta);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(finalHtml);
      setCopied(true);
      toast.success("HTML copied! Paste directly into Mailchimp.");
      setTimeout(() => setCopied(false), 3000);
    } catch {
      toast.error("Copy failed — use the HTML view and copy manually.");
    }
  }, [finalHtml]);

  const handleReset = () => {
    setSelectedProjectId("");
    setSelectedProject(null);
    setUseCustomHtml(false);
    setImportHtml("");
    setVars({ ...EMPTY_VARS });
    setCta({ ...DEFAULT_CTA });
  };

  const handleImport = () => {
    if (!importHtml.trim()) {
      toast.error("Please paste your HTML first.");
      return;
    }
    setUseCustomHtml(true);
    setImportOpen(false);
    toast.success("Custom HTML imported — live preview updated.");
  };

  const v =
    (key: keyof TemplateVars) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setVars((prev) => ({ ...prev, [key]: e.target.value }));

  const [previewDevice, setPreviewDevice] = useState<"desktop" | "mobile">("desktop");
  const [ctaSectionOpen, setCtaSectionOpen] = useState(true);

  return (
    <TooltipProvider>
    <AdminLayout>
      {/* ════════════════════════════════════════════════
          TOP BAR — project picker + actions
          ════════════════════════════════════════════════ */}
      <div className="flex items-center justify-between gap-4 mb-4">
        {/* Left: title + project picker */}
        <div className="flex items-center gap-4 min-w-0">
          <div className="shrink-0">
            <h1 className="text-lg font-bold text-foreground tracking-tight leading-tight">Email Builder</h1>
            <p className="text-xs text-muted-foreground">Mailchimp-ready HTML · No code needed</p>
          </div>

          <Separator orientation="vertical" className="h-8" />

          {/* Project selector — prominent */}
          <div className="flex items-center gap-2 min-w-0">
            <Building2 className="h-4 w-4 text-primary shrink-0" />
            <Select value={selectedProjectId} onValueChange={setSelectedProjectId} disabled={loadingProjects}>
              <SelectTrigger className="h-9 w-[260px] text-sm font-medium">
                <SelectValue placeholder={loadingProjects ? "Loading projects…" : "Choose a project to start →"} />
              </SelectTrigger>
              <SelectContent>
                {projects.map((p) => (
                  <SelectItem key={p.id} value={p.id} className="text-sm">
                    <span className="font-medium">{p.name}</span>
                    <span className="text-muted-foreground ml-1.5 text-xs">· {p.city}</span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selectedProject && (
              <div className="flex items-center gap-1">
                {selectedProject.brochure_files?.[0] && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Badge className="text-[10px] h-5 bg-primary/10 text-primary border-primary/20 hover:bg-primary/15 cursor-default">PDF</Badge>
                    </TooltipTrigger>
                    <TooltipContent>Brochure attached</TooltipContent>
                  </Tooltip>
                )}
                {selectedProject.floorplan_files?.[0] && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Badge className="text-[10px] h-5 bg-primary/10 text-primary border-primary/20 hover:bg-primary/15 cursor-default">FP</Badge>
                    </TooltipTrigger>
                    <TooltipContent>Floor plans attached</TooltipContent>
                  </Tooltip>
                )}
                {selectedProject.pricing_sheets?.[0] && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Badge className="text-[10px] h-5 bg-primary/10 text-primary border-primary/20 hover:bg-primary/15 cursor-default">$$</Badge>
                    </TooltipTrigger>
                    <TooltipContent>Pricing sheet attached</TooltipContent>
                  </Tooltip>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Right: actions */}
        <div className="flex items-center gap-2 shrink-0">
          {useCustomHtml && (
            <Badge variant="outline" className="text-[10px] h-7 px-2.5 border-amber-500/40 text-amber-600 dark:text-amber-400 bg-amber-500/5">
              Custom HTML
            </Badge>
          )}

          <Dialog open={importOpen} onOpenChange={setImportOpen}>
            <DialogTrigger asChild>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="outline" size="sm" className="gap-1.5 h-9 px-3">
                    <Upload className="h-3.5 w-3.5" />
                    <span className="hidden sm:inline">Import HTML</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Paste HTML from Claude or any source</TooltipContent>
              </Tooltip>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Upload className="h-4 w-4 text-primary" />
                  Import Custom HTML
                </DialogTitle>
              </DialogHeader>
              <p className="text-sm text-muted-foreground">
                Paste HTML from Claude or any source. The quick-edit panel will be disabled while using custom HTML.
              </p>
              <Textarea
                value={importHtml}
                onChange={(e) => setImportHtml(e.target.value)}
                placeholder="<!DOCTYPE html>…"
                className="font-mono text-xs min-h-[320px] bg-muted/30"
              />
              <div className="flex justify-between items-center gap-2 mt-1">
                <p className="text-xs text-muted-foreground">{importHtml.length.toLocaleString()} characters</p>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => setImportOpen(false)}>Cancel</Button>
                  <Button onClick={handleImport} className="gap-1.5">
                    <Sparkles className="h-3.5 w-3.5" /> Use This HTML
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="outline" size="sm" className="h-9 w-9 p-0" onClick={handleReset}>
                <RefreshCw className="h-3.5 w-3.5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Reset everything</TooltipContent>
          </Tooltip>

          <Button
            size="sm"
            className={cn(
              "gap-2 h-9 px-4 font-semibold transition-all duration-200",
              copied
                ? "bg-emerald-600 hover:bg-emerald-600 text-white border-emerald-600"
                : "bg-primary text-primary-foreground hover:bg-primary/90"
            )}
            onClick={handleCopy}
          >
            {copied ? (
              <><CheckCircle2 className="h-3.5 w-3.5" /> Copied to Clipboard</>
            ) : (
              <><Copy className="h-3.5 w-3.5" /> Copy HTML</>
            )}
          </Button>
        </div>
      </div>

      {/* ════════════════════════════════════════════════
          INBOX PREVIEW BAR
          ════════════════════════════════════════════════ */}
      <div className="mb-4 rounded-lg border border-border bg-card px-4 py-2.5">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 shrink-0">
            <div className="h-2 w-2 rounded-full bg-red-400" />
            <div className="h-2 w-2 rounded-full bg-amber-400" />
            <div className="h-2 w-2 rounded-full bg-green-400" />
          </div>
          <Separator orientation="vertical" className="h-5" />
          <Mail className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
          <div className="flex items-center gap-1.5 min-w-0 flex-1 text-sm">
            <span className="font-semibold text-foreground shrink-0 text-xs">PresaleProperties</span>
            <span className="text-muted-foreground/30 shrink-0">·</span>
            <span className={cn("font-medium truncate text-xs", !vars.subjectLine && "text-muted-foreground italic")}>
              {vars.subjectLine || "Your subject line will appear here"}
            </span>
            {vars.previewText && (
              <>
                <span className="text-muted-foreground/30 shrink-0 hidden md:inline">—</span>
                <span className="text-muted-foreground text-xs truncate hidden md:inline">{vars.previewText}</span>
              </>
            )}
          </div>
          <Badge variant="outline" className="shrink-0 text-[10px] py-0 h-5 text-muted-foreground">
            Gmail preview
          </Badge>
        </div>
      </div>

      {/* ════════════════════════════════════════════════
          MAIN 2-PANEL LAYOUT
          ════════════════════════════════════════════════ */}
      <div className="grid grid-cols-[1fr_340px] gap-4 h-[calc(100vh-230px)] min-h-[600px]">

        {/* ── LEFT: Email preview (dominant) ── */}
        <div className="flex flex-col rounded-xl border border-border bg-card overflow-hidden shadow-sm">

          {/* Preview toolbar */}
          <div className="flex items-center justify-between px-4 py-2.5 border-b border-border bg-muted/20 shrink-0">
            <div className="flex items-center gap-1 bg-muted/50 rounded-lg p-0.5">
              <Button
                variant="ghost"
                size="sm"
                className={cn("h-7 px-3 text-xs gap-1.5 rounded-md transition-all", previewMode === "preview" && "bg-card shadow-sm text-foreground font-medium")}
                onClick={() => setPreviewMode("preview")}
              >
                <Eye className="h-3 w-3" /> Preview
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className={cn("h-7 px-3 text-xs gap-1.5 rounded-md transition-all", previewMode === "code" && "bg-card shadow-sm text-foreground font-medium")}
                onClick={() => setPreviewMode("code")}
              >
                <Code2 className="h-3 w-3" /> HTML Code
              </Button>
            </div>

            {previewMode === "preview" && (
              <div className="flex items-center gap-1 bg-muted/50 rounded-lg p-0.5">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className={cn("h-7 w-8 p-0 rounded-md transition-all", previewDevice === "desktop" && "bg-card shadow-sm")}
                      onClick={() => setPreviewDevice("desktop")}
                    >
                      <Monitor className="h-3.5 w-3.5" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Desktop view</TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className={cn("h-7 w-8 p-0 rounded-md transition-all", previewDevice === "mobile" && "bg-card shadow-sm")}
                      onClick={() => setPreviewDevice("mobile")}
                    >
                      <Smartphone className="h-3.5 w-3.5" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Mobile view</TooltipContent>
                </Tooltip>
              </div>
            )}

            <div className="flex items-center gap-2">
              {previewMode === "preview" && (
                <span className="text-[11px] text-muted-foreground hidden lg:block">
                  {previewDevice === "desktop" ? "600px email width" : "375px mobile width"}
                </span>
              )}
              {previewMode === "code" && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 px-2 text-xs gap-1"
                  onClick={handleCopy}
                >
                  <Copy className="h-3 w-3" />
                  {copied ? "Copied!" : "Copy"}
                </Button>
              )}
            </div>
          </div>

          {/* Preview area */}
          {previewMode === "preview" ? (
            <div className={cn(
              "flex-1 overflow-auto",
              previewDevice === "desktop" ? "bg-[#e8e5e0]" : "bg-[#e8e5e0] flex items-start justify-center pt-4 pb-4"
            )}>
              <iframe
                ref={iframeRef}
                srcDoc={finalHtml}
                className={cn(
                  "border-0",
                  previewDevice === "desktop" ? "w-full h-full" : "w-[375px] h-full min-h-[800px] shadow-2xl rounded-sm"
                )}
                sandbox="allow-same-origin"
                title="Email Preview"
              />
            </div>
          ) : (
            <div className="flex-1 overflow-auto" style={{ background: "#0d1117" }}>
              <div className="p-4 pb-2 flex items-center justify-between border-b border-white/5">
                <span className="text-[11px] font-mono text-emerald-400">email.html</span>
                <span className="text-[10px] text-white/30">{finalHtml.length.toLocaleString()} chars · Mailchimp-compatible</span>
              </div>
              <pre className="p-4 text-[11px] font-mono whitespace-pre-wrap break-all leading-relaxed" style={{ color: "#e6edf3" }}>
                {finalHtml}
              </pre>
            </div>
          )}
        </div>

        {/* ── RIGHT: Editor panel ── */}
        <div className="flex flex-col gap-0 rounded-xl border border-border bg-card overflow-hidden shadow-sm">

          {/* Editor header */}
          <div className="px-4 pt-4 pb-3 border-b border-border bg-muted/10 shrink-0">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-foreground">Email Editor</h2>
              {useCustomHtml && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 text-[11px] px-2 text-amber-600 hover:text-amber-700"
                  onClick={() => setUseCustomHtml(false)}
                >
                  ← Use template
                </Button>
              )}
            </div>
          </div>

          {/* Tabs */}
          <Tabs defaultValue="content" className="flex flex-col flex-1 overflow-hidden">
            <div className="px-3 pt-2 shrink-0">
              <TabsList className="w-full h-8 text-xs grid grid-cols-3">
                <TabsTrigger value="content" className="text-xs gap-1.5">
                  <FileText className="h-3 w-3" /> Content
                </TabsTrigger>
                <TabsTrigger value="project" className="text-xs gap-1.5">
                  <Building2 className="h-3 w-3" /> Project
                </TabsTrigger>
                <TabsTrigger value="urls" className="text-xs gap-1.5">
                  <Link2 className="h-3 w-3" /> URLs
                </TabsTrigger>
              </TabsList>
            </div>

            <div className={cn("flex-1 overflow-y-auto", useCustomHtml && "opacity-40 pointer-events-none select-none")}>

              {/* ── CONTENT TAB ── */}
              <TabsContent value="content" className="mt-0 px-4 pb-4 space-y-4">

                {/* Inbox section */}
                <div className="pt-3">
                  <div className="flex items-center gap-1.5 mb-2.5">
                    <Mail className="h-3 w-3 text-muted-foreground" />
                    <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Inbox</span>
                  </div>
                  <div className="space-y-2">
                    <div>
                      <Label className="text-[11px] text-muted-foreground">Subject Line</Label>
                      <Input
                        value={vars.subjectLine}
                        onChange={v("subjectLine")}
                        className="h-8 text-xs mt-1"
                        placeholder="🏙️ Exclusive Access: Project Name — City"
                      />
                    </div>
                    <div>
                      <Label className="text-[11px] text-muted-foreground">Preview Text</Label>
                      <Input
                        value={vars.previewText}
                        onChange={v("previewText")}
                        className="h-8 text-xs mt-1"
                        placeholder="From $599K · Surrey · Limited units"
                      />
                      <p className="text-[10px] text-muted-foreground/60 mt-1">Shown after subject line in inbox</p>
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Headline */}
                <div>
                  <div className="flex items-center gap-1.5 mb-2.5">
                    <Sparkles className="h-3 w-3 text-muted-foreground" />
                    <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Email Body</span>
                  </div>
                  <div className="space-y-2">
                    <div>
                      <Label className="text-[11px] text-muted-foreground">Headline</Label>
                      <Input
                        value={vars.headline}
                        onChange={v("headline")}
                        className="h-8 text-xs mt-1"
                        placeholder="Introducing Project Name…"
                      />
                    </div>
                    <div>
                      <Label className="text-[11px] text-muted-foreground">
                        Highlights
                        <span className="ml-1 text-muted-foreground/50 font-normal">(one per line → gold bullets)</span>
                      </Label>
                      <Textarea
                        value={vars.bodyCopy}
                        onChange={v("bodyCopy")}
                        className="text-xs mt-1 min-h-[120px] resize-none leading-relaxed"
                        placeholder={"Park-facing homes overlooking green space\nPTT Exemption eligible for first-time buyers\nCo-op commission available — call for details"}
                      />
                    </div>
                  </div>
                </div>

                <Separator />

                {/* CTA toggles */}
                <div>
                  <button
                    className="flex items-center justify-between w-full mb-2.5 group"
                    onClick={() => setCtaSectionOpen(!ctaSectionOpen)}
                  >
                    <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">CTA Buttons</span>
                    {ctaSectionOpen
                      ? <ChevronUp className="h-3.5 w-3.5 text-muted-foreground/50" />
                      : <ChevronDown className="h-3.5 w-3.5 text-muted-foreground/50" />
                    }
                  </button>
                  {ctaSectionOpen && (
                    <div className="space-y-1.5 rounded-lg bg-muted/20 p-3">
                      {(
                        [
                          { key: "floorplan" as keyof CtaToggles, label: "View Floorplans & Pricing", url: vars.floorplanUrl, primary: true },
                          { key: "brochure" as keyof CtaToggles, label: "Download Brochure", url: vars.brochureUrl, primary: true },
                          { key: "pricing" as keyof CtaToggles, label: "Request Pricing", url: vars.pricingUrl, primary: false },
                          { key: "viewProject" as keyof CtaToggles, label: "View Full Project", url: vars.projectUrl, primary: false },
                          { key: "bookConsult" as keyof CtaToggles, label: "Book a Private Tour", url: vars.bookUrl, primary: false },
                        ]
                      ).map(({ key, label, url, primary }) => (
                        <div key={key} className={cn(
                          "flex items-center justify-between gap-2 rounded-md px-2.5 py-1.5 transition-colors",
                          cta[key] ? "bg-card border border-border" : "opacity-50"
                        )}>
                          <div className="flex items-center gap-2 min-w-0">
                            <Switch
                              checked={cta[key]}
                              onCheckedChange={(val) => setCta((prev) => ({ ...prev, [key]: val }))}
                              disabled={!url}
                              className="scale-75 origin-left"
                            />
                            <div className="min-w-0">
                              <span className="text-[11px] font-medium text-foreground truncate block">{label}</span>
                              {primary && <span className="text-[9px] text-primary font-semibold uppercase tracking-wide">Primary</span>}
                            </div>
                          </div>
                          {!url && (
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <span className="text-[9px] text-muted-foreground/40 shrink-0 cursor-help border border-dashed border-muted-foreground/20 rounded px-1 py-0.5">no URL</span>
                              </TooltipTrigger>
                              <TooltipContent>Add a URL in the URLs tab to enable this button</TooltipContent>
                            </Tooltip>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </TabsContent>

              {/* ── PROJECT TAB ── */}
              <TabsContent value="project" className="mt-0 px-4 pb-4 space-y-3">
                <div className="pt-3">
                  {selectedProject?.featured_image && (
                    <div className="mb-3 rounded-lg overflow-hidden border border-border">
                      <img
                        src={selectedProject.featured_image}
                        alt={selectedProject.name}
                        className="w-full h-28 object-cover"
                      />
                      <div className="px-2.5 py-1.5 bg-muted/30">
                        <p className="text-[10px] text-muted-foreground">Hero image · auto-filled from project</p>
                      </div>
                    </div>
                  )}
                  <div className="space-y-2">
                    {(
                      [
                        { key: "projectName" as keyof TemplateVars, label: "Project Name" },
                        { key: "developerName" as keyof TemplateVars, label: "Developer" },
                        { key: "address" as keyof TemplateVars, label: "Address" },
                        { key: "city" as keyof TemplateVars, label: "City" },
                        { key: "neighborhood" as keyof TemplateVars, label: "Neighborhood" },
                        { key: "completion" as keyof TemplateVars, label: "Est. Completion" },
                        { key: "startingPrice" as keyof TemplateVars, label: "Starting Price" },
                      ]
                    ).map(({ key, label }) => (
                      <div key={key}>
                        <Label className="text-[11px] text-muted-foreground">{label}</Label>
                        <Input value={vars[key]} onChange={v(key)} className="h-8 text-xs mt-0.5" />
                      </div>
                    ))}
                  </div>
                </div>
              </TabsContent>

              {/* ── URLS TAB ── */}
              <TabsContent value="urls" className="mt-0 px-4 pb-4 space-y-2">
                <div className="pt-3">
                  <p className="text-[11px] text-muted-foreground mb-3 leading-relaxed">
                    URLs are auto-filled from the selected project. Override any field below.
                  </p>
                  {(
                    [
                      { key: "featuredImage" as keyof TemplateVars, label: "Hero Image URL", icon: "🖼️" },
                      { key: "brochureUrl" as keyof TemplateVars, label: "Brochure PDF URL", icon: "📄" },
                      { key: "floorplanUrl" as keyof TemplateVars, label: "Floor Plan PDF URL", icon: "📐" },
                      { key: "pricingUrl" as keyof TemplateVars, label: "Pricing Sheet URL", icon: "💰" },
                      { key: "projectUrl" as keyof TemplateVars, label: "Project Page URL", icon: "🔗" },
                      { key: "bookUrl" as keyof TemplateVars, label: "Booking / Tour URL", icon: "📅" },
                    ]
                  ).map(({ key, label, icon }) => (
                    <div key={key}>
                      <Label className="text-[11px] text-muted-foreground flex items-center gap-1">
                        <span>{icon}</span> {label}
                      </Label>
                      <div className="relative mt-0.5">
                        <Input
                          value={vars[key]}
                          onChange={v(key)}
                          className={cn(
                            "h-8 text-[11px] font-mono pr-8",
                            vars[key] && "border-emerald-500/40 bg-emerald-500/5"
                          )}
                          placeholder="https://"
                        />
                        {vars[key] && (
                          <CheckCircle2 className="absolute right-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-emerald-500" />
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </TabsContent>
            </div>
          </Tabs>

          {/* Bottom copy button — always visible */}
          <div className="px-4 pb-4 pt-3 border-t border-border shrink-0 bg-muted/10">
            <Button
              className={cn(
                "w-full h-10 gap-2 font-semibold text-sm transition-all duration-200",
                copied
                  ? "bg-emerald-600 hover:bg-emerald-600 text-white"
                  : "bg-primary text-primary-foreground hover:bg-primary/90"
              )}
              onClick={handleCopy}
            >
              {copied ? (
                <><CheckCircle2 className="h-4 w-4" /> Copied! Paste into Mailchimp</>
              ) : (
                <><Copy className="h-4 w-4" /> Copy HTML for Mailchimp</>
              )}
            </Button>
            <p className="text-[10px] text-muted-foreground text-center mt-1.5">
              All variables resolved · Inline CSS · Mailchimp-ready
            </p>
          </div>
        </div>

      </div>
    </AdminLayout>
    </TooltipProvider>
  );
}
