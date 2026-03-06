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
  const ctaBtn = (href: string, label: string, primary = false) =>
    href
      ? `<table border="0" cellpadding="0" cellspacing="0" style="margin:8px auto;">
          <tr>
            <td align="center" bgcolor="${primary ? "#C9A84C" : "#1A1A1A"}" style="border-radius:4px;">
              <a href="${href}" target="_blank"
                style="display:inline-block;padding:14px 32px;font-family:Arial,sans-serif;font-size:14px;font-weight:700;
                       color:${primary ? "#111111" : "#FFFFFF"};text-decoration:none;letter-spacing:0.5px;border-radius:4px;
                       border:2px solid ${primary ? "#C9A84C" : "#444444"};">
                ${label}
              </a>
            </td>
          </tr>
        </table>`
      : "";

  const locationLine = [vars.city, vars.neighborhood].filter(Boolean).join(" · ");

  const heroSection = vars.featuredImage
    ? `<tr>
        <td align="center" style="padding:0;position:relative;">
          <img src="${vars.featuredImage}" alt="${vars.projectName}" width="600"
               style="width:100%;max-width:600px;height:280px;object-fit:cover;display:block;border:0;" />
          <table width="100%" border="0" cellpadding="0" cellspacing="0"
                 style="position:absolute;bottom:0;left:0;right:0;background:linear-gradient(transparent,rgba(0,0,0,0.75));padding:0;">
            <tr>
              <td style="padding:20px 30px;">
                <h1 style="margin:0;font-family:Georgia,serif;font-size:28px;font-weight:700;color:#FFFFFF;letter-spacing:-0.5px;">
                  ${vars.projectName}
                </h1>
                ${locationLine ? `<p style="margin:4px 0 0;font-family:Arial,sans-serif;font-size:13px;color:#C9A84C;letter-spacing:1px;text-transform:uppercase;">${locationLine}</p>` : ""}
              </td>
            </tr>
          </table>
        </td>
      </tr>`
    : `<tr>
        <td align="center" style="background:#1A1A1A;padding:40px 30px;">
          <h1 style="margin:0;font-family:Georgia,serif;font-size:32px;font-weight:700;color:#FFFFFF;letter-spacing:-0.5px;">
            ${vars.projectName || "Your Project Name"}
          </h1>
          ${locationLine ? `<p style="margin:8px 0 0;font-family:Arial,sans-serif;font-size:13px;color:#C9A84C;letter-spacing:1.5px;text-transform:uppercase;">${locationLine}</p>` : ""}
        </td>
      </tr>`;

  const infoBar =
    vars.address || vars.completion || vars.startingPrice
      ? `<tr>
          <td style="background:#111111;padding:0;">
            <table width="100%" border="0" cellpadding="0" cellspacing="0">
              <tr>
                ${
                  vars.address
                    ? `<td align="center" style="padding:16px 10px;border-right:1px solid #2A2A2A;width:34%;">
                        <p style="margin:0 0 3px;font-family:Arial,sans-serif;font-size:9px;color:#C9A84C;text-transform:uppercase;letter-spacing:1.5px;font-weight:700;">Location</p>
                        <p style="margin:0;font-family:Arial,sans-serif;font-size:12px;color:#E0E0E0;">${vars.address}</p>
                      </td>`
                    : ""
                }
                ${
                  vars.startingPrice
                    ? `<td align="center" style="padding:16px 10px;border-right:1px solid #2A2A2A;width:33%;">
                        <p style="margin:0 0 3px;font-family:Arial,sans-serif;font-size:9px;color:#C9A84C;text-transform:uppercase;letter-spacing:1.5px;font-weight:700;">Starting From</p>
                        <p style="margin:0;font-family:Arial,sans-serif;font-size:14px;color:#FFFFFF;font-weight:700;">${vars.startingPrice}</p>
                      </td>`
                    : ""
                }
                ${
                  vars.completion
                    ? `<td align="center" style="padding:16px 10px;width:33%;">
                        <p style="margin:0 0 3px;font-family:Arial,sans-serif;font-size:9px;color:#C9A84C;text-transform:uppercase;letter-spacing:1.5px;font-weight:700;">Est. Completion</p>
                        <p style="margin:0;font-family:Arial,sans-serif;font-size:12px;color:#E0E0E0;">${vars.completion}</p>
                      </td>`
                    : ""
                }
              </tr>
            </table>
          </td>
        </tr>`
      : "";

  const ctaButtons = [
    cta.brochure && vars.brochureUrl ? ctaBtn(vars.brochureUrl, "&#x1F4C4; Download Brochure", true) : "",
    cta.floorplan && vars.floorplanUrl ? ctaBtn(vars.floorplanUrl, "&#x1F3E2; View Floor Plans") : "",
    cta.pricing && vars.pricingUrl ? ctaBtn(vars.pricingUrl, "&#x1F4B0; Request Pricing") : "",
    cta.viewProject && vars.projectUrl ? ctaBtn(vars.projectUrl, "&#x1F50D; View Full Project") : "",
    cta.bookConsult && vars.bookUrl ? ctaBtn(vars.bookUrl, "&#x1F4C5; Book a Free Consultation", true) : "",
  ]
    .filter(Boolean)
    .join("\n");

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta http-equiv="X-UA-Compatible" content="IE=edge" />
  <title>${vars.subjectLine || vars.projectName}</title>
</head>
<body style="margin:0;padding:0;background:#F4F4F0;font-family:Arial,sans-serif;">

<!-- Preview text (hidden) -->
<div style="display:none;max-height:0;overflow:hidden;font-size:1px;color:#F4F4F0;">
  ${vars.previewText || `Exclusive presale opportunity \u2014 ${vars.projectName}`}&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;
</div>

<!-- Email wrapper -->
<table width="100%" border="0" cellpadding="0" cellspacing="0" bgcolor="#F4F4F0" style="min-height:100vh;">
  <tr>
    <td align="center" style="padding:20px 10px;">

      <!-- Main container -->
      <table width="600" border="0" cellpadding="0" cellspacing="0"
             style="max-width:600px;width:100%;background:#FFFFFF;border-radius:4px;overflow:hidden;
                    box-shadow:0 4px 24px rgba(0,0,0,0.12);">

        <!-- HEADER -->
        <tr>
          <td style="background:#111111;padding:0;">
            <table width="100%" border="0" cellpadding="0" cellspacing="0">
              <tr>
                <td style="padding:18px 24px 16px;">
                  <table width="100%" border="0" cellpadding="0" cellspacing="0">
                    <tr>
                      <td>
                        <p style="margin:0;font-family:Georgia,serif;font-size:18px;font-weight:700;color:#FFFFFF;letter-spacing:0.5px;">
                          PRESALE<span style="color:#C9A84C;">PROPERTIES</span>
                        </p>
                        <p style="margin:2px 0 0;font-family:Arial,sans-serif;font-size:10px;color:#888888;letter-spacing:2px;text-transform:uppercase;">
                          BC's Pre-Construction Experts
                        </p>
                      </td>
                      <td align="right">
                        <span style="display:inline-block;padding:4px 10px;background:#C9A84C;font-family:Arial,sans-serif;font-size:9px;font-weight:700;color:#111111;letter-spacing:1.5px;text-transform:uppercase;border-radius:2px;">
                          EXCLUSIVE LISTING
                        </span>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
              <tr><td style="height:3px;background:linear-gradient(90deg,#C9A84C,#F0D080,#C9A84C);"></td></tr>
            </table>
          </td>
        </tr>

        <!-- HERO -->
        ${heroSection}

        <!-- INFO BAR -->
        ${infoBar}

        <!-- BODY -->
        <tr>
          <td style="padding:36px 36px 28px;background:#FFFFFF;">
            ${vars.headline ? `<h2 style="margin:0 0 16px;font-family:Georgia,serif;font-size:22px;font-weight:700;color:#111111;line-height:1.3;letter-spacing:-0.3px;">${vars.headline}</h2>` : ""}
            ${vars.bodyCopy ? `<p style="margin:0 0 20px;font-family:Arial,sans-serif;font-size:15px;color:#444444;line-height:1.7;">${vars.bodyCopy.replace(/\n/g, "<br />")}</p>` : ""}
          </td>
        </tr>

        <!-- CTA BUTTONS -->
        ${ctaButtons ? `<tr>
          <td style="background:#F9F7F2;padding:24px 36px 32px;border-top:1px solid #E8E4DB;">
            <p style="margin:0 0 16px;font-family:Arial,sans-serif;font-size:11px;font-weight:700;color:#888888;text-transform:uppercase;letter-spacing:1.5px;text-align:center;">Get Exclusive Access</p>
            ${ctaButtons}
          </td>
        </tr>` : ""}

        <!-- DEVELOPER ROW -->
        ${vars.developerName ? `<tr>
          <td style="padding:20px 36px;background:#FAFAFA;border-top:1px solid #EEEEEE;">
            <table width="100%" border="0" cellpadding="0" cellspacing="0">
              <tr>
                <td>
                  <p style="margin:0 0 4px;font-family:Arial,sans-serif;font-size:10px;color:#C9A84C;text-transform:uppercase;letter-spacing:1.5px;font-weight:700;">Developer</p>
                  <p style="margin:0;font-family:Arial,sans-serif;font-size:13px;color:#333333;font-weight:600;">${vars.developerName}</p>
                </td>
                ${vars.city ? `<td align="right">
                  <p style="margin:0 0 4px;font-family:Arial,sans-serif;font-size:10px;color:#C9A84C;text-transform:uppercase;letter-spacing:1.5px;font-weight:700;text-align:right;">Market</p>
                  <p style="margin:0;font-family:Arial,sans-serif;font-size:13px;color:#333333;font-weight:600;text-align:right;">${vars.city}, BC</p>
                </td>` : ""}
              </tr>
            </table>
          </td>
        </tr>` : ""}

        <!-- FOOTER -->
        <tr>
          <td style="background:#111111;padding:0;">
            <table width="100%" border="0" cellpadding="0" cellspacing="0">
              <tr><td style="height:3px;background:linear-gradient(90deg,#C9A84C,#F0D080,#C9A84C);"></td></tr>
              <tr>
                <td style="padding:24px 30px 20px;">
                  <table width="100%" border="0" cellpadding="0" cellspacing="0">
                    <tr>
                      <td>
                        <p style="margin:0 0 4px;font-family:Georgia,serif;font-size:14px;font-weight:700;color:#FFFFFF;">
                          PRESALE<span style="color:#C9A84C;">PROPERTIES</span>
                        </p>
                        <p style="margin:0;font-family:Arial,sans-serif;font-size:11px;color:#666666;">BC's Pre-Construction Specialists</p>
                      </td>
                      ${vars.projectUrl ? `<td align="right">
                        <a href="${vars.projectUrl}" target="_blank" style="font-family:Arial,sans-serif;font-size:11px;color:#C9A84C;text-decoration:none;">View Online &rarr;</a>
                      </td>` : ""}
                    </tr>
                  </table>
                  <table width="100%" border="0" cellpadding="0" cellspacing="0" style="margin-top:16px;">
                    <tr>
                      <td>
                        <p style="margin:0;font-family:Arial,sans-serif;font-size:10px;color:#555555;line-height:1.6;">
                          You are receiving this email because you registered interest in presale properties in BC.<br />
                          <a href="{{unsubscribe_url}}" style="color:#888888;text-decoration:underline;">Unsubscribe</a>
                          &nbsp;&middot;&nbsp;
                          <a href="https://presaleproperties.ca/privacy" style="color:#888888;text-decoration:underline;">Privacy Policy</a>
                        </p>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>
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
                  <Label className="text-[11px] text-muted-foreground">Body Copy</Label>
                  <Textarea
                    value={vars.bodyCopy}
                    onChange={v("bodyCopy")}
                    className="text-xs mt-1 min-h-[110px] resize-none"
                    placeholder="Write your email body here…"
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
