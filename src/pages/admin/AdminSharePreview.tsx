import { useState } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { AdminBackLink } from "@/components/admin/AdminBackLink";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Loader2, Copy, ExternalLink, CheckCircle2, AlertTriangle, Share2, HelpCircle, MessageCircle, Phone, Slack, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { getShareableUrl } from "@/lib/share";

const PROJECT_ID = import.meta.env.VITE_SUPABASE_PROJECT_ID;
const SITE_ORIGIN = "https://presaleproperties.com";

interface OgResult {
  title?: string;
  description?: string;
  image?: string;
  url?: string;
  type?: string;
  siteName?: string;
  twitterCard?: string;
  rawHtml: string;
  status: number;
  fetchedFrom: string;
}

function parseMeta(html: string): Omit<OgResult, "rawHtml" | "status" | "fetchedFrom"> {
  const get = (re: RegExp) => {
    const m = html.match(re);
    return m ? m[1].replace(/&amp;/g, "&").replace(/&quot;/g, '"').replace(/&#39;/g, "'") : undefined;
  };
  return {
    title:
      get(/<meta\s+property=["']og:title["']\s+content=["']([^"']+)["']/i) ||
      get(/<title>([^<]+)<\/title>/i),
    description: get(/<meta\s+(?:property|name)=["'](?:og:)?description["']\s+content=["']([^"']+)["']/i),
    image: get(/<meta\s+property=["']og:image["']\s+content=["']([^"']+)["']/i),
    url: get(/<meta\s+property=["']og:url["']\s+content=["']([^"']+)["']/i),
    type: get(/<meta\s+property=["']og:type["']\s+content=["']([^"']+)["']/i),
    siteName: get(/<meta\s+property=["']og:site_name["']\s+content=["']([^"']+)["']/i),
    twitterCard: get(/<meta\s+name=["']twitter:card["']\s+content=["']([^"']+)["']/i),
  };
}

const CRAWLER_UA =
  "facebookexternalhit/1.1 (+http://www.facebook.com/externalhit_uatext.php)";

export default function AdminSharePreview() {
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<OgResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const normalizePath = (raw: string): string => {
    const trimmed = raw.trim();
    if (!trimmed) return "/";
    try {
      const u = new URL(trimmed.startsWith("http") ? trimmed : `${SITE_ORIGIN}${trimmed.startsWith("/") ? "" : "/"}${trimmed}`);
      return `${u.pathname}${u.search}`;
    } catch {
      return trimmed.startsWith("/") ? trimmed : `/${trimmed}`;
    }
  };

  const runCheck = async (opts: { fresh?: boolean } = {}) => {
    setError(null);
    setResult(null);
    setLoading(true);
    try {
      const path = normalizePath(input);
      if (!PROJECT_ID) throw new Error("Project ID not configured.");
      const params = new URLSearchParams({ path });
      if (opts.fresh) {
        params.set("fresh", "1");
        params.set("v", String(Date.now()));
      }
      const ogUrl = `https://${PROJECT_ID}.supabase.co/functions/v1/og-preview?${params.toString()}`;
      const resp = await fetch(ogUrl, {
        headers: {
          "User-Agent": CRAWLER_UA,
          "x-test-crawler": "1",
          ...(opts.fresh ? { "Cache-Control": "no-cache" } : {}),
        },
        redirect: "manual",
        cache: opts.fresh ? "no-store" : "default",
      });
      const html = await resp.text();
      const meta = parseMeta(html);
      setResult({
        ...meta,
        rawHtml: html,
        status: resp.status,
        fetchedFrom: ogUrl,
      });
      if (opts.fresh) toast.success("Fetched fresh — cache bypassed");
    } catch (e: any) {
      setError(e?.message || "Failed to fetch preview");
    } finally {
      setLoading(false);
    }
  };

  const copyShareUrl = async (fresh = false) => {
    const path = normalizePath(input);
    const url = getShareableUrl(path, fresh ? { fresh: true, version: Date.now() } : {});
    await navigator.clipboard.writeText(url);
    toast.success(fresh ? "Fresh share URL copied (cache-busting)" : "Shareable URL copied");
  };

  const checks = result
    ? [
        { label: "Title present", pass: !!result.title, value: result.title },
        { label: "Description present", pass: !!result.description, value: result.description },
        { label: "OG image present", pass: !!result.image, value: result.image },
        { label: "Canonical URL", pass: !!result.url, value: result.url },
        { label: "Twitter card", pass: result.twitterCard === "summary_large_image", value: result.twitterCard },
        { label: "HTTP 200", pass: result.status === 200, value: String(result.status) },
      ]
    : [];

  return (
    <AdminLayout>
      <div className="space-y-6 max-w-5xl">
        <AdminBackLink to="/admin" label="Back to admin" />

        <div>
          <h1 className="text-3xl font-bold tracking-tight">Share Preview Verifier</h1>
          <p className="text-muted-foreground mt-1">
            Check exactly what iMessage, WhatsApp, Slack, Facebook, and other crawlers will see
            before you share a URL. This hits the og-preview edge function with a crawler User-Agent
            and parses the returned tags.
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Test a URL</CardTitle>
            <CardDescription>
              Paste any path or full URL (e.g. <code>/projects/some-slug</code> or{" "}
              <code>https://presaleproperties.com/listings/abc</code>).
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="url-input">URL or path</Label>
              <div className="flex gap-2">
                <Input
                  id="url-input"
                  placeholder="/projects/your-project-slug"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && runCheck()}
                />
                <Button onClick={() => runCheck()} disabled={loading || !input.trim()}>
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Check"}
                </Button>
                <Button
                  variant="secondary"
                  onClick={() => runCheck({ fresh: true })}
                  disabled={loading || !input.trim()}
                  title="Bypass cache & force re-fetch from the database"
                >
                  Force fresh
                </Button>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              {[
                "/",
                "/presale-projects",
                "/listings",
                "/blog",
                "/about",
              ].map((p) => (
                <Button
                  key={p}
                  size="sm"
                  variant="outline"
                  onClick={() => setInput(p)}
                >
                  {p}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>

        <SharingHelpCard
          hasResult={!!result}
          checksFailed={checks.some((c) => !c.pass)}
          imageMissing={!!result && !result.image}
          onForceFresh={() => runCheck({ fresh: true })}
          forceFreshDisabled={loading || !input.trim()}
        />

        {error && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Check failed</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {result && (
          <>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  Preview Card
                  <Badge variant={result.status === 200 ? "default" : "destructive"}>
                    HTTP {result.status}
                  </Badge>
                </CardTitle>
                <CardDescription>This is how the link will look in most chat apps.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="border rounded-lg overflow-hidden max-w-md bg-card">
                  {result.image && (
                    <div className="aspect-[1200/630] bg-muted overflow-hidden">
                      <img
                        src={result.image}
                        alt="OG preview"
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = "none";
                        }}
                      />
                    </div>
                  )}
                  <div className="p-4 space-y-1">
                    <div className="text-xs uppercase text-muted-foreground truncate">
                      {result.url ? new URL(result.url).hostname : "—"}
                    </div>
                    <div className="font-semibold leading-tight">{result.title || "(no title)"}</div>
                    <div className="text-sm text-muted-foreground line-clamp-2">
                      {result.description || "(no description)"}
                    </div>
                  </div>
                </div>

                <div className="flex gap-2 mt-4 flex-wrap">
                  <Button size="sm" variant="outline" onClick={() => copyShareUrl(false)}>
                    <Copy className="h-4 w-4 mr-2" />
                    Copy share URL
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => copyShareUrl(true)}>
                    <Copy className="h-4 w-4 mr-2" />
                    Copy fresh URL
                  </Button>
                  <Button size="sm" variant="outline" asChild>
                    <a href={result.fetchedFrom} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="h-4 w-4 mr-2" />
                      Open edge response
                    </a>
                  </Button>
                  <Button size="sm" variant="outline" asChild>
                    <a
                      href={`https://developers.facebook.com/tools/debug/?q=${encodeURIComponent(result.fetchedFrom)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <Share2 className="h-4 w-4 mr-2" />
                      Facebook debugger
                    </a>
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Checks</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {checks.map((c) => (
                  <div key={c.label} className="flex items-start gap-3 py-2 border-b last:border-0">
                    {c.pass ? (
                      <CheckCircle2 className="h-5 w-5 text-primary mt-0.5 shrink-0" />
                    ) : (
                      <AlertTriangle className="h-5 w-5 text-destructive mt-0.5 shrink-0" />
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm">{c.label}</div>
                      <div className="text-xs text-muted-foreground break-all">
                        {c.value || "—"}
                      </div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Raw OG tags</CardTitle>
                <CardDescription>Parsed from the edge function response.</CardDescription>
              </CardHeader>
              <CardContent>
                <pre className="text-xs bg-muted p-4 rounded-md overflow-auto max-h-96">
{JSON.stringify(
  {
    title: result.title,
    description: result.description,
    image: result.image,
    url: result.url,
    type: result.type,
    siteName: result.siteName,
    twitterCard: result.twitterCard,
  },
  null,
  2
)}
                </pre>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </AdminLayout>
  );
}

// ─── Help / Checklist ─────────────────────────────────────────

interface SharingHelpProps {
  hasResult: boolean;
  checksFailed: boolean;
  imageMissing: boolean;
  onForceFresh: () => void;
  forceFreshDisabled: boolean;
}

function SharingHelpCard({
  hasResult,
  checksFailed,
  imageMissing,
  onForceFresh,
  forceFreshDisabled,
}: SharingHelpProps) {
  // Adaptive guidance: only surface a "clear cache" alert when the user has
  // run a check AND something is off (failed checks or missing image). This
  // mirrors the most common cause — a stale social-platform cache after an
  // edit — and tells them exactly which lever to pull.
  const showCacheAlert = hasResult && (checksFailed || imageMissing);

  const platforms = [
    {
      name: "iMessage",
      icon: Phone,
      steps: [
        "Send the link from a fresh chat (not a thread that already cached it).",
        "If the preview is wrong, delete the message + restart Messages app.",
        "iOS caches per-thread for ~24h — share to a different contact to retest.",
      ],
    },
    {
      name: "WhatsApp",
      icon: MessageCircle,
      steps: [
        "Type the URL and wait 1–2s for the preview to load before sending.",
        "If it shows the homepage card, the WA cache is stale. Append ?v=" +
          Date.now().toString().slice(-4) +
          " to bust it.",
        "Force-quit + reopen WhatsApp clears its in-memory preview cache.",
      ],
    },
    {
      name: "Slack",
      icon: Slack,
      steps: [
        "Slack caches unfurls per workspace for ~30 min.",
        'Use the message edit menu → "Remove preview", then re-paste the URL.',
        "Or post in a DM to yourself first to verify before sharing publicly.",
      ],
    },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <HelpCircle className="h-5 w-5 text-primary" />
          Sharing checklist & cache help
        </CardTitle>
        <CardDescription>
          Per-platform tips for iMessage, WhatsApp, and Slack — plus when to
          bust caches if a preview looks stale.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        {showCacheAlert && (
          <Alert>
            <RefreshCw className="h-4 w-4" />
            <AlertTitle>Looks like a stale or incomplete preview</AlertTitle>
            <AlertDescription className="space-y-3">
              <p>
                {imageMissing
                  ? "The OG image is missing. "
                  : "Some checks failed. "}
                Try the steps below in order:
              </p>
              <ol className="list-decimal pl-5 space-y-1 text-sm">
                <li>
                  Click <strong>Force fresh</strong> below to bypass our edge
                  cache and re-read from the database.
                </li>
                <li>
                  Re-run the check. If it now passes, the data is fixed —
                  social platforms just need to re-scrape.
                </li>
                <li>
                  Paste the page URL into the{" "}
                  <a
                    href="https://developers.facebook.com/tools/debug/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline"
                  >
                    Facebook Debugger
                  </a>{" "}
                  and click <em>Scrape Again</em>. WhatsApp + iMessage often
                  share the FB cache.
                </li>
                <li>
                  Use the <strong>Copy fresh URL</strong> button above when
                  re-sharing — it appends a cache-busting <code>?v=</code>
                  param so chat apps treat it as a new link.
                </li>
              </ol>
              <Button
                size="sm"
                variant="default"
                onClick={onForceFresh}
                disabled={forceFreshDisabled}
                className="mt-1"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Force fresh now
              </Button>
            </AlertDescription>
          </Alert>
        )}

        <div className="grid gap-4 md:grid-cols-3">
          {platforms.map((p) => {
            const Icon = p.icon;
            return (
              <div
                key={p.name}
                className="border rounded-lg p-4 bg-card space-y-3"
              >
                <div className="flex items-center gap-2 font-semibold">
                  <Icon className="h-4 w-4 text-primary" />
                  {p.name}
                </div>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  {p.steps.map((s, i) => (
                    <li key={i} className="flex gap-2">
                      <CheckCircle2 className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                      <span>{s}</span>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>

        <div className="rounded-lg border bg-muted/40 p-4 text-sm space-y-2">
          <div className="font-semibold flex items-center gap-2">
            <RefreshCw className="h-4 w-4" />
            When to clear caches
          </div>
          <ul className="space-y-1 text-muted-foreground">
            <li>
              • <strong>Just edited the listing/project?</strong> Use{" "}
              <em>Force fresh</em>, then re-share with the <em>fresh URL</em>.
            </li>
            <li>
              • <strong>Preview shows the homepage card?</strong> The crawler
              hasn't re-scraped yet — run the FB debugger or append{" "}
              <code>?v={"<timestamp>"}</code>.
            </li>
            <li>
              • <strong>Image is wrong/old?</strong> Update <code>updated_at</code>{" "}
              on the resource, then Force fresh — our ETag will change.
            </li>
            <li>
              • <strong>Nothing works after 24h?</strong> The image URL itself
              may be unreachable. Open the OG image link directly in a new
              tab to verify.
            </li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
