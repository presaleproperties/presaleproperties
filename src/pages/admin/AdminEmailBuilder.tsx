import { useState, useEffect, useRef, useCallback } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
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
  const locationLine = [vars.neighborhood, vars.city].filter(Boolean).join(" · ").toUpperCase();

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

  return (
    <AdminLayout>
      {/* ── Page header ── */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-2xl font-bold text-foreground tracking-tight">Email Builder</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Design property emails · Export HTML for Mailchimp
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Dialog open={importOpen} onOpenChange={setImportOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2 h-9">
                <Upload className="h-3.5 w-3.5" />
                Import HTML
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Import Custom HTML</DialogTitle>
              </DialogHeader>
              <p className="text-sm text-muted-foreground mb-3">
                Paste HTML from Claude or any source. Quick-edit panel will be disabled for custom HTML.
              </p>
              <Textarea
                value={importHtml}
                onChange={(e) => setImportHtml(e.target.value)}
                placeholder="Paste your HTML email code here..."
                className="font-mono text-xs min-h-[300px]"
              />
              <div className="flex justify-end gap-2 mt-2">
                <Button variant="outline" onClick={() => setImportOpen(false)}>Cancel</Button>
                <Button onClick={handleImport}>Use This HTML</Button>
              </div>
            </DialogContent>
          </Dialog>

          <Button variant="outline" size="sm" className="gap-2 h-9" onClick={handleReset}>
            <RefreshCw className="h-3.5 w-3.5" />
            Reset
          </Button>

          <Button
            size="sm"
            className={cn(
              "gap-2 h-9 font-semibold transition-colors",
              copied && "bg-emerald-600 hover:bg-emerald-600 text-white"
            )}
            onClick={handleCopy}
          >
            {copied ? (
              <><CheckCircle2 className="h-3.5 w-3.5" /> Copied!</>
            ) : (
              <><Copy className="h-3.5 w-3.5" /> Copy HTML</>
            )}
          </Button>
        </div>
      </div>

      {/* ── Subject line inbox preview bar ── */}
      <div className="mb-4 rounded-lg border border-border bg-muted/40 px-4 py-2.5 flex items-center gap-3">
        <Mail className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
        <div className="flex items-center gap-1.5 min-w-0 flex-1 text-sm truncate">
          <span className="font-semibold text-foreground shrink-0">PresaleProperties</span>
          <span className="text-muted-foreground/40 shrink-0">·</span>
          <span className="font-medium text-foreground truncate">
            {vars.subjectLine || "Email subject will appear here"}
          </span>
          <span className="text-muted-foreground/40 shrink-0 hidden sm:inline">—</span>
          <span className="text-muted-foreground truncate hidden sm:inline">
            {vars.previewText || "Preview text will appear here"}
          </span>
        </div>
        <Badge variant="outline" className="shrink-0 text-[10px] hidden sm:flex">
          Inbox Preview
        </Badge>
      </div>

      {/* ── 3-panel layout ── */}
      <div className="grid grid-cols-[240px_1fr_280px] gap-4 h-[calc(100vh-260px)] min-h-[580px]">

        {/* LEFT: Project selector + template + CTA toggles */}
        <div className="flex flex-col gap-3 overflow-y-auto pr-0.5">

          {/* Project */}
          <div className="rounded-lg border border-border bg-card p-4">
            <div className="flex items-center gap-2 mb-3">
              <Building2 className="h-4 w-4 text-primary" />
              <h3 className="text-sm font-semibold text-foreground">Select Project</h3>
            </div>
            <Select value={selectedProjectId} onValueChange={setSelectedProjectId} disabled={loadingProjects}>
              <SelectTrigger className="h-9 text-sm">
                <SelectValue placeholder={loadingProjects ? "Loading…" : "Choose a project"} />
              </SelectTrigger>
              <SelectContent>
                {projects.map((p) => (
                  <SelectItem key={p.id} value={p.id} className="text-sm">
                    {p.name}
                    <span className="text-muted-foreground ml-1 text-xs">· {p.city}</span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {selectedProject && (
              <div className="mt-3 space-y-2">
                {selectedProject.featured_image && (
                  <img
                    src={selectedProject.featured_image}
                    alt={selectedProject.name}
                    className="w-full h-20 object-cover rounded-md"
                  />
                )}
                <div className="flex flex-wrap gap-1">
                  {selectedProject.brochure_files?.[0] && (
                    <Badge variant="secondary" className="text-[10px]">Brochure ✓</Badge>
                  )}
                  {selectedProject.floorplan_files?.[0] && (
                    <Badge variant="secondary" className="text-[10px]">Floor Plans ✓</Badge>
                  )}
                  {selectedProject.pricing_sheets?.[0] && (
                    <Badge variant="secondary" className="text-[10px]">Pricing ✓</Badge>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Template */}
          <div className="rounded-lg border border-border bg-card p-4">
            <h3 className="text-sm font-semibold text-foreground mb-2">Template</h3>
            <div className="rounded-md border-2 border-primary bg-primary/5 p-3">
              <p className="text-xs font-semibold text-foreground">Branded Property Email</p>
              <p className="text-[11px] text-muted-foreground mt-0.5">Dark header · Gold accents · CTA buttons</p>
            </div>
            {useCustomHtml && (
              <div className="mt-2 rounded-md border border-amber-500/30 bg-amber-500/5 p-3">
                <p className="text-xs font-semibold text-amber-600 dark:text-amber-400">Custom HTML Active</p>
                <Button
                  variant="ghost"
                  size="sm"
                  className="mt-1 h-6 text-[11px] px-2 w-full"
                  onClick={() => setUseCustomHtml(false)}
                >
                  Switch back to template
                </Button>
              </div>
            )}
          </div>

          {/* CTA toggles */}
          <div className="rounded-lg border border-border bg-card p-4">
            <h3 className="text-sm font-semibold text-foreground mb-3">CTA Buttons</h3>
            <div className="space-y-2.5">
              {(
                [
                  { key: "brochure" as keyof CtaToggles, label: "Download Brochure", url: vars.brochureUrl },
                  { key: "floorplan" as keyof CtaToggles, label: "View Floor Plans", url: vars.floorplanUrl },
                  { key: "pricing" as keyof CtaToggles, label: "Request Pricing", url: vars.pricingUrl },
                  { key: "viewProject" as keyof CtaToggles, label: "View Full Project", url: vars.projectUrl },
                  { key: "bookConsult" as keyof CtaToggles, label: "Book Consultation", url: vars.bookUrl },
                ]
              ).map(({ key, label, url }) => (
                <div key={key} className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <Switch
                      checked={cta[key]}
                      onCheckedChange={(val) => setCta((prev) => ({ ...prev, [key]: val }))}
                      disabled={useCustomHtml || !url}
                    />
                    <span className={cn("text-xs truncate", !url && "text-muted-foreground/40")}>
                      {label}
                    </span>
                  </div>
                  {!url && <span className="text-[10px] text-muted-foreground/30 shrink-0">no URL</span>}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* CENTER: Live preview */}
        <div className="flex flex-col rounded-lg border border-border bg-card overflow-hidden">
          <div className="flex items-center justify-between px-4 py-2 border-b border-border bg-muted/30 shrink-0">
            <div className="flex gap-1">
              <Button
                variant={previewMode === "preview" ? "secondary" : "ghost"}
                size="sm"
                className="h-7 text-xs gap-1.5"
                onClick={() => setPreviewMode("preview")}
              >
                <Eye className="h-3 w-3" /> Preview
              </Button>
              <Button
                variant={previewMode === "code" ? "secondary" : "ghost"}
                size="sm"
                className="h-7 text-xs gap-1.5"
                onClick={() => setPreviewMode("code")}
              >
                <Code2 className="h-3 w-3" /> HTML
              </Button>
            </div>
            <span className="text-[11px] text-muted-foreground">600px · Mailchimp-ready inline CSS</span>
          </div>

          {previewMode === "preview" ? (
            <iframe
              ref={iframeRef}
              srcDoc={finalHtml}
              className="flex-1 w-full border-0"
              sandbox="allow-same-origin"
              title="Email Preview"
              style={{ background: "#F4F4F0" }}
            />
          ) : (
            <div className="flex-1 overflow-auto p-4" style={{ background: "#1e1e1e" }}>
              <pre className="text-[11px] font-mono whitespace-pre-wrap break-all leading-relaxed" style={{ color: "#d4d4d4" }}>
                {finalHtml}
              </pre>
            </div>
          )}
        </div>

        {/* RIGHT: Quick edit */}
        <div className="flex flex-col gap-3 overflow-y-auto pl-0.5">
          <div className={cn("rounded-lg border border-border bg-card p-4 space-y-4", useCustomHtml && "opacity-40 pointer-events-none select-none")}>

            <div>
              <h3 className="text-sm font-semibold text-foreground mb-2.5">Inbox Copy</h3>
              <div className="space-y-2.5">
                <div>
                  <Label className="text-[11px] text-muted-foreground">Subject Line</Label>
                  <Input value={vars.subjectLine} onChange={v("subjectLine")} className="h-8 text-xs mt-1" placeholder="🏙️ Exclusive Presale…" />
                </div>
                <div>
                  <Label className="text-[11px] text-muted-foreground">Preview Text</Label>
                  <Input value={vars.previewText} onChange={v("previewText")} className="h-8 text-xs mt-1" placeholder="From $599K · Surrey · Limited units" />
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-foreground mb-2.5">Email Content</h3>
              <div className="space-y-2.5">
                <div>
                  <Label className="text-[11px] text-muted-foreground">Headline</Label>
                  <Input value={vars.headline} onChange={v("headline")} className="h-8 text-xs mt-1" placeholder="Introducing Project Name…" />
                </div>
                <div>
                  <Label className="text-[11px] text-muted-foreground">Highlights (one per line → gold bullet points)</Label>
                  <Textarea
                    value={vars.bodyCopy}
                    onChange={v("bodyCopy")}
                    className="text-xs mt-1 min-h-[130px] resize-none"
                    placeholder={"Park-facing homes with green space views\nPTT Exemption eligible for first-time buyers\nCo-op commission available"}
                  />
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-foreground mb-2.5">Project Info</h3>
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
                  ]
                ).map(({ key, label }) => (
                  <div key={key}>
                    <Label className="text-[10px] text-muted-foreground">{label}</Label>
                    <Input value={vars[key]} onChange={v(key)} className="h-7 text-xs mt-0.5" />
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-foreground mb-2.5">URLs</h3>
              <div className="space-y-1.5">
                {(
                  [
                    { key: "featuredImage" as keyof TemplateVars, label: "Hero Image URL" },
                    { key: "brochureUrl" as keyof TemplateVars, label: "Brochure URL" },
                    { key: "floorplanUrl" as keyof TemplateVars, label: "Floor Plan URL" },
                    { key: "pricingUrl" as keyof TemplateVars, label: "Pricing Sheet URL" },
                    { key: "projectUrl" as keyof TemplateVars, label: "Project Page URL" },
                    { key: "bookUrl" as keyof TemplateVars, label: "Booking URL" },
                  ]
                ).map(({ key, label }) => (
                  <div key={key}>
                    <Label className="text-[10px] text-muted-foreground">{label}</Label>
                    <Input value={vars[key]} onChange={v(key)} className="h-7 text-xs mt-0.5 font-mono" placeholder="https://" />
                  </div>
                ))}
              </div>
            </div>
          </div>

          {useCustomHtml && (
            <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 p-3">
              <p className="text-xs font-semibold text-amber-600 dark:text-amber-400">Quick-edit disabled</p>
              <p className="text-[11px] text-muted-foreground mt-1">
                Using imported HTML. Switch back to template to re-enable editing.
              </p>
              <Button variant="outline" size="sm" className="mt-2 h-7 text-xs w-full" onClick={() => setUseCustomHtml(false)}>
                Use Template Instead
              </Button>
            </div>
          )}
        </div>

      </div>
    </AdminLayout>
  );
}
