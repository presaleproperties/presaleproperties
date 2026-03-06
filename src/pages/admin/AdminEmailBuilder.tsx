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
  BookMarked,
  FolderOpen,
  Trash2,
  Save,
  Wand2,
  Loader2,
  PlusCircle,
  CheckCheck,
  DollarSign,
  TableProperties,
} from "lucide-react";
import * as pdfjsLib from "pdfjs-dist";
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdn.jsdelivr.net/npm/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;
import { cn } from "@/lib/utils";

// ─── Saved Template type ──────────────────────────────────────────────────────
interface SavedEmailTemplate {
  id: string;
  name: string;
  project_name: string;
  form_data: {
    vars: Record<string, string>;
    cta: Record<string, boolean>;
    fontIdx: number;
    agentId?: string;
  };
  created_at: string;
  updated_at: string;
}

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
    label: "Thank You — Here's the Info",
    headline: "Thank You for Your Interest",
    body: "I appreciate you taking the time to register. I've put together everything you need on this project below — the key details, floorplans, and pricing. Take a look, and when you're ready, give me a call. I'm here to make this easy for you.",
  },
  {
    label: "You Registered — Let's Talk",
    headline: "You Registered — Here's What to Know",
    body: "Thanks for signing up. I wanted to personally follow up with the full details on this project. I've included the pricing and floorplans below. Once you've had a chance to review, I'd love to hop on a quick call and walk you through it. No pressure — just honest information.",
  },
  {
    label: "Here's Your Info",
    headline: "Here's the Information You Requested",
    body: "Thanks for reaching out. Below you'll find the key details on this project — home sizes, pricing, deposit structure, and estimated completion. I work exclusively with buyers, so my job is to make sure you have everything you need to make the right decision. Give me a call whenever you're ready.",
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

interface PricingUnit {
  type: string;
  sqft?: string;
  price?: string;
}

interface PricingSummaryData {
  summary?: string;
  units?: PricingUnit[];
  highlights?: string[];
}

interface TemplateVars {
  projectName: string;
  developerName: string;
  address: string;
  city: string;
  neighborhood: string;
  completion: string;
  startingPrice: string;
  deposit: string;
  featuredImage: string;
  brochureUrl: string;
  floorplanUrl: string;
  pricingUrl: string;
  projectUrl: string;
  headline: string;
  bodyCopy: string;
  incentiveText: string;
  bookUrl: string;
  subjectLine: string;
  previewText: string;
  greeting: string;
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
  deposit: "",
  featuredImage: "",
  brochureUrl: "",
  floorplanUrl: "",
  pricingUrl: "",
  projectUrl: "",
  headline: "",
  bodyCopy: "",
  incentiveText: "",
  bookUrl: "https://presaleproperties.com/book",
  subjectLine: "",
  previewText: "",
  greeting: "Hi *|FNAME|*,",
};

const DEFAULT_CTA: CtaToggles = {
  brochure: false,
  floorplan: true,
  pricing: false,
  viewProject: false,
  bookConsult: true,
};

// ─── Template builder ─────────────────────────────────────────────────────────
function buildEmailHtml(vars: TemplateVars, cta: CtaToggles, agent: AgentProfile, font: FontPairing = FONT_PAIRINGS[0], pricingData?: PricingSummaryData | null): string {
  const locationTag = [vars.projectName, vars.city, vars.neighborhood]
    .filter(Boolean).map(s => s!.toUpperCase()).join("&nbsp;&nbsp;&middot;&nbsp;&nbsp;");

  // ── Stats row ───────────────────────────────────────────────────────────────
  const statsRow = (vars.startingPrice || vars.deposit || vars.completion)
    ? `<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%"
          style="border-collapse:collapse; border-top:1px solid #efefef; border-bottom:1px solid #efefef; margin-bottom:36px;">
        <tr>
          ${vars.startingPrice ? `
          <td class="stat-col" valign="top" style="padding:18px 16px 18px 0; width:33%;">
            <div style="font-family:'Cormorant Garamond', Georgia, serif; font-size:32px; font-weight:400; color:#111111; line-height:1; mso-line-height-rule:exactly;">${vars.startingPrice}</div>
            <div style="font-family:'DM Sans', Helvetica, Arial, sans-serif; font-size:9px; font-weight:400; letter-spacing:1px; text-transform:uppercase; color:#aaaaaa; margin-top:6px; white-space:nowrap;">Starting + GST</div>
          </td>
          <td class="stat-divider" width="1" style="background-color:#efefef; padding:0; font-size:0; line-height:0;">&nbsp;</td>` : ""}
          ${vars.deposit ? `
          <td class="stat-col" valign="top" style="padding:18px 16px; width:33%;">
            <div style="font-family:'Cormorant Garamond', Georgia, serif; font-size:24px; font-weight:400; color:#111111; line-height:1.2; mso-line-height-rule:exactly;">${vars.deposit}</div>
            <div style="font-family:'DM Sans', Helvetica, Arial, sans-serif; font-size:9px; font-weight:400; letter-spacing:1px; text-transform:uppercase; color:#aaaaaa; margin-top:6px; white-space:nowrap;">Deposit to Secure</div>
          </td>
          <td class="stat-divider" width="1" style="background-color:#efefef; padding:0; font-size:0; line-height:0;">&nbsp;</td>` : ""}
          ${vars.completion ? `
          <td class="stat-col" valign="top" style="padding:18px 0 18px 16px; width:33%;">
            <div style="font-family:'Cormorant Garamond', Georgia, serif; font-size:24px; font-weight:400; color:#111111; line-height:1.2; mso-line-height-rule:exactly;">${vars.completion}</div>
            <div style="font-family:'DM Sans', Helvetica, Arial, sans-serif; font-size:9px; font-weight:400; letter-spacing:1px; text-transform:uppercase; color:#aaaaaa; margin-top:6px; white-space:nowrap;">Est. Completion</div>
          </td>` : ""}
        </tr>
      </table>`
    : "";

  // ── CTA buttons ─────────────────────────────────────────────────────────────
  const primaryCta = (href: string, label: string) =>
    href
      ? `<table class="cta-btn" role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin-bottom:10px; max-width:320px;">
          <tr>
            <td bgcolor="#0d1f18" style="background-color:#0d1f18; padding:16px 40px; mso-padding-alt:16px 40px; text-align:center;">
              <!--[if mso]><a href="${href}" style="font-family:Arial,sans-serif; font-size:10px; font-weight:bold; letter-spacing:3px; text-transform:uppercase; color:#ffffff; text-decoration:none; display:inline-block;">${label} &rarr;</a><![endif]-->
              <!--[if !mso]><!--><a href="${href}" target="_blank" style="font-family:'DM Sans', Helvetica, Arial, sans-serif; font-size:10px; font-weight:500; letter-spacing:3px; text-transform:uppercase; color:#ffffff; text-decoration:none; display:inline-block;">${label}&nbsp;&rarr;</a><!--<![endif]-->
            </td>
          </tr>
        </table>`
      : "";

  const secondaryCta = (href: string, label: string) =>
    href
      ? `<table class="cta-btn" role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin-bottom:10px; max-width:320px;">
          <tr>
            <td style="border:1.5px solid #C9A55A; padding:15px 40px; mso-padding-alt:15px 40px; text-align:center;">
              <!--[if mso]><a href="${href}" style="font-family:Arial,sans-serif; font-size:10px; letter-spacing:3px; text-transform:uppercase; color:#C9A55A; text-decoration:none; display:inline-block;">${label}</a><![endif]-->
              <!--[if !mso]><!--><a href="${href}" target="_blank" style="font-family:'DM Sans', Helvetica, Arial, sans-serif; font-size:10px; font-weight:400; letter-spacing:3px; text-transform:uppercase; color:#C9A55A; text-decoration:none; display:inline-block;">${label}</a><!--<![endif]-->
            </td>
          </tr>
        </table>`
      : "";

  const callNowHref = agent.phone ? `tel:${agent.phone.replace(/\D/g, "")}` : "";
  const whatsappNumber = "16722581100";
  const whatsappMsg = encodeURIComponent(`Hi! I got your email and I'm interested in seeing the showhome for ${vars.projectName || "this project"}. When is a good time?`);
  const whatsappHref = `https://wa.me/${whatsappNumber}?text=${whatsappMsg}`;

  const ctaSection = [
    cta.floorplan && vars.floorplanUrl ? primaryCta(vars.floorplanUrl, "View Brochure &amp; Floorplans") : "",
    cta.brochure && vars.brochureUrl ? primaryCta(vars.brochureUrl, "Download Brochure") : "",
    cta.pricing && vars.pricingUrl ? primaryCta(vars.pricingUrl, "View Pricing") : "",
    cta.bookConsult && callNowHref ? secondaryCta(callNowHref, "&#128222;&nbsp; CALL NOW") : "",
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

  // ── Incentives ──────────────────────────────────────────────────────────────
  const incentiveLines = vars.incentiveText
    ? vars.incentiveText.split("\n").filter(Boolean).map((line) =>
        `<tr>
          <td valign="top" width="20" style="padding-bottom:12px; padding-right:10px; vertical-align:top;">
            <div style="width:6px; height:6px; background-color:#C9A55A; margin-top:6px; font-size:0; line-height:0;">&nbsp;</div>
          </td>
          <td valign="top" style="padding-bottom:12px; vertical-align:top;">
            <div style="font-family:'DM Sans', Helvetica, Arial, sans-serif; font-size:14px; font-weight:300; color:#c8d8cc; line-height:1.75; mso-line-height-rule:exactly;">${line}</div>
          </td>
        </tr>`
      ).join("\n")
    : "";

  // ── Pricing Card ─────────────────────────────────────────────────────────────
  const pricingUnitsRows = (pricingData?.units ?? []).map((u) =>
    `<tr>
      <td style="padding:10px 14px; border-bottom:1px solid #1e3028; font-family:'DM Sans',Helvetica,Arial,sans-serif; font-size:13px; color:#e8f0ea; font-weight:400;">${u.type}</td>
      <td style="padding:10px 14px; border-bottom:1px solid #1e3028; font-family:'DM Sans',Helvetica,Arial,sans-serif; font-size:12px; color:#8aaa96; text-align:center;">${u.sqft ?? "&mdash;"}</td>
      <td style="padding:10px 14px; border-bottom:1px solid #1e3028; font-family:'Cormorant Garamond',Georgia,serif; font-size:18px; color:#C9A55A; font-weight:400; text-align:right; white-space:nowrap;">${u.price ?? "&mdash;"}</td>
    </tr>`
  ).join("\n");

  const pricingHighlightRows = (pricingData?.highlights ?? []).map((h) =>
    `<tr>
      <td valign="top" width="16" style="padding-bottom:10px; padding-right:10px; vertical-align:top;">
        <div style="width:5px; height:5px; background-color:#C9A55A; margin-top:6px; font-size:0; line-height:0;">&nbsp;</div>
      </td>
      <td valign="top" style="padding-bottom:10px; vertical-align:top;">
        <div style="font-family:'DM Sans',Helvetica,Arial,sans-serif; font-size:13px; color:#c8d8cc; line-height:1.7;">${h}</div>
      </td>
    </tr>`
  ).join("\n");

  const pricingCardHtml = pricingData
    ? `
          <!-- PRICING CARD -->
          <tr>
            <td class="mobile-pad" bgcolor="#0f2419" style="padding:0; background-color:#0f2419; border-top:1px solid #1a3028;">
              <!-- header row -->
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
                <tr>
                  <td style="padding:24px 40px 16px 40px; background-color:#0f2419;">
                    <div style="font-family:'DM Sans',Helvetica,Arial,sans-serif; font-size:9px; letter-spacing:2.5px; text-transform:uppercase; color:#C9A55A; margin-bottom:6px; line-height:1.4;">PRICING OVERVIEW</div>
                    <div style="font-family:'Cormorant Garamond',Georgia,serif; font-size:28px; font-weight:400; color:#ffffff; line-height:1.1; margin-bottom:6px;">${vars.projectName || "Pricing"}</div>
                    <div style="width:44px; height:2px; background-color:#C9A55A; font-size:0; line-height:0; margin-bottom:14px;">&nbsp;</div>
                    ${pricingData.summary ? `<div style="font-family:'DM Sans',Helvetica,Arial,sans-serif; font-size:13px; font-weight:300; color:#8aaa96; line-height:1.7; margin-bottom:4px;">${pricingData.summary}</div>` : ""}
                  </td>
                </tr>
              </table>
              ${pricingUnitsRows ? `
              <!-- unit table -->
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="border-collapse:collapse; border-top:1px solid #1e3028; margin-bottom:0;">
                <tr>
                  <th style="padding:8px 14px; background-color:#0a1a10; font-family:'DM Sans',Helvetica,Arial,sans-serif; font-size:9px; letter-spacing:2px; text-transform:uppercase; color:#5a7a66; text-align:left; font-weight:500;">Unit Type</th>
                  <th style="padding:8px 14px; background-color:#0a1a10; font-family:'DM Sans',Helvetica,Arial,sans-serif; font-size:9px; letter-spacing:2px; text-transform:uppercase; color:#5a7a66; text-align:center; font-weight:500;">Sq Ft</th>
                  <th style="padding:8px 14px; background-color:#0a1a10; font-family:'DM Sans',Helvetica,Arial,sans-serif; font-size:9px; letter-spacing:2px; text-transform:uppercase; color:#5a7a66; text-align:right; font-weight:500;">From</th>
                </tr>
                ${pricingUnitsRows}
              </table>` : ""}
              ${pricingHighlightRows ? `
              <!-- highlights -->
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="padding:20px 40px 24px 40px;">
                <tr><td colspan="2" style="padding:20px 40px 8px 40px; padding-top:20px;">
                  <div style="font-family:'DM Sans',Helvetica,Arial,sans-serif; font-size:9px; letter-spacing:2px; text-transform:uppercase; color:#5a7a66; margin-bottom:12px;">Key Details</div>
                </td></tr>
                ${pricingHighlightRows.split("<tr>").slice(1).map(r => `<tr style="margin:0;"><td style="padding:0 40px;" colspan="2"><table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%"><tr>${r}</table></td></tr>`).join("")}
              </table>` : ""}
            </td>
          </tr>`
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
    /* Prevent email clients from auto-detecting and re-styling links */
    a[x-apple-data-detectors] { color: inherit !important; text-decoration: none !important; font-size: inherit !important; font-family: inherit !important; font-weight: inherit !important; line-height: inherit !important; }
    u + #body a { color: inherit !important; text-decoration: none !important; font-size: inherit !important; font-family: inherit !important; font-weight: inherit !important; line-height: inherit !important; }
    #MessageViewBody a { color: inherit !important; text-decoration: none !important; font-size: inherit !important; font-family: inherit !important; font-weight: inherit !important; line-height: inherit !important; }
    @media only screen and (max-width: 620px) {
      .outer-td { padding: 0 !important; }
      .email-container { width: 100% !important; max-width: 100% !important; }
      .hero-img { width: 100% !important; max-width: 100% !important; height: auto !important; display: block !important; }
      .mobile-pad { padding: 18px 14px !important; }
      .header-td { padding: 14px 14px 12px 14px !important; }
      .location-td { padding: 8px 14px !important; }
      .footer-td { padding: 14px 14px !important; }
      .legal-td { padding: 14px 14px 18px 14px !important; }
      .hero-headline { font-size: 26px !important; line-height: 1.15 !important; }
      .body-text { font-size: 14px !important; line-height: 1.8 !important; }
      .stat-col { display: block !important; width: 100% !important; padding: 10px 0 !important; border-bottom: 1px solid #efefef !important; }
      .stat-divider { display: none !important; }
      .header-city { display: none !important; }
      .sig-logo-td { display: none !important; }
      .cta-btn { width: 100% !important; display: block !important; text-align: center !important; }
      .cta-btn a { display: block !important; width: 100% !important; box-sizing: border-box !important; }
      .booking-td { padding: 16px 14px !important; }
      .booking-left { display: block !important; width: 100% !important; padding-bottom: 12px !important; }
      .booking-right { display: block !important; width: 100% !important; text-align: center !important; padding-left: 0 !important; }
      .booking-btn td { width: 100% !important; text-align: center !important; padding: 12px 14px !important; display: block !important; }
      .booking-title { font-size: 20px !important; }
    }
  </style>
</head>
<body style="margin:0; padding:0; background-color:#f4f4f0; word-spacing:normal;">

  <div style="display:none; font-size:1px; line-height:1px; max-height:0px; max-width:0px; opacity:0; overflow:hidden; mso-hide:all; font-family:sans-serif;">
    ${vars.previewText || `I found a presale project I think you'll want to see \u2014 ${vars.projectName || "details inside"}`}&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;
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
                    <div style="font-family:'DM Sans', Helvetica, Arial, sans-serif; font-size:9px; font-weight:400; letter-spacing:2px; text-transform:uppercase; color:#C9A55A; margin-bottom:8px; mso-line-height-rule:exactly; line-height:1.4;">PRESALE PROPERTIES</div>
                    <div style="font-family:${font.display}; font-size:42px; font-weight:400; color:#ffffff; line-height:1; margin-bottom:10px; mso-line-height-rule:exactly;">${vars.projectName || "New Release"}</div>
                    <div style="font-family:${font.body}; font-size:13px; font-weight:300; color:#8aaa96; margin-bottom:14px; mso-line-height-rule:exactly; line-height:1.4;">Your Presale Specialist &nbsp;&middot;&nbsp; <a href="https://presaleproperties.com" style="color:#8aaa96; text-decoration:none;">presaleproperties.com</a></div>
                    <div style="width:44px; height:2px; background-color:#C9A55A; font-size:0; line-height:0;">&nbsp;</div>
                  </td>
                  ${(vars.neighborhood || vars.city) ? `
                  <td class="header-city" align="right" valign="top" style="padding-left:16px; white-space:nowrap;">
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

              

              <div class="hero-headline" style="font-family:${font.display}; font-size:48px; font-weight:400; color:#111111; line-height:1.05; margin-bottom:0; mso-line-height-rule:exactly;">${vars.projectName || "The Moment"}</div>
              ${vars.headline
                ? `<div class="hero-headline" style="font-family:${font.display}; font-size:48px; font-weight:300; font-style:italic; color:#C9A55A; line-height:1.05; margin-bottom:28px; mso-line-height-rule:exactly;">${vars.headline}.</div>`
                : `<div style="margin-bottom:28px;"></div>`
              }

              <div class="body-text" style="font-family:${font.body}; font-size:15px; font-weight:300; color:#444444; line-height:1.85; margin-bottom:20px; mso-line-height-rule:exactly;">
                Thank you for your interest in <strong style="font-weight:500; color:#111111;">${vars.projectName || "this project"}</strong>${vars.neighborhood ? ` in <strong style="font-weight:500; color:#111111;">${vars.neighborhood}</strong>` : ""}${vars.city ? `, ${vars.city}` : ""}. I've put together everything you need below — pricing${vars.deposit ? `, deposit to secure (${vars.deposit})` : ""}${vars.completion ? `, and estimated completion (${vars.completion})` : ""}. ${vars.startingPrice ? `Homes start from <strong style="font-weight:500;">${vars.startingPrice}</strong> + GST. ` : ""}Go through the details at your own pace, and give me a call when you're ready — I'm here to help.
              </div>
              <div class="body-text" style="font-family:${font.body}; font-size:15px; font-weight:600; color:#111111; line-height:1.6; margin-bottom:32px; mso-line-height-rule:exactly;">I work exclusively with buyers &mdash; not developers. My job is to get you the right information, the right floorplan, and make this process easy from start to finish.</div>

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

          ${incentiveLines ? `
          <!-- INCENTIVES -->
          <tr>
            <td class="mobile-pad" bgcolor="#0d1f18" style="padding:28px 40px; background-color:#0d1f18; border-top:1px solid #1a3028;">
              <div style="font-family:'DM Sans', Helvetica, Arial, sans-serif; font-size:9px; font-weight:400; letter-spacing:2px; text-transform:uppercase; color:#C9A55A; margin-bottom:8px; mso-line-height-rule:exactly; line-height:1.4;">INCENTIVES &amp; PROMOTIONS</div>
              <div style="font-family:'Cormorant Garamond', Georgia, serif; font-size:26px; font-weight:400; color:#ffffff; line-height:1.15; margin-bottom:6px; mso-line-height-rule:exactly;">Exclusive Offers for Early Buyers</div>
              <div style="width:44px; height:2px; background-color:#C9A55A; font-size:0; line-height:0; margin-bottom:20px;">&nbsp;</div>
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
                ${incentiveLines}
              </table>
            </td>
          </tr>` : ""}

          ${pricingCardHtml}

          <!-- BOOKING BANNER -->
          ${cta.bookConsult ? `
          <tr>
            <td class="booking-td" bgcolor="#C9A55A" style="padding:22px 40px; background-color:#C9A55A;">
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
                <tr>
                  <td class="booking-left" valign="middle">
                    <div style="font-family:'DM Sans', Helvetica, Arial, sans-serif; font-size:9px; font-weight:500; letter-spacing:2px; text-transform:uppercase; color:#4a2e00; margin-bottom:4px; mso-line-height-rule:exactly; line-height:1.4;">PRIVATE SHOWINGS AVAILABLE</div>
                    <div class="booking-title" style="font-family:'Cormorant Garamond', Georgia, 'Times New Roman', serif; font-size:26px; font-weight:400; color:#0d1f18; mso-line-height-rule:exactly; line-height:1.2;">Book Your Showing Today</div>
                  </td>
                  <td class="booking-right" align="right" valign="middle" style="padding-left:20px;">
                    <table class="booking-btn" role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
                      <tr>
                        <td bgcolor="#0d1f18" style="background-color:#0d1f18; padding:14px 22px; text-align:center;">
                          <!--[if !mso]><!-->
                          <a href="${whatsappHref}" target="_blank" style="font-family:'DM Sans', Arial, sans-serif; font-size:9px; font-weight:500; letter-spacing:3px; text-transform:uppercase; color:#ffffff; text-decoration:none; white-space:nowrap;">&#128197;&nbsp; BOOK NOW</a>
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
              <div class="body-text" style="font-family:${font.body}; font-size:15px; font-weight:300; color:#444444; line-height:1.85; mso-line-height-rule:exactly;">If you have questions or want to see what's still available, just give me a call. Happy to help.</div>
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
                  <td width="90" valign="middle" style="padding:18px 0 18px 24px; vertical-align:middle; line-height:0; font-size:0;">
                    <img src="${agent.photo_url}" alt="${agent.full_name}" width="64" height="64" border="0"
                         style="display:block; width:64px; height:64px; border-radius:50%; object-fit:cover; object-position:center top; border:2px solid #C9A55A; -ms-interpolation-mode:bicubic;" />
                  </td>` : ""}
                  <!-- Middle: info -->
                  <td valign="middle" style="padding:18px 12px 18px ${agent.photo_url ? "12px" : "24px"}; vertical-align:middle;">
                    <div style="font-family:${font.display}; font-size:19px; font-weight:400; color:#111111; line-height:1.15; mso-line-height-rule:exactly; margin-bottom:2px;">${agent.full_name}</div>
                    <div style="font-family:${font.body}; font-size:9px; font-weight:500; letter-spacing:2px; text-transform:uppercase; color:#C9A55A; mso-line-height-rule:exactly; line-height:1.5; margin-bottom:7px;">${agent.title}</div>
                    <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;">
                      ${agent.phone ? `<tr>
                        <td style="padding-bottom:3px; padding-right:6px; vertical-align:middle; font-size:10px; color:#888888; line-height:1;">&#128222;</td>
                        <td style="padding-bottom:3px; vertical-align:middle;"><a href="tel:${agent.phone.replace(/\D/g,"")}" style="font-family:${font.body}; font-size:11px; font-weight:400; color:#444444; text-decoration:none;">${agent.phone}</a></td>
                      </tr>` : ""}
                      ${agent.email ? `<tr>
                        <td style="padding-bottom:3px; padding-right:6px; vertical-align:middle; font-size:10px; color:#888888; line-height:1;">&#9993;</td>
                        <td style="padding-bottom:3px; vertical-align:middle;"><a href="mailto:${agent.email}" style="font-family:${font.body}; font-size:11px; font-weight:400; color:#444444; text-decoration:none;">${agent.email}</a></td>
                      </tr>` : ""}
                    </table>
                  </td>
                  <!-- Right: logo -->
                  <td class="sig-logo-td" align="right" valign="middle" style="padding:18px 24px 18px 12px; vertical-align:middle;">
                    <img src="${LOGO_EMAIL_URL}" alt="Presale Properties" width="120" border="0"
                         style="display:block; width:120px; max-width:120px; height:auto; -ms-interpolation-mode:bicubic;" />
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- FOOTER -->
          <tr>
            <td class="footer-td" bgcolor="#0d1f18" style="padding:22px 40px; background-color:#0d1f18;">
              <div style="font-family:'DM Sans', Arial, sans-serif; font-size:9px; font-weight:400; letter-spacing:2.5px; text-transform:uppercase; color:#C9A55A; margin-bottom:6px; mso-line-height-rule:exactly; line-height:1.5;">PRESALE PROPERTIES &nbsp;&middot;&nbsp; ${vars.city ? `${vars.city.toUpperCase()}, BC` : "VANCOUVER, BC"}</div>
              <div style="font-family:'DM Sans', Arial, sans-serif; font-size:12px; font-weight:300; color:#8aaa96; mso-line-height-rule:exactly; line-height:1.6;"><a href="https://presaleproperties.com" style="color:#8aaa96; text-decoration:none;">presaleproperties.com</a> &nbsp;&middot;&nbsp; ${agent.phone}</div>
            </td>
          </tr>

          <!-- LEGAL + UNSUBSCRIBE -->
          <tr>
            <td class="legal-td" bgcolor="#f8f7f4" style="padding:24px 40px 28px 40px; background-color:#f8f7f4; border-top:1px solid #e8e8e4;">
              <div style="font-family:'DM Sans', Arial, sans-serif; font-size:10px; font-weight:600; letter-spacing:2px; text-transform:uppercase; color:#555555; margin-bottom:12px; mso-line-height-rule:exactly; line-height:1.4;">L E G A L &nbsp; D I S C L A I M E R</div>
              <div style="font-family:'DM Sans', Arial, sans-serif; font-size:11px; font-weight:300; color:#888888; line-height:1.8; margin-bottom:12px; mso-line-height-rule:exactly;">
                This email was sent by ${agent.full_name}, a licensed REALTOR&reg; with Presale Properties. We act as buyer's agents &mdash; we represent <strong style="font-weight:500; color:#666666;">you</strong>, not the developer. This is <strong style="font-weight:500; color:#666666;">not an offering for sale</strong>. An offering can only be made after a Disclosure Statement is filed under REDMA. Prices, availability, and incentives are subject to change without notice. All prices exclude applicable taxes (GST/PST). PTT exemptions are subject to buyer eligibility at time of completion. Information believed accurate but not guaranteed. E.&amp;O.E. Presale Properties complies with the Real Estate Services Act (BCFSA).
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
  const [headlinePresetIdx, setHeadlinePresetIdx] = useState<number | null>(null);
  const [fontIdx, setFontIdx] = useState(0);
  const [promoNotes, setPromoNotes] = useState("");
  const [promoSnippet, setPromoSnippet] = useState("");
  const [rewritingPromo, setRewritingPromo] = useState(false);

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
    const projectUrl = `https://presaleproperties.com/presale/${p.slug}`;

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

  const handleRewritePromo = async () => {
    if (!promoNotes.trim()) return;
    setRewritingPromo(true);
    try {
      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/rewrite-promo`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({
            rawNotes: promoNotes,
            projectName: vars.projectName,
            city: vars.city,
          }),
        }
      );
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "AI rewrite failed");
        return;
      }
      setPromoSnippet(data.snippet || "");
    } catch (e) {
      toast.error("Failed to reach AI. Please try again.");
    } finally {
      setRewritingPromo(false);
    }
  };

  const appendPromoToHighlights = () => {
    if (!promoSnippet.trim()) return;
    setVars((prev) => ({
      ...prev,
      incentiveText: prev.incentiveText.trim()
        ? `${prev.incentiveText.trim()}\n${promoSnippet.trim()}`
        : promoSnippet.trim(),
    }));
    setPromoNotes("");
    setPromoSnippet("");
    toast.success("Incentive section updated!");
  };

  const v =
    (key: keyof TemplateVars) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setVars((prev) => ({ ...prev, [key]: e.target.value }));

  const [previewDevice, setPreviewDevice] = useState<"desktop" | "mobile">("desktop");
  const [ctaSectionOpen, setCtaSectionOpen] = useState(true);

  // ── Template save/load ───────────────────────────────────────────────────────
  const [savedTemplates, setSavedTemplates] = useState<SavedEmailTemplate[]>([]);
  const [templatesOpen, setTemplatesOpen] = useState(false);
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [templateName, setTemplateName] = useState("");
  const [savingTemplate, setSavingTemplate] = useState(false);

  const loadSavedTemplates = useCallback(async () => {
    const { data } = await supabase
      .from("campaign_templates")
      .select("id, name, project_name, form_data, created_at, updated_at")
      .order("updated_at", { ascending: false });
    if (data) setSavedTemplates(data as SavedEmailTemplate[]);
  }, []);

  useEffect(() => { loadSavedTemplates(); }, [loadSavedTemplates]);

  const handleSaveTemplate = async () => {
    if (!templateName.trim()) { toast.error("Please enter a template name."); return; }
    setSavingTemplate(true);
    try {
      const form_data = {
        vars,
        cta,
        fontIdx,
        agentId: selectedAgent?.id,
      };
      const { error } = await supabase.from("campaign_templates").insert([{
        name: templateName.trim(),
        project_name: vars.projectName || "Untitled",
        form_data: form_data as unknown as import("@/integrations/supabase/types").Json,
      }]);
      if (error) throw error;
      toast.success("Template saved!");
      setSaveDialogOpen(false);
      setTemplateName("");
      loadSavedTemplates();
    } catch (e) {
      toast.error("Failed to save template.");
    } finally {
      setSavingTemplate(false);
    }
  };

  const handleLoadTemplate = (tpl: SavedEmailTemplate) => {
    const fd = tpl.form_data;
    if (fd.vars) setVars({ ...EMPTY_VARS, ...fd.vars } as TemplateVars);
    if (fd.cta) setCta({ ...DEFAULT_CTA, ...fd.cta } as CtaToggles);
    if (typeof fd.fontIdx === "number") setFontIdx(fd.fontIdx);
    if (fd.agentId) {
      const a = agents.find((ag) => ag.id === fd.agentId);
      if (a) setSelectedAgent(a);
    }
    setUseCustomHtml(false);
    setTemplatesOpen(false);
    toast.success(`Loaded: ${tpl.name}`);
  };

  const handleDeleteTemplate = async (id: string) => {
    await supabase.from("campaign_templates").delete().eq("id", id);
    loadSavedTemplates();
    toast.success("Template deleted.");
  };

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

          {/* LOAD TEMPLATES */}
          <Dialog open={templatesOpen} onOpenChange={setTemplatesOpen}>
            <DialogTrigger asChild>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="outline" size="sm" className="gap-1.5 h-9 px-3">
                    <FolderOpen className="h-3.5 w-3.5" />
                    <span className="hidden sm:inline">Templates</span>
                    {savedTemplates.length > 0 && (
                      <Badge className="h-4 min-w-4 px-1 text-[10px] rounded-full">{savedTemplates.length}</Badge>
                    )}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Load a saved template</TooltipContent>
              </Tooltip>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <BookMarked className="h-4 w-4 text-primary" />
                  Saved Email Templates
                </DialogTitle>
              </DialogHeader>
              {savedTemplates.length === 0 ? (
                <div className="py-8 text-center text-sm text-muted-foreground">
                  No saved templates yet. Build an email and click <strong>Save Template</strong>.
                </div>
              ) : (
                <div className="space-y-2 max-h-[400px] overflow-y-auto pr-1">
                  {savedTemplates.map((tpl) => (
                    <div key={tpl.id} className="flex items-center justify-between gap-3 rounded-lg border border-border bg-muted/20 px-3 py-2.5 hover:border-primary/30 transition-colors">
                      <div className="min-w-0">
                        <div className="text-sm font-semibold text-foreground truncate">{tpl.name}</div>
                        <div className="text-xs text-muted-foreground truncate">{tpl.project_name} · {new Date(tpl.updated_at).toLocaleDateString()}</div>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <Button size="sm" variant="outline" className="h-7 px-2.5 text-xs gap-1" onClick={() => handleLoadTemplate(tpl)}>
                          <FolderOpen className="h-3 w-3" /> Load
                        </Button>
                        <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-destructive hover:text-destructive hover:bg-destructive/10" onClick={() => handleDeleteTemplate(tpl.id)}>
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </DialogContent>
          </Dialog>

          {/* SAVE TEMPLATE */}
          <Dialog open={saveDialogOpen} onOpenChange={setSaveDialogOpen}>
            <DialogTrigger asChild>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="outline" size="sm" className="gap-1.5 h-9 px-3">
                    <Save className="h-3.5 w-3.5" />
                    <span className="hidden sm:inline">Save</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Save current state as a template</TooltipContent>
              </Tooltip>
            </DialogTrigger>
            <DialogContent className="max-w-sm">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <BookMarked className="h-4 w-4 text-primary" />
                  Save Email Template
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-3">
                <div>
                  <Label className="text-sm">Template Name</Label>
                  <Input
                    value={templateName}
                    onChange={(e) => setTemplateName(e.target.value)}
                    className="mt-1"
                    placeholder={`${vars.projectName || "My Email"} — Thank You`}
                    onKeyDown={(e) => e.key === "Enter" && handleSaveTemplate()}
                    autoFocus
                  />
                </div>
                <p className="text-xs text-muted-foreground">Saves all content, CTAs, font, and agent. You can load it later from Templates.</p>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setSaveDialogOpen(false)}>Cancel</Button>
                  <Button onClick={handleSaveTemplate} disabled={savingTemplate} className="gap-1.5">
                    {savingTemplate ? "Saving…" : <><Save className="h-3.5 w-3.5" /> Save Template</>}
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
      <div className="mb-3 rounded-lg border border-border bg-card overflow-hidden shrink-0">
        <div className="flex items-center gap-2 px-3 py-2 bg-muted/30 border-b border-border">
          <div className="flex items-center gap-1 shrink-0">
            <div className="h-2.5 w-2.5 rounded-full bg-red-400/80" />
            <div className="h-2.5 w-2.5 rounded-full bg-amber-400/80" />
            <div className="h-2.5 w-2.5 rounded-full bg-green-400/80" />
          </div>
          <Separator orientation="vertical" className="h-4 mx-1" />
          <div className="flex items-center gap-1 flex-1 min-w-0">
            <div className="flex items-center gap-1.5 shrink-0 bg-muted/50 rounded px-2 py-0.5">
              <div className="w-3 h-3 rounded-full bg-primary/40 shrink-0" />
              <span className="text-[10px] font-medium text-foreground">PresaleProperties</span>
            </div>
            <span className="text-muted-foreground/40 shrink-0 text-xs">›</span>
            <span className={cn("text-xs truncate flex-1 min-w-0", vars.subjectLine ? "font-medium text-foreground" : "italic text-muted-foreground")}>
              {vars.subjectLine || "Your subject line will appear here…"}
            </span>
            {vars.previewText && (
              <span className="text-muted-foreground text-[11px] truncate hidden lg:block shrink-0 max-w-[240px]">
                — {vars.previewText}
              </span>
            )}
          </div>
          <Badge variant="outline" className="shrink-0 text-[9px] py-0 h-4 px-1.5 text-muted-foreground/60">Gmail</Badge>
        </div>
      </div>

      {/* MAIN 2-PANEL LAYOUT */}
      <div className="grid grid-cols-[1fr_360px] gap-3 h-[calc(100vh-220px)] min-h-[600px]">

        {/* LEFT: Email preview */}
        <div className="flex flex-col rounded-xl border border-border bg-card overflow-hidden shadow-sm">
          <div className="flex items-center justify-between px-3 py-2 border-b border-border bg-muted/10 shrink-0">
            {/* Preview/Code toggle */}
            <div className="flex items-center gap-0.5 bg-muted/50 rounded-lg p-0.5">
              <Button
                variant="ghost" size="sm"
                className={cn("h-6 px-2.5 text-[11px] gap-1.5 rounded-md transition-all font-medium", previewMode === "preview" && "bg-card shadow-sm text-foreground")}
                onClick={() => setPreviewMode("preview")}
              >
                <Eye className="h-3 w-3" /> Preview
              </Button>
              <Button
                variant="ghost" size="sm"
                className={cn("h-6 px-2.5 text-[11px] gap-1.5 rounded-md transition-all font-medium", previewMode === "code" && "bg-card shadow-sm text-foreground")}
                onClick={() => setPreviewMode("code")}
              >
                <Code2 className="h-3 w-3" /> HTML
              </Button>
            </div>

            {/* Device toggle */}
            {previewMode === "preview" && (
              <div className="flex items-center gap-0.5 bg-muted/50 rounded-lg p-0.5">
                <Button variant="ghost" size="sm"
                  className={cn("h-6 w-7 p-0 rounded-md transition-all", previewDevice === "desktop" && "bg-card shadow-sm text-foreground")}
                  onClick={() => setPreviewDevice("desktop")}
                ><Monitor className="h-3 w-3" /></Button>
                <Button variant="ghost" size="sm"
                  className={cn("h-6 w-7 p-0 rounded-md transition-all", previewDevice === "mobile" && "bg-card shadow-sm text-foreground")}
                  onClick={() => setPreviewDevice("mobile")}
                ><Smartphone className="h-3 w-3" /></Button>
              </div>
            )}

            <div className="flex items-center gap-2">
              <span className="text-[10px] text-muted-foreground/50 hidden lg:block">
                {previewMode === "code" ? `${Math.round(finalHtml.length / 1024)}KB` : previewDevice === "desktop" ? "600px" : "375px"}
              </span>
              {previewMode === "code" && (
                <Button variant="ghost" size="sm" className="h-6 px-2 text-[11px] gap-1" onClick={handleCopy}>
                  <Copy className="h-3 w-3" /> {copied ? "Copied!" : "Copy"}
                </Button>
              )}
            </div>
          </div>

          {previewMode === "preview" ? (
            <div className={cn(
              "flex-1 overflow-auto",
              previewDevice === "mobile" ? "bg-[#e8e5e0] flex justify-center" : "bg-[#e8e5e0]"
            )}>
              <iframe
                ref={iframeRef}
                srcDoc={finalHtml}
                className="border-0 h-full"
                style={previewDevice === "mobile" ? {
                  width: "375px",
                  minHeight: "100%",
                } : { width: "100%" }}
                sandbox="allow-same-origin"
                title="Email Preview"
              />
            </div>
          ) : (
            <div className="flex-1 overflow-auto" style={{ background: "#0d1117" }}>
              <div className="sticky top-0 px-4 py-2 flex items-center justify-between border-b border-white/5" style={{ background: "#161b22" }}>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono text-emerald-400">email.html</span>
                  <Badge className="text-[9px] h-4 px-1.5 bg-emerald-500/10 text-emerald-400 border-emerald-500/20">Mailchimp-ready</Badge>
                </div>
                <span className="text-[10px] text-white/30">{finalHtml.length.toLocaleString()} chars</span>
              </div>
              <pre className="p-4 text-[11px] font-mono whitespace-pre-wrap break-all leading-relaxed" style={{ color: "#e6edf3" }}>
                {finalHtml}
              </pre>
            </div>
          )}
        </div>

        {/* RIGHT: Editor panel */}
        <div className="flex flex-col rounded-xl border border-border bg-card overflow-hidden shadow-sm">
          {/* Panel header */}
          <div className="px-4 pt-3 pb-2.5 border-b border-border bg-gradient-to-r from-muted/30 to-transparent shrink-0">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="h-5 w-5 rounded bg-primary/10 flex items-center justify-center">
                  <Sparkles className="h-3 w-3 text-primary" />
                </div>
                <span className="text-sm font-semibold text-foreground">Email Editor</span>
              </div>
              {useCustomHtml ? (
                <Button variant="ghost" size="sm" className="h-6 text-[11px] px-2 text-amber-500 hover:text-amber-600" onClick={() => setUseCustomHtml(false)}>
                  ← Back to template
                </Button>
              ) : vars.projectName ? (
                <span className="text-[10px] text-muted-foreground truncate max-w-[120px]">{vars.projectName}</span>
              ) : null}
            </div>
          </div>

          <Tabs defaultValue="content" className="flex flex-col flex-1 overflow-hidden">
            <div className="px-3 pt-2.5 pb-1.5 shrink-0 border-b border-border bg-muted/5">
              <TabsList className="w-full h-8 text-xs grid grid-cols-3 p-0.5">
                <TabsTrigger value="content" className="text-xs gap-1 h-7 rounded-md">
                  <Sparkles className="h-3 w-3" /> Content
                </TabsTrigger>
                <TabsTrigger value="project" className="text-xs gap-1 h-7 rounded-md">
                  <Building2 className="h-3 w-3" /> Project
                </TabsTrigger>
                <TabsTrigger value="urls" className="text-xs gap-1 h-7 rounded-md">
                  <Link2 className="h-3 w-3" /> URLs
                </TabsTrigger>
              </TabsList>
            </div>

            <div className={cn("flex-1 overflow-y-auto scrollbar-thin", useCustomHtml && "opacity-40 pointer-events-none select-none")}>

              {/* CONTENT TAB */}
              <TabsContent value="content" className="mt-0 pb-4 space-y-0">

                {/* SECTION: Agent / Sender */}
                <div className="px-4 pt-4 pb-3 border-b border-border/60">
                  <div className="flex items-center gap-1.5 mb-3">
                    <div className="h-1 w-1 rounded-full bg-primary" />
                    <span className="text-[10px] font-bold text-foreground uppercase tracking-widest">Sender</span>
                  </div>
                  <div className="flex gap-1.5 flex-wrap mb-2">
                    {agents.map((a) => (
                      <button
                        key={a.id}
                        onClick={() => setSelectedAgent({ ...a })}
                        className={cn(
                          "flex items-center gap-2 px-2 py-1.5 rounded-lg border text-left transition-all",
                          selectedAgent?.id === a.id
                            ? "border-primary bg-primary/8 shadow-sm"
                            : "border-border bg-muted/20 hover:border-primary/40 hover:bg-muted/40"
                        )}
                      >
                        {a.photo_url ? (
                          <img src={a.photo_url} alt={a.full_name} className="w-7 h-7 rounded-full object-cover object-top border border-border shrink-0" />
                        ) : (
                          <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center text-[10px] font-bold text-primary shrink-0">
                            {a.full_name.charAt(0)}
                          </div>
                        )}
                        <div className="min-w-0">
                          <div className="text-[11px] font-semibold text-foreground">{a.full_name.split(" ")[0]}</div>
                          <div className="text-[9px] text-muted-foreground leading-tight">{a.title.split(" ").slice(0,2).join(" ")}</div>
                        </div>
                        {selectedAgent?.id === a.id && <CheckCircle2 className="h-3 w-3 text-primary shrink-0" />}
                      </button>
                    ))}
                  </div>
                  {selectedAgent && (
                    <div className="grid grid-cols-2 gap-1.5">
                      <div>
                        <Label className="text-[9px] text-muted-foreground uppercase tracking-wide">Phone</Label>
                        <Input value={selectedAgent.phone} onChange={(e) => setSelectedAgent({ ...selectedAgent, phone: e.target.value })}
                          className="h-7 text-xs mt-0.5" placeholder="778-000-0000" />
                      </div>
                      <div>
                        <Label className="text-[9px] text-muted-foreground uppercase tracking-wide">Email</Label>
                        <Input value={selectedAgent.email} onChange={(e) => setSelectedAgent({ ...selectedAgent, email: e.target.value })}
                          className="h-7 text-xs mt-0.5" placeholder="name@…" />
                      </div>
                    </div>
                  )}
                </div>

                {/* SECTION: Typography */}
                <div className="px-4 pt-3.5 pb-3 border-b border-border/60">
                  <div className="flex items-center gap-1.5 mb-2.5">
                    <div className="h-1 w-1 rounded-full bg-primary" />
                    <span className="text-[10px] font-bold text-foreground uppercase tracking-widest">Typography</span>
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
                            : "border-border bg-muted/10 hover:border-primary/30"
                        )}
                      >
                        <div className="text-[11px] font-semibold text-foreground leading-tight truncate">{fp.label.split(" + ")[0]}</div>
                        <div className="text-[9px] text-muted-foreground/70 truncate">+ {fp.label.split(" + ")[1]}</div>
                        <div className={cn("text-[9px] mt-0.5 font-medium", fontIdx === i ? "text-primary" : "text-muted-foreground/50")}>{fp.tag}</div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* SECTION: Inbox */}
                <div className="px-4 pt-3.5 pb-3 border-b border-border/60">
                  <div className="flex items-center gap-1.5 mb-2.5">
                    <div className="h-1 w-1 rounded-full bg-primary" />
                    <span className="text-[10px] font-bold text-foreground uppercase tracking-widest">Inbox</span>
                  </div>
                  <div className="space-y-2">
                    <div>
                      <Label className="text-[10px] text-muted-foreground">Subject Line</Label>
                      <Input value={vars.subjectLine} onChange={v("subjectLine")} className="h-8 text-xs mt-0.5" placeholder="🏙️ Exclusive Access: Project — City" />
                    </div>
                    <div>
                      <Label className="text-[10px] text-muted-foreground">Preview Text <span className="text-muted-foreground/40 font-normal">(shown in inbox)</span></Label>
                      <Input value={vars.previewText} onChange={v("previewText")} className="h-8 text-xs mt-0.5" placeholder="From $599K · Surrey · Limited units" />
                    </div>
                  </div>
                </div>

                {/* SECTION: Email Body */}
                <div className="px-4 pt-3.5 pb-3 border-b border-border/60">
                  <div className="flex items-center gap-1.5 mb-2.5">
                    <div className="h-1 w-1 rounded-full bg-primary" />
                    <span className="text-[10px] font-bold text-foreground uppercase tracking-widest">Email Body</span>
                  </div>
                  <div className="space-y-2 mb-3">
                    {HEADLINE_PRESETS.map((preset, i) => (
                      <button
                        key={i}
                        onClick={() => {
                          setHeadlinePresetIdx(i);
                          setVars((prev) => ({ ...prev, headline: preset.headline, bodyCopy: prev.bodyCopy || preset.body }));
                        }}
                        className={cn(
                          "w-full text-left rounded-lg border px-3 py-2 transition-all",
                          headlinePresetIdx === i
                            ? "border-primary bg-primary/5 shadow-sm"
                            : "border-border/60 bg-muted/10 hover:border-primary/30"
                        )}
                      >
                        <div className="flex items-center justify-between">
                          <div className="text-[11px] font-semibold text-foreground">{preset.label}</div>
                          {headlinePresetIdx === i && <CheckCircle2 className="h-3 w-3 text-primary shrink-0" />}
                        </div>
                        <div className="text-[10px] text-muted-foreground italic mt-0.5 line-clamp-1">"{preset.headline}"</div>
                      </button>
                    ))}
                  </div>
                  <div className="space-y-2">
                    <div>
                      <Label className="text-[10px] text-muted-foreground">Subheadline <span className="text-muted-foreground/40">(italic gold)</span></Label>
                      <Input value={vars.headline} onChange={v("headline")} className="h-8 text-xs mt-0.5" placeholder="Thank You for Your Interest" />
                    </div>
                    <div>
                      <Label className="text-[10px] text-muted-foreground">Highlights <span className="text-muted-foreground/40">(one per line → gold bullets)</span></Label>
                      <Textarea
                        value={vars.bodyCopy}
                        onChange={v("bodyCopy")}
                        className="text-xs mt-0.5 min-h-[100px] resize-none leading-relaxed"
                        placeholder={"Park-facing homes\nPTT Exemption eligible\nCo-op commission available"}
                      />
                    </div>
                  </div>
                </div>

                {/* SECTION: AI Promo Snippet */}
                <div className="px-4 pt-3.5 pb-4 border-b border-border/60 bg-muted/30">
                  <div className="flex items-center gap-1.5 mb-2.5">
                    <div className="h-1 w-1 rounded-full bg-primary" />
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">AI Promo Snippet</span>
                  </div>
                  <p className="text-[10px] text-muted-foreground mb-2 leading-relaxed">
                    Paste raw notes about a new release, promo, or special offer — AI will rewrite it into polished bullet lines.
                  </p>
                  <Textarea
                    value={promoNotes}
                    onChange={(e) => setPromoNotes(e.target.value)}
                    className="text-xs min-h-[72px] resize-none leading-relaxed mb-2"
                    placeholder={"e.g. New phase just released, limited 2bds left, PTT exempt, free storage locker promotion ends Friday"}
                  />
                  <Button
                    size="sm"
                    variant="outline"
                    className="w-full h-8 text-xs gap-1.5 border-primary/40 text-primary hover:bg-primary/5"
                    onClick={handleRewritePromo}
                    disabled={rewritingPromo || !promoNotes.trim()}
                  >
                    {rewritingPromo
                      ? <><Loader2 className="h-3 w-3 animate-spin" /> Rewriting…</>
                      : <><Wand2 className="h-3 w-3" /> Rewrite with AI</>
                    }
                  </Button>

                  {promoSnippet && (
                    <div className="mt-3 rounded-md border border-primary/20 bg-primary/5 p-3 space-y-2">
                      <p className="text-[10px] font-medium text-primary uppercase tracking-wider">AI Result</p>
                      <p className="text-xs text-foreground leading-relaxed whitespace-pre-line">{promoSnippet}</p>
                      <div className="flex gap-1.5 pt-1">
                        <Button
                          size="sm"
                          className="h-7 text-xs flex-1 gap-1"
                          onClick={appendPromoToHighlights}
                         >
                           <PlusCircle className="h-3 w-3" /> Add to Incentives
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 text-xs px-2"
                          onClick={() => { setPromoSnippet(""); setPromoNotes(""); }}
                        >
                          Clear
                        </Button>
                      </div>
                    </div>
                  )}
                  <div className="mt-3">
                    <Label className="text-[10px] text-muted-foreground">Incentives section <span className="text-muted-foreground/40">(one per line → green bullets)</span></Label>
                    <Textarea
                      value={vars.incentiveText}
                      onChange={v("incentiveText")}
                      className="text-xs mt-0.5 min-h-[80px] resize-none leading-relaxed"
                      placeholder={"PTT exemption available\nFree storage locker — limited units\nExtended deposit structure"}
                    />
                  </div>
                </div>

                {/* SECTION: Key Stats */}
                <div className="px-4 pt-3.5 pb-3 border-b border-border/60">
                  <div className="flex items-center gap-1.5 mb-2.5">
                    <div className="h-1 w-1 rounded-full bg-primary" />
                    <span className="text-[10px] font-bold text-foreground uppercase tracking-widest">Key Stats</span>
                  </div>
                  <div className="grid grid-cols-3 gap-1.5">
                    {[
                      { key: "startingPrice" as keyof TemplateVars, label: "Starting Price", hint: "+ GST", placeholder: "$789,900" },
                      { key: "deposit" as keyof TemplateVars, label: "Deposit", hint: "to secure", placeholder: "5% on signing" },
                      { key: "completion" as keyof TemplateVars, label: "Completion", hint: "est. date", placeholder: "Summer 2026" },
                    ].map(({ key, label, hint, placeholder }) => (
                      <div key={key} className={cn("rounded-lg border p-2 transition-all", vars[key] ? "border-primary/30 bg-primary/3" : "border-border bg-muted/10")}>
                        <Label className="text-[9px] text-muted-foreground uppercase tracking-wide block mb-1">{label}</Label>
                        <Input value={vars[key]} onChange={v(key)} className="h-7 text-xs border-0 bg-transparent p-0 focus-visible:ring-0 font-medium" placeholder={placeholder} />
                        <p className="text-[9px] text-muted-foreground/40 mt-0.5">{hint}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* SECTION: CTA Buttons */}
                <div className="px-4 pt-3.5 pb-3">
                  <button
                    className="flex items-center justify-between w-full mb-2.5"
                    onClick={() => setCtaSectionOpen(!ctaSectionOpen)}
                  >
                    <div className="flex items-center gap-1.5">
                      <div className="h-1 w-1 rounded-full bg-primary" />
                      <span className="text-[10px] font-bold text-foreground uppercase tracking-widest">CTA Buttons</span>
                    </div>
                    {ctaSectionOpen
                      ? <ChevronUp className="h-3.5 w-3.5 text-muted-foreground/40" />
                      : <ChevronDown className="h-3.5 w-3.5 text-muted-foreground/40" />
                    }
                  </button>
                  {ctaSectionOpen && (
                    <div className="space-y-1">
                      {(
                        [
                          { key: "floorplan" as keyof CtaToggles, label: "Floor Plans & Pricing", url: vars.floorplanUrl, style: "primary" },
                          { key: "brochure" as keyof CtaToggles, label: "Download Brochure", url: vars.brochureUrl, style: "primary" },
                          { key: "pricing" as keyof CtaToggles, label: "Request Pricing", url: vars.pricingUrl, style: "secondary" },
                          { key: "viewProject" as keyof CtaToggles, label: "View Full Project", url: vars.projectUrl, style: "secondary" },
                          { key: "bookConsult" as keyof CtaToggles, label: "Book a Private Tour", url: vars.bookUrl, style: "secondary" },
                        ]
                      ).map(({ key, label, url, style }) => (
                        <div key={key} className={cn(
                          "flex items-center justify-between gap-2 rounded-lg px-2.5 py-2 border transition-all",
                          cta[key] && url ? "border-border bg-card" : "border-border/40 bg-muted/10 opacity-60"
                        )}>
                          <div className="flex items-center gap-2 min-w-0">
                            <Switch
                              checked={cta[key]}
                              onCheckedChange={(val) => setCta((prev) => ({ ...prev, [key]: val }))}
                              disabled={!url}
                              className="scale-[0.7] origin-left"
                            />
                            <div className="min-w-0">
                              <span className="text-[11px] font-medium text-foreground truncate block">{label}</span>
                              <span className={cn("text-[9px] font-semibold uppercase tracking-wide", style === "primary" ? "text-primary" : "text-muted-foreground/50")}>{style}</span>
                            </div>
                          </div>
                          {!url ? (
                            <span className="text-[9px] text-muted-foreground/30 shrink-0 border border-dashed border-muted-foreground/20 rounded px-1">no url</span>
                          ) : (
                            <div className={cn("h-1.5 w-1.5 rounded-full shrink-0", cta[key] ? "bg-emerald-500" : "bg-muted-foreground/20")} />
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </TabsContent>

              {/* PROJECT TAB */}
              <TabsContent value="project" className="mt-0 px-4 pb-4 pt-3 space-y-2">
                {selectedProject?.featured_image && (
                  <div className="rounded-lg overflow-hidden border border-border mb-3">
                    <img src={selectedProject.featured_image} alt={selectedProject.name} className="w-full h-24 object-cover" />
                    <div className="px-2.5 py-1 bg-muted/30 border-t border-border">
                      <p className="text-[9px] text-muted-foreground uppercase tracking-wide">Hero image · auto-filled</p>
                    </div>
                  </div>
                )}
                <div className="space-y-1.5">
                  {(
                    [
                      { key: "projectName" as keyof TemplateVars, label: "Project Name" },
                      { key: "developerName" as keyof TemplateVars, label: "Developer" },
                      { key: "address" as keyof TemplateVars, label: "Address" },
                      { key: "city" as keyof TemplateVars, label: "City" },
                      { key: "neighborhood" as keyof TemplateVars, label: "Neighborhood" },
                      { key: "completion" as keyof TemplateVars, label: "Est. Completion" },
                      { key: "startingPrice" as keyof TemplateVars, label: "Starting Price" },
                      { key: "deposit" as keyof TemplateVars, label: "Deposit to Secure" },
                    ]
                  ).map(({ key, label }) => (
                    <div key={key}>
                      <Label className="text-[10px] text-muted-foreground">{label}</Label>
                      <Input value={vars[key]} onChange={v(key)} className="h-7 text-xs mt-0.5" />
                    </div>
                  ))}
                </div>
              </TabsContent>

              {/* URLS TAB */}
              <TabsContent value="urls" className="mt-0 px-4 pb-4 pt-3 space-y-1.5">
                <p className="text-[10px] text-muted-foreground mb-2">Auto-filled from project. Override any field below.</p>
                {(
                  [
                    { key: "featuredImage" as keyof TemplateVars, label: "Hero Image", icon: "🖼️" },
                    { key: "brochureUrl" as keyof TemplateVars, label: "Brochure PDF", icon: "📄" },
                    { key: "floorplanUrl" as keyof TemplateVars, label: "Floor Plan PDF", icon: "📐" },
                    { key: "pricingUrl" as keyof TemplateVars, label: "Pricing Sheet", icon: "💰" },
                    { key: "projectUrl" as keyof TemplateVars, label: "Project Page", icon: "🔗" },
                    { key: "bookUrl" as keyof TemplateVars, label: "Booking / Tour", icon: "📅" },
                  ]
                ).map(({ key, label, icon }) => (
                  <div key={key}>
                    <Label className="text-[10px] text-muted-foreground flex items-center gap-1">{icon} {label}</Label>
                    <div className="relative mt-0.5">
                      <Input
                        value={vars[key]}
                        onChange={v(key)}
                        className={cn("h-7 text-[11px] font-mono pr-7", vars[key] && "border-emerald-500/40 bg-emerald-500/5 text-emerald-700 dark:text-emerald-400")}
                        placeholder="https://"
                      />
                      {vars[key] && <CheckCircle2 className="absolute right-2 top-1/2 -translate-y-1/2 h-3 w-3 text-emerald-500" />}
                    </div>
                  </div>
                ))}
              </TabsContent>
            </div>
          </Tabs>

          {/* Bottom action bar */}
          <div className="px-3 pb-3 pt-2.5 border-t border-border shrink-0 bg-muted/5">
            <Button
              className={cn(
                "w-full h-9 gap-2 font-semibold text-sm transition-all duration-200",
                copied ? "bg-emerald-600 hover:bg-emerald-600 text-white" : "bg-primary text-primary-foreground hover:bg-primary/90"
              )}
              onClick={handleCopy}
            >
              {copied ? (
                <><CheckCircle2 className="h-3.5 w-3.5" /> Copied! Paste into Mailchimp</>
              ) : (
                <><Copy className="h-3.5 w-3.5" /> Copy HTML</>
              )}
            </Button>
            <p className="text-[9px] text-muted-foreground/40 text-center mt-1.5 uppercase tracking-wide">Inline CSS · Mailchimp-ready</p>
          </div>
        </div>

      </div>
    </AdminLayout>
    </TooltipProvider>
  );
}