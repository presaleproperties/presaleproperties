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
// Mailchimp compliance notes applied:
// • Width ≤ 600px (hard max)
// • All CSS inline — no reliance on <head> styles (Gmail/Yahoo strip them)
// • @media queries kept in <style> for supported clients; inline fallbacks for all others
// • Google Fonts loaded via <link> (more reliable than @import in email)
// • Tables-based layout: role="presentation" cellpadding="0" cellspacing="0" border="0" on every table
// • Images: absolute URLs, width attribute set, border="0", display:block
// • Background on wrapper <table>, not <body> (webmail strips <body> styles)
// • Preheader text with zero-width space padding to prevent body text bleed-through
// • Mailchimp merge tags: *|UNSUB|*, *|UPDATE_PROFILE|*, *|FNAME|*
// • No JavaScript, no Flash, no forms, no iframes
// • <div> inside <td> for text (not bare text nodes) for Outlook compatibility
function buildEmailHtml(vars: TemplateVars, cta: CtaToggles): string {
  const locationTag = [vars.neighborhood, vars.city ? vars.city.toUpperCase() : ""]
    .filter(Boolean).join("&nbsp;&nbsp;·&nbsp;&nbsp;").toUpperCase();

  // ── Hero image ─────────────────────────────────────────────────────────────
  // FULL-BLEED: td has padding:0, mso-line-height-rule:exactly, font-size:0 to kill any gap
  // img: width="600" + width:100% ensures true full-width on all clients
  const heroImg = vars.featuredImage
    ? `<tr>
        <td align="center" valign="top" style="padding:0; margin:0; font-size:0; line-height:0; mso-line-height-rule:exactly; border-collapse:collapse;">
          <img class="hero-img" src="${vars.featuredImage}" alt="${vars.projectName || "Presale Property"}" width="600" border="0"
               style="display:block; width:600px; max-width:600px; height:auto; border:0 none; outline:none; text-decoration:none; -ms-interpolation-mode:bicubic; margin:0; padding:0;" />
        </td>
      </tr>`
    : `<tr>
        <td align="center" valign="middle" bgcolor="#1a1a1a"
            style="padding:60px 0; background-color:#1a1a1a; text-align:center; vertical-align:middle;">
          <div style="font-family:Georgia, 'Times New Roman', serif; font-size:12px; letter-spacing:4px; text-transform:uppercase; color:#C9A55A;">
            ADD HERO IMAGE URL IN THE URLS TAB
          </div>
        </td>
      </tr>`;

  // ── Location bar ────────────────────────────────────────────────────────────
  const locationBar = locationTag
    ? `<tr>
        <td class="location-td" bgcolor="#C9A55A" style="padding:14px 40px; background-color:#C9A55A;">
          <div style="font-family:'DM Sans', Helvetica, Arial, sans-serif; font-size:11px; font-weight:400; letter-spacing:3px; text-transform:uppercase; color:#ffffff; mso-line-height-rule:exactly; line-height:1.5;">
            ${locationTag}${vars.completion ? `&nbsp;&nbsp;·&nbsp;&nbsp;EST. COMPLETION ${vars.completion.toUpperCase()}` : ""}
          </div>
        </td>
      </tr>`
    : "";

  // ── Stats row ───────────────────────────────────────────────────────────────
  // Use nested table for reliable multi-column layout across all email clients
  const statsRow = (vars.startingPrice || vars.developerName || vars.city)
    ? `<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%"
          style="border-collapse:collapse; border-top:1px solid #efefef; border-bottom:1px solid #efefef; margin-bottom:36px;">
        <tr>
          ${vars.startingPrice ? `
          <td valign="top" width="33%" style="padding:18px 24px 18px 0;">
            <div style="font-family:Georgia, 'Times New Roman', serif; font-size:34px; font-weight:400; color:#111111; line-height:1; mso-line-height-rule:exactly;">${vars.startingPrice}</div>
            <div style="font-family:Helvetica, Arial, sans-serif; font-size:9px; font-weight:400; letter-spacing:2px; text-transform:uppercase; color:#aaaaaa; margin-top:6px;">Starting From + GST</div>
          </td>
          <td width="1" style="background-color:#efefef; padding:0; font-size:0; line-height:0;">&nbsp;</td>` : ""}
          ${vars.developerName ? `
          <td valign="top" width="33%" style="padding:18px 16px;">
            <div style="font-family:Georgia, 'Times New Roman', serif; font-size:22px; font-weight:400; color:#111111; line-height:1.2; mso-line-height-rule:exactly;">${vars.developerName}</div>
            <div style="font-family:Helvetica, Arial, sans-serif; font-size:9px; font-weight:400; letter-spacing:2px; text-transform:uppercase; color:#aaaaaa; margin-top:6px;">Developer</div>
          </td>
          <td width="1" style="background-color:#efefef; padding:0; font-size:0; line-height:0;">&nbsp;</td>` : ""}
          ${vars.city ? `
          <td valign="top" width="33%" style="padding:18px 0 18px 16px;">
            <div style="font-family:Georgia, 'Times New Roman', serif; font-size:22px; font-weight:400; color:#111111; line-height:1.2; mso-line-height-rule:exactly;">${vars.city}, BC</div>
            <div style="font-family:Helvetica, Arial, sans-serif; font-size:9px; font-weight:400; letter-spacing:2px; text-transform:uppercase; color:#aaaaaa; margin-top:6px;">Location</div>
          </td>` : ""}
        </tr>
      </table>`
    : "";

  // ── CTA buttons ─────────────────────────────────────────────────────────────
  // Bulletproof buttons: nested table so background renders in ALL clients incl. Outlook
  const primaryCta = (href: string, label: string) =>
    href
      ? `<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:10px;">
          <tr>
            <td bgcolor="#111111" style="background-color:#111111; padding:16px 40px; mso-padding-alt:16px 40px;">
              <!--[if mso]><a href="${href}" style="font-family:Arial,sans-serif; font-size:10px; font-weight:bold; letter-spacing:3px; text-transform:uppercase; color:#ffffff; text-decoration:none; display:inline-block;">${label} &rarr;</a><![endif]-->
              <!--[if !mso]><!--><a href="${href}" target="_blank" style="font-family:Helvetica, Arial, sans-serif; font-size:10px; font-weight:500; letter-spacing:3px; text-transform:uppercase; color:#ffffff; text-decoration:none; display:inline-block; white-space:nowrap;">${label}&nbsp;&rarr;</a><!--<![endif]-->
            </td>
          </tr>
        </table>`
      : "";

  const secondaryCta = (href: string, label: string) =>
    href
      ? `<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:10px;">
          <tr>
            <td style="border:1px solid #C9A55A; padding:15px 40px; mso-padding-alt:15px 40px;">
              <!--[if mso]><a href="${href}" style="font-family:Arial,sans-serif; font-size:10px; letter-spacing:3px; text-transform:uppercase; color:#C9A55A; text-decoration:none; display:inline-block;">${label}</a><![endif]-->
              <!--[if !mso]><!--><a href="${href}" target="_blank" style="font-family:Helvetica, Arial, sans-serif; font-size:10px; font-weight:400; letter-spacing:3px; text-transform:uppercase; color:#C9A55A; text-decoration:none; display:inline-block; white-space:nowrap;">${label}</a><!--<![endif]-->
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

  // ── Highlights ──────────────────────────────────────────────────────────────
  const highlightsList = vars.bodyCopy
    ? vars.bodyCopy.split("\n").filter(Boolean).map((line) =>
        `<tr>
          <td valign="top" width="14" style="padding-bottom:14px; padding-right:12px; vertical-align:top;">
            <div style="width:5px; height:5px; background-color:#C9A55A; margin-top:8px; font-size:0; line-height:0;">&nbsp;</div>
          </td>
          <td valign="top" style="padding-bottom:14px; vertical-align:top;">
            <div style="font-family:Helvetica, Arial, sans-serif; font-size:13px; font-weight:400; color:#444444; line-height:1.75; mso-line-height-rule:exactly;">${line}</div>
          </td>
        </tr>`
      ).join("\n")
    : "";

  // ── Full HTML ───────────────────────────────────────────────────────────────
  return `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office" lang="en">
<head>
  <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta http-equiv="X-UA-Compatible" content="IE=edge" />
  <meta name="x-apple-disable-message-reformatting" />
  <meta name="format-detection" content="telephone=no, date=no, address=no, email=no" />
  <title>${vars.subjectLine || vars.projectName || "Presale Properties"}</title>
  <!--[if mso]>
  <noscript>
    <xml>
      <o:OfficeDocumentSettings>
        <o:AllowPNG/>
        <o:PixelsPerInch>96</o:PixelsPerInch>
      </o:OfficeDocumentSettings>
    </xml>
  </noscript>
  <![endif]-->
  <!-- Google Fonts: <link> is more reliable than @import in email clients that support it -->
  <link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;1,300;1,400&family=DM+Sans:wght@300;400;500&display=swap" rel="stylesheet" type="text/css" />
  <style type="text/css">
    /* Reset */
    body, table, td, a { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
    table, td { mso-table-lspace: 0pt; mso-table-rspace: 0pt; border-collapse: collapse !important; }
    img { -ms-interpolation-mode: bicubic; border: 0; height: auto; line-height: 100%; outline: none; text-decoration: none; }
    p { margin: 0; padding: 0; }
    /* Mobile responsive — only clients supporting media queries use this */
    @media only screen and (max-width: 620px) {
      /* Remove outer padding so email is full-width on mobile */
      .outer-td { padding: 0 !important; }
      /* Email container spans full screen width */
      .email-container { width: 100% !important; max-width: 100% !important; }
      /* Hero image: force full width, no gaps */
      .hero-img { width: 100% !important; max-width: 100% !important; height: auto !important; display: block !important; }
      /* Reduce side padding on mobile */
      .mobile-pad { padding: 28px 20px !important; }
      .header-td { padding: 24px 20px 20px 20px !important; }
      .location-td { padding: 12px 20px !important; }
      .footer-td { padding: 24px 20px !important; }
      .legal-td { padding: 16px 20px 20px 20px !important; }
      /* Larger headline on mobile */
      .hero-headline { font-size: 36px !important; line-height: 42px !important; }
      /* Bigger body text */
      .body-text { font-size: 15px !important; line-height: 1.9 !important; }
      /* Stats: stack vertically on mobile */
      .stat-col { display: block !important; width: 100% !important; padding: 14px 0 !important; border-bottom: 1px solid #efefef !important; }
      .stat-divider { display: none !important; }
      /* Buttons full-width on mobile */
      .btn-td { width: 100% !important; text-align: center !important; padding: 16px 20px !important; display: block !important; }
      .btn-table { width: 100% !important; }
    }
  </style>
</head>
<!-- background-color on body is a fallback only; webmail clients (Gmail, Yahoo) strip this -->
<body style="margin:0; padding:0; background-color:#f4f4f0; word-spacing:normal;">

  <!-- PREHEADER: hidden text shown in inbox snippet after subject line -->
  <!-- Padding with zero-width non-joiners prevents body text from bleeding into snippet -->
  <div style="display:none; font-size:1px; line-height:1px; max-height:0px; max-width:0px; opacity:0; overflow:hidden; mso-hide:all; font-family:sans-serif;">
    ${vars.previewText || `Exclusive presale opportunity \u2014 ${vars.projectName || "Now Available"}`}&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;
  </div>

  <!-- ═══════════════════════════════════════════════════════════
       OUTER WRAPPER — background-color here works in webmail (not on body)
       ═══════════════════════════════════════════════════════════ -->
  <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%"
         style="background-color:#f4f4f0; border-collapse:collapse; mso-table-lspace:0pt; mso-table-rspace:0pt;">
    <tr>
      <!-- outer-td: has padding on desktop, stripped to 0 on mobile so email is full-width -->
      <td class="outer-td" align="center" valign="top" style="padding:32px 12px;">
        <!--[if mso]><table role="presentation" align="center" border="0" cellspacing="0" cellpadding="0" width="600"><tr><td><![endif]-->

        <!-- ═══════════════════════════════════════════════════
             MAIN CONTAINER — max 600px per Mailchimp guidelines
             ═══════════════════════════════════════════════════ -->
        <table class="email-container" role="presentation" cellpadding="0" cellspacing="0" border="0" width="600" align="center"
               style="max-width:600px; width:100%; background-color:#ffffff; border-collapse:collapse;">

          <!-- ╔═══════════ HEADER ═══════════╗ -->
          <tr>
            <td class="header-td" bgcolor="#1a1a1a" style="padding:28px 40px 24px 40px; background-color:#1a1a1a; border-bottom:3px solid #C9A55A;">
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
                <tr>
                  <td valign="bottom">
                    <!-- "P R E S A L E" label -->
                    <div style="font-family:'DM Sans', Helvetica, Arial, sans-serif; font-size:10px; font-weight:400; letter-spacing:4px; text-transform:uppercase; color:#C9A55A; margin-bottom:6px; mso-line-height-rule:exactly; line-height:1.4;">P R E S A L E</div>
                    <!-- "PROPERTIES" wordmark — Cormorant Garamond with Georgia fallback -->
                    <div style="font-family:'Cormorant Garamond', Georgia, 'Times New Roman', serif; font-size:42px; font-weight:300; letter-spacing:6px; text-transform:uppercase; color:#ffffff; line-height:1; mso-line-height-rule:exactly;">PROPERTIES</div>
                  </td>
                  <td align="right" valign="bottom">
                    <div style="font-family:'DM Sans', Helvetica, Arial, sans-serif; font-size:10px; font-weight:300; letter-spacing:2px; text-transform:uppercase; color:#999999; line-height:1.9; text-align:right; mso-line-height-rule:exactly;">S U R R E Y &nbsp;&middot;&nbsp; L A N G L E Y<br />M E T R O &nbsp; V A N C O U V E R</div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- ╔═══════════ HERO IMAGE ═══════════╗ -->
          ${heroImg}

          <!-- ╔═══════════ LOCATION TAG ═══════════╗ -->
          ${locationBar}

          <!-- ╔═══════════ MAIN CONTENT ═══════════╗ -->
          <tr>
            <td class="mobile-pad" bgcolor="#ffffff"
                style="padding:40px 40px 32px 40px; background-color:#ffffff;">

              <!-- Greeting — uses Mailchimp merge tag *|FNAME|* for personalization -->
              <div style="font-family:'DM Sans', Helvetica, Arial, sans-serif; font-size:14px; font-weight:300; color:#888888; margin-bottom:20px; mso-line-height-rule:exactly; line-height:1.5;">Hi *|FNAME|*,</div>

              <!-- Headline -->
              ${vars.headline
                ? `<div class="hero-headline" style="font-family:'Cormorant Garamond', Georgia, 'Times New Roman', serif; font-size:48px; font-weight:400; color:#111111; line-height:1.1; margin-bottom:28px; mso-line-height-rule:exactly;">${vars.headline}</div>`
                : `<div class="hero-headline" style="font-family:'Cormorant Garamond', Georgia, 'Times New Roman', serif; font-size:48px; font-weight:400; color:#111111; line-height:1.1; margin-bottom:0; mso-line-height-rule:exactly;">${vars.projectName || "The Moment"}</div>
                   <div class="hero-headline" style="font-family:'Cormorant Garamond', Georgia, 'Times New Roman', serif; font-size:48px; font-weight:400; font-style:italic; color:#C9A55A; line-height:1.1; margin-bottom:28px; mso-line-height-rule:exactly;">is Now.</div>`
              }

              <!-- Body paragraph -->
              <div class="body-text" style="font-family:'DM Sans', Helvetica, Arial, sans-serif; font-size:15px; font-weight:300; color:#444444; line-height:1.85; margin-bottom:36px; mso-line-height-rule:exactly;">
                We're bringing you an exclusive first look at <strong style="font-weight:500; color:#111111;">${vars.projectName || "this opportunity"}</strong>${vars.neighborhood ? ` in <strong style="font-weight:500; color:#111111;">${vars.neighborhood}</strong>` : ""}${vars.city ? `, ${vars.city}` : ""}. ${vars.startingPrice ? `Starting from <strong style="font-weight:500;">${vars.startingPrice}</strong> &mdash; ` : ""}this is your chance to secure preferred pricing before public launch. Limited units available.
              </div>

              <!-- Thin divider -->
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin-bottom:32px;">
                <tr><td height="1" bgcolor="#efefef" style="font-size:0; line-height:0; background-color:#efefef;">&nbsp;</td></tr>
              </table>

              <!-- Stats Row -->
              ${statsRow}

              <!-- CTA Buttons -->
              ${ctaSection}

            </td>
          </tr>

          ${highlightsList ? `
          <!-- ╔═══════════ WHY THIS PROJECT ═══════════╗ -->
          <tr>
            <td class="mobile-pad" bgcolor="#fafaf8"
                style="padding:32px 40px; background-color:#fafaf8; border-top:1px solid #efefef; border-bottom:1px solid #efefef;">
              <div style="font-family:'DM Sans', Helvetica, Arial, sans-serif; font-size:10px; font-weight:500; letter-spacing:3px; text-transform:uppercase; color:#aaaaaa; margin-bottom:20px; mso-line-height-rule:exactly; line-height:1.5;">W H Y &nbsp; T H I S &nbsp; P R O J E C T</div>
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
                ${highlightsList}
              </table>
            </td>
          </tr>` : ""}

          <!-- ╔═══════════ SIGNATURE ═══════════╗ -->
          <tr>
            <td class="mobile-pad" bgcolor="#ffffff" style="padding:36px 40px 32px 40px; background-color:#ffffff; border-top:1px solid #efefef;">
              <div style="font-family:'Cormorant Garamond', Georgia, 'Times New Roman', serif; font-size:28px; font-weight:400; color:#111111; margin-bottom:5px; mso-line-height-rule:exactly; line-height:1.2;">Uzair Muhammad</div>
              <div style="font-family:'DM Sans', Helvetica, Arial, sans-serif; font-size:11px; font-weight:400; letter-spacing:2px; text-transform:uppercase; color:#aaaaaa; margin-bottom:20px; mso-line-height-rule:exactly; line-height:1.5;">Presale Specialist &nbsp;&middot;&nbsp; Presale Properties</div>
              <table role="presentation" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td style="padding-right:28px; padding-bottom:6px;">
                    <a href="tel:+16041234567" style="font-family:'DM Sans', Helvetica, Arial, sans-serif; font-size:14px; font-weight:300; color:#555555; text-decoration:none;">&#128222; 604.XXX.XXXX</a>
                  </td>
                  <td style="padding-bottom:6px;">
                    <a href="https://presaleproperties.ca" target="_blank" style="font-family:'DM Sans', Helvetica, Arial, sans-serif; font-size:14px; font-weight:300; color:#C9A55A; text-decoration:none;">&#127760; presaleproperties.ca</a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- ╔═══════════ FOOTER ═══════════╗ -->
          <tr>
            <td class="footer-td" bgcolor="#111111" style="padding:28px 40px; background-color:#111111; border-top:3px solid #C9A55A;">
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
                <tr>
                  <td valign="top">
                    <div style="font-family:'DM Sans', Helvetica, Arial, sans-serif; font-size:11px; font-weight:400; letter-spacing:2.5px; text-transform:uppercase; color:#C9A55A; margin-bottom:10px; mso-line-height-rule:exactly; line-height:1.5;">Display &amp; Presentation Centre</div>
                    <div style="font-family:'DM Sans', Helvetica, Arial, sans-serif; font-size:13px; font-weight:300; color:#888888; line-height:1.9; mso-line-height-rule:exactly;">#108 2350 165 Street, Surrey BC</div>
                    <div style="font-family:'DM Sans', Helvetica, Arial, sans-serif; font-size:13px; font-weight:300; color:#888888; line-height:1.9; mso-line-height-rule:exactly;">Open Daily 12&ndash;5pm &nbsp;|&nbsp; Closed Thu &amp; Fri</div>
                  </td>
                  ${vars.projectUrl ? `<td align="right" valign="bottom">
                    <a href="${vars.projectUrl}" target="_blank" style="font-family:'DM Sans', Helvetica, Arial, sans-serif; font-size:11px; font-weight:400; letter-spacing:2px; text-transform:uppercase; color:#C9A55A; text-decoration:none;">View Project &rarr;</a>
                  </td>` : ""}
                </tr>
              </table>
            </td>
          </tr>

          <!-- ╔═══════════ LEGAL + UNSUBSCRIBE ═══════════╗ -->
          <!-- *|UNSUB|* and *|UPDATE_PROFILE|* are required Mailchimp merge tags -->
          <tr>
            <td class="legal-td" bgcolor="#0d0d0d" style="padding:20px 40px 24px 40px; background-color:#0d0d0d;">
              <div style="font-family:'DM Sans', Helvetica, Arial, sans-serif; font-size:11px; font-weight:300; color:#555555; line-height:1.75; margin-bottom:14px; mso-line-height-rule:exactly;">
                *Prices exclude taxes and are subject to availability at the time of inquiry and/or change without notice. This is not an offering for sale. Any such offering can only be made with a Disclosure Statement. E.&amp;O.E.
              </div>
              <div>
                <a href="*|UNSUB|*" style="font-family:'DM Sans', Helvetica, Arial, sans-serif; font-size:12px; font-weight:300; color:#777777; text-decoration:underline;">Unsubscribe</a>
                <span style="color:#444444; margin:0 8px;">&nbsp;&middot;&nbsp;</span>
                <a href="*|UPDATE_PROFILE|*" style="font-family:'DM Sans', Helvetica, Arial, sans-serif; font-size:12px; font-weight:300; color:#777777; text-decoration:underline;">Update Preferences</a>
              </div>
            </td>
          </tr>

        </table>
        <!--[if mso]></td></tr></table><![endif]-->
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
