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

// ─── Agent type ───────────────────────────────────────────────────────────────
interface AgentProfile {
  id: string;
  full_name: string;
  title: string;
  photo_url: string | null;
  // editable overrides (not in DB view)
  phone: string;
  email: string;
}

// Fallback contact info keyed by first name (until DB has phone/email)
const AGENT_CONTACTS: Record<string, { phone: string; email: string }> = {
  "Uzair":  { phone: "778-231-3592",      email: "info@presaleproperties.com" },
  "Sarb":   { phone: "+1 (778) 846-7065", email: "sarb@presaleproperties.com"  },
  "Ravish": { phone: "+1 (604) 349-9399", email: "ravish@presaleproperties.com" },
};

const LOGO_EMAIL_URL = "https://thvlisplwqhtjpzpedhq.supabase.co/storage/v1/object/public/avatars/brand%2Flogo-email.png";

// ─── Premium headline presets ─────────────────────────────────────────────────
// ─── Font pairings ────────────────────────────────────────────────────────────
interface FontPairing {
  id: string;
  label: string;
  tag: string; // short descriptor shown in card
  display: string; // CSS font-family string for headlines
  body: string;    // CSS font-family string for body
  googleUrl: string;
  fallbackDisplay: string;
  fallbackBody: string;
}

const FONT_PAIRINGS: FontPairing[] = [
  {
    id: "cormorant-dm",
    label: "Cormorant + DM Sans",
    tag: "Classic Luxury",
    display: "'Cormorant Garamond', Georgia, 'Times New Roman', serif",
    body: "'DM Sans', Helvetica, Arial, sans-serif",
    googleUrl: "https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;1,300;1,400&family=DM+Sans:wght@300;400;500&display=swap",
    fallbackDisplay: "Georgia, serif",
    fallbackBody: "Arial, sans-serif",
  },
  {
    id: "playfair-lato",
    label: "Playfair Display + Lato",
    tag: "Editorial",
    display: "'Playfair Display', Georgia, 'Times New Roman', serif",
    body: "'Lato', Helvetica, Arial, sans-serif",
    googleUrl: "https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,600;1,400&family=Lato:wght@300;400;700&display=swap",
    fallbackDisplay: "Georgia, serif",
    fallbackBody: "Arial, sans-serif",
  },
  {
    id: "bodoni-jost",
    label: "Bodoni Moda + Jost",
    tag: "High Fashion",
    display: "'Bodoni Moda', Georgia, 'Times New Roman', serif",
    body: "'Jost', Helvetica, Arial, sans-serif",
    googleUrl: "https://fonts.googleapis.com/css2?family=Bodoni+Moda:ital,wght@0,400;0,500;1,400&family=Jost:wght@300;400;500&display=swap",
    fallbackDisplay: "Georgia, serif",
    fallbackBody: "Arial, sans-serif",
  },
  {
    id: "cinzel-raleway",
    label: "Cinzel + Raleway",
    tag: "Architectural",
    display: "'Cinzel', Georgia, 'Times New Roman', serif",
    body: "'Raleway', Helvetica, Arial, sans-serif",
    googleUrl: "https://fonts.googleapis.com/css2?family=Cinzel:wght@400;500;600&family=Raleway:wght@300;400;500&display=swap",
    fallbackDisplay: "Georgia, serif",
    fallbackBody: "Arial, sans-serif",
  },
  {
    id: "spectral-inter",
    label: "Spectral + Inter",
    tag: "Modern Serif",
    display: "'Spectral', Georgia, 'Times New Roman', serif",
    body: "'Inter', Helvetica, Arial, sans-serif",
    googleUrl: "https://fonts.googleapis.com/css2?family=Spectral:ital,wght@0,300;0,400;1,300&family=Inter:wght@300;400;500&display=swap",
    fallbackDisplay: "Georgia, serif",
    fallbackBody: "Arial, sans-serif",
  },
  {
    id: "crimson-nunito",
    label: "Crimson Pro + Nunito",
    tag: "Warm Classic",
    display: "'Crimson Pro', Georgia, 'Times New Roman', serif",
    body: "'Nunito Sans', Helvetica, Arial, sans-serif",
    googleUrl: "https://fonts.googleapis.com/css2?family=Crimson+Pro:ital,wght@0,300;0,400;1,300;1,400&family=Nunito+Sans:wght@300;400;600&display=swap",
    fallbackDisplay: "Georgia, serif",
    fallbackBody: "Arial, sans-serif",
  },
  {
    id: "eb-garamond-montserrat",
    label: "EB Garamond + Montserrat",
    tag: "Prestige",
    display: "'EB Garamond', Georgia, 'Times New Roman', serif",
    body: "'Montserrat', Helvetica, Arial, sans-serif",
    googleUrl: "https://fonts.googleapis.com/css2?family=EB+Garamond:ital,wght@0,400;0,500;1,400&family=Montserrat:wght@300;400;500&display=swap",
    fallbackDisplay: "Georgia, serif",
    fallbackBody: "Arial, sans-serif",
  },
  {
    id: "libre-source",
    label: "Libre Baskerville + Source Sans",
    tag: "Timeless",
    display: "'Libre Baskerville', Georgia, 'Times New Roman', serif",
    body: "'Source Sans 3', Helvetica, Arial, sans-serif",
    googleUrl: "https://fonts.googleapis.com/css2?family=Libre+Baskerville:ital,wght@0,400;0,700;1,400&family=Source+Sans+3:wght@300;400;600&display=swap",
    fallbackDisplay: "Georgia, serif",
    fallbackBody: "Arial, sans-serif",
  },
  // ── Semi-bold / modern sans ──────────────────────────────────────────────────
  {
    id: "jakarta-jakarta",
    label: "Plus Jakarta Sans",
    tag: "Our Website Font",
    display: "'Plus Jakarta Sans', Helvetica, Arial, sans-serif",
    body: "'Plus Jakarta Sans', Helvetica, Arial, sans-serif",
    googleUrl: "https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:ital,wght@0,300;0,400;0,500;0,600;0,700;1,400&display=swap",
    fallbackDisplay: "Arial, sans-serif",
    fallbackBody: "Arial, sans-serif",
  },
  {
    id: "montserrat-montserrat",
    label: "Montserrat",
    tag: "Bold & Modern",
    display: "'Montserrat', Helvetica, Arial, sans-serif",
    body: "'Montserrat', Helvetica, Arial, sans-serif",
    googleUrl: "https://fonts.googleapis.com/css2?family=Montserrat:ital,wght@0,300;0,400;0,500;0,600;0,700;1,400&display=swap",
    fallbackDisplay: "Arial, sans-serif",
    fallbackBody: "Arial, sans-serif",
  },
  {
    id: "raleway-open",
    label: "Raleway + Open Sans",
    tag: "Refined Sans",
    display: "'Raleway', Helvetica, Arial, sans-serif",
    body: "'Open Sans', Helvetica, Arial, sans-serif",
    googleUrl: "https://fonts.googleapis.com/css2?family=Raleway:ital,wght@0,300;0,400;0,600;0,700;1,400&family=Open+Sans:wght@300;400;600&display=swap",
    fallbackDisplay: "Arial, sans-serif",
    fallbackBody: "Arial, sans-serif",
  },
  {
    id: "outfit-inter",
    label: "Outfit + Inter",
    tag: "Clean & Tech",
    display: "'Outfit', Helvetica, Arial, sans-serif",
    body: "'Inter', Helvetica, Arial, sans-serif",
    googleUrl: "https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700&family=Inter:wght@300;400;500&display=swap",
    fallbackDisplay: "Arial, sans-serif",
    fallbackBody: "Arial, sans-serif",
  },
  {
    id: "worksans-nunito",
    label: "Work Sans + Nunito",
    tag: "Warm & Geometric",
    display: "'Work Sans', Helvetica, Arial, sans-serif",
    body: "'Nunito', Helvetica, Arial, sans-serif",
    googleUrl: "https://fonts.googleapis.com/css2?family=Work+Sans:ital,wght@0,300;0,400;0,600;0,700;1,400&family=Nunito:wght@300;400;600&display=swap",
    fallbackDisplay: "Arial, sans-serif",
    fallbackBody: "Arial, sans-serif",
  },
  {
    id: "josefin-lato",
    label: "Josefin Sans + Lato",
    tag: "Geometric Luxury",
    display: "'Josefin Sans', Helvetica, Arial, sans-serif",
    body: "'Lato', Helvetica, Arial, sans-serif",
    googleUrl: "https://fonts.googleapis.com/css2?family=Josefin+Sans:ital,wght@0,300;0,400;0,600;0,700;1,400&family=Lato:wght@300;400;700&display=swap",
    fallbackDisplay: "Arial, sans-serif",
    fallbackBody: "Arial, sans-serif",
  },
];

const HEADLINE_PRESETS = [
  {
    label: "The Moment",
    headline: "The Moment Has Arrived",
    body: "A rare opportunity to own in one of the most sought-after communities. Limited homes available — register before public launch to secure preferred pricing and first access to floorplan selection.",
  },
  {
    label: "Exclusive Access",
    headline: "Exclusive VIP Access — Before the Public",
    body: "Your clients deserve first access. Before this goes public, we're offering a select group of realtors priority pricing, co-op commissions, and dedicated support from contract to keys.",
  },
  {
    label: "Your Next Investment",
    headline: "The Investment Your Clients Have Been Waiting For",
    body: "Strong rental yields. Appreciation-driven location. Developer-backed incentives. This is precisely the presale opportunity serious investors have been positioning for — and it won't last long.",
  },
];

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
function buildEmailHtml(vars: TemplateVars, cta: CtaToggles, agent: AgentProfile, font: FontPairing = FONT_PAIRINGS[0]): string {
  const locationTag = [vars.projectName, vars.city, vars.neighborhood]
    .filter(Boolean).map(s => s!.toUpperCase()).join("&nbsp;&nbsp;&middot;&nbsp;&nbsp;");

  // ── Stats row ───────────────────────────────────────────────────────────────
  const statsRow = (vars.startingPrice || vars.developerName || vars.city)
    ? `<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%"
          style="border-collapse:collapse; border-top:1px solid #efefef; border-bottom:1px solid #efefef; margin-bottom:36px;">
        <tr>
          ${vars.startingPrice ? `
          <td class="stat-col" valign="top" style="padding:18px 20px 18px 0; width:33%;">
            <div style="font-family:'Cormorant Garamond', Georgia, serif; font-size:34px; font-weight:400; color:#111111; line-height:1; mso-line-height-rule:exactly;">${vars.startingPrice}</div>
            <div style="font-family:'DM Sans', Helvetica, Arial, sans-serif; font-size:9px; font-weight:400; letter-spacing:2px; text-transform:uppercase; color:#aaaaaa; margin-top:6px;">S T A R T I N G &nbsp; F R O M &nbsp; + &nbsp; G S T</div>
          </td>
          <td class="stat-divider" width="1" style="background-color:#efefef; padding:0; font-size:0; line-height:0;">&nbsp;</td>` : ""}
          ${vars.developerName ? `
          <td class="stat-col" valign="top" style="padding:18px 20px; width:33%;">
            <div style="font-family:'Cormorant Garamond', Georgia, serif; font-size:24px; font-weight:400; color:#111111; line-height:1.2; mso-line-height-rule:exactly;">${vars.developerName}</div>
            <div style="font-family:'DM Sans', Helvetica, Arial, sans-serif; font-size:9px; font-weight:400; letter-spacing:2px; text-transform:uppercase; color:#aaaaaa; margin-top:6px;">D E V E L O P E R</div>
          </td>
          <td class="stat-divider" width="1" style="background-color:#efefef; padding:0; font-size:0; line-height:0;">&nbsp;</td>` : ""}
          ${vars.city ? `
          <td class="stat-col" valign="top" style="padding:18px 0 18px 20px; width:33%;">
            <div style="font-family:'Cormorant Garamond', Georgia, serif; font-size:24px; font-weight:400; color:#111111; line-height:1.2; mso-line-height-rule:exactly;">${vars.city}, BC</div>
            <div style="font-family:'DM Sans', Helvetica, Arial, sans-serif; font-size:9px; font-weight:400; letter-spacing:2px; text-transform:uppercase; color:#aaaaaa; margin-top:6px;">L O C A T I O N</div>
          </td>` : ""}
        </tr>
      </table>`
    : "";

  // ── CTA buttons ─────────────────────────────────────────────────────────────
  const primaryCta = (href: string, label: string) =>
    href
      ? `<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:10px;">
          <tr>
            <td bgcolor="#0d1f18" style="background-color:#0d1f18; padding:16px 40px; mso-padding-alt:16px 40px;">
              <!--[if mso]><a href="${href}" style="font-family:Arial,sans-serif; font-size:10px; font-weight:bold; letter-spacing:3px; text-transform:uppercase; color:#ffffff; text-decoration:none; display:inline-block;">${label} &rarr;</a><![endif]-->
              <!--[if !mso]><!--><a href="${href}" target="_blank" style="font-family:'DM Sans', Helvetica, Arial, sans-serif; font-size:10px; font-weight:500; letter-spacing:3px; text-transform:uppercase; color:#ffffff; text-decoration:none; display:inline-block; white-space:nowrap;">${label}&nbsp;&rarr;</a><!--<![endif]-->
            </td>
          </tr>
        </table>`
      : "";

  const secondaryCta = (href: string, label: string) =>
    href
      ? `<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:10px;">
          <tr>
            <td style="border:1.5px solid #C9A55A; padding:15px 40px; mso-padding-alt:15px 40px;">
              <!--[if mso]><a href="${href}" style="font-family:Arial,sans-serif; font-size:10px; letter-spacing:3px; text-transform:uppercase; color:#C9A55A; text-decoration:none; display:inline-block;">${label}</a><![endif]-->
              <!--[if !mso]><!--><a href="${href}" target="_blank" style="font-family:'DM Sans', Helvetica, Arial, sans-serif; font-size:10px; font-weight:400; letter-spacing:3px; text-transform:uppercase; color:#C9A55A; text-decoration:none; display:inline-block; white-space:nowrap;">&#128222;&nbsp; ${label}</a><!--<![endif]-->
            </td>
          </tr>
        </table>`
      : "";

  const ctaSection = [
    cta.floorplan && vars.floorplanUrl ? primaryCta(vars.floorplanUrl, "View Brochure &amp; Floorplans") : "",
    cta.brochure && vars.brochureUrl ? primaryCta(vars.brochureUrl, "Download Brochure") : "",
    cta.pricing && vars.pricingUrl ? primaryCta(vars.pricingUrl, "View Pricing") : "",
    cta.bookConsult && vars.bookUrl ? secondaryCta(vars.bookUrl, "Call Now &mdash; Book a Showing") : "",
    cta.viewProject && vars.projectUrl ? secondaryCta(vars.projectUrl, "View Full Project") : "",
  ].filter(Boolean).join("\n");

  // ── Highlights ──────────────────────────────────────────────────────────────
  const highlightsList = vars.bodyCopy
    ? vars.bodyCopy.split("\n").filter(Boolean).map((line) =>
        `<tr>
          <td valign="top" width="14" style="padding-bottom:14px; padding-right:12px; vertical-align:top;">
            <div style="width:6px; height:6px; background-color:#C9A55A; margin-top:7px; font-size:0; line-height:0;">&nbsp;</div>
          </td>
          <td valign="top" style="padding-bottom:14px; vertical-align:top;">
            <div style="font-family:'DM Sans', Helvetica, Arial, sans-serif; font-size:14px; font-weight:300; color:#444444; line-height:1.75; mso-line-height-rule:exactly;">${line}</div>
          </td>
        </tr>`
      ).join("\n")
    : "";

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
  <noscript><xml><o:OfficeDocumentSettings><o:AllowPNG/><o:PixelsPerInch>96</o:PixelsPerInch></o:OfficeDocumentSettings></xml></noscript>
  <![endif]-->
  <link href="${font.googleUrl}" rel="stylesheet" type="text/css" />
  <style type="text/css">
    body, table, td, a { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
    table, td { mso-table-lspace: 0pt; mso-table-rspace: 0pt; border-collapse: collapse !important; }
    img { -ms-interpolation-mode: bicubic; border: 0; height: auto; line-height: 100%; outline: none; text-decoration: none; }
    p { margin: 0; padding: 0; }
    @media only screen and (max-width: 620px) {
      .outer-td { padding: 0 !important; }
      .email-container { width: 100% !important; max-width: 100% !important; }
      .hero-img { width: 100% !important; max-width: 100% !important; height: auto !important; display: block !important; }
      .mobile-pad { padding: 28px 20px !important; }
      .header-td { padding: 22px 20px 18px 20px !important; }
      .location-td { padding: 11px 20px !important; }
      .footer-td { padding: 20px 20px !important; }
      .legal-td { padding: 20px 20px 24px 20px !important; }
      .hero-headline { font-size: 36px !important; line-height: 1.1 !important; }
      .body-text { font-size: 15px !important; line-height: 1.85 !important; }
      .stat-col { display: block !important; width: 100% !important; padding: 14px 0 !important; border-bottom: 1px solid #efefef !important; }
      .stat-divider { display: none !important; }
    }
  </style>
</head>
<body style="margin:0; padding:0; background-color:#f4f4f0; word-spacing:normal;">

  <div style="display:none; font-size:1px; line-height:1px; max-height:0px; max-width:0px; opacity:0; overflow:hidden; mso-hide:all; font-family:sans-serif;">
    ${vars.previewText || `Exclusive presale opportunity \u2014 ${vars.projectName || "Now Available"}`}&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;
  </div>

  <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color:#f4f4f0; border-collapse:collapse; mso-table-lspace:0pt; mso-table-rspace:0pt;">
    <tr>
      <td class="outer-td" align="center" valign="top" style="padding:32px 12px;">
        <!--[if mso]><table role="presentation" align="center" border="0" cellspacing="0" cellpadding="0" width="600"><tr><td><![endif]-->
        <table class="email-container" role="presentation" cellpadding="0" cellspacing="0" border="0" width="600" align="center"
               style="max-width:600px; width:100%; background-color:#ffffff; border-collapse:collapse;">

          <!-- HEADER -->
          <tr>
            <td class="header-td" bgcolor="#0d1f18" style="padding:28px 40px 26px 40px; background-color:#0d1f18;">
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
                <tr>
                  <td valign="bottom">
                    <div style="font-family:'DM Sans', Helvetica, Arial, sans-serif; font-size:9px; font-weight:400; letter-spacing:4px; text-transform:uppercase; color:#C9A55A; margin-bottom:8px; mso-line-height-rule:exactly; line-height:1.4;">P R E S A L E &nbsp; P R O P E R T I E S</div>
                    <div style="font-family:${font.display}; font-size:42px; font-weight:400; color:#ffffff; line-height:1; margin-bottom:10px; mso-line-height-rule:exactly;">${vars.projectName || "New Release"}</div>
                    <div style="font-family:${font.body}; font-size:13px; font-weight:300; color:#8aaa96; margin-bottom:14px; mso-line-height-rule:exactly; line-height:1.4;">Presented by Presale Properties${vars.developerName ? ` &middot; ${vars.developerName}` : ""}</div>
                    <div style="width:44px; height:2px; background-color:#C9A55A; font-size:0; line-height:0;">&nbsp;</div>
                  </td>
                  ${(vars.neighborhood || vars.city) ? `
                  <td align="right" valign="top" style="padding-left:16px; white-space:nowrap;">
                    <div style="font-family:${font.body}; font-size:9px; font-weight:300; letter-spacing:2.5px; text-transform:uppercase; color:#8aaa96; text-align:right; line-height:2.2; mso-line-height-rule:exactly;">
                      ${vars.city ? `${vars.city.toUpperCase()}<br/>` : ""}${vars.neighborhood ? vars.neighborhood.toUpperCase() : ""}
                    </div>
                  </td>` : ""}
                </tr>
              </table>
            </td>
          </tr>

          <!-- HERO IMAGE -->
          ${vars.featuredImage
            ? `<tr>
                <td align="center" valign="top" style="padding:0; margin:0; font-size:0; line-height:0; mso-line-height-rule:exactly;">
                  <img class="hero-img" src="${vars.featuredImage}" alt="${vars.projectName || "Presale Property"}" width="600" border="0"
                       style="display:block; width:600px; max-width:600px; height:auto; -ms-interpolation-mode:bicubic; margin:0; padding:0;" />
                </td>
              </tr>`
            : `<tr>
                <td align="center" valign="middle" bgcolor="#1a2e24" style="padding:60px 0; background-color:#1a2e24; text-align:center;">
                  <div style="font-family:'DM Sans', sans-serif; font-size:11px; letter-spacing:4px; text-transform:uppercase; color:#C9A55A;">ADD HERO IMAGE URL IN THE URLS TAB</div>
                </td>
              </tr>`
          }

          <!-- LOCATION BAR -->
          ${locationTag
            ? `<tr>
                <td class="location-td" bgcolor="#C9A55A" style="padding:13px 40px; background-color:#C9A55A;">
                  <div style="font-family:'DM Sans', Helvetica, Arial, sans-serif; font-size:10px; font-weight:400; letter-spacing:3px; text-transform:uppercase; color:#ffffff; mso-line-height-rule:exactly; line-height:1.5;">${locationTag}</div>
                </td>
              </tr>`
            : ""
          }

          <!-- MAIN CONTENT -->
          <tr>
            <td class="mobile-pad" bgcolor="#ffffff" style="padding:40px 40px 32px 40px; background-color:#ffffff;">

              <div style="font-family:${font.body}; font-size:14px; font-weight:300; color:#888888; margin-bottom:18px; mso-line-height-rule:exactly; line-height:1.5;">Hi *|FNAME|*,</div>

              <div class="hero-headline" style="font-family:${font.display}; font-size:48px; font-weight:400; color:#111111; line-height:1.05; margin-bottom:0; mso-line-height-rule:exactly;">${vars.projectName || "The Moment"}</div>
              ${vars.headline
                ? `<div class="hero-headline" style="font-family:${font.display}; font-size:48px; font-weight:300; font-style:italic; color:#C9A55A; line-height:1.05; margin-bottom:28px; mso-line-height-rule:exactly;">${vars.headline}.</div>`
                : `<div style="margin-bottom:28px;"></div>`
              }

              <div class="body-text" style="font-family:${font.body}; font-size:15px; font-weight:300; color:#444444; line-height:1.85; margin-bottom:20px; mso-line-height-rule:exactly;">
                We're bringing you an exclusive first look at <strong style="font-weight:500; color:#111111;">${vars.projectName || "this opportunity"}</strong>${vars.neighborhood ? ` in <strong style="font-weight:500; color:#111111;">${vars.neighborhood}</strong>` : ""}${vars.city ? `, ${vars.city}` : ""}. ${vars.startingPrice ? `Starting from <strong style="font-weight:500;">${vars.startingPrice}</strong> &mdash; ` : ""}this is your chance to secure preferred pricing before public launch. Limited units available.
              </div>
              <div class="body-text" style="font-family:${font.body}; font-size:15px; font-weight:600; color:#111111; line-height:1.6; margin-bottom:32px; mso-line-height-rule:exactly;">Your clients have been waiting for this. This is it.</div>

              <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin-bottom:28px;">
                <tr><td height="1" bgcolor="#efefef" style="font-size:0; line-height:0; background-color:#efefef;">&nbsp;</td></tr>
              </table>

              ${statsRow}
              ${ctaSection}

            </td>
          </tr>

          ${highlightsList ? `
          <!-- HIGHLIGHTS -->
          <tr>
            <td class="mobile-pad" bgcolor="#f8f7f4" style="padding:32px 40px; background-color:#f8f7f4; border-top:1px solid #efefef; border-bottom:1px solid #efefef;">
              <div style="font-family:${font.body}; font-size:10px; font-weight:500; letter-spacing:3px; text-transform:uppercase; color:#aaaaaa; margin-bottom:20px; mso-line-height-rule:exactly; line-height:1.5;">H I G H L I G H T S</div>
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
                ${highlightsList}
              </table>
            </td>
          </tr>` : ""}

          <!-- BOOKING BANNER -->
          ${(cta.bookConsult && vars.bookUrl) ? `
          <tr>
            <td bgcolor="#C9A55A" style="padding:22px 40px; background-color:#C9A55A;">
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
                <tr>
                  <td valign="middle">
                    <div style="font-family:'DM Sans', Helvetica, Arial, sans-serif; font-size:9px; font-weight:500; letter-spacing:3px; text-transform:uppercase; color:#4a2e00; margin-bottom:4px; mso-line-height-rule:exactly; line-height:1.4;">P R I V A T E &nbsp; S H O W I N G S &nbsp; A V A I L A B L E</div>
                    <div style="font-family:'Cormorant Garamond', Georgia, 'Times New Roman', serif; font-size:26px; font-weight:400; color:#0d1f18; mso-line-height-rule:exactly; line-height:1.2;">Book Your Showing Today</div>
                  </td>
                  <td align="right" valign="middle" style="padding-left:20px;">
                    <table role="presentation" cellpadding="0" cellspacing="0" border="0">
                      <tr>
                        <td bgcolor="#0d1f18" style="background-color:#0d1f18; padding:14px 22px;">
                          <!--[if !mso]><!-->
                          <a href="${vars.bookUrl}" target="_blank" style="font-family:'DM Sans', Arial, sans-serif; font-size:9px; font-weight:500; letter-spacing:3px; text-transform:uppercase; color:#ffffff; text-decoration:none; white-space:nowrap;">&#128222;&nbsp; CALL NOW</a>
                          <!--<![endif]-->
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td class="mobile-pad" bgcolor="#ffffff" style="padding:32px 40px 8px 40px; background-color:#ffffff;">
              <div class="body-text" style="font-family:${font.body}; font-size:15px; font-weight:300; color:#444444; line-height:1.85; mso-line-height-rule:exactly;">Reach out directly &mdash; I'll walk your clients through everything, from floorplan selection to contract review. No pressure, just expert guidance.</div>
            </td>
          </tr>` : ""}

          <!-- DIVIDER -->
          <tr>
            <td style="padding:24px 40px 0 40px;">
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
                <tr><td height="1" bgcolor="#efefef" style="font-size:0; line-height:0;">&nbsp;</td></tr>
              </table>
            </td>
          </tr>

          <!-- SIGNATURE -->
          <tr>
            <td bgcolor="#fafaf8" style="padding:0; background-color:#fafaf8; border-top:2px solid #C9A55A;">
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
                <tr>
                  <!-- Left: photo -->
                  ${agent.photo_url ? `
                  <td width="120" valign="middle" style="padding:28px 0 28px 32px; vertical-align:middle; line-height:0; font-size:0;">
                    <img src="${agent.photo_url}" alt="${agent.full_name}" width="80" height="80" border="0"
                         style="display:block; width:80px; height:80px; border-radius:50%; object-fit:cover; object-position:center top; border:2px solid #C9A55A; -ms-interpolation-mode:bicubic;" />
                  </td>` : ""}
                  <!-- Middle: info -->
                  <td valign="middle" style="padding:28px 16px 28px ${agent.photo_url ? "16px" : "32px"}; vertical-align:middle;">
                    <div style="font-family:${font.display}; font-size:22px; font-weight:400; color:#111111; line-height:1.15; mso-line-height-rule:exactly; margin-bottom:3px;">${agent.full_name}</div>
                    <div style="font-family:${font.body}; font-size:10px; font-weight:500; letter-spacing:2px; text-transform:uppercase; color:#C9A55A; mso-line-height-rule:exactly; line-height:1.5; margin-bottom:10px;">${agent.title}</div>
                    <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;">
                      ${agent.phone ? `<tr>
                        <td style="padding-bottom:5px; padding-right:7px; vertical-align:middle; font-size:11px; color:#888888; line-height:1;">&#128222;</td>
                        <td style="padding-bottom:5px; vertical-align:middle;"><a href="tel:${agent.phone.replace(/\D/g,"")}" style="font-family:${font.body}; font-size:12px; font-weight:400; color:#444444; text-decoration:none;">${agent.phone}</a></td>
                      </tr>` : ""}
                      ${agent.email ? `<tr>
                        <td style="padding-bottom:5px; padding-right:7px; vertical-align:middle; font-size:11px; color:#888888; line-height:1;">&#9993;</td>
                        <td style="padding-bottom:5px; vertical-align:middle;"><a href="mailto:${agent.email}" style="font-family:${font.body}; font-size:12px; font-weight:400; color:#444444; text-decoration:none;">${agent.email}</a></td>
                      </tr>` : ""}
                      <tr>
                        <td style="padding-right:7px; vertical-align:middle; font-size:11px; color:#888888; line-height:1;">&#127760;</td>
                        <td style="vertical-align:middle;"><a href="https://presaleproperties.ca" target="_blank" style="font-family:${font.body}; font-size:12px; font-weight:400; color:#444444; text-decoration:none;">presaleproperties.ca</a></td>
                      </tr>
                    </table>
                  </td>
                  <!-- Right: logo -->
                  <td align="right" valign="middle" style="padding:28px 32px 28px 16px; vertical-align:middle;">
                    <img src="${LOGO_EMAIL_URL}" alt="Presale Properties" width="140" border="0"
                         style="display:block; width:140px; max-width:140px; height:auto; -ms-interpolation-mode:bicubic;" />
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- FOOTER -->
          <tr>
            <td class="footer-td" bgcolor="#0d1f18" style="padding:22px 40px; background-color:#0d1f18;">
              <div style="font-family:'DM Sans', Arial, sans-serif; font-size:9px; font-weight:400; letter-spacing:2.5px; text-transform:uppercase; color:#C9A55A; margin-bottom:6px; mso-line-height-rule:exactly; line-height:1.5;">PRESALE PROPERTIES &nbsp;&middot;&nbsp; ${vars.city ? `${vars.city.toUpperCase()}, BC` : "VANCOUVER, BC"}</div>
              <div style="font-family:'DM Sans', Arial, sans-serif; font-size:12px; font-weight:300; color:#8aaa96; mso-line-height-rule:exactly; line-height:1.6;">presaleproperties.ca &nbsp;&middot;&nbsp; ${agent.phone}</div>
            </td>
          </tr>

          <!-- LEGAL + UNSUBSCRIBE -->
          <tr>
            <td class="legal-td" bgcolor="#f8f7f4" style="padding:24px 40px 28px 40px; background-color:#f8f7f4; border-top:1px solid #e8e8e4;">
              <div style="font-family:'DM Sans', Arial, sans-serif; font-size:10px; font-weight:600; letter-spacing:2px; text-transform:uppercase; color:#555555; margin-bottom:12px; mso-line-height-rule:exactly; line-height:1.4;">L E G A L &nbsp; D I S C L A I M E R</div>
              <div style="font-family:'DM Sans', Arial, sans-serif; font-size:11px; font-weight:300; color:#888888; line-height:1.8; margin-bottom:12px; mso-line-height-rule:exactly;">
                This communication is prepared by ${agent.full_name}, a licensed REALTOR&reg; with Presale Properties, for real estate professionals and prospective purchasers only. This is <strong style="font-weight:500; color:#666666;">not an offering for sale</strong>. An offering may only be made after filing a Disclosure Statement under REDMA. Prices, availability and incentives subject to change without notice. All prices exclude applicable taxes (GST/PST). PTT exemptions subject to buyer eligibility at time of completion. Information believed accurate but not guaranteed. E.&amp;O.E. Presale Properties complies with the Real Estate Services Act (BCFSA).
              </div>
              <div style="font-family:'DM Sans', Arial, sans-serif; font-size:11px; font-weight:300; color:#888888; line-height:1.8; margin-bottom:18px; mso-line-height-rule:exactly;">
                You are receiving this because you opted in to presale updates from Presale Properties. Per Canada's Anti-Spam Legislation (CASL), you may withdraw consent at any time.
              </div>
              <div>
                <a href="*|UNSUB|*" style="font-family:'DM Sans', Arial, sans-serif; font-size:11px; font-weight:300; color:#888888; text-decoration:underline;">Unsubscribe</a>
                <span style="color:#cccccc; margin:0 10px;">&middot;</span>
                <a href="*|UPDATE_PROFILE|*" style="font-family:'DM Sans', Arial, sans-serif; font-size:11px; font-weight:300; color:#888888; text-decoration:underline;">Update Preferences</a>
                <span style="color:#cccccc; margin:0 10px;">&middot;</span>
                <a href="*|EMAIL_WEB_VERSION_URL|*" style="font-family:'DM Sans', Arial, sans-serif; font-size:11px; font-weight:300; color:#888888; text-decoration:underline;">View in Browser</a>
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
  const [agentIdx, setAgentIdx] = useState(0);
  const [headlinePresetIdx, setHeadlinePresetIdx] = useState<number | null>(null);
  const [fontIdx, setFontIdx] = useState(0);

  // ── Agent list from DB ───────────────────────────────────────────────────────
  const [agents, setAgents] = useState<AgentProfile[]>([]);
  const [selectedAgent, setSelectedAgent] = useState<AgentProfile | null>(null);

  useEffect(() => {
    supabase
      .from("team_members_public")
      .select("id, full_name, title, photo_url")
      .eq("is_active", true)
      .order("sort_order")
      .then(({ data }) => {
        if (!data?.length) return;
        const enriched: AgentProfile[] = data.map((m) => {
          const firstName = (m.full_name ?? "").split(" ")[0];
          const contact = AGENT_CONTACTS[firstName] ?? { phone: "", email: "" };
          return { id: m.id, full_name: m.full_name ?? "", title: m.title ?? "Presale Expert", photo_url: m.photo_url, ...contact };
        });
        setAgents(enriched);
        setSelectedAgent(enriched[0]);
      });
  }, []);

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

  const finalHtml = useCustomHtml ? importHtml : buildEmailHtml(
    vars, cta,
    selectedAgent ?? { id: "", full_name: "Your Name", title: "Presale Expert", photo_url: null, phone: "", email: "" },
    FONT_PAIRINGS[fontIdx]
  );

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
      <div className="flex items-center justify-between gap-4 mb-4">
        <div className="flex items-center gap-4 min-w-0">
          <div className="shrink-0">
            <h1 className="text-lg font-bold text-foreground tracking-tight leading-tight">Email Builder</h1>
            <p className="text-xs text-muted-foreground">Mailchimp-ready HTML · No code needed</p>
          </div>

          <Separator orientation="vertical" className="h-8" />

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

      {/* INBOX PREVIEW BAR */}
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

      {/* MAIN 2-PANEL LAYOUT */}
      <div className="grid grid-cols-[1fr_340px] gap-4 h-[calc(100vh-230px)] min-h-[600px]">

        {/* LEFT: Email preview */}
        <div className="flex flex-col rounded-xl border border-border bg-card overflow-hidden shadow-sm">
          <div className="flex items-center justify-between px-4 py-2.5 border-b border-border bg-muted/20 shrink-0">
            <div className="flex items-center gap-1 bg-muted/50 rounded-lg p-0.5">
              <Button
                variant="ghost" size="sm"
                className={cn("h-7 px-3 text-xs gap-1.5 rounded-md transition-all", previewMode === "preview" && "bg-card shadow-sm text-foreground font-medium")}
                onClick={() => setPreviewMode("preview")}
              >
                <Eye className="h-3 w-3" /> Preview
              </Button>
              <Button
                variant="ghost" size="sm"
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
                      variant="ghost" size="sm"
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
                      variant="ghost" size="sm"
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
                <Button variant="ghost" size="sm" className="h-7 px-2 text-xs gap-1" onClick={handleCopy}>
                  <Copy className="h-3 w-3" />
                  {copied ? "Copied!" : "Copy"}
                </Button>
              )}
            </div>
          </div>

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

        {/* RIGHT: Editor panel */}
        <div className="flex flex-col gap-0 rounded-xl border border-border bg-card overflow-hidden shadow-sm">
          <div className="px-4 pt-4 pb-3 border-b border-border bg-muted/10 shrink-0">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-foreground">Email Editor</h2>
              {useCustomHtml && (
                <Button variant="ghost" size="sm" className="h-6 text-[11px] px-2 text-amber-600 hover:text-amber-700" onClick={() => setUseCustomHtml(false)}>
                  ← Use template
                </Button>
              )}
            </div>
          </div>

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

              {/* CONTENT TAB */}
              <TabsContent value="content" className="mt-0 px-4 pb-4 space-y-4">
                <div className="pt-3 space-y-3">
                  <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Sender / Signature</span>

                  {/* Agent picker */}
                  <div className="flex gap-1.5 flex-wrap">
                    {agents.map((a) => (
                      <button
                        key={a.id}
                        onClick={() => setSelectedAgent({ ...a })}
                        className={cn(
                          "flex items-center gap-2 px-2.5 py-2 rounded-lg border text-left transition-all",
                          selectedAgent?.id === a.id
                            ? "border-primary bg-primary/5 shadow-sm"
                            : "border-border bg-background hover:border-primary/30"
                        )}
                      >
                        {a.photo_url ? (
                          <img src={a.photo_url} alt={a.full_name}
                            className="w-9 h-9 rounded-full object-cover object-top border border-border shrink-0" />
                        ) : (
                          <div className="w-9 h-9 rounded-full bg-muted flex items-center justify-center text-xs font-semibold text-muted-foreground shrink-0">
                            {a.full_name.charAt(0)}
                          </div>
                        )}
                        <div className="min-w-0">
                          <div className="text-[11px] font-semibold text-foreground truncate">{a.full_name.split(" ")[0]}</div>
                          <div className="text-[9px] text-muted-foreground truncate leading-tight">{a.title}</div>
                        </div>
                      </button>
                    ))}
                  </div>

                  {/* Editable signature fields */}
                  {selectedAgent && (
                    <div className="rounded-lg border border-border bg-muted/20 p-3 space-y-2">
                      <div className="flex items-center gap-2 mb-1">
                        {selectedAgent.photo_url && (
                          <img src={selectedAgent.photo_url} alt={selectedAgent.full_name}
                            className="w-10 h-10 rounded-full object-cover object-top border-2 border-primary/40 shrink-0" />
                        )}
                        <div>
                          <div className="text-[11px] font-semibold text-foreground">{selectedAgent.full_name}</div>
                          <div className="text-[10px] text-muted-foreground">Edit signature details below</div>
                        </div>
                      </div>
                      <div>
                        <Label className="text-[10px] text-muted-foreground">Title</Label>
                        <Input value={selectedAgent.title} onChange={(e) => setSelectedAgent({ ...selectedAgent, title: e.target.value })}
                          className="h-7 text-xs mt-0.5" />
                      </div>
                      <div>
                        <Label className="text-[10px] text-muted-foreground">Phone</Label>
                        <Input value={selectedAgent.phone} onChange={(e) => setSelectedAgent({ ...selectedAgent, phone: e.target.value })}
                          className="h-7 text-xs mt-0.5" placeholder="778-000-0000" />
                      </div>
                      <div>
                        <Label className="text-[10px] text-muted-foreground">Email</Label>
                        <Input value={selectedAgent.email} onChange={(e) => setSelectedAgent({ ...selectedAgent, email: e.target.value })}
                          className="h-7 text-xs mt-0.5" placeholder="name@presaleproperties.com" />
                      </div>
                    </div>
                  )}
                </div>

                <Separator />

                {/* Font Pairing Selector */}
                <div className="pt-3">
                  <div className="flex items-center gap-1.5 mb-2.5">
                    <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Typography</span>
                  </div>
                  <div className="grid grid-cols-2 gap-1.5">
                    {FONT_PAIRINGS.map((fp, i) => (
                      <button
                        key={fp.id}
                        onClick={() => setFontIdx(i)}
                        className={cn(
                          "text-left rounded-lg border px-2.5 py-2 transition-all",
                          fontIdx === i
                            ? "border-primary bg-primary/5 shadow-sm"
                            : "border-border bg-background hover:border-primary/30"
                        )}
                      >
                        <div className="text-[11px] font-medium text-foreground leading-tight truncate">{fp.label.split(" + ")[0]}</div>
                        <div className="text-[9px] text-muted-foreground truncate">+ {fp.label.split(" + ")[1]}</div>
                        <div className="text-[9px] text-primary/70 mt-0.5 font-medium">{fp.tag}</div>
                      </button>
                    ))}
                  </div>
                </div>

                <Separator />
                <div className="pt-3">
                  <div className="flex items-center gap-1.5 mb-2.5">
                    <Mail className="h-3 w-3 text-muted-foreground" />
                    <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Inbox</span>
                  </div>
                  <div className="space-y-2">
                    <div>
                      <Label className="text-[11px] text-muted-foreground">Subject Line</Label>
                      <Input value={vars.subjectLine} onChange={v("subjectLine")} className="h-8 text-xs mt-1" placeholder="🏙️ Exclusive Access: Project Name — City" />
                    </div>
                    <div>
                      <Label className="text-[11px] text-muted-foreground">Preview Text</Label>
                      <Input value={vars.previewText} onChange={v("previewText")} className="h-8 text-xs mt-1" placeholder="From $599K · Surrey · Limited units" />
                      <p className="text-[10px] text-muted-foreground/60 mt-1">Shown after subject line in inbox</p>
                    </div>
                  </div>
                </div>

                <Separator />

                <div>
                  <div className="flex items-center gap-1.5 mb-2.5">
                    <Sparkles className="h-3 w-3 text-muted-foreground" />
                    <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Email Body</span>
                  </div>
                  {/* Premium text presets */}
                  <div className="mb-3 space-y-2">
                    <Label className="text-[11px] text-muted-foreground">Premium Text Presets</Label>
                    {HEADLINE_PRESETS.map((preset, i) => (
                      <button
                        key={i}
                        onClick={() => {
                          setHeadlinePresetIdx(i);
                          setVars((prev) => ({ ...prev, headline: preset.headline, bodyCopy: prev.bodyCopy || preset.body }));
                        }}
                        className={cn(
                          "w-full text-left rounded-lg border px-3 py-2.5 transition-all",
                          headlinePresetIdx === i
                            ? "border-primary bg-primary/5 shadow-sm"
                            : "border-border bg-background hover:border-primary/30"
                        )}
                      >
                        <div className="text-[11px] font-semibold text-foreground mb-0.5">{preset.label}</div>
                        <div className="text-[10px] text-muted-foreground italic leading-relaxed line-clamp-2">"{preset.headline}"</div>
                      </button>
                    ))}
                  </div>

                  <div className="space-y-2">
                    <div>
                      <Label className="text-[11px] text-muted-foreground">Headline (italic gold subhead)</Label>
                      <Input value={vars.headline} onChange={v("headline")} className="h-8 text-xs mt-1" placeholder="Final Phase" />
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

              {/* PROJECT TAB */}
              <TabsContent value="project" className="mt-0 px-4 pb-4 space-y-3">
                <div className="pt-3">
                  {selectedProject?.featured_image && (
                    <div className="mb-3 rounded-lg overflow-hidden border border-border">
                      <img src={selectedProject.featured_image} alt={selectedProject.name} className="w-full h-28 object-cover" />
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

              {/* URLS TAB */}
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
