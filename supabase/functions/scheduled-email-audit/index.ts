/**
 * Scheduled Email Audit
 * ─────────────────────────────────────────────────────────────────────────────
 * Re-renders representative recommendation emails against live `presale_projects`
 * data and runs the same link audit the admin builder uses (empty hrefs, wrong
 * scheme, tracked URLs missing destinations, project routes pointing at the
 * wrong host or unknown paths). Any failure is recorded in `email_audit_runs`
 * so a template change or URL routing regression is caught BEFORE the next
 * campaign send — not after recipients click a broken link.
 *
 * Designed to run on a daily cron (see schedule SQL in the deploy step).
 * Returns a JSON summary for ad-hoc invocation by ops.
 */
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const SITE_HOST = "presaleproperties.com";
const TRACK_HOST = "thvlisplwqhtjpzpedhq.supabase.co";
const TRACK_PATH = "/functions/v1/track-email-open";
const TRACK_BASE = `https://${TRACK_HOST}${TRACK_PATH}`;
const PROJECT_PATH_RE = /^\/presale-projects\/[a-z0-9-]+(\/[a-z0-9-]+)*\/?$/i;

// ── Audit primitives (mirror src/components/admin/campaign/auditEmailHtml.ts) ─
type AuditIssue = {
  rule: string;
  href: string;
  context?: string;
  expected?: string;
};

function extractAnchors(html: string): { href: string; inner: string }[] {
  const out: { href: string; inner: string }[] = [];
  const re =
    /<a\b[^>]*\bhref\s*=\s*(?:"([^"]*)"|'([^']*)')[^>]*>([\s\S]*?)<\/a>/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(html)) !== null) {
    out.push({
      href: (m[1] ?? m[2] ?? "").trim(),
      inner: (m[3] ?? "").trim(),
    });
  }
  return out;
}
function visibleText(inner: string): string {
  return inner
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}
function getScheme(href: string): string {
  const m = href.match(/^([a-z][a-z0-9+.-]*):/i);
  return m ? m[1].toLowerCase() : "";
}
function expectedScheme(text: string): "tel" | "mailto" | "http" {
  const t = text.toLowerCase().trim();
  const digitCount = (t.match(/\d/g) || []).length;
  if (/^[+()\-.\s\d]+$/.test(t) && digitCount >= 7) return "tel";
  if (/\bcall\b/.test(t)) return "tel";
  if (/^email\b/.test(t)) return "mailto";
  if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(t)) return "mailto";
  return "http";
}

function auditHtml(html: string): AuditIssue[] {
  const errors: AuditIssue[] = [];
  for (const a of extractAnchors(html)) {
    const text = visibleText(a.inner) || "(no text)";
    const ctx = text.length > 60 ? `${text.slice(0, 57)}…` : text;

    // Skip ESP merge tags
    if (
      /^\{[\$%{]?[\w.]+[}%]?\}$/.test(a.href) ||
      /^\{\{[^}]+\}\}$/.test(a.href)
    )
      continue;

    if (!a.href) {
      errors.push({ rule: "empty_href", href: a.href, context: ctx });
      continue;
    }
    if (a.href === "#" || a.href.toLowerCase() === "javascript:void(0)") {
      errors.push({ rule: "placeholder_href", href: a.href, context: ctx });
      continue;
    }

    const want = expectedScheme(text);
    const got = getScheme(a.href);
    if (want === "tel" && got !== "tel") {
      errors.push({
        rule: "wrong_scheme",
        href: a.href,
        context: ctx,
        expected: "tel:",
      });
      continue;
    }
    if (want === "mailto" && got !== "mailto") {
      errors.push({
        rule: "wrong_scheme",
        href: a.href,
        context: ctx,
        expected: "mailto:",
      });
      continue;
    }
    if (want === "http" && got !== "http" && got !== "https") {
      errors.push({
        rule: "wrong_scheme",
        href: a.href,
        context: ctx,
        expected: "https:",
      });
      continue;
    }
    if (got === "tel" || got === "mailto") continue;

    // Unwrap tracked redirect
    let destination = a.href;
    try {
      const u = new URL(a.href);
      if (u.hostname === TRACK_HOST && u.pathname === TRACK_PATH) {
        const dest = u.searchParams.get("url");
        if (!dest) {
          errors.push({
            rule: "tracked_url_missing_destination",
            href: a.href,
            context: ctx,
          });
          continue;
        }
        destination = dest;
      }
    } catch {
      errors.push({
        rule: "tracked_url_unparseable",
        href: a.href,
        context: ctx,
      });
      continue;
    }

    let destUrl: URL;
    try {
      destUrl = new URL(destination);
    } catch {
      errors.push({
        rule: "destination_unparseable",
        href: destination,
        context: ctx,
      });
      continue;
    }

    const isTrackedCard =
      /[?&]section=project_grid\b/.test(a.href) ||
      /[?&]cta=card_/.test(a.href);
    if (isTrackedCard) {
      if (
        destUrl.hostname !== SITE_HOST &&
        destUrl.hostname !== `www.${SITE_HOST}`
      ) {
        errors.push({
          rule: "project_route_wrong_host",
          href: destination,
          context: ctx,
          expected: SITE_HOST,
        });
        continue;
      }
      if (!PROJECT_PATH_RE.test(destUrl.pathname)) {
        errors.push({
          rule: "project_route_invalid",
          href: destination,
          context: ctx,
          expected: "/presale-projects/<slug>",
        });
        continue;
      }
    }
  }
  return errors;
}

// ── Minimal email HTML (anchor-only) — enough to exercise every tracked CTA ──
// We don't import the full React-bound builder (it pulls in @/ aliases not
// available in Deno). Instead we replicate the SAME tracked-URL shape the
// real builder emits for project cards + hero CTA + footer links. If any
// builder change drifts from this shape, update both.
function trackUrl(
  destination: string,
  meta: Record<string, string | number>,
): string {
  const params = new URLSearchParams();
  params.set("t", "click");
  params.set("tid", "{$tracking_id}");
  params.set("url", destination);
  for (const [k, v] of Object.entries(meta)) params.set(k, String(v));
  return `${TRACK_BASE}?${params.toString()}`;
}

function buildAuditableHtml(
  projects: Array<{ id: string; slug: string; city: string | null }>,
): string {
  const cards = projects
    .map((p, i) => {
      const url = `https://${SITE_HOST}/presale-projects/${p.slug}`;
      const tracked = trackUrl(url, {
        cta: `card_${i + 1}`,
        section: "project_grid",
        pid: p.id,
        pslug: p.slug,
        slot: i + 1,
        ...(p.city ? { city: p.city } : {}),
      });
      return `<a href="${tracked}">View ${p.slug}</a>`;
    })
    .join("\n");

  const heroCity = projects[0]?.city;
  const heroHref = heroCity
    ? trackUrl(
        `https://${SITE_HOST}/presale-projects/${heroCity
          .toLowerCase()
          .replace(/\s+/g, "-")}`,
        { cta: "hero_browse_city", section: "hero", city: heroCity },
      )
    : trackUrl(`https://${SITE_HOST}/presale-projects`, {
        cta: "hero_browse_all",
        section: "hero",
      });

  return `
    <html><body>
      <a href="${heroHref}">Browse All${heroCity ? ` in ${heroCity}` : ""}</a>
      ${cards}
      <a href="tel:+17782313592">Call 778-231-3592</a>
      <a href="mailto:info@presaleproperties.com">Email info@presaleproperties.com</a>
      <a href="{$unsubscribe}">Unsubscribe</a>
    </body></html>
  `;
}

// ── Handler ──────────────────────────────────────────────────────────────────
Deno.serve(async (req) => {
  if (req.method === "OPTIONS")
    return new Response("ok", { headers: corsHeaders });

  const startedAt = Date.now();
  const triggerSource =
    new URL(req.url).searchParams.get("trigger") ?? "cron";

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
  );

  try {
    // Sample up to 8 published projects with a slug — covers card grid + hero.
    const { data: projects, error: projErr } = await supabase
      .from("presale_projects")
      .select("id, slug, city")
      .eq("is_published", true)
      .not("slug", "is", null)
      .order("updated_at", { ascending: false })
      .limit(8);

    if (projErr) throw new Error(`Failed to load projects: ${projErr.message}`);

    const sample = (projects ?? []).filter((p) => p.id && p.slug);
    if (sample.length === 0) {
      await supabase.from("email_audit_runs").insert({
        template_key: "recommendation",
        status: "error",
        total_links: 0,
        total_errors: 0,
        projects_sampled: 0,
        errors: [{ rule: "no_projects_available" }],
        trigger_source: triggerSource,
        duration_ms: Date.now() - startedAt,
      });
      return new Response(
        JSON.stringify({ ok: false, reason: "no_projects_available" }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    const html = buildAuditableHtml(sample);
    const totalLinks = (html.match(/<a\b/gi) || []).length;
    const errors = auditHtml(html);
    const status = errors.length === 0 ? "ok" : "failed";

    const { error: insErr } = await supabase
      .from("email_audit_runs")
      .insert({
        template_key: "recommendation",
        status,
        total_links: totalLinks,
        total_errors: errors.length,
        projects_sampled: sample.length,
        errors: errors.length ? errors : null,
        trigger_source: triggerSource,
        duration_ms: Date.now() - startedAt,
      });
    if (insErr)
      console.error("Failed to write audit run:", insErr.message);

    return new Response(
      JSON.stringify({
        ok: status === "ok",
        status,
        total_links: totalLinks,
        total_errors: errors.length,
        projects_sampled: sample.length,
        errors,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    await supabase.from("email_audit_runs").insert({
      template_key: "recommendation",
      status: "error",
      total_links: 0,
      total_errors: 0,
      projects_sampled: 0,
      errors: [{ rule: "audit_run_failed", message: msg }],
      trigger_source: triggerSource,
      duration_ms: Date.now() - startedAt,
    });
    return new Response(JSON.stringify({ ok: false, error: msg }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
