/**
 * Admin Recommendation Email Preview
 * ─────────────────────────────────────────────────────────────────────────────
 * Renders the recommendation email HTML *exactly as it will be audited and
 * sent* — same builder, same audit, same tracked-link wrapping. Use it to
 * visually confirm every CTA and project card link before saving or sending.
 *
 * Three panels:
 *   1. Left  — pick projects + tweak headline/body/context (reuses the same
 *              RecommendationProjectsPanel as the Email Builder).
 *   2. Center — live iframe preview of the rendered HTML.
 *   3. Right — audit report listing every <a href> with its destination,
 *              flagging empty hrefs, wrong schemes, and broken project routes.
 *
 * No save / no send happens here — purely visual confirmation.
 */

import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  CheckCircle2,
  AlertTriangle,
  ExternalLink,
  ArrowLeft,
  Monitor,
  Smartphone,
  Eye,
  Code2,
  Copy,
  CheckCheck,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

import { RecommendationProjectsPanel } from "@/components/admin/campaign/RecommendationProjectsPanel";
import {
  buildRecommendationEmailHtml,
  type RecommendationProject,
} from "@/components/admin/campaign/buildRecommendationEmailHtml";
import {
  auditEmailHtml,
  type AuditReport,
  type AuditIssue,
} from "@/components/admin/campaign/auditEmailHtml";

// ───────────────────────────────────────────────────────────────────────────
// Helpers
// ───────────────────────────────────────────────────────────────────────────

/** Pull every <a href="..."> with its visible inner text. */
interface AnchorRow {
  href: string;
  text: string;
  destination: string;
  isTracked: boolean;
}

const TRACK_HOST = "thvlisplwqhtjpzpedhq.supabase.co";
const TRACK_PATH = "/functions/v1/track-email-open";

function extractAnchors(html: string): AnchorRow[] {
  const out: AnchorRow[] = [];
  const re =
    /<a\b[^>]*\bhref\s*=\s*(?:"([^"]*)"|'([^']*)')[^>]*>([\s\S]*?)<\/a>/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(html)) !== null) {
    const href = (m[1] ?? m[2] ?? "").trim();
    const inner = (m[3] ?? "").trim();
    const text =
      inner.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim() || "(no text)";
    let destination = href;
    let isTracked = false;
    try {
      const u = new URL(href);
      if (u.hostname === TRACK_HOST && u.pathname === TRACK_PATH) {
        isTracked = true;
        destination = u.searchParams.get("url") || href;
      }
    } catch {
      /* keep raw href */
    }
    out.push({ href, text, destination, isTracked });
  }
  return out;
}

function ruleLabel(rule: AuditIssue["rule"]): string {
  switch (rule) {
    case "empty_href":
      return "Empty href";
    case "placeholder_href":
      return "Placeholder href (#)";
    case "wrong_scheme":
      return "Wrong URL scheme";
    case "tracked_url_unparseable":
      return "Unparseable tracked URL";
    case "tracked_url_missing_destination":
      return "Tracker missing destination";
    case "destination_unparseable":
      return "Unparseable destination";
    case "project_route_invalid":
      return "Invalid project route";
    case "project_route_wrong_host":
      return "Wrong destination host";
    default:
      return rule;
  }
}

// ───────────────────────────────────────────────────────────────────────────
// Page
// ───────────────────────────────────────────────────────────────────────────

export default function AdminRecommendationEmailPreview() {
  const [projects, setProjects] = useState<RecommendationProject[]>([]);
  const [groupByCategory, setGroupByCategory] = useState(true);
  const [personalizationContext, setPersonalizationContext] = useState(
    "based on your recent searches",
  );
  const [headline, setHeadline] = useState("Recommended for you");
  const [bodyCopy, setBodyCopy] = useState(
    "Hand-picked presales matched to what you've been looking at.",
  );
  const [subjectLine, setSubjectLine] = useState("Recommended for you");
  const [previewText, setPreviewText] = useState(
    "Hand-picked presales matched to your interests.",
  );
  const [device, setDevice] = useState<"desktop" | "mobile">("desktop");
  const [view, setView] = useState<"preview" | "html">("preview");
  const [copied, setCopied] = useState(false);

  // Render HTML + audit on every change. Wrapped so a render error from the
  // builder (e.g. missing projectUrl) surfaces in the audit panel rather than
  // crashing the page.
  const { html, report, renderError } = useMemo(() => {
    if (projects.length === 0) {
      return { html: "", report: null as AuditReport | null, renderError: null as string | null };
    }
    try {
      const h = buildRecommendationEmailHtml({
        subjectLine,
        previewText,
        headline,
        bodyCopy,
        personalizationContext,
        projects,
        groupByCategory,
        city: projects[0]?.city,
      });
      return {
        html: h,
        report: auditEmailHtml(h, { requireProjectRoute: true }),
        renderError: null,
      };
    } catch (e) {
      return {
        html: "",
        report: null,
        renderError: e instanceof Error ? e.message : "Failed to render email",
      };
    }
  }, [
    projects,
    groupByCategory,
    personalizationContext,
    headline,
    bodyCopy,
    subjectLine,
    previewText,
  ]);

  const anchors = useMemo(() => (html ? extractAnchors(html) : []), [html]);

  // Pump HTML into the iframe via srcDoc (instant, no network round-trip).
  const iframeRef = useRef<HTMLIFrameElement>(null);
  useEffect(() => {
    if (!iframeRef.current) return;
    iframeRef.current.srcdoc = html || EMPTY_PREVIEW;
  }, [html]);

  // Map href → audit issues so each link row can show inline flags.
  const issuesByHref = useMemo(() => {
    const map = new Map<string, AuditIssue[]>();
    if (!report) return map;
    for (const i of report.errors) {
      const arr = map.get(i.href) || [];
      arr.push(i);
      map.set(i.href, arr);
    }
    return map;
  }, [report]);

  const onCopyHtml = async () => {
    if (!html) return;
    await navigator.clipboard.writeText(html);
    setCopied(true);
    toast.success("HTML copied to clipboard");
    setTimeout(() => setCopied(false), 1500);
  };

  const errorCount = report?.errors.length ?? 0;
  const totalLinks = report?.total ?? 0;
  const auditOk = !!report?.ok && !renderError;

  return (
    <TooltipProvider delayDuration={150}>
      <div className="flex h-screen flex-col bg-background">
        {/* ── Top bar ─────────────────────────────────────────────────── */}
        <header className="flex items-center justify-between gap-3 border-b border-border bg-card px-4 py-3">
          <div className="flex items-center gap-3 min-w-0">
            <Button asChild variant="ghost" size="sm" className="h-8 px-2">
              <Link to="/admin/email-builder">
                <ArrowLeft className="h-4 w-4" />
              </Link>
            </Button>
            <div className="min-w-0">
              <h1 className="text-sm font-semibold text-foreground truncate">
                Recommendation Email — Visual Preview & Link Audit
              </h1>
              <p className="text-[11px] text-muted-foreground truncate">
                Renders exactly what `buildRecommendationEmailHtml` + `auditEmailHtml`
                produce. No save, no send.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {projects.length > 0 && (
              <Badge
                variant={auditOk ? "default" : "destructive"}
                className={cn(
                  "h-7 gap-1.5 px-2.5 text-[11px] font-semibold",
                  auditOk && "bg-emerald-500/15 text-emerald-700 hover:bg-emerald-500/15 dark:text-emerald-400",
                )}
              >
                {auditOk ? (
                  <>
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    {totalLinks} links · all valid
                  </>
                ) : (
                  <>
                    <AlertTriangle className="h-3.5 w-3.5" />
                    {errorCount} issue{errorCount === 1 ? "" : "s"} · {totalLinks} links
                  </>
                )}
              </Badge>
            )}
          </div>
        </header>

        {/* ── 3-panel body ────────────────────────────────────────────── */}
        <div className="flex flex-1 min-h-0 overflow-hidden">
          {/* Left: editor */}
          <aside className="w-[340px] shrink-0 border-r border-border bg-card overflow-hidden flex flex-col">
            <ScrollArea className="flex-1">
              <div className="p-4 space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="rec-subject" className="text-xs font-semibold">
                    Subject line
                  </Label>
                  <Input
                    id="rec-subject"
                    value={subjectLine}
                    onChange={(e) => setSubjectLine(e.target.value)}
                    className="h-8 text-sm"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="rec-preview" className="text-xs font-semibold">
                    Preview text
                  </Label>
                  <Input
                    id="rec-preview"
                    value={previewText}
                    onChange={(e) => setPreviewText(e.target.value)}
                    className="h-8 text-sm"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="rec-headline" className="text-xs font-semibold">
                    Hero headline
                  </Label>
                  <Input
                    id="rec-headline"
                    value={headline}
                    onChange={(e) => setHeadline(e.target.value)}
                    className="h-8 text-sm"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="rec-body" className="text-xs font-semibold">
                    Body copy
                  </Label>
                  <Textarea
                    id="rec-body"
                    value={bodyCopy}
                    onChange={(e) => setBodyCopy(e.target.value)}
                    rows={3}
                    className="text-sm"
                  />
                </div>

                <div className="border-t border-border -mx-4" />

                <RecommendationProjectsPanel
                  projects={projects}
                  onChange={setProjects}
                  groupByCategory={groupByCategory}
                  onGroupByCategoryChange={setGroupByCategory}
                  personalizationContext={personalizationContext}
                  onPersonalizationContextChange={setPersonalizationContext}
                />
              </div>
            </ScrollArea>
          </aside>

          {/* Center: live preview */}
          <main className="flex-1 min-w-0 flex flex-col bg-muted/20">
            <div className="flex items-center justify-between gap-2 border-b border-border bg-card/60 px-3 py-2">
              <div className="flex items-center gap-1 rounded-md bg-muted p-1">
                <Button
                  variant="ghost"
                  size="sm"
                  className={cn(
                    "h-7 px-2 text-xs gap-1",
                    view === "preview" && "bg-card shadow-sm",
                  )}
                  onClick={() => setView("preview")}
                >
                  <Eye className="h-3.5 w-3.5" /> Preview
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className={cn(
                    "h-7 px-2 text-xs gap-1",
                    view === "html" && "bg-card shadow-sm",
                  )}
                  onClick={() => setView("html")}
                >
                  <Code2 className="h-3.5 w-3.5" /> HTML
                </Button>
              </div>

              <div className="flex items-center gap-2">
                {view === "preview" && (
                  <div className="flex items-center gap-1 rounded-md bg-muted p-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      className={cn(
                        "h-7 px-2 text-xs gap-1",
                        device === "desktop" && "bg-card shadow-sm",
                      )}
                      onClick={() => setDevice("desktop")}
                    >
                      <Monitor className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className={cn(
                        "h-7 px-2 text-xs gap-1",
                        device === "mobile" && "bg-card shadow-sm",
                      )}
                      onClick={() => setDevice("mobile")}
                    >
                      <Smartphone className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 px-2 text-xs gap-1.5"
                  onClick={onCopyHtml}
                  disabled={!html}
                >
                  {copied ? (
                    <CheckCheck className="h-3.5 w-3.5 text-emerald-500" />
                  ) : (
                    <Copy className="h-3.5 w-3.5" />
                  )}
                  Copy HTML
                </Button>
              </div>
            </div>

            <div className="flex-1 min-h-0 overflow-auto p-4 flex items-start justify-center">
              {view === "preview" ? (
                <div
                  className={cn(
                    "bg-card border border-border rounded-lg shadow-sm overflow-hidden transition-all",
                    device === "desktop" ? "w-full max-w-[680px]" : "w-[390px]",
                  )}
                  style={{ height: "calc(100vh - 180px)" }}
                >
                  <iframe
                    ref={iframeRef}
                    title="Recommendation email preview"
                    sandbox="allow-same-origin"
                    className="w-full h-full bg-white"
                  />
                </div>
              ) : (
                <pre className="w-full max-w-[1100px] bg-card border border-border rounded-lg p-4 text-[11px] text-foreground/90 overflow-auto whitespace-pre-wrap break-all">
                  {html || "Add at least one project to render the email HTML."}
                </pre>
              )}
            </div>
          </main>

          {/* Right: audit + link table */}
          <aside className="w-[380px] shrink-0 border-l border-border bg-card overflow-hidden flex flex-col">
            <div className="border-b border-border px-4 py-3">
              <h2 className="text-sm font-semibold text-foreground">
                Link Audit
              </h2>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                Same checks as the pre-send validator.
              </p>
            </div>

            <ScrollArea className="flex-1">
              <div className="p-4 space-y-4">
                {renderError && (
                  <div className="rounded-md border border-destructive/30 bg-destructive/5 p-3">
                    <div className="flex items-start gap-2">
                      <AlertTriangle className="h-4 w-4 text-destructive mt-0.5 shrink-0" />
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-destructive">
                          Render failed
                        </p>
                        <p className="text-[11px] text-destructive/80 mt-1 break-words">
                          {renderError}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {projects.length === 0 && !renderError && (
                  <p className="text-xs text-muted-foreground">
                    Add projects on the left to see link audit results.
                  </p>
                )}

                {report && report.errors.length > 0 && (
                  <div className="space-y-2">
                    <h3 className="text-[11px] uppercase tracking-wider font-semibold text-destructive">
                      Errors ({report.errors.length})
                    </h3>
                    <ul className="space-y-2">
                      {report.errors.map((issue, i) => (
                        <li
                          key={i}
                          className="rounded-md border border-destructive/30 bg-destructive/5 p-2.5 text-[11px]"
                        >
                          <div className="flex items-center gap-1.5 mb-1">
                            <AlertTriangle className="h-3 w-3 text-destructive shrink-0" />
                            <span className="font-semibold text-destructive">
                              {ruleLabel(issue.rule)}
                            </span>
                            {issue.expected && (
                              <span className="text-muted-foreground">
                                · expected {issue.expected}
                              </span>
                            )}
                          </div>
                          {issue.context && (
                            <p className="text-foreground/90 mb-1">
                              “{issue.context}”
                            </p>
                          )}
                          <p className="text-muted-foreground break-all font-mono text-[10px]">
                            {issue.href || "(empty)"}
                          </p>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {anchors.length > 0 && (
                  <div className="space-y-2">
                    <h3 className="text-[11px] uppercase tracking-wider font-semibold text-muted-foreground">
                      All links ({anchors.length})
                    </h3>
                    <ul className="space-y-1.5">
                      {anchors.map((a, i) => {
                        const issues = issuesByHref.get(a.href) || [];
                        const hasIssue = issues.length > 0;
                        return (
                          <li
                            key={i}
                            className={cn(
                              "rounded-md border p-2 text-[11px]",
                              hasIssue
                                ? "border-destructive/30 bg-destructive/5"
                                : "border-border bg-muted/20",
                            )}
                          >
                            <div className="flex items-start gap-1.5 min-w-0">
                              {hasIssue ? (
                                <AlertTriangle className="h-3 w-3 text-destructive mt-0.5 shrink-0" />
                              ) : (
                                <CheckCircle2 className="h-3 w-3 text-emerald-500 mt-0.5 shrink-0" />
                              )}
                              <div className="min-w-0 flex-1">
                                <p className="font-medium text-foreground/90 truncate">
                                  {a.text}
                                </p>
                                {a.isTracked && (
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <p className="text-muted-foreground font-mono text-[10px] truncate cursor-help">
                                        ↳ {a.destination}
                                      </p>
                                    </TooltipTrigger>
                                    <TooltipContent side="left" className="max-w-[400px] break-all text-[10px]">
                                      <p className="font-semibold mb-1">Tracked redirect</p>
                                      <p className="font-mono">{a.href}</p>
                                    </TooltipContent>
                                  </Tooltip>
                                )}
                                {!a.isTracked && (
                                  <p className="text-muted-foreground font-mono text-[10px] truncate">
                                    {a.href || "(empty)"}
                                  </p>
                                )}
                              </div>
                              {a.destination &&
                                /^https?:\/\//i.test(a.destination) && (
                                  <a
                                    href={a.destination}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-muted-foreground hover:text-primary shrink-0"
                                    title="Open destination in new tab"
                                  >
                                    <ExternalLink className="h-3 w-3" />
                                  </a>
                                )}
                            </div>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                )}
              </div>
            </ScrollArea>
          </aside>
        </div>
      </div>
    </TooltipProvider>
  );
}

const EMPTY_PREVIEW = `<!doctype html><html><body style="font-family:system-ui;display:flex;align-items:center;justify-content:center;height:100vh;margin:0;color:#888;background:#fafafa"><div style="text-align:center"><p style="font-size:14px">Add at least one project to render the email preview.</p></div></body></html>`;
